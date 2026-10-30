import {
  BuildingGraph,
  FIRE_STATUSES,
  HAZARD_SCHEMA_VERSION,
  SMOKE_STATUSES,
  loadBuilding
} from './BuildingGraph.js';
import {
  OCCUPANCY_MODEL_ID,
  OCCUPANCY_SCHEMA_VERSION,
  OCCUPANCY_SOURCES,
  OCCUPANCY_STATUSES,
  loadZoneOccupancy
} from './Occupancy.js';

export const EXPOSURE_MODEL_ID = 'zone-exposure-v1';

export const EXPOSURE_ASSESSMENT_STATUSES = Object.freeze({
  ESTIMATED: 'estimated',
  PARTIAL: 'partial',
  UNKNOWN: 'unknown'
});

export const EXPOSURE_LIMITATIONS = Object.freeze([
  'Zone occupancy records are snapshots, not identified people or trajectories.',
  'Endpoint-consistent intervals assume the observed count and hazard condition persist between samples.',
  'Count-change person-second ranges use only observed endpoints and do not bound unobserved intermediate occupancy changes.',
  'Aggregate occupancy is not used to infer or reconcile zone-level counts.',
  'Duplicate agent identities make occupancy counts unavailable until resolved; they are not silently treated as distinct occupants.',
  'No smoke concentration unit, physiological dose, injury probability, or safe-person label is computed.',
  'A zero or unavailable exposure estimate is not evidence that a person is safe.'
]);

const FIRE_STATUS_VALUES = Object.values(FIRE_STATUSES);
const SMOKE_STATUS_VALUES = Object.values(SMOKE_STATUSES);

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

function isLoadedOccupancy(value) {
  return isObject(value)
    && value.modelId === OCCUPANCY_MODEL_ID
    && value.schemaVersion === OCCUPANCY_SCHEMA_VERSION
    && isObject(value.zones);
}

function normalizeOccupancy(graph, value) {
  if (!isLoadedOccupancy(value)) {
    return loadZoneOccupancy(graph, value);
  }

  const observations = Object.keys(value.zones).map((zoneId) => {
    const zone = value.zones[zoneId];
    return {
      zoneId,
      count: zone.count,
      status: zone.status,
      source: zone.source,
      timeSec: zone.timeSec
    };
  });

  return loadZoneOccupancy(graph, {
    schemaVersion: value.schemaVersion,
    buildingId: value.buildingId,
    timeSec: value.timeSec,
    observations,
    aggregate: value.aggregate
  });
}

function validateHazardComponent(zoneId, component, labels, statuses, errors) {
  if (component === undefined || component === null) return;

  if (!isObject(component)) {
    errors.push(`Hazard state zone ${zoneId} ${labels.name} must be an object`);
    return;
  }

  if (!statuses.includes(component.status)) {
    errors.push(`Invalid hazard state ${labels.name}.status for zone ${zoneId}`);
    return;
  }

  if (
    labels.name === 'fire'
    && (component.status === FIRE_STATUSES.PENDING || component.status === FIRE_STATUSES.ACTIVE)
  ) {
    if (!Number.isFinite(component.intensity) || component.intensity < 0 || component.intensity > 1) {
      errors.push(`Invalid hazard state fire.intensity for zone ${zoneId}`);
    }
  }

  if (labels.name === 'smoke' && component.status === SMOKE_STATUSES.ACTIVE) {
    if (!Number.isFinite(component.density) || component.density < 0) {
      errors.push(`Invalid hazard state smoke.density for zone ${zoneId}`);
    }
  }
}

function validateHazardState(state, building) {
  const errors = [];

  if (!isObject(state)) {
    throw new Error('Hazard state must be an object');
  }
  if (state.schemaVersion !== HAZARD_SCHEMA_VERSION) {
    throw new Error(`Hazard state schemaVersion must be ${HAZARD_SCHEMA_VERSION}`);
  }
  if (!isValidTimeSec(state.timeSec)) {
    throw new Error('Hazard state timeSec must be a finite non-negative number');
  }
  if (
    state.buildingId !== undefined
    && state.buildingId !== null
    && !isNonEmptyString(state.buildingId)
  ) {
    throw new Error('Hazard state buildingId must be a non-empty string when provided');
  }
  if (!isObject(state.zones)) {
    throw new Error('Hazard state zones must be an object');
  }

  Object.keys(state.zones).forEach((zoneId) => {
    if (!building.getZone(zoneId)) {
      throw new Error(`Hazard state references unknown zone: ${zoneId}`);
    }

    const zone = state.zones[zoneId];
    if (!isObject(zone)) {
      errors.push(`Hazard state zone ${zoneId} must be an object`);
      return;
    }

    validateHazardComponent(zoneId, zone.fire, { name: 'fire' }, FIRE_STATUS_VALUES, errors);
    validateHazardComponent(zoneId, zone.smoke, { name: 'smoke' }, SMOKE_STATUS_VALUES, errors);
  });

  if (errors.length > 0) {
    throw new Error(`Invalid hazard state: ${errors.join('; ')}`);
  }

  return state;
}

function normalizeSample(graph, building, sample, index) {
  if (!isObject(sample)) {
    throw new Error(`Exposure sample ${index} must be an object`);
  }
  if (sample.occupancy === undefined) {
    throw new Error(`Exposure sample ${index} occupancy is required`);
  }
  if (sample.hazard === undefined) {
    throw new Error(`Exposure sample ${index} hazard is required`);
  }

  const occupancy = normalizeOccupancy(graph, sample.occupancy);
  const hazard = validateHazardState(sample.hazard, building);
  const reasons = [];

  if (occupancy.timeSec !== hazard.timeSec) {
    reasons.push(
      `sample ${index} occupancy timeSec ${occupancy.timeSec} does not match hazard timeSec ${hazard.timeSec}`
    );
  }

  if (
    isNonEmptyString(occupancy.buildingId)
    && isNonEmptyString(hazard.buildingId)
    && occupancy.buildingId !== hazard.buildingId
  ) {
    reasons.push(
      `sample ${index} occupancy buildingId ${occupancy.buildingId} does not match hazard buildingId ${hazard.buildingId}`
    );
  }

  return {
    index,
    occupancy,
    hazard,
    aligned: reasons.length === 0,
    reasons
  };
}

function readOccupancy(occupancy, zoneId) {
  const record = occupancy.zones[zoneId];

  if (
    !record
    || record.known !== true
    || !Number.isInteger(record.count)
    || record.count < 0
  ) {
    return {
      known: false,
      count: null,
      status: record ? record.status : OCCUPANCY_STATUSES.UNAVAILABLE,
      source: record ? record.source : OCCUPANCY_SOURCES.NONE
    };
  }

  return {
    known: true,
    count: record.count,
    status: record.status,
    source: record.source || OCCUPANCY_SOURCES.NONE
  };
}

function readFire(hazard, zoneId) {
  const zone = hazard.zones[zoneId];
  const fire = zone && isObject(zone.fire) ? zone.fire : null;

  if (!fire || !FIRE_STATUS_VALUES.includes(fire.status) || fire.status === FIRE_STATUSES.UNKNOWN) {
    return {
      known: false,
      active: null,
      status: fire ? fire.status : null,
      source: fire ? fire.source || null : null,
      intensity: null
    };
  }

  return {
    known: true,
    active: fire.status === FIRE_STATUSES.ACTIVE,
    status: fire.status,
    source: fire.source || null,
    intensity: Number.isFinite(fire.intensity) ? fire.intensity : null
  };
}

function readSmoke(hazard, zoneId) {
  const zone = hazard.zones[zoneId];
  const smoke = zone && isObject(zone.smoke) ? zone.smoke : null;

  if (
    !smoke
    || !SMOKE_STATUS_VALUES.includes(smoke.status)
    || smoke.status === SMOKE_STATUSES.UNKNOWN
  ) {
    return {
      known: false,
      active: null,
      status: smoke ? smoke.status : null,
      density: null
    };
  }

  return {
    known: true,
    active: smoke.status === SMOKE_STATUSES.ACTIVE,
    status: smoke.status,
    density: Number.isFinite(smoke.density) ? smoke.density : null
  };
}

function classifyComponent({
  intervalCount,
  knownIntervals,
  transitionIntervals,
  unknownIntervals,
  occupancyUnknownIntervals,
  activeOccupancyUnknownIntervals,
  activeCountChangeIntervals
}) {
  if (intervalCount === 0 || (knownIntervals === 0 && transitionIntervals === 0)) {
    return EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN;
  }

  if (
    unknownIntervals > 0
    || transitionIntervals > 0
    || occupancyUnknownIntervals > 0
    || activeOccupancyUnknownIntervals > 0
    || activeCountChangeIntervals > 0
  ) {
    return EXPOSURE_ASSESSMENT_STATUSES.PARTIAL;
  }

  return EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED;
}

function classifyZone(fireStatus, smokeStatus) {
  if (
    fireStatus === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED
    && smokeStatus === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED
  ) {
    return EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED;
  }

  if (
    fireStatus === EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN
    && smokeStatus === EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN
  ) {
    return EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN;
  }

  return EXPOSURE_ASSESSMENT_STATUSES.PARTIAL;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(isNonEmptyString))].sort();
}

function createComponentAccumulator() {
  return {
    exposureSeconds: 0,
    knownNonexposureSeconds: 0,
    unknownSeconds: 0,
    knownIntervals: 0,
    transitionIntervals: 0,
    unknownIntervals: 0,
    activeOccupancyUnknownIntervals: 0,
    activeCountChangeIntervals: 0,
    personSecondsMin: 0,
    personSecondsMax: 0,
    hasActiveOccupancy: false,
    maxObservedIntensity: null,
    maxObservedDensity: null
  };
}

function accumulateComponent(accumulator, previous, current, dt, previousOccupancy, currentOccupancy) {
  const occupancyKnown = previousOccupancy.known && currentOccupancy.known;

  if (!previous.known || !current.known) {
    accumulator.unknownIntervals += 1;
    accumulator.unknownSeconds += dt;
    return;
  }

  if (previous.active !== current.active) {
    accumulator.transitionIntervals += 1;
    accumulator.unknownIntervals += 1;
    accumulator.unknownSeconds += dt;
    return;
  }

  accumulator.knownIntervals += 1;

  if (!previous.active) {
    accumulator.knownNonexposureSeconds += dt;
    return;
  }

  accumulator.exposureSeconds += dt;

  if (!occupancyKnown) {
    accumulator.activeOccupancyUnknownIntervals += 1;
    return;
  }

  const minCount = Math.min(previousOccupancy.count, currentOccupancy.count);
  const maxCount = Math.max(previousOccupancy.count, currentOccupancy.count);

  accumulator.hasActiveOccupancy = true;
  accumulator.personSecondsMin += minCount * dt;
  accumulator.personSecondsMax += maxCount * dt;

  if (minCount !== maxCount) {
    accumulator.activeCountChangeIntervals += 1;
  }
}

function finalizeComponent(accumulator, intervalCount, occupancyUnknownIntervals, extra) {
  const status = classifyComponent({
    intervalCount,
    knownIntervals: accumulator.knownIntervals,
    transitionIntervals: accumulator.transitionIntervals,
    unknownIntervals: accumulator.unknownIntervals,
    occupancyUnknownIntervals,
    activeOccupancyUnknownIntervals: accumulator.activeOccupancyUnknownIntervals,
    activeCountChangeIntervals: accumulator.activeCountChangeIntervals
  });
  const hasKnownActive = accumulator.hasActiveOccupancy;
  const hasKnownHazard = accumulator.knownIntervals > 0 || accumulator.transitionIntervals > 0;
  const hasUnresolvedExposure = accumulator.unknownIntervals > 0
    || accumulator.activeOccupancyUnknownIntervals > 0;
  const hasExposureBounds = !hasUnresolvedExposure
    && (hasKnownActive || status === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  const personSeconds = status === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED
    ? accumulator.personSecondsMin
    : null;

  return {
    status,
    exposureSeconds: hasKnownHazard ? accumulator.exposureSeconds : null,
    knownNonexposureSeconds: hasKnownHazard ? accumulator.knownNonexposureSeconds : null,
    unknownSeconds: accumulator.unknownSeconds,
    personSeconds,
    personSecondsMin: hasExposureBounds ? accumulator.personSecondsMin : null,
    personSecondsMax: hasExposureBounds ? accumulator.personSecondsMax : null,
    maxObservedIntensity: accumulator.maxObservedIntensity,
    maxObservedDensity: accumulator.maxObservedDensity,
    sources: uniqueSorted(extra.sources)
  };
}

function createUnknownZone(zoneId, sampleIndices) {
  const unknownComponent = {
    status: EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN,
    exposureSeconds: null,
    knownNonexposureSeconds: null,
    unknownSeconds: null,
    personSeconds: null,
    personSecondsMin: null,
    personSecondsMax: null,
    maxObservedIntensity: null,
    maxObservedDensity: null,
    sources: []
  };

  return {
    zoneId,
    status: EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN,
    complete: false,
    occupancy: {
      initialCount: null,
      finalCount: null,
      countChanged: false,
      knownEndpoints: 0,
      totalEndpoints: sampleIndices.length,
      sources: []
    },
    fire: { ...unknownComponent },
    smoke: { ...unknownComponent },
    provenance: {
      sampleIndices,
      observationTimesSec: [],
      occupancySources: [],
      fireSources: []
    }
  };
}

function computeZone(zone, samples, intervalCount) {
  const occupancyRecords = samples.map((sample) => readOccupancy(sample.occupancy, zone.id));
  const fireRecords = samples.map((sample) => readFire(sample.hazard, zone.id));
  const smokeRecords = samples.map((sample) => readSmoke(sample.hazard, zone.id));
  const sampleIndices = samples.map((sample) => sample.index);
  const observationTimesSec = samples.map((sample) => sample.occupancy.timeSec);
  const occupancySources = new Set();
  const fireSources = new Set();
  const knownCounts = [];

  occupancyRecords.forEach((record) => {
    if (record.known) {
      knownCounts.push(record.count);
    }
    if (
      isNonEmptyString(record.source)
      && record.source !== OCCUPANCY_SOURCES.NONE
    ) {
      occupancySources.add(record.source);
    }
  });

  fireRecords.forEach((record) => {
    if (isNonEmptyString(record.source)) fireSources.add(record.source);
  });

  const fire = createComponentAccumulator();
  const smoke = createComponentAccumulator();
  let occupancyUnknownIntervals = 0;

  fireRecords.forEach((record) => {
    if (record.known && record.status !== FIRE_STATUSES.NONE && record.intensity !== null) {
      fire.maxObservedIntensity = Math.max(fire.maxObservedIntensity ?? 0, record.intensity);
    }
  });

  smokeRecords.forEach((record) => {
    if (record.known && record.active && record.density !== null) {
      smoke.maxObservedDensity = Math.max(smoke.maxObservedDensity ?? 0, record.density);
    }
  });

  for (let index = 1; index < samples.length; index += 1) {
    const dt = samples[index].occupancy.timeSec - samples[index - 1].occupancy.timeSec;
    if (dt <= 0) continue;

    const previousOccupancy = occupancyRecords[index - 1];
    const currentOccupancy = occupancyRecords[index];

    if (!(previousOccupancy.known && currentOccupancy.known)) {
      occupancyUnknownIntervals += 1;
    }

    accumulateComponent(
      fire,
      fireRecords[index - 1],
      fireRecords[index],
      dt,
      previousOccupancy,
      currentOccupancy
    );
    accumulateComponent(
      smoke,
      smokeRecords[index - 1],
      smokeRecords[index],
      dt,
      previousOccupancy,
      currentOccupancy
    );
  }

  const fireResult = finalizeComponent(fire, intervalCount, occupancyUnknownIntervals, {
    sources: [...fireSources]
  });
  const smokeResult = finalizeComponent(smoke, intervalCount, occupancyUnknownIntervals, {
    sources: []
  });
  const status = classifyZone(fireResult.status, smokeResult.status);
  const countChanged = knownCounts.some((count) => count !== knownCounts[0]);

  return {
    zoneId: zone.id,
    status,
    complete: status === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED,
    occupancy: {
      initialCount: occupancyRecords.length > 0 ? occupancyRecords[0].count : null,
      finalCount: occupancyRecords.length > 0
        ? occupancyRecords[occupancyRecords.length - 1].count
        : null,
      countChanged,
      knownEndpoints: knownCounts.length,
      totalEndpoints: occupancyRecords.length,
      sources: uniqueSorted([...occupancySources])
    },
    fire: fireResult,
    smoke: smokeResult,
    provenance: {
      sampleIndices,
      observationTimesSec,
      occupancySources: uniqueSorted([...occupancySources]),
      fireSources: uniqueSorted([...fireSources])
    }
  };
}

function summarizeZones(zones) {
  const summary = {
    zoneCount: 0,
    estimatedCount: 0,
    partialCount: 0,
    unknownCount: 0
  };

  Object.values(zones).forEach((zone) => {
    summary.zoneCount += 1;
    if (zone.status === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED) summary.estimatedCount += 1;
    if (zone.status === EXPOSURE_ASSESSMENT_STATUSES.PARTIAL) summary.partialCount += 1;
    if (zone.status === EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN) summary.unknownCount += 1;
  });

  return summary;
}

function buildAggregate(zones, intervalCount, durationSec, duplicateTimeSamples) {
  const zoneList = Object.values(zones);
  const complete = intervalCount > 0
    && zoneList.length > 0
    && zoneList.every((zone) => zone.status === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  const incompleteZoneIds = zoneList
    .filter((zone) => zone.status !== EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED)
    .map((zone) => zone.zoneId);

  const component = (key) => {
    const zonesWithExposure = zoneList.filter((zone) => (
      zone[key].exposureSeconds !== null && zone[key].exposureSeconds > 0
    )).length;

    return {
      complete,
      personSeconds: complete
        ? zoneList.reduce((total, zone) => total + zone[key].personSeconds, 0)
        : null,
      zonesWithExposure
    };
  };

  return {
    complete,
    durationSec,
    intervalCount,
    duplicateTimeSamples,
    fire: component('fire'),
    smoke: component('smoke'),
    incompleteZoneIds
  };
}

function finishResult(building, samples, zones, metadata) {
  const summary = summarizeZones(zones);
  const status = summary.estimatedCount === summary.zoneCount
    ? EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED
    : summary.unknownCount === summary.zoneCount
      ? EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN
      : EXPOSURE_ASSESSMENT_STATUSES.PARTIAL;

  return {
    modelId: EXPOSURE_MODEL_ID,
    buildingId: samples[0].occupancy.buildingId || building.data.id,
    scenarioId: metadata.scenarioId,
    aligned: metadata.aligned,
    startTimeSec: metadata.startTimeSec,
    endTimeSec: metadata.endTimeSec,
    durationSec: metadata.durationSec,
    intervalCount: metadata.intervalCount,
    duplicateTimeSamples: metadata.duplicateTimeSamples,
    status,
    complete: status === EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED,
    summary,
    aggregate: buildAggregate(
      zones,
      metadata.intervalCount,
      metadata.durationSec,
      metadata.duplicateTimeSamples
    ),
    zones,
    samples: samples.map((sample) => ({
      index: sample.index,
      timeSec: sample.occupancy.timeSec,
      occupancySource: sample.occupancy.aggregate.source,
      hazardModelId: sample.hazard.modelId || null,
      aligned: sample.aligned
    })),
    reasons: metadata.reasons,
    limitations: [...EXPOSURE_LIMITATIONS]
  };
}

function createUnalignedResult(building, samples, reasons) {
  const zones = {};
  const zoneIds = [...building.data.zones]
    .map((zone) => zone.id)
    .sort((a, b) => a.localeCompare(b));
  const sampleIndices = samples.map((sample) => sample.index);

  zoneIds.forEach((zoneId) => {
    zones[zoneId] = createUnknownZone(zoneId, sampleIndices);
  });

  return finishResult(building, samples, zones, {
    aligned: false,
    scenarioId: null,
    startTimeSec: null,
    endTimeSec: null,
    durationSec: 0,
    intervalCount: 0,
    duplicateTimeSamples: 0,
    reasons
  });
}

/**
 * Estimate zone-level occupant exposure from aligned occupancy and hazard snapshots.
 *
 * Input is a non-empty array of `{ occupancy, hazard }` samples. Occupancy may be
 * raw Phase 4A occupancy input or a loaded Phase 4A result; hazard is a Phase 2
 * hazard state. Each sample is usable only when occupancy.timeSec and
 * hazard.timeSec match, and all aligned samples must agree on buildingId. If any
 * sample is misaligned, the result is explicitly unavailable instead of assuming
 * the observations are simultaneous.
 *
 * Exposure means an occupant is in a zone at a sample endpoint while fire is
 * active or smoke is present. Fire `pending` is known but not active. Fire and
 * smoke `unknown` are never converted to no exposure. An interval contributes
 * only when both endpoints have known, identical hazard exposure conditions and
 * known occupancy. A condition change between endpoints is not split or
 * interpolated; it makes that interval incomplete. A count change between
 * endpoints likewise produces a partial result and endpoint-based person-second
 * ranges, not a trajectory reconstruction or a bound on unobserved intermediate
 * counts. If any exposure interval has unknown hazard or unknown occupancy,
 * person-second ranges are withheld rather than understated.
 *
 * Person-seconds are accumulated as count * elapsed seconds. Repeated snapshots
 * therefore add exposure time, not unique people. No unique-person count is
 * produced. Aggregate person-seconds are returned only when every zone is
 * complete; partial zone results remain available with null aggregate totals.
 * Smoke density and fire intensity are preserved as observed model values only.
 * No concentration units, dose, injury probability, or safe-person claim is made.
 */
export function estimateExposure(samples, graph) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('Exposure samples must be a non-empty array');
  }

  const building = resolveGraph(graph);
  const normalized = samples.map((sample, index) => (
    normalizeSample(graph, building, sample, index)
  ));
  const misaligned = normalized.filter((sample) => !sample.aligned);
  const buildingIds = uniqueSorted(
    normalized.flatMap((sample) => [sample.occupancy.buildingId, sample.hazard.buildingId])
  );
  const buildingReasons = buildingIds.length > 1
    ? [`samples reference multiple buildingIds: ${buildingIds.join(', ')}`]
    : [];
  const reasons = [
    ...misaligned.flatMap((sample) => sample.reasons),
    ...buildingReasons
  ];

  if (misaligned.length > 0 || buildingReasons.length > 0) {
    return createUnalignedResult(building, normalized, reasons);
  }

  const sorted = [...normalized].sort((a, b) => (
    a.occupancy.timeSec - b.occupancy.timeSec || a.index - b.index
  ));
  const startTimeSec = sorted[0].occupancy.timeSec;
  const endTimeSec = sorted[sorted.length - 1].occupancy.timeSec;
  const durationSec = endTimeSec - startTimeSec;
  let intervalCount = 0;
  let duplicateTimeSamples = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    const dt = sorted[index].occupancy.timeSec - sorted[index - 1].occupancy.timeSec;
    if (dt > 0) {
      intervalCount += 1;
    } else {
      duplicateTimeSamples += 1;
    }
  }

  const zones = {};
  const scenarioIds = uniqueSorted(sorted.map((sample) => sample.hazard.scenarioId));
  [...building.data.zones]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((zone) => {
      zones[zone.id] = computeZone(zone, sorted, intervalCount);
    });

  return finishResult(building, sorted, zones, {
    aligned: true,
    scenarioId: scenarioIds.length === 1 ? scenarioIds[0] : null,
    startTimeSec,
    endTimeSec,
    durationSec,
    intervalCount,
    duplicateTimeSamples,
    reasons: []
  });
}
