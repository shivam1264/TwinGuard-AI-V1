import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ============================================================================
// REGIONAL ENVIRONMENT & SURROUNDING WORLD SYSTEM (2.4KM SCALE)
// ============================================================================
// Embeds the 720m x 560m institutional campus into a believable, seamless
// 2.4km x 2.4km regional world context:
// 1. Broad Natural Terrain with layered peripheral grass and gentle 0-5m elevation
// 2. Regional Arterial Road Highway Network (extending South, East, West, North)
// 3. Low-Density Surrounding City Context (6 procedural architectural archetypes)
// 4. Distant Green Belts & Tree Forests (Optimized Instanced LOD)
// 5. Atmospheric Sky Dome & Horizon Gradient (Eliminates the "white void")

export class WorldEnvironmentManager {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'WorldEnvironment';
    this.group.userData = { id: 'WORLD-ENVIRONMENT', type: 'REGIONAL_CONTEXT' };

    this.subgroups = {
      skyDome: new THREE.Group(),
      regionalTerrain: new THREE.Group(),
      regionalRoads: new THREE.Group(),
      cityContext: new THREE.Group(),
      distantForests: new THREE.Group(),
      vehicles: new THREE.Group()
    };

    this.group.add(this.subgroups.skyDome);
    this.group.add(this.subgroups.regionalTerrain);
    this.group.add(this.subgroups.regionalRoads);
    this.group.add(this.subgroups.cityContext);
    this.group.add(this.subgroups.distantForests);
    this.group.add(this.subgroups.vehicles);

    this.initWorldMaterials();
    this.buildAtmosphericSkyDome();
    this.buildRegionalTerrain();
    this.buildRegionalRoadNetwork();
    this.buildSurroundingCityContext();
    this.buildDistantGreenBelts();
    this.buildContextVehicles();
  }

  initWorldMaterials() {
    const worldGrassCanvas = document.createElement('canvas');
    worldGrassCanvas.width = 1024;
    worldGrassCanvas.height = 1024;
    const wgCtx = worldGrassCanvas.getContext('2d');
    wgCtx.fillStyle = '#264a1d';
    wgCtx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 26000; i++) {
      const gx = Math.random() * 1024;
      const gy = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 28 - 14);
      wgCtx.fillStyle = `rgb(${38 + shade}, ${74 + shade}, ${29 + Math.floor(shade * 0.7)})`;
      wgCtx.fillRect(gx, gy, 3, 3);
    }
    const worldGrassTex = new THREE.CanvasTexture(worldGrassCanvas);
    worldGrassTex.colorSpace = THREE.SRGBColorSpace;
    worldGrassTex.wrapS = THREE.RepeatWrapping;
    worldGrassTex.wrapT = THREE.RepeatWrapping;
    worldGrassTex.repeat.set(48, 48);
    worldGrassTex.anisotropy = 4;

    this.worldTerrainMat = new THREE.MeshStandardMaterial({
      map: worldGrassTex,
      roughness: 0.95,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.regionalHighwayMat = new THREE.MeshStandardMaterial({
      color: 0x222832,
      roughness: 0.85,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    this.cityFacadeMats = [
      new THREE.MeshStandardMaterial({ color: 0xdde3ea, roughness: 0.75, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, metalness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: 0xc8b8a6, roughness: 0.8, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0xb5c0cc, roughness: 0.65, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.85, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.25 })
    ];

    this.cityRoofMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15
    });

    this.distantCanopyMat = new THREE.MeshStandardMaterial({
      color: 0x1e4f24,
      roughness: 0.85,
      metalness: 0.02
    });

    this.distantConiferMat = new THREE.MeshStandardMaterial({
      color: 0x14351d,
      roughness: 0.88,
      metalness: 0.02
    });

    this.carPaintMats = [
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35, metalness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.65 })
    ];
  }

  buildAtmosphericSkyDome() {
    const domeGeo = new THREE.SphereGeometry(2200, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 256;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext('2d');
    const grad = sCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#78a6d6');
    grad.addColorStop(0.4, '#a2c2e6');
    grad.addColorStop(0.7, '#cbe0f4');
    grad.addColorStop(0.9, '#e4effa');
    grad.addColorStop(1.0, '#eaf0f8');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 512);

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false
    });

    const skyMesh = new THREE.Mesh(domeGeo, skyMat);
    skyMesh.name = 'WORLD-SKY-DOME';
    this.subgroups.skyDome.add(skyMesh);
  }

  buildRegionalTerrain() {
    const worldSize = 2500;
    const segments = 64;
    const terrainGeo = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const distFromCenter = Math.hypot(x, z);
      let elev = 0;

      if (distFromCenter > 420) {
        const factor = Math.min(1.0, (distFromCenter - 420) / 450);
        const wave1 = Math.sin(x * 0.0035) * Math.cos(z * 0.0035) * 3.5;
        const wave2 = Math.cos(x * 0.006 + 1.2) * Math.sin(z * 0.005) * 2.2;
        elev = (wave1 + wave2 + 1.5) * factor;
      }

      pos.setY(i, Math.max(-0.2, elev));
    }

    terrainGeo.computeVertexNormals();

    const worldTerrainMesh = new THREE.Mesh(terrainGeo, this.worldTerrainMat);
    worldTerrainMesh.receiveShadow = true;
    worldTerrainMesh.name = 'REGIONAL-TERRAIN-BASE';
    worldTerrainMesh.position.set(0, -0.02, 0);
    this.subgroups.regionalTerrain.add(worldTerrainMesh);
  }

  buildRegionalRoadNetwork() {
    const roadGeos = [];
    const roadWidth = 14.0; // 4-lane major regional highway

    // Southern Regional Highway (running East-West along z = 280)
    const sHw = new THREE.PlaneGeometry(2400, roadWidth);
    sHw.rotateX(-Math.PI / 2);
    sHw.translate(0, 0.022, 280);
    roadGeos.push(sHw);

    // Highway Shoulder Strip (North & South)
    const shS1 = new THREE.PlaneGeometry(2400, 1.8);
    shS1.rotateX(-Math.PI / 2);
    shS1.translate(0, 0.024, 280 - roadWidth * 0.5 - 0.9);
    const shS2 = new THREE.PlaneGeometry(2400, 1.8);
    shS2.rotateX(-Math.PI / 2);
    shS2.translate(0, 0.024, 280 + roadWidth * 0.5 + 0.9);
    roadGeos.push(shS1, shS2);

    // Main South Entrance Boulevard Extension (continuing south from Z=240 to Z=1100)
    const sConnector = new THREE.PlaneGeometry(12.0, 800);
    sConnector.rotateX(-Math.PI / 2);
    sConnector.translate(0, 0.022, 680);
    roadGeos.push(sConnector);

    // Western Regional Parkway
    const wHw = new THREE.PlaneGeometry(roadWidth, 2200);
    wHw.rotateX(-Math.PI / 2);
    wHw.translate(-450, 0.022, 0);
    roadGeos.push(wHw);

    // Eastern Innovation Parkway
    const eHw = new THREE.PlaneGeometry(roadWidth, 2200);
    eHw.rotateX(-Math.PI / 2);
    eHw.translate(450, 0.022, 0);
    roadGeos.push(eHw);

    // Northern Regional Beltway
    const nHw = new THREE.PlaneGeometry(2200, roadWidth);
    nHw.rotateX(-Math.PI / 2);
    nHw.translate(0, 0.022, -360);
    roadGeos.push(nHw);

    const mergedRoads = BufferGeometryUtils.mergeGeometries(roadGeos);
    const roadMesh = new THREE.Mesh(mergedRoads, this.regionalHighwayMat);
    roadMesh.receiveShadow = true;
    roadMesh.name = 'REGIONAL-ROAD-NETWORK';
    this.subgroups.regionalRoads.add(roadMesh);
  }

  buildSurroundingCityContext() {
    const buildingMeshesByMat = [[], [], [], [], [], []];
    const roofMeshes = [];

    const addContextBuilding = (cx, cz, w, d, h, matIdx = 0, rotY = 0) => {
      if (Math.abs(cx) < 380 && Math.abs(cz) < 290) return;

      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      bodyGeo.translate(0, h * 0.5 + 0.05, 0);
      if (rotY !== 0) bodyGeo.rotateY(rotY);
      bodyGeo.translate(cx, 0, cz);
      buildingMeshesByMat[matIdx % 6].push(bodyGeo);

      const roofGeo = new THREE.BoxGeometry(w * 0.92, 0.8, d * 0.92);
      roofGeo.translate(0, h + 0.45, 0);
      if (rotY !== 0) roofGeo.rotateY(rotY);
      roofGeo.translate(cx, 0, cz);
      roofMeshes.push(roofGeo);
    };

    // Southern Civic & Logistics Sector
    for (let x = -750; x <= 750; x += 130) {
      if (Math.abs(x) < 70) continue;
      addContextBuilding(x, 430, 48 + (x % 5) * 4, 34 + (x % 3) * 3, 14 + (Math.abs(x) % 4) * 3, Math.abs(x) % 6);
      addContextBuilding(x + 25, 540, 56 + (x % 4) * 5, 42 + (x % 2) * 4, 20 + (Math.abs(x) % 5) * 4, (Math.abs(x) + 2) % 6);
      addContextBuilding(x - 15, 680, 68 + (x % 3) * 6, 48 + (x % 4) * 4, 16 + (Math.abs(x) % 3) * 3, (Math.abs(x) + 4) % 6);
    }

    // East Innovation District
    for (let z = -550; z <= 450; z += 120) {
      addContextBuilding(560, z, 52 + (z % 4) * 4, 40 + (z % 3) * 4, 18 + (Math.abs(z) % 4) * 4, Math.abs(z) % 6);
      addContextBuilding(700, z + 30, 62 + (z % 3) * 5, 48 + (z % 5) * 3, 24 + (Math.abs(z) % 5) * 5, (Math.abs(z) + 1) % 6);
      addContextBuilding(840, z - 20, 46 + (z % 5) * 4, 38 + (z % 2) * 5, 15 + (Math.abs(z) % 3) * 3, (Math.abs(z) + 3) % 6);
    }

    // North Academic Sector
    for (let x = -700; x <= 700; x += 125) {
      addContextBuilding(x, -480, 54 + (x % 4) * 4, 36 + (x % 3) * 4, 18 + (Math.abs(x) % 5) * 3, Math.abs(x) % 6);
      addContextBuilding(x + 35, -620, 64 + (x % 3) * 6, 44 + (x % 4) * 4, 22 + (Math.abs(x) % 4) * 4, (Math.abs(x) + 2) % 6);
      addContextBuilding(x - 20, -760, 48 + (x % 5) * 5, 38 + (x % 2) * 5, 14 + (Math.abs(x) % 3) * 3, (Math.abs(x) + 5) % 6);
    }

    // West Mixed-Use Sector
    for (let z = -550; z <= 450; z += 125) {
      addContextBuilding(-560, z, 50 + (z % 4) * 5, 38 + (z % 3) * 4, 16 + (Math.abs(z) % 4) * 3, Math.abs(z) % 6);
      addContextBuilding(-700, z + 25, 60 + (z % 3) * 6, 46 + (z % 4) * 4, 22 + (Math.abs(z) % 5) * 4, (Math.abs(z) + 2) % 6);
      addContextBuilding(-840, z - 25, 52 + (z % 5) * 4, 40 + (z % 2) * 5, 15 + (Math.abs(z) % 3) * 3, (Math.abs(z) + 4) % 6);
    }

    buildingMeshesByMat.forEach((geos, idx) => {
      if (geos.length > 0) {
        const merged = BufferGeometryUtils.mergeGeometries(geos);
        const mesh = new THREE.Mesh(merged, this.cityFacadeMats[idx]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.subgroups.cityContext.add(mesh);
      }
    });

    if (roofMeshes.length > 0) {
      const mergedRoofs = BufferGeometryUtils.mergeGeometries(roofMeshes);
      const rMesh = new THREE.Mesh(mergedRoofs, this.cityRoofMat);
      rMesh.receiveShadow = true;
      this.subgroups.cityContext.add(rMesh);
    }
  }

  buildDistantGreenBelts() {
    const forestBoxes = [];
    const coniferBoxes = [];

    const addForestPatch = (cx, cz, w, d, h = 8) => {
      if (Math.abs(cx) < 380 && Math.abs(cz) < 290) return;
      const b = new THREE.BoxGeometry(w, h, d);
      b.translate(cx, h * 0.5, cz);
      forestBoxes.push(b);
    };

    const addConiferPatch = (cx, cz, w, d, h = 10) => {
      if (Math.abs(cx) < 380 && Math.abs(cz) < 290) return;
      const b = new THREE.BoxGeometry(w, h, d);
      b.translate(cx, h * 0.5, cz);
      coniferBoxes.push(b);
    };

    // Regional green belts framing highways and sectors
    for (let x = -1050; x <= 1050; x += 180) {
      addForestPatch(x, 340, 140, 60, 9);
      addConiferPatch(x + 50, -320, 150, 70, 11);
      addForestPatch(x - 40, -440, 130, 80, 8);
    }

    for (let z = -900; z <= 900; z += 180) {
      addConiferPatch(-400, z, 70, 150, 10);
      addForestPatch(400, z, 70, 140, 8);
      addForestPatch(-950, z, 100, 160, 9);
      addConiferPatch(950, z, 100, 160, 11);
    }

    if (forestBoxes.length > 0) {
      const mergedForest = BufferGeometryUtils.mergeGeometries(forestBoxes);
      const fMesh = new THREE.Mesh(mergedForest, this.distantCanopyMat);
      fMesh.castShadow = true;
      fMesh.receiveShadow = true;
      this.subgroups.distantForests.add(fMesh);
    }

    if (coniferBoxes.length > 0) {
      const mergedConifers = BufferGeometryUtils.mergeGeometries(coniferBoxes);
      const cMesh = new THREE.Mesh(mergedConifers, this.distantConiferMat);
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      this.subgroups.distantForests.add(cMesh);
    }
  }

  buildContextVehicles() {
    const vehicleCount = 36;
    const bodyGeo = new THREE.BoxGeometry(2.1, 1.1, 4.4);
    bodyGeo.translate(0, 0.75, 0);

    const roofGeo = new THREE.BoxGeometry(1.8, 0.75, 2.4);
    roofGeo.translate(0, 1.6, -0.2);

    const mergedCar = BufferGeometryUtils.mergeGeometries([bodyGeo, roofGeo]);

    const instMesh = new THREE.InstancedMesh(mergedCar, this.carPaintMats[0], vehicleCount);
    instMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // South Regional Highway vehicles
    for (let x = -850; x <= 850 && idx < vehicleCount; x += 120) {
      dummy.position.set(x, 0.04, 280 - 3.5);
      dummy.rotation.set(0, Math.PI * 0.5, 0);
      dummy.scale.set(1.0, 1.0, 1.0);
      dummy.updateMatrix();
      instMesh.setMatrixAt(idx++, dummy.matrix);

      if (idx < vehicleCount) {
        dummy.position.set(x + 50, 0.04, 280 + 3.5);
        dummy.rotation.set(0, -Math.PI * 0.5, 0);
        dummy.updateMatrix();
        instMesh.setMatrixAt(idx++, dummy.matrix);
      }
    }

    instMesh.instanceMatrix.needsUpdate = true;
    this.subgroups.vehicles.add(instMesh);
  }
}
