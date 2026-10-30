import React from 'react';
import { Play, Pause, RotateCcw, Compass, Zap, Layers, Flame, ShieldAlert, Route, MapPin } from 'lucide-react';

export const ControlPanel = React.memo(({
  status,
  isSimulating,
  simSpeed,
  activeFloorView,
  showRouteOverlays = true,
  showExitBadges = true,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  onSetCameraPreset,
  onSetFloorView,
  onTriggerScenarioFire,
  onBlockStairwell,
  onClearHazards,
  onToggleRouteOverlays,
  onToggleExitBadges
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Upper Micro-Bar: Scenario Engine Triggers & Overlay Toggles */}
      <div className="glass-panel rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-xl backdrop-blur-xl bg-slate-950/85 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-hud">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Scenarios:
          </span>
          <button
            onClick={() => onTriggerScenarioFire && onTriggerScenarioFire('f4_r3')}
            className="px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-[11px] flex items-center gap-1 transition-all"
            title="Simulate Fire Incident in Level 4 AI Laboratory"
          >
            <Flame className="w-3 h-3 text-red-400" /> L4 Lab Fire
          </button>
          <button
            onClick={() => onBlockStairwell && onBlockStairwell('West')}
            className="px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-mono text-[11px] flex items-center gap-1 transition-all"
            title="Simulate Structural Blockage on West Stairwell Core"
          >
            ⚠️ Block Stair A (West)
          </button>
          <button
            onClick={() => onClearHazards && onClearHazards()}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-all"
          >
            Clear Hazards
          </button>
        </div>

        {/* 3D Overlays Display Toggles */}
        <div className="flex items-center gap-1.5 font-hud">
          <button
            onClick={() => onToggleRouteOverlays && onToggleRouteOverlays()}
            className={`px-2 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1 transition-all ${
              showRouteOverlays
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Route className="w-3 h-3 text-emerald-400" /> 3D Routes: {showRouteOverlays ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => onToggleExitBadges && onToggleExitBadges()}
            className={`px-2 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1 transition-all ${
              showExitBadges
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <MapPin className="w-3 h-3 text-cyan-400" /> Exit Badges: {showExitBadges ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Bar: Simulation Controls, Floors & Cameras */}
      <div className="glass-panel rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-xl bg-slate-950/90 border border-cyan-500/30">
        {/* Left: Simulation Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {!isSimulating ? (
            <button
              onClick={onStartEvacuation}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-hud font-bold text-xs tracking-wider rounded-lg shadow-[0_0_15px_rgba(255,51,68,0.5)] flex items-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-white" />
              START 10-FLOOR EVACUATION
            </button>
          ) : (
            <button
              onClick={onPauseResume}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-hud font-bold text-xs tracking-wider rounded-lg flex items-center gap-2 transition-all"
            >
              <Pause className="w-4 h-4 fill-white" />
              PAUSE
            </button>
          )}

          <button
            onClick={onReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-hud text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
        </div>

        {/* Center 1: 10-Floor Level Selector */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-hud max-w-full overflow-x-auto">
          <span className="text-[10px] text-slate-400 px-1.5 flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3 text-cyan-400" /> FLOORS:
          </span>
          <button
            onClick={() => onSetFloorView('ALL')}
            className={`px-2 py-0.5 rounded transition-all text-xs shrink-0 ${
              activeFloorView === 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All (Tower)
          </button>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fl => (
            <button
              key={fl}
              onClick={() => onSetFloorView(String(fl))}
              className={`px-1.5 py-0.5 rounded transition-all text-xs shrink-0 ${
                activeFloorView === String(fl)
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{fl}
            </button>
          ))}

          <button
            onClick={() => onSetFloorView('EXPLODED')}
            className={`px-2 py-0.5 rounded transition-all text-xs shrink-0 ${
              activeFloorView === 'EXPLODED'
                ? 'bg-purple-500 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            Exploded BIM
          </button>
        </div>

        {/* Center 2: Simulation Speed */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="text-[10px] text-slate-400 px-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> SPEED:
          </span>
          {[1.0, 2.0, 4.0].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-2 py-0.5 rounded transition-all ${
                simSpeed === spd
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Right: Camera Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-hud text-slate-400 uppercase flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> CAM:
          </span>
          <button
            onClick={() => onSetCameraPreset('HERO_VIEW')}
            className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-hud font-bold rounded border border-cyan-500/50 transition-colors shadow-[0_0_8px_rgba(0,240,255,0.3)]"
          >
            Hero View (H)
          </button>
          <button
            onClick={() => onSetCameraPreset('ISOMETRIC')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Isometric
          </button>
          <button
            onClick={() => onSetCameraPreset('TOP_DOWN')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Top Down
          </button>
          <button
            onClick={() => onSetCameraPreset('STAIRS_FOCUS')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Stair Shaft
          </button>
        </div>
      </div>
    </div>
  );
});
