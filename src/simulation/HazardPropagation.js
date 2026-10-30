import {
  BuildingGraph,
  CONNECTION_STATUSES,
  EXPOSURE_STATUSES,
  FIRE_STATUSES,
  HAZARD_SCHEMA_VERSION,
  RISK_STATUSES,
  SMOKE_STATUSES,
  loadBuilding
} from './BuildingGraph.js';

export const PROPAGATION_MODEL_ID = 'rule-based-v1';

// Prototype coarse model. Rates are configurable assumptions, not validated
// fire-engineering values. Fire and smoke use independent hop delays.
// Only open connections propagate. Closed connections block physically;
// restricted/unknown connections are treated conservatively: no propagation,
// and zones reachable only through them are reported as unknown.
export const DEFAULT_PROPAGATION_CONFIG = Object.freeze({
  fire: Object.freeze({
    spreadDelaySec: 30,
    intensityLossPerHop: 0.15,
    minimumIntensity: 0.05,
    roomSpreadSec: 0
  }),
  smoke: Object.freeze({
    sourceDelaySec: 10,
    spreadDelaySec: 15,
    initialDensity: 0.05,
    risePerSec: 0.02,
    maxDensity: 1
  })
});

const CONFIG_FIELDS = Object.freeze({
  fire: Object.freeze({
    spreadDelaySec: { min: 0 },
    intensityLossPerHop: { min: 0 },
    minimumIntensity: { min: 0 },
    roomSpreadSec: { min: 0 }
  }),
  smoke: Object.freeze({
    sourceDelaySec: { min: 0 },
    spreadDelaySec: { min: 0 },
    initialDensity: { min: 0 },
    risePerSec: { min: 0 },
    maxDensity: { min: 0, exclusive: true }
  })
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveGraph(graph) {
  return graph instanceof BuildingGraph ? graph : loadBuilding(graph);
}

function validateState(state) {
  if (!isObject(state)) {
    throw new Error('Hazard state must be an object');
  }
  if (state.schemaVersion !== HAZARD_SCHEMA_VERSION) {
    throw new Error(`Hazard state schemaVersion must be ${HAZARD_SCHEMA_VERSION}`);
  }
  if (!Number.isFinite(state.timeSec) || state.timeSec < 0) {
    throw new Error('Hazard state timeSec must be a finite non-negative number');
  }
  if (!isObject(state.zones)) {
    throw new Error('Hazard state zones must be an object');
  }
  if (!isObject(state.connections)) {
    throw new Error('Hazard state connections must be an object');
  }
}

function validateDt(dt) {
  if (!Number.isFinite(dt) || dt <= 0) {
    throw new Error('dt must be a finite positive number');
  }
}

function resolveConfig(overrides = {}) {
  if (!isObject(overrides)) {
    throw new Error('Propagation config must be an object');
  }

  const config = {
    fire: { ...DEFAULT_PROPAGATION_CONFIG.fire, ...(overrides.fire || {}) },
    smoke: { ...DEFAULT_PROPAGATION_CONFIG.smoke, ...(overrides.smoke || {}) }
  };

  Object.entries(CONFIG_FIELDS).forEach(([section, fields]) => {
    if (!isObject(overrides[section]) && overrides[section] !== undefined) {
      throw new Error(`Propagation config ${section} must be an object`);
    }

    Object.entries(fields).forEach(([field, rule]) => {
      const value = config[section][field];
      if (!Number.isFinite(value) || value < rule.min || (rule.exclusive && value === rule.min)) {
        const qualifier = rule.exclusive ? 'greater than' : 'at least';
        throw new Error(`Propagation config ${section}.${field} must be ${qualifier} ${rule.min}`);
      }
    });
  });

  return config;
}

function createAdjacency(building, isTraversable) {
  const adjacency = new Map(building.data.zones.map((zone) => [zone.id, []]));

  [...building.data.connections]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((connection) => {
      if (!isTraversable(connection)) return;
      adjacency.get(connection.a).push(connection.b);
      adjacency.get(connection.b).push(connection.a);
    });

  adjacency.forEach((neighbors) => neighbors.sort());

  return adjacency;
}

function computeHopDistances(adjacency, sourceId) {
  const distances = new Map([[sourceId, 0]]);
  const queue = [sourceId];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const nextDistance = distances.get(current) + 1;

    adjacency.get(current).forEach((neighbor) => {
      if (distances.has(neighbor)) return;
      distances.set(neighbor, nextDistance);
      queue.push(neighbor);
    });
  }

  return distances;
}

function getConfiguredSources(state, building) {
  const sources = [];
  const zoneIds = new Set(building.data.zones.map((zone) => zone.id));

  Object.keys(state.zones)
    .sort()
    .forEach((zoneId) => {
      if (!zoneIds.has(zoneId)) {
        throw new Error(`Hazard state references unknown zone: ${zoneId}`);
      }

      const fire = state.zones[zoneId].fire;
      if (!fire || fire.source !== 'scenario') return;

      if (!Number.isFinite(fire.startSec) || fire.startSec < 0) {
        throw new Error(`Configured fire source ${zoneId} must have a finite non-negative startSec`);
      }
      if (!Number.isFinite(fire.intensity) || fire.intensity <= 0 || fire.intensity > 1) {
        throw new Error(`Configured fire source ${zoneId} must have intensity greater than 0 and at most 1`);
      }

      sources.push({
        zoneId,
        startSec: fire.startSec,
        intensity: fire.intensity,
        sourceType: 'scenario'
      });
    });

  Object.keys(state.zones)
    .sort()
    .forEach((zoneId) => {
      const fire = state.zones[zoneId]?.fire;
      if (!fire || fire.source !== 'interactive') return;

      if (!Number.isFinite(fire.startSec) || fire.startSec < 0) {
        throw new Error(`Interactive fire source ${zoneId} must have a finite non-negative startSec`);
      }
      if (!Number.isFinite(fire.intensity) || fire.intensity <= 0 || fire.intensity > 1) {
        throw new Error(`Interactive fire source ${zoneId} must have intensity greater than 0 and at most 1`);
      }

      sources.push({
        zoneId,
        startSec: fire.startSec,
        intensity: fire.intensity,
        sourceType: 'interactive',
        originRoom: fire.originRoom,
        seedIntensity: fire.seedIntensity,
        roomSpreadSec: fire.roomSpreadSec ?? 0
      });
    });

  return sources;
}

function chooseHigher(current, candidate, valueKey, timeSec) {
  if (!current) return candidate;

  const currentActive = timeSec >= current.arrivalSec;
  const candidateActive = timeSec >= candidate.arrivalSec;

  if (currentActive !== candidateActive) {
    return candidateActive ? candidate : current;
  }

  if (!currentActive) {
    if (candidate.arrivalSec < current.arrivalSec) return candidate;
    if (candidate.arrivalSec > current.arrivalSec) return current;
  }

  const currentValue = current[valueKey];
  const candidateValue = candidate[valueKey];

  if (candidateValue > currentValue) return candidate;
  if (candidateValue < currentValue) return current;
  if (candidate.arrivalSec < current.arrivalSec) return candidate;
  if (candidate.arrivalSec > current.arrivalSec) return current;
  return candidate.sourceZoneId.localeCompare(current.sourceZoneId) < 0 ? candidate : current;
}

function chooseFireContribution(current, candidate, timeSec) {
  const chosen = chooseHigher(current, candidate, 'intensity', timeSec);

  if (timeSec >= current.arrivalSec && timeSec >= candidate.arrivalSec) {
    return {
      ...chosen,
      arrivalSec: Math.min(current.arrivalSec, candidate.arrivalSec)
    };
  }

  return chosen;
}

function computeFireContributions(sources, adjacency, sourceZoneIds, config, timeSec) {
  const contributions = new Map();

  sources.forEach((source) => {
    const distances = computeHopDistances(adjacency, source.zoneId);

    distances.forEach((hops, zoneId) => {
      if (hops === 0 || sourceZoneIds.has(zoneId)) return;

      const intensity = source.intensity - hops * config.fire.intensityLossPerHop;
      if (intensity < config.fire.minimumIntensity) return;

      const contribution = {
        intensity,
        arrivalSec: source.startSec + hops * config.fire.spreadDelaySec,
        sourceZoneId: source.zoneId
      };

      const current = contributions.get(zoneId);
      contributions.set(
        zoneId,
        current
          ? chooseFireContribution(current, contribution, timeSec)
          : contribution
      );
    });
  });

  return contributions;
}

function computePotentialFireZones(sources, adjacency, sourceZoneIds, config) {
  const potential = new Set();

  sources.forEach((source) => {
    const distances = computeHopDistances(adjacency, source.zoneId);

    distances.forEach((hops, zoneId) => {
      if (hops === 0 || sourceZoneIds.has(zoneId)) return;
      if (source.intensity - hops * config.fire.intensityLossPerHop >= config.fire.minimumIntensity) {
        potential.add(zoneId);
      }
    });
  });

  return potential;
}

function computeSmokeContributions(sources, adjacency, config, timeSec) {
  const contributions = new Map();

  sources.forEach((source) => {
    const distances = computeHopDistances(adjacency, source.zoneId);

    distances.forEach((hops, zoneId) => {
      const arrivalSec = source.startSec
        + config.smoke.sourceDelaySec
        + hops * config.smoke.spreadDelaySec;

      if (timeSec < arrivalSec) return;

      const density = Math.min(
        config.smoke.maxDensity,
        config.smoke.initialDensity + config.smoke.risePerSec * (timeSec - arrivalSec)
      );

      const contribution = {
        density,
        arrivalSec,
        sourceZoneId: source.zoneId
      };

      contributions.set(
        zoneId,
        chooseHigher(contributions.get(zoneId), contribution, 'density', timeSec)
      );
    });
  });

  return contributions;
}

function buildFireState(currentFire, source, contribution, potential, timeSec) {
  if (source) {
    const active = timeSec >= source.startSec;

    return {
      status: active ? FIRE_STATUSES.ACTIVE : FIRE_STATUSES.PENDING,
      intensity: source.intensity,
      sinceSec: active ? source.startSec : null,
      startSec: source.startSec,
      source: 'scenario'
    };
  }

  if (contribution) {
    const active = timeSec >= contribution.arrivalSec;

    return {
      status: active ? FIRE_STATUSES.ACTIVE : FIRE_STATUSES.PENDING,
      intensity: contribution.intensity,
      sinceSec: active ? contribution.arrivalSec : null,
      startSec: contribution.arrivalSec,
      source: 'propagated'
    };
  }

  const status = potential || (currentFire && currentFire.status === FIRE_STATUSES.UNKNOWN)
    ? FIRE_STATUSES.UNKNOWN
    : FIRE_STATUSES.NONE;

  return {
    status,
    intensity: null,
    sinceSec: null,
    startSec: null,
    source: null
  };
}

function buildSmokeState(contribution) {
  if (!contribution) {
    return {
      status: SMOKE_STATUSES.UNKNOWN,
      density: null
    };
  }

  return {
    status: SMOKE_STATUSES.ACTIVE,
    density: contribution.density
  };
}

/**
 * Advance hazard state analytically. All timings are in seconds.
 *
 * Fire: a configured source ignites at startSec. A zone h open hops away
 * ignites at startSec + h * fire.spreadDelaySec with intensity
 * source.intensity - h * fire.intensityLossPerHop, provided intensity remains
 * at least fire.minimumIntensity. Configured source zones always keep scenario
 * metadata and their own startSec, even when another source's path passes
 * through them. When several paths reach a non-source zone, the earliest
 * ignition time is retained and the highest active intensity is reported.
 *
 * Smoke: a source begins emitting after smoke.sourceDelaySec, reaching a zone h
 * open hops away at startSec + sourceDelaySec + h * smoke.spreadDelaySec.
 * Density is min(maxDensity, initialDensity + risePerSec * elapsed since onset).
 *
 * Only open connections propagate. Closed connections block physically.
 * Restricted and unknown connections also block propagation, but zones that
 * are reachable only through them are reported as unknown rather than safe.
 *
 * The function is pure: it does not mutate state, graph, or scenario data.
 */
export function advanceHazardState(state, graph, dt, configOverrides = {}) {
  validateState(state);
  validateDt(dt);

  const building = resolveGraph(graph);
  const config = resolveConfig(configOverrides);
  const nextTimeSec = state.timeSec + dt;
  const sources = getConfiguredSources(state, building);
  const sourceByZone = new Map(sources.map((source) => [source.zoneId, source]));
  const sourceZoneIds = new Set(sourceByZone.keys());
  const openAdjacency = createAdjacency(
    building,
    (connection) => connection.status === CONNECTION_STATUSES.OPEN
  );
  const notClosedAdjacency = createAdjacency(
    building,
    (connection) => connection.status !== CONNECTION_STATUSES.CLOSED
  );
  const fireContributions = computeFireContributions(
    sources,
    openAdjacency,
    sourceZoneIds,
    config,
    nextTimeSec
  );
  const potentialFireZones = computePotentialFireZones(
    sources,
    notClosedAdjacency,
    sourceZoneIds,
    config
  );
  const smokeContributions = computeSmokeContributions(sources, openAdjacency, config, nextTimeSec);

  const interactiveSources = sources.filter(s => s.sourceType === 'interactive');
  const scenarioSources = sources.filter(s => s.sourceType === 'scenario');
  const scenarioSourceByZone = new Map(scenarioSources.map(s => [s.zoneId, s]));

  const next = structuredClone(state);
  const zones = {};

  [...building.data.zones]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((zone) => {
      const current = next.zones[zone.id] || {};
      const currentFire = current.fire || null;

      const scenarioSource = scenarioSourceByZone.get(zone.id);
      const interactiveSource = interactiveSources.find(s => s.zoneId === zone.id);

      let fireState;
      if (scenarioSource) {
        fireState = buildFireState(
          currentFire,
          scenarioSource,
          fireContributions.get(zone.id) || null,
          potentialFireZones.has(zone.id),
          nextTimeSec
        );
      } else if (interactiveSource) {
        const roomSpreadElapsed = nextTimeSec - interactiveSource.startSec;
        const floorActive = roomSpreadElapsed >= (interactiveSource.roomSpreadSec ?? 0);

        if (floorActive) {
          const contribution = fireContributions.get(zone.id);
          fireState = buildFireState(
            currentFire,
            { ...interactiveSource, intensity: interactiveSource.seedIntensity ?? interactiveSource.intensity },
            contribution,
            potentialFireZones.has(zone.id),
            nextTimeSec
          );
          fireState.source = 'interactive';
        } else {
          fireState = {
            ...currentFire,
            status: FIRE_STATUSES.PENDING,
            intensity: interactiveSource.seedIntensity ?? interactiveSource.intensity,
            sinceSec: null,
            startSec: interactiveSource.startSec,
            source: 'interactive',
            originRoom: interactiveSource.originRoom,
            seedIntensity: interactiveSource.seedIntensity,
            roomSpreadSec: interactiveSource.roomSpreadSec
          };
        }
      } else {
        fireState = buildFireState(
          currentFire,
          null,
          fireContributions.get(zone.id) || null,
          potentialFireZones.has(zone.id),
          nextTimeSec
        );
      }

      zones[zone.id] = {
        ...current,
        zoneId: zone.id,
        fire: fireState,
        smoke: buildSmokeState(smokeContributions.get(zone.id) || null),
        risk: current.risk || {
          status: RISK_STATUSES.UNASSESSED,
          score: null,
          level: null
        },
        exposure: current.exposure || {
          status: EXPOSURE_STATUSES.UNKNOWN,
          occupantCount: null,
          personSeconds: null
        }
      };
    });

  next.zones = zones;
  next.timeSec = nextTimeSec;
  next.modelId = PROPAGATION_MODEL_ID;

  return next;
}

function roomIdToFloorZone(roomId) {
  const match = roomId.match(/^f(\d+)_/);
  if (!match) return null;
  return `L${match[1]}`;
}

export function injectFireSource(hazardState, roomId, intensity, options = {}) {
  const floorZone = roomIdToFloorZone(roomId);
  if (!floorZone) {
    throw new Error(`Invalid roomId format: ${roomId}`);
  }

  const next = structuredClone(hazardState);
  const zoneState = next.zones[floorZone] || {};

  next.zones[floorZone] = {
    ...zoneState,
    fire: {
      status: FIRE_STATUSES.PENDING,
      intensity,
      sinceSec: null,
      startSec: next.timeSec,
      source: 'interactive',
      originRoom: roomId,
      originRoomCenterX: options.originRoomCenterX ?? 0,
      originRoomCenterZ: options.originRoomCenterZ ?? 0,
      seedIntensity: options.seedIntensity ?? intensity,
      roomSpreadSec: options.roomSpreadSec ?? 0
    }
  };

  return next;
}

export function createHazardState(graph, options = {}) {
  const building = graph instanceof BuildingGraph ? graph : loadBuilding(graph);
  const zones = {};
  const connections = {};

  building.data.zones.forEach((zone) => {
    zones[zone.id] = {
      fire: { status: FIRE_STATUSES.NONE, intensity: null },
      smoke: { status: SMOKE_STATUSES.UNKNOWN, density: null },
      risk: { status: RISK_STATUSES.UNASSESSED, score: null, level: null },
      exposure: { status: EXPOSURE_STATUSES.UNKNOWN, occupantCount: null, personSeconds: null }
    };
  });

  building.data.connections.forEach((connection) => {
    connections[connection.id] = {
      connectionId: connection.id,
      routeStatus: 'unknown'
    };
  });

  return {
    schemaVersion: HAZARD_SCHEMA_VERSION,
    buildingId: building.data.id,
    scenarioId: options.scenarioId || 'interactive',
    timeSec: options.timeSec ?? 0,
    modelId: PROPAGATION_MODEL_ID,
    zones,
    connections
  };
}
