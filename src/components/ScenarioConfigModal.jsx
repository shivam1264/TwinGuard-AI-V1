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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
                <span>Emergency Scenario Configuration Studio</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black tracking-wider uppercase">
                  AI Module • Phase 1
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                BIM Hazard Placement • Structural Failures • Heterogeneous Crowd Demographics
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-200/80 bg-slate-50/40 text-xs font-bold">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
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
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
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
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
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
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'DEMOGRAPHICS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span>Crowd Demographics & Mobility</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Select Pre-Configured Benchmark Scenario
                </span>
                <span className="text-xs text-slate-400">Tested against standard building codes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(PRESET_SCENARIOS).map(([key, sc]) => {
                  const isSelected = selectedPreset === key;
                  const isBlocked = sc.structuralFailures?.blockedExits?.length > 0;

                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-md shadow-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {sc.category}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="text-sm font-black text-slate-900">{sc.name}</div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">{sc.description}</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 text-red-600">
                          <Flame className="w-3.5 h-3.5" />
                          <span>Level {sc.hazard.floor} ({sc.hazard.severity})</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${isBlocked ? 'text-amber-600' : 'text-emerald-600'}`}>
                          <Milestone className="w-3.5 h-3.5" />
                          <span>{isBlocked ? 'Stairwell A Blocked' : 'All Exits Open'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HAZARD CONFIGURATION */}
          {activeTab === 'HAZARD' && (
            <div className="space-y-5">
              {/* Room & Floor Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
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
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
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
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
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
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
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
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
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
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isBlocked
                          ? 'border-red-500 bg-red-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Milestone className={`w-5 h-5 ${isBlocked ? 'text-red-500' : 'text-emerald-500'}`} />
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isBlocked ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isBlocked ? 'BLOCKED' : 'OPERATIONAL'}
                          </span>
                        </div>
                        <div className="text-sm font-black text-slate-900">{core.name}</div>
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
              <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
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
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Heterogeneous Human Population Distribution
                </span>
                <span className="text-xs text-slate-400">Total Must Equal 100%</span>
              </div>

              {/* Mobility Sliders */}
              <div className="space-y-4">
                {/* Standard Staff */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Standard Agile Staff (1.20 - 1.45 m/s)
                    </span>
                    <span className="font-mono text-blue-700 text-sm">
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
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Slow Cadence / Senior (0.75 - 0.95 m/s)
                    </span>
                    <span className="font-mono text-amber-700 text-sm">
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
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      Assisted / Reduced Mobility (0.45 - 0.65 m/s)
                    </span>
                    <span className="font-mono text-purple-700 text-sm">
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

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => handleSelectPreset('STANDARD_OFFICE_FIRE')}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onApplyScenario(scenarioState);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider uppercase shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
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
