// ==============================================================================
// TwinGuard AI - Mobile "Evacuee Digital Twin" Companion View
// Responsive, mobile-first personal emergency wayfinding HUD
// Features 3D Single-Floor Personal Perspective Map, Dynamic AI Egress Route,
// Dynamic Indoor Check-In Onboarding, and Real-Time IoT Cloud Headcount Sync
// ==============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Compass,
  MapPin,
  Volume2,
  VolumeX,
  Radio,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Activity,
  Layers,
  Send,
  LifeBuoy,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Bell,
  Navigation,
  Eye,
  ListOrdered,
  Building2,
  DoorOpen,
  Info
} from 'lucide-react';
import { FLOOR_THEMES, ROOM_TEMPLATES } from '../simulation/Doorways';
import { MobileFloor3DMap } from './MobileFloor3DMap';
import { EvacueeCheckInModal } from './EvacueeCheckInModal';

export function EvacueeCompanionView() {
  // Indoor Check-In Onboarding State
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(true);

  // Selected User Physical Location
  const [floor, setFloor] = useState(4);
  const [roomId, setRoomId] = useState('f4_r1');
  const [roomName, setRoomName] = useState('Room 401 - Neural Computing Lab 01');
  const [occupantStatus, setOccupantStatus] = useState('STANDBY'); // 'STANDBY' | 'EVACUATING' | 'REROUTED' | 'SOS_ACTIVE' | 'SAFE_MUSTER'

  // Navigation Mode: 3D Visual Map vs Manual Checklist
  const [navigationMode, setNavigationMode] = useState('3D_MAP'); // '3D_MAP' | 'MANUAL_STEPS'

  // Incident & Hazard Telemetry
  const [connected, setConnected] = useState(false);
  const [activeFires, setActiveFires] = useState([]);
  const [blockedStairs, setBlockedStairs] = useState({ coreA: false, coreB: false });
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [sosSentTime, setSosSentTime] = useState(null);
  const [safeConfirmed, setSafeConfirmed] = useState(false);
  const [verifiedHeadcount, setVerifiedHeadcount] = useState(null);

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Synthesize Web Audio Emergency Alert Beep / Chime
  const playAlertChime = () => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Tone 1: 880 Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: 587.33 Hz (D5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(587.33, now + 0.16);
      gain2.gain.setValueAtTime(0.28, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.6);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Trigger Hardware Vibration if available on mobile
  const triggerHaptic = (pattern = [200, 100, 200, 100, 300]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Connect to backend Socket.IO
  useEffect(() => {
    const socketHost = window.location.hostname || 'localhost';
    const isCustomPort = window.location.port === '5173';
    
    // Primary URL: Vite proxy through origin or direct port 5000
    const primaryUrl = isCustomPort ? window.location.origin : `http://${socketHost}:5000`;
    
    const socket = io(primaryUrl, {
      transports: ['websocket', 'polling'],
      timeout: 3000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for fire detected in building
    socket.on('fire-detected', (data) => {
      setActiveFires((prev) => {
        if (!prev.some((f) => f.roomId === data.roomId)) {
          return [...prev, data];
        }
        return prev;
      });
      setIsAlarmActive(true);
      playAlertChime();
      triggerHaptic();

      // If fire is on user's floor, mark rerouted or evacuating
      if (data.floor === floor || data.roomId === roomId) {
        setOccupantStatus((prev) => (prev === 'SAFE_MUSTER' || prev === 'SOS_ACTIVE' ? prev : 'REROUTED'));
      } else {
        setOccupantStatus((prev) => (prev === 'SAFE_MUSTER' || prev === 'SOS_ACTIVE' ? prev : 'EVACUATING'));
      }
    });

    // Listen for evacuation started
    socket.on('evacuation-started', () => {
      setIsAlarmActive(true);
      playAlertChime();
      triggerHaptic();
      setOccupantStatus((prev) => (prev === 'SAFE_MUSTER' || prev === 'SOS_ACTIVE' ? prev : 'EVACUATING'));
    });

    // Listen for stairwell blockage
    socket.on('stairwell-blocked', (data) => {
      if (data.core === 'coreA' || data.core === 'exit_west') {
        setBlockedStairs((prev) => ({ ...prev, coreA: true }));
      } else if (data.core === 'coreB' || data.core === 'exit_east') {
        setBlockedStairs((prev) => ({ ...prev, coreB: true }));
      }
      playAlertChime();
      triggerHaptic();
      setOccupantStatus((prev) => (prev === 'SAFE_MUSTER' || prev === 'SOS_ACTIVE' ? prev : 'REROUTED'));
    });

    // Listen for global simulation reset
    socket.on('simulation-reset', () => {
      setActiveFires([]);
      setBlockedStairs({ coreA: false, coreB: false });
      setIsAlarmActive(false);
      setOccupantStatus('STANDBY');
      setCurrentStepIdx(0);
      setSafeConfirmed(false);
      setSosSentTime(null);
      setVerifiedHeadcount(null);
    });

    // Listen for safe confirmation feedback from Command Center
    socket.on('evacuee-safe-confirmed', (data) => {
      if (data && data.roomId === roomId) {
        setSafeConfirmed(true);
        if (data.evacuatedCount) {
          setVerifiedHeadcount(data.evacuatedCount);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [floor, roomId, isSoundMuted]);

  // Derived hazard analysis for this occupant
  const isFloorCompromised = useMemo(() => {
    return activeFires.some((f) => f.floor === floor);
  }, [activeFires, floor]);

  const isWestStairCompromised = useMemo(() => {
    if (blockedStairs.coreA) return true;
    return activeFires.some((f) => {
      return f.floor === floor && (f.roomId.endsWith('_r1') || f.roomId.endsWith('_r6'));
    });
  }, [blockedStairs, activeFires, floor]);

  const isEastStairCompromised = useMemo(() => {
    if (blockedStairs.coreB) return true;
    return activeFires.some((f) => {
      return f.floor === floor && (f.roomId.endsWith('_r5') || f.roomId.endsWith('_r10'));
    });
  }, [blockedStairs, activeFires, floor]);

  // Dynamic route generation
  const routeGuidance = useMemo(() => {
    const isGround = floor === 1;
    let targetStair = 'Stairwell Core A (West Wing)';
    let targetStairCode = 'CORE_A';
    let targetGate = 'West Egress Portal (Exit A)';
    let distanceEst = '24m';
    let timeEst = '20s';
    let warning = null;

    if (isWestStairCompromised && !isEastStairCompromised) {
      targetStair = 'East Stairwell Core B (East Wing)';
      targetStairCode = 'CORE_B';
      targetGate = 'East Egress Portal (Exit B)';
      distanceEst = '42m';
      timeEst = '36s';
      warning = 'Stairwell Core A Compromised by Smoke • Diverting you to East Core B';
    } else if (isEastStairCompromised && !isWestStairCompromised) {
      targetStair = 'West Stairwell Core A (West Wing)';
      targetStairCode = 'CORE_A';
      targetGate = 'West Egress Portal (Exit A)';
      distanceEst = '28m';
      timeEst = '24s';
      warning = 'Stairwell Core B Compromised by Smoke • Diverting you to West Core A';
    }

    const steps = isGround
      ? [
          { text: `Exit ${roomName} through primary doorway into Central Gallery`, detail: 'Check corridor for clear visibility before stepping out' },
          { text: `Turn toward ${targetGate}`, detail: 'Follow overhead high-illumination green exit indicators' },
          { text: `Pass through security turnstiles & portal doors`, detail: 'Turnstiles automatically released by fire command override' },
          { text: 'Assemble at Exterior Muster Zone Alpha (South Lawn)', detail: 'Check in with Emergency Safety Warden' }
        ]
      : [
          { text: `Exit ${roomName} into Floor ${floor} Central Corridor`, detail: 'Stay low if light smoke haze is visible' },
          { text: `Navigate ${targetStairCode === 'CORE_B' ? 'East' : 'West'} along main corridor`, detail: 'Follow dynamic smart floor LED strip lighting' },
          { text: `Enter ${targetStair} Fire Barrier Door`, detail: 'Heavy fire-rated door with active positive pressure air curtain' },
          { text: `Descend switchback stairs to Ground Floor Level 1`, detail: 'Maintain single-file descent; hold inside handrail firmly' },
          { text: `Exit via ${targetGate} into Outdoor Safety Plaza`, detail: 'Proceed 40m clear of building perimeter to Muster Zone' }
        ];

    return {
      targetStair,
      targetStairCode,
      targetGate,
      distanceEst,
      timeEst,
      warning,
      steps
    };
  }, [floor, roomName, isWestStairCompromised, isEastStairCompromised]);

  // Handle Mark Safe Button
  const handleMarkSafe = () => {
    setOccupantStatus('SAFE_MUSTER');
    setSafeConfirmed(true);
    triggerHaptic([100, 50, 100]);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('evacuee-marked-safe', {
        userId: `occupant_${floor}_${roomId}`,
        roomId,
        roomName,
        floor,
        timestamp: Date.now()
      });
    }
  };

  // Handle SOS Button
  const handleTriggerSos = () => {
    setOccupantStatus('SOS_ACTIVE');
    setSosSentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    triggerHaptic([300, 100, 300, 100, 500]);
    playAlertChime();

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('evacuee-sos', {
        userId: `occupant_${floor}_${roomId}`,
        userName: 'Evacuee Companion User',
        roomId,
        roomName,
        floor,
        timestamp: Date.now()
      });
    }
  };

  // Handle Check-In Confirmation from Modal
  const handleConfirmLocation = (loc) => {
    setFloor(loc.floor);
    setRoomId(loc.roomId);
    setRoomName(loc.roomName);
    setHasCheckedIn(true);
    setIsCheckInOpen(false);
  };

  const floorTheme = FLOOR_THEMES[floor] || { name: 'Commercial Tower', prefix: `L${floor}` };

  return (
    <div
      className="h-screen max-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden selection:bg-indigo-500 selection:text-white"
      style={{
        background: 'linear-gradient(180deg, #090d16 0%, #0d1527 50%, #080c14 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* ── ONBOARDING CHECK-IN MODAL (REQUIREMENT 1) ── */}
      <EvacueeCheckInModal
        isOpen={isCheckInOpen}
        initialFloor={floor}
        initialRoomId={roomId}
        onConfirm={handleConfirmLocation}
        onClose={hasCheckedIn ? () => setIsCheckInOpen(false) : null}
      />

      {/* ── TOP TACTICAL TELEMETRY HEADER ── */}
      <header className="shrink-0 z-30 px-4 py-3 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-black tracking-tight text-white">TWINGUARD</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MOBILE EVACUEE
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{connected ? 'Live IoT Cloud Sync' : 'Standalone Mode'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundMuted((prev) => !prev)}
              className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-transform cursor-pointer"
              title={isSoundMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* Check-In / Change Location Button */}
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-[11px] font-bold text-indigo-200 flex items-center gap-1 active:scale-95 transition-transform cursor-pointer shadow-sm"
              title="Change Floor & Room Location"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>L{floor}</span>
              <ChevronDown className="w-3 h-3 text-indigo-300" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA (SMOOTH MOBILE SCROLLABLE CONTAINER) ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-36 max-w-md mx-auto w-full space-y-3.5">
        {/* Occupant Identity & Status Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />
              Personal Egress Identity
            </span>
            {/* Status Pill */}
            {occupantStatus === 'STANDBY' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                🟢 In Room • Standby
              </span>
            )}
            {occupantStatus === 'EVACUATING' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                🚨 Evacuation Order
              </span>
            )}
            {occupantStatus === 'REROUTED' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                ⚠️ Dynamic Reroute
              </span>
            )}
            {occupantStatus === 'SOS_ACTIVE' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white font-black border border-red-400 animate-ping">
                🚨 SOS Transmitted
              </span>
            )}
            {occupantStatus === 'SAFE_MUSTER' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500 text-slate-950 font-black border border-green-300">
                ✅ Safe at Muster Point
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-black text-white leading-tight">
              Level {floor} • {roomName}
            </h2>
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold ml-2 shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Division: {floorTheme.name} • 1 of 190 Registered Occupants
          </p>
        </div>

        {/* ── FLOOR OVERVIEW & EXITS READINESS CARD (REQUIREMENT 2) ── */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Building2 className="w-3.5 h-3.5" />
              Floor {floor} Architecture & Exits Overview:
            </span>
            <span className="text-[10px] font-mono text-emerald-400">2 Cores Active</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* West Stair Core A */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                isWestStairCompromised
                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                <span>West Wing:</span>
                {isWestStairCompromised ? (
                  <span className="text-red-400 font-black">COMPROMISED</span>
                ) : (
                  <span className="text-emerald-400 font-bold">OPERATIONAL</span>
                )}
              </div>
              <div className="font-black text-white mt-0.5 text-xs">Stairwell Core A</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Distance: ~24m from your room</div>
            </div>

            {/* East Stair Core B */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                isEastStairCompromised
                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                <span>East Wing:</span>
                {isEastStairCompromised ? (
                  <span className="text-red-400 font-black">COMPROMISED</span>
                ) : (
                  <span className="text-emerald-400 font-bold">OPERATIONAL</span>
                )}
              </div>
              <div className="font-black text-white mt-0.5 text-xs">Stairwell Core B</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Distance: ~42m from your room</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>🚪 10 Fire Barrier Doors</span>
            <span>🧯 2 Water/CO2 Hose Reels</span>
            <span className="text-indigo-400 font-medium">Ground Exit: {floor === 1 ? 'Direct Plaza' : `-${floor - 1} Flrs`}</span>
          </div>
        </div>

        {/* ── CRITICAL AI REROUTE / HAZARD BANNER (REQUIREMENTS 3 & 4) ── */}
        {(isFloorCompromised || routeGuidance.warning || occupantStatus === 'REROUTED' || occupantStatus === 'EVACUATING') && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-950/90 border border-red-500/60 shadow-xl shadow-red-950/40 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-red-300 mb-1">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-wide">
                AI Incident Command Directive
              </span>
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              {routeGuidance.warning ||
                (isFloorCompromised
                  ? `Active Hazard Detected on Level ${floor}. Initiate orderly evacuation immediately.`
                  : `Building-Wide Evacuation Order in Effect. Proceed to designated escape stairwell.`)}
            </p>
            <div className="mt-2 text-[10px] text-red-200 font-medium flex items-center gap-3">
              <span>Smoke Barriers: Deployed</span>
              <span>•</span>
              <span>HVAC Exhaust: 100% Boost</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Recommended: {routeGuidance.targetStairCode}</span>
            </div>
          </div>
        )}

        {/* ── NAVIGATION MODE SELECTOR TABS (REQUIREMENT 5) ── */}
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 shadow-inner">
          <button
            onClick={() => setNavigationMode('3D_MAP')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              navigationMode === '3D_MAP'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>3D Visual Map (POV)</span>
          </button>

          <button
            onClick={() => setNavigationMode('MANUAL_STEPS')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              navigationMode === 'MANUAL_STEPS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Step Directives</span>
          </button>
        </div>

        {/* ── VIEW OPTION A: 3D VISUAL MAP (REQUIREMENTS 6, 7 & 8) ── */}
        {navigationMode === '3D_MAP' && (
          <div className="space-y-3">
            <MobileFloor3DMap
              floor={floor}
              roomId={roomId}
              roomName={roomName}
              activeFires={activeFires}
              targetStairCode={routeGuidance.targetStairCode}
              isAlarmActive={isAlarmActive}
              onArriveMuster={handleMarkSafe}
            />

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">AI Dynamic Egress Route</span>
              </div>
              <div className="text-[11px] text-slate-400">
                ETA: <strong className="text-emerald-400">{routeGuidance.timeEst}</strong> ({routeGuidance.distanceEst})
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW OPTION B: MANUAL STEP READING CHECKLIST ── */}
        {navigationMode === 'MANUAL_STEPS' && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold tracking-wider uppercase flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                AI Recommended Waypoint
              </span>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                <span>{routeGuidance.distanceEst}</span>
                <span>•</span>
                <span className="text-emerald-400">ETA {routeGuidance.timeEst}</span>
              </div>
            </div>

            <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>{routeGuidance.targetStair}</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium mb-3">
              Target Ground Exit: <strong className="text-white">{routeGuidance.targetGate}</strong>
            </p>

            {/* Turn-by-Turn Wayfinding Checklist */}
            <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Turn-by-Turn Escape Sequence:
              </div>
              {routeGuidance.steps.map((step, idx) => {
                const isDone = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentStepIdx(idx + 1)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                        : isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                          ? 'bg-indigo-500 text-white animate-pulse'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold leading-tight ${isCurrent ? 'text-indigo-200' : ''}`}>
                        {step.text}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {step.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SOS / ASSISTANCE ACTIVE CARD ── */}
        {occupantStatus === 'SOS_ACTIVE' && (
          <div className="p-4 rounded-2xl bg-red-950 border-2 border-red-500 text-white shadow-2xl animate-pulse">
            <div className="flex items-center gap-2 mb-1.5">
              <PhoneCall className="w-5 h-5 text-red-400" />
              <h4 className="text-sm font-black uppercase tracking-wide text-white">
                Distress Beacon Broadcasting
              </h4>
            </div>
            <p className="text-xs text-red-200 font-medium">
              Emergency SOS dispatched at {sosSentTime}. Incident Command Center has pinned your position at <strong>Level {floor} ({roomName})</strong>. Tactical Rescue Squad dispatched.
            </p>
            <div className="mt-3 text-center">
              <span className="text-[10px] font-mono text-red-300">
                DO NOT LEAVE SECURE AREA • STAY NEAR EXTERIOR WALL
              </span>
            </div>
          </div>
        )}

        {/* ── SAFE CONFIRMATION CARD (REQUIREMENT 8) ── */}
        {safeConfirmed && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/70 text-white shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-black uppercase tracking-wide text-emerald-200">
                Verified at Safe Muster Zone Alpha
              </h4>
            </div>
            <p className="text-xs text-emerald-300/90 font-medium">
              Your headcount has been verified and registered in the Incident Command Center.
              {verifiedHeadcount && (
                <strong className="block mt-1 text-white">
                  Safe Evacuee #{verifiedHeadcount} of 190 total occupants registered.
                </strong>
              )}
            </p>
          </div>
        )}
      </main>

      {/* ── BOTTOM INTERACTIVE COMMAND ACTIONS ── */}
      <footer className="shrink-0 z-30 p-3.5 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md max-w-md mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Mark Safe (Increments headcount in Command Center) */}
          <button
            onClick={handleMarkSafe}
            disabled={occupantStatus === 'SAFE_MUSTER'}
            className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              occupantStatus === 'SAFE_MUSTER'
                ? 'bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-600/30 border border-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{occupantStatus === 'SAFE_MUSTER' ? 'Safe at Muster' : 'I Am Safe'}</span>
          </button>

          {/* Action 2: SOS / Trapped */}
          <button
            onClick={handleTriggerSos}
            disabled={occupantStatus === 'SOS_ACTIVE'}
            className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              occupantStatus === 'SOS_ACTIVE'
                ? 'bg-red-900/50 border border-red-700 text-red-300 cursor-default'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 border border-red-400'
            }`}
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            <span>{occupantStatus === 'SOS_ACTIVE' ? 'SOS Sent' : 'SOS / Trapped'}</span>
          </button>
        </div>

        {/* Presentation Simulation Helper Bar */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
            Beacon ID: TWG-MOB-{floor}-{roomId.slice(-2)}
          </span>
          <button
            onClick={() => {
              playAlertChime();
              triggerHaptic();
            }}
            className="text-slate-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
          >
            Test Chime & Haptic
          </button>
        </div>
      </footer>
    </div>
  );
}
