export const STRATEGY_BEHAVIOR_LABELS = Object.freeze({
  NEAREST_CORE: 'Nearest Core',
  LOAD_BALANCED: 'Load Balanced',
  DYNAMIC_CORE_BALANCING: 'Dynamic Core Balancing',
  PHASED_ZONE: 'Phased Zone'
});

export const DYNAMIC_CORE_EQUIVALENCE_NOTE =
  'Behavior is identical to Load Balanced in the current implementation.';

const STRATEGY_FALLBACKS = Object.freeze({
  NEAREST_CORE: {
    label: 'Nearest Core',
    description: 'Occupants head to the closest available exit without load balancing.'
  },
  LOAD_BALANCED: {
    label: 'Load Balanced',
    description: 'Routes are distributed across available exits using live load and congestion.'
  },
  DYNAMIC_CORE_BALANCING: {
    label: 'Dynamic Core Balancing',
    description: 'Routes are distributed across available exits using live load and congestion.',
    note: DYNAMIC_CORE_EQUIVALENCE_NOTE
  },
  PHASED_ZONE: {
    label: 'Phased Zone',
    description: 'Fire and adjacent floors evacuate first; other floors wait, then evacuate.'
  }
});

export function resolveStrategyInfo(strategyType, strategy = null) {
  const requestedType = strategy?.type || strategyType || 'LOAD_BALANCED';
  const type = Object.prototype.hasOwnProperty.call(STRATEGY_FALLBACKS, requestedType)
    ? requestedType
    : 'LOAD_BALANCED';
  const fallback = STRATEGY_FALLBACKS[type];

  const label = typeof strategy?.name === 'string' && strategy.name.trim()
    ? strategy.name.trim()
    : fallback.label;
  const description = typeof strategy?.description === 'string' && strategy.description.trim()
    ? strategy.description.trim()
    : fallback.description;
  const isDynamicCore = type === 'DYNAMIC_CORE_BALANCING' || /dynamic core (load )?balancing/i.test(label);

  return {
    type,
    label,
    behavior: STRATEGY_BEHAVIOR_LABELS[type] || fallback.label,
    description,
    note: isDynamicCore ? DYNAMIC_CORE_EQUIVALENCE_NOTE : (fallback.note || null)
  };
}
