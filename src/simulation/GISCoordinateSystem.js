// GIS Coordinate Reference System & Geospatial Mapping Engine
// Anchored at Cyber City / DLF Cyber Hub area, Gurugram (WGS-84 Geodetic Datum)
// Real-world reference: 28.498600° N, 77.087800° E, 218.0m MSL

export const GIS_ORIGIN = {
  latitude: 28.498600,
  longitude: 77.087800,
  elevationMsl: 218.0, // Meters Above Mean Sea Level
  datum: 'WGS-84 / UTM Zone 43N',
  buildingOrientationDeg: 0.0 // True North aligns with local -Z axis
};

// Earth radius approximation for local flat-earth / equirectangular projection
const EARTH_RADIUS_METERS = 6378137.0;
const DEG_TO_RAD = Math.PI / 180.0;
const RAD_TO_DEG = 180.0 / Math.PI;

/**
 * Convert Local 3D Coordinates (X, Y, Z in meters) to Geographic WGS-84 Coordinates
 * Local coordinates:
 *   X = East (+) / West (-)
 *   Y = Elevation above ground (0 = ground plane)
 *   Z = South (+) / North (-)
 */
export function localToGeodetic(x, y, z) {
  const dLat = (-z / EARTH_RADIUS_METERS) * RAD_TO_DEG;
  const latRad = GIS_ORIGIN.latitude * DEG_TO_RAD;
  const dLon = (x / (EARTH_RADIUS_METERS * Math.cos(latRad))) * RAD_TO_DEG;

  return {
    latitude: GIS_ORIGIN.latitude + dLat,
    longitude: GIS_ORIGIN.longitude + dLon,
    elevationMsl: GIS_ORIGIN.elevationMsl + y
  };
}

/**
 * Convert Geographic WGS-84 Coordinates to Local 3D Coordinates (X, Y, Z)
 */
export function geodeticToLocal(lat, lon, elevationMsl = GIS_ORIGIN.elevationMsl) {
  const dLat = (lat - GIS_ORIGIN.latitude) * DEG_TO_RAD;
  const latRad = GIS_ORIGIN.latitude * DEG_TO_RAD;
  const dLon = (lon - GIS_ORIGIN.longitude) * DEG_TO_RAD;

  const z = -dLat * EARTH_RADIUS_METERS;
  const x = dLon * (EARTH_RADIUS_METERS * Math.cos(latRad));
  const y = elevationMsl - GIS_ORIGIN.elevationMsl;

  return { x, y, z };
}

/**
 * Verified Outdoor Emergency Assets & Infrastructure
 */
export const GIS_MUSTER_ZONES = [
  {
    id: 'muster_alpha',
    name: 'Muster Point Alpha (South Park Plaza)',
    code: 'M-01',
    localPos: { x: 0.0, y: 0.0, z: 48.0 },
    geoPos: localToGeodetic(0.0, 0.0, 48.0),
    capacity: 350,
    radiusMeters: 8.5,
    assignedExits: ['exit_south', 'exit_east'],
    description: 'Primary high-capacity assembly area in South landscaped park with trauma triaging'
  },
  {
    id: 'muster_bravo',
    name: 'Muster Point Bravo (West Perimeter Lawn)',
    code: 'M-02',
    localPos: { x: -48.0, y: 0.0, z: -20.0 },
    geoPos: localToGeodetic(-48.0, 0.0, -20.0),
    capacity: 250,
    radiusMeters: 7.0,
    assignedExits: ['exit_west'],
    description: 'Secondary safe zone adjacent to West ring road for rapid ambulance evacuation'
  }
];

export const GIS_MUNICIPAL_SERVICES = [
  {
    id: 'fire_station_07',
    name: 'Municipal Fire Station #07',
    type: 'FIRE_DEPARTMENT',
    geoPos: { latitude: 28.5085, longitude: 77.0985 },
    distanceKm: 1.2,
    etaMinutes: 3.5,
    vehiclesAvailable: 4,
    phone: '101 / +91-124-2320101'
  },
  {
    id: 'trauma_hospital_metro',
    name: 'Metro City Trauma & Multi-Speciality Hospital',
    type: 'HOSPITAL',
    geoPos: { latitude: 28.4872, longitude: 77.0782 },
    distanceKm: 1.8,
    etaMinutes: 4.8,
    icuBeds: 24,
    ambulancesDispatched: 2,
    phone: '102 / +91-124-4552000'
  },
  {
    id: 'police_station_cyber',
    name: 'Cyber City Traffic & Emergency Police Post',
    type: 'POLICE',
    geoPos: { latitude: 28.5020, longitude: 77.0850 },
    distanceKm: 0.8,
    etaMinutes: 2.0,
    phone: '112 / +91-124-2220112'
  }
];

export const GIS_FIRE_HYDRANTS = [
  {
    id: 'hydrant_101',
    code: 'FH-101',
    name: 'South Plaza Dual-Pumper Hydrant',
    localPos: { x: 24.0, y: 0.0, z: 38.0 },
    geoPos: localToGeodetic(24.0, 0.0, 38.0),
    pressureBar: 3.5,
    flowRateLpm: 1200,
    status: 'ACTIVE_CERTIFIED'
  },
  {
    id: 'hydrant_102',
    code: 'FH-102',
    name: 'West Flank High-Flow Standpipe',
    localPos: { x: -38.0, y: 0.0, z: 5.0 },
    geoPos: localToGeodetic(-38.0, 0.0, 5.0),
    pressureBar: 3.8,
    flowRateLpm: 1400,
    status: 'ACTIVE_CERTIFIED'
  },
  {
    id: 'hydrant_103',
    code: 'FH-103',
    name: 'East Core Water Feed Connection',
    localPos: { x: 38.0, y: 0.0, z: -5.0 },
    geoPos: localToGeodetic(38.0, 0.0, -5.0),
    pressureBar: 4.0,
    flowRateLpm: 1500,
    status: 'ACTIVE_CERTIFIED'
  }
];

/**
 * Spatial query: Find nearest municipal emergency facilities within max distance
 */
export function queryNearbyFacilities(maxDistanceKm = 5.0) {
  return GIS_MUNICIPAL_SERVICES.filter(srv => srv.distanceKm <= maxDistanceKm);
}

/**
 * Calculate straight-line ground distance (meters) between two geodetic coordinates
 */
export function geodeticDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}
