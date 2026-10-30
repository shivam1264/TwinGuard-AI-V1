import React, { useState } from 'react';
import {
  Box,
  Layers,
  ArrowUpDown,
  Video,
  Sliders,
  Building,
  Navigation as NavigationIcon,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Milestone,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const LeftSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  activeMode = '3D_VIEW',
  onSelectMode,
  activeFloorView = 'ALL',
  onSelectFloor,
  rooms = [],
  onOpenCctv,
  onOpenSystems
}) => {
  const [topTab, setTopTab] = useState('BUILDING'); // 'BUILDING' or 'NAVIGATION'

  // Determine status color dot for each floor
  const getFloorStatus = (floorNum) => {
    const floorRooms = rooms.filter(r => r.floor === floorNum);
    const hasFire = floorRooms.some(r => r.hasFire);
    if (hasFire) return 'hazard'; // Red dot

    const totalOccupants = floorRooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
    if (totalOccupants > 15) return 'warning'; // Amber dot

    return 'safe'; // Green dot
  };

  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getOrdinalName = (num) => {
    const suffixes = { 1: '1st', 2: '2nd', 3: '3rd' };
    return `${suffixes[num] || `${num}th`} Floor`;
  };

  const menuItems = [
    { id: '3D_VIEW', label: '3D View', icon: Box },
    { id: 'FLOOR_VIEW', label: 'Floor View', icon: Layers },
    { id: 'STAIRS_FOCUS', label: 'Stairwells', icon: Milestone },
    { id: 'ELEVATORS', label: 'Elevators', icon: ArrowUpDown },
    { id: 'CCTV', label: 'CCTV', icon: Video, action: onOpenCctv },
    { id: 'SYSTEMS', label: 'Systems', icon: Sliders, action: onOpenSystems }
  ];

  // ==========================================
  // COLLAPSED RAIL VIEW (Width ~64px / w-16)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-slate-200/90 flex flex-col items-center py-3.5 px-2 gap-3.5 shrink-0 select-none transition-all duration-300 ease-in-out shadow-xs z-20">
        {/* Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200/90 flex items-center justify-center transition-all shadow-xs"
          title="Expand Left Panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-8 border-t border-slate-200/80 my-0.5" />

        {/* 6 Core Navigation Icons (Marked in Pink in User Reference) */}
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all group ${
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

        {/* Mini Floor Indicator Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/90 flex flex-col items-center justify-center transition-all mt-auto"
          title={`Active Floor: ${activeFloorView === 'ALL' ? 'All Floors' : `Level ${activeFloorView}`}`}
        >
          <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">LVL</span>
          <span className="text-xs font-extrabold text-blue-600 leading-tight mt-0.5">
            {activeFloorView === 'ALL' ? 'ALL' : `L${activeFloorView}`}
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // EXPANDED FULL VIEW (Width ~260px / w-64)
  // ==========================================
  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 p-4 gap-4 select-none overflow-y-auto transition-all duration-300 ease-in-out shadow-xs z-20">
      {/* Top Header Row with Segmented Switcher & Collapse Button */}
      <div className="flex items-center gap-2">
        {/* Switcher: [Building] | [Navigation] */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 flex-1">
          <button
            onClick={() => setTopTab('BUILDING')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              topTab === 'BUILDING'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Building</span>
          </button>

          <button
            onClick={() => setTopTab('NAVIGATION')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              topTab === 'NAVIGATION'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <NavigationIcon className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200/90 flex items-center justify-center transition-all shrink-0"
          title="Collapse Left Panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Main View Mode Selector (Spacious & Clean) */}
      <div className="flex flex-col gap-1.5">
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
              className={`px-3 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/90 shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Horizontal Divider */}
      <div className="border-t border-slate-200/80 my-0.5" />

      {/* FLOORS Section (Clean, non-crammed typography) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
            FLOORS
          </span>
          <button
            onClick={() => onSelectFloor('ALL')}
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-all ${
              activeFloorView === 'ALL'
                ? 'text-blue-600 bg-blue-50 border border-blue-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Show All
          </button>
        </div>

        {/* 10-Floor Stack (L10 down to L1) */}
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {floorsList.map((fl) => {
            const status = getFloorStatus(fl);
            const isSelected = activeFloorView === String(fl);

            return (
              <button
                key={fl}
                onClick={() => onSelectFloor(isSelected ? 'ALL' : String(fl))}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-extrabold border-l-4 border-blue-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`font-mono font-bold text-xs ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                    L{fl}
                  </span>
                  <span className="text-xs truncate max-w-[120px]">
                    {getOrdinalName(fl)}
                  </span>
                </div>

                {/* Status Dot */}
                <div className="flex items-center gap-1.5">
                  {status === 'hazard' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs shadow-red-500/50 animate-pulse ring-2 ring-red-200" title="Fire Alert Active" />
                  ) : status === 'warning' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200" title="High Crowd Density" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Clear & Operational" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Card: BUILDING INFO */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Building className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            BUILDING INFO
          </div>
          <div className="text-xs font-extrabold text-slate-800 leading-tight mt-0.5">
            10 Floors • 3 Elevators
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Total Area: 25,400 m²
          </div>
        </div>
      </div>
    </aside>
  );
};
