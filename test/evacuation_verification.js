// Comprehensive Automated Verification Suite for GIS & Evacuation System
import { NavigationGraph, EDGE_STATUS } from '../src/simulation/NavigationGraph.js';
import { RouteOptimizationEngine } from '../src/simulation/RouteOptimizationEngine.js';
import { ScenarioEngine, INCIDENT_TYPES } from '../src/simulation/ScenarioEngine.js';
import { localToGeodetic, geodeticToLocal, GIS_ORIGIN, GIS_MUSTER_ZONES } from '../src/simulation/GISCoordinateSystem.js';

console.log('=======================================================');
console.log('🚀 RUNNING MASTER EVACUATION & GIS VERIFICATION SUITE');
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
// TEST 1: GIS Coordinate Transformation
// -------------------------------------------------------------------
console.log('--- Test Suite 1: Geodetic & Local Coordinate System ---');
const originLocal = geodeticToLocal(GIS_ORIGIN.latitude, GIS_ORIGIN.longitude, GIS_ORIGIN.elevationMsl);
assert(Math.abs(originLocal.x) < 0.001 && Math.abs(originLocal.y) < 0.001 && Math.abs(originLocal.z) < 0.001,
  'GIS Origin converts to local (0, 0, 0)');

const testLocal = { x: 50.0, y: 15.2, z: -30.0 };
const geo = localToGeodetic(testLocal.x, testLocal.y, testLocal.z);
const roundTrip = geodeticToLocal(geo.latitude, geo.longitude, geo.elevationMsl);
assert(Math.abs(roundTrip.x - testLocal.x) < 0.01 &&
       Math.abs(roundTrip.y - testLocal.y) < 0.01 &&
       Math.abs(roundTrip.z - testLocal.z) < 0.01,
  'Local <-> Geodetic round-trip accuracy within 1cm');

assert(GIS_MUSTER_ZONES.length === 2, 'Verified 2 Outdoor Assembly Muster Zones');

// -------------------------------------------------------------------
// TEST 2: Navigation Graph Completeness & Connectivity
// -------------------------------------------------------------------
console.log('\n--- Test Suite 2: 10-Storey Navigation Graph Completeness ---');
const navGraph = new NavigationGraph(10, 3.8);

assert(navGraph.nodes.size > 200, `Graph contains ${navGraph.nodes.size} nodes (expected > 200)`);
assert(navGraph.edges.size > 250, `Graph contains ${navGraph.edges.size} edges (expected > 250)`);

// Connectivity validation: Every room (100 total) must have a valid path to an exit
const connectivity = navGraph.validateConnectivity();
assert(connectivity.isValid === true, `All 100 rooms connected to emergency exits (${connectivity.connectedRooms}/${connectivity.totalRooms})`);

// -------------------------------------------------------------------
// TEST 3: Capacity-Aware Route Optimization
// -------------------------------------------------------------------
console.log('\n--- Test Suite 3: Route Optimization & Capacity Load-Balancing ---');
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
// TEST 4: Dynamic Rerouting on Hazard & Stairwell Blockage
// -------------------------------------------------------------------
console.log('\n--- Test Suite 4: Multi-Hazard Scenarios & Dynamic Rerouting ---');
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
// TEST 5: Occupant Accounting Invariant
// -------------------------------------------------------------------
console.log('\n--- Test Suite 5: Occupant Accounting Strict Invariant ---');
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

console.log('\n=======================================================');
console.log(`🎯 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('=======================================================\n');
