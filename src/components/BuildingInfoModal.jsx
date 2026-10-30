import React, { useState, useMemo } from 'react';
import {
  Building2,
  X,
  Layers,
  ShieldCheck,
  Activity,
  Flame,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  ArrowRight,
  Clock,
  Compass,
  Cpu,
  Zap,
  Droplets,
  Wind,
  Phone,
  ExternalLink,
  Download,
  Search,
  Sparkles,
  MapPin,
  Thermometer,
  Eye,
  Video,
  Award,
  Sliders,
  Wrench,
  Check
} from 'lucide-react';
import { FLOOR_THEMES, ROOM_TEMPLATES } from '../simulation/Doorways';

export const BuildingInfoModal = ({
  isOpen,
  onClose,
  rooms = [],
  exits = [],
  onSelectFloor
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('DIRECTORY'); // 'DIRECTORY' | 'SPECS' | 'LIFE_SAFETY' | 'FACILITY_OPS'
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Live total calculations
  const totalOccupants = useMemo(() => {
    return rooms.reduce((sum, r) => sum + (r.peopleCount || 0), 0);
  }, [rooms]);

  const activeFireRooms = useMemo(() => {
    return rooms.filter((r) => r.hasFire);
  }, [rooms]);

  const avgTemp = useMemo(() => {
    if (!rooms.length) return 22.0;
    const total = rooms.reduce((s, r) => s + (r.tempCelsius || 22), 0);
    return (total / rooms.length).toFixed(1);
  }, [rooms]);

  // Information for selected floor
  const currentFloorRooms = useMemo(() => {
    return rooms.filter((r) => r.floor === selectedFloor);
  }, [rooms, selectedFloor]);

  const floorOccupants = useMemo(() => {
    return currentFloorRooms.reduce((s, r) => s + (r.peopleCount || 0), 0);
  }, [currentFloorRooms]);

  const floorHasFire = useMemo(() => {
    return currentFloorRooms.some((r) => r.hasFire);
  }, [currentFloorRooms]);

  const northWingRooms = useMemo(() => {
    return currentFloorRooms.filter((_, idx) => idx < 5);
  }, [currentFloorRooms]);

  const southWingRooms = useMemo(() => {
    return currentFloorRooms.filter((_, idx) => idx >= 5);
  }, [currentFloorRooms]);

  const handleDownloadSpec = () => {
    const specData = {
      facility: 'TwinGuard Horizon Tower',
      classification: 'Commercial Class-A High-Rise',
      gfaSquareMeters: 24500,
      levels: 10,
      heightMeters: 42.5,
      totalRooms: 100,
      stairwells: 3,
      liveOccupancy: totalOccupants,
      maxDesignCapacity: 450,
      timestamp: new Date().toISOString(),
      fireSystemStatus: activeFireRooms.length > 0 ? 'ACTIVE_INCIDENT' : 'ALL_SYSTEMS_NORMAL',
      compliance: ['NFPA 101', 'NFPA 13', 'NFPA 72', 'LEED Platinum', 'IBC 2024']
    };
    const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TwinGuard_Building_BIM_Spec_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-6xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          fontFamily: "'Inter', system-ui, sans-serif",
          maxHeight: '94vh',
          height: '900px'
        }}
      >
        {/* ── 1. Top Header (Building Brand & Quick Badges) ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '16px 24px 14px 24px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff'
          }}
        >
          <div className="flex items-center" style={{ gap: '14px' }}>
            {/* Building Blue Squircle Icon */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                color: '#ffffff'
              }}
            >
              <Building2 style={{ width: '24px', height: '24px' }} />
            </div>

            <div>
              <div className="flex items-center" style={{ gap: '10px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  TwinGuard Horizon Tower
                </h1>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '3px 9px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                  }}
                >
                  Class-A Commercial BIM
                </span>
                <span
                  style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '3px 9px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  🌱 LEED Platinum
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
                10-Storey Smart Digital Twin • 24,500 m² GFA • Metro Innovation District
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <button
              onClick={handleDownloadSpec}
              className="flex items-center cursor-pointer transition-all hover:bg-slate-100"
              style={{
                height: '36px',
                padding: '0 14px',
                borderRadius: '10px',
                background: downloadSuccess ? '#dcfce7' : '#f8fafc',
                border: downloadSuccess ? '1px solid #86efac' : '1px solid #e2e8f0',
                color: downloadSuccess ? '#15803d' : '#334155',
                fontSize: '12px',
                fontWeight: 600,
                gap: '6px'
              }}
              title="Download BIM Specification JSON"
            >
              {downloadSuccess ? (
                <>
                  <Check style={{ width: '15px', height: '15px' }} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download style={{ width: '15px', height: '15px' }} />
                  <span>Export BIM Specs</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer transition-colors hover:bg-slate-100"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}
              title="Close (Esc)"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* ── 2. Real-Time Vitals Banner (6 KPI Metrics) ── */}
        <div
          className="grid grid-cols-2 md:grid-cols-6 gap-3 shrink-0"
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          {/* Metric 1: Live Occupants */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="flex items-center justify-between" style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
              <span>Live Occupants</span>
              <Users style={{ width: '14px', height: '14px', color: '#2563eb' }} />
            </div>
            <div className="flex items-baseline" style={{ gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {totalOccupants}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                / 450 max
              </span>
            </div>
            <div
              className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden"
              title={`${Math.round((totalOccupants / 450) * 100)}% Capacity`}
            >
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, Math.round((totalOccupants / 450) * 100))}%` }}
              />
            </div>
          </div>

          {/* Metric 2: GFA & Scale */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="flex items-center justify-between" style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
              <span>Gross Floor Area</span>
              <Layers style={{ width: '14px', height: '14px', color: '#059669' }} />
            </div>
            <div className="flex items-baseline" style={{ gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                24,500
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>m²</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
              10 Levels • 2,450 m²/flr
            </div>
          </div>

          {/* Metric 3: Stairwell Egress Cores */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="flex items-center justify-between" style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
              <span>Egress Cores</span>
              <ShieldCheck style={{ width: '14px', height: '14px', color: '#16a34a' }} />
            </div>
            <div className="flex items-baseline" style={{ gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                3 Cores
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                200 p/min
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
              120-min Pressurized
            </div>
          </div>

          {/* Metric 4: Elevator Bank */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="flex items-center justify-between" style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
              <span>Elevator Shafts</span>
              <Zap style={{ width: '14px', height: '14px', color: '#d97706' }} />
            </div>
            <div className="flex items-baseline" style={{ gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                3 Units
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                3.5 m/s
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
              NFPA Fire Recall Active
            </div>
          </div>

          {/* Metric 5: Fire Suppression & Alarms */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: activeFireRooms.length > 0 ? '#fef2f2' : '#ffffff',
              border: activeFireRooms.length > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0'
            }}
          >
            <div className="flex items-center justify-between" style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
              <span>Fire & Life Safety</span>
              <Flame style={{ width: '14px', height: '14px', color: activeFireRooms.length > 0 ? '#dc2626' : '#ea580c' }} />
            </div>
            <div className="flex items-baseline" style={{ gap: '6px', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: activeFireRooms.length > 0 ? '#dc2626' : '#16a34a'
                }}
              >
                {activeFireRooms.length > 0 ? `${activeFireRooms.length} Active Fire` : '100% Armed'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
              VESDA + Zoned Deluge
            </div>
          </div>

          {/* Metric 6: Indoor Climate & Environment */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div className="flex items-center justify-between" style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
              <span>Indoor Climate</span>
              <Thermometer style={{ width: '14px', height: '14px', color: '#0284c7' }} />
            </div>
            <div className="flex items-baseline" style={{ gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {avgTemp}°C
              </span>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                AQI 18
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
              48% RH • VAV Climate
            </div>
          </div>
        </div>

        {/* ── 3. Navigation Tabs ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '10px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <div className="flex items-center" style={{ gap: '6px' }}>
            {[
              { id: 'DIRECTORY', label: 'Floor-by-Floor BIM Directory', icon: Layers },
              { id: 'SPECS', label: 'Architectural & Structural Specs', icon: Building2 },
              { id: 'LIFE_SAFETY', label: 'Life Safety & Fire Suppression', icon: ShieldCheck },
              { id: 'FACILITY_OPS', label: 'MEP Infrastructure & Contacts', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center cursor-pointer transition-all focus:outline-none"
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '9px',
                    background: isActive ? '#2563eb' : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '12.5px',
                    gap: '7px',
                    border: 'none',
                    boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <Icon style={{ width: '15px', height: '15px' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
            Standard: <span style={{ color: '#0f172a', fontWeight: 700 }}>IBC / NFPA 101</span>
          </div>
        </div>

        {/* ── 4. Scrollable Tab Content Body ── */}
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{
            padding: '20px 24px',
            background: '#ffffff',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* ========================================================
              TAB 1: FLOOR-BY-FLOOR BIM DIRECTORY
             ======================================================== */}
          {activeTab === 'DIRECTORY' && (
            <div className="flex flex-col md:flex-row gap-5">
              {/* Left Column: 10 Floor Stack Selector */}
              <div
                className="w-full md:w-72 shrink-0 flex flex-col"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '12px',
                  gap: '6px'
                }}
              >
                <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-200">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Level (10 Floors)
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>
                    Total 100 Rooms
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[500px]">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((floorNum) => {
                    const theme = FLOOR_THEMES[floorNum];
                    const isSelected = selectedFloor === floorNum;
                    const fRooms = rooms.filter((r) => r.floor === floorNum);
                    const fOcc = fRooms.reduce((s, r) => s + (r.peopleCount || 0), 0);
                    const fFire = fRooms.some((r) => r.hasFire);

                    return (
                      <button
                        key={floorNum}
                        onClick={() => setSelectedFloor(floorNum)}
                        className="w-full flex items-center justify-between text-left cursor-pointer transition-all p-2.5 rounded-xl border focus:outline-none"
                        style={{
                          background: isSelected ? '#ffffff' : 'transparent',
                          borderColor: isSelected ? '#3b82f6' : 'transparent',
                          boxShadow: isSelected ? '0 3px 8px -1px rgba(59, 130, 246, 0.15)' : 'none'
                        }}
                      >
                        <div className="flex items-center min-w-0" style={{ gap: '10px' }}>
                          <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '9px',
                              background: isSelected
                                ? '#2563eb'
                                : fFire
                                ? '#fee2e2'
                                : '#e2e8f0',
                              color: isSelected
                                ? '#ffffff'
                                : fFire
                                ? '#dc2626'
                                : '#334155',
                              fontWeight: 800,
                              fontSize: '12px'
                            }}
                          >
                            L{floorNum}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate" style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 700, color: isSelected ? '#1e3a8a' : '#0f172a' }}>
                              {theme?.name || `Floor ${floorNum}`}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                              10 Rooms • {fOcc} Occupants
                            </div>
                          </div>
                        </div>

                        {fFire ? (
                          <span
                            className="shrink-0 flex items-center"
                            style={{
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '9.5px',
                              fontWeight: 800
                            }}
                          >
                            FIRE
                          </span>
                        ) : (
                          <span
                            className="shrink-0"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isSelected ? '#2563eb' : '#94a3b8'
                            }}
                          >
                            {floorNum === 1 ? 'Ground' : `${(floorNum - 1) * 3.8 + 3.8}m`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Floor Details */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Floor Title Banner */}
                <div
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{
                    background: floorHasFire
                      ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                      : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: floorHasFire ? '1px solid #fca5a5' : '1px solid #bfdbfe'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '14px' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: floorHasFire ? '#dc2626' : '#2563eb',
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: 900
                      }}
                    >
                      L{selectedFloor}
                    </div>
                    <div>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          Level {selectedFloor}: {FLOOR_THEMES[selectedFloor]?.name}
                        </h2>
                        {floorHasFire && (
                          <span
                            style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 800
                            }}
                          >
                            ACTIVE FIRE ALARM
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
                        Elevation: {((selectedFloor - 1) * 3.8).toFixed(1)}m to {(selectedFloor * 3.8).toFixed(1)}m • Area: 2,450 m² • 10 Monitored Digital Twin Zones
                      </p>
                    </div>
                  </div>

                  {/* Button to view in 3D */}
                  {onSelectFloor && (
                    <button
                      onClick={() => {
                        onSelectFloor(selectedFloor);
                        onClose();
                      }}
                      className="flex items-center cursor-pointer transition-all hover:scale-105"
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        borderRadius: '10px',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        gap: '6px',
                        border: 'none',
                        boxShadow: '0 3px 8px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      <Eye style={{ width: '15px', height: '15px' }} />
                      <span>Inspect in 3D Twin</span>
                    </button>
                  )}
                </div>

                {/* North & South Wing Room Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* North Wing (Rooms 1 - 5) */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px'
                    }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <Compass style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          North Wing (Rooms 1 - 5)
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        Egress: Stairwell A (West)
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      {northWingRooms.map((room, idx) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-2.5 rounded-xl transition-colors"
                          style={{
                            background: room.hasFire ? '#fef2f2' : '#f8fafc',
                            border: room.hasFire ? '1px solid #fecaca' : '1px solid #f1f5f9'
                          }}
                        >
                          <div className="flex items-center" style={{ gap: '10px' }}>
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '7px',
                                background: room.hasFire ? '#fee2e2' : '#e0e7ff',
                                color: room.hasFire ? '#dc2626' : '#4338ca',
                                fontSize: '11px',
                                fontWeight: 800
                              }}
                            >
                              0{idx + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: room.hasFire ? '#b91c1c' : '#0f172a' }}>
                                {room.name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                Cam: {room.camId} • Sensor ID: SNS-{selectedFloor}0{idx + 1}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-right" style={{ gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11.5px', fontWeight: 800, color: room.peopleCount > 0 ? '#0f172a' : '#94a3b8' }}>
                                {room.peopleCount} {room.peopleCount === 1 ? 'person' : 'people'}
                              </div>
                              <div style={{ fontSize: '10px', color: room.hasFire ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                                {room.hasFire ? '🔥 Fire Detected' : `${room.tempCelsius || 22}°C Normal`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* South Wing (Rooms 6 - 10) */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px'
                    }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <Compass style={{ width: '16px', height: '16px', color: '#059669' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          South Wing (Rooms 6 - 10)
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        Egress: Stairwell B (East)
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      {southWingRooms.map((room, idx) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-2.5 rounded-xl transition-colors"
                          style={{
                            background: room.hasFire ? '#fef2f2' : '#f8fafc',
                            border: room.hasFire ? '1px solid #fecaca' : '1px solid #f1f5f9'
                          }}
                        >
                          <div className="flex items-center" style={{ gap: '10px' }}>
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '7px',
                                background: room.hasFire ? '#fee2e2' : '#dcfce7',
                                color: room.hasFire ? '#dc2626' : '#15803d',
                                fontSize: '11px',
                                fontWeight: 800
                              }}
                            >
                              0{idx + 6}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: room.hasFire ? '#b91c1c' : '#0f172a' }}>
                                {room.name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                Cam: {room.camId} • Sensor ID: SNS-{selectedFloor}{idx + 6 < 10 ? '0' + (idx + 6) : idx + 6}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-right" style={{ gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11.5px', fontWeight: 800, color: room.peopleCount > 0 ? '#0f172a' : '#94a3b8' }}>
                                {room.peopleCount} {room.peopleCount === 1 ? 'person' : 'people'}
                              </div>
                              <div style={{ fontSize: '10px', color: room.hasFire ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                                {room.hasFire ? '🔥 Fire Detected' : `${room.tempCelsius || 22}°C Normal`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Egress Routes Summary Card */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '14px 18px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                      Designated Level {selectedFloor} Egress Stairwells:
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      Maximum Travel Distance to Exit: 28.5m (NFPA 101 compliant)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center p-2.5 rounded-xl bg-white border border-slate-200" style={{ gap: '10px' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>Stairwell A (West Core)</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Rated: 60 evacuees/min • Pressurized</div>
                      </div>
                    </div>
                    <div className="flex items-center p-2.5 rounded-xl bg-white border border-slate-200" style={{ gap: '10px' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>Stairwell B (East Core)</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Rated: 60 evacuees/min • Smoke Hatch</div>
                      </div>
                    </div>
                    <div className="flex items-center p-2.5 rounded-xl bg-white border border-slate-200" style={{ gap: '10px' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>Service Core C (Ground Egress)</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Direct outside assembly link</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: ARCHITECTURAL & STRUCTURAL SPECS
             ======================================================== */}
          {activeTab === 'SPECS' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Structural System */}
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '14px' }}>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Building2 style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        Structural System
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>Reinforced Concrete & Steel Core</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-[12px]">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Core Walls:</span>
                      <span className="font-semibold text-slate-800">450mm Post-Tensioned Shear</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Floor Slabs:</span>
                      <span className="font-semibold text-slate-800">220mm Post-Tensioned Flat Plate</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Column Grid:</span>
                      <span className="font-semibold text-slate-800">9.0m x 9.0m Open Span</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Total Tower Height:</span>
                      <span className="font-semibold text-slate-800">42.50 Meters (139.4 ft)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Floor-to-Floor Height:</span>
                      <span className="font-semibold text-slate-800">3.80m (Clear ceiling: 2.85m)</span>
                    </div>
                  </div>
                </div>

                {/* Building Envelope & Facade */}
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '14px' }}>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Wind style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        Facade & Thermal Envelope
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>Unitized Low-E Curtain Wall</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-[12px]">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Glazing Type:</span>
                      <span className="font-semibold text-slate-800">Double Low-E Acoustic Argon</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">SHGC / Solar Heat Gain:</span>
                      <span className="font-semibold text-slate-800">0.26 (High Efficiency)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">U-Value Rating:</span>
                      <span className="font-semibold text-slate-800">1.35 W/m²K</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Wind Load Rating:</span>
                      <span className="font-semibold text-slate-800">2.8 kPa (Cat 4 Resilient)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Automated Louvers:</span>
                      <span className="font-semibold text-slate-800">Motorized Smoke Exhaust Ready</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Transportation / Elevators */}
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '14px' }}>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Zap style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        Elevator Core System
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>Otis SkyRise Regenerative Traction</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-[12px]">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shafts & Cars:</span>
                      <span className="font-semibold text-slate-800">3 Passenger + 1 Service</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Rated Speed:</span>
                      <span className="font-semibold text-slate-800">3.50 m/s (0 - 10th in 14s)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Rated Capacity:</span>
                      <span className="font-semibold text-slate-800">1,600 kg (21 Persons / car)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Fire Recall Phase 1:</span>
                      <span className="font-semibold text-emerald-600">Auto Return to Ground (L1)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Fire Recall Phase 2:</span>
                      <span className="font-semibold text-blue-600">Firefighters Key Override</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spatial Geometry & BIM Footprint */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      BIM Spatial Model & Dimensions
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      Coordinate system aligned with Digital Twin simulation engine (X: -30m to +30m, Z: -22m to +22m)
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold">
                    LOD 400 Construction BIM
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-400 font-bold uppercase">Tower Footprint</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">60.0m x 44.0m</div>
                    <div className="text-[11px] text-slate-500">2,640 m² site coverage</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-400 font-bold uppercase">Total Volume</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">93,100 m³</div>
                    <div className="text-[11px] text-slate-500">Conditioned indoor air</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-400 font-bold uppercase">Foundation Type</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">Cast-In-Place Mat</div>
                    <div className="text-[11px] text-slate-500">2.2m thickness on 64 piles</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-400 font-bold uppercase">Seismic Zone</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">Zone 4 (High)</div>
                    <div className="text-[11px] text-slate-500">Ductility factor R = 6.5</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: LIFE SAFETY & FIRE SUPPRESSION
             ======================================================== */}
          {activeTab === 'LIFE_SAFETY' && (
            <div className="flex flex-col gap-5">
              {/* Top 3 Fire Life Safety Pillar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid #fed7aa',
                    background: '#fffaf5'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                      <Droplets style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#9a3412' }}>
                        NFPA 13 Zoned Sprinklers
                      </h4>
                      <p style={{ fontSize: '11px', color: '#c2410c' }}>Wet Pipe Quick-Response System</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dedicated 120,000-liter underground fire reserve cistern in sub-basement.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dual 1,500 GPM electric + diesel centrifugal fire booster pumps.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Independent flow switch & tamper monitoring per individual floor zone.</span>
                    </li>
                  </ul>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                      <Wind style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e40af' }}>
                        Smoke Management & Pressure
                      </h4>
                      <p style={{ fontSize: '11px', color: '#1d4ed8' }}>50 Pa Stairwell Pressurization</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dual variable-speed pressurization fans in West and East stair towers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Positive pressure barrier prevents smoke ingress upon door actuation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Roof-mounted 24,000 CFM smoke exhaust louvers over central corridors.</span>
                    </li>
                  </ul>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid #bbf7d0',
                    background: '#f0fdf4'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                      <ShieldCheck style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#166534' }}>
                        VESDA Laser Detection
                      </h4>
                      <p style={{ fontSize: '11px', color: '#15803d' }}>Aspirated Continuous Particle Scan</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Detects pre-combustion microscopic aerosols up to 45 min before visible flames.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>100 Multi-criteria optical/thermal sensors connected to Digital Twin telemetry.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Automated signal relay directly to Metro Fire Command in &lt; 3 seconds.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Detailed Fire Life Safety Matrix */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff'
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                  NFPA 101 Egress Path & Life Safety Audit Matrix
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Egress Core / Zone</th>
                        <th className="py-2.5 px-3">Fire Rating</th>
                        <th className="py-2.5 px-3">Clear Width</th>
                        <th className="py-2.5 px-3">Flow Capacity</th>
                        <th className="py-2.5 px-3">Refuge Area</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">Stairwell A (West Core)</td>
                        <td className="py-3 px-3">2-Hour (120 min) Class A Concrete</td>
                        <td className="py-3 px-3">1,450 mm (Double Stretcher)</td>
                        <td className="py-3 px-3 font-semibold text-blue-600">60 persons / min</td>
                        <td className="py-3 px-3">2 Wheelchair Bays / Floor</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">Pressurized 50Pa</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">Stairwell B (East Core)</td>
                        <td className="py-3 px-3">2-Hour (120 min) Class A Concrete</td>
                        <td className="py-3 px-3">1,450 mm (Double Stretcher)</td>
                        <td className="py-3 px-3 font-semibold text-blue-600">60 persons / min</td>
                        <td className="py-3 px-3">2 Wheelchair Bays / Floor</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">Pressurized 50Pa</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">Stairwell C (South Exit)</td>
                        <td className="py-3 px-3">2-Hour Fire-Rated Core</td>
                        <td className="py-3 px-3">1,800 mm Wide Discharge</td>
                        <td className="py-3 px-3 font-semibold text-blue-600">80 persons / min</td>
                        <td className="py-3 px-3">Direct Ground Assembly</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">Operational</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-bold text-slate-800">Central Corridors (L1 - L10)</td>
                        <td className="py-3 px-3">1-Hour Non-Combustible Gypsum</td>
                        <td className="py-3 px-3">2,200 mm Central Aisle</td>
                        <td className="py-3 px-3 font-semibold text-slate-600">Unrestricted flow</td>
                        <td className="py-3 px-3">ADA Accessible Thresholds</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">Clear</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: MEP INFRASTRUCTURE & CONTACTS
             ======================================================== */}
          {activeTab === 'FACILITY_OPS' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Critical MEP Systems */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '14px' }}>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Cpu style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        Critical MEP Infrastructure
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>Electrical, HVAC & Water Redundancy</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Emergency Diesel Generator:</span>
                        <span className="text-emerald-600">1,500 kVA Caterpillar</span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        Dual fuel storage tanks (8,000L total) providing 48 hours of autonomous continuous life safety & emergency lighting runtime.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Central HVAC & Air Handling:</span>
                        <span className="text-blue-600">4x Daikin VAV Rooftop AHUs</span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        MERV 14 particulate filtration with automatic fire damper interlock shutoff upon alarm trip to prevent cross-floor smoke recirculation.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>UPS Battery Storage System:</span>
                        <span className="text-purple-600">250 kVA Online Double-Conversion</span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        Zero-transfer power delivery ensuring 100% uptime for building IoT sensors, CCTV surveillance switches, and Digital Twin edge servers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Incident Command Contacts */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                >
                  <div className="flex items-center" style={{ gap: '10px', marginBottom: '14px' }}>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <Phone style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        Emergency Incident Command Contacts
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>24/7 Rapid Response Coordination</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-extrabold text-slate-900">Security Operations Command (SOC)</div>
                        <div className="text-slate-500">Officer S. Kumar • Central Control Room</div>
                      </div>
                      <a
                        href="tel:5550192"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                      >
                        Ext: 4400
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-extrabold text-slate-900">Chief Facility Engineer</div>
                        <div className="text-slate-500">Marcus Vance, P.E. • MEP & Structural</div>
                      </div>
                      <a
                        href="tel:5550144"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                      >
                        +1 (555) 0144
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-extrabold text-slate-900">Metro Fire Department Dispatch</div>
                        <div className="text-slate-500">Station 14 • Ladder & Rescue 3</div>
                      </div>
                      <a
                        href="tel:911"
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
                      >
                        911 Emergency
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-extrabold text-slate-900">Building Medical & Trauma Liaison</div>
                        <div className="text-slate-500">Metro General Hospital Triage Unit</div>
                      </div>
                      <a
                        href="tel:5550188"
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors"
                      >
                        +1 (555) 0188
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory Compliance & Certifications Bar */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <Award style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      Official Safety Audits & Environmental Ratings
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    Audit Cycle: 2024 - 2026
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-800">NFPA 101 Standard</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ 100% Compliant</div>
                    <div className="text-[9.5px] text-slate-400">Life Safety Code</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-800">LEED Platinum v4.1</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ 88 Points Scored</div>
                    <div className="text-[9.5px] text-slate-400">U.S. Green Building Council</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-800">Fire NOC Certificate</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Valid thru Dec 2026</div>
                    <div className="text-[9.5px] text-slate-400">Metro Fire Bureau</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-800">ISO 45001 / 50001</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Certified Management</div>
                    <div className="text-[9.5px] text-slate-400">Health, Safety & Energy</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Bottom Footer ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff'
          }}
        >
          <div className="flex items-center" style={{ gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeFireRooms.length > 0 ? '#ef4444' : '#10b981',
                boxShadow: activeFireRooms.length > 0 ? '0 0 8px #ef4444' : '0 0 8px #10b981'
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              TwinGuard BIM Model Synced with 3D Simulation Engine • LOD 400
            </span>
          </div>

          <div className="flex items-center" style={{ gap: '10px' }}>
            <button
              onClick={onClose}
              className="cursor-pointer transition-colors hover:bg-slate-100"
              style={{
                height: '36px',
                padding: '0 18px',
                borderRadius: '10px',
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 700,
                border: 'none'
              }}
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

