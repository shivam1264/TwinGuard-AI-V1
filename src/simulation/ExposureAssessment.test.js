import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRE_STATUSES,
  HAZARD_SCHEMA_VERSION,
  SMOKE_STATUSES,
  createTowerGraph,
  loadBuilding
} from './BuildingGraph.js';
import {
  OCCUPANCY_SCHEMA_VERSION,
  OCCUPANCY_STATUSES,
  occupancyFromAgents,
  occupancyFromAggregate
} from './Occupancy.js';
import {
  EXPOSURE_ASSESSMENT_STATUSES,
  EXPOSURE_LIMITATIONS,
  EXPOSURE_MODEL_ID,
  estimateExposure
} from './ExposureAssessment.js';

const graph = loadBuilding(createTowerGraph());
const expectedZoneIds = graph.data.zones
  .map((zone) => zone.id)
  .sort((a, b) => a.localeCompare(b));

const noFire = Object.freeze({
  status: FIRE_STATUSES.NONE,
  intensity: null,
  source: null
});
const noSmoke = Object.freeze({
  status: SMOKE_STATUSES.NONE,
  density: null
});
const unknownFire = Object.freeze({
  status: FIRE_STATUSES.UNKNOWN,
  intensity: null,
  source: null
});
const unknownSmoke = Object.freeze({
  status: SMOKE_STATUSES.UNKNOWN,
  density: null
});

function activeFire(intensity = 0.5, source = 'scenario') {
  return {
    status: FIRE_STATUSES.ACTIVE,
    intensity,
    sinceSec: 0,
    startSec: 0,
    source
  };
}

function pendingFire(intensity = 0.5, source = 'scenario') {
  return {
    status: FIRE_STATUSES.PENDING,
    intensity,
    sinceSec: null,
    startSec: 10,
    source
  };
}

function activeSmoke(density = 0.4) {
  return {
    status: SMOKE_STATUSES.ACTIVE,
    density
  };
}

function hazardZone(fire = noFire, smoke = noSmoke) {
  return { fire, smoke };
}

function hazardAt(timeSec, overrides = {}) {
  const zones = {};

  expectedZoneIds.forEach((zoneId) => {
    zones[zoneId] = hazardZone();
  });

  Object.assign(zones, overrides);

  return {
    schemaVersion: HAZARD_SCHEMA_VERSION,
    buildingId: graph.data.id,
    scenarioId: 'exposure-test',
    timeSec,
    zones
  };
}

function occupancyAt(timeSec, counts = {}) {
  const observations = expectedZoneIds.map((zoneId) => {
    const value = Object.hasOwn(counts, zoneId) ? counts[zoneId] : 0;

    if (value === null) {
      return {
        zoneId,
        count: null,
        status: OCCUPANCY_STATUSES.UNAVAILABLE,
        source: 'test-occupancy'
      };
    }

    if (typeof value === 'object') {
      return {
        zoneId,
        status: OCCUPANCY_STATUSES.OBSERVED,
        source: 'test-occupancy',
        ...value
      };
    }

    return {
      zoneId,
      count: value,
      status: OCCUPANCY_STATUSES.OBSERVED,
      source: 'test-occupancy'
    };
  });

  return {
    schemaVersion: OCCUPANCY_SCHEMA_VERSION,
    buildingId: graph.data.id,
    timeSec,
    observations
  };
}

function partialOccupancyAt(timeSec, observations) {
  return {
    schemaVersion: OCCUPANCY_SCHEMA_VERSION,
    buildingId: graph.data.id,
    timeSec,
    observations: observations.map((observation) => ({
      status: OCCUPANCY_STATUSES.OBSERVED,
      source: 'test-occupancy',
      ...observation
    }))
  };
}

function sample(timeSec, counts, hazardOverrides = {}) {
  return {
    occupancy: occupancyAt(timeSec, counts),
    hazard: hazardAt(timeSec, hazardOverrides)
  };
}

test('estimates known fire exposure from stable occupancy snapshots', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(activeFire(0.6, 'scenario')) }),
    sample(10, { L1: 2 }, { L1: hazardZone(activeFire(0.6, 'scenario')) })
  ], graph);

  assert.equal(result.modelId, EXPOSURE_MODEL_ID);
  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(result.complete, true);
  assert.equal(result.durationSec, 10);
  assert.equal(result.intervalCount, 1);
  assert.deepEqual(result.summary, {
    zoneCount: 15,
    estimatedCount: 15,
    partialCount: 0,
    unknownCount: 0
  });
  assert.deepEqual(Object.keys(result.zones), expectedZoneIds);

  assert.deepEqual(result.zones.L1, {
    zoneId: 'L1',
    status: EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED,
    complete: true,
    occupancy: {
      initialCount: 2,
      finalCount: 2,
      countChanged: false,
      knownEndpoints: 2,
      totalEndpoints: 2,
      sources: ['test-occupancy']
    },
    fire: {
      status: EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED,
      exposureSeconds: 10,
      knownNonexposureSeconds: 0,
      unknownSeconds: 0,
      personSeconds: 20,
      personSecondsMin: 20,
      personSecondsMax: 20,
      maxObservedIntensity: 0.6,
      maxObservedDensity: null,
      sources: ['scenario']
    },
    smoke: {
      status: EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED,
      exposureSeconds: 0,
      knownNonexposureSeconds: 10,
      unknownSeconds: 0,
      personSeconds: 0,
      personSecondsMin: 0,
      personSecondsMax: 0,
      maxObservedIntensity: null,
      maxObservedDensity: null,
      sources: []
    },
    provenance: {
      sampleIndices: [0, 1],
      observationTimesSec: [0, 10],
      occupancySources: ['test-occupancy'],
      fireSources: ['scenario']
    }
  });

  assert.equal(result.aggregate.complete, true);
  assert.equal(result.aggregate.fire.personSeconds, 20);
  assert.equal(result.aggregate.fire.zonesWithExposure, 1);
  assert.equal(result.aggregate.smoke.personSeconds, 0);
  assert.deepEqual(result.aggregate.incompleteZoneIds, []);
});

test('keeps configured and propagated fire provenance separate', () => {
  const result = estimateExposure([
    sample(0, { L1: 1, L2: 1 }, {
      L1: hazardZone(activeFire(0.6, 'scenario')),
      L2: hazardZone(activeFire(0.4, 'propagated'))
    }),
    sample(10, { L1: 1, L2: 1 }, {
      L1: hazardZone(activeFire(0.6, 'scenario')),
      L2: hazardZone(activeFire(0.4, 'propagated'))
    })
  ], graph);

  assert.deepEqual(result.zones.L1.fire.sources, ['scenario']);
  assert.deepEqual(result.zones.L2.fire.sources, ['propagated']);
  assert.equal(result.zones.L1.fire.personSeconds, 10);
  assert.equal(result.zones.L2.fire.personSeconds, 10);
});

test('estimates known smoke exposure without converting density to a dose', () => {
  const result = estimateExposure([
    sample(0, { L1: 3 }, { L1: hazardZone(noFire, activeSmoke(0.4)) }),
    sample(20, { L1: 3 }, { L1: hazardZone(noFire, activeSmoke(0.4)) })
  ], graph);
  const zone = result.zones.L1;

  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(zone.smoke.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(zone.smoke.exposureSeconds, 20);
  assert.equal(zone.smoke.personSeconds, 60);
  assert.equal(zone.smoke.maxObservedDensity, 0.4);
  assert.equal(zone.fire.personSeconds, 0);
  assert.equal(result.aggregate.smoke.personSeconds, 60);
  assert.equal(result.aggregate.fire.personSeconds, 0);
  assert.equal(zone.smoke.dose, undefined);
});

test('treats known no-hazard and pending fire as known non-exposure', () => {
  const noHazard = estimateExposure([
    sample(0, { L1: 2 }),
    sample(5, { L1: 2 })
  ], graph).zones.L1;

  assert.equal(noHazard.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(noHazard.fire.exposureSeconds, 0);
  assert.equal(noHazard.fire.personSeconds, 0);
  assert.equal(noHazard.smoke.exposureSeconds, 0);
  assert.equal(noHazard.smoke.personSeconds, 0);

  const pending = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(pendingFire(0.6, 'scenario')) }),
    sample(5, { L1: 2 }, { L1: hazardZone(pendingFire(0.6, 'scenario')) })
  ], graph).zones.L1;

  assert.equal(pending.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(pending.fire.exposureSeconds, 0);
  assert.equal(pending.fire.personSeconds, 0);
  assert.equal(pending.fire.maxObservedIntensity, 0.6);
  assert.deepEqual(pending.fire.sources, ['scenario']);
});

test('keeps unknown hazard status unknown instead of no exposure', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(unknownFire, unknownSmoke) }),
    sample(5, { L1: 2 }, { L1: hazardZone(unknownFire, unknownSmoke) })
  ], graph);
  const zone = result.zones.L1;

  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(result.complete, false);
  assert.equal(zone.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(zone.fire.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(zone.fire.exposureSeconds, null);
  assert.equal(zone.fire.personSeconds, null);
  assert.equal(zone.smoke.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(zone.smoke.personSeconds, null);
  assert.equal(result.aggregate.complete, false);
  assert.equal(result.aggregate.fire.personSeconds, null);
  assert.equal(result.aggregate.smoke.personSeconds, null);
});

test('keeps fire and smoke unknown status independent', () => {
  const fireUnknown = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(unknownFire, noSmoke) }),
    sample(5, { L1: 2 }, { L1: hazardZone(unknownFire, noSmoke) })
  ], graph).zones.L1;

  assert.equal(fireUnknown.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(fireUnknown.fire.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(fireUnknown.fire.personSeconds, null);
  assert.equal(fireUnknown.smoke.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(fireUnknown.smoke.personSeconds, 0);

  const smokeUnknown = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(noFire, unknownSmoke) }),
    sample(5, { L1: 2 }, { L1: hazardZone(noFire, unknownSmoke) })
  ], graph).zones.L1;

  assert.equal(smokeUnknown.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(smokeUnknown.fire.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(smokeUnknown.fire.personSeconds, 0);
  assert.equal(smokeUnknown.smoke.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(smokeUnknown.smoke.personSeconds, null);
});

test('distinguishes known zero occupancy from unavailable occupancy', () => {
  const zero = estimateExposure([
    sample(0, { L1: 0 }, { L1: hazardZone(activeFire()) }),
    sample(10, { L1: 0 }, { L1: hazardZone(activeFire()) })
  ], graph).zones.L1;

  assert.equal(zero.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(zero.occupancy.initialCount, 0);
  assert.equal(zero.fire.exposureSeconds, 10);
  assert.equal(zero.fire.personSeconds, 0);

  const unknown = estimateExposure([
    sample(0, { L1: null }, { L1: hazardZone(activeFire()) }),
    sample(10, { L1: null }, { L1: hazardZone(activeFire()) })
  ], graph).zones.L1;

  assert.equal(unknown.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(unknown.occupancy.initialCount, null);
  assert.equal(unknown.occupancy.knownEndpoints, 0);
  assert.equal(unknown.fire.exposureSeconds, 10);
  assert.equal(unknown.fire.personSeconds, null);
  assert.equal(unknown.fire.personSecondsMin, null);
  assert.equal(unknown.fire.personSecondsMax, null);
});

test('accumulates exposure duration across intervals without double-counting snapshots', () => {
  const result = estimateExposure([
    sample(0, { L1: 2, L2: 3 }, {
      L1: hazardZone(activeFire()),
      L2: hazardZone(activeFire())
    }),
    sample(10, { L1: 2, L2: 3 }, {
      L1: hazardZone(activeFire()),
      L2: hazardZone(activeFire())
    }),
    sample(30, { L1: 2, L2: 3 }, {
      L1: hazardZone(activeFire()),
      L2: hazardZone(activeFire())
    })
  ], graph);

  assert.equal(result.durationSec, 30);
  assert.equal(result.intervalCount, 2);
  assert.equal(result.zones.L1.fire.exposureSeconds, 30);
  assert.equal(result.zones.L1.fire.personSeconds, 60);
  assert.equal(result.zones.L2.fire.personSeconds, 90);
  assert.equal(result.aggregate.fire.personSeconds, 150);
  assert.equal(result.aggregate.uniquePersonCount, undefined);
});

test('reports endpoint bounds when occupancy changes during exposure', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(activeFire()) }),
    sample(10, { L1: 4 }, { L1: hazardZone(activeFire()) })
  ], graph);
  const zone = result.zones.L1;

  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(result.complete, false);
  assert.equal(zone.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(zone.occupancy.countChanged, true);
  assert.equal(zone.fire.exposureSeconds, 10);
  assert.equal(zone.fire.personSeconds, null);
  assert.equal(zone.fire.personSecondsMin, 20);
  assert.equal(zone.fire.personSecondsMax, 40);
  assert.equal(result.aggregate.complete, false);
  assert.equal(result.aggregate.fire.personSeconds, null);
  assert.ok(result.aggregate.incompleteZoneIds.includes('L1'));
});

test('withholds person-second ranges when an active interval has unknown occupancy', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(activeFire()) }),
    sample(10, { L1: null }, { L1: hazardZone(activeFire()) }),
    sample(20, { L1: 2 }, { L1: hazardZone(activeFire()) })
  ], graph);
  const zone = result.zones.L1;

  assert.equal(zone.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(zone.fire.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(zone.fire.exposureSeconds, 20);
  assert.equal(zone.fire.unknownSeconds, 0);
  assert.equal(zone.fire.personSeconds, null);
  assert.equal(zone.fire.personSecondsMin, null);
  assert.equal(zone.fire.personSecondsMax, null);
  assert.equal(result.aggregate.fire.personSeconds, null);
});

test('does not count an exposure interval when condition changes between endpoints', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }),
    sample(10, { L1: 2 }, { L1: hazardZone(activeFire()) })
  ], graph);
  const zone = result.zones.L1;

  assert.equal(zone.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(zone.fire.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(zone.fire.exposureSeconds, 0);
  assert.equal(zone.fire.unknownSeconds, 10);
  assert.equal(zone.fire.personSeconds, null);
  assert.equal(result.aggregate.fire.personSeconds, null);
});

test('counts only intervals fully after a hazard transition at a sample boundary', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }),
    sample(10, { L1: 2 }, { L1: hazardZone(activeFire()) }),
    sample(20, { L1: 2 }, { L1: hazardZone(activeFire()) })
  ], graph);
  const zone = result.zones.L1;

  assert.equal(zone.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(zone.fire.exposureSeconds, 10);
  assert.equal(zone.fire.unknownSeconds, 10);
  assert.equal(zone.fire.personSeconds, null);
  assert.equal(zone.fire.personSecondsMin, null);
  assert.equal(zone.fire.personSecondsMax, null);
  assert.equal(result.aggregate.fire.personSeconds, null);
});

test('marks mismatched occupancy and hazard timestamps unavailable', () => {
  const result = estimateExposure([{
    occupancy: occupancyAt(10, { L1: 2 }),
    hazard: hazardAt(9, { L1: hazardZone(activeFire()) })
  }], graph);

  assert.equal(result.aligned, false);
  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(result.complete, false);
  assert.equal(result.durationSec, 0);
  assert.equal(result.intervalCount, 0);
  assert.equal(result.aggregate.fire.personSeconds, null);
  assert.equal(result.zones.L1.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(result.zones.L1.fire.exposureSeconds, null);
  assert.ok(result.reasons[0].includes('does not match'));
});

test('rejects stale observation timestamps instead of mixing them into an interval', () => {
  assert.throws(() => estimateExposure([{
    occupancy: partialOccupancyAt(10, [{ zoneId: 'L1', count: 2, timeSec: 9 }]),
    hazard: hazardAt(10, { L1: hazardZone(activeFire()) })
  }], graph), /timeSec must match occupancy timeSec/);
});

test('marks samples from different buildings unavailable instead of combining them', () => {
  const first = sample(0, { L1: 1 });
  const second = sample(10, { L1: 1 });
  second.occupancy.buildingId = 'other-building';
  second.hazard.buildingId = 'other-building';

  const result = estimateExposure([first, second], graph);

  assert.equal(result.aligned, false);
  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(result.intervalCount, 0);
  assert.equal(result.aggregate.fire.personSeconds, null);
  assert.ok(result.reasons.some((reason) => reason.includes('multiple buildingIds')));
});

test('keeps missing zone occupancy unavailable and withholds building totals', () => {
  const occupancy0 = partialOccupancyAt(0, [{ zoneId: 'L1', count: 2 }]);
  const occupancy10 = partialOccupancyAt(10, [{ zoneId: 'L1', count: 2 }]);
  const result = estimateExposure([
    { occupancy: occupancy0, hazard: hazardAt(0, { L1: hazardZone(activeFire()) }) },
    { occupancy: occupancy10, hazard: hazardAt(10, { L1: hazardZone(activeFire()) }) }
  ], graph);

  assert.equal(result.zones.L1.status, EXPOSURE_ASSESSMENT_STATUSES.ESTIMATED);
  assert.equal(result.zones.L1.fire.personSeconds, 20);
  assert.equal(result.zones.L2.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(result.zones.L2.occupancy.initialCount, null);
  assert.equal(result.zones.L2.occupancy.knownEndpoints, 0);
  assert.equal(result.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(result.aggregate.complete, false);
  assert.equal(result.aggregate.fire.personSeconds, null);
  assert.ok(result.aggregate.incompleteZoneIds.includes('L2'));
});

test('withholds aggregate totals when occupants move between zones', () => {
  const result = estimateExposure([
    sample(0, { L1: 1, L2: 0 }, {
      L1: hazardZone(activeFire()),
      L2: hazardZone(activeFire())
    }),
    sample(10, { L1: 0, L2: 1 }, {
      L1: hazardZone(activeFire()),
      L2: hazardZone(activeFire())
    })
  ], graph);

  assert.equal(result.zones.L1.fire.personSeconds, null);
  assert.equal(result.zones.L1.fire.personSecondsMin, 0);
  assert.equal(result.zones.L1.fire.personSecondsMax, 10);
  assert.equal(result.zones.L2.fire.personSecondsMin, 0);
  assert.equal(result.zones.L2.fire.personSecondsMax, 10);
  assert.equal(result.aggregate.fire.personSeconds, null);
  assert.ok(result.aggregate.incompleteZoneIds.includes('L1'));
  assert.ok(result.aggregate.incompleteZoneIds.includes('L2'));
});

test('does not fabricate zone exposure from aggregate-only occupancy', () => {
  const aggregate0 = occupancyFromAggregate(graph, {
    totalCount: 10,
    evacuatedCount: 0,
    inTransitCount: 10
  }, {
    timeSec: 0,
    status: OCCUPANCY_STATUSES.ESTIMATED,
    source: 'server-room-counts'
  });
  const aggregate10 = occupancyFromAggregate(graph, {
    totalCount: 10,
    evacuatedCount: 0,
    inTransitCount: 10
  }, {
    timeSec: 10,
    status: OCCUPANCY_STATUSES.ESTIMATED,
    source: 'server-room-counts'
  });
  const result = estimateExposure([
    { occupancy: aggregate0, hazard: hazardAt(0, { L1: hazardZone(activeFire()) }) },
    { occupancy: aggregate10, hazard: hazardAt(10, { L1: hazardZone(activeFire()) }) }
  ], graph);

  assert.equal(result.zones.L1.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(result.zones.L1.occupancy.initialCount, null);
  assert.equal(result.zones.L1.fire.exposureSeconds, 10);
  assert.equal(result.zones.L1.fire.personSeconds, null);
  assert.equal(result.aggregate.complete, false);
  assert.equal(result.aggregate.fire.personSeconds, null);
});

test('does not assign in-transit occupants with unknown locations to zones', () => {
  const agents = [
    { id: 'a1', state: 'EVACUATING', floor: 2, x: Number.NaN, y: 4, z: 0 }
  ];
  const occupancy0 = occupancyFromAgents(graph, agents, { timeSec: 0 });
  const occupancy10 = occupancyFromAgents(graph, agents, { timeSec: 10 });
  const result = estimateExposure([
    { occupancy: occupancy0, hazard: hazardAt(0, { L1: hazardZone(activeFire()) }) },
    { occupancy: occupancy10, hazard: hazardAt(10, { L1: hazardZone(activeFire()) }) }
  ], graph);

  assert.equal(result.zones.L1.status, EXPOSURE_ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(result.zones.L1.occupancy.initialCount, null);
  assert.equal(result.zones.L1.fire.personSeconds, null);
  assert.equal(result.aggregate.fire.personSeconds, null);
});

test('ignores duplicate sample times so repeated observations do not double-count', () => {
  const result = estimateExposure([
    sample(0, { L1: 2 }, { L1: hazardZone(activeFire()) }),
    sample(10, { L1: 2 }, { L1: hazardZone(activeFire()) }),
    sample(10, { L1: 2 }, { L1: hazardZone(activeFire()) })
  ], graph);

  assert.equal(result.durationSec, 10);
  assert.equal(result.intervalCount, 1);
  assert.equal(result.aggregate.duplicateTimeSamples, 1);
  assert.equal(result.zones.L1.fire.exposureSeconds, 10);
  assert.equal(result.zones.L1.fire.personSeconds, 20);
});

test('is deterministic and does not mutate samples or graph data', () => {
  const samples = [
    sample(0, { L1: 2 }, { L1: hazardZone(activeFire(0.6), activeSmoke(0.4)) }),
    sample(10, { L1: 2 }, { L1: hazardZone(activeFire(0.6), activeSmoke(0.4)) })
  ];
  const samplesBefore = JSON.stringify(samples);
  const graphBefore = JSON.stringify(graph.data);

  const first = estimateExposure(samples, graph);
  const second = estimateExposure(samples, graph);

  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.zones, second.zones);
  assert.equal(JSON.stringify(samples), samplesBefore);
  assert.equal(JSON.stringify(graph.data), graphBefore);

  first.zones.L1.fire.personSeconds = 999;
  first.zones.L1.smoke.personSeconds = 999;

  assert.equal(JSON.stringify(samples), samplesBefore);
  assert.deepEqual(estimateExposure(samples, graph), second);
});

test('handles boundary cases and rejects invalid inputs', () => {
  assert.throws(() => estimateExposure(null, graph), /non-empty array/);
  assert.throws(() => estimateExposure([], graph), /non-empty array/);
  assert.throws(() => estimateExposure([{}], graph), /occupancy is required/);
  assert.throws(
    () => estimateExposure([{ occupancy: occupancyAt(0), hazard: null }], graph),
    /Hazard state/
  );
  assert.throws(
    () => estimateExposure([sample(-1, { L1: 1 })], graph),
    /timeSec must be a finite non-negative number/
  );
  assert.throws(
    () => estimateExposure([
      { occupancy: occupancyAt(0), hazard: hazardAt(0, { L99: hazardZone() }) }
    ], graph),
    /unknown zone/
  );
  assert.throws(
    () => estimateExposure([
      sample(0, { L1: 1 }, {
        L1: hazardZone({ status: 'broken', intensity: 0.5 })
      })
    ], graph),
    /Invalid hazard state/
  );
  assert.throws(
    () => estimateExposure([
      sample(0, { L1: 1 }, {
        L1: hazardZone(noFire, { status: SMOKE_STATUSES.ACTIVE, density: -1 })
      })
    ], graph),
    /Invalid hazard state/
  );
  assert.throws(
    () => estimateExposure([
      sample(0, { L1: 1 }, {
        L1: hazardZone(noFire, { status: SMOKE_STATUSES.ACTIVE })
      })
    ], graph),
    /Invalid hazard state/
  );
  assert.throws(
    () => estimateExposure([{
      occupancy: occupancyAt(0, { L1: 1 }),
      hazard: { ...hazardAt(0), buildingId: 42 }
    }], graph),
    /buildingId must be a non-empty string/
  );

  const single = estimateExposure([sample(0, { L1: 1 })], graph);
  assert.equal(single.status, EXPOSURE_ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(single.intervalCount, 0);
  assert.equal(single.aggregate.complete, false);
  assert.equal(single.aggregate.fire.personSeconds, null);

  const duplicateOnly = estimateExposure([
    sample(5, { L1: 1 }),
    sample(5, { L1: 1 })
  ], graph);
  assert.equal(duplicateOnly.durationSec, 0);
  assert.equal(duplicateOnly.intervalCount, 0);
  assert.equal(duplicateOnly.aggregate.duplicateTimeSamples, 1);
  assert.equal(duplicateOnly.aggregate.complete, false);
});

test('exposes explicit frozen limitations', () => {
  assert.equal(Object.isFrozen(EXPOSURE_LIMITATIONS), true);
  assert.ok(EXPOSURE_LIMITATIONS.some((item) => item.includes('not identified people')));
  assert.ok(EXPOSURE_LIMITATIONS.some((item) => item.includes('Aggregate occupancy')));
  assert.ok(EXPOSURE_LIMITATIONS.some((item) => item.includes('unobserved intermediate')));
  assert.ok(EXPOSURE_LIMITATIONS.some((item) => item.includes('Duplicate agent identities')));
  assert.ok(EXPOSURE_LIMITATIONS.some((item) => item.includes('not evidence')));
});
