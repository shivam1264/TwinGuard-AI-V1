import * as THREE from 'three';
import { getRoomSeatingSpots } from '../simulation/Doorways.js';

export class AgentCrowd {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.agents = [];
    this.floorMode = 'ALL';
    this.floorHeight = 3.8; // Realistic commercial ceiling height

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
    this.cachedStats = null;
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
        const y = floorBaseY + 0.04;

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
    shadow.position.y = 0.015;
    agentGroup.add(shadow);

    // 2. Articulated Legs (Pelvis -> Thigh -> Knee Pivot -> Calf -> Contoured Shoe)
    // Left Leg
    const leftHipPivot = new THREE.Group();
    leftHipPivot.position.set(-0.11, 0.86, 0);

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
    rightHipPivot.position.set(0.11, 0.86, 0);

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
    torsoGroup.position.set(0, 0.86, 0);

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
    leftArmPivot.position.set(-0.23, 1.40, 0);

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
    rightArmPivot.position.set(0.23, 1.40, 0);

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
    headGroup.position.set(0, 1.48, 0);

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
      // Pelvis sits on chair (0.44 m seat height)
      torsoGroup.position.y = 0.44;
      leftHipPivot.position.y = 0.44;
      rightHipPivot.position.y = 0.44;

      // Thighs extend horizontally forward onto chair
      leftHipPivot.rotation.x = -Math.PI / 2;
      rightHipPivot.rotation.x = -Math.PI / 2;

      // Knees bend 90 degrees straight down toward floor
      leftKneePivot.rotation.x = Math.PI / 2;
      rightKneePivot.rotation.x = Math.PI / 2;

      // Lower arms approach desk keyboard plane
      leftArmPivot.position.y = 0.98;
      rightArmPivot.position.y = 0.98;
      leftArmPivot.rotation.x = -0.45;
      rightArmPivot.rotation.x = -0.45;
      leftElbowPivot.rotation.x = -0.65;
      rightElbowPivot.rotation.x = -0.65;

      // Head inclined naturally toward computer monitor
      headGroup.position.y = 1.05;
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
      roomId: data.roomId
    };

    this.agents.push(agent);
    return agent;
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

  assignRoutes(assignments) {
    this.clearPathLines();
    const assignmentMap = new Map();
    assignments.forEach(a => assignmentMap.set(a.agentId, a));

    // Dynamic trajectory ribbons (1 in every 4 agents to conserve draw calls)
    const sampledAssignments = assignments.filter((_, idx) => idx % 4 === 0);
    sampledAssignments.forEach(assignment => {
      const points = assignment.path;
      if (points && points.length > 1) {
        const curvePoints = points.map(p => new THREE.Vector3(p.x, p.y + 0.15, p.z));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(assignment.exitColor || 0x00f0ff),
          transparent: true,
          opacity: 0.55
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.userData = { floor: assignment.floor || 1 };
        this.pathLinesGroup.add(line);
      }
    });

    this.agents.forEach(agent => {
      const assignment = assignmentMap.get(agent.id);
      if (assignment) {
        if (assignment.isTrapped) {
          agent.state = 'TRAPPED';
          agent.beacon.material.color = new THREE.Color(0xff0044);
          agent.suitMat.emissive = new THREE.Color(0xff0022);
          agent.suitMat.emissiveIntensity = 0.6;
          return;
        }

        this.standUpAgent(agent);
        agent.path = assignment.path || [];
        agent.currentWaypointIdx = 0;
        agent.state = 'EVACUATING';
        agent.assignedExitColor = assignment.exitColor;
        agent.queueTimer = 0;

        agent.beacon.material.color = new THREE.Color(0xff5500);
        agent.shirtMat.emissive = new THREE.Color(0xff3300);
        agent.shirtMat.emissiveIntensity = 0.35;
      }
    });
  }

  rerouteAgents(newAssignments) {
    if (!newAssignments || newAssignments.length === 0) return;
    const assignmentMap = new Map();
    newAssignments.forEach(a => assignmentMap.set(a.agentId, a));

    this.agents.forEach(agent => {
      if (agent.state === 'SAFE') return;

      const assignment = assignmentMap.get(agent.id);
      if (!assignment) return;

      if (assignment.isTrapped) {
        agent.state = 'TRAPPED';
        agent.beacon.material.color = new THREE.Color(0xff0044);
        agent.suitMat.emissive = new THREE.Color(0xff0022);
        agent.suitMat.emissiveIntensity = 0.6;
        return;
      }

      if (assignment.path && assignment.path.length > 0) {
        let bestIdx = 0;
        let minDistSq = Infinity;
        for (let i = 0; i < assignment.path.length; i++) {
          const pt = assignment.path[i];
          const dSq = Math.hypot(pt.x - agent.x, pt.z - agent.z);
          if (dSq < minDistSq) {
            minDistSq = dSq;
            bestIdx = i;
          }
        }

        agent.path = assignment.path;
        agent.currentWaypointIdx = Math.min(bestIdx + 1, assignment.path.length - 1);
        agent.state = 'EVACUATING';
        agent.assignedExitColor = assignment.exitColor;
      }
    });
  }

  update(delta, simSpeed = 1.0) {
    if (simSpeed === 0) {
      if (this.cachedStats) return this.cachedStats;
      let safeCount = 0;
      let inTransitCount = 0;
      let queuedCount = 0;
      let trappedCount = 0;
      let idleCount = 0;

      for (let i = 0; i < this.agents.length; i++) {
        const s = this.agents[i].state;
        if (s === 'SAFE') safeCount++;
        else if (s === 'EVACUATING') inTransitCount++;
        else if (s === 'QUEUED') queuedCount++;
        else if (s === 'TRAPPED') trappedCount++;
        else idleCount++;
      }

      const total = this.agents.length;
      const inside = total - safeCount;

      this.cachedStats = {
        total,
        evacuated: safeCount,
        inside,
        inTransit: inTransitCount,
        queued: queuedCount,
        trapped: trappedCount,
        idle: idleCount,
        invariantValid: total === safeCount + inside,
        isCompleted: safeCount === total && total > 0
      };
      return this.cachedStats;
    }

    this.cachedStats = null;
    const effectiveDelta = delta * simSpeed;
    let safeCount = 0;
    let inTransitCount = 0;
    let queuedCount = 0;
    let trappedCount = 0;
    let idleCount = 0;

    const isSingleFloor = this.floorMode && this.floorMode !== 'ALL' && this.floorMode !== 'EXPLODED';
    const targetFloorNum = isSingleFloor ? parseInt(this.floorMode, 10) : null;

    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];

      if (isSingleFloor && Number(agent.floor) !== targetFloorNum) {
        agent.mesh.visible = false;
        continue;
      }

      if (agent.state === 'SAFE') {
        safeCount++;
        continue;
      }

      if (agent.state === 'TRAPPED') {
        trappedCount++;
        continue;
      }

      if (agent.state === 'IDLE') {
        idleCount++;
        continue;
      }

      // Handle Queued State (bottleneck delay at stairwells/doors)
      if (agent.state === 'QUEUED') {
        queuedCount++;
        agent.queueTimer = (agent.queueTimer || 0) - effectiveDelta;
        if (agent.queueTimer <= 0) {
          agent.state = 'EVACUATING';
        } else {
          continue;
        }
      }

      // Evacuating Human Locomotion
      if (agent.state === 'EVACUATING' && agent.path.length > 0) {
        inTransitCount++;

        if (agent.isSeated) {
          this.standUpAgent(agent);
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
              safeCount++;
              inTransitCount--;
              continue;
            }
          } else {
            const totalDist = Math.sqrt(distSq);
            const step = agent.speed * effectiveDelta;
            const moveRatio = Math.min(1.0, step / totalDist);

            agent.x += dx * moveRatio;
            agent.y += dy * moveRatio;
            agent.z += dz * moveRatio;

            let displayY = agent.y;
            if (this.floorMode === 'EXPLODED') {
              displayY = agent.y + (agent.floor - 1) * 5.0;
            }

            agent.mesh.position.set(agent.x, displayY, agent.z);
          }
        }
      }
    }

    const total = this.agents.length;
    const inside = total - safeCount;

    const currentStats = {
      total,
      evacuated: safeCount,
      inside,
      inTransit: inTransitCount,
      queued: queuedCount,
      trapped: trappedCount,
      idle: idleCount,
      invariantValid: total === safeCount + inside,
      isCompleted: safeCount === total && total > 0
    };
    this.cachedStats = currentStats;
    return currentStats;
  }

  setFloorMode(mode) {
    this.floorMode = mode;
    const isSingleFloor = mode !== 'ALL' && mode !== 'EXPLODED';
    const targetFloorNum = isSingleFloor ? parseInt(mode, 10) : null;

    this.agents.forEach(agent => {
      if (mode === 'ALL') {
        agent.mesh.visible = agent.state !== 'SAFE';
        agent.mesh.position.y = agent.y;
      } else if (mode === 'EXPLODED') {
        agent.mesh.visible = agent.state !== 'SAFE';
        agent.mesh.position.y = agent.y + (agent.floor - 1) * 5.0;
      } else {
        const isOnTargetFloor = Number(agent.floor) === targetFloorNum;
        agent.mesh.visible = isOnTargetFloor && agent.state !== 'SAFE';
        agent.mesh.position.y = agent.y;
      }
    });

    if (this.pathLinesGroup) {
      if (mode === 'ALL' || mode === 'EXPLODED') {
        this.pathLinesGroup.visible = true;
      } else {
        this.pathLinesGroup.children.forEach(line => {
          if (line.userData && line.userData.floor) {
            line.visible = Number(line.userData.floor) === targetFloorNum;
          }
        });
      }
    }
  }

  clearPathLines() {
    while (this.pathLinesGroup.children.length > 0) {
      const obj = this.pathLinesGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.pathLinesGroup.remove(obj);
    }
  }

  clear() {
    this.clearPathLines();
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }
    this.agents = [];
  }
}
