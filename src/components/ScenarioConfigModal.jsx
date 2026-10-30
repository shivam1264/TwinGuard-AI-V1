import React, { useState } from 'react';
import {
  Flame,
  Users,
  Check,
  X,
  Sparkles,
  LayoutGrid,
  Ban,
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

// Signal / Bar icon matching the reference mockup
const SignalBars = ({ color = '#ef4444', className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" fill={color} className={className}>
    <rect x="1" y="9" width="2.5" height="5" rx="0.75" />
    <rect x="5.5" y="6" width="2.5" height="8" rx="0.75" />
    <rect x="10" y="3" width="2.5" height="11" rx="0.75" />
  </svg>
);

// Green Exit Door icon matching the reference mockup
const ExitDoorIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M13 4h3a2 2 0 0 1 2 2v14" />
    <path d="M2 20h20" />
    <path d="M13 20V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" />
    <circle cx="6" cy="12" r="1" fill="currentColor" />
  </svg>
);

// Purple Staircase zig-zag icon matching the reference Card 2
const StaircaseIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 19h3.5v-3.5h3.5v-3.5h3.5v-3.5H19" />
  </svg>
);

// Emerald Crescent Moon icon matching the reference Card 4
const CrescentMoonIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="#047857"
    stroke="#047857"
    strokeWidth="1.5"
    className={className}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Exit / Door Navigation Tab Icon
const TabExitIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Pixel-perfect metadata mapping for each preset scenario card
const PRESET_DEFINITIONS = [
  {
    key: 'STANDARD_OFFICE_FIRE',
    altKeys: ['STANDARD_OFFICE_FIRE'],
    category: 'COMMERCIAL BASELINE',
    title: 'Standard Office Fire (Level 4)',
    description: 'Electrical fire in Level 4. All cores and exits operational.',
    iconWrapBg: 'bg-[#fee2e2]/60 text-[#ef4444]',
    renderIcon: () => <Flame className="w-6 h-6 text-[#ef4444] fill-[#ef4444]/20" />,
    severityBadge: {
      text: 'Level 4 (High)',
      bg: 'bg-[#fef2f2] text-[#ef4444] border-[#fecaca]',
      barColor: '#ef4444'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: 'bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]',
      renderIcon: () => <ExitDoorIcon className="w-3.5 h-3.5 text-[#10b981]" />
    }
  },
  {
    key: 'CORE_A_BLOCKED',
    altKeys: ['STAIRWELL_BLOCKED', 'CORE_A_BLOCKED'],
    category: 'STRUCTURAL COMPROMISE',
    title: 'Stairwell A Blocked (Smoke Ingress)',
    description: 'Fire breaches Stairwell A. Evacuees must divert to Core B.',
    iconWrapBg: 'bg-[#f3e8ff] text-[#9333ea]',
    renderIcon: () => <StaircaseIcon className="w-6 h-6 text-[#9333ea]" />,
    severityBadge: {
      text: 'Level 5 (Catastrophic)',
      bg: 'bg-[#fef2f2] text-[#ef4444] border-[#fecaca]',
      barColor: '#ef4444'
    },
    exitBadge: {
      text: 'Stairwell A Blocked',
      bg: 'bg-[#fff7ed] text-[#ea580c] border-[#ffedd5]',
      renderIcon: () => <Ban className="w-3.5 h-3.5 text-[#ea580c] stroke-[2.2]" />
    }
  },
  {
    key: 'HIGH_DENSITY_SUMMIT',
    altKeys: ['HIGH_DENSITY_EVENT', 'HIGH_DENSITY_SUMMIT'],
    category: 'OVERCROWDED EVENT',
    title: 'Executive Summit (High Density L10 & L1)',
    description: 'Annual summit in Penthouse (L10) and Lobby (L1). Elevated crush risk.',
    iconWrapBg: 'bg-[#eff6ff] text-[#2563eb]',
    renderIcon: () => <Users className="w-6 h-6 text-[#2563eb]" />,
    severityBadge: {
      text: 'Level 8 (Medium)',
      bg: 'bg-[#fffbeb] text-[#f59e0b] border-[#fef3c7]',
      barColor: '#f59e0b'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: 'bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]',
      renderIcon: () => <ExitDoorIcon className="w-3.5 h-3.5 text-[#10b981]" />
    }
  },
  {
    key: 'NIGHT_SHIFT_SKELETON',
    altKeys: ['NIGHT_SHIFT_DELAYED', 'NIGHT_SHIFT_SKELETON'],
    category: 'OFF-PEAK HOURS',
    title: 'Night Shift (Low Density, Delayed Reaction)',
    description: 'Overnight facilities and maintenance. Sparse population, longer delay.',
    iconWrapBg: 'bg-[#ecfdf5] text-[#047857]',
    renderIcon: () => <CrescentMoonIcon className="w-6 h-6" />,
    severityBadge: {
      text: 'Level 3 (Medium)',
      bg: 'bg-[#fffbeb] text-[#f59e0b] border-[#fef3c7]',
      barColor: '#f59e0b'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: 'bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]',
      renderIcon: () => <ExitDoorIcon className="w-3.5 h-3.5 text-[#10b981]" />
    }
  }
];

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
  const [selectedPreset, setSelectedPreset] = useState(
    scenarioState.id || 'STANDARD_OFFICE_FIRE'
  );

  // Handle preset selection
  const handleSelectPreset = (presetKey) => {
    const preset =
      PRESET_SCENARIOS[presetKey] ||
      (presetKey === 'CORE_A_BLOCKED' ? PRESET_SCENARIOS.CORE_A_BLOCKED : null) ||
      (presetKey === 'HIGH_DENSITY_SUMMIT' ? PRESET_SCENARIOS.HIGH_DENSITY_SUMMIT : null) ||
      (presetKey === 'NIGHT_SHIFT_SKELETON' ? PRESET_SCENARIOS.NIGHT_SHIFT_SKELETON : null);

    if (preset) {
      setSelectedPreset(presetKey);
      setScenarioState(JSON.parse(JSON.stringify(preset)));
    } else {
      setSelectedPreset(presetKey);
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
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(scenarioState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${scenarioState.id || 'scenario'}_config.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className="bg-white border border-slate-200/90 rounded-[22px] w-full max-w-[940px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  Emergency Scenario <span className="text-[#2563eb]">Configuration Studio</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] text-[#2563eb] text-[10px] font-bold tracking-wider uppercase">
                  AI MODULE • PHASE 1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Choose a pre-configured benchmark scenario to run analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Navigation Bar (Exact match to reference mockup) */}
        <div className="flex items-center px-6 py-3 border-b border-slate-100 bg-white text-xs font-semibold overflow-x-auto">
          {/* Tab 1: Pre-Configured Scenarios */}
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'PRESETS'
                ? 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-white" />
            <span>Pre-Configured Scenarios</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-3 shrink-0" />

          {/* Tab 2: Hazard & Room Placement */}
          <button
            onClick={() => setActiveTab('HAZARD')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'HAZARD'
                ? 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'HAZARD' ? 'text-white' : 'text-[#ef4444]'}`} />
            <span>Hazard & Room Placement</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-3 shrink-0" />

          {/* Tab 3: Exit & Structural Blockages */}
          <button
            onClick={() => setActiveTab('EXITS')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'EXITS'
                ? 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TabExitIcon className={`w-4 h-4 ${activeTab === 'EXITS' ? 'text-white' : 'text-slate-600'}`} />
            <span>Exit & Structural Blockages</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-3 shrink-0" />

          {/* Tab 4: Crowd Demographics & Mobility */}
          <button
            onClick={() => setActiveTab('DEMOGRAPHICS')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'DEMOGRAPHICS'
                ? 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white font-bold shadow-md shadow-blue-500/25'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'DEMOGRAPHICS' ? 'text-white' : 'text-slate-600'}`} />
            <span>Crowd Demographics & Mobility</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {/* TAB 1: PRESETS (Pixel-perfect 2x2 Grid) */}
          {activeTab === 'PRESETS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_DEFINITIONS.map((def) => {
                const isSelected =
                  selectedPreset === def.key ||
                  def.altKeys.includes(selectedPreset);

                return (
                  <div
                    key={def.key}
                    onClick={() => handleSelectPreset(def.key)}
                    className={`rounded-2xl p-4 transition-all cursor-pointer relative bg-white flex flex-col justify-between min-h-[145px] ${
                      isSelected
                        ? 'border-2 border-[#2563eb] shadow-md shadow-blue-500/10'
                        : 'border border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Squircle Icon + Text + Selected Checkmark Badge */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${def.iconWrapBg}`}
                      >
                        {def.renderIcon()}
                      </div>

                      <div className="flex-1 pr-6">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                          {def.category}
                        </span>
                        <h3 className="text-[14.5px] font-bold text-slate-900 mt-0.5 leading-snug">
                          {def.title}
                        </h3>
                        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                          {def.description}
                        </p>
                      </div>

                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Severity Tag + Exit Status Tag */}
                    <div className="mt-3.5 pt-3 flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${def.severityBadge.bg}`}
                      >
                        <SignalBars color={def.severityBadge.barColor} className="w-3.5 h-3.5" />
                        <span>{def.severityBadge.text}</span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${def.exitBadge.bg}`}
                      >
                        {def.exitBadge.renderIcon()}
                        <span>{def.exitBadge.text}</span>
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

        {/* Footer Actions (Matching Reference Mockup) */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Export JSON</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onApplyScenario(scenarioState);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Check className="w-4 h-4 stroke-[3] text-white" />
              <span>Apply Scenario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
