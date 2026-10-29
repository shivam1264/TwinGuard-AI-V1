import * as THREE from 'three';

export class FireParticles {
  constructor(scene) {
    this.scene = scene;
    this.activeFires = new Map(); // roomId -> { group, light, particles, smoke, time }
  }

  spawnFire(roomId, position = { x: 0, y: 0.2, z: 0 }) {
    if (this.activeFires.has(roomId)) {
      return;
    }

    const fireGroup = new THREE.Group();
    fireGroup.position.set(position.x, position.y, position.z);

    // Dynamic Flickering Point Light (castShadow false to eliminate 6-sided cubemap overhead)
    const fireLight = new THREE.PointLight(0xff3300, 3.5, 18, 1.8);
    fireLight.position.set(0, 1.8, 0);
    fireLight.castShadow = false;
    fireGroup.add(fireLight);

    // Hazard ring on floor
    const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    fireGroup.add(ring);

    // Flame particles
    const flameCount = 180;
    const flameGeo = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(flameCount * 3);
    const flameColors = new Float32Array(flameCount * 3);
    const flameSizes = new Float32Array(flameCount);
    const flameVelocities = [];

    const color1 = new THREE.Color(0xff2200); // red
    const color2 = new THREE.Color(0xff8800); // orange
    const color3 = new THREE.Color(0xffea00); // bright yellow

    for (let i = 0; i < flameCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;
      flamePositions[i * 3] = Math.cos(angle) * radius;
      flamePositions[i * 3 + 1] = Math.random() * 2.8;
      flamePositions[i * 3 + 2] = Math.sin(angle) * radius;

      const mixedColor = Math.random() > 0.4 ? color2.clone().lerp(color3, Math.random()) : color1.clone().lerp(color2, Math.random());
      flameColors[i * 3] = mixedColor.r;
      flameColors[i * 3 + 1] = mixedColor.g;
      flameColors[i * 3 + 2] = mixedColor.b;

      flameSizes[i] = Math.random() * 1.8 + 0.8;
      flameVelocities.push({
        y: Math.random() * 2.2 + 1.2,
        ox: flamePositions[i * 3],
        oz: flamePositions[i * 3 + 2],
        maxH: Math.random() * 3.5 + 1.5
      });
    }

    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeo.setAttribute('color', new THREE.BufferAttribute(flameColors, 3));
    flameGeo.setAttribute('size', new THREE.BufferAttribute(flameSizes, 1));

    // Simple procedural flame canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 180, 0, 0.8)');
    grad.addColorStop(0.7, 'rgba(255, 40, 0, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const particleTex = new THREE.CanvasTexture(canvas);

    const flameMat = new THREE.PointsMaterial({
      size: 1.6,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const flamePoints = new THREE.Points(flameGeo, flameMat);
    fireGroup.add(flamePoints);

    // Smoke particles
    const smokeCount = 70;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = [];

    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3] = (Math.random() - 0.5) * 2;
      smokePositions[i * 3 + 1] = Math.random() * 5 + 1.5;
      smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      smokeVelocities.push({
        y: Math.random() * 1.5 + 0.8,
        driftX: (Math.random() - 0.5) * 0.4,
        driftZ: (Math.random() - 0.5) * 0.4
      });
    }

    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      size: 3.2,
      color: 0x334155,
      map: particleTex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    fireGroup.add(smokePoints);

    this.scene.add(fireGroup);

    this.activeFires.set(roomId, {
      group: fireGroup,
      light: fireLight,
      ring,
      flamePoints,
      flameGeo,
      flamePositions,
      flameVelocities,
      smokePoints,
      smokeGeo,
      smokePositions,
      smokeVelocities,
      basePos: position
    });
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
    this.activeFires.forEach((fire, roomId) => {
      if (mode === 'ALL' || mode === 'EXPLODED') {
        fire.group.visible = true;
      } else {
        const floorNum = parseInt(mode, 10);
        const isTargetFloor = roomId.startsWith(`f${floorNum}_`);
        fire.group.visible = isTargetFloor;
      }
    });
  }

  update(delta) {
    this.activeFires.forEach(fire => {
      // Light flicker
      fire.light.intensity = 3.0 + Math.sin(Date.now() * 0.02) * 1.2 + (Math.random() - 0.5) * 0.6;
      fire.ring.rotation.z += delta * 0.8;

      // Update Flames
      const pos = fire.flamePositions;
      for (let i = 0; i < fire.flameVelocities.length; i++) {
        const vel = fire.flameVelocities[i];
        pos[i * 3 + 1] += vel.y * delta;
        if (pos[i * 3 + 1] > vel.maxH) {
          pos[i * 3 + 1] = 0.1;
          pos[i * 3] = vel.ox + (Math.random() - 0.5) * 0.5;
          pos[i * 3 + 2] = vel.oz + (Math.random() - 0.5) * 0.5;
        }
      }
      fire.flameGeo.attributes.position.needsUpdate = true;

      // Update Smoke
      const smokePos = fire.smokePositions;
      for (let i = 0; i < fire.smokeVelocities.length; i++) {
        const vel = fire.smokeVelocities[i];
        smokePos[i * 3 + 1] += vel.y * delta;
        smokePos[i * 3] += vel.driftX * delta;
        smokePos[i * 3 + 2] += vel.driftZ * delta;
        if (smokePos[i * 3 + 1] > 7.5) {
          smokePos[i * 3 + 1] = 1.8;
          smokePos[i * 3] = (Math.random() - 0.5) * 1.5;
          smokePos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
      }
      fire.smokeGeo.attributes.position.needsUpdate = true;
    });
  }
}
