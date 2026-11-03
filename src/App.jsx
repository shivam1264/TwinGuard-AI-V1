import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SceneManager } from './three/SceneManager';
import { TopHeader } from './components/TopHeader';
import { LeftSidebar } from './components/LeftSidebar';
import { BottomControlDock } from './components/BottomControlDock';
import { ViewportOverlay } from './components/ViewportOverlay';
import { CCTVMultiviewer } from './components/CCTVMultiviewer';
import { BottleneckAnalytics } from './components/BottleneckAnalytics';
import { ReportsModal } from './components/ReportsModal';
import { RoomModal } from './components/RoomModal';
import { FireTriggerBubble } from './components/FireTriggerBubble';
import { SettingsModal } from './components/SettingsModal';
import { ScenarioConfigModal } from './components/ScenarioConfigModal';
import { StrategyRankModal } from './components/StrategyRankModal';
import { BuildingInfoModal } from './components/BuildingInfoModal';
import { BuildingInfoPage } from './components/BuildingInfoPage';
import { EmergencyCommandCenterPage } from './components/EmergencyCommandCenterPage';
import { EmergencyControlModal } from './components/EmergencyControlModal';
import { EvacueeCompanionView } from './components/EvacueeCompanionView';
import { EvacueeQrModal } from './components/EvacueeQrModal';
import { SosAlertModal } from './components/SosAlertModal';
import GisMapDrawer from './components/gis/GisMapDrawer';
import { LoginModal } from './components/LoginModal';
import { DEMO_LOGIN, LoginPage } from './components/LoginPage';
import { ScenariosView } from './components/ScenariosView';
import { StrategyRankerView } from './components/StrategyRankerView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { DynamicLeftSidebar } from './components/DynamicLeftSidebar';
import { AIEngine, EVACUATION_STRATEGIES } from './ai';
import { resolveStrategyInfo } from './ai/StrategyInfo';
import {
  clearPendingFireTriggers,
  createFireTriggerId,
  forgetPendingFireTrigger,
  registerFireTriggerSocketHandlers,
  rememberPendingFireTrigger
} from './simulation/FireTriggerCorrelation';
import { X, Video, BarChart3 } from 'lucide-react';

import { FLOOR_THEMES, ROOM_TEMPLATES } from './simulation/Doorways';
import sampleFireScenario from './simulation/scenarios/sample-fire.json';

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
        capacity: 50, // configured design capacity for this room
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

const isEvacueeView = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'evacuee';

export function App() {
  if (isEvacueeView) {
    return <EvacueeCompanionView />;
  }

  const threeCanvasRef = useRef(null);
  const mainSlotRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const socketRef = useRef(null);
  const pendingFireTriggersRef = useRef(new Map());

  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [exits, setExits] = useState(INITIAL_EXITS);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('twinguard_demo_auth') === 'remembered'
        || sessionStorage.getItem('twinguard_demo_auth') === 'session';
    } catch {
      return false;
    }
  });
  const [facadeMode, setFacadeMode] = useState('FULL');
  const [activeFloorView, setActiveFloorView] = useState('ALL');
  const [activeCameraPreset, setActiveCameraPreset] = useState('HERO_VIEW');
  const [activeTab, setActiveTab] = useState('LIVE_VIEW');
  const [activeSidebarMode, setActiveSidebarMode] = useState('3D_VIEW');
  const [cameraYaw, setCameraYaw] = useState(0);

  // Theme Mode: 'dark' (default) or 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('twinguard_theme') || 'dark';
  });

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('twinguard_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light', 'light');
      document.documentElement.classList.remove('theme-dark', 'dark');
    } else {
      document.documentElement.classList.add('theme-dark', 'dark');
      document.documentElement.classList.remove('theme-light', 'light');
    }
    if (sceneManagerRef.current && sceneManagerRef.current.setTheme) {
      sceneManagerRef.current.setTheme(theme);
    }
  }, [theme]);

  // Collapsible panels state (Default: closed/collapsed on start as requested)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(true);

  const [activeModalRoomId, setActiveModalRoomId] = useState(null);
  const [selected3DRoom, setSelected3DRoom] = useState(null);
  const [fireBubbleData, setFireBubbleData] = useState(null);
  const [isCctvOpen, setIsCctvOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false);
  const [isEmergencyControlOpen, setIsEmergencyControlOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isEvacueeQrOpen, setIsEvacueeQrOpen] = useState(false);
  const [activeSosAlert, setActiveSosAlert] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGisOpen, setIsGisOpen] = useState(true); // Free Fire style persistent radar HUD on 3D view
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState(null);
  const [activeScenario, setActiveScenario] = useState(() => {
    if (AIEngine && AIEngine.getActiveScenario) {
      return AIEngine.getActiveScenario();
    }
    return sampleFireScenario;
  });
  const [bimLayers, setBimLayers] = useState({
    structure: true,
    fireSafety: true,
    occupants: true
  });
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [activeStrategyInfo, setActiveStrategyInfo] = useState(() =>
    resolveStrategyInfo(null, AIEngine.getActiveStrategy?.())
  );
  const [lastReroute, setLastReroute] = useState(null);
  const [systemStatus, setSystemStatus] = useState("STANDBY");
  const [serverConnected, setServerConnected] = useState(false);
  // Live SceneManager instance (state so overlays/mounts never see a stale ref)
  const [sceneMgr, setSceneMgr] = useState(null);

  const [stats, setStats] = useState({
    total: calculateTotal(INITIAL_ROOMS),
    evacuated: 0,
    inTransit: calculateTotal(INITIAL_ROOMS),
    elapsedSeconds: 0
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!threeCanvasRef.current) return;

    const manager = new SceneManager(
      threeCanvasRef.current,
      (stats) => {
        setStats({
          total: stats.total,
          evacuated: stats.evacuated,
          inTransit: stats.inTransit,
          elapsedSeconds: stats.elapsedSeconds,
          waiting: stats.waiting || 0,
          evacuating: stats.evacuating || 0
        });
        if (stats.strategy) {
          setActiveStrategyInfo(stats.strategy);
        }
        if (stats.rerouteEvents && stats.rerouteEvents.length > 0) {
          setIncidents((prev) => [...stats.rerouteEvents, ...prev]);
          setLastReroute(stats.rerouteEvents[0]);
        }
        if (stats.isSimulating) {
          setIsSimulating(true);
          setSystemStatus('EVACUATING');
        }
        if (stats.isCompleted) {
          setIsSimulating(false);
          setSystemStatus('COMPLETED');
        }
      },
      (selectedRoom) => {
        if (selectedRoom) {
          setSelected3DRoom(selectedRoom);
        }
      },
      (matchedRoom, screenPos) => {
        // Double tap / double click: show minimalist fire trigger pill
        setFireBubbleData({ room: matchedRoom, position: screenPos });
      },
      (newFacadeMode) => {
        setFacadeMode(newFacadeMode);
      },
      (spreadRoomId) => {
        handleTriggerFire(spreadRoomId, false);
      },
      (preset) => {
        setActiveCameraPreset(preset);
      }
    );

    sceneManagerRef.current = manager;
    setSceneMgr(manager);
    window.__sceneManager = manager;
    manager.onFireTriggered = (rId) => {
      handleTriggerFire(rId, true, true);
    };
    window.__twinguardApp = {
      startEvacuation: handleStartEvacuation,
      reset: handleReset,
      setSimSpeed: handleSetSpeed,
      toggleGis: () => setIsGisOpen(prev => !prev),
      getStats: () => stats,
      getEmergencyStatus: () => emergencyStatus,
      sceneManager: manager
    };
    manager.syncOccupants(rooms);

    return () => {
      manager.dispose();
      if (sceneManagerRef.current === manager) sceneManagerRef.current = null;
      if (window.__sceneManager === manager) delete window.__sceneManager;
    };
  }, [isAuthenticated]);

  // Force 3D resize when switching to LIVE_VIEW so canvas immediately adapts
  useEffect(() => {
    if (activeTab === 'LIVE_VIEW' && sceneManagerRef.current && sceneManagerRef.current.handleResize) {
      const timer = setTimeout(() => {
        if (sceneManagerRef.current && sceneManagerRef.current.handleResize) {
          sceneManagerRef.current.handleResize();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Phase 5C: Pass active scenario to SceneManager when loaded
  useEffect(() => {
    if (sceneManagerRef.current && activeScenario) {
      sceneManagerRef.current.setActiveScenario(activeScenario);
    }
  }, [activeScenario]);

  // Smoothly trigger Three.js resize when panels collapse or expand
  useEffect(() => {
    if (!sceneManagerRef.current || !sceneManagerRef.current.handleResize) return;

    let startTime = performance.now();
    let animationFrameId;

    const smoothlyResize = (currentTime) => {
      const elapsed = currentTime - startTime;
      if (sceneManagerRef.current && sceneManagerRef.current.handleResize) {
        sceneManagerRef.current.handleResize();
      }
      if (elapsed < 320) {
        animationFrameId = requestAnimationFrame(smoothlyResize);
      }
    };

    animationFrameId = requestAnimationFrame(smoothlyResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isLeftCollapsed]);

  const handleToggleSirenMute = () => {
    if (sceneManagerRef.current && sceneManagerRef.current.toggleEmergencySiren) {
      const isAudible = sceneManagerRef.current.toggleEmergencySiren();
      setIsSirenMuted(!isAudible);
    } else if (sceneManagerRef.current && sceneManagerRef.current.emergencyVehicles) {
      const isAudible = sceneManagerRef.current.emergencyVehicles.toggleMute();
      setIsSirenMuted(!isAudible);
    } else {
      setIsSirenMuted(!isSirenMuted);
    }
  };

  // Pause heavy Three.js 60fps WebGL rendering when viewing 2D tabs to eliminate CPU/GPU lag
  useEffect(() => {
    if (sceneManagerRef.current && sceneManagerRef.current.setRenderPaused) {
      const is3DNeeded = activeTab === 'LIVE_VIEW' || activeTab === 'COMMAND_CENTER';
      sceneManagerRef.current.setRenderPaused(!is3DNeeded);
    }
  }, [activeTab]);

  // Track camera rotation for real-time Compass Rose updates & Emergency Telemetry with zero redundant re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'LIVE_VIEW' && sceneManagerRef.current && sceneManagerRef.current.getCameraYaw) {
        const yaw = Math.round(sceneManagerRef.current.getCameraYaw());
        setCameraYaw((prev) => (prev === yaw ? prev : yaw));
      }
      if (sceneManagerRef.current && sceneManagerRef.current.getEmergencyStatus) {
        const em = sceneManagerRef.current.getEmergencyStatus();
        setEmergencyStatus((prev) => {
          if (!prev && !em) return prev;
          if (!prev && em) return { ...em };
          if (prev && !em) return null;
          if (
            prev.isActive === em.isActive &&
            prev.isArrived === em.isArrived &&
            prev.progress === em.progress &&
            Math.floor(prev.etaSeconds || 0) === Math.floor(em.etaSeconds || 0) &&
            prev.phase === em.phase &&
            prev.targetGate?.id === em.targetGate?.id
          ) {
            return prev;
          }
          return { ...em };
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Synthesize Command Center Tactical Distress Alarm Tone for SOS Alerts
  const playCommandCenterSosChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // High-urgency alert burst 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // High-urgency alert burst 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1174.66, now + 0.16);
      gain2.gain.setValueAtTime(0.32, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.6);
    } catch {}
  };

  // Socket.io backend sync
  useEffect(() => {
    if (!isAuthenticated) return;
    const backendHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    const socket = io(`http://${backendHost}:5000`, {
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

    registerFireTriggerSocketHandlers(
      socket,
      pendingFireTriggersRef.current,
      (roomId, createIncident) => {
        handleTriggerFire(roomId, false, createIncident);
      },
      (state) => {
        if (state.rooms) setRooms(state.rooms);
        if (state.exits) setExits(state.exits);
        if (state.evacuatedCount !== undefined) {
          setStats((prev) => ({
            ...prev,
            evacuated: state.evacuatedCount,
            inTransit: state.inTransitCount !== undefined ? state.inTransitCount : prev.inTransit
          }));
        }
      }
    );

    socket.on('incident-sos', (sosAlert) => {
      setIncidents((prev) => [sosAlert, ...prev]);
      setSystemStatus((prev) => (prev === 'STANDBY' ? 'ALARM' : prev));
      setActiveSosAlert(sosAlert);
      playCommandCenterSosChime();
    });

    return () => {
      clearPendingFireTriggers(pendingFireTriggersRef.current);
      socket.disconnect();
    };
  }, [isAuthenticated]);

  // Trigger Fire in a room
  const handleTriggerFire = (roomId, emitToServer = true, createIncident = true) => {
    const triggerId = emitToServer ? createFireTriggerId() : null;
    const shouldSendToServer = Boolean(triggerId);
    if (shouldSendToServer) {
      rememberPendingFireTrigger(pendingFireTriggersRef.current, triggerId);
    }

    const targetRoom = rooms.find((r) => r.id === roomId);
    const segMatch = /^(corr|stair)_f(\d+)_([a-z]+)$/.exec(String(roomId || ''));
    const targetFloor = targetRoom?.floor || (segMatch ? parseInt(segMatch[2], 10) : 1);
    const targetName = targetRoom
      ? `${targetRoom.name} (${targetRoom.camId})`
      : (segMatch
          ? `${segMatch[3] === 'west' ? 'West' : 'East'} ${segMatch[1] === 'corr' ? 'Corridor' : 'Stairwell'} (Level ${segMatch[2]})`
          : 'Active Fire Alert');

    setRooms((prev) => {
      const exists = prev.some((r) => r.id === roomId);
      if (exists) {
        return prev.map((r) => {
          if (r.id === roomId) {
            return { ...r, hasFire: true, tempCelsius: 86 };
          }
          return r;
        });
      }
      if (segMatch) {
        const kind = segMatch[1];
        const fl = parseInt(segMatch[2], 10);
        const zone = segMatch[3];
        const isWest = zone === 'west';
        return [
          ...prev,
          {
            id: roomId,
            name: `${isWest ? 'West' : 'East'} ${kind === 'corr' ? 'Corridor' : 'Stairwell'}`,
            floor: fl,
            hasFire: true,
            tempCelsius: 88,
            camId: `CAM-${kind.toUpperCase()}-L${fl}-${zone.toUpperCase().slice(0, 1)}`
          }
        ];
      }
      return prev;
    });

    setSystemStatus('EVACUATING');
    setIsSimulating(true);

    if (sceneManagerRef.current) {
      sceneManagerRef.current._suppressFireNotify = true;
      sceneManagerRef.current.triggerFire(roomId);
      sceneManagerRef.current._suppressFireNotify = false;
    }

    if (createIncident) {
      // Append new real incident to live incidents timeline
      const nowTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const newIncident = {
        id: `inc_${Date.now()}`,
        time: nowTime,
        title: `Smoke & Thermal Hazard - Level ${targetFloor}`,
        subtitle: targetName,
        severity: 'High',
        floor: targetFloor,
        roomId
      };

      setIncidents((prev) => [newIncident, ...prev]);
    }

    if (shouldSendToServer) {
      const backendHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';

      // 1. Direct Socket.IO emission
      if (socketRef.current?.connected) {
        socketRef.current.emit('client-trigger-fire', { roomId, triggerId });
      }

      // 2. HTTP POST with fallback (Vite proxy relative path + direct backend IP:5000)
      const postPayload = JSON.stringify({ roomId, triggerId });
      fetch('/api/trigger-fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: postPayload
      }).catch(() => {
        return fetch(`http://${backendHost}:5000/api/trigger-fire`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: postPayload
        });
      }).catch((error) => {
        forgetPendingFireTrigger(pendingFireTriggersRef.current, triggerId);
        console.error('Failed to send fire trigger to server:', error);
      });
    }
  };

  // Update Crowd count for a room
  const handleUpdateCrowd = (roomId, newCount) => {
    const updatedRooms = rooms.map((r) =>
      r.id === roomId ? { ...r, peopleCount: newCount } : r
    );
    setRooms(updatedRooms);

    if (sceneManagerRef.current && !isSimulating && systemStatus !== 'COMPLETED') {
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

  // Apply Emergency Scenario from Scenario Studio (AI Module)
  const handleApplyScenario = (newScenario) => {
    if (AIEngine && AIEngine.setScenario) {
      AIEngine.setScenario(newScenario);
      setActiveScenario(newScenario);

      const updatedRooms = AIEngine.applyScenarioToRooms ? AIEngine.applyScenarioToRooms(INITIAL_ROOMS) : INITIAL_ROOMS;
      setRooms(updatedRooms);

      const updatedExits = AIEngine.applyScenarioToExits ? AIEngine.applyScenarioToExits(INITIAL_EXITS) : INITIAL_EXITS;
      setExits(updatedExits);

      const sm = sceneManagerRef.current;
      const hazard = newScenario.hazard;

      // ── 1. Hazard dispatch: spawn the RIGHT 3D effect per hazard type ──
      if (hazard && hazard.roomId && sm) {
        setSystemStatus('EVACUATING');
    setIsSimulating(true);
        const hzType = String(hazard.type || 'FIRE').toUpperCase();
        if (hzType === 'SMOKE') {
          sm.spawnSmoke(hazard.roomId);
        } else if (hzType === 'CHEMICAL') {
          // Toxic gas → smoke-only cloud with sickly green tint
          sm.spawnSmoke(hazard.roomId, { tint: 0x6fae5a, gasTint: true });
        } else if (hzType === 'COLLAPSE') {
          // Structural failure → localized collapse at the hazard room
          const loc = sm.getRoomMapping
            ? sm.getRoomMapping(hazard.roomId)
            : { id: hazard.roomId, floor: hazard.floor, category: 'ROOM' };
          if (sm.setStructuralCollapse) sm.setStructuralCollapse(true, loc || { id: hazard.roomId, floor: hazard.floor, category: 'ROOM' });
        } else {
          // FIRE / ELECTRICAL ARC → live fire with spark emphasis
          sm.triggerFire(hazard.roomId);
        }

        // ── 2. Fire tuning: Heat Release Rate + Smoke Generation + Propagation ──
        if (sm.setFireTuning) {
          const hrr = Number(hazard.heatReleaseRate) || 5500;
          const sgr = Number(hazard.smokeGenRate) || 4.5;
          const growthModel = String(newScenario.propagationModel || 'Standard (t² Growth)');
          const growthSpeed =
            growthModel === 'Rapid Flashover' ? 2.0 :
            growthModel === 'Smoldering Slow' ? 0.4 : 1.0;
          // Sprinkler suppression factor: AUTO damps growth, DELAYED lags, OFF uncontrolled
          const sprinklerFactor =
            hazard.sprinklers === 'AUTO' ? 0.8 :
            hazard.sprinklers === 'DELAYED' ? 0.95 : 1.15;
          sm.setFireTuning(hazard.roomId, {
            intensityScale: Math.min(2.2, Math.max(0.3, (hrr / 5500) * sprinklerFactor)),
            smokeRateScale: Math.min(2.6, Math.max(0.3, (sgr / 4.5) * (sprinklerFactor < 1 ? 1.1 : 1.0))),
            growthSpeed: growthSpeed * (hazard.sprinklers === 'AUTO' ? 0.85 : hazard.sprinklers === 'DELAYED' ? 1.0 : 1.3)
          });
        }
      }

      // ── 3. Environment: Power Grid + HVAC → real 3D building systems ──
      const cond = newScenario.conditions || {};
      if (sm) {
        if (typeof cond.powerGridFailure === 'boolean') {
          AIEngine.togglePowerFailure?.(cond.powerGridFailure);
          if (sm.setGlobalPowerFailure) sm.setGlobalPowerFailure(cond.powerGridFailure);
        }
        if (typeof cond.hvacFailure === 'boolean') {
          AIEngine.toggleHvacFailure?.(cond.hvacFailure);
          if (sm.setGlobalHvacFailure) sm.setGlobalHvacFailure(cond.hvacFailure);
        }
      }

      // ── 4. Structural: elevator grounding + corridor blockages ──
      const sf = newScenario.structuralFailures || {};
      if (sm) {
        if (typeof sf.elevatorLocked === 'boolean' && sm.setElevatorLocked) {
          sm.setElevatorLocked(sf.elevatorLocked);
        }
        if (Array.isArray(sf.damagedCorridors) && sm.setStructuralCollapse) {
          sf.damagedCorridors.forEach((corrId) => {
            // Accept both 'f2_west' (studio) and 'corr_f2_west' (engine) forms
            const segId = String(corrId).startsWith('corr_')
              ? String(corrId)
              : `corr_${String(corrId).startsWith('f') ? '' : 'f'}${corrId}`;
            const m = /^corr_f(\d+)_/.exec(segId);
            const floor = m ? parseInt(m[1], 10) : (hazard?.floor || 2);
            sm.setStructuralCollapse(true, { id: segId, floor, category: 'CORRIDOR' });
          });
        }
      }

      if (sceneManagerRef.current && sceneManagerRef.current.syncOccupants) {
        sceneManagerRef.current.syncOccupants(updatedRooms);
      }
    }
  };

  const handleApplyStrategyToSimulation = async (selectedStrategy) => {
    if (AIEngine && AIEngine.setActiveStrategy) {
      AIEngine.setActiveStrategy(selectedStrategy);
    }
    if (sceneManagerRef.current) {
      if (systemStatus === 'COMPLETED' || sceneManagerRef.current.evacuationCompleted) return;
      if (sceneManagerRef.current.prepareEvacuationView) {
        await sceneManagerRef.current.prepareEvacuationView({ switchToCutaway: facadeMode === 'FULL' });
      } else if (facadeMode === 'FULL') {
        handleSetFacadeMode('CUTAWAY');
      }
      setIsSimulating(true);
      setSystemStatus('EVACUATING');
      const result = await sceneManagerRef.current.startEvacuation(activeScenario, selectedStrategy);
      if (!result) return;
      if (result) {
        if (result.exitStats) setExits(result.exitStats);
        if (result.bottlenecks) setBottlenecks(result.bottlenecks);
      }
      const appliedStrategy = selectedStrategy || AIEngine.getActiveStrategy?.();
      setActiveStrategyInfo(resolveStrategyInfo(appliedStrategy?.type, appliedStrategy));
      setLastReroute(null);
    }
  };

  // Start Evacuation Simulation
  const handleStartEvacuation = async () => {
    if (!sceneManagerRef.current) return;
    if (systemStatus === 'COMPLETED' || sceneManagerRef.current.evacuationCompleted) return;
    if (sceneManagerRef.current.prepareEvacuationView) {
      await sceneManagerRef.current.prepareEvacuationView({ switchToCutaway: facadeMode === 'FULL' });
    } else if (facadeMode === 'FULL') {
      handleSetFacadeMode('CUTAWAY');
    }
    setIsSimulating(true);
    setSystemStatus('EVACUATING');
    const result = await sceneManagerRef.current.startEvacuation();
    if (!result) return;
    const appliedStrategy = AIEngine.getActiveStrategy?.();
    setActiveStrategyInfo(resolveStrategyInfo(appliedStrategy?.type, appliedStrategy));
    setLastReroute(null);

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

  // Scenario Studio "Run Simulation": apply scenario → open 3D → auto-start
  // evacuation (one-click full run; reuses handleStartEvacuation logic).
  const handleRunFullSimulation = async () => {
    handleSelectTab('LIVE_VIEW');
    // Let the 3D canvas resize + scenario state settle before starting
    await new Promise((resolve) => setTimeout(resolve, 550));
    await handleStartEvacuation();
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
    setEmergencyStatus(null);
    setIncidents(INITIAL_INCIDENTS);
    setLastReroute(null);
    setActiveStrategyInfo(resolveStrategyInfo(null, AIEngine.getActiveStrategy?.()));
    setStats({
      total: calculateTotal(INITIAL_ROOMS),
      evacuated: 0,
      inTransit: calculateTotal(INITIAL_ROOMS),
      elapsedSeconds: 0,
      waiting: 0,
      evacuating: 0
    });

    if (sceneManagerRef.current) {
      sceneManagerRef.current.reset(freshRooms);
    }

    // Multi-hazard reset: clear the centralized hazard store as well
    // (the scene-side hazards are cleaned inside sceneManager.reset)
    if (AIEngine && AIEngine.resetHazards) {
      AIEngine.resetHazards();
    }

    if (socketRef.current && socketRef.current.connected) {
      fetch('http://localhost:5000/api/reset', { method: 'POST' }).catch(() => {});
    }
  };

  const handleSetSpeed = (speed) => {
    setSimSpeed(speed);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.simSpeed = speed;
    }
  };

  const handleSetCameraPreset = useCallback((preset, roomId = null) => {
    setActiveCameraPreset(preset);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(preset, roomId);
    }
  }, []);

  const handleSetFloorView = useCallback((floorMode) => {
    setActiveFloorView(floorMode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setFloorMode(floorMode);
    }
  }, []);

  // Multi-hazard toggles → global incident feed (sidebar + command center)
  const handleHazardEvent = useCallback((evt) => {
    if (!evt) return;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    setIncidents((prev) =>
      [
        {
          id: evt.id || `hz_${Date.now()}`,
          time: nowTime,
          title: evt.message || 'Multi-hazard state change',
          subtitle: `${evt.hazard} · ${evt.location || 'Building-wide'}`,
          severity: evt.enabled ? 'High' : 'Low'
        },
        ...prev
      ].slice(0, 40)
    );
  }, []);

  const handleSetFacadeMode = useCallback((mode) => {
    if (sceneManagerRef.current && sceneManagerRef.current.setFacadeModeDirect) {
      const newMode = sceneManagerRef.current.setFacadeModeDirect(mode);
      setFacadeMode(newMode);
    }
  }, []);

  const handleToggleBimLayer = useCallback((layerName, isVisible) => {
    setBimLayers((prev) => ({ ...prev, [layerName]: isVisible }));
    if (sceneManagerRef.current && sceneManagerRef.current.setBimLayer) {
      sceneManagerRef.current.setBimLayer(layerName, isVisible);
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleSelectTab = (tab) => {
    if (tab === 'BUILDING_INFO') {
      setActiveSidebarMode('INFO');
      setActiveTab('BUILDING_INFO');
      return;
    }
    if (tab === 'COMMAND_CENTER') {
      setActiveSidebarMode('COMMAND_CENTER');
      setActiveTab('COMMAND_CENTER');
      return;
    }
    if (tab === 'LIVE_VIEW') {
      setActiveSidebarMode('3D_VIEW');
      setActiveTab('LIVE_VIEW');
      handleSetCameraPreset('HERO_VIEW');
      setIsCctvOpen(false);
      setIsAnalyticsOpen(false);
      setIsReportsOpen(false);
      return;
    }
    if (tab === 'INCIDENTS') {
      setActiveSidebarMode('3D_VIEW');
      setActiveTab('LIVE_VIEW');
      return;
    }
    if (tab === 'REPORTS') {
      setActiveSidebarMode('3D_VIEW');
      setActiveTab('ANALYTICS');
      return;
    }
    if (tab === 'SETTINGS') {
      setIsSettingsOpen(true);
      return;
    }
    setActiveSidebarMode('3D_VIEW');
    setActiveTab(tab);
  };

  const handleSwitchToLive = useCallback(() => {
    handleSelectTab('LIVE_VIEW');
  }, [handleSelectTab]);

  const handleDemoAuthenticate = ({ email, password, rememberMe }) => {
    const isValid = email.toLowerCase() === DEMO_LOGIN.email && password === DEMO_LOGIN.password;
    if (!isValid) return false;

    try {
      if (rememberMe) {
        localStorage.setItem('twinguard_demo_auth', 'remembered');
        sessionStorage.removeItem('twinguard_demo_auth');
      } else {
        localStorage.removeItem('twinguard_demo_auth');
        sessionStorage.setItem('twinguard_demo_auth', 'session');
      }
    } catch {
      // The current tab can still continue if browser storage is disabled.
    }

    setIsAuthenticated(true);
    return true;
  };

  const hasAnyFire = rooms.some((r) => r.hasFire);

  if (!isAuthenticated) {
    return <LoginPage onAuthenticate={handleDemoAuthenticate} />;
  }

  return (
    <div
      className={`flex flex-col h-screen h-[100dvh] w-screen overflow-hidden font-sans select-none transition-colors duration-300 ${
        theme === 'dark' ? 'theme-dark bg-[#070d18] text-slate-100' : 'theme-light bg-[#f1f5f9] text-slate-900'
      }`}
    >
      {/* 1. TOP HEADER */}
      <TopHeader
        onToggleSidebar={() => setIsLeftCollapsed((prev) => !prev)}
        isSidebarCollapsed={isLeftCollapsed}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCctv={() => setIsCctvOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScenarioStudio={() => setIsScenarioModalOpen(true)}
        onOpenStrategyRanker={() => setIsStrategyModalOpen(true)}
        onOpenBuildingInfo={() => handleSelectTab('BUILDING_INFO')}
        onOpenEvacueeQr={() => setIsEvacueeQrOpen(true)}
        onOpenGis={() => setIsGisOpen(!isGisOpen)}
        isGisOpen={isGisOpen}
        serverConnected={serverConnected}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* 2. MAIN WORKSPACE (Persistent Left Sidebar + Center 3D & Modules Dynamic Viewport) */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Dynamic Contextual Left Sidebar (Persistent across all 8 modules) */}
        <DynamicLeftSidebar
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          activeMode={activeSidebarMode}
          onSelectMode={(mode) => {
            setActiveSidebarMode(mode);
            if (mode === '3D_VIEW') {
              handleSetCameraPreset('HERO_VIEW');
              handleSetFloorView('ALL');
            } else if (mode === 'STAIRS_FOCUS') {
              handleSetCameraPreset('STAIRS_FOCUS');
              handleSetFacadeMode('CUTAWAY');
            } else if (mode === 'CCTV') {
              setIsCctvOpen(true);
            } else if (mode === 'SYSTEMS') {
              setIsAnalyticsOpen(true);
            } else if (mode === 'EMERGENCY') {
              setIsEmergencyControlOpen(true);
            }
          }}
          activeFloorView={activeFloorView}
          onSelectFloor={handleSetFloorView}
          isSimulating={isSimulating}
          simSpeed={simSpeed}
          onStartEvacuation={handleStartEvacuation}
          onPauseResume={handlePauseResume}
          onReset={handleReset}
          onSetSpeed={handleSetSpeed}
          elapsedSeconds={stats.elapsedSeconds}
          onOpenCctv={() => setIsCctvOpen(true)}
          onOpenSystems={() => setIsAnalyticsOpen(true)}
          onOpenEmergencyControl={() => setIsEmergencyControlOpen(true)}
          onOpenGis={() => setIsGisOpen(!isGisOpen)}
          rooms={rooms}
          exits={exits}
          incidents={incidents}
        />

        {/* Central Dynamic Workspace (Displays 3D Digital Twin, Command Center, Building Info, AI Scenarios, Strategy Ranker, Analytics, or Reports) */}
        <div
          className={`flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#070d18]' : 'bg-[#f1f5f9]'
          }`}
        >
          {/* 1. AI SCENARIOS VIEW */}
          {activeTab === 'SCENARIOS' && (
            <ScenariosView
              theme={theme}
              rooms={rooms}
              currentScenario={activeScenario}
              onApplyScenario={handleApplyScenario}
              onSwitchToLive={handleSwitchToLive}
              onRunFullSimulation={handleRunFullSimulation}
            />
          )}

          {/* 2. STRATEGY RANKER VIEW */}
          {activeTab === 'STRATEGY_RANKER' && (
            <StrategyRankerView
              theme={theme}
              scenario={activeScenario}
              rooms={rooms}
              exits={exits}
              onApplyStrategy={handleApplyStrategyToSimulation}
              onSwitchToLive={handleSwitchToLive}
            />
          )}

          {/* 4. PREDICTIVE ANALYTICS VIEW */}
          {activeTab === 'ANALYTICS' && (
            <AnalyticsView
              theme={theme}
              stats={stats}
              rooms={rooms}
              exits={exits}
              onSwitchToLive={handleSwitchToLive}
            />
          )}

          {/* 5. LIFE SAFETY AUDIT & COMPLIANCE REPORTS VIEW */}
          {activeTab === 'REPORTS' && (
            <ReportsView
              theme={theme}
              stats={stats}
              exits={exits}
              onSwitchToLive={handleSwitchToLive}
            />
          )}

          {/* 6. Main Three.js 3D Viewport Slot (Preserved completely intact; hidden when in 2D views or Command Center) */}
          <div
            ref={mainSlotRef}
            className="w-full h-full relative overflow-hidden"
            style={{
              display: activeTab === 'LIVE_VIEW'
                ? 'block'
                : 'none'
            }}
          >
            <div
              ref={threeCanvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
            />
          </div>

          {/* Viewport Floating Controls: [Exterior/Interior/Top View], Compass Rose, Vertical Floor Badges [L10..L1], Zoom Tools */}
          {activeTab === 'LIVE_VIEW' && (
            <ViewportOverlay
              theme={theme}
              facadeMode={facadeMode}
              onSetFacadeMode={handleSetFacadeMode}
              activeFloorView={activeFloorView}
              activeCameraPreset={activeCameraPreset}
              onSelectFloor={handleSetFloorView}
              cameraYaw={cameraYaw}
              onZoomIn={() => sceneManagerRef.current && sceneManagerRef.current.zoomIn(6)}
              onZoomOut={() => sceneManagerRef.current && sceneManagerRef.current.zoomOut(6)}
              onPanLeft={() => sceneManagerRef.current && sceneManagerRef.current.panLeft(6)}
              onPanRight={() => sceneManagerRef.current && sceneManagerRef.current.panRight(6)}
              onMoveForward={() => sceneManagerRef.current && sceneManagerRef.current.moveForward(6)}
              onMoveBackward={() => sceneManagerRef.current && sceneManagerRef.current.moveBackward(6)}
              onResetView={(preset) => handleSetCameraPreset(preset)}
              onToggleExploded={() =>
                handleSetFloorView(activeFloorView === 'EXPLODED' ? 'ALL' : 'EXPLODED')
              }
              onToggleGis={() => setIsGisOpen(!isGisOpen)}
              onOpenBuildingInfo={() => handleSelectTab('BUILDING_INFO')}
              onToggleFullscreen={handleToggleFullscreen}
              isGisOpen={isGisOpen}
              rooms={rooms}
              sceneManager={sceneMgr}
            />
          )}

          {/* 7. EXACT BUILDING INFO PAGE IN 3D VIEWPORT AREA */}
          {activeTab === 'BUILDING_INFO' && (
            <div className={`absolute inset-0 z-10 overflow-hidden transition-colors duration-300 ${
              theme === 'dark' ? 'bg-[#070e1b]' : 'bg-[#f8fafc]'
            }`}>
              <BuildingInfoPage
                theme={theme}
                rooms={rooms}
                exits={exits}
                onClose={handleSwitchToLive}
                onSwitchTo3D={handleSwitchToLive}
                onSelectFloor={(floorNum) => {
                  handleSetFloorView(floorNum);
                  handleSelectTab('LIVE_VIEW');
                  handleSetCameraPreset(`FLOOR_${floorNum}`);
                }}
              />
            </div>
          )}

          {/* 8. EMERGENCY COMMAND CENTER DASHBOARD (Rendered in central workspace area) */}
          {activeTab === 'COMMAND_CENTER' && (
            <div className={`absolute inset-0 z-20 overflow-hidden flex flex-col transition-colors duration-300 ${
              theme === 'dark' ? 'bg-[#070e1b]' : 'bg-[#f4f6fa]'
            }`}>
              <EmergencyCommandCenterPage
                theme={theme}
                threeCanvasRef={threeCanvasRef}
                mainSlotRef={mainSlotRef}
                sceneManager={sceneMgr}
                onHazardEvent={handleHazardEvent}
                rooms={rooms}
                selected3DRoom={selected3DRoom}
                onSelect3DRoom={(r) => setSelected3DRoom(r)}
                onUpdateRooms={(updatedRooms) => {
                  setRooms(updatedRooms);
                  if (sceneManagerRef.current && sceneManagerRef.current.syncOccupants) {
                    sceneManagerRef.current.syncOccupants(updatedRooms);
                  }
                }}
                /* Strict per-room occupancy: updates ONLY that room, syncs the 3D
                   occupancy indicator of that room and persists to the backend */
                onUpdateOccupancy={handleUpdateCrowd}
                onBlockStairwell={(coreName, floorNum) => {
                  fetch('http://localhost:5000/api/block-stairwell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ coreName, floorNum })
                  }).catch(() => {});
                }}
                onUpdateExits={(updatedExits) => {
                  setExits(updatedExits);
                }}
                exits={exits}
                isSimulating={isSimulating}
                systemStatus={systemStatus}
                stats={stats}
                onStartSimulation={handleStartEvacuation}
                onPauseSimulation={handlePauseResume}
                onResetSimulation={handleReset}
                onTriggerFire={handleTriggerFire}
                onExtinguishFire={(roomId) => {
                  setRooms(prev => prev.map(r => r.id === roomId ? { ...r, hasFire: false, tempCelsius: 22 } : r));
                  if (sceneManagerRef.current && sceneManagerRef.current.extinguishFire) {
                    sceneManagerRef.current.extinguishFire(roomId);
                  }
                }}
                onClearAllFires={() => {
                  setRooms(prev => prev.map(r => ({ ...r, hasFire: false, tempCelsius: 22 })));
                  if (sceneManagerRef.current && sceneManagerRef.current.extinguishAll) {
                    sceneManagerRef.current.extinguishAll();
                  }
                }}
                onUpdateCrowd={(roomId, newCount) => {
                  setRooms(prev => prev.map(r => r.id === roomId ? { ...r, peopleCount: newCount } : r));
                }}
                onSwitchTo3D={() => handleSelectTab('LIVE_VIEW')}
                onClose={() => handleSelectTab('LIVE_VIEW')}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CCTV Multiviewer (100 Cams) */}
      {isCctvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
          <div className={`border rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            theme === 'dark' ? 'bg-[#0c162d] border-sky-500/30 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <CCTVMultiviewer
                theme={theme}
                rooms={rooms}
                onTriggerFire={handleTriggerFire}
                onUpdateCrowd={handleUpdateCrowd}
                onFocusRoom={(roomId) => {
                  handleSetCameraPreset("ROOM_FOCUS", roomId);
                  setIsCctvOpen(false);
                }}
                onClose={() => setIsCctvOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Evacuation Analytics & Stairwell Core Intel */}
      {isAnalyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
          <div className={`border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            theme === 'dark' ? 'bg-[#0c162d] border-sky-500/30 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <BottleneckAnalytics
                theme={theme}
                stats={stats}
                exits={exits}
                rooms={rooms}
                bottlenecks={bottlenecks}
                onClose={() => setIsAnalyticsOpen(false)}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Safety Compliance Audit Report */}
      {isReportsOpen && (
        <ReportsModal
          theme={theme}
          stats={stats}
          exits={exits}
          onClose={() => setIsReportsOpen(false)}
        />
      )}

      {/* MODAL 5: Single-Click Room Inspection Modal */}
      {activeModalRoomId && (
        <RoomModal
          theme={theme}
          room={rooms.find((r) => r.id === activeModalRoomId)}
          onClose={() => setActiveModalRoomId(null)}
          onTriggerFire={handleTriggerFire}
          onUpdateCrowd={handleUpdateCrowd}
          onSelectFloor={handleSetFloorView}
        />
      )}

      {/* MODAL 7: Scenario Studio Modal (AI Engine) */}
      <ScenarioConfigModal
        theme={theme}
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentScenario={activeScenario}
        onApplyScenario={handleApplyScenario}
        rooms={rooms}
      />

      {/* MODAL 8: AI Evacuation Strategy Ranker (TOPSIS Engine) */}
      <StrategyRankModal
        theme={theme}
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        scenario={activeScenario}
        rooms={rooms}
        exits={exits}
        onApplyStrategyToSimulation={handleApplyStrategyToSimulation}
      />

      {/* MODAL 9: Combined Profile & System Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          theme={theme}
          onClose={() => setIsSettingsOpen(false)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />
      )}

      {/* MODAL 10: Building Information Modeling & Architectural Specs */}
      <BuildingInfoModal
        theme={theme}
        isOpen={isBuildingInfoOpen}
        onClose={() => setIsBuildingInfoOpen(false)}
        rooms={rooms}
        exits={exits}
        onSelectFloor={(floor) => {
          handleSetFloorView(floor);
          handleSetCameraPreset(`FLOOR_${floor}`);
        }}
      />

      {/* MODAL 10: Emergency Control & Rapid Intervention Dispatch */}
      <EmergencyControlModal
        theme={theme}
        isOpen={isEmergencyControlOpen}
        onClose={() => setIsEmergencyControlOpen(false)}
        sceneManager={sceneManagerRef.current}
        activeScenario={activeScenario}
        isSimulating={isSimulating}
        elapsedSeconds={stats.elapsedSeconds}
      />

      {/* MODAL 11: Live Mobile Evacuee Companion QR Modal */}
      <EvacueeQrModal
        theme={theme}
        isOpen={isEvacueeQrOpen}
        onClose={() => setIsEvacueeQrOpen(false)}
      />

      {/* REAL-TIME DISTRESS NOTIFICATION: Mobile Occupant Trapped SOS Modal */}
      {activeSosAlert && (
        <SosAlertModal
          theme={theme}
          sosData={activeSosAlert}
          onClose={() => setActiveSosAlert(null)}
          onFocusFloor={(floor) => {
            handleSetFloorView(floor);
            handleSetCameraPreset('FLOOR_' + floor);
          }}
        />
      )}

      {/* LOGIN & AUTHENTICATION PORTAL (Matching Image 1) */}
      <LoginModal
        theme={theme}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => setIsLoginOpen(false)}
      />

      {/* KILLER FEATURE 1: Live Interactive Satellite GIS Mini-Map (Free Fire style Top-Right Radar HUD) */}
      {activeTab === 'LIVE_VIEW' && (
        <GisMapDrawer
          theme={theme}
          isOpen={isGisOpen}
          onClose={() => setIsGisOpen(false)}
          emergencyStatus={emergencyStatus}
          onFocusCampusView={() => {
            // When user triggers 3D Focus from the map:
            // 1. Reset facade mode to FULL so the entire building exterior is visible
            handleSetFacadeMode('FULL');
            // 2. Set floor view to ALL so full building geometry is visible
            handleSetFloorView('ALL');
            // 3. Move camera to the wide tactical perspective showing vehicles, entire approach avenue & building
            handleSetCameraPreset('EMERGENCY_ROUTE_VIEW');
          }}
          isMuted={isSirenMuted}
          onToggleMute={handleToggleSirenMute}
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

