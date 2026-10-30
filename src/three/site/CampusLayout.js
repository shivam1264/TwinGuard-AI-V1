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
// 2. PRIMARY CIRCULATION SPINE ROAD (~9.0m wide dual-lane boulevard)
// ============================================================================
// Starts at Main Campus Entrance on the South, sweeps gently north-east past the Lake,
// seamlessly merges into the Hero Building front drop-off loop at Z = 77,
// sweeps west past the Central Assembly Plaza, connects to the Main West Roundabout,
// ============================================================================
// 2. PRIMARY CIRCULATION SPINE ROAD (~9.0m wide dual-lane ceremonial boulevard)
// ============================================================================
// Ceremonial entry boulevard from South Main Gate directly to Hero Forecourt
export const PRIMARY_ROAD_POINTS = [
  { x: -10, y: 0.02, z: 295 },  // Main Campus Entrance (ENTRY-MAIN-001)
  { x: -5,  y: 0.02, z: 245 },  // Boulevard passing Main Parking & Lake
  { x: 5,   y: 0.02, z: 185 },  // Northbound spine
  { x: 10,  y: 0.02, z: 135 },  // Flanking ceremonial approach
  { x: 6,   y: 0.02, z: 95 },   // Approaching Hero Arrival Portico
  { x: 0,   y: 0.02, z: 82 }    // Hero Forecourt Paved Apron
];

// ============================================================================
// 3. SECONDARY DISTRICT ROADS (~6.2m to 6.8m wide dual-lane roads)
// ============================================================================
export const SECONDARY_ROADS = [
  // 1. West Civic Parkway (Hero Forecourt to Central Plaza & Roundabout)
  {
    id: 'ROAD-SECONDARY-001',
    name: 'Civic Heart & Roundabout Parkway',
    width: 6.8,
    district: 'DISTRICT-CENTRAL',
    points: [
      { x: -18,  y: 0.02, z: 80 },   // Branching west from Hero Forecourt
      { x: -55,  y: 0.02, z: 65 },   // Passing South of Central Assembly Plaza
      { x: -105, y: 0.02, z: 48 },  // Approaching Roundabout Circus
      { x: -138, y: 0.02, z: 35 }   // Merging into East rim of Roundabout
    ]
  },
  // 2. West Sports & Main Parking Access Parkway
  {
    id: 'ROAD-SECONDARY-002',
    name: 'West Sports & Parking Parkway',
    width: 6.5,
    district: 'DISTRICT-PUBLIC',
    points: [
      { x: -160, y: 0.02, z: 57 },  // From South rim of Roundabout
      { x: -165, y: 0.02, z: 110 }, // Between Sports Area and Main Parking
      { x: -160, y: 0.02, z: 175 }, // Fronting Main Parking Area
      { x: -130, y: 0.02, z: 235 }, // South-West parking exit
      { x: -65,  y: 0.02, z: 275 }, // Sweeping to Main Entrance
      { x: -18,  y: 0.02, z: 295 }  // Connecting to Entrance apron
    ]
  },
  // 3. North Research & Innovation Ring
  {
    id: 'ROAD-SECONDARY-003',
    name: 'North Research Ring Parkway',
    width: 6.5,
    district: 'DISTRICT-RESEARCH',
    points: [
      { x: -160, y: 0.02, z: 13 },  // From North rim of Roundabout
      { x: -165, y: 0.02, z: -45 }, // Heading North past Sports Area
      { x: -150, y: 0.02, z: -105 },// Approaching Research Zone
      { x: -130, y: 0.02, z: -175 },// Fronting Research Plot P06
      { x: -80,  y: 0.02, z: -210 },// North of Plot P05
      { x: 10,   y: 0.02, z: -215 },// North campus boundary drive
      { x: 95,   y: 0.02, z: -185 },// Fronting Plot P04
      { x: 145,  y: 0.02, z: -135 } // Academic Quad junction
    ]
  },
  // 4. East Technology & Academic Loop
  {
    id: 'ROAD-SECONDARY-004',
    name: 'East Technology & Academic Loop',
    width: 6.5,
    district: 'DISTRICT-TECH',
    points: [
      { x: 10,  y: 0.02, z: 135 },  // Branch from Main Spine
      { x: 75,  y: 0.02, z: 110 },  // Curves between Hero Building & Lake
      { x: 155, y: 0.02, z: 85 },   // Fronting Plot P01 (Technology South)
      { x: 215, y: 0.02, z: 45 },   // Fronting Plot P02 (Technology East)
      { x: 245, y: 0.02, z: -25 },  // East perimeter scenic drive
      { x: 235, y: 0.02, z: -90 },  // Fronting Plot P08 (Academic East)
      { x: 195, y: 0.02, z: -135 }, // Fronting Plot P07 (Academic North)
      { x: 145, y: 0.02, z: -135 }  // Connecting to North Research Ring
    ]
  },
  // 5. Central Plaza Enclosure Crescent
  {
    id: 'ROAD-SECONDARY-005',
    name: 'Central Assembly Crescent',
    width: 5.8,
    district: 'DISTRICT-CENTRAL',
    points: [
      { x: -55,  y: 0.02, z: 65 },   // From West Civic Parkway
      { x: -95,  y: 0.02, z: 40 },   // South-West curve of Plaza
      { x: -112, y: 0.02, z: -10 },  // West arc of Plaza
      { x: -95,  y: 0.02, z: -55 },  // North-West curve of Plaza
      { x: -45,  y: 0.02, z: -60 },  // North arc behind Hero Building
      { x: -15,  y: 0.02, z: -20 },  // Flanking Hero Building West facade
      { x: -18,  y: 0.02, z: 80 }    // Reconnecting to Hero forecourt
    ]
  },
  // 6. Sports Complex Access Spur
  {
    id: 'ROAD-SECONDARY-006',
    name: 'Sports Complex Access Spur',
    width: 6.0,
    district: 'DISTRICT-PUBLIC',
    points: [
      { x: -182, y: 0.02, z: 35 },  // From West rim of Roundabout
      { x: -205, y: 0.02, z: 35 },
      { x: -225, y: 0.02, z: 20 }   // Running track drop-off
    ]
  }
];

// ============================================================================
// 4. EMERGENCY & SERVICE ROUTES (~5.5m wide high-capacity access)
// ============================================================================
export const EMERGENCY_ROADS = [
  // 1. Service / Emergency Entrance Corridor
  {
    id: 'ROAD-EMERGENCY-001',
    name: 'North-West Service & Emergency Arterial',
    width: 5.8,
    isDedicatedEmergency: true,
    district: 'DISTRICT-SERVICE',
    points: [
      { x: -270, y: 0.02, z: -210 }, // Service & Emergency Gate (ENTRY-SERVICE-001)
      { x: -225, y: 0.02, z: -185 }, // Checkpoint serving Service & Utility Zone
      { x: -185, y: 0.02, z: -140 }, // Bypassing Sports area
      { x: -150, y: 0.02, z: -105 }  // Direct merge into North Research Ring
    ]
  }
];

// ============================================================================
// 5. CAMPUS ROUNDABOUT (Major West Circus)
// ============================================================================
export const CAMPUS_ROUNDABOUT = {
  id: 'ROUNDABOUT-001',
  name: 'West Campus Innovation Circus',
  center: { x: -160, y: 0.02, z: 35 },
  innerRadius: 12.0,
  outerRadius: 22.0,
  islandRadius: 11.2
};

// ============================================================================
// 6. FUTURE BUILDING PARCELS (Authentic Development Parcels — Matching Image)
// ============================================================================
// Notice: These are NOT solid grey boxes!
// Each parcel has a defined organic footprint, stone perimeter curb,
// landscaped setback, driveway apron, and identity totem.
export const FUTURE_BUILDING_PLOTS = [
  // --- TECHNOLOGY ZONE (East of Hero Building) ---
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
    drivewayPos: { x: 120, z: 62 },
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
    drivewayPos: { x: 232, z: 35 },
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
    drivewayPos: { x: 215, z: -78 },
    drivewayAngle: -1.4
  },

  // --- ACADEMIC ZONE (North-East) ---
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
    drivewayPos: { x: 140, z: -105 },
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
    drivewayPos: { x: 205, z: -142 },
    drivewayAngle: -0.4
  },

  // --- RESEARCH ZONE (North of Central Plaza & Hero Building) ---
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
    drivewayPos: { x: 60, z: -142 },
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
    drivewayPos: { x: -20, z: -150 },
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
    drivewayPos: { x: -95, z: -140 },
    drivewayAngle: 0.0
  },

  // --- PUBLIC / STUDENT ZONE (South-West) ---
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
    drivewayPos: { x: -130, z: 105 },
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
    drivewayPos: { x: -45, z: 95 },
    drivewayAngle: 1.0
  },

  // --- SERVICE & UTILITY ZONE (North-West) ---
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
    drivewayPos: { x: -215, z: -160 },
    drivewayAngle: 0.0
  }
];

// ============================================================================
// 7. CENTRAL PLAZA / ASSEMBLY AREA (Directly matching Reference Image)
// ============================================================================
// Located immediately west of the Hero Building.
// Circular / horseshoe layout, concentric amphitheater steps, central fountain/monument.
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
// 8. LAKE & LANDSCAPE OPEN SPACE (South-East, matching Reference Image)
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
// 9. SPORTS & RECREATION COMPLEX (West, matching Reference Image)
// ============================================================================
export const SPORTS_COMPLEX = {
  id: 'SPORTS-001',
  name: 'Campus Sports & Recreation Open Space',
  district: 'DISTRICT-PUBLIC',
  center: { x: -235, z: 50 },
  trackSize: { length: 90, width: 54 }, // Standard 400m running track proportions
  pitchSize: { length: 65, width: 36 }, // Inner green soccer/athletics pitch
  courtsCenter: { x: -235, z: 110 },
  courtsSize: { width: 50, depth: 32 }  // Blue/green hardcourts with white playing lines
};

// ============================================================================
// 10. PARKING FACILITIES (Matching Reference Image)
// ============================================================================
export const PARKING_FACILITIES = [
  // A. Main Parking Area (Phase 1, South-West)
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
  // B. Secondary Parking Area (Staff / Visitors, South-East)
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
// 11. CAMPUS PORTALS & ENTRANCE GATES
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
