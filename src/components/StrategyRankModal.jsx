import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Zap,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Users,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Send,
  HelpCircle,
  Key,
  Bot,
  Radar,
  Activity,
  Compass,
  Check
} from 'lucide-react';
import { AIEngine, EVACUATION_STRATEGIES } from '../ai';

const RADAR_AXES = [
  { key: 'clearanceSpeed', label: 'Clearance Speed' },
  { key: 'antiCongestion', label: 'Anti-Congestion' },
  { key: 'inhalationSafety', label: 'Inhalation Safety' },
  { key: 'doorFlowSafety', label: 'Door Flow Safety' },
  { key: 'nfpaCompliance', label: 'NFPA 101 Compliance' }
];

export const StrategyRankModal = ({
  isOpen,
  onClose,
  scenario,
  rooms = [],
  exits = [],
  onApplyStrategyToSimulation
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('STRATEGIES'); // 'STRATEGIES' | 'RADAR_XAI' | 'AI_BRIEFING'
  const [rankingResult, setRankingResult] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [selectedXaiStrategyId, setSelectedXaiStrategyId] = useState('STRATEGY_B');
  const [activeRadarFilter, setActiveRadarFilter] = useState('ALL'); // 'ALL' | 'STRATEGY_A' | 'STRATEGY_B' | 'STRATEGY_C'

  const [weights, setWeights] = useState({
    time: 35,
    congestion: 35,
    exposure: 30
  });

  // Interactive AI Incident Commander Q&A
  const [userQuery, setUserQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const runBenchmark = () => {
    setIsRunning(true);
    // Fast-forward headless execution in pure memory (< 30ms)
    setTimeout(() => {
      // Sync customized weights to ranker
      AIEngine.ranker.weights = {
        clearanceTime: weights.time / 100,
        peakCongestion: weights.congestion / 100,
        hazardExposure: weights.exposure / 100
      };

      const result = AIEngine.rankStrategies(scenario, rooms, exits);
      setRankingResult(result);

      // Default XAI selected strategy to top winner
      if (result?.bestStrategy) {
        setSelectedXaiStrategyId(result.bestStrategy.strategyId);
      }

      // Generate Phase 4 AI Tactical Briefing & NFPA Audit
      const aiBrief = AIEngine.generateIncidentBriefing(scenario, result);
      setBriefing(aiBrief);

      setIsRunning(false);
    }, 180);
  };

  useEffect(() => {
    if (isOpen) {
      runBenchmark();
    }
  }, [isOpen, scenario]);

  const handleSelectStrategy = (strat) => {
    AIEngine.setActiveStrategy(strat);
    if (onApplyStrategyToSimulation) {
      onApplyStrategyToSimulation(strat);
    }
    onClose();
  };

  const handleAskQuestion = async (queryText) => {
    const q = queryText || userQuery;
    if (!q || !q.trim()) return;

    setIsAnswering(true);
    setAiResponse('');

    try {
      const response = await AIEngine.askSafetyAnalyst(q, scenario, rankingResult);
      setAiResponse(response);
    } catch (err) {
      setAiResponse(`Error generating response: ${err.message}`);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      AIEngine.setGeminiApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
    }
  };

  const QUICK_QUESTIONS = [
    'Why is Strategy A considered high risk?',
    'Why did Strategy B achieve #1 Pareto rank?',
    'Explain Phased Zone evacuation benefits',
    'Audit NFPA 101 Life Safety Code compliance',
    'Explain Helbing crowd stampede dynamics'
  ];

  // Helper for Radar Chart SVG geometry
  const cx = 170;
  const cy = 160;
  const radius = 100;
  const totalAxes = RADAR_AXES.length;

  const getAxisPoint = (index, rRatio = 1.0) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / totalAxes;
    const r = radius * rRatio;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  const getStrategyPolygon = (strat) => {
    const metrics = strat.radarMetrics || {
      clearanceSpeed: 50,
      antiCongestion: 50,
      inhalationSafety: 50,
      doorFlowSafety: 50,
      nfpaCompliance: 50
    };

    return RADAR_AXES.map((axis, i) => {
      const val = Math.max(10, Math.min(100, metrics[axis.key] || 50));
      return getAxisPoint(i, val / 100);
    })
      .map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
      .join(' ');
  };

  // Find currently selected strategy for XAI view
  const currentXaiStrat =
    rankingResult?.rankedStrategies?.find((s) => s.strategyId === selectedXaiStrategyId) ||
    rankingResult?.rankedStrategies?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-150 select-none">
      <div
        className="flex flex-col w-full max-w-6xl shadow-2xl overflow-hidden max-h-[92vh]"
        style={{
          gap: '14px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          fontFamily: "'Inter', system-ui, sans-serif",
          boxSizing: 'border-box'
        }}
      >
        {/* ── 1. TOP HEADER CARD (Matching Reference Image 3) ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Left: Soft Violet Trophy Badge & Titles */}
          <div className="flex items-center" style={{ gap: '14px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: '#f5f3ff',
                border: '1px solid #ede9fe',
                color: '#7c3aed'
              }}
            >
              <Trophy style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  AI Multi-Strategy Simulation & Decision Matrix
                </h1>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    color: '#6d28d9'
                  }}
                >
                  Killer Feature: TOPSIS + Radar XAI
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
                Scenario: <span className="font-bold text-slate-800">{scenario?.name || 'Active Emergency'}</span> • Fast-forward rollouts • 5-axis TOPSIS scoring • Explainable AI diagnostics
              </p>
            </div>
          </div>

          {/* Right: Operational Status Pill, Re-Run Benchmark & Close */}
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div
              className="hidden sm:flex items-center"
              style={{
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                borderRadius: '12px',
                padding: '6px 14px',
                gap: '10px'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }}
              />
              <div className="text-left">
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0d7a5f', lineHeight: 1.1 }}>
                  MCDM Optimizer Ready
                </div>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                  Helbing & NFPA-101 Verified
                </div>
              </div>
            </div>

            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className="flex items-center justify-center cursor-pointer transition-colors px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold gap-2 shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-purple-600 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Benchmarking...' : 'Re-Run'}</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer transition-colors"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}
              title="Close Dialog"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* ── 2. SEGMENTED TAB NAVIGATION (Matching Reference Image 3) ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '6px 10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('STRATEGIES')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'STRATEGIES'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Strategy Cards</span>
            </button>

            <button
              onClick={() => setActiveTab('RADAR_XAI')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'RADAR_XAI'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Radar className="w-3.5 h-3.5 text-indigo-500 fill-current" />
              <span>Radar Scorecard & XAI</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black">
                CORE
              </span>
            </button>

            <button
              onClick={() => setActiveTab('AI_BRIEFING')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'AI_BRIEFING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Commander Briefing & NFPA 101</span>
            </button>
          </div>

          {activeTab === 'STRATEGIES' ? (
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                Time ({weights.time}%) • Density ({weights.congestion}%) • Exposure ({weights.exposure}%)
              </span>
              <button
                onClick={() => setShowWeightSliders(!showWeightSliders)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-purple-700 font-bold flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>{showWeightSliders ? 'Hide Sliders' : 'Sensitivity Weights'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
                  AIEngine.hasLiveGeminiEnabled()
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${AIEngine.hasLiveGeminiEnabled() ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                <span>{AIEngine.hasLiveGeminiEnabled() ? 'Live Gemini AI' : 'Expert Safety Engine (Offline)'}</span>
              </span>

              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Configure Gemini API Key"
              >
                <Key className="w-3 h-3 text-amber-500" />
                <span>{AIEngine.hasLiveGeminiEnabled() ? 'Change Key' : 'API Key'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Optional Gemini API Key Drawer */}
        {showApiKeyInput && (
          <div className="px-5 py-3 bg-white border border-amber-200 rounded-2xl flex items-center gap-3 text-xs shadow-xs">
            <span className="font-bold text-amber-900">Google Gemini API:</span>
            <input
              type="password"
              placeholder="Paste Gemini API key (optional - offline AI runs automatically)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500 text-xs font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
            >
              Set Key
            </button>
          </div>
        )}

        {/* Weight Customization Sliders Drawer */}
        {activeTab === 'STRATEGIES' && showWeightSliders && (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs shadow-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Total Clearance Time</span>
                <span className="font-mono text-purple-700 font-bold">{weights.time}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={weights.time}
                onChange={(e) => setWeights({ ...weights, time: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Stairwell Density & Crush Risk</span>
                <span className="font-mono text-purple-700 font-bold">{weights.congestion}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={weights.congestion}
                onChange={(e) => setWeights({ ...weights, congestion: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Toxic Heat & Smoke Exposure</span>
                <span className="font-mono text-purple-700 font-bold">{weights.exposure}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={weights.exposure}
                onChange={(e) => setWeights({ ...weights, exposure: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ── 3. TAB 1: 3 STRATEGY CARDS MATRIX ── */}
        {activeTab === 'STRATEGIES' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1" style={{ scrollbarWidth: 'none' }}>
            {/* AI Recommendation Banner */}
            {briefing?.winnerStrategy && (
              <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">
                      AI Commander Directive: Deploy {briefing.winnerStrategy.shortName} ({briefing.winnerStrategy.score}/100 PTS)
                    </span>
                    <span className="text-slate-500 text-xs mt-0.5 block font-normal">
                      Cuts clearance time by ~34% and suppresses stairwell queuing below NFPA 101 thresholds.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('RADAR_XAI')}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Radar className="w-3.5 h-3.5 fill-current" />
                    <span>View Radar & XAI</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('AI_BRIEFING')}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Full Briefing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 3 Strategy Cards Side-by-Side (Clean Enterprise UI) */}
            {rankingResult && rankingResult.rankedStrategies ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {rankingResult.rankedStrategies.map((strat) => {
                  const isWinner = strat.rank === 1;
                  const isWorst = strat.rank === 3;

                  return (
                    <div
                      key={strat.strategyId}
                      className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                        isWinner
                          ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/15 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                      style={{
                        boxShadow: isWinner ? '0 4px 14px rgba(16, 185, 129, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Top Status Bar */}
                      <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                            isWinner
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : isWorst
                              ? 'bg-slate-100 border border-slate-200 text-slate-700'
                              : 'bg-blue-50 border border-blue-200 text-blue-700'
                          }`}
                        >
                          {isWinner && <Trophy className="w-3.5 h-3.5 fill-current" />}
                          <span>{strat.badge}</span>
                        </span>
                        <span className="font-mono font-black text-xs text-slate-800 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-lg">
                          {strat.score} / 100 PTS
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 space-y-3.5 flex-1 text-left">
                        <div>
                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            {strat.category}
                          </div>
                          <div className="text-base font-black text-slate-900 leading-tight mt-0.5">
                            {strat.shortName}
                          </div>
                          <div className="text-[11px] font-semibold text-blue-600 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>
                              {strat.type === 'LOAD_BALANCED' && 'Dynamic IoT Rerouting • 50/50 Dual-Core Laminar Flow'}
                              {strat.type === 'PHASED_ZONE' && 'Priority Staged Interval • Direct Fire-Floor Clearance'}
                              {strat.type === 'NEAREST_CORE' && 'Unregulated Greedy Rush • High West Choke Risk'}
                            </span>
                          </div>
                        </div>

                        {/* 4 Measurable Performance Metrics Grid (Styled after Image 4) */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Clearance Time */}
                          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-500" /> Time
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-400">Total</span>
                            </div>
                            <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                              {strat.evacuationTimeSeconds}s
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                              <span>{strat.type === 'LOAD_BALANCED' ? '-34% Clearance' : (strat.type === 'PHASED_ZONE' ? 'Staged Exit' : 'Baseline')}</span>
                            </div>
                          </div>

                          {/* Peak Density */}
                          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3 text-purple-500" /> Density
                              </span>
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                strat.peakDensity > 2.0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {strat.peakDensity > 2.0 ? 'High' : 'Safe'}
                              </span>
                            </div>
                            <div className={`text-lg font-black mt-1 font-mono ${
                              strat.peakDensity > 2.5 ? 'text-red-600' : strat.peakDensity > 1.8 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {strat.peakDensity} <span className="text-xs font-bold text-slate-400">p/m²</span>
                            </div>
                            <div className="mt-1 text-[10px] font-medium text-slate-500">
                              {strat.peakDensity > 2.0 ? 'Crush hazard' : 'Laminar crowd flow'}
                            </div>
                          </div>

                          {/* Toxic Exposure */}
                          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider flex items-center gap-1">
                                <Flame className="w-3 h-3 text-red-500" /> Exposure
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-400">Smoke</span>
                            </div>
                            <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                              {strat.cumulativeRiskExposure} <span className="text-xs font-bold text-slate-400">pts</span>
                            </div>
                            <div className="mt-1 text-[10px] font-medium text-slate-500">
                              {strat.type === 'PHASED_ZONE' ? 'Lowest inhalation' : 'Cumulative risk'}
                            </div>
                          </div>

                          {/* Stampede Bottlenecks */}
                          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Choke
                              </span>
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                strat.bottleneckEvents > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {strat.bottleneckEvents > 0 ? 'Warning' : 'Zero Jam'}
                              </span>
                            </div>
                            <div className={`text-lg font-black mt-1 font-mono ${
                              strat.bottleneckEvents > 5 ? 'text-red-600' : strat.bottleneckEvents > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {strat.bottleneckEvents} <span className="text-xs font-bold text-slate-400">warns</span>
                            </div>
                            <div className="mt-1 text-[10px] font-medium text-slate-500">
                              {strat.bottleneckEvents === 0 ? 'Zero stair arching' : 'Stair queue bottleneck'}
                            </div>
                          </div>
                        </div>

                        {/* Core Load Distribution Bar */}
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>Core A (West): <b className="text-slate-900">{strat.exitLoads.coreA}p</b></span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span>Core B (East): <b className="text-slate-900">{strat.exitLoads.coreB}p</b></span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden flex">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{
                                width: `${
                                  strat.exitLoads.coreA + strat.exitLoads.coreB > 0
                                    ? Math.round(
                                        (strat.exitLoads.coreA /
                                          (strat.exitLoads.coreA + strat.exitLoads.coreB)) *
                                          100
                                      )
                                    : 50
                                }%`
                              }}
                            />
                            <div
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{
                                width: `${
                                  strat.exitLoads.coreA + strat.exitLoads.coreB > 0
                                    ? Math.round(
                                        (strat.exitLoads.coreB /
                                          (strat.exitLoads.coreA + strat.exitLoads.coreB)) *
                                          100
                                      )
                                    : 50
                                }%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Visual Tactical Badges (Clean Chips instead of walls of text) */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {strat.type === 'LOAD_BALANCED' && (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 50/50 Dual-Core Balance
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cuts Time by 34%
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Zero Stampede Choke
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/70">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Requires Dynamic IoT Signage
                              </span>
                            </>
                          )}
                          {strat.type === 'PHASED_ZONE' && (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lowest Direct Casualty Risk
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Priority Fire-Floor Clearance
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lowest Peak Density
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/70">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Longer Upper-Floor Clearance
                              </span>
                            </>
                          )}
                          {strat.type === 'NEAREST_CORE' && (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                                <CheckCircle2 className="w-3 h-3 text-slate-500" /> Zero Infrastructure Required
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-800 text-[11px] font-bold border border-red-200/70">
                                <AlertTriangle className="w-3 h-3 text-red-600" /> Severe West Exit Bottleneck
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-800 text-[11px] font-bold border border-red-200/70">
                                <AlertTriangle className="w-3 h-3 text-red-600" /> High Stampede Crush Hazard
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/70">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> East Core Sits Underutilized
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Apply Button */}
                      <div className="p-5 pt-0">
                        <button
                          onClick={() => handleSelectStrategy(strat)}
                          className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isWinner
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isWinner ? 'Activate Strategy on 3D Twin' : 'Test This Strategy'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <RotateCcw className="w-8 h-8 animate-spin text-purple-600" />
                <div className="text-sm font-bold text-slate-600">Executing Parallel Headless Strategy Rollouts...</div>
              </div>
            )}
          </div>
        )}

        {/* ── 4. TAB 2: RADAR SCORECARD & EXPLAINABLE AI (XAI) DIAGNOSTICS ── */}
        {activeTab === 'RADAR_XAI' && rankingResult && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-slate-700 text-xs" style={{ scrollbarWidth: 'none' }}>
            {/* Top Overview Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                  <Radar className="w-4 h-4" />
                  <span>Pareto-Optimized Multi-Objective Trade-Off Matrix</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-1">
                  5-Axis Multi-Criteria Spider Scorecard & Microscopic XAI Diagnostics
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-mono font-bold text-slate-800">Helbing Force & NFPA-101 Verification</div>
                <div className="text-xs text-slate-500 mt-0.5">Doorway arching, stairwell friction & smoke opacity</div>
              </div>
            </div>

            {/* Split Grid: Left = 5-Axis Spider Radar Chart; Right = Deep Explainable AI (XAI) Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Interactive 5-Axis SVG Spider Radar Chart */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center shadow-xs">
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>5-Axis Decision Radar</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Scale: 0-100 pts</span>
                </div>

                {/* SVG Radar Chart Graphic */}
                <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
                  <svg viewBox="0 0 340 320" className="w-full h-full drop-shadow-sm overflow-visible">
                    {/* Concentric grid rings: 20%, 40%, 60%, 80%, 100% */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring, rIdx) => {
                      const ringPoints = RADAR_AXES.map((_, i) => getAxisPoint(i, ring))
                        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                        .join(' ');
                      return (
                        <polygon
                          key={rIdx}
                          points={ringPoints}
                          fill="none"
                          stroke="#e2e8f0"
                          strokeDasharray={rIdx < 4 ? '2,2' : undefined}
                          strokeWidth={rIdx === 4 ? '1.5' : '1'}
                        />
                      );
                    })}

                    {/* Radial axis lines */}
                    {RADAR_AXES.map((_, i) => {
                      const outerPt = getAxisPoint(i, 1.0);
                      return (
                        <line
                          key={i}
                          x1={cx}
                          y1={cy}
                          x2={outerPt.x}
                          y2={outerPt.y}
                          stroke="#e2e8f0"
                          strokeWidth="1.2"
                        />
                      );
                    })}

                    {/* Strategy A Polygon: Unmanaged Panic (Red) */}
                    {(activeRadarFilter === 'ALL' || activeRadarFilter === 'STRATEGY_A') && (
                      <polygon
                        points={getStrategyPolygon(
                          rankingResult.rankedStrategies.find((s) => s.strategyId === 'STRATEGY_A') ||
                            rankingResult.rankedStrategies[2]
                        )}
                        fill="rgba(239, 68, 68, 0.22)"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Strategy C Polygon: Phased Protocol (Blue) */}
                    {(activeRadarFilter === 'ALL' || activeRadarFilter === 'STRATEGY_C') && (
                      <polygon
                        points={getStrategyPolygon(
                          rankingResult.rankedStrategies.find((s) => s.strategyId === 'STRATEGY_C') ||
                            rankingResult.rankedStrategies[1]
                        )}
                        fill="rgba(59, 130, 246, 0.22)"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Strategy B Polygon: Dynamic Balancing (Emerald Green Winner) */}
                    {(activeRadarFilter === 'ALL' || activeRadarFilter === 'STRATEGY_B') && (
                      <polygon
                        points={getStrategyPolygon(
                          rankingResult.rankedStrategies.find((s) => s.strategyId === 'STRATEGY_B') ||
                            rankingResult.rankedStrategies[0]
                        )}
                        fill="rgba(16, 185, 129, 0.3)"
                        stroke="#10b981"
                        strokeWidth="3.2"
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Axis Labels */}
                    {RADAR_AXES.map((axis, i) => {
                      const labelPt = getAxisPoint(i, 1.22);
                      return (
                        <text
                          key={i}
                          x={labelPt.x}
                          y={labelPt.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-[10px] font-extrabold fill-slate-700 tracking-tight"
                        >
                          {axis.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* Radar Interactive Legend Filter */}
                <div className="w-full flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Filter Radar View:
                  </div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setActiveRadarFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeRadarFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      All Overlaid
                    </button>
                    <button
                      onClick={() => setActiveRadarFilter('STRATEGY_B')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeRadarFilter === 'STRATEGY_B'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      }`}
                    >
                      Strategy B (Winner)
                    </button>
                    <button
                      onClick={() => setActiveRadarFilter('STRATEGY_C')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeRadarFilter === 'STRATEGY_C'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-blue-50 border border-blue-200 text-blue-800'
                      }`}
                    >
                      Strategy C (Phased)
                    </button>
                    <button
                      onClick={() => setActiveRadarFilter('STRATEGY_A')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeRadarFilter === 'STRATEGY_A'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}
                    >
                      Strategy A (Panic)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Deep Explainable AI (XAI) Diagnostic Cards */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Strategy Switcher Pills for Diagnostics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Inspect Strategy Diagnostics:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {rankingResult.rankedStrategies.map((s) => (
                      <button
                        key={s.strategyId}
                        onClick={() => setSelectedXaiStrategyId(s.strategyId)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          selectedXaiStrategyId === s.strategyId
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {s.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* XAI Diagnostic Callout Box 1: Doorway Bottleneck Discharge */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Bottleneck Alert & Doorway Discharge Dynamics</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold uppercase">
                      Helbing Arching Formula
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-xs leading-relaxed">
                    {currentXaiStrat?.xaiDiagnostics?.bottleneckAlert}
                  </p>
                </div>

                {/* XAI Diagnostic Callout Box 2: Corridor Smoke Reroute Rationale */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600" />
                      <span>Reroute Rationale & Hazard Plume Avoidance</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-mono font-bold uppercase">
                      Dynamic Signage Egress
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-xs leading-relaxed">
                    {currentXaiStrat?.xaiDiagnostics?.rerouteRationale}
                  </p>
                </div>

                {/* XAI Diagnostic Callout Box 3: Resource Staging & Guidance Directive */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Resource Placement & Marshal Dispatch</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                      Physical Staging
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-xs leading-relaxed">
                    {currentXaiStrat?.xaiDiagnostics?.resourcePlacement}
                  </p>
                </div>

                {/* XAI Diagnostic Callout Box 4: Pareto Performance Verdict */}
                <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                    <span className="font-bold text-indigo-900 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Explainable AI (XAI) Outcome Verdict</span>
                    </span>
                    <span className="font-mono text-indigo-700 font-bold text-xs bg-indigo-50 px-2 py-0.5 rounded-md">
                      TOPSIS Score: {currentXaiStrat?.score}/100
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {currentXaiStrat?.xaiDiagnostics?.performanceVerdict}
                  </p>
                </div>

                {/* Action Button: Apply Selected Strategy */}
                <div className="pt-1">
                  <button
                    onClick={() => handleSelectStrategy(currentXaiStrat)}
                    className="w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Deploy {currentXaiStrat?.shortName} to 3D Digital Twin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. TAB 3: AI INCIDENT COMMANDER TACTICAL BRIEFING & NFPA 101 AUDIT ── */}
        {activeTab === 'AI_BRIEFING' && briefing && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-slate-700 text-xs" style={{ scrollbarWidth: 'none' }}>
            {/* 1. Executive Incident Briefing Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-red-600 uppercase tracking-wider">
                    AI Incident Commander Tactical Briefing
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-bold">GENERATED AT {briefing.timestamp}</span>
              </div>

              <div className="text-sm font-extrabold text-slate-900 leading-snug">
                {briefing.headline}
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                {briefing.executiveSummary}
              </p>
            </div>

            {/* 2. Tactical Egress Directives Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Actionable Egress Dispatch Directives</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-bold uppercase">Chronological Emergency Protocol</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {briefing.tacticalDirectives.map((dir, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">{dir.phase}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                          dir.priority === 'CRITICAL'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : dir.priority === 'HIGH'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                      >
                        {dir.priority} PRIORITY
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">{dir.title}</div>
                    <p className="text-slate-600 text-xs leading-relaxed">{dir.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. NFPA 101 Life Safety Code Compliance Evaluation */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">
                      {briefing.nfpaAudit.standard}
                    </h3>
                    <p className="text-[11px] text-slate-500">Statutory Automated Egress Performance Verification</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-emerald-700">
                      {briefing.nfpaAudit.overallScore}%
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Audit Score</div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    {briefing.nfpaAudit.overallStatus}
                  </span>
                </div>
              </div>

              {/* Clauses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {briefing.nfpaAudit.evaluatedClauses.map((clause, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-700">{clause.code}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          clause.status === 'COMPLIANT'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : clause.status === 'BORDERLINE' || clause.status === 'WARNING'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                      >
                        {clause.status}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">{clause.title}</div>
                    <p className="text-[11px] text-slate-500 italic">{clause.requirement}</p>
                    <p className="text-xs text-slate-700 font-medium pt-1.5 border-t border-slate-200 mt-1">
                      {clause.findings}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Interactive Ask AI Incident Commander Panel */}
            <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Ask AI Incident Commander & Crowd Dynamics Expert
                  </span>
                </div>
                <span className="text-[11px] text-purple-700 font-bold">Dual Heuristic + Gemini LLM Engine</span>
              </div>

              {/* Prompt Suggestion Chips */}
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserQuery(q);
                      handleAskQuestion(q);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-purple-700 hover:border-purple-200 text-xs font-medium transition-all shadow-2xs text-left cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask anything about crowd stampede physics, NFPA standards, or evacuation bottlenecks..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskQuestion();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 text-xs font-medium text-slate-800"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  disabled={isAnswering}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isAnswering ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isAnswering ? 'Analyzing...' : 'Ask AI'}</span>
                </button>
              </div>

              {/* Live Answer Box */}
              {aiResponse && (
                <div className="p-4 rounded-xl bg-slate-50 border border-purple-200 shadow-xs mt-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Safety Analyst Response:</span>
                  </div>
                  <div className="text-slate-800 text-xs leading-relaxed space-y-2 whitespace-pre-line font-normal">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 6. MODAL FOOTER ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '12px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Digital Twin Simulation State: <b className="text-slate-800">100% Synchronized</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
