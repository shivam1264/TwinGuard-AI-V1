import {
  BuildingGraph,
  FIRE_STATUSES,
  HAZARD_SCHEMA_VERSION,
  SMOKE_STATUSES,
  loadBuilding
} from './BuildingGraph.js';

export const RISK_MODEL_ID = 'hazard-risk-v1';

export const ASSESSMENT_STATUSES = Object.freeze({
  ASSESSED: 'assessed',
  PARTIAL: 'partial',
  UNKNOWN: 'unknown'
});

export const RISK_LEVELS = Object.freeze({
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical'
});

// Prototype relative-risk configuration. These are not calibrated or validated
// fire-safety values. Weights are relative and normalized by their sum.
export const DEFAULT_RISK_CONFIG = Object.freeze({
  weights: Object.freeze({
    fire: 0.6,
    smoke: 0.4
  }),
  pendingFireFactor: 0.25,
  smokeDensityMax: 1,
  thresholds: Object.freeze({
    moderate: 25,
    high: 50,
    critical: 75
  })
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveGraph(graph) {
  return graph instanceof BuildingGraph ? graph : loadBuilding(graph);
}

function validateState(state) {
  if (!isObject(state)) {
    throw new Error('Hazard state must be an object');
  }
  if (state.schemaVersion !== HAZARD_SCHEMA_VERSION) {
    throw new Error(`Hazard state schemaVersion must be ${HAZARD_SCHEMA_VERSION}`);
  }
  if (!Number.isFinite(state.timeSec) || state.timeSec < 0) {
    throw new Error('Hazard state timeSec must be a finite non-negative number');
  }
  if (!isObject(state.zones)) {
    throw new Error('Hazard state zones must be an object');
  }
}

function resolveConfig(overrides = {}) {
  if (!isObject(overrides)) {
    throw new Error('Risk assessment config must be an object');
  }
  if (overrides.weights !== undefined && !isObject(overrides.weights)) {
    throw new Error('Risk assessment config weights must be an object');
  }
  if (overrides.thresholds !== undefined && !isObject(overrides.thresholds)) {
    throw new Error('Risk assessment config thresholds must be an object');
  }

  const weights = { ...DEFAULT_RISK_CONFIG.weights, ...(overrides.weights || {}) };
  const thresholds = {
    ...DEFAULT_RISK_CONFIG.thresholds,
    ...(overrides.thresholds || {})
  };
  const pendingFireFactor = overrides.pendingFireFactor ?? DEFAULT_RISK_CONFIG.pendingFireFactor;
  const smokeDensityMax = overrides.smokeDensityMax ?? DEFAULT_RISK_CONFIG.smokeDensityMax;

  ['fire', 'smoke'].forEach((key) => {
    if (!Number.isFinite(weights[key]) || weights[key] < 0) {
      throw new Error(`Risk assessment config weights.${key} must be a finite non-negative number`);
    }
  });

  const weightSum = weights.fire + weights.smoke;
  if (!(weightSum > 0)) {
    throw new Error('Risk assessment config weights must have a positive sum');
  }

  if (!Number.isFinite(pendingFireFactor) || pendingFireFactor < 0 || pendingFireFactor > 1) {
    throw new Error('Risk assessment config pendingFireFactor must be between 0 and 1');
  }
  if (!Number.isFinite(smokeDensityMax) || smokeDensityMax <= 0) {
    throw new Error('Risk assessment config smokeDensityMax must be a finite positive number');
  }

  ['moderate', 'high', 'critical'].forEach((key) => {
    if (!Number.isFinite(thresholds[key])) {
      throw new Error(`Risk assessment config thresholds.${key} must be a finite number`);
    }
  });

  if (!(
    thresholds.moderate > 0
    && thresholds.moderate < thresholds.high
    && thresholds.high < thresholds.critical
    && thresholds.critical <= 100
  )) {
    throw new Error(
      'Risk assessment config thresholds must satisfy 0 < moderate < high < critical <= 100'
    );
  }

  return {
    weights,
    weightSum,
    pendingFireFactor,
    smokeDensityMax,
    thresholds
  };
}

function roundScore(value) {
  return Math.round(value * 100) / 100;
}

function classifyScore(score, thresholds) {
  if (score < thresholds.moderate) return RISK_LEVELS.LOW;
  if (score < thresholds.high) return RISK_LEVELS.MODERATE;
  if (score < thresholds.critical) return RISK_LEVELS.HIGH;
  return RISK_LEVELS.CRITICAL;
}

function assessFire(zoneId, fire, config) {
  if (!isObject(fire)) {
    return {
      status: null,
      known: false,
      intensity: null,
      score: null,
      level: null
    };
  }

  if (!Object.values(FIRE_STATUSES).includes(fire.status)) {
    throw new Error(`Invalid hazard state fire.status for zone ${zoneId}`);
  }

  if (fire.status === FIRE_STATUSES.UNKNOWN) {
    return {
      status: fire.status,
      known: false,
      intensity: null,
      score: null,
      level: null
    };
  }

  if (fire.status === FIRE_STATUSES.NONE) {
    return {
      status: fire.status,
      known: true,
      intensity: null,
      score: 0,
      level: RISK_LEVELS.LOW
    };
  }

  if (!Number.isFinite(fire.intensity) || fire.intensity < 0 || fire.intensity > 1) {
    throw new Error(`Invalid hazard state fire.intensity for zone ${zoneId}`);
  }

  const severity = fire.status === FIRE_STATUSES.PENDING
    ? fire.intensity * config.pendingFireFactor
    : fire.intensity;
  const score = roundScore(severity * 100);

  return {
    status: fire.status,
    known: true,
    intensity: fire.intensity,
    score,
    level: classifyScore(score, config.thresholds)
  };
}

function assessSmoke(zoneId, smoke, config) {
  if (!isObject(smoke)) {
    return {
      status: null,
      known: false,
      density: null,
      score: null,
      level: null
    };
  }

  if (!Object.values(SMOKE_STATUSES).includes(smoke.status)) {
    throw new Error(`Invalid hazard state smoke.status for zone ${zoneId}`);
  }

  if (smoke.status === SMOKE_STATUSES.UNKNOWN) {
    return {
      status: smoke.status,
      known: false,
      density: null,
      score: null,
      level: null
    };
  }

  if (smoke.status === SMOKE_STATUSES.NONE) {
    return {
      status: smoke.status,
      known: true,
      density: null,
      score: 0,
      level: RISK_LEVELS.LOW
    };
  }

  if (!Number.isFinite(smoke.density) || smoke.density < 0) {
    throw new Error(`Invalid hazard state smoke.density for zone ${zoneId}`);
  }

  const severity = Math.min(1, smoke.density / config.smokeDensityMax);
  const score = roundScore(severity * 100);

  return {
    status: smoke.status,
    known: true,
    density: smoke.density,
    score,
    level: classifyScore(score, config.thresholds)
  };
}

function combineAssessment(fire, smoke, config) {
  const complete = fire.known && smoke.known;

  if (complete) {
    const score = roundScore(
      (config.weights.fire * fire.score + config.weights.smoke * smoke.score)
      / config.weightSum
    );

    return {
      status: ASSESSMENT_STATUSES.ASSESSED,
      complete: true,
      score,
      level: classifyScore(score, config.thresholds)
    };
  }

  return {
    status: fire.known || smoke.known
      ? ASSESSMENT_STATUSES.PARTIAL
      : ASSESSMENT_STATUSES.UNKNOWN,
    complete: false,
    score: null,
    level: null
  };
}

/**
 * Assess prototype relative hazard risk from a Phase 2 hazard state.
 *
 * Fire severity is intensity for active fire and intensity * pendingFireFactor
 * for pending fire. Smoke severity is density / smokeDensityMax, capped at 1.
 * Component scores are severity * 100. The complete combined score is
 * (fireWeight * fireScore + smokeWeight * smokeScore) / (fireWeight + smokeWeight).
 * Scores are rounded to two decimals and clamped by construction to 0-100.
 * A low level is a relative-risk indicator, not a guarantee that a zone is safe.
 *
 * A component is known for fire statuses none/pending/active and smoke statuses
 * none/active. Unknown status is not converted to zero. If one component is
 * unknown, the zone is partial with a null combined score and level. If both are
 * unknown, the zone is unknown. Known component scores remain available.
 *
 * Missing zone entries or missing fire/smoke objects are treated as unknown.
 * Invalid statuses or invalid numeric values in present components are errors.
 * The function does not mutate the hazard state, graph, or configuration.
 */
export function assessRisk(state, graph, configOverrides = {}) {
  validateState(state);

  const building = resolveGraph(graph);
  const config = resolveConfig(configOverrides);
  const graphZoneIds = new Set(building.data.zones.map((zone) => zone.id));

  Object.keys(state.zones).forEach((zoneId) => {
    if (!graphZoneIds.has(zoneId)) {
      throw new Error(`Hazard state references unknown zone: ${zoneId}`);
    }
  });

  const zones = {};
  const summary = {
    zoneCount: 0,
    assessedCount: 0,
    partialCount: 0,
    unknownCount: 0
  };

  [...building.data.zones]
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((zone) => {
      const rawZone = isObject(state.zones[zone.id]) ? state.zones[zone.id] : null;
      const fire = assessFire(zone.id, rawZone ? rawZone.fire : null, config);
      const smoke = assessSmoke(zone.id, rawZone ? rawZone.smoke : null, config);
      const combined = combineAssessment(fire, smoke, config);

      zones[zone.id] = {
        zoneId: zone.id,
        status: combined.status,
        complete: combined.complete,
        score: combined.score,
        level: combined.level,
        fire,
        smoke
      };

      summary.zoneCount += 1;
      if (combined.status === ASSESSMENT_STATUSES.ASSESSED) summary.assessedCount += 1;
      if (combined.status === ASSESSMENT_STATUSES.PARTIAL) summary.partialCount += 1;
      if (combined.status === ASSESSMENT_STATUSES.UNKNOWN) summary.unknownCount += 1;
    });

  return {
    modelId: RISK_MODEL_ID,
    buildingId: state.buildingId || building.data.id,
    scenarioId: state.scenarioId || null,
    timeSec: state.timeSec,
    summary,
    zones
  };
}
