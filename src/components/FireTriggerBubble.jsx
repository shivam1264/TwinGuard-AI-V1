import React from 'react';
import { Flame, X, ShieldAlert } from 'lucide-react';

export const FireTriggerBubble = ({ room, position, onClose, onToggleFire }) => {
  if (!room || !position) return null;

  // Clamp position so it stays inside screen viewport
  const left = Math.min(window.innerWidth - 240, Math.max(20, position.screenX - 110));
  const top = Math.min(window.innerHeight - 100, Math.max(70, position.screenY - 60));

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 pointer-events-auto animate-in fade-in zoom-in-90 duration-150"
    >
      <div className="glass-panel rounded-full px-3 py-1.5 border border-cyan-500/50 shadow-[0_0_25px_rgba(0,240,255,0.35)] flex items-center gap-2.5 backdrop-blur-md bg-slate-950/90 text-xs">
        {/* Fire Emoji / Icon Badge */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md transition-transform transform hover:scale-110 ${
            room.hasFire
              ? 'bg-red-600 shadow-[0_0_12px_rgba(255,51,68,0.7)] animate-bounce'
              : 'bg-gradient-to-tr from-amber-500 to-red-500'
          }`}
        >
          🔥
        </div>

        {/* Room Info */}
        <div className="flex flex-col">
          <span className="font-hud font-bold text-slate-100 text-[11px] leading-tight truncate max-w-[120px]">
            {room.name}
          </span>
          <span className="font-mono text-[9px] text-cyan-400">
            L{room.floor} • {room.peopleCount} occupants
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onToggleFire(room.id);
            onClose();
          }}
          className={`px-2.5 py-1 rounded-full font-hud font-bold text-[10px] tracking-wider transition-all flex items-center gap-1 ${
            room.hasFire
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-[0_0_12px_rgba(255,51,68,0.5)]'
          }`}
        >
          {room.hasFire ? 'Extinguish' : 'Start Fire'}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
