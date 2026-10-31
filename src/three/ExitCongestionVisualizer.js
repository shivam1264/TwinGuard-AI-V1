import * as THREE from 'three';
import { HAZARD_RISK_COLORS } from './HazardVisualizer.js';

export const EXIT_LOAD_COLORS = Object.freeze({
  ...HAZARD_RISK_COLORS,
  blocked: 0x64748b
});

const GLOBAL_FLOOR_MODES = new Set(['ALL', 'EXPLODED']);

function isGlobalFloorMode(mode) {
  return GLOBAL_FLOOR_MODES.has(mode);
}

export function computeLiveExitLoads(exits, agents) {
  const loads = new Map();
  (exits || []).forEach((exit) => {
    if (exit?.id) loads.set(exit.id, 0);
  });

  for (const agent of agents || []) {
    if (agent.state === 'SAFE' || !agent.currentExitId) continue;
    if (loads.has(agent.currentExitId)) {
      loads.set(agent.currentExitId, loads.get(agent.currentExitId) + 1);
    }
  }

  return loads;
}

export function resolveExitLoadLevel(load, capacity, isBlocked = false) {
  if (isBlocked) return 'blocked';
  const ratio = capacity > 0 ? load / capacity : 0;
  if (ratio > 1.2) return 'critical';
  if (ratio > 0.85) return 'high';
  if (ratio > 0.6) return 'moderate';
  return 'low';
}

export function resolveEdgeCongestionLevel(occupancy, capacity, status) {
  if (status === 'BLOCKED') return 'blocked';
  const ratio = capacity > 0 ? occupancy / capacity : 0;
  if (ratio > 1.2) return 'critical';
  if (ratio > 0.85) return 'high';
  if (ratio > 0.5) return 'moderate';
  return 'low';
}

export class ExitCongestionVisualizer {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.floorMode = 'ALL';
    this.visible = true;
    this.group = new THREE.Group();
    this.group.name = 'ExitCongestionVisualization';
    this.scene.add(this.group);

    this.exitMarkers = new Map();
    this.edgeVisuals = new Map();
    this._graph = null;
    this._active = false;
  }

  update({ exits = [], agents = null, navigationGraph = null, floorMode } = {}) {
    if (floorMode !== undefined) {
      this.floorMode = floorMode || 'ALL';
    }

    if (navigationGraph && navigationGraph !== this._graph) {
      this._buildEdges(navigationGraph);
    }

    const hasExits = Array.isArray(exits) && exits.length > 0;
    if (!hasExits && !this._graph) {
      this.clear();
      return;
    }

    this._active = true;
    this._syncExitMarkers(hasExits ? exits : []);

    const liveLoads = agents ? computeLiveExitLoads(exits, agents) : null;
    for (const marker of this.exitMarkers.values()) {
      const exit = marker.exit;
      if (!exit) continue;

      const load = liveLoads ? (liveLoads.get(exit.id) || 0) : (exit.load || 0);
      const capacity = exit.capacity || 1;
      const blocked = exit.isBlocked === true
        || (typeof exit.status === 'string' && exit.status.startsWith('BLOCKED'));
      const level = resolveExitLoadLevel(load, capacity, blocked);
      const ratio = Math.min(load / capacity, 1.5);
      const height = 0.4 + ratio * 2.2;

      marker.material.color.setHex(EXIT_LOAD_COLORS[level] ?? EXIT_LOAD_COLORS.unknown);
      marker.material.opacity = blocked ? 0.5 : 0.85;
      marker.bar.scale.y = height;
      marker.bar.position.y = height / 2;
      marker.level = level;
      marker.load = load;
    }

    for (const visual of this.edgeVisuals.values()) {
      const level = resolveEdgeCongestionLevel(
        visual.edge.currentOccupancy || 0,
        visual.edge.capacity || 1,
        visual.edge.status
      );
      visual.material.color.setHex(EXIT_LOAD_COLORS[level] ?? EXIT_LOAD_COLORS.unknown);
      visual.material.opacity = level === 'low'
        ? 0
        : level === 'blocked'
          ? 0.55
          : level === 'moderate'
            ? 0.5
            : 0.85;
      visual.level = level;
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

  _syncExitMarkers(exits) {
    const seen = new Set();

    for (const exit of exits) {
      if (!exit || !exit.id) continue;
      seen.add(exit.id);

      let marker = this.exitMarkers.get(exit.id);
      if (!marker) {
        marker = this._createExitMarker(exit);
        this.exitMarkers.set(exit.id, marker);
        this.group.add(marker.group);
      }

      marker.exit = exit;
      marker.group.position.set(exit.x || 0, 0.25, exit.z || 0);
    }

    for (const [id, marker] of this.exitMarkers) {
      if (!seen.has(id)) {
        marker.exit = null;
      }
    }
  }

  _createExitMarker(exit) {
    const group = new THREE.Group();
    group.name = `ExitCapacity:${exit.id}`;

    const material = new THREE.MeshBasicMaterial({
      color: EXIT_LOAD_COLORS.unknown,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.7, 32), material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1, 0.32), material);
    bar.position.y = 0.5;
    group.add(bar);

    return {
      group,
      material,
      ring,
      bar,
      exit,
      level: 'unknown',
      load: 0
    };
  }

  _buildEdges(graph) {
    this._disposeEdgeVisuals();
    this._graph = graph;

    graph.edges.forEach((edge) => {
      if (edge.id.endsWith('_rev')) return;

      const from = graph.nodes.get(edge.from);
      const to = graph.nodes.get(edge.to);
      if (!from || !to) return;

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.pos.x, from.pos.y + 0.06, from.pos.z),
        new THREE.Vector3(to.pos.x, to.pos.y + 0.06, to.pos.z)
      ]);
      const material = new THREE.LineBasicMaterial({
        color: EXIT_LOAD_COLORS.unknown,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      line.name = `EdgeCongestion:${edge.id}`;
      line.userData = { edgeId: edge.id, floor: edge.floor ?? null };

      this.group.add(line);
      this.edgeVisuals.set(edge.id, {
        edge,
        line,
        material,
        floor: edge.floor ?? null,
        level: 'unknown'
      });
    });
  }

  _applyVisibility() {
    this.group.visible = this.visible;
    const layerVisible = this.visible && this._active;
    const global = isGlobalFloorMode(this.floorMode);
    const targetFloor = parseInt(this.floorMode, 10);

    for (const marker of this.exitMarkers.values()) {
      marker.group.visible = layerVisible
        && !!marker.exit
        && (global || targetFloor === 1);
    }

    for (const visual of this.edgeVisuals.values()) {
      const floorVisible = global || visual.floor === targetFloor;
      visual.line.visible = layerVisible && floorVisible && visual.level !== 'low';
    }
  }

  _disposeEdgeVisuals() {
    for (const visual of this.edgeVisuals.values()) {
      this.group.remove(visual.line);
      visual.line.geometry.dispose();
      visual.material.dispose();
    }
    this.edgeVisuals.clear();
  }

  _disposeVisuals() {
    this._disposeEdgeVisuals();

    for (const marker of this.exitMarkers.values()) {
      this.group.remove(marker.group);
      marker.ring.geometry.dispose();
      marker.bar.geometry.dispose();
      marker.material.dispose();
    }
    this.exitMarkers.clear();
  }
}
