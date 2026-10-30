import {
  BuildingGraph,
  CONNECTION_STATUSES,
  FIRE_STATUSES,
  HAZARD_SCHEMA_VERSION,
  ROUTE_STATUSES,
  SMOKE_STATUSES,
  loadBuilding
} from './BuildingGraph.js';

export const ROUTING_HAZARD_POLICY_ID = 'routing-hazard-v1';

export const ROUTING_CONTEXT_STATUSES = Object.freeze({
  COMPLETE: 'complete',
  PARTIAL: 'partial',
  UNAVAILABLE: 'unavailable'
});

export const ROUTE_CONDITIONS = Object.freeze({
  PERMITTED: 'permitted',
  PENALIZED: 'penalized',
  PROHIBITED: 'prohibited',
  UNKNOWN: 'unknown'
});

const CONDITION_SEVERITY = Object.freeze({
  [ROUTE_CONDITIONS.PERMITTED]: 0,
  [ROUTE_CONDITIONS.PENALIZED]: 1,
  [ROUTE_CONDITIONS.UNKNOWN]: 2,
  [ROUTE_CONDITIONS.PROHIBITED]: 3
});

export const DEFAULT_ROUTING_HAZARD_POLICY = Object.freeze({
  id: ROUTING_HAZARD_POLICY_ID,
  maxHazardAgeSec: 60,
  riskCostPerPoint: 0.5,
  conditionCosts: Object.freeze({
    [ROUTE_CONDITIONS.PERMITTED]: 0,
    [ROUTE_CONDITIONS.PENALIZED]: 40,
    [ROUTE_CONDITIONS.UNKNOWN]: 15
  })
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveGraph(graph) {
  return graph instanceof BuildingGraph ? graph : loadBuilding(graph);
}

function combineConditions(first, second) {
  return CONDITION_SEVERITY[second] > CONDITION_SEVERITY[first] ? second : first;
}

export function createRoutingHazardPolicy(overrides = {}) {
  if (!isObject(overrides)) {
    throw new Error('Routing hazard policy must be an object');
  }

  const policy = {
    id: overrides.id || DEFAULT_ROUTING_HAZARD_POLICY.id,
    maxHazardAgeSec: overrides.maxHazardAgeSec ?? DEFAULT_ROUTING_HAZARD_POLICY.maxHazardAgeSec,
    riskCostPerPoint: overrides.riskCostPerPoint ?? DEFAULT_ROUTING_HAZARD_POLICY.riskCostPerPoint,
    conditionCosts: {
      ...DEFAULT_ROUTING_HAZARD_POLICY.conditionCosts,
      ...(overrides.conditionCosts || {})
    }
  };

  if (!Number.isFinite(policy.maxHazardAgeSec) || policy.maxHazardAgeSec < 0) {
    throw new Error('Routing hazard policy maxHazardAgeSec must be a finite non-negative number');
  }
  if (!Number.isFinite(policy.riskCostPerPoint) || policy.riskCostPerPoint < 0) {
    throw new Error('Routing hazard policy riskCostPerPoint must be a finite non-negative number');
  }

  Object.values(ROUTE_CONDITIONS)
    .filter((condition) => condition !== ROUTE_CONDITIONS.PROHIBITED)
    .forEach((condition) => {
      const cost = policy.conditionCosts[condition];
      if (!Number.isFinite(cost) || cost < 0) {
        throw new Error(`Routing hazard policy conditionCosts.${condition} must be a finite non-negative number`);
      }
    });

  return policy;
}

function zoneCondition(zoneState) {
  if (!isObject(zoneState)) {
    return {
      condition: ROUTE_CONDITIONS.UNKNOWN,
      reasons: ['zone-state:missing']
    };
  }

  const fire = zoneState.fire;
  const smoke = zoneState.smoke;
  let condition = ROUTE_CONDITIONS.PERMITTED;
  const reasons = [];

  if (!isObject(fire) || !Object.values(FIRE_STATUSES).includes(fire.status)) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.UNKNOWN);
    reasons.push('fire:unknown');
  } else if (fire.status === FIRE_STATUSES.ACTIVE) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.PROHIBITED);
    reasons.push('fire:active');
  } else if (fire.status === FIRE_STATUSES.PENDING) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.PENALIZED);
    reasons.push('fire:pending');
  } else if (fire.status === FIRE_STATUSES.UNKNOWN) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.UNKNOWN);
    reasons.push('fire:unknown');
  }

  if (!isObject(smoke) || !Object.values(SMOKE_STATUSES).includes(smoke.status)) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.UNKNOWN);
    reasons.push('smoke:unknown');
  } else if (smoke.status === SMOKE_STATUSES.ACTIVE) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.PENALIZED);
    reasons.push('smoke:active');
  } else if (smoke.status === SMOKE_STATUSES.UNKNOWN) {
    condition = combineConditions(condition, ROUTE_CONDITIONS.UNKNOWN);
    reasons.push('smoke:unknown');
  }

  return { condition, reasons };
}

function connectionCondition(graphStatus, hazardRouteStatus) {
  // 1. Prohibited takes precedence regardless of source
  if (graphStatus === CONNECTION_STATUSES.CLOSED || hazardRouteStatus === ROUTE_STATUSES.PROHIBITED) {
    return { condition: ROUTE_CONDITIONS.PROHIBITED, reasons: ['connection:prohibited'] };
  }
  // 2. Restricted from either source
  if (graphStatus === CONNECTION_STATUSES.RESTRICTED || hazardRouteStatus === ROUTE_STATUSES.RESTRICTED) {
    return { condition: ROUTE_CONDITIONS.PENALIZED, reasons: ['connection:restricted'] };
  }
  // 3. Graph UNKNOWN yields UNKNOWN (unless already PROHIBITED/RESTRICTED above)
  if (graphStatus === CONNECTION_STATUSES.UNKNOWN) {
    return { condition: ROUTE_CONDITIONS.UNKNOWN, reasons: ['connection:unknown-graph-status'] };
  }
  // 4. Hazard explicitly permits
  if (hazardRouteStatus === ROUTE_STATUSES.PERMITTED) {
    return { condition: ROUTE_CONDITIONS.PERMITTED, reasons: [] };
  }
  // 5. Graph OPEN permits when no conflicting hazard condition
  if (graphStatus === CONNECTION_STATUSES.OPEN) {
    return { condition: ROUTE_CONDITIONS.PERMITTED, reasons: [] };
  }
  // 6. Otherwise UNKNOWN
  return { condition: ROUTE_CONDITIONS.UNKNOWN, reasons: ['connection:unknown'] };
}

function findShortestPath(graph, startId, goalId) {
  if (startId === goalId) return { zoneIds: [startId], connectionIds: [] };

  const previous = new Map([[startId, null]]);
  const queue = [startId];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === goalId) break;

    for (const connection of graph.getConnections(current)) {
      const neighbor = connection.a === current ? connection.b : connection.a;
      if (previous.has(neighbor)) continue;
      previous.set(neighbor, { zoneId: current, connectionId: connection.id });
      queue.push(neighbor);
    }
  }

  if (!previous.has(goalId)) return null;

  const zoneIds = [];
  const connectionIds = [];
  let current = goalId;

  while (current !== null) {
    zoneIds.push(current);
    const step = previous.get(current);
    if (step) {
      connectionIds.push(step.connectionId);
      current = step.zoneId;
    } else {
      current = null;
    }
  }

  zoneIds.reverse();
  connectionIds.reverse();
  return { zoneIds, connectionIds };
}

function validateHazardState(graph, hazardState, expectedTimeSec, policy) {
  if (!isObject(hazardState)) return { unavailableReason: 'hazard-state:missing', freshness: 'unknown', freshnessReason: null };
  if (hazardState.schemaVersion !== HAZARD_SCHEMA_VERSION) return { unavailableReason: 'hazard-state:schema', freshness: 'unknown', freshnessReason: null };
  if (hazardState.buildingId !== graph.data.id) return { unavailableReason: 'hazard-state:building-mismatch', freshness: 'unknown', freshnessReason: null };
  if (!Number.isFinite(hazardState.timeSec) || hazardState.timeSec < 0) return { unavailableReason: 'hazard-state:time', freshness: 'unknown', freshnessReason: null };
  if (!isObject(hazardState.zones)) return { unavailableReason: 'hazard-state:zones', freshness: 'unknown', freshnessReason: null };
  if (!isObject(hazardState.connections)) return { unavailableReason: 'hazard-state:connections', freshness: 'unknown', freshnessReason: null };

  // Validate that all connection references in hazard state exist in the graph
  const graphConnectionIds = new Set(graph.data.connections.map(c => c.id));
  for (const connId of Object.keys(hazardState.connections)) {
    if (!graphConnectionIds.has(connId)) {
      return { unavailableReason: 'hazard-state:invalid-connection-reference', freshness: 'unknown', freshnessReason: null };
    }
  }

  // Freshness check only if expectedTimeSec is provided
  if (Number.isFinite(expectedTimeSec)) {
    const epsilon = 1e-9;
    const isFuture = hazardState.timeSec > expectedTimeSec + epsilon;
    const isStale = expectedTimeSec - hazardState.timeSec > policy.maxHazardAgeSec;
    if (isFuture) return { unavailableReason: 'hazard-state:future', freshness: 'stale', freshnessReason: 'hazard-state:future' };
    if (isStale) return { unavailableReason: 'hazard-state:stale', freshness: 'stale', freshnessReason: 'hazard-state:stale' };
    return { unavailableReason: null, freshness: 'fresh', freshnessReason: null };
  }

  // No reference time provided -> freshness unknown, but hazard state otherwise valid
  return { unavailableReason: null, freshness: 'unknown', freshnessReason: 'hazard-state:freshness-unknown' };
}

function getRiskScore(riskAssessment, zoneId) {
  if (!isObject(riskAssessment) || !isObject(riskAssessment.zones)) return null;
  const zone = riskAssessment.zones[zoneId];
  if (!isObject(zone) || !Number.isFinite(zone.score)) return null;
  return zone.score;
}

function evaluateRoute(graph, hazardState, riskAssessment, path, policy) {
  let condition = ROUTE_CONDITIONS.PERMITTED;
  const reasons = [];
  let riskScore = 0;
  let hasRisk = false;
  let hasMissingHazardData = false;

  path.zoneIds.forEach((zoneId) => {
    const zoneState = hazardState.zones[zoneId];
    const zoneResult = zoneCondition(zoneState);
    condition = combineConditions(condition, zoneResult.condition);
    zoneResult.reasons.forEach((reason) => reasons.push(`${zoneId}:${reason}`));

    if (!isObject(zoneState)) hasMissingHazardData = true;

    const score = getRiskScore(riskAssessment, zoneId);
    if (score !== null) {
      riskScore += score;
      hasRisk = true;
    }
  });

  path.connectionIds.forEach((connectionId) => {
    const connection = graph.getConnection(connectionId);
    const hazardConnection = hazardState.connections[connectionId];
    const hazardStatus = isObject(hazardConnection) ? hazardConnection.routeStatus : ROUTE_STATUSES.UNKNOWN;
    const connectionResult = connectionCondition(connection.status, hazardStatus);
    condition = combineConditions(condition, connectionResult.condition);
    connectionResult.reasons.forEach((reason) => reasons.push(`${connectionId}:${reason}`));
  });

  const riskCost = hasRisk ? riskScore * policy.riskCostPerPoint : 0;

  return {
    condition,
    cost: policy.conditionCosts[condition] + riskCost,
    riskScore: hasRisk ? riskScore : null,
    riskCost,
    reasons,
    zoneIds: [...path.zoneIds],
    connectionIds: [...path.connectionIds],
    hasMissingHazardData
  };
}

export function buildRoutingHazardContext({
  graph,
  hazardState,
  riskAssessment = null,
  expectedTimeSec = undefined,
  policy = DEFAULT_ROUTING_HAZARD_POLICY
} = {}) {
  const building = resolveGraph(graph);
  const resolvedPolicy = createRoutingHazardPolicy(policy);
  const validation = validateHazardState(
    building,
    hazardState,
    expectedTimeSec,
    resolvedPolicy
  );

  if (validation.unavailableReason) {
    return {
      policyId: resolvedPolicy.id,
      status: ROUTING_CONTEXT_STATUSES.UNAVAILABLE,
      availability: {
        available: false,
        reason: validation.unavailableReason,
        freshness: validation.freshness,
        freshnessReason: validation.freshnessReason
      },
      buildingId: building.data.id,
      timeSec: hazardState?.timeSec ?? null,
      policy: resolvedPolicy,
      routes: {}
    };
  }

  const floorZones = building.data.zones.filter((zone) => zone.type === 'floor');
  const exitZones = building.data.zones.filter((zone) => zone.type === 'exit');
  const routes = {};
  let complete = true;

  floorZones.forEach((floorZone) => {
    exitZones.forEach((exitZone) => {
      const path = findShortestPath(building, floorZone.id, exitZone.id);
      if (!path) return;

      const route = evaluateRoute(building, hazardState, riskAssessment, path, resolvedPolicy);
      if (route.condition === ROUTE_CONDITIONS.UNKNOWN || route.hasMissingHazardData) {
        complete = false;
      }

      routes[`${floorZone.id}:${exitZone.id}`] = {
        routeId: `${floorZone.id}:${exitZone.id}`,
        floor: floorZone.floor,
        startZoneId: floorZone.id,
        exitId: exitZone.id,
        ...route
      };
    });
  });

  // Determine overall status: if freshness unknown or stale, context is partial
  let status = complete ? ROUTING_CONTEXT_STATUSES.COMPLETE : ROUTING_CONTEXT_STATUSES.PARTIAL;
  if (validation.freshness !== 'fresh') {
    status = ROUTING_CONTEXT_STATUSES.PARTIAL;
  }

  return {
    policyId: resolvedPolicy.id,
    status,
    availability: {
      available: true,
      reason: null,
      freshness: validation.freshness,
      freshnessReason: validation.freshnessReason
    },
    buildingId: building.data.id,
    timeSec: hazardState.timeSec,
    policy: resolvedPolicy,
    routes
  };
}

export function getExitRouteCondition(context, floor, exitId) {
  if (!isObject(context) || context.availability?.available !== true) return null;
  return context.routes[`L${floor}:${exitId}`] || null;
}
