import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Users,
  Check,
  Ban,
  Milestone,
  ArrowUpDown,
  Zap,
  Clock,
  FileText,
  Play,
  RotateCcw,
  Sliders,
  ShieldAlert,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import building3dImg from '../assets/building/building_3d_render.png';

export const ScenariosView = ({
  theme = 'dark',
  rooms = [],
  currentScenario,
  onApplyScenario,
  onSwitchToLive
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('HAZARD'); // 'HAZARD' | 'BLOCKAGES' | 'CROWD' | 'CONDITIONS'
  const [selectedPreset, setSelectedPreset] = useState('FIRE_L7');
  const [hazardType, setHazardType] = useState('Fire (Room / Space)');
  const [severity, setSeverity] = useState('High');
  const [selectedFloor, setSelectedFloor] = useState('Level 7 (L7)');
  const [selectedLocation, setSelectedLocation] = useState('West Stair Core (A)');
  const [fireGrowthModel, setFireGrowthModel] = useState('Standard (t² Growth)');
  const [heatReleaseRate, setHeatReleaseRate] = useState(5000);
  const [smokeGen, setSmokeGen] = useState(true);
  const [sprinklers, setSprinklers] = useState(true);

  const presets = [
    { id: 'FIRE_L7', label: 'Fire Incident', sub: 'Room / floor fire with smoke spread', icon: Flame, color: '#ef4444' },
    { id: 'STRUCT_FAIL', label: 'Structural Failure', sub: 'Stair / exit / corridor blockage', icon: Ban, color: '#f97316' },
    { id: 'HIGH_OCC', label: 'High Occupancy', sub: 'Elevated crowd density (peak hours)', icon: Users, color: '#38bdf8' },
    { id: 'MULTI_HAZ', label: 'Multi-Hazard', sub: 'Fire + blockage + crowd surge', icon: ShieldAlert, color: '#ec4899' },
    { id: 'CUSTOM', label: 'Custom Scenario', sub: 'Build your own configuration', icon: Sliders, color: '#a855f7' }
  ];

  const handleApply = () => {
    if (onApplyScenario) {
      onApplyScenario({
        name: 'Case: L7 West Stair Fire',
        type: 'Fire Incident',
        severity: 'High',
        hazard: {
          roomId: 'f7_r1',
          floor: 7,
          name: 'West Stair Core (A)'
        }
      });
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col overflow-y-auto no-scrollbar p-4 sm:p-6 gap-4 select-none transition-colors duration-300 ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #070d18 0%, #0c162d 100%)'
          : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Header Title Strip (Matching Reference Image 3) ── */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-sky-500/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white leading-tight">
                AI Scenario Configuration Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                AI MODULE • PHASE 1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Create, configure and run emergency scenarios on the Digital Twin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPreset('FIRE_L7')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 hover:text-white"
          >
            Load Preset
          </button>
          <button
            onClick={handleApply}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 border border-sky-400"
          >
            Save Scenario
          </button>
        </div>
      </div>

      {/* ── Sub Navigation Tabs (Matching Reference Image 3) ── */}
      <div className="flex items-center gap-2">
        {[
          { id: 'HAZARD', label: 'Hazard & Location', icon: Flame },
          { id: 'BLOCKAGES', label: 'Exit & Structural Blockages', icon: Ban },
          { id: 'CROWD', label: 'Crowd & Occupancy', icon: Users },
          { id: 'CONDITIONS', label: 'Conditions & Behavior', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              style={{
                background: isSelected ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'rgba(15, 23, 42, 0.7)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                border: isSelected ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(56, 189, 248, 0.18)',
                boxShadow: isSelected ? '0 0 14px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Studio Grid: 3 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Column 1: Presets Library (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            SCENARIO LIBRARY (PRESETS)
          </div>

          <div className="flex flex-col gap-2">
            {presets.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPreset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className="p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3"
                  style={{
                    background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(11, 22, 44, 0.7)',
                    border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.15)',
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${p.color}25`, border: `1px solid ${p.color}50`, color: p.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{p.label}</div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5 leading-tight">{p.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Selection Pill */}
          <div
            className="p-3 rounded-2xl flex items-center gap-3 mt-auto"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)'
            }}
          >
            <Flame className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Current Selection</div>
              <div className="text-xs font-black text-white">Case: L7 West Stair Fire</div>
              <div className="text-[10px] text-red-300 font-mono">Severity: High • Fire + Egress Obstruction</div>
            </div>
          </div>
        </div>

        {/* Column 2: Parameters & 3D Preview (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Top Form Controls Grid */}
          <div
            className="p-4 rounded-2xl flex flex-col gap-3"
            style={{
              background: 'rgba(11, 22, 44, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <div className="text-xs font-bold text-white">
              Hazard Configuration
              <span className="block text-[11px] text-slate-400 font-normal">
                Define the fire origin, intensity and affected area.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px] font-semibold">Hazard Type</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="bg-slate-900 border border-sky-500/30 rounded-xl p-2 text-white font-medium focus:outline-none"
                >
                  <option>Fire (Room / Space)</option>
                  <option>Chemical Hazard</option>
                  <option>Electrical Arc</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px] font-semibold">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="bg-slate-900 border border-sky-500/30 rounded-xl p-2 text-red-400 font-bold focus:outline-none"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Critical</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px] font-semibold">Floor</label>
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="bg-slate-900 border border-sky-500/30 rounded-xl p-2 text-white font-medium focus:outline-none"
                >
                  <option>Level 7 (L7)</option>
                  <option>Level 5 (L5)</option>
                  <option>Level 2 (L2)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px] font-semibold">Location / Room</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-slate-900 border border-sky-500/30 rounded-xl p-2 text-white font-medium focus:outline-none"
                >
                  <option>West Stair Core (A)</option>
                  <option>East Stair Core (B)</option>
                  <option>Main Lobby (Exit C)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3D Scenario Preview Viewport (Matching Reference Image 3) */}
          <div className="relative rounded-2xl overflow-hidden border border-sky-500/25 bg-slate-950/70 h-52 flex items-center justify-center">
            <img
              src={building3dImg}
              alt="Scenario Preview 3D"
              className="w-full h-full object-cover brightness-90 contrast-115"
            />
            {/* L7 West Stair Fire Pin */}
            <div
              className="absolute top-12 right-24 flex items-center gap-2 px-3 py-1.5 rounded-xl text-white font-bold text-xs"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
              }}
            >
              <Flame className="w-4 h-4 animate-bounce" />
              <span>L7 – West Stair Fire</span>
            </div>

            <div className="absolute bottom-2 left-3 px-2 py-1 rounded-lg bg-slate-900/80 text-[10.5px] font-mono text-sky-400 border border-sky-500/30">
              Level 7 • West Stair Core (A) • Fire Active (Simulated)
            </div>
          </div>

          {/* Fire Parameters Controls */}
          <div
            className="p-3 rounded-2xl flex items-center justify-between text-xs"
            style={{
              background: 'rgba(11, 22, 44, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <div>
              <span className="text-slate-400 block text-[10px]">Heat Release Rate</span>
              <span className="font-bold text-white font-mono">5,000 kW</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Smoke Generation</span>
              <span className="font-bold text-emerald-400">Enabled</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sprinkler System</span>
              <span className="font-bold text-emerald-400">Auto (ON)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Propagation Risk</span>
              <span className="font-bold text-red-400">High</span>
            </div>
          </div>
        </div>

        {/* Column 3: Scenario Summary & Simulation Impact (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Summary Card */}
          <div
            className="p-4 rounded-2xl flex flex-col gap-2"
            style={{
              background: 'rgba(11, 22, 44, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <Flame className="w-4 h-4" />
              <span>SCENARIO SUMMARY</span>
            </div>

            <div className="flex flex-col gap-2 text-[11px] text-slate-300 font-mono pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Case Name</span>
                <span className="font-bold text-white">L7 West Stair Fire</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Hazard Type</span>
                <span className="font-bold text-white">Fire (stairwell)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Location</span>
                <span className="font-bold text-white">Level 7 – Core A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Occupants</span>
                <span className="font-bold text-white">190</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Estimated Affected</span>
                <span className="font-bold text-red-400">42 (L7) + 18 (L8)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Primary Risk</span>
                <span className="font-bold text-amber-400">Stairwell obstruction</span>
              </div>
            </div>
          </div>

          {/* Simulation Impact Card */}
          <div
            className="p-4 rounded-2xl flex flex-col gap-2.5 flex-1"
            style={{
              background: 'rgba(11, 22, 44, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Zap className="w-4 h-4" />
              <span>Simulation Impact</span>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Triggers building evacuation</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Re-routes occupants to Core B</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Updates AI strategy evaluation</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Generates incident and analytics logs</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Digital Twin</span>
            </button>

            <button
              onClick={onSwitchToLive}
              className="w-full py-2 rounded-xl font-bold text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 cursor-pointer"
            >
              Cancel & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

