import React from 'react';
import {
  Users,
  Flame,
  Milestone,
  ShieldCheck,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export const TopKpiBar = ({
  stats = { total: 190, evacuated: 0, inTransit: 190, elapsedSeconds: 0 },
  exits = [],
  incidents = [],
  onOpenAnalytics,
  onOpenReports
}) => {
  const total = stats.total || 190;
  const evacuated = stats.evacuated || 0;
  const remaining = Math.max(0, total - evacuated);
  const activeIncidentsCount = incidents.filter(i => i.severity !== 'Resolved').length || 3;
  const hasFire = incidents.some(i => i.severity === 'Critical' || i.severity === 'High');

  return (
    <div
      className="w-full shrink-0 z-20 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar select-none"
      style={{
        background: 'rgba(8, 16, 32, 0.88)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.14)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── KPI 1: Live Occupants Ingress / Egress Telemetry ── */}
      <div
        onClick={onOpenAnalytics}
        className="flex items-center gap-4 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.18)'
        }}
        title="View Detailed Crowd Occupancy & Ingress Analytics"
      >
        <div
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg"
          style={{
            background: 'rgba(37, 99, 235, 0.2)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8'
          }}
        >
          <Users className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-5 text-left">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Total Occupants
            </div>
            <div className="text-base font-black text-white font-mono leading-tight">
              {total}
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700/60" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Evacuated
            </div>
            <div className="text-base font-black text-emerald-400 font-mono leading-tight">
              {evacuated}
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700/60" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Remaining
            </div>
            <div className="text-base font-black text-sky-400 font-mono leading-tight">
              {remaining}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI 2: Stairwell Cores Status ── */}
      <div
        onClick={onOpenAnalytics}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.18)'
        }}
        title="3 Structural Egress Stairwells"
      >
        <div
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg"
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8'
          }}
        >
          <Milestone className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Stairwell Cores
          </div>
          <div className="text-sm font-black text-white flex items-center gap-1.5 leading-tight">
            <span>3 Cores</span>
            <span className="text-[11px] text-emerald-400 font-semibold">(Operational)</span>
          </div>
        </div>
      </div>

      {/* ── KPI 3: Live Hazard Status ── */}
      <div
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl transition-all"
        style={{
          background: hasFire ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.65)',
          border: hasFire ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(56, 189, 248, 0.18)',
          boxShadow: hasFire ? '0 0 12px rgba(239, 68, 68, 0.25)' : 'none'
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg"
          style={{
            background: hasFire ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)',
            border: hasFire ? '1px solid #ef4444' : '1px solid #f59e0b',
            color: hasFire ? '#ef4444' : '#f59e0b'
          }}
        >
          {hasFire ? <Flame className="w-4 h-4 animate-pulse" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div className="text-left">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Hazard Status
          </div>
          <div
            className="text-sm font-black font-mono leading-tight"
            style={{ color: hasFire ? '#ef4444' : '#f59e0b' }}
          >
            {hasFire ? 'Active Fire Alert' : `${activeIncidentsCount} Monitored`}
          </div>
        </div>
      </div>

      {/* ── KPI 4: Building Life Safety Status ── */}
      <div
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.18)'
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg"
          style={{
            background: hasFire ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: hasFire ? '1px solid #ef4444' : '1px solid #10b981',
            color: hasFire ? '#ef4444' : '#10b981'
          }}
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Building Status
          </div>
          <div
            className="text-sm font-black leading-tight flex items-center gap-1.5"
            style={{ color: hasFire ? '#ef4444' : '#34d399' }}
          >
            <span>{hasFire ? 'Emergency Alert' : 'Normal'}</span>
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ background: hasFire ? '#ef4444' : '#10b981' }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI 5: NFPA 101 / IBC Compliance Meter ── */}
      <div
        onClick={onOpenReports}
        className="flex items-center gap-3.5 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.18)'
        }}
        title="NFPA 101 Life Safety Code Compliance"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="rgba(56, 189, 248, 0.15)"
              strokeWidth="2.8"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="#10b981"
              strokeWidth="2.8"
              strokeDasharray={2 * Math.PI * 12}
              strokeDashoffset={0}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[8px] font-black text-emerald-400 font-mono">
            100%
          </span>
        </div>
        <div className="text-left">
          <div className="text-[11px] font-bold text-white leading-tight">
            NFPA 101 / IBC
          </div>
          <div className="text-[9.5px] text-slate-400 font-semibold">
            Compliance
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  );
};
