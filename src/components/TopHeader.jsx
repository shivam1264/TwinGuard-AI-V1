import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  Video,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  Home,
  Sparkles,
  Trophy
} from 'lucide-react';

export const TopHeader = ({
  activeTab,
  onSelectTab,
  incidentCount = 3,
  onOpenCctv,
  onOpenAnalytics,
  onOpenIncidents,
  onOpenReports,
  onOpenSettings,
  onOpenScenarioStudio,
  onOpenStrategyRanker,
  serverConnected = true
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 z-30 shadow-xs">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
          <Building2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="font-black text-base tracking-tight text-slate-900 leading-none">
            DIGITAL TWIN
          </div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
            SMART EMERGENCY COMMAND
          </div>
        </div>
      </div>

      {/* Center: Main Navigation Tabs (Spacious & Crisp) */}
      <nav className="hidden md:flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
        {/* Live View */}
        <button
          onClick={() => onSelectTab('LIVE_VIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'LIVE_VIEW'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Home className="w-4 h-4 stroke-[2.2]" />
          <span>Live View</span>
        </button>

        {/* AI Scenario Studio (Phase 1 AI Module) */}
        <button
          onClick={() => {
            onSelectTab('SCENARIOS');
            if (onOpenScenarioStudio) onOpenScenarioStudio();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
            activeTab === 'SCENARIOS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold border-blue-600'
              : 'text-purple-700 hover:text-purple-900 bg-purple-50/80 hover:bg-purple-100/80 border-purple-200/80 font-bold'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600 stroke-[2.2]" />
          <span>AI Scenarios</span>
        </button>

        {/* AI Strategy Ranker (Phase 3 AI Module) */}
        <button
          onClick={() => {
            onSelectTab('STRATEGY_RANKER');
            if (onOpenStrategyRanker) onOpenStrategyRanker();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
            activeTab === 'STRATEGY_RANKER'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/25 font-bold border-amber-600'
              : 'text-amber-800 hover:text-amber-950 bg-amber-50/90 hover:bg-amber-100 border-amber-300/80 font-bold'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-600 stroke-[2.2]" />
          <span>Strategy Ranker</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => {
            onSelectTab('ANALYTICS');
            if (onOpenAnalytics) onOpenAnalytics();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'ANALYTICS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 stroke-[2.2]" />
          <span>Analytics</span>
        </button>

        {/* CCTV */}
        <button
          onClick={() => {
            onSelectTab('CCTV');
            if (onOpenCctv) onOpenCctv();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'CCTV'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Video className="w-4 h-4 stroke-[2.2]" />
          <span>CCTV</span>
        </button>

        {/* Incidents (with red badge) */}
        <button
          onClick={() => {
            onSelectTab('INCIDENTS');
            if (onOpenIncidents) onOpenIncidents();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all relative ${
            activeTab === 'INCIDENTS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
          <span>Incidents</span>
          {incidentCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center leading-none shadow-xs ml-0.5">
              {incidentCount}
            </span>
          )}
        </button>

        {/* Reports */}
        <button
          onClick={() => {
            onSelectTab('REPORTS');
            if (onOpenReports) onOpenReports();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'REPORTS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <FileText className="w-4 h-4 stroke-[2.2]" />
          <span>Reports</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            onSelectTab('SETTINGS');
            if (onOpenSettings) onOpenSettings();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Settings className="w-4 h-4 stroke-[2.2]" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Right: Building Selector, Live Date/Time, User Avatar */}
      <div className="flex items-center gap-3.5">
        {/* Building Selector Dropdown */}
        <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold text-slate-800 leading-none">10-Storey Tower</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Office Building</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </div>

        {/* Live Date & Time */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl">
          <Calendar className="w-4 h-4 text-slate-500" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium leading-none">
              {formatDate(currentTime)}
            </div>
            <div className="text-xs font-black text-slate-900 leading-none mt-1">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* User Avatar Badge */}
        <div
          className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center border-2 border-blue-200 shadow-xs cursor-pointer hover:scale-105 transition-transform"
          title="Security Commander SK"
        >
          SK
        </div>
      </div>
    </header>
  );
};
