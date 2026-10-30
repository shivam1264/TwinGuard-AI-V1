import React from 'react';
import {
  ZoomIn,
  ZoomOut,
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
    <div
      className="absolute inset-0 pointer-events-none z-10 p-5 select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top-Left: View Mode Selector Pills & Compass Rose */}
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
              background: facadeMode === 'FULL' ? 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)' : 'transparent',
              color: facadeMode === 'FULL' ? '#ffffff' : '#64748b',
              border: 'none',
              boxShadow: facadeMode === 'FULL' ? '0 2px 6px -1px rgba(13, 122, 95, 0.3)' : 'none',
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
              background: facadeMode === 'CUTAWAY' ? 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)' : 'transparent',
              color: facadeMode === 'CUTAWAY' ? '#ffffff' : '#64748b',
              border: 'none',
              boxShadow: facadeMode === 'CUTAWAY' ? '0 2px 6px -1px rgba(13, 122, 95, 0.3)' : 'none',
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
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0d7a5f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >
            Top View
          </button>
        </div>

        {/* Dynamic Compass Rose */}
        <div
          className="flex items-center justify-center relative cursor-pointer transition-transform"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          }}
          onClick={() => onResetView('HERO_VIEW')}
          title="Reset Camera Orientation to North"
        >
          {/* Compass Dial Cardinal Points */}
          <span style={{ position: 'absolute', top: '3px', fontSize: '8px', fontWeight: 900, color: '#0d7a5f' }}>N</span>
          <span style={{ position: 'absolute', bottom: '3px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>S</span>
          <span style={{ position: 'absolute', left: '4px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>W</span>
          <span style={{ position: 'absolute', right: '4px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>E</span>

          {/* Rotating Compass Needle */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-cameraYaw}deg)` }}
          >
            <div style={{ width: '2px', height: '24px', background: 'linear-gradient(to top, #cbd5e1, #0d7a5f)', borderRadius: '999px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-3px',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '7px solid #0d7a5f',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Floating Vertical Floor Badges [L10]..[L1] alongside the building */}
      <div className="absolute top-1/2 -translate-y-1/2 right-5 flex flex-col pointer-events-auto" style={{ gap: '5px' }}>
        {floorsList.map((fl) => {
          const isSelected = activeFloorView === String(fl);
          const hasFire = floorHasFire(fl);

          return (
            <button
              key={fl}
              onClick={() => onSelectFloor(isSelected ? 'ALL' : String(fl))}
              className="cursor-pointer transition-all flex items-center justify-center relative"
              style={{
                width: '36px',
                height: '32px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 800,
                background: isSelected ? 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)' : '#ffffff',
                color: isSelected ? '#ffffff' : (hasFire ? '#dc2626' : '#334155'),
                border: isSelected ? 'none' : (hasFire ? '2px solid #fecaca' : '1px solid #e2e8f0'),
                boxShadow: isSelected ? '0 4px 10px -2px rgba(13, 122, 95, 0.35)' : '0 2px 4px rgba(0,0,0,0.04)',
              }}
              title={`Level ${fl} ${hasFire ? '(FIRE ALARM)' : ''}`}
            >
              <span>L{fl}</span>
              {hasFire && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '2px solid #ffffff',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom-Right: Viewport Tools [ + ] [ - ] [ Crosshair ] [ Layers ] */}
      <div
        className="absolute bottom-5 right-5 flex items-center pointer-events-auto"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '4px',
          gap: '2px',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        }}
      >
        <button
          onClick={onZoomIn}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '34px', height: '34px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Zoom In"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d7a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <ZoomIn style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          onClick={onZoomOut}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '34px', height: '34px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Zoom Out"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d7a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <ZoomOut style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          onClick={() => onResetView('HERO_VIEW')}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{ width: '34px', height: '34px', borderRadius: '8px', color: '#475569', background: 'transparent', border: 'none' }}
          title="Hero Elevation View (H)"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d7a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <Crosshair style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          onClick={onToggleExploded}
          className="cursor-pointer transition-colors flex items-center justify-center"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: activeFloorView === 'EXPLODED' ? '#f0fdf4' : 'transparent',
            color: activeFloorView === 'EXPLODED' ? '#0d7a5f' : '#475569',
            border: 'none',
          }}
          title="Toggle Exploded BIM View"
          onMouseEnter={(e) => {
            if (activeFloorView !== 'EXPLODED') {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#0d7a5f';
            }
          }}
          onMouseLeave={(e) => {
            if (activeFloorView !== 'EXPLODED') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#475569';
            }
          }}
        >
          <Layers style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
};
