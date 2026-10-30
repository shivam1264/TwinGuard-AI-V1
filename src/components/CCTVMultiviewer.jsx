import React, { useEffect, useRef, useState } from 'react';
import { Video, Flame, Users, Maximize2, Minimize2, Eye, Layers, Upload } from 'lucide-react';

export const CCTVMultiviewer = React.memo(({ rooms, onTriggerFire, onUpdateCrowd, onFocusRoom }) => {
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
      // Throttle CCTV canvas rendering to 15 FPS (typical security camera rate)
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

        ctx.fillStyle = room.hasFire ? '#2a0808' : '#0a101d';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = room.hasFire ? 'rgba(239, 68, 68, 0.4)' : 'rgba(13, 122, 95, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        // Perspective corridor lines
        ctx.beginPath();
        for (let i = 25; i < w - 20; i += 32) {
          ctx.moveTo(i, h - 10);
          ctx.lineTo(w / 2 + (i - w / 2) * 0.4, 32);
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
          grad.addColorStop(0, 'rgba(255, 230, 0, 0.9)');
          grad.addColorStop(0.3, 'rgba(255, 80, 0, 0.7)');
          grad.addColorStop(0.7, 'rgba(200, 20, 0, 0.3)');
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
      className="flex flex-col h-full select-none"
      style={{
        gap: '12px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'rgba(13, 122, 95, 0.2)',
              color: '#10b981',
            }}
          >
            <Video style={{ width: '14px', height: '14px' }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em' }}>
            CCTV AI FEEDS ({displayedRooms.length} CAMS)
          </span>
        </div>
        {selectedCam && (
          <button
            onClick={() => setSelectedCam(null)}
            className="flex items-center cursor-pointer transition-colors"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#10b981',
              background: 'rgba(13, 122, 95, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              padding: '3px 8px',
              gap: '4px',
            }}
          >
            <Minimize2 style={{ width: '12px', height: '12px' }} />
            <span>Grid View</span>
          </button>
        )}
      </div>

      {/* Floor Filter Tabs */}
      <div
        className="flex items-center overflow-x-auto"
        style={{
          background: '#090d16',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <Layers style={{ width: '12px', height: '12px', color: '#10b981' }} /> FLOOR:
        </span>
        {['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((fl) => {
          const isActive = selectedFloor === fl;
          return (
            <button
              key={fl}
              onClick={() => {
                setSelectedFloor(fl);
                setSelectedCam(null);
              }}
              className="cursor-pointer transition-all flex-shrink-0"
              style={{
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: isActive ? 800 : 600,
                background: isActive ? '#0d7a5f' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                border: 'none',
              }}
            >
              {fl === 'ALL' ? 'ALL' : `L${fl}`}
            </button>
          );
        })}
      </div>

      {/* Camera Grid */}
      <div
        className={`grid ${
          selectedCam ? 'grid-cols-1' : 'grid-cols-2'
        } flex-1 overflow-y-auto`}
        style={{ gap: '10px' }}
      >
        {displayedRooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col overflow-hidden transition-all"
            style={{
              borderRadius: '12px',
              border: room.hasFire ? '1px solid #ef4444' : '1px solid #1e293b',
              background: '#0c1322',
              boxShadow: room.hasFire ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
            }}
          >
            {/* Camera Canvas Feed */}
            <div className="relative flex-1 bg-black" style={{ minHeight: '110px' }}>
              <canvas
                ref={(el) => (canvasRefs.current[room.id] = el)}
                width={220}
                height={120}
                className="w-full h-full object-cover"
              />

              {/* Fire Warning Banner */}
              {room.hasFire && (
                <div
                  className="absolute flex items-center justify-between"
                  style={{
                    bottom: '6px',
                    left: '6px',
                    right: '6px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  <span className="flex items-center" style={{ gap: '4px' }}>
                    <Flame style={{ width: '12px', height: '12px', fill: 'white' }} /> FIRE DETECTED!
                  </span>
                  <span>{room.tempCelsius}°C</span>
                </div>
              )}
            </div>

            {/* Camera Controls & Info Footer */}
            <div
              className="flex flex-col"
              style={{
                padding: '8px 10px',
                background: '#090d16',
                borderTop: '1px solid #1e293b',
                gap: '6px',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="truncate" style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>
                  {room.name}
                </div>
                <div className="flex items-center" style={{ gap: '3px', fontSize: '10px', color: '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>
                  <Users style={{ width: '11px', height: '11px' }} /> {room.peopleCount}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid #131d2e' }}>
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <button
                    onClick={() => onTriggerFire(room.id)}
                    title={room.hasFire ? 'Fire Video Feed Active' : 'Switch to Fire Video Stream'}
                    className="flex items-center cursor-pointer transition-colors"
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      gap: '4px',
                      background: room.hasFire ? '#dc2626' : '#1e293b',
                      color: room.hasFire ? '#ffffff' : '#94a3b8',
                      border: 'none',
                    }}
                  >
                    <Flame style={{ width: '11px', height: '11px', fill: room.hasFire ? 'white' : 'none' }} />
                    <span>{room.hasFire ? 'FIRE FEED' : 'TRIGGER FIRE'}</span>
                  </button>

                  <input
                    type="file"
                    accept="video/*"
                    ref={(el) => (fileInputRefs.current[room.id] = el)}
                    className="hidden"
                    onChange={(e) => handleVideoUpload(room.id, e)}
                  />
                  <button
                    onClick={() => fileInputRefs.current[room.id]?.click()}
                    title="Upload Fire CCTV Video"
                    className="flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      color: '#94a3b8',
                      border: 'none',
                    }}
                  >
                    <Upload style={{ width: '11px', height: '11px' }} />
                  </button>
                </div>

                <div className="flex items-center" style={{ gap: '4px' }}>
                  <button
                    onClick={() => onFocusRoom(room.id)}
                    title="Focus 3D View on this Room"
                    className="flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      color: '#94a3b8',
                      border: 'none',
                    }}
                  >
                    <Eye style={{ width: '12px', height: '12px' }} />
                  </button>

                  {!selectedCam && (
                    <button
                      onClick={() => setSelectedCam(room.id)}
                      title="Maximize Camera"
                      className="flex items-center justify-center cursor-pointer transition-colors"
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        background: '#1e293b',
                        color: '#94a3b8',
                        border: 'none',
                      }}
                    >
                      <Maximize2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
