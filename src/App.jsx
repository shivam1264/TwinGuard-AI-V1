import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SceneManager } from './three/SceneManager';
import { TopHeader } from './components/TopHeader';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { BottomControlDock } from './components/BottomControlDock';
import { ViewportOverlay } from './components/ViewportOverlay';
import { CCTVMultiviewer } from './components/CCTVMultiviewer';
import { BottleneckAnalytics } from './components/BottleneckAnalytics';
import { IncidentsModal } from './components/IncidentsModal';
import { ReportsModal } from './components/ReportsModal';
import { RoomModal } from './components/RoomModal';
import { FireTriggerBubble } from './components/FireTriggerBubble';
import { X, Video, BarChart3 } from 'lucide-react';

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
  { id: 'exit_west', name: 'Stairwell A (West Core)', x: -29, z: 0, capacity: 60, load: 0, status: 'Operational' },
  { id: 'exit_east', name: 'Stairwell B (East Core)', x: 29, z: 0, capacity: 60, load: 0, status: 'Operational' },
  { id: 'exit_south', name: 'Stairwell C (South Exit)', x: 0, z: 23, capacity: 80, load: 0, status: 'Operational' }
];

const INITIAL_INCIDENTS = [
  {
    id: 'inc_1',
    time: '10:23 AM',
    title: 'Smoke detected - 5th Floor',
    subtitle: 'East Wing - Office Area',
    severity: 'High',
    floor: 5,
    roomId: 'f5_r4'
  },
  {
    id: 'inc_2',
    time: '10:22 AM',
    title: 'High crowd density - Stairwell C',
    subtitle: 'Evacuation in progress',
    severity: 'Medium',
    floor: 1
  },
  {
    id: 'inc_3',
    time: '10:20 AM',
    title: 'Elevator locked (All shafts)',
    subtitle: 'Switched to emergency mode',
    severity: 'Info',
    floor: 1
  }
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
  const [facadeMode, setFacadeMode] = useState('FULL');
  const [activeFloorView, setActiveFloorView] = useState('ALL');
  const [activeTab, setActiveTab] = useState('LIVE_VIEW');
  const [activeSidebarMode, setActiveSidebarMode] = useState('3D_VIEW');
  const [cameraYaw, setCameraYaw] = useState(0);

  // Collapsible panels state (Default: expanded, clicking collapse shows icon rails)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const [activeModalRoomId, setActiveModalRoomId] = useState(null);
  const [fireBubbleData, setFireBubbleData] = useState(null);
  const [isCctvOpen, setIsCctvOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [bimLayers, setBimLayers] = useState({
    structure: true,
    fireSafety: true,
    occupants: true
  });

  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [systemStatus, setSystemStatus] = useState('STANDBY');
  const [serverConnected, setServerConnected] = useState(false);


  const [stats, setStats] = useState({
    total: calculateTotal(INITIAL_ROOMS),
    evacuated: 0,
    inside: calculateTotal(INITIAL_ROOMS),
    inTransit: calculateTotal(INITIAL_ROOMS),
    queued: 0,
    trapped: 0,
    elapsedSeconds: 0
  });

  // Initialize Three.js scene (Preserving existing 3D building completely!)
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
      () => {
        // Single click popup removed
      },
      (matchedRoom, screenPos) => {
        // Double tap / double click: show minimalist fire trigger pill
        setFireBubbleData({ room: matchedRoom, position: screenPos });
      },
      (newFacadeMode) => {
        setFacadeMode(newFacadeMode);
      }
    );

    sceneManagerRef.current = manager;
    window.__sceneManager = manager;
    manager.syncOccupants(rooms);

    return () => {
      manager.dispose();
    };
  }, []);

  // Smoothly trigger Three.js resize when panels collapse or expand
  useEffect(() => {
    if (sceneManagerRef.current && sceneManagerRef.current.handleResize) {
      const timer = setTimeout(() => {
        sceneManagerRef.current.handleResize();
      }, 310);
      return () => clearTimeout(timer);
    }
  }, [isLeftCollapsed, isRightCollapsed]);

  // Track camera rotation for real-time Compass Rose updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (sceneManagerRef.current && sceneManagerRef.current.getCameraYaw) {
        const yaw = sceneManagerRef.current.getCameraYaw();
        setCameraYaw(Math.round(yaw));
      }
    }, 80);
    return () => clearInterval(interval);
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
    const targetRoom = rooms.find((r) => r.id === roomId);

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

    // Append new real incident to live incidents timeline
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newIncident = {
      id: `inc_${Date.now()}`,
      time: nowTime,
      title: `Smoke & Thermal Hazard - Level ${targetRoom?.floor || 1}`,
      subtitle: targetRoom ? `${targetRoom.name} (${targetRoom.camId})` : 'Active Fire Alert',
      severity: 'High',
      floor: targetRoom?.floor || 1,
      roomId
    };

    setIncidents((prev) => [newIncident, ...prev]);

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

    // Add evacuation incident
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const evacIncident = {
      id: `inc_${Date.now()}`,
      time: nowTime,
      title: 'Full Facility Evacuation Protocol Initiated',
      subtitle: 'Dynamic AI load balancing & egress stairwell routing',
      severity: 'Medium'
    };
    setIncidents((prev) => [evacIncident, ...prev]);
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
    const freshRooms = INITIAL_ROOMS.map((r) => ({
      ...r,
      hasFire: false,
      tempCelsius: 22
    }));
    setRooms(freshRooms);
    setExits(INITIAL_EXITS);
    setBottlenecks([]);
    setIsSimulating(false);
    setSystemStatus('STANDBY');
    setIncidents(INITIAL_INCIDENTS);
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

  const handleSetFacadeMode = (mode) => {
    if (sceneManagerRef.current && sceneManagerRef.current.setFacadeModeDirect) {
      const newMode = sceneManagerRef.current.setFacadeModeDirect(mode);
      setFacadeMode(newMode);
    }
  };

  const handleToggleBimLayer = (layerName, isVisible) => {
    setBimLayers((prev) => ({ ...prev, [layerName]: isVisible }));
    if (sceneManagerRef.current && sceneManagerRef.current.setBimLayer) {
      sceneManagerRef.current.setBimLayer(layerName, isVisible);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const hasAnyFire = rooms.some((r) => r.hasFire);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f1f5f9] text-slate-800 overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER (Matching Image 1) */}
      <TopHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'LIVE_VIEW') {
            setIsCctvOpen(false);
            setIsAnalyticsOpen(false);
            setIsIncidentsOpen(false);
            setIsReportsOpen(false);
          }
        }}
        incidentCount={incidents.length}
        onOpenCctv={() => setIsCctvOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenIncidents={() => setIsIncidentsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        serverConnected={serverConnected}
      />


      {/* 2. MAIN WORKSPACE (Collapsible Left Sidebar + Center 3D Digital Twin Viewport + Collapsible Right Sidebar) */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Left Sidebar (Collapsible with icon-only rail) */}
        <LeftSidebar
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          activeMode={activeSidebarMode}
          onSelectMode={(mode) => {
            setActiveSidebarMode(mode);
            if (mode === '3D_VIEW') {
              handleSetCameraPreset('HERO_VIEW');
              handleSetFloorView('ALL');
            } else if (mode === 'FLOOR_VIEW') {
              handleSetCameraPreset('HERO_VIEW');
            } else if (mode === 'STAIRS_FOCUS') {
              handleSetCameraPreset('STAIRS_FOCUS');
            } else if (mode === 'ELEVATORS') {
              handleSetCameraPreset('FLOOR_1');
            } else if (mode === 'CCTV') {
              setIsCctvOpen(true);
            } else if (mode === 'SYSTEMS') {
              setIsAnalyticsOpen(true);
            }
          }}
          activeFloorView={activeFloorView}
          onSelectFloor={handleSetFloorView}
          rooms={rooms}
          exits={exits}
          hasFire={hasAnyFire}
          onOpenCctv={() => setIsCctvOpen(true)}
          onOpenSystems={() => setIsAnalyticsOpen(true)}
          onSetCameraPreset={handleSetCameraPreset}
        />


        {/* Central 3D Digital Twin Viewport (Contains untouched furnished building!) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#f1f5f9] relative overflow-hidden">
          {/* Full Three.js 3D Viewport */}
          <div
            ref={threeCanvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
          />

          {/* Viewport Floating Controls: [Exterior/Interior/Top View], Compass Rose, Vertical Floor Badges [L10..L1], Zoom Tools */}
          <ViewportOverlay
            facadeMode={facadeMode}
            onSetFacadeMode={handleSetFacadeMode}
            activeFloorView={activeFloorView}
            onSelectFloor={handleSetFloorView}
            cameraYaw={cameraYaw}
            onZoomIn={() => sceneManagerRef.current && sceneManagerRef.current.zoomIn(6)}
            onZoomOut={() => sceneManagerRef.current && sceneManagerRef.current.zoomOut(6)}
            onResetView={(preset) => handleSetCameraPreset(preset)}
            onToggleExploded={() =>
              handleSetFloorView(activeFloorView === 'EXPLODED' ? 'ALL' : 'EXPLODED')
            }
            rooms={rooms}
          />
        </div>


        {/* Right Sidebar (Collapsible with icon-only rail) */}
        <RightSidebar
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
          stats={stats}
          exits={exits}
          incidents={incidents}
          hasFire={hasAnyFire}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          onOpenIncidents={() => setIsIncidentsOpen(true)}
        />

      </div>

      {/* 3. BOTTOM CONTROL DOCK (Start Evacuation, Reset, Speed, BIM Layers, Camera View - Matching Image 1) */}
      <BottomControlDock
        isSimulating={isSimulating}
        simSpeed={simSpeed}
        onStartEvacuation={handleStartEvacuation}
        onPauseResume={handlePauseResume}
        onReset={handleReset}
        onSetSpeed={handleSetSpeed}
        onSetCameraPreset={handleSetCameraPreset}
        bimLayers={bimLayers}
        onToggleBimLayer={handleToggleBimLayer}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* MODAL 1: CCTV Multiviewer (100 Cams) */}
      {isCctvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-[#0d7a5f] border border-emerald-100">
                  <Video className="w-4 h-4" />
                </div>
                <span>Facility CCTV Security Multiviewer (100 Cams)</span>
              </div>
              <button
                onClick={() => setIsCctvOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <CCTVMultiviewer
                rooms={rooms}
                onTriggerFire={handleTriggerFire}
                onUpdateCrowd={handleUpdateCrowd}
                onFocusRoom={(roomId) => {
                  handleSetCameraPreset('ROOM_FOCUS', roomId);
                  setIsCctvOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Evacuation Analytics & Stairwell Core Intel */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-[#0d7a5f] border border-emerald-100">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>Stairwell Cores & 10-Floor Population Analytics</span>
              </div>
              <button
                onClick={() => setIsAnalyticsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
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

      {/* MODAL 3: Live Incident Command Center */}
      {isIncidentsOpen && (
        <IncidentsModal
          incidents={incidents}
          onClose={() => setIsIncidentsOpen(false)}
          onFocusRoom={(roomId) => {
            handleSetCameraPreset('ROOM_FOCUS', roomId);
            setIsIncidentsOpen(false);
          }}
        />
      )}

      {/* MODAL 4: Safety Compliance Audit Report */}
      {isReportsOpen && (
        <ReportsModal
          stats={stats}
          exits={exits}
          onClose={() => setIsReportsOpen(false)}
        />
      )}

      {/* MODAL 5: Single-Click Room Inspection Modal */}
      {activeModalRoomId && (
        <RoomModal
          room={rooms.find((r) => r.id === activeModalRoomId)}
          onClose={() => setActiveModalRoomId(null)}
          onTriggerFire={handleTriggerFire}
          onUpdateCrowd={handleUpdateCrowd}
          onSelectFloor={handleSetFloorView}
        />
      )}

      {/* MODAL 6: Floating Double-Tap Quick Fire Trigger Emoji Bubble */}
      {fireBubbleData && (
        <FireTriggerBubble
          room={rooms.find((r) => r.id === fireBubbleData.room.id) || fireBubbleData.room}
          position={fireBubbleData.position}
          onClose={() => setFireBubbleData(null)}
          onToggleFire={(roomId) => {
            handleTriggerFire(roomId);
            setFireBubbleData(null);
          }}
        />
      )}
    </div>
  );
}
