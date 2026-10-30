import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Layers,
  Crosshair
} from 'lucide-react';

export const ViewportOverlay = ({
  facadeMode = 'FULL',
  onSetFacadeMode,
  activeFloorView = 'ALL',
  onSelectFloor,
  cameraYaw = 0,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleExploded,
  rooms = []
}) => {
  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  // Check which floors have active fires
  const floorHasFire = (fl) => {
    return rooms.some(r => r.floor === fl && r.hasFire);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-5 select-none">
      {/* Top-Left: View Mode Selector Pills & Compass Rose (Matching Image 1) */}
      <div className="absolute top-5 left-5 flex flex-col gap-3.5 pointer-events-auto">
        {/* Pills: [Exterior] [Interior] [Top View] */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1.5 shadow-md flex items-center gap-1.5">
          <button
            onClick={() => onSetFacadeMode('FULL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              facadeMode === 'FULL'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Exterior
          </button>

          <button
            onClick={() => onSetFacadeMode('CUTAWAY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              facadeMode === 'CUTAWAY'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Interior
          </button>

          <button
            onClick={() => onResetView('TOP_DOWN')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            Top View
          </button>
        </div>

        {/* Dynamic Compass Rose (Matching Image 1) */}
        <div
          className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center relative cursor-pointer group hover:scale-105 transition-transform"
          onClick={() => onResetView('HERO_VIEW')}
          title="Reset Camera Orientation to North"
        >
          {/* Compass Dial Cardinal Points */}
          <span className="absolute top-1 text-[9px] font-black text-blue-600">N</span>
          <span className="absolute bottom-1 text-[8px] font-bold text-slate-400">S</span>
          <span className="absolute left-1.5 text-[8px] font-bold text-slate-400">W</span>
          <span className="absolute right-1.5 text-[8px] font-bold text-slate-400">E</span>

          {/* Rotating Compass Needle */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-cameraYaw}deg)` }}
          >
            <div className="w-0.5 h-7 bg-gradient-to-t from-slate-400 to-blue-600 rounded-full relative">
              <div className="absolute top-0 -left-[3.5px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Floating Vertical Floor Badges [L10]..[L1] alongside the building */}
      <div className="absolute top-1/2 -translate-y-1/2 right-5 flex flex-col gap-1.5 pointer-events-auto">
        {floorsList.map((fl) => {
          const isSelected = activeFloorView === String(fl);
          const hasFire = floorHasFire(fl);

          return (
            <button
              key={fl}
              onClick={() => onSelectFloor(isSelected ? 'ALL' : String(fl))}
              className={`w-10 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center relative transition-all shadow-sm ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-400/50'
                  : 'bg-white/95 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90'
              } ${hasFire ? 'border-red-500 ring-2 ring-red-400/50' : ''}`}
              title={`Level ${fl} ${hasFire ? '(FIRE ALARM)' : ''}`}
            >
              <span>L{fl}</span>
              {hasFire && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom-Right: Viewport Tools [ + ] [ - ] [ Crosshair ] [ Layers ] (Matching Image 1) */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1.5 shadow-md pointer-events-auto">
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Reset / Hero View */}
        <button
          onClick={() => onResetView('HERO_VIEW')}
          className="w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
          title="Hero Elevation View (H)"
        >
          <Crosshair className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Exploded BIM View Toggle */}
        <button
          onClick={onToggleExploded}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            activeFloorView === 'EXPLODED'
              ? 'bg-purple-100 text-purple-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle Exploded BIM View"
        >
          <Layers className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
