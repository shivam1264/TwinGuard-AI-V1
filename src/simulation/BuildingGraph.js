import { FLOOR_THEMES } from './Doorways.js';

export const GRAPH_SCHEMA_VERSION = 1;
export const SCENARIO_SCHEMA_VERSION = 1;
export const HAZARD_SCHEMA_VERSION = 1;

export const ZONE_TYPES = Object.freeze({
  FLOOR: 'floor',
  STAIRWELL: 'stairwell',
  EXIT: 'exit'
});

export const CONNECTION_TYPES = Object.freeze({
  FLOOR_STAIR: 'floor_stair',
  STAIR_EXIT: 'stair_exit',
  FLOOR_EXIT: 'floor_exit'
});

export const CONNECTION_STATUSES = Object.freeze({
  OPEN: 'open',
  RESTRICTED: 'restricted',
  CLOSED: 'closed',
  UNKNOWN: 'unknown'
});

export const FIRE_STATUSES = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  ACTIVE: 'active',
  UNKNOWN: 'unknown'
});

export const SMOKE_STATUSES = Object.freeze({
  NONE: 'none',
  ACTIVE: 'active',
  UNKNOWN: 'unknown'
});

export const RISK_STATUSES = Object.freeze({
  UNASSESSED: 'unassessed',
  ASSESSED: 'assessed'
});

export const EXPOSURE_STATUSES = Object.freeze({
  UNKNOWN: 'unknown',
  ESTIMATED: 'estimated'
});

export const ROUTE_STATUSES = Object.freeze({
  UNKNOWN: 'unknown',
  PERMITTED: 'permitted',
  RESTRICTED: 'restricted',
  PROHIBITED: 'prohibited'
});

const BUILDING_ID = 'twinguard-tower-10f';
const BUILDING_NAME = 'TwinGuard 10-Storey Tower';
const FLOOR_HEIGHT_M = 3.8;
const FLOOR_MIN_X = -30;
const FLOOR_MAX_X = 30;
const FLOOR_MIN_Z = -24;
const FLOOR_MAX_Z = 24;
const STAIR_HALF_WIDTH_M = 2.6;
const STAIR_HALF_DEPTH_M = 3.2;
const EXIT_PORTAL_HEIGHT_M = 3.6;
const EXIT_PORTAL_DEPTH_M = 0.55;

const FLOOR_NUMBERS = Object.freeze(
  Object.keys(FLOOR_THEMES)
    .map(Number)
    .filter(Number.isInteger)
    .sort((a, b) => a - b)
);

const EXIT_DEFINITIONS = Object.freeze([
  {
    id: 'exit_west',
    name: 'West Emergency Exit A',
    x: -29,
    z: 0,
    widthM: 5.2,
    capacity: 60,
    orientation: 'east_west'
  },
  {
    id: 'exit_east',
    name: 'East Emergency Exit B',
    x: 29,
    z: 0,
    widthM: 5.2,
    capacity: 60,
    orientation: 'east_west'
  },
  {
    id: 'exit_south',
    name: 'South Grand Plaza Exit',
    x: 0,
    z: 23,
    widthM: 8.5,
    capacity: 80,
    orientation: 'north_south'
  }
]);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function createFloorZone(floorNumber) {
  const baseY = (floorNumber - 1) * FLOOR_HEIGHT_M;
  const theme = FLOOR_THEMES[floorNumber];

  return {
    id: `L${floorNumber}`,
    name: `Level ${floorNumber} - ${theme.name}`,
    type: ZONE_TYPES.FLOOR,
    floor: floorNumber,
    bounds: {
      minX: FLOOR_MIN_X,
      maxX: FLOOR_MAX_X,
      minY: baseY,
      maxY: baseY + FLOOR_HEIGHT_M,
      minZ: FLOOR_MIN_Z,
      maxZ: FLOOR_MAX_Z
    },
    servesFloors: null,
    capacity: null,
    capacityUnit: null,
    capacityKind: null
  };
}

function createStairwellZone(id, name, x) {
  return {
    id,
    name,
    type: ZONE_TYPES.STAIRWELL,
    floor: null,
    bounds: {
      minX: x - STAIR_HALF_WIDTH_M,
      maxX: x + STAIR_HALF_WIDTH_M,
      minY: 0,
      maxY: FLOOR_NUMBERS.length * FLOOR_HEIGHT_M,
      minZ: -STAIR_HALF_DEPTH_M,
      maxZ: STAIR_HALF_DEPTH_M
    },
    servesFloors: [...FLOOR_NUMBERS],
    capacity: null,
    capacityUnit: null,
    capacityKind: null
  };
}

function createExitZone(definition) {
  const halfWidth = definition.widthM / 2;
  const halfDepth = EXIT_PORTAL_DEPTH_M / 2;
  const eastWest = definition.orientation === 'east_west';

  return {
    id: definition.id,
    name: definition.name,
    type: ZONE_TYPES.EXIT,
    floor: 1,
    bounds: {
      minX: definition.x - (eastWest ? halfDepth : halfWidth),
      maxX: definition.x + (eastWest ? halfDepth : halfWidth),
      minY: 0,
      maxY: EXIT_PORTAL_HEIGHT_M,
      minZ: definition.z - (eastWest ? halfWidth : halfDepth),
      maxZ: definition.z + (eastWest ? halfWidth : halfDepth)
    },
    servesFloors: null,
    capacity: definition.capacity,
    capacityUnit: 'persons',
    capacityKind: 'simulation_load_threshold'
  };
}

function createConnection(a, b, type) {
  return {
    id: `conn_${a}_${b}`,
    a,
    b,
    type,
    status: CONNECTION_STATUSES.OPEN,
    weight: 1,
    weightUnit: 'hops',
    capacity: null,
    capacityUnit: null
  };
}

export function createTowerGraph() {
  const zones = FLOOR_NUMBERS.map(createFloorZone);

  zones.push(createStairwellZone('stair_west', 'West Emergency Core A', -28));
  zones.push(createStairwellZone('stair_east', 'East Emergency Core B', 28));

  EXIT_DEFINITIONS.forEach((definition) => {
    zones.push(createExitZone(definition));
  });

  const connections = [];

  FLOOR_NUMBERS.forEach((floorNumber) => {
    const floorId = `L${floorNumber}`;
    connections.push(createConnection(floorId, 'stair_west', CONNECTION_TYPES.FLOOR_STAIR));
    connections.push(createConnection(floorId, 'stair_east', CONNECTION_TYPES.FLOOR_STAIR));
  });

  connections.push(createConnection('stair_west', 'exit_west', CONNECTION_TYPES.STAIR_EXIT));
  connections.push(createConnection('stair_east', 'exit_east', CONNECTION_TYPES.STAIR_EXIT));
  connections.push(createConnection('L1', 'exit_south', CONNECTION_TYPES.FLOOR_EXIT));

  return {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    id: BUILDING_ID,
    name: BUILDING_NAME,
    coordinateSystem: 'threejs-y-up-x-east-z-south',
    floorHeightM: FLOOR_HEIGHT_M,
    floorCount: FLOOR_NUMBERS.length,
    provenance: {
      geometry: 'src/three/Building3D.js',
      floorThemes: 'src/simulation/Doorways.js',
      exitLoadThresholds: 'src/simulation/CrowdOptimizer.js:9-12; src/App.jsx:47-51; server/index.js:75-79'
    },
    zones,
    connections
  };
}

function validateBounds(bounds, path, errors) {
  if (!isObject(bounds)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const axes = ['minX', 'maxX', 'minY', 'maxY', 'minZ', 'maxZ'];

  axes.forEach((axis) => {
    if (!Number.isFinite(bounds[axis])) {
      errors.push(`${path}.${axis} must be a finite number`);
    }
  });

  if (
    Number.isFinite(bounds.minX) && Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxY) &&
    Number.isFinite(bounds.minZ) && Number.isFinite(bounds.maxZ)
  ) {
    if (bounds.minX >= bounds.maxX) errors.push(`${path}.minX must be less than maxX`);
    if (bounds.minY >= bounds.maxY) errors.push(`${path}.minY must be less than maxY`);
    if (bounds.minZ >= bounds.maxZ) errors.push(`${path}.minZ must be less than maxZ`);
  }
}

export function validateBuilding(rawGraph) {
  const errors = [];

  if (!isObject(rawGraph)) {
    return { valid: false, errors: ['building graph must be an object'] };
  }

  if (rawGraph.schemaVersion !== GRAPH_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${GRAPH_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(rawGraph.id)) errors.push('id must be a non-empty string');
  if (!isNonEmptyString(rawGraph.name)) errors.push('name must be a non-empty string');
  if (!isNonEmptyString(rawGraph.coordinateSystem)) errors.push('coordinateSystem must be a non-empty string');
  if (!Number.isFinite(rawGraph.floorHeightM) || rawGraph.floorHeightM <= 0) {
    errors.push('floorHeightM must be a finite positive number');
  }
  if (!Number.isInteger(rawGraph.floorCount) || rawGraph.floorCount < 1) {
    errors.push('floorCount must be a positive integer');
  }

  const floorCount = rawGraph.floorCount;
  const zoneIds = new Set();
  const zones = rawGraph.zones;

  if (!Array.isArray(zones)) {
    errors.push('zones must be an array');
  } else {
    if (zones.length < 8 || zones.length > 15) {
      errors.push('zones must contain between 8 and 15 entries');
    }

    zones.forEach((zone, index) => {
      const path = `zones[${index}]`;

      if (!isObject(zone)) {
        errors.push(`${path} must be an object`);
        return;
      }

      if (!isNonEmptyString(zone.id)) {
        errors.push(`${path}.id must be a non-empty string`);
      } else if (zoneIds.has(zone.id)) {
        errors.push(`${path}.id duplicates ${zone.id}`);
      } else {
        zoneIds.add(zone.id);
      }

      if (!isNonEmptyString(zone.name)) errors.push(`${path}.name must be a non-empty string`);

      if (!Object.values(ZONE_TYPES).includes(zone.type)) {
        errors.push(`${path}.type must be one of ${Object.values(ZONE_TYPES).join(', ')}`);
      }

      if (zone.type === ZONE_TYPES.STAIRWELL) {
        if (zone.floor !== null) errors.push(`${path}.floor must be null for a stairwell`);
      } else if (!Number.isInteger(zone.floor) || zone.floor < 1 || zone.floor > floorCount) {
        errors.push(`${path}.floor must be an integer between 1 and floorCount`);
      }

      validateBounds(zone.bounds, `${path}.bounds`, errors);

      if (zone.type === ZONE_TYPES.STAIRWELL) {
        if (!Array.isArray(zone.servesFloors) || zone.servesFloors.length === 0) {
          errors.push(`${path}.servesFloors must be a non-empty array for a stairwell`);
        } else {
          const seenFloors = new Set();
          zone.servesFloors.forEach((floor, floorIndex) => {
            if (!Number.isInteger(floor) || floor < 1 || floor > floorCount) {
              errors.push(`${path}.servesFloors[${floorIndex}] must be between 1 and floorCount`);
            } else if (seenFloors.has(floor)) {
              errors.push(`${path}.servesFloors[${floorIndex}] duplicates floor ${floor}`);
            } else {
              seenFloors.add(floor);
            }
          });
        }
      } else if (zone.servesFloors !== null) {
        errors.push(`${path}.servesFloors must be null unless the zone is a stairwell`);
      }

      if (zone.capacity === null) {
        if (zone.capacityUnit !== null) errors.push(`${path}.capacityUnit must be null when capacity is null`);
        if (zone.capacityKind !== null) errors.push(`${path}.capacityKind must be null when capacity is null`);
      } else {
        if (!Number.isFinite(zone.capacity) || zone.capacity < 0) {
          errors.push(`${path}.capacity must be null or a finite non-negative number`);
        }
        if (!isNonEmptyString(zone.capacityUnit)) errors.push(`${path}.capacityUnit is required when capacity is set`);
        if (!isNonEmptyString(zone.capacityKind)) errors.push(`${path}.capacityKind is required when capacity is set`);
      }
    });
  }

  const connectionIds = new Set();
  const connectionPairs = new Set();
  const connections = rawGraph.connections;

  if (!Array.isArray(connections)) {
    errors.push('connections must be an array');
  } else {
    connections.forEach((connection, index) => {
      const path = `connections[${index}]`;

      if (!isObject(connection)) {
        errors.push(`${path} must be an object`);
        return;
      }

      if (!isNonEmptyString(connection.id)) {
        errors.push(`${path}.id must be a non-empty string`);
      } else if (connectionIds.has(connection.id)) {
        errors.push(`${path}.id duplicates ${connection.id}`);
      } else {
        connectionIds.add(connection.id);
      }

      if (!isNonEmptyString(connection.a)) errors.push(`${path}.a must be a non-empty string`);
      if (!isNonEmptyString(connection.b)) errors.push(`${path}.b must be a non-empty string`);

      if (connection.a === connection.b) errors.push(`${path} must not be a self-loop`);

      if (isNonEmptyString(connection.a) && !zoneIds.has(connection.a)) {
        errors.push(`${path}.a references unknown zone ${connection.a}`);
      }
      if (isNonEmptyString(connection.b) && !zoneIds.has(connection.b)) {
        errors.push(`${path}.b references unknown zone ${connection.b}`);
      }

      if (!Object.values(CONNECTION_TYPES).includes(connection.type)) {
        errors.push(`${path}.type must be one of ${Object.values(CONNECTION_TYPES).join(', ')}`);
      }
      if (!Object.values(CONNECTION_STATUSES).includes(connection.status)) {
        errors.push(`${path}.status must be one of ${Object.values(CONNECTION_STATUSES).join(', ')}`);
      }

      if (isNonEmptyString(connection.a) && isNonEmptyString(connection.b) && connection.a !== connection.b) {
        const pair = [connection.a, connection.b].sort().join('::');
        if (connectionPairs.has(pair)) {
          errors.push(`${path} duplicates connection between ${connection.a} and ${connection.b}`);
        } else {
          connectionPairs.add(pair);
        }
      }

      if (connection.weight === null) {
        if (connection.weightUnit !== null) errors.push(`${path}.weightUnit must be null when weight is null`);
      } else {
        if (!Number.isFinite(connection.weight) || connection.weight < 0) {
          errors.push(`${path}.weight must be null or a finite non-negative number`);
        }
        if (!isNonEmptyString(connection.weightUnit)) errors.push(`${path}.weightUnit is required when weight is set`);
      }

      if (connection.capacity === null) {
        if (connection.capacityUnit !== null) errors.push(`${path}.capacityUnit must be null when capacity is null`);
      } else {
        if (!Number.isFinite(connection.capacity) || connection.capacity < 0) {
          errors.push(`${path}.capacity must be null or a finite non-negative number`);
        }
        if (!isNonEmptyString(connection.capacityUnit)) errors.push(`${path}.capacityUnit is required when capacity is set`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export class BuildingGraph {
  constructor(data) {
    this.data = data;
    this._zones = new Map(data.zones.map((zone) => [zone.id, zone]));
    this._connections = new Map(data.connections.map((connection) => [connection.id, connection]));
    this._adjacency = new Map();

    data.zones.forEach((zone) => {
      this._adjacency.set(zone.id, []);
    });

    data.connections.forEach((connection) => {
      this._adjacency.get(connection.a).push(connection);
      this._adjacency.get(connection.b).push(connection);
    });
  }

  getZone(zoneId) {
    return this._zones.get(zoneId) || null;
  }

  getConnection(connectionId) {
    return this._connections.get(connectionId) || null;
  }

  _requireZone(zoneId) {
    if (!this._zones.has(zoneId)) {
      throw new Error(`Unknown zone: ${zoneId}`);
    }
  }

  getConnections(zoneId) {
    this._requireZone(zoneId);

    return [...this._adjacency.get(zoneId)].sort((a, b) => a.id.localeCompare(b.id));
  }

  getNeighbors(zoneId, options = {}) {
    const includeNonOpen = options.includeNonOpen === true;

    return this.getConnections(zoneId)
      .filter((connection) => includeNonOpen || connection.status === CONNECTION_STATUSES.OPEN)
      .map((connection) => (connection.a === zoneId ? connection.b : connection.a))
      .sort();
  }

  areConnected(zoneA, zoneB, options = {}) {
    this._requireZone(zoneA);
    this._requireZone(zoneB);

    const includeNonOpen = options.includeNonOpen === true;

    return this.getConnections(zoneA).some((connection) => {
      const other = connection.a === zoneA ? connection.b : connection.a;
      return other === zoneB && (includeNonOpen || connection.status === CONNECTION_STATUSES.OPEN);
    });
  }

  reachableFrom(zoneId, options = {}) {
    this._requireZone(zoneId);

    const visited = new Set([zoneId]);
    const queue = [zoneId];

    while (queue.length > 0) {
      const current = queue.shift();
      this.getNeighbors(current, options).forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    return [...visited].sort();
  }
}

export function loadBuilding(rawGraph) {
  const validation = validateBuilding(rawGraph);

  if (!validation.valid) {
    throw new Error(`Invalid building graph: ${validation.errors.join('; ')}`);
  }

  return new BuildingGraph(structuredClone(rawGraph));
}

function resolveGraph(graph) {
  return graph instanceof BuildingGraph ? graph : loadBuilding(graph);
}

export function validateScenario(graph, scenario) {
  const building = resolveGraph(graph);
  const errors = [];

  if (!isObject(scenario)) {
    return { valid: false, errors: ['scenario must be an object'] };
  }

  const durationSec = hasOwn(scenario, 'durationSec') ? scenario.durationSec : null;

  if (scenario.schemaVersion !== SCENARIO_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SCENARIO_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(scenario.id)) errors.push('id must be a non-empty string');
  if (!isNonEmptyString(scenario.name)) errors.push('name must be a non-empty string');
  if (hasOwn(scenario, 'description') && scenario.description !== null && typeof scenario.description !== 'string') {
    errors.push('description must be a string or null when provided');
  }
  if (durationSec !== null && (!Number.isFinite(durationSec) || durationSec <= 0)) {
    errors.push('durationSec must be null or a finite positive number');
  }

  if (!Array.isArray(scenario.fires) || scenario.fires.length === 0) {
    errors.push('fires must be a non-empty array');
    return { valid: false, errors };
  }

  const fireIds = new Set();
  const fireZones = new Set();

  scenario.fires.forEach((fire, index) => {
    const path = `fires[${index}]`;

    if (!isObject(fire)) {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!isNonEmptyString(fire.id)) {
      errors.push(`${path}.id must be a non-empty string`);
    } else if (fireIds.has(fire.id)) {
      errors.push(`${path}.id duplicates ${fire.id}`);
    } else {
      fireIds.add(fire.id);
    }

    if (!isNonEmptyString(fire.zoneId)) {
      errors.push(`${path}.zoneId must be a non-empty string`);
    } else if (!building.getZone(fire.zoneId)) {
      errors.push(`${path}.zoneId references unknown zone ${fire.zoneId}`);
    } else if (fireZones.has(fire.zoneId)) {
      errors.push(`${path}.zoneId duplicates fire in zone ${fire.zoneId}`);
    } else {
      fireZones.add(fire.zoneId);
    }

    if (!Number.isFinite(fire.startSec) || fire.startSec < 0) {
      errors.push(`${path}.startSec must be a finite non-negative number`);
    } else if (durationSec !== null && Number.isFinite(durationSec) && fire.startSec > durationSec) {
      errors.push(`${path}.startSec must not exceed durationSec`);
    }

    if (!Number.isFinite(fire.intensity) || fire.intensity <= 0 || fire.intensity > 1) {
      errors.push(`${path}.intensity must be greater than 0 and at most 1`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function loadScenario(graph, rawScenario) {
  const building = resolveGraph(graph);
  const validation = validateScenario(building, rawScenario);

  if (!validation.valid) {
    throw new Error(`Invalid scenario: ${validation.errors.join('; ')}`);
  }

  return {
    schemaVersion: SCENARIO_SCHEMA_VERSION,
    id: rawScenario.id,
    name: rawScenario.name,
    description: rawScenario.description || null,
    durationSec: hasOwn(rawScenario, 'durationSec') && rawScenario.durationSec !== null
      ? rawScenario.durationSec
      : null,
    fires: rawScenario.fires.map((fire) => ({
      id: fire.id,
      zoneId: fire.zoneId,
      startSec: fire.startSec,
      intensity: fire.intensity
    }))
  };
}

export function applyScenario(graph, scenario) {
  const building = resolveGraph(graph);
  const validatedScenario = loadScenario(building, scenario);
  const firesByZone = new Map(
    validatedScenario.fires.map((fire) => [fire.zoneId, fire])
  );

  const zones = {};
  const sortedZones = [...building.data.zones].sort((a, b) => a.id.localeCompare(b.id));

  sortedZones.forEach((zone) => {
    const fire = firesByZone.get(zone.id) || null;
    const isActive = Boolean(fire && fire.startSec === 0);

    zones[zone.id] = {
      zoneId: zone.id,
      fire: {
        status: fire
          ? (isActive ? FIRE_STATUSES.ACTIVE : FIRE_STATUSES.PENDING)
          : FIRE_STATUSES.NONE,
        intensity: fire ? fire.intensity : null,
        sinceSec: isActive ? 0 : null,
        startSec: fire ? fire.startSec : null,
        source: fire ? 'scenario' : null
      },
      smoke: {
        status: SMOKE_STATUSES.UNKNOWN,
        density: null
      },
      risk: {
        status: RISK_STATUSES.UNASSESSED,
        score: null,
        level: null
      },
      exposure: {
        status: EXPOSURE_STATUSES.UNKNOWN,
        occupantCount: null,
        personSeconds: null
      }
    };
  });

  const connections = {};
  const sortedConnections = [...building.data.connections].sort((a, b) => a.id.localeCompare(b.id));

  sortedConnections.forEach((connection) => {
    connections[connection.id] = {
      connectionId: connection.id,
      routeStatus: ROUTE_STATUSES.UNKNOWN
    };
  });

  return {
    schemaVersion: HAZARD_SCHEMA_VERSION,
    buildingId: building.data.id,
    scenarioId: validatedScenario.id,
    timeSec: 0,
    modelId: 'scenario-initial',
    zones,
    connections
  };
}
