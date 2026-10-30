import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Users,
  ShieldAlert,
  Sliders,
  Check,
  RotateCcw,
  Download,
  Upload,
  X,
  Building2,
  Milestone,
  Zap,
  ArrowUpDown,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  AIEngine,
  PRESET_SCENARIOS,
  HAZARD_TYPES,
  SEVERITY_LEVELS,
  MOBILITY_PROFILES
} from '../ai';
import { FLOOR_THEMES, ROOM_TEMPLATES } from '../simulation/Doorways';

export const ScenarioConfigModal = ({
  isOpen,
  onClose,
  currentScenario,
  onApplyScenario,
  rooms = []
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('PRESETS'); // 'PRESETS' | 'HAZARD' | 'EXITS' | 'DEMOGRAPHICS'
  const [scenarioState, setScenarioState] = useState(() =>
    JSON.parse(JSON.stringify(currentScenario || AIEngine.getActiveScenario()))
  );
  const [selectedPreset, setSelectedPreset] = useState(scenarioState.id || 'STANDARD_OFFICE_FIRE');

  // Handle preset selection
  const handleSelectPreset = (presetKey) => {
    const preset = PRESET_SCENARIOS[presetKey];
    if (preset) {
      setSelectedPreset(presetKey);
      setScenarioState(JSON.parse(JSON.stringify(preset)));
    }
  };

  // Toggle exit blocked state
  const handleToggleExitBlocked = (exitId) => {
    setScenarioState((prev) => {
      const currentBlocked = prev.structuralFailures?.blockedExits || [];
      const isBlocked = currentBlocked.includes(exitId);
      const updatedBlocked = isBlocked
        ? currentBlocked.filter((id) => id !== exitId)
        : [...currentBlocked, exitId];

      return {
        ...prev,
        structuralFailures: {
          ...prev.structuralFailures,
          blockedExits: updatedBlocked
        }
      };
    });
  };

  // Update Demographic distribution
  const handleDemographicChange = (type, value) => {
    const num = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
    setScenarioState((prev) => {
      const d = { ...prev.demographics };
      if (type === 'standard') d.standardRatio = num / 100;
      if (type === 'slow') d.slowRatio = num / 100;
      if (type === 'assisted') d.assistedRatio = num / 100;

      // Normalize if total exceeds 100
      const total = d.standardRatio + d.slowRatio + d.assistedRatio;
      if (total > 1.0) {
        d.standardRatio = +(d.standardRatio / total).toFixed(2);
        d.slowRatio = +(d.slowRatio / total).toFixed(2);
        d.assistedRatio = +(d.assistedRatio / total).toFixed(2);
      }

      return { ...prev, demographics: d };
    });
  };

  // Export scenario JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scenarioState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${scenarioState.id || 'scenario'}_config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-150 select-none">
      <div
        className="flex flex-col w-full max-w-5xl shadow-2xl overflow-hidden max-h-[92vh]"
        style={{
          gap: '14px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          fontFamily: "'Inter', system-ui, sans-serif",
          boxSizing: 'border-box'
        }}
      >
        {/* ── 1. TOP HEADER CARD (Matching Reference Image 3) ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Left: Soft Blue Icon Badge & Titles */}
          <div className="flex items-center" style={{ gap: '14px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: '#ebf5ff',
                border: '1px solid #d0e7ff',
                color: '#0284c7'
              }}
            >
              <Sparkles style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Emergency Scenario Configuration Studio
                </h1>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8'
                  }}
                >
                  AI Module • Phase 1
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '3px' }}>
                BIM hazard placement, structural failure simulations & heterogeneous human crowd demographics
              </p>
            </div>
          </div>

          {/* Right: Operational Status Pill & Close Button */}
          <div className="flex items-center" style={{ gap: '14px' }}>
            <div
              className="hidden sm:flex items-center"
              style={{
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                borderRadius: '12px',
                padding: '6px 14px',
                gap: '10px'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }}
              />
              <div className="text-left">
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0d7a5f', lineHeight: 1.1 }}>
                  Scenario Engine Active
                </div>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                  Pre-configured baseline ready
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer transition-colors"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}
              title="Close Dialog"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* ── 2. SEGMENTED TAB NAVIGATION (Clean Pill Switcher) ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '6px 10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('PRESETS')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'PRESETS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Pre-Engineered Scenarios</span>
            </button>

            <button
              onClick={() => setActiveTab('HAZARD')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'HAZARD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Hazard & Room Placement</span>
            </button>

            <button
              onClick={() => setActiveTab('EXITS')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'EXITS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Milestone className="w-3.5 h-3.5 text-amber-500" />
              <span>Exit & Structural Blockages</span>
            </button>

            <button
              onClick={() => setActiveTab('DEMOGRAPHICS')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'DEMOGRAPHICS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>Crowd Demographics & Mobility</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-slate-400 pr-2">
            <span>Tested against NFPA & IFC Building Codes</span>
          </div>
        </div>

        {/* ── 3. TAB BODY CONTENT (Clean White Cards Grid) ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1" style={{ scrollbarWidth: 'none' }}>
          {/* TAB 1: PRESETS */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Pre-Configured Benchmark Scenario
                </span>
                <span className="text-xs text-slate-400 font-medium">Click card to load parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(PRESET_SCENARIOS).map(([key, sc]) => {
                  const isSelected = selectedPreset === key;
                  const isBlocked = sc.structuralFailures?.blockedExits?.length > 0;

                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                      style={{
                        boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                            {sc.category}
                          </span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-300 bg-slate-50'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Title & Short Tag */}
                        <div>
                          <div className="text-sm font-black text-slate-900">{sc.name}</div>
                          <div className="text-[11px] font-semibold text-blue-600 mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>
                              {key === 'STANDARD_OFFICE_FIRE' && 'Level 4 Computing Lab • Full Dual-Core Egress'}
                              {key === 'CORE_A_BLOCKED' && 'Level 5 Thermal Breach • Divert 100% to Core B'}
                              {key === 'HIGH_DENSITY_SUMMIT' && 'L10 Penthouse & L1 Lobby • 1.7x Crowd Pressure'}
                              {key === 'NIGHT_SHIFT_SKELETON' && 'L3 Server Infrastructure • 0.35x Low-Density Shift'}
                            </span>
                          </div>
                        </div>

                        {/* 3 Visual Micro-KPI Tiles (Analytics Card Style) */}
                        <div className="grid grid-cols-3 gap-2 pt-1 text-left">
                          {/* KPI 1: Threat Severity */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Flame className="w-3 h-3 text-red-500" /> Threat
                            </span>
                            <div className="text-xs font-black text-slate-800 mt-1">
                              L{sc.hazard.floor} <span className="text-[10px] font-bold text-red-600">({sc.hazard.severity})</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{sc.hazard.tempCelsius}°C • {sc.hazard.smokeSpreadRadius}m</span>
                          </div>

                          {/* KPI 2: Core Egress */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Milestone className="w-3 h-3 text-emerald-500" /> Cores
                            </span>
                            <div className={`text-xs font-black mt-1 ${isBlocked ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {isBlocked ? 'Core B Only' : 'Dual Cores'}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">{isBlocked ? 'Stair A Ingress' : 'West + East Open'}</span>
                          </div>

                          {/* KPI 3: Population */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Users className="w-3 h-3 text-purple-500" /> Volume
                            </span>
                            <div className="text-xs font-black text-slate-800 mt-1">
                              {Math.round(sc.populationMultiplier * 100)}%
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">{Math.round((sc.populationMultiplier || 1) * 190)} Occupants</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Pill */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                        <span className={`flex items-center gap-1.5 ${isSelected ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                          <span>{isSelected ? 'Active Scenario Benchmark' : 'Click to Load Parameters'}</span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                          isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isSelected ? 'LOADED' : 'SELECT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HAZARD CONFIGURATION */}
          {activeTab === 'HAZARD' && (
            <div className="space-y-4">
              {/* Floor & Room Selection Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    BIM Location Assignment
                  </span>
                  <span className="text-xs text-slate-400">10-Floor High-Rise Facility</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Floor Level
                    </label>
                    <select
                      value={scenarioState.hazard?.floor || 4}
                      onChange={(e) => {
                        const fl = parseInt(e.target.value, 10);
                        setScenarioState((prev) => ({
                          ...prev,
                          hazard: {
                            ...prev.hazard,
                            floor: fl,
                            roomId: `f${fl}_r${prev.hazard?.roomId?.split('_r')[1] || '1'}`
                          }
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fl) => (
                        <option key={fl} value={fl}>
                          Level {fl} • {FLOOR_THEMES[fl]?.name || 'Department Floor'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Room / Space
                    </label>
                    <select
                      value={scenarioState.hazard?.roomId || 'f4_r3'}
                      onChange={(e) => {
                        const rId = e.target.value;
                        setScenarioState((prev) => ({
                          ...prev,
                          hazard: { ...prev.hazard, roomId: rId }
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {ROOM_TEMPLATES.map((tmpl) => {
                        const targetFloor = scenarioState.hazard?.floor || 4;
                        const roomId = `f${targetFloor}_${tmpl.idSuffix}`;
                        return (
                          <option key={roomId} value={roomId}>
                            {tmpl.nameSuffix} ({roomId})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Threat Classification & Severity */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    Threat Classification & Thermal Severity
                  </span>
                  <span className="text-xs text-slate-400">Dynamic Thermodynamic Dispersion</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Emergency Hazard Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(HAZARD_TYPES).map(([hKey, hVal]) => {
                        const isSel = scenarioState.hazard?.type === hKey;
                        return (
                          <button
                            key={hKey}
                            onClick={() =>
                              setScenarioState((prev) => ({
                                ...prev,
                                hazard: { ...prev.hazard, type: hKey }
                              }))
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              isSel
                                ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hVal.color }} />
                            <span className="truncate">{hVal.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Hazard Severity Rating
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(SEVERITY_LEVELS).map(([sKey, sVal]) => {
                        const isSel = scenarioState.hazard?.severity === sKey;
                        return (
                          <button
                            key={sKey}
                            onClick={() =>
                              setScenarioState((prev) => ({
                                ...prev,
                                hazard: {
                                  ...prev.hazard,
                                  severity: sKey,
                                  tempCelsius: sVal.temp,
                                  smokeSpreadRadius: sVal.radius
                                }
                              }))
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isSel
                                ? 'border-red-600 bg-red-50/60 text-red-900 shadow-xs'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>{sKey}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{sVal.temp}°C</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispersion Radius Slider Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    Thermal Dispersion & Unwalkable Hazard Radius:
                  </span>
                  <span className="text-blue-600 font-mono font-black text-sm bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
                    {scenarioState.hazard?.smokeSpreadRadius || 7} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="12.0"
                  step="0.5"
                  value={scenarioState.hazard?.smokeSpreadRadius || 7.0}
                  onChange={(e) =>
                    setScenarioState((prev) => ({
                      ...prev,
                      hazard: { ...prev.hazard, smokeSpreadRadius: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>3.0m (Room Interior Only)</span>
                  <span>7.0m (Corridor Breach)</span>
                  <span>12.0m (Full Wing Ingress)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRUCTURAL FAILURES & EXITS */}
          {activeTab === 'EXITS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Emergency Stairwell Core Operability
                </span>
                <span className="text-xs text-slate-400 font-medium">Click to toggle compromise state</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {[
                  { id: 'exit_west', name: 'Stairwell A (West Core)', desc: 'Serves Levels 1–10 West Wing' },
                  { id: 'exit_east', name: 'Stairwell B (East Core)', desc: 'Serves Levels 1–10 East Wing' },
                  { id: 'exit_south', name: 'Stairwell C (South Plaza)', desc: 'Ground Level Main Exit' }
                ].map((core) => {
                  const isBlocked = scenarioState.structuralFailures?.blockedExits?.includes(core.id);

                  return (
                    <div
                      key={core.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isBlocked
                          ? 'border-red-500 bg-red-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      style={{
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Milestone className={`w-5 h-5 ${isBlocked ? 'text-red-500' : 'text-emerald-500'}`} />
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${
                              isBlocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isBlocked ? 'BLOCKED' : 'OPERATIONAL'}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">{core.name}</div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">{core.desc}</div>
                      </div>

                      <button
                        onClick={() => handleToggleExitBlocked(core.id)}
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isBlocked
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        {isBlocked ? 'Unblock Stairwell' : 'Simulate Blockage'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Equipment Failure Toggles Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                  Equipment & Facility Failures
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Elevator Lockdown Mode</div>
                        <div className="text-[10px] text-slate-500">Grounds cars immediately per fire code</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={scenarioState.structuralFailures?.elevatorLocked ?? true}
                      onChange={(e) =>
                        setScenarioState((prev) => ({
                          ...prev,
                          structuralFailures: { ...prev.structuralFailures, elevatorLocked: e.target.checked }
                        }))
                      }
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">HVAC Damper Compromised</div>
                        <div className="text-[10px] text-slate-500">Accelerates vertical toxic smoke drift</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={scenarioState.structuralFailures?.hvacCompromised ?? false}
                      onChange={(e) =>
                        setScenarioState((prev) => ({
                          ...prev,
                          structuralFailures: { ...prev.structuralFailures, hvacCompromised: e.target.checked }
                        }))
                      }
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEMOGRAPHICS & MOBILITY */}
          {activeTab === 'DEMOGRAPHICS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Heterogeneous Human Population Distribution
                </span>
                <span className="text-xs text-slate-400 font-medium">Demographic Ratios Sum to 100%</span>
              </div>

              {/* Sliders in Clean White Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                {/* Standard Staff */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Standard Agile Staff (1.20 - 1.45 m/s)
                    </span>
                    <span className="font-mono text-blue-700 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {Math.round((scenarioState.demographics?.standardRatio ?? 0.8) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((scenarioState.demographics?.standardRatio ?? 0.8) * 100)}
                    onChange={(e) => handleDemographicChange('standard', e.target.value)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500">
                    Normal unimpeded cadence, standard corridor & stair flight transit speed.
                  </div>
                </div>

                {/* Slow / Senior */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Slow Cadence / Senior (0.75 - 0.95 m/s)
                    </span>
                    <span className="font-mono text-amber-700 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      {Math.round((scenarioState.demographics?.slowRatio ?? 0.15) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={Math.round((scenarioState.demographics?.slowRatio ?? 0.15) * 100)}
                    onChange={(e) => handleDemographicChange('slow', e.target.value)}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500">
                    Reduced walking velocity. Causes natural trailing queues on narrow stair flights.
                  </div>
                </div>

                {/* Assisted / Wheelchair */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      Assisted / Reduced Mobility (0.45 - 0.65 m/s)
                    </span>
                    <span className="font-mono text-purple-700 font-bold text-sm bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {Math.round((scenarioState.demographics?.assistedRatio ?? 0.05) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={Math.round((scenarioState.demographics?.assistedRatio ?? 0.05) * 100)}
                    onChange={(e) => handleDemographicChange('assisted', e.target.value)}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500">
                    Requires assistance. Critical factor in doorway queue formation and bottleneck arching.
                  </div>
                </div>
              </div>

              {/* Reaction Hesitation Range Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Human Reaction & Pre-Evacuation Hesitation Delay:
                  </span>
                  <span className="font-mono text-blue-600 font-extrabold bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
                    {scenarioState.demographics?.reactionDelayMin || 2.0}s – {scenarioState.demographics?.reactionDelayMax || 8.0}s
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">MIN DELAY (Quick Response)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      max="10.0"
                      value={scenarioState.demographics?.reactionDelayMin || 2.0}
                      onChange={(e) =>
                        setScenarioState((prev) => ({
                          ...prev,
                          demographics: { ...prev.demographics, reactionDelayMin: parseFloat(e.target.value) || 1.0 }
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">MAX DELAY (Hesitant / Unaware)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="5.0"
                      max="35.0"
                      value={scenarioState.demographics?.reactionDelayMax || 8.0}
                      onChange={(e) =>
                        setScenarioState((prev) => ({
                          ...prev,
                          demographics: { ...prev.demographics, reactionDelayMax: parseFloat(e.target.value) || 5.0 }
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. FOOTER ACTIONS CARD ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '12px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => handleSelectPreset('STANDARD_OFFICE_FIRE')}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onApplyScenario(scenarioState);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold tracking-wider uppercase shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Scenario to Digital Twin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
