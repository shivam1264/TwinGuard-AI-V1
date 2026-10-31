import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DYNAMIC_CORE_EQUIVALENCE_NOTE,
  resolveStrategyInfo
} from './StrategyInfo.js';

const STRATEGY_A = {
  name: 'Strategy A: Uncontrolled Rush (Nearest Core)',
  description: 'Occupants head strictly to the closest open stairwell or exit.',
  type: 'NEAREST_CORE'
};

const STRATEGY_B = {
  name: 'Strategy B: Dynamic Core Load Balancing',
  description: 'Dynamic signage diverts occupants between available safe exits.',
  type: 'LOAD_BALANCED'
};

const STRATEGY_C = {
  name: 'Strategy C: Phased Floor Evacuation Protocol',
  description: 'Fire and adjacent floors evacuate first; others wait.',
  type: 'PHASED_ZONE'
};

test('resolves nearest-core and phased-zone labels', () => {
  const nearest = resolveStrategyInfo(null, STRATEGY_A);
  assert.equal(nearest.type, 'NEAREST_CORE');
  assert.equal(nearest.label, STRATEGY_A.name);
  assert.equal(nearest.behavior, 'Nearest Core');

  const phased = resolveStrategyInfo(null, STRATEGY_C);
  assert.equal(phased.type, 'PHASED_ZONE');
  assert.equal(phased.label, STRATEGY_C.name);
  assert.equal(phased.behavior, 'Phased Zone');
  assert.equal(phased.note, null);
});

test('preserves the dynamic core balancing name and documents equivalence', () => {
  const info = resolveStrategyInfo(null, STRATEGY_B);
  assert.equal(info.type, 'LOAD_BALANCED');
  assert.equal(info.label, STRATEGY_B.name);
  assert.equal(info.behavior, 'Load Balanced');
  assert.equal(info.note, DYNAMIC_CORE_EQUIVALENCE_NOTE);
});

test('recognizes DYNAMIC_CORE_BALANCING as an explicit type', () => {
  const info = resolveStrategyInfo('DYNAMIC_CORE_BALANCING');
  assert.equal(info.type, 'DYNAMIC_CORE_BALANCING');
  assert.equal(info.label, 'Dynamic Core Balancing');
  assert.equal(info.behavior, 'Dynamic Core Balancing');
  assert.equal(info.note, DYNAMIC_CORE_EQUIVALENCE_NOTE);
});

test('falls back to load-balanced metadata for unknown or missing types', () => {
  const unknown = resolveStrategyInfo('SOMETHING_ELSE');
  assert.equal(unknown.type, 'LOAD_BALANCED');
  assert.equal(unknown.behavior, 'Load Balanced');

  const missing = resolveStrategyInfo(null, null);
  assert.equal(missing.type, 'LOAD_BALANCED');
  assert.equal(missing.label, 'Load Balanced');
  assert.equal(missing.note, null);
});
