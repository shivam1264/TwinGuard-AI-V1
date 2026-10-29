import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

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
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Digital Twin 10-Storey Server listening on port ${PORT}`);
});
