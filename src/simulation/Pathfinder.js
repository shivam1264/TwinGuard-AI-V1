export class Pathfinder {
  constructor(navGrid) {
    this.navGrid = navGrid;
  }

  findPath(startX, startZ, targetX, targetZ) {
    const start = this.navGrid.worldToGrid(startX, startZ);
    const goal = this.navGrid.worldToGrid(targetX, targetZ);

    if (!this.navGrid.isWalkable(start.c, start.r)) {
      const altStart = this.findNearestWalkable(start.c, start.r);
      if (altStart) {
        start.c = altStart.c;
        start.r = altStart.r;
      }
    }

    if (!this.navGrid.isWalkable(goal.c, goal.r)) {
      const altGoal = this.findNearestWalkable(goal.c, goal.r);
      if (altGoal) {
        goal.c = altGoal.c;
        goal.r = altGoal.r;
      }
    }

    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const nodeKey = (c, r) => `${c},${r}`;
    const startKey = nodeKey(start.c, start.r);

    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(start.c, start.r, goal.c, goal.r));

    openSet.push({ c: start.c, r: start.r, f: fScore.get(startKey) });

    const neighbors = [
      { dc: 0, dr: -1, cost: 1.0 },
      { dc: 0, dr: 1, cost: 1.0 },
      { dc: -1, dr: 0, cost: 1.0 },
      { dc: 1, dr: 0, cost: 1.0 },
      // Diagonals
      { dc: -1, dr: -1, cost: 1.414 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: 1, dr: 1, cost: 1.414 }
    ];

    let iterations = 0;
    const maxIterations = 3500;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = nodeKey(current.c, current.r);

      if (current.c === goal.c && current.r === goal.r) {
        return this.reconstructPath(cameFrom, current, targetX, targetZ);
      }

      closedSet.add(currentKey);

      for (const n of neighbors) {
        const nc = current.c + n.dc;
        const nr = current.r + n.dr;
        const nKey = nodeKey(nc, nr);

        if (closedSet.has(nKey) || !this.navGrid.isWalkable(nc, nr)) {
          continue;
        }

        // Strict: Never cut diagonally through wall corners
        if (n.dc !== 0 && n.dr !== 0) {
          if (!this.navGrid.isWalkable(current.c + n.dc, current.r) || !this.navGrid.isWalkable(current.c, current.r + n.dr)) {
            continue;
          }
        }

        const hazardCost = this.navGrid.hazardCosts[nr]?.[nc] || 0;
        const tentativeG = (gScore.get(currentKey) || 0) + n.cost + hazardCost;

        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, current);
          gScore.set(nKey, tentativeG);
          const f = tentativeG + this.heuristic(nc, nr, goal.c, goal.r);
          fScore.set(nKey, f);

          if (!openSet.some(item => item.c === nc && item.r === nr)) {
            openSet.push({ c: nc, r: nr, f });
          }
        }
      }
    }

    // Direct fallback if completely trapped
    return [
      { x: startX, z: startZ },
      { x: targetX, z: targetZ }
    ];
  }

  findNearestWalkable(c, r) {
    for (let radius = 1; radius <= 6; radius++) {
      for (let dc = -radius; dc <= radius; dc++) {
        for (let dr = -radius; dr <= radius; dr++) {
          const nc = c + dc;
          const nr = r + dr;
          if (this.navGrid.isWalkable(nc, nr)) {
            return { c: nc, r: nr };
          }
        }
      }
    }
    return null;
  }

  heuristic(c1, r1, c2, r2) {
    return Math.hypot(c1 - c2, r1 - r2);
  }

  reconstructPath(cameFrom, current, finalX, finalZ) {
    const nodeKey = (c, r) => `${c},${r}`;
    const rawPath = [current];

    let currKey = nodeKey(current.c, current.r);
    while (cameFrom.has(currKey)) {
      const prev = cameFrom.get(currKey);
      rawPath.unshift(prev);
      currKey = nodeKey(prev.c, prev.r);
    }

    const worldPoints = rawPath.map(pt => this.navGrid.gridToWorld(pt.c, pt.r));
    worldPoints[worldPoints.length - 1] = { x: finalX, z: finalZ };

    return this.smoothLineOfSight(worldPoints);
  }

  // Safe Line-of-Sight path smoothing that NEVER cuts across walls
  smoothLineOfSight(points) {
    if (points.length <= 2) return points;

    const result = [points[0]];
    let currentIdx = 0;

    while (currentIdx < points.length - 1) {
      let furthestVisible = currentIdx + 1;

      // Look as far ahead as possible as long as there is 100% clear line of sight
      for (let testIdx = currentIdx + 2; testIdx < points.length; testIdx++) {
        if (this.hasLineOfSight(points[currentIdx], points[testIdx])) {
          furthestVisible = testIdx;
        } else {
          break; // Obstacle encountered, cannot skip further
        }
      }

      result.push(points[furthestVisible]);
      currentIdx = furthestVisible;
    }

    return result;
  }

  hasLineOfSight(p1, p2) {
    const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    const steps = Math.ceil(dist / 0.3); // Check every 30cm

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const z = p1.z + (p2.z - p1.z) * t;
      const g = this.navGrid.worldToGrid(x, z);
      if (!this.navGrid.isWalkable(g.c, g.r)) {
        return false;
      }
    }
    return true;
  }
}
