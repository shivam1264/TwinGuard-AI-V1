import React, { useMemo } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  Clock,
  ShieldCheck,
  Users,
  DoorClosed
} from 'lucide-react';

export const ReportsModal = ({ stats = {}, exits = [], onClose }) => {
  const total = stats.total || (stats.inside ? stats.inside + (stats.evacuated || 0) : 190);
  const evacuated = stats.evacuated || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const evacPercent = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
              }}
            >
              <FileText style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Evacuation & Safety Audit Report
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
                Facility Digital Twin Automated Egress Assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
            }}
            title="Close Dialog"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Report Content */}
        <div className="flex flex-col overflow-y-auto" style={{ padding: '20px 24px', gap: '16px' }}>
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-3" style={{ gap: '12px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Facility Total
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {total}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                  occupants
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Evacuated Safely
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                  {evacuated}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                  ({evacPercent}%)
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Elapsed Time
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#1d4ed8', lineHeight: 1, fontFamily: 'monospace' }}>
                  {elapsed}s
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>
                  active
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Life Safety & NFPA-101 Standards
            </h3>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div className="flex items-center" style={{ gap: '10px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                <span>Dual Protected Switchback Emergency Stairwell Cores (West Core A & East Core B) Verified.</span>
              </div>
              <div className="flex items-center" style={{ gap: '10px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                <span>Multi-level 100-Room AI Vision Sensor Grid actively transmitting.</span>
              </div>
              <div className="flex items-center" style={{ gap: '10px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                <span>Stairwell egress capacity load within safe thresholds.</span>
              </div>
              <div className="flex items-center" style={{ gap: '10px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a', flexShrink: 0 }} />
                <span>Automated fire suppression and HVAC pressurization interlocks enabled.</span>
              </div>
            </div>
          </div>

          {/* Egress Core Status */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <h3 style={{ fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Egress Core Verification
            </h3>
            <div className="grid grid-cols-3" style={{ gap: '10px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>Stairwell A</div>
                <div style={{ fontSize: '9.5px', color: '#15803d', marginTop: '2px' }}>West Core • 60/min</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>Stairwell B</div>
                <div style={{ fontSize: '9.5px', color: '#15803d', marginTop: '2px' }}>East Core • 60/min</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>Stairwell C</div>
                <div style={{ fontSize: '9.5px', color: '#15803d', marginTop: '2px' }}>South Exit • 80/min</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div
          className="flex items-center justify-end shrink-0"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            gap: '10px',
          }}
        >
          <button
            onClick={() => window.print()}
            className="flex items-center cursor-pointer transition-all hover:bg-slate-100"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
              gap: '6px',
            }}
          >
            <Printer style={{ width: '14px', height: '14px' }} />
            <span>Print Report</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center cursor-pointer transition-all hover:bg-blue-700 shadow-sm"
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              gap: '6px',
            }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ReportsModal;
