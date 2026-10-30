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
  Home
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
    <header className="h-16 px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between shrink-0 z-30 shadow-xs">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
          <Building2 className="w-5.5 h-5.5 stroke-[2.2]" />
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
            TWINGUARD AI
          </div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
            DIGITAL TWIN COMMAND PLATFORM
          </div>
        </div>
      </div>

      {/* Center: Main Navigation Tabs (Spacious & Crisp Glass) */}
      <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/75 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60">
        {/* Live View */}
        <button
          onClick={() => onSelectTab('LIVE_VIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'LIVE_VIEW'
              ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Home className="w-4 h-4 stroke-[2.2]" />
          <span>Live View</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => {
            onSelectTab('ANALYTICS');
            if (onOpenAnalytics) onOpenAnalytics();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CCTV'
              ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all relative cursor-pointer ${
            activeTab === 'INCIDENTS'
              ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'REPORTS'
              ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'bg-[#0d7a5f] text-white shadow-sm shadow-[#0d7a5f]/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Settings className="w-4 h-4 stroke-[2.2]" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Right: Building Selector, Live Date/Time, User Avatar */}
      <div className="flex items-center gap-3.5">
        {/* Building Selector Dropdown */}
        <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-xl cursor-pointer hover:bg-white transition-colors shadow-2xs">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold text-slate-800 leading-none">10-Storey Tower</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Office Building</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </div>

        {/* Live Date & Time */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xs">
          <Calendar className="w-4 h-4 text-emerald-700" />
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
          className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 text-[#0d7a5f] font-black text-xs flex items-center justify-center border-2 border-emerald-200/80 shadow-xs cursor-pointer hover:scale-105 transition-transform"
          title="Security Commander SK"
        >
          SK
        </div>
      </div>
    </header>
  );
};
