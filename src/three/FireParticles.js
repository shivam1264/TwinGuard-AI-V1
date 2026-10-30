import * as THREE from 'three';

// Procedural Multi-Layer Physical Fire & Smoke Emergency Simulation
export class FireParticles {
  constructor(scene, onFireSpread = null) {
    this.scene = scene;
    this.onFireSpread = onFireSpread;
    this.activeFires = new Map(); // roomId -> FireInstance
    this.floorMode = 'ALL';

    // Shared Procedural Textures to eliminate duplicate canvas overhead
    this.textures = this.initTextures();
  }

  initTextures() {
    // 1. Incandescent Flame Texture (White-hot core to deep fiery amber gradient)
    const flameCanvas = document.createElement('canvas');
    flameCanvas.width = 128;
    flameCanvas.height = 128;
    const fCtx = flameCanvas.getContext('2d');
    const fGrad = fCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
    fGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    fGrad.addColorStop(0.2, 'rgba(255, 230, 100, 0.95)');
    fGrad.addColorStop(0.45, 'rgba(255, 120, 10, 0.85)');
    fGrad.addColorStop(0.75, 'rgba(220, 40, 5, 0.45)');
    fGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    fCtx.fillStyle = fGrad;
    fCtx.fillRect(0, 0, 128, 128);
    const flameTex = new THREE.CanvasTexture(flameCanvas);

    // 2. Volumetric Soft Smoke Puff Texture (Charcoal with multi-octave cloud edges)
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 128;
    smokeCanvas.height = 128;
    const sCtx = smokeCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
    sGrad.addColorStop(0.0, 'rgba(70, 75, 85, 0.85)');
    sGrad.addColorStop(0.35, 'rgba(55, 60, 68, 0.65)');
    sGrad.addColorStop(0.7, 'rgba(40, 44, 50, 0.35)');
    sGrad.addColorStop(1.0, 'rgba(20, 22, 26, 0.0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const smokeTex = new THREE.CanvasTexture(smokeCanvas);

    // 3. Crisp Flying Ember Spark Texture
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = 32;
    sparkCanvas.height = 32;
    const spCtx = sparkCanvas.getContext('2d');
    const spGrad = spCtx.createRadialGradient(16, 16, 0, 16, 16, 15);
    spGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    spGrad.addColorStop(0.3, 'rgba(255, 200, 50, 0.9)');
    spGrad.addColorStop(0.8, 'rgba(255, 80, 10, 0.5)');
    spGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    spCtx.fillStyle = spGrad;
    spCtx.fillRect(0, 0, 32, 32);
    const sparkTex = new THREE.CanvasTexture(sparkCanvas);

    // 4. Burnt Ember Floor Hotspot
    const emberCanvas = document.createElement('canvas');
    emberCanvas.width = 256;
    emberCanvas.height = 256;
    const eCtx = emberCanvas.getContext('2d');
    const eGrad = eCtx.createRadialGradient(128, 128, 0, 128, 128, 120);
    eGrad.addColorStop(0.0, 'rgba(255, 120, 10, 0.9)');
    eGrad.addColorStop(0.35, 'rgba(180, 40, 5, 0.7)');
    eGrad.addColorStop(0.7, 'rgba(40, 20, 15, 0.5)');
    eGrad.addColorStop(1.0, 'rgba(10, 10, 10, 0.0)');
    eCtx.fillStyle = eGrad;
    eCtx.fillRect(0, 0, 256, 256);
    const emberTex = new THREE.CanvasTexture(emberCanvas);

    return { flameTex, smokeTex, sparkTex, emberTex };
  }

  spawnFire(roomId, position = { x: 0, y: 0.2, z: 0 }, roomData = null) {
    if (this.activeFires.has(roomId)) {
      return;
    }

    const fireGroup = new THREE.Group();
    fireGroup.position.set(position.x, position.y, position.z);

    // 1. Dynamic Flickering Point Light
    const fireLight = new THREE.PointLight(0xff4400, 3.8, 16, 1.6);
    fireLight.position.set(0, 1.4, 0);
    fireLight.castShadow = false;
    fireGroup.add(fireLight);

    // 2. Ember Char Hotspot on Floor
    const emberGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const emberMat = new THREE.MeshBasicMaterial({
      map: this.textures.emberTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.rotation.x = -Math.PI / 2;
    emberMesh.position.y = 0.02;
    fireGroup.add(emberMesh);

    // 3. Incident Boundary Hazard Ring
    const ringGeo = new THREE.RingGeometry(2.4, 2.9, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    fireGroup.add(ring);

    // 4. Layer A: Intense Incandescent Core Flame Particles
    const coreCount = 90;
    const coreGeo = new THREE.BufferGeometry();
    const corePositions = new Float32Array(coreCount * 3);
    const coreVelocities = [];

    for (let i = 0; i < coreCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.75;
      corePositions[i * 3] = Math.cos(angle) * r;
      corePositions[i * 3 + 1] = Math.random() * 1.5;
      corePositions[i * 3 + 2] = Math.sin(angle) * r;

      coreVelocities.push({
        y: Math.random() * 2.2 + 1.4,
        ox: corePositions[i * 3],
        oz: corePositions[i * 3 + 2],
        maxH: Math.random() * 1.8 + 1.0,
        seed: Math.random() * Math.PI * 2
      });
    }
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    const coreMat = new THREE.PointsMaterial({
      size: 1.8,
      map: this.textures.flameTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const corePoints = new THREE.Points(coreGeo, coreMat);
    fireGroup.add(corePoints);

    // 5. Layer B: Outer Turbulent Flame Tongues (Flicker, Noise Buoyancy)
    const tongueCount = 130;
    const tongueGeo = new THREE.BufferGeometry();
    const tonguePositions = new Float32Array(tongueCount * 3);
    const tongueVelocities = [];

    for (let i = 0; i < tongueCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.4;
      tonguePositions[i * 3] = Math.cos(angle) * r;
      tonguePositions[i * 3 + 1] = Math.random() * 2.6;
      tonguePositions[i * 3 + 2] = Math.sin(angle) * r;

      tongueVelocities.push({
        y: Math.random() * 2.8 + 1.6,
        ox: tonguePositions[i * 3],
        oz: tonguePositions[i * 3 + 2],
        maxH: Math.random() * 3.2 + 1.8,
        freq: Math.random() * 6.0 + 3.0,
        phase: Math.random() * Math.PI * 2
      });
    }
    tongueGeo.setAttribute('position', new THREE.BufferAttribute(tonguePositions, 3));
    const tongueMat = new THREE.PointsMaterial({
      size: 2.4,
      map: this.textures.flameTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85
    });
    const tonguePoints = new THREE.Points(tongueGeo, tongueMat);
    fireGroup.add(tonguePoints);

    // 6. Layer C: Fast Flying Embers and Sparks
    const sparkCount = 45;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = (Math.random() - 0.5) * 1.2;
      sparkPositions[i * 3 + 1] = Math.random() * 2.0;
      sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;

      sparkVelocities.push({
        y: Math.random() * 3.8 + 2.5,
        vx: (Math.random() - 0.5) * 1.2,
        vz: (Math.random() - 0.5) * 1.2,
        maxH: Math.random() * 3.5 + 2.0
      });
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      size: 0.65,
      map: this.textures.sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    fireGroup.add(sparkPoints);

    // 7. Layer D: Multi-Tiered Volumetric Smoke Plume with Ceiling Accumulation
    const smokeCount = 110;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = [];

    // Direction toward room door (z = -2.4 or +2.4 based on room position)
    const doorDirZ = position.z > 0 ? -1.0 : 1.0;

    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3] = (Math.random() - 0.5) * 1.2;
      smokePositions[i * 3 + 1] = Math.random() * 3.6 + 0.8;
      smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;

      smokeVelocities.push({
        y: Math.random() * 1.6 + 0.9,
        driftX: (Math.random() - 0.5) * 0.8,
        driftZ: (Math.random() - 0.5) * 0.8 + doorDirZ * 0.35,
        ceilingAge: 0,
        doorBias: doorDirZ
      });
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      size: 3.6,
      map: this.textures.smokeTex,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    fireGroup.add(smokePoints);

    this.scene.add(fireGroup);

    // Dynamic Fire State Instance
    const fireInstance = {
      roomId,
      group: fireGroup,
      light: fireLight,
      ring,
      emberMesh,
      corePoints,
      coreGeo,
      corePositions,
      coreVelocities,
      tonguePoints,
      tongueGeo,
      tonguePositions,
      tongueVelocities,
      sparkPoints,
      sparkGeo,
      sparkPositions,
      sparkVelocities,
      smokePoints,
      smokeGeo,
      smokePositions,
      smokeVelocities,
      basePos: position,
      roomData,
      elapsedTime: 0,
      state: 'IGNITION', // IGNITION -> DEVELOPING -> ACTIVE -> SPREADING -> INTENSE
      heatRadius: 2.8,
      intensityFactor: 0.5,
      hasSpread: false
    };

    this.activeFires.set(roomId, fireInstance);
  }

  attemptSpread(fire) {
    if (!this.onFireSpread || !fire.roomId) return;

    // Parse floor and room index to locate adjacent combustible room
    const match = fire.roomId.match(/f(\d+)_r(\d+)/i) || fire.roomId.match(/F(\d+)_R(\d+)/i);
    if (!match) return;

    const floor = parseInt(match[1], 10);
    const roomNum = parseInt(match[2], 10);

    // Select adjacent room on the same floor (e.g. room + 1 or room - 1)
    const candidates = [roomNum + 1, roomNum - 1].filter(n => n >= 1 && n <= 10);
    if (candidates.length === 0) return;

    const nextRoomNum = candidates[Math.floor(Math.random() * candidates.length)];
    const targetRoomId = `f${floor}_r${nextRoomNum}`;

    if (!this.activeFires.has(targetRoomId)) {
      this.onFireSpread(fire.roomId, targetRoomId, floor, nextRoomNum);
    }
  }

  extinguishFire(roomId) {
    if (this.activeFires.has(roomId)) {
      const fire = this.activeFires.get(roomId);
      this.scene.remove(fire.group);
      this.activeFires.delete(roomId);
    }
  }

  extinguishAll() {
    this.activeFires.forEach(fire => {
      this.scene.remove(fire.group);
    });
    this.activeFires.clear();
  }

  setFloorMode(mode) {
    this.floorMode = mode;
    const EXPLOSION_OFFSET = 1.8;
    this.activeFires.forEach((fire, roomId) => {
      const floorNum = fire.floor || parseInt(roomId.replace(/\D/g, '').slice(0, 2), 10) || 1;
      if (mode === 'ALL') {
        fire.group.visible = true;
        fire.group.position.y = fire.basePos ? fire.basePos.y : fire.group.position.y;
      } else if (mode === 'EXPLODED') {
        fire.group.visible = true;
        const baseY = fire.basePos ? fire.basePos.y : fire.group.position.y;
        fire.group.position.y = baseY + (floorNum - 1) * EXPLOSION_OFFSET;
      } else {
        const targetFloor = parseInt(mode, 10);
        fire.group.visible = (floorNum === targetFloor);
        fire.group.position.y = fire.basePos ? fire.basePos.y : fire.group.position.y;
      }
    });
  }

  update(delta) {
    const timeNow = performance.now() * 0.001;

    this.activeFires.forEach(fire => {
      fire.elapsedTime += delta;

      // 1. Continuous Fire State Progression
      if (fire.elapsedTime < 4.0) {
        fire.state = 'IGNITION';
        fire.intensityFactor = 0.5 + (fire.elapsedTime / 4.0) * 0.3;
        fire.heatRadius = 2.4;
      } else if (fire.elapsedTime < 12.0) {
        fire.state = 'DEVELOPING';
        fire.intensityFactor = 0.8 + ((fire.elapsedTime - 4.0) / 8.0) * 0.35;
        fire.heatRadius = 3.6;
      } else if (fire.elapsedTime < 24.0) {
        fire.state = 'ACTIVE';
        fire.intensityFactor = 1.15 + ((fire.elapsedTime - 12.0) / 12.0) * 0.3;
        fire.heatRadius = 5.2;
      } else if (fire.elapsedTime < 45.0) {
        fire.state = 'SPREADING';
        fire.intensityFactor = 1.45;
        fire.heatRadius = 6.8;
        if (!fire.hasSpread) {
          fire.hasSpread = true;
          this.attemptSpread(fire);
        }
      } else {
        fire.state = 'INTENSE';
        fire.intensityFactor = 1.6;
        fire.heatRadius = 8.0;
      }

      // 2. Realistic Chromatic Light Modulation & Flicker
      const flicker = Math.sin(timeNow * 16.0) * 0.6 + Math.cos(timeNow * 27.0) * 0.3 + (Math.random() - 0.5) * 0.4;
      fire.light.intensity = (3.2 + flicker) * fire.intensityFactor;

      // Organic transition between fiery gold and deep burning orange
      const hueT = 0.5 + Math.sin(timeNow * 4.0) * 0.5;
      fire.light.color.setRGB(1.0, 0.25 + hueT * 0.2, 0.0);

      // Floor hazard ring pulsation
      fire.ring.rotation.z += delta * 0.9;
      fire.ring.scale.setScalar(1.0 + Math.sin(timeNow * 3.0) * 0.06);

      // 3. Update Core Flame Particles (Hot, fast-rising, dense)
      const corePos = fire.corePositions;
      for (let i = 0; i < fire.coreVelocities.length; i++) {
        const vel = fire.coreVelocities[i];
        corePos[i * 3 + 1] += vel.y * delta * fire.intensityFactor;
        const wobble = Math.sin(timeNow * 8.0 + vel.seed) * 0.04;
        corePos[i * 3] += wobble;

        if (corePos[i * 3 + 1] > vel.maxH * fire.intensityFactor) {
          corePos[i * 3 + 1] = 0.05;
          corePos[i * 3] = vel.ox + (Math.random() - 0.5) * 0.35;
          corePos[i * 3 + 2] = vel.oz + (Math.random() - 0.5) * 0.35;
        }
      }
      fire.coreGeo.attributes.position.needsUpdate = true;

      // 4. Update Outer Flame Tongues (Turbulent, buoyant)
      const tonguePos = fire.tonguePositions;
      for (let i = 0; i < fire.tongueVelocities.length; i++) {
        const vel = fire.tongueVelocities[i];
        tonguePos[i * 3 + 1] += vel.y * delta * fire.intensityFactor;
        const flutter = Math.sin(timeNow * vel.freq + vel.phase) * 0.12 * delta * 60;
        tonguePos[i * 3] += flutter;
        tonguePos[i * 3 + 2] += Math.cos(timeNow * vel.freq + vel.phase) * 0.08 * delta * 60;

        if (tonguePos[i * 3 + 1] > vel.maxH * fire.intensityFactor) {
          tonguePos[i * 3 + 1] = 0.1;
          tonguePos[i * 3] = vel.ox + (Math.random() - 0.5) * 0.6;
          tonguePos[i * 3 + 2] = vel.oz + (Math.random() - 0.5) * 0.6;
        }
      }
      fire.tongueGeo.attributes.position.needsUpdate = true;

      // 5. Update Sparks & Embers (High velocity, chaotic draft)
      const sparkPos = fire.sparkPositions;
      for (let i = 0; i < fire.sparkVelocities.length; i++) {
        const vel = fire.sparkVelocities[i];
        sparkPos[i * 3] += vel.vx * delta;
        sparkPos[i * 3 + 1] += vel.y * delta;
        sparkPos[i * 3 + 2] += vel.vz * delta;

        if (sparkPos[i * 3 + 1] > vel.maxH * fire.intensityFactor) {
          sparkPos[i * 3 + 1] = 0.1;
          sparkPos[i * 3] = (Math.random() - 0.5) * 0.8;
          sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          vel.vx = (Math.random() - 0.5) * 1.4;
          vel.vz = (Math.random() - 0.5) * 1.4;
        }
      }
      fire.sparkGeo.attributes.position.needsUpdate = true;

      // 6. Update Volumetric Smoke with Ceiling Accumulation & Corridor Doorway Migration
      const smokePos = fire.smokePositions;
      const ceilingY = 3.35; // Suspended ceiling height in commercial floor

      for (let i = 0; i < fire.smokeVelocities.length; i++) {
        const vel = fire.smokeVelocities[i];

        if (smokePos[i * 3 + 1] < ceilingY) {
          // A. Upward Buoyant Plume
          smokePos[i * 3 + 1] += vel.y * delta * fire.intensityFactor;
          smokePos[i * 3] += vel.driftX * delta * 0.6;
          smokePos[i * 3 + 2] += vel.driftZ * delta * 0.6;
        } else {
          // B. Ceiling Impingement: Vertical deceleration converts to lateral radial spread!
          smokePos[i * 3 + 1] = ceilingY + Math.sin(timeNow + i) * 0.08;
          vel.ceilingAge += delta;

          // Radial expansion outward along ceiling plane
          const distXZ = Math.hypot(smokePos[i * 3], smokePos[i * 3 + 2]) || 0.1;
          const radialSpeed = 1.35 * fire.intensityFactor;
          smokePos[i * 3] += (smokePos[i * 3] / distXZ) * radialSpeed * delta;
          smokePos[i * 3 + 2] += (smokePos[i * 3 + 2] / distXZ) * radialSpeed * delta;

          // Migration toward corridor doorway in the ceiling plenum layer
          smokePos[i * 3 + 2] += vel.doorBias * 0.9 * delta;

          // Disperse when expanding beyond room boundary
          if (distXZ > (fire.heatRadius + 2.5) || vel.ceilingAge > 4.5) {
            smokePos[i * 3 + 1] = 0.4;
            smokePos[i * 3] = (Math.random() - 0.5) * 0.8;
            smokePos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
            vel.ceilingAge = 0;
          }
        }
      }
      fire.smokeGeo.attributes.position.needsUpdate = true;
    });
  }
}
