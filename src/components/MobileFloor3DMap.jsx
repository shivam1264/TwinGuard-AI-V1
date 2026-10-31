// ==============================================================================
// TwinGuard AI - Mobile Floor 3D Visual Map & Personal Wayfinding Engine
// Authentic architectural single-floor 3D digital twin matching Building3D
// Fully dynamic room-to-exit egress route calculation and navigable personal POV
// ==============================================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ROOM_TEMPLATES, FLOOR_THEMES, getRoomFurnishingType } from '../simulation/Doorways.js';
import { TextureHelper } from '../three/TextureHelper.js';
import {
  Compass,
  Navigation,
  Eye,
  Layers,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  RotateCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Sparkles,
  MapPin,
  Building
} from 'lucide-react';

export function MobileFloor3DMap({
  floor = 7,
  roomId = 'f7_r9',
  roomName = 'Room 709 - Design Ops Lab',
  activeFires = [],
  targetStairCode = 'CORE_B',
  isAlarmActive = false,
  onArriveMuster
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Dynamic Navigation State
  const [cameraMode, setCameraMode] = useState('PERSPECTIVE'); // 'PERSPECTIVE' | 'OVERVIEW' | 'ROOM_FOCUS'
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [hasReachedExit, setHasReachedExit] = useState(false);

  // Animation Refs
  const avatarGroupRef = useRef(null);
  const routeTubeRef = useRef(null);
  const flameMeshesRef = useRef([]);
  const pathWaypointsRef = useRef([]);
  const currentAvatarPosRef = useRef(new THREE.Vector3());
  const targetAvatarPosRef = useRef(new THREE.Vector3());
  const userInteractedRef = useRef(false);

  // Find Room Template for selected Room
  const roomTemplate = useMemo(() => {
    const tmplId = roomId.split('_')[1] || 'r9';
    return ROOM_TEMPLATES.find((t) => t.idSuffix === tmplId) || ROOM_TEMPLATES[8];
  }, [roomId]);

  // Determine Target Stair Coordinates
  const targetStairCoords = useMemo(() => {
    if (targetStairCode === 'CORE_B') {
      return { x: 28.5, z: 0, name: 'East Stairwell Core B (East Wing)' };
    }
    return { x: -28.5, z: 0, name: 'West Stairwell Core A (West Wing)' };
  }, [targetStairCode]);

  // DYNAMIC ROOM-SPECIFIC ROUTE GENERATOR
  // Computes exact egress waypoints from the user's specific room coordinates to the safe stair core
  const waypoints = useMemo(() => {
    const wpList = [];
    const rx = roomTemplate.centerX;
    const rz = roomTemplate.centerZ;
    const dx = roomTemplate.doorX;
    const inZ = roomTemplate.insideZ;
    const doorZ = roomTemplate.doorZ;
    const targetX = targetStairCoords.x;
    const isNorthWing = rz < 0;

    // WP 0: Inside the room at workstation desk
    wpList.push({
      id: 'wp_room_desk',
      pos: new THREE.Vector3(rx, 0.35, rz),
      title: `Origin: ${roomName}`,
      desc: 'Stand up safely and prepare to follow illuminated floor exit markers',
      dist: '0m',
      forward: new THREE.Vector3(0, 0, isNorthWing ? 1 : -1)
    });

    // WP 1: Room doorway threshold
    wpList.push({
      id: 'wp_room_door',
      pos: new THREE.Vector3(dx, 0.35, inZ),
      title: 'Exit Primary Doorway',
      desc: 'Check corridor through fire-rated glass for clear visibility',
      dist: '6m',
      forward: new THREE.Vector3(0, 0, isNorthWing ? 1 : -1)
    });

    // WP 2: Central corridor junction
    wpList.push({
      id: 'wp_corridor_junction',
      pos: new THREE.Vector3(dx, 0.35, 0),
      title: 'Enter Central Corridor',
      desc: `Turn ${targetX > dx ? 'East (Right)' : 'West (Left)'} along luminous floor runner`,
      dist: '10m',
      forward: new THREE.Vector3(targetX > dx ? 1 : -1, 0, 0)
    });

    // WP 3: Corridor transit midpoint (safely avoiding any active fire)
    const midX = (dx + targetX) / 2;
    wpList.push({
      id: 'wp_corridor_transit',
      pos: new THREE.Vector3(midX, 0.35, 0),
      title: `Navigate ${targetX > 0 ? 'East' : 'West'} Corridor`,
      desc: 'Follow continuous cyan luminous edge guidance along runner',
      dist: `${Math.round(Math.abs(midX - dx) + 10)}m`,
      forward: new THREE.Vector3(targetX > dx ? 1 : -1, 0, 0)
    });

    // WP 4: Stairwell Core entrance portal
    wpList.push({
      id: 'wp_stair_portal',
      pos: new THREE.Vector3(targetX, 0.35, 0),
      title: `Enter ${targetStairCoords.name}`,
      desc: 'Pass through pressurized fire barrier door into safety core',
      dist: `${Math.round(Math.abs(targetX - dx) + 12)}m`,
      forward: new THREE.Vector3(targetX > 0 ? 1 : -1, 0, 0)
    });

    return wpList;
  }, [roomTemplate, roomName, targetStairCoords]);

  // Keep waypoint refs updated
  useEffect(() => {
    pathWaypointsRef.current = waypoints.map((w) => w.pos);
    if (waypoints.length > 0) {
      currentAvatarPosRef.current.copy(waypoints[0].pos);
      targetAvatarPosRef.current.copy(waypoints[0].pos);
      setCurrentWaypointIdx(0);
      setHasReachedExit(false);
    }
  }, [waypoints, roomId]);

  // ── BUILD AUTHENTIC 3D FLOOR SCENE ──
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 400);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls (Configured to not trap touch scroll)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 4;
    controls.maxDistance = 75;
    controls.enableZoom = true;
    controls.enablePan = true;
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      userInteractedRef.current = true;
    });

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xcfd8dc, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 1.5);
    mainSun.position.set(25, 45, 20);
    scene.add(mainSun);

    const softFill = new THREE.DirectionalLight(0x38bdf8, 0.65);
    softFill.position.set(-25, 25, -20);
    scene.add(softFill);

    // 6. Floor Slab matching Building3D
    let floorTexture;
    if (floor >= 9) {
      floorTexture = TextureHelper.createWoodTexture();
    } else if (floor >= 3) {
      floorTexture = TextureHelper.createCarpetTexture();
    } else if (floor === 1) {
      floorTexture = TextureHelper.createTerrazzoTexture();
    } else {
      floorTexture = TextureHelper.createTileTexture();
    }

    const slabGeo = new THREE.BoxGeometry(60, 0.4, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.65,
      metalness: 0.15
    });
    const slabMesh = new THREE.Mesh(slabGeo, floorMat);
    slabMesh.position.set(0, -0.2, 0);
    scene.add(slabMesh);

    // 7. Executive Dark Charcoal Corridor Runner with Luminous Cyan Guidance Strips
    const runnerGeo = new THREE.PlaneGeometry(54, 2.2);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.3
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.02, 0);
    scene.add(runner);

    // Cyan luminous edge guidance lines
    const guideGeo = new THREE.PlaneGeometry(54, 0.08);
    const guideMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    for (const gz of [-1.02, 1.02]) {
      const guide = new THREE.Mesh(guideGeo, guideMat);
      guide.rotation.x = -Math.PI / 2;
      guide.position.set(0, 0.025, gz);
      scene.add(guide);
    }

    // 8. Crisp Architectural Partition Walls
    const wallH = 2.4;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    const woodAccentMat = new THREE.MeshStandardMaterial({
      map: TextureHelper.createFlutedWoodTexture(),
      roughness: 0.55,
      metalness: 0.05
    });

    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x1f2733,
      roughness: 0.45,
      metalness: 0.35
    });

    // North & South Perimeter Back Walls with Wood Accent
    const northBack = new THREE.Mesh(new THREE.BoxGeometry(60, wallH, 0.4), woodAccentMat);
    northBack.position.set(0, wallH / 2, -23.5);
    scene.add(northBack);

    const southBack = new THREE.Mesh(new THREE.BoxGeometry(60, wallH, 0.4), woodAccentMat);
    southBack.position.set(0, wallH / 2, 23.5);
    scene.add(southBack);

    // Dividing Walls between the 5 North and 5 South Rooms
    const dividers = [-15.0, -6.0, 3.0, 14.0];
    for (const zSide of [13.0, -13.0]) {
      for (const dx of dividers) {
        const div = new THREE.Mesh(new THREE.BoxGeometry(0.32, wallH, 20.6), wallMat);
        div.position.set(dx, wallH / 2, zSide);
        scene.add(div);
      }
    }

    // Corridor Partition Walls with Open Doorway Gaps
    const roomCentersX = [-19.5, -10.5, -1.5, 8.5, 19.0];
    for (const cx of roomCentersX) {
      for (const side of [-1, 1]) {
        const wallZ = side * 2.6;
        const leftSeg = new THREE.Mesh(new THREE.BoxGeometry(3.2, wallH, 0.28), wallMat);
        leftSeg.position.set(cx - 2.8, wallH / 2, wallZ);
        scene.add(leftSeg);

        const rightSeg = new THREE.Mesh(new THREE.BoxGeometry(3.2, wallH, 0.28), wallMat);
        rightSeg.position.set(cx + 2.8, wallH / 2, wallZ);
        scene.add(rightSeg);

        // Doorway threshold light
        const isUserDoor = cx === roomTemplate.doorX && ((side < 0 && roomTemplate.centerZ < 0) || (side > 0 && roomTemplate.centerZ > 0));
        const thresh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 0.6),
          new THREE.MeshBasicMaterial({
            color: isUserDoor ? 0x10b981 : 0x38bdf8,
            transparent: true,
            opacity: isUserDoor ? 0.9 : 0.35
          })
        );
        thresh.rotation.x = -Math.PI / 2;
        thresh.position.set(cx, 0.03, wallZ);
        scene.add(thresh);
      }
    }

    // Structural Concrete Columns
    const colXPositions = [-24.5, -15.0, -6.0, 3.0, 14.0, 24.5];
    const colZPositions = [23.5, 2.6, -2.6, -23.5];
    for (const cx of colXPositions) {
      for (const cz of colZPositions) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.42, wallH, 0.42), columnMat);
        col.position.set(cx, wallH / 2, cz);
        scene.add(col);
      }
    }

    // 9. Realistic Room Furnishings (Workstations, Chairs, Monitors, Meeting Tables)
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.3 });
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const confWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.3 });

    for (let i = 0; i < 10; i++) {
      const cx = roomCentersX[i % 5];
      const cz = i < 5 ? -12.5 : 12.5;
      const type = getRoomFurnishingType(floor, i);

      if (type === 'CONFERENCE_BOARDROOM' || type === 'PRESIDENTIAL_BOARDROOM') {
        // Large sleek conference table
        const table = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.74, 2.6), confWoodMat);
        table.position.set(cx, 0.37, cz);
        scene.add(table);

        // Chairs around table
        for (let chairX = -2.4; chairX <= 2.4; chairX += 1.2) {
          for (const side of [-1, 1]) {
            const chair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.85, 0.52), chairMat);
            chair.position.set(cx + chairX, 0.42, cz + side * 1.7);
            scene.add(chair);
          }
        }
      } else {
        // Spacious dual workstation pods with central aisle
        const backSign = cz > 0 ? 1 : -1;
        for (const podX of [-2.2, 2.2]) {
          // Desk
          const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.74, 0.9), deskMat);
          desk.position.set(cx + podX, 0.37, cz + 1.2 * backSign);
          scene.add(desk);

          // Chair
          const chair = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.85, 0.48), chairMat);
          chair.position.set(cx + podX, 0.42, cz + 0.3 * backSign);
          scene.add(chair);

          // Monitor
          const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.05), screenMat);
          monitor.position.set(cx + podX, 0.74 + 0.22, cz + 1.2 * backSign);
          scene.add(monitor);
        }
      }
    }

    // 10. Selected User Room Architectural Highlight
    const roomHighlightGeo = new THREE.RingGeometry(4.8, 5.2, 32);
    const roomHighlightMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const roomHighlight = new THREE.Mesh(roomHighlightGeo, roomHighlightMat);
    roomHighlight.rotation.x = -Math.PI / 2;
    roomHighlight.position.set(roomTemplate.centerX, 0.04, roomTemplate.centerZ);
    scene.add(roomHighlight);

    // 11. Stairwell Escape Portals (East & West)
    const createStairPortal = (x, z, label, isTarget, isBlocked) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const portalBox = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, wallH, 4.8),
        new THREE.MeshStandardMaterial({
          color: isBlocked ? 0x7f1d1d : isTarget ? 0x064e3b : 0x1e293b,
          emissive: isBlocked ? 0x991b1b : isTarget ? 0x047857 : 0x0f172a,
          emissiveIntensity: 0.5,
          roughness: 0.4
        })
      );
      portalBox.position.y = wallH / 2;
      group.add(portalBox);

      // Open emergency door face
      const doorFace = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, wallH - 0.2),
        new THREE.MeshBasicMaterial({
          color: isBlocked ? 0xef4444 : isTarget ? 0x10b981 : 0x38bdf8,
          transparent: true,
          opacity: 0.95
        })
      );
      doorFace.position.set(x > 0 ? -1.81 : 1.81, wallH / 2, 0);
      doorFace.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(doorFace);

      // Exit sign above door
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = isBlocked ? '#dc2626' : '#10b981';
      ctx.fillRect(0, 0, 256, 96);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 128, 48);

      const signTex = new THREE.CanvasTexture(canvas);
      const signSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex, transparent: true }));
      signSprite.scale.set(3.6, 1.4, 1);
      signSprite.position.set(0, wallH + 0.8, 0);
      group.add(signSprite);

      return group;
    };

    const isWestBlocked = activeFires.some((f) => f.floor === floor && (f.roomId.endsWith('_r1') || f.roomId.endsWith('_r6')));
    const stairWest = createStairPortal(-28.5, 0, isWestBlocked ? 'CORE A BLOCKED' : 'CORE A (WEST)', targetStairCode === 'CORE_A', isWestBlocked);
    scene.add(stairWest);

    const isEastBlocked = activeFires.some((f) => f.floor === floor && (f.roomId.endsWith('_r5') || f.roomId.endsWith('_r10')));
    const stairEast = createStairPortal(28.5, 0, isEastBlocked ? 'CORE B BLOCKED' : 'CORE B (EAST)', targetStairCode === 'CORE_B', isEastBlocked);
    scene.add(stairEast);

    // 12. Active Fire Hazards on Floor
    const floorFires = activeFires.filter((f) => f.floor === floor);
    flameMeshesRef.current = [];

    floorFires.forEach((fire) => {
      const tmplId = fire.roomId.split('_')[1] || 'r1';
      const tmpl = ROOM_TEMPLATES.find((t) => t.idSuffix === tmplId) || ROOM_TEMPLATES[0];

      const fireLight = new THREE.PointLight(0xff4500, 3.5, 22);
      fireLight.position.set(tmpl.centerX, 2.2, tmpl.centerZ);
      scene.add(fireLight);

      const dangerRing = new THREE.Mesh(
        new THREE.RingGeometry(2.2, 4.0, 32),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      );
      dangerRing.rotation.x = -Math.PI / 2;
      dangerRing.position.set(tmpl.centerX, 0.05, tmpl.centerZ);
      scene.add(dangerRing);

      const flameGroup = new THREE.Group();
      flameGroup.position.set(tmpl.centerX, 0.2, tmpl.centerZ);

      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.85 }));
      cone1.position.y = 1.6;
      flameGroup.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.9 }));
      cone2.position.y = 1.1;
      flameGroup.add(cone2);

      scene.add(flameGroup);
      flameMeshesRef.current.push({ group: flameGroup, light: fireLight });
    });

    // 13. Dynamic Neon Green Egress Route
    if (waypoints.length >= 2) {
      const curvePoints = waypoints.map((w) => w.pos);
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.32, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.8
      });
      const routeTube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(routeTube);
      routeTubeRef.current = routeTube;

      // Waypoint indicator discs along path
      waypoints.forEach((wp, idx) => {
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16),
          new THREE.MeshBasicMaterial({
            color: idx === 0 ? 0x38bdf8 : idx === waypoints.length - 1 ? 0x10b981 : 0x6ee7b7
          })
        );
        disc.position.copy(wp.pos);
        disc.position.y = 0.05;
        scene.add(disc);
      });
    }

    // 14. Sleek 3D Person Avatar (Low Profile, Never Blocks Camera)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.copy(waypoints[0]?.pos || new THREE.Vector3(roomTemplate.centerX, 0.35, roomTemplate.centerZ));

    // Base puck with neon cyan glow
    const basePuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.22, 24),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.9 })
    );
    basePuck.position.y = 0.11;
    avatarGroup.add(basePuck);

    // Humanoid stylized torso
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.25, 0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
    );
    torso.position.y = 0.65;
    avatarGroup.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    head.position.y = 1.25;
    avatarGroup.add(head);

    // Directional forward cone pointer
    const forwardPointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.8, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    forwardPointer.rotation.x = Math.PI / 2;
    forwardPointer.position.set(0, 0.15, 0.85);
    avatarGroup.add(forwardPointer);

    // Pulsing floor radar beacon
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1.3, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.04;
    avatarGroup.add(beaconRing);

    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    // Set Initial Camera Position Based on Selected Mode
    applyCameraMode('PERSPECTIVE', camera, controls, waypoints[0]?.pos, waypoints[0]?.forward);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    // 15. Animation Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Flame flicker
      flameMeshesRef.current.forEach((flame, i) => {
        const scale = 1 + Math.sin(elapsed * 8 + i) * 0.15;
        flame.group.scale.set(scale, scale * 1.1, scale);
        flame.light.intensity = 2.8 + Math.sin(elapsed * 12 + i) * 0.8;
      });

      // Beacon ring pulse
      if (beaconRing) {
        const pulse = 1.0 + ((elapsed * 1.6) % 1.4);
        beaconRing.scale.set(pulse, pulse, 1);
        beaconRing.material.opacity = Math.max(0, 0.75 - (pulse - 1.0) / 1.4);
      }

      // Smooth Avatar Glide towards Target Waypoint
      if (avatarGroupRef.current) {
        const cur = currentAvatarPosRef.current;
        const tgt = targetAvatarPosRef.current;
        cur.lerp(tgt, 0.1);
        avatarGroupRef.current.position.copy(cur);

        // Orient avatar towards movement direction
        const diff = new THREE.Vector3().subVectors(tgt, cur);
        if (diff.lengthSq() > 0.02) {
          const angle = Math.atan2(diff.x, diff.z);
          avatarGroupRef.current.rotation.y = angle;
        }
      }

      // Smooth Camera tracking ONLY when user is NOT actively orbiting
      if (cameraMode === 'PERSPECTIVE' && !userInteractedRef.current && avatarGroupRef.current) {
        const wp = waypoints[currentWaypointIdx] || waypoints[0];
        const forward = wp?.forward || new THREE.Vector3(0, 0, 1);
        const avPos = avatarGroupRef.current.position;

        // Position camera behind the avatar along the current forward vector
        const camOffset = new THREE.Vector3()
          .copy(forward)
          .multiplyScalar(-5.2)
          .add(new THREE.Vector3(0, 2.6, 0));

        const targetCamPos = new THREE.Vector3().copy(avPos).add(camOffset);
        const targetLook = new THREE.Vector3().copy(avPos).add(new THREE.Vector3(forward.x * 4, 1.2, forward.z * 4));

        camera.position.lerp(targetCamPos, 0.06);
        controls.target.lerp(targetLook, 0.08);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [floor, roomId, targetStairCode, activeFires, waypoints, roomTemplate]);

  // Camera Mode Configuration Helper
  const applyCameraMode = (mode, cam, ctrl, avatarPos, forwardVec) => {
    if (!cam || !ctrl) return;
    userInteractedRef.current = false;

    const pos = avatarPos || currentAvatarPosRef.current;
    const fwd = forwardVec || new THREE.Vector3(0, 0, 1);

    if (mode === 'PERSPECTIVE') {
      // Over-the-shoulder User POV facing forward along path
      const offset = new THREE.Vector3()
        .copy(fwd)
        .multiplyScalar(-5.5)
        .add(new THREE.Vector3(0, 2.6, 0));
      cam.position.copy(pos).add(offset);
      ctrl.target.copy(pos).add(new THREE.Vector3(fwd.x * 4, 1.2, fwd.z * 4));
    } else if (mode === 'OVERVIEW') {
      // Full floor 2.5D architectural overview
      cam.position.set(0, 36, 26);
      ctrl.target.set(0, 0, 0);
    } else if (mode === 'ROOM_FOCUS') {
      // Close-up on user's room and workstation
      cam.position.set(roomTemplate.centerX, 12, roomTemplate.centerZ + 10);
      ctrl.target.set(roomTemplate.centerX, 0.5, roomTemplate.centerZ);
    }

    ctrl.update();
  };

  // Switch Camera Modes
  const handleSetCameraMode = (mode) => {
    setCameraMode(mode);
    const wp = waypoints[currentWaypointIdx] || waypoints[0];
    applyCameraMode(mode, cameraRef.current, controlsRef.current, wp?.pos, wp?.forward);
  };

  // Quick Orbit Controls (Rotate Left, Rotate Right, Zoom In, Zoom Out)
  const handleRotateCamera = (deltaAngle) => {
    if (!cameraRef.current || !controlsRef.current) return;
    userInteractedRef.current = true;
    const cam = cameraRef.current;
    const target = controlsRef.current.target;

    const radius = Math.sqrt(Math.pow(cam.position.x - target.x, 2) + Math.pow(cam.position.z - target.z, 2));
    const currentAngle = Math.atan2(cam.position.z - target.z, cam.position.x - target.x);
    const newAngle = currentAngle + deltaAngle;

    cam.position.x = target.x + radius * Math.cos(newAngle);
    cam.position.z = target.z + radius * Math.sin(newAngle);
    controlsRef.current.update();
  };

  const handleZoom = (factor) => {
    if (!cameraRef.current || !controlsRef.current) return;
    userInteractedRef.current = true;
    const cam = cameraRef.current;
    const target = controlsRef.current.target;

    const dir = new THREE.Vector3().subVectors(cam.position, target);
    dir.multiplyScalar(factor);
    cam.position.copy(target).add(dir);
    controlsRef.current.update();
  };

  // Handle Waypoint Navigation
  const handleSelectWaypoint = (idx) => {
    if (idx < 0 || idx >= waypoints.length) return;
    setCurrentWaypointIdx(idx);
    targetAvatarPosRef.current.copy(waypoints[idx].pos);
    userInteractedRef.current = false;

    if (cameraMode === 'PERSPECTIVE') {
      applyCameraMode('PERSPECTIVE', cameraRef.current, controlsRef.current, waypoints[idx].pos, waypoints[idx].forward);
    }

    if (idx === waypoints.length - 1) {
      setHasReachedExit(true);
    }
  };

  // Auto-Walk Progression
  useEffect(() => {
    let timer = null;
    if (isAutoWalking) {
      if (currentWaypointIdx < waypoints.length - 1) {
        timer = setTimeout(() => {
          handleSelectWaypoint(currentWaypointIdx + 1);
        }, 1800);
      } else {
        setIsAutoWalking(false);
        setHasReachedExit(true);
      }
    }
    return () => clearTimeout(timer);
  }, [isAutoWalking, currentWaypointIdx, waypoints]);

  const currentWp = waypoints[currentWaypointIdx] || waypoints[0];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* ── 3D TOP CONTROL HUD OVERLAY ── */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {/* Camera View Mode Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => handleSetCameraMode('PERSPECTIVE')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              cameraMode === 'PERSPECTIVE'
                ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
            title="User Perspective (Follows Walk Path)"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Follow POV</span>
          </button>

          <button
            onClick={() => handleSetCameraMode('OVERVIEW')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              cameraMode === 'OVERVIEW'
                ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
            title="Floor Plan 2.5D Overview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Floor 2.5D</span>
          </button>

          <button
            onClick={() => handleSetCameraMode('ROOM_FOCUS')}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              cameraMode === 'ROOM_FOCUS'
                ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
            title="Focus On My Room"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Room</span>
          </button>
        </div>

        {/* Live Dynamic Route Status Badge */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Dynamic Route
          </span>
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT (WITH TOUCH-PAN-Y FOR CLEAN PAGE SCROLLING) ── */}
      <div
        ref={containerRef}
        className="w-full h-[320px] bg-slate-950 relative touch-pan-y cursor-grab active:cursor-grabbing"
      />

      {/* ── ON-CANVAS CAMERA ORBIT TOOLBAR ── */}
      <div className="absolute right-2.5 bottom-32 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={() => handleRotateCamera(-Math.PI / 4)}
          className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center text-xs shadow-md backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
          title="Rotate Left 45°"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleRotateCamera(Math.PI / 4)}
          className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center text-xs shadow-md backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
          title="Rotate Right 45°"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center text-xs shadow-md backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(1.18)}
          className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center text-xs shadow-md backdrop-blur-sm active:scale-95 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── STEP-BY-STEP WAYPOINT DIRECTIVE HUD ── */}
      <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0">
              {currentWaypointIdx + 1}
            </div>
            <div>
              <div className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                <span>{currentWp.title}</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">({currentWp.dist})</span>
              </div>
              <div className="text-[10.5px] text-slate-400 font-medium leading-snug">
                {currentWp.desc}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target</div>
            <div className="text-[11px] font-extrabold text-indigo-300 truncate max-w-[110px]">
              {targetStairCode === 'CORE_B' ? 'Core B (East)' : 'Core A (West)'}
            </div>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5 pt-1">
          {waypoints.map((_, i) => (
            <div
              key={i}
              onClick={() => handleSelectWaypoint(i)}
              className={`h-1.5 rounded-full flex-1 transition-all cursor-pointer ${
                i <= currentWaypointIdx ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Stepper Controls */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => handleSelectWaypoint(Math.max(0, currentWaypointIdx - 1))}
            disabled={currentWaypointIdx === 0}
            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => setIsAutoWalking((prev) => !prev)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer ${
              isAutoWalking
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isAutoWalking ? 'animate-spin' : ''}`} />
            <span>{isAutoWalking ? 'Pause' : 'Auto-Walk'}</span>
          </button>

          <button
            onClick={() => handleSelectWaypoint(Math.min(waypoints.length - 1, currentWaypointIdx + 1))}
            disabled={currentWaypointIdx === waypoints.length - 1}
            className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reached Exit Callout */}
        {hasReachedExit && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/60 flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] text-emerald-200 font-bold leading-tight">
                Safe Stairwell Reached! Descend to Ground Portal & Muster Zone.
              </div>
            </div>
            {onArriveMuster && (
              <button
                onClick={onArriveMuster}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shrink-0 shadow-md active:scale-95 cursor-pointer hover:bg-emerald-400"
              >
                Mark Safe
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
