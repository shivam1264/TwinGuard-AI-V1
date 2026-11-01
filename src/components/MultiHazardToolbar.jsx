// ==============================================================================
// TwinGuard AI — Multi-Hazard Control (Interactive Multi-Hazard Matrix)
// Tactical panel for granular multi-hazard control:
// Fire Plume · Localized Power Outage · Localized HVAC Failure · 3D Structural Collapse
//
// Strictly encapsulated within EmergencyCommandCenterPage.
// Supports granular scope selection: Specific Room | Entire Floor | Corridor | Stairwell | Exit.
// ==============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Flame, Zap, Wind, BrickWall, Crosshair, X, Eye, ChevronDown } from 'lucide-react';
import { AIEngine } from '../ai';

const HAZARD_DEFS = [
  {
    key: 'fire',
    label: 'FIRE PLUME',
    icon: Flame,
    tint: '#ef4444',
    hint: 'Ignites / suppresses fire & toxic smoke at the selected location.'
  },
  {
    key: 'powerGridFailure',
    label: 'POWER OUTAGE',
    icon: Zap,
    tint: '#f59e0b',
    hint: 'Cuts power in the selected zone: zone goes dark, red emergency backup LEDs activate.'
  },
  {
    key: 'hvacPressurizationFailure',
    label: 'HVAC FAILURE',
    icon: Wind,
    tint: '#a855f7',
    hint: 'Exhaust fans offline in selected zone: smoke accelerates 2.2x, exposure increases.'
  },
  {
    key: 'structuralCollapse',
    label: 'STRUCTURAL COLLAPSE',
    icon: BrickWall,
    tint: '#f97316',
    hint: 'Physical 3D concrete rubble collapse: severs route and forces live crowd rerouting.'
  }
];

const EMPTY_HAZARDS = {
  fire: false,
  powerGridFailure: false,
  hvacPressurizationFailure: false,
  structuralCollapse: false
};

const ROOM_NAMES = [
  { suffix: 'r1', name: '01 Executive Suite' },
  { suffix: 'r2', name: '02 Open Workspace A' },
  { suffix: 'r3', name: '03 Conference Alpha' },
  { suffix: 'r4', name: '04 Meeting Room' },
  { suffix: 'r5', name: '05 Server / Tech Hub' },
  { suffix: 'r6', name: '06 Operations Deck' },
  { suffix: 'r7', name: '07 Open Workspace B' },
  { suffix: 'r8', name: '08 Boardroom Bravo' },
  { suffix: 'r9', name: '09 Executive Lounge' },
  { suffix: 'r10', name: '10 Research Lab' }
];

export const MultiHazardToolbar = ({ sceneManager = null, onIncident = null, targetLocation = null, className = '' }) => {
  const [hazards, setHazards] = useState(() => {
    try {
      if (AIEngine && AIEngine.getHazardState) return AIEngine.getHazardState();
    } catch (err) { /* engine not ready */ }
    return { ...EMPTY_HAZARDS };
  });

  // Granular Scope Selection State
  const [scopeCategory, setScopeCategory] = useState('ROOM'); // 'ROOM' | 'FLOOR' | 'CORRIDOR' | 'STAIR' | 'EXIT'
  const [scopeFloor, setScopeFloor] = useState(4);
  const [selectedEntityId, setSelectedEntityId] = useState('f4_r2');

  const [pendingKey, setPendingKey] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [live, setLive] = useState({ evacStatus: 'STANDBY', blockedCorridors: 0, rerouted: 0 });

  const toastTimers = useRef(new Map());
  const onIncidentRef = useRef(onIncident);
  onIncidentRef.current = onIncident;

  const pushToast = useCallback((message, tone = 'ok') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 3000);
    toastTimers.current.set(id, timer);
  }, []);

  // Sync if parent passes targetLocation (e.g. from 3D room click)
  useEffect(() => {
    if (targetLocation && targetLocation.id) {
      if (targetLocation.category) setScopeCategory(targetLocation.category);
      if (targetLocation.floor) setScopeFloor(Number(targetLocation.floor));
      setSelectedEntityId(targetLocation.id);
    }
  }, [targetLocation]);

  useEffect(() => {
    if (!AIEngine || !AIEngine.onHazardChange) return undefined;
    const unsub = AIEngine.onHazardChange((state, evt) => {
      setHazards(state);
      if (evt) {
        setLastEvent(evt);
        const def = HAZARD_DEFS.find((d) => d.key === evt.hazard);
        if (def) {
          pushToast(
            evt.enabled ? `${def.label} ACTIVATED` : `${def.label} CLEARED`,
            evt.enabled ? 'alert' : 'ok'
          );
        }
        if (onIncidentRef.current) onIncidentRef.current(evt);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [pushToast]);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    const read = () => {
      if (!sceneManager) return;
      const status = sceneManager.getStructuralStatus ? sceneManager.getStructuralStatus() : null;
      let blockedCorridors = 0;
      if (status && status.active) blockedCorridors += 1;
      if (sceneManager.blockedCorridorSegments && sceneManager.blockedCorridorSegments.size) {
        blockedCorridors += sceneManager.blockedCorridorSegments.size;
      }
      setLive({
        evacStatus: sceneManager.evacuationCompleted
          ? 'COMPLETED'
          : (sceneManager.isSimulating ? 'EVACUATING' : 'STANDBY'),
        blockedCorridors,
        rerouted: status ? (status.reroutedAgents || 0) : 0
      });
    };
    read();
    const id = setInterval(read, 900);
    return () => clearInterval(id);
  }, [sceneManager]);

  const zoneArrays = {
    fire: [],
    powerGridFailure: sceneManager ? sceneManager.getPowerZones() : [],
    hvacPressurizationFailure: sceneManager ? sceneManager.getHvacZones() : [],
    structuralCollapse: sceneManager ? sceneManager.getStructuralZones() : []
  };

  // Build the effective active location object from current scope selections
  const effectiveLocation = useMemo(() => {
    if (scopeCategory === 'ROOM') {
      const rm = ROOM_NAMES.find(r => `f${scopeFloor}_${r.suffix}` === selectedEntityId) || ROOM_NAMES[0];
      const id = `f${scopeFloor}_${rm.suffix}`;
      return {
        id,
        category: 'ROOM',
        floor: scopeFloor,
        shortName: `Floor ${scopeFloor} • Rm ${scopeFloor}${rm.suffix.replace('r', '0').slice(-2)}`,
        label: `Room ${scopeFloor}${rm.suffix.replace('r', '0').slice(-2)} (${rm.name})`
      };
    }
    if (scopeCategory === 'FLOOR') {
      return {
        id: `floor_${scopeFloor}`,
        category: 'FLOOR',
        floor: scopeFloor,
        shortName: `Floor ${scopeFloor} (Full Plate)`,
        label: `Level ${scopeFloor} Entire Floor`
      };
    }
    if (scopeCategory === 'CORRIDOR') {
      const isWest = selectedEntityId.includes('west');
      const isEast = selectedEntityId.includes('east');
      const corrPart = isWest ? 'west' : (isEast ? 'east' : 'center');
      const id = `corr_f${scopeFloor}_${corrPart}`;
      return {
        id,
        category: 'CORRIDOR',
        floor: scopeFloor,
        shortName: `Floor ${scopeFloor} • ${corrPart.toUpperCase()} Corridor`,
        label: `Level ${scopeFloor} ${corrPart.toUpperCase()} Corridor Segment`
      };
    }
    if (scopeCategory === 'STAIR') {
      const isWest = selectedEntityId.includes('west');
      const side = isWest ? 'west' : 'east';
      const id = `stair_f${scopeFloor}_${side}`;
      return {
        id,
        category: 'STAIR',
        floor: scopeFloor,
        shortName: `Floor ${scopeFloor} • Stair Core ${isWest ? 'A (West)' : 'B (East)'}`,
        label: `Level ${scopeFloor} Stairwell Core ${isWest ? 'A' : 'B'}`
      };
    }
    if (scopeCategory === 'EXIT') {
      const exitId = ['exit_west', 'exit_east', 'exit_south'].includes(selectedEntityId)
        ? selectedEntityId
        : 'exit_west';
      const exitNames = {
        exit_west: 'Ground Exit A (West Ring Road)',
        exit_east: 'Ground Exit B (East Service Gate)',
        exit_south: 'Ground Exit C (South Grand Plaza)'
      };
      return {
        id: exitId,
        category: 'EXIT',
        floor: 1,
        shortName: exitNames[exitId] || exitId,
        label: exitNames[exitId] || exitId
      };
    }
    return { id: 'f1_r1', category: 'ROOM', floor: 1, shortName: 'Room 101' };
  }, [scopeCategory, scopeFloor, selectedEntityId]);

  const isTargetAffected = (key) => {
    if (!effectiveLocation || !effectiveLocation.id) return false;
    if (key === 'fire') {
      return !!(sceneManager?.fireSystem?.activeFires?.has(effectiveLocation.id));
    }
    return (zoneArrays[key] || []).includes(effectiveLocation.id);
  };

  const applyFireToggle = (next) => {
    if (next) {
      const targetId = (effectiveLocation && effectiveLocation.id) || `f${scopeFloor}_r1`;
      if (sceneManager && sceneManager.triggerFire) {
        sceneManager.triggerFire(targetId);
        return true;
      }
      return false;
    }
    if (sceneManager) {
      const targetId = effectiveLocation && effectiveLocation.id;
      if (targetId && sceneManager.extinguishFire) {
        sceneManager.extinguishFire(targetId);
        return true;
      }
      if (sceneManager.extinguishAll) {
        sceneManager.extinguishAll();
        return true;
      }
    }
    return false;
  };

  const toggleHazard = async (def) => {
    if (!sceneManager || pendingKey !== null) return;
    const next = !isTargetAffected(def.key);
    setPendingKey(def.key);
    await new Promise((r) => setTimeout(r, 200));

    let ok = false;
    try {
      switch (def.key) {
        case 'fire':
          ok = applyFireToggle(next);
          break;
        case 'powerGridFailure':
          ok = sceneManager.setPowerGridFailure ? !!sceneManager.setPowerGridFailure(next, effectiveLocation) : false;
          break;
        case 'hvacPressurizationFailure':
          ok = sceneManager.setHvacFailure ? !!sceneManager.setHvacFailure(next, effectiveLocation) : false;
          break;
        case 'structuralCollapse':
          ok = sceneManager.setStructuralCollapse ? !!sceneManager.setStructuralCollapse(next, effectiveLocation) : false;
          break;
        default:
          ok = false;
      }
    } catch (err) {
      console.warn('[MultiHazard] operation failed:', def.key, err);
      ok = false;
    }

    if (ok) {
      try {
        if (def.key === 'fire' && AIEngine.toggleFire) AIEngine.toggleFire(next);
        if (def.key === 'powerGridFailure' && AIEngine.togglePowerFailure) AIEngine.togglePowerFailure(next, effectiveLocation);
        if (def.key === 'hvacPressurizationFailure' && AIEngine.toggleHvacFailure) AIEngine.toggleHvacFailure(next, effectiveLocation);
        if (def.key === 'structuralCollapse' && AIEngine.toggleStructuralCollapse) {
          AIEngine.toggleStructuralCollapse(next, effectiveLocation);
        }
      } catch (err) {
        console.warn('[MultiHazard] state commit failed:', err);
      }
    } else {
      pushToast(`${def.label} operation failed`, 'error');
    }
    setPendingKey(null);
  };

  const clearSpecificZone = (hazardKey, locId) => {
    if (!sceneManager) return;
    const dummyLoc = { id: locId, floor: 1 };
    if (hazardKey === 'powerGridFailure' && sceneManager.setPowerGridFailure) {
      sceneManager.setPowerGridFailure(false, dummyLoc);
    }
    if (hazardKey === 'hvacPressurizationFailure' && sceneManager.setHvacFailure) {
      sceneManager.setHvacFailure(false, dummyLoc);
    }
    if (hazardKey === 'structuralCollapse' && sceneManager.setStructuralCollapse) {
      sceneManager.setStructuralCollapse(false, dummyLoc);
    }
    pushToast(`Hazard cleared for ${locId}`, 'ok');
  };

  const focus3DLocation = (locId) => {
    if (!sceneManager) return;
    try {
      if (sceneManager.setFacadeMode) sceneManager.setFacadeMode('CUTAWAY');
      const seg = sceneManager.parseSegId ? sceneManager.parseSegId(locId) : null;
      if (seg && seg.kind === 'corr') {
        const b = sceneManager.getCorridorSegmentBounds ? sceneManager.getCorridorSegmentBounds(locId) : null;
        const floorH = sceneManager.building?.floorHeight || 3.8;
        const baseY = (seg.floor - 1) * floorH;
        if (sceneManager.focusTarget) sceneManager.focusTarget({ x: b ? b.centerX : (seg.zone === 'west' ? -12.5 : 12.5), y: baseY + 2.0, z: 0 }, 40);
        if (sceneManager.highlightRoom) sceneManager.highlightRoom(locId);
      } else if (seg && seg.kind === 'stair') {
        const floorH = sceneManager.building?.floorHeight || 3.8;
        const baseY = (seg.floor - 1) * floorH;
        const stairX = seg.zone === 'west' ? -28 : 28;
        if (sceneManager.focusTarget) sceneManager.focusTarget({ x: stairX, y: baseY + 2.0, z: 0 }, 42);
        if (sceneManager.highlightRoom) sceneManager.highlightRoom(locId);
      } else if (locId.startsWith('floor_')) {
        const fl = Number(locId.replace('floor_', '')) || 1;
        sceneManager.setCameraPreset(`FLOOR_${fl}`);
      } else if (sceneManager.focusRoom) {
        sceneManager.focusRoom(locId);
        if (sceneManager.highlightRoom) sceneManager.highlightRoom(locId);
      }
    } catch (e) {}
  };

  const activeCount = Object.keys(EMPTY_HAZARDS).filter((k) => !!hazards[k]).length;
  const statusLabel =
    activeCount === 0 ? 'SYSTEM NORMAL' : activeCount === 1 ? 'ACTIVE INCIDENTS' : 'MULTIPLE HAZARDS ACTIVE';
  const statusDot = activeCount === 0 ? '#22c55e' : activeCount === 1 ? '#f59e0b' : '#ef4444';

  const totalAffectedZones = (zoneArrays.powerGridFailure.length + zoneArrays.hvacPressurizationFailure.length + zoneArrays.structuralCollapse.length);

  return (
    <div className={`pointer-events-auto select-none ${className}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="rounded-2xl border p-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl" style={{ background: 'rgba(9, 13, 20, 0.88)', borderColor: 'rgba(148, 163, 184, 0.22)' }}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-2 px-0.5">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.22em] text-slate-200 leading-none">MULTI-HAZARD CONTROL</div>
            <div className="text-[8px] tracking-[0.14em] text-slate-500 mt-1 leading-none">GRANULAR EMERGENCY MATRIX</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 shrink-0" style={{ borderColor: `${statusDot}44`, background: `${statusDot}14` }}>
            <span className="relative flex h-1.5 w-1.5">
              {activeCount > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: statusDot }} />}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: statusDot }} />
            </span>
            <span className="text-[8px] font-bold tracking-[0.12em] whitespace-nowrap" style={{ color: statusDot }}>{statusLabel}</span>
          </div>
        </div>

        {/* ── Granular Scope & Location Selector ── */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 mb-2.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="text-[8.5px] font-bold tracking-wider text-slate-400">TARGET SCOPE:</span>
            </div>
            {/* Scope Category Buttons */}
            <div className="flex items-center gap-1">
              {[
                { id: 'ROOM', label: 'ROOM' },
                { id: 'FLOOR', label: 'FLOOR' },
                { id: 'CORRIDOR', label: 'CORRIDOR' },
                { id: 'STAIR', label: 'STAIR' },
                { id: 'EXIT', label: 'EXIT' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setScopeCategory(cat.id);
                    if (cat.id === 'ROOM') setSelectedEntityId(`f${scopeFloor}_r1`);
                    if (cat.id === 'FLOOR') setSelectedEntityId(`floor_${scopeFloor}`);
                    if (cat.id === 'CORRIDOR') setSelectedEntityId(`corr_f${scopeFloor}_west`);
                    if (cat.id === 'STAIR') setSelectedEntityId(`stair_f${scopeFloor}_west`);
                    if (cat.id === 'EXIT') setSelectedEntityId('exit_west');
                  }}
                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    scopeCategory === cat.id
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-selector: Floor and Specific Entity Picker */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
            {scopeCategory !== 'EXIT' && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[8px] font-bold text-slate-500">LVL:</span>
                <select
                  value={scopeFloor}
                  onChange={(e) => {
                    const fl = Number(e.target.value);
                    setScopeFloor(fl);
                    if (scopeCategory === 'ROOM') setSelectedEntityId(`f${fl}_r1`);
                    if (scopeCategory === 'FLOOR') setSelectedEntityId(`floor_${fl}`);
                    if (scopeCategory === 'CORRIDOR') setSelectedEntityId(`corr_f${fl}_west`);
                    if (scopeCategory === 'STAIR') setSelectedEntityId(`stair_f${fl}_west`);
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded px-1 py-0.5 text-[9px] font-bold text-slate-200 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fl) => (
                    <option key={fl} value={fl}>L{fl}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Entity selector dropdown */}
            <div className="flex-1 min-w-0">
              {scopeCategory === 'ROOM' && (
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 truncate cursor-pointer"
                >
                  {ROOM_NAMES.map((r) => (
                    <option key={r.suffix} value={`f${scopeFloor}_${r.suffix}`}>
                      Rm {scopeFloor}{r.suffix.replace('r', '0').slice(-2)} — {r.name}
                    </option>
                  ))}
                </select>
              )}

              {scopeCategory === 'FLOOR' && (
                <div className="text-[9px] font-semibold text-slate-300 truncate py-0.5 px-1 bg-slate-900/60 rounded border border-slate-800">
                  Level {scopeFloor} Entire Floor (All Rooms & Corridors)
                </div>
              )}

              {scopeCategory === 'CORRIDOR' && (
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 truncate cursor-pointer"
                >
                  <option value={`corr_f${scopeFloor}_west`}>West Corridor (Stair Core A Entry)</option>
                  <option value={`corr_f${scopeFloor}_east`}>East Corridor (Stair Core B Entry)</option>
                  <option value={`corr_f${scopeFloor}_center`}>Central Crossing Corridor</option>
                </select>
              )}

              {scopeCategory === 'STAIR' && (
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 truncate cursor-pointer"
                >
                  <option value={`stair_f${scopeFloor}_west`}>Stair Core A (West Shaft)</option>
                  <option value={`stair_f${scopeFloor}_east`}>Stair Core B (East Shaft)</option>
                </select>
              )}

              {scopeCategory === 'EXIT' && (
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 truncate cursor-pointer"
                >
                  <option value="exit_west">Ground Exit A (West Ring Road Gate)</option>
                  <option value="exit_east">Ground Exit B (East Service Gate)</option>
                  <option value="exit_south">Ground Exit C (South Grand Portal)</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ── Hazard Toggle Buttons (4 Grid) ── */}
        <div className="flex flex-wrap gap-2 justify-center">
          {HAZARD_DEFS.map((def) => {
            const Icon = def.icon;
            const isOn = !!hazards[def.key];
            const targetAffected = isTargetAffected(def.key);
            const isPending = pendingKey === def.key;
            const dot = isPending ? '#f59e0b' : targetAffected ? '#ef4444' : (isOn ? '#f59e0b' : '#22c55e');

            return (
              <button
                key={def.key}
                type="button"
                role="switch"
                aria-checked={targetAffected}
                disabled={!sceneManager || pendingKey !== null}
                onClick={() => toggleHazard(def)}
                title={def.hint}
                className="group relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px cursor-pointer"
                style={{
                  minWidth: '138px',
                  borderColor: targetAffected ? `${def.tint}66` : 'rgba(148, 163, 184, 0.18)',
                  background: targetAffected ? `${def.tint}1f` : 'rgba(15, 23, 42, 0.45)',
                  boxShadow: targetAffected ? `0 0 18px -6px ${def.tint}88, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.03)'
                }}
              >
                <Icon className="w-4 h-4 shrink-0 transition-colors" style={{ color: targetAffected ? def.tint : '#64748b' }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[9.5px] font-bold tracking-[0.06em] leading-none truncate" style={{ color: targetAffected ? '#f1f5f9' : '#94a3b8' }}>{def.label}</span>
                  <span className="flex items-center gap-1 mt-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${isPending || targetAffected ? 'animate-pulse' : ''}`} style={{ background: dot }} />
                    <span className="text-[8px] font-semibold tracking-[0.1em] text-slate-500 whitespace-nowrap">
                      {isPending ? 'PROCESSING' : targetAffected ? 'ACTIVE HERE' : (isOn ? 'ACTIVE ELSEWHERE' : 'NORMAL')}
                    </span>
                  </span>
                </span>
                <span className="text-[8px] font-black tracking-wider shrink-0" style={{ color: targetAffected ? def.tint : '#475569' }}>{targetAffected ? 'ON' : 'OFF'}</span>
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-40 w-60 rounded-lg border border-slate-700/60 bg-slate-950/95 px-2.5 py-2 text-[9px] leading-relaxed text-slate-300 shadow-xl backdrop-blur-md">{def.hint}</span>
              </button>
            );
          })}
        </div>

        {/* ── Active Incident Chips Drawer ── */}
        {totalAffectedZones > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <div className="text-[8px] font-bold tracking-wider text-slate-400 mb-1">ACTIVE LOCALIZED INCIDENTS:</div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
              {zoneArrays.powerGridFailure.map((locId) => (
                <div key={`p_${locId}`} className="flex items-center gap-1 rounded bg-amber-950/60 border border-amber-600/40 px-1.5 py-0.5 text-[8px] text-amber-300">
                  <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[130px]">Power: {locId}</span>
                  <button onClick={() => focus3DLocation(locId)} title="Focus in 3D" className="hover:text-white cursor-pointer ml-0.5">
                    <Eye className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => clearSpecificZone('powerGridFailure', locId)} title="Clear Outage" className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {zoneArrays.structuralCollapse.map((locId) => (
                <div key={`c_${locId}`} className="flex items-center gap-1 rounded bg-orange-950/60 border border-orange-600/40 px-1.5 py-0.5 text-[8px] text-orange-300">
                  <BrickWall className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                  <span className="truncate max-w-[130px]">Collapse: {locId}</span>
                  <button onClick={() => focus3DLocation(locId)} title="Focus in 3D" className="hover:text-white cursor-pointer ml-0.5">
                    <Eye className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => clearSpecificZone('structuralCollapse', locId)} title="Clear Collapse" className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {zoneArrays.hvacPressurizationFailure.map((locId) => (
                <div key={`h_${locId}`} className="flex items-center gap-1 rounded bg-purple-950/60 border border-purple-600/40 px-1.5 py-0.5 text-[8px] text-purple-300">
                  <Wind className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                  <span className="truncate max-w-[130px]">HVAC: {locId}</span>
                  <button onClick={() => clearSpecificZone('hvacPressurizationFailure', locId)} title="Clear HVAC" className="hover:text-red-300 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telemetry Grid */}
        <div className="mt-2.5 pt-2 border-t grid grid-cols-4 gap-x-3 gap-y-1" style={{ borderColor: 'rgba(148, 163, 184, 0.12)' }}>
          {[
            { label: 'ACTIVE HAZARDS', value: `${activeCount}/4` },
            { label: 'AFFECTED ZONES', value: String(totalAffectedZones) },
            { label: 'EVACUATION', value: live.evacStatus },
            { label: 'REROUTED', value: String(live.rerouted) }
          ].map((cell) => (
            <div key={cell.label} className="min-w-0">
              <div className="text-[7.5px] font-bold tracking-[0.14em] text-slate-500 truncate">{cell.label}</div>
              <div className="text-[10px] font-bold text-slate-200 truncate mt-0.5">{cell.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Toasts */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[80] flex flex-col items-center gap-1.5 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl border px-3 py-2 text-[10px] font-semibold shadow-2xl backdrop-blur-md whitespace-nowrap" style={{
            background: 'rgba(9, 13, 20, 0.92)',
            borderColor: t.tone === 'error' ? 'rgba(239, 68, 68, 0.45)' : t.tone === 'alert' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(34, 197, 94, 0.4)',
            color: t.tone === 'error' ? '#fca5a5' : t.tone === 'alert' ? '#fcd34d' : '#86efac'
          }}>{t.message}</div>
        ))}
      </div>
    </div>
  );
};

export default MultiHazardToolbar;
