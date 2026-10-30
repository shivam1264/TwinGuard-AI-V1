import React, { useEffect, useRef, useState } from 'react';
import { Video, Flame, Users, AlertTriangle, Maximize2, Minimize2, Eye, Layers, Upload, PlayCircle } from 'lucide-react';

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

        ctx.fillStyle = room.hasFire ? '#2a0808' : '#070f1e';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = room.hasFire ? 'rgba(255, 60, 60, 0.4)' : 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, w - 20, h - 20);

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

          ctx.fillStyle = room.hasFire ? '#ffaa00' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(px, py - 6, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillRect(px - 2.5, py - 2.5, 5, 9);

          // AI Bounding Box
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 1.0;
          ctx.strokeRect(px - 6, py - 11, 12, 19);

          ctx.fillStyle = '#00ff88';
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

          ctx.strokeStyle = '#ff3344';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(fireX - 32, fireY - 26, 64, 48);

          ctx.fillStyle = '#ff3344';
          ctx.fillRect(fireX - 32, fireY - 38, 64, 11);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px "Chakra Petch", sans-serif';
          ctx.fillText('🔥 FIRE: 99.4%', fireX - 28, fireY - 30);
        }

        // CCTV HUD Overlays
        const isBlink = Math.floor(frame / 25) % 2 === 0;
        ctx.fillStyle = isBlink ? '#ff3344' : '#551111';
        ctx.beginPath();
        ctx.arc(10, 10, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f1f5f9';
        ctx.fillText(`REC • L${room.floor} • ${room.camId}`, 18, 12);

        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
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
      // Ingest video and automatically trigger AI Fire detection
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
    <div className="glass-panel rounded-xl p-3 flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-1.5">
          <Video className="w-4 h-4 text-cyan-400" />
          <span className="font-hud font-bold text-xs tracking-wide text-cyan-300">
            CCTV AI FEEDS ({displayedRooms.length} CAMS)
          </span>
        </div>
        {selectedCam && (
          <button
            onClick={() => setSelectedCam(null)}
            className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30"
          >
            <Minimize2 className="w-2.5 h-2.5" /> Grid
          </button>
        )}
      </div>

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[10px] font-hud overflow-x-auto">
        <span className="text-slate-400 px-1 flex items-center gap-1 shrink-0">
          <Layers className="w-2.5 h-2.5 text-cyan-400" /> FLOOR:
        </span>
        {['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((fl) => (
          <button
            key={fl}
            onClick={() => {
              setSelectedFloor(fl);
              setSelectedCam(null);
            }}
            className={`px-1.5 py-0.5 rounded transition-all text-center shrink-0 ${
              selectedFloor === fl
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {fl === 'ALL' ? 'ALL' : `L${fl}`}
          </button>
        ))}
      </div>

      {/* Camera Grid */}
      <div
        className={`grid ${
          selectedCam ? 'grid-cols-1' : 'grid-cols-2'
        } gap-2 flex-1 overflow-y-auto pr-0.5`}
      >
        {displayedRooms.map((room) => (
          <div
            key={room.id}
            className={`relative rounded-lg overflow-hidden border transition-all ${
              room.hasFire
                ? 'border-red-500 shadow-[0_0_15px_rgba(255,51,68,0.4)]'
                : 'border-slate-800 hover:border-cyan-500/50'
            } bg-slate-950 flex flex-col`}
          >
            {/* Camera Canvas Feed */}
            <div className="relative flex-1 min-h-[95px] bg-black">
              <canvas
                ref={(el) => (canvasRefs.current[room.id] = el)}
                width={220}
                height={120}
                className="w-full h-full object-cover"
              />

              {/* Fire Warning Banner */}
              {room.hasFire && (
                <div className="absolute bottom-1 left-1 right-1 bg-red-600/90 text-white text-[9px] font-hud font-bold px-1.5 py-0.5 rounded flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 text-yellow-300" /> FIRE DETECTED!
                  </span>
                  <span>{room.tempCelsius}°C</span>
                </div>
              )}
            </div>

            {/* Camera Controls & Info Footer */}
            <div className="p-1.5 bg-slate-900/90 flex flex-col gap-1 text-[10px]">
              <div className="flex items-center justify-between">
                <div className="font-hud font-bold text-slate-200 truncate">{room.name}</div>
                <div className="font-mono text-[8px] text-cyan-400 flex items-center gap-0.5">
                  <Users className="w-2 h-2" /> {room.peopleCount}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-0.5 border-t border-slate-800">
                {/* Video Feed Simulation Mode / Upload Button */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onTriggerFire(room.id)}
                    title={room.hasFire ? 'Fire Video Feed Active' : 'Switch to Fire Video Stream'}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-hud flex items-center gap-1 transition-colors ${
                      room.hasFire
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Flame className="w-2.5 h-2.5" />
                    {room.hasFire ? 'FIRE FEED' : 'SIMULATE FIRE'}
                  </button>

                  {/* Upload Custom Video file */}
                  <input
                    type="file"
                    accept="video/*"
                    ref={(el) => (fileInputRefs.current[room.id] = el)}
                    className="hidden"
                    onChange={(e) => handleVideoUpload(room.id, e)}
                  />
                  <button
                    onClick={() => fileInputRefs.current[room.id]?.click()}
                    title="Upload Fire CCTV Video (.mp4 / webm)"
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
                  >
                    <Upload className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Focus in 3D */}
                  <button
                    onClick={() => onFocusRoom(room.id)}
                    title="Focus 3D View on this Room"
                    className="p-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-400 rounded border border-slate-700"
                  >
                    <Eye className="w-2.5 h-2.5" />
                  </button>

                  {/* Expand */}
                  {!selectedCam && (
                    <button
                      onClick={() => setSelectedCam(room.id)}
                      title="Maximize Camera"
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
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
