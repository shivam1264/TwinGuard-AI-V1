import React from 'react';
import {
  Flame,
  Pause,
  RotateCcw,
  Gauge,
  Maximize2,
  Truck,
  RotateCw
} from 'lucide-react';

export const BottomControlDock = ({
  isSimulating = false,
  simSpeed = 1.0,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  onToggleFullscreen,
  onOpenEmergencyControl
}) => {
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1.0, label: '1x' },
    { value: 2.0, label: '2x' },
    { value: 4.0, label: '4x' }
  ];

  return (
    <div
      className="flex items-center justify-between shrink-0 z-30 select-none px-4 sm:px-6 h-16 backdrop-blur-md"
      style={{
        background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.92) 0%, rgba(6, 12, 24, 0.96) 100%)',
        borderTop: '1px solid rgba(56, 189, 248, 0.16)',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.45)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── 1. Left Group: START EVACUATION & RESET ── */}
      <div className="flex items-center gap-3">
        {!isSimulating ? (
          <button
            onClick={onStartEvacuation}
            className="flex items-center cursor-pointer transition-all focus:outline-none hover:scale-[1.02] active:scale-[0.98]"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              gap: '10px',
              border: '1px solid rgba(248, 113, 113, 0.5)'
            }}
          >
            <div
              className="flex items-center justify-center shrink-0 w-6 h-6 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <Flame className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-wider uppercase leading-tight">
                START EVACUATION
              </div>
              <div className="text-[9.5px] text-red-100 font-medium leading-tight mt-0.5">
                Simulate & coordinate full response
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onPauseResume}
            className="flex items-center cursor-pointer transition-all focus:outline-none hover:scale-[1.02] active:scale-[0.98]"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              gap: '10px',
              border: '1px solid rgba(251, 146, 60, 0.5)'
            }}
          >
            <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-lg bg-white/20">
              <Pause className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-wider uppercase leading-tight">
                PAUSE EVACUATION
              </div>
              <div className="text-[9.5px] text-orange-100 font-medium leading-tight mt-0.5">
                Simulation running
              </div>
            </div>
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center cursor-pointer transition-all focus:outline-none hover:bg-slate-800/60"
          style={{
            height: '42px',
            padding: '0 14px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            gap: '8px'
          }}
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <div className="text-left">
            <div className="text-xs font-black text-white leading-tight">
              RESET
            </div>
            <div className="text-[9.5px] text-slate-400 font-medium mt-0.5">
              Clear scenario
            </div>
          </div>
        </button>
      </div>

      {/* ── 2. Center: Simulation Speed Capsule ── */}
      <div className="hidden lg:flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Gauge className="w-4 h-4 text-sky-400" />
          <span>Simulation Speed</span>
        </div>

        <div
          className="flex items-center p-1 rounded-xl gap-1"
          style={{
            background: 'rgba(11, 22, 44, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}
        >
          {speedOptions.map((opt) => {
            const isSelected = simSpeed === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSetSpeed(opt.value)}
                className="cursor-pointer transition-all h-7 px-3 rounded-lg text-xs font-bold"
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.6)' : 'none'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Right: Essential Action Group (No Duplicates with Top Bar) ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenEmergencyControl}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl cursor-pointer transition-all hover:bg-sky-500/10 text-xs font-bold text-slate-300 border border-sky-500/20"
          title="Rapid Dispatch Emergency Fleet"
        >
          <Truck className="w-3.5 h-3.5 text-sky-400" />
          <span>Dispatch Fleet</span>
        </button>

        <button
          onClick={onToggleFullscreen}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white border border-sky-500/20 bg-slate-900/60 cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
