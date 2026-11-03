import { NavGrid } from './NavGrid.js';
import { Pathfinder } from './Pathfinder.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';

// Load and exercise the planning stack as soon as the page creates this worker.
// This moves module parsing, grid construction and first-use JIT work off the
// first evacuation click, where it used to be visible as a cold-start pause.
const navGrid = new NavGrid();
const pathfinder = new Pathfinder(navGrid);
const optimizer = new CrowdOptimizer(navGrid, pathfinder);

try {
  optimizer.optimizeRoutes([
    { id: 'planner_warmup', roomId: 'f1_r1', floor: 1, x: 0, y: 0.175, z: 0, state: 'IDLE' }
  ]);
} catch {
  // Warm-up is best-effort; a real request still reports any planning error.
}

self.postMessage({ type: 'ready' });

self.onmessage = ({ data }) => {
  try {
    if (data.grid) navGrid.grid = data.grid;
    if (data.hazardCosts) navGrid.hazardCosts = data.hazardCosts;
    if (data.congestionCosts) navGrid.congestionCosts = data.congestionCosts;
    if (data.structuralBoxes) navGrid.structuralBoxes = new Map(data.structuralBoxes);
    if (data.fireZones) navGrid.fireZones = new Map(data.fireZones);

    if (data.exits) optimizer.exits = data.exits;

    let result;
    if (data.type === 'reevaluate') {
      result = optimizer.reevaluateRoutes(
        data.agents,
        data.currentAssignments || [],
        data.fireLocations || [],
        {
          routingContext: data.routingContext || null,
          blockedExitIds: data.blockedExitIds || []
        }
      );
    } else {
      result = optimizer.optimizeRoutes(
        data.agents,
        data.fireLocations,
        data.blockedExitIds,
        data.strategyType,
        data.floorBlockedMap,
        data.structuralCollapse
      );
    }

    self.postMessage({
      id: data.id,
      runToken: data.runToken,
      contextVersion: data.contextVersion,
      type: 'complete',
      result
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      runToken: data.runToken,
      contextVersion: data.contextVersion,
      error: error?.message || String(error)
    });
  }
};
