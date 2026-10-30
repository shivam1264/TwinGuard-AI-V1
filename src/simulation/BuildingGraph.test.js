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
  ZONE_TYPES,
  applyScenario,
  createTowerGraph,
  loadBuilding,
  loadScenario,
  validateBuilding,
  validateScenario
} from './BuildingGraph.js';

const sampleScenarioPath = new URL('./scenarios/sample-fire.json', import.meta.url);

function readSampleScenario() {
  return JSON.parse(readFileSync(sampleScenarioPath, 'utf8'));
}

function createGraph() {
  return loadBuilding(createTowerGraph());
}

const floorIds = Array.from({ length: 10 }, (_, index) => `L${index + 1}`);
const expectedZoneIds = [
  ...floorIds,
  'stair_west',
  'stair_east',
  'exit_west',
  'exit_east',
  'exit_south'
].sort();

const floorStairConnectionIds = floorIds.flatMap((floorId) => [
  `conn_${floorId}_stair_west`,
  `conn_${floorId}_stair_east`
]);

test('createTowerGraph creates the expected 15 zones and metadata', () => {
  const rawGraph = createTowerGraph();

  assert.equal(rawGraph.schemaVersion, 1);
  assert.equal(rawGraph.floorCount, 10);
  assert.equal(rawGraph.floorHeightM, 3.8);
  assert.equal(rawGraph.zones.length, 15);
  assert.deepEqual(rawGraph.zones.map((zone) => zone.id).sort(), expectedZoneIds);
  assert.equal(new Set(rawGraph.zones.map((zone) => zone.id)).size, rawGraph.zones.length);
  assert.match(rawGraph.provenance.exitLoadThresholds, /CrowdOptimizer\.js/);
  assert.match(rawGraph.provenance.exitLoadThresholds, /server\/index\.js/);
});

test('graph exposes the actual tower topology', () => {
  const graph = createGraph();

  assert.equal(graph.data.connections.length, 23);
  assert.deepEqual(graph.getNeighbors('exit_west'), ['stair_west']);
  assert.deepEqual(graph.getNeighbors('exit_east'), ['stair_east']);
  assert.deepEqual(graph.getNeighbors('exit_south'), ['L1']);
  assert.deepEqual(graph.getNeighbors('L5'), ['stair_east', 'stair_west']);
  assert.deepEqual(graph.getNeighbors('L1'), ['exit_south', 'stair_east', 'stair_west']);

  floorIds.forEach((floorId) => {
    assert.ok(graph.areConnected(floorId, 'stair_west'), `${floorId} must connect to stair_west`);
    assert.ok(graph.areConnected(floorId, 'stair_east'), `${floorId} must connect to stair_east`);
  });

  assert.equal(graph.areConnected('L1', 'L2'), false);
  assert.equal(graph.areConnected('L5', 'exit_south'), false);
  assert.equal(graph.areConnected('exit_west', 'exit_east'), false);
});

test('connections are unique, undirected, and have explicit semantics', () => {
  const graph = createGraph();
  const pairs = new Set();

  graph.data.connections.forEach((connection) => {
    assert.notEqual(connection.a, connection.b);
    assert.equal(connection.status, CONNECTION_STATUSES.OPEN);
    assert.equal(connection.weight, 1);
    assert.equal(connection.weightUnit, 'hops');
    assert.equal(connection.capacity, null);
    assert.equal(connection.capacityUnit, null);

    const pair = [connection.a, connection.b].sort().join('::');
    assert.equal(pairs.has(pair), false, `duplicate pair ${pair}`);
    pairs.add(pair);

    assert.ok(graph.areConnected(connection.a, connection.b));
    assert.ok(graph.areConnected(connection.b, connection.a));
    assert.ok(graph.getNeighbors(connection.a).includes(connection.b));
    assert.ok(graph.getNeighbors(connection.b).includes(connection.a));
  });
});

test('zone capacity provenance and stair metadata are explicit', () => {
  const graph = createGraph();

  assert.equal(graph.getZone('exit_west').capacity, 60);
  assert.equal(graph.getZone('exit_east').capacity, 60);
  assert.equal(graph.getZone('exit_south').capacity, 80);

  ['exit_west', 'exit_east', 'exit_south'].forEach((zoneId) => {
    const zone = graph.getZone(zoneId);
    assert.equal(zone.capacityUnit, 'persons');
    assert.equal(zone.capacityKind, 'simulation_load_threshold');
  });

  ['stair_west', 'stair_east'].forEach((zoneId) => {
    const zone = graph.getZone(zoneId);
    assert.equal(zone.type, ZONE_TYPES.STAIRWELL);
    assert.equal(zone.capacity, null);
    assert.equal(zone.floor, null);
    assert.deepEqual(zone.servesFloors, Array.from({ length: 10 }, (_, index) => index + 1));
  });
});

test('L1 reaches every zone through verified physical connections', () => {
  const graph = createGraph();
  const reachable = graph.reachableFrom('L1');

  assert.equal(reachable.length, 15);
  expectedZoneIds.forEach((zoneId) => {
    assert.ok(reachable.includes(zoneId), `${zoneId} must be reachable from L1`);
  });
  assert.deepEqual(graph.reachableFrom('exit_west'), reachable);
});

test('removing one stair link keeps a floor reachable and removing both isolates it', () => {
  const rawWithOneLinkRemoved = createTowerGraph();
  rawWithOneLinkRemoved.connections = rawWithOneLinkRemoved.connections.filter(
    (connection) => connection.id !== 'conn_L5_stair_west'
  );
  const oneLinkGraph = loadBuilding(rawWithOneLinkRemoved);

  assert.ok(oneLinkGraph.reachableFrom('L1').includes('L5'));

  const rawWithBothLinksRemoved = createTowerGraph();
  rawWithBothLinksRemoved.connections = rawWithBothLinksRemoved.connections.filter(
    (connection) => !['conn_L5_stair_west', 'conn_L5_stair_east'].includes(connection.id)
  );
  const isolatedGraph = loadBuilding(rawWithBothLinksRemoved);

  assert.equal(isolatedGraph.reachableFrom('L1').includes('L5'), false);
  assert.deepEqual(isolatedGraph.reachableFrom('L5'), ['L5']);
});

test('unknown zone queries are explicit', () => {
  const graph = createGraph();

  assert.equal(graph.getZone('missing_zone'), null);
  assert.equal(graph.getConnection('missing_connection'), null);
  assert.throws(() => graph.getNeighbors('missing_zone'), /Unknown zone/);
  assert.throws(() => graph.areConnected('L1', 'missing_zone'), /Unknown zone/);
  assert.throws(() => graph.reachableFrom('missing_zone'), /Unknown zone/);
});

test('validateBuilding accepts the generated graph', () => {
  const validation = validateBuilding(createTowerGraph());

  assert.deepEqual(validation, { valid: true, errors: [] });
});

test('validateBuilding rejects malformed graphs', () => {
  const cases = [
    (graph) => { graph.zones = graph.zones.slice(0, 7); },
    (graph) => { graph.zones.push({ ...graph.zones[graph.zones.length - 1], id: 'extra_zone' }); },
    (graph) => { graph.zones[1].id = graph.zones[0].id; },
    (graph) => { graph.connections[1].b = 'missing_zone'; },
    (graph) => { graph.connections[1].b = graph.connections[1].a; },
    (graph) => { graph.connections.push({ ...graph.connections[0], id: 'conn_duplicate_pair' }); },
    (graph) => { graph.connections[1].status = 'broken'; },
    (graph) => { graph.zones[0].bounds.minX = graph.zones[0].bounds.maxX; },
    (graph) => {
      const stair = graph.zones.find((zone) => zone.id === 'stair_west');
      stair.servesFloors.push(stair.servesFloors[0]);
    }
  ];

  cases.forEach((mutate, index) => {
    const rawGraph = createTowerGraph();
    mutate(rawGraph);

    const validation = validateBuilding(rawGraph);
    assert.equal(validation.valid, false, `case ${index} must be invalid`);
    assert.ok(validation.errors.length > 0);
  });

  assert.throws(() => loadBuilding({}), /Invalid building graph/);
});

test('sample scenario loads and validates', () => {
  const graph = createGraph();
  const scenario = readSampleScenario();

  assert.deepEqual(validateScenario(graph, scenario), { valid: true, errors: [] });

  const loaded = loadScenario(graph, scenario);
  assert.equal(loaded.id, 'sample-fire-l5');
  assert.equal(loaded.durationSec, 600);
  assert.equal(loaded.fires.length, 1);
  assert.deepEqual(loaded.fires[0], {
    id: 'fire_l5_office',
    zoneId: 'L5',
    startSec: 0,
    intensity: 0.6
  });
});

test('validateScenario rejects invalid or contradictory scenarios', () => {
  const graph = createGraph();
  const cases = [
    (scenario) => { delete scenario.id; },
    (scenario) => { scenario.fires[0].zoneId = 'missing_zone'; },
    (scenario) => { scenario.fires[0].startSec = -1; },
    (scenario) => { scenario.fires[0].startSec = 601; },
    (scenario) => { scenario.fires[0].intensity = 0; },
    (scenario) => { scenario.fires[0].intensity = 1.1; },
    (scenario) => { scenario.fires[0].intensity = NaN; },
    (scenario) => { scenario.fires = []; },
    (scenario) => { scenario.fires.push({ ...scenario.fires[0] }); },
    (scenario) => {
      scenario.fires.push({
        id: 'fire_l1',
        zoneId: 'L1',
        startSec: 0,
        intensity: 0.4
      });
      scenario.fires[1].id = scenario.fires[0].id;
    },
    (scenario) => { scenario.schemaVersion = 2; }
  ];

  cases.forEach((mutate, index) => {
    const scenario = structuredClone(readSampleScenario());
    mutate(scenario);

    const validation = validateScenario(graph, scenario);
    assert.equal(validation.valid, false, `case ${index} must be invalid`);
    assert.ok(validation.errors.length > 0);
  });

  assert.throws(() => loadScenario(graph, { id: 'bad' }), /Invalid scenario/);
});

test('applyScenario creates active and pending fire sources without simulated physics', () => {
  const graph = createGraph();
  const scenario = readSampleScenario();
  const state = applyScenario(graph, scenario);

  assert.equal(state.schemaVersion, 1);
  assert.equal(state.buildingId, 'twinguard-tower-10f');
  assert.equal(state.scenarioId, 'sample-fire-l5');
  assert.equal(state.timeSec, 0);
  assert.equal(state.modelId, 'scenario-initial');
  assert.equal(Object.keys(state.zones).length, 15);
  assert.equal(Object.keys(state.connections).length, 23);

  assert.deepEqual(state.zones.L5.fire, {
    status: FIRE_STATUSES.ACTIVE,
    intensity: 0.6,
    sinceSec: 0,
    startSec: 0,
    source: 'scenario'
  });

  floorIds.filter((floorId) => floorId !== 'L5').forEach((floorId) => {
    assert.equal(state.zones[floorId].fire.status, FIRE_STATUSES.NONE);
    assert.equal(state.zones[floorId].fire.intensity, null);
    assert.equal(state.zones[floorId].fire.source, null);
  });

  Object.values(state.zones).forEach((zone) => {
    assert.equal(zone.smoke.status, SMOKE_STATUSES.UNKNOWN);
    assert.equal(zone.smoke.density, null);
    assert.equal(zone.risk.status, RISK_STATUSES.UNASSESSED);
    assert.equal(zone.risk.score, null);
    assert.equal(zone.exposure.status, EXPOSURE_STATUSES.UNKNOWN);
    assert.equal(zone.exposure.occupantCount, null);
  });

  Object.values(state.connections).forEach((connection) => {
    assert.equal(connection.routeStatus, ROUTE_STATUSES.UNKNOWN);
  });

  const pendingScenario = readSampleScenario();
  pendingScenario.fires[0].startSec = 10;
  const pendingState = applyScenario(graph, pendingScenario);

  assert.equal(pendingState.zones.L5.fire.status, FIRE_STATUSES.PENDING);
  assert.equal(pendingState.zones.L5.fire.sinceSec, null);
  assert.equal(pendingState.zones.L5.fire.startSec, 10);
});

test('applyScenario is deterministic and immutable', () => {
  const graph = createGraph();
  const before = JSON.stringify(graph.data);
  const scenario = readSampleScenario();

  const firstState = applyScenario(graph, scenario);
  const secondState = applyScenario(graph, scenario);

  assert.deepEqual(firstState, secondState);
  assert.equal(JSON.stringify(graph.data), before);

  firstState.zones.L1.fire.status = FIRE_STATUSES.ACTIVE;
  firstState.connections.conn_L1_stair_west.routeStatus = ROUTE_STATUSES.PROHIBITED;

  assert.equal(JSON.stringify(graph.data), before);

  const thirdState = applyScenario(graph, scenario);
  assert.equal(thirdState.zones.L1.fire.status, FIRE_STATUSES.NONE);
  assert.equal(thirdState.connections.conn_L1_stair_west.routeStatus, ROUTE_STATUSES.UNKNOWN);
});
