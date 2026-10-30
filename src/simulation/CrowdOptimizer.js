import { getRoomDoorway } from './Doorways.js';
import { ROUTE_CONDITIONS, getExitRouteCondition } from './RoutingHazardAdapter.js';

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

optimizeRoutes(agents, fireLocations = [], options = {}) {
    const { blockedExitIds = [], strategyType = 'LOAD_BALANCED' } = options;
    // Compute live exit loads from agents currently targeting each exit (not SAFE)
    this._updateLiveExitLoads(agents);
    // Sync blocked state from scenario
    this.exits.forEach(e => {
      e.isBlocked = blockedExitIds.includes(e.id);
      if (e.isBlocked) {
        e.status = 'BLOCKED / SMOKE COMPROMISED';
      }
    });

    const bottlenecks = [];
    const assignments = [];
    const routingContext = options.routingContext || null;
    const hazardAware = routingContext?.availability?.available === true;
    let requiresOperatorReview = false;

    const allOperational = this.exits.filter(e => !e.isBlocked);

    // Initialize tentative loads from live exit loads (updated each frame by SceneManager)
    const tentativeLoads = new Map();
    this.exits.forEach(e => tentativeLoads.set(e.id, e.load || 0));

    agents.forEach((agent, index) => {
      let bestExit = null;
      let bestRoute = null;
      let bestScore = Infinity;
let fallbackAssignment = false;

      // Available exits: Upper floors (L2 to L10) MUST egress via vertical Stairwell Cores (West Core A or East Core B)
      // Ground floor (L1) can use West, East, or South Grand Exit!
      const allOperational = this.exits.filter(e => !e.isBlocked);
      const floorExits = agent.floor === 1 ? this.exits : [this.exits[0], this.exits[1]];
      let availableExits = floorExits.filter(e => !e.isBlocked);

      // Fallback: If both floor stairwells are flagged, select the least compromised stair core
      if (availableExits.length === 0) {
        availableExits = [this.exits[0], this.exits[1]];
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
 else if (floorDiff === 1) {
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
        const tentativeLoad = tentativeLoads.get(exit.id) || 0;
        const loadRatio = exit.capacity > 0 ? tentativeLoad / exit.capacity : 999;
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

        const baselineScore = distToStair + congestionPenalty + firePenalty + jitter;
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

      // Build full paths for ALL viable exits and compute their scores
      const candidatePaths = [];
      for (const candidate of candidatePool) {
        const exit = candidate.exit;
        const stairEntry = this.stairwellEntries[exit.id];

        // Build full 3D path for this exit
        const full3DPath = this.buildFull3DPath(agent, exit, doorway, stairEntry, seed);

        const score = permittedCandidates.length > 0 ? candidate.score : candidate.baselineScore;

        candidatePaths.push({
          exit,
          route: candidate.route,
          score,
          path: full3DPath,
          baselineScore: candidate.baselineScore
        });
      }

      // Sort by score (best first)
      candidatePaths.sort((a, b) => a.score - b.score);

      // Primary route is the best one
      const bestCandidate = candidatePaths[0];
      bestExit = bestCandidate.exit;
      bestRoute = bestCandidate.route;
      bestScore = bestCandidate.score;

      if (bestExit) {
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

        // Build full 3D path for the best exit
        const full3DPath = this.buildFull3DPath(agent, bestExit, doorway, stairEntry, seed);

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
          // Phased evacuation delay timer
          delayTimer: delayTimer,
          // Alternative routes for dynamic reevaluation
          alternatives: candidatePaths.slice(1).map(c => ({
            exitId: c.exit.id,
            exitName: c.exit.name,
            exitColor: c.exit.color,
            path: c.path,
            score: c.score,
            routeCondition: c.route?.condition || null,
            routeReasons: c.route?.reasons || []
          }))
        });
      }
    });

        assignments.push({
          agentId: agent.id,
          exitId: bestExit.id,
          exitName: bestExit.name,
          exitColor: bestExit.color,
          path: bestCandidate.path,
          targetExit: { x: bestExit.x, z: bestExit.z },
          hazardAware,
          routeEvaluation: hazardAware ? 'hazard-aware' : 'unverified',
          routeCondition: bestRoute?.condition || null,
          routeReasons: bestRoute?.reasons || [],
          noPermittedCandidate: fallbackAssignment,
          requiresOperatorReview: fallbackAssignment,
          // Phased evacuation delay timer
          delayTimer: delayTimer,
          // Alternative routes for dynamic reevaluation
          alternatives: candidatePaths.slice(1).map(c => ({
            exitId: c.exit.id,
            exitName: c.exit.name,
            exitColor: c.exit.color,
            path: c.path,
            score: c.score,
            routeCondition: c.route?.condition || null,
            routeReasons: c.route?.reasons || []
          }))
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
    const bottlenecks = [];
    const assignments = [];
    const routingContext = options.routingContext || null;
    const hazardAware = routingContext?.availability?.available === true;
    let requiresOperatorReview = false;

    // Initialize tentative loads from live exit loads (updated each frame by SceneManager)
    const tentativeLoads = new Map();
    this.exits.forEach(e => tentativeLoads.set(e.id, e.load || 0));

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
      if (availableExits.length === 0) {
        availableExits = allOperational.length > 0 ? allOperational : this.exits;
      }

      const candidates = [];

      // Check if current route is still valid and agent has made significant progress
      const currentRouteStillValid = currentExitId &&
        availableExits.some(e => e.id === currentExitId) &&
        currentRouteCondition !== ROUTE_CONDITIONS.PROHIBITED &&
        progressRatio > 0.1; // Keep route if agent has made >10% progress

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

        // Anti-Stampede Staircase Congestion Penalty
        const tentativeLoad = tentativeLoads.get(exit.id) || 0;
        const loadRatio = tentativeLoad / exit.capacity;
        const congestionPenalty = Math.pow(loadRatio, 2.2) * 55;
        const jitter = (index % 11) * 0.3;

        const baselineScore = distToStair + congestionPenalty + firePenalty + jitter;
        const route = hazardAware ? getExitRouteCondition(routingContext, agent.floor, exit.id) : null;

        // If this is the current exit and route is still valid, give a bonus to prefer keeping it
        const stickinessBonus = (exit.id === currentExitId && currentRouteStillValid) ? -50 : 0;

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

      // If current exit is still valid and agent has made progress, prefer it
      let useCurrentExit = false;
      if (currentExitId && currentRouteStillValid) {
        const currentCandidate = candidates.find(c => c.isCurrentExit);
        if (currentCandidate && currentCandidate.route?.condition !== ROUTE_CONDITIONS.PROHIBITED) {
          // Check if current exit is still among the best options
          const bestPermitted = permittedCandidates.length > 0
            ? permittedCandidates.reduce((best, c) => c.score < best.score ? c : best, permittedCandidates[0])
            : candidates.reduce((best, c) => c.score < best.score ? c : best, candidates[0]);

          // If current exit score is within 20% of best, keep it to avoid churn
          if (currentCandidate.score <= bestPermitted.score * 1.2) {
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
        const full3DPath = this.buildFull3DPath(agent, bestExit, doorway, stairEntry, seed);

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
              const altPath = this.buildFull3DPath(agent, c.exit, doorway, this.stairwellEntries[c.exit.id], seed);
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
      this.exits.forEach(e => { e.load = 0; });
      return;
    }
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
  buildFull3DPath(agent, exit, doorway, stairEntry, seed) {
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
    if (agent.floor > 1 && (exit.id === 'exit_west' || exit.id === 'exit_east')) {
      const isWest = exit.id === 'exit_west';
      const flight1X = isWest ? -27.2 : 27.2;
      const flight2X = isWest ? -28.8 : 28.8;
      const landingX = isWest ? -26.4 : 26.4;

      for (let fl = agent.floor; fl >= 2; fl--) {
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
      full3DPath.push({ x: 0.0, y: 0.15, z: 23.0 });
      full3DPath.push({ x: 0.0, y: 0.15, z: 28.5 });
      full3DPath.push({ x: 0.0 + jitterX, y: 0.15, z: 36.0 + jitterZ });
    }

    return full3DPath;
  }
}
