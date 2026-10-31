const EXIT_LABELS = Object.freeze({
  exit_west: 'West',
  exit_east: 'East',
  exit_south: 'South'
});

export function captureExitSnapshot(agents) {
  const snapshot = new Map();
  for (const agent of agents || []) {
    if (agent?.id && agent.currentExitId) {
      snapshot.set(agent.id, agent.currentExitId);
    }
  }
  return snapshot;
}

export function diffExitAssignments(previousExits, assignments) {
  const changes = [];
  if (!previousExits) return changes;

  for (const assignment of assignments || []) {
    const fromExitId = previousExits.get(assignment.agentId);
    if (!fromExitId || fromExitId === assignment.exitId) continue;
    changes.push({
      agentId: assignment.agentId,
      fromExitId,
      toExitId: assignment.exitId
    });
  }

  return changes;
}

export function formatSimTime(seconds) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const remainder = String(total % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function formatExitLabels(exitIds, exits = []) {
  return (exitIds || []).map((id) => {
    if (EXIT_LABELS[id]) return EXIT_LABELS[id];
    const exit = (exits || []).find((entry) => entry.id === id);
    return exit?.name || id;
  }).join(', ');
}

export function createRerouteEvent({
  changes,
  reason,
  reasons = [],
  severity = 'Info',
  exits = [],
  elapsedSeconds = 0,
  now = new Date(),
  id = null
} = {}) {
  if (!changes || changes.length === 0) return null;

  const fromExits = [...new Set(changes.map((change) => change.fromExitId))];
  const toExits = [...new Set(changes.map((change) => change.toExitId))];
  const count = changes.length;
  const reasonLabel = reason || 'Route reevaluation';
  const reasonDetail = reasons.length > 0 ? ` (${reasons.slice(0, 3).join(', ')})` : '';
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    id: id || `reroute_${now.getTime()}`,
    time,
    title: `Route reassignment: ${count} agent${count === 1 ? '' : 's'}`,
    subtitle: `${formatExitLabels(fromExits, exits)} → ${formatExitLabels(toExits, exits)} • ${reasonLabel}${reasonDetail} • T+${formatSimTime(elapsedSeconds)}`,
    severity,
    agentCount: count,
    fromExits,
    toExits,
    reason: reasonLabel,
    reasons: [...reasons],
    elapsedSeconds,
    changes: changes.slice(0, 10)
  };
}
