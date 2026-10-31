import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Layers,
  Crosshair,
  Maximize2,
  Building,
  Info
} from 'lucide-react';

export const ViewportOverlay = ({
  facadeMode = 'FULL',
  onSetFacadeMode,
  activeFloorView = 'ALL',
  onSelectFloor,
  cameraYaw = 0,
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onMoveForward,
  onMoveBackward,
  onResetView,
  onToggleExploded,
  onOpenBuildingInfo,
  onToggleFullscreen,
  rooms = []
}) => {
  // L1 to L10 in ascending natural sequence for horizontal layout (or reverse if desired)
  const floorsList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  // Check which floors have active fires
  const floorHasFire = (fl) => {
    return rooms.some(r => r.floor === fl && r.hasFire);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 p-4 sm:p-5 select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Top-Left: View Mode Selector Pills & Compass Rose (Matching Image 2) ── */}
      <div className="absolute top-4 left-4 flex flex-col pointer-events-auto gap-3">
        {/* Pills: [Exterior] [Interior] [Top View] [Exploded] */}
        <div
          className="flex items-center backdrop-blur-md p-1 rounded-xl gap-1"
          style={{
            background: 'rgba(11, 22, 44, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* 1. Exterior Mode */}
          <button
            onClick={() => {
              onSetFacadeMode('FULL');
              if (activeFloorView === 'EXPLODED') {
                onSelectFloor('ALL');
              }
              onResetView('HERO_VIEW');
            }}
            className="cursor-pointer transition-all px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: facadeMode === 'FULL' && activeFloorView !== 'EXPLODED'
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: facadeMode === 'FULL' && activeFloorView !== 'EXPLODED'
                ? '#ffffff'
                : '#94a3b8',
              boxShadow: facadeMode === 'FULL' && activeFloorView !== 'EXPLODED'
                ? '0 0 10px rgba(37, 99, 235, 0.6)'
                : 'none'
            }}
          >
            Exterior
          </button>

          {/* 2. Interior Mode */}
          <button
            onClick={() => {
              onSetFacadeMode('CUTAWAY');
              if (activeFloorView === 'EXPLODED') {
                onSelectFloor('ALL');
              }
              onResetView('CUTAWAY_VIEW');
            }}
            className="cursor-pointer transition-all px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: facadeMode === 'CUTAWAY' && activeFloorView !== 'EXPLODED'
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: facadeMode === 'CUTAWAY' && activeFloorView !== 'EXPLODED'
                ? '#ffffff'
                : '#94a3b8',
              boxShadow: facadeMode === 'CUTAWAY' && activeFloorView !== 'EXPLODED'
                ? '0 0 10px rgba(37, 99, 235, 0.6)'
                : 'none'
            }}
          >
            Interior
          </button>

          {/* 3. Top View Mode */}
          <button
            onClick={() => {
              onSetFacadeMode('CUTAWAY');
              onResetView('TOP_DOWN');
            }}
            className="cursor-pointer transition-all px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
            style={{
              background: 'transparent',
              color: '#94a3b8'
            }}
          >
            Top View
          </button>

          {/* 4. Exploded BIM Mode */}
          <button
            onClick={() => {
              onSetFacadeMode('CUTAWAY');
              onToggleExploded();
            }}
            className="cursor-pointer transition-all px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: activeFloorView === 'EXPLODED'
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: activeFloorView === 'EXPLODED'
                ? '#ffffff'
                : '#94a3b8',
              boxShadow: activeFloorView === 'EXPLODED'
                ? '0 0 10px rgba(37, 99, 235, 0.6)'
                : 'none'
            }}
          >
            Exploded
          </button>
        </div>

        {/* Dynamic Compass Rose (Matching Image 2) */}
        <div
          className="flex items-center justify-center relative cursor-pointer transition-transform backdrop-blur-md"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(11, 22, 44, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => onResetView('HERO_VIEW')}
          title="Reset Camera Orientation to North"
        >
          {/* Compass Dial Cardinal Points */}
          <span style={{ position: 'absolute', top: '3px', fontSize: '8px', fontWeight: 900, color: '#38bdf8' }}>N</span>
          <span style={{ position: 'absolute', bottom: '3px', fontSize: '7px', fontWeight: 700, color: '#64748b' }}>S</span>
          <span style={{ position: 'absolute', left: '4px', fontSize: '7px', fontWeight: 700, color: '#64748b' }}>W</span>
          <span style={{ position: 'absolute', right: '4px', fontSize: '7px', fontWeight: 700, color: '#64748b' }}>E</span>

          {/* Rotating Compass Needle */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-cameraYaw}deg)` }}
          >
            <div style={{ width: '2px', height: '22px', background: 'linear-gradient(to top, #475569, #38bdf8)', borderRadius: '999px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-3px',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '7px solid #38bdf8'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom-Left: Floating Building Metadata Card (Shifted to Bottom) ── */}
      <div
        className="absolute bottom-4 left-4 hidden sm:flex flex-col p-3 rounded-2xl backdrop-blur-md gap-2 w-48 pointer-events-auto"
        style={{
          background: 'rgba(11, 22, 44, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">10-Storey Tower</div>
            <div className="text-[9.5px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Digital Twin (Live)
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-[10.5px] text-slate-300 font-mono pt-1 border-t border-sky-500/15">
          <div className="flex justify-between">
            <span className="text-slate-400">Floors</span>
            <span className="font-bold text-white">10</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rooms</span>
            <span className="font-bold text-white">100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Gross Area</span>
            <span className="font-bold text-white">25,400 m²</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Occupancy</span>
            <span className="font-bold text-white">190</span>
          </div>
        </div>

        {onOpenBuildingInfo && (
          <button
            onClick={onOpenBuildingInfo}
            className="text-[10.5px] font-bold text-sky-400 hover:text-sky-300 text-left pt-1 flex items-center gap-1 cursor-pointer"
          >
            <span>View Building Info</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* ── Left-Side: Vertical Floor Stack Selector [Exploded] [L10..L1] [ALL] (Transferred to Left) ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto z-10 gap-1 backdrop-blur-md px-1.5 py-2 rounded-2xl border border-sky-500/25 bg-slate-950/85 shadow-2xl">
        {/* Exploded BIM Stack Pill at top */}
        <button
          onClick={onToggleExploded}
          className="flex items-center justify-center cursor-pointer transition-all shadow-sm w-7 h-7 rounded-lg mb-1"
          style={{
            background: activeFloorView === 'EXPLODED' ? '#2563eb' : 'rgba(15, 23, 42, 0.8)',
            color: activeFloorView === 'EXPLODED' ? '#ffffff' : '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}
          title="Toggle Exploded BIM Stack"
        >
          <Layers style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Vertical Floor Buttons: L10 down to L1 */}
        {floorsList.map((fl) => {
          const isSelected = activeFloorView === fl;
          const isFire = floorHasFire(fl);

          return (
            <button
              key={fl}
              onClick={() => onSelectFloor(fl)}
              className="flex items-center justify-center relative cursor-pointer transition-all w-7 h-6 rounded-md"
              style={{
                fontSize: '10px',
                fontWeight: isSelected ? 900 : 700,
                fontFamily: 'monospace',
                background: isSelected
                  ? '#2563eb'
                  : isFire
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'transparent',
                color: isSelected
                  ? '#ffffff'
                  : isFire
                  ? '#ef4444'
                  : '#94a3b8',
                border: isSelected
                  ? '1px solid #60a5fa'
                  : isFire
                  ? '1px solid rgba(239, 68, 68, 0.6)'
                  : '1px solid transparent',
                boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.6)' : 'none'
              }}
              title={`Isolate Level ${fl}`}
            >
              L{fl}
              {isFire && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          );
        })}

        {/* ALL Floors Pill at bottom */}
        <button
          onClick={() => onSelectFloor('ALL')}
          className="flex items-center justify-center cursor-pointer transition-all w-7 h-6 rounded-md text-[9px] font-black tracking-wider mt-1"
          style={{
            background: activeFloorView === 'ALL' ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'rgba(15, 23, 42, 0.8)',
            color: activeFloorView === 'ALL' ? '#ffffff' : '#94a3b8',
            border: activeFloorView === 'ALL' ? '1px solid #60a5fa' : '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: activeFloorView === 'ALL' ? '0 0 10px rgba(37, 99, 235, 0.6)' : 'none'
          }}
          title="View All Floors (Full Building)"
        >
          ALL
        </button>
      </div>

      {/* ── Bottom-Right: Viewport Navigation [Zoom In, Zoom Out, Left, Right, Forward, Back] ── */}
      <div className="absolute bottom-4 right-4 flex items-center pointer-events-auto gap-1 backdrop-blur-md p-1.5 rounded-2xl border border-sky-500/25 bg-slate-950/85 shadow-2xl">
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-500/15 transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-sky-400" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-500/15 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-sky-400" />
        </button>

        <div className="w-px h-5 bg-sky-500/20 mx-1" />

        {/* Left */}
        <button
          onClick={onPanLeft}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-500/15 transition-all cursor-pointer"
          title="Move Left"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Right */}
        <button
          onClick={onPanRight}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-500/15 transition-all cursor-pointer"
          title="Move Right"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Forward */}
        <button
          onClick={onMoveForward}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-500/15 transition-all cursor-pointer"
          title="Move Forward"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Back / Backward */}
        <button
          onClick={onMoveBackward}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-sky-500/15 transition-all cursor-pointer"
          title="Move Back"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
