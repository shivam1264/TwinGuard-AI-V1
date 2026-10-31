import React from 'react';
import {
  ZoomIn,
  RotateCcw,
  Layers,
  Crosshair,
  Maximize2
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
    <div
      className="absolute inset-0 pointer-events-none z-10 p-5 select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Top-Left: View Mode Selector Pills & Compass Rose ── */}
      <div className="absolute top-5 left-5 flex flex-col pointer-events-auto" style={{ gap: '12px' }}>
        {/* Pills: [Exterior] [Interior] [Top View] */}
        <div
          className="flex items-center"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '3px',
            gap: '2px',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          }}
        >
          <button
            onClick={() => onSetFacadeMode('FULL')}
            className="cursor-pointer transition-all"
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              fontSize: '11.5px',
              fontWeight: 700,
              background: facadeMode === 'FULL' ? '#2563eb' : 'transparent',
              color: facadeMode === 'FULL' ? '#ffffff' : '#64748b',
              border: 'none',
              boxShadow: facadeMode === 'FULL' ? '0 2px 6px -1px rgba(37, 99, 235, 0.4)' : 'none',
            }}
          >
            Exterior
          </button>

          <button
            onClick={() => onSetFacadeMode('CUTAWAY')}
            className="cursor-pointer transition-all"
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              fontSize: '11.5px',
              fontWeight: 700,
              background: facadeMode === 'CUTAWAY' ? '#2563eb' : 'transparent',
              color: facadeMode === 'CUTAWAY' ? '#ffffff' : '#64748b',
              border: 'none',
              boxShadow: facadeMode === 'CUTAWAY' ? '0 2px 6px -1px rgba(37, 99, 235, 0.4)' : 'none',
            }}
          >
            Interior
          </button>

          <button
            onClick={() => onResetView('TOP_DOWN')}
            className="cursor-pointer transition-all"
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              fontSize: '11.5px',
              fontWeight: 600,
              background: 'transparent',
              color: '#64748b',
              border: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >
            Top View
          </button>
        </div>

        {/* Dynamic Compass Rose */}
        <div
          className="flex items-center justify-center relative cursor-pointer transition-transform"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          }}
          onClick={() => onResetView('HERO_VIEW')}
          title="Reset Camera Orientation to North"
        >
          {/* Compass Dial Cardinal Points */}
          <span style={{ position: 'absolute', top: '3px', fontSize: '8px', fontWeight: 900, color: '#2563eb' }}>N</span>
          <span style={{ position: 'absolute', bottom: '3px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>S</span>
          <span style={{ position: 'absolute', left: '4px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>W</span>
          <span style={{ position: 'absolute', right: '4px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>E</span>

          {/* Rotating Compass Needle */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-cameraYaw}deg)` }}
          >
            <div style={{ width: '2px', height: '22px', background: 'linear-gradient(to top, #cbd5e1, #2563eb)', borderRadius: '999px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-3px',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '7px solid #2563eb',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side: Floating Vertical Level Stack [Layers] [L10]..[L1] ── */}
      <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 flex flex-col pointer-events-auto z-10" style={{ gap: '4px' }}>
        {/* Top Layers Icon Pill */}
        <button
          onClick={onToggleExploded}
          className="flex items-center justify-center cursor-pointer transition-all shadow-sm"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: activeFloorView === 'EXPLODED' ? '#2563eb' : '#ffffff',
            color: activeFloorView === 'EXPLODED' ? '#ffffff' : '#64748b',
            border: '1px solid #e2e8f0',
            marginBottom: '2px',
          }}
          title="Toggle Exploded BIM Stack"
        >
          <Layers style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Level Badges L10 to L1 */}
        {floorsList.map((fl) => {
          const isSelected = activeFloorView === String(fl);
          const hasFire = floorHasFire(fl);

          return (
            <button
              key={fl}
              onClick={() => onSelectFloor(isSelected ? 'ALL' : String(fl))}
              className="flex items-center justify-center relative cursor-pointer transition-all shadow-sm"
              style={{
                width: '32px',
                height: '28px',
                borderRadius: '8px',
                background: isSelected ? '#2563eb' : '#ffffff',
                color: isSelected ? '#ffffff' : '#475569',
                border: isSelected ? 'none' : '1px solid #e2e8f0',
                fontSize: '11px',
                fontWeight: isSelected ? 800 : 700,
                fontFamily: 'monospace',
                boxShadow: isSelected ? '0 2px 8px -1px rgba(37, 99, 235, 0.4)' : '0 1px 2px rgba(0,0,0,0.03)',
              }}
              title={`Level ${fl}${hasFire ? ' (Fire Incident)' : ''}`}
            >
              L{fl}
              {hasFire && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '1.5px solid #ffffff',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Bottom-Right: Viewport Mini Tool Dock ── */}
      <div
        className="absolute bottom-5 right-5 flex items-center pointer-events-auto"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '4px',
          gap: '3px',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        }}
      >
        <button
          onClick={onZoomIn}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '32px', height: '32px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Zoom In"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <ZoomIn style={{ width: '15px', height: '15px' }} />
        </button>

        <button
          onClick={() => onResetView('HERO_VIEW')}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '32px', height: '32px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Target / Center View"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <Crosshair style={{ width: '15px', height: '15px' }} />
        </button>

        <button
          onClick={() => onResetView('DEFAULT')}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '32px', height: '32px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Reset View"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <RotateCcw style={{ width: '14px', height: '14px' }} />
        </button>

        <button
          onClick={onToggleExploded}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: activeFloorView === 'EXPLODED' ? '#eff6ff' : 'transparent',
            color: activeFloorView === 'EXPLODED' ? '#2563eb' : '#475569',
            border: 'none',
          }}
          title="Toggle Exploded BIM View"
        >
          <Layers style={{ width: '15px', height: '15px' }} />
        </button>

        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '32px', height: '32px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Fullscreen View"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <Maximize2 style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  );
};
