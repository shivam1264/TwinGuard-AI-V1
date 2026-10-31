import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureExitSnapshot,
  createRerouteEvent,
  diffExitAssignments,
  formatExitLabels,
  formatSimTime
} from './RerouteEvents.js';

const EXITS = [
  { id: 'exit_west', name: 'West Gate / Stair Core A' },
  { id: 'exit_east', name: 'East Gate / Stair Core B' },
  { id: 'exit_south', name: 'Front / Main Gate (South)' }
];

test('captures only agents with a current exit', () => {
  const snapshot = captureExitSnapshot([
    { id: 'a1', currentExitId: 'exit_west' },
    { id: 'a2', currentExitId: null },
    { id: 'a3' }
  ]);

  assert.equal(snapshot.size, 1);
  assert.equal(snapshot.get('a1'), 'exit_west');
});

test('diff reports only actual exit changes', () => {
  const previous = new Map([
    ['a1', 'exit_west'],
    ['a2', 'exit_east'],
    ['a3', 'exit_south']
  ]);

  const changes = diffExitAssignments(previous, [
    { agentId: 'a1', exitId: 'exit_east' },
    { agentId: 'a2', exitId: 'exit_east' },
    { agentId: 'a3', exitId: 'exit_south' },
    { agentId: 'a4', exitId: 'exit_west' }
  ]);

  assert.deepEqual(changes, [
    { agentId: 'a1', fromExitId: 'exit_west', toExitId: 'exit_east' }
  ]);
});

test('routine reevaluation with no exit changes produces no event', () => {
  const previous = new Map([['a1', 'exit_west']]);
  const changes = diffExitAssignments(previous, [{ agentId: 'a1', exitId: 'exit_west' }]);
  const event = createRerouteEvent({ changes, reason: 'Routine route reevaluation' });

  assert.equal(changes.length, 0);
  assert.equal(event, null);
});

test('aggregates simultaneous changes into one event', () => {
  const changes = [
    { agentId: 'a1', fromExitId: 'exit_west', toExitId: 'exit_east' },
    { agentId: 'a2', fromExitId: 'exit_west', toExitId: 'exit_east' },
    { agentId: 'a3', fromExitId: 'exit_south', toExitId: 'exit_east' }
  ];

  const event = createRerouteEvent({
    changes,
    reason: 'Current route prohibited',
    reasons: ['L5:fire:active'],
    severity: 'Medium',
    exits: EXITS,
    elapsedSeconds: 42,
    now: new Date('2026-10-31T10:15:00'),
    id: 'reroute_test'
  });

  assert.equal(event.id, 'reroute_test');
  assert.equal(event.agentCount, 3);
  assert.equal(event.title, 'Route reassignment: 3 agents');
  assert.deepEqual(event.fromExits, ['exit_west', 'exit_south']);
  assert.deepEqual(event.toExits, ['exit_east']);
  assert.equal(event.severity, 'Medium');
  assert.equal(event.reason, 'Current route prohibited');
  assert.deepEqual(event.reasons, ['L5:fire:active']);
  assert.match(event.subtitle, /West, South → East/);
  assert.match(event.subtitle, /L5:fire:active/);
  assert.match(event.subtitle, /T\+00:42/);
});

test('uses singular wording for one agent', () => {
  const event = createRerouteEvent({
    changes: [{ agentId: 'a1', fromExitId: 'exit_west', toExitId: 'exit_east' }],
    now: new Date('2026-10-31T10:15:00')
  });

  assert.equal(event.title, 'Route reassignment: 1 agent');
  assert.equal(event.reason, 'Route reevaluation');
});

test('formats simulation time and exit labels', () => {
  assert.equal(formatSimTime(0), '00:00');
  assert.equal(formatSimTime(65), '01:05');
  assert.equal(formatSimTime(-5), '00:00');
  assert.equal(formatExitLabels(['exit_west', 'exit_south'], EXITS), 'West, South');
  assert.equal(formatExitLabels(['custom_exit'], EXITS), 'custom_exit');
});
