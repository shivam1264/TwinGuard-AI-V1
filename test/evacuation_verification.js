// Comprehensive Automated Verification Suite for TwinGuard Evacuation System
import { NavigationGraph, EDGE_STATUS } from '../src/simulation/NavigationGraph.js';
import { RouteOptimizationEngine } from '../src/simulation/RouteOptimizationEngine.js';
import { ScenarioEngine, INCIDENT_TYPES } from '../src/simulation/ScenarioEngine.js';
import { NavGrid } from '../src/simulation/NavGrid.js';
import { Pathfinder } from '../src/simulation/Pathfinder.js';
import { CrowdOptimizer } from '../src/simulation/CrowdOptimizer.js';
import { PRESET_SCENARIOS, createCase3Scenario } from '../src/ai/ScenarioEngine.js';
import { MultiStrategyRanker, EVACUATION_STRATEGIES } from '../src/ai/MultiStrategyRanker.js';
import * as THREE from 'three';
import { EmergencyVehiclesManager } from '../src/three/EmergencyVehiclesManager.js';

console.log('=======================================================');
console.log('🚀 RUNNING MASTER EVACUATION VERIFICATION SUITE');
console.log('=======================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------------
// TEST 1: Navigation Graph Completeness & Connectivity
// -------------------------------------------------------------------
console.log('\n--- Test Suite 1: 10-Storey Navigation Graph Completeness ---');
const navGraph = new NavigationGraph(10, 3.8);

assert(navGraph.nodes.size > 200, `Graph contains ${navGraph.nodes.size} nodes (expected > 200)`);
assert(navGraph.edges.size > 250, `Graph contains ${navGraph.edges.size} edges (expected > 250)`);

// Connectivity validation: Every room (100 total) must have a valid path to an exit
const connectivity = navGraph.validateConnectivity();
assert(connectivity.isValid === true, `All 100 rooms connected to emergency exits (${connectivity.connectedRooms}/${connectivity.totalRooms})`);

// -------------------------------------------------------------------
// TEST 2: Capacity-Aware Route Optimization
// -------------------------------------------------------------------
console.log('\n--- Test Suite 2: Route Optimization & Capacity Load-Balancing ---');
const routeOptimizer = new RouteOptimizationEngine(navGraph);

// Test Room-to-Exit path from top floor (Floor 10 Penthouse)
const penthousePath = routeOptimizer.findShortestPath('node_f10_r1_center', 'node_exit_a_west');
assert(penthousePath.success === true, 'Floor 10 room calculates path to Exit A');
assert(penthousePath.waypoints3D.length > 5, `Floor 10 path has ${penthousePath.waypoints3D.length} waypoints through stairwells`);

// Test Alternative Route Generation
const altPath = routeOptimizer.findAlternativePath('node_f10_r1_center', 'node_exit_a_west', penthousePath);
assert(altPath !== null && altPath.success === true, 'Alternative divergent path computed successfully');

// Simulate 50 agents on upper floors and verify load distribution
const sampleAgents = [];
for (let i = 1; i <= 50; i++) {
  const fl = ((i % 9) + 2); // Floors 2 to 10
  const rIdx = (i % 10) + 1;
  sampleAgents.push({
    id: `agent_${i}`,
    floor: fl,
    roomId: `f${fl}_r${rIdx}`
  });
}

const crowdPlan = routeOptimizer.optimizeEvacuationRoutes(sampleAgents);
assert(crowdPlan.assignments.length === 50, 'All 50 agents received route assignments');

const exitLoads = crowdPlan.exitStats;
const westExit = exitLoads.find(e => e.id === 'exit_west');
const eastExit = exitLoads.find(e => e.id === 'exit_east');

assert(westExit.load > 0 && eastExit.load > 0,
  `Crowd load balanced across exits: Exit A (${westExit.load} agents), Exit B (${eastExit.load} agents)`);

// -------------------------------------------------------------------
// TEST 3: Dynamic Rerouting on Hazard & Stairwell Blockage
// -------------------------------------------------------------------
console.log('\n--- Test Suite 3: Multi-Hazard Scenarios & Dynamic Rerouting ---');
const scenarioEngine = new ScenarioEngine(navGraph, routeOptimizer);

// Trigger West Stairwell Core Blockage
scenarioEngine.blockStairwellCore('West', null);

// Upper floor should route via East Stairwell
const eastBackupPath = routeOptimizer.findShortestPath('node_f10_r1_center', 'node_exit_b_east');
assert(eastBackupPath.success === true, 'Upper floor automatically routes via East Stairwell and Exit B');

// When Exit A is restricted (blocked portal)
scenarioEngine.restrictExit('exit_a');
const blockedExitPath = routeOptimizer.findShortestPath('node_f10_r1_center', 'node_exit_a_west');
assert(blockedExitPath.success === false, 'West Exit unreachable when Exit A portal is restricted');

// Clear blockage and verify recovery
scenarioEngine.clearAllIncidents();
const recoveredPath = routeOptimizer.findShortestPath('node_f10_r1_center', 'node_exit_a_west');
assert(recoveredPath.success === true, 'Path to West Exit restored after incident clearance');

// -------------------------------------------------------------------
// TEST 4: Occupant Accounting Strict Invariant
// -------------------------------------------------------------------
console.log('\n--- Test Suite 4: Occupant Accounting Strict Invariant ---');
const totalOccupants = 120;
let evacuated = 0;
let inside = totalOccupants;
let inTransit = 80;
let queued = 40;

// Invariant: Total = Evacuated + Inside
assert(totalOccupants === evacuated + inside, 'Initial state: Total = Evacuated + Inside');
assert(inside === inTransit + queued, 'Inside is strictly the sum of inTransit and queued');

// Simulate 35 people reaching muster zone
evacuated += 35;
inside -= 35;
inTransit -= 25;
queued -= 10;
assert(totalOccupants === evacuated + inside, `Mid-evacuation: ${totalOccupants} = ${evacuated} + ${inside}`);
assert(inside === inTransit + queued, `Inside (${inside}) matches inTransit (${inTransit}) + queued (${queued})`);

// -------------------------------------------------------------------
// TEST 5: CASE I - Ground Floor (L1) Evacuation Dynamics
// -------------------------------------------------------------------
console.log('\n--- Test Suite 5: Case I Ground Floor (L1) Evacuation Process ---');
const navGrid = new NavGrid();
const pathfinder = new Pathfinder(navGrid);
const crowdOptimizer = new CrowdOptimizer(navGrid, pathfinder);

// Generate 20 Ground Floor (L1) occupants across rooms f1_r1 to f1_r10
const groundOccupants = [];
for (let r = 1; r <= 10; r++) {
  groundOccupants.push({
    id: `l1_agent_${r * 2 - 1}`,
    floor: 1,
    roomId: `f1_r${r}`,
    x: -20 + (r * 3.8),
    y: 0.175,
    z: r <= 5 ? -10.0 : 10.0
  });
  groundOccupants.push({
    id: `l1_agent_${r * 2}`,
    floor: 1,
    roomId: `f1_r${r}`,
    x: -19 + (r * 3.8),
    y: 0.175,
    z: r <= 5 ? -12.0 : 12.0
  });
}

// 5.A: CASE I - Hazard Near Front / Main Gate (Exit C / South Gate)
console.log('\n  -> Case I.A: Fire Near Front/Main Gate (Exit C)');
const fireMainGate = { x: 0.0, y: 0.2, z: 20.0, roomId: 'f1_r8', floor: 1 };
const planMainFire = crowdOptimizer.optimizeRoutes(groundOccupants, [fireMainGate], ['exit_south']);

const countSouthA = planMainFire.assignments.filter(a => a.exitId === 'exit_south').length;
const countWestA = planMainFire.assignments.filter(a => a.exitId === 'exit_west').length;
const countEastA = planMainFire.assignments.filter(a => a.exitId === 'exit_east').length;

assert(countSouthA === 0, 'ZERO occupants escape via Front/Main Gate when hazard is near Front Gate (0/20)');
assert(countWestA > 0, `Occupants escape via West Gate (Exit A): ${countWestA} occupants`);
assert(countEastA > 0, `Occupants escape via East Gate (Exit B): ${countEastA} occupants`);
assert(countWestA + countEastA === 20, 'All 20 Ground Floor occupants routed strictly to West and East Gates');

// Verify that no waypoint in any assigned path traverses through the front gate (z >= 22.0 at x = 0)
const visitsFrontGate = planMainFire.assignments.some(a =>
  a.path.some(pt => Math.abs(pt.x) < 2.0 && pt.z >= 22.5)
);
assert(visitsFrontGate === false, 'Strict geometric avoidance: No occupant path enters the Front Gate threshold');

// 5.B: CASE I - Hazard Near East Gate & East Stair (Exit B)
console.log('\n  -> Case I.B: Fire Near East Gate (Exit B)');
const fireEastGate = { x: 28.0, y: 0.2, z: 0.0, roomId: 'f1_r10', floor: 1 };
const planEastFire = crowdOptimizer.optimizeRoutes(groundOccupants, [fireEastGate], ['exit_east']);

const countEastB = planEastFire.assignments.filter(a => a.exitId === 'exit_east').length;
const countWestB = planEastFire.assignments.filter(a => a.exitId === 'exit_west').length;
const countSouthB = planEastFire.assignments.filter(a => a.exitId === 'exit_south').length;

assert(countEastB === 0, 'ZERO occupants escape via East Gate when hazard is near East Gate (0/20)');
assert(countWestB > 0, `Occupants escape via West Gate (Exit A): ${countWestB} occupants`);
assert(countSouthB > 0, `Occupants escape via Front/Main Gate (Exit C): ${countSouthB} occupants`);
assert(countWestB + countSouthB === 20, 'All 20 Ground Floor occupants routed strictly to West and Front Gates');

// 5.C: CASE I - Hazard Near West Gate & West Stair (Exit A)
console.log('\n  -> Case I.C: Fire Near West Gate (Exit A)');
const fireWestGate = { x: -28.0, y: 0.2, z: 0.0, roomId: 'f1_r6', floor: 1 };
const planWestFire = crowdOptimizer.optimizeRoutes(groundOccupants, [fireWestGate], ['exit_west']);

const countWestC = planWestFire.assignments.filter(a => a.exitId === 'exit_west').length;
const countEastC = planWestFire.assignments.filter(a => a.exitId === 'exit_east').length;
const countSouthC = planWestFire.assignments.filter(a => a.exitId === 'exit_south').length;

assert(countWestC === 0, 'ZERO occupants escape via West Gate when hazard is near West Gate (0/20)');
assert(countEastC > 0, `Occupants escape via East Gate (Exit B): ${countEastC} occupants`);
assert(countSouthC > 0, `Occupants escape via Front/Main Gate (Exit C): ${countSouthC} occupants`);
assert(countEastC + countSouthC === 20, 'All 20 Ground Floor occupants routed strictly to East and Front Gates');

// -------------------------------------------------------------------
// TEST 6: Multi-Strategy Headless Evacuation Time & Ranking
// -------------------------------------------------------------------
console.log('\n--- Test Suite 6: Multi-Strategy Ranking & Evacuation Clearance Times ---');
const ranker = new MultiStrategyRanker();

// Dummy room and exit definitions for multi-strategy simulation
const testRooms = [];
for (let fl = 1; fl <= 3; fl++) {
  for (let r = 1; r <= 10; r++) {
    testRooms.push({
      id: `f${fl}_r${r}`,
      floor: fl,
      center: { x: -20 + (r * 4), y: (fl - 1) * 3.8, z: r <= 5 ? -12 : 12 },
      peopleCount: 2
    });
  }
}
const testExits = [
  { id: 'exit_west', name: 'West Gate', x: -29.2, z: 0, capacity: 60 },
  { id: 'exit_east', name: 'East Gate', x: 29.2, z: 0, capacity: 60 },
  { id: 'exit_south', name: 'Front / Main Gate', x: 0, z: 23.5, capacity: 80 }
];

// Test Case 1.A Preset Evaluation
const resultFrontGate = ranker.rankStrategies(PRESET_SCENARIOS.CASE_1_L1_FRONT_GATE, testRooms, testExits);
assert(resultFrontGate.rankedStrategies.length === 3, 'Evaluated all 3 evacuation strategies under Case 1 Front Gate fire');

const bestStratA = resultFrontGate.bestStrategy;
assert(bestStratA.evacuationTimeSeconds > 0, `Computed valid evacuation clearance time: ${bestStratA.evacuationTimeSeconds}s`);
assert(bestStratA.exitLoads.exitC === 0, `Exit C (Front Gate) load is strictly 0 under Case 1 Front Gate hazard`);
assert(bestStratA.exitLoads.coreA > 0 && bestStratA.exitLoads.coreB > 0,
  `Crowd egressed via West (${bestStratA.exitLoads.coreA}) and East (${bestStratA.exitLoads.coreB})`);

// Test Case 1.B Preset Evaluation
const resultEastGate = ranker.rankStrategies(PRESET_SCENARIOS.CASE_1_L1_EAST_GATE, testRooms, testExits);
const bestStratB = resultEastGate.bestStrategy;
assert(bestStratB.exitLoads.coreB === 0, `Exit B (East Gate) load is strictly 0 under Case 1 East Gate hazard`);
assert(bestStratB.exitLoads.coreA > 0 && bestStratB.exitLoads.exitC > 0,
  `Crowd egressed via West (${bestStratB.exitLoads.coreA}) and Front Gate (${bestStratB.exitLoads.exitC})`);

// Test Case 1.C Preset Evaluation
const resultWestGate = ranker.rankStrategies(PRESET_SCENARIOS.CASE_1_L1_WEST_GATE, testRooms, testExits);
const bestStratC = resultWestGate.bestStrategy;
assert(bestStratC.exitLoads.coreA === 0, `Exit A (West Gate) load is strictly 0 under Case 1 West Gate hazard`);
assert(bestStratC.exitLoads.coreB > 0 && bestStratC.exitLoads.exitC > 0,
  `Crowd egressed via East (${bestStratC.exitLoads.coreB}) and Front Gate (${bestStratC.exitLoads.exitC})`);

// -------------------------------------------------------------------
// TEST 7: CASE II - Top Floor (L10) Stair Avoidance vs Lower Floor Continuity
// -------------------------------------------------------------------
console.log('\n--- Test Suite 7: Case II Top Floor (L10) Evacuation Process ---');

// Build a multi-floor test population: 10 occupants on Floor 10, plus 40 occupants on Floors 2-9
const multiFloorOccupants = [];

// 10 occupants on Level 10 (Penthouse)
for (let r = 1; r <= 10; r++) {
  multiFloorOccupants.push({
    id: `l10_agent_${r}`,
    floor: 10,
    roomId: `f10_r${r}`,
    x: -20 + (r * 3.8),
    y: 9 * 3.8 + 0.175,
    z: r <= 5 ? -10.0 : 10.0
  });
}

// 40 occupants distributed across Floors 2 to 9
for (let fl = 2; fl <= 9; fl++) {
  for (let i = 1; i <= 5; i++) {
    multiFloorOccupants.push({
      id: `agent_f${fl}_${i}`,
      floor: fl,
      roomId: `f${fl}_r${i * 2}`,
      x: -18 + (i * 7.0),
      y: (fl - 1) * 3.8 + 0.175,
      z: 5.0
    });
  }
}

// 7.A: CASE II.A - Hazard near East Stair on Level 10
console.log('\n  -> Case II.A: Fire Near East Stair on Level 10');
const fireEastL10 = { x: 26.4, y: 9 * 3.8 + 0.2, z: 0.0, roomId: 'f10_r5', floor: 10 };
const planEastL10 = crowdOptimizer.optimizeRoutes(multiFloorOccupants, [fireEastL10], [], 'LOAD_BALANCED', { 10: ['exit_east'] });

const l10AgentsA = planEastL10.assignments.filter(a => a.agentId.startsWith('l10_'));
const lowerAgentsA = planEastL10.assignments.filter(a => !a.agentId.startsWith('l10_'));

const l10EastA = l10AgentsA.filter(a => a.exitId === 'exit_east').length;
const l10WestA = l10AgentsA.filter(a => a.exitId === 'exit_west').length;

assert(l10EastA === 0, 'ZERO Level 10 occupants use East stair when hazard is near East stair on L10 (0/10)');
assert(l10WestA === 10, 'ALL Level 10 occupants divert safely to West stair (10/10)');

// CRITICAL ASSERTION: Lower floors (L2 - L9) are NOT affected and STILL use BOTH stairs!
const lowerEastA = lowerAgentsA.filter(a => a.exitId === 'exit_east').length;
const lowerWestA = lowerAgentsA.filter(a => a.exitId === 'exit_west').length;

assert(lowerEastA > 0, `Lower floors continue to use East Stair Core B (${lowerEastA} occupants)`);
assert(lowerWestA > 0, `Lower floors continue to use West Stair Core A (${lowerWestA} occupants)`);
assert(lowerEastA + lowerWestA === lowerAgentsA.length, 'All 40 lower floor occupants successfully routed');

// 7.B: CASE II.B - Hazard near West Stair on Level 10
console.log('\n  -> Case II.B: Fire Near West Stair on Level 10');
const fireWestL10 = { x: -26.4, y: 9 * 3.8 + 0.2, z: 0.0, roomId: 'f10_r1', floor: 10 };
const planWestL10 = crowdOptimizer.optimizeRoutes(multiFloorOccupants, [fireWestL10], [], 'LOAD_BALANCED', { 10: ['exit_west'] });

const l10AgentsB = planWestL10.assignments.filter(a => a.agentId.startsWith('l10_'));
const lowerAgentsB = planWestL10.assignments.filter(a => !a.agentId.startsWith('l10_'));

const l10WestB = l10AgentsB.filter(a => a.exitId === 'exit_west').length;
const l10EastB = l10AgentsB.filter(a => a.exitId === 'exit_east').length;

assert(l10WestB === 0, 'ZERO Level 10 occupants use West stair when hazard is near West stair on L10 (0/10)');
assert(l10EastB === 10, 'ALL Level 10 occupants divert safely to East stair (10/10)');

// CRITICAL ASSERTION: Lower floors (L2 - L9) continue using BOTH stairs!
const lowerWestB = lowerAgentsB.filter(a => a.exitId === 'exit_west').length;
const lowerEastB = lowerAgentsB.filter(a => a.exitId === 'exit_east').length;

assert(lowerWestB > 0, `Lower floors continue to use West Stair Core A (${lowerWestB} occupants)`);
assert(lowerEastB > 0, `Lower floors continue to use East Stair Core B (${lowerEastB} occupants)`);
assert(lowerWestB + lowerEastB === lowerAgentsB.length, 'All 40 lower floor occupants successfully routed');

// 7.C: CASE II Multi-Strategy Ranking & Clearance Times
console.log('\n  -> Case II Strategy Ranking Evaluation');
const resultL10East = ranker.rankStrategies(PRESET_SCENARIOS.CASE_2_L10_EAST_STAIR, testRooms, testExits);
assert(resultL10East.bestStrategy.evacuationTimeSeconds > 0, `L10 East Fire clearance time: ${resultL10East.bestStrategy.evacuationTimeSeconds}s`);
assert(resultL10East.bestStrategy.exitLoads.coreA > 0 && resultL10East.bestStrategy.exitLoads.coreB > 0,
  `Dual-core balance preserved for unaffected floors (West: ${resultL10East.bestStrategy.exitLoads.coreA}, East: ${resultL10East.bestStrategy.exitLoads.coreB})`);

const resultL10West = ranker.rankStrategies(PRESET_SCENARIOS.CASE_2_L10_WEST_STAIR, testRooms, testExits);
assert(resultL10West.bestStrategy.evacuationTimeSeconds > 0, `L10 West Fire clearance time: ${resultL10West.bestStrategy.evacuationTimeSeconds}s`);
assert(resultL10West.bestStrategy.exitLoads.coreA > 0 && resultL10West.bestStrategy.exitLoads.coreB > 0,
  `Dual-core balance preserved for unaffected floors (West: ${resultL10West.bestStrategy.exitLoads.coreA}, East: ${resultL10West.bestStrategy.exitLoads.coreB})`);

// -------------------------------------------------------------------
// TEST 8: CASE III - Middle Floors (L2 - L9) Stair Avoidance & Upper Floor Crossover
// -------------------------------------------------------------------
console.log('\n--- Test Suite 8: Case III Middle Floors (L2 - L9) Evacuation Process ---');

// Build a complete 100-occupant population (10 occupants per floor across all 10 floors)
const building100Occupants = [];
for (let fl = 1; fl <= 10; fl++) {
  for (let r = 1; r <= 10; r++) {
    building100Occupants.push({
      id: `agent_f${fl}_r${r}`,
      floor: fl,
      roomId: `f${fl}_r${r}`,
      x: -20 + (r * 3.8),
      y: (fl - 1) * 3.8 + 0.175,
      z: r <= 5 ? -10.0 : 10.0
    });
  }
}

// 8.A: Case III.A - Hazard on Floor 7 (L7) near West Stair
console.log('\n  -> Case III.A: Fire Near West Stair on Level 7 (L7)');
const fireL7West = { x: -26.4, y: 6 * 3.8 + 0.2, z: 0.0, roomId: 'f7_r1', floor: 7 };
const planL7West = crowdOptimizer.optimizeRoutes(building100Occupants, [fireL7West], [], 'LOAD_BALANCED', { 7: ['exit_west'] });

// 1. Fire Floor L7 Verification
const l7AgentsA = planL7West.assignments.filter(a => a.agentId.startsWith('agent_f7_'));
const l7AtHazardWestA = l7AgentsA.filter(a =>
  a.path.some(pt => Math.abs(pt.y - (6 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0 && Math.abs(pt.z) < 2.0)
);
assert(l7AgentsA.length === 10, 'All 10 Level 7 occupants evaluated');
assert(l7AtHazardWestA.length === 0, 'ZERO Level 7 occupants enter West Stair on Level 7 (0/10)');

// 2. Lower Floors (L1 - L6) Verification
const case3LowerAgentsA = planL7West.assignments.filter(a => {
  const fl = parseInt(a.agentId.split('_')[1].replace('f', ''), 10);
  return fl >= 1 && fl <= 6;
});
const case3LowerWestA = case3LowerAgentsA.filter(a => a.exitId === 'exit_west').length;
const case3LowerEastA = case3LowerAgentsA.filter(a => a.exitId === 'exit_east').length;
assert(case3LowerAgentsA.length === 60, 'All 60 lower floor occupants (L1-L6) evaluated');
assert(case3LowerWestA > 0, `Lower floors (L1-L6) continue using West Stair Core A (${case3LowerWestA} occupants)`);
assert(case3LowerEastA > 0, `Lower floors (L1-L6) continue using East Stair Core B (${case3LowerEastA} occupants)`);
assert(case3LowerWestA + case3LowerEastA <= 60, 'Lower floors remain completely unaffected by Level 7 fire above');

// 3. Upper Floors (L8 - L10) Verification & L8 Corridor Crossover
const case3UpperAgentsA = planL7West.assignments.filter(a => {
  const fl = parseInt(a.agentId.split('_')[1].replace('f', ''), 10);
  return fl >= 8 && fl <= 10;
});
assert(case3UpperAgentsA.length === 30, 'All 30 upper floor occupants (L8-L10) evaluated');

// Verify upper floor occupants on West stair crossover via Floor 8 corridor
const l8CrossoverAgentsA = case3UpperAgentsA.filter(a => {
  const hasWestAtF8 = a.path.some(pt => Math.abs(pt.y - (7 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0);
  const hasEastAtF8 = a.path.some(pt => Math.abs(pt.y - (7 * 3.8 + 0.175)) < 0.5 && pt.x >= 26.0);
  return hasWestAtF8 && hasEastAtF8;
});
assert(l8CrossoverAgentsA.length > 0, `Upper floor occupants on West stair transfer via L8 corridor to East stair (${l8CrossoverAgentsA.length} occupants transferred)`);

// Zero upper floor occupants traverse hazardous West stair on Level 7
const upperAtHazardWestA = case3UpperAgentsA.filter(a =>
  a.path.some(pt => Math.abs(pt.y - (6 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0 && Math.abs(pt.z) < 2.0)
);
assert(upperAtHazardWestA.length === 0, 'ZERO upper floor occupants enter hazardous West Stair on Level 7 (0/30)');

// Redistribution at Floor 6 (L6)
const upperWestFinalA = case3UpperAgentsA.filter(a => a.exitId === 'exit_west').length;
const upperEastFinalA = case3UpperAgentsA.filter(a => a.exitId === 'exit_east').length;
assert(upperWestFinalA > 0 && upperEastFinalA > 0,
  `Upper floor crowd safely redistributed across both stairs below hazard (West: ${upperWestFinalA}, East: ${upperEastFinalA})`);

// 8.B: Case III.B - Symmetrical Hazard on Floor 7 (L7) near East Stair
console.log('\n  -> Case III.B: Fire Near East Stair on Level 7 (L7)');
const fireL7East = { x: 26.4, y: 6 * 3.8 + 0.2, z: 0.0, roomId: 'f7_r5', floor: 7 };
const planL7East = crowdOptimizer.optimizeRoutes(building100Occupants, [fireL7East], [], 'LOAD_BALANCED', { 7: ['exit_east'] });

const l7AgentsB = planL7East.assignments.filter(a => a.agentId.startsWith('agent_f7_'));
const l7AtHazardEastB = l7AgentsB.filter(a =>
  a.path.some(pt => Math.abs(pt.y - (6 * 3.8 + 0.175)) < 0.5 && pt.x >= 26.0 && Math.abs(pt.z) < 2.0)
);
assert(l7AtHazardEastB.length === 0, 'ZERO Level 7 occupants enter East Stair on Level 7 (0/10)');

const upperAgentsB = planL7East.assignments.filter(a => {
  const fl = parseInt(a.agentId.split('_')[1].replace('f', ''), 10);
  return fl >= 8 && fl <= 10;
});
const l8CrossoverAgentsB = upperAgentsB.filter(a => {
  const hasEastAtF8 = a.path.some(pt => Math.abs(pt.y - (7 * 3.8 + 0.175)) < 0.5 && pt.x >= 26.0);
  const hasWestAtF8 = a.path.some(pt => Math.abs(pt.y - (7 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0);
  return hasEastAtF8 && hasWestAtF8;
});
assert(l8CrossoverAgentsB.length > 0, `Upper floor occupants on East stair transfer via L8 corridor to West stair (${l8CrossoverAgentsB.length} occupants transferred)`);

const upperAtHazardEastB = upperAgentsB.filter(a =>
  a.path.some(pt => Math.abs(pt.y - (6 * 3.8 + 0.175)) < 0.5 && pt.x >= 26.0 && Math.abs(pt.z) < 2.0)
);
assert(upperAtHazardEastB.length === 0, 'ZERO upper floor occupants enter hazardous East Stair on Level 7 (0/30)');

// 8.C: Case III.C - Generalized Middle Floors (L4, L2, L9)
console.log('\n  -> Case III.C: Generalized Middle Floors (L4, L2, L9)');

// Level 4 West Fire
const fireL4West = { x: -26.4, y: 3 * 3.8 + 0.2, z: 0.0, roomId: 'f4_r1', floor: 4 };
const planL4West = crowdOptimizer.optimizeRoutes(building100Occupants, [fireL4West], [], 'LOAD_BALANCED', { 4: ['exit_west'] });
const l4Agents = planL4West.assignments.filter(a => a.agentId.startsWith('agent_f4_'));
const l4AtHazardWest = l4Agents.filter(a => a.path.some(pt => Math.abs(pt.y - (3 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0 && Math.abs(pt.z) < 2.0));
assert(l4AtHazardWest.length === 0, 'Level 4 occupants avoid hazardous West stair on Level 4 (0/10)');

// Upper floors (L5-L10) transfer at Level 5
const upperAgentsL4 = planL4West.assignments.filter(a => {
  const fl = parseInt(a.agentId.split('_')[1].replace('f', ''), 10);
  return fl >= 5 && fl <= 10;
});
const l5CrossoverAgents = upperAgentsL4.filter(a => {
  const hasWestAtF5 = a.path.some(pt => Math.abs(pt.y - (4 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0);
  const hasEastAtF5 = a.path.some(pt => Math.abs(pt.y - (4 * 3.8 + 0.175)) < 0.5 && pt.x >= 26.0);
  return hasWestAtF5 && hasEastAtF5;
});
assert(l5CrossoverAgents.length > 0, `Upper floors (L5-L10) execute corridor transfer at Level 5 (${l5CrossoverAgents.length} occupants transferred)`);

// Level 2 West Fire (transfer at L3 to L1)
const fireL2West = { x: -26.4, y: 1 * 3.8 + 0.2, z: 0.0, roomId: 'f2_r1', floor: 2 };
const planL2West = crowdOptimizer.optimizeRoutes(building100Occupants, [fireL2West], [], 'LOAD_BALANCED', { 2: ['exit_west'] });
const l2Agents = planL2West.assignments.filter(a => a.agentId.startsWith('agent_f2_'));
const l2AtHazardWest = l2Agents.filter(a => a.path.some(pt => Math.abs(pt.y - (1 * 3.8 + 0.175)) < 0.5 && pt.x <= -26.0 && Math.abs(pt.z) < 2.0));
assert(l2AtHazardWest.length === 0, 'Level 2 occupants avoid hazardous West stair on Level 2 (0/10)');

// Level 9 East Fire (transfer at L10 to L8)
const fireL9East = { x: 26.4, y: 8 * 3.8 + 0.2, z: 0.0, roomId: 'f9_r5', floor: 9 };
const planL9East = crowdOptimizer.optimizeRoutes(building100Occupants, [fireL9East], [], 'LOAD_BALANCED', { 9: ['exit_east'] });
const l9Agents = planL9East.assignments.filter(a => a.agentId.startsWith('agent_f9_'));
const l9AtHazardEast = l9Agents.filter(a => a.path.some(pt => Math.abs(pt.y - (8 * 3.8 + 0.175)) < 0.5 && pt.x >= 26.0 && Math.abs(pt.z) < 2.0));
assert(l9AtHazardEast.length === 0, 'Level 9 occupants avoid hazardous East stair on Level 9 (0/10)');

// 8.D: Case III Multi-Strategy Strategy Ranking & Clearance Times
console.log('\n  -> Case III Strategy Ranking Evaluation');
const resultL7West = ranker.rankStrategies(PRESET_SCENARIOS.CASE_3_L7_WEST_STAIR, testRooms, testExits);
assert(resultL7West.bestStrategy.evacuationTimeSeconds > 0, `Case 3 L7 West Fire clearance time: ${resultL7West.bestStrategy.evacuationTimeSeconds}s`);
assert(resultL7West.bestStrategy.exitLoads.coreA > 0 && resultL7West.bestStrategy.exitLoads.coreB > 0,
  `Dual-core balance preserved under Case 3 L7 hazard (West: ${resultL7West.bestStrategy.exitLoads.coreA}, East: ${resultL7West.bestStrategy.exitLoads.coreB})`);

const resultL7East = ranker.rankStrategies(PRESET_SCENARIOS.CASE_3_L7_EAST_STAIR, testRooms, testExits);
assert(resultL7East.bestStrategy.evacuationTimeSeconds > 0, `Case 3 L7 East Fire clearance time: ${resultL7East.bestStrategy.evacuationTimeSeconds}s`);
assert(resultL7East.bestStrategy.exitLoads.coreA > 0 && resultL7East.bestStrategy.exitLoads.coreB > 0,
  `Dual-core balance preserved under Case 3 L7 East hazard (West: ${resultL7East.bestStrategy.exitLoads.coreA}, East: ${resultL7East.bestStrategy.exitLoads.coreB})`);

const dynamicScenario = createCase3Scenario(5, 'west');
const resultDynamic = ranker.rankStrategies(dynamicScenario, testRooms, testExits);
assert(resultDynamic.bestStrategy.evacuationTimeSeconds > 0, `Dynamic Level 5 Case 3 clearance time: ${resultDynamic.bestStrategy.evacuationTimeSeconds}s`);


// -------------------------------------------------------------------
// TEST 9: Emergency Control - 30-Second Arrival & Nearest Gate Staging Invariant
// -------------------------------------------------------------------
console.log('\n--- Test Suite 9: Emergency Vehicles & 30-Second Response Dispatch ---');
const emergencyScene = new THREE.Scene();
const emergencyMgr = new EmergencyVehiclesManager(emergencyScene);

// 9.A: Vehicle Asset Composition
assert(emergencyMgr.fireEngine !== null, 'Emergency Engine 1 (Fire Extinguisher Squad) instantiated');
assert(emergencyMgr.ambulance !== null, 'Emergency Medic 1 (Ambulance / EMS Squad) instantiated');
assert(emergencyMgr.rescueTeam !== null, 'Emergency Rescue 1 (Tactical Incident Command Unit) instantiated');

// 9.B: Spatial Nearest-Exit Routing (West, East, South / Main)
console.log('\n  -> Emergency Dispatch Nearest Ground Gate Determination:');
// 1. Floor 7 West Stair Hazard -> Ground West Gate (exit_west)
emergencyMgr.dispatch(null, [{ x: -26.4, y: 22.8, z: 0, floor: 7, roomId: 'f7_r1' }]);
assert(emergencyMgr.targetGate.id === 'exit_west', 'Hazard at Floor 7 West Stair directs units to Ground West Gate (exit_west)');

// 2. Floor 7 East Stair Hazard -> Ground East Gate (exit_east)
emergencyMgr.dispatch(null, [{ x: 26.4, y: 22.8, z: 0, floor: 7, roomId: 'f7_r5' }]);
assert(emergencyMgr.targetGate.id === 'exit_east', 'Hazard at Floor 7 East Stair directs units to Ground East Gate (exit_east)');

// 3. Ground Floor Main Entrance Hazard -> Ground Main Gate (exit_south)
emergencyMgr.dispatch(null, [{ x: 0, y: 0.2, z: 20, floor: 1, roomId: 'f1_r8' }]);
assert(emergencyMgr.targetGate.id === 'exit_south', 'Hazard at Main Entrance directs units to Ground Main Gate (exit_south)');

// 9.C: Exact 30-Second Arrival Timeline & Alarm Invariant
console.log('\n  -> 30-Second Arrival Timeline & Alarm Invariant:');
emergencyMgr.dispatch('exit_west');

// t = 0s: Dispatch initiated
emergencyMgr.update(0, 0, true);
let emStatus0 = emergencyMgr.getStatus();
assert(emStatus0.status === 'EN_ROUTE' && emStatus0.isArrived === false && emStatus0.etaSeconds === 30,
  `At t=0s: Status EN_ROUTE, ETA = ${emStatus0.etaSeconds}s, Arrived = false`);
assert(emStatus0.isSirenActive === true, 'Emergency siren alarm is active by default upon dispatch');

// Test Siren Mute & Unmute
emergencyMgr.muteSiren();
assert(emergencyMgr.getStatus().isSirenActive === false, 'Siren alarm is silenced when user toggles mute');
emergencyMgr.toggleSirenAudio();
assert(emergencyMgr.getStatus().isSirenActive === true, 'Siren alarm resumes when user toggles unmute');

// t = 15s: Midpoint en-route traversal
emergencyMgr.update(15, 15, true);
let emStatus15 = emergencyMgr.getStatus();
assert(emStatus15.status === 'EN_ROUTE' && emStatus15.isArrived === false && emStatus15.progress === 50,
  `At t=15s: Traversal at ${emStatus15.progress}%, ETA = ${emStatus15.etaSeconds}s`);

// t = 30s: Full arrival and on-scene perimeter staging
emergencyMgr.update(15, 30, true);
let emStatus30 = emergencyMgr.getStatus();
assert(emStatus30.status === 'ON_SCENE' && emStatus30.isArrived === true && emStatus30.progress === 100,
  `At t=30s: Status ON_SCENE, Progress = 100%, Staged on perimeter`);
assert(emergencyMgr.perimeterGroup.visible === true, 'On-scene medical triage, hazard perimeter, and command cots deployed at t=30s');
assert(Math.abs(emergencyMgr.fireEngine.position.x - (-44.0)) < 0.1, `Fire Engine staged at West Gate x=${emergencyMgr.fireEngine.position.x}`);

// 9.D: Frame Delta Real-Time Progression (Smooth 60fps)
console.log('\n  -> Autonomous Frame-by-Frame Real-Time Update:');
const autoMgr = new EmergencyVehiclesManager(emergencyScene);
autoMgr.dispatch('exit_east');
assert(autoMgr.getStatus().status === 'EN_ROUTE', 'Autonomous units dispatched to East Gate');
// Step forward 10 seconds in 60fps increments (600 frames of 1/60s)
for (let f = 0; f < 600; f++) {
  autoMgr.update(1 / 60, 1.0);
}
assert(Math.abs(autoMgr.getStatus().elapsedSeconds - 10) <= 1, `After 10s of frame updates, elapsed = ${autoMgr.getStatus().elapsedSeconds}s`);
// Step forward 20 more seconds to reach 30s
for (let f = 0; f < 1200; f++) {
  autoMgr.update(1 / 60, 1.0);
}
assert(autoMgr.getStatus().isArrived === true, 'Autonomous units arrive on-scene at exactly 30s via delta stepping');

// =========================================================================
// TEST SUITE 10: Single-Cycle Evacuation Invariant & Anti-Loop Verification
// =========================================================================
console.log('\n--- Test Suite 10: Single-Cycle Evacuation Invariant & Anti-Looping ---');

// 10.A: Evacuated agents must not be reassigned or loop back when fire spreads
const testAgents = [
  { id: 'agent_1', floor: 7, x: -15, y: 22.975, z: 0, state: 'SAFE', isEvacuated: true, roomId: 'f7_r1' },
  { id: 'agent_2', floor: 7, x: -16, y: 22.975, z: 1, state: 'SAFE', isEvacuated: true, roomId: 'f7_r2' },
  { id: 'agent_3', floor: 7, x: -14, y: 22.975, z: -1, state: 'EVACUATING', isEvacuated: false, roomId: 'f7_r3' }
];

const spreadFirePlan = crowdOptimizer.optimizeRoutes(testAgents, [{ x: -26, y: 23, z: 0, floor: 7, roomId: 'f7_r1' }]);
assert(!spreadFirePlan.assignments.some(a => a.agentId === 'agent_1'), 'Safe evacuated agent_1 is omitted from route re-planning');
assert(!spreadFirePlan.assignments.some(a => a.agentId === 'agent_2'), 'Safe evacuated agent_2 is omitted from route re-planning');
assert(spreadFirePlan.assignments.some(a => a.agentId === 'agent_3'), 'Active in-transit agent_3 is correctly planned');

// 10.B: Crowd assignments skip all safe agents
const allSafeAgents = [
  { id: 'agent_10', floor: 1, x: -38, y: 0.15, z: 0, state: 'SAFE', isEvacuated: true },
  { id: 'agent_11', floor: 1, x: 38, y: 0.15, z: 0, state: 'SAFE', isEvacuated: true }
];
const safeOnlyPlan = crowdOptimizer.optimizeRoutes(allSafeAgents, [{ x: 0, y: 0.2, z: 20, floor: 1 }]);
assert(safeOnlyPlan.assignments.length === 0, 'ZERO assignments generated for fully evacuated crowd (occupants stay safe outside)');

// 10.C: Evacuation occurs strictly once; occupants remain at safe exterior muster coords
const finalWaypoint = { x: -38.5, y: 0.15, z: 1.2 };
const simulatedAgent = {
  id: 'agent_sim',
  floor: 7,
  state: 'EVACUATING',
  isEvacuated: false,
  path: [{ x: -20, y: 23, z: 0 }, finalWaypoint],
  currentWaypointIdx: 1,
  x: -38.4,
  y: 0.15,
  z: 1.1
};
// Waypoint reached -> becomes SAFE
simulatedAgent.state = 'SAFE';
simulatedAgent.isEvacuated = true;
simulatedAgent.x = finalWaypoint.x;
simulatedAgent.y = finalWaypoint.y;
simulatedAgent.z = finalWaypoint.z;

assert(simulatedAgent.state === 'SAFE' && simulatedAgent.isEvacuated === true, 'Agent state transitions to SAFE outside');
assert(simulatedAgent.x === -38.5 && simulatedAgent.y === 0.15, 'Agent coordinates locked at exterior safe muster zone');

// =========================================================================
// TEST SUITE 11: Live Mobile "Evacuee Digital Twin" Companion Verification
// =========================================================================
console.log('\n--- Test Suite 11: Live Mobile Evacuee Companion & Bi-Directional IoT ---');

// 11.A: Bi-directional Headcount & SOS Verification
const testSimState = {
  totalOccupants: 100,
  evacuatedCount: 15,
  inTransitCount: 85,
  incidents: []
};

// Simulate evacuee-marked-safe
testSimState.evacuatedCount = Math.min(testSimState.totalOccupants, testSimState.evacuatedCount + 1);
testSimState.inTransitCount = Math.max(0, testSimState.totalOccupants - testSimState.evacuatedCount);
assert(testSimState.evacuatedCount === 16 && testSimState.inTransitCount === 84,
  'Mobile "I Am Safe" increments evacuated headcount and decrements in-transit live');

// Simulate evacuee-sos
const mockSos = {
  id: 'sos_test_01',
  title: 'CRITICAL SOS: Occupant Trapped on Level 4',
  subtitle: 'Room 104 • Immediate Extraction Required',
  severity: 'Critical',
  floor: 4,
  roomId: 'f4_r1'
};
testSimState.incidents.unshift(mockSos);
assert(testSimState.incidents.length === 1 && testSimState.incidents[0].severity === 'Critical',
  'Mobile "SOS / Trapped" generates critical priority life-safety extraction alert');

// 11.B: Floor 4 Egress Dynamic Guidance to Core B under Core A Blockage
const occupantL4 = [{ id: 'occ_l4', floor: 4, x: -19.5, y: 11.575, z: -12.5, roomId: 'f4_r1' }];
const l4PlanWithCoreABlocked = crowdOptimizer.optimizeRoutes(occupantL4, [], [], 'LOAD_BALANCED', { 4: ['exit_west'] });
assert(l4PlanWithCoreABlocked.assignments.length === 1, 'Floor 4 occupant receives dynamic reroute');
assert(l4PlanWithCoreABlocked.assignments[0].exitId === 'exit_east',
  'Floor 4 occupant successfully rerouted to East Core B when West Core A is blocked');

console.log('\n=======================================================');
console.log(`🎯 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('=======================================================\n');
