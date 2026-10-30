import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  CAMPUS_BOUNDS,
  CAMPUS_LAKE,
  SPORTS_COMPLEX,
  CAMPUS_ENTRANCES
} from './CampusLayout.js';

// ============================================================================
// CAMPUS LANDSCAPE, LAKE, SPORTS RECREATION & ARBORICULTURE
// ============================================================================
// Recreates the authoritative master plan landscape:
// - South-East Eco-Lake with center island, shoreline path & blossom trees
// - West Sports Complex: 400m tartan running track + soccer pitch + hardcourts
// - 4 Instanced Tree Species (Oaks, Conifers, Ornamentals, and Pink Blossoms)
// - Grand Campus Portal with divided lanes, median & monument
// - Service Gate & Southern Regional Highway

export class LandscapeManager {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'Landscape';
    this.group.userData = { id: 'LANDSCAPE-SYSTEM', type: 'LANDSCAPE_AND_TERRAIN' };

    this.subgroups = {
      ground: new THREE.Group(),
      lake: new THREE.Group(),
      sports: new THREE.Group(),
      districtZones: new THREE.Group(),
      boundary: new THREE.Group(),
      trees: new THREE.Group(),
      entrances: new THREE.Group()
    };

    this.group.add(this.subgroups.ground);
    this.group.add(this.subgroups.lake);
    this.group.add(this.subgroups.sports);
    this.group.add(this.subgroups.districtZones);
    this.group.add(this.subgroups.boundary);
    this.group.add(this.subgroups.trees);
    this.group.add(this.subgroups.entrances);

    this.buildTerrain();
    this.buildCampusLake();
    this.buildSportsComplex();
    this.buildDistrictGroundZones();
    this.buildCampusBoundary();
    this.buildInstancedForest();
    this.buildCampusEntrances();
  }

  createBorderCurb(w, d, thick = 0.45, height = 0.14) {
    const halfW = w * 0.5;
    const halfD = d * 0.5;
    const cN = new THREE.BoxGeometry(w + thick, height, thick);
    cN.translate(0, height * 0.5, -halfD);
    const cS = new THREE.BoxGeometry(w + thick, height, thick);
    cS.translate(0, height * 0.5, halfD);
    const cW = new THREE.BoxGeometry(thick, height, d);
    cW.translate(-halfW, height * 0.5, 0);
    const cE = new THREE.BoxGeometry(thick, height, d);
    cE.translate(halfW, height * 0.5, 0);
    return BufferGeometryUtils.mergeGeometries([cN, cS, cW, cE]);
  }

  // 1. Broad Master Campus Terrain Base
  buildTerrain() {
    const b = CAMPUS_BOUNDS;
    const w = b.width;
    const d = b.depth;

    const terrainGeo = new THREE.PlaneGeometry(w + 140, d + 140, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(0, 0.00, 10);

    const terrainMesh = new THREE.Mesh(terrainGeo, this.materials.grassMat);
    terrainMesh.receiveShadow = false;
    terrainMesh.userData = { id: 'CAMPUS-TERRAIN-BASE', type: 'TERRAIN_PARCEL' };
    this.subgroups.ground.add(terrainMesh);
  }

  // 2. South-East Lake & Landscape Open Space
  buildCampusLake() {
    const lake = CAMPUS_LAKE;
    const cx = lake.center.x;
    const cz = lake.center.z;
    const w = lake.size.width;
    const d = lake.size.depth;

    const lakeGroup = new THREE.Group();
    lakeGroup.name = 'CAMPUS-LAKE';

    // A. Excavated Lake Embankment Stone Curb
    const rimGeo = new THREE.RingGeometry(w * 0.48, w * 0.52, 64);
    rimGeo.scale(1.0, d / w, 1.0);
    const rimMesh = new THREE.Mesh(rimGeo, this.materials.curbMat);
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.set(cx, 0.058, cz);
    rimMesh.receiveShadow = true;
    lakeGroup.add(rimMesh);

    // B. Serene Reflective Lake Water Surface
    const waterGeo = new THREE.CircleGeometry(w * 0.49, 64);
    waterGeo.scale(1.0, d / w, 1.0);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(cx, 0.046, cz);
    waterMesh.receiveShadow = true;
    lakeGroup.add(waterMesh);

    // C. Center Natural Island with Manicured Lawn
    const isR = lake.islandRadius;
    const islandGeo = new THREE.CircleGeometry(isR, 32);
    const islandMesh = new THREE.Mesh(islandGeo, this.materials.courtyardTurfMat);
    islandMesh.rotation.x = -Math.PI / 2;
    islandMesh.position.set(cx, 0.068, cz);
    islandMesh.receiveShadow = true;
    lakeGroup.add(islandMesh);

    const isCurbGeo = new THREE.RingGeometry(isR - 0.4, isR, 32);
    const isCurbMesh = new THREE.Mesh(isCurbGeo, this.materials.curbMat);
    isCurbMesh.rotation.x = -Math.PI / 2;
    isCurbMesh.position.set(cx, 0.078, cz);
    lakeGroup.add(isCurbMesh);

    // D. Outer Shoreline Walking Trail Ribbon
    const trailRingGeo = new THREE.RingGeometry(w * 0.52, w * 0.56, 64);
    trailRingGeo.scale(1.0, d / w, 1.0);
    const trailRing = new THREE.Mesh(trailRingGeo, this.materials.paverMat);
    trailRing.rotation.x = -Math.PI / 2;
    trailRing.position.set(cx, 0.042, cz);
    trailRing.receiveShadow = true;
    lakeGroup.add(trailRing);

    this.subgroups.lake.add(lakeGroup);
  }

  // 3. West Sports & Recreation Complex
  buildSportsComplex() {
    const sc = SPORTS_COMPLEX;
    const sportsGroup = new THREE.Group();
    sportsGroup.name = 'SPORTS-COMPLEX';

    const tL = sc.trackSize.length;
    const tW = sc.trackSize.width;
    const tcX = sc.center.x;
    const tcZ = sc.center.z;

    // Red Tartan Track Base
    const trackBaseGeo = new THREE.BoxGeometry(tL, 0.08, tW);
    trackBaseGeo.translate(tcX, 0.04, tcZ);
    const trackMesh = new THREE.Mesh(trackBaseGeo, this.materials.tartanTrackMat);
    trackMesh.receiveShadow = true;
    sportsGroup.add(trackMesh);

    // Track Perimeter Border Curb (Border only!)
    const trackCurbGeo = this.createBorderCurb(tL, tW, 0.4, 0.14);
    trackCurbGeo.translate(tcX, 0.04, tcZ);
    const trackCurb = new THREE.Mesh(trackCurbGeo, this.materials.curbMat);
    trackCurb.castShadow = true;
    trackCurb.receiveShadow = true;
    sportsGroup.add(trackCurb);

    // Inner Green Athletic / Soccer Pitch
    const pL = sc.pitchSize.length;
    const pW = sc.pitchSize.width;
    const pitchGeo = new THREE.PlaneGeometry(pL, pW);
    pitchGeo.rotateX(-Math.PI / 2);
    pitchGeo.translate(tcX, 0.082, tcZ);
    const pitchMesh = new THREE.Mesh(pitchGeo, this.materials.courtyardTurfMat);
    pitchMesh.receiveShadow = true;
    sportsGroup.add(pitchMesh);

    // Pitch White Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const pitchLines = [];

    const bLines = [
      { w: pL, d: 0.25, x: tcX, z: tcZ - pW * 0.5 },
      { w: pL, d: 0.25, x: tcX, z: tcZ + pW * 0.5 },
      { w: 0.25, d: pW, x: tcX - pL * 0.5, z: tcZ },
      { w: 0.25, d: pW, x: tcX + pL * 0.5, z: tcZ },
      { w: 0.25, d: pW, x: tcX, z: tcZ },
      { w: 12, d: 0.25, x: tcX - pL * 0.5 + 6, z: tcZ - 10 },
      { w: 12, d: 0.25, x: tcX - pL * 0.5 + 6, z: tcZ + 10 },
      { w: 0.25, d: 20, x: tcX - pL * 0.5 + 12, z: tcZ },
      { w: 12, d: 0.25, x: tcX + pL * 0.5 - 6, z: tcZ - 10 },
      { w: 12, d: 0.25, x: tcX + pL * 0.5 - 6, z: tcZ + 10 },
      { w: 0.25, d: 20, x: tcX + pL * 0.5 - 12, z: tcZ }
    ];

    bLines.forEach(bl => {
      const g = new THREE.PlaneGeometry(bl.w, bl.d);
      g.rotateX(-Math.PI / 2);
      g.translate(bl.x, 0.085, bl.z);
      pitchLines.push(g);
    });

    if (pitchLines.length > 0) {
      const mergedLines = BufferGeometryUtils.mergeGeometries(pitchLines);
      const linesMesh = new THREE.Mesh(mergedLines, lineMat);
      sportsGroup.add(linesMesh);
    }

    // Hardcourt Sports Area
    const ccX = sc.courtsCenter.x;
    const ccZ = sc.courtsCenter.z;
    const cW = sc.courtsSize.width;
    const cD = sc.courtsSize.depth;

    const courtBaseGeo = new THREE.PlaneGeometry(cW, cD);
    courtBaseGeo.rotateX(-Math.PI / 2);
    courtBaseGeo.translate(ccX, 0.035, ccZ);
    const courtBase = new THREE.Mesh(courtBaseGeo, this.materials.courtGreenMat);
    courtBase.receiveShadow = true;
    sportsGroup.add(courtBase);

    const pad1Geo = new THREE.PlaneGeometry(cW * 0.44, cD * 0.8);
    pad1Geo.rotateX(-Math.PI / 2);
    pad1Geo.translate(ccX - cW * 0.24, 0.038, ccZ);
    const pad1 = new THREE.Mesh(pad1Geo, this.materials.courtBlueMat);
    pad1.receiveShadow = true;
    sportsGroup.add(pad1);

    const pad2Geo = new THREE.PlaneGeometry(cW * 0.44, cD * 0.8);
    pad2Geo.rotateX(-Math.PI / 2);
    pad2Geo.translate(ccX + cW * 0.24, 0.038, ccZ);
    const pad2 = new THREE.Mesh(pad2Geo, this.materials.courtBlueMat);
    pad2.receiveShadow = true;
    sportsGroup.add(pad2);

    const courtCurbGeo = this.createBorderCurb(cW, cD, 0.35, 0.12);
    courtCurbGeo.translate(ccX, 0.035, ccZ);
    const courtCurb = new THREE.Mesh(courtCurbGeo, this.materials.curbMat);
    courtCurb.castShadow = true;
    courtCurb.receiveShadow = true;
    sportsGroup.add(courtCurb);

    this.subgroups.sports.add(sportsGroup);
  }

  // 4. District Ground Zoning Panels (Lawn Panels with Border-Only Curbs)
  buildDistrictGroundZones() {
    const zoneGeos = [];
    const curbGeos = [];

    // Hero Building Flanking Formal Lawns
    const lawnEast = new THREE.PlaneGeometry(36, 46);
    lawnEast.rotateX(-Math.PI / 2);
    lawnEast.translate(34, 0.012, 52);
    zoneGeos.push(lawnEast);

    const curbLE = this.createBorderCurb(36, 46, 0.35, 0.12);
    curbLE.translate(34, 0.012, 52);
    curbGeos.push(curbLE);

    const lawnWest = new THREE.PlaneGeometry(36, 46);
    lawnWest.rotateX(-Math.PI / 2);
    lawnWest.translate(-34, 0.012, 52);
    zoneGeos.push(lawnWest);

    const curbLW = this.createBorderCurb(36, 46, 0.35, 0.12);
    curbLW.translate(-34, 0.012, 52);
    curbGeos.push(curbLW);

    // Academic Zone Central Quad Lawn (North-East)
    const quadNE = new THREE.PlaneGeometry(80, 75);
    quadNE.rotateX(-Math.PI / 2);
    quadNE.translate(195, 0.012, -75);
    zoneGeos.push(quadNE);

    const curbQNE = this.createBorderCurb(80, 75, 0.35, 0.12);
    curbQNE.translate(195, 0.012, -75);
    curbGeos.push(curbQNE);

    if (zoneGeos.length > 0) {
      const mergedLawn = BufferGeometryUtils.mergeGeometries(zoneGeos);
      const lawnMesh = new THREE.Mesh(mergedLawn, this.materials.courtyardTurfMat);
      lawnMesh.receiveShadow = true;
      this.subgroups.districtZones.add(lawnMesh);
    }

    if (curbGeos.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeos);
      const curbMesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      this.subgroups.districtZones.add(curbMesh);
    }
  }

  // 5. Realistic Campus Boundary & Southern Regional Highway
  buildCampusBoundary() {
    const b = CAMPUS_BOUNDS;
    const wallGeos = [];

    const wallH = 1.0;
    const wallW = 0.35;
    const boundaryWallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.15
    });

    const segments = [
      { x1: b.minX + 25, z1: b.minZ + 18, x2: b.maxX - 25, z2: b.minZ + 18 },
      { x1: b.maxX - 25, z1: b.minZ + 18, x2: b.maxX - 25, z2: b.maxZ - 20 },
      { x1: b.maxX - 25, z1: b.maxZ - 20, x2: 25, z2: b.maxZ - 20 },
      { x1: -35, z1: b.maxZ - 20, x2: b.minX + 25, z2: b.maxZ - 20 },
      { x1: b.minX + 25, z1: b.maxZ - 20, x2: b.minX + 25, z2: -195 },
      { x1: b.minX + 25, z1: -225, x2: b.minX + 25, z2: b.minZ + 18 }
    ];

    segments.forEach(seg => {
      const len = Math.hypot(seg.x2 - seg.x1, seg.z2 - seg.z1);
      const angle = Math.atan2(seg.x2 - seg.x1, seg.z2 - seg.z1);
      const wBox = new THREE.BoxGeometry(wallW, wallH, len);
      wBox.rotateY(angle);
      wBox.translate((seg.x1 + seg.x2) * 0.5, wallH * 0.5, (seg.z1 + seg.z2) * 0.5);
      wallGeos.push(wBox);
    });

    if (wallGeos.length > 0) {
      const wallMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(wallGeos), boundaryWallMat);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.subgroups.boundary.add(wallMesh);
    }

    const extRoadGeo = new THREE.PlaneGeometry(b.width + 40, 14.0);
    extRoadGeo.rotateX(-Math.PI / 2);
    extRoadGeo.translate(0, 0.015, b.maxZ - 4);
    const extRoadMesh = new THREE.Mesh(extRoadGeo, this.materials.plainAsphaltMat);
    extRoadMesh.receiveShadow = true;
    this.subgroups.boundary.add(extRoadMesh);

    const hwLineGeo = new THREE.PlaneGeometry(b.width + 40, 0.25);
    hwLineGeo.rotateX(-Math.PI / 2);
    hwLineGeo.translate(0, 0.02, b.maxZ - 4);
    const hwLineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const hwLineMesh = new THREE.Mesh(hwLineGeo, hwLineMat);
    this.subgroups.boundary.add(hwLineMesh);
  }

  // 6. Instanced Arboriculture (4 Species)
  buildInstancedForest() {
    const treeData = this.generateTreeDistribution();

    const treesType1 = [];
    const treesType2 = [];
    const treesType3 = [];
    const treesType4 = [];

    treeData.forEach(t => {
      if (t.type === 1) treesType1.push(t);
      else if (t.type === 2) treesType2.push(t);
      else if (t.type === 3) treesType3.push(t);
      else treesType4.push(t);
    });

    this.createInstancedSpecies(
      treesType1,
      new THREE.CylinderGeometry(0.26, 0.38, 3.4, 8),
      this.createDeciduousCrownGeometry(),
      this.materials.trunkMat,
      this.materials.deciduousCrownMat
    );

    this.createInstancedSpecies(
      treesType2,
      new THREE.CylinderGeometry(0.18, 0.3, 3.0, 8),
      this.createConiferCrownGeometry(),
      this.materials.trunkMat,
      this.materials.coniferCrownMat
    );

    this.createInstancedSpecies(
      treesType3,
      new THREE.CylinderGeometry(0.16, 0.24, 2.5, 8),
      this.createOrnamentalCrownGeometry(),
      this.materials.trunkMat,
      this.materials.ornamentalCrownMat
    );

    this.createInstancedSpecies(
      treesType4,
      new THREE.CylinderGeometry(0.18, 0.26, 2.6, 8),
      this.createBlossomCrownGeometry(),
      this.materials.trunkMat,
      this.materials.blossomCrownMat
    );
  }

  createInstancedSpecies(treeList, trunkBaseGeo, crownBaseGeo, trunkMat, crownMat) {
    if (!treeList || treeList.length === 0) return;

    const count = treeList.length;
    const trunkInst = new THREE.InstancedMesh(trunkBaseGeo, trunkMat, count);
    const crownInst = new THREE.InstancedMesh(crownBaseGeo, crownMat, count);

    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;
    crownInst.castShadow = true;
    crownInst.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const t = treeList[i];
      const scale = t.scale || 1.0;

      dummy.position.set(t.x, 1.7 * scale, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, 3.8 * scale, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      crownInst.setMatrixAt(i, dummy.matrix);
    }

    trunkInst.instanceMatrix.needsUpdate = true;
    crownInst.instanceMatrix.needsUpdate = true;

    this.subgroups.trees.add(trunkInst);
    this.subgroups.trees.add(crownInst);
  }

  createDeciduousCrownGeometry() {
    const s1 = new THREE.SphereGeometry(2.5, 10, 8);
    s1.scale(1.2, 0.85, 1.2);
    const s2 = new THREE.SphereGeometry(1.7, 8, 8);
    s2.translate(0.6, 1.2, -0.4);
    return BufferGeometryUtils.mergeGeometries([s1, s2]);
  }

  createConiferCrownGeometry() {
    const c1 = new THREE.ConeGeometry(1.7, 4.4, 8);
    c1.translate(0, 0.9, 0);
    const c2 = new THREE.ConeGeometry(1.3, 3.4, 8);
    c2.translate(0, 2.4, 0);
    return BufferGeometryUtils.mergeGeometries([c1, c2]);
  }

  createOrnamentalCrownGeometry() {
    const s = new THREE.SphereGeometry(1.9, 8, 8);
    s.scale(1.25, 0.95, 1.15);
    return s;
  }

  createBlossomCrownGeometry() {
    const s = new THREE.SphereGeometry(2.1, 8, 8);
    s.scale(1.3, 0.9, 1.3);
    return s;
  }

  generateTreeDistribution() {
    const trees = [];
    const addTree = (x, z, type, scaleMin = 0.85, scaleMax = 1.25) => {
      if (x > -35 && x < 35 && z > -30 && z < 30) return;
      if (x > -22 && x < 22 && z > 30 && z < 82) return;
      const dx = (x - 125) / 45;
      const dz = (z - 185) / 30;
      if (dx * dx + dz * dz < 0.85) return;
      if (x > -285 && x < -185 && z > 20 && z < 80) return;
      const cdx = (x - (-70)) / 25;
      const cdz = (z - (-10)) / 25;
      if (cdx * cdx + cdz * cdz < 0.85) return;

      const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
      const rotY = Math.random() * Math.PI * 2;
      trees.push({ x, z, type, scale, rotY });
    };

    // A. Main Entrance Boulevard Avenue
    for (let z = 235; z <= 290; z += 12) {
      addTree(-24, z, 2, 1.05, 1.25);
      addTree(18, z, 4, 1.05, 1.25);
    }

    // B. Lake Island Trees
    trees.push({ x: 125, z: 185, type: 4, scale: 1.4, rotY: 0.5 });
    trees.push({ x: 121, z: 187, type: 4, scale: 1.2, rotY: 1.2 });
    trees.push({ x: 129, z: 183, type: 1, scale: 1.2, rotY: 2.1 });

    // Lake Shoreline tree ring
    for (let a = 0; a < Math.PI * 2; a += 0.35) {
      const rx = 125 + Math.cos(a) * 52;
      const rz = 185 + Math.sin(a) * 36;
      const treeType = (Math.random() > 0.45) ? 4 : 1;
      addTree(rx, rz, treeType, 0.9, 1.3);
    }

    // C. Central Assembly Plaza Perimeter Allée
    for (let a = 0; a < Math.PI * 2; a += 0.45) {
      const rx = -70 + Math.cos(a) * 36;
      const rz = -10 + Math.sin(a) * 36;
      const treeType = (a > Math.PI) ? 4 : 1;
      addTree(rx, rz, treeType, 0.95, 1.25);
    }

    // D. Hero Building Ceremonial Forecourt Promenade Trees
    for (let z = 95; z >= 35; z -= 14) {
      addTree(14, z, 3, 0.9, 1.15);
      addTree(-14, z, 3, 0.9, 1.15);
    }

    // E. Academic & Technology Zone Quad Trees (East)
    const eastTrees = [
      { x: 180, z: 25 }, { x: 215, z: 25 }, { x: 195, z: 50 },
      { x: 175, z: -10 }, { x: 215, z: -10 }, { x: 195, z: -35 },
      { x: 175, z: -60 }, { x: 205, z: -60 }, { x: 245, z: -35 },
      { x: 155, z: -90 }, { x: 190, z: -90 }, { x: 220, z: -90 }
    ];
    eastTrees.forEach(pt => addTree(pt.x, pt.z, (Math.random() > 0.5 ? 1 : 4), 0.95, 1.25));

    // F. Research Zone Green Buffer (North)
    for (let x = -110; x <= 80; x += 20) {
      addTree(x + (Math.random() - 0.5) * 6, -105 + (Math.random() - 0.5) * 8, 2, 0.9, 1.3);
      if (Math.random() > 0.4) {
        addTree(x + 10, -95 + (Math.random() - 0.5) * 6, 1, 0.85, 1.2);
      }
    }

    // G. Public Forum & Sports Perimeter Groves (West)
    for (let z = -20; z <= 130; z += 16) {
      addTree(-195 + (Math.random() - 0.5) * 6, z, 1, 0.9, 1.25);
      addTree(-280 + (Math.random() - 0.5) * 8, z, 2, 0.9, 1.3);
      if (z % 32 === 0) {
        addTree(-235, z > 50 ? 135 : -15, 3, 0.9, 1.2);
      }
    }

    // H. Roadside Avenue Trees (Primary & Secondary Corridors)
    const avenueRoadCoords = [
      // East Technology Corridor
      { x: 90, z: 120 }, { x: 125, z: 105 }, { x: 165, z: 75 }, { x: 220, z: 40 },
      { x: 255, z: -5 }, { x: 250, z: -55 }, { x: 245, z: -105 }, { x: 210, z: -145 },
      // North Research Outer Parkway
      { x: 80, z: -195 }, { x: 30, z: -215 }, { x: -20, z: -215 }, { x: -75, z: -210 },
      { x: -125, z: -180 }, { x: -155, z: -130 },
      // West Parkway & Sports Buffer
      { x: -175, z: 75 }, { x: -175, z: 115 }, { x: -170, z: 155 }, { x: -145, z: 200 },
      { x: -95, z: 245 }, { x: -45, z: 275 },
      // Central Commons & Lawn Buffers
      { x: -45, z: 25 }, { x: -55, z: -45 }, { x: 45, z: -35 }, { x: 55, z: 25 }
    ];
    avenueRoadCoords.forEach(c => {
      const sp = Math.random() > 0.4 ? 1 : (Math.random() > 0.5 ? 2 : 4);
      addTree(c.x, c.z, sp, 0.9, 1.25);
    });

    // I. Perimeter Naturalistic Woodland Clusters (Dense Forest Framing)
    const perimeterGroves = [
      { cx: -280, cz: -220, count: 28, radius: 45 },
      { cx: -260, cz: -140, count: 22, radius: 35 },
      { cx: 280, cz: -210, count: 32, radius: 45 },
      { cx: 290, cz: -120, count: 24, radius: 38 },
      { cx: 290, cz: 210, count: 26, radius: 40 },
      { cx: 310, cz: 90, count: 20, radius: 35 },
      { cx: -290, cz: 210, count: 26, radius: 40 },
      { cx: -310, cz: 110, count: 22, radius: 36 },
      { cx: 0, cz: -245, count: 34, radius: 55 },
      { cx: -180, cz: -245, count: 26, radius: 45 },
      { cx: 160, cz: -245, count: 28, radius: 45 },
      { cx: -140, cz: 275, count: 20, radius: 30 },
      { cx: 160, cz: 275, count: 22, radius: 35 }
    ];

    perimeterGroves.forEach(grove => {
      for (let i = 0; i < grove.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * grove.radius;
        const gx = grove.cx + Math.cos(ang) * rad;
        const gz = grove.cz + Math.sin(ang) * rad;
        const sp = (i % 5 === 0) ? 4 : (i % 5 === 1) ? 2 : (i % 5 === 2) ? 1 : 3;
        addTree(gx, gz, sp, 0.95, 1.35);
      }
    });

    return trees;
  }

  // 7. Architectural Campus Entrance Portals
  buildCampusEntrances() {
    CAMPUS_ENTRANCES.forEach(ent => {
      const entGroup = new THREE.Group();
      entGroup.name = ent.id;
      entGroup.position.set(ent.center.x, 0, ent.center.z);

      if (ent.hasGateCanopy) {
        const canopyMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.35,
          metalness: 0.8
        });

        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.5,
          metalness: 0.6
        });

        const colL = new THREE.BoxGeometry(1.2, 7.5, 1.2);
        colL.translate(-ent.width * 0.5 - 1.0, 3.75, 0);
        const colMeshL = new THREE.Mesh(colL, pillarMat);
        colMeshL.castShadow = true;
        entGroup.add(colMeshL);

        const colR = new THREE.BoxGeometry(1.2, 7.5, 1.2);
        colR.translate(ent.width * 0.5 + 1.0, 3.75, 0);
        const colMeshR = new THREE.Mesh(colR, pillarMat);
        colMeshR.castShadow = true;
        entGroup.add(colMeshR);

        const roofBox = new THREE.BoxGeometry(ent.width + 6.0, 0.8, 8.0);
        roofBox.translate(0, 7.5, 0);
        const roofMesh = new THREE.Mesh(roofBox, canopyMat);
        roofMesh.castShadow = true;
        entGroup.add(roofMesh);

        const kioskBox = new THREE.BoxGeometry(4.5, 3.4, 5.0);
        kioskBox.translate(ent.width * 0.5 + 4.5, 1.7, 0);
        const kioskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
        const kioskMesh = new THREE.Mesh(kioskBox, kioskMat);
        kioskMesh.castShadow = true;
        entGroup.add(kioskMesh);

        if (ent.hasMedianIsland) {
          const medGeo = new THREE.BoxGeometry(2.4, 0.2, 16.0);
          medGeo.translate(0, 0.1, 0);
          const medMesh = new THREE.Mesh(medGeo, this.materials.curbMat);
          medMesh.castShadow = true;
          entGroup.add(medMesh);
        }

        const signBox = new THREE.BoxGeometry(8.5, 2.2, 0.8);
        signBox.translate(-ent.width * 0.5 - 6.5, 1.1, 4.0);
        const signMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
        const signMesh = new THREE.Mesh(signBox, signMat);
        signMesh.castShadow = true;
        entGroup.add(signMesh);

        const badgeGeo = new THREE.PlaneGeometry(7.5, 1.2);
        const badgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
        badgeMesh.position.set(-ent.width * 0.5 - 6.5, 1.1, 4.42);
        entGroup.add(badgeMesh);
      } else {
        const kioskBox = new THREE.BoxGeometry(3.8, 3.2, 4.0);
        kioskBox.translate(ent.width * 0.5 + 3.0, 1.6, 0);
        const kioskMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 });
        const kioskMesh = new THREE.Mesh(kioskBox, kioskMat);
        kioskMesh.castShadow = true;
        entGroup.add(kioskMesh);

        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, ent.width * 0.7, 8);
        armGeo.rotateZ(Math.PI / 2);
        armGeo.translate(0, 1.1, 0);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
        const armMesh = new THREE.Mesh(armGeo, armMat);
        entGroup.add(armMesh);
      }

      this.subgroups.entrances.add(entGroup);
    });
  }
}
