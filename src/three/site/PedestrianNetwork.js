import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MASTER_PEDESTRIAN_PATHS, CENTRAL_ASSEMBLY_PLAZA } from './CampusLayout.js';

// ============================================================================
// MASTER PEDESTRIAN PROMENADES & SPOKES
// ============================================================================
// Generates the 9 radiating radial pedestrian allées, forecourt stone paving,
// and perimeter walkway curb ribbons connecting the Central Hero Building to
// all building clusters, parking lots, sports complexes, and eco-lake.

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

    // 1. Build all 9 master pedestrian promenades & spokes
    MASTER_PEDESTRIAN_PATHS.forEach(pathDef => {
      const pathMesh = this.createPaverWalkwayMesh(
        pathDef.points,
        pathDef.width || 4.0,
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

    // 2. Build Hero Central Forecourt Arrival Plaza
    this.buildCentralForecourtPlaza();
  }

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
    const curbW = 0.24;
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

          curbIndices.push(cRow, cRow + 1, cNext);
          curbIndices.push(cRow + 1, cNext + 1, cNext);

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

    if (curbCollector && curbVerts.length > 0) {
      const cGeo = new THREE.BufferGeometry();
      cGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
      cGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
      cGeo.setIndex(curbIndices);
      curbCollector.push(cGeo);
    }

    return mesh;
  }

  buildCentralForecourtPlaza() {
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

    // Circular stone paving
    const basePavingGeo = new THREE.CircleGeometry(r, 64);
    const basePavingMesh = new THREE.Mesh(basePavingGeo, this.materials.plazaStoneMat);
    basePavingMesh.rotation.x = -Math.PI / 2;
    basePavingMesh.position.set(cx, 0.035, cz);
    basePavingMesh.receiveShadow = true;
    plazaGroup.add(basePavingMesh);

    // Outer curb
    const curbGeo = new THREE.RingGeometry(r, r + 0.45, 64);
    const curbMesh = new THREE.Mesh(curbGeo, this.materials.curbMat);
    curbMesh.rotation.x = -Math.PI / 2;
    curbMesh.position.set(cx, 0.045, cz);
    curbMesh.receiveShadow = true;
    plazaGroup.add(curbMesh);

    this.subgroups.centralPlaza.add(plazaGroup);
  }
}
