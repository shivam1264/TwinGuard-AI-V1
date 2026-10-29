import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TextureHelper } from './TextureHelper.js';
import { Building3D } from './Building3D.js';
import { FireParticles } from './FireParticles.js';
import { AgentCrowd } from './AgentCrowd.js';
import { NavGrid } from '../simulation/NavGrid.js';
import { Pathfinder } from '../simulation/Pathfinder.js';
import { CrowdOptimizer } from '../simulation/CrowdOptimizer.js';
import { NavigationGraph } from '../simulation/NavigationGraph.js';
import { RouteOptimizationEngine } from '../simulation/RouteOptimizationEngine.js';
import { ScenarioEngine } from '../simulation/ScenarioEngine.js';
import { GIS_MUSTER_ZONES, GIS_ORIGIN } from '../simulation/GISCoordinateSystem.js';

export class SceneManager {
  constructor(containerElement, onStatsUpdate, onRoomSelect, onRoomDoubleTap, onFacadeModeChange, onGisToggle) {
    this.container = containerElement;
    this.onStatsUpdate = onStatsUpdate;
    this.onRoomSelect = onRoomSelect;
    this.onRoomDoubleTap = onRoomDoubleTap;
    this.onFacadeModeChange = onFacadeModeChange;
    this.onGisToggle = onGisToggle;

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

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    // Set near to 0.4 and far to 18000 for full architectural depth and giant sky vault without z-fighting
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.4, 18000);

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

    // 1. Physically-Based Mathematical Atmospheric Sky Shader (Preetham / Bruneton Model)
    // 100% Optical Rayleigh & Mie Atmospheric Scattering - Zero Fake Circles, Pure Real Physics!
    this.sky = new Sky();
    this.sky.scale.setScalar(9000);
    this.scene.add(this.sky);

    const sun = new THREE.Vector3();
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 2.5;         // Crisp, pure mountain daylight air
    skyUniforms['rayleigh'].value = 1.5;          // Natural optical Rayleigh atmospheric blue
    skyUniforms['mieCoefficient'].value = 0.0035; // Gentle atmospheric Mie aerosol scattering
    skyUniforms['mieDirectionalG'].value = 0.82;  // Realistic forward solar halo

    const elevation = 32; // 32 degrees daylight elevation
    const azimuth = 65;   // 65 degrees azimuth (matches the direct sunlight)
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sun);

    // 2. High-Altitude Natural Wispy Cloud Dome (Feathery Wind-Swept Bands, ZERO circles)
    const cloudGeo = new THREE.SphereGeometry(8200, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const cloudTex = TextureHelper.createNaturalWispyCloudTexture();
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.BackSide
    });
    this.cloudDome = new THREE.Mesh(cloudGeo, cloudMat);
    this.scene.add(this.cloudDome);

    // 3. Pre-Filtered Radiance Environment Map (PMREM) for Photorealistic Glass Reflections
    this.scene.background = new THREE.Color(0xd8e6f3);
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      const skyScene = new THREE.Scene();
      const skyClone = this.sky.clone();
      skyClone.scale.setScalar(9000);
      skyScene.add(skyClone);
      const envMap = pmremGenerator.fromScene(skyScene, 0.04, 0.1, 10000);
      if (envMap && envMap.texture) {
        this.scene.environment = envMap.texture;
      }
      pmremGenerator.dispose();
    } catch (err) {
      console.warn('PMREM environment generation skipped:', err);
    }

    // 4. Soft Atmospheric Distance Fog (Blends distant terrain into horizon)
    this.scene.fog = new THREE.FogExp2(0xd6e4f0, 0.0018);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    // Enable full multi-axis 3D rotation (both horizontal yaw and vertical pitch)
    this.controls.minPolarAngle = 0.02; // Can tilt all the way down
    this.controls.maxPolarAngle = Math.PI * 0.96; // Can tilt all the way up (not locked to single axis!)
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 250;

    // Architectural Natural Daylight Illumination (Crisp, High-Detail & Natural)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    // Warm Directional Sunlight (Matching azimuth ~60° sun in sky texture)
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 2.2);
    sunLight.position.set(50, 75, 45);
    sunLight.castShadow = false;
    this.scene.add(sunLight);

    // Natural Sky & Earth Bounce Light
    const hemiLight = new THREE.HemisphereLight(0x7bb3e8, 0x64748b, 0.75);
    this.scene.add(hemiLight);

    // Soft Ambient Daylight Fill Light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-50, 42, -45);
    this.scene.add(fillLight);

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

    // Enterprise Navigation Graph & Scenario Engine
    this.navGraph = new NavigationGraph(10, 3.8);
    this.routeOptimizer = new RouteOptimizationEngine(this.navGraph);
    this.scenarioEngine = new ScenarioEngine(this.navGraph, this.routeOptimizer);

    // Independent 3D Visual Overlay Groups
    this.routeOverlayGroup = new THREE.Group();
    this.exitOverlayGroup = new THREE.Group();
    this.stairwellOverlayGroup = new THREE.Group();
    this.scene.add(this.routeOverlayGroup);
    this.scene.add(this.exitOverlayGroup);
    this.scene.add(this.stairwellOverlayGroup);

    this.showRouteOverlays = true;
    this.showExitBadges = true;

    this.initGisLayer();
  }

  initGisLayer() {
    this.gisGroup = new THREE.Group();
    this.gisGroup.visible = false;
    this.scene.add(this.gisGroup);
    this.gisBeacons = [];
  }

  toggleGisLayer(forceState = null) {
    if (!this.gisGroup) return false;
    this.gisGroup.visible = forceState !== null ? forceState : !this.gisGroup.visible;
    return this.gisGroup.visible;
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
      } else if ((key === 'g' || key === 'G') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (this.onGisToggle) {
          this.onGisToggle();
        }
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
    } else if (presetName === 'GIS_SATELLITE') {
      this.camera.position.set(0, 155, 45);
      this.controls.target.set(0, 0, 0);
    } else if (presetName === 'FOCUS_HYDRANT') {
      this.camera.position.set(24, 12, 54);
      this.controls.target.set(24, 0.5, 38);
    } else if (presetName === 'FOCUS_MUSTER_A') {
      this.camera.position.set(0, 14, 66);
      this.controls.target.set(0, 0.5, 48);
    } else if (presetName === 'FOCUS_HELIPAD') {
      this.camera.position.set(0, 52, 22);
      this.controls.target.set(0, 38.5, 0);
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

  renderRouteOverlays(assignments) {
    // Clear existing route line meshes
    while (this.routeOverlayGroup.children.length > 0) {
      const obj = this.routeOverlayGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.routeOverlayGroup.remove(obj);
    }

    if (!this.showRouteOverlays || !assignments || assignments.length === 0) return;

    // Pick unique representative paths per floor to avoid cluttering 600 overlapping lines
    const pathsByFloor = new Map();
    assignments.forEach(a => {
      if (a.path && a.path.length > 1) {
        const fl = a.path[0]?.y ? Math.round(a.path[0].y / 3.8) + 1 : 1;
        if (!pathsByFloor.has(fl)) pathsByFloor.set(fl, []);
        if (pathsByFloor.get(fl).length < 5) {
          pathsByFloor.get(fl).push(a);
        }
      }
    });

    pathsByFloor.forEach(routeList => {
      routeList.forEach(a => {
        const pts = a.path.map(p => new THREE.Vector3(p.x, p.y + 0.15, p.z));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);

        // Primary Recommended Route: Glowing emerald green line
        const primaryMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(a.exitColor || 0x00ff88),
          transparent: true,
          opacity: 0.75,
          linewidth: 2
        });
        const primaryLine = new THREE.Line(lineGeo, primaryMat);
        primaryLine.userData = { floor: a.path[0]?.y ? Math.round(a.path[0].y / 3.8) + 1 : 1 };
        this.routeOverlayGroup.add(primaryLine);

        // Alternative Route (if available): Cyan dashed line
        if (a.altPathWaypoints && a.altPathWaypoints.length > 1) {
          const altPts = a.altPathWaypoints.map(p => new THREE.Vector3(p.x, p.y + 0.18, p.z));
          const altGeo = new THREE.BufferGeometry().setFromPoints(altPts);
          const altMat = new THREE.LineDashedMaterial({
            color: 0x00e5ff,
            dashSize: 1.2,
            gapSize: 0.6,
            transparent: true,
            opacity: 0.55
          });
          const altLine = new THREE.Line(altGeo, altMat);
          altLine.computeLineDistances();
          this.routeOverlayGroup.add(altLine);
        }
      });
    });
  }

  updateExitHoloBadges(exitStats) {
    while (this.exitOverlayGroup.children.length > 0) {
      const obj = this.exitOverlayGroup.children[0];
      if (obj.material && obj.material.map) obj.material.map.dispose();
      if (obj.material) obj.material.dispose();
      this.exitOverlayGroup.remove(obj);
    }

    if (!this.showExitBadges || !exitStats) return;

    const exitLocations = {
      exit_west: { x: -29.5, y: 3.5, z: 0.0, name: 'EXIT A (WEST)' },
      exit_east: { x: 29.5, y: 3.5, z: 0.0, name: 'EXIT B (EAST)' },
      exit_south: { x: 0.0, y: 3.5, z: 24.5, name: 'EXIT C (SOUTH)' }
    };

    exitStats.forEach(ex => {
      const loc = exitLocations[ex.id];
      if (!loc) return;

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      const load = ex.load || ex.currentLoad || 0;
      const cap = ex.capacity || 60;
      const pct = Math.round((load / cap) * 100);

      // Background rounded card
      ctx.fillStyle = 'rgba(10, 16, 28, 0.92)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 112, 12);
      ctx.fill();

      // Border with status color
      const borderColor = pct > 110 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Text Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText(loc.name, 22, 42);

      // Load & Percentage
      ctx.font = '18px Inter, sans-serif';
      ctx.fillStyle = borderColor;
      ctx.fillText(`${load} / ${cap} queued (${pct}%)`, 22, 74);

      // Status pill
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(pct > 110 ? 'CRITICAL OVERLOAD' : pct > 80 ? 'CONGESTION WARNING' : 'OPTIMAL FLOW', 22, 100);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(loc.x, loc.y, loc.z);
      sprite.scale.set(7.5, 3.8, 1.0);
      this.exitOverlayGroup.add(sprite);
    });
  }

  triggerFire(roomId) {
    const room = this.building.roomsData.find(r => r.id === roomId);
    if (!room) return;

    const fireY = (room.center.y || 0) + 0.2;
    this.fireSystem.spawnFire(roomId, { x: room.center.x, y: fireY, z: room.center.z });
    this.navGrid.setFireZone(room.center.x, room.center.z, 6.5);

    // Register with Scenario Engine
    this.scenarioEngine.triggerRoomFire(roomId, 1.0);

    // If currently simulating, perform real-time dynamic rerouting!
    if (this.isSimulating) {
      const newPlan = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
      this.agentCrowd.rerouteAgents(newPlan.assignments);
      this.renderRouteOverlays(newPlan.assignments);
      this.updateExitHoloBadges(newPlan.exitStats);
    }
  }

  blockStairwell(coreName, floorNum = null) {
    this.scenarioEngine.blockStairwellCore(coreName, floorNum);

    // If currently simulating, recalculate paths dynamically!
    if (this.isSimulating) {
      const newPlan = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
      this.agentCrowd.rerouteAgents(newPlan.assignments);
      this.renderRouteOverlays(newPlan.assignments);
      this.updateExitHoloBadges(newPlan.exitStats);
      return newPlan;
    }
    return null;
  }

  startEvacuation() {
    this.isSimulating = true;
    this.elapsedSeconds = 0;

    // Use Enterprise Route Optimization Engine
    const optimizationResult = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
    this.agentCrowd.assignRoutes(optimizationResult.assignments);

    // Render 3D Visual Overlays
    this.renderRouteOverlays(optimizationResult.assignments);
    this.updateExitHoloBadges(optimizationResult.exitStats);

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
    this.scenarioEngine.clearAllIncidents();

    // Clear route overlays & badges
    this.renderRouteOverlays([]);
    this.updateExitHoloBadges([]);

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
