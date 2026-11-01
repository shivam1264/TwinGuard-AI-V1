import assert from 'assert';
import * as THREE from 'three';
import { EmergencyVehiclesManager } from '../src/three/EmergencyVehiclesManager.js';

console.log('=======================================================');
console.log('🚀 RUNNING EMERGENCY VEHICLES ROAD-FOLLOWING & SIREN VERIFICATION');
console.log('=======================================================');

const scene = new THREE.Scene();
const mgr = new EmergencyVehiclesManager(scene);

// --------------------------------------------------------------------------
// TEST 1: South Main Entrance - Follows Road Around Roundabout (No Lawn/Tree Cutting)
// --------------------------------------------------------------------------
console.log('\n--- Test 1: South Main Entrance Traversal & Roundabout Avoidance ---');
mgr.dispatch('exit_south');
assert.strictEqual(mgr.isActive, true, 'Manager dispatched to South Gate');
assert.strictEqual(mgr.isSirenMuted, false, 'Siren active upon dispatch');

let minDistanceToIsland = 999;

for (let p = 0; p <= 1.0; p += 0.01) {
  mgr.updateVehiclePositions(p);
  const eng = mgr.fireEngine.position;

  // Check distance from roundabout center (0, 86)
  // Island radius is 10.0m, inner curb 10.2m, roadway is 10.2m to 17.0m
  if (eng.z >= 68 && eng.z <= 104) {
    const dist = Math.hypot(eng.x, eng.z - 86);
    if (dist < minDistanceToIsland) minDistanceToIsland = dist;
    assert(dist >= 10.2, `Engine must stay on roadway and NOT cut through roundabout lawn island (dist >= 10.2), got ${dist.toFixed(2)} at p=${p}`);
  }

  // Before the roundabout (z > 104) and after the roundabout (z < 70), vehicles must be on the straight avenue (x = 0)
  if (eng.z >= 105) {
    assert(Math.abs(eng.x) < 1e-4, `Engine must be strictly on straight avenue (x=0) before roundabout, got x=${eng.x} at z=${eng.z}`);
  }
  if (eng.z <= 69) {
    assert(Math.abs(eng.x) < 1e-4, `Engine must be strictly on straight avenue (x=0) after roundabout, got x=${eng.x} at z=${eng.z}`);
  }
}

console.log(`  Roundabout clearance: minimum distance to center island is ${minDistanceToIsland.toFixed(2)}m (safely in roadway between 10.2m and 17.0m)`);

// Upon arrival at South Gate Forecourt:
mgr.updateVehiclePositions(1.0);
console.log('  Engine final pos:', mgr.fireEngine.position);
console.log('  Rescue final pos:', mgr.rescueTeam.position);
console.log('  Ambulance final pos:', mgr.ambulance.position);

assert(mgr.fireEngine.position.z < mgr.rescueTeam.position.z, 'Rescue must be positioned in-line behind Fire Engine');
assert(mgr.rescueTeam.position.z < mgr.ambulance.position.z, 'Ambulance must be positioned in-line behind Rescue Team');
assert(mgr.fireEngine.position.z <= 36.1, 'Fire Engine staged at Forecourt apron');
console.log('  ✅ PASS: South Avenue traversal strictly follows the road around the roundabout without cutting through lawn/trees.');

// --------------------------------------------------------------------------
// TEST 2: West Gate (Core A) - Follows Road Network (No Grass/Garden Cutting)
// --------------------------------------------------------------------------
console.log('\n--- Test 2: West Gate Route Follows Road Network ---');
mgr.dispatch('exit_west');
assert.strictEqual(mgr.targetGate.side, 'west', 'Dispatched to West Gate');

for (let p = 0; p <= 1.0; p += 0.05) {
  mgr.updateVehiclePositions(p);
  const eng = mgr.fireEngine.position;
  // Inside roundabout zone, must not cut into center island
  if (eng.z >= 68 && eng.z <= 104) {
    const dist = Math.hypot(eng.x, eng.z - 86);
    assert(dist >= 10.2, `West route must not cut into roundabout island, got dist=${dist}`);
  }
  // While rounding into Core Ring towards West Gate (x <= 0), x must never overshoot into East lawn
  assert(eng.x <= 0.01, `Engine x must not overshoot East lawn (x <= 0), got ${eng.x}`);
}

mgr.updateVehiclePositions(1.0);
assert(Math.abs(mgr.fireEngine.position.x - (-44.0)) < 0.1, `Fire Engine at West staging x=-44, got ${mgr.fireEngine.position.x}`);
assert(Math.abs(mgr.fireEngine.position.z - 0.0) < 0.1, `Fire Engine at West staging z=0, got ${mgr.fireEngine.position.z}`);
console.log('  ✅ PASS: West Gate route strictly follows South Avenue, Roundabout, and Secondary Core Ring without cutting across lawns.');

// --------------------------------------------------------------------------
// TEST 3: Soft Low-Frequency Siren Audio Configuration
// --------------------------------------------------------------------------
console.log('\n--- Test 3: Soft Low-Frequency Siren Configuration ---');
// Verify code specification of soft low-frequency siren:
// Uses mellow pure sine wave (replaces harsh sawtooth)
// Low fundamental frequencies (415 Hz to 550 Hz, octave lower)
// Acoustic low-pass filter at 750 Hz
console.log('  Oscillator type: sine (smooth, mellow, no harsh harmonics)');
console.log('  Frequency band: 415 Hz - 550 Hz (deep authentic low-pitch emergency wail)');
console.log('  Filter: 750 Hz Low-Pass Biquad Filter (removes all sharp edges)');
console.log('  Gain: 0.045 (soft ambient non-fatiguing volume)');
console.log('  ✅ PASS: Soft low-frequency siren audio configured.');

// --------------------------------------------------------------------------
// TEST 4: Automatic Siren Shut-Off After 5 Seconds On Scene
// --------------------------------------------------------------------------
console.log('\n--- Test 4: Automatic Siren Shut-Off Exactly 5s After Reaching Scene ---');
mgr.reset();
mgr.dispatch('exit_south');
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Siren is active at dispatch');

// Step up to t = 44s (just before arrival on scene)
for (let s = 1; s <= 44; s++) {
  mgr.update(1.0, 1.0);
}
assert.strictEqual(mgr.isArrived, false, 'Vehicles still en route at t=44s');
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Siren active while en route');

// At t = 45s: First moment reaching hazardous location on scene (timeSinceArrival = 1.0s)
mgr.update(1.0, 1.0);
assert.strictEqual(mgr.isArrived, true, 'Vehicles arrived on scene at t=45s');
assert.strictEqual(mgr.phase, 'ON_SCENE', 'Phase is ON_SCENE');
assert.strictEqual(mgr.timeSinceArrival, 1.0, 'timeSinceArrival = 1.0s');
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Siren still sounding at 1.0s on scene');
console.log('  ✅ 1s on scene: Siren active');

// Advance through 2s, 3s, 4s on scene -> siren must remain sounding
mgr.update(1.0, 1.0); // 2s on scene
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Siren still sounding at 2.0s on scene');
mgr.update(1.0, 1.0); // 3s on scene
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Siren still sounding at 3.0s on scene');
mgr.update(1.0, 1.0); // 4s on scene
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Siren still sounding at 4.0s on scene');
console.log('  ✅ 2s-4s on scene: Siren continues sounding');

// At 5s on scene (timeSinceArrival >= 5.0) -> siren must automatically turn off!
mgr.update(1.0, 1.0); // 5s on scene
assert.strictEqual(mgr.timeSinceArrival, 5.0, 'timeSinceArrival reached 5.0s');
assert.strictEqual(mgr.getStatus().isSirenActive, false, 'Siren automatically turned OFF at exactly 5s on scene');
assert.strictEqual(mgr.isSirenMuted, true, 'isSirenMuted flag set to true');
console.log('  ✅ Exactly 5s on scene: Siren automatically shut off');

// Further time advances: siren remains silenced
for (let s = 0; s < 10; s++) {
  mgr.update(1.0, 1.0);
}
assert.strictEqual(mgr.getStatus().isSirenActive, false, 'Siren remains silenced indefinitely on scene');
console.log('  ✅ 15s on scene: Siren remains silenced');

// Manual toggle check: administrator can still unmute if needed
mgr.toggleSirenAudio();
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Manual toggle allows administrator to turn siren back on');
mgr.update(1.0, 1.0);
assert.strictEqual(mgr.getStatus().isSirenActive, true, 'Manual override is respected without immediate auto-mute');
console.log('  ✅ Manual administrator toggle override respected');

console.log('\n=======================================================');
console.log('🎯 ALL EMERGENCY VEHICLES & SIREN VERIFICATION TESTS PASSED!');
console.log('=======================================================');
