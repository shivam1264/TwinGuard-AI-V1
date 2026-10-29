import React from 'react';
import { Flame, Users, X, Layers, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';

export const RoomModal = ({ room, onClose, onTriggerFire, onUpdateCrowd, onSelectFloor }) => {
  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-cyan-500/40 shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-tech bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px]">
                LEVEL {room.floor}
              </span>
              <span className="font-mono text-xs text-slate-400">[{room.camId}]</span>
            </div>
            <h2 className="font-hud font-bold text-lg text-white mt-1">{room.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Metrics & Hazard Status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-hud text-[10px] uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Current Occupants
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-hud font-bold text-cyan-300">{room.peopleCount}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateCrowd(room.id, Math.max(0, room.peopleCount - 2))}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                  title="Reduce occupants"
                >
                  -
                </button>
                <button
                  onClick={() => onUpdateCrowd(room.id, room.peopleCount + 2)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                  title="Add occupants"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              room.hasFire
                ? 'bg-red-950/70 border-red-500/60 shadow-[0_0_15px_rgba(255,51,68,0.3)]'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-slate-400 font-hud text-[10px] uppercase flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Room Status
            </div>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xl font-hud font-bold ${
                  room.hasFire ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {room.tempCelsius}°C
              </span>
              <span
                className={`text-[10px] font-hud font-bold px-2 py-0.5 rounded ${
                  room.hasFire
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {room.hasFire ? 'FIRE ALARM' : 'NORMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Explicit Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Explicit Fire Trigger / Extinguish Button */}
          <button
            onClick={() => {
              onTriggerFire(room.id);
              onClose();
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-hud font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
              room.hasFire
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(255,51,68,0.5)] transform hover:scale-[1.01]'
            }`}
          >
            <Flame className="w-4 h-4 fill-current" />
            {room.hasFire ? 'EXTINGUISH FIRE IN THIS ROOM' : '🔥 TRIGGER FIRE HAZARD IN THIS ROOM'}
          </button>

          {/* Isolate Floor Button */}
          <button
            onClick={() => {
              onSelectFloor(String(room.floor));
              onClose();
            }}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-800 hover:border-cyan-500/40 rounded-xl font-hud text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            ISOLATE LEVEL {room.floor} VIEW
          </button>
        </div>
      </div>
    </div>
  );
};
