import React from 'react';
import {
  Flame,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Milestone,
  Compass,
  Radio,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import gisMapImg from '../assets/building/building_gis_map.png';

export const RightSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  stats = { total: 190, evacuated: 0, inTransit: 190, elapsedSeconds: 0 },
  exits = [],
  incidents = [],
  hasFire = false,
  onOpenAnalytics,
  onOpenIncidents,
  onOpenGis
}) => {
  // Stairwell Core live loads
  const stairwellsList = [
    {
      id: 'core_a',
      name: 'Core A',
      status: 'Operational',
      percent: 38,
      color: '#10b981'
    },
    {
      id: 'core_b',
      name: 'Core B',
      status: 'Operational',
      percent: 42,
      color: '#10b981'
    },
    {
      id: 'core_c',
      name: 'Core C',
      status: 'Operational',
      percent: 31,
      color: '#10b981'
    }
  ];

  // Incidents list matching Image 2
  const liveIncidentsList = [
    {
      id: 'inc_1',
      title: 'L7 - West Stair Fire',
      severity: 'Critical',
      subtitle: 'Smoke & high temperature detected',
      time: '2 min ago',
      color: '#ef4444'
    },
    {
      id: 'inc_2',
      title: 'G - Exit Blockage',
      severity: 'High',
      subtitle: 'Main lobby (Exit C) is obstructed',
      time: '4 min ago',
      color: '#f97316'
    },
    {
      id: 'inc_3',
      title: 'L5 - Crowd Surge',
      severity: 'Medium',
      subtitle: 'Elevated density (1.68 p/m²) near Core B',
      time: '6 min ago',
      color: '#f59e0b'
    }
  ];

  // ==========================================
  // 1. COLLAPSED RAIL VIEW
  // ==========================================
  if (isCollapsed) {
    return (
      <aside
        className="flex flex-col items-center shrink-0 select-none z-20 backdrop-blur-md"
        style={{
          width: '60px',
          background: 'rgba(8, 16, 32, 0.92)',
          borderLeft: '1px solid rgba(56, 189, 248, 0.16)',
          padding: '14px 6px',
          gap: '8px'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            color: '#38bdf8'
          }}
          title="Expand Right Panel"
        >
          <ChevronLeft className="w-5 h-5 text-sky-400" />
        </button>

        <div style={{ width: '28px', height: '1px', background: 'rgba(56, 189, 248, 0.15)' }} />

        {/* Mini GIS button */}
        <button
          onClick={onOpenGis || onToggleCollapse}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/20 text-sky-400 border border-sky-500/40 cursor-pointer"
          title="GIS Dispatch"
        >
          <Compass className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED VIEW — Matching Reference Image 2
  // ==========================================
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-hidden z-20 backdrop-blur-md"
      style={{
        width: '320px',
        background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.95) 0%, rgba(6, 12, 24, 0.92) 100%)',
        borderLeft: '1px solid rgba(56, 189, 248, 0.16)',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.45)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Scrollable Body ── */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-3 gap-3.5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* ─── CARD 1: GIS DISPATCH & ROUTING (Matching Image 2) ─── */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(11, 22, 44, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-sky-500/15">
            <div className="flex items-center gap-2">
              <button onClick={onToggleCollapse} className="w-6 h-6 rounded-md bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-sky-400 hover:text-white cursor-pointer mr-1 transition-colors" title="Collapse Right Sidebar"><ChevronRight className="w-4 h-4" /></button>
              <Compass className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                GIS Dispatch & Routing
              </span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </div>
            <button
              onClick={onOpenGis}
              className="text-slate-400 hover:text-white p-1"
              title="Expand Satellite Map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Map Visual Slot */}
          <div className="relative h-40 w-full overflow-hidden bg-slate-900">
            <img
              src={gisMapImg}
              alt="GIS Satellite Dispatch Map"
              className="w-full h-full object-cover brightness-90 contrast-125"
            />
            {/* SVG Tactical Route Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 50 40 Q 120 70 170 100 T 250 120"
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeDasharray="6 3"
              />
            </svg>

            {/* Fire Station Pin Pill */}
            <div
              className="absolute top-4 left-6 flex items-center gap-1.5 px-2 py-1 rounded-lg text-white font-bold text-[10px]"
              style={{
                background: 'rgba(220, 38, 38, 0.9)',
                boxShadow: '0 0 10px rgba(220, 38, 38, 0.6)'
              }}
            >
              <span>🚒</span>
              <span>Fire Station #07</span>
            </div>

            {/* Target Destination Pin Pill */}
            <div
              className="absolute bottom-5 right-6 flex items-center gap-1.5 px-2 py-1 rounded-lg text-white font-bold text-[10px]"
              style={{
                background: 'rgba(124, 58, 237, 0.9)',
                boxShadow: '0 0 10px rgba(124, 58, 237, 0.6)'
              }}
            >
              <span>📍</span>
              <span>South Main Gate</span>
            </div>

            {/* Floating Dispatch Telemetry Info Box */}
            <div
              className="absolute top-3 right-3 p-2 rounded-xl text-right backdrop-blur-md"
              style={{
                background: 'rgba(8, 16, 32, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <div className="text-[9px] text-slate-400 font-semibold uppercase">ETA</div>
              <div className="text-sm font-black text-white font-mono leading-tight">02:48</div>
              <div className="text-[9px] text-slate-400 font-semibold mt-1">Distance</div>
              <div className="text-[11px] font-bold text-sky-400 font-mono">6.2 km</div>
              <div className="text-[9px] font-bold text-emerald-400 mt-0.5">En Route</div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
