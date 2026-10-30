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
      // 2 Spacious 2-person workstation pods with 2.4m central aisle and 1.6m perimeter clearance
      // Pod Left: dx = -2.2, Pod Right: dx = +2.2
      // Each desk has 1 chair with 0.62m clearance. Humans sit naturally facing desk & monitor.
      return [
        // Spot 1: Pod Left, Front Desk (Occupied first)
        { x: cx - 2.2, z: cz + 0.65 * backSign, rotY: backSign > 0 ? 0 : Math.PI, isSeated: true },
        // Spot 2: Pod Right, Front Desk (Occupied second)
        { x: cx + 2.2, z: cz + 0.65 * backSign, rotY: backSign > 0 ? 0 : Math.PI, isSeated: true },
        // Spot 3: Pod Left, Rear Desk (Occupied third)
        { x: cx - 2.2, z: cz + 2.35 * backSign, rotY: backSign > 0 ? Math.PI : 0, isSeated: true },
        // Spot 4: Pod Right, Rear Desk (Unoccupied standby)
        { x: cx + 2.2, z: cz + 2.35 * backSign, rotY: backSign > 0 ? Math.PI : 0, isSeated: true }
      ];
    }

    case 'CONFERENCE_BOARDROOM':
    case 'PRESIDENTIAL_BOARDROOM': {
      // Large conference table centered at (cx, cz). 6 executive chairs around table.
      return [
        { x: cx, z: cz - 0.85, rotY: 0, isSeated: true },
        { x: cx, z: cz + 0.85, rotY: Math.PI, isSeated: true },
        { x: cx - 1.2, z: cz - 0.85, rotY: 0, isSeated: true },
        { x: cx + 1.2, z: cz + 0.85, rotY: Math.PI, isSeated: true }
      ];
    }

    case 'EXECUTIVE_OFFICE': {
      // Executive desk + chair behind desk, visitor chairs in front
      return [
        { x: cx, z: cz - 1.65, rotY: 0, isSeated: true },
        { x: cx - 0.75, z: cz - 0.35, rotY: Math.PI, isSeated: true },
        { x: cx + 0.75, z: cz - 0.35, rotY: Math.PI, isSeated: true },
        { x: cx + 1.80, z: cz + 0.60, rotY: -Math.PI * 0.45, isSeated: false }
      ];
    }

    case 'RECEPTION_LOBBY': {
      return [
        { x: cx, z: cz - 0.50, rotY: 0, isSeated: true },
        { x: cx - 2.20, z: cz + 1.20, rotY: Math.PI * 0.15, isSeated: true },
        { x: cx + 1.80, z: cz + 1.60, rotY: -Math.PI * 0.35, isSeated: false }
      ];
    }

    case 'CAFE_LOUNGE': {
      const backSign = cz > 0 ? 1 : -1;
      return [
        { x: cx - 1.8, z: cz + 1.5 * backSign, rotY: 0, isSeated: true },
        { x: cx + 1.8, z: cz + 1.5 * backSign, rotY: Math.PI, isSeated: true },
        { x: cx - 1.8, z: cz - 2.5 * backSign, rotY: 0, isSeated: true },
        { x: cx + 1.8, z: cz - 2.5 * backSign, rotY: Math.PI, isSeated: true }
      ];
    }

    case 'LUXURY_PENTHOUSE_LIVING':
    case 'LIVING_LOUNGE': {
      return [
        { x: cx, z: cz + 1.10, rotY: Math.PI, isSeated: true },
        { x: cx - 1.60, z: cz - 0.10, rotY: Math.PI * 0.45, isSeated: true },
        { x: cx + 1.60, z: cz - 0.10, rotY: -Math.PI * 0.45, isSeated: true },
        { x: cx + 0.80, z: cz - 1.80, rotY: 0, isSeated: false }
      ];
    }

    default:
      return [
        { x: cx, z: cz, rotY: 0, isSeated: false }
      ];
  }
}
