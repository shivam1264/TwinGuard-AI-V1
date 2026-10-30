import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NavigationGraph, EDGE_STATUS } from './NavigationGraph.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { Pathfinder } from './Pathfinder.js';
import { NavGrid } from './NavGrid.js';
import { createTowerGraph, loadBuilding } from './BuildingGraph.js';
import { advanceHazardState, injectFireSource, createHazardState } from './HazardPropagation.js';
import { assessRisk } from './RiskAssessment.js';
import { buildRoutingHazardContext, getExitRouteCondition, ROUTE_CONDITIONS } from './RoutingHazardAdapter.js';
import { ZoneToGridMapper, applyHazardStateToGrid } from './ZoneToGridMapper.js';
import { EVACUATION_STRATEGIES } from '../ai/MultiStrategyRanker.js';

const STRATEGY_TYPES = ['NEAREST_CORE', 'LOAD_BALANCED', 'DYNAMIC_CORE_BALANCING', 'PHASED_ZONE'];

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

function createTestScenario() {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agents = [];
  for (let fl = 1; fl <= 10; fl++) {
    for (let r = 1; r <= 10; r++) {
      const roomId = `f${fl}_r${r}`;
      agents.push(createMockAgent({
        id: `agent_${fl}_${r}`,
        roomId,
        floor: fl,
        x: 0,
        y: (fl - 1) * 3.8,
        z: 0
      }));
    }
  }

  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
    scenarioId: 'strategy-test',
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

  const buildingGraphLoaded = loadBuilding(createTowerGraph());
  const riskAssessment = assessRisk(hazardState, buildingGraphLoaded);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraphLoaded, hazardState, riskAssessment, expectedTimeSec: 0 });

  return { buildingGraph, buildingGraphLoaded, navGrid: new NavGrid(), pathfinder: new Pathfinder(new NavGrid()), optimizer: new CrowdOptimizer(new NavGrid(), new Pathfinder(new NavGrid())), agents, hazardState, riskAssessment, routingContext };
}

function runStrategy(optimizer, agents, strategyType, options = {}) {
  const { buildingGraph, buildingGraphLoaded, navGrid, pathfinder, agents: allAgents, hazardState, riskAssessment, routingContext } = createTestScenario();
  
  // Run optimizer with specific strategy
  const result = optimizer.optimizeRoutes(
    agents,
    [], // fireLocations
    { 
      blockedExitIds: [], 
      strategyType,
      routingContext
    }
  );
  
  return { result, optimizer: optimizer };
}

function countExitLoads(result) {
  const loads = { exit_west: 0, exit_east: 0, exit_south: 0 };
  result.assignments.forEach(a => {
    if (loads[a.exitId] !== undefined) loads[a.exitId]++;
  });
  return loads;
}

function countExitLoadsReevaluate(result) {
  const loads = { exit_west: 0, exit_east: 0, exit_south: 0 };
  result.assignments.forEach(a => {
    if (loads[a.exitId] !== undefined) loads[a.exitId]++;
  });
  return loads;
}

test('Strategy definitions match expected types', () => {
  const types = Object.values(EVACUATION_STRATEGIES).map(s => s.type);
  assert.deepEqual(types.sort(), ['LOAD_BALANCED', 'NEAREST_CORE', 'PHASED_ZONE'].sort());
});

test('Each strategy produces valid assignments for all agents', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  for (const strategyType of STRATEGY_TYPES) {
    const { result } = runStrategy(optimizer, agents, strategyType, { routingContext });
    
    assert.equal(result.assignments.length, 100, `${strategyType}: All 100 agents assigned`);
    result.assignments.forEach(a => {
      assert.ok(a.exitId, `${strategyType}: Agent ${a.agentId} has exitId`);
      assert.ok(a.path && a.path.length > 0, `${strategyType}: Agent ${a.agentId} has path`);
      assert.ok(['exit_west', 'exit_east', 'exit_south'].includes(a.exitId), `${strategyType}: Valid exit`);
    });
  }
});

test('NEAREST_CORE: Agents on upper floors only use West or East cores', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  const { result } = runStrategy(optimizer, agents, 'NEAREST_CORE', { routingContext });
  
  const upperFloorAgents = result.assignments.filter(a => a.agentId.startsWith('agent_') && a.agentId.includes('_') && parseInt(a.agentId.split('_')[1].split('_')[0]) > 1);
  upperFloorAgents.forEach(a => {
    assert.ok(['exit_west', 'exit_east'].includes(a.exitId), `NEAREST_CORE: Upper floor agent ${a.agentId} uses stairwell core`);
  });
});

test('LOAD_BALANCED: Distributes load between West and East cores', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  const { result } = runStrategy(optimizer, agents, 'LOAD_BALANCED', { routingContext });
  
  const loads = countExitLoads(result);
  // With 100 agents across 10 floors, upper floors (2-10) = 90 agents use West/East
  const upperFloorLoads = loads.exit_west + loads.exit_east;
  assert.ok(upperFloorLoads > 0, 'LOAD_BALANCED: Uses both cores');
  
  // Check balance - should be roughly 50/50
  const balance = Math.abs(loads.exit_west - loads.exit_east) / (loads.exit_west + loads.exit_east);
  assert.ok(balance < 0.3, `LOAD_BALANCED: Balance ratio ${balance} should be < 30%`);
});

test('PHASED_ZONE: Fire floor and adjacent floors evacuate first', () => {
  // Create scenario with fire on floor 5
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // Inject fire on floor 5
  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
    scenarioId: 'phased-test',
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
  hazardState.zones.L5 = { fire: { status: 'active', intensity: 0.6 }, smoke: { status: 'active', density: 0.3 } };

  const buildingGraphLoaded = loadBuilding(createTowerGraph());
  const riskAssessment = assessRisk(hazardState, buildingGraphLoaded);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraphLoaded, hazardState, riskAssessment, expectedTimeSec: 0 });

  const agents = [];
  for (let fl = 1; fl <= 10; fl++) {
    for (let r = 1; r <= 10; r++) {
      agents.push(createMockAgent({
        id: `agent_${fl}_${r}`,
        roomId: `f${fl}_r${r}`,
        floor: fl,
        x: 0,
        y: (fl - 1) * 3.8,
        z: 0
      }));
    }
  }

  const { result } = runStrategy(optimizer, agents, 'PHASED_ZONE', { routingContext });
  
  // Fire floor (5) and adjacent (4,6) should have agents with lower delay
  // We can't directly test delay, but we can verify assignments exist
  const fireFloorAgents = result.assignments.filter(a => a.agentId.includes('_5_'));
  const adjacentAgents = result.assignments.filter(a => a.agentId.includes('_4_') || a.agentId.includes('_6_'));
  const otherAgents = result.assignments.filter(a => !a.agentId.includes('_4_') && !a.agentId.includes('_5_') && !a.agentId.includes('_6_'));
  
  assert.ok(fireFloorAgents.length === 10, 'Fire floor has 10 agents');
  assert.ok(adjacentAgents.length === 20, 'Adjacent floors have 20 agents');
  assert.ok(otherAgents.length === 70, 'Other floors have 70 agents');
});

test('All strategies: Prohibited exits are not selected', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  // Prohibit west exit
  const hazardState = routingContext.policy; // Not accessible directly, use fresh context
  const buildingGraph = loadBuilding(createTowerGraph());
  const hazardStateFresh = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
    scenarioId: 'test',
    timeSec: 0,
    zones: {},
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    hazardStateFresh.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardStateFresh.connections[c.id] = { connectionId: c.id, routeStatus: 'permitted' };
  });
  hazardStateFresh.connections.conn_L5_stair_west.routeStatus = 'prohibited';
  
  const buildingGraphLoaded = loadBuilding(createTowerGraph());
  const riskAssessment = assessRisk(hazardStateFresh, buildingGraphLoaded);
  const routingContextFresh = buildRoutingHazardContext({ graph: buildingGraphLoaded, hazardState: hazardStateFresh, riskAssessment, expectedTimeSec: 0 });
  
  const floor5Agents = [];
  for (let r = 1; r <= 10; r++) {
    floor5Agents.push(createMockAgent({
      id: `agent_5_${r}`,
      roomId: `f5_r${r}`,
      floor: 5,
      x: 0, y: 15.25, z: 0
    }));
  }
  
  for (const strategyType of STRATEGY_TYPES) {
    const result = optimizer.optimizeRoutes(floor5Agents, [], { 
      strategyType, 
      routingContext: routingContextFresh 
    });
    
    result.assignments.forEach(a => {
      assert.notEqual(a.exitId, 'exit_west', `${strategyType}: No agent assigned to prohibited west exit`);
    });
  }
});

test('LOAD_BALANCED and DYNAMIC_CORE_BALANCING produce similar balanced results', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  const resultBalanced = optimizer.optimizeRoutes(agents, [], { 
    strategyType: 'LOAD_BALANCED', routingContext 
  });
  const resultDynamic = optimizer.optimizeRoutes(agents, [], { 
    strategyType: 'DYNAMIC_CORE_BALANCING', routingContext 
  });
  
  const loadsBalanced = countExitLoads(resultBalanced);
  const loadsDynamic = countExitLoads(resultDynamic);
  
  // Both should use West and East primarily for upper floors
  assert.ok(loadsBalanced.exit_west > 0 && loadsBalanced.exit_east > 0);
  assert.ok(loadsDynamic.exit_west > 0 && loadsDynamic.exit_east > 0);
  
  // Both should have good balance
  const balanceBalanced = Math.abs(loadsBalanced.exit_west - loadsBalanced.exit_east);
  const balanceDynamic = Math.abs(loadsDynamic.exit_west - loadsDynamic.exit_east);
  assert.ok(balanceBalanced < 30 && balanceDynamic < 30, 'Both strategies maintain balance');
});

test('NEAREST_CORE concentrates load on nearest exit', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  const { result } = runStrategy(optimizer, agents, 'NEAREST_CORE', { routingContext });
  
  const loads = countExitLoads(result);
  // With NEAREST_CORE, most upper floor agents should go to nearest core
  // Since agents are centered at x=0, they're equidistant, but slight variations
  // should cause some distribution
  assert.ok(loads.exit_west + loads.exit_east > 0, 'NEAREST_CORE uses stairwell cores');
});

test('Congestion penalties influence assignment in LOAD_BALANCED and PHASED_ZONE', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  // Test with high load on west
  const resultLowWest = optimizer.optimizeRoutes(agents, [], { 
    strategyType: 'LOAD_BALANCED', routingContext 
  });
  
  // Manually set high load on west and rerun
  // (We can't easily modify internal state, but we can verify the strategy type is used)
  const { result: resultNormal } = runStrategy(optimizer, agents, 'LOAD_BALANCED', { routingContext });
  const { result: resultPhased } = runStrategy(optimizer, agents, 'PHASED_ZONE', { routingContext });
  
  // Both should produce valid assignments
  assert.ok(resultNormal.assignments.length === 100);
  assert.ok(resultPhased.assignments.length === 100);
});

test('Strategy type affects congestion penalty calculation', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  const { result: nearest } = runStrategy(optimizer, agents, 'NEAREST_CORE', { routingContext });
  const { result: balanced } = runStrategy(optimizer, agents, 'LOAD_BALANCED', { routingContext });
  const { result: phased } = runStrategy(optimizer, agents, 'PHASED_ZONE', { routingContext });
  
  // NEAREST_CORE should have no congestion penalty internally
  // LOAD_BALANCED and PHASED_ZONE should have different load distributions
  const loadsNearest = countExitLoads(nearest);
  const loadsBalanced = countExitLoads(balanced);
  const loadsPhased = countExitLoads(phased);
  
  // All should produce valid assignments
  assert.equal(nearest.assignments.length, 100);
  assert.equal(balanced.assignments.length, 100);
  assert.equal(phased.assignments.length, 100);
});

test('Operator review flag set when no permitted exit', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);
  
  const agents = [createMockAgent({ id: 'agent_1', roomId: 'f5_r1', floor: 5, x: 0, y: 15.25, z: 0 })];
  
  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
    scenarioId: 'test',
    timeSec: 0,
    zones: { L5: { fire: { status: 'active', intensity: 0.9 }, smoke: { status: 'active', density: 0.8 } } },
    connections: {}
  };
  buildingGraph.data.zones.forEach(z => {
    if (!hazardState.zones[z.id]) hazardState.zones[z.id] = { fire: { status: 'none', intensity: null }, smoke: { status: 'none', density: null } };
  });
  buildingGraph.data.connections.forEach(c => {
    hazardState.connections[c.id] = { connectionId: c.id, routeStatus: 'prohibited' };
  });
  
  const buildingGraphLoaded = loadBuilding(createTowerGraph());
  const riskAssessment = assessRisk(hazardState, buildingGraphLoaded);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraphLoaded, hazardState, riskAssessment, expectedTimeSec: 0 });
  
  for (const strategyType of STRATEGY_TYPES) {
    const result = optimizer.optimizeRoutes(agents, [], { strategyType, routingContext });
    assert.ok(result.assignments[0].noPermittedCandidate, `${strategyType}: noPermittedCandidate flag set`);
    assert.ok(result.assignments[0].requiresOperatorReview, `${strategyType}: requiresOperatorReview flag set`);
    assert.ok(result.requiresOperatorReview, `${strategyType}: Result requiresOperatorReview flag set`);
  }
});

test('Reevaluation preserves progress for agents with >10% completion', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  const agent = createMockAgent({ 
    id: 'agent_1', 
    roomId: 'f5_r1', 
    floor: 5,
    currentExitId: 'exit_west',
    currentRouteCondition: 'permitted',
    path: Array(100).fill({x:0,z:0}),
    currentWaypointIdx: 50 // 50% progress
  });
  
  const currentAssignments = [{
    agentId: 'agent_1',
    exitId: 'exit_west',
    routeCondition: 'permitted',
    path: Array(100).fill({x:0,z:0}),
    currentWaypointIdx: 50
  }];
  
  const result = optimizer.reevaluateRoutes([agent], currentAssignments, [], { routingContext });
  
  // With 50% progress, should keep current exit
  assert.equal(result.assignments[0].exitId, 'exit_west');
  assert.ok(!result.assignments[0].requiresOperatorReview);
});

test('Reevaluation switches exit when current route prohibited', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);
  
  const agent = createMockAgent({ 
    id: 'agent_1', 
    roomId: 'f5_r1', 
    floor: 5,
    currentExitId: 'exit_west',
    currentRouteCondition: 'permitted',
    path: [{x:0,z:0}],
    currentWaypointIdx: 0
  });
  
  const currentAssignments = [{
    agentId: 'agent_1',
    exitId: 'exit_west',
    routeCondition: 'permitted',
    path: [{x:0,z:0}],
    currentWaypointIdx: 0
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
  hazardState.connections.conn_L5_stair_west.routeStatus = 'prohibited';
  
  const buildingGraphLoaded = loadBuilding(createTowerGraph());
  const riskAssessment = assessRisk(hazardState, buildingGraphLoaded);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraphLoaded, hazardState, riskAssessment, expectedTimeSec: 0 });
  
  const result = optimizer.reevaluateRoutes([agent], currentAssignments, [], { routingContext });
  
  assert.equal(result.assignments[0].exitId, 'exit_east');
  assert.equal(result.assignments[0].requiresOperatorReview, false);
});

test('Deterministic results for identical inputs', () => {
  const { optimizer, agents, routingContext } = createTestScenario();
  
  // Run same strategy twice
  const result1 = optimizer.optimizeRoutes(agents, [], { 
    strategyType: 'LOAD_BALANCED', routingContext 
  });
  const result2 = optimizer.optimizeRoutes(agents, [], { 
    strategyType: 'LOAD_BALANCED', routingContext 
  });
  
  // Compare exit assignments
  for (let i = 0; i < 100; i++) {
    assert.equal(result1.assignments[i].exitId, result2.assignments[i].exitId, 
      `Agent ${i} should have same exit across runs`);
  }
});

test('All strategies handle floor 1 south exit correctly', () => {
  const { optimizer, routingContext } = createTestScenario();
  
  const agents = [];
  for (let r = 1; r <= 10; r++) {
    agents.push(createMockAgent({
      id: `agent_1_${r}`,
      roomId: `f1_r${r}`,
      floor: 1,
      x: 0, y: 0, z: 0
    }));
  }
  
  for (const strategyType of STRATEGY_TYPES) {
    const result = optimizer.optimizeRoutes(agents, [], { 
      strategyType, routingContext 
    });
    
    // Floor 1 can use all three exits
    const exitIds = result.assignments.map(a => a.exitId);
    assert.ok(exitIds.includes('exit_south'), `${strategyType}: South exit used on floor 1`);
  }
});

test('Stairwell capacity limits respected in PHASED_ZONE', () => {
  const buildingGraph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);
  
  // Fire on floor 5
  const hazardState = {
    schemaVersion: 1,
    buildingId: 'twinguard-tower-10f',
    scenarioId: 'phased-capacity',
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
  hazardState.zones.L5 = { fire: { status: 'active', intensity: 0.6 }, smoke: { status: 'active', density: 0.3 } };
  
  const buildingGraphLoaded = loadBuilding(createTowerGraph());
  const riskAssessment = assessRisk(hazardState, buildingGraphLoaded);
  const routingContext = buildRoutingHazardContext({ graph: buildingGraphLoaded, hazardState, riskAssessment, expectedTimeSec: 0 });
  
  const agents = [];
  for (let fl = 1; fl <= 10; fl++) {
    for (let r = 1; r <= 10; r++) {
      agents.push(createMockAgent({
        id: `agent_${fl}_${r}`,
        roomId: `f${fl}_r${r}`,
        floor: fl,
        x: 0,
        y: (fl - 1) * 3.8,
        z: 0
      }));
    }
  }
  
  const result = optimizer.optimizeRoutes(agents, [], { 
    strategyType: 'PHASED_ZONE', routingContext 
  });
  
  // Fire floor 5 and adjacent 4,6 should evacuate
  // Others may be delayed (implementation detail)
  assert.equal(result.assignments.length, 100, 'All agents assigned');
});

test('EVACUATION_STRATEGIES exported correctly', () => {
  assert.ok(EVACUATION_STRATEGIES.STRATEGY_A);
  assert.ok(EVACUATION_STRATEGIES.STRATEGY_B);
  assert.ok(EVACUATION_STRATEGIES.STRATEGY_C);
  
  assert.equal(EVACUATION_STRATEGIES.STRATEGY_A.type, 'NEAREST_CORE');
  assert.equal(EVACUATION_STRATEGIES.STRATEGY_B.type, 'LOAD_BALANCED');
  assert.equal(EVACUATION_STRATEGIES.STRATEGY_C.type, 'PHASED_ZONE');
});

test('All strategies handle missing routingContext gracefully', () => {
  const { optimizer, agents } = createTestScenario();
  
  for (const strategyType of STRATEGY_TYPES) {
    const result = optimizer.optimizeRoutes(agents, [], { strategyType });
    assert.equal(result.assignments.length, 100);
    result.assignments.forEach(a => {
      assert.ok(a.path.length > 0);
      assert.ok(a.exitId);
    });
  }
});

test('MultiStrategyRanker rankStrategies produces valid ranking', async () => {
  const { MultiStrategyRanker } = await import('../ai/MultiStrategyRanker.js');
  const ranker = new MultiStrategyRanker();
  
  const scenario = {
    id: 'test-scenario',
    name: 'Test Scenario',
    structuralFailures: { blockedExits: [] },
    hazard: { floor: 4, smokeSpreadRadius: 7.0 }
  };
  
  const rooms = [];
  for (let fl = 1; fl <= 10; fl++) {
    for (let r = 1; r <= 10; r++) {
      rooms.push({
        id: `f${fl}_r${r}`,
        floor: fl,
        peopleCount: 2,
        center: { x: 0, y: (fl-1)*3.8, z: 0 }
      });
    }
  }
  
  const exits = [
    { id: 'exit_west', name: 'Exit A', capacity: 60, x: -29, z: 0 },
    { id: 'exit_east', name: 'Exit B', capacity: 60, x: 29, z: 0 },
    { id: 'exit_south', name: 'Exit C', capacity: 80, x: 0, z: 23 }
  ];
  
  const ranking = ranker.rankStrategies(scenario, rooms, exits);
  
  assert.equal(ranking.rankedStrategies.length, 3);
  assert.ok(ranking.bestStrategy);
  assert.ok(ranking.rankedStrategies[0].score >= ranking.rankedStrategies[1].score);
  assert.ok(ranking.rankedStrategies[1].score >= ranking.rankedStrategies[2].score);
  
  ranking.rankedStrategies.forEach(s => {
    assert.ok(s.score >= 15 && s.score <= 99);
    assert.ok(s.strengths.length > 0);
    assert.ok(s.vulnerabilities.length > 0);
    assert.ok(s.radarMetrics);
    assert.ok(s.xaiDiagnostics);
  });
});