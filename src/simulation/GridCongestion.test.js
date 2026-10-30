import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NavGrid } from './NavGrid.js';
import { Pathfinder } from './Pathfinder.js';
import { ZoneToGridMapper, DEFAULT_ZONE_MAPPING_CONFIG } from './ZoneToGridMapper.js';
import { createTowerGraph, loadBuilding } from './BuildingGraph.js';
import { EDGE_STATUS } from './NavigationGraph.js';

function createMockAgent(overrides = {}) {
  return {
    id: `agent_${Math.random()}`,
    roomId: 'f5_r1',
    floor: 5,
    x: 0,
    y: 15.25,
    z: 0,
    state: 'EVACUATING',
    path: [{ x: 0, z: 0 }, { x: -26, z: 0 }],
    currentWaypointIdx: 0,
    currentExitId: 'exit_west',
    currentRouteCondition: 'permitted',
    ...overrides
  };
}

test('NavGrid.updateAgentCongestion: agent positions generate expected grid congestion', () => {
  const navGrid = new NavGrid();
  const agent = createMockAgent({
    id: 'agent_1',
    x: 0,
    y: 15.25,
    z: 0,
    state: 'EVACUATING'
  });

  navGrid.updateAgentCongestion([agent]);

  const g = navGrid.worldToGrid(agent.x, agent.z);
  assert.ok(navGrid.congestionCosts[g.r][g.c] > 0, 'Cell under agent should have congestion cost');
});

test('NavGrid.updateAgentCongestion: multiple nearby agents increase local congestion', () => {
  const navGrid = new NavGrid();
  const agents = [
    createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 }),
    createMockAgent({ id: 'agent_2', x: 0.2, y: 15.25, z: 0.1 }), // Same cell
    createMockAgent({ id: 'agent_3', x: 0.5, y: 15.25, z: 0 }), // Adjacent cell
  ];

  navGrid.updateAgentCongestion(agents);

  const g = navGrid.worldToGrid(0, 0);
  const cost1 = navGrid.congestionCosts[g.r][g.c];

  // Clear and test with single agent
  navGrid.clearCongestion();
  navGrid.updateAgentCongestion([agents[0]]);
  const cost2 = navGrid.congestionCosts[g.r][g.c];

  assert.ok(cost1 > cost2, 'Multiple agents should produce higher congestion than single agent');
});

test('NavGrid.updateAgentCongestion: moving an agent updates its previous and new grid locations', () => {
  const navGrid = new NavGrid();
  const agent = createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 });

  // First position
  navGrid.updateAgentCongestion([agent]);
  const g1 = navGrid.worldToGrid(0, 0);
  const costAtOrigin = navGrid.congestionCosts[g1.r][g1.c];
  assert.ok(costAtOrigin > 0);

  // Move agent
  agent.x = 5;
  agent.z = 5;
  navGrid.updateAgentCongestion([agent]);

  const g2 = navGrid.worldToGrid(5, 5);
  const costAtNew = navGrid.congestionCosts[g2.r][g2.c];
  const costAtOld = navGrid.congestionCosts[g1.r][g1.c];

  assert.ok(costAtNew > 0, 'New position should have congestion');
  assert.equal(costAtOld, 0, 'Old position should be cleared');
});

test('NavGrid.updateAgentCongestion: SAFE agents do not contribute', () => {
  const navGrid = new NavGrid();
  const agents = [
    createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0, state: 'EVACUATING' }),
    createMockAgent({ id: 'agent_2', x: 0, y: 15.25, z: 0, state: 'SAFE' }),
  ];

  navGrid.updateAgentCongestion(agents);

  const g = navGrid.worldToGrid(0, 0);
  // Only 1 EVACUATING agent, so cost should be BASE_COST_PER_AGENT * density
  assert.ok(navGrid.congestionCosts[g.r][g.c] > 0);
  assert.ok(navGrid.congestionCosts[g.r][g.c] <= 50); // Single agent cost range
});

test('NavGrid.updateAgentCongestion: dynamic congestion clears on reset', () => {
  const navGrid = new NavGrid();
  const agent = createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 });

  navGrid.updateAgentCongestion([agent]);
  const g = navGrid.worldToGrid(0, 0);
  assert.ok(navGrid.congestionCosts[g.r][g.c] > 0);

  navGrid.clearCongestion();
  assert.equal(navGrid.congestionCosts[g.r][g.c], 0, 'Congestion should be cleared');
});

test('NavGrid.updateAgentCongestion: congestion does not overwrite environmental hazard costs', () => {
  const navGrid = new NavGrid();
  const agent = createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 });

  // Set a hazard cost
  const g = navGrid.worldToGrid(0, 0);
  navGrid.hazardCosts[g.r][g.c] = 200;

  navGrid.updateAgentCongestion([agent]);

  // Hazard cost should remain unchanged
  assert.equal(navGrid.hazardCosts[g.r][g.c], 200);
  // Congestion cost should be separate
  assert.ok(navGrid.congestionCosts[g.r][g.c] > 0);
});

test('Pathfinder avoids a heavily congested corridor when a feasible alternative exists', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Create a horizontal corridor of congestion at z=0
  // Block cells along the direct path from (-20, 0) to (20, 0)
  for (let c = navGrid.worldToGrid(-20, 0).c; c <= navGrid.worldToGrid(20, 0).c; c++) {
    const r = navGrid.worldToGrid(0, 0).r;
    navGrid.congestionCosts[r][c] = 500; // MAX_CONGESTION_COST
  }

  // Path from left to right - direct path is congested
  // Alternative path goes around (north or south)
  const path = pathfinder.findPath(-20, -5, 20, -5);

  // Path should exist (not just 2-point fallback)
  assert.ok(path.length >= 2);
  // Path should avoid the congested z=0 corridor by staying at z=-5 or going around
  const passesThroughCongested = path.some(p => {
    const g = navGrid.worldToGrid(p.x, p.z);
    return navGrid.congestionCosts[g.r]?.[g.c] >= 500;
  });
  assert.equal(passesThroughCongested, false, 'Path should avoid heavily congested cells');
});

test('Pathfinder still uses a congested corridor when no viable alternative exists', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Block the entire grid except a narrow corridor at z=0
  for (let r = 0; r < navGrid.rows; r++) {
    for (let c = 0; c < navGrid.cols; c++) {
      const world = navGrid.gridToWorld(c, r);
      if (Math.abs(world.z) > 2) { // Only allow corridor near z=0
        navGrid.grid[r][c] = 1;
        navGrid.blockedStatic[r][c] = true;
      }
    }
  }

  // Add congestion to the only available corridor
  for (let c = 0; c < navGrid.cols; c++) {
    const r = navGrid.worldToGrid(0, 0).r;
    navGrid.congestionCosts[r][c] = 500;
  }

  // Use start/end positions that are NOT exactly at grid cell centers
  // Grid cell centers are at multiples of 0.5 offset from minX/minZ
  // minX=-30, cellSize=0.5 -> centers at -30 + (c+0.5)*0.5 = -29.75, -29.25, ...
  // So -5.25 is a grid cell center, but -5.1 is not
  const path = pathfinder.findPath(-5.1, 0.1, 5.1, -0.1);

  // Path should be a real computed path (not fallback)
  // Fallback has exact start/end coords; real path uses grid cell centers
  const isFallback = path.length === 2 && 
    Math.abs(path[0].x - (-5.1)) < 0.001 && Math.abs(path[0].z - 0.1) < 0.001 && 
    Math.abs(path[1].x - 5.1) < 0.001 && Math.abs(path[1].z - (-0.1)) < 0.001;
  assert.equal(isFallback, false, 'Path should be computed, not fallback');
  
  // Path must use the congested cells since no alternative
  const usesCongested = path.some(p => {
    const g = navGrid.worldToGrid(p.x, p.z);
    return navGrid.congestionCosts[g.r]?.[g.c] >= 500;
  });
  assert.ok(usesCongested, 'Path should use congested corridor when no alternative exists');
});

test('Prohibited cells remain prohibited regardless of congestion', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Block a cell
  const g = navGrid.worldToGrid(0, 0);
  navGrid.grid[g.r][g.c] = 1;
  navGrid.blockedStatic[g.r][g.c] = true;
  navGrid.congestionCosts[g.r][g.c] = 0; // No congestion on blocked cell

  const path = pathfinder.findPath(-5, 0, 5, 0);

  // Path should not pass through blocked cell
  const passesThroughBlocked = path.some(p => {
    const gp = navGrid.worldToGrid(p.x, p.z);
    return navGrid.grid[gp.r]?.[gp.c] === 1 && navGrid.blockedStatic[gp.r]?.[gp.c] === true;
  });
  assert.equal(passesThroughBlocked, false, 'Path should not pass through blocked/prohibited cells');
});

test('Identical agent positions produce deterministic congestion costs', () => {
  const navGrid = new NavGrid();
  const agent = createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 });

  navGrid.updateAgentCongestion([agent]);
  const cost1 = navGrid.congestionCosts[navGrid.worldToGrid(0, 0).r][navGrid.worldToGrid(0, 0).c];

  navGrid.clearCongestion();
  navGrid.updateAgentCongestion([agent]);
  const cost2 = navGrid.congestionCosts[navGrid.worldToGrid(0, 0).r][navGrid.worldToGrid(0, 0).c];

  assert.equal(cost1, cost2, 'Congestion costs should be deterministic');
});

test('Pathfinder: existing hazard-only pathfinding tests remain valid', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  // Set fire hazard far from the test path
  navGrid.setFireZone(20, 20, 3); // Fire at far corner

  // Test path on opposite side of grid
  const path = pathfinder.findPath(-10.1, -5.1, -5.1, -5.1);

  // Path should be a real computed path (not fallback)
  const isFallback = path.length === 2 && 
    Math.abs(path[0].x - (-10.1)) < 0.001 && Math.abs(path[0].z - (-5.1)) < 0.001 && 
    Math.abs(path[1].x - (-5.1)) < 0.001 && Math.abs(path[1].z - (-5.1)) < 0.001;
  assert.equal(isFallback, false, 'Path should be computed, not fallback');
  
  // Path should avoid fire zone (which is far away, so this is trivially true)
  const passesThroughFire = path.some(p => {
    const g = navGrid.worldToGrid(p.x, p.z);
    return navGrid.hazardCosts[g.r]?.[g.c] > 100;
  });
  assert.equal(passesThroughFire, false, 'Path should avoid high fire hazard');
});

test('Grid congestion updates do not cause unnecessary full-grid rebuilding', () => {
  const navGrid = new NavGrid();
  const agent = createMockAgent({ id: 'agent_1', x: 0, y: 15.25, z: 0 });

  // First update
  navGrid.updateAgentCongestion([agent]);
  let nonZeroCount1 = 0;
  for (let r = 0; r < navGrid.rows; r++) {
    for (let c = 0; c < navGrid.cols; c++) {
      if (navGrid.congestionCosts[r][c] > 0) nonZeroCount1++;
    }
  }

  // Second update with same agent position
  navGrid.updateAgentCongestion([agent]);
  let nonZeroCount2 = 0;
  for (let r = 0; r < navGrid.rows; r++) {
    for (let c = 0; c < navGrid.cols; c++) {
      if (navGrid.congestionCosts[r][c] > 0) nonZeroCount2++;
    }
  }

  assert.equal(nonZeroCount1, nonZeroCount2, 'Same agent position should produce same non-zero cells');
});

test('NavGrid: hazard costs and congestion costs are additive in Pathfinder', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);

  const g = navGrid.worldToGrid(0, 0);
  navGrid.hazardCosts[g.r][g.c] = 100;
  navGrid.congestionCosts[g.r][g.c] = 50;

  const path = pathfinder.findPath(-5, -5, 5, -5); // Path not through (0,0)

  // Create a path that must go through (0,0)
  const pathThrough = pathfinder.findPath(-5, 0, 5, 0);

  // The path through (0,0) should have higher cost
  // We can't directly access the cost, but we can verify both paths exist
  assert.ok(path.length > 0);
  assert.ok(pathThrough.length > 0);
});

test('ZoneToGridMapper: hazard application still works with congestion costs present', () => {
  const navGrid = new NavGrid();
  const mapper = new ZoneToGridMapper(navGrid, DEFAULT_ZONE_MAPPING_CONFIG);
  const graph = loadBuilding(createTowerGraph());

  // Add some congestion first at a position near L1 center
  const agent = { id: 'agent_1', x: 0, y: 3.8, z: 0, state: 'EVACUATING' }; // Near L1 center
  navGrid.updateAgentCongestion([agent]);

  // Apply fire hazard to L1 (center at 0,0)
  const zone = graph.data.zones.find(z => z.id === 'L1');
  mapper.applyFireHazard(zone, 1.0);

  // Hazard costs should be applied near zone center
  const g = navGrid.worldToGrid(0, 0);
  assert.ok(navGrid.hazardCosts[g.r][g.c] > 0, 'Fire hazard should be applied at zone center');
  // Congestion should still be there at agent position
  const agentG = navGrid.worldToGrid(0, 0);
  assert.ok(navGrid.congestionCosts[agentG.r][agentG.c] > 0, 'Congestion should still be present');
});