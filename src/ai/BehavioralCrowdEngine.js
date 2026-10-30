// ==============================================================================
// TwinGuard AI - AI Module: BehavioralCrowdEngine (Phase 2)
// Microscopic human crowd behavior, doorway capacity arching & stairwell physics
// ==============================================================================

class SpatialGrid {
  constructor(cellSize = 1.6) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(floor, cx, cz) {
    return `${floor}_${cx}_${cz}`;
  }

  insert(agent) {
    const cx = Math.floor(agent.x / this.cellSize);
    const cz = Math.floor(agent.z / this.cellSize);
    const key = this._key(agent.floor, cx, cz);
    let list = this.cells.get(key);
    if (!list) {
      list = [];
      this.cells.set(key, list);
    }
    list.push(agent);
  }

  getNeighbors(agent) {
    const cx = Math.floor(agent.x / this.cellSize);
    const cz = Math.floor(agent.z / this.cellSize);
    const neighbors = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = this._key(agent.floor, cx + dx, cz + dz);
        const list = this.cells.get(key);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            if (list[i].id !== agent.id) {
              neighbors.push(list[i]);
            }
          }
        }
      }
    }
    return neighbors;
  }
}

export class BehavioralCrowdEngine {
  constructor() {
    this.spatialGrid = new SpatialGrid(1.6);
    this.doorwayThroughputs = new Map(); // roomId -> array of timestamp seconds
    this.doorwayCapacities = new Map(); // roomId -> queue of waiting agentIds
    this.maxDoorThroughput = 1.6; // Max persons per second per door (NFPA standard)

    this.telemetry = {
      states: {
        idle: 0,
        hesitating: 0,
        queuingDoor: 0,
        corridorTransit: 0,
        stairDescent: 0,
        safe: 0
      },
      peakDensity: 0.0,
      cumulativeExposure: 0.0,
      activeFlowRate: 0.0,
      stairwellCongestion: { coreA: 0, coreB: 0, exitC: 0 },
      bottleneckDoors: []
    };
  }

  reset() {
    this.spatialGrid.clear();
    this.doorwayThroughputs.clear();
    this.doorwayCapacities.clear();
    this.telemetry = {
      states: { idle: 0, hesitating: 0, queuingDoor: 0, corridorTransit: 0, stairDescent: 0, safe: 0 },
      peakDensity: 0.0,
      cumulativeExposure: 0.0,
      activeFlowRate: 0.0,
      stairwellCongestion: { coreA: 0, coreB: 0, exitC: 0 },
      bottleneckDoors: []
    };
  }

  // Master Behavioral Step: processes reaction delays, physical repulsions, doorway queues & stairwell friction
  updateCrowdPhysics(agents, delta, simSpeed, fireLocations = [], floorMode = 'ALL') {
    if (!agents || agents.length === 0) return { telemetry: this.telemetry, safeCount: 0 };

    const effectiveDelta = delta * (simSpeed > 0 ? simSpeed : 0);
    const isSimulating = simSpeed > 0;

    // Reset spatial hash and telemetry counts
    this.spatialGrid.clear();
    const stateCounts = { idle: 0, hesitating: 0, queuingDoor: 0, corridorTransit: 0, stairDescent: 0, safe: 0 };
    let totalExposureThisFrame = 0;
    let maxLocalDensity = 0.0;
    let safeCount = 0;
    const stairCounts = { coreA: 0, coreB: 0, exitC: 0 };

    const isSingleFloor = floorMode !== 'ALL' && floorMode !== 'EXPLODED';
    const targetFloorNum = isSingleFloor ? parseInt(floorMode, 10) : null;

    // 1. First Pass: Populate spatial hash for proximate neighbor lookups
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (a.state !== 'SAFE') {
        this.spatialGrid.insert(a);
      }
    }

    // Clean old doorway throughput timestamps (> 1.5s old)
    const nowTime = performance.now() / 1000;
    this.doorwayThroughputs.forEach((timestamps, roomId) => {
      while (timestamps.length > 0 && nowTime - timestamps[0] > 1.2) {
        timestamps.shift();
      }
    });

    // 2. Second Pass: Compute Microscopic Behavioral Kinematics per Agent
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      // Floor isolation visibility filter
      if (isSingleFloor && Number(agent.floor) !== targetFloorNum) {
        agent.mesh.visible = false;
        continue;
      }

      if (agent.state === 'SAFE') {
        safeCount++;
        stateCounts.safe++;
        continue;
      }

      if (agent.state === 'IDLE') {
        stateCounts.idle++;
        continue;
      }

      if (!isSimulating) {
        // Paused simulation
        if (agent.state === 'EVACUATING') {
          stateCounts.corridorTransit++;
        }
        continue;
      }

      // --- STAGE A: Reaction & Pre-Evacuation Hesitation State Machine ---
      if (agent.remainingHesitation > 0) {
        agent.remainingHesitation -= effectiveDelta;
        stateCounts.hesitating++;

        // Stand up when hesitation is 60% elapsed (alert investigative posture)
        if (agent.isSeated && agent.remainingHesitation < (agent.reactionDelay * 0.6)) {
          agent.isSeated = false;
          if (agent.onStandUp) agent.onStandUp(agent);
        }

        // Face toward next escape waypoint while hesitating
        if (agent.path && agent.path.length > agent.currentWaypointIdx) {
          const wp = agent.path[agent.currentWaypointIdx];
          const dx = wp.x - agent.x;
          const dz = wp.z - agent.z;
          agent.facingAngle = Math.atan2(dx, dz);
        }
        continue;
      }

      // Make sure seated agent stands up once hesitation passes
      if (agent.isSeated) {
        agent.isSeated = false;
        if (agent.onStandUp) agent.onStandUp(agent);
      }

      // --- STAGE B: Locomotion & Path Traversal ---
      if (agent.state === 'EVACUATING' && agent.path && agent.path.length > 0) {
        const targetWaypoint = agent.path[agent.currentWaypointIdx];

        if (!targetWaypoint) {
          // Reached end of route: Safe in exterior muster zone!
          agent.state = 'SAFE';
          agent.y = 0.15;
          agent.displayPos = { x: agent.x, y: 0.15, z: agent.z };
          agent.mesh.position.set(agent.x, 0.15, agent.z);
          agent.mesh.visible = true;
          safeCount++;
          stateCounts.safe++;
          continue;
        }

        // Identify current architectural zone
        const isNearDoorway = agent.currentWaypointIdx <= 3; // Initial doorway transit
        const isStairCore = (agent.x < -25 || agent.x > 25) && Math.abs(agent.z) < 4.5 && agent.floor > 1;

        if (isNearDoorway) {
          stateCounts.queuingDoor++;
        } else if (isStairCore) {
          stateCounts.stairDescent++;
          if (agent.x < 0) stairCounts.coreA++;
          else stairCounts.coreB++;
        } else {
          stateCounts.corridorTransit++;
          if (agent.z > 16) stairCounts.exitC++;
        }

        // --- STAGE C: Velocity Modulation (Social Force & Physical Friction) ---
        let currentEffectiveSpeed = agent.speed || 3.2;

        // 1. Mobility Profile Modifier
        if (agent.mobilityType === 'SLOW') {
          currentEffectiveSpeed *= 0.68;
        } else if (agent.mobilityType === 'ASSISTED') {
          currentEffectiveSpeed *= 0.42;
        }

        // 2. Stairwell Friction Modifier (NFPA Egress Standard ~0.55x)
        if (isStairCore) {
          currentEffectiveSpeed *= 0.58;
        }

        // 3. Interpersonal Repulsion (Social Force Model) & Local Density
        const neighbors = this.spatialGrid.getNeighbors(agent);
        let repulsiveX = 0;
        let repulsiveZ = 0;
        let localCongestionCount = 0;

        for (let n = 0; n < neighbors.length; n++) {
          const other = neighbors[n];
          const ndx = agent.x - other.x;
          const ndz = agent.z - other.z;
          const distSq = ndx * ndx + ndz * ndz;

          if (distSq < 2.56) { // Within 1.6m radius
            localCongestionCount++;
            const dist = Math.sqrt(distSq);
            if (dist > 0.05) {
              // Helbing Exponential Repulsion
              const pushStrength = Math.exp((0.55 - dist) / 0.35) * 0.85;
              repulsiveX += (ndx / dist) * pushStrength;
              repulsiveZ += (ndz / dist) * pushStrength;
            }
          }

          // Trailing Queue in Stairwells: Cannot pass slower agent directly ahead!
          if (isStairCore && other.floor === agent.floor && Math.abs(agent.y - other.y) < 1.0) {
            const isAheadOnFlight = (targetWaypoint.z - agent.z) * (other.z - agent.z) > 0;
            if (isAheadOnFlight && distSq < 1.0) {
              currentEffectiveSpeed = Math.min(currentEffectiveSpeed, (other.speed || 3.0) * 0.75);
            }
          }
        }

        // Density tracking (agents per m²)
        const localDensity = localCongestionCount / 3.14;
        if (localDensity > maxLocalDensity) {
          maxLocalDensity = localDensity;
        }

        // High Density Speed Degradation (Fruin Egress Funnel)
        if (localDensity > 2.0) {
          const densityFactor = Math.max(0.3, 1.0 - (localDensity - 2.0) * 0.25);
          currentEffectiveSpeed *= densityFactor;
        }

        // 4. Doorway Throughput Regulated Queue (Arching Clog)
        if (isNearDoorway && agent.roomId) {
          let timestamps = this.doorwayThroughputs.get(agent.roomId);
          if (!timestamps) {
            timestamps = [];
            this.doorwayThroughputs.set(agent.roomId, timestamps);
          }

          // If doorway is currently saturated, decelerate to simulate door queuing
          if (timestamps.length >= this.maxDoorThroughput * 2) {
            currentEffectiveSpeed *= 0.35;
          }

          // Record passage when crossing door threshold waypoint (idx 2)
          if (agent.currentWaypointIdx === 2) {
            timestamps.push(nowTime);
          }
        }

        // --- STAGE D: Kinematic Integration toward Waypoint ---
        const dx = targetWaypoint.x - agent.x;
        const dy = targetWaypoint.y - agent.y;
        const dz = targetWaypoint.z - agent.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Apply physical repulsion nudge (clamped)
        const clampedRepulseX = Math.max(-0.6, Math.min(0.6, repulsiveX));
        const clampedRepulseZ = Math.max(-0.6, Math.min(0.6, repulsiveZ));

        // Horizontal orient angle
        const distH_Sq = dx * dx + dz * dz;
        if (distH_Sq > 0.0025) {
          agent.facingAngle = Math.atan2(dx + clampedRepulseX * 0.3, dz + clampedRepulseZ * 0.3);
        }

        // Stride Animation Rate
        agent.animCycle = (agent.animCycle || 0) + effectiveDelta * currentEffectiveSpeed * 4.8;
        agent.stride = Math.sin(agent.animCycle) * (isStairCore ? 0.38 : 0.52);

        // Check Waypoint Arrival (0.62m arrival envelope)
        if (distSq < 0.3844) {
          agent.currentWaypointIdx++;
          if (agent.currentWaypointIdx >= agent.path.length) {
            agent.state = 'SAFE';
            agent.y = 0.15;
            agent.displayPos = { x: agent.x, y: 0.15, z: agent.z };
            agent.mesh.position.set(agent.x, 0.15, agent.z);
            agent.mesh.visible = true;
            safeCount++;
            stateCounts.safe++;
            continue;
          }
        } else {
          const totalDist = Math.sqrt(distSq);
          const step = currentEffectiveSpeed * effectiveDelta;
          const moveRatio = Math.min(1.0, step / totalDist);

          // Suppress lateral repulsion drift inside stair core to prevent exterior wall clipping
          const repulseScale = isStairCore ? 0.05 : 0.4;
          agent.x += (dx * moveRatio) + (clampedRepulseX * effectiveDelta * repulseScale);
          agent.y += dy * moveRatio;
          agent.z += (dz * moveRatio) + (clampedRepulseZ * effectiveDelta * repulseScale);

          // Hard architectural containment while on upper floors
          if (agent.y > 0.45) {
            agent.x = Math.max(-28.8, Math.min(28.8, agent.x));
            agent.z = Math.max(-22.8, Math.min(22.8, agent.z));
          }

          // Dynamically track real physical floor altitude
          agent.floor = Math.max(1, Math.min(10, Math.floor(agent.y / 3.8) + 1));

          // Canonical elevation matches building model perfectly
          agent.displayPos = { x: agent.x, y: agent.y, z: agent.z };
        }

        // --- STAGE E: Cumulative Risk & Smoke Exposure Tracking ---
        if (fireLocations.length > 0) {
          for (let f = 0; f < fireLocations.length; f++) {
            const fire = fireLocations[f];
            const fDist = Math.hypot(agent.x - fire.x, agent.z - fire.z);
            const sameLevel = Math.abs(agent.y - fire.y) < 2.5;

            if (sameLevel && fDist < 9.0) {
              const exposureRate = (9.0 - fDist) * 1.5;
              agent.totalRiskExposure = (agent.totalRiskExposure || 0) + exposureRate * effectiveDelta;
              totalExposureThisFrame += exposureRate * effectiveDelta;
            }
          }
        }
      }
    }

    // 3. Update Master AI Telemetry
    this.telemetry.states = stateCounts;
    this.telemetry.peakDensity = Number(maxLocalDensity.toFixed(2));
    this.telemetry.cumulativeExposure += Number(totalExposureThisFrame.toFixed(1));
    this.telemetry.stairwellCongestion = stairCounts;

    // Detect bottlenecked doorways (exceeding queue threshold)
    const hotDoors = [];
    this.doorwayThroughputs.forEach((times, rId) => {
      if (times.length > 2) {
        hotDoors.push(rId);
      }
    });
    this.telemetry.bottleneckDoors = hotDoors;

    return {
      telemetry: this.telemetry,
      safeCount
    };
  }
}

