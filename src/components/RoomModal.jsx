import React from 'react';
import { Flame, Users, X, Layers, Thermometer } from 'lucide-react';

export const RoomModal = ({ room, onClose, onTriggerFire, onUpdateCrowd, onSelectFloor }) => {
  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 border border-slate-200 shadow-2xl flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                LEVEL {room.floor}
              </span>
              <span className="font-mono text-xs text-slate-400">[{room.camId}]</span>
            </div>
            <h2 className="font-extrabold text-base text-slate-900 mt-1">{room.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Metrics & Hazard Status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 font-bold text-[10px] uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Current Occupants
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-slate-800">{room.peopleCount}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateCrowd(room.id, Math.max(0, room.peopleCount - 2))}
                  className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center font-bold"
                  title="Reduce occupants"
                >
                  -
                </button>
                <button
                  onClick={() => onUpdateCrowd(room.id, room.peopleCount + 2)}
                  className="w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center font-bold"
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
                ? 'bg-red-50 border-red-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="text-slate-500 font-bold text-[10px] uppercase flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Room Status
            </div>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xl font-black ${
                  room.hasFire ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {room.tempCelsius}°C
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  room.hasFire
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-100 text-emerald-700'
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
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
              room.hasFire
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/25 transform hover:scale-[1.01]'
            }`}
          >
            <Flame className="w-4 h-4 fill-current" />
            {room.hasFire ? 'Extinguish Fire in this Room' : '🔥 Trigger Fire Hazard in this Room'}
          </button>

          {/* Isolate Floor Button */}
          <button
            onClick={() => {
              onSelectFloor(String(room.floor));
              onClose();
            }}
            className="w-full py-2 px-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Isolate Level {room.floor} View
          </button>
        </div>
      </div>
    </div>
  );
};
