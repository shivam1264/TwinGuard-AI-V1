/**
 * gisData.js
 * Authoritative GIS geographic coordinates, road-following route topology, and cumulative distance metrics for TwinGuard-AI
 * 
 * Geographic Context:
 * Facility: TwinGuard Technology & Innovation Campus (Sector 28)
 * Coordinates: WGS-84 decimal degrees
 * NOTE: All dispatch and vehicle tracking telemetry are SIMULATION data.
 */

export const GIS_DATA_NOTICE = "SIMULATION DATA: City dispatch, routes, and emergency vehicle locations are generated for simulation & training purposes.";

export const GIS_COORDINATES = {
  // Facility Reference Origin (Main Hero Building Center)
  FACILITY_ORIGIN: {
    lat: 28.498600,
    lng: 77.087800,
    name: "TwinGuard HQ (10-Storey Smart Tower)",
    type: "HERO_BUILDING",
    zone: "Zone-0 Central Core"
  },

  // Outer Campus Geofence Boundary Polygon [Lat, Lng]
  CAMPUS_GEOFENCE: [
    [28.500200, 77.085500], // Northwest corner
    [28.500200, 77.090500], // Northeast corner
    [28.496800, 77.090500], // Southeast corner
    [28.496800, 77.085500]  // Southwest corner
  ],

  // Designated Assembly / Safe Zones
  MUSTER_POINTS: [
    {
      id: "node_muster_alpha",
      name: "Muster Point Alpha (South Park Plaza)",
      lat: 28.497500,
      lng: 77.087800,
      capacity: 350,
      status: "PRIMARY_SAFE_ZONE",
      notes: "Open plaza assembly safe from structure facade"
    },
    {
      id: "node_muster_bravo",
      name: "Muster Point Bravo (West Perimeter Lawn)",
      lat: 28.498600,
      lng: 77.086200,
      capacity: 250,
      status: "SECONDARY_SAFE_ZONE",
      notes: "West lawn safe assembly zone"
    }
  ],

  // Authoritative Campus Access Gates (Semantic Mapping with 3D Digital Twin)
  CAMPUS_GATES: [
    {
      id: "gate_south",
      name: "Main Campus Entrance (South Ceremonial Portal)",
      lat: 28.496828,
      lng: 77.087830,
      type: "MAIN_CIVIC_PORTAL",
      connectedExit: "exit_south",
      three3DPosition: { x: 0, y: 0.1, z: 240 }
    },
    {
      id: "gate_west",
      name: "West Security Gate (Stair Core A Portal)",
      lat: 28.498600,
      lng: 77.085600,
      type: "VEHICULAR_EMERGENCY_ACCESS",
      connectedExit: "exit_west",
      three3DPosition: { x: -44, y: 0.1, z: 0 }
    },
    {
      id: "gate_east",
      name: "East Logistics Gate (Service Access)",
      lat: 28.498600,
      lng: 77.090400,
      type: "VEHICULAR_EMERGENCY_ACCESS",
      connectedExit: "exit_east",
      three3DPosition: { x: 44, y: 0.1, z: 0 }
    }
  ],

  // Surrounding Municipal Emergency Infrastructure
  MUNICIPAL_SERVICES: [
    {
      id: "fire_station_07",
      name: "Municipal Fire & Rescue Station #07",
      lat: 28.508172,
      lng: 77.081685,
      type: "FIRE_DEPARTMENT",
      distanceKm: 2.7,
      baseEtaSeconds: 30,
      units: ["Engine-7 (Pumper)", "Ladder-2", "Rescue-1"]
    },
    {
      id: "trauma_hospital_city",
      name: "Metro City Emergency Trauma Hospital",
      lat: 28.489000,
      lng: 77.095000,
      type: "HOSPITAL",
      distanceKm: 1.8,
      baseEtaSeconds: 45,
      units: ["EMS-Ambulance-4", "EMS-Ambulance-9", "Air-Ambulance-1"]
    }
  ],

  // REAL ROAD ROUTE: Fire Station #07 -> Municipal Roads -> South Main Gate
  // High-fidelity road-following geometry (52 waypoints following road centerlines)
  DISPATCH_ROUTE: [
    [28.508172, 77.081685], // Municipal Fire Station #07
    [28.507300, 77.082600], // Sector 28 Avenue South
    [28.506400, 77.083550], // Sector 28 Avenue South
    [28.505500, 77.084500], // Sector 28 Avenue South
    [28.504600, 77.085450], // Sector 28 Avenue South
    [28.503700, 77.086400], // Sector 28 Avenue South
    [28.502950, 77.087200], // Connector road junction
    [28.502250, 77.087350], // Central Link road South
    [28.501350, 77.086700], // Link road South
    [28.500500, 77.086050], // Link road South
    [28.499650, 77.085400], // Link road South
    [28.498800, 77.084750], // Link road South
    [28.497950, 77.084100], // Approach Golf Course Service Corridor
    [28.497350, 77.084350], // Merge onto Service Road
    [28.496700, 77.085150], // Golf Course Service Corridor Southeast
    [28.496100, 77.086000], // Approach Campus Perimeter
    [28.495750, 77.086700], // Campus Perimeter Avenue curve
    [28.496200, 77.087250], // Campus Entrance Avenue
    [28.496550, 77.087600], // South Main Gate Access
    [28.496828, 77.087830]  // South Main Gate (Campus Arrival Portal)
  ]
};

// ============================================================================
// CUMULATIVE ROUTE DISTANCE PRE-COMPUTATION (Spherical Haversine)
// ============================================================================

function haversineDistance(p1, p2) {
  const R = 6371000; // Earth radius in meters
  const phi1 = (p1[0] * Math.PI) / 180;
  const phi2 = (p2[0] * Math.PI) / 180;
  const deltaPhi = ((p2[0] - p1[0]) * Math.PI) / 180;
  const deltaLambda = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compute cumulative segment distances
export const ROUTE_METRICS = (() => {
  const route = GIS_COORDINATES.DISPATCH_ROUTE;
  const cumulative = [0];
  let totalMeters = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const d = haversineDistance(route[i], route[i + 1]);
    totalMeters += d;
    cumulative.push(totalMeters);
  }

  return {
    totalMeters,
    cumulative
  };
})();

/**
 * Compute road heading (bearing) in degrees between two coordinates
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Distance-based route interpolation ensuring constant perceived speed and accurate heading
 * @param {number} progress - Float 0.0 to 1.0 (clamped)
 * @returns {{lat: number, lng: number, heading: number, distanceTravelled: number}}
 */
export function getInterpolatedRoutePosition(progress) {
  const route = GIS_COORDINATES.DISPATCH_ROUTE;
  if (!route || route.length === 0) {
    return { lat: 28.4986, lng: 77.0878, heading: 0, distanceTravelled: 0 };
  }

  const clampedP = Math.min(1.0, Math.max(0.0, progress));
  const targetDist = clampedP * ROUTE_METRICS.totalMeters;
  const cum = ROUTE_METRICS.cumulative;

  if (clampedP <= 0) {
    const initialBearing = calculateBearing(route[0][0], route[0][1], route[1][0], route[1][1]);
    return { lat: route[0][0], lng: route[0][1], heading: initialBearing, distanceTravelled: 0 };
  }

  if (clampedP >= 1.0) {
    const lastIdx = route.length - 1;
    const finalBearing = calculateBearing(
      route[lastIdx - 1][0],
      route[lastIdx - 1][1],
      route[lastIdx][0],
      route[lastIdx][1]
    );
    return {
      lat: route[lastIdx][0],
      lng: route[lastIdx][1],
      heading: finalBearing,
      distanceTravelled: ROUTE_METRICS.totalMeters
    };
  }

  // Find corresponding segment
  let segIdx = 0;
  for (let i = 0; i < cum.length - 1; i++) {
    if (targetDist >= cum[i] && targetDist <= cum[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const p1 = route[segIdx];
  const p2 = route[segIdx + 1];
  const segDist = cum[segIdx + 1] - cum[segIdx];
  const segFraction = segDist > 0 ? (targetDist - cum[segIdx]) / segDist : 0;

  const lat = p1[0] + (p2[0] - p1[0]) * segFraction;
  const lng = p1[1] + (p2[1] - p1[1]) * segFraction;
  const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

  return {
    lat,
    lng,
    heading,
    distanceTravelled: targetDist
  };
}

/**
 * Get slice of travelled coordinates up to current progress for trail visualization
 */
export function getTravelledRoute(progress) {
  const route = GIS_COORDINATES.DISPATCH_ROUTE;
  if (progress <= 0) return [route[0]];
  if (progress >= 1.0) return route;

  const current = getInterpolatedRoutePosition(progress);
  const targetDist = progress * ROUTE_METRICS.totalMeters;
  const cum = ROUTE_METRICS.cumulative;

  const travelled = [];
  for (let i = 0; i < route.length; i++) {
    if (cum[i] <= targetDist) {
      travelled.push(route[i]);
    } else {
      break;
    }
  }
  travelled.push([current.lat, current.lng]);
  return travelled;
}
