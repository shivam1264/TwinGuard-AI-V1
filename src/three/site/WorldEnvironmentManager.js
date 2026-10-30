import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ============================================================================
// REGIONAL ENVIRONMENT & SURROUNDING WORLD SYSTEM (2.4KM SCALE)
// ============================================================================
// Embeds the 720m x 600m institutional campus into a believable, seamless
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
    // 1. Surrounding Peripheral Earth & Meadow Turf Texture (Warm Natural Field)
    const worldGrassCanvas = document.createElement('canvas');
    worldGrassCanvas.width = 1024;
    worldGrassCanvas.height = 1024;
    const wgCtx = worldGrassCanvas.getContext('2d');
    wgCtx.fillStyle = '#264a1d'; // Natural regional meadow green
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

    // 2. Regional Primary Highway Asphalt (12m width, matte deep charcoal)
    this.regionalHighwayMat = new THREE.MeshStandardMaterial({
      color: 0x222832,
      roughness: 0.85,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    // 3. Surrounding City Context Building Materials (6 muted architectural tones)
    this.cityFacadeMats = [
      new THREE.MeshStandardMaterial({ color: 0xdde3ea, roughness: 0.75, metalness: 0.1 }), // Warm stone / white concrete
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, metalness: 0.15 }), // Cool slate architectural precast
      new THREE.MeshStandardMaterial({ color: 0xc8b8a6, roughness: 0.8, metalness: 0.05 }), // Pale sand brick / masonry
      new THREE.MeshStandardMaterial({ color: 0xb5c0cc, roughness: 0.65, metalness: 0.2 }), // Glazed civic / commercial block
      new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.85, metalness: 0.05 }), // Mid-tone residential plaster
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.25 })  // Industrial / service tech mass
    ];

    this.cityRoofMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15
    });

    // 4. Distant Tree Canopy Materials
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

    // 5. Vehicle Materials
    this.carPaintMats = [
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.7 }), // Pearl White
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.75 }), // Dark Navy / Black
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.6 }),  // Silver Grey
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35, metalness: 0.65 }), // Amber Red
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.65 })  // Deep Blue
    ];
  }

  // 1. Seamless Atmospheric Sky Dome & Gradient Horizon
  buildAtmosphericSkyDome() {
    // Large hemisphere dome covering 2.4km world (Radius 2200m)
    const domeGeo = new THREE.SphereGeometry(2200, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    
    // Procedural sky gradient canvas
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 256;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext('2d');
    const grad = sCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#78a6d6'); // Zenith daylight blue
    grad.addColorStop(0.4, '#a2c2e6'); // Upper sky
    grad.addColorStop(0.7, '#cbe0f4'); // Mid atmosphere
    grad.addColorStop(0.9, '#e4effa'); // Lower haze
    grad.addColorStop(1.0, '#eaf0f8'); // Horizon mist (blends into terrain and fog)
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

  // 2. Seamless Continuous Regional World Terrain (2.4km x 2.4km with gentle topography)
  buildRegionalTerrain() {
    const worldSize = 2500;
    const segments = 64;
    const terrainGeo = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    // Sculpt gentle natural elevation variations (0m to 5.5m)
    // Campus area (-400 to 400, -320 to 340) stays mostly flat (<0.02m) so buildings rest securely.
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Distance from campus perimeter
      const distFromCenter = Math.hypot(x, z);
      let elev = 0;

      // In the regional surroundings (>420m), add gentle rolling relief
      if (distFromCenter > 420) {
        const factor = Math.min(1.0, (distFromCenter - 420) / 450);
        // Soft rolling swells
        const wave1 = Math.sin(x * 0.0035) * Math.cos(z * 0.0035) * 3.5;
        const wave2 = Math.cos(x * 0.006 + 1.2) * Math.sin(z * 0.005) * 2.2;
        elev = (wave1 + wave2 + 1.5) * factor;
      }

      // Slightly lower depression for South-East water basin runoff
      if (x > 180 && z > 200) {
        elev -= 0.8;
      }

      pos.setY(i, Math.max(-0.2, elev));
    }

    terrainGeo.computeVertexNormals();

    const worldTerrainMesh = new THREE.Mesh(terrainGeo, this.worldTerrainMat);
    worldTerrainMesh.receiveShadow = true;
    worldTerrainMesh.name = 'REGIONAL-TERRAIN-BASE';
    worldTerrainMesh.position.set(0, -0.02, 0); // Sits right underneath campus layers
    this.subgroups.regionalTerrain.add(worldTerrainMesh);
  }

  // 3. Regional Arterial Road Network (Connecting Campus into the External World)
  buildRegionalRoadNetwork() {
    const roadGeos = [];
    const roadWidth = 13.0; // 4-lane major regional arterial

    // A. Southern Regional Highway (running East-West along z = 330 from x = -1200 to +1200)
    const sHw = new THREE.PlaneGeometry(2400, roadWidth);
    sHw.rotateX(-Math.PI / 2);
    sHw.translate(0, 0.022, 330);
    roadGeos.push(sHw);

    // Highway Shoulder Strip (North & South)
    const shS1 = new THREE.PlaneGeometry(2400, 1.8);
    shS1.rotateX(-Math.PI / 2);
    shS1.translate(0, 0.024, 330 - roadWidth * 0.5 - 0.9);
    const shS2 = new THREE.PlaneGeometry(2400, 1.8);
    shS2.rotateX(-Math.PI / 2);
    shS2.translate(0, 0.024, 330 + roadWidth * 0.5 + 0.9);
    roadGeos.push(shS1, shS2);

    // B. Main South Entrance Boulevard Extension (from South Gate at z = 295 down to Regional Highway at z = 330 and continuing South to z = 1100)
    const sConnector = new THREE.PlaneGeometry(10.0, 800);
    sConnector.rotateX(-Math.PI / 2);
    sConnector.translate(-10, 0.022, 715);
    roadGeos.push(sConnector);

    // C. Western Regional Parkway (running North-South along x = -440 from z = -1100 to +1100)
    const wHw = new THREE.PlaneGeometry(roadWidth, 2200);
    wHw.rotateX(-Math.PI / 2);
    wHw.translate(-440, 0.022, 0);
    roadGeos.push(wHw);

    // D. Eastern Innovation Parkway (running North-South along x = +440 from z = -1100 to +1100)
    const eHw = new THREE.PlaneGeometry(roadWidth, 2200);
    eHw.rotateX(-Math.PI / 2);
    eHw.translate(440, 0.022, 0);
    roadGeos.push(eHw);

    // E. Northern Regional Beltway (running East-West along z = -380 from x = -1100 to +1100)
    const nHw = new THREE.PlaneGeometry(2200, roadWidth);
    nHw.rotateX(-Math.PI / 2);
    nHw.translate(0, 0.022, -380);
    roadGeos.push(nHw);

    // F. Connector Roads from Campus Gates into Regional Parkways:
    // 1. Northwest Service Gate connector (from x = -270, z = -210 extending to Western Parkway at x = -440)
    const nwConnector = new THREE.PlaneGeometry(180, 7.5);
    nwConnector.rotateX(-Math.PI / 2);
    nwConnector.translate(-355, 0.022, -210);
    roadGeos.push(nwConnector);

    // 2. West Sports & Parking connector (from x = -160, z = 195 extending to Western Parkway at x = -440)
    const wConn2 = new THREE.PlaneGeometry(280, 7.0);
    wConn2.rotateX(-Math.PI / 2);
    wConn2.translate(-300, 0.022, 195);
    roadGeos.push(wConn2);

    // 3. East Technology & Secondary Parking connector (from x = 245, z = 188 extending to Eastern Parkway at x = 440)
    const eConn1 = new THREE.PlaneGeometry(200, 7.0);
    eConn1.rotateX(-Math.PI / 2);
    eConn1.translate(345, 0.022, 188);
    roadGeos.push(eConn1);

    // 4. North Academic connector (from x = 165, z = -125 extending to Northern Beltway at z = -380)
    const nConn1 = new THREE.PlaneGeometry(7.0, 260);
    nConn1.rotateX(-Math.PI / 2);
    nConn1.translate(165, 0.022, -250);
    roadGeos.push(nConn1);

    const mergedRoads = BufferGeometryUtils.mergeGeometries(roadGeos);
    const roadMesh = new THREE.Mesh(mergedRoads, this.regionalHighwayMat);
    roadMesh.receiveShadow = true;
    roadMesh.name = 'REGIONAL-ROAD-NETWORK';
    this.subgroups.regionalRoads.add(roadMesh);
  }

  // 4. Surrounding Low-Density City Context (Office blocks, residential clusters, civic parcels)
  buildSurroundingCityContext() {
    // We create organized contextual clusters outside the campus perimeter
    // 4 major contextual sectors: South Gateway District, East Tech Corridor, North Science Park, West Mixed-Use
    const buildingMeshesByMat = [[], [], [], [], [], []];
    const roofMeshes = [];

    const addContextBuilding = (cx, cz, w, d, h, matIdx = 0, rotY = 0) => {
      // Avoid campus inner core (-380 to 380, -300 to 320)
      if (Math.abs(cx) < 390 && Math.abs(cz) < 310) return;

      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      bodyGeo.translate(0, h * 0.5 + 0.05, 0);
      if (rotY !== 0) bodyGeo.rotateY(rotY);
      bodyGeo.translate(cx, 0, cz);
      buildingMeshesByMat[matIdx % 6].push(bodyGeo);

      // Parapet roof box
      const roofGeo = new THREE.BoxGeometry(w * 0.92, 0.8, d * 0.92);
      roofGeo.translate(0, h + 0.45, 0);
      if (rotY !== 0) roofGeo.rotateY(rotY);
      roofGeo.translate(cx, 0, cz);
      roofMeshes.push(roofGeo);
    };

    // --- SECTOR A: SOUTHERN CIVIC & LOGISTICS CORRIDOR (z = 400 to 800) ---
    for (let x = -750; x <= 750; x += 130) {
      if (Math.abs(x - (-10)) < 70) continue; // Leave central highway corridor open
      // Front row low-rise commercial / services
      addContextBuilding(x, 430, 48 + (x % 5) * 4, 34 + (x % 3) * 3, 14 + (Math.abs(x) % 4) * 3, Math.abs(x) % 6);
      // Back row mid-rise commercial
      addContextBuilding(x + 25, 540, 56 + (x % 4) * 5, 42 + (x % 2) * 4, 20 + (Math.abs(x) % 5) * 4, (Math.abs(x) + 2) % 6);
      // Distant industrial / tech mass
      addContextBuilding(x - 15, 680, 68 + (x % 3) * 6, 48 + (x % 4) * 4, 16 + (Math.abs(x) % 3) * 3, (Math.abs(x) + 4) % 6);
    }

    // --- SECTOR B: EAST INNOVATION DISTRICT (x = 520 to 950) ---
    for (let z = -550; z <= 450; z += 120) {
      // Tech pavilions & research blocks
      addContextBuilding(560, z, 52 + (z % 4) * 4, 40 + (z % 3) * 4, 18 + (Math.abs(z) % 4) * 4, Math.abs(z) % 6);
      addContextBuilding(700, z + 30, 62 + (z % 3) * 5, 48 + (z % 5) * 3, 24 + (Math.abs(z) % 5) * 5, (Math.abs(z) + 1) % 6);
      addContextBuilding(840, z - 20, 46 + (z % 5) * 4, 38 + (z % 2) * 5, 15 + (Math.abs(z) % 3) * 3, (Math.abs(z) + 3) % 6);
    }

    // --- SECTOR C: NORTH ACADEMIC & RESIDENTIAL COMMON (z = -480 to -850) ---
    for (let x = -700; x <= 700; x += 125) {
      // Residential mid-rises & academic extensions
      addContextBuilding(x, -480, 54 + (x % 4) * 4, 36 + (x % 3) * 4, 18 + (Math.abs(x) % 5) * 3, Math.abs(x) % 6);
      addContextBuilding(x + 35, -620, 64 + (x % 3) * 6, 44 + (x % 4) * 4, 22 + (Math.abs(x) % 4) * 4, (Math.abs(x) + 2) % 6);
      addContextBuilding(x - 20, -760, 48 + (x % 5) * 5, 38 + (x % 2) * 5, 14 + (Math.abs(x) % 3) * 3, (Math.abs(x) + 5) % 6);
    }

    // --- SECTOR D: WEST LOGISTICS, SPORTS & RESIDENTIAL COMMONS (x = -520 to -950) ---
    for (let z = -550; z <= 450; z += 125) {
      // Logistics, service depots and residential apartments
      addContextBuilding(-560, z, 50 + (z % 4) * 5, 38 + (z % 3) * 4, 16 + (Math.abs(z) % 4) * 3, Math.abs(z) % 6);
      addContextBuilding(-700, z + 25, 60 + (z % 3) * 6, 46 + (z % 4) * 4, 22 + (Math.abs(z) % 5) * 4, (Math.abs(z) + 2) % 6);
      addContextBuilding(-840, z - 25, 52 + (z % 5) * 4, 40 + (z % 2) * 5, 15 + (Math.abs(z) % 3) * 3, (Math.abs(z) + 4) % 6);
    }

    // Merge and instantiate contextual building blocks
    buildingMeshesByMat.forEach((geos, idx) => {
      if (geos.length > 0) {
        const merged = BufferGeometryUtils.mergeGeometries(geos);
        const mesh = new THREE.Mesh(merged, this.cityFacadeMats[idx]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `CITY-CONTEXT-FACADE-${idx}`;
        this.subgroups.cityContext.add(mesh);
      }
    });

    if (roofMeshes.length > 0) {
      const mergedRoofs = BufferGeometryUtils.mergeGeometries(roofMeshes);
      const roofMesh = new THREE.Mesh(mergedRoofs, this.cityRoofMat);
      roofMesh.receiveShadow = true;
      roofMesh.name = 'CITY-CONTEXT-ROOFS';
      this.subgroups.cityContext.add(roofMesh);
    }
  }

  // 5. Distant Green Belts & Tree Forests (Surrounding Woodlands & Buffer Belts)
  buildDistantGreenBelts() {
    // Generate intentional regional forest clusters and green buffer belts:
    // Buffer A: Perimeter Campus Green Belt (between campus perimeter and regional parkways)
    // Buffer B: Distant Woodland Groves (framing the regional horizon)
    const treePoints = [];

    // Helper: add woodland cluster
    const addWoodland = (cx, cz, count, radius) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const tx = cx + Math.cos(a) * r;
        const tz = cz + Math.sin(a) * r;
        // Avoid highways (distance to main regional roads > 15m)
        if (Math.abs(tz - 330) < 18) continue;
        if (Math.abs(tx - (-440)) < 18) continue;
        if (Math.abs(tx - 440) < 18) continue;
        if (Math.abs(tz - (-380)) < 18) continue;
        // Avoid inner campus core
        if (Math.abs(tx) < 380 && Math.abs(tz) < 300) continue;

        treePoints.push({
          x: tx,
          z: tz,
          scale: 1.1 + Math.random() * 0.6,
          isConifer: Math.random() > 0.65
        });
      }
    };

    // Regional Woodland Groves
    // South woodlands
    addWoodland(-300, 480, 36, 90);
    addWoodland(280, 480, 36, 90);
    addWoodland(-600, 600, 48, 120);
    addWoodland(580, 620, 48, 120);

    // East woodlands
    addWoodland(500, -200, 40, 80);
    addWoodland(620, 100, 45, 95);
    addWoodland(780, -380, 50, 110);
    addWoodland(760, 320, 42, 90);

    // North woodlands
    addWoodland(-320, -520, 45, 95);
    addWoodland(300, -520, 45, 95);
    addWoodland(0, -680, 60, 130);
    addWoodland(-600, -680, 45, 100);
    addWoodland(580, -700, 45, 100);

    // West woodlands
    addWoodland(-500, -100, 40, 85);
    addWoodland(-640, 120, 45, 95);
    addWoodland(-780, -320, 50, 110);
    addWoodland(-760, 320, 45, 95);

    // Build instanced low-poly distant trees
    const deciduousTrunk = new THREE.CylinderGeometry(0.3, 0.45, 4.0, 6);
    const deciduousCrown = new THREE.SphereGeometry(3.2, 8, 6);
    deciduousCrown.scale(1.2, 0.9, 1.2);

    const coniferTrunk = new THREE.CylinderGeometry(0.25, 0.4, 3.6, 6);
    const coniferCrown = new THREE.ConeGeometry(2.4, 5.5, 6);

    const decList = treePoints.filter(t => !t.isConifer);
    const conList = treePoints.filter(t => t.isConifer);

    this.createDistantTreeInstances(decList, deciduousTrunk, deciduousCrown, this.materials.trunkMat, this.distantCanopyMat);
    this.createDistantTreeInstances(conList, coniferTrunk, coniferCrown, this.materials.trunkMat, this.distantConiferMat);
  }

  createDistantTreeInstances(list, trunkGeo, crownGeo, trunkMat, crownMat) {
    if (!list || list.length === 0) return;
    const count = list.length;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, count);
    trunkInst.receiveShadow = true;
    crownInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const t = list[i];
      const s = t.scale || 1.2;

      dummy.position.set(t.x, 2.0 * s, t.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, 4.8 * s, t.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      crownInst.setMatrixAt(i, dummy.matrix);
    }

    trunkInst.instanceMatrix.needsUpdate = true;
    crownInst.instanceMatrix.needsUpdate = true;
    this.subgroups.distantForests.add(trunkInst);
    this.subgroups.distantForests.add(crownInst);
  }

  // 6. Context Vehicles (Subtle scale and physical realism markers on regional roads)
  buildContextVehicles() {
    // 25-35 scattered low-poly vehicles along the regional highway corridors
    const carGeo = new THREE.BoxGeometry(2.1, 1.1, 4.4);
    const cabinGeo = new THREE.BoxGeometry(1.9, 0.85, 2.4);
    cabinGeo.translate(0, 0.95, -0.2);
    const combinedCar = BufferGeometryUtils.mergeGeometries([carGeo, cabinGeo]);

    const vehicleCoords = [
      // Southern Highway (z = 330)
      { x: -550, z: 327, rotY: Math.PI * 0.5, matIdx: 0 },
      { x: -380, z: 333, rotY: -Math.PI * 0.5, matIdx: 1 },
      { x: -180, z: 327, rotY: Math.PI * 0.5, matIdx: 2 },
      { x: 80,   z: 333, rotY: -Math.PI * 0.5, matIdx: 3 },
      { x: 260,  z: 327, rotY: Math.PI * 0.5, matIdx: 4 },
      { x: 480,  z: 333, rotY: -Math.PI * 0.5, matIdx: 0 },
      { x: 720,  z: 327, rotY: Math.PI * 0.5, matIdx: 2 },
      // South Entrance Boulevard (x = -10, z = 310 to 650)
      { x: -8,  z: 380, rotY: 0, matIdx: 1 },
      { x: -12, z: 490, rotY: Math.PI, matIdx: 0 },
      { x: -8,  z: 620, rotY: 0, matIdx: 3 },
      // Western Parkway (x = -440)
      { x: -437, z: -350, rotY: 0, matIdx: 2 },
      { x: -443, z: -80,  rotY: Math.PI, matIdx: 4 },
      { x: -437, z: 120,  rotY: 0, matIdx: 0 },
      { x: -443, z: 380,  rotY: Math.PI, matIdx: 1 },
      // Eastern Parkway (x = 440)
      { x: 443, z: -280, rotY: Math.PI, matIdx: 3 },
      { x: 437, z: 40,   rotY: 0, matIdx: 1 },
      { x: 443, z: 240,  rotY: Math.PI, matIdx: 0 },
      // Northern Beltway (z = -380)
      { x: -280, z: -383, rotY: Math.PI * 0.5, matIdx: 2 },
      { x: 60,   z: -377, rotY: -Math.PI * 0.5, matIdx: 4 },
      { x: 380,  z: -383, rotY: Math.PI * 0.5, matIdx: 1 }
    ];

    vehicleCoords.forEach(vc => {
      const vMesh = new THREE.Mesh(combinedCar, this.carPaintMats[vc.matIdx % this.carPaintMats.length]);
      vMesh.position.set(vc.x, 0.6, vc.z);
      vMesh.rotation.y = vc.rotY;
      vMesh.castShadow = true;
      this.subgroups.vehicles.add(vMesh);
    });
  }
}

