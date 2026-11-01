import React from 'react';
import {
  X,
  Box,
  LayoutDashboard,
  Building2,
  Sparkles,
  Trophy,
  AlertTriangle,
  LineChart,
  FileText,
  Layers,
  Milestone,
  Video,
  Activity,
  Flame,
  Pause,
  RotateCcw,
  Gauge,
  Clock,
  ShieldCheck,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Compass,
  MapPin,
  ClipboardList,
  ShieldAlert,
  Zap,
  Radio
} from 'lucide-react';

export const DynamicLeftSidebar = React.memo(({
  theme = 'dark',
  onToggleTheme,
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
  onOpenGis,
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

  const isDark = theme === 'dark';

  // ── 8 Primary Navigation Items (Moved from Top Header) ──
  const primaryNavItems = [
    {
      id: 'LIVE_VIEW',
      label: '3D Digital Twin',
      icon: Box,
      color: isDark ? '#38bdf8' : '#0284c7'
    },
    {
      id: 'COMMAND_CENTER',
      label: 'Command Center',
      icon: LayoutDashboard,
      color: isDark ? '#38bdf8' : '#0284c7'
    },
    {
      id: 'BUILDING_INFO',
      label: 'Building Info',
      icon: Building2,
      color: isDark ? '#38bdf8' : '#0284c7'
    },
    {
      id: 'SCENARIOS',
      label: 'AI Scenarios',
      icon: Sparkles,
      color: isDark ? '#38bdf8' : '#0284c7'
    },
    {
      id: 'STRATEGY_RANKER',
      label: 'Strategy Ranker',
      icon: Trophy,
      color: isDark ? '#38bdf8' : '#0284c7'
    },
    {
      id: 'INCIDENTS',
      label: 'Incidents',
      icon: AlertTriangle,
      color: '#ef4444',
      badge: (incidents && incidents.length > 0) ? incidents.length : 3
    },
    {
      id: 'ANALYTICS',
      label: 'Analytics',
      icon: LineChart,
      color: isDark ? '#38bdf8' : '#0284c7'
    },
    {
      id: 'REPORTS',
      label: 'Reports',
      icon: FileText,
      color: isDark ? '#38bdf8' : '#0284c7'
    }
  ];

  // ── Contextual Sub-Tools for All 8 Active Views ──
  const getContextItems = () => {
    switch (activeTab) {
      case 'LIVE_VIEW':
        return {
          title: '3D VIEWPORT TOOLS',
          items: [
            { id: '3D_VIEW', label: 'Overview Camera', icon: Box, color: isDark ? '#38bdf8' : '#0284c7' },
            { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, color: '#10b981', badge: '3 Cores' },
            { id: 'CCTV', label: 'CCTV Cameras', icon: Video, color: isDark ? '#94a3b8' : '#64748b', badge: '100', action: onOpenCctv },
            { id: 'SYSTEMS', label: 'Telemetry HUD', icon: Activity, color: '#34d399', badge: 'Live', action: onOpenSystems }
          ]
        };
      case 'COMMAND_CENTER':
        return {
          title: 'COMMAND TOOLS',
          items: [
            { id: 'STATUS', label: 'Facility Status Deck', icon: Activity, color: isDark ? '#38bdf8' : '#0284c7' },
            { id: 'FLEET', label: 'Rapid Fleet Dispatch', icon: Flame, color: '#ef4444', badge: 'Gate', action: onOpenEmergencyControl },
            { id: 'CCTV_CMD', label: 'Live CCTV (100 Cams)', icon: Video, color: isDark ? '#38bdf8' : '#0284c7', badge: '100', action: onOpenCctv }
          ]
        };
      case 'BUILDING_INFO':
        return {
          title: 'BUILDING DIRECTORY',
          items: [
            { id: 'SPECS', label: 'Architectural Specs', icon: Building2, color: isDark ? '#38bdf8' : '#0284c7', badge: '10 L' },
            { id: 'STAIRS', label: 'Emergency Stair Cores', icon: Milestone, color: '#10b981', badge: '3 Cores' },
            { id: 'EXITS', label: 'Ground Egress Portals', icon: MapPin, color: '#f59e0b', badge: '4 Gates' }
          ]
        };
      case 'SCENARIOS':
        return {
          title: 'SCENARIO PRESETS',
          items: [
            { id: 'SCEN_ELEC', label: 'Electrical Arc Fire', icon: Zap, color: '#f59e0b', badge: 'B-201' },
            { id: 'SCEN_STAIR', label: 'Stairwell Blockage', icon: ShieldAlert, color: '#ef4444', badge: 'Core A' },
            { id: 'SCEN_MULTI', label: 'Multi-Hazard Event', icon: Flame, color: '#a855f7', badge: 'L4' }
          ]
        };
      case 'STRATEGY_RANKER':
        return {
          title: 'TOPSIS EVALUATION',
          items: [
            { id: 'RANK_TABLE', label: 'Strategy Matrix', icon: Trophy, color: '#eab308', badge: '5 Strat' },
            { id: 'CRITERIA', label: 'Egress Weights', icon: Activity, color: isDark ? '#38bdf8' : '#0284c7', badge: '4 Vars' },
            { id: 'SIM_EVAL', label: 'Real-Time Rank', icon: ShieldCheck, color: '#10b981', badge: 'AI Top' }
          ]
        };
      case 'INCIDENTS':
        return {
          title: 'INCIDENT LOG & FLEET',
          items: [
            { id: 'ACTIVE_INC', label: 'Active Alarms', icon: AlertTriangle, color: '#ef4444', badge: '3 Active' },
            { id: 'GIS_DISPATCH', label: 'GIS Fleet Map', icon: Compass, color: '#38bdf8', badge: 'Radar', action: onOpenGis },
            { id: 'RADIO_COMMS', label: 'Emergency Radio', icon: Radio, color: '#10b981', badge: 'Live' }
          ]
        };
      case 'ANALYTICS':
        return {
          title: 'PREDICTIVE METRICS',
          items: [
            { id: 'CURVE', label: 'Crowd Clearance Curve', icon: LineChart, color: '#38bdf8', badge: 'Live' },
            { id: 'BOTTLENECK', label: 'Stair Density Forecast', icon: Activity, color: '#f59e0b', badge: 'High' },
            { id: 'FLOW', label: 'Doorway Flow Rates', icon: Layers, color: '#10b981', badge: 'Flow' }
          ]
        };
      case 'REPORTS':
        return {
          title: 'AUDIT & COMPLIANCE',
          items: [
            { id: 'NFPA', label: 'NFPA 101 Compliance', icon: ShieldCheck, color: '#10b981', badge: 'Grade A' },
            { id: 'LOGS', label: 'Evacuation Log Sheet', icon: ClipboardList, color: isDark ? '#38bdf8' : '#0284c7', badge: 'PDF' },
            { id: 'CERT', label: 'Life Safety Audit', icon: FileText, color: '#a855f7', badge: 'Verified' }
          ]
        };
      default:
        return null;
    }
  };

  const contextData = getContextItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onToggleCollapse}
          aria-hidden="true"
        />
      )}

      <aside
        className={`flex flex-col shrink-0 select-none backdrop-blur-md transition-all duration-300 ease-out overflow-hidden ${
          isDark ? 'theme-dark' : 'theme-light'
        } ${
          isCollapsed
            ? 'w-0 -translate-x-full overflow-hidden pointer-events-none md:w-16 md:translate-x-0 md:pointer-events-auto md:relative md:z-20'
            : 'fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] translate-x-0 shadow-2xl md:relative md:w-60 md:z-20 md:shadow-none'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(180deg, #081020 0%, #060c18 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRight: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '4px 0 24px rgba(0, 0, 0, 0.45)' : '4px 0 20px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
      {/* ── Top Header / Collapse Bar (Only Open/Close Toggle) ── */}
      <div
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-2.5 min-h-[48px] h-[48px] overflow-hidden w-full transition-colors`}
        style={{
          borderBottom: isDark ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid #e2e8f0'
        }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 pl-1.5">
            <span className="text-xs font-bold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
              Navigation
            </span>
          </div>
        )}

        {/* Desktop Collapse/Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #cbd5e1',
            color: isDark ? '#38bdf8' : '#0284c7'
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onToggleCollapse}
          className="flex md:hidden w-7 h-7 rounded-lg items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #cbd5e1',
            color: isDark ? '#38bdf8' : '#0284c7'
          }}
          title="Close Navigation"
          aria-label="Close Navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable Body: 8 Primary Nav Items + Contextual Tools ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-2 gap-1 w-full">
        {/* Section Label (Expanded only) */}
        {!isCollapsed && (
          <div className="px-2 pt-1 pb-1">
            <span
              className="text-[9.5px] font-extrabold uppercase tracking-wider"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              CORE PLATFORM
            </span>
          </div>
        )}

        {/* 8 Primary Navigation Buttons */}
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (isCollapsed) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectTab) onSelectTab(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggleCollapse) {
                    onToggleCollapse();
                  }
                }}
                className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${
                  !isActive
                    ? (isDark ? 'hover:bg-sky-500/10 hover:border-sky-500/30' : 'hover:bg-slate-100 hover:border-slate-300')
                    : ''
                }`}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(96, 165, 250, 0.6)'
                    : '1px solid transparent',
                  boxShadow: isActive ? '0 0 14px rgba(37, 99, 235, 0.6)' : 'none'
                }}
                title={item.label}
              >
                <Icon
                  className="w-5 h-5 transition-transform group-hover:scale-110"
                  style={{ color: isActive ? '#ffffff' : item.color }}
                />
                {item.badge && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-[9px] font-black bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm shadow-red-500 border border-slate-900"
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                  if (onSelectTab) onSelectTab(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggleCollapse) {
                    onToggleCollapse();
                  }
                }}
              className="w-full flex items-center h-10 px-3 rounded-xl cursor-pointer transition-all relative group overflow-hidden"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(96, 165, 250, 0.55)'
                  : '1px solid transparent',
                boxShadow: isActive
                  ? '0 2px 10px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = isDark ? 'rgba(56, 189, 248, 0.08)' : '#f1f5f9';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(56, 189, 248, 0.2)' : '#cbd5e1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
              title={item.label}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Icon
                  className="w-4 h-4 transition-transform group-hover:scale-110"
                  style={{ color: isActive ? '#ffffff' : item.color }}
                />
              </div>

              <div className="flex items-center justify-between flex-1 min-w-0 pl-2.5">
                <span
                  className="text-xs truncate font-semibold"
                  style={{
                    color: isActive
                      ? '#ffffff'
                      : isDark ? '#cbd5e1' : '#334155'
                  }}
                >
                  {item.label}
                </span>

                {item.badge && item.badge > 0 && (
                  <span
                    className="text-[9.5px] font-black px-1.5 py-0.5 rounded-full bg-red-600 text-white shrink-0 ml-1.5 shadow-sm shadow-red-500/60"
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* ── Contextual Secondary Section (Customized for All 8 Views) ── */}
        {contextData && !isCollapsed && (
          <div
            className="mt-3 pt-2 flex flex-col gap-1"
            style={{
              borderTop: isDark ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid #e2e8f0'
            }}
          >
            <div className="px-2 pb-1">
              <span
                className="text-[9.5px] font-extrabold uppercase tracking-wider"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                {contextData.title}
              </span>
            </div>
            {contextData.items.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeMode === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    if (sub.action) sub.action();
                    if (onSelectMode) onSelectMode(sub.id);
                  }}
                  className="w-full flex items-center h-8 px-2.5 rounded-lg cursor-pointer transition-all text-left"
                  style={{
                    background: isSubActive
                      ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)')
                      : 'transparent',
                    border: isSubActive
                      ? (isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #93c5fd')
                      : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubActive) {
                      e.currentTarget.style.background = isDark ? 'rgba(56, 189, 248, 0.06)' : '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubActive) e.currentTarget.style.background = 'transparent';
                  }}
                  title={sub.label}
                >
                  <SubIcon className="w-3.5 h-3.5 shrink-0" style={{ color: sub.color }} />
                  <span
                    className="text-[11px] font-medium truncate pl-2 flex-1"
                    style={{ color: isDark ? '#cbd5e1' : '#475569' }}
                  >
                    {sub.label}
                  </span>
                  {sub.badge && (
                    <span
                      className="text-[9px] font-bold px-1 rounded shrink-0 ml-1"
                      style={{
                        background: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)',
                        color: isDark ? '#38bdf8' : '#0284c7'
                      }}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom Section: Evacuation Controls ── */}
      <div
        className="p-2 flex flex-col gap-2 mt-auto w-full overflow-hidden transition-colors"
        style={{
          borderTop: isDark ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid #e2e8f0',
          background: isDark ? 'rgba(2, 6, 23, 0.65)' : '#f8fafc'
        }}
      >
        {/* Action Row */}
        <div className="flex items-center gap-1.5 w-full">
          {!isSimulating ? (
            <button
              onClick={onStartEvacuation}
              className={`h-9 rounded-xl cursor-pointer bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 overflow-hidden ${
                isCollapsed ? 'w-10 mx-auto' : 'flex-1'
              }`}
              title="Start Evacuation"
            >
              <Flame className="w-4 h-4 fill-white shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap text-[11px] font-black tracking-wide text-white">
                  START EVACUATION
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onPauseResume}
              className={`h-9 rounded-xl cursor-pointer bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 overflow-hidden ${
                isCollapsed ? 'w-10 mx-auto' : 'flex-1'
              }`}
              title="Pause Evacuation"
            >
              <Pause className="w-4 h-4 fill-white shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap text-[11px] font-black tracking-wide text-white">
                  PAUSE EVACUATION
                </span>
              )}
            </button>
          )}

          {!isCollapsed && (
            <button
              onClick={onReset}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              style={{
                background: isDark ? '#0f172a' : '#ffffff',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                color: isDark ? '#cbd5e1' : '#475569'
              }}
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Reset button when collapsed */}
        {isCollapsed && (
          <button
            onClick={onReset}
            className="w-10 h-8 mx-auto rounded-xl flex items-center justify-center cursor-pointer transition-colors"
            style={{
              background: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              color: isDark ? '#cbd5e1' : '#475569'
            }}
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Speed settings (only in expanded state) */}
        {!isCollapsed && (
          <div
            className="flex items-center justify-between p-1 rounded-xl"
            style={{
              background: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid #1e293b' : '1px solid #cbd5e1'
            }}
          >
            <div
              className="flex items-center gap-1 pl-1 text-[10px] font-bold"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <Gauge className="w-3 h-3 text-sky-400" />
              <span>Speed</span>
            </div>
            <div className="flex items-center gap-1">
              {speedOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSetSpeed && onSetSpeed(opt.value)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  style={{
                    background: simSpeed === opt.value ? '#2563eb' : 'transparent',
                    color: simSpeed === opt.value ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
});
