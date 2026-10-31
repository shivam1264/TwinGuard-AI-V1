import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const FLOOR_THEMES = {
  1: { name: 'Ground & Logistics', prefix: 'L1' },
  2: { name: 'Finance & Legal', prefix: 'L2' },
  3: { name: 'Software & Cloud Engineering', prefix: 'L3' },
  4: { name: 'AI & Neural Computing', prefix: 'L4' },
  5: { name: 'Cyber Defense SOC', prefix: 'L5' },
  6: { name: 'Marketing & Global Media', prefix: 'L6' },
  7: { name: 'Product & Design', prefix: 'L7' },
  8: { name: 'Biotech & Sensor Labs', prefix: 'L8' },
  9: { name: 'Global Strategy & VPs', prefix: 'L9' },
  10: { name: 'Executive Penthouse & Board', prefix: 'L10' }
};

const ROOM_TEMPLATES = [
  { idSuffix: 'r1', nameSuffix: 'Lab / Office 01', centerX: -19.5, centerZ: -12.5, minX: -24.5, maxX: -15.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r2', nameSuffix: 'Lab / Office 02', centerX: -10.5, centerZ: -12.5, minX: -15.0, maxX: -6.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r3', nameSuffix: 'Hub / Office 03', centerX: -1.5, centerZ: -12.5, minX: -6.0, maxX: 3.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r4', nameSuffix: 'Studio / Office 04', centerX: 8.5, centerZ: -12.5, minX: 3.0, maxX: 14.0, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r5', nameSuffix: 'Suite / Office 05', centerX: 19.0, centerZ: -12.5, minX: 14.0, maxX: 24.5, minZ: -22.0, maxZ: -2.6 },
  { idSuffix: 'r6', nameSuffix: 'Dept / Office 06', centerX: -19.5, centerZ: 12.5, minX: -24.5, maxX: -15.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r7', nameSuffix: 'Dept / Office 07', centerX: -10.5, centerZ: 12.5, minX: -15.0, maxX: -6.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r8', nameSuffix: 'Center / Office 08', centerX: -1.5, centerZ: 12.5, minX: -6.0, maxX: 3.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r9', nameSuffix: 'Ops / Office 09', centerX: 8.5, centerZ: 12.5, minX: 3.0, maxX: 14.0, minZ: 2.6, maxZ: 22.0 },
  { idSuffix: 'r10', nameSuffix: 'Annex / Office 10', centerX: 19.0, centerZ: 12.5, minX: 14.0, maxX: 24.5, minZ: 2.6, maxZ: 22.0 }
];

// Generate 100 rooms across 10 floors
const generateInitialRooms = () => {
  const rooms = [];
  for (let floor = 1; floor <= 10; floor++) {
    const theme = FLOOR_THEMES[floor];
    const floorBaseY = (floor - 1) * 3.8;

    ROOM_TEMPLATES.forEach((tmpl, idx) => {
      const roomId = `f${floor}_${tmpl.idSuffix}`;
      const peopleCount = ((floor * 3 + idx * 7) % 3) + 1; // 1 to 3 people per room

      rooms.push({
        id: roomId,
        floor,
        name: `${theme.prefix} • ${tmpl.nameSuffix}`,
        camId: `CAM-${floor}${idx < 9 ? '0' + (idx + 1) : idx + 1}`,
        center: { x: tmpl.centerX, y: floorBaseY, z: tmpl.centerZ },
        bounds: { minX: tmpl.minX, maxX: tmpl.maxX, minZ: tmpl.minZ, maxZ: tmpl.maxZ },
        peopleCount,
        hasFire: false,
        fireIntensity: 0,
        tempCelsius: 22,
        smokeLevel: 0
      });
    });
  }
  return rooms;
};

const initialRooms = generateInitialRooms();

const exits = [
  { id: 'exit_west', name: 'Exit A (West Emergency Core)', x: -29, z: 0, capacity: 60, currentLoad: 0 },
  { id: 'exit_east', name: 'Exit B (East Fire Escape Core)', x: 29, z: 0, capacity: 60, currentLoad: 0 },
  { id: 'exit_south', name: 'Exit C (South Grand Plaza Exit)', x: 0, z: 23, capacity: 80, currentLoad: 0 }
];

const calculateTotal = (rooms) => rooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);

let simulationState = {
  active: false,
  status: 'STANDBY', // STANDBY, ALARM, EVACUATING, COMPLETED
  elapsedSeconds: 0,
  activeFloorView: 'ALL',
  rooms: JSON.parse(JSON.stringify(initialRooms)),
  exits: JSON.parse(JSON.stringify(exits)),
  totalOccupants: calculateTotal(initialRooms),
  evacuatedCount: 0,
  inTransitCount: calculateTotal(initialRooms),
  bottleneckWarnings: []
};

// API Routes
app.get('/api/state', (req, res) => {
  res.json(simulationState);
});

// GIS Geospatial Context & Emergency Infrastructure
app.get('/api/gis-context', (req, res) => {
  res.json({
    origin: {
      latitude: 28.498600,
      longitude: 77.087800,
      elevationMsl: 218.0,
      datum: 'WGS-84 / UTM Zone 43N'
    },
    musterZones: [
      { id: 'muster_alpha', name: 'Muster Point Alpha (South Park Plaza)', capacity: 350, geoPos: { latitude: 28.498168, longitude: 77.087800 } },
      { id: 'muster_bravo', name: 'Muster Point Bravo (West Perimeter Lawn)', capacity: 250, geoPos: { latitude: 28.498780, longitude: 77.087310 } }
    ],
    hydrants: [
      { id: 'hydrant_101', code: 'FH-101', pressureBar: 3.5, flowRateLpm: 1200, status: 'ACTIVE_CERTIFIED' },
      { id: 'hydrant_102', code: 'FH-102', pressureBar: 3.8, flowRateLpm: 1400, status: 'ACTIVE_CERTIFIED' },
      { id: 'hydrant_103', code: 'FH-103', pressureBar: 4.0, flowRateLpm: 1500, status: 'ACTIVE_CERTIFIED' }
    ],
    emergencyServices: [
      { id: 'station_07', name: 'Municipal Fire Station #07', distanceKm: 1.2, etaMinutes: 3.5, status: 'DISPATCH_READY' },
      { id: 'hospital_metro', name: 'Metro City Trauma Hospital', distanceKm: 1.8, etaMinutes: 4.8, status: 'TRIAGE_PREPARED' }
    ]
  });
});

app.post('/api/block-stairwell', (req, res) => {
  const { coreName, floorNum } = req.body;
  io.emit('stairwell-blocked', { coreName, floorNum });
  res.json({ success: true, coreName, floorNum });
});

app.post('/api/clear-incidents', (req, res) => {
  io.emit('incidents-cleared');
  res.json({ success: true });
});

app.post('/api/trigger-fire', (req, res) => {
  const { roomId, intensity = 1.0 } = req.body;
  const room = simulationState.rooms.find(r => r.id === roomId);
  if (room) {
    room.hasFire = true;
    room.fireIntensity = intensity;
    room.tempCelsius = 84;
    room.smokeLevel = 90;
    simulationState.status = 'ALARM';
    
    io.emit('fire-detected', {
      roomId,
      roomName: room.name,
      floor: room.floor,
      camId: room.camId,
      temp: room.tempCelsius,
      smoke: room.smokeLevel
    });
    
    io.emit('state-update', simulationState);
    res.json({ success: true, room });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

app.post('/api/update-crowd', (req, res) => {
  const { roomId, count } = req.body;
  const room = simulationState.rooms.find(r => r.id === roomId);
  if (room) {
    room.peopleCount = Math.max(0, parseInt(count, 10));
    simulationState.totalOccupants = calculateTotal(simulationState.rooms);
    simulationState.inTransitCount = simulationState.totalOccupants - simulationState.evacuatedCount;
    
    io.emit('crowd-updated', { roomId, peopleCount: room.peopleCount });
    io.emit('state-update', simulationState);
    res.json({ success: true, room });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

app.post('/api/reset', (req, res) => {
  simulationState.active = false;
  simulationState.status = 'STANDBY';
  simulationState.elapsedSeconds = 0;
  simulationState.rooms = JSON.parse(JSON.stringify(initialRooms));
  simulationState.exits = JSON.parse(JSON.stringify(exits));
  simulationState.totalOccupants = calculateTotal(initialRooms);
  simulationState.evacuatedCount = 0;
  simulationState.inTransitCount = calculateTotal(initialRooms);
  simulationState.bottleneckWarnings = [];

  io.emit('simulation-reset', simulationState);
  res.json({ success: true, message: 'Simulation reset complete' });
});

// Socket.io Handlers
io.on('connection', (socket) => {
  socket.emit('state-update', simulationState);

  socket.on('client-trigger-fire', (data) => {
    const room = simulationState.rooms.find(r => r.id === data.roomId);
    if (room) {
      room.hasFire = true;
      room.tempCelsius = 85;
      simulationState.status = 'ALARM';
      io.emit('fire-detected', { roomId: room.id, floor: room.floor });
      io.emit('state-update', simulationState);
    }
  });

  socket.on('client-start-evacuation', () => {
    simulationState.active = true;
    simulationState.status = 'EVACUATING';
    io.emit('evacuation-started');
  });

  // Mobile Evacuee Companion - Marked Safe at Muster Zone
  socket.on('evacuee-marked-safe', (data) => {
    simulationState.evacuatedCount = Math.min(simulationState.totalOccupants, (simulationState.evacuatedCount || 0) + 1);
    simulationState.inTransitCount = Math.max(0, simulationState.totalOccupants - simulationState.evacuatedCount);
    io.emit('state-update', simulationState);
    io.emit('evacuee-safe-confirmed', {
      userId: data?.userId || 'anonymous',
      roomId: data?.roomId,
      floor: data?.floor,
      evacuatedCount: simulationState.evacuatedCount,
      inTransitCount: simulationState.inTransitCount
    });
  });

  // Mobile Evacuee Companion - Emergency Trapped SOS
  socket.on('evacuee-sos', (data) => {
    const sosAlert = {
      id: `sos_${Date.now()}`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      title: `CRITICAL SOS: Occupant Trapped on Level ${data?.floor || 4}`,
      subtitle: `${data?.roomName || 'Room ' + (data?.roomId || '104')} • Immediate Extraction Required`,
      severity: 'Critical',
      floor: data?.floor || 4,
      roomId: data?.roomId || 'f4_r1',
      sender: data?.userName || 'Mobile Evacuee'
    };
    io.emit('incident-sos', sosAlert);
  });

  // Incident Commander - Stairwell obstruction notification
  socket.on('client-block-stairwell', (data) => {
    io.emit('stairwell-blocked', data);
  });
});

// Discover local IPv4 address for multi-device QR Code demonstration
app.get('/api/network-ip', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    let bestLanIp = null;

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({ interface: name, address: iface.address });
          // Prioritize Wi-Fi, WLAN, or Hotspot network adapter
          if (!bestLanIp) {
            bestLanIp = iface.address;
          } else if (/wi-?fi|wlan|hotspot|wireless|cellular/i.test(name)) {
            bestLanIp = iface.address;
          }
        }
      }
    }

    res.json({
      success: true,
      bestLanIp: bestLanIp || '10.229.123.50',
      addresses
    });
  } catch (err) {
    res.json({ success: false, bestLanIp: '10.229.123.50', addresses: [] });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Digital Twin 10-Storey Server listening on http://0.0.0.0:${PORT}`);
});
