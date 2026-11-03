// ==============================================================================
// TwinGuard AI - Emergency Command Center Dashboard
// Exact visual recreation matching target reference design (media_1793397695867_380cd533.jpg)
// Fully responsive, guaranteed containment, 0% overflow on all cards and viewports.
// ==============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Siren,
  Flame,
  Cloud,
  Ban,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  UserPlus,
  UserMinus,
  Users,
  RefreshCw,
  Undo2,
  RotateCcw,
  Play,
  Pause,
  FolderOpen,
  Building2,
  ChevronDown,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  RotateCw,
  Lightbulb,
  Radio,
  Save,
  Trash2,
  X,
  ShieldAlert,
  Layers,
  FlaskConical,
  Zap,
  Wind,
  BrickWall
} from 'lucide-react';

import { FLOOR_THEMES, ROOM_TEMPLATES } from '../simulation/Doorways.js';
import { AIEngine } from '../ai';

// ── Location categories supported by the command center ──────────────────────
const CATEGORY_LABEL = {
  ROOM: 'Room',
  CORRIDOR: 'Corridor',
  STAIR: 'Staircase',
  EXIT: 'Exit'
};

// Configured design capacities (rooms use the real per-room `capacity` field)
const CORRIDOR_DESIGN_CAPACITY = 40;
const STAIR_DESIGN_CAPACITY = 45;
const SCENARIO_STORAGE_KEY = 'twinguard_command_center_scenario_v1';

// Micro telemetry row (Live Environmental Telemetry card)
const TelemetryRow = ({ label, value, bad = false, warn = false, neutral = false }) => (
  <div className="flex items-center justify-between gap-1.5 min-w-0">
    <span className="text-[10px] text-slate-500 truncate">{label}</span>
    <span
      className={`text-[10px] font-bold shrink-0 ${neutral ? 'text-slate-800' : bad ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'
        }`}
    >
      {value}
    </span>
  </div>
);

export function EmergencyCommandCenterPage({
  theme = 'dark',
  threeCanvasRef,
  mainSlotRef,
  sceneManager,
  rooms = [],
  exits = [],
  selected3DRoom = null,
  onSelect3DRoom,
  onUpdateRooms,
  onUpdateExits,
  isSimulating = false,
  systemStatus = 'STANDBY',
  stats = null,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onTriggerFire,
  onExtinguishFire,
  onClearAllFires,
  onSwitchTo3D,
  onClose,
  onUpdateOccupancy, // strict per-room occupancy update (roomId, count)
  onBlockStairwell, // backend sync: (coreZone, floorNum|null)
  onHazardEvent // multi-hazard events bubbled to the global incident feed
}) {
  // Mode selection: 'simulation' vs 'live'
  const [mode, setMode] = useState('simulation');
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'
  const [occupancyView, setOccupancyView] = useState('floors'); // 'floors' | 'rooms'
  const [selectedBuilding, setSelectedBuilding] = useState('Main Academic Building');
  // Selection defaults are derived from the REAL building dataset.
  // No floor number or room id is hardcoded anywhere in this component.
  const [selectedFloor, setSelectedFloor] = useState(() => {
    const floors = rooms.map((r) => Number(r.floor)).filter((f) => !isNaN(f));
    return floors.length ? Math.min(...floors) : 1;
  }); // any level of the building
  const [selectedLocationId, setSelectedLocationId] = useState(() => rooms[0]?.id || null);
  const [segmentOccupancies, setSegmentOccupancies] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('ROOM');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [compassYaw, setCompassYaw] = useState(0);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Viewport DOM mount slot for the REAL Three.js canvas
  const commandCenterSlotRef = useRef(null);

  // ============================================================================
  // 1. MOUNT REAL THREE.JS 3D BUILDING IN VIEWPORT & CLEANUP ON UNMOUNT
  // ============================================================================
  useEffect(() => {
    const canvasContainer = threeCanvasRef?.current;
    const targetSlot = commandCenterSlotRef.current;

    if (canvasContainer && targetSlot) {
      targetSlot.appendChild(canvasContainer);
      if (sceneManager) {
        setTimeout(() => {
          if (sceneManager.handleResize) sceneManager.handleResize();
          if (sceneManager.setCameraPreset) sceneManager.setCameraPreset('AXONOMETRIC');
        }, 100);
      }
    }

    return () => {
      if (canvasContainer && mainSlotRef?.current) {
        mainSlotRef.current.appendChild(canvasContainer);
        if (sceneManager) {
          setTimeout(() => {
            if (sceneManager.handleResize) sceneManager.handleResize();
            if (sceneManager.setCameraPreset) sceneManager.setCameraPreset('HERO_VIEW');
          }, 100);
        }
      }
    };
  }, [threeCanvasRef, mainSlotRef, sceneManager]);

  // Track real camera rotation for the compass rose
  useEffect(() => {
    const timer = setInterval(() => {
      if (sceneManager && sceneManager.getCameraYaw) {
        const yaw = sceneManager.getCameraYaw();
        setCompassYaw(Math.round(yaw));
      }
    }, 200);
    return () => clearInterval(timer);
  }, [sceneManager]);

  // Keep the WebGL canvas sized to the viewport whenever the panel height
  // changes (the viewport now flexes to fill the available dashboard height).
  useEffect(() => {
    const slot = commandCenterSlotRef.current;
    if (!slot || !sceneManager || !sceneManager.handleResize) return;

    let frame = null;
    const ro = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        if (sceneManager.handleResize) sceneManager.handleResize();
      });
    });

    ro.observe(slot);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [sceneManager]);

  // ============================================================================
  // 2. FLOORS & LOCATIONS DATA
  // ============================================================================
  // All real building floors (derived from the actual room dataset — 10 levels)
  const ALL_FLOORS = useMemo(() => {
    const nums = [...new Set(rooms.map((r) => r.floor).filter((f) => !isNaN(f)))]
      .filter((f) => Number.isInteger(Number(f)))
      .sort((a, b) => Number(b) - Number(a));
    return [
      { num: 'ALL', label: 'All' },
      { num: 'ROOF', label: 'Roof' },
      ...nums.map((n) => ({ num: Number(n), label: `L${n}` })),
      { num: 'GROUND', label: 'Ground' }
    ];
  }, [rooms]);

  // Highest real floor number (used for the Roof entry point)
  const topFloor = useMemo(() => {
    const nums = rooms.map((r) => r.floor).filter((f) => Number.isInteger(Number(f))).map(Number);
    return nums.length ? Math.max(...nums) : 1;
  }, [rooms]);

  // Total live occupants across the building (drives exit load split)
  const totalOccupants = useMemo(() => rooms.reduce((s, r) => s + (r.peopleCount || 0), 0), [rooms]);

  // Build the exit rows from the REAL exit dataset, split by gate capacity
  const buildExitRows = (exitList) => {
    const capOf = (e) => e.capacity || 60;
    const capSum = exitList.reduce((s, e) => s + capOf(e), 0) || 1;
    return exitList.map((e) => {
      const share = capOf(e) / capSum;
      const people = Math.round(totalOccupants * share);
      const pct = Math.round(share * 100);
      return {
        id: e.id,
        name: e.name,
        people,
        pct,
        baselinePeople: people,
        baselinePct: pct,
        isBlocked: e.status === 'Blocked'
      };
    });
  };

  // Real exits (West Core / East Core / South Gate) with capacity-weighted load
  const [exitData, setExitData] = useState(() => buildExitRows(exits));

  // Keep the exit load split in sync with the live occupant count
  useEffect(() => {
    setExitData((prev) =>
      prev.map((e) => {
        const cap = exits.find((x) => x.id === e.id)?.capacity || 60;
        const capSum = prev.reduce((s, p) => s + (exits.find((x) => x.id === p.id)?.capacity || 60), 0) || 1;
        const share = cap / capSum;
        const people = Math.round(totalOccupants * share);
        const pct = Math.round(share * 100);
        return {
          ...e,
          name: exits.find((x) => x.id === e.id)?.name || e.name,
          people: e.isBlocked ? 0 : people,
          pct: e.isBlocked ? 0 : pct,
          baselinePeople: people,
          baselinePct: pct
        };
      })
    );
  }, [totalOccupants, exits]);

  // ============================================================================
  // ALL selectable locations on the selected floor, loaded from the REAL
  // building dataset: rooms, corridor segments, stairwell cores
  // (+ the real exit gates when the Ground level is selected).
  // Every id is a real object id used by the 3D building / navigation graph.
  // ============================================================================
  const floorLocations = useMemo(() => {
    const list = [];
    const flNum = selectedFloor === 'ROOF' ? topFloor : selectedFloor === 'GROUND' ? 1 : Number(selectedFloor);
    const theme = FLOOR_THEMES[flNum] || { name: `Floor ${flNum}`, prefix: `Floor ${flNum}` };

    // 1. Real rooms of this floor (f{fl}_r1 .. f{fl}_r10)
    rooms.filter((r) => Number(r.floor) === flNum).forEach((r, idx) => {
      const template = ROOM_TEMPLATES[idx] || { nameSuffix: `Room ${idx + 1}` };
      const roomNum = `${flNum}${idx < 9 ? '0' + (idx + 1) : idx + 1}`;
      list.push({
        id: r.id,
        category: 'ROOM',
        floor: flNum,
        roomNumber: roomNum,
        name: `Room ${roomNum}`,
        shortName: `Room ${roomNum}`,
        type: template.nameSuffix, // real dataset room name (Lab / Office 01 ...)
        zone: theme.name, // real floor department theme
        capacity: r.capacity ?? 50, // configured capacity of THIS room
        current: r.peopleCount ?? 0,
        hasFire: !!r.hasFire,
        center: r.center,
        bounds: r.bounds
      });
    });

    // 2. Real corridor segments of this floor (the 50 m corridor runner, x -25..25)
    ['west', 'east'].forEach((zone) => {
      const zoneLabel = zone === 'west' ? 'West' : 'East';
      const id = `corr_f${flNum}_${zone}`;
      list.push({
        id,
        category: 'CORRIDOR',
        floor: flNum,
        name: `${zoneLabel} Corridor — Floor ${flNum}`,
        shortName: `${zoneLabel} Corridor`,
        type: 'Corridor Segment',
        zone: zoneLabel,
        capacity: CORRIDOR_DESIGN_CAPACITY,
        current: segmentOccupancies[id] ?? 0
      });
    });

    // 3. Real stairwell cores of this floor (x = -28 / +28 in the building model)
    ['west', 'east'].forEach((zone) => {
      const zoneLabel = zone === 'west' ? 'West' : 'East';
      const coreLabel = zone === 'west' ? 'Core A' : 'Core B';
      const id = `stair_f${flNum}_${zone}`;
      list.push({
        id,
        category: 'STAIR',
        floor: flNum,
        name: `Staircase ${coreLabel} (${zoneLabel}) — Floor ${flNum}`,
        shortName: `Staircase ${coreLabel}`,
        type: 'Stairwell Core',
        zone: zoneLabel,
        capacity: STAIR_DESIGN_CAPACITY,
        current: segmentOccupancies[id] ?? 0
      });
    });

    // 4. Real ground exit gates (listed when the Ground level is selected)
    if (selectedFloor === 'GROUND') {
      exits.forEach((e) => {
        const live = exitData.find((x) => x.id === e.id);
        list.push({
          id: e.id,
          category: 'EXIT',
          floor: 1,
          name: e.name,
          shortName: e.name,
          type: 'Emergency Exit Gate',
          zone: 'Ground',
          capacity: e.capacity ?? 60,
          current: live ? live.people : 0,
          isBlocked: live ? live.isBlocked : false
        });
      });
    }

    return list;
  }, [selectedFloor, rooms, topFloor, exits, exitData, segmentOccupancies]);

  // Current Selected Location Object (fallback = first location of this floor,
  // never a hardcoded room id or floor number)
  const currentLocation = useMemo(() => {
    const found = floorLocations.find((l) => l.id === selectedLocationId);
    if (found) return found;
    return floorLocations[0] || {
      id: null,
      category: 'ROOM',
      floor: Number(selectedFloor) || 1,
      name: 'No location',
      shortName: 'No location',
      type: '—',
      zone: '—',
      capacity: 0,
      current: 0
    };
  }, [floorLocations, selectedLocationId, selectedFloor]);

  // Sync when user clicks any room, corridor, or stair directly in the 3D model
  useEffect(() => {
    if (selected3DRoom) {
      if (selected3DRoom.floor && selected3DRoom.floor !== selectedFloor) {
        setSelectedFloor(selected3DRoom.floor);
      }
      if (selected3DRoom.category) {
        setSelectedCategory(selected3DRoom.category);
      }
      setSelectedLocationId(selected3DRoom.id);
      if (sceneManager && sceneManager.highlightRoom) {
        sceneManager.highlightRoom(selected3DRoom.id);
      }
      showToast(`Selected in 3D: ${selected3DRoom.shortName || selected3DRoom.name || selected3DRoom.id}`);
    }
  }, [selected3DRoom, sceneManager]);

  // ============================================================================
  // 3. HAZARDS & EVENTS TRACKING
  // ============================================================================
  // Live event feed — seeded from the REAL scene state (no fake incidents)
  const [hazards, setHazards] = useState(() =>
    rooms
      .filter((r) => r.hasFire)
      .map((r) => ({
        id: `ev_fire_${r.id}`,
        type: 'FIRE',
        title: 'Fire — Active',
        locationId: r.id,
        locationName: `Room ${r.floor}${String(parseInt(r.id.split('_')[1]?.replace('r', '') || '1', 10) || 1).padStart(2, '0')}, Floor ${r.floor}`,
        floor: r.floor,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
  );

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState([]);

  // ── Multi-hazard incident events (power / HVAC / structural collapse) ──
  // Kept separate from the location-based `hazards` feed so Undo/Reset 3D
  // reconciliation is unaffected; rendered inside the same EVENT LOG panel.
  const [hazardEvents, setHazardEvents] = useState([]);

  useEffect(() => {
    if (!AIEngine || !AIEngine.onHazardChange) return undefined;
    const unsub = AIEngine.onHazardChange((state, evt) => {
      if (!evt) return;
      const entry = {
        id: evt.id,
        type: 'MULTI_HAZARD',
        hazardKey: evt.hazard,
        title: evt.message,
        locationName: evt.location || 'Building-wide',
        time: new Date(evt.timestamp || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        enabled: evt.enabled
      };
      setHazardEvents((prev) => [entry, ...prev].slice(0, 30));
      // Bubble into the global incident feed (sidebar + modals)
      if (onHazardEvent) onHazardEvent(evt);
      // Backend persistence parity: structural collapse → corridor block sync
      if (evt.hazard === 'structuralCollapse') {
        fetch('http://localhost:5000/api/block-corridor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ corridorId: 'C101', blocked: evt.enabled })
        }).catch(() => { });
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [onHazardEvent]);

  // ── Live Environmental Telemetry (power / HVAC / structural / summary) ──
  // Every value is computed from the ACTUAL simulation state — no hardcoding.
  const [envTelemetry, setEnvTelemetry] = useState({
    power: { mainGrid: 'ONLINE', emergencyLighting: 'INACTIVE' },
    hvac: { fans: 'RUNNING', smokePropagation: '1.0x', avgExposureRate: 0, exposedAgents: 0 },
    structural: { corridor: 'OPEN', westConnection: 'OPEN', affected: 0, rerouted: 0 },
    summary: { activeHazards: 0, evacuating: null, blockedRoutes: 0 }
  });

  useEffect(() => {
    const read = () => {
      const haz = AIEngine && AIEngine.getHazardState ? AIEngine.getHazardState() : {};
      const struct =
        sceneManager && sceneManager.getStructuralStatus ? sceneManager.getStructuralStatus() : null;
      const smoke =
        sceneManager && sceneManager.getSmokeExposureTelemetry
          ? sceneManager.getSmokeExposureTelemetry()
          : null;
      const agentStats = sceneManager && sceneManager.agentCrowd ? sceneManager.agentCrowd.cachedStats : null;

      const blockedRoutes =
        (struct && struct.active ? 1 : 0) +
        (sceneManager && sceneManager.blockedCorridorSegments
          ? sceneManager.blockedCorridorSegments.size || 0
          : 0);

      setEnvTelemetry({
        power: {
          mainGrid: haz.powerGridFailure ? 'OFFLINE' : 'ONLINE',
          emergencyLighting: haz.powerGridFailure ? 'ACTIVE' : 'INACTIVE',
          affectedZones: sceneManager && sceneManager.getPowerZones ? sceneManager.getPowerZones().length : 0
        },
        hvac: {
          fans: haz.hvacPressurizationFailure ? 'DISABLED' : 'RUNNING',
          smokePropagation: haz.hvacPressurizationFailure ? '2.2x' : '1.0x',
          avgExposureRate: smoke ? smoke.avgRate || 0 : 0,
          exposedAgents: smoke ? smoke.agentsExposed || 0 : 0
        },
        structural: {
          corridor: struct && struct.active ? 'BLOCKED' : 'OPEN',
          westConnection: struct ? struct.westStairConnection || 'OPEN' : 'OPEN',
          affected: struct ? struct.affectedAgents || 0 : 0,
          rerouted: struct ? struct.reroutedAgents || 0 : 0
        },
        summary: {
          activeHazards: ['fire', 'powerGridFailure', 'hvacPressurizationFailure', 'structuralCollapse'].filter((k) => !!haz[k]).length,
          evacuating: agentStats ? agentStats.inTransit || 0 : null,
          blockedRoutes
        }
      });
    };
    read();
    const id = setInterval(read, 1000);
    return () => clearInterval(id);
  }, [sceneManager]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const recordHistory = () => {
    setHistoryStack((prev) => [
      ...prev.slice(-10),
      {
        hazards: [...hazards],
        exitData: [...exitData],
        rooms: [...rooms]
      }
    ]);
  };

  // Building-wide event counts (the events feed is now global, not per-location)
  const fireCount = hazards.filter((h) => h.type === 'FIRE').length;
  const smokeCount = hazards.filter((h) => h.type === 'SMOKE').length;
  // Real blocked-area count (from the live event feed)
  const blockedAreasCount = hazards.filter(
    (h) => h.type === 'BLOCK_ROOM' || h.type === 'BLOCK_CORRIDOR' || h.type === 'BLOCK_STAIR'
  ).length;
  const blockedExitsCount = exitData.filter((e) => e.isBlocked).length;

  // Combined EVENT LOG feed: multi-hazard incidents first, then location events
  const mergedEvents = useMemo(() => [...hazardEvents, ...hazards], [hazardEvents, hazards]);

  // Floor-wise Occupancy — real counts for every building level
  const floorOccupancyList = useMemo(() => {
    const floors = [...new Set(rooms.map((r) => r.floor))]
      .filter((f) => Number.isInteger(Number(f)))
      .map(Number)
      .sort((a, b) => b - a);
    return floors.map((fl) => {
      const flRooms = rooms.filter((r) => r.floor === fl);
      const total = flRooms.reduce((s, r) => s + (r.peopleCount || 0), 0);
      const max = flRooms.reduce((s, r) => s + (r.capacity ?? 50), 0) || 100;
      const pct = Math.min(100, Math.round((total / max) * 100));
      return { floorName: `L${fl}`, total, max, pct, isRed: pct >= 85 };
    });
  }, [rooms]);

  // Room-wise Occupancy — independent per-room records of the selected floor
  const roomOccupancyList = useMemo(() => {
    const flNum = selectedFloor === 'ROOF' ? topFloor : selectedFloor === 'GROUND' ? 1 : Number(selectedFloor);
    return rooms
      .filter((r) => Number(r.floor) === flNum)
      .map((r, idx) => {
        const template = ROOM_TEMPLATES[idx] || { nameSuffix: `Room ${idx + 1}` };
        const roomNum = `${flNum}${idx < 9 ? '0' + (idx + 1) : idx + 1}`;
        const capacity = r.capacity ?? 50;
        const people = r.peopleCount || 0;
        const pct = Math.min(100, Math.round((people / (capacity || 1)) * 100));
        return {
          id: r.id,
          label: `Room ${roomNum}`,
          type: template.nameSuffix,
          people,
          capacity,
          pct,
          isRed: pct >= 85,
          floorNum: flNum
        };
      });
  }, [rooms, selectedFloor, topFloor]);

  const roomFloorTotal = roomOccupancyList.reduce((s, r) => s + r.people, 0);
  const roomCapacityTotal = roomOccupancyList.reduce((s, r) => s + r.capacity, 0);

  // Dynamic AI Suggestion text based on active building conditions
  const aiSuggestionText = useMemo(() => {
    const blockedExits = exitData.filter((e) => e.isBlocked);
    const activeFire = hazards.find((h) => h.type === 'FIRE');
    const activeSmoke = hazards.find((h) => h.type === 'SMOKE');
    const blockedStair = hazards.find((h) => h.type === 'BLOCK_STAIR');

    if (blockedExits.length > 0) {
      const names = blockedExits.map((e) => e.name).join(', ');
      const openExits = exitData.filter((e) => !e.isBlocked).map((e) => e.name).join(' & ');
      return `${names} is blocked. People are automatically distributed to ${openExits || 'available exits'} to avoid congestion.`;
    }
    if (blockedStair) {
      return `${blockedStair.locationName} is compromised. Evacuees are diverted via corridor links to the alternate stair core.`;
    }
    if (activeFire) {
      return `Fire active in ${activeFire.locationName}. Dynamic AI routing is diverting all egress paths safely away from the incident.`;
    }
    if (activeSmoke) {
      return `Smoke detected in ${activeSmoke.locationName}. Stairwell positive-pressure air barriers activated.`;
    }
    return 'All 3 egress portals and dual stair cores operational. AI dynamic load balancing is active.';
  }, [exitData, hazards]);

  // Click a room row in the analytics → select it everywhere (dropdown + 3D)
  const selectRoomFromAnalytics = (roomId) => {
    setSelectedLocationId(roomId);
    const loc = floorLocations.find((l) => l.id === roomId);
    if (loc) {
      if (sceneManager && sceneManager.setFloorMode) sceneManager.setFloorMode(Number(loc.floor));
      focusLocation(loc);
    }
  };

  // ============================================================================
  // 4. SELECTION & CAMERA ACTIONS
  // ============================================================================
  const handleSelectFloor = (flNum) => {
    setSelectedFloor(flNum);

    if (flNum === 'ALL') {
      if (sceneManager) {
        if (sceneManager.setFloorMode) sceneManager.setFloorMode('ALL');
        if (sceneManager.setCameraPreset) sceneManager.setCameraPreset('FULL_BUILDING');
        if (sceneManager.highlightRoom) sceneManager.highlightRoom(null);
      }
      showToast('Viewing All Floors — Full 10-Storey Building');
      return;
    }

    const flInt = flNum === 'ROOF' ? topFloor : flNum === 'GROUND' ? 1 : Number(flNum);

    if (sceneManager) {
      if (flNum === 'ROOF') {
        sceneManager.setFloorMode('ALL');
        sceneManager.setCameraPreset('ROOF');
      } else if (flNum === 'GROUND') {
        sceneManager.setFloorMode(1);
        sceneManager.setCameraPreset('FLOOR_1');
      } else {
        sceneManager.setFloorMode(flInt);
        sceneManager.setCameraPreset(`FLOOR_${flInt}`);
      }
    }

    const targetCat = flNum === 'GROUND' ? 'EXIT' : (selectedCategory || 'ROOM');
    const flList = floorLocations.filter((l) => l.category === targetCat);
    if (flList.length > 0) {
      handleSelectLocation(flList[0].id);
    } else {
      const flRooms = rooms.filter((r) => r.floor === flInt);
      if (flRooms.length > 0) {
        handleSelectLocation(flRooms[0].id);
      }
    }
  };

  const handleSelectLocation = (locId) => {
    setSelectedLocationId(locId);
    const loc = floorLocations.find((l) => l.id === locId);
    if (!loc) return;
    if (loc.category) setSelectedCategory(loc.category);

    // Camera + highlight follow the selection for every location type
    if (sceneManager && sceneManager.setFloorMode && loc.floor) {
      sceneManager.setFloorMode(Number(loc.floor));
    }
    focusLocation(loc);
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'ALL') {
      if (floorLocations.length > 0) {
        handleSelectLocation(floorLocations[0].id);
      }
      return;
    }
    if (cat === 'EXIT') {
      setSelectedFloor('GROUND');
      const firstExit = floorLocations.find((l) => l.category === 'EXIT') || exits[0];
      if (firstExit) handleSelectLocation(firstExit.id);
      return;
    }
    if (selectedFloor === 'GROUND') {
      setSelectedFloor(1);
    }
    const matching = floorLocations.filter((l) => l.category === cat);
    if (matching.length > 0) {
      handleSelectLocation(matching[0].id);
    }
  };

  // ============================================================================
  // 5. EMERGENCY ACTIONS — category aware (room / corridor / stair / exit)
  // ============================================================================

  // ORIGINAL (baseline) occupancy per room — used by "Reset Occupancy"
  const baselineOccupancyRef = useRef(null);

  // ── Real-time Evacuation Simulation Stats & Triggers ──
  const liveStats = useMemo(() => {
    if (stats) return stats;
    if (sceneManager && sceneManager.agentCrowd && sceneManager.agentCrowd.cachedStats) {
      return sceneManager.agentCrowd.cachedStats;
    }
    return {
      total: totalOccupants,
      evacuated: 0,
      inTransit: isSimulating ? totalOccupants : 0,
      elapsedSeconds: 0,
      isCompleted: false
    };
  }, [stats, sceneManager, totalOccupants, isSimulating]);

  const isCompleted = systemStatus === 'COMPLETED' || (liveStats && liveStats.isCompleted) || (liveStats && liveStats.evacuated > 0 && liveStats.evacuated === totalOccupants);

  const handleToggleEvacuation = () => {
    if (isSimulating) {
      if (onPauseSimulation) {
        onPauseSimulation();
      } else if (sceneManager && sceneManager.pauseSimulation) {
        sceneManager.pauseSimulation();
      }
      showToast('Evacuation Simulation Paused');
    } else {
      recordHistory();
      setMode('simulation');
      if (onStartSimulation) {
        onStartSimulation();
      } else if (sceneManager && sceneManager.startEvacuation) {
        sceneManager.startEvacuation();
      }
      if (sceneManager) {
        if (sceneManager.setFacadeMode) sceneManager.setFacadeMode('CUTAWAY');
        else if (sceneManager.building) sceneManager.building.facadeMode = 'CUTAWAY';
      }
      showToast('🚨 Full Facility Evacuation Protocol Initiated — AI Load-Balancing Active!');
    }
  };

  const handleResetEvacuation = () => {
    recordHistory();
    if (onResetSimulation) {
      onResetSimulation();
    } else if (sceneManager && sceneManager.reset) {
      sceneManager.reset(rooms);
    }
    showToast('Simulation Reset — Occupants returned to baseline positions.');
  };

  // ── Mode selection: 'simulation' vs 'live' ──
  if (baselineOccupancyRef.current === null) {
    baselineOccupancyRef.current = new Map(rooms.map((r) => [r.id, r.peopleCount]));
  }

  // Unique id per event so every event is managed & removed independently
  const eventSeqRef = useRef(0);
  const createEvent = (type, title, loc) => {
    eventSeqRef.current += 1;
    return {
      id: `ev_${type.toLowerCase()}_${loc.id}_${eventSeqRef.current}`,
      type,
      title,
      locationId: loc.id,
      locationName: `${loc.shortName}, Floor ${loc.floor}`,
      floor: loc.floor,
      category: loc.category,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const findEventAt = (locationId, type) =>
    hazards.find((h) => h.locationId === locationId && (!type || h.type === type));

  // ── Camera focus for ANY location type so the operator sees the effect ──
  const focusLocation = (loc) => {
    if (!sceneManager || !loc || !loc.id) return;
    const floorH = (sceneManager.building && sceneManager.building.floorHeight) || 3.8;
    const baseY = (Number(loc.floor) - 1) * floorH;
    const isWest = String(loc.id).endsWith('_west');

    if (sceneManager.setFacadeMode) {
      sceneManager.setFacadeMode('CUTAWAY');
    } else if (sceneManager.building && sceneManager.building.setFacadeMode) {
      sceneManager.building.setFacadeMode('CUTAWAY');
    }

    if (loc.category === 'ROOM') {
      if (sceneManager.setCameraPreset) sceneManager.setCameraPreset('ROOM_FOCUS', loc.id);
      if (sceneManager.highlightRoom) sceneManager.highlightRoom(loc.id);
    } else if (loc.category === 'CORRIDOR') {
      if (sceneManager.highlightRoom) sceneManager.highlightRoom(loc.id);
      if (sceneManager.focusTarget) sceneManager.focusTarget({ x: isWest ? -12.5 : 12.5, y: baseY + 2.0, z: 0 }, 40);
    } else if (loc.category === 'STAIR') {
      if (sceneManager.highlightRoom) sceneManager.highlightRoom(loc.id);
      if (sceneManager.focusTarget) sceneManager.focusTarget({ x: isWest ? -28 : 28, y: baseY + 2.0, z: 0 }, 42);
    } else if (loc.category === 'EXIT') {
      const pos = sceneManager.getExitGatePosition ? sceneManager.getExitGatePosition(loc.id) : null;
      if (sceneManager.highlightRoom) sceneManager.highlightRoom(loc.id);
      if (pos && sceneManager.focusTarget) sceneManager.focusTarget({ x: pos.x, y: 2.5, z: pos.z }, 48);
    }
  };

  // ── Reconcile the 3D scene with a given event/exit state.
  //    Used by Undo / Reset / Clear / Load so every action is reversible.
  //    Only differences are touched — one event never disturbs another. ──
  const applySceneState = (nextHazards, nextExitData) => {
    if (!sceneManager || !sceneManager.getSceneHazardState) return;
    const cur = sceneManager.getSceneHazardState();
    const ids = (type) => (nextHazards || []).filter((h) => h.type === type).map((h) => h.locationId);

    const wantFires = ids('FIRE');
    const wantSmokes = ids('SMOKE');
    const wantRooms = ids('BLOCK_ROOM');
    const wantCorrs = ids('BLOCK_CORRIDOR');
    const wantStairs = ids('BLOCK_STAIR');
    const wantExits = (nextExitData || []).filter((e) => e.isBlocked).map((e) => e.id);

    const drop = (list, want, fn) => list.filter((id) => !want.includes(id)).forEach((id) => fn(id));
    const add = (want, have, fn) => want.filter((id) => !have.includes(id)).forEach((id) => fn(id));

    drop(cur.fires, wantFires, (id) => sceneManager.extinguishFire(id));
    drop(cur.smokes, wantSmokes, (id) => sceneManager.extinguishFire(id));
    drop(cur.blockedRooms, wantRooms, (id) => sceneManager.unblockRoom(id));
    drop(cur.blockedCorridors, wantCorrs, (id) => sceneManager.unblockCorridorSegment(id));
    drop(cur.blockedStairs, wantStairs, (id) => sceneManager.unblockStairCore(id));
    drop(cur.blockedExits, wantExits, (id) => sceneManager.unblockExit(id));

    add(wantFires, cur.fires, (id) => sceneManager.triggerFire(id));
    add(wantSmokes, cur.smokes, (id) => sceneManager.spawnSmoke(id));
    add(wantRooms, cur.blockedRooms, (id) => sceneManager.blockRoom(id));
    add(wantCorrs, cur.blockedCorridors, (id) => sceneManager.blockCorridorSegment(id));
    add(wantStairs, cur.blockedStairs, (id) => sceneManager.blockStairCore(id));
    add(wantExits, cur.blockedExits, (id) => sceneManager.blockExit(id));
  };

  // ── ROOM ACTIONS ────────────────────────────────────────────────────────
  const handleAddFire = () => {
    if (!currentLocation || !currentLocation.id || !['ROOM', 'CORRIDOR', 'STAIR'].includes(currentLocation.category)) return;
    recordHistory();
    if (findEventAt(currentLocation.id, 'FIRE')) {
      showToast(`${currentLocation.shortName} already has an active fire.`);
      return;
    }
    if (findEventAt(currentLocation.id, 'SMOKE')) {
      showToast(`${currentLocation.shortName} already has active smoke — remove it first.`);
      return;
    }

    setHazards((prev) => [createEvent('FIRE', 'Fire — Active', currentLocation), ...prev]);
    focusLocation(currentLocation);
    if (onTriggerFire) {
      onTriggerFire(currentLocation.id);
    } else if (sceneManager && sceneManager.triggerFire) {
      sceneManager.triggerFire(currentLocation.id);
    }
    showToast(`Fire ignited in ${currentLocation.shortName}!`);
  };

  const handleRemoveFire = () => {
    if (!currentLocation || !currentLocation.id) return;
    const existing = findEventAt(currentLocation.id, 'FIRE');
    if (!existing) {
      showToast(`No active fire in ${currentLocation.shortName}.`);
      return;
    }
    recordHistory();
    setHazards((prev) => prev.filter((h) => h.id !== existing.id));
    focusLocation(currentLocation);
    if (onExtinguishFire) {
      onExtinguishFire(currentLocation.id);
    } else if (sceneManager && sceneManager.extinguishFire) {
      sceneManager.extinguishFire(currentLocation.id);
    }
    if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
    showToast(`Fire removed from ${currentLocation.shortName}.`);
  };

  const handleAddSmoke = () => {
    if (!currentLocation || !currentLocation.id) return;
    if (!['ROOM', 'CORRIDOR', 'STAIR'].includes(currentLocation.category)) return;
    recordHistory();
    if (findEventAt(currentLocation.id, 'SMOKE')) {
      showToast(`${currentLocation.shortName} already has active smoke.`);
      return;
    }
    if (findEventAt(currentLocation.id, 'FIRE')) {
      showToast(`${currentLocation.shortName} already has an active fire.`);
      return;
    }

    setHazards((prev) => [createEvent('SMOKE', 'Smoke — Active', currentLocation), ...prev]);
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.spawnSmoke) sceneManager.spawnSmoke(currentLocation.id);
    showToast(`Smoke reported in ${currentLocation.shortName}.`);
  };

  const handleRemoveSmoke = () => {
    if (!currentLocation || !currentLocation.id) return;
    const existing = findEventAt(currentLocation.id, 'SMOKE');
    if (!existing) {
      showToast(`No active smoke in ${currentLocation.shortName}.`);
      return;
    }
    recordHistory();
    setHazards((prev) => prev.filter((h) => h.id !== existing.id));
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.extinguishFire) sceneManager.extinguishFire(currentLocation.id);
    if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
    showToast(`Smoke cleared from ${currentLocation.shortName}.`);
  };

  const handleBlockArea = () => {
    if (!currentLocation || !currentLocation.id || currentLocation.category !== 'ROOM') return;
    recordHistory();
    if (findEventAt(currentLocation.id, 'BLOCK_ROOM')) {
      showToast(`${currentLocation.shortName} is already blocked.`);
      return;
    }
    setHazards((prev) => [createEvent('BLOCK_ROOM', 'Room Blocked', currentLocation), ...prev]);
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.blockRoom) sceneManager.blockRoom(currentLocation.id);
    showToast(`${currentLocation.shortName} marked as Blocked!`);
  };

  const handleUnblockArea = () => {
    if (!currentLocation || !currentLocation.id || currentLocation.category !== 'ROOM') return;
    const existing = findEventAt(currentLocation.id, 'BLOCK_ROOM');
    if (!existing) {
      showToast(`${currentLocation.shortName} is not blocked.`);
      return;
    }
    recordHistory();
    setHazards((prev) => prev.filter((h) => h.id !== existing.id));
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.unblockRoom) sceneManager.unblockRoom(currentLocation.id);
    showToast(`${currentLocation.shortName} unblocked.`);
  };

  // ── CORRIDOR ACTIONS ────────────────────────────────────────────────────
  const handleBlockCorridor = () => {
    if (!currentLocation || currentLocation.category !== 'CORRIDOR') return;
    recordHistory();
    if (findEventAt(currentLocation.id, 'BLOCK_CORRIDOR')) {
      showToast(`${currentLocation.shortName} is already blocked.`);
      return;
    }
    setHazards((prev) => [createEvent('BLOCK_CORRIDOR', 'Corridor Blocked', currentLocation), ...prev]);
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.blockCorridorSegment) sceneManager.blockCorridorSegment(currentLocation.id);
    showToast(`${currentLocation.shortName} blocked — routes recalculated.`);
  };

  const handleUnblockCorridor = () => {
    if (!currentLocation || currentLocation.category !== 'CORRIDOR') return;
    const existing = findEventAt(currentLocation.id, 'BLOCK_CORRIDOR');
    if (!existing) {
      showToast(`${currentLocation.shortName} is not blocked.`);
      return;
    }
    recordHistory();
    setHazards((prev) => prev.filter((h) => h.id !== existing.id));
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.unblockCorridorSegment) sceneManager.unblockCorridorSegment(currentLocation.id);
    showToast(`${currentLocation.shortName} reopened.`);
  };

  // ── STAIRCASE ACTIONS ───────────────────────────────────────────────────
  const handleBlockStair = () => {
    if (!currentLocation || currentLocation.category !== 'STAIR') return;
    recordHistory();
    if (findEventAt(currentLocation.id, 'BLOCK_STAIR')) {
      showToast(`${currentLocation.shortName} is already blocked.`);
      return;
    }
    setHazards((prev) => [createEvent('BLOCK_STAIR', 'Staircase Blocked', currentLocation), ...prev]);
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.blockStairCore) sceneManager.blockStairCore(currentLocation.id);
    if (onBlockStairwell) onBlockStairwell(currentLocation.zone, currentLocation.floor);
    showToast(`${currentLocation.shortName} blocked — agents diverted to the other core.`);
  };

  const handleUnblockStair = () => {
    if (!currentLocation || currentLocation.category !== 'STAIR') return;
    const existing = findEventAt(currentLocation.id, 'BLOCK_STAIR');
    if (!existing) {
      showToast(`${currentLocation.shortName} is not blocked.`);
      return;
    }
    recordHistory();
    setHazards((prev) => prev.filter((h) => h.id !== existing.id));
    focusLocation(currentLocation);
    if (sceneManager && sceneManager.unblockStairCore) sceneManager.unblockStairCore(currentLocation.id);
    if (onBlockStairwell) onBlockStairwell(currentLocation.zone, null);
    showToast(`${currentLocation.shortName} reopened.`);
  };

  // ── EXIT ACTIONS (apply to the selected exit, or the first available one) ──
  const handleBlockExit = () => {
    if (currentLocation && currentLocation.category === 'EXIT') {
      if (exitData.find((e) => e.id === currentLocation.id && e.isBlocked)) {
        showToast(`${currentLocation.shortName} is already blocked.`);
        return;
      }
      handleToggleExit(currentLocation.id, true);
      return;
    }
    const targetExit = exitData.find((e) => !e.isBlocked) || exitData[exitData.length - 1];
    if (targetExit) handleToggleExit(targetExit.id, true);
  };

  const handleUnblockExit = () => {
    if (currentLocation && currentLocation.category === 'EXIT') {
      if (!exitData.find((e) => e.id === currentLocation.id && e.isBlocked)) {
        showToast(`${currentLocation.shortName} is already open.`);
        return;
      }
      handleToggleExit(currentLocation.id, false);
      return;
    }
    const blockedExit = exitData.find((e) => e.isBlocked);
    if (blockedExit) {
      handleToggleExit(blockedExit.id, false);
    } else {
      showToast('All exits are already open.');
    }
  };

  const handleToggleExit = (exitId, blockState) => {
    recordHistory();
    const exitName = exitData.find((e) => e.id === exitId)?.name || exitId;
    setExitData((prev) =>
      prev.map((e) => (e.id === exitId ? { ...e, isBlocked: blockState, people: blockState ? 0 : e.baselinePeople, pct: blockState ? 0 : e.baselinePct } : e))
    );

    // Apply to the actual 3D twin (routing + visible gate barrier)
    if (sceneManager) {
      if (blockState && sceneManager.blockExit) sceneManager.blockExit(exitId);
      if (!blockState && sceneManager.unblockExit) sceneManager.unblockExit(exitId);
      const pos = sceneManager.getExitGatePosition ? sceneManager.getExitGatePosition(exitId) : null;
      if (pos && sceneManager.focusTarget) {
        sceneManager.focusTarget({ x: pos.x, y: 2.5, z: pos.z }, 48);
      }
    }
    showToast(`${exitName} ${blockState ? 'Blocked' : 'Restored'}!`);
  };

  // ── MULTI-HAZARD GRANULAR ACTIONS (POWER, HVAC, STRUCTURAL COLLAPSE) ────
  const handleTogglePower = () => {
    if (!currentLocation || !currentLocation.id) return;
    recordHistory();
    const existing = findEventAt(currentLocation.id, 'POWER_OUTAGE');
    if (existing) {
      setHazards((prev) => prev.filter((h) => h.id !== existing.id));
      if (sceneManager && sceneManager.setPowerGridFailure) {
        sceneManager.setPowerGridFailure(false, currentLocation);
      }
      if (AIEngine && AIEngine.togglePowerFailure) {
        AIEngine.togglePowerFailure(false, currentLocation);
      }
      showToast(`Power restored in ${currentLocation.shortName}.`);
    } else {
      setHazards((prev) => [createEvent('POWER_OUTAGE', 'Power Outage', currentLocation), ...prev]);
      focusLocation(currentLocation);
      if (sceneManager && sceneManager.setPowerGridFailure) {
        sceneManager.setPowerGridFailure(true, currentLocation);
      }
      if (AIEngine && AIEngine.togglePowerFailure) {
        AIEngine.togglePowerFailure(true, currentLocation);
      }
      showToast(`Power failure in ${currentLocation.shortName} — emergency lighting active.`);
    }
  };

  const handleToggleHvac = () => {
    if (!currentLocation || !currentLocation.id) return;
    recordHistory();
    const existing = findEventAt(currentLocation.id, 'HVAC_FAILURE');
    if (existing) {
      setHazards((prev) => prev.filter((h) => h.id !== existing.id));
      if (sceneManager && sceneManager.setHvacFailure) {
        sceneManager.setHvacFailure(false, currentLocation);
      }
      if (AIEngine && AIEngine.toggleHvacFailure) {
        AIEngine.toggleHvacFailure(false, currentLocation);
      }
      showToast(`HVAC restored in ${currentLocation.shortName}.`);
    } else {
      setHazards((prev) => [createEvent('HVAC_FAILURE', 'HVAC Failure', currentLocation), ...prev]);
      focusLocation(currentLocation);
      if (sceneManager && sceneManager.setHvacFailure) {
        sceneManager.setHvacFailure(true, currentLocation);
      }
      if (AIEngine && AIEngine.toggleHvacFailure) {
        AIEngine.toggleHvacFailure(true, currentLocation);
      }
      showToast(`HVAC offline in ${currentLocation.shortName} — smoke containment degraded.`);
    }
  };

  const handleToggleCollapse = () => {
    if (!currentLocation || !currentLocation.id) return;
    recordHistory();
    const existing = findEventAt(currentLocation.id, 'STRUCTURAL_COLLAPSE');
    if (existing) {
      setHazards((prev) => prev.filter((h) => h.id !== existing.id));
      if (sceneManager && sceneManager.setStructuralCollapse) {
        sceneManager.setStructuralCollapse(false, currentLocation);
      }
      if (AIEngine && AIEngine.toggleStructuralCollapse) {
        AIEngine.toggleStructuralCollapse(false, currentLocation);
      }
      showToast(`Debris cleared at ${currentLocation.shortName} — route reopened.`);
    } else {
      setHazards((prev) => [createEvent('STRUCTURAL_COLLAPSE', 'Structural Collapse', currentLocation), ...prev]);
      focusLocation(currentLocation);
      if (sceneManager && sceneManager.setStructuralCollapse) {
        sceneManager.setStructuralCollapse(true, currentLocation);
      }
      if (AIEngine && AIEngine.toggleStructuralCollapse) {
        AIEngine.toggleStructuralCollapse(true, currentLocation);
      }
      showToast(`Structural collapse at ${currentLocation.shortName} — 3D debris rendered & route severed!`);
    }
  };

  // ── PEOPLE MANAGEMENT — STRICTLY the selected room, nothing else ─────────
  // Updates only that room's record, then aggregates floor/building totals from
  // the individual room records (never redistributes people between rooms).
  const applyRoomOccupancy = (roomId, nextVal, announce = true) => {
    if (!roomId) return;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      // Requirement: report missing mapping instead of acting on the wrong object
      showToast(`Room ${roomId} has no building data — occupancy not changed.`);
      return;
    }
    const capacity = room.capacity ?? currentLocation.capacity ?? 50;
    const clamped = Math.max(0, Math.min(capacity, nextVal));
    recordHistory();

    if (onUpdateOccupancy) {
      // updates THIS room only + 3D occupancy indicator + backend record
      onUpdateOccupancy(roomId, clamped);
    } else if (onUpdateRooms) {
      onUpdateRooms(rooms.map((r) => (r.id === roomId ? { ...r, peopleCount: clamped } : r)));
    }
    if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
    if (announce) showToast(`${room.name || roomId}: ${clamped} / ${capacity} occupants.`);
  };

  const handleIncreasePeople = () => {
    if (!currentLocation || !currentLocation.id) return;
    if (currentLocation.category === 'ROOM') {
      applyRoomOccupancy(currentLocation.id, currentLocation.current + 5);
    } else if (['CORRIDOR', 'STAIR'].includes(currentLocation.category)) {
      recordHistory();
      const cap = currentLocation.capacity || 45;
      const cur = segmentOccupancies[currentLocation.id] || 0;
      const next = Math.min(cap, cur + 5);
      setSegmentOccupancies((prev) => ({ ...prev, [currentLocation.id]: next }));
      if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
      showToast(`${currentLocation.shortName}: ${next} / ${cap} occupants.`);
    }
  };

  const handleDecreasePeople = () => {
    if (!currentLocation || !currentLocation.id) return;
    if (currentLocation.category === 'ROOM') {
      applyRoomOccupancy(currentLocation.id, currentLocation.current - 5);
    } else if (['CORRIDOR', 'STAIR'].includes(currentLocation.category)) {
      recordHistory();
      const cap = currentLocation.capacity || 45;
      const cur = segmentOccupancies[currentLocation.id] || 0;
      const next = Math.max(0, cur - 5);
      setSegmentOccupancies((prev) => ({ ...prev, [currentLocation.id]: next }));
      if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
      showToast(`${currentLocation.shortName}: ${next} / ${cap} occupants.`);
    }
  };

  const handleSetExactPeople = () => {
    if (!currentLocation || !currentLocation.id) return;
    if (currentLocation.category === 'ROOM') {
      const input = window.prompt(
        `Enter exact people count for ${currentLocation.shortName} (Max ${currentLocation.capacity}):`,
        currentLocation.current
      );
      if (input !== null && !isNaN(input)) {
        applyRoomOccupancy(currentLocation.id, parseInt(input, 10));
      }
    } else if (['CORRIDOR', 'STAIR'].includes(currentLocation.category)) {
      const cap = currentLocation.capacity || 45;
      const cur = segmentOccupancies[currentLocation.id] || 0;
      const input = window.prompt(
        `Enter exact people count for ${currentLocation.shortName} (Max ${cap}):`,
        cur
      );
      if (input !== null && !isNaN(input)) {
        recordHistory();
        const val = Math.max(0, Math.min(cap, parseInt(input, 10)));
        setSegmentOccupancies((prev) => ({ ...prev, [currentLocation.id]: val }));
        if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
        showToast(`${currentLocation.shortName}: ${val} / ${cap} occupants.`);
      }
    }
  };

  const handleAdjustPeopleStep = (delta) => {
    if (!currentLocation || currentLocation.category !== 'ROOM' || !currentLocation.id) return;
    applyRoomOccupancy(currentLocation.id, currentLocation.current + delta, false);
  };

  const handleResetRoomOccupancy = () => {
    if (!currentLocation || currentLocation.category !== 'ROOM' || !currentLocation.id) return;
    const baseline = baselineOccupancyRef.current?.get(currentLocation.id);
    if (baseline === undefined) {
      showToast(`No baseline recorded for ${currentLocation.shortName}.`);
      return;
    }
    applyRoomOccupancy(currentLocation.id, baseline);
    showToast(`${currentLocation.shortName} reset to its baseline occupancy (${baseline}).`);
  };

  // ── Remove ONE event by its unique id (others are never touched) ─────────
  const handleRemoveHazard = (hazardId) => {
    // Multi-hazard log rows: removing clears only the log entry
    // (the hazard itself is toggled from the Multi-Hazard Control matrix)
    const hazardRow = hazardEvents.find((h) => h.id === hazardId);
    if (hazardRow) {
      setHazardEvents((prev) => prev.filter((h) => h.id !== hazardId));
      return;
    }

    const targetEvent = hazards.find((h) => h.id === hazardId);
    if (!targetEvent) return;
    recordHistory();

    if (targetEvent.type === 'FIRE') {
      if (onExtinguishFire) {
        onExtinguishFire(targetEvent.locationId);
      } else if (sceneManager && sceneManager.extinguishFire) {
        sceneManager.extinguishFire(targetEvent.locationId);
      }
    } else if (targetEvent.type === 'SMOKE') {
      if (sceneManager && sceneManager.extinguishFire) sceneManager.extinguishFire(targetEvent.locationId);
    } else if (targetEvent.type === 'BLOCK_ROOM') {
      if (sceneManager && sceneManager.unblockRoom) sceneManager.unblockRoom(targetEvent.locationId);
    } else if (targetEvent.type === 'BLOCK_CORRIDOR') {
      if (sceneManager && sceneManager.unblockCorridorSegment) sceneManager.unblockCorridorSegment(targetEvent.locationId);
    } else if (targetEvent.type === 'BLOCK_STAIR') {
      if (sceneManager && sceneManager.unblockStairCore) sceneManager.unblockStairCore(targetEvent.locationId);
    }

    setHazards((prev) => prev.filter((h) => h.id !== targetEvent.id));
    if (sceneManager && sceneManager.recalculateDynamicRoutes) sceneManager.recalculateDynamicRoutes();
    showToast(`Removed: ${targetEvent.title} @ ${targetEvent.locationName}.`);
  };

  const handleRecalculateRoutes = () => {
    showToast('Recalculating intelligent evacuation routes across all exits...');
    if (sceneManager && sceneManager.recalculateDynamicRoutes) {
      sceneManager.recalculateDynamicRoutes();
    }
  };

  // ── Undo: restore the previous state AND reconcile the 3D scene ──
  const handleUndo = () => {
    if (historyStack.length === 0) {
      showToast('No actions to undo.');
      return;
    }
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setHazards(previous.hazards);
    setExitData(previous.exitData);
    if (onUpdateRooms && previous.rooms) onUpdateRooms(previous.rooms);
    applySceneState(previous.hazards, previous.exitData);
    showToast('Reverted to previous state.');
  };

  // Reconcile the REAL 3D scene with a calm state (no events, no blocked exits)
  const clearSceneHazards = () => {
    applySceneState([], []);
  };

  const handleResetScenario = () => {
    recordHistory();
    setHazards([]);
    setExitData((prev) => prev.map((e) => ({ ...e, isBlocked: false, people: e.baselinePeople, pct: e.baselinePct })));
    clearSceneHazards();
    if (onClearAllFires) onClearAllFires();
    showToast('Scenario reset to calm default baseline.');
  };

  const handleClearAll = () => {
    recordHistory();
    setHazards([]);
    setExitData((prev) => prev.map((e) => ({ ...e, isBlocked: false, people: e.baselinePeople, pct: e.baselinePct })));
    clearSceneHazards();
    if (onClearAllFires) onClearAllFires();
    showToast('All emergency scenarios cleared.');
  };

  // ── Save / Load scenario (events + exits + occupancy, stored SEPARATELY from
  //    the building dataset so the building model is never modified) ──
  const handleSaveScenario = () => {
    try {
      const snapshot = {
        savedAt: new Date().toISOString(),
        hazards,
        exits: exitData.map((e) => ({ id: e.id, isBlocked: e.isBlocked })),
        occupancy: rooms.map((r) => ({ id: r.id, peopleCount: r.peopleCount }))
      };
      localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(snapshot));
      showToast(`Scenario saved (${hazards.length} event${hazards.length === 1 ? '' : 's'}).`);
    } catch {
      showToast('Could not save scenario (storage unavailable).');
    }
  };

  const handleLoadScenario = () => {
    const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (!raw) {
      showToast('No saved scenario found.');
      return;
    }
    let snap;
    try {
      snap = JSON.parse(raw);
    } catch {
      showToast('Saved scenario is corrupted.');
      return;
    }
    recordHistory();

    // 1. Occupancy records (per room, never redistributed)
    if (Array.isArray(snap.occupancy) && onUpdateRooms) {
      const byId = new Map(snap.occupancy.map((o) => [o.id, o.peopleCount]));
      onUpdateRooms(rooms.map((r) => (byId.has(r.id) ? { ...r, peopleCount: byId.get(r.id) } : r)));
    }

    // 2. Exit states
    const nextExitData = exitData.map((e) => {
      const saved = (snap.exits || []).find((x) => x.id === e.id);
      const blocked = saved ? !!saved.isBlocked : e.isBlocked;
      return { ...e, isBlocked: blocked, people: blocked ? 0 : e.baselinePeople, pct: blocked ? 0 : e.baselinePct };
    });
    setExitData(nextExitData);

    // 3. Events + the 3D effects that belong to them
    const nextHazards = Array.isArray(snap.hazards) ? snap.hazards : [];
    setHazards(nextHazards);
    applySceneState(nextHazards, nextExitData);

    // 4. Bring the operator to the first event of the loaded scenario
    const first = nextHazards[0];
    if (first) {
      setSelectedFloor(first.floor);
      setSelectedLocationId(first.locationId);
    }
    showToast(`Scenario loaded (${nextHazards.length} event${nextHazards.length === 1 ? '' : 's'}).`);
  };

  // ── Live occupancy/status of the selected corridor or staircase ──
  const [segmentInfo, setSegmentInfo] = useState(null);
  useEffect(() => {
    const isSegment =
      currentLocation && (currentLocation.category === 'CORRIDOR' || currentLocation.category === 'STAIR');
    if (!sceneManager || !isSegment || !sceneManager.getSegmentOccupancy) {
      setSegmentInfo(null);
      return undefined;
    }
    const read = () => setSegmentInfo(sceneManager.getSegmentOccupancy(currentLocation.id));
    read();
    const timer = setInterval(read, 900);
    return () => clearInterval(timer);
  }, [sceneManager, currentLocation ? currentLocation.id : null, currentLocation ? currentLocation.category : null]);

  // ── 3D object mapping check — if a location has no valid 3D object we report
  //    the missing mapping instead of rendering an effect at a wrong place ──
  const mapping3D = useMemo(() => {
    if (!sceneManager || !currentLocation || !currentLocation.id) return null;
    if (currentLocation.category === 'ROOM' && sceneManager.getRoomMapping) {
      return sceneManager.getRoomMapping(currentLocation.id);
    }
    if (currentLocation.category === 'EXIT' && sceneManager.getExitGatePosition) {
      const pos = sceneManager.getExitGatePosition(currentLocation.id);
      return pos ? { id: currentLocation.id, found: true, center: pos } : null;
    }
    if (currentLocation.category === 'CORRIDOR' && sceneManager.getCorridorSegmentBounds) {
      const b = sceneManager.getCorridorSegmentBounds(currentLocation.id);
      return b ? { id: currentLocation.id, found: true, center: { x: b.centerX, y: 0, z: 0 } } : null;
    }
    if (currentLocation.category === 'STAIR' && sceneManager.parseSegId) {
      const s = sceneManager.parseSegId(currentLocation.id);
      return s ? { id: currentLocation.id, found: true, center: { x: s.zone === 'west' ? -28 : 28, y: 0, z: 0 } } : null;
    }
    return null;
  }, [sceneManager, currentLocation]);

  // ── Actions available for the selected category (requirement 3) ──
  // ── Actions available for the selected category (Single Toggle Button per Hazard) ──
  // ── Actions available for the selected category (ALL Multi-Hazards as Smart Toggles) ──
  const locationActions = useMemo(() => {
    if (!currentLocation || !currentLocation.id) return [];
    const cat = currentLocation.category || 'ROOM';

    const hasFire = !!findEventAt(currentLocation.id, 'FIRE');
    const hasSmoke = !!findEventAt(currentLocation.id, 'SMOKE');
    const hasPower = !!findEventAt(currentLocation.id, 'POWER_OUTAGE');
    const hasHvac = !!findEventAt(currentLocation.id, 'HVAC_FAILURE');
    const hasCollapse = !!findEventAt(currentLocation.id, 'STRUCTURAL_COLLAPSE');

    if (cat === 'ROOM') {
      const isBlocked = !!findEventAt(currentLocation.id, 'BLOCK_ROOM');
      return [
        {
          key: 'toggleFire',
          label: hasFire ? 'Remove Fire' : 'Add Fire',
          status: hasFire ? 'ACTIVE' : 'OFF',
          isActive: hasFire,
          Icon: Flame,
          tone: hasFire ? 'red-active' : 'red',
          onClick: hasFire ? handleRemoveFire : handleAddFire
        },
        {
          key: 'toggleSmoke',
          label: hasSmoke ? 'Remove Smoke' : 'Add Smoke',
          status: hasSmoke ? 'ACTIVE' : 'OFF',
          isActive: hasSmoke,
          Icon: Cloud,
          tone: hasSmoke ? 'blue-active' : 'blue',
          onClick: hasSmoke ? handleRemoveSmoke : handleAddSmoke
        },
        {
          key: 'togglePower',
          label: hasPower ? 'Restore Power' : 'Power Outage',
          status: hasPower ? 'DARK' : 'NORMAL',
          isActive: hasPower,
          Icon: Zap,
          tone: hasPower ? 'amber-active' : 'amber',
          onClick: handleTogglePower
        },
        {
          key: 'toggleHvac',
          label: hasHvac ? 'Restore HVAC' : 'HVAC Failure',
          status: hasHvac ? 'OFFLINE' : 'NORMAL',
          isActive: hasHvac,
          Icon: Wind,
          tone: hasHvac ? 'purple-active' : 'purple',
          onClick: handleToggleHvac
        },
        {
          key: 'toggleCollapse',
          label: hasCollapse ? 'Clear Rubble' : '3D Collapse',
          status: hasCollapse ? 'COLLAPSED' : 'NORMAL',
          isActive: hasCollapse,
          Icon: BrickWall,
          tone: hasCollapse ? 'orange-active' : 'orange',
          onClick: handleToggleCollapse
        },
        {
          key: 'toggleBlock',
          label: isBlocked ? 'Unblock Room' : 'Block Room',
          status: isBlocked ? 'BLOCKED' : 'OPEN',
          isActive: isBlocked,
          Icon: isBlocked ? CheckCircle2 : Ban,
          tone: isBlocked ? 'red-active' : 'slate',
          onClick: isBlocked ? handleUnblockArea : handleBlockArea
        },
        { key: 'incPeople', label: 'Increase People', Icon: UserPlus, tone: 'slate', onClick: handleIncreasePeople },
        { key: 'decPeople', label: 'Decrease People', Icon: UserMinus, tone: 'slate', onClick: handleDecreasePeople },
        { key: 'setPeople', label: 'Set People Count', Icon: Users, tone: 'slate', onClick: handleSetExactPeople }
      ];
    }
    if (cat === 'CORRIDOR') {
      const isBlocked = !!findEventAt(currentLocation.id, 'BLOCK_CORRIDOR');
      return [
        {
          key: 'toggleFire',
          label: hasFire ? 'Remove Fire' : 'Add Fire',
          status: hasFire ? 'ACTIVE' : 'OFF',
          isActive: hasFire,
          Icon: Flame,
          tone: hasFire ? 'red-active' : 'red',
          onClick: hasFire ? handleRemoveFire : handleAddFire
        },
        {
          key: 'toggleSmoke',
          label: hasSmoke ? 'Remove Smoke' : 'Add Smoke',
          status: hasSmoke ? 'ACTIVE' : 'OFF',
          isActive: hasSmoke,
          Icon: Cloud,
          tone: hasSmoke ? 'blue-active' : 'blue',
          onClick: hasSmoke ? handleRemoveSmoke : handleAddSmoke
        },
        {
          key: 'togglePower',
          label: hasPower ? 'Restore Power' : 'Power Outage',
          status: hasPower ? 'DARK' : 'NORMAL',
          isActive: hasPower,
          Icon: Zap,
          tone: hasPower ? 'amber-active' : 'amber',
          onClick: handleTogglePower
        },
        {
          key: 'toggleHvac',
          label: hasHvac ? 'Restore HVAC' : 'HVAC Failure',
          status: hasHvac ? 'OFFLINE' : 'NORMAL',
          isActive: hasHvac,
          Icon: Wind,
          tone: hasHvac ? 'purple-active' : 'purple',
          onClick: handleToggleHvac
        },
        {
          key: 'toggleCollapse',
          label: hasCollapse ? 'Clear Rubble' : '3D Collapse',
          status: hasCollapse ? 'COLLAPSED' : 'NORMAL',
          isActive: hasCollapse,
          Icon: BrickWall,
          tone: hasCollapse ? 'orange-active' : 'orange',
          onClick: handleToggleCollapse
        },
        {
          key: 'toggleBlock',
          label: isBlocked ? 'Unblock Corridor' : 'Block Corridor',
          status: isBlocked ? 'BLOCKED' : 'OPEN',
          isActive: isBlocked,
          Icon: isBlocked ? CheckCircle2 : Ban,
          tone: isBlocked ? 'red-active' : 'slate',
          onClick: isBlocked ? handleUnblockCorridor : handleBlockCorridor
        },
        { key: 'incPeople', label: 'Increase People', Icon: UserPlus, tone: 'slate', onClick: handleIncreasePeople },
        { key: 'decPeople', label: 'Decrease People', Icon: UserMinus, tone: 'slate', onClick: handleDecreasePeople },
        { key: 'setPeople', label: 'Set People Count', Icon: Users, tone: 'slate', onClick: handleSetExactPeople }
      ];
    }
    if (cat === 'STAIR') {
      const isBlocked = !!findEventAt(currentLocation.id, 'BLOCK_STAIR');
      return [
        {
          key: 'toggleFire',
          label: hasFire ? 'Remove Fire' : 'Add Fire',
          status: hasFire ? 'ACTIVE' : 'OFF',
          isActive: hasFire,
          Icon: Flame,
          tone: hasFire ? 'red-active' : 'red',
          onClick: hasFire ? handleRemoveFire : handleAddFire
        },
        {
          key: 'toggleSmoke',
          label: hasSmoke ? 'Remove Smoke' : 'Add Smoke',
          status: hasSmoke ? 'ACTIVE' : 'OFF',
          isActive: hasSmoke,
          Icon: Cloud,
          tone: hasSmoke ? 'blue-active' : 'blue',
          onClick: hasSmoke ? handleRemoveSmoke : handleAddSmoke
        },
        {
          key: 'togglePower',
          label: hasPower ? 'Restore Power' : 'Power Outage',
          status: hasPower ? 'DARK' : 'NORMAL',
          isActive: hasPower,
          Icon: Zap,
          tone: hasPower ? 'amber-active' : 'amber',
          onClick: handleTogglePower
        },
        {
          key: 'toggleHvac',
          label: hasHvac ? 'Restore HVAC' : 'HVAC Failure',
          status: hasHvac ? 'OFFLINE' : 'NORMAL',
          isActive: hasHvac,
          Icon: Wind,
          tone: hasHvac ? 'purple-active' : 'purple',
          onClick: handleToggleHvac
        },
        {
          key: 'toggleCollapse',
          label: hasCollapse ? 'Clear Rubble' : '3D Collapse',
          status: hasCollapse ? 'COLLAPSED' : 'NORMAL',
          isActive: hasCollapse,
          Icon: BrickWall,
          tone: hasCollapse ? 'orange-active' : 'orange',
          onClick: handleToggleCollapse
        },
        {
          key: 'toggleBlock',
          label: isBlocked ? 'Unblock Staircase' : 'Block Staircase',
          status: isBlocked ? 'BLOCKED' : 'OPEN',
          isActive: isBlocked,
          Icon: isBlocked ? CheckCircle2 : Ban,
          tone: isBlocked ? 'red-active' : 'slate',
          onClick: isBlocked ? handleUnblockStair : handleBlockStair
        },
        { key: 'incPeople', label: 'Increase People', Icon: UserPlus, tone: 'slate', onClick: handleIncreasePeople },
        { key: 'decPeople', label: 'Decrease People', Icon: UserMinus, tone: 'slate', onClick: handleDecreasePeople },
        { key: 'setPeople', label: 'Set People Count', Icon: Users, tone: 'slate', onClick: handleSetExactPeople }
      ];
    }
    if (cat === 'EXIT') {
      const isBlocked = !!exitData.find((e) => e.id === currentLocation.id && e.isBlocked);
      return [
        {
          key: 'toggleCollapse',
          label: hasCollapse ? 'Clear Rubble' : '3D Collapse',
          status: hasCollapse ? 'COLLAPSED' : 'NORMAL',
          isActive: hasCollapse,
          Icon: BrickWall,
          tone: hasCollapse ? 'orange-active' : 'orange',
          onClick: handleToggleCollapse
        },
        {
          key: 'toggleBlock',
          label: isBlocked ? 'Unblock Exit' : 'Block Exit',
          status: isBlocked ? 'BLOCKED' : 'OPEN',
          isActive: isBlocked,
          Icon: isBlocked ? CheckCircle2 : Ban,
          tone: isBlocked ? 'red-active' : 'red',
          onClick: isBlocked ? handleUnblockExit : handleBlockExit
        }
      ];
    }
    return [];
  }, [currentLocation, hazards, exitData]);

  // Clicking an event selects its location (floor dropdown + 3D camera follow)
  const focusEventLocation = (h) => {
    setSelectedFloor(h.floor);
    setSelectedLocationId(h.locationId);
    if (sceneManager && sceneManager.setFloorMode) sceneManager.setFloorMode(Number(h.floor));
    const loc = floorLocations.find((l) => l.id === h.locationId) || {
      id: h.locationId,
      category: h.category || 'ROOM',
      floor: h.floor
    };
    focusLocation(loc);
    showToast(`Selected: ${h.locationName}`);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full h-full p-2.5 md:p-3.5 font-sans select-none overflow-y-auto lg:overflow-hidden overflow-x-hidden relative flex flex-col transition-colors duration-300 ${isDark ? 'theme-dark bg-[#070e1b] text-slate-100' : 'theme-light bg-[#f4f6fa] text-slate-800'
        }`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER                                                                */}
      {/* ========================================================================= */}
      <header className={`flex flex-wrap items-center justify-between pb-3 border-b gap-x-3 gap-y-2.5 shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200/80'}`}>
        {/* Left: Siren + Title + Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0 ${isDark ? 'bg-slate-900 border border-red-900/50' : 'bg-white border border-red-100'}`}>
            <Siren className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-xl md:text-2xl font-black tracking-tight leading-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Emergency Command Center
            </h1>
            <p className={`text-[11px] md:text-xs font-medium truncate max-w-[260px] sm:max-w-sm md:max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Monitor incidents, manage emergency scenarios and coordinate intelligent building evacuation in real time.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={handleSaveScenario}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border shrink-0 ${isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
          >
            <Save className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <span>Save Scenario</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs bg-red-500 hover:bg-red-600 text-white shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          {(onSwitchTo3D || onClose) && (
            <button
              onClick={onSwitchTo3D || onClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-white shrink-0 ml-1 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              title="Return to Main 3D View"
            >
              <X className="w-3.5 h-3.5" />
              <span>Return to 3D View</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN LAYOUT GRID (LEFT 8 COLS, RIGHT 4 COLS MATCHING TARGET DESIGN)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 md:gap-3 mt-2 flex-1 min-h-0">
        {/* ────────────────────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: 3D VIEWPORT + BOTTOM DUAL CARDS (8 COLS)                   */}
        {/* ────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 min-w-0">
          {/* ── 3D Viewport Container (fills upper area) ── */}
          <div className={`relative w-full rounded-2xl overflow-hidden border shadow-sm flex flex-col h-[270px] sm:h-[300px] md:h-[320px] lg:h-[335px] xl:h-[350px] shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-200/90'}`}>
            {/* Top Left: Main Academic Building Dropdown Pill */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-md border text-[11px] font-semibold shadow-lg ${isDark
                  ? 'bg-slate-950/80 border-slate-700/80 text-white'
                  : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-sm'
                }`}>
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate max-w-[160px] sm:max-w-none">{selectedBuilding}</span>
                <ChevronDown className={`w-3 h-3 shrink-0 ml-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            </div>

            {/* ── FLOATING TACTICAL EVACUATION HUD (Top Center of 3D Canvas) ── */}
            <div className={`absolute top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md border shadow-2xl ${isDark ? 'bg-slate-950/90 border-slate-700/80 text-slate-200' : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-md'
              }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-red-500 animate-ping' : isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {isSimulating ? 'Evacuation Active' : isCompleted ? 'All Safe Outside' : 'Ready'}
                </span>
                {liveStats && isSimulating && (
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">
                    {Math.round((liveStats.evacuated / Math.max(1, totalOccupants)) * 100)}% Safe ({liveStats.evacuated}/{totalOccupants})
                  </span>
                )}
              </div>

              <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />

              <button
                onClick={handleToggleEvacuation}
                className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${isSimulating
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                    : isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/40 animate-pulse'
                  }`}
                title={isSimulating ? 'Pause Evacuation Simulation' : 'Start Intelligent Building Evacuation Protocol'}
              >
                {isSimulating ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isSimulating ? 'PAUSE EVACUATION' : 'START EVACUATION'}</span>
              </button>

              {(isSimulating || isCompleted) && (
                <button
                  onClick={handleResetEvacuation}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                  title="Reset Evacuation"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Top Right: 2D View / 3D View Toggle + Fullscreen */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
              <div className={`flex items-center p-0.5 rounded-xl backdrop-blur-md border shadow-lg text-[11px] font-bold ${isDark ? 'bg-slate-950/80 border-slate-700/80' : 'bg-white/95 border-slate-200/90 text-slate-600'
                }`}>
                <button
                  onClick={() => {
                    setViewMode('2D');
                    if (sceneManager) sceneManager.setCameraPreset('TOP_DOWN');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${viewMode === '2D'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark
                        ? 'text-slate-300 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  2D View
                </button>
                <button
                  onClick={() => {
                    setViewMode('3D');
                    if (sceneManager) sceneManager.setCameraPreset('AXONOMETRIC');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${viewMode === '3D'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDark
                        ? 'text-slate-300 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Layers className="w-3 h-3 shrink-0" />
                  <span>3D View</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  if (sceneManager) setTimeout(() => sceneManager.handleResize(), 100);
                }}
                className={`w-7 h-7 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-lg ${isDark
                    ? 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:text-white'
                    : 'bg-white/95 border-slate-200/90 text-slate-700 hover:text-slate-900 shadow-sm'
                  }`}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Left Vertical Floor Selector Buttons */}
            <div className="absolute left-2.5 top-12 bottom-12 z-20 flex flex-col gap-1 overflow-y-auto no-scrollbar py-0.5">
              {ALL_FLOORS.map((fl) => {
                const isActive = selectedFloor === fl.num;
                return (
                  <button
                    key={fl.num}
                    onClick={() => handleSelectFloor(fl.num)}
                    className={`w-14 sm:w-16 py-1 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer shrink-0 ${isActive
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400/50 shadow-md shadow-blue-500/30'
                        : isDark
                          ? 'bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80'
                          : 'bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200/90 shadow-sm'
                      }`}
                  >
                    {fl.label}
                  </button>
                );
              })}
            </div>

            {/* ── REAL THREE.JS 3D CANVAS SLOT ── */}
            <div
              ref={commandCenterSlotRef}
              id="command-center-3d-slot"
              className="w-full h-full flex-1 relative overflow-hidden bg-slate-950"
            />

            {/* Viewport Legend (Top Right) */}
            <div className={`absolute top-12 right-2.5 z-20 p-2.5 rounded-xl backdrop-blur-md border shadow-2xl flex flex-col gap-1.5 text-[10px] font-medium pointer-events-none ${isDark ? 'bg-slate-950/85 border-slate-800 text-slate-200' : 'bg-white/95 border-slate-200/90 text-slate-700 shadow-md'
              }`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-xs shadow-red-500/50 shrink-0" />
                <span>Fire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span>Smoke</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded-full bg-red-500 shrink-0" />
                <span>Blocked Area</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded-full bg-emerald-500 shrink-0" />
                <span>Evacuation Route</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span>People (High)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>People (Normal)</span>
              </div>
            </div>

            {/* Viewport Bottom Controls: Nav Buttons + Compass */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              <div className={`flex items-center p-0.5 rounded-xl backdrop-blur-md border shadow-2xl ${isDark ? 'bg-slate-950/85 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-200/90 text-slate-700 shadow-md'
                }`}>
                <button
                  onClick={() => {
                    if (sceneManager) sceneManager.setCameraPreset('AXONOMETRIC');
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  title="Recenter 3D View"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (sceneManager && sceneManager.rotateCamera) sceneManager.rotateCamera(45);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  title="Rotate 3D Camera (+45°)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (sceneManager && sceneManager.zoomIn) sceneManager.zoomIn(6);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  title="Zoom In 3D"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (sceneManager && sceneManager.zoomOut) sceneManager.zoomOut(6);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  title="Zoom Out 3D"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Compass Rose Widget */}
              <div
                onClick={() => {
                  if (sceneManager) sceneManager.setCameraPreset('AXONOMETRIC');
                }}
                className={`w-9 h-9 rounded-full backdrop-blur-md border shadow-2xl flex items-center justify-center relative cursor-pointer transition-all shrink-0 ${isDark
                    ? 'bg-slate-950/85 border-slate-700 hover:border-slate-500'
                    : 'bg-white/95 border-slate-200 hover:border-slate-400 shadow-md'
                  }`}
                title={`Orientation: ${compassYaw}° (Click to Reset North)`}
              >
                <span className="absolute top-0.5 text-[7px] font-black text-red-500">N</span>
                <span className="absolute bottom-0.5 text-[7px] font-black text-slate-400">S</span>
                <span className="absolute left-1 text-[7px] font-black text-slate-400">W</span>
                <span className="absolute right-1 text-[7px] font-black text-slate-400">E</span>
                <div
                  className="w-0.5 h-3.5 bg-gradient-to-t from-transparent via-red-500 to-red-500 rounded-full"
                  style={{ transform: `rotate(${-compassYaw}deg)` }}
                />
              </div>
            </div>
          </div>

          {/* ── BOTTOM DUAL SUB-CARDS (MATCHING REFERENCE DESIGN) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full min-w-0 shrink-0">
            {/* ── Sub-Card 1: Building Emergency Overview ── */}
            <div className={`p-3 rounded-2xl border shadow-sm flex flex-col justify-between w-full min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
              }`}>
              {/* Header Row */}
              <div className="flex items-center justify-between mb-2 gap-1.5 min-w-0">
                <h2 className={`text-xs sm:text-[13px] font-bold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                  Building Emergency Overview
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${isDark ? 'bg-red-950/60 text-red-400 border-red-800/60' : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  Active Simulation
                </span>
              </div>

              {/* 4 Stat Badges */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                <div className={`py-1 px-1 rounded-xl border flex flex-col items-center text-center min-w-0 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-0.5 shrink-0 ${isDark ? 'bg-red-950/80 text-red-400' : 'bg-red-100/70 text-red-600'
                    }`}>
                    <Flame className="w-3 h-3 fill-current" />
                  </div>
                  <span className={`text-sm font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{fireCount}</span>
                  <span className={`text-[9px] font-semibold mt-0.5 truncate w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fire Zones</span>
                </div>

                <div className={`py-1 px-1 rounded-xl border flex flex-col items-center text-center min-w-0 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-0.5 shrink-0 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                    <Cloud className="w-3 h-3" />
                  </div>
                  <span className={`text-sm font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{smokeCount}</span>
                  <span className={`text-[9px] font-semibold mt-0.5 truncate w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Smoke Zones</span>
                </div>

                <div className={`py-1 px-1 rounded-xl border flex flex-col items-center text-center min-w-0 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-0.5 shrink-0 ${isDark ? 'bg-red-950/80 text-red-400' : 'bg-red-100/70 text-red-600'
                    }`}>
                    <Ban className="w-3 h-3" />
                  </div>
                  <span className={`text-sm font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{blockedAreasCount}</span>
                  <span className={`text-[9px] font-semibold mt-0.5 truncate w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Blocked Areas</span>
                </div>

                <div className={`py-1 px-1 rounded-xl border flex flex-col items-center text-center min-w-0 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-0.5 shrink-0 ${isDark ? 'bg-emerald-950/80 text-emerald-400' : 'bg-emerald-100/70 text-emerald-700'
                    }`}>
                    <DoorClosed className="w-3 h-3" />
                  </div>
                  <span className={`text-sm font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{blockedExitsCount}</span>
                  <span className={`text-[9px] font-semibold mt-0.5 truncate w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Blocked Exit</span>
                </div>
              </div>

              {/* Occupancy Analytics: Floor-wise / Room-wise toggle */}
              <div>
                <div className="flex items-center justify-between mb-1 gap-1.5 min-w-0">
                  <h3 className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {occupancyView === 'floors'
                      ? 'Floor-wise Occupancy'
                      : `Room-wise Occupancy — Floor ${roomOccupancyList[0]?.floorNum ?? selectedFloor}`}
                  </h3>
                  <div className={`flex items-center p-0.5 rounded-lg border shrink-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                    <button
                      onClick={() => setOccupancyView('floors')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${occupancyView === 'floors'
                          ? isDark
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-white text-slate-900 shadow-sm'
                          : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Floors
                    </button>
                    <button
                      onClick={() => setOccupancyView('rooms')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${occupancyView === 'rooms'
                          ? isDark
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-white text-slate-900 shadow-sm'
                          : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Rooms
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 max-h-[96px] overflow-y-auto pr-0.5">
                  {occupancyView === 'floors'
                    ? floorOccupancyList.map((item) => (
                      <div
                        key={item.floorName}
                        onClick={() => {
                          const flNum = Number(String(item.floorName).replace(/\D/g, ''));
                          if (!isNaN(flNum)) {
                            setSelectedFloor(flNum);
                            const flRooms = rooms.filter((r) => Number(r.floor) === flNum);
                            if (flRooms.length > 0) selectRoomFromAnalytics(flRooms[0].id);
                          }
                        }}
                        className={`flex items-center text-xs py-0.5 min-w-0 cursor-pointer rounded px-0.5 transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                          }`}
                        title="Select this floor"
                      >
                        <span className={`font-semibold w-10 shrink-0 text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}>{item.floorName}</span>
                        <span className={`font-bold w-14 shrink-0 text-center text-[10.5px] ${isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>{item.total} / {item.max}</span>
                        <div className={`flex-1 rounded-full h-2 overflow-hidden mx-1.5 min-w-[24px] ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                          <div
                            className={`h-full rounded-full transition-all ${item.isRed ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <span className={`font-bold w-9 text-right shrink-0 text-[10.5px] ${item.isRed ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                          {item.pct}%
                        </span>
                      </div>
                    ))
                    : roomOccupancyList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => selectRoomFromAnalytics(item.id)}
                        className={`flex items-center text-xs py-0.5 min-w-0 cursor-pointer rounded px-0.5 transition-colors ${item.id === selectedLocationId
                            ? isDark
                              ? 'bg-blue-950/60'
                              : 'bg-blue-50/70'
                            : isDark
                              ? 'hover:bg-slate-800/60'
                              : 'hover:bg-slate-50'
                          }`}
                        title={`${item.type} — click to select`}
                      >
                        <span className={`font-semibold w-16 shrink-0 text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}>{item.label}</span>
                        <span className={`font-bold w-14 shrink-0 text-center text-[10.5px] ${isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>{item.people} / {item.capacity}</span>
                        <div className={`flex-1 rounded-full h-2 overflow-hidden mx-1.5 min-w-[24px] ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                          <div
                            className={`h-full rounded-full transition-all ${item.isRed ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <span className={`font-bold w-9 text-right shrink-0 text-[10.5px] ${item.isRed ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                </div>

                <div className={`mt-1 text-[9.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {occupancyView === 'rooms'
                    ? `Floor total ${roomFloorTotal} / ${roomCapacityTotal} · click a room to select it`
                    : `Building total ${totalOccupants} occupants · click a floor to open its rooms`}
                </div>
              </div>
            </div>

            {/* ── Sub-Card 2: Exit-wise Distribution ── */}
            <div className={`p-3 rounded-2xl border shadow-sm flex flex-col justify-between w-full min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
              }`}>
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2 gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                    <h2 className={`text-xs sm:text-[13px] font-bold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                      Exit-wise Distribution
                    </h2>
                    <span className={`text-[10px] font-normal hidden sm:inline shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                      (AI Recommendation)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Optimized
                  </span>
                </div>

                {/* Exit Rows */}
                <div className="flex flex-col gap-0.5 my-0.5">
                  {exitData.map((ex) => (
                    <div key={ex.id} className="flex items-center text-xs py-0.5 min-w-0">
                      {/* Exit name with icon */}
                      <button
                        onClick={() => handleToggleExit(ex.id, !ex.isBlocked)}
                        className="flex items-center gap-1 w-20 sm:w-24 shrink-0 text-left cursor-pointer hover:underline"
                        title={ex.isBlocked ? 'Click to Unblock' : 'Click to Block'}
                      >
                        {ex.isBlocked ? (
                          <DoorClosed className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : (
                          <DoorOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className={`font-semibold text-[10.5px] truncate ${ex.isBlocked ? 'text-red-500 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                          {ex.name}
                        </span>
                      </button>

                      {/* People count */}
                      <span className={`font-medium text-[10px] w-14 text-center shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {ex.people} people
                      </span>

                      {/* Progress bar */}
                      <div className={`flex-1 rounded-full h-2 overflow-hidden mx-1.5 min-w-[24px] ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}>
                        <div
                          className={`h-full rounded-full transition-all ${ex.isBlocked ? (isDark ? 'bg-slate-700' : 'bg-slate-200') : 'bg-blue-600'
                            }`}
                          style={{ width: `${Math.max(ex.pct, ex.isBlocked ? 0 : 2)}%` }}
                        />
                      </div>

                      {/* Percentage */}
                      <span className={`font-bold text-right shrink-0 text-[10px] sm:text-[10.5px] min-w-[76px] whitespace-nowrap ${ex.isBlocked ? 'text-red-500 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {ex.isBlocked ? '0% (Blocked)' : `${ex.pct}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestion Box */}
              <div className={`p-2 rounded-xl border flex items-start gap-2 mt-1.5 min-w-0 ${isDark ? 'bg-blue-950/40 border-blue-900/60' : 'bg-blue-50/70 border-blue-200/80'
                }`}>
                <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[11px] font-bold leading-tight ${isDark ? 'text-blue-300' : 'text-blue-900'
                    }`}>AI Suggestion</span>
                  <p className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${isDark ? 'text-blue-200/90' : 'text-blue-800/90'
                    }`}>
                    {aiSuggestionText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: COMMAND & CONTROL PANEL (4 COLS MATCHING TARGET)          */}
        {/* ────────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 min-w-0 lg:max-h-[calc(100vh-95px)] lg:overflow-y-auto pr-0.5 scrollbar-thin">
          {/* ── SECTION 1: Select Location ── */}
          <div className={`p-3.5 md:p-4 rounded-2xl border shadow-sm min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
            }`}>
            <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
              <h3 className={`text-xs md:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1. Select Location
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isDark ? 'text-blue-400 bg-blue-950/60 border border-blue-800/60' : 'text-blue-600 bg-blue-50 border border-blue-200/60'
                }`}>
                {CATEGORY_LABEL[currentLocation?.category || selectedCategory] || 'Target'}
              </span>
            </div>

            {/* Target Category Selector Tabs: ALL | ROOM | CORRIDOR | STAIR | EXIT */}
            <div className={`grid grid-cols-5 gap-1 p-1 border rounded-xl mb-2.5 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200/80'
              }`}>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'ROOM', label: 'Room' },
                { key: 'CORRIDOR', label: 'Corridor' },
                { key: 'STAIR', label: 'Staircase' },
                { key: 'EXIT', label: 'Exit' }
              ].map((cat) => {
                const isSel = (selectedCategory || 'ALL') === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleSelectCategory(cat.key)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate cursor-pointer ${isSel
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-500'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                      }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Two Dropdowns: Floor & Room / Area */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className={`text-[10.5px] font-medium block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Floor</label>
                <div className="relative">
                  <select
                    value={selectedFloor}
                    onChange={(e) =>
                      handleSelectFloor(
                        e.target.value === 'ROOF' || e.target.value === 'GROUND' || e.target.value === 'ALL'
                          ? e.target.value
                          : Number(e.target.value)
                      )
                    }
                    className={`w-full h-8 pl-2.5 pr-7 rounded-xl text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm border ${isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                      }`}
                  >
                    {ALL_FLOORS.map((fl) => (
                      <option key={fl.num} value={fl.num}>
                        {fl.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
              </div>

              <div>
                <label className={`text-[10.5px] font-medium block mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {CATEGORY_LABEL[currentLocation?.category || selectedCategory] || 'Target'} Selection
                </label>
                <div className="relative">
                  <select
                    value={selectedLocationId}
                    onChange={(e) => handleSelectLocation(e.target.value)}
                    className={`w-full h-8 pl-2.5 pr-7 rounded-xl text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm truncate border ${isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                      }`}
                  >
                    {((selectedCategory === 'ALL' ? floorLocations : floorLocations.filter((l) => l.category === (currentLocation?.category || selectedCategory))).length > 0
                      ? (selectedCategory === 'ALL' ? floorLocations : floorLocations.filter((l) => l.category === (currentLocation?.category || selectedCategory)))
                      : floorLocations
                    ).map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.shortName || loc.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
              </div>
            </div>

            {/* Selected location preview card (data-driven) */}
            <div className={`border rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm min-w-0 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/90'
              }`}>
              <div className="w-[96px] h-[56px] rounded-lg border border-slate-700 shrink-0 bg-slate-950 flex flex-col items-center justify-center gap-0.5 px-1.5 overflow-hidden">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 leading-none truncate w-full text-center">
                  {CATEGORY_LABEL[currentLocation.category] || 'Location'}
                </span>
                <span className="text-[15px] font-extrabold text-white leading-none">
                  {currentLocation.category === 'ROOM'
                    ? currentLocation.roomNumber
                    : currentLocation.category === 'EXIT'
                      ? 'EXIT'
                      : currentLocation.zone === 'West'
                        ? 'W'
                        : 'E'}
                </span>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{
                      width: `${currentLocation.capacity
                          ? Math.min(100, Math.round((currentLocation.current / currentLocation.capacity) * 100))
                          : 0
                        }%`
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs sm:text-sm font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentLocation.shortName}
                  </h4>
                  <button
                    onClick={() => setIsDetailsModalOpen(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs ${isDark
                        ? 'text-blue-400 border border-blue-800/80 bg-blue-950/60 hover:bg-blue-900/60'
                        : 'text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100'
                      }`}
                  >
                    View Details
                  </button>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentLocation.type}
                </p>
                <div className={`text-[10px] mt-1 flex items-center gap-1.5 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Capacity: {currentLocation.capacity} People</span>
                  <span>•</span>
                  <span>Current: <strong className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{currentLocation.current} People</strong></span>
                </div>
              </div>
            </div>

            {/* 3D object mapping report */}
            {mapping3D && mapping3D.found === false && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10.5px] font-semibold text-amber-600">
                ⚠ No 3D object mapping for this location — effects are not rendered.
              </div>
            )}
          </div>

          {/* ── SECTION 2: Emergency Actions (category-aware grid with crisp Light/Dark contrast) ── */}
          <div className={`p-3.5 md:p-4 rounded-2xl border shadow-sm min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
            }`}>
            <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
              <h3 className={`text-xs md:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                2. Emergency Actions
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-semibold border shrink-0 ${isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                {CATEGORY_LABEL[currentLocation.category] || 'Location'} Actions
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {locationActions.map((action) => {
                const Icon = action.Icon;
                const isBtnActive = action.isActive;

                let toneCls = '';
                let iconCls = '';

                if (isBtnActive) {
                  if (action.tone === 'red-active') {
                    toneCls = 'bg-gradient-to-br from-red-600 to-rose-700 text-white border-red-600 shadow-md shadow-red-500/30 ring-2 ring-red-400/50';
                    iconCls = 'text-white fill-white';
                  } else if (action.tone === 'blue-active') {
                    toneCls = 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-800 shadow-md shadow-slate-800/30 ring-2 ring-slate-400/50';
                    iconCls = 'text-white fill-white';
                  } else if (action.tone === 'amber-active') {
                    toneCls = 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-700 shadow-md ring-2 ring-amber-400/50';
                    iconCls = 'text-white fill-white';
                  } else if (action.tone === 'purple-active') {
                    toneCls = 'bg-gradient-to-br from-purple-600 to-purple-800 text-white border-purple-700 shadow-md ring-2 ring-purple-400/50';
                    iconCls = 'text-white';
                  } else if (action.tone === 'orange-active') {
                    toneCls = 'bg-gradient-to-br from-orange-600 to-orange-700 text-white border-orange-700 shadow-md ring-2 ring-orange-400/50';
                    iconCls = 'text-white';
                  } else {
                    toneCls = 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400/50';
                    iconCls = 'text-white';
                  }
                } else {
                  // Inactive button in Light & Dark modes
                  if (isDark) {
                    toneCls = 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200';
                  } else {
                    toneCls = 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs hover:shadow-sm';
                  }

                  if (action.tone === 'red') {
                    iconCls = 'text-red-500 fill-red-500/20';
                  } else if (action.tone === 'blue') {
                    iconCls = 'text-slate-500 fill-slate-500/20';
                  } else if (action.tone === 'amber') {
                    iconCls = 'text-amber-500 fill-amber-500/20';
                  } else if (action.tone === 'purple') {
                    iconCls = 'text-purple-500';
                  } else if (action.tone === 'orange') {
                    iconCls = 'text-orange-500';
                  } else if (action.tone === 'emerald') {
                    iconCls = 'text-emerald-500';
                  } else {
                    iconCls = isDark ? 'text-slate-400' : 'text-slate-500';
                  }
                }

                return (
                  <button
                    key={action.key}
                    onClick={action.onClick}
                    className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-xs active:scale-95 group min-h-[58px] sm:min-h-[62px] relative ${toneCls}`}
                  >
                    {action.status && (
                      <span className={`absolute top-1 right-1 text-[7.5px] font-black px-1 py-0.2 rounded-full uppercase tracking-wider ${isBtnActive
                          ? 'bg-black/30 text-white'
                          : isDark
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                        }`}>
                        {action.status}
                      </span>
                    )}
                    <Icon
                      className={`w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform mb-1 shrink-0 ${iconCls} ${isBtnActive ? 'animate-pulse' : ''}`}
                    />
                    <span className={`text-[10px] sm:text-[10.5px] font-bold leading-tight text-center ${isBtnActive ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 3: Location Status + Active Events (all floors) ── */}
          <div className={`p-3.5 md:p-4 rounded-2xl border shadow-sm min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
            }`}>
            <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
              <h3 className={`text-xs md:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                3. Status & Events
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border shrink-0 ${isDark ? 'bg-red-950/60 text-red-400 border-red-800/60' : 'bg-red-100 text-red-700 border-red-300'}`} style={!isDark ? { color: '#b91c1c', backgroundColor: '#fee2e2', borderColor: '#fca5a5' } : undefined}>
                {hazards.length} Active
              </span>
            </div>

            {/* Selected location status */}
            {(() => {
              const blockedNow =
                currentLocation.category === 'EXIT'
                  ? !!exitData.find((e) => e.id === currentLocation.id && e.isBlocked)
                  : !!findEventAt(
                    currentLocation.id,
                    currentLocation.category === 'CORRIDOR'
                      ? 'BLOCK_CORRIDOR'
                      : currentLocation.category === 'STAIR'
                        ? 'BLOCK_STAIR'
                        : 'BLOCK_ROOM'
                  );
              const title =
                currentLocation.category === 'CORRIDOR'
                  ? 'Corridor Occupancy'
                  : currentLocation.category === 'STAIR'
                    ? 'Staircase Status'
                    : currentLocation.category === 'EXIT'
                      ? 'Exit Status & Capacity'
                      : 'Room Status';
              return (
                <div className={`p-2.5 rounded-xl border mb-2 min-w-0 ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-600'
                  }`}>
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border shrink-0 ${blockedNow
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                    >
                      {blockedNow ? 'BLOCKED' : 'OPERATIONAL'}
                    </span>
                  </div>
                  <div className="text-[10.5px] leading-relaxed min-w-0">
                    {currentLocation.category === 'ROOM' && (
                      <>
                        Occupancy <strong>{currentLocation.current}</strong> / {currentLocation.capacity} ·
                        Available <strong>{Math.max(0, currentLocation.capacity - currentLocation.current)}</strong> ·
                        3D object <strong>{mapping3D && mapping3D.found ? mapping3D.id : 'missing'}</strong>
                        {findEventAt(currentLocation.id, 'FIRE') && (
                          <span className="ml-1 text-red-600 font-bold">· Fire active</span>
                        )}
                        {findEventAt(currentLocation.id, 'SMOKE') && (
                          <span className="ml-1 text-slate-500 font-bold">· Smoke active</span>
                        )}
                      </>
                    )}
                    {currentLocation.category === 'CORRIDOR' && (
                      <>
                        Agents on segment <strong>{segmentInfo ? segmentInfo.onSegment : 0}</strong> ·
                        Floor in transit <strong>{segmentInfo ? segmentInfo.floorTotal : 0}</strong> ·
                        Design capacity {currentLocation.capacity}
                      </>
                    )}
                    {currentLocation.category === 'STAIR' && (
                      <>
                        Agents using <strong>{segmentInfo ? segmentInfo.onSegment : 0}</strong> ·
                        Floor in transit <strong>{segmentInfo ? segmentInfo.floorTotal : 0}</strong> ·
                        Feeds {currentLocation.zone} exit
                      </>
                    )}
                    {currentLocation.category === 'EXIT' && (
                      <>
                        Capacity <strong>{currentLocation.capacity}</strong> ·
                        Load <strong>{currentLocation.current}</strong> people ·
                        Share <strong>{Math.round((currentLocation.capacity / 200) * 100)}%</strong> of building flow
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* All active events */}
            {mergedEvents.length > 0 ? (
              <div className="flex flex-col gap-1.5 mb-2 max-h-[190px] overflow-y-auto pr-0.5">
                {mergedEvents.map((haz) => {
                  const EvIcon =
                    haz.type === 'MULTI_HAZARD'
                      ? haz.hazardKey === 'powerGridFailure'
                        ? Zap
                        : haz.hazardKey === 'hvacPressurizationFailure'
                          ? Wind
                          : haz.hazardKey === 'structuralCollapse'
                            ? BrickWall
                            : Flame
                      : haz.type === 'FIRE'
                        ? Flame
                        : haz.type === 'SMOKE'
                          ? Cloud
                          : Ban;
                  const evBg =
                    haz.type === 'MULTI_HAZARD'
                      ? haz.hazardKey === 'powerGridFailure'
                        ? 'bg-amber-100 text-amber-600'
                        : haz.hazardKey === 'hvacPressurizationFailure'
                          ? 'bg-purple-100 text-purple-600'
                          : haz.hazardKey === 'structuralCollapse'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-red-100 text-red-600'
                      : haz.type === 'FIRE'
                        ? 'bg-red-100 text-red-600'
                        : haz.type === 'SMOKE'
                          ? 'bg-slate-200 text-slate-600'
                          : haz.type === 'BLOCK_CORRIDOR'
                            ? 'bg-blue-100 text-blue-600'
                            : haz.type === 'BLOCK_STAIR'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-red-100 text-red-600';
                  return (
                    <div
                      key={haz.id}
                      onClick={() => {
                        if (haz.locationId) focusEventLocation(haz);
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 min-w-0 cursor-pointer transition-colors ${haz.locationId === currentLocation.id
                          ? 'bg-red-50/80 border-red-200'
                          : isDark
                            ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      title="Click to select this location"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${evBg}`}>
                          <EvIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[11.5px] font-bold block leading-tight truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {haz.title}
                          </span>
                          <span className={`text-[10.5px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {haz.locationName} · {haz.time}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHazard(haz.id);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer border border-red-200/60 shadow-sm shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center mb-2 text-xs text-emerald-800 font-semibold min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mr-2" />
                <span className="truncate">No active events across the building</span>
              </div>
            )}

            {/* People Count Stepper (selected room) */}
            {currentLocation.category === 'ROOM' && (
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <span className={`font-semibold shrink-0 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>People Count (this room)</span>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  <button
                    onClick={() => handleAdjustPeopleStep(-1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold cursor-pointer shadow-sm shrink-0 border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    title="Decrease 1 Person"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className={`w-8 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shadow-sm shrink-0 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}>
                    {currentLocation.current}
                  </span>

                  <button
                    onClick={() => handleAdjustPeopleStep(1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold cursor-pointer shadow-sm shrink-0 border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    title="Increase 1 Person"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <span className="text-slate-400 text-[10.5px] ml-1 shrink-0">/ {currentLocation.capacity} (Max)</span>

                  <button
                    onClick={handleResetRoomOccupancy}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 ml-1.5 cursor-pointer shadow-sm shrink-0 ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    title="Reset to Baseline"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 4: Scenario Controls (2x2 Grid) ── */}
          <div className={`p-3.5 md:p-4 rounded-2xl border shadow-sm min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
            }`}>
            <h3 className={`text-xs md:text-sm font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              4. Scenario Controls
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRecalculateRoutes}
                className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer active:scale-95 min-h-[38px] truncate"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Recalculate Routes</span>
              </button>

              <button
                onClick={handleUndo}
                className={`py-2 px-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 min-h-[38px] truncate ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
              >
                <Undo2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Undo Last</span>
              </button>

              <button
                onClick={handleResetScenario}
                className={`py-2 px-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 min-h-[38px] truncate ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Reset Scenario</span>
              </button>

              <button
                onClick={handleLoadScenario}
                className={`py-2 px-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 min-h-[38px] truncate ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Load Scenario</span>
              </button>
            </div>
          </div>

          {/* ── SECTION 5: Live Environmental Telemetry ── */}
          <div className={`p-3.5 md:p-4 rounded-2xl border shadow-sm min-w-0 ${isDark ? 'bg-[#0d1627] border-slate-800' : 'bg-white border-slate-200/90'
            }`}>
            <h3 className={`text-xs md:text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              5. Live Environmental Telemetry
            </h3>

            {/* Power Telemetry */}
            <div className={`rounded-xl border p-2.5 mb-2 ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap
                  className={`w-3.5 h-3.5 shrink-0 ${envTelemetry.power.mainGrid === 'OFFLINE' ? 'text-amber-500' : 'text-slate-400'
                    }`}
                />
                <span className={`text-[10.5px] font-bold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>POWER</span>
              </div>
              <div className="flex flex-col gap-1">
                <TelemetryRow label="Main Grid" value={envTelemetry.power.mainGrid} bad={envTelemetry.power.mainGrid === 'OFFLINE'} />
                <TelemetryRow label="Emergency Lighting" value={envTelemetry.power.emergencyLighting} warn={envTelemetry.power.emergencyLighting === 'ACTIVE'} />
              </div>
            </div>

            {/* HVAC Telemetry */}
            <div className={`rounded-xl border p-2.5 mb-2 ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wind
                  className={`w-3.5 h-3.5 shrink-0 ${envTelemetry.hvac.fans === 'DISABLED' ? 'text-purple-500' : 'text-slate-400'
                    }`}
                />
                <span className={`text-[10.5px] font-bold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>HVAC</span>
              </div>
              <div className="flex flex-col gap-1">
                <TelemetryRow label="Stairwell Fans" value={envTelemetry.hvac.fans} bad={envTelemetry.hvac.fans === 'DISABLED'} />
                <TelemetryRow label="Smoke Propagation" value={envTelemetry.hvac.smokePropagation} bad={envTelemetry.hvac.smokePropagation !== '1.0x'} />
                <TelemetryRow label="Avg Smoke Exposure Rate" value={`${envTelemetry.hvac.avgExposureRate.toFixed(1)}/s`} neutral />
                <TelemetryRow label="Exposed Occupants" value={String(envTelemetry.hvac.exposedAgents)} neutral />
              </div>
            </div>

            {/* Structural Telemetry */}
            <div className={`rounded-xl border p-2.5 mb-2 ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <BrickWall
                  className={`w-3.5 h-3.5 shrink-0 ${envTelemetry.structural.corridor === 'BLOCKED' ? 'text-orange-500' : 'text-slate-400'
                    }`}
                />
                <span className={`text-[10.5px] font-bold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>STRUCTURAL</span>
              </div>
              <div className="flex flex-col gap-1">
                <TelemetryRow label="Corridor C-101" value={envTelemetry.structural.corridor} bad={envTelemetry.structural.corridor === 'BLOCKED'} />
                <TelemetryRow label="West Stair Connection" value={envTelemetry.structural.westConnection} bad={envTelemetry.structural.westConnection === 'BLOCKED'} />
                <TelemetryRow label="Affected Occupants" value={String(envTelemetry.structural.affected)} neutral />
                <TelemetryRow label="Rerouted Occupants" value={String(envTelemetry.structural.rerouted)} neutral />
              </div>
            </div>

            {/* Emergency Summary */}
            <div className={`rounded-xl border p-2.5 ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ShieldAlert
                  className={`w-3.5 h-3.5 shrink-0 ${envTelemetry.summary.activeHazards > 0 ? 'text-red-500' : 'text-slate-400'
                    }`}
                />
                <span className={`text-[10.5px] font-bold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>EMERGENCY SUMMARY</span>
              </div>
              <div className="flex flex-col gap-1">
                <TelemetryRow label="Active Hazards" value={`${envTelemetry.summary.activeHazards}/4`} bad={envTelemetry.summary.activeHazards > 0} />
                <TelemetryRow label="Blocked Routes" value={String(envTelemetry.summary.blockedRoutes)} bad={envTelemetry.summary.blockedRoutes > 0} />
                <TelemetryRow
                  label="Evacuating Occupants"
                  value={envTelemetry.summary.evacuating === null ? '—' : String(envTelemetry.summary.evacuating)}
                  neutral
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentLocation.shortName} Details</h3>
                  <p className="text-xs text-slate-500">{currentLocation.type} • Floor {currentLocation.floor}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Live 3D object identity — no static imagery */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                    {CATEGORY_LABEL[currentLocation.category] || 'Loc'}
                  </span>
                  <span className="text-sm font-extrabold text-white leading-none mt-0.5">
                    {currentLocation.category === 'ROOM'
                      ? currentLocation.roomNumber
                      : currentLocation.category === 'EXIT'
                        ? 'EXIT'
                        : currentLocation.zone === 'West'
                          ? 'W'
                          : 'E'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">3D Object Mapping</span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    ID: <strong className="text-slate-200">{currentLocation.id || '—'}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Status:{' '}
                    {mapping3D && mapping3D.found ? (
                      <strong className="text-emerald-400">Mapped ✓</strong>
                    ) : (
                      <strong className="text-amber-400">No mapping — effects blocked</strong>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Room Capacity</span>
                  <span className="text-base font-bold text-slate-900">{currentLocation.capacity} Occupants</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Current Occupancy</span>
                  <span className="text-base font-bold text-blue-600">{currentLocation.current} People</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Available Capacity</span>
                  <span className="text-base font-bold text-emerald-600">
                    {Math.max(0, currentLocation.capacity - currentLocation.current)} Free
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">Department / Zone</span>
                  <span className="text-sm font-bold text-slate-900 truncate block">{currentLocation.zone || '—'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmergencyCommandCenterPage;
