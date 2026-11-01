// ==============================================================================
// TwinGuard AI — Granular Multi-Hazard & 3D Structural Collapse Verification Test
// ==============================================================================

import assert from 'assert';
import * as THREE from 'three';
import { NavGrid } from '../src/simulation/NavGrid.js';
import { NavigationGraph, EDGE_STATUS } from '../src/simulation/NavigationGraph.js';
import { RouteOptimizationEngine } from '../src/simulation/RouteOptimizationEngine.js';
import { CrowdOptimizer } from '../src/simulation/CrowdOptimizer.js';
import { Pathfinder } from '../src/simulation/Pathfinder.js';

console.log('=======================================================');
console.log('🧪 RUNNING GRANULAR MULTI-HAZARD & 3D COLLAPSE VERIFICATION');
console.log('=======================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${desc}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error('    Error:', err.message);
  }
}

// --------------------------------------------------------------------------
console.log('--- Test Suite 1: NavGrid Exact Bounds & Floor Scoping ---');
// --------------------------------------------------------------------------
const navGrid = new NavGrid(60, 48, 0.5);

it('NavGrid accurately identifies cell walkable under normal state', () => {
  const c = navGrid.worldToGrid(-22, 0);
  assert.strictEqual(navGrid.isWalkable(c.c, c.r), true);
});

it('NavGrid markStructuralBlocked accepts zone with bounds property', () => {
  const zone = {
    floor: 4,
    bounds: { minX: -25, maxX: -20, minZ: -2.5, maxZ: 2.5 }
  };
  navGrid.markStructuralBlocked('corr_f4_west', zone, 4);
  assert.strictEqual(navGrid.structuralBoxes.has('corr_f4_west'), true);
  const stored = navGrid.structuralBoxes.get('corr_f4_west');
  assert.strictEqual(stored.minX, -25);
  assert.strictEqual(stored.maxX, -20);
  assert.strictEqual(stored.floor, 4);
});

it('NavGrid.isWalkable returns FALSE inside rubble on Floor 4', () => {
  navGrid.routeFloor = 4;
  const c = navGrid.worldToGrid(-22, 0);
  assert.strictEqual(navGrid.isWalkable(c.c, c.r), false);
});

it('NavGrid.isWalkable returns TRUE at same coordinates on Floor 5 (floor isolated)', () => {
  navGrid.routeFloor = 5;
  const c = navGrid.worldToGrid(-22, 0);
  assert.strictEqual(navGrid.isWalkable(c.c, c.r), true);
  navGrid.routeFloor = null;
});

it('NavGrid unmarkStructuralBlocked restores walkability on Floor 4', () => {
  navGrid.unmarkStructuralBlocked('corr_f4_west');
  navGrid.routeFloor = 4;
  const c = navGrid.worldToGrid(-22, 0);
  assert.strictEqual(navGrid.isWalkable(c.c, c.r), true);
  navGrid.routeFloor = null;
});

// --------------------------------------------------------------------------
console.log('\n--- Test Suite 2: NavigationGraph Topological Block & Unblock Methods ---');
// --------------------------------------------------------------------------
const navGraph = new NavigationGraph(10, 3.8);

it('blockRoom severs room doorway edges', () => {
  navGraph.blockRoom('f4_r2');
  let blockedCount = 0;
  navGraph.edges.forEach((edge) => {
    if ((edge.from && edge.from.includes('f4_r2')) || (edge.to && edge.to.includes('f4_r2'))) {
      if (edge.status === EDGE_STATUS.BLOCKED) blockedCount++;
    }
  });
  assert.ok(blockedCount >= 2, `Expected at least 2 blocked edges for room f4_r2, got ${blockedCount}`);
});

it('unblockRoom restores room doorway edges to OPEN', () => {
  navGraph.unblockRoom('f4_r2');
  let blockedCount = 0;
  navGraph.edges.forEach((edge) => {
    if ((edge.from && edge.from.includes('f4_r2')) || (edge.to && edge.to.includes('f4_r2'))) {
      if (edge.status === EDGE_STATUS.BLOCKED) blockedCount++;
    }
  });
  assert.strictEqual(blockedCount, 0, `Expected 0 blocked edges after unblocking f4_r2`);
});

it('blockExit severs ground exit portal edges', () => {
  navGraph.blockExit('exit_west');
  let westBlocked = 0;
  navGraph.edges.forEach((edge) => {
    if (edge.from === 'node_exit_a_west' || edge.to === 'node_exit_a_west') {
      if (edge.status === EDGE_STATUS.BLOCKED) westBlocked++;
    }
  });
  assert.ok(westBlocked >= 1, `Expected ground exit A edges to be blocked, got ${westBlocked}`);
});

it('unblockExit restores ground exit portal edges to OPEN', () => {
  navGraph.unblockExit('exit_west');
  let westBlocked = 0;
  navGraph.edges.forEach((edge) => {
    if (edge.from === 'node_exit_a_west' || edge.to === 'node_exit_a_west') {
      if (edge.status === EDGE_STATUS.BLOCKED) westBlocked++;
    }
  });
  assert.strictEqual(westBlocked, 0, `Expected 0 blocked edges after unblocking exit_west`);
});

it('blockCorridor severs corridor segment edges on target floor', () => {
  navGraph.blockCorridor(4, { minX: -25, maxX: -15, minZ: -3, maxZ: 3 });
  let corrBlocked = 0;
  navGraph.edges.forEach((edge) => {
    if (edge.floor === 4 && edge.status === EDGE_STATUS.BLOCKED) corrBlocked++;
  });
  assert.ok(corrBlocked >= 1, `Expected at least 1 blocked corridor edge on floor 4, got ${corrBlocked}`);
});

it('unblockCorridor restores corridor segment edges on target floor to OPEN', () => {
  navGraph.unblockCorridor(4, { minX: -25, maxX: -15, minZ: -3, maxZ: 3 });
  let corrBlocked = 0;
  navGraph.edges.forEach((edge) => {
    if (edge.floor === 4 && edge.status === EDGE_STATUS.BLOCKED) corrBlocked++;
  });
  assert.strictEqual(corrBlocked, 0, `Expected 0 blocked corridor edges after unblocking`);
});

it('blockStairwell severs stairwell and landing edges on target floor', () => {
  navGraph.blockStairwell('stair_f4_west', 4);
  const edgeStair = navGraph.edges.get('edge_f4_corr_to_west_stair');
  assert.ok(edgeStair && edgeStair.status === EDGE_STATUS.BLOCKED, 'edge_f4_corr_to_west_stair must be BLOCKED');
});

it('unblockStairwell restores stairwell and landing edges to OPEN', () => {
  navGraph.unblockStairwell('stair_f4_west', 4);
  const edgeStair = navGraph.edges.get('edge_f4_corr_to_west_stair');
  assert.ok(edgeStair && edgeStair.status === EDGE_STATUS.OPEN, 'edge_f4_corr_to_west_stair must be OPEN');
});

// --------------------------------------------------------------------------
console.log('\n--- Test Suite 3: CrowdOptimizer Egress Invariants (Zero Hazard Walk-Through) ---');
// --------------------------------------------------------------------------
const pathfinder = new Pathfinder(navGrid);
const crowdOptimizer = new CrowdOptimizer(navGrid, pathfinder);

it('When Ground West Exit is collapsed, upper-floor occupants descending West stair safely cross over to East/South gate', () => {
  const agents = [
    { id: 'agent_l4_1', x: -18, y: 11.4, z: 0, floor: 4, roomId: 'f4_r1', state: 'INSIDE_ROOM' },
    { id: 'agent_l4_2', x: -10, y: 11.4, z: 0, floor: 4, roomId: 'f4_r2', state: 'INSIDE_ROOM' }
  ];

  // Ground West Exit is blocked
  const blockedExits = ['exit_west'];
  const collapse = [{ floor: 1, kind: 'EXIT', locId: 'exit_west', coreBlocked: 'exit_west' }];

  const plan = crowdOptimizer.optimizeRoutes(agents, [], blockedExits, 'LOAD_BALANCED', null, collapse);
  assert.ok(plan && plan.assignments, 'Plan must be generated');
  assert.strictEqual(plan.assignments.length, 2);

  plan.assignments.forEach((asg) => {
    // Assert that no agent path exits via West Gate (-38, 0, 0)
    const touchesWestGateOutside = asg.path.some((pt) => pt.x <= -33.0);
    assert.strictEqual(touchesWestGateOutside, false, `Agent ${asg.agentId} should NOT walk through blocked West Gate`);
    // Assert path ends at an unblocked exit (East or South)
    assert.notStrictEqual(asg.exitId, 'exit_west', `Agent exitId must not be exit_west`);
  });
});

it('When Floor 4 West Corridor is collapsed, occupants on Floor 4 divert to East Stair Core B', () => {
  const agents = [
    { id: 'agent_l4_east', x: 8, y: 11.4, z: 0, floor: 4, roomId: 'f4_r4', state: 'INSIDE_ROOM' }
  ];

  const collapse = [{
    floor: 4,
    kind: 'CORRIDOR',
    locId: 'corr_f4_west',
    bounds: { minX: -25, maxX: -15, minZ: -2.5, maxZ: 2.5 },
    coreBlocked: 'exit_west'
  }];

  const plan = crowdOptimizer.optimizeRoutes(agents, [], [], 'LOAD_BALANCED', null, collapse);
  assert.ok(plan && plan.assignments.length > 0);
  const asg = plan.assignments[0];
  assert.strictEqual(asg.exitId, 'exit_east', 'Occupant must route via East Stair Core B when West Corridor is collapsed');
  // Check that path never crosses the collapsed zone x in [-25, -15]
  const crossesCollapse = asg.path.some((pt) => pt.y === 11.4 && pt.x >= -25 && pt.x <= -15);
  assert.strictEqual(crossesCollapse, false, 'Occupant must never step into the collapsed corridor bounds');
});

// --------------------------------------------------------------------------
console.log('\n=======================================================');
console.log(`🎯 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('=======================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
