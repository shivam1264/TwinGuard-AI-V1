import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Building3D } from './Building3D.js';
import { CampusSite } from './site/CampusSite.js';
import { FireParticles } from './FireParticles.js';
import { AgentCrowd } from './AgentCrowd.js';
import { HazardVisualizer } from './HazardVisualizer.js';
import { ExitCongestionVisualizer } from './ExitCongestionVisualizer.js';
import { NavGrid } from '../simulation/NavGrid.js';
import { Pathfinder } from '../simulation/Pathfinder.js';
import { NavigationGraph } from '../simulation/NavigationGraph.js';
import { CrowdOptimizer } from '../simulation/CrowdOptimizer.js';
import { createTowerGraph, loadBuilding, applyScenario } from '../simulation/BuildingGraph.js';
import { advanceHazardState, injectFireSource, createHazardState } from '../simulation/HazardPropagation.js';
import { assessRisk } from '../simulation/RiskAssessment.js';
import { buildRoutingHazardContext, getExitRouteCondition, ROUTE_CONDITIONS } from '../simulation/RoutingHazardAdapter.js';
import { ZoneToGridMapper, applyHazardStateToGrid } from '../simulation/ZoneToGridMapper.js';
import { captureExitSnapshot, createRerouteEvent, diffExitAssignments } from '../simulation/RerouteEvents.js';
import { resolveStrategyInfo } from '../ai/StrategyInfo.js';
import { AIEngine } from '../ai/index.js';

export class SimulationClock {
  constructor() {
    this._startTime = 0;
    this._pauseStartTime = 0;
    this._pausedDuration = 0;
    this._running = false;
  }

  start() {
    if (!this._running) {
      const now = performance.now();
      this._startTime = now - this._pausedDuration;
      this._running = true;
    }
  }

  stop() {
    if (this._running) {
      this._pausedDuration = performance.now() - this._startTime;
      this._running = false;
    }
  }

  getDelta() {
    if (!this._running) return 0;
    const now = performance.now();
    const delta = (now - this._startTime) / 1000;
    this._startTime = now;
    return delta;
  }

  getElapsed() {
    if (this._running) {
      return (performance.now() - this._startTime) / 1000;
    }
    return this._pausedDuration / 1000;
  }

  setElapsed(seconds) {
    const now = performance.now();
    this._pausedDuration = seconds * 1000;
    this._startTime = now - this._pausedDuration;
  }

  reset() {
    this._startTime = 0;
    this._pauseStartTime = 0;
    this._pausedDuration = 0;
    this._running = false;
  }

  get running() {
    return this._running;
  }
}
import { EmergencyVehiclesManager } from './EmergencyVehiclesManager.js';

export class SceneManager {
  constructor(containerElement, onStatsUpdate, onRoomSelect, onRoomDoubleTap, onFacadeModeChange, onFireSpread) {
    this.onFireSpread = onFireSpread;
    this.container = containerElement;
    this.onStatsUpdate = onStatsUpdate;
    this.onRoomSelect = onRoomSelect;
    this.onRoomDoubleTap = onRoomDoubleTap;
    this.onFacadeModeChange = onFacadeModeChange;

    this.simSpeed = 1.0;
    this.isSimulating = false;
    this.elapsedSeconds = 0;
    this.routingHazardContext = null;
    this.activeStrategyType = null;
    this.activeStrategy = null;

    // Module 7F: aggregated reroute events and strategy indicator
    this.pendingRerouteEvents = [];
    this.rerouteEventSeq = 0;
    this._lastRerouteAt = 0;

    // Phase 5C: Live hazard state management
    this.hazardState = null;
    this.riskAssessment = null;
    this.activeScenario = null;
    this.buildingGraph = null;
    this.lastRoutingContextHash = null;
    this.reevaluationCooldown = 0;
    this.minReevaluationInterval = 2.0; // Minimum seconds between reevaluations

    // Deterministic simulation clock with proper pause/resume
    this._clock = new SimulationClock();

    // Phase 5D: Zone-to-grid hazard mapper
    this._zoneToGridMapper = null;

    this._lastStatsUpdate = 0;
    this._lastEvacuated = -1;
    this._lastElapsedSec = -1;

    // Smooth Camera Animation Controller
    this.cameraTransition = null;

    this.initScene();
    this.initSystems();
    this.initRaycaster();
    this.initKeyboardControls();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Atmospheric sky & daylight color matching WorldEnvironmentManager sky dome horizon
    this.scene.background = new THREE.Color(0xeaf0f8);
    // Soft atmospheric distance haze (keeps world visible across 2.4km without abrupt edge)
    this.scene.fog = new THREE.FogExp2(0xeaf0f8, 0.00032);

    const width = this.container.clientWidth || window.innerWidth || 1200;
    const height = this.container.clientHeight || (window.innerHeight - 56) || 800;
    // Balanced architectural perspective (FOV 44 deg) with extended draw distance for regional world
    this.camera = new THREE.PerspectiveCamera(44, width / height, 1.2, 4200);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    // Enable soft, physically believable architectural contact shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minPolarAngle = 0.02;
    this.controls.maxPolarAngle = Math.PI * 0.48; // Clamped above ground plane to prevent seeing underneath
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 640; // Allows smooth regional zoom out without hitting ceiling

    // Architectural Daylight Studio Lighting (Naturally lit, physically balanced)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Primary Directional Sunlight with optimized shadow map
    const sunLight = new THREE.DirectionalLight(0xfffaf0, 2.2);
    sunLight.position.set(120, 220, 160);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 1400;
    sunLight.shadow.camera.left = -480;
    sunLight.shadow.camera.right = 480;
    sunLight.shadow.camera.top = 480;
    sunLight.shadow.camera.bottom = -480;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.75);
    fillLight.position.set(-50, 42, -45);
    fillLight.castShadow = false;
    this.scene.add(fillLight);

    // Dedicated Stairwell Core Warm Ambient Fill Lights (Eliminates unlit internal shadow pits)
    const westStairFill = new THREE.PointLight(0xffedd5, 1.4, 60, 1.0);
    westStairFill.position.set(-28, 20, -1.2);
    this.scene.add(westStairFill);

    const eastStairFill = new THREE.PointLight(0xffedd5, 1.4, 60, 1.0);
    eastStairFill.position.set(28, 20, -1.2);
    this.scene.add(eastStairFill);

    // Subtle Ground Hemisphere Bounce
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.65);
    this.scene.add(hemiLight);

    // Initial Hero View (Architectural Section Elevation)
    this.setCameraPreset('HERO_VIEW', null, false);

    this.handleResize = () => {
      if (!this.container || this.isDisposed) return;
      const w = this.container.clientWidth || window.innerWidth || 1200;
      const h = this.container.clientHeight || (window.innerHeight - 56) || 800;
      if (w === 0 || h === 0) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', this.handleResize);

    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  initSystems() {
    this.building = new Building3D(this.scene);
    this.campusSite = new CampusSite(this.scene);

    // Hide legacy 260m ground plane from Building3D environment so CampusSite master plan is fully visible
    if (this.building && this.building.layers && this.building.layers.environment) {
      const envChildren = this.building.layers.environment.children;
      if (envChildren && envChildren.length > 0) {
        envChildren[0].visible = false;
      }
    }
    this.fireSystem = new FireParticles(this.scene, (parentRoomId, targetRoomId) => {
      this.triggerFire(targetRoomId);
      if (this.onFireSpread) {
        this.onFireSpread(targetRoomId);
      }
    }, this.building);
    this.agentCrowd = new AgentCrowd(this.scene);

    this.navGrid = new NavGrid();
    this.pathfinder = new Pathfinder(this.navGrid);
    this.crowdOptimizer = new CrowdOptimizer(this.navGrid, this.pathfinder);

    // Navigation graph for topological routing and live congestion tracking
    this.navigationGraph = new NavigationGraph(10, 3.8);

    // Phase 5C: Initialize building graph for hazard routing
    const rawGraph = createTowerGraph();
    this.buildingGraph = loadBuilding(rawGraph);
    this.hazardVisualizer = new HazardVisualizer(this.scene, {
      floorHeight: this.buildingGraph.data.floorHeightM
    });
    this.exitCongestionVisualizer = new ExitCongestionVisualizer(this.scene);

    // Phase 5D: Initialize zone-to-grid mapper for grid-level hazard integration
    this._zoneToGridMapper = new ZoneToGridMapper(this.navGrid);

    this.emergencyManager = new EmergencyVehiclesManager(this.scene);
  }

  initKeyboardControls() {
    this.keysDown = {};

    this.handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const code = e.code;
      const key = e.key;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Space'].includes(key) ||
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      this.keysDown[code] = true;
      this.keysDown[key] = true;

      // Yield any running camera transition on user manual input
      this.cameraTransition = null;

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

  updateCameraNavigation(delta) {
    if (!this.camera || !this.controls || !this.keysDown) return;

    const isRotateModifier = !!(this.keysDown['Alt'] || this.keysDown['AltLeft'] || this.keysDown['AltRight'] ||
                                this.keysDown['Control'] || this.keysDown['ControlLeft'] || this.keysDown['ControlRight']);

    if (isRotateModifier) {
      this.cameraTransition = null;
      const rotSpeed = 1.6 * delta;
      const offset = this.controls.target.clone().sub(this.camera.position);

      if (this.keysDown['ArrowLeft']) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
        this.controls.target.copy(this.camera.position).add(offset);
        this.camera.lookAt(this.controls.target);
      }
      if (this.keysDown['ArrowRight']) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed);
        this.controls.target.copy(this.camera.position).add(offset);
        this.camera.lookAt(this.controls.target);
      }
      if (this.keysDown['ArrowUp']) {
        this.controls.target.y += 6.0 * delta;
        this.camera.lookAt(this.controls.target);
      }
      if (this.keysDown['ArrowDown']) {
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

    this.cameraTransition = null; // Yield transition

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    const horizontalForward = new THREE.Vector3(forward.x, 0, forward.z);
    if (horizontalForward.lengthSq() > 0.0001) {
      horizontalForward.normalize();
    } else {
      horizontalForward.copy(forward).normalize();
    }

    const right = new THREE.Vector3();
    right.crossVectors(horizontalForward, new THREE.Vector3(0, 1, 0)).normalize();

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
      const speed = isSprint ? 22.0 : 10.5;

      const displacement = moveDir.multiplyScalar(speed * delta);

      this.camera.position.add(displacement);
      this.controls.target.add(displacement);

      if (this.camera.position.y < 0.5) {
        const diff = 0.5 - this.camera.position.y;
        this.camera.position.y = 0.5;
        this.controls.target.y += diff;
      }
    }
  }

  getElevatorStatus() {
    return this.building ? this.building.getElevatorStatus() : [];
  }

  setFacadeModeDirect(mode) {
    if (this.building) {
      this.building.setFacadeMode(mode);
      if (this.onFacadeModeChange) {
        this.onFacadeModeChange(mode);
      }
      return mode;
    }
    return 'CUTAWAY';
  }

  toggleFacadeMode() {
    if (this.building) {
      const newMode = this.building.toggleFacadeMode();
      // Camera stays in place - do NOT re-adjust or jump camera on C toggle
      if (this.onFacadeModeChange) {
        this.onFacadeModeChange(newMode);
      }
      return newMode;
    }
    return 'CUTAWAY';
  }

  // Presentation View Mode Selection (Full Exterior, Transparent, Cutaway, Floor Plan, etc.)
  setViewMode(mode) {
    if (!this.building) return;
    this.building.setViewMode(mode);

    if (mode === 'FULL_EXTERIOR') {
      this.setCameraPreset('FULL_BUILDING');
    } else if (mode === 'TRANSPARENT_FACADE') {
      this.setCameraPreset('AXONOMETRIC');
    } else if (mode === 'CUTAWAY') {
      this.setCameraPreset('HERO_VIEW');
    } else if (mode === 'FLOOR_PLAN') {
      this.setCameraPreset('FLOOR_PLAN');
    } else if (mode === 'SECTIONAL_CUT') {
      this.setCameraPreset('SECTION');
    } else if (mode === 'EXPLODED') {
      this.setFloorMode('EXPLODED');
    } else if (mode === 'ROOF_VIEW') {
      this.setCameraPreset('ROOF');
    }

    if (this.onFacadeModeChange) {
      this.onFacadeModeChange(this.building.facadeMode);
    }
  }

  // Layer Filter Control (Structure, Architecture, Facade, Furniture, Occupancy, MEP, Environment)
  setLayerVisibility(layerName, isVisible) {
    if (layerName === 'environment' || layerName === 'site') {
      if (this.campusSite) {
        this.campusSite.setVisibility(isVisible);
      }
    }
    if (layerName === 'occupancy') {
      if (this.agentCrowd && this.agentCrowd.group) {
        this.agentCrowd.group.visible = isVisible;
      }
      return;
    }

    if (this.building) {
      this.building.setLayerVisibility(layerName, isVisible);
    }
  }

  getRoomAtClientPos(clientX, clientY) {
    if (!this.container || !this.camera || !this.building) return null;
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const activeMode = this.building.floorMode;
    const floorLevels = (activeMode === 'ALL' || activeMode === 'EXPLODED')
      ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
      : [parseInt(activeMode, 10) || 1];

    for (const fl of floorLevels) {
      const floorY = (fl - 1) * this.building.floorHeight;
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
      this.cameraTransition = null; // Interrupt camera tween if user interacts
    });

    this.container.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 8) return;

      const now = Date.now();
      const timeDiff = now - lastTapTime;
      const tapDist = Math.hypot(e.clientX - lastTapPos.x, e.clientY - lastTapPos.y);

      if (timeDiff < 320 && tapDist < 25) {
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
        lastTapTime = now;
        lastTapPos = { x: e.clientX, y: e.clientY };

        singleTapTimeout = setTimeout(() => {
          const matchedRoom = this.getRoomAtClientPos(e.clientX, e.clientY);
          // Room popup on click removed per user request
        }, 260);
      }
    });

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

  // Smooth, Cinematic Camera Transition to any preset
  setCameraPreset(presetName, targetRoomId = null, animate = true) {
    if (!this.camera || !this.controls) return;

    let targetPos = new THREE.Vector3(3, 20, 68);
    let targetLook = new THREE.Vector3(0, 19, 0);

    if (presetName === 'CAMPUS_HERO' || presetName === 'HERO_VIEW') {
      // Elevated architectural hero perspective showing the 10-storey tower, forecourt & entrance circus
      targetPos.set(28, 30, 72);
      targetLook.set(0, 16, 0);
    } else if (presetName === 'CAMPUS_OVERVIEW') {
      // High aerial isometric view showing complete master plan, road ring & surrounding clusters
      targetPos.set(0, 240, 275);
      targetLook.set(0, 8, 12);
    } else if (presetName === 'REGIONAL_OVERVIEW') {
      // Maximum zoom overview showing campus embedded in regional highway context
      targetPos.set(0, 360, 390);
      targetLook.set(0, 5, 0);
    } else if (presetName === 'CAMPUS_AERIAL') {
      // High-angle architectural perspective
      targetPos.set(0, 300, 25);
      targetLook.set(0, 0, 0);
    } else if (presetName === 'TOP_DOWN') {
      // True 90-degree orthogonal master plan inspection view showing all 12 zones & road ring
      targetPos.set(0, 310, 1);
      targetLook.set(0, 0, 0);
    } else if (presetName === 'CUTAWAY_VIEW') {
      targetPos.set(16, 22, 64);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'FULL_BUILDING') {
      targetPos.set(68, 48, 75);
      targetLook.set(0, 18, 0);
    } else if (presetName === 'SOUTH_FACADE') {
      targetPos.set(0, 22, 75);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'NORTH_FACADE') {
      targetPos.set(0, 22, -75);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'EAST_FACADE') {
      targetPos.set(75, 22, 0);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'WEST_FACADE') {
      targetPos.set(-75, 22, 0);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'EMERGENCY_FOCUS' || presetName === 'STAGING_AREA') {
      const targetSide = this.emergencyManager ? this.emergencyManager.targetGate.side : 'west';
      if (targetSide === 'west') {
        targetPos.set(-72, 22, 24);
        targetLook.set(-42, 2, 0);
      } else if (targetSide === 'east') {
        targetPos.set(72, 22, 24);
        targetLook.set(42, 2, 0);
      } else {
        targetPos.set(0, 22, 85);
        targetLook.set(0, 2, 40);
      }
    } else if (presetName === 'FLOOR_PLAN') {
      const fl = (this.building && parseInt(this.building.floorMode, 10)) || 1;
      const baseY = (fl - 1) * (this.building ? this.building.floorHeight : 3.8);
      targetPos.set(0, baseY + 38, 12);
      targetLook.set(0, baseY + 0.5, 0);
    } else if (presetName === 'AXONOMETRIC') {
      targetPos.set(62, 68, 68);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'SECTION') {
      targetPos.set(0, 20, 62);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'ENTRANCE') {
      targetPos.set(0, 6.5, 42);
      targetLook.set(0, 3.5, 24);
    } else if (presetName === 'ROOF') {
      targetPos.set(0, 56, 32);
      targetLook.set(0, 38, -2);
    } else if (presetName === 'STAIRS_FOCUS') {
      targetPos.set(-42, 24, 32);
      targetLook.set(-28, 16, 0);
    } else if (presetName === 'ATRIUM') {
      targetPos.set(0, 5.0, 16);
      targetLook.set(0, 3.5, 0);
    } else if (presetName.startsWith('FLOOR_')) {
      const fl = parseInt(presetName.replace('FLOOR_', ''), 10) || 1;
      const baseY = (fl - 1) * this.building.floorHeight;
      targetPos.set(32, baseY + 14, 36);
      targetLook.set(0, baseY + 1.5, 0);
    } else if (presetName === 'ROOM_FOCUS' && targetRoomId) {
      const room = this.building.roomsData.find(r => r.id === targetRoomId);
      if (room) {
        targetPos.set(room.camPos.x, room.camPos.y + 5, room.camPos.z);
        targetLook.set(room.center.x, room.center.y + 1, room.center.z);
      }
    } else {
      targetPos.set(58, 65, 75);
      targetLook.set(0, 19, 0);
    }

    if (!animate) {
      this.camera.position.copy(targetPos);
      this.controls.target.copy(targetLook);
      this.controls.update();
      this.cameraTransition = null;
    } else {
      this.cameraTransition = {
        startPos: this.camera.position.clone(),
        endPos: targetPos,
        startTarget: this.controls.target.clone(),
        endTarget: targetLook,
        duration: 0.85,
        elapsed: 0
      };
    }
  }

  setBimLayer(layerName, isVisible) {
    if (layerName === 'structure') {
      if (this.building) {
        if (this.building.cornerMesh) {
          this.building.cornerMesh.visible = isVisible && (this.building.floorMode === 'ALL');
        }
        for (let f = 1; f <= this.building.totalFloors; f++) {
          const group = this.building.floorGroups[f];
          if (group) {
            group.children.forEach(ch => {
              if (ch.userData && ch.userData.architecturalLayer === 'STRUCTURE') {
                ch.visible = isVisible;
              }
            });
          }
        }
      }
    } else if (layerName === 'fireSafety') {
      if (this.fireSystem && this.fireSystem.group) {
        this.fireSystem.group.visible = isVisible;
      }
      this.fireSystem?.activeFires?.forEach(fire => {
        if (fire.group) fire.group.visible = isVisible;
      });
      if (this.hazardVisualizer) {
        this.hazardVisualizer.setVisible(isVisible);
      }
      if (this.exitCongestionVisualizer) {
        this.exitCongestionVisualizer.setVisible(isVisible);
      }
      if (this.building && this.building.layers && this.building.layers.mep) {
        this.building.layers.mep.visible = isVisible;
      }
    } else if (layerName === 'occupants') {
      if (this.agentCrowd && this.agentCrowd.group) {
        this.agentCrowd.group.visible = isVisible;
      }
    }
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
    if (this.hazardVisualizer) {
      this.hazardVisualizer.setFloorMode(mode);
    }
    if (this.exitCongestionVisualizer) {
      this.exitCongestionVisualizer.setFloorMode(mode);
    }

    if (mode === 'EXPLODED') {
      this.setCameraPreset('AXONOMETRIC');
    }
  }

  syncOccupants(rooms) {
    this.agentCrowd.spawnAgentsForRooms(rooms);
  }

  setRoutingHazardContext(context) {
    this.routingHazardContext = context || null;
  }

  clearRoutingHazardContext() {
    this.routingHazardContext = null;
  }

  // Phase 5C: Hazard state management
  resolveBuildingScenario(scenario) {
    if (!scenario) return null;
    if (Array.isArray(scenario.fires) && scenario.fires.length > 0) return scenario;

    const roomId = scenario.hazard?.roomId;
    const match = typeof roomId === 'string' ? roomId.match(/^f(\d+)_/) : null;
    if (!match) return null;

    return {
      schemaVersion: 1,
      id: scenario.id || 'ai-scenario',
      name: scenario.name || scenario.id || 'AI Scenario',
      fires: [{
        id: `fire_${roomId}`,
        zoneId: `L${match[1]}`,
        startSec: 0,
        intensity: 0.6
      }]
    };
  }

  initializeHazardState(scenario) {
    if (!this.buildingGraph) return;
    this.activeScenario = scenario;
    const buildingScenario = this.resolveBuildingScenario(scenario);
    this.hazardState = buildingScenario
      ? applyScenario(this.buildingGraph, buildingScenario)
      : createHazardState(this.buildingGraph, { scenarioId: scenario?.id });
    this.riskAssessment = assessRisk(this.hazardState, this.buildingGraph);
    this.updateRoutingContext();
    this.applyHazardStateToGrid();
    this.syncHazardVisualization();
  }

  advanceHazardState(dt) {
    if (!this.hazardState || !this.buildingGraph) return;
    this.hazardState = advanceHazardState(this.hazardState, this.buildingGraph, dt);
    this.riskAssessment = assessRisk(this.hazardState, this.buildingGraph);
    this.updateRoutingContext();
    this.applyHazardStateToGrid();
    this.syncHazardVisualization();
  }

  syncHazardVisualization() {
    if (!this.hazardVisualizer) return;
    this.hazardVisualizer.update({
      graph: this.buildingGraph,
      hazardState: this.hazardState,
      riskAssessment: this.riskAssessment,
      routingContext: this.routingHazardContext
    });
  }

  applyHazardStateToGrid() {
    if (!this.hazardState || !this.buildingGraph || !this._zoneToGridMapper) return;

    // Clear previous dynamic hazards but preserve static walls
    this._zoneToGridMapper.clearAllDynamicHazards();

    // Apply current hazard state to grid
    applyHazardStateToGrid(this._zoneToGridMapper, this.hazardState, this.buildingGraph);
  }

  updateRoutingContext() {
    if (!this.hazardState || !this.buildingGraph) return;
    const context = buildRoutingHazardContext({
      graph: this.buildingGraph,
      hazardState: this.hazardState,
      riskAssessment: this.riskAssessment,
      expectedTimeSec: this.elapsedSeconds
    });
    this.routingHazardContext = context;
  }

  /**
   * Apply route assignments and record an aggregated reroute event only when an
   * agent's assigned exit actually changes. Routine refreshes that keep the same
   * exit are ignored so the incident log is not flooded.
   */
  _applyAssignments(assignments, {
    reason = 'Route reevaluation',
    reasons = [],
    severity = 'Info',
    isInitial = false
  } = {}) {
    if (!assignments || assignments.length === 0) return [];

    const previousExits = isInitial ? null : captureExitSnapshot(this.agentCrowd.agents);
    this.agentCrowd.assignRoutes(assignments);

    if (!previousExits) return [];

    const changes = diffExitAssignments(previousExits, assignments);
    if (changes.length === 0) return [];

    // ponytail: 1s wall-clock throttle drops a second distinct reroute within 1s;
    // switch to per-reason debounce if event fidelity matters.
    const nowMs = Date.now();
    if (nowMs - this._lastRerouteAt < 1000) {
      return changes;
    }

    const event = createRerouteEvent({
      changes,
      reason,
      reasons,
      severity,
      exits: this.crowdOptimizer?.exits || [],
      elapsedSeconds: this.elapsedSeconds,
      now: new Date(nowMs),
      id: `reroute_${nowMs}_${this.rerouteEventSeq++}`
    });

    if (event) {
      this._lastRerouteAt = nowMs;
      this.pendingRerouteEvents.push(event);
      this._lastStatsUpdate = 0;
    }

    return changes;
  }

  // Phase 5C: Check for urgent reevaluation - returns true if routes were updated
  checkUrgentReevaluation() {
    if (!this.isSimulating || !this.hazardState || !this.routingHazardContext?.availability?.available) {
      return false;
    }

    // Get current fire locations
    const fireLocations = [];
    this.fireSystem.activeFires.forEach(f => {
      fireLocations.push(f.basePos);
    });

    // Get current assignments from agent crowd
    const currentAssignments = this.agentCrowd.agents
      .filter(a => a.state !== 'SAFE') // Skip completed agents
      .map(a => {
        const assignment = this.agentCrowd.assignments?.get?.(a.id) || a.currentAssignment;
        // Find the assignment by looking at agent's current route
        return {
          agentId: a.id,
          exitId: a.currentExitId,
          routeCondition: a.currentRouteCondition,
          currentWaypointIdx: a.currentWaypointIdx || 0,
          pathLength: a.path?.length || 0
        };
      });

    // Check if any active agent's current route has become prohibited
    let hasUrgentChange = false;
    let prohibitedReasons = [];
    for (const agent of this.agentCrowd.agents) {
      if (agent.state === 'SAFE') continue;
      const currentExitId = agent.currentExitId;
      if (!currentExitId) continue;

      // Get the route condition for this agent's current exit
      const route = getExitRouteCondition(this.routingHazardContext, agent.floor, currentExitId);
      if (route && route.condition === ROUTE_CONDITIONS.PROHIBITED) {
        hasUrgentChange = true;
        prohibitedReasons = route.reasons || [];
        break;
      }
    }

    if (hasUrgentChange) {
      // Get current fire locations
      const fireLocations = [];
      this.fireSystem.activeFires.forEach(f => {
        fireLocations.push(f.basePos);
      });

      // Reevaluate with current assignments to preserve progress
      const optimizationResult = this.crowdOptimizer.reevaluateRoutes(
        this.agentCrowd.agents,
        this.agentCrowd.agents.map(a => ({
          agentId: a.id,
          exitId: a.currentExitId,
          routeCondition: a.currentRouteCondition,
          path: a.path,
          currentWaypointIdx: a.currentWaypointIdx
        })),
        fireLocations,
        { routingContext: this.routingHazardContext }
      );

      this._applyAssignments(optimizationResult.assignments, {
        reason: 'Current route prohibited',
        reasons: prohibitedReasons,
        severity: 'Medium'
      });
      // Update grid with latest hazard state after urgent reevaluation
      this.applyHazardStateToGrid();
      return true;
    }

    return false;
  }

  // Phase 5C: Route reevaluation - returns true if routes were updated
  reevaluateRoutes() {
    if (!this.isSimulating || !this.hazardState || !this.routingHazardContext?.availability?.available) {
      return false;
    }

    // Check if routing context has materially changed
    const contextHash = JSON.stringify({
      status: this.routingHazardContext.status,
      routes: Object.fromEntries(
        Object.entries(this.routingHazardContext.routes).map(([k, v]) => [k, v.condition])
      )
    });

    if (this.lastRoutingContextHash === contextHash) {
      return false; // No material change
    }

    this.lastRoutingContextHash = contextHash;

    // Get current fire locations from fire system
    const fireLocations = [];
    this.fireSystem.activeFires.forEach(f => {
      fireLocations.push(f.basePos);
    });

    // Reevaluate routes with current agent positions and evacuation state
    const optimizationResult = this.crowdOptimizer.optimizeRoutes(
      this.agentCrowd.agents,
      fireLocations,
      { routingContext: this.routingHazardContext, strategyType: this.activeStrategyType }
    );

    this._applyAssignments(optimizationResult.assignments, {
      reason: 'Routine route reevaluation',
      severity: 'Info'
    });
    // Update grid with latest hazard state after reevaluation
    this.applyHazardStateToGrid();
    return true;
  }

  // Phase 5C: Set active scenario for hazard state initialization
  setActiveScenario(scenario) {
    this.activeScenario = scenario;
  }

  triggerFire(roomId) {
    const room = this.building.roomsData.find(r => r.id === roomId);
    if (!room) return;

    const fireY = (room.center.y || 0) + 0.2;
    // Spawn visual fire particles with room reference for proper positioning
    this.fireSystem.spawnFire(roomId, { x: room.center.x, y: fireY, z: room.center.z }, room);

    // Inject interactive fire source into hazard state with room center for grid radius
    const injectOptions = {
      originRoomCenterX: room.center.x,
      originRoomCenterZ: room.center.z,
      roomSpreadSec: 30 // 30 seconds to spread from room to full floor
    };

    if (this.hazardState && this.buildingGraph) {
      this.hazardState = injectFireSource(this.hazardState, roomId, 0.6, injectOptions);
      this.riskAssessment = assessRisk(this.hazardState, this.buildingGraph);
      this.updateRoutingContext();
      this.applyHazardStateToGrid();
    } else if (this.activeScenario && !this.hazardState) {
      // Initialize hazard state from scenario first, then inject
      this.initializeHazardState(this.activeScenario);
      this.hazardState = injectFireSource(this.hazardState, roomId, 0.6, injectOptions);
      this.riskAssessment = assessRisk(this.hazardState, this.buildingGraph);
      this.updateRoutingContext();
      this.applyHazardStateToGrid();
    }

    this.syncHazardVisualization();

    // Automatically trigger Emergency Support Vehicles to the nearest exit gate
    if (this.emergencyManager) {
      const activeFires = [];
      if (this.fireSystem && this.fireSystem.activeFires) {
        this.fireSystem.activeFires.forEach((f, rId) => {
          if (f.basePos) activeFires.push({ ...f.basePos, roomId: rId, floor: f.floor });
        });
      }
      if (activeFires.length === 0) {
        activeFires.push({ x: room.center.x, y: fireY, z: room.center.z, roomId, floor: room.floor });
      }
      this.emergencyManager.dispatch(null, activeFires);
    }

    if (this.isSimulating) {
      const fireLocations = [];
      this.fireSystem.activeFires.forEach((f, rId) => {
        if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
      });
      const activeScenario = typeof AIEngine !== 'undefined' ? AIEngine.getActiveScenario() : null;
      const blockedExitIds = activeScenario?.structuralFailures?.blockedExits || [];
      const floorBlockedMap = activeScenario?.structuralFailures?.floorBlockedExits || null;
      const activeStrategy = typeof AIEngine !== 'undefined' ? AIEngine.getActiveStrategy() : null;
      const strategyType = activeStrategy?.type || 'LOAD_BALANCED';
      const optimizationResult = this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations, blockedExitIds, strategyType, floorBlockedMap);
      this._applyAssignments(optimizationResult.assignments, {
        reason: 'Fire update re-optimization',
        severity: 'Medium'
      });
      if (this.renderRouteOverlays) this.renderRouteOverlays(optimizationResult.assignments);
      if (this.updateExitHoloBadges) this.updateExitHoloBadges(optimizationResult.exitStats);
    }
  }

  blockStairwell(coreName, floorNum = null) {
    if (this.scenarioEngine && this.scenarioEngine.blockStairwellCore) {
      this.scenarioEngine.blockStairwellCore(coreName, floorNum);
    }

    // If currently simulating, recalculate paths dynamically!
    if (this.isSimulating) {
      const fireLocations = [];
      if (this.fireSystem && this.fireSystem.activeFires) {
        this.fireSystem.activeFires.forEach((f, rId) => {
          if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
        });
      }
      const activeScenario = typeof AIEngine !== 'undefined' ? AIEngine.getActiveScenario() : null;
      const blockedExitIds = activeScenario?.structuralFailures?.blockedExits || [];
      const floorBlockedMap = activeScenario?.structuralFailures?.floorBlockedExits || null;
      const activeStrategy = typeof AIEngine !== 'undefined' ? AIEngine.getActiveStrategy() : null;
      const strategyType = activeStrategy?.type || 'LOAD_BALANCED';

      const newPlan = this.crowdOptimizer
        ? this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations, blockedExitIds, strategyType, floorBlockedMap)
        : (this.routeOptimizer ? this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents, blockedExitIds, floorBlockedMap || {}) : null);

      if (newPlan && newPlan.assignments) {
        if (this.agentCrowd.rerouteAgents) {
          this.agentCrowd.rerouteAgents(newPlan.assignments);
        } else {
          this._applyAssignments(newPlan.assignments, {
            reason: 'Stairwell availability change',
            severity: 'Info'
          });
        }
        if (this.renderRouteOverlays) this.renderRouteOverlays(newPlan.assignments);
        if (this.updateExitHoloBadges) this.updateExitHoloBadges(newPlan.exitStats);
      }
      return newPlan;
    }
    return null;
  }

  renderRouteOverlays() {
    if (this.agentCrowd && this.agentCrowd.syncRouteLines) {
      this.agentCrowd.syncRouteLines();
    }
  }

  startEvacuation(scenario = null, strategy = null) {
    this.isSimulating = true;
    this.elapsedSeconds = 0;
    this.pausedElapsedSeconds = 0;
    this.lastRoutingContextHash = null;
    this.reevaluationCooldown = 0;
    this.pendingRerouteEvents = [];
    this._lastRerouteAt = 0;

    // Start the clock
    if (!this._clock.running) {
      this._clock.start();
    }

    // Phase 5C: Initialize hazard state from active scenario if not already initialized
    if (!this.hazardState && this.activeScenario) {
      this.initializeHazardState(this.activeScenario);
    }

    const fireLocations = [];
    if (this.fireSystem && this.fireSystem.activeFires) {
      this.fireSystem.activeFires.forEach((f, rId) => {
        if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
      });
    }

    const activeScenario = scenario || (typeof AIEngine !== 'undefined' ? AIEngine.getActiveScenario() : null);
    const blockedExitIds = activeScenario?.structuralFailures?.blockedExits || [];
    const floorBlockedMap = activeScenario?.structuralFailures?.floorBlockedExits || null;
    const activeStrategy = strategy || (typeof AIEngine !== 'undefined' ? AIEngine.getActiveStrategy() : null);
    const strategyType = activeStrategy?.type || 'LOAD_BALANCED';
    this.activeStrategyType = strategyType;
    this.activeStrategy = activeStrategy || null;

    let optimizationResult;
    if (this.crowdOptimizer) {
      optimizationResult = this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations, blockedExitIds, strategyType, floorBlockedMap);
    } else if (this.routeOptimizer) {
      optimizationResult = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents, blockedExitIds, floorBlockedMap || {});
    }

    if (optimizationResult && optimizationResult.assignments) {
      this._applyAssignments(optimizationResult.assignments, { isInitial: true });
      if (this.renderRouteOverlays) this.renderRouteOverlays(optimizationResult.assignments);
      if (this.updateExitHoloBadges) this.updateExitHoloBadges(optimizationResult.exitStats);
    }

    if (this.emergencyManager && !this.emergencyManager.isActive) {
      this.emergencyManager.dispatch(null, fireLocations);
    }

    return optimizationResult;
  }

  pauseSimulation() {
    this.isSimulating = false;
    if (this._clock.running) {
      this._clock.stop();
    }
  }

  resumeSimulation() {
    if (!this._clock.running) {
      this._clock.start();
    }
    this.isSimulating = true;
  }

  reset(rooms = null) {
    this.isSimulating = false;
    this.elapsedSeconds = 0;
    this._lastStatsUpdate = 0;
    this._lastEvacuated = -1;
    this._lastElapsedSec = -1;
    this.activeStrategyType = 'LOAD_BALANCED';
    this.activeStrategy = null;
    this.pendingRerouteEvents = [];
    this.rerouteEventSeq = 0;
    this._lastRerouteAt = 0;
    this.fireSystem.extinguishAll();
    this.navGrid.resetDynamicHazards();
    this.navGrid.clearCongestion();
    // Reset live congestion tracking
    if (this.navigationGraph) {
      this.navigationGraph.resetAllHazards();
    }
    this.routingHazardContext = null;
    // Phase 5C: Clear hazard state but preserve activeScenario for restart
    this.hazardState = null;
    this.riskAssessment = null;
    this.lastRoutingContextHash = null;
    this.reevaluationCooldown = 0;
    this._clock.reset();
    // Phase 5D: Clear zone-to-grid mapper
    if (this._zoneToGridMapper) {
      this._zoneToGridMapper.clearAllDynamicHazards();
    }
    if (this.hazardVisualizer) {
      this.hazardVisualizer.clear();
    }
    if (this.exitCongestionVisualizer) {
      this.exitCongestionVisualizer.clear();
    }
    // Clear phased evacuation delays
    if (this.agentCrowd) {
      this.agentCrowd.clearPhasedDelays();
    }
    const targetRooms = rooms || (this.building ? this.building.roomsData : []);
    this.agentCrowd.spawnAgentsForRooms(targetRooms);
    if (this.emergencyManager) {
      this.emergencyManager.reset();
    }
  }

  animate = () => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Get delta from simulation clock (returns 0 when stopped, handles pause/resume correctly)
    const delta = Math.min(this._clock.getDelta(), 0.1);

    // Smooth Camera Transition Interpolation
    if (this.cameraTransition) {
      const ct = this.cameraTransition;
      ct.elapsed += delta;
      const progress = Math.min(1.0, ct.elapsed / ct.duration);

      // Smoothstep Cubic Easing
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(ct.startPos, ct.endPos, ease);
      this.controls.target.lerpVectors(ct.startTarget, ct.endTarget, ease);

      if (progress >= 1.0) {
        this.camera.position.copy(ct.endPos);
        this.controls.target.copy(ct.endTarget);
        this.cameraTransition = null;
      }
    }

    this.updateCameraNavigation(delta);

    if (this.controls) {
      this.controls.update();
    }

    if (this.fireSystem) {
      this.fireSystem.update(delta, this.camera);
    }

    if (this.building && this.building.update) {
      this.building.update(delta);
    }

    if (this.emergencyManager) {
      const speed = this.isSimulating ? (this.simSpeed || 1.0) : 1.0;
      this.emergencyManager.update(delta, speed);
    }

    if (this.agentCrowd) {
      // Calculate simulation delta
      const simDelta = this.isSimulating ? delta * this.simSpeed : 0;

      // Phase 5C: Advance hazard state and update routing context BEFORE agent movement
      if (this.isSimulating && this.hazardState && this.buildingGraph) {
        // 1. Advance simulation time
        this.elapsedSeconds += simDelta;

        // 2. Advance hazard propagation (includes updateRoutingContext + applyHazardStateToGrid)
        this.advanceHazardState(simDelta);
        this.reevaluationCooldown -= simDelta;

        // 3. Check for urgent reevaluation (newly prohibited current routes)
        const urgentReeval = this.checkUrgentReevaluation();
        if (urgentReeval) {
          this.reevaluationCooldown = this.minReevaluationInterval;
        } else if (this.reevaluationCooldown <= 0 && this.routingHazardContext?.availability?.available) {
          // 4. Regular cooldown-based reevaluation (includes applyHazardStateToGrid)
          this.reevaluateRoutes();
        }
      }

      // 6. Update agents with current valid routes (after hazard/routing updates)
      const stats = this.agentCrowd.update(delta, this.isSimulating ? this.simSpeed : 0);

      // Update live edge occupancy from agent positions (for congestion-aware routing)
      if (this.navigationGraph && this.isSimulating) {
        this.navigationGraph.updateLiveOccupancy(this.agentCrowd.agents);
      }

      // Update live grid congestion from agent positions (for pathfinding)
      if (this.navGrid && this.isSimulating) {
        this.navGrid.updateAgentCongestion(this.agentCrowd.agents);
      }

      if (this.exitCongestionVisualizer) {
        this.exitCongestionVisualizer.update({
          exits: this.crowdOptimizer.exits,
          agents: this.agentCrowd.agents,
          navigationGraph: this.navigationGraph
        });
      }

      if (this.isSimulating) {
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

          let waiting = 0;
          let evacuating = 0;
          for (const agent of this.agentCrowd.agents) {
            if (agent.state === 'WAITING') waiting++;
            else if (agent.state === 'EVACUATING') evacuating++;
          }

          this.onStatsUpdate({
            ...stats,
            waiting,
            evacuating,
            strategy: resolveStrategyInfo(this.activeStrategyType, this.activeStrategy),
            rerouteEvents: this.pendingRerouteEvents.splice(0),
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

  getEmergencyStatus() {
    return this.emergencyManager ? this.emergencyManager.getStatus() : null;
  }

  dispatchEmergency(targetGateId = null) {
    if (this.emergencyManager) {
      const fireLocations = [];
      if (this.fireSystem && this.fireSystem.activeFires) {
        this.fireSystem.activeFires.forEach((f, rId) => {
          if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
        });
      }
      this.emergencyManager.dispatch(targetGateId, fireLocations);
    }
  }

  toggleEmergencySiren() {
    return this.emergencyManager ? this.emergencyManager.toggleSirenAudio() : false;
  }

  toggleEmergencySpray() {
    return this.emergencyManager ? this.emergencyManager.toggleSpray() : false;
  }

  focusEmergencyStaging() {
    this.setCameraPreset('EMERGENCY_FOCUS');
  }

  dispose() {
    this.isDisposed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    if (this.agentCrowd) {
      this.agentCrowd.dispose();
    }
    if (this.campusSite) {
      this.campusSite.dispose();
    }
    if (this.emergencyManager) {
      this.emergencyManager.dispose();
    }
    if (this.hazardVisualizer) {
      this.hazardVisualizer.dispose();
    }
    if (this.exitCongestionVisualizer) {
      this.exitCongestionVisualizer.dispose();
    }
    if (this.renderer && this.renderer.domElement && this.container && this.container.contains(this.renderer.domElement)) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
