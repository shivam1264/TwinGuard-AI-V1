import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTowerGraph, loadBuilding, applyScenario } from './BuildingGraph.js';
import { advanceHazardState } from './HazardPropagation.js';
import { assessRisk, ASSESSMENT_STATUSES } from './RiskAssessment.js';
import { buildRoutingHazardContext } from './RoutingHazardAdapter.js';
import { ZoneToGridMapper, applyHazardStateToGrid } from './ZoneToGridMapper.js';
import { NavGrid } from './NavGrid.js';

const SCENARIO = {
  schemaVersion: 1,
  id: 'phase5e-l5-fire',
  name: 'Phase 5E L5 fire',
  durationSec: 600,
  fires: [{ id: 'fire_l5', zoneId: 'L5', startSec: 0, intensity: 0.6 }]
};

function createHarness() {
  const graph = loadBuilding(createTowerGraph());
  const navGrid = new NavGrid();
  const mapper = new ZoneToGridMapper(navGrid);
  return { graph, navGrid, mapper };
}

function totalHazardCost(navGrid, mapper, graph, zoneId) {
  const zone = graph.data.zones.find((candidate) => candidate.id === zoneId);
  return mapper
    .getZoneCells(zone)
    .reduce((sum, { c, r }) => sum + (navGrid.hazardCosts[r][c] || 0), 0);
}

test('advancing hazard state keeps hazard, risk, routing, and grid costs consistent', () => {
  const { graph, navGrid, mapper } = createHarness();

  let hazardState = applyScenario(graph, SCENARIO);
  let riskAssessment = assessRisk(hazardState, graph);

  assert.equal(riskAssessment.zones.L5.status, ASSESSMENT_STATUSES.PARTIAL);

  applyHazardStateToGrid(mapper, hazardState, graph);
  const initialCost = totalHazardCost(navGrid, mapper, graph, 'L5');
  assert.ok(initialCost > 0, 'L5 fire should produce a grid hazard cost at t=0');

  const dt = 45;
  hazardState = advanceHazardState(hazardState, graph, dt);
  riskAssessment = assessRisk(hazardState, graph);
  const context = buildRoutingHazardContext({
    graph,
    hazardState,
    riskAssessment,
    expectedTimeSec: dt
  });

  assert.equal(hazardState.timeSec, dt);
  assert.equal(riskAssessment.timeSec, dt);
  assert.equal(context.timeSec, dt);
  assert.equal(context.availability.available, true);
  assert.equal(riskAssessment.zones.L5.status, ASSESSMENT_STATUSES.ASSESSED);

  mapper.clearAllDynamicHazards();
  applyHazardStateToGrid(mapper, hazardState, graph);
  const advancedCost = totalHazardCost(navGrid, mapper, graph, 'L5');
  assert.ok(advancedCost > initialCost, 'grid hazard cost should grow as the hazard propagates');
});

test('reset clears hazard state and dynamic grid costs, then restart reinitializes', () => {
  const { graph, navGrid, mapper } = createHarness();

  let hazardState = applyScenario(graph, SCENARIO);
  applyHazardStateToGrid(mapper, hazardState, graph);
  assert.ok(totalHazardCost(navGrid, mapper, graph, 'L5') > 0);

  hazardState = null;
  mapper.clearAllDynamicHazards();

  for (let r = 0; r < navGrid.rows; r++) {
    for (let c = 0; c < navGrid.cols; c++) {
      assert.equal(navGrid.hazardCosts[r][c], 0, `hazard cost at ${c},${r} should be cleared`);
    }
  }

  const resetContext = buildRoutingHazardContext({
    graph,
    hazardState: null,
    expectedTimeSec: 0
  });
  assert.equal(resetContext.availability.available, false);
  assert.equal(resetContext.availability.reason, 'hazard-state:missing');

  hazardState = applyScenario(graph, SCENARIO);
  applyHazardStateToGrid(mapper, hazardState, graph);

  assert.equal(hazardState.timeSec, 0);
  assert.ok(totalHazardCost(navGrid, mapper, graph, 'L5') > 0);
});
