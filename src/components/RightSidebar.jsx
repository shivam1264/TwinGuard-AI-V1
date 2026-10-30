import React from 'react';
import {
  Flame,
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen,
  ArrowUpRight,
  Building
} from 'lucide-react';

export const RightSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  stats = { total: 190, evacuated: 0, inTransit: 190, elapsedSeconds: 0 },
  exits = [],
  incidents = [],
  hasFire = false,
  onOpenAnalytics,
  onOpenIncidents
}) => {
  const total = stats.total || 190;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || Math.max(0, total - evacuated);
  const remaining = Math.max(0, total - evacuated);
  const evacProgress = total > 0 ? Math.min(100, Math.round((evacuated / total) * 100)) : 0;

  // Circular progress ring calculation (SVG donut chart)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (evacProgress / 100) * circumference;

  // Real or default stairwell core loads
  const stairwellsList = [
    {
      id: 'exit_west',
      name: 'Stairwell A (West Core)',
      iconBg: '#ebf5ff',
      iconColor: '#2563eb',
      load: exits[0]?.load || 0,
      capacity: exits[0]?.capacity || 60,
      status: exits[0]?.status || 'Operational',
      percent: Math.min(100, Math.round(((exits[0]?.load || 0) / (exits[0]?.capacity || 60)) * 100))
    },
    {
      id: 'exit_east',
      name: 'Stairwell B (East Core)',
      iconBg: '#f3e8ff',
      iconColor: '#8b5cf6',
      load: exits[1]?.load || 0,
      capacity: exits[1]?.capacity || 60,
      status: exits[1]?.status || 'Operational',
      percent: Math.min(100, Math.round(((exits[1]?.load || 0) / (exits[1]?.capacity || 60)) * 100))
    },
    {
      id: 'exit_south',
      name: 'Stairwell C (South Exit)',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      load: exits[2]?.load || 0,
      capacity: exits[2]?.capacity || 80,
      status: exits[2]?.status || 'Operational',
      percent: Math.min(100, Math.round(((exits[2]?.load || 0) / (exits[2]?.capacity || 80)) * 100))
    },
    {
      id: 'exit_elev',
      name: 'Stairwell D (Elevators)',
      iconBg: '#d1fae5',
      iconColor: '#059669',
      load: 38,
      capacity: 60,
      status: 'Operational',
      percent: 63
    }
  ];

  // ==========================================
  // 1. COLLAPSED RAIL VIEW
  // ==========================================
  if (isCollapsed) {
    return (
      <aside
        className="flex flex-col items-center shrink-0 select-none z-20"
        style={{
          width: '64px',
          background: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          padding: '16px 8px',
          gap: '10px',
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '11px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
          }}
          title="Expand Right Panel"
        >
          <PanelRightOpen style={{ width: '16px', height: '16px' }} />
        </button>

        <div style={{ width: '28px', height: '1px', background: '#e2e8f0' }} />

        {/* Emergency Flame Icon */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '11px',
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
          }}
          title="Emergency Status: FIRE HAZARD"
        >
          <Flame style={{ width: '16px', height: '16px', fill: '#dc2626' }} />
        </button>

        {/* Analytics shortcut */}
        <button
          onClick={onOpenAnalytics || onToggleCollapse}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '11px',
            background: '#ebf5ff',
            color: '#2563eb',
            border: 'none',
          }}
          title="Stairwell Cores Analytics"
        >
          <Activity style={{ width: '16px', height: '16px' }} />
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED VIEW — Exactly Matching Mockup Image
  // ==========================================
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-y-auto no-scrollbar z-20"
      style={{
        width: '340px',
        background: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        padding: '16px 14px',
        gap: '14px',
        fontFamily: "'Inter', system-ui, sans-serif",
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* ── CARD 1: COMMAND & TELEMETRY (2x2 Grid) ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
              Command & Telemetry
            </span>
            <div
              className="flex items-center"
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                }}
              />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a' }}>Live</span>
            </div>
          </div>

          {/* Close / Collapse Right Sidebar Button */}
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
            }}
            title="Collapse Right Sidebar"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            <PanelRightClose style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* 2x2 Metric Cards Grid */}
        <div className="grid grid-cols-2" style={{ gap: '8px' }}>
          {/* 1. Total Occupants */}
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#ebf5ff', color: '#2563eb' }}
              >
                <Users style={{ width: '13px', height: '13px' }} />
              </div>
              {/* Mini Sparklines */}
              <div className="flex items-end" style={{ gap: '2px', height: '16px' }}>
                {[8, 12, 16, 14, 20].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: `${h}px`, background: '#bfdbfe', borderRadius: '1px' }} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>Total Occupants</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{total}</div>
            </div>
          </div>

          {/* 2. Evacuated */}
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#dcfce7', color: '#16a34a' }}
              >
                <ShieldCheck style={{ width: '13px', height: '13px' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>
                {evacProgress}%
              </span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>Evacuated</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', lineHeight: 1.1 }}>{evacuated}</div>
            </div>
          </div>

          {/* 3. In Movement */}
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: '#fefce8',
              border: '1px solid #fef08a',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#fef3c7', color: '#d97706' }}
              >
                <Activity style={{ width: '13px', height: '13px' }} />
              </div>
              {/* Mini Amber Sparklines */}
              <div className="flex items-end" style={{ gap: '2px', height: '16px' }}>
                {[10, 14, 18, 16, 12].map((h, i) => (
                  <div key={i} style={{ width: '3px', height: `${h}px`, background: '#fde68a', borderRadius: '1px' }} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#b45309', fontWeight: 600 }}>In Movement</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>{inTransit}</div>
            </div>
          </div>

          {/* 4. Remaining */}
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'between',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#fee2e2', color: '#dc2626' }}
              >
                <AlertTriangle style={{ width: '13px', height: '13px' }} />
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#be123c', fontWeight: 600 }}>Remaining</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626', lineHeight: 1.1 }}>{remaining}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: EMERGENCY STATUS (Red Container) ── */}
      <div
        style={{
          background: '#fff5f5',
          borderRadius: '16px',
          border: '1px solid #fecdd3',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#ef4444',
                color: '#ffffff',
                boxShadow: '0 2px 6px -1px rgba(239, 68, 68, 0.4)',
              }}
            >
              <Flame style={{ width: '16px', height: '16px', fill: 'white' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              Emergency Status
            </span>
          </div>

          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
            }}
          >
            FIRE HAZARD
          </span>
        </div>

        {/* Subtitle Row: Total Occupants */}
        <div className="flex items-center justify-end" style={{ gap: '5px', fontSize: '10.5px', color: '#64748b' }}>
          <Users style={{ width: '12px', height: '12px', color: '#64748b' }} />
          <span>Total Occupants: <strong style={{ color: '#0f172a' }}>{total}</strong></span>
        </div>

        {/* Center: Donut SVG + Stacked Metrics */}
        <div className="flex items-center justify-between" style={{ gap: '12px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #fecdd3' }}>
          {/* Donut Gauge */}
          <div className="relative flex items-center justify-center shrink-0" style={{ width: '74px', height: '74px' }}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 74 74">
              <circle cx="37" cy="37" r={radius} stroke="#f1f5f9" strokeWidth="6" fill="none" />
              <circle
                cx="37" cy="37" r={radius}
                stroke="#16a34a"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {evacProgress}%
              </span>
              <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600, marginTop: '2px', lineHeight: 1 }}>
                Evacuation
              </span>
            </div>
          </div>

          {/* Stacked Metric Rows */}
          <div className="flex-1 flex flex-col" style={{ gap: '6px' }}>
            {/* Evacuated */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #16a34a' }} />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Evacuated</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>
                {evacuated}
              </span>
            </div>

            {/* In Movement */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #d97706' }} />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>In Movement</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#d97706', fontFamily: 'monospace' }}>
                {inTransit}
              </span>
            </div>

            {/* Remaining */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #dc2626' }} />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Remaining</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#dc2626', fontFamily: 'monospace' }}>
                {remaining}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 3: STAIRWELL STATUS ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#dcfce7', color: '#16a34a' }}
            >
              <ShieldCheck style={{ width: '15px', height: '15px' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              Stairwell Status
            </span>
          </div>

          <button
            onClick={onOpenAnalytics}
            className="flex items-center cursor-pointer transition-colors"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#2563eb',
              gap: '3px',
              border: 'none',
              background: 'transparent',
            }}
          >
            <span>View All</span>
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </button>
        </div>

        {/* 4 Stairwell Rows */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          {stairwellsList.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: '22px', height: '22px', borderRadius: '6px', background: item.iconBg, color: item.iconColor }}
                  >
                    <ArrowUpRight style={{ width: '12px', height: '12px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                      {item.name}
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      <Users style={{ width: '10px', height: '10px' }} />
                      <span>{item.load} / {item.capacity} max</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#16a34a' }}>{item.status}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', fontFamily: 'monospace' }}>
                    {item.percent}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '999px', marginTop: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: item.percent > 50 ? '#0d7a5f' : '#3b82f6',
                    borderRadius: '999px',
                    width: `${item.percent}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
