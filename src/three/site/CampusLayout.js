// ============================================================================
// TWIN GUARD CAMPUS MASTER PLAN — ARCHITECTURAL GIS & SPATIAL SPECIFICATION
// ============================================================================
// Reconstructed in exact 3D spatial alignment with the authoritative
// Campus Master Plan Top-Down Architectural Infographic:
//
// 1. Central Hero Building (10-Storey Tower at 0, 0, 0)
// 2. Central Core Circular Ring Road & Grand South Forecourt
// 3. Central Entrance Axis with Mid-Point Traffic Circus / Roundabout
// 4. Primary Outer Oval Circulation Ring Road (12m width)
// 5. Four Controlled Campus Roundabouts (West, East, North-West, North-East)
// 6. Secondary Connector Arterials (8m width)
// 7. Nine Radiating Curving Pedestrian Promenades (3-4m width)
// 8. Exact 12 Designated Supporting Building Parcels in Radial Clusters
// 9. West Sports Complex (Track, Pitch, Hardcourts)
// 10. Symmetric Surface Parking Infrastructure (West Lot 10 & East Lot 13)
// 11. South-East Organic Landscape Lake & Fountain Pavilion
// 12. South Main Ceremonial Gate & Highway Avenue

export const CAMPUS_BOUNDS = {
  minX: -360,
  maxX: 360,
  minZ: -280,
  maxZ: 280,
  width: 720,
  depth: 560
};

// ============================================================================
// 1. FIVE MASTER FUNCTIONAL DISTRICTS
// ============================================================================
export const CAMPUS_DISTRICTS = [
  {
    id: 'DISTRICT-CENTRAL',
    name: 'District 1 — Central / Hero & Civic Heart',
    theme: 'Flagship Digital Twin, Central Assembly Plaza & Grand Forecourt',
    bounds: { minX: -110, maxX: 110, minZ: -80, maxZ: 100 },
    center: { x: 0, z: 0 },
    primaryUses: ['Main Hero Building (Center)', 'Central Core Ring', 'Forecourt Plaza']
  },
  {
    id: 'DISTRICT-NORTH-ACADEMIC',
    name: 'District 2 — Academic & Research Cluster (North)',
    theme: 'Academic Blocks, Research Centers & Strategy Labs',
    bounds: { minX: -180, maxX: 180, minZ: -250, maxZ: -80 },
    center: { x: 0, z: -150 },
    primaryUses: ['Building 3: Academic Block', 'Building 2: Research Center', 'Building 4: Innovation Lab']
  },
  {
    id: 'DISTRICT-EAST-TECH',
    name: 'District 3 — Technology, Admin & Library District (East)',
    theme: 'IT Command, University Library & Administrative Center',
    bounds: { minX: 120, maxX: 320, minZ: -160, maxZ: 120 },
    center: { x: 210, z: -20 },
    primaryUses: ['Building 5: Admin / Offices', 'Building 6: Library', 'Building 7: IT / Computer Center']
  },
  {
    id: 'DISTRICT-WEST-CIVIC',
    name: 'District 4 — Civic Auditorium & Sports Complex (West)',
    theme: 'Campus Events, Performing Arts & Athletic Facilities',
    bounds: { minX: -320, maxX: -110, minZ: -120, maxZ: 80 },
    center: { x: -210, z: -10 },
    primaryUses: ['Building 8: Auditorium', 'Zone 9: Sports Complex']
  },
  {
    id: 'DISTRICT-SOUTH-PUBLIC',
    name: 'District 5 — Arrival, Residential, Lake & Parking (South)',
    theme: 'Student Residences, Central Eco-Lake & Dual Surface Parking',
    bounds: { minX: -340, maxX: 340, minZ: 70, maxZ: 260 },
    center: { x: 0, z: 170 },
    primaryUses: ['Building 11: Hostel / Residential', 'Zone 12: Central Lake', 'Parking 10: West Lot', 'Parking 13: East Lot']
  }
];

// ============================================================================
// 2. ROAD HIERARCHY SPECIFICATIONS
// ============================================================================
export const ROAD_CLASSES = {
  CLASS_A_PRIMARY: {
    type: 'CLASS_A_PRIMARY',
    name: 'Primary Campus Road',
    targetWidth: 12.0,
    speedLimitKmH: 40,
    lanes: 2,
    hasCenterline: true,
    curbWidth: 0.35,
    curbHeight: 0.12
  },
  CLASS_B_SECONDARY: {
    type: 'CLASS_B_SECONDARY',
    name: 'Secondary Campus Road',
    targetWidth: 8.0,
    speedLimitKmH: 25,
    lanes: 2,
    hasCenterline: false,
    curbWidth: 0.28,
    curbHeight: 0.10
  },
  CLASS_C_SERVICE: {
    type: 'CLASS_C_SERVICE',
    name: 'Service Road',
    targetWidth: 6.0,
    speedLimitKmH: 20,
    lanes: 1,
    hasCenterline: false,
    curbWidth: 0.24,
    curbHeight: 0.08
  }
};

// ============================================================================
// 3. CONTROLLED TRAFFIC ROUNDABOUTS (EXACT TO REFERENCE INFOGRAPHIC)
// ============================================================================
export const CAMPUS_ROUNDABOUTS = [
  // A. Entrance Axis Circus (Between Main Gate & Hero Forecourt at Z = 86)
  {
    id: 'ROUNDABOUT-ENTRANCE-AXIS',
    name: 'Entrance Axis Central Circus',
    center: { x: 0, y: 0.02, z: 86 },
    outerDiameter: 34.0,
    outerRadius: 17.0,
    roadwayWidth: 6.8,
    innerRadius: 10.2,
    islandRadius: 10.0,
    islandDiameter: 20.0,
    hasCenterpiece: true,
    feature: 'FOUNTAIN'
  },
  // B. West Primary Ring Roundabout (Intersection with West Connector at X = -185, Z = 75)
  {
    id: 'ROUNDABOUT-WEST-RING',
    name: 'West Primary Ring Roundabout',
    center: { x: -175, y: 0.02, z: 75 },
    outerDiameter: 26.0,
    outerRadius: 13.0,
    roadwayWidth: 5.8,
    innerRadius: 7.2,
    islandRadius: 7.0,
    islandDiameter: 14.0,
    hasCenterpiece: true,
    feature: 'OBELISK'
  },
  // C. East Primary Ring Roundabout (Intersection with East Connector at X = 185, Z = 75)
  {
    id: 'ROUNDABOUT-EAST-RING',
    name: 'East Primary Ring Roundabout',
    center: { x: 175, y: 0.02, z: 75 },
    outerDiameter: 26.0,
    outerRadius: 13.0,
    roadwayWidth: 5.8,
    innerRadius: 7.2,
    islandRadius: 7.0,
    islandDiameter: 14.0,
    hasCenterpiece: true,
    feature: 'OBELISK'
  },
  // D. North-West Roundabout (Between Research Center P06 & Academic Blocks at X = -145, Z = -140)
  {
    id: 'ROUNDABOUT-NW',
    name: 'North-West Academic Circus',
    center: { x: -140, y: 0.02, z: -135 },
    outerDiameter: 22.0,
    outerRadius: 11.0,
    roadwayWidth: 5.2,
    innerRadius: 5.8,
    islandRadius: 5.6,
    islandDiameter: 11.2,
    hasCenterpiece: true,
    feature: 'PLANTER'
  },
  // E. North-East Roundabout (Between Innovation Lab P01 & Academic Blocks at X = 145, Z = -140)
  {
    id: 'ROUNDABOUT-NE',
    name: 'North-East Technology Circus',
    center: { x: 140, y: 0.02, z: -135 },
    outerDiameter: 22.0,
    outerRadius: 11.0,
    roadwayWidth: 5.2,
    innerRadius: 5.8,
    islandRadius: 5.6,
    islandDiameter: 11.2,
    hasCenterpiece: true,
    feature: 'PLANTER'
  }
];

// ============================================================================
// 4. PRIMARY CAMPUS ROADS (12.0m Carriageway)
// ============================================================================
export const PRIMARY_CAMPUS_ROADS = [
  // 1. South Main Entrance Ceremonial Avenue (Gate Z=240 to Entrance Axis Circus Z=86)
  {
    roadId: 'ROAD-PRIMARY-ENTRANCE',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'Central Entrance Ceremonial Avenue',
    width: 12.0,
    speedClass: 40,
    lanes: 2,
    points: [
      { x: 0, y: 0.02, z: 240 },
      { x: 0, y: 0.02, z: 195 },
      { x: 0, y: 0.02, z: 145 },
      { x: 0, y: 0.02, z: 103 } // Connects into Entrance Axis Circus
    ]
  },
  // 2. Avenue Continuation from Circus north to Hero Building Forecourt Drop-off (Z=86 to Z=42)
  {
    roadId: 'ROAD-PRIMARY-CORE-AXIS',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'Hero Forecourt Arrival Avenue',
    width: 10.0,
    speedClass: 30,
    lanes: 2,
    points: [
      { x: 0, y: 0.02, z: 69 },
      { x: 0, y: 0.02, z: 42 } // Connects into Hero Forecourt Apron
    ]
  },
  // 3. Primary Circulation Ring Road (Continuous outer loop encircling the campus core)
  // Left half: West Ring (South Circus around West Auditorium & Sports to North)
  {
    roadId: 'ROAD-PRIMARY-RING-WEST',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'Primary Outer Ring Road — West Arc',
    width: 11.0,
    speedClass: 35,
    lanes: 2,
    points: [
      { x: -17,  y: 0.02, z: 86 },  // From West rim of Entrance Circus
      { x: -75,  y: 0.02, z: 84 },  // Flowing between Residential & West Parking
      { x: -162, y: 0.02, z: 75 },  // East rim of West Ring Roundabout
      { x: -188, y: 0.02, z: 75 },  // West rim of West Ring Roundabout
      { x: -210, y: 0.02, z: 40 },  // Flowing past Sports Complex & Auditorium
      { x: -215, y: 0.02, z: -30 }, // West perimeter curve
      { x: -205, y: 0.02, z: -90 }, // Sweeping toward NW Roundabout
      { x: -175, y: 0.02, z: -130 },// Approaching NW Roundabout
      { x: -151, y: 0.02, z: -135 } // NW Roundabout West rim
    ]
  },
  // Right half: East Ring (South Circus around Central Lake & East Tech Zone to North)
  {
    roadId: 'ROAD-PRIMARY-RING-EAST',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'Primary Outer Ring Road — East Arc',
    width: 11.0,
    speedClass: 35,
    lanes: 2,
    points: [
      { x: 17,   y: 0.02, z: 86 },  // From East rim of Entrance Circus
      { x: 75,   y: 0.02, z: 84 },  // Flowing between Central Lake & East Parking
      { x: 162,  y: 0.02, z: 75 },  // West rim of East Ring Roundabout
      { x: 188,  y: 0.02, z: 75 },  // East rim of East Ring Roundabout
      { x: 210,  y: 0.02, z: 40 },  // Flowing past IT Center & Library
      { x: 215,  y: 0.02, z: -30 }, // East perimeter curve
      { x: 205,  y: 0.02, z: -90 }, // Sweeping toward NE Roundabout
      { x: 175,  y: 0.02, z: -130 },// Approaching NE Roundabout
      { x: 151,  y: 0.02, z: -135 } // NE Roundabout East rim
    ]
  },
  // North Header Road connecting NW and NE Roundabouts behind Academic Cluster
  {
    roadId: 'ROAD-PRIMARY-RING-NORTH',
    roadClass: 'CLASS_A_PRIMARY',
    name: 'Primary North Academic Arterial',
    width: 11.0,
    speedClass: 35,
    lanes: 2,
    points: [
      { x: -129, y: 0.02, z: -135 },// NW Roundabout East rim
      { x: -95,  y: 0.02, z: -155 },// Sweeping north of Academic Cluster
      { x: 0,    y: 0.02, z: -165 },// Directly north of Main Academic Block P05
      { x: 95,   y: 0.02, z: -155 },// Sweeping toward Innovation Lab
      { x: 129,  y: 0.02, z: -135 } // NE Roundabout West rim
    ]
  }
];

// ============================================================================
// 5. SECONDARY CAMPUS ROADS (8.0m Carriageway)
// ============================================================================
export const SECONDARY_CAMPUS_ROADS = [
  // 1. Central Core Circular Ring Road (Directly surrounding Main Hero Building)
  // Encircles the Hero Building at radius ~52m (R_in=48m, R_out=56m)
  {
    roadId: 'ROAD-SECONDARY-CORE-RING',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'Central Core Circular Ring Road',
    width: 8.0,
    speedClass: 25,
    lanes: 2,
    points: [
      { x: 0,   y: 0.02, z: 46 },   // South drop-off
      { x: 38,  y: 0.02, z: 36 },   // South-East curve
      { x: 52,  y: 0.02, z: 0 },    // East flanking
      { x: 38,  y: 0.02, z: -36 },  // North-East curve
      { x: 0,   y: 0.02, z: -46 },  // North rear
      { x: -38, y: 0.02, z: -36 },  // North-West curve
      { x: -52, y: 0.02, z: 0 },    // West flanking
      { x: -38, y: 0.02, z: 36 },   // South-West curve
      { x: 0,   y: 0.02, z: 46 }    // Closes loop
    ]
  },
  // 2. West Parking & Sports Complex Access Connector
  {
    roadId: 'ROAD-SECONDARY-WEST-PARKING',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'West Parking & Sports Parkway',
    width: 8.0,
    speedClass: 25,
    lanes: 2,
    points: [
      { x: -175, y: 0.02, z: 88 },  // From south rim of West Roundabout
      { x: -175, y: 0.02, z: 125 }, // Along East edge of West Parking
      { x: -175, y: 0.02, z: 195 }, // South-East corner of West Parking
      { x: -215, y: 0.02, z: 220 }, // South entrance gate of West Parking
      { x: -265, y: 0.02, z: 220 }  // Outer perimeter merge
    ]
  },
  // 3. East Parking & Central Lake Access Connector
  {
    roadId: 'ROAD-SECONDARY-EAST-PARKING',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'East Parking & Lake Parkway',
    width: 8.0,
    speedClass: 25,
    lanes: 2,
    points: [
      { x: 175, y: 0.02, z: 88 },  // From south rim of East Roundabout
      { x: 175, y: 0.02, z: 125 }, // Along West edge of East Parking
      { x: 175, y: 0.02, z: 195 }, // South-West corner of East Parking
      { x: 215, y: 0.02, z: 220 }, // South entrance gate of East Parking
      { x: 265, y: 0.02, z: 220 }  // Outer perimeter merge
    ]
  },
  // 4. North Academic Forecourt Loop (Between Central Core and Academic Cluster)
  {
    roadId: 'ROAD-SECONDARY-NORTH-ACADEMIC-SPUR',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'North Academic Forecourt Access Road',
    width: 7.5,
    speedClass: 25,
    lanes: 2,
    points: [
      { x: -140, y: 0.02, z: -124 },// South rim of NW Roundabout
      { x: -95,  y: 0.02, z: -105 },// South of Research Center P06 & Academic P04
      { x: 0,    y: 0.02, z: -102 },// Forecourt of Central Academic Block P05
      { x: 95,   y: 0.02, z: -105 },// South of Academic P08 & Innovation P01
      { x: 140,  y: 0.02, z: -124 } // South rim of NE Roundabout
    ]
  },
  // 5. East Technology Inner Access Spine (Serving IT Center, Library, Admin)
  {
    roadId: 'ROAD-SECONDARY-EAST-TECH-SPINE',
    roadClass: 'CLASS_B_SECONDARY',
    name: 'East Technology Inner Access Road',
    width: 7.5,
    speedClass: 20,
    lanes: 2,
    points: [
      { x: 175, y: 0.02, z: 62 },  // North rim of East Roundabout
      { x: 175, y: 0.02, z: 15 },  // Flanking between Library & IT Center
      { x: 175, y: 0.02, z: -40 }, // Flanking Admin / Offices
      { x: 155, y: 0.02, z: -90 }, // Sweeping toward NE Roundabout
      { x: 140, y: 0.02, z: -124 } // Merging into NE Roundabout
    ]
  }
];

// ============================================================================
// 6. SERVICE & EMERGENCY ROADS (6.0m Carriageway)
// ============================================================================
export const SERVICE_EMERGENCY_ROADS = [
  // 1. Central Core North MEP Spur (Connects Hero rear at Z=-28 to North loop Z=-102)
  {
    roadId: 'ROAD-SERVICE-HERO-NORTH',
    roadClass: 'CLASS_C_SERVICE',
    name: 'Hero North MEP Operations Service Spur',
    width: 6.0,
    speedClass: 15,
    lanes: 1,
    points: [
      { x: 0, y: 0.02, z: -26 },
      { x: 0, y: 0.02, z: -65 },
      { x: 0, y: 0.02, z: -102 }
    ]
  },
  // 2. West Auditorium Service / Loading Dock Access Spur
  {
    roadId: 'ROAD-SERVICE-AUDITORIUM',
    roadClass: 'CLASS_C_SERVICE',
    name: 'Auditorium Backstage & Loading Service Spur',
    width: 5.5,
    speedClass: 15,
    lanes: 1,
    points: [
      { x: -175, y: 0.02, z: 20 },
      { x: -155, y: 0.02, z: -10 },
      { x: -155, y: 0.02, z: -40 }
    ]
  }
];

// ============================================================================
// 7. EXACT 12 SUPPORTING BUILDING PARCELS (MATCHING INFOGRAPHIC NUMBERING)
// ============================================================================
// Note: Building 1 is the existing 10-Storey Hero Building at (0, 0, 0)
export const FUTURE_BUILDING_PLOTS = [
  // (2) Research Center (North-West)
  {
    id: 'PLOT-P06', // Re-mapped to Building 2
    name: '2. Research Center',
    district: 'DISTRICT-NORTH-ACADEMIC',
    type: 'L_SHAPED',
    center: { x: -175, z: -145 },
    size: { width: 48, depth: 40 },
    angle: 0.15,
    lCutout: { w: 16, d: 15 },
    areaSqm: 1850,
    plannedFloors: 5,
    useCase: 'Research Center & Proving Grounds',
    drivewayPos: { x: -155, z: -140 },
    drivewayAngle: 0.3
  },
  // (3) Academic Block Cluster (North - 3 Symmetric Buildings)
  // West Wing Academic
  {
    id: 'PLOT-P04',
    name: '3A. Academic Block (West Wing)',
    district: 'DISTRICT-NORTH-ACADEMIC',
    type: 'RECTANGULAR',
    center: { x: -65, z: -138 },
    size: { width: 44, depth: 36 },
    angle: 0.0,
    areaSqm: 1580,
    plannedFloors: 5,
    useCase: 'Lecture Theaters & Science Classrooms',
    drivewayPos: { x: -65, z: -115 },
    drivewayAngle: 0.0
  },
  // Center Main Academic Flagship
  {
    id: 'PLOT-P05',
    name: '3. Academic Block (Central Hall)',
    district: 'DISTRICT-NORTH-ACADEMIC',
    type: 'COURTYARD',
    center: { x: 0, z: -138 },
    size: { width: 52, depth: 42 },
    angle: 0.0,
    courtyard: { w: 18, d: 16 },
    areaSqm: 2180,
    plannedFloors: 5,
    useCase: 'Central Academic Administration & Great Hall',
    drivewayPos: { x: 0, z: -115 },
    drivewayAngle: 0.0
  },
  // East Wing Academic
  {
    id: 'PLOT-P08',
    name: '3B. Academic Block (East Wing)',
    district: 'DISTRICT-NORTH-ACADEMIC',
    type: 'ELONGATED',
    center: { x: 65, z: -138 },
    size: { width: 44, depth: 36 },
    angle: 0.0,
    areaSqm: 1580,
    plannedFloors: 5,
    useCase: 'Engineering Labs & Academic Department',
    drivewayPos: { x: 65, z: -115 },
    drivewayAngle: 0.0
  },
  // (4) Innovation Lab (North-East)
  {
    id: 'PLOT-P01', // Re-mapped to Building 4
    name: '4. Innovation Lab',
    district: 'DISTRICT-NORTH-ACADEMIC',
    type: 'RECTANGULAR',
    center: { x: 175, z: -145 },
    size: { width: 48, depth: 40 },
    angle: -0.15,
    areaSqm: 1920,
    plannedFloors: 6,
    useCase: 'AI & Robotics Innovation Laboratories',
    drivewayPos: { x: 155, z: -140 },
    drivewayAngle: -0.3
  },
  // (5) Admin / Offices (North-East Perimeter)
  {
    id: 'PLOT-P03', // Re-mapped to Building 5 (Terracotta tone)
    name: '5. Admin / Offices',
    district: 'DISTRICT-EAST-TECH',
    type: 'COURTYARD',
    center: { x: 245, z: -110 },
    size: { width: 46, depth: 40 },
    angle: 0.0,
    courtyard: { w: 15, d: 14 },
    areaSqm: 1840,
    plannedFloors: 5,
    useCase: 'Campus Administration & Executive Offices',
    drivewayPos: { x: 215, z: -100 },
    drivewayAngle: -0.8
  },
  // (6) Library (East)
  {
    id: 'PLOT-P07', // Re-mapped to Building 6 (Clean white precast)
    name: '6. Library',
    district: 'DISTRICT-EAST-TECH',
    type: 'RECTANGULAR',
    center: { x: 245, z: -30 },
    size: { width: 50, depth: 42 },
    angle: 0.0,
    areaSqm: 2100,
    plannedFloors: 5,
    useCase: 'Central University Library & Media Center',
    drivewayPos: { x: 215, z: -30 },
    drivewayAngle: -1.57
  },
  // (7) IT / Computer Center (South-East Core)
  {
    id: 'PLOT-P02', // Re-mapped to Building 7
    name: '7. IT / Computer Center',
    district: 'DISTRICT-EAST-TECH',
    type: 'L_SHAPED',
    center: { x: 245, z: 50 },
    size: { width: 46, depth: 42 },
    angle: 0.0,
    lCutout: { w: 16, d: 15 },
    areaSqm: 1800,
    plannedFloors: 6,
    useCase: 'Campus Data Center & Computer Science Labs',
    drivewayPos: { x: 215, z: 50 },
    drivewayAngle: -1.57
  },
  // (8) Auditorium (West Core)
  {
    id: 'PLOT-P09', // Re-mapped to Building 8 (Curved sculptural hall)
    name: '8. Auditorium',
    district: 'DISTRICT-WEST-CIVIC',
    type: 'COURTYARD',
    center: { x: -145, z: -15 },
    size: { width: 52, depth: 44 },
    angle: 0.0,
    courtyard: { w: 16, d: 15 },
    areaSqm: 2280,
    plannedFloors: 4,
    useCase: 'Grand Auditorium, Convocation Hall & Theater',
    drivewayPos: { x: -115, z: -15 },
    drivewayAngle: 1.57
  },
  // (11) Hostel / Residential (South-West)
  {
    id: 'PLOT-P10', // Dual-wing student housing
    name: '11A. Hostel / Residential (North Wing)',
    district: 'DISTRICT-SOUTH-PUBLIC',
    type: 'RECTANGULAR',
    center: { x: -85, z: 125 },
    size: { width: 44, depth: 36 },
    angle: 0.0,
    areaSqm: 1580,
    plannedFloors: 5,
    useCase: 'Undergraduate Residences & Student Commons',
    drivewayPos: { x: -85, z: 95 },
    drivewayAngle: 0.0
  },
  {
    id: 'PLOT-P12', // South wing residential
    name: '11B. Hostel / Residential (South Wing)',
    district: 'DISTRICT-SOUTH-PUBLIC',
    type: 'RECTANGULAR',
    center: { x: -45, z: 145 },
    size: { width: 44, depth: 36 },
    angle: 0.0,
    areaSqm: 1580,
    plannedFloors: 4,
    useCase: 'Graduate Student Residences & Dining Hall',
    drivewayPos: { x: -45, z: 115 },
    drivewayAngle: 0.0
  }
];

// ============================================================================
// 8. CENTRAL FORECOURT & PLAZA SPECIFICATION
// ============================================================================
export const CENTRAL_ASSEMBLY_PLAZA = {
  id: 'PLAZA-HERO-FORECOURT',
  name: 'Hero Central Forecourt & Arrival Plaza',
  district: 'DISTRICT-CENTRAL',
  center: { x: 0, z: 32 },
  radius: 20.0,
  capacity: 2500,
  features: ['Grand Stone Forecourt', 'Ceremonial Planters', 'Drop-off Portico']
};

// ============================================================================
// 9. (12) CENTRAL LAKE & PLAZA (SOUTH-EAST AS SHOWN IN REFERENCE)
// ============================================================================
export const CAMPUS_LAKE = {
  id: 'LAKE-001',
  name: '12. Central Lake / Plaza',
  district: 'DISTRICT-SOUTH-PUBLIC',
  center: { x: 95, z: 145 },
  size: { width: 92, depth: 64 },
  islandRadius: 9.0,
  hasBridge: true
};

// ============================================================================
// 10. (9) SPORTS COMPLEX (WEST AS SHOWN IN REFERENCE)
// ============================================================================
export const SPORTS_COMPLEX = {
  id: 'SPORTS-001',
  name: '9. Sports Complex',
  district: 'DISTRICT-WEST-CIVIC',
  center: { x: -225, z: -15 },
  trackSize: { length: 88, width: 54 },
  pitchSize: { length: 64, width: 36 },
  courtsCenter: { x: -225, z: 42 },
  courtsSize: { width: 48, depth: 32 }
};

// ============================================================================
// 11. (10) & (13) SURFACE PARKING INFRASTRUCTURE
// ============================================================================
export const PARKING_FACILITIES = [
  // (10) Parking Area - West (South-West Quad)
  {
    id: 'PARKING-001',
    name: '10. Parking Area - West',
    district: 'DISTRICT-SOUTH-PUBLIC',
    bounds: { minX: -275, maxX: -185, minZ: 95, maxZ: 215 },
    center: { x: -230, z: 155 },
    capacity: 260,
    hasEvChargers: true,
    hasTreeIslands: true
  },
  // (13) Parking Area - East (South-East Quad)
  {
    id: 'PARKING-002',
    name: '13. Parking Area - East',
    district: 'DISTRICT-SOUTH-PUBLIC',
    bounds: { minX: 185, maxX: 275, minZ: 95, maxZ: 215 },
    center: { x: 230, z: 155 },
    capacity: 260,
    hasEvChargers: true,
    hasTreeIslands: true
  }
];

// ============================================================================
// 12. CAMPUS ENTRANCES
// ============================================================================
export const CAMPUS_ENTRANCES = [
  {
    id: 'ENTRY-MAIN-001',
    name: 'Main Campus Entrance Portal Pavilion',
    center: { x: 0, z: 240 },
    width: 28,
    hasGateCanopy: true,
    hasSecurityKiosk: true,
    hasMedianIsland: true
  }
];

// ============================================================================
// 13. MASTER PEDESTRIAN PROMENADE SPOKES (9 RADIATING SPOKES)
// ============================================================================
export const MASTER_PEDESTRIAN_PATHS = [
  // 1. South Ceremonial Arrival Promenade
  {
    id: 'PATH-SPOKE-SOUTH',
    name: 'Ceremonial Arrival Promenade',
    width: 5.5,
    points: [
      { x: 0, y: 0.03, z: 86 },
      { x: 0, y: 0.03, z: 52 },
      { x: 0, y: 0.03, z: 28 } // Hero South Portico
    ]
  },
  // 2. North Academic Axial Promenade
  {
    id: 'PATH-SPOKE-NORTH',
    name: 'North Academic Axis Walkway',
    width: 5.0,
    points: [
      { x: 0, y: 0.03, z: -26 },
      { x: 0, y: 0.03, z: -70 },
      { x: 0, y: 0.03, z: -115 } // Central Academic Hall P05
    ]
  },
  // 3. West Auditorium Promenade
  {
    id: 'PATH-SPOKE-WEST',
    name: 'West Civic & Auditorium Promenade',
    width: 4.8,
    points: [
      { x: -28, y: 0.03, z: 0 },
      { x: -75, y: 0.03, z: -5 },
      { x: -115, y: 0.03, z: -15 } // Auditorium P09
    ]
  },
  // 4. East Library Promenade
  {
    id: 'PATH-SPOKE-EAST',
    name: 'East Knowledge & Library Promenade',
    width: 4.8,
    points: [
      { x: 28, y: 0.03, z: 0 },
      { x: 85, y: 0.03, z: -10 },
      { x: 195, y: 0.03, z: -25 } // Library P07
    ]
  },
  // 5. North-West Research Spoke
  {
    id: 'PATH-SPOKE-NW',
    name: 'North-West Research Diagonal',
    width: 4.0,
    points: [
      { x: -26, y: 0.03, z: -22 },
      { x: -75, y: 0.03, z: -65 },
      { x: -135, y: 0.03, z: -115 } // Research Center P06
    ]
  },
  // 6. North-East Innovation Spoke
  {
    id: 'PATH-SPOKE-NE',
    name: 'North-East Innovation Diagonal',
    width: 4.0,
    points: [
      { x: 26, y: 0.03, z: -22 },
      { x: 75, y: 0.03, z: -65 },
      { x: 135, y: 0.03, z: -115 } // Innovation Lab P01
    ]
  },
  // 7. South-West Residential Spoke
  {
    id: 'PATH-SPOKE-SW',
    name: 'South-West Student Life Diagonal',
    width: 4.0,
    points: [
      { x: -26, y: 0.03, z: 24 },
      { x: -55, y: 0.03, z: 65 },
      { x: -85, y: 0.03, z: 105 } // Hostel 11A
    ]
  },
  // 8. South-East Central Lake Spoke
  {
    id: 'PATH-SPOKE-SE',
    name: 'South-East Lake Promenade Walk',
    width: 4.5,
    points: [
      { x: 26, y: 0.03, z: 24 },
      { x: 55, y: 0.03, z: 75 },
      { x: 85, y: 0.03, z: 115 } // Central Lake Shoreline
    ]
  },
  // 9. West Sports Parkway Link
  {
    id: 'PATH-SPORTS-LINK',
    name: 'Auditorium to Sports Complex Link',
    width: 3.8,
    points: [
      { x: -145, y: 0.03, z: -15 },
      { x: -180, y: 0.03, z: -15 },
      { x: -210, y: 0.03, z: -15 } // Running track portal
    ]
  }
];

// ============================================================================
// 14. DEFINED OPEN LAWNS & GREEN WEDGES
// ============================================================================
export const CAMPUS_LAWNS = [
  {
    id: 'LAWN-NORTH-QUAD',
    name: 'North Academic Green Quad',
    bounds: { minX: -65, maxX: 65, minZ: -125, maxZ: -60 },
    center: { x: 0, z: -92.5 },
    width: 130,
    depth: 65,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  },
  {
    id: 'LAWN-EAST-TECH',
    name: 'East Technology Green Lawn',
    bounds: { minX: 65, maxX: 155, minZ: -60, maxZ: 50 },
    center: { x: 110, z: -5 },
    width: 90,
    depth: 110,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  },
  {
    id: 'LAWN-WEST-CIVIC',
    name: 'West Civic Auditorium Green Lawn',
    bounds: { minX: -155, maxX: -65, minZ: -60, maxZ: 50 },
    center: { x: -110, z: -5 },
    width: 90,
    depth: 110,
    hasMowingStripes: true,
    curbHeight: 0.08,
    curbWidth: 0.30
  }
];

// Compatibility aliases
export const PRIMARY_ROAD_POINTS = PRIMARY_CAMPUS_ROADS[0].points;
export const SECONDARY_ROADS = SECONDARY_CAMPUS_ROADS;
export const EMERGENCY_ROADS = SERVICE_EMERGENCY_ROADS;
export const CAMPUS_ROUNDABOUT = CAMPUS_ROUNDABOUTS[1];
export const TEARDROP_DROPOFF_LOOP = CAMPUS_ROUNDABOUTS[0];
