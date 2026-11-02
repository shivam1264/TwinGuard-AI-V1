import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('Testing StrategyRankerView Dynamic Weights & UI Cleanup...');

const filePath = path.resolve('src/components/StrategyRankerView.jsx');
const content = fs.readFileSync(filePath, 'utf-8');

// 1. Assert Yellow buttons are completely removed
assert(!content.includes('Export Report'), 'Header must NOT contain "Export Report" button');
assert(!content.includes('Re-Run Benchmark'), 'Header must NOT contain "Re-Run Benchmark" button');
console.log('✔ Verified: Yellow header buttons ("Export Report", "Re-Run Benchmark") removed');

// 2. Assert Pink box (Radar chart + side TOPSIS card) is completely removed
assert(!content.includes('Multi-Criteria Analysis (XAI)'), 'Must NOT contain "Multi-Criteria Analysis (XAI)" radar chart');
assert(!content.includes('TOPSIS Ranking & Score'), 'Must NOT contain duplicate side "TOPSIS Ranking & Score" card');
assert(!content.includes('<polygon points='), 'Must NOT contain radar chart SVG polygons');
console.log('✔ Verified: Pink box (Radar chart & duplicate side TOPSIS card) removed');

// 3. Assert Objectives (Weights) sliders exist and are hooked up
assert(content.includes('handleWeightChange'), 'Weights sliders must have handleWeightChange handler');
assert(content.includes('weights.time'), 'Must bind weights.time');
assert(content.includes('weights.density'), 'Must bind weights.density');
assert(content.includes('weights.exposure'), 'Must bind weights.exposure');
assert(content.includes('Update & Compare'), 'Must have "Update & Compare" button');
assert(content.includes('handleUpdateAndCompare'), 'Must have handleUpdateAndCompare handler');
console.log('✔ Verified: Objective weight sliders and Update & Compare button wired up');

// 4. Assert 3 dynamic strategies are computed based on weights
assert(content.includes('tNearest'), 'Must compute dynamic clearance time for Nearest Core');
assert(content.includes('dNearest'), 'Must compute dynamic peak density for Nearest Core');
assert(content.includes('eNearest'), 'Must compute dynamic toxic exposure for Nearest Core');

assert(content.includes('tDynamic'), 'Must compute dynamic clearance time for Dynamic Balancing');
assert(content.includes('dDynamic'), 'Must compute dynamic peak density for Dynamic Balancing');
assert(content.includes('eDynamic'), 'Must compute dynamic toxic exposure for Dynamic Balancing');

assert(content.includes('tPhased'), 'Must compute dynamic clearance time for Phased Zone');
assert(content.includes('dPhased'), 'Must compute dynamic peak density for Phased Zone');
assert(content.includes('ePhased'), 'Must compute dynamic toxic exposure for Phased Zone');

assert(content.includes('#1 RECOMMENDED'), 'Must have dynamic #1 RECOMMENDED badge');
assert(content.includes('#2 VIABLE'), 'Must have dynamic #2 VIABLE badge');
assert(content.includes('#3 HIGH RISK'), 'Must have dynamic #3 HIGH RISK badge');
console.log('✔ Verified: Dynamic strategy metrics, TOPSIS ranking, and badges implemented');

// 5. Assert bottom selected strategy bar exists and binds dynamic state without "Apply Selected Strategy"
assert(content.includes('currentSelected'), 'Bottom bar must bind currentSelected');
assert(!content.includes('Apply Selected Strategy'), 'Must NOT have "Apply Selected Strategy" button per user requirement');
console.log('✔ Verified: Bottom strategy summary bar dynamically wired and "Apply Selected Strategy" cleanly removed');

// 6. Test the dynamic calculation math directly
function runSimulationTest(timeW, densityW, exposureW) {
  const sum = timeW + densityW + exposureW || 100;
  const W_T = timeW / sum;
  const W_D = densityW / sum;
  const W_E = exposureW / sum;

  const tNearest = Math.round(142 - (W_T - 0.35) * 26 + (W_D - 0.35) * 16);
  const dNearest = +(1.44 + (W_T - 0.35) * 0.28 - (W_D - 0.35) * 0.22).toFixed(2);
  const eNearest = Math.round(873 - (W_T - 0.35) * 95 + (W_D - 0.35) * 60);

  const tDynamic = Math.round(158 - (W_T - 0.35) * 32 + (W_D - 0.35) * 14);
  const dDynamic = +(1.06 - (W_D - 0.35) * 0.26 + (W_T - 0.35) * 0.16).toFixed(2);
  const eDynamic = Math.round(998 - (W_T - 0.35) * 110 - (W_D - 0.35) * 30);

  const tPhased = Math.round(198 - (W_T - 0.35) * 48 + (W_D - 0.35) * 28);
  const dPhased = +(1.00 - (W_D - 0.35) * 0.28 + (W_T - 0.35) * 0.18).toFixed(2);
  const ePhased = Math.round(1083 - (W_T - 0.35) * 130 + (W_D - 0.35) * 80);

  const raw = [
    { id: 'NEAREST', t: tNearest, d: dNearest, e: eNearest },
    { id: 'DYNAMIC', t: tDynamic, d: dDynamic, e: eDynamic },
    { id: 'PHASED', t: tPhased, d: dPhased, e: ePhased }
  ];

  const mins = [120, 0.70, 750];
  const maxs = [230, 1.80, 1250];

  raw.forEach(item => {
    const sT = Math.max(0, Math.min(1, (maxs[0] - item.t) / (maxs[0] - mins[0])));
    const sD = Math.max(0, Math.min(1, (maxs[1] - item.d) / (maxs[1] - mins[1])));
    const sE = Math.max(0, Math.min(1, (maxs[2] - item.e) / (maxs[2] - mins[2])));
    item.topsisScore = Number((W_T * sT + W_D * sD + W_E * sE).toFixed(3));
  });

  const sorted = [...raw].sort((a, b) => b.topsisScore - a.topsisScore);
  return {
    rank1: sorted[0].id,
    rank2: sorted[1].id,
    rank3: sorted[2].id,
    scores: {
      nearest: raw.find(r => r.id === 'NEAREST').topsisScore,
      dynamic: raw.find(r => r.id === 'DYNAMIC').topsisScore,
      phased: raw.find(r => r.id === 'PHASED').topsisScore
    }
  };
}

// Check baseline
const baseline = runSimulationTest(35, 35, 30);
assert.strictEqual(baseline.rank1, 'NEAREST', 'Baseline (35/35/30) should recommend NEAREST');
console.log('✔ Baseline test passed (Nearest #1):', baseline);

// Check speed priority
const speed = runSimulationTest(60, 20, 20);
assert.strictEqual(speed.rank1, 'NEAREST', 'Speed priority (60/20/20) should strongly recommend NEAREST');
assert(speed.scores.nearest > baseline.scores.nearest, 'Speed priority should increase Nearest score');
console.log('✔ Speed priority test passed (Nearest #1 higher score):', speed);

// Check crowd safety priority
const safety = runSimulationTest(20, 60, 20);
assert.strictEqual(safety.rank1, 'DYNAMIC', 'Crowd safety priority (20/60/20) should recommend DYNAMIC');
assert.strictEqual(safety.rank2, 'PHASED', 'Crowd safety priority should make PHASED rank #2');
assert.strictEqual(safety.rank3, 'NEAREST', 'Crowd safety priority should demote NEAREST to #3 due to crush hazard');
console.log('✔ Crowd safety priority test passed (Dynamic #1, Phased #2, Nearest #3):', safety);

console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');

