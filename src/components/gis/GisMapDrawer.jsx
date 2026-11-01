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
  MapPin,
  Crosshair,
  Layers,
  Compass,
  Boxes,
  MinusSquare
} from 'lucide-react';
import {
  GIS_COORDINATES,
  ROUTE_METRICS,
  getInterpolatedRoutePosition,
  getTravelledRoute
} from './gisData';

// Custom tactical Leaflet and HUD styles
const TACTICAL_GIS_STYLES = `
  .leaflet-container {
    background-color: #0b1528 !important;
    background: #0b1528 !important;
    width: 100% !important;
    height: 100% !important;
    outline: none !important;
  }
  .leaflet-tile-pane, .leaflet-pane {
    background-color: #0b1528 !important;
  }

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
    0% { filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.7)); }
    50% { filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 8px rgba(56, 189, 248, 0.5)); }
    100% { filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.7)); }
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
  theme = 'dark',
  isOpen,
  onClose,
  emergencyStatus,
  onFocusCampusView,
  isMuted,
  onToggleMute
}) {
  const isDark = theme === 'dark';
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const gateMarkerRef = useRef(null);
  const baseRoutePolylineRef = useRef(null);
  const travelledRoutePolylineRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMode, setMapMode] = useState('satellite'); // 'satellite' | 'streets'

  const smoothProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const hasAutoExpandedRef = useRef(false);
  const hasAutoMinimizedRef = useRef(false);

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
        attributionControl: false,
        keyboard: false
      });

      // Base Satellite Tile Layer
      const baseLayer = L.tileLayer(TILE_LAYERS[mapMode].url, {
        maxZoom: 19,
        keepBuffer: 6,
        updateWhenIdle: false
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

      // 3. Hero Facility HQ Marker (TWIN with purple pin matching reference)
      const heroIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
            <div style="background: rgba(7, 18, 38, 0.92); border: 1.5px solid #00d2ff; border-radius: 9px; padding: 2px 8px; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 12px rgba(0, 210, 255, 0.45);">
              <span style="font-size: 11px;">🏢</span>
              <span style="font-size: 10px; font-weight: 800; color: #00d2ff; letter-spacing: 0.06em; font-family: monospace;">TWIN</span>
            </div>
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #a855f7; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px #a855f7; margin-top: 3px;">
              <span style="font-size: 9px; color: #ffffff;">⌂</span>
            </div>
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #a855f7;"></div>
          </div>
        `,
        iconSize: [80, 48],
        iconAnchor: [40, 48]
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
      maxZoom: 19,
      keepBuffer: 6,
      updateWhenIdle: false
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapMode]);

  // Keep target progress ref up to date with live simulation telemetry
  useEffect(() => {
    targetProgressRef.current = dispatchProgress;
  }, [dispatchProgress]);

  // Auto-Expand on movement start and Auto-Minimize on destination arrival
  useEffect(() => {
    if (!isEmergency || dispatchProgress === 0) {
      hasAutoExpandedRef.current = false;
      hasAutoMinimizedRef.current = false;
      smoothProgressRef.current = 0;
      return;
    }

    // Auto-expand when movement starts (if minimized)
    if (isEmergency && dispatchProgress > 0 && dispatchProgress < 0.98) {
      if (!hasAutoExpandedRef.current) {
        hasAutoExpandedRef.current = true;
        if (isMinimized) {
          setIsMinimized(false);
        }
        if (!isExpanded) {
          setIsExpanded(true);
        }
      }
    }

    // Auto-minimize when destination reached
    if (isEmergency && (dispatchProgress >= 0.98 || phase === 'AT_CAMPUS_GATE' || phase === 'ON_SCENE')) {
      if (!hasAutoMinimizedRef.current && hasAutoExpandedRef.current) {
        hasAutoMinimizedRef.current = true;
        const timer = setTimeout(() => {
          setIsMinimized(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isEmergency, dispatchProgress, phase, isMinimized, isExpanded]);

  // Smooth continuous 60 FPS vehicle movement along road polyline
  useEffect(() => {
    if (!isOpen) return;

    let animId = null;
    let lastTime = performance.now();

    const renderFrame = (now) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (mapInstanceRef.current && vehicleMarkerRef.current) {
        const targetP = targetProgressRef.current;
        let curP = smoothProgressRef.current;

        if (isEmergency && targetP > 0) {
          const diff = targetP - curP;
          if (diff > 0) {
            // Smoothly interpolate towards target progress without jumping
            curP = Math.min(targetP, curP + Math.max(diff * 8 * dt, (1.0 / 30.0) * dt));
          } else if (diff < 0) {
            curP = targetP;
          }
        } else {
          curP = targetP;
        }

        smoothProgressRef.current = curP;

        const posState = getInterpolatedRoutePosition(curP);

        // Update vehicle position
        vehicleMarkerRef.current.setLatLng([posState.lat, posState.lng]);

        // Smoothly rotate vehicle marker along road heading
        const el = vehicleMarkerRef.current.getElement();
        if (el) {
          const container = el.querySelector('.gis-fire-truck-container');
          if (container) {
            container.style.transform = `rotate(${posState.heading}deg)`;
          }
        }

        // Update travelled route trail
        if (travelledRoutePolylineRef.current) {
          const travelledCoords = getTravelledRoute(curP);
          travelledRoutePolylineRef.current.setLatLngs(travelledCoords);
          if (curP >= 0.98) {
            travelledRoutePolylineRef.current.setStyle({ color: '#10b981', weight: 3.5 });
          } else {
            travelledRoutePolylineRef.current.setStyle({ color: '#38bdf8', weight: 3.5 });
          }
        }

        // Gate arrival pulse
        const gateEl = document.getElementById('gis-main-gate-marker');
        if (gateEl) {
          if (curP >= 0.95 && curP <= 1.05) {
            gateEl.classList.add('tactical-gate-pulse');
          } else {
            gateEl.classList.remove('tactical-gate-pulse');
          }
        }

        // Auto-follow vehicle smoothly in compact mini-map
        if (isEmergency && curP > 0 && curP < 0.98 && !isExpanded) {
          mapInstanceRef.current.panTo([posState.lat, posState.lng], { animate: false });
        }
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, isEmergency, isExpanded]);

  // ResizeObserver: auto-detect any container dimension changes and immediately notify Leaflet
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    let rafId = null;
    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: false });
        }
      });
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Smoothly invalidate map size continuously on expand/collapse or minimize/restore during CSS transition
  useEffect(() => {
    if (!mapInstanceRef.current || isMinimized) return;

    let startTime = performance.now();
    let animId;

    const smoothlyResizeMap = (now) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: false });
      }
      if (now - startTime < 320) {
        animId = requestAnimationFrame(smoothlyResizeMap);
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: false });
        if (tileLayerRef.current && typeof tileLayerRef.current._update === 'function') {
          tileLayerRef.current._update();
        }
        if (dispatchProgress > 0 && dispatchProgress < 1.0) {
          const posState = getInterpolatedRoutePosition(dispatchProgress);
          mapInstanceRef.current.panTo([posState.lat, posState.lng]);
        } else {
          mapInstanceRef.current.setView([28.5028, 77.0850], 14);
        }
      }
    };

    animId = requestAnimationFrame(smoothlyResizeMap);

    const finishTimeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: false });
        if (tileLayerRef.current && typeof tileLayerRef.current._update === 'function') {
          tileLayerRef.current._update();
        }
      }
    }, 350);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      clearTimeout(finishTimeout);
    };
  }, [isExpanded, isMinimized]);

  // Zoom helpers
  const handleZoomIn = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([GIS_COORDINATES.FACILITY_ORIGIN.lat, GIS_COORDINATES.FACILITY_ORIGIN.lng], 15, { animate: true });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Floating HUD Button */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed top-16 sm:top-18 right-3 sm:right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: isDark ? 'rgba(7, 18, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: isDark ? '1.5px solid #00d2ff' : '1.5px solid #0284c7',
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 210, 255, 0.35)'
              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 12px rgba(2, 132, 199, 0.25)',
            fontFamily: "'Inter', system-ui, sans-serif"
          }}
          title="Restore Site Map"
        >
          <MapPin className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Site Map
          </span>
          <Maximize2 className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} ml-1`} />
        </button>
      )}

      {/* Main Map Container: kept mounted in DOM via display:none/block so Leaflet state and canvas never get destroyed */}
      <div
        onTransitionEnd={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: false });
            if (tileLayerRef.current && typeof tileLayerRef.current._update === 'function') {
              tileLayerRef.current._update();
            }
          }
        }}
        className={`fixed top-16 sm:top-18 right-3 sm:right-4 z-40 transition-all duration-300 ease-out flex flex-col select-none overflow-hidden ${
          isMinimized ? 'hidden' : 'flex'
        } ${
          isExpanded
            ? 'w-[min(440px,calc(100vw-24px))] h-[min(440px,calc(100vh-140px))]'
            : 'w-[min(230px,calc(100vw-24px))] h-[220px] sm:h-[240px]'
        }`}
        style={{
          background: isDark ? 'rgba(6, 14, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1.5px solid #00d2ff' : '1.5px solid #cbd5e1',
          boxShadow: isDark
            ? '0 12px 32px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 210, 255, 0.3)'
            : '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)',
          borderRadius: '18px',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
      {/* ── 1. Top Bar: [Location Icon + "Site Map"] on left, Window controls on right ── */}
      <div
        className="flex items-center justify-between px-3 py-2 z-20 shrink-0 transition-colors"
        style={{
          background: isDark ? 'rgba(8, 18, 36, 0.92)' : '#ffffff',
          borderBottom: isDark ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid #e2e8f0'
        }}
      >
        <div className="flex items-center gap-1.5">
          <MapPin className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Site Map
          </span>
        </div>

        {/* Window controls: Minimize to Pill / Expand/Restore Size */}
        <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {/* Minimize button: collapses into floating restore pill */}
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize to Button"
            className="text-slate-400 hover:text-sky-500 transition cursor-pointer p-0.5"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Expand / Restore size button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore Size' : 'Expand Size'}
            className="text-slate-400 hover:text-sky-500 transition cursor-pointer p-0.5"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── 2. Interactive Map Container with Floating HUD Controls ── */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#0b1528]">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

        {/* Left Floating Dock Controls: [Layers, Target/Recenter, Zoom +, Zoom -] */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
          {/* Layer switcher */}
          <button
            onClick={() => setMapMode(mapMode === 'satellite' ? 'streets' : 'satellite')}
            className={`w-7 h-7 rounded-lg backdrop-blur-md flex items-center justify-center transition shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#071328]/90 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white'
                : 'bg-white/95 hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Toggle Map Layer (Satellite / Streets)"
          >
            <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          </button>

          {/* Target / Recenter facility */}
          <button
            onClick={handleRecenter}
            className={`w-7 h-7 rounded-lg backdrop-blur-md flex items-center justify-center transition shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#071328]/90 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white'
                : 'bg-white/95 hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Recenter on Horizon Tower"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className={`w-7 h-7 rounded-lg backdrop-blur-md flex items-center justify-center transition shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#071328]/90 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white'
                : 'bg-white/95 hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className={`w-7 h-7 rounded-lg backdrop-blur-md flex items-center justify-center transition shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#071328]/90 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white'
                : 'bg-white/95 hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom-Right: 3D Focus Pill Button */}
        {onFocusCampusView && (
          <button
            onClick={onFocusCampusView}
            className={`absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#071328]/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(0,210,255,0.25)]'
                : 'bg-white/95 hover:bg-slate-50 text-slate-800 hover:text-blue-600 border border-slate-300 shadow-sm'
            }`}
            title="Focus 3D Digital Twin Camera on Campus"
          >
            <Boxes className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>3D Focus</span>
          </button>
        )}
      </div>
    </div>
    </>
  );
}
