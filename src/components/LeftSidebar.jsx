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
  CheckCircle2,
  AlertTriangle,
  Users,
  Compass,
  MapPin,
  Shield,
  LifeBuoy,
  Eye
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
  onSetCameraPreset
}) => {
  const getFloorInfo = (floorNum) => {
    const floorRooms = rooms.filter((r) => r.floor === floorNum);
    const floorHasFire = floorRooms.some((r) => r.hasFire);
    const totalOccupants = floorRooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
    const theme = FLOOR_THEMES[floorNum] || { name: `${floorNum}th Floor`, prefix: `L${floorNum}` };
    let status = 'safe';
    if (floorHasFire) status = 'hazard';
    else if (totalOccupants > 35) status = 'warning';
    return { status, occupants: totalOccupants, themeName: theme.name };
  };

  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getOrdinalName = (num) => {
    const suffixes = { 1: '1st', 2: '2nd', 3: '3rd' };
    return `${suffixes[num] || `${num}th`} Floor`;
  };

  const menuItems = [
    { id: '3D_VIEW', label: 'Home View (3D)', icon: Home, badge: null },
    { id: 'FLOOR_VIEW', label: 'Floor Stack (BIM)', icon: Layers, badge: '10 Lvl' },
    { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, badge: '3 Cores' },
    { id: 'ELEVATORS', label: 'Elevator Shafts', icon: ArrowUpDown, badge: '3' },
    { id: 'CCTV', label: 'CCTV Monitoring', icon: Video, action: onOpenCctv, badge: '100' },
    { id: 'SYSTEMS', label: 'Sensor Telemetry', icon: Activity, action: onOpenSystems, badge: 'Live' }
  ];

  const emergencyExits = [
    { id: 'core_west', name: 'West Core (Stairwell A)', status: 'Clear', preset: 'STAIRS_FOCUS' },
    { id: 'core_east', name: 'East Core (Stairwell B)', status: 'Clear', preset: 'STAIRS_FOCUS' },
    { id: 'core_south', name: 'South Ground Exit', status: 'Clear', preset: 'ENTRANCE' },
    { id: 'helipad', name: 'Rooftop Helipad', status: 'Standby', preset: 'FOCUS_HELIPAD' }
  ];

  const musterPoints = [
    { id: 'MUSTER_A', name: 'Muster Zone A', loc: 'West Plaza', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_B', name: 'Muster Zone B', loc: 'East Park', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_C', name: 'Muster Zone C', loc: 'South Esplanade', preset: 'ENTRANCE' }
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
          background: 'linear-gradient(180deg, #f0fdf8 0%, #ffffff 100%)',
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
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            color: '#0d7a5f',
          }}
          title="Expand Left Panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: isActive ? 'linear-gradient(135deg, #0d7a5f, #0a664e)' : '#f0fdf4',
                  border: isActive ? 'none' : '1px solid #d1fae5',
                  color: isActive ? '#ffffff' : '#0d7a5f',
                  boxShadow: isActive ? '0 4px 12px -2px rgba(13, 122, 95, 0.3)' : 'none',
                }}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                <span
                  className="absolute pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
                  style={{
                    left: '100%',
                    marginLeft: '12px',
                    padding: '4px 8px',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    zIndex: 50,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ width: '28px', height: '1px', background: '#e2e8f0' }} />

        <button
          onClick={onToggleCollapse}
          className="flex flex-col items-center justify-center transition-all cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            color: '#0d7a5f',
            marginTop: 'auto',
          }}
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span style={{ fontSize: '6px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>LVL</span>
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#0d7a5f', lineHeight: 1.1, fontFamily: 'monospace' }}>
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED VIEW — Reference-matched clean design
  // ==========================================
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-hidden z-20"
      style={{
        width: '320px',
        background: 'linear-gradient(180deg, #f0fdf8 0%, #ffffff 50%, #ffffff 100%)',
        borderRight: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: '16px 20px 14px 20px' }}
      >
        <div className="flex items-center min-w-0" style={{ gap: '8px' }}>
          <div
            className="shrink-0"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#0d7a5f',
              boxShadow: '0 0 6px rgba(13, 122, 95, 0.4)',
            }}
          />
          <span
            className="truncate"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '-0.01em',
            }}
          >
            TwinGuard AI • Digital Twin
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer shrink-0 transition-all"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#94a3b8',
          }}
          title="Collapse Panel"
        >
          <PanelLeftClose style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col"
        style={{
          padding: '4px 16px 0 16px',
          gap: '20px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >

        {/* ─── SECTION: MAIN MENU ─── */}
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 4px',
              marginBottom: '8px',
            }}
          >
            MAIN MENU
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
                    height: '48px',
                    padding: '0 14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)',
                    boxShadow: '0 4px 16px -3px rgba(13, 122, 95, 0.35)',
                    color: '#ffffff',
                  }}
                >
                  <div className="flex items-center min-w-0 flex-1" style={{ gap: '12px' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <Icon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                    </div>
                    <span
                      className="truncate"
                      style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <span
                      className="shrink-0"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.9)',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '2px 10px',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                      }}
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
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none group"
                style={{
                  height: '48px',
                  padding: '0 14px',
                  borderRadius: '14px',
                  background: 'transparent',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="flex items-center min-w-0 flex-1" style={{ gap: '12px' }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: '#f0fdf4',
                      border: '1px solid #d1fae5',
                      color: '#0d7a5f',
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px' }} />
                  </div>
                  <span
                    className="truncate"
                    style={{ fontSize: '13.5px', fontWeight: 500, color: '#334155' }}
                  >
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0d7a5f',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── SECTION: BUILDING FLOORS ─── */}
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <div
            className="flex items-center justify-between"
            style={{ padding: '0 4px', marginBottom: '8px' }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              BUILDING FLOORS
            </span>
            <button
              onClick={() => onSelectFloor('ALL')}
              className="cursor-pointer transition-all"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '3px 10px',
                border: activeFloorView === 'ALL' ? '2px solid #0d7a5f' : '1px solid #d1fae5',
                background: activeFloorView === 'ALL' ? '#f0fdf4' : 'transparent',
                color: '#0d7a5f',
                whiteSpace: 'nowrap',
              }}
            >
              Show All (10)
            </button>
          </div>

          {floorsList.map((fl) => {
            const info = getFloorInfo(fl);
            const isSelected = activeFloorView === String(fl);

            if (isSelected) {
              return (
                <button
                  key={fl}
                  onClick={() => onSelectFloor('ALL')}
                  className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none"
                  style={{
                    height: '52px',
                    padding: '0 14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)',
                    boxShadow: '0 4px 16px -3px rgba(13, 122, 95, 0.35)',
                    color: '#ffffff',
                  }}
                >
                  <div className="flex items-center min-w-0 flex-1" style={{ gap: '10px' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontFamily: 'monospace',
                      }}
                    >
                      L{fl}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate" style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
                        {getOrdinalName(fl)}
                      </span>
                      <span className="truncate" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 400, lineHeight: 1.2 }}>
                        {info.themeName}
                      </span>
                    </div>
                  </div>
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.9)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {info.occupants}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={fl}
                onClick={() => onSelectFloor(String(fl))}
                className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none"
                style={{
                  height: '52px',
                  padding: '0 14px',
                  borderRadius: '14px',
                  background: 'transparent',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="flex items-center min-w-0 flex-1" style={{ gap: '10px' }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#f0fdf4',
                      border: '2px solid #a7f3d0',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#0d7a5f',
                      fontFamily: 'monospace',
                    }}
                  >
                    L{fl}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                      {getOrdinalName(fl)}
                    </span>
                    <span className="truncate" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400, lineHeight: 1.2 }}>
                      {info.themeName.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center shrink-0" style={{ gap: '6px' }}>
                  {info.status === 'hazard' ? (
                    <span
                      className="flex items-center"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ef4444',
                        gap: '3px',
                      }}
                    >
                      <Flame style={{ width: '13px', height: '13px', fill: '#fca5a5', color: '#ef4444' }} />
                      Fire
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#0d7a5f',
                        fontFamily: 'monospace',
                      }}
                    >
                      {info.occupants}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── SECTION: EMERGENCY EXITS ─── */}
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 4px',
              marginBottom: '8px',
            }}
          >
            EMERGENCY EXITS
          </div>

          {emergencyExits.map((exit) => (
            <button
              key={exit.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(exit.preset)}
              className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none"
              style={{
                height: '48px',
                padding: '0 14px',
                borderRadius: '14px',
                background: 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0fdf4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex items-center min-w-0 flex-1" style={{ gap: '12px' }}>
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #d1fae5',
                    color: '#0d7a5f',
                  }}
                >
                  <Milestone style={{ width: '16px', height: '16px' }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate" style={{ fontSize: '13px', fontWeight: 500, color: '#334155', lineHeight: 1.3 }}>
                    {exit.name}
                  </span>
                  <span className="truncate" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400, lineHeight: 1.2 }}>
                    Evacuation Core
                  </span>
                </div>
              </div>
              <span
                className="shrink-0"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0d7a5f',
                  whiteSpace: 'nowrap',
                }}
              >
                {exit.status}
              </span>
            </button>
          ))}
        </div>

        {/* ─── SECTION: ASSEMBLY MUSTER ZONES ─── */}
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 4px',
              marginBottom: '8px',
            }}
          >
            ASSEMBLY MUSTER ZONES
          </div>

          {musterPoints.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(zone.preset)}
              className="w-full flex items-center justify-between text-left cursor-pointer transition-all focus:outline-none"
              style={{
                height: '48px',
                padding: '0 14px',
                borderRadius: '14px',
                background: 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0fdf4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex items-center min-w-0 flex-1" style={{ gap: '12px' }}>
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #d1fae5',
                    color: '#0d7a5f',
                  }}
                >
                  <MapPin style={{ width: '16px', height: '16px' }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate" style={{ fontSize: '13px', fontWeight: 500, color: '#334155', lineHeight: 1.3 }}>
                    {zone.name}
                  </span>
                  <span className="truncate" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400, lineHeight: 1.2 }}>
                    {zone.loc}
                  </span>
                </div>
              </div>
              <span
                className="shrink-0"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                }}
              >
                Focus
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* ── Bottom Facility Info ── */}
      <div className="shrink-0" style={{ padding: '12px 16px 16px 16px' }}>
        <div
          className="flex items-center justify-between"
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div className="flex items-center min-w-0" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                color: '#0d7a5f',
              }}
            >
              <Building2 style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="min-w-0">
              <div className="truncate" style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                10 Floors • 100 Rooms
              </div>
              <div className="truncate" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, lineHeight: 1.2, marginTop: '1px' }}>
                Gross Area: 25,400 m²
              </div>
            </div>
          </div>
          <div className="relative flex shrink-0" style={{ width: '10px', height: '10px' }} title="System Operational">
            <span
              className="absolute animate-ping"
              style={{
                inset: 0,
                borderRadius: '50%',
                background: '#34d399',
                opacity: 0.75,
              }}
            />
            <span
              className="relative"
              style={{
                display: 'inline-flex',
                borderRadius: '50%',
                width: '10px',
                height: '10px',
                background: '#10b981',
              }}
            />
          </div>
        </div>
      </div>

    </aside>
  );
};
