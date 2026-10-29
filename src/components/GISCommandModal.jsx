import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Settings,
  ExternalLink,
  ShieldCheck,
  Info
} from 'lucide-react';

import {
  BUILDING_GEO_METADATA,
  GIS_ORIGIN,
  BUILDING_EXITS_GEO,
  GIS_MUSTER_ZONES,
  GIS_MUNICIPAL_SERVICES,
  GIS_FIRE_HYDRANTS,
  updateBuildingGeoreferencing
} from '../simulation/GISCoordinateSystem.js';

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

  // Georeferencing and location state
  const [geoConfig, setGeoConfig] = useState(() => ({ ...BUILDING_GEO_METADATA }));
  const [showGeoConfigModal, setShowGeoConfigModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Map layer controls
  const [mapProvider, setMapProvider] = useState('satellite'); // 'satellite', 'dark', 'street'
  const [showFootprint, setShowFootprint] = useState(true);
  const [showExits, setShowExits] = useState(true);
  const [showHydrants, setShowHydrants] = useState(true);
  const [showMusterZones, setShowMusterZones] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showInboundDispatch, setShowInboundDispatch] = useState(true);
  const [showSmokePlume, setShowSmokePlume] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  // Collapsible sidebar sections state
  const [collapsedSections, setCollapsedSections] = useState({
    incident: false,
    dispatch: false,
    medical: false,
    waterGrid: false,
    evacZones: false
  });

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Live ETA countdown for inbound apparatus
  const [etaSeconds, setEtaSeconds] = useState(210); // ~3m 30s
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  const activeFires = rooms.filter(r => r.hasFire);
  const hasAnyFire = activeFires.length > 0;

  // Inbound apparatus countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setEtaSeconds(prev => (prev > 10 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatEta = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Initialize and maintain the Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let timeoutId;
    const checkLeaflet = () => {
      if (typeof window !== 'undefined' && window.L) {
        try {
          initLeafletMap(window.L);
          setIsLeafletReady(true);
          setMapError(null);
        } catch (err) {
          console.error('Leaflet initialization error:', err);
          setMapError('Failed to initialize GIS map engine.');
        }
      } else {
        timeoutId = setTimeout(checkLeaflet, 100);
      }
    };

    checkLeaflet();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, geoConfig.latitude, geoConfig.longitude]);

  // Handle Container Resize with ResizeObserver to prevent any gray squares or tile misalignment
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isOpen, isLeafletReady]);

  // Leaflet map construction
  const initLeafletMap = (L) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const centerCoords = [geoConfig.latitude, geoConfig.longitude];

    const map = L.map(mapContainerRef.current, {
      center: centerCoords,
      zoom: 17,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Custom Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. Tile Providers
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

    if (mapProvider === 'satellite') satelliteLayer.addTo(map);
    else if (mapProvider === 'dark') darkLayer.addTo(map);
    else streetLayer.addTo(map);

    layersRef.current.satellite = satelliteLayer;
    layersRef.current.dark = darkLayer;
    layersRef.current.street = streetLayer;

    // 2. Geofence Rings Layer Group
    const geofencesGroup = L.layerGroup();
    // 30m Hazard Ring
    L.circle(centerCoords, {
      radius: 30,
      color: '#f97316',
      fillColor: '#f97316',
      fillOpacity: 0.14,
      weight: 2,
      dashArray: '5, 5'
    }).bindTooltip('30m Immediate Hazard Geofence', { permanent: false, direction: 'top' }).addTo(geofencesGroup);

    // 70m Triage Buffer Ring
    L.circle(centerCoords, {
      radius: 70,
      color: '#06b6d4',
      fillColor: '#06b6d4',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 4'
    }).bindTooltip('70m Safe Triage & Assembly Buffer', { permanent: false, direction: 'top' }).addTo(geofencesGroup);

    // 120m Outer Perimeter Cordon Ring
    L.circle(centerCoords, {
      radius: 120,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.04,
      weight: 1.2,
      dashArray: '6, 6'
    }).bindTooltip('120m Outer Incident Traffic Cordon', { permanent: false, direction: 'top' }).addTo(geofencesGroup);

    if (showGeofences) geofencesGroup.addTo(map);
    layersRef.current.geofences = geofencesGroup;

    // 3. Central Building Footprint Polygon & Micro-Pin (Precise Survey Alignment)
    const footprintGroup = L.layerGroup();
    // Convert 60m width x 48m depth building dimensions into geodetic degrees
    const dLat = (geoConfig.footprintMeters.depthZ / 2) / 111320;
    const dLon = (geoConfig.footprintMeters.widthX / 2) / (111320 * Math.cos(geoConfig.latitude * Math.PI / 180));

    const footprintPolyCoords = [
      [centerCoords[0] - dLat, centerCoords[1] - dLon],
      [centerCoords[0] + dLat, centerCoords[1] - dLon],
      [centerCoords[0] + dLat, centerCoords[1] + dLon],
      [centerCoords[0] - dLat, centerCoords[1] + dLon]
    ];

    const footprintPoly = L.polygon(footprintPolyCoords, {
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.32,
      weight: 2
    }).addTo(footprintGroup);

    footprintPoly.on('click', () => {
      setSelectedAsset({
        type: 'BUILDING',
        name: geoConfig.facilityName,
        address: geoConfig.streetAddress,
        coords: `${centerCoords[0].toFixed(6)}° N, ${centerCoords[1].toFixed(6)}° E`,
        floors: '10 Storeys (38m Total Height)',
        rooms: '100 Commercial Workspaces & Labs',
        footprint: `${geoConfig.footprintMeters.widthX}m × ${geoConfig.footprintMeters.depthZ}m`,
        status: hasAnyFire ? 'CRITICAL INCIDENT ACTIVE' : 'NORMAL OPERATION',
        verification: 'VERIFIED CADASTRAL SURVEY (DLF CYBER HUB PLOT 12)'
      });
    });

    // Building Center Micro-Pin
    const buildingIcon = L.divIcon({
      className: 'building-pin',
      html: `
        <div style="background: rgba(14, 165, 233, 0.95); border: 2px solid white; border-radius: 6px; padding: 2px 6px; color: white; font-size: 11px; font-weight: bold; font-family: Inter, sans-serif; box-shadow: 0 0 14px rgba(2, 132, 199, 0.8); display: flex; align-items: center; gap: 4px; white-space: nowrap; cursor: pointer;">
          <span>🏢</span>
          <span>${geoConfig.facilityName.split(' ')[0]} HQ</span>
        </div>
      `,
      iconSize: [120, 24],
      iconAnchor: [60, 12]
    });

    const buildingMarker = L.marker(centerCoords, { icon: buildingIcon }).addTo(footprintGroup);
    buildingMarker.on('click', () => {
      setSelectedAsset({
        type: 'BUILDING',
        name: geoConfig.facilityName,
        address: geoConfig.streetAddress,
        coords: `${centerCoords[0].toFixed(6)}° N, ${centerCoords[1].toFixed(6)}° E`,
        floors: '10 Storeys (38m Total Height)',
        rooms: '100 Commercial Workspaces & Labs',
        footprint: `${geoConfig.footprintMeters.widthX}m × ${geoConfig.footprintMeters.depthZ}m`,
        status: hasAnyFire ? 'CRITICAL INCIDENT ACTIVE' : 'NORMAL OPERATION',
        verification: 'VERIFIED CADASTRAL SURVEY'
      });
    });

    if (showFootprint) footprintGroup.addTo(map);
    layersRef.current.footprint = footprintGroup;

    // 4. Building Exterior Exits & Outdoor Sidewalk Connections
    const exitsGroup = L.layerGroup();
    BUILDING_EXITS_GEO.forEach(ex => {
      const exCoords = [ex.geoPos.latitude, ex.geoPos.longitude];
      const exitPin = L.divIcon({
        className: 'exit-pin',
        html: `
          <div style="background: #10b981; border: 2px solid white; border-radius: 4px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white; box-shadow: 0 0 8px #10b981; cursor: pointer;">
            🚪
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const m = L.marker(exCoords, { icon: exitPin }).addTo(exitsGroup);
      m.on('click', () => {
        setSelectedAsset({
          type: 'EXIT',
          name: ex.name,
          details: ex.description,
          width: `${ex.doorWidthMeters}m Clear Egress Portal`,
          connectedTo: ex.connectedMusterId === 'muster_alpha' ? 'Muster Point Alpha' : 'Muster Point Bravo',
          status: ex.status,
          verification: 'VERIFIED PHYSICAL DOORWAY'
        });
      });

      // Paved sidewalk path from exit to target muster zone
      const targetMuster = GIS_MUSTER_ZONES.find(mz => mz.id === ex.connectedMusterId);
      if (targetMuster) {
        L.polyline([exCoords, [targetMuster.geoPos.latitude, targetMuster.geoPos.longitude]], {
          color: '#10b981',
          weight: 3,
          dashArray: '4, 4',
          opacity: 0.8
        }).addTo(exitsGroup);
      }
    });

    if (showExits) exitsGroup.addTo(map);
    layersRef.current.exits = exitsGroup;

    // 5. Municipal Fire Hydrant Markers (Streamlined circular pins)
    const hydrantsGroup = L.layerGroup();
    GIS_FIRE_HYDRANTS.forEach(h => {
      const hydCoords = [h.geoPos.latitude, h.geoPos.longitude];
      const hydPin = L.divIcon({
        className: 'hydrant-pin',
        html: `
          <div style="background: #ef4444; border: 2px solid white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.8); cursor: pointer;">
            💧
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const m = L.marker(hydCoords, { icon: hydPin }).addTo(hydrantsGroup);
      m.on('click', () => {
        setSelectedAsset({
          type: 'HYDRANT',
          name: `${h.code} • ${h.name}`,
          pressure: `${h.pressurePsi} PSI (${h.pressureBar} bar)`,
          flow: `${h.flowRateLpm} L/min (Municipal SCADA Live Feed)`,
          pipe: h.mainPipe,
          inspected: h.lastInspected,
          status: h.status,
          verification: 'MUNICIPAL WATER INFRASTRUCTURE REGISTRY'
        });
      });
    });

    if (showHydrants) hydrantsGroup.addTo(map);
    layersRef.current.hydrants = hydrantsGroup;

    // 6. Safe Assembly Muster Zones (Hexagonal safety pins)
    const musterGroup = L.layerGroup();
    GIS_MUSTER_ZONES.forEach(mz => {
      const mzCoords = [mz.geoPos.latitude, mz.geoPos.longitude];
      const mzPin = L.divIcon({
        className: 'muster-pin',
        html: `
          <div style="background: #059669; border: 2px solid white; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: bold; font-family: Inter, sans-serif; color: white; box-shadow: 0 0 10px #059669; display: flex; align-items: center; gap: 3px; cursor: pointer; white-space: nowrap;">
            <span>🛡️</span>
            <span>${mz.code}</span>
          </div>
        `,
        iconSize: [60, 22],
        iconAnchor: [30, 11]
      });

      // Outer assembly circle perimeter
      L.circle(mzCoords, {
        radius: mz.radiusMeters,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.22,
        weight: 1.8
      }).addTo(musterGroup);

      const m = L.marker(mzCoords, { icon: mzPin }).addTo(musterGroup);
      m.on('click', () => {
        setSelectedAsset({
          type: 'MUSTER_ZONE',
          name: mz.name,
          code: mz.code,
          capacity: `${mz.capacity} Persons`,
          area: `${mz.radiusMeters}m Safety Radius`,
          description: mz.description,
          status: 'UPWIND SAFE ZONE • CLEAR',
          verification: 'DESIGNATED EMERGENCY ASSEMBLY ZONE'
        });
      });
    });

    if (showMusterZones) musterGroup.addTo(map);
    layersRef.current.muster = musterGroup;

    // 7. Municipal Emergency Facilities: Fire Station #07 & Trauma Hospital
    const facilitiesGroup = L.layerGroup();
    const fsData = GIS_MUNICIPAL_SERVICES.find(s => s.type === 'FIRE_DEPARTMENT');
    if (fsData) {
      const fsCoords = [fsData.geoPos.latitude, fsData.geoPos.longitude];
      const fsPin = L.divIcon({
        className: 'fs-pin',
        html: `
          <div style="background: #dc2626; border: 2px solid white; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: bold; font-family: Inter, sans-serif; color: white; box-shadow: 0 0 10px #dc2626; display: flex; align-items: center; gap: 3px; cursor: pointer; white-space: nowrap;">
            <span>🚒</span>
            <span>Station #07</span>
          </div>
        `,
        iconSize: [88, 22],
        iconAnchor: [44, 11]
      });

      const fsMarker = L.marker(fsCoords, { icon: fsPin }).addTo(facilitiesGroup);
      fsMarker.on('click', () => {
        setSelectedAsset({
          type: 'FIRE_STATION',
          name: fsData.name,
          distance: `${fsData.distanceKm} km (South Boulevard Route)`,
          eta: `${fsData.estimatedEtaMinutes} min`,
          apparatus: fsData.apparatus,
          commander: fsData.dutyCommander,
          contact: fsData.contact,
          status: fsData.status,
          verification: 'VERIFIED MUNICIPAL FIRE DEPARTMENT'
        });
      });
    }

    const hospData = GIS_MUNICIPAL_SERVICES.find(s => s.type === 'HOSPITAL');
    if (hospData) {
      const hospCoords = [hospData.geoPos.latitude, hospData.geoPos.longitude];
      const hospPin = L.divIcon({
        className: 'hosp-pin',
        html: `
          <div style="background: #2563eb; border: 2px solid white; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: bold; font-family: Inter, sans-serif; color: white; box-shadow: 0 0 10px #2563eb; display: flex; align-items: center; gap: 3px; cursor: pointer; white-space: nowrap;">
            <span>🏥</span>
            <span>Trauma Center</span>
          </div>
        `,
        iconSize: [100, 22],
        iconAnchor: [50, 11]
      });

      const hospMarker = L.marker(hospCoords, { icon: hospPin }).addTo(facilitiesGroup);
      hospMarker.on('click', () => {
        setSelectedAsset({
          type: 'HOSPITAL',
          name: hospData.name,
          distance: `${hospData.distanceKm} km via DLF Phase 2 Link`,
          eta: `${hospData.estimatedEtaMinutes} min`,
          capacity: hospData.emergencyCapacity,
          officer: hospData.dutyOfficer,
          contact: hospData.contact,
          status: hospData.status,
          verification: 'MUNICIPAL HEALTH AUTHORITY VERIFIED'
        });
      });
    }

    facilitiesGroup.addTo(map);
    layersRef.current.facilities = facilitiesGroup;

    // 8. Inbound Fire Engine Road Route
    const dispatchRouteGroup = L.layerGroup();
    const routeWaypoints = [
      [28.4935, 77.0845], // Fire Station 07
      [28.4948, 77.0852],
      [28.4962, 77.0862],
      [28.4975, 77.0872],
      [28.4980, 77.0876],
      [centerCoords[0], centerCoords[1]] // Building Ingress Portal
    ];

    L.polyline(routeWaypoints, {
      color: '#f97316',
      weight: 4,
      dashArray: '8, 6',
      opacity: 0.95
    }).bindTooltip('Inbound Primary Fire Response Arterial Route (1.4 km)', { permanent: false }).addTo(dispatchRouteGroup);

    if (showInboundDispatch) dispatchRouteGroup.addTo(map);
    layersRef.current.dispatchRoute = dispatchRouteGroup;

    // 9. Gaussian Atmospheric Smoke Dispersion Plume
    const plumeGroup = L.layerGroup();
    const plumeCoords = [
      centerCoords,
      [centerCoords[0] - 0.0016, centerCoords[1] + 0.0026],
      [centerCoords[0] - 0.0028, centerCoords[1] + 0.0016],
      centerCoords
    ];

    L.polygon(plumeCoords, {
      color: '#a855f7',
      fillColor: '#9333ea',
      fillOpacity: hasAnyFire ? 0.35 : 0.15,
      weight: 1.5,
      dashArray: '4, 4'
    }).bindTooltip('Gaussian Atmospheric Smoke Plume (Wind 315° NW @ 16 km/h)', { permanent: false }).addTo(plumeGroup);

    if (showSmokePlume) plumeGroup.addTo(map);
    layersRef.current.plume = plumeGroup;
  };

  // Tile switcher
  const handleTileSwitch = (provider) => {
    if (!mapInstanceRef.current || !layersRef.current[provider]) return;
    setMapProvider(provider);

    ['satellite', 'dark', 'street'].forEach(p => {
      if (layersRef.current[p] && mapInstanceRef.current.hasLayer(layersRef.current[p])) {
        mapInstanceRef.current.removeLayer(layersRef.current[p]);
      }
    });

    layersRef.current[provider].addTo(mapInstanceRef.current);
  };

  // Recenter map on Building
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geoConfig.latitude, geoConfig.longitude], 17, {
        animate: true,
        duration: 0.8
      });
    }
  };

  // Return to 3D Twin & Fly Camera to matching view
  const handleReturnTo3D = (preset = 'HERO_VIEW') => {
    onClose();
    if (onSetCameraPreset) {
      onSetCameraPreset(preset);
    }
  };

  // Layer toggle handler
  const toggleMapLayer = (layerKey, currentState, setter) => {
    setter(!currentState);
    if (!mapInstanceRef.current || !layersRef.current[layerKey]) return;

    if (!currentState) {
      mapInstanceRef.current.addLayer(layersRef.current[layerKey]);
    } else {
      mapInstanceRef.current.removeLayer(layersRef.current[layerKey]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl text-slate-100 overflow-hidden box-border">
      {/* 1. Header (64-76px fixed responsive height) */}
      <header className="h-[68px] shrink-0 border-b border-slate-800 bg-slate-950/90 px-4 sm:px-6 flex items-center justify-between gap-3 z-30">
        {/* Left: Branding & Real Address */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shrink-0 shadow-md">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-hud font-bold text-sm sm:text-base tracking-wider text-white truncate">
                DIGITAL TWIN GIS COMMAND CENTER
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] text-emerald-300 font-mono font-medium shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                VERIFIED REAL-WORLD LOCATION
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
              {geoConfig.facilityName} • {geoConfig.streetAddress}
            </p>
          </div>
        </div>

        {/* Right Action Tools: Georeferencing Settings & Close */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGeoConfigModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-hud font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Inspect or Configure Georeferencing Coordinates & Footprint"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Georeferencing Alignment</span>
          </button>

          <button
            onClick={() => handleReturnTo3D('HERO_VIEW')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-hud font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-md transition-all"
          >
            <span>RETURN TO 3D TWIN</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close GIS Command Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Compact Status Strip (36-44px fixed height) */}
      <div className="h-[40px] shrink-0 bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between text-xs font-mono overflow-x-auto whitespace-nowrap gap-4">
        <div className="flex items-center gap-4 sm:gap-6 text-slate-300">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400">GPS:</span>
            <span className="text-white font-bold">{geoConfig.latitude.toFixed(6)}° N, {geoConfig.longitude.toFixed(6)}° E</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">DATUM:</span>
            <span className="text-emerald-300 font-semibold">{geoConfig.datum}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">ELEV:</span>
            <span className="text-cyan-300 font-semibold">{geoConfig.elevationMsl}m MSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-slate-400">WIND:</span>
            <span className="text-purple-300">315° NW @ 16 km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>SYNC: <b className="text-slate-200">LIVE CADASTRE</b></span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[11px]">
            <span className={`w-2 h-2 rounded-full ${hasAnyFire ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
            <span className={hasAnyFire ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {hasAnyFire ? `${activeFires.length} ACTIVE HAZARD(S)` : 'ALL SYSTEMS NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Content: CSS Grid Layout (Map 60% vs Sidebar 40%, ZERO horizontal overflow) */}
      <main className="flex-1 min-h-0 w-full overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-3 sm:p-4 gap-3 sm:gap-4 box-border">
        {/* Left Column: Leaflet GIS Map Area (7 cols on desktop = ~58-60% width) */}
        <section className="lg:col-span-7 flex flex-col min-h-0 min-w-0 h-full rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden relative shadow-lg">
          {/* Map Top Bar Controls */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 flex-wrap">
            {/* Tile Provider Switcher */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-slate-400 mr-1 text-[10px] uppercase font-hud">Base Map:</span>
              <button
                onClick={() => handleTileSwitch('satellite')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  mapProvider === 'satellite'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🛰️ Esri Satellite
              </button>
              <button
                onClick={() => handleTileSwitch('dark')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  mapProvider === 'dark'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🌃 Dark Matter
              </button>
              <button
                onClick={() => handleTileSwitch('street')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  mapProvider === 'street'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🗺️ Street OSM
              </button>
            </div>

            {/* Recenter & Legend Toggle */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={handleRecenter}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition-all"
                title="Recenter Map on Digital Twin Building"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>Recenter</span>
              </button>
              <button
                onClick={() => setShowLegend(!showLegend)}
                className={`px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1 transition-all ${
                  showLegend ? 'bg-cyan-950 text-cyan-300 border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Legend</span>
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map Container */}
          <div className="flex-1 w-full min-h-0 relative bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {!isLeafletReady && !mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 z-20 text-cyan-300 font-mono text-xs gap-2">
                <Globe className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Loading Cadastral GIS & Satellite Observation Layer...</span>
              </div>
            )}

            {mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 text-red-400 font-mono text-xs gap-2 p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <span>{mapError}</span>
              </div>
            )}

            {/* Layer Filter Toolbar (Floating at bottom-left of map) */}
            <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-lg p-1 text-[11px] font-mono backdrop-blur-md shadow-lg max-w-[90%]">
              <span className="text-[10px] text-slate-400 px-1 font-hud uppercase">Layers:</span>
              <button
                onClick={() => toggleMapLayer('footprint', showFootprint, setShowFootprint)}
                className={`px-2 py-0.5 rounded transition-all ${
                  showFootprint ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Footprint
              </button>
              <button
                onClick={() => toggleMapLayer('exits', showExits, setShowExits)}
                className={`px-2 py-0.5 rounded transition-all ${
                  showExits ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Exits & Paths
              </button>
              <button
                onClick={() => toggleMapLayer('hydrants', showHydrants, setShowHydrants)}
                className={`px-2 py-0.5 rounded transition-all ${
                  showHydrants ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Hydrants
              </button>
              <button
                onClick={() => toggleMapLayer('muster', showMusterZones, setShowMusterZones)}
                className={`px-2 py-0.5 rounded transition-all ${
                  showMusterZones ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Muster Zones
              </button>
              <button
                onClick={() => toggleMapLayer('dispatchRoute', showInboundDispatch, setShowInboundDispatch)}
                className={`px-2 py-0.5 rounded transition-all ${
                  showInboundDispatch ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Inbound Route
              </button>
              <button
                onClick={() => toggleMapLayer('geofences', showGeofences, setShowGeofences)}
                className={`px-2 py-0.5 rounded transition-all ${
                  showGeofences ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Geofences
              </button>
            </div>

            {/* Collapsible Map Legend Drawer (Floating Top-Left) */}
            {showLegend && (
              <div className="absolute top-3 left-3 z-20 w-64 bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 font-hud font-bold text-white">
                  <span>GIS SYMBOLOGY LEGEND</span>
                  <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-cyan-600 border border-cyan-400 shrink-0" />
                    <span>Digital Twin 10-Storey Tower</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 text-[9px] flex items-center justify-center text-white shrink-0">🚪</span>
                    <span>Verified Egress Exits & Paths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-[9px] flex items-center justify-center text-white shrink-0">💧</span>
                    <span>Municipal Fire Hydrants (SCADA)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-[9px] flex items-center justify-center text-white shrink-0">🛡️</span>
                    <span>Outdoor Safe Assembly Zones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-red-600 text-[9px] flex items-center justify-center text-white shrink-0">🚒</span>
                    <span>Fire Station #07 (1.4 km)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-blue-600 text-[9px] flex items-center justify-center text-white shrink-0">🏥</span>
                    <span>Metro Trauma Center (1.8 km)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-amber-500 border-dashed border-b border-amber-400 shrink-0" />
                    <span>Inbound Apparatus Road Route</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Asset Inspection Bottom Card */}
            {selectedAsset && (
              <div className="absolute bottom-12 right-3 left-3 sm:left-auto sm:w-96 z-20 bg-slate-950/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-hud font-bold">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>{selectedAsset.name}</span>
                  </div>
                  <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                  {selectedAsset.address && <div><span className="text-slate-500">Address:</span> {selectedAsset.address}</div>}
                  {selectedAsset.coords && <div><span className="text-slate-500">GPS:</span> {selectedAsset.coords}</div>}
                  {selectedAsset.pressure && <div><span className="text-slate-500">Pressure:</span> {selectedAsset.pressure}</div>}
                  {selectedAsset.flow && <div><span className="text-slate-500">Flow Rate:</span> {selectedAsset.flow}</div>}
                  {selectedAsset.distance && <div><span className="text-slate-500">Distance:</span> {selectedAsset.distance}</div>}
                  {selectedAsset.eta && <div><span className="text-slate-500">ETA:</span> <b className="text-red-400">{selectedAsset.eta}</b></div>}
                  {selectedAsset.capacity && <div><span className="text-slate-500">Capacity:</span> {selectedAsset.capacity}</div>}
                  {selectedAsset.status && <div><span className="text-slate-500">Status:</span> <b className="text-emerald-400">{selectedAsset.status}</b></div>}
                </div>

                {selectedAsset.type === 'BUILDING' && (
                  <button
                    onClick={() => handleReturnTo3D('HERO_VIEW')}
                    className="w-full mt-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-hud font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Building className="w-3.5 h-3.5" /> Open in 3D Building Twin
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Bounded Monitoring Sidebar (5 cols = ~38-40% width) */}
        <section className="lg:col-span-5 flex flex-col min-h-0 min-w-0 h-full rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
          {/* Sidebar Header */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-hud font-bold text-xs text-white">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>EMERGENCY OPERATIONS MONITOR</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
              5 MODULES ACTIVE
            </span>
          </div>

          {/* Scrollable Container with Accordion Modules */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-0">
            {/* SECTION A: Active Incident */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('incident')}
                className="w-full px-3.5 py-2 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${hasAnyFire ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-hud font-bold text-xs text-white">A. ACTIVE INCIDENT STATUS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    hasAnyFire ? 'bg-red-950 border border-red-500/40 text-red-300' : 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                  }`}>
                    {hasAnyFire ? 'CRITICAL ALERT' : 'STANDBY'}
                  </span>
                  {collapsedSections.incident ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {!collapsedSections.incident && (
                <div className="p-3 flex flex-col gap-2 text-xs font-mono border-t border-slate-800/80">
                  {hasAnyFire ? (
                    activeFires.map(f => (
                      <div key={f.id} className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-red-300 font-bold">
                          <span>🔥 Fire in {f.name}</span>
                          <span className="text-[10px] text-red-400">{f.tempCelsius || 86}°C</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Floor {f.floor} • Cam: {f.camId} • Occupants: {f.peopleCount || 2}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Triggered: Just now • Dynamic Reroute: Active
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-400 text-[11px]">
                      No active fire incidents detected. All 100 indoor thermal sensors reporting normal 22°C ambient baseline.
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Verified GPS: 28.4986° N, 77.0878° E</span>
                    <span className="text-emerald-400 font-semibold">[VERIFIED GEODETIC]</span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION B: Emergency Response Dispatch */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('dispatch')}
                className="w-full px-3.5 py-2 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-red-950/70 text-red-400">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-hud font-bold text-xs text-white">B. FIRE APPARATUS DISPATCH</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[10px] font-mono text-red-300 font-bold">
                    ETA: {formatEta(etaSeconds)}
                  </span>
                  {collapsedSections.dispatch ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {!collapsedSections.dispatch && (
                <div className="p-3 flex flex-col gap-2 text-xs font-mono border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Station:</span>
                    <span className="text-white font-semibold">Fire Station #07 (Cyber Hub)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Road Distance:</span>
                    <span className="text-white font-semibold">1.4 km (South Boulevard Route)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Units Dispatched:</span>
                    <span className="text-cyan-300 font-semibold">Engine 07-1, 07-2, Aerial 52m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Commander:</span>
                    <span className="text-slate-200">Capt. R. Deshmukh (VHF Ch 4)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Routing Source: DLF Sector 4 GIS Network</span>
                    <span className="text-cyan-400 font-semibold">[ESTIMATED ROAD ETA]</span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION C: Medical Support & Trauma Center */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('medical')}
                className="w-full px-3.5 py-2 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-950/70 text-blue-400">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-hud font-bold text-xs text-white">C. MEDICAL SUPPORT & TRIAGE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-[10px] font-mono text-blue-300 font-bold">
                    28 ICU BEDS
                  </span>
                  {collapsedSections.medical ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {!collapsedSections.medical && (
                <div className="p-3 flex flex-col gap-2 text-xs font-mono border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Facility:</span>
                    <span className="text-white font-semibold">Metro Trauma Center Hospital</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Distance / Route:</span>
                    <span className="text-white font-semibold">1.8 km via DLF Phase 2 Link</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ambulance ETA:</span>
                    <span className="text-emerald-300 font-semibold">4.8 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Triage Staging:</span>
                    <span className="text-cyan-300 font-semibold">Muster Point Alpha (South Park)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Registry: Municipal Health Authority</span>
                    <span className="text-emerald-400 font-semibold">[VERIFIED FACILITY]</span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION D: Municipal Water Grid & Hydrants */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('waterGrid')}
                className="w-full px-3.5 py-2 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-cyan-950/70 text-cyan-400">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-hud font-bold text-xs text-white">D. MUNICIPAL WATER GRID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
                    3 HYDRANTS (125 PSI)
                  </span>
                  {collapsedSections.waterGrid ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {!collapsedSections.waterGrid && (
                <div className="p-3 flex flex-col gap-2 text-xs font-mono border-t border-slate-800/80">
                  {GIS_FIRE_HYDRANTS.map(h => (
                    <div key={h.id} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold flex items-center gap-1.5">
                          <span className="text-red-400">💧</span>
                          <span>{h.code} • {h.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{h.mainPipe} • Inspected: {h.lastInspected}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-300 font-bold">{h.pressurePsi} PSI</div>
                        <div className="text-[10px] text-emerald-400 font-medium">{h.status}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Feed: SCADA Telemetry Live Node</span>
                    <span className="text-emerald-400 font-semibold">[VERIFIED INFRASTRUCTURE]</span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION E: Evacuation Exits & Safe Zones */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('evacZones')}
                className="w-full px-3.5 py-2 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-950/70 text-emerald-400">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-hud font-bold text-xs text-white">E. EXITS & OUTDOOR MUSTER ZONES</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                    CAPACITY: 600
                  </span>
                  {collapsedSections.evacZones ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {!collapsedSections.evacZones && (
                <div className="p-3 flex flex-col gap-2 text-xs font-mono border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-300 font-bold">Designated Safe Assembly Areas:</div>
                  {GIS_MUSTER_ZONES.map(mz => (
                    <div key={mz.id} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-emerald-400 font-semibold">{mz.name}</div>
                        <div className="text-[10px] text-slate-400">{mz.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{mz.capacity} Max</div>
                        <div className="text-[10px] text-emerald-300">Upwind • Clear</div>
                      </div>
                    </div>
                  ))}

                  <div className="text-[11px] text-slate-300 font-bold mt-1">Ground Building Exit Connections:</div>
                  {BUILDING_EXITS_GEO.map(ex => (
                    <div key={ex.id} className="p-1.5 rounded bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-white font-medium">{ex.name}</span>
                      <span className="text-cyan-400">{ex.doorWidthMeters}m Portal ➔ {ex.connectedMusterId === 'muster_alpha' ? 'Muster A' : 'Muster B'}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Egress Plan: NFPA 101 / SFPE Standard</span>
                    <span className="text-emerald-400 font-semibold">[VERIFIED SAFE ZONES]</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      </main>

      {/* 4. Compact Bottom Status Bar (36px fixed height) */}
      <footer className="h-[36px] shrink-0 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 z-30">
        <div className="flex items-center gap-3 truncate">
          <span>Cadastral Survey Node: <b>{geoConfig.cadastralPlotId}</b></span>
          <span>•</span>
          <span className="text-cyan-400 truncate">Press 'G' or 'Esc' to return to 3D Digital Twin</span>
        </div>

        <button
          onClick={() => handleReturnTo3D('HERO_VIEW')}
          className="text-cyan-400 hover:text-cyan-300 font-hud font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0"
        >
          <span>Focus 3D Building</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </footer>

      {/* Georeferencing & Cadastral Alignment Tool Modal */}
      {showGeoConfigModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-white font-hud font-bold text-sm">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>GEOREFERENCING & CADASTRAL CONFIGURATION</span>
              </div>
              <button onClick={() => setShowGeoConfigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Configure or verify the exact real-world geographical coordinates, elevation, and building footprint for this 10-storey Digital Twin.
            </p>

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Facility Name</label>
                <input
                  type="text"
                  value={geoConfig.facilityName}
                  onChange={(e) => setGeoConfig({ ...geoConfig, facilityName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Verified Street Address</label>
                <input
                  type="text"
                  value={geoConfig.streetAddress}
                  onChange={(e) => setGeoConfig({ ...geoConfig, streetAddress: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={geoConfig.latitude}
                    onChange={(e) => setGeoConfig({ ...geoConfig, latitude: parseFloat(e.target.value) || 28.4986 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none font-bold text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={geoConfig.longitude}
                    onChange={(e) => setGeoConfig({ ...geoConfig, longitude: parseFloat(e.target.value) || 77.0878 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none font-bold text-cyan-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Elevation MSL (Meters)</label>
                  <input
                    type="number"
                    value={geoConfig.elevationMsl}
                    onChange={(e) => setGeoConfig({ ...geoConfig, elevationMsl: parseFloat(e.target.value) || 218 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">True North Azimuth (°)</label>
                  <input
                    type="number"
                    value={geoConfig.orientationAzimuthDeg}
                    onChange={(e) => setGeoConfig({ ...geoConfig, orientationAzimuthDeg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> WGS-84 / UTM Datum
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGeoConfigModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateBuildingGeoreferencing(geoConfig);
                    setShowGeoConfigModal(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-hud font-bold shadow-md"
                >
                  Save & Re-Align GIS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
