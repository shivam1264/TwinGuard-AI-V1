import { BuildingGraph, loadBuilding } from './BuildingGraph.js';
import { NavGrid } from './NavGrid.js';

export const ZONE_MAPPING_POLICY = Object.freeze({
  CELL_CENTER: 'cell_center',
  CELL_OVERLAP: 'cell_overlap'
});

export const DEFAULT_ZONE_MAPPING_CONFIG = Object.freeze({
  policy: ZONE_MAPPING_POLICY.CELL_CENTER,
  fire: {
    coreRadiusM: 2.8,
    costRadiusM: 5.5,
    coreCostMultiplier: 1000,
    costPerMeter: 35
  },
  smoke: {
    costPerDensity: 50,
    maxCost: 200
  },
  unknownHazardCost: 50,
  prohibitedCost: 10000
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class ZoneToGridMapper {
  constructor(navGrid, config = {}) {
    this.navGrid = navGrid;
    this.config = { ...DEFAULT_ZONE_MAPPING_CONFIG, ...config };
    this._zoneCellCache = new Map();
  }

  getZoneCells(zone) {
    const cacheKey = zone.id;
    if (this._zoneCellCache.has(cacheKey)) {
      return this._zoneCellCache.get(cacheKey);
    }

    const cells = this._computeZoneCells(zone);
    this._zoneCellCache.set(cacheKey, cells);
    return cells;
  }

  _computeZoneCells(zone) {
    if (!zone.bounds) {
      return [];
    }

    const { minX, maxX, minZ, maxZ } = zone.bounds;
    const cells = [];

    if (this.config.policy === 'cell_overlap') {
      const min = this.navGrid.worldToGrid(minX, minZ);
      const max = this.navGrid.worldToGrid(maxX, maxZ);
      
      for (let r = min.r; r <= max.r; r++) {
        for (let c = min.c; c <= max.c; c++) {
          if (r >= 0 && r < this.navGrid.rows && c >= 0 && c < this.navGrid.cols) {
            cells.push({ c, r });
          }
        }
      }
    } else {
      const min = this.navGrid.worldToGrid(minX, minZ);
      const max = this.navGrid.worldToGrid(maxX, maxZ);
      
      for (let r = min.r; r <= max.r; r++) {
        for (let c = min.c; c <= max.c; c++) {
          if (r >= 0 && r < this.navGrid.rows && c >= 0 && c < this.navGrid.cols) {
            const world = this.navGrid.gridToWorld(c, r);
            if (world.x >= minX && world.x <= maxX && world.z >= minZ && world.z <= maxZ) {
              cells.push({ c, r });
            }
          }
        }
      }
    }

    return cells;
  }

  applyFireHazard(zone, intensity = 1.0) {
    const cells = this.getZoneCells(zone);
    const { coreRadiusM, costRadiusM, coreCostMultiplier, costPerMeter } = this.config.fire;
    
    for (const { c, r } of cells) {
      const world = this.navGrid.gridToWorld(c, r);
      const zoneCenterX = (this._getZoneMinX(zone) + this._getZoneMaxX(zone)) / 2;
      const zoneCenterZ = (this._getZoneMinZ(zone) + this._getZoneMaxZ(zone)) / 2;
      const dist = Math.hypot(world.x - zoneCenterX, world.z - zoneCenterZ);
      
      if (dist <= coreRadiusM) {
        this.navGrid.grid[r][c] = 1;
        this.navGrid.blockedStatic[r][c] = false;
        this.navGrid.hazardCosts[r][c] = coreCostMultiplier * intensity;
      } else if (dist <= costRadiusM) {
        if (this.navGrid.grid[r][c] !== 1 || !this.navGrid.blockedStatic[r][c]) {
          this.navGrid.hazardCosts[r][c] = Math.max(
            this.navGrid.hazardCosts[r][c] || 0,
            (costRadiusM - dist) * costPerMeter * intensity
          );
        }
      }
    }
  }

  applySmokeHazard(zone, density) {
    const cells = this.getZoneCells(zone);
    const { costPerDensity, maxCost } = this.config.smoke;
    const cost = clamp(density * costPerDensity, 0, maxCost);
    
    for (const { c, r } of cells) {
      if (this.navGrid.grid[r][c] !== 1 || !this.navGrid.blockedStatic[r][c]) {
        this.navGrid.hazardCosts[r][c] = Math.max(
          this.navGrid.hazardCosts[r][c] || 0,
          cost
        );
      }
    }
  }

  applyProhibitedZone(zone) {
    const cells = this.getZoneCells(zone);
    const cost = this.config.prohibitedCost;
    
    for (const { c, r } of cells) {
      if (!this.navGrid.blockedStatic[r][c]) {
        this.navGrid.grid[r][c] = 1;
        this.navGrid.hazardCosts[r][c] = this.config.prohibitedCost;
      }
    }
  }

  applyProhibitedConnection(zoneA, zoneB) {
    // Block only the corridor/doorway between two zones
    // Find overlapping region between zone bounds
    const overlapMinX = Math.max(this._getZoneMinX(zoneA), this._getZoneMinX(zoneB));
    const overlapMaxX = Math.min(this._getZoneMaxX(zoneA), this._getZoneMaxX(zoneB));
    const overlapMinZ = Math.max(this._getZoneMinZ(zoneA), this._getZoneMinZ(zoneB));
    const overlapMaxZ = Math.min(this._getZoneMaxZ(zoneA), this._getZoneMaxZ(zoneB));
    
    if (overlapMinX >= overlapMaxX || overlapMinZ >= overlapMaxZ) {
      // No overlap - try extended doorway search
      this._applyProhibitedDoorway(zoneA, zoneB);
      return;
    }
    
    const cost = this.config.prohibitedCost;
    
    for (let r = 0; r < this.navGrid.rows; r++) {
      for (let c = 0; c < this.navGrid.cols; c++) {
        if (this.navGrid.blockedStatic[r][c]) continue;
        
        const world = this.navGrid.gridToWorld(c, r);
        if (world.x >= overlapMinX && world.x <= overlapMaxX &&
            world.z >= overlapMinZ && world.z <= overlapMaxZ) {
          this.navGrid.grid[r][c] = 1;
          this.navGrid.hazardCosts[r][c] = cost;
        }
      }
    }
  }

  _applyProhibitedDoorway(zoneA, zoneB) {
    // For stairwell connections, block the doorway at the stairwell entrance
    const stairwell = zoneA.type === 'stairwell' ? zoneA : (zoneB.type === 'stairwell' ? zoneB : null);
    const floor = zoneA.type === 'floor' ? zoneA : (zoneB.type === 'floor' ? zoneB : null);
    
    if (!stairwell || !floor) return;
    
    // Stairwell cores are at x = -28 (west) or x = 28 (east), spanning z from -STAIR_HALF_DEPTH_M to STAIR_HALF_DEPTH_M
    // Floor spans entire floor plate. The doorway is at the stairwell x position, spanning the stairwell depth.
    const cost = this.config.prohibitedCost;
    const stairMinX = stairwell.bounds.minX;
    const stairMaxX = stairwell.bounds.maxX;
    const stairMinZ = stairwell.bounds.minZ;
    const stairMaxZ = stairwell.bounds.maxZ;
    
    // Block a small region at the stairwell entrance on the floor
    const doorwayMinX = Math.max(floor.bounds.minX, stairMinX - 1);
    const doorwayMaxX = Math.min(floor.bounds.maxX, stairMaxX + 1);
    const doorwayMinZ = Math.max(floor.bounds.minZ, stairMinZ);
    const doorwayMaxZ = Math.min(floor.bounds.maxZ, stairMaxZ);
    
    for (let r = 0; r < this.navGrid.rows; r++) {
      for (let c = 0; c < this.navGrid.cols; c++) {
        if (this.navGrid.blockedStatic[r][c]) continue;
        
        const world = this.navGrid.gridToWorld(c, r);
        if (world.x >= doorwayMinX && world.x <= doorwayMaxX &&
            world.z >= doorwayMinZ && world.z <= doorwayMaxZ) {
          this.navGrid.grid[r][c] = 1;
          this.navGrid.hazardCosts[r][c] = cost;
        }
      }
    }
  }

  applyRestrictedZone(zone, costMultiplier = 10) {
    const cells = this.getZoneCells(zone);
    const cost = this.config.fire.costPerMeter * costMultiplier;
    
    for (const { c, r } of cells) {
      if (this.navGrid.grid[r][c] !== 1 || !this.navGrid.blockedStatic[r][c]) {
        this.navGrid.hazardCosts[r][c] = Math.max(
          this.navGrid.hazardCosts[r][c] || 0,
          cost
        );
      }
    }
  }

  applyUnknownHazard(zone) {
    const cells = this.getZoneCells(zone);
    const cost = this.config.unknownHazardCost;
    
    for (const { c, r } of cells) {
      if (this.navGrid.grid[r][c] !== 1 || !this.navGrid.blockedStatic[r][c]) {
        this.navGrid.hazardCosts[r][c] = Math.max(
          this.navGrid.hazardCosts[r][c] || 0,
          cost
        );
      }
    }
  }

  applyInteractiveFireHazard(roomCenterX, roomCenterZ, elapsedSec, roomSpreadSec, intensity = 1.0) {
    const { coreRadiusM, costRadiusM, coreCostMultiplier, costPerMeter } = this.config.fire;
    
    if (roomSpreadSec <= 0) {
      // Instant full floor - delegate to zone-based fire
      return;
    }
    
    // Calculate growing radius: starts at coreRadiusM, expands to cover floor over roomSpreadSec
    const floorRadiusM = 30; // Approximate floor half-width
    const maxRadius = Math.max(costRadiusM, floorRadiusM);
    const radius = coreRadiusM + (maxRadius - coreRadiusM) * Math.min(elapsedSec / roomSpreadSec, 1);
    
    // Apply to all grid cells within radius of room center
    for (let r = 0; r < this.navGrid.rows; r++) {
      for (let c = 0; c < this.navGrid.cols; c++) {
        if (this.navGrid.blockedStatic[r][c]) continue;
        
        const world = this.navGrid.gridToWorld(c, r);
        const dist = Math.hypot(world.x - roomCenterX, world.z - roomCenterZ);
        
        if (dist <= radius) {
          if (dist <= coreRadiusM) {
            this.navGrid.grid[r][c] = 1;
            this.navGrid.blockedStatic[r][c] = false;
            this.navGrid.hazardCosts[r][c] = Math.max(
              this.navGrid.hazardCosts[r][c] || 0,
              coreCostMultiplier * intensity
            );
          } else if (dist <= costRadiusM) {
            this.navGrid.hazardCosts[r][c] = Math.max(
              this.navGrid.hazardCosts[r][c] || 0,
              (costRadiusM - dist) * costPerMeter * intensity
            );
          } else if (dist <= radius) {
            // Extended radius beyond costRadiusM during ramp-up
            const extendedCost = (radius - dist) * costPerMeter * intensity * 0.5;
            this.navGrid.hazardCosts[r][c] = Math.max(
              this.navGrid.hazardCosts[r][c] || 0,
              extendedCost
            );
          }
        }
      }
    }
  }

  clearZoneHazards(zone, preserveStatic = true) {
    const cells = this.getZoneCells(zone);
    
    for (const { c, r } of cells) {
      if (preserveStatic && this.navGrid.blockedStatic[r][c]) {
        continue;
      }
      this.navGrid.grid[r][c] = 0;
      this.navGrid.hazardCosts[r][c] = 0;
    }
  }

  clearAllDynamicHazards() {
    this.navGrid.resetDynamicHazards();
    this._zoneCellCache.clear();
  }

  _getZoneMinX(zone) { return zone.bounds?.minX ?? -30; }
  _getZoneMaxX(zone) { return zone.bounds?.maxX ?? 30; }
  _getZoneMinZ(zone) { return zone.bounds?.minZ ?? -24; }
  _getZoneMaxZ(zone) { return zone.bounds?.maxZ ?? 24; }

  getMappedZones() {
    return Array.from(this._zoneCellCache.keys());
  }
}

export function createZoneToGridMapper(navGrid, config) {
  return new ZoneToGridMapper(navGrid, config);
}

export function applyHazardStateToGrid(mapper, hazardState, buildingGraph, config) {
  if (!hazardState || !hazardState.zones) {
    return { applied: 0, skipped: 0, errors: ['Invalid hazard state'] };
  }

  const building = buildingGraph instanceof BuildingGraph ? buildingGraph : loadBuilding(buildingGraph);
  let applied = 0;
  let skipped = 0;
  const errors = [];

  for (const [zoneId, zoneState] of Object.entries(hazardState.zones)) {
    const zone = building.data.zones.find(z => z.id === zoneId);
    if (!zone) {
      skipped++;
      continue;
    }

    try {
      const fire = zoneState.fire;
      const smoke = zoneState.smoke;
      const connectionStatus = hazardState.connections;

      if (fire && fire.source === 'interactive' && fire.originRoom) {
        // Room-origin interactive fire - apply growing radius from room center
        const roomCenterX = fire.originRoomCenterX ?? 0;
        const roomCenterZ = fire.originRoomCenterZ ?? 0;
        const elapsedSec = hazardState.timeSec - (fire.startSec ?? hazardState.timeSec);
        mapper.applyInteractiveFireHazard(roomCenterX, roomCenterZ, elapsedSec, fire.roomSpreadSec ?? 0, fire.intensity);
        applied++;
      } else if (fire && fire.status === 'active' && fire.intensity > 0) {
        mapper.applyFireHazard(zone, fire.intensity);
        applied++;
      } else if (fire && fire.status === 'pending') {
        mapper.applyRestrictedZone(zone);
        applied++;
      } else if (fire && fire.status === 'unknown') {
        mapper.applyUnknownHazard(zone);
        applied++;
      }

      if (smoke && smoke.status === 'active' && smoke.density > 0) {
        mapper.applySmokeHazard(zone, smoke.density);
        applied++;
      }

      if (connectionStatus) {
        for (const [connId, connState] of Object.entries(connectionStatus)) {
          if (connState.routeStatus === 'prohibited') {
            const conn = building.data.connections.find(c => c.id === connId);
            if (conn) {
              const zoneA = building.data.zones.find(z => z.id === conn.a);
              const zoneB = building.data.zones.find(z => z.id === conn.b);
              if (zoneA && zoneB) {
                mapper.applyProhibitedConnection(zoneA, zoneB);
                applied++;
              }
            }
          }
        }
      }
    } catch (e) {
      errors.push(`Zone ${zoneId}: ${e.message}`);
      skipped++;
    }
  }

  return { applied, skipped, errors };
}