import { getRoomDoorway } from './Doorways.js';
import { ROUTE_CONDITIONS, getExitRouteCondition } from './RoutingHazardAdapter.js';

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

  optimizeRoutes(agents, fireLocations = [], blockedExitIds = [], strategyType = 'LOAD_BALANCED', floorBlockedMap = null, structuralCollapse = null, onAssignmentBatch = null) {
    // Backward-compatible: support options-object calling convention
    // optimizeRoutes(agents, fireLocations, { blockedExitIds, strategyType, routingContext, floorBlockedMap })
    let routingContext = null;
    if (blockedExitIds !== null && typeof blockedExitIds === 'object' && !Array.isArray(blockedExitIds)) {
      const options = blockedExitIds;
      blockedExitIds = options.blockedExitIds || [];
      strategyType = options.strategyType ?? 'LOAD_BALANCED';
      floorBlockedMap = options.floorBlockedMap ?? null;
      routingContext = options.routingContext || null;
      structuralCollapse = options.structuralCollapse ?? structuralCollapse;
    }

    // Synchronize all active fire zones into NavGrid so that pathfinder and isWalkable enforce fire avoidance
    if (this.navGrid && typeof this.navGrid.setFireZone === 'function') {
      if (typeof this.navGrid.clearAllFireZones === 'function') {
        this.navGrid.clearAllFireZones();
      }
      if (Array.isArray(fireLocations)) {
        fireLocations.forEach(fire => {
          const fX = fire.x || 0;
          const fZ = fire.z || 0;
          let fFloor = fire.floor;
          if (fFloor === undefined && fire.y !== undefined) {
            fFloor = Math.floor(fire.y / this.floorHeight) + 1;
          }
          if (fFloor === undefined && fire.roomId) {
            const match = fire.roomId.match(/f(\d+)/i) || fire.roomId.match(/l(\d+)/i);
            if (match) fFloor = parseInt(match[1], 10);
          }
          this.navGrid.setFireZone(fX, fZ, fire.radius || 5.0, fFloor ?? null);
        });
      }
    }

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

    // ── STRUCTURAL DEBRIS COLLAPSE (e.g. Corridor C-101 on Level 4) ──
    // The rubble severs the collapsed segment's connection to its nearest
    // stair core for THAT FLOOR ONLY — occupants on the affected floor are
    // diverted to the opposite core (e.g. East Core B), while all other
    // floors keep both stairs. Feeds the middle-floor hazard logic below,
    // so agents visibly turn around and take the safe alternative core.
    const collapseZones = Array.isArray(structuralCollapse)
      ? structuralCollapse.filter((z) => z && typeof z.floor === 'number')
      : (structuralCollapse && typeof structuralCollapse === 'object' && typeof structuralCollapse.floor === 'number'
        ? [structuralCollapse]
        : []);
    collapseZones.forEach((cz) => {
      const b = cz.bounds || cz;
      const maxX = b.maxX !== undefined ? b.maxX : (cz.maxX !== undefined ? cz.maxX : 0);
      let blockedCore = cz.coreBlocked;
      if (!blockedCore) {
        if (cz.kind === 'CORRIDOR') blockedCore = maxX <= 0 ? 'exit_west' : 'exit_east';
        else if (cz.kind === 'STAIR') blockedCore = (cz.locId && cz.locId.includes('east')) ? 'exit_east' : 'exit_west';
        else if (cz.kind === 'EXIT') blockedCore = cz.locId;
        else blockedCore = maxX <= 0 ? 'exit_west' : 'exit_east';
      }
      if (cz.kind === 'EXIT' || cz.floor === 1) {
        globalBlockedExits.add(blockedCore);
      }
      getFloorBlocked(cz.floor).add(blockedCore);
    });
    // Primary zone for backward-compat references below
    const collapseZone = collapseZones.length ? collapseZones[0] : null;

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
      // Structural collapse severs east-west corridor transit on its floor —
      // occupants keep to the stair core reachable from their side.
      if (collapseZones.some((cz) => cz.floor === floorNum)) return;
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
    const progressBatch = [];
    const hazardAware = routingContext?.availability?.available === true;
    let requiresOperatorReview = false;

    // Initialize tentative loads from live exit loads (updated each frame by SceneManager)
    const tentativeLoads = new Map();
    // Route caches live only for this planning pass. Grid hazards and
    // structural blocks can change between passes, so retaining these paths
    // would make later plans reuse stale routes.
    const corridorPathCache = new Map();
    const roomPathCache = new Map();
    this.exits.forEach(e => tentativeLoads.set(e.id, e.load || 0));

    agents.forEach((agent, index) => {
      // Ignore occupants who have already safely evacuated outside the building
      if (agent.state === 'SAFE' || agent.isEvacuated) {
        return;
      }

      let bestExit = null;
      let bestRoute = null;
      let bestScore = Infinity;
      let fallbackAssignment = false;

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

      const candidates = [];

      // Pre-compute doorway and seed for path building
      const doorway = getRoomDoorway(agent.roomId);
      const seed = agent.id ? agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 1;

      // Determine PHASED_ZONE delay based on fire floor and agent floor
      let delayTimer = 0;
      if (strategyType === 'PHASED_ZONE' && fireLocations.length > 0) {
        // Determine fire floor from fire locations
        const fireFloor = Math.round(fireLocations[0].y / 3.8) + 1;
        const agentFloor = agent.floor || 1;
        const floorDiff = Math.abs(agentFloor - fireFloor);

        if (floorDiff === 0) {
          // Fire floor - immediate evacuation (1-2s delay)
          delayTimer = 1.0 + Math.random() * 1.0;
        } else if (floorDiff === 1) {
          // Adjacent floor - secondary priority (3-6s delay)
          delayTimer = 3.0 + Math.random() * 3.0;
        } else {
          // Other floors - sheltered in place (45-51s delay)
          delayTimer = 45.0 + Math.random() * 6.0;
        }
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
            const fX = fire.x || 0;
            const fZ = fire.z || 0;
            const distToFire = Math.hypot(stairEntry.x - fX, stairEntry.z - fZ);
            if (distToFire < 9.0) {
              firePenalty += 50000;
            }

            // Central corridor fire interception check:
            // If fire is in or encroaching the central corridor (|fZ| <= 3.5),
            // check if it lies between this agent's doorway and this exit entry along the corridor!
            const isCorridorFire = Math.abs(fZ) <= 3.5;
            if (isCorridorFire) {
              const targetX = stairEntry.x;
              const agentX = doorway?.corridor?.x !== undefined ? doorway.corridor.x : agent.x;
              const minX = Math.min(agentX, targetX) - 1.2;
              const maxX = Math.max(agentX, targetX) + 1.2;
              if (fX >= minX && fX <= maxX) {
                // Impassable: fire directly blocks the corridor path to this exit
                firePenalty += 50000;
              }
            }

            const agentToFire = Math.hypot(agent.x - fX, agent.z - fZ);
            if (agentToFire < 8.0) {
              firePenalty += 350;
            }
          }
        });

        // Anti-Stampede Staircase Congestion Penalty based on Strategy
        const tentativeLoad = tentativeLoads.get(exit.id) || 0;
        const loadRatio = exit.capacity > 0 ? tentativeLoad / exit.capacity : 999;
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
        const baselineScore = totalScore;
        const route = hazardAware ? getExitRouteCondition(routingContext, agent.floor, exit.id) : null;

        candidates.push({
          exit,
          baselineScore,
          route,
          score: baselineScore + (route?.cost || 0)
        });
      }

      const permittedCandidates = candidates.filter(
        candidate => candidate.route?.condition !== ROUTE_CONDITIONS.PROHIBITED
      );
      const candidatePool = permittedCandidates.length > 0 ? permittedCandidates : candidates;

      // Rank viable exits by precomputed score without computing full 3D paths for rejected candidates
      candidatePool.sort((a, b) => {
        const scoreA = permittedCandidates.length > 0 ? a.score : a.baselineScore;
        const scoreB = permittedCandidates.length > 0 ? b.score : b.baselineScore;
        return scoreA - scoreB;
      });

      // Primary route is the best one
      const bestCandidate = candidatePool[0];
      bestExit = bestCandidate.exit;
      bestRoute = bestCandidate.route;
      bestScore = permittedCandidates.length > 0 ? bestCandidate.score : bestCandidate.baselineScore;

      if (bestExit) {
        if (hazardAware && permittedCandidates.length === 0) {
          fallbackAssignment = true;
          requiresOperatorReview = true;
        }

        // Only increment tentative load if agent is new or changing exits
        const isNewAgent = !agent.currentExitId;
        const isChangingExit = agent.currentExitId && agent.currentExitId !== bestExit.id;
        if (isNewAgent || isChangingExit) {
          tentativeLoads.set(bestExit.id, (tentativeLoads.get(bestExit.id) || 0) + 1);
        }
        // If agent keeps same exit, live load already accounts for them

        // If changing exits, decrement old exit's tentative load
        if (isChangingExit && agent.currentExitId) {
          tentativeLoads.set(agent.currentExitId, Math.max(0, (tentativeLoads.get(agent.currentExitId) || 0) - 1));
        }

        // Determine stairwell core / exit for descent and egress
        let stairCoreId = bestExit.id;

        // Check if corridor fire on agent's floor blocks West, East, or South route
        const isCorridorRouteBlocked = (targetExitId) => {
          const targetX = targetExitId === 'exit_west' ? -26.0 : (targetExitId === 'exit_east' ? 26.0 : 0.0);
          const agentX = doorway?.corridor?.x !== undefined ? doorway.corridor.x : agent.x;
          const minX = Math.min(agentX, targetX) - 1.2;
          const maxX = Math.max(agentX, targetX) + 1.2;
          return fireLocations.some(f => {
            const fireY = f.y !== undefined ? f.y : ((f.floor ? (f.floor - 1) * this.floorHeight : 0) + 0.2);
            const fireFl = f.floor !== undefined ? Number(f.floor) : (Math.floor(fireY / this.floorHeight) + 1);
            const sameFloor = (agentFloor === fireFl) || Math.abs(agent.y - fireY) < 2.5;
            if (!sameFloor) return false;
            const fX = f.x || 0;
            const fZ = f.z || 0;
            if (targetExitId === 'exit_south') {
              const inCorridorToFoyer = Math.abs(fZ) <= 3.5 && (fX >= Math.min(agentX, 0.0) - 1.2 && fX <= Math.max(agentX, 0.0) + 1.2);
              const inSouthFoyer = Math.hypot(fX, fZ - 20.0) < 14.0;
              return inCorridorToFoyer || inSouthFoyer;
            }
            const nearStair = Math.hypot(targetX - fX, 0 - fZ) < 9.0;
            const inCorridorBetween = Math.abs(fZ) <= 3.5 && (fX >= minX && fX <= maxX);
            return nearStair || inCorridorBetween;
          });
        };

        const westFireBlocked = isCorridorRouteBlocked('exit_west');
        const eastFireBlocked = isCorridorRouteBlocked('exit_east');

        if (agent.floor > 1) {
          const westBlocked = globalBlockedExits.has('exit_west') || floorBlocked.has('exit_west');
          const eastBlocked = globalBlockedExits.has('exit_east') || floorBlocked.has('exit_east');

          const effectiveWestBlocked = westBlocked || westFireBlocked;
          const effectiveEastBlocked = eastBlocked || eastFireBlocked;

          if (stairCoreId !== 'exit_west' && stairCoreId !== 'exit_east') {
            if (effectiveWestBlocked && !effectiveEastBlocked) stairCoreId = 'exit_east';
            else if (!effectiveWestBlocked && effectiveEastBlocked) stairCoreId = 'exit_west';
            else stairCoreId = (agent.x < 0) ? 'exit_west' : 'exit_east';
          } else {
            // If designated stair is blocked on this agent's floor, divert to the unblocked stair
            if (stairCoreId === 'exit_west' && effectiveWestBlocked && !effectiveEastBlocked) stairCoreId = 'exit_east';
            if (stairCoreId === 'exit_east' && effectiveEastBlocked && !effectiveWestBlocked) stairCoreId = 'exit_west';
          }

          if (bestExit.id !== stairCoreId) {
            const matchingExit = this.exits.find(e => e.id === stairCoreId);
            if (matchingExit) bestExit = matchingExit;
          }
        } else {
          // Ground floor (L1): check corridor fire and divert if current chosen exit is blocked
          const westBlocked = globalBlockedExits.has('exit_west') || westFireBlocked;
          const eastBlocked = globalBlockedExits.has('exit_east') || eastFireBlocked;
          const southBlocked = globalBlockedExits.has('exit_south') || isCorridorRouteBlocked('exit_south');

          if (bestExit.id === 'exit_west' && westBlocked) {
            if (!eastBlocked) stairCoreId = 'exit_east';
            else if (!southBlocked) stairCoreId = 'exit_south';
          } else if (bestExit.id === 'exit_east' && eastBlocked) {
            if (!westBlocked) stairCoreId = 'exit_west';
            else if (!southBlocked) stairCoreId = 'exit_south';
          } else if (bestExit.id === 'exit_south' && southBlocked) {
            if (!westBlocked && !eastBlocked) stairCoreId = (agent.x < 0) ? 'exit_west' : 'exit_east';
            else if (!westBlocked) stairCoreId = 'exit_west';
            else if (!eastBlocked) stairCoreId = 'exit_east';
          }

          if (bestExit.id !== stairCoreId) {
            const matchingExit = this.exits.find(e => e.id === stairCoreId);
            if (matchingExit) bestExit = matchingExit;
          }
        }

        const stairEntry = this.stairwellEntries[stairCoreId] || this.stairwellEntries[bestExit.id];

        // 1. MUST ROUTE THROUGH ROOM'S PHYSICAL DOORWAY!
        const full3DPath = [];

        // Floor-aware routing context: NavGrid treats debris and active fires
        // as unwalkable for THIS floor during this agent's path query.
        if (this.navGrid) this.navGrid.routeFloor = agentFloor;

        if (agent.roomId) {
          const doorway = getRoomDoorway(agent.roomId);

          // Path 1: From agent's position inside room to inside doorway staging point (cached)
          const roomCacheKey = `${agentFloor}:${agent.x.toFixed(1)},${agent.z.toFixed(1)}->${doorway.inside.x},${doorway.inside.z}`;
          let pathInsideRoom = roomPathCache.get(roomCacheKey);
          if (!pathInsideRoom) {
            // Direct geometric room egress: from desk forward to door align Z, then to doorway
            pathInsideRoom = [
              { x: agent.x, z: agent.z },
              { x: agent.x, z: doorway.inside.z },
              { x: doorway.inside.x, z: doorway.inside.z }
            ];
            roomPathCache.set(roomCacheKey, pathInsideRoom);
          }

          // Path 2: From corridor staging point along central corridor to stairwell/exit entry
          let effectiveStairEntry = stairEntry;
          let pathInCorridor = null;

          if (agentFloor === 1 && (bestExit.id === 'exit_south' || stairCoreId === 'exit_south')) {
            // Precise ground floor architectural corridor-to-foyer routing
            pathInCorridor = [
              { x: doorway.corridor.x, z: 0.0 },
              { x: 0.0, z: 0.0 },
              { x: 0.0, z: 2.6 },
              { x: 0.0, z: 18.0 }
            ];
          } else {
            const corridorCacheKey = `${agentFloor}:${doorway.corridor.x},${doorway.corridor.z}->${effectiveStairEntry.x},${effectiveStairEntry.z}`;
            pathInCorridor = corridorPathCache.get(corridorCacheKey);
            if (!pathInCorridor) {
              const directCorridor = [
                { x: doorway.corridor.x, z: 0.0 },
                { x: effectiveStairEntry.x, z: 0.0 }
              ];
              if (this.pathfinder && this.pathfinder.isPathClear && this.pathfinder.isPathClear(directCorridor)) {
                pathInCorridor = directCorridor;
              } else {
                pathInCorridor = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, effectiveStairEntry.x, effectiveStairEntry.z);
              }
              if (pathInCorridor && pathInCorridor.length > 0) {
                corridorPathCache.set(corridorCacheKey, pathInCorridor);
              }
            }
            const isCorridorPathClear = (p) => {
              if (!p || p.length === 0 || p.isFallback) return false;
              if (this.pathfinder && this.pathfinder.isPathClear) {
                return this.pathfinder.isPathClear(p);
              }
              return true;
            };

            if (!isCorridorPathClear(pathInCorridor)) {
              if (agentFloor > 1) {
                const altStairId = stairCoreId === 'exit_west' ? 'exit_east' : 'exit_west';
                const altStairEntry = this.stairwellEntries[altStairId];
                if (altStairEntry) {
                  const altCacheKey = `${agentFloor}:${doorway.corridor.x},${doorway.corridor.z}->${altStairEntry.x},${altStairEntry.z}`;
                  let altPath = corridorPathCache.get(altCacheKey);
                  if (!altPath) {
                    const directAlt = [
                      { x: doorway.corridor.x, z: 0.0 },
                      { x: altStairEntry.x, z: 0.0 }
                    ];
                    if (this.pathfinder && this.pathfinder.isPathClear && this.pathfinder.isPathClear(directAlt)) {
                      altPath = directAlt;
                    } else {
                      altPath = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, altStairEntry.x, altStairEntry.z);
                    }
                    if (altPath && altPath.length > 0) corridorPathCache.set(altCacheKey, altPath);
                  }
                  if (isCorridorPathClear(altPath)) {
                    stairCoreId = altStairId;
                    effectiveStairEntry = altStairEntry;
                    pathInCorridor = altPath;
                    const matchingExit = this.exits.find(e => e.id === altStairId);
                    if (matchingExit) bestExit = matchingExit;
                  }
                }
              } else {
                // Ground floor (L1): corridor path blocked, divert to safe exit (East, West, or South)
                const safeCandidateIds = ['exit_east', 'exit_west', 'exit_south'].filter(id => id !== bestExit.id && !isCorridorRouteBlocked(id));
                for (const altExitId of safeCandidateIds) {
                  const altEntry = this.stairwellEntries[altExitId];
                  let altPath = null;
                  if (altExitId === 'exit_south') {
                    altPath = [
                      { x: doorway.corridor.x, z: 0.0 },
                      { x: 0.0, z: 0.0 },
                      { x: 0.0, z: 2.6 },
                      { x: 0.0, z: 18.0 }
                    ];
                  } else {
                    altPath = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, altEntry.x, altEntry.z);
                  }
                  if (isCorridorPathClear(altPath)) {
                    stairCoreId = altExitId;
                    effectiveStairEntry = altEntry;
                    pathInCorridor = altPath;
                    const matchingExit = this.exits.find(e => e.id === altExitId);
                    if (matchingExit) bestExit = matchingExit;
                    break;
                  }
                }
              }
            }
          }

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

        // Clear the transient floor context for the next agent
        if (this.navGrid) this.navGrid.routeFloor = null;

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
        let actualExitId = (agent.floor > 1 && bestExit.id !== 'exit_south') ? exitStairAtGround : bestExit.id;
        if (globalBlockedExits.has(actualExitId)) {
          const safeFallback = ['exit_south', 'exit_east', 'exit_west'].find(eId => !globalBlockedExits.has(eId));
          if (safeFallback) actualExitId = safeFallback;
        }
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
          if (agent.floor > 1 && exitStairAtGround === 'exit_east') {
            full3DPath.push({ x: 26.4, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
            full3DPath.push({ x: -26.4, y: 0.15, z: 0.0 });
          }
          full3DPath.push({ x: -29.2, y: 0.15, z: 0.0 });
          full3DPath.push({ x: -33.5, y: 0.15, z: 0.0 });
          full3DPath.push({ x: -38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
        } else if (isEast) {
          if (agent.floor > 1 && exitStairAtGround === 'exit_west') {
            full3DPath.push({ x: -26.4, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 26.4, y: 0.15, z: 0.0 });
          }
          full3DPath.push({ x: 29.2, y: 0.15, z: 0.0 });
          full3DPath.push({ x: 33.5, y: 0.15, z: 0.0 });
          full3DPath.push({ x: 38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
        } else if (isSouth) {
          if (agent.floor > 1) {
            // Walk from Ground Landing along Ground Central Corridor to South Foyer
            const fromLandingX = exitStairAtGround === 'exit_west' ? -26.4 : 26.4;
            full3DPath.push({ x: fromLandingX, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 2.6 });
            full3DPath.push({ x: 0.0, y: 0.15, z: 18.0 });
          }
          full3DPath.push({ x: 0.0, y: 0.15, z: 23.0 });
          full3DPath.push({ x: 0.0, y: 0.15, z: 28.5 });
          full3DPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
        }

        const assignment = {
          agentId: agent.id,
          exitId: actualExit.id,
          exitName: actualExit.name,
          exitColor: actualExit.color,
          path: full3DPath,
          targetExit: { x: actualExit.x, z: actualExit.z },
          hazardAware,
          routeEvaluation: hazardAware ? 'hazard-aware' : 'unverified',
          routeCondition: bestRoute?.condition || null,
          routeReasons: bestRoute?.reasons || [],
          noPermittedCandidate: fallbackAssignment,
          requiresOperatorReview: fallbackAssignment,
          delayTimer: delayTimer,
          alternatives: candidatePool
            .filter(c => c.exit.id !== actualExit.id)
            .map(c => {
              const altPath = this.buildFull3DPath(agent, c.exit, doorway, this.stairwellEntries[c.exit.id], seed, corridorPathCache, roomPathCache);
              return {
                exitId: c.exit.id,
                exitName: c.exit.name,
                exitColor: c.exit.color,
                path: altPath,
                score: permittedCandidates.length > 0 ? c.score : c.baselineScore,
                routeCondition: c.route?.condition || null,
                routeReasons: c.route?.reasons || []
              };
            })
        };
        assignments.push(assignment);
        if (onAssignmentBatch) {
          progressBatch.push(assignment);
          if (progressBatch.length >= 8) onAssignmentBatch(progressBatch.splice(0));
        }
      }
    });

    if (onAssignmentBatch && progressBatch.length) onAssignmentBatch(progressBatch.splice(0));

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
      bottlenecks,
      hazardAware,
      routingContextStatus: routingContext?.status || 'unavailable',
      routingContextReason: routingContext?.availability?.reason || null,
      routeEvaluation: hazardAware ? 'hazard-aware' : 'unverified',
      requiresOperatorReview
    };
  }

  // Phase 5C: Reevaluate routes while preserving agent progress
  // Only reassign agents whose current route is prohibited, or who haven't made significant progress
  reevaluateRoutes(agents, currentAssignments, fireLocations = [], options = {}) {
    const { blockedExitIds = [] } = options;
    // Compute live exit loads from agents currently targeting each exit (not SAFE)
    this._updateLiveExitLoads(agents);
    this.exits.forEach(e => {
      e.isBlocked = blockedExitIds.includes(e.id);
      if (e.isBlocked) {
        e.status = 'BLOCKED / SMOKE COMPROMISED';
      }
    });

    // Synchronize all active fire zones into NavGrid so that pathfinder and isWalkable enforce fire avoidance
    if (this.navGrid && typeof this.navGrid.setFireZone === 'function') {
      if (typeof this.navGrid.clearAllFireZones === 'function') {
        this.navGrid.clearAllFireZones();
      }
      if (Array.isArray(fireLocations)) {
        fireLocations.forEach(fire => {
          const fX = fire.x || 0;
          const fZ = fire.z || 0;
          let fFloor = fire.floor;
          if (fFloor === undefined && fire.y !== undefined) {
            fFloor = Math.floor(fire.y / this.floorHeight) + 1;
          }
          if (fFloor === undefined && fire.roomId) {
            const match = fire.roomId.match(/f(\d+)/i) || fire.roomId.match(/l(\d+)/i);
            if (match) fFloor = parseInt(match[1], 10);
          }
          this.navGrid.setFireZone(fX, fZ, fire.radius || 5.0, fFloor ?? null);
        });
      }
    }
    const bottlenecks = [];
    const assignments = [];
    let routingContext = null;
    if (options) {
      routingContext = options.routingContext || null;
    }
    const hazardAware = routingContext?.availability?.available === true;
    let requiresOperatorReview = false;

    // Initialize tentative loads from live exit loads (updated each frame by SceneManager)
    const tentativeLoads = new Map();
    this.exits.forEach(e => tentativeLoads.set(e.id, e.load || 0));

    // Scoped sub-path caches for this reevaluation pass to avoid repeated graph searches
    const corridorPathCache = new Map();
    const roomPathCache = new Map();

    // Build a map of current assignments for quick lookup
    const currentAssignmentMap = new Map();
    if (currentAssignments) {
      currentAssignments.forEach(a => currentAssignmentMap.set(a.agentId, a));
    }

    agents.forEach((agent, index) => {
      // Skip completed agents - they should not be reassigned
      if (agent.state === 'SAFE') {
        return;
      }
      let bestExit = null;
      let bestRoute = null;
      let bestScore = Infinity;
      let fallbackAssignment = false;

      const doorway = getRoomDoorway(agent.roomId);
      const currentAssignment = currentAssignmentMap.get(agent.id);
      const hasCurrentRoute = currentAssignment && currentAssignment.path && currentAssignment.path.length > 0;
      const currentExitId = currentAssignment?.exitId;
      const currentRouteCondition = currentAssignment?.routeCondition;
      const currentProgress = currentAssignment?.currentWaypointIdx || 0;
      const currentPathLength = currentAssignment?.path?.length || 0;
      const progressRatio = currentPathLength > 0 ? currentProgress / currentPathLength : 0;

      // Available exits: Upper floors (L2 to L10) must use stairwell towers (West or East)
      // Ground floor (L1) can use West, East, or South Grand Exit!
      const floorExits = agent.floor === 1 ? this.exits : [this.exits[0], this.exits[1]];
      let availableExits = floorExits.filter(e => !e.isBlocked);

      // Fallback: If both floor stairwells are compromised, fallback to any operational exit
      const allOperational = this.exits.filter(e => !e.isBlocked);
      if (availableExits.length === 0) {
        availableExits = allOperational.length > 0 ? allOperational : this.exits;
      }

      const candidates = [];

      // Check if current route is still valid
      // Keep route stable from the very first step so agents do not flip exits at the room doorway
      const currentRouteStillValid = currentExitId &&
        availableExits.some(e => e.id === currentExitId) &&
        currentRouteCondition !== ROUTE_CONDITIONS.PROHIBITED;

      for (const exit of availableExits) {
        const stairEntry = this.stairwellEntries[exit.id];
        const distToStair = Math.hypot(agent.x - stairEntry.x, agent.z - stairEntry.z);

        let firePenalty = 0;
        fireLocations.forEach(fire => {
          const fireY = fire.y !== undefined ? fire.y : ((fire.floor ? (fire.floor - 1) * this.floorHeight : 0) + 0.2);
          const sameFloor = Math.abs(agent.y - fireY) < 2.5;
          const distToFire = Math.hypot(stairEntry.x - (fire.x || 0), stairEntry.z - (fire.z || 0));

          if (distToFire < 9.0) {
            firePenalty += 50000;
          }

          if (sameFloor) {
            const fX = fire.x || 0;
            const fZ = fire.z || 0;
            const isCorridorFire = Math.abs(fZ) <= 3.5;
            if (isCorridorFire) {
              const targetX = stairEntry.x;
              const agentX = doorway?.corridor?.x !== undefined ? doorway.corridor.x : agent.x;
              const minX = Math.min(agentX, targetX) - 1.2;
              const maxX = Math.max(agentX, targetX) + 1.2;
              if (fX >= minX && fX <= maxX) {
                // Impassable: fire directly blocks the corridor path to this exit
                firePenalty += 50000;
              }
            }

            const agentToFire = Math.hypot(agent.x - fX, agent.z - fZ);
            if (agentToFire < 8.0) {
              firePenalty += 350;
            }
          }
        });

        // Anti-Stampede Staircase Congestion Penalty
        const tentativeLoad = tentativeLoads.get(exit.id) || 0;
        const loadRatio = tentativeLoad / exit.capacity;
        const congestionPenalty = Math.pow(loadRatio, 2.2) * 55;
        const jitter = (index % 11) * 0.3;

        const baselineScore = distToStair + congestionPenalty + firePenalty + jitter;
        const route = hazardAware ? getExitRouteCondition(routingContext, agent.floor, exit.id) : null;

        // If this is the current exit and route is still valid, give a modest bonus to avoid minor churn
        const stickinessBonus = (exit.id === currentExitId && currentRouteStillValid) ? -8 : 0;

        candidates.push({
          exit,
          baselineScore,
          route,
          score: baselineScore + (route?.cost || 0) + stickinessBonus,
          isCurrentExit: exit.id === currentExitId
        });
      }

      const permittedCandidates = candidates.filter(
        candidate => candidate.route?.condition !== ROUTE_CONDITIONS.PROHIBITED
      );
      const candidatePool = permittedCandidates.length > 0 ? permittedCandidates : candidates;

      // If current exit is still valid and agent has made progress, prefer it only if not heavily penalized
      let useCurrentExit = false;
      if (currentExitId && currentRouteStillValid) {
        const currentCandidate = candidates.find(c => c.isCurrentExit);
        if (currentCandidate && currentCandidate.route?.condition !== ROUTE_CONDITIONS.PROHIBITED) {
          // Check if current exit is still among the best options
          const bestPermitted = permittedCandidates.length > 0
            ? permittedCandidates.reduce((best, c) => c.score < best.score ? c : best, permittedCandidates[0])
            : candidates.reduce((best, c) => c.score < best.score ? c : best, candidates[0]);

          // Keep current exit only if within 5% and not heavily burdened or hazard-penalized
          if (currentCandidate.score <= bestPermitted.score * 1.05 && currentCandidate.score < 1000) {
            useCurrentExit = true;
            bestExit = currentCandidate.exit;
            bestRoute = currentCandidate.route;
            bestScore = currentCandidate.score;
          }
        }
      }

      if (!useCurrentExit) {
        for (const candidate of candidatePool) {
          const score = permittedCandidates.length > 0 ? candidate.score : candidate.baselineScore;
          if (score < bestScore) {
            bestScore = score;
            bestExit = candidate.exit;
            bestRoute = candidate.route;
          }
        }
      }

      if (bestExit) {
        if (hazardAware && permittedCandidates.length === 0) {
          fallbackAssignment = true;
          requiresOperatorReview = true;
        }

        // Only increment tentative load if agent is new or changing exits
        const isNewAgent = !agent.currentExitId;
        const isChangingExit = agent.currentExitId && agent.currentExitId !== bestExit.id;
        if (isNewAgent || isChangingExit) {
          tentativeLoads.set(bestExit.id, (tentativeLoads.get(bestExit.id) || 0) + 1);
        }
        // If agent keeps same exit, live load already accounts for them

        // If changing exits, decrement old exit's tentative load
        if (isChangingExit && agent.currentExitId) {
          tentativeLoads.set(agent.currentExitId, Math.max(0, (tentativeLoads.get(agent.currentExitId) || 0) - 1));
        }

        // Build the path for the best exit
        const doorway = getRoomDoorway(agent.roomId);
        const stairEntry = this.stairwellEntries[bestExit.id];
        const seed = agent.id ? agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 1;
        const full3DPath = this.buildFull3DPath(agent, bestExit, doorway, stairEntry, seed, corridorPathCache, roomPathCache);

        assignments.push({
          agentId: agent.id,
          exitId: bestExit.id,
          exitName: bestExit.name,
          exitColor: bestExit.color,
          path: full3DPath,
          targetExit: { x: bestExit.x, z: bestExit.z },
          hazardAware,
          routeEvaluation: hazardAware ? 'hazard-aware' : 'unverified',
          routeCondition: bestRoute?.condition || null,
          routeReasons: bestRoute?.reasons || [],
          noPermittedCandidate: fallbackAssignment,
          requiresOperatorReview: fallbackAssignment,
          // Build alternative routes for other viable exits
          alternatives: candidatePool
            .filter(c => c.exit.id !== bestExit.id)
            .map(c => {
              const altPath = this.buildFull3DPath(agent, c.exit, doorway, this.stairwellEntries[c.exit.id], seed, corridorPathCache, roomPathCache);
              return {
                exitId: c.exit.id,
                exitName: c.exit.name,
                exitColor: c.exit.color,
                path: altPath,
                score: permittedCandidates.length > 0 ? c.score : c.baselineScore,
                routeCondition: c.route?.condition || null,
                routeReasons: c.route?.reasons || []
              };
            })
        });
      }
    });

    this.exits.forEach(exit => {
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
      bottlenecks,
      hazardAware,
      routingContextStatus: routingContext?.status || 'unavailable',
      routingContextReason: routingContext?.availability?.reason || null,
      routeEvaluation: hazardAware ? 'hazard-aware' : 'unverified',
      requiresOperatorReview
    };
  }

  /**
   * Update exit loads from live agent data.
   * Counts agents currently targeting each exit (not SAFE, has currentExitId).
   * Called at start of each optimization to reflect real-time congestion.
   */
  _updateLiveExitLoads(agents) {
    if (!agents || agents.length === 0) {
      return;
    }
    // If caller pre-set loads on exits (e.g. test harness or telemetry), preserve them
    const hasPreloadedLoads = this.exits.some(e => (e.load || 0) > agents.length);
    if (hasPreloadedLoads) return;

    // Reset loads first
    this.exits.forEach(e => { e.load = 0; });
    // Count agents targeting each exit
    for (const agent of agents) {
      if (agent.state === 'SAFE') continue;
      if (!agent.currentExitId) continue;
      const exit = this.exits.find(e => e.id === agent.currentExitId);
      if (exit) exit.load = (exit.load || 0) + 1;
    }
  }

  /**
   * Build a complete 3D evacuation path for an agent to a specific exit.
   * Includes: room interior → doorway → corridor → stairwell descent → exit portal → muster zone.
   */
  buildFull3DPath(agent, exit, doorway, stairEntry, seed, corridorCache = null, roomCache = null) {
    const currentFloor = Math.max(1, Math.floor(((agent.y !== undefined ? agent.y : 0) + 0.5) / this.floorHeight) + 1);
    const isActivelyEvacuating = agent.state === 'EVACUATING';
    const agentFloor = isActivelyEvacuating ? currentFloor : (agent.floor || currentFloor);

    // If agent is ALREADY on Ground Floor (or reached L1 during descent)
    if (isActivelyEvacuating && currentFloor === 1) {
      const full3DPath = [];
      let isWest = exit.id === 'exit_west';
      let isEast = exit.id === 'exit_east';
      let isSouth = exit.id === 'exit_south';

      // Check if current chosen exit corridor is blocked by fire
      const activeFires = this.navGrid && this.navGrid.fireZones ? Array.from(this.navGrid.fireZones.values()) : [];
      const isBlockedTo = (targetX) => {
        return activeFires.some(fz => {
          if (fz.floor != null && fz.floor !== 1) return false;
          if (Math.abs(fz.z) > 3.5) return false;
          const minX = Math.min(agent.x, targetX) - 1.2;
          const maxX = Math.max(agent.x, targetX) + 1.2;
          return fz.x >= minX && fz.x <= maxX;
        });
      };

      if (isWest && isBlockedTo(-26.0)) {
        if (!isBlockedTo(26.0)) {
          exit = this.exits.find(e => e.id === 'exit_east') || exit;
          isWest = false; isEast = true;
        } else if (!isBlockedTo(0.0)) {
          exit = this.exits.find(e => e.id === 'exit_south') || exit;
          isWest = false; isSouth = true;
        }
      } else if (isEast && isBlockedTo(26.0)) {
        if (!isBlockedTo(-26.0)) {
          exit = this.exits.find(e => e.id === 'exit_west') || exit;
          isEast = false; isWest = true;
        } else if (!isBlockedTo(0.0)) {
          exit = this.exits.find(e => e.id === 'exit_south') || exit;
          isEast = false; isSouth = true;
        }
      }

      const jAngle = (seed % 100) * (Math.PI * 2 / 100);
      const jDist = 1.0 + ((seed * 7) % 35) * 0.1;
      const jitterX = Math.cos(jAngle) * jDist;
      const jitterZ = Math.sin(jAngle) * jDist;

      // Path from current ground position along corridor/lobby to exit
      full3DPath.push({ x: agent.x, y: 0.15, z: agent.z });
      if (Math.abs(agent.z) > 0.6 && !isSouth) {
        full3DPath.push({ x: agent.x, y: 0.15, z: 0.0 });
      }

      if (isWest) {
        if (agent.x > -26.0) full3DPath.push({ x: -26.4, y: 0.15, z: 0.0 });
        full3DPath.push({ x: -29.2, y: 0.15, z: 0.0 });
        full3DPath.push({ x: -33.5, y: 0.15, z: 0.0 });
        full3DPath.push({ x: -38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
      } else if (isEast) {
        if (agent.x < 26.0) full3DPath.push({ x: 26.4, y: 0.15, z: 0.0 });
        full3DPath.push({ x: 29.2, y: 0.15, z: 0.0 });
        full3DPath.push({ x: 33.5, y: 0.15, z: 0.0 });
        full3DPath.push({ x: 38.0 + jitterX, y: 0.15, z: 0.0 + jitterZ });
      } else if (isSouth) {
        if (Math.abs(agent.x) > 1.0 && agent.z < 2.0) {
          full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
        }
        if (agent.z < 2.6) full3DPath.push({ x: 0.0, y: 0.15, z: 2.6 });
        if (agent.z < 18.0) full3DPath.push({ x: 0.0, y: 0.15, z: 18.0 });
        full3DPath.push({ x: 0.0, y: 0.15, z: 23.0 });
        full3DPath.push({ x: 0.0, y: 0.15, z: 28.5 });
        full3DPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
      }
      return full3DPath;
    }

    // Path 1: From agent's position inside room to inside doorway staging point
    let pathInsideRoom;
    if (doorway && doorway.inside) {
      const roomKey = roomCache ? `${agentFloor}:${agent.x.toFixed(1)},${agent.z.toFixed(1)}->${doorway.inside.x},${doorway.inside.z}` : null;
      if (roomKey && roomCache.has(roomKey)) {
        pathInsideRoom = roomCache.get(roomKey);
      } else {
        if (this.navGrid) this.navGrid.routeFloor = agentFloor;
        pathInsideRoom = this.pathfinder.findPath(agent.x, agent.z, doorway.inside.x, doorway.inside.z) || [];
        if (this.navGrid) this.navGrid.routeFloor = null;
        if (roomKey && roomCache && pathInsideRoom.length > 0) {
          roomCache.set(roomKey, pathInsideRoom);
        }
      }
    } else {
      pathInsideRoom = [];
    }

    // Path 2: From corridor staging point along central corridor to stairwell (cached per floor/corridor/stair)
    let pathInCorridor;
    if (agentFloor === 1 && exit.id === 'exit_south') {
      pathInCorridor = [
        { x: doorway?.corridor?.x || 0.0, z: 0.0 },
        { x: 0.0, z: 0.0 },
        { x: 0.0, z: 2.6 },
        { x: 0.0, z: 18.0 }
      ];
    } else if (doorway && doorway.corridor && stairEntry) {
      if (this.navGrid) this.navGrid.routeFloor = agentFloor;
      const corridorKey = corridorCache ? `${agentFloor}:${doorway.corridor.x},${doorway.corridor.z}->${stairEntry.x},${stairEntry.z}` : null;
      if (corridorKey && corridorCache.has(corridorKey)) {
        pathInCorridor = corridorCache.get(corridorKey);
      } else {
        pathInCorridor = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, stairEntry.x, stairEntry.z) || [];
        if (corridorKey && corridorCache && pathInCorridor.length > 0 && !pathInCorridor.isFallback) {
          corridorCache.set(corridorKey, pathInCorridor);
        }
      }
      if (this.navGrid) this.navGrid.routeFloor = null;

      const isPathClear = (p) => {
        if (!p || p.length === 0 || p.isFallback) return false;
        if (this.pathfinder && this.pathfinder.isPathClear) {
          if (this.navGrid) this.navGrid.routeFloor = agentFloor;
          const clear = this.pathfinder.isPathClear(p);
          if (this.navGrid) this.navGrid.routeFloor = null;
          return clear;
        }
        return true;
      };

      if (!isPathClear(pathInCorridor)) {
        if (agentFloor > 1) {
          const altStairId = exit.id === 'exit_west' ? 'exit_east' : 'exit_west';
          const altStairEntry = this.stairwellEntries[altStairId];
          if (altStairEntry) {
            if (this.navGrid) this.navGrid.routeFloor = agentFloor;
            const altPath = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, altStairEntry.x, altStairEntry.z);
            if (this.navGrid) this.navGrid.routeFloor = null;
            if (isPathClear(altPath)) {
              pathInCorridor = altPath;
              stairEntry = altStairEntry;
              exit = this.exits.find(e => e.id === altStairId) || exit;
            }
          }
        } else {
          // Ground floor (L1): check safe alternative
          const altCandidateIds = ['exit_east', 'exit_west', 'exit_south'].filter(id => id !== exit.id);
          for (const altId of altCandidateIds) {
            const altEntry = this.stairwellEntries[altId];
            let altPath = null;
            if (altId === 'exit_south') {
              altPath = [
                { x: doorway.corridor.x, z: 0.0 },
                { x: 0.0, z: 0.0 },
                { x: 0.0, z: 2.6 },
                { x: 0.0, z: 18.0 }
              ];
            } else {
              if (this.navGrid) this.navGrid.routeFloor = agentFloor;
              altPath = this.pathfinder.findPath(doorway.corridor.x, doorway.corridor.z, altEntry.x, altEntry.z);
              if (this.navGrid) this.navGrid.routeFloor = null;
            }
            if (isPathClear(altPath)) {
              pathInCorridor = altPath;
              stairEntry = altEntry;
              exit = this.exits.find(e => e.id === altId) || exit;
              break;
            }
          }
        }
      }
    } else {
      pathInCorridor = [];
    }

    // Stitch together seamlessly
    const full3DPath = [];

    pathInsideRoom.forEach(pt => {
      full3DPath.push({ x: pt.x, y: agent.y, z: pt.z });
    });

    if (doorway && doorway.inside && doorway.door && doorway.corridor) {
      // Exact physical door transit (guaranteed zero wall clipping)
      full3DPath.push({ x: doorway.inside.x, y: agent.y, z: doorway.inside.z });
      full3DPath.push({ x: doorway.door.x, y: agent.y, z: doorway.door.z });
      full3DPath.push({ x: doorway.corridor.x, y: agent.y, z: doorway.corridor.z });
    }

    pathInCorridor.forEach((pt, idx) => {
      if (idx > 0) {
        full3DPath.push({ x: pt.x, y: agent.y, z: pt.z });
      }
    });

    // 2. Realistic Multi-flight Switchback Staircase Descent down to Ground Floor
    const descentStartFloor = isActivelyEvacuating ? currentFloor : agentFloor;
    const stairCoreId = (exit.id === 'exit_west' || exit.id === 'exit_east') ? exit.id : ((agent.x < 0) ? 'exit_west' : 'exit_east');

    if (descentStartFloor > 1) {
      const isWest = stairCoreId === 'exit_west';
      const flight1X = isWest ? -27.2 : 27.2;
      const flight2X = isWest ? -28.8 : 28.8;
      const landingX = isWest ? -26.4 : 26.4;

      for (let fl = descentStartFloor; fl >= 2; fl--) {
        const flBaseY = (fl - 1) * this.floorHeight;

        // 1. Step onto current Floor Landing
        full3DPath.push({ x: landingX, y: flBaseY + 0.15, z: 0.0 });

        // 2. Walk to Flight 1 Top (descending along -Z)
        full3DPath.push({ x: flight1X, y: flBaseY + 0.15, z: -0.75 });

        // 3. Step-by-step down Flight 1 to Mid-Landing
        full3DPath.push({ x: flight1X, y: flBaseY - 0.95, z: -1.75 });
        full3DPath.push({ x: flight1X, y: flBaseY - 1.90, z: -2.75 });

        // 4. Turn across Mid-Landing
        full3DPath.push({ x: flight2X, y: flBaseY - 1.90, z: -2.75 });

        // 5. Step-by-step down Flight 2 to Lower Floor Landing
        full3DPath.push({ x: flight2X, y: flBaseY - 2.85, z: -1.75 });
        full3DPath.push({ x: flight2X, y: flBaseY - 3.80 + 0.15, z: -0.75 });

        // 6. Arrive at lower Floor Landing
        full3DPath.push({ x: landingX, y: flBaseY - 3.80 + 0.15, z: 0.0 });
      }
    }

    // 3. Step out through the Ground Floor Emergency Exit into safety plaza & Muster Zone
    const isWest = exit.id === 'exit_west';
    const isEast = exit.id === 'exit_east';
    const isSouth = exit.id === 'exit_south';

    // Organic crowd dispersal jitter inside muster circle so people don't overlap
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
      if (descentStartFloor > 1) {
        const fromLandingX = stairCoreId === 'exit_west' ? -26.4 : 26.4;
        full3DPath.push({ x: fromLandingX, y: 0.15, z: 0.0 });
        full3DPath.push({ x: 0.0, y: 0.15, z: 0.0 });
        full3DPath.push({ x: 0.0, y: 0.15, z: 2.6 });
        full3DPath.push({ x: 0.0, y: 0.15, z: 18.0 });
      }
      full3DPath.push({ x: 0.0, y: 0.15, z: 23.0 });
      full3DPath.push({ x: 0.0, y: 0.15, z: 28.5 });
      full3DPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
    }

    return full3DPath;
  }
}
