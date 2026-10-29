import React, { useState, useEffect } from 'react';
import {
  Globe,
  MapPin,
  Compass,
  Wind,
  Navigation,
  Layers,
  Radio,
  Crosshair,
  Droplets,
  Car,
  Building,
  Eye,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Maximize2,
  Clock,
  Flame
} from 'lucide-react';

export const GISCommandModal = ({
  isOpen,
  onClose,
  isGisLayerActive,
  onToggle3DGisLayer,
  onSetCameraPreset,
  rooms = []
}) => {
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch', 'hydrants', 'dispersion'
  const [mapMode, setMapMode] = useState('vector'); // 'vector', 'satellite'
  const [showPlume, setShowPlume] = useState(true);
  const [showHydrants, setShowHydrants] = useState(true);
  const [showGeoFences, setShowGeoFences] = useState(true);
  const [showInboundRoute, setShowInboundRoute] = useState(true);
  const [etaSeconds, setEtaSeconds] = useState(205); // ~3m 25s

  const hasAnyFire = rooms.some(r => r.hasFire);

  // Live ETA countdown simulation for incoming fire apparatus
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setEtaSeconds(prev => (prev > 10 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatEta = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-5xl max-h-[92vh] rounded-2xl border border-cyan-500/50 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden bg-slate-950/95">
        
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/30 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-hud font-bold text-base tracking-wider text-white">
                  GIS GEOSPATIAL COMMAND CENTER
                </h2>
                <span className="badge-tech bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 text-[10px]">
                  WGS-84 • GPS LOCK
                </span>
                <span className="badge-tech bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px]">
                  12 SATELLITES
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Urban Spatial Telemetry • Municipal Water Grid • Emergency Routing & Dispersion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle3DGisLayer()}
              className={`px-3 py-1.5 rounded-lg text-xs font-hud font-bold tracking-wider border flex items-center gap-1.5 transition-all ${
                isGisLayerActive
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle 3D Geofence rings & holographic beacons in the 3D viewport"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D SCENE PINS: {isGisLayerActive ? 'ACTIVE' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Geodetic Coordinate Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Coordinates</span>
              <span className="text-white font-bold">28.6139° N, 77.2090° E</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Datum / Elevation</span>
              <span className="text-white font-bold">UTM 43N • 216.4m ASL</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Live Wind Vector</span>
              <span className="text-purple-300 font-bold">315° NW @ 16 km/h</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Municipal Water</span>
              <span className="text-emerald-300 font-bold">125 PSI • 1,500 GPM</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300 col-span-2 sm:col-span-1">
            <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Cadastral Zone</span>
              <span className="text-amber-300 font-bold">SEC-44 • TOWER PLOT 12</span>
            </div>
          </div>
        </div>

        {/* 3. Main Body: Split Map & Data Panels */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 min-h-[460px]">
          
          {/* Left Column: Interactive Geospatial Mini-Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-hud font-bold text-cyan-300">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span>URBAN SPATIAL PLOT & GEOFENCE RADAR</span>
              </div>

              {/* Map Layer Controls */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => setMapMode(mapMode === 'vector' ? 'satellite' : 'vector')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    mapMode === 'satellite'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {mapMode === 'satellite' ? '🛰️ Satellite Imagery' : '🗺️ Vector Cadastral'}
                </button>
              </div>
            </div>

            {/* Interactive Vector GIS SVG Canvas */}
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-cyan-500/40 shadow-inner bg-slate-950 flex items-center justify-center group select-none">
              
              {/* Satellite texture or grid background */}
              <svg className="w-full h-full" viewBox="0 0 600 450">
                <defs>
                  {/* Grid pattern */}
                  <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(2, 132, 199, 0.15)" strokeWidth="0.8" />
                  </pattern>

                  {/* Satellite terrain tint */}
                  <radialGradient id="satGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="60%" stopColor="#081020" />
                    <stop offset="100%" stopColor="#030712" />
                  </radialGradient>

                  {/* Gaussian Smoke Plume Gradient */}
                  <radialGradient id="smokePlumeGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="rgba(239, 68, 68, 0.45)" />
                    <stop offset="50%" stopColor="rgba(249, 115, 22, 0.25)" />
                    <stop offset="100%" stopColor="rgba(100, 116, 139, 0)" />
                  </radialGradient>

                  {/* Geofence pulse ring */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Base Surface */}
                <rect width="600" height="450" fill={mapMode === 'satellite' ? 'url(#satGlow)' : '#050914'} />
                <rect width="600" height="450" fill="url(#gisGrid)" />

                {/* Surrounding City Roads & Highways */}
                {/* South Boulevard (Main E-W Arterial) */}
                <rect x="0" y="360" width="600" height="45" fill="#1e293b" />
                <line x1="0" y1="382" x2="600" y2="382" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 8" />
                <text x="30" y="388" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">SOUTH BOULEVARD (MAIN CORRIDOR)</text>

                {/* North Avenue */}
                <rect x="0" y="30" width="600" height="35" fill="#1e293b" />
                <line x1="0" y1="47" x2="600" y2="47" stroke="#94a3b8" strokeWidth="1" strokeDasharray="8 6" />
                <text x="30" y="52" fill="#64748b" fontSize="10" fontFamily="monospace">NORTH AVENUE (SERVICE ACCESS)</text>

                {/* West Link Road */}
                <rect x="50" y="0" width="35" height="450" fill="#1e293b" />
                <text x="58" y="225" fill="#64748b" fontSize="9" fontFamily="monospace" transform="rotate(-90 58 225)">WEST RING ROAD</text>

                {/* East Boulevard */}
                <rect x="515" y="0" width="35" height="450" fill="#1e293b" />
                <text x="532" y="225" fill="#64748b" fontSize="9" fontFamily="monospace" transform="rotate(90 532 225)">EAST METRO ACCESS</text>

                {/* Neighboring City Plots */}
                <rect x="110" y="80" width="90" height="65" fill="#0f172a" stroke="#334155" strokeWidth="1.2" rx="4" />
                <text x="120" y="115" fill="#64748b" fontSize="9" fontFamily="sans-serif">IT TOWER 2</text>

                <rect x="400" y="80" width="95" height="65" fill="#0f172a" stroke="#334155" strokeWidth="1.2" rx="4" />
                <text x="410" y="115" fill="#64748b" fontSize="9" fontFamily="sans-serif">HOTEL CYBER</text>

                {/* Geofence Safety Rings around Center Tower (x: 300, y: 220) */}
                {showGeoFences && (
                  <>
                    {/* 110m Outer Perimeter */}
                    <circle cx="300" cy="210" r="150" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
                    <text x="455" y="214" fill="#60a5fa" fontSize="8" fontFamily="monospace">110m CORDON</text>

                    {/* 70m Safe Triage Ring */}
                    <circle cx="300" cy="210" r="105" fill="rgba(6, 182, 212, 0.05)" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
                    <text x="410" y="214" fill="#22d3ee" fontSize="8" fontFamily="monospace">70m TRIAGE</text>

                    {/* 30m Hazard Ring */}
                    <circle cx="300" cy="210" r="55" fill="rgba(249, 115, 22, 0.08)" stroke="#f97316" strokeWidth="2" strokeDasharray="5 3" filter="url(#glow)" />
                    <text x="360" y="214" fill="#fb923c" fontSize="8" fontFamily="monospace" fontWeight="bold">30m HAZARD</text>
                  </>
                )}

                {/* Downwind Smoke Hazard Plume Cone (From Tower x:300, y:210 toward South-East) */}
                {showPlume && hasAnyFire && (
                  <path
                    d="M 300 210 Q 420 280 500 360 L 380 430 Q 340 300 300 210 Z"
                    fill="url(#smokePlumeGrad)"
                    opacity="0.9"
                  />
                )}

                {/* Central Building Footprint (TwinGuard Skyscraper) */}
                <rect
                  x="245"
                  y="165"
                  width="110"
                  height="90"
                  fill="#0284c7"
                  fillOpacity="0.25"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  rx="6"
                  filter="url(#glow)"
                  className="cursor-pointer hover:fill-opacity-40 transition-all"
                  onClick={() => onSetCameraPreset('HERO_VIEW')}
                />
                <text x="262" y="205" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">TWINGUARD</text>
                <text x="266" y="220" fill="#38bdf8" fontSize="9" fontFamily="monospace">10-STOREY</text>
                <text x="272" y="235" fill="#facc15" fontSize="8" fontFamily="monospace">[HQ SITE]</text>

                {/* Emergency Exits on Perimeter */}
                {/* Exit A (North) */}
                <rect x="290" y="157" width="20" height="8" fill="#10b981" rx="2" />
                <text x="286" y="152" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">EXIT A</text>

                {/* Exit B (West) */}
                <rect x="237" y="202" width="8" height="20" fill="#10b981" rx="2" />
                <text x="200" y="215" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">EXIT B</text>

                {/* Exit C (South Plaza) */}
                <rect x="290" y="255" width="20" height="8" fill={hasAnyFire ? '#f97316' : '#10b981'} rx="2" />
                <text x="286" y="275" fill={hasAnyFire ? '#fb923c' : '#34d399'} fontSize="8" fontFamily="monospace" fontWeight="bold">EXIT C</text>

                {/* Assembly Muster Zones */}
                {/* Muster Point A (South-West Lawn) */}
                <g className="cursor-pointer" onClick={() => onSetCameraPreset('FOCUS_MUSTER_A')}>
                  <circle cx="210" cy="315" r="24" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.8" strokeDasharray="3 2" />
                  <circle cx="210" cy="315" r="6" fill="#10b981" />
                  <text x="180" y="348" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">MUSTER ZONE A</text>
                  <text x="185" y="358" fill="#94a3b8" fontSize="8" fontFamily="monospace">Cap: 300 Pers</text>
                </g>

                {/* Muster Point B (North-East Park) */}
                <g className="cursor-pointer">
                  <circle cx="430" cy="180" r="22" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.8" strokeDasharray="3 2" />
                  <circle cx="430" cy="180" r="6" fill="#10b981" />
                  <text x="400" y="212" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold">MUSTER ZONE B</text>
                </g>

                {/* Municipal Fire Hydrants */}
                {showHydrants && (
                  <>
                    {/* Hydrant #H-101 (Front South Plaza) */}
                    <g className="cursor-pointer" onClick={() => onSetCameraPreset('FOCUS_HYDRANT')}>
                      <circle cx="340" cy="310" r="10" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="2" />
                      <circle cx="340" cy="310" r="4" fill="#ef4444" />
                      <text x="355" y="314" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">HYD #101</text>
                      <text x="355" y="324" fill="#ef4444" fontSize="8" fontFamily="monospace">125 PSI</text>
                    </g>

                    {/* Hydrant #H-102 (North Access) */}
                    <g className="cursor-pointer">
                      <circle cx="350" cy="110" r="8" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1.5" />
                      <circle cx="350" cy="110" r="3.5" fill="#ef4444" />
                      <text x="362" y="114" fill="#fca5a5" fontSize="8" fontFamily="monospace">HYD #102</text>
                    </g>

                    {/* Hydrant #H-103 (West Perimeter) */}
                    <g className="cursor-pointer">
                      <circle cx="130" cy="210" r="8" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1.5" />
                      <circle cx="130" cy="210" r="3.5" fill="#ef4444" />
                      <text x="142" y="214" fill="#fca5a5" fontSize="8" fontFamily="monospace">HYD #103</text>
                    </g>
                  </>
                )}

                {/* Inbound Emergency Route for Fire Engines along South Blvd */}
                {showInboundRoute && (
                  <g>
                    <path
                      d="M 20 382 L 300 382 L 300 310"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.5"
                      strokeDasharray="8 5"
                      strokeLinecap="round"
                    />
                    {/* Animated Engine icon */}
                    <circle cx="140" cy="382" r="7" fill="#ef4444" filter="url(#glow)" />
                    <text x="155" y="375" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      🚒 ENGINE 07 (ETA: {formatEta(etaSeconds)})
                    </text>
                  </g>
                )}

                {/* Compass Rose at Top-Right */}
                <g transform="translate(545, 60)">
                  <circle cx="0" cy="0" r="22" fill="#090d16" stroke="#0284c7" strokeWidth="1.5" />
                  <polygon points="0,-18 5,-2 0,2 -5,-2" fill="#ef4444" />
                  <polygon points="0,18 5,2 0,-2 -5,2" fill="#94a3b8" />
                  <text x="-4" y="-22" fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold">N</text>
                  <text x="-3" y="30" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">S</text>
                  <text x="24" y="3" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">E</text>
                  <text x="-32" y="3" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">W</text>
                  {/* Wind Arrow (from NW) */}
                  <line x1="-14" y1="-14" x2="14" y2="14" stroke="#a855f7" strokeWidth="2.5" markerEnd="url(#arrow)" />
                  <text x="16" y="20" fill="#c084fc" fontSize="8" fontFamily="monospace">16km/h</text>
                </g>

                {/* Scale Bar at Bottom-Left */}
                <g transform="translate(20, 425)">
                  <line x1="0" y1="0" x2="80" y2="0" stroke="#ffffff" strokeWidth="2" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#ffffff" strokeWidth="2" />
                  <line x1="80" y1="-4" x2="80" y2="4" stroke="#ffffff" strokeWidth="2" />
                  <text x="25" y="-5" fill="#ffffff" fontSize="9" fontFamily="monospace">50 METERS</text>
                </g>
              </svg>

              {/* Live Overlay Toggles on bottom of map */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-950/90 border border-slate-700/80 rounded-lg p-1 text-[10px] font-mono backdrop-blur-md">
                <button
                  onClick={() => setShowPlume(!showPlume)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showPlume ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500'
                  }`}
                >
                  Plume
                </button>
                <button
                  onClick={() => setShowHydrants(!showHydrants)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showHydrants ? 'bg-red-500/20 text-red-300' : 'text-slate-500'
                  }`}
                >
                  Hydrants
                </button>
                <button
                  onClick={() => setShowGeoFences(!showGeoFences)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showGeoFences ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'
                  }`}
                >
                  Geofences
                </button>
                <button
                  onClick={() => setShowInboundRoute(!showInboundRoute)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showInboundRoute ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  Routes
                </button>
              </div>
            </div>

            {/* Quick 3D Viewport Navigation Shortcuts */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 font-hud text-[10px] uppercase">3D Fly-to:</span>
              <button
                onClick={() => onSetCameraPreset('GIS_SATELLITE')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3 h-3" /> Satellite Top-Down
              </button>
              <button
                onClick={() => onSetCameraPreset('FOCUS_HYDRANT')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Droplets className="w-3 h-3" /> Hydrant #101
              </button>
              <button
                onClick={() => onSetCameraPreset('FOCUS_MUSTER_A')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" /> Muster Zone A
              </button>
              <button
                onClick={() => onSetCameraPreset('FOCUS_HELIPAD')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Navigation className="w-3 h-3" /> Roof Helipad
              </button>
            </div>
          </div>

          {/* Right Column: Tabbed GIS Infrastructure & Dispatch Telemetry (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Tabs Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-hud font-bold">
              <button
                onClick={() => setActiveTab('dispatch')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'dispatch'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>DISPATCH</span>
              </button>

              <button
                onClick={() => setActiveTab('hydrants')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'hydrants'
                    ? 'bg-red-500/20 text-red-300 border border-red-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>WATER GRID</span>
              </button>

              <button
                onClick={() => setActiveTab('dispersion')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'dispersion'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>PLUME MODEL</span>
              </button>
            </div>

            {/* TAB 1: Emergency Services Dispatch */}
            {activeTab === 'dispatch' && (
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Nearest Fire Station Card */}
                <div className="bg-slate-900/90 border border-red-500/30 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-red-950 border border-red-500/40 text-red-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <span className="font-hud font-bold text-white">FIRE STATION #07 (CYBER HUB)</span>
                    </div>
                    <span className="badge-tech bg-red-950 text-red-300 border border-red-500/40 font-mono text-[10px]">
                      EN ROUTE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Distance</span>
                      <span className="text-white font-bold">1.8 km (South Blvd)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Inbound ETA</span>
                      <span className="text-red-400 font-bold text-sm">{formatEta(etaSeconds)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Deployed Units</span>
                      <span className="text-slate-200">Engine 07 & 55m Aerial</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Traffic Corridor</span>
                      <span className="text-emerald-400 font-bold">Pre-empted Green</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>Station 07</span>
                      <span>TwinGuard Site</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000"
                        style={{ width: `${Math.min(100, Math.max(10, ((300 - etaSeconds) / 300) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metro Trauma Center Hospital */}
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-hud font-bold text-white">METRO TRAUMA CENTER</span>
                    </div>
                    <span className="badge-tech bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]">
                      READY (28 BEDS)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Distance</span>
                      <span className="text-white font-bold">3.2 km (West Link)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Ambulance Fleet</span>
                      <span className="text-emerald-400 font-bold">3 Units on Standby</span>
                    </div>
                  </div>
                </div>

                {/* Municipal Police Cordon */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span className="font-hud font-bold text-slate-300 block">SECTOR 4 TRAFFIC PERIMETER</span>
                    <span className="text-slate-400 text-[10px]">South Blvd diverted for emergency responders</span>
                  </div>
                  <span className="text-cyan-400 font-bold">ACTIVE CORDON</span>
                </div>
              </div>
            )}

            {/* TAB 2: Municipal Water & Hydrant Network */}
            {activeTab === 'hydrants' && (
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Static Water Reservoir */}
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-hud font-bold text-cyan-300">UNDERGROUND STATIC RESERVOIR</span>
                    <span className="font-mono text-emerald-400 font-bold text-xs">98% CAPACITY</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mb-2">
                    Volume: <b className="text-white">450,000 Liters</b> Dedicated Fire Reserve (Dual Booster Pumps Active)
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-[98%]" />
                  </div>
                </div>

                {/* Hydrant Cards */}
                <div className="flex flex-col gap-2">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-hud font-bold text-white flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-red-400" />
                        <span>HYDRANT #H-101 (SOUTH PLAZA)</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Dist: 24m • 250mm Main • Tested: 3d ago
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-400 font-bold text-xs">125 PSI</div>
                      <button
                        onClick={() => onSetCameraPreset('FOCUS_HYDRANT')}
                        className="text-[9px] text-cyan-400 hover:underline"
                      >
                        [Focus in 3D]
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-hud font-bold text-white flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-red-400" />
                        <span>HYDRANT #H-102 (NORTH ACCESS)</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Dist: 58m • 200mm Main
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-400 font-bold text-xs">118 PSI</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-hud font-bold text-white flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-red-400" />
                        <span>HYDRANT #H-103 (WEST PERIMETER)</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Dist: 46m • 200mm Main
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-400 font-bold text-xs">110 PSI</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Atmospheric Smoke Dispersion Model */}
            {activeTab === 'dispersion' && (
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Wind & Weather Telemetry */}
                <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                    <span className="font-hud font-bold text-purple-300">GAUSSIAN PLUME ATMOSPHERIC DISPERSION</span>
                    <span className="badge-tech bg-purple-950 text-purple-300 border border-purple-500/40 font-mono text-[10px]">
                      LIVE SENSOR FEED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Wind Direction</span>
                      <span className="text-white font-bold">315° North-West</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Wind Velocity</span>
                      <span className="text-purple-400 font-bold text-sm">16 km/h (4.4 m/s)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Smoke Fallout Vector</span>
                      <span className="text-amber-300 font-bold">135° South-East Plaza</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Ambient Air Quality</span>
                      <span className="text-emerald-400 font-bold">AQI 42 (Safe)</span>
                    </div>
                  </div>
                </div>

                {/* AI Evacuation Recommendation based on GIS Wind */}
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-hud font-bold text-amber-300 block mb-0.5">
                      GIS SPATIAL EVACUATION DIRECTIVE:
                    </span>
                    <p className="text-slate-300">
                      External smoke will drift towards the <b>South-East</b> quadrant. Evacuees must be prioritized towards <b>Exit A (North Avenue)</b> and <b>Exit B (West Ring Road)</b>. Avoid staging triage in the South-East plaza downwind shadow!
                    </p>
                  </div>
                </div>

                {/* Safe Evacuation Catchment */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-300 mb-1">
                    <span className="text-slate-400 font-hud text-[10px] uppercase">Optimal Assembly Zone:</span>
                    <span className="text-emerald-400 font-bold">MUSTER ZONE A (UPWIND)</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Located 45m upwind from smoke dispersion cone. 100% clean air corridor.
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 4. Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Municipal GIS Node: <b>DL-ND-8492</b></span>
            <span>•</span>
            <span className="text-cyan-400">Press 'G' anytime to toggle GIS Command</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-hud font-bold tracking-wider text-xs shadow-lg transition-colors"
          >
            RETURN TO 3D TWIN
          </button>
        </div>

      </div>
    </div>
  );
};
