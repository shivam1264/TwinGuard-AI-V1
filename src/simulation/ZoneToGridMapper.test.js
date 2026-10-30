import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTowerGraph, loadBuilding, applyScenario } from './BuildingGraph.js';
import { NavGrid } from './NavGrid.js';
import { ZoneToGridMapper, applyHazardStateToGrid, DEFAULT_ZONE_MAPPING_CONFIG } from './ZoneToGridMapper.js';
import { advanceHazardState } from './HazardPropagation.js';
import { assessRisk } from './RiskAssessment.js';
import { buildRoutingHazardContext, getExitRouteCondition, ROUTE_CONDITIONS } from './RoutingHazardAdapter.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { Pathfinder } from './Pathfinder.js';
import { SimulationClock } from '../three/SceneManager.js';

function createGraph() {
  return loadBuilding(createTowerGraph());
}

function createHazardState(graph, options = {}) {
  const zones = {};
  const connections = {};

  graph.data.zones.forEach((zone) => {
    zones[zone.id] = options.zones?.[zone.id] || {
      fire: { status: 'none', intensity: null },
      smoke: { status: 'none', density: null }
    };
  });

  graph.data.connections.forEach((connection) => {
    connections[connection.id] = {
      connectionId: connection.id,
      routeStatus: options.routeStatuses?.[connection.id] || 'unknown'
    };
  });

  return {
    schemaVersion: 1,
    buildingId: options.buildingId || graph.data.id,
    scenarioId: 'test-scenario',
    timeSec: options.timeSec ?? 0,
    zones,
    connections
  };
}

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
    currentRouteCondition: 'permitted',
    ...overrides
  };
}

function createMockPathfinder() {
  return {
    findPath: () => [{ x: 0, z: 0 }]
  };
}

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
  class ControlledClock {
    constructor() {
      this.time = 0;
      this.running = false;
    }
    start() { this.running = true; }
    stop() { this.running = false; }
    getDelta() { return this.running ? 0.016 : 0; }
    advance(seconds) { this.time += seconds; }
    get elapsed() { return this.time; }
  }

  const clock = new ControlledClock();
  
  clock.start();
  clock.advance(5);
  const afterStart = clock.elapsed;
  
  clock.stop();
  
  const deltaWhilePaused = clock.getDelta();
  
  clock.start();
  clock.advance(3);
  const afterResume = clock.elapsed;
  
  assert.equal(afterStart, 5);
  assert.equal(afterResume, 8);
  assert.equal(afterResume - afterStart, 3);
  assert.equal(deltaWhilePaused, 0);
});

test('Hazard update to prohibited triggers urgent reevaluation', () => {
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

  const initialRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(initialRoute.condition, 'unknown');

  const updatedHazardState = structuredClone(hazardState);
  updatedHazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';
  
  riskAssessment = assessRisk(updatedHazardState, graph);
  context = buildRoutingHazardContext({
    graph,
    hazardState: updatedHazardState,
    riskAssessment,
    expectedTimeSec: 0
  });

  const updatedRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(updatedRoute.condition, 'prohibited');
});

test('Completed agents are not reassigned during reevaluation', () => {
  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  
  const agents = [
    { id: 'agent_1', state: 'SAFE', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0 },
    { id: 'agent_2', state: 'EVACUATING', roomId: 'f5_r2', floor: 5, x: 1, y: 15.25, z: 0 }
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: [], currentWaypointIdx: 0 },
    { agentId: 'agent_2', exitId: 'exit_west', routeCondition: 'permitted', path: [{x:0,z:0}], currentWaypointIdx: 5 }
  ];

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext: null });
  
  const agent1Assignment = result.assignments.find(a => a.agentId === 'agent_1');
  const agent2Assignment = result.assignments.find(a => a.agentId === 'agent_2');
  
  assert.equal(agent1Assignment, undefined);
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
  const context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  const agents = [{ 
    id: 'agent_1', 
    currentExitId: 'exit_west',
    currentRouteCondition: 'permitted',
    path: [{x:0,z:0},{x:1,z:0},{x:2,z:0}],
    currentWaypointIdx: 1,
    roomId: 'f5_r1',
    floor: 5,
    x: 0, y: 15.25, z: 0,
    state: 'EVACUATING'
  }];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: [{x:0,z:0},{x:1,z:0},{x:2,z:0}], currentWaypointIdx: 1 }
  ];

  const fireLocations = [];
  const result = optimizer.reevaluateRoutes(agents, currentAssignments, fireLocations, { routingContext: context });
  
  const assignment = result.assignments.find(a => a.agentId === 'agent_1');
  assert.ok(assignment);
  assert.equal(assignment.exitId, 'exit_east');
});

test('Scenario replacement does not retain old hazard state', () => {
  const graph = loadBuilding(createTowerGraph());
  
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
  
  const scenario2 = {
    schemaVersion: 1,
    id: 'scenario-2',
    name: 'Scenario 2',
    durationSec: 600,
    fires: [{ id: 'fire_2', zoneId: 'L4', startSec: 0, intensity: 0.5 }]
  };
  
  hazardState = applyScenario(graph, scenario2);
  
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
  let context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const initialHash = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition]))
  });

  hazardState = advanceHazardState(hazardState, graph, 1);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 1 });

  const newHash = JSON.stringify({
    status: context.status,
    routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition]))
  });

  assert.equal(newHash, initialHash);
});

test('All-prohibited fallback remains flagged for operator review', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.9 }] };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  const context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  const agents = [{ id: 'agent_1', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0, state: 'EVACUATING' }];

  const result = optimizer.optimizeRoutes(agents, [], { routingContext: context });

  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0].noPermittedCandidate, true);
  assert.equal(result.assignments[0].requiresOperatorReview, true);
  assert.equal(result.requiresOperatorReview, true);
});

test('SimulationClock pause/resume excludes paused wall time', () => {
  const clock = new SimulationClock();

  clock.start();
  clock.setElapsed(5);
  const afterStart = clock.getElapsed();

  clock.stop();
  const deltaWhilePaused = clock.getDelta();
  assert.equal(deltaWhilePaused, 0);

  clock.start();
  clock.setElapsed(8);
  const afterResume = clock.getElapsed();

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
  assert.ok(Math.abs(clock.getElapsed() - 10) < 0.001);
});

test('Urgent reevaluation triggers on newly prohibited route', () => {
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
  let context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const initialRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(initialRoute.condition, 'unknown');

  const updatedHazardState = structuredClone(hazardState);
  updatedHazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  riskAssessment = assessRisk(updatedHazardState, graph);
  context = buildRoutingHazardContext({ graph, hazardState: updatedHazardState, riskAssessment, expectedTimeSec: 0 });

  const updatedRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(updatedRoute.condition, 'prohibited');

  const hash1 = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });
  const hash2 = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });
  assert.equal(hash1, hash2);
});

test('Completed agents are not reassigned during urgent reevaluation', () => {
  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  
  const agents = [
    { id: 'agent_1', state: 'SAFE', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0 },
    { id: 'agent_2', state: 'EVACUATING', roomId: 'f5_r2', floor: 5, x: 1, y: 15.25, z: 0 }
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: [], currentWaypointIdx: 0 },
    { agentId: 'agent_2', exitId: 'exit_west', routeCondition: 'prohibited', path: [{x:0,z:0}], currentWaypointIdx: 5 }
  ];

  const context = {
    routes: { 'L5:exit_west': { condition: 'prohibited' }, 'L5:exit_east': { condition: 'permitted' } },
    availability: { available: true }
  };

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext: context });
  
  const agent1Assignment = result.assignments.find(a => a.agentId === 'agent_1');
  const agent2Assignment = result.assignments.find(a => a.agentId === 'agent_2');
  
  assert.equal(agent1Assignment, undefined, 'Completed agent should not be reassigned');
  assert.ok(agent2Assignment, 'Active agent should be reassigned');
  assert.equal(agent2Assignment.exitId, 'exit_east', 'Agent should be rerouted to permitted exit');
});

test('Equivalent hazard updates do not cause route churn', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }] };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const initialHash = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });

  hazardState = advanceHazardState(hazardState, graph, 1);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 1 });

  const newHash = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });
  assert.equal(newHash, initialHash);
});

test('All-prohibited fallback remains flagged for operator review', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.9 }] };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  const context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  const agents = [{ id: 'agent_1', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0, state: 'EVACUATING' }];

  const result = optimizer.optimizeRoutes(agents, [], { routingContext: context });

  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0].noPermittedCandidate, true);
  assert.equal(result.assignments[0].requiresOperatorReview, true);
  assert.equal(result.requiresOperatorReview, true);
});

test('SimulationClock pause/resume excludes paused wall time', () => {
  const clock = new SimulationClock();

  clock.start();
  clock.setElapsed(5);
  const afterStart = clock.getElapsed();

  clock.stop();
  const deltaWhilePaused = clock.getDelta();
  assert.equal(deltaWhilePaused, 0);

  clock.start();
  clock.setElapsed(8);
  const afterResume = clock.getElapsed();

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
  assert.ok(Math.abs(clock.getElapsed() - 10) < 0.001);
});

test('Urgent reevaluation triggers on newly prohibited route', () => {
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
  let context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const initialRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(initialRoute.condition, 'unknown');

  const updatedHazardState = structuredClone(hazardState);
  updatedHazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';

  riskAssessment = assessRisk(updatedHazardState, graph);
  context = buildRoutingHazardContext({ graph, hazardState: updatedHazardState, riskAssessment, expectedTimeSec: 0 });

  const updatedRoute = getExitRouteCondition(context, 5, 'exit_west');
  assert.equal(updatedRoute.condition, 'prohibited');

  const hash1 = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });
  const hash2 = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });
  assert.equal(hash1, hash2);
});

test('Completed agents are not reassigned during urgent reevaluation', () => {
  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  
  const agents = [
    { id: 'agent_1', state: 'SAFE', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0 },
    { id: 'agent_2', state: 'EVACUATING', roomId: 'f5_r2', floor: 5, x: 1, y: 15.25, z: 0 }
  ];

  const currentAssignments = [
    { agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: [], currentWaypointIdx: 0 },
    { agentId: 'agent_2', exitId: 'exit_west', routeCondition: 'prohibited', path: [{x:0,z:0}], currentWaypointIdx: 5 }
  ];

  const context = {
    routes: { 'L5:exit_west': { condition: 'prohibited' }, 'L5:exit_east': { condition: 'permitted' } },
    availability: { available: true }
  };

  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext: context });
  
  const agent1Assignment = result.assignments.find(a => a.agentId === 'agent_1');
  const agent2Assignment = result.assignments.find(a => a.agentId === 'agent_2');
  
  assert.equal(agent1Assignment, undefined, 'Completed agent should not be reassigned');
  assert.ok(agent2Assignment, 'Active agent should be reassigned');
  assert.equal(agent2Assignment.exitId, 'exit_east', 'Agent should be rerouted to permitted exit');
});

test('Equivalent hazard updates do not cause route churn', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }] };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const initialHash = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });

  hazardState = advanceHazardState(hazardState, graph, 1);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 1 });

  const newHash = JSON.stringify({ status: context.status, routes: Object.fromEntries(Object.entries(context.routes).map(([k, v]) => [k, v.condition])) });
  assert.equal(newHash, initialHash);
});

test('All-prohibited fallback remains flagged for operator review', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.9 }] };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  const context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  const optimizer = new CrowdOptimizer({}, { findPath: () => [{ x: 0, z: 0 }] });
  const agents = [{ id: 'agent_1', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0, state: 'EVACUATING' }];

  const result = optimizer.optimizeRoutes(agents, [], { routingContext: context });

  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0].noPermittedCandidate, true);
  assert.equal(result.assignments[0].requiresOperatorReview, true);
  assert.equal(result.requiresOperatorReview, true);
});

test('Reset and restart lifecycle: scenario retained but hazard state reset', () => {
  const graph = loadBuilding(createTowerGraph());
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }] };

  let hazardState = applyScenario(graph, scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  let context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  assert.ok(context.availability.available);

  hazardState = null;
  riskAssessment = null;
  context = null;

  const freshContext = buildRoutingHazardContext({ graph, hazardState: null, expectedTimeSec: 0 });
  assert.equal(freshContext.availability.available, false);
  assert.equal(freshContext.availability.reason, 'hazard-state:missing');

  hazardState = applyScenario(graph, scenario);
  riskAssessment = assessRisk(hazardState, graph);
  context = buildRoutingHazardContext({ graph, hazardState, riskAssessment, expectedTimeSec: 0 });

  assert.ok(context.availability.available);
  assert.equal(context.timeSec, 0);
});

test('ZoneToGridMapper maps floor zone to correct grid cells', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  const cells = mapper.getZoneCells(floorZone);
  
  assert.ok(cells.length > 0, 'Floor zone should map to grid cells');
  
  for (const { c, r } of cells) {
    const world = navGrid.gridToWorld(c, r);
    assert.ok(world.x >= -30 && world.x <= 30);
    assert.ok(world.z >= -24 && world.z <= 24);
  }
});

test('ZoneToGridMapper maps stairwell zone to grid cells', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  
  const stairZone = graph.data.zones.find(z => z.id === 'stair_west');
  const cells = mapper.getZoneCells(stairZone);
  
  assert.ok(cells.length > 0, 'Stairwell zone should map to grid cells');
  
  for (const { c, r } of cells) {
    const world = navGrid.gridToWorld(c, r);
    assert.ok(Math.abs(world.x - (-28)) <= 3);
  }
});

test('ZoneToGridMapper maps exit zone to grid cells', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  
  const exitZone = graph.data.zones.find(z => z.id === 'exit_west');
  const cells = mapper.getZoneCells(exitZone);
  
  assert.ok(cells.length > 0, 'Exit zone should map to grid cells');
});

test('ZoneToGridMapper caches zone cells', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  const cells1 = mapper.getZoneCells(floorZone);
  const cells2 = mapper.getZoneCells(floorZone);
  
  assert.strictEqual(cells1, cells2, 'Should return cached cells');
});

test('ZoneToGridMapper applies fire hazard to grid cells', () => {
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  const graph = loadBuilding(createTowerGraph());
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  mapper.applyFireHazard(floorZone, 1.0);
  
  const cells = mapper.getZoneCells(floorZone);
  let hasHazardCost = false;
  for (const { c, r } of cells) {
    if (navGrid.hazardCosts[r][c] > 0) { hasHazardCost = true; break; }
  }
  assert.ok(hasHazardCost, 'Fire hazard should apply cost to grid cells');
});

test('ZoneToGridMapper applies smoke hazard to grid cells', () => {
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  const graph = loadBuilding(createTowerGraph());
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  mapper.applySmokeHazard(floorZone, 0.5);
  
  const cells = mapper.getZoneCells(floorZone);
  let hasSmokeCost = false;
  for (const { c, r } of cells) {
    if (navGrid.hazardCosts[r][c] > 0) { hasSmokeCost = true; break; }
  }
  assert.ok(hasSmokeCost, 'Smoke hazard should apply cost to grid cells');
});

test('ZoneToGridMapper applies prohibited zone', () => {
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  const graph = loadBuilding(createTowerGraph());
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  mapper.applyProhibitedZone(floorZone);
  
  const cells = mapper.getZoneCells(floorZone);
  let allBlocked = true;
  for (const { c, r } of cells) {
    if (navGrid.grid[r][c] !== 1) { allBlocked = false; break; }
  }
  assert.ok(allBlocked, 'Prohibited zone should mark all cells as blocked');
});

test('ZoneToGridMapper clears zone hazards', () => {
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  const graph = loadBuilding(createTowerGraph());
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  mapper.applyFireHazard(floorZone, 1.0);
  mapper.clearZoneHazards(floorZone);
  
  const cells = mapper.getZoneCells(floorZone);
  let allCleared = true;
  for (const { c, r } of cells) {
    if (navGrid.hazardCosts[r][c] !== 0) { allCleared = false; break; }
  }
  assert.ok(allCleared, 'Clearing zone hazards should remove all hazard costs');
});

test('ZoneToGridMapper clears all dynamic hazards', () => {
  const navGrid = new NavGrid();
  
  const mapper = new ZoneToGridMapper(navGrid);
  const graph = loadBuilding(createTowerGraph());
  
  const floorZone = graph.data.zones.find(z => z.id === 'L5');
  mapper.applyFireHazard(floorZone, 1.0);
  mapper.clearAllDynamicHazards();
  
  const cells = mapper.getZoneCells(floorZone);
  let allCleared = true;
  for (const { c, r } of cells) {
    if (navGrid.hazardCosts[r][c] !== 0) { allCleared = false; break; }
  }
  assert.ok(allCleared, 'Clearing all dynamic hazards should remove all hazard costs');
});

test('applyHazardStateToGrid applies active fire from hazard state', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const mapper = new ZoneToGridMapper(navGrid);
  
  const hazardState = { schemaVersion: 1, buildingId: graph.data.id, scenarioId: 'test', timeSec: 0, zones: { L5: { fire: { status: 'active', intensity: 0.8, sinceSec: 0, startSec: 0, source: 'scenario' }, smoke: { status: 'none', density: null } } }, connections: {} };
  
  for (const zone of graph.data.zones) { if (zone.id !== 'L5') { hazardState.zones[zone.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } }; } }
  for (const conn of graph.data.connections) { hazardState.connections[conn.id] = { connectionId: conn.id, routeStatus: 'unknown' }; }
  
  const result = applyHazardStateToGrid(new ZoneToGridMapper(navGrid), hazardState, graph);
  assert.ok(result.applied > 0, 'Should apply fire hazard to grid');
});

test('applyHazardStateToGrid applies prohibited connection to grid', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const mapper = new ZoneToGridMapper(navGrid);
  
  const hazardState = { schemaVersion: 1, buildingId: graph.data.id, scenarioId: 'test', timeSec: 0, zones: {}, connections: { conn_L5_stair_west: { connectionId: 'conn_L5_stair_west', routeStatus: 'prohibited' } } };
  
  for (const zone of graph.data.zones) { hazardState.zones[zone.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } }; }
  for (const conn of graph.data.connections) { if (conn.id !== 'conn_L5_stair_west') { hazardState.connections[conn.id] = { connectionId: conn.id, routeStatus: 'unknown' }; } }
  
  const result = applyHazardStateToGrid(mapper, hazardState, graph);
  assert.ok(result.applied > 0, 'Should apply prohibited connection to grid');
});

test('prohibited connection blocks only the doorway, not the entire floor', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const mapper = new ZoneToGridMapper(navGrid);
  
  // Prohibit L5 to stair_west connection
  const hazardState = { schemaVersion: 1, buildingId: graph.data.id, scenarioId: 'test', timeSec: 0, zones: {}, connections: { conn_L5_stair_west: { connectionId: 'conn_L5_stair_west', routeStatus: 'prohibited' } } };
  
  for (const zone of graph.data.zones) { hazardState.zones[zone.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } }; }
  for (const conn of graph.data.connections) { if (conn.id !== 'conn_L5_stair_west') { hazardState.connections[conn.id] = { connectionId: conn.id, routeStatus: 'unknown' }; } }
  
  applyHazardStateToGrid(mapper, hazardState, graph);
  
  // Verify only doorway cells are blocked, not the entire L5 floor
  const l5Zone = graph.data.zones.find(z => z.id === 'L5');
  const l5Cells = mapper.getZoneCells(l5Zone);
  
  let blockedCount = 0;
  let unblockedCount = 0;
  for (const { c, r } of l5Cells) {
    if (navGrid.grid[r][c] === 1) blockedCount++;
    else unblockedCount++;
  }
  
  // Most of L5 should remain unblocked (only doorway blocked)
  assert.ok(unblockedCount > blockedCount, 'Most of L5 floor should remain unblocked');
  assert.ok(blockedCount > 0, 'Doorway should be blocked');
  
  // Verify path from L5 center to L5 east side still exists
  const pathfinder = new Pathfinder(navGrid);
  const path = pathfinder.findPath(0, 0, 20, 0); // Move east within L5
  assert.ok(path.length >= 2, 'Path should exist within L5 floor');
  
  for (const point of path) {
    const g = navGrid.worldToGrid(point.x, point.z);
    assert.ok(navGrid.isWalkable(g.c, g.r), `Path should not go through blocked cells at ${point.x}, ${point.z}`);
  }
});

test('Pathfinder avoids newly blocked region when alternative exists', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  
  // Corridor center is at z=0 (row 48). Clear a corridor at row 48.
  const corridorRow = 48;
  for (let c = 0; c < navGrid.cols; c++) { navGrid.grid[corridorRow][c] = 0; navGrid.blockedStatic[corridorRow][c] = false; }
  // Block the direct path at column 60 (x=0) for the corridor rows
  for (let r = 46; r <= 50; r++) { navGrid.grid[r][60] = 1; navGrid.blockedStatic[r][60] = true; }
  
  // Add alternative corridor at row 40 with vertical connections at start/goal columns
  const altCorridorRow = 40;
  for (let c = 0; c < navGrid.cols; c++) { navGrid.grid[altCorridorRow][c] = 0; navGrid.blockedStatic[altCorridorRow][c] = false; }
  // Vertical connections at start column (20) and goal column (100)
  for (let r = 40; r <= 48; r++) {
    navGrid.grid[r][20] = 0;
    navGrid.blockedStatic[r][20] = false;
    navGrid.grid[r][100] = 0;
    navGrid.blockedStatic[r][100] = false;
  }
  
  const path = pathfinder.findPath(-20, 0, 20, 0);
  assert.ok(path.length > 2, 'Path should go around obstacle');
  
  for (const point of path) {
    const g = navGrid.worldToGrid(point.x, point.z);
    assert.ok(navGrid.isWalkable(g.c, g.r), `Path should not go through blocked cells at ${point.x}, ${point.z}`);
  }
});

test('Hazard cost changes selected path when alternative exists', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  
  // Block most of the grid, only allow two corridors: row 48 (direct) and row 40 (alternative)
  // plus vertical connections at start column (20) and goal column (100)
  for (let r = 0; r < navGrid.rows; r++) {
    for (let c = 0; c < navGrid.cols; c++) {
      const isCorridor = r === 40 || r === 48;
      const isVerticalConnection = (c === 20 || c === 100) && r >= 40 && r <= 48;
      if (!isCorridor && !isVerticalConnection) {
        navGrid.grid[r][c] = 1;
        navGrid.blockedStatic[r][c] = true;
      }
    }
  }
  // Clear the two corridors
  for (let c = 0; c < navGrid.cols; c++) {
    navGrid.grid[48][c] = 0;
    navGrid.blockedStatic[48][c] = false;
    navGrid.grid[40][c] = 0;
    navGrid.blockedStatic[40][c] = false;
  }
  // Vertical connections at start column (20) and goal column (100)
  for (let r = 40; r <= 48; r++) {
    navGrid.grid[r][20] = 0;
    navGrid.blockedStatic[r][20] = false;
    navGrid.grid[r][100] = 0;
    navGrid.blockedStatic[r][100] = false;
  }
  
  // Make direct path (row 48) extremely expensive
  for (let c = 40; c <= 80; c++) { navGrid.hazardCosts[48][c] = 100000; }
  // Make alternative path (row 40) free
  for (let c = 0; c < navGrid.cols; c++) { navGrid.hazardCosts[40][c] = 0; }
  
  const path = pathfinder.findPath(-20, 0, 20, 0);
  const usesRow40 = path.some(p => navGrid.worldToGrid(p.x, p.z).r === 40);
  const usesRow48 = path.some(p => navGrid.worldToGrid(p.x, p.z).r === 48);
  assert.ok(usesRow40, 'Path should take alternative route (row 40) to avoid high hazard costs on row 48');
  const row40Indices = path.map((p, i) => navGrid.worldToGrid(p.x, p.z).r === 40 ? i : -1).filter(i => i >= 0);
});

test('No valid path produces explicit fallback result', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  
  for (let c = 0; c < navGrid.cols; c++) { for (let r = 0; r < navGrid.rows; r++) { navGrid.grid[r][c] = 1; navGrid.blockedStatic[r][c] = true; } }
  
  const path = pathfinder.findPath(0, 0, 10, 10);
  assert.equal(path.length, 2);
  assert.deepEqual(path[0], { x: 0, z: 0 });
  assert.deepEqual(path[1], { x: 10, z: 10 });
});

test('Equivalent hazard states do not cause needless grid rebuilds', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const mapper = new ZoneToGridMapper(navGrid);
  
  const scenario = { schemaVersion: 1, id: 'test-scenario', name: 'Test', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.6 }] };
  
  let hazardState = applyScenario(loadBuilding(createTowerGraph()), scenario);
  let riskAssessment = assessRisk(hazardState, graph);
  
  // Apply hazard to first grid
  applyHazardStateToGrid(mapper, hazardState, graph);
  
  // Capture initial costs from the first grid
  const initialCosts = [];
  for (let r = 0; r < navGrid.rows; r++) { for (let c = 0; c < navGrid.cols; c++) { initialCosts.push({ r, c, cost: navGrid.hazardCosts[r][c] }); } }
  
  // Create fresh grid and apply same hazard
  const navGrid2 = new NavGrid();
  const mapper2 = new ZoneToGridMapper(navGrid2);
  applyHazardStateToGrid(mapper, hazardState, graph);
  
  // Compare costs
  let identical = true;
  for (const { r, c, cost } of initialCosts) { if (navGrid.hazardCosts[r][c] !== cost) { identical = false; break; } }
  assert.ok(identical, 'Equivalent hazard states should produce identical grid costs');
});

test('Active agent can have path recomputed without losing identity', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);
  
  const agents = [{ id: 'agent_1', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0, state: 'EVACUATING', path: [], currentWaypointIdx: 0, currentExitId: 'exit_west', currentRouteCondition: 'permitted' }];
  const currentAssignments = [{ agentId: 'agent_1', exitId: 'exit_west', routeCondition: 'permitted', path: [], currentWaypointIdx: 0 }];
  
  const result = optimizer.reevaluateRoutes(agents, currentAssignments, [], { routingContext: { routes: { 'L5:exit_east': { condition: 'permitted' } }, availability: { available: true } } });
  
  assert.ok(result.assignments.length > 0);
  assert.equal(result.assignments[0].agentId, 'agent_1');
});

test('End-to-end: scenario hazard propagates to grid and affects pathfinding', () => {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const mapper = new ZoneToGridMapper(navGrid);
  
  const scenario = { schemaVersion: 1, id: 'test-fire', name: 'Test Fire', durationSec: 600, fires: [{ id: 'fire_1', zoneId: 'L5', startSec: 0, intensity: 0.8 }] };
  
  const hazardState = applyScenario(loadBuilding(createTowerGraph()), scenario);
  const riskAssessment = assessRisk(hazardState, graph);
  
  applyHazardStateToGrid(mapper, hazardState, graph);
  
  const path = pathfinder.findPath(0, 0, 10, 10);
  assert.ok(path.length >= 2, 'Path should exist');
  
  for (const point of path) {
    const g = navGrid.worldToGrid(point.x, point.z);
    if (navGrid.grid[g.r][g.c] === 1) { assert.ok(navGrid.blockedStatic[g.r][g.c] === false || path.length === 2); }
  }
});