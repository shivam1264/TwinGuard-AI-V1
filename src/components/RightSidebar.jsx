import React from 'react';
import {
  Flame,
  ShieldCheck,
  Users,
  CheckCircle2,
  Activity,
  AlertCircle,
  Milestone,
  Bell,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';

export const RightSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  stats = { total: 500, evacuated: 360, inTransit: 190, elapsedSeconds: 0 },
  exits = [],
  incidents = [],
  hasFire = false,
  onOpenAnalytics,
  onOpenIncidents
}) => {
  const total = stats.total || 1;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
  const remaining = Math.max(0, total - evacuated);
  const evacProgress = Math.min(100, Math.round((evacuated / total) * 100));

  // Circular progress ring calculation (SVG donut chart)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (evacProgress / 100) * circumference;

  // Default exit fallback data
  const defaultExits = [
    { id: 'exit_west', name: 'Stairwell A (West Core)', status: 'Operational', load: 120, capacity: 400, percent: 30 },
    { id: 'exit_east', name: 'Stairwell B (East Core)', status: 'Operational', load: 110, capacity: 400, percent: 28 },
    { id: 'exit_south', name: 'Stairwell C (South Exit)', status: inTransit > 100 ? 'Congested' : 'Operational', load: 180, capacity: 400, percent: 45 },
    { id: 'exit_elev', name: 'Stairwell D (Elevators)', status: 'Operational', load: 90, capacity: 400, percent: 22 }
  ];

  // Map real exits from simulation if available
  const displayExits = exits && exits.length >= 3 ? [
    {
      id: 'exit_west',
      name: 'Stairwell A (West Core)',
      status: exits[0].status === 'CRITICAL OVERLOAD' ? 'Congested' : 'Operational',
      load: exits[0].load || 0,
      capacity: exits[0].capacity || 60,
      percent: Math.min(100, Math.round(((exits[0].load || 0) / (exits[0].capacity || 60)) * 100))
    },
    {
      id: 'exit_east',
      name: 'Stairwell B (East Core)',
      status: exits[1].status === 'CRITICAL OVERLOAD' ? 'Congested' : 'Operational',
      load: exits[1].load || 0,
      capacity: exits[1].capacity || 60,
      percent: Math.min(100, Math.round(((exits[1].load || 0) / (exits[1].capacity || 60)) * 100))
    },
    {
      id: 'exit_south',
      name: 'Stairwell C (South Exit)',
      status: exits[2].status === 'CRITICAL OVERLOAD' ? 'Congested' : (exits[2].load > 40 ? 'Congested' : 'Operational'),
      load: exits[2].load || 0,
      capacity: exits[2].capacity || 80,
      percent: Math.min(100, Math.round(((exits[2].load || 0) / (exits[2].capacity || 80)) * 100))
    },
    {
      id: 'exit_elev',
      name: 'Stairwell D (Elevators)',
      status: 'Operational',
      load: Math.round(inTransit * 0.2),
      capacity: 60,
      percent: Math.min(100, Math.round((Math.round(inTransit * 0.2) / 60) * 100))
    }
  ] : defaultExits;

  // ==========================================
  // COLLAPSED RAIL VIEW (Width ~64px / w-16)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 glass-sidebar flex flex-col items-center py-4 px-2 gap-3.5 shrink-0 select-none transition-all duration-300 ease-in-out z-20">
        {/* Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white/80 hover:bg-[#e8f7f2] text-slate-500 hover:text-[#0d7a5f] border border-[#d1f2e8] flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="Expand Right Panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>

        <div className="w-8 border-t border-[#e2ede7]/80 my-0.5" />

        {/* 1. Emergency Status Icon */}
        <button
          onClick={onToggleCollapse}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all group cursor-pointer ${
            hasFire
              ? 'bg-red-500 text-white shadow-md shadow-red-500/40 animate-pulse'
              : 'glass-squircle text-emerald-700'
          }`}
          title={`Emergency Status: ${hasFire ? 'FIRE ALARM ACTIVE' : 'NORMAL'}`}
        >
          {hasFire ? <Flame className="w-4 h-4 fill-white" /> : <ShieldCheck className="w-4 h-4" />}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-[#133d36] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Emergency Status: {hasFire ? 'FIRE' : 'NORMAL'}
          </span>
        </button>

        {/* 2. Evacuation Progress Mini Ring */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white/70 hover:bg-white border border-[#d1f2e8] flex flex-col items-center justify-center text-center transition-all group relative cursor-pointer shadow-2xs"
          title={`Evacuation Progress: ${evacProgress}%`}
        >
          <span className="text-[10px] font-black text-slate-800 leading-none">{evacProgress}%</span>
          <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">EVAC</span>
          <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-[#133d36] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Evacuation Progress: {evacProgress}%
          </span>
        </button>

        {/* 3. Stairwell Status Icon */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-2xl bg-white/70 hover:bg-[#e8f7f2] text-slate-600 hover:text-[#0d7a5f] border border-[#d1f2e8] flex items-center justify-center transition-all group relative cursor-pointer shadow-2xs"
          title="Stairwell Status"
        >
          <Milestone className="w-4 h-4" />
          <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-[#133d36] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Stairwell Cores
          </span>
        </button>

        {/* 4. Live Incidents Icon (with red badge) */}
        <button
          onClick={() => {
            if (onOpenIncidents) onOpenIncidents();
            else onToggleCollapse();
          }}
          className="w-10 h-10 rounded-2xl bg-white/70 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200/90 flex items-center justify-center relative transition-all group cursor-pointer shadow-2xs"
          title={`Live Incidents (${incidents.length})`}
        >
          <Bell className="w-4 h-4" />
          {incidents.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-xs">
              {incidents.length}
            </span>
          )}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-[#133d36] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Live Incidents ({incidents.length})
          </span>
        </button>
      </aside>
    );
  }

  // ==========================================
  // EXPANDED FULL VIEW (Width ~360px - Glassmorphism)
  // ==========================================
  return (
    <aside className="w-88 lg:w-[360px] glass-sidebar flex flex-col gap-3.5 shrink-0 select-none overflow-y-auto no-scrollbar p-4 transition-all duration-300 ease-in-out z-20">
      {/* Top Header Row with Collapse Button */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
          COMMAND & TELEMETRY
        </span>
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-xl bg-white/70 hover:bg-[#e8f7f2] text-slate-400 hover:text-[#0d7a5f] border border-[#d1f2e8] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          title="Collapse Right Panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* CARD 1: Emergency Status */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
              hasFire ? 'bg-red-500 shadow-md shadow-red-500/30' : 'bg-[#0d7a5f] shadow-sm shadow-[#0d7a5f]/25'
            }`}>
              {hasFire ? <Flame className="w-4 h-4 fill-white" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <span className="font-extrabold text-sm text-slate-900">
              Emergency Status
            </span>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
            hasFire
              ? 'glass-pill-danger text-[#be123c] animate-pulse'
              : 'glass-pill text-[#065f46]'
          }`}>
            {hasFire ? 'FIRE HAZARD' : 'NORMAL'}
          </span>
        </div>

        {/* Circular Donut Gauge + KPI Breakdown */}
        <div className="flex items-center justify-between gap-4">
          {/* Donut Chart (SVG) */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#e2ede7"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#0d7a5f"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 leading-none">
                {evacProgress}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-1 leading-tight max-w-[65px]">
                Evacuation Progress
              </span>
            </div>
          </div>

          {/* KPI Rows */}
          <div className="flex-1 flex flex-col gap-2 text-xs">
            {/* Total Occupants */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium">Total Occupants</span>
              </div>
              <span className="font-extrabold text-slate-900">{total}</span>
            </div>

            {/* Evacuated */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium">Evacuated</span>
              </div>
              <span className="font-extrabold text-emerald-600">{evacuated}</span>
            </div>

            {/* In Movement */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-medium">In Movement</span>
              </div>
              <span className="font-extrabold text-amber-600">{inTransit}</span>
            </div>

            {/* Remaining */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-500">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] font-medium">Remaining</span>
              </div>
              <span className="font-extrabold text-rose-600">{remaining}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Stairwell Status (Spacious Full-Width Row Items - Zero Overlap!) */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl glass-squircle text-[#0d7a5f] flex items-center justify-center">
              <Milestone className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">
              Stairwell Status
            </span>
          </div>

          <button
            onClick={onOpenAnalytics}
            className="text-xs font-bold text-[#0d7a5f] hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stacked Egress Core Items */}
        <div className="flex flex-col gap-2">
          {displayExits.map((stair) => {
            const isCongested = stair.status === 'Congested';
            return (
              <div
                key={stair.id}
                className="bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-2xs"
              >
                {/* Title & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">{stair.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isCongested ? 'bg-amber-500 animate-pulse ring-2 ring-amber-200' : 'bg-emerald-500'}`} />
                    <span className={`text-[10px] font-extrabold ${isCongested ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {stair.status}
                    </span>
                  </div>
                </div>

                {/* Occupants & Percentage */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-700">{stair.load}</span>
                    <span className="text-[10px] text-slate-400">/ {stair.capacity} max</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{stair.percent}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCongested ? 'bg-amber-500' : 'bg-[#0d7a5f]'
                    }`}
                    style={{ width: `${Math.min(100, stair.percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARD 3: Live Incidents */}
      <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 flex-1 min-h-[210px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-red-100/80 text-red-600 flex items-center justify-center border border-red-200/60">
              <Bell className="w-4 h-4 fill-red-500" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">
              Live Incidents
            </span>
            <span className="w-4 h-4 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center leading-none">
              {incidents.length}
            </span>
          </div>

          <button
            onClick={onOpenIncidents}
            className="text-xs font-bold text-[#0d7a5f] hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Incidents Timeline */}
        <div className="flex flex-col gap-3 relative before:absolute before:left-[47px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200/80">
          {incidents.slice(0, 3).map((item, index) => {
            const badgeColor =
              item.severity === 'High'
                ? 'bg-red-50 text-red-600 border-red-200'
                : item.severity === 'Medium'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-[#0d7a5f] border-emerald-200';

            const dotColor =
              item.severity === 'High'
                ? 'bg-red-500 ring-red-100'
                : item.severity === 'Medium'
                ? 'bg-amber-500 ring-amber-100'
                : 'bg-[#0d7a5f] ring-emerald-100';

            return (
              <div key={item.id || index} className="flex items-start gap-3 relative z-10">
                <span className="text-[10px] font-mono font-bold text-slate-400 w-9 shrink-0 pt-0.5">
                  {item.time}
                </span>

                <span className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-4 mt-1 shrink-0`} />

                <div className="flex-1 flex items-start justify-between gap-1.5 min-w-0">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                      {item.subtitle}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border shrink-0 ${badgeColor}`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
