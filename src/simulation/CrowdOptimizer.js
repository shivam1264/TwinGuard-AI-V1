import { getRoomDoorway } from './Doorways.js';

export class CrowdOptimizer {
  constructor(navGrid, pathfinder) {
    this.navGrid = navGrid;
    this.pathfinder = pathfinder;
    this.floorHeight = 3.8; // Realistic commercial ceiling height

    this.exits = [
      { id: 'exit_west', name: 'Exit A (West Emergency Core)', x: -29, z: 0, capacity: 60, load: 0, color: '#00ff88', isBlocked: false },
      { id: 'exit_east', name: 'Exit B (East Fire Escape Core)', x: 29, z: 0, capacity: 60, load: 0, color: '#00f0ff', isBlocked: false },
      { id: 'exit_south', name: 'Exit C (South Grand Plaza Exit)', x: 0, z: 23, capacity: 80, load: 0, color: '#9d4edd', isBlocked: false }
    ];

    this.stairwellEntries = {
      exit_west: { x: -26, z: 0 },
      exit_east: { x: 26, z: 0 },
      exit_south: { x: 0, z: 18 } // Ground floor south foyer
    };
  }

  optimizeRoutes(agents, fireLocations = [], blockedExitIds = [], strategyType = 'LOAD_BALANCED') {
    // Reset load and sync blocked state from scenario
    this.exits.forEach(e => {
      e.load = 0;
      e.isBlocked = blockedExitIds.includes(e.id);
      if (e.isBlocked) {
        e.status = 'BLOCKED / SMOKE COMPROMISED';
      }
    });

    const bottlenecks = [];
    const assignments = [];

    const allOperational = this.exits.filter(e => !e.isBlocked);

    agents.forEach((agent, index) => {
      let bestExit = null;
      let minScore = Infinity;

      // Available exits: Upper floors (L2 to L10) MUST egress via vertical Stairwell Cores (West Core A or East Core B)
      // Ground floor (L1) can use West, East, or South Grand Exit!
      const floorExits = agent.floor === 1 ? this.exits : [this.exits[0], this.exits[1]];
      let availableExits = floorExits.filter(e => !e.isBlocked);

      // Fallback: If both floor stairwells are flagged, select the least compromised stair core
      if (availableExits.length === 0) {
        availableExits = [this.exits[0], this.exits[1]];
      }

      for (const exit of availableExits) {
        const stairEntry = this.stairwellEntries[exit.id];
        const distToStair = Math.hypot(agent.x - stairEntry.x, agent.z - stairEntry.z);

        let firePenalty = 0;
        fireLocations.forEach(fire => {
          const sameFloor = Math.abs(agent.y - fire.y) < 2.5;
          const distToFire = Math.hypot(stairEntry.x - fire.x, stairEntry.z - fire.z);

          if (distToFire < 9.0) {
            firePenalty += 700;
          }

          if (sameFloor) {
            const agentToFire = Math.hypot(agent.x - fire.x, agent.z - fire.z);
            if (agentToFire < 8.0) {
              firePenalty += 350;
            }
          }
        });

        // Anti-Stampede Staircase Congestion Penalty based on Strategy
        const loadRatio = exit.capacity > 0 ? exit.load / exit.capacity : 999;
        let congestionPenalty = Math.pow(loadRatio, 2.2) * 55;

        if (strategyType === 'NEAREST_CORE') {
          // Uncontrolled rush: greedily heads to nearest exit, causing massive bottleneck
          congestionPenalty = 0;
        } else if (strategyType === 'DYNAMIC_CORE_BALANCING' || strategyType === 'LOAD_BALANCED') {
          // Dynamic load balancing with strong deterrence against oversubscribed exits
          congestionPenalty = Math.pow(loadRatio, 2.6) * 90;
        } else if (strategyType === 'PHASED_ZONE') {
          // Phased floor priority
          const isFireFloor = fireLocations.some(f => Math.abs(agent.y - f.y) < 2.5);
          congestionPenalty = isFireFloor ? Math.pow(loadRatio, 1.5) * 30 : Math.pow(loadRatio, 2.3) * 70;
        }

        const jitter = (index % 11) * 0.3;

        const totalScore = distToStair + congestionPenalty + firePenalty + jitter;

        if (totalScore < minScore) {
          minScore = totalScore;
          bestExit = exit;
        }
      }

      if (bestExit) {
        bestExit.load++;

        // Determine stairwell core for upper floor descent
        let stairCoreId = bestExit.id;
        if (agent.floor > 1) {
          if (stairCoreId !== 'exit_west' && stairCoreId !== 'exit_east') {
            const westBlocked = blockedExitIds.includes('exit_west');
            const eastBlocked = blockedExitIds.includes('exit_east');
            if (westBlocked && !eastBlocked) stairCoreId = 'exit_east';
            else if (!westBlocked && eastBlocked) stairCoreId = 'exit_west';
            else stairCoreId = (agent.x < 0) ? 'exit_west' : 'exit_east';
          }
        }

        const stairEntry = this.stairwellEntries[stairCoreId] || this.stairwellEntries[bestExit.id];

        // 1. MUST ROUTE THROUGH ROOM'S PHYSICAL DOORWAY!
        // Retrieve designated 3-stage doorway waypoints (inside ➔ threshold ➔ corridor)
        const doorway = getRoomDoorway(agent.roomId);

        // Path 1: From agent's position inside room to inside doorway staging point
        const pathInsideRoom = this.pathfinder.findPath(agent.x, agent.z, doorway.inside.x, doorway.inside.z);

        // Path 2: From corridor staging point along central corridor to stairwell
        const pathInCorridor = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, stairEntry.x, stairEntry.z);

        // Stitch together seamlessly
        const full3DPath = [];

        pathInsideRoom.forEach(pt => {
          full3DPath.push({ x: pt.x, y: agent.y, z: pt.z });
        });

        // Exact physical door transit (guaranteed zero wall clipping)
        full3DPath.push({ x: doorway.inside.x, y: agent.y, z: doorway.inside.z });
        full3DPath.push({ x: doorway.door.x, y: agent.y, z: doorway.door.z });
        full3DPath.push({ x: doorway.corridor.x, y: agent.y, z: doorway.corridor.z });

        pathInCorridor.forEach((pt, idx) => {
          if (idx > 0) {
            full3DPath.push({ x: pt.x, y: agent.y, z: pt.z });
          }
        });

        // 2. Realistic Multi-flight Switchback Staircase Descent down to Ground Floor
        if (agent.floor > 1) {
          const isWest = stairCoreId === 'exit_west';
          const flight1X = isWest ? -27.05 : 27.05;
          const flight2X = isWest ? -28.95 : 28.95;
          const landingX = isWest ? -26.4 : 26.4;

          for (let fl = agent.floor; fl >= 2; fl--) {
            const flBaseY = (fl - 1) * this.floorHeight;

            // 1. Step onto current Floor Landing
            full3DPath.push({ x: landingX, y: flBaseY + 0.175, z: 0.0 });

            // 2. Walk to Flight 1 Top (descending along -Z)
            full3DPath.push({ x: flight1X, y: flBaseY + 0.175, z: -0.75 });

            // 3. Step-by-step down Flight 1 to Mid-Landing
            full3DPath.push({ x: flight1X, y: flBaseY - 0.95 + 0.175, z: -1.75 });
            full3DPath.push({ x: flight1X, y: flBaseY - 1.90 + 0.175, z: -2.75 });

            // 4. Turn across Mid-Landing
            full3DPath.push({ x: flight2X, y: flBaseY - 1.90 + 0.175, z: -2.75 });

            // 5. Step-by-step down Flight 2 to Lower Floor Landing
            full3DPath.push({ x: flight2X, y: flBaseY - 2.85 + 0.175, z: -1.75 });
            full3DPath.push({ x: flight2X, y: flBaseY - 3.80 + 0.175, z: -0.75 });

            // 6. Arrive at lower Floor Landing
            full3DPath.push({ x: landingX, y: flBaseY - 3.80 + 0.175, z: 0.0 });
          }
        }

        // 3. Step out through the Ground Floor Emergency Exit into safety plaza & Muster Zone
        const isWest = bestExit.id === 'exit_west' || (agent.floor > 1 && stairCoreId === 'exit_west' && bestExit.id !== 'exit_south');
        const isEast = bestExit.id === 'exit_east' || (agent.floor > 1 && stairCoreId === 'exit_east' && bestExit.id !== 'exit_south');
        const isSouth = bestExit.id === 'exit_south';

        // Organic crowd dispersal jitter inside muster circle so people don't overlap
        const seed = agent.id ? agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 1;
        const jAngle = (seed % 100) * (Math.PI * 2 / 100);
        const jDist = 1.0 + ((seed * 7) % 35) * 0.1; // 1.0m to 4.5m radius inside muster ring
        const jitterX = Math.cos(jAngle) * jDist;
        const jitterZ = Math.sin(jAngle) * jDist;

        if (isWest) {
          full3DPath.push({ x: -29.2, y: 0.15, z: 0.0 });
          full3DPath.push({ x: -33.5, y: 0.15, z: 0.0 });
          full3DPath.push({ x: -38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
        } else if (isEast) {
          full3DPath.push({ x: 29.2, y: 0.15, z: 0.0 });
          full3DPath.push({ x: 33.5, y: 0.15, z: 0.0 });
          full3DPath.push({ x: 38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
        } else if (isSouth) {
          if (agent.floor > 1) {
            // Walk from Ground Landing along Ground Central Corridor to South Foyer
            full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 18.0 });
          }
          full3DPath.push({ x: 0.0, y: 0.15, z: 23.0 });
          full3DPath.push({ x: 0.0, y: 0.15, z: 28.5 });
          full3DPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
        }

        assignments.push({
          agentId: agent.id,
          exitId: bestExit.id,
          exitName: bestExit.name,
          exitColor: bestExit.color,
          path: full3DPath,
          targetExit: { x: bestExit.x, z: bestExit.z }
        });
      }
    });

    this.exits.forEach(exit => {
      if (exit.isBlocked) {
        exit.loadPercentage = 0;
        exit.status = 'BLOCKED / SMOKE COMPROMISED';
        bottlenecks.push(`⛔ ${exit.name} is BLOCKED by toxic smoke ingress - All occupants rerouted`);
        return;
      }

      const loadPercentage = Math.round((exit.load / exit.capacity) * 100);
      let status = 'OPTIMAL';
      if (loadPercentage > 120) {
        status = 'CRITICAL OVERLOAD';
        bottlenecks.push(`⚠️ Stampede Warning at ${exit.name}: ${exit.load}/${exit.capacity} queued (${loadPercentage}%)`);
      } else if (loadPercentage > 85) {
        status = 'HEAVY TRAFFIC';
      }

      exit.loadPercentage = loadPercentage;
      exit.status = status;
    });

    return {
      assignments,
      exitStats: this.exits.map(e => ({ ...e })),
      bottlenecks
    };
  }
}
