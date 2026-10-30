import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONNECTION_STATUSES,
  FIRE_STATUSES,
  HAZARD_SCHEMA_VERSION,
  ROUTE_STATUSES,
  SMOKE_STATUSES,
  createTowerGraph,
  loadBuilding
} from './BuildingGraph.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import {
  ROUTE_CONDITIONS,
  ROUTING_CONTEXT_STATUSES,
  buildRoutingHazardContext,
  createRoutingHazardPolicy,
  getExitRouteCondition
} from './RoutingHazardAdapter.js';

function createGraph() {
  return loadBuilding(createTowerGraph());
}

function createHazardState(graph, options = {}) {
  const zones = {};
  const connections = {};

  graph.data.zones.forEach((zone) => {
    zones[zone.id] = options.zones?.[zone.id] || {
      fire: { status: FIRE_STATUSES.NONE, intensity: null },
      smoke: { status: SMOKE_STATUSES.NONE, density: null }
    };
  });

  graph.data.connections.forEach((connection) => {
    connections[connection.id] = {
      connectionId: connection.id,
      routeStatus: options.routeStatuses?.[connection.id] || ROUTE_STATUSES.UNKNOWN
    };
  });

  return {
    schemaVersion: HAZARD_SCHEMA_VERSION,
    buildingId: options.buildingId || graph.data.id,
    scenarioId: 'routing-test',
    timeSec: options.timeSec ?? 0,
    zones,
    connections
  };
}

function zone(fireStatus = FIRE_STATUSES.NONE, smokeStatus = SMOKE_STATUSES.NONE) {
  return {
    fire: { status: fireStatus, intensity: fireStatus === FIRE_STATUSES.NONE ? null : 0.6 },
    smoke: { status: smokeStatus, density: smokeStatus === SMOKE_STATUSES.ACTIVE ? 0.3 : null }
  };
}

function createOptimizer() {
  return new CrowdOptimizer(
    {},
    { findPath: () => [{ x: 0, z: 0 }] }
  );
}

test('builds complete permitted routes from fully known no-hazard state', () => {
  const graph = createGraph();
  const context = buildRoutingHazardContext({
    graph,
    hazardState: createHazardState(graph),
    expectedTimeSec: 0
  });

  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.COMPLETE);
  assert.equal(context.availability.available, true);

  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PERMITTED);
  assert.deepEqual(route.zoneIds, ['L5', 'stair_west', 'exit_west']);
  assert.deepEqual(route.reasons, []);
  assert.equal(route.cost, 0);
});

test('active and pending fire make affected routes prohibited and penalized', () => {
  const graph = createGraph();
  const activeState = createHazardState(graph, {
    zones: { L5: zone(FIRE_STATUSES.ACTIVE) }
  });
  const activeContext = buildRoutingHazardContext({ graph, hazardState: activeState });

  assert.equal(getExitRouteCondition(activeContext, 5, 'exit_west').condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.equal(getExitRouteCondition(activeContext, 5, 'exit_east').condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.equal(getExitRouteCondition(activeContext, 4, 'exit_west').condition, ROUTE_CONDITIONS.PERMITTED);

  const pendingState = createHazardState(graph, {
    zones: { L6: zone(FIRE_STATUSES.PENDING) }
  });
  const pendingContext = buildRoutingHazardContext({ graph, hazardState: pendingState });

  assert.equal(getExitRouteCondition(pendingContext, 6, 'exit_west').condition, ROUTE_CONDITIONS.PENALIZED);
});

test('smoke, closed connections, and unknown statuses stay conservative', () => {
  const graph = createGraph();
  const smokeState = createHazardState(graph, {
    zones: { L7: zone(FIRE_STATUSES.NONE, SMOKE_STATUSES.ACTIVE) }
  });
  const smokeContext = buildRoutingHazardContext({ graph, hazardState: smokeState });

  assert.equal(getExitRouteCondition(smokeContext, 7, 'exit_west').condition, ROUTE_CONDITIONS.PENALIZED);

  const closedGraph = createGraph();
  closedGraph.getConnection('conn_L6_stair_west').status = CONNECTION_STATUSES.CLOSED;
  const closedContext = buildRoutingHazardContext({
    graph: closedGraph,
    hazardState: createHazardState(closedGraph)
  });

  assert.equal(getExitRouteCondition(closedContext, 6, 'exit_west').condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.equal(getExitRouteCondition(closedContext, 6, 'exit_east').condition, ROUTE_CONDITIONS.PERMITTED);

  const prohibitedState = createHazardState(graph, {
    routeStatuses: { conn_L8_stair_east: ROUTE_STATUSES.PROHIBITED }
  });
  const prohibitedContext = buildRoutingHazardContext({ graph, hazardState: prohibitedState });

  assert.equal(getExitRouteCondition(prohibitedContext, 8, 'exit_east').condition, ROUTE_CONDITIONS.PROHIBITED);

  const unknownState = createHazardState(graph, {
    zones: { L9: zone(FIRE_STATUSES.NONE, SMOKE_STATUSES.UNKNOWN) }
  });
  const unknownContext = buildRoutingHazardContext({ graph, hazardState: unknownState });

  assert.equal(unknownContext.status, ROUTING_CONTEXT_STATUSES.PARTIAL);
  assert.equal(getExitRouteCondition(unknownContext, 9, 'exit_west').condition, ROUTE_CONDITIONS.UNKNOWN);
});

test('unavailable hazard state falls back without making safety claims', () => {
  const graph = createGraph();
  const mismatch = buildRoutingHazardContext({
    graph,
    hazardState: createHazardState(graph, { buildingId: 'other-building' })
  });
  const stale = buildRoutingHazardContext({
    graph,
    hazardState: createHazardState(graph, { timeSec: 0 }),
    expectedTimeSec: 61
  });
  const malformed = buildRoutingHazardContext({
    graph,
    hazardState: { ...createHazardState(graph), schemaVersion: 2 }
  });

  [mismatch, stale, malformed].forEach((context) => {
    assert.equal(context.status, ROUTING_CONTEXT_STATUSES.UNAVAILABLE);
    assert.equal(context.availability.available, false);
    assert.equal(getExitRouteCondition(context, 5, 'exit_west'), null);
  });
});

test('risk assessment adds relative cost without changing route condition', () => {
  const graph = createGraph();
  const context = buildRoutingHazardContext({
    graph,
    hazardState: createHazardState(graph),
    riskAssessment: {
      zones: { L5: { score: 80 } }
    },
    policy: createRoutingHazardPolicy({ riskCostPerPoint: 0.5 })
  });

  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PERMITTED);
  assert.equal(route.riskScore, 80);
  assert.equal(route.riskCost, 40);
  assert.equal(route.cost, 40);
});

test('optimizer excludes prohibited exits and keeps baseline behavior without context', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, {
    zones: { stair_west: zone(FIRE_STATUSES.ACTIVE) }
  });
  const context = buildRoutingHazardContext({ graph, hazardState });
  const optimizer = createOptimizer();
  const agent = {
    id: 'agent_1',
    roomId: 'f5_r1',
    floor: 5,
    x: 0,
    y: 15.25,
    z: 0
  };

  const hazardResult = optimizer.optimizeRoutes([agent], [], { routingContext: context });
  assert.equal(hazardResult.assignments.length, 1);
  assert.equal(hazardResult.assignments[0].exitId, 'exit_east');
  assert.equal(hazardResult.assignments[0].hazardAware, true);
  assert.equal(hazardResult.assignments[0].routeEvaluation, 'hazard-aware');
  assert.equal(hazardResult.requiresOperatorReview, false);

  const baselineResult = optimizer.optimizeRoutes([agent]);
  assert.equal(baselineResult.assignments.length, 1);
  assert.equal(baselineResult.assignments[0].hazardAware, false);
  assert.equal(baselineResult.assignments[0].routeEvaluation, 'unverified');
  assert.equal(baselineResult.routeEvaluation, 'unverified');
});

test('optimizer retains a baseline route with operator review when all exits are prohibited', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, {
    zones: { L5: zone(FIRE_STATUSES.ACTIVE) }
  });
  const context = buildRoutingHazardContext({ graph, hazardState });
  const optimizer = createOptimizer();
  const agent = {
    id: 'agent_1',
    roomId: 'f5_r1',
    floor: 5,
    x: 0,
    y: 15.25,
    z: 0
  };

  const result = optimizer.optimizeRoutes([agent], [], { routingContext: context });

  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0].noPermittedCandidate, true);
  assert.equal(result.assignments[0].requiresOperatorReview, true);
  assert.equal(result.requiresOperatorReview, true);
});

test('connection precedence: unknown graph status yields unknown condition even if hazard has no prohibition', () => {
  const graph = createGraph();
  // Set a connection to UNKNOWN in the graph
  graph.getConnection('conn_L5_stair_west').status = CONNECTION_STATUSES.UNKNOWN;
  const hazardState = createHazardState(graph);
  const context = buildRoutingHazardContext({ graph, hazardState });
  const route = getExitRouteCondition(context, 5, 'exit_west');
  // The route includes conn_L5_stair_west which is UNKNOWN in graph, hazard routeStatus UNKNOWN -> condition UNKNOWN
  assert.equal(route.condition, ROUTE_CONDITIONS.UNKNOWN);
  assert.ok(route.reasons.some(r => r.includes('connection:unknown-graph-status')));
});

test('staleness validation: fresh when expectedTimeSec provided and within maxHazardAgeSec', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, { timeSec: 100 });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 150 });
  assert.equal(context.availability.freshness, 'fresh');
  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.COMPLETE);
});

test('staleness validation: stale when hazardState older than maxHazardAgeSec -> unavailable', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, { timeSec: 10 });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 100 }); // default maxHazardAgeSec = 60
  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.UNAVAILABLE);
  assert.equal(context.availability.reason, 'hazard-state:stale');
  assert.equal(context.availability.freshness, 'stale');
});

test('staleness validation: future hazardState (timeSec > expectedTimeSec) -> unavailable', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, { timeSec: 200 });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 100 });
  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.UNAVAILABLE);
  assert.equal(context.availability.reason, 'hazard-state:future');
  assert.equal(context.availability.freshness, 'stale');
});

test('staleness validation: missing expectedTimeSec reports freshness unknown and partial status', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, { timeSec: 0 });
  const context = buildRoutingHazardContext({ graph, hazardState }); // no expectedTimeSec
  assert.equal(context.availability.freshness, 'unknown');
  assert.equal(context.availability.freshnessReason, 'hazard-state:freshness-unknown');
  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.PARTIAL);
});

test('unknown smoke yields partial status and unknown condition with cost', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, {
    zones: { L3: zone(FIRE_STATUSES.NONE, SMOKE_STATUSES.UNKNOWN) }
  });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.PARTIAL);
  const route = getExitRouteCondition(context, 3, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.UNKNOWN);
  assert.ok(route.cost > 0);
  assert.ok(route.reasons.some(r => r.includes('smoke:unknown')));
});

test('connection precedence: Graph UNKNOWN + hazard PERMITTED -> UNKNOWN', () => {
  const graph = createGraph();
  graph.getConnection('conn_L5_stair_west').status = CONNECTION_STATUSES.UNKNOWN;
  const hazardState = createHazardState(graph, {
    routeStatuses: { conn_L5_stair_west: ROUTE_STATUSES.PERMITTED }
  });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.UNKNOWN);
  assert.ok(route.reasons.some(r => r.includes('connection:unknown-graph-status')));
});

test('connection precedence: Graph RESTRICTED + hazard PERMITTED -> PENALIZED', () => {
  const graph = createGraph();
  graph.getConnection('conn_L5_stair_west').status = CONNECTION_STATUSES.RESTRICTED;
  const hazardState = createHazardState(graph, {
    routeStatuses: { conn_L5_stair_west: ROUTE_STATUSES.PERMITTED }
  });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PENALIZED);
  assert.ok(route.reasons.some(r => r.includes('connection:restricted')));
});

test('connection precedence: Graph OPEN + hazard PERMITTED -> PERMITTED', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph, {
    routeStatuses: { conn_L5_stair_west: ROUTE_STATUSES.PERMITTED }
  });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PERMITTED);
});

test('connection precedence: Graph CLOSED + hazard PERMITTED -> PROHIBITED', () => {
  const graph = createGraph();
  graph.getConnection('conn_L5_stair_west').status = CONNECTION_STATUSES.CLOSED;
  const hazardState = createHazardState(graph, {
    routeStatuses: { conn_L5_stair_west: ROUTE_STATUSES.PERMITTED }
  });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.ok(route.reasons.some(r => r.includes('connection:prohibited')));
});

test('connection precedence: Graph UNKNOWN + hazard PROHIBITED -> PROHIBITED', () => {
  const graph = createGraph();
  graph.getConnection('conn_L5_stair_west').status = CONNECTION_STATUSES.UNKNOWN;
  const hazardState = createHazardState(graph, {
    routeStatuses: { conn_L5_stair_west: ROUTE_STATUSES.PROHIBITED }
  });
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  const route = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.ok(route.reasons.some(r => r.includes('connection:prohibited')));
});

test('invalid connection reference in hazard state -> unavailable', () => {
  const graph = createGraph();
  const hazardState = createHazardState(graph);
  // Add an invalid connection reference that doesn't exist in the graph
  hazardState.connections.conn_nonexistent = { connectionId: 'conn_nonexistent', routeStatus: ROUTE_STATUSES.PERMITTED };
  const context = buildRoutingHazardContext({ graph, hazardState, expectedTimeSec: 0 });
  assert.equal(context.status, ROUTING_CONTEXT_STATUSES.UNAVAILABLE);
  assert.equal(context.availability.reason, 'hazard-state:invalid-connection-reference');
  assert.equal(context.availability.available, false);
});
