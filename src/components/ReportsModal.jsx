import React, { useMemo } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Building,
  AlertTriangle,
  Award
} from 'lucide-react';
import { AIEngine } from '../ai';

export const ReportsModal = ({ stats = {}, exits = [], onClose }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const evacPercent = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  const nfpaAudit = useMemo(() => {
    return AIEngine.auditNFPACompliance();
  }, [stats]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Evacuation & Safety Audit Report</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                  NFPA 101
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Facility Digital Twin Automated Egress Assessment & Statutory Audit
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

          {/* NFPA 101 Statutory Compliance Evaluation */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{nfpaAudit.standard}</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                {nfpaAudit.overallStatus} ({nfpaAudit.overallScore}%)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {nfpaAudit.evaluatedClauses.map((clause, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{clause.code} • {clause.title}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      clause.status === 'COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {clause.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 italic">{clause.requirement}</div>
                  <div className="text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-200/60 mt-0.5">
                    {clause.findings}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Audit</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
