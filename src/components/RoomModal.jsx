import React from 'react';
import { Flame, Users, X, Layers, Thermometer } from 'lucide-react';

export const RoomModal = ({ theme = 'dark', room, onClose, onTriggerFire, onUpdateCrowd, onSelectFloor }) => {
  if (!room) return null;
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 select-none ${
      isDark ? 'bg-slate-950/80 theme-dark' : 'bg-slate-900/40 theme-light'
    } backdrop-blur-sm`}>
      <div
        className="w-full max-w-md overflow-hidden flex flex-col select-none"
        style={{
          background: isDark ? '#0c162d' : '#ffffff',
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #e2e8f0',
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)'
            : '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '24px 26px',
          gap: '18px',
          color: isDark ? '#f8fafc' : '#0f172a'
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-start justify-between pb-3"
          style={{ borderBottom: isDark ? '1px solid rgba(56, 189, 248, 0.18)' : '1px solid #e2e8f0' }}
        >
          <div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <span
                style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
                  color: isDark ? '#34d399' : '#0d7a5f',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #d1fae5',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                LEVEL {room.floor}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: isDark ? '#60a5fa' : '#94a3b8' }}>[{room.camId}]</span>
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#ffffff' : '#1e293b', marginTop: '4px' }}>{room.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* Room Metrics & Hazard Status */}
        <div className="grid grid-cols-2" style={{ gap: '10px' }}>
          {/* Occupants Card */}
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#f8fafc',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0',
            }}
          >
            <div className="flex items-center" style={{ gap: '6px', fontSize: '10px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
              <Users style={{ width: '13px', height: '13px', color: '#10b981' }} />
              <span>Current Occupants</span>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 900, color: isDark ? '#ffffff' : '#1e293b' }}>{room.peopleCount}</span>
              <div className="flex items-center" style={{ gap: '4px' }}>
                <button
                  onClick={() => onUpdateCrowd(room.id, Math.max(0, room.peopleCount - 2))}
                  className="cursor-pointer transition-colors flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(30, 41, 59, 0.9)' : '#ffffff',
                    border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #e2e8f0',
                    fontWeight: 700,
                    color: isDark ? '#f1f5f9' : '#475569',
                  }}
                  title="Reduce occupants"
                >
                  -
                </button>
                <button
                  onClick={() => onUpdateCrowd(room.id, room.peopleCount + 2)}
                  className="cursor-pointer transition-colors flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(30, 41, 59, 0.9)' : '#ffffff',
                    border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #e2e8f0',
                    fontWeight: 700,
                    color: isDark ? '#f1f5f9' : '#475569',
                  }}
                  title="Add occupants"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Room Status Card */}
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: room.hasFire
                ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fffbfb')
                : (isDark ? 'rgba(15, 23, 42, 0.75)' : '#f8fafc'),
              border: room.hasFire
                ? (isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #fecaca')
                : (isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0'),
            }}
          >
            <div className="flex items-center" style={{ gap: '6px', fontSize: '10px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
              <Thermometer style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
              <span>Room Status</span>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: room.hasFire ? '#ef4444' : (isDark ? '#34d399' : '#0d7a5f'),
                }}
              >
                {room.tempCelsius}°C
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: room.hasFire ? '#ef4444' : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#f0fdf4'),
                  color: room.hasFire ? '#ffffff' : (isDark ? '#34d399' : '#0d7a5f'),
                  border: room.hasFire ? 'none' : (isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #d1fae5'),
                }}
              >
                {room.hasFire ? 'FIRE ALARM' : 'NORMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col" style={{ gap: '8px' }}>
          <button
            onClick={() => {
              onTriggerFire(room.id);
              onClose();
            }}
            className="w-full flex items-center justify-center cursor-pointer transition-all"
            style={{
              height: '42px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              gap: '8px',
              background: room.hasFire
                ? (isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc')
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: room.hasFire ? (isDark ? '#cbd5e1' : '#475569') : '#ffffff',
              border: room.hasFire ? (isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0') : 'none',
              boxShadow: room.hasFire ? 'none' : '0 4px 12px -2px rgba(239, 68, 68, 0.3)',
            }}
          >
            <Flame style={{ width: '16px', height: '16px', fill: room.hasFire ? 'none' : 'white' }} />
            <span>{room.hasFire ? 'Extinguish Fire in this Room' : 'Trigger Fire Hazard in this Room'}</span>
          </button>

          <button
            onClick={() => {
              onSelectFloor(String(room.floor));
              onClose();
            }}
            className="w-full flex items-center justify-center cursor-pointer transition-all"
            style={{
              height: '40px',
              borderRadius: '12px',
              background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0',
              color: isDark ? '#cbd5e1' : '#334155',
              fontSize: '12px',
              fontWeight: 600,
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4';
              e.currentTarget.style.color = isDark ? '#34d399' : '#0d7a5f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc';
              e.currentTarget.style.color = isDark ? '#cbd5e1' : '#334155';
            }}
          >
            <Layers style={{ width: '15px', height: '15px' }} />
            <span>Isolate Level {room.floor} View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
