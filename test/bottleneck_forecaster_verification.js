// ==============================================================================
// TwinGuard AI - Neural Bottleneck Forecaster Verification Suite
// Tests ML Model inference, Edge resilience, SFPE physics, and sensitivity curve
// ==============================================================================

import assert from 'assert';
import { MLBottleneckPredictor } from '../src/ai/BottleneckPredictor.js';
import { AIEngine } from '../src/ai/index.js';

console.log('=======================================================');
console.log('🧠 RUNNING NEURAL BOTTLENECK FORECASTER VERIFICATION');
console.log('=======================================================');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runSuite() {
  console.log('\n--- Test Suite 1: Predictor Initialization & API Contract ---');
  it('MLBottleneckPredictor singleton is instantiated', () => {
    assert(MLBottleneckPredictor !== undefined, 'Predictor must be defined');
    assert(typeof MLBottleneckPredictor.predictBottleneck === 'function', 'predictBottleneck must be a function');
    assert(typeof MLBottleneckPredictor.getSensitivityCurve === 'function', 'getSensitivityCurve must be a function');
  });

  it('AIEngine exposes bottleneck forecasting facade methods', () => {
    assert(typeof AIEngine.predictBottleneck === 'function', 'AIEngine must expose predictBottleneck');
    assert(typeof AIEngine.getBottleneckSensitivityCurve === 'function', 'AIEngine must expose getBottleneckSensitivityCurve');
    assert(typeof AIEngine.checkMLMicroserviceHealth === 'function', 'AIEngine must expose checkMLMicroserviceHealth');
  });

  console.log('\n--- Test Suite 2: Physical Egress Invariants (SFPE / Helbing) ---');
  const criticalCrowd = {
    occupant_density: 4.8,
    door_clear_width: 0.85,
    corridor_length: 24.0,
    mean_reaction_delay: 8.0,
    smoke_opacity_pct: 40.0,
    impaired_mobility_ratio: 0.10,
    stairwell_inflow_load: 65.0
  };

  const safeCrowd = {
    occupant_density: 1.2,
    door_clear_width: 2.10,
    corridor_length: 24.0,
    mean_reaction_delay: 4.0,
    smoke_opacity_pct: 5.0,
    impaired_mobility_ratio: 0.02,
    stairwell_inflow_load: 15.0
  };

  const critResult = MLBottleneckPredictor.computeEdgeFallback(criticalCrowd);
  const safeResult = MLBottleneckPredictor.computeEdgeFallback(safeCrowd);

  it('Critical crowd scenario triggers CRITICAL risk level (> 75%)', () => {
    assert(critResult.stampede_risk_pct >= 75.0, `Expected risk >= 75%, got ${critResult.stampede_risk_pct}%`);
    assert.strictEqual(critResult.risk_level, 'CRITICAL');
  });

  it('Safe crowd scenario triggers SAFE risk level (< 25%)', () => {
    assert(safeResult.stampede_risk_pct < 25.0, `Expected risk < 25%, got ${safeResult.stampede_risk_pct}%`);
    assert.strictEqual(safeResult.risk_level, 'SAFE');
  });

  it('Time-to-Failure is shorter during severe bottleneck than safe conditions', () => {
    assert(
      critResult.predicted_time_to_jam_seconds < safeResult.predicted_time_to_jam_seconds,
      `Critical time (${critResult.predicted_time_to_jam_seconds}s) should be faster jamming than safe (${safeResult.predicted_time_to_jam_seconds}s)`
    );
  });

  it('Outputs valid algorithm badge & R² >= 0.94 score', () => {
    assert(critResult.algorithm.includes('R²'), 'Algorithm must cite R² score');
    assert(critResult.algorithm.includes('0.94'), 'Algorithm must cite R² >= 0.94');
  });

  it('Outputs calibrated XAI feature importance weights', () => {
    const weights = critResult.feature_importances;
    assert(weights.occupant_density !== undefined, 'Must include occupant_density weight');
    assert(weights.door_clear_width !== undefined, 'Must include door_clear_width weight');
    assert(weights.smoke_opacity_pct !== undefined, 'Must include smoke_opacity_pct weight');
    // Occupant Density + Door Width should be top drivers
    assert(weights.occupant_density.weight_pct > 30.0, 'Occupant density must be major driver (>30%)');
    assert(weights.door_clear_width.weight_pct > 20.0, 'Door width must be major driver (>20%)');
  });

  console.log('\n--- Test Suite 3: What-If Sensitivity & Monotonic Relief ---');
  const curve = await MLBottleneckPredictor.getSensitivityCurve(criticalCrowd);

  it('Generates 9-point sensitivity curve across door widths', () => {
    assert.strictEqual(curve.length, 9, 'Should produce 9 sensitivity points');
  });

  it('Expanding door clear width monotonically relieves stampede risk', () => {
    let prevRisk = 101.0;
    for (const pt of curve) {
      assert(pt.stampede_risk_pct <= prevRisk, `Risk did not decrease: ${pt.door_clear_width}m -> ${pt.stampede_risk_pct}% vs ${prevRisk}%`);
      prevRisk = pt.stampede_risk_pct;
    }
  });

  console.log('\n=======================================================');
  console.log(`🎯 COMPLETED: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('=======================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite();

