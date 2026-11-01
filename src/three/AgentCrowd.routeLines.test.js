import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AgentCrowd } from './AgentCrowd.js';

function makeAgent(overrides = {}) {
  return {
    id: 'a1',
    state: 'EVACUATING',
    path: [
      { x: 0, y: 3.8, z: 0 },
      { x: 2, y: 3.8, z: 2 },
      { x: 4, y: 0.15, z: 4 }
    ],
    currentExitId: 'exit_west',
    assignedExitColor: '#00ff88',
    floor: 2,
    ...overrides
  };
}

function setup(agents) {
  const scene = new THREE.Scene();
  const crowd = new AgentCrowd(scene);
  crowd.agents = agents;
  return { scene, crowd };
}

test('creates one route line per actively evacuating agent', () => {
  const { crowd } = setup([
    makeAgent(),
    makeAgent({ id: 'a2', state: 'WAITING' }),
    makeAgent({ id: 'a3', state: 'SAFE' }),
    makeAgent({ id: 'a4', path: [] })
  ]);

  crowd.syncRouteLines();

  assert.equal(crowd.routeLines.size, 1);
  assert.equal(crowd.pathLinesGroup.children.length, 1);
  assert.deepEqual(crowd.pathLinesGroup.children[0].userData, {
    agentId: 'a1',
    exitId: 'exit_west',
    floor: 2
  });
});

test('reuses unchanged routes and rebuilds only when path or exit changes', () => {
  const agent = makeAgent();
  const { crowd } = setup([agent]);
  crowd.syncRouteLines();
  const original = crowd.routeLines.get('a1').line;

  crowd.syncRouteLines();
  assert.equal(crowd.routeLines.get('a1').line, original);

  agent.path = [
    { x: 0, y: 3.8, z: 0 },
    { x: 6, y: 0.15, z: 6 }
  ];
  crowd.syncRouteLines();
  const rerouted = crowd.routeLines.get('a1').line;
  assert.notEqual(rerouted, original);
  assert.equal(rerouted.geometry.attributes.position.count, 2);

  agent.currentExitId = 'exit_east';
  crowd.syncRouteLines();
  assert.notEqual(crowd.routeLines.get('a1').line, rerouted);
  assert.equal(crowd.routeLines.get('a1').line.userData.exitId, 'exit_east');
});

test('removes routes for SAFE agents and invalid paths', () => {
  const agent = makeAgent();
  const { crowd } = setup([agent]);
  crowd.syncRouteLines();
  assert.equal(crowd.routeLines.size, 1);

  agent.state = 'SAFE';
  crowd.syncRouteLines();
  assert.equal(crowd.routeLines.size, 0);
  assert.equal(crowd.pathLinesGroup.children.length, 0);

  agent.state = 'EVACUATING';
  agent.path = [];
  crowd.syncRouteLines();
  assert.equal(crowd.routeLines.size, 0);
});

test('filters route lines by floor without disposing them', () => {
  const { crowd } = setup([makeAgent()]);
  crowd.syncRouteLines();

  crowd.floorMode = '1';
  crowd.syncRouteLines();
  assert.equal(crowd.routeLines.size, 1);
  assert.equal(crowd.routeLines.get('a1').line.visible, false);

  crowd.floorMode = 'ALL';
  crowd.syncRouteLines();
  assert.equal(crowd.routeLines.get('a1').line.visible, true);
});

test('clears route lines and removes groups from the scene on dispose', () => {
  const { scene, crowd } = setup([makeAgent()]);
  crowd.syncRouteLines();

  crowd.clearPathLines();
  assert.equal(crowd.routeLines.size, 0);
  assert.equal(crowd.pathLinesGroup.children.length, 0);

  crowd.syncRouteLines();
  crowd.dispose();
  assert.equal(crowd.routeLines.size, 0);
  assert.equal(crowd.pathLinesGroup.parent, null);
  assert.equal(crowd.group.parent, null);
  assert.equal(scene.children.includes(crowd.pathLinesGroup), false);
});

test('reapplying an unchanged PHASED_ZONE assignment preserves an in-progress waiting delay', () => {
  const agent = makeWaitingAgent();
  const { crowd } = setup([agent]);
  crowd.pathLinesGroup = null;

  crowd.assignRoutes([makeAssignment()]);
  agent.delayTimer = 39;

  crowd.assignRoutes([makeAssignment({ delayTimer: 46 })]);

  assert.equal(agent.state, 'WAITING');
  assert.equal(agent.delayTimer, 39);
  assert.equal(agent.originalDelayTimer, 47);
});

test('a waiting delay counts down across reevaluations at two-second intervals', () => {
  const agent = makeWaitingAgent({ path: [] });
  const { crowd } = setup([agent]);
  crowd.pathLinesGroup = null;
  crowd.isWaitingZoneDangerous = () => false;
  crowd.assignRoutes([makeAssignment({ delayTimer: 5 })]);

  for (let tick = 1; tick <= 10; tick++) {
    crowd.update(0.5);
    if (tick % 4 === 0) {
      crowd.assignRoutes([makeAssignment({ delayTimer: 5 })]);
    }
  }

  assert.equal(agent.delayTimer, 0);
  assert.equal(agent.state, 'EVACUATING');
});

test('a changed path with the same exit updates the route without restarting the phased delay', () => {
  const agent = makeWaitingAgent();
  const { crowd } = setup([agent]);
  crowd.pathLinesGroup = null;
  const updatedPath = [{ x: 1, y: 3.8, z: 1 }, { x: 3, y: 0.15, z: 3 }];

  crowd.assignRoutes([makeAssignment()]);
  agent.delayTimer = 30;
  crowd.assignRoutes([makeAssignment({ delayTimer: 46, path: updatedPath })]);

  assert.equal(agent.path, updatedPath);
  assert.equal(agent.delayTimer, 30);
  assert.equal(agent.state, 'WAITING');
});

test('an exit or phased delay-policy change initializes the new waiting delay', () => {
  const agent = makeWaitingAgent();
  const { crowd } = setup([agent]);
  crowd.pathLinesGroup = null;

  crowd.assignRoutes([makeAssignment()]);
  agent.delayTimer = 30;
  crowd.assignRoutes([makeAssignment({ exitId: 'exit_east', delayTimer: 46 })]);
  assert.equal(agent.delayTimer, 46);
  assert.equal(agent.originalDelayTimer, 46);

  crowd.assignRoutes([makeAssignment({ exitId: 'exit_east', delayTimer: 5 })]);
  assert.equal(agent.delayTimer, 5);
  assert.equal(agent.originalDelayTimer, 5);
  assert.equal(agent.state, 'WAITING');
});

test('a waiting agent in a dangerous zone still receives emergency override', () => {
  const agent = makeWaitingAgent({ path: [] });
  const { crowd } = setup([agent]);
  crowd.pathLinesGroup = null;
  crowd.isWaitingZoneDangerous = () => true;
  crowd.assignRoutes([makeAssignment({ delayTimer: 5 })]);

  crowd.update(0.1);

  assert.equal(agent.delayTimer, 0);
  assert.equal(agent.state, 'EVACUATING');
});

test('non-phased assignments preserve immediate evacuation behavior', () => {
  for (const strategy of ['NEAREST_CORE', 'LOAD_BALANCED']) {
    const agent = makeWaitingAgent();
    const { crowd } = setup([agent]);
    crowd.pathLinesGroup = null;

    crowd.assignRoutes([makeAssignment({ delayTimer: 0 })]);
    assert.equal(agent.state, 'EVACUATING', `${strategy} assignment should evacuate immediately`);
    assert.equal(agent.delayTimer, 0);
  }
});

test('reevaluation does not return EVACUATING or SAFE agents to WAITING', () => {
  for (const state of ['EVACUATING', 'SAFE']) {
    const agent = makeWaitingAgent({
      state,
      delayTimer: 0,
      originalDelayTimer: 0,
      currentExitId: 'exit_west'
    });
    const { crowd } = setup([agent]);
    crowd.pathLinesGroup = null;

    crowd.assignRoutes([makeAssignment({ delayTimer: 47 })]);

    assert.equal(agent.state, state);
    assert.equal(agent.delayTimer, 0);
    assert.equal(agent.originalDelayTimer, 0);
  }
});

function makeWaitingAgent(overrides = {}) {
  return makeAgent({
    state: 'IDLE',
    isSeated: false,
    mesh: { visible: true },
    delayTimer: 0,
    originalDelayTimer: 0,
    currentExitId: null,
    currentRouteCondition: null,
    beacon: { material: { color: null } },
    shirtMat: { emissive: null, emissiveIntensity: 0 },
    ...overrides
  });
}

function makeAssignment(overrides = {}) {
  return {
    agentId: 'a1',
    exitId: 'exit_west',
    exitColor: '#00ff88',
    routeCondition: 'PERMITTED',
    delayTimer: 47,
    path: [{ x: 0, y: 3.8, z: 0 }, { x: 2, y: 0.15, z: 2 }],
    ...overrides
  };
}
