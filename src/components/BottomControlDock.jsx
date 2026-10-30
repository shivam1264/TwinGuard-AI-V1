import React, { useState } from 'react';
import {
  Flame,
  Pause,
  RotateCcw,
  Gauge,
  Layers,
  Camera,
  Maximize2,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';

export const BottomControlDock = ({
  isSimulating = false,
  simSpeed = 1.0,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  onSetCameraPreset,
  bimLayers = { structure: true, fireSafety: true, occupants: true },
  onToggleBimLayer,
  onToggleFullscreen
}) => {
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
  const [currentCameraLabel, setCurrentCameraLabel] = useState('Isometric View');
  const [bimToggle, setBimToggle] = useState(true);

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1.0, label: '1x' },
    { value: 2.0, label: '2x' },
    { value: 4.0, label: '4x' }
  ];

  const cameraOptions = [
    { id: 'DEFAULT', label: 'Isometric View' },
    { id: 'HERO_VIEW', label: 'Hero Section View' },
    { id: 'TOP_DOWN', label: 'Top Down View' },
    { id: 'STAIRS_FOCUS', label: 'Stair Shaft View' }
  ];

  const handleSelectCamera = (opt) => {
    setCurrentCameraLabel(opt.label);
    setCameraMenuOpen(false);
    if (onSetCameraPreset) onSetCameraPreset(opt.id);
  };

  return (
    <div
      className="flex items-center justify-between shrink-0 z-30 select-none"
      style={{
        height: '66px',
        padding: '0 20px',
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

      {/* ── 2. Center-Left: Simulation Speed Capsule ── */}
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

      {/* ── 3. Center-Right: BIM Layers & Toggles ── */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
            <Layers style={{ width: '15px', height: '15px', color: '#64748b' }} />
            <span>BIM Layers</span>
          </div>

          {/* Toggle Switch */}
          <div
            onClick={() => setBimToggle(!bimToggle)}
            className="cursor-pointer transition-colors relative flex items-center"
            style={{
              width: '34px',
              height: '18px',
              borderRadius: '999px',
              background: bimToggle ? '#2563eb' : '#cbd5e1',
              padding: '2px',
            }}
          >
            <div
              className="transition-transform"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                transform: bimToggle ? 'translateX(16px)' : 'translateX(0)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>

        {/* Checkbox Pills */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          <label className="flex items-center cursor-pointer select-none" style={{ gap: '5px' }}>
            <input
              type="checkbox"
              checked={bimLayers.structure}
              onChange={() => onToggleBimLayer('structure')}
              className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Structure</span>
          </label>

          <label className="flex items-center cursor-pointer select-none" style={{ gap: '5px' }}>
            <input
              type="checkbox"
              checked={bimLayers.fireSafety}
              onChange={() => onToggleBimLayer('fireSafety')}
              className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Fire Safety</span>
          </label>

          <label className="flex items-center cursor-pointer select-none" style={{ gap: '5px' }}>
            <input
              type="checkbox"
              checked={bimLayers.occupants}
              onChange={() => onToggleBimLayer('occupants')}
              className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Occupants</span>
          </label>
        </div>
      </div>

      {/* ── 4. Right: Camera View Dropdown & Fullscreen ── */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        <div className="relative">
          <button
            onClick={() => setCameraMenuOpen(!cameraMenuOpen)}
            className="flex items-center cursor-pointer transition-all"
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
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
                borderRadius: '6px',
                background: '#f0fdf4',
                color: '#16a34a',
              }}
            >
              <Camera style={{ width: '13px', height: '13px' }} />
            </div>
            <div className="text-left">
              <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
                Camera View
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '2px' }}>
                {currentCameraLabel}
              </div>
            </div>
            <ChevronDown style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
          </button>

          {/* Camera Dropdown Menu */}
          {cameraMenuOpen && (
            <div
              className="absolute right-0 bottom-full mb-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 flex flex-col"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectCamera(opt)}
                  className="px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {currentCameraLabel === opt.label && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Maximize / Fullscreen Button */}
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
