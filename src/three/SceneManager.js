import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Building3D } from './Building3D.js';
import { FireParticles } from './FireParticles.js';
import { AgentCrowd } from './AgentCrowd.js';
import { NavGrid } from '../simulation/NavGrid.js';
import { Pathfinder } from '../simulation/Pathfinder.js';
import { CrowdOptimizer } from '../simulation/CrowdOptimizer.js';

export class SceneManager {
  constructor(containerElement, onStatsUpdate, onRoomSelect, onRoomDoubleTap, onFacadeModeChange) {
    this.container = containerElement;
    this.onStatsUpdate = onStatsUpdate;
    this.onRoomSelect = onRoomSelect;
    this.onRoomDoubleTap = onRoomDoubleTap;
    this.onFacadeModeChange = onFacadeModeChange;

    this.simSpeed = 1.0;
    this.isSimulating = false;
    this.elapsedSeconds = 0;
    this.clock = new THREE.Clock();

    this._lastStatsUpdate = 0;
    this._lastEvacuated = -1;
    this._lastElapsedSec = -1;

    this.initScene();
    this.initSystems();
    this.initRaycaster();
    this.initKeyboardControls();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f5f9); // Clean architectural daylight studio sky
    this.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.0035); // Soft architectural daylight haze

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    // Use device pixel ratio up to 1.25 for razor-sharp rendering without supersampling lag
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    // Enable full multi-axis 3D rotation (both horizontal yaw and vertical pitch)
    this.controls.minPolarAngle = 0.02; // Can tilt all the way down
    this.controls.maxPolarAngle = Math.PI * 0.96; // Can tilt all the way up (not locked to single axis!)
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 250;

    // Architectural Daylight Studio Lighting (Clean, Crisp & Bright)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaf0, 2.3);
    sunLight.position.set(45, 68, 50);
    sunLight.castShadow = false;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    fillLight.position.set(-50, 42, -45);
    this.scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.7);
    this.scene.add(hemiLight);

    // Initial Hero View (Matches Screenshot 1 Architectural Section Elevation)
    this.setCameraPreset('HERO_VIEW');

    this.handleResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', this.handleResize);
  }

  initSystems() {
    this.building = new Building3D(this.scene);
    this.fireSystem = new FireParticles(this.scene);
    this.agentCrowd = new AgentCrowd(this.scene);

    this.navGrid = new NavGrid();
    this.pathfinder = new Pathfinder(this.navGrid);
    this.crowdOptimizer = new CrowdOptimizer(this.navGrid, this.pathfinder);
  }

  initKeyboardControls() {
    this.keysDown = {};

    this.handleKeyDown = (e) => {
      // Ignore if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const code = e.code;
      const key = e.key;

      // Prevent page scrolling on navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Space'].includes(key) ||
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      this.keysDown[code] = true;
      this.keysDown[key] = true;

      if ((key === 'h' || key === 'H') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        this.setCameraPreset('HERO_VIEW');
      } else if ((key === 'c' || key === 'C') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        this.toggleFacadeMode();
      }
    };

    this.handleKeyUp = (e) => {
      if (this.keysDown) {
        delete this.keysDown[e.code];
        delete this.keysDown[e.key];
      }
    };

    this.handleBlur = () => {
      this.keysDown = {};
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  // First-person walkthrough navigation & full multi-axis view orientation
  updateCameraNavigation(delta) {
    if (!this.camera || !this.controls || !this.keysDown) return;

    // Check if Alt or Ctrl is held down for keyboard view rotation (Look Around)
    const isRotateModifier = !!(this.keysDown['Alt'] || this.keysDown['AltLeft'] || this.keysDown['AltRight'] ||
                                this.keysDown['Control'] || this.keysDown['ControlLeft'] || this.keysDown['ControlRight']);

    if (isRotateModifier) {
      const rotSpeed = 1.6 * delta;
      const offset = this.controls.target.clone().sub(this.camera.position);

      if (this.keysDown['ArrowLeft']) {
        // Rotate view left around camera
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
        this.controls.target.copy(this.camera.position).add(offset);
        this.camera.lookAt(this.controls.target);
      }
      if (this.keysDown['ArrowRight']) {
        // Rotate view right around camera
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed);
        this.controls.target.copy(this.camera.position).add(offset);
        this.camera.lookAt(this.controls.target);
      }
      if (this.keysDown['ArrowUp']) {
        // Tilt view up
        this.controls.target.y += 6.0 * delta;
        this.camera.lookAt(this.controls.target);
      }
      if (this.keysDown['ArrowDown']) {
        // Tilt view down
        this.controls.target.y -= 6.0 * delta;
        this.camera.lookAt(this.controls.target);
      }
      return;
    }

    const isUp = !!(this.keysDown['ArrowUp'] || this.keysDown['KeyW'] || this.keysDown['w'] || this.keysDown['W']);
    const isDown = !!(this.keysDown['ArrowDown'] || this.keysDown['KeyS'] || this.keysDown['s'] || this.keysDown['S']);
    const isLeft = !!(this.keysDown['ArrowLeft'] || this.keysDown['KeyA'] || this.keysDown['a'] || this.keysDown['A']);
    const isRight = !!(this.keysDown['ArrowRight'] || this.keysDown['KeyD'] || this.keysDown['d'] || this.keysDown['D']);
    const isElevateUp = !!(this.keysDown['KeyE'] || this.keysDown['e'] || this.keysDown['E'] || this.keysDown['PageUp']);
    const isElevateDown = !!(this.keysDown['KeyQ'] || this.keysDown['q'] || this.keysDown['Q'] || this.keysDown['PageDown']);

    if (!isUp && !isDown && !isLeft && !isRight && !isElevateUp && !isElevateDown) return;

    // 1. Current look direction of the camera
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    // Keep horizontal movement parallel to floor (XZ plane) so camera stays at current eye level
    const horizontalForward = new THREE.Vector3(forward.x, 0, forward.z);
    if (horizontalForward.lengthSq() > 0.0001) {
      horizontalForward.normalize();
    } else {
      horizontalForward.copy(forward).normalize();
    }

    // 2. Right vector perpendicular to horizontal forward
    const right = new THREE.Vector3();
    right.crossVectors(horizontalForward, new THREE.Vector3(0, 1, 0)).normalize();

    // 3. Accumulate movement direction
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (isUp) moveDir.add(horizontalForward);
    if (isDown) moveDir.sub(horizontalForward);
    if (isRight) moveDir.add(right);
    if (isLeft) moveDir.sub(right);

    if (isElevateUp) moveDir.y += 1.0;
    if (isElevateDown) moveDir.y -= 1.0;

    if (moveDir.lengthSq() > 0.0001) {
      moveDir.normalize();

      const isSprint = !!(this.keysDown['ShiftLeft'] || this.keysDown['ShiftRight'] || this.keysDown['Shift']);
      const speed = isSprint ? 22.0 : 10.5; // Natural smooth walkthrough speed

      const displacement = moveDir.multiplyScalar(speed * delta);

      // Move BOTH camera.position AND controls.target by the EXACT same displacement!
      // This guarantees the viewing angle, pitch, yaw, and orientation NEVER CHANGE.
      this.camera.position.add(displacement);
      this.controls.target.add(displacement);

      // Prevent camera from falling below ground plane
      if (this.camera.position.y < 0.5) {
        const diff = 0.5 - this.camera.position.y;
        this.camera.position.y = 0.5;
        this.controls.target.y += diff;
      }
    }
  }

  setFacadeModeDirect(mode) {
    if (this.building && this.building.facadeMode !== mode) {
      const newMode = this.building.toggleFacadeMode();
      if (this.onFacadeModeChange) {
        this.onFacadeModeChange(newMode);
      }
      return newMode;
    }
    return mode;
  }

  zoomIn(amount = 6) {
    if (!this.camera || !this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const len = offset.length();
    if (len > 4) {
      offset.multiplyScalar(Math.max(4, len - amount) / len);
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  zoomOut(amount = 6) {
    if (!this.camera || !this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const len = offset.length();
    offset.multiplyScalar((len + amount) / len);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  getCameraYaw() {
    if (!this.camera || !this.controls) return 0;
    const offset = this.camera.position.clone().sub(this.controls.target);
    return Math.atan2(offset.x, offset.z) * (180 / Math.PI);
  }

  setBimLayer(layerName, isVisible) {
    if (layerName === 'occupants' && this.agentCrowd) {
      this.agentCrowd.group.visible = isVisible;
    }
    if (layerName === 'fireSafety' && this.fireSystem) {
      this.fireSystem.activeFires.forEach(f => {
        if (f.group) f.group.visible = isVisible;
      });
    }
    if (layerName === 'structure' && this.building) {
      if (this.building.roofGroup) this.building.roofGroup.visible = isVisible;
    }
  }

  toggleFacadeMode() {
    if (this.building) {
      const newMode = this.building.toggleFacadeMode();
      if (this.onFacadeModeChange) {
        this.onFacadeModeChange(newMode);
      }
      return newMode;
    }
    return 'CUTAWAY';
  }

  getRoomAtClientPos(clientX, clientY) {
    if (!this.container || !this.camera || !this.building) return null;
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const activeMode = this.building.floorMode;
    const floorLevels = (activeMode === 'ALL' || activeMode === 'EXPLODED')
      ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] // Test top floor down to ground
      : [parseInt(activeMode, 10) || 1];

    for (const fl of floorLevels) {
      const floorY = (fl - 1) * this.building.floorHeight + (activeMode === 'EXPLODED' ? (fl - 1) * 5.0 : 0);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
      const intersection = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(plane, intersection)) {
        const roomOnThisFloor = this.building.roomsData.find(room => {
          if (room.floor !== fl) return false;
          const b = room.bounds;
          return intersection.x >= b.minX - 1 && intersection.x <= b.maxX + 1 &&
                 intersection.z >= b.minZ - 1 && intersection.z <= b.maxZ + 1;
        });

        if (roomOnThisFloor) {
          return roomOnThisFloor;
        }
      }
    }
    return null;
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };
    let singleTapTimeout = null;
    let pointerDownPos = { x: 0, y: 0 };

    this.container.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    this.container.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 8) return; // Orbit drag, ignore

      const now = Date.now();
      const timeDiff = now - lastTapTime;
      const tapDist = Math.hypot(e.clientX - lastTapPos.x, e.clientY - lastTapPos.y);

      if (timeDiff < 320 && tapDist < 25) {
        // Double-Tap Detected!
        if (singleTapTimeout) {
          clearTimeout(singleTapTimeout);
          singleTapTimeout = null;
        }
        lastTapTime = 0;

        const matchedRoom = this.getRoomAtClientPos(e.clientX, e.clientY);
        if (matchedRoom && this.onRoomDoubleTap) {
          this.onRoomDoubleTap(matchedRoom, { screenX: e.clientX, screenY: e.clientY });
        }
      } else {
        // First tap / potential single-click
        lastTapTime = now;
        lastTapPos = { x: e.clientX, y: e.clientY };

        singleTapTimeout = setTimeout(() => {
          const matchedRoom = this.getRoomAtClientPos(e.clientX, e.clientY);
          if (matchedRoom && this.onRoomSelect) {
            this.onRoomSelect(matchedRoom.id);
          }
        }, 260);
      }
    });

    // Native dblclick support for desktop
    this.container.addEventListener('dblclick', (e) => {
      if (singleTapTimeout) {
        clearTimeout(singleTapTimeout);
        singleTapTimeout = null;
      }
      const matchedRoom = this.getRoomAtClientPos(e.clientX, e.clientY);
      if (matchedRoom && this.onRoomDoubleTap) {
        this.onRoomDoubleTap(matchedRoom, { screenX: e.clientX, screenY: e.clientY });
      }
    });
  }

  setCameraPreset(presetName, targetRoomId = null) {
    if (!this.camera || !this.controls) return;

    if (presetName === 'HERO_VIEW') {
      // Architectural Section Elevation Cutaway View (Screenshot 1)
      this.camera.position.set(3, 20, 68);
      this.controls.target.set(0, 19, 0);
    } else if (presetName === 'TOP_DOWN') {
      this.camera.position.set(0, 115, 1);
      this.controls.target.set(0, 19, 0);
    } else if (presetName === 'STAIRS_FOCUS') {
      this.camera.position.set(-42, 24, 32);
      this.controls.target.set(-28, 16, 0);
    } else if (presetName.startsWith('FLOOR_')) {
      const fl = parseInt(presetName.replace('FLOOR_', ''), 10) || 1;
      const baseY = (fl - 1) * this.building.floorHeight;
      this.camera.position.set(32, baseY + 14, 36);
      this.controls.target.set(0, baseY + 1.5, 0);
    } else if (presetName === 'ROOM_FOCUS' && targetRoomId) {
      const room = this.building.roomsData.find(r => r.id === targetRoomId);
      if (room) {
        this.camera.position.set(room.camPos.x, room.camPos.y + 5, room.camPos.z);
        this.controls.target.set(room.center.x, room.center.y + 1, room.center.z);
      }
    } else {
      // Default High Isometric View
      this.camera.position.set(58, 65, 75);
      this.controls.target.set(0, 19, 0);
    }
    this.controls.update();
  }

  setFloorMode(mode) {
    if (this.building) {
      this.building.setFloorMode(mode);
    }
    if (this.agentCrowd) {
      this.agentCrowd.setFloorMode(mode);
    }
    if (this.fireSystem) {
      this.fireSystem.setFloorMode(mode);
    }

    // Only zoom out for exploded view; never hijack user's custom viewing angle when toggling floors or all-tower view
    if (mode === 'EXPLODED') {
      this.camera.position.set(70, 80, 85);
      this.controls.target.set(0, 24, 0);
      this.controls.update();
    }
  }

  syncOccupants(rooms) {
    this.agentCrowd.spawnAgentsForRooms(rooms);
  }

  triggerFire(roomId) {
    const room = this.building.roomsData.find(r => r.id === roomId);
    if (!room) return;

    const fireY = (room.center.y || 0) + 0.2;
    this.fireSystem.spawnFire(roomId, { x: room.center.x, y: fireY, z: room.center.z });
    this.navGrid.setFireZone(room.center.x, room.center.z, 6.5);
  }

  startEvacuation() {
    this.isSimulating = true;
    this.elapsedSeconds = 0;

    const fireLocations = [];
    this.fireSystem.activeFires.forEach(f => {
      fireLocations.push(f.basePos);
    });

    const optimizationResult = this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations);
    this.agentCrowd.assignRoutes(optimizationResult.assignments);
    return optimizationResult;
  }

  pauseSimulation() {
    this.isSimulating = false;
  }

  resumeSimulation() {
    this.isSimulating = true;
  }

  reset(rooms) {
    this.isSimulating = false;
    this.elapsedSeconds = 0;
    this._lastStatsUpdate = 0;
    this._lastEvacuated = -1;
    this._lastElapsedSec = -1;
    this.fireSystem.extinguishAll();
    this.navGrid.resetDynamicHazards();
    this.agentCrowd.spawnAgentsForRooms(rooms);
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updateCameraNavigation(delta);

    if (this.controls) {
      this.controls.update();
    }

    if (this.fireSystem) {
      this.fireSystem.update(delta);
    }

    if (this.building && this.building.update) {
      this.building.update(delta);
    }

    if (this.agentCrowd) {
      const stats = this.agentCrowd.update(delta, this.isSimulating ? this.simSpeed : 0);

      if (this.isSimulating) {
        this.elapsedSeconds += delta * this.simSpeed;

        const currentFloorSec = Math.floor(this.elapsedSeconds);
        const now = performance.now();
        const shouldUpdate =
          !this._lastStatsUpdate ||
          (now - this._lastStatsUpdate > 160) ||
          stats.isCompleted ||
          (this._lastEvacuated !== stats.evacuated) ||
          (this._lastElapsedSec !== currentFloorSec);

        if (shouldUpdate && this.onStatsUpdate) {
          this._lastStatsUpdate = now;
          this._lastEvacuated = stats.evacuated;
          this._lastElapsedSec = currentFloorSec;
          this.onStatsUpdate({
            ...stats,
            elapsedSeconds: currentFloorSec,
            isCompleted: stats.inTransit === 0 && stats.total > 0
          });
        }
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
