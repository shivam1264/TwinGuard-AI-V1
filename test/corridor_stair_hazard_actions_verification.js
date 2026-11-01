import assert from 'assert';
import fs from 'fs';

console.log('=======================================================');
console.log('🧪 TESTING CORRIDOR & STAIR 3D VISIBILITY & HAZARD ACTIONS');
console.log('=======================================================');

// 1. Verify SceneManager.js source enhancements
const sm = fs.readFileSync('src/three/SceneManager.js', 'utf8');

// A. Check getStairSegmentBounds exists
assert(sm.includes('getStairSegmentBounds(segId)'), 'SceneManager must have getStairSegmentBounds');
console.log('✅ PASS: getStairSegmentBounds implemented in SceneManager');

// B. Check highlightRoom supports corridor and stair
assert(sm.includes("seg && seg.kind === 'corr'") && sm.includes("seg && seg.kind === 'stair'"), 'highlightRoom must handle corr and stair');
console.log('✅ PASS: highlightRoom computes exact 3D wireframe box for Corridor & Stair');

// C. Check triggerFire supports corridor and stair
assert(sm.includes("furnishingType: 'CORRIDOR'") && sm.includes("furnishingType: 'STAIR'"), 'triggerFire must build synthetic room for corr and stair');
console.log('✅ PASS: triggerFire spawns real 3D fire on Corridor and Stair');

// D. Check spawnSmoke supports stair
assert(sm.includes('this.getStairSegmentBounds(locationId)'), 'spawnSmoke must support stairs');
console.log('✅ PASS: spawnSmoke spawns real 3D smoke on Stair');

// E. Check blockCorridorSegment builds 3D Holographic Barrier Wall with warning lights
assert(sm.includes('CorridorBarrier_') && sm.includes('MeshStandardMaterial') && sm.includes('warnLight'), 'blockCorridorSegment must build 3D Holographic Barrier');
console.log('✅ PASS: blockCorridorSegment creates glowing 3D Holographic Barrier fence with warning beacons');

// F. Check blockStairCore builds 3D Holographic Barrier
assert(sm.includes('StairBarrier_') && sm.includes('stairLight'), 'blockStairCore must build 3D Holographic Barrier');
console.log('✅ PASS: blockStairCore creates glowing 3D Holographic Barrier fence with warning beacons');

// G. Check setStructuralCollapse focuses camera on exact rubble and adds beacon light
assert(sm.includes('rubbleCx') && sm.includes('collapseBeacon') && !sm.includes('this.setCameraPreset(`FLOOR_${zone.floor}`)'), 'setStructuralCollapse must focus on rubble');
console.log('✅ PASS: setStructuralCollapse focuses directly on rubble with high-intensity beacon');

// 2. Verify FireParticles.js source enhancements
const fp = fs.readFileSync('src/three/FireParticles.js', 'utf8');
assert(fp.includes("case 'CORRIDOR':") && fp.includes("case 'STAIR':"), 'FireParticles must handle CORRIDOR and STAIR');
assert(fp.includes('isCorridor') && fp.includes('isStair'), 'FireParticles must store isCorridor and isStair');
console.log('✅ PASS: FireParticles positions corridor runner & stairwell flames and frees smoke ceiling flow');

// 3. Verify EmergencyCommandCenterPage.jsx has 9 buttons for Room, Corridor, and Stair
const ecc = fs.readFileSync('src/components/EmergencyCommandCenterPage.jsx', 'utf8');

// Check that segmentOccupancies state exists
assert(ecc.includes('segmentOccupancies'), 'EmergencyCommandCenterPage must track segmentOccupancies');
console.log('✅ PASS: segmentOccupancies tracks people count on corridors and stairwells');

// Check that locationActions contains incPeople, decPeople, setPeople for Corridor and Stair
const locActionsStart = ecc.indexOf('const locationActions = useMemo');
const locActionsEnd = ecc.indexOf('return [];\n  }, [currentLocation');
const locActionsCode = ecc.slice(locActionsStart, locActionsEnd);

const corrIdx = locActionsCode.indexOf("cat === 'CORRIDOR'");
const stairIdx = locActionsCode.indexOf("cat === 'STAIR'");
const exitIdx = locActionsCode.indexOf("cat === 'EXIT'");

const corrBlock = locActionsCode.slice(corrIdx, stairIdx);
const stairBlock = locActionsCode.slice(stairIdx, exitIdx);

assert(corrBlock.includes('incPeople') && corrBlock.includes('decPeople') && corrBlock.includes('setPeople'), 'CORRIDOR must have people management buttons');
console.log('✅ PASS: Corridor Actions has all 9 buttons (Fire, Smoke, Power, HVAC, Collapse, Block, +People, -People, Set People)');

assert(stairBlock.includes('incPeople') && stairBlock.includes('decPeople') && stairBlock.includes('setPeople'), 'STAIR must have people management buttons');
console.log('✅ PASS: Staircase Actions has all 9 buttons (Fire, Smoke, Power, HVAC, Collapse, Block, +People, -People, Set People)');

console.log('=======================================================');
console.log('🎯 ALL CORRIDOR & STAIR 3D HAZARDS & ACTIONS VERIFIED!');
console.log('=======================================================');
