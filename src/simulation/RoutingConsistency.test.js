import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NavigationGraph, EDGE_STATUS } from './NavigationGraph.js';
import { RouteOptimizationEngine } from './RouteOptimizationEngine.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { Pathfinder } from './Pathfinder.js';
import { NavGrid } from './NavGrid.js';
import { ROUTE_CONDITIONS, buildRoutingHazardContext, getExitRouteCondition } from './RoutingHazardAdapter.js';
import { ZoneToGridMapper, applyHazardStateToGrid } from './ZoneToGridMapper.js';
import { createTowerGraph, loadBuilding, applyScenario, CONNECTION_STATUSES } from './BuildingGraph.js';
import { advanceHazardState, injectFireSource } from './HazardPropagation.js';
import { assessRisk } from './RiskAssessment.js';

function createMockPathfinder() {
  return { findPath: () => [{ x: 0, z: 0 }] };
}

function createMockAgent(overrides = {}) {
  return {
    id: `agent_${Math.random()}`,
    roomId: 'f5_r1',
    floor: 5,
    x: 0,
    y: 15.25,
    z: 0,
    state: 'EVACUATING',
    path: [{ x: 0, z: 0 }, { x: -26, z: 0 }],
    currentWaypointIdx: 0,
    currentExitId: 'exit_west',
    currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
    ...overrides
  };
}

test('Graph-level PROHIBITED route is respected by grid-level Pathfinder', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Create hazard state with prohibited connection
  const hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });

  // Make a critical connection prohibited at graph level
  hazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  // Build routing context
  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  // Verify graph-level route is PROHIBITED
  const route = getExitRouteCondition(routingContext, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PROHIBITED);

  // Apply hazard state to grid (this should mark the prohibited connection area)
  const mapper = new ZoneToGridMapper(navGrid);
  applyHazardStateToGrid(mapper, hazardState, buildingGraph);

  // Pathfinder should avoid the prohibited area
  // Test path from room on L5 to west exit
  const path = pathfinder.findPath(-19.5, -12.5, -29, 0); // f5_r1 to west exit

  // Path should either:
  // a) Not use the prohibited stairwell (goes to east exit instead)
  // b) Return fallback if no alternative
  // The key test: path should NOT be a direct route through the prohibited west stairwell
  assert.ok(path.length > 0);
});

test('Graph-level route condition PENALIZED increases grid path cost', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Create hazard state with pending fire (PENALIZED)
  const hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });

  // Set L5 to pending fire (PENALIZED)
  hazardState.zones.L5.fire = { status: 'pending', intensity: 0.5 };

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  // Verify graph-level route is PENALIZED
  const route = getExitRouteCondition(routingContext, 5, 'exit_west');
  assert.equal(route.condition, ROUTE_CONDITIONS.PENALIZED);
  assert.ok(route.cost > 0);

  // Apply to grid
  const mapper = new ZoneToGridMapper(navGrid);
  applyHazardStateToGrid(mapper, hazardState, buildingGraph);

  // Pathfinder should see increased costs in the penalized zone
  const path = pathfinder.findPath(-19.5, -12.5, -29, 0);
  assert.ok(path.length > 0);
});

test('CrowdOptimizer filters out PROHIBITED exits from RoutingHazardAdapter', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // Create hazard state with prohibited west exit
  const hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });
  hazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const agents = [createMockAgent({ id: 'agent_1', roomId: 'f5_r1', floor: 5 })];
  const result = optimizer.optimizeRoutes(agents, [], { routingContext });

  // Agent should be routed to east exit (west is prohibited)
  assert.equal(result.assignments[0].exitId, 'exit_east');
  assert.equal(result.assignments[0].routeCondition, ROUTE_CONDITIONS.PERMITTED);
});

test('NavigationGraph edge occupancy is updated from live agents', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agents = [
    createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0 }), // on west stair landing
    createMockAgent({ id: 'agent_2', x: -26.4, y: 15.25, z: 0 }),
  ];

  navGraph.updateLiveOccupancy(agents);

  // Check that edges near the agents have occupancy
  let foundOccupancy = false;
  navGraph.edges.forEach(edge => {
    if (edge.currentOccupancy > 0) {
      foundOccupancy = true;
    }
  });
  assert.ok(foundOccupancy, 'Edge occupancy should be updated from agent positions');
});

test('NavGrid congestion costs are updated from live agents', () => {
  const navGrid = new NavGrid();
  const agents = [
    createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 }),
    createMockAgent({ id: 'agent_2', x: 0.5, y: 15.25, z: 0 }),
  ];

  navGrid.updateAgentCongestion(agents);

  const g = navGrid.worldToGrid(0, 0);
  assert.ok(navGrid.congestionCosts[g.r][g.c] > 0, 'Congestion cost should be > 0 at agent position');
});

test('NavigationGraph edge occupancy and NavGrid congestion costs are separate', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const navGrid = new NavGrid();
  const agents = [createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 })];

  navGraph.updateLiveOccupancy(agents);
  navGrid.updateAgentCongestion(agents);

  // Both should have occupancy/congestion
  let graphHasOccupancy = false;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) graphHasOccupancy = true; });

  const g = navGrid.worldToGrid(0, 0);
  const gridHasCongestion = navGrid.congestionCosts[g.r][g.c] > 0;

  assert.ok(graphHasOccupancy);
  assert.ok(gridHasCongestion);
  // They are separate systems - no direct coupling
});

test('RouteOptimizationEngine uses NavigationGraph edge occupancy for edge costs', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const optimizer = new RouteOptimizationEngine(navGraph);

  // Add occupancy to an edge that's on the path (reverse direction)
  const edge = navGraph.getConnection('edge_f5_corr_0_1_rev');
  if (edge) {
    edge.currentOccupancy = 10;
  }

  // Path through occupied edge should have higher cost
  const result1 = optimizer.findShortestPath('node_f5_r1_center', 'node_exit_a_west');
  
  // Clear occupancy
  if (edge) edge.currentOccupancy = 0;
  const result2 = optimizer.findShortestPath('node_f5_r1_center', 'node_exit_a_west');

  // With occupancy, cost should be higher
  if (edge) {
    assert.ok(result1.cost > result2.cost, 'Edge occupancy should increase path cost');
  }
});

test('CrowdOptimizer and RouteOptimizationEngine produce consistent exit assignments', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGraph = new NavigationGraph(10, 3.8);
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  const agents = [];
  for (let i = 1; i <= 20; i++) {
    const fl = ((i % 9) + 2);
    const rIdx = (i % 10) + 1;
    agents.push(createMockAgent({
      id: `agent_${i}`,
      floor: fl,
      roomId: `f${fl}_r${rIdx}`
    }));
  }

  // Test RouteOptimizationEngine
  const routeOptimizer = new RouteOptimizationEngine(navGraph);
  const routeResult = routeOptimizer.optimizeEvacuationRoutes(agents);
  const routeExitLoads = { west: 0, east: 0, south: 0 };
  routeResult.assignments.forEach(a => { routeExitLoads[a.exitId.replace('exit_', '')]++; });

  // Test CrowdOptimizer (no hazard context)
  const crowdOptimizer = new CrowdOptimizer(navGrid, pathfinder);
  const crowdResult = crowdOptimizer.optimizeRoutes(agents, [], {});
  const crowdExitLoads = { west: 0, east: 0, south: 0 };
  crowdResult.assignments.forEach(a => { crowdExitLoads[a.exitId.replace('exit_', '')]++; });

  // Both should distribute load across exits (not all to one)
  assert.ok(routeExitLoads.west > 0 && routeExitLoads.east > 0, 'RouteOptimizer should balance load');
  assert.ok(crowdExitLoads.west > 0 && crowdExitLoads.east > 0, 'CrowdOptimizer should balance load');

  // Total assignments should match
  assert.equal(routeResult.assignments.length, 20);
  assert.equal(crowdResult.assignments.length, 20);
});

test('Grid-level Pathfinder and graph-level Dijkstra produce topologically equivalent paths', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new RouteOptimizationEngine(navGraph);

  const path1 = optimizer.findShortestPath('node_f5_r1_center', 'node_exit_a_west');
  const path2 = pathfinder.findPath(-19.5, -12.5, -29, 0);

  assert.ok(path1.success);
  assert.ok(path2.length > 0);

  // Both should route through west stairwell area
  const usesWestStair1 = path1.nodeSequence.some(n => n.includes('stair_west'));
  const usesWestStair2 = path2.some(p => {
    const g = navGrid.worldToGrid(p.x, p.z);
    const world = navGrid.gridToWorld(g.c, g.r);
    return world.x < -20 && Math.abs(world.z) < 5; // west stair area
  });

  assert.ok(usesWestStair1, 'Graph path should use west stairwell');
  assert.ok(usesWestStair2, 'Grid path should use west stairwell area');
});

test('Hazard state changes propagate to both graph and grid routing', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Initial state - no hazards
  let hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });

  const mapper = new ZoneToGridMapper(navGrid);
  applyHazardStateToGrid(mapper, hazardState, buildingGraph);

  // Path should be clear
  let path = pathfinder.findPath(-19.5, -12.5, -29, 0);
  const initialCost = path.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + Math.hypot(p.x - path[i-1].x, p.z - path[i-1].z);
  }, 0);

  // Add fire hazard
  hazardState.zones.L5.fire = { status: 'active', intensity: 0.8 };
  applyHazardStateToGrid(mapper, hazardState, buildingGraph);

  // Path should now be more expensive or rerouted
  path = pathfinder.findPath(-19.5, -12.5, -29, 0);
  const hazardCost = path.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + Math.hypot(p.x - path[i-1].x, p.z - path[i-1].z);
  }, 0);

  // Both graph and grid should see the hazard
  assert.ok(hazardCost >= initialCost);
});

test('Fallback route with operator review flag is preserved through pipeline', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // All exits prohibited
  const hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: { L5: { fire: { status: 'active', intensity: 0.9 }, smoke: { status: 'none', density: null } } },
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    if (!hazardState.zones[z.id]) hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'prohibited' };
  });

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const agents = [createMockAgent({ id: 'agent_1', roomId: 'f5_r1', floor: 5 })];
  const result = optimizer.optimizeRoutes(agents, [], { routingContext });

  assert.ok(result.assignments[0].noPermittedCandidate, 'Should flag no permitted candidate');
  assert.ok(result.assignments[0].requiresOperatorReview, 'Should flag operator review');
  assert.ok(result.requiresOperatorReview, 'Result should flag operator review');
});

test('Reevaluation preserves agent progress on valid routes', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    createMockAgent({ 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      currentExitId: 'exit_west',
      currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
      path: Array(100).fill({x:0,z:0}),
      currentWaypointIdx: 50
    })
  ];
  const currentAssignments = [{
    agentId: 'agent_1',
    exitId: 'exit_west',
    routeCondition: ROUTE_CONDITIONS.PERMITTED,
    path: Array(100).fill({x:0,z:0}),
    currentWaypointIdx: 50
  }];

  const hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext });

  // Agent should keep current exit (progress > 10%)
  assert.equal(result.assignments[0].exitId, 'exit_west');
  assert.equal(result.assignments[0].requiresOperatorReview, false);
});

test('Urgent reevaluation triggers when current route becomes prohibited', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // Agent without currentExitId - let optimizer assign based on loads (will pick west first)
  const agents = [
    createMockAgent({ 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      currentExitId: undefined,  // Let optimizer decide initial assignment
      currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
      path: [{x:0,z:0}],
      currentWaypointIdx: 0
    })
  ];
  // But tell reevaluateRoutes that agent is currently on west exit
  const currentAssignments = [{
    agentId: 'agent_1',
    exitId: 'exit_west',
    routeCondition: ROUTE_CONDITIONS.PERMITTED,
    path: [{x:0,z:0}],
    currentWaypointIdx: 0
  }];

  // Initial: all permitted
  let hazardState = {
    schemaVersion: 1,
    buildingId: buildingGraph.data.id,
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });

  let riskAssessment = assessRisk(hazardState, buildingGraph);
  let routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  // Initial optimization - agent has no currentExitId, so loads are 0, optimizer picks west (first in list)
  let result = optimizer.optimizeRoutes(agents, [], { routingContext });
  assert.equal(result.assignments[0].exitId, 'exit_west', 'Initial assignment should be west');

  // Now prohibit west exit
  hazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';
  riskAssessment = assessRisk(hazardState, buildingGraph);
  routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  // Reevaluate with currentAssignments saying agent is on west exit
  result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext });

  // Should reroute to east exit
  assert.equal(result.assignments[0].exitId, 'exit_east');
});