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
const SignalBars = ({ color = '#ef4444' }) => (
  <svg viewBox="0 0 16 16" fill={color} style={{ width: '13px', height: '13px', flexShrink: 0 }}>
    <rect x="1" y="9" width="2.5" height="5" rx="0.75" />
    <rect x="5.5" y="6" width="2.5" height="8" rx="0.75" />
    <rect x="10" y="3" width="2.5" height="11" rx="0.75" />
  </svg>
);

// Green Exit Door icon matching the reference mockup
const ExitDoorIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#059669"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '14px', height: '14px', flexShrink: 0 }}
  >
    <path d="M13 4h3a2 2 0 0 1 2 2v14" />
    <path d="M2 20h20" />
    <path d="M13 20V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" />
    <circle cx="6" cy="12" r="1" fill="#059669" />
  </svg>
);

// Purple Staircase zig-zag icon matching the reference Card 2
const StaircaseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9333ea"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '22px', height: '22px' }}
  >
    <path d="M5 19h3.5v-3.5h3.5v-3.5h3.5v-3.5H19" />
  </svg>
);

// Emerald Crescent Moon icon matching the reference Card 4
const CrescentMoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="#047857"
    stroke="#047857"
    strokeWidth="1.5"
    style={{ width: '22px', height: '22px' }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// Door with arrow icon for navigation tab
const TabDoorIcon = ({ color = '#475569' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '15px', height: '15px', flexShrink: 0 }}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Pixel-perfect metadata definitions
const PRESET_DEFINITIONS = [
  {
    key: 'STANDARD_OFFICE_FIRE',
    altKeys: ['STANDARD_OFFICE_FIRE'],
    category: 'COMMERCIAL BASELINE',
    title: 'Standard Office Fire (Level 4)',
    description: 'Electrical fire in Level 4. All cores and exits operational.',
    iconBg: '#fee2e2',
    iconColor: '#ef4444',
    renderIcon: () => <Flame style={{ width: '24px', height: '24px', color: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' }} />,
    severityBadge: {
      text: 'Level 4 (High)',
      bg: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fecaca',
      barColor: '#ef4444'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: '#ecfdf5',
      color: '#059669',
      border: '1px solid #a7f3d0',
      renderIcon: () => <ExitDoorIcon />
    }
  },
  {
    key: 'CORE_A_BLOCKED',
    altKeys: ['STAIRWELL_BLOCKED', 'CORE_A_BLOCKED'],
    category: 'STRUCTURAL COMPROMISE',
    title: 'Stairwell A Blocked (Smoke Ingress)',
    description: 'Fire breaches Stairwell A. Evacuees must divert to Core B.',
    iconBg: '#f3e8ff',
    iconColor: '#9333ea',
    renderIcon: () => <StaircaseIcon />,
    severityBadge: {
      text: 'Level 5 (Catastrophic)',
      bg: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fecaca',
      barColor: '#ef4444'
    },
    exitBadge: {
      text: 'Stairwell A Blocked',
      bg: '#fff7ed',
      color: '#ea580c',
      border: '1px solid #fed7aa',
      renderIcon: () => <Ban style={{ width: '13px', height: '13px', color: '#ea580c', strokeWidth: 2.5 }} />
    }
  },
  {
    key: 'HIGH_DENSITY_SUMMIT',
    altKeys: ['HIGH_DENSITY_EVENT', 'HIGH_DENSITY_SUMMIT'],
    category: 'OVERCROWDED EVENT',
    title: 'Executive Summit (High Density L10 & L1)',
    description: 'Annual summit in Penthouse (L10) and Lobby (L1). Elevated crush risk.',
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    renderIcon: () => <Users style={{ width: '24px', height: '24px', color: '#2563eb' }} />,
    severityBadge: {
      text: 'Level 8 (Medium)',
      bg: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fef3c7',
      barColor: '#d97706'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: '#ecfdf5',
      color: '#059669',
      border: '1px solid #a7f3d0',
      renderIcon: () => <ExitDoorIcon />
    }
  },
  {
    key: 'NIGHT_SHIFT_SKELETON',
    altKeys: ['NIGHT_SHIFT_DELAYED', 'NIGHT_SHIFT_SKELETON'],
    category: 'OFF-PEAK HOURS',
    title: 'Night Shift (Low Density, Delayed Reaction)',
    description: 'Overnight facilities and maintenance. Sparse population, longer delay.',
    iconBg: '#ecfdf5',
    iconColor: '#047857',
    renderIcon: () => <CrescentMoonIcon />,
    severityBadge: {
      text: 'Level 3 (Medium)',
      bg: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fef3c7',
      barColor: '#d97706'
    },
    exitBadge: {
      text: 'All Exits Open',
      bg: '#ecfdf5',
      color: '#059669',
      border: '1px solid #a7f3d0',
      renderIcon: () => <ExitDoorIcon />
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center select-none"
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}
    >
      <div
        className="flex flex-col shadow-2xl overflow-hidden"
        style={{
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* ── 1. HEADER ── */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                flexShrink: 0
              }}
            >
              <Sparkles style={{ width: '22px', height: '22px', color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Emergency Scenario <span style={{ color: '#2563eb' }}>Configuration Studio</span>
                </span>
                <span
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #dbeafe',
                    color: '#2563eb',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    lineHeight: '1.4'
                  }}
                >
                  AI MODULE • PHASE 1
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
                Choose a pre-configured benchmark scenario to run analysis.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer transition-colors"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X style={{ width: '18px', height: '18px', strokeWidth: 2.5 }} />
          </button>
        </div>

        {/* ── 2. TAB NAVIGATION BAR (Clean with ample whitespace and exact styling) ── */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
            gap: '8px'
          }}
        >
          {/* Tab 1: Pre-Configured Scenarios */}
          <button
            onClick={() => setActiveTab('PRESETS')}
            className="cursor-pointer transition-all"
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              background: activeTab === 'PRESETS'
                ? 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: activeTab === 'PRESETS' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'PRESETS' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <LayoutGrid style={{ width: '15px', height: '15px', color: activeTab === 'PRESETS' ? '#ffffff' : '#64748b' }} />
            <span>Pre-Configured Scenarios</span>
          </button>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 6px', flexShrink: 0 }} />

          {/* Tab 2: Hazard & Room Placement */}
          <button
            onClick={() => setActiveTab('HAZARD')}
            className="cursor-pointer transition-all"
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: activeTab === 'HAZARD' ? 700 : 600,
              background: activeTab === 'HAZARD'
                ? 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: activeTab === 'HAZARD' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'HAZARD' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <Flame style={{ width: '15px', height: '15px', color: activeTab === 'HAZARD' ? '#ffffff' : '#ef4444' }} />
            <span>Hazard & Room Placement</span>
          </button>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 6px', flexShrink: 0 }} />

          {/* Tab 3: Exit & Structural Blockages */}
          <button
            onClick={() => setActiveTab('EXITS')}
            className="cursor-pointer transition-all"
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: activeTab === 'EXITS' ? 700 : 600,
              background: activeTab === 'EXITS'
                ? 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: activeTab === 'EXITS' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'EXITS' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <TabDoorIcon color={activeTab === 'EXITS' ? '#ffffff' : '#475569'} />
            <span>Exit & Structural Blockages</span>
          </button>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 6px', flexShrink: 0 }} />

          {/* Tab 4: Crowd Demographics & Mobility */}
          <button
            onClick={() => setActiveTab('DEMOGRAPHICS')}
            className="cursor-pointer transition-all"
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: activeTab === 'DEMOGRAPHICS' ? 700 : 600,
              background: activeTab === 'DEMOGRAPHICS'
                ? 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)'
                : 'transparent',
              color: activeTab === 'DEMOGRAPHICS' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'DEMOGRAPHICS' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <Users style={{ width: '15px', height: '15px', color: activeTab === 'DEMOGRAPHICS' ? '#ffffff' : '#475569' }} />
            <span>Crowd Demographics & Mobility</span>
          </button>
        </div>

        {/* ── 3. BODY CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#ffffff' }}>
          {/* TAB 1: PRESETS (2x2 Grid Exact to Mockup) */}
          {activeTab === 'PRESETS' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}
            >
              {PRESET_DEFINITIONS.map((def) => {
                const isSelected =
                  selectedPreset === def.key ||
                  def.altKeys.includes(selectedPreset);

                return (
                  <div
                    key={def.key}
                    onClick={() => handleSelectPreset(def.key)}
                    className="cursor-pointer transition-all relative"
                    style={{
                      borderRadius: '18px',
                      padding: '18px 20px',
                      background: '#ffffff',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      boxShadow: isSelected ? '0 4px 16px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '144px'
                    }}
                  >
                    {/* Top Row: Squircle Icon + Text Content + Selected Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '16px',
                          background: def.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {def.renderIcon()}
                      </div>

                      <div style={{ flex: 1, paddingRight: isSelected ? '28px' : '0' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#94a3b8'
                          }}
                        >
                          {def.category}
                        </div>
                        <div
                          style={{
                            fontSize: '14.5px',
                            fontWeight: 800,
                            color: '#0f172a',
                            marginTop: '2px',
                            lineHeight: 1.2
                          }}
                        >
                          {def.title}
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: '#64748b',
                            lineHeight: '1.4',
                            marginTop: '4px'
                          }}
                        >
                          {def.description}
                        </div>
                      </div>

                      {/* Selected Checkmark Badge (top right) */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#2563eb',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.4)'
                          }}
                        >
                          <Check style={{ width: '14px', height: '14px', strokeWidth: 3 }} />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Severity Tag + Exit Status Tag */}
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: def.severityBadge.bg,
                          color: def.severityBadge.color,
                          border: def.severityBadge.border
                        }}
                      >
                        <SignalBars color={def.severityBadge.barColor} />
                        <span>{def.severityBadge.text}</span>
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: def.exitBadge.bg,
                          color: def.exitBadge.color,
                          border: def.exitBadge.border
                        }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
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
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0f172a'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fl) => (
                      <option key={fl} value={fl}>
                        Level {fl} • {FLOOR_THEMES[fl]?.name || 'Department Floor'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
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
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0f172a'
                    }}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Emergency Threat Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            background: isSel ? '#eff6ff' : '#ffffff',
                            color: isSel ? '#1d4ed8' : '#334155',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hVal.color }} />
                          <span className="truncate">{hVal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Hazard Severity Rating
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #ef4444' : '1px solid #e2e8f0',
                            background: isSel ? '#fef2f2' : '#ffffff',
                            color: isSel ? '#b91c1c' : '#334155',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{sKey}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{sVal.temp}°C</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Heat & Smoke Spread Radius Slider */}
              <div style={{ padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame style={{ width: '15px', height: '15px', color: '#ef4444' }} />
                    Thermal Dispersion & Unwalkable Hazard Radius:
                  </span>
                  <span style={{ color: '#2563eb', fontFamily: 'monospace', fontWeight: 800 }}>
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
                  style={{ width: '100%', marginTop: '10px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>
                  <span>3.0m (Room Interior Only)</span>
                  <span>7.0m (Corridor Breach)</span>
                  <span>12.0m (Full Wing Ingress)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRUCTURAL FAILURES & EXITS */}
          {activeTab === 'EXITS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Emergency Stairwell Core Operability
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { id: 'exit_west', name: 'Stairwell A (West Core)', desc: 'Serves Levels 1–10 West Wing' },
                  { id: 'exit_east', name: 'Stairwell B (East Core)', desc: 'Serves Levels 1–10 East Wing' },
                  { id: 'exit_south', name: 'Stairwell C (South Plaza)', desc: 'Ground Level Main Exit' }
                ].map((core) => {
                  const isBlocked = scenarioState.structuralFailures?.blockedExits?.includes(core.id);

                  return (
                    <div
                      key={core.id}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: isBlocked ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        background: isBlocked ? '#fef2f2' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <Milestone style={{ width: '18px', height: '18px', color: isBlocked ? '#ef4444' : '#10b981' }} />
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: isBlocked ? '#fee2e2' : '#d1fae5',
                              color: isBlocked ? '#b91c1c' : '#047857',
                              border: isBlocked ? '1px solid #fecaca' : '1px solid #a7f3d0'
                            }}
                          >
                            {isBlocked ? 'BLOCKED' : 'OPERATIONAL'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{core.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{core.desc}</div>
                      </div>

                      <button
                        onClick={() => handleToggleExitBlocked(core.id)}
                        className="cursor-pointer transition-colors"
                        style={{
                          marginTop: '16px',
                          width: '100%',
                          padding: '8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: 'none',
                          background: isBlocked ? '#dc2626' : '#f1f5f9',
                          color: isBlocked ? '#ffffff' : '#334155'
                        }}
                      >
                        {isBlocked ? 'Unblock Stairwell' : 'Simulate Blockage'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Equipment Failure Toggles */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                  Equipment & Facility Failures
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ArrowUpDown style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Elevator Lockdown Mode</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Cars ground immediately per fire code</div>
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
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Zap style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>HVAC Damper Compromised</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Accelerates vertical smoke drift</div>
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
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEMOGRAPHICS & MOBILITY */}
          {activeTab === 'DEMOGRAPHICS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Heterogeneous Human Population Distribution
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Must Equal 100%</span>
              </div>

              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1e3a8a' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                      Standard Agile Staff (1.20 - 1.45 m/s)
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px' }}>
                      {Math.round((scenarioState.demographics?.standardRatio ?? 0.8) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((scenarioState.demographics?.standardRatio ?? 0.8) * 100)}
                    onChange={(e) => handleDemographicChange('standard', e.target.value)}
                    style={{ width: '100%', marginTop: '8px', cursor: 'pointer', accentColor: '#2563eb' }}
                  />
                </div>

                <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#92400e' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                      Slow Cadence / Senior (0.75 - 0.95 m/s)
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px' }}>
                      {Math.round((scenarioState.demographics?.slowRatio ?? 0.15) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={Math.round((scenarioState.demographics?.slowRatio ?? 0.15) * 100)}
                    onChange={(e) => handleDemographicChange('slow', e.target.value)}
                    style={{ width: '100%', marginTop: '8px', cursor: 'pointer', accentColor: '#f59e0b' }}
                  />
                </div>

                <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#faf5ff', border: '1px solid #f3e8ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#6b21a8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }} />
                      Assisted / Reduced Mobility (0.45 - 0.65 m/s)
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px' }}>
                      {Math.round((scenarioState.demographics?.assistedRatio ?? 0.05) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={Math.round((scenarioState.demographics?.assistedRatio ?? 0.05) * 100)}
                    onChange={(e) => handleDemographicChange('assisted', e.target.value)}
                    style={{ width: '100%', marginTop: '8px', cursor: 'pointer', accentColor: '#9333ea' }}
                  />
                </div>
              </div>

              {/* Reaction Hesitation Range */}
              <div style={{ padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock style={{ width: '15px', height: '15px', color: '#64748b' }} />
                    Reaction & Hesitation Delay:
                  </span>
                  <span style={{ color: '#2563eb', fontFamily: 'monospace', fontWeight: 800 }}>
                    {scenarioState.demographics?.reactionDelayMin || 2.0}s – {scenarioState.demographics?.reactionDelayMax || 8.0}s
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>MIN DELAY</label>
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
                      style={{ width: '100%', padding: '6px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>MAX DELAY</label>
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
                      style={{ width: '100%', padding: '6px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. FOOTER (Exact Match to Mockup) ── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button
            onClick={handleExportJSON}
            className="cursor-pointer transition-colors"
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            <FileText style={{ width: '15px', height: '15px', color: '#64748b' }} />
            <span>Export JSON</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              className="cursor-pointer transition-colors"
              style={{
                padding: '9px 20px',
                borderRadius: '12px',
                border: 'none',
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onApplyScenario(scenarioState);
                onClose();
              }}
              className="cursor-pointer transition-all"
              style={{
                padding: '9px 22px',
                borderRadius: '12px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
            >
              <Check style={{ width: '15px', height: '15px', strokeWidth: 3, color: '#ffffff' }} />
              <span>Apply Scenario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
