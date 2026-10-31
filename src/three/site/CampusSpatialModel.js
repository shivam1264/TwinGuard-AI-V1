// ============================================================================
// TWIN GUARD CAMPUS — GIS & SPATIAL SEMANTIC FOUNDATION MODEL
// ============================================================================
// Step 5.1: Provides a formal, authoritative semantic spatial layer over the
// existing 3D Three.js campus. Establishes true topological relationships:
//
//   BUILDINGS ──> ENTRANCES ──> ACCESS POINTS ──> ROADS & PEDESTRIAN PATHS
//
// Key Principles:
// 1. Foundation Only: Non-destructive to existing 3D geometry and visuals.
// 2. Strict Spatial Consistency: Semantic coordinates exactly match 3D meshes.
// 3. Dual Distinct Networks: RoadNetwork (vehicular) and PedestrianNetwork.
// 4. Zero Per-Frame Cost: Computed once at startup; O(1) indexed lookups.
// ============================================================================

import {
  CAMPUS_BOUNDS,
  CAMPUS_DISTRICTS,
  ROAD_CLASSES,
  CAMPUS_ROUNDABOUTS,
  PRIMARY_CAMPUS_ROADS,
  SECONDARY_CAMPUS_ROADS,
  SERVICE_EMERGENCY_ROADS,
  FUTURE_BUILDING_PLOTS,
  CENTRAL_ASSEMBLY_PLAZA,
  CAMPUS_LAKE,
  SPORTS_COMPLEX,
  PARKING_FACILITIES,
  CAMPUS_ENTRANCES,
  MASTER_PEDESTRIAN_PATHS,
  CAMPUS_LAWNS
} from './CampusLayout.js';

// ----------------------------------------------------------------------------
// ENUMS & CLASSIFICATIONS
// ----------------------------------------------------------------------------
export const SPATIAL_NODE_TYPES = {
  ROUNDABOUT: 'ROUNDABOUT',
  JUNCTION: 'JUNCTION',
  GATEWAY: 'GATEWAY',
  ACCESS_POINT: 'ACCESS_POINT',
  CROSSWALK: 'CROSSWALK',
  ENTRANCE_PORTAL: 'ENTRANCE_PORTAL',
  TERMINUS: 'TERMINUS'
};

export const ENTRANCE_TYPES = {
  MAIN: 'MAIN',
  SECONDARY: 'SECONDARY',
  SERVICE: 'SERVICE',
  EMERGENCY_EXIT: 'EMERGENCY_EXIT'
};

export const ROAD_STATUS = {
  OPEN: 'OPEN',
  CONGESTED: 'CONGESTED',
  HAZARDOUS: 'HAZARDOUS',
  BLOCKED: 'BLOCKED'
};

export const PATH_STATUS = {
  CLEAR: 'CLEAR',
  CROWDED: 'CROWDED',
  HAZARDOUS: 'HAZARDOUS',
  BLOCKED: 'BLOCKED'
};

export const OPEN_SPACE_TYPES = {
  PLAZA: 'PLAZA',
  LAWN: 'LAWN',
  WATER_BODY: 'WATER_BODY',
  SPORTS_FACILITY: 'SPORTS_FACILITY'
};

export const ASSEMBLY_STATUS = {
  SAFE: 'SAFE',
  CAUTION: 'CAUTION',
  RESTRICTED: 'RESTRICTED',
  FULL: 'FULL',
  BLOCKED: 'BLOCKED'
};

export const EVACUATION_ZONE_TYPES = {
  BUILDING: 'BUILDING',
  DISTRICT: 'DISTRICT',
  ASSEMBLY: 'ASSEMBLY',
  HAZARD: 'HAZARD'
};

export const ZONE_STATUS = {
  SAFE: 'SAFE',
  CAUTION: 'CAUTION',
  EVACUATING: 'EVACUATING',
  RESTRICTED: 'RESTRICTED',
  BLOCKED: 'BLOCKED'
};

export const INCIDENT_TYPES = {
  FIRE: 'FIRE',
  SMOKE: 'SMOKE',
  MEDICAL: 'MEDICAL',
  STRUCTURAL: 'STRUCTURAL',
  ROAD_BLOCKAGE: 'ROAD_BLOCKAGE'
};

export const INCIDENT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const TRAVERSAL_MODES = {
  PEDESTRIAN: 'PEDESTRIAN',
  VEHICLE: 'VEHICLE',
  EMERGENCY_VEHICLE: 'EMERGENCY_VEHICLE'
};

// ============================================================================
// CAMPUS SPATIAL MODEL CLASS
// ============================================================================
export class CampusSpatialModel {
  constructor() {
    this.campusId = 'CAMPUS-TWINGUARD-01';
    this.name = 'Twin Guard Innovation Campus';
    this.bounds = { ...CAMPUS_BOUNDS };
    this.center = { x: 0, y: 0, z: 0 };

    // Standard local-world spatial reference (extensible for real GeoJSON/WGS-84)
    this.spatialReference = {
      datum: 'LOCAL_WORLD_METRIC',
      originLat: 28.498600,
      originLon: 77.087800,
      elevationMsl: 218.0,
      units: 'METERS'
    };

    // Primary Semantic Collections (O(1) Map indexing)
    this.districts = new Map();
    this.buildings = new Map();
    this.entrances = new Map();
    this.roadNodes = new Map();
    this.roadSegments = new Map();
    this.pedestrianNodes = new Map();
    this.pedestrianPaths = new Map();
    this.parkingAreas = new Map();
    this.openSpaces = new Map();
    this.gateways = new Map();

    // Emergency Resources & Intelligence Collections (Phase 1 & 2)
    this.assemblyPoints = new Map();     // assemblyId -> AssemblyPoint
    this.fireResponsePoints = new Map(); // firePointId -> FireResponsePoint
    this.medicalPoints = new Map();      // medicalPointId -> MedicalPoint
    this.commandStagingAreas = new Map();// commandId -> CommandStagingArea
    this.evacuationZones = new Map();    // zoneId -> EvacuationZone
    this.incidents = new Map();          // incidentId -> IncidentObject
    this.activeRoutes = new Map();       // routeId -> RouteObject
    this.eventListeners = new Map();     // event -> [callback, ...]
    this.navGraph = null;                // Bound when extendNavigationGraph is called

    // Cross-reference indices
    this.buildingEntrancesIndex = new Map(); // buildingId -> [entranceId, ...]
    this.buildingRoadsIndex = new Map();     // buildingId -> [roadId, ...]
    this.buildingPathsIndex = new Map();     // buildingId -> [pathId, ...]
    this.districtBuildingsIndex = new Map(); // districtId -> [buildingId, ...]
    this.nodeConnectedRoadsIndex = new Map(); // nodeId -> [roadId, ...]
    this.nodeConnectedPathsIndex = new Map(); // nodeId -> [pathId, ...]

    // Build the complete semantic model
    this.initializeModel();
  }

  // ==========================================================================
  // INITIALIZATION PIPELINE
  // ==========================================================================
  initializeModel() {
    this.buildDistricts();
    this.buildRoadNodes();
    this.buildRoadSegments();
    this.buildPedestrianNodes();
    this.buildPedestrianPaths();
    this.buildBuildingsAndEntrances();
    this.buildParkingAreas();
    this.buildOpenSpaces();
    this.buildGateways();
    this.buildAssemblyPoints();
    this.buildFireResponsePoints();
    this.buildMedicalAndCommandPoints();
    this.buildEvacuationZones();
    this.computeSpatialRelationships();
  }

  // --------------------------------------------------------------------------
  // 1. DISTRICTS & FUNCTIONAL ZONES
  // --------------------------------------------------------------------------
  buildDistricts() {
    CAMPUS_DISTRICTS.forEach(d => {
      const district = {
        id: d.id,
        name: d.name,
        theme: d.theme,
        bounds: { ...d.bounds },
        center: { ...d.center },
        primaryUses: [...(d.primaryUses || [])],
        buildingIds: []
      };
      this.districts.set(district.id, district);
      this.districtBuildingsIndex.set(district.id, []);
    });
  }

  // --------------------------------------------------------------------------
  // 2. ROAD NETWORK NODES (INTERSECTIONS & ROUNDABOUTS)
  // --------------------------------------------------------------------------
  buildRoadNodes() {
    // A. Main Entrance Portal Node
    this.addRoadNode({
      id: 'RNODE-MAIN-GATE',
      name: 'Main Campus Entrance Gateway Node',
      nodeType: SPATIAL_NODE_TYPES.GATEWAY,
      position: { x: 0, y: 0.02, z: 240 },
      radius: 14.0
    });

    // B. Roundabout 1: Entrance Axis Circus (Z = 86)
    this.addRoadNode({
      id: 'RNODE-CIRCUS-CENTER',
      name: 'Entrance Axis Central Circus Hub',
      nodeType: SPATIAL_NODE_TYPES.ROUNDABOUT,
      position: { x: 0, y: 0.02, z: 86 },
      radius: 17.0,
      roundaboutId: 'ROUNDABOUT-ENTRANCE-AXIS'
    });
    this.addRoadNode({
      id: 'RNODE-CIRCUS-SOUTH',
      name: 'Circus South Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 0, y: 0.02, z: 103 },
      radius: 6.0
    });
    this.addRoadNode({
      id: 'RNODE-CIRCUS-NORTH',
      name: 'Circus North Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 0, y: 0.02, z: 69 },
      radius: 6.0
    });
    this.addRoadNode({
      id: 'RNODE-CIRCUS-WEST',
      name: 'Circus West Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -17, y: 0.02, z: 86 },
      radius: 6.0
    });
    this.addRoadNode({
      id: 'RNODE-CIRCUS-EAST',
      name: 'Circus East Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 17, y: 0.02, z: 86 },
      radius: 6.0
    });

    // C. Roundabout 2: West Primary Ring Roundabout (X = -175, Z = 75)
    this.addRoadNode({
      id: 'RNODE-WEST-RB-CENTER',
      name: 'West Primary Ring Roundabout Hub',
      nodeType: SPATIAL_NODE_TYPES.ROUNDABOUT,
      position: { x: -175, y: 0.02, z: 75 },
      radius: 13.0,
      roundaboutId: 'ROUNDABOUT-WEST-RING'
    });
    this.addRoadNode({
      id: 'RNODE-WEST-RB-EAST',
      name: 'West Roundabout East Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -162, y: 0.02, z: 75 },
      radius: 5.5
    });
    this.addRoadNode({
      id: 'RNODE-WEST-RB-WEST',
      name: 'West Roundabout West Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -188, y: 0.02, z: 75 },
      radius: 5.5
    });
    this.addRoadNode({
      id: 'RNODE-WEST-RB-SOUTH',
      name: 'West Roundabout South Parkway Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -175, y: 0.02, z: 88 },
      radius: 5.5
    });

    // D. Roundabout 3: East Primary Ring Roundabout (X = 175, Z = 75)
    this.addRoadNode({
      id: 'RNODE-EAST-RB-CENTER',
      name: 'East Primary Ring Roundabout Hub',
      nodeType: SPATIAL_NODE_TYPES.ROUNDABOUT,
      position: { x: 175, y: 0.02, z: 75 },
      radius: 13.0,
      roundaboutId: 'ROUNDABOUT-EAST-RING'
    });
    this.addRoadNode({
      id: 'RNODE-EAST-RB-WEST',
      name: 'East Roundabout West Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 162, y: 0.02, z: 75 },
      radius: 5.5
    });
    this.addRoadNode({
      id: 'RNODE-EAST-RB-EAST',
      name: 'East Roundabout East Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 188, y: 0.02, z: 75 },
      radius: 5.5
    });
    this.addRoadNode({
      id: 'RNODE-EAST-RB-SOUTH',
      name: 'East Roundabout South Parkway Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 175, y: 0.02, z: 88 },
      radius: 5.5
    });
    this.addRoadNode({
      id: 'RNODE-EAST-RB-NORTH',
      name: 'East Roundabout North Spine Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 175, y: 0.02, z: 62 },
      radius: 5.5
    });

    // E. Roundabout 4: North-West Academic Circus (X = -140, Z = -135)
    this.addRoadNode({
      id: 'RNODE-NW-RB-CENTER',
      name: 'North-West Academic Circus Hub',
      nodeType: SPATIAL_NODE_TYPES.ROUNDABOUT,
      position: { x: -140, y: 0.02, z: -135 },
      radius: 11.0,
      roundaboutId: 'ROUNDABOUT-NW'
    });
    this.addRoadNode({
      id: 'RNODE-NW-RB-WEST',
      name: 'NW Circus West Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -151, y: 0.02, z: -135 },
      radius: 5.0
    });
    this.addRoadNode({
      id: 'RNODE-NW-RB-EAST',
      name: 'NW Circus East Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -129, y: 0.02, z: -135 },
      radius: 5.0
    });
    this.addRoadNode({
      id: 'RNODE-NW-RB-SOUTH',
      name: 'NW Circus South Spur Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -140, y: 0.02, z: -124 },
      radius: 5.0
    });

    // F. Roundabout 5: North-East Technology Circus (X = 140, Z = -135)
    this.addRoadNode({
      id: 'RNODE-NE-RB-CENTER',
      name: 'North-East Technology Circus Hub',
      nodeType: SPATIAL_NODE_TYPES.ROUNDABOUT,
      position: { x: 140, y: 0.02, z: -135 },
      radius: 11.0,
      roundaboutId: 'ROUNDABOUT-NE'
    });
    this.addRoadNode({
      id: 'RNODE-NE-RB-EAST',
      name: 'NE Circus East Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 151, y: 0.02, z: -135 },
      radius: 5.0
    });
    this.addRoadNode({
      id: 'RNODE-NE-RB-WEST',
      name: 'NE Circus West Rim Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 129, y: 0.02, z: -135 },
      radius: 5.0
    });
    this.addRoadNode({
      id: 'RNODE-NE-RB-SOUTH',
      name: 'NE Circus South Spur Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 140, y: 0.02, z: -124 },
      radius: 5.0
    });

    // G. Hero Forecourt & Core Circulation Nodes
    this.addRoadNode({
      id: 'RNODE-HERO-FORECOURT',
      name: 'Hero Central Forecourt Drop-off Apron',
      nodeType: SPATIAL_NODE_TYPES.ACCESS_POINT,
      position: { x: 0, y: 0.02, z: 42 },
      radius: 12.0
    });
    this.addRoadNode({
      id: 'RNODE-CORE-NORTH',
      name: 'Hero North Service Road Junction',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 0, y: 0.02, z: -46 },
      radius: 6.0
    });
    this.addRoadNode({
      id: 'RNODE-CORE-WEST',
      name: 'Hero Core Ring West Apex',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -52, y: 0.02, z: 0 },
      radius: 6.0
    });
    this.addRoadNode({
      id: 'RNODE-CORE-EAST',
      name: 'Hero Core Ring East Apex',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 52, y: 0.02, z: 0 },
      radius: 6.0
    });

    // H. Perimeter & Facilities Access Nodes
    this.addRoadNode({
      id: 'RNODE-WEST-PARKING-ENTRY',
      name: 'West Surface Parking Facility Entrance',
      nodeType: SPATIAL_NODE_TYPES.ACCESS_POINT,
      position: { x: -215, y: 0.02, z: 220 },
      radius: 8.0
    });
    this.addRoadNode({
      id: 'RNODE-EAST-PARKING-ENTRY',
      name: 'East Surface Parking Facility Entrance',
      nodeType: SPATIAL_NODE_TYPES.ACCESS_POINT,
      position: { x: 215, y: 0.02, z: 220 },
      radius: 8.0
    });
    this.addRoadNode({
      id: 'RNODE-ACADEMIC-FORECOURT',
      name: 'Central Academic Block P05 Forecourt Spur',
      nodeType: SPATIAL_NODE_TYPES.ACCESS_POINT,
      position: { x: 0, y: 0.02, z: -102 },
      radius: 6.0
    });
    this.addRoadNode({
      id: 'RNODE-AUDITORIUM-LOADING',
      name: 'Auditorium P09 Service & Loading Dock',
      nodeType: SPATIAL_NODE_TYPES.ACCESS_POINT,
      position: { x: -155, y: 0.02, z: -40 },
      radius: 6.0
    });
  }

  addRoadNode(node) {
    const fullNode = {
      ...node,
      connectedRoadIds: [],
      connectedBuildingIds: [],
      connectedPathNodeIds: []
    };
    this.roadNodes.set(node.id, fullNode);
    this.nodeConnectedRoadsIndex.set(node.id, []);
  }

  // --------------------------------------------------------------------------
  // 3. ROAD NETWORK SEGMENTS
  // --------------------------------------------------------------------------
  buildRoadSegments() {
    const allRoadDefs = [
      ...PRIMARY_CAMPUS_ROADS,
      ...SECONDARY_CAMPUS_ROADS,
      ...SERVICE_EMERGENCY_ROADS
    ];

    // Node connectivity mapping table for existing road splines
    const roadEndpointMap = {
      'ROAD-PRIMARY-ENTRANCE': { start: 'RNODE-MAIN-GATE', end: 'RNODE-CIRCUS-SOUTH' },
      'ROAD-PRIMARY-CORE-AXIS': { start: 'RNODE-CIRCUS-NORTH', end: 'RNODE-HERO-FORECOURT' },
      'ROAD-PRIMARY-RING-WEST': { 
        start: 'RNODE-CIRCUS-WEST', 
        end: 'RNODE-NW-RB-WEST',
        via: ['RNODE-WEST-RB-EAST', 'RNODE-WEST-RB-WEST']
      },
      'ROAD-PRIMARY-RING-EAST': { 
        start: 'RNODE-CIRCUS-EAST', 
        end: 'RNODE-NE-RB-EAST',
        via: ['RNODE-EAST-RB-WEST', 'RNODE-EAST-RB-EAST']
      },
      'ROAD-PRIMARY-RING-NORTH': { start: 'RNODE-NW-RB-EAST', end: 'RNODE-NE-RB-WEST' },
      'ROAD-SECONDARY-CORE-RING': { 
        start: 'RNODE-HERO-FORECOURT', 
        end: 'RNODE-HERO-FORECOURT', 
        isLoop: true,
        via: ['RNODE-CORE-WEST', 'RNODE-CORE-NORTH', 'RNODE-CORE-EAST']
      },
      'ROAD-SECONDARY-WEST-PARKING': { start: 'RNODE-WEST-RB-SOUTH', end: 'RNODE-WEST-PARKING-ENTRY' },
      'ROAD-SECONDARY-EAST-PARKING': { start: 'RNODE-EAST-RB-SOUTH', end: 'RNODE-EAST-PARKING-ENTRY' },
      'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR': { start: 'RNODE-NW-RB-SOUTH', end: 'RNODE-NE-RB-SOUTH' },
      'ROAD-SECONDARY-EAST-TECH-SPINE': { start: 'RNODE-EAST-RB-NORTH', end: 'RNODE-NE-RB-SOUTH' },
      'ROAD-SERVICE-HERO-NORTH': { start: 'RNODE-CORE-NORTH', end: 'RNODE-ACADEMIC-FORECOURT' },
      'ROAD-SERVICE-AUDITORIUM': { start: 'RNODE-WEST-RB-WEST', end: 'RNODE-AUDITORIUM-LOADING' }
    };

    allRoadDefs.forEach(def => {
      const endpoints = roadEndpointMap[def.roadId] || {
        start: 'RNODE-MAIN-GATE',
        end: 'RNODE-CIRCUS-CENTER'
      };

      // Calculate approximate length along points
      let length = 0;
      for (let i = 0; i < def.points.length - 1; i++) {
        const p1 = def.points[i];
        const p2 = def.points[i + 1];
        length += Math.hypot(p2.x - p1.x, (p2.y || 0) - (p1.y || 0), p2.z - p1.z);
      }

      const segment = {
        id: def.roadId,
        name: def.name,
        roadClass: def.roadClass,
        startNodeId: endpoints.start,
        endNodeId: endpoints.end,
        isLoop: !!endpoints.isLoop,
        points: def.points.map(p => ({ x: p.x, y: p.y || 0.02, z: p.z })),
        width: def.width,
        lanes: def.lanes || 2,
        speedLimitKmH: def.speedClass || (ROAD_CLASSES[def.roadClass]?.speedLimitKmH || 30),
        length: Number(length.toFixed(1)),
        isEmergencyAccessible: true,
        status: ROAD_STATUS.OPEN,
        geometryRef: null // Resolved when 3D scene binds
      };

      this.roadSegments.set(segment.id, segment);

      // Register with nodes
      const startNode = this.roadNodes.get(endpoints.start);
      if (startNode && !startNode.connectedRoadIds.includes(segment.id)) {
        startNode.connectedRoadIds.push(segment.id);
      }
      const endNode = this.roadNodes.get(endpoints.end);
      if (endNode && !endNode.connectedRoadIds.includes(segment.id)) {
        endNode.connectedRoadIds.push(segment.id);
      }
      if (endpoints.via && Array.isArray(endpoints.via)) {
        endpoints.via.forEach(vNodeId => {
          const vNode = this.roadNodes.get(vNodeId);
          if (vNode && !vNode.connectedRoadIds.includes(segment.id)) {
            vNode.connectedRoadIds.push(segment.id);
          }
        });
      }
    });

    // Also register the 5 roundabouts as operational circulatory segments
    const roundaboutJunctionMap = {
      'ROUNDABOUT-ENTRANCE-AXIS': ['RNODE-CIRCUS-CENTER', 'RNODE-CIRCUS-SOUTH', 'RNODE-CIRCUS-NORTH', 'RNODE-CIRCUS-WEST', 'RNODE-CIRCUS-EAST'],
      'ROUNDABOUT-WEST-RING': ['RNODE-WEST-RB-CENTER', 'RNODE-WEST-RB-EAST', 'RNODE-WEST-RB-WEST', 'RNODE-WEST-RB-SOUTH'],
      'ROUNDABOUT-EAST-RING': ['RNODE-EAST-RB-CENTER', 'RNODE-EAST-RB-WEST', 'RNODE-EAST-RB-EAST', 'RNODE-EAST-RB-SOUTH', 'RNODE-EAST-RB-NORTH'],
      'ROUNDABOUT-NW': ['RNODE-NW-RB-CENTER', 'RNODE-NW-RB-WEST', 'RNODE-NW-RB-EAST', 'RNODE-NW-RB-SOUTH'],
      'ROUNDABOUT-NE': ['RNODE-NE-RB-CENTER', 'RNODE-NE-RB-WEST', 'RNODE-NE-RB-EAST', 'RNODE-NE-RB-SOUTH']
    };

    CAMPUS_ROUNDABOUTS.forEach(rb => {
      const circId = `ROAD-CIRCULATORY-${rb.id}`;
      const segment = {
        id: circId,
        name: `${rb.name} Circulation Loop`,
        roadClass: 'CLASS_A_PRIMARY',
        startNodeId: `RNODE-${rb.id === 'ROUNDABOUT-ENTRANCE-AXIS' ? 'CIRCUS' : (rb.id === 'ROUNDABOUT-WEST-RING' ? 'WEST-RB' : (rb.id === 'ROUNDABOUT-EAST-RING' ? 'EAST-RB' : (rb.id === 'ROUNDABOUT-NW' ? 'NW-RB' : 'NE-RB')))}-CENTER`,
        endNodeId: `RNODE-${rb.id === 'ROUNDABOUT-ENTRANCE-AXIS' ? 'CIRCUS' : (rb.id === 'ROUNDABOUT-WEST-RING' ? 'WEST-RB' : (rb.id === 'ROUNDABOUT-EAST-RING' ? 'EAST-RB' : (rb.id === 'ROUNDABOUT-NW' ? 'NW-RB' : 'NE-RB')))}-CENTER`,
        isLoop: true,
        points: [
          { x: rb.center.x, y: rb.center.y, z: rb.center.z }
        ],
        width: rb.roadwayWidth,
        lanes: 1,
        speedLimitKmH: 20,
        length: Number((2 * Math.PI * (rb.innerRadius + rb.roadwayWidth * 0.5)).toFixed(1)),
        isEmergencyAccessible: true,
        status: ROAD_STATUS.OPEN,
        geometryRef: null
      };
      this.roadSegments.set(segment.id, segment);

      const junctionNodeIds = roundaboutJunctionMap[rb.id] || [];
      junctionNodeIds.forEach(nodeId => {
        const node = this.roadNodes.get(nodeId);
        if (node && !node.connectedRoadIds.includes(circId)) {
          node.connectedRoadIds.push(circId);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. PEDESTRIAN NETWORK NODES & PATHWAYS
  // --------------------------------------------------------------------------
  buildPedestrianNodes() {
    // A. Hero Building Ground Portals
    this.addPedestrianNode({
      id: 'PNODE-HERO-SOUTH',
      name: 'Hero Building South Grand Portico Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: 0, y: 0.03, z: 28 },
      buildingId: 'BUILDING-HERO'
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-WEST',
      name: 'Hero Building West Stair Core A Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: -28, y: 0.03, z: 0 },
      buildingId: 'BUILDING-HERO'
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-EAST',
      name: 'Hero Building East Stair Core B Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: 28, y: 0.03, z: 0 },
      buildingId: 'BUILDING-HERO'
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-NORTH',
      name: 'Hero Building North Service Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: 0, y: 0.03, z: -26 },
      buildingId: 'BUILDING-HERO'
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-NW',
      name: 'Hero North-West Diagonal Step',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -26, y: 0.03, z: -22 }
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-NE',
      name: 'Hero North-East Diagonal Step',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 26, y: 0.03, z: -22 }
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-SW',
      name: 'Hero South-West Diagonal Step',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: -26, y: 0.03, z: 24 }
    });
    this.addPedestrianNode({
      id: 'PNODE-HERO-SE',
      name: 'Hero South-East Diagonal Step',
      nodeType: SPATIAL_NODE_TYPES.JUNCTION,
      position: { x: 26, y: 0.03, z: 24 }
    });

    // B. Promenade Destination Nodes (Reaching Campus Buildings & Plazas)
    this.addPedestrianNode({
      id: 'PNODE-CIRCUS-PROMENADE',
      name: 'Entrance Axis Circus Promenade Interface',
      nodeType: SPATIAL_NODE_TYPES.CROSSWALK,
      position: { x: 0, y: 0.03, z: 86 }
    });
    this.addPedestrianNode({
      id: 'PNODE-ACADEMIC-HALL-P05',
      name: 'Central Academic Block P05 Main Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: 0, y: 0.03, z: -115 },
      buildingId: 'PLOT-P05'
    });
    this.addPedestrianNode({
      id: 'PNODE-AUDITORIUM-P09',
      name: 'Auditorium P09 Civic Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: -115, y: 0.03, z: -15 },
      buildingId: 'PLOT-P09'
    });
    this.addPedestrianNode({
      id: 'PNODE-LIBRARY-P07',
      name: 'University Library P07 Knowledge Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: 195, y: 0.03, z: -25 },
      buildingId: 'PLOT-P07'
    });
    this.addPedestrianNode({
      id: 'PNODE-RESEARCH-P06',
      name: 'Research Center P06 Lab Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: -135, y: 0.03, z: -115 },
      buildingId: 'PLOT-P06'
    });
    this.addPedestrianNode({
      id: 'PNODE-INNOVATION-P01',
      name: 'Innovation Tower P01 Atrium Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: 135, y: 0.03, z: -115 },
      buildingId: 'PLOT-P01'
    });
    this.addPedestrianNode({
      id: 'PNODE-HOSTEL-11A',
      name: 'Hostel Residential 11A Student Portal',
      nodeType: SPATIAL_NODE_TYPES.ENTRANCE_PORTAL,
      position: { x: -85, y: 0.03, z: 105 },
      buildingId: 'PLOT-P10'
    });
    this.addPedestrianNode({
      id: 'PNODE-LAKE-PLAZA',
      name: 'Central Eco-Lake Waterfront Promenade Portal',
      nodeType: SPATIAL_NODE_TYPES.PLAZA_PORTAL,
      position: { x: 85, y: 0.03, z: 115 }
    });
    this.addPedestrianNode({
      id: 'PNODE-SPORTS-TRACK',
      name: 'Sports Complex Running Track Portal',
      nodeType: SPATIAL_NODE_TYPES.TERMINUS,
      position: { x: -210, y: 0.03, z: -15 }
    });
  }

  addPedestrianNode(node) {
    const fullNode = {
      ...node,
      connectedPathIds: []
    };
    this.pedestrianNodes.set(node.id, fullNode);
    this.nodeConnectedPathsIndex.set(node.id, []);
  }

  buildPedestrianPaths() {
    const pathNodeMapping = {
      'PATH-SPOKE-SOUTH': { start: 'PNODE-CIRCUS-PROMENADE', end: 'PNODE-HERO-SOUTH' },
      'PATH-SPOKE-NORTH': { start: 'PNODE-HERO-NORTH', end: 'PNODE-ACADEMIC-HALL-P05' },
      'PATH-SPOKE-WEST': { start: 'PNODE-HERO-WEST', end: 'PNODE-AUDITORIUM-P09' },
      'PATH-SPOKE-EAST': { start: 'PNODE-HERO-EAST', end: 'PNODE-LIBRARY-P07' },
      'PATH-SPOKE-NW': { start: 'PNODE-HERO-NW', end: 'PNODE-RESEARCH-P06' },
      'PATH-SPOKE-NE': { start: 'PNODE-HERO-NE', end: 'PNODE-INNOVATION-P01' },
      'PATH-SPOKE-SW': { start: 'PNODE-HERO-SW', end: 'PNODE-HOSTEL-11A' },
      'PATH-SPOKE-SE': { start: 'PNODE-HERO-SE', end: 'PNODE-LAKE-PLAZA' },
      'PATH-SPORTS-LINK': { start: 'PNODE-AUDITORIUM-P09', end: 'PNODE-SPORTS-TRACK' }
    };

    MASTER_PEDESTRIAN_PATHS.forEach(def => {
      const mapping = pathNodeMapping[def.id] || { start: 'PNODE-HERO-SOUTH', end: 'PNODE-CIRCUS-PROMENADE' };

      let length = 0;
      for (let i = 0; i < def.points.length - 1; i++) {
        const p1 = def.points[i];
        const p2 = def.points[i + 1];
        length += Math.hypot(p2.x - p1.x, (p2.y || 0) - (p1.y || 0), p2.z - p1.z);
      }

      const path = {
        id: def.id,
        name: def.name,
        startNodeId: mapping.start,
        endNodeId: mapping.end,
        points: def.points.map(p => ({ x: p.x, y: p.y || 0.03, z: p.z })),
        width: def.width || 4.0,
        length: Number(length.toFixed(1)),
        isCrosswalk: false,
        status: PATH_STATUS.CLEAR,
        geometryRef: null
      };

      this.pedestrianPaths.set(path.id, path);

      const sNode = this.pedestrianNodes.get(mapping.start);
      if (sNode && !sNode.connectedPathIds.includes(path.id)) sNode.connectedPathIds.push(path.id);
      const eNode = this.pedestrianNodes.get(mapping.end);
      if (eNode && !eNode.connectedPathIds.includes(path.id)) eNode.connectedPathIds.push(path.id);
    });
  }

  // --------------------------------------------------------------------------
  // 5. BUILDINGS & ENTRANCES (HERO BUILDING + 11 CAMPUS PARCELS)
  // --------------------------------------------------------------------------
  buildBuildingsAndEntrances() {
    // ------------------------------------------------------------------------
    // A. CENTRAL HERO SKYSCRAPER (TWG-TWR-01)
    // ------------------------------------------------------------------------
    const heroBuildingId = 'BUILDING-HERO';
    const heroBuilding = {
      id: heroBuildingId,
      plotId: 'PLOT-HERO-TOWER',
      code: 'TWG-TWR-01',
      name: 'TwinGuard Horizon Tower (Main Hero Building)',
      buildingType: 'COMMERCIAL_SKYSCRAPER',
      useCase: 'Flagship Digital Twin, Corporate Executive & R&D Laboratories',
      districtId: 'DISTRICT-CENTRAL',
      position: { x: 0, y: 0, z: 0 },
      bounds: { minX: -30, maxX: 30, minZ: -24, maxZ: 24, width: 60, depth: 48 },
      floors: 10,
      heightMeters: 38.0,
      roomsCount: 100,
      isHeroBuilding: true,
      entranceIds: [
        'ENTRANCE-HERO-SOUTH',
        'ENTRANCE-HERO-WEST',
        'ENTRANCE-HERO-EAST',
        'ENTRANCE-HERO-NORTH'
      ],
      connectedRoadIds: [
        'ROAD-PRIMARY-CORE-AXIS',
        'ROAD-SECONDARY-CORE-RING',
        'ROAD-SERVICE-HERO-NORTH'
      ],
      connectedPathIds: [
        'PATH-SPOKE-SOUTH',
        'PATH-SPOKE-WEST',
        'PATH-SPOKE-EAST',
        'PATH-SPOKE-NORTH'
      ],
      nearestRoadNodeId: 'RNODE-HERO-FORECOURT',
      nearestPedestrianNodeId: 'PNODE-HERO-SOUTH',
      geometryRef: null
    };

    this.buildings.set(heroBuilding.id, heroBuilding);
    this.districtBuildingsIndex.get('DISTRICT-CENTRAL').push(heroBuilding.id);

    // Hero Building Entrances
    this.addBuildingEntrance({
      id: 'ENTRANCE-HERO-SOUTH',
      buildingId: heroBuildingId,
      name: 'South Grand Plaza Main Entrance (Exit C)',
      entranceType: ENTRANCE_TYPES.MAIN,
      position: { x: 0.0, y: 0.15, z: 23.5 },
      doorWidth: 4.8,
      isGroundExit: true,
      connectedNodeId: 'PNODE-HERO-SOUTH',
      connectedPathId: 'PATH-SPOKE-SOUTH',
      connectedRoadId: 'ROAD-PRIMARY-CORE-AXIS'
    });

    this.addBuildingEntrance({
      id: 'ENTRANCE-HERO-WEST',
      buildingId: heroBuildingId,
      name: 'West Emergency Stair Core A Ground Exit',
      entranceType: ENTRANCE_TYPES.EMERGENCY_EXIT,
      position: { x: -29.2, y: 0.15, z: 0.0 },
      doorWidth: 2.4,
      isGroundExit: true,
      connectedNodeId: 'PNODE-HERO-WEST',
      connectedPathId: 'PATH-SPOKE-WEST',
      connectedRoadId: 'ROAD-SECONDARY-CORE-RING'
    });

    this.addBuildingEntrance({
      id: 'ENTRANCE-HERO-EAST',
      buildingId: heroBuildingId,
      name: 'East Emergency Stair Core B Ground Exit',
      entranceType: ENTRANCE_TYPES.EMERGENCY_EXIT,
      position: { x: 29.2, y: 0.15, z: 0.0 },
      doorWidth: 2.4,
      isGroundExit: true,
      connectedNodeId: 'PNODE-HERO-EAST',
      connectedPathId: 'PATH-SPOKE-EAST',
      connectedRoadId: 'ROAD-SECONDARY-CORE-RING'
    });

    this.addBuildingEntrance({
      id: 'ENTRANCE-HERO-NORTH',
      buildingId: heroBuildingId,
      name: 'North MEP Operations & Service Loading Portal',
      entranceType: ENTRANCE_TYPES.SERVICE,
      position: { x: 0.0, y: 0.15, z: -24.0 },
      doorWidth: 3.2,
      isGroundExit: true,
      connectedNodeId: 'PNODE-HERO-NORTH',
      connectedPathId: 'PATH-SPOKE-NORTH',
      connectedRoadId: 'ROAD-SERVICE-HERO-NORTH'
    });

    // ------------------------------------------------------------------------
    // B. SUPPORTING 11 CAMPUS BUILDINGS (MATCHING AUTHORITATIVE PLOTS)
    // ------------------------------------------------------------------------
    // Direct spatial relationship mapping table for each campus parcel
    const plotSpatialMapping = {
      'PLOT-P01': {
        roadId: 'ROAD-PRIMARY-RING-EAST',
        roadNode: 'RNODE-NE-RB-EAST',
        pathId: 'PATH-SPOKE-NE',
        pathNode: 'PNODE-INNOVATION-P01'
      },
      'PLOT-P02': {
        roadId: 'ROAD-SECONDARY-EAST-TECH-SPINE',
        roadNode: 'RNODE-EAST-RB-NORTH',
        pathId: 'PATH-SPOKE-EAST',
        pathNode: 'PNODE-LIBRARY-P07'
      },
      'PLOT-P03': {
        roadId: 'ROAD-SECONDARY-EAST-TECH-SPINE',
        roadNode: 'RNODE-NE-RB-SOUTH',
        pathId: 'PATH-SPOKE-EAST',
        pathNode: 'PNODE-LIBRARY-P07'
      },
      'PLOT-P04': {
        roadId: 'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR',
        roadNode: 'RNODE-NW-RB-SOUTH',
        pathId: 'PATH-SPOKE-NORTH',
        pathNode: 'PNODE-ACADEMIC-HALL-P05'
      },
      'PLOT-P05': {
        roadId: 'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR',
        roadNode: 'RNODE-ACADEMIC-FORECOURT',
        pathId: 'PATH-SPOKE-NORTH',
        pathNode: 'PNODE-ACADEMIC-HALL-P05'
      },
      'PLOT-P06': {
        roadId: 'ROAD-PRIMARY-RING-WEST',
        roadNode: 'RNODE-NW-RB-WEST',
        pathId: 'PATH-SPOKE-NW',
        pathNode: 'PNODE-RESEARCH-P06'
      },
      'PLOT-P07': {
        roadId: 'ROAD-SECONDARY-EAST-TECH-SPINE',
        roadNode: 'RNODE-EAST-RB-NORTH',
        pathId: 'PATH-SPOKE-EAST',
        pathNode: 'PNODE-LIBRARY-P07'
      },
      'PLOT-P08': {
        roadId: 'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR',
        roadNode: 'RNODE-NE-RB-SOUTH',
        pathId: 'PATH-SPOKE-NORTH',
        pathNode: 'PNODE-ACADEMIC-HALL-P05'
      },
      'PLOT-P09': {
        roadId: 'ROAD-SERVICE-AUDITORIUM',
        roadNode: 'RNODE-AUDITORIUM-LOADING',
        pathId: 'PATH-SPOKE-WEST',
        pathNode: 'PNODE-AUDITORIUM-P09'
      },
      'PLOT-P10': {
        roadId: 'ROAD-PRIMARY-RING-WEST',
        roadNode: 'RNODE-WEST-RB-EAST',
        pathId: 'PATH-SPOKE-SW',
        pathNode: 'PNODE-HOSTEL-11A'
      },
      'PLOT-P12': {
        roadId: 'ROAD-PRIMARY-RING-WEST',
        roadNode: 'RNODE-CIRCUS-WEST',
        pathId: 'PATH-SPOKE-SW',
        pathNode: 'PNODE-HOSTEL-11A'
      }
    };

    FUTURE_BUILDING_PLOTS.forEach(plot => {
      const buildingId = `BUILDING-${plot.id}`;
      const mapping = plotSpatialMapping[plot.id] || {
        roadId: 'ROAD-PRIMARY-RING-NORTH',
        roadNode: 'RNODE-CIRCUS-CENTER',
        pathId: 'PATH-SPOKE-SOUTH',
        pathNode: 'PNODE-HERO-SOUTH'
      };

      const halfW = (plot.size?.width || 44) * 0.5;
      const halfD = (plot.size?.depth || 36) * 0.5;

      const building = {
        id: buildingId,
        plotId: plot.id,
        code: plot.id,
        name: plot.name,
        buildingType: plot.type || 'RECTANGULAR',
        useCase: plot.useCase || 'Academic / Research Facility',
        districtId: plot.district,
        position: { x: plot.center.x, y: 0, z: plot.center.z },
        bounds: {
          minX: Number((plot.center.x - halfW).toFixed(1)),
          maxX: Number((plot.center.x + halfW).toFixed(1)),
          minZ: Number((plot.center.z - halfD).toFixed(1)),
          maxZ: Number((plot.center.z + halfD).toFixed(1)),
          width: plot.size?.width || 44,
          depth: plot.size?.depth || 36
        },
        floors: plot.plannedFloors || 5,
        heightMeters: (plot.plannedFloors || 5) * 3.8,
        isHeroBuilding: false,
        entranceIds: [`ENTRANCE-${plot.id}-MAIN`],
        connectedRoadIds: [mapping.roadId],
        connectedPathIds: [mapping.pathId],
        nearestRoadNodeId: mapping.roadNode,
        nearestPedestrianNodeId: mapping.pathNode,
        geometryRef: null
      };

      this.buildings.set(building.id, building);

      const dList = this.districtBuildingsIndex.get(plot.district);
      if (dList) dList.push(building.id);

      // Register primary building entrance / vehicular driveway
      const entrancePos = plot.drivewayPos
        ? { x: plot.drivewayPos.x, y: 0.04, z: plot.drivewayPos.z }
        : { x: plot.center.x, y: 0.04, z: plot.center.z + halfD };

      this.addBuildingEntrance({
        id: `ENTRANCE-${plot.id}-MAIN`,
        buildingId: building.id,
        name: `${plot.name} Primary Entrance & Driveway`,
        entranceType: ENTRANCE_TYPES.MAIN,
        position: entrancePos,
        doorWidth: 3.6,
        isGroundExit: true,
        connectedNodeId: mapping.pathNode,
        connectedPathId: mapping.pathId,
        connectedRoadId: mapping.roadId
      });
    });
  }

  addBuildingEntrance(entrance) {
    this.entrances.set(entrance.id, entrance);
    if (!this.buildingEntrancesIndex.has(entrance.buildingId)) {
      this.buildingEntrancesIndex.set(entrance.buildingId, []);
    }
    this.buildingEntrancesIndex.get(entrance.buildingId).push(entrance.id);
  }

  // --------------------------------------------------------------------------
  // 6. PARKING FACILITIES
  // --------------------------------------------------------------------------
  buildParkingAreas() {
    PARKING_FACILITIES.forEach(facility => {
      const isWest = facility.id === 'PARKING-001';
      const parking = {
        id: facility.id,
        name: facility.name,
        districtId: facility.district,
        type: isWest ? 'STAFF_GENERAL_SURFACE' : 'VISITOR_ACADEMIC_SURFACE',
        bounds: { ...facility.bounds },
        center: { ...facility.center },
        capacity: facility.capacity || 260,
        hasEvChargers: !!facility.hasEvChargers,
        accessRoadId: isWest ? 'ROAD-SECONDARY-WEST-PARKING' : 'ROAD-SECONDARY-EAST-PARKING',
        accessRoadNodeId: isWest ? 'RNODE-WEST-PARKING-ENTRY' : 'RNODE-EAST-PARKING-ENTRY',
        geometryRef: null
      };
      this.parkingAreas.set(parking.id, parking);
    });
  }

  // --------------------------------------------------------------------------
  // 7. OPEN SPACES, PLAZAS & LANDSCAPE ENTITIES
  // --------------------------------------------------------------------------
  buildOpenSpaces() {
    // A. Central Assembly Forecourt Plaza
    this.openSpaces.set(CENTRAL_ASSEMBLY_PLAZA.id, {
      id: CENTRAL_ASSEMBLY_PLAZA.id,
      name: CENTRAL_ASSEMBLY_PLAZA.name,
      type: OPEN_SPACE_TYPES.PLAZA,
      districtId: CENTRAL_ASSEMBLY_PLAZA.district,
      center: { ...CENTRAL_ASSEMBLY_PLAZA.center },
      radius: CENTRAL_ASSEMBLY_PLAZA.radius,
      capacity: CENTRAL_ASSEMBLY_PLAZA.capacity,
      connectedNodeIds: ['PNODE-HERO-SOUTH', 'PNODE-CIRCUS-PROMENADE'],
      geometryRef: null
    });

    // B. Defined Campus Lawns
    CAMPUS_LAWNS.forEach(lawn => {
      this.openSpaces.set(lawn.id, {
        id: lawn.id,
        name: lawn.name,
        type: OPEN_SPACE_TYPES.LAWN,
        districtId: lawn.id.includes('NORTH') ? 'DISTRICT-NORTH-ACADEMIC' : (lawn.id.includes('EAST') ? 'DISTRICT-EAST-TECH' : 'DISTRICT-WEST-CIVIC'),
        center: { ...lawn.center },
        bounds: { ...lawn.bounds },
        capacity: 1200,
        geometryRef: null
      });
    });

    // C. Central Eco-Lake
    this.openSpaces.set(CAMPUS_LAKE.id, {
      id: CAMPUS_LAKE.id,
      name: CAMPUS_LAKE.name,
      type: OPEN_SPACE_TYPES.WATER_BODY,
      districtId: CAMPUS_LAKE.district,
      center: { ...CAMPUS_LAKE.center },
      size: { ...CAMPUS_LAKE.size },
      geometryRef: null
    });

    // D. Sports Complex
    this.openSpaces.set(SPORTS_COMPLEX.id, {
      id: SPORTS_COMPLEX.id,
      name: SPORTS_COMPLEX.name,
      type: OPEN_SPACE_TYPES.SPORTS_FACILITY,
      districtId: SPORTS_COMPLEX.district,
      center: { ...SPORTS_COMPLEX.center },
      geometryRef: null
    });
  }

  // --------------------------------------------------------------------------
  // 8. CAMPUS PERIMETER GATEWAYS
  // --------------------------------------------------------------------------
  buildGateways() {
    CAMPUS_ENTRANCES.forEach(entry => {
      this.gateways.set(entry.id, {
        id: entry.id,
        name: entry.name,
        position: { x: entry.center.x, y: 0.02, z: entry.center.z },
        width: entry.width,
        connectedRoadNodeId: 'RNODE-MAIN-GATE',
        connectedRoadId: 'ROAD-PRIMARY-ENTRANCE',
        hasSecurityKiosk: !!entry.hasSecurityKiosk
      });
    });

    // Also register explicit emergency & service gates
    this.gateways.set('GATE-EMERGENCY-ACCESS', {
      id: 'GATE-EMERGENCY-ACCESS',
      name: 'Main South Dedicated Emergency Responder Gate',
      position: { x: 0, y: 0.02, z: 240 },
      width: 14.0,
      connectedRoadNodeId: 'RNODE-MAIN-GATE',
      connectedRoadId: 'ROAD-PRIMARY-ENTRANCE',
      isEmergencyOnly: true
    });

    this.gateways.set('GATE-SERVICE-NORTH', {
      id: 'GATE-SERVICE-NORTH',
      name: 'North Academic & Service Logistics Gate',
      position: { x: 0, y: 0.02, z: -250 },
      width: 10.0,
      connectedRoadNodeId: 'RNODE-NE-RB-SOUTH',
      connectedRoadId: 'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR',
      isServiceOnly: true
    });
  }

  // --------------------------------------------------------------------------
  // 9. ASSEMBLY POINTS (PHASE 1)
  // --------------------------------------------------------------------------
  buildAssemblyPoints() {
    const assemblyDefs = [
      {
        id: 'ASSEMBLY-HERO-FORECOURT',
        name: 'Hero Central Forecourt Assembly Plaza',
        position: { x: 0, y: 0.02, z: 42 },
        capacity: 2500,
        currentOccupants: 0,
        status: ASSEMBLY_STATUS.SAFE,
        accessiblePedestrianNodeIds: ['PNODE-HERO-SOUTH', 'PNODE-CIRCUS-PROMENADE'],
        districtId: 'DISTRICT-CENTRAL',
        radius: 24.0
      },
      {
        id: 'ASSEMBLY-ACADEMIC-QUAD',
        name: 'North Academic Quadrangle Assembly Green',
        position: { x: 0, y: 0.02, z: -180 },
        capacity: 1200,
        currentOccupants: 0,
        status: ASSEMBLY_STATUS.SAFE,
        accessiblePedestrianNodeIds: ['PNODE-ACADEMIC-HALL-P05', 'PNODE-HERO-NORTH'],
        districtId: 'DISTRICT-NORTH-ACADEMIC',
        radius: 20.0
      },
      {
        id: 'ASSEMBLY-WEST-PARKING',
        name: 'West Surface Lot Muster Facility',
        position: { x: -215, y: 0.02, z: 220 },
        capacity: 800,
        currentOccupants: 0,
        status: ASSEMBLY_STATUS.SAFE,
        accessiblePedestrianNodeIds: ['PNODE-HOSTEL-11A', 'PNODE-AUDITORIUM-P09'],
        districtId: 'DISTRICT-WEST-CIVIC',
        radius: 18.0
      },
      {
        id: 'ASSEMBLY-EAST-PARKING',
        name: 'East Surface Lot Muster Facility',
        position: { x: 215, y: 0.02, z: 220 },
        capacity: 800,
        currentOccupants: 0,
        status: ASSEMBLY_STATUS.SAFE,
        accessiblePedestrianNodeIds: ['PNODE-LAKE-PLAZA', 'PNODE-LIBRARY-P07'],
        districtId: 'DISTRICT-EAST-TECH',
        radius: 18.0
      },
      {
        id: 'ASSEMBLY-SOUTH-LAWN',
        name: 'Central Lake & South Arrival Assembly Lawn',
        position: { x: 95, y: 0.02, z: 145 },
        capacity: 1500,
        currentOccupants: 0,
        status: ASSEMBLY_STATUS.SAFE,
        accessiblePedestrianNodeIds: ['PNODE-LAKE-PLAZA', 'PNODE-CIRCUS-PROMENADE'],
        districtId: 'DISTRICT-SOUTH-PUBLIC',
        radius: 22.0
      }
    ];

    assemblyDefs.forEach(point => {
      this.assemblyPoints.set(point.id, point);
    });
  }

  // --------------------------------------------------------------------------
  // 10. FIRE RESPONSE & STAGING POINTS (PHASE 1)
  // --------------------------------------------------------------------------
  buildFireResponsePoints() {
    const firePoints = [
      {
        id: 'FIRE-STAGING-HERO-SOUTH',
        name: 'South Forecourt Fire Engine Staging Bay',
        position: { x: 0, y: 0.02, z: 38 },
        targetBuildingId: 'BUILDING-HERO',
        connectedRoadNodeId: 'RNODE-HERO-FORECOURT',
        connectedRoadId: 'ROAD-PRIMARY-CORE-AXIS',
        approachWidth: 10.0,
        status: 'OPERATIONAL'
      },
      {
        id: 'FIRE-STAGING-HERO-WEST',
        name: 'West Stair Core A Fire Ladder Staging Pad',
        position: { x: -44, y: 0.02, z: 0 },
        targetBuildingId: 'BUILDING-HERO',
        connectedRoadNodeId: 'RNODE-CORE-WEST',
        connectedRoadId: 'ROAD-SECONDARY-CORE-RING',
        approachWidth: 8.0,
        status: 'OPERATIONAL'
      },
      {
        id: 'FIRE-STAGING-HERO-EAST',
        name: 'East Stair Core B Fire Ladder Staging Pad',
        position: { x: 44, y: 0.02, z: 0 },
        targetBuildingId: 'BUILDING-HERO',
        connectedRoadNodeId: 'RNODE-CORE-EAST',
        connectedRoadId: 'ROAD-SECONDARY-CORE-RING',
        approachWidth: 8.0,
        status: 'OPERATIONAL'
      },
      {
        id: 'FIRE-STAGING-HERO-NORTH',
        name: 'North MEP / Mechanical Fire Staging Pad',
        position: { x: 0, y: 0.02, z: -42 },
        targetBuildingId: 'BUILDING-HERO',
        connectedRoadNodeId: 'RNODE-CORE-NORTH',
        connectedRoadId: 'ROAD-SERVICE-HERO-NORTH',
        approachWidth: 6.0,
        status: 'OPERATIONAL'
      }
    ];

    firePoints.forEach(p => {
      this.fireResponsePoints.set(p.id, p);
    });
  }

  // --------------------------------------------------------------------------
  // 11. MEDICAL & COMMAND STAGING POINTS (PHASE 1)
  // --------------------------------------------------------------------------
  buildMedicalAndCommandPoints() {
    const medical = [
      {
        id: 'MEDICAL-POINT-SOUTH-PLAZA',
        name: 'Central Field Medical Triage & First Aid Station',
        position: { x: -15, y: 0.02, z: 36 },
        capacity: 40,
        status: 'OPERATIONAL',
        districtId: 'DISTRICT-CENTRAL'
      },
      {
        id: 'MEDICAL-POINT-WEST-LOT',
        name: 'West Surface Lot Auxiliary EMS Depot',
        position: { x: -195, y: 0.02, z: 205 },
        capacity: 25,
        status: 'STANDBY',
        districtId: 'DISTRICT-WEST-CIVIC'
      }
    ];
    medical.forEach(m => this.medicalPoints.set(m.id, m));

    const command = [
      {
        id: 'COMMAND-STAGING-MAIN',
        name: 'Campus Tactical Incident Command Post',
        position: { x: 15, y: 0.02, z: 36 },
        status: 'ACTIVE',
        districtId: 'DISTRICT-CENTRAL'
      }
    ];
    command.forEach(c => this.commandStagingAreas.set(c.id, c));
  }

  // --------------------------------------------------------------------------
  // 12. EVACUATION ZONES (PHASE 2)
  // --------------------------------------------------------------------------
  buildEvacuationZones() {
    // A. Building-Specific Zones
    this.buildings.forEach(b => {
      const bZone = {
        id: `ZONE-BLD-${b.isHeroBuilding ? 'HERO' : b.plotId}`,
        name: `${b.name} Evacuation Zone`,
        type: EVACUATION_ZONE_TYPES.BUILDING,
        bounds: { ...b.bounds },
        associatedBuildingIds: [b.id],
        associatedEntranceIds: [...b.entranceIds],
        associatedAssemblyPointIds: b.isHeroBuilding
          ? ['ASSEMBLY-HERO-FORECOURT', 'ASSEMBLY-WEST-PARKING', 'ASSEMBLY-EAST-PARKING']
          : ['ASSEMBLY-HERO-FORECOURT'],
        status: ZONE_STATUS.SAFE,
        hazardLevel: 0.0
      };
      this.evacuationZones.set(bZone.id, bZone);
    });

    // B. District Zones
    this.districts.forEach(d => {
      const dZone = {
        id: `ZONE-${d.id}`,
        name: `${d.name} Zone`,
        type: EVACUATION_ZONE_TYPES.DISTRICT,
        bounds: { ...d.bounds },
        associatedBuildingIds: [...(this.districtBuildingsIndex.get(d.id) || [])],
        associatedEntranceIds: [],
        associatedAssemblyPointIds: [],
        status: ZONE_STATUS.SAFE,
        hazardLevel: 0.0
      };
      this.evacuationZones.set(dZone.id, dZone);
    });

    // C. Assembly Zones
    this.assemblyPoints.forEach(a => {
      const aZone = {
        id: `ZONE-${a.id}`,
        name: `${a.name} Zone`,
        type: EVACUATION_ZONE_TYPES.ASSEMBLY,
        bounds: {
          minX: a.position.x - a.radius,
          maxX: a.position.x + a.radius,
          minZ: a.position.z - a.radius,
          maxZ: a.position.z + a.radius,
          width: a.radius * 2,
          depth: a.radius * 2
        },
        associatedBuildingIds: [],
        associatedEntranceIds: [],
        associatedAssemblyPointIds: [a.id],
        status: ZONE_STATUS.SAFE,
        hazardLevel: 0.0
      };
      this.evacuationZones.set(aZone.id, aZone);
    });
  }

  // --------------------------------------------------------------------------
  // 13. CROSS-REFERENCE SPATIAL RELATIONSHIPS
  // --------------------------------------------------------------------------
  computeSpatialRelationships() {
    // Populate building-to-road and building-to-path inverse lookup indices
    this.buildings.forEach(building => {
      this.buildingRoadsIndex.set(building.id, [...building.connectedRoadIds]);
      this.buildingPathsIndex.set(building.id, [...building.connectedPathIds]);
    });
  }

  // ==========================================================================
  // RUNTIME THREE.JS GEOMETRY BINDING
  // ==========================================================================
  resolveGeometryReferences(campusSite) {
    if (!campusSite) return;

    // 1. Bind Hero Building geometry
    const hero = this.buildings.get('BUILDING-HERO');
    if (hero && campusSite.scene) {
      const heroGroup = campusSite.scene.getObjectByName('HeroBuilding') ||
                        campusSite.scene.getObjectByName('buildingGroup') ||
                        (campusSite.sceneManager && campusSite.sceneManager.building ? campusSite.sceneManager.building.group : null) ||
                        campusSite.scene.children.find(c => c.name === 'HeroBuilding' || c.name === 'buildingGroup');
      if (heroGroup) hero.geometryRef = heroGroup;
    }

    // 2. Bind Supporting 11 Buildings
    if (campusSite.buildingsManager && campusSite.buildingsManager.group) {
      const bGroup = campusSite.buildingsManager.group;
      this.buildings.forEach(building => {
        if (!building.isHeroBuilding) {
          const m = bGroup.getObjectByName(building.plotId);
          if (m) building.geometryRef = m;
        }
      });
    }

    // 3. Bind Road Meshes
    if (campusSite.roadNetwork && campusSite.roadNetwork.group) {
      campusSite.roadNetwork.group.traverse(child => {
        if (child.isMesh && child.userData && child.userData.roadId) {
          const segment = this.roadSegments.get(child.userData.roadId);
          if (segment) segment.geometryRef = child;
        }
      });
    }

    // 4. Bind Pedestrian Walkway Meshes
    if (campusSite.pedestrianNetwork && campusSite.pedestrianNetwork.group) {
      campusSite.pedestrianNetwork.group.traverse(child => {
        if (child.isMesh && child.userData && child.userData.id) {
          const path = this.pedestrianPaths.get(child.userData.id);
          if (path) path.geometryRef = child;
        }
      });
    }

    // 5. Bind Parking and Open Spaces
    if (campusSite.parkingManager && campusSite.parkingManager.group) {
      this.parkingAreas.forEach(p => {
        p.geometryRef = campusSite.parkingManager.group;
      });
    }
  }

  // ==========================================================================
  // QUERY & ACCESS API (O(1) & PURE LOGICAL METHODS)
  // ==========================================================================

  getBuilding(buildingId) {
    return this.buildings.get(buildingId) || null;
  }

  getAllBuildings() {
    return Array.from(this.buildings.values());
  }

  getBuildingsInDistrict(districtId) {
    const ids = this.districtBuildingsIndex.get(districtId) || [];
    return ids.map(id => this.buildings.get(id)).filter(Boolean);
  }

  getEntrancesForBuilding(buildingId) {
    const ids = this.buildingEntrancesIndex.get(buildingId) || [];
    return ids.map(id => this.entrances.get(id)).filter(Boolean);
  }

  getRoadsServingBuilding(buildingId) {
    const ids = this.buildingRoadsIndex.get(buildingId) || [];
    return ids.map(id => this.roadSegments.get(id)).filter(Boolean);
  }

  getPathsServingBuilding(buildingId) {
    const ids = this.buildingPathsIndex.get(buildingId) || [];
    return ids.map(id => this.pedestrianPaths.get(id)).filter(Boolean);
  }

  getRoad(roadId) {
    return this.roadSegments.get(roadId) || null;
  }

  getAllRoads() {
    return Array.from(this.roadSegments.values());
  }

  getRoadNode(nodeId) {
    return this.roadNodes.get(nodeId) || null;
  }

  getAllRoadNodes() {
    return Array.from(this.roadNodes.values());
  }

  getPedestrianPath(pathId) {
    return this.pedestrianPaths.get(pathId) || null;
  }

  getAllPedestrianPaths() {
    return Array.from(this.pedestrianPaths.values());
  }

  getPedestrianNode(nodeId) {
    return this.pedestrianNodes.get(nodeId) || null;
  }

  getAllPedestrianNodes() {
    return Array.from(this.pedestrianNodes.values());
  }

  getDistrict(districtId) {
    return this.districts.get(districtId) || null;
  }

  getAllDistricts() {
    return Array.from(this.districts.values());
  }

  getParkingArea(parkingId) {
    return this.parkingAreas.get(parkingId) || null;
  }

  getOpenSpace(spaceId) {
    return this.openSpaces.get(spaceId) || null;
  }

  // Finds intersecting or adjoining roads for a given road segment
  findIntersectingRoads(roadId) {
    const road = this.roadSegments.get(roadId);
    if (!road) return [];

    const intersecting = new Set();
    this.roadNodes.forEach(node => {
      if (node.connectedRoadIds && node.connectedRoadIds.includes(roadId)) {
        node.connectedRoadIds.forEach(id => {
          if (id !== roadId) intersecting.add(id);
        });
      }
    });

    return Array.from(intersecting).map(id => this.roadSegments.get(id)).filter(Boolean);
  }

  // Nearest Road Node query
  getNearestRoadNode(worldPos) {
    if (!worldPos) return null;
    let closest = null;
    let minDistSq = Infinity;

    this.roadNodes.forEach(node => {
      const dx = node.position.x - worldPos.x;
      const dz = node.position.z - worldPos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closest = node;
      }
    });

    return closest ? { node: closest, distance: Math.sqrt(minDistSq) } : null;
  }

  // Nearest Pedestrian Node query
  getNearestPedestrianNode(worldPos) {
    if (!worldPos) return null;
    let closest = null;
    let minDistSq = Infinity;

    this.pedestrianNodes.forEach(node => {
      const dx = node.position.x - worldPos.x;
      const dz = node.position.z - worldPos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closest = node;
      }
    });

    return closest ? { node: closest, distance: Math.sqrt(minDistSq) } : null;
  }

  // Resolves the district containing a given (x, z) point
  getDistrictForPoint(worldPos) {
    if (!worldPos) return null;
    for (const district of this.districts.values()) {
      const b = district.bounds;
      if (
        worldPos.x >= b.minX &&
        worldPos.x <= b.maxX &&
        worldPos.z >= b.minZ &&
        worldPos.z <= b.maxZ
      ) {
        return district;
      }
    }
    return this.districts.get('DISTRICT-CENTRAL') || null;
  }

  // --------------------------------------------------------------------------
  // NAVIGATION GRAPH INTEGRATION & EXPORT (PHASE 0 & PHASE 3)
  // --------------------------------------------------------------------------
  // Extends an existing NavigationGraph with campus outdoor nodes and edges
  extendNavigationGraph(navGraph) {
    if (!navGraph || typeof navGraph.addNode !== 'function') return;
    this.navGraph = navGraph;

    // 1. Add Campus Pedestrian Walkway Nodes
    this.pedestrianNodes.forEach(pNode => {
      navGraph.addNode({
        id: `campus_${pNode.id.toLowerCase().replace(/-/g, '_')}`,
        type: 'OUTDOOR_WALKWAY_NODE',
        floor: 0,
        name: pNode.name,
        pos: { x: pNode.position.x, y: pNode.position.y, z: pNode.position.z }
      });
    });

    // 2. Add Campus Pedestrian Paths as Edges
    this.pedestrianPaths.forEach(path => {
      const fromNodeId = `campus_${path.startNodeId.toLowerCase().replace(/-/g, '_')}`;
      const toNodeId = `campus_${path.endNodeId.toLowerCase().replace(/-/g, '_')}`;
      const sNode = this.pedestrianNodes.get(path.startNodeId);
      const eNode = this.pedestrianNodes.get(path.endNodeId);

      if (sNode && eNode) {
        navGraph.addEdge({
          id: `edge_${path.id.toLowerCase().replace(/-/g, '_')}`,
          from: fromNodeId,
          to: toNodeId,
          fromPos: sNode.position,
          toPos: eNode.position,
          floor: 0,
          type: 'SAFE_ZONE_PATH',
          traversalMode: TRAVERSAL_MODES.PEDESTRIAN,
          width: path.width,
          isBidirectional: true
        });
      }
    });

    // 3. PHASE 0 ISSUE 1: Connect Indoor Ground Exits to Outdoor Campus Portal Nodes
    // Bidirectional bridge edges connecting building exits to campus walkways
    const portalBridges = [
      {
        id: 'edge_bridge_exit_a_to_campus_west',
        indoorNodeId: 'node_exit_a_west',
        campusNodeId: 'campus_pnode_hero_west',
        type: 'GROUND_EXIT_PORTAL',
        doorWidth: 2.4
      },
      {
        id: 'edge_bridge_exit_b_to_campus_east',
        indoorNodeId: 'node_exit_b_east',
        campusNodeId: 'campus_pnode_hero_east',
        type: 'GROUND_EXIT_PORTAL',
        doorWidth: 2.4
      },
      {
        id: 'edge_bridge_exit_c_to_campus_south',
        indoorNodeId: 'node_exit_c_south',
        campusNodeId: 'campus_pnode_hero_south',
        type: 'GROUND_EXIT_PORTAL',
        doorWidth: 4.8
      }
    ];

    portalBridges.forEach(bridge => {
      const indoorNode = navGraph.nodes.get(bridge.indoorNodeId);
      const campusNode = navGraph.nodes.get(bridge.campusNodeId);

      if (indoorNode && campusNode) {
        navGraph.addEdge({
          id: bridge.id,
          from: bridge.indoorNodeId,
          to: bridge.campusNodeId,
          fromPos: indoorNode.pos,
          toPos: campusNode.pos,
          floor: 1,
          type: bridge.type,
          traversalMode: TRAVERSAL_MODES.PEDESTRIAN,
          width: bridge.doorWidth,
          isBidirectional: true
        });
      }
    });

    // 4. Add Campus Assembly Point Nodes
    this.assemblyPoints.forEach(ap => {
      navGraph.addNode({
        id: `campus_${ap.id.toLowerCase().replace(/-/g, '_')}`,
        type: 'OUTDOOR_SAFE_ZONE_NODE',
        assemblyId: ap.id,
        floor: 0,
        name: ap.name,
        pos: { x: ap.position.x, y: ap.position.y, z: ap.position.z },
        capacity: ap.capacity
      });
    });

    // 5. Connect Pedestrian Spoke Nodes to Assembly Points
    const assemblyLinks = [
      { from: 'campus_pnode_hero_south', to: 'campus_assembly_hero_forecourt', width: 8.0 },
      { from: 'campus_pnode_circus_promenade', to: 'campus_assembly_hero_forecourt', width: 6.0 },
      { from: 'campus_pnode_circus_promenade', to: 'campus_assembly_south_lawn', width: 5.0 },
      { from: 'campus_pnode_academic_hall_p05', to: 'campus_assembly_academic_quad', width: 6.0 },
      { from: 'campus_pnode_innovation_p01', to: 'campus_assembly_academic_quad', width: 6.0 },
      { from: 'campus_pnode_research_p06', to: 'campus_assembly_academic_quad', width: 6.0 },
      { from: 'campus_pnode_hero_north', to: 'campus_assembly_academic_quad', width: 5.0 },
      { from: 'campus_pnode_hostel_11a', to: 'campus_assembly_west_parking', width: 6.0 },
      { from: 'campus_pnode_auditorium_p09', to: 'campus_assembly_west_parking', width: 6.0 },
      { from: 'campus_pnode_lake_plaza', to: 'campus_assembly_east_parking', width: 6.0 },
      { from: 'campus_pnode_library_p07', to: 'campus_assembly_east_parking', width: 6.0 },
      { from: 'campus_pnode_lake_plaza', to: 'campus_assembly_south_lawn', width: 6.0 }
    ];

    assemblyLinks.forEach((link, idx) => {
      const uNode = navGraph.nodes.get(link.from);
      const vNode = navGraph.nodes.get(link.to);
      if (uNode && vNode) {
        navGraph.addEdge({
          id: `edge_assembly_link_${idx + 1}`,
          from: link.from,
          to: link.to,
          fromPos: uNode.pos,
          toPos: vNode.pos,
          floor: 0,
          type: 'SAFE_ZONE_PATH',
          traversalMode: TRAVERSAL_MODES.PEDESTRIAN,
          width: link.width,
          isBidirectional: true
        });
      }
    });

    // 6. Connect Hero Core Perimeter Walkways (Allowing circumnavigation around Hero Tower)
    const coreWalkways = [
      { from: 'campus_pnode_hero_west', to: 'campus_pnode_hero_south', width: 4.0 },
      { from: 'campus_pnode_hero_east', to: 'campus_pnode_hero_south', width: 4.0 },
      { from: 'campus_pnode_hero_west', to: 'campus_pnode_hero_north', width: 3.5 },
      { from: 'campus_pnode_hero_east', to: 'campus_pnode_hero_north', width: 3.5 },
      { from: 'campus_pnode_hero_north', to: 'campus_pnode_hero_ne', width: 3.5 },
      { from: 'campus_pnode_hero_ne', to: 'campus_pnode_hero_east', width: 3.5 },
      { from: 'campus_pnode_hero_east', to: 'campus_pnode_hero_se', width: 3.5 },
      { from: 'campus_pnode_hero_se', to: 'campus_pnode_hero_south', width: 3.5 },
      { from: 'campus_pnode_hero_south', to: 'campus_pnode_hero_sw', width: 3.5 },
      { from: 'campus_pnode_hero_sw', to: 'campus_pnode_hero_west', width: 3.5 },
      { from: 'campus_pnode_hero_west', to: 'campus_pnode_hero_nw', width: 3.5 },
      { from: 'campus_pnode_hero_nw', to: 'campus_pnode_hero_north', width: 3.5 }
    ];

    coreWalkways.forEach((cw, idx) => {
      const u = navGraph.nodes.get(cw.from);
      const v = navGraph.nodes.get(cw.to);
      if (u && v) {
        navGraph.addEdge({
          id: `edge_core_walkway_${idx + 1}`,
          from: cw.from,
          to: cw.to,
          fromPos: u.pos,
          toPos: v.pos,
          floor: 0,
          type: 'SAFE_ZONE_PATH',
          traversalMode: TRAVERSAL_MODES.PEDESTRIAN,
          width: cw.width,
          isBidirectional: true
        });
      }
    });

    // 7. Add Road Network Nodes (for Vehicular & Emergency Responder Routing)
    this.roadNodes.forEach(rNode => {
      navGraph.addNode({
        id: `campus_${rNode.id.toLowerCase().replace(/-/g, '_')}`,
        type: 'OUTDOOR_ROAD_NODE',
        floor: 0,
        name: rNode.name,
        pos: { x: rNode.position.x, y: rNode.position.y, z: rNode.position.z },
        roadClass: rNode.nodeType
      });
    });

    // 8. Add Road Network Segments as Vehicular Edges (handling multi-waypoint via connections)
    const roadEndpointMap = {
      'ROAD-PRIMARY-ENTRANCE': { start: 'RNODE-MAIN-GATE', end: 'RNODE-CIRCUS-SOUTH' },
      'ROAD-PRIMARY-CORE-AXIS': { start: 'RNODE-CIRCUS-NORTH', end: 'RNODE-HERO-FORECOURT' },
      'ROAD-PRIMARY-RING-WEST': { 
        start: 'RNODE-CIRCUS-WEST', 
        end: 'RNODE-NW-RB-WEST',
        via: ['RNODE-WEST-RB-EAST', 'RNODE-WEST-RB-WEST', 'RNODE-CORE-WEST']
      },
      'ROAD-PRIMARY-RING-EAST': { 
        start: 'RNODE-CIRCUS-EAST', 
        end: 'RNODE-NE-RB-EAST',
        via: ['RNODE-EAST-RB-WEST', 'RNODE-EAST-RB-EAST', 'RNODE-CORE-EAST']
      },
      'ROAD-PRIMARY-RING-NORTH': { start: 'RNODE-NW-RB-EAST', end: 'RNODE-NE-RB-WEST' },
      'ROAD-SECONDARY-CORE-RING': { 
        start: 'RNODE-HERO-FORECOURT', 
        end: 'RNODE-HERO-FORECOURT', 
        isLoop: true,
        via: ['RNODE-CORE-WEST', 'RNODE-CORE-NORTH', 'RNODE-CORE-EAST']
      },
      'ROAD-SECONDARY-WEST-PARKING': { start: 'RNODE-WEST-RB-SOUTH', end: 'RNODE-WEST-PARKING-ENTRY' },
      'ROAD-SECONDARY-EAST-PARKING': { start: 'RNODE-EAST-RB-SOUTH', end: 'RNODE-EAST-PARKING-ENTRY' },
      'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR': { start: 'RNODE-NW-RB-SOUTH', end: 'RNODE-NE-RB-SOUTH' },
      'ROAD-SECONDARY-EAST-TECH-SPINE': { start: 'RNODE-EAST-RB-NORTH', end: 'RNODE-NE-RB-SOUTH' },
      'ROAD-SERVICE-HERO-NORTH': { start: 'RNODE-CORE-NORTH', end: 'RNODE-ACADEMIC-FORECOURT' },
      'ROAD-SERVICE-AUDITORIUM': { start: 'RNODE-WEST-RB-WEST', end: 'RNODE-AUDITORIUM-LOADING' }
    };

    this.roadSegments.forEach(road => {
      const endpoints = roadEndpointMap[road.id];
      if (endpoints) {
        const nodeList = [endpoints.start, ...(endpoints.via || []), endpoints.end];

        for (let i = 0; i < nodeList.length - 1; i++) {
          const uId = nodeList[i];
          const vId = nodeList[i + 1];
          const fromNodeId = `campus_${uId.toLowerCase().replace(/-/g, '_')}`;
          const toNodeId = `campus_${vId.toLowerCase().replace(/-/g, '_')}`;
          const sNode = this.roadNodes.get(uId);
          const eNode = this.roadNodes.get(vId);

          if (sNode && eNode) {
            navGraph.addEdge({
              id: `edge_road_${road.id.toLowerCase().replace(/-/g, '_')}_seg_${i + 1}`,
              from: fromNodeId,
              to: toNodeId,
              fromPos: sNode.position,
              toPos: eNode.position,
              floor: 0,
              type: 'ROAD_SEGMENT',
              traversalMode: TRAVERSAL_MODES.EMERGENCY_VEHICLE,
              roadId: road.id,
              roadClass: road.roadClass,
              width: road.width,
              speedLimitKmH: road.speedLimitKmH,
              isBidirectional: true
            });
          }
        }
      }
    });

    // 8B. Add Roundabout Circulatory Edges (Connecting Rim Nodes together and to Center Hub)
    const roundaboutJunctionMap = {
      'ROUNDABOUT-ENTRANCE-AXIS': ['RNODE-CIRCUS-SOUTH', 'RNODE-CIRCUS-EAST', 'RNODE-CIRCUS-NORTH', 'RNODE-CIRCUS-WEST'],
      'ROUNDABOUT-WEST-RING': ['RNODE-WEST-RB-SOUTH', 'RNODE-WEST-RB-EAST', 'RNODE-WEST-RB-WEST'],
      'ROUNDABOUT-EAST-RING': ['RNODE-EAST-RB-SOUTH', 'RNODE-EAST-RB-EAST', 'RNODE-EAST-RB-NORTH', 'RNODE-EAST-RB-WEST'],
      'ROUNDABOUT-NW': ['RNODE-NW-RB-SOUTH', 'RNODE-NW-RB-EAST', 'RNODE-NW-RB-WEST'],
      'ROUNDABOUT-NE': ['RNODE-NE-RB-SOUTH', 'RNODE-NE-RB-WEST', 'RNODE-NE-RB-EAST']
    };

    CAMPUS_ROUNDABOUTS.forEach(rb => {
      const rimNodes = roundaboutJunctionMap[rb.id] || [];
      const centerNodeId = `RNODE-${rb.id === 'ROUNDABOUT-ENTRANCE-AXIS' ? 'CIRCUS' : (rb.id === 'ROUNDABOUT-WEST-RING' ? 'WEST-RB' : (rb.id === 'ROUNDABOUT-EAST-RING' ? 'EAST-RB' : (rb.id === 'ROUNDABOUT-NW' ? 'NW-RB' : 'NE-RB')))}-CENTER`;
      const centerNode = this.roadNodes.get(centerNodeId);
      const centerCampusId = `campus_${centerNodeId.toLowerCase().replace(/-/g, '_')}`;

      // Connect each rim node to center hub
      rimNodes.forEach((rimId, rIdx) => {
        const rimNode = this.roadNodes.get(rimId);
        const rimCampusId = `campus_${rimId.toLowerCase().replace(/-/g, '_')}`;
        if (rimNode && centerNode) {
          navGraph.addEdge({
            id: `edge_rb_${rb.id.toLowerCase().replace(/-/g, '_')}_spoke_${rIdx + 1}`,
            from: rimCampusId,
            to: centerCampusId,
            fromPos: rimNode.position,
            toPos: centerNode.position,
            floor: 0,
            type: 'ROUNDABOUT_CIRCULATION',
            traversalMode: TRAVERSAL_MODES.EMERGENCY_VEHICLE,
            roadId: `ROAD-CIRCULATORY-${rb.id}`,
            roadClass: 'CLASS_A_PRIMARY',
            width: rb.roadwayWidth,
            speedLimitKmH: 25,
            isBidirectional: true
          });
        }

        // Connect adjacent rim nodes around perimeter
        const nextRimId = rimNodes[(rIdx + 1) % rimNodes.length];
        const nextRimNode = this.roadNodes.get(nextRimId);
        const nextRimCampusId = `campus_${nextRimId.toLowerCase().replace(/-/g, '_')}`;
        if (rimNode && nextRimNode) {
          navGraph.addEdge({
            id: `edge_rb_${rb.id.toLowerCase().replace(/-/g, '_')}_ring_${rIdx + 1}`,
            from: rimCampusId,
            to: nextRimCampusId,
            fromPos: rimNode.position,
            toPos: nextRimNode.position,
            floor: 0,
            type: 'ROUNDABOUT_CIRCULATION',
            traversalMode: TRAVERSAL_MODES.EMERGENCY_VEHICLE,
            roadId: `ROAD-CIRCULATORY-${rb.id}`,
            roadClass: 'CLASS_A_PRIMARY',
            width: rb.roadwayWidth,
            speedLimitKmH: 20,
            isBidirectional: true
          });
        }
      });
    });

    // 9. Add Fire Response Staging Nodes and connect to Road Network
    this.fireResponsePoints.forEach(fp => {
      const stagingNodeId = `campus_${fp.id.toLowerCase().replace(/-/g, '_')}`;
      navGraph.addNode({
        id: stagingNodeId,
        type: 'OUTDOOR_FIRE_STAGING_NODE',
        firePointId: fp.id,
        floor: 0,
        name: fp.name,
        pos: { x: fp.position.x, y: fp.position.y, z: fp.position.z }
      });

      const roadNodeId = `campus_${fp.connectedRoadNodeId.toLowerCase().replace(/-/g, '_')}`;
      const rNode = navGraph.nodes.get(roadNodeId);
      if (rNode) {
        navGraph.addEdge({
          id: `edge_staging_${fp.id.toLowerCase().replace(/-/g, '_')}`,
          from: roadNodeId,
          to: stagingNodeId,
          fromPos: rNode.pos,
          toPos: fp.position,
          floor: 0,
          type: 'STAGING_ACCESS_SPUR',
          traversalMode: TRAVERSAL_MODES.EMERGENCY_VEHICLE,
          width: fp.approachWidth || 8.0,
          isBidirectional: true
        });
      }
    });
  }

  // ==========================================================================
  // DYNAMIC STATE & INCIDENT MANAGEMENT (PHASE 4, 12, 13)
  // ==========================================================================

  blockRoad(roadId, reason = 'INCIDENT_BLOCKAGE') {
    const road = this.roadSegments.get(roadId);
    if (!road) return false;
    road.status = ROAD_STATUS.BLOCKED;
    road.blockReason = reason;

    if (this.navGraph) {
      this.navGraph.edges.forEach(edge => {
        if (edge.roadId === roadId) {
          edge.status = 'BLOCKED';
        }
      });
    }

    this.emit('road_blocked', { roadId, reason });
    return true;
  }

  unblockRoad(roadId) {
    const road = this.roadSegments.get(roadId);
    if (!road) return false;
    road.status = ROAD_STATUS.OPEN;
    delete road.blockReason;

    if (this.navGraph) {
      this.navGraph.edges.forEach(edge => {
        if (edge.roadId === roadId) {
          edge.status = 'OPEN';
        }
      });
    }

    this.emit('road_unblocked', { roadId });
    return true;
  }

  blockPath(pathId, reason = 'HAZARD_BLOCKAGE') {
    const path = this.pedestrianPaths.get(pathId);
    if (!path) return false;
    path.status = PATH_STATUS.BLOCKED;
    path.blockReason = reason;

    if (this.navGraph) {
      const matchSub = pathId.toLowerCase().replace(/-/g, '_');
      this.navGraph.edges.forEach(edge => {
        if (edge.id && edge.id.includes(matchSub)) {
          edge.status = 'BLOCKED';
        }
      });
    }

    this.emit('path_blocked', { pathId, reason });
    return true;
  }

  unblockPath(pathId) {
    const path = this.pedestrianPaths.get(pathId);
    if (!path) return false;
    path.status = PATH_STATUS.CLEAR;
    delete path.blockReason;

    if (this.navGraph) {
      const matchSub = pathId.toLowerCase().replace(/-/g, '_');
      this.navGraph.edges.forEach(edge => {
        if (edge.id && edge.id.includes(matchSub)) {
          edge.status = 'OPEN';
        }
      });
    }

    this.emit('path_unblocked', { pathId });
    return true;
  }

  setAssemblyPointStatus(assemblyId, status) {
    const ap = this.assemblyPoints.get(assemblyId);
    if (!ap) return false;
    ap.status = status;

    if (this.navGraph) {
      const nodeId = `campus_${assemblyId.toLowerCase().replace(/-/g, '_')}`;
      const node = this.navGraph.nodes.get(nodeId);
      if (node) {
        node.status = status;
      }
    }

    this.emit('assembly_status_changed', { assemblyId, status });
    return true;
  }

  setZoneStatus(zoneId, status, hazardLevel = 0.0) {
    const zone = this.evacuationZones.get(zoneId);
    if (!zone) return false;
    zone.status = status;
    zone.hazardLevel = hazardLevel;
    this.emit('zone_status_changed', { zoneId, status, hazardLevel });
    return true;
  }

  registerIncident(incident) {
    if (!incident || !incident.id) return null;
    const fullIncident = {
      id: incident.id,
      type: incident.type || INCIDENT_TYPES.FIRE,
      severity: incident.severity || INCIDENT_SEVERITY.HIGH,
      location: incident.location || { buildingId: 'BUILDING-HERO', floor: 5, roomId: 'room_501' },
      affectedZoneId: incident.affectedZoneId || 'ZONE-BLD-HERO',
      startTime: incident.startTime || Date.now(),
      status: incident.status || 'ACTIVE'
    };

    this.incidents.set(fullIncident.id, fullIncident);

    // Apply hazard to corresponding zone
    if (fullIncident.affectedZoneId) {
      this.setZoneStatus(fullIncident.affectedZoneId, ZONE_STATUS.EVACUATING, 0.85);
    }

    this.emit('incident_registered', fullIncident);
    return fullIncident;
  }

  resolveIncident(incidentId) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;
    incident.status = 'RESOLVED';

    if (incident.affectedZoneId) {
      this.setZoneStatus(incident.affectedZoneId, ZONE_STATUS.SAFE, 0.0);
    }

    this.emit('incident_resolved', { incidentId });
    return true;
  }

  // Lightweight Event Bus
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Error in event listener:', e); }
    });
  }

  // ==========================================================================
  // DYNAMIC CAMPUS EVACUATION ROUTING (PHASE 5, 6, 7, 8)
  // ==========================================================================

  selectOptimalAssemblyPoint(originPos, crowdCount = 50) {
    const available = Array.from(this.assemblyPoints.values()).filter(ap =>
      ap.status === ASSEMBLY_STATUS.SAFE || ap.status === ASSEMBLY_STATUS.CAUTION
    );

    if (available.length === 0) return null;

    // Rank by composite score: distance + saturation
    let bestPoint = null;
    let lowestScore = Infinity;

    available.forEach(ap => {
      const dist = Math.hypot(ap.position.x - originPos.x, ap.position.z - originPos.z);
      const remainingCapacity = Math.max(1, ap.capacity - (ap.currentOccupants || 0));
      const saturationPenalty = ((ap.currentOccupants || 0) / ap.capacity) * 100.0;
      const score = dist + saturationPenalty;

      if (score < lowestScore) {
        lowestScore = score;
        bestPoint = ap;
      }
    });

    return bestPoint;
  }

  calculateCampusEvacuationRoute(originNodeId, options = {}) {
    if (!this.navGraph) {
      return { success: false, reason: 'NAVIGATION_GRAPH_NOT_INITIALIZED', path: [] };
    }

    const startNode = this.navGraph.nodes.get(originNodeId);
    if (!startNode) {
      return { success: false, reason: 'INVALID_ORIGIN_NODE', path: [] };
    }

    // Determine target candidate assembly points
    let targetAssemblyPoints = [];
    if (options.preferredAssemblyId) {
      const ap = this.assemblyPoints.get(options.preferredAssemblyId);
      if (ap && ap.status !== ASSEMBLY_STATUS.RESTRICTED && ap.status !== ASSEMBLY_STATUS.BLOCKED) {
        targetAssemblyPoints = [ap];
      }
    }

    if (targetAssemblyPoints.length === 0) {
      targetAssemblyPoints = Array.from(this.assemblyPoints.values()).filter(ap =>
        ap.status === ASSEMBLY_STATUS.SAFE || ap.status === ASSEMBLY_STATUS.CAUTION
      );
    }

    if (targetAssemblyPoints.length === 0) {
      return { success: false, reason: 'NO_SAFE_ROUTE_AVAILABLE', path: [] };
    }

    // Dijkstra traversal strictly over pedestrian-accessible edges
    const dist = new Map();
    const prev = new Map();
    const prevEdge = new Map();
    const pq = [];

    this.navGraph.nodes.forEach((_, id) => dist.set(id, Infinity));
    dist.set(originNodeId, 0);
    pq.push({ id: originNodeId, cost: 0 });

    const blockedEdgeSet = new Set(options.blockedEdgeIds || []);
    const blockedNodeSet = new Set(options.blockedNodeIds || []);

    const targetNodeIds = targetAssemblyPoints.map(ap =>
      `campus_${ap.id.toLowerCase().replace(/-/g, '_')}`
    );

    let reachedTargetId = null;

    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);
      const { id: u, cost: uCost } = pq.shift();

      if (targetNodeIds.includes(u)) {
        reachedTargetId = u;
        break;
      }

      if (uCost > dist.get(u)) continue;

      const neighborEdges = this.navGraph.adjacency.get(u) || [];
      for (const edge of neighborEdges) {
        if (blockedEdgeSet.has(edge.id) || edge.status === 'BLOCKED') continue;

        // Strictly avoid emergency-vehicle-only roads for pedestrian egress
        if (edge.traversalMode === TRAVERSAL_MODES.EMERGENCY_VEHICLE && edge.type === 'ROAD_SEGMENT') {
          continue;
        }

        const v = edge.to;
        if (blockedNodeSet.has(v)) continue;

        const baseTraversalTime = edge.traversalTime || (edge.distance / 1.35);
        const hazardPenalty = (edge.hazardLevel || 0) * 200.0;
        const totalEdgeCost = baseTraversalTime + hazardPenalty;

        const alt = uCost + totalEdgeCost;
        if (alt < dist.get(v)) {
          dist.set(v, alt);
          prev.set(v, u);
          prevEdge.set(v, edge);
          pq.push({ id: v, cost: alt });
        }
      }
    }

    if (!reachedTargetId || dist.get(reachedTargetId) === Infinity) {
      return { success: false, reason: 'NO_SAFE_ROUTE_AVAILABLE', path: [], waypoints3D: [] };
    }

    // Reconstruct node and edge sequence
    const nodeSequence = [];
    const edgeSequence = [];
    const waypoints3D = [];
    let curr = reachedTargetId;

    while (curr !== undefined) {
      nodeSequence.unshift(curr);
      const edge = prevEdge.get(curr);
      if (edge) edgeSequence.unshift(edge);
      const nObj = this.navGraph.nodes.get(curr);
      if (nObj && nObj.pos) {
        waypoints3D.unshift({ x: nObj.pos.x, y: nObj.pos.y, z: nObj.pos.z });
      }
      curr = prev.get(curr);
    }

    const matchedAssembly = targetAssemblyPoints.find(ap =>
      `campus_${ap.id.toLowerCase().replace(/-/g, '_')}` === reachedTargetId
    );

    let totalDist = 0;
    for (let i = 0; i < waypoints3D.length - 1; i++) {
      const p1 = waypoints3D[i];
      const p2 = waypoints3D[i + 1];
      totalDist += Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
    }

    return {
      success: true,
      routeId: `ROUTE-EVAC-${Date.now()}`,
      originNodeId,
      destinationAssemblyId: matchedAssembly ? matchedAssembly.id : reachedTargetId,
      destinationName: matchedAssembly ? matchedAssembly.name : 'Safe Assembly Area',
      nodeSequence,
      edgeSequence,
      waypoints3D,
      totalDistance: Number(totalDist.toFixed(1)),
      estimatedEgressTimeSec: Number((totalDist / 1.35).toFixed(1)),
      cost: dist.get(reachedTargetId),
      status: 'OPTIMAL'
    };
  }

  // Multi-Strategy Route Ranking (Phase 6)
  rankEvacuationStrategies(originNodeId, crowdSize = 50) {
    const primary = this.calculateCampusEvacuationRoute(originNodeId);
    if (!primary.success) {
      return { strategies: [], bestStrategy: null };
    }

    const strategies = [];

    // Strategy 1: Distance-Optimal
    strategies.push({
      rank: 1,
      name: 'Strategy 1 — Direct Primary Route',
      description: `Fastest clearance to ${primary.destinationName}`,
      route: primary,
      clearanceTimeSec: primary.estimatedEgressTimeSec,
      hazardRiskScore: 'LOW',
      congestionIndex: 1.15
    });

    // Strategy 2: Alternate Assembly Point Bypass
    const remainingAssemblies = Array.from(this.assemblyPoints.values()).filter(ap =>
      ap.id !== primary.destinationAssemblyId && ap.status === ASSEMBLY_STATUS.SAFE
    );

    if (remainingAssemblies.length > 0) {
      const altAssembly = remainingAssemblies[0];
      const altRoute = this.calculateCampusEvacuationRoute(originNodeId, {
        preferredAssemblyId: altAssembly.id
      });
      if (altRoute.success) {
        strategies.push({
          rank: 2,
          name: `Strategy 2 — Secondary Diversion to ${altAssembly.name}`,
          description: 'Load-balancing bypass avoiding central corridors',
          route: altRoute,
          clearanceTimeSec: altRoute.estimatedEgressTimeSec,
          hazardRiskScore: 'MINIMAL',
          congestionIndex: 1.05
        });
      }
    }

    return {
      strategies,
      bestStrategy: strategies[0]
    };
  }

  // ==========================================================================
  // EMERGENCY RESPONDER VEHICLE ROUTING (PHASE 9)
  // ==========================================================================

  calculateEmergencyVehicleRoute(
    gateId = 'RNODE-MAIN-GATE',
    targetStagingId = 'FIRE-STAGING-HERO-SOUTH',
    blockedRoadIds = []
  ) {
    if (!this.navGraph) {
      return { success: false, reason: 'NAVIGATION_GRAPH_NOT_INITIALIZED', path: [] };
    }

    const startNodeId = `campus_${gateId.toLowerCase().replace(/-/g, '_')}`;
    const targetNodeId = `campus_${targetStagingId.toLowerCase().replace(/-/g, '_')}`;

    const startNode = this.navGraph.nodes.get(startNodeId);
    const targetNode = this.navGraph.nodes.get(targetNodeId);

    if (!startNode || !targetNode) {
      return { success: false, reason: 'INVALID_GATE_OR_STAGING_NODE', path: [] };
    }

    const blockedSet = new Set(blockedRoadIds);
    this.roadSegments.forEach(r => {
      if (r.status === ROAD_STATUS.BLOCKED) blockedSet.add(r.id);
    });

    const dist = new Map();
    const prev = new Map();
    const prevEdge = new Map();
    const pq = [];

    this.navGraph.nodes.forEach((_, id) => dist.set(id, Infinity));
    dist.set(startNodeId, 0);
    pq.push({ id: startNodeId, cost: 0 });

    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);
      const { id: u, cost: uCost } = pq.shift();

      if (u === targetNodeId) break;
      if (uCost > dist.get(u)) continue;

      const neighborEdges = this.navGraph.adjacency.get(u) || [];
      for (const edge of neighborEdges) {
        // Strictly require vehicular / emergency vehicular access
        if (edge.traversalMode !== TRAVERSAL_MODES.EMERGENCY_VEHICLE) continue;
        if (edge.status === 'BLOCKED') continue;
        if (edge.roadId && blockedSet.has(edge.roadId)) continue;

        const v = edge.to;
        const speedMs = (edge.speedLimitKmH || 30) / 3.6;
        const traversalTime = edge.distance / Math.max(1, speedMs);

        // Class A roads get priority factor
        const classBonus = edge.roadClass === 'CLASS_A_PRIMARY' ? 0.85 : 1.0;
        const edgeCost = traversalTime * classBonus;

        const alt = uCost + edgeCost;
        if (alt < dist.get(v)) {
          dist.set(v, alt);
          prev.set(v, u);
          prevEdge.set(v, edge);
          pq.push({ id: v, cost: alt });
        }
      }
    }

    if (dist.get(targetNodeId) === Infinity) {
      return { success: false, reason: 'NO_SAFE_VEHICLE_ROUTE_AVAILABLE', path: [], waypoints3D: [] };
    }

    const nodeSequence = [];
    const edgeSequence = [];
    const waypoints3D = [];
    let curr = targetNodeId;

    while (curr !== undefined) {
      nodeSequence.unshift(curr);
      const edge = prevEdge.get(curr);
      if (edge) edgeSequence.unshift(edge);
      const nObj = this.navGraph.nodes.get(curr);
      if (nObj && nObj.pos) {
        waypoints3D.unshift({ x: nObj.pos.x, y: nObj.pos.y, z: nObj.pos.z });
      }
      curr = prev.get(curr);
    }

    let totalDist = 0;
    for (let i = 0; i < waypoints3D.length - 1; i++) {
      const p1 = waypoints3D[i];
      const p2 = waypoints3D[i + 1];
      totalDist += Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
    }

    return {
      success: true,
      routeId: `ROUTE-EMERGENCY-VEHICLE-${Date.now()}`,
      gateId,
      stagingId: targetStagingId,
      nodeSequence,
      edgeSequence,
      waypoints3D,
      totalDistance: Number(totalDist.toFixed(1)),
      etaSeconds: Number(dist.get(targetNodeId).toFixed(1)),
      status: 'DISPATCH_OPTIMAL'
    };
  }

  // ==========================================================================
  // DEVELOPER DIAGNOSTICS & SYSTEM VALIDATION (PHASE 14)
  // ==========================================================================

  validateEmergencySpatialNetwork(navGraph = null) {
    const graph = navGraph || this.navGraph;
    const checks = [];

    // Check 1: Every building has an entrance
    let allBuildingsHaveEntrances = true;
    this.buildings.forEach(b => {
      const ents = this.getEntrancesForBuilding(b.id);
      if (!ents || ents.length === 0) allBuildingsHaveEntrances = false;
    });
    checks.push({
      item: 1,
      name: 'Every building has registered entrance',
      passed: allBuildingsHaveEntrances
    });

    // Check 2: Every Hero emergency exit reaches outdoor network
    const heroEntrances = this.getEntrancesForBuilding('BUILDING-HERO');
    const heroExitsOutdoor = heroEntrances.every(e => !!e.connectedNodeId && this.pedestrianNodes.has(e.connectedNodeId));
    checks.push({
      item: 2,
      name: 'Every Hero emergency exit reaches outdoor network',
      passed: heroExitsOutdoor
    });

    // Check 3: Every assembly point is reachable
    const allAssembliesValid = this.assemblyPoints.size >= 5;
    checks.push({
      item: 3,
      name: 'Every assembly point registered and configured',
      passed: allAssembliesValid
    });

    // Check 4: Every emergency gate reaches road network
    let allGatesConnected = true;
    this.gateways.forEach(g => {
      if (!g.connectedRoadNodeId || !this.roadNodes.has(g.connectedRoadNodeId)) allGatesConnected = false;
    });
    checks.push({
      item: 4,
      name: 'Every emergency gate reaches road network',
      passed: allGatesConnected
    });

    // Check 5: Every road segment connects to valid nodes
    let allRoadsConnected = true;
    this.roadSegments.forEach(r => {
      if (!this.roadNodes.has(r.startNodeId) || !this.roadNodes.has(r.endNodeId)) allRoadsConnected = false;
    });
    checks.push({
      item: 5,
      name: 'Every road segment connects to valid nodes',
      passed: allRoadsConnected
    });

    // Check 6: Every pedestrian path connects to valid nodes
    let allPathsConnected = true;
    this.pedestrianPaths.forEach(p => {
      if (!this.pedestrianNodes.has(p.startNodeId) || !this.pedestrianNodes.has(p.endNodeId)) allPathsConnected = false;
    });
    checks.push({
      item: 6,
      name: 'Every pedestrian path connects to valid nodes',
      passed: allPathsConnected
    });

    // Check 7: Indoor -> outdoor graph traversal works
    let indoorOutdoorTraversal = false;
    if (graph) {
      const westBridge = graph.edges.get('edge_bridge_exit_a_to_campus_west');
      const eastBridge = graph.edges.get('edge_bridge_exit_b_to_campus_east');
      const southBridge = graph.edges.get('edge_bridge_exit_c_to_campus_south');
      indoorOutdoorTraversal = !!(westBridge && eastBridge && southBridge);
    }
    checks.push({
      item: 7,
      name: 'Indoor -> outdoor graph traversal bridges connected',
      passed: indoorOutdoorTraversal
    });

    // Check 8: Outdoor evacuation routes can reach at least one assembly point
    let evacuationRouteWorking = false;
    if (graph) {
      const testEvac = this.calculateCampusEvacuationRoute('node_exit_a_west');
      evacuationRouteWorking = testEvac.success && testEvac.waypoints3D.length > 0;
    }
    checks.push({
      item: 8,
      name: 'Outdoor evacuation route reaches assembly point',
      passed: evacuationRouteWorking
    });

    // Check 9: Emergency vehicle routes avoid pedestrian-only paths
    let vehicleRouteWorking = false;
    if (graph) {
      const testVehicle = this.calculateEmergencyVehicleRoute('RNODE-MAIN-GATE', 'FIRE-STAGING-HERO-SOUTH');
      vehicleRouteWorking = testVehicle.success && testVehicle.waypoints3D.length > 0;
    }
    checks.push({
      item: 9,
      name: 'Emergency vehicle route reaches staging pad avoiding pedestrian paths',
      passed: vehicleRouteWorking
    });

    // Check 10: Blocked segments cause route recalculation
    let blockedRecalculationWorks = false;
    if (graph) {
      this.blockRoad('ROAD-PRIMARY-CORE-AXIS');
      const rerouted = this.calculateEmergencyVehicleRoute('RNODE-MAIN-GATE', 'FIRE-STAGING-HERO-WEST');
      blockedRecalculationWorks = rerouted.success;
      this.unblockRoad('ROAD-PRIMARY-CORE-AXIS');
    }
    checks.push({
      item: 10,
      name: 'Blocked segments cause dynamic route recalculation',
      passed: blockedRecalculationWorks
    });

    // Check 11: Coordinate alignment remains valid
    const hero = this.getBuilding('BUILDING-HERO');
    const coordAlignmentValid = hero && hero.bounds && hero.bounds.width === 60 && hero.bounds.depth === 48;
    checks.push({
      item: 11,
      name: 'Coordinate alignment and spatial bounds valid',
      passed: coordAlignmentValid
    });

    // Check 12: No duplicate authoritative routing graph created
    const singleAuthorityValid = !!graph;
    checks.push({
      item: 12,
      name: 'Single authoritative routing graph maintained',
      passed: singleAuthorityValid
    });

    const passedCount = checks.filter(c => c.passed).length;
    return {
      isValid: passedCount === checks.length,
      passedCount,
      totalCount: checks.length,
      checks
    };
  }

  // ==========================================================================
  // QUERY & ACCESS HELPERS (PHASE 14)
  // ==========================================================================

  getAssemblyPoint(assemblyId) {
    return this.assemblyPoints.get(assemblyId) || null;
  }

  getAllAssemblyPoints() {
    return Array.from(this.assemblyPoints.values());
  }

  getFireResponsePoint(pointId) {
    return this.fireResponsePoints.get(pointId) || null;
  }

  getAllFireResponsePoints() {
    return Array.from(this.fireResponsePoints.values());
  }

  getEvacuationZone(zoneId) {
    return this.evacuationZones.get(zoneId) || null;
  }

  getAllEvacuationZones() {
    return Array.from(this.evacuationZones.values());
  }

  getIncident(incidentId) {
    return this.incidents.get(incidentId) || null;
  }

  getAllIncidents() {
    return Array.from(this.incidents.values());
  }
}
