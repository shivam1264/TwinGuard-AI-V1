// Evacuation Route Optimization Engine
// Dynamic Dijkstra & A* routing with capacity-aware exit assignment and multi-hazard avoidance

import { EDGE_STATUS } from './NavigationGraph.js';

export class RouteOptimizationEngine {
  constructor(navGraph) {
    this.navGraph = navGraph;

    this.exits = [
      { id: 'exit_west', name: 'Exit A (West Emergency Core)', nodeId: 'node_exit_a_west', capacity: 60, currentLoad: 0, color: '#00ff88' },
      { id: 'exit_east', name: 'Exit B (East Fire Escape Core)', nodeId: 'node_exit_b_east', capacity: 60, currentLoad: 0, color: '#00f0ff' },
      { id: 'exit_south', name: 'Exit C (South Grand Portal)', nodeId: 'node_exit_c_south', capacity: 80, currentLoad: 0, color: '#9d4edd' }
    ];

    this.musterZones = [
      { id: 'muster_alpha', name: 'Muster Point Alpha', nodeId: 'node_muster_alpha' },
      { id: 'muster_bravo', name: 'Muster Point Bravo', nodeId: 'node_muster_bravo' }
    ];

    this.alphaCongestion = 1.8;
    this.betaHazard = 250.0;
    this.hysteresisMargin = 0.18; // 18% cost threshold to prevent route flapping
  }

  calculateEdgeCost(edge) {
    if (edge.status === EDGE_STATUS.BLOCKED) {
      return Infinity;
    }

    const baseTime = edge.traversalTime || (edge.distance / 1.35);

    // Hazard exposure penalty
    const hazardPenalty = (edge.hazardLevel || 0) * this.betaHazard;

    // SFPE fluid congestion / queue delay
    const loadRatio = (edge.currentOccupancy || 0) / Math.max(1, edge.capacity || 2);
    const congestionFactor = Math.pow(loadRatio, 2.0) * 20.0;

    return baseTime * (1.0 + this.alphaCongestion * congestionFactor) + hazardPenalty;
  }

  /**
   * Shortest Path Dijkstra Algorithm over Navigation Graph
   */
  findShortestPath(startNodeId, targetNodeId, blockedEdges = new Set()) {
    const startNode = this.navGraph.nodes.get(startNodeId);
    const targetNode = this.navGraph.nodes.get(targetNodeId);

    if (!startNode || !targetNode) {
      return { success: false, reason: 'INVALID_NODES', path: [], cost: Infinity };
    }

    const dist = new Map();
    const prev = new Map();
    const prevEdge = new Map();
    const pq = []; // Array-based Priority Queue

    this.navGraph.nodes.forEach((_, id) => {
      dist.set(id, Infinity);
    });

    dist.set(startNodeId, 0);
    pq.push({ id: startNodeId, cost: 0 });

    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);
      const { id: u, cost: uCost } = pq.shift();

      if (u === targetNodeId) break;
      if (uCost > dist.get(u)) continue;

      const neighborEdges = this.navGraph.adjacency.get(u) || [];

      for (const edge of neighborEdges) {
        if (blockedEdges.has(edge.id) || edge.status === EDGE_STATUS.BLOCKED) {
          continue;
        }

        const v = edge.to;
        const edgeCost = this.calculateEdgeCost(edge);
        if (!isFinite(edgeCost)) continue;

        const alt = uCost + edgeCost;
        if (alt < dist.get(v)) {
          dist.set(v, alt);
          prev.set(v, u);
          prevEdge.set(v, edge);
          pq.push({ id: v, cost: alt });
        }
      }
    }

    if (dist.get(targetNodeId) === Infinity) {
      return { success: false, reason: 'NO_SAFE_ROUTE_AVAILABLE', path: [], cost: Infinity };
    }

    // Reconstruct topological node sequence and 3D waypoints
    const nodeSequence = [];
    const edgeSequence = [];
    const waypoints3D = [];

    let curr = targetNodeId;
    while (curr !== undefined) {
      nodeSequence.unshift(curr);
      const edge = prevEdge.get(curr);
      if (edge) edgeSequence.unshift(edge);
      const nObj = this.navGraph.nodes.get(curr);
      if (nObj && nObj.pos) {
        waypoints3D.unshift({ x: nObj.pos.x, y: nObj.pos.y, z: nObj.pos.z });
      }
      curr = prev.get(curr);
    }

    return {
      success: true,
      cost: dist.get(targetNodeId),
      nodeSequence,
      edgeSequence,
      waypoints3D
    };
  }

  /**
   * Calculate Alternative Divergent Route (bypassing primary bottleneck)
   */
  findAlternativePath(startNodeId, targetNodeId, primaryResult) {
    if (!primaryResult || !primaryResult.success || !primaryResult.edgeSequence) {
      return null;
    }

    // Temporarily exclude the most critical edge of the primary route (e.g. primary stair flight or corridor)
    const criticalEdge = primaryResult.edgeSequence.find(e =>
      e.type === 'STAIR_FLIGHT' || e.type === 'CORRIDOR_SEGMENT'
    );

    if (!criticalEdge) return null;

    const blocked = new Set([criticalEdge.id]);
    const altResult = this.findShortestPath(startNodeId, targetNodeId, blocked);

    if (altResult.success && altResult.cost < Infinity) {
      return altResult;
    }
    return null;
  }

  /**
   * Capacity-Aware Multi-Exit Optimization for All Occupants
   * Distributes crowd load across Exit A, Exit B, and Exit C
   */
  optimizeEvacuationRoutes(agents) {
    // Reset exit loads
    this.exits.forEach(ex => ex.currentLoad = 0);
    this.navGraph.edges.forEach(edge => edge.currentOccupancy = 0);

    const assignments = [];
    const bottlenecks = [];

    // Sort agents by floor (top floors first) to give critical egress priority
    const sortedAgents = [...agents].sort((a, b) => (b.floor || 1) - (a.floor || 1));

    sortedAgents.forEach((agent, index) => {
      const roomCenterNodeId = `node_${agent.roomId}_center`;
      const agentFloor = agent.floor || 1;

      // Available exits:
      // Ground floor (L1) can exit directly via West, East, or South Grand Portal!
      // Upper floors (L2 - L10) must descend via West or East Stairwells to Ground level first
      const candidateExits = agentFloor === 1
        ? this.exits
        : [this.exits[0], this.exits[1]];

      let bestPath = null;
      let bestExit = null;
      let minTotalCost = Infinity;

      for (const exit of candidateExits) {
        // Calculate path to this exit
        const result = this.findShortestPath(roomCenterNodeId, exit.nodeId);
        if (!result.success) continue;

        // Anti-stampede queue penalty at this exit
        const exitLoadRatio = exit.currentLoad / Math.max(1, exit.capacity);
        const exitQueuePenalty = Math.pow(exitLoadRatio, 2.2) * 45.0;

        // Micro-jitter to prevent artificial identical path overlap
        const jitter = (index % 13) * 0.2;

        const totalCost = result.cost + exitQueuePenalty + jitter;

        if (totalCost < minTotalCost) {
          minTotalCost = totalCost;
          bestPath = result;
          bestExit = exit;
        }
      }

      if (bestPath && bestExit) {
        bestExit.currentLoad++;

        // Increase occupancy on chosen edges
        bestPath.edgeSequence.forEach(edge => {
          edge.currentOccupancy = (edge.currentOccupancy || 0) + 1;
        });

        // Extend path through exterior portal to the safe outdoor muster zone
        const musterTargetNodeId = (bestExit.id === 'exit_west')
          ? 'node_muster_bravo'
          : 'node_muster_alpha';

        const musterPathResult = this.findShortestPath(bestExit.nodeId, musterTargetNodeId);
        let finalWaypoints = [...bestPath.waypoints3D];

        if (musterPathResult.success && musterPathResult.waypoints3D.length > 1) {
          // Append outdoor sidewalk path
          finalWaypoints.push(...musterPathResult.waypoints3D.slice(1));
        }

        // Add organic jitter in muster circle
        const seed = agent.id ? agent.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 1;
        const jAngle = (seed % 100) * (Math.PI * 2 / 100);
        const jDist = 1.0 + ((seed * 7) % 35) * 0.1;
        const jitterX = Math.cos(jAngle) * jDist;
        const jitterZ = Math.sin(jAngle) * jDist;

        if (finalWaypoints.length > 0) {
          const lastPt = finalWaypoints[finalWaypoints.length - 1];
          finalWaypoints[finalWaypoints.length - 1] = {
            x: lastPt.x + jitterX,
            y: lastPt.y,
            z: lastPt.z + jitterZ
          };
        }

        // Compute alternative path for reference
        const altPath = this.findAlternativePath(roomCenterNodeId, bestExit.nodeId, bestPath);

        assignments.push({
          agentId: agent.id,
          exitId: bestExit.id,
          exitName: bestExit.name,
          exitColor: bestExit.color,
          path: finalWaypoints,
          nodeSequence: bestPath.nodeSequence,
          hasAlternative: !!altPath,
          altPathWaypoints: altPath ? altPath.waypoints3D : null,
          targetExit: { x: finalWaypoints[finalWaypoints.length - 1]?.x || 0, z: finalWaypoints[finalWaypoints.length - 1]?.z || 0 }
        });
      } else {
        // Trapped occupant report
        assignments.push({
          agentId: agent.id,
          isTrapped: true,
          reason: 'NO_SAFE_ROUTE_AVAILABLE',
          path: []
        });
      }
    });

    // Check exit load status
    this.exits.forEach(exit => {
      const loadPercentage = Math.round((exit.currentLoad / exit.capacity) * 100);
      let status = 'OPTIMAL';
      if (loadPercentage > 120) {
        status = 'CRITICAL OVERLOAD';
        bottlenecks.push(`⚠️ Stampede Warning at ${exit.name}: ${exit.currentLoad}/${exit.capacity} queued (${loadPercentage}%)`);
      } else if (loadPercentage > 85) {
        status = 'HEAVY TRAFFIC';
      }

      exit.loadPercentage = loadPercentage;
      exit.status = status;
    });

    return {
      assignments,
      exitStats: this.exits.map(e => ({ ...e, load: e.currentLoad })),
      bottlenecks
    };
  }
}
