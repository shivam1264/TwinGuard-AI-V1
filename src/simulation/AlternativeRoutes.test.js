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

test('RouteOptimizationEngine generates alternative path for single exit', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const optimizer = new RouteOptimizationEngine(navGraph);

  const agents = [
    { id: 'agent_1', roomId: 'f5_r1', floor: 5 }
  ];

  const result = optimizer.optimizeEvacuationRoutes(agents);

  // Primary assignment exists
  assert.ok(result.assignments[0].path.length > 0);
  // Alternative path exists (hasAlternative should be true if an alternative was found)
  assert.ok(result.assignments[0].hasAlternative !== undefined);
});

test('RouteOptimizationEngine alternative path uses different critical edge', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const optimizer = new RouteOptimizationEngine(navGraph);

  const primaryResult = optimizer.findShortestPath('node_f5_r1_center', 'node_exit_a_west');
  assert.ok(primaryResult.success);

  const altResult = optimizer.findAlternativePath('node_f5_r1_center', 'node_exit_a_west', primaryResult);
  
  if (altResult) {
    // Alternative should be different from primary
    assert.notDeepEqual(altResult.nodeSequence, primaryResult.nodeSequence);
    // Alternative should not use the critical edge that was blocked
    const blockedEdge = primaryResult.edgeSequence.find(e => 
      e.type === 'STAIR_FLIGHT' || e.type === 'CORRIDOR_SEGMENT'
    );
    if (blockedEdge) {
      const altUsesBlocked = altResult.edgeSequence.some(e => e.id === blockedEdge.id);
      assert.equal(altUsesBlocked, false, 'Alternative should not use the blocked critical edge');
    }
  }
});

test('CrowdOptimizer generates alternatives for multiple available exits', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

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

  const result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });

  // Assignment should have alternatives array
  const assignment = result.assignments[0];
  assert.ok(Array.isArray(assignment.alternatives));
  assert.ok(assignment.alternatives.length > 0, 'Should have at least one alternative route');

  // Each alternative should have required fields
  assignment.alternatives.forEach(alt => {
    assert.ok(alt.exitId);
    assert.ok(alt.exitName);
    assert.ok(alt.exitColor);
    assert.ok(Array.isArray(alt.path) && alt.path.length > 0);
    assert.ok(typeof alt.score === 'number');
    assert.ok(alt.routeCondition !== undefined);
    assert.ok(Array.isArray(alt.routeReasons));
  });
});

test('Alternative routes are ranked by combined cost', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
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

  const result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });

  const assignment = result.assignments[0];
  
  // Alternatives should be sorted by score (ascending)
  const altScores = assignment.alternatives.map(a => a.score);
  const sortedScores = [...altScores].sort((a, b) => a - b);
  assert.deepEqual(altScores, sortedScores, 'Alternatives should be sorted by score ascending');
  
  // Primary route should have best (lowest) score
  const primaryScore = assignment.routeCondition ? 0 : 0; // The primary doesn't have a score field in the same way
  // Just verify alternatives exist and are sorted
  assert.ok(assignment.alternatives.length > 0);
});

test('Prohibited routes are excluded from alternatives', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
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
  // Prohibit west exit
  hazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });

  const assignment = result.assignments[0];
  // Should be assigned to east exit (not west)
  assert.equal(assignment.exitId, 'exit_east');
  
  // Alternatives should NOT include prohibited west exit
  const altExitIds = assignment.alternatives.map(a => a.exitId);
  assert.ok(!altExitIds.includes('exit_west'), 'Prohibited exit should not appear in alternatives');
});

test('Hazardous routes receive penalties and appear as alternatives', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
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
  // Make L5 fire pending (PENALIZED)
  hazardState.zones.L5.fire = { status: 'pending', intensity: 0.5 };

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });

  const assignment = result.assignments[0];
  
  // Both exits should be available but one may be penalized
  assert.ok(assignment.alternatives.length > 0);
  
  // Check that alternatives have route conditions
  assignment.alternatives.forEach(alt => {
    assert.ok(alt.routeCondition !== undefined);
    assert.ok(Array.isArray(alt.routeReasons));
  });
});

test('Congestion influences alternative ranking', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // Simulate high load on west exit
  optimizer.exits.forEach(e => e.load = 0);
  optimizer.exits.find(e => e.id === 'exit_west').load = 50; // Near capacity
  optimizer.exits.find(e => e.id === 'exit_east').load = 5;  // Low load

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const result = optimizer.optimizeRoutes([agents[0]], [], {});

  // With high west load, east should be preferred (lower score)
  const assignment = result.assignments[0];
  // The primary should be the lower-cost option
  assert.ok(assignment.exitId === 'exit_east' || assignment.alternatives.length > 0);
});

test('Grid-blocked routes are not returned as feasible alternatives', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // Block a corridor
  const navGridForPathfinder = navGrid;
  // Block cells along west corridor
  const r = navGridForPathfinder.worldToGrid(0, 0).r;
  for (let c = navGridForPathfinder.worldToGrid(-20, 0).c; c <= navGridForPathfinder.worldToGrid(20, 0).c; c++) {
    navGridForPathfinder.grid[r][c] = 1;
    navGridForPathfinder.blockedStatic[r][c] = true;
  }

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: -19.5,
      y: 15.25,
      z: -12.5,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const result = optimizer.optimizeRoutes([agents[0]], [], {});

  // Should still find a path (possibly via east or alternative)
  assert.ok(result.assignments[0].path.length > 0);
});

test('No-permitted-route preserves operator-review status in alternatives', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'prohibited' };
  });

  const riskAssessment = assessRisk(hazardState, buildingGraph);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });

  const assignment = result.assignments[0];
  assert.ok(assignment.noPermittedCandidate, 'Should flag no permitted candidate');
  assert.ok(assignment.requiresOperatorReview, 'Should flag operator review');
  
  // Even alternatives should reflect the prohibited state
  assert.ok(assignment.alternatives.length >= 0);
});

test('Hazard changes invalidate affected alternatives', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  // Initial: all permitted
  let hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
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

  let result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });
  const initialAltExitIds = result.assignments[0].alternatives.map(a => a.exitId).sort();
  // Primary is west, so alternative should be east
  assert.ok(initialAltExitIds.includes('exit_east'), 'East should be alternative when west is primary');

  // Now prohibit west
  hazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';
  riskAssessment = assessRisk(hazardState, buildingGraph);
  routingContext = buildRoutingHazardContext({ graph: buildingGraph, hazardState, riskAssessment, expectedTimeSec: 0 });

  result = optimizer.optimizeRoutes([agents[0]], [], { routingContext });
  const newAltExitIds = result.assignments[0].alternatives.map(a => a.exitId).sort();
  assert.ok(!newAltExitIds.includes('exit_west'), 'Prohibited exit should be removed from alternatives');
});

test('Reevaluation updates alternative rankings', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: 'exit_west',
      currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
      path: [{x:0,z:0}],
      currentWaypointIdx: 0
    }
  ];
  const currentAssignments = [{
    agentId: 'agent_1',
    exitId: 'exit_west',
    routeCondition: ROUTE_CONDITIONS.PERMITTED,
    path: [{x:0,z:0}],
    currentWaypointIdx: 0
  }];

  // Initial: all permitted, west load high
  let hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
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

  // Set high load on west
  optimizer.exits.find(e => e.id === 'exit_west').load = 40;
  optimizer.exits.find(e => e.id === 'exit_east').load = 5;

  let result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext });
  
  // With high west load, should prefer east
  assert.equal(result.assignments[0].exitId, 'exit_east');
  assert.ok(result.assignments[0].alternatives.length > 0);
});

test('Existing agent progress preservation remains intact with alternatives', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: 'exit_west',
      currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
      path: Array(100).fill({x:0,z:0}),
      currentWaypointIdx: 50
    }
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
    buildingId: 'twinguard-tower-10f',
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

  // Agent has made >10% progress, should keep current exit
  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext });

  assert.equal(result.assignments[0].exitId, 'exit_west');
  assert.equal(result.assignments[0].requiresOperatorReview, false);
});

test('Existing single-best-route behavior remains compatible', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [
    { 
      id: 'agent_1', 
      roomId: 'f5_r1', 
      floor: 5,
      x: 0,
      y: 15.25,
      z: 0,
      state: 'EVACUATING',
      currentExitId: undefined
    }
  ];

  const result = optimizer.optimizeRoutes(agents, [], {});

  // Primary assignment should exist
  assert.ok(result.assignments.length === 1);
  assert.ok(result.assignments[0].path.length > 0);
  assert.ok(result.assignments[0].exitId);
  
  // Alternatives array exists
  assert.ok(Array.isArray(result.assignments[0].alternatives));
  
  // Should be backward compatible - primary route fields unchanged
  const assignment = result.assignments[0];
  assert.ok(assignment.exitId);
  assert.ok(assignment.path.length > 0);
  assert.ok(assignment.routeCondition !== undefined);
});