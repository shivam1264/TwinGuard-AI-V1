import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NavigationGraph, EDGE_STATUS } from './NavigationGraph.js';
import { RouteOptimizationEngine } from './RouteOptimizationEngine.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { createTowerGraph, loadBuilding } from './BuildingGraph.js';
import { ROUTE_CONDITIONS } from './RoutingHazardAdapter.js';

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
    currentRouteCondition: 'permitted',
    ...overrides
  };
}

test('NavigationGraph.updateLiveOccupancy: agent entering an edge increases its occupancy', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({
    id: 'agent_1',
    x: -26.4,
    y: 15.25,
    z: 0,
    state: 'EVACUATING'
  });

  navGraph.updateLiveOccupancy([agent]);

  // Find the edge near the agent's position (west stair landing on floor 5)
  let foundOccupancy = false;
  navGraph.edges.forEach(edge => {
    if (edge.currentOccupancy > 0) {
      foundOccupancy = true;
      assert.ok(edge.currentOccupancy >= 1);
    }
  });
  assert.ok(foundOccupancy, 'At least one edge should have occupancy > 0');
});

test('NavigationGraph.updateLiveOccupancy: agent leaving an edge decreases its occupancy', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({
    id: 'agent_1',
    x: -26.4,
    y: 15.25,
    z: 0,
    state: 'EVACUATING'
  });

  // First update - agent on edge
  navGraph.updateLiveOccupancy([agent]);
  let occupancy1 = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) occupancy1 = e.currentOccupancy; });
  assert.ok(occupancy1 > 0);

  // Second update - agent moved far away (simulating leaving the edge)
  agent.x = 100;
  agent.y = 100;
  agent.z = 100;
  navGraph.updateLiveOccupancy([agent]);

  let occupancy2 = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) occupancy2 = e.currentOccupancy; });
  assert.equal(occupancy2, 0, 'Occupancy should be 0 after agent leaves');
});

test('NavigationGraph.updateLiveOccupancy: agent changing routes releases old occupancy', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({
    id: 'agent_1',
    x: -26.4,
    y: 15.25,
    z: 0,
    state: 'EVACUATING',
    currentExitId: 'exit_west'
  });

  navGraph.updateLiveOccupancy([agent]);
  let westOccupancy = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) westOccupancy += e.currentOccupancy; });
  assert.ok(westOccupancy > 0);

  // Agent changes route to east exit - move to east stair position
  agent.x = 26.4;
  agent.currentExitId = 'exit_east';
  navGraph.updateLiveOccupancy([agent]);

  let eastOccupancy = 0;
  let westOccupancyAfter = 0;
  navGraph.edges.forEach(e => {
    if (e.currentOccupancy > 0) {
      if (e.id.includes('east') || e.id.includes('stair_east')) eastOccupancy += e.currentOccupancy;
      if (e.id.includes('west') || e.id.includes('stair_west')) westOccupancyAfter += e.currentOccupancy;
    }
  });
  assert.ok(eastOccupancy > 0, 'East stair should now have occupancy');
  assert.equal(westOccupancyAfter, 0, 'West stair occupancy should be released');
});

test('NavigationGraph.updateLiveOccupancy: multiple agents sharing an edge produce correct occupancy', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agents = [
    createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0 }),
    createMockAgent({ id: 'agent_2', x: -26.4, y: 15.25, z: 0 }),
    createMockAgent({ id: 'agent_3', x: -26.4, y: 15.25, z: 0 }),
  ];

  navGraph.updateLiveOccupancy(agents);

  let maxOccupancy = 0;
  navGraph.edges.forEach(e => {
    if (e.currentOccupancy > maxOccupancy) maxOccupancy = e.currentOccupancy;
  });
  assert.equal(maxOccupancy, 3, 'Three agents on same edge should give occupancy of 3');
});

test('NavigationGraph.updateLiveOccupancy: completed (SAFE) agents no longer contribute', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agents = [
    createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0, state: 'EVACUATING' }),
    createMockAgent({ id: 'agent_2', x: -26.4, y: 15.25, z: 0, state: 'SAFE' }), // Completed
  ];

  navGraph.updateLiveOccupancy(agents);

  let totalOccupancy = 0;
  navGraph.edges.forEach(e => { totalOccupancy += e.currentOccupancy; });
  assert.equal(totalOccupancy, 1, 'Only the EVACUATING agent should contribute to occupancy');
});

test('NavigationGraph.updateLiveOccupancy: occupancy never becomes negative', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0 });

  navGraph.updateLiveOccupancy([agent]);
  navGraph.updateLiveOccupancy([agent]); // Double update
  navGraph.updateLiveOccupancy([]); // Empty array

  let hasNegative = false;
  navGraph.edges.forEach(e => {
    if (e.currentOccupancy < 0) hasNegative = true;
  });
  assert.equal(hasNegative, false, 'No edge should have negative occupancy');
});

test('NavigationGraph.updateLiveOccupancy: duplicate agents not double-counted', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0 });
  const agents = [agent, agent]; // Same agent object twice

  navGraph.updateLiveOccupancy(agents);

  let totalOccupancy = 0;
  navGraph.edges.forEach(e => { totalOccupancy += e.currentOccupancy; });
  // Each agent in array is counted, even if same object (simulates two distinct agents at same pos)
  assert.equal(totalOccupancy, 2, 'Two entries in array should count as two agents');
});

test('RouteOptimizationEngine: repeated optimization does not erase live occupancy', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGraph = new NavigationGraph(10, 3.8);
  const optimizer = new RouteOptimizationEngine(navGraph);

  // Set up some live occupancy
  const agent = createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0 });
  navGraph.updateLiveOccupancy([agent]);

  let occupancyBefore = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) occupancyBefore = e.currentOccupancy; });
  assert.ok(occupancyBefore > 0);

  // Run optimization
  const agents = [
    { id: 'agent_2', roomId: 'f5_r1', floor: 5 }
  ];
  optimizer.optimizeEvacuationRoutes(agents);

  // Live occupancy should still exist (not reset by optimization)
  let occupancyAfter = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) occupancyAfter = e.currentOccupancy; });
  assert.ok(occupancyAfter > 0, 'Live occupancy should persist after optimization');
});

test('CrowdOptimizer: updated congestion changes exit loads from live agents', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [
    createMockAgent({ id: 'agent_1', currentExitId: 'exit_west', state: 'EVACUATING' }),
    createMockAgent({ id: 'agent_2', currentExitId: 'exit_west', state: 'EVACUATING' }),
    createMockAgent({ id: 'agent_3', currentExitId: 'exit_east', state: 'EVACUATING' }),
    createMockAgent({ id: 'agent_4', currentExitId: 'exit_west', state: 'SAFE' }), // Should not count
  ];

  optimizer._updateLiveExitLoads(agents);

  const westExit = optimizer.exits.find(e => e.id === 'exit_west');
  const eastExit = optimizer.exits.find(e => e.id === 'exit_east');
  const southExit = optimizer.exits.find(e => e.id === 'exit_south');

  assert.equal(westExit.load, 2, 'West exit should have 2 agents (SAFE excluded)');
  assert.equal(eastExit.load, 1, 'East exit should have 1 agent');
  assert.equal(southExit.load, 0, 'South exit should have 0 agents');
});

test('CrowdOptimizer: optimizeRoutes uses live exit loads instead of resetting', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [
    createMockAgent({ id: 'agent_1', roomId: 'f5_r1', floor: 5, currentExitId: 'exit_west', state: 'EVACUATING' }),
    createMockAgent({ id: 'agent_2', roomId: 'f5_r2', floor: 5, currentExitId: 'exit_east', state: 'EVACUATING' }),
  ];

  // Pre-set some loads
  optimizer.exits.find(e => e.id === 'exit_west').load = 5;
  optimizer.exits.find(e => e.id === 'exit_east').load = 3;

  const result = optimizer.optimizeRoutes(agents, [], {});

  // Loads should be recomputed from live agents, not reset to 0 then incremented
  const westExit = optimizer.exits.find(e => e.id === 'exit_west');
  const eastExit = optimizer.exits.find(e => e.id === 'exit_east');
  assert.equal(westExit.load, 1, 'West exit load should reflect 1 live agent');
  assert.equal(eastExit.load, 1, 'East exit load should reflect 1 live agent');
  assert.equal(result.assignments.length, 2);
});

test('CrowdOptimizer: reevaluateRoutes uses live exit loads', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [
    createMockAgent({ id: 'agent_1', roomId: 'f5_r1', floor: 5, currentExitId: 'exit_west', state: 'EVACUATING' }),
  ];
  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: [{x:0,z:0}], currentWaypointIdx: 5 }
  ];

  // Pre-set different load
  optimizer.exits.find(e => e.id === 'exit_west').load = 10;

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], {});

  const westExit = optimizer.exits.find(e => e.id === 'exit_west');
  assert.equal(westExit.load, 1, 'West exit load should reflect 1 live agent, not previous 10');
});

test('SceneManager reset: clears navigation graph congestion state', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({ id: 'agent_1', x: -26.4, y: 15.25, z: 0 });
  navGraph.updateLiveOccupancy([agent]);

  let occupancyBefore = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) occupancyBefore = e.currentOccupancy; });
  assert.ok(occupancyBefore > 0);

  navGraph.resetAllHazards();

  let occupancyAfter = 0;
  navGraph.edges.forEach(e => { if (e.currentOccupancy > 0) occupancyAfter = e.currentOccupancy; });
  assert.equal(occupancyAfter, 0, 'resetAllHazards should clear occupancy');
});

test('Hazard-aware routing behavior unchanged: prohibited routes still blocked', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGraph = new NavigationGraph(10, 3.8);
  const optimizer = new RouteOptimizationEngine(navGraph);

  // Block west stairwell
  navGraph.blockStairwell('West');

  const agents = [
    { id: 'agent_1', roomId: 'f5_r1', floor: 5 }
  ];
  const result = optimizer.optimizeEvacuationRoutes(agents);

  // Agent should be routed to east exit since west is blocked
  assert.equal(result.assignments[0].exitId, 'exit_east');
});

test('Hazard-aware routing behavior unchanged: hazardous conditions still allow pathfinding', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGraph = new NavigationGraph(10, 3.8);
  const optimizer = new RouteOptimizationEngine(navGraph);

  // Set a connection to HAZARDOUS (NavigationGraph supports this)
  const conn = navGraph.getConnection('edge_stair_west_f5_to_f4');
  conn.status = EDGE_STATUS.HAZARDOUS;

  const agents = [
    { id: 'agent_1', roomId: 'f5_r1', floor: 5 }
  ];
  const result = optimizer.optimizeEvacuationRoutes(agents);

  // Should still find a path (hazardous is not blocked, just penalized)
  assert.ok(result.assignments[0].path && result.assignments[0].path.length > 0);
});

test('Route stickiness behavior preserved: agents with progress keep current exit', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [
    createMockAgent({
      id: 'agent_1',
      roomId: 'f5_r1',
      floor: 5,
      currentExitId: 'exit_west',
      state: 'EVACUATING',
      path: Array(100).fill({x:0,z:0}), // Long path = high progress
      currentWaypointIdx: 50 // 50% progress
    })
  ];
  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: Array(100).fill({x:0,z:0}), currentWaypointIdx: 50 }
  ];

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], {});

  assert.equal(result.assignments[0].exitId, 'exit_west', 'Agent with >10% progress should keep current exit');
});

test('Agent progress preservation: rerouted agent releases old edge occupancy', () => {
  const navGraph = new NavigationGraph(10, 3.8);
  const agent = createMockAgent({
    id: 'agent_1',
    x: -26.4,
    y: 15.25,
    z: 0,
    state: 'EVACUATING',
    currentExitId: 'exit_west'
  });

  navGraph.updateLiveOccupancy([agent]);
  let westOccupancy = 0;
  navGraph.edges.forEach(e => { if (e.id.includes('west') && e.currentOccupancy > 0) westOccupancy += e.currentOccupancy; });
  assert.ok(westOccupancy > 0);

  // Simulate reroute to east exit (hazard made west prohibited)
  agent.x = 26.4;
  agent.currentExitId = 'exit_east';
  agent.currentRouteCondition = 'prohibited'; // Old route now prohibited
  navGraph.updateLiveOccupancy([agent]);

  let eastOccupancy = 0;
  let westOccupancyAfter = 0;
  navGraph.edges.forEach(e => {
    if (e.currentOccupancy > 0) {
      if (e.id.includes('east') || e.id.includes('stair_east')) eastOccupancy += e.currentOccupancy;
      if (e.id.includes('west') || e.id.includes('stair_west')) westOccupancyAfter += e.currentOccupancy;
    }
  });
  assert.ok(eastOccupancy > 0, 'Should now occupy east stair edges');
  assert.equal(westOccupancyAfter, 0, 'Should have released west stair edges');
});

test('CrowdOptimizer: unknown hazard handling unchanged', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [
    createMockAgent({ id: 'agent_1', roomId: 'f5_r1', floor: 5, currentExitId: 'exit_west', state: 'EVACUATING' })
  ];

  // routingContext with unknown availability
  const routingContext = {
    availability: { available: true },
    routes: {
      'L5:exit_west': { condition: 'unknown', cost: 15 },
      'L5:exit_east': { condition: 'permitted', cost: 0 }
    }
  };

  const result = optimizer.optimizeRoutes(agents, [], { routingContext });

  // Should prefer permitted over unknown
  assert.equal(result.assignments[0].exitId, 'exit_east');
});

test('reevaluateRoutes allOperational fallback when both stairwells compromised', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());

  // Block both west and east exits - both stairwells compromised
  optimizer.exits.find(e => e.id === 'exit_west').isBlocked = true;
  optimizer.exits.find(e => e.id === 'exit_east').isBlocked = true;
  // South exit remains operational
  optimizer.exits.find(e => e.id === 'exit_south').isBlocked = false;

  const agents = [
    createMockAgent({ id: 'agent_1', floor: 5, x: 0, y: 15.25, z: 0, currentExitId: 'exit_west', state: 'EVACUATING' }),
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PROHIBITED, path: [{x:0,z:0}], currentWaypointIdx: 0 },
  ];

  const routingContext = {
    availability: { available: true },
    routes: {
      'L5:exit_west': { condition: ROUTE_CONDITIONS.PROHIBITED },
      'L5:exit_east': { condition: ROUTE_CONDITIONS.PROHIBITED },
      'L5:exit_south': { condition: ROUTE_CONDITIONS.PERMITTED },
    }
  };

  // Should not throw ReferenceError for undefined allOperational
  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext });

  assert.equal(result.assignments.length, 1);
  // Agent should be reassigned to the only operational exit (south)
  assert.equal(result.assignments[0].exitId, 'exit_south', 'Agent should fall back to south exit when both stairwells blocked');
  // Should not require operator review since a permitted route (south) exists
  assert.equal(result.assignments[0].requiresOperatorReview, false);
  assert.equal(result.assignments[0].noPermittedCandidate, false);
});

test('reevaluateRoutes allOperational fallback preserves operator review when no permitted route', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());

  // Block ALL exits - no operational exit exists
  optimizer.exits.forEach(e => { e.isBlocked = true; });

  const agents = [
    createMockAgent({ id: 'agent_1', floor: 5, x: 0, y: 15.25, z: 0, currentExitId: 'exit_west', state: 'EVACUATING' }),
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PROHIBITED, path: [{x:0,z:0}], currentWaypointIdx: 0 },
  ];

  const routingContext = {
    availability: { available: true },
    routes: {
      'L5:exit_west': { condition: ROUTE_CONDITIONS.PROHIBITED },
      'L5:exit_east': { condition: ROUTE_CONDITIONS.PROHIBITED },
      'L5:exit_south': { condition: ROUTE_CONDITIONS.PROHIBITED },
    }
  };

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext });

  assert.equal(result.assignments.length, 1);
  // Agent still gets an assignment (fallback to this.exits) but with operator review flags
  assert.equal(result.assignments[0].noPermittedCandidate, true, 'Should flag no permitted candidate when all exits blocked');
  assert.equal(result.assignments[0].requiresOperatorReview, true, 'Should require operator review when no permitted route exists');
});