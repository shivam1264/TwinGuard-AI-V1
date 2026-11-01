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
  theme = 'dark',
  facadeMode = 'FULL',
  onSetFacadeMode,
  activeFloorView = 'ALL',
  activeCameraPreset = 'HERO_VIEW',
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
  rooms = [],
  sceneManager = null,
  onHazardEvent = null
}) => {
  const isDark = theme === 'dark';
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
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col pointer-events-auto gap-2 sm:gap-3 max-w-[calc(100vw-24px)]">
        {/* Pills: [Exterior] [Interior] [Top View] [Exploded] */}
        <div
          className="flex flex-wrap items-center backdrop-blur-md p-1 rounded-xl gap-1 transition-colors max-w-full"
          style={{
            background: isDark ? 'rgba(11, 22, 44, 0.85)' : 'rgba(255, 255, 255, 0.95)',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #cbd5e1',
            boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.5)' : '0 4px 16px rgba(0, 0, 0, 0.08)'
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
              background: (facadeMode === 'FULL' && activeFloorView !== 'EXPLODED' && activeCameraPreset !== 'TOP_DOWN')
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: (facadeMode === 'FULL' && activeFloorView !== 'EXPLODED' && activeCameraPreset !== 'TOP_DOWN')
                ? '#ffffff'
                : (isDark ? '#94a3b8' : '#475569'),
              boxShadow: (facadeMode === 'FULL' && activeFloorView !== 'EXPLODED' && activeCameraPreset !== 'TOP_DOWN')
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
              background: (facadeMode === 'CUTAWAY' && activeFloorView !== 'EXPLODED' && activeCameraPreset !== 'TOP_DOWN')
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: (facadeMode === 'CUTAWAY' && activeFloorView !== 'EXPLODED' && activeCameraPreset !== 'TOP_DOWN')
                ? '#ffffff'
                : (isDark ? '#94a3b8' : '#475569'),
              boxShadow: (facadeMode === 'CUTAWAY' && activeFloorView !== 'EXPLODED' && activeCameraPreset !== 'TOP_DOWN')
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
            className="cursor-pointer transition-all px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: (activeCameraPreset === 'TOP_DOWN' && activeFloorView !== 'EXPLODED')
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: (activeCameraPreset === 'TOP_DOWN' && activeFloorView !== 'EXPLODED')
                ? '#ffffff'
                : (isDark ? '#94a3b8' : '#475569'),
              boxShadow: (activeCameraPreset === 'TOP_DOWN' && activeFloorView !== 'EXPLODED')
                ? '0 0 10px rgba(37, 99, 235, 0.6)'
                : 'none'
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
                : (isDark ? '#94a3b8' : '#475569'),
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
            background: isDark ? 'rgba(11, 22, 44, 0.85)' : 'rgba(255, 255, 255, 0.95)',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #cbd5e1',
            boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          onClick={() => onResetView('HERO_VIEW')}
          title="Reset Camera Orientation to North"
        >
          {/* Compass Dial Cardinal Points */}
          <span style={{ position: 'absolute', top: '3px', fontSize: '8px', fontWeight: 900, color: isDark ? '#38bdf8' : '#0284c7' }}>N</span>
          <span style={{ position: 'absolute', bottom: '3px', fontSize: '7px', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8' }}>S</span>
          <span style={{ position: 'absolute', left: '4px', fontSize: '7px', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8' }}>W</span>
          <span style={{ position: 'absolute', right: '4px', fontSize: '7px', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8' }}>E</span>

          {/* Rotating Compass Needle */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-cameraYaw}deg)` }}
          >
            <div style={{ width: '2px', height: '22px', background: isDark ? 'linear-gradient(to top, #475569, #38bdf8)' : 'linear-gradient(to top, #94a3b8, #0284c7)', borderRadius: '999px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-3px',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: `7px solid ${isDark ? '#38bdf8' : '#0284c7'}`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom-Left: Floating Building Metadata Card (Shifted to Bottom) ── */}
      <div
        className="absolute bottom-4 left-4 hidden sm:flex flex-col p-3 rounded-2xl backdrop-blur-md gap-2 w-48 pointer-events-auto transition-colors"
        style={{
          background: isDark ? 'rgba(11, 22, 44, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.5)' : '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>10-Storey Tower</div>
            <div className="text-[9.5px] text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Digital Twin (Live)
            </div>
          </div>
        </div>

        <div className={`flex flex-col gap-1 text-[10.5px] font-mono pt-1 border-t ${
          isDark ? 'text-slate-300 border-sky-500/15' : 'text-slate-700 border-slate-200'
        }`}>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Floors</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>10</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Rooms</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>100</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Gross Area</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>25,400 m²</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Occupancy</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>190</span>
          </div>
        </div>

        {onOpenBuildingInfo && (
          <button
            onClick={onOpenBuildingInfo}
            className="text-[10.5px] font-bold text-sky-500 hover:text-sky-600 text-left pt-1 flex items-center gap-1 cursor-pointer"
          >
            <span>View Building Info</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* ── Left-Side: Vertical Floor Stack Selector [Exploded] [L10..L1] [ALL] (Transferred to Left) ── */}
      <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto z-10 gap-1 backdrop-blur-md px-1 sm:px-1.5 py-1.5 sm:py-2 rounded-2xl border shadow-2xl transition-colors max-h-[68vh] overflow-y-auto no-scrollbar ${
        isDark ? 'border-sky-500/25 bg-slate-950/85 text-slate-300' : 'border-slate-300 bg-white/95 text-slate-700'
      }`}>
        {/* Exploded BIM Stack Pill at top */}
        <button
          onClick={onToggleExploded}
          className="flex items-center justify-center cursor-pointer transition-all shadow-sm w-7 h-7 rounded-lg mb-1"
          style={{
            background: activeFloorView === 'EXPLODED' ? '#2563eb' : (isDark ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9'),
            color: activeFloorView === 'EXPLODED' ? '#ffffff' : (isDark ? '#38bdf8' : '#0284c7'),
            border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #cbd5e1'
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
                  : (isDark ? '#94a3b8' : '#475569'),
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
            background: activeFloorView === 'ALL'
              ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
              : (isDark ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9'),
            color: activeFloorView === 'ALL'
              ? '#ffffff'
              : (isDark ? '#94a3b8' : '#475569'),
            border: activeFloorView === 'ALL'
              ? '1px solid #60a5fa'
              : (isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #cbd5e1'),
            boxShadow: activeFloorView === 'ALL' ? '0 0 10px rgba(37, 99, 235, 0.6)' : 'none'
          }}
          title="View All Floors (Full Building)"
        >
          ALL
        </button>
      </div>

      {/* ── Bottom-Right: Viewport Navigation [Zoom In, Zoom Out, Left, Right, Forward, Back] ── */}
      <div className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center pointer-events-auto gap-0.5 sm:gap-1 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'border-sky-500/25 bg-slate-950/85 text-slate-300' : 'border-slate-300 bg-white/95 text-slate-700'
      }`}>
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-sky-500/15' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Zoom In"
        >
          <ZoomIn className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-sky-500/15' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
        </button>

        <div className={`w-px h-5 mx-1 ${isDark ? 'bg-sky-500/20' : 'bg-slate-200'}`} />

        {/* Left */}
        <button
          onClick={onPanLeft}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-sky-500/15' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Move Left"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Right */}
        <button
          onClick={onPanRight}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-sky-500/15' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Move Right"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Forward */}
        <button
          onClick={onMoveForward}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-sky-500/15' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Move Forward"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Back / Backward */}
        <button
          onClick={onMoveBackward}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white hover:bg-sky-500/15' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Move Back"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
