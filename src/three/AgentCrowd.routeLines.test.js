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
