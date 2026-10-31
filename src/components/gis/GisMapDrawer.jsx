import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Maximize2,
  Minimize2,
  Layers,
  Flame,
  Truck,
  Building2,
  ShieldAlert,
  Clock,
  Compass,
  AlertTriangle,
  Radio,
  Eye,
  MapPin,
  Volume2,
  VolumeX,
  Navigation
} from 'lucide-react';
import {
  GIS_COORDINATES,
  GIS_DATA_NOTICE,
  ROUTE_METRICS,
  getInterpolatedRoutePosition,
  getTravelledRoute
} from './gisData';

// Custom CSS for Leaflet pulsars and realistic SVG fire-engine icon
const LEAFLET_CUSTOM_STYLES = `
  .gis-pulse-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    position: relative;
  }
  .gis-pulse-fire {
    width: 28px;
    height: 28px;
    background: rgba(239, 68, 68, 0.9);
    border: 2px solid #ffffff;
    box-shadow: 0 0 14px rgba(239, 68, 68, 0.9);
  }
  .gis-pulse-muster {
    width: 24px;
    height: 24px;
    background: rgba(16, 185, 129, 0.9);
    border: 2px solid #ffffff;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
  }
  .gis-pulse-station {
    width: 28px;
    height: 28px;
    background: rgba(59, 130, 246, 0.9);
    border: 2px solid #ffffff;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
  }
  .gis-pulse-gate {
    width: 26px;
    height: 26px;
    background: rgba(168, 85, 247, 0.9);
    border: 2px solid #ffffff;
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.8);
  }
  .gis-fire-truck-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));
    transition: transform 0.15s linear;
  }
  .gis-strobe-blinker {
    animation: strobeBlink 0.35s infinite alternate;
  }
  @keyframes strobeBlink {
    0% { fill: #ef4444; filter: drop-shadow(0 0 2px #ef4444); }
    100% { fill: #3b82f6; filter: drop-shadow(0 0 8px #60a5fa); }
  }
  .leaflet-popup-content-wrapper {
    background: #0f172a !important;
    color: #f1f5f9 !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6) !important;
  }
  .leaflet-popup-tip {
    background: #0f172a !important;
  }
`;

/**
 * Generate a sharp, recognizable vector SVG Fire Truck icon
 * Direction of vehicle cab is pointing UP (0 deg) so rotate(heading) aligns perfectly
 */
function createFireTruckSvg(headingDeg = 0) {
  return `
    <div class="gis-fire-truck-container" style="transform: rotate(${headingDeg}deg);">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Wheels -->
        <rect x="7" y="6" width="3" height="7" rx="1.5" fill="#1e293b" />
        <rect x="30" y="6" width="3" height="7" rx="1.5" fill="#1e293b" />
        <rect x="7" y="27" width="3" height="7" rx="1.5" fill="#1e293b" />
        <rect x="30" y="27" width="3" height="7" rx="1.5" fill="#1e293b" />
        
        <!-- Truck Body (Red Pumper) -->
        <rect x="9" y="4" width="22" height="32" rx="4" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        
        <!-- Silver Equipment Compartments -->
        <rect x="11" y="16" width="18" height="18" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
        <line x1="11" y1="22" x2="29" y2="22" stroke="#94a3b8" stroke-width="1" />
        <line x1="11" y1="28" x2="29" y2="28" stroke="#94a3b8" stroke-width="1" />
        
        <!-- Aerial Ladder Structure -->
        <rect x="17" y="14" width="6" height="20" rx="1" fill="#cbd5e1" stroke="#475569" stroke-width="0.8" />
        <line x1="17" y1="18" x2="23" y2="18" stroke="#475569" stroke-width="1" />
        <line x1="17" y1="22" x2="23" y2="22" stroke="#475569" stroke-width="1" />
        <line x1="17" y1="26" x2="23" y2="26" stroke="#475569" stroke-width="1" />
        <line x1="17" y1="30" x2="23" y2="30" stroke="#475569" stroke-width="1" />
        
        <!-- Front Cab Windshield -->
        <path d="M12 11C12 8 13.5 6 20 6C26.5 6 28 8 28 11L28 13H12L12 11Z" fill="#0f172a" />
        <rect x="13" y="8" width="14" height="4" rx="1" fill="#38bdf8" fill-opacity="0.85" />
        
        <!-- High-Intensity Emergency Light Bar -->
        <rect x="15" y="4" width="10" height="2.5" rx="1" class="gis-strobe-blinker" />
        
        <!-- Yellow Reflective Warning Chevron at Rear -->
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
  const baseRoutePolylineRef = useRef(null);
  const travelledRoutePolylineRef = useRef(null);
  const geofenceRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [mapMode, setMapMode] = useState('satellite'); // 'satellite' | 'streets' | 'hybrid'
  const [isExpanded, setIsExpanded] = useState(false);

  // Authoritative simulation state from emergencyStatus
  const isEmergency = Boolean(emergencyStatus && emergencyStatus.isActive);
  const dispatchProgress = emergencyStatus ? (emergencyStatus.gisProgress ?? (emergencyStatus.progress / 100)) : 0;
  const dispatchEta = emergencyStatus?.etaSeconds ?? (isEmergency ? 30 : 0);
  const phase = emergencyStatus?.phase ?? (isEmergency ? 'EN_ROUTE' : 'STANDBY');
  const assignedGateName = emergencyStatus?.targetGate?.name ?? 'South Main Entrance';

  // Tile layers definition
  const TILE_LAYERS = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Imagery, DigitalGlobe, GeoEye, Earthstar Geographics'
    },
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    },
    hybrid: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Imagery & OpenStreetMap'
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Inject stylesheet
      const styleEl = document.createElement('style');
      styleEl.innerHTML = LEAFLET_CUSTOM_STYLES;
      document.head.appendChild(styleEl);

      const map = L.map(mapContainerRef.current, {
        center: [28.5028, 77.0850], // Centered between fire station and campus
        zoom: 14,
        minZoom: 12,
        maxZoom: 18,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Base Tile Layer
      const baseLayer = L.tileLayer(TILE_LAYERS[mapMode].url, {
        attribution: TILE_LAYERS[mapMode].attribution,
        maxZoom: 19
      }).addTo(map);
      tileLayerRef.current = baseLayer;

      // Geofence Polygon
      const geofence = L.polygon(GIS_COORDINATES.CAMPUS_GEOFENCE, {
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#3b82f6',
        fillOpacity: 0.12
      }).addTo(map);
      geofence.bindTooltip('TwinGuard Campus Geofence Boundary', { sticky: true });
      geofenceRef.current = geofence;

      // Layer group for stationary points
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      // 1. Facility Main Building Marker
      const heroIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="gis-pulse-marker gis-pulse-fire" title="Facility Center">
                <span style="font-size: 13px;">🏢</span>
              </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const heroMarker = L.marker(
        [GIS_COORDINATES.FACILITY_ORIGIN.lat, GIS_COORDINATES.FACILITY_ORIGIN.lng],
        { icon: heroIcon }
      ).addTo(markersGroup);
      heroMarker.bindPopup(`
        <div style="font-family: sans-serif; line-height: 1.4;">
          <strong style="color: #60a5fa; font-size: 13px;">${GIS_COORDINATES.FACILITY_ORIGIN.name}</strong><br/>
          <span style="color: #94a3b8;">${GIS_COORDINATES.FACILITY_ORIGIN.zone}</span><br/>
          <div style="margin-top: 6px; padding: 4px; background: rgba(255,255,255,0.08); border-radius: 4px;">
            Digital Twin Core Status: <b style="color: ${isEmergency ? '#ef4444' : '#10b981'};">${isEmergency ? 'HAZARD EVACUATION' : 'NORMAL SECURE'}</b>
          </div>
        </div>
      `);

      // 2. Authoritative Campus Main Gate Marker
      const mainGateCoord = GIS_COORDINATES.CAMPUS_GATES[0]; // South Main Portal
      const gateIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="gis-pulse-marker gis-pulse-gate" title="${mainGateCoord.name}">
                <span style="font-size: 12px; color: #fff; font-weight: bold;">🚪</span>
              </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      const gateMarker = L.marker([mainGateCoord.lat, mainGateCoord.lng], { icon: gateIcon }).addTo(markersGroup);
      gateMarker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong style="color: #c084fc;">${mainGateCoord.name}</strong><br/>
          <span style="color: #cbd5e1;">Digital Twin Hand-off Point</span><br/>
          <span style="color: #94a3b8; font-size: 11px;">Coordinates: ${mainGateCoord.lat.toFixed(6)}, ${mainGateCoord.lng.toFixed(6)}</span>
        </div>
      `);

      // 3. Fire Station #07
      const fireStation = GIS_COORDINATES.MUNICIPAL_SERVICES[0];
      const stationIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="gis-pulse-marker gis-pulse-station" title="${fireStation.name}">
                <span style="font-size: 13px;">🚒</span>
              </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const stationMarker = L.marker([fireStation.lat, fireStation.lng], { icon: stationIcon }).addTo(markersGroup);
      stationMarker.bindPopup(`
        <div>
          <strong style="color: #93c5fd;">${fireStation.name}</strong><br/>
          <span style="color: #cbd5e1;">Road Distance: <b>${(ROUTE_METRICS.totalMeters / 1000).toFixed(2)} km</b></span><br/>
          <span style="color: #cbd5e1;">Nominal ETA: <b>30s simulation</b></span><br/>
          <span style="color: #94a3b8; font-size: 11px;">Tactical Units: ${fireStation.units.join(', ')}</span>
        </div>
      `);

      // 4. Muster Points
      GIS_COORDINATES.MUSTER_POINTS.forEach(pt => {
        const musterIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="gis-pulse-marker gis-pulse-muster" title="${pt.name}">
                  <span style="font-size: 12px; color: #fff; font-weight: bold;">M</span>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const m = L.marker([pt.lat, pt.lng], { icon: musterIcon }).addTo(markersGroup);
        m.bindPopup(`
          <div style="font-family: sans-serif;">
            <strong style="color: #34d399;">${pt.name}</strong><br/>
            <span style="color: #cbd5e1;">Designated Capacity: <b>${pt.capacity} persons</b></span><br/>
            <span style="color: #94a3b8; font-size: 11px;">${pt.notes}</span>
          </div>
        `);
      });

      // 5. Real Road Route Base Polyline (Subtle amber/gray dashed backdrop)
      const baseRoute = L.polyline(GIS_COORDINATES.DISPATCH_ROUTE, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.4,
        dashArray: '6, 6',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      baseRoutePolylineRef.current = baseRoute;

      // 6. Travelled Route Polyline (High-intensity illuminated solid line)
      const initialTravelled = getTravelledRoute(dispatchProgress);
      const travelledRoute = L.polyline(initialTravelled, {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      travelledRoutePolylineRef.current = travelledRoute;

      // 7. Realistic Fire Engine Marker with Dynamic Heading
      const initialVehicleState = getInterpolatedRoutePosition(dispatchProgress);
      const vehicleIcon = L.divIcon({
        className: 'custom-div-icon',
        html: createFireTruckSvg(initialVehicleState.heading),
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      const vehicleMarker = L.marker([initialVehicleState.lat, initialVehicleState.lng], {
        icon: vehicleIcon,
        zIndexOffset: 1000
      }).addTo(map);
      vehicleMarker.bindPopup(`
        <div>
          <strong style="color: #ef4444;">Fire Squad Engine #07</strong><br/>
          <span style="color: #e2e8f0;">Status: <b>${phase}</b></span><br/>
          <span style="color: #cbd5e1;">Target: <b>South Main Ceremonial Gate</b></span><br/>
          <span style="color: #94a3b8; font-size: 10px;">${GIS_DATA_NOTICE}</span>
        </div>
      `);
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
      attribution: TILE_LAYERS[mapMode].attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapMode]);

  // Update Emergency Vehicle Position, Heading & Travelled Trail in Real-Time
  useEffect(() => {
    if (!mapInstanceRef.current || !vehicleMarkerRef.current) return;
    const posState = getInterpolatedRoutePosition(dispatchProgress);

    // Update coordinates
    vehicleMarkerRef.current.setLatLng([posState.lat, posState.lng]);

    // Update dynamic SVG rotation based on road heading
    const updatedIcon = L.divIcon({
      className: 'custom-div-icon',
      html: createFireTruckSvg(posState.heading),
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    vehicleMarkerRef.current.setIcon(updatedIcon);

    // Update travelled route trail
    if (travelledRoutePolylineRef.current) {
      const travelledCoords = getTravelledRoute(dispatchProgress);
      travelledRoutePolylineRef.current.setLatLngs(travelledCoords);

      if (dispatchProgress >= 1.0) {
        travelledRoutePolylineRef.current.setStyle({ color: '#10b981', weight: 5 });
      } else {
        travelledRoutePolylineRef.current.setStyle({ color: '#38bdf8', weight: 5 });
      }
    }
  }, [dispatchProgress]);

  // Invalidate map size on expand/collapse
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [isExpanded]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-16 right-0 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl border-l border-slate-700/60 bg-slate-900/95 backdrop-blur-md text-slate-100 ${
        isExpanded
          ? 'w-[780px] h-[calc(100vh-4rem)]'
          : 'w-[440px] h-[calc(100vh-4.5rem)]'
      }`}
      style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-wide text-white uppercase">
                Satellite GIS Mini-Map
              </h2>
              <span
                className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                  dispatchProgress >= 1.0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isEmergency
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {dispatchProgress >= 1.0 ? 'At Campus Gate' : isEmergency ? 'City Dispatch' : 'Standby'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sector 28 • Real Road Route to Digital Twin
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Mute Siren Button */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Siren Alarm' : 'Silence Siren Alarm'}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore Panel' : 'Maximize Panel'}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close GIS Panel"
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-red-500/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Mode Selector & Actions Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setMapMode('satellite')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              mapMode === 'satellite'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapMode('streets')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              mapMode === 'streets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setMapMode('hybrid')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              mapMode === 'hybrid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hybrid
          </button>
        </div>

        {/* Focus 3D Campus Button */}
        {onFocusCampusView && (
          <button
            onClick={onFocusCampusView}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition text-[11px]"
            title="Synchronize 3D Camera with Master Campus Overview"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Campus 3D Focus</span>
          </button>
        )}
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 w-full bg-slate-950 min-h-[260px]">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Simulation Watermark / Badge */}
        <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-black/75 backdrop-blur-sm border border-amber-500/30 text-[10px] text-amber-300 font-mono tracking-wide flex items-center space-x-1 shadow">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>SIMULATION: REAL ROAD DISPATCH (2.7 KM)</span>
        </div>

        {/* Mini Legend overlay */}
        <div className="absolute bottom-3 left-2 z-10 px-2.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] space-y-1 shadow-lg pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white inline-block"></span>
            <span className="text-slate-300">Hero Facility HQ</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white inline-block"></span>
            <span className="text-slate-300">Campus Main Gate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white inline-block"></span>
            <span className="text-slate-300">Station #07 (Origin)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-1 bg-sky-400 rounded inline-block"></span>
            <span className="text-slate-300">Travelled Road Trail</span>
          </div>
        </div>
      </div>

      {/* Bottom Emergency Dispatch Intelligence Panel */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3 z-10 relative">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`p-1.5 rounded ${
                dispatchProgress >= 1.0
                  ? 'bg-purple-500/20 text-purple-400'
                  : isEmergency
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                {dispatchProgress >= 1.0
                  ? 'CAMPUS GATE REACHED • HANDOFF'
                  : isEmergency
                  ? 'REAL ROAD DISPATCH EN ROUTE'
                  : 'DISPATCH STANDBY'}
              </div>
              <div className="text-[11px] text-slate-400">
                Fire Squad Engine #07 • Ladder 2
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Simulated Road ETA</div>
            <div
              className={`text-sm font-bold font-mono ${
                dispatchProgress >= 1.0
                  ? 'text-purple-400'
                  : dispatchEta <= 10
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {dispatchProgress >= 1.0 ? 'AT GATE (0s)' : `${Math.ceil(dispatchEta)}s`}
            </div>
          </div>
        </div>

        {/* Timeline Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Station #07</span>
            <span>Road Traversal: {Math.round(dispatchProgress * 100)}% ({((dispatchProgress * ROUTE_METRICS.totalMeters) / 1000).toFixed(2)} km)</span>
            <span>South Main Gate</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-150 ease-out ${
                dispatchProgress >= 1.0
                  ? 'bg-purple-500'
                  : 'bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, dispatchProgress * 100))}%` }}
            />
          </div>
        </div>

        {/* Detailed Meta Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-900 text-[11px]">
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Destination</span>
            <span className="font-semibold text-slate-200">
              South Main Gate
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Siren Alarm</span>
            <span className={`font-semibold ${!isMuted ? 'text-amber-400' : 'text-slate-400'}`}>
              {!isMuted ? 'ACTIVE (Siren)' : 'MUTED'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Handoff Status</span>
            <span className={`font-semibold ${dispatchProgress >= 1.0 ? 'text-purple-400' : 'text-slate-200'}`}>
              {dispatchProgress >= 1.0 ? '3D Twin Active' : 'En Route (2.7 km)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
