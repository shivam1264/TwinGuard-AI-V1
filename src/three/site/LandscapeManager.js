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
  CAMPUS_ROUNDABOUTS,
  FUTURE_BUILDING_PLOTS,
  PARKING_FACILITIES
} from './CampusLayout.js';

// ============================================================================
// CAMPUS LANDSCAPE, LAWNS, LAKE, SPORTS & ARBORICULTURE
// ============================================================================
// Built directly from the Master Plan Reference & Tree Species Catalog:
// 12 Realistic Tree Categories (Instanced Mesh for high performance):
// 1. Avenue Tree (Large, 8-12m) - Main roads, central axis, entrance
// 2. Flowering Tree (Pink, 6-12m) - Plazas, central park, lake area
// 3. Ornamental Tree (Yellow, 5-8m) - Lawns, pathways, courtyards
// 4. Shade Tree (Medium-Large, 10-15m) - Parking edges, walking paths
// 5. Palm Tree (6-10m) - Entrance gate, central circus, water body sides
// 6. Columnar Tree (8-12m) - Formal landscaping, building entrances/facades
// 7. Small Landscape Tree (4-6m) - Courtyards, near walkways, small spaces
// 8. Flowering Tree (Red/Orange, 5-9m) - Feature zones, gateways, intersections
// 9. Jacaranda-like Tree (Purple, 6-10m) - Academic zones, specialty avenues
// 10. Light Canopy Tree (5-8m) - Pedestrian paths, open lawns
// 11. Shrub Tree Multi-stem (2-4m) - Along paths, around buildings, beds
// 12. Conifer Tree Evergreen (8-14m) - Boundary landscape, service roads

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

  buildCampusLake() {
    const lake = CAMPUS_LAKE;
    const cx = lake.center.x;
    const cz = lake.center.z;
    const w = lake.size.width;
    const d = lake.size.depth;

    const lakeGroup = new THREE.Group();
    lakeGroup.name = 'CAMPUS-LAKE';

    // Excavated Lake Embankment Stone Curb
    const rimGeo = new THREE.RingGeometry(w * 0.48, w * 0.52, 64);
    rimGeo.scale(1.0, d / w, 1.0);
    const rimMesh = new THREE.Mesh(rimGeo, this.materials.curbMat);
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.set(cx, 0.052, cz);
    rimMesh.receiveShadow = true;
    lakeGroup.add(rimMesh);

    // Reflective Water Surface
    const waterGeo = new THREE.CircleGeometry(w * 0.49, 64);
    waterGeo.scale(1.0, d / w, 1.0);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(cx, 0.042, cz);
    waterMesh.receiveShadow = true;
    lakeGroup.add(waterMesh);

    // Center Island
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

    // Center Fountain Monument on Island
    const fountainSpire = new THREE.CylinderGeometry(0.5, 0.8, 3.5, 8);
    const fMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const fMesh = new THREE.Mesh(fountainSpire, fMat);
    fMesh.position.set(cx, 1.8, cz);
    fMesh.castShadow = true;
    lakeGroup.add(fMesh);

    // Shoreline Walking Trail
    const trailRingGeo = new THREE.RingGeometry(w * 0.52, w * 0.56, 64);
    trailRingGeo.scale(1.0, d / w, 1.0);
    const trailRing = new THREE.Mesh(trailRingGeo, this.materials.paverMat);
    trailRing.rotation.x = -Math.PI / 2;
    trailRing.position.set(cx, 0.045, cz);
    trailRing.receiveShadow = true;
    lakeGroup.add(trailRing);

    this.subgroups.lake.add(lakeGroup);
  }

  buildSportsComplex() {
    const sc = SPORTS_COMPLEX;
    const tcX = sc.center.x;
    const tcZ = sc.center.z;
    const tL = sc.trackSize.length;
    const tW = sc.trackSize.width;
    const pL = sc.pitchSize.length;
    const pW = sc.pitchSize.width;

    const sportsGroup = new THREE.Group();
    sportsGroup.name = 'SPORTS-COMPLEX';

    // 1. Tartan Running Track Bed (Red Clay composite)
    const trackBedGeo = new THREE.PlaneGeometry(tL, tW);
    trackBedGeo.rotateX(-Math.PI / 2);
    trackBedGeo.translate(tcX, 0.038, tcZ);
    const trackMesh = new THREE.Mesh(trackBedGeo, this.materials.tartanTrackMat);
    trackMesh.receiveShadow = true;
    sportsGroup.add(trackMesh);

    // Inner Green Pitch / Football Field
    const pitchGeo = new THREE.PlaneGeometry(pL, pW);
    pitchGeo.rotateX(-Math.PI / 2);
    pitchGeo.translate(tcX, 0.042, tcZ);
    const pitchMesh = new THREE.Mesh(pitchGeo, this.materials.courtyardTurfMat);
    pitchMesh.receiveShadow = true;
    sportsGroup.add(pitchMesh);

    // Field White Boundary Markings
    const pitchLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineThickness = 0.22;
    const lines = [];

    const lN = new THREE.PlaneGeometry(pL, lineThickness);
    lN.rotateX(-Math.PI / 2);
    lN.translate(tcX, 0.044, tcZ - pW * 0.5);
    lines.push(lN);

    const lS = new THREE.PlaneGeometry(pL, lineThickness);
    lS.rotateX(-Math.PI / 2);
    lS.translate(tcX, 0.044, tcZ + pW * 0.5);
    lines.push(lS);

    const lW = new THREE.PlaneGeometry(lineThickness, pW);
    lW.rotateX(-Math.PI / 2);
    lW.translate(tcX - pL * 0.5, 0.044, tcZ);
    lines.push(lW);

    const lE = new THREE.PlaneGeometry(lineThickness, pW);
    lE.rotateX(-Math.PI / 2);
    lE.translate(tcX + pL * 0.5, 0.044, tcZ);
    lines.push(lE);

    const lMid = new THREE.PlaneGeometry(lineThickness, pW);
    lMid.rotateX(-Math.PI / 2);
    lMid.translate(tcX, 0.044, tcZ);
    lines.push(lMid);

    const mergedPitchLines = BufferGeometryUtils.mergeGeometries(lines);
    const linesMesh = new THREE.Mesh(mergedPitchLines, pitchLineMat);
    sportsGroup.add(linesMesh);

    // Track Curb Border
    const tCurb = this.createBorderCurb(tL, tW, 0.35, 0.06);
    tCurb.translate(tcX, 0.038, tcZ);
    const tCurbMesh = new THREE.Mesh(tCurb, this.materials.curbMat);
    tCurbMesh.receiveShadow = true;
    sportsGroup.add(tCurbMesh);

    // 2. Multi-Sport Hardcourts (Blue/Green acrylic courts south of track)
    const ccX = sc.courtsCenter.x;
    const ccZ = sc.courtsCenter.z;
    const cW = sc.courtsSize.width;
    const cD = sc.courtsSize.depth;

    // Basketball / Tennis Surface Base
    const courtBaseGeo = new THREE.PlaneGeometry(cW, cD);
    courtBaseGeo.rotateX(-Math.PI / 2);
    courtBaseGeo.translate(ccX, 0.038, ccZ);
    const courtBase = new THREE.Mesh(courtBaseGeo, this.materials.courtBlueMat);
    courtBase.receiveShadow = true;
    sportsGroup.add(courtBase);

    // Dual inner court playing surfaces
    const c1Geo = new THREE.PlaneGeometry(cW * 0.44, cD * 0.82);
    c1Geo.rotateX(-Math.PI / 2);
    c1Geo.translate(ccX - cW * 0.24, 0.042, ccZ);
    const c1Mesh = new THREE.Mesh(c1Geo, this.materials.courtGreenMat);
    sportsGroup.add(c1Mesh);

    const c2Geo = new THREE.PlaneGeometry(cW * 0.44, cD * 0.82);
    c2Geo.rotateX(-Math.PI / 2);
    c2Geo.translate(ccX + cW * 0.24, 0.042, ccZ);
    const c2Mesh = new THREE.Mesh(c2Geo, this.materials.courtGreenMat);
    sportsGroup.add(c2Mesh);

    const cCurb = this.createBorderCurb(cW, cD, 0.3, 0.06);
    cCurb.translate(ccX, 0.038, ccZ);
    const cCurbMesh = new THREE.Mesh(cCurb, this.materials.curbMat);
    sportsGroup.add(cCurbMesh);

    this.subgroups.sports.add(sportsGroup);
  }

  buildDistrictGroundZones() {
    const zoneGeos = [];
    const curbGeos = [];

    CAMPUS_LAWNS.forEach(lawn => {
      const g = new THREE.PlaneGeometry(lawn.width, lawn.depth);
      g.rotateX(-Math.PI / 2);
      g.translate(lawn.center.x, 0.022, lawn.center.z);
      zoneGeos.push(g);

      const curb = this.createBorderCurb(lawn.width, lawn.depth, 0.28, 0.05);
      curb.translate(lawn.center.x, 0.022, lawn.center.z);
      curbGeos.push(curb);
    });

    if (zoneGeos.length > 0) {
      const mergedLawn = BufferGeometryUtils.mergeGeometries(zoneGeos);
      const lawnMesh = new THREE.Mesh(mergedLawn, this.materials.courtyardTurfMat);
      lawnMesh.receiveShadow = true;
      this.subgroups.lawns.add(lawnMesh);
    }

    if (curbGeos.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeos);
      const curbMesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      this.subgroups.lawns.add(curbMesh);
    }

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

    this.subgroups.buildingTerraces.add(terraceGroup);
  }

  buildCampusBoundary() {
    const b = CAMPUS_BOUNDS;
    const pillarGeos = [];
    const pillarMat = this.materials.curbMat;

    const addPillar = (x, z) => {
      const p = new THREE.BoxGeometry(0.9, 1.6, 0.9);
      p.translate(x, 0.8, z);
      pillarGeos.push(p);
    };

    for (let x = b.minX; x <= b.maxX; x += 60) {
      addPillar(x, b.minZ);
      if (Math.abs(x) > 30) addPillar(x, b.maxZ);
    }
    for (let z = b.minZ; z <= b.maxZ; z += 60) {
      addPillar(b.minX, z);
      addPillar(b.maxX, z);
    }

    if (pillarGeos.length > 0) {
      const mergedPillars = BufferGeometryUtils.mergeGeometries(pillarGeos);
      const pillarsMesh = new THREE.Mesh(mergedPillars, pillarMat);
      pillarsMesh.castShadow = true;
      pillarsMesh.receiveShadow = true;
      this.subgroups.boundary.add(pillarsMesh);
    }
  }

  // ============================================================================
  // INSTANCED 12-SPECIES ARBORICULTURE LIBRARY
  // ============================================================================
  buildInstancedForest() {
    const allTrees = this.generateTreeDistribution();

    // 12 Distinct Botanical Species matching user reference:
    const speciesConfig = [
      // 1. Avenue Tree (Large, 8-12m)
      {
        id: 1,
        trunkGeo: new THREE.CylinderGeometry(0.24, 0.38, 3.4, 8),
        crownGeo: this.createAvenueCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.deciduousCrownMat,
        trunkY: 1.7, crownY: 4.6
      },
      // 2. Flowering Tree Pink (Cherry / Rosea, 6-12m)
      {
        id: 2,
        trunkGeo: new THREE.CylinderGeometry(0.18, 0.28, 2.8, 8),
        crownGeo: this.createPinkFloweringCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.blossomCrownMat,
        trunkY: 1.4, crownY: 3.8
      },
      // 3. Ornamental Tree Yellow (Amaltas / Golden Trumpet, 5-8m)
      {
        id: 3,
        trunkGeo: new THREE.CylinderGeometry(0.16, 0.25, 2.4, 8),
        crownGeo: this.createOrnamentalYellowCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.yellowCrownMat,
        trunkY: 1.2, crownY: 3.2
      },
      // 4. Shade Tree (Medium-Large, 10-15m)
      {
        id: 4,
        trunkGeo: new THREE.CylinderGeometry(0.28, 0.44, 3.8, 8),
        crownGeo: this.createShadeCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.shadeCrownMat,
        trunkY: 1.9, crownY: 5.2
      },
      // 5. Palm Tree (Tropical Royal Palm, 6-10m)
      {
        id: 5,
        trunkGeo: new THREE.CylinderGeometry(0.16, 0.24, 4.8, 8),
        crownGeo: this.createPalmCrownGeometry(),
        trunkMat: this.materials.palmTrunkMat,
        crownMat: this.materials.palmFrondMat,
        trunkY: 2.4, crownY: 4.9
      },
      // 6. Columnar Tree (Italian Cypress / Columnar Poplar, 8-12m)
      {
        id: 6,
        trunkGeo: new THREE.CylinderGeometry(0.14, 0.22, 1.8, 8),
        crownGeo: this.createColumnarCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.columnarCrownMat,
        trunkY: 0.9, crownY: 4.8
      },
      // 7. Small Landscape Tree (Courtyard olive/deciduous, 4-6m)
      {
        id: 7,
        trunkGeo: new THREE.CylinderGeometry(0.14, 0.22, 2.0, 7),
        crownGeo: this.createSmallTreeCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.ornamentalCrownMat,
        trunkY: 1.0, crownY: 2.7
      },
      // 8. Flowering Tree Red/Orange (Gulmohar / Flamboyant, 5-9m)
      {
        id: 8,
        trunkGeo: new THREE.CylinderGeometry(0.18, 0.28, 2.6, 8),
        crownGeo: this.createRedFloweringCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.redCrownMat,
        trunkY: 1.3, crownY: 3.6
      },
      // 9. Jacaranda-like Tree Purple (Lavender purple, 6-10m)
      {
        id: 9,
        trunkGeo: new THREE.CylinderGeometry(0.18, 0.26, 2.8, 8),
        crownGeo: this.createJacarandaCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.jacarandaCrownMat,
        trunkY: 1.4, crownY: 3.8
      },
      // 10. Light Canopy Tree (Birch / Acacia airy, 5-8m)
      {
        id: 10,
        trunkGeo: new THREE.CylinderGeometry(0.14, 0.22, 2.5, 7),
        crownGeo: this.createLightCanopyCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.lightCanopyMat,
        trunkY: 1.25, crownY: 3.4
      },
      // 11. Shrub Tree Multi-stem (Flowering hedge bush, 2-4m)
      {
        id: 11,
        trunkGeo: new THREE.CylinderGeometry(0.10, 0.16, 0.8, 6),
        crownGeo: this.createShrubBushCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.shrubBushMat,
        trunkY: 0.4, crownY: 1.4
      },
      // 12. Conifer Tree Evergreen (Pine / Spruce, 8-14m)
      {
        id: 12,
        trunkGeo: new THREE.CylinderGeometry(0.20, 0.32, 2.8, 8),
        crownGeo: this.createConiferCrownGeometry(),
        trunkMat: this.materials.trunkMat,
        crownMat: this.materials.coniferCrownMat,
        trunkY: 1.4, crownY: 5.0
      }
    ];

    speciesConfig.forEach(sp => {
      const list = allTrees.filter(t => t.type === sp.id);
      this.createInstancedSpecies(
        list,
        sp.trunkGeo,
        sp.crownGeo,
        sp.trunkMat,
        sp.crownMat,
        sp.trunkY,
        sp.crownY
      );
    });
  }

  createInstancedSpecies(treeList, trunkBaseGeo, crownBaseGeo, trunkMat, crownMat, trunkY = 1.6, crownY = 3.6) {
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

      dummy.position.set(t.x, trunkY * scale, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, crownY * scale, t.z);
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

  // --------------------------------------------------------------------------
  // PROCEDURAL CROWN GEOMETRIES FOR 12 SPECIES
  // --------------------------------------------------------------------------
  // 1. Avenue Tree: Broad organic multi-canopy
  createAvenueCrownGeometry() {
    const s1 = new THREE.SphereGeometry(2.6, 9, 8);
    s1.scale(1.25, 0.82, 1.25);
    const s2 = new THREE.SphereGeometry(1.9, 8, 7);
    s2.scale(1.1, 0.85, 1.1);
    s2.translate(0.9, 1.2, -0.6);
    const s3 = new THREE.SphereGeometry(1.7, 8, 7);
    s3.scale(1.0, 0.8, 1.0);
    s3.translate(-0.8, 1.0, 0.7);
    return BufferGeometryUtils.mergeGeometries([s1, s2, s3]);
  }

  // 2. Flowering Pink: Spreading umbrella canopy
  createPinkFloweringCrownGeometry() {
    const s1 = new THREE.SphereGeometry(2.3, 9, 8);
    s1.scale(1.35, 0.75, 1.35);
    const s2 = new THREE.SphereGeometry(1.6, 8, 7);
    s2.translate(0.6, 0.8, -0.5);
    const s3 = new THREE.SphereGeometry(1.5, 8, 7);
    s3.translate(-0.7, 0.7, 0.6);
    return BufferGeometryUtils.mergeGeometries([s1, s2, s3]);
  }

  // 3. Ornamental Yellow: Symmetrical rounded dome
  createOrnamentalYellowCrownGeometry() {
    const s1 = new THREE.SphereGeometry(1.9, 8, 8);
    s1.scale(1.2, 0.95, 1.2);
    const s2 = new THREE.SphereGeometry(1.3, 7, 7);
    s2.translate(0.3, 0.9, 0.2);
    return BufferGeometryUtils.mergeGeometries([s1, s2]);
  }

  // 4. Large Shade Tree: Expansive tall dense crown
  createShadeCrownGeometry() {
    const s1 = new THREE.SphereGeometry(3.0, 10, 8);
    s1.scale(1.3, 0.95, 1.3);
    const s2 = new THREE.SphereGeometry(2.2, 8, 7);
    s2.translate(0, 1.5, 0);
    const s3 = new THREE.SphereGeometry(1.8, 8, 7);
    s3.translate(1.2, 0.5, 0.8);
    return BufferGeometryUtils.mergeGeometries([s1, s2, s3]);
  }

  // 5. Palm Tree: Radial outward-arching fan fronds
  createPalmCrownGeometry() {
    const fronds = [];
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2;
      const f = new THREE.ConeGeometry(0.55, 3.2, 5);
      f.rotateX(Math.PI / 2.7);
      f.rotateY(ang);
      f.translate(Math.sin(ang) * 1.3, 0.2, Math.cos(ang) * 1.3);
      fronds.push(f);
    }
    const centerNut = new THREE.SphereGeometry(0.65, 6, 6);
    centerNut.translate(0, 0.3, 0);
    fronds.push(centerNut);
    return BufferGeometryUtils.mergeGeometries(fronds);
  }

  // 6. Columnar Tree: Tall slender vertical oval
  createColumnarCrownGeometry() {
    const colGeo = new THREE.ConeGeometry(1.2, 7.5, 8);
    colGeo.scale(1.0, 1.0, 0.85);
    const baseSphere = new THREE.SphereGeometry(1.2, 8, 8);
    baseSphere.scale(1.0, 1.8, 0.85);
    baseSphere.translate(0, 2.0, 0);
    return BufferGeometryUtils.mergeGeometries([colGeo, baseSphere]);
  }

  // 7. Small Landscape Tree: Compact rounded canopy
  createSmallTreeCrownGeometry() {
    const s = new THREE.SphereGeometry(1.5, 8, 7);
    s.scale(1.2, 0.9, 1.2);
    return s;
  }

  // 8. Flowering Red/Orange: Broad horizontal spreading crown
  createRedFloweringCrownGeometry() {
    const s1 = new THREE.SphereGeometry(2.2, 9, 8);
    s1.scale(1.4, 0.72, 1.4);
    const s2 = new THREE.SphereGeometry(1.5, 8, 7);
    s2.translate(0.7, 0.7, 0.5);
    return BufferGeometryUtils.mergeGeometries([s1, s2]);
  }

  // 9. Jacaranda-like Tree: Tiered rounded purple puffs
  createJacarandaCrownGeometry() {
    const s1 = new THREE.SphereGeometry(2.2, 9, 8);
    s1.scale(1.3, 0.8, 1.3);
    const s2 = new THREE.SphereGeometry(1.6, 8, 7);
    s2.translate(-0.6, 0.9, -0.4);
    const s3 = new THREE.SphereGeometry(1.4, 8, 7);
    s3.translate(0.7, 0.8, 0.6);
    return BufferGeometryUtils.mergeGeometries([s1, s2, s3]);
  }

  // 10. Light Canopy Tree: Airy flattened layered foliage
  createLightCanopyCrownGeometry() {
    const l1 = new THREE.SphereGeometry(2.0, 7, 6);
    l1.scale(1.4, 0.6, 1.4);
    const l2 = new THREE.SphereGeometry(1.6, 7, 6);
    l2.scale(1.2, 0.55, 1.2);
    l2.translate(0.5, 0.9, 0.4);
    return BufferGeometryUtils.mergeGeometries([l1, l2]);
  }

  // 11. Shrub Tree Multi-stem: Low ground cluster
  createShrubBushCrownGeometry() {
    const b1 = new THREE.SphereGeometry(1.1, 7, 6);
    b1.scale(1.3, 0.9, 1.3);
    const b2 = new THREE.SphereGeometry(0.9, 6, 5);
    b2.translate(0.6, -0.1, 0.4);
    const b3 = new THREE.SphereGeometry(0.85, 6, 5);
    b3.translate(-0.5, -0.1, -0.4);
    return BufferGeometryUtils.mergeGeometries([b1, b2, b3]);
  }

  // 12. Conifer Tree Evergreen: 3-Tiered tapered cones
  createConiferCrownGeometry() {
    const c1 = new THREE.ConeGeometry(2.0, 4.5, 8);
    c1.translate(0, 0.8, 0);
    const c2 = new THREE.ConeGeometry(1.6, 3.8, 8);
    c2.translate(0, 2.5, 0);
    const c3 = new THREE.ConeGeometry(1.1, 2.8, 8);
    c3.translate(0, 4.2, 0);
    return BufferGeometryUtils.mergeGeometries([c1, c2, c3]);
  }

  // ============================================================================
  // PROGRAMMATIC LANDSCAPE DISTRIBUTION (NON-RANDOM CAMPUS ARCHITECTURE)
  // ============================================================================
  generateTreeDistribution() {
    const trees = [];

    // Road distance helper
    const distToSegment = (px, pz, ax, az, bx, bz) => {
      const dx = bx - ax;
      const dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.hypot(px - ax, pz - az);
      let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
    };

    const roadClearances = [];
    PRIMARY_CAMPUS_ROADS.forEach(r => {
      for (let i = 0; i < r.points.length - 1; i++) {
        roadClearances.push({
          a: r.points[i],
          b: r.points[i + 1],
          reqDist: (r.width * 0.5) + 2.2
        });
      }
    });
    SECONDARY_CAMPUS_ROADS.forEach(r => {
      for (let i = 0; i < r.points.length - 1; i++) {
        roadClearances.push({
          a: r.points[i],
          b: r.points[i + 1],
          reqDist: (r.width * 0.5) + 1.8
        });
      }
    });
    SERVICE_EMERGENCY_ROADS.forEach(r => {
      for (let i = 0; i < r.points.length - 1; i++) {
        roadClearances.push({
          a: r.points[i],
          b: r.points[i + 1],
          reqDist: (r.width * 0.5) + 1.6
        });
      }
    });

    const addTree = (x, z, type, scaleMin = 0.85, scaleMax = 1.25) => {
      // 1. Hero Building & Forecourt open visual corridor
      if (x > -34 && x < 34 && z > -26 && z < 26) return;
      if (x > -7 && x < 7 && z >= 26 && z <= 52) return;

      // 2. Supporting Building Footprint Clearances
      for (const plot of FUTURE_BUILDING_PLOTS) {
        const halfW = (plot.size.width * 0.5) + 4.5;
        const halfD = (plot.size.depth * 0.5) + 4.5;
        if (x >= plot.center.x - halfW && x <= plot.center.x + halfW &&
            z >= plot.center.z - halfD && z <= plot.center.z + halfD) {
          return;
        }
      }

      // 3. Roundabout Carriageway Clearances
      for (const rb of CAMPUS_ROUNDABOUTS) {
        const dRb = Math.hypot(x - rb.center.x, z - rb.center.z);
        if (dRb < rb.outerRadius + 2.0 && dRb > 2.2) return;
      }

      // 4. Lake Water Basin Clearance (95, 145)
      const dxL = (x - 95) / 47;
      const dzL = (z - 145) / 33;
      if (dxL * dxL + dzL * dzL < 0.88) return;

      // 5. Sports Complex Running Track & Courts (-225, -15)
      if (x > -278 && x < -172 && z > -48 && z < 62) return;

      // 6. Road Carriageway Clearances
      for (const rc of roadClearances) {
        if (distToSegment(x, z, rc.a.x, rc.a.z, rc.b.x, rc.b.z) < rc.reqDist) {
          return;
        }
      }

      const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
      const rotY = Math.random() * Math.PI * 2;
      trees.push({ x, z, type, scale, rotY });
    };

    // ------------------------------------------------------------------------
    // ZONE A: CEREMONIAL ENTRANCE AVENUE & AXIS (South Gate to Circus)
    // ------------------------------------------------------------------------
    // Formal rhythmic pairs of Type 1 (Large Avenue Trees) along 12m boulevard
    for (let z = 110; z <= 230; z += 15) {
      addTree(-16, z, 1, 1.05, 1.25);
      addTree(16, z, 1, 1.05, 1.25);
      // Secondary understory flowering bushes
      if (z % 30 === 0) {
        addTree(-19, z + 6, 11, 0.9, 1.1);
        addTree(19, z + 6, 11, 0.9, 1.1);
      }
    }

    // Gate Monument Entry Palm Grouping (Type 5) & Red Flowering Accents (Type 8)
    addTree(-24, 252, 5, 1.1, 1.25);
    addTree(-18, 254, 5, 1.0, 1.15);
    addTree(18, 254, 5, 1.0, 1.15);
    addTree(24, 252, 5, 1.1, 1.25);
    addTree(-28, 250, 8, 1.0, 1.2);
    addTree(28, 250, 8, 1.0, 1.2);

    // Central Circus Island at (0, 86): Specimen Tree + Floral Beds
    trees.push({ x: 0, z: 86, type: 8, scale: 1.35, rotY: 0.6 }); // Red Flamboyant Specimen
    trees.push({ x: -2.8, z: 85, type: 5, scale: 1.1, rotY: 1.2 }); // Palm
    trees.push({ x: 2.8, z: 87, type: 5, scale: 1.1, rotY: 2.8 });  // Palm
    trees.push({ x: 0, z: 89, type: 11, scale: 0.9, rotY: 0 });     // Shrub
    trees.push({ x: 0, z: 83, type: 11, scale: 0.9, rotY: 1.5 });   // Shrub

    // ------------------------------------------------------------------------
    // ZONE B: HERO BUILDING FORECOURT & CIVIC CORE (0, 0)
    // ------------------------------------------------------------------------
    // Symmetrical Columnar framing (Type 6) along arrival promenade
    for (let z = 54; z >= 32; z -= 11) {
      addTree(-18, z, 6, 1.0, 1.2);
      addTree(18, z, 6, 1.0, 1.2);
      addTree(-21, z, 11, 0.8, 1.0); // Hedge shrub
      addTree(21, z, 11, 0.8, 1.0);
    }
    // Corner accent pines/columnars at terrace perimeter
    addTree(-36, 28, 6, 1.1, 1.25);
    addTree(36, 28, 6, 1.1, 1.25);
    addTree(-36, -28, 6, 1.1, 1.25);
    addTree(36, -28, 6, 1.1, 1.25);

    // Central Core Circular Ring Road Lawn (Radius ~45m around Hero Building)
    for (let ang = 0; ang < Math.PI * 2; ang += 0.32) {
      const rx = Math.cos(ang) * 44;
      const rz = Math.sin(ang) * 44;
      // Skip southern entrance axis corridor
      if (rz > 15 && Math.abs(rx) < 22) continue;
      const sp = (Math.random() > 0.5) ? 7 : (Math.random() > 0.5 ? 3 : 10);
      addTree(rx, rz, sp, 0.9, 1.15);
    }

    // ------------------------------------------------------------------------
    // ZONE C: CENTRAL LAKE & ISLAND WATERFRONT (Zone 12 at 95, 145)
    // ------------------------------------------------------------------------
    // Center Island Grouping: Pink Flowering Specimen (Type 2) + Palms (Type 5)
    trees.push({ x: 95, z: 145, type: 2, scale: 1.4, rotY: 0.4 });
    trees.push({ x: 92, z: 147, type: 5, scale: 1.2, rotY: 1.1 });
    trees.push({ x: 98, z: 143, type: 5, scale: 1.15, rotY: 2.3 });
    trees.push({ x: 95, z: 148, type: 11, scale: 0.9, rotY: 0.8 });

    // Shoreline Lakeside Promenade: Pink Flowering (Type 2), Palms (Type 5), Shade (Type 4)
    for (let a = 0; a < Math.PI * 2; a += 0.28) {
      const lx = 95 + Math.cos(a) * 53;
      const lz = 145 + Math.sin(a) * 37;
      let sp = 2; // Pink Flowering dominant
      const rnd = Math.random();
      if (rnd < 0.45) sp = 2;
      else if (rnd < 0.70) sp = 5; // Palm
      else if (rnd < 0.85) sp = 4; // Shade
      else sp = 11; // Shrub
      addTree(lx, lz, sp, 0.9, 1.25);
    }

    // ------------------------------------------------------------------------
    // ZONE D: ACADEMIC & RESEARCH DISTRICT (North Quad - Buildings 2, 3, 4)
    // ------------------------------------------------------------------------
    // Academic Green Quad Courtyard: Jacaranda Purple (Type 9) + Yellow (Type 3)
    for (let x = -85; x <= 85; x += 16) {
      for (let z = -98; z >= -120; z -= 14) {
        const sp = (Math.random() > 0.55) ? 9 : 3;
        addTree(x + (Math.random() - 0.5) * 5, z + (Math.random() - 0.5) * 5, sp, 0.95, 1.25);
      }
    }
    // Behind Academic Blocks buffer: Light canopy (Type 10) + Conifer (Type 12)
    for (let x = -130; x <= 130; x += 22) {
      addTree(x, -172 + (Math.random() - 0.5) * 8, 10, 0.9, 1.2);
      addTree(x + 10, -186 + (Math.random() - 0.5) * 8, 12, 1.0, 1.35);
    }

    // ------------------------------------------------------------------------
    // ZONE E: TECHNOLOGY & ADMINISTRATIVE DISTRICT (East Quad - Buildings 5, 6, 7)
    // ------------------------------------------------------------------------
    // Courtyard trees between Tech buildings: Yellow Ornamental (Type 3) & Shade (Type 4)
    const techSpots = [
      { x: 195, z: 25, sp: 3 }, { x: 220, z: 25, sp: 4 }, { x: 205, z: 50, sp: 7 },
      { x: 195, z: -15, sp: 3 }, { x: 220, z: -15, sp: 4 }, { x: 205, z: -35, sp: 9 },
      { x: 195, z: -70, sp: 8 }, { x: 220, z: -70, sp: 3 }, { x: 245, z: -40, sp: 10 },
      { x: 280, z: -110, sp: 12 }, { x: 280, z: -30, sp: 12 }, { x: 280, z: 50, sp: 12 }
    ];
    techSpots.forEach(pt => addTree(pt.x, pt.z, pt.sp, 0.95, 1.25));

    // ------------------------------------------------------------------------
    // ZONE F: CIVIC AUDITORIUM & SPORTS COMPLEX BUFFER (West Quad)
    // ------------------------------------------------------------------------
    // Western green lawn between Hero and Auditorium (-90 to -115)
    for (let z = -50; z <= 50; z += 18) {
      addTree(-85 + (Math.random() - 0.5) * 6, z, 7, 0.9, 1.15);
      addTree(-102 + (Math.random() - 0.5) * 6, z, 3, 0.95, 1.2);
    }
    // Sports buffer green corridor: Large Shade (Type 4) & Evergreen Conifer (Type 12)
    for (let z = -45; z <= 65; z += 16) {
      addTree(-182 + (Math.random() - 0.5) * 6, z, 4, 1.0, 1.3);
      addTree(-270 + (Math.random() - 0.5) * 6, z, 12, 1.05, 1.35);
      addTree(-285 + (Math.random() - 0.5) * 6, z, 12, 1.1, 1.4);
    }

    // ------------------------------------------------------------------------
    // ZONE G: RESIDENTIAL & HOSTEL COMMONS (Zone 11)
    // ------------------------------------------------------------------------
    for (let x = -105; x <= -30; x += 18) {
      addTree(x, 90 + (Math.random() - 0.5) * 6, 2, 0.95, 1.2); // Pink blossom
      addTree(x, 168 + (Math.random() - 0.5) * 6, 10, 0.9, 1.15); // Light canopy
    }

    // ------------------------------------------------------------------------
    // ZONE H: SURFACE PARKING LOT GREEN ISLANDS (Zones 10 & 13)
    // ------------------------------------------------------------------------
    // West Parking Lot 10: Medians and Perimeter (-230, 155)
    for (let px = -270; px <= -190; px += 26) {
      addTree(px, 100, 4, 1.0, 1.2);
      addTree(px, 155, 4, 1.0, 1.2);
      addTree(px, 210, 4, 1.0, 1.2);
      addTree(px, 128, 11, 0.85, 1.0);
      addTree(px, 182, 11, 0.85, 1.0);
    }
    // East Parking Lot 13: Medians and Perimeter (230, 155)
    for (let px = 190; px <= 270; px += 26) {
      addTree(px, 100, 4, 1.0, 1.2);
      addTree(px, 155, 4, 1.0, 1.2);
      addTree(px, 210, 4, 1.0, 1.2);
      addTree(px, 128, 11, 0.85, 1.0);
      addTree(px, 182, 11, 0.85, 1.0);
    }

    // ------------------------------------------------------------------------
    // ZONE I: PRIMARY CIRCULATION RING ROAD AVENUE TREES (Radius ~150m)
    // ------------------------------------------------------------------------
    // Lining outer side of primary ring road
    for (let ang = 0; ang < Math.PI * 2; ang += 0.10) {
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const rx = cosA * 156;
      const rz = sinA * 120;
      if (rz > 85 && Math.abs(rx) < 45) continue;
      const sp = (Math.random() > 0.45) ? 1 : 4;
      addTree(rx, rz, sp, 1.0, 1.3);
    }
    // Lining inner side of primary ring road
    for (let ang = 0; ang < Math.PI * 2; ang += 0.14) {
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const rx = cosA * 138;
      const rz = sinA * 106;
      if (rz > 75 && Math.abs(rx) < 45) continue;
      const sp = (Math.random() > 0.5) ? 3 : 10;
      addTree(rx, rz, sp, 0.9, 1.15);
    }

    // ------------------------------------------------------------------------
    // ZONE I-2: CENTRAL CAMPUS LAWN CLUSTERS (Breaking the open green expanses)
    // ------------------------------------------------------------------------
    // East Grand Central Lawn (between Hero and Tech District: x: 55 to 115, z: -55 to 55)
    const eastLawnClusters = [
      { x: 72, z: 25, sp: 3 }, { x: 88, z: 32, sp: 10 }, { x: 105, z: 22, sp: 2 },
      { x: 78, z: -25, sp: 3 }, { x: 95, z: -30, sp: 10 }, { x: 110, z: -18, sp: 2 },
      { x: 68, z: 48, sp: 7 }, { x: 84, z: 54, sp: 11 }, { x: 70, z: -48, sp: 7 }, { x: 86, z: -54, sp: 11 }
    ];
    eastLawnClusters.forEach(pt => addTree(pt.x, pt.z, pt.sp, 0.95, 1.25));

    // West Grand Central Lawn (between Hero and Auditorium/Sports: x: -55 to -115, z: -55 to 55)
    const westLawnClusters = [
      { x: -72, z: 25, sp: 3 }, { x: -88, z: 32, sp: 10 }, { x: -105, z: 22, sp: 2 },
      { x: -78, z: -25, sp: 3 }, { x: -95, z: -30, sp: 10 }, { x: -108, z: -18, sp: 2 },
      { x: -68, z: 48, sp: 7 }, { x: -84, z: 54, sp: 11 }, { x: -70, z: -48, sp: 7 }, { x: -86, z: -54, sp: 11 }
    ];
    westLawnClusters.forEach(pt => addTree(pt.x, pt.z, pt.sp, 0.95, 1.25));

    // North Academic Meadow Lawns (between Central Ring and Academic Blocks: x: -90 to 90, z: -60 to -85)
    for (let x = -80; x <= 80; x += 20) {
      if (Math.abs(x) < 14) continue; // Keep north axial view open
      const sp = (Math.random() > 0.5) ? 9 : 3;
      addTree(x, -68 + (Math.random() - 0.5) * 8, sp, 0.95, 1.2);
      addTree(x + (Math.random() - 0.5) * 6, -82, 10, 0.9, 1.15);
    }

    // ------------------------------------------------------------------------
    // ZONE J: PERIMETER WOODLAND BUFFER (Evergreen Conifers & Large Shade)
    // ------------------------------------------------------------------------
    const perimeterGroves = [
      { cx: -290, cz: -190, count: 28, radius: 45 },
      { cx: 290, cz: -190, count: 28, radius: 45 },
      { cx: 0, cz: -225, count: 32, radius: 48 },
      { cx: -305, cz: 215, count: 24, radius: 38 },
      { cx: 305, cz: 215, count: 24, radius: 38 },
      { cx: -155, cz: 248, count: 22, radius: 32 },
      { cx: 155, cz: 248, count: 22, radius: 32 },
      { cx: -320, cz: 0, count: 24, radius: 35 },
      { cx: 320, cz: 0, count: 24, radius: 35 }
    ];

    perimeterGroves.forEach(grove => {
      for (let i = 0; i < grove.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * grove.radius;
        const gx = grove.cx + Math.cos(ang) * rad;
        const gz = grove.cz + Math.sin(ang) * rad;
        // Naturalized woodland mix: 50% Conifer (12), 25% Large Shade (4), 15% Avenue (1), 10% Yellow (3)
        const sp = (i % 4 === 0) ? 12 : (i % 4 === 1) ? 4 : (i % 4 === 2) ? 12 : (i % 8 === 3 ? 3 : 1);
        addTree(gx, gz, sp, 0.95, 1.35);
      }
    });

    return trees;
  }

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
          roughness: 0.4,
          metalness: 0.6
        });

        const canopyGeo = new THREE.BoxGeometry(ent.width, 0.8, 8.5);
        canopyGeo.translate(0, 6.2, 0);
        const canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.castShadow = true;
        entGroup.add(canopy);

        const colL = new THREE.CylinderGeometry(0.35, 0.35, 6.0, 12);
        colL.translate(-ent.width * 0.42, 3.0, 0);
        const colR = new THREE.CylinderGeometry(0.35, 0.35, 6.0, 12);
        colR.translate(ent.width * 0.42, 3.0, 0);
        const cols = BufferGeometryUtils.mergeGeometries([colL, colR]);
        const colsMesh = new THREE.Mesh(cols, pillarMat);
        colsMesh.castShadow = true;
        entGroup.add(colsMesh);

        if (ent.hasSecurityKiosk) {
          const kioskGeo = new THREE.BoxGeometry(3.4, 2.8, 4.2);
          kioskGeo.translate(ent.width * 0.35, 1.4, 0);
          const kiosk = new THREE.Mesh(kioskGeo, pillarMat);
          kiosk.castShadow = true;
          entGroup.add(kiosk);
        }
      }

      this.subgroups.entrances.add(entGroup);
    });
  }
}
