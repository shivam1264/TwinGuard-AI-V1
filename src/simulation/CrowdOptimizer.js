import { getRoomDoorway } from './Doorways.js';

export class CrowdOptimizer {
  constructor(navGrid, pathfinder) {
    this.navGrid = navGrid;
    this.pathfinder = pathfinder;
    this.floorHeight = 3.8; // Realistic commercial ceiling height

    this.exits = [
      { id: 'exit_west', name: 'West Gate / Stair Core A', x: -29.2, z: 0, capacity: 60, load: 0, color: '#00ff88', isBlocked: false },
      { id: 'exit_east', name: 'East Gate / Stair Core B', x: 29.2, z: 0, capacity: 60, load: 0, color: '#00f0ff', isBlocked: false },
      { id: 'exit_south', name: 'Front / Main Gate (South)', x: 0, z: 23.5, capacity: 80, load: 0, color: '#9d4edd', isBlocked: false }
    ];

    this.stairwellEntries = {
      exit_west: { x: -26, z: 0 },
      exit_east: { x: 26, z: 0 },
      exit_south: { x: 0, z: 18 } // Ground floor south foyer
    };
  }

  optimizeRoutes(agents, fireLocations = [], blockedExitIds = [], strategyType = 'LOAD_BALANCED', floorBlockedMap = null) {
    // Global blocked exits (e.g. Ground Floor portals blocked by fire or global structural failure)
    const globalBlockedExits = new Set(blockedExitIds || []);

    // Floor-specific blocked exits: Map<floorNumber, Set<exitId>>
    const floorBlockedExits = new Map();
    const getFloorBlocked = (fl) => {
      if (!floorBlockedExits.has(fl)) floorBlockedExits.set(fl, new Set());
      return floorBlockedExits.get(fl);
    };

    // Populate explicit floor-specific blockages from scenario configuration
    if (floorBlockedMap) {
      Object.entries(floorBlockedMap).forEach(([flStr, exitIds]) => {
        const fl = parseInt(flStr, 10);
        if (Array.isArray(exitIds)) {
          exitIds.forEach(id => getFloorBlocked(fl).add(id));
        }
      });
    }

    // Dynamic Hazard Detection across floors (Case I: Ground Floor L1, Case II: Top Floor L10, Case III: Middle Floors L2 - L9)
    fireLocations.forEach(fire => {
      const fireFloor = fire.floor !== undefined ? fire.floor : (
        fire.roomId ? parseInt(fire.roomId.replace(/\D/g, '').slice(0, 2), 10) : (
          fire.y !== undefined ? (Math.floor(fire.y / this.floorHeight) + 1) : 1
        )
      );

      // --- CASE I: Ground Floor (L1) ---
      if (fireFloor === 1) {
        // Case I.A: Hazard near Front / Main Gate (Exit C / South Gate)
        const dSouth = Math.hypot((fire.x || 0) - 0.0, (fire.z || 0) - 20.0);
        if (dSouth <= 16.0 || ((fire.z || 0) >= 6.5 && Math.abs(fire.x || 0) <= 8.5) || fire.roomId === 'f1_r8' || fire.roomId === 'f1_r3') {
          globalBlockedExits.add('exit_south');
        }

        // Case I.B: Hazard near East Gate & East Stair (Exit B)
        const dEast = Math.hypot((fire.x || 0) - 27.5, (fire.z || 0) - 0.0);
        if (dEast <= 16.0 || ((fire.x || 0) >= 15.0 && Math.abs(fire.z || 0) <= 16.0) || fire.roomId === 'f1_r5' || fire.roomId === 'f1_r10') {
          globalBlockedExits.add('exit_east');
        }

        // Case I.C: Hazard near West Gate & West Stair (Exit A)
        const dWest = Math.hypot((fire.x || 0) - (-27.5), (fire.z || 0) - 0.0);
        if (dWest <= 16.0 || ((fire.x || 0) <= -15.0 && Math.abs(fire.z || 0) <= 16.0) || fire.roomId === 'f1_r1' || fire.roomId === 'f1_r6') {
          globalBlockedExits.add('exit_west');
        }
      }

      // --- CASE II: Top Floor (L10) ---
      if (fireFloor === 10) {
        // Case II: Hazard near East Stair on Level 10
        const dEast10 = Math.hypot((fire.x || 0) - 26.4, (fire.z || 0) - 0.0);
        if (dEast10 <= 16.0 || ((fire.x || 0) >= 14.0 && Math.abs(fire.z || 0) <= 16.0) || fire.roomId === 'f10_r5' || fire.roomId === 'f10_r10') {
          getFloorBlocked(10).add('exit_east');
        }

        // Case II: Hazard near West Stair on Level 10
        const dWest10 = Math.hypot((fire.x || 0) - (-26.4), (fire.z || 0) - 0.0);
        if (dWest10 <= 16.0 || ((fire.x || 0) <= -14.0 && Math.abs(fire.z || 0) <= 16.0) || fire.roomId === 'f10_r1' || fire.roomId === 'f10_r6') {
          getFloorBlocked(10).add('exit_west');
        }
      }

      // --- CASE III: Middle Floors (L2 - L9) ---
      if (fireFloor >= 2 && fireFloor <= 9) {
        // Case III: Hazard near East Stair on Middle Floor
        const dEastK = Math.hypot((fire.x || 0) - 26.4, (fire.z || 0) - 0.0);
        if (dEastK <= 16.0 || ((fire.x || 0) >= 14.0 && Math.abs(fire.z || 0) <= 16.0) || (fire.roomId && (fire.roomId.endsWith('_r5') || fire.roomId.endsWith('_r10')))) {
          getFloorBlocked(fireFloor).add('exit_east');
        }

        // Case III: Hazard near West Stair on Middle Floor
        const dWestK = Math.hypot((fire.x || 0) - (-26.4), (fire.z || 0) - 0.0);
        if (dWestK <= 16.0 || ((fire.x || 0) <= -14.0 && Math.abs(fire.z || 0) <= 16.0) || (fire.roomId && (fire.roomId.endsWith('_r1') || fire.roomId.endsWith('_r6')))) {
          getFloorBlocked(fireFloor).add('exit_west');
        }
      }
    });

    // Detect all active middle floor hazards (Floors 2 to 9)
    const middleHazards = [];
    for (let fl = 2; fl <= 9; fl++) {
      const blk = floorBlockedExits.get(fl);
      if (blk) {
        if (blk.has('exit_west') && !blk.has('exit_east')) {
          middleHazards.push({ floor: fl, hazardStair: 'exit_west', safeStair: 'exit_east' });
        } else if (blk.has('exit_east') && !blk.has('exit_west')) {
          middleHazards.push({ floor: fl, hazardStair: 'exit_east', safeStair: 'exit_west' });
        }
      }
    }

    // Reset load and sync blocked state for building-wide operational exits
    this.exits.forEach(e => {
      e.load = 0;
      e.isBlocked = globalBlockedExits.has(e.id);
      if (e.isBlocked) {
        e.status = 'BLOCKED / HAZARD AVOIDANCE ACTIVE';
      } else {
        e.status = 'OPERATIONAL';
      }
    });

    // Switchback staircase descent helper
    const appendStairFlightDescent = (path, fromFloor, toFloor, stairId) => {
      const isWest = stairId === 'exit_west';
      const flight1X = isWest ? -27.05 : 27.05;
      const flight2X = isWest ? -28.95 : 28.95;
      const landingX = isWest ? -26.4 : 26.4;

      for (let fl = fromFloor; fl > toFloor; fl--) {
        const flBaseY = (fl - 1) * this.floorHeight;

        // 1. Step onto current Floor Landing
        path.push({ x: landingX, y: flBaseY + 0.175, z: 0.0 });

        // 2. Walk to Flight 1 Top (descending along -Z)
        path.push({ x: flight1X, y: flBaseY + 0.175, z: -0.75 });

        // 3. Step-by-step down Flight 1 to Mid-Landing
        path.push({ x: flight1X, y: flBaseY - 0.95 + 0.175, z: -1.75 });
        path.push({ x: flight1X, y: flBaseY - 1.90 + 0.175, z: -2.75 });

        // 4. Turn across Mid-Landing
        path.push({ x: flight2X, y: flBaseY - 1.90 + 0.175, z: -2.75 });

        // 5. Step-by-step down Flight 2 to Lower Floor Landing
        path.push({ x: flight2X, y: flBaseY - 2.85 + 0.175, z: -1.75 });
        path.push({ x: flight2X, y: flBaseY - 3.80 + 0.175, z: -0.75 });

        // 6. Arrive at lower Floor Landing
        path.push({ x: landingX, y: flBaseY - 3.80 + 0.175, z: 0.0 });
      }
    };

    // Corridor crossover helper connecting West Core (x: -26.4) and East Core (x: +26.4) along Z = 0
    const appendCorridorCrossover = (path, floorNum, fromStairId, toStairId) => {
      const floorBaseY = (floorNum - 1) * this.floorHeight;
      const y = floorBaseY + 0.175;
      const westToEast = fromStairId === 'exit_west';
      const corridorX = westToEast
        ? [-26.4, -24.0, -18.0, -12.0, -6.0, 0.0, 6.0, 12.0, 18.0, 24.0, 26.4]
        : [26.4, 24.0, 18.0, 12.0, 6.0, 0.0, -6.0, -12.0, -18.0, -24.0, -26.4];

      corridorX.forEach(x => {
        path.push({ x, y, z: 0.0 });
      });
    };

    const bottlenecks = [];
    const assignments = [];

    agents.forEach((agent, index) => {
      let bestExit = null;
      let minScore = Infinity;

      const agentFloor = agent.floor || 1;
      const floorBlocked = floorBlockedExits.get(agentFloor) || new Set();

      // Available exits:
      // Ground floor (L1) can use any unblocked exit of the 3 (West, East, or Front/Main Gate).
      // Upper floors (L2 to L10) MUST egress via vertical Stairwell Cores (West Core A or East Core B).
      const floorCandidates = agentFloor === 1 ? this.exits : [this.exits[0], this.exits[1]];

      // Filter: Exit must NOT be globally blocked AND must NOT be blocked on THIS agent's floor!
      let availableExits = floorCandidates.filter(e => !globalBlockedExits.has(e.id) && !floorBlocked.has(e.id));

      // Strict fail-safe fallback
      if (availableExits.length === 0) {
        availableExits = floorCandidates;
      }

      for (const exit of availableExits) {
        const stairEntry = this.stairwellEntries[exit.id];
        const distToStair = Math.hypot(agent.x - stairEntry.x, agent.z - stairEntry.z);

        let firePenalty = 0;
        fireLocations.forEach(fire => {
          const fireY = fire.y !== undefined ? fire.y : ((fire.floor ? (fire.floor - 1) * this.floorHeight : 0) + 0.2);
          const sameFloor = Math.abs(agent.y - fireY) < 2.5;

          // Spatial hazard penalty only applies to occupants on the same floor as the fire
          if (sameFloor) {
            const distToFire = Math.hypot(stairEntry.x - (fire.x || 0), stairEntry.z - (fire.z || 0));
            if (distToFire < 9.0) {
              firePenalty += 700;
            }

            const agentToFire = Math.hypot(agent.x - (fire.x || 0), agent.z - (fire.z || 0));
            if (agentToFire < 8.0) {
              firePenalty += 350;
            }
          }
        });

        // Anti-Stampede Staircase Congestion Penalty based on Strategy
        const loadRatio = exit.capacity > 0 ? exit.load / exit.capacity : 999;
        let congestionPenalty = Math.pow(loadRatio, 2.2) * 55;

        if (strategyType === 'NEAREST_CORE') {
          // Uncontrolled rush: greedily heads to nearest exit
          congestionPenalty = 0;
        } else if (strategyType === 'DYNAMIC_CORE_BALANCING' || strategyType === 'LOAD_BALANCED') {
          // Dynamic load balancing with strong deterrence against oversubscribed exits
          congestionPenalty = Math.pow(loadRatio, 2.6) * 90;
        } else if (strategyType === 'PHASED_ZONE') {
          // Phased floor priority
          const isFireFloor = fireLocations.some(f => Math.abs(agent.y - (f.y || 0)) < 2.5);
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
          const westBlocked = globalBlockedExits.has('exit_west') || floorBlocked.has('exit_west');
          const eastBlocked = globalBlockedExits.has('exit_east') || floorBlocked.has('exit_east');

          if (stairCoreId !== 'exit_west' && stairCoreId !== 'exit_east') {
            if (westBlocked && !eastBlocked) stairCoreId = 'exit_east';
            else if (!westBlocked && eastBlocked) stairCoreId = 'exit_west';
            else stairCoreId = (agent.x < 0) ? 'exit_west' : 'exit_east';
          } else {
            // If designated stair is blocked on this agent's floor, divert to the unblocked stair
            if (stairCoreId === 'exit_west' && westBlocked && !eastBlocked) stairCoreId = 'exit_east';
            if (stairCoreId === 'exit_east' && eastBlocked && !westBlocked) stairCoreId = 'exit_west';
          }
        }

        const stairEntry = this.stairwellEntries[stairCoreId] || this.stairwellEntries[bestExit.id];

        // 1. MUST ROUTE THROUGH ROOM'S PHYSICAL DOORWAY!
        const full3DPath = [];

        if (agent.roomId) {
          const doorway = getRoomDoorway(agent.roomId);

          // Path 1: From agent's position inside room to inside doorway staging point
          const pathInsideRoom = this.pathfinder.findPath(agent.x, agent.z, doorway.inside.x, doorway.inside.z);

          // Path 2: From corridor staging point along central corridor to stairwell/exit entry
          const pathInCorridor = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, stairEntry.x, stairEntry.z);

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
        } else {
          // Fallback if agent is already in corridor / lobby
          const pathDirect = this.pathfinder.findPath(agent.x, agent.z, stairEntry.x, stairEntry.z);
          pathDirect.forEach(pt => {
            full3DPath.push({ x: pt.x, y: agent.y, z: pt.z });
          });
        }

        // 2. Realistic Multi-flight Switchback Staircase Descent down to Ground Floor
        let exitStairAtGround = stairCoreId;

        if (agent.floor > 1) {
          // Check if there is an active middle-floor hazard (L2 - L9) beneath or on this agent's floor
          const activeMidHazard = middleHazards.find(h => h.floor <= agent.floor);

          if (activeMidHazard && agent.floor === activeMidHazard.floor) {
            // --- CASE III.1: Fire Floor Occupants (agent.floor === activeMidHazard.floor, e.g. L7) ---
            // Occupant on fire floor avoids hazardous stair on this floor, uses safe stair (e.g. East stair)
            // 1. Descend safe stair from fire floor down past the fire to floor k - 1 (e.g. L7 -> L6)
            appendStairFlightDescent(full3DPath, activeMidHazard.floor, Math.max(1, activeMidHazard.floor - 1), activeMidHazard.safeStair);

            // 2. Once below fire floor (at floor k - 1), distribute between both stairs down to Ground!
            if (activeMidHazard.floor - 1 > 1) {
              const shouldRedistribute = (index % 2 === 1);
              if (shouldRedistribute) {
                // Cross over via Floor (k - 1) corridor from safe stair to other stair
                appendCorridorCrossover(full3DPath, activeMidHazard.floor - 1, activeMidHazard.safeStair, activeMidHazard.hazardStair);
                appendStairFlightDescent(full3DPath, activeMidHazard.floor - 1, 1, activeMidHazard.hazardStair);
                exitStairAtGround = activeMidHazard.hazardStair;
              } else {
                appendStairFlightDescent(full3DPath, activeMidHazard.floor - 1, 1, activeMidHazard.safeStair);
                exitStairAtGround = activeMidHazard.safeStair;
              }
            } else {
              exitStairAtGround = activeMidHazard.safeStair;
            }
          } else if (activeMidHazard && agent.floor > activeMidHazard.floor) {
            // --- CASE III.2: Upper Floor Occupants (agent.floor > activeMidHazard.floor, e.g. L8 - L10 when fire is on L7) ---
            // Occupants initially distribute across both stairs on their starting floor
            if (stairCoreId === activeMidHazard.safeStair) {
              // Safe stair is completely unobstructed all the way down!
              appendStairFlightDescent(full3DPath, agent.floor, 1, activeMidHazard.safeStair);
              exitStairAtGround = activeMidHazard.safeStair;
            } else {
              // Occupants descending the compromised stair (e.g. West stair):
              // 1. Descend normally down to Floor k + 1 (e.g. L8)
              if (agent.floor > activeMidHazard.floor + 1) {
                appendStairFlightDescent(full3DPath, agent.floor, activeMidHazard.floor + 1, activeMidHazard.hazardStair);
              }

              // 2. At Floor k + 1 (e.g. L8 landing), avoid entering Floor k hazard!
              // Crossover via Floor k + 1 central corridor from compromised stair to safe stair:
              appendCorridorCrossover(full3DPath, activeMidHazard.floor + 1, activeMidHazard.hazardStair, activeMidHazard.safeStair);

              // 3. Descend safe stair (e.g. East stair) past Floor k down to Floor k - 1 (e.g. L6)
              appendStairFlightDescent(full3DPath, activeMidHazard.floor + 1, Math.max(1, activeMidHazard.floor - 1), activeMidHazard.safeStair);

              // 4. At Floor k - 1 (e.g. L6), both stairs are clear, so distribute between both stairs down to Ground!
              if (activeMidHazard.floor - 1 > 1) {
                const shouldRedistribute = (index % 2 === 1);
                if (shouldRedistribute) {
                  appendCorridorCrossover(full3DPath, activeMidHazard.floor - 1, activeMidHazard.safeStair, activeMidHazard.hazardStair);
                  appendStairFlightDescent(full3DPath, activeMidHazard.floor - 1, 1, activeMidHazard.hazardStair);
                  exitStairAtGround = activeMidHazard.hazardStair;
                } else {
                  appendStairFlightDescent(full3DPath, activeMidHazard.floor - 1, 1, activeMidHazard.safeStair);
                  exitStairAtGround = activeMidHazard.safeStair;
                }
              } else {
                exitStairAtGround = activeMidHazard.safeStair;
              }
            }
          } else {
            // --- Normal / Unaffected Floor Descent (Floors 2 to k - 1, or when no middle hazard active) ---
            appendStairFlightDescent(full3DPath, agent.floor, 1, stairCoreId);
            exitStairAtGround = stairCoreId;
          }
        }

        // 3. Step out through Ground Floor Emergency Exit into safety plaza & Muster Zone
        const actualExitId = (agent.floor > 1 && bestExit.id !== 'exit_south') ? exitStairAtGround : bestExit.id;
        const actualExit = this.exits.find(e => e.id === actualExitId) || bestExit;

        const isWest = actualExit.id === 'exit_west';
        const isEast = actualExit.id === 'exit_east';
        const isSouth = actualExit.id === 'exit_south';

        // Organic crowd dispersal jitter inside muster circle so people don't overlap
        const seed = agent.id ? agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : index;
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
            const fromLandingX = exitStairAtGround === 'exit_west' ? -26.4 : 26.4;
            full3DPath.push({ x: fromLandingX, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 18.0 });
          }
          full3DPath.push({ x: 0.0, y: 0.15, z: 23.0 });
          full3DPath.push({ x: 0.0, y: 0.15, z: 28.5 });
          full3DPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
        }

        assignments.push({
          agentId: agent.id,
          exitId: actualExit.id,
          exitName: actualExit.name,
          exitColor: actualExit.color,
          path: full3DPath,
          targetExit: { x: actualExit.x, z: actualExit.z }
        });
      }
    });

    // Recalculate loads on operational exits from assignments
    this.exits.forEach(e => {
      e.load = assignments.filter(a => a.exitId === e.id).length;
    });

    // Report floor-specific stairwell alerts
    if (floorBlockedExits.has(10)) {
      const blocked10 = floorBlockedExits.get(10);
      if (blocked10.has('exit_east')) {
        bottlenecks.push('⛔ Level 10 (Penthouse) East Stairwell access is BLOCKED by fire - Level 10 occupants rerouted via West Core A (lower floors unaffected)');
      }
      if (blocked10.has('exit_west')) {
        bottlenecks.push('⛔ Level 10 (Penthouse) West Stairwell access is BLOCKED by fire - Level 10 occupants rerouted via East Core B (lower floors unaffected)');
      }
    }

    // Report middle-floor stairwell alerts
    middleHazards.forEach(hz => {
      const stairName = hz.hazardStair === 'exit_west' ? 'West Core A' : 'East Core B';
      const safeName = hz.safeStair === 'exit_west' ? 'West Core A' : 'East Core B';
      bottlenecks.push(`⚠️ Level ${hz.floor} ${stairName} COMPROMISED - L${hz.floor} occupants routed via ${safeName}; upper floors (L${hz.floor + 1}-L10) transfer at L${hz.floor + 1} corridor to ${safeName} past fire to L${Math.max(1, hz.floor - 1)}`);
    });

    // Check exit load status for operational gates
    this.exits.forEach(exit => {
      if (exit.isBlocked) {
        exit.loadPercentage = 0;
        exit.status = 'BLOCKED / HAZARD AVOIDANCE ACTIVE';
        bottlenecks.push(`⛔ ${exit.name} is BLOCKED due to nearby hazard - All occupants rerouted via other gates`);
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
