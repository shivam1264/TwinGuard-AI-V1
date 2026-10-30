const { NavGrid } = require('./src/simulation/NavGrid.js');
const { Pathfinder } = require('./src/simulation/Pathfinder.js');

const navGrid = new NavGrid();

console.log('Grid size:', navGrid.cols, 'x', navGrid.rows);
console.log('minX:', navGrid.minX, 'maxX:', navGrid.maxX);
console.log('minZ:', navGrid.minZ, 'maxZ:', navGrid.maxZ);
console.log('cellSize:', navGrid.cellSize);

console.log('Corridor row 48 world Z:', navGrid.gridToWorld(0, 48).z);
console.log('Corridor row 40 world Z:', navGrid.gridToWorld(0, 40).z);

const start = navGrid.worldToGrid(-20, 0);
const goal = navGrid.worldToGrid(20, 0);
console.log('Start grid:', start);
console.log('Goal grid:', goal);

const navGrid2 = new NavGrid();
for (let r = 0; r < navGrid2.rows; r++) {
  for (let c = 0; c < navGrid2.cols; c++) {
    if (r !== 40 && r !== 48 && !(r >= 40 && r <= 48 && (c === 20 || c === 100))) {
      navGrid2.grid[r][c] = 1;
      navGrid2.blockedStatic[r][c] = true;
    }
  }

for (let c = 0; c < navGrid2.cols; c++) {
  navGrid2.grid[48][c] = 0;
  navGrid2.blockedStatic[48][c] = false;
  navGrid2.grid[40][c] = 0;
  navGrid2.blockedStatic[40][c] = false;
}

for (let r = 40; r <= 48; r++) {
  navGrid2.grid[r][20] = 0;
  navGrid2.blockedStatic[r][20] = false;
  navGrid2.grid[r][100] = 0;
  navGrid2.blockedStatic[r][100] = false;
}

for (let c = 40; c <= 80; c++) { navGrid2.hazardCosts[48][c] = 100000; }
for (let c = 0; c < navGrid2.cols; c++) { navGrid2.hazardCosts[40][c] = 0; }

const { Pathfinder } = require('./src/simulation/Pathfinder.js');
const pf = new Pathfinder(navGrid2);
const path = pf.findPath(-20, 0, 20, 0);
console.log('Path length:', path.length);
console.log('Path points:', path);

for (const point of path) {
  const g = navGrid2.worldToGrid(point.x, point.z);
  if (!navGrid2.isWalkable(g.c, g.r)) {
    console.log('PATH GOES THROUGH BLOCKED CELL:', point, 'grid:', g);
  }
}

const rows = [...new Set(path.map(p => navGrid2.worldToGrid(p.x, p.z).r))];
console.log('Path rows used:', rows);