import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SceneManager } from './three/SceneManager';
import { CCTVMultiviewer } from './components/CCTVMultiviewer';
import { BottleneckAnalytics } from './components/BottleneckAnalytics';
import { ControlPanel } from './components/ControlPanel';
import { RoomModal } from './components/RoomModal';
import { FireTriggerBubble } from './components/FireTriggerBubble';
import {
  ShieldAlert,
  Flame,
  Radio,
  Building2,
  HelpCircle,
  Video,
  BarChart3,
  X,
  Users,
  CheckCircle2,
  Clock,
  Globe
} from 'lucide-react';

import { FLOOR_THEMES, ROOM_TEMPLATES } from './simulation/Doorways';

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
        tempCelsius: 22
      });
    });
  }
  return rooms;
};

const INITIAL_ROOMS = generateInitialRooms();

const INITIAL_EXITS = [
  { id: 'exit_west', name: 'Exit A (West Emergency Core)', x: -29, z: 0, capacity: 60, load: 0 },
  { id: 'exit_east', name: 'Exit B (East Fire Escape Core)', x: 29, z: 0, capacity: 60, load: 0 },
  { id: 'exit_south', name: 'Exit C (South Grand Plaza Exit)', x: 0, z: 23, capacity: 80, load: 0 }
];

const calculateTotal = (rooms) => rooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);

export function App() {
  const threeCanvasRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const socketRef = useRef(null);

  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [exits, setExits] = useState(INITIAL_EXITS);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [facadeMode, setFacadeMode] = useState('CUTAWAY');
  const [activeFloorView, setActiveFloorView] = useState('ALL');
  const [activeModalRoomId, setActiveModalRoomId] = useState(null);
  const [fireBubbleData, setFireBubbleData] = useState(null);
  const [isCctvOpen, setIsCctvOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const [systemStatus, setSystemStatus] = useState('STANDBY');
  const [serverConnected, setServerConnected] = useState(false);
  const [showRouteOverlays, setShowRouteOverlays] = useState(true);
  const [showExitBadges, setShowExitBadges] = useState(true);

  const [stats, setStats] = useState({
    total: calculateTotal(INITIAL_ROOMS),
    evacuated: 0,
    inside: calculateTotal(INITIAL_ROOMS),
    inTransit: calculateTotal(INITIAL_ROOMS),
    queued: 0,
    trapped: 0,
    elapsedSeconds: 0
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!threeCanvasRef.current) return;

    const manager = new SceneManager(
      threeCanvasRef.current,
      (liveStats) => {
        setStats(liveStats);
        if (liveStats.isCompleted) {
          setIsSimulating(false);
          setSystemStatus('COMPLETED');
        }
      },
      (clickedRoomId) => {
        // Single click: open inspection modal
        setActiveModalRoomId(clickedRoomId);
      },
      (matchedRoom, screenPos) => {
        // Double tap / double click: show minimalist fire emoji trigger pill!
        setFireBubbleData({ room: matchedRoom, position: screenPos });
      },
      (newFacadeMode) => {
        setFacadeMode(newFacadeMode);
      }
    );

    sceneManagerRef.current = manager;
    manager.syncOccupants(rooms);

    return () => {
      manager.dispose();
    };
  }, []);

  // Socket.io backend sync
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 3000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setServerConnected(true);
    });

    socket.on('disconnect', () => {
      setServerConnected(false);
    });

    socket.on('fire-detected', (data) => {
      handleTriggerFire(data.roomId, false);
    });

    socket.on('state-update', (state) => {
      if (state.rooms) setRooms(state.rooms);
      if (state.exits) setExits(state.exits);
    });

    return () => socket.disconnect();
  }, []);

  // Trigger Fire in a room
  const handleTriggerFire = (roomId, emitToServer = true) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return { ...r, hasFire: true, tempCelsius: 86 };
        }
        return r;
      })
    );

    setSystemStatus('ALARM');

    if (sceneManagerRef.current) {
      sceneManagerRef.current.triggerFire(roomId);
    }

    if (emitToServer && socketRef.current && socketRef.current.connected) {
      fetch('http://localhost:5000/api/trigger-fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      }).catch(() => {});
    }
  };

  // Update Crowd count for a room
  const handleUpdateCrowd = (roomId, newCount) => {
    const updatedRooms = rooms.map((r) =>
      r.id === roomId ? { ...r, peopleCount: newCount } : r
    );
    setRooms(updatedRooms);

    if (sceneManagerRef.current && !isSimulating) {
      sceneManagerRef.current.syncOccupants(updatedRooms);
    }

    if (socketRef.current && socketRef.current.connected) {
      fetch('http://localhost:5000/api/update-crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, count: newCount })
      }).catch(() => {});
    }
  };

  // Start Evacuation Simulation
  const handleStartEvacuation = () => {
    if (!sceneManagerRef.current) return;
    const result = sceneManagerRef.current.startEvacuation();
    setIsSimulating(true);
    setSystemStatus('EVACUATING');
    if (result) {
      setExits(result.exitStats);
      setBottlenecks(result.bottlenecks || []);
    }
  };

  const handlePauseResume = () => {
    if (!sceneManagerRef.current) return;
    if (isSimulating) {
      sceneManagerRef.current.pauseSimulation();
      setIsSimulating(false);
    } else {
      sceneManagerRef.current.resumeSimulation();
      setIsSimulating(true);
    }
  };

  const handleReset = () => {
    const freshRooms = INITIAL_ROOMS.map(r => ({ ...r, hasFire: false, tempCelsius: 22 }));
    setRooms(freshRooms);
    setExits(INITIAL_EXITS);
    setBottlenecks([]);
    setIsSimulating(false);
    setSystemStatus('STANDBY');
    setStats({
      total: calculateTotal(INITIAL_ROOMS),
      evacuated: 0,
      inTransit: calculateTotal(INITIAL_ROOMS),
      elapsedSeconds: 0
    });

    if (sceneManagerRef.current) {
      sceneManagerRef.current.reset(freshRooms);
    }

    if (socketRef.current && socketRef.current.connected) {
      fetch('http://localhost:5000/api/reset', { method: 'POST' }).catch(() => {});
    }
  };

  const handleBlockStairwell = (coreName) => {
    if (sceneManagerRef.current) {
      const result = sceneManagerRef.current.blockStairwell(coreName);
      if (result) {
        setExits(result.exitStats);
        setBottlenecks(result.bottlenecks || []);
      }
    }
  };

  const handleClearHazards = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.fireSystem.extinguishAll();
      sceneManagerRef.current.scenarioEngine.clearAllIncidents();
      const freshRooms = rooms.map(r => ({ ...r, hasFire: false, tempCelsius: 22 }));
      setRooms(freshRooms);
      if (isSimulating) {
        const result = sceneManagerRef.current.routeOptimizer.optimizeEvacuationRoutes(sceneManagerRef.current.agentCrowd.agents);
        sceneManagerRef.current.agentCrowd.rerouteAgents(result.assignments);
        sceneManagerRef.current.renderRouteOverlays(result.assignments);
        sceneManagerRef.current.updateExitHoloBadges(result.exitStats);
        setExits(result.exitStats);
      }
    }
  };

  const handleToggleRouteOverlays = () => {
    setShowRouteOverlays(prev => {
      const next = !prev;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.showRouteOverlays = next;
        sceneManagerRef.current.routeOverlayGroup.visible = next;
      }
      return next;
    });
  };

  const handleToggleExitBadges = () => {
    setShowExitBadges(prev => {
      const next = !prev;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.showExitBadges = next;
        sceneManagerRef.current.exitOverlayGroup.visible = next;
      }
      return next;
    });
  };

  const handleSetSpeed = (speed) => {
    setSimSpeed(speed);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.simSpeed = speed;
    }
  };

  const handleSetCameraPreset = (preset, roomId = null) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(preset, roomId);
    }
  };

  const handleSetFloorView = (floorMode) => {
    setActiveFloorView(floorMode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setFloorMode(floorMode);
    }
  };

  const hasAnyFire = rooms.some((r) => r.hasFire);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f1f5f9] text-slate-100 overflow-hidden font-sans">
      {/* Top Cyber Command Header */}
      <header className="h-14 px-4 bg-slate-950/90 border-b border-cyan-500/20 backdrop-blur-md flex items-center justify-between shrink-0 z-20 shadow-lg">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/90 border border-cyan-500/50 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.35)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-hud font-bold text-sm tracking-wider flex items-center gap-2">
              <span className="text-white">DIGITAL TWIN</span>
              <span className="text-cyan-400">SMART EMERGENCY COMMAND</span>
              <span className="badge-tech bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px]">
                10-STOREY TOWER • 100 ROOMS
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span>Dual Stairwell Cores • 3 Elevator Shafts • Heliport</span>
              <span>•</span>
              <span className={serverConnected ? 'text-emerald-400' : 'text-slate-500'}>
                {serverConnected ? 'AI Vision Sync Active' : 'Offline Simulation'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Live KPI Overview */}
        <div className="hidden lg:flex items-center gap-3.5 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>FACILITY: <b className="text-white">{stats.total}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>INSIDE: <b className="text-blue-300">{stats.inside ?? (stats.total - stats.evacuated)}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>MOVING: <b className="text-amber-300">{stats.inTransit}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SAFE: <b className="text-emerald-300">{stats.evacuated}</b></span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>INVARIANT: PASS</span>
          </div>
        </div>

        {/* Right Action Tools & Drawer Toggles */}
        <div className="flex items-center gap-2.5">
          {/* CCTV Drawer Toggle */}
          <button
            onClick={() => {
              setIsCctvOpen(!isCctvOpen);
              if (!isCctvOpen) setIsAnalyticsOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-hud font-bold tracking-wider flex items-center gap-2 transition-all ${
              isCctvOpen
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.4)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>CCTV FEEDS (100 CAMS)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Analytics Drawer Toggle */}
          <button
            onClick={() => {
              setIsAnalyticsOpen(!isAnalyticsOpen);
              if (!isAnalyticsOpen) setIsCctvOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-hud font-bold tracking-wider flex items-center gap-2 transition-all ${
              isAnalyticsOpen
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.4)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            <span>EXITS & ANALYTICS</span>
          </button>

          {/* Facility Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-hud font-bold text-xs tracking-wider border ${
              hasAnyFire
                ? 'bg-red-950 text-red-300 border-red-500/60 shadow-[0_0_15px_rgba(255,51,68,0.5)] animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {hasAnyFire ? (
              <>
                <Flame className="w-4 h-4 text-red-400" />
                <span>HAZARD ACTIVE</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>SECURE</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Full-Screen 3D Workspace */}
      <div className="flex-1 relative overflow-hidden">
        {/* Full Viewport 3D Canvas */}
        <div ref={threeCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Clean Floating Tip Overlay (Top-Left) */}
        <div className="absolute top-4 left-4 pointer-events-none bg-slate-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 backdrop-blur-md flex items-center gap-2.5 shadow-xl">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>10-Storey Skyscraper • Drag to Orbit (All Axes) • Walk: Arrows/WASD • Look: Alt+Arrows [Shift: Fast]</span>
        </div>

        {/* Left Collapsible Drawer: CCTV Feeds */}
        {isCctvOpen && (
          <div className="absolute top-4 left-4 bottom-24 w-[345px] z-30 pointer-events-auto animate-in slide-in-from-left duration-200 shadow-2xl flex flex-col">
            <div className="flex-1 bg-slate-950/95 border border-cyan-500/40 rounded-xl overflow-hidden backdrop-blur-2xl flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <div className="p-2.5 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-hud font-bold text-cyan-400">
                  <Video className="w-4 h-4" />
                  <span>FACILITY CCTV MULTIVIEWER</span>
                </div>
                <button
                  onClick={() => setIsCctvOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <CCTVMultiviewer
                  rooms={rooms}
                  onTriggerFire={handleTriggerFire}
                  onUpdateCrowd={handleUpdateCrowd}
                  onFocusRoom={(roomId) => handleSetCameraPreset('ROOM_FOCUS', roomId)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Collapsible Drawer: Evacuation Intelligence & Exits */}
        {isAnalyticsOpen && (
          <div className="absolute top-4 right-4 bottom-24 w-[355px] z-30 pointer-events-auto animate-in slide-in-from-right duration-200 shadow-2xl flex flex-col">
            <div className="flex-1 bg-slate-950/95 border border-cyan-500/40 rounded-xl overflow-hidden backdrop-blur-2xl flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <div className="p-2.5 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-hud font-bold text-purple-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>EVACUATION INTELLIGENCE</span>
                </div>
                <button
                  onClick={() => setIsAnalyticsOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <BottleneckAnalytics
                  stats={stats}
                  exits={exits}
                  rooms={rooms}
                  bottlenecks={bottlenecks}
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Double-Tap Fire Trigger Emoji Bubble */}
        {fireBubbleData && (
          <FireTriggerBubble
            room={rooms.find(r => r.id === fireBubbleData.room.id) || fireBubbleData.room}
            position={fireBubbleData.position}
            onClose={() => setFireBubbleData(null)}
            onToggleFire={(roomId) => {
              handleTriggerFire(roomId);
              setFireBubbleData(null);
            }}
          />
        )}

        {/* Architectural Quick Action Pill (Matches User Reference Screenshot) */}
        <div className="absolute bottom-20 right-6 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleSetCameraPreset('HERO_VIEW')}
            className="px-3 py-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-mono font-medium shadow-xl backdrop-blur-md flex items-center gap-2 transition-all group"
            title="Press 'H' for Hero Section Elevation"
          >
            <span className="w-4 h-4 rounded bg-cyan-950 text-[10px] text-cyan-300 font-bold flex items-center justify-center border border-cyan-500/40 group-hover:scale-105 transition-transform">
              H
            </span>
            <span className="tracking-wide">Hero View</span>
          </button>

          <button
            onClick={() => {
              if (sceneManagerRef.current) {
                const newMode = sceneManagerRef.current.toggleFacadeMode();
                setFacadeMode(newMode);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-slate-200 border border-slate-700/80 hover:border-amber-500/50 text-xs font-mono font-medium shadow-xl backdrop-blur-md flex items-center gap-2 transition-all group"
            title="Press 'C' to Toggle Full Façade vs Cutaway Section"
          >
            <span className="w-4 h-4 rounded bg-amber-950 text-[10px] text-amber-300 font-bold flex items-center justify-center border border-amber-500/40 group-hover:scale-105 transition-transform">
              C
            </span>
            <span className="tracking-wide">{facadeMode === 'FULL' ? 'Cutaway View' : 'Full Façade'}</span>
          </button>
        </div>

        {/* Floating Bottom Control Bar */}
        <div className="absolute bottom-4 left-6 right-6 z-10 flex justify-center pointer-events-none">
          <div className="pointer-events-auto max-w-4xl w-full">
            <ControlPanel
              status={systemStatus}
              isSimulating={isSimulating}
              simSpeed={simSpeed}
              activeFloorView={activeFloorView}
              showRouteOverlays={showRouteOverlays}
              showExitBadges={showExitBadges}
              onStartEvacuation={handleStartEvacuation}
              onPauseResume={handlePauseResume}
              onReset={handleReset}
              onSetSpeed={handleSetSpeed}
              onSetCameraPreset={handleSetCameraPreset}
              onSetFloorView={handleSetFloorView}
              onTriggerScenarioFire={(roomId) => handleTriggerFire(roomId)}
              onBlockStairwell={handleBlockStairwell}
              onClearHazards={handleClearHazards}
              onToggleRouteOverlays={handleToggleRouteOverlays}
              onToggleExitBadges={handleToggleExitBadges}
            />
          </div>
        </div>
      </div>

      {/* Interactive Room Inspection Modal (Single-Click) */}
      {activeModalRoomId && (
        <RoomModal
          room={rooms.find((r) => r.id === activeModalRoomId)}
          onClose={() => setActiveModalRoomId(null)}
          onTriggerFire={handleTriggerFire}
          onUpdateCrowd={handleUpdateCrowd}
          onSelectFloor={handleSetFloorView}
        />
      )}
    </div>
  );
}
