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

  // Primary workspace view modes (Exact replica of Reference Image with clean SaaS items)
  const menuItems = [
    { id: '3D_VIEW', label: 'Home View (3D)', icon: Home, badge: null },
    { id: 'FLOOR_VIEW', label: 'Floor Stack (BIM)', icon: Layers, badge: '10' },
    { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, badge: '3' },
    { id: 'ELEVATORS', label: 'Elevator Shafts', icon: ArrowUpDown, badge: '3' },
    { id: 'CCTV', label: 'CCTV Monitoring', icon: Video, action: onOpenCctv, badge: '100' },
    { id: 'SYSTEMS', label: 'Sensor Telemetry', icon: Activity, action: onOpenSystems, badge: 'Live' }
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
  // 1. COLLAPSED RAIL VIEW (Width 64px - Glassmorphism)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 glass-sidebar flex flex-col items-center py-4 px-2 gap-3 shrink-0 select-none transition-all duration-200 z-20">
        {/* Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white/80 hover:bg-[#e8f7f2] text-[#0d7a5f] border border-[#d1f2e8] flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="Expand Left Panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[#e2ede7]/80 my-0.5" />

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
                    ? 'glass-item-active text-white'
                    : 'glass-squircle text-[#0d7a5f] hover:bg-[#d8f4eb]'
                }`}
                title={item.label}
              >
                <Icon className="w-4.5 h-4.5" />

                {/* Floating Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#133d36] text-white text-[11px] font-semibold rounded-lg shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-8 h-px bg-[#e2ede7]/80 my-0.5" />

        {/* Mini Floor Indicator Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white/80 hover:bg-[#e8f7f2] text-[#0d7a5f] border border-[#d1f2e8] flex flex-col items-center justify-center transition-all mt-auto cursor-pointer shadow-xs"
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span className="text-[7px] font-bold text-[#648782] uppercase leading-none">LVL</span>
          <span className="text-xs font-black text-[#0d7a5f] leading-tight font-mono">
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED FULL VIEW (Every item is a clean card completely inside the sidebar!)
  // ==========================================
  return (
    <aside className="w-[320px] max-w-[320px] glass-sidebar flex flex-col shrink-0 select-none overflow-hidden transition-all duration-200 z-20 font-sans">
      
      {/* Top Header Row with Generous Side Margins */}
      <div className="pt-4 px-4 pb-3 flex items-center justify-between shrink-0 bg-transparent border-b border-[#e2ede7]/60">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0d7a5f] shadow-xs shadow-[#0d7a5f]/40 shrink-0" />
          <span className="text-[13px] font-extrabold text-[#133d36] tracking-tight truncate">
            TwinGuard AI • Digital Twin
          </span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-xl bg-white/75 hover:bg-[#e8f7f2] text-[#648782] hover:text-[#0d7a5f] border border-[#d1f2e8]/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
          title="Collapse Panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body: no-scrollbar with safe px-4 margins */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar px-4 py-2.5 flex flex-col gap-2.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >

        {/* ============================================================ */}
        {/* SECTION 1: MAIN MENU (Every item is an enclosed Card)        */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 text-[10.5px] font-bold text-[#648782] uppercase tracking-wider mb-0.5">
            MAIN MENU
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            if (isActive) {
              // ACTIVE ITEM: Rich Emerald Glass Capsule (Everything 100% inside card)
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    onSelectMode(item.id);
                  }}
                  className="w-full glass-item-active text-white rounded-2xl h-[50px] px-3.5 flex items-center justify-between shadow-md shadow-[#0d7a5f]/25 transition-all cursor-pointer text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <div className="w-9 h-9 rounded-xl border border-white/25 bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="font-bold text-[13.5px] text-white truncate tracking-tight">
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className="bg-white/25 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap border border-white/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            // INACTIVE ITEM: Frosted Glass Card + Squircle Mint Icon + Pill Badge (Everything 100% inside card)
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className="w-full glass-item rounded-2xl h-[50px] px-3.5 flex items-center justify-between transition-all cursor-pointer group text-left focus:outline-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-xl glass-squircle flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <span className="font-semibold text-[13px] text-[#133d36] group-hover:text-[#0a4d3c] truncate tracking-tight">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className="glass-pill text-[#065f46] text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle Glass Gradient Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#d1ede4]/90 to-transparent my-0.5 mx-2" />

        {/* ============================================================ */}
        {/* SECTION 2: BUILDING FLOORS (Every floor is an enclosed Card) */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 flex items-center justify-between mb-0.5">
            <span className="text-[10.5px] font-bold text-[#648782] uppercase tracking-wider">
              BUILDING FLOORS
            </span>
            <button
              onClick={() => onSelectFloor('ALL')}
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeFloorView === 'ALL'
                  ? 'glass-item-active text-white shadow-xs'
                  : 'glass-pill text-[#065f46] hover:bg-[#bbf7d0]'
              }`}
            >
              Show All (10)
            </button>
          </div>

          {floorsList.map((fl) => {
            const info = getFloorInfo(fl);
            const isSelected = activeFloorView === String(fl);

            if (isSelected) {
              // Active Floor Selected: Rich Emerald Glass Capsule
              return (
                <button
                  key={fl}
                  onClick={() => onSelectFloor('ALL')}
                  className="w-full glass-item-active text-white rounded-2xl h-[50px] px-3.5 flex items-center justify-between shadow-md shadow-[#0d7a5f]/25 transition-all cursor-pointer text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <div className="w-9 h-9 rounded-xl border border-white/25 bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-mono font-bold text-xs shrink-0">
                      L{fl}
                    </div>
                    <div className="flex flex-col min-w-0 truncate">
                      <span className="font-bold text-[13.5px] text-white leading-tight truncate">
                        {getOrdinalName(fl)}
                      </span>
                      <span className="text-[10.5px] text-white/80 font-medium truncate leading-none mt-0.5">
                        {info.themeName}
                      </span>
                    </div>
                  </div>

                  <span className="bg-white/25 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 font-mono whitespace-nowrap border border-white/30">
                    {info.occupants}
                  </span>
                </button>
              );
            }

            // Inactive Floor: Frosted Glass Card with Pill Badge (100% inside card)
            return (
              <button
                key={fl}
                onClick={() => onSelectFloor(String(fl))}
                className="w-full glass-item rounded-2xl h-[50px] px-3.5 flex items-center justify-between transition-all cursor-pointer group text-left focus:outline-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-xl glass-squircle flex items-center justify-center text-[#0d7a5f] font-mono font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    L{fl}
                  </div>
                  <div className="flex flex-col min-w-0 truncate">
                    <span className="font-semibold text-[13px] text-[#133d36] group-hover:text-[#0a4d3c] leading-tight truncate">
                      {getOrdinalName(fl)}
                    </span>
                    <span className="text-[10.5px] text-[#648782] font-normal truncate leading-none mt-0.5">
                      {info.themeName.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Right Status / Count Badge */}
                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  {info.status === 'hazard' ? (
                    <span className="glass-pill-danger text-[#be123c] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse shrink-0 whitespace-nowrap">
                      <Flame className="w-3.5 h-3.5 fill-[#be123c]" />
                      <span>Fire</span>
                    </span>
                  ) : (
                    <span className="glass-pill text-[#065f46] text-xs font-bold px-2.5 py-0.5 rounded-full font-mono shrink-0 whitespace-nowrap shadow-2xs">
                      {info.occupants}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subtle Glass Gradient Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#d1ede4]/90 to-transparent my-0.5 mx-2" />

        {/* ============================================================ */}
        {/* SECTION 3: EMERGENCY EXITS (Every exit is an enclosed Card)  */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 text-[10.5px] font-bold text-[#648782] uppercase tracking-wider mb-0.5">
            EMERGENCY EXITS
          </div>

          {emergencyExits.map((exit) => (
            <button
              key={exit.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(exit.preset)}
              className="w-full glass-item rounded-2xl h-[50px] px-3.5 flex items-center justify-between transition-all cursor-pointer group text-left focus:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <div className="w-9 h-9 rounded-xl glass-squircle flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:scale-105 transition-transform">
                  <Milestone className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-semibold text-[13px] text-[#133d36] group-hover:text-[#0a4d3c] truncate leading-tight">
                    {exit.name}
                  </span>
                  <span className="text-[10.5px] text-[#648782] font-normal leading-none mt-0.5">
                    Evacuation Core
                  </span>
                </div>
              </div>

              <span className="glass-pill text-[#065f46] text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                {exit.status}
              </span>
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* SECTION 4: ASSEMBLY MUSTER ZONES (Every zone is a Card)      */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-1.5">
          <div className="px-1 text-[10.5px] font-bold text-[#648782] uppercase tracking-wider mb-0.5">
            ASSEMBLY MUSTER ZONES
          </div>

          {musterPoints.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(zone.preset)}
              className="w-full glass-item rounded-2xl h-[50px] px-3.5 flex items-center justify-between transition-all cursor-pointer group text-left focus:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <div className="w-9 h-9 rounded-xl glass-squircle flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-semibold text-[13px] text-[#133d36] group-hover:text-[#0a4d3c] truncate leading-tight">
                    {zone.name}
                  </span>
                  <span className="text-[10.5px] text-[#648782] font-normal leading-none mt-0.5 truncate">
                    {zone.loc}
                  </span>
                </div>
              </div>

              <span className="glass-squircle text-[#0d7a5f] text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                Focus
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* BOTTOM FACILITY TELEMETRY CARD - Sits safely inside with mx-4 margin */}
      <div className="p-3 mx-4 mb-3.5 rounded-2xl glass-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl glass-squircle text-[#0d7a5f] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-bold text-[#133d36] leading-tight truncate">
              10 Floors • 100 Rooms
            </div>
            <div className="text-[10px] text-[#648782] font-medium truncate mt-0.5">
              Gross Area: 25,400 m²
            </div>
          </div>
        </div>

        <div className="relative flex h-2.5 w-2.5 shrink-0 mr-1" title="System Operational">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-emerald-200"></span>
        </div>
      </div>

    </aside>
  );
};
