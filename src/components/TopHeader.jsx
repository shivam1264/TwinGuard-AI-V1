import React, { useState, useEffect } from 'react';
import {
  Box,
  Building2,
  Calendar,
  Compass,
  AlertTriangle,
  FileText,
  Settings,
  Sparkles,
  Trophy,
  Smartphone,
  LayoutDashboard,
  Bell,
  LineChart,
  Sun,
  Moon
} from 'lucide-react';

export const TopHeader = ({
  activeTab = 'LIVE_VIEW',
  onSelectTab,
  incidentCount = 3,
  theme = 'dark',
  onToggleTheme,
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
  onOpenLogin,
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
    {
      id: 'LIVE_VIEW',
      label: '3D Digital Twin',
      icon: Box,
      onClick: () => onSelectTab('LIVE_VIEW')
    },
    {
      id: 'COMMAND_CENTER',
      label: 'Command Center',
      icon: LayoutDashboard,
      onClick: () => onSelectTab('COMMAND_CENTER')
    },
    {
      id: 'BUILDING_INFO',
      label: 'Building Info',
      icon: Building2,
      onClick: () => onSelectTab('BUILDING_INFO')
    },
    {
      id: 'SCENARIOS',
      label: 'AI Scenarios',
      icon: Sparkles,
      onClick: () => onSelectTab('SCENARIOS')
    },
    {
      id: 'STRATEGY_RANKER',
      label: 'Strategy Ranker',
      icon: Trophy,
      onClick: () => onSelectTab('STRATEGY_RANKER')
    },
    {
      id: 'INCIDENTS',
      label: 'Incidents',
      icon: AlertTriangle,
      badge: incidentCount > 0 ? incidentCount : null,
      onClick: () => onSelectTab('INCIDENTS')
    },
    {
      id: 'ANALYTICS',
      label: 'Analytics',
      icon: LineChart,
      onClick: () => onSelectTab('ANALYTICS')
    },
    {
      id: 'REPORTS',
      label: 'Reports',
      icon: FileText,
      onClick: () => onSelectTab('REPORTS')
    }
  ];

  return (
    <header
      className="h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none backdrop-blur-md transition-colors duration-300"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(180deg, rgba(8, 16, 32, 0.95) 0%, rgba(6, 12, 24, 0.9) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
        borderBottom: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.16)' : '1px solid #e2e8f0',
        boxShadow: theme === 'dark' ? '0 4px 24px rgba(0, 0, 0, 0.45)' : '0 2px 12px rgba(0, 0, 0, 0.05)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Left: Brand Identity (TWINGUARD AI) ── */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectTab('LIVE_VIEW')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)'
          }}
        >
          {/* Cyan Glowing 3-Bar Tower Icon */}
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path
              d="M3 20V12L8 8V20M8 20V4L16 4V20M16 20V9L21 13V20"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}
            >
              TWINGUARD <span style={{ color: '#0284c7', textShadow: theme === 'dark' ? '0 0 12px rgba(56, 189, 248, 0.6)' : 'none' }}>AI</span>
            </span>
          </div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#94a3b8',
              marginTop: '3px',
              lineHeight: 1,
              letterSpacing: '0.02em'
            }}
          >
            Digital Twin Command Platform
          </div>
        </div>
      </div>

      {/* ── Center: Main Navigation Tabs ── */}
      <nav
        className="hidden xl:flex items-center"
        style={{
          background: 'rgba(11, 22, 44, 0.75)',
          padding: '4px',
          borderRadius: '14px',
          gap: '3px',
          border: '1px solid rgba(56, 189, 248, 0.18)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)'
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
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  boxShadow: '0 2px 10px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  gap: '8px',
                  border: '1px solid rgba(96, 165, 250, 0.4)'
                }}
              >
                <Icon style={{ width: '15px', height: '15px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 900,
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '17px',
                      height: '17px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '2px',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
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
                padding: '0 13px',
                borderRadius: '11px',
                background: 'transparent',
                color: theme === 'dark' ? '#94a3b8' : '#475569',
                gap: '7px',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.08)';
                e.currentTarget.style.color = theme === 'dark' ? '#f8fafc' : '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme === 'dark' ? '#94a3b8' : '#475569';
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
                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Right: Theme Toggle, Mobile Evacuee, Clock, & Profile/Settings ── */}
      <div className="flex items-center gap-2.5">
        {/* Dark / Light Mode Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 w-9 h-9 rounded-xl"
            style={{
              background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
              border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #cbd5e1',
              color: theme === 'dark' ? '#f59e0b' : '#2563eb',
              boxShadow: theme === 'dark' ? '0 0 10px rgba(245, 158, 11, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.08)'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600" />
            )}
          </button>
        )}

        {/* Mobile Evacuee Companion Button */}
        <button
          onClick={onOpenEvacueeQr}
          className="hidden md:flex items-center cursor-pointer transition-all hover:scale-105 active:scale-95"
          style={{
            height: '36px',
            padding: '0 12px',
            borderRadius: '11px',
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
            border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #cbd5e1',
            color: theme === 'dark' ? '#38bdf8' : '#0284c7',
            gap: '7px',
            fontWeight: 700,
            fontSize: '11.5px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
          title="Open Scannable QR Code for Live Mobile Evacuee Companion"
        >
          <Smartphone style={{ width: '14px', height: '14px' }} />
          <span>Mobile Evacuee</span>
        </button>

        {/* Combined Profile & Settings Controller Pill */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 border"
            style={{
              background: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
              borderColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.25)' : '#cbd5e1',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)'
            }}
            title="Profile & System Settings"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
              SM
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold leading-tight" style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
                Shivansh
              </span>
              <span className="text-[9px] font-medium leading-tight text-sky-500">Settings</span>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        )}
      </div>
    </header>
  );
};
