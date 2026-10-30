import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Info
} from 'lucide-react';

export const IncidentsModal = ({ incidents = [], onClose, onFocusRoom }) => {
  const [filter, setFilter] = useState('ALL');

  const filteredIncidents = filter === 'ALL'
    ? incidents
    : incidents.filter(i => i.severity.toLowerCase() === filter.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
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
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              <AlertTriangle style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Facility Incident Command Log
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
                Live chronological safety & hazard dispatch events
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

        {/* Filter Bar */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '10px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div className="flex items-center" style={{ gap: '6px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
            <Filter style={{ width: '13px', height: '13px' }} />
            <span>Filter Severity:</span>
          </div>

          <div className="flex items-center" style={{ gap: '6px' }}>
            {['ALL', 'HIGH', 'MEDIUM', 'INFO'].map((sev) => {
              const isActive = filter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  className="cursor-pointer transition-all"
                  style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: isActive ? '#2563eb' : '#ffffff',
                    color: isActive ? '#ffffff' : '#64748b',
                    border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    boxShadow: isActive ? '0 2px 6px -1px rgba(37, 99, 235, 0.3)' : 'none',
                  }}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Incidents List */}
        <div className="flex flex-col overflow-y-auto" style={{ padding: '16px 24px', gap: '10px' }}>
          {filteredIncidents.length === 0 ? (
            <div className="text-center" style={{ padding: '40px 0', color: '#94a3b8' }}>
              <CheckCircle2 style={{ width: '36px', height: '36px', color: '#10b981', margin: '0 auto 8px auto' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>No incidents matching selected filter</span>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isHigh = inc.severity.toLowerCase() === 'high';
              const isMed = inc.severity.toLowerCase() === 'medium';

              const cardBg = isHigh ? '#fef2f2' : isMed ? '#fffbeb' : '#f8fafc';
              const cardBorder = isHigh ? '#fecaca' : isMed ? '#fde68a' : '#e2e8f0';
              const badgeBg = isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#e0f2fe';
              const badgeColor = isHigh ? '#dc2626' : isMed ? '#d97706' : '#0284c7';
              const badgeBorder = isHigh ? '#fca5a5' : isMed ? '#fcd34d' : '#bae6fd';

              return (
                <div
                  key={inc.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    gap: '12px',
                  }}
                >
                  <div className="flex items-start" style={{ gap: '12px', minWidth: 0 }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        marginTop: '2px',
                      }}
                    >
                      {isHigh ? (
                        <Flame style={{ width: '17px', height: '17px', fill: 'currentColor' }} />
                      ) : isMed ? (
                        <Clock style={{ width: '17px', height: '17px' }} />
                      ) : (
                        <Info style={{ width: '17px', height: '17px' }} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>
                          {inc.time}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {inc.severity}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        {inc.title}
                      </h3>
                      <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                        {inc.subtitle}
                      </p>
                    </div>
                  </div>

                  {inc.roomId && onFocusRoom && (
                    <button
                      onClick={() => {
                        onFocusRoom(inc.roomId);
                        onClose();
                      }}
                      className="flex items-center cursor-pointer transition-all shrink-0 hover:bg-blue-50"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #bfdbfe',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#2563eb',
                        gap: '4px',
                      }}
                    >
                      <span>Locate</span>
                      <ArrowRight style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default IncidentsModal;
