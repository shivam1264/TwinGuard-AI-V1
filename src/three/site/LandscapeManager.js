import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  CAMPUS_BOUNDS,
  CAMPUS_LAKE,
  SPORTS_COMPLEX,
  CAMPUS_ENTRANCES,
  CAMPUS_LAWNS,
  PRIMARY_CAMPUS_ROADS,
  SECONDARY_CAMPUS_ROADS,
  SERVICE_EMERGENCY_ROADS,
  CAMPUS_ROUNDABOUTS
} from './CampusLayout.js';

// ============================================================================
// CAMPUS LANDSCAPE, LAWNS, LAKE, SPORTS & ARBORICULTURE
// ============================================================================
// Professional institutional landscape integrated with the refined 3-class road network:
// - Generous tree setbacks from road carriageways (no trees inside roads)
// - The Great Lawn / Central Quad with directional mowing stripes
// - Hero Building architectural stone terrace, boxwood hedges & mulch beds
// - Eco-Lake with center island, shoreline path & flowering blossom trees
// - West Sports Complex: 400m tartan track + soccer pitch + hardcourts
// - Subtle neutral concrete curbs matching road edges

export class LandscapeManager {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'Landscape';
    this.group.userData = { id: 'LANDSCAPE-SYSTEM', type: 'LANDSCAPE_AND_TERRAIN' };

    this.subgroups = {
      ground: new THREE.Group(),
      lawns: new THREE.Group(),
      buildingTerraces: new THREE.Group(),
      lake: new THREE.Group(),
      sports: new THREE.Group(),
      boundary: new THREE.Group(),
      trees: new THREE.Group(),
      entrances: new THREE.Group()
    };

    this.group.add(this.subgroups.ground);
    this.group.add(this.subgroups.lawns);
    this.group.add(this.subgroups.buildingTerraces);
    this.group.add(this.subgroups.lake);
    this.group.add(this.subgroups.sports);
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

  createBorderCurb(w, d, thick = 0.35, height = 0.08) {
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

  // 1. Broad Master Campus Terrain Base (Vibrant Institutional Green)
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
    rimMesh.position.set(cx, 0.052, cz);
    rimMesh.receiveShadow = true;
    lakeGroup.add(rimMesh);

    // B. Serene Reflective Lake Water Surface
    const waterGeo = new THREE.CircleGeometry(w * 0.49, 64);
    waterGeo.scale(1.0, d / w, 1.0);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(cx, 0.042, cz);
    waterMesh.receiveShadow = true;
    lakeGroup.add(waterMesh);

    // C. Center Natural Island with Manicured Lawn
    const isR = lake.islandRadius;
    const islandGeo = new THREE.CircleGeometry(isR, 32);
    const islandMesh = new THREE.Mesh(islandGeo, this.materials.courtyardTurfMat);
    islandMesh.rotation.x = -Math.PI / 2;
    islandMesh.position.set(cx, 0.062, cz);
    islandMesh.receiveShadow = true;
    lakeGroup.add(islandMesh);

    const isCurbGeo = new THREE.RingGeometry(isR - 0.35, isR, 32);
    const isCurbMesh = new THREE.Mesh(isCurbGeo, this.materials.curbMat);
    isCurbMesh.rotation.x = -Math.PI / 2;
    isCurbMesh.position.set(cx, 0.072, cz);
    lakeGroup.add(isCurbMesh);

    // D. Outer Shoreline Walking Trail Ribbon
    const trailRingGeo = new THREE.RingGeometry(w * 0.52, w * 0.56, 64);
    trailRingGeo.scale(1.0, d / w, 1.0);
    const trailRing = new THREE.Mesh(trailRingGeo, this.materials.paverMat);
    trailRing.rotation.x = -Math.PI / 2;
    trailRing.position.set(cx, 0.038, cz);
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
    const trackBaseGeo = new THREE.BoxGeometry(tL, 0.06, tW);
    trackBaseGeo.translate(tcX, 0.03, tcZ);
    const trackMesh = new THREE.Mesh(trackBaseGeo, this.materials.tartanTrackMat);
    trackMesh.receiveShadow = true;
    sportsGroup.add(trackMesh);

    // Track Perimeter Border Curb
    const trackCurbGeo = this.createBorderCurb(tL, tW, 0.35, 0.08);
    trackCurbGeo.translate(tcX, 0.03, tcZ);
    const trackCurb = new THREE.Mesh(trackCurbGeo, this.materials.curbMat);
    trackCurb.castShadow = true;
    trackCurb.receiveShadow = true;
    sportsGroup.add(trackCurb);

    // Inner Green Athletic / Soccer Pitch
    const pL = sc.pitchSize.length;
    const pW = sc.pitchSize.width;
    const pitchGeo = new THREE.PlaneGeometry(pL, pW);
    pitchGeo.rotateX(-Math.PI / 2);
    pitchGeo.translate(tcX, 0.062, tcZ);
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
      g.translate(bl.x, 0.065, bl.z);
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
    courtBaseGeo.translate(ccX, 0.03, ccZ);
    const courtBase = new THREE.Mesh(courtBaseGeo, this.materials.courtGreenMat);
    courtBase.receiveShadow = true;
    sportsGroup.add(courtBase);

    const pad1Geo = new THREE.PlaneGeometry(cW * 0.44, cD * 0.8);
    pad1Geo.rotateX(-Math.PI / 2);
    pad1Geo.translate(ccX - cW * 0.24, 0.033, ccZ);
    const pad1 = new THREE.Mesh(pad1Geo, this.materials.courtBlueMat);
    pad1.receiveShadow = true;
    sportsGroup.add(pad1);

    const pad2Geo = new THREE.PlaneGeometry(cW * 0.44, cD * 0.8);
    pad2Geo.rotateX(-Math.PI / 2);
    pad2Geo.translate(ccX + cW * 0.24, 0.033, ccZ);
    const pad2 = new THREE.Mesh(pad2Geo, this.materials.courtBlueMat);
    pad2.receiveShadow = true;
    sportsGroup.add(pad2);

    const courtCurbGeo = this.createBorderCurb(cW, cD, 0.30, 0.08);
    courtCurbGeo.translate(ccX, 0.03, ccZ);
    const courtCurb = new THREE.Mesh(courtCurbGeo, this.materials.curbMat);
    courtCurb.castShadow = true;
    courtCurb.receiveShadow = true;
    sportsGroup.add(courtCurb);

    this.subgroups.sports.add(sportsGroup);
  }

  // 4. District Lawns, The Great Lawn & Hero Building Terrace
  buildDistrictGroundZones() {
    const zoneGeos = [];
    const curbGeos = [];

    // Defined Campus Lawns (from CAMPUS_LAWNS)
    CAMPUS_LAWNS.forEach(lawn => {
      const lawnGeo = new THREE.PlaneGeometry(lawn.width, lawn.depth);
      lawnGeo.rotateX(-Math.PI / 2);
      lawnGeo.translate(lawn.center.x, 0.016, lawn.center.z);
      zoneGeos.push(lawnGeo);

      const curbGeo = this.createBorderCurb(lawn.width, lawn.depth, lawn.curbWidth || 0.30, lawn.curbHeight || 0.08);
      curbGeo.translate(lawn.center.x, 0.016, lawn.center.z);
      curbGeos.push(curbGeo);
    });

    if (zoneGeos.length > 0) {
      const mergedLawn = BufferGeometryUtils.mergeGeometries(zoneGeos);
      const lawnMesh = new THREE.Mesh(mergedLawn, this.materials.courtyardTurfMat);
      lawnMesh.receiveShadow = true;
      lawnMesh.userData = { id: 'CAMPUS-MASTER-LAWNS', type: 'CAMPUS_LAWN_SYSTEM' };
      this.subgroups.lawns.add(lawnMesh);
    }

    if (curbGeos.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeos);
      const curbMesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      this.subgroups.lawns.add(curbMesh);
    }

    // Hero Building Architectural Foundation Terrace
    this.buildHeroBuildingTerrace();
  }

  buildHeroBuildingTerrace() {
    const terraceGroup = new THREE.Group();
    terraceGroup.name = 'HERO-BUILDING-TERRACE';

    // Broad Stone Paved Terrace Apron around Hero Building (62m x 50m)
    const terraceGeo = new THREE.PlaneGeometry(62.0, 50.0);
    terraceGeo.rotateX(-Math.PI / 2);
    terraceGeo.translate(0, 0.024, 0);
    const terraceMesh = new THREE.Mesh(terraceGeo, this.materials.plazaStoneMat);
    terraceMesh.receiveShadow = true;
    terraceGroup.add(terraceMesh);

    // Stone step curb around terrace perimeter
    const tCurbGeo = this.createBorderCurb(62.0, 50.0, 0.35, 0.06);
    tCurbGeo.translate(0, 0.024, 0);
    const tCurbMesh = new THREE.Mesh(tCurbGeo, this.materials.curbMat);
    tCurbMesh.receiveShadow = true;
    terraceGroup.add(tCurbMesh);

    // Foundation Boxwood Hedges
    const hedgeMat = this.materials.shrubMat;
    const hedges = [];

    const hN = new THREE.BoxGeometry(62.0, 0.65, 0.8);
    hN.translate(0, 0.325, -25.4);
    hedges.push(hN);

    const hSL = new THREE.BoxGeometry(22.0, 0.65, 0.8);
    hSL.translate(-18.0, 0.325, 25.4);
    const hSR = new THREE.BoxGeometry(22.0, 0.65, 0.8);
    hSR.translate(18.0, 0.325, 25.4);
    hedges.push(hSL, hSR);

    const hW = new THREE.BoxGeometry(0.8, 0.65, 50.0);
    hW.translate(-31.4, 0.325, 0);
    hedges.push(hW);

    const hE = new THREE.BoxGeometry(0.8, 0.65, 50.0);
    hE.translate(31.4, 0.325, 0);
    hedges.push(hE);

    const mergedHedges = BufferGeometryUtils.mergeGeometries(hedges);
    const hedgeMesh = new THREE.Mesh(mergedHedges, hedgeMat);
    hedgeMesh.castShadow = true;
    hedgeMesh.receiveShadow = true;
    terraceGroup.add(hedgeMesh);

    // Garden Mulch Planting Beds
    const mulchMat = this.materials.mulchMat;
    const mulchBeds = [];

    const mN = new THREE.PlaneGeometry(63.0, 1.4);
    mN.rotateX(-Math.PI / 2);
    mN.translate(0, 0.026, -26.3);
    mulchBeds.push(mN);

    const mSL = new THREE.PlaneGeometry(23.0, 1.4);
    mSL.rotateX(-Math.PI / 2);
    mSL.translate(-18.0, 0.026, 26.3);
    const mSR = new THREE.PlaneGeometry(23.0, 1.4);
    mSR.rotateX(-Math.PI / 2);
    mSR.translate(18.0, 0.026, 26.3);
    mulchBeds.push(mSL, mSR);

    const mW = new THREE.PlaneGeometry(1.4, 51.0);
    mW.rotateX(-Math.PI / 2);
    mW.translate(-32.3, 0.026, 0);
    mulchBeds.push(mW);

    const mE = new THREE.PlaneGeometry(1.4, 51.0);
    mE.rotateX(-Math.PI / 2);
    mE.translate(32.3, 0.026, 0);
    mulchBeds.push(mE);

    const mergedMulch = BufferGeometryUtils.mergeGeometries(mulchBeds);
    const mulchMesh = new THREE.Mesh(mergedMulch, mulchMat);
    mulchMesh.receiveShadow = true;
    terraceGroup.add(mulchMesh);

    this.subgroups.buildingTerraces.add(terraceGroup);
  }

  // 5. Realistic Campus Boundary & Southern Regional Highway
  buildCampusBoundary() {
    const b = CAMPUS_BOUNDS;
    // Campus Perimeter Landscape Green Belt & Boundary Posts
    // Eliminates hard enclosing prison walls so campus flows seamlessly into the regional terrain
    const pillarGeos = [];
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.6,
      metalness: 0.2
    });

    // Elegant architectural boundary demarcation pillars spaced every 60m along perimeter
    for (let x = b.minX; x <= b.maxX; x += 60) {
      if (Math.abs(x - (-10)) < 35) continue; // Leave entrance portal open
      // North & South perimeter pillars
      const pN = new THREE.BoxGeometry(0.8, 1.4, 0.8);
      pN.translate(x, 0.7, b.minZ);
      const pS = new THREE.BoxGeometry(0.8, 1.4, 0.8);
      pS.translate(x, 0.7, b.maxZ);
      pillarGeos.push(pN, pS);
    }

    for (let z = b.minZ; z <= b.maxZ; z += 60) {
      const pW = new THREE.BoxGeometry(0.8, 1.4, 0.8);
      pW.translate(b.minX, 0.7, z);
      const pE = new THREE.BoxGeometry(0.8, 1.4, 0.8);
      pE.translate(b.maxX, 0.7, z);
      pillarGeos.push(pW, pE);
    }

    if (pillarGeos.length > 0) {
      const mergedPillars = BufferGeometryUtils.mergeGeometries(pillarGeos);
      const pillarsMesh = new THREE.Mesh(mergedPillars, pillarMat);
      pillarsMesh.castShadow = true;
      pillarsMesh.receiveShadow = true;
      this.subgroups.boundary.add(pillarsMesh);
    }
  }

  // 6. Master Arboriculture System (With strict road carriageway clearances)
  buildInstancedForest() {
    const allTrees = this.generateTreeDistribution();

    const treesType1 = allTrees.filter(t => t.type === 1);
    const treesType2 = allTrees.filter(t => t.type === 2);
    const treesType3 = allTrees.filter(t => t.type === 3);
    const treesType4 = allTrees.filter(t => t.type === 4);

    this.createInstancedSpecies(
      treesType1,
      new THREE.CylinderGeometry(0.22, 0.35, 3.2, 8),
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

      dummy.position.set(t.x, 1.6 * scale, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, 3.6 * scale, t.z);
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

  // Master tree distribution with strict road carriageway setbacks
  generateTreeDistribution() {
    const trees = [];

    // Helper: distance from point (px, pz) to line segment (ax, az) - (bx, bz)
    const distToSegment = (px, pz, ax, az, bx, bz) => {
      const dx = bx - ax;
      const dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.hypot(px - ax, pz - az);
      let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
    };

    // Collect all road segments with their buffer clearance requirements
    const roadClearances = [];
    PRIMARY_CAMPUS_ROADS.forEach(r => {
      for (let i = 0; i < r.points.length - 1; i++) {
        roadClearances.push({
          a: r.points[i],
          b: r.points[i + 1],
          reqDist: (r.width * 0.5) + 3.0 // 4.25m + 3.0m = 7.25m clearance
        });
      }
    });
    SECONDARY_CAMPUS_ROADS.forEach(r => {
      for (let i = 0; i < r.points.length - 1; i++) {
        roadClearances.push({
          a: r.points[i],
          b: r.points[i + 1],
          reqDist: (r.width * 0.5) + 2.5 // 3.0m + 2.5m = 5.5m clearance
        });
      }
    });
    SERVICE_EMERGENCY_ROADS.forEach(r => {
      for (let i = 0; i < r.points.length - 1; i++) {
        roadClearances.push({
          a: r.points[i],
          b: r.points[i + 1],
          reqDist: (r.width * 0.5) + 2.0 // 2.5m + 2.0m = 4.5m clearance
        });
      }
    });

    const addTree = (x, z, type, scaleMin = 0.9, scaleMax = 1.3) => {
      // 1. Hero Building Footprint & Forecourt
      if (x > -32 && x < 32 && z > -26 && z < 26) return;
      if (x > -6 && x < 6 && z >= 26 && z <= 65) return;

      // 2. Roundabouts
      // Central Circus at (0, 85), outerRadius = 20m
      const dCent = Math.hypot(x - 0, z - 85);
      if (dCent < 22.5 && dCent > 2.0) return; // leave space for center island tree only

      // West Circus at (-150, 35), outerRadius = 14m
      const dWest = Math.hypot(x - (-150), z - 35);
      if (dWest < 16.5) return;

      // 3. Central Plaza at (-70, -10), radius = 32m
      const dPlaza = Math.hypot(x - (-70), z - (-10));
      if (dPlaza < 34.0) return;

      // 4. Eco-Lake water basin
      const dxL = (x - 125) / 44;
      const dzL = (z - 185) / 28;
      if (dxL * dxL + dzL * dzL < 0.82) return;

      // 5. Sports Track at (-235, 50)
      if (x > -285 && x < -185 && z > 20 && z < 80) return;

      // 6. Strict Road Carriageway Clearances
      for (const rc of roadClearances) {
        if (distToSegment(x, z, rc.a.x, rc.a.z, rc.b.x, rc.b.z) < rc.reqDist) {
          return; // Too close to road carriageway!
        }
      }

      const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
      const rotY = Math.random() * Math.PI * 2;
      trees.push({ x, z, type, scale, rotY });
    };

    // ------------------------------------------------------------------------
    // GROUP 1: SOUTHERN GATEWAY SPINE CANOPY TREES (Framing, 3m+ setback)
    // ------------------------------------------------------------------------
    for (let z = 135; z <= 280; z += 18) {
      addTree(-18, z, 1, 1.1, 1.35); // West flanking row
      addTree(12, z, 1, 1.1, 1.35);  // East flanking row
    }

    // ------------------------------------------------------------------------
    // GROUP 2: THE GREAT LAWN PERIMETER FRAMING GROVES (70% open lawn)
    // ------------------------------------------------------------------------
    for (let z = -55; z <= 40; z += 14) {
      addTree(-124 + (Math.random() - 0.5) * 6, z, (z % 28 === 0 ? 2 : 1), 1.05, 1.35);
      if (Math.random() > 0.45) {
        addTree(-114 + (Math.random() - 0.5) * 4, z + 6, 3, 0.9, 1.15);
      }
    }
    for (let x = -120; x <= -40; x += 16) {
      addTree(x, -58 + (Math.random() - 0.5) * 6, (x % 32 === 0 ? 2 : 1), 1.05, 1.35);
    }
    for (let x = -120; x <= -45; x += 16) {
      addTree(x, 46 + (Math.random() - 0.5) * 4, (x % 32 === 0 ? 4 : 1), 1.0, 1.3);
    }

    // ------------------------------------------------------------------------
    // GROUP 3: CENTRAL CIRCUS FEATURE & HERO BUILDING ACCENTS
    // ------------------------------------------------------------------------
    // Central Circus Island Centerpiece Specimen Tree
    trees.push({ x: 0, z: 85, type: 4, scale: 1.5, rotY: 0.8 });
    trees.push({ x: -3.5, z: 83.5, type: 3, scale: 1.1, rotY: 2.1 });
    trees.push({ x: 3.5, z: 86.5, type: 3, scale: 1.1, rotY: 1.4 });

    // Forecourt Promenade Flanking Trees
    for (let z = 55; z >= 34; z -= 14) {
      addTree(16, z, 3, 0.95, 1.15);
      addTree(-16, z, 3, 0.95, 1.15);
    }
    // Terrace Corner Symmetrical Accent Trees
    addTree(32, 28, 2, 1.15, 1.3);
    addTree(-32, 28, 2, 1.15, 1.3);
    addTree(32, -28, 2, 1.15, 1.3);
    addTree(-32, -28, 2, 1.15, 1.3);

    // ------------------------------------------------------------------------
    // GROUP 4: ECO-LAKE & CENTER ISLAND BLOSSOMS
    // ------------------------------------------------------------------------
    trees.push({ x: 125, z: 185, type: 4, scale: 1.45, rotY: 0.5 });
    trees.push({ x: 121, z: 187, type: 4, scale: 1.25, rotY: 1.2 });
    trees.push({ x: 129, z: 183, type: 1, scale: 1.25, rotY: 2.1 });

    for (let a = 0; a < Math.PI * 2; a += 0.32) {
      const rx = 125 + Math.cos(a) * 53;
      const rz = 185 + Math.sin(a) * 37;
      const sp = (Math.random() > 0.4) ? 4 : 1;
      addTree(rx, rz, sp, 0.95, 1.3);
    }

    // East Academic & Technology Quad Trees
    const eastTrees = [
      { x: 180, z: 25 }, { x: 215, z: 25 }, { x: 195, z: 50 },
      { x: 175, z: -10 }, { x: 215, z: -10 }, { x: 195, z: -35 },
      { x: 175, z: -60 }, { x: 205, z: -60 }, { x: 245, z: -35 },
      { x: 155, z: -90 }, { x: 190, z: -90 }, { x: 220, z: -90 }
    ];
    eastTrees.forEach(pt => addTree(pt.x, pt.z, (Math.random() > 0.5 ? 1 : 4), 0.95, 1.25));

    // North Research Zone Green Buffer
    for (let x = -110; x <= 80; x += 18) {
      addTree(x + (Math.random() - 0.5) * 6, -105 + (Math.random() - 0.5) * 8, 2, 0.95, 1.3);
      if (Math.random() > 0.45) {
        addTree(x + 10, -95 + (Math.random() - 0.5) * 6, 1, 0.9, 1.2);
      }
    }

    // West Sports Complex Perimeter Trees
    for (let z = -20; z <= 130; z += 18) {
      addTree(-195 + (Math.random() - 0.5) * 6, z, 1, 0.9, 1.25);
      addTree(-280 + (Math.random() - 0.5) * 8, z, 2, 0.95, 1.3);
    }

    // ------------------------------------------------------------------------
    // GROUP 5: CAMPUS PERIMETER WOODLAND BUFFER
    // ------------------------------------------------------------------------
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
