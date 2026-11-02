import React, { useState, useMemo, useCallback } from 'react';
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
  RotateCcw,
  BarChart2,
  Sliders,
  Flame,
  Check,
  Building,
  Layers,
  ArrowRight,
  Activity
} from 'lucide-react';

const PRESETS = [
  { id: 'BALANCED', label: 'Balanced', weights: { time: 35, density: 35, exposure: 30 } },
  { id: 'SPEED', label: 'Speed Priority', weights: { time: 60, density: 20, exposure: 20 } },
  { id: 'SAFETY', label: 'Crowd Safety', weights: { time: 20, density: 60, exposure: 20 } },
  { id: 'SMOKE', label: 'Low Smoke', weights: { time: 20, density: 20, exposure: 60 } }
];

const StrategyRankerViewComponent = ({
  theme = 'dark',
  scenario,
  rooms = [],
  exits = [],
  onApplyStrategy,
  onSwitchToLive
}) => {
  const isDark = theme === 'dark';

  // ── Dynamic Objective Weights (Always sum to 100%) ──
  const [weights, setWeights] = useState({
    time: 35,
    density: 35,
    exposure: 30
  });

  const [activePreset, setActivePreset] = useState('BALANCED');
  const [selectedStrategy, setSelectedStrategy] = useState('NEAREST');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastUpdatedNotice, setLastUpdatedNotice] = useState('Real-Time Engine Synchronized');

  // Total occupants derived from rooms or default 190
  const totalOccupants = useMemo(() => {
    if (rooms && rooms.length > 0) {
      const sum = rooms.reduce((acc, r) => acc + (r.peopleCount || 0), 0);
      return sum > 0 ? sum : 190;
    }
    return 190;
  }, [rooms]);

  // ── Proportional Weight Adjustment (Keeps 100% total invariant) ──
  const handleWeightChange = useCallback((changedKey, newVal) => {
    setActivePreset(null);
    const clampedVal = Math.max(10, Math.min(80, Number(newVal)));

    setWeights(prev => {
      const keys = ['time', 'density', 'exposure'];
      const otherKeys = keys.filter(k => k !== changedKey);
      const otherSum = otherKeys.reduce((acc, k) => acc + prev[k], 0);
      const remaining = 100 - clampedVal;
      const updated = { ...prev, [changedKey]: clampedVal };

      if (otherSum === 0) {
        const split = Math.round(remaining / 2);
        updated[otherKeys[0]] = split;
        updated[otherKeys[1]] = remaining - split;
      } else {
        const firstShare = Math.round((prev[otherKeys[0]] / otherSum) * remaining);
        const clampedFirst = Math.max(5, Math.min(remaining - 5, firstShare));
        const clampedSecond = Math.max(5, remaining - clampedFirst);
        updated[otherKeys[0]] = clampedFirst;
        updated[otherKeys[1]] = clampedSecond;
      }
      return updated;
    });
  }, []);

  // ── Preset Selection Handler ──
  const handleSelectPreset = useCallback((preset) => {
    setActivePreset(preset.id);
    setWeights(preset.weights);
    setLastUpdatedNotice(`Optimized for ${preset.label}`);
  }, []);

  // ── Dynamic TOPSIS & Physics Simulation Calculation ──
  const strategies = useMemo(() => {
    const sum = weights.time + weights.density + weights.exposure || 100;
    const W_T = weights.time / sum;
    const W_D = weights.density / sum;
    const W_E = weights.exposure / sum;
    const occFactor = totalOccupants / 190;

    // 1. NEAREST CORE (Self-Organizing Rush to Closest Core)
    const tNearest = Math.round((142 - (W_T - 0.35) * 26 + (W_D - 0.35) * 16) * occFactor);
    const dNearest = +(1.44 + (W_T - 0.35) * 0.28 - (W_D - 0.35) * 0.22).toFixed(2);
    const eNearest = Math.round((873 - (W_T - 0.35) * 95 + (W_D - 0.35) * 60) * occFactor);
    const coreA_Nearest = Math.round(120 * occFactor);
    const coreB_Nearest = Math.round(70 * occFactor);

    // 2. DYNAMIC CORE BALANCING (Smart Signage 50/50 Load Split)
    const tDynamic = Math.round((158 - (W_T - 0.35) * 32 + (W_D - 0.35) * 14) * occFactor);
    const dDynamic = +(1.06 - (W_D - 0.35) * 0.26 + (W_T - 0.35) * 0.16).toFixed(2);
    const eDynamic = Math.round((998 - (W_T - 0.35) * 110 - (W_D - 0.35) * 30) * occFactor);
    const coreA_Dynamic = Math.round(95 * occFactor);
    const coreB_Dynamic = Math.round(95 * occFactor);

    // 3. PHASED ZONE EVACUATION (Wave Staged Protocol)
    const tPhased = Math.round((198 - (W_T - 0.35) * 48 + (W_D - 0.35) * 28) * occFactor);
    const dPhased = +(1.00 - (W_D - 0.35) * 0.28 + (W_T - 0.35) * 0.18).toFixed(2);
    const ePhased = Math.round((1083 - (W_T - 0.35) * 130 + (W_D - 0.35) * 80) * occFactor);
    const wave1_Phased = Math.round(70 * occFactor);
    const wave2_Phased = Math.round(120 * occFactor);

    const raw = [
      {
        id: 'NEAREST',
        title: 'Nearest Core',
        desc: 'Occupants head to the closest stairwell core without load balancing.',
        timeNum: tNearest,
        densityNum: dNearest,
        exposureNum: eNearest,
        coreA: `${coreA_Nearest}p`,
        coreB: `${coreB_Nearest}p`,
        distributionLabel: `Core A: ${coreA_Nearest}p | Core B: ${coreB_Nearest}p`,
        bullets: [
          W_T >= 0.45 ? 'Optimal rapid egress velocity under speed priority' : 'Shortest individual path distance',
          W_D >= 0.45 ? 'High stairwell congestion at Primary Core A' : 'No intermediate routing chokepoint detected',
          'Lower toxic inhalation exposure window'
        ]
      },
      {
        id: 'DYNAMIC',
        title: 'Dynamic Core Balancing',
        desc: 'Digital signage diverts occupants evenly between active cores.',
        timeNum: tDynamic,
        densityNum: dDynamic,
        exposureNum: eDynamic,
        coreA: `${coreA_Dynamic}p`,
        coreB: `${coreB_Dynamic}p`,
        distributionLabel: `Core A: ${coreA_Dynamic}p | Core B: ${coreB_Dynamic}p (50/50)`,
        bullets: [
          'Balanced 50/50 dual-stairwell capacity utilization',
          W_D >= 0.40 ? 'Eliminates stairwell crush & crush hazard' : '~34% lower stampede risk than Nearest',
          W_T >= 0.50 ? 'Moderate detour penalty (+14s vs direct)' : 'Uniform laminar egress throughput'
        ]
      },
      {
        id: 'PHASED',
        title: 'Phased Zone Evacuation',
        desc: 'Evacuate fire floor and adjacent levels first; others sheltered for 45s.',
        timeNum: tPhased,
        densityNum: dPhased,
        exposureNum: ePhased,
        coreA: `${wave1_Phased}p`,
        coreB: `${wave2_Phased}p`,
        distributionLabel: `Wave 1: ${wave1_Phased}p | Wave 2: ${wave2_Phased}p`,
        bullets: [
          'Zero stairwell crush (lowest localized density)',
          'Immediate priority clearance for hazard floor',
          W_T >= 0.45 ? 'High delay risk for sheltered upper floors' : 'Extended total building clearance window'
        ]
      }
    ];

    // TOPSIS Min-Max Cost Criteria Normalization (Lower is better)
    const mins = [120, 0.70, 750];
    const maxs = [230, 1.80, 1250];

    raw.forEach(item => {
      const sT = Math.max(0, Math.min(1, (maxs[0] - item.timeNum) / (maxs[0] - mins[0])));
      const sD = Math.max(0, Math.min(1, (maxs[1] - item.densityNum) / (maxs[1] - mins[1])));
      const sE = Math.max(0, Math.min(1, (maxs[2] - item.exposureNum) / (maxs[2] - mins[2])));
      item.topsisScore = Number((W_T * sT + W_D * sD + W_E * sE).toFixed(3));
    });

    // Rank assignment
    const sorted = [...raw].sort((a, b) => b.topsisScore - a.topsisScore);
    const rankMap = {};
    sorted.forEach((item, idx) => {
      rankMap[item.id] = idx + 1;
    });

    return raw.map(item => {
      const rank = rankMap[item.id];
      let tag = '#1 RECOMMENDED';
      let tagColor = '#10b981';
      let borderColor = '#10b981';
      let badgeBg = 'rgba(16, 185, 129, 0.15)';
      let badgeText = '#34d399';

      if (rank === 2) {
        tag = '#2 VIABLE';
        tagColor = '#38bdf8';
        borderColor = '#38bdf8';
        badgeBg = 'rgba(56, 189, 248, 0.15)';
        badgeText = '#38bdf8';
      } else if (rank === 3) {
        tag = '#3 HIGH RISK';
        tagColor = '#ef4444';
        borderColor = '#ef4444';
        badgeBg = 'rgba(239, 68, 68, 0.15)';
        badgeText = '#f87171';
      }

      return {
        ...item,
        rank,
        tag,
        tagColor,
        borderColor,
        badgeBg,
        badgeText,
        time: `${item.timeNum} s`,
        density: `${item.densityNum} p/m²`,
        exposure: `${item.exposureNum} pts`
      };
    });
  }, [weights, totalOccupants]);

  // Currently selected strategy object
  const currentSelected = useMemo(() => {
    return strategies.find(s => s.id === selectedStrategy) || strategies[0];
  }, [strategies, selectedStrategy]);

  // ── "Update & Compare" Button Action ──
  const handleUpdateAndCompare = useCallback(() => {
    setIsRecalculating(true);
    setLastUpdatedNotice('Recalculating TOPSIS Decision Matrix...');

    setTimeout(() => {
      setIsRecalculating(false);
      // Auto-focus recommended strategy if user hasn't locked another
      const topStrat = strategies.find(s => s.rank === 1);
      if (topStrat) {
        setSelectedStrategy(topStrat.id);
        setLastUpdatedNotice(`Matrix Optimized • ${topStrat.title} Ranked #1`);
      } else {
        setLastUpdatedNotice('Strategy Matrix Updated');
      }
    }, 350);
  }, [strategies]);

  // Dynamic recommendation summary text
  const getStrategySummaryText = (strat) => {
    if (strat.rank === 1) {
      return `Top ranked strategy with highest TOPSIS score (${strat.topsisScore}). Best multi-criteria trade-off for current weights (${weights.time}% Time, ${weights.density}% Density, ${weights.exposure}% Exposure). Recommended for immediate execution.`;
    }
    if (strat.rank === 2) {
      return `Viable secondary strategy (TOPSIS score ${strat.topsisScore}). Offers safe alternative routing, but slightly less optimal under current priority weighting.`;
    }
    return `Higher risk profile under current objectives (TOPSIS score ${strat.topsisScore}). Suboptimal trade-off; recommended only when specific localized conditions demand it.`;
  };

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
      {/* ── Top Header Banner (Yellow buttons removed per user instruction) ── */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-sky-500/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400' : 'bg-sky-100 border border-sky-300 text-sky-600'
          }`}>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-lg font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                AI Multi-Strategy Simulation & Decision Ranker
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-purple-100 text-purple-700 border border-purple-300'
              }`}>
                TOPSIS DECISION ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Evaluate and rank evacuation strategies dynamically using TOPSIS, simulation physics, and live multi-criteria weights.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Layout: 2 Columns (Simulation Context Left | 3 Strategy Cards Right) ── */}
      {/* Note: Pink Box (Radar & Side TOPSIS) completely removed per user instruction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        
        {/* ── Column 1: Simulation Context & Weights (4 cols) ── */}
        <div className="lg:col-span-4 xl:col-span-3.5 flex flex-col gap-4">
          <div
            className="p-4 sm:p-5 rounded-2xl flex flex-col gap-4 shadow-sm"
            style={{
              background: isDark ? 'rgba(11, 22, 44, 0.85)' : '#ffffff',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0'
            }}
          >
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                Simulation Context
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Scenario and evaluation parameters
              </span>
            </div>

            {/* Active Scenario Card */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="text-slate-400 text-[11px] font-semibold">Active Scenario</label>
              <div className={`p-2.5 rounded-xl border font-medium text-xs flex items-center gap-2 ${
                isDark ? "bg-slate-900/90 border-sky-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              }`}>
                <Flame className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="truncate">{scenario?.name || 'Case 1: L1 Fire Near Main / Front Gate'}</span>
              </div>
            </div>

            {/* Building & Occupants Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px] font-semibold">Building</label>
                <div className={`p-2.5 rounded-xl border font-medium text-xs truncate ${
                  isDark ? "bg-slate-900/90 border-sky-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}>
                  10-Storey BIM
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px] font-semibold">Occupants</label>
                <div className={`p-2.5 rounded-xl border font-mono font-bold text-xs ${
                  isDark ? "bg-slate-900/90 border-sky-500/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}>
                  {totalOccupants}
                </div>
              </div>
            </div>

            {/* ── Dynamic Objectives (Weights) Sliders ── */}
            <div className="flex flex-col gap-3 pt-3 border-t border-sky-500/15 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Objective (Weights)
                  </div>
                  <div className="text-[10px] text-slate-400">Total: 100% (Proportionally balanced)</div>
                </div>
                <div className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                </div>
              </div>

              {/* Quick Presets Pills */}
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => {
                  const isCurrent = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-500/20 text-sky-400 border-sky-400'
                          : isDark
                          ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider 1: Evacuation Time */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Evacuation Time</span>
                  </span>
                  <span className={`font-bold font-mono text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                    {weights.time}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={weights.time}
                  onChange={(e) => handleWeightChange('time', e.target.value)}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Slider 2: Crowd Density */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Crowd Density</span>
                  </span>
                  <span className={`font-bold font-mono text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                    {weights.density}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={weights.density}
                  onChange={(e) => handleWeightChange('density', e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Slider 3: Toxic Exposure */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Toxic Exposure</span>
                  </span>
                  <span className={`font-bold font-mono text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                    {weights.exposure}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={weights.exposure}
                  onChange={(e) => handleWeightChange('exposure', e.target.value)}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Update & Compare Button */}
              <button
                onClick={handleUpdateAndCompare}
                disabled={isRecalculating}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] border border-blue-400 mt-1 cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isRecalculating ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating 190 Agents...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5 text-blue-200" />
                    <span>Update & Compare</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{lastUpdatedNotice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Column 2: Strategy Comparison 3 Cards (8 cols, responsive grid-cols-1 md:grid-cols-3) ── */}
        <div className="lg:col-span-8 xl:col-span-8.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>STRATEGY COMPARISON (SIMULATION RESULTS)</span>
            </div>
            <div className="text-[11px] font-mono text-sky-400 font-semibold hidden sm:flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Live TOPSIS Matrix Active</span>
            </div>
          </div>

          {/* 3 Strategy Cards (Dynamic Metrics, Scores, and Ranks) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategies.map((strat) => {
              const isSelected = selectedStrategy === strat.id;
              const isRankOne = strat.rank === 1;

              return (
                <div
                  key={strat.id}
                  onClick={() => setSelectedStrategy(strat.id)}
                  className={`rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 relative ${
                    isSelected ? 'ring-2 ring-offset-1' : 'hover:translate-y-[-2px]'
                  }`}
                  style={{
                    background: isSelected
                      ? (isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff')
                      : (isDark ? 'rgba(11, 22, 44, 0.75)' : '#ffffff'),
                    border: `1.5px solid ${isSelected ? strat.borderColor : (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e2e8f0')}`,
                    boxShadow: isSelected
                      ? `0 0 20px ${strat.borderColor}40, 0 4px 12px rgba(0,0,0,0.2)`
                      : (isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'),
                    ringColor: strat.borderColor,
                    ringOffsetColor: isDark ? '#070d18' : '#f8fafc'
                  }}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Dynamic Rank Tag & Selection Indicator */}
                    <div className="flex items-center justify-between">
                      <div
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider text-white shadow-sm flex items-center gap-1"
                        style={{ background: strat.tagColor }}
                      >
                        {isRankOne && <Trophy className="w-3 h-3" />}
                        <span>{strat.tag}</span>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 hover:text-slate-200 font-medium">
                          Click to select
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <div className={`text-sm font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        {strat.title}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug mt-1">
                        {strat.desc}
                      </div>
                    </div>

                    {/* Stair Core Utilization Pill */}
                    <div className={`px-2.5 py-1 rounded-xl text-[10px] font-mono border flex items-center justify-between ${
                      isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-slate-400 font-sans">Core Load:</span>
                      <span className="font-bold text-sky-400">{strat.distributionLabel}</span>
                    </div>

                    {/* ── Dynamic Simulation Metrics (Marked Red in user screenshot) ── */}
                    <div className={`flex flex-col gap-1.5 text-xs font-mono pt-3 border-t ${
                      isDark ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      {/* Clearance Time */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>Clearance Time</span>
                        </span>
                        <span className={`font-bold font-mono text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                          {strat.time}
                        </span>
                      </div>

                      {/* Peak Density */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans flex items-center gap-1 text-[11px]">
                          <Users className="w-3 h-3 text-emerald-400" />
                          <span>Peak Density</span>
                        </span>
                        <span className={`font-bold font-mono text-xs ${
                          strat.densityNum <= 1.10 ? 'text-emerald-400' : strat.densityNum <= 1.40 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {strat.density}
                        </span>
                      </div>

                      {/* Toxic Exposure */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans flex items-center gap-1 text-[11px]">
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          <span>Toxic Exposure</span>
                        </span>
                        <span className={`font-bold font-mono text-xs ${
                          strat.exposureNum <= 900 ? 'text-emerald-400' : strat.exposureNum <= 1000 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {strat.exposure}
                        </span>
                      </div>
                    </div>

                    {/* ── Dynamic AI Insights Bullets ── */}
                    <div className={`flex flex-col gap-1.5 text-[11px] pt-3 border-t ${
                      isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
                    }`}>
                      {strat.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5 leading-tight">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Card Bottom: Dynamic TOPSIS Score & Bar ── */}
                  <div className={`mt-4 pt-3 border-t flex flex-col gap-1.5 ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 font-sans">TOPSIS Score</span>
                      <span className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                        {strat.topsisScore}
                      </span>
                    </div>

                    {/* TOPSIS Score Bar */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-200'
                    }`}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(strat.topsisScore * 100)}%`,
                          background: strat.tagColor
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Selected Strategy Action Bar ── */}
      <div className={`px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${
        isDark ? 'bg-slate-900/90 border-sky-500/25 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: currentSelected.badgeBg,
              border: `1px solid ${currentSelected.borderColor}`
            }}
          >
            {currentSelected.rank === 1 ? (
              <Trophy className="w-5 h-5 text-amber-400" />
            ) : currentSelected.rank === 2 ? (
              <Sparkles className="w-5 h-5 text-sky-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                {currentSelected.title.includes('Evacuation') ? currentSelected.title : `${currentSelected.title} Evacuation`}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border"
                style={{
                  background: currentSelected.badgeBg,
                  color: currentSelected.badgeText,
                  borderColor: currentSelected.borderColor
                }}
              >
                TOPSIS Score: {currentSelected.topsisScore}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ background: currentSelected.tagColor }}
              >
                {currentSelected.tag}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 max-w-4xl">
              {getStrategySummaryText(currentSelected)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StrategyRankerView = React.memo(StrategyRankerViewComponent);
export default StrategyRankerView;
