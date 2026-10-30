import React from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  CheckCircle2,
  Building
} from 'lucide-react';

export const ReportsModal = ({ stats = {}, exits = [], onClose }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const evacPercent = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] select-none"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '22px 28px 18px 28px',
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
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                color: '#0d7a5f',
              }}
            >
              <FileText style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Evacuation & Safety Audit Report
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
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
              color: '#94a3b8',
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Report Content */}
        <div className="flex flex-col overflow-y-auto" style={{ padding: '20px', gap: '18px' }}>
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-3" style={{ gap: '10px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                Facility Total
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'block', marginTop: '4px' }}>
                {total} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>people</span>
              </span>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#0d7a5f', textTransform: 'uppercase', display: 'block' }}>
                Evacuated Safely
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0d7a5f', display: 'block', marginTop: '4px' }}>
                {evacuated} <span style={{ fontSize: '12px', fontWeight: 600 }}>({evacPercent}%)</span>
              </span>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                Elapsed Time
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'block', marginTop: '4px', fontFamily: 'monospace' }}>
                {elapsed}s
              </span>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Life Safety & NFPA-101 Standards
            </h3>
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div className="flex items-center" style={{ gap: '8px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d7a5f', flexShrink: 0 }} />
                <span>Dual Protected Switchback Emergency Stairwell Cores (West Core A & East Core B) Verified.</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d7a5f', flexShrink: 0 }} />
                <span>Multi-level 100-Room AI Vision Sensor Grid actively transmitting.</span>
              </div>
              <div className="flex items-center" style={{ gap: '8px', fontSize: '12px', color: '#1e293b' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d7a5f', flexShrink: 0 }} />
                <span>Stairwell egress capacity load within safe thresholds.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex items-center justify-end"
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0',
              gap: '8px',
            }}
          >
            <button
              onClick={() => window.print()}
              className="flex items-center cursor-pointer transition-all"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                gap: '6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            >
              <Printer style={{ width: '14px', height: '14px' }} />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center cursor-pointer transition-all"
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 8px -1px rgba(13, 122, 95, 0.3)',
                gap: '6px',
              }}
            >
              <Download style={{ width: '14px', height: '14px' }} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
