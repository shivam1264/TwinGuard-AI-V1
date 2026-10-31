import React, { useState } from 'react';
import {
  BarChart3,
  Clock,
  Users,
  AlertTriangle,
  Layers,
  Flame,
  Radio,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Maximize2,
  Plus,
  Minus,
  RotateCcw,
  Activity,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const AnalyticsView = ({
  stats = { total: 190, evacuated: 0, inTransit: 190, elapsedSeconds: 0 },
  rooms = [],
  exits = [],
  onSwitchToLive
}) => {
  const [activeModule, setActiveModule] = useState('OVERVIEW');
  const [mapMode, setMapMode] = useState('3D View'); // '3D View' | '2D Plan' | 'Flow Only'

  const total = stats.total || 190;
  const evacuated = stats.evacuated || 0;
  const evacPercent = total > 0 ? Math.round((evacuated / total) * 100) : 0;
  const elapsedSec = stats.elapsedSeconds || 0;

  const modules = [
    { id: 'OVERVIEW', label: 'Overview', sub: 'Key insights & predictions', icon: BarChart3 },
    { id: 'EVACUATION', label: 'Evacuation Analysis', sub: 'Clearance time & progress', icon: TrendingUp },
    { id: 'CROWD_FLOW', label: 'Crowd Flow Analysis', sub: 'Movement & density', icon: Users },
    { id: 'BOTTLENECK', label: 'Bottleneck Detection', sub: 'Congestion & choke points', icon: AlertTriangle },
    { id: 'RISK', label: 'Risk Prediction', sub: 'Spread & impact forecast', icon: Flame },
    { id: 'RESOURCE', label: 'Resource Utilization', sub: 'Stairs, exits & capacity', icon: FileText }
  ];

  return (
    <div
      className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#070d18] text-slate-100 overflow-y-auto no-scrollbar select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── 1. Page Title Header Strip (Matching Reference Image) ── */}
      <div
        className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-sky-500/20"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 22, 44, 0.95) 0%, rgba(7, 13, 24, 0.9) 100%)'
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(56, 189, 248, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)'
            }}
          >
            <BarChart3 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Predictive Analytics & Flow Intelligence
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              AI-powered analysis for evacuation time, crowd behavior, bottlenecks, and risk prediction.
            </p>
          </div>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 text-xs font-bold text-red-400"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Simulation: L7 West Stair Fire</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-bold text-emerald-400"
            style={{ background: 'rgba(16, 185, 129, 0.1)' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Analysis</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono text-slate-400">
            Last Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ── 2. Main Content Grid (Left Rail + Right Analytics Dashboard) ── */}
      <div className="flex-1 flex min-w-0 p-5 gap-5 overflow-hidden">
        {/* ── Left Modules Navigation Rail ── */}
        <div
          className="w-64 shrink-0 flex flex-col p-3 rounded-2xl gap-2 h-fit"
          style={{
            background: 'rgba(11, 22, 44, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="px-2 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            ANALYTICS MODULES
          </div>

          {modules.map((m) => {
            const Icon = m.icon;
            const isSelected = activeModule === m.id;

            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer transition-all"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%)'
                    : 'transparent',
                  border: isSelected ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid transparent',
                  boxShadow: isSelected ? '0 0 16px rgba(37, 99, 235, 0.5)' : 'none'
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                    color: isSelected ? '#ffffff' : '#38bdf8'
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? 800 : 700,
                      color: isSelected ? '#ffffff' : '#f1f5f9'
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: isSelected ? '#dbeafe' : '#94a3b8'
                    }}
                  >
                    {m.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Right Dashboard Layout ── */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {/* Top 5 KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* KPI 1 */}
            <div
              className="p-3.5 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/35 flex items-center justify-center text-sky-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Predicted Clearance Time</div>
                <div className="text-base font-black text-white font-mono leading-tight">06:30 min</div>
                <div className="text-[9.5px] text-emerald-400 font-bold mt-0.5">↓ -27% vs. unoptimized</div>
              </div>
            </div>

            {/* KPI 2 */}
            <div
              className="p-3.5 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Total Occupants</div>
                <div className="text-base font-black text-white font-mono leading-tight">{total}</div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">10-Storey Tower</div>
              </div>
            </div>

            {/* KPI 3 */}
            <div
              className="p-3.5 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Evacuated (Simulated)</div>
                <div className="text-base font-black text-emerald-400 font-mono leading-tight">
                  {evacuated > 0 ? evacuated : total} ({evacuated > 0 ? evacPercent : 100}%)
                </div>
                <div className="text-[9.5px] text-emerald-400 font-bold mt-0.5">Zero trapped</div>
              </div>
            </div>

            {/* KPI 4 */}
            <div
              className="p-3.5 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Critical Bottlenecks</div>
                <div className="text-base font-black text-red-400 font-mono leading-tight">2</div>
                <div className="text-[9.5px] text-red-400 font-semibold mt-0.5">L7 Core B, Corr C</div>
              </div>
            </div>

            {/* KPI 5 */}
            <div
              className="p-3.5 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Max. Crowd Density</div>
                <div className="text-base font-black text-white font-mono leading-tight">1.68 p/m²</div>
                <div className="text-[9.5px] text-amber-400 font-semibold mt-0.5">Elevated peak</div>
              </div>
            </div>
          </div>

          {/* Center Main Section: Floor Plan Density Heatmap (Left) + Evacuation Progress & Bottlenecks (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Crowd Flow & Density Floor Plan (Col 7) */}
            <div
              className="lg:col-span-7 rounded-2xl p-4 flex flex-col relative overflow-hidden"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                minHeight: '340px'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Crowd Flow & Density (Level 7 - Live Simulation)
                  </span>
                </div>
              </div>

              {/* Graphic Flow & Heatmap Simulator Container */}
              <div className="relative flex-1 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center overflow-hidden p-4">
                {/* SVG Floor Architectural Layout with Heatmap Flow Lines */}
                <svg viewBox="0 0 700 320" className="w-full h-full max-h-[280px]">
                  {/* Outer Building Perimeter */}
                  <rect x="40" y="40" width="620" height="230" rx="14" fill="#0d1b2e" stroke="#1e3a5f" strokeWidth="2.5" />
                  
                  {/* Interior Room Partitions */}
                  <line x1="40" y1="120" x2="660" y2="120" stroke="#1e3a5f" strokeWidth="1.8" strokeDasharray="3 3" />
                  <line x1="40" y1="190" x2="660" y2="190" stroke="#1e3a5f" strokeWidth="1.8" strokeDasharray="3 3" />
                  
                  <line x1="160" y1="40" x2="160" y2="120" stroke="#1e3a5f" strokeWidth="1.5" />
                  <line x1="280" y1="40" x2="280" y2="120" stroke="#1e3a5f" strokeWidth="1.5" />
                  <line x1="400" y1="40" x2="400" y2="120" stroke="#1e3a5f" strokeWidth="1.5" />
                  <line x1="520" y1="40" x2="520" y2="120" stroke="#1e3a5f" strokeWidth="1.5" />

                  <line x1="160" y1="190" x2="160" y2="270" stroke="#1e3a5f" strokeWidth="1.5" />
                  <line x1="280" y1="190" x2="280" y2="270" stroke="#1e3a5f" strokeWidth="1.5" />
                  <line x1="400" y1="190" x2="400" y2="270" stroke="#1e3a5f" strokeWidth="1.5" />
                  <line x1="520" y1="190" x2="520" y2="270" stroke="#1e3a5f" strokeWidth="1.5" />

                  {/* Dynamic Heatmap Corridor Flow (Green -> Yellow -> Red Gradient Gradient) */}
                  <defs>
                    <linearGradient id="heatFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                      <stop offset="45%" stopColor="#eab308" stopOpacity="0.9" />
                      <stop offset="85%" stopColor="#ef4444" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>

                  {/* Main Central Corridor Heatmap Density Ribbon */}
                  <path
                    d="M 120 155 Q 300 155 380 155 T 560 155"
                    fill="none"
                    stroke="url(#heatFlow)"
                    strokeWidth="28"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 14px rgba(239, 68, 68, 0.45))' }}
                  />

                  {/* Exit Path Flow Arrow Lines */}
                  <path
                    d="M 380 155 L 380 250"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="18"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))' }}
                  />

                  {/* Stair Core A (Main Egress) Badge */}
                  <g transform="translate(100, 70)">
                    <rect x="0" y="0" width="110" height="34" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                    <text x="55" y="16" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">Stair Core A</text>
                    <text x="55" y="27" fill="#a7f3d0" fontSize="8" textAnchor="middle">(Main Egress)</text>
                  </g>

                  {/* Stair Core B (High Load) Badge */}
                  <g transform="translate(480, 70)">
                    <rect x="0" y="0" width="110" height="34" rx="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="55" y="16" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">Stair Core B</text>
                    <text x="55" y="27" fill="#fecaca" fontSize="8" textAnchor="middle">(High Load)</text>
                  </g>

                  {/* Exit (West) Ground Connection */}
                  <g transform="translate(325, 255)">
                    <rect x="0" y="0" width="110" height="28" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                    <text x="55" y="18" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">Exit (West)</text>
                  </g>
                </svg>

                {/* Right Floating Map Controls */}
                <div className="absolute right-3 top-3 flex flex-col gap-1">
                  <button className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white">
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Left Mode Selectors */}
                <div className="absolute bottom-3 left-3 flex items-center p-1 rounded-xl bg-slate-900/90 border border-sky-500/20 gap-1">
                  {['3D View', '2D Plan', 'Flow Only'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setMapMode(mode)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: mapMode === mode ? '#2563eb' : 'transparent',
                        color: mapMode === mode ? '#ffffff' : '#94a3b8'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Bottom Right Heatmap Legend Bar */}
                <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
                  <div className="text-[9px] text-slate-400 font-semibold">Crowd Density (p/m²)</div>
                  <div
                    className="w-36 h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #10b981 0%, #eab308 50%, #ef4444 100%)'
                    }}
                  />
                  <div className="flex justify-between w-36 text-[8px] text-slate-400 font-mono">
                    <span>0.0</span>
                    <span>0.5</span>
                    <span>1.0</span>
                    <span>1.5</span>
                    <span>2.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Column (Col 5): Evacuation Progress Curve & Bottleneck Analysis Table */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Evacuation Progress Curve Card */}
              <div
                className="rounded-2xl p-4 flex flex-col"
                style={{
                  background: 'rgba(11, 22, 44, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      Evacuation Progress
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    190 / 190 (100%)
                  </span>
                </div>

                {/* Graph Curve SVG (Matching Reference Image) */}
                <div className="relative h-28 w-full bg-slate-950/60 rounded-xl border border-slate-800 p-2">
                  <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="30" y1="10" x2="290" y2="10" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="30" y1="35" x2="290" y2="35" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="30" y1="60" x2="290" y2="60" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* Green Smooth Evacuation Curve */}
                    <path
                      d="M 35 65 Q 120 45 200 20 T 285 10"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
                    />

                    {/* Gradient Area under curve */}
                    <path
                      d="M 35 65 Q 120 45 200 20 T 285 10 L 285 70 L 35 70 Z"
                      fill="rgba(16, 185, 129, 0.12)"
                    />

                    {/* Marker Points */}
                    <circle cx="35" cy="65" r="3" fill="#10b981" />
                    <circle cx="95" cy="52" r="3" fill="#10b981" />
                    <circle cx="160" cy="35" r="3" fill="#10b981" />
                    <circle cx="225" cy="18" r="3" fill="#10b981" />
                    <circle cx="285" cy="10" r="3.5" fill="#34d399" />
                  </svg>
                  <div className="flex justify-between px-6 text-[8px] text-slate-400 font-mono mt-1">
                    <span>0:00</span>
                    <span>1:00</span>
                    <span>2:00</span>
                    <span>3:00</span>
                    <span>4:00</span>
                    <span>5:00</span>
                    <span>6:30</span>
                  </div>
                </div>
              </div>

              {/* Bottleneck Analysis Table Card */}
              <div
                className="rounded-2xl p-4 flex flex-col flex-1"
                style={{
                  background: 'rgba(11, 22, 44, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Bottleneck Analysis
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/60 text-[9.5px] text-slate-400 uppercase font-semibold">
                        <th className="pb-1.5 font-bold">Location</th>
                        <th className="pb-1.5 font-bold">Type</th>
                        <th className="pb-1.5 font-bold">Peak Density</th>
                        <th className="pb-1.5 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-2 font-bold text-white flex items-center gap-1.5">
                          <span>🪜</span> Stair Core B (L7)
                        </td>
                        <td className="py-2 text-slate-300">Stairwell</td>
                        <td className="py-2 font-mono font-bold text-white">1.68 p/m²</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-red-500/20 border border-red-500/40 text-red-400">
                            High
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white flex items-center gap-1.5">
                          <span>🚪</span> Corridor C (L7)
                        </td>
                        <td className="py-2 text-slate-300">Corridor</td>
                        <td className="py-2 font-mono font-bold text-white">1.42 p/m²</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-400">
                            Medium
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white flex items-center gap-1.5">
                          <span>🪜</span> Stair Core A (L7)
                        </td>
                        <td className="py-2 text-slate-300">Stairwell</td>
                        <td className="py-2 font-mono font-bold text-white">1.12 p/m²</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                            Low
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards Row: AI Risk Prediction (Left), AI Insights & Recommendations (Center), What-If Analysis (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. AI Risk Prediction & Impact */}
            <div
              className="p-4 rounded-2xl flex flex-col gap-3"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white">AI Risk Prediction & Impact</span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Fire Spread Risk</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px]">Contained to L7 (92% confidence)</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Occupancy Impact</span>
                  </div>
                  <span className="text-white font-bold text-[11px]">42 occupants affected (L7)</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Egress Risk</span>
                  </div>
                  <span className="text-amber-400 font-bold text-[11px]">High load at Stair Core B</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span>Delay Risk</span>
                  </div>
                  <span className="text-red-400 font-bold text-[11px]">+1.5 to +2.0 min (if unmanaged)</span>
                </div>
              </div>
            </div>

            {/* 2. AI Insights & Recommendations */}
            <div
              className="p-4 rounded-2xl flex flex-col gap-2.5"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white">AI Insights & Recommendations</span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Evacuation likely to complete within 06:30 min.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Stair Core B is primary bottleneck (1.68 p/m²).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Redistribute occupants to Stair Core A (-34% load).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">No secondary fire spread predicted.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-400 font-bold">Overall risk level: Moderate (contained).</span>
                </div>
              </div>
            </div>

            {/* 3. What-If Analysis (Alternative Strategies) */}
            <div
              className="p-4 rounded-2xl flex flex-col gap-2.5"
              style={{
                background: 'rgba(11, 22, 44, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white">What-If Analysis (Alternative Strategies)</span>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700/60 text-[9.5px] text-slate-400 uppercase font-semibold">
                    <th className="pb-1 font-bold">Strategy</th>
                    <th className="pb-1 font-bold">Est. Time</th>
                    <th className="pb-1 font-bold text-right">Δ vs. Curr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-1.5 text-slate-300">Current (Baseline)</td>
                    <td className="py-1.5 font-mono text-white">06:30 min</td>
                    <td className="py-1.5 text-right text-slate-400">—</td>
                  </tr>
                  <tr className="bg-emerald-500/10 font-bold text-emerald-400">
                    <td className="py-1.5 pl-1 rounded-l flex items-center gap-1">
                      <span>✓</span> Load Balancing (A + B)
                    </td>
                    <td className="py-1.5 font-mono">05:48 min</td>
                    <td className="py-1.5 pr-1 text-right rounded-r">-11%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-300">Phased Evacuation</td>
                    <td className="py-1.5 font-mono text-white">06:02 min</td>
                    <td className="py-1.5 text-right text-emerald-400 font-bold">-7%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-300">Priority Zone (A first)</td>
                    <td className="py-1.5 font-mono text-white">05:55 min</td>
                    <td className="py-1.5 text-right text-emerald-400 font-bold">-9%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

