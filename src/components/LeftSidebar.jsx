import React, { useState } from 'react';
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
  Eye,
  Bell,
  Sliders,
  LogOut,
  FileText,
  CreditCard,
  UserPlus
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
  // Determine floor info and occupant telemetry
  const getFloorInfo = (floorNum) => {
    const floorRooms = rooms.filter((r) => r.floor === floorNum);
    const floorHasFire = floorRooms.some((r) => r.hasFire);
    const totalOccupants = floorRooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
    const theme = FLOOR_THEMES[floorNum] || { name: `${floorNum}th Floor`, prefix: `L${floorNum}` };

    let status = 'safe';
    if (floorHasFire) status = 'hazard';
    else if (totalOccupants > 35) status = 'warning';

    return {
      status,
      occupants: totalOccupants,
      themeName: theme.name
    };
  };

  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getOrdinalName = (num) => {
    const suffixes = { 1: '1st', 2: '2nd', 3: '3rd' };
    return `${suffixes[num] || `${num}th`} Floor`;
  };

  // Primary workspace view modes (Matching Image 2 exact styling)
  const menuItems = [
    { id: '3D_VIEW', label: 'Home View (3D)', icon: Home, badge: null },
    { id: 'FLOOR_VIEW', label: 'BIM Floor Stack', icon: Layers, badge: '10 Lvl' },
    { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, badge: '3 Cores' },
    { id: 'ELEVATORS', label: 'Elevator Shafts', icon: ArrowUpDown, badge: '3' },
    { id: 'CCTV', label: 'CCTV Monitoring', icon: Video, action: onOpenCctv, badge: '100' },
    { id: 'SYSTEMS', label: 'Sensor Telemetry', icon: Activity, action: onOpenSystems, badge: 'IoT' }
  ];

  // Emergency Escape Cores & Muster Zones
  const emergencyExits = [
    { id: 'core_west', name: 'West Core (Stairwell A)', status: 'Clear', preset: 'STAIRS_FOCUS' },
    { id: 'core_east', name: 'East Core (Stairwell B)', status: 'Clear', preset: 'STAIRS_FOCUS' },
    { id: 'core_south', name: 'South Ground Exit (Core C)', status: 'Clear', preset: 'ENTRANCE' },
    { id: 'helipad', name: 'Rooftop Helipad (Air Evac)', status: 'Standby', preset: 'FOCUS_HELIPAD' }
  ];

  const musterPoints = [
    { id: 'MUSTER_A', name: 'Muster Zone A', loc: 'West Plaza', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_B', name: 'Muster Zone B', loc: 'East Park', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_C', name: 'Muster Zone C', loc: 'South Esplanade', preset: 'ENTRANCE' }
  ];

  // ==========================================
  // 1. COLLAPSED RAIL VIEW (Width 64px)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-[#f8faf9] border-r border-[#e2ede7] flex flex-col items-center py-4 px-2 gap-3.5 shrink-0 select-none transition-all duration-300 z-20">
        {/* Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white hover:bg-[#e8f7f2] text-[#0d7a5f] border border-[#d1f2e8] flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="Expand Left Panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[#e2ede7] my-0.5" />

        {/* Squircle Icons Rail */}
        <div className="flex flex-col gap-2 w-full items-center">
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
                className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#0d7a5f] text-white shadow-md shadow-[#0d7a5f]/25'
                    : 'bg-[#e8f7f2] text-[#0d7a5f] hover:bg-[#d6f2e8] border border-[#d1f2e8]'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />

                {/* Floating Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#133d36] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-8 h-px bg-[#e2ede7] my-0.5" />

        {/* Mini Floor Indicator Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white hover:bg-[#e8f7f2] text-[#0d7a5f] border border-[#d1f2e8] flex flex-col items-center justify-center transition-all mt-auto cursor-pointer shadow-xs"
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span className="text-[7px] font-bold text-[#648782] uppercase leading-none">LVL</span>
          <span className="text-xs font-black text-[#0d7a5f] leading-tight mt-0.5 font-mono">
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED FULL VIEW (Matches Image 2 Exact Look!)
  // ==========================================
  return (
    <aside className="w-[290px] bg-[#f8faf9] border-r border-[#e2ede7] flex flex-col shrink-0 select-none overflow-hidden transition-all duration-300 z-20 font-sans">
      
      {/* Top Header Row with Minimalist Collapse Button */}
      <div className="pt-4 px-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0d7a5f]" />
          <span className="text-[12px] font-extrabold text-[#133d36] tracking-tight">
            TwinGuard AI • Digital Twin
          </span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-xl bg-white hover:bg-[#e8f7f2] text-[#648782] hover:text-[#0d7a5f] border border-[#e2ede7] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          title="Collapse Panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4">

        {/* ============================================================ */}
        {/* SECTION 1: MAIN MENU (Primary Workspace Views)               */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 text-[11px] font-bold text-[#648782] uppercase tracking-wider mb-0.5">
            MAIN MENU
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            if (isActive) {
              // ACTIVE ITEM: Bold Emerald Pill Capsule with White Outline Icon (Matching Image 2 Home Item!)
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    onSelectMode(item.id);
                  }}
                  className="w-full bg-[#0d7a5f] text-white rounded-2xl p-2 px-3 flex items-center justify-between shadow-lg shadow-[#0d7a5f]/20 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl border border-white/25 bg-white/10 flex items-center justify-center text-white shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-[14px] text-white truncate">
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            // INACTIVE ITEM: Squircle Mint Icon + Dark Text + Soft Mint Count Pill (Matching Image 2 Patients Item!)
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className="w-full flex items-center justify-between p-1.5 px-2 rounded-2xl hover:bg-[#eaf5f0] transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#e8f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="font-semibold text-[14px] text-[#133d36] truncate">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className="bg-[#d1fae5] text-[#065f46] text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle Mint Divider */}
        <div className="h-px bg-[#e0f0ea] my-1" />

        {/* ============================================================ */}
        {/* SECTION 2: BUILDING FLOORS (L10 down to L1)                 */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-bold text-[#648782] uppercase tracking-wider">
              BUILDING FLOORS
            </span>
            <button
              onClick={() => onSelectFloor('ALL')}
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                activeFloorView === 'ALL'
                  ? 'bg-[#0d7a5f] text-white shadow-xs'
                  : 'bg-[#d1fae5] text-[#065f46] hover:bg-[#bbf7d0]'
              }`}
            >
              Show All (10)
            </button>
          </div>

          {floorsList.map((fl) => {
            const info = getFloorInfo(fl);
            const isSelected = activeFloorView === String(fl);

            if (isSelected) {
              // Active Floor Selected: Rich Emerald Capsule
              return (
                <button
                  key={fl}
                  onClick={() => onSelectFloor('ALL')}
                  className="w-full bg-[#0d7a5f] text-white rounded-2xl p-2 px-3 flex items-center justify-between shadow-lg shadow-[#0d7a5f]/20 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl border border-white/25 bg-white/10 flex items-center justify-center text-white font-mono font-bold text-xs shrink-0">
                      L{fl}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[14px] text-white leading-tight truncate">
                        {getOrdinalName(fl)}
                      </span>
                      <span className="text-[11px] text-white/80 font-medium truncate leading-none mt-0.5">
                        {info.themeName}
                      </span>
                    </div>
                  </div>

                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 font-mono">
                    {info.occupants}
                  </span>
                </button>
              );
            }

            // Inactive Floor: Squircle Mint Badge with Level Number + Occupant Count Pill
            return (
              <button
                key={fl}
                onClick={() => onSelectFloor(String(fl))}
                className="w-full flex items-center justify-between p-1.5 px-2 rounded-2xl hover:bg-[#eaf5f0] transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#e8f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] font-mono font-bold text-xs shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                    L{fl}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[14px] text-[#133d36] leading-tight truncate">
                      {getOrdinalName(fl)}
                    </span>
                    <span className="text-[11px] text-[#648782] font-medium truncate leading-none mt-0.5">
                      {info.themeName.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Right Status / Count Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {info.status === 'hazard' ? (
                    <span className="bg-[#ffe4e6] text-[#be123c] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                      <Flame className="w-3 h-3 fill-[#be123c]" />
                      <span>Fire</span>
                    </span>
                  ) : (
                    <span className="bg-[#d1fae5] text-[#065f46] text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {info.occupants}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subtle Mint Divider */}
        <div className="h-px bg-[#e0f0ea] my-1" />

        {/* ============================================================ */}
        {/* SECTION 3: SAFETY & EMERGENCY EXITS                         */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 text-[11px] font-bold text-[#648782] uppercase tracking-wider mb-0.5">
            EMERGENCY EXITS
          </div>

          {emergencyExits.map((exit) => (
            <button
              key={exit.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(exit.preset)}
              className="w-full flex items-center justify-between p-1.5 px-2 rounded-2xl hover:bg-[#eaf5f0] transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#e8f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                  <Milestone className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-[13px] text-[#133d36] truncate leading-tight">
                    {exit.name}
                  </span>
                  <span className="text-[11px] text-[#648782] font-medium leading-none mt-0.5">
                    Evacuation Core
                  </span>
                </div>
              </div>

              <span className="bg-[#d1fae5] text-[#065f46] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                {exit.status}
              </span>
            </button>
          ))}
        </div>

        {/* Muster Zones */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 text-[11px] font-bold text-[#648782] uppercase tracking-wider mb-0.5">
            ASSEMBLY MUSTER ZONES
          </div>

          {musterPoints.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(zone.preset)}
              className="w-full flex items-center justify-between p-1.5 px-2 rounded-2xl hover:bg-[#eaf5f0] transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#e8f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                  <MapPin className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-[13px] text-[#133d36] truncate leading-tight">
                    {zone.name}
                  </span>
                  <span className="text-[11px] text-[#648782] font-medium leading-none mt-0.5">
                    {zone.loc}
                  </span>
                </div>
              </div>

              <span className="bg-[#e8f7f2] text-[#0d7a5f] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border border-[#d1f2e8]">
                Focus
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* BOTTOM FACILITY TELEMETRY CARD (Matching Image 2 Bottom Pill Style) */}
      <div className="p-3 mx-4 mb-4 rounded-2xl bg-white border border-[#d1f2e8] shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#e8f7f2] text-[#0d7a5f] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#133d36] leading-tight">
              10 Floors • 100 Rooms
            </div>
            <div className="text-[10px] text-[#648782] font-medium">
              Gross Area: 25,400 m²
            </div>
          </div>
        </div>

        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#a7f3d0] shrink-0" title="System Operational" />
      </div>

    </aside>
  );
};
