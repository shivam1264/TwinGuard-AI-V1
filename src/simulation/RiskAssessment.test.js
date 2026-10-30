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
  ASSESSMENT_STATUSES,
  DEFAULT_RISK_CONFIG,
  RISK_LEVELS,
  RISK_MODEL_ID,
  assessRisk
} from './RiskAssessment.js';

const graph = loadBuilding(createTowerGraph());
const expectedZoneIds = graph.data.zones
  .map((zone) => zone.id)
  .sort((a, b) => a.localeCompare(b));

function zone(
  fire = { status: FIRE_STATUSES.NONE, intensity: null },
  smoke = { status: SMOKE_STATUSES.NONE, density: null }
) {
  return { fire, smoke };
}

function createState(overrides = {}) {
  const zones = {};

  graph.data.zones.forEach((buildingZone) => {
    zones[buildingZone.id] = zone();
  });

  Object.assign(zones, overrides);

  return {
    schemaVersion: HAZARD_SCHEMA_VERSION,
    buildingId: graph.data.id,
    scenarioId: 'risk-test',
    timeSec: 0,
    zones
  };
}

test('assesses known no-hazard zones as low with full coverage', () => {
  const result = assessRisk(createState(), graph);

  assert.equal(result.modelId, RISK_MODEL_ID);
  assert.equal(result.buildingId, graph.data.id);
  assert.equal(result.scenarioId, 'risk-test');
  assert.equal(result.timeSec, 0);
  assert.deepEqual(result.summary, {
    zoneCount: 15,
    assessedCount: 15,
    partialCount: 0,
    unknownCount: 0
  });
  assert.deepEqual(Object.keys(result.zones), expectedZoneIds);

  assert.deepEqual(result.zones.L1, {
    zoneId: 'L1',
    status: ASSESSMENT_STATUSES.ASSESSED,
    complete: true,
    score: 0,
    level: RISK_LEVELS.LOW,
    fire: {
      status: FIRE_STATUSES.NONE,
      known: true,
      intensity: null,
      score: 0,
      level: RISK_LEVELS.LOW
    },
    smoke: {
      status: SMOKE_STATUSES.NONE,
      known: true,
      density: null,
      score: 0,
      level: RISK_LEVELS.LOW
    }
  });
});

test('computes default fire, smoke, and combined scores', () => {
  const fireOnly = assessRisk(
    createState({ L5: zone({ status: FIRE_STATUSES.ACTIVE, intensity: 0.6 }) }),
    graph
  ).zones.L5;

  assert.equal(fireOnly.fire.score, 60);
  assert.equal(fireOnly.fire.level, RISK_LEVELS.HIGH);
  assert.equal(fireOnly.smoke.score, 0);
  assert.equal(fireOnly.score, 36);
  assert.equal(fireOnly.level, RISK_LEVELS.MODERATE);

  const smokeOnly = assessRisk(
    createState({ L5: zone(undefined, { status: SMOKE_STATUSES.ACTIVE, density: 0.8 }) }),
    graph
  ).zones.L5;

  assert.equal(smokeOnly.smoke.score, 80);
  assert.equal(smokeOnly.smoke.level, RISK_LEVELS.CRITICAL);
  assert.equal(smokeOnly.fire.score, 0);
  assert.equal(smokeOnly.score, 32);
  assert.equal(smokeOnly.level, RISK_LEVELS.MODERATE);

  const combined = assessRisk(
    createState({
      L5: zone(
        { status: FIRE_STATUSES.ACTIVE, intensity: 0.8 },
        { status: SMOKE_STATUSES.ACTIVE, density: 0.5 }
      )
    }),
    graph
  ).zones.L5;

  assert.equal(combined.fire.score, 80);
  assert.equal(combined.fire.level, RISK_LEVELS.CRITICAL);
  assert.equal(combined.smoke.score, 50);
  assert.equal(combined.smoke.level, RISK_LEVELS.HIGH);
  assert.equal(combined.score, 68);
  assert.equal(combined.level, RISK_LEVELS.HIGH);
});

test('applies the pending fire factor without treating pending as active', () => {
  const state = createState({
    L5: zone({ status: FIRE_STATUSES.PENDING, intensity: 0.8 })
  });

  const result = assessRisk(state, graph).zones.L5;
  assert.equal(result.fire.score, 20);
  assert.equal(result.fire.level, RISK_LEVELS.LOW);
  assert.equal(result.score, 12);
  assert.equal(result.level, RISK_LEVELS.LOW);

  const custom = assessRisk(state, graph, { pendingFireFactor: 0.5 }).zones.L5;
  assert.equal(custom.fire.score, 40);
  assert.equal(custom.fire.level, RISK_LEVELS.MODERATE);
  assert.equal(custom.score, 24);
  assert.equal(custom.level, RISK_LEVELS.LOW);
});

test('keeps unknown components unknown instead of scoring them as zero', () => {
  const partialFire = assessRisk(
    createState({
      L1: zone(
        { status: FIRE_STATUSES.ACTIVE, intensity: 0.6 },
        { status: SMOKE_STATUSES.UNKNOWN, density: null }
      )
    }),
    graph
  ).zones.L1;

  assert.equal(partialFire.status, ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(partialFire.complete, false);
  assert.equal(partialFire.score, null);
  assert.equal(partialFire.level, null);
  assert.equal(partialFire.fire.score, 60);
  assert.deepEqual(partialFire.smoke, {
    status: SMOKE_STATUSES.UNKNOWN,
    known: false,
    density: null,
    score: null,
    level: null
  });

  const partialSmoke = assessRisk(
    createState({
      L1: zone(
        { status: FIRE_STATUSES.UNKNOWN, intensity: null },
        { status: SMOKE_STATUSES.ACTIVE, density: 0.5 }
      )
    }),
    graph
  ).zones.L1;

  assert.equal(partialSmoke.status, ASSESSMENT_STATUSES.PARTIAL);
  assert.equal(partialSmoke.score, null);
  assert.equal(partialSmoke.smoke.score, 50);

  const unknown = assessRisk(
    createState({
      L2: zone(
        { status: FIRE_STATUSES.UNKNOWN, intensity: null },
        { status: SMOKE_STATUSES.UNKNOWN, density: null }
      )
    }),
    graph
  ).zones.L2;

  assert.equal(unknown.status, ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(unknown.complete, false);
  assert.equal(unknown.score, null);
  assert.equal(unknown.level, null);
});

test('treats missing zone entries and missing components as unknown', () => {
  const state = createState();
  delete state.zones.L1;
  state.zones.L2 = {};

  const result = assessRisk(state, graph);

  assert.equal(result.zones.L1.status, ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(result.zones.L1.fire.status, null);
  assert.equal(result.zones.L1.smoke.status, null);
  assert.equal(result.zones.L2.status, ASSESSMENT_STATUSES.UNKNOWN);
  assert.equal(result.zones.L2.fire.status, null);
  assert.equal(result.zones.L2.smoke.status, null);
});

test('summarizes assessed, partial, and unknown zones', () => {
  const result = assessRisk(
    createState({
      L1: zone(
        { status: FIRE_STATUSES.ACTIVE, intensity: 0.6 },
        { status: SMOKE_STATUSES.UNKNOWN, density: null }
      ),
      L2: zone(
        { status: FIRE_STATUSES.UNKNOWN, intensity: null },
        { status: SMOKE_STATUSES.UNKNOWN, density: null }
      )
    }),
    graph
  );

  assert.deepEqual(result.summary, {
    zoneCount: 15,
    assessedCount: 13,
    partialCount: 1,
    unknownCount: 1
  });
});

test('classifies scores at exact default thresholds', () => {
  const config = { weights: { fire: 1, smoke: 0 } };
  const cases = [
    [0.2499, 24.99, RISK_LEVELS.LOW],
    [0.25, 25, RISK_LEVELS.MODERATE],
    [0.4999, 49.99, RISK_LEVELS.MODERATE],
    [0.5, 50, RISK_LEVELS.HIGH],
    [0.7499, 74.99, RISK_LEVELS.HIGH],
    [0.75, 75, RISK_LEVELS.CRITICAL],
    [1, 100, RISK_LEVELS.CRITICAL]
  ];

  cases.forEach(([intensity, expectedScore, expectedLevel]) => {
    const result = assessRisk(
      createState({ L1: zone({ status: FIRE_STATUSES.ACTIVE, intensity }) }),
      graph,
      config
    ).zones.L1;

    assert.equal(result.fire.score, expectedScore);
    assert.equal(result.score, expectedScore);
    assert.equal(result.level, expectedLevel);
  });
});

test('supports custom thresholds', () => {
  const config = {
    weights: { fire: 1, smoke: 0 },
    thresholds: { moderate: 10, high: 20, critical: 30 }
  };
  const cases = [
    [0.0999, 9.99, RISK_LEVELS.LOW],
    [0.1, 10, RISK_LEVELS.MODERATE],
    [0.2, 20, RISK_LEVELS.HIGH],
    [0.3, 30, RISK_LEVELS.CRITICAL]
  ];

  cases.forEach(([intensity, expectedScore, expectedLevel]) => {
    const result = assessRisk(
      createState({ L1: zone({ status: FIRE_STATUSES.ACTIVE, intensity }) }),
      graph,
      config
    ).zones.L1;

    assert.equal(result.score, expectedScore);
    assert.equal(result.level, expectedLevel);
  });
});

test('normalizes custom weights and keeps scores within 0-100', () => {
  const weighted = assessRisk(
    createState({
      L1: zone(
        { status: FIRE_STATUSES.ACTIVE, intensity: 0.8 },
        { status: SMOKE_STATUSES.ACTIVE, density: 0.5 }
      )
    }),
    graph,
    { weights: { fire: 2, smoke: 1 } }
  ).zones.L1;

  assert.equal(weighted.fire.score, 80);
  assert.equal(weighted.smoke.score, 50);
  assert.equal(weighted.score, 70);

  const assessments = [
    assessRisk(
      createState({
        L1: zone(
          { status: FIRE_STATUSES.ACTIVE, intensity: 0 },
          { status: SMOKE_STATUSES.ACTIVE, density: 0 }
        )
      }),
      graph
    ).zones.L1,
    assessRisk(
      createState({
        L1: zone(
          { status: FIRE_STATUSES.ACTIVE, intensity: 1 },
          { status: SMOKE_STATUSES.ACTIVE, density: 2 }
        )
      }),
      graph
    ).zones.L1,
    assessRisk(
      createState({
        L1: zone(
          { status: FIRE_STATUSES.PENDING, intensity: 1 },
          { status: SMOKE_STATUSES.ACTIVE, density: 0.25 }
        )
      }),
      graph
    ).zones.L1
  ];

  assessments.forEach((assessment) => {
    [assessment.fire.score, assessment.smoke.score, assessment.score].forEach((score) => {
      assert.ok(Number.isFinite(score));
      assert.ok(score >= 0 && score <= 100);
    });
  });
});

test('increasing fire or smoke severity never reduces risk', () => {
  const fireAssessments = [0, 0.1, 0.25, 0.5, 0.75, 1].map((intensity) => assessRisk(
    createState({ L1: zone({ status: FIRE_STATUSES.ACTIVE, intensity }) }),
    graph
  ).zones.L1);
  const smokeAssessments = [0, 0.1, 0.25, 0.5, 0.75, 1, 2].map((density) => assessRisk(
    createState({ L1: zone(undefined, { status: SMOKE_STATUSES.ACTIVE, density }) }),
    graph
  ).zones.L1);

  [fireAssessments, smokeAssessments].forEach((assessments) => {
    assessments.slice(1).forEach((assessment, index) => {
      const previous = assessments[index];

      assert.ok(assessment.fire.score >= previous.fire.score);
      assert.ok(assessment.smoke.score >= previous.smoke.score);
      assert.ok(assessment.score >= previous.score);
    });
  });
});

test('caps smoke severity and rounds combined scores to two decimals', () => {
  const rounded = assessRisk(
    createState({
      L1: zone(
        { status: FIRE_STATUSES.ACTIVE, intensity: 0.3333 },
        { status: SMOKE_STATUSES.ACTIVE, density: 0.6667 }
      )
    }),
    graph
  ).zones.L1;

  assert.equal(rounded.fire.score, 33.33);
  assert.equal(rounded.smoke.score, 66.67);
  assert.equal(rounded.score, 46.67);
  assert.equal(rounded.level, RISK_LEVELS.MODERATE);

  const capped = assessRisk(
    createState({
      L1: zone(undefined, { status: SMOKE_STATUSES.ACTIVE, density: 2 })
    }),
    graph
  ).zones.L1;

  assert.equal(capped.smoke.score, 100);
  assert.equal(capped.smoke.level, RISK_LEVELS.CRITICAL);
  assert.equal(capped.score, 40);
  assert.equal(capped.level, RISK_LEVELS.MODERATE);
});

test('rejects malformed state and unknown zones', () => {
  const malformedStates = [
    null,
    {},
    { schemaVersion: 2, timeSec: 0, zones: {} },
    { schemaVersion: HAZARD_SCHEMA_VERSION, timeSec: -1, zones: {} },
    { schemaVersion: HAZARD_SCHEMA_VERSION, timeSec: Number.NaN, zones: {} },
    { schemaVersion: HAZARD_SCHEMA_VERSION, timeSec: 0, zones: [] }
  ];

  malformedStates.forEach((state) => {
    assert.throws(() => assessRisk(state, graph), /Hazard state/);
  });

  assert.throws(
    () => assessRisk(createState({ missing_zone: {} }), graph),
    /unknown zone/
  );
  assert.throws(() => assessRisk(createState(), {}), /Invalid building graph/);
});

test('rejects invalid component statuses and numeric values', () => {
  const cases = [
    zone({ status: 'broken', intensity: 0.2 }),
    zone({ status: FIRE_STATUSES.ACTIVE, intensity: -0.1 }),
    zone({ status: FIRE_STATUSES.ACTIVE, intensity: 1.1 }),
    zone({ status: FIRE_STATUSES.ACTIVE, intensity: Number.NaN }),
    zone({ status: FIRE_STATUSES.PENDING, intensity: null }),
    zone(undefined, { status: 'broken', density: 0.2 }),
    zone(undefined, { status: SMOKE_STATUSES.ACTIVE, density: -0.1 }),
    zone(undefined, { status: SMOKE_STATUSES.ACTIVE, density: Number.NaN }),
    zone(undefined, { status: SMOKE_STATUSES.ACTIVE, density: undefined })
  ];

  cases.forEach((invalidZone, index) => {
    assert.throws(
      () => assessRisk(createState({ L1: invalidZone }), graph),
      /Invalid hazard state/,
      `case ${index} must be invalid`
    );
  });
});

test('rejects malformed risk configuration', () => {
  const state = createState();
  const cases = [
    null,
    [],
    { weights: null },
    { weights: [] },
    { weights: { fire: -1 } },
    { weights: { fire: Number.NaN } },
    { weights: { fire: '1' } },
    { weights: { fire: 0, smoke: 0 } },
    { pendingFireFactor: -0.1 },
    { pendingFireFactor: 1.1 },
    { pendingFireFactor: Number.NaN },
    { smokeDensityMax: 0 },
    { smokeDensityMax: -1 },
    { smokeDensityMax: Number.NaN },
    { thresholds: null },
    { thresholds: [] },
    { thresholds: { moderate: 0 } },
    { thresholds: { high: 25 } },
    { thresholds: { critical: 50 } },
    { thresholds: { critical: 101 } },
    { thresholds: { moderate: Number.NaN } }
  ];

  cases.forEach((config, index) => {
    assert.throws(
      () => assessRisk(state, graph, config),
      /Risk assessment config/,
      `case ${index} must be invalid`
    );
  });
});

test('is deterministic and does not mutate state, graph, or config', () => {
  const state = createState({
    L5: zone(
      { status: FIRE_STATUSES.ACTIVE, intensity: 0.6 },
      { status: SMOKE_STATUSES.ACTIVE, density: 0.5 }
    )
  });
  const config = {
    weights: { fire: 0.7, smoke: 0.3 },
    thresholds: { moderate: 20, high: 40, critical: 60 }
  };
  const stateBefore = JSON.stringify(state);
  const graphBefore = JSON.stringify(graph.data);
  const configBefore = JSON.stringify(config);

  const first = assessRisk(state, graph, config);
  const second = assessRisk(state, graph, config);

  assert.deepEqual(first, second);
  assert.notEqual(first, state);
  assert.notEqual(first.zones, state.zones);
  assert.notEqual(first.zones.L5.fire, state.zones.L5.fire);
  assert.notEqual(first.zones.L5.smoke, state.zones.L5.smoke);
  assert.equal(JSON.stringify(state), stateBefore);
  assert.equal(JSON.stringify(graph.data), graphBefore);
  assert.equal(JSON.stringify(config), configBefore);

  first.zones.L5.fire.score = 999;
  first.zones.L5.smoke.density = 999;

  assert.equal(JSON.stringify(state), stateBefore);
  assert.deepEqual(assessRisk(state, graph, config), second);
});

test('accepts a raw graph and falls back to graph metadata', () => {
  const state = createState();
  delete state.buildingId;
  delete state.scenarioId;

  const fallback = assessRisk(state, createTowerGraph());
  assert.equal(fallback.buildingId, graph.data.id);
  assert.equal(fallback.scenarioId, null);

  state.buildingId = 'custom-building';
  state.scenarioId = 'custom-scenario';

  const explicit = assessRisk(state, graph);
  assert.equal(explicit.buildingId, 'custom-building');
  assert.equal(explicit.scenarioId, 'custom-scenario');
});

test('exposes explicit frozen risk defaults', () => {
  assert.equal(Object.isFrozen(DEFAULT_RISK_CONFIG), true);
  assert.equal(Object.isFrozen(DEFAULT_RISK_CONFIG.weights), true);
  assert.equal(Object.isFrozen(DEFAULT_RISK_CONFIG.thresholds), true);
  assert.deepEqual(ASSESSMENT_STATUSES, {
    ASSESSED: 'assessed',
    PARTIAL: 'partial',
    UNKNOWN: 'unknown'
  });
  assert.deepEqual(RISK_LEVELS, {
    LOW: 'low',
    MODERATE: 'moderate',
    HIGH: 'high',
    CRITICAL: 'critical'
  });
});
