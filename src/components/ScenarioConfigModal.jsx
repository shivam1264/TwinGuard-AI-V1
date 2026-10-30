import React, { useState } from 'react';
import {
  Flame,
  Users,
  Check,
  RotateCcw,
  Download,
  X,
  Sparkles,
  LayoutGrid,
  DoorOpen,
  Ban,
  Moon,
  Milestone,
  ArrowUpDown,
  Zap,
  Clock,
  FileText
} from 'lucide-react';
import {
  AIEngine,
  PRESET_SCENARIOS,
  HAZARD_TYPES,
  SEVERITY_LEVELS
} from '../ai';
import { FLOOR_THEMES, ROOM_TEMPLATES } from '../simulation/Doorways';

// Signal / Bar icon for severity badges
const SignalBars = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
    <rect x="1" y="9" width="2.5" height="5" rx="0.75" />
    <rect x="5.5" y="6" width="2.5" height="8" rx="0.75" />
    <rect x="10" y="3" width="2.5" height="11" rx="0.75" />
  </svg>
);

// Staircase icon for Stairwell A Blocked card
const StaircaseIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19h4v-4h4v-4h4v-4h4" />
  </svg>
);

// Preset metadata for pixel-perfect card rendering
const PRESET_CARD_DATA = {
  STANDARD_OFFICE_FIRE: {
    category: 'COMMERCIAL BASELINE',
    Icon: Flame,
    iconWrapBg: 'bg-red-50 text-red-500',
    severityBadge: {
      text: 'Level 4 (High)',
      bg: 'bg-red-50 text-red-600 border-red-100'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      Icon: DoorOpen
    }
  },
  STAIRWELL_BLOCKED: {
    category: 'STRUCTURAL COMPROMISE',
    Icon: StaircaseIcon,
    iconWrapBg: 'bg-purple-50 text-purple-600',
    severityBadge: {
      text: 'Level 5 (Catastrophic)',
      bg: 'bg-red-50 text-red-600 border-red-100'
    },
    exitBadge: {
      text: 'Stairwell A Blocked',
      bg: 'bg-orange-50 text-orange-600 border-orange-100',
      Icon: Ban
    }
  },
  HIGH_DENSITY_EVENT: {
    category: 'OVERCROWDED EVENT',
    Icon: Users,
    iconWrapBg: 'bg-blue-50 text-blue-600',
    severityBadge: {
      text: 'Level 8 (Medium)',
      bg: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      Icon: DoorOpen
    }
  },
  NIGHT_SHIFT_DELAYED: {
    category: 'OFF-PEAK HOURS',
    Icon: Moon,
    iconWrapBg: 'bg-emerald-50 text-emerald-600',
    severityBadge: {
      text: 'Level 3 (Medium)',
      bg: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      Icon: DoorOpen
    }
  }
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white border border-slate-200/80 rounded-[24px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900 leading-none">
                  Emergency Scenario <span className="text-blue-600">Configuration Studio</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold tracking-wider uppercase">
                  AI MODULE • PHASE 1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Choose a pre-configured benchmark scenario to run analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100/70 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center px-6 py-3 border-b border-slate-100 bg-white text-xs font-semibold overflow-x-auto">
          {/* Tab 1: Pre-Configured Scenarios */}
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'PRESETS'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Pre-Configured Scenarios</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-2 shrink-0" />

          {/* Tab 2: Hazard & Room Placement */}
          <button
            onClick={() => setActiveTab('HAZARD')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'HAZARD'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeTab === 'HAZARD' ? 'text-white' : 'text-red-500'}`} />
            <span>Hazard & Room Placement</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-2 shrink-0" />

          {/* Tab 3: Exit & Structural Blockages */}
          <button
            onClick={() => setActiveTab('EXITS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'EXITS'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <DoorOpen className={`w-3.5 h-3.5 ${activeTab === 'EXITS' ? 'text-white' : 'text-slate-500'}`} />
            <span>Exit & Structural Blockages</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-2 shrink-0" />

          {/* Tab 4: Crowd Demographics & Mobility */}
          <button
            onClick={() => setActiveTab('DEMOGRAPHICS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'DEMOGRAPHICS'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'DEMOGRAPHICS' ? 'text-white' : 'text-slate-500'}`} />
            <span>Crowd Demographics & Mobility</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: PRESETS (Exact match to reference mockup) */}
          {activeTab === 'PRESETS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PRESET_SCENARIOS).map(([key, sc]) => {
                const isSelected = selectedPreset === key;
                const meta = PRESET_CARD_DATA[key] || {
                  category: sc.category?.toUpperCase() || 'CUSTOM BENCHMARK',
                  Icon: Flame,
                  iconWrapBg: 'bg-blue-50 text-blue-600',
                  severityBadge: {
                    text: `Level ${sc.hazard?.floor || 1} (${sc.hazard?.severity || 'Med'})`,
                    bg: 'bg-red-50 text-red-600 border-red-100'
                  },
                  exitBadge: {
                    text: sc.structuralFailures?.blockedExits?.length > 0 ? 'Exits Blocked' : 'All Exits Open',
                    bg: sc.structuralFailures?.blockedExits?.length > 0
                      ? 'bg-orange-50 text-orange-600 border-orange-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    Icon: sc.structuralFailures?.blockedExits?.length > 0 ? Ban : DoorOpen
                  }
                };

                const CardIcon = meta.Icon;
                const ExitIcon = meta.exitBadge.Icon;

                return (
                  <div
                    key={key}
                    onClick={() => handleSelectPreset(key)}
                    className={`rounded-2xl p-4 transition-all cursor-pointer relative bg-white flex flex-col justify-between min-h-[148px] ${
                      isSelected
                        ? 'border-2 border-blue-600 shadow-md shadow-blue-500/10'
                        : 'border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Icon + Header Info + Check Badge */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconWrapBg}`}
                      >
                        <CardIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 pr-6">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                          {meta.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                          {sc.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {sc.description}
                        </p>
                      </div>

                      {/* Selected Checkmark Badge in Top Right */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Severity Tag + Exit Status Tag */}
                    <div className="mt-3.5 pt-3 flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${meta.severityBadge.bg}`}
                      >
                        <SignalBars className="w-3 h-3" />
                        <span>{meta.severityBadge.text}</span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${meta.exitBadge.bg}`}
                      >
                        <ExitIcon className="w-3.5 h-3.5" />
                        <span>{meta.exitBadge.text}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: HAZARD CONFIGURATION */}
          {activeTab === 'HAZARD' && (
            <div className="space-y-5 bg-white">
              {/* Room & Floor Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Floor (1 to 10)
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
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
                    Target Room / Chamber
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
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

              {/* Hazard Type & Severity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Threat Type
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
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                            isSel
                              ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hVal.color }} />
                          <span className="truncate">{hVal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                            isSel
                              ? 'border-red-600 bg-red-50/50 text-red-900 shadow-xs'
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

              {/* Dynamic Heat & Smoke Spread Radius Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    Thermal Dispersion & Unwalkable Hazard Radius:
                  </span>
                  <span className="text-blue-600 font-mono">{scenarioState.hazard?.smokeSpreadRadius || 7} meters</span>
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
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
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
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Emergency Stairwell Core Operability
              </span>

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
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isBlocked
                          ? 'border-red-500 bg-red-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Milestone className={`w-5 h-5 ${isBlocked ? 'text-red-500' : 'text-emerald-500'}`} />
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isBlocked ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isBlocked ? 'BLOCKED' : 'OPERATIONAL'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">{core.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{core.desc}</div>
                      </div>

                      <button
                        onClick={() => handleToggleExitBlocked(core.id)}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          isBlocked
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20'
                            : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        {isBlocked ? 'Unblock Stairwell' : 'Simulate Blockage'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Equipment Failure Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Equipment & Facility Failures
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <ArrowUpDown className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Elevator Lockdown Mode</div>
                        <div className="text-[10px] text-slate-500">Cars ground immediately per fire code</div>
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

                  <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">HVAC Damper Compromised</div>
                        <div className="text-[10px] text-slate-500">Accelerates vertical smoke drift</div>
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
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Heterogeneous Human Population Distribution
                </span>
                <span className="text-xs text-slate-400 font-medium">Total Must Equal 100%</span>
              </div>

              {/* Mobility Sliders */}
              <div className="space-y-4">
                {/* Standard Staff */}
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Standard Agile Staff (1.20 - 1.45 m/s)
                    </span>
                    <span className="font-mono text-blue-700 text-sm font-bold">
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
                  <div className="text-[10px] text-slate-500">
                    Normal unimpeded cadence, standard corridor & stair flight transit speed.
                  </div>
                </div>

                {/* Slow / Senior */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Slow Cadence / Senior (0.75 - 0.95 m/s)
                    </span>
                    <span className="font-mono text-amber-700 text-sm font-bold">
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
                  <div className="text-[10px] text-slate-500">
                    Reduced walking velocity. Causes natural trailing queues on narrow stair flights.
                  </div>
                </div>

                {/* Assisted / Wheelchair */}
                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      Assisted / Reduced Mobility (0.45 - 0.65 m/s)
                    </span>
                    <span className="font-mono text-purple-700 text-sm font-bold">
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
                  <div className="text-[10px] text-slate-500">
                    Requires assistance. Critical factor in doorway queue formation and bottleneck arching.
                  </div>
                </div>
              </div>

              {/* Reaction Hesitation Range */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Human Reaction & Pre-Evacuation Hesitation Delay:
                  </span>
                  <span className="font-mono text-blue-600">
                    {scenarioState.demographics?.reactionDelayMin || 2.0}s – {scenarioState.demographics?.reactionDelayMax || 8.0}s
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">MIN DELAY (Quick Response)</label>
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">MAX DELAY (Hesitant / Unaware)</label>
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
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Matching Reference) */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onApplyScenario(scenarioState);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Scenario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
