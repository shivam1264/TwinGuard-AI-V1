import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Activity, CheckCircle2, Users, Layers, Flame } from 'lucide-react';

export const BottleneckAnalytics = React.memo(({ stats = {}, exits = [], rooms = [], bottlenecks = [] }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
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
      className="flex flex-col select-none no-scrollbar"
      style={{
        gap: '14px',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#1e293b',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* 1. TOP 4 METRICS ROW (Compact SaaS Cards) */}
      <div className="grid grid-cols-4" style={{ gap: '10px' }}>
        {/* Tower Total */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tower Total
            </span>
            <Users style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px', lineHeight: 1.1 }}>
            {total}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' }}>
            10 Floors • 100 Rooms
          </div>
        </div>

        {/* Safely Exited */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#0d7a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Safely Exited
            </span>
            <CheckCircle2 style={{ width: '13px', height: '13px', color: '#0d7a5f' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d7a5f', marginTop: '4px', lineHeight: 1.1 }}>
            {evacuated}
          </div>
          <div style={{ fontSize: '10px', color: '#0d7a5f', fontWeight: 600, marginTop: '3px' }}>
            {evacProgress}% evacuated
          </div>
        </div>

        {/* In Stairwells */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Stairwells
            </span>
            <Activity style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706', marginTop: '4px', lineHeight: 1.1 }}>
            {inTransit}
          </div>
          <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 500, marginTop: '3px' }}>
            Active movement
          </div>
        </div>

        {/* Remaining in Tower */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '10px', fontWeight: 600, color: remaining > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Remaining
            </span>
            <AlertTriangle style={{ width: '13px', height: '13px', color: remaining > 0 ? '#dc2626' : '#94a3b8' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: remaining > 0 ? '#dc2626' : '#64748b', marginTop: '4px', lineHeight: 1.1 }}>
            {remaining}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' }}>
            Awaiting egress
          </div>
        </div>
      </div>

      {/* 2. OVERALL EVACUATION PROGRESS */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
              Total Evacuation Progress
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginLeft: '8px' }}>
              ({evacuated} of {total} occupants cleared)
            </span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 800, color: '#0d7a5f' }}>
            {evacProgress}%
          </span>
        </div>

        <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
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

      {/* 3. 10-FLOOR POPULATION MATRIX */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 16px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <Layers style={{ width: '13px', height: '13px', color: '#0d7a5f' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
              10-Floor Population Distribution
            </span>
          </div>
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
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

        {/* 10 Floor Grid: 2 rows of 5 */}
        <div className="grid grid-cols-5" style={{ gap: '6px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fl => {
            const data = floorData[fl] || { occupants: 0, hasFire: false };
            const isHazard = data.hasFire;

            return (
              <div
                key={fl}
                className="flex items-center justify-between transition-all"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: isHazard ? '#fff5f5' : '#f8fafc',
                  border: isHazard ? '1px solid #fecaca' : '1px solid #e2e8f0',
                }}
              >
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: isHazard ? '#dc2626' : '#64748b',
                    }}
                  >
                    L{fl}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isHazard ? '#dc2626' : '#1e293b', fontFamily: 'monospace' }}>
                    {data.occupants}p
                  </span>
                </div>

                {isHazard ? (
                  <Flame style={{ width: '12px', height: '12px', color: '#ef4444', fill: '#ef4444' }} />
                ) : (
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. STAIRWELL CORES & EGRESS THROUGHPUT (Clean Compact Single-Line Rows) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 16px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
            Stairwell Core & Egress Exit Throughput
          </span>
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#f0fdf4',
              color: '#0d7a5f',
              border: '1px solid #d1fae5',
              textTransform: 'uppercase',
            }}
          >
            LOAD BALANCED
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: '6px' }}>
          {exits.map((exit) => {
            const load = exit.load || 0;
            const capacity = exit.capacity || 60;
            const loadPct = exit.loadPercentage || Math.min(100, Math.round((load / capacity) * 100)) || 0;
            const isOverloaded = loadPct > 100;
            const isHeavy = loadPct > 80;

            const dotColor = isOverloaded ? '#ef4444' : isHeavy ? '#f59e0b' : '#10b981';
            const badgeBg = isOverloaded ? '#fef2f2' : isHeavy ? '#fffbeb' : '#f0fdf4';
            const badgeColor = isOverloaded ? '#dc2626' : isHeavy ? '#d97706' : '#0d7a5f';
            const badgeBorder = isOverloaded ? '#fecaca' : isHeavy ? '#fde68a' : '#d1fae5';

            return (
              <div
                key={exit.id}
                className="flex items-center justify-between"
                style={{
                  padding: '8px 12px',
                  borderRadius: '9px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  gap: '12px',
                }}
              >
                {/* Left: Indicator & Exit Name */}
                <div className="flex items-center min-w-[220px]" style={{ gap: '8px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b' }}>
                    {exit.name}
                  </span>
                </div>

                {/* Center: Inline Progress Bar */}
                <div className="flex-1" style={{ height: '5px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    className="transition-all"
                    style={{
                      height: '100%',
                      borderRadius: '999px',
                      background: isOverloaded ? '#ef4444' : isHeavy ? '#f59e0b' : '#0d7a5f',
                      width: `${Math.min(100, loadPct)}%`,
                      transitionDuration: '300ms',
                    }}
                  />
                </div>

                {/* Right: Numbers & Load Pill */}
                <div className="flex items-center shrink-0" style={{ gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>
                    {load} / {capacity}
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '5px',
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
            );
          })}
        </div>
      </div>

      {/* 5. BOTTLENECK / STATUS ALERT */}
      {bottlenecks.length > 0 ? (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fffbfb',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle style={{ width: '14px', height: '14px', color: '#ef4444', flexShrink: 0 }} />
          <div className="flex flex-col" style={{ gap: '2px' }}>
            {bottlenecks.map((msg, i) => (
              <span key={i} style={{ fontSize: '10.5px', color: '#b91c1c', fontWeight: 500 }}>
                • {msg}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck style={{ width: '14px', height: '14px', color: '#0d7a5f', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0d7a5f' }}>
            All egress cores are operating below capacity. Safe load-balancing active.
          </span>
        </div>
      )}
    </div>
  );
});
