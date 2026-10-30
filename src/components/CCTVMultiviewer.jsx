import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Video,
  Flame,
  Users,
  Maximize2,
  Minimize2,
  Eye,
  Layers,
  Upload,
  Search,
  Bell,
  Settings,
  X,
  Building,
  LayoutGrid,
  List,
  MoreHorizontal,
  Scan
} from 'lucide-react';

export const CCTVMultiviewer = React.memo(({ rooms = [], onTriggerFire, onUpdateCrowd, onFocusRoom, onClose }) => {
  const [selectedCam, setSelectedCam] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const canvasRefs = useRef({});
  const fileInputRefs = useRef({});

  // Filter rooms based on floor and search query
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesFloor = selectedFloor === 'ALL' || String(room.floor) === selectedFloor;
      const matchesSearch =
        searchQuery.trim() === '' ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.camId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `floor ${room.floor}`.includes(searchQuery.toLowerCase());
      return matchesFloor && matchesSearch;
    });
  }, [rooms, selectedFloor, searchQuery]);

  // If a camera is maximized, only display that one, otherwise up to 12 cameras
  const displayedRooms = selectedCam
    ? filteredRooms.filter((r) => r.id === selectedCam)
    : filteredRooms.slice(0, 12);

  // Real-time canvas simulation for camera feeds matching mockup perspective grid
  useEffect(() => {
    let animId;
    let frame = 0;
    let lastRenderTime = 0;

    const renderCCTVFeeds = (timestamp) => {
      if (timestamp - lastRenderTime < 66) {
        animId = requestAnimationFrame(renderCCTVFeeds);
        return;
      }
      lastRenderTime = timestamp;
      frame++;

      displayedRooms.forEach((room) => {
        const canvas = canvasRefs.current[room.id];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Base surveillance floor gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        if (room.hasFire) {
          bgGrad.addColorStop(0, '#1f0d0d');
          bgGrad.addColorStop(1, '#2d1111');
        } else {
          bgGrad.addColorStop(0, '#111927');
          bgGrad.addColorStop(1, '#162234');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Perspective grid lines (matching reference image)
        ctx.strokeStyle = room.hasFire ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 58, 95, 0.45)';
        ctx.lineWidth = 1;

        // Vanishing point in the center distance
        const vpX = w / 2;
        const vpY = 24;

        // Perspective lines spreading downwards
        for (let i = 0; i <= w; i += 28) {
          ctx.beginPath();
          ctx.moveTo(vpX + (i - vpX) * 0.25, vpY);
          ctx.lineTo(i, h);
          ctx.stroke();
        }

        // Horizontal perspective depth lines
        for (let y = vpY + 20; y < h; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Simulated occupants with AI green bounding boxes (matching mockup)
        const peopleCount = room.peopleCount || 0;
        const seed = room.id.charCodeAt(3) || 1;

        for (let i = 0; i < peopleCount; i++) {
          const speedFactor = (i * 0.12 + 0.35);
          const px = 30 + ((Math.sin(frame * 0.02 * speedFactor + i * 2.1 + seed) + 1) / 2) * (w - 70);
          const py = 50 + ((Math.cos(frame * 0.015 * speedFactor + i * 1.6 + seed) + 1) / 2) * (h - 80);

          // Head
          ctx.fillStyle = room.hasFire ? '#ffaa00' : '#10b981';
          ctx.beginPath();
          ctx.arc(px, py - 8, 4, 0, Math.PI * 2);
          ctx.fill();

          // Torso
          ctx.fillRect(px - 3, py - 3, 6, 12);

          // Green AI Bounding Box
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(px - 8, py - 15, 16, 26);

          // Label P1, P2...
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`P${i + 1}`, px - 6, py - 18);
        }

        // Fire detection effect if active
        if (room.hasFire) {
          const fireX = w / 2 + Math.sin(frame * 0.05) * 12;
          const fireY = h / 2 + 10;

          const grad = ctx.createRadialGradient(fireX, fireY, 5, fireX, fireY, 55);
          grad.addColorStop(0, 'rgba(255, 230, 0, 0.95)');
          grad.addColorStop(0.3, 'rgba(255, 80, 0, 0.8)');
          grad.addColorStop(0.7, 'rgba(200, 20, 0, 0.4)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fireX, fireY, 55, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(fireX - 38, fireY - 30, 76, 56);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(fireX - 38, fireY - 44, 76, 13);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('🔥 FIRE: 99.4%', fireX - 32, fireY - 34);
        }
      });

      animId = requestAnimationFrame(renderCCTVFeeds);
    };

    animId = requestAnimationFrame(renderCCTVFeeds);
    return () => cancelAnimationFrame(animId);
  }, [displayedRooms]);

  const handleVideoUpload = (roomId, event) => {
    const file = event.target.files?.[0];
    if (file) {
      onTriggerFire(roomId);
    }
  };

  return (
    <div
      className="flex flex-col select-none no-scrollbar"
      style={{
        gap: '16px',
        padding: '16px',
        background: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: 'border-box',
        width: '100%',
        borderRadius: '24px',
      }}
    >
      {/* ── 1. TOP HEADER CARD (Matching Reference Image) ── */}
      <div
        className="flex items-center justify-between"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '14px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Left: Blue Camera Icon Badge & Titles */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#ebf5ff',
              border: '1px solid #d0e7ff',
              color: '#0284c7',
            }}
          >
            <Video style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Facility CCTV Security Multiviewer
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
              Real-time monitoring across floors and locations
            </p>
          </div>
        </div>

        {/* Right: Operational Status, Action Buttons & Close */}
        <div className="flex items-center" style={{ gap: '16px' }}>
          {/* Active Cameras Status */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <div className="text-right">
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                100 Cameras Active
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>
                All systems operational
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />

          {/* Quick Actions (Bell, Settings, Close) */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            <button
              className="flex items-center justify-center cursor-pointer transition-colors relative"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
              title="Alert Notifications"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Bell style={{ width: '16px', height: '16px' }} />
              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  right: '7px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
            </button>

            <button
              className="flex items-center justify-center cursor-pointer transition-colors"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
              title="Camera Grid Settings"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Settings style={{ width: '16px', height: '16px' }} />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '11px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                }}
                title="Close Multiviewer"
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. FLOOR & SEARCH CONTROL BAR (Matching Reference Image) ── */}
      <div
        className="flex items-center justify-between"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '10px 16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Left: FLOOR Label + All Floors Pill + L1..L10 */}
        <div className="flex items-center" style={{ gap: '10px' }}>
          <div className="flex items-center" style={{ gap: '6px', marginRight: '4px' }}>
            <Layers style={{ width: '15px', height: '15px', color: '#64748b' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Floor
            </span>
          </div>

          {/* All Floors Capsule (with 4-square grid icon) */}
          <button
            onClick={() => {
              setSelectedFloor('ALL');
              setSelectedCam(null);
            }}
            className="flex items-center cursor-pointer transition-all"
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              gap: '6px',
              background: selectedFloor === 'ALL' ? '#2563eb' : '#ffffff',
              color: selectedFloor === 'ALL' ? '#ffffff' : '#64748b',
              border: selectedFloor === 'ALL' ? 'none' : '1px solid #e2e8f0',
              boxShadow: selectedFloor === 'ALL' ? '0 2px 8px -1px rgba(37, 99, 235, 0.35)' : 'none',
            }}
          >
            <LayoutGrid style={{ width: '13px', height: '13px' }} />
            <span>All Floors</span>
          </button>

          {/* L1 to L10 Pills */}
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((fl) => {
            const isSelected = selectedFloor === fl;
            return (
              <button
                key={fl}
                onClick={() => {
                  setSelectedFloor(fl);
                  setSelectedCam(null);
                }}
                className="cursor-pointer transition-all"
                style={{
                  padding: '5px 11px',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  fontFamily: 'monospace',
                  fontWeight: isSelected ? 800 : 600,
                  background: isSelected ? '#2563eb' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#64748b',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
                }}
              >
                L{fl}
              </button>
            );
          })}
        </div>

        {/* Right: Search Input & Grid / List View Toggle */}
        <div className="flex items-center" style={{ gap: '10px' }}>
          {/* Search Box */}
          <div
            className="flex items-center"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '6px 12px',
              gap: '8px',
              width: '210px',
            }}
          >
            <Search style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search camera, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '11.5px',
                color: '#1e293b',
                width: '100%',
              }}
            />
          </div>

          {/* Grid View Toggle */}
          <button
            onClick={() => setViewMode('grid')}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: viewMode === 'grid' ? '#2563eb' : '#f8fafc',
              color: viewMode === 'grid' ? '#ffffff' : '#94a3b8',
              border: viewMode === 'grid' ? 'none' : '1px solid #e2e8f0',
              boxShadow: viewMode === 'grid' ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
            }}
            title="Grid View"
          >
            <LayoutGrid style={{ width: '14px', height: '14px' }} />
          </button>

          {/* List View Toggle */}
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: viewMode === 'list' ? '#2563eb' : '#f8fafc',
              color: viewMode === 'list' ? '#ffffff' : '#94a3b8',
              border: viewMode === 'list' ? 'none' : '1px solid #e2e8f0',
              boxShadow: viewMode === 'list' ? '0 2px 6px -1px rgba(37, 99, 235, 0.35)' : 'none',
            }}
            title="List View"
          >
            <List style={{ width: '15px', height: '15px' }} />
          </button>
        </div>
      </div>

      {/* ── 3. CAMERA GRID (Matching Reference Image Perfectly) ── */}
      <div
        className={`grid ${
          selectedCam ? 'grid-cols-1' : viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'
        }`}
        style={{ gap: '16px' }}
      >
        {displayedRooms.map((room) => {
          return (
            <div
              key={room.id}
              className="flex flex-col transition-all"
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: room.hasFire ? '2px solid #ef4444' : '1px solid #e2e8f0',
                boxShadow: room.hasFire ? '0 4px 20px -2px rgba(239, 68, 68, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
              }}
            >
              {/* Camera Video Screen */}
              <div className="relative bg-[#111927]" style={{ height: selectedCam ? '360px' : '180px', overflow: 'hidden' }}>
                <canvas
                  ref={(el) => (canvasRefs.current[room.id] = el)}
                  width={340}
                  height={180}
                  className="w-full h-full object-cover"
                />

                {/* Top-Left: LIVE Badge */}
                <div
                  className="absolute flex items-center"
                  style={{
                    top: '12px',
                    left: '12px',
                    padding: '3px 9px',
                    borderRadius: '7px',
                    background: 'rgba(6, 78, 59, 0.75)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#6ee7b7', letterSpacing: '0.04em' }}>
                    LIVE
                  </span>
                </div>

                {/* Top-Right: Camera Tool Overlay [Scan / Frame] [••• Options] */}
                <div
                  className="absolute flex items-center"
                  style={{
                    top: '12px',
                    right: '12px',
                    gap: '6px',
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#cbd5e1',
                    }}
                  >
                    <Scan style={{ width: '13px', height: '13px' }} />
                  </div>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#cbd5e1',
                    }}
                  >
                    <MoreHorizontal style={{ width: '13px', height: '13px' }} />
                  </div>
                </div>

                {/* Fire Alert Banner if fire active */}
                {room.hasFire && (
                  <div
                    className="absolute flex items-center justify-between"
                    style={{
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      background: 'rgba(220, 38, 38, 0.95)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '5px 12px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                    }}
                  >
                    <span className="flex items-center" style={{ gap: '6px' }}>
                      <Flame style={{ width: '14px', height: '14px', fill: 'white' }} /> FIRE ALARM DETECTED
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>{room.tempCelsius}°C</span>
                  </div>
                )}
              </div>

              {/* Card Footer (Matching Mockup with Room Info + Trigger Fire + Action Icons) */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '12px 16px',
                  background: '#ffffff',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                {/* Left: Blue Building Icon + Room Name & Floor/Camera + Occupant Count */}
                <div className="flex items-center min-w-0" style={{ gap: '12px' }}>
                  {/* Blue Building Icon */}
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '11px',
                      background: '#ebf5ff',
                      border: '1px solid #d0e7ff',
                      color: '#0284c7',
                    }}
                  >
                    <Building style={{ width: '17px', height: '17px' }} />
                  </div>

                  {/* Room Name & Floor details */}
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {room.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                      Floor {room.floor} &nbsp;|&nbsp; {room.camId.replace('-', ' ')}
                    </div>
                  </div>

                  {/* Occupant Pill Badge */}
                  <div
                    className="flex items-center shrink-0"
                    style={{
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0d7a5f',
                      background: '#f0fdf4',
                      border: '1px solid #d1fae5',
                      padding: '3px 9px',
                      borderRadius: '7px',
                      marginLeft: '4px',
                    }}
                  >
                    <Users style={{ width: '12px', height: '12px' }} />
                    <span>{room.peopleCount}</span>
                  </div>
                </div>

                {/* Right: TRIGGER FIRE Button & Utility Action Icons */}
                <div className="flex items-center shrink-0" style={{ gap: '8px' }}>
                  {/* TRIGGER FIRE Pill Button (Matching Mockup) */}
                  <button
                    onClick={() => onTriggerFire(room.id)}
                    title={room.hasFire ? 'Extinguish active fire' : 'Simulate fire in this location'}
                    className="flex items-center cursor-pointer transition-all"
                    style={{
                      padding: '6px 13px',
                      borderRadius: '10px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      gap: '5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: room.hasFire ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#fff1f2',
                      color: room.hasFire ? '#ffffff' : '#e11d48',
                      border: room.hasFire ? 'none' : '1px solid #fecdd3',
                      boxShadow: room.hasFire ? '0 2px 8px -1px rgba(239, 68, 68, 0.4)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!room.hasFire) {
                        e.currentTarget.style.background = '#ffe4e6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!room.hasFire) {
                        e.currentTarget.style.background = '#fff1f2';
                      }
                    }}
                  >
                    <Flame style={{ width: '13px', height: '13px', fill: room.hasFire ? 'white' : '#e11d48' }} />
                    <span>{room.hasFire ? 'ACTIVE FIRE' : 'TRIGGER FIRE'}</span>
                  </button>

                  {/* Upload Stream Button */}
                  <input
                    type="file"
                    accept="video/*"
                    ref={(el) => (fileInputRefs.current[room.id] = el)}
                    className="hidden"
                    onChange={(e) => handleVideoUpload(room.id, e)}
                  />
                  <button
                    onClick={() => fileInputRefs.current[room.id]?.click()}
                    title="Upload Custom Video Stream"
                    className="flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <Upload style={{ width: '13px', height: '13px' }} />
                  </button>

                  {/* 3D Viewport Focus Eye Button */}
                  <button
                    onClick={() => onFocusRoom(room.id)}
                    title="Focus 3D Digital Twin Viewport"
                    className="flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#0d7a5f'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <Eye style={{ width: '13px', height: '13px' }} />
                  </button>

                  {/* Maximize / Expand Button */}
                  <button
                    onClick={() => setSelectedCam(selectedCam ? null : room.id)}
                    title={selectedCam ? 'Restore Grid' : 'Maximize Feed'}
                    className="flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    {selectedCam ? <Minimize2 style={{ width: '13px', height: '13px' }} /> : <Maximize2 style={{ width: '13px', height: '13px' }} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
