import React, { useEffect, useRef, useState } from 'react';
import { Video, Flame, Users, Maximize2, Minimize2, Eye, Layers, Upload, ArrowLeft } from 'lucide-react';

export const CCTVMultiviewer = React.memo(({ rooms = [], onTriggerFire, onUpdateCrowd, onFocusRoom }) => {
  const [selectedCam, setSelectedCam] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const canvasRefs = useRef({});
  const fileInputRefs = useRef({});

  // Canvas-based real-time video simulation for each CCTV camera
  useEffect(() => {
    let animId;
    let frame = 0;
    let lastRenderTime = 0;

    const renderCCTVFeeds = (timestamp) => {
      // Throttle CCTV canvas rendering to 15 FPS
      if (timestamp - lastRenderTime < 66) {
        animId = requestAnimationFrame(renderCCTVFeeds);
        return;
      }
      lastRenderTime = timestamp;
      frame++;

      // Only render visible cameras according to floor filter
      const activeRooms = selectedFloor === 'ALL'
        ? rooms.slice(0, 10) // When ALL is selected, show top 10 cameras to prevent lagging
        : rooms.filter(r => String(r.floor) === selectedFloor);

      activeRooms.forEach((room) => {
        const canvas = canvasRefs.current[room.id];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = room.hasFire ? '#260a0a' : '#0c1424';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = room.hasFire ? 'rgba(239, 68, 68, 0.45)' : 'rgba(13, 122, 95, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        // Perspective corridor lines
        ctx.beginPath();
        for (let i = 25; i < w - 20; i += 32) {
          ctx.moveTo(i, h - 10);
          ctx.lineTo(w / 2 + (i - w / 2) * 0.4, 30);
        }
        ctx.stroke();

        // Draw simulated occupants
        const peopleCount = room.peopleCount || 0;
        const seed = room.id.charCodeAt(3) || 1;

        for (let i = 0; i < peopleCount; i++) {
          const speedFactor = (i * 0.12 + 0.35);
          const px = 25 + ((Math.sin(frame * 0.02 * speedFactor + i * 2 + seed) + 1) / 2) * (w - 50);
          const py = 35 + ((Math.cos(frame * 0.015 * speedFactor + i * 1.5 + seed) + 1) / 2) * (h - 65);

          ctx.fillStyle = room.hasFire ? '#ffaa00' : '#10b981';
          ctx.beginPath();
          ctx.arc(px, py - 6, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillRect(px - 2.5, py - 2.5, 5, 9);

          // AI Bounding Box
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.0;
          ctx.strokeRect(px - 6, py - 11, 12, 19);

          ctx.fillStyle = '#10b981';
          ctx.font = '6px "JetBrains Mono", monospace';
          ctx.fillText(`P${i + 1}`, px - 6, py - 13);
        }

        // Draw Fire Effect if active in this camera feed
        if (room.hasFire) {
          const fireX = w / 2 + Math.sin(frame * 0.05) * 12;
          const fireY = h / 2 + 5;

          const grad = ctx.createRadialGradient(fireX, fireY, 4, fireX, fireY, 45);
          grad.addColorStop(0, 'rgba(255, 230, 0, 0.95)');
          grad.addColorStop(0.3, 'rgba(255, 80, 0, 0.75)');
          grad.addColorStop(0.7, 'rgba(200, 20, 0, 0.35)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fireX, fireY, 45, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(fireX - 32, fireY - 26, 64, 48);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(fireX - 32, fireY - 38, 64, 11);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px sans-serif';
          ctx.fillText('🔥 FIRE: 99.4%', fireX - 28, fireY - 30);
        }

        // CCTV HUD Overlays
        const isBlink = Math.floor(frame / 25) % 2 === 0;
        ctx.fillStyle = isBlink ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(12, 12, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '7px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`REC • L${room.floor} • ${room.camId}`, 20, 14);

        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 1);
        }
      });

      animId = requestAnimationFrame(renderCCTVFeeds);
    };

    animId = requestAnimationFrame(renderCCTVFeeds);
    return () => cancelAnimationFrame(animId);
  }, [rooms, selectedFloor]);

  // Handle Video Upload (Simulated Fire Detection Video Ingestion)
  const handleVideoUpload = (roomId, event) => {
    const file = event.target.files?.[0];
    if (file) {
      onTriggerFire(roomId);
    }
  };

  const floorFilteredRooms = selectedFloor === 'ALL'
    ? rooms
    : rooms.filter((r) => String(r.floor) === selectedFloor);

  const displayedRooms = selectedCam
    ? floorFilteredRooms.filter((r) => r.id === selectedCam)
    : floorFilteredRooms;

  return (
    <div
      className="flex flex-col select-none no-scrollbar"
      style={{
        gap: '16px',
        padding: '4px 6px 16px 6px',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#1e293b',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* 1. TOP CONTROLS & FLOOR SELECTOR (Light Theme Capsule) */}
      <div
        className="flex items-center justify-between"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '8px 14px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Left: Floor Selector Strip */}
        <div className="flex items-center" style={{ gap: '6px' }}>
          <div className="flex items-center" style={{ gap: '5px', paddingRight: '8px', borderRight: '1px solid #e2e8f0' }}>
            <Layers style={{ width: '13px', height: '13px', color: '#0d7a5f' }} />
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Floor:
            </span>
          </div>

          <div className="flex items-center overflow-x-auto no-scrollbar" style={{ gap: '4px' }}>
            {['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((fl) => {
              const isActive = selectedFloor === fl;
              return (
                <button
                  key={fl}
                  onClick={() => {
                    setSelectedFloor(fl);
                    setSelectedCam(null);
                  }}
                  className="cursor-pointer transition-all shrink-0"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: isActive ? 800 : 600,
                    background: isActive ? 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)' : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    border: 'none',
                    boxShadow: isActive ? '0 2px 6px -1px rgba(13, 122, 95, 0.3)' : 'none',
                  }}
                >
                  {fl === 'ALL' ? 'ALL FLOORS' : `L${fl}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Cam Count & View Switcher */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#0d7a5f',
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              padding: '3px 10px',
              borderRadius: '8px',
            }}
          >
            {displayedRooms.length} Cameras Active
          </span>

          {selectedCam && (
            <button
              onClick={() => setSelectedCam(null)}
              className="flex items-center cursor-pointer transition-colors"
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                fontWeight: 600,
                color: '#334155',
                gap: '5px',
              }}
            >
              <ArrowLeft style={{ width: '12px', height: '12px' }} />
              <span>Back to Grid</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CAMERA GRID (Clean Modern SaaS Cards in Light Theme) */}
      <div
        className={`grid ${
          selectedCam ? 'grid-cols-1' : 'grid-cols-2'
        }`}
        style={{ gap: '14px' }}
      >
        {displayedRooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col transition-all"
            style={{
              background: '#ffffff',
              border: room.hasFire ? '2px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: '14px',
              boxShadow: room.hasFire ? '0 4px 20px -2px rgba(239, 68, 68, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Viewport Canvas Screen */}
            <div className="relative bg-black" style={{ height: selectedCam ? '340px' : '160px', overflow: 'hidden' }}>
              <canvas
                ref={(el) => (canvasRefs.current[room.id] = el)}
                width={300}
                height={160}
                className="w-full h-full object-cover"
              />

              {/* Fire Warning Pill */}
              {room.hasFire && (
                <div
                  className="absolute flex items-center justify-between"
                  style={{
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    background: 'rgba(220, 38, 38, 0.95)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="flex items-center" style={{ gap: '5px' }}>
                    <Flame style={{ width: '13px', height: '13px', fill: 'white' }} /> FIRE ALARM DETECTED
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>{room.tempCelsius}°C</span>
                </div>
              )}
            </div>

            {/* Card Footer (Clean Light SaaS Card) */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '10px 14px',
                background: '#ffffff',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              {/* Room Name & Occupants */}
              <div className="flex items-center min-w-0" style={{ gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }} className="truncate">
                  {room.name}
                </span>
                <span
                  className="flex items-center shrink-0"
                  style={{
                    gap: '4px',
                    fontSize: '10.5px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#0d7a5f',
                    background: '#f0fdf4',
                    border: '1px solid #d1fae5',
                    padding: '2px 7px',
                    borderRadius: '6px',
                  }}
                >
                  <Users style={{ width: '11px', height: '11px' }} />
                  <span>{room.peopleCount}</span>
                </span>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center shrink-0" style={{ gap: '6px' }}>
                {/* Fire Simulator Trigger */}
                <button
                  onClick={() => onTriggerFire(room.id)}
                  title={room.hasFire ? 'Extinguish Fire in this feed' : 'Simulate Fire in this feed'}
                  className="flex items-center cursor-pointer transition-all"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    gap: '4px',
                    background: room.hasFire ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#f8fafc',
                    color: room.hasFire ? '#ffffff' : '#64748b',
                    border: room.hasFire ? 'none' : '1px solid #e2e8f0',
                    boxShadow: room.hasFire ? '0 2px 6px -1px rgba(239, 68, 68, 0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!room.hasFire) {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.color = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!room.hasFire) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <Flame style={{ width: '12px', height: '12px', fill: room.hasFire ? 'white' : 'none' }} />
                  <span>{room.hasFire ? 'FIRE FEED' : 'TRIGGER FIRE'}</span>
                </button>

                {/* Video Upload Input */}
                <input
                  type="file"
                  accept="video/*"
                  ref={(el) => (fileInputRefs.current[room.id] = el)}
                  className="hidden"
                  onChange={(e) => handleVideoUpload(room.id, e)}
                />
                <button
                  onClick={() => fileInputRefs.current[room.id]?.click()}
                  title="Upload Video Stream"
                  className="flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <Upload style={{ width: '12px', height: '12px' }} />
                </button>

                {/* Focus in 3D */}
                <button
                  onClick={() => onFocusRoom(room.id)}
                  title="Locate Room in 3D Digital Twin"
                  className="flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#0d7a5f'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <Eye style={{ width: '13px', height: '13px' }} />
                </button>

                {/* Maximize Single Cam */}
                {!selectedCam && (
                  <button
                    onClick={() => setSelectedCam(room.id)}
                    title="Maximize Camera"
                    className="flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <Maximize2 style={{ width: '12px', height: '12px' }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
