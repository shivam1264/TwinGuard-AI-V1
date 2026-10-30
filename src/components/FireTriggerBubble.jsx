import React from 'react';
import { X } from 'lucide-react';

export const FireTriggerBubble = ({ room, position, onClose, onToggleFire }) => {
  if (!room || !position) return null;

  // Clamp position so it stays inside screen viewport
  const left = Math.min(window.innerWidth - 250, Math.max(20, position.screenX - 110));
  const top = Math.min(window.innerHeight - 100, Math.max(70, position.screenY - 60));

  return (
    <div
      style={{
        left: `${left}px`,
        top: `${top}px`,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      className="fixed z-50 pointer-events-auto animate-in fade-in zoom-in-90 duration-150 select-none"
    >
      <div
        className="flex items-center gap-2.5"
        style={{
          background: '#ffffff',
          borderRadius: '999px',
          padding: '6px 12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 25px -4px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Fire Emoji / Icon Badge */}
        <div
          className={`flex items-center justify-center text-sm shadow-sm transition-transform ${
            room.hasFire
              ? 'bg-red-600 shadow-md shadow-red-500/50 animate-bounce text-white'
              : 'bg-gradient-to-tr from-amber-400 to-red-500 text-white'
          }`}
          style={{ width: '26px', height: '26px', borderRadius: '50%' }}
        >
          🔥
        </div>

        {/* Room Info */}
        <div className="flex flex-col">
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', lineHeight: 1.2, maxWidth: '130px' }} className="truncate">
            {room.name}
          </span>
          <span style={{ fontSize: '9.5px', fontFamily: 'monospace', color: '#0d7a5f', fontWeight: 700, marginTop: '1px' }}>
            L{room.floor} • {room.peopleCount} occupants
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onToggleFire(room.id);
            onClose();
          }}
          className="cursor-pointer transition-all flex items-center"
          style={{
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: room.hasFire ? '#f8fafc' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: room.hasFire ? '#475569' : '#ffffff',
            border: room.hasFire ? '1px solid #e2e8f0' : 'none',
            boxShadow: room.hasFire ? 'none' : '0 2px 6px -1px rgba(239, 68, 68, 0.35)',
          }}
        >
          {room.hasFire ? 'Extinguish' : 'Start Fire'}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'transparent',
            color: '#94a3b8',
            border: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#334155'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <X style={{ width: '13px', height: '13px' }} />
        </button>
      </div>
    </div>
  );
};
