import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CONNECTION_STATUSES,
  EXPOSURE_STATUSES,
  FIRE_STATUSES,
  RISK_STATUSES,
  ROUTE_STATUSES,
  SMOKE_STATUSES,
  applyScenario,
  createTowerGraph,
  loadBuilding
} from './BuildingGraph.js';
import {
  DEFAULT_PROPAGATION_CONFIG,
  advanceHazardState
} from './HazardPropagation.js';

const sampleScenarioPath = new URL('./scenarios/sample-fire.json', import.meta.url);

const FAST_CONFIG = {
  fire: {
    spreadDelaySec: 5,
    intensityLossPerHop: 0.1,
    minimumIntensity: 0.05
  },
  smoke: {
    sourceDelaySec: 10,
    spreadDelaySec: 5,
    initialDensity: 0.1,
    risePerSec: 0.1,
    maxDensity: 1
  }
};

const GATE_CONFIG = {
  fire: {
    spreadDelaySec: 10,
    intensityLossPerHop: 0.1,
    minimumIntensity: 0.05
  },
  smoke: {
    sourceDelaySec: 5,
    spreadDelaySec: 7,
    initialDensity: 0.05,
    risePerSec: 0.01,
    maxDensity: 10
  }
};

function createGraph() {
  return loadBuilding(createTowerGraph());
}

function createState() {
  const scenario = JSON.parse(readFileSync(sampleScenarioPath, 'utf8'));
  return applyScenario(createGraph(), scenario);
}

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, received ${actual}`);
}

function advanceInSteps(state, graph, dt, count, config) {
  let current = state;

  for (let index = 0; index < count; index += 1) {
    current = advanceHazardState(current, graph, dt, config);
  }

  return current;
}

function createGraphWithL5LinksStatus(status) {
  const rawGraph = createTowerGraph();

  rawGraph.connections.forEach((connection) => {
    if (connection.id === 'conn_L5_stair_west' || connection.id === 'conn_L5_stair_east') {
      connection.status = status;
    }
  });

  return loadBuilding(rawGraph);
}

test('advanceHazardState rejects invalid dt values', () => {
  const graph = createGraph();
  const state = createState();

  [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '5', undefined].forEach((dt) => {
    assert.throws(
      () => advanceHazardState(state, graph, dt, FAST_CONFIG),
      /dt must be a finite positive number/
    );
  });
});

test('fire propagates from scenario source with separate source and propagated markers', () => {
  const graph = createGraph();
  const state = createState();
  const result = advanceHazardState(state, graph, 5, FAST_CONFIG);

  assert.equal(result.timeSec, 5);
  assert.equal(result.modelId, 'rule-based-v1');
  assert.deepEqual(result.zones.L5.fire, {
    status: FIRE_STATUSES.ACTIVE,
    intensity: 0.6,
    sinceSec: 0,
    startSec: 0,
    source: 'scenario'
  });

  ['stair_west', 'stair_east'].forEach((zoneId) => {
    assert.deepEqual(result.zones[zoneId].fire, {
      status: FIRE_STATUSES.ACTIVE,
      intensity: 0.5,
      sinceSec: 5,
      startSec: 5,
      source: 'propagated'
    });
  });

  assert.equal(result.zones.L1.fire.status, FIRE_STATUSES.PENDING);
  assert.ok(Math.abs(result.zones.L1.fire.intensity - 0.4) < 1e-12);
  assert.equal(result.zones.L1.fire.sinceSec, null);
  assert.equal(result.zones.L1.fire.startSec, 10);
  assert.equal(result.zones.L1.fire.source, 'propagated');
});

test('fire and smoke use independent configurable timing', () => {
  const graph = createGraph();
  const state = createState();

  const atNine = advanceHazardState(state, graph, 9, FAST_CONFIG);
  assert.equal(atNine.zones.L5.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atNine.zones.stair_west.fire.status, FIRE_STATUSES.ACTIVE);
  Object.values(atNine.zones).forEach((zone) => {
    assert.equal(zone.smoke.status, SMOKE_STATUSES.UNKNOWN);
    assert.equal(zone.smoke.density, null);
  });

  const atTen = advanceHazardState(state, graph, 10, FAST_CONFIG);
  assert.equal(atTen.zones.L5.smoke.status, SMOKE_STATUSES.ACTIVE);
  assert.equal(atTen.zones.L5.smoke.density, 0.1);
  assert.equal(atTen.zones.stair_west.smoke.status, SMOKE_STATUSES.UNKNOWN);

  const atFifteen = advanceHazardState(state, graph, 15, FAST_CONFIG);
  assert.equal(atFifteen.zones.L5.smoke.status, SMOKE_STATUSES.ACTIVE);
  assert.equal(atFifteen.zones.L5.smoke.density, 0.6);
  assert.equal(atFifteen.zones.stair_west.smoke.status, SMOKE_STATUSES.ACTIVE);
  assert.equal(atFifteen.zones.stair_west.smoke.density, 0.1);
  assert.equal(atFifteen.zones.L1.smoke.status, SMOKE_STATUSES.UNKNOWN);

  const atTwenty = advanceHazardState(state, graph, 20, FAST_CONFIG);
  assert.equal(atTwenty.zones.L1.smoke.status, SMOKE_STATUSES.ACTIVE);
  assert.equal(atTwenty.zones.L1.smoke.density, 0.1);
});

test('closed connections block propagation and do not create uncertainty', () => {
  const graph = createGraphWithL5LinksStatus(CONNECTION_STATUSES.CLOSED);
  const state = createState();
  const result = advanceHazardState(state, graph, 20, FAST_CONFIG);

  assert.equal(result.zones.L5.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(result.zones.stair_west.fire.status, FIRE_STATUSES.NONE);
  assert.equal(result.zones.stair_east.fire.status, FIRE_STATUSES.NONE);
  assert.equal(result.zones.L5.smoke.status, SMOKE_STATUSES.ACTIVE);
  assert.equal(result.zones.stair_west.smoke.status, SMOKE_STATUSES.UNKNOWN);
  assert.equal(result.zones.stair_east.smoke.status, SMOKE_STATUSES.UNKNOWN);
});

test('restricted and unknown connections are conservatively reported as unknown', () => {
  const state = createState();

  [CONNECTION_STATUSES.RESTRICTED, CONNECTION_STATUSES.UNKNOWN].forEach((status) => {
    const graph = createGraphWithL5LinksStatus(status);
    const result = advanceHazardState(state, graph, 20, FAST_CONFIG);

    assert.equal(result.zones.L5.fire.status, FIRE_STATUSES.ACTIVE);
    assert.equal(result.zones.stair_west.fire.status, FIRE_STATUSES.UNKNOWN);
    assert.equal(result.zones.stair_east.fire.status, FIRE_STATUSES.UNKNOWN);
    assert.equal(result.zones.L1.fire.status, FIRE_STATUSES.UNKNOWN);
    assert.equal(result.zones.stair_west.smoke.status, SMOKE_STATUSES.UNKNOWN);

    Object.values(result.zones).forEach((zone) => {
      assert.equal(zone.risk.status, RISK_STATUSES.UNASSESSED);
      assert.equal(zone.risk.score, null);
      assert.equal(zone.exposure.status, EXPOSURE_STATUSES.UNKNOWN);
      assert.equal(zone.exposure.occupantCount, null);
    });

    Object.values(result.connections).forEach((connection) => {
      assert.equal(connection.routeStatus, ROUTE_STATUSES.UNKNOWN);
    });
  });
});

test('advanceHazardState is deterministic and immutable', () => {
  const graph = createGraph();
  const state = createState();
  const stateBefore = JSON.stringify(state);

  const first = advanceHazardState(state, graph, 20, FAST_CONFIG);
  const second = advanceHazardState(state, graph, 20, FAST_CONFIG);

  assert.deepEqual(first, second);
  assert.notEqual(first, state);
  assert.notEqual(first.zones, state.zones);
  assert.equal(JSON.stringify(state), stateBefore);

  const firstBefore = JSON.stringify(first);
  advanceHazardState(first, graph, 5, FAST_CONFIG);
  assert.equal(JSON.stringify(first), firstBefore);
  assert.equal(first.zones.L5.fire.source, 'scenario');
});

test('crossed transitions are consistent between one large dt and several small steps', () => {
  const graph = createGraph();
  const state = createState();

  const singleStep = advanceHazardState(state, graph, 20, FAST_CONFIG);

  let stepped = state;
  for (let index = 0; index < 4; index += 1) {
    stepped = advanceHazardState(stepped, graph, 5, FAST_CONFIG);
  }

  assert.deepEqual(stepped, singleStep);
});

test('default propagation config is explicit and frozen', () => {
  assert.equal(Object.isFrozen(DEFAULT_PROPAGATION_CONFIG), true);
  assert.equal(Object.isFrozen(DEFAULT_PROPAGATION_CONFIG.fire), true);
  assert.equal(Object.isFrozen(DEFAULT_PROPAGATION_CONFIG.smoke), true);
  assert.ok(DEFAULT_PROPAGATION_CONFIG.fire.spreadDelaySec > 0);
  assert.ok(DEFAULT_PROPAGATION_CONFIG.smoke.sourceDelaySec > 0);
});

test('Phase 2 gate: 60 seconds is equivalent as 1x60, 6x10, and 60x1 steps', () => {
  const graph = createGraph();
  const state = createState();

  const oneStep = advanceHazardState(state, graph, 60, GATE_CONFIG);
  const sixSteps = advanceInSteps(state, graph, 10, 6, GATE_CONFIG);
  const sixtySteps = advanceInSteps(state, graph, 1, 60, GATE_CONFIG);

  assert.equal(oneStep.timeSec, 60);
  assert.deepEqual(oneStep, sixSteps);
  assert.deepEqual(oneStep, sixtySteps);

  assert.equal(oneStep.zones.stair_west.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(oneStep.zones.stair_west.fire.sinceSec, 10);
  assert.equal(oneStep.zones.L1.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(oneStep.zones.L1.fire.sinceSec, 20);
  assert.equal(oneStep.zones.exit_south.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(oneStep.zones.exit_south.fire.sinceSec, 30);

  assertClose(oneStep.zones.L5.smoke.density, 0.6, 'L5 smoke density');
  assertClose(oneStep.zones.stair_west.smoke.density, 0.53, 'stair_west smoke density');
  assertClose(oneStep.zones.L1.smoke.density, 0.46, 'L1 smoke density');
  assertClose(oneStep.zones.exit_south.smoke.density, 0.39, 'exit_south smoke density');
});

test('Phase 2 gate: transitions occur exactly at configured deadlines', () => {
  const graph = createGraph();
  const state = createState();

  const beforeFire = advanceHazardState(state, graph, 4.999, FAST_CONFIG);
  assert.equal(beforeFire.zones.stair_west.fire.status, FIRE_STATUSES.PENDING);
  assert.equal(beforeFire.zones.stair_west.fire.sinceSec, null);
  assert.equal(beforeFire.zones.L5.smoke.status, SMOKE_STATUSES.UNKNOWN);

  const atFire = advanceHazardState(state, graph, 5, FAST_CONFIG);
  assert.equal(atFire.zones.stair_west.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atFire.zones.stair_west.fire.sinceSec, 5);

  const beforeFloors = advanceHazardState(state, graph, 9.999, FAST_CONFIG);
  assert.equal(beforeFloors.zones.L1.fire.status, FIRE_STATUSES.PENDING);
  assert.equal(beforeFloors.zones.L1.fire.startSec, 10);
  assert.equal(beforeFloors.zones.L5.smoke.status, SMOKE_STATUSES.UNKNOWN);

  const atFloors = advanceHazardState(state, graph, 10, FAST_CONFIG);
  assert.equal(atFloors.zones.L1.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atFloors.zones.L1.fire.sinceSec, 10);
  assert.equal(atFloors.zones.L5.smoke.status, SMOKE_STATUSES.ACTIVE);
  assert.equal(atFloors.zones.L5.smoke.density, 0.1);

  const beforeExits = advanceHazardState(state, graph, 14.999, FAST_CONFIG);
  assert.equal(beforeExits.zones.exit_south.fire.status, FIRE_STATUSES.PENDING);
  assert.equal(beforeExits.zones.exit_south.fire.startSec, 15);

  const atExits = advanceHazardState(state, graph, 15, FAST_CONFIG);
  assert.equal(atExits.zones.exit_south.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atExits.zones.exit_south.fire.sinceSec, 15);

  const crossed = advanceHazardState(
    advanceHazardState(state, graph, 4, FAST_CONFIG),
    graph,
    6,
    FAST_CONFIG
  );
  assert.deepEqual(crossed, advanceHazardState(state, graph, 10, FAST_CONFIG));
});

test('Phase 2 gate: state, graph, and scenario inputs are deeply immutable', () => {
  const rawGraph = createTowerGraph();
  const graph = loadBuilding(rawGraph);
  const scenario = JSON.parse(readFileSync(sampleScenarioPath, 'utf8'));
  const state = applyScenario(graph, scenario);

  const rawGraphBefore = JSON.stringify(rawGraph);
  const graphBefore = JSON.stringify(graph.data);
  const scenarioBefore = JSON.stringify(scenario);
  const stateBefore = JSON.stringify(state);

  const baseline = advanceHazardState(state, graph, 20, FAST_CONFIG);
  const result = advanceHazardState(state, graph, 20, FAST_CONFIG);
  const viaRawGraph = advanceHazardState(state, rawGraph, 20, FAST_CONFIG);

  assert.deepEqual(result, baseline);
  assert.deepEqual(viaRawGraph, baseline);
  assert.equal(JSON.stringify(rawGraph), rawGraphBefore);
  assert.equal(JSON.stringify(graph.data), graphBefore);
  assert.equal(JSON.stringify(scenario), scenarioBefore);
  assert.equal(JSON.stringify(state), stateBefore);

  assert.notEqual(result.zones, state.zones);
  assert.notEqual(result.zones.L5, state.zones.L5);
  assert.notEqual(result.zones.L5.fire, state.zones.L5.fire);
  assert.notEqual(result.zones.L5.risk, state.zones.L5.risk);
  assert.notEqual(result.zones.L5.exposure, state.zones.L5.exposure);
  assert.notEqual(result.connections, state.connections);
  assert.notEqual(
    result.connections.conn_L5_stair_west,
    state.connections.conn_L5_stair_west
  );

  result.zones.L5.fire.intensity = 0;
  result.zones.L5.risk.status = RISK_STATUSES.ASSESSED;
  result.zones.L5.exposure.status = EXPOSURE_STATUSES.ESTIMATED;
  result.connections.conn_L5_stair_west.routeStatus = ROUTE_STATUSES.PERMITTED;

  assert.equal(JSON.stringify(state), stateBefore);
  assert.equal(JSON.stringify(graph.data), graphBefore);
  assert.equal(JSON.stringify(rawGraph), rawGraphBefore);
  assert.equal(JSON.stringify(scenario), scenarioBefore);
  assert.deepEqual(advanceHazardState(state, graph, 20, FAST_CONFIG), baseline);
});

test('Phase 2 gate: scenario source metadata survives propagation', () => {
  const graph = createGraph();
  const scenario = JSON.parse(readFileSync(sampleScenarioPath, 'utf8'));
  const scenarioBefore = JSON.stringify(scenario);
  const state = applyScenario(graph, scenario);
  const initialSourceFire = structuredClone(state.zones.L5.fire);

  const result = advanceInSteps(state, graph, 10, 6, FAST_CONFIG);

  assert.equal(JSON.stringify(scenario), scenarioBefore);
  assert.deepEqual(result.zones.L5.fire, initialSourceFire);
  assert.equal(result.zones.L5.fire.source, 'scenario');
  assert.equal(result.zones.L5.fire.startSec, 0);
  assert.equal(result.zones.L5.fire.sinceSec, 0);

  assert.equal(result.zones.stair_west.fire.source, 'propagated');
  assert.equal(result.zones.stair_west.fire.startSec, 5);
  assert.equal(result.zones.stair_west.fire.sinceSec, 5);
  assert.notEqual(result.zones.stair_west.fire.source, result.zones.L5.fire.source);
});

test('Phase 2 gate: unknown and unassessed fields are preserved', () => {
  const graph = createGraph();
  const state = createState();
  const early = advanceHazardState(state, graph, 9, FAST_CONFIG);

  Object.values(early.zones).forEach((zone) => {
    assert.equal(zone.smoke.status, SMOKE_STATUSES.UNKNOWN);
    assert.equal(zone.smoke.density, null);
    assert.equal(zone.risk.status, RISK_STATUSES.UNASSESSED);
    assert.equal(zone.risk.score, null);
    assert.equal(zone.risk.level, null);
    assert.equal(zone.exposure.status, EXPOSURE_STATUSES.UNKNOWN);
    assert.equal(zone.exposure.occupantCount, null);
    assert.equal(zone.exposure.personSeconds, null);
  });

  Object.values(early.connections).forEach((connection) => {
    assert.equal(connection.routeStatus, ROUTE_STATUSES.UNKNOWN);
  });
});

test('Phase 2 gate: existing assessed, estimated, and routing fields are preserved', () => {
  const graph = createGraph();
  const state = createState();
  const risk = { status: RISK_STATUSES.ASSESSED, score: 0.75, level: 'high' };
  const exposure = {
    status: EXPOSURE_STATUSES.ESTIMATED,
    occupantCount: 12,
    personSeconds: 340
  };

  state.zones.L5.risk = risk;
  state.zones.L1.exposure = exposure;
  state.connections.conn_L5_stair_west.routeStatus = ROUTE_STATUSES.PROHIBITED;

  const result = advanceHazardState(state, graph, 20, FAST_CONFIG);

  assert.deepEqual(result.zones.L5.risk, risk);
  assert.deepEqual(result.zones.L1.exposure, exposure);
  assert.equal(
    result.connections.conn_L5_stair_west.routeStatus,
    ROUTE_STATUSES.PROHIBITED
  );
  assert.notEqual(result.zones.L5.risk, risk);
  assert.notEqual(result.zones.L1.exposure, exposure);
  assert.equal(result.zones.L5.fire.source, 'scenario');
});

test('Phase 2 gate: malformed inputs fail without mutating valid inputs', () => {
  const graph = createGraph();
  const state = createState();
  const graphBefore = JSON.stringify(graph.data);
  const stateBefore = JSON.stringify(state);

  const malformedStates = [
    null,
    {},
    { schemaVersion: 1, timeSec: 0, zones: {} },
    { schemaVersion: 2, timeSec: 0, zones: {}, connections: {} },
    { schemaVersion: 1, timeSec: -1, zones: {}, connections: {} },
    { schemaVersion: 1, timeSec: Number.NaN, zones: {}, connections: {} }
  ];

  malformedStates.forEach((malformedState) => {
    assert.throws(
      () => advanceHazardState(malformedState, graph, 1, FAST_CONFIG),
      /Hazard state/
    );
  });

  [undefined, null, {}, { schemaVersion: 1 }].forEach((malformedGraph) => {
    assert.throws(
      () => advanceHazardState(state, malformedGraph, 1, FAST_CONFIG),
      /Invalid building graph/
    );
  });

  [null, { fire: null }, { fire: { spreadDelaySec: -1 } }, { smoke: { sourceDelaySec: Number.NaN } }]
    .forEach((malformedConfig) => {
      assert.throws(
        () => advanceHazardState(state, graph, 1, malformedConfig),
        /Propagation config/
      );
    });

  const badSourceState = structuredClone(state);
  badSourceState.zones.L5.fire.startSec = -1;
  assert.throws(
    () => advanceHazardState(badSourceState, graph, 1, FAST_CONFIG),
    /Configured fire source/
  );

  assert.equal(JSON.stringify(graph.data), graphBefore);
  assert.equal(JSON.stringify(state), stateBefore);
});

test('Phase 2 gate: source with no outgoing connections does not leak hazard', () => {
  const rawGraph = createTowerGraph();
  rawGraph.connections = rawGraph.connections.filter(
    (connection) => connection.a !== 'L5' && connection.b !== 'L5'
  );
  const isolatedGraph = loadBuilding(rawGraph);
  const state = createState();
  const result = advanceHazardState(state, isolatedGraph, 60, FAST_CONFIG);

  assert.equal(result.zones.L5.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(result.zones.L5.smoke.status, SMOKE_STATUSES.ACTIVE);

  Object.entries(result.zones).forEach(([zoneId, zone]) => {
    if (zoneId === 'L5') return;
    assert.equal(zone.fire.status, FIRE_STATUSES.NONE);
    assert.equal(zone.fire.intensity, null);
    assert.equal(zone.smoke.status, SMOKE_STATUSES.UNKNOWN);
    assert.equal(zone.smoke.density, null);
  });
});

test('Phase 2 gate: multiple configured sources keep independent source metadata', () => {
  const graph = createGraph();
  const scenario = JSON.parse(readFileSync(sampleScenarioPath, 'utf8'));
  scenario.fires.push({
    id: 'fire_l1_office',
    zoneId: 'L1',
    startSec: 20,
    intensity: 0.3
  });
  const state = applyScenario(graph, scenario);

  const atTen = advanceHazardState(state, graph, 10, FAST_CONFIG);
  assert.equal(atTen.zones.L5.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atTen.zones.L1.fire.status, FIRE_STATUSES.PENDING);
  assert.equal(atTen.zones.L1.fire.source, 'scenario');
  assert.equal(atTen.zones.L1.fire.startSec, 20);
  assert.equal(atTen.zones.L1.fire.sinceSec, null);

  const atTwenty = advanceHazardState(state, graph, 20, FAST_CONFIG);
  assert.equal(atTwenty.zones.L1.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atTwenty.zones.L1.fire.source, 'scenario');
  assert.equal(atTwenty.zones.L1.fire.sinceSec, 20);

  const atSixty = advanceInSteps(state, graph, 10, 6, FAST_CONFIG);
  assert.equal(atSixty.zones.L5.fire.source, 'scenario');
  assert.equal(atSixty.zones.L1.fire.source, 'scenario');
  assert.equal(atSixty.zones.stair_west.fire.source, 'propagated');
});

test('Phase 2 gate: multiple source contributions retain earliest ignition time', () => {
  const graph = createGraph();
  const scenario = JSON.parse(readFileSync(sampleScenarioPath, 'utf8'));
  scenario.fires = [
    { id: 'fire_l5_office', zoneId: 'L5', startSec: 0, intensity: 0.9 },
    { id: 'fire_l1_office', zoneId: 'L1', startSec: 0, intensity: 0.2 }
  ];
  const state = applyScenario(graph, scenario);

  const atTen = advanceHazardState(state, graph, 10, FAST_CONFIG);
  assert.equal(atTen.zones.exit_south.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atTen.zones.exit_south.fire.sinceSec, 5);
  assert.equal(atTen.zones.exit_south.fire.startSec, 5);
  assertClose(atTen.zones.exit_south.fire.intensity, 0.1, 'exit_south early intensity');

  const atFifteen = advanceHazardState(state, graph, 15, FAST_CONFIG);
  assert.equal(atFifteen.zones.exit_south.fire.status, FIRE_STATUSES.ACTIVE);
  assert.equal(atFifteen.zones.exit_south.fire.sinceSec, 5);
  assert.equal(atFifteen.zones.exit_south.fire.startSec, 5);
  assertClose(atFifteen.zones.exit_south.fire.intensity, 0.6, 'exit_south late intensity');

  const stepped = advanceInSteps(state, graph, 5, 3, FAST_CONFIG);
  assert.deepEqual(stepped, atFifteen);
});

test('Phase 2 gate: advancement remains stable after scheduled transitions finish', () => {
  const graph = createGraph();
  const state = createState();
  const atSixty = advanceHazardState(state, graph, 60, FAST_CONFIG);
  const later = advanceHazardState(atSixty, graph, 60, FAST_CONFIG);

  assert.equal(later.timeSec, 120);
  assert.equal(later.zones.L5.fire.source, 'scenario');

  Object.entries(atSixty.zones).forEach(([zoneId, zone]) => {
    assert.equal(zone.fire.status, FIRE_STATUSES.ACTIVE);
    assert.deepEqual(later.zones[zoneId].fire, zone.fire);
    assert.equal(zone.smoke.status, SMOKE_STATUSES.ACTIVE);
    assert.equal(zone.smoke.density, 1);
    assert.deepEqual(later.zones[zoneId].smoke, zone.smoke);
  });
});
