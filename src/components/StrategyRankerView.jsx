import React, { useState } from 'react';
import {
  Trophy,
  Brain,
  Sparkles,
  Target,
  Clock,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart2,
  Maximize2
} from 'lucide-react';

const StrategyRankerViewComponent = ({
  theme = 'dark',
  scenario,
  rooms = [],
  exits = [],
  onApplyStrategy,
  onSwitchToLive
}) => {
  const isDark = theme === 'dark';
  const [selectedStrategy, setSelectedStrategy] = useState('NEAREST');
  const [weights, setWeights] = useState({
    time: 35,
    density: 35,
    exposure: 30
  });

  const strategies = [
    {
      id: 'NEAREST',
      tag: '#1 RECOMMENDED',
      tagColor: '#10b981',
      title: 'Nearest Core',
      desc: 'Occupants head to the closest stairwell core without load balancing.',
      time: '142 s',
      density: '1.44 p/m²',
      exposure: '873 pts',
      choke: 0,
      coreA: '120p',
      coreB: '70p',
      bullets: [
        'Shortest overall evacuation time',
        'No stairwell chokepoint detected',
        'Lower exposure and overall risk'
      ],
      topsisScore: 0.650,
      borderColor: '#10b981'
    },
    {
      id: 'DYNAMIC',
      tag: '#2 VIABLE',
      tagColor: '#38bdf8',
      title: 'Dynamic Core Balancing',
      desc: 'Digital signage diverts occupants evenly between active cores.',
      time: '158 s',
      density: '1.06 p/m²',
      exposure: '998 pts',
      choke: 0,
      coreA: '95p',
      coreB: '95p',
      bullets: [
        'Balanced stairwell utilization',
        'Lower overall building clearance',
        '~34% less risk of stampede'
      ],
      topsisScore: 0.670,
      borderColor: '#38bdf8'
    },
    {
      id: 'PHASED',
      tag: '#3 HIGH RISK',
      tagColor: '#ef4444',
      title: 'Phased Zone Evacuation',
      desc: 'Evacuate fire floor and adjacent levels first; others sheltered for 45s.',
      time: '198 s',
      density: '1.00 p/m²',
      exposure: '1083 pts',
      choke: 0,
      coreA: '105p',
      coreB: '85p',
      bullets: [
        'Zero stairwell crush (lowest density)',
        'Immediate priority clearance',
        'Extended total clearance time'
      ],
      topsisScore: 0.350,
      borderColor: '#ef4444'
    }
  ];

  return (
    <div
      className={`flex-1 flex flex-col overflow-y-auto no-scrollbar p-4 sm:p-6 gap-4 select-none transition-colors duration-300 ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #070d18 0%, #0c162d 100%)'
          : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Top Header Banner (Matching Reference Image 4) ── */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-sky-500/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                AI Multi-Strategy Simulation & Decision Ranker
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                TOPSIS + RADAR XAI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Evaluate and rank evacuation strategies using TOPSIS, simulation, and risk analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 hover:text-white">
            Export Report
          </button>
          <button className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 border border-sky-400">
            Re-Run Benchmark
          </button>
        </div>
      </div>

      {/* ── Main Layout Grid: 3 Columns (Parameters | Strategies | Radar + TOPSIS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Column 1: Context & Weights (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div
            className="p-4 rounded-2xl flex flex-col gap-3"
            style={{
              background: isDark ? 'rgba(11, 22, 44, 0.85)' : '#ffffff',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0'
            }}
          >
            <div className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Simulation Context
              <span className="block text-[11px] text-slate-400 font-normal">
                Scenario and evaluation parameters
              </span>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="text-slate-400 text-[11px] font-semibold">Active Scenario</label>
              <div className={`p-2 rounded-xl border font-medium ${isDark ? "bg-slate-900 border-sky-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} flex items-center gap-2`}>
                <span className="text-red-400">🔥</span>
                <span>Case 1: L1 Fire Near Main / Front Gate</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="text-slate-400 text-[11px] font-semibold">Building</label>
              <div className={`p-2 rounded-xl border font-medium ${isDark ? "bg-slate-900 border-sky-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                10-Storey Tower (BIM)
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="text-slate-400 text-[11px] font-semibold">Occupants</label>
              <div className={`p-2 rounded-xl border font-mono font-bold ${isDark ? "bg-slate-900 border-sky-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                190
              </div>
            </div>

            {/* Weights Sliders */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-sky-500/15 text-xs">
              <div className="font-bold text-slate-300">Objective (Weights)</div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Evacuation Time</span>
                  <span className={`font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{weights.time}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={weights.time}
                  onChange={(e) => setWeights({ ...weights, time: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Crowd Density</span>
                  <span className={`font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{weights.density}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={weights.density}
                  onChange={(e) => setWeights({ ...weights, density: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Toxic Exposure</span>
                  <span className={`font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{weights.exposure}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={weights.exposure}
                  onChange={(e) => setWeights({ ...weights, exposure: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <button className="w-full py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 mt-1 cursor-pointer">
                Update & Compare
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Strategy Comparison 3 Cards (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            STRATEGY COMPARISON (SIMULATION RESULTS)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {strategies.map((strat) => {
              const isSelected = selectedStrategy === strat.id;
              return (
                <div
                  key={strat.id}
                  onClick={() => setSelectedStrategy(strat.id)}
                  className="rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all"
                  style={{
                    background: isSelected ? 'rgba(15, 23, 42, 0.95)' : isDark ? 'rgba(11, 22, 44, 0.75)' : '#ffffff',
                    border: `1.5px solid ${isSelected ? strat.borderColor : (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e2e8f0')}`,
                    boxShadow: isSelected ? `0 0 16px ${strat.borderColor}40` : 'none'
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {/* Badge */}
                    <div
                      className="px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wider text-white inline-block w-max"
                      style={{ background: strat.tagColor }}
                    >
                      {strat.tag}
                    </div>

                    <div className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>{strat.title}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{strat.desc}</div>

                    {/* Stats */}
                    <div className="flex flex-col gap-1 text-[11px] font-mono pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Clearance Time</span>
                        <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{strat.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Peak Density</span>
                        <span className="font-bold text-emerald-400">{strat.density}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Toxic Exposure</span>
                        <span className="font-bold text-amber-400">{strat.exposure}</span>
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="flex flex-col gap-1 text-[10px] text-slate-300 pt-2 border-t border-slate-800">
                      {strat.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">✔</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-center text-slate-400">
                    TOPSIS Score: <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{strat.topsisScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Radar Chart & TOPSIS Ranking (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Radar Chart Card */}
          <div
            className="p-4 rounded-2xl flex flex-col gap-2"
            style={{
              background: isDark ? 'rgba(11, 22, 44, 0.85)' : '#ffffff',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0'
            }}
          >
            <div className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Multi-Criteria Analysis (XAI)
            </div>

            {/* Simulated Radar Visual SVG */}
            <div className="w-full h-44 flex items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-40 h-40">
                {/* Concentric Polygons */}
                <polygon points="50,10 90,40 75,85 25,85 10,40" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                <polygon points="50,25 75,45 65,75 35,75 25,45" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                {/* Axes */}
                <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                <line x1="50" y1="50" x2="90" y2="40" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                <line x1="50" y1="50" x2="75" y2="85" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                <line x1="50" y1="50" x2="25" y2="85" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                <line x1="50" y1="50" x2="10" y2="40" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.8" />
                {/* Strategy 1 (Green Polygon) */}
                <polygon points="50,15 85,42 70,80 30,78 18,44" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="1.5" />
                {/* Strategy 2 (Blue Polygon) */}
                <polygon points="50,22 80,48 65,72 38,70 25,48" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.2" />
              </svg>
            </div>

            <div className="flex items-center justify-around text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Nearest
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Dynamic
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Phased
              </span>
            </div>
          </div>

          {/* TOPSIS Ranking & Score Card */}
          <div
            className="p-4 rounded-2xl flex flex-col gap-3"
            style={{
              background: isDark ? 'rgba(11, 22, 44, 0.85)' : '#ffffff',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0'
            }}
          >
            <div className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              TOPSIS Ranking & Score
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">#1</span>
                  <span className="text-slate-300 font-medium">Nearest Core</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <span className={`font-mono text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>0.650</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px]">#2</span>
                  <span className="text-slate-300 font-medium">Dynamic Core</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full" style={{ width: '67%' }} />
                  </div>
                  <span className={`font-mono text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>0.670</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-red-500/20 text-red-400 font-bold flex items-center justify-center text-[10px]">#3</span>
                  <span className="text-slate-300 font-medium">Phased Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: '35%' }} />
                  </div>
                  <span className={`font-mono text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>0.350</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Selected Strategy Bar (Matching Reference Image 4) ── */}
      <div className={`px-6 py-3 rounded-2xl flex items-center justify-between border border-sky-500/20 ${isDark ? 'bg-slate-900/80 text-white' : 'bg-white text-slate-900 shadow-sm'} border text-xs`}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Nearest Core Evacuation</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                TOPSIS Score: 0.650
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Best trade-off between evacuation time, crowd density, and toxic exposure. Recommended for immediate execution.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (onApplyStrategy) onApplyStrategy('NEAREST');
            onSwitchToLive();
          }}
          className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 cursor-pointer shadow-lg flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Apply Selected Strategy</span>
        </button>
      </div>
    </div>
  );
};

export const StrategyRankerView = React.memo(StrategyRankerViewComponent);
export default StrategyRankerView;

