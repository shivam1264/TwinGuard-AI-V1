import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearPendingFireTriggers,
  createFireTriggerId,
  forgetPendingFireTrigger,
  registerFireTriggerSocketHandlers,
  rememberPendingFireTrigger
} from './FireTriggerCorrelation.js';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test('originating client suppresses a matching echo received more than two seconds later', async () => {
  const pendingTriggers = new Map();
  const incidents = [{ id: 'local-fire-incident' }];
  const triggerId = createFireTriggerId();
  rememberPendingFireTrigger(pendingTriggers, triggerId);

  try {
    await delay(2100);
    const handlers = registerHandlers(
      pendingTriggers,
      (roomId, createIncident) => {
        if (createIncident) incidents.push({ roomId });
      }
    );
    handlers['fire-detected']({ roomId: 'f1_r1', triggerId });

    assert.equal(incidents.length, 1);
    assert.equal(pendingTriggers.has(triggerId), false);
  } finally {
    clearPendingFireTriggers(pendingTriggers);
  }
});

test('remote client creates an incident for a correlated fire event', () => {
  const incidents = [];

  const handlers = registerHandlers(
    new Map(),
    (roomId, createIncident) => {
      if (createIncident) incidents.push({ roomId });
    }
  );
  handlers['fire-detected']({ roomId: 'f1_r1', triggerId: 'another-client-trigger' });

  assert.deepEqual(incidents, [{ roomId: 'f1_r1' }]);
});

test('fire events without a trigger ID create incidents normally', () => {
  const incidents = [];

  const handlers = registerHandlers(
    new Map(),
    (roomId, createIncident) => {
      if (createIncident) incidents.push({ roomId });
    }
  );
  handlers['fire-detected']({ roomId: 'f1_r1' });

  assert.deepEqual(incidents, [{ roomId: 'f1_r1' }]);
});

test('a nonmatching trigger ID creates an incident and leaves the pending ID intact', () => {
  const pendingTriggers = new Map();
  const incidents = [];
  rememberPendingFireTrigger(pendingTriggers, 'pending-trigger');

  try {
    const handlers = registerHandlers(
      pendingTriggers,
      (roomId, createIncident) => {
        if (createIncident) incidents.push({ roomId });
      }
    );
    handlers['fire-detected']({ roomId: 'f1_r1', triggerId: 'different-trigger' });

    assert.deepEqual(incidents, [{ roomId: 'f1_r1' }]);
    assert.equal(pendingTriggers.has('pending-trigger'), true);
  } finally {
    clearPendingFireTriggers(pendingTriggers);
  }
});

test('failed POST cleanup removes its pending trigger', () => {
  const pendingTriggers = new Map();
  rememberPendingFireTrigger(pendingTriggers, 'failed-trigger');
  forgetPendingFireTrigger(pendingTriggers, 'failed-trigger');

  assert.equal(pendingTriggers.size, 0);
});

test('stale pending triggers expire automatically', async () => {
  const pendingTriggers = new Map();
  rememberPendingFireTrigger(pendingTriggers, 'stale-trigger', 5);

  await delay(15);
  assert.equal(pendingTriggers.has('stale-trigger'), false);
});

test('separate triggers for the same room keep separate incidents and correlations', () => {
  const pendingTriggers = new Map();
  const incidents = [];
  const firstTriggerId = createFireTriggerId();
  const secondTriggerId = createFireTriggerId();
  assert.notEqual(firstTriggerId, secondTriggerId);

  rememberPendingFireTrigger(pendingTriggers, firstTriggerId);
  rememberPendingFireTrigger(pendingTriggers, secondTriggerId);

  try {
    incidents.push({ roomId: 'f1_r1', triggerId: firstTriggerId });
    incidents.push({ roomId: 'f1_r1', triggerId: secondTriggerId });

    const handlers = registerHandlers(
      pendingTriggers,
      (roomId, createIncident) => {
        if (createIncident) incidents.push({ roomId });
      }
    );
    for (const triggerId of [firstTriggerId, secondTriggerId]) {
      handlers['fire-detected']({ roomId: 'f1_r1', triggerId });
    }

    assert.equal(incidents.length, 2);
    assert.equal(pendingTriggers.size, 0);
  } finally {
    clearPendingFireTriggers(pendingTriggers);
  }
});

test('state-update after a matching fire echo does not create another incident', () => {
  const pendingTriggers = new Map();
  const incidents = [{ roomId: 'f1_r1' }];
  const triggerId = 'fire-trigger';
  rememberPendingFireTrigger(pendingTriggers, triggerId);
  let updatedRooms;
  const socketHandlers = {};
  registerFireTriggerSocketHandlers(
    { on: (event, callback) => { socketHandlers[event] = callback; } },
    pendingTriggers,
    (roomId, createIncident) => {
      if (createIncident) incidents.push({ roomId });
    },
    (state) => { updatedRooms = state.rooms; }
  );

  try {
    socketHandlers['fire-detected']({ roomId: 'f1_r1', triggerId });
    socketHandlers['state-update']({ rooms: [{ id: 'f1_r1', hasFire: true }] });

    assert.equal(incidents.length, 1);
    assert.equal(updatedRooms[0].hasFire, true);
  } finally {
    clearPendingFireTriggers(pendingTriggers);
  }
});

function registerHandlers(pendingTriggers, applyFire) {
  const handlers = {};
  registerFireTriggerSocketHandlers(
    { on: (event, callback) => { handlers[event] = callback; } },
    pendingTriggers,
    applyFire,
    () => {}
  );
  return handlers;
}
