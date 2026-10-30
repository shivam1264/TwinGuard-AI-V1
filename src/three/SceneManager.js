import { AIEngine } from "../ai/index.js";
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
    const width = this.container.clientWidth || window.innerWidth || 1200;
    const height = this.container.clientHeight || (window.innerHeight - 56) || 800;
    // Set near to 0.4 and far to 18000 for full architectural depth and giant sky vault without z-fighting
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.4, 25000);

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
    this.scene.fog = new THREE.FogExp2(0xd6e4f0, 0.0012);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minPolarAngle = 0.02;
    this.controls.maxPolarAngle = Math.PI * 0.49; // Clamped above ground plane
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 280;

    // Architectural Natural Daylight Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Warm Directional Sunlight with optimized shadow map
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 2.2);
    sunLight.position.set(45, 68, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 320;
    sunLight.shadow.camera.left = -110;
    sunLight.shadow.camera.right = 110;
    sunLight.shadow.camera.top = 110;
    sunLight.shadow.camera.bottom = -110;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Soft Ambient Daylight Fill Light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-50, 42, -45);
    fillLight.castShadow = false;
    this.scene.add(fillLight);

    // Natural Sky & Earth Bounce Light
    const hemiLight = new THREE.HemisphereLight(0x7bb3e8, 0x64748b, 0.75);
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
    this.fireSystem = new FireParticles(this.scene, (parentRoomId, targetRoomId) => {
      this.triggerFire(targetRoomId);
    });
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

    // Professional Architectural 3/4 Perspective Framing (Building occupies ~70% of viewport height)
    let targetPos = new THREE.Vector3(-44, 18, 58);
    let targetLook = new THREE.Vector3(0, 17, 0);

    if (presetName === 'HERO_VIEW' || presetName === 'DEFAULT') {
      // Golden Ratio 3/4 Perspective framing south plaza, entrance canopy, and west corner
      targetPos.set(-44, 18, 58);
      targetLook.set(0, 17, 0);
    } else if (presetName === 'CUTAWAY_VIEW') {
      targetPos.set(-36, 18, 50);
      targetLook.set(0, 17, 0);
    } else if (presetName === 'FULL_BUILDING') {
      targetPos.set(-52, 24, 68);
      targetLook.set(0, 17, 0);
    } else if (presetName === 'SOUTH_FACADE') {
      targetPos.set(0, 18, 60);
      targetLook.set(0, 17, 0);
    } else if (presetName === 'TOP_DOWN') {
      targetPos.set(0, 135, 1);
      targetLook.set(0, 0, 0);
    } else if (presetName === 'AXONOMETRIC') {
      targetPos.set(56, 52, 60);
      targetLook.set(0, 17, 0);
    } else if (presetName === 'SECTION') {
      targetPos.set(0, 18, 55);
      targetLook.set(0, 17, 0);
    } else if (presetName === 'ENTRANCE') {
      targetPos.set(-8, 5.5, 34);
      targetLook.set(0, 3.5, 20);
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
    } else if (presetName === 'FOCUS_HYDRANT') {
      targetPos.set(24, 12, 54);
      targetLook.set(24, 0.5, 38);
    } else if (presetName === 'FOCUS_MUSTER_A') {
      targetPos.set(0, 14, 66);
      targetLook.set(0, 0.5, 48);
    } else if (presetName === 'FOCUS_HELIPAD') {
      targetPos.set(0, 52, 22);
      targetLook.set(0, 38.5, 0);
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

    if (mode === 'EXPLODED') {
      this.setCameraPreset('AXONOMETRIC');
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
    this.fireSystem.spawnFire(roomId, { x: room.center.x, y: fireY, z: room.center.z }, room);
    this.navGrid.setFireZone(room.center.x, room.center.z, 6.5);

    // Register with Scenario Engine
    this.scenarioEngine.triggerRoomFire(roomId, 1.0);

    // If currently simulating, perform real-time dynamic rerouting!
    if (this.isSimulating) {
      if (this.routeOptimizer) {
        const newPlan = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
        if (this.agentCrowd.rerouteAgents) {
          this.agentCrowd.rerouteAgents(newPlan.assignments);
        } else {
          this.agentCrowd.assignRoutes(newPlan.assignments);
        }
        if (this.renderRouteOverlays) this.renderRouteOverlays(newPlan.assignments);
        if (this.updateExitHoloBadges) this.updateExitHoloBadges(newPlan.exitStats);
      } else if (this.crowdOptimizer) {
        const fireLocations = [];
        this.fireSystem.activeFires.forEach(f => fireLocations.push(f.basePos));
        const activeScenario = AIEngine.getActiveScenario();
        const blockedExitIds = activeScenario?.structuralFailures?.blockedExits || [];
        const activeStrategy = AIEngine.getActiveStrategy();
        const strategyType = activeStrategy?.type || 'LOAD_BALANCED';
        const optimizationResult = this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations, blockedExitIds, strategyType);
        this.agentCrowd.assignRoutes(optimizationResult.assignments);
      }
    }
  }

  blockStairwell(coreName, floorNum = null) {
    if (this.scenarioEngine && this.scenarioEngine.blockStairwellCore) {
      this.scenarioEngine.blockStairwellCore(coreName, floorNum);
    }

    // If currently simulating, recalculate paths dynamically!
    if (this.isSimulating && this.routeOptimizer) {
      const newPlan = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
      if (this.agentCrowd.rerouteAgents) {
        this.agentCrowd.rerouteAgents(newPlan.assignments);
      } else {
        this.agentCrowd.assignRoutes(newPlan.assignments);
      }
      if (this.renderRouteOverlays) this.renderRouteOverlays(newPlan.assignments);
      if (this.updateExitHoloBadges) this.updateExitHoloBadges(newPlan.exitStats);
      return newPlan;
    }
    return null;
  }

  startEvacuation(scenario = null, strategy = null) {
    this.isSimulating = true;
    this.elapsedSeconds = 0;

    let optimizationResult;
    if (scenario || strategy || !this.routeOptimizer) {
      const fireLocations = [];
      this.fireSystem.activeFires.forEach(f => {
        fireLocations.push(f.basePos);
      });

      const activeScenario = scenario || AIEngine.getActiveScenario();
      const blockedExitIds = activeScenario?.structuralFailures?.blockedExits || [];
      const activeStrategy = strategy || AIEngine.getActiveStrategy();
      const strategyType = activeStrategy?.type || 'LOAD_BALANCED';

      if (this.crowdOptimizer) {
        optimizationResult = this.crowdOptimizer.optimizeRoutes(this.agentCrowd.agents, fireLocations, blockedExitIds, strategyType);
      } else if (this.routeOptimizer) {
        optimizationResult = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
      }
    } else {
      optimizationResult = this.routeOptimizer.optimizeEvacuationRoutes(this.agentCrowd.agents);
    }
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

  reset(rooms = null) {
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

    const targetRooms = rooms || (this.building ? this.building.roomsData : []);
    this.agentCrowd.spawnAgentsForRooms(targetRooms);
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
      this.controls.update();
    }

    if (this.fireSystem) {
      this.fireSystem.update(delta);
    }

    if (this.building && this.building.update) {
      this.building.update(delta);
    }

    if (this.agentCrowd) {
      const fireLocations = [];
      if (this.fireSystem && this.fireSystem.activeFires) {
        this.fireSystem.activeFires.forEach(f => fireLocations.push(f.basePos));
      }
      const stats = this.agentCrowd.update(delta, this.isSimulating ? this.simSpeed : 0, fireLocations);

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
    if (this.renderer && this.renderer.domElement && this.container && this.container.contains(this.renderer.domElement)) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
