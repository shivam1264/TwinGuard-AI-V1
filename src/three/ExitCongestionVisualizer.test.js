import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  ExitCongestionVisualizer,
  EXIT_LOAD_COLORS,
  computeLiveExitLoads,
  resolveEdgeCongestionLevel,
  resolveExitLoadLevel
} from './ExitCongestionVisualizer.js';

const EXITS = [
  { id: 'exit_west', x: -29.2, z: 0, capacity: 100, load: 0 },
  { id: 'exit_east', x: 29.2, z: 0, capacity: 100, load: 0 }
];

function createGraph() {
  return {
    nodes: new Map([
      ['a', { pos: { x: 0, y: 0, z: 0 } }],
      ['b', { pos: { x: 5, y: 0, z: 0 } }],
      ['c', { pos: { x: 5, y: 3.8, z: 0 } }]
    ]),
    edges: new Map([
      ['edge_1', { id: 'edge_1', from: 'a', to: 'b', floor: 1, currentOccupancy: 0, capacity: 2, status: 'OPEN' }],
      ['edge_1_rev', { id: 'edge_1_rev', from: 'b', to: 'a', floor: 1, currentOccupancy: 0, capacity: 2, status: 'OPEN' }],
      ['edge_2', { id: 'edge_2', from: 'b', to: 'c', floor: 2, currentOccupancy: 0, capacity: 2, status: 'OPEN' }]
    ])
  };
}

function setup() {
  const scene = new THREE.Scene();
  const visualizer = new ExitCongestionVisualizer(scene);
  return { scene, visualizer };
}

test('counts live non-safe agents by current exit', () => {
  const loads = computeLiveExitLoads(EXITS, [
    { state: 'EVACUATING', currentExitId: 'exit_west' },
    { state: 'WAITING', currentExitId: 'exit_west' },
    { state: 'EVACUATING', currentExitId: 'exit_east' },
    { state: 'SAFE', currentExitId: 'exit_west' },
    { state: 'EVACUATING', currentExitId: null }
  ]);

  assert.equal(loads.get('exit_west'), 2);
  assert.equal(loads.get('exit_east'), 1);
});

test('resolves exit and edge load levels', () => {
  assert.equal(resolveExitLoadLevel(50, 100), 'low');
  assert.equal(resolveExitLoadLevel(70, 100), 'moderate');
  assert.equal(resolveExitLoadLevel(90, 100), 'high');
  assert.equal(resolveExitLoadLevel(130, 100), 'critical');
  assert.equal(resolveExitLoadLevel(0, 100, true), 'blocked');

  assert.equal(resolveEdgeCongestionLevel(0, 2, 'OPEN'), 'low');
  assert.equal(resolveEdgeCongestionLevel(2, 2, 'OPEN'), 'high');
  assert.equal(resolveEdgeCongestionLevel(3, 2, 'OPEN'), 'critical');
  assert.equal(resolveEdgeCongestionLevel(1, 2, 'BLOCKED'), 'blocked');
});

test('builds exit markers and non-reverse edge lines', () => {
  const { visualizer } = setup();
  visualizer.update({ exits: EXITS, navigationGraph: createGraph() });

  assert.equal(visualizer.exitMarkers.size, 2);
  assert.equal(visualizer.edgeVisuals.size, 2);
  assert.equal(visualizer.group.children.length, 4);
  assert.equal(visualizer.exitMarkers.get('exit_west').group.visible, true);
});

test('colors exit markers and scales bars from live agent loads', () => {
  const { visualizer } = setup();
  const agents = Array.from({ length: 90 }, () => ({
    state: 'EVACUATING',
    currentExitId: 'exit_west'
  }));

  visualizer.update({ exits: EXITS, agents });

  const marker = visualizer.exitMarkers.get('exit_west');
  assert.equal(marker.level, 'high');
  assert.equal(marker.load, 90);
  assert.equal(marker.material.color.getHex(), EXIT_LOAD_COLORS.high);
  assert.ok(marker.bar.scale.y > 1);

  visualizer.update({
    exits: EXITS,
    agents: [{ state: 'EVACUATING', currentExitId: 'exit_west' }]
  });

  assert.equal(marker.level, 'low');
  assert.equal(marker.material.color.getHex(), EXIT_LOAD_COLORS.low);
});

test('colors edges from live occupancy and hides uncongested edges', () => {
  const { visualizer } = setup();
  const graph = createGraph();

  visualizer.update({ exits: EXITS, navigationGraph: graph });
  const visual = visualizer.edgeVisuals.get('edge_1');
  assert.equal(visual.level, 'low');
  assert.equal(visual.line.visible, false);

  graph.edges.get('edge_1').currentOccupancy = 3;
  visualizer.update({ exits: EXITS, navigationGraph: graph });

  assert.equal(visual.level, 'critical');
  assert.equal(visual.material.color.getHex(), EXIT_LOAD_COLORS.critical);
  assert.equal(visual.line.visible, true);
});

test('filters exits and edges by floor mode', () => {
  const { visualizer } = setup();
  const graph = createGraph();
  graph.edges.get('edge_1').currentOccupancy = 3;
  graph.edges.get('edge_2').currentOccupancy = 3;
  visualizer.update({ exits: EXITS, navigationGraph: graph });

  visualizer.setFloorMode('2');
  assert.equal(visualizer.exitMarkers.get('exit_west').group.visible, false);
  assert.equal(visualizer.edgeVisuals.get('edge_1').line.visible, false);
  assert.equal(visualizer.edgeVisuals.get('edge_2').line.visible, true);

  visualizer.setFloorMode('1');
  assert.equal(visualizer.exitMarkers.get('exit_west').group.visible, true);
  assert.equal(visualizer.edgeVisuals.get('edge_1').line.visible, true);
  assert.equal(visualizer.edgeVisuals.get('edge_2').line.visible, false);

  visualizer.setFloorMode('ALL');
  assert.equal(visualizer.edgeVisuals.get('edge_2').line.visible, true);
});

test('hides the layer and clears without rebuilding geometry', () => {
  const { visualizer } = setup();
  visualizer.update({ exits: EXITS, navigationGraph: createGraph() });
  const marker = visualizer.exitMarkers.get('exit_west');

  visualizer.setVisible(false);
  assert.equal(visualizer.group.visible, false);

  visualizer.setVisible(true);
  visualizer.clear();
  assert.equal(marker.group.visible, false);
  assert.equal(visualizer.exitMarkers.size, 2);
});

test('removes and disposes all visuals', () => {
  const { scene, visualizer } = setup();
  visualizer.update({ exits: EXITS, navigationGraph: createGraph() });

  visualizer.dispose();

  assert.equal(visualizer.group.parent, null);
  assert.equal(scene.children.includes(visualizer.group), false);
  assert.equal(visualizer.exitMarkers.size, 0);
  assert.equal(visualizer.edgeVisuals.size, 0);
});
