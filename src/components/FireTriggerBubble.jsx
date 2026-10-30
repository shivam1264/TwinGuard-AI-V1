import React from 'react';
import { X } from 'lucide-react';

export const FireTriggerBubble = ({ room, position, onClose, onToggleFire }) => {
  if (!room || !position) return null;

  // Clamp position so it stays inside screen viewport
  const left = Math.min(window.innerWidth - 250, Math.max(20, position.screenX - 110));
  const top = Math.min(window.innerHeight - 100, Math.max(70, position.screenY - 60));

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 pointer-events-auto animate-in fade-in zoom-in-90 duration-150"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200 shadow-xl flex items-center gap-2.5 text-xs text-slate-800">
        {/* Fire Emoji / Icon Badge */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm transition-transform transform hover:scale-110 ${
            room.hasFire
              ? 'bg-red-600 shadow-md shadow-red-500/50 animate-bounce text-white'
              : 'bg-gradient-to-tr from-amber-400 to-red-500 text-white'
          }`}
        >
          🔥
        </div>

        {/* Room Info */}
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-[11px] leading-tight truncate max-w-[130px]">
            {room.name}
          </span>
          <span className="font-mono text-[9px] text-blue-600 font-semibold">
            L{room.floor} • {room.peopleCount} occupants
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onToggleFire(room.id);
            onClose();
          }}
          className={`px-3 py-1 rounded-full font-bold text-[10px] tracking-wider transition-all flex items-center gap-1 ${
            room.hasFire
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/25'
          }`}
        >
          {room.hasFire ? 'Extinguish' : 'Start Fire'}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
