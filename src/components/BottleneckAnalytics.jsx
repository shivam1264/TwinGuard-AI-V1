import React, { useMemo, useState } from 'react';
import {
  Building2,
  Building,
  RotateCcw,
  Clock,
  X,
  Users,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Flag,
  Info,
  Layers,
  LayoutGrid,
  TrendingUp,
  Share2,
  ShieldCheck,
  ChevronRight,
  Flame,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';

export const BottleneckAnalytics = React.memo(({
  stats = {},
  exits = [],
  rooms = [],
  bottlenecks = [],
  onClose,
  onReset
}) => {
  const [floorViewMode, setFloorViewMode] = useState('floors'); // 'floors' | 'rooms'
  const [stairwellViewMode, setStairwellViewMode] = useState('cores'); // 'cores' | 'exits'

  // Real Simulation Statistics
  const total = stats.total || (rooms.length > 0 ? rooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0) : 190);
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || Math.max(0, total - evacuated);
  const remaining = Math.max(0, total - evacuated);
  const evacProgress = total > 0 ? Math.round((evacuated / total) * 100) : 0;
  const remainingPercent = total > 0 ? Math.round((remaining / total) * 100) : 100;
  const elapsed = stats.elapsedSeconds || 0;

  // Real 10-Floor Population Data
  const floorData = useMemo(() => {
    const data = {};
    for (let f = 1; f <= 10; f++) {
      data[f] = { occupants: 0, hasFire: false, capacity: 50 };
    }
    if (rooms && rooms.length > 0) {
      rooms.forEach((r) => {
        const fl = r.floor || 1;
        if (data[fl]) {
          data[fl].occupants += (r.peopleCount || 0);
          if (r.hasFire) data[fl].hasFire = true;
        }
      });
    } else {
      // Default fallback
      for (let f = 1; f <= 10; f++) {
        data[f] = { occupants: 19, hasFire: f === 5 || f === 6, capacity: 50 };
      }
    }
    return data;
  }, [rooms]);

  // Real Exits normalization
  const realExits = useMemo(() => {
    const defaultList = [
      { id: 'exit_west', key: 'Exit A', name: 'Exit A (West Emergency Core)', sub: 'West Core', load: 0, capacity: 60, color: '#2563eb' },
      { id: 'exit_east', key: 'Exit B', name: 'Exit B (East Fire Escape Core)', sub: 'East Core', load: 0, capacity: 60, color: '#8b5cf6' },
      { id: 'exit_south', key: 'Exit C', name: 'Exit C (South Grand Plaza Exit)', sub: 'South Core', load: 0, capacity: 80, color: '#f59e0b' }
    ];

    if (exits && exits.length >= 3) {
      return defaultList.map((item, idx) => {
        const exitObj = exits[idx] || {};
        const load = exitObj.load || 0;
        const capacity = exitObj.capacity || item.capacity;
        const percent = Math.min(100, Math.round((load / capacity) * 100));
        return {
          ...item,
          load,
          capacity,
          percent,
          status: exitObj.status || 'Operational'
        };
      });
    }
    return defaultList.map(item => ({ ...item, percent: 0, status: 'Operational' }));
  }, [exits]);

  // Estimated evacuation time computation
  const estimatedTimeStr = useMemo(() => {
    if (evacuated > 5 && elapsed > 2 && remaining > 0) {
      const ratePerSec = evacuated / elapsed;
      const secsRemaining = Math.round(remaining / ratePerSec);
      const m = Math.floor(secsRemaining / 60);
      const s = secsRemaining % 60;
      return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return '-- : -- : --';
  }, [evacuated, elapsed, remaining]);

  return (
    <div
      className="flex flex-col select-none no-scrollbar"
      style={{
        gap: '14px',
        padding: '16px',
        background: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: 'border-box',
        width: '100%',
        borderRadius: '24px',
      }}
    >
      {/* ── 1. TOP HEADER CARD (Matching Reference Image) ── */}
      <div
        className="flex items-center justify-between"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '14px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Left: Blue Building Icon Badge & Titles */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#ebf5ff',
              border: '1px solid #d0e7ff',
              color: '#0284c7',
            }}
          >
            <Building2 style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Stairwell Cores & 10-Floor Population Analytics
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
              Live occupancy, egress flow rates & evacuation throughput telemetry
            </p>
          </div>
        </div>

        {/* Right: Operational Status, Simulation Time Pill, Reset & Close */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          {/* Operational Status Pill */}
          <div
            className="flex items-center"
            style={{
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              borderRadius: '12px',
              padding: '6px 14px',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <div className="text-left">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0d7a5f', lineHeight: 1.1 }}>
                All Systems Operational
              </div>
              <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 600 }}>
                Real-time monitoring active
              </div>
            </div>
          </div>

          {/* Simulation Time Capsule */}
          <div
            className="flex items-center"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '6px 12px',
              gap: '8px',
            }}
          >
            <Clock style={{ width: '16px', height: '16px', color: '#334155' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', lineHeight: 1.1 }}>
                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}s
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Simulation Time
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center justify-center cursor-pointer transition-colors"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
              title="Reset Simulation"
            >
              <RotateCcw style={{ width: '15px', height: '15px' }} />
            </button>
          )}

          {/* Close Modal Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer transition-colors"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
              title="Close Dialog"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. FOUR KPI CARDS (Matching Reference Image) ── */}
      <div className="grid grid-cols-4" style={{ gap: '14px' }}>
        {/* Card 1: TOWER TOTAL */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'between',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ebf5ff', color: '#2563eb' }}
              >
                <Users style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TOWER TOTAL
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                  {total}
                </div>
              </div>
            </div>

            {/* Sparkline mini-bars */}
            <div className="flex items-end" style={{ gap: '3px', height: '24px' }}>
              {[12, 16, 20, 18, 24].map((h, i) => (
                <div key={i} style={{ width: '4px', height: `${h}px`, background: '#bfdbfe', borderRadius: '2px' }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              <Building style={{ width: '12px', height: '12px' }} />
              <span>10 Floors • 100 Rooms</span>
            </div>
          </div>
        </div>

        {/* Card 2: SAFELY EXITED */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'between',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a' }}
              >
                <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SAFELY EXITED
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', lineHeight: 1.1 }}>
                  {evacuated}
                </div>
              </div>
            </div>

            {/* Circular Mini Donut Gauge */}
            <div className="relative flex items-center justify-center shrink-0" style={{ width: '44px', height: '44px' }}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                <circle
                  cx="18" cy="18" r="14"
                  stroke="#16a34a"
                  strokeWidth="4"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (evacProgress / 100) * 88}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 800, color: '#0f172a' }}>
                {evacProgress}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
              <ShieldCheck style={{ width: '13px', height: '13px' }} />
              <span>{evacProgress}% evacuated</span>
            </div>
          </div>
        </div>

        {/* Card 3: IN STAIRWELLS */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'between',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#d97706' }}
              >
                <Activity style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  IN STAIRWELLS
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>
                  {inTransit}
                </div>
              </div>
            </div>

            {/* Sparkline mini-bars amber */}
            <div className="flex items-end" style={{ gap: '3px', height: '24px' }}>
              {[14, 18, 24, 20, 16].map((h, i) => (
                <div key={i} style={{ width: '4px', height: `${h}px`, background: '#fde68a', borderRadius: '2px' }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
              <Activity style={{ width: '12px', height: '12px' }} />
              <span>Active movement</span>
            </div>
          </div>
        </div>

        {/* Card 4: REMAINING */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'between',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626' }}
              >
                <AlertTriangle style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  REMAINING
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', lineHeight: 1.1 }}>
                  {remaining}
                </div>
              </div>
            </div>

            {/* Circular Mini Donut Gauge Red */}
            <div className="relative flex items-center justify-center shrink-0" style={{ width: '44px', height: '44px' }}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                <circle
                  cx="18" cy="18" r="14"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (remainingPercent / 100) * 88}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 800, color: '#0f172a' }}>
                {remainingPercent}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="flex items-center" style={{ gap: '6px', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
              <AlertTriangle style={{ width: '12px', height: '12px' }} />
              <span>Awaiting clearance</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. TOTAL EVACUATION PROGRESS + ESTIMATED TIME (Matching Reference Image) ── */}
      <div className="grid grid-cols-12" style={{ gap: '14px' }}>
        {/* Left: Total Evacuation Progress Banner */}
        <div
          className="col-span-9 flex flex-col justify-between"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ebf5ff', color: '#0284c7' }}
              >
                <Flag style={{ width: '14px', height: '14px' }} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Total Evacuation Progress
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginLeft: '8px' }}>
                  ({evacuated} of {total} occupants cleared)
                </span>
              </div>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 900, color: '#0d7a5f' }}>
              {evacProgress}%
            </span>
          </div>

          {/* Clean Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              className="transition-all"
              style={{
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #0d7a5f 0%, #10b981 100%)',
                width: `${evacProgress}%`,
                transitionDuration: '500ms',
              }}
            />
          </div>
        </div>

        {/* Right: Estimated Evacuation Time */}
        <div
          className="col-span-3 flex items-center justify-between"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#ebf5ff', color: '#0284c7' }}
            >
              <Clock style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Estimated Evacuation Time
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                {estimatedTimeStr}
              </div>
            </div>
          </div>
          <Info style={{ width: '15px', height: '15px', color: '#94a3b8' }} />
        </div>
      </div>

      {/* ── 4. 10-FLOOR POPULATION DISTRIBUTION (Matching Reference Image) ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Header + Legend + Mode Switcher */}
        <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ebf5ff', color: '#0284c7' }}
            >
              <Layers style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                10-Floor Population Distribution
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>
                Live occupancy count on each floor
              </div>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: '14px' }}>
            {/* Status Legend */}
            <div className="flex items-center" style={{ gap: '12px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
              <span className="flex items-center gap-1.5">
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} /> Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} /> High
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} /> Critical
              </span>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center" style={{ gap: '4px' }}>
              <button
                onClick={() => setFloorViewMode('floors')}
                className="flex items-center cursor-pointer transition-all"
                style={{
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  gap: '5px',
                  background: floorViewMode === 'floors' ? '#2563eb' : '#ffffff',
                  color: floorViewMode === 'floors' ? '#ffffff' : '#64748b',
                  border: floorViewMode === 'floors' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: floorViewMode === 'floors' ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                <LayoutGrid style={{ width: '12px', height: '12px' }} />
                <span>By Floors</span>
              </button>
              <button
                onClick={() => setFloorViewMode('rooms')}
                className="flex items-center cursor-pointer transition-all"
                style={{
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  gap: '5px',
                  background: floorViewMode === 'rooms' ? '#2563eb' : '#ffffff',
                  color: floorViewMode === 'rooms' ? '#ffffff' : '#64748b',
                  border: floorViewMode === 'rooms' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: floorViewMode === 'rooms' ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                <Building style={{ width: '12px', height: '12px' }} />
                <span>By Rooms</span>
              </button>
            </div>
          </div>
        </div>

        {/* 10 Floor Vertical Cards in a Horizontal Strip (L1 to L10) */}
        <div className="grid grid-cols-10" style={{ gap: '8px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fl) => {
            const data = floorData[fl] || { occupants: 0, hasFire: false, capacity: 50 };
            const isCritical = data.hasFire || data.occupants > 35;
            const floorPct = Math.min(100, Math.round((data.occupants / data.capacity) * 100));

            return (
              <div
                key={fl}
                className="flex flex-col items-center justify-between transition-all"
                style={{
                  padding: '12px 6px',
                  borderRadius: '14px',
                  background: isCritical ? '#fff1f2' : '#f0fdf4',
                  border: isCritical ? '1px solid #fecdd3' : '1px solid #dcfce7',
                  minHeight: '124px',
                }}
              >
                {/* Floor Header (Icon + L1) */}
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <Building style={{ width: '14px', height: '14px', color: isCritical ? '#e11d48' : '#16a34a' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                    L{fl}
                  </span>
                </div>

                {/* Occupants Count with User Icon */}
                <div className="flex items-center" style={{ gap: '4px' }}>
                  <Users style={{ width: '12px', height: '12px', color: isCritical ? '#e11d48' : '#16a34a' }} />
                  <span style={{ fontSize: '13px', fontWeight: 900, color: isCritical ? '#e11d48' : '#0f172a', fontFamily: 'monospace' }}>
                    {data.occupants}
                  </span>
                </div>

                {/* Mini Level Bar */}
                <div style={{ width: '38px', height: '4px', background: isCritical ? '#fecdd3' : '#bbf7d0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: isCritical ? '#e11d48' : '#16a34a',
                      borderRadius: '999px',
                      width: `${floorPct}%`,
                    }}
                  />
                </div>

                {/* Percentage */}
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                  {floorPct}%
                </div>

                {/* Status Pill */}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isCritical ? '#ffe4e6' : '#dcfce7',
                    color: isCritical ? '#be123c' : '#15803d',
                  }}
                >
                  {isCritical ? 'Critical' : 'Normal'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. BOTTOM SECTION: 2 COLUMNS (Matching Reference Image) ── */}
      <div className="grid grid-cols-12" style={{ gap: '14px' }}>
        {/* Left Column (Col-7): Stairwell Core & Egress Exit Throughput */}
        <div
          className="col-span-7 flex flex-col justify-between"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            gap: '12px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ebf5ff', color: '#0284c7' }}
              >
                <TrendingUp style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  Stairwell Core & Egress Exit Throughput
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                  Real-time flow rate and clearance status for each exit core
                </div>
              </div>
            </div>

            {/* Toggle Filter Pills */}
            <div className="flex items-center" style={{ gap: '4px' }}>
              <button
                onClick={() => setStairwellViewMode('cores')}
                className="flex items-center cursor-pointer transition-all"
                style={{
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  gap: '5px',
                  background: stairwellViewMode === 'cores' ? '#2563eb' : '#ffffff',
                  color: stairwellViewMode === 'cores' ? '#ffffff' : '#64748b',
                  border: stairwellViewMode === 'cores' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: stairwellViewMode === 'cores' ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                <Share2 style={{ width: '12px', height: '12px' }} />
                <span>By Stairwell Core</span>
              </button>
              <button
                onClick={() => setStairwellViewMode('exits')}
                className="flex items-center cursor-pointer transition-all"
                style={{
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  gap: '5px',
                  background: stairwellViewMode === 'exits' ? '#2563eb' : '#ffffff',
                  color: stairwellViewMode === 'exits' ? '#ffffff' : '#64748b',
                  border: stairwellViewMode === 'exits' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: stairwellViewMode === 'exits' ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                <span>By Exit</span>
              </button>
            </div>
          </div>

          {/* 3 Exit Rows (Matching Reference Image) */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            {realExits.map((exit) => (
              <div
                key={exit.id}
                className="flex items-center justify-between"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  gap: '12px',
                }}
              >
                {/* Left: Green dot + Stair Arrow icon + Name */}
                <div className="flex items-center" style={{ gap: '8px', minWidth: '220px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: exit.percent > 85 ? '#ef4444' : '#10b981',
                      flexShrink: 0,
                    }}
                  />
                  <ArrowUpRight style={{ width: '14px', height: '14px', color: '#64748b' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                    {exit.name}
                  </span>
                </div>

                {/* Center: Inline Progress Bar */}
                <div className="flex-1" style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    className="transition-all"
                    style={{
                      height: '100%',
                      borderRadius: '999px',
                      background: exit.percent > 85 ? '#ef4444' : '#0d7a5f',
                      width: `${Math.min(100, exit.percent)}%`,
                      transitionDuration: '300ms',
                    }}
                  />
                </div>

                {/* Right: Numbers + Percent Badge + Chevron */}
                <div className="flex items-center shrink-0" style={{ gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>
                    {exit.load} &nbsp;/&nbsp; {exit.capacity}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#f0fdf4',
                      color: '#0d7a5f',
                      border: '1px solid #d1fae5',
                      fontFamily: 'monospace',
                    }}
                  >
                    {exit.percent}%
                  </span>
                  <ChevronRight style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Operational Status / Bottlenecks Banner */}
          {bottlenecks.length > 0 ? (
            <div
              className="flex items-center justify-between"
              style={{
                padding: '10px 14px',
                borderRadius: '11px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                fontSize: '11px',
                color: '#be123c',
                fontWeight: 600,
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                <span>{bottlenecks[0]}</span>
              </div>
              <ChevronRight style={{ width: '14px', height: '14px', color: '#be123c' }} />
            </div>
          ) : (
            <div
              className="flex items-center justify-between"
              style={{
                padding: '10px 14px',
                borderRadius: '11px',
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                fontSize: '11.5px',
                color: '#0d7a5f',
                fontWeight: 600,
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck style={{ width: '15px', height: '15px', color: '#16a34a' }} />
                <span>All egress cores are operating below capacity. Safe load-balancing active.</span>
              </div>
              <ChevronRight style={{ width: '14px', height: '14px', color: '#0d7a5f' }} />
            </div>
          )}
        </div>

        {/* Right Column (Col-5): Stairwell Core Capacity & Flow (3 Donut Gauges) */}
        <div
          className="col-span-5 flex flex-col justify-between"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            gap: '12px',
          }}
        >
          {/* Header */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ebf5ff', color: '#0284c7' }}
            >
              <BarChart3 style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                Stairwell Core Capacity & Flow
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                Live utilization of stairwell cores
              </div>
            </div>
          </div>

          {/* 3 Donut Cards side-by-side (Exit A, Exit B, Exit C) */}
          <div className="grid grid-cols-3" style={{ gap: '10px' }}>
            {realExits.map((core) => {
              const themeStyles = {
                'Exit A': { bg: '#ebf5ff', text: '#2563eb', border: '#d0e7ff', track: '#3b82f6' },
                'Exit B': { bg: '#f3e8ff', text: '#8b5cf6', border: '#e9d5ff', track: '#8b5cf6' },
                'Exit C': { bg: '#fef3c7', text: '#d97706', border: '#fde68a', track: '#f59e0b' }
              }[core.key] || { bg: '#ebf5ff', text: '#2563eb', border: '#d0e7ff', track: '#3b82f6' };

              return (
                <div
                  key={core.id}
                  className="flex flex-col items-center justify-between text-center"
                  style={{
                    padding: '12px 8px',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {/* Top: Icon + Core Name */}
                  <div className="flex items-center" style={{ gap: '6px', marginBottom: '8px' }}>
                    <div
                      className="flex items-center justify-center"
                      style={{ width: '22px', height: '22px', borderRadius: '6px', background: themeStyles.bg, color: themeStyles.text }}
                    >
                      <ArrowUpRight style={{ width: '12px', height: '12px' }} />
                    </div>
                    <div className="text-left">
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        {core.key}
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500 }}>
                        {core.sub}
                      </div>
                    </div>
                  </div>

                  {/* Donut Gauge SVG */}
                  <div className="relative flex items-center justify-center" style={{ width: '60px', height: '60px', margin: '4px 0' }}>
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" stroke="#e2e8f0" strokeWidth="3.5" fill="none" />
                      <circle
                        cx="18" cy="18" r="14"
                        stroke={themeStyles.track}
                        strokeWidth="3.5"
                        strokeDasharray="88"
                        strokeDashoffset={88 - (core.percent / 100) * 88}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>
                      {core.percent}%
                    </span>
                  </div>

                  {/* Bottom: Occupants info */}
                  <div className="flex items-center" style={{ gap: '4px', marginTop: '6px' }}>
                    <Users style={{ width: '11px', height: '11px', color: themeStyles.text }} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                      {core.load} / {core.capacity}
                    </span>
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500 }}>
                    Occupants
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
