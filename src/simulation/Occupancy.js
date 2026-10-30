import {
  BuildingGraph,
  ZONE_TYPES,
  loadBuilding
} from './BuildingGraph.js';

export const OCCUPANCY_SCHEMA_VERSION = 1;
export const OCCUPANCY_MODEL_ID = 'zone-occupancy-v1';

export const OCCUPANCY_STATUSES = Object.freeze({
  OBSERVED: 'observed',
  ESTIMATED: 'estimated',
  UNAVAILABLE: 'unavailable'
});

export const OCCUPANCY_SOURCES = Object.freeze({
  AGENT_POSITIONS: 'simulation-agent-positions',
  AGGREGATE_ONLY: 'aggregate-only',
  NONE: 'none'
});

const AGGREGATE_COUNT_FIELDS = Object.freeze([
  'totalCount',
  'evacuatedCount',
  'inTransitCount',
  'assignedCount',
  'unassignedCount'
]);

const ZONE_PRIORITY = Object.freeze({
  [ZONE_TYPES.EXIT]: 0,
  [ZONE_TYPES.STAIRWELL]: 1,
  [ZONE_TYPES.FLOOR]: 2
});

const OCCUPANCY_STATUS_VALUES = Object.values(OCCUPANCY_STATUSES);
const AGENT_STATES = Object.freeze({
  IDLE: 'IDLE',
  EVACUATING: 'EVACUATING',
  SAFE: 'SAFE'
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidTimeSec(value) {
  return Number.isFinite(value) && value >= 0;
}

function resolveGraph(graph) {
  return graph instanceof BuildingGraph ? graph : loadBuilding(graph);
}

function requireTimeSec(value) {
  if (!isValidTimeSec(value)) {
    throw new Error('Occupancy timeSec must be a finite non-negative number');
  }
  return value;
}

function validateCount(value, path, errors) {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a finite non-negative integer`);
  }
}

function validateSource(value, path, required, errors) {
  if (required && !isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
    return;
  }

  if (value !== undefined && value !== null && !isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function validateObservation(building, observation, index, rootTimeSec, seenZoneIds, errors) {
  const path = `observations[${index}]`;

  if (!isObject(observation)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!isNonEmptyString(observation.zoneId)) {
    errors.push(`${path}.zoneId must be a non-empty string`);
  } else {
    const zone = building.getZone(observation.zoneId);
    if (!zone) {
      errors.push(`${path}.zoneId references unknown zone ${observation.zoneId}`);
    }
    if (seenZoneIds.has(observation.zoneId)) {
      errors.push(`${path}.zoneId duplicates ${observation.zoneId}`);
    }
    seenZoneIds.add(observation.zoneId);
  }

  if (!OCCUPANCY_STATUS_VALUES.includes(observation.status)) {
    errors.push(`${path}.status must be one of ${OCCUPANCY_STATUS_VALUES.join(', ')}`);
  } else if (observation.status === OCCUPANCY_STATUSES.UNAVAILABLE) {
    if (observation.count !== null) {
      errors.push(`${path}.count must be null when status is unavailable`);
    }
  } else {
    validateCount(observation.count, `${path}.count`, errors);
  }

  validateSource(
    observation.source,
    `${path}.source`,
    observation.status !== OCCUPANCY_STATUSES.UNAVAILABLE,
    errors
  );

  if (observation.timeSec !== undefined) {
    if (!isValidTimeSec(observation.timeSec)) {
      errors.push(`${path}.timeSec must be a finite non-negative number`);
    } else if (isValidTimeSec(rootTimeSec) && observation.timeSec !== rootTimeSec) {
      errors.push(`${path}.timeSec must match occupancy timeSec`);
    }
  }
}

function validateAggregate(aggregate, rootTimeSec, errors) {
  if (!isObject(aggregate)) {
    errors.push('aggregate must be an object');
    return;
  }

  if (!OCCUPANCY_STATUS_VALUES.includes(aggregate.status)) {
    errors.push(`aggregate.status must be one of ${OCCUPANCY_STATUS_VALUES.join(', ')}`);
  }

  validateSource(
    aggregate.source,
    'aggregate.source',
    aggregate.status !== OCCUPANCY_STATUSES.UNAVAILABLE,
    errors
  );

  AGGREGATE_COUNT_FIELDS.forEach((field) => {
    const value = aggregate[field];
    if (value !== undefined && value !== null) {
      validateCount(value, `aggregate.${field}`, errors);
    }
  });

  if (aggregate.status === OCCUPANCY_STATUSES.UNAVAILABLE) {
    AGGREGATE_COUNT_FIELDS.forEach((field) => {
      if (aggregate[field] !== undefined && aggregate[field] !== null) {
        errors.push(`aggregate.${field} must be null when status is unavailable`);
      }
    });
  }

  if (aggregate.timeSec !== undefined) {
    if (!isValidTimeSec(aggregate.timeSec)) {
      errors.push('aggregate.timeSec must be a finite non-negative number');
    } else if (isValidTimeSec(rootTimeSec) && aggregate.timeSec !== rootTimeSec) {
      errors.push('aggregate.timeSec must match occupancy timeSec');
    }
  }
}

function collectValidationErrors(building, raw) {
  const errors = [];

  if (!isObject(raw)) {
    return ['Zone occupancy must be an object'];
  }

  if (raw.schemaVersion !== OCCUPANCY_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${OCCUPANCY_SCHEMA_VERSION}`);
  }

  if (
    raw.buildingId !== undefined
    && raw.buildingId !== null
    && !isNonEmptyString(raw.buildingId)
  ) {
    errors.push('buildingId must be a non-empty string when provided');
  }

  if (!isValidTimeSec(raw.timeSec)) {
    errors.push('timeSec must be a finite non-negative number');
  }

  if (!Array.isArray(raw.observations)) {
    errors.push('observations must be an array');
  } else {
    const seenZoneIds = new Set();
    raw.observations.forEach((observation, index) => {
      validateObservation(building, observation, index, raw.timeSec, seenZoneIds, errors);
    });
  }

  if (raw.aggregate !== undefined) {
    validateAggregate(raw.aggregate, raw.timeSec, errors);
  }

  return errors;
}

function normalizeAggregate(aggregate, rootTimeSec) {
  if (!aggregate) {
    return {
      totalCount: null,
      evacuatedCount: null,
      inTransitCount: null,
      assignedCount: null,
      unassignedCount: null,
      status: OCCUPANCY_STATUSES.UNAVAILABLE,
      source: OCCUPANCY_SOURCES.NONE,
      timeSec: rootTimeSec
    };
  }

  return {
    totalCount: aggregate.totalCount ?? null,
    evacuatedCount: aggregate.evacuatedCount ?? null,
    inTransitCount: aggregate.inTransitCount ?? null,
    assignedCount: aggregate.assignedCount ?? null,
    unassignedCount: aggregate.unassignedCount ?? null,
    status: aggregate.status,
    source: aggregate.source ?? OCCUPANCY_SOURCES.NONE,
    timeSec: aggregate.timeSec ?? rootTimeSec
  };
}

export function validateZoneOccupancy(graph, raw) {
  let building;

  try {
    building = resolveGraph(graph);
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }

  const errors = collectValidationErrors(building, raw);
  return { valid: errors.length === 0, errors };
}

/**
 * Validate and normalize zone occupancy observations.
 *
 * A zone with `count: 0` is known empty. A zone with `count: null` and
 * `status: "unavailable"` is unknown. Missing zone records are explicitly
 * reported in `missingZoneIds` and remain unavailable; they are never filled
 * with invented counts. Every observation timestamp must match the root
 * `timeSec`.
 */
export function loadZoneOccupancy(graph, raw) {
  const building = resolveGraph(graph);
  const errors = collectValidationErrors(building, raw);

  if (errors.length > 0) {
    throw new Error(`Invalid zone occupancy: ${errors.join('; ')}`);
  }

  const observationsByZone = new Map();

  raw.observations.forEach((observation) => {
    observationsByZone.set(observation.zoneId, {
      zoneId: observation.zoneId,
      count: observation.status === OCCUPANCY_STATUSES.UNAVAILABLE
        ? null
        : observation.count,
      known: observation.status !== OCCUPANCY_STATUSES.UNAVAILABLE,
      status: observation.status,
      source: observation.source ?? OCCUPANCY_SOURCES.NONE,
      timeSec: observation.timeSec ?? raw.timeSec
    });
  });

  const zones = {};
  const missingZoneIds = [];

  [...building.data.zones]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((zone) => {
      const observation = observationsByZone.get(zone.id);

      if (observation) {
        zones[zone.id] = observation;
        return;
      }

      missingZoneIds.push(zone.id);
      zones[zone.id] = {
        zoneId: zone.id,
        count: null,
        known: false,
        status: OCCUPANCY_STATUSES.UNAVAILABLE,
        source: OCCUPANCY_SOURCES.NONE,
        timeSec: raw.timeSec
      };
    });

  return {
    schemaVersion: OCCUPANCY_SCHEMA_VERSION,
    modelId: OCCUPANCY_MODEL_ID,
    buildingId: raw.buildingId || building.data.id,
    timeSec: raw.timeSec,
    zones,
    missingZoneIds,
    aggregate: normalizeAggregate(raw.aggregate, raw.timeSec)
  };
}

function containsPoint(bounds, x, y, z) {
  return (
    x >= bounds.minX && x <= bounds.maxX
    && y >= bounds.minY && y <= bounds.maxY
    && z >= bounds.minZ && z <= bounds.maxZ
  );
}

function resolveAgentLocation(building, agent) {
  if (!isObject(agent)) {
    return { kind: 'unknown' };
  }

  if (agent.state === AGENT_STATES.SAFE) {
    return { kind: 'outside', evacuated: true };
  }

  if (agent.state !== AGENT_STATES.IDLE && agent.state !== AGENT_STATES.EVACUATING) {
    return { kind: 'unknown' };
  }

  if (
    !Number.isFinite(agent.x)
    || !Number.isFinite(agent.y)
    || !Number.isFinite(agent.z)
  ) {
    return { kind: 'unknown' };
  }

  const candidates = building.data.zones.filter((zone) => (
    containsPoint(zone.bounds, agent.x, agent.y, agent.z)
  ));

  if (candidates.length === 0) {
    return agent.state === AGENT_STATES.EVACUATING
      ? { kind: 'outside', evacuated: false }
      : { kind: 'unknown' };
  }

  const bestPriority = Math.min(
    ...candidates.map((zone) => ZONE_PRIORITY[zone.type] ?? Number.POSITIVE_INFINITY)
  );
  const bestCandidates = candidates.filter((zone) => (
    (ZONE_PRIORITY[zone.type] ?? Number.POSITIVE_INFINITY) === bestPriority
  ));

  if (bestCandidates.length !== 1) {
    return { kind: 'unknown' };
  }

  const zone = bestCandidates[0];

  if (
    agent.state === AGENT_STATES.IDLE
    && Number.isInteger(agent.floor)
    && zone.floor !== agent.floor
  ) {
    return { kind: 'unknown' };
  }

  return { kind: 'zone', zone };
}

function resolveAgentOptions(options) {
  if (!isObject(options)) {
    throw new Error('Occupancy options must be an object');
  }

  const timeSec = requireTimeSec(options.timeSec);
  const status = options.status ?? OCCUPANCY_STATUSES.ESTIMATED;

  if (status !== OCCUPANCY_STATUSES.OBSERVED && status !== OCCUPANCY_STATUSES.ESTIMATED) {
    throw new Error('Agent occupancy status must be observed or estimated');
  }

  const source = options.source ?? OCCUPANCY_SOURCES.AGENT_POSITIONS;

  if (!isNonEmptyString(source)) {
    throw new Error('Occupancy source must be a non-empty string');
  }

  return { timeSec, status, source };
}

/**
 * Map reliable per-agent simulation records to building zones.
 *
 * Agent records are simulation-derived, so the default status is `estimated`,
 * not `observed`. Zone membership comes from the agent's current 3D position:
 * exit zones take precedence over stairwell zones, which take precedence over
 * floor zones. The agent's original `floor` is never used for evacuating
 * agents, because stair descent changes their current height.
 *
 * If any agent has an unknown location, exact zone counts cannot be claimed;
 * all zone counts are then marked unavailable. Aggregate counts are still
 * preserved. If duplicate non-empty agent IDs are present, identity is
 * ambiguous, so zone and aggregate counts are marked unavailable rather than
 * double-counted. Agents marked SAFE are outside the building and are never
 * added to a zone. The input agents are not mutated.
 */
export function occupancyFromAgents(graph, agents, options = {}) {
  const building = resolveGraph(graph);

  if (!Array.isArray(agents)) {
    throw new Error('Agents must be an array');
  }

  const { timeSec, status, source } = resolveAgentOptions(options);
  const seenAgentIds = new Set();
  let duplicateAgentIdCount = 0;

  agents.forEach((agent) => {
    if (!isObject(agent) || !isNonEmptyString(agent.id)) return;

    if (seenAgentIds.has(agent.id)) {
      duplicateAgentIdCount += 1;
      return;
    }

    seenAgentIds.add(agent.id);
  });

  const countsByZone = new Map();
  let evacuatedCount = 0;
  let unknownCount = 0;
  let assignedCount = 0;

  agents.forEach((agent) => {
    const location = resolveAgentLocation(building, agent);

    if (location.kind === 'zone') {
      countsByZone.set(location.zone.id, (countsByZone.get(location.zone.id) || 0) + 1);
      assignedCount += 1;
      return;
    }

    if (location.kind === 'outside') {
      if (location.evacuated) evacuatedCount += 1;
      return;
    }

    unknownCount += 1;
  });

  const totalCount = agents.length;
  const countsUnavailable = unknownCount > 0 || duplicateAgentIdCount > 0;
  const observations = building.data.zones.map((zone) => {
    if (countsUnavailable) {
      return {
        zoneId: zone.id,
        count: null,
        status: OCCUPANCY_STATUSES.UNAVAILABLE,
        source: OCCUPANCY_SOURCES.NONE,
        timeSec
      };
    }

    return {
      zoneId: zone.id,
      count: countsByZone.get(zone.id) || 0,
      status,
      source,
      timeSec
    };
  });
  const aggregate = duplicateAgentIdCount > 0
    ? {
        totalCount: null,
        evacuatedCount: null,
        inTransitCount: null,
        assignedCount: null,
        unassignedCount: null,
        status: OCCUPANCY_STATUSES.UNAVAILABLE,
        source,
        timeSec
      }
    : {
        totalCount,
        evacuatedCount,
        inTransitCount: totalCount - evacuatedCount,
        assignedCount,
        unassignedCount: totalCount - assignedCount - evacuatedCount,
        status,
        source,
        timeSec
      };

  return loadZoneOccupancy(building, {
    schemaVersion: OCCUPANCY_SCHEMA_VERSION,
    buildingId: building.data.id,
    timeSec,
    observations,
    aggregate
  });
}

/**
 * Preserve aggregate-only crowd data without inventing a zone distribution.
 * All zone records remain unavailable while aggregate counts are retained.
 */
export function occupancyFromAggregate(graph, aggregate, options = {}) {
  const building = resolveGraph(graph);

  if (!isObject(aggregate)) {
    throw new Error('Aggregate occupancy must be an object');
  }

  if (!isObject(options)) {
    throw new Error('Occupancy options must be an object');
  }

  const timeSec = requireTimeSec(options.timeSec);
  const status = options.status
    ?? aggregate.status
    ?? OCCUPANCY_STATUSES.ESTIMATED;
  const source = options.source
    ?? aggregate.source
    ?? OCCUPANCY_SOURCES.AGGREGATE_ONLY;

  return loadZoneOccupancy(building, {
    schemaVersion: OCCUPANCY_SCHEMA_VERSION,
    buildingId: options.buildingId,
    timeSec,
    observations: [],
    aggregate: {
      ...aggregate,
      status,
      source,
      timeSec: aggregate.timeSec ?? timeSec
    }
  });
}
