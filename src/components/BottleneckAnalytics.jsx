import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Activity, Clock, CheckCircle2, Users, Layers, ArrowUpRight, Flame } from 'lucide-react';

export const BottleneckAnalytics = React.memo(({ stats, exits = [], rooms = [], bottlenecks = [] }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const remaining = Math.max(0, total - evacuated);
  const evacProgress = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  // Calculate occupants per floor across all 10 floors with memoization
  const floorData = useMemo(() => {
    const data = {};
    for (let f = 1; f <= 10; f++) {
      data[f] = { occupants: 0, hasFire: false };
    }
    if (rooms) {
      rooms.forEach(r => {
        const fl = r.floor || 1;
        if (data[fl]) {
          data[fl].occupants += (r.peopleCount || 0);
          if (r.hasFire) data[fl].hasFire = true;
        }
      });
    }
    return data;
  }, [rooms]);

  return (
    <div
      className="flex flex-col select-none"
      style={{
        gap: '20px',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#1e293b',
      }}
    >
      {/* 1. TOP METRICS ROW (Clean SaaS Cards) */}
      <div className="grid grid-cols-4" style={{ gap: '12px' }}>
        {/* Total Tower Occupants */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tower Total
            </span>
            <div
              className="flex items-center justify-center"
              style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
            >
              <Users style={{ width: '14px', height: '14px' }} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '6px' }}>
            10 Floors • 100 Rooms
          </div>
        </div>

        {/* Safely Evacuated */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0d7a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Safely Exited
            </span>
            <div
              className="flex items-center justify-center"
              style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #d1fae5', color: '#0d7a5f' }}
            >
              <CheckCircle2 style={{ width: '14px', height: '14px' }} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0d7a5f', marginTop: '6px', lineHeight: 1 }}>
            {evacuated}
          </div>
          <div className="flex items-center" style={{ gap: '4px', fontSize: '11px', color: '#0d7a5f', fontWeight: 700, marginTop: '6px' }}>
            <span>{evacProgress}% complete</span>
          </div>
        </div>

        {/* In Stairwells */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Stairwells
            </span>
            <div
              className="flex items-center justify-center"
              style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' }}
            >
              <Activity style={{ width: '14px', height: '14px' }} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '6px', lineHeight: 1 }}>
            {inTransit}
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 500, marginTop: '6px' }}>
            Active movement
          </div>
        </div>

        {/* Remaining in Tower */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '11px', fontWeight: 600, color: remaining > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Remaining
            </span>
            <div
              className="flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: remaining > 0 ? '#fef2f2' : '#f8fafc',
                border: remaining > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
                color: remaining > 0 ? '#dc2626' : '#64748b'
              }}
            >
              <AlertTriangle style={{ width: '14px', height: '14px' }} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: remaining > 0 ? '#dc2626' : '#64748b', marginTop: '6px', lineHeight: 1 }}>
            {remaining}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '6px' }}>
            Awaiting clearance
          </div>
        </div>
      </div>

      {/* 2. OVERALL EVACUATION PROGRESS BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '14px 18px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
              Total Evacuation Progress
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
              Real-time egress tracking across all designated muster zones
            </div>
          </div>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: '#0d7a5f' }}>
              {evacProgress}%
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              ({evacuated}/{total})
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            className="transition-all"
            style={{
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #0d7a5f 0%, #10b981 100%)',
              width: `${evacProgress}%`,
              transitionDuration: '400ms',
            }}
          />
        </div>
      </div>

      {/* 3. POPULATION MATRIX (LEVELS 1 - 10) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px 18px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f0fdf4', color: '#0d7a5f' }}
            >
              <Layers style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
              10-Floor Population Distribution
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#0d7a5f',
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            Live Sensor Scan
          </span>
        </div>

        {/* 10 Floor Grid Cards */}
        <div className="grid grid-cols-5" style={{ gap: '8px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fl => {
            const data = floorData[fl] || { occupants: 0, hasFire: false };
            const isHazard = data.hasFire;

            return (
              <div
                key={fl}
                className="flex items-center justify-between transition-all"
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isHazard ? '#fffbfb' : '#f8fafc',
                  border: isHazard ? '1px solid #fecaca' : '1px solid #e2e8f0',
                }}
              >
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <div
                    className="flex items-center justify-center font-mono"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isHazard ? '#fef2f2' : '#ffffff',
                      border: isHazard ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: isHazard ? '#dc2626' : '#64748b',
                    }}
                  >
                    L{fl}
                  </div>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                      {data.occupants}p
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500 }}>
                      Level {fl}
                    </span>
                  </div>
                </div>

                {isHazard && (
                  <Flame style={{ width: '14px', height: '14px', color: '#ef4444', fill: '#ef4444' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. STAIRWELL CORES & EXIT THROUGHPUT */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px 18px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
              Stairwell Core & Egress Exit Throughput
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
              Dynamic load-balancing across emergency egress routes
            </div>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#f0fdf4',
              color: '#0d7a5f',
              border: '1px solid #d1fae5',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            LOAD BALANCED
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: '10px' }}>
          {exits.map((exit) => {
            const load = exit.load || 0;
            const capacity = exit.capacity || 60;
            const loadPct = exit.loadPercentage || Math.min(100, Math.round((load / capacity) * 100)) || 0;
            const isOverloaded = loadPct > 100;
            const isHeavy = loadPct > 80;

            const badgeBg = isOverloaded ? '#fef2f2' : isHeavy ? '#fffbeb' : '#f0fdf4';
            const badgeColor = isOverloaded ? '#dc2626' : isHeavy ? '#d97706' : '#0d7a5f';
            const badgeBorder = isOverloaded ? '#fecaca' : isHeavy ? '#fde68a' : '#d1fae5';
            const barGradient = isOverloaded
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : isHeavy
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #0d7a5f, #10b981)';

            return (
              <div
                key={exit.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '11px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isOverloaded ? '#ef4444' : isHeavy ? '#f59e0b' : '#10b981',
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                      {exit.name}
                    </span>
                  </div>

                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                      {load} / {capacity}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        fontFamily: 'monospace',
                      }}
                    >
                      {loadPct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    className="transition-all"
                    style={{
                      height: '100%',
                      borderRadius: '999px',
                      background: barGradient,
                      width: `${Math.min(100, loadPct)}%`,
                      transitionDuration: '300ms',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. BOTTLENECK & SYSTEM STATUS NOTICES */}
      {bottlenecks.length > 0 ? (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#fffbfb',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div className="flex flex-col" style={{ gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
              Crowd Density Warnings Detected
            </span>
            {bottlenecks.map((msg, i) => (
              <span key={i} style={{ fontSize: '11px', color: '#b91c1c' }}>
                • {msg}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <ShieldCheck style={{ width: '16px', height: '16px', color: '#0d7a5f', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0d7a5f' }}>
            Stairwell cores and ground assembly exits are dynamically balanced. Zero congestion detected.
          </span>
        </div>
      )}
    </div>
  );
});
