import * as THREE from 'three';
import { getRoomSeatingSpots } from '../simulation/Doorways.js';

function phasedDelayPolicy(delayTimer) {
  if (delayTimer <= 0) return null;
  if (delayTimer <= 2) return 'FIRE_FLOOR';
  if (delayTimer <= 6) return 'ADJACENT_FLOOR';
  return 'SHELTERED_FLOOR';
}

export class AgentCrowd {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.instancedCrowdMeshes = [];
    this.instancedCrowdRecords = [];
    this._instancedParentInverse = new THREE.Matrix4();
    this._instancedLocalMatrix = new THREE.Matrix4();
    this._hiddenInstanceMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

    this.agents = [];
    this.floorMode = 'ALL';
    this.floorHeight = 3.8; // Realistic commercial ceiling height

    // Phased evacuation delay state
    this.phasedEvacuationDelays = new Map(); // agentId -> remaining delay seconds

    // === Stylized Realistic Human Geometries (Pre-Allocated Shared Pool) ===

    // 1. Anatomical Head with Jawline & Chin
    this.headGeo = new THREE.BoxGeometry(0.14, 0.17, 0.16);
    this.neckGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.08, 12);
    this.noseGeo = new THREE.BoxGeometry(0.022, 0.045, 0.03);
    this.earGeo = new THREE.BoxGeometry(0.02, 0.04, 0.025);

    // 2. Distinct Hairstyle Meshes
    // Style A: Classic Executive Crop / Side Part
    this.hairStyleA = new THREE.BoxGeometry(0.152, 0.08, 0.172);
    // Style B: Textured Modern Cut / Waves
    this.hairStyleB = new THREE.BoxGeometry(0.155, 0.09, 0.175);
    // Style C: Swept-Back Tied Hair / Rear Bun
    const bunMain = new THREE.BoxGeometry(0.15, 0.08, 0.165);
    const bunKnot = new THREE.SphereGeometry(0.045, 8, 8);
    bunKnot.translate(0, 0.02, -0.09);
    this.hairStyleC = bunMain; // Reused with knot attached
    this.hairKnotGeo = bunKnot;
    // Style D: Professional Shoulder-Length Bob
    this.hairStyleD = new THREE.BoxGeometry(0.16, 0.14, 0.175);

    // 3. Tapered Natural Torso & Attire
    this.chestGeo = new THREE.BoxGeometry(0.38, 0.30, 0.21);
    this.waistGeo = new THREE.BoxGeometry(0.33, 0.18, 0.19);
    this.collarGeo = new THREE.BoxGeometry(0.20, 0.06, 0.14);
    this.badgeGeo = new THREE.BoxGeometry(0.065, 0.085, 0.015);
    this.tieGeo = new THREE.BoxGeometry(0.05, 0.22, 0.02);

    // 4. Articulated Arms (Shoulder Cap, Upper Arm, Forearm, Hand)
    this.shoulderGeo = new THREE.SphereGeometry(0.06, 8, 8);
    this.upperArmGeo = new THREE.BoxGeometry(0.08, 0.22, 0.08);
    this.forearmGeo = new THREE.BoxGeometry(0.07, 0.20, 0.07);
    this.handGeo = new THREE.BoxGeometry(0.055, 0.09, 0.035);

    // 5. Articulated Legs (Pelvis, Thigh, Calf with Knee, Contoured Shoe)
    this.pelvisGeo = new THREE.BoxGeometry(0.34, 0.14, 0.20);
    this.thighGeo = new THREE.BoxGeometry(0.125, 0.36, 0.135);
    this.kneeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    this.calfGeo = new THREE.BoxGeometry(0.11, 0.34, 0.115);
    this.shoeGeo = new THREE.BoxGeometry(0.11, 0.075, 0.24);

    // Indicators
    this.shadowGeo = new THREE.CircleGeometry(0.32, 16);
    this.beaconGeo = new THREE.SphereGeometry(0.08, 8, 8);

    // === Diverse Realistic Human Materials (Pre-Allocated Shader Pool) ===

    // Realistic Diverse Skin Palette (Warm natural tones, balanced roughness)
    this.skinColors = [
      0xf5d6c6, // Fair warm
      0xebbc9e, // Peach beige
      0xd49b72, // Golden tan
      0xa86e48, // Warm bronze
      0x6b4226, // Rich mahogany
      0x4a2c1b  // Deep espresso
    ];

    // Natural Hair Shades
    this.hairColors = [
      0x141414, // Jet black
      0x241d1a, // Dark charcoal
      0x382418, // Espresso brown
      0x4a3222, // Chestnut
      0x5c4028, // Brunette
      0x4b4b4b  // Slate gray
    ];

    // Executive & Corporate Shirt / Blouse Fabrics
    this.shirtColors = [
      0xf8fafc, // Crisp white
      0xdbeafe, // Soft sky blue
      0x94a3b8, // French slate
      0x334155, // Oxford charcoal
      0x1e3a5f, // Muted navy
      0x475569  // Graphite
    ];

    // Tailored Trousers / Slacks
    this.pantsColors = [
      0x090d16, // Obsidian black
      0x1e293b, // Slate navy
      0x334155, // Charcoal
      0x475569, // Slate gray
      0x6b533d  // Camel khaki
    ];

    // Professional Shoes
    this.shoeColors = [
      0x0f172a, // Onyx leather
      0x241711, // Dark espresso leather
      0x2b131c  // Deep cordovan
    ];

    this.skinMats = this.skinColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, metalness: 0.05 }));
    this.hairMats = this.hairColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.05 }));
    this.shirtMats = this.shirtColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.08 }));
    this.pantsMats = this.pantsColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65, metalness: 0.05 }));
    this.shoeMats = this.shoeColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.15 }));

    this.collarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    this.tieMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
    this.badgeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 });

    this.pathLinesGroup = new THREE.Group();
    this.scene.add(this.pathLinesGroup);
    this.routeLines = new Map(); // agentId -> { line, path, exitId }
    this._routeMaterialsMap = new Map();
    this.pendingRouteLineIds = [];
    this.pendingRouteLineIdSet = new Set();
    this.cachedStats = null;
  }

  _getRouteMaterial(colorHex) {
    if (!this._routeMaterialsMap) this._routeMaterialsMap = new Map();
    const key = colorHex || "#00f0ff";
    if (!this._routeMaterialsMap.has(key)) {
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(key),
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      mat.userData = { isShared: true };
      this._routeMaterialsMap.set(key, mat);
    }
    return this._routeMaterialsMap.get(key);
  }

  warmUpRouteMaterials() {
    return ["#00ff88", "#00f0ff", "#9d4edd"].map((color) => this._getRouteMaterial(color));
  }

  spawnAgentsForRooms(rooms) {
    this.cachedStats = null;
    this.clear();
    let idCounter = 1;

    rooms.forEach(room => {
      const count = room.peopleCount || 0;
      const floor = room.floor || 1;
      const floorBaseY = (floor - 1) * this.floorHeight;

      const rNumMatch = room.id ? room.id.match(/_r(\d+)$/) : null;
      const roomIdx = rNumMatch ? parseInt(rNumMatch[1], 10) - 1 : 0;
      const spots = getRoomSeatingSpots(floor, roomIdx, room.center.x, room.center.z);

      for (let i = 0; i < count; i++) {
        const spot = spots[i % spots.length];
        const x = spot.x;
        const z = spot.z;
        const y = floorBaseY + 0.175; // Finished Floor Level (FFL) flush with top of slab

        this.createAgent({
          id: `agent_${idCounter++}`,
          roomId: room.id,
          roomName: room.name,
          floor,
          x,
          y,
          z,
          facingRot: spot.rotY,
          isSeated: spot.isSeated,
          state: 'IDLE'
        });
      }
    });

    if (this.floorMode && this.floorMode !== 'ALL') {
      this.setFloorMode(this.floorMode);
    }

    this._buildInstancedCrowd();

    return this.agents;
  }

  createAgent(data) {
    const agentGroup = new THREE.Group();
    agentGroup.position.set(data.x, data.y, data.z);

    const skinMat = this.skinMats[Math.floor(Math.random() * this.skinMats.length)];
    const hairMat = this.hairMats[Math.floor(Math.random() * this.hairMats.length)];
    const shirtMat = this.shirtMats[Math.floor(Math.random() * this.shirtMats.length)];
    const pantsMat = this.pantsMats[Math.floor(Math.random() * this.pantsMats.length)];
    const shoeMat = this.shoeMats[Math.floor(Math.random() * this.shoeMats.length)];
    const hairStyleIdx = Math.floor(Math.random() * 4);

    // 1. Soft Elliptical Ground Ambient Shadow
    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005; // 5mm above finished floor level
    agentGroup.add(shadow);

    // 2. Articulated Legs (Pelvis -> Thigh -> Knee Pivot -> Calf -> Contoured Shoe)
    // Left Leg
    const leftHipPivot = new THREE.Group();
    leftHipPivot.position.set(-0.11, 0.7375, 0); // Shoe soles flush with ground level (0.7375 - 0.36 - 0.34 - 0.0375 = 0.000)

    const leftThighMesh = new THREE.Mesh(this.thighGeo, pantsMat);
    leftThighMesh.position.y = -0.18;
    leftHipPivot.add(leftThighMesh);

    const leftKneePivot = new THREE.Group();
    leftKneePivot.position.set(0, -0.36, 0);

    const leftKneeCap = new THREE.Mesh(this.kneeGeo, pantsMat);
    leftKneePivot.add(leftKneeCap);

    const leftCalfMesh = new THREE.Mesh(this.calfGeo, pantsMat);
    leftCalfMesh.position.y = -0.17;
    leftKneePivot.add(leftCalfMesh);

    const leftShoe = new THREE.Mesh(this.shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.34, 0.05);
    leftKneePivot.add(leftShoe);

    leftHipPivot.add(leftKneePivot);
    agentGroup.add(leftHipPivot);

    // Right Leg
    const rightHipPivot = new THREE.Group();
    rightHipPivot.position.set(0.11, 0.7375, 0);

    const rightThighMesh = new THREE.Mesh(this.thighGeo, pantsMat);
    rightThighMesh.position.y = -0.18;
    rightHipPivot.add(rightThighMesh);

    const rightKneePivot = new THREE.Group();
    rightKneePivot.position.set(0, -0.36, 0);

    const rightKneeCap = new THREE.Mesh(this.kneeGeo, pantsMat);
    rightKneePivot.add(rightKneeCap);

    const rightCalfMesh = new THREE.Mesh(this.calfGeo, pantsMat);
    rightCalfMesh.position.y = -0.17;
    rightKneePivot.add(rightCalfMesh);

    const rightShoe = new THREE.Mesh(this.shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.34, 0.05);
    rightKneePivot.add(rightShoe);

    rightHipPivot.add(rightKneePivot);
    agentGroup.add(rightHipPivot);

    // 3. Tapered Torso (Pelvis, Waist, Chest, Collar, ID Badge)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.7375, 0);

    const pelvis = new THREE.Mesh(this.pelvisGeo, pantsMat);
    pelvis.position.y = 0.07;
    torsoGroup.add(pelvis);

    const waist = new THREE.Mesh(this.waistGeo, shirtMat);
    waist.position.y = 0.22;
    torsoGroup.add(waist);

    const chest = new THREE.Mesh(this.chestGeo, shirtMat);
    chest.position.y = 0.44;
    torsoGroup.add(chest);

    const collar = new THREE.Mesh(this.collarGeo, this.collarMat);
    collar.position.set(0, 0.58, 0.02);
    torsoGroup.add(collar);

    const idBadge = new THREE.Mesh(this.badgeGeo, this.badgeMat);
    idBadge.position.set(0.07, 0.42, 0.115);
    torsoGroup.add(idBadge);

    agentGroup.add(torsoGroup);

    // 4. Articulated Arms (Shoulder Pivot -> Upper Arm -> Elbow Pivot -> Forearm -> Hand)
    // Left Arm
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.23, 1.2775, 0);

    const leftShoulder = new THREE.Mesh(this.shoulderGeo, shirtMat);
    leftArmPivot.add(leftShoulder);

    const leftUpperArm = new THREE.Mesh(this.upperArmGeo, shirtMat);
    leftUpperArm.position.y = -0.11;
    leftArmPivot.add(leftUpperArm);

    const leftElbowPivot = new THREE.Group();
    leftElbowPivot.position.set(0, -0.22, 0);

    const leftForearm = new THREE.Mesh(this.forearmGeo, shirtMat);
    leftForearm.position.y = -0.10;
    leftElbowPivot.add(leftForearm);

    const leftHand = new THREE.Mesh(this.handGeo, skinMat);
    leftHand.position.set(0, -0.23, 0.01);
    leftElbowPivot.add(leftHand);

    leftArmPivot.add(leftElbowPivot);
    agentGroup.add(leftArmPivot);

    // Right Arm
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.23, 1.2775, 0);

    const rightShoulder = new THREE.Mesh(this.shoulderGeo, shirtMat);
    rightArmPivot.add(rightShoulder);

    const rightUpperArm = new THREE.Mesh(this.upperArmGeo, shirtMat);
    rightUpperArm.position.y = -0.11;
    rightArmPivot.add(rightUpperArm);

    const rightElbowPivot = new THREE.Group();
    rightElbowPivot.position.set(0, -0.22, 0);

    const rightForearm = new THREE.Mesh(this.forearmGeo, shirtMat);
    rightForearm.position.y = -0.10;
    rightElbowPivot.add(rightForearm);

    const rightHand = new THREE.Mesh(this.handGeo, skinMat);
    rightHand.position.set(0, -0.23, 0.01);
    rightElbowPivot.add(rightHand);

    rightArmPivot.add(rightElbowPivot);
    agentGroup.add(rightArmPivot);

    // 5. Anatomical Head, Neck, Nose, Ears & Hairstyle
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.3575, 0);

    const neck = new THREE.Mesh(this.neckGeo, skinMat);
    neck.position.y = 0.04;
    headGroup.add(neck);

    const headMesh = new THREE.Mesh(this.headGeo, skinMat);
    headMesh.position.y = 0.16;
    headGroup.add(headMesh);

    const nose = new THREE.Mesh(this.noseGeo, skinMat);
    nose.position.set(0, 0.16, 0.095);
    headGroup.add(nose);

    const leftEar = new THREE.Mesh(this.earGeo, skinMat);
    leftEar.position.set(-0.075, 0.16, -0.01);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(this.earGeo, skinMat);
    rightEar.position.set(0.075, 0.16, -0.01);
    headGroup.add(rightEar);

    // Distinct Hairstyle Selection
    let hairGeo = this.hairStyleA;
    if (hairStyleIdx === 1) hairGeo = this.hairStyleB;
    else if (hairStyleIdx === 2) hairGeo = this.hairStyleC;
    else if (hairStyleIdx === 3) hairGeo = this.hairStyleD;

    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.22, -0.01);
    headGroup.add(hair);

    if (hairStyleIdx === 2) {
      const knot = new THREE.Mesh(this.hairKnotGeo, hairMat);
      knot.position.set(0, 0.20, 0);
      headGroup.add(knot);
    }

    agentGroup.add(headGroup);

    // 6. Minimalist Beacon (Disabled for realistic appearance)
    const beacon = new THREE.Mesh(this.beaconGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    beacon.position.y = 1.95;
    beacon.visible = false;
    agentGroup.add(beacon);

    // Apply Facing Rotation
    if (data.facingRot !== undefined) {
      agentGroup.rotation.y = data.facingRot;
    }

    // 7. Authentic Seated Posture (Articulated knees 90 deg down, thighs flat, hands on desk)
    if (data.isSeated) {
      // Pelvis sits comfortably on chair cushion (0.44 m seat height above floor)
      torsoGroup.position.y = 0.44;
      leftHipPivot.position.y = 0.44;
      rightHipPivot.position.y = 0.44;

      // Thighs extend horizontally forward onto chair
      leftHipPivot.rotation.x = -Math.PI / 2;
      rightHipPivot.rotation.x = -Math.PI / 2;

      // Knees bend 90 degrees straight down toward floor
      leftKneePivot.rotation.x = Math.PI / 2;
      rightKneePivot.rotation.x = Math.PI / 2;

      // Lower arms approach desk keyboard plane (0.74m desk height above floor)
      leftArmPivot.position.y = 0.86;
      rightArmPivot.position.y = 0.86;
      leftArmPivot.rotation.x = -0.45;
      rightArmPivot.rotation.x = -0.45;
      leftElbowPivot.rotation.x = -0.65;
      rightElbowPivot.rotation.x = -0.65;

      // Head inclined naturally toward computer monitor
      headGroup.position.y = 0.95;
      headGroup.rotation.x = 0.12;
    }

    this.group.add(agentGroup);

    const agent = {
      id: data.id,
      floor: data.floor,
      mesh: agentGroup,
      leftLeg: leftHipPivot,
      rightLeg: rightHipPivot,
      leftKnee: leftKneePivot,
      rightKnee: rightKneePivot,
      leftArm: leftArmPivot,
      rightArm: rightArmPivot,
      leftElbow: leftElbowPivot,
      rightElbow: rightElbowPivot,
      torso: torsoGroup,
      headGroup,
      beacon,
      shirtMat,
      x: data.x,
      y: data.y,
      z: data.z,
      state: data.state,
      isSeated: !!data.isSeated,
      speed: 3.2 + Math.random() * 0.6,
      animCycle: Math.random() * Math.PI * 2,
      path: [],
      currentWaypointIdx: 0,
      assignedExitColor: null,
      roomId: data.roomId,
      delayTimer: data.delayTimer || 0,
      originalDelayTimer: data.delayTimer || 0,
      phasedDelayPolicy: null
    };

    this.agents.push(agent);
    return agent;
  }

  _buildInstancedCrowd() {
    if (!this.agents.length || !THREE.InstancedMesh) return;

    const buckets = new Map();
    // Refresh only the parent world transform here; each agent subtree is
    // updated once below. Recursing the full group first and then updating
    // every agent again duplicated thousands of matrix operations.
    this.group.updateWorldMatrix(true, false);

    this.agents.forEach((agent) => {
      agent.mesh.updateMatrixWorld(true);
      agent.mesh.traverse((object) => {
        // Keep transparent ground shadows individually sorted. Batch the body
        // parts by their existing geometry/material so the rendered characters
        // retain the same articulated shape and palette.
        if (!object.isMesh || !object.visible || object.geometry === this.shadowGeo) return;
        if (Array.isArray(object.material)) return;

        const key = `${object.geometry.uuid}:${object.material.uuid}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { geometry: object.geometry, material: object.material, entries: [] };
          buckets.set(key, bucket);
        }
        bucket.entries.push({ agent, source: object });
      });
    });

    for (const bucket of buckets.values()) {
      const batch = new THREE.InstancedMesh(bucket.geometry, bucket.material, bucket.entries.length);
      batch.name = 'articulated-crowd-batch';
      batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      batch.frustumCulled = false;
      batch.count = bucket.entries.length;
      this.group.add(batch);

      bucket.entries.forEach(({ agent, source }, instanceId) => {
        source.userData.crowdBatchSourceVisible = source.visible;
        source.visible = false;
        this.instancedCrowdRecords.push({ agent, source, batch, instanceId });
      });
      this.instancedCrowdMeshes.push(batch);
    }

    this._syncInstancedCrowd();
  }

  _syncInstancedCrowd() {
    if (!this.instancedCrowdRecords.length) return;

    // The agent subtree update below refreshes all source part matrices. A
    // recursive group update here would traverse the same articulated meshes
    // once more on every simulation frame.
    this.group.updateWorldMatrix(true, false);
    this.agents.forEach((agent) => agent.mesh.updateMatrixWorld(true));
    this._instancedParentInverse.copy(this.group.matrixWorld).invert();

    for (const { agent, source, batch, instanceId } of this.instancedCrowdRecords) {
      if (agent.mesh.visible && source.userData.crowdBatchSourceVisible !== false) {
        this._instancedLocalMatrix.multiplyMatrices(this._instancedParentInverse, source.matrixWorld);
        batch.setMatrixAt(instanceId, this._instancedLocalMatrix);
      } else {
        batch.setMatrixAt(instanceId, this._hiddenInstanceMatrix);
      }
    }

    this.instancedCrowdMeshes.forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
  }

  standUpAgent(agent) {
    if (!agent.isSeated) return;
    agent.isSeated = false;

    // Restore Full Standing Alignment
    agent.leftLeg.position.y = 0.86;
    agent.rightLeg.position.y = 0.86;
    agent.leftLeg.rotation.x = 0;
    agent.rightLeg.rotation.x = 0;
    agent.leftKnee.rotation.x = 0;
    agent.rightKnee.rotation.x = 0;

    agent.torso.position.y = 0.86;
    agent.headGroup.position.y = 1.48;
    agent.headGroup.rotation.x = 0;

    agent.leftArm.position.y = 1.40;
    agent.rightArm.position.y = 1.40;
    agent.leftArm.rotation.x = 0;
    agent.rightArm.rotation.x = 0;
    agent.leftElbow.rotation.x = 0;
    agent.rightElbow.rotation.x = 0;
  }

  assignRoutes(assignments, { deferRouteLines = false } = {}) {
    const assignmentMap = new Map();
    assignments.forEach(a => assignmentMap.set(a.agentId, a));

    this.agents.forEach(agent => {
      const assignment = assignmentMap.get(agent.id);
      if (assignment) {
        this.standUpAgent(agent);
        const newPath = assignment.path || [];
        const isEvacuating = agent.state === 'EVACUATING' && agent.path && agent.path.length > 0;

        if (isEvacuating) {
          // If already actively evacuating: do NOT reset waypoint index back to 0 (which causes
          // the agent to turn around and walk back into the room).
          const exitUnchanged = agent.currentExitId === assignment.exitId;
          if (exitUnchanged) {
            // Unchanged exit: preserve forward progress
            if (newPath.length >= agent.path.length) {
              agent.path = newPath;
            }
          } else {
            // Rerouted to different exit: pick nearest forward waypoint so agent steers smoothly forward
            let bestIdx = -1;
            let minDistSq = Infinity;
            const isAtGround = agent.y <= 0.45;
            const maxAllowedY = isAtGround ? 0.35 : (agent.y + 0.2);

            for (let i = 0; i < newPath.length; i++) {
              const pt = newPath[i];
              if (pt.y <= maxAllowedY) {
                const dSq = (pt.x - agent.x) ** 2 + (pt.y - agent.y) ** 2 + (pt.z - agent.z) ** 2;
                if (dSq < minDistSq) {
                  minDistSq = dSq;
                  bestIdx = i;
                }
              }
            }
            if (bestIdx === -1) {
              bestIdx = Math.max(0, newPath.length - 1);
            }
            agent.path = newPath;
            agent.currentWaypointIdx = bestIdx;
          }
        } else {
          // Initial assignment or waiting agent starting from desk
          agent.path = newPath;
          agent.currentWaypointIdx = 0;
        }

        const delayTimer = assignment.delayTimer || 0;
        const nextDelayPolicy = phasedDelayPolicy(delayTimer);
        const sameWaitingAssignment = agent.state === 'WAITING'
          && delayTimer > 0
          && agent.currentExitId === assignment.exitId
          && agent.phasedDelayPolicy === nextDelayPolicy;
        const alreadyAssigned = agent.currentExitId != null;
        const preserveActiveEvacuation = agent.state === 'EVACUATING' && alreadyAssigned;

        if (agent.state !== 'SAFE' && !preserveActiveEvacuation && !sameWaitingAssignment) {
          agent.delayTimer = delayTimer;
          agent.originalDelayTimer = delayTimer;
          agent.state = delayTimer > 0 ? 'WAITING' : 'EVACUATING';
        }
        agent.phasedDelayPolicy = nextDelayPolicy;
        agent.assignedExitColor = assignment.exitColor;
        // Store current exit and route condition for urgent reevaluation checks
        agent.currentExitId = assignment.exitId;
        agent.currentRouteCondition = assignment.routeCondition;

        agent.beacon.material.color = new THREE.Color(0xff5500);
        agent.shirtMat.emissive = new THREE.Color(0xff3300);
        agent.shirtMat.emissiveIntensity = 0.35;
      }
    });

    if (deferRouteLines) this.queueRouteLineBuilds(assignmentMap.keys());
    else this.syncRouteLines();
  }

  queueRouteLineBuilds(agentIds = this.agents.map((agent) => agent.id)) {
    for (const agentId of agentIds) {
      if (this.pendingRouteLineIdSet.has(agentId)) continue;
      const agent = this.agents.find((item) => item.id === agentId);
      if (!agent) continue;
      if (agent.state === 'EVACUATING' && Array.isArray(agent.path) && agent.path.length > 1) {
        this.pendingRouteLineIds.push(agent.id);
        this.pendingRouteLineIdSet.add(agent.id);
      }
    }
  }

  processRouteLineBuilds(maxCount = 12) {
    let processed = 0;
    while (this.pendingRouteLineIds.length && processed < maxCount) {
      const agentId = this.pendingRouteLineIds.shift();
      this.pendingRouteLineIdSet.delete(agentId);
      const agent = this.agents.find((item) => item.id === agentId);
      const isActive = agent && agent.state === 'EVACUATING' && Array.isArray(agent.path) && agent.path.length > 1;
      const entry = this.routeLines.get(agentId);
      if (!isActive) {
        if (entry) {
          this._disposeRouteEntry(entry);
          this.routeLines.delete(agentId);
        }
        processed++;
        continue;
      }

      const needsRebuild = !entry || entry.path !== agent.path || entry.exitId !== agent.currentExitId;
      if (needsRebuild) {
        if (entry) this._disposeRouteEntry(entry);
        this.routeLines.set(agentId, this._createRouteEntry(agent, agent.path));
      }
      processed++;
    }
    this.pathLinesGroup.visible = true;
    return this.pendingRouteLineIds.length > 0;
  }

  /**
   * Create, update, or remove the per-agent route line so it always matches the
   * agent's current EVACUATING state, assigned exit, and path. Rebuilds only
   * when the path reference or exit changes.
   */
  syncRouteLines() {
    if (!this.pathLinesGroup) return;

    const isSingleFloor = this.floorMode && this.floorMode !== 'ALL' && this.floorMode !== 'EXPLODED';
    const targetFloor = isSingleFloor ? parseInt(this.floorMode, 10) : null;
    const activeIds = new Set();

    for (const agent of this.agents) {
      const path = agent.path;
      const isActive = agent.state === 'EVACUATING' && Array.isArray(path) && path.length > 1;
      if (!isActive) continue;

      activeIds.add(agent.id);
      let entry = this.routeLines.get(agent.id);
      const needsRebuild = !entry || entry.path !== path || entry.exitId !== agent.currentExitId;

      if (needsRebuild) {
        if (entry) this._disposeRouteEntry(entry);
        entry = this._createRouteEntry(agent, path);
        this.routeLines.set(agent.id, entry);
      }

      entry.line.visible = !isSingleFloor || Number(agent.floor) === targetFloor;
    }

    for (const [agentId, entry] of this.routeLines) {
      if (!activeIds.has(agentId)) {
        this._disposeRouteEntry(entry);
        this.routeLines.delete(agentId);
      }
    }

    this.pathLinesGroup.visible = true;
  }

  rerouteAgents(assignments) {
    const assignmentMap = new Map();
    assignments.forEach(a => assignmentMap.set(a.agentId, a));

    this.agents.forEach(agent => {
      if (agent.state === 'SAFE' || agent.isEvacuated) return;

      const assignment = assignmentMap.get(agent.id);
      if (!assignment || !assignment.path || assignment.path.length === 0) return;

      if (agent.state === 'IDLE') {
        this.standUpAgent(agent);
        agent.path = assignment.path;
        agent.currentWaypointIdx = 0;
        agent.state = 'EVACUATING';
        agent.assignedExitColor = assignment.exitColor;
      } else if (agent.state === 'EVACUATING') {
        // Find nearest forward waypoint on same or lower altitude (unidirectional downward flow)
        const newPath = assignment.path;
        let bestIdx = -1;
        let minDistSq = Infinity;
        const isAtGround = agent.y <= 0.45;
        const maxAllowedY = isAtGround ? 0.35 : (agent.y + 0.2);

        for (let i = 0; i < newPath.length; i++) {
          const pt = newPath[i];
          if (pt.y <= maxAllowedY) {
            const dSq = (pt.x - agent.x) ** 2 + (pt.y - agent.y) ** 2 + (pt.z - agent.z) ** 2;
            if (dSq < minDistSq) {
              minDistSq = dSq;
              bestIdx = i;
            }
          }
        }
        if (bestIdx === -1) {
          bestIdx = Math.max(0, newPath.length - 1);
        } else if (bestIdx < newPath.length - 1 && minDistSq < 1.0) {
          bestIdx++;
        }
        agent.path = newPath;
        agent.currentWaypointIdx = bestIdx;
        agent.assignedExitColor = assignment.exitColor;

        // ── REROUTE VISUALIZATION: stop & turn toward the new route ──
        // Detect a major direction reversal (e.g. West Core path invalidated
        // by structural debris → the agent visibly turns around toward the
        // alternative East Core B, then resumes — never teleported).
        const turnTarget = newPath[bestIdx];
        if (turnTarget && agent.mesh) {
          const tdx = turnTarget.x - agent.x;
          const tdz = turnTarget.z - agent.z;
          if (tdx * tdx + tdz * tdz > 0.04) {
            const desiredAngle = Math.atan2(tdx, tdz);
            let angleDiff = desiredAngle - agent.mesh.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) > 1.9) {
              agent.reroutePause = 0.7; // brief halt while turning in place
              agent.rerouteTurnTarget = desiredAngle;
              agent.rerouteCount = (agent.rerouteCount || 0) + 1;
            }
          }
        }
      }
    });
  }

  _createRouteEntry(agent, path) {
    const points = path.map(p => new THREE.Vector3(p.x, (p.y ?? 0) + 0.12, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = this._getRouteMaterial(agent.assignedExitColor);
    const line = new THREE.Line(geometry, material);
    line.userData = {
      agentId: agent.id,
      exitId: agent.currentExitId || null,
      floor: agent.floor || 1
    };
    this.pathLinesGroup.add(line);

    return { line, path, exitId: agent.currentExitId || null };
  }

  _disposeRouteEntry(entry) {
    const line = entry.line;
    if (line.parent) line.parent.remove(line);
    if (line.geometry) line.geometry.dispose();
    if (line.material && !line.material.userData?.isShared) line.material.dispose();
  }

  update(delta, simSpeed = 1.0) {
    if (simSpeed === 0) {
      if (this.cachedStats) return this.cachedStats;
      let safeCount = 0;
      for (let i = 0; i < this.agents.length; i++) {
        if (this.agents[i].state === 'SAFE') safeCount++;
      }
      this.cachedStats = {
        total: this.agents.length,
        evacuated: safeCount,
        inTransit: this.agents.length - safeCount,
        isCompleted: safeCount === this.agents.length && this.agents.length > 0
      };
      return this.cachedStats;
    }

    this.cachedStats = null;
    const effectiveDelta = delta * simSpeed;
    let evacuatedCount = 0;
    const activeFires = this.getActiveFireList();

    const isSingleFloor = this.floorMode && this.floorMode !== 'ALL' && this.floorMode !== 'EXPLODED';
    const targetFloorNum = isSingleFloor ? parseInt(this.floorMode, 10) : null;

    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];

      if (isSingleFloor && Number(agent.floor) !== targetFloorNum) {
        agent.mesh.visible = false;
        continue;
      }

      if (agent.state === 'SAFE') {
        evacuatedCount++;
        agent.mesh.visible = true;
        agent.mesh.position.set(agent.x, 0.15, agent.z);
        agent.leftLeg.rotation.x = 0;
        agent.rightLeg.rotation.x = 0;
        agent.leftKnee.rotation.x = 0;
        agent.rightKnee.rotation.x = 0;
        agent.leftArm.rotation.x = 0;
        agent.rightArm.rotation.x = 0;
        agent.leftElbow.rotation.x = 0;
        agent.rightElbow.rotation.x = 0;
        agent.torso.position.y = 0.86;
        agent.headGroup.position.y = 1.48;
        continue;
      }

      // Handle phased evacuation waiting state
      if (agent.state === 'WAITING') {
        // Decrement delay timer
        agent.delayTimer = Math.max(0, agent.delayTimer - effectiveDelta);
        // Check if waiting zone has become dangerous (emergency override)
        if (this.isWaitingZoneDangerous(agent)) {
          // Emergency override - start evacuating immediately
          agent.delayTimer = 0;
          agent.state = 'EVACUATING';
        } else if (agent.delayTimer <= 0) {
          // Delay expired, start evacuating
          agent.state = 'EVACUATING';
        }
        // Keep agent visible but in waiting state
        if (isSingleFloor && Number(agent.floor) !== targetFloorNum) {
          agent.mesh.visible = false;
        } else {
          agent.mesh.visible = true;
        }
        continue;
      }

      if (agent.state === 'IDLE') {
        continue;
      }

      // Evacuating Human Locomotion
      if (agent.state === 'EVACUATING' && agent.path.length > 0) {
        // Dynamically track agent's active floor level as they descend
        agent.floor = Math.max(1, Math.floor((agent.y + 0.5) / this.floorHeight) + 1);

        if (agent.isSeated) {
          this.standUpAgent(agent);
        }

        // Live Dynamic Fire Avoidance: if fire is in front of or directly on agent's path, avoid and reroute immediately
        if (this.checkAndAvoidFire(agent, activeFires)) {
          continue;
        }

        const targetWaypoint = agent.path[agent.currentWaypointIdx];

        if (targetWaypoint) {
          const dx = targetWaypoint.x - agent.x;
          const dy = targetWaypoint.y - agent.y;
          const dz = targetWaypoint.z - agent.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          const distH_Sq = dx * dx + dz * dz;
          if (distH_Sq > 0.0025) {
            agent.mesh.rotation.y = Math.atan2(dx, dz);
          }

          if (agent.reroutePause > 0) {
            agent.reroutePause -= effectiveDelta;
            if (agent.mesh && agent.rerouteTurnTarget !== undefined) {
              let turnDiff = agent.rerouteTurnTarget - agent.mesh.rotation.y;
              while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
              while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
              agent.mesh.rotation.y += turnDiff * Math.min(1.0, effectiveDelta * 5.5);
            }
            agent.leftLeg.rotation.x *= 0.8;
            agent.rightLeg.rotation.x *= 0.8;
            agent.leftKnee.rotation.x *= 0.8;
            agent.rightKnee.rotation.x *= 0.8;
            agent.leftArm.rotation.x *= 0.8;
            agent.rightArm.rotation.x *= 0.8;
            agent.torso.position.y += (0.86 - agent.torso.position.y) * 0.2;
            agent.headGroup.position.y += (1.48 - agent.headGroup.position.y) * 0.2;
            continue;
          }

          agent.animCycle += effectiveDelta * agent.speed * 5.0;
          const stride = Math.sin(agent.animCycle) * 0.52;

          // Articulated Hip & Knee Locomotion
          agent.leftLeg.rotation.x = stride;
          agent.rightLeg.rotation.x = -stride;

          // Natural knee flexion during back swing
          agent.leftKnee.rotation.x = Math.max(0, -stride * 0.65);
          agent.rightKnee.rotation.x = Math.max(0, stride * 0.65);

          // Coordinated Arm Counter-Swing
          agent.leftArm.rotation.x = -stride * 0.45;
          agent.rightArm.rotation.x = stride * 0.45;
          agent.leftElbow.rotation.x = -0.25 - Math.abs(stride) * 0.2;
          agent.rightElbow.rotation.x = -0.25 - Math.abs(stride) * 0.2;

          // Natural Rhythmic Pelvis Bounce
          const runBounce = Math.abs(Math.sin(agent.animCycle * 2)) * 0.035;
          agent.torso.position.y = 0.86 + runBounce;
          agent.headGroup.position.y = 1.48 + runBounce;

          if (distSq < 0.4225) { // 0.65m waypoint threshold
            agent.currentWaypointIdx++;
            if (agent.currentWaypointIdx >= agent.path.length) {
              agent.state = 'SAFE';
              agent.mesh.visible = true; // Safe in muster zone
              agent.leftLeg.rotation.x = 0;
              agent.rightLeg.rotation.x = 0;
              agent.leftKnee.rotation.x = 0;
              agent.rightKnee.rotation.x = 0;
              agent.leftArm.rotation.x = 0;
              agent.rightArm.rotation.x = 0;
              agent.leftElbow.rotation.x = 0;
              agent.rightElbow.rotation.x = 0;
              agent.torso.position.y = 0.86;
              agent.headGroup.position.y = 1.48;
              evacuatedCount++;
              continue;
            }
          } else {
            const totalDist = Math.sqrt(distSq);
            const step = agent.speed * effectiveDelta;
            const moveRatio = Math.min(1.0, step / totalDist);

            agent.x += dx * moveRatio;
            // STRICT UNIDIRECTIONAL DOWNWARD FLOW:
            // Occupants evacuating must NEVER climb upward in altitude.
            if (dy < -0.001) {
              agent.y += dy * moveRatio;
            } else if (dy > 0.05) {
              // Target waypoint is above agent's current altitude - skip upward waypoint
              agent.currentWaypointIdx++;
            }
            agent.z += dz * moveRatio;

            // Canonical Navigation Coordinates: No vertical explosion offset
            agent.mesh.position.set(agent.x, agent.y, agent.z);
          }
        }
      }
    }

    // Route lines are maintained via assignRoutes / rerouteAgents / setFloorMode.
    // Avoid rebuilding/disposing geometry on every single animation frame.

    const currentStats = {
      total: this.agents.length,
      evacuated: evacuatedCount,
      inTransit: this.agents.length - evacuatedCount,
      isCompleted: evacuatedCount === this.agents.length && this.agents.length > 0
    };
    this._syncInstancedCrowd();
    this.cachedStats = currentStats;
    return currentStats;
  }

  /**
   * Extract all active fires into a normalized array regardless of whether
   * activeFires is a Map, an Array, or object.
   */
  getActiveFireList() {
    if (!this.fireSystem || !this.fireSystem.activeFires) return [];
    const list = [];
    if (this.fireSystem.activeFires instanceof Map) {
      for (const [rId, f] of this.fireSystem.activeFires.entries()) {
        if (!f) continue;
        const fl = f.floor !== undefined ? f.floor : (f.basePos && f.basePos.floor !== undefined ? f.basePos.floor : null);
        if (f.basePos) list.push({ ...f.basePos, roomId: rId, floor: fl, radius: f.radius || 5.0 });
        else if (f.primarySource) list.push({ ...f.primarySource, roomId: rId, floor: fl, radius: f.radius || 5.0 });
        if (f.secondarySource) list.push({ ...f.secondarySource, roomId: rId, floor: fl, radius: f.radius || 4.0 });
      }
    } else if (Array.isArray(this.fireSystem.activeFires)) {
      for (const f of this.fireSystem.activeFires) {
        if (!f) continue;
        if (f.basePos) list.push({ ...f.basePos, floor: f.floor, radius: f.radius || 5.0 });
        else list.push({ ...f, radius: f.radius || 5.0 });
      }
    }
    return list;
  }

  /**
   * Real-time Fire Avoidance Check:
   * Inspects active fires on this agent's floor to verify whether any fire is directly
   * in front of the agent or lying across the upcoming waypoints of their evacuation route.
   * If detected, triggers immediate avoidance and safe rerouting away from the fire.
   */
  checkAndAvoidFire(agent, activeFires) {
    if (!activeFires || activeFires.length === 0) return false;
    if (agent.state !== 'EVACUATING' || !agent.path || agent.path.length === 0) return false;
    if (agent.reroutePause > 0) return false;

    const agentFloor = agent.floor || Math.max(1, Math.floor((agent.y + 0.5) / this.floorHeight) + 1);

    // Filter fires active on this agent's floor
    const floorFires = activeFires.filter(f => {
      const fFloor = f.floor !== undefined ? Number(f.floor) : (f.y !== undefined ? Math.floor(f.y / this.floorHeight) + 1 : null);
      if (fFloor !== null && fFloor === agentFloor) return true;
      if (f.y !== undefined && Math.abs(agent.y - f.y) < 2.5) return true;
      return false;
    });

    if (floorFires.length === 0) return false;

    // Cooldown check: prevent rapid thrashing / re-pausing if agent was already rerouted recently
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (agent.lastRerouteTime && (now - agent.lastRerouteTime) < 1200) {
      const isFatal = floorFires.some(f => Math.hypot((f.x || 0) - agent.x, (f.z || 0) - agent.z) < 3.0);
      if (!isFatal) return false;
    }

    let fireInPath = false;
    let threatFire = null;

    // Helper: squared distance from point (px, pz) to segment (x1, z1) -> (x2, z2)
    const distToSegmentSq = (px, pz, x1, z1, x2, z2) => {
      const l2 = (x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1);
      if (l2 === 0) return (px - x1) * (px - x1) + (pz - z1) * (pz - z1);
      let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * (x2 - x1);
      const projZ = z1 + t * (z2 - z1);
      return (px - projX) * (px - projX) + (pz - projZ) * (pz - projZ);
    };

    for (const fire of floorFires) {
      const fX = fire.x || 0;
      const fZ = fire.z || 0;
      const dangerRadius = Math.max(fire.radius || 4.2, 3.8);
      const dangerRadiusSq = dangerRadius * dangerRadius;

      // 1. Direct fatal proximity: fire is right on top of agent
      const toFireDistSq = (fX - agent.x) * (fX - agent.x) + (fZ - agent.z) * (fZ - agent.z);
      if (toFireDistSq < dangerRadiusSq) {
        fireInPath = true;
        threatFire = fire;
        break;
      }

      // 2. Path trajectory intersection on current floor:
      // Check segment from agent's current position to current waypoint
      const curWp = agent.path[agent.currentWaypointIdx];
      if (curWp && (curWp.y === undefined || Math.abs(curWp.y - agent.y) < 1.0)) {
        if (distToSegmentSq(fX, fZ, agent.x, agent.z, curWp.x, curWp.z) < dangerRadiusSq) {
          fireInPath = true;
          threatFire = fire;
          break;
        }
      }

      // Check upcoming segments along the path on this floor (up to 8 waypoints ahead)
      const maxWp = Math.min(agent.path.length - 1, agent.currentWaypointIdx + 8);
      for (let w = agent.currentWaypointIdx; w < maxWp; w++) {
        const p1 = agent.path[w];
        const p2 = agent.path[w + 1];
        if (p1.y !== undefined && Math.abs(p1.y - agent.y) > 1.0) break;
        if (p2.y !== undefined && Math.abs(p2.y - agent.y) > 1.0) break;
        if (distToSegmentSq(fX, fZ, p1.x, p1.z, p2.x, p2.z) < dangerRadiusSq) {
          fireInPath = true;
          threatFire = fire;
          break;
        }
      }
      if (fireInPath) break;

      // 3. Central corridor direct heading check (only when agent is actually inside the corridor)
      const isCorridorFire = Math.abs(fZ) <= 3.5;
      const isInCorridor = Math.abs(agent.z) <= 3.5;
      if (isCorridorFire && isInCorridor) {
        const targetWp = agent.path[agent.currentWaypointIdx] || agent.path[agent.path.length - 1];
        const headingX = targetWp ? (targetWp.x - agent.x) : 0;
        const isHeadingWest = headingX < -0.3;
        const isHeadingEast = headingX > 0.3;

        // Only threatened if agent is walking TOWARDS the fire along the corridor
        if (isHeadingWest && agent.x > fX && (agent.x - fX) < 30.0) {
          fireInPath = true;
          threatFire = fire;
          break;
        } else if (isHeadingEast && agent.x < fX && (fX - agent.x) < 30.0) {
          fireInPath = true;
          threatFire = fire;
          break;
        }
      }
    }

    if (!fireInPath || !threatFire) return false;

    // Fire in route: execute safe diversion reroute
    this.rerouteAgentAwayFromFire(agent, threatFire, floorFires, agentFloor);
    return true;
  }

  /**
   * Reroute agent away from fire to a safe alternative exit.
   */
  rerouteAgentAwayFromFire(agent, threatFire, floorFires, agentFloor) {
    const isGround = agentFloor === 1;

    const isExitBlocked = (exitId) => {
      const targetX = exitId === 'exit_west' ? -26.0 : (exitId === 'exit_east' ? 26.0 : 0.0);
      return floorFires.some(f => {
        const fX = f.x || 0;
        const fZ = f.z || 0;
        if (exitId === 'exit_south') {
          const corridorBlocked = Math.abs(fZ) <= 3.5 && (fX >= Math.min(agent.x, 0.0) - 1.2 && fX <= Math.max(agent.x, 0.0) + 1.2);
          const foyerBlocked = Math.hypot(fX, fZ - 20.0) < 14.0;
          return corridorBlocked || foyerBlocked;
        }
        const nearExit = Math.hypot(targetX - fX, 0 - fZ) < 9.0;
        const minX = Math.min(agent.x, targetX) - 1.2;
        const maxX = Math.max(agent.x, targetX) + 1.2;
        const inCorridorBetween = Math.abs(fZ) <= 3.5 && (fX >= minX && fX <= maxX);
        return nearExit || inCorridorBetween;
      });
    };

    let targetExitId = null;
    let targetColor = null;

    if (isGround) {
      const candidates = [
        { id: 'exit_east', color: '#00f0ff', x: 26.0 },
        { id: 'exit_west', color: '#00ff88', x: -26.0 },
        { id: 'exit_south', color: '#9d4edd', x: 0.0 }
      ];
      const viable = candidates.filter(c => !isExitBlocked(c.id));
      if (viable.length > 0) {
        const diffFromCurrent = viable.filter(c => c.id !== agent.currentExitId);
        const pool = diffFromCurrent.length > 0 ? diffFromCurrent : viable;
        pool.sort((a, b) => Math.hypot(agent.x - a.x, agent.z - 0) - Math.hypot(agent.x - b.x, agent.z - 0));
        targetExitId = pool[0].id;
        targetColor = pool[0].color;
      } else {
        targetExitId = threatFire.x > agent.x ? 'exit_west' : 'exit_east';
        targetColor = targetExitId === 'exit_west' ? '#00ff88' : '#00f0ff';
      }
    } else {
      const westBlocked = isExitBlocked('exit_west');
      const eastBlocked = isExitBlocked('exit_east');
      if (westBlocked && !eastBlocked) {
        targetExitId = 'exit_east';
        targetColor = '#00f0ff';
      } else if (eastBlocked && !westBlocked) {
        targetExitId = 'exit_west';
        targetColor = '#00ff88';
      } else {
        targetExitId = threatFire.x > agent.x ? 'exit_west' : 'exit_east';
        targetColor = targetExitId === 'exit_west' ? '#00ff88' : '#00f0ff';
      }
    }

    const newPath = [];
    const seed = agent.id ? agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 1;
    const jAngle = (seed % 100) * (Math.PI * 2 / 100);
    const jDist = 1.0 + ((seed * 7) % 35) * 0.1;
    const jitterX = Math.cos(jAngle) * jDist;
    const jitterZ = Math.sin(jAngle) * jDist;

    if (isGround) {
      newPath.push({ x: agent.x, y: 0.15, z: agent.z });
      if (Math.abs(agent.z) > 2.5) {
        newPath.push({ x: agent.x, y: 0.15, z: agent.z < 0 ? -2.6 : 2.6 });
      }
      if (Math.abs(agent.z) > 0.6) {
        newPath.push({ x: agent.x, y: 0.15, z: 0.0 });
      }
      if (targetExitId === 'exit_east') {
        newPath.push({ x: 26.4, y: 0.15, z: 0.0 });
        newPath.push({ x: 29.2, y: 0.15, z: 0.0 });
        newPath.push({ x: 33.5, y: 0.15, z: 0.0 });
        newPath.push({ x: 38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
      } else if (targetExitId === 'exit_west') {
        newPath.push({ x: -26.4, y: 0.15, z: 0.0 });
        newPath.push({ x: -29.2, y: 0.15, z: 0.0 });
        newPath.push({ x: -33.5, y: 0.15, z: 0.0 });
        newPath.push({ x: -38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
      } else if (targetExitId === 'exit_south') {
        newPath.push({ x: 0.0, y: 0.15, z: 0.0 });
        newPath.push({ x: 0.0, y: 0.15, z: 2.6 });
        newPath.push({ x: 0.0, y: 0.15, z: 18.0 });
        newPath.push({ x: 0.0, y: 0.15, z: 23.0 });
        newPath.push({ x: 0.0, y: 0.15, z: 28.5 });
        newPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
      }
    } else {
      const flY = agent.y;
      newPath.push({ x: agent.x, y: flY, z: agent.z });
      if (Math.abs(agent.z) > 2.5) {
        newPath.push({ x: agent.x, y: flY, z: agent.z < 0 ? -2.6 : 2.6 });
      }
      if (Math.abs(agent.z) > 0.6) {
        newPath.push({ x: agent.x, y: flY, z: 0.0 });
      }
      const isWestStair = targetExitId === 'exit_west';
      const stairLandingX = isWestStair ? -26.4 : 26.4;
      newPath.push({ x: stairLandingX, y: flY, z: 0.0 });

      const flight1X = isWestStair ? -27.05 : 27.05;
      const flight2X = isWestStair ? -28.95 : 28.95;
      for (let fl = agentFloor; fl > 1; fl--) {
        const flBaseY = (fl - 1) * this.floorHeight;
        newPath.push({ x: flight1X, y: flBaseY + 3.1, z: 0.5 });
        newPath.push({ x: flight1X, y: flBaseY + 1.9, z: 1.4 });
        newPath.push({ x: flight2X, y: flBaseY + 1.9, z: 1.4 });
        newPath.push({ x: flight2X, y: flBaseY + 0.7, z: 0.5 });
        newPath.push({ x: stairLandingX, y: (fl - 2) * this.floorHeight + 0.15, z: 0.0 });
      }

      if (isWestStair) {
        newPath.push({ x: -29.2, y: 0.15, z: 0.0 });
        newPath.push({ x: -33.5, y: 0.15, z: 0.0 });
        newPath.push({ x: -38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
      } else {
        newPath.push({ x: 29.2, y: 0.15, z: 0.0 });
        newPath.push({ x: 33.5, y: 0.15, z: 0.0 });
        newPath.push({ x: 38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
      }
    }

    agent.path = newPath;
    agent.currentWaypointIdx = Math.min(1, newPath.length - 1);
    agent.currentExitId = targetExitId;
    agent.assignedExitColor = targetColor;
    agent.reroutePause = 0.5;
    agent.lastRerouteTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    agent.rerouteCount = (agent.rerouteCount || 0) + 1;

    const nextWp = newPath[agent.currentWaypointIdx];
    if (nextWp && agent.mesh) {
      const tdx = nextWp.x - agent.x;
      const tdz = nextWp.z - agent.z;
      if (tdx * tdx + tdz * tdz > 0.001) {
        agent.rerouteTurnTarget = Math.atan2(tdx, tdz);
      }
    }

    this.syncRouteLines();
  }

  /**
   * Check if an agent's current waiting zone has become dangerous due to fire/smoke.
   * Returns true if the agent should emergency-evacuate despite their delay timer.
   */
  isWaitingZoneDangerous(agent) {
    if (!Number.isFinite(agent.x) || !Number.isFinite(agent.z)) return false;
    const activeFires = this.getActiveFireList();
    if (activeFires.length === 0) return false;

    const DANGER_RADIUS = 8.0; // meters

    for (const fire of activeFires) {
      if (!fire) continue;
      const fireY = fire.y !== undefined ? fire.y : (fire.basePos ? fire.basePos.y : 0);
      const fireX = fire.x !== undefined ? fire.x : (fire.basePos ? fire.basePos.x : 0);
      const fireZ = fire.z !== undefined ? fire.z : (fire.basePos ? fire.basePos.z : 0);

      // Check if fire is on the same floor
      if (Math.abs(agent.y - fireY) > 2.5) continue;

      // Check distance to fire
      const dist = Math.hypot(agent.x - fireX, agent.z - fireZ);
      if (dist < DANGER_RADIUS) {
        return true;
      }
    }
    return false;
  }

  setFloorMode(mode) {
    this.floorMode = mode;
    const isSingleFloor = mode !== 'ALL' && mode !== 'EXPLODED';
    const targetFloorNum = isSingleFloor ? parseInt(mode, 10) : null;

    this.agents.forEach(agent => {
      agent.displayPos = null;
      agent.mesh.position.y = (agent.state === 'SAFE' || agent.isEvacuated) ? 0.15 : agent.y;

      if (mode === 'ALL' || mode === 'EXPLODED') {
        agent.mesh.visible = true;
      } else {
        const isOnTargetFloor = Number(agent.floor) === targetFloorNum;
        agent.mesh.visible = (agent.state === 'SAFE' || agent.isEvacuated) ? (targetFloorNum === 1) : isOnTargetFloor;
      }
    });

    this._syncInstancedCrowd();
    this.syncRouteLines();
  }

  clearPathLines() {
    for (const entry of this.routeLines.values()) {
      this._disposeRouteEntry(entry);
    }
    this.routeLines.clear();

    while (this.pathLinesGroup.children.length > 0) {
      const obj = this.pathLinesGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material && !obj.material.userData?.isShared) obj.material.dispose();
      this.pathLinesGroup.remove(obj);
    }
  }

  clear() {
    this.clearPathLines();
    this.pendingRouteLineIds = [];
    this.pendingRouteLineIdSet.clear();
    this.phasedEvacuationDelays.clear();
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }
    this.instancedCrowdMeshes = [];
    this.instancedCrowdRecords = [];
    this.agents = [];
  }

  dispose() {
    this.clear();
    if (this._routeMaterialsMap) {
      for (const mat of this._routeMaterialsMap.values()) {
        mat.dispose();
      }
      this._routeMaterialsMap.clear();
    }
    if (this.pathLinesGroup && this.pathLinesGroup.parent) {
      this.pathLinesGroup.parent.remove(this.pathLinesGroup);
    }
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }

  /**
   * Clear all phased evacuation delays.
   * Called on simulation reset to clear any pending delay timers.
   */
  clearPhasedDelays() {
    this.phasedEvacuationDelays.clear();
    this.agents.forEach(agent => {
      agent.delayTimer = 0;
      agent.originalDelayTimer = 0;
      agent.phasedDelayPolicy = null;
      if (agent.state === 'WAITING') {
        agent.state = 'IDLE';
      }
    });
  }
}
