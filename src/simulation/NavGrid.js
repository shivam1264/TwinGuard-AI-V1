// Navigation Grid for 10-Room Standard Commercial Floor Plate
export class NavGrid {
  constructor() {
    this.minX = -30;
    this.maxX = 30;
    this.minZ = -24;
    this.maxZ = 25;
    this.cellSize = 0.5; // Fine 0.5m grid for precision doorway navigation

    this.cols = Math.round((this.maxX - this.minX) / this.cellSize) + 1;
    this.rows = Math.round((this.maxZ - this.minZ) / this.cellSize) + 1;

    this.grid = [];
    this.blockedStatic = [];
    this.hazardCosts = [];

    this.initGrid();
    this.markBuildingObstacles();
  }

  initGrid() {
    this.grid = [];
    this.blockedStatic = [];
    this.hazardCosts = [];

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      this.blockedStatic[r] = [];
      this.hazardCosts[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = 0;
        this.blockedStatic[r][c] = false;
        this.hazardCosts[r][c] = 0;
      }
    }
  }

  worldToGrid(x, z) {
    const col = Math.round((x - this.minX) / this.cellSize);
    const row = Math.round((z - this.minZ) / this.cellSize);
    return {
      c: Math.max(0, Math.min(this.cols - 1, col)),
      r: Math.max(0, Math.min(this.rows - 1, row))
    };
  }

  gridToWorld(c, r) {
    return {
      x: this.minX + c * this.cellSize,
      z: this.minZ + r * this.cellSize
    };
  }

  markBoxBlocked(minX, maxX, minZ, maxZ) {
    const p1 = this.worldToGrid(minX, minZ);
    const p2 = this.worldToGrid(maxX, maxZ);

    for (let r = p1.r; r <= p2.r; r++) {
      for (let c = p1.c; c <= p2.c; c++) {
        if (this.grid[r] && this.grid[r][c] !== undefined) {
          this.grid[r][c] = 1; // Solid wall / obstacle
          this.blockedStatic[r][c] = true;
        }
      }
    }
  }

  markDoorWalkable(centerX, centerZ, spanX = 2.4, spanZ = 2.0) {
    const p1 = this.worldToGrid(centerX - spanX / 2, centerZ - spanZ / 2);
    const p2 = this.worldToGrid(centerX + spanX / 2, centerZ + spanZ / 2);

    for (let r = p1.r; r <= p2.r; r++) {
      for (let c = p1.c; c <= p2.c; c++) {
        if (this.grid[r] && this.grid[r][c] !== undefined) {
          this.grid[r][c] = 0; // Clear doorway
          this.blockedStatic[r][c] = false;
        }
      }
    }
  }

  markBuildingObstacles() {
    // 1. Exterior Perimeter Walls
    this.markBoxBlocked(-29.5, -28.0, -23.5, -2.5); // West Wall Top
    this.markBoxBlocked(-29.5, -28.0, 2.5, 23.5);   // West Wall Bottom (Stairwell A at z: 0 is open)
    this.markBoxBlocked(28.0, 29.5, -23.5, -2.5);   // East Wall Top
    this.markBoxBlocked(28.0, 29.5, 2.5, 23.5);     // East Wall Bottom (Stairwell B at z: 0 is open)

    this.markBoxBlocked(-29.0, 29.0, -23.5, -22.2); // North Outer Wall
    this.markBoxBlocked(-29.0, -3.5, 22.2, 23.5);   // South Outer Wall Left
    this.markBoxBlocked(3.5, 29.0, 22.2, 23.5);    // South Outer Wall Right (South Exit C open at center)

    // 2. Central Corridor Walls (Running along X axis)
    // North corridor wall at z = -2.6
    this.markBoxBlocked(-25.5, 25.5, -3.0, -2.2);
    // South corridor wall at z = 2.6
    this.markBoxBlocked(-25.5, 25.5, 2.2, 3.0);

    // 3. Room Dividing Walls (Perpendicular to corridor)
    const dividers = [-15.0, -6.0, 3.0, 14.0];
    dividers.forEach(x => {
      // North wing dividers
      this.markBoxBlocked(x - 0.25, x + 0.25, -22.0, -3.0);
      // South wing dividers
      this.markBoxBlocked(x - 0.25, x + 0.25, 3.0, 22.0);
    });

    // 4. Carve out PRECISE 10 PHYSICAL DOORWAYS on corridor walls
    const doorXPositions = [-19.5, -10.5, -1.5, 8.5, 19.0];

    // North wing 5 doors (openings along X at z = -2.6)
    doorXPositions.forEach(x => {
      this.markDoorWalkable(x, -2.6, 2.4, 1.8);
    });

    // South wing 5 doors (openings along X at z = 2.6)
    doorXPositions.forEach(x => {
      this.markDoorWalkable(x, 2.6, 2.4, 1.8);
    });

    // 5. Clear Stairwell Access Corridors
    this.markDoorWalkable(-26.0, 0, 3.5, 3.5); // West Stairwell Core
    this.markDoorWalkable(26.0, 0, 3.5, 3.5);  // East Stairwell Core
    this.markDoorWalkable(0, 22.8, 4.0, 2.5);  // South Main Lobby Exit
  }

  setFireZone(centerX, centerZ, radius = 5.5) {
    const center = this.worldToGrid(centerX, centerZ);
    const gridRadius = Math.round(radius / this.cellSize);

    for (let r = Math.max(0, center.r - gridRadius); r <= Math.min(this.rows - 1, center.r + gridRadius); r++) {
      for (let c = Math.max(0, center.c - gridRadius); c <= Math.min(this.cols - 1, center.c + gridRadius); c++) {
        const dist = Math.hypot(c - center.c, r - center.r) * this.cellSize;
        if (dist <= radius) {
          if (dist <= 2.8) {
            this.grid[r][c] = 1; // Unwalkable core flames
          }
          this.hazardCosts[r][c] = Math.max(this.hazardCosts[r][c] || 0, (radius - dist) * 35);
        }
      }
    }
  }

  resetDynamicHazards() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.blockedStatic[r][c]) {
          this.grid[r][c] = 0;
        }
        this.hazardCosts[r][c] = 0;
      }
    }
  }

  isWalkable(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    return this.grid[r][c] === 0;
  }
}
