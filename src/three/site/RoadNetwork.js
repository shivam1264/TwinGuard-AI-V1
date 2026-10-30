import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  PRIMARY_CAMPUS_ROADS,
  SECONDARY_CAMPUS_ROADS,
  SERVICE_EMERGENCY_ROADS,
  CAMPUS_ROUNDABOUTS
} from './CampusLayout.js';

// ============================================================================
// PROFESSIONAL CAMPUS ROAD NETWORK REBUILD (EXACT 3-CLASS HIERARCHY)
// ============================================================================
// Replaces procedural road demos with a believable, master-planned institutional
// circulation system:
// - Class A Primary Spine (Width = 8.5m, dark charcoal asphalt, subtle centerline)
// - Class B Secondary Roads (Width = 6.0m, connecting districts & parking)
// - Class C Service / Emergency Access (Width = 5.0m, discrete operations)
// - 2 Controlled Roundabouts (Central Distribution 40m + West Campus 28m)
// - Low-profile neutral concrete curbs (NO cartoon white outlines!)
// - Smooth transitions, generous radii, and full GIS metadata

export class RoadNetwork {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'Roads';
    this.group.userData = { id: 'ROADS-NETWORK', type: 'ROAD_NETWORK' };

    this.subgroups = {
      primary: new THREE.Group(),
      secondary: new THREE.Group(),
      service: new THREE.Group(),
      roundabouts: new THREE.Group(),
      curbs: new THREE.Group(),
      forecourt: new THREE.Group(),
      markings: new THREE.Group(),
      lighting: new THREE.Group()
    };

    this.subgroups.primary.name = 'ClassA_PrimaryRoads';
    this.subgroups.secondary.name = 'ClassB_SecondaryRoads';
    this.subgroups.service.name = 'ClassC_ServiceRoads';
    this.subgroups.roundabouts.name = 'CampusRoundabouts';
    this.subgroups.curbs.name = 'ConcreteCurbs';
    this.subgroups.forecourt.name = 'HeroForecourt';
    this.subgroups.markings.name = 'CrosswalksAndMarkings';
    this.subgroups.lighting.name = 'StreetLighting';

    this.group.add(this.subgroups.primary);
    this.group.add(this.subgroups.secondary);
    this.group.add(this.subgroups.service);
    this.group.add(this.subgroups.roundabouts);
    this.group.add(this.subgroups.curbs);
    this.group.add(this.subgroups.forecourt);
    this.group.add(this.subgroups.markings);
    this.group.add(this.subgroups.lighting);

    this.buildNetwork();
  }

  buildNetwork() {
    const curbGeometries = [];
    const streetLightPositions = [];

    // ------------------------------------------------------------------------
    // 1. CLASS A — PRIMARY CAMPUS ARTERIALS (Width = 8.5m)
    // ------------------------------------------------------------------------
    PRIMARY_CAMPUS_ROADS.forEach(roadDef => {
      const primaryMesh = this.createSplineRoadMesh(
        roadDef.points,
        roadDef.width,
        this.materials.primaryAsphaltMat,
        roadDef.roadId,
        roadDef.name,
        roadDef.roadClass,
        curbGeometries,
        streetLightPositions,
        34
      );
      this.subgroups.primary.add(primaryMesh);
    });

    // ------------------------------------------------------------------------
    // 2. CONTROLLED ROUNDABOUT JUNCTIONS (Central 40m + West 28m)
    // ------------------------------------------------------------------------
    this.buildRoundabouts(curbGeometries);

    // ------------------------------------------------------------------------
    // 3. HERO BUILDING FORECOURT ARRIVAL APRON
    // ------------------------------------------------------------------------
    this.buildHeroForecourt(curbGeometries);

    // ------------------------------------------------------------------------
    // 4. CLASS B — SECONDARY CAMPUS ROADS (Width = 6.0m)
    // ------------------------------------------------------------------------
    SECONDARY_CAMPUS_ROADS.forEach(roadDef => {
      const secMesh = this.createSplineRoadMesh(
        roadDef.points,
        roadDef.width,
        this.materials.secondaryAsphaltMat,
        roadDef.roadId,
        roadDef.name,
        roadDef.roadClass,
        curbGeometries,
        null,
        45
      );
      this.subgroups.secondary.add(secMesh);
    });

    // ------------------------------------------------------------------------
    // 5. CLASS C — SERVICE & EMERGENCY ACCESS ROADS (Width = 5.0m)
    // ------------------------------------------------------------------------
    SERVICE_EMERGENCY_ROADS.forEach(roadDef => {
      const servMesh = this.createSplineRoadMesh(
        roadDef.points,
        roadDef.width,
        this.materials.emergencyAsphaltMat,
        roadDef.roadId,
        roadDef.name,
        roadDef.roadClass,
        curbGeometries,
        null,
        50
      );
      servMesh.userData.isDedicatedEmergency = true;
      this.subgroups.service.add(servMesh);
    });

    // ------------------------------------------------------------------------
    // 6. MERGE ALL ROAD CURBS (High performance, low-profile concrete)
    // ------------------------------------------------------------------------
    if (curbGeometries.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(curbGeometries);
      const curbMesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      curbMesh.castShadow = true;
      curbMesh.receiveShadow = true;
      this.subgroups.curbs.add(curbMesh);
    }

    // ------------------------------------------------------------------------
    // 7. PEDESTRIAN ZEBRA CROSSWALKS
    // ------------------------------------------------------------------------
    this.buildCrosswalks();

    // ------------------------------------------------------------------------
    // 8. ARCHITECTURAL LED STREET LIGHTING
    // ------------------------------------------------------------------------
    this.buildStreetLights(streetLightPositions);
  }

  // Generates smooth CatmullRom spline road ribbons with low-profile curbs
  createSplineRoadMesh(
    points,
    width,
    material,
    roadId,
    name,
    roadClass,
    curbCollector,
    lightCollector,
    lightSpacing = 35
  ) {
    const v3Points = points.map(p => new THREE.Vector3(p.x, p.y || 0.02, p.z));
    const curve = new THREE.CatmullRomCurve3(v3Points, false, 'centripetal', 0.5);

    const length = curve.getLength();
    const segments = Math.max(36, Math.ceil(length / 2.5));

    const roadVerts = [];
    const roadUvs = [];
    const roadIndices = [];
    const roadNormals = [];

    const curbVerts = [];
    const curbIndices = [];
    const curbNormals = [];

    const halfW = width * 0.5;
    // Low-profile subtle concrete curb (0.26m wide, 0.04m above road surface)
    const curbW = 0.26;
    const roadY = 0.038;
    const curbTopY = 0.078;

    let accumulatedDist = 0;
    let prevPos = curve.getPoint(0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      if (i > 0) accumulatedDist += pt.distanceTo(prevPos);
      prevPos = pt.clone();

      // Road Surface Vertices
      const roadL = pt.clone().addScaledVector(normal, halfW);
      roadL.y = roadY;
      const roadR = pt.clone().addScaledVector(normal, -halfW);
      roadR.y = roadY;

      roadVerts.push(roadL.x, roadL.y, roadL.z);
      roadVerts.push(roadR.x, roadR.y, roadR.z);
      roadNormals.push(0, 1, 0, 0, 1, 0);

      const vY = accumulatedDist / width;
      roadUvs.push(0.0, vY, 1.0, vY);

      if (i < segments) {
        const row = i * 2;
        // Upward CCW winding (+Y normal)
        roadIndices.push(row, row + 2, row + 1);
        roadIndices.push(row + 1, row + 2, row + 3);
      }

      // Low-Profile Neutral Concrete Curbs
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

          // Left Curb (CCW upward)
          curbIndices.push(cRow, cNext, cRow + 1);
          curbIndices.push(cRow + 1, cNext, cNext + 1);

          // Right Curb (CCW upward)
          curbIndices.push(cRow + 2, cRow + 3, cNext + 2);
          curbIndices.push(cRow + 3, cNext + 3, cNext + 2);
        }
      }

      // Street light placement
      if (lightCollector && i % Math.max(8, Math.round(lightSpacing / 2.5)) === 0 && i > 0 && i < segments) {
        const side = (i % 2 === 0) ? 1 : -1;
        const polePos = pt.clone().addScaledVector(normal, side * (halfW + curbW + 0.9));
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
    roadMesh.receiveShadow = true;
    roadMesh.userData = {
      roadId,
      roadClass,
      name,
      width,
      isEmergencyAccessible: true
    };

    if (curbCollector && curbVerts.length > 0) {
      const cGeo = new THREE.BufferGeometry();
      cGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
      cGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
      cGeo.setIndex(curbIndices);
      curbCollector.push(cGeo);
    }

    return roadMesh;
  }

  // Builds properly proportioned roundabouts (Central 40m Circus + West 28m Circus)
  buildRoundabouts(curbCollector) {
    CAMPUS_ROUNDABOUTS.forEach(rb => {
      const center = rb.center;
      const or = rb.outerRadius;
      const ir = rb.innerRadius;
      const isr = rb.islandRadius;
      const roadY = 0.04;
      const curbY = 0.078;

      // 1. Circulating Asphalt Road Ring
      const ringGeo = new THREE.RingGeometry(ir, or, 64);
      ringGeo.rotateX(-Math.PI / 2);
      ringGeo.translate(center.x, roadY, center.z);
      const ringMesh = new THREE.Mesh(ringGeo, this.materials.plainAsphaltMat);
      ringMesh.receiveShadow = true;
      ringMesh.userData = { id: rb.id, type: 'ROUNDABOUT', name: rb.name, outerDiameter: rb.outerDiameter };
      this.subgroups.roundabouts.add(ringMesh);

      // 2. Outer Concrete Curb Ring
      const outerCurb = new THREE.RingGeometry(or, or + 0.28, 64);
      outerCurb.rotateX(-Math.PI / 2);
      outerCurb.translate(center.x, curbY, center.z);
      const outerCurbMesh = new THREE.Mesh(outerCurb, this.materials.curbMat);
      outerCurbMesh.receiveShadow = true;
      this.subgroups.roundabouts.add(outerCurbMesh);

      // 3. Inner Island Concrete Curb Ring
      const innerCurb = new THREE.RingGeometry(isr - 0.28, ir, 64);
      innerCurb.rotateX(-Math.PI / 2);
      innerCurb.translate(center.x, curbY, center.z);
      const innerCurbMesh = new THREE.Mesh(innerCurb, this.materials.curbMat);
      innerCurbMesh.receiveShadow = true;
      this.subgroups.roundabouts.add(innerCurbMesh);

      // 4. Central Landscaped Island (Manicured Green Lawn)
      const islandGeo = new THREE.CircleGeometry(isr - 0.28, 64);
      islandGeo.rotateX(-Math.PI / 2);
      islandGeo.translate(center.x, curbY - 0.005, center.z);
      const islandMesh = new THREE.Mesh(islandGeo, this.materials.courtyardTurfMat);
      islandMesh.receiveShadow = true;
      this.subgroups.roundabouts.add(islandMesh);

      // Centerpiece Feature
      if (rb.hasCenterpiece) {
        if (rb.id === 'ROUNDABOUT-CENTRAL-001') {
          // Central Circus Feature: Circular stone planter + specimen tree
          const planterGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.45, 32);
          const planterMesh = new THREE.Mesh(planterGeo, this.materials.curbMat);
          planterMesh.position.set(center.x, 0.22, center.z);
          planterMesh.castShadow = true;
          this.subgroups.roundabouts.add(planterMesh);

          const mulchGeo = new THREE.CircleGeometry(4.0, 32);
          mulchGeo.rotateX(-Math.PI / 2);
          mulchGeo.translate(center.x, 0.45, center.z);
          const mulchMesh = new THREE.Mesh(mulchGeo, this.materials.mulchMat);
          this.subgroups.roundabouts.add(mulchMesh);
        } else {
          // West Circus: Civic obelisk monument
          const pillarGeo = new THREE.CylinderGeometry(0.7, 1.1, 5.5, 8);
          const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.35,
            metalness: 0.8
          });
          const pillar = new THREE.Mesh(pillarGeo, pillarMat);
          pillar.position.set(center.x, 2.75, center.z);
          pillar.castShadow = true;
          this.subgroups.roundabouts.add(pillar);
        }
      }
    });
  }

  // Hero Building Forecourt Arrival Apron (connecting Central Circus to Hero Portico)
  buildHeroForecourt(curbCollector) {
    // Broad stone paved arrival forecourt (Width 44m, Depth 36m, Z = 46.0)
    const apronGeo = new THREE.PlaneGeometry(44.0, 36.0);
    apronGeo.rotateX(-Math.PI / 2);
    apronGeo.translate(0, 0.035, 46.0);
    const apronMesh = new THREE.Mesh(apronGeo, this.materials.plazaStoneMat);
    apronMesh.receiveShadow = true;
    this.subgroups.forecourt.add(apronMesh);

    // Lateral stone curbs
    const curbW = new THREE.BoxGeometry(0.35, 0.08, 36.0);
    curbW.translate(-22.0, 0.065, 46.0);
    const curbE = new THREE.BoxGeometry(0.35, 0.08, 36.0);
    curbE.translate(22.0, 0.065, 46.0);

    const mergedApronCurbs = BufferGeometryUtils.mergeGeometries([curbW, curbE]);
    const apronCurbsMesh = new THREE.Mesh(mergedApronCurbs, this.materials.curbMat);
    apronCurbsMesh.receiveShadow = true;
    this.subgroups.forecourt.add(apronCurbsMesh);
  }

  buildCrosswalks() {
    const crosswalkLocations = [
      { x: -10, z: 275, angle: 0, width: 8.5, length: 4.5 },
      { x: 0, z: 65, angle: 0, width: 9.0, length: 4.5 },
      { x: -35, z: 78, angle: 0.32, width: 7.5, length: 4.0 },
      { x: -136, z: 35, angle: 1.57, width: 7.5, length: 4.0 },
      { x: 20, z: 85, angle: 1.57, width: 7.0, length: 4.0 },
      { x: 75, z: 80, angle: -0.2, width: 6.5, length: 4.0 }
    ];

    const zebraGeometries = [];
    const stripeCount = 7;
    const stripeW = 0.5;
    const stripeSpacing = 0.9;

    crosswalkLocations.forEach(loc => {
      const rotY = loc.angle || 0;
      for (let s = 0; s < stripeCount; s++) {
        const offset = (s - (stripeCount - 1) * 0.5) * stripeSpacing;
        const stripeGeo = new THREE.PlaneGeometry(stripeW, loc.length);
        stripeGeo.rotateX(-Math.PI / 2);
        stripeGeo.rotateY(rotY);

        const cosA = Math.cos(rotY);
        const sinA = Math.sin(rotY);
        const posX = loc.x + offset * cosA;
        const posZ = loc.z - offset * sinA;
        stripeGeo.translate(posX, 0.046, posZ);
        zebraGeometries.push(stripeGeo);
      }
    });

    if (zebraGeometries.length > 0) {
      const mergedZebra = BufferGeometryUtils.mergeGeometries(zebraGeometries);
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xccd5e0 });
      const zebraMesh = new THREE.Mesh(mergedZebra, zebraMat);
      this.subgroups.markings.add(zebraMesh);
    }
  }

  buildStreetLights(lightPositions) {
    if (!lightPositions || lightPositions.length === 0) return;

    const count = lightPositions.length;
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.2, 8);
    poleGeo.translate(0, 3.1, 0);

    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 1.6);
    armGeo.translate(0, 6.1, 0.8);

    const headGeo = new THREE.BoxGeometry(0.35, 0.12, 0.65);
    headGeo.translate(0, 6.15, 1.45);

    const mergedLight = BufferGeometryUtils.mergeGeometries([poleGeo, armGeo, headGeo]);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.8
    });

    const instMesh = new THREE.InstancedMesh(mergedLight, lightMat, count);
    instMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const lp = lightPositions[i];
      dummy.position.copy(lp.pos);
      dummy.rotation.y = lp.rotY;
      dummy.updateMatrix();
      instMesh.setMatrixAt(i, dummy.matrix);
    }

    instMesh.instanceMatrix.needsUpdate = true;
    this.subgroups.lighting.add(instMesh);
  }
}
