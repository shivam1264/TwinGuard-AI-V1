// ==============================================================================
// TwinGuard AI - Mobile Floor 3D Visual Map & Personal Wayfinding Engine
// Lightweight, single-floor Three.js perspective navigation map for smartphones
// Features Google Maps-style dynamic green egress path and personal perspective camera
// ==============================================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ROOM_TEMPLATES, FLOOR_THEMES, getRoomDoorway } from '../simulation/Doorways.js';
import {
  Compass,
  Navigation,
  Eye,
  Layers,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export function MobileFloor3DMap({
  floor = 4,
  roomId = 'f4_r1',
  roomName = 'Room 401',
  activeFires = [],
  targetStairCode = 'CORE_A',
  isAlarmActive = false,
  onArriveMuster
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Dynamic Waypoint Navigation State
  const [cameraMode, setCameraMode] = useState('PERSPECTIVE'); // 'PERSPECTIVE' (User POV) | 'FLOOR_PLAN' (2.5D Overview)
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [hasReachedExit, setHasReachedExit] = useState(false);

  // Mesh and Object Refs for real-time animation
  const avatarGroupRef = useRef(null);
  const routeTubeRef = useRef(null);
  const flameMeshesRef = useRef([]);
  const chevronSpritesRef = useRef([]);
  const pathWaypointsRef = useRef([]);
  const currentAvatarPosRef = useRef(new THREE.Vector3());
  const targetAvatarPosRef = useRef(new THREE.Vector3());

  // Find Room Template
  const roomTemplate = useMemo(() => {
    const tmplId = roomId.split('_')[1] || 'r1';
    return ROOM_TEMPLATES.find(t => t.idSuffix === tmplId) || ROOM_TEMPLATES[0];
  }, [roomId]);

  // Determine Target Stair Coordinates
  const targetStairCoords = useMemo(() => {
    if (targetStairCode === 'CORE_B') {
      return { x: 28.5, z: 0, name: 'East Stairwell Core B (East Wing)' };
    }
    return { x: -28.5, z: 0, name: 'West Stairwell Core A (West Wing)' };
  }, [targetStairCode]);

  // Generate Waypoints: Room Center -> Doorway -> Corridor -> Target Stair
  const waypoints = useMemo(() => {
    const wpList = [];
    const rx = roomTemplate.centerX;
    const rz = roomTemplate.centerZ;
    const dx = roomTemplate.doorX;
    const inZ = roomTemplate.insideZ;
    const doorZ = roomTemplate.doorZ;
    const targetX = targetStairCoords.x;

    // WP 0: Inside Room (Origin)
    wpList.push({
      id: 'wp_room',
      pos: new THREE.Vector3(rx, 0.4, rz),
      title: 'Current Position in Room',
      desc: `Stand up safely and prepare to exit ${roomName}`,
      dist: '0m'
    });

    // WP 1: Room Doorway Threshold
    wpList.push({
      id: 'wp_door',
      pos: new THREE.Vector3(dx, 0.4, inZ),
      title: 'Exit Primary Doorway',
      desc: 'Check corridor through fire glass for smoke before opening',
      dist: '6m'
    });

    // WP 2: Central Corridor Junction
    wpList.push({
      id: 'wp_corridor_entry',
      pos: new THREE.Vector3(dx, 0.4, 0),
      title: 'Enter Central Corridor',
      desc: 'Turn toward illuminated green emergency floor strips',
      dist: '12m'
    });

    // WP 3: Corridor Mid-way Transit (avoiding fire if nearby)
    const midX = (dx + targetX) / 2;
    wpList.push({
      id: 'wp_corridor_transit',
      pos: new THREE.Vector3(midX, 0.4, 0),
      title: `Navigate ${targetX > 0 ? 'East' : 'West'} Corridor`,
      desc: 'Proceed briskly, maintain low posture if smoke is detected',
      dist: `${Math.round(Math.abs(midX - dx) + 12)}m`
    });

    // WP 4: Stairwell Entrance Portal
    wpList.push({
      id: 'wp_stair_entry',
      pos: new THREE.Vector3(targetX, 0.4, 0),
      title: `Enter ${targetStairCoords.name}`,
      desc: 'Pass through pressurized fire barrier door into safety core',
      dist: `${Math.round(Math.abs(targetX - dx) + 14)}m`
    });

    return wpList;
  }, [roomTemplate, roomName, targetStairCoords]);

  // Keep pathWaypointsRef in sync
  useEffect(() => {
    pathWaypointsRef.current = waypoints.map(w => w.pos);
    if (waypoints.length > 0) {
      currentAvatarPosRef.current.copy(waypoints[0].pos);
      targetAvatarPosRef.current.copy(waypoints[0].pos);
    }
  }, [waypoints]);

  // Initialize Three.js Canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(0, 32, 24);
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

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera going below floor
    controls.minDistance = 6;
    controls.maxDistance = 75;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x8fa3bf, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const blueAccent = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueAccent.position.set(-25, 20, -20);
    scene.add(blueAccent);

    // 6. Floor Geometry
    const floorGeo = new THREE.PlaneGeometry(62, 46);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.65,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    scene.add(floorMesh);

    // Tactical Grid Overlay
    const grid = new THREE.GridHelper(60, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.02;
    scene.add(grid);

    // Central Corridor Highlight Strip
    const corridorGeo = new THREE.PlaneGeometry(58, 5.2);
    const corridorMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.85
    });
    const corridorMesh = new THREE.Mesh(corridorGeo, corridorMat);
    corridorMesh.rotation.x = -Math.PI / 2;
    corridorMesh.position.set(0, 0.04, 0);
    scene.add(corridorMesh);

    // 7. Architectural Room Walls & Partitions
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75
    });

    const activeRoomWallMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x312e81,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9
    });

    const wallHeight = 2.0;

    // Outer Perimeter Low Curb
    const outerWalls = new THREE.Group();
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(60, wallHeight, 0.4), wallMat);
    northWall.position.set(0, wallHeight / 2, -22.5);
    outerWalls.add(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(60, wallHeight, 0.4), wallMat);
    southWall.position.set(0, wallHeight / 2, 22.5);
    outerWalls.add(southWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallHeight, 45), wallMat);
    westWall.position.set(-29.8, wallHeight / 2, 0);
    outerWalls.add(westWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallHeight, 45), wallMat);
    eastWall.position.set(29.8, wallHeight / 2, 0);
    outerWalls.add(eastWall);
    scene.add(outerWalls);

    // Helper to create room label canvas sprite
    const createRoomLabel = (text, isCurrent) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = isCurrent ? '#4f46e5' : '#0f172a';
      ctx.beginPath();
      ctx.roundRect(10, 10, 236, 108, 16);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = isCurrent ? '#818cf8' : '#334155';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.5, 2.2, 1);
      return sprite;
    };

    // Build the 10 Rooms on Floor
    ROOM_TEMPLATES.forEach((tmpl, idx) => {
      const isCurrent = `f${floor}_${tmpl.idSuffix}` === roomId;
      const currentMat = isCurrent ? activeRoomWallMat : wallMat;
      const roomNumber = `${floor}${idx < 9 ? '0' + (idx + 1) : idx + 1}`;

      // Dividing Partition (Left wall of room)
      const partGeo = new THREE.BoxGeometry(0.3, wallHeight, Math.abs(tmpl.maxZ - tmpl.minZ));
      const partMesh = new THREE.Mesh(partGeo, currentMat);
      partMesh.position.set(tmpl.minX, wallHeight / 2, (tmpl.minZ + tmpl.maxZ) / 2);
      scene.add(partMesh);

      // Corridor Wall with Door Gap
      const isNorth = tmpl.centerZ < 0;
      const wallZ = isNorth ? -2.6 : 2.6;
      const roomWidth = tmpl.maxX - tmpl.minX;
      const doorGap = 2.4;
      const sideWidth = (roomWidth - doorGap) / 2;

      // Left segment of corridor wall
      const leftSeg = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, wallHeight, 0.3), currentMat);
      leftSeg.position.set(tmpl.minX + sideWidth / 2, wallHeight / 2, wallZ);
      scene.add(leftSeg);

      // Right segment of corridor wall
      const rightSeg = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, wallHeight, 0.3), currentMat);
      rightSeg.position.set(tmpl.maxX - sideWidth / 2, wallHeight / 2, wallZ);
      scene.add(rightSeg);

      // Doorway Glowing Threshold Indicator
      const doorThresh = new THREE.Mesh(
        new THREE.PlaneGeometry(doorGap, 0.8),
        new THREE.MeshBasicMaterial({
          color: isCurrent ? 0x10b981 : 0x3b82f6,
          transparent: true,
          opacity: isCurrent ? 0.9 : 0.4
        })
      );
      doorThresh.rotation.x = -Math.PI / 2;
      doorThresh.position.set(tmpl.doorX, 0.05, wallZ);
      scene.add(doorThresh);

      // Room Number Label Billboard
      const labelSprite = createRoomLabel(`R-${roomNumber}`, isCurrent);
      labelSprite.position.set(tmpl.centerX, 1.8, tmpl.centerZ);
      scene.add(labelSprite);
    });

    // 8. Stairwell Escape Portals
    const createStairPortal = (x, z, label, isTarget, isBlocked) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Portal Box Structure
      const boxGeo = new THREE.BoxGeometry(3.8, 3.2, 5.0);
      const boxMat = new THREE.MeshStandardMaterial({
        color: isBlocked ? 0x7f1d1d : isTarget ? 0x064e3b : 0x1e293b,
        emissive: isBlocked ? 0xb91c1c : isTarget ? 0x059669 : 0x0f172a,
        emissiveIntensity: 0.6,
        roughness: 0.4
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.y = 1.6;
      group.add(boxMesh);

      // Illuminated Doorway Face
      const faceGeo = new THREE.PlaneGeometry(2.4, 2.8);
      const faceMat = new THREE.MeshBasicMaterial({
        color: isBlocked ? 0xef4444 : isTarget ? 0x10b981 : 0x38bdf8,
        transparent: true,
        opacity: 0.9
      });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.set(x > 0 ? -1.91 : 1.91, 1.4, 0);
      faceMesh.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(faceMesh);

      // Exit Sign Canvas Sprite
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = isBlocked ? '#dc2626' : '#10b981';
      ctx.fillRect(0, 0, 256, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 128, 50);

      const signTex = new THREE.CanvasTexture(canvas);
      const signSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex, transparent: true }));
      signSprite.scale.set(4.0, 1.6, 1);
      signSprite.position.set(0, 3.8, 0);
      group.add(signSprite);

      return group;
    };

    // West Stair Core A
    const isWestBlocked = activeFires.some(f => f.floor === floor && (f.roomId.endsWith('_r1') || f.roomId.endsWith('_r6')));
    const stairWest = createStairPortal(-28.5, 0, isWestBlocked ? 'CORE A BLOCKED' : 'CORE A (WEST)', targetStairCode === 'CORE_A', isWestBlocked);
    scene.add(stairWest);

    // East Stair Core B
    const isEastBlocked = activeFires.some(f => f.floor === floor && (f.roomId.endsWith('_r5') || f.roomId.endsWith('_r10')));
    const stairEast = createStairPortal(28.5, 0, isEastBlocked ? 'CORE B BLOCKED' : 'CORE B (EAST)', targetStairCode === 'CORE_B', isEastBlocked);
    scene.add(stairEast);

    // 9. Fire Hazard Visualization on Current Floor
    const floorFires = activeFires.filter(f => f.floor === floor);
    flameMeshesRef.current = [];

    floorFires.forEach(fire => {
      const tmplId = fire.roomId.split('_')[1] || 'r1';
      const tmpl = ROOM_TEMPLATES.find(t => t.idSuffix === tmplId) || ROOM_TEMPLATES[0];

      // Fire Point Light
      const fireLight = new THREE.PointLight(0xff4500, 3, 20);
      fireLight.position.set(tmpl.centerX, 2, tmpl.centerZ);
      scene.add(fireLight);

      // Red Hazard Ring on Floor
      const ringGeo = new THREE.RingGeometry(2.0, 3.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(tmpl.centerX, 0.08, tmpl.centerZ);
      scene.add(ring);

      // Multi-layer Conical Fire Flame
      const flameGroup = new THREE.Group();
      flameGroup.position.set(tmpl.centerX, 0.2, tmpl.centerZ);

      const coneMat1 = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.85 });
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 8), coneMat1);
      cone1.position.y = 1.6;
      flameGroup.add(cone1);

      const coneMat2 = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.9 });
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.2, 8), coneMat2);
      cone2.position.y = 1.1;
      flameGroup.add(cone2);

      scene.add(flameGroup);
      flameMeshesRef.current.push({ group: flameGroup, light: fireLight });
    });

    // 10. Google Maps-Style Dynamic Neon Green Egress Route
    if (waypoints.length >= 2) {
      const curvePoints = waypoints.map(w => w.pos);
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.32, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8
      });
      const routeTube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(routeTube);
      routeTubeRef.current = routeTube;

      // Pulsing Waypoint Discs
      waypoints.forEach((wp, idx) => {
        const discGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16);
        const discMat = new THREE.MeshBasicMaterial({
          color: idx === 0 ? 0x38bdf8 : idx === waypoints.length - 1 ? 0x10b981 : 0xa7f3d0
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.copy(wp.pos);
        disc.position.y = 0.08;
        scene.add(disc);
      });
    }

    // 11. 3D Animated User Avatar (Beacon with Direction Pointer & Pulse Ring)
    const avatarGroup = new THREE.Group();
    avatarGroup.position.copy(waypoints[0]?.pos || new THREE.Vector3(roomTemplate.centerX, 0.4, roomTemplate.centerZ));

    // Avatar Core Puck
    const avatarCoreGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.4, 24);
    const avatarCoreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const avatarCore = new THREE.Mesh(avatarCoreGeo, avatarCoreMat);
    avatarCore.position.y = 0.2;
    avatarGroup.add(avatarCore);

    // Forward Direction Pointer Arrow
    const arrowGeo = new THREE.ConeGeometry(0.4, 1.0, 16);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0.45, 0.7);
    avatarGroup.add(arrow);

    // Pulsing Radar Beacon Ring on Floor
    const pulseRingGeo = new THREE.RingGeometry(0.8, 1.4, 24);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 0.04;
    avatarGroup.add(pulseRing);

    // Floating "YOU" Pin Tag
    const pinCanvas = document.createElement('canvas');
    pinCanvas.width = 160;
    pinCanvas.height = 80;
    const pCtx = pinCanvas.getContext('2d');
    pCtx.fillStyle = '#06b6d4';
    pCtx.beginPath();
    pCtx.roundRect(6, 6, 148, 68, 14);
    pCtx.fill();
    pCtx.strokeStyle = '#ffffff';
    pCtx.lineWidth = 4;
    pCtx.stroke();
    pCtx.fillStyle = '#ffffff';
    pCtx.font = 'bold 32px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'middle';
    pCtx.fillText('YOU', 80, 40);

    const pinTex = new THREE.CanvasTexture(pinCanvas);
    const pinSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTex, transparent: true }));
    pinSprite.scale.set(2.4, 1.2, 1);
    pinSprite.position.set(0, 2.4, 0);
    avatarGroup.add(pinSprite);

    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    // Handle Window / Container Resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 12. Real-Time Render Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Flame flicker animation
      flameMeshesRef.current.forEach((flame, i) => {
        const scale = 1 + Math.sin(elapsed * 8 + i) * 0.15;
        flame.group.scale.set(scale, scale * 1.1, scale);
        flame.light.intensity = 2.5 + Math.sin(elapsed * 12 + i) * 0.8;
      });

      // Radar Ring Pulse Animation
      if (pulseRing) {
        const pulseScale = 1.0 + (elapsed * 1.5 % 1.5);
        pulseRing.scale.set(pulseScale, pulseScale, 1);
        pulseRingMat.opacity = Math.max(0, 0.8 - (pulseScale - 1.0) / 1.5);
      }

      // Smooth Avatar Glide towards Target Waypoint
      if (avatarGroupRef.current) {
        const cur = currentAvatarPosRef.current;
        const tgt = targetAvatarPosRef.current;
        cur.lerp(tgt, 0.12);
        avatarGroupRef.current.position.copy(cur);

        // Orient avatar towards movement direction
        const diff = new THREE.Vector3().subVectors(tgt, cur);
        if (diff.lengthSq() > 0.01) {
          const angle = Math.atan2(diff.x, diff.z);
          avatarGroupRef.current.rotation.y = angle;
        }
      }

      // Dynamic Camera Modes
      if (cameraMode === 'PERSPECTIVE' && avatarGroupRef.current) {
        // Personal Perspective Navigation View (Like Google Maps turn-by-turn driving HUD)
        const avPos = avatarGroupRef.current.position;
        const lookTgt = new THREE.Vector3().copy(targetAvatarPosRef.current).add(new THREE.Vector3(0, 1.2, 0));

        // Place camera 6.5 units behind avatar, 4.5 units above
        const offset = new THREE.Vector3(0, 5.0, 7.5);
        const camTargetPos = new THREE.Vector3().copy(avPos).add(offset);
        camera.position.lerp(camTargetPos, 0.08);
        controls.target.lerp(lookTgt, 0.1);
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
  }, [floor, roomId, targetStairCode, activeFires, waypoints]);

  // Handle Waypoint Stepping
  const handleSelectWaypoint = (idx) => {
    if (idx < 0 || idx >= waypoints.length) return;
    setCurrentWaypointIdx(idx);
    targetAvatarPosRef.current.copy(waypoints[idx].pos);

    // If reaching final waypoint (stair core), trigger arrived
    if (idx === waypoints.length - 1) {
      setHasReachedExit(true);
    }
  };

  // Auto-Walk Escort Sequence
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

  // Camera Mode Toggle Helper
  const toggleCameraMode = () => {
    if (cameraMode === 'PERSPECTIVE') {
      setCameraMode('FLOOR_PLAN');
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 36, 22);
        controlsRef.current.target.set(0, 0, 0);
      }
    } else {
      setCameraMode('PERSPECTIVE');
    }
  };

  const currentWp = waypoints[currentWaypointIdx] || waypoints[0];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* ── 3D CANVAS TOP HUD OVERLAY ── */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Camera View Mode Toggle */}
          <button
            onClick={toggleCameraMode}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            {cameraMode === 'PERSPECTIVE' ? (
              <>
                <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                <span>Follow Me POV</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Floor Plan 2.5D</span>
              </>
            )}
          </button>

          {/* Reset Position Button */}
          <button
            onClick={() => handleSelectWaypoint(0)}
            className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            title="Reset position to room"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Level Tag & Live Egress Badge */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Google Maps 3D Route
          </span>
        </div>
      </div>

      {/* ── THREE.JS CONTAINER ── */}
      <div
        ref={containerRef}
        className="w-full h-[320px] bg-slate-950 relative touch-none cursor-grab active:cursor-grabbing"
      />

      {/* ── NAVIGATION STEP DIRECTIVE BANNER ── */}
      <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs">
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

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target</div>
            <div className="text-[11px] font-extrabold text-indigo-300 truncate max-w-[100px]">
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

        {/* Step Action Stepper Controls */}
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
            onClick={() => setIsAutoWalking(prev => !prev)}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer ${
              isAutoWalking
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isAutoWalking ? 'animate-spin' : ''}`} />
            <span>{isAutoWalking ? 'Pausing...' : 'Auto-Walk'}</span>
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

