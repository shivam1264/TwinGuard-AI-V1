// ============================================================================
// TWIN GUARD CAMPUS MASTER PLAN — GEOMETRIC SPECIFICATION & GIS METADATA
// ============================================================================
// Comprehensive spatial master plan for the 40-hectare institutional smart campus.
// Modeled directly on the authoritative architectural master plan reference:
// - Central Hero Building (Existing 10-Storey Digital Twin at 0, 0, 0)
// - Central Plaza / Assembly Area (West of Hero Building with Amphitheater)
// - South-East Lake & Landscape Open Space (Organic water body with island)
// - South-West Main Parking Area (Phase 1, 180+ stalls with tree islands)
// - South-East Secondary Parking Area (Staff / Visitors, 120+ stalls)
// - West Sports & Recreation Complex (Athletic running track + sports courts)
// - North-West Service & Emergency Entrance + Logistics & Utility Zone
// - North Research Zone (Plots P04, P05, P06)
// - North-East Academic Zone (Plots P07, P08)
// - East Technology Zone (Plots P01, P02, P03)
// - South-West Public / Student Plots (P09, P10)
// - South Main Campus Entrance & External Highway

export const CAMPUS_BOUNDS = {
  minX: -360,
  maxX: 360,
  minZ: -280,
  maxZ: 300,
  width: 720,
  depth: 580
};

// ============================================================================
// 1. FIVE COHESIVE FUNCTIONAL DISTRICTS
// ============================================================================
export const CAMPUS_DISTRICTS = [
  {
    id: 'DISTRICT-CENTRAL',
    name: 'District 1 — Central / Hero & Civic Heart',
    theme: 'Flagship Digital Twin, Central Assembly Plaza & Grand Forecourt',
    bounds: { minX: -110, maxX: 70, minZ: -70, maxZ: 100 },
    center: { x: -20, z: 10 },
    primaryUses: ['Hero Digital Twin Building', 'Central Assembly Plaza', 'Civic Amphitheater', 'Hero Forecourt Drop-off']
  },
  {
    id: 'DISTRICT-TECH',
    name: 'District 2 — Technology & Academic Zone (East & North-East)',
    theme: 'AI Engineering, Neural Systems & Academic Research',
    bounds: { minX: 75, maxX: 310, minZ: -180, maxZ: 120 },
    center: { x: 190, z: -30 },
    primaryUses: ['Technology Parcels P01-P03', 'Academic Parcels P07-P08', 'Secondary Parking', 'Academic Quad']
  },
  {
    id: 'DISTRICT-RESEARCH',
    name: 'District 3 — Advanced Research Zone (North)',
    theme: 'High-Density Computing, Robotics & Precision Science',
    bounds: { minX: -130, maxX: 90, minZ: -240, maxZ: -90 },
    center: { x: -20, z: -165 },
    primaryUses: ['Research Parcels P04-P06', 'Data Infrastructure', 'Autonomous Robotics', 'North Parkway']
  },
  {
    id: 'DISTRICT-PUBLIC',
    name: 'District 4 — Public, Student & Sports Realm (South & West)',
    theme: 'Student Life, Sports Recreation, Lake Commons & Main Parking',
    bounds: { minX: -320, maxX: 200, minZ: 40, maxZ: 280 },
    center: { x: -60, z: 160 },
    primaryUses: ['Sports Running Track', 'Athletic Courts', 'Main Parking Area', 'Lake Landscape', 'Public Parcels P09-P10']
  },
  {
    id: 'DISTRICT-SERVICE',
    name: 'District 5 — Logistics, Utility & Emergency Command (North-West)',
    theme: 'Campus Infrastructure, Utilities & Emergency Response',
    bounds: { minX: -320, maxX: -140, minZ: -250, maxZ: -120 },
    center: { x: -230, z: -185 },
    primaryUses: ['Service & Utility Zone P12', 'North Service Gate', 'Fleet Depot', 'Rapid Emergency Corridors']
  }
];

// ============================================================================
// 2. ROAD HIERARCHY SPECIFICATION (GIS / ROUTING METADATA)
// ============================================================================
export const ROAD_CLASSES = {
  CLASS_A_PRIMARY: {
    type: 'CLASS_A_PRIMARY',
    name: 'Primary Campus Road',
    targetWidth: 8.5,
    speedLimitKmH: 35,
    lanes: 2,
    hasCenterline: true,
    curbWidth: 0.28,
    curbHeight: 0.05,
    isEmergencyAccessible: true
  },
  CLASS_B_SECONDARY: {
    type: 'CLASS_B_SECONDARY',
    name: 'Secondary Campus Road',
    targetWidth: 6.0,
    speedLimitKmH: 25,
    lanes: 2,
    hasCenterline: false,
    curbWidth: 0.24,
    curbHeight: 0.04,
    isEmergencyAccessible: true
  },
  CLASS_C_SERVICE: {
    type: 'CLASS_C_SERVICE',
    name: 'Service / Emergency Road',
    targetWidth: 5.0,
    speedLimitKmH: 20,
    lanes: 1,
    hasCenterline: false,
    curbWidth: 0.20,
    curbHeight: 0.03,
    isEmergencyAccessible: true
  }
};

// ============================================================================
// 3. CLASS A — PRIMARY CAMPUS ARTERIALS (Width = 8.5m)
// ============================================================================
export const PRIMARY_CAMPUS_ROADS = [
  // 1. Southern Gateway Spine (Site Entry to Central Distribution Circus)
  {
    roadId: 'ROAD-PRIMARY-001',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'Southern Gateway Circulation Spine',
    width: 8.5,
    speedClass: 35,
    lanes: 2,
    fromNode: 'NODE-SOUTH-GATE',
    toNode: 'NODE-CENTRAL-CIRCUS',
    isEmergencyAccessible: true,
    points: [
      { x: -10, y: 0.02, z: 295 },  // Main South Gate Portal
      { x: -8,  y: 0.02, z: 250 },  // Gateway transition
      { x: -3,  y: 0.02, z: 195 },  // Flowing between West Parking & Eco-Lake
      { x: 2,   y: 0.02, z: 145 },  // Approach boulevard
      { x: 0,   y: 0.02, z: 105 }   // Merging into Central Distribution Circus
    ]
  },
  // 2. West Civic Parkway (Central Circus around Plaza south to West Circus)
  {
    roadId: 'ROAD-PRIMARY-002',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'West Civic Arterial Parkway',
    width: 8.5,
    speedClass: 35,
    lanes: 2,
    fromNode: 'NODE-CENTRAL-CIRCUS',
    toNode: 'NODE-WEST-CIRCUS',
    isEmergencyAccessible: true,
    points: [
      { x: -20,  y: 0.02, z: 85 },  // Branching west from Central Circus
      { x: -50,  y: 0.02, z: 75 },  // Passing south of student greens
      { x: -85,  y: 0.02, z: 58 },  // Flowing 16m south of Central Plaza edge (8-15m buffer)
      { x: -118, y: 0.02, z: 46 },  // Approaching West Circus
      { x: -136, y: 0.02, z: 35 }   // Merging into East rim of West Circus
    ]
  }
];

// ============================================================================
// 4. CONTROLLED ROUNDABOUT JUNCTIONS (Properly Scaled & Landscaped)
// ============================================================================
export const CAMPUS_ROUNDABOUTS = [
  // A. Grand Central Distribution Circus (South of Hero Building Forecourt)
  {
    id: 'ROUNDABOUT-CENTRAL-001',
    name: 'Central Campus Distribution Circus',
    center: { x: 0, y: 0.02, z: 85 },
    outerDiameter: 40.0,
    outerRadius: 20.0,
    roadwayWidth: 7.5,
    innerRadius: 12.5,
    islandRadius: 12.3,
    islandDiameter: 24.6,
    hasCenterpiece: true
  },
  // B. West Campus Innovation Circus (Between Sports, Plaza & Research)
  {
    id: 'ROUNDABOUT-WEST-002',
    name: 'West Campus Innovation Circus',
    center: { x: -150, y: 0.02, z: 35 },
    outerDiameter: 28.0,
    outerRadius: 14.0,
    roadwayWidth: 6.5,
    innerRadius: 7.5,
    islandRadius: 7.3,
    islandDiameter: 14.6,
    hasCenterpiece: true
  }
];

// ============================================================================
// 5. CLASS B — SECONDARY CAMPUS ROADS (Width = 6.0m)
// ============================================================================
export const SECONDARY_CAMPUS_ROADS = [
  // 1. West Sports & Parking Parkway
  {
    roadId: 'ROAD-SECONDARY-001',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'West Sports & Parking Parkway',
    width: 6.0,
    speedClass: 25,
    lanes: 2,
    fromNode: 'NODE-WEST-CIRCUS',
    toNode: 'NODE-SOUTH-GATE',
    isEmergencyAccessible: true,
    points: [
      { x: -150, y: 0.02, z: 49 },   // From south rim of West Circus
      { x: -155, y: 0.02, z: 95 },   // Passing between Sports hardcourts and Student Forum
      { x: -155, y: 0.02, z: 145 },  // Flanking Main Parking
      { x: -145, y: 0.02, z: 195 },  // Main Parking Junction
      { x: -125, y: 0.02, z: 245 },  // Sweeping south
      { x: -65,  y: 0.02, z: 280 },  // Sweeping towards entrance portal
      { x: -18,  y: 0.02, z: 295 }   // Connecting to South Gateway apron
    ]
  },
  // 2. North Research & Academic Loop
  {
    roadId: 'ROAD-SECONDARY-002',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'North Research & Academic Parkway Loop',
    width: 6.0,
    speedClass: 25,
    lanes: 2,
    fromNode: 'NODE-WEST-CIRCUS',
    toNode: 'NODE-ACADEMIC-EAST',
    isEmergencyAccessible: true,
    points: [
      { x: -150, y: 0.02, z: 21 },   // From north rim of West Circus
      { x: -155, y: 0.02, z: -35 },  // Flowing 15m west of Central Plaza edge
      { x: -145, y: 0.02, z: -85 },  // Northern approach
      { x: -125, y: 0.02, z: -145 }, // Approaching Research cluster
      { x: -95,  y: 0.02, z: -185 }, // Serving Plot P06 (Autonomous Robotics)
      { x: -20,  y: 0.02, z: -195 }, // Serving Plot P05 (Supercomputing Hub)
      { x: 60,   y: 0.02, z: -185 }, // Serving Plot P04 (Executive R&D)
      { x: 150,  y: 0.02, z: -145 }, // Serving Plot P07 (Life Sciences)
      { x: 210,  y: 0.02, z: -125 }, // Serving Plot P08 (Engineering)
      { x: 230,  y: 0.02, z: -75 }   // Academic Quad East Junction
    ]
  },
  // 3. East Technology & Lake Loop
  {
    roadId: 'ROAD-SECONDARY-003',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'East Technology & Academic Loop',
    width: 6.0,
    speedClass: 25,
    lanes: 2,
    fromNode: 'NODE-CENTRAL-CIRCUS',
    toNode: 'NODE-ACADEMIC-EAST',
    isEmergencyAccessible: true,
    points: [
      { x: 20,  y: 0.02, z: 85 },    // Branching east from Central Circus
      { x: 65,  y: 0.02, z: 75 },    // Between Hero Building and Eco-Lake
      { x: 125, y: 0.02, z: 50 },    // Serving Plot P01 (Innovation Tower)
      { x: 185, y: 0.02, z: 20 },    // Serving Plot P02 (Advanced Computing)
      { x: 225, y: 0.02, z: -25 },   // Serving Plot P03 (Microelectronics)
      { x: 230, y: 0.02, z: -75 }    // Connecting to North Research Loop
    ]
  },
  // 4. Main Parking Area Dedicated Access Branch
  {
    roadId: 'ROAD-PARKING-001',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'Main Parking Dedicated Access Road',
    width: 6.0,
    speedClass: 20,
    lanes: 2,
    fromNode: 'NODE-WEST-PARKING-JCT',
    toNode: 'NODE-PARKING-MAIN-GATE',
    isEmergencyAccessible: true,
    points: [
      { x: -145, y: 0.02, z: 195 },
      { x: -168, y: 0.02, z: 195 }   // Smooth transition into parking internal road
    ]
  },
  // 5. Secondary Parking Dedicated Access Branch
  {
    roadId: 'ROAD-PARKING-002',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'Secondary Parking Dedicated Access Road',
    width: 6.0,
    speedClass: 20,
    lanes: 2,
    fromNode: 'NODE-EAST-LAKE-JCT',
    toNode: 'NODE-PARKING-SEC-GATE',
    isEmergencyAccessible: true,
    points: [
      { x: 65,  y: 0.02, z: 75 },
      { x: 100, y: 0.02, z: 110 },
      { x: 150, y: 0.02, z: 135 },   // Bypassing north of Eco-Lake
      { x: 195, y: 0.02, z: 155 }    // Transition into Secondary Parking
    ]
  }
];

// ============================================================================
// 6. CLASS C — SERVICE & EMERGENCY ACCESS ROADS (Width = 5.0m)
// ============================================================================
export const SERVICE_EMERGENCY_ROADS = [
  // 1. North-West Service & Emergency Arterial
  {
    roadId: 'ROAD-SERVICE-001',
    roadClass: 'CLASS_C_SERVICE',
    name: 'North-West Service & Emergency Arterial',
    width: 5.0,
    speedClass: 25,
    lanes: 1,
    fromNode: 'NODE-SERVICE-GATE',
    toNode: 'NODE-RESEARCH-WEST',
    isEmergencyAccessible: true,
    points: [
      { x: -270, y: 0.02, z: -210 }, // Service & Emergency Gate
      { x: -225, y: 0.02, z: -185 }, // Serving Central Energy Plant Plot P12
      { x: -180, y: 0.02, z: -145 },
      { x: -145, y: 0.02, z: -85 }   // Smooth merge into North Loop
    ]
  },
  // 2. Hero Building North Operational Service Spur
  {
    roadId: 'ROAD-SERVICE-002',
    roadClass: 'CLASS_C_SERVICE',
    name: 'Hero Building Operational MEP Access Spur',
    width: 5.0,
    speedClass: 15,
    lanes: 1,
    fromNode: 'NODE-HERO-REAR',
    toNode: 'NODE-RESEARCH-SOUTH',
    isEmergencyAccessible: true,
    points: [
      { x: 0, y: 0.02, z: -28 },     // Hero North MEP service entrance
      { x: 0, y: 0.02, z: -80 },
      { x: 0, y: 0.02, z: -135 }     // Merging into North Loop
    ]
  }
];

// Compatibility aliases for existing systems
export const PRIMARY_ROAD_POINTS = PRIMARY_CAMPUS_ROADS[0].points;
export const SECONDARY_ROADS = SECONDARY_CAMPUS_ROADS;
export const EMERGENCY_ROADS = SERVICE_EMERGENCY_ROADS;
export const CAMPUS_ROUNDABOUT = CAMPUS_ROUNDABOUTS[1]; // West Circus
export const TEARDROP_DROPOFF_LOOP = CAMPUS_ROUNDABOUTS[0]; // Central Circus

// ============================================================================
// 7. FUTURE BUILDING PARCELS (Unchanged)
// ============================================================================
export const FUTURE_BUILDING_PLOTS = [
  {
    id: 'PLOT-P01',
    name: 'Technology Zone — Innovation Tower',
    district: 'DISTRICT-TECH',
    type: 'RECTANGULAR',
    center: { x: 145, z: 35 },
    size: { width: 56, depth: 46 },
    angle: 0.15,
    areaSqm: 2200,
    plannedFloors: 8,
    useCase: 'Cloud & AI Systems Laboratories',
    drivewayPos: { x: 125, z: 50 },
    drivewayAngle: 0.65
  },
  {
    id: 'PLOT-P02',
    name: 'Technology Zone — Advanced Computing Lab',
    district: 'DISTRICT-TECH',
    type: 'L_SHAPED',
    center: { x: 210, z: 15 },
    size: { width: 54, depth: 48 },
    angle: -0.1,
    lCutout: { w: 20, d: 18 },
    areaSqm: 2050,
    plannedFloors: 6,
    useCase: 'High-Density Computing & Hardware R&D',
    drivewayPos: { x: 195, z: 20 },
    drivewayAngle: -0.8
  },
  {
    id: 'PLOT-P03',
    name: 'Technology Zone — Microelectronics Pavilion',
    district: 'DISTRICT-TECH',
    type: 'COURTYARD',
    center: { x: 235, z: -55 },
    size: { width: 58, depth: 52 },
    angle: 0.05,
    courtyard: { w: 18, d: 16 },
    areaSqm: 2400,
    plannedFloors: 5,
    useCase: 'Semiconductor & Sensor Prototyping',
    drivewayPos: { x: 225, z: -35 },
    drivewayAngle: -1.4
  },
  {
    id: 'PLOT-P07',
    name: 'Academic Zone — Life Sciences & Genomics',
    district: 'DISTRICT-TECH',
    type: 'RECTANGULAR',
    center: { x: 165, z: -115 },
    size: { width: 58, depth: 46 },
    angle: -0.18,
    areaSqm: 2150,
    plannedFloors: 6,
    useCase: 'Bio-Molecular Research & Genetics',
    drivewayPos: { x: 155, z: -135 },
    drivewayAngle: 0.8
  },
  {
    id: 'PLOT-P08',
    name: 'Academic Zone — Engineering Complex',
    district: 'DISTRICT-TECH',
    type: 'ELONGATED',
    center: { x: 225, z: -125 },
    size: { width: 62, depth: 40 },
    angle: 0.12,
    areaSqm: 1950,
    plannedFloors: 5,
    useCase: 'Civil, Mechanical & Robotics Engineering',
    drivewayPos: { x: 215, z: -130 },
    drivewayAngle: -0.4
  },
  {
    id: 'PLOT-P04',
    name: 'Research Zone — Executive Strategy & R&D',
    district: 'DISTRICT-RESEARCH',
    type: 'RECTANGULAR',
    center: { x: 60, z: -165 },
    size: { width: 56, depth: 44 },
    angle: 0.1,
    areaSqm: 2000,
    plannedFloors: 5,
    useCase: 'Corporate Strategy & Global Innovation',
    drivewayPos: { x: 60, z: -175 },
    drivewayAngle: 0.0
  },
  {
    id: 'PLOT-P05',
    name: 'Research Zone — Supercomputing & Data Hub',
    district: 'DISTRICT-RESEARCH',
    type: 'COURTYARD',
    center: { x: -20, z: -175 },
    size: { width: 62, depth: 52 },
    angle: 0.0,
    courtyard: { w: 20, d: 18 },
    areaSqm: 2600,
    plannedFloors: 4,
    useCase: 'Campus Core Supercomputer & Network Ops',
    drivewayPos: { x: -20, z: -185 },
    drivewayAngle: 0.0
  },
  {
    id: 'PLOT-P06',
    name: 'Research Zone — Autonomous Robotics Complex',
    district: 'DISTRICT-RESEARCH',
    type: 'L_SHAPED',
    center: { x: -95, z: -165 },
    size: { width: 56, depth: 46 },
    angle: -0.15,
    lCutout: { w: 18, d: 16 },
    areaSqm: 2100,
    plannedFloors: 5,
    useCase: 'Drone Proving Ground & Autonomous Robotics',
    drivewayPos: { x: -95, z: -175 },
    drivewayAngle: 0.0
  },
  {
    id: 'PLOT-P09',
    name: 'Student Forum & Conference Arena',
    district: 'DISTRICT-PUBLIC',
    type: 'COURTYARD',
    center: { x: -105, z: 95 },
    size: { width: 54, depth: 48 },
    angle: 0.12,
    courtyard: { w: 18, d: 16 },
    areaSqm: 2200,
    plannedFloors: 4,
    useCase: 'Auditorium, Dining Commons & Multi-Purpose Forum',
    drivewayPos: { x: -135, z: 95 },
    drivewayAngle: -1.2
  },
  {
    id: 'PLOT-P10',
    name: 'Design & Digital Media Arts Center',
    district: 'DISTRICT-PUBLIC',
    type: 'RECTANGULAR',
    center: { x: -60, z: 120 },
    size: { width: 50, depth: 42 },
    angle: -0.08,
    areaSqm: 1750,
    plannedFloors: 5,
    useCase: 'Digital Media Labs & XR Simulation Studios',
    drivewayPos: { x: -50, z: 100 },
    drivewayAngle: 1.0
  },
  {
    id: 'PLOT-P12',
    name: 'Service & Utility Zone — Central Energy Plant',
    district: 'DISTRICT-SERVICE',
    type: 'RECTANGULAR',
    center: { x: -215, z: -180 },
    size: { width: 62, depth: 44 },
    angle: 0.1,
    areaSqm: 2100,
    plannedFloors: 3,
    useCase: 'Central Utility Plant, MEP Operations & Fleet Depot',
    drivewayPos: { x: -220, z: -185 },
    drivewayAngle: 0.0
  }
];

// ============================================================================
// 8. CENTRAL PLAZA / ASSEMBLY AREA (Pedestrian Focal Point)
// ============================================================================
export const CENTRAL_ASSEMBLY_PLAZA = {
  id: 'PLAZA-CENTRAL-001',
  name: 'Central Plaza / Evacuation Assembly Forum',
  district: 'DISTRICT-CENTRAL',
  center: { x: -70, z: -10 },
  radius: 32.0,
  capacity: 2500,
  features: ['Concentric Amphitheater Steps', 'Center Fountain Monument', 'Promenade Allées', 'Emergency Beacon']
};

// ============================================================================
// 9. LAKE & LANDSCAPE OPEN SPACE
// ============================================================================
export const CAMPUS_LAKE = {
  id: 'LAKE-001',
  name: 'Campus Eco-Lake & Landscape Basin',
  district: 'DISTRICT-PUBLIC',
  center: { x: 125, z: 185 },
  size: { width: 95, depth: 65 },
  islandRadius: 9.5
};

// ============================================================================
// 10. SPORTS & RECREATION COMPLEX
// ============================================================================
export const SPORTS_COMPLEX = {
  id: 'SPORTS-001',
  name: 'Campus Sports & Recreation Open Space',
  district: 'DISTRICT-PUBLIC',
  center: { x: -235, z: 50 },
  trackSize: { length: 90, width: 54 },
  pitchSize: { length: 65, width: 36 },
  courtsCenter: { x: -235, z: 110 },
  courtsSize: { width: 50, depth: 32 }
};

// ============================================================================
// 11. PARKING FACILITIES
// ============================================================================
export const PARKING_FACILITIES = [
  {
    id: 'PARKING-001',
    name: 'Main Parking Area (Phase 1)',
    district: 'DISTRICT-PUBLIC',
    bounds: { minX: -245, maxX: -140, minZ: 140, maxZ: 250 },
    center: { x: -192, z: 195 },
    capacity: 220,
    hasEvChargers: true,
    hasTreeIslands: true
  },
  {
    id: 'PARKING-002',
    name: 'Secondary Parking Area (Staff / Visitors)',
    district: 'DISTRICT-TECH',
    bounds: { minX: 195, maxX: 295, minZ: 140, maxZ: 235 },
    center: { x: 245, z: 188 },
    capacity: 140,
    hasEvChargers: true,
    hasTreeIslands: true
  }
];

// ============================================================================
// 12. CAMPUS PORTALS & ENTRANCE GATES
// ============================================================================
export const CAMPUS_ENTRANCES = [
  {
    id: 'ENTRY-MAIN-001',
    name: 'Main Campus Entrance & Portal Pavilion',
    center: { x: -10, z: 295 },
    width: 28,
    hasGateCanopy: true,
    hasSecurityKiosk: true,
    hasMedianIsland: true
  },
  {
    id: 'ENTRY-SERVICE-001',
    name: 'Service / Emergency Entrance Gate',
    center: { x: -270, z: -210 },
    width: 16,
    hasGateCanopy: true,
    hasSecurityKiosk: true,
    hasMedianIsland: false
  }
];

// ============================================================================
// 13. DEFINED OPEN LAWNS & GREEN QUADRANGLES
// ============================================================================
export const CAMPUS_LAWNS = [
  {
    id: 'LAWN-GREAT-QUAD',
    name: 'The Great Lawn / Central Campus Quad',
    bounds: { minX: -130, maxX: -32, minZ: -65, maxZ: 50 },
    center: { x: -81, z: -7.5 },
    width: 98,
    depth: 115,
    hasMowingStripes: true,
    curbHeight: 0.10,
    curbWidth: 0.35
  },
  {
    id: 'LAWN-HERO-EAST',
    name: 'Hero East Flanking Lawn',
    bounds: { minX: 30, maxX: 72, minZ: 30, maxZ: 85 },
    center: { x: 51, z: 57.5 },
    width: 42,
    depth: 55,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  },
  {
    id: 'LAWN-HERO-WEST',
    name: 'Hero West Flanking Lawn',
    bounds: { minX: -72, maxX: -30, minZ: 30, maxZ: 85 },
    center: { x: -51, z: 57.5 },
    width: 42,
    depth: 55,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  },
  {
    id: 'LAWN-ACADEMIC-QUAD',
    name: 'East Academic Quad Lawn',
    bounds: { minX: 155, maxX: 235, minZ: -125, maxZ: -45 },
    center: { x: 195, z: -85 },
    width: 80,
    depth: 80,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  },
  {
    id: 'LAWN-RESEARCH-COMMONS',
    name: 'North Research Green Commons',
    bounds: { minX: -65, maxX: 45, minZ: -145, maxZ: -95 },
    center: { x: -10, z: -120 },
    width: 110,
    depth: 50,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  }
];
