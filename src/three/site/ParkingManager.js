import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PARKING_FACILITIES } from './CampusLayout.js';

// ============================================================================
// INTEGRATED CAMPUS PARKING FACILITIES (MATCHING REFERENCE MASTER PLAN)
// ============================================================================
// Creates authentic institutional surface parking facilities:
// - Main Parking Area (Phase 1, South-West) with 220+ stalls and tree islands
// - Secondary Parking Area (Staff / Visitors, South-East) with 140+ stalls
// - Dedicated driving aisles, painted stall lines, EV bays, perimeter border curbs
// - Landscaped tree shade islands with manicured grass and ornamental trees
// - Realistic parked vehicle fleet (low-poly sedans/SUVs in institutional color palette)

export class ParkingManager {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'Parking';
    this.group.userData = { id: 'PARKING-SYSTEM', type: 'PARKING_FACILITIES' };

    this.subgroups = {
      pavements: new THREE.Group(),
      curbs: new THREE.Group(),
      stallLines: new THREE.Group(),
      medianIslands: new THREE.Group(),
      evChargers: new THREE.Group(),
      trees: new THREE.Group(),
      vehicles: new THREE.Group()
    };

    this.group.add(this.subgroups.pavements);
    this.group.add(this.subgroups.curbs);
    this.group.add(this.subgroups.stallLines);
    this.group.add(this.subgroups.medianIslands);
    this.group.add(this.subgroups.evChargers);
    this.group.add(this.subgroups.trees);
    this.group.add(this.subgroups.vehicles);

    this.buildParking();
  }

  createBorderCurb(w, d, thick = 0.45, height = 0.16) {
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

  buildParking() {
    const pavementGeos = [];
    const curbGeos = [];
    const lineGeos = [];
    const medianTurfGeos = [];
    const evChargerGeos = [];
    const treePositions = [];
    const vehiclePositions = [];

    const whiteLineMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    const chargerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8
    });

    PARKING_FACILITIES.forEach(facility => {
      const b = facility.bounds;
      const w = b.maxX - b.minX;
      const d = b.maxZ - b.minZ;
      const cx = (b.minX + b.maxX) * 0.5;
      const cz = (b.minZ + b.maxZ) * 0.5;

      // 1. Asphalt Pavement Base (Elevated above terrain at y = 0.04)
      const pGeo = new THREE.PlaneGeometry(w, d);
      pGeo.rotateX(-Math.PI / 2);
      pGeo.translate(cx, 0.04, cz);
      pavementGeos.push(pGeo);

      // 2. Outer Perimeter Concrete Border Curb (BORDERS ONLY - center remains open!)
      const cBorder = this.createBorderCurb(w, d, 0.45, 0.16);
      cBorder.translate(cx, 0.04, cz);
      curbGeos.push(cBorder);

      // 3. Realistic Parking Bays & Driving Aisles
      const stallW = 2.6;
      const stallD = 5.2;
      const aisleW = 6.4;

      const numAisles = Math.floor((d - 10) / (stallD * 2 + aisleW));
      const startZ = b.minZ + 8;

      for (let a = 0; a < numAisles; a++) {
        const aisleCenterZ = startZ + a * (stallD * 2 + aisleW) + stallD + aisleW * 0.5;
        const northRowZ = aisleCenterZ - aisleW * 0.5 - stallD * 0.5;
        const southRowZ = aisleCenterZ + aisleW * 0.5 + stallD * 0.5;

        const numStallsX = Math.floor((w - 12) / stallW);
        const startX = b.minX + 6;

        for (let s = 0; s < numStallsX; s++) {
          const stallX = startX + s * stallW + stallW * 0.5;

          // Stall Divider Line (North Row)
          const lineGeoN = new THREE.PlaneGeometry(0.12, stallD);
          lineGeoN.rotateX(-Math.PI / 2);
          lineGeoN.translate(stallX - stallW * 0.5, 0.046, northRowZ);
          lineGeos.push(lineGeoN);

          // Stall Divider Line (South Row)
          const lineGeoS = new THREE.PlaneGeometry(0.12, stallD);
          lineGeoS.rotateX(-Math.PI / 2);
          lineGeoS.translate(stallX - stallW * 0.5, 0.046, southRowZ);
          lineGeos.push(lineGeoS);

          let isNorthIsland = false;
          let isSouthIsland = false;

          // EV Charging Bays on first aisle
          if (facility.hasEvChargers && a === 0 && s < 8) {
            const evBay = new THREE.PlaneGeometry(stallW * 0.75, stallD * 0.5);
            evBay.rotateX(-Math.PI / 2);
            evBay.translate(stallX, 0.048, northRowZ - stallD * 0.2);
            lineGeos.push(evBay);

            const postGeo = new THREE.BoxGeometry(0.35, 1.4, 0.25);
            postGeo.translate(stallX, 0.74, northRowZ - stallD * 0.5 - 0.35);
            evChargerGeos.push(postGeo);
          }

          // Landscaped Tree Islands every 8 stalls
          if (facility.hasTreeIslands && s > 0 && s % 8 === 0) {
            isNorthIsland = true;
            const islandGeo = new THREE.BoxGeometry(stallW * 0.8, 0.12, stallD * 0.9);
            islandGeo.translate(stallX, 0.08, northRowZ);
            curbGeos.push(islandGeo);

            const turfGeo = new THREE.PlaneGeometry(stallW * 0.75, stallD * 0.85);
            turfGeo.rotateX(-Math.PI / 2);
            turfGeo.translate(stallX, 0.142, northRowZ);
            medianTurfGeos.push(turfGeo);

            treePositions.push({ x: stallX, z: northRowZ });
          }

          if (facility.hasTreeIslands && s > 0 && (s + 4) % 8 === 0) {
            isSouthIsland = true;
            const islandGeoS = new THREE.BoxGeometry(stallW * 0.8, 0.12, stallD * 0.9);
            islandGeoS.translate(stallX, 0.08, southRowZ);
            curbGeos.push(islandGeoS);

            const turfGeoS = new THREE.PlaneGeometry(stallW * 0.75, stallD * 0.85);
            turfGeoS.rotateX(-Math.PI / 2);
            turfGeoS.translate(stallX, 0.142, southRowZ);
            medianTurfGeos.push(turfGeoS);

            treePositions.push({ x: stallX, z: southRowZ });
          }

          // 4. Parked Vehicles (~65% occupancy in realistic distribution)
          if (!isNorthIsland && (a !== 0 || s >= 8)) {
            // Hash-based pseudo random for stable deterministic placement
            const hashN = Math.sin(stallX * 12.9898 + northRowZ * 78.233) * 43758.5453;
            const randN = hashN - Math.floor(hashN);
            if (randN < 0.68) {
              vehiclePositions.push({
                x: stallX + (randN - 0.34) * 0.2,
                z: northRowZ + (randN - 0.5) * 0.3,
                rotY: (randN > 0.5 ? 0 : Math.PI),
                colorType: Math.floor(randN * 10) % 5
              });
            }
          }

          if (!isSouthIsland) {
            const hashS = Math.sin(stallX * 24.321 + southRowZ * 63.891) * 23421.678;
            const randS = hashS - Math.floor(hashS);
            if (randS < 0.65) {
              vehiclePositions.push({
                x: stallX + (randS - 0.32) * 0.2,
                z: southRowZ + (randS - 0.5) * 0.3,
                rotY: (randS > 0.5 ? Math.PI : 0),
                colorType: Math.floor(randS * 10) % 5
              });
            }
          }
        }
      }
    });

    // ------------------------------------------------------------------------
    // Assemble Subgroups
    // ------------------------------------------------------------------------
    if (pavementGeos.length > 0) {
      const mergedPavements = BufferGeometryUtils.mergeGeometries(pavementGeos);
      const mesh = new THREE.Mesh(mergedPavements, this.materials.plainAsphaltMat);
      mesh.receiveShadow = true;
      this.subgroups.pavements.add(mesh);
    }

    if (curbGeos.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeos);
      const mesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.subgroups.curbs.add(mesh);
    }

    if (lineGeos.length > 0) {
      const mergedLines = BufferGeometryUtils.mergeGeometries(lineGeos);
      const mesh = new THREE.Mesh(mergedLines, whiteLineMat);
      this.subgroups.stallLines.add(mesh);
    }

    if (medianTurfGeos.length > 0) {
      const mergedTurf = BufferGeometryUtils.mergeGeometries(medianTurfGeos);
      const mesh = new THREE.Mesh(mergedTurf, this.materials.courtyardTurfMat);
      mesh.receiveShadow = true;
      this.subgroups.medianIslands.add(mesh);
    }

    if (evChargerGeos.length > 0) {
      const mergedChargers = BufferGeometryUtils.mergeGeometries(evChargerGeos);
      const mesh = new THREE.Mesh(mergedChargers, chargerMat);
      mesh.castShadow = true;
      this.subgroups.evChargers.add(mesh);
    }

    if (treePositions.length > 0) {
      this.buildParkingShadeTrees(treePositions);
    }

    if (vehiclePositions.length > 0) {
      this.buildParkedVehicles(vehiclePositions);
    }
  }

  buildParkingShadeTrees(positions) {
    const count = positions.length;
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 2.6, 8);
    const crownGeo = new THREE.SphereGeometry(1.6, 8, 8);
    crownGeo.scale(1.2, 0.9, 1.2);

    const trunkInst = new THREE.InstancedMesh(trunkGeo, this.materials.trunkMat, count);
    const crownInst = new THREE.InstancedMesh(crownGeo, this.materials.ornamentalCrownMat, count);

    trunkInst.castShadow = true;
    crownInst.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const p = positions[i];
      dummy.position.set(p.x, 1.3, p.z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, 3.0, p.z);
      dummy.updateMatrix();
      crownInst.setMatrixAt(i, dummy.matrix);
    }

    trunkInst.instanceMatrix.needsUpdate = true;
    crownInst.instanceMatrix.needsUpdate = true;

    this.subgroups.trees.add(trunkInst);
    this.subgroups.trees.add(crownInst);
  }

  buildParkedVehicles(vehicles) {
    // Elegant low-poly vehicle body
    const bodyGeo = new THREE.BoxGeometry(1.85, 0.55, 4.1);
    bodyGeo.translate(0, 0.35, 0);

    const cabinGeo = new THREE.BoxGeometry(1.62, 0.48, 2.3);
    cabinGeo.translate(0, 0.82, -0.2);

    const wheelsGeo = new THREE.BoxGeometry(1.9, 0.28, 3.3);
    wheelsGeo.translate(0, 0.16, 0);

    const fullCarGeo = BufferGeometryUtils.mergeGeometries([bodyGeo, cabinGeo, wheelsGeo]);

    // 5 Institutional automotive finishes
    const carColors = [
      0xf1f5f9, // Crisp White (40%)
      0x475569, // Executive Slate (25%)
      0x1e293b, // Obsidian Black (15%)
      0x1e3a8a, // Deep Navy Blue (10%)
      0x991b1b  // Dark Crimson (10%)
    ];

    const carMats = carColors.map(c => new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.3,
      metalness: 0.7
    }));

    // Group vehicles by color
    const buckets = [[], [], [], [], []];
    vehicles.forEach(v => {
      buckets[v.colorType].push(v);
    });

    const dummy = new THREE.Object3D();

    buckets.forEach((bucket, bIdx) => {
      if (bucket.length === 0) return;
      const count = bucket.length;
      const instMesh = new THREE.InstancedMesh(fullCarGeo, carMats[bIdx], count);
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;

      for (let i = 0; i < count; i++) {
        const v = bucket[i];
        dummy.position.set(v.x, 0.04, v.z);
        dummy.rotation.set(0, v.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
      }

      instMesh.instanceMatrix.needsUpdate = true;
      this.subgroups.vehicles.add(instMesh);
    });
  }
}
