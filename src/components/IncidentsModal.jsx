import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight
} from 'lucide-react';

export const IncidentsModal = ({ incidents = [], onClose, onFocusRoom }) => {
  const [filter, setFilter] = useState('ALL');

  const filteredIncidents = filter === 'ALL'
    ? incidents
    : incidents.filter(i => i.severity.toLowerCase() === filter.toLowerCase());

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
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              <AlertTriangle style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                Facility Incident Command Log
              </h2>
              <p style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                Live chronological safety & hazard dispatch events
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#94a3b8',
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Filter Bar */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            <Filter style={{ width: '13px', height: '13px' }} />
            <span>Filter Severity:</span>
          </div>

          <div className="flex items-center" style={{ gap: '4px' }}>
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
                    background: isActive ? '#0d7a5f' : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    border: 'none',
                    boxShadow: isActive ? '0 2px 6px -1px rgba(13, 122, 95, 0.3)' : 'none',
                  }}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        {/* Incidents List */}
        <div className="flex flex-col overflow-y-auto" style={{ padding: '16px 20px', gap: '10px' }}>
          {filteredIncidents.length === 0 ? (
            <div className="text-center" style={{ padding: '40px 0', color: '#94a3b8' }}>
              <CheckCircle2 style={{ width: '36px', height: '36px', color: '#10b981', margin: '0 auto 8px auto' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>No incidents matching selected filter</span>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isHigh = inc.severity === 'High';
              const isMed = inc.severity === 'Medium';

              const cardBg = isHigh ? '#fffbfb' : isMed ? '#fffdf7' : '#f8fafc';
              const cardBorder = isHigh ? '#fecaca' : isMed ? '#fde68a' : '#e2e8f0';
              const badgeBg = isHigh ? '#fef2f2' : isMed ? '#fffbeb' : '#f0fdf4';
              const badgeColor = isHigh ? '#dc2626' : isMed ? '#d97706' : '#0d7a5f';
              const badgeBorder = isHigh ? '#fecaca' : isMed ? '#fde68a' : '#d1fae5';

              return (
                <div
                  key={inc.id}
                  className="flex items-start justify-between"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    gap: '12px',
                  }}
                >
                  <div className="flex items-start" style={{ gap: '10px' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '9px',
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        marginTop: '2px',
                      }}
                    >
                      {isHigh ? <Flame style={{ width: '15px', height: '15px', fill: 'currentColor' }} /> : <Clock style={{ width: '15px', height: '15px' }} />}
                    </div>

                    <div>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>
                          {inc.time}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {inc.severity}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                        {inc.title}
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
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
                      className="flex items-center cursor-pointer transition-all shrink-0"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0d7a5f',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
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
