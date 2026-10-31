import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Maximize2,
  Minimize2,
  Eye,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import {
  GIS_COORDINATES,
  ROUTE_METRICS,
  getInterpolatedRoutePosition,
  getTravelledRoute
} from './gisData';

// Custom tactical Leaflet and HUD styles
const TACTICAL_GIS_STYLES = `
  .tactical-gis-pulse-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    position: relative;
    transition: transform 0.2s ease;
  }
  .tactical-gate-pulse {
    animation: gatePulse 1.2s infinite ease-in-out;
  }
  @keyframes gatePulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 8px rgba(168, 85, 247, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
  }
  .tactical-vehicle-pulse {
    animation: vehiclePulse 1.4s infinite ease-in-out;
  }
  @keyframes vehiclePulse {
    0% { filter: drop-shadow(0 0 2px #ef4444); }
    50% { filter: drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 14px rgba(239,68,68,0.6)); }
    100% { filter: drop-shadow(0 0 2px #ef4444); }
  }
  .gis-fire-truck-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    transition: transform 0.12s linear;
  }
  .gis-strobe-blinker {
    animation: strobeBlink 0.35s infinite alternate;
  }
  @keyframes strobeBlink {
    0% { fill: #ef4444; }
    100% { fill: #38bdf8; }
  }
  /* Minimal Leaflet Popup */
  .leaflet-popup-content-wrapper {
    background: rgba(15, 23, 42, 0.95) !important;
    backdrop-filter: blur(8px) !important;
    color: #f1f5f9 !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 8px !important;
    font-size: 11px !important;
    padding: 2px !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5) !important;
  }
  .leaflet-popup-content {
    margin: 8px 10px !important;
    line-height: 1.3 !important;
  }
  .leaflet-popup-tip {
    background: rgba(15, 23, 42, 0.95) !important;
  }
`;

/**
 * Tactical SVG Fire Engine with dynamic heading rotation
 */
function createTacticalFireTruckSvg(headingDeg = 0, isPulsing = false) {
  return `
    <div class="gis-fire-truck-container ${isPulsing ? 'tactical-vehicle-pulse' : ''}" style="transform: rotate(${headingDeg}deg);">
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Wheels -->
        <rect x="7" y="6" width="3" height="7" rx="1.5" fill="#0f172a" />
        <rect x="30" y="6" width="3" height="7" rx="1.5" fill="#0f172a" />
        <rect x="7" y="27" width="3" height="7" rx="1.5" fill="#0f172a" />
        <rect x="30" y="27" width="3" height="7" rx="1.5" fill="#0f172a" />
        
        <!-- Truck Body -->
        <rect x="9" y="4" width="22" height="32" rx="4" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        
        <!-- Silver Equipment Compartments -->
        <rect x="11" y="16" width="18" height="18" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
        
        <!-- Aerial Ladder Structure -->
        <rect x="17" y="14" width="6" height="20" rx="1" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
        <line x1="17" y1="18" x2="23" y2="18" stroke="#475569" stroke-width="1" />
        <line x1="17" y1="22" x2="23" y2="22" stroke="#475569" stroke-width="1" />
        <line x1="17" y1="26" x2="23" y2="26" stroke="#475569" stroke-width="1" />
        <line x1="17" y1="30" x2="23" y2="30" stroke="#475569" stroke-width="1" />
        
        <!-- Front Cab Windshield -->
        <path d="M12 11C12 8 13.5 6 20 6C26.5 6 28 8 28 11L28 13H12L12 11Z" fill="#0f172a" />
        <rect x="13" y="8" width="14" height="4" rx="1" fill="#38bdf8" fill-opacity="0.85" />
        
        <!-- High-Intensity Emergency Light Bar -->
        <rect x="15" y="4" width="10" height="2.5" rx="1" class="gis-strobe-blinker" />
        
        <!-- Yellow Rear Chevron -->
        <rect x="12" y="34" width="16" height="1.8" fill="#facc15" />
      </svg>
    </div>
  `;
}

export default function GisMapDrawer({
  isOpen,
  onClose,
  emergencyStatus,
  onFocusCampusView,
  isMuted,
  onToggleMute
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const baseRoutePolylineRef = useRef(null);
  const travelledRoutePolylineRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMode, setMapMode] = useState('satellite'); // 'satellite' | 'streets'

  // Authoritative simulation state from emergencyStatus
  const isEmergency = Boolean(emergencyStatus && emergencyStatus.isActive);
  const dispatchProgress = emergencyStatus ? (emergencyStatus.gisProgress ?? (emergencyStatus.progress / 100)) : 0;
  const dispatchEta = emergencyStatus?.etaSeconds ?? (isEmergency ? 30 : 0);
  const phase = emergencyStatus?.phase ?? (isEmergency ? 'EN_ROUTE' : 'STANDBY');

  // Tile layers definition
  const TILE_LAYERS = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Imagery'
    },
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: 'OpenStreetMap'
    }
  };

  // Derive dynamic tactical badge text & colors
  const statusTelemetry = useMemo(() => {
    if (!isEmergency && phase === 'STANDBY') {
      return {
        badgeText: 'STANDBY',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        dotColor: '#94a3b8',
        hudLine1: '🚒 ENGINE #07',
        hudLine2: 'STANDBY • STATION #07'
      };
    }
    if (phase === 'ON_SCENE') {
      return {
        badgeText: 'ON SCENE',
        badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        dotColor: '#10b981',
        hudLine1: '🚒 ENGINE #07   ON SCENE',
        hudLine2: 'TWINGUARD HQ • PERIMETER STAGED'
      };
    }
    if (phase === 'AT_CAMPUS_GATE' || phase === 'ENTERING_CAMPUS' || dispatchProgress >= 1.0) {
      return {
        badgeText: 'CAMPUS ARRIVAL',
        badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        dotColor: '#a855f7',
        hudLine1: '🚒 ENGINE #07   AT GATE',
        hudLine2: 'CAMPUS GATE REACHED • 3D ACTIVE'
      };
    }
    if (phase === 'ARRIVING_GATE' || dispatchProgress >= 0.9) {
      return {
        badgeText: 'ARRIVING',
        badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        dotColor: '#f59e0b',
        hudLine1: `🚒 ENGINE #07   ETA ${Math.max(1, Math.ceil(dispatchEta))}s`,
        hudLine2: 'ARRIVING • SOUTH MAIN GATE'
      };
    }
    // DISPATCHED / EN_ROUTE
    return {
      badgeText: 'DISPATCH ACTIVE',
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
      dotColor: '#38bdf8',
      hudLine1: `🚒 ENGINE #07   ETA ${Math.ceil(dispatchEta)}s`,
      hudLine2: `EN ROUTE → MAIN GATE (${((1 - dispatchProgress) * (ROUTE_METRICS.totalMeters / 1000)).toFixed(1)} km)`
    };
  }, [isEmergency, phase, dispatchProgress, dispatchEta]);

  // Initialize Tactical Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Inject stylesheet
      const styleEl = document.createElement('style');
      styleEl.innerHTML = TACTICAL_GIS_STYLES;
      document.head.appendChild(styleEl);

      const map = L.map(mapContainerRef.current, {
        center: [28.5028, 77.0850], // Centered between fire station and campus
        zoom: 14,
        minZoom: 12,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      // Base Satellite Tile Layer
      const baseLayer = L.tileLayer(TILE_LAYERS[mapMode].url, {
        maxZoom: 19
      }).addTo(map);
      tileLayerRef.current = baseLayer;

      // Outer Campus Geofence Boundary (Subtle translucent overlay)
      L.polygon(GIS_COORDINATES.CAMPUS_GEOFENCE, {
        color: '#3b82f6',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#3b82f6',
        fillOpacity: 0.08
      }).addTo(map);

      // 1. Fire Station Origin Marker
      const fireStation = GIS_COORDINATES.MUNICIPAL_SERVICES[0];
      const stationIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid #3b82f6; border-radius: 6px; padding: 2px 5px; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
            <span style="font-size: 11px;">🚒</span>
            <span style="font-size: 9px; font-weight: 700; color: #93c5fd; white-space: nowrap;">STATION #07</span>
          </div>
        `,
        iconSize: [80, 22],
        iconAnchor: [40, 11]
      });
      L.marker([fireStation.lat, fireStation.lng], { icon: stationIcon }).addTo(map);

      // 2. Campus Main Gate Marker
      const mainGateCoord = GIS_COORDINATES.CAMPUS_GATES[0];
      const gateIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div id="gis-main-gate-marker" class="tactical-gis-pulse-marker" style="width: 20px; height: 20px; background: rgba(168, 85, 247, 0.9); border: 1.5px solid #ffffff; box-shadow: 0 0 8px rgba(168, 85, 247, 0.8);">
            <span style="font-size: 10px; color: #ffffff; font-weight: 800;">⌖</span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const gateMarker = L.marker([mainGateCoord.lat, mainGateCoord.lng], { icon: gateIcon }).addTo(map);
      gateMarker.bindTooltip('South Main Gate', { direction: 'top', offset: [0, -10], className: 'tactical-tooltip' });
      gateMarkerRef.current = gateMarker;

      // 3. Hero Facility HQ Marker
      const heroIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background: rgba(15, 23, 42, 0.88); border: 1.5px solid #38bdf8; border-radius: 6px; padding: 2px 5px; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
            <span style="font-size: 11px;">🏢</span>
            <span style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.04em;">TWIN HQ</span>
          </div>
        `,
        iconSize: [70, 22],
        iconAnchor: [35, 11]
      });
      L.marker([GIS_COORDINATES.FACILITY_ORIGIN.lat, GIS_COORDINATES.FACILITY_ORIGIN.lng], { icon: heroIcon }).addTo(map);

      // 4. Tactical Real Road Route (Subtle remaining route dashed line)
      const baseRoute = L.polyline(GIS_COORDINATES.DISPATCH_ROUTE, {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.45,
        dashArray: '5, 5',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      baseRoutePolylineRef.current = baseRoute;

      // 5. Travelled Route (Solid high-contrast cyan/emerald line)
      const initialTravelled = getTravelledRoute(dispatchProgress);
      const travelledRoute = L.polyline(initialTravelled, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      travelledRoutePolylineRef.current = travelledRoute;

      // 6. Tactical Fire Engine Directional Marker
      const initialVehicleState = getInterpolatedRoutePosition(dispatchProgress);
      const vehicleIcon = L.divIcon({
        className: 'custom-div-icon',
        html: createTacticalFireTruckSvg(initialVehicleState.heading, isEmergency && dispatchProgress < 1.0),
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const vehicleMarker = L.marker([initialVehicleState.lat, initialVehicleState.lng], {
        icon: vehicleIcon,
        zIndexOffset: 1000
      }).addTo(map);
      vehicleMarkerRef.current = vehicleMarker;

      mapInstanceRef.current = map;

      // Diagnostics API
      window.__twinguardGIS = {
        map,
        getCoords: () => GIS_COORDINATES,
        getRouteMetrics: () => ROUTE_METRICS,
        getDispatchProgress: () => dispatchProgress,
        getEmergencyStatus: () => emergencyStatus
      };
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  }, [isOpen]);

  // Update Tile Layer on Mode change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(TILE_LAYERS[mapMode].url, {
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapMode]);

  // Update Emergency Vehicle Position, Heading, Travelled Trail & Gate Pulse in Real-Time
  useEffect(() => {
    if (!mapInstanceRef.current || !vehicleMarkerRef.current) return;
    const posState = getInterpolatedRoutePosition(dispatchProgress);

    // Update coordinates
    vehicleMarkerRef.current.setLatLng([posState.lat, posState.lng]);

    // Update dynamic SVG rotation based on road heading & pulsing state
    const isPulsing = isEmergency && dispatchProgress < 1.0;
    const updatedIcon = L.divIcon({
      className: 'custom-div-icon',
      html: createTacticalFireTruckSvg(posState.heading, isPulsing),
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    vehicleMarkerRef.current.setIcon(updatedIcon);

    // Update travelled route trail
    if (travelledRoutePolylineRef.current) {
      const travelledCoords = getTravelledRoute(dispatchProgress);
      travelledRoutePolylineRef.current.setLatLngs(travelledCoords);

      if (dispatchProgress >= 1.0) {
        travelledRoutePolylineRef.current.setStyle({ color: '#10b981', weight: 4 });
      } else {
        travelledRoutePolylineRef.current.setStyle({ color: '#38bdf8', weight: 4 });
      }
    }

    // Main Gate subtle pulse upon arrival (dispatchProgress >= 0.95)
    const gateEl = document.getElementById('gis-main-gate-marker');
    if (gateEl) {
      if (dispatchProgress >= 0.95 && dispatchProgress <= 1.05) {
        gateEl.classList.add('tactical-gate-pulse');
      } else {
        gateEl.classList.remove('tactical-gate-pulse');
      }
    }

    // Smooth auto-follow vehicle when actively en route in compact mini-map
    if (isEmergency && dispatchProgress > 0 && dispatchProgress < 1.0 && !isExpanded) {
      mapInstanceRef.current.panTo([posState.lat, posState.lng], {
        animate: true,
        duration: 0.25
      });
    } else if (dispatchProgress === 0 && mapInstanceRef.current && !isExpanded) {
      mapInstanceRef.current.setView([28.5028, 77.0850], 14, { animate: false });
    }
  }, [dispatchProgress, isEmergency, isExpanded]);

  // Invalidate map size on expand/collapse
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
        if (dispatchProgress > 0 && dispatchProgress < 1.0) {
          const posState = getInterpolatedRoutePosition(dispatchProgress);
          mapInstanceRef.current.panTo([posState.lat, posState.lng]);
        } else {
          mapInstanceRef.current.setView([28.5028, 77.0850], isExpanded ? 14 : 14);
        }
      }, 250);
    }
  }, [isExpanded]);

  // Zoom helpers
  const handleZoomIn = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-20 right-5 z-40 transition-all duration-200 ease-out flex flex-col select-none overflow-hidden ${
        isExpanded
          ? 'w-[520px] h-[500px] rounded-2xl shadow-2xl'
          : 'w-[290px] h-[300px] rounded-2xl shadow-xl'
      }`}
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── 1. Top HUD Strip: Compact Status & Essential Controls ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 z-20 shrink-0 border-b border-white/10"
        style={{ background: 'rgba(10, 15, 30, 0.7)' }}
      >
        {/* Left: Tiny Tactical Status Pill */}
        <div className="flex items-center gap-1.5">
          <span
            style={{
              width: '6.5px',
              height: '6.5px',
              borderRadius: '50%',
              backgroundColor: statusTelemetry.dotColor,
              boxShadow: isEmergency ? `0 0 8px ${statusTelemetry.dotColor}` : 'none',
              display: 'inline-block'
            }}
          />
          <span className="text-[10px] font-extrabold tracking-wider text-slate-200 uppercase">
            {statusTelemetry.badgeText}
          </span>
          <span className="text-[9px] font-medium text-slate-400 pl-1 border-l border-slate-700">
            REAL WORLD
          </span>
        </div>

        {/* Right: Compact Tactical Controls */}
        <div className="flex items-center gap-1">
          {/* Mute Siren (if present) */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Siren Alarm' : 'Silence Siren Alarm'}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          )}

          {/* Zoom In / Out */}
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Compact Mini-Map' : 'Expand Tactical View'}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close Mini-Map */}
          <button
            onClick={onClose}
            title="Close Tactical Mini-Map"
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Satellite Map Hero Area ── */}
      <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Optional Expanded Mode Top-Right Layer Switcher */}
        {isExpanded && (
          <div className="absolute top-2 right-2 z-10 flex items-center bg-slate-900/90 border border-slate-700/60 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                mapMode === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapMode('streets')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                mapMode === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
          </div>
        )}

        {/* 3D Campus Quick Focus Button (Subtle overlay) */}
        {onFocusCampusView && (
          <button
            onClick={onFocusCampusView}
            className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-white/10 backdrop-blur-sm text-[10px] font-semibold transition shadow-md"
            title="Focus 3D Digital Twin Camera on Campus"
          >
            <Eye className="w-3 h-3 text-blue-400" />
            <span>3D Focus</span>
          </button>
        )}
      </div>

      {/* ── 3. Bottom HUD Strip: Maximum 2 Lines Telemetry ── */}
      <div
        className="px-3 py-2 z-20 shrink-0 border-t border-white/10 flex flex-col justify-center"
        style={{ background: 'rgba(10, 15, 30, 0.85)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-100 tracking-tight leading-tight">
            {statusTelemetry.hudLine1}
          </div>
          {isEmergency && (
            <div className="text-[10px] font-mono font-bold text-amber-400">
              {Math.round(dispatchProgress * 100)}%
            </div>
          )}
        </div>
        <div className="text-[9.5px] font-medium text-slate-400 leading-tight mt-0.5 truncate">
          {statusTelemetry.hudLine2}
        </div>
      </div>
    </div>
  );
}
