import React, { useState, useEffect, useRef } from 'react';
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
  Flame,
  Search,
  RotateCcw
} from 'lucide-react';

// Real-World Geographic Datum Coordinates (Cyber City High-Rise Tech Hub)
const TOWER_COORDS = [28.4986, 77.0878]; // Latitude, Longitude

// Real Geospatial Urban Infrastructure Assets
const GIS_ASSETS = {
  hydrants: [
    { id: 'H-101', name: 'Hydrant #H-101 (South Plaza)', coords: [28.4982, 77.0881], pressure: '125 PSI', dist: '24m', main: '250mm Cast Iron', status: 'Operational' },
    { id: 'H-102', name: 'Hydrant #H-102 (North Access)', coords: [28.4991, 77.0875], pressure: '118 PSI', dist: '58m', main: '200mm Ductile', status: 'Operational' },
    { id: 'H-103', name: 'Hydrant #H-103 (West Perimeter)', coords: [28.4986, 77.0871], pressure: '110 PSI', dist: '46m', main: '200mm Ductile', status: 'Operational' }
  ],
  musterZones: [
    { id: 'M-A', name: 'Muster Zone A (South Plaza)', coords: [28.4978, 77.0876], cap: 350, type: 'Primary Safe Zone', status: 'Upwind • Clear' },
    { id: 'M-B', name: 'Muster Zone B (North-East Park)', coords: [28.4993, 77.0884], cap: 250, type: 'Secondary Safe Zone', status: 'Clear' }
  ],
  fireStation: {
    name: 'Fire Station #07 (Cyber City)',
    coords: [28.4935, 77.0845],
    dist: '1.4 km',
    route: 'South Boulevard via Sector 4 Flyover'
  },
  hospital: {
    name: 'Metro Trauma Center Hospital',
    coords: [28.5035, 77.0915],
    dist: '1.8 km',
    beds: '28 Critical Care Beds'
  }
};

// Road Inbound Route Path for Fire Engines (Real coordinate waypoints)
const INBOUND_ROUTE_COORDS = [
  [28.4935, 77.0845], // Fire Station 07
  [28.4948, 77.0852],
  [28.4962, 77.0862],
  [28.4975, 77.0872],
  [28.4980, 77.0876],
  [28.4982, 77.0880]  // Tower South Ingress Gate
];

export const GISCommandModal = ({
  isOpen,
  onClose,
  isGisLayerActive,
  onToggle3DGisLayer,
  onSetCameraPreset,
  rooms = []
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch', 'hydrants', 'dispersion'
  const [mapProvider, setMapProvider] = useState('satellite'); // 'satellite', 'dark', 'street'
  const [showPlume, setShowPlume] = useState(true);
  const [showHydrants, setShowHydrants] = useState(true);
  const [showGeoFences, setShowGeoFences] = useState(true);
  const [showInboundRoute, setShowInboundRoute] = useState(true);
  const [etaSeconds, setEtaSeconds] = useState(205); // ~3m 25s
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  const hasAnyFire = rooms.some(r => r.hasFire);

  // Live ETA countdown simulation for incoming fire engine
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setEtaSeconds(prev => (prev > 10 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Initialize Real Leaflet GIS Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Wait until Leaflet is available on window
    const checkLeaflet = () => {
      if (typeof window !== 'undefined' && window.L) {
        initLeafletMap(window.L);
        setIsLeafletReady(true);
      } else {
        setTimeout(checkLeaflet, 100);
      }
    };

    checkLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Leaflet map construction
  const initLeafletMap = (L) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: TOWER_COORDS,
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Custom Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. Tile Layers (Real GIS providers)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Esri World Imagery' }
    );

    const darkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd', attribution: 'CartoDB Dark Matter' }
    );

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: 'OpenStreetMap' }
    );

    // Initial base tile
    if (mapProvider === 'satellite') satelliteLayer.addTo(map);
    else if (mapProvider === 'dark') darkLayer.addTo(map);
    else streetLayer.addTo(map);

    layersRef.current.satellite = satelliteLayer;
    layersRef.current.dark = darkLayer;
    layersRef.current.street = streetLayer;

    // 2. Geofence Concentric Rings around TwinGuard Tower
    const geofenceGroup = L.layerGroup();
    // 30m Hazard Ring
    L.circle(TOWER_COORDS, {
      radius: 30,
      color: '#f97316',
      fillColor: '#f97316',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '6, 6'
    }).bindTooltip('30m Immediate Hazard Geofence', { permanent: false, direction: 'top' }).addTo(geofenceGroup);

    // 70m Triage Buffer Ring
    L.circle(TOWER_COORDS, {
      radius: 70,
      color: '#06b6d4',
      fillColor: '#06b6d4',
      fillOpacity: 0.10,
      weight: 1.8,
      dashArray: '4, 4'
    }).bindTooltip('70m Safe Triage & Assembly Buffer', { permanent: false, direction: 'top' }).addTo(geofenceGroup);

    // 120m Outer Perimeter Cordon Ring
    L.circle(TOWER_COORDS, {
      radius: 120,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: '8, 6'
    }).bindTooltip('120m Outer Traffic & Incident Cordon', { permanent: false, direction: 'top' }).addTo(geofenceGroup);

    if (showGeoFences) geofenceGroup.addTo(map);
    layersRef.current.geofences = geofenceGroup;

    // 3. Central TwinGuard Skyscraper Marker & Building Footprint
    const towerIcon = L.divIcon({
      className: 'custom-gis-pin',
      html: `
        <div style="background: rgba(2, 132, 199, 0.95); border: 2px solid #38bdf8; border-radius: 8px; padding: 4px 8px; color: white; font-family: monospace; font-size: 11px; font-weight: bold; box-shadow: 0 0 20px #0284c7; text-align: center; white-space: nowrap;">
          🏢 TWINGUARD HQ (10-STOREY)
        </div>
      `,
      iconSize: [160, 30],
      iconAnchor: [80, 15]
    });

    L.marker(TOWER_COORDS, { icon: towerIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
          <b style="color: #0284c7; font-size: 13px;">TwinGuard Cyber Skyscraper</b><br/>
          <b>Floors:</b> 10 Levels (100 Rooms)<br/>
          <b>GPS:</b> 28.4986° N, 77.0878° E<br/>
          <b>Status:</b> ${hasAnyFire ? '<span style="color:red;font-weight:bold;">FIRE ALERT ACTIVE</span>' : '<span style="color:green;font-weight:bold;">NORMAL OPERATION</span>'}<br/>
          <b>Datum:</b> WGS-84 / UTM 43N
        </div>
      `)
      .addTo(map);

    // Building Footprint Polygon (3D projection boundary on map)
    const deltaLat = 0.00035;
    const deltaLon = 0.00045;
    const towerFootprint = [
      [TOWER_COORDS[0] - deltaLat, TOWER_COORDS[1] - deltaLon],
      [TOWER_COORDS[0] + deltaLat, TOWER_COORDS[1] - deltaLon],
      [TOWER_COORDS[0] + deltaLat, TOWER_COORDS[1] + deltaLon],
      [TOWER_COORDS[0] - deltaLat, TOWER_COORDS[1] + deltaLon]
    ];
    L.polygon(towerFootprint, {
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.35,
      weight: 2
    }).addTo(map);

    // 4. Municipal Fire Hydrant Markers
    const hydrantsGroup = L.layerGroup();
    GIS_ASSETS.hydrants.forEach(h => {
      const hydIcon = L.divIcon({
        className: 'custom-hyd-pin',
        html: `
          <div style="background: #ef4444; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #ef4444; color: white; font-weight: bold; font-size: 11px;">
            💧
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker(h.coords, { icon: hydIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <b style="color: #dc2626;">${h.name}</b><br/>
            <b>Pressure:</b> ${h.pressure}<br/>
            <b>Main Pipe:</b> ${h.main}<br/>
            <b>Distance:</b> ${h.dist}<br/>
            <b>Status:</b> ${h.status}
          </div>
        `)
        .addTo(hydrantsGroup);
    });

    if (showHydrants) hydrantsGroup.addTo(map);
    layersRef.current.hydrants = hydrantsGroup;

    // 5. Emergency Assembly Muster Zones
    GIS_ASSETS.musterZones.forEach(m => {
      const musterIcon = L.divIcon({
        className: 'custom-muster-pin',
        html: `
          <div style="background: #10b981; border: 2px solid white; border-radius: 6px; padding: 2px 6px; color: white; font-family: monospace; font-size: 10px; font-weight: bold; box-shadow: 0 0 12px #10b981; white-space: nowrap;">
            🟢 ${m.name}
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });

      L.marker(m.coords, { icon: musterIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <b style="color: #059669;">${m.name}</b><br/>
            <b>Safe Capacity:</b> ${m.cap} Persons<br/>
            <b>Type:</b> ${m.type}<br/>
            <b>Wind Vector Status:</b> ${m.status}
          </div>
        `)
        .addTo(map);
    });

    // 6. Nearest Fire Station & Hospital
    const fsIcon = L.divIcon({
      className: 'custom-fs-pin',
      html: `
        <div style="background: #b91c1c; border: 2px solid #f87171; border-radius: 6px; padding: 2px 6px; color: white; font-family: monospace; font-size: 10px; font-weight: bold; box-shadow: 0 0 15px #b91c1c; white-space: nowrap;">
          🚒 FIRE STATION #07 (1.4 km)
        </div>
      `,
      iconSize: [140, 24],
      iconAnchor: [70, 12]
    });
    L.marker(GIS_ASSETS.fireStation.coords, { icon: fsIcon })
      .bindPopup(`<b>${GIS_ASSETS.fireStation.name}</b><br/>Distance: ${GIS_ASSETS.fireStation.dist}<br/>Dispatched: Engine 07 & Ladder`)
      .addTo(map);

    const hospIcon = L.divIcon({
      className: 'custom-hosp-pin',
      html: `
        <div style="background: #047857; border: 2px solid #34d399; border-radius: 6px; padding: 2px 6px; color: white; font-family: monospace; font-size: 10px; font-weight: bold; box-shadow: 0 0 15px #047857; white-space: nowrap;">
          🏥 TRAUMA CENTER (1.8 km)
        </div>
      `,
      iconSize: [140, 24],
      iconAnchor: [70, 12]
    });
    L.marker(GIS_ASSETS.hospital.coords, { icon: hospIcon })
      .bindPopup(`<b>${GIS_ASSETS.hospital.name}</b><br/>Emergency Capacity: ${GIS_ASSETS.hospital.beds}`)
      .addTo(map);

    // 7. Inbound Fire Truck Route Polyline
    const routeGroup = L.layerGroup();
    L.polyline(INBOUND_ROUTE_COORDS, {
      color: '#ef4444',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 8'
    }).addTo(routeGroup);

    if (showInboundRoute) routeGroup.addTo(map);
    layersRef.current.route = routeGroup;

    // 8. Downwind Smoke Hazard Plume Polygon (drifting South-East from Tower)
    const plumeGroup = L.layerGroup();
    const plumeCoords = [
      TOWER_COORDS,
      [TOWER_COORDS[0] - 0.0018, TOWER_COORDS[1] + 0.0028],
      [TOWER_COORDS[0] - 0.0032, TOWER_COORDS[1] + 0.0018],
      TOWER_COORDS
    ];
    L.polygon(plumeCoords, {
      color: '#f97316',
      fillColor: '#ef4444',
      fillOpacity: 0.28,
      weight: 1.5,
      dashArray: '5, 5'
    }).bindTooltip('Downwind Smoke Dispersion Sector (Avoid Evacuation Here!)', { permanent: false }).addTo(plumeGroup);

    if (showPlume && hasAnyFire) plumeGroup.addTo(map);
    layersRef.current.plume = plumeGroup;

    // Invalidate size to ensure 100% container fit
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  };

  // Dynamic Tile Layer Switching
  const handleTileSwitch = (provider) => {
    setMapProvider(provider);
    if (!mapInstanceRef.current || !layersRef.current.satellite) return;

    const map = mapInstanceRef.current;
    map.removeLayer(layersRef.current.satellite);
    map.removeLayer(layersRef.current.dark);
    map.removeLayer(layersRef.current.street);

    if (provider === 'satellite') layersRef.current.satellite.addTo(map);
    else if (provider === 'dark') layersRef.current.dark.addTo(map);
    else layersRef.current.street.addTo(map);
  };

  // Dynamic Layer Toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (layersRef.current.geofences) {
      if (showGeoFences) map.addLayer(layersRef.current.geofences);
      else map.removeLayer(layersRef.current.geofences);
    }
    if (layersRef.current.hydrants) {
      if (showHydrants) map.addLayer(layersRef.current.hydrants);
      else map.removeLayer(layersRef.current.hydrants);
    }
    if (layersRef.current.route) {
      if (showInboundRoute) map.addLayer(layersRef.current.route);
      else map.removeLayer(layersRef.current.route);
    }
    if (layersRef.current.plume) {
      if (showPlume && hasAnyFire) map.addLayer(layersRef.current.plume);
      else map.removeLayer(layersRef.current.plume);
    }
  }, [showGeoFences, showHydrants, showInboundRoute, showPlume, hasAnyFire]);

  // Recenter Map on Tower
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(TOWER_COORDS, 17, { animate: true, duration: 1 });
    }
  };

  if (!isOpen) return null;

  const formatEta = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-6xl max-h-[95vh] rounded-2xl border border-cyan-500/50 shadow-[0_0_60px_rgba(0,240,255,0.3)] flex flex-col overflow-hidden bg-slate-950/95">
        
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/30 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-hud font-bold text-base tracking-wider text-white">
                  REAL GIS GEOSPATIAL COMMAND CENTER
                </h2>
                <span className="badge-tech bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px]">
                  LIVE LEAFLET GIS ENGINE
                </span>
                <span className="badge-tech bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 text-[10px]">
                  ESRI SATELLITE & OSM TILES
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Real-Time Earth Observation • Urban Hydrant Network • Live Spatial Incident Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Geodetic Coordinate Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 py-2 bg-slate-900/60 border-b border-slate-800 text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Real GPS Lat/Lon</span>
              <span className="text-white font-bold">28.4986° N, 77.0878° E</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Geodetic Datum</span>
              <span className="text-white font-bold">WGS 84 • UTM 43N</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Atmospheric Wind</span>
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
              <span className="text-slate-400 block text-[9px] uppercase font-hud">Urban Sector</span>
              <span className="text-amber-300 font-bold">CYBER HUB PLOT 12</span>
            </div>
          </div>
        </div>

        {/* 3. Main Body: Split Real Leaflet Map & Data Panels */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-[480px]">
          
          {/* Left Column: Real Leaflet GIS Map Container (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            
            {/* Map Top Bar Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-hud font-bold text-cyan-300">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span>INTERACTIVE SATELLITE & CADASTRAL GIS MAP</span>
              </div>

              {/* Real Tile Layer Switcher */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  onClick={() => handleTileSwitch('satellite')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    mapProvider === 'satellite'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  🛰️ Esri Satellite
                </button>
                <button
                  onClick={() => handleTileSwitch('dark')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    mapProvider === 'dark'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  🌃 Dark Matter
                </button>
                <button
                  onClick={() => handleTileSwitch('street')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    mapProvider === 'street'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  🗺️ Street OSM
                </button>
              </div>
            </div>

            {/* Real Interactive Leaflet Container */}
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-cyan-500/50 shadow-2xl bg-slate-950">
              <div ref={mapContainerRef} className="w-full h-full z-10" />

              {/* Loading indicator if Leaflet is mounting */}
              {!isLeafletReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20 text-cyan-300 font-mono text-xs">
                  <span>Loading Real Earth Satellite GIS Tiles...</span>
                </div>
              )}

              {/* Real Map Floating Controls */}
              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                <button
                  onClick={handleRecenter}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-cyan-300 border border-cyan-500/50 text-[10px] font-mono font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all"
                  title="Recenter Map on TwinGuard Tower"
                >
                  <RotateCcw className="w-3 h-3" /> Recenter Tower
                </button>
              </div>

              {/* Interactive Layer Filter Pills (Floating bottom-right of map) */}
              <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-slate-950/90 border border-slate-700/80 rounded-lg p-1 text-[10px] font-mono backdrop-blur-md shadow-xl">
                <button
                  onClick={() => setShowPlume(!showPlume)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showPlume ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  Smoke Plume
                </button>
                <button
                  onClick={() => setShowHydrants(!showHydrants)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showHydrants ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  Hydrants
                </button>
                <button
                  onClick={() => setShowGeoFences(!showGeoFences)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showGeoFences ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  Geofences
                </button>
                <button
                  onClick={() => setShowInboundRoute(!showInboundRoute)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    showInboundRoute ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  Inbound Route
                </button>
              </div>
            </div>

            {/* Quick 3D Viewport Synchronized Actions */}
            <div className="flex items-center gap-2 text-xs font-mono mt-1">
              <span className="text-slate-400 font-hud text-[10px] uppercase">3D Camera Fly-to:</span>
              <button
                onClick={() => onSetCameraPreset('GIS_SATELLITE')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3 h-3" /> Satellite Top-Down
              </button>
              <button
                onClick={() => onSetCameraPreset('FOCUS_HYDRANT')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Droplets className="w-3 h-3" /> Hydrant #101
              </button>
              <button
                onClick={() => onSetCameraPreset('FOCUS_MUSTER_A')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" /> Muster Zone A
              </button>
              <button
                onClick={() => onSetCameraPreset('FOCUS_HELIPAD')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Navigation className="w-3 h-3" /> Roof Helipad
              </button>
            </div>
          </div>

          {/* Right Column: Tabbed GIS Infrastructure & Dispatch Telemetry (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
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
              <div className="flex flex-col gap-2 text-xs">
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
                      <span className="text-white font-bold">1.4 km (South Blvd)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Inbound ETA</span>
                      <span className="text-red-400 font-bold text-sm">{formatEta(etaSeconds)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Apparatus</span>
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
                      <span className="text-white font-bold">1.8 km (West Link)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-hud">Ambulances</span>
                      <span className="text-emerald-400 font-bold">3 Units Standby</span>
                    </div>
                  </div>
                </div>

                {/* Municipal Police Cordon */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span className="font-hud font-bold text-slate-300 block">SECTOR 4 TRAFFIC PERIMETER</span>
                    <span className="text-slate-400 text-[10px]">South Blvd traffic diverted for emergency ingress</span>
                  </div>
                  <span className="text-cyan-400 font-bold">ACTIVE CORDON</span>
                </div>
              </div>
            )}

            {/* TAB 2: Municipal Water & Hydrant Network */}
            {activeTab === 'hydrants' && (
              <div className="flex flex-col gap-2 text-xs">
                {/* Static Water Reservoir */}
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-hud font-bold text-cyan-300">UNDERGROUND STATIC FIRE RESERVOIR</span>
                    <span className="font-mono text-emerald-400 font-bold text-xs">98% FULL</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mb-2">
                    Volume: <b className="text-white">450,000 Liters</b> Dedicated Standpipe Reserve (Dual Booster Pumps Active)
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-[98%]" />
                  </div>
                </div>

                {/* Hydrant Cards */}
                <div className="flex flex-col gap-2">
                  {GIS_ASSETS.hydrants.map(h => (
                    <div key={h.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-hud font-bold text-white flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-red-400" />
                          <span>{h.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Dist: {h.dist} • Main: {h.main} • Status: {h.status}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-emerald-400 font-bold text-xs">{h.pressure}</div>
                        <button
                          onClick={() => {
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.flyTo(h.coords, 18, { animate: true });
                            }
                            onSetCameraPreset('FOCUS_HYDRANT');
                          }}
                          className="text-[9px] text-cyan-400 hover:underline"
                        >
                          [Focus in GIS & 3D]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Atmospheric Smoke Dispersion Model */}
            {activeTab === 'dispersion' && (
              <div className="flex flex-col gap-2 text-xs">
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
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Municipal GIS Node: <b>DL-ND-8492</b></span>
            <span>•</span>
            <span className="text-cyan-400">Press 'G' anytime to toggle Real GIS Command</span>
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
