import React from 'react';
import {
  Box,
  Layers,
  Milestone,
  Video,
  Activity,
  Flame,
  Pause,
  RotateCcw,
  Gauge,
  Sparkles,
  Trophy,
  AlertTriangle,
  Building2,
  FileText,
  Sliders,
  CheckCircle2,
  Compass,
  Plus,
  Play,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Clock
} from 'lucide-react';

export const DynamicLeftSidebar = React.memo(({
  isCollapsed = false,
  onToggleCollapse,
  activeTab = 'LIVE_VIEW',
  onSelectTab,
  // 3D View specific props
  activeMode = '3D_VIEW',
  onSelectMode,
  activeFloorView = 'ALL',
  onSelectFloor,
  isSimulating = false,
  simSpeed = 1.0,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  elapsedSeconds = 0,
  onOpenCctv,
  onOpenSystems,
  onOpenEmergencyControl,
  // Context state
  rooms = [],
  exits = [],
  incidents = []
}) => {
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1.0, label: '1x' },
    { value: 2.0, label: '2x' },
    { value: 4.0, label: '4x' }
  ];

  // Helper to get contextual items for current active tab
  const getContextItems = () => {
    switch (activeTab) {
      case 'LIVE_VIEW':
        return {
          title: '3D TWIN OPERATIONS',
          items: [
            { id: '3D_VIEW', label: 'Digital Twin (3D)', icon: Box, color: '#38bdf8' },
            { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, color: '#10b981', badge: '3' },
            { id: 'CCTV', label: 'CCTV Monitoring', icon: Video, color: '#94a3b8', badge: '100', action: onOpenCctv },
            { id: 'SYSTEMS', label: 'Sensor Telemetry', icon: Activity, color: '#34d399', badge: 'Live', action: onOpenSystems }
          ]
        };
      case 'COMMAND_CENTER':
        return {
          title: 'COMMAND MODULES',
          items: [
            { id: 'STATUS', label: 'Facility Status Deck', icon: Activity, color: '#38bdf8' },
            { id: 'FLEET', label: 'Rapid Fleet Dispatch', icon: Flame, color: '#ef4444', action: onOpenEmergencyControl },
            { id: 'CCTV_CMD', label: 'Live Cameras (100)', icon: Video, color: '#38bdf8', action: onOpenCctv }
          ]
        };
      case 'SCENARIOS':
        return {
          title: 'SCENARIO PRESETS',
          items: [
            { id: 'FIRE_L7', label: 'L7 West Stair Fire', icon: Flame, color: '#ef4444', badge: 'Active' },
            { id: 'LOBBY_BLK', label: 'Exit Blockage (Lobby)', icon: AlertTriangle, color: '#f97316' },
            { id: 'CROWD_DENSE', label: 'High Crowd Density', icon: Sparkles, color: '#38bdf8' }
          ]
        };
      case 'STRATEGY_RANKER':
        return {
          title: 'STRATEGY MODES',
          items: [
            { id: 'SPEED_OPT', label: 'Evacuation Speed', icon: Clock, color: '#38bdf8', badge: '35%' },
            { id: 'DENSITY_OPT', label: 'Crowd Density', icon: Activity, color: '#10b981', badge: '35%' },
            { id: 'EXPOSURE_OPT', label: 'Hazard Exposure', icon: AlertTriangle, color: '#f59e0b', badge: '30%' }
          ]
        };
      case 'INCIDENTS':
        return {
          title: `INCIDENTS (${incidents.length || 3})`,
          items: [
            { id: 'INC_L7', label: 'L7 West Stair Fire', icon: Flame, color: '#ef4444', badge: 'Critical' },
            { id: 'INC_G', label: 'G Exit Blockage', icon: AlertTriangle, color: '#f97316', badge: 'High' },
            { id: 'INC_L5', label: 'L5 Crowd Surge', icon: Activity, color: '#f59e0b', badge: 'Medium' }
          ]
        };
      case 'ANALYTICS':
        return {
          title: 'ANALYTICS MODULES',
          items: [
            { id: 'OVERVIEW', label: 'Overview Insights', icon: Activity, color: '#38bdf8' },
            { id: 'EVAC_CURVE', label: 'Clearance Time', icon: Clock, color: '#10b981' },
            { id: 'FLOW_HEATMAP', label: 'Crowd Density', icon: Layers, color: '#a855f7' },
            { id: 'BOTTLENECK', label: 'Bottleneck Choke', icon: AlertTriangle, color: '#ef4444' }
          ]
        };
      case 'BUILDING_INFO':
        return {
          title: 'BUILDING DIRECTORY',
          items: [
            { id: 'TOWER_INFO', label: 'Horizon Tower', icon: Building2, color: '#38bdf8', badge: '10 Lvl' },
            { id: 'ROOMS_DIR', label: 'Rooms Directory', icon: Layers, color: '#10b981', badge: '100' },
            { id: 'SPECS', label: 'Structural Specs', icon: FileText, color: '#94a3b8' }
          ]
        };
      case 'REPORTS':
        return {
          title: 'COMPLIANCE AUDIT',
          items: [
            { id: 'NFPA', label: 'NFPA 101 Standard', icon: FileText, color: '#38bdf8', badge: 'Passed' },
            { id: 'IBC', label: 'IBC 2024 Code', icon: CheckCircle2, color: '#10b981', badge: 'Class A' },
            { id: 'ISO', label: 'ISO 22301 Resilience', icon: ShieldCheck, color: '#a855f7' }
          ]
        };
      default:
        return { title: 'OPERATIONS', items: [] };
    }
  };

  const { title, items } = getContextItems();

  return (
    <aside
      className="flex flex-col shrink-0 select-none z-20 backdrop-blur-md border-r border-sky-500/20 transition-[width] duration-300 ease-out will-change-[width] overflow-hidden"
      style={{
        width: isCollapsed ? '60px' : '240px',
        background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.96) 0%, rgba(6, 12, 24, 0.94) 100%)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Top Header / Toggle Bar ── */}
      <div className="flex items-center justify-between px-3 min-h-[48px] h-[48px] border-b border-sky-500/15 overflow-hidden w-[240px]">
        <span
          className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate transition-opacity duration-200"
          style={{ opacity: isCollapsed ? 0 : 1 }}
        >
          {title}
        </span>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg bg-slate-900/80 border border-sky-500/25 flex items-center justify-center text-sky-400 hover:text-white cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
          title={isCollapsed ? "Open Left Sidebar" : "Close Left Sidebar"}
          style={{
            transform: isCollapsed ? 'translateX(-174px)' : 'none',
            transition: 'transform 300ms ease-out'
          }}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-sky-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-sky-400" />
          )}
        </button>
      </div>

      {/* ── Contextual Items List (Fluid & Smooth) ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-2 gap-1.5 w-[240px]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeMode === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) item.action();
                if (onSelectMode) onSelectMode(item.id);
              }}
              className="flex items-center rounded-xl text-left cursor-pointer transition-colors relative h-10 px-2.5 overflow-hidden"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%)'
                  : 'transparent',
                border: isActive ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid transparent',
                boxShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.4)' : 'none',
                width: '100%'
              }}
              title={item.label}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" style={{ color: isActive ? '#ffffff' : item.color }} />
              </div>

              <div
                className="flex items-center justify-between flex-1 min-w-0 pl-2.5 transition-opacity duration-200"
                style={{ opacity: isCollapsed ? 0 : 1 }}
              >
                <span
                  className="text-xs font-semibold truncate"
                  style={{ color: isActive ? '#ffffff' : '#cbd5e1' }}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 shrink-0 ml-1">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Bottom Section: Evacuation Simulation Controls for 3D View ── */}
      {activeTab === 'LIVE_VIEW' && (
        <div className="p-2 border-t border-sky-500/15 flex flex-col gap-2 mt-auto w-[240px] overflow-hidden">
          {/* Action Row */}
          <div className="flex items-center gap-2">
            {!isSimulating ? (
              <button
                onClick={onStartEvacuation}
                className="h-10 rounded-xl cursor-pointer bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 shrink-0 overflow-hidden"
                style={{ width: isCollapsed ? '42px' : '100%' }}
                title="Start Evacuation"
              >
                <Flame className="w-4 h-4 fill-white shrink-0" />
                <span
                  className="whitespace-nowrap transition-opacity duration-200"
                  style={{ display: isCollapsed ? 'none' : 'inline' }}
                >
                  START EVACUATION
                </span>
              </button>
            ) : (
              <button
                onClick={onPauseResume}
                className="h-10 rounded-xl cursor-pointer bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 shrink-0 overflow-hidden"
                style={{ width: isCollapsed ? '42px' : '100%' }}
                title="Pause Evacuation"
              >
                <Pause className="w-4 h-4 fill-white shrink-0" />
                <span
                  className="whitespace-nowrap transition-opacity duration-200"
                  style={{ display: isCollapsed ? 'none' : 'inline' }}
                >
                  PAUSE EVACUATION
                </span>
              </button>
            )}

            {!isCollapsed && (
              <button
                onClick={onReset}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer bg-slate-900 border border-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors"
                title="Reset Scenario"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Reset button when collapsed */}
          {isCollapsed && (
            <button
              onClick={onReset}
              className="w-[42px] h-9 rounded-xl flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Reset Scenario"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Speed settings (only in expanded state) */}
          {!isCollapsed && (
            <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-1 pl-1 text-[10px] font-bold text-slate-400">
                <Gauge className="w-3 h-3 text-sky-400" />
                <span>Speed</span>
              </div>
              <div className="flex items-center gap-1">
                {speedOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSetSpeed && onSetSpeed(opt.value)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    style={{
                      background: simSpeed === opt.value ? '#2563eb' : 'transparent',
                      color: simSpeed === opt.value ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
});
