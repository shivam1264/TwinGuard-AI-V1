import React, { useState } from 'react';
import {
  Box,
  Layers,
  ArrowUpDown,
  Video,
  Sliders,
  Building2,
  Navigation as NavigationIcon,
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
  Activity,
  FlameKindling
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
  const [activeTab, setActiveTab] = useState('BUILDING'); // 'BUILDING' or 'NAVIGATION'

  // Refined floor telemetry calculation
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
      themeName: theme.name,
      roomsCount: floorRooms.length
    };
  };

  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getOrdinalName = (num) => {
    const suffixes = { 1: '1st', 2: '2nd', 3: '3rd' };
    return `${suffixes[num] || `${num}th`} Floor`;
  };

  // Primary workspace view modes (Clean SaaS sidebar list)
  const viewItems = [
    { id: '3D_VIEW', label: '3D Digital Twin', icon: Box, meta: 'Facility' },
    { id: 'FLOOR_VIEW', label: 'Exploded BIM Floors', icon: Layers, meta: 'All Levels' },
    { id: 'STAIRS_FOCUS', label: 'Stairwell Cores', icon: Milestone, meta: 'Evac Routes' },
    { id: 'ELEVATORS', label: 'Elevator Shafts', icon: ArrowUpDown, meta: '3 Shafts' },
    { id: 'CCTV', label: 'CCTV Security Grid', icon: Video, action: onOpenCctv, meta: '100 Cams' },
    { id: 'SYSTEMS', label: 'Telemetry & Systems', icon: Activity, action: onOpenSystems, meta: 'Sensors' }
  ];

  // Emergency Escape Cores
  const evacCores = [
    { id: 'core_west', name: 'West Core (Stairwell A)', status: 'Clear', capacity: '60 pers/min', preset: 'STAIRS_FOCUS' },
    { id: 'core_east', name: 'East Core (Stairwell B)', status: 'Clear', capacity: '60 pers/min', preset: 'STAIRS_FOCUS' },
    { id: 'core_south', name: 'South Ground Exit (Core C)', status: 'Clear', capacity: '80 pers/min', preset: 'ENTRANCE' },
    { id: 'helipad', name: 'Rooftop Helipad (Air Evac)', status: 'Standby', capacity: 'Level 10 Rooftop', preset: 'FOCUS_HELIPAD' }
  ];

  // Assembly Muster Points
  const musterZones = [
    { id: 'MUSTER_A', name: 'Muster Zone A', location: 'West Plaza Gardens', capacity: '300 Cap', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_B', name: 'Muster Zone B', location: 'East Perimeter Park', capacity: '300 Cap', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_C', name: 'Muster Zone C', location: 'South Main Esplanade', capacity: '400 Cap', preset: 'ENTRANCE' }
  ];

  // ==========================================
  // 1. COLLAPSED RAIL VIEW (Width 60px)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-[60px] bg-white border-r border-slate-200 flex flex-col items-center py-3.5 px-2 gap-3 shrink-0 select-none transition-all duration-200 z-20">
        {/* Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-200 my-1" />

        {/* Primary View Icons */}
        <div className="flex flex-col gap-1.5 w-full items-center">
          {viewItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  onSelectMode(item.id);
                }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center relative transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {/* Minimal tooltip */}
                <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-6 h-px bg-slate-200 my-1" />

        {/* Floor Indicator */}
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-600 flex flex-col items-center justify-center transition-colors mt-auto cursor-pointer"
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">LVL</span>
          <span className="text-[11px] font-mono font-bold text-blue-600 leading-none">
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED PRO B2B SAAS SIDEBAR (Width 280px)
  // ==========================================
  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 select-none overflow-hidden transition-all duration-200 z-20 font-sans">
      
      {/* 1. FACILITY HEADER (Clean, Professional Brand Identity) */}
      <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-slate-900 tracking-tight leading-tight truncate">
              TwinGuard Facility
            </span>
            <span className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 truncate">
              10 Storeys • Commercial Twin
            </span>
          </div>
        </div>

        {/* Minimal Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title="Collapse panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* 2. REFINED SUB-NAVIGATION TABS (Vercel / Linear Style Segmented Bar) */}
      <div className="px-3 pt-3 pb-2 shrink-0 bg-white">
        <div className="bg-slate-100/80 p-0.5 rounded-lg flex items-center border border-slate-200/60">
          <button
            onClick={() => setActiveTab('BUILDING')}
            className={`flex-1 py-1.5 px-2 text-[12px] font-medium rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'BUILDING'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Building Views</span>
          </button>

          <button
            onClick={() => setActiveTab('NAVIGATION')}
            className={`flex-1 py-1.5 px-2 text-[12px] font-medium rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'NAVIGATION'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Exits & Safety</span>
          </button>
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-4">

        {/* ============================================================ */}
        {/* TAB 1: BUILDING VIEWS & LEVEL STACK                          */}
        {/* ============================================================ */}
        {activeTab === 'BUILDING' && (
          <>
            {/* Group A: Workspace Views */}
            <div className="flex flex-col gap-0.5">
              <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                WORKSPACE VIEWS
              </div>

              {viewItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMode === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.action) item.action();
                      onSelectMode(item.id);
                    }}
                    className={`h-9 px-2.5 rounded-lg text-[13px] flex items-center justify-between transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.meta && (
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded text-slate-400 ${isActive ? 'bg-blue-100/60 text-blue-700' : 'bg-slate-100'}`}>
                        {item.meta}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-slate-100" />

            {/* Group B: 10-Storey Architectural Levels (Clean BIM Tree Navigator) */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-2 pb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  FLOORS & OCCUPANCY
                </span>
                <button
                  onClick={() => onSelectFloor('ALL')}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeFloorView === 'ALL'
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All (10)
                </button>
              </div>

              {/* Floor Items List (Clean, Single-Row Elegance) */}
              <div className="flex flex-col gap-0.5">
                {floorsList.map((fl) => {
                  const info = getFloorInfo(fl);
                  const isSelected = activeFloorView === String(fl);

                  return (
                    <button
                      key={fl}
                      onClick={() => onSelectFloor(isSelected ? 'ALL' : String(fl))}
                      className={`h-9 px-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer group text-left ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-semibold border-l-2 border-blue-600 pl-2'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {/* Left: Level Tag + Clean Name */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className={`text-[11px] font-mono font-semibold px-1 py-0.5 rounded text-center shrink-0 ${
                          isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}>
                          L{fl}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className={`text-[12px] truncate ${isSelected ? 'font-semibold text-blue-900' : 'font-medium text-slate-800'}`}>
                            {getOrdinalName(fl)}
                          </span>
                          <span className="text-slate-300 font-light">•</span>
                          <span className="text-[11px] text-slate-400 font-normal truncate">
                            {info.themeName.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Right: Occupancy Number + Crisp Status Pip */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400 font-medium">
                          {info.occupants}
                        </span>

                        {/* Minimalist Status Pip (No goofy oversized rings) */}
                        {info.status === 'hazard' ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200 animate-pulse shrink-0" title="Active Fire Incident" />
                        ) : info.status === 'warning' ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Crowd Congestion" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Normal & Clear" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: EXITS, MUSTER POINTS & EVACUATION SAFETY              */}
        {/* ============================================================ */}
        {activeTab === 'NAVIGATION' && (
          <>
            {/* Section A: Emergency Evacuation Cores */}
            <div className="flex flex-col gap-1.5">
              <div className="px-2 pb-0.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                ESCAPE CORES & EXITS
              </div>

              {evacCores.map((core) => (
                <div
                  key={core.id}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[12px] font-medium text-slate-800 truncate">
                      {core.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{core.status}</span>
                      <span>•</span>
                      <span className="font-mono">{core.capacity}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSetCameraPreset && onSetCameraPreset(core.preset)}
                    className="px-2 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-600 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                    title="Focus camera"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-slate-100" />

            {/* Section B: Assembly Muster Zones */}
            <div className="flex flex-col gap-1.5">
              <div className="px-2 pb-0.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                ASSEMBLY MUSTER ZONES
              </div>

              {musterZones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[12px] font-medium text-slate-800">
                      {zone.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {zone.location} • <span className="font-medium text-slate-600">{zone.capacity}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSetCameraPreset && onSetCameraPreset(zone.preset)}
                    className="px-2 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-blue-600 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                    title="Focus camera"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-slate-100" />

            {/* Section C: Safety Systems Health */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                SAFETY TELEMETRY
              </div>
              <div className="flex flex-col gap-1.5 text-[12px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Routing Engine</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> A* Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Hydrant Pressure</span>
                  <button
                    onClick={() => onSetCameraPreset && onSetCameraPreset('FOCUS_HYDRANT')}
                    className="font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    6.5 Bar (Normal)
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* 4. REFINED BOTTOM FACILITY STATUS (Minimalist, Professional) */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[11px] font-medium text-slate-600">
            Digital Twin Synchronized
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 font-medium">
          25,400 m²
        </span>
      </div>

    </aside>
  );
};
