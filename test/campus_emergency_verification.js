// ============================================================================
// TWIN GUARD CAMPUS — STEP 5 COMPLETE EMERGENCY & GIS VERIFICATION SUITE
// ============================================================================
// Phase 15: Automated test verification covering all 9 mission-critical
// emergency scenarios, developer diagnostic verification (12 checks),
// dynamic road/path blockages, and multi-assembly distribution.
// ============================================================================

import { CampusSpatialModel, ASSEMBLY_STATUS, ROAD_STATUS, PATH_STATUS, ZONE_STATUS } from '../src/three/site/CampusSpatialModel.js';
import { NavigationGraph } from '../src/simulation/NavigationGraph.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('=======================================================');
console.log('🚀 RUNNING STEP 5 CAMPUS EMERGENCY INTELLIGENCE AUDIT');
console.log('=======================================================\n');

const model = new CampusSpatialModel();
const navGraph = new NavigationGraph(10, 3.8);

// Extend navigation graph with outdoor network
model.extendNavigationGraph(navGraph);

// ----------------------------------------------------------------------------
// TEST SUITE 1: Phase 0 Issue Resolution & Bridge Edges
// ----------------------------------------------------------------------------
console.log('--- Test Suite 1: Phase 0 Remaining Issues Resolution ---');
const westBridge = navGraph.edges.get('edge_bridge_exit_a_to_campus_west');
assert(westBridge !== undefined, 'Bridge edge exit_a -> campus_hero_west exists');
assert(westBridge && westBridge.isBidirectional === true, 'West Exit bridge is bidirectional');

const eastBridge = navGraph.edges.get('edge_bridge_exit_b_to_campus_east');
assert(eastBridge !== undefined, 'Bridge edge exit_b -> campus_hero_east exists');

const southBridge = navGraph.edges.get('edge_bridge_exit_c_to_campus_south');
assert(southBridge !== undefined, 'Bridge edge exit_c -> campus_hero_south exists');

// Hero Building geometry binding check
const heroBuilding = model.getBuilding('BUILDING-HERO');
assert(heroBuilding !== null, 'BUILDING-HERO exists in spatial model');
// Mock scene with HeroBuilding group
const mockScene = {
  children: [
    { name: 'HeroBuilding', isGroup: true },
    { name: 'otherMesh' }
  ],
  getObjectByName(name) {
    return this.children.find(c => c.name === name) || null;
  }
};
model.resolveGeometryReferences({ scene: mockScene });
assert(heroBuilding.geometryRef !== null && heroBuilding.geometryRef.name === 'HeroBuilding', 'Hero Building geometryRef successfully resolved');

// ----------------------------------------------------------------------------
// TEST SUITE 2: Phase 1 & 2 Emergency Resources & Evacuation Zones
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 2: Campus Emergency Resources & Evacuation Zones ---');
assert(model.assemblyPoints.size === 5, `Registered 5 master assembly points (found ${model.assemblyPoints.size})`);
const forecourtAssembly = model.getAssemblyPoint('ASSEMBLY-HERO-FORECOURT');
assert(forecourtAssembly !== null && forecourtAssembly.capacity === 2500, 'Hero Forecourt assembly point has 2500 capacity');

assert(model.fireResponsePoints.size === 4, `Registered 4 fire response points (found ${model.fireResponsePoints.size})`);
const westFireStaging = model.getFireResponsePoint('FIRE-STAGING-HERO-WEST');
assert(westFireStaging !== null && westFireStaging.targetBuildingId === 'BUILDING-HERO', 'West Fire Staging targets BUILDING-HERO');

assert(model.medicalPoints.size === 2, `Registered 2 medical triage points (found ${model.medicalPoints.size})`);
assert(model.commandStagingAreas.size === 1, `Registered 1 tactical command post (found ${model.commandStagingAreas.size})`);
assert(model.evacuationZones.size >= 17, `Registered evacuation zones (found ${model.evacuationZones.size})`);

// ----------------------------------------------------------------------------
// TEST SUITE 3: Phase 14 Developer Diagnostic Network Audit
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 3: Developer Diagnostic Network Validation (Phase 14) ---');
const diag = model.validateEmergencySpatialNetwork(navGraph);
assert(diag.isValid === true, `validateEmergencySpatialNetwork passes all 12 checks (${diag.passedCount}/${diag.totalCount})`);
diag.checks.forEach(c => {
  assert(c.passed === true, `[Check ${c.item}] ${c.name}`);
});

// ----------------------------------------------------------------------------
// TEST SUITE 4: Mission-Critical Emergency Routing Scenarios (Phase 15)
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 4: Mission-Critical Scenario Verification (Scenarios 1-9) ---');

// TEST 1: L10 East Wing Evacuation -> East Stair -> East Exit -> Outdoor Promenade -> Assembly Point
const test1 = model.calculateCampusEvacuationRoute('node_f10_stair_east');
assert(test1.success === true, 'TEST 1: L10 East Wing evacuation route calculated successfully');
assert(test1.nodeSequence.includes('node_exit_b_east'), 'TEST 1: Traversal passes through Ground Exit B (East Portal)');
assert(test1.nodeSequence.includes('campus_pnode_hero_east'), 'TEST 1: Traversal traverses into outdoor East Promenade');
assert(test1.destinationAssemblyId !== null, `TEST 1: Terminates at valid assembly point: ${test1.destinationName}`);

// TEST 2: L10 West Wing Evacuation -> West Stair -> West Exit -> Outdoor Promenade -> Assembly Point
const test2 = model.calculateCampusEvacuationRoute('node_f10_stair_west');
assert(test2.success === true, 'TEST 2: L10 West Wing evacuation route calculated successfully');
assert(test2.nodeSequence.includes('node_exit_a_west'), 'TEST 2: Traversal passes through Ground Exit A (West Portal)');
assert(test2.nodeSequence.includes('campus_pnode_hero_west'), 'TEST 2: Traversal traverses into outdoor West Promenade');

// TEST 3: South Entrance Evacuation -> South Exit -> South Promenade -> Assembly Point
const test3 = model.calculateCampusEvacuationRoute('node_exit_c_south');
assert(test3.success === true, 'TEST 3: South entrance evacuation route calculated successfully');
assert(test3.nodeSequence.includes('campus_pnode_hero_south'), 'TEST 3: Traversal passes through South portal');
assert(test3.destinationAssemblyId === 'ASSEMBLY-HERO-FORECOURT', 'TEST 3: Terminates at Hero Forecourt Plaza');

// TEST 4: East Outdoor Path BLOCKED -> Route Recalculation
model.blockPath('PATH-SPOKE-EAST', 'FALLING_GLASS_HAZARD');
const test4 = model.calculateCampusEvacuationRoute('node_exit_b_east', { preferredAssemblyId: 'ASSEMBLY-EAST-PARKING' });
// Because PATH-SPOKE-EAST is blocked, route should either divert via perimeter walkway or forecourt
assert(test4.success === true, 'TEST 4: Route recalculated after East Promenade blockage');
const usedBlockedEdge = test4.edgeSequence.some(e => e.id === 'edge_path_spoke_east');
assert(usedBlockedEdge === false, 'TEST 4: Recalculated route strictly avoids the blocked East Promenade edge');
model.unblockPath('PATH-SPOKE-EAST');

// TEST 5: Nearest Assembly Point RESTRICTED -> Alternate Assembly Point Selected
model.setAssemblyPointStatus('ASSEMBLY-HERO-FORECOURT', ASSEMBLY_STATUS.RESTRICTED);
const test5 = model.calculateCampusEvacuationRoute('node_exit_c_south');
assert(test5.success === true, 'TEST 5: Egress succeeded with Forecourt restricted');
assert(test5.destinationAssemblyId !== 'ASSEMBLY-HERO-FORECOURT', `TEST 5: Alternate safe assembly point selected: ${test5.destinationName}`);
model.setAssemblyPointStatus('ASSEMBLY-HERO-FORECOURT', ASSEMBLY_STATUS.SAFE);

// TEST 6: Fire Affects East Wing -> East Wing Restricted -> West Safe Route Evaluated
// Register incident on East Wing
const incidentEast = model.registerIncident({
  id: 'INC-FIRE-L5-EAST',
  type: 'FIRE',
  severity: 'HIGH',
  location: { buildingId: 'BUILDING-HERO', floor: 5, roomId: 'room_506' },
  affectedZoneId: 'ZONE-BLD-HERO'
});
assert(incidentEast !== null && incidentEast.status === 'ACTIVE', 'TEST 6: Fire incident registered on East Wing');
// Invalidate east exit via blocked options
const test6 = model.calculateCampusEvacuationRoute('node_f10_stair_west', {
  blockedNodeIds: ['node_exit_b_east']
});
assert(test6.success === true, 'TEST 6: Evacuation successfully steered via West safe core');
assert(!test6.nodeSequence.includes('node_exit_b_east'), 'TEST 6: Zero occupants routed via East Exit under East fire');
model.resolveIncident('INC-FIRE-L5-EAST');

// TEST 7: Emergency Vehicle Dispatch -> Gate -> Primary Road -> Building Staging Point
const test7 = model.calculateEmergencyVehicleRoute('RNODE-MAIN-GATE', 'FIRE-STAGING-HERO-SOUTH');
assert(test7.success === true, 'TEST 7: Emergency vehicle route calculated successfully');
assert(test7.waypoints3D.length > 2, `TEST 7: Route waypoints generated: ${test7.waypoints3D.length}`);
assert(test7.etaSeconds > 0 && test7.etaSeconds < 45, `TEST 7: ETA to staging pad calculated: ${test7.etaSeconds}s`);
// Verify no pedestrian paths used
const hasPedestrianEdge = test7.edgeSequence.some(e => e.traversalMode === 'PEDESTRIAN');
assert(hasPedestrianEdge === false, 'TEST 7: Emergency vehicle route strictly uses vehicular roads');

// Dynamic road blockage for emergency vehicle
model.blockRoad('ROAD-PRIMARY-CORE-AXIS', 'DEBRIS');
const test7Alt = model.calculateEmergencyVehicleRoute('RNODE-MAIN-GATE', 'FIRE-STAGING-HERO-WEST');
assert(test7Alt.success === true, 'TEST 7: Emergency vehicle dynamically rerouted when primary axis blocked');
const usedBlockedRoad = test7Alt.edgeSequence.some(e => e.roadId === 'ROAD-PRIMARY-CORE-AXIS');
assert(usedBlockedRoad === false, 'TEST 7: Rerouted vehicle route strictly avoids blocked ROAD-PRIMARY-CORE-AXIS');
model.unblockRoad('ROAD-PRIMARY-CORE-AXIS');

// TEST 8: Multiple Buildings Evacuating -> Routes Distributed Across Valid Assembly Points
const buildings = ['BUILDING-HERO', 'BUILDING-PLOT-P01', 'BUILDING-PLOT-P09'];
const destinations = new Set();
buildings.forEach(bId => {
  const b = model.getBuilding(bId);
  const pedNodeId = b.nearestPedestrianNodeId || 'PNODE-HERO-SOUTH';
  const graphNodeId = `campus_${pedNodeId.toLowerCase().replace(/-/g, '_')}`;
  const route = model.calculateCampusEvacuationRoute(graphNodeId);
  if (route.success) destinations.add(route.destinationAssemblyId);
});
assert(destinations.size >= 2, `TEST 8: Multiple buildings successfully distributed across assembly areas (${destinations.size} unique destinations)`);

// TEST 9: All Available Routes Blocked -> System Explicitly Reports NO_SAFE_ROUTE_AVAILABLE
// Temporarily block all ground exits
const test9 = model.calculateCampusEvacuationRoute('node_exit_a_west', {
  blockedNodeIds: [
    'campus_assembly_hero_forecourt',
    'campus_assembly_academic_quad',
    'campus_assembly_west_parking',
    'campus_assembly_east_parking',
    'campus_assembly_south_lawn'
  ]
});
assert(test9.success === false, 'TEST 9: System cleanly reports failure when all assembly points are blocked');
assert(test9.reason === 'NO_SAFE_ROUTE_AVAILABLE', `TEST 9: Failure reason is explicitly NO_SAFE_ROUTE_AVAILABLE (received: ${test9.reason})`);

// ----------------------------------------------------------------------------
// TEST SUITE 5: Multi-Strategy Route Ranking (Phase 6)
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 5: Multi-Strategy Route Ranking (Phase 6) ---');
const ranking = model.rankEvacuationStrategies('node_f10_stair_west', 50);
assert(ranking.strategies.length >= 2, `Ranked strategies generated: ${ranking.strategies.length}`);
assert(ranking.bestStrategy !== null, `Best Strategy: ${ranking.bestStrategy.name}`);
assert(ranking.bestStrategy.clearanceTimeSec > 0, `Clearance time: ${ranking.bestStrategy.clearanceTimeSec}s`);

console.log('\n=======================================================');
console.log(`🎯 AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('=======================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
