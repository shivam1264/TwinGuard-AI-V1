import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  PRIMARY_ROAD_POINTS,
  SECONDARY_ROADS,
  EMERGENCY_ROADS,
  CAMPUS_ROUNDABOUT
} from './CampusLayout.js';

// ============================================================================
// REALISTIC CAMPUS ROAD NETWORK & STRUCTURAL ARTERIAL SPINE
// ============================================================================
// Generates bold, physically wide dark asphalt ribbons with raised concrete
// curbs, continuous sidewalks, thermoplastic lane markings, pedestrian zebra
// crosswalks, west roundabout circus, and architectural street lighting.

export class RoadNetwork {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'Roads';
    this.group.userData = { id: 'ROADS-NETWORK', type: 'ROAD_NETWORK' };

    this.subgroups = {
      primary: new THREE.Group(),
      secondary: new THREE.Group(),
      emergency: new THREE.Group(),
      roundabout: new THREE.Group(),
      curbs: new THREE.Group(),
      sidewalks: new THREE.Group(),
      markings: new THREE.Group(),
      lighting: new THREE.Group()
    };

    this.subgroups.primary.name = 'PrimaryRoads';
    this.subgroups.secondary.name = 'SecondaryRoads';
    this.subgroups.emergency.name = 'EmergencyRoads';
    this.subgroups.roundabout.name = 'Roundabouts';
    this.subgroups.curbs.name = 'RoadCurbs';
    this.subgroups.sidewalks.name = 'RoadsideSidewalks';
    this.subgroups.markings.name = 'CrosswalksAndMarkings';
    this.subgroups.lighting.name = 'StreetLighting';

    this.group.add(this.subgroups.primary);
    this.group.add(this.subgroups.secondary);
    this.group.add(this.subgroups.emergency);
    this.group.add(this.subgroups.roundabout);
    this.group.add(this.subgroups.curbs);
    this.group.add(this.subgroups.sidewalks);
    this.group.add(this.subgroups.markings);
    this.group.add(this.subgroups.lighting);

    this.buildNetwork();
  }

  buildNetwork() {
    const curbGeometries = [];
    const streetLightPositions = [];
    const sidewalkGeometries = [];

    // 1. Primary Campus Spine Boulevard (Width = 9.0m)
    const primaryMesh = this.createSplineRoadMesh(
      PRIMARY_ROAD_POINTS,
      9.0,
      this.materials.primaryAsphaltMat,
      'ROAD-PRIMARY-001',
      'Campus Central Spine Boulevard',
      curbGeometries,
      sidewalkGeometries,
      streetLightPositions,
      28
    );
    this.subgroups.primary.add(primaryMesh);

    // Hero Building Front Forecourt Paved Apron (connecting drop-off loop at Z = 77)
    this.buildHeroDropOffApron();

    // 2. Secondary Road Network (Width = 6.0m to 6.8m)
    SECONDARY_ROADS.forEach(roadDef => {
      const secMesh = this.createSplineRoadMesh(
        roadDef.points,
        roadDef.width,
        this.materials.secondaryAsphaltMat,
        roadDef.id,
        roadDef.name,
        curbGeometries,
        null,
        streetLightPositions,
        34
      );
      this.subgroups.secondary.add(secMesh);
    });

    // 3. Emergency & Service Road Network (Width = 5.2m to 5.8m)
    EMERGENCY_ROADS.forEach(roadDef => {
      const emergMesh = this.createSplineRoadMesh(
        roadDef.points,
        roadDef.width,
        this.materials.emergencyAsphaltMat,
        roadDef.id,
        roadDef.name,
        curbGeometries,
        null,
        streetLightPositions,
        42
      );
      emergMesh.userData.isDedicatedEmergency = true;
      this.subgroups.emergency.add(emergMesh);
    });

    // 4. Major West Roundabout Circus
    this.buildRoundabout(curbGeometries);

    // 5. Merge all road curbs into high-performance mesh
    if (curbGeometries.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeometries);
      const curbMesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      this.subgroups.curbs.add(curbMesh);
    }

    // 6. Merge roadside sidewalks along primary spine
    if (sidewalkGeometries.length > 0) {
      const mergedSidewalks = BufferGeometryUtils.mergeGeometries(sidewalkGeometries);
      const swMesh = new THREE.Mesh(mergedSidewalks, this.materials.paverMat);
      swMesh.receiveShadow = true;
      this.subgroups.sidewalks.add(swMesh);
    }

    // 7. Pedestrian Crosswalks (Thermoplastic Zebra Striping)
    this.buildCrosswalks();

    // 8. Architectural LED Street Lighting Poles
    this.buildStreetLights(streetLightPositions);
  }

  buildHeroDropOffApron() {
    const apronGeo = new THREE.PlaneGeometry(38.0, 14.0);
    apronGeo.rotateX(-Math.PI / 2);
    apronGeo.translate(0, 0.045, 75.0);
    const apronMesh = new THREE.Mesh(apronGeo, this.materials.plazaStoneMat);
    apronMesh.receiveShadow = true;
    this.subgroups.primary.add(apronMesh);

    const bGeo = new THREE.BoxGeometry(38.4, 0.12, 0.35);
    bGeo.translate(0, 0.065, 68.0);
    const bMesh = new THREE.Mesh(bGeo, this.materials.curbMat);
    bMesh.receiveShadow = true;
    this.subgroups.primary.add(bMesh);
  }

  createSplineRoadMesh(
    points,
    width,
    material,
    id,
    name,
    curbCollector,
    sidewalkCollector,
    lightCollector,
    lightSpacing = 30
  ) {
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y || 0.02, p.z));
    const curve = new THREE.CatmullRomCurve3(v3Points, false, 'centripetal', 0.5);

    const length = curve.getLength();
    const segments = Math.max(48, Math.ceil(length / 2.0));

    // Road Ribbon Geometry
    const roadVerts = [];
    const roadUvs = [];
    const roadIndices = [];
    const roadNormals = [];

    // Continuous Curb Geometry
    const curbVerts = [];
    const curbIndices = [];
    const curbNormals = [];

    // Continuous Sidewalk Geometry (if requested)
    const swVerts = [];
    const swUvs = [];
    const swIndices = [];
    const swNormals = [];

    const halfW = width * 0.5;
    const curbW = 0.35;
    const curbTopY = 0.14;
    const roadY = 0.06;
    const swY = 0.08;
    const sidewalkW = 2.4;

    let accumulatedDist = 0;
    let prevPos = curve.getPoint(0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      if (i > 0) {
        accumulatedDist += pt.distanceTo(prevPos);
      }
      prevPos = pt.clone();

      // 1. Road Surface Vertices
      const roadL = pt.clone().addScaledVector(normal, halfW);
      roadL.y = roadY;
      const roadR = pt.clone().addScaledVector(normal, -halfW);
      roadR.y = roadY;

      roadVerts.push(roadL.x, roadL.y, roadL.z);
      roadVerts.push(roadR.x, roadR.y, roadR.z);
      roadNormals.push(0, 1, 0, 0, 1, 0);

      const vY = accumulatedDist / 14.0;
      roadUvs.push(0.0, vY, 1.0, vY);

      if (i < segments) {
        const row = i * 2;
        roadIndices.push(row, row + 1, row + 2);
        roadIndices.push(row + 1, row + 3, row + 2);
      }

      // 2. Continuous Left & Right Curbs (Top Surface + Vertical Inner Face)
      if (curbCollector) {
        const cL_in = pt.clone().addScaledVector(normal, halfW);
        const cL_out = pt.clone().addScaledVector(normal, halfW + curbW);
        const cR_in = pt.clone().addScaledVector(normal, -halfW);
        const cR_out = pt.clone().addScaledVector(normal, -(halfW + curbW));

        // 6 curb vertices per profile slice:
        // 0: Left Curb Inner Top, 1: Left Curb Outer Top, 2: Left Curb Inner Base
        // 3: Right Curb Inner Top, 4: Right Curb Outer Top, 5: Right Curb Inner Base
        curbVerts.push(
          cL_in.x, curbTopY, cL_in.z,
          cL_out.x, curbTopY, cL_out.z,
          cL_in.x, roadY, cL_in.z,
          cR_in.x, curbTopY, cR_in.z,
          cR_out.x, curbTopY, cR_out.z,
          cR_in.x, roadY, cR_in.z
        );

        curbNormals.push(
          0, 1, 0,
          0, 1, 0,
          -normal.x, 0, -normal.z,
          0, 1, 0,
          0, 1, 0,
          normal.x, 0, normal.z
        );

        if (i < segments) {
          const cRow = i * 6;
          const nextRow = (i + 1) * 6;

          // Left Curb Top (Counter-clockwise upward: cRow -> nextRow -> nextRow+1)
          curbIndices.push(cRow, nextRow, nextRow + 1);
          curbIndices.push(cRow, nextRow + 1, cRow + 1);

          // Left Curb Inner Riser (facing toward road center -normal)
          curbIndices.push(cRow + 2, nextRow + 2, cRow);
          curbIndices.push(nextRow + 2, nextRow, cRow);

          // Right Curb Top (Counter-clockwise upward: cRow+4 -> nextRow+4 -> nextRow+3)
          curbIndices.push(cRow + 4, nextRow + 4, nextRow + 3);
          curbIndices.push(cRow + 4, nextRow + 3, cRow + 3);

          // Right Curb Inner Riser (facing toward road center +normal)
          curbIndices.push(cRow + 5, cRow + 3, nextRow + 5);
          curbIndices.push(nextRow + 5, cRow + 3, nextRow + 3);
        }
      }

      // 3. Continuous Sidewalks on Both Sides
      if (sidewalkCollector) {
        const swL_in = pt.clone().addScaledVector(normal, halfW + curbW);
        const swL_out = pt.clone().addScaledVector(normal, halfW + curbW + sidewalkW);
        const swR_in = pt.clone().addScaledVector(normal, -(halfW + curbW));
        const swR_out = pt.clone().addScaledVector(normal, -(halfW + curbW + sidewalkW));

        // 4 sidewalk vertices: 0: L_in, 1: L_out, 2: R_in, 3: R_out
        swVerts.push(
          swL_in.x, swY, swL_in.z,
          swL_out.x, swY, swL_out.z,
          swR_in.x, swY, swR_in.z,
          swR_out.x, swY, swR_out.z
        );

        swNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

        const swDist = accumulatedDist / 4.0;
        swUvs.push(0, swDist, 1, swDist, 0, swDist, 1, swDist);

        if (i < segments) {
          const sRow = i * 4;
          const sNext = (i + 1) * 4;

          // Left Sidewalk (Counter-clockwise upward)
          swIndices.push(sRow, sNext, sNext + 1);
          swIndices.push(sRow, sNext + 1, sRow + 1);

          // Right Sidewalk (Counter-clockwise upward)
          swIndices.push(sRow + 3, sNext + 3, sNext + 2);
          swIndices.push(sRow + 3, sNext + 2, sRow + 2);
        }
      }

      // Street light placement along outer sidewalk/curb
      if (lightCollector && i % Math.max(8, Math.round(lightSpacing / 2.0)) === 0 && i > 0 && i < segments) {
        const side = (i % 2 === 0) ? 1 : -1;
        const polePos = pt.clone().addScaledVector(normal, side * (halfW + curbW + (sidewalkCollector ? sidewalkW + 0.6 : 0.8)));
        polePos.y = roadY;
        lightCollector.push({
          pos: polePos,
          rotY: Math.atan2(tangent.x, tangent.z) + (side > 0 ? Math.PI / 2 : -Math.PI / 2)
        });
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);

    const roadMesh = new THREE.Mesh(roadGeo, material);
    roadMesh.receiveShadow = false;
    roadMesh.userData = { id, type: 'ROAD_SEGMENT', name, width, isEmergencyRoute: width >= 5.0 };

    // Register Curbs and Sidewalks into collectors
    if (curbCollector && curbVerts.length > 0) {
      const cGeo = new THREE.BufferGeometry();
      cGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
      cGeo.setIndex(curbIndices);
      cGeo.computeVertexNormals();
      curbCollector.push(cGeo);
    }

    if (sidewalkCollector && swVerts.length > 0) {
      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.Float32BufferAttribute(swVerts, 3));
      sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(swUvs, 2));
      sGeo.setIndex(swIndices);
      sGeo.computeVertexNormals();
      sidewalkCollector.push(sGeo);
    }

    return roadMesh;
  }

  buildRoundabout(curbCollector) {
    const rb = CAMPUS_ROUNDABOUT;
    const center = rb.center;

    // 1. Asphalt Circulating Ring
    const ringGeo = new THREE.RingGeometry(rb.innerRadius, rb.outerRadius, 64);
    const ringMesh = new THREE.Mesh(ringGeo, this.materials.plainAsphaltMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(center.x, 0.062, center.z);
    ringMesh.receiveShadow = true;
    ringMesh.userData = { id: rb.id, type: 'ROUNDABOUT', name: rb.name };
    this.subgroups.roundabout.add(ringMesh);

    // 2. Outer Concrete Perimeter Curb
    const outerCurb = new THREE.RingGeometry(rb.outerRadius, rb.outerRadius + 0.45, 64);
    const outerCurbMesh = new THREE.Mesh(outerCurb, this.materials.curbMat);
    outerCurbMesh.rotation.x = -Math.PI / 2;
    outerCurbMesh.position.set(center.x, 0.075, center.z);
    this.subgroups.roundabout.add(outerCurbMesh);

    // 3. Inner Center Island (Raised Curb + Manicured Turf)
    const islandCurbGeo = new THREE.CylinderGeometry(rb.islandRadius, rb.islandRadius, 0.3, 48);
    const islandCurbMesh = new THREE.Mesh(islandCurbGeo, this.materials.curbMat);
    islandCurbMesh.position.set(center.x, 0.20, center.z);
    islandCurbMesh.castShadow = true;
    islandCurbMesh.receiveShadow = true;
    this.subgroups.roundabout.add(islandCurbMesh);

    const islandTurfGeo = new THREE.CircleGeometry(rb.islandRadius - 0.25, 48);
    const islandTurf = new THREE.Mesh(islandTurfGeo, this.materials.courtyardTurfMat);
    islandTurf.rotation.x = -Math.PI / 2;
    islandTurf.position.set(center.x, 0.355, center.z);
    islandTurf.receiveShadow = true;
    this.subgroups.roundabout.add(islandTurf);

    // Centerpiece Monument Obelisk
    const pillarGeo = new THREE.CylinderGeometry(0.85, 1.3, 6.5, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(center.x, 3.25, center.z);
    pillar.castShadow = true;
    this.subgroups.roundabout.add(pillar);

    const topRingGeo = new THREE.TorusGeometry(1.0, 0.12, 8, 32);
    topRingGeo.rotateX(Math.PI / 2);
    const topRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const topRing = new THREE.Mesh(topRingGeo, topRingMat);
    topRing.position.set(center.x, 6.5, center.z);
    this.subgroups.roundabout.add(topRing);
  }

  buildCrosswalks() {
    const crosswalkLocations = [
      { x: -10, z: 275, angle: 0.05, lanes: 8 },
      { x: 5,   z: 185, angle: 0.12, lanes: 8 },
      { x: 10,  z: 130, angle: 0.15, lanes: 8 },
      { x: 0,   z: 88,  angle: 0.0,  lanes: 8 },
      { x: -55, z: 65,  angle: 0.15, lanes: 8 },
      { x: -136, z: 35, angle: 0.0,  lanes: 8 },
      { x: -160, z: 59, angle: 1.57, lanes: 8 },
      { x: -180, z: 35, angle: 0.0,  lanes: 8 },
      { x: -160, z: 11, angle: 1.57, lanes: 8 }
    ];

    const zebraGeos = [];
    const stripeW = 0.55;
    const stripeL = 3.6;
    const stripeGap = 0.45;

    crosswalkLocations.forEach(cw => {
      const startOffset = -((cw.lanes - 1) * (stripeW + stripeGap)) * 0.5;
      for (let s = 0; s < cw.lanes; s++) {
        const offset = startOffset + s * (stripeW + stripeGap);
        const stripe = new THREE.PlaneGeometry(stripeW, stripeL);
        stripe.rotateX(-Math.PI / 2);
        stripe.rotateY(cw.angle);

        const sx = cw.x + Math.cos(cw.angle) * offset;
        const sz = cw.z - Math.sin(cw.angle) * offset;
        stripe.translate(sx, 0.072, sz);
        zebraGeos.push(stripe);
      }
    });

    if (zebraGeos.length > 0) {
      const mergedZebra = BufferGeometryUtils.mergeGeometries(zebraGeos);
      const zebraMat = new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const zebraMesh = new THREE.Mesh(mergedZebra, zebraMat);
      this.subgroups.markings.add(zebraMesh);
    }
  }

  buildStreetLights(lightPositions) {
    if (!lightPositions || lightPositions.length === 0) return;

    const count = lightPositions.length;
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 6.5, 8);
    poleGeo.translate(0, 3.25, 0);

    const armGeo = new THREE.BoxGeometry(0.08, 0.08, 1.8);
    armGeo.translate(0, 6.4, 0.9);

    const headGeo = new THREE.BoxGeometry(0.25, 0.08, 0.5);
    headGeo.translate(0, 6.35, 1.7);

    const combinedFixture = BufferGeometryUtils.mergeGeometries([poleGeo, armGeo, headGeo]);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.8
    });

    const lightInst = new THREE.InstancedMesh(combinedFixture, poleMat, count);
    lightInst.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const lp = lightPositions[i];
      dummy.position.copy(lp.pos);
      dummy.rotation.set(0, lp.rotY, 0);
      dummy.updateMatrix();
      lightInst.setMatrixAt(i, dummy.matrix);
    }
    lightInst.instanceMatrix.needsUpdate = true;
    this.subgroups.lighting.add(lightInst);
  }
}
