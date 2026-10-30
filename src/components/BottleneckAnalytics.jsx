import React, { useMemo } from 'react';
import { ShieldCheck, AlertOctagon, Activity, Clock, CheckCircle2, Users, Layers } from 'lucide-react';

export const BottleneckAnalytics = React.memo(({ stats, exits, rooms, bottlenecks = [] }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
  const elapsed = stats.elapsedSeconds || 0;

  const evacProgress = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  // Calculate occupants per floor across all 10 floors with memoization
  const floorCounts = useMemo(() => {
    const counts = {};
    for (let f = 1; f <= 10; f++) counts[f] = 0;
    if (rooms) {
      rooms.forEach(r => {
        const fl = r.floor || 1;
        counts[fl] = (counts[fl] || 0) + (r.peopleCount || 0);
      });
    }
    return counts;
  }, [rooms]);

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto select-none"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#1e293b',
      }}
    >
      {/* Header telemetry info */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
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
            <Activity style={{ width: '15px', height: '15px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
              10-FLOOR SKYSCRAPER TELEMETRY
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
              Live occupancy & evacuation throughput
            </div>
          </div>
        </div>
        <div
          className="flex items-center"
          style={{
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#0d7a5f',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            padding: '4px 10px',
            borderRadius: '8px',
          }}
        >
          <Clock style={{ width: '13px', height: '13px' }} />
          <span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}s</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-3" style={{ gap: '10px' }}>
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tower Total
          </div>
          <div className="flex items-center justify-center" style={{ gap: '6px', fontSize: '18px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
            <Users style={{ width: '16px', height: '16px', color: '#64748b' }} />
            <span>{total}</span>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#0d7a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Safely Exited
          </div>
          <div className="flex items-center justify-center" style={{ gap: '6px', fontSize: '18px', fontWeight: 800, color: '#0d7a5f', marginTop: '4px' }}>
            <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d7a5f' }} />
            <span>{evacuated}</span>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            In Stairwells
          </div>
          <div className="flex items-center justify-center" style={{ gap: '6px', fontSize: '18px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            <Activity style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
            <span>{inTransit}</span>
          </div>
        </div>
      </div>

      {/* 10-Floor Population Distribution Matrix */}
      <div
        style={{
          padding: '14px',
          borderRadius: '14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
          <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Layers style={{ width: '14px', height: '14px', color: '#0d7a5f' }} />
            <span>POPULATION MATRIX (LEVELS 1 - 10)</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Real-time sensor scan</span>
        </div>
        <div className="grid grid-cols-5" style={{ gap: '6px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fl => (
            <div
              key={fl}
              className="text-center transition-colors"
              style={{
                padding: '8px 4px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>L{fl}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0d7a5f', fontFamily: 'monospace', marginTop: '2px' }}>
                {floorCounts[fl]}p
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Evacuation Progress Bar */}
      <div
        style={{
          padding: '14px',
          borderRadius: '14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
            Total Evacuation Progress
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: '#0d7a5f' }}>
            {evacProgress}%
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            className="transition-all"
            style={{
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #0d7a5f 0%, #10b981 100%)',
              width: `${evacProgress}%`,
              transitionDuration: '300ms',
            }}
          />
        </div>
      </div>

      {/* Multi-Floor Emergency Stairwell Cores & Exits */}
      <div className="flex flex-col" style={{ gap: '8px' }}>
        <div className="flex items-center justify-between" style={{ padding: '0 2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            STAIRWELL CORE & EXIT THROUGHPUT
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#0d7a5f',
              background: '#f0fdf4',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #d1fae5',
            }}
          >
            BALANCED
          </span>
        </div>

        {exits.map((exit) => {
          const loadPct = exit.loadPercentage || Math.min(100, Math.round((exit.load / exit.capacity) * 100)) || 0;
          const isOverloaded = loadPct > 100;
          const isHeavy = loadPct > 85;

          const badgeBg = isOverloaded ? '#fef2f2' : isHeavy ? '#fffbeb' : '#f0fdf4';
          const badgeColor = isOverloaded ? '#dc2626' : isHeavy ? '#d97706' : '#0d7a5f';
          const badgeBorder = isOverloaded ? '#fecaca' : isHeavy ? '#fde68a' : '#d1fae5';
          const barBg = isOverloaded ? '#ef4444' : isHeavy ? '#f59e0b' : '#0d7a5f';

          return (
            <div
              key={exit.id}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{exit.name}</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                  }}
                >
                  {exit.load} / {exit.capacity} ({loadPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  className="transition-all"
                  style={{
                    height: '100%',
                    borderRadius: '999px',
                    background: barBg,
                    width: `${Math.min(100, loadPct)}%`,
                    transitionDuration: '300ms',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stampede Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div
          className="flex items-start"
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            gap: '8px',
            fontSize: '11px',
            color: '#dc2626',
          }}
        >
          <AlertOctagon style={{ width: '15px', height: '15px', color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div className="flex flex-col" style={{ gap: '4px' }}>
            {bottlenecks.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      )}

      {bottlenecks.length === 0 && (
        <div
          className="flex items-center"
          style={{
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #d1fae5',
            gap: '8px',
            fontSize: '11.5px',
            color: '#0d7a5f',
            fontWeight: 500,
          }}
        >
          <ShieldCheck style={{ width: '16px', height: '16px', color: '#0d7a5f', flexShrink: 0 }} />
          <span>Stairwells & ground muster exits dynamically balanced. Zero congestion detected.</span>
        </div>
      )}
    </div>
  );
});
