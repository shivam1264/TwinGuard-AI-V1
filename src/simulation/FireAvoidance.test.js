import test from 'node:test';
import assert from 'node:assert/strict';
import { NavGrid } from './NavGrid.js';
import { Pathfinder } from './Pathfinder.js';
import { CrowdOptimizer } from './CrowdOptimizer.js';
import { AgentCrowd } from '../three/AgentCrowd.js';
import { ROOM_TEMPLATES } from './Doorways.js';

test('Occupant avoids corridor fire and routes to safe alternative exit on Ground Floor', () => {
  const navGrid = new NavGrid();
  const pathfinder = new Pathfinder(navGrid);
  const optimizer = new CrowdOptimizer(navGrid, pathfinder);

  // Agent at x: 10.0, z: 0.0 (East side of corridor on Floor 1)
  const agents = [{
    id: 'agent_test_1',
    roomId: 'f1_r4',
    floor: 1,
    x: 10.0,
    y: 0.175,
    z: 0.0,
    state: 'IDLE'
  }];

  // Fire in central corridor at x: -7.0, z: 0.0 on Floor 1
  const fireLocations = [{
    x: -7.0,
    y: 0.2,
    z: 0.0,
    floor: 1,
    radius: 5.5,
    roomId: 'corr_f1_west'
  }];

  const result = optimizer.optimizeRoutes(agents, fireLocations, [], 'LOAD_BALANCED');
  assert.ok(result.assignments.length === 1);
  const assignment = result.assignments[0];

  // The West exit (-26) is on the other side of the fire at x: -7
  // Agent starting at x: 10 MUST NOT be routed to exit_west through the fire!
  assert.notEqual(assignment.exitId, 'exit_west', 'Occupant must avoid West exit because corridor is blocked by fire');
  assert.ok(assignment.exitId === 'exit_east' || assignment.exitId === 'exit_south', 'Occupant must choose safe East or South exit');

  // Verify that none of the waypoints in the assigned path pass through the fire danger zone
  assignment.path.forEach(pt => {
    const distToFire = Math.hypot(pt.x - (-7.0), pt.z - 0.0);
    assert.ok(distToFire > 4.0, `Waypoint (${pt.x}, ${pt.z}) must not penetrate fire radius (dist: ${distToFire.toFixed(2)}m)`);
  });
});

test('Actively evacuating agent dynamically detects fire in front of them and reroutes away', () => {
  const fakeScene = { add: () => { }, remove: () => { } };
  const crowd = new AgentCrowd(fakeScene);

  // Set up mock fire system with a corridor fire at x: -6.0, z: 0.0 on Floor 1
  crowd.fireSystem = {
    activeFires: new Map([
      ['corr_f1_west', {
        floor: 1,
        basePos: { x: -6.0, y: 0.18, z: 0.0 },
        radius: 5.0
      }]
    ])
  };

  // Agent at x: 2.0, z: 0.0, walking West toward (-26, 0)
  const agent = {
    id: 'agent_dynamic_1',
    floor: 1,
    x: 2.0,
    y: 0.175,
    z: 0.0,
    state: 'EVACUATING',
    currentExitId: 'exit_west',
    assignedExitColor: '#00ff88',
    currentWaypointIdx: 0,
    path: [
      { x: -5.0, y: 0.15, z: 0.0 }, // this waypoint passes right into the fire at x = -6!
      { x: -26.4, y: 0.15, z: 0.0 }
    ],
    mesh: { rotation: { y: -Math.PI / 2 } }, // facing West
    reroutePause: 0
  };

  crowd.agents = [agent];

  const fires = crowd.getActiveFireList();
  assert.equal(fires.length, 1);

  // Check and avoid fire
  const didReroute = crowd.checkAndAvoidFire(agent, fires);
  assert.equal(didReroute, true, 'Agent must detect fire in path and trigger reroute');

  // Agent must be diverted away from exit_west to exit_east or exit_south
  assert.notEqual(agent.currentExitId, 'exit_west', 'Agent must change exit away from West');
  assert.ok(agent.currentExitId === 'exit_east' || agent.currentExitId === 'exit_south');

  // Agent must have a reroute pause to turn around
  assert.ok(agent.reroutePause > 0, 'Agent should pause and turn around');

  // Every waypoint in the new path must safely avoid the fire (distance > 4.5m)
  agent.path.forEach(pt => {
    const dist = Math.hypot(pt.x - (-6.0), pt.z - 0.0);
    assert.ok(dist >= 4.5, `Waypoint (${pt.x}, ${pt.z}) must avoid fire (dist: ${dist.toFixed(2)}m)`);
  });

  // Final destination must be an external safe exit
  const finalWaypoint = agent.path[agent.path.length - 1];
  assert.ok(finalWaypoint.z >= 20.0 || Math.abs(finalWaypoint.x) >= 25.0, 'Must safely reach exit perimeter');
});

test('Occupant to the West of corridor fire (Room f6_r1 / f6_r6) does NOT get stuck and continues safely to West Core A', () => {
  const fakeScene = { add: () => { }, remove: () => { } };
  const crowd = new AgentCrowd(fakeScene);

  // Corridor fire at corr_f6_west: x = -12.5, z = 0.0 on Floor 6
  crowd.fireSystem = {
    activeFires: new Map([
      ['corr_f6_west', {
        floor: 6,
        basePos: { x: -12.5, y: 19.2, z: 0.0 },
        radius: 4.5
      }]
    ])
  };

  // Occupant in Room 601 (f6_r1) at desk x = -19.5, z = -4.5
  // Their path goes through door (x: -19.5, z: -2.6) -> corridor (x: -19.5, z: 0) -> West Core A (x: -26.4, z: 0)
  const agentR1 = {
    id: 'agent_f6_r1_1',
    floor: 6,
    x: -19.5,
    y: 19.0,
    z: -4.5,
    state: 'EVACUATING',
    currentExitId: 'exit_west',
    assignedExitColor: '#00ff88',
    currentWaypointIdx: 0,
    path: [
      { x: -19.5, y: 19.0, z: -2.6 },
      { x: -19.5, y: 19.0, z: 0.0 },
      { x: -26.4, y: 19.0, z: 0.0 }
    ],
    mesh: { rotation: { y: 0 } },
    reroutePause: 0
  };

  crowd.agents = [agentR1];
  const fires = crowd.getActiveFireList();

  // MUST NOT trigger reroute or freeze! Fire is 7m to their East; they are walking West to Core A
  const didReroute = crowd.checkAndAvoidFire(agentR1, fires);
  assert.equal(didReroute, false, 'Occupant at Room 601 heading West must NOT be blocked by fire at x = -12.5');
  assert.equal(agentR1.reroutePause, 0, 'Occupant must not be paused in place');
  assert.equal(agentR1.currentExitId, 'exit_west', 'Occupant must retain exit_west path');
});

test('Mobile evacuee corridor hazard detection correctly routes Room 603 away from West fire to East Core B, and Room 601 to West Core A', () => {
  const activeFires = [
    { roomId: 'corr_f6_west', floor: 6, x: -12.5, z: 0.0 }
  ];

  // Helper matching EvacueeCompanionView logic
  const getFirePosition = (f) => {
    if (typeof f.x === 'number') return { x: f.x, z: f.z || 0 };
    if (f.roomId) {
      if (f.roomId.startsWith('corr_')) return { x: f.roomId.includes('_west') ? -12.5 : 12.5, z: 0.0 };
      if (f.roomId.startsWith('stair_')) return { x: f.roomId.includes('_west') ? -28.5 : 28.5, z: 0.0 };
      const tmplId = f.roomId.split('_')[1];
      const tmpl = ROOM_TEMPLATES.find((t) => t.idSuffix === tmplId);
      if (tmpl) return { x: tmpl.doorX, z: tmpl.doorZ };
    }
    return { x: 0, z: 0 };
  };

  const evaluateWingHazard = (doorX, fires, floor) => {
    const isWestHazardous = fires.some((f) => {
      if (f.floor !== floor) return false;
      const pos = getFirePosition(f);
      return pos.x < doorX - 1.0;
    });
    const isEastHazardous = fires.some((f) => {
      if (f.floor !== floor) return false;
      const pos = getFirePosition(f);
      return pos.x > doorX + 1.0;
    });
    return { isWestHazardous, isEastHazardous };
  };

  // Room 603 (f6_r3) has doorX = -1.5
  // Fire is at x = -12.5 (to the West of Room 603)
  const room603Hazards = evaluateWingHazard(-1.5, activeFires, 6);
  assert.equal(room603Hazards.isWestHazardous, true, 'West path is hazardous for Room 603');
  assert.equal(room603Hazards.isEastHazardous, false, 'East path is safe for Room 603');

  // Room 601 (f6_r1) has doorX = -19.5
  // Fire is at x = -12.5 (to the East of Room 601)
  const room601Hazards = evaluateWingHazard(-19.5, activeFires, 6);
  assert.equal(room601Hazards.isWestHazardous, false, 'West path is completely clear for Room 601');
  assert.equal(room601Hazards.isEastHazardous, true, 'East path is hazardous for Room 601');
});
