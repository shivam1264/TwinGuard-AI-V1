import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Compass,
  ChevronDown,
  Video,
  AlertTriangle,
  FileText,
  Settings,
  Home,
  Sparkles,
  Trophy,
  Smartphone,
  QrCode
} from 'lucide-react';

export const TopHeader = ({
  activeTab = 'LIVE_VIEW',
  onSelectTab,
  incidentCount = 3,
  onOpenCctv,
  onOpenAnalytics,
  onOpenIncidents,
  onOpenReports,
  onOpenScenarioStudio,
  onOpenStrategyRanker,
  onOpenSettings,
  onOpenBuildingInfo,
  onOpenEvacueeQr,
  onOpenGis,
  isGisOpen = false,
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
      month: 'short',
      day: 'numeric',
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

  const navItems = [
    { id: 'SCENARIOS', label: 'AI Scenarios', icon: Sparkles, onClick: () => { onSelectTab('SCENARIOS'); if (onOpenScenarioStudio) onOpenScenarioStudio(); } },
    { id: 'STRATEGY_RANKER', label: 'Strategy Ranker', icon: Trophy, onClick: () => { onSelectTab('STRATEGY_RANKER'); if (onOpenStrategyRanker) onOpenStrategyRanker(); } },
    { id: 'INCIDENTS', label: 'Incidents', icon: AlertTriangle, badge: incidentCount > 0 ? incidentCount : null, onClick: () => { onSelectTab('INCIDENTS'); if (onOpenIncidents) onOpenIncidents(); } },
    { id: 'REPORTS', label: 'Reports', icon: FileText, onClick: () => { onSelectTab('REPORTS'); if (onOpenReports) onOpenReports(); } },
    { id: 'SETTINGS', label: 'Settings', icon: Settings, onClick: () => { onSelectTab('SETTINGS'); if (onOpenSettings) onOpenSettings(); } },
  ];

  return (
    <header
      className="h-16 px-6 flex items-center justify-between shrink-0 z-30 select-none"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Left: Brand Identity (TWINGUARD AI) ── */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            boxShadow: '0 2px 6px -1px rgba(37, 99, 235, 0.15)',
          }}
        >
          <Building2 style={{ width: '22px', height: '22px' }} />
        </div>
        <div>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              TWINGUARD <span style={{ color: '#2563eb' }}>AI</span>
            </span>
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', marginTop: '3px', lineHeight: 1 }}>
            Digital Twin Command Platform
          </div>
        </div>
      </div>

      {/* ── Center: Main Navigation Tabs (Matching Image) ── */}
      <nav
        className="hidden md:flex items-center"
        style={{
          background: '#f8fafc',
          padding: '4px',
          borderRadius: '14px',
          gap: '3px',
          border: '1px solid #e2e8f0',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex items-center cursor-pointer transition-all focus:outline-none"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '11px',
                  background: '#2563eb',
                  boxShadow: '0 2px 8px -1px rgba(37, 99, 235, 0.4)',
                  color: '#ffffff',
                  gap: '8px',
                  border: 'none',
                }}
              >
                <Icon style={{ width: '15px', height: '15px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex items-center cursor-pointer transition-all focus:outline-none relative"
              style={{
                height: '36px',
                padding: '0 14px',
                borderRadius: '11px',
                background: 'transparent',
                color: '#475569',
                gap: '7px',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <Icon style={{ width: '15px', height: '15px' }} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 900,
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '2px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Right: Evacuee Mobile View, Facility Selector, Clock, & Avatar ── */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        {/* Evacuee Mobile View Action Button */}
        <button
          onClick={onOpenEvacueeQr}
          className="hidden sm:flex items-center cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
          style={{
            height: '36px',
            padding: '0 14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#ffffff',
            gap: '8px',
            border: 'none',
            boxShadow: '0 2px 8px -1px rgba(79, 70, 229, 0.4)',
            fontWeight: 700,
            fontSize: '12px'
          }}
          title="Open Scannable QR Code for Live Mobile Evacuee Companion Demo"
        >
          <Smartphone style={{ width: '15px', height: '15px' }} />
          <span>📱 Evacuee Mobile View</span>
        </button>

        {/* Facility Selector Pill */}
        <div
          onClick={onOpenBuildingInfo}
          className="flex items-center cursor-pointer transition-colors hover:bg-slate-50"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '6px 12px',
            gap: '10px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          }}
          title="Facility Location & Building Information"
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              color: '#16a34a',
            }}
          >
            <Building2 style={{ width: '15px', height: '15px' }} />
          </div>
          <div className="text-left">
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              10-Storey Tower
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 500 }}>
              Office Facility
            </div>
          </div>
          <ChevronDown style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
        </div>

        {/* Date & Time Pill */}
        <div
          className="flex items-center"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '6px 12px',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          }}
        >
          <Calendar style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <div className="text-left">
            <div style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', lineHeight: 1 }}>
              {formatDate(currentTime)}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px', lineHeight: 1 }}>
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Live Satellite GIS Mini-Map Tactical Toggle Button */}
        {onOpenGis && (
          <button
            onClick={onOpenGis}
            className="flex items-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{
              background: isGisOpen
                ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                : '#ffffff',
              border: isGisOpen ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '6px 12px',
              gap: '7px',
              color: isGisOpen ? '#ffffff' : '#0f172a',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
            title={isGisOpen ? 'Close GIS Tactical Mini-Map' : 'Open GIS Tactical Mini-Map'}
          >
            <Compass
              style={{
                width: '14px',
                height: '14px',
                color: isGisOpen ? '#60a5fa' : '#2563eb'
              }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.02em' }}>
              GIS
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isGisOpen ? '#10b981' : '#94a3b8',
                boxShadow: isGisOpen ? '0 0 6px #10b981' : 'none',
                display: 'inline-block',
                transition: 'all 0.2s ease',
              }}
            />
          </button>
        )}

        {/* User Avatar Badge */}
        <div
          className="flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
          title="Security Officer: S. Kumar"
        >
          SK
        </div>
      </div>
    </header>
  );
};
