export const PENDING_FIRE_TRIGGER_TTL_MS = 60_000;

export function createFireTriggerId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `fire-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function rememberPendingFireTrigger(
  pendingTriggers,
  triggerId,
  ttlMs = PENDING_FIRE_TRIGGER_TTL_MS
) {
  const existingTimeout = pendingTriggers.get(triggerId);
  if (existingTimeout !== undefined) clearTimeout(existingTimeout);

  const timeout = setTimeout(() => {
    pendingTriggers.delete(triggerId);
  }, ttlMs);
  timeout.unref?.();
  pendingTriggers.set(triggerId, timeout);
}

export function consumePendingFireTrigger(pendingTriggers, triggerId) {
  if (typeof triggerId !== 'string' || triggerId.length === 0) return false;

  const timeout = pendingTriggers.get(triggerId);
  if (timeout === undefined) return false;

  clearTimeout(timeout);
  pendingTriggers.delete(triggerId);
  return true;
}

export function forgetPendingFireTrigger(pendingTriggers, triggerId) {
  const timeout = pendingTriggers.get(triggerId);
  if (timeout === undefined) return;

  clearTimeout(timeout);
  pendingTriggers.delete(triggerId);
}

export function clearPendingFireTriggers(pendingTriggers) {
  for (const timeout of pendingTriggers.values()) {
    clearTimeout(timeout);
  }
  pendingTriggers.clear();
}

export function processFireDetected(data, pendingTriggers, applyFire) {
  const isOwnEcho = consumePendingFireTrigger(pendingTriggers, data?.triggerId);
  applyFire(data.roomId, !isOwnEcho);
}

export function registerFireTriggerSocketHandlers(socket, pendingTriggers, applyFire, applyState) {
  socket.on('fire-detected', (data) => {
    processFireDetected(data, pendingTriggers, applyFire);
  });
  socket.on('state-update', applyState);
}
