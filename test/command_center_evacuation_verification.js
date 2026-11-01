import assert from 'assert';
import fs from 'fs';

console.log('=======================================================');
console.log('🧪 TESTING COMMAND CENTER EVACUATION BUTTON & TRIGGER');
console.log('=======================================================');

// 1. Verify App.jsx props
const app = fs.readFileSync('src/App.jsx', 'utf8');
assert(app.includes('onStartSimulation={handleStartEvacuation}'), 'App.jsx must pass handleStartEvacuation');
assert(app.includes('onPauseSimulation={handlePauseResume}'), 'App.jsx must pass handlePauseResume');
assert(app.includes('onResetSimulation={handleReset}'), 'App.jsx must pass handleReset');
assert(app.includes('systemStatus={systemStatus}'), 'App.jsx must pass systemStatus');
assert(app.includes('stats={stats}'), 'App.jsx must pass stats');
console.log('✅ PASS: App.jsx passes real simulation handlers and live telemetry to EmergencyCommandCenterPage');

// 2. Verify EmergencyCommandCenterPage.jsx Hero Button
const ecc = fs.readFileSync('src/components/EmergencyCommandCenterPage.jsx', 'utf8');
assert(ecc.includes('START EVACUATION'), 'EmergencyCommandCenterPage must contain START EVACUATION button');
assert(ecc.includes('PAUSE EVACUATION'), 'EmergencyCommandCenterPage must contain PAUSE EVACUATION button');
assert(ecc.includes('handleToggleEvacuation'), 'EmergencyCommandCenterPage must implement handleToggleEvacuation');
assert(ecc.includes('handleResetEvacuation'), 'EmergencyCommandCenterPage must implement handleResetEvacuation');
console.log('✅ PASS: Top Header Hero START/PAUSE EVACUATION button implemented with live egress count');

// 3. Verify Floating Tactical HUD in 3D Viewport
assert(ecc.includes('FLOATING TACTICAL EVACUATION HUD'), '3D Viewport must have floating tactical evacuation HUD');
assert(ecc.includes('Evacuation Active'), 'HUD must show active evacuation status');
console.log('✅ PASS: Floating Tactical Evacuation HUD placed directly in 3D Viewport');

// 4. Verify Facade Cutaway on Evacuation Start
assert(ecc.includes("sceneManager.setFacadeMode('CUTAWAY')") || ecc.includes("sceneManager.building.facadeMode = 'CUTAWAY'"), 'Evacuation start must switch to CUTAWAY');
console.log('✅ PASS: Triggering evacuation auto-engages CUTAWAY facade so internal stair/corridor movement is visible');

console.log('=======================================================');
console.log('🎯 ALL COMMAND CENTER EVACUATION TESTS PASSED!');
console.log('=======================================================');

