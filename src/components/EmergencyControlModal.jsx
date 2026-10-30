// ==============================================================================
// TwinGuard AI - Emergency Control Center & Rapid Intervention Dispatch Modal
// Manages 3 Tactical Units: Fire Extinguisher (Engine 1), Ambulance (Medic 1), Rescue Team (Rescue 1)
// 30-Second Exact Rapid Arrival Timeline to Nearest Ground Exit Gate
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Siren,
  ShieldAlert,
  Truck,
  Timer,
  CheckCircle2,
  Volume2,
  VolumeX,
  Eye,
  Droplets,
  X,
  Activity,
  MapPin,
  AlertTriangle,
  Radio,
  ChevronRight,
  Cross
} from 'lucide-react';

export function EmergencyControlModal({
  isOpen,
  onClose,
  sceneManager,
  activeScenario,
  isSimulating,
  elapsedSeconds
}) {
  const [telemetry, setTelemetry] = useState(null);
  const [isSirenOn, setIsSirenOn] = useState(false);
  const [isSprayOn, setIsSprayOn] = useState(false);

  // Poll real-time telemetry from SceneManager
  useEffect(() => {
    if (!isOpen) return;

    const updateTelemetry = () => {
      if (sceneManager && sceneManager.getEmergencyStatus) {
        const status = sceneManager.getEmergencyStatus();
        setTelemetry(status);
        if (status) {
          setIsSirenOn(status.isSirenActive);
          setIsSprayOn(status.isSprayActive);
        }
      }
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 250);
    return () => clearInterval(interval);
  }, [isOpen, sceneManager]);

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
  const targetGate = telemetry?.targetGate || { id: 'exit_west', name: 'West Gate (Stair Core A)', side: 'west' };

  const handleToggleSiren = () => {
    if (sceneManager && sceneManager.toggleEmergencySiren) {
      const active = sceneManager.toggleEmergencySiren();
      setIsSirenOn(active);
    }
  };

  const handleToggleSpray = () => {
    if (sceneManager && sceneManager.toggleEmergencySpray) {
      const active = sceneManager.toggleEmergencySpray();
      setIsSprayOn(active);
    }
  };

  const handleFocusStaging = () => {
    if (sceneManager && sceneManager.focusEmergencyStaging) {
      sceneManager.focusEmergencyStaging();
      onClose();
    }
  };

  const handleManualDispatch = (gateId = null) => {
    if (sceneManager && sceneManager.dispatchEmergency) {
      sceneManager.dispatchEmergency(gateId);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
        style={{ maxHeight: '92vh', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. TACTICAL HEADER ─── */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Emergency Control & Tactical Dispatch</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                  {isArrived ? 'On Scene' : (telemetry?.isActive ? 'Rapid Dispatch Active' : 'Standby')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Agency Incident Command • 30-Second Guaranteed On-Scene Response
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. MODAL BODY ─── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 30-Second Timeline Countdown Card */}
          <div
            className="p-5 rounded-xl border transition-all"
            style={{
              background: isArrived
                ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                : 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)',
              borderColor: isArrived ? '#86efac' : '#fca5a5'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Timer className={`w-5 h-5 ${isArrived ? 'text-emerald-600' : 'text-red-600 animate-spin'}`} style={{ animationDuration: '3s' }} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    30-Second Rapid Intervention Protocol
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black mt-1 text-slate-900 flex items-center gap-2">
                  {isArrived ? (
                    <span className="text-emerald-600 flex items-center gap-2">
                      <CheckCircle2 className="w-7 h-7 inline" />
                      All 3 Support Units On-Scene
                    </span>
                  ) : (
                    <span className="text-red-600">
                      ETA: {remainingSec.toFixed(1)}s
                      <span className="text-sm font-semibold text-slate-600 ml-2">
                        ({progressPct}% of transit completed)
                      </span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Target Staging Gate:{' '}
                  <strong className="text-slate-900 font-bold">{targetGate.name}</strong> • Nearest Ground Portal to Incident
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFocusStaging}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Staging Gate
                </button>
                <button
                  onClick={handleToggleSiren}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSirenOn
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isSirenOn ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {isSirenOn ? 'Mute Siren' : 'Unmute Siren'}
                </button>
              </div>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isArrived ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Milestone Markers */}
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-2">
                <span className={currentSec >= 0 ? 'text-slate-900 font-bold' : ''}>0s: Dispatch Alarm</span>
                <span className={currentSec >= 10 ? 'text-slate-900 font-bold' : ''}>10s: Campus Perimeter</span>
                <span className={currentSec >= 20 ? 'text-slate-900 font-bold' : ''}>20s: Ring Road Approach</span>
                <span className={currentSec >= 30 ? 'text-emerald-700 font-bold' : ''}>30s: On-Scene Staged</span>
              </div>
            </div>
          </div>

          {/* ─── 3. THE 3 EMERGENCY SUPPORT VEHICLES ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-slate-600" />
                Active Emergency Support Units (3 Vehicles in Convoy)
              </h3>
              <span className="text-[11px] text-slate-400">Deployed within 30s of fire ignition</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* UNIT 1: FIRE EXTINGUISHER ENGINE */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-red-300 transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isArrived ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isArrived ? 'Staged' : 'En Route'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Fire Extinguisher Squad</h4>
                  <div className="text-[11px] font-semibold text-red-600 mb-2">Engine 1 • Tactical Pumper</div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Heavy fire suppression unit with 4,000L Class-A foam/water payload, high-pressure ground monitors, and 50m aerial water tower.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Water / Foam Spray:</span>
                  <button
                    onClick={handleToggleSpray}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                      isSprayOn ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Droplets className="w-3 h-3" />
                    {isSprayOn ? 'Active' : 'Toggle'}
                  </button>
                </div>
              </div>

              {/* UNIT 2: AMBULANCE / EMS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isArrived ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isArrived ? 'Triage Active' : 'En Route'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Ambulance Emergency Support</h4>
                  <div className="text-[11px] font-semibold text-blue-600 mb-2">Medic 1 • Advanced Life Support</div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Mobile trauma & burn intensive care unit. Deploys rapid field triage, oxygen resuscitation, and emergency patient transport.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Capacity:</span>
                  <span className="text-slate-900">4 Stretcher Cots • ALS</span>
                </div>
              </div>

              {/* UNIT 3: RESCUE TEAM */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                      <Radio className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isArrived ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isArrived ? 'Perimeter Set' : 'En Route'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Tactical Rescue Team</h4>
                  <div className="text-[11px] font-semibold text-amber-600 mb-2">Rescue 1 • Search & Incident Command</div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Specialized structural search and extraction squad equipped with thermal cameras, hydraulic spreaders, and high-rise breathing air lines.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Role:</span>
                  <span className="text-slate-900">Incident Command</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 4. NEAREST GROUND GATE DISPATCH SELECTOR ─── */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                Automatic Nearest Ground Exit Gate Staging
              </span>
              <span className="text-[11px] text-slate-500">Hazard-Responsive Staging</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Vehicles automatically divert to the ground gate closest to the fire: West Gate for West wing fires (e.g. L7 West Stair), East Gate for East wing fires, or Front Gate for Main entrance fires.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleManualDispatch('exit_west')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                  targetGate.id === 'exit_west'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">West Gate (Exit A)</div>
                  <div className="text-[10px] text-slate-500">Stair Core A • West Ring</div>
                </div>
                {targetGate.id === 'exit_west' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                onClick={() => handleManualDispatch('exit_east')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                  targetGate.id === 'exit_east'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">East Gate (Exit B)</div>
                  <div className="text-[10px] text-slate-500">Stair Core B • East Ring</div>
                </div>
                {targetGate.id === 'exit_east' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                onClick={() => handleManualDispatch('exit_south')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                  targetGate.id === 'exit_south'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">Front Gate (Exit C)</div>
                  <div className="text-[10px] text-slate-500">South Grand Portico</div>
                </div>
                {targetGate.id === 'exit_south' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── 5. MODAL FOOTER ─── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Rapid Intervention Standard: <strong className="text-slate-800">NFPA 1710 Life Safety Code</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleManualDispatch(targetGate.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center gap-1.5"
            >
              <Timer className="w-3.5 h-3.5" />
              Re-Trigger 30s Dispatch
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

