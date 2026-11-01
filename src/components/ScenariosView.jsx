import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Users,
  Check,
  Ban,
  Zap,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Save,
  CheckCircle2,
  FlaskConical,
  Cloud,
  Play,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import building3dImg from '../assets/building/building_3d_render.png';

const PRESET_DEFINITIONS = {
  FIRE_L7: {
    id: 'FIRE_L7',
    label: 'Fire Incident (L7 Core A)',
    category: 'High-Rise Fire',
    color: '#ef4444',
    hazardType: 'Fire (Room / Space)',
    severity: 'High',
    floor: 7,
    roomId: 'f7_r1',
    locationName: 'West Stair Core (A)',
    heatReleaseRate: 5000,
    smokeGen: true,
    smokeGenRate: 5.0,
    sprinklers: 'AUTO',
    fireGrowthModel: 'Standard (t² Growth)',
    blockedExits: ['exit_west'],
    elevatorLocked: true,
    damagedCorridors: [{ floor: 7, wing: 'west' }],
    populationMultiplier: 1.0,
    demographics: { standard: 80, assisted: 15, visitors: 5 },
    panicFactor: 'HIGH',
    conditions: {
      powerGridFailure: false,
      hvacFailure: false,
      windSpeed: 15,
      windDirection: 'West',
      ambientTemp: 26
    }
  },
  CASE_1_L1_FRONT_GATE: {
    id: 'CASE_1_L1_FRONT_GATE',
    label: 'Ground Fire (Front Gate)',
    category: 'Ground Floor Egress',
    color: '#f97316',
    hazardType: 'Fire (Room / Space)',
    severity: 'High',
    floor: 1,
    roomId: 'f1_r8',
    locationName: 'Main Lobby (Exit C)',
    heatReleaseRate: 6500,
    smokeGen: true,
    smokeGenRate: 6.0,
    sprinklers: 'AUTO',
    fireGrowthModel: 'Rapid Flashover',
    blockedExits: ['exit_south'],
    elevatorLocked: true,
    damagedCorridors: [{ floor: 1, wing: 'south_lobby' }],
    populationMultiplier: 1.0,
    demographics: { standard: 80, assisted: 15, visitors: 5 },
    panicFactor: 'MEDIUM',
    conditions: {
      powerGridFailure: false,
      hvacFailure: false,
      windSpeed: 20,
      windDirection: 'South',
      ambientTemp: 28
    }
  },
  CASE_1_L1_WEST_GATE: {
    id: 'CASE_1_L1_WEST_GATE',
    label: 'Ground Fire (West Gate)',
    category: 'Ground Floor Egress',
    color: '#eab308',
    hazardType: 'Fire (Room / Space)',
    severity: 'High',
    floor: 1,
    roomId: 'f1_r6',
    locationName: 'West Stair Core (A)',
    heatReleaseRate: 5500,
    smokeGen: true,
    smokeGenRate: 4.5,
    sprinklers: 'AUTO',
    fireGrowthModel: 'Standard (t² Growth)',
    blockedExits: ['exit_west'],
    elevatorLocked: true,
    damagedCorridors: [{ floor: 1, wing: 'west' }],
    populationMultiplier: 1.0,
    demographics: { standard: 80, assisted: 15, visitors: 5 },
    panicFactor: 'MEDIUM',
    conditions: {
      powerGridFailure: false,
      hvacFailure: false,
      windSpeed: 12,
      windDirection: 'West',
      ambientTemp: 25
    }
  },
  STRUCT_FAIL: {
    id: 'STRUCT_FAIL',
    label: 'Structural Failure (Dual Cores)',
    category: 'Structural Collapse',
    color: '#f97316',
    hazardType: 'Structural Defect',
    severity: 'Critical',
    floor: 4,
    roomId: 'f4_r1',
    locationName: 'East Stair Core (B)',
    heatReleaseRate: 2000,
    smokeGen: false,
    smokeGenRate: 1.0,
    sprinklers: 'OFF',
    fireGrowthModel: 'Smoldering Slow',
    blockedExits: ['exit_west', 'exit_east'],
    elevatorLocked: true,
    damagedCorridors: [{ floor: 4, wing: 'central_core' }],
    populationMultiplier: 1.0,
    demographics: { standard: 75, assisted: 20, visitors: 5 },
    panicFactor: 'HIGH',
    conditions: {
      powerGridFailure: true,
      hvacFailure: true,
      windSpeed: 25,
      windDirection: 'North',
      ambientTemp: 32
    }
  },
  HIGH_OCC: {
    id: 'HIGH_OCC',
    label: 'Crowd Surge (200% Load)',
    category: 'Crowd Surge',
    color: '#38bdf8',
    hazardType: 'Fire (Room / Space)',
    severity: 'Medium',
    floor: 5,
    roomId: 'f5_r3',
    locationName: 'Biotech Innovation Lab',
    heatReleaseRate: 3500,
    smokeGen: true,
    smokeGenRate: 3.5,
    sprinklers: 'AUTO',
    fireGrowthModel: 'Standard (t² Growth)',
    blockedExits: [],
    elevatorLocked: false,
    damagedCorridors: [],
    populationMultiplier: 2.0,
    demographics: { standard: 65, assisted: 20, visitors: 15 },
    panicFactor: 'HIGH',
    conditions: {
      powerGridFailure: false,
      hvacFailure: false,
      windSpeed: 10,
      windDirection: 'East',
      ambientTemp: 24
    }
  },
  MULTI_HAZ: {
    id: 'MULTI_HAZ',
    label: 'Multi-Hazard Catastrophe',
    category: 'Catastrophic Scenario',
    color: '#ec4899',
    hazardType: 'Chemical Hazard',
    severity: 'Critical',
    floor: 5,
    roomId: 'f5_r2',
    locationName: 'Chemical Synthesis Lab',
    heatReleaseRate: 8500,
    smokeGen: true,
    smokeGenRate: 9.0,
    sprinklers: 'DELAYED',
    fireGrowthModel: 'Rapid Flashover',
    blockedExits: ['exit_west'],
    elevatorLocked: true,
    damagedCorridors: [{ floor: 5, wing: 'west' }],
    populationMultiplier: 1.25,
    demographics: { standard: 70, assisted: 20, visitors: 10 },
    panicFactor: 'HIGH',
    conditions: {
      powerGridFailure: true,
      hvacFailure: true,
      windSpeed: 30,
      windDirection: 'North-East',
      ambientTemp: 34
    }
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom Studio Configuration',
    category: 'Custom Builder',
    color: '#a855f7',
    hazardType: 'Fire (Room / Space)',
    severity: 'High',
    floor: 2,
    roomId: 'f2_r1',
    locationName: 'Conference Room Alpha',
    heatReleaseRate: 4000,
    smokeGen: true,
    smokeGenRate: 4.0,
    sprinklers: 'AUTO',
    fireGrowthModel: 'Standard (t² Growth)',
    blockedExits: [],
    elevatorLocked: true,
    damagedCorridors: [],
    populationMultiplier: 1.0,
    demographics: { standard: 80, assisted: 15, visitors: 5 },
    panicFactor: 'MEDIUM',
    conditions: {
      powerGridFailure: false,
      hvacFailure: false,
      windSpeed: 10,
      windDirection: 'West',
      ambientTemp: 22
    }
  }
};

const ScenariosViewComponent = ({
  theme = 'dark',
  rooms = [],
  currentScenario,
  onApplyScenario,
  onSwitchToLive
}) => {
  const isDark = theme === 'dark';

  // ── Navigation & Selection State ──
  const [activeTab, setActiveTab] = useState('HAZARD'); // 'HAZARD' | 'BLOCKAGES' | 'CROWD' | 'CONDITIONS'
  const [selectedPreset, setSelectedPreset] = useState('FIRE_L7');
  const [toastMessage, setToastMessage] = useState(null);

  // ── Hazard & Location State ──
  const [hazardType, setHazardType] = useState('Fire (Room / Space)');
  const [severity, setSeverity] = useState('High');
  const [selectedFloor, setSelectedFloor] = useState(7);
  const [selectedRoomId, setSelectedRoomId] = useState('f7_r1');
  const [selectedLocation, setSelectedLocation] = useState('West Stair Core (A)');
  const [heatReleaseRate, setHeatReleaseRate] = useState(5000);
  const [smokeGen, setSmokeGen] = useState(true);
  const [smokeGenRate, setSmokeGenRate] = useState(5.0);
  const [sprinklers, setSprinklers] = useState('AUTO'); // 'AUTO' | 'DELAYED' | 'OFF'
  const [fireGrowthModel, setFireGrowthModel] = useState('Standard (t² Growth)');

  // ── Blockages & Structural State ──
  const [blockedExits, setBlockedExits] = useState(['exit_west']);
  const [elevatorLocked, setElevatorLocked] = useState(true);
  const [blockedCorridors, setBlockedCorridors] = useState(['f7_west']);

  // ── Crowd & Demographics State ──
  const [populationMultiplier, setPopulationMultiplier] = useState(1.0);
  const [demographics, setDemographics] = useState({ standard: 80, assisted: 15, visitors: 5 });
  const [panicFactor, setPanicFactor] = useState('HIGH');

  // ── Environmental Conditions State ──
  const [powerGridFailure, setPowerGridFailure] = useState(false);
  const [hvacFailure, setHvacFailure] = useState(false);
  const [windSpeed, setWindSpeed] = useState(15);
  const [windDirection, setWindDirection] = useState('West');
  const [ambientTemp, setAmbientTemp] = useState(26);

  // ── Filter Available Rooms for Selected Floor ──
  const floorRooms = useMemo(() => {
    const list = rooms.filter((r) => r.floor === selectedFloor);
    if (list.length > 0) return list;
    return Array.from({ length: 10 }, (_, i) => ({
      id: `f${selectedFloor}_r${i + 1}`,
      floor: selectedFloor,
      name: `Room ${selectedFloor}0${i + 1}`,
      peopleCount: 2
    }));
  }, [rooms, selectedFloor]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ── Load Preset ──
  const handleLoadPreset = (presetKey) => {
    const p = PRESET_DEFINITIONS[presetKey];
    if (!p) return;

    setSelectedPreset(presetKey);
    setHazardType(p.hazardType);
    setSeverity(p.severity);
    setSelectedFloor(p.floor);
    setSelectedRoomId(p.roomId);
    setSelectedLocation(p.locationName);
    setHeatReleaseRate(p.heatReleaseRate);
    setSmokeGen(p.smokeGen);
    setSmokeGenRate(p.smokeGenRate);
    setSprinklers(p.sprinklers);
    setFireGrowthModel(p.fireGrowthModel);
    setBlockedExits([...p.blockedExits]);
    setElevatorLocked(p.elevatorLocked);
    setBlockedCorridors(p.damagedCorridors.map((c) => `f${c.floor}_${c.wing}`));
    setPopulationMultiplier(p.populationMultiplier);
    setDemographics({ ...p.demographics });
    setPanicFactor(p.panicFactor);
    setPowerGridFailure(p.conditions.powerGridFailure);
    setHvacFailure(p.conditions.hvacFailure);
    setWindSpeed(p.conditions.windSpeed);
    setWindDirection(p.conditions.windDirection);
    setAmbientTemp(p.conditions.ambientTemp);

    showToast(`Preset: ${p.label}`);
  };

  const toggleBlockedExit = (exitId) => {
    setBlockedExits((prev) =>
      prev.includes(exitId) ? prev.filter((id) => id !== exitId) : [...prev, exitId]
    );
  };

  const toggleCorridor = (corrId) => {
    setBlockedCorridors((prev) =>
      prev.includes(corrId) ? prev.filter((id) => id !== corrId) : [...prev, corrId]
    );
  };

  // ── Real-Time Dynamic Impact Calculations ──
  const totalOccupants = Math.round(190 * populationMultiplier);
  const openExitCount = Math.max(0, 3 - blockedExits.length);

  const estimatedClearanceTimeSec = useMemo(() => {
    let baseTime = 85;
    if (openExitCount === 2) baseTime = 135;
    else if (openExitCount === 1) baseTime = 230;
    else if (openExitCount === 0) baseTime = 420;

    baseTime *= populationMultiplier;
    if (panicFactor === 'HIGH') baseTime *= 1.25;
    if (powerGridFailure) baseTime *= 1.2;
    if (hvacFailure) baseTime *= 1.15;
    if (demographics.assisted > 15) baseTime *= 1 + (demographics.assisted - 15) * 0.015;

    return Math.round(baseTime);
  }, [openExitCount, populationMultiplier, panicFactor, powerGridFailure, hvacFailure, demographics]);

  const estimatedAffectedOccupants = useMemo(() => {
    const floorOccupants = Math.round(19 * populationMultiplier);
    const adjacentFloorOccupants = Math.round(19 * populationMultiplier);
    let count = floorOccupants;
    if (severity === 'Critical' || severity === 'High') {
      count += adjacentFloorOccupants;
    }
    if (hvacFailure) count += Math.round(floorOccupants * 0.5);
    return count;
  }, [selectedFloor, populationMultiplier, severity, hvacFailure]);

  const primaryRiskSummary = useMemo(() => {
    if (blockedExits.includes('exit_west') && blockedExits.includes('exit_east')) {
      return 'Dual stair collapse: Exit C bottleneck at 98% capacity';
    }
    if (blockedExits.includes('exit_west')) {
      return 'Stair Core A severed: Diverting traffic into Core B';
    }
    if (blockedExits.includes('exit_east')) {
      return 'Stair Core B severed: Diverting traffic into Core A';
    }
    if (blockedExits.includes('exit_south')) {
      return 'Ground Lobby C blocked: Evacuating via Perimeter Gates';
    }
    if (populationMultiplier >= 1.5) {
      return 'Heavy crowd surge: Staircase queuing bottleneck';
    }
    return 'Room flashover & corridor smoke infiltration';
  }, [blockedExits, populationMultiplier]);

  // ── Apply Scenario ──
  const handleApply = () => {
    const payload = {
      name: `Case: L${selectedFloor} ${selectedLocation}`,
      type: hazardType,
      severity: severity,
      hazard: {
        roomId: selectedRoomId,
        floor: selectedFloor,
        name: selectedLocation,
        type: hazardType === 'Chemical Hazard' ? 'CHEMICAL' : 'FIRE',
        severity: severity.toUpperCase(),
        heatReleaseRate,
        smokeGenRate,
        sprinklers
      },
      structuralFailures: {
        blockedExits,
        elevatorLocked,
        damagedCorridors: blockedCorridors
      },
      demographics: {
        standardRatio: demographics.standard / 100,
        assistedRatio: demographics.assisted / 100,
        slowRatio: demographics.visitors / 100
      },
      conditions: {
        powerGridFailure,
        hvacFailure,
        windSpeed,
        windDirection,
        ambientTemp
      },
      populationMultiplier,
      clearanceTimeEst: estimatedClearanceTimeSec
    };

    if (onApplyScenario) {
      onApplyScenario(payload);
    }

    showToast('Applied! Opening 3D Digital Twin simulation...');
    setTimeout(() => {
      if (onSwitchToLive) onSwitchToLive();
    }, 350);
  };

  // ── Save Custom ──
  const handleSaveCustom = () => {
    try {
      const customKey = `twin_scenario_${Date.now()}`;
      localStorage.setItem(customKey, JSON.stringify({
        hazardType,
        severity,
        floor: selectedFloor,
        roomId: selectedRoomId,
        locationName: selectedLocation,
        heatReleaseRate,
        smokeGenRate,
        sprinklers,
        blockedExits,
        populationMultiplier
      }));
      showToast('Scenario saved successfully');
    } catch {
      showToast('Saved to session');
    }
  };

  const handleReset = () => {
    handleLoadPreset('FIRE_L7');
    showToast('Reset to default scenario');
  };

  return (
    <div
      className={`flex-1 flex flex-col overflow-y-auto no-scrollbar p-4 sm:p-5 gap-3.5 select-none transition-colors duration-200 ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #070d18 0%, #0c162d 100%)'
          : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-xl bg-blue-600 text-white font-bold text-xs animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Strip: Minimal & Clean ── */}
      <div className={`flex items-center justify-between pb-3 border-b gap-3 shrink-0 ${
        isDark ? 'border-sky-500/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className={`text-base sm:text-lg font-black tracking-tight leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
              AI Scenario Configuration Studio
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Configure hazard physics, structural blockages, and crowd parameters for the 3D Digital Twin.
            </p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Reset to default baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveCustom}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Custom</span>
          </button>
        </div>
      </div>

      {/* ── 4 Main Sub-Navigation Tabs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        {[
          { id: 'HAZARD', label: 'Hazard & Origin', icon: Flame, color: '#ef4444' },
          { id: 'BLOCKAGES', label: 'Exit & Blockages', icon: Ban, color: '#f97316' },
          { id: 'CROWD', label: 'Crowd Dynamics', icon: Users, color: '#38bdf8' },
          { id: 'CONDITIONS', label: 'Infrastructure & Grid', icon: Sliders, color: '#a855f7' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
                  : isDark
                    ? 'bg-[#0b162c] text-slate-300 border-sky-500/15 hover:bg-slate-800 hover:text-white'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isSelected ? '#ffffff' : tab.color }} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3-Column Studio Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        
        {/* ─────────────────────────────────────────────────────────────
            COLUMN 1: Scenario Presets Library (3 Cols)
            Clean, uncluttered, no redundant bottom pill
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Scenario Presets
            </span>
            <span className="text-[10px] text-blue-500 font-mono font-bold">Quick Select</span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar flex-1 pr-0.5">
            {Object.values(PRESET_DEFINITIONS).map((p) => {
              const isSelected = selectedPreset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleLoadPreset(p.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 border text-left ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-950/70 border-sky-400 shadow-md shadow-sky-500/15 ring-1 ring-sky-400'
                        : 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : isDark
                        ? 'bg-[#0b162c] border-sky-500/15 hover:border-sky-500/30 hover:bg-[#0f1d38]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}20`, border: `1px solid ${p.color}40`, color: p.color }}
                  >
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {p.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                      <span>L{p.floor}</span>
                      <span>•</span>
                      <span>{p.heatReleaseRate} kW</span>
                      <span>•</span>
                      <span className="truncate">{p.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            COLUMN 2: Interactive Controls Workspace & 3D Preview (6 Cols)
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex flex-col gap-3 min-w-0">
          
          {/* TAB 1: HAZARD & LOCATION */}
          {activeTab === 'HAZARD' && (
            <div
              className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border shadow-2xs ${
                isDark ? 'bg-[#0b162c] border-sky-500/20' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Hazard Origin & Physics
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                  {severity.toUpperCase()} SEVERITY
                </span>
              </div>

              {/* Hazard Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Fire (Room / Space)', icon: Flame },
                  { label: 'Chemical Hazard', icon: FlaskConical },
                  { label: 'Electrical Arc', icon: Zap },
                  { label: 'Toxic Smoke', icon: Cloud },
                  { label: 'Structural Defect', icon: AlertTriangle }
                ].map((hz) => {
                  const Icon = hz.icon;
                  const isSel = hazardType === hz.label;
                  return (
                    <button
                      key={hz.label}
                      type="button"
                      onClick={() => setHazardType(hz.label)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSel
                          ? 'bg-red-600 text-white border-red-400 shadow-2xs'
                          : isDark
                            ? 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{hz.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Floor & Location Selectors */}
              <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 text-[10.5px] font-semibold">Target Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => {
                      const fl = parseInt(e.target.value, 10);
                      setSelectedFloor(fl);
                      setSelectedRoomId(`f${fl}_r1`);
                    }}
                    className={`h-8.5 px-2.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                      isDark ? 'bg-slate-900 border-sky-500/30 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fl) => (
                      <option key={fl} value={fl}>
                        Level {fl} {fl === 1 ? '(Ground)' : fl === 10 ? '(Penthouse)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 text-[10.5px] font-semibold">Location / Space</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => {
                      const rid = e.target.value;
                      setSelectedRoomId(rid);
                      const targetRoom = floorRooms.find((r) => r.id === rid);
                      if (targetRoom) setSelectedLocation(targetRoom.name);
                    }}
                    className={`h-8.5 px-2.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer truncate ${
                      isDark ? 'bg-slate-900 border-sky-500/30 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={`f${selectedFloor}_r1`}>West Stair Core (A)</option>
                    <option value={`f${selectedFloor}_r2`}>East Stair Core (B)</option>
                    <option value={`f${selectedFloor}_r3`}>Central Corridor / Concourse</option>
                    {floorRooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 text-[10.5px] font-semibold">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className={`h-8.5 px-2.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                      severity === 'Critical'
                        ? 'text-red-500 font-black'
                        : severity === 'High'
                          ? 'text-orange-500 font-bold'
                          : 'text-amber-500 font-bold'
                    } ${isDark ? 'bg-slate-900 border-sky-500/30' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="Low">Low - Incipient</option>
                    <option value="Medium">Medium - Contained</option>
                    <option value="High">High - Spreading</option>
                    <option value="Critical">Critical - Flashover</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 text-[10.5px] font-semibold">Propagation Model</label>
                  <select
                    value={fireGrowthModel}
                    onChange={(e) => setFireGrowthModel(e.target.value)}
                    className={`h-8.5 px-2.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
                      isDark ? 'bg-slate-900 border-sky-500/30 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>Standard (t² Growth)</option>
                    <option>Rapid Flashover</option>
                    <option>Smoldering Slow</option>
                  </select>
                </div>
              </div>

              {/* Sliders: HRR & Smoke */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/30">
                <div>
                  <div className="flex justify-between items-center text-[10.5px] font-semibold mb-1">
                    <span className="text-slate-400">Heat Release Rate</span>
                    <span className="font-mono font-bold text-red-400">{heatReleaseRate.toLocaleString()} kW</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="250"
                    value={heatReleaseRate}
                    onChange={(e) => setHeatReleaseRate(parseInt(e.target.value, 10))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10.5px] font-semibold mb-1">
                    <span className="text-slate-400">Smoke Generation</span>
                    <span className="font-mono font-bold text-sky-400">{smokeGenRate.toFixed(1)} m³/s</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={smokeGenRate}
                    onChange={(e) => setSmokeGenRate(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXIT & STRUCTURAL BLOCKAGES */}
          {activeTab === 'BLOCKAGES' && (
            <div
              className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border shadow-2xs ${
                isDark ? 'bg-[#0b162c] border-sky-500/20' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Exit Cores & Corridors
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {blockedExits.length} CORES BLOCKED
                </span>
              </div>

              {/* 3 Stairwell Cores */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'exit_west', name: 'West Core A', sub: 'L1–L10 West' },
                  { id: 'exit_east', name: 'East Core B', sub: 'L1–L10 East' },
                  { id: 'exit_south', name: 'South Exit C', sub: 'Ground Plaza' }
                ].map((core) => {
                  const isBlocked = blockedExits.includes(core.id);
                  return (
                    <div
                      key={core.id}
                      onClick={() => toggleBlockedExit(core.id)}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        isBlocked
                          ? 'border-red-500 bg-red-950/30 text-red-200 shadow-2xs'
                          : isDark
                            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                            : 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black uppercase">
                          {isBlocked ? 'BLOCKED' : 'OPEN'}
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isBlocked ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                          {isBlocked ? <Ban className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <div className="mt-1.5 font-bold text-xs leading-tight">{core.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{core.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* Infrastructure Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/30">
                <div
                  onClick={() => setElevatorLocked(!elevatorLocked)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    elevatorLocked
                      ? 'border-amber-500 bg-amber-950/20 text-amber-200'
                      : isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-300'
                        : 'border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Elevator Bank Grounding</div>
                    <div className="text-[10px] text-slate-400">Lock lifts at L1</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${elevatorLocked ? 'bg-amber-500 text-white' : 'bg-slate-600 text-white'}`}>
                    {elevatorLocked ? 'LOCKED' : 'ACTIVE'}
                  </span>
                </div>

                <div
                  onClick={() => toggleCorridor('f7_west')}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    blockedCorridors.includes('f7_west')
                      ? 'border-red-500 bg-red-950/20 text-red-200'
                      : isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-300'
                        : 'border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Floor 7 Corridor Block</div>
                    <div className="text-[10px] text-slate-400">West wing obstruction</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${blockedCorridors.includes('f7_west') ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {blockedCorridors.includes('f7_west') ? 'BLOCKED' : 'CLEAR'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CROWD DYNAMICS */}
          {activeTab === 'CROWD' && (
            <div
              className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border shadow-2xs ${
                isDark ? 'bg-[#0b162c] border-sky-500/20' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Crowd Density & Demographics
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  {totalOccupants} OCCUPANTS
                </span>
              </div>

              {/* Total Multiplier */}
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isDark ? "text-white" : "text-blue-950"}>
                    Tower Population ({Math.round(populationMultiplier * 100)}%)
                  </span>
                  <span className="text-blue-400 font-mono text-sm">{totalOccupants} People</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.25"
                  value={populationMultiplier}
                  onChange={(e) => setPopulationMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
                    <span className="text-slate-400">Agile Staff</span>
                    <span className="font-mono font-bold text-blue-400">{demographics.standard}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={demographics.standard}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const rem = Math.max(0, 100 - val);
                      setDemographics({ standard: val, assisted: Math.round(rem * 0.75), visitors: rem - Math.round(rem * 0.75) });
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
                    <span className="text-slate-400">Assisted</span>
                    <span className="font-mono font-bold text-amber-400">{demographics.assisted}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={demographics.assisted}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const rem = Math.max(0, 100 - val);
                      setDemographics({ ...demographics, assisted: val, standard: rem - demographics.visitors });
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
                    <span className="text-slate-400">Visitors</span>
                    <span className="font-mono font-bold text-purple-400">{demographics.visitors}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={demographics.visitors}
                    onChange={(e) => setDemographics({ ...demographics, visitors: parseInt(e.target.value, 10) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Panic Level */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/30">
                <span className="text-xs text-slate-400 font-semibold">Panic Index:</span>
                <div className="flex items-center gap-1.5">
                  {['LOW', 'MEDIUM', 'HIGH'].map((pnc) => (
                    <button
                      key={pnc}
                      onClick={() => setPanicFactor(pnc)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                        panicFactor === pnc
                          ? pnc === 'HIGH'
                            ? 'bg-red-600 text-white border-red-400'
                            : pnc === 'MEDIUM'
                              ? 'bg-amber-600 text-white border-amber-400'
                              : 'bg-emerald-600 text-white border-emerald-400'
                          : isDark
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {pnc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONDITIONS & INFRASTRUCTURE */}
          {activeTab === 'CONDITIONS' && (
            <div
              className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border shadow-2xs ${
                isDark ? 'bg-[#0b162c] border-sky-500/20' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Grid & Environment
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  CONDITIONS
                </span>
              </div>

              {/* Grid & HVAC Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setPowerGridFailure(!powerGridFailure)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    powerGridFailure
                      ? 'border-red-500 bg-red-950/20 text-red-200'
                      : isDark
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Main Power Grid</div>
                    <div className="text-[10px] text-slate-400">
                      {powerGridFailure ? 'Blackout (Emergency Lights)' : 'Online (100% Lighting)'}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${powerGridFailure ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {powerGridFailure ? 'FAILED' : 'ONLINE'}
                  </span>
                </div>

                <div
                  onClick={() => setHvacFailure(!hvacFailure)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    hvacFailure
                      ? 'border-orange-500 bg-orange-950/20 text-orange-200'
                      : isDark
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">HVAC Pressurization</div>
                    <div className="text-[10px] text-slate-400">
                      {hvacFailure ? 'Ventilation Failed' : 'Active (Positive Pressure)'}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${hvacFailure ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {hvacFailure ? 'OFFLINE' : 'ONLINE'}
                  </span>
                </div>
              </div>

              {/* Weather */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-700/30 text-xs">
                <div>
                  <div className="flex justify-between items-center text-[10.5px] font-semibold mb-1">
                    <span className="text-slate-400">Wind Speed</span>
                    <span className="font-mono font-bold text-sky-400">{windSpeed} km/h • {windDirection}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1 mt-1.5">
                    {['North', 'East', 'South', 'West'].map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setWindDirection(dir)}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${windDirection === dir ? 'bg-sky-600 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'}`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10.5px] font-semibold mb-1">
                    <span className="text-slate-400">Outdoor Temperature</span>
                    <span className="font-mono font-bold text-amber-400">{ambientTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="45"
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 3D Scenario Preview Viewport with Interactive Floor Rail ── */}
          <div className="relative rounded-2xl overflow-hidden border border-sky-500/25 bg-slate-950/80 flex-1 min-h-[220px] max-h-[300px] flex items-center justify-center shrink-0">
            <img
              src={building3dImg}
              alt="Scenario Preview 3D"
              className="w-full h-full object-cover brightness-90 contrast-115"
            />

            {/* Dynamic Hazard Pin */}
            <div
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-xl text-white font-bold text-xs transition-all duration-300"
              style={{
                top: `${Math.max(12, 100 - selectedFloor * 8.5)}%`,
                right: '30%',
                background: severity === 'Critical'
                  ? 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)'
                  : 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
              }}
            >
              <Flame className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span className="truncate">L{selectedFloor} – {selectedLocation}</span>
            </div>

            {/* Interactive Floor Level Rail on Right */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-slate-900/85 p-1 rounded-lg border border-slate-800 backdrop-blur-xs">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((lvl) => {
                const isHazardFloor = selectedFloor === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedFloor(lvl);
                      setSelectedRoomId(`f${lvl}_r1`);
                    }}
                    className={`w-6 h-4.5 flex items-center justify-center rounded text-[8.5px] font-mono font-bold cursor-pointer transition-all ${
                      isHazardFloor
                        ? 'bg-red-500 text-white font-black animate-pulse'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    L{lvl}
                  </button>
                );
              })}
            </div>

            {/* Bottom Status Caption */}
            <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-[10.5px] font-mono text-sky-400 border border-sky-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>
                Level {selectedFloor} • {heatReleaseRate} kW • {openExitCount}/3 Exits Open
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            COLUMN 3: Scenario Summary & Direct Run CTA (3 Cols)
            Clean, no repeated boilerplate text, streamlined decision metrics
           ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          
          {/* Executive Scenario Summary Card */}
          <div
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border shadow-sm flex-1 ${
              isDark ? 'bg-[#0b162c] border-sky-500/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/30">
              <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                SIMULATION IMPACT
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {hazardType}
              </span>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400 font-semibold">Total Occupancy</div>
                <div className={`text-base font-black font-mono mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {totalOccupants}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">pax</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400 font-semibold">In Danger Zone</div>
                <div className="text-base font-black font-mono text-red-500 mt-0.5">
                  {estimatedAffectedOccupants}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">pax</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400 font-semibold">Est. Clearance</div>
                <div className="text-base font-black font-mono text-amber-500 mt-0.5">
                  {estimatedClearanceTimeSec}s
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    (~{Math.round(estimatedClearanceTimeSec / 60)}m)
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400 font-semibold">Open Cores</div>
                <div className={`text-base font-black font-mono mt-0.5 ${openExitCount === 3 ? 'text-emerald-500' : openExitCount === 2 ? 'text-amber-500' : 'text-red-500'}`}>
                  {openExitCount} / 3
                </div>
              </div>
            </div>

            {/* Primary Bottleneck Notice */}
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-orange-950/20 border-orange-500/30' : 'bg-orange-50/80 border-orange-200'
            }`}>
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                Predicted Bottleneck
              </div>
              <div className={`text-[11px] font-semibold mt-0.5 leading-snug ${isDark ? 'text-orange-200' : 'text-orange-900'}`}>
                {primaryRiskSummary}
              </div>
            </div>

            {/* Target Area Details */}
            <div className="flex flex-col gap-1 text-[11px] font-mono pt-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Ignition Space:</span>
                <span className={`font-bold truncate max-w-[140px] ${isDark ? "text-white" : "text-slate-900"}`}>
                  L{selectedFloor} {selectedLocation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Power Grid:</span>
                <span className={`font-bold ${powerGridFailure ? 'text-red-500' : 'text-emerald-500'}`}>
                  {powerGridFailure ? 'Blackout (Backup)' : 'Normal Online'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">HVAC System:</span>
                <span className={`font-bold ${hvacFailure ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {hvacFailure ? 'Ventilation Failed' : 'Active Pressurized'}
                </span>
              </div>
            </div>
          </div>

          {/* Single Prominent Primary Action Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Simulation on 3D Twin</span>
            </button>

            <button
              onClick={onSwitchToLive}
              className={`w-full py-2 rounded-xl font-bold text-xs cursor-pointer border transition-colors ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              Cancel & Return to Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScenariosView = React.memo(ScenariosViewComponent);
export default ScenariosView;
