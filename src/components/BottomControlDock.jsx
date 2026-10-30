import React from 'react';
import {
  Flame,
  Pause,
  RotateCcw,
  Gauge,
  Maximize2
} from 'lucide-react';

export const BottomControlDock = ({
  isSimulating = false,
  simSpeed = 1.0,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  onToggleFullscreen
}) => {
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1.0, label: '1x' },
    { value: 2.0, label: '2x' },
    { value: 4.0, label: '4x' }
  ];

  return (
    <div
      className="flex items-center justify-between shrink-0 z-30 select-none"
      style={{
        height: '66px',
        padding: '0 24px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── 1. Left Group: Evacuation Action & Reset ── */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        {!isSimulating ? (
          <button
            onClick={onStartEvacuation}
            className="flex items-center cursor-pointer transition-all focus:outline-none"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 14px -2px rgba(239, 68, 68, 0.4)',
              color: '#ffffff',
              gap: '10px',
              border: 'none',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <Flame style={{ width: '13px', height: '13px', fill: 'white', color: 'white' }} />
            </div>
            <div className="text-left">
              <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
                START EVACUATION
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500, lineHeight: 1, marginTop: '2px' }}>
                Simulate and manage routes
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onPauseResume}
            className="flex items-center cursor-pointer transition-all focus:outline-none"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              boxShadow: '0 4px 14px -2px rgba(249, 115, 22, 0.4)',
              color: '#ffffff',
              gap: '10px',
              border: 'none',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <Pause style={{ width: '12px', height: '12px', fill: 'white', color: 'white' }} />
            </div>
            <div className="text-left">
              <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
                PAUSE EVACUATION
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500, lineHeight: 1, marginTop: '2px' }}>
                Simulation in progress
              </div>
            </div>
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center cursor-pointer transition-all focus:outline-none"
          style={{
            height: '42px',
            padding: '0 14px',
            borderRadius: '999px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            gap: '8px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#64748b',
            }}
          >
            <RotateCcw style={{ width: '12px', height: '12px' }} />
          </div>
          <div className="text-left">
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              RESET
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>
              Clear scenario
            </div>
          </div>
        </button>
      </div>

      {/* ── 2. Center: Simulation Speed Capsule ── */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
          <Gauge style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <span>Simulation Speed</span>
        </div>

        <div
          className="flex items-center"
          style={{
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '999px',
            gap: '2px',
          }}
        >
          {speedOptions.map((opt) => {
            const isSelected = simSpeed === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSetSpeed(opt.value)}
                className="cursor-pointer transition-all"
                style={{
                  height: '28px',
                  padding: '0 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 800 : 600,
                  background: isSelected ? '#2563eb' : 'transparent',
                  color: isSelected ? '#ffffff' : '#64748b',
                  border: 'none',
                  boxShadow: isSelected ? '0 2px 6px -1px rgba(37, 99, 235, 0.4)' : 'none',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Right: Fullscreen Toggle ── */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        <button
          onClick={onToggleFullscreen}
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#64748b',
          }}
          title="Toggle Fullscreen"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          <Maximize2 style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  );
};
