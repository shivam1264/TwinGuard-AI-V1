import * as THREE from 'three';
import {
  CONNECTION_STATUSES,
  ROUTE_STATUSES,
  SMOKE_STATUSES,
  ZONE_TYPES
} from '../simulation/BuildingGraph.js';
import { ROUTE_CONDITIONS } from '../simulation/RoutingHazardAdapter.js';

export const HAZARD_RISK_COLORS = Object.freeze({
  low: 0x22c55e,
  moderate: 0xf59e0b,
  high: 0xf97316,
  critical: 0xef4444,
  unknown: 0x94a3b8
});

export const HAZARD_CONNECTION_COLORS = Object.freeze({
  [ROUTE_CONDITIONS.PERMITTED]: 0x22c55e,
  [ROUTE_CONDITIONS.PENALIZED]: 0xf59e0b,
  [ROUTE_CONDITIONS.PROHIBITED]: 0xef4444,
  [ROUTE_CONDITIONS.UNKNOWN]: 0x94a3b8
});

const RISK_FILL_OPACITY = Object.freeze({
  low: 0.04,
  moderate: 0.08,
  high: 0.13,
  critical: 0.18
});

const RISK_LINE_OPACITY = Object.freeze({
  low: 0.4,
  moderate: 0.55,
  high: 0.7,
  critical: 0.9
});

const UNKNOWN_FILL_OPACITY = 0.02;
const UNKNOWN_LINE_OPACITY = 0.25;
const SMOKE_BASE_OPACITY = 0.04;
const SMOKE_DENSITY_OPACITY = 0.12;
const SMOKE_MAX_OPACITY = 0.16;
const GLOBAL_FLOOR_MODES = new Set(['ALL', 'EXPLODED']);

function isGlobalFloorMode(mode) {
  return GLOBAL_FLOOR_MODES.has(mode);
}

function createRectGeometry(bounds, y) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    bounds.minX, y, bounds.minZ,
    bounds.maxX, y, bounds.minZ,
    bounds.maxX, y, bounds.maxZ,
    bounds.minX, y, bounds.maxZ
  ], 3));
  return geometry;
}

function getZoneFloor(zone) {
  return Number.isInteger(zone.floor) ? zone.floor : 1;
}

function getConnectionAnchor(zoneA, zoneB) {
  const minX = Math.max(zoneA.bounds.minX, zoneB.bounds.minX);
  const maxX = Math.min(zoneA.bounds.maxX, zoneB.bounds.maxX);
  const minZ = Math.max(zoneA.bounds.minZ, zoneB.bounds.minZ);
  const maxZ = Math.min(zoneA.bounds.maxZ, zoneB.bounds.maxZ);

  if (minX >= maxX || minZ >= maxZ) {
    return {
      x: ((zoneA.bounds.minX + zoneA.bounds.maxX) + (zoneB.bounds.minX + zoneB.bounds.maxX)) / 4,
      y: Math.max(zoneA.bounds.minY, zoneB.bounds.minY) + 0.25,
      z: ((zoneA.bounds.minZ + zoneA.bounds.maxZ) + (zoneB.bounds.minZ + zoneB.bounds.maxZ)) / 4
    };
  }

  return {
    x: (minX + maxX) / 2,
    y: Math.max(zoneA.bounds.minY, zoneB.bounds.minY) + 0.25,
    z: (minZ + maxZ) / 2
  };
}

function resolveConnectionCondition(connection, hazardConnection, routingContext) {
  if (!routingContext || routingContext.availability?.available !== true) {
    return ROUTE_CONDITIONS.UNKNOWN;
  }

  const graphStatus = connection.status;
  const hazardStatus = hazardConnection?.routeStatus || ROUTE_STATUSES.UNKNOWN;

  if (graphStatus === CONNECTION_STATUSES.CLOSED || hazardStatus === ROUTE_STATUSES.PROHIBITED) {
    return ROUTE_CONDITIONS.PROHIBITED;
  }
  if (graphStatus === CONNECTION_STATUSES.RESTRICTED || hazardStatus === ROUTE_STATUSES.RESTRICTED) {
    return ROUTE_CONDITIONS.PENALIZED;
  }
  if (graphStatus === CONNECTION_STATUSES.UNKNOWN) {
    return ROUTE_CONDITIONS.UNKNOWN;
  }
  if (hazardStatus === ROUTE_STATUSES.PERMITTED) {
    return ROUTE_CONDITIONS.PERMITTED;
  }
  if (graphStatus === CONNECTION_STATUSES.OPEN) {
    return ROUTE_CONDITIONS.PERMITTED;
  }
  return ROUTE_CONDITIONS.UNKNOWN;
}

function resolveRisk(riskAssessment, zoneId) {
  const entry = riskAssessment?.zones?.[zoneId];
  if (!entry || entry.status !== 'assessed' || entry.complete !== true || !entry.level) {
    return {
      color: HAZARD_RISK_COLORS.unknown,
      fillOpacity: UNKNOWN_FILL_OPACITY,
      lineOpacity: UNKNOWN_LINE_OPACITY
    };
  }

  return {
    color: HAZARD_RISK_COLORS[entry.level] || HAZARD_RISK_COLORS.unknown,
    fillOpacity: RISK_FILL_OPACITY[entry.level] ?? UNKNOWN_FILL_OPACITY,
    lineOpacity: RISK_LINE_OPACITY[entry.level] ?? UNKNOWN_LINE_OPACITY
  };
}

export class HazardVisualizer {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.floorHeight = options.floorHeight || 3.8;
    this.floorMode = 'ALL';
    this.visible = true;
    this.group = new THREE.Group();
    this.group.name = 'HazardVisualization';
    this.scene.add(this.group);

    this.zoneVisuals = new Map();
    this.connectionMarkers = new Map();
    this._graph = null;
    this._active = false;
  }

  update({ graph = null, hazardState = null, riskAssessment = null, routingContext = null } = {}) {
    if (!graph) {
      this.clear();
      return;
    }

    if (graph !== this._graph) {
      this._build(graph);
    }

    if (!hazardState) {
      this.clear();
      return;
    }

    this._active = true;

    for (const zone of graph.data.zones) {
      const visual = this.zoneVisuals.get(zone.id);
      if (!visual) continue;

      const risk = resolveRisk(riskAssessment, zone.id);
      visual.riskFillMaterial.color.setHex(risk.color);
      visual.riskFillMaterial.opacity = risk.fillOpacity;
      visual.riskLineMaterial.color.setHex(risk.color);
      visual.riskLineMaterial.opacity = risk.lineOpacity;

      const smoke = hazardState.zones?.[zone.id]?.smoke;
      const smokeActive = smoke?.status === SMOKE_STATUSES.ACTIVE
        && Number.isFinite(smoke.density)
        && smoke.density > 0;
      visual.smokeActive = smokeActive;
      visual.smokeMaterial.opacity = smokeActive
        ? Math.min(SMOKE_MAX_OPACITY, SMOKE_BASE_OPACITY + Math.min(1, smoke.density) * SMOKE_DENSITY_OPACITY)
        : 0;
    }

    for (const connection of graph.data.connections) {
      const marker = this.connectionMarkers.get(connection.id);
      if (!marker) continue;

      const condition = resolveConnectionCondition(
        connection,
        hazardState.connections?.[connection.id],
        routingContext
      );
      marker.condition = condition;
      marker.group.userData.condition = condition;
      marker.material.color.setHex(HAZARD_CONNECTION_COLORS[condition] || HAZARD_CONNECTION_COLORS.unknown);
      marker.material.opacity = condition === ROUTE_CONDITIONS.UNKNOWN ? 0.65 : 0.95;
      marker.ring.visible = true;
      marker.doubleRing.visible = condition === ROUTE_CONDITIONS.UNKNOWN;
      marker.post.visible = condition === ROUTE_CONDITIONS.UNKNOWN;
      marker.barA.visible = condition === ROUTE_CONDITIONS.PROHIBITED;
      marker.barB.visible = condition === ROUTE_CONDITIONS.PROHIBITED;
      marker.barSingle.visible = condition === ROUTE_CONDITIONS.PENALIZED;
    }

    this._applyVisibility();
  }

  setFloorMode(mode) {
    this.floorMode = mode || 'ALL';
    this._applyVisibility();
  }

  setVisible(visible) {
    this.visible = !!visible;
    this._applyVisibility();
  }

  clear() {
    this._active = false;
    for (const visual of this.zoneVisuals.values()) {
      visual.smokeActive = false;
    }
    this._applyVisibility();
  }

  dispose() {
    this._disposeVisuals();
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this._graph = null;
    this._active = false;
  }

  _build(graph) {
    this._disposeVisuals();
    this._graph = graph;
    this.floorHeight = graph.data.floorHeightM || this.floorHeight;

    const zonesById = new Map(graph.data.zones.map((zone) => [zone.id, zone]));

    for (const zone of graph.data.zones) {
      const visual = this._createZoneVisual(zone);
      this.zoneVisuals.set(zone.id, visual);
      this.group.add(visual.group);
    }

    for (const connection of graph.data.connections) {
      const zoneA = zonesById.get(connection.a);
      const zoneB = zonesById.get(connection.b);
      if (!zoneA || !zoneB) continue;

      const marker = this._createConnectionMarker(connection, zoneA, zoneB);
      this.connectionMarkers.set(connection.id, marker);
      this.group.add(marker.group);
    }

    this._active = false;
    this._applyVisibility();
  }

  _createZoneVisual(zone) {
    const group = new THREE.Group();
    group.name = `HazardZone:${zone.id}`;
    group.userData = { zoneId: zone.id, zoneType: zone.type, floor: zone.floor };

    const riskFillMaterial = new THREE.MeshBasicMaterial({
      color: HAZARD_RISK_COLORS.unknown,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const riskLineMaterial = new THREE.LineBasicMaterial({
      color: HAZARD_RISK_COLORS.unknown,
      transparent: true,
      opacity: 0
    });
    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const visual = {
      zone,
      group,
      riskFillMaterial,
      riskLineMaterial,
      smokeMaterial,
      smokeActive: false,
      globalOnlyParts: [],
      floorParts: [],
      smokeParts: []
    };

    const width = zone.bounds.maxX - zone.bounds.minX;
    const depth = zone.bounds.maxZ - zone.bounds.minZ;
    const centerX = (zone.bounds.minX + zone.bounds.maxX) / 2;
    const centerZ = (zone.bounds.minZ + zone.bounds.maxZ) / 2;

    if (zone.type === ZONE_TYPES.FLOOR) {
      const riskPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        riskFillMaterial
      );
      riskPlane.rotation.x = -Math.PI / 2;
      riskPlane.position.set(centerX, zone.bounds.minY + 0.19, centerZ);
      group.add(riskPlane);

      const outline = new THREE.LineLoop(
        createRectGeometry(zone.bounds, zone.bounds.minY + 0.2),
        riskLineMaterial
      );
      group.add(outline);

      const smokeHeight = 1.4;
      const smoke = new THREE.Mesh(
        new THREE.BoxGeometry(width, smokeHeight, depth),
        smokeMaterial
      );
      smoke.position.set(centerX, zone.bounds.maxY - smokeHeight / 2 - 0.2, centerZ);
      group.add(smoke);
      visual.smokeParts.push(smoke);
    } else if (zone.type === ZONE_TYPES.STAIRWELL) {
      for (const floor of zone.servesFloors || []) {
        const floorBaseY = (floor - 1) * this.floorHeight;
        const outline = new THREE.LineLoop(
          createRectGeometry(zone.bounds, floorBaseY + 0.2),
          riskLineMaterial
        );
        outline.userData = { floor };
        group.add(outline);
        visual.floorParts.push(outline);

        const smokeHeight = Math.max(0.5, this.floorHeight - 0.6);
        const smoke = new THREE.Mesh(
          new THREE.BoxGeometry(width, smokeHeight, depth),
          smokeMaterial
        );
        smoke.position.set(centerX, floorBaseY + this.floorHeight / 2, centerZ);
        smoke.userData = { floor, smoke: true };
        group.add(smoke);
        visual.floorParts.push(smoke);
        visual.smokeParts.push(smoke);
      }

      const height = zone.bounds.maxY - zone.bounds.minY;
      const verticalOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
        riskLineMaterial
      );
      verticalOutline.position.set(centerX, (zone.bounds.minY + zone.bounds.maxY) / 2, centerZ);
      verticalOutline.userData = { globalOnly: true };
      group.add(verticalOutline);
      visual.globalOnlyParts.push(verticalOutline);
    } else {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.1, 32),
        riskFillMaterial
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(centerX, zone.bounds.minY + 0.22, centerZ);
      group.add(ring);

      const outline = new THREE.LineLoop(
        createRectGeometry(zone.bounds, zone.bounds.minY + 0.22),
        riskLineMaterial
      );
      group.add(outline);

      const smoke = new THREE.Mesh(
        new THREE.BoxGeometry(width, zone.bounds.maxY - zone.bounds.minY, depth),
        smokeMaterial
      );
      smoke.position.set(centerX, (zone.bounds.minY + zone.bounds.maxY) / 2, centerZ);
      group.add(smoke);
      visual.smokeParts.push(smoke);
    }

    return visual;
  }

  _createConnectionMarker(connection, zoneA, zoneB) {
    const group = new THREE.Group();
    const anchor = getConnectionAnchor(zoneA, zoneB);
    const floor = getZoneFloor(zoneA) || getZoneFloor(zoneB);

    group.position.set(anchor.x, anchor.y, anchor.z);
    group.userData = { connectionId: connection.id, floor, condition: ROUTE_CONDITIONS.UNKNOWN };

    const material = new THREE.MeshBasicMaterial({
      color: HAZARD_CONNECTION_COLORS[ROUTE_CONDITIONS.UNKNOWN],
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.68, 28), material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    const doubleRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 28), material);
    doubleRing.rotation.x = -Math.PI / 2;
    doubleRing.position.y = 0.02;
    group.add(doubleRing);

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), material);
    post.position.y = 0.5;
    group.add(post);

    const barGeometry = new THREE.BoxGeometry(1.35, 0.04, 0.14);
    const barA = new THREE.Mesh(barGeometry, material);
    barA.position.y = 0.03;
    barA.rotation.y = Math.PI / 4;
    group.add(barA);

    const barB = new THREE.Mesh(barGeometry, material);
    barB.position.y = 0.03;
    barB.rotation.y = -Math.PI / 4;
    group.add(barB);

    const barSingle = new THREE.Mesh(barGeometry, material);
    barSingle.position.y = 0.03;
    barSingle.rotation.y = Math.PI / 4;
    group.add(barSingle);

    return {
      group,
      material,
      ring,
      doubleRing,
      post,
      barA,
      barB,
      barSingle,
      floor,
      condition: ROUTE_CONDITIONS.UNKNOWN
    };
  }

  _applyVisibility() {
    this.group.visible = this.visible;
    const layerVisible = this.visible && this._active;
    const global = isGlobalFloorMode(this.floorMode);
    const targetFloor = parseInt(this.floorMode, 10);

    for (const visual of this.zoneVisuals.values()) {
      const { zone } = visual;

      if (zone.type === ZONE_TYPES.STAIRWELL) {
        visual.group.visible = layerVisible;
        visual.globalOnlyParts.forEach((part) => {
          part.visible = global;
        });
        visual.floorParts.forEach((part) => {
          const floorVisible = global || part.userData.floor === targetFloor;
          part.visible = floorVisible && (!part.userData.smoke || visual.smokeActive);
        });
      } else {
        const floorVisible = global || zone.floor === targetFloor;
        visual.group.visible = layerVisible && floorVisible;
        visual.smokeParts.forEach((part) => {
          part.visible = visual.smokeActive;
        });
      }
    }

    for (const marker of this.connectionMarkers.values()) {
      const floorVisible = global || marker.floor === targetFloor;
      marker.group.visible = layerVisible
        && floorVisible
        && marker.condition !== ROUTE_CONDITIONS.PERMITTED;
    }
  }

  _disposeVisuals() {
    const geometries = new Set();
    const materials = new Set();

    this.group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });

    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    this.zoneVisuals.clear();
    this.connectionMarkers.clear();
  }
}
