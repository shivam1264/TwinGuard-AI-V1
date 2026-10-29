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
}
