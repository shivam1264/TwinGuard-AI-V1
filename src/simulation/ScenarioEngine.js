// Incident, Hazard & Emergency Scenario Simulation Engine
// Manages multi-point hazards, stairwell failures, corridor smoke plumes, and triggers dynamic rerouting

export const INCIDENT_TYPES = {
  FIRE: 'FIRE_INCIDENT',
  SMOKE_PLUME: 'SMOKE_PLUME',
  STAIRWELL_BLOCKAGE: 'STAIRWELL_BLOCKAGE',
  CORRIDOR_BLOCKAGE: 'CORRIDOR_BLOCKAGE',
  ELEVATOR_SHUTDOWN: 'ELEVATOR_SHUTDOWN',
  EXIT_RESTRICTION: 'EXIT_RESTRICTION'
};

export class ScenarioEngine {
  constructor(navGraph, routeOptimizer) {
    this.navGraph = navGraph;
    this.routeOptimizer = routeOptimizer;

    this.activeIncidents = new Map(); // incidentId -> IncidentObject
    this.incidentLog = [];
    this.onIncidentChangeCallbacks = [];

    // ═══ MULTI-HAZARD TOGGLE MATRIX (mirrors src/ai/ScenarioEngine.js) ═══
    // Centralized hazard schema — single source of truth for the
    // Interactive Multi-Hazard Simulation. Kept identical to the live AI
    // scenario engine so both layers stay consistent.
    this.hazards = {
      fire: false,
      powerGridFailure: false,
      hvacPressurizationFailure: false,
      structuralCollapse: false
    };
    this.hazardZones = { powerGridFailure: [], hvacPressurizationFailure: [], structuralCollapse: [] };
    this.hazardLog = [];
    this.hazardListeners = [];
  }

  onIncidentChange(callback) {
    this.onIncidentChangeCallbacks.push(callback);
  }

  notifyChange() {
    const incidents = Array.from(this.activeIncidents.values());
    this.onIncidentChangeCallbacks.forEach(cb => cb(incidents, this.incidentLog));
  }

  /**
   * Trigger Fire in a Room
   */
  triggerRoomFire(roomId, intensity = 1.0) {
    const incidentId = `fire_${roomId}`;
    const timestamp = new Date().toISOString();

    const incident = {
      id: incidentId,
      type: INCIDENT_TYPES.FIRE,
      roomId,
      intensity,
      timestamp,
      description: `Fire alarm active in room ${roomId} (Intensity: ${Math.round(intensity * 100)}%)`
    };

    this.activeIncidents.set(incidentId, incident);
    this.incidentLog.push({ ...incident, event: 'IGNITION' });

    // Mark room edges as hazardous or blocked
    const roomCenterNode = this.navGraph.nodes.get(`node_${roomId}_center`);
    if (roomCenterNode) {
      this.navGraph.setHazardInZone(
        roomCenterNode.pos.x,
        roomCenterNode.pos.y,
        roomCenterNode.pos.z,
        6.5,
        intensity >= 0.8 ? 1.0 : 0.85
      );
    }

    this.notifyChange();
    return incident;
  }

  /**
   * Trigger Stairwell Structural or Smoke Failure
   */
  blockStairwellCore(coreName, floorNum = null) {
    const isWest = coreName.toLowerCase().includes('west') || coreName.toLowerCase().includes('a');
    const incidentId = `stair_block_${isWest ? 'west' : 'east'}_f${floorNum || 'all'}`;
    const timestamp = new Date().toISOString();

    const incident = {
      id: incidentId,
      type: INCIDENT_TYPES.STAIRWELL_BLOCKAGE,
      coreName: isWest ? 'West Stairwell Core (Stair A)' : 'East Stairwell Core (Stair B)',
      floorNum,
      timestamp,
      description: `Stairwell Core ${isWest ? 'A (West)' : 'B (East)'} completely blocked${floorNum ? ` at Level ${floorNum}` : ''}`
    };

    this.activeIncidents.set(incidentId, incident);
    this.incidentLog.push({ ...incident, event: 'BLOCKED' });

    this.navGraph.blockStairwell(isWest ? 'west' : 'east', floorNum);
    this.notifyChange();
    return incident;
  }

  /**
   * Block a Ground Exit (e.g. debris or external hazard)
   */
  restrictExit(exitId) {
    const incidentId = `exit_restrict_${exitId}`;
    const timestamp = new Date().toISOString();

    const incident = {
      id: incidentId,
      type: INCIDENT_TYPES.EXIT_RESTRICTION,
      exitId,
      timestamp,
      description: `Emergency Exit ${exitId} restricted due to external perimeter safety protocol`
    };

    this.activeIncidents.set(incidentId, incident);
    this.incidentLog.push({ ...incident, event: 'RESTRICTED' });

    // Find and block all edges leading to this exit
    this.navGraph.edges.forEach(edge => {
      if (edge.to.includes(exitId) || edge.from.includes(exitId)) {
        edge.status = 'BLOCKED';
        edge.hazardLevel = 1.0;
      }
    });

    this.notifyChange();
    return incident;
  }

  /**
   * Clear Specific Incident
   */
  clearIncident(incidentId) {
    if (this.activeIncidents.has(incidentId)) {
      const incident = this.activeIncidents.get(incidentId);
      this.activeIncidents.delete(incidentId);
      this.incidentLog.push({ ...incident, event: 'CLEARED', clearedAt: new Date().toISOString() });

      // Rebuild graph hazards
      this.reapplyActiveHazards();
      this.notifyChange();
    }
  }

  /**
   * Clear All Incidents & Reset
   */
  clearAllIncidents() {
    this.activeIncidents.clear();
    this.navGraph.resetAllHazards();
    this.incidentLog.push({
      event: 'SYSTEM_RESET',
      timestamp: new Date().toISOString(),
      description: 'All active hazards, fires, and blockages extinguished'
    });
    this.notifyChange();
  }

  reapplyActiveHazards() {
    this.navGraph.resetAllHazards();

    this.activeIncidents.forEach(incident => {
      if (incident.type === INCIDENT_TYPES.FIRE) {
        const roomCenterNode = this.navGraph.nodes.get(`node_${incident.roomId}_center`);
        if (roomCenterNode) {
          this.navGraph.setHazardInZone(
            roomCenterNode.pos.x,
            roomCenterNode.pos.y,
            roomCenterNode.pos.z,
            6.5,
            incident.intensity >= 0.8 ? 1.0 : 0.85
          );
        }
      } else if (incident.type === INCIDENT_TYPES.STAIRWELL_BLOCKAGE) {
        const isWest = incident.coreName.includes('West') || incident.coreName.includes('A');
        this.navGraph.blockStairwell(isWest ? 'west' : 'east', incident.floorNum);
      }
    });
  }

  getActiveIncidents() {
    return Array.from(this.activeIncidents.values());
  }

  // ══════════════════════════════════════════════════════════════════════
  // MULTI-HAZARD STATE MANAGEMENT (schema mirror of src/ai/ScenarioEngine)
  // Toggles are idempotent, independently reversible, and emit consistent
  // scenario updates to all subscribed UI components.
  // ══════════════════════════════════════════════════════════════════════

  onHazardChange(callback) {
    if (typeof callback !== 'function') return () => {};
    this.hazardListeners.push(callback);
    return () => {
      const idx = this.hazardListeners.indexOf(callback);
      if (idx >= 0) this.hazardListeners.splice(idx, 1);
    };
  }

  getHazardState() {
    return { ...this.hazards, zones: { powerGridFailure: [...this.hazardZones.powerGridFailure], hvacPressurizationFailure: [...this.hazardZones.hvacPressurizationFailure], structuralCollapse: [...this.hazardZones.structuralCollapse] } };
  }

  getHazardLog() {
    return this.hazardLog.slice();
  }

  setHazardState(partial = {}) {
    Object.keys(this.hazards).forEach((key) => {
      if (typeof partial[key] === 'boolean') this.hazards[key] = partial[key];
    });
    this._notifyHazardChange(null);
    return this.getHazardState();
  }

  _commitHazard(key, enabled, meta = {}) {
    if (this.hazards[key] === enabled) {
      return this.getHazardState(); // idempotent no-op
    }
    this.hazards[key] = enabled;

    const event = {
      id: `hz_${key}_${enabled ? 'on' : 'off'}_${Date.now()}`,
      hazard: key,
      enabled,
      severity: meta.severity || (enabled ? 'High' : 'Resolved'),
      location: meta.location || 'Building-wide',
      floor: typeof meta.floor === 'number' ? meta.floor : null,
      message: enabled ? meta.onMessage : meta.offMessage,
      timestamp: Date.now()
    };
    this.hazardLog.unshift(event);
    if (this.hazardLog.length > 200) this.hazardLog.length = 200;

    this._notifyHazardChange(event);
    return this.getHazardState();
  }

  _notifyHazardChange(event) {
    const state = this.getHazardState();
    this.hazardListeners.forEach((cb) => {
      try {
        cb(state, event);
      } catch (err) {
        // isolated listener failure
      }
    });
  }

  toggleFire(enabled) {
    return this._commitHazard('fire', enabled, {
      severity: enabled ? 'Critical' : 'Resolved',
      onMessage: 'Fire plume ignited — thermal & toxic smoke simulation active.',
      offMessage: 'Fire plume suppressed. Smoke dissipation restored.'
    });
  }

  togglePowerFailure(enabled, location = null) {
    return this._commitHazard('powerGridFailure', enabled, {
      severity: enabled ? 'High' : 'Resolved',
      location: location ? (location.shortName || location.id) : 'Building-wide',
      onMessage: 'Main grid failure detected. Emergency lighting activated.',
      offMessage: 'Main grid restored. Standard facility lighting resumed.'
    });
  }

  toggleHvacFailure(enabled, location = null) {
    return this._commitHazard('hvacPressurizationFailure', enabled, {
      severity: enabled ? 'High' : 'Resolved',
      location: location ? (location.shortName || location.id) : 'Building-wide',
      onMessage: 'Stairwell pressurization lost. Toxic smoke propagation increased.',
      offMessage: 'Stairwell pressurization fans back online. Smoke propagation normalized.'
    });
  }

  toggleStructuralCollapse(enabled, location = null) {
    const corridorId = location && location.id ? location.id : 'C101';
    return this._commitHazard('structuralCollapse', enabled, {
      severity: enabled ? 'Critical' : 'Resolved',
      location: location ? (location.shortName || corridorId) : `Corridor ${corridorId}, Level 4`,
      floor: location ? (Number(location.floor) || 4) : 4,
      onMessage: `Structural debris detected. West Stair Core connection blocked.`,
      offMessage: `Structure restored. West Stair Core connection reopened.`
    });
  }

  resetHazards() {
    this.hazards = {
      fire: false,
      powerGridFailure: false,
      hvacPressurizationFailure: false,
      structuralCollapse: false
    };
    this.hazardZones = { powerGridFailure: [], hvacPressurizationFailure: [], structuralCollapse: [] };
    this._notifyHazardChange(null);
    return this.getHazardState();
  }
}

