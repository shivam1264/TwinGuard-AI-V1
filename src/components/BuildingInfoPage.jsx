import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  Ruler,
  Compass,
  Users,
  DoorClosed,
  ChevronRight,
  Maximize2,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Flame,
  Bell,
  Radio,
  PlusSquare,
  FlaskConical,
  MessageSquare,
  Box,
  FileText,
  LayoutTemplate,
  Check,
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { FLOOR_THEMES } from '../simulation/Doorways';

export const BuildingInfoPage = ({
  rooms = [],
  exits = [],
  onClose,
  onSwitchTo3D,
  onSelectFloor
}) => {
  const [selectedFloor, setSelectedFloor] = useState(4);
  const [activeModelTab, setActiveModelTab] = useState('3D View');
  const [isEditing, setIsEditing] = useState(false);
  const [isGisModalOpen, setIsGisModalOpen] = useState(false);
  const [isFullscreen3D, setIsFullscreen3D] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Editable building metadata state
  const [buildingData, setBuildingData] = useState({
    name: 'TwinGuard Horizon Tower',
    category: 'Commercial & R&D',
    id: 'TWG-TWR-01',
    address: 'TwinGuard Tech Complex, Sector 4, Metro Corridor',
    totalFloors: 10,
    builtUpArea: '24,500 m²',
    constructionYear: '2024',
    coordinates: '28.5355° N, 77.3910° E',
    maxCapacity: 450
  });

  const [editForm, setEditForm] = useState({ ...buildingData });

  // Dynamic calculations from existing simulation data
  const totalOccupants = useMemo(() => {
    if (rooms && rooms.length > 0) {
      const live = rooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
      return live > 0 ? live : 210;
    }
    return 210;
  }, [rooms]);

  const maxCapacity = buildingData.maxCapacity || 450;
  const availableCapacity = Math.max(0, maxCapacity - totalOccupants);
  const occupancyPercent = Math.min(100, Math.round((totalOccupants / maxCapacity) * 100)) || 47;

  // Real 10-Storey Floor List mapped from FLOOR_THEMES (L10 down to L1)
  const floorList = useMemo(() => {
    const list = [];
    for (let f = 10; f >= 1; f--) {
      const theme = FLOOR_THEMES[f] || { name: `Level ${f}`, prefix: `L${f}` };
      const floorRooms = rooms.filter((r) => r.floor === f);
      const floorOccupants = floorRooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
      const hasFloorFire = floorRooms.some((r) => r.hasFire);

      list.push({
        id: f,
        prefix: theme.prefix,
        name: theme.name,
        rooms: 10,
        stairs: f === 1 ? '3 Exits' : '3 Cores',
        occupants: floorOccupants > 0 ? floorOccupants : 21,
        hasFire: hasFloorFire
      });
    }
    return list;
  }, [rooms]);

  // Real dynamic exits calculation
  const exitMetrics = useMemo(() => {
    const defaultExits = [
      { id: 'exit_west', name: 'Stairwell A (West Core)', capacity: 60, status: 'Operational' },
      { id: 'exit_east', name: 'Stairwell B (East Core)', capacity: 60, status: 'Operational' },
      { id: 'exit_south', name: 'Stairwell C (South Exit)', capacity: 80, status: 'Operational' }
    ];

    const currentExits = exits && exits.length > 0 ? exits : defaultExits;
    const total = currentExits.length;
    const blocked = currentExits.filter(
      (e) => e.status === 'Blocked' || e.isBlocked === true
    ).length;
    const operational = total - blocked;

    return { total, operational, blocked, list: currentExits };
  }, [exits]);

  const handleEditClick = () => {
    setEditForm({ ...buildingData });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setBuildingData({ ...editForm });
    setIsEditing(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleFloorClick = (floorNum) => {
    setSelectedFloor(floorNum);
    if (onSelectFloor) {
      onSelectFloor(floorNum);
    }
  };

  const currentFloorTheme = FLOOR_THEMES[selectedFloor] || {
    name: `Level ${selectedFloor}`,
    prefix: `L${selectedFloor}`
  };

  return (
    <div
      className="w-full h-full overflow-y-auto select-none"
      style={{
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
        padding: '20px 24px 32px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: PAGE HEADER
           ═══════════════════════════════════════════════════════════════════ */}
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingBottom: '2px'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.025em',
                lineHeight: 1.2
              }}
            >
              Building Information
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                fontWeight: 500,
                marginTop: '2px'
              }}
            >
              Complete details and structure information of the building
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleEditClick}
              className="cursor-pointer transition-colors hover:bg-blue-50"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                background: '#ffffff',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <Edit3 style={{ width: '13px', height: '13px' }} />
              <span>Edit Information</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              <CheckCircle2 style={{ width: '13px', height: '13px', fill: '#059669', color: '#ffffff' }} />
              <span>Verified Data</span>
            </div>

            {onSwitchTo3D && (
              <button
                onClick={onSwitchTo3D}
                className="cursor-pointer transition-colors hover:bg-slate-200"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
                title="Return to 3D Simulation Viewport"
              >
                <Box style={{ width: '13px', height: '13px' }} />
                <span>Return to 3D Twin</span>
              </button>
            )}
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: BUILDING OVERVIEW (30% - 40% - 30%)
           ═══════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-10 items-stretch"
            style={{ gap: '16px' }}
          >
            {/* Col 1 (30% - col-span-3): Real 10-Storey Building Photo */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '185px',
                  width: '100%',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0'
                }}
              >
                <img
                  src="/assets/building/building_exterior.png"
                  alt={buildingData.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div
                  className="w-full h-full hidden flex-col items-center justify-center p-4 text-center bg-slate-900 text-white"
                >
                  <Building2 className="w-10 h-10 text-sky-400 mb-2" />
                  <span className="text-sm font-bold">{buildingData.name}</span>
                  <span className="text-xs text-slate-400">10 Storeys • Glass Curtain Wall</span>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                  }}
                >
                  10 Storeys High-Rise
                </div>

                <button
                  onClick={() => setIsFullscreen3D(true)}
                  className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-md bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-105"
                  title="Expand Photo"
                >
                  <Maximize2 style={{ width: '12px', height: '12px' }} />
                </button>
              </div>
            </div>

            {/* Col 2 (40% - col-span-4): Real Building Metadata Details */}
            <div
              className="lg:col-span-4 flex flex-col justify-between"
              style={{ padding: '2px 4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  {buildingData.name}
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #dbeafe'
                  }}
                >
                  {buildingData.category}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2 text-slate-500 font-medium">
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <FileText style={{ width: '11px', height: '11px' }} />
                    </div>
                    <span>Building ID</span>
                  </div>
                  <div className="col-span-7 font-bold text-slate-800">
                    {buildingData.id}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2 text-slate-500 font-medium">
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <MapPin style={{ width: '11px', height: '11px' }} />
                    </div>
                    <span>Address</span>
                  </div>
                  <div className="col-span-7 font-bold text-slate-800 truncate" title={buildingData.address}>
                    {buildingData.address}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2 text-slate-500 font-medium">
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <Layers style={{ width: '11px', height: '11px' }} />
                    </div>
                    <span>Total Floors</span>
                  </div>
                  <div className="col-span-7 font-bold text-slate-800">
                    {buildingData.totalFloors} Storeys (L1 to L10 + Roof)
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2 text-slate-500 font-medium">
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <Ruler style={{ width: '11px', height: '11px' }} />
                    </div>
                    <span>Built-up Area</span>
                  </div>
                  <div className="col-span-7 font-bold text-slate-800">
                    {buildingData.builtUpArea} (60m × 48m Footprint)
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2 text-slate-500 font-medium">
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <Calendar style={{ width: '11px', height: '11px' }} />
                    </div>
                    <span>Construction Year</span>
                  </div>
                  <div className="col-span-7 font-bold text-slate-800">
                    {buildingData.constructionYear} (Smart BIM Commissioned)
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-2 text-slate-500 font-medium">
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <Compass style={{ width: '11px', height: '11px' }} />
                    </div>
                    <span>Coordinates</span>
                  </div>
                  <div className="col-span-7 font-bold text-slate-800 font-mono text-[11px]">
                    {buildingData.coordinates}
                  </div>
                </div>
              </div>
            </div>

            {/* Col 3 (30% - col-span-3): Location Map */}
            <div className="lg:col-span-3 flex flex-col justify-between">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  <MapPin style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                  <span>Location Map</span>
                </div>
                <button
                  onClick={() => setIsGisModalOpen(true)}
                  className="cursor-pointer transition-colors hover:bg-blue-50"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    background: '#ffffff',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <ExternalLink style={{ width: '11px', height: '11px' }} />
                  <span>View in GIS</span>
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '148px',
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #e2e8f0'
                }}
              >
                <img
                  src="/assets/building/building_gis_map.png"
                  alt="GIS Satellite Map"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    bottom: '12px',
                    left: '24px',
                    right: '24px',
                    borderRadius: '6px',
                    border: '2px solid #3b82f6',
                    background: 'rgba(59, 130, 246, 0.25)',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <MapPin style={{ width: '24px', height: '24px', color: '#2563eb', fill: '#3b82f6', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: QUICK STATISTICS (4 Equal Cards in 1 Row)
           ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: '16px' }}
        >
          {/* Card 1: Total Floors */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Building2 style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  10
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                  Total Floors (L1–L10)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <Building2 style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
              <ChevronRight style={{ width: '16px', height: '16px', color: '#64748b' }} />
            </div>
          </div>

          {/* Card 2: Maximum Capacity */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Users style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {maxCapacity}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                  Maximum Capacity
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <Users style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
              <ChevronRight style={{ width: '16px', height: '16px', color: '#64748b' }} />
            </div>
          </div>

          {/* Card 3: Emergency Exits */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: exitMetrics.blocked > 0 ? '#fef2f2' : '#f0fdf4',
                  color: exitMetrics.blocked > 0 ? '#ef4444' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <DoorClosed style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {exitMetrics.total}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                  Emergency Exits (Cores)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <DoorClosed style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
              <ChevronRight style={{ width: '16px', height: '16px', color: '#64748b' }} />
            </div>
          </div>

          {/* Card 4: Staircases & Vertical Egress */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#fffbeb',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  3
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                  Staircases (3 Cores)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <Layers style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
              <ChevronRight style={{ width: '16px', height: '16px', color: '#64748b' }} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: MAIN DASHBOARD 3-COLUMN LAYOUT
            Left Column (30%) • Middle Column (40%) • Right Column (30%)
           ═══════════════════════════════════════════════════════════════════ */}
        <section
          className="grid grid-cols-1 lg:grid-cols-10 items-start"
          style={{ gap: '16px' }}
        >
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN (30% - col-span-3): Real 10-Floor Overview + Safety Infra
             ───────────────────────────────────────────────────────────── */}
          <div
            className="lg:col-span-3"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Upper: Floor Overview (All 10 Floors with real names & interactive selection) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Floor Overview
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  10 Storeys
                </span>
              </div>

              {/* Scrollable container for 10 floors so it stays balanced */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}
              >
                {floorList.map((floor) => {
                  const isSelected = selectedFloor === floor.id;
                  return (
                    <button
                      key={floor.id}
                      onClick={() => handleFloorClick(floor.id)}
                      className="cursor-pointer transition-all"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #f1f5f9',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        boxShadow: isSelected ? '0 2px 6px rgba(59, 130, 246, 0.15)' : 'none',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isSelected ? '#2563eb' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontWeight: 800,
                            fontSize: '11px'
                          }}
                        >
                          {floor.prefix}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: isSelected ? 800 : 700,
                              color: isSelected ? '#1e40af' : '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={floor.name}
                          >
                            Floor {floor.id} — {floor.name}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 500, color: isSelected ? '#2563eb' : '#64748b' }}>
                            {floor.rooms} Rooms • {floor.stairs} • {floor.occupants} Occupants
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        style={{
                          width: '15px',
                          height: '15px',
                          color: isSelected ? '#2563eb' : '#94a3b8',
                          flexShrink: 0,
                          marginLeft: '4px'
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600
                }}
              >
                <span>Active Selection: Level {selectedFloor}</span>
                <span className="text-blue-600 font-bold">100 Total Rooms</span>
              </div>
            </div>

            {/* Lower: Real Safety Infrastructure (Tower Total: 40 Extinguishers, 20 Alarms, 100 Detectors, 10 First Aid) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  Safety Infrastructure
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>
                  All 10 Floors
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <Flame style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>40</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Fire Extinguishers
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <Bell style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>20</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Fire Alarms
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <Radio style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>100</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Smoke Detectors
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <PlusSquare style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>10</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    First Aid Stations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              MIDDLE COLUMN (40% - col-span-4): 3D Model View / 2D Plan + Spaces
             ───────────────────────────────────────────────────────────── */}
          <div
            className="lg:col-span-4"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Upper: 3D Building Model / 2D Floor Plan Viewer */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    {activeModelTab === '3D View'
                      ? '3D Building Model'
                      : activeModelTab === '2D Plan'
                      ? `2D Plan — Level ${selectedFloor}`
                      : `Floor Plan Layout — ${currentFloorTheme.name}`}
                  </h3>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#059669',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Digital Twin
                  </span>
                </div>

                <button
                  onClick={() => setIsFullscreen3D(true)}
                  className="cursor-pointer transition-colors hover:bg-slate-200"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none'
                  }}
                  title="Fullscreen High-Res Viewer"
                >
                  <Maximize2 style={{ width: '12px', height: '12px' }} />
                </button>
              </div>

              {/* Visual Box: Switches between 3D Real Model, 2D Blueprint, and Room Schematic */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '215px',
                  width: '100%',
                  background: activeModelTab === '3D View' ? '#0f172a' : '#1e293b',
                  border: '1px solid #e2e8f0'
                }}
              >
                {activeModelTab === '3D View' && (
                  <>
                    <img
                      src="/assets/building/building_3d_render.png"
                      alt="10-Storey 3D Twin Model"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/building/building_exterior.png';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live 10-Storey BIM • Active Level {selectedFloor}</span>
                    </div>
                  </>
                )}

                {activeModelTab === '2D Plan' && (
                  <div className="w-full h-full p-3 flex flex-col justify-between text-slate-200 bg-[#0f172a]">
                    <div className="flex items-center justify-between text-xs border-b border-slate-700/80 pb-1.5">
                      <span className="font-bold text-sky-400">
                        CAD Level {selectedFloor}: {currentFloorTheme.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Dimensions: 60m × 48m</span>
                    </div>

                    {/* SVG 2D Architectural Schematic */}
                    <svg viewBox="0 0 400 130" className="w-full h-28 my-auto">
                      {/* Outer slab outline */}
                      <rect x="35" y="10" width="330" height="110" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                      {/* West Stairwell Core A */}
                      <rect x="10" y="35" width="25" height="60" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                      <text x="22" y="68" fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">CORE A</text>
                      {/* East Stairwell Core B */}
                      <rect x="365" y="35" width="25" height="60" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                      <text x="377" y="68" fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">CORE B</text>
                      {/* South Exit Core C */}
                      <rect x="170" y="112" width="60" height="15" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                      <text x="200" y="123" fill="#e2e8f0" fontSize="7" fontWeight="bold" textAnchor="middle">EXIT CORE C</text>

                      {/* North Wing: 5 Rooms (r1 to r5) */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={`north_${i}`}>
                          <rect x={45 + i * 62} y="18" width="58" height="38" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                          <text x={74 + i * 62} y="34" fill="#93c5fd" fontSize="8" fontWeight="bold" textAnchor="middle">
                            r{i + 1}
                          </text>
                          <text x={74 + i * 62} y="47" fill="#64748b" fontSize="6.5" textAnchor="middle">
                            Office {i + 1}
                          </text>
                        </g>
                      ))}

                      {/* Central Corridor */}
                      <rect x="45" y="58" width="310" height="14" fill="#1e293b" stroke="#3b82f6" strokeDasharray="3 3" strokeWidth="0.8" />
                      <text x="200" y="68" fill="#60a5fa" fontSize="7" fontWeight="bold" textAnchor="middle">
                        MAIN CORRIDOR (CIRCULATION)
                      </text>

                      {/* South Wing: 5 Rooms (r6 to r10) */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={`south_${i}`}>
                          <rect x={45 + i * 62} y="74" width="58" height="36" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                          <text x={74 + i * 62} y="89" fill="#93c5fd" fontSize="8" fontWeight="bold" textAnchor="middle">
                            r{i + 6}
                          </text>
                          <text x={74 + i * 62} y="101" fill="#64748b" fontSize="6.5" textAnchor="middle">
                            Office {i + 6}
                          </text>
                        </g>
                      ))}
                    </svg>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/80 pt-1">
                      <span>West Core A (Cap: 60)</span>
                      <span className="text-emerald-400 font-bold">10 Commercial Rooms</span>
                      <span>East Core B (Cap: 60)</span>
                    </div>
                  </div>
                )}

                {activeModelTab === 'Floor Plan' && (
                  <div className="w-full h-full p-3 flex flex-col justify-between text-slate-200 bg-[#0f172a]">
                    <div className="flex items-center justify-between text-xs border-b border-slate-700/80 pb-1">
                      <span className="font-bold text-emerald-400">
                        Floor {selectedFloor} Space Layout
                      </span>
                      <span className="text-[10px] text-slate-400">10 Rooms • Dual Wing</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 my-auto py-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => {
                        const roomId = `f${selectedFloor}_r${idx}`;
                        const roomObj = rooms.find((r) => r.id === roomId);
                        const occupants = roomObj ? roomObj.peopleCount || 0 : 2;
                        const hasFire = roomObj ? roomObj.hasFire : false;

                        return (
                          <div
                            key={roomId}
                            style={{
                              background: hasFire ? '#7f1d1d' : '#1e293b',
                              border: hasFire ? '1px solid #ef4444' : '1px solid #334155',
                              borderRadius: '6px',
                              padding: '4px',
                              textAlign: 'center'
                            }}
                          >
                            <div className="text-[10px] font-bold text-sky-300">
                              R-{idx}
                            </div>
                            <div className="text-[8.5px] text-slate-300 font-semibold mt-0.5">
                              {occupants} pers
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/80 pt-1">
                      <span>North Wing (R1–R5)</span>
                      <span className="text-sky-400">Central Aisle</span>
                      <span>South Wing (R6–R10)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom 3 Tab Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <button
                  onClick={() => setActiveModelTab('3D View')}
                  className="cursor-pointer transition-all"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: activeModelTab === '3D View' ? '#2563eb' : '#ffffff',
                    color: activeModelTab === '3D View' ? '#ffffff' : '#475569',
                    border: activeModelTab === '3D View' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: activeModelTab === '3D View' ? '0 2px 6px rgba(37, 99, 235, 0.3)' : 'none'
                  }}
                >
                  <Box style={{ width: '13px', height: '13px' }} />
                  <span>3D View</span>
                </button>

                <button
                  onClick={() => setActiveModelTab('2D Plan')}
                  className="cursor-pointer transition-all hover:bg-slate-50"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: activeModelTab === '2D Plan' ? '#2563eb' : '#ffffff',
                    color: activeModelTab === '2D Plan' ? '#ffffff' : '#475569',
                    border: activeModelTab === '2D Plan' ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <FileText style={{ width: '13px', height: '13px' }} />
                  <span>2D Plan</span>
                </button>

                <button
                  onClick={() => setActiveModelTab('Floor Plan')}
                  className="cursor-pointer transition-all hover:bg-slate-50"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: activeModelTab === 'Floor Plan' ? '#2563eb' : '#ffffff',
                    color: activeModelTab === 'Floor Plan' ? '#ffffff' : '#475569',
                    border: activeModelTab === 'Floor Plan' ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <LayoutTemplate style={{ width: '13px', height: '13px' }} />
                  <span>Floor Plan</span>
                </button>
              </div>
            </div>

            {/* Lower: Room & Space Information (Real 100 Rooms, 20 Labs, 40 Engineering, 30 Meeting Rooms) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  Room & Space Information
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>
                  100 Spaces
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <DoorClosed style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>100</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Total Rooms
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <FlaskConical style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>20</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Labs & SOC
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <Layers style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>40</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Engineering Hubs
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
                    <MessageSquare style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>30</div>
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '3px', lineHeight: 1.1 }}>
                    Meeting Rooms
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN (30% - col-span-3): Occupancy & Exit + Assembly
             ───────────────────────────────────────────────────────────── */}
          <div
            className="lg:col-span-3"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Upper: Combined Real Occupancy Information & Dynamic Exit Status */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {/* Part A: Dynamic Real Occupancy Information */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    Occupancy Information
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: '#ecfdf5',
                      color: '#059669',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      border: '1px solid #a7f3d0'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    <span>Live Simulation</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 0' }}>
                  {/* Compact SVG Donut */}
                  <div style={{ position: 'relative', width: '78px', height: '78px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#e2e8f0"
                        strokeWidth="11"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={occupancyPercent > 80 ? '#ef4444' : occupancyPercent > 60 ? '#f59e0b' : '#2563eb'}
                        strokeWidth="11"
                        strokeDasharray="238.76"
                        strokeDashoffset={238.76 * (1 - occupancyPercent / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                        {occupancyPercent}%
                      </span>
                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                        Occupancy
                      </span>
                    </div>
                  </div>

                  {/* Legend Values */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 500 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                        <span>Current Occupancy</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{totalOccupants}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 500 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <span>Maximum Capacity</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{maxCapacity}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 500 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                        <span>Available Capacity</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{availableCapacity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part B: Real Exit Status (Bound directly to exits prop) */}
              <div style={{ paddingTop: '12px', marginTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Exit Status
                  </h3>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                    3 Pressurized Cores
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <div
                    style={{
                      borderRadius: '8px',
                      padding: '6px 4px',
                      border: '1px solid #bbf7d0',
                      background: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '10px' }}>
                      {exitMetrics.operational}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>
                      Operational
                    </span>
                  </div>

                  <div
                    style={{
                      borderRadius: '8px',
                      padding: '6px 4px',
                      border: exitMetrics.blocked > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      background: exitMetrics.blocked > 0 ? '#fef2f2' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: exitMetrics.blocked > 0 ? '#dc2626' : '#94a3b8', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '10px' }}>
                      {exitMetrics.blocked}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: exitMetrics.blocked > 0 ? '#991b1b' : '#64748b' }}>
                      Blocked
                    </span>
                  </div>

                  <div
                    style={{
                      borderRadius: '8px',
                      padding: '6px 4px',
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '10px' }}>
                      {exitMetrics.total}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#1e40af' }}>
                      Total Cores
                    </span>
                  </div>
                </div>

                {/* Exit details row */}
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {exitMetrics.list.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10.5px',
                        background: '#f8fafc',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <span className="font-semibold text-slate-700 truncate">{ex.name}</span>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                          ex.status === 'Blocked' || ex.isBlocked
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {ex.status || 'Operational'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lower: Emergency Assembly Points (North Campus Plaza & East Parking) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  Emergency Assembly Points
                </h3>
                <span
                  onClick={() => setIsGisModalOpen(true)}
                  style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                >
                  View on Map
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '12px',
                  padding: '10px'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '58px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #a7f3d0'
                  }}
                >
                  <img
                    src="/assets/building/assembly_point_lawn.svg"
                    alt="North Campus Assembly Lawn"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                      Assembly Point A
                    </span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: '#dcfce7',
                        color: '#166534',
                        fontSize: '9.5px',
                        fontWeight: 700
                      }}
                    >
                      Primary
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                    <MapPin style={{ width: '11px', height: '11px', color: '#64748b', flexShrink: 0 }} />
                    <span className="truncate">North Campus Plaza & Lawn</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b', paddingTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users style={{ width: '11px', height: '11px', color: '#10b981' }} />
                      <span>Cap: 500</span>
                    </div>
                    <div>Dist: 80 m</div>
                  </div>
                </div>
              </div>

              {/* Secondary Assembly Point */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  marginTop: '8px',
                  fontSize: '11px'
                }}
              >
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Assembly Point B</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">Secondary</span>
                  </div>
                  <div className="text-[10px] text-slate-500">East Parking Esplanade • Dist: 120m</div>
                </div>
                <div className="font-bold text-slate-700 text-[10px]">Cap: 400</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            MODALS: Edit Information, GIS Map, & 3D Fullscreen
           ═══════════════════════════════════════════════════════════════════ */}

        {/* Modal 1: Edit Information Dialog */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Edit Building Information</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Building Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Built-up Area</label>
                    <input
                      type="text"
                      value={editForm.builtUpArea}
                      onChange={(e) => setEditForm({ ...editForm, builtUpArea: e.target.value })}
                      className="w-full mt-1 p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Max Capacity</label>
                    <input
                      type="number"
                      value={editForm.maxCapacity}
                      onChange={(e) => setEditForm({ ...editForm, maxCapacity: parseInt(e.target.value) || 450 })}
                      className="w-full mt-1 p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-700 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: GIS Map Fullscreen View */}
        {isGisModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-5 shadow-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">GIS Satellite Mapping & Geo-Coordinates</h3>
                    <p className="text-xs text-slate-500">28.5355° N, 77.3910° E • TwinGuard Horizon Complex Precinct</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGisModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-[16/9] w-full bg-slate-900 border border-slate-300">
                <img
                  src="/assets/building/building_gis_map.png"
                  alt="GIS High Res Satellite Map"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-20 inset-y-12 rounded-lg border-2 border-blue-500 bg-blue-500/20 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-blue-500 fill-blue-500 mx-auto drop-shadow" />
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold mt-1 inline-block">
                      {buildingData.id} ({buildingData.name})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Elevation: 218m AMSL • Geo-Datum: WGS 84 • Footprint: 60m × 48m</span>
                <button
                  onClick={() => setIsGisModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Close GIS View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Fullscreen 3D Building Viewer */}
        {isFullscreen3D && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-5 shadow-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">3D Building Model — High-Fidelity BIM View</h3>
                    <p className="text-xs text-slate-500">10 Levels • 100 Commercial Spaces • Digital Twin Architecture</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFullscreen3D(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-[16/10] w-full bg-slate-100 border border-slate-200">
                <img
                  src="/assets/building/building_3d_render.png"
                  alt="3D Building Full View"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Rendering Engine: WebGL / Three.js PBR • Height: 42.5m</span>
                <div className="flex items-center gap-2">
                  {onSwitchTo3D && (
                    <button
                      onClick={() => {
                        setIsFullscreen3D(false);
                        onSwitchTo3D();
                      }}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      Open Live 3D Twin
                    </button>
                  )}
                  <button
                    onClick={() => setIsFullscreen3D(false)}
                    className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Notification Toast */}
        {showNotification && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold animate-in fade-in duration-200">
            <Check className="w-4 h-4" />
            <span>Building information successfully updated!</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default BuildingInfoPage;
