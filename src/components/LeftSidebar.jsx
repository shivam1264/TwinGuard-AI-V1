import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpDown,
  Video,
  Activity,
  Flame,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Milestone,
  Smartphone,
  ShieldCheck,
  Building2,
  Box,
  Pause,
  RotateCcw,
  Gauge
} from 'lucide-react';

export const LeftSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  activeMode = '3D_VIEW',
  onSelectMode,
  activeFloorView = 'ALL',
  onSelectFloor,
  rooms = [],
  exits = [],
  hasFire = false,
  onOpenCctv,
  onOpenSystems,
  onOpenBuildingInfo,
  onSetCameraPreset,
  onOpenEmergencyControl,
  onOpenEvacueeQr,
  isSimulating = false,
  simSpeed = 1.0,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  elapsedSeconds = 0,
  emergencyStatus = null
}) => {
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1.0, label: '1x' },
    { value: 2.0, label: '2x' },
    { value: 4.0, label: '4x' }
  ];
  const operationsItems = [
    {
      id: '3D_VIEW',
      label: 'Digital Twin (3D)',
      icon: Box,
      iconColor: '#38bdf8',
      badge: null
    },
    {
      id: 'STAIRS_FOCUS',
      label: 'Stairwell Cores',
      icon: Milestone,
      iconColor: '#10b981',
      badge: '3',
      badgeColor: 'rgba(16, 185, 129, 0.2)',
      badgeText: '#34d399'
    },
    
    {
      id: 'CCTV',
      label: 'CCTV Monitoring',
      icon: Video,
      iconColor: '#94a3b8',
      action: onOpenCctv,
      badge: '100',
      badgeColor: 'rgba(56, 189, 248, 0.2)',
      badgeText: '#38bdf8'
    },
    {
      id: 'SYSTEMS',
      label: 'Sensor Telemetry',
      icon: Activity,
      iconColor: '#34d399',
      action: onOpenSystems,
      badge: 'Live',
      badgeColor: 'rgba(16, 185, 129, 0.2)',
      badgeText: '#34d399'
    },
    {
      id: 'EMERGENCY',
      label: 'Emergency Control',
      icon: Flame,
      iconColor: '#ef4444',
      action: onOpenEmergencyControl,
      badge: emergencyStatus?.isActive
        ? (emergencyStatus.isArrived ? 'On Scene' : `${Math.ceil(emergencyStatus.etaSeconds)}s`)
        : (isSimulating ? (elapsedSeconds >= 30 ? 'On Scene' : `${Math.max(0, 30 - elapsedSeconds)}s`) : '30s Resp'),
      badgeColor: emergencyStatus?.isActive
        ? (emergencyStatus.isArrived ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)')
        : 'rgba(239, 68, 68, 0.2)',
      badgeText: emergencyStatus?.isActive
        ? (emergencyStatus.isArrived ? '#34d399' : '#f87171')
        : '#f87171'
    },
    
  ];

  // ==========================================
  // 1. COLLAPSED RAIL
  // ==========================================
  if (isCollapsed) {
    return (
      <aside
        className="flex flex-col items-center shrink-0 select-none z-20 backdrop-blur-md"
        style={{
          width: '60px',
          background: 'rgba(8, 16, 32, 0.92)',
          borderRight: '1px solid rgba(56, 189, 248, 0.16)',
          padding: '14px 6px',
          gap: '8px'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            color: '#38bdf8'
          }}
          title="Expand Left Panel"
        >
          <ChevronRight className="w-5 h-5 text-sky-400" />
        </button>

        <div style={{ width: '28px', height: '1px', background: 'rgba(56, 189, 248, 0.15)' }} />

        <div className="flex flex-col items-center gap-1.5 w-full">
          {operationsItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className="flex items-center justify-center relative transition-all cursor-pointer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isActive ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : item.iconColor || '#94a3b8',
                  border: isActive ? '1px solid #60a5fa' : 'none',
                  boxShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.5)' : 'none'
                }}
                title={item.label}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
              </button>
            );
          })}
        </div>

        {/* Collapsed Evacuation & Reset Action Icons */}
        <div className="flex flex-col items-center gap-2 mt-auto w-full pt-2 border-t border-sky-500/15">
          <button
            onClick={!isSimulating ? onStartEvacuation : onPauseResume}
            className="flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: !isSimulating
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
              border: !isSimulating ? '1px solid rgba(248, 113, 113, 0.5)' : '1px solid rgba(251, 146, 60, 0.5)',
              color: '#ffffff',
              boxShadow: !isSimulating ? '0 0 12px rgba(239, 68, 68, 0.5)' : '0 0 12px rgba(249, 115, 22, 0.5)'
            }}
            title={!isSimulating ? 'Start Evacuation Simulation' : 'Pause Evacuation Simulation'}
          >
            {!isSimulating ? <Flame className="w-4 h-4 fill-white text-white" /> : <Pause className="w-4 h-4 fill-white text-white" />}
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center transition-all cursor-pointer hover:bg-slate-800"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#94a3b8'
            }}
            title="Reset Simulation Scenario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED VIEW — Clean & Optimized
  // ==========================================
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-hidden z-20 backdrop-blur-md"
      style={{
        width: '240px',
        background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.95) 0%, rgba(6, 12, 24, 0.92) 100%)',
        borderRight: '1px solid rgba(56, 189, 248, 0.16)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.45)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Scrollable Body ── */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-3 gap-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* ─── SECTION: 3D DIGITAL TWIN OPERATIONS ─── */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              OPERATIONS
            </span>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center cursor-pointer transition-colors w-6 h-6 rounded-md bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white"
              title="Collapse Left Sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {operationsItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left cursor-pointer transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 14px rgba(37, 99, 235, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    style={{
                      width: '15px',
                      height: '15px',
                      color: isActive ? '#ffffff' : item.iconColor || '#94a3b8'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? '#ffffff' : '#cbd5e1'
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '6px',
                      background: item.badgeColor || 'rgba(56, 189, 248, 0.15)',
                      color: item.badgeText || '#38bdf8'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── SECTION: EVACUATION SIMULATION CONTROLS (Shifted from Bottom Bar) ─── */}
        <div className="mt-auto flex flex-col gap-2.5 pt-3 border-t border-sky-500/15">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              SIMULATION CONTROL
            </span>
            {isSimulating && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {elapsedSeconds}s
              </span>
            )}
          </div>

          {/* Start / Pause Button */}
          {!isSimulating ? (
            <button
              onClick={onStartEvacuation}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                color: '#ffffff'
              }}
            >
              <Flame className="w-4 h-4 fill-white text-white" />
              <div className="text-left">
                <div className="text-[11px] font-black tracking-wider uppercase leading-tight">
                  START EVACUATION
                </div>
                <div className="text-[8.5px] text-red-100 font-medium leading-tight">
                  Simulate & coordinate response
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onPauseResume}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
                boxShadow: '0 0 16px rgba(249, 115, 22, 0.4)',
                border: '1px solid rgba(251, 146, 60, 0.5)',
                color: '#ffffff'
              }}
            >
              <Pause className="w-4 h-4 fill-white text-white" />
              <div className="text-left">
                <div className="text-[11px] font-black tracking-wider uppercase leading-tight">
                  PAUSE EVACUATION
                </div>
                <div className="text-[8.5px] text-orange-100 font-medium leading-tight">
                  Simulation running
                </div>
              </div>
            </button>
          )}

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#cbd5e1'
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-white">RESET SCENARIO</span>
          </button>

          {/* Simulation Speed Pill Selector */}
          <div
            className="flex items-center justify-between p-1.5 rounded-xl mt-0.5"
            style={{
              background: 'rgba(11, 22, 44, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.15)'
            }}
          >
            <div className="flex items-center gap-1 pl-1 text-[10px] font-bold text-slate-400">
              <Gauge className="w-3 h-3 text-sky-400" />
              <span>Speed</span>
            </div>
            <div className="flex items-center gap-1">
              {speedOptions.map((opt) => {
                const isSelected = simSpeed === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSetSpeed && onSetSpeed(opt.value)}
                    className="cursor-pointer transition-all px-2 py-0.5 rounded-md text-[10.5px] font-bold"
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      boxShadow: isSelected ? '0 0 8px rgba(37, 99, 235, 0.5)' : 'none'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
