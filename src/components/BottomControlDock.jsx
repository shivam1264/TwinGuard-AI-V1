import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Layers,
  Camera,
  Maximize2,
  ChevronDown
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
    onSetCameraPreset(opt.id);
  };

  return (
    <div
      className="flex items-center justify-between shrink-0 z-30 select-none"
      style={{
        height: '68px',
        padding: '0 20px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* 1. Left Group: Evacuation Action & Reset */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        {!isSimulating ? (
          <button
            onClick={onStartEvacuation}
            className="flex items-center cursor-pointer transition-all focus:outline-none"
            style={{
              height: '44px',
              padding: '0 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 14px -2px rgba(239, 68, 68, 0.35)',
              color: '#ffffff',
              gap: '10px',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <Play style={{ width: '13px', height: '13px', fill: 'white', color: 'white', marginLeft: '2px' }} />
            </div>
            <div className="text-left">
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
                START EVACUATION
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, lineHeight: 1, marginTop: '2px' }}>
                Simulate and manage routes
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onPauseResume}
            className="flex items-center cursor-pointer transition-all focus:outline-none"
            style={{
              height: '44px',
              padding: '0 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              boxShadow: '0 4px 14px -2px rgba(249, 115, 22, 0.35)',
              color: '#ffffff',
              gap: '10px',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <Pause style={{ width: '13px', height: '13px', fill: 'white', color: 'white' }} />
            </div>
            <div className="text-left">
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
                PAUSE EVACUATION
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, lineHeight: 1, marginTop: '2px' }}>
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
            height: '44px',
            padding: '0 14px',
            borderRadius: '999px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            gap: '8px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#e2e8f0',
              color: '#475569',
            }}
          >
            <RotateCcw style={{ width: '13px', height: '13px' }} />
          </div>
          <div className="text-left">
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>RESET</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, lineHeight: 1, marginTop: '2px' }}>Clear scenario</div>
          </div>
        </button>
      </div>

      {/* 2. Simulation Speed Capsule */}
      <div
        className="hidden md:flex items-center"
        style={{
          height: '44px',
          padding: '0 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '999px',
          gap: '10px',
        }}
      >
        <div className="flex items-center" style={{ gap: '6px' }}>
          <Gauge style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Speed</span>
        </div>

        <div
          className="flex items-center"
          style={{
            background: '#e2e8f0',
            padding: '2px',
            borderRadius: '999px',
            gap: '2px',
          }}
        >
          {speedOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSetSpeed(opt.value)}
              className="cursor-pointer transition-all"
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: simSpeed === opt.value ? 800 : 600,
                padding: '3px 10px',
                borderRadius: '999px',
                background: simSpeed === opt.value ? '#0d7a5f' : 'transparent',
                color: simSpeed === opt.value ? '#ffffff' : '#64748b',
                boxShadow: simSpeed === opt.value ? '0 2px 6px -1px rgba(13, 122, 95, 0.3)' : 'none',
                border: 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BIM Layers Toggle & Checkboxes */}
      <div
        className="hidden lg:flex items-center"
        style={{
          height: '44px',
          padding: '0 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '999px',
          gap: '14px',
        }}
      >
        <div className="flex items-center" style={{ gap: '8px' }}>
          <Layers style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>BIM Layers</span>

          <button
            onClick={() => setBimToggle(!bimToggle)}
            className="cursor-pointer transition-colors"
            style={{
              width: '34px',
              height: '18px',
              borderRadius: '999px',
              padding: '2px',
              background: bimToggle ? '#0d7a5f' : '#cbd5e1',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              className="transition-transform"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transform: bimToggle ? 'translateX(16px)' : 'translateX(0)',
              }}
            />
          </button>
        </div>

        <div className="flex items-center" style={{ gap: '12px', paddingLeft: '12px', borderLeft: '1px solid #e2e8f0' }}>
          {[
            { key: 'structure', label: 'Structure' },
            { key: 'fireSafety', label: 'Fire Safety' },
            { key: 'occupants', label: 'Occupants' }
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center cursor-pointer select-none"
              style={{ gap: '6px' }}
            >
              <input
                type="checkbox"
                checked={bimLayers[item.key]}
                onChange={(e) => onToggleBimLayer(item.key, e.target.checked)}
                className="cursor-pointer"
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: '#0d7a5f',
                  borderRadius: '3px',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Right: Camera View Dropdown & Fullscreen */}
      <div className="flex items-center" style={{ gap: '8px' }}>
        <div className="relative">
          <button
            onClick={() => setCameraMenuOpen(!cameraMenuOpen)}
            className="flex items-center cursor-pointer transition-all"
            style={{
              height: '44px',
              padding: '0 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              gap: '8px',
            }}
          >
            <Camera style={{ width: '15px', height: '15px', color: '#0d7a5f' }} />
            <div className="text-left hidden sm:block">
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', lineHeight: 1 }}>
                Camera View
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                {currentCameraLabel}
              </span>
            </div>
            <ChevronDown style={{ width: '13px', height: '13px', color: '#94a3b8', marginLeft: '2px' }} />
          </button>

          {cameraMenuOpen && (
            <div
              className="absolute flex flex-col"
              style={{
                right: 0,
                bottom: '100%',
                marginBottom: '8px',
                width: '180px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '4px',
                gap: '2px',
                zIndex: 40,
              }}
            >
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectCamera(opt)}
                  className="w-full flex items-center text-left cursor-pointer transition-all"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: currentCameraLabel === opt.label ? 700 : 500,
                    background: currentCameraLabel === opt.label ? '#f0fdf4' : 'transparent',
                    color: currentCameraLabel === opt.label ? '#0d7a5f' : '#334155',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (currentCameraLabel !== opt.label) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (currentCameraLabel !== opt.label) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
          }}
          title="Toggle Fullscreen"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0d7a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
        >
          <Maximize2 style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
};
