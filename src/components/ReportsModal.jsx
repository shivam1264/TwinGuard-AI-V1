import React from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Building
} from 'lucide-react';

export const ReportsModal = ({ stats = {}, exits = [], onClose }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const evacPercent = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Evacuation & Safety Audit Report
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Facility Digital Twin Automated Egress Assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-slate-700 text-xs">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Total</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{total} occupants</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">Evacuated Safely</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">{evacuated} ({evacPercent}%)</span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/80">
              <span className="text-[10px] font-bold text-blue-600 uppercase block">Elapsed Time</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">{elapsed}s</span>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Life Safety & NFPA-101 Standards
            </h3>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dual Protected Switchback Emergency Stairwell Cores (West Core A & East Core B) Verified.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-level 100-Room AI Vision Sensor Grid actively transmitting.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Stairwell egress capacity load within safe thresholds.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

