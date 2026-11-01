import React from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  Clock,
  ShieldCheck,
  Users,
  DoorClosed,
  AlertTriangle,
  Award,
  Calendar,
  FileCheck,
  ExternalLink
} from 'lucide-react';

export const ReportsView = ({
  theme = 'dark',
  stats = { total: 190, evacuated: 0, inTransit: 190, elapsedSeconds: 0 },
  exits = [],
  onSwitchToLive
}) => {
  const isDark = theme === 'dark';
  const total = stats.total || 190;
  const evacuated = stats.evacuated || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const evacPercent = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const reportData = {
      facility: 'TwinGuard Horizon Tower',
      date: new Date().toISOString(),
      evacuationStats: {
        totalOccupants: total,
        evacuatedCount: evacuated,
        completionPercent: evacPercent,
        elapsedSeconds: elapsed
      },
      codeCompliance: {
        nfpa101: '100% Certified',
        ibc: 'Class A Commercial compliant',
        iso22301: 'Active'
      }
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TwinGuard_Safety_Audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto no-scrollbar select-none p-6 gap-6 transition-colors duration-300 ${
        isDark ? 'bg-[#070d18] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Title & Export Bar ── */}
      <div
        className={`p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isDark ? 'border-sky-500/20' : 'border-slate-200'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(11, 22, 44, 0.95) 0%, rgba(7, 13, 24, 0.9) 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
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
            <FileText className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Life Safety & Egress Compliance Audit Report
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Official NFPA 101, IBC 2024 & ISO 22301 Egress Certification Record.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer shadow-lg shadow-blue-500/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Audit</span>
          </button>
        </div>
      </div>

      {/* ── Key Compliance KPI Badges ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            100%
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400 font-bold uppercase">NFPA 101 Life Safety</div>
            <div className="text-xs font-bold text-emerald-400">Fully Compliant</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
            IBC
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400 font-bold uppercase">Building Code 2024</div>
            <div className="text-xs font-bold text-white">Class A Commercial</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
            ISO
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400 font-bold uppercase">Security & Resilience</div>
            <div className="text-xs font-bold text-purple-300">ISO 22301 Certified</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            3/3
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400 font-bold uppercase">Operational Stairwells</div>
            <div className="text-xs font-bold text-amber-300">Cores A, B, C Ready</div>
          </div>
        </div>
      </div>

      {/* ── Official Compliance Checklist Sheet ── */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Statutory Compliance Verifications</span>
        </h2>

        <div className="divide-y divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Minimum 2 Remote Exit Enclosures per Story</div>
              <div className="text-[11px] text-slate-400">IBC Section 1006.3 / NFPA 101 Section 7.4</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PASSED (3 Provided)
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Stairway Width Capacity (&gt; 0.3 in. per occupant)</div>
              <div className="text-[11px] text-slate-400">NFPA 101 Section 7.3.3.1</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PASSED (1.8m Core Clear)
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Maximum Travel Distance to Exit (&lt; 75m fully sprinklered)</div>
              <div className="text-[11px] text-slate-400">IBC Table 1017.2</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PASSED (Max 38m recorded)
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Pressurized Smoke Proof Stair Towers (NFPA 92)</div>
              <div className="text-[11px] text-slate-400">Active Differential Pressure Sensors: OK</div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PASSED (50 Pa Active)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
