import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  Video,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  Home
} from 'lucide-react';

export const TopHeader = ({
  activeTab,
  onSelectTab,
  incidentCount = 3,
  onOpenCctv,
  onOpenAnalytics,
  onOpenIncidents,
  onOpenReports,
  onOpenSettings,
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
      day: 'numeric',
      month: 'short',
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
    { id: 'LIVE_VIEW', label: 'Live View', icon: Home, onClick: () => onSelectTab('LIVE_VIEW') },
    {
      id: 'ANALYTICS',
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => {
        onSelectTab('ANALYTICS');
        if (onOpenAnalytics) onOpenAnalytics();
      }
    },
    {
      id: 'CCTV',
      label: 'CCTV',
      icon: Video,
      onClick: () => {
        onSelectTab('CCTV');
        if (onOpenCctv) onOpenCctv();
      }
    },
    {
      id: 'INCIDENTS',
      label: 'Incidents',
      icon: AlertTriangle,
      badge: incidentCount,
      onClick: () => {
        onSelectTab('INCIDENTS');
        if (onOpenIncidents) onOpenIncidents();
      }
    },
    {
      id: 'REPORTS',
      label: 'Reports',
      icon: FileText,
      onClick: () => {
        onSelectTab('REPORTS');
        if (onOpenReports) onOpenReports();
      }
    },
    {
      id: 'SETTINGS',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        onSelectTab('SETTINGS');
        if (onOpenSettings) onOpenSettings();
      }
    }
  ];

  return (
    <header
      className="h-16 px-5 flex items-center justify-between shrink-0 z-30 select-none"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Left: Brand Identity */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)',
            boxShadow: '0 4px 12px -2px rgba(13, 122, 95, 0.35)',
            color: '#ffffff',
          }}
        >
          <Building2 style={{ width: '20px', height: '20px' }} />
        </div>
        <div>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1 }}>
              TWINGUARD AI
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: serverConnected ? '#10b981' : '#f59e0b',
                display: 'inline-block',
              }}
              title={serverConnected ? 'Connected' : 'Reconnecting'}
            />
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px', lineHeight: 1 }}>
            DIGITAL TWIN COMMAND PLATFORM
          </div>
        </div>
      </div>

      {/* Center: Main Navigation Tabs */}
      <nav
        className="hidden md:flex items-center"
        style={{
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          gap: '2px',
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
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)',
                  boxShadow: '0 2px 8px -1px rgba(13, 122, 95, 0.3)',
                  color: '#ffffff',
                  gap: '7px',
                }}
              >
                <Icon style={{ width: '15px', height: '15px' }} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: '9px',
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
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex items-center cursor-pointer transition-all focus:outline-none"
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '9px',
                background: 'transparent',
                color: '#475569',
                gap: '7px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#0d7a5f';
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
                    fontSize: '9px',
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

      {/* Right: Building Selector, Live Date/Time, User Avatar */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        {/* Building Selector Dropdown */}
        <div
          className="hidden lg:flex items-center cursor-pointer transition-all"
          style={{
            padding: '6px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '11px',
            gap: '8px',
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              color: '#0d7a5f',
            }}
          >
            <Building2 style={{ width: '13px', height: '13px' }} />
          </div>
          <div className="text-left">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>10-Storey Tower</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, lineHeight: 1 }}>Office Facility</div>
          </div>
          <ChevronDown style={{ width: '13px', height: '13px', color: '#94a3b8', marginLeft: '2px' }} />
        </div>

        {/* Live Date & Time */}
        <div
          className="flex items-center"
          style={{
            padding: '6px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '11px',
            gap: '8px',
          }}
        >
          <Calendar style={{ width: '14px', height: '14px', color: '#0d7a5f' }} />
          <div className="text-right">
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, lineHeight: 1 }}>
              {formatDate(currentTime)}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', lineHeight: 1.2, marginTop: '2px' }}>
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* User Avatar Badge */}
        <div
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#f0fdf4',
            border: '2px solid #a7f3d0',
            color: '#0d7a5f',
            fontSize: '12px',
            fontWeight: 800,
          }}
          title="Security Commander SK"
        >
          SK
        </div>
      </div>
    </header>
  );
};
