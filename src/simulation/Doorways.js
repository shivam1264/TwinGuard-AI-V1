// 10 Floors x 10 Rooms = 100 Commercial Rooms with Exact Doorway Routing
// Every room has 3 strict waypoints: inside room ➔ door threshold ➔ central corridor

export const ROOM_TEMPLATES = [
  // North Wing (5 rooms side-by-side, doors on South wall at z = -2.6)
  { idSuffix: 'r1', nameSuffix: 'Lab / Office 01', centerX: -19.5, centerZ: -12.5, doorX: -19.5, doorZ: -2.6, insideZ: -4.5, corridorZ: 0.0, minX: -24.5, maxX: -15.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r2', nameSuffix: 'Lab / Office 02', centerX: -10.5, centerZ: -12.5, doorX: -10.5, doorZ: -2.6, insideZ: -4.5, corridorZ: 0.0, minX: -15.0, maxX: -6.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r3', nameSuffix: 'Hub / Office 03', centerX: -1.5, centerZ: -12.5, doorX: -1.5, doorZ: -2.6, insideZ: -4.5, corridorZ: 0.0, minX: -6.0, maxX: 3.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r4', nameSuffix: 'Studio / Office 04', centerX: 8.5, centerZ: -12.5, doorX: 8.5, doorZ: -2.6, insideZ: -4.5, corridorZ: 0.0, minX: 3.0, maxX: 14.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r5', nameSuffix: 'Suite / Office 05', centerX: 19.0, centerZ: -12.5, doorX: 19.0, doorZ: -2.6, insideZ: -4.5, corridorZ: 0.0, minX: 14.0, maxX: 24.5, minZ: -22.0, maxZ: -2.6 },

  // South Wing (5 rooms side-by-side, doors on North wall at z = 2.6)
  { idSuffix: 'r6', nameSuffix: 'Dept / Office 06', centerX: -19.5, centerZ: 12.5, doorX: -19.5, doorZ: 2.6, insideZ: 4.5, corridorZ: 0.0, minX: -24.5, maxX: -15.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r7', nameSuffix: 'Dept / Office 07', centerX: -10.5, centerZ: 12.5, doorX: -10.5, doorZ: 2.6, insideZ: 4.5, corridorZ: 0.0, minX: -15.0, maxX: -6.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r8', nameSuffix: 'Center / Office 08', centerX: -1.5, centerZ: 12.5, doorX: -1.5, doorZ: 2.6, insideZ: 4.5, corridorZ: 0.0, minX: -6.0, maxX: 3.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r9', nameSuffix: 'Ops / Office 09', centerX: 8.5, centerZ: 12.5, doorX: 8.5, doorZ: 2.6, insideZ: 4.5, corridorZ: 0.0, minX: 3.0, maxX: 14.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r10', nameSuffix: 'Annex / Office 10', centerX: 19.0, centerZ: 12.5, doorX: 19.0, doorZ: 2.6, insideZ: 4.5, corridorZ: 0.0, minX: 14.0, maxX: 24.5, minZ: 2.6, maxZ: 22.0 }
];

export const FLOOR_THEMES = {
  1: { name: 'Ground & Public Logistics', prefix: 'L1' },
  2: { name: 'Finance & Legal Division', prefix: 'L2' },
  3: { name: 'Software & Cloud Engineering', prefix: 'L3' },
  4: { name: 'AI & Advanced Neural Computing', prefix: 'L4' },
  5: { name: 'Cyber Defense & Security SOC', prefix: 'L5' },
  6: { name: 'Marketing & Global Communications', prefix: 'L6' },
  7: { name: 'Product Architecture & Design', prefix: 'L7' },
  8: { name: 'Biotech & Sensor Laboratories', prefix: 'L8' },
  9: { name: 'Global Strategy & VP Suites', prefix: 'L9' },
  10: { name: 'Executive Penthouse & Board', prefix: 'L10' }
};

export const ROOM_DOORWAYS = {};

// Build all 100 room doorways programmatically
for (let floor = 1; floor <= 10; floor++) {
  ROOM_TEMPLATES.forEach(tmpl => {
    const roomId = `f${floor}_${tmpl.idSuffix}`;
    ROOM_DOORWAYS[roomId] = {
      floor,
      inside: { x: tmpl.doorX, z: tmpl.insideZ },
      door: { x: tmpl.doorX, z: tmpl.doorZ },
      corridor: { x: tmpl.doorX, z: tmpl.corridorZ },
      width: 2.2,
      bounds: { minX: tmpl.minX, maxX: tmpl.maxX, minZ: tmpl.minZ, maxZ: tmpl.maxZ },
      center: { x: tmpl.centerX, z: tmpl.centerZ }
    };
  });
}

export function getRoomDoorway(roomId) {
  return ROOM_DOORWAYS[roomId] || {
    inside: { x: 0, z: 0 },
    door: { x: 0, z: 0 },
    corridor: { x: 0, z: 0 },
    width: 2.2
  };
}

export function getRoomFurnishingType(floor, roomIdx) {
  if (floor === 1) {
    if (roomIdx === 2) return 'RECEPTION_LOBBY';
    if (roomIdx === 0 || roomIdx === 1) return 'CAFE_LOUNGE';
    if (roomIdx === 3 || roomIdx === 4) return 'LIVING_LOUNGE';
    return 'TECH_WORKSTATIONS';
  }
  if (floor === 10) {
    if (roomIdx === 2 || roomIdx === 7) return 'PRESIDENTIAL_BOARDROOM';
    return 'LUXURY_PENTHOUSE_LIVING';
  }
  if (floor === 9) {
    if (roomIdx === 2 || roomIdx === 7) return 'CONFERENCE_BOARDROOM';
    if (roomIdx === 3 || roomIdx === 4 || roomIdx === 8 || roomIdx === 9) return 'LIVING_LOUNGE';
    return 'EXECUTIVE_OFFICE';
  }
  // Tech & Corporate floors (2 - 8)
  if (roomIdx === 2 || roomIdx === 7) {
    return 'CONFERENCE_BOARDROOM';
  }
  return 'TECH_WORKSTATIONS';
}

export function getRoomSeatingSpots(floor, roomIdx, cx, cz) {
  const type = getRoomFurnishingType(floor, roomIdx);

  switch (type) {
    case 'TECH_WORKSTATIONS': {
      const backSign = cz > 0 ? 1 : -1;
      const podOffsets = [
        { dx: -2.3, dz:  5.2 * backSign },
        { dx:  2.3, dz:  5.2 * backSign },
        { dx: -2.3, dz:  0.0 * backSign },
        { dx:  2.3, dz:  0.0 * backSign },
        { dx: -2.3, dz: -5.2 * backSign },
        { dx:  2.3, dz: -5.2 * backSign }
      ];
      const spots = [];
      podOffsets.forEach(pod => {
        const px = cx + pod.dx;
        const pz = cz + pod.dz;
        spots.push(
          { x: px - 0.85, z: pz - 0.90, rotY: 0, isSeated: true },
          { x: px + 0.85, z: pz - 0.90, rotY: 0, isSeated: true },
          { x: px - 0.85, z: pz + 0.90, rotY: Math.PI, isSeated: true },
          { x: px + 0.85, z: pz + 0.90, rotY: Math.PI, isSeated: true }
        );
      });
      return spots;
    }

    case 'CONFERENCE_BOARDROOM':
    case 'PRESIDENTIAL_BOARDROOM':
      return [
        { x: cx - 1.4, z: cz - 1.15, rotY: 0, isSeated: true },
        { x: cx + 0.0, z: cz - 1.15, rotY: 0, isSeated: true },
        { x: cx + 1.4, z: cz - 1.15, rotY: 0, isSeated: true },
        { x: cx + 0.0, z: cz + 1.15, rotY: Math.PI, isSeated: true }
      ];

    case 'LUXURY_PENTHOUSE_LIVING':
    case 'LIVING_LOUNGE':
      return [
        { x: cx - 0.65, z: cz - 0.55, rotY: 0, isSeated: true },
        { x: cx + 0.65, z: cz - 0.55, rotY: 0, isSeated: true },
        { x: cx + 1.55, z: cz + 0.25, rotY: -Math.PI * 0.45, isSeated: true },
        { x: cx - 1.60, z: cz + 0.70, rotY: Math.PI * 0.70, isSeated: false }
      ];

    case 'EXECUTIVE_OFFICE':
      return [
        { x: cx, z: cz - 1.05, rotY: 0, isSeated: true },
        { x: cx - 0.85, z: cz + 0.85, rotY: Math.PI, isSeated: true },
        { x: cx + 0.85, z: cz + 0.85, rotY: Math.PI, isSeated: true },
        { x: cx + 1.80, z: cz - 0.20, rotY: -Math.PI * 0.5, isSeated: false }
      ];

    case 'RECEPTION_LOBBY':
      return [
        { x: cx, z: cz - 0.65, rotY: 0, isSeated: true },
        { x: cx - 1.40, z: cz + 1.10, rotY: -Math.PI * 0.25, isSeated: true },
        { x: cx + 1.40, z: cz + 1.10, rotY: Math.PI * 0.25, isSeated: true },
        { x: cx, z: cz + 0.85, rotY: Math.PI, isSeated: false }
      ];

    case 'CAFE_LOUNGE': {
      const backSign = cz > 0 ? 1 : -1;
      const spots = [];
      for (const dz of [4.8 * backSign, 0, -4.8 * backSign]) {
        for (const dx of [-1.5, 1.5]) {
          spots.push(
            { x: cx + dx, z: cz + dz - 0.65, rotY: 0, isSeated: true },
            { x: cx + dx, z: cz + dz + 0.65, rotY: Math.PI, isSeated: true }
          );
        }
      }
      return spots;
    }

    default:
      return [
        { x: cx - 0.9, z: cz - 0.9, rotY: 0, isSeated: true },
        { x: cx + 0.9, z: cz - 0.9, rotY: 0, isSeated: true },
        { x: cx, z: cz + 0.9, rotY: Math.PI, isSeated: true },
        { x: cx + 1.5, z: cz, rotY: 0, isSeated: false }
      ];
  }
}

