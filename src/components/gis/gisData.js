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
    [28.508172, 77.081685],
    [28.507470, 77.082632],
    [28.506831, 77.083489],
    [28.506196, 77.084343],
    [28.504864, 77.086132],
    [28.504824, 77.086186],
    [28.504220, 77.087014],
    [28.504197, 77.087047],
    [28.503643, 77.087794],
    [28.503420, 77.088092],
    [28.503305, 77.088255],
    [28.502857, 77.088862],
    [28.502813, 77.088809],
    [28.503252, 77.088207],
    [28.502777, 77.087748],
    [28.502417, 77.087426],
    [28.501997, 77.087025],
    [28.501781, 77.086819],
    [28.501574, 77.086621],
    [28.501226, 77.086289],
    [28.500952, 77.086028],
    [28.500823, 77.085904],
    [28.500468, 77.085565],
    [28.500247, 77.085405],
    [28.500192, 77.085365],
    [28.499653, 77.084975],
    [28.499345, 77.084752],
    [28.499105, 77.084578],
    [28.498850, 77.084342],
    [28.498606, 77.084116],
    [28.498069, 77.083698],
    [28.497712, 77.083379],
    [28.497629, 77.083482],
    [28.497412, 77.083753],
    [28.496614, 77.084799],
    [28.496590, 77.084831],
    [28.495970, 77.085658],
    [28.495710, 77.086067],
    [28.496385, 77.086713],
    [28.497309, 77.087598],
    [28.497432, 77.087716],
    [28.497581, 77.087921],
    [28.498085, 77.088369],
    [28.498134, 77.088458],
    [28.498165, 77.088560],
    [28.498157, 77.088672],
    [28.498105, 77.088760],
    [28.498018, 77.088806],
    [28.497916, 77.088800],
    [28.497833, 77.088749],
    [28.497729, 77.088656],
    [28.496828, 77.087830]
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
