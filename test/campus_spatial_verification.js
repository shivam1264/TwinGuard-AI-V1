// ============================================================================
// COMPREHENSIVE AUTOMATED VERIFICATION SUITE FOR CAMPUS SPATIAL FOUNDATION
// ============================================================================
// Step 5.1 Verification: Validates that the spatial semantic foundation model
// is strictly consistent with the 3D geometry and all topological relationships.
// ============================================================================

import { CampusSpatialModel, ENTRANCE_TYPES, ROAD_STATUS, PATH_STATUS } from '../src/three/site/CampusSpatialModel.js';
import { NavigationGraph } from '../src/simulation/NavigationGraph.js';

console.log('=======================================================');
console.log('🚀 RUNNING STEP 5.1 CAMPUS SPATIAL FOUNDATION AUDIT');
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

const model = new CampusSpatialModel();

// ----------------------------------------------------------------------------
// TEST SUITE 1: Campus Root Model & Geographic Datum
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 1: Campus Root Model & Spatial Reference ---');
assert(model.campusId === 'CAMPUS-TWINGUARD-01', 'Campus ID is stable and defined');
assert(model.bounds.width === 720 && model.bounds.depth === 560, 'Campus bounds match 720m x 560m (40 hectares)');
assert(model.spatialReference.originLat === 28.498600 && model.spatialReference.originLon === 77.087800, 'Spatial reference contains valid WGS-84 origin');
assert(model.districts.size === 5, `All 5 master districts registered (${model.districts.size}/5)`);

// ----------------------------------------------------------------------------
// TEST SUITE 2: Buildings & Footprints (Hero Building + 11 Parcels)
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 2: Campus Buildings & Spatial Footprints ---');
const allBuildings = model.getAllBuildings();
assert(allBuildings.length === 12, `Total 12 buildings registered (1 Hero + 11 Campus Parcels): found ${allBuildings.length}`);

// Verify Hero Building
const hero = model.getBuilding('BUILDING-HERO');
assert(hero !== null, 'Hero Building (BUILDING-HERO) successfully retrieved');
assert(hero.floors === 10, 'Hero Building has exactly 10 storeys');
assert(hero.bounds.width === 60 && hero.bounds.depth === 48, 'Hero Building footprint matches 60m x 48m');
assert(hero.position.x === 0 && hero.position.z === 0, 'Hero Building positioned at origin (0, 0)');
assert(hero.entranceIds.length === 4, `Hero Building has 4 registered entrances: ${hero.entranceIds.join(', ')}`);

// Verify Supporting Buildings
const p01 = model.getBuilding('BUILDING-PLOT-P01'); // Innovation Lab
assert(p01 !== null && p01.floors === 6, 'Plot P01 (Innovation Lab) has 6 planned floors');
const p09 = model.getBuilding('BUILDING-PLOT-P09'); // Auditorium
assert(p09 !== null && p09.buildingType === 'COURTYARD', 'Plot P09 (Auditorium) registered with courtyard typology');

// Verify all buildings have valid world bounds
let allBoundsValid = true;
allBuildings.forEach(b => {
  if (b.bounds.minX >= b.bounds.maxX || b.bounds.minZ >= b.bounds.maxZ) allBoundsValid = false;
});
assert(allBoundsValid === true, 'All 12 buildings have geometrically sound bounding boxes');

// ----------------------------------------------------------------------------
// TEST SUITE 3: Building Entrances & Ground Discharges
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 3: Building Entrances & Ground Discharges ---');
const heroEntrances = model.getEntrancesForBuilding('BUILDING-HERO');
assert(heroEntrances.length === 4, 'Hero Building has 4 distinct entrances registered');

const westExit = heroEntrances.find(e => e.id === 'ENTRANCE-HERO-WEST');
assert(westExit && westExit.entranceType === ENTRANCE_TYPES.EMERGENCY_EXIT, 'Hero West Exit is typed as EMERGENCY_EXIT');
assert(westExit.position.x === -29.2 && westExit.position.z === 0.0, 'West Exit matches exact 3D door coordinate (-29.2, 0.0)');

const eastExit = heroEntrances.find(e => e.id === 'ENTRANCE-HERO-EAST');
assert(eastExit && eastExit.position.x === 29.2 && eastExit.position.z === 0.0, 'East Exit matches exact 3D door coordinate (29.2, 0.0)');

const southMain = heroEntrances.find(e => e.id === 'ENTRANCE-HERO-SOUTH');
assert(southMain && southMain.entranceType === ENTRANCE_TYPES.MAIN, 'South Grand Plaza entrance typed as MAIN');
assert(southMain.position.x === 0.0 && southMain.position.z === 23.5, 'South Exit matches exact 3D door coordinate (0.0, 23.5)');

// Verify every supporting building has a registered entrance
let allHaveEntrances = true;
allBuildings.forEach(b => {
  const ents = model.getEntrancesForBuilding(b.id);
  if (ents.length === 0) allHaveEntrances = false;
});
assert(allHaveEntrances === true, 'Every building on campus has at least one registered entrance / access portal');

// ----------------------------------------------------------------------------
// TEST SUITE 4: Road Network Segments & Classifications
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 4: Road Network Segments & Classes ---');
const allRoads = model.getAllRoads();
assert(allRoads.length >= 12, `Road network contains ${allRoads.length} semantic road segments (expected >= 12)`);

const primaryEntrance = model.getRoad('ROAD-PRIMARY-ENTRANCE');
assert(primaryEntrance !== null, 'Primary Entrance Ceremonial Avenue registered');
assert(primaryEntrance.roadClass === 'CLASS_A_PRIMARY', 'Ceremonial Avenue classified as CLASS_A_PRIMARY');
assert(primaryEntrance.width === 12.0, 'Ceremonial Avenue width is exactly 12.0m');
assert(primaryEntrance.status === ROAD_STATUS.OPEN, 'Ceremonial Avenue initial status is OPEN');

const ringWest = model.getRoad('ROAD-PRIMARY-RING-WEST');
assert(ringWest !== null && ringWest.length > 300, `West Ring Road length calculated: ${ringWest.length}m`);

const coreRing = model.getRoad('ROAD-SECONDARY-CORE-RING');
assert(coreRing !== null && coreRing.isLoop === true, 'Central Core Circular Ring is registered as a continuous loop');

const serviceHero = model.getRoad('ROAD-SERVICE-HERO-NORTH');
assert(serviceHero !== null && serviceHero.roadClass === 'CLASS_C_SERVICE', 'Hero North Service road classified as CLASS_C_SERVICE');

// ----------------------------------------------------------------------------
// TEST SUITE 5: Road Nodes, Intersections & Roundabouts
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 5: Road Nodes, Intersections & Roundabouts ---');
const allRoadNodes = model.getAllRoadNodes();
assert(allRoadNodes.length >= 20, `Road network contains ${allRoadNodes.length} topological nodes (expected >= 20)`);

// Main Gate Node
const gateNode = model.getRoadNode('RNODE-MAIN-GATE');
assert(gateNode !== null && gateNode.position.z === 240, 'Main Gate Node verified at z=240');
assert(gateNode.connectedRoadIds.includes('ROAD-PRIMARY-ENTRANCE'), 'Main Gate connected to Ceremonial Entrance Avenue');

// Circus Roundabout Hub
const circusCenter = model.getRoadNode('RNODE-CIRCUS-CENTER');
assert(circusCenter !== null && circusCenter.nodeType === 'ROUNDABOUT', 'Circus Hub registered as ROUNDABOUT node');

// Verify West Roundabout connectivity
const westRbEast = model.getRoadNode('RNODE-WEST-RB-EAST');
assert(westRbEast !== null && westRbEast.connectedRoadIds.length > 0, 'West Roundabout junction connected to road network');

// Verify intersecting roads query
const intersectingWithEntrance = model.findIntersectingRoads('ROAD-PRIMARY-ENTRANCE');
assert(intersectingWithEntrance.length > 0, `ROAD-PRIMARY-ENTRANCE connects with ${intersectingWithEntrance.map(r => r.id).join(', ')}`);

// ----------------------------------------------------------------------------
// TEST SUITE 6: Pedestrian Promenade Network
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 6: Pedestrian Promenade Network ---');
const allPaths = model.getAllPedestrianPaths();
assert(allPaths.length === 9, `All 9 master pedestrian promenades registered (${allPaths.length}/9)`);

const southSpoke = model.getPedestrianPath('PATH-SPOKE-SOUTH');
assert(southSpoke !== null && southSpoke.endNodeId === 'PNODE-HERO-SOUTH', 'South Promenade connects directly into Hero South Portal');

const westSpoke = model.getPedestrianPath('PATH-SPOKE-WEST');
assert(westSpoke !== null && westSpoke.startNodeId === 'PNODE-HERO-WEST', 'West Promenade connects directly into Hero West Stair Core Portal');

const eastSpoke = model.getPedestrianPath('PATH-SPOKE-EAST');
assert(eastSpoke !== null && eastSpoke.startNodeId === 'PNODE-HERO-EAST', 'East Promenade connects directly into Hero East Stair Core Portal');

const allPedNodes = model.getAllPedestrianNodes();
assert(allPedNodes.length >= 17, `Pedestrian network contains ${allPedNodes.length} nodes (expected >= 17)`);

// ----------------------------------------------------------------------------
// TEST SUITE 7: Building -> Entrance -> Road/Path Linkages
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 7: Full Building Access Chain Integrity ---');
// For every building, verify: Building -> Entrance -> Access Node -> Road or Path
let fullChainsValid = true;
allBuildings.forEach(b => {
  const entrances = model.getEntrancesForBuilding(b.id);
  const roads = model.getRoadsServingBuilding(b.id);
  const paths = model.getPathsServingBuilding(b.id);

  if (entrances.length === 0 || (roads.length === 0 && paths.length === 0)) {
    fullChainsValid = false;
    console.error(`  ❌ Broken chain for building: ${b.name}`);
  }
});
assert(fullChainsValid === true, 'All 12 buildings have complete, verified Building -> Entrance -> Road/Path chains');

// ----------------------------------------------------------------------------
// TEST SUITE 8: Parking, Open Spaces & Spatial Queries
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 8: Parking, Open Spaces & Spatial Queries ---');
const westParking = model.getParkingArea('PARKING-001');
assert(westParking !== null && westParking.capacity === 260, 'West Parking registered with 260 capacity');
assert(westParking.accessRoadId === 'ROAD-SECONDARY-WEST-PARKING', 'West Parking connects to West Parking Parkway');

const forecourtPlaza = model.getOpenSpace('PLAZA-HERO-FORECOURT');
assert(forecourtPlaza !== null && forecourtPlaza.capacity === 2500, 'Hero Forecourt Plaza registered with 2500 capacity');

const lake = model.getOpenSpace('LAKE-001');
assert(lake !== null && lake.type === 'WATER_BODY', 'Central Lake registered as WATER_BODY');

// Test nearest road node query
const nearestToOrigin = model.getNearestRoadNode({ x: 0, z: 35 });
assert(nearestToOrigin !== null && nearestToOrigin.node.id === 'RNODE-HERO-FORECOURT', 'Nearest road node to (0, 35) is RNODE-HERO-FORECOURT');

// Test nearest pedestrian node query
const nearestPedToWestDoor = model.getNearestPedestrianNode({ x: -29, z: 0 });
assert(nearestPedToWestDoor !== null && nearestPedToWestDoor.node.id === 'PNODE-HERO-WEST', 'Nearest pedestrian node to West Door is PNODE-HERO-WEST');

// Test district query
const districtAtLake = model.getDistrictForPoint({ x: 95, z: 145 });
assert(districtAtLake !== null && districtAtLake.id === 'DISTRICT-SOUTH-PUBLIC', 'District at Lake (95, 145) resolves to DISTRICT-SOUTH-PUBLIC');

// ----------------------------------------------------------------------------
// TEST SUITE 9: Navigation Graph Compatibility & Extension
// ----------------------------------------------------------------------------
console.log('\n--- Test Suite 9: Navigation Graph Compatibility ---');
const navGraph = new NavigationGraph(10, 3.8);
const initialNodesCount = navGraph.nodes.size;
const initialEdgesCount = navGraph.edges.size;

// Extend graph with campus outdoor network
model.extendNavigationGraph(navGraph);

assert(navGraph.nodes.size > initialNodesCount, `NavigationGraph seamlessly ingested campus nodes (${initialNodesCount} -> ${navGraph.nodes.size})`);
assert(navGraph.edges.size > initialEdgesCount, `NavigationGraph seamlessly ingested campus edges (${initialEdgesCount} -> ${navGraph.edges.size})`);

// Verify existing indoor BFS connectivity is unharmed
const connectivity = navGraph.validateConnectivity();
assert(connectivity.isValid === true, 'Indoor BFS evacuation connectivity remains 100% valid after campus graph extension');

// ----------------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------------
console.log('\n=======================================================');
console.log(`🎯 AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('=======================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

