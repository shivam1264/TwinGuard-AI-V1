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

  // Primary workspace view modes (Exact replica of Reference Image 2)
  const menuItems = [
    { id: '3D_VIEW', label: 'Home', icon: Home, badge: null },
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
  // 1. COLLAPSED RAIL VIEW (Width 64px)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-[#f8faf9] border-r border-[#e2ede7] flex flex-col items-center py-4 px-2 gap-3 shrink-0 select-none transition-all duration-200 z-20">
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
                    ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25'
                    : 'bg-[#e8f7f2] text-[#0d7a5f] hover:bg-[#d6f2e8] border border-[#d1f2e8]'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />

                {/* Floating Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#133d36] text-white text-[11px] font-semibold rounded-lg shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
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
          <span className="text-xs font-black text-[#0d7a5f] leading-tight font-mono">
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED FULL VIEW (Spacious Sides, Clean Float, Exact Image 2 Match!)
  // ==========================================
  return (
    <aside className="w-[320px] bg-[#f8faf9] border-r border-[#e2ede7] flex flex-col shrink-0 select-none overflow-hidden transition-all duration-200 z-20 font-sans">
      
      {/* Top Header Row with Generous Side Margins */}
      <div className="pt-5 px-5 pb-3 flex items-center justify-between shrink-0 bg-transparent">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0d7a5f] shrink-0" />
          <span className="text-[13px] font-extrabold text-[#133d36] tracking-tight truncate">
            TwinGuard AI • Digital Twin
          </span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-xl bg-white hover:bg-[#e8f7f2] text-[#648782] hover:text-[#0d7a5f] border border-[#e2ede7] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
          title="Collapse Panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body: no-scrollbar (Scrolls freely with ZERO ugly scrollbars cutting the side!) */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 flex flex-col gap-4">

        {/* ============================================================ */}
        {/* SECTION 1: MAIN MENU (Primary Workspace Views)               */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2">
          <div className="px-2 text-[11px] font-bold text-[#608078] uppercase tracking-wider mb-0.5">
            MAIN MENU
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            if (isActive) {
              // ACTIVE ITEM: Bold Emerald Pill Capsule (Matching Image 2 Home Item!)
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    onSelectMode(item.id);
                  }}
                  className="w-full bg-[#0d7a5f] text-white rounded-2xl h-[52px] px-3.5 flex items-center justify-between shadow-md shadow-[#0d7a5f]/25 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                    <div className="w-10 h-10 rounded-xl border border-white/25 bg-white/10 flex items-center justify-center text-white shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-[15px] text-white truncate">
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
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
                className="w-full h-[52px] flex items-center justify-between px-3.5 rounded-2xl hover:bg-[#ebf6f1] transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#e6f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="font-semibold text-[15px] text-[#133d36] truncate">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className="bg-[#d1fae5] text-[#065f46] text-xs font-bold px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle Mint Divider with Clean Side Insets */}
        <div className="h-px bg-[#e0f0ea] my-1 mx-2" />

        {/* ============================================================ */}
        {/* SECTION 2: BUILDING FLOORS (L10 down to L1)                 */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2">
          <div className="px-2 flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-bold text-[#608078] uppercase tracking-wider">
              BUILDING FLOORS
            </span>
            <button
              onClick={() => onSelectFloor('ALL')}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
                  className="w-full bg-[#0d7a5f] text-white rounded-2xl h-[52px] px-3.5 flex items-center justify-between shadow-md shadow-[#0d7a5f]/25 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                    <div className="w-10 h-10 rounded-xl border border-white/25 bg-white/10 flex items-center justify-center text-white font-mono font-bold text-xs shrink-0">
                      L{fl}
                    </div>
                    <div className="flex flex-col min-w-0 truncate">
                      <span className="font-bold text-[14.5px] text-white leading-tight truncate">
                        {getOrdinalName(fl)}
                      </span>
                      <span className="text-[11px] text-white/80 font-medium truncate leading-none mt-0.5">
                        {info.themeName}
                      </span>
                    </div>
                  </div>

                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full shrink-0 font-mono whitespace-nowrap">
                    {info.occupants}
                  </span>
                </button>
              );
            }

            // Inactive Floor: Squircle Mint Badge + Room to Breathe
            return (
              <button
                key={fl}
                onClick={() => onSelectFloor(String(fl))}
                className="w-full h-[52px] flex items-center justify-between px-3.5 rounded-2xl hover:bg-[#ebf6f1] transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#e6f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] font-mono font-bold text-xs shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                    L{fl}
                  </div>
                  <div className="flex flex-col min-w-0 truncate">
                    <span className="font-semibold text-[14.5px] text-[#133d36] leading-tight truncate">
                      {getOrdinalName(fl)}
                    </span>
                    <span className="text-[11px] text-[#648782] font-normal truncate leading-none mt-0.5">
                      {info.themeName.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Right Status / Count Badge */}
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  {info.status === 'hazard' ? (
                    <span className="bg-[#ffe4e6] text-[#be123c] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs animate-pulse shrink-0 whitespace-nowrap">
                      <Flame className="w-3.5 h-3.5 fill-[#be123c]" />
                      <span>Fire</span>
                    </span>
                  ) : (
                    <span className="bg-[#d1fae5] text-[#065f46] text-xs font-bold px-3 py-1 rounded-full font-mono shrink-0 whitespace-nowrap">
                      {info.occupants}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subtle Mint Divider */}
        <div className="h-px bg-[#e0f0ea] my-1 mx-2" />

        {/* ============================================================ */}
        {/* SECTION 3: SAFETY & EMERGENCY EXITS                         */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2">
          <div className="px-2 text-[11px] font-bold text-[#608078] uppercase tracking-wider mb-0.5">
            EMERGENCY EXITS
          </div>

          {emergencyExits.map((exit) => (
            <button
              key={exit.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(exit.preset)}
              className="w-full h-[52px] flex items-center justify-between px-3.5 rounded-2xl hover:bg-[#ebf6f1] transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#e6f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                  <Milestone className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-semibold text-[13.5px] text-[#133d36] truncate leading-tight">
                    {exit.name}
                  </span>
                  <span className="text-[11px] text-[#648782] font-normal leading-none mt-0.5">
                    Evacuation Core
                  </span>
                </div>
              </div>

              <span className="bg-[#d1fae5] text-[#065f46] text-xs font-bold px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                {exit.status}
              </span>
            </button>
          ))}
        </div>

        {/* Assembly Muster Zones */}
        <div className="flex flex-col gap-2">
          <div className="px-2 text-[11px] font-bold text-[#608078] uppercase tracking-wider mb-0.5">
            ASSEMBLY MUSTER ZONES
          </div>

          {musterPoints.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSetCameraPreset && onSetCameraPreset(zone.preset)}
              className="w-full h-[52px] flex items-center justify-between px-3.5 rounded-2xl hover:bg-[#ebf6f1] transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#e6f7f2] border border-[#d1f2e8] flex items-center justify-center text-[#0d7a5f] shrink-0 group-hover:bg-[#dbf3ea] transition-colors">
                  <MapPin className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-semibold text-[13.5px] text-[#133d36] truncate leading-tight">
                    {zone.name}
                  </span>
                  <span className="text-[11px] text-[#648782] font-normal leading-none mt-0.5 truncate">
                    {zone.loc}
                  </span>
                </div>
              </div>

              <span className="bg-[#e6f7f2] text-[#0d7a5f] text-xs font-bold px-3 py-1 rounded-full shrink-0 border border-[#d1f2e8] whitespace-nowrap">
                Focus
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* BOTTOM FACILITY TELEMETRY CARD */}
      <div className="p-3.5 mx-4 mb-4 rounded-2xl bg-white border border-[#d1f2e8] shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#e6f7f2] text-[#0d7a5f] flex items-center justify-center shrink-0 border border-[#d1f2e8]">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold text-[#133d36] leading-tight truncate">
              10 Floors • 100 Rooms
            </div>
            <div className="text-[10.5px] text-[#648782] font-medium truncate mt-0.5">
              Gross Area: 25,400 m²
            </div>
          </div>
        </div>

        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#a7f3d0] shrink-0" title="System Operational" />
      </div>

    </aside>
  );
};
