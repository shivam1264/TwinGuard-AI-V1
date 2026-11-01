import assert from 'assert';
import * as THREE from 'three';

console.log('=======================================================');
console.log('🧪 TESTING 3D CORRIDOR & STAIR CLICK SELECTION RAYCAST');
console.log('=======================================================\n');

// Mock building data
const mockBuilding = {
  floorHeight: 3.8,
  floorMode: 'ALL',
  stairsGroup: new THREE.Group(),
  roomsData: [
    {
      id: 'f4_r1',
      floor: 4,
      name: 'Room 401',
      bounds: { minX: -22, maxX: -13, minZ: 3.5, maxZ: 21.5 }
    }
  ]
};

// Mock SceneManager instance with our new getRoomAtClientPos logic
class MockSceneManager {
  constructor(building) {
    this.building = building;
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.camera.position.set(0, 50, 60);
    this.camera.lookAt(0, 15, 0);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.container = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 })
    };
  }

  // We test the intersection classifier directly with simulated ray points on Floor 4
  classifyFloorPoint(fl, x, z) {
    const floorH = this.building.floorHeight || 3.8;
    const floorY = (fl - 1) * floorH;

    // A. West Staircase Core A
    if (x <= -22.5 && x >= -34.5 && Math.abs(z) <= 6.5) {
      return {
        id: `stair_f${fl}_west`,
        category: 'STAIR',
        floor: fl,
        name: `Staircase Core A (West) — Floor ${fl}`,
        shortName: `Staircase Core A`,
        zone: 'West'
      };
    }

    // B. East Staircase Core B
    if (x >= 22.5 && x <= 34.5 && Math.abs(z) <= 6.5) {
      return {
        id: `stair_f${fl}_east`,
        category: 'STAIR',
        floor: fl,
        name: `Staircase Core B (East) — Floor ${fl}`,
        shortName: `Staircase Core B`,
        zone: 'East'
      };
    }

    // C. Room
    const room = this.building.roomsData.find((r) => {
      if (r.floor !== fl) return false;
      const b = r.bounds;
      return x >= b.minX - 0.5 && x <= b.maxX + 0.5 && z >= b.minZ - 0.5 && z <= b.maxZ + 0.5;
    });
    if (room) {
      return { ...room, category: 'ROOM', shortName: room.name };
    }

    // D. Longitudinal Central Corridor
    if (Math.abs(z) <= 3.2 && x >= -25.5 && x <= 25.5) {
      const isWest = x < 0;
      const zone = isWest ? 'west' : 'east';
      const zoneLabel = isWest ? 'West' : 'East';
      return {
        id: `corr_f${fl}_${zone}`,
        category: 'CORRIDOR',
        floor: fl,
        name: `${zoneLabel} Corridor — Floor ${fl}`,
        shortName: `${zoneLabel} Corridor`,
        zone: zoneLabel
      };
    }

    return null;
  }
}

const mgr = new MockSceneManager(mockBuilding);

// Test 1: Click at West Stair tower (-28, 0)
const stairWest = mgr.classifyFloorPoint(4, -28, 0);
assert.ok(stairWest, 'West Stair should be detected');
assert.strictEqual(stairWest.id, 'stair_f4_west');
assert.strictEqual(stairWest.category, 'STAIR');
console.log('✅ PASS: West Staircase detected at (-28, 0):', stairWest.id);

// Test 2: Click at East Stair tower (28, 0)
const stairEast = mgr.classifyFloorPoint(4, 28, 0);
assert.ok(stairEast, 'East Stair should be detected');
assert.strictEqual(stairEast.id, 'stair_f4_east');
assert.strictEqual(stairEast.category, 'STAIR');
console.log('✅ PASS: East Staircase detected at (28, 0):', stairEast.id);

// Test 3: Click at West Corridor runner (-12, 0)
const corrWest = mgr.classifyFloorPoint(4, -12, 0);
assert.ok(corrWest, 'West Corridor should be detected');
assert.strictEqual(corrWest.id, 'corr_f4_west');
assert.strictEqual(corrWest.category, 'CORRIDOR');
console.log('✅ PASS: West Corridor detected at (-12, 0):', corrWest.id);

// Test 4: Click at East Corridor runner (12, 0)
const corrEast = mgr.classifyFloorPoint(4, 12, 0);
assert.ok(corrEast, 'East Corridor should be detected');
assert.strictEqual(corrEast.id, 'corr_f4_east');
assert.strictEqual(corrEast.category, 'CORRIDOR');
console.log('✅ PASS: East Corridor detected at (12, 0):', corrEast.id);

// Test 5: Click at Room 401 (-18, 10)
const room401 = mgr.classifyFloorPoint(4, -18, 10);
assert.ok(room401, 'Room 401 should be detected');
assert.strictEqual(room401.id, 'f4_r1');
assert.strictEqual(room401.category, 'ROOM');
console.log('✅ PASS: Room 401 detected at (-18, 10):', room401.id);

console.log('\n=======================================================');
console.log('🎯 ALL 3D SELECTION TESTS PASSED SUCCESSFULLY!');
console.log('=======================================================');

