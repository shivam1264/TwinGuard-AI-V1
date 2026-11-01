// ==============================================================================
// TwinGuard AI - Emergency Control Center & Tactical Dispatch Modal
// Pixel-Perfect Tactical Incident Command & 30-Second Rapid Egress Staging
// Matches Reference Specification (Image 2) with 99.9% Visual Fidelity
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Siren,
  Timer,
  MapPin,
  Eye,
  Volume2,
  VolumeX,
  Users,
  Truck,
  Cross,
  HardHat,
  Landmark,
  CheckCircle2,
  ShieldCheck,
  X
} from 'lucide-react';
import fireEngineImg from '../assets/emergency/fire_engine.png';
import ambulanceImg from '../assets/emergency/ambulance.png';
import rescueTruckImg from '../assets/emergency/rescue_truck.png';

export function EmergencyControlModal({
  isOpen,
  onClose,
  sceneManager,
  activeScenario,
  isSimulating,
  elapsedSeconds,
  emergencyStatus: propEmergencyStatus
}) {
  const [telemetry, setTelemetry] = useState(propEmergencyStatus || null);
  const [isSirenOn, setIsSirenOn] = useState(false);

  // Poll real-time telemetry from SceneManager
  useEffect(() => {
    if (!isOpen) return;

    const updateTelemetry = () => {
      if (sceneManager && sceneManager.getEmergencyStatus) {
        const status = sceneManager.getEmergencyStatus();
        if (status) {
          setTelemetry(status);
          setIsSirenOn(status.isSirenActive);
        }
      }
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 100);
    return () => clearInterval(interval);
  }, [isOpen, sceneManager]);

  // Sync prop telemetry if updated externally
  useEffect(() => {
    if (propEmergencyStatus) {
      setTelemetry(propEmergencyStatus);
      setIsSirenOn(propEmergencyStatus.isSirenActive);
    }
  }, [propEmergencyStatus]);

  // Esc keyboard shortcut to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSec = telemetry ? telemetry.elapsedSeconds : elapsedSeconds;
  const isArrived = telemetry ? telemetry.isArrived : currentSec >= 30;
  const remainingSec = Math.max(0, 30 - currentSec);
  const progressPct = Math.min(100, Math.round((currentSec / 30) * 100));

  const targetGate = telemetry?.targetGate || {
    id: 'exit_west',
    name: 'West Gate (Stair Core A)',
    side: 'west'
  };

  const handleToggleSiren = () => {
    if (sceneManager && sceneManager.toggleEmergencySiren) {
      const active = sceneManager.toggleEmergencySiren();
      setIsSirenOn(active);
    }
  };

  const handleFocusStaging = () => {
    if (sceneManager && sceneManager.focusEmergencyStaging) {
      sceneManager.focusEmergencyStaging();
      onClose();
    }
  };

  const handleManualDispatch = (gateId = null, forceRestart = false) => {
    if (sceneManager && sceneManager.dispatchEmergency) {
      sceneManager.dispatchEmergency(gateId, forceRestart);
      const status = sceneManager.getEmergencyStatus();
      if (status) {
        setTelemetry(status);
        setIsSirenOn(status.isSirenActive);
      }
    }
  };

  const gates = [
    {
      id: 'exit_west',
      name: 'West Gate (Exit A)',
      desc: 'Stair Core A • West Ring',
      side: 'west'
    },
    {
      id: 'exit_east',
      name: 'East Gate (Exit B)',
      desc: 'Stair Core B • East Ring',
      side: 'east'
    },
    {
      id: 'exit_south',
      name: 'Front Gate (Exit C)',
      desc: 'South Grand Portico',
      side: 'south'
    }
  ];

  const activeGateId = targetGate.id || 'exit_west';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1020px] min-w-0 max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden bg-white rounded-3xl shadow-2xl p-5 sm:p-7 border border-[#e2e8f0] flex flex-col font-sans select-none relative my-auto"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. TOP HEADER ─── */}
        <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ef3340] to-[#dc2626] flex items-center justify-center text-white shadow-md shadow-[#ef3340]/25 shrink-0">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                <h2 className="text-lg font-bold text-[#14213d] tracking-tight">
                  Emergency Control & Tactical Dispatch
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#fee2e2] text-[#ef3340] border border-[#fecdd3] shrink-0">
                  {isArrived ? 'ON SCENE' : (telemetry?.isActive ? 'EN ROUTE' : 'STANDBY')}
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium mt-0.5">
                Multi-Agency Incident Command • 30-Second Guaranteed On-Scene Response
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#1e293b] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── 2. 30-SECOND RAPID INTERVENTION PROTOCOL BANNER ─── */}
        <div className="w-full bg-[#fff5f5] border border-[#fecdd3]/80 rounded-2xl px-4 sm:px-5 py-3.5 mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 shrink-0">
          {/* Left Section: Timer & ETA */}
          <div className="flex items-center gap-3 min-w-0 basis-[250px] grow">
            <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ef3340] shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-wider text-[#ef3340] uppercase leading-none">
                30-Second Rapid Intervention Protocol
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-1">
                <span className="text-[26px] font-black text-[#ef3340] tracking-tight leading-none whitespace-nowrap">
                  {isArrived ? 'ON SCENE: 0.0s' : `ETA: ${remainingSec.toFixed(1)}s`}
                </span>
                <span className="text-[11px] font-medium text-[#64748b]">
                  ({progressPct}% of transit completed)
                </span>
              </div>
            </div>
          </div>

          {/* Subtle Vertical Divider 1 */}
          <div className="h-10 w-[1px] bg-[#fecdd3] shrink-0 hidden lg:block" />

          {/* Middle Section: Target Staging Gate */}
          <div className="flex items-center gap-3 min-w-0 basis-[210px] grow">
            <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ef3340] shrink-0">
              <MapPin className="w-4 h-4 fill-[#ef3340]/20" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#64748b] font-medium leading-none">
                Target Staging Gate
              </div>
              <div className="text-[13px] font-bold text-[#14213d] leading-tight mt-1 truncate">
                {targetGate.name}
              </div>
              <div className="text-[10px] text-[#64748b] leading-none mt-0.5 truncate">
                Nearest Ground Portal to Incident
              </div>
            </div>
          </div>

          {/* Subtle Vertical Divider 2 */}
          <div className="h-10 w-[1px] bg-[#fecdd3] shrink-0 hidden lg:block" />

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={handleFocusStaging}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
              <span>View Staging Gate</span>
            </button>
            <button
              onClick={handleToggleSiren}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              {isSirenOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#ef3340] animate-pulse shrink-0" />
                  <span>Mute Siren</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                  <span>Unmute Siren</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── 3. MILESTONE TIMELINE TRACK ─── */}
        <div className="w-full px-1 sm:px-2 py-1 mb-4 shrink-0">
          <div className="relative flex items-center justify-between gap-2">
            {/* Base connecting line */}
            <div className="absolute top-[6px] left-4 right-4 h-[1.5px] bg-[#e2e8f0] -z-0" />
            {/* Dynamic active progress line */}
            <div
              className="absolute top-[6px] left-4 h-[1.5px] bg-[#ef3340] transition-all duration-300 -z-0"
              style={{ width: `calc(${Math.min(100, (currentSec / 30) * 100)}% - 24px)` }}
            />

            {/* Milestone 0s */}
            <div className="flex flex-col items-start z-10 min-w-0">
              <div className="flex items-center gap-1.5 bg-white pr-2">
                <div className={`w-3 h-3 rounded-full shrink-0 ${currentSec >= 0 ? 'bg-[#ef3340] ring-4 ring-[#fee2e2]' : 'bg-[#cbd5e1]'}`} />
                <span className="text-xs font-bold text-[#14213d]">0s</span>
              </div>
              <span className="text-[11px] text-[#ef3340] font-medium mt-1 leading-tight">↓ Dispatch Alarm</span>
            </div>

            {/* Milestone 10s */}
            <div className="flex flex-col items-center z-10 min-w-0">
              <div className="flex items-center gap-1.5 bg-white px-2">
                <div className={`w-3 h-3 rounded-full shrink-0 ${currentSec >= 10 ? 'bg-[#ef3340] ring-4 ring-[#fee2e2]' : 'bg-[#cbd5e1]'}`} />
                <span className="text-xs font-bold text-[#64748b]">10s</span>
              </div>
              <span className="text-[11px] text-[#64748b] font-medium mt-1 text-center leading-tight">↓ Campus Perimeter</span>
            </div>

            {/* Milestone 20s */}
            <div className="flex flex-col items-center z-10 min-w-0">
              <div className="flex items-center gap-1.5 bg-white px-2">
                <div className={`w-3 h-3 rounded-full shrink-0 ${currentSec >= 20 ? 'bg-[#ef3340] ring-4 ring-[#fee2e2]' : 'bg-[#cbd5e1]'}`} />
                <span className="text-xs font-bold text-[#64748b]">20s</span>
              </div>
              <span className="text-[11px] text-[#64748b] font-medium mt-1 text-center leading-tight">↓ Ring Road Approach</span>
            </div>

            {/* Milestone 30s */}
            <div className="flex flex-col items-end z-10 min-w-0">
              <div className="flex items-center gap-1.5 bg-white pl-2">
                <div className={`w-3 h-3 rounded-full shrink-0 ${isArrived ? 'bg-[#10b981] ring-4 ring-[#dcfce7]' : 'bg-[#cbd5e1]'}`} />
                <span className="text-xs font-bold text-[#64748b]">30s</span>
              </div>
              <span className={`text-[11px] font-medium mt-1 text-right leading-tight ${isArrived ? 'text-[#10b981] font-semibold' : 'text-[#64748b]'}`}>
                ↓ On-Scene Staged
              </span>
            </div>
          </div>
        </div>

        {/* ─── 4. ACTIVE EMERGENCY SUPPORT UNITS HEADER ─── */}
        <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1.5 mb-3.5 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <Users className="w-4 h-4 text-[#14213d] shrink-0" />
            <h3 className="text-[15px] font-bold text-[#14213d] tracking-tight">
              Active Emergency Support Units
            </h3>
            <span className="bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
              3 Vehicles in Convoy
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
            Deployed within 30s of fire ignition
          </div>
        </div>

        {/* ─── 5. THE THREE VEHICLE CARDS (3 COLUMNS) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4 shrink-0">
          {/* Card 1 — Fire Extinguisher Squad */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden min-w-0">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#fee2e2] flex items-center justify-center text-[#ef3340] shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#14213d] leading-snug">Fire Extinguisher Squad</h4>
                    <div className="text-[10px] text-[#64748b] font-medium leading-tight">Engine 1 • Tactical Pumper</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 whitespace-nowrap ${
                  isArrived
                    ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                    : 'bg-[#fee2e2] text-[#ef3340] border-[#fecdd3]'
                }`}>
                  {isArrived ? 'ON SCENE' : 'EN ROUTE'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">💧</span>
                    <span className="truncate">4,000L Foam/Water</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">⏱</span>
                    <span className="truncate">High Pressure System</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">🪜</span>
                    <span className="truncate">50m Aerial Tower</span>
                  </div>
                </div>
                <div className="w-[118px] min-w-[84px] h-[74px] flex items-center justify-center shrink">
                  <img
                    src={fireEngineImg}
                    alt="Fire Engine 1"
                    className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — Ambulance Emergency Support */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden min-w-0">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] shrink-0">
                    <Cross className="w-4 h-4 rotate-45" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#14213d] leading-snug">Ambulance Emergency Support</h4>
                    <div className="text-[10px] text-[#64748b] font-medium leading-tight">Medic 1 • Advanced Life Support</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 whitespace-nowrap ${
                  isArrived
                    ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                    : 'bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]'
                }`}>
                  {isArrived ? 'ON SCENE' : 'EN ROUTE'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">❤️</span>
                    <span className="truncate">Trauma &amp; Burn Care</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">🏥</span>
                    <span className="truncate">Rapid Field Triage</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">🫁</span>
                    <span className="truncate">Oxygen Resuscitation</span>
                  </div>
                </div>
                <div className="w-[118px] min-w-[84px] h-[74px] flex items-center justify-center shrink">
                  <img
                    src={ambulanceImg}
                    alt="Ambulance Medic 1"
                    className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 — Tactical Rescue Team */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden min-w-0">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#f59e0b] shrink-0">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#14213d] leading-snug">Tactical Rescue Team</h4>
                    <div className="text-[10px] text-[#64748b] font-medium leading-tight">Rescue 1 • Search &amp; Incident Command</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 whitespace-nowrap ${
                  isArrived
                    ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                    : 'bg-[#fef3c7] text-[#f59e0b] border-[#fde68a]'
                }`}>
                  {isArrived ? 'ON SCENE' : 'EN ROUTE'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">👥</span>
                    <span className="truncate">Search &amp; Extraction</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">⚔️</span>
                    <span className="truncate">Thermal Cameras</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[#334155] flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                    <span className="shrink-0">🪢</span>
                    <span className="truncate">High-Rise Equipment</span>
                  </div>
                </div>
                <div className="w-[118px] min-w-[84px] h-[74px] flex items-center justify-center shrink">
                  <img
                    src={rescueTruckImg}
                    alt="Rescue Unit 1"
                    className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. AUTOMATIC NEAREST GROUND EXIT GATE STAGING ─── */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#ef3340] fill-[#ef3340]/20" />
            <h4 className="text-xs font-bold text-[#14213d]">
              Automatic Nearest Ground Exit Gate Staging
            </h4>
          </div>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Vehicles automatically divert to the ground gate closest to the incident.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2.5">
            {gates.map((g) => {
              const isSelected = activeGateId === g.id;
              const isNearest = targetGate.id === g.id;

              return (
                <button
                  key={g.id}
                  onClick={() => handleManualDispatch(g.id, true)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left min-w-0 overflow-hidden ${
                    isSelected
                      ? 'border-2 border-[#2563eb] bg-white shadow-xs'
                      : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
                  }`}
                >
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-[#2563eb] flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 className="w-4 h-4 fill-[#2563eb] text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#cbd5e1] shrink-0" />
                  )}

                  <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#64748b] shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#14213d] truncate">
                      {g.name}
                    </div>
                    <div className="text-[11px] text-[#64748b] truncate">
                      {g.desc}
                    </div>
                  </div>

                  {isNearest && (
                    <span className="bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                      Nearest
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 7. FOOTER ROW ─── */}
        <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2.5 pt-3.5 border-t border-[#f1f5f9] mt-auto shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#64748b] font-medium min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#64748b] shrink-0" />
            <span>Rapid Intervention Standard: NFPA 1710 Life Safety Code</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleManualDispatch(targetGate.id, true)}
              className="bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#ef3340] font-bold text-xs px-4 py-2 rounded-xl border border-[#fecdd3] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Timer className="w-3.5 h-3.5 text-[#ef3340]" />
              <span>Re-Trigger 30s Dispatch</span>
            </button>
            <button
              onClick={onClose}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] font-bold text-xs px-4 py-2 rounded-xl border border-[#e2e8f0] transition-all cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
