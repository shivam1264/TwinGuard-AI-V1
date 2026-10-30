import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TextureHelper } from './TextureHelper.js';

export class CampusEnvironment {
  constructor(scene, parentGroup) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'CampusEnvironment';
    parentGroup.add(this.group);

    this.initMaterials();
    this.buildGroundAndPlaza();
    this.buildRoadNetworkAndParking();
    this.buildLandscapingAndVegetation();
    this.buildStreetFurnitureAndWater();
    this.buildVehiclesAndEVChargers();
    this.buildSurroundingCityscape();
    this.buildMusterZones();
  }

  initMaterials() {
    // 1. Terrain & Plaza Textures
    this.grassTex = TextureHelper.createGrassLawnTexture();
    this.paverTex = TextureHelper.createPaverStoneTexture ? TextureHelper.createPaverStoneTexture() : TextureHelper.createPlazaPavingTexture();
    this.asphaltTex = TextureHelper.createAsphaltRoadTexture();
    this.parkingTex = TextureHelper.createParkingLotTexture ? TextureHelper.createParkingLotTexture() : this.asphaltTex;
    this.waterTex = TextureHelper.createWaterCausticsTexture();
    this.crosswalkTex = TextureHelper.createCrosswalkTexture();
    this.treeBarkTex = TextureHelper.createTreeBarkTexture();
    this.treeFoliageTex = TextureHelper.createTreeFoliageTexture();
    this.skylineGlassTex = TextureHelper.createSurroundingBuildingGlassTexture ? TextureHelper.createSurroundingBuildingGlassTexture() : null;
    this.facadePanelTex = TextureHelper.createCommercialFacadeTexture ? TextureHelper.createCommercialFacadeTexture() : null;

    // 2. High-Fidelity PBR Materials
    this.grassMat = new THREE.MeshStandardMaterial({
      map: this.grassTex,
      roughness: 0.85,
      metalness: 0.05
    });

    this.plazaPaverMat = new THREE.MeshStandardMaterial({
      map: this.paverTex,
      roughness: 0.45,
      metalness: 0.12
    });

    this.podiumGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.25
    });

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTex,
      roughness: 0.75,
      metalness: 0.15
    });

    this.parkingLotMat = new THREE.MeshStandardMaterial({
      map: this.parkingTex,
      roughness: 0.72,
      metalness: 0.18
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.55,
      metalness: 0.1
    });

    this.roadStripeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1
    });

    this.roadStripeYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      metalness: 0.1
    });

    this.crosswalkMat = new THREE.MeshStandardMaterial({
      map: this.crosswalkTex,
      roughness: 0.45,
      metalness: 0.1,
      transparent: true
    });

    // Water Surface Material (Shimmering PBR)
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0c4a6e,
      roughness: 0.08,
      metalness: 0.85,
      map: this.waterTex,
      transparent: true,
      opacity: 0.88
    });

    this.waterBasaltBorderMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.3
    });

    // Vegetation Materials
    this.treeBarkMat = new THREE.MeshStandardMaterial({
      map: this.treeBarkTex,
      roughness: 0.9,
      metalness: 0.05
    });

    this.deciduousFoliageMat = new THREE.MeshStandardMaterial({
      map: this.treeFoliageTex,
      color: 0x3f6212,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.cypressFoliageMat = new THREE.MeshStandardMaterial({
      map: this.treeFoliageTex,
      color: 0x14532d,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.birchFoliageMat = new THREE.MeshStandardMaterial({
      map: this.treeFoliageTex,
      color: 0x4d7c0f,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.7,
      metalness: 0.05
    });

    this.planterConcreteMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.1
    });

    this.mulchSoilMat = new THREE.MeshStandardMaterial({
      color: 0x271911,
      roughness: 0.95,
      metalness: 0.02
    });

    // Street Furniture & Lighting Materials
    this.lampPostMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75
    });

    this.lampHeadGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfffaed
    });

    this.bollardSteelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85
    });

    this.bollardGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    this.benchWoodMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.45,
      metalness: 0.05
    });

    this.benchFrameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });

    // Vehicle Materials (Sleek Automotive PBR)
    this.carPaintObsidian = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.15, metalness: 0.9 });
    this.carPaintPearl = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.18, metalness: 0.85 });
    this.carPaintSapphire = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2, metalness: 0.88 });
    this.carPaintSilver = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.92 });
    this.carGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.85 });
    this.carWheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85, metalness: 0.2 });

    // Surrounding City Architecture Materials
    this.cityGlassMat = new THREE.MeshStandardMaterial({
      map: this.skylineGlassTex,
      color: 0xdbeafe,
      roughness: 0.12,
      metalness: 0.88
    });

    this.cityFacadeMat = new THREE.MeshStandardMaterial({
      map: this.facadePanelTex,
      color: 0xe2e8f0,
      roughness: 0.55,
      metalness: 0.2
    });

    this.cityRoofMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.25
    });
  }

  // ── 1. GROUND, PODIUM & ENTRANCE PLAZA ──
  buildGroundAndPlaza() {
    // A. Vast Campus Park Terrain (600m x 600m)
    const parkGeo = new THREE.PlaneGeometry(600, 600);
    const park = new THREE.Mesh(parkGeo, this.grassMat);
    park.rotation.x = -Math.PI / 2;
    park.position.y = -0.06;
    park.receiveShadow = true;
    this.group.add(park);

    // B. Main Architectural Pedestrian Plaza (108m x 96m)
    const plazaGeo = new THREE.PlaneGeometry(108, 96);
    const plaza = new THREE.Mesh(plazaGeo, this.plazaPaverMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 2);
    plaza.receiveShadow = true;
    this.group.add(plaza);

    // C. Elevated Building Podium (Basalt foundation base under existing building: 66m x 54m)
    const podiumGeo = new THREE.BoxGeometry(66, 0.28, 54);
    const podium = new THREE.Mesh(podiumGeo, this.podiumGraniteMat);
    podium.position.set(0, -0.12, 0);
    podium.receiveShadow = true;
    this.group.add(podium);

    // D. Grand Stepped Entrance Terrace (South Facade, leading up to canopy)
    const stepsGeos = [];
    const stepDepths = [1.2, 1.2, 1.2, 1.4];
    let curZ = 23.5;
    let curY = 0.05;
    for (let s = 0; s < 4; s++) {
      const step = new THREE.BoxGeometry(26, 0.14, stepDepths[s]);
      step.translate(0, curY, curZ);
      stepsGeos.push(step);
      curZ += stepDepths[s];
      curY -= 0.035;
    }
    const mergedSteps = BufferGeometryUtils.mergeGeometries(stepsGeos);
    const stepsMesh = new THREE.Mesh(mergedSteps, this.plazaPaverMat);
    stepsMesh.receiveShadow = true;
    this.group.add(stepsMesh);
  }

  // ── 2. ROAD NETWORK & PARKING LOTS ──
  buildRoadNetworkAndParking() {
    const roadGeos = [];
    const roadThick = 0.08;

    // A. Primary South Boulevard (4 lanes wide: 24m width, 240m length)
    const sBlvd = new THREE.BoxGeometry(240, roadThick, 24);
    sBlvd.translate(0, 0.01, 58);
    roadGeos.push(sBlvd);

    // B. North Campus Perimeter Drive (14m width, 240m length)
    const nRoad = new THREE.BoxGeometry(240, roadThick, 16);
    nRoad.translate(0, 0.01, -56);
    roadGeos.push(nRoad);

    // C. West Campus Avenue (16m width, 130m length)
    const wRoad = new THREE.BoxGeometry(16, roadThick, 130);
    wRoad.translate(-62, 0.01, 1);
    roadGeos.push(wRoad);

    // D. East Campus Avenue (16m width, 130m length)
    const eRoad = new THREE.BoxGeometry(16, roadThick, 130);
    eRoad.translate(62, 0.01, 1);
    roadGeos.push(eRoad);

    const mergedRoad = BufferGeometryUtils.mergeGeometries(roadGeos);
    const roadMesh = new THREE.Mesh(mergedRoad, this.asphaltMat);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // E. Corporate Parking Lots (West Parking Bay & East Parking Bay)
    // West Parking Lot: 36m wide x 28m deep (adjacent to West Plaza)
    const wParkingGeo = new THREE.PlaneGeometry(36, 28);
    const wParking = new THREE.Mesh(wParkingGeo, this.parkingLotMat);
    wParking.rotation.x = -Math.PI / 2;
    wParking.position.set(-88, 0.03, 10);
    wParking.receiveShadow = true;
    this.group.add(wParking);

    // East Parking Lot: 36m wide x 28m deep
    const eParkingGeo = new THREE.PlaneGeometry(36, 28);
    const eParking = new THREE.Mesh(eParkingGeo, this.parkingLotMat);
    eParking.rotation.x = -Math.PI / 2;
    eParking.position.set(88, 0.03, 10);
    eParking.receiveShadow = true;
    this.group.add(eParking);

    // F. Road Markings (White Edges & Yellow Centerlines)
    const whiteLineGeos = [];
    const yellowDashGeos = [];

    // Helper: Yellow dashed centerline
    const addYellowDashes = (startX, startZ, endX, endZ) => {
      const isHorizontal = Math.abs(endX - startX) > Math.abs(endZ - startZ);
      const dashLen = 3.0;
      const gapLen = 2.5;
      if (isHorizontal) {
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        for (let x = minX + 2; x < maxX - 2; x += dashLen + gapLen) {
          const d = new THREE.PlaneGeometry(dashLen, 0.22);
          d.rotateX(-Math.PI / 2);
          d.translate(x + dashLen / 2, 0.04, startZ);
          yellowDashGeos.push(d);
        }
      } else {
        const minZ = Math.min(startZ, endZ);
        const maxZ = Math.max(startZ, endZ);
        for (let z = minZ + 2; z < maxZ - 2; z += dashLen + gapLen) {
          const d = new THREE.PlaneGeometry(0.22, dashLen);
          d.rotateX(-Math.PI / 2);
          d.translate(startX, 0.04, z + dashLen / 2);
          yellowDashGeos.push(d);
        }
      }
    };

    // Centerlines
    addYellowDashes(-110, 58, 110, 58);   // South Blvd
    addYellowDashes(-110, -56, 110, -56); // North Road
    addYellowDashes(-62, -50, -62, 50);   // West Ave
    addYellowDashes(62, -50, 62, 50);     // East Ave

    // White Edge Lines
    const addWhiteEdge = (x, z, len, isX) => {
      const g = isX ? new THREE.PlaneGeometry(len, 0.2) : new THREE.PlaneGeometry(0.2, len);
      g.rotateX(-Math.PI / 2);
      g.translate(x, 0.038, z);
      whiteLineGeos.push(g);
    };

    addWhiteEdge(0, 46.2, 220, true);
    addWhiteEdge(0, 69.8, 220, true);
    addWhiteEdge(0, -48.2, 220, true);
    addWhiteEdge(0, -63.8, 220, true);
    addWhiteEdge(-54.2, 0, 110, false);
    addWhiteEdge(-69.8, 0, 110, false);
    addWhiteEdge(54.2, 0, 110, false);
    addWhiteEdge(69.8, 0, 110, false);

    if (whiteLineGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(whiteLineGeos), this.roadStripeWhiteMat));
    }
    if (yellowDashGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(yellowDashGeos), this.roadStripeYellowMat));
    }

    // G. Pedestrian Crosswalks connecting to campus exits
    const crosswalkSouth = new THREE.Mesh(new THREE.PlaneGeometry(10, 24), this.crosswalkMat);
    crosswalkSouth.rotation.x = -Math.PI / 2;
    crosswalkSouth.position.set(0, 0.042, 58);
    this.group.add(crosswalkSouth);

    const crosswalkWest = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), this.crosswalkMat);
    crosswalkWest.rotation.x = -Math.PI / 2;
    crosswalkWest.position.set(-62, 0.042, 0);
    this.group.add(crosswalkWest);

    const crosswalkEast = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), this.crosswalkMat);
    crosswalkEast.rotation.x = -Math.PI / 2;
    crosswalkEast.position.set(62, 0.042, 0);
    this.group.add(crosswalkEast);

    // H. Chamfered Granite Curbs
    const curbGeos = [];
    const curbW = 0.38;
    const curbH = 0.2;
    const addCurb = (x, z, lenX, lenZ) => {
      const c = new THREE.BoxGeometry(lenX, curbH, lenZ);
      c.translate(x, curbH / 2 + 0.01, z);
      curbGeos.push(c);
    };

    // Plaza Perimeter Curbs (with exit gaps)
    addCurb(-28, 46, 42, curbW);
    addCurb(28, 46, 42, curbW);
    addCurb(0, -48, 100, curbW);
    addCurb(-54, -22, curbW, 46);
    addCurb(-54, 22, curbW, 46);
    addCurb(54, -22, curbW, 46);
    addCurb(54, 22, curbW, 46);

    // Outer Boulevard Curbs
    addCurb(0, 70, 220, curbW);
    addCurb(0, -64, 220, curbW);

    if (curbGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(curbGeos), this.curbMat));
    }
  }

  // ── 3. BOTANICAL LANDSCAPING, TREES & GARDEN BEDS ──
  buildLandscapingAndVegetation() {
    const treeTrunkGeos = [];
    const deciduousFoliageGeos = [];
    const cypressFoliageGeos = [];
    const birchFoliageGeos = [];
    const planterGeos = [];
    const hedgeGeos = [];
    const mulchGeos = [];

    // Helper: Branch / Stem Generator
    const createBranch = (p1, p2, r1, r2, radialSegments = 7) => {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(r2, r1, len, radialSegments);
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
      geo.applyQuaternion(quat);
      geo.translate(mid.x, mid.y, mid.z);
      return geo;
    };

    // Helper: Organic Leaf Canopy Pod (Billowing vertex perturbation)
    const createOrganicPod = (radius, scaleY = 1.0, seed = 1.0) => {
      const geo = new THREE.IcosahedronGeometry(radius, 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const noise = Math.sin(x * 3.5 + seed) * 0.16 +
                      Math.cos(y * 4.1 + z * 2.8 + seed * 1.7) * 0.16 +
                      Math.sin(z * 4.3 + x * 2.5) * 0.09;
        pos.setXYZ(i, (x + noise * x) * 1.0, (y + noise * y) * scaleY, (z + noise * z) * 1.0);
      }
      geo.computeVertexNormals();
      return geo;
    };

    let treeSeed = 15.0;

    // 1. Broadleaf Shade Oak Tree
    const addOakTree = (tx, tz, scale = 1.0) => {
      const seed = treeSeed++;
      // Trunk Base Buttress Roots
      for (let r = 0; r < 4; r++) {
        const ang = (r * Math.PI) / 2 + 0.3 * Math.sin(seed + r);
        const rx = Math.cos(ang) * 0.75 * scale;
        const rz = Math.sin(ang) * 0.75 * scale;
        treeTrunkGeos.push(createBranch([tx + rx, 0.02, tz + rz], [tx, 0.8 * scale, tz], 0.18 * scale, 0.36 * scale));
      }

      // Crooked Main Stem
      const midX = tx + 0.15 * scale * Math.sin(seed * 0.8);
      const midZ = tz + 0.14 * scale * Math.cos(seed * 0.9);
      const splitX = tx - 0.1 * scale * Math.cos(seed * 0.7);
      const splitZ = tz + 0.11 * scale * Math.sin(seed * 0.8);

      treeTrunkGeos.push(createBranch([tx, 0.75 * scale, tz], [midX, 2.3 * scale, midZ], 0.38 * scale, 0.29 * scale));
      treeTrunkGeos.push(createBranch([midX, 2.3 * scale, midZ], [splitX, 3.8 * scale, splitZ], 0.29 * scale, 0.22 * scale));

      // 4 Main Canopy Scaffold Boughs
      const boughs = [
        { dx:  1.8 * scale, dy: 5.2 * scale, dz:  0.9 * scale, r: 0.14 * scale },
        { dx: -1.9 * scale, dy: 5.0 * scale, dz:  0.8 * scale, r: 0.14 * scale },
        { dx:  0.4 * scale, dy: 5.3 * scale, dz: -1.9 * scale, r: 0.14 * scale },
        { dx: -0.2 * scale, dy: 5.8 * scale, dz:  0.3 * scale, r: 0.15 * scale },
      ];

      boughs.forEach((b) => {
        treeTrunkGeos.push(createBranch([splitX, 3.8 * scale, splitZ], [tx + b.dx, b.dy, tz + b.dz], 0.2 * scale, b.r));
      });

      // Volumetric Billowing Leaf Masses (15 organic pods)
      const layers = [
        { y: 4.8 * scale, count: 6, dist: 2.3 * scale, pr: 1.7 * scale, sy: 0.95 },
        { y: 6.2 * scale, count: 6, dist: 1.6 * scale, pr: 1.8 * scale, sy: 1.05 },
        { y: 7.4 * scale, count: 3, dist: 0.6 * scale, pr: 1.5 * scale, sy: 1.00 }
      ];

      layers.forEach((l, lIdx) => {
        for (let p = 0; p < l.count; p++) {
          const ang = (p / l.count) * Math.PI * 2 + lIdx * 0.9;
          const pod = createOrganicPod(l.pr, l.sy, seed + lIdx * 3 + p);
          pod.translate(tx + Math.cos(ang) * l.dist, l.y, tz + Math.sin(ang) * l.dist);
          deciduousFoliageGeos.push(pod);
        }
      });

      // Soil Mulch Bed
      const mulch = new THREE.CircleGeometry(1.6 * scale, 16);
      mulch.rotateX(-Math.PI / 2);
      mulch.translate(tx, 0.035, tz);
      mulchGeos.push(mulch);
    };

    // 2. Columnar Italian Cypress Spire
    const addCypressTree = (cx, cz, scale = 1.0) => {
      const seed = treeSeed++;
      const trunk = new THREE.CylinderGeometry(0.14 * scale, 0.24 * scale, 2.6 * scale, 8);
      trunk.translate(cx, (2.6 * scale) / 2 + 0.02, cz);
      treeTrunkGeos.push(trunk);

      const layers = [
        { y: 2.4 * scale, r: 0.8 * scale, count: 3, dist: 0.3 * scale, sy: 1.4 },
        { y: 3.9 * scale, r: 0.95 * scale, count: 4, dist: 0.35 * scale, sy: 1.5 },
        { y: 5.4 * scale, r: 0.8 * scale, count: 3, dist: 0.25 * scale, sy: 1.55 },
        { y: 6.8 * scale, r: 0.58 * scale, count: 1, dist: 0.0, sy: 1.7 },
        { y: 7.8 * scale, r: 0.4 * scale, count: 1, dist: 0.0, sy: 1.75 }
      ];

      layers.forEach((l, lIdx) => {
        for (let p = 0; p < l.count; p++) {
          const ang = (p / l.count) * Math.PI * 2 + lIdx * 0.8;
          const pod = createOrganicPod(l.r, l.sy, seed + lIdx * 2 + p);
          pod.translate(cx + Math.cos(ang) * l.dist, l.y, cz + Math.sin(ang) * l.dist);
          cypressFoliageGeos.push(pod);
        }
      });

      const mulch = new THREE.CircleGeometry(1.0 * scale, 14);
      mulch.rotateX(-Math.PI / 2);
      mulch.translate(cx, 0.035, cz);
      mulchGeos.push(mulch);
    };

    // 3. Plant trees strategically across campus & along boulevards
    // South Promenade & Boulevard Line (Foreground & midground as seen in reference images)
    addOakTree(-38, 36, 1.15);
    addOakTree(-24, 38, 1.05);
    addOakTree(-10, 38, 1.1);
    addOakTree(36, 38, 1.15);
    addOakTree(48, 36, 1.05);

    // Boulevard Medians / Sidewalks
    addOakTree(-78, 58, 1.25);
    addOakTree(-48, 72, 1.3);
    addOakTree(0, 72, 1.35);
    addOakTree(48, 72, 1.3);
    addOakTree(78, 58, 1.25);

    // North Campus Garden
    addOakTree(-45, -42, 1.2);
    addOakTree(-18, -42, 1.15);
    addOakTree(18, -42, 1.15);
    addOakTree(45, -42, 1.2);
    addOakTree(0, -68, 1.4);

    // Architectural Cypress Spires framing the building corners & entrance
    addCypressTree(-16, 28, 1.05);
    addCypressTree(-12, 28, 0.95);
    addCypressTree(12, 28, 0.95);
    addCypressTree(16, 28, 1.05);

    // Corner Accents
    addCypressTree(-38, -14, 1.1);
    addCypressTree(-38, 14, 1.1);
    addCypressTree(38, -14, 1.1);
    addCypressTree(38, 14, 1.1);
    addCypressTree(-44, -36, 1.15);
    addCypressTree(44, -36, 1.15);

    // 4. Layered Planters with Dense Boxwood Hedges (As seen in Reference Image 1 & 2)
    const addPlanterHedge = (px, pz, w, d) => {
      const ph = 0.55;
      const planter = new THREE.BoxGeometry(w, ph, d);
      planter.translate(px, ph / 2 + 0.02, pz);
      planterGeos.push(planter);

      const hh = 0.6;
      const hedge = new THREE.BoxGeometry(w - 0.3, hh, d - 0.3);
      hedge.translate(px, ph + hh / 2 - 0.05, pz);
      hedgeGeos.push(hedge);
    };

    // South Entrance Flanking Planters
    for (const sx of [-40, -30, -20, 20, 30, 40]) {
      addPlanterHedge(sx, 44, 4.8, 1.4);
    }
    // North Garden Planters
    for (const nx of [-36, -20, -4, 12, 28, 44]) {
      addPlanterHedge(nx, -46, 5.2, 1.4);
    }
    // West & East Wings
    for (const z of [-32, -18, 18, 32]) {
      addPlanterHedge(-52, z, 1.4, 5.0);
      addPlanterHedge(52, z, 1.4, 5.0);
    }

    if (treeTrunkGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(treeTrunkGeos), this.treeBarkMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (deciduousFoliageGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(deciduousFoliageGeos), this.deciduousFoliageMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (cypressFoliageGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(cypressFoliageGeos), this.cypressFoliageMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (planterGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(planterGeos), this.planterConcreteMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (hedgeGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(hedgeGeos), this.hedgeMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (mulchGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(mulchGeos), this.mulchSoilMat));
    }
  }

  // ── 4. STREET FURNITURE, WATER COURT & LIGHTING ──
  buildStreetFurnitureAndWater() {
    // A. Architectural Reflecting Pool / Water Court (As seen in Reference Image 3)
    // Located at the South-East entrance plaza (x: 15 to 35, z: 18 to 28)
    const poolW = 20;
    const poolD = 8;
    const poolBorderW = 0.6;
    const poolCopings = [];

    const copS = new THREE.BoxGeometry(poolW + poolBorderW * 2, 0.32, poolBorderW);
    copS.translate(25, 0.16, 28);
    poolCopings.push(copS);

    const copN = new THREE.BoxGeometry(poolW + poolBorderW * 2, 0.32, poolBorderW);
    copN.translate(25, 0.16, 20);
    poolCopings.push(copN);

    const copW = new THREE.BoxGeometry(poolBorderW, 0.32, poolD);
    copW.translate(15 - poolBorderW / 2, 0.16, 24);
    poolCopings.push(copW);

    const copE = new THREE.BoxGeometry(poolBorderW, 0.32, poolD);
    copE.translate(35 + poolBorderW / 2, 0.16, 24);
    poolCopings.push(copE);

    this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(poolCopings), this.waterBasaltBorderMat));

    // Water Surface
    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(poolW, poolD), this.waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(25, 0.22, 24);
    this.group.add(waterMesh);

    // B. Slender Contemporary Street Lamps (LED Cantilever Poles)
    const poleGeos = [];
    const luminaireGeos = [];

    const addLamp = (lx, lz, rotY) => {
      const pole = new THREE.CylinderGeometry(0.1, 0.14, 7.2, 12);
      pole.translate(0, 3.6, 0);

      const arm = new THREE.BoxGeometry(0.1, 0.1, 2.5);
      arm.translate(0, 7.15, 1.25);

      const lamp = BufferGeometryUtils.mergeGeometries([pole, arm]);
      lamp.rotateY(rotY);
      lamp.translate(lx, 0.02, lz);
      poleGeos.push(lamp);

      const head = new THREE.BoxGeometry(0.42, 0.09, 1.4);
      head.rotateY(rotY);
      const sin = Math.sin(rotY);
      const cos = Math.cos(rotY);
      head.translate(lx + sin * 2.1, 7.08, lz + cos * 2.1);
      luminaireGeos.push(head);
    };

    // Place along boulevard & perimeter roads
    addLamp(-80, 71, Math.PI);
    addLamp(-40, 71, Math.PI);
    addLamp(0, 71, Math.PI);
    addLamp(40, 71, Math.PI);
    addLamp(80, 71, Math.PI);

    addLamp(-70.5, -20, Math.PI / 2);
    addLamp(-70.5, 20, Math.PI / 2);
    addLamp(70.5, -20, -Math.PI / 2);
    addLamp(70.5, 20, -Math.PI / 2);

    addLamp(-60, -65, 0);
    addLamp(0, -65, 0);
    addLamp(60, -65, 0);

    if (poleGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(poleGeos), this.lampPostMat);
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    if (luminaireGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(luminaireGeos), this.lampHeadGlowMat));
    }

    // C. Stainless Steel Illuminated Safety Bollards (Flanking Walkways)
    const bollardGeos = [];
    const glowGeos = [];
    const addBollard = (bx, bz) => {
      const post = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
      post.translate(bx, 0.45 + 0.02, bz);
      bollardGeos.push(post);

      const ring = new THREE.CylinderGeometry(0.126, 0.126, 0.09, 12);
      ring.translate(bx, 0.82 + 0.02, bz);
      glowGeos.push(ring);
    };

    for (const bz of [28, 32, 36, 40]) {
      addBollard(-6.5, bz);
      addBollard(6.5, bz);
    }
    for (const bx of [-33, -37, -41, -45]) {
      addBollard(bx, -4.5);
      addBollard(bx, 4.5);
    }
    for (const bx of [33, 37, 41, 45]) {
      addBollard(bx, -4.5);
      addBollard(bx, 4.5);
    }

    if (bollardGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(bollardGeos), this.bollardSteelMat));
    }
    if (glowGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(glowGeos), this.bollardGlowMat));
    }

    // D. Teak Wood Architectural Benches
    const benchWoodGeos = [];
    const benchSteelGeos = [];

    const addBench = (bx, bz, rotY) => {
      for (let s = 0; s < 3; s++) {
        const slat = new THREE.BoxGeometry(2.4, 0.045, 0.16);
        slat.translate(0, 0.48, s * 0.18 - 0.18);
        slat.rotateY(rotY);
        slat.translate(bx, 0.02, bz);
        benchWoodGeos.push(slat);
      }
      for (let b = 0; b < 2; b++) {
        const slat = new THREE.BoxGeometry(2.4, 0.15, 0.045);
        slat.translate(0, 0.72 + b * 0.16, -0.32);
        slat.rotateY(rotY);
        slat.translate(bx, 0.02, bz);
        benchWoodGeos.push(slat);
      }
      for (const lx of [-1.0, 1.0]) {
        const leg = new THREE.BoxGeometry(0.06, 0.88, 0.65);
        leg.translate(lx, 0.44, -0.05);
        leg.rotateY(rotY);
        leg.translate(bx, 0.02, bz);
        benchSteelGeos.push(leg);
      }
    };

    addBench(-26, 32, 0);
    addBench(-16, 32, 0);
    addBench(16, 32, Math.PI);
    addBench(-38, -26, Math.PI / 2);
    addBench(38, -26, -Math.PI / 2);

    if (benchWoodGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(benchWoodGeos), this.benchWoodMat));
    }
    if (benchSteelGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(benchSteelGeos), this.benchFrameMat));
    }

    // E. Outdoor Cafe Tables with Architectural White Umbrellas (As seen in Reference Image 2)
    const umbrellaGeos = [];
    const tableGeos = [];

    const addCafeSet = (tx, tz) => {
      // Umbrella Canopy (Hexagonal pyramid)
      const canopy = new THREE.ConeGeometry(2.2, 0.6, 6);
      canopy.translate(tx, 3.2, tz);
      umbrellaGeos.push(canopy);

      // Umbrella Mast
      const mast = new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8);
      mast.translate(tx, 1.6, tz);
      tableGeos.push(mast);

      // Round Table
      const table = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16);
      table.translate(tx, 0.85, tz);
      tableGeos.push(table);
    };

    addCafeSet(38, 22);
    addCafeSet(44, 22);
    addCafeSet(41, 16);

    if (umbrellaGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(umbrellaGeos), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })));
    }
    if (tableGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(tableGeos), this.lampPostMat));
    }
  }

  // ── 5. VEHICLES & EV CHARGING STATIONS ──
  buildVehiclesAndEVChargers() {
    const carObsidianGeos = [];
    const carPearlGeos = [];
    const carSapphireGeos = [];
    const carSilverGeos = [];
    const carGlassGeos = [];
    const carWheelGeos = [];
    const evChargerGeos = [];
    const evGlowGeos = [];

    // Helper: Aerodynamic 3D Sedan / SUV
    const addCar = (cx, cz, rotY, style = 'obsidian') => {
      // Lower Chassis
      const chassis = new THREE.BoxGeometry(2.1, 0.65, 4.7);
      chassis.translate(0, 0.48, 0);

      // Cabin Glass House
      const cabin = new THREE.BoxGeometry(1.88, 0.55, 2.6);
      cabin.translate(0, 1.02, -0.25);

      const body = BufferGeometryUtils.mergeGeometries([chassis, cabin]);
      body.rotateY(rotY);
      body.translate(cx, 0.02, cz);

      if (style === 'obsidian') carObsidianGeos.push(body);
      else if (style === 'pearl') carPearlGeos.push(body);
      else if (style === 'sapphire') carSapphireGeos.push(body);
      else carSilverGeos.push(body);

      // Glass Windows
      const glass = new THREE.BoxGeometry(1.9, 0.52, 2.64);
      glass.translate(0, 1.02, -0.25);
      glass.rotateY(rotY);
      glass.translate(cx, 0.02, cz);
      carGlassGeos.push(glass);

      // 4 Wheels
      for (const wx of [-1.02, 1.02]) {
        for (const wz of [-1.45, 1.45]) {
          const wheel = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 14);
          wheel.rotateZ(Math.PI / 2);
          wheel.translate(wx, 0.36, wz);
          wheel.rotateY(rotY);
          wheel.translate(cx, 0.02, cz);
          carWheelGeos.push(wheel);
        }
      }
    };

    // Parked Vehicles in South Drop-off & Parking Bays
    addCar(-22, 50, 0, 'obsidian');   // Executive Sedan
    addCar(18, 50, 0, 'pearl');       // EV Crossover
    addCar(-82, 14, Math.PI / 2, 'sapphire'); // In West Lot
    addCar(-82, 6, Math.PI / 2, 'silver');
    addCar(-82, -2, Math.PI / 2, 'obsidian');
    addCar(-94, 14, -Math.PI / 2, 'pearl');
    addCar(-94, 6, -Math.PI / 2, 'sapphire');

    // East Parking Lot Cars
    addCar(82, 14, -Math.PI / 2, 'pearl');
    addCar(82, 6, -Math.PI / 2, 'silver');
    addCar(94, 14, Math.PI / 2, 'obsidian');
    addCar(94, 6, Math.PI / 2, 'sapphire');

    // EV Charging Pedestals (As seen in Reference Image 2)
    const addEVCharger = (ex, ez, rotY) => {
      const pedestal = new THREE.BoxGeometry(0.45, 1.5, 0.35);
      pedestal.translate(0, 0.75, 0);
      pedestal.rotateY(rotY);
      pedestal.translate(ex, 0.02, ez);
      evChargerGeos.push(pedestal);

      const screen = new THREE.BoxGeometry(0.28, 0.35, 0.04);
      screen.translate(0, 1.15, 0.18);
      screen.rotateY(rotY);
      screen.translate(ex, 0.02, ez);
      evGlowGeos.push(screen);
    };

    // Install EV chargers along parking stalls
    addEVCharger(-88, 20, 0);
    addEVCharger(-84, 20, 0);
    addEVCharger(-80, 20, 0);
    addEVCharger(88, 20, 0);
    addEVCharger(84, 20, 0);

    if (carObsidianGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carObsidianGeos), this.carPaintObsidian);
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    if (carPearlGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carPearlGeos), this.carPaintPearl);
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    if (carSapphireGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carSapphireGeos), this.carPaintSapphire);
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    if (carSilverGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carSilverGeos), this.carPaintSilver);
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    if (carGlassGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carGlassGeos), this.carGlassMat));
    }
    if (carWheelGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carWheelGeos), this.carWheelMat));
    }
    if (evChargerGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(evChargerGeos), this.curbMat));
    }
    if (evGlowGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(evGlowGeos), new THREE.MeshBasicMaterial({ color: 0x10b981 })));
    }
  }

  // ── 6. SURROUNDING 3D URBAN CITYSCAPE (Full Environmental Depth) ──
  buildSurroundingCityscape() {
    const cityGlassGeos = [];
    const cityFacadeGeos = [];
    const cityRoofGeos = [];

    // Helper: Surrounding Commercial Mid-Rise Office Block
    const addCommercialBlock = (bx, bz, width, depth, height, floors = 8) => {
      // Main Glass Curtain Wall Volume
      const tower = new THREE.BoxGeometry(width, height, depth);
      tower.translate(bx, height / 2, bz);
      cityGlassGeos.push(tower);

      // Horizontal Spandrel Louvers / Precast Bands
      const floorH = height / floors;
      for (let f = 0; f <= floors; f++) {
        const band = new THREE.BoxGeometry(width + 0.6, 0.45, depth + 0.6);
        band.translate(bx, f * floorH, bz);
        cityFacadeGeos.push(band);
      }

      // Rooftop Mechanical Penthouse / HVAC Enclosure
      const hvac = new THREE.BoxGeometry(width * 0.55, 3.5, depth * 0.55);
      hvac.translate(bx, height + 1.75, bz);
      cityRoofGeos.push(hvac);
    };

    // A. Nearby Corporate Campus Buildings (Distance: 80m to 140m from building)
    // 1. North Campus Wing (8 stories, modern low-slung corporate office as in Image 2)
    addCommercialBlock(0, -96, 92, 28, 32, 8);

    // 2. East Commercial Tower (14 stories, glass office tower)
    addCommercialBlock(105, 0, 38, 48, 54, 14);

    // 3. West Technology Block (10 stories, contemporary office block)
    addCommercialBlock(-105, 0, 42, 44, 40, 10);

    // 4. South-East Boulevard Commercial Wing
    addCommercialBlock(115, 85, 52, 34, 42, 11);

    // 5. South-West Boulevard Commercial Wing
    addCommercialBlock(-115, 85, 48, 36, 46, 12);

    // B. Distant Urban Skyline (Distance: 190m to 380m)
    // Creates realistic 360° parallax when orbiting!
    const distantTowers = [
      // North & North-East Skyline
      { x: -140, z: -170, w: 45, d: 45, h: 85, fl: 22 },
      { x:  -60, z: -190, w: 55, d: 40, h: 105, fl: 26 },
      { x:   40, z: -180, w: 48, d: 48, h: 115, fl: 28 },
      { x:  130, z: -160, w: 52, d: 42, h: 78, fl: 20 },

      // East Skyline
      { x: 190, z: -70, w: 50, d: 50, h: 95, fl: 24 },
      { x: 210, z:  20, w: 44, d: 44, h: 125, fl: 32 },
      { x: 180, z: 110, w: 48, d: 48, h: 88, fl: 22 },

      // South & South-East Skyline
      { x:  70, z: 180, w: 56, d: 46, h: 92, fl: 23 },
      { x: -40, z: 190, w: 52, d: 52, h: 110, fl: 28 },
      { x: 140, z: 210, w: 46, d: 46, h: 80, fl: 20 },

      // West Skyline
      { x: -190, z: -60, w: 48, d: 48, h: 90, fl: 23 },
      { x: -210, z:  30, w: 52, d: 46, h: 120, fl: 30 },
      { x: -180, z: 120, w: 46, d: 46, h: 84, fl: 21 },
    ];

    distantTowers.forEach(t => addCommercialBlock(t.x, t.z, t.w, t.d, t.h, t.fl));

    // C. Distant City Skyline Communication / TV Spire (As seen in Reference Image 1)
    const spireMast = new THREE.CylinderGeometry(0.8, 3.5, 95, 12);
    spireMast.translate(-195, 95 / 2, -220);
    cityRoofGeos.push(spireMast);

    const spirePod = new THREE.SphereGeometry(7.5, 16, 16);
    spirePod.translate(-195, 68, -220);
    cityFacadeGeos.push(spirePod);

    if (cityGlassGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(cityGlassGeos), this.cityGlassMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (cityFacadeGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(cityFacadeGeos), this.cityFacadeMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (cityRoofGeos.length > 0) {
      const mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(cityRoofGeos), this.cityRoofMat);
      this.group.add(mesh);
    }
  }

  // ── 7. EMERGENCY ASSEMBLY MUSTER ZONES ──
  buildMusterZones() {
    const createZone = (x, z, name) => {
      // Outer Safety Ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(4.8, 5.4, 32),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.75,
          side: THREE.DoubleSide
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.035, z);
      this.group.add(ring);

      // Inner Safe Disc
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(1.8, 24),
        new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.5 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, 0.033, z);
      this.group.add(disc);

      // 3D Safety Totem Monolith
      const totem = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3.6, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.85 })
      );
      totem.position.set(x, 1.8, z + (z >= 0 ? 5.8 : -5.8));
      totem.castShadow = true;
      this.group.add(totem);

      // Glowing Sign Badge
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 1.2, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 1.2 })
      );
      sign.position.set(x, 2.6, z + (z >= 0 ? 5.8 : -5.8));
      this.group.add(sign);
    };

    createZone(-38, 0, 'MUSTER A (WEST)');
    createZone(38, 0, 'MUSTER B (EAST)');
    createZone(0, 36, 'MUSTER C (SOUTH)');
  }
}
