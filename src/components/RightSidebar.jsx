import React from 'react';
import {
  Flame,
  ShieldCheck,
  Users,
  CheckCircle2,
  Activity,
  AlertCircle,
  Milestone,
  Bell,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';

export const RightSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  stats = { total: 500, evacuated: 360, inTransit: 190, elapsedSeconds: 0 },
  exits = [],
  incidents = [],
  hasFire = false,
  onOpenAnalytics,
  onOpenIncidents
}) => {
  const total = stats.total || 1;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
  const remaining = Math.max(0, total - evacuated);
  const evacProgress = Math.min(100, Math.round((evacuated / total) * 100));

  // Circular progress ring calculation (SVG donut chart)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (evacProgress / 100) * circumference;

  // Default exit fallback data
  const defaultExits = [
    { id: 'exit_west', name: 'Stairwell A (West Core)', status: 'Operational', load: 120, capacity: 400, percent: 30 },
    { id: 'exit_east', name: 'Stairwell B (East Core)', status: 'Operational', load: 110, capacity: 400, percent: 28 },
    { id: 'exit_south', name: 'Stairwell C (South Exit)', status: inTransit > 100 ? 'Congested' : 'Operational', load: 180, capacity: 400, percent: 45 },
    { id: 'exit_elev', name: 'Stairwell D (Elevators)', status: 'Operational', load: 90, capacity: 400, percent: 22 }
  ];

  // Map real exits from simulation if available
  const displayExits = exits && exits.length >= 3 ? [
    {
      id: 'exit_west',
      name: 'Stairwell A (West Core)',
      status: exits[0].status === 'CRITICAL OVERLOAD' ? 'Congested' : 'Operational',
      load: exits[0].load || 0,
      capacity: exits[0].capacity || 60,
      percent: Math.min(100, Math.round(((exits[0].load || 0) / (exits[0].capacity || 60)) * 100))
    },
    {
      id: 'exit_east',
      name: 'Stairwell B (East Core)',
      status: exits[1].status === 'CRITICAL OVERLOAD' ? 'Congested' : 'Operational',
      load: exits[1].load || 0,
      capacity: exits[1].capacity || 60,
      percent: Math.min(100, Math.round(((exits[1].load || 0) / (exits[1].capacity || 60)) * 100))
    },
    {
      id: 'exit_south',
      name: 'Stairwell C (South Exit)',
      status: exits[2].status === 'CRITICAL OVERLOAD' ? 'Congested' : (exits[2].load > 40 ? 'Congested' : 'Operational'),
      load: exits[2].load || 0,
      capacity: exits[2].capacity || 80,
      percent: Math.min(100, Math.round(((exits[2].load || 0) / (exits[2].capacity || 80)) * 100))
    },
    {
      id: 'exit_elev',
      name: 'Stairwell D (Elevators)',
      status: 'Operational',
      load: Math.round(inTransit * 0.2),
      capacity: 60,
      percent: Math.min(100, Math.round((Math.round(inTransit * 0.2) / 60) * 100))
    }
  ] : defaultExits;

  // ==========================================
  // COLLAPSED RAIL VIEW
  // ==========================================
  if (isCollapsed) {
    return (
      <aside
        className="flex flex-col items-center shrink-0 select-none z-20"
        style={{
          width: '64px',
          background: 'linear-gradient(180deg, #f0fdf8 0%, #ffffff 100%)',
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
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            color: '#0d7a5f',
          }}
          title="Expand Right Panel"
        >
          <PanelRightOpen style={{ width: '16px', height: '16px' }} />
        </button>

        <div style={{ width: '28px', height: '1px', background: '#e2e8f0' }} />

        {/* Emergency Status */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center relative transition-all cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: hasFire ? '#ef4444' : '#f0fdf4',
            border: hasFire ? 'none' : '1px solid #d1fae5',
            color: hasFire ? '#ffffff' : '#0d7a5f',
            boxShadow: hasFire ? '0 4px 12px -2px rgba(239, 68, 68, 0.4)' : 'none',
          }}
          title={`Emergency: ${hasFire ? 'FIRE' : 'NORMAL'}`}
        >
          {hasFire ? <Flame style={{ width: '16px', height: '16px', fill: 'white' }} /> : <ShieldCheck style={{ width: '16px', height: '16px' }} />}
        </button>

        {/* Evac Progress */}
        <button
          onClick={onToggleCollapse}
          className="flex flex-col items-center justify-center transition-all cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
          }}
          title={`Evacuation: ${evacProgress}%`}
        >
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{evacProgress}%</span>
          <span style={{ fontSize: '7px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>EVAC</span>
        </button>

        {/* Stairwell */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center transition-all cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            color: '#0d7a5f',
          }}
          title="Stairwell Status"
        >
          <Milestone style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Incidents */}
        <button
          onClick={() => {
            if (onOpenIncidents) onOpenIncidents();
            else onToggleCollapse();
          }}
          className="flex items-center justify-center relative transition-all cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: '#fff5f5',
            border: '1px solid #fecaca',
            color: '#dc2626',
          }}
          title={`Incidents (${incidents.length})`}
        >
          <Bell style={{ width: '16px', height: '16px' }} />
          {incidents.length > 0 && (
            <span
              className="absolute flex items-center justify-center"
              style={{
                top: '-4px',
                right: '-4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
              }}
            >
              {incidents.length}
            </span>
          )}
        </button>
      </aside>
    );
  }

  // ==========================================
  // EXPANDED FULL VIEW — Clean Professional
  // ==========================================
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-y-auto no-scrollbar z-20"
      style={{
        width: '360px',
        background: 'linear-gradient(180deg, #f0fdf8 0%, #ffffff 50%, #ffffff 100%)',
        borderLeft: '1px solid #e2e8f0',
        padding: '16px',
        gap: '16px',
        fontFamily: "'Inter', system-ui, sans-serif",
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between" style={{ padding: '0 4px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          COMMAND & TELEMETRY
        </span>
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center cursor-pointer transition-all"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#94a3b8',
          }}
          title="Collapse Right Panel"
        >
          <PanelRightClose style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* CARD 1: Emergency Status + Progress */}
      <div
        style={{
          padding: '16px',
          borderRadius: '16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Status Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: hasFire ? '#ef4444' : '#0d7a5f',
                color: '#ffffff',
                boxShadow: hasFire ? '0 4px 12px -2px rgba(239, 68, 68, 0.3)' : '0 4px 12px -2px rgba(13, 122, 95, 0.25)',
              }}
            >
              {hasFire ? <Flame style={{ width: '16px', height: '16px', fill: 'white' }} /> : <ShieldCheck style={{ width: '16px', height: '16px' }} />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              Emergency Status
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '4px 10px',
              borderRadius: '20px',
              background: hasFire ? '#fef2f2' : '#f0fdf4',
              color: hasFire ? '#dc2626' : '#0d7a5f',
              border: hasFire ? '1px solid #fecaca' : '1px solid #d1fae5',
            }}
          >
            {hasFire ? 'FIRE HAZARD' : 'NORMAL'}
          </span>
        </div>

        {/* Donut + KPIs */}
        <div className="flex items-center justify-between" style={{ gap: '16px' }}>
          {/* Donut Chart */}
          <div className="relative flex items-center justify-center shrink-0" style={{ width: '96px', height: '96px' }}>
            <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
              <circle
                cx="50" cy="50" r={radius}
                stroke="#0d7a5f"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all"
                style={{ transitionDuration: '500ms' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                {evacProgress}%
              </span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', marginTop: '4px', lineHeight: 1.1, maxWidth: '65px' }}>
                Evacuation Progress
              </span>
            </div>
          </div>

          {/* KPI Rows */}
          <div className="flex-1 flex flex-col" style={{ gap: '8px' }}>
            {[
              { icon: Users, label: 'Total Occupants', value: total, color: '#64748b', valueColor: '#1e293b', iconColor: '#94a3b8' },
              { icon: CheckCircle2, label: 'Evacuated', value: evacuated, color: '#64748b', valueColor: '#0d7a5f', iconColor: '#0d7a5f' },
              { icon: Activity, label: 'In Movement', value: inTransit, color: '#64748b', valueColor: '#d97706', iconColor: '#f59e0b' },
              { icon: AlertCircle, label: 'Remaining', value: remaining, color: '#64748b', valueColor: '#dc2626', iconColor: '#f43f5e' },
            ].map((kpi) => {
              const KpiIcon = kpi.icon;
              return (
                <div key={kpi.label} className="flex items-center justify-between" style={{ padding: '2px 0' }}>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    <KpiIcon style={{ width: '14px', height: '14px', color: kpi.iconColor }} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: kpi.color }}>{kpi.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: kpi.valueColor }}>{kpi.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARD 2: Stairwell Status */}
      <div
        style={{
          padding: '16px',
          borderRadius: '16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                color: '#0d7a5f',
              }}
            >
              <Milestone style={{ width: '14px', height: '14px' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              Stairwell Status
            </span>
          </div>
          <button
            onClick={onOpenAnalytics}
            className="flex items-center cursor-pointer transition-all"
            style={{ gap: '4px', fontSize: '11px', fontWeight: 600, color: '#0d7a5f', background: 'none', border: 'none' }}
          >
            <span>View All</span>
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </button>
        </div>

        {/* Stairwell Items */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          {displayExits.map((stair) => {
            const isCongested = stair.status === 'Congested';
            return (
              <div
                key={stair.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                }}
              >
                {/* Title & Status */}
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{stair.name}</span>
                  <div className="flex items-center" style={{ gap: '5px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isCongested ? '#f59e0b' : '#10b981',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: isCongested ? '#d97706' : '#0d7a5f' }}>
                      {stair.status}
                    </span>
                  </div>
                </div>

                {/* Occupant count */}
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  <div className="flex items-center" style={{ gap: '4px' }}>
                    <Users style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{stair.load}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>/ {stair.capacity} max</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{stair.percent}%</span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    className="transition-all"
                    style={{
                      height: '100%',
                      borderRadius: '999px',
                      width: `${Math.min(100, stair.percent)}%`,
                      background: isCongested ? '#f59e0b' : '#0d7a5f',
                      transitionDuration: '300ms',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARD 3: Live Incidents */}
      <div
        className="flex-1"
        style={{
          padding: '16px',
          borderRadius: '16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          minHeight: '200px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              <Bell style={{ width: '14px', height: '14px' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              Live Incidents
            </span>
            <span
              className="flex items-center justify-center"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {incidents.length}
            </span>
          </div>
          <button
            onClick={onOpenIncidents}
            className="flex items-center cursor-pointer transition-all"
            style={{ gap: '4px', fontSize: '11px', fontWeight: 600, color: '#0d7a5f', background: 'none', border: 'none' }}
          >
            <span>View All</span>
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </button>
        </div>

        {/* Incidents Timeline */}
        <div className="flex flex-col relative" style={{ gap: '12px' }}>
          {/* Timeline line */}
          <div
            className="absolute"
            style={{
              left: '47px',
              top: '8px',
              bottom: '8px',
              width: '1.5px',
              background: '#e2e8f0',
            }}
          />

          {incidents.slice(0, 3).map((item, index) => {
            const severityStyles = {
              High: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444' },
              Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#f59e0b' },
              Low: { bg: '#f0fdf4', color: '#0d7a5f', border: '#d1fae5', dot: '#0d7a5f' },
            };
            const sv = severityStyles[item.severity] || severityStyles.Low;

            return (
              <div key={item.id || index} className="flex items-start relative" style={{ gap: '12px', zIndex: 10 }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#94a3b8',
                    width: '36px',
                    flexShrink: 0,
                    paddingTop: '2px',
                  }}
                >
                  {item.time}
                </span>

                <span
                  className="shrink-0"
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: sv.dot,
                    marginTop: '4px',
                    boxShadow: `0 0 0 4px ${sv.bg}`,
                  }}
                />

                <div className="flex-1 flex items-start justify-between min-w-0" style={{ gap: '6px' }}>
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                      {item.title}
                    </div>
                    <div className="truncate" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: sv.bg,
                      color: sv.color,
                      border: `1px solid ${sv.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
