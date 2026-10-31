import React from 'react';
import {
  Home,
  Layers,
  ArrowUpDown,
  Video,
  Activity,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  Milestone,
  Flame,
  FileText,
  Info,
  ChevronRight,
  Siren
} from 'lucide-react';
import { FLOOR_THEMES } from '../simulation/Doorways';

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
  isSimulating = false,
  elapsedSeconds = 0,
  emergencyStatus = null
}) => {
  const getFloorInfo = (floorNum) => {
    const floorRooms = rooms.filter((r) => r.floor === floorNum);
    const floorHasFire = floorRooms.some((r) => r.hasFire);
    const totalOccupants = floorRooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
    const theme = FLOOR_THEMES[floorNum] || { name: `${floorNum}th Floor`, prefix: `L${floorNum}` };
    return {
      occupants: totalOccupants,
      subName: theme.subName || theme.name?.replace(/^\d+(st|nd|rd|th)\s+Floor\s*•?\s*/i, '') || 'Workspace',
      hasFire: floorHasFire
    };
  };

  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getOrdinalName = (num) => {
    const suffixes = { 1: '1st', 2: '2nd', 3: '3rd' };
    return `${suffixes[num] || `${num}th`} Floor`;
  };

  const floorSubtitles = {
    10: 'Executive',
    9: 'Global',
    8: 'Biotech',
    7: 'Product',
    6: 'R&D',
    5: 'Engineering',
    4: 'Design',
    3: 'Operations',
    2: 'Marketing',
    1: 'Lobby & Entrance'
  };

  const menuItems = [
    { id: '3D_VIEW', label: 'Home View (3D)', icon: Home, badge: null, badgeColor: null },
    {
      id: 'COMMAND_CENTER',
      label: 'Emergency Command Center',
      icon: Siren,
      iconColor: '#dc2626',
      badge: 'Live',
      badgeColor: '#fef2f2',
      badgeText: '#dc2626'
    },
    { id: 'FLOOR_VIEW', label: 'Floor Stack (BIM)', icon: Layers, badge: '10 Lvl', badgeColor: '#f1f5f9' },
    { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, badge: '3 Cores', badgeColor: '#f0fdf4', badgeText: '#16a34a' },
    { id: 'ELEVATORS', label: 'Elevator Shafts', icon: ArrowUpDown, badge: '3', badgeColor: '#f1f5f9' },
    { id: 'CCTV', label: 'CCTV Monitoring', icon: Video, action: onOpenCctv, badge: '100', badgeColor: '#f0fdf4', badgeText: '#16a34a' },
    { id: 'SYSTEMS', label: 'Sensor Telemetry', icon: Activity, action: onOpenSystems, badge: 'Live', badgeColor: '#dcfce7', badgeText: '#15803d' },
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
        ? (emergencyStatus.isArrived ? '#dcfce7' : '#fee2e2')
        : (isSimulating ? (elapsedSeconds >= 30 ? '#dcfce7' : '#fee2e2') : '#fef2f2'),
      badgeText: emergencyStatus?.isActive
        ? (emergencyStatus.isArrived ? '#15803d' : '#b91c1c')
        : (isSimulating ? (elapsedSeconds >= 30 ? '#15803d' : '#b91c1c') : '#dc2626')
    },
    { id: 'INFO', label: 'Building Information', icon: FileText, badge: null }
  ];

  // ==========================================
  // 1. COLLAPSED RAIL
  // ==========================================
  if (isCollapsed) {
    return (
      <aside
        className="flex flex-col items-center shrink-0 select-none z-20"
        style={{
          width: '64px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          padding: '16px 8px',
          gap: '10px',
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '11px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
          }}
          title="Expand Left Panel"
        >
          <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
        </button>

        <div style={{ width: '28px', height: '1px', background: '#e2e8f0' }} />

        <div className="flex flex-col items-center" style={{ gap: '6px', width: '100%' }}>
          {menuItems.map((item) => {
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
                  borderRadius: '11px',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : item.iconColor || '#64748b',
                  border: 'none',
                  boxShadow: isActive ? '0 4px 12px -2px rgba(37, 99, 235, 0.35)' : 'none',
                }}
                title={item.label}
              >
                <Icon style={{ width: '17px', height: '17px' }} />
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex flex-col items-center justify-center transition-all cursor-pointer mt-auto"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            color: '#16a34a',
          }}
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span style={{ fontSize: '7px', fontWeight: 800, color: '#94a3b8' }}>LVL</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a', fontFamily: 'monospace' }}>
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED VIEW — Exactly Matching Mockup Image
  // ==========================================
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-hidden z-20"
      style={{
        width: '280px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Scrollable Body ── */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col"
        style={{
          padding: '16px 14px 12px 14px',
          gap: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* ─── SECTION 1: MAIN MENU ─── */}
        <div className="flex flex-col" style={{ gap: '3px' }}>
          <div className="flex items-center justify-between" style={{ padding: '0 8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              MAIN MENU
            </span>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center cursor-pointer transition-colors"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
              title="Collapse Left Sidebar"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <PanelLeftClose style={{ width: '15px', height: '15px' }} />
            </button>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            if (isActive) {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    onSelectMode(item.id);
                  }}
                  className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none"
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '12px',
                    background: '#2563eb',
                    boxShadow: '0 4px 12px -2px rgba(37, 99, 235, 0.35)',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  <div className="flex items-center min-w-0 flex-1" style={{ gap: '10px' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Icon style={{ width: '15px', height: '15px', color: '#ffffff' }} />
                    </div>
                    <span className="truncate" style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none"
                style={{
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '11px',
                  background: 'transparent',
                  color: '#475569',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                <div className="flex items-center min-w-0 flex-1" style={{ gap: '10px' }}>
                  <Icon style={{ width: '16px', height: '16px', color: item.iconColor || '#64748b', shrink: 0 }} />
                  <span className="truncate" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: item.badgeText || '#64748b',
                      background: item.badgeColor || '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── SECTION 2: BUILDING FLOORS (3-Column Layout Matching Image) ─── */}
        <div className="flex flex-col" style={{ gap: '10px' }}>
          <div className="flex items-center justify-between" style={{ padding: '0 4px' }}>
            <div className="flex items-center" style={{ gap: '7px' }}>
              <Layers style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                BUILDING FLOORS
              </span>
            </div>

            <button
              onClick={() => onSelectFloor('ALL')}
              className="flex items-center cursor-pointer transition-colors"
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#2563eb',
                gap: '2px',
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#2563eb'; }}
            >
              <span>Show All</span>
              <ChevronRight style={{ width: '14px', height: '14px', strokeWidth: 2.5 }} />
            </button>
          </div>

          {/* 3-Column Grid of Floor Cards (L10 down to L1) */}
          <div
            className="grid grid-cols-3"
            style={{
              gap: '8px',
            }}
          >
            {floorsList.map((fl) => {
              const isSelected = activeFloorView === String(fl);

              return (
                <button
                  key={fl}
                  onClick={() => onSelectFloor(String(fl))}
                  className="flex items-center justify-center cursor-pointer transition-all focus:outline-none"
                  style={{
                    height: '42px',
                    borderRadius: '12px',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    border: isSelected ? '1.5px solid #3b82f6' : '1px solid #eef2f6',
                    boxShadow: isSelected
                      ? '0 2px 6px -1px rgba(37, 99, 235, 0.2)'
                      : '0 1px 2px rgba(0, 0, 0, 0.03)',
                    color: isSelected ? '#2563eb' : '#334155',
                    gap: '7px',
                    padding: '0 8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#eef2f6';
                    }
                  }}
                  title={`View Floor L${fl} (${floorSubtitles[fl] || 'Level ' + fl})`}
                >
                  <Building2
                    style={{
                      width: '15px',
                      height: '15px',
                      color: isSelected ? '#2563eb' : '#475569',
                      strokeWidth: 2,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 800 : 700,
                      color: isSelected ? '#2563eb' : '#1e293b',
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    L{fl}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Information Card ── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9' }}>
        <div
          className="flex items-center"
          style={{
            padding: '10px 12px',
            borderRadius: '14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            gap: '10px',
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              color: '#16a34a',
            }}
          >
            <Building2 style={{ width: '16px', height: '16px' }} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              10 Floors • 100 Rooms
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
              Gross Area: 25,400 m²
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
