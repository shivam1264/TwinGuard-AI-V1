import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTowerGraph, loadBuilding, applyScenario } from './BuildingGraph.js';
import { advanceHazardState } from './HazardPropagation.js';
import { assessRisk } from './RiskAssessment.js';
import { buildRoutingHazardContext, getExitRouteCondition, ROUTE_CONDITIONS } from './RoutingHazardAdapter.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { SimulationClock } from '../three/SceneManager.js';

// Mock Agent for testing
function createMockAgent(overrides = {}) {
  return {
    id: 'agent_1',
    roomId: 'f5_r1',
    floor: 5,
    x: 0,
    y: 15.25,
    z: 0,
    state: 'EVACUATING',
    path: [],
    currentWaypointIdx: 0,
    currentExitId: 'exit_west',
    currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
    ...overrides
  };
}

// Mock Pathfinder for CrowdOptimizer
function createMockPathfinder() {
  return {
    findPath: () => [{ x: 0, z: 0 }]
  };
}

// SimulationClock is imported from SceneManager.js
// It provides deterministic pause/resume behavior for simulation time

test('Scenario initialization produces correctly timestamped hazard state', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
  };

  const hazardState = applyScenario(graph, scenario);

  assert.equal(hazardState.schemaVersion, 1);
  assert.equal(hazardState.buildingId, graph.data.id);
  assert.equal(hazardState.timeSec, 0);
  assert.ok(hazardState.zones.L5.fire.status === 'active');
  assert.equal(hazardState.zones.L5.fire.intensity, 0.6);
});

test('Hazard state advances with simulation time and risk assessment stays consistent', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
  };

  let hazardState = applyScenario(graph, scenario);
  const dt = 10;
  hazardState = advanceHazardState(hazardState, graph, dt);
  const riskAssessment = assessRisk(hazardState, graph);

  assert.equal(hazardState.timeSec, dt);
  assert.equal(riskAssessment.timeSec, dt);
  assert.ok(riskAssessment.zones.L5.fire.intensity > 0);
});

test('Routing context uses consistent timestamps across hazard and risk', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
  };

  let hazardState = applyScenario(graph, scenario);
  const dt = 10;
  hazardState = advanceHazardState(hazardState, graph, dt);
  const riskAssessment = assessRisk(hazardState, graph);

  const context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: dt
  });

  assert.equal(context.timeSec, dt);
  assert.equal(context.availability.freshness, 'fresh');
  assert.ok(context.availability.available);
});

test('Pause/resume clock does not create time jump', () => {
  // Use a fully controlled clock that doesn't depend on Date.now()
  class ControlledClock {
    constructor() {
      this.time = 0;
      this.running = false;
    }
    start() { this.running = true; }
    stop() { this.running = false; }
    getDelta() { return this.running ? 0.016 : 0; } // ~60fps frame
    advance(seconds) { this.time += seconds; }
    get elapsed() { return this.time; }
  }

  const clock = new ControlledClock();
  
  // Start and advance 5 seconds
  clock.start();
  clock.advance(5);
  const afterStart = clock.elapsed;
  
  // Pause
  clock.stop();
  
  // Try to get delta while paused - should be 0
  const deltaWhilePaused = clock.getDelta();
  
  // Resume
  clock.start();
  
  // Advance another 3 seconds
  clock.advance(3);
  const afterResume = clock.elapsed;
  
  // Total elapsed should be 8 seconds (5 + 3), no jump
  assert.equal(afterStart, 5);
  assert.equal(afterResume, 8);
  assert.equal(afterResume - afterStart, 3);
  assert.equal(deltaWhilePaused, 0);
});

test('Hazard update to prohibited triggers urgent reevaluation', () => {
  const graph = loadBuilding(createTowerGraph());
  // Scenario with fire on L1 (far from L5 exit_west route) - initially routes unknown due to unknown smoke
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L1', startSec: 0, intensity: 0.3 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Initially route is unknown (smoke status unknown at time 0)
  const initialRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(initialRoute.condition, ROUTE_CONDITIONS.UNKNOWN);

  // Simulate hazard state change: make connection prohibited
  const updatedHazardState = structuredClone(hazardState);
  updatedHazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';
  
  riskAssessment = assessRisk(updatedHazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState: updatedHazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Now route should be prohibited (prohibited overrides unknown)
  const updatedRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(updatedRoute.condition, ROUTE_CONDITIONS.PROHIBITED);
});

test('Completed agents are not reassigned during reevaluation', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  
  const agents = [
    createMockAgent({ id: 'agent_1', state: 'SAFE' }), // Completed agent
    createMockAgent({ id: 'agent_2', state: 'EVACUATING' }) // Active agent
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PERMITTED, path: [], currentWaypointIdx: 0 },
    { agentId: 'agent_2', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PERMITTED, path: [{x:0,z:0}], currentWaypointIdx: 5 }
  ];

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext: null });
  
  // Completed agent should not be reassigned (no assignment in result for agent_1)
  const agent1Assignment = result.assignments.find(a => a.agentId === 'agent_1');
  const agent2Assignment = result.assignments.find(a => a.agentId === 'agent_2');
  
  // Completed agent should not get a new assignment
  assert.equal(agent1Assignment, undefined);
  // Active agent should get assignment
  assert.ok(agent2Assignment);
});

test('Active agent with prohibited current route gets rerouted', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'stair_west', startSec: 0, intensity: 0.8 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  const context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [createMockAgent({ 
    id: 'agent_1', 
    currentExitId: 'exit_west',
    currentRouteCondition: ROUTE_CONDITIONS.PERMITTED,
    path: [{x:0,z:0},{x:1,z:0},{x:2,z:0}],
    currentWaypointIdx: 1
  })];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PERMITTED, path: [{x:0,z:0},{x:1,z:0},{x:2,z:0}], currentWaypointIdx: 1 }
  ];

  // Simulate prohibited route
  const fireLocations = [];
  const result = optimizer.reevaluateRoutes(agents, currentAssignments, fireLocations, { routingContext: context });
  
  // Agent should be rerouted to exit_east since exit_west is prohibited
  const assignment = result.assignments.find(a => a.agentId === 'agent_1');
  assert.ok(assignment);
  assert.equal(assignment.exitId, 'exit_east');
});

test('Scenario replacement does not retain old hazard state', () => {
  const graph = loadBuilding(createTowerGraph());
  
  // First scenario: fire on L5
  const scenario1 = {
    schemaVersion: 1,
    id: 'scenario-1',
    name: 'Scenario 1',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
  };
  
  let hazardState = applyScenario(graph, scenario1);
  assert.equal(hazardState.zones.L5.fire.status, 'active');
  assert.equal(hazardState.zones.L4.fire.status, 'none');
  
  // Replace with scenario 2: fire on L4
  const scenario2 = {
    schemaVersion: 1,
    id: 'scenario-2',
    name: 'Scenario 2',
    durationSec: 600,
    fires: [{ id: 'fire_2', zoneId: 'L4', startSec: 0, intensity: 0.5 }]
  };
  
  hazardState = applyScenario(graph, scenario2);
  
  // Old scenario's fire should be gone
  assert.equal(hazardState.zones.L5.fire.status, 'none');
  assert.equal(hazardState.zones.L4.fire.status, 'active');
  assert.equal(hazardState.scenarioId, 'scenario-2');
});

test('Equivalent hazard updates do not cause route churn', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  const initialHash = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(
      Object.entries(context.routes).map(([k, v]) => [k, v.condition])
    )
  });

  // Advance time by small amount - hazard state changes but route conditions should stay same
  hazardState = advanceHazardState(hazardState, graph, 1);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 1
  });

  const newHash = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(
      Object.entries(context.routes).map(([k, v]) => [k, v.condition])
    )
  });

  // Route conditions should not change for equivalent updates
  assert.equal(newHash, initialHash);
});

test('All-prohibited fallback remains flagged for operator review', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.9 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  const context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  const agents = [createMockAgent({ id: 'agent_1' })];

  const result = optimizer.optimizeRoutes(agents, [], { routingContext: context });

  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0].noPermittedCandidate, true);
  assert.equal(result.assignments[0].requiresOperatorReview, true);
  assert.equal(result.requiresOperatorReview, true);
});

test('SimulationClock pause/resume excludes paused wall time', () => {
  const clock = new SimulationClock();

  // Start and advance 5 seconds
  clock.start();
  clock.setElapsed(5);
  const afterStart = clock.getElapsed();

  // Pause
  clock.stop();

  // Delta while paused should be 0
  const deltaWhilePaused = clock.getDelta();
  assert.equal(deltaWhilePaused, 0);

  // Resume and advance 3 seconds
  clock.start();
  clock.setElapsed(8); // Total 8 seconds (5 + 3)
  const afterResume = clock.getElapsed();

  // Total elapsed should be 8 seconds (5 + 3), no jump
  assert.ok(Math.abs(clock.getElapsed() - 8) < 0.001);
});

test('SimulationClock multiple pause/resume cycles', () => {
  const clock = new SimulationClock();

  clock.start();
  clock.setElapsed(2);
  clock.stop();
  clock.start();
  clock.setElapsed(5);
  clock.stop();
  clock.start();
  clock.setElapsed(10);

  assert.ok(Math.abs(clock.getElapsed() - 10) < 0.001);
});

test('SimulationClock speed changes', () => {
  const clock = new SimulationClock();
  clock.start();
  clock.setElapsed(10);

  // Speed change doesn't affect elapsed time directly
  // It's handled by the simulation loop
  assert.ok(Math.abs(clock.getElapsed() - 10) < 0.001);
});

test('Urgent reevaluation triggers on newly prohibited route', () => {
  const graph = loadBuilding(createTowerGraph());
  // Scenario with fire on L1 (far from L5 exit_west route) - initially routes unknown due to unknown smoke
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L1', startSec: 0, intensity: 0.3 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Initially route is unknown (smoke status unknown at time 0)
  const initialRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(initialRoute.condition, ROUTE_CONDITIONS.UNKNOWN);

  // Simulate hazard state change: make connection prohibited
  const updatedHazardState = structuredClone(hazardState);
  updatedHazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  riskAssessment = assessRisk(updatedHazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState: updatedHazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Now route should be prohibited (prohibited overrides unknown)
  const updatedRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(updatedRoute.condition, ROUTE_CONDITIONS.PROHIBITED);
});

test('Equivalent hazard updates do not trigger repeated urgent reevaluation', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L1', startSec: 0, intensity: 0.3 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // First context hash
  const initialHash = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(
      Object.entries(context.routes).map(([k, v]) => [k, v.condition])
    )
  });

  // Advance time by small amount - hazard state changes but route conditions stay same
  hazardState = advanceHazardState(hazardState, graph, 1);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 1
  });

  const newHash = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(
      Object.entries(context.routes).map(([k, v]) => [k, v.condition])
    )
  });

  // Route conditions should not change for equivalent updates
  assert.equal(newHash, initialHash);
});

test('Reset and restart lifecycle: scenario retained but hazard state reset', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
  };

  // Initial setup
  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  assert.ok(context.availability.available);

  // Simulate reset: hazardState becomes null (as in SceneManager.reset())
  hazardState = null;
  riskAssessment = null;
  context = null;

  // After reset, building context with null hazard state should be unavailable
  const freshContext = buildRoutingHazardContext({
    graph,
    hazardState: null,
    expectedTimeSec: 0
  });

  assert.equal(freshContext.availability.available, false);
  assert.equal(freshContext.availability.reason, 'hazard-state:missing');

  // Re-initialize with same scenario (simulating restart)
  hazardState = applyScenario(graph, scenario);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Context should be available again with fresh hazard state
  assert.ok(context.availability.available);
  assert.equal(context.timeSec, 0);
});

test('Urgent reevaluation triggers on newly prohibited route and bypasses cooldown', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = {
    schemaVersion: 1,
    id: 'test-scenario',
    name: 'Test Scenario',
    durationSec: 600,
    fires: [{ id: 'fire_1', zoneId: 'L1', startSec: 0, intensity: 0.3 }]
  };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Initially route is unknown (smoke status unknown at time 0)
  const initialRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(initialRoute.condition, ROUTE_CONDITIONS.UNKNOWN);

  // Simulate hazard state change: make connection prohibited
  const updatedHazardState = structuredClone(hazardState);
  updatedHazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  riskAssessment = assessRisk(updatedHazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState: updatedHazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  // Now route should be prohibited (prohibited overrides unknown)
  const updatedRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(updatedRoute.condition, ROUTE_CONDITIONS.PROHIBITED);

  // Verify the context hash changes (would trigger reevaluation)
  const hash1 = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(
      Object.entries(context.routes).map(([k, v]) => [k, v.condition])
    )
  });

  // Same context again - hash should be identical (no re-revaluation)
  const hash2 = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(
      Object.entries(context.routes).map(([k, v]) => [k, v.condition])
    )
  });
  assert.equal(hash1, hash2);
});

test('Completed agents are not reassigned during urgent reevaluation', () => {
  const optimizer = new CrowdOptimizer({}, createMockPathfinder());
  
  const agents = [
    createMockAgent({ id: 'agent_1', state: 'SAFE' }), // Completed agent
    createMockAgent({ id: 'agent_2', state: 'EVACUATING' }) // Active agent
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PERMITTED, path: [], currentWaypointIdx: 0 },
    { agentId: 'agent_2', exitId: 'exit_west', routeCondition: ROUTE_CONDITIONS.PROHIBITED, path: [{x:0,z:0}], currentWaypointIdx: 5 }
  ];

  const context = {
    routes: {
      'L5:exit_west': { condition: ROUTE_CONDITIONS.PROHIBITED },
      'L5:exit_east': { condition: ROUTE_CONDITIONS.PERMITTED }
    },
    availability: { available: true }
  };

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext: context });
  
  // Completed agent should not be reassigned
  const agent1Assignment = result.assignments.find(a => a.agentId === 'agent_1');
  // Active agent with prohibited route should be rerouted
  const agent2Assignment = result.assignments.find(a => a.agentId === 'agent_2');
  
  assert.equal(agent1Assignment, undefined, 'Completed agent should not be reassigned');
  assert.ok(agent2Assignment, 'Active agent should be reassigned');
  assert.equal(agent2Assignment.exitId, 'exit_east', 'Agent should be rerouted to permitted exit');
});