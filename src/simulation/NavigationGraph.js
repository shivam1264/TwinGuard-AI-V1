// Indoor Building Navigation Graph
// Formal topological graph representation for the 10-storey commercial building
// Preserves the existing building coordinates, floor heights, stairwells, and doorways

import { ROOM_TEMPLATES, FLOOR_THEMES } from './Doorways.js';

export const NODE_TYPES = {
  ROOM: 'ROOM_NODE',
  DOORWAY: 'DOORWAY_NODE',
  CORRIDOR: 'CORRIDOR_NODE',
  STAIR_LANDING: 'STAIR_LANDING_NODE',
  STAIR_MID: 'STAIR_MID_NODE',
  GROUND_EXIT: 'GROUND_EXIT_NODE',
  SAFE_ZONE: 'OUTDOOR_SAFE_ZONE_NODE'
};

export const EDGE_TYPES = {
  ROOM_TO_DOOR: 'ROOM_TO_DOOR',
  DOOR_TO_CORRIDOR: 'DOOR_TO_CORRIDOR',
  CORRIDOR_SEGMENT: 'CORRIDOR_SEGMENT',
  CORRIDOR_TO_STAIR: 'CORRIDOR_TO_STAIR',
  STAIR_FLIGHT: 'STAIR_FLIGHT',
  GROUND_EXIT_PORTAL: 'GROUND_EXIT_PORTAL',
  SAFE_ZONE_PATH: 'SAFE_ZONE_PATH'
};

export const EDGE_STATUS = {
  OPEN: 'OPEN',
  HAZARDOUS: 'HAZARDOUS',
  BLOCKED: 'BLOCKED'
};

export class NavigationGraph {
  constructor(floorCount = 10, floorHeight = 3.8) {
    this.floorCount = floorCount;
    this.floorHeight = floorHeight;

    this.nodes = new Map(); // nodeId -> NodeObject
    this.edges = new Map(); // edgeId -> EdgeObject
    this.adjacency = new Map(); // nodeId -> [EdgeObject, ...]

    this.buildGraph();
  }

  addNode(node) {
    this.nodes.set(node.id, {
      ...node,
      occupantCount: 0
    });
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, []);
    }
  }

  addEdge(edge) {
    const dist = edge.distance || Math.hypot(
      edge.fromPos.x - edge.toPos.x,
      edge.fromPos.y - edge.toPos.y,
      edge.fromPos.z - edge.toPos.z
    );

    const baseSpeed = edge.isStairs ? 0.75 : 1.35; // m/s (slower on stair flight)
    const width = edge.width || (edge.isStairs ? 1.8 : 2.4);
    const capacity = width * 1.3; // Persons/sec (SFPE egress capacity model)

    const fullEdge = {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      floor: edge.floor,
      distance: dist,
      traversalTime: dist / baseSpeed,
      width,
      capacity,
      status: EDGE_STATUS.OPEN,
      hazardLevel: 0.0,
      currentOccupancy: 0,
      isBidirectional: edge.isBidirectional ?? true
    };

    this.edges.set(edge.id, fullEdge);
    this.adjacency.get(edge.from).push(fullEdge);

    if (fullEdge.isBidirectional) {
      // Reverse edge with swapped endpoints
      const revEdge = {
        ...fullEdge,
        id: `${edge.id}_rev`,
        from: edge.to,
        to: edge.from
      };
      if (!this.adjacency.has(edge.to)) {
        this.adjacency.set(edge.to, []);
      }
      this.adjacency.get(edge.to).push(revEdge);
    }
  }

  buildGraph() {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();

    // 1. Build Multi-Floor Nodes (Floors 1 to 10)
    for (let fl = 1; fl <= this.floorCount; fl++) {
      const flBaseY = (fl - 1) * this.floorHeight;
      const theme = FLOOR_THEMES[fl] || { name: `Floor ${fl}`, prefix: `L${fl}` };

      // A. Stairwell Landings (West at x: -26.4, East at x: +26.4)
      const westStairId = `node_f${fl}_stair_west`;
      const eastStairId = `node_f${fl}_stair_east`;

      this.addNode({
        id: westStairId,
        type: NODE_TYPES.STAIR_LANDING,
        floor: fl,
        name: `${theme.prefix} • West Stairwell Landing`,
        pos: { x: -26.4, y: flBaseY + 0.15, z: 0.0 }
      });

      this.addNode({
        id: eastStairId,
        type: NODE_TYPES.STAIR_LANDING,
        floor: fl,
        name: `${theme.prefix} • East Stairwell Landing`,
        pos: { x: 26.4, y: flBaseY + 0.15, z: 0.0 }
      });

      // B. Longitudinal Corridor Waypoints along Z = 0
      const corridorXPoints = [-24.0, -18.0, -12.0, -6.0, 0.0, 6.0, 12.0, 18.0, 24.0];
      const corridorNodeIds = [];

      corridorXPoints.forEach((cx, idx) => {
        const cId = `node_f${fl}_corridor_${idx}`;
        corridorNodeIds.push(cId);
        this.addNode({
          id: cId,
          type: NODE_TYPES.CORRIDOR,
          floor: fl,
          name: `${theme.prefix} • Corridor Waypoint ${idx + 1}`,
          pos: { x: cx, y: flBaseY + 0.15, z: 0.0 }
        });
      });

      // Connect adjacent corridor nodes sequentially
      for (let i = 0; i < corridorNodeIds.length - 1; i++) {
        const idA = corridorNodeIds[i];
        const idB = corridorNodeIds[i + 1];
        const nodeA = this.nodes.get(idA);
        const nodeB = this.nodes.get(idB);

        this.addEdge({
          id: `edge_f${fl}_corr_${i}_${i + 1}`,
          from: idA,
          to: idB,
          fromPos: nodeA.pos,
          toPos: nodeB.pos,
          floor: fl,
          type: EDGE_TYPES.CORRIDOR_SEGMENT,
          width: 2.8,
          isBidirectional: true
        });
      }

      // Connect Corridor Terminals to Stairwell Landings
      const firstCorr = this.nodes.get(corridorNodeIds[0]);
      const lastCorr = this.nodes.get(corridorNodeIds[corridorNodeIds.length - 1]);
      const westStair = this.nodes.get(westStairId);
      const eastStair = this.nodes.get(eastStairId);

      this.addEdge({
        id: `edge_f${fl}_corr_to_west_stair`,
        from: corridorNodeIds[0],
        to: westStairId,
        fromPos: firstCorr.pos,
        toPos: westStair.pos,
        floor: fl,
        type: EDGE_TYPES.CORRIDOR_TO_STAIR,
        width: 2.4,
        isBidirectional: true
      });

      this.addEdge({
        id: `edge_f${fl}_corr_to_east_stair`,
        from: corridorNodeIds[corridorNodeIds.length - 1],
        to: eastStairId,
        fromPos: lastCorr.pos,
        toPos: eastStair.pos,
        floor: fl,
        type: EDGE_TYPES.CORRIDOR_TO_STAIR,
        width: 2.4,
        isBidirectional: true
      });

      // C. Room Nodes & Doorways (10 rooms per floor)
      ROOM_TEMPLATES.forEach((tmpl, rIdx) => {
        const roomId = `f${fl}_${tmpl.idSuffix}`;
        const roomCenterNodeId = `node_${roomId}_center`;
        const roomDoorNodeId = `node_${roomId}_door`;

        // Room Center Node
        this.addNode({
          id: roomCenterNodeId,
          roomId,
          type: NODE_TYPES.ROOM,
          floor: fl,
          name: `${theme.prefix} • ${tmpl.nameSuffix}`,
          pos: { x: tmpl.centerX, y: flBaseY + 0.15, z: tmpl.centerZ }
        });

        // Room Doorway Threshold Node (exact wall opening)
        this.addNode({
          id: roomDoorNodeId,
          roomId,
          type: NODE_TYPES.DOORWAY,
          floor: fl,
          name: `${theme.prefix} • Door ${rIdx + 1}`,
          pos: { x: tmpl.doorX, y: flBaseY + 0.15, z: tmpl.doorZ }
        });

        // Edge: Room Center <-> Doorway Threshold
        const centerNode = this.nodes.get(roomCenterNodeId);
        const doorNode = this.nodes.get(roomDoorNodeId);

        this.addEdge({
          id: `edge_${roomId}_center_to_door`,
          from: roomCenterNodeId,
          to: roomDoorNodeId,
          fromPos: centerNode.pos,
          toPos: doorNode.pos,
          floor: fl,
          type: EDGE_TYPES.ROOM_TO_DOOR,
          width: 2.2,
          isBidirectional: true
        });

        // Find closest corridor waypoint to connect this doorway
        let closestCorrId = corridorNodeIds[0];
        let minDist = Infinity;
        corridorNodeIds.forEach(cId => {
          const cNode = this.nodes.get(cId);
          const d = Math.hypot(tmpl.doorX - cNode.pos.x, tmpl.doorZ - cNode.pos.z);
          if (d < minDist) {
            minDist = d;
            closestCorrId = cId;
          }
        });

        const closestCorrNode = this.nodes.get(closestCorrId);
        this.addEdge({
          id: `edge_${roomId}_door_to_corridor`,
          from: roomDoorNodeId,
          to: closestCorrId,
          fromPos: doorNode.pos,
          toPos: closestCorrNode.pos,
          floor: fl,
          type: EDGE_TYPES.DOOR_TO_CORRIDOR,
          width: 2.2,
          isBidirectional: true
        });
      });

      // D. Multi-flight Switchback Staircase Edges (Floor FL -> FL-1)
      if (fl > 1) {
        const lowerWestId = `node_f${fl - 1}_stair_west`;
        const lowerEastId = `node_f${fl - 1}_stair_east`;
        const lowerWest = this.nodes.get(lowerWestId);
        const lowerEast = this.nodes.get(lowerEastId);

        // West Stair Descent Edge (directed downward)
        this.addEdge({
          id: `edge_stair_west_f${fl}_to_f${fl - 1}`,
          from: westStairId,
          to: lowerWestId,
          fromPos: westStair.pos,
          toPos: lowerWest.pos,
          floor: fl,
          type: EDGE_TYPES.STAIR_FLIGHT,
          isStairs: true,
          width: 1.8,
          isBidirectional: false // Rapid downward egress flow
        });

        // East Stair Descent Edge (directed downward)
        this.addEdge({
          id: `edge_stair_east_f${fl}_to_f${fl - 1}`,
          from: eastStairId,
          to: lowerEastId,
          fromPos: eastStair.pos,
          toPos: lowerEast.pos,
          floor: fl,
          type: EDGE_TYPES.STAIR_FLIGHT,
          isStairs: true,
          width: 1.8,
          isBidirectional: false
        });
      }
    }

    // 2. Ground Floor Emergency Exits & Portals (Level 1)
    const exitANodeId = 'node_exit_a_west';
    const exitBNodeId = 'node_exit_b_east';
    const exitCNodeId = 'node_exit_c_south';

    this.addNode({
      id: exitANodeId,
      exitId: 'exit_west',
      type: NODE_TYPES.GROUND_EXIT,
      floor: 1,
      name: 'Ground Exit A (West Ring Road Portal)',
      pos: { x: -29.5, y: 0.15, z: 0.0 }
    });

    this.addNode({
      id: exitBNodeId,
      exitId: 'exit_east',
      type: NODE_TYPES.GROUND_EXIT,
      floor: 1,
      name: 'Ground Exit B (East Service Portal)',
      pos: { x: 29.5, y: 0.15, z: 0.0 }
    });

    this.addNode({
      id: exitCNodeId,
      exitId: 'exit_south',
      type: NODE_TYPES.GROUND_EXIT,
      floor: 1,
      name: 'Ground Exit C (South Grand Portal)',
      pos: { x: 0.0, y: 0.15, z: 23.5 }
    });

    // Connect Floor 1 Landings to Exterior Exits
    const f1WestStair = this.nodes.get('node_f1_stair_west');
    const f1EastStair = this.nodes.get('node_f1_stair_east');
    const exitANode = this.nodes.get(exitANodeId);
    const exitBNode = this.nodes.get(exitBNodeId);

    this.addEdge({
      id: 'edge_f1_stair_to_exit_a',
      from: 'node_f1_stair_west',
      to: exitANodeId,
      fromPos: f1WestStair.pos,
      toPos: exitANode.pos,
      floor: 1,
      type: EDGE_TYPES.GROUND_EXIT_PORTAL,
      width: 2.8,
      isBidirectional: true
    });

    this.addEdge({
      id: 'edge_f1_stair_to_exit_b',
      from: 'node_f1_stair_east',
      to: exitBNodeId,
      fromPos: f1EastStair.pos,
      toPos: exitBNode.pos,
      floor: 1,
      type: EDGE_TYPES.GROUND_EXIT_PORTAL,
      width: 2.8,
      isBidirectional: true
    });

    // Connect Floor 1 Central Corridor to South Exit C
    const f1CenterCorr = this.nodes.get('node_f1_corridor_4'); // x: 0.0, z: 0.0
    const exitCNode = this.nodes.get(exitCNodeId);

    this.addEdge({
      id: 'edge_f1_corr_to_exit_c',
      from: 'node_f1_corridor_4',
      to: exitCNodeId,
      fromPos: f1CenterCorr.pos,
      toPos: exitCNode.pos,
      floor: 1,
      type: EDGE_TYPES.GROUND_EXIT_PORTAL,
      width: 4.0, // Wide Grand Portal
      isBidirectional: true
    });

    // 3. Outdoor Safe Assembly Zones (Muster Points)
    const musterAlphaId = 'node_muster_alpha';
    const musterBravoId = 'node_muster_bravo';

    this.addNode({
      id: musterAlphaId,
      type: NODE_TYPES.SAFE_ZONE,
      floor: 0,
      name: 'Muster Point Alpha (South Park Plaza)',
      pos: { x: 0.0, y: 0.15, z: 48.0 }
    });

    this.addNode({
      id: musterBravoId,
      type: NODE_TYPES.SAFE_ZONE,
      floor: 0,
      name: 'Muster Point Bravo (West Perimeter Lawn)',
      pos: { x: -48.0, y: 0.15, z: -20.0 }
    });

    const musterAlphaNode = this.nodes.get(musterAlphaId);
    const musterBravoNode = this.nodes.get(musterBravoId);

    // Exit C -> Muster Alpha
    this.addEdge({
      id: 'edge_exit_c_to_muster_alpha',
      from: exitCNodeId,
      to: musterAlphaId,
      fromPos: exitCNode.pos,
      toPos: musterAlphaNode.pos,
      floor: 0,
      type: EDGE_TYPES.SAFE_ZONE_PATH,
      width: 6.0,
      isBidirectional: true
    });

    // Exit B -> Muster Alpha
    this.addEdge({
      id: 'edge_exit_b_to_muster_alpha',
      from: exitBNodeId,
      to: musterAlphaId,
      fromPos: exitBNode.pos,
      toPos: musterAlphaNode.pos,
      floor: 0,
      type: EDGE_TYPES.SAFE_ZONE_PATH,
      width: 4.0,
      isBidirectional: true
    });

    // Exit A -> Muster Bravo
    this.addEdge({
      id: 'edge_exit_a_to_muster_bravo',
      from: exitANodeId,
      to: musterBravoId,
      fromPos: exitANode.pos,
      toPos: musterBravoNode.pos,
      floor: 0,
      type: EDGE_TYPES.SAFE_ZONE_PATH,
      width: 4.0,
      isBidirectional: true
    });
  }

  getNeighbors(nodeId) {
    const edgeList = this.adjacency.get(nodeId) || [];
    return edgeList
      .filter(edge => edge.status !== EDGE_STATUS.BLOCKED)
      .map(edge => ({
        edge,
        neighborNode: this.nodes.get(edge.to)
      }))
      .filter(item => item.neighborNode !== undefined);
  }

  setEdgeStatus(edgeId, status, hazardLevel = 0.0) {
    const edge = this.edges.get(edgeId);
    if (edge) {
      edge.status = status;
      edge.hazardLevel = hazardLevel;
    }
  }

  blockStairwell(coreName, floorNum = null) {
    const isWest = coreName.toLowerCase().includes('west') || coreName.toLowerCase().includes('a');
    const prefix = isWest ? 'edge_stair_west' : 'edge_stair_east';

    this.edges.forEach((edge, id) => {
      if (id.startsWith(prefix)) {
        if (!floorNum || edge.floor === floorNum) {
          edge.status = EDGE_STATUS.BLOCKED;
          edge.hazardLevel = 1.0;
        }
      }
    });
  }

  setHazardInZone(centerX, centerY, centerZ, radiusMeters, hazardLevel = 0.8) {
    this.edges.forEach(edge => {
      const fromNode = this.nodes.get(edge.from);
      const toNode = this.nodes.get(edge.to);
      if (!fromNode || !toNode) return;

      const dFrom = Math.hypot(fromNode.pos.x - centerX, fromNode.pos.y - centerY, fromNode.pos.z - centerZ);
      const dTo = Math.hypot(toNode.pos.x - centerX, toNode.pos.y - centerY, toNode.pos.z - centerZ);

      if (dFrom <= radiusMeters || dTo <= radiusMeters) {
        if (hazardLevel >= 0.95) {
          edge.status = EDGE_STATUS.BLOCKED;
        } else {
          edge.status = EDGE_STATUS.HAZARDOUS;
        }
        edge.hazardLevel = Math.max(edge.hazardLevel, hazardLevel);
      }
    });
  }

  resetAllHazards() {
    this.edges.forEach(edge => {
      edge.status = EDGE_STATUS.OPEN;
      edge.hazardLevel = 0.0;
      edge.currentOccupancy = 0;
    });
  }

  /**
   * Complete Topological Graph Verification
   * Validates that EVERY room on EVERY floor (100 rooms total) has at least 1 reachable path to an exit.
   */
  validateConnectivity() {
    const results = {
      totalRooms: 0,
      connectedRooms: 0,
      disconnectedRooms: [],
      isValid: false
    };

    const targetSafeZones = ['node_muster_alpha', 'node_muster_bravo'];

    for (let fl = 1; fl <= this.floorCount; fl++) {
      ROOM_TEMPLATES.forEach(tmpl => {
        results.totalRooms++;
        const roomId = `f${fl}_${tmpl.idSuffix}`;
        const startNodeId = `node_${roomId}_center`;

        // Run BFS search from startNodeId to any safe zone
        const queue = [startNodeId];
        const visited = new Set([startNodeId]);
        let reachedExit = false;

        while (queue.length > 0) {
          const current = queue.shift();
          if (targetSafeZones.includes(current)) {
            reachedExit = true;
            break;
          }

          const neighbors = this.getNeighbors(current);
          for (const item of neighbors) {
            const nextId = item.neighborNode.id;
            if (!visited.has(nextId)) {
              visited.add(nextId);
              queue.push(nextId);
            }
          }
        }

        if (reachedExit) {
          results.connectedRooms++;
        } else {
          results.disconnectedRooms.push(roomId);
        }
      });
    }

    results.isValid = results.connectedRooms === results.totalRooms;
    return results;
  }
}
