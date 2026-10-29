import * as THREE from 'three';
import { getRoomSeatingSpots } from '../simulation/Doorways.js';

export class AgentCrowd {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.agents = [];
    this.floorMode = 'ALL';
    this.pulseTime = 0;
    this.floorHeight = 3.8; // Realistic commercial ceiling height

    // === Streamlined High-Performance Geometries ===
    // Head & Hair
    this.headGeo = new THREE.SphereGeometry(0.13, 14, 12);
    this.hairGeo = new THREE.SphereGeometry(0.142, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
    this.noseGeo = new THREE.BoxGeometry(0.025, 0.05, 0.035);

    // Torso, Collar & ID Lanyard
    this.torsoGeo = new THREE.BoxGeometry(0.36, 0.54, 0.22);
    this.collarGeo = new THREE.BoxGeometry(0.22, 0.08, 0.12);
    this.badgeGeo = new THREE.BoxGeometry(0.07, 0.09, 0.015);

    // Arms
    this.armGeo = new THREE.BoxGeometry(0.09, 0.46, 0.09);
    this.handGeo = new THREE.SphereGeometry(0.045, 8, 8);

    // Legs & Shoes
    this.legGeo = new THREE.BoxGeometry(0.125, 0.68, 0.13);
    this.shoeGeo = new THREE.BoxGeometry(0.135, 0.09, 0.23);

    // Indicators
    this.shadowGeo = new THREE.CircleGeometry(0.35, 12);
    this.beaconGeo = new THREE.SphereGeometry(0.08, 8, 8);

    // Diverse Realistic Palettes
    this.skinColors = [0xfce5d8, 0xf4c29e, 0xe0a87a, 0xbc7d4f, 0x8c532b];
    this.hairColors = [0x18181b, 0x291d18, 0x4a2e1b, 0x78350f, 0xcab381];
    this.suitColors = [0x1e293b, 0x0f172a, 0x334155, 0x1e3a5f, 0x3b1d28, 0x14342b, 0x0284c7];
    this.pantsColors = [0x0b0f19, 0x1e293b, 0x334155, 0x475569];

    // Pre-allocated shared materials pool (Prevents compiling 800+ WebGL shader variants)
    this.skinMats = this.skinColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.65 }));
    this.hairMats = this.hairColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }));
    this.suitMats = this.suitColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.1 }));
    this.pantsMats = this.pantsColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));

    // Shared Materials for Performance
    this.shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
    this.collarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    this.badgeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

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
        const y = floorBaseY + 0.05;

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

    // Retain current floor mode filter on newly spawned agents
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
    const suitMat = this.suitMats[Math.floor(Math.random() * this.suitMats.length)];
    const pantsMat = this.pantsMats[Math.floor(Math.random() * this.pantsMats.length)];

    // 1. Soft Ambient Ground Shadow
    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    agentGroup.add(shadow);

    // 2. Articulated Legs & Shoes (1 pivot per leg)
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.74, 0);
    const leftLegMesh = new THREE.Mesh(this.legGeo, pantsMat);
    leftLegMesh.position.y = -0.34;
    leftLegPivot.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(this.shoeGeo, this.shoeMat);
    leftShoe.position.set(0, -0.68, 0.04);
    leftLegPivot.add(leftShoe);
    agentGroup.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.74, 0);
    const rightLegMesh = new THREE.Mesh(this.legGeo, pantsMat);
    rightLegMesh.position.y = -0.34;
    rightLegPivot.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(this.shoeGeo, this.shoeMat);
    rightShoe.position.set(0, -0.68, 0.04);
    rightLegPivot.add(rightShoe);
    agentGroup.add(rightLegPivot);

    // 3. Torso, Collar & Corporate ID Badge Lanyard
    const torso = new THREE.Mesh(this.torsoGeo, suitMat);
    torso.position.y = 1.16;
    agentGroup.add(torso);

    const collar = new THREE.Mesh(this.collarGeo, this.collarMat);
    collar.position.set(0, 1.44, 0.02);
    agentGroup.add(collar);

    const idBadge = new THREE.Mesh(this.badgeGeo, this.badgeMat);
    idBadge.position.set(0.06, 1.22, 0.125);
    agentGroup.add(idBadge);

    // 4. Articulated Arms (1 pivot per arm)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.24, 1.38, 0);
    const leftArmMesh = new THREE.Mesh(this.armGeo, suitMat);
    leftArmMesh.position.y = -0.23;
    leftArmPivot.add(leftArmMesh);

    const leftHand = new THREE.Mesh(this.handGeo, skinMat);
    leftHand.position.set(0, -0.47, 0.01);
    leftArmPivot.add(leftHand);
    agentGroup.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.24, 1.38, 0);
    const rightArmMesh = new THREE.Mesh(this.armGeo, suitMat);
    rightArmMesh.position.y = -0.23;
    rightArmPivot.add(rightArmMesh);

    const rightHand = new THREE.Mesh(this.handGeo, skinMat);
    rightHand.position.set(0, -0.47, 0.01);
    rightArmPivot.add(rightHand);
    agentGroup.add(rightArmPivot);

    // 5. Head with Nose & Hair
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.64, 0);

    const headMesh = new THREE.Mesh(this.headGeo, skinMat);
    headGroup.add(headMesh);

    const hair = new THREE.Mesh(this.hairGeo, hairMat);
    hair.position.set(0, 0.04, -0.01);
    headGroup.add(hair);

    const nose = new THREE.Mesh(this.noseGeo, skinMat);
    nose.position.set(0, 0.01, 0.135);
    headGroup.add(nose);
    agentGroup.add(headGroup);

    // 6. Minimalist Beacon (Hidden for authentic humanoid appearance)
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const beacon = new THREE.Mesh(this.beaconGeo, beaconMat);
    beacon.position.y = 2.05;
    beacon.visible = false; // Disabled to eliminate unnatural floating cyan sphere over agents
    agentGroup.add(beacon);

    // Apply facing rotation and sitting posture if assigned to chair/sofa
    if (data.facingRot !== undefined) {
      agentGroup.rotation.y = data.facingRot;
    }

    if (data.isSeated) {
      leftLegPivot.rotation.x = -Math.PI / 2;
      rightLegPivot.rotation.x = -Math.PI / 2;
      leftLegPivot.position.y = 0.46;
      rightLegPivot.position.y = 0.46;

      torso.position.y = 0.88;
      collar.position.y = 1.16;
      idBadge.position.y = 0.94;

      leftArmPivot.position.y = 1.08;
      rightArmPivot.position.y = 1.08;
      leftArmPivot.rotation.x = -0.55;
      rightArmPivot.rotation.x = -0.55;

      headGroup.position.y = 1.34;
      beacon.position.y = 1.75;
    }

    this.group.add(agentGroup);

    const agent = {
      id: data.id,
      floor: data.floor,
      mesh: agentGroup,
      leftLeg: leftLegPivot,
      rightLeg: rightLegPivot,
      leftArm: leftArmPivot,
      rightArm: rightArmPivot,
      torso,
      collar,
      idBadge,
      headGroup,
      beacon,
      suitMat,
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
    agent.leftLeg.rotation.x = 0;
    agent.rightLeg.rotation.x = 0;
    agent.leftLeg.position.y = 0.74;
    agent.rightLeg.position.y = 0.74;
    agent.torso.position.y = 1.16;
    agent.headGroup.position.y = 1.64;
    agent.leftArm.position.y = 1.38;
    agent.rightArm.position.y = 1.38;
    agent.leftArm.rotation.x = 0;
    agent.rightArm.rotation.x = 0;
    agent.beacon.position.y = 2.05;
    if (agent.collar) agent.collar.position.y = 1.44;
    if (agent.idBadge) agent.idBadge.position.y = 1.22;
  }

  assignRoutes(assignments) {
    this.clearPathLines();
    const assignmentMap = new Map();
    assignments.forEach(a => assignmentMap.set(a.agentId, a));

    // Sample dynamic glowing trajectory ribbons (1 in every 4 agents to keep line draw calls low)
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
        this.standUpAgent(agent);
        agent.path = assignment.path || [];
        agent.currentWaypointIdx = 0;
        agent.state = 'EVACUATING';
        agent.assignedExitColor = assignment.exitColor;

        agent.beacon.material.color = new THREE.Color(0xff5500);
        agent.suitMat.emissive = new THREE.Color(0xff3300);
        agent.suitMat.emissiveIntensity = 0.35;
      }
    });
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

    const isSingleFloor = this.floorMode && this.floorMode !== 'ALL' && this.floorMode !== 'EXPLODED';
    const targetFloorNum = isSingleFloor ? parseInt(this.floorMode, 10) : null;

    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];

      // Enforce strict floor-wise filtering when viewing an isolated level
      if (isSingleFloor && Number(agent.floor) !== targetFloorNum) {
        agent.mesh.visible = false;
        continue;
      }

      if (agent.state === 'SAFE') {
        evacuatedCount++;
        continue;
      }

      if (agent.state === 'IDLE') {
        continue;
      }

      // Evacuating Human Locomotion
      if (agent.state === 'EVACUATING' && agent.path.length > 0) {
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
          const legSwing = Math.sin(agent.animCycle) * 0.6;
          const armSwing = Math.sin(agent.animCycle) * 0.5;

          agent.leftLeg.rotation.x = legSwing;
          agent.rightLeg.rotation.x = -legSwing;
          agent.leftArm.rotation.x = -armSwing;
          agent.rightArm.rotation.x = armSwing;

          const runBounce = Math.abs(Math.sin(agent.animCycle * 2)) * 0.05;
          agent.torso.position.y = 1.16 + runBounce;
          agent.headGroup.position.y = 1.64 + runBounce;

          if (distSq < 0.4225) { // 0.65m threshold
            agent.currentWaypointIdx++;
            if (agent.currentWaypointIdx >= agent.path.length) {
              agent.state = 'SAFE';
              agent.mesh.visible = true; // Stay visible and safe in the muster zone!
              agent.leftLeg.rotation.x = 0;
              agent.rightLeg.rotation.x = 0;
              agent.leftArm.rotation.x = 0;
              agent.rightArm.rotation.x = 0;
              agent.torso.position.y = 1.16;
              agent.headGroup.position.y = 1.64;
              evacuatedCount++;
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

    const currentStats = {
      total: this.agents.length,
      evacuated: evacuatedCount,
      inTransit: this.agents.length - evacuatedCount,
      isCompleted: evacuatedCount === this.agents.length && this.agents.length > 0
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
