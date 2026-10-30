import React, { useState } from 'react';
import {
  Box,
  Layers,
  ArrowUpDown,
  Video,
  Sliders,
  Building,
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
  Maximize2
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
  const [topTab, setTopTab] = useState('BUILDING'); // 'BUILDING' or 'NAVIGATION'

  // Determine status & occupant telemetry for each floor
  const getFloorInfo = (floorNum) => {
    const floorRooms = rooms.filter(r => r.floor === floorNum);
    const floorHasFire = floorRooms.some(r => r.hasFire);
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

  const menuItems = [
    { id: '3D_VIEW', label: '3D View', icon: Box, desc: 'Overall Facility' },
    { id: 'FLOOR_VIEW', label: 'Floor View', icon: Layers, desc: 'BIM Stack' },
    { id: 'STAIRS_FOCUS', label: 'Stairwells', icon: Milestone, desc: 'Evac Cores' },
    { id: 'ELEVATORS', label: 'Elevators', icon: ArrowUpDown, desc: 'Shaft Bank' },
    { id: 'CCTV', label: 'CCTV', icon: Video, action: onOpenCctv, desc: '100 Cameras' },
    { id: 'SYSTEMS', label: 'Systems', icon: Sliders, action: onOpenSystems, desc: 'IoT Telemetry' }
  ];

  // Muster Assembly Zones Data
  const musterZones = [
    { id: 'MUSTER_A', name: 'Muster Zone A', loc: 'West Plaza Garden', cap: '300 Pers', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_B', name: 'Muster Zone B', loc: 'East Perimeter Park', cap: '300 Pers', preset: 'FOCUS_MUSTER_A' },
    { id: 'MUSTER_C', name: 'Muster Zone C', loc: 'South Main Esplanade', cap: '400 Pers', preset: 'ENTRANCE' }
  ];

  // Core Emergency Escape Routes
  const evacCores = [
    { id: 'core_west', name: 'West Core (Stairwell A)', status: 'Clear & Open', cap: '60/min', preset: 'STAIRS_FOCUS' },
    { id: 'core_east', name: 'East Core (Stairwell B)', status: 'Clear & Open', cap: '60/min', preset: 'STAIRS_FOCUS' },
    { id: 'core_south', name: 'South Ground Exit (Core C)', status: 'Clear & Open', cap: '80/min', preset: 'ENTRANCE' },
    { id: 'helipad', name: 'Rooftop Helipad (Air Evac)', status: 'Standby Ready', cap: 'Level 10', preset: 'FOCUS_HELIPAD' }
  ];

  // ==========================================
  // 1. COLLAPSED RAIL VIEW (Width 64px / w-16)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-slate-200/90 flex flex-col items-center py-3.5 px-2 gap-3.5 shrink-0 select-none transition-all duration-300 ease-in-out shadow-xs z-20">
        {/* Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200/90 flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="Expand Left Navigation Panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-8 border-t border-slate-200/80 my-0.5" />

        {/* 6 Core Navigation Icons */}
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />

                {/* Floating tooltip on hover */}
                <span className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-8 border-t border-slate-200/80 my-0.5" />

        {/* Mini Active Floor Indicator */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/90 flex flex-col items-center justify-center transition-all mt-auto cursor-pointer"
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">LVL</span>
          <span className="text-xs font-black text-blue-600 leading-tight mt-0.5">
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED FULL VIEW (Width 320px / w-80)
  // ==========================================
  return (
    <aside className="w-80 bg-slate-50/70 border-r border-slate-200/90 flex flex-col shrink-0 select-none overflow-hidden transition-all duration-300 ease-in-out shadow-xs z-20">
      
      {/* HEADER SECTION (Tabs + Collapse Button) */}
      <div className="p-3.5 pb-2.5 bg-white border-b border-slate-200/80 flex items-center gap-2.5 shrink-0">
        {/* Modern Segmented Switcher */}
        <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70 flex-1">
          <button
            onClick={() => setTopTab('BUILDING')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              topTab === 'BUILDING'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Building</span>
          </button>

          <button
            onClick={() => setTopTab('NAVIGATION')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              topTab === 'NAVIGATION'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <NavigationIcon className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </button>
        </div>

        {/* Panel Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200/80 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
          title="Collapse Left Panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* SCROLLABLE MAIN BODY */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 flex flex-col gap-3.5">

        {/* ============================================================ */}
        {/* TAB 1: BUILDING PERSPECTIVES & 10-STOREY ARCHITECTURAL STACK */}
        {/* ============================================================ */}
        {topTab === 'BUILDING' && (
          <>
            {/* Quick 3D View Modes (2x3 Grid for Clean Polish) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 pb-2">
                VIEW PERSPECTIVES
              </div>
              <div className="grid grid-cols-2 gap-1.5">
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
                      className={`px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FLOORS SECTION (L10 down to L1 with High-Fidelity Details) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col flex-1 min-h-[360px]">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    LEVELS & OCCUPANCY
                  </span>
                </div>
                <button
                  onClick={() => onSelectFloor('ALL')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    activeFloorView === 'ALL'
                      ? 'text-blue-600 bg-blue-50 border border-blue-200/90 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Show all floors combined"
                >
                  Show All (10)
                </button>
              </div>

              {/* 10-Floor Stack List */}
              <div className="flex flex-col gap-1 overflow-y-auto pr-0.5">
                {floorsList.map((fl) => {
                  const info = getFloorInfo(fl);
                  const isSelected = activeFloorView === String(fl);

                  return (
                    <button
                      key={fl}
                      onClick={() => onSelectFloor(isSelected ? 'ALL' : String(fl))}
                      className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/90 text-blue-900 border-2 border-blue-600 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50/90 hover:text-slate-900 border border-transparent hover:border-slate-200/70'
                      }`}
                    >
                      {/* Left: Floor Level Badge & Name */}
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={`font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded-md shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          L{fl}
                        </span>
                        <div className="flex flex-col text-left truncate">
                          <span className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {getOrdinalName(fl)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate leading-none mt-0.5">
                            {info.themeName}
                          </span>
                        </div>
                      </div>

                      {/* Right: Occupancy Count & Status Dot (Strictly Inside Bounds, Zero Clipping!) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Occupancy pill */}
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5 text-slate-400" />
                          <span>{info.occupants}</span>
                        </span>

                        {/* Status Indicator Dot */}
                        {info.status === 'hazard' ? (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 animate-pulse shrink-0"
                            title="Active Fire Incident"
                          />
                        ) : info.status === 'warning' ? (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200 shrink-0"
                            title="High Crowd Density (>35 Occupants)"
                          />
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"
                            title="Safe & Operational"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FACILITY ARCHITECTURE INFO CARD */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3 shrink-0 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  FACILITY ARCHITECTURE
                </div>
                <div className="text-xs font-extrabold text-slate-800 leading-tight mt-0.5 truncate">
                  10 Floors • 100 Rooms • 3 Cores
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                  <span>Gross: 25,400 m²</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-emerald-600 font-semibold">NFPA 101 Safe</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: EVACUATION NAVIGATION & ESCAPE CORRIDORS              */}
        {/* ============================================================ */}
        {topTab === 'NAVIGATION' && (
          <>
            {/* 1. Emergency Evacuation Cores */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Milestone className="w-4 h-4 text-emerald-600" />
                  <span>EMERGENCY ESCAPE CORES</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80">
                  3 ACTIVE
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {evacCores.map((core) => (
                  <div
                    key={core.id}
                    className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {core.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{core.status}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{core.cap}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSetCameraPreset && onSetCameraPreset(core.preset)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                      title="Fly camera to this exit"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Safe Assembly Muster Points */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>ASSEMBLY MUSTER ZONES</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200/80">
                  GROUND PLAZA
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {musterZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800">
                        {zone.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                        {zone.loc} • <b className="text-emerald-700">{zone.cap}</b>
                      </div>
                    </div>

                    <button
                      onClick={() => onSetCameraPreset && onSetCameraPreset(zone.preset)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                      title="Fly camera to this muster assembly point"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Navigation Intelligence Summary */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                SAFETY & ROUTING INTELLIGENCE
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Dynamic Path Optimization</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled (A*)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Hazard Rerouting</span>
                  <span className="font-bold text-blue-600">Sub-second Auto</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Fire Hydrant Pressure</span>
                  <button
                    onClick={() => onSetCameraPreset && onSetCameraPreset('FOCUS_HYDRANT')}
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    6.5 Bar (Normal)
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </aside>
  );
};
