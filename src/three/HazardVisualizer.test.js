import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTowerGraph, loadBuilding } from '../simulation/BuildingGraph.js';
import { createHazardState } from '../simulation/HazardPropagation.js';
import { ROUTE_CONDITIONS } from '../simulation/RoutingHazardAdapter.js';
import {
  HazardVisualizer,
  HAZARD_RISK_COLORS
} from './HazardVisualizer.js';

const AVAILABLE_CONTEXT = { availability: { available: true } };

function setup() {
  const scene = new THREE.Scene();
  const graph = loadBuilding(createTowerGraph());
  const hazardState = createHazardState(graph);
  const visualizer = new HazardVisualizer(scene, { floorHeight: graph.data.floorHeightM });
  return { scene, graph, hazardState, visualizer };
}

function update(visualizer, graph, hazardState, riskAssessment = null, routingContext = AVAILABLE_CONTEXT) {
  visualizer.update({ graph, hazardState, riskAssessment, routingContext });
}

test('builds one visual per zone and one marker per connection', () => {
  const { graph, hazardState, visualizer } = setup();

  update(visualizer, graph, hazardState);

  assert.equal(visualizer.zoneVisuals.size, graph.data.zones.length);
  assert.equal(visualizer.connectionMarkers.size, graph.data.connections.length);
  assert.equal(visualizer.group.children.length, graph.data.zones.length + graph.data.connections.length);
  assert.equal(visualizer.zoneVisuals.get('L5').group.visible, true);
});

test('colors assessed risk and shows smoke only when active', () => {
  const { graph, hazardState, visualizer } = setup();
  hazardState.zones.L5.smoke = { status: 'active', density: 0.75 };
  const riskAssessment = {
    zones: {
      L5: { status: 'assessed', complete: true, score: 90, level: 'critical' }
    }
  };

  update(visualizer, graph, hazardState, riskAssessment);

  const visual = visualizer.zoneVisuals.get('L5');
  assert.equal(visual.riskFillMaterial.color.getHex(), HAZARD_RISK_COLORS.critical);
  assert.ok(visual.riskFillMaterial.opacity > 0.1);
  assert.equal(visual.smokeActive, true);
  assert.equal(visual.smokeParts[0].visible, true);
  assert.ok(visual.smokeMaterial.opacity > 0.1);
  assert.ok(visual.smokeMaterial.opacity <= 0.16);

  hazardState.zones.L5.smoke = { status: 'none', density: null };
  update(visualizer, graph, hazardState, riskAssessment);

  assert.equal(visual.smokeActive, false);
  assert.equal(visual.smokeParts[0].visible, false);
  assert.equal(visual.smokeMaterial.opacity, 0);
});

test('uses unknown grey for partial or missing risk assessment', () => {
  const { graph, hazardState, visualizer } = setup();
  const riskAssessment = {
    zones: {
      L5: { status: 'partial', complete: false, score: null, level: null }
    }
  };

  update(visualizer, graph, hazardState, riskAssessment);

  const partial = visualizer.zoneVisuals.get('L5');
  const missing = visualizer.zoneVisuals.get('L6');
  assert.equal(partial.riskFillMaterial.color.getHex(), HAZARD_RISK_COLORS.unknown);
  assert.equal(missing.riskFillMaterial.color.getHex(), HAZARD_RISK_COLORS.unknown);
  assert.ok(partial.riskFillMaterial.opacity < 0.05);
});

test('applies routing connection precedence and hides permitted markers', () => {
  const { graph, hazardState, visualizer } = setup();
  const connection = (id) => graph.data.connections.find((entry) => entry.id === id);

  connection('conn_L5_stair_west').status = 'closed';
  hazardState.connections.conn_L5_stair_west.routeStatus = 'permitted';

  hazardState.connections.conn_L4_stair_west.routeStatus = 'prohibited';

  connection('conn_L3_stair_west').status = 'restricted';

  hazardState.connections.conn_L2_stair_west.routeStatus = 'restricted';

  connection('conn_L1_stair_west').status = 'unknown';
  hazardState.connections.conn_L1_stair_west.routeStatus = 'permitted';

  hazardState.connections.conn_stair_west_exit_west.routeStatus = 'permitted';

  update(visualizer, graph, hazardState);

  assert.equal(visualizer.connectionMarkers.get('conn_L5_stair_west').condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.equal(visualizer.connectionMarkers.get('conn_L4_stair_west').condition, ROUTE_CONDITIONS.PROHIBITED);
  assert.equal(visualizer.connectionMarkers.get('conn_L3_stair_west').condition, ROUTE_CONDITIONS.PENALIZED);
  assert.equal(visualizer.connectionMarkers.get('conn_L2_stair_west').condition, ROUTE_CONDITIONS.PENALIZED);
  assert.equal(visualizer.connectionMarkers.get('conn_L1_stair_west').condition, ROUTE_CONDITIONS.UNKNOWN);
  assert.equal(visualizer.connectionMarkers.get('conn_stair_west_exit_west').condition, ROUTE_CONDITIONS.PERMITTED);
  assert.equal(visualizer.connectionMarkers.get('conn_stair_east_exit_east').condition, ROUTE_CONDITIONS.PERMITTED);
  assert.equal(visualizer.connectionMarkers.get('conn_stair_west_exit_west').group.visible, false);
});

test('forces connection markers unknown when routing context is unavailable', () => {
  const { graph, hazardState, visualizer } = setup();

  update(visualizer, graph, hazardState, null, { availability: { available: false } });

  const marker = visualizer.connectionMarkers.get('conn_stair_west_exit_west');
  assert.equal(marker.condition, ROUTE_CONDITIONS.UNKNOWN);
  assert.equal(marker.group.visible, true);
  assert.equal(marker.doubleRing.visible, true);
});

test('filters floor zones, stair rings, and markers by floor mode', () => {
  const { graph, hazardState, visualizer } = setup();
  graph.data.connections.find((entry) => entry.id === 'conn_L5_stair_west').status = 'closed';

  update(visualizer, graph, hazardState);
  visualizer.setFloorMode('5');

  assert.equal(visualizer.zoneVisuals.get('L5').group.visible, true);
  assert.equal(visualizer.zoneVisuals.get('L6').group.visible, false);
  assert.equal(visualizer.connectionMarkers.get('conn_L5_stair_west').group.visible, true);
  assert.equal(visualizer.connectionMarkers.get('conn_L4_stair_west').group.visible, false);

  const stair = visualizer.zoneVisuals.get('stair_west');
  assert.equal(stair.group.visible, true);
  assert.equal(stair.globalOnlyParts[0].visible, false);
  assert.ok(stair.floorParts.filter((part) => part.visible).every((part) => part.userData.floor === 5));

  visualizer.setFloorMode('ALL');
  assert.equal(stair.globalOnlyParts[0].visible, true);
});

test('hides the layer and clears visuals without rebuilding geometry', () => {
  const { graph, hazardState, visualizer } = setup();
  update(visualizer, graph, hazardState);
  const zoneVisual = visualizer.zoneVisuals.get('L5');

  visualizer.setVisible(false);
  assert.equal(visualizer.group.visible, false);

  visualizer.setVisible(true);
  visualizer.clear();
  assert.equal(zoneVisual.group.visible, false);
  assert.equal(visualizer.zoneVisuals.size, graph.data.zones.length);
});

test('removes and disposes all visuals', () => {
  const { scene, graph, hazardState, visualizer } = setup();
  update(visualizer, graph, hazardState);

  visualizer.dispose();

  assert.equal(visualizer.group.parent, null);
  assert.equal(scene.children.includes(visualizer.group), false);
  assert.equal(visualizer.zoneVisuals.size, 0);
  assert.equal(visualizer.connectionMarkers.size, 0);
});
