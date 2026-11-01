import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Building3D } from './Building3D.js';
import { CampusSite } from './site/CampusSite.js';
import { FireParticles } from './FireParticles.js';
import { AgentCrowd } from './AgentCrowd.js';
import { NavGrid } from '../simulation/NavGrid.js';
import { Pathfinder } from '../simulation/Pathfinder.js';
import { CrowdOptimizer } from '../simulation/CrowdOptimizer.js';
import { EmergencyVehiclesManager } from './EmergencyVehiclesManager.js';
import { NavigationGraph } from '../simulation/NavigationGraph.js';
import { RouteOptimizationEngine } from '../simulation/RouteOptimizationEngine.js';

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
    this.evacuationCompleted = false;
    this.elapsedSeconds = 0;
    this.clock = new THREE.Clock();

    this._lastStatsUpdate = 0;
    this._lastEvacuated = -1;
    this._lastElapsedSec = -1;

    this.cameraTransition = null;

    // ═══ MULTI-HAZARD SIMULATION STATE ═══
    // Centralized state for the Interactive Multi-Hazard Toggle Matrix:
    // fire (FireParticles), power grid failure (lighting), HVAC
    // pressurization failure (smoke/exposure) and structural collapse
    // (procedural rubble + floor-aware navigation blocks).
    this.lighting = null; // refs to the real light objects (set in initScene)
    this.powerFailureState = { active: false, original: null };
    this.emergencyLightGroup = null; // cached emissive fixtures + exit signs
    this.emergencyPulseLights = []; // pooled real point lights (fixed cost)
    this.emergencyLightTimer = 0;
    this.hvacFailureActive = false;
    this.hvacFailureFloors = new Set(); // localized HVAC failure affected floors
    this.structuralCollapseState = { active: false };
    this.manualStructuralCollapse = null; // primary zone (backward compat)
    this.structuralCollapseZones = []; // localized collapse zones (multi)
    this.structuralRubbleGroups = new Map(); // zoneId -> rubble group
    this.powerFailureZones = []; // localized power failure zones
    this.structuralRubbleGroup = null; // procedural rubble cache (built once, reused)
    this.reroutedAgentCount = 0; // reroutes attributed to the collapse
    this.smokeTelemetry = { avgRate: 0, cumulativeRate: 0, agentsExposed: 0, multiplier: 1.0 };
    this._smokeTelemetryTimer = 0;

    // Camera target bounds (prevents lost camera panning to infinite void)
    this.campusCenter = new THREE.Vector3(0, 10, 18);
    this.targetBounds = {
      minX: -320,
      maxX: 320,
      minZ: -250,
      maxZ: 250,
      minY: 0.5,
      maxY: 45
    };

    this.initScene();
    this.initSystems();
    this.initRaycaster();
    this.initKeyboardControls();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('twinguard_theme')) || 'dark';
    const initialSky = initialTheme === 'dark' ? 0x081020 : 0xeaf0f8;
    this.scene.background = new THREE.Color(initialSky);
    this.scene.fog = new THREE.FogExp2(initialSky, 0.00032);

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
    this.controls.maxPolarAngle = Math.PI * 0.46; // Keep view above ground level
    this.controls.screenSpacePanning = true; // Natural screen-space panning across campus
    this.controls.minDistance = 12.0; // Prevent clipping through roofs or floors
    this.controls.maxDistance = 420; // Sensible maximum zoom-out preventing lost context

    // Set initial orbit target to spatial central campus area
    this.controls.target.set(0, 10, 18);

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

    // Keep live references so the power-grid failure hazard can dim and
    // restore the EXACT original lighting objects (never replacing them)
    this.lighting = { ambientLight, sunLight, fillLight, westStairFill, eastStairFill, hemiLight };

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
    this.building.group.name = 'HeroBuilding';
    this.campusSite = new CampusSite(this.scene);
    this.campusSite.sceneManager = this;
    this.spatialModel = this.campusSite?.spatialModel || null;

    // Authoritative 10-Storey Topological Navigation Graph & Optimization Engine
    this.navigationGraph = new NavigationGraph(10, 3.8);
    this.routeOptimizationEngine = new RouteOptimizationEngine(this.navigationGraph);

    if (this.spatialModel) {
      this.spatialModel.extendNavigationGraph(this.navigationGraph);
      this.spatialModel.resolveGeometryReferences(this.campusSite);
    }

    if (typeof window !== 'undefined') {
      window.__campusSpatialModel = this.spatialModel;
      window.__sceneManager = this;
      window.__navigationGraph = this.navigationGraph;
      window.__routeOptimizationEngine = this.routeOptimizationEngine;
    }

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

    // 1. Direct mesh raycast against stairsGroup (catches stair clicks from any 3D angle)
    if (this.building.stairsGroup) {
      const stairHits = this.raycaster.intersectObjects(this.building.stairsGroup.children, true);
      if (stairHits && stairHits.length > 0) {
        const hit = stairHits[0];
        const floorH = this.building.floorHeight || 3.8;
        const hitY = hit.point ? hit.point.y : 0;
        const fl = Math.max(1, Math.min(10, Math.floor(hitY / floorH) + 1));
        const isWest = (hit.point ? hit.point.x : 0) < 0;
        const zone = isWest ? 'west' : 'east';
        const zoneLabel = isWest ? 'West' : 'East';
        const coreLabel = isWest ? 'Core A' : 'Core B';
        const stairX = isWest ? -28 : 28;
        return {
          id: `stair_f${fl}_${zone}`,
          category: 'STAIR',
          floor: fl,
          name: `Staircase ${coreLabel} (${zoneLabel}) — Floor ${fl}`,
          shortName: `Staircase ${coreLabel}`,
          type: 'Stairwell Core',
          zone: zoneLabel,
          capacity: 45,
          current: 0,
          center: { x: stairX, y: (fl - 1) * floorH, z: 0 },
          bounds: { minX: stairX - 5.5, maxX: stairX + 5.5, minZ: -5.5, maxZ: 5.5 }
        };
      }
    }

    // 2. Floor plane intersection (evaluates stairwells, rooms, corridor, and ground exits)
    const activeMode = this.building.floorMode;
    const floorLevels = (activeMode === 'ALL' || activeMode === 'EXPLODED')
      ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
      : [parseInt(activeMode, 10) || 1];

    for (const fl of floorLevels) {
      const floorH = this.building.floorHeight || 3.8;
      const floorY = (fl - 1) * floorH;
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
      const intersection = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(plane, intersection)) {
        if (Math.abs(intersection.x) <= 35 && Math.abs(intersection.z) <= 26) {
          // A. Stairwell Core A (West)
          if (intersection.x <= -22.5 && intersection.x >= -34.5 && Math.abs(intersection.z) <= 6.5) {
            return {
              id: `stair_f${fl}_west`,
              category: 'STAIR',
              floor: fl,
              name: `Staircase Core A (West) — Floor ${fl}`,
              shortName: `Staircase Core A`,
              type: 'Stairwell Core',
              zone: 'West',
              capacity: 45,
              current: 0,
              center: { x: -28, y: floorY, z: 0 },
              bounds: { minX: -33.5, maxX: -22.5, minZ: -5.5, maxZ: 5.5 }
            };
          }

          // B. Stairwell Core B (East)
          if (intersection.x >= 22.5 && intersection.x <= 34.5 && Math.abs(intersection.z) <= 6.5) {
            return {
              id: `stair_f${fl}_east`,
              category: 'STAIR',
              floor: fl,
              name: `Staircase Core B (East) — Floor ${fl}`,
              shortName: `Staircase Core B`,
              type: 'Stairwell Core',
              zone: 'East',
              capacity: 45,
              current: 0,
              center: { x: 28, y: floorY, z: 0 },
              bounds: { minX: 22.5, maxX: 33.5, minZ: -5.5, maxZ: 5.5 }
            };
          }

          // C. Longitudinal Central Corridor (Checked first for |z| <= 2.4 so corridor clicks aren't intercepted by room margins)
          if (Math.abs(intersection.z) <= 2.4 && intersection.x >= -25.5 && intersection.x <= 25.5) {
            const isWest = intersection.x < 0;
            const zone = isWest ? 'west' : 'east';
            const zoneLabel = isWest ? 'West' : 'East';
            return {
              id: `corr_f${fl}_${zone}`,
              category: 'CORRIDOR',
              floor: fl,
              name: `${zoneLabel} Corridor — Floor ${fl}`,
              shortName: `${zoneLabel} Corridor`,
              type: 'Corridor Segment',
              zone: zoneLabel,
              capacity: 40,
              current: 0,
              center: { x: isWest ? -12.5 : 12.5, y: floorY, z: 0 },
              bounds: { minX: isWest ? -25 : 0, maxX: isWest ? 0 : 25, minZ: -2.0, maxZ: 2.0 }
            };
          }

          // D. Rooms on this floor
          const roomOnThisFloor = this.building.roomsData?.find((room) => {
            if (room.floor !== fl) return false;
            const b = room.bounds;
            return (
              intersection.x >= b.minX - 0.5 &&
              intersection.x <= b.maxX + 0.5 &&
              intersection.z >= b.minZ - 0.5 &&
              intersection.z <= b.maxZ + 0.5
            );
          });
          if (roomOnThisFloor) {
            return {
              ...roomOnThisFloor,
              category: 'ROOM',
              shortName: roomOnThisFloor.name || `Room ${roomOnThisFloor.roomNumber || roomOnThisFloor.id}`
            };
          }

          // E. Ground Exits
          if (fl === 1) {
            if (intersection.x <= -26.0 && Math.abs(intersection.z) <= 5.0) {
              return { id: 'exit_west', category: 'EXIT', floor: 1, name: 'Ground Exit A (West Ring Road)', shortName: 'West Exit A' };
            }
            if (intersection.x >= 26.0 && Math.abs(intersection.z) <= 5.0) {
              return { id: 'exit_east', category: 'EXIT', floor: 1, name: 'Ground Exit B (East Service Gate)', shortName: 'East Exit B' };
            }
            if (Math.abs(intersection.x) <= 6.0 && intersection.z >= 18.0) {
              return { id: 'exit_south', category: 'EXIT', floor: 1, name: 'Ground Exit C (South Grand Plaza)', shortName: 'South Exit C' };
            }
          }
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
          if (matchedRoom && this.onRoomSelect) {
            this.onRoomSelect(matchedRoom);
          }
        }, 260);
      }
    });

    this.container.addEventListener('dblclick', (e) => {
      if (singleTapTimeout) {
        clearTimeout(singleTapTimeout);
        singleTapTimeout = null;
      }
      // 1. First check if a room in the main building was targeted
      const matchedRoom = this.getRoomAtClientPos(e.clientX, e.clientY);
      if (matchedRoom && this.onRoomDoubleTap) {
        this.onRoomDoubleTap(matchedRoom, { screenX: e.clientX, screenY: e.clientY });
        return;
      }

      // 2. Otherwise raycast the broader campus environment (secondary buildings, site elements, lake, plazas)
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check campus site objects
      if (this.campusSite && this.campusSite.group) {
        const hits = this.raycaster.intersectObjects(this.campusSite.group.children, true);
        if (hits.length > 0) {
          const hit = hits[0];
          // Find if hitting a secondary building group
          let targetObj = hit.object;
          let foundBuilding = null;
          while (targetObj && targetObj !== this.campusSite.group) {
            if (targetObj.userData && (targetObj.userData.id?.startsWith('PLOT-') || targetObj.userData.name)) {
              foundBuilding = targetObj;
              break;
            }
            targetObj = targetObj.parent;
          }

          if (foundBuilding) {
            const box = new THREE.Box3().setFromObject(foundBuilding);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.z, 20);
            this.focusTarget(center, maxDim * 1.8, { minY: 12 });
            return;
          }

          // Otherwise focus hit point on site ground / road / plaza
          this.focusTarget(hit.point, 50, { minY: 10 });
          return;
        }
      }

      // 3. Fallback ground plane intersection
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const groundHit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(groundPlane, groundHit)) {
        if (Math.abs(groundHit.x) < 320 && Math.abs(groundHit.z) < 250) {
          this.focusTarget(groundHit, 55, { minY: 10 });
        }
      }
    });
  }

  // Focus and frame any world position or object bounding box smoothly
  focusTarget(position, distance = 60, options = {}) {
    if (!this.camera || !this.controls) return;

    const targetPos = new THREE.Vector3(position.x, position.y || 5, position.z);
    
    // Maintain current camera elevation angle and orientation relative to the target
    const currentOffset = this.camera.position.clone().sub(this.controls.target);
    const currentDist = currentOffset.length() || 60;
    const dir = currentOffset.normalize();

    // Use requested distance, clamped sensibly
    const finalDist = Math.max(18, Math.min(distance, 180));
    const newCamPos = targetPos.clone().add(dir.multiplyScalar(finalDist));

    // Ensure camera stays above ground
    if (newCamPos.y < (options.minY || 10)) {
      newCamPos.y = options.minY || 10;
    }

    if (options.animate === false) {
      this.controls.target.copy(targetPos);
      this.camera.position.copy(newCamPos);
      this.controls.update();
      this.cameraTransition = null;
    } else {
      this.cameraTransition = {
        startPos: this.camera.position.clone(),
        endPos: newCamPos,
        startTarget: this.controls.target.clone(),
        endTarget: targetPos,
        duration: options.duration || 0.75,
        elapsed: 0
      };
    }
  }

  // Smooth, Cinematic Camera Transition to any preset
  setCameraPreset(presetName, targetRoomId = null, animate = true) {
    if (!this.camera || !this.controls) return;

    let targetPos = new THREE.Vector3(3, 20, 68);
    let targetLook = new THREE.Vector3(0, 19, 0);

    if (presetName === 'CAMPUS_HERO' || presetName === 'HERO_VIEW') {
      // Elevated architectural hero perspective showing the 10-storey tower, forecourt & entrance circus
      // Balanced zoom showing the full building height, entrance canopy and surrounding campus context
      // Target is set to central campus spatial area (0, 10, 18), NOT pinned to building geometry center
      targetPos.set(52, 45, 125);
      targetLook.set(0, 10, 18);
    } else if (presetName === 'CAMPUS_OVERVIEW') {
      // High aerial isometric view showing complete master plan, road ring & surrounding clusters
      targetPos.set(0, 240, 275);
      targetLook.set(0, 5, 10);
    } else if (presetName === 'REGIONAL_OVERVIEW') {
      // Maximum zoom overview showing campus embedded in regional highway context
      targetPos.set(0, 360, 390);
      targetLook.set(0, 5, 0);
    } else if (presetName === 'CAMPUS_AERIAL') {
      // High-angle architectural perspective
      targetPos.set(0, 300, 25);
      targetLook.set(0, 0, 10);
    } else if (presetName === 'TOP_DOWN') {
      // True 90-degree orthogonal master plan inspection view showing all 12 zones & road ring
      targetPos.set(0, 310, 10);
      targetLook.set(0, 0, 10);
    } else if (presetName === 'CUTAWAY_VIEW') {
      targetPos.set(16, 22, 64);
      targetLook.set(0, 19, 0);
    } else if (presetName === 'FULL_BUILDING') {
      targetPos.set(68, 48, 75);
      targetLook.set(0, 18, 0);
    } else if (presetName === 'SOUTH_FACADE') {
      targetPos.set(0, 22, 75);
      targetLook.set(0, 18, 0);
    } else if (presetName === 'NORTH_FACADE') {
      targetPos.set(0, 22, -75);
      targetLook.set(0, 18, 0);
    } else if (presetName === 'EAST_FACADE') {
      targetPos.set(75, 22, 0);
      targetLook.set(0, 18, 0);
    } else if (presetName === 'WEST_FACADE') {
      targetPos.set(-75, 22, 0);
      targetLook.set(0, 18, 0);
    } else if (presetName === 'EAST_CAMPUS') {
      // Focus eastern technology & library quadrant
      targetPos.set(220, 60, 120);
      targetLook.set(210, 8, -20);
    } else if (presetName === 'WEST_CAMPUS') {
      // Focus western civic auditorium & sports complex
      targetPos.set(-220, 60, 120);
      targetLook.set(-210, 8, -10);
    } else if (presetName === 'NORTH_ACADEMIC') {
      // Focus northern academic cluster
      targetPos.set(0, 70, -60);
      targetLook.set(0, 8, -145);
    } else if (presetName === 'SOUTH_GATE') {
      // Focus southern arrival gateway & central lake
      targetPos.set(0, 45, 290);
      targetLook.set(0, 6, 210);
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
    } else if (presetName === 'EXPLODED_VIEW' || presetName === 'EXPLODED') {
      targetPos.set(90, 85, 95);
      targetLook.set(0, 42, 0);
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
    } else if (presetName === 'ELEVATORS' || presetName === 'ELEVATOR_FOCUS') {
      targetPos.set(16, 20, 26);
      targetLook.set(3.2, 16, -1.8);
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
      if (this.building && this.building.layers && this.building.layers.mep) {
        this.building.layers.mep.visible = isVisible;
      }
    } else if (layerName === 'occupants') {
      if (this.agentCrowd && this.agentCrowd.group) {
        this.agentCrowd.group.visible = isVisible;
      }
    }
  }

  setTheme(theme) {
    this.currentTheme = theme;
    const isDark = theme === 'dark';
    const skyColor = isDark ? 0x081020 : 0xeaf0f8;
    if (this.scene) {
      this.scene.background = new THREE.Color(skyColor);
      this.scene.fog = new THREE.FogExp2(skyColor, 0.00032);
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

    if (mode === 'EXPLODED') {
      this.setCameraPreset('EXPLODED_VIEW');
    } else if (mode === 'ALL') {
      this.setCameraPreset('HERO_VIEW');
    } else if (!isNaN(parseInt(mode, 10))) {
      this.setCameraPreset(`FLOOR_${mode}`);
    }
  }

  syncOccupants(rooms) {
    this.agentCrowd.spawnAgentsForRooms(rooms);
  }

  triggerFire(roomId) {
    let room = null;
    const seg = this.parseSegId(roomId);
    const floorH = this.building ? this.building.floorHeight : 3.8;

    if (seg && seg.kind === 'corr') {
      const b = this.getCorridorSegmentBounds(roomId);
      if (!b) return;
      room = {
        id: roomId,
        floor: seg.floor,
        category: 'CORRIDOR',
        center: { x: b.centerX, y: (seg.floor - 1) * floorH, z: 0 },
        bounds: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ },
        furnishingType: 'CORRIDOR'
      };
    } else if (seg && seg.kind === 'stair') {
      const b = this.getStairSegmentBounds(roomId);
      if (!b) return;
      room = {
        id: roomId,
        floor: seg.floor,
        category: 'STAIR',
        center: { x: b.centerX, y: (seg.floor - 1) * floorH, z: 0 },
        bounds: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ },
        furnishingType: 'STAIR'
      };
    } else {
      room = this.building?.roomsData?.find((r) => r.id === roomId);
      if (!room) return;
    }

    if (this.onFacadeModeChange) this.onFacadeModeChange('CUTAWAY');
    else if (this.building) this.building.facadeMode = 'CUTAWAY';

    const fireY = (room.center.y || 0) + 0.2;
    this.fireSystem.spawnFire(roomId, { x: room.center.x, y: fireY, z: room.center.z }, room);
    this.navGrid.setFireZone(room.center.x, room.center.z, 6.5);

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

    if (this.isSimulating && !this.evacuationCompleted) {
      const fireLocations = [];
      this.fireSystem.activeFires.forEach((f, rId) => {
        if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
      });
      const activeScenario = typeof AIEngine !== 'undefined' ? AIEngine.getActiveScenario() : null;
      const blockedExitIds = activeScenario?.structuralFailures?.blockedExits || [];
      const floorBlockedMap = activeScenario?.structuralFailures?.floorBlockedExits || null;
      const activeStrategy = typeof AIEngine !== 'undefined' ? AIEngine.getActiveStrategy() : null;
      const strategyType = activeStrategy?.type || 'LOAD_BALANCED';
      
      const unevacuatedAgents = this.agentCrowd.agents.filter(a => a.state !== 'SAFE' && !a.isEvacuated);
      if (unevacuatedAgents.length > 0) {
        const optimizationResult = this.crowdOptimizer.optimizeRoutes(unevacuatedAgents, fireLocations, blockedExitIds, strategyType, floorBlockedMap, (this.structuralCollapseZones.length ? this.structuralCollapseZones : this.manualStructuralCollapse));
        if (this.agentCrowd.rerouteAgents) {
          this.agentCrowd.rerouteAgents(optimizationResult.assignments);
        } else {
          this.agentCrowd.assignRoutes(optimizationResult.assignments);
        }
        this._countCollapseReroutes(optimizationResult.assignments);
        if (this.renderRouteOverlays) this.renderRouteOverlays(optimizationResult.assignments);
        if (this.updateExitHoloBadges) this.updateExitHoloBadges(optimizationResult.exitStats);
      }
    }
  }

  extinguishFire(roomId) {
    if (this.fireSystem) {
      this.fireSystem.extinguishFire(roomId);
    }
    if (this.navGrid) {
      const seg = this.parseSegId(roomId);
      const bounds = seg && seg.kind === 'corr' ? this.getCorridorSegmentBounds(roomId) : null;
      if (bounds) {
        for (let x = bounds.minX + 4; x <= bounds.maxX - 3; x += 8) {
          this.navGrid.clearFireZone(x, 0, 5);
        }
        // A corridor that is still BLOCKED must keep its hazard marking
        if (this.blockedCorridorSegments) {
          this.blockedCorridorSegments.forEach((id) => {
            const b = this.getCorridorSegmentBounds(id);
            if (!b) return;
            for (let x = b.minX + 4; x <= b.maxX - 3; x += 8) this.navGrid.setFireZone(x, 0, 5);
          });
        }
        this.reapplyActiveFireHazards();
      } else {
        const room = this.building?.roomsData?.find(r => r.id === roomId);
        if (room && this.navGrid.clearFireZone) {
          this.navGrid.clearFireZone(room.center.x, room.center.z);
        }
      }
    }
  }

  extinguishAll() {
    if (this.fireSystem) {
      this.fireSystem.extinguishAll();
    }
    if (this.navGrid) {
      this.navGrid.resetDynamicHazards();
      // Keep corridor blockage markings after the dynamic reset
      if (this.blockedCorridorSegments) {
        this.blockedCorridorSegments.forEach((id) => {
          const b = this.getCorridorSegmentBounds(id);
          if (!b) return;
          for (let x = b.minX + 4; x <= b.maxX - 3; x += 8) this.navGrid.setFireZone(x, 0, 5);
        });
      }
    }
  }

  highlightRoom(roomId) {
    if (!this.scene) return;
    if (!this.roomHighlightBox) {
      const box = new THREE.Box3();
      this.roomHighlightBox = new THREE.Box3Helper(box, 0x00f0ff);
      this.roomHighlightBox.visible = false;
      this.scene.add(this.roomHighlightBox);
    }
    if (!roomId) {
      this.roomHighlightBox.visible = false;
      return;
    }
    let b = null;
    let floor = 1;
    const seg = this.parseSegId(roomId);
    if (seg && seg.kind === 'corr') {
      b = this.getCorridorSegmentBounds(roomId);
      floor = seg.floor;
    } else if (seg && seg.kind === 'stair') {
      b = this.getStairSegmentBounds(roomId);
      floor = seg.floor;
    } else if (String(roomId).startsWith('exit_')) {
      const pos = this.getExitGatePosition(roomId);
      if (pos) {
        b = { minX: pos.x - 3.0, maxX: pos.x + 3.0, minZ: pos.z - 3.0, maxZ: pos.z + 3.0 };
        floor = 1;
      }
    } else {
      const room = this.building?.roomsData?.find((r) => r.id === roomId);
      if (room && room.bounds) {
        b = room.bounds;
        floor = room.floor;
      }
    }

    if (!b) {
      this.roomHighlightBox.visible = false;
      return;
    }
    const floorH = this.building ? this.building.floorHeight : 3.8;
    const baseY = (floor - 1) * floorH;
    this.roomHighlightBox.box.min.set(b.minX, baseY + 0.05, b.minZ);
    this.roomHighlightBox.box.max.set(b.maxX, baseY + floorH - 0.1, b.maxZ);
    this.roomHighlightBox.visible = true;
  }

  unblockStairwell(coreName, floorNum = null) {
    if (this.scenarioEngine && this.scenarioEngine.unblockStairwellCore) {
      this.scenarioEngine.unblockStairwellCore(coreName, floorNum);
    }
    if (this.isSimulating) {
      this.recalculateDynamicRoutes();
    }
  }

  blockCorridor(corridorId, floorNum = 1) {
    if (this.navGrid) {
      // Mark corridor segment blocked
      if (corridorId.includes('north')) {
        this.navGrid.setFireZone(0, -1.3, 12);
      } else if (corridorId.includes('south')) {
        this.navGrid.setFireZone(0, 1.3, 12);
      } else {
        this.navGrid.setFireZone(0, 0, 8);
      }
    }
    if (this.isSimulating) {
      this.recalculateDynamicRoutes();
    }
  }

  unblockCorridor(corridorId) {
    if (this.navGrid) {
      this.navGrid.resetDynamicHazards();
      // Re-apply any active fires
      if (this.fireSystem && this.fireSystem.activeFires) {
        this.fireSystem.activeFires.forEach((f) => {
          if (f.basePos) {
            this.navGrid.setFireZone(f.basePos.x, f.basePos.z, 6.5);
          }
        });
      }
    }
    if (this.isSimulating) {
      this.recalculateDynamicRoutes();
    }
  }

  blockStairwell(coreName, floorNum = null) {
    if (this.scenarioEngine && this.scenarioEngine.blockStairwellCore) {
      this.scenarioEngine.blockStairwellCore(coreName, floorNum);
    }

    // If currently simulating and not completed, recalculate paths dynamically!
    if (this.isSimulating && !this.evacuationCompleted) {
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

      const unevacuatedAgents = this.agentCrowd.agents.filter(a => a.state !== 'SAFE' && !a.isEvacuated);
      if (unevacuatedAgents.length > 0) {
        const newPlan = this.crowdOptimizer
          ? this.crowdOptimizer.optimizeRoutes(unevacuatedAgents, fireLocations, blockedExitIds, strategyType, floorBlockedMap, (this.structuralCollapseZones.length ? this.structuralCollapseZones : this.manualStructuralCollapse))
          : (this.routeOptimizer ? this.routeOptimizer.optimizeEvacuationRoutes(unevacuatedAgents, blockedExitIds, floorBlockedMap || {}) : null);

        if (newPlan && newPlan.assignments) {
          if (this.agentCrowd.rerouteAgents) {
            this.agentCrowd.rerouteAgents(newPlan.assignments);
          } else {
            this.agentCrowd.assignRoutes(newPlan.assignments);
          }
          this._countCollapseReroutes(newPlan.assignments);
          if (this.renderRouteOverlays) this.renderRouteOverlays(newPlan.assignments);
          if (this.updateExitHoloBadges) this.updateExitHoloBadges(newPlan.exitStats);
        }
        return newPlan;
      }
    }
    return null;
  }

  // ============================================================================
  // COMMAND CENTER: shared route re-plan (scenario blocks + manual exit blocks)
  // ============================================================================
  recalculateDynamicRoutes() {
    if (!this.isSimulating || this.evacuationCompleted) return null;

    const fireLocations = [];
    if (this.fireSystem && this.fireSystem.activeFires) {
      this.fireSystem.activeFires.forEach((f, rId) => {
        if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
      });
    }

    const activeScenario = typeof AIEngine !== 'undefined' ? AIEngine.getActiveScenario() : null;
    const blockedExitIds = [
      ...(activeScenario?.structuralFailures?.blockedExits || []),
      ...(this.manualBlockedExits ? Array.from(this.manualBlockedExits) : [])
    ];
    // Merge floor-scoped stairwell blocks (manual + scenario) into the floor-aware map
    const floorBlockedMap = {
      ...(activeScenario?.structuralFailures?.floorBlockedExits || {})
    };
    if (this.manualBlockedStairs) {
      this.manualBlockedStairs.forEach((exitIds, fl) => {
        if (!floorBlockedMap[fl]) floorBlockedMap[fl] = [];
        floorBlockedMap[fl] = [...new Set([...floorBlockedMap[fl], ...exitIds])];
      });
    }
    const activeStrategy = typeof AIEngine !== 'undefined' ? AIEngine.getActiveStrategy() : null;
    const strategyType = activeStrategy?.type || 'LOAD_BALANCED';

    const unevacuatedAgents = this.agentCrowd.agents.filter(a => a.state !== 'SAFE' && !a.isEvacuated);
    if (unevacuatedAgents.length === 0) return null;

    const newPlan = this.crowdOptimizer
      ? this.crowdOptimizer.optimizeRoutes(unevacuatedAgents, fireLocations, blockedExitIds, strategyType, floorBlockedMap, (this.structuralCollapseZones.length ? this.structuralCollapseZones : this.manualStructuralCollapse))
      : null;

    if (newPlan && newPlan.assignments) {
      if (this.agentCrowd.rerouteAgents) this.agentCrowd.rerouteAgents(newPlan.assignments);
      else this.agentCrowd.assignRoutes(newPlan.assignments);
      this._countCollapseReroutes(newPlan.assignments);
      if (this.renderRouteOverlays) this.renderRouteOverlays(newPlan.assignments);
      if (this.updateExitHoloBadges) this.updateExitHoloBadges(newPlan.exitStats);
    }
    return newPlan;
  }

  // Re-apply every active fire hazard onto the 2D nav grid (after a clear)
  reapplyActiveFireHazards() {
    if (this.fireSystem && this.fireSystem.activeFires) {
      this.fireSystem.activeFires.forEach((f) => {
        if (f.basePos) this.navGrid.setFireZone(f.basePos.x, f.basePos.z, 6.5);
      });
    }
  }

  // ============================================================================
  // COMMAND CENTER: smoke-only incident (heavy smoke, no flames)
  // Works for a real room id (f7_r3) or a real corridor segment (corr_f7_west)
  // ============================================================================
  spawnSmoke(locationId) {
    let room = null;
    const seg = this.parseSegId(locationId);
    const floorH = this.building ? this.building.floorHeight : 3.8;

    if (seg && seg.kind === 'corr') {
      const b = this.getCorridorSegmentBounds(locationId);
      if (!b) return false;
      room = {
        id: locationId,
        floor: seg.floor,
        category: 'CORRIDOR',
        center: { x: b.centerX, y: (seg.floor - 1) * floorH, z: 0 },
        bounds: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ },
        furnishingType: 'CORRIDOR'
      };
    } else if (seg && seg.kind === 'stair') {
      const b = this.getStairSegmentBounds(locationId);
      if (!b) return false;
      room = {
        id: locationId,
        floor: seg.floor,
        category: 'STAIR',
        center: { x: b.centerX, y: (seg.floor - 1) * floorH, z: 0 },
        bounds: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ },
        furnishingType: 'STAIR'
      };
    } else {
      room = this.building?.roomsData?.find((r) => r.id === locationId);
      if (!room) return false;
      const existing = this.fireSystem.activeFires.get(locationId);
      if (existing && !existing.smokeOnly) return false; // live fire already there
    }

    if (this.onFacadeModeChange) this.onFacadeModeChange('CUTAWAY');
    else if (this.building) this.building.facadeMode = 'CUTAWAY';

    const fireY = (room.center.y || 0) + 0.2;
    if (!this.fireSystem.activeFires.has(locationId)) {
      this.fireSystem.spawnFire(locationId, { x: room.center.x, y: fireY, z: room.center.z }, room);
    }

    const fire = this.fireSystem.activeFires.get(locationId);
    if (fire) {
      fire.smokeOnly = true;
      if (fire.primFlameMesh) fire.primFlameMesh.visible = false;
      if (fire.secFlameMesh) fire.secFlameMesh.visible = false;
      if (fire.secCharMesh) fire.secCharMesh.visible = false;
      if (fire.deskCharMesh) fire.deskCharMesh.visible = false;
      if (fire.floorCharMesh) fire.floorCharMesh.visible = false;
      if (fire.sparkPoints) fire.sparkPoints.visible = false;
      if (fire.light) {
        fire.light.color.setHex(0x5a616b);
        fire.light.intensity = 0.35;
        fire.light.distance = 9;
      }
    }

    this.navGrid.setFireZone(room.center.x, room.center.z, 6.5);
    this.recalculateDynamicRoutes();
    return true;
  }

  // Guard used by the UI: does this location already carry a live fire?
  hasActiveFire(locationId) {
    const f = this.fireSystem?.activeFires?.get(locationId);
    return !!(f && !f.smokeOnly);
  }

  // ============================================================================
  // COMMAND CENTER: block / unblock a room area (visible marker + nav grid)
  // ============================================================================
  blockRoom(roomId) {
    const room = this.building?.roomsData?.find(r => r.id === roomId);
    if (!room || !room.bounds) return false;

    this.navGrid.setFireZone(room.center.x, room.center.z, 6.0);

    if (!this.roomBlockerGroup) {
      this.roomBlockerGroup = new THREE.Group();
      this.scene.add(this.roomBlockerGroup);
    }
    if (!this.roomBlockerMarkers) this.roomBlockerMarkers = new Map();

    if (!this.roomBlockerMarkers.has(roomId)) {
      const b = room.bounds;
      const floorH = this.building.floorHeight;
      const baseY = (room.floor - 1) * floorH;
      const geo = new THREE.BoxGeometry(b.maxX - b.minX, floorH - 0.3, b.maxZ - b.minZ);
      const box = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.16, depthWrite: false })
      );
      box.position.set((b.minX + b.maxX) / 2, baseY + floorH / 2, (b.minZ + b.maxZ) / 2);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xef4444 })
      );
      edges.position.copy(box.position);
      this.roomBlockerGroup.add(box);
      this.roomBlockerGroup.add(edges);
      this.roomBlockerMarkers.set(roomId, [box, edges]);
    }

    this.recalculateDynamicRoutes();
    return true;
  }

  unblockRoom(roomId) {
    const room = this.building?.roomsData?.find(r => r.id === roomId);
    if (!room) return false;

    this.navGrid.clearFireZone(room.center.x, room.center.z, 6.0);
    this.reapplyActiveFireHazards();

    const markers = this.roomBlockerMarkers?.get(roomId);
    if (markers) {
      markers.forEach(m => {
        this.roomBlockerGroup?.remove(m);
        m.geometry?.dispose?.();
        m.material?.dispose?.();
      });
      this.roomBlockerMarkers.delete(roomId);
    }

    this.recalculateDynamicRoutes();
    return true;
  }

  // ============================================================================
  // COMMAND CENTER: block / unblock a ground exit gate (real routing effect)
  // ============================================================================
  getExitGatePosition(exitId) {
    const GATES = {
      exit_west: { x: -29.2, z: 0 },
      exit_east: { x: 29.2, z: 0 },
      exit_south: { x: 0, z: 23.5 }
    };
    return GATES[exitId] || null;
  }

  blockExit(exitId) {
    const pos = this.getExitGatePosition(exitId);
    if (!pos) return false;

    if (!this.manualBlockedExits) this.manualBlockedExits = new Set();
    this.manualBlockedExits.add(exitId);
    this.navGrid.setFireZone(pos.x, pos.z, 7);

    if (!this.exitBlockerGroup) {
      this.exitBlockerGroup = new THREE.Group();
      this.scene.add(this.exitBlockerGroup);
    }
    if (!this.exitBlockerMarkers) this.exitBlockerMarkers = new Map();

    if (!this.exitBlockerMarkers.has(exitId)) {
      const geo = new THREE.BoxGeometry(5.2, 3.6, 0.5);
      const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45, depthWrite: false });
      const slab = new THREE.Mesh(geo, mat);
      slab.position.set(pos.x, 1.8, pos.z);
      if (exitId === 'exit_west' || exitId === 'exit_east') slab.rotation.y = Math.PI / 2;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xef4444 })
      );
      edges.position.copy(slab.position);
      edges.rotation.copy(slab.rotation);
      this.exitBlockerGroup.add(slab);
      this.exitBlockerGroup.add(edges);
      this.exitBlockerMarkers.set(exitId, [slab, edges]);
    }

    this.recalculateDynamicRoutes();
    return true;
  }

  unblockExit(exitId) {
    const pos = this.getExitGatePosition(exitId);
    if (!pos) return false;

    this.manualBlockedExits?.delete(exitId);
    this.navGrid.clearFireZone(pos.x, pos.z, 7);
    this.reapplyActiveFireHazards();

    const markers = this.exitBlockerMarkers?.get(exitId);
    if (markers) {
      markers.forEach(m => {
        this.exitBlockerGroup?.remove(m);
        m.geometry?.dispose?.();
        m.material?.dispose?.();
      });
      this.exitBlockerMarkers.delete(exitId);
    }

    this.recalculateDynamicRoutes();
    return true;
  }

  // ============================================================================
  // COMMAND CENTER: location-id parsing (corr_f7_west / stair_f7_east / ...)
  // ============================================================================
  parseSegId(segId) {
    const m = /^(corr|stair)_f(\d+)_([a-z]+)$/.exec(String(segId || ''));
    if (!m) return null;
    return { kind: m[1], floor: parseInt(m[2], 10), zone: m[3] };
  }

  // Real corridor geometry from Building3D's corridor runner (x -25..25, z -0.8..0.8)
  getCorridorSegmentBounds(segId) {
    const seg = this.parseSegId(segId);
    if (!seg || seg.kind !== 'corr') return null;
    const isWest = seg.zone === 'west';
    return {
      minX: isWest ? -25 : 0,
      maxX: isWest ? 0 : 25,
      minZ: -2.0,
      maxZ: 2.0,
      centerX: isWest ? -12.5 : 12.5,
      floor: seg.floor
    };
  }

  getStairSegmentBounds(segId) {
    const seg = this.parseSegId(segId);
    if (!seg || seg.kind !== 'stair') return null;
    const isWest = seg.zone === 'west';
    const stairX = isWest ? -28 : 28;
    return {
      minX: stairX - 5.5,
      maxX: stairX + 5.5,
      minZ: -5.5,
      maxZ: 5.5,
      centerX: stairX,
      floor: seg.floor
    };
  }

  // Report whether a location id maps onto a real 3D object (requirement: never
  // render an effect at an incorrect location — report the missing mapping instead)
  getRoomMapping(roomId) {
    const room = this.building?.roomsData?.find((r) => r.id === roomId);
    if (!room) return null;
    return { id: room.id, floor: room.floor, center: { ...room.center }, camId: room.camId, found: true };
  }

  // Resolve a Command Center location object into a normalized hazard zone spec.
  // Returns null when the location cannot be mapped onto a real 3D object (the
  // caller must report the missing mapping instead of rendering a wrong effect).
  resolveLocationZone(loc) {
    if (!loc || !loc.id) return null;
    const floor = Number(loc.floor) || 1;
    const kind = loc.category || 'ROOM';

    if (kind === 'ROOM') {
      const m = this.getRoomMapping(loc.id);
      if (!m) return null;
      const room = this.building?.roomsData?.find((r) => r.id === loc.id);
      const b = loc.bounds || (room && room.bounds) || null;
      if (!b) return null;
      return {
        locId: loc.id,
        floor,
        kind,
        bounds: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ },
        corridorId: null,
        coreBlocked: null
      };
    }

    if (kind === 'CORRIDOR') {
      const b = this.getCorridorSegmentBounds(loc.id);
      if (!b) return null;
      return {
        locId: loc.id,
        floor: b.floor || floor,
        kind,
        bounds: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ },
        corridorId: loc.id,
        coreBlocked: null
      };
    }

    if (kind === 'STAIR') {
      const seg = this.parseSegId(loc.id);
      if (!seg) return null;
      const stairX = seg.zone === 'west' ? -28 : 28;
      const zoneFloor = seg.floor || floor;
      return {
        locId: loc.id,
        floor: zoneFloor,
        kind,
        bounds: { minX: stairX - 5.5, maxX: stairX + 5.5, minZ: -5.5, maxZ: 5.5 },
        corridorId: null,
        coreBlocked: seg.zone === 'west' ? 'exit_west' : 'exit_east'
      };
    }

    if (kind === 'EXIT') {
      const pos = this.getExitGatePosition(loc.id);
      if (!pos) return null;
      return {
        locId: loc.id,
        floor: 1,
        kind,
        bounds: { minX: pos.x - 2.6, maxX: pos.x + 2.6, minZ: pos.z - 2.6, maxZ: pos.z + 2.6 },
        corridorId: null,
        coreBlocked: loc.id
      };
    }
    if (kind === 'FLOOR') {
      return {
        locId: `floor_${floor}`,
        floor,
        kind: 'FLOOR',
        bounds: { minX: -28, maxX: 28, minZ: -22, maxZ: 22 },
        corridorId: `corr_f${floor}_all`,
        coreBlocked: null
      };
    }

    // Whole-building / unknown scope
    if (loc.id === 'ALL' || kind === 'ALL') {
      return { locId: 'ALL', floor, kind: 'ALL', bounds: null, corridorId: null, coreBlocked: null };
    }

    return null;
  }

  // Live agent occupancy on a corridor / stairwell segment of a floor
  getSegmentOccupancy(segId) {
    const seg = this.parseSegId(segId);
    if (!seg) return { onSegment: 0, floorTotal: 0, blocked: false };
    const agents = (this.agentCrowd && this.agentCrowd.agents) || [];
    const floorH = this.building ? this.building.floorHeight : 3.8;
    const bounds = seg.kind === 'corr' ? this.getCorridorSegmentBounds(segId) : null;
    const stairX = seg.zone === 'west' ? -28 : 28;
    let onSegment = 0;
    let floorTotal = 0;

    agents.forEach((a) => {
      if (a.state === 'SAFE' || a.isEvacuated) return;
      const fl = a.floor || (Math.round((a.y || 0) / floorH) + 1);
      if (fl !== seg.floor) return;
      floorTotal++;
      if (seg.kind === 'corr') {
        if (bounds && a.x >= bounds.minX && a.x <= bounds.maxX && Math.abs(a.z) <= 3.0) onSegment++;
      } else if (Math.abs(a.x - stairX) <= 5.5 && Math.abs(a.z) <= 5.5) {
        onSegment++;
      }
    });

    const blocked =
      seg.kind === 'corr'
        ? !!(this.blockedCorridorSegments && this.blockedCorridorSegments.has(segId))
        : !!(this.blockedStairSegments && this.blockedStairSegments.has(segId));

    return { onSegment, floorTotal, blocked };
  }

  // ============================================================================
  // COMMAND CENTER: block / unblock a corridor segment (visible + navigation)
  // ============================================================================
  blockCorridorSegment(segId) {
    const seg = this.parseSegId(segId);
    const bounds = this.getCorridorSegmentBounds(segId);
    if (!seg || !bounds) return false;

    if (!this.blockedCorridorSegments) this.blockedCorridorSegments = new Set();

    // Mark the navigation grid along the segment (same hazard marking the fires use)
    for (let x = bounds.minX + 4; x <= bounds.maxX - 3; x += 8) {
      this.navGrid.setFireZone(x, 0, 5);
    }

    // Visible red barrier drawn on THIS floor's real corridor mesh
    if (!this.segBlockerGroup) {
      this.segBlockerGroup = new THREE.Group();
      this.scene.add(this.segBlockerGroup);
    }
    if (!this.segBlockerMarkers) this.segBlockerMarkers = new Map();

    if (!this.segBlockerMarkers.has(segId)) {
      const floorH = this.building ? this.building.floorHeight : 3.8;
      const baseY = (seg.floor - 1) * floorH;
      const w = bounds.maxX - bounds.minX;
      const cx = (bounds.minX + bounds.maxX) / 2;

      const group = new THREE.Group();
      group.name = 'CorridorBarrier_' + segId;

      // 1. Floor danger stripe plane
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(w, 3.2),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide })
      );
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(cx, baseY + 0.24, 0);
      group.add(strip);

      // 2. High-visibility vertical 3D holographic barrier fence
      const fenceGeo = new THREE.BoxGeometry(w, 2.4, 0.3);
      const fenceMat = new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xcc0022,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.65,
        roughness: 0.2,
        metalness: 0.1
      });
      const fence = new THREE.Mesh(fenceGeo, fenceMat);
      fence.position.set(cx, baseY + 1.25, 0);
      group.add(fence);

      // 3. Stanchion warning posts with red beacon lights on both ends
      const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.6, 12);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.8, roughness: 0.3 });
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

      [-w * 0.48, w * 0.48].forEach((offsetX) => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(cx + offsetX, baseY + 1.3, 0);
        group.add(post);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), beaconMat);
        beacon.position.set(cx + offsetX, baseY + 2.65, 0);
        group.add(beacon);
      });

      // 4. Warning beacon PointLight
      const warnLight = new THREE.PointLight(0xff1744, 2.5, 9.0, 1.8);
      warnLight.position.set(cx, baseY + 2.2, 0);
      group.add(warnLight);
      group.userData.warnLight = warnLight;

      this.segBlockerGroup.add(group);
      this.segBlockerMarkers.set(segId, [group]);

      if (this.onFacadeModeChange) this.onFacadeModeChange('CUTAWAY');
      else if (this.building) this.building.facadeMode = 'CUTAWAY';
    }

    this.blockedCorridorSegments.add(segId);
    this.recalculateDynamicRoutes();
    return true;
  }

  unblockCorridorSegment(segId) {
    const bounds = this.getCorridorSegmentBounds(segId);
    if (!bounds) return false;

    for (let x = bounds.minX + 4; x <= bounds.maxX - 3; x += 8) {
      this.navGrid.clearFireZone(x, 0, 5);
    }
    this.reapplyActiveFireHazards();

    const markers = this.segBlockerMarkers?.get(segId);
    if (markers) {
      markers.forEach((m) => {
        this.segBlockerGroup?.remove(m);
        m.geometry?.dispose?.();
        m.material?.dispose?.();
      });
      this.segBlockerMarkers.delete(segId);
    }

    this.blockedCorridorSegments?.delete(segId);
    this.recalculateDynamicRoutes();
    return true;
  }

  // ============================================================================
  // COMMAND CENTER: block / unblock a stairwell core on a specific floor
  // ============================================================================
  blockStairCore(segId) {
    const seg = this.parseSegId(segId);
    if (!seg || seg.kind !== 'stair') return false;

    if (!this.blockedStairSegments) this.blockedStairSegments = new Set();

    // Floor-scoped stair blocks are fed to the floor-aware route optimizer so
    // only agents on THIS floor are diverted to the other core.
    if (!this.manualBlockedStairs) this.manualBlockedStairs = new Map();
    if (!this.manualBlockedStairs.has(seg.floor)) this.manualBlockedStairs.set(seg.floor, new Set());
    this.manualBlockedStairs.get(seg.floor).add(seg.zone === 'west' ? 'exit_west' : 'exit_east');

    // Visible red barrier on this floor's stairwell landing (real core at x = +/-28)
    if (!this.stairBlockerGroup) {
      this.stairBlockerGroup = new THREE.Group();
      this.scene.add(this.stairBlockerGroup);
    }
    if (!this.stairBlockerMarkers) this.stairBlockerMarkers = new Map();

    if (!this.stairBlockerMarkers.has(segId)) {
      const floorH = this.building ? this.building.floorHeight : 3.8;
      const baseY = (seg.floor - 1) * floorH;
      const x = seg.zone === 'west' ? -28 : 28;

      const group = new THREE.Group();
      group.name = 'StairBarrier_' + segId;

      const geo = new THREE.BoxGeometry(5.6, 3.2, 0.45);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xcc0022,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
        metalness: 0.1
      });
      const slab = new THREE.Mesh(geo, mat);
      slab.position.set(x, baseY + 1.6, 0);
      group.add(slab);

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
      edges.position.copy(slab.position);
      group.add(edges);

      const stairLight = new THREE.PointLight(0xff1744, 2.8, 10.0, 1.8);
      stairLight.position.set(x, baseY + 2.0, 0);
      group.add(stairLight);
      group.userData.stairLight = stairLight;

      this.stairBlockerGroup.add(group);
      this.stairBlockerMarkers.set(segId, [group]);

      if (this.onFacadeModeChange) this.onFacadeModeChange('CUTAWAY');
      else if (this.building) this.building.facadeMode = 'CUTAWAY';
    }

    this.blockedStairSegments.add(segId);
    this.recalculateDynamicRoutes();
    return true;
  }

  unblockStairCore(segId) {
    const seg = this.parseSegId(segId);
    if (!seg) return false;

    this.manualBlockedStairs?.get(seg.floor)?.delete(seg.zone === 'west' ? 'exit_west' : 'exit_east');
    if (this.manualBlockedStairs?.get(seg.floor)?.size === 0) this.manualBlockedStairs.delete(seg.floor);

    const markers = this.stairBlockerMarkers?.get(segId);
    if (markers) {
      markers.forEach((m) => {
        this.stairBlockerGroup?.remove(m);
        m.geometry?.dispose?.();
        m.material?.dispose?.();
      });
      this.stairBlockerMarkers.delete(segId);
    }

    this.blockedStairSegments?.delete(segId);
    this.recalculateDynamicRoutes();
    return true;
  }

  // Snapshot of every command-center hazard currently present in the 3D scene
  getSceneHazardState() {
    const fires = [];
    const smokes = [];
    if (this.fireSystem && this.fireSystem.activeFires) {
      this.fireSystem.activeFires.forEach((f, id) => (f.smokeOnly ? smokes : fires).push(id));
    }
    return {
      fires,
      smokes,
      blockedRooms: this.roomBlockerMarkers ? Array.from(this.roomBlockerMarkers.keys()) : [],
      blockedCorridors: this.blockedCorridorSegments ? Array.from(this.blockedCorridorSegments) : [],
      blockedStairs: this.blockedStairSegments ? Array.from(this.blockedStairSegments) : [],
      blockedExits: this.manualBlockedExits ? Array.from(this.manualBlockedExits) : []
    };
  }

  startEvacuation(scenario = null, strategy = null) {
    if (this.evacuationCompleted) {
      // Evacuation strictly runs once per scenario until Reset is clicked
      return null;
    }

    this.isSimulating = true;
    this.elapsedSeconds = 0;

    const fireLocations = [];
    if (this.fireSystem && this.fireSystem.activeFires) {
      this.fireSystem.activeFires.forEach((f, rId) => {
        if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
      });
    }

    const activeScenario = scenario || (typeof AIEngine !== 'undefined' ? AIEngine.getActiveScenario() : null);
    const blockedExitIds = [
      ...(activeScenario?.structuralFailures?.blockedExits || []),
      ...(this.manualBlockedExits ? Array.from(this.manualBlockedExits) : [])
    ];
    const floorBlockedMap = {
      ...(activeScenario?.structuralFailures?.floorBlockedExits || {})
    };
    if (this.manualBlockedStairs) {
      this.manualBlockedStairs.forEach((exitIds, fl) => {
        if (!floorBlockedMap[fl]) floorBlockedMap[fl] = [];
        floorBlockedMap[fl] = [...new Set([...floorBlockedMap[fl], ...exitIds])];
      });
    }
    const activeStrategy = strategy || (typeof AIEngine !== 'undefined' ? AIEngine.getActiveStrategy() : null);
    const strategyType = activeStrategy?.type || 'LOAD_BALANCED';

    let optimizationResult;
    if (this.crowdOptimizer) {
      optimizationResult = this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations, blockedExitIds, strategyType, floorBlockedMap, this.structuralCollapseZones.length ? this.structuralCollapseZones : (this.structuralCollapseZones.length ? this.structuralCollapseZones : this.manualStructuralCollapse));
    } else if (this.routeOptimizer) {
      optimizationResult = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents, blockedExitIds, floorBlockedMap || {});
    }

    if (optimizationResult && optimizationResult.assignments) {
      if (this.agentCrowd && this.agentCrowd.assignRoutes) {
        this.agentCrowd.assignRoutes(optimizationResult.assignments);
      }
      if (typeof this.renderRouteOverlays === 'function') {
        this.renderRouteOverlays(optimizationResult.assignments);
      }
      if (typeof this.updateExitHoloBadges === 'function') {
        this.updateExitHoloBadges(optimizationResult.exitStats);
      }
    }

    if (this.emergencyManager && !this.emergencyManager.isActive) {
      this.emergencyManager.dispatch(null, fireLocations);
    }

    return optimizationResult;
  }

  pauseSimulation() {
    this.isSimulating = false;
  }

  resumeSimulation() {
    this.isSimulating = true;
  }

  reset(rooms = null) {
    this.isSimulating = false;
    this.evacuationCompleted = false;
    this.elapsedSeconds = 0;
    this._lastStatsUpdate = 0;
    this._lastEvacuated = -1;
    this._lastElapsedSec = -1;
    this.fireSystem.extinguishAll();
    this.navGrid.resetDynamicHazards();

    // Multi-hazard reset: clean up every temporary hazard effect
    // (emergency lighting, HVAC smoke model, structural rubble + blocks)
    this.setPowerGridFailure(false);
    this.setHvacFailure(false);
    this.setStructuralCollapse(false);
    this.powerFailureZones = [];
    this.hvacFailureZones = [];
    this.hvacFailureFloors = new Set();
    this.structuralCollapseZones = [];
    this.structuralRubbleGroups = new Map();
    this.reroutedAgentCount = 0;
    this.smokeTelemetry = { avgRate: 0, cumulativeRate: 0, agentsExposed: 0, multiplier: 1.0 };

    const targetRooms = rooms || (this.building ? this.building.roomsData : []);
    this.agentCrowd.spawnAgentsForRooms(targetRooms);
    if (this.emergencyManager) {
      this.emergencyManager.reset();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // MULTI-HAZARD TOGGLE MATRIX — HAZARD 2: MAIN GRID POWER FAILURE
  // Dims the EXACT original lighting objects and re-lights the building with
  // procedural emergency fixtures, illuminated exit signs and pooled pulsing
  // red point lights that follow the camera target.
  // ════════════════════════════════════════════════════════════════════════

  // Localized power failure: toggles a single zone. `active=true` adds the zone
  // (idempotent per locId); `active=false` removes that zone (or all zones when
  // location is null). Returns true on success. Interior lights in the zone go
  // dark via Building3D.setZonePowerOff; emergency rig visible if any zone active.
  setPowerGridFailure(active, location = null) {
    const L = this.lighting;
    if (!L) return false;
    const enabled = !!active;

    if (enabled) {
      const zone = this.resolveLocationZone(location);
      if (!zone) {
        console.warn('[SceneManager] power failure: unmapped location', location && location.id);
        return false;
      }
      // Idempotent per location
      if (this.powerFailureZones.some((z) => z.locId === zone.locId)) return true;

      this.powerFailureZones.push(zone);
      // Localized interior blackout for this zone ONLY (global sun/ambient remain normal!)
      if (this.building && this.building.setZonePowerOff) {
        this.building.setZonePowerOff(zone.floor, zone.bounds, true);
      }
      this.ensureEmergencyLighting();
      if (this.emergencyLightGroup) this.emergencyLightGroup.visible = true;
      this.emergencyPulseLights.forEach((l) => { l.visible = true; });
      this.powerFailureState.active = true;
      return true;
    }

    // Removal
    if (location) {
      const zone = this.resolveLocationZone(location);
      const idx = zone ? this.powerFailureZones.findIndex((z) => z.locId === zone.locId) : -1;
      if (idx >= 0) {
        const z = this.powerFailureZones[idx];
        if (this.building && this.building.setZonePowerOff) {
          this.building.setZonePowerOff(z.floor, z.bounds, false);
        }
        this.powerFailureZones.splice(idx, 1);
      }
    } else {
      // Remove all zones
      this.powerFailureZones.forEach((z) => {
        if (this.building && this.building.setZonePowerOff) {
          this.building.setZonePowerOff(z.floor, z.bounds, false);
        }
      });
      this.powerFailureZones = [];
    }

    if (this.powerFailureZones.length === 0) {
      if (this.emergencyLightGroup) this.emergencyLightGroup.visible = false;
      this.emergencyPulseLights.forEach((l) => { l.visible = false; l.intensity = 0; });
      this.powerFailureState.active = false;
    }
    return true;
  }

  /** Build the emergency lighting rig ONCE (idempotent — never duplicated). */
  ensureEmergencyLighting() {
    if (this.emergencyLightGroup) return;

    const group = new THREE.Group();
    group.name = 'EmergencyLighting';

    // 1. Procedural emergency lamp fixtures along every corridor ceiling at
    //    real building coordinates (corridor runner z = 0, x = −25..25).
    const fixtureGeo = new THREE.BoxGeometry(0.55, 0.10, 0.55);
    const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e, toneMapped: false });
    this._emergencyFixtureMat = fixtureMat;
    const fixturePositions = [];
    for (let floor = 1; floor <= 10; floor++) {
      const y = (floor - 1) * 3.8 + 3.45; // corridor ceiling height
      [-14, -7, 0, 7, 14].forEach((x) => fixturePositions.push({ x, y, z: 0 }));
      // Additional lights near both stairwell entrances (x = ±26)
      [-26, 26].forEach((x) => fixturePositions.push({ x, y, z: 0 }));
    }
    const dummy = new THREE.Object3D();
    const fixtures = new THREE.InstancedMesh(fixtureGeo, fixtureMat, fixturePositions.length);
    fixturePositions.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      fixtures.setMatrixAt(i, dummy.matrix);
    });
    fixtures.instanceMatrix.needsUpdate = true;
    fixtures.frustumCulled = false;
    group.add(fixtures);

    // 2. Illuminated emergency EXIT signs at both stair cores (every floor)
    //    and the three ground gates — clearly readable in the darkened tower.
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 128;
    signCanvas.height = 64;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#052e16';
    sctx.fillRect(0, 0, 128, 64);
    sctx.fillStyle = '#22c55e';
    sctx.fillRect(3, 3, 122, 58);
    sctx.fillStyle = '#052e16';
    sctx.fillRect(6, 6, 116, 52);
    sctx.fillStyle = '#4ade80';
    sctx.font = 'bold 30px Arial';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('EXIT', 64, 33);
    const signTex = new THREE.CanvasTexture(signCanvas);
    this._emergencySignTex = signTex;
    const signGeo = new THREE.PlaneGeometry(1.15, 0.55);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false, side: THREE.DoubleSide });
    this._emergencySignMat = signMat;
    const signPositions = [];
    for (let floor = 1; floor <= 10; floor++) {
      const y = (floor - 1) * 3.8 + 2.6;
      signPositions.push({ x: -26.4, y, z: 0, ry: Math.PI / 2 });
      signPositions.push({ x: 26.4, y, z: 0, ry: -Math.PI / 2 });
    }
    // Ground-level gate signs
    signPositions.push({ x: -28.6, y: 2.6, z: 0, ry: Math.PI / 2 });
    signPositions.push({ x: 28.6, y: 2.6, z: 0, ry: -Math.PI / 2 });
    signPositions.push({ x: 0, y: 2.9, z: 22.6, ry: 0 });
    const signs = new THREE.InstancedMesh(signGeo, signMat, signPositions.length);
    signPositions.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(0, pos.ry, 0);
      dummy.updateMatrix();
      signs.setMatrixAt(i, dummy.matrix);
    });
    signs.instanceMatrix.needsUpdate = true;
    signs.frustumCulled = false;
    group.add(signs);

    this._emergencyFixturePositions = fixturePositions;
    this.scene.add(group);
    this.emergencyLightGroup = group;

    // 3. Pooled REAL point lights (FIXED count → no perf spikes) re-lit red
    //    near the camera target so the active floor genuinely illuminates.
    const POOL = 4;
    for (let i = 0; i < POOL; i++) {
      const pulse = new THREE.PointLight(0xff1e1e, 0, 8, 2.0);
      pulse.visible = false;
      this.scene.add(pulse);
      this.emergencyPulseLights.push(pulse);
    }
  }

  /** Smooth pulsating emergency lights — driven by the EXISTING animate loop. */
  updateEmergencyLights(delta) {
    const t = performance.now() * 0.001;

    // Pulsing emissive corridor fixtures (single shared material)
    if (this._emergencyFixtureMat) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 2.2);
      this._emergencyFixtureMat.color.setRGB(pulse, 0.12 * pulse, 0.12 * pulse);
    }

    // Reposition pooled lights near the camera target (throttled)
    this.emergencyLightTimer += delta;
    if (this.emergencyLightTimer > 0.4 && this._emergencyFixturePositions) {
      this.emergencyLightTimer = 0;
      const target = this.controls ? this.controls.target : { x: 0, y: 0, z: 0 };
      const nearest = this._emergencyFixturePositions
        .map((p) => ({ p, d: (p.x - target.x) ** 2 + (p.y - target.y) ** 2 + (p.z - target.z) ** 2 }))
        .sort((a, b) => a.d - b.d)
        .slice(0, this.emergencyPulseLights.length);
      nearest.forEach((entry, i) => {
        this.emergencyPulseLights[i].position.set(entry.p.x, entry.p.y - 0.25, entry.p.z);
      });
    }

    // Pulsating red intensity (unique phase per light)
    this.emergencyPulseLights.forEach((light, i) => {
      light.intensity = 1.5 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.85));
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // MULTI-HAZARD TOGGLE MATRIX — HAZARD 3: HVAC PRESSURIZATION FAILURE
  // Alters the underlying smoke propagation model (FireParticles):
  // 2.2x particle scale, 2.0x spread velocity, aggressive corridor flooding.
  // The behavioral exposure model is synced by the AIEngine facade.
  // ════════════════════════════════════════════════════════════════════════

  // Localized HVAC pressurization failure: toggles a single zone. Tracks affected
  // floors so FireParticles smoke multipliers and exposure rates apply only there.
  setHvacFailure(active, location = null) {
    const enabled = !!active;

    if (enabled) {
      const zone = this.resolveLocationZone(location);
      if (!zone) {
        console.warn('[SceneManager] hvac failure: unmapped location', location && location.id);
        return false;
      }
      if (this.hvacFailureZones && this.hvacFailureZones.some((z) => z.locId === zone.locId)) return true;
      if (!this.hvacFailureZones) this.hvacFailureZones = [];
      this.hvacFailureZones.push(zone);
      this.hvacFailureFloors.add(zone.floor);
      this.hvacFailureActive = true;
      if (this.fireSystem && this.fireSystem.setHvacFailure) {
        this.fireSystem.setHvacFailure(true, Array.from(this.hvacFailureFloors));
      }
      if (this.crowd && this.crowd.setHvacFailure) {
        // AIEngine facade also calls crowd.setHvacFailure; keep both in sync
      }
      return true;
    }

    // Removal
    if (location) {
      const zone = this.resolveLocationZone(location);
      const idx = zone ? (this.hvacFailureZones || []).findIndex((z) => z.locId === zone.locId) : -1;
      if (idx >= 0) {
        const z = this.hvacFailureZones[idx];
        this.hvacFailureZones.splice(idx, 1);
        // Recompute affected floors
        this.hvacFailureFloors = new Set(this.hvacFailureZones.map((zz) => zz.floor));
      }
    } else {
      this.hvacFailureZones = [];
      this.hvacFailureFloors = new Set();
    }

    this.hvacFailureActive = this.hvacFailureZones.length > 0;
    if (this.fireSystem && this.fireSystem.setHvacFailure) {
      this.fireSystem.setHvacFailure(this.hvacFailureActive, Array.from(this.hvacFailureFloors));
    }
    return true;
  }

  // ════════════════════════════════════════════════════════════════════════
  // MULTI-HAZARD TOGGLE MATRIX — HAZARD 4: STRUCTURAL DEBRIS COLLAPSE
  // Procedural rubble in the REAL C-101 corridor segment on Level 4
  // (Level 4 base = 3 × 3.8 = 11.4 m) that severs the West Stair Core
  // connection for Level 4 ONLY and forces live crowd rerouting.
  // ════════════════════════════════════════════════════════════════════════

  // Localized structural collapse: toggles a single zone. Supports multiple
  // simultaneous zones (each independently reversible). Rubble is built per
  // zone (cached by locId) and camera focuses + cutaway so it is visible.
  setStructuralCollapse(active, location = null) {
    const enabled = !!active;

    if (enabled) {
      const zone = this.resolveLocationZone(location);
      if (!zone) {
        console.warn('[SceneManager] structural collapse: unmapped location', location && location.id);
        return false;
      }
      // Default coreBlocked for a corridor/stair/exit collapse
      if (!zone.coreBlocked) {
        if (zone.kind === 'CORRIDOR') zone.coreBlocked = zone.bounds && zone.bounds.minX < 0 ? 'exit_west' : 'exit_east';
        else if (zone.kind === 'STAIR') zone.coreBlocked = zone.locId.includes('west') ? 'exit_west' : 'exit_east';
        else if (zone.kind === 'EXIT') zone.coreBlocked = zone.locId;
        else zone.coreBlocked = null;
      }
      if (!zone.corridorId) zone.corridorId = zone.locId;

      // Idempotent per location
      if (this.structuralCollapseZones.some((z) => z.locId === zone.locId)) return true;

      this.structuralCollapseZones.push(zone);
      // Primary zone backward compat
      this.manualStructuralCollapse = zone;

      // Build/reuse rubble group for this zone
      let group = this.structuralRubbleGroups.get(zone.locId);
      if (!group) {
        group = this._buildCollapseRubble(zone);
        this.structuralRubbleGroups.set(zone.locId, group);
      }
      const floorBase = (zone.floor - 1) * 3.8;
      group.position.set(
        zone.bounds ? (zone.bounds.minX + zone.bounds.maxX) / 2 : 0,
        floorBase + 0.02,
        zone.bounds ? (zone.bounds.minZ + zone.bounds.maxZ) / 2 : 0
      );
      group.visible = true;
      if (!group.parent) this.scene.add(group);

      // NavGrid structural block (floor-aware)
      // NavGrid structural block (floor-aware) with exact bounds
      if (this.navGrid && this.navGrid.markStructuralBlocked) {
        this.navGrid.markStructuralBlocked(zone.corridorId, zone.bounds || zone, zone.floor);
      }
      if (this.navigationGraph) {
        if (zone.kind === 'ROOM') this.navigationGraph.blockRoom(zone.locId);
        else if (zone.kind === 'CORRIDOR') this.navigationGraph.blockCorridor(zone.floor, zone.bounds);
        else if (zone.kind === 'STAIR') this.navigationGraph.blockStairwell(zone.locId, zone.floor);
        else if (zone.kind === 'EXIT') this.navigationGraph.blockExit(zone.locId);
      }
      if (zone.kind === 'EXIT') {
        if (!this.manualBlockedExits) this.manualBlockedExits = new Set();
        this.manualBlockedExits.add(zone.locId);
      }

      // Visibility: focus camera directly on the collapse rubble + cutaway
      const rubbleCx = zone.bounds ? (zone.bounds.minX + zone.bounds.maxX) / 2 : 0;
      const rubbleCz = zone.bounds ? (zone.bounds.minZ + zone.bounds.maxZ) / 2 : 0;
      if (this.focusTarget) {
        this.focusTarget({ x: rubbleCx, y: floorBase + 1.8, z: rubbleCz }, 38);
      }
      if (this.onFacadeModeChange) this.onFacadeModeChange('CUTAWAY');
      else if (this.building) this.building.facadeMode = 'CUTAWAY';

      this.structuralCollapseState.active = true;
      this.recalculateDynamicRoutes();
      return true;
    }

    // Removal
    if (location) {
      const zone = this.resolveLocationZone(location);
      const idx = zone ? this.structuralCollapseZones.findIndex((z) => z.locId === zone.locId) : -1;
      if (idx >= 0) {
        const z = this.structuralCollapseZones[idx];
        const g = this.structuralRubbleGroups.get(z.locId);
        if (g) g.visible = false;
        if (this.navGrid && this.navGrid.unmarkStructuralBlocked) {
          this.navGrid.unmarkStructuralBlocked(z.corridorId);
        if (z.kind === 'EXIT' && this.manualBlockedExits) { this.manualBlockedExits.delete(z.locId); }
        }
        this.structuralCollapseZones.splice(idx, 1);
      }
    } else {
      this.structuralCollapseZones.forEach((z) => {
        const g = this.structuralRubbleGroups.get(z.locId);
        if (g) g.visible = false;
        if (this.navGrid && this.navGrid.unmarkStructuralBlocked) {
          this.navGrid.unmarkStructuralBlocked(z.corridorId);
        }
      });
      this.structuralCollapseZones = [];
    }

    if (this.structuralCollapseZones.length === 0) {
      this.manualStructuralCollapse = null;
      this.structuralCollapseState.active = false;
      this.recalculateDynamicRoutes();
    } else {
      this.manualStructuralCollapse = this.structuralCollapseZones[this.structuralCollapseZones.length - 1];
      this.recalculateDynamicRoutes();
    }
    return true;
  }

  /** Procedural rubble generation — built per zone and cached by locId. */
  _buildCollapseRubble(zone) {
    const group = new THREE.Group();
    group.name = 'StructuralCollapse_' + (zone && zone.locId ? zone.locId : 'zone');

    const isExit = zone && zone.kind === 'EXIT';
    const zoneW = zone && zone.bounds ? Math.max(isExit ? 5.2 : 2.6, zone.bounds.maxX - zone.bounds.minX) : 4.5;
    const zoneD = zone && zone.bounds ? Math.max(isExit ? 3.6 : 2.6, zone.bounds.maxZ - zone.bounds.minZ) : 3.0;
    const sx = zoneW / 4.5;
    const sz = zoneD / 3.0;

    const concreteMats = this._collapseMaterials || (this._collapseMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x8d9196, roughness: 0.95, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: 0x787c82, roughness: 0.98, metalness: 0.03 }),
      new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.92, metalness: 0.05 })
    ]);

    // 1. Fallen concrete ceiling slabs (tilted, broken)
    const slabSpecs = [
      { w: 4.0, h: 0.35, d: 1.6, x: -0.6, y: 0.9, z: 0.05, rz: 0.22, rx: 0.08, mat: 0 },
      { w: 3.2, h: 0.32, d: 1.45, x: 1.5, y: 0.6, z: -0.15, rz: -0.38, rx: 0.12, mat: 1 },
      { w: 2.5, h: 0.30, d: 1.25, x: -1.9, y: 0.4, z: -0.25, rz: 0.55, rx: -0.10, mat: 2 },
      { w: 2.8, h: 0.28, d: 1.35, x: 0.2, y: 0.25, z: 0.45, rz: -0.15, rx: 0.35, mat: 0 }
    ];
    slabSpecs.forEach((s) => {
      const geo = new THREE.BoxGeometry(s.w * sx, s.h, s.d * sz);
      const mesh = new THREE.Mesh(geo, concreteMats[s.mat]);
      mesh.position.set(s.x * sx, s.y, s.z * sz);
      mesh.rotation.set(s.rx, 0, s.rz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    // 2. Broken concrete blocks (22 chunks)
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(blockGeo, concreteMats[i % 3]);
      const s = 0.24 + Math.random() * 0.44;
      mesh.scale.set(s * (0.7 + Math.random() * 0.7) * sx, s, s * (0.7 + Math.random() * 0.7) * sz);
      mesh.position.set(
        (Math.random() - 0.5) * 4.6 * sx,
        0.1 + Math.random() * 0.55,
        (Math.random() - 0.5) * 3.0 * sz
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // 3. Twisted rebar (8 metallic bent rods)
    const rebarGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6);
    const rebarMat = this._collapseRebarMat || (this._collapseRebarMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.9 }));
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(rebarGeo, rebarMat);
      mesh.position.set(
        (Math.random() - 0.5) * 3.6 * sx,
        0.5 + Math.random() * 0.8,
        (Math.random() - 0.5) * 2.2 * sz
      );
      mesh.rotation.set(
        Math.PI / 2 + (Math.random() - 0.5) * 1.4,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 1.1
      );
      mesh.castShadow = true;
      group.add(mesh);
    }

    // 4. Caution Warning Stanchions at perimeter
    const stanchionGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.15, 8);
    const stanchionMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.7 });
    for (const sxSign of [-1, 1]) {
      const post = new THREE.Mesh(stanchionGeo, stanchionMat);
      post.position.set(sxSign * zoneW * 0.48, 0.58, -zoneD * 0.48);
      group.add(post);
    }

    // High-intensity pulsing orange/red hazard beacon light inside the rubble
    const collapseBeacon = new THREE.PointLight(0xff4400, 3.5, 14.0, 1.8);
    collapseBeacon.position.set(0, 1.4, 0);
    group.add(collapseBeacon);
    group.userData.beaconLight = collapseBeacon;

    // 5. Dust particles
    const dustCount = 140;
    const dustPositions = new Float32Array(dustCount * 3);
    const seeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 5.2 * sx;
      dustPositions[i * 3 + 1] = 0.15 + Math.random() * 2.4;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.4 * sz;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x9ca3af, size: 0.18, transparent: true, opacity: 0.35,
      depthWrite: false, sizeAttenuation: true
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    group.add(dust);
    group.userData.dust = dust;
    group.userData.dustSeeds = seeds;

    group.visible = false;
    return group;
  }

  ensureCollapseRubble() {
    if (this.structuralRubbleGroup) return;
    const zone = this.manualStructuralCollapse || { floor: 4, bounds: { minX: -25, maxX: -20.5, minZ: -1.7, maxZ: 1.7 } };
    this.structuralRubbleGroup = this._buildCollapseRubble(zone);
    this.scene.add(this.structuralRubbleGroup);
  }

  /** Slow drifting dust over the rubble — existing animation loop only. */
  updateCollapseDust(delta) {
    const dust = this._collapseDust;
    if (!dust) return;
    const pos = dust.geometry.attributes.position;
    const arr = pos.array;
    const t = performance.now() * 0.001;
    for (let i = 0; i < arr.length / 3; i++) {
      const seed = this._collapseDustSeeds[i];
      arr[i * 3] += Math.sin(t * 0.6 + seed) * delta * 0.08;
      arr[i * 3 + 1] += delta * 0.05 * (0.5 + 0.5 * Math.sin(seed));
      if (arr[i * 3 + 1] > 2.6) arr[i * 3 + 1] = 0.12;
      arr[i * 3 + 2] += Math.cos(t * 0.5 + seed) * delta * 0.06;
    }
    pos.needsUpdate = true;
  }

  /** Structural telemetry — all values read from the live simulation state. */
  // Expose active hazard zone locIds for UI toggle-direction decisions
  getPowerZones() { return (this.powerFailureZones || []).map((z) => z.locId); }
  getHvacZones() { return (this.hvacFailureZones || []).map((z) => z.locId); }
  getStructuralZones() { return (this.structuralCollapseZones || []).map((z) => z.locId); }

  getStructuralStatus() {
    const zones = this.structuralCollapseZones || [];
    const active = !!(this.structuralCollapseState.active && zones.length > 0);
    const zone = zones.length ? zones[zones.length - 1] : this.manualStructuralCollapse;
    let affectedAgents = 0;
    if (active && this.agentCrowd && this.agentCrowd.agents) {
      const floors = new Set(zones.map((z) => z.floor));
      affectedAgents = this.agentCrowd.agents.filter(
        (a) => floors.has(Number(a.floor)) && a.state !== 'SAFE' && !a.isEvacuated
      ).length;
    }
    return {
      active,
      zones: zones.map((z) => ({ locId: z.locId, floor: z.floor, corridorId: z.corridorId, coreBlocked: z.coreBlocked })),
      corridorId: zone ? zone.corridorId : 'C101',
      floor: zone ? zone.floor : 4,
      zone: zone ? { minX: zone.minX, maxX: zone.maxX, minZ: zone.minZ, maxZ: zone.maxZ } : null,
      westStairConnection: active && zones.some((z) => z.coreBlocked === 'exit_west') ? 'BLOCKED' : 'OPEN',
      eastStairConnection: active && zones.some((z) => z.coreBlocked === 'exit_east') ? 'BLOCKED' : 'OPEN',
      affectedAgents,
      reroutedAgents: this.reroutedAgentCount
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // LIVE ENVIRONMENTAL TELEMETRY (computed from actual simulation state)
  // ════════════════════════════════════════════════════════════════════════

  getSmokeExposureTelemetry() {
    return { ...this.smokeTelemetry };
  }

  updateSmokeTelemetry(interval = 0.5) {
    const affectedFloors = this.hvacFailureFloors || new Set();
    const fires = [];
    if (this.fireSystem && this.fireSystem.activeFires) {
      this.fireSystem.activeFires.forEach((f) => {
        if (f.basePos) fires.push({ ...f.basePos, floor: f.floor });
      });
    }
    const agents = (this.agentCrowd && this.agentCrowd.agents)
      ? this.agentCrowd.agents.filter((a) => a.state !== 'SAFE' && !a.isEvacuated)
      : [];

    let rateSum = 0;
    let exposed = 0;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      let maxRate = 0;
      for (let f = 0; f < fires.length; f++) {
        const fire = fires[f];
        if (Number(fire.floor) !== Number(a.floor)) continue;
        const d = Math.hypot((a.x || 0) - (fire.x || 0), (a.z || 0) - (fire.z || 0));
        const hvacMult = affectedFloors.has(Number(a.floor)) ? 2.0 : 1.0;
        if (d < 9.0) maxRate = Math.max(maxRate, (9.0 - d) * 1.5 * hvacMult);
      }
      rateSum += maxRate;
      if (maxRate > 0) exposed++;
    }

    this.smokeTelemetry = {
      avgRate: agents.length > 0 ? rateSum / agents.length : 0,
      cumulativeRate: this.smokeTelemetry.cumulativeRate + rateSum * interval,
      agentsExposed: exposed,
      multiplier: affectedFloors.size > 0 ? 2.0 : 1.0
    };
  }

  /** Count rerouted occupants on the collapse floor (telemetry). */
  _countCollapseReroutes(assignments) {
    const zones = this.structuralCollapseZones && this.structuralCollapseZones.length ? this.structuralCollapseZones : (this.manualStructuralCollapse ? [this.manualStructuralCollapse] : []);
    if (!zones.length || !this.agentCrowd || !this.agentCrowd.agents || !assignments) return;
    const floors = new Set(zones.map((z) => z.floor));
    const agentMap = new Map(this.agentCrowd.agents.map((a) => [a.id, a]));
    let count = 0;
    assignments.forEach((as) => {
      const agent = agentMap.get(as.agentId);
      if (agent && floors.has(Number(agent.floor))) count++;
    });
    this.reroutedAgentCount += count;
  }

  animate = () => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

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
      // Dynamic boundary enforcement on orbit target (prevents panning into empty void)
      if (this.targetBounds) {
        const tb = this.targetBounds;
        this.controls.target.x = Math.max(tb.minX, Math.min(tb.maxX, this.controls.target.x));
        this.controls.target.z = Math.max(tb.minZ, Math.min(tb.maxZ, this.controls.target.z));
        this.controls.target.y = Math.max(tb.minY, Math.min(tb.maxY, this.controls.target.y));
      }

      // Prevent camera from dipping underneath terrain
      if (this.camera && this.camera.position.y < 1.5) {
        this.camera.position.y = 1.5;
      }

      this.controls.update();
    }

    if (this.fireSystem) {
      this.fireSystem.update(delta, this.camera);

      // Multi-hazard live effects — driven by the EXISTING animation loop
      if (this.powerFailureState.active) {
        this.updateEmergencyLights(delta);
        if (this.building && this.building.updateZonePowerAnimations) {
          this.building.updateZonePowerAnimations(performance.now() * 0.001);
        }
      }
      if (this.structuralCollapseState.active) this.updateCollapseDust(delta);
      this._smokeTelemetryTimer += delta;
      if (this._smokeTelemetryTimer > 0.5) {
        this.updateSmokeTelemetry(this._smokeTelemetryTimer);
        this._smokeTelemetryTimer = 0;
      }
    }

    if (this.building && this.building.update) {
      this.building.update(delta);
    }

    if (this.campusSite && this.campusSite.update) {
      this.campusSite.update(delta);
    }

    if (this.emergencyManager) {
      const speed = this.isSimulating ? (this.simSpeed || 1.0) : 1.0;
      this.emergencyManager.update(delta, speed);
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

        // When evacuation is completed, permanently halt simulation so occupants remain safe outside!
        if (stats.isCompleted || (stats.inTransit === 0 && stats.total > 0)) {
          this.isSimulating = false;
          this.evacuationCompleted = true;
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

  dispatchEmergency(targetGateId = null, forceRestart = false) {
    if (this.emergencyManager) {
      const fireLocations = [];
      if (this.fireSystem && this.fireSystem.activeFires) {
        this.fireSystem.activeFires.forEach((f, rId) => {
          if (f.basePos) fireLocations.push({ ...f.basePos, roomId: rId, floor: f.floor });
        });
      }
      this.emergencyManager.dispatch(targetGateId, fireLocations, forceRestart);
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

  zoomIn(delta = 6) {
    if (!this.camera || !this.controls) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const dist = offset.length();
    const newDist = Math.max(10, dist - delta);
    offset.setLength(newDist);
    this.camera.position.addVectors(this.controls.target, offset);
    this.controls.update();
  }

  zoomOut(delta = 6) {
    if (!this.camera || !this.controls) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const dist = offset.length();
    const newDist = Math.min(600, dist + delta);
    offset.setLength(newDist);
    this.camera.position.addVectors(this.controls.target, offset);
    this.controls.update();
  }

  panLeft(delta = 6) {
    if (!this.camera || !this.controls) return;
    const forward = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).setY(0).normalize();
    const left = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
    const step = left.multiplyScalar(delta);
    this.camera.position.add(step);
    this.controls.target.add(step);
    this.controls.update();
  }

  panRight(delta = 6) {
    if (!this.camera || !this.controls) return;
    const forward = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).setY(0).normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    const step = right.multiplyScalar(delta);
    this.camera.position.add(step);
    this.controls.target.add(step);
    this.controls.update();
  }

  moveForward(delta = 6) {
    if (!this.camera || !this.controls) return;
    const forward = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).setY(0).normalize();
    const step = forward.multiplyScalar(delta);
    this.camera.position.add(step);
    this.controls.target.add(step);
    this.controls.update();
  }

  moveBackward(delta = 6) {
    if (!this.camera || !this.controls) return;
    const backward = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).setY(0).normalize();
    const step = backward.multiplyScalar(delta);
    this.camera.position.add(step);
    this.controls.target.add(step);
    this.controls.update();
  }

  rotateCamera(deg = 45) {
    if (!this.camera || !this.controls) return;
    const rad = THREE.MathUtils.degToRad(deg);
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rad);
    this.camera.position.addVectors(this.controls.target, offset);
    this.controls.update();
  }

  getCameraYaw() {
    if (!this.camera || !this.controls) return 0;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    let angleRad = Math.atan2(offset.x, offset.z);
    let deg = THREE.MathUtils.radToDeg(angleRad);
    if (deg < 0) deg += 360;
    return deg;
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
    if (this.campusSite) {
      this.campusSite.dispose();
    }
    if (this.emergencyManager) {
      this.emergencyManager.dispose();
    }

    // ── Multi-hazard resource cleanup (no memory leaks) ──
    if (this.emergencyLightGroup) {
      this.scene.remove(this.emergencyLightGroup);
      this.emergencyLightGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      this.emergencyLightGroup = null;
    }
    this.emergencyPulseLights.forEach((l) => {
      this.scene.remove(l);
      if (typeof l.dispose === 'function') l.dispose();
    });
    this.emergencyPulseLights = [];
    if (this._emergencySignTex) this._emergencySignTex.dispose();
    if (this.structuralRubbleGroup) {
      this.scene.remove(this.structuralRubbleGroup);
      (this._collapseSlabGeos || []).forEach((g) => g.dispose());
      if (this._collapseBlockGeo) this._collapseBlockGeo.dispose();
      if (this._collapseRebarGeo) this._collapseRebarGeo.dispose();
      if (this._collapseDustGeo) this._collapseDustGeo.dispose();
      (this._collapseMaterials || []).forEach((m) => m.dispose());
      if (this._collapseRebarMat) this._collapseRebarMat.dispose();
      if (this._collapseDustMat) this._collapseDustMat.dispose();
      this.structuralRubbleGroup = null;
    }

    if (this.renderer && this.renderer.domElement && this.container && this.container.contains(this.renderer.domElement)) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
