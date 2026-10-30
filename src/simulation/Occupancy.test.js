import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTowerGraph, loadBuilding } from './BuildingGraph.js';
import {
  OCCUPANCY_MODEL_ID,
  OCCUPANCY_SCHEMA_VERSION,
  OCCUPANCY_SOURCES,
  OCCUPANCY_STATUSES,
  loadZoneOccupancy,
  occupancyFromAgents,
  occupancyFromAggregate,
  validateZoneOccupancy
} from './Occupancy.js';

const graph = loadBuilding(createTowerGraph());
const expectedZoneIds = graph.data.zones
  .map((zone) => zone.id)
  .sort((a, b) => a.localeCompare(b));

function rawOccupancy(overrides = {}) {
  return {
    schemaVersion: OCCUPANCY_SCHEMA_VERSION,
    timeSec: 12,
    observations: [],
    aggregate: {
      totalCount: 0,
      evacuatedCount: 0,
      inTransitCount: 0,
      status: OCCUPANCY_STATUSES.ESTIMATED,
      source: 'test-crowd'
    },
    ...overrides
  };
}

function observation(zoneId, count, status = OCCUPANCY_STATUSES.OBSERVED) {
  return {
    zoneId,
    count,
    status,
    source: 'test-observation'
  };
}

test('distinguishes known zero occupancy from unknown occupancy', () => {
  const result = loadZoneOccupancy(graph, rawOccupancy({
    observations: [
      observation('L1', 0),
      observation('L2', null, OCCUPANCY_STATUSES.UNAVAILABLE)
    ]
  }));

  assert.equal(result.modelId, OCCUPANCY_MODEL_ID);
  assert.equal(result.timeSec, 12);
  assert.equal(result.zones.L1.count, 0);
  assert.equal(result.zones.L1.known, true);
  assert.equal(result.zones.L1.status, OCCUPANCY_STATUSES.OBSERVED);
  assert.equal(result.zones.L1.source, 'test-observation');

  assert.equal(result.zones.L2.count, null);
  assert.equal(result.zones.L2.known, false);
  assert.equal(result.zones.L2.status, OCCUPANCY_STATUSES.UNAVAILABLE);
  assert.equal(result.zones.L2.source, 'test-observation');

  assert.equal(result.missingZoneIds.includes('L1'), false);
  assert.equal(result.missingZoneIds.includes('L2'), false);
  assert.equal(result.missingZoneIds.length, 13);
});

test('accepts valid counts and rejects invalid counts', () => {
  [0, 1, 42, 999].forEach((count) => {
    const result = loadZoneOccupancy(graph, rawOccupancy({
      observations: [observation('L1', count)]
    }));

    assert.equal(result.zones.L1.count, count);
    assert.equal(result.zones.L1.known, true);
  });

  [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '1', null, undefined]
    .forEach((count) => {
      assert.throws(
        () => loadZoneOccupancy(graph, rawOccupancy({
          observations: [observation('L1', count)]
        })),
        /finite non-negative integer/
      );
    });

  assert.throws(
    () => loadZoneOccupancy(graph, rawOccupancy({
      observations: [observation('L1', 0, OCCUPANCY_STATUSES.UNAVAILABLE)]
    })),
    /count must be null/
  );
});

test('rejects unknown zone IDs and duplicate zone entries', () => {
  const unknownZone = rawOccupancy({
    observations: [observation('L99', 1)]
  });
  const validation = validateZoneOccupancy(graph, unknownZone);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('unknown zone L99')));
  assert.throws(() => loadZoneOccupancy(graph, unknownZone), /unknown zone L99/);

  assert.throws(
    () => loadZoneOccupancy(graph, rawOccupancy({
      observations: [
        observation('L1', 1),
        observation('L1', 2)
      ]
    })),
    /duplicates L1/
  );
});

test('rejects invalid observation status and missing source', () => {
  assert.throws(
    () => loadZoneOccupancy(graph, rawOccupancy({
      observations: [{
        zoneId: 'L1',
        count: 1,
        status: 'guessed',
        source: 'test-observation'
      }]
    })),
    /status must be one of/
  );

  assert.throws(
    () => loadZoneOccupancy(graph, rawOccupancy({
      observations: [{
        zoneId: 'L1',
        count: 1,
        status: OCCUPANCY_STATUSES.ESTIMATED
      }]
    })),
    /source must be a non-empty string/
  );
});

test('marks missing zone records unavailable instead of inventing counts', () => {
  const result = loadZoneOccupancy(graph, rawOccupancy());

  assert.deepEqual(result.missingZoneIds, expectedZoneIds);
  assert.equal(result.missingZoneIds.length, 15);

  Object.values(result.zones).forEach((zone) => {
    assert.equal(zone.count, null);
    assert.equal(zone.known, false);
    assert.equal(zone.status, OCCUPANCY_STATUSES.UNAVAILABLE);
    assert.equal(zone.source, OCCUPANCY_SOURCES.NONE);
  });
});

test('preserves aggregate-only data without fabricating zone distributions', () => {
  const result = occupancyFromAggregate(graph, {
    totalCount: 150,
    evacuatedCount: 20,
    inTransitCount: 130
  }, {
    timeSec: 30,
    status: OCCUPANCY_STATUSES.ESTIMATED,
    source: 'server-room-counts'
  });

  assert.equal(result.aggregate.totalCount, 150);
  assert.equal(result.aggregate.evacuatedCount, 20);
  assert.equal(result.aggregate.inTransitCount, 130);
  assert.equal(result.aggregate.status, OCCUPANCY_STATUSES.ESTIMATED);
  assert.equal(result.aggregate.source, 'server-room-counts');
  assert.equal(result.missingZoneIds.length, 15);

  Object.values(result.zones).forEach((zone) => {
    assert.equal(zone.count, null);
    assert.equal(zone.known, false);
    assert.equal(zone.status, OCCUPANCY_STATUSES.UNAVAILABLE);
  });
});

test('maps reliable agent positions without treating in-transit agents as floor occupants', () => {
  const agents = [
    { id: 'a1', state: 'IDLE', floor: 1, roomId: 'f1_r1', x: -20, y: 0.05, z: -12 },
    { id: 'a2', state: 'IDLE', floor: 2, roomId: 'f2_r2', x: -10, y: 3.85, z: -12 },
    { id: 'a3', state: 'EVACUATING', floor: 5, roomId: 'f5_r4', x: -28, y: 10, z: 0 },
    { id: 'a4', state: 'EVACUATING', floor: 5, roomId: 'f5_r4', x: 0, y: 10, z: 0 },
    { id: 'a5', state: 'EVACUATING', floor: 1, roomId: 'f1_r1', x: -29, y: 0.15, z: 0 },
    { id: 'a6', state: 'SAFE', floor: 1, roomId: 'f1_r1', x: -38, y: 0.15, z: 0 },
    { id: 'a7', state: 'EVACUATING', floor: 1, roomId: 'f1_r1', x: 38, y: 0.15, z: 0 }
  ];
  const result = occupancyFromAgents(graph, agents, { timeSec: 60 });

  assert.equal(result.zones.L1.count, 1);
  assert.equal(result.zones.L2.count, 1);
  assert.equal(result.zones.L3.count, 1);
  assert.equal(result.zones.L5.count, 0);
  assert.equal(result.zones.stair_west.count, 1);
  assert.equal(result.zones.exit_west.count, 1);
  assert.equal(result.missingZoneIds.length, 0);

  assert.equal(result.aggregate.totalCount, 7);
  assert.equal(result.aggregate.evacuatedCount, 1);
  assert.equal(result.aggregate.inTransitCount, 6);
  assert.equal(result.aggregate.assignedCount, 5);
  assert.equal(result.aggregate.unassignedCount, 1);
  assert.equal(result.aggregate.status, OCCUPANCY_STATUSES.ESTIMATED);
  assert.equal(result.aggregate.source, OCCUPANCY_SOURCES.AGENT_POSITIONS);

  Object.values(result.zones).forEach((zone) => {
    assert.equal(zone.known, true);
    assert.equal(zone.status, OCCUPANCY_STATUSES.ESTIMATED);
    assert.equal(zone.source, OCCUPANCY_SOURCES.AGENT_POSITIONS);
  });
});

test('refuses exact zone counts when any agent location is unknown', () => {
  const agents = [
    { id: 'a1', state: 'IDLE', floor: 1, roomId: 'f1_r1', x: -20, y: 0.05, z: -12 },
    { id: 'a2', state: 'EVACUATING', floor: 2, roomId: 'f2_r2', x: Number.NaN, y: 4, z: 0 }
  ];
  const result = occupancyFromAgents(graph, agents, { timeSec: 5 });

  Object.values(result.zones).forEach((zone) => {
    assert.equal(zone.count, null);
    assert.equal(zone.known, false);
    assert.equal(zone.status, OCCUPANCY_STATUSES.UNAVAILABLE);
    assert.equal(zone.source, OCCUPANCY_SOURCES.NONE);
  });

  assert.equal(result.aggregate.totalCount, 2);
  assert.equal(result.aggregate.evacuatedCount, 0);
  assert.equal(result.aggregate.inTransitCount, 2);
  assert.equal(result.aggregate.assignedCount, 1);
  assert.equal(result.aggregate.unassignedCount, 1);
});

test('marks counts unavailable when duplicate agent identities are present', () => {
  const agents = [
    { id: 'a1', state: 'IDLE', floor: 1, x: -20, y: 0.05, z: -12 },
    { id: 'a1', state: 'IDLE', floor: 1, x: -20, y: 0.05, z: -12 }
  ];
  const result = occupancyFromAgents(graph, agents, { timeSec: 1 });

  Object.values(result.zones).forEach((zone) => {
    assert.equal(zone.count, null);
    assert.equal(zone.known, false);
    assert.equal(zone.status, OCCUPANCY_STATUSES.UNAVAILABLE);
    assert.equal(zone.source, OCCUPANCY_SOURCES.NONE);
  });

  assert.equal(result.aggregate.status, OCCUPANCY_STATUSES.UNAVAILABLE);
  assert.equal(result.aggregate.totalCount, null);
  assert.equal(result.aggregate.evacuatedCount, null);
  assert.equal(result.aggregate.inTransitCount, null);
  assert.equal(result.aggregate.assignedCount, null);
  assert.equal(result.aggregate.unassignedCount, null);
});

test('validates occupancy timestamps', () => {
  [-1, Number.NaN, undefined].forEach((timeSec) => {
    assert.throws(
      () => loadZoneOccupancy(graph, rawOccupancy({ timeSec })),
      /timeSec must be a finite non-negative number/
    );
  });

  assert.throws(
    () => loadZoneOccupancy(graph, rawOccupancy({
      timeSec: 10,
      observations: [{
        ...observation('L1', 1),
        timeSec: 9
      }]
    })),
    /timeSec must match occupancy timeSec/
  );

  assert.throws(
    () => loadZoneOccupancy(graph, rawOccupancy({
      timeSec: 10,
      aggregate: {
        totalCount: 1,
        evacuatedCount: 0,
        inTransitCount: 1,
        status: OCCUPANCY_STATUSES.ESTIMATED,
        source: 'test-crowd',
        timeSec: 9
      }
    })),
    /timeSec must match occupancy timeSec/
  );

  const result = loadZoneOccupancy(graph, rawOccupancy({
    timeSec: 10,
    observations: [{
      ...observation('L1', 1),
      timeSec: 10
    }]
  }));
  assert.equal(result.zones.L1.timeSec, 10);
});

test('is deterministic and does not mutate input records', () => {
  const raw = rawOccupancy({
    observations: [observation('L1', 2)]
  });
  const rawBefore = JSON.stringify(raw);
  const first = loadZoneOccupancy(graph, raw);
  const second = loadZoneOccupancy(graph, raw);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(raw), rawBefore);

  first.zones.L1.count = 99;
  assert.equal(JSON.stringify(raw), rawBefore);
  assert.deepEqual(loadZoneOccupancy(graph, raw), second);

  const agents = [
    { id: 'a1', state: 'IDLE', floor: 1, roomId: 'f1_r1', x: -20, y: 0.05, z: -12 }
  ];
  const agentsBefore = JSON.stringify(agents);
  const firstAgents = occupancyFromAgents(graph, agents, { timeSec: 1 });
  const secondAgents = occupancyFromAgents(graph, agents, { timeSec: 1 });

  assert.deepEqual(firstAgents, secondAgents);
  assert.equal(JSON.stringify(agents), agentsBefore);

  firstAgents.zones.L1.count = 99;
  assert.equal(JSON.stringify(agents), agentsBefore);
  assert.deepEqual(occupancyFromAgents(graph, agents, { timeSec: 1 }), secondAgents);
});

test('requires explicit adapter metadata and valid agent arrays', () => {
  assert.throws(
    () => occupancyFromAgents(graph, []),
    /Occupancy timeSec must be a finite non-negative number/
  );
  assert.throws(
    () => occupancyFromAgents(graph, null, { timeSec: 1 }),
    /Agents must be an array/
  );
  assert.throws(
    () => occupancyFromAgents(graph, [], { timeSec: 1, status: OCCUPANCY_STATUSES.UNAVAILABLE }),
    /status must be observed or estimated/
  );
  assert.throws(
    () => occupancyFromAggregate(graph, null, { timeSec: 1 }),
    /Aggregate occupancy must be an object/
  );
});
