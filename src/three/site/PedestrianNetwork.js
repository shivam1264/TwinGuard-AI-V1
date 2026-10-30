import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CENTRAL_ASSEMBLY_PLAZA } from './CampusLayout.js';

// ============================================================================
// PEDESTRIAN PROMENADES & CENTRAL ASSEMBLY PLAZA (MATCHING REFERENCES 1, 2, 3, 4)
// ============================================================================
// Real institutional campuses feature prominent diagonal and arterial paver paths
// cutting across expansive manicured lawns, dividing them into walkable geometric
// islands with continuous raised stone curbs and outdoor seating pockets.

export const MASTER_PEDESTRIAN_PATHS = [
  // A. Ceremonial Arrival Promenade (Hero Drop-off Circus to South Portico)
  {
    id: 'PATH-PROMENADE-001',
    name: 'Hero Arrival Forecourt Promenade',
    width: 6.0,
    points: [
      { x: 0, y: 0.03, z: 65 },
      { x: 0, y: 0.03, z: 46 },
      { x: 0, y: 0.03, z: 28 } // Hero Building South Portico
    ]
  },
  // B. Civic Heart Diagonal (Hero South-West Portico across Great Lawn to Central Plaza) - Ref 1 & 4
  {
    id: 'PATH-CIVIC-002',
    name: 'South-West Civic Heart Diagonal',
    width: 4.8,
    points: [
      { x: -28, y: 0.03, z: 22 },
      { x: -48, y: 0.03, z: 8 },
      { x: -70, y: 0.03, z: -10 } // Center of Central Assembly Plaza
    ]
  },
  // C. Diagonal Cross-Quad Walkway to Student Forum (Ref 1 & 3)
  {
    id: 'PATH-STUDENT-003',
    name: 'Central Plaza to Student Forum Diagonal',
    width: 4.0,
    points: [
      { x: -70,  y: 0.03, z: -10 },
      { x: -90,  y: 0.03, z: 30 },
      { x: -110, y: 0.03, z: 72 } // Student Forum P09
    ]
  },
  // D. North-West Hero Building to Central Plaza Diagonal (Ref 4)
  {
    id: 'PATH-HERO-NORTH-004',
    name: 'Hero North-West Portico Diagonal',
    width: 4.2,
    points: [
      { x: -28, y: 0.03, z: -22 },
      { x: -48, y: 0.03, z: -16 },
      { x: -70, y: 0.03, z: -10 }
    ]
  },
  // E. Great Lawn Diagonal Arterial Cross-Walk (Bisecting Great Lawn NW to SE) - Ref 4
  {
    id: 'PATH-QUAD-BISECTOR-005',
    name: 'Great Lawn Transverse Diagonal Cross-Path',
    width: 3.8,
    points: [
      { x: -118, y: 0.03, z: -45 },
      { x: -70,  y: 0.03, z: -10 },
      { x: -35,  y: 0.03, z: 45 }
    ]
  },
  // F. Central Assembly Plaza to Research Zone (North)
  {
    id: 'PATH-RESEARCH-006',
    name: 'North Research Walkway',
    width: 3.8,
    points: [
      { x: -70, y: 0.03, z: -10 },
      { x: -65, y: 0.03, z: -65 },
      { x: -45, y: 0.03, z: -115 },
      { x: -20, y: 0.03, z: -140 } // Arriving between Plots P05 & P06
    ]
  },
  // G. Central Assembly Plaza to Sports Complex & Roundabout (West)
  {
    id: 'PATH-SPORTS-007',
    name: 'West Sports Parkway Walk',
    width: 3.8,
    points: [
      { x: -70,  y: 0.03, z: -10 },
      { x: -115, y: 0.03, z: 5 },
      { x: -160, y: 0.03, z: 10 },  // Passing North of Roundabout
      { x: -195, y: 0.03, z: 30 }   // Sports Complex running track
    ]
  },
  // H. East Technology & Academic Quad Spine
  {
    id: 'PATH-ACADEMIC-008',
    name: 'East Technology & Academic Spine',
    width: 4.0,
    points: [
      { x: 28,  y: 0.03, z: 10 },   // Hero East entrance
      { x: 75,  y: 0.03, z: 25 },
      { x: 140, y: 0.03, z: 15 },   // Between Plots P01 & P02
      { x: 185, y: 0.03, z: -45 },  // Academic Quad
      { x: 165, y: 0.03, z: -95 }   // Plot P07
    ]
  },
  // I. South-East Lake & Secondary Parking Connector
  {
    id: 'PATH-LAKE-TRANSIT-009',
    name: 'Eco-Lake Scenic Promenade & Parking Link',
    width: 3.4,
    points: [
      { x: 16,  y: 0.03, z: 185 },  // From Entrance Boulevard sidewalk
      { x: 75,  y: 0.03, z: 185 },  // Lake West Shoreline
      { x: 175, y: 0.03, z: 185 },  // Lake East Shoreline
      { x: 205, y: 0.03, z: 185 }   // Secondary Parking entrance
    ]
  }
];

export class PedestrianNetwork {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'PedestrianNetwork';
    this.group.userData = { id: 'PEDESTRIAN-NETWORK', type: 'PEDESTRIAN_NETWORK' };

    this.subgroups = {
      walkways: new THREE.Group(),
      walkwayCurbs: new THREE.Group(),
      centralPlaza: new THREE.Group(),
      amenities: new THREE.Group()
    };

    this.group.add(this.subgroups.walkways);
    this.group.add(this.subgroups.walkwayCurbs);
    this.group.add(this.subgroups.centralPlaza);
    this.group.add(this.subgroups.amenities);

    this.buildNetwork();
  }

  buildNetwork() {
    const curbGeometries = [];

    // 1. Build all continuous pedestrian paver walkways
    MASTER_PEDESTRIAN_PATHS.forEach(pathDef => {
      const pathMesh = this.createPaverWalkwayMesh(
        pathDef.points,
        pathDef.width || 3.8,
        pathDef.id,
        pathDef.name,
        curbGeometries
      );
      this.subgroups.walkways.add(pathMesh);
    });

    if (curbGeometries.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeometries);
      const curbMesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      this.subgroups.walkwayCurbs.add(curbMesh);
    }

    // 2. Build Circular Central Assembly Plaza (West of Hero Building)
    this.buildCentralAssemblyPlaza();
  }

  // Generates smooth curving paver walkway ribbons and edging stone curbs
  createPaverWalkwayMesh(points, width, id, name, curbCollector) {
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y || 0.03, p.z));
    const curve = new THREE.CatmullRomCurve3(v3Points, false, 'centripetal', 0.5);

    const length = curve.getLength();
    const segments = Math.max(24, Math.ceil(length / 2.0));

    const vertices = [];
    const uvs = [];
    const indices = [];
    const normals = [];

    const halfW = width * 0.5;
    const curbW = 0.22;
    const walkY = 0.052;
    const curbTopY = 0.075;

    const curbVerts = [];
    const curbIndices = [];
    const curbNormals = [];

    let accumulatedDist = 0;
    let prevPos = curve.getPoint(0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      if (i > 0) accumulatedDist += pt.distanceTo(prevPos);
      prevPos = pt.clone();

      const left = pt.clone().addScaledVector(normal, halfW);
      left.y = walkY;
      const right = pt.clone().addScaledVector(normal, -halfW);
      right.y = walkY;

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      normals.push(0, 1, 0);
      normals.push(0, 1, 0);

      const vY = accumulatedDist / width;
      uvs.push(0.0, vY);
      uvs.push(1.0, vY);

      if (i < segments) {
        const row = i * 2;
        // Upward winding (+Y normal)
        indices.push(row, row + 2, row + 1);
        indices.push(row + 1, row + 2, row + 3);
      }

      if (curbCollector) {
        const cL_in = pt.clone().addScaledVector(normal, halfW);
        const cL_out = pt.clone().addScaledVector(normal, halfW + curbW);
        const cR_in = pt.clone().addScaledVector(normal, -halfW);
        const cR_out = pt.clone().addScaledVector(normal, -(halfW + curbW));

        curbVerts.push(
          cL_in.x, curbTopY, cL_in.z,
          cL_out.x, curbTopY, cL_out.z,
          cR_in.x, curbTopY, cR_in.z,
          cR_out.x, curbTopY, cR_out.z
        );

        curbNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

        if (i < segments) {
          const cRow = i * 4;
          const cNext = (i + 1) * 4;

          // Left Curb
          curbIndices.push(cRow, cRow + 1, cNext);
          curbIndices.push(cRow + 1, cNext + 1, cNext);

          // Right Curb
          curbIndices.push(cRow + 2, cNext + 2, cRow + 3);
          curbIndices.push(cRow + 3, cNext + 2, cNext + 3);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    const mesh = new THREE.Mesh(geo, this.materials.paverMat);
    mesh.receiveShadow = true;
    mesh.userData = { id, type: 'PEDESTRIAN_PATH', name, width };

    // Edging Stone Curbs
    if (curbCollector && curbVerts.length > 0) {
      const cGeo = new THREE.BufferGeometry();
      cGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
      cGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
      cGeo.setIndex(curbIndices);
      curbCollector.push(cGeo);
    }

    return mesh;
  }

  // Circular Central Assembly Plaza (Matching Reference Image)
  buildCentralAssemblyPlaza() {
    const plaza = CENTRAL_ASSEMBLY_PLAZA;
    const cx = plaza.center.x;
    const cz = plaza.center.z;
    const r = plaza.radius;

    const plazaGroup = new THREE.Group();
    plazaGroup.name = plaza.id;
    plazaGroup.userData = {
      id: plaza.id,
      type: 'EVACUATION_ASSEMBLY',
      name: plaza.name,
      capacity: plaza.capacity
    };

    // 1. Broad Circular Plaza Paving (Diameter ~64m)
    const basePavingGeo = new THREE.CircleGeometry(r, 64);
    const basePavingMesh = new THREE.Mesh(basePavingGeo, this.materials.plazaStoneMat);
    basePavingMesh.rotation.x = -Math.PI / 2;
    basePavingMesh.position.set(cx, 0.035, cz);
    basePavingMesh.receiveShadow = true;
    plazaGroup.add(basePavingMesh);

    // Outer perimeter concrete curb ring
    const curbGeo = new THREE.RingGeometry(r, r + 0.55, 64);
    const curbMesh = new THREE.Mesh(curbGeo, this.materials.curbMat);
    curbMesh.rotation.x = -Math.PI / 2;
    curbMesh.position.set(cx, 0.045, cz);
    curbMesh.receiveShadow = true;
    plazaGroup.add(curbMesh);

    // 2. Concentric Stepped Amphitheater Tiers
    const stepCount = 3;
    const stepH = 0.18;
    const stepW = 1.4;
    const innerRadius = 18.0;

    for (let s = 0; s < stepCount; s++) {
      const stepR = innerRadius - s * stepW;
      const stepGeo = new THREE.CylinderGeometry(stepR, stepR, stepH, 48);
      const stepMesh = new THREE.Mesh(stepGeo, this.materials.curbMat);
      stepMesh.position.set(cx, 0.04 + s * stepH + stepH * 0.5, cz);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      plazaGroup.add(stepMesh);
    }

    // 3. Center Circular Fountain & Campus Water Monument
    const fountainR = 8.0;
    const fountainRimGeo = new THREE.CylinderGeometry(fountainR, fountainR + 0.4, 0.4, 32);
    const fountainRim = new THREE.Mesh(fountainRimGeo, this.materials.curbMat);
    fountainRim.position.set(cx, 0.2 + stepCount * stepH, cz);
    fountainRim.castShadow = true;
    plazaGroup.add(fountainRim);

    // Reflective fountain water basin
    const fountainWaterGeo = new THREE.CircleGeometry(fountainR - 0.2, 32);
    const fountainWater = new THREE.Mesh(fountainWaterGeo, this.materials.waterMat);
    fountainWater.rotation.x = -Math.PI / 2;
    fountainWater.position.set(cx, 0.38 + stepCount * stepH, cz);
    plazaGroup.add(fountainWater);

    // Center Spire / Fountain Monolith
    const spireGeo = new THREE.CylinderGeometry(0.5, 0.8, 4.5, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 });
    const spireMesh = new THREE.Mesh(spireGeo, spireMat);
    spireMesh.position.set(cx, 2.25 + stepCount * stepH, cz);
    spireMesh.castShadow = true;
    plazaGroup.add(spireMesh);

    // Glowing Cyan Beacon atop Spire
    const beaconGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(cx, 4.6 + stepCount * stepH, cz);
    plazaGroup.add(beaconMesh);

    // 4. Emergency Assembly Command Totem (ASSEMBLY-001)
    const totemGroup = new THREE.Group();
    totemGroup.name = 'EMERGENCY-TOTEM-001';
    totemGroup.position.set(cx, 0, cz - r * 0.7);

    const totemBase = new THREE.BoxGeometry(1.6, 4.8, 0.9);
    const totemBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.85
    });
    const totemMesh = new THREE.Mesh(totemBase, totemBaseMat);
    totemMesh.position.set(0, 2.4, 0);
    totemMesh.castShadow = true;
    totemGroup.add(totemMesh);

    // Active Emergency Status Display Screen
    const screenGeo = new THREE.PlaneGeometry(1.3, 1.8);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 3.2, 0.46);
    totemGroup.add(screenMesh);

    plazaGroup.add(totemGroup);

    // 5. Perimeter Civic Seating Benches
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.5 });
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const bx = cx + Math.cos(a) * (r * 0.85);
      const bz = cz + Math.sin(a) * (r * 0.85);
      const bGeo = new THREE.BoxGeometry(4.0, 0.45, 0.7);
      const bMesh = new THREE.Mesh(bGeo, benchMat);
      bMesh.position.set(bx, 0.25, bz);
      bMesh.rotation.y = a + Math.PI / 2;
      bMesh.castShadow = true;
      plazaGroup.add(bMesh);
    }

    this.subgroups.centralPlaza.add(plazaGroup);
  }
}
