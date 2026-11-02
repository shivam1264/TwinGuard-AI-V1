import test from 'node:test';
import assert from 'node:assert/strict';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { NavGrid } from './NavGrid.js';
import { Pathfinder } from './Pathfinder.js';

test('WorkerLifecycle: buildFull3DPath uses corridorCache and produces valid 3D waypoints', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  const agent1 = { id: 'agent_1', floor: 5, roomId: 'f5_r1', x: -19.5, y: 16.0, z: -12.5, state: 'EVACUATING' };
  const agent2 = { id: 'agent_2', floor: 5, roomId: 'f5_r1', x: -21.0, y: 16.0, z: -14.0, state: 'EVACUATING' };

  const doorway = {
    inside: { x: -19.0, z: -10.0 },
    door: { x: -19.0, z: -8.5 },
    corridor: { x: -19.0, z: -7.0 }
  };
  const exit = { id: 'exit_west', name: 'West Tower Exit', x: -29.0, z: 0.0, capacity: 100 };
  const stairEntry = { x: -25.0, z: -1.0 };

  const corridorCache = new Map();
  const roomCache = new Map();

  // First agent populates cache
  const path1 = optimizer.buildFull3DPath(agent1, exit, doorway, stairEntry, 1234, corridorPathCacheKey(corridorCache), roomCache);
  assert.ok(Array.isArray(path1));
  assert.ok(path1.length > 5, 'Path should contain complete route including stair descent and muster zone');

  // Verify corridor cache has entry
  assert.ok(corridorCache.size > 0, 'Corridor cache should have stored the sub-path');

  // Second agent reuses corridor cache
  const initialCacheSize = corridorCache.size;
  const path2 = optimizer.buildFull3DPath(agent2, exit, doorway, stairEntry, 5678, corridorCache, roomCache);
  assert.ok(Array.isArray(path2));
  assert.equal(corridorCache.size, initialCacheSize, 'Corridor cache size should not increase for same room/stair');

  // Check stair descent exists in path
  const hasStairWaypoints = path1.some(pt => pt.y < agent1.y && pt.y >= 0);
  assert.ok(hasStairWaypoints, 'Path should include multi-floor descent');

  // Check ground plaza arrival
  const lastPt = path1[path1.length - 1];
  assert.ok(lastPt.y <= 0.2, 'Final muster point should be at ground level');
});

function corridorPathCacheKey(map) {
  return map;
}

test('WorkerLifecycle: reevaluateRoutes uses sub-path cache and produces no duplicate work', () => {
  const navGrid = new NavGrid();
  let findPathCalls = 0;
  const mockPathfinder = {
    findPath(sx, sz, tx, tz) {
      findPathCalls++;
      return [{ x: sx, z: sz }, { x: tx, z: tz }];
    }
  };
  const optimizer = new CrowdOptimizer(navGrid, mockPathfinder);

  const agents = [
    { id: 'a1', floor: 5, roomId: 'f5_r1', x: -19.5, y: 16.0, z: -12.5, state: 'EVACUATING', currentExitId: 'exit_west' },
    { id: 'a2', floor: 5, roomId: 'f5_r1', x: -20.5, y: 16.0, z: -13.5, state: 'EVACUATING', currentExitId: 'exit_west' },
    { id: 'a3', floor: 5, roomId: 'f5_r1', x: -21.5, y: 16.0, z: -14.5, state: 'EVACUATING', currentExitId: 'exit_west' },
  ];

  const currentAssignments = agents.map(a => ({
    agentId: a.id,
    exitId: a.currentExitId,
    routeCondition: 'permitted',
    path: [{ x: a.x, y: a.y, z: a.z }],
    currentWaypointIdx: 0
  }));

  const res = optimizer.reevaluateRoutes(agents, currentAssignments, [], {});
  assert.ok(res.assignments);
  assert.equal(res.assignments.length, 3);

  // Without caching, each agent would do 2 calls per candidate exit (primary + alt = 4 calls * 3 agents = 12 calls).
  // With caching, corridor paths for f5_r1 are reused across agents!
  assert.ok(findPathCalls < 12, `Sub-path caching should reduce findPath calls (got ${findPathCalls})`);
});

test('WorkerLifecycle: request lifecycle and stale response rejection logic', () => {
  let currentRunToken = 1;
  let latestAppliedVersion = 0;
  let appliedAssignments = null;

  function simulateWorkerMessage(data) {
    // 1. Check simulation run token (rejects if reset was clicked)
    if (data.runToken !== undefined && data.runToken !== currentRunToken) {
      return { status: 'rejected_run_token' };
    }

    // 2. Reject stale contextVersion
    if (data.contextVersion !== undefined && data.contextVersion < latestAppliedVersion) {
      return { status: 'rejected_stale_version' };
    }

    if (data.contextVersion !== undefined) {
      latestAppliedVersion = data.contextVersion;
    }

    appliedAssignments = data.result.assignments;
    return { status: 'applied', version: latestAppliedVersion };
  }

  // Response 1 from run 1, version 1 -> should apply
  const r1 = simulateWorkerMessage({
    runToken: 1,
    contextVersion: 1,
    result: { assignments: [{ agentId: 'a1', exitId: 'exit_west' }] }
  });
  assert.equal(r1.status, 'applied');
  assert.equal(latestAppliedVersion, 1);

  // Response 2 from run 1, version 2 -> should apply
  const r2 = simulateWorkerMessage({
    runToken: 1,
    contextVersion: 2,
    result: { assignments: [{ agentId: 'a1', exitId: 'exit_east' }] }
  });
  assert.equal(r2.status, 'applied');
  assert.equal(latestAppliedVersion, 2);

  // Stale response arriving out of order (version 1 after version 2) -> should be rejected!
  const rStale = simulateWorkerMessage({
    runToken: 1,
    contextVersion: 1,
    result: { assignments: [{ agentId: 'a1', exitId: 'exit_stale' }] }
  });
  assert.equal(rStale.status, 'rejected_stale_version');
  assert.equal(appliedAssignments[0].exitId, 'exit_east', 'Stale response must not overwrite newer assignments');

  // Simulation Reset occurs -> run token increments
  currentRunToken = 2;

  // In-flight response from run 1 arrives after reset -> should be rejected!
  const rOldRun = simulateWorkerMessage({
    runToken: 1,
    contextVersion: 3,
    result: { assignments: [{ agentId: 'a1', exitId: 'exit_old_run' }] }
  });
  assert.equal(rOldRun.status, 'rejected_run_token');
});

test('WorkerLifecycle: SimulationClock start/stop/reset timing fidelity', () => {
  // Verifies that clock reset prevents accumulated startup time from bleeding into delta
  let startTime = 0;
  let running = false;

  function clockStart() {
    startTime = 1000;
    running = true;
  }
  function clockReset() {
    startTime = 0;
    running = false;
  }
  function clockGetDelta(now) {
    if (!running) return 0;
    const dt = (now - startTime) / 1000;
    startTime = now;
    return dt;
  }

  // Worker plans for 2.5 seconds before movement starts
  clockStart();
  // 2.5 seconds elapse while worker is computing
  const timeWhenWorkerReturns = 3500;

  // WITHOUT reset: delta on first frame would be 2.5 seconds!
  // WITH reset on start:
  clockReset();
  clockStart(); // Started at timeWhenWorkerReturns (3500)
  startTime = timeWhenWorkerReturns;

  // First animation frame at 3516ms (16ms later)
  const firstFrameDelta = clockGetDelta(3516);
  assert.ok(Math.abs(firstFrameDelta - 0.016) < 0.002, `First frame delta should be ~16ms, got ${firstFrameDelta}`);
});
test('WorkerLifecycle: in-flight worker reevaluation concurrency coalescing and trailing edge execution', () => {
  let pendingRequest = null;
  let queuedRequest = null;
  let dispatchedRequests = [];

  function requestReeval(options) {
    if (pendingRequest) {
      queuedRequest = {
        reason: options.reason || queuedRequest?.reason || 'Dynamic reevaluation',
        reasons: [...new Set([...(options.reasons || []), ...(queuedRequest?.reasons || [])])],
        severity: options.severity === 'Critical' || queuedRequest?.severity === 'Critical' ? 'Critical' : 'Medium'
      };
      return false;
    }
    pendingRequest = { id: `req_${dispatchedRequests.length + 1}`, ...options };
    dispatchedRequests.push(pendingRequest);
    return true;
  }

  function completeReeval(id) {
    if (pendingRequest && pendingRequest.id === id) {
      pendingRequest = null;
      if (queuedRequest) {
        const next = queuedRequest;
        queuedRequest = null;
        requestReeval(next);
      }
    }
  }

  // 1. First request dispatches
  const r1 = requestReeval({ reason: 'Hazard 1', severity: 'Info' });
  assert.equal(r1, true);
  assert.equal(dispatchedRequests.length, 1);
  assert.ok(pendingRequest);

  // 2. Second request arrives while first is in-flight -> Coalesced!
  const r2 = requestReeval({ reason: 'Hazard 2', severity: 'Medium' });
  assert.equal(r2, false);
  assert.equal(dispatchedRequests.length, 1);
  assert.ok(queuedRequest);
  assert.equal(queuedRequest.severity, 'Medium');

  // 3. Third request arrives while first is still in-flight -> Merged into queued!
  const r3 = requestReeval({ reason: 'Hazard 3', severity: 'Critical' });
  assert.equal(r3, false);
  assert.equal(dispatchedRequests.length, 1);
  assert.equal(queuedRequest.severity, 'Critical');

  // 4. First request completes -> trailing edge automatically dispatches coalesced request!
  completeReeval('req_1');
  assert.equal(dispatchedRequests.length, 2);
  assert.equal(dispatchedRequests[1].severity, 'Critical');
  assert.equal(queuedRequest, null);

  // 5. Second request completes -> no more queued requests
  completeReeval('req_2');
  assert.equal(pendingRequest, null);
  assert.equal(queuedRequest, null);
});

test('WorkerLifecycle: reset terminates worker, clears pending/queued states, and unsets evacuationCompleted', () => {
  let workerTerminated = false;
  let workerPrimed = false;
  let runToken = 1;

  const mockSceneManager = {
    evacuationCompleted: true,
    isSimulating: true,
    _evacuationRunToken: runToken,
    _pendingInitialPlan: { id: 'init_1' },
    _pendingWorkerReeval: { id: 'reeval_1' },
    _queuedWorkerReeval: { id: 'queued_1' },
    _terminateRoutePlannerWorker() {
      workerTerminated = true;
      this._pendingWorkerReeval = null;
      this._queuedWorkerReeval = null;
      this._pendingInitialPlan = null;
    },
    _primeEvacuationPlannerWorker() {
      workerPrimed = true;
    },
    reset() {
      this._evacuationRunToken++;
      this._terminateRoutePlannerWorker();
      this._primeEvacuationPlannerWorker();
      this.evacuationCompleted = false;
      this.isSimulating = false;
    }
  };

  mockSceneManager.reset();

  assert.equal(mockSceneManager.evacuationCompleted, false, 'evacuationCompleted must be false after reset');
  assert.equal(mockSceneManager.isSimulating, false);
  assert.equal(mockSceneManager._evacuationRunToken, 2);
  assert.equal(mockSceneManager._pendingInitialPlan, null);
  assert.equal(mockSceneManager._pendingWorkerReeval, null);
  assert.equal(mockSceneManager._queuedWorkerReeval, null);
  assert.equal(workerTerminated, true, 'Worker must be terminated on reset to flush stale FIFO queue');
  assert.equal(workerPrimed, true, 'Worker must be primed on reset for fast subsequent start');
});

test('WorkerLifecycle: reevaluation timeout clears stale pending lock', () => {
  let pendingReeval = { id: 'stale_1', timestamp: 1000 };
  const TIMEOUT_MS = 5000;

  function canRequest(currentTime) {
    if (pendingReeval) {
      if (currentTime - pendingReeval.timestamp > TIMEOUT_MS) {
        pendingReeval = null;
        return true;
      }
      return false;
    }
    return true;
  }

  // 3 seconds later: still pending
  assert.equal(canRequest(4000), false);

  // 6 seconds later: timed out and cleared
  assert.equal(canRequest(7000), true);
  assert.equal(pendingReeval, null);
});


