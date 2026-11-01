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
  ArrowLeft,
  Building2,
  Boxes,
  Layers,
  Activity,
  Bell,
  User,
  Clock,
  Cpu,
  MapPin,
  TrendingUp,
  BarChart3,
  Wind,
  Thermometer,
  ShieldAlert,
  ChevronDown,
  Lock,
  Compass
} from 'lucide-react';
import building3dImg from '../assets/building/building_3d_render.png';

export function ScenariosViewComponent({
  theme = 'light',
  rooms = [],
  currentScenario,
  onApplyScenario,
  onSwitchToLive
}) {
  const isDark = theme === 'dark';

  // ── Step Navigation: 1 Scenario | 2 Environment | 3 Hazards | 4 Simulation ──
  const [currentStep, setCurrentStep] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  // ── Step 1: Scenario Details ──
  const [scenarioType, setScenarioType] = useState('Fire Incident');
  const [locationSpace, setLocationSpace] = useState('Block A - 2nd Floor');
  const [selectedFloor, setSelectedFloor] = useState(2);
  const [selectedRoomId, setSelectedRoomId] = useState('f2_r1');
  const [severityLevel, setSeverityLevel] = useState('High');
  const [propagationModel, setPropagationModel] = useState('Standard (t² Growth)');

  // ── Step 1: Hazard Configuration ──
  const [selectedHazard, setSelectedHazard] = useState('Fire'); // 'Fire' | 'Smoke' | 'Toxic Gas' | 'Structural Failure' | 'Electrical Arc'
  const [heatReleaseRate, setHeatReleaseRate] = useState(5500); // 500 to 10,000 kW
  const [smokeGenerationRate, setSmokeGenerationRate] = useState(4.5); // 1.0 to 10.0 m³/s

  // ── Step 2: Environment & Building Systems ──
  const [powerGridStatus, setPowerGridStatus] = useState('NORMAL'); // 'NORMAL' | 'BLACKOUT'
  const [hvacVentilation, setHvacVentilation] = useState('OPERATIONAL'); // 'OPERATIONAL' | 'FAILED'
  const [sprinklerMode, setSprinklerMode] = useState('AUTO'); // 'AUTO' | 'DELAYED' | 'OFF'
  const [alarmSirenMode, setAlarmSirenMode] = useState('DISPATCHED'); // 'DISPATCHED' | 'STANDBY'
  const [windSpeed, setWindSpeed] = useState(15); // km/h
  const [windDirection, setWindDirection] = useState('West');
  const [ambientTemp, setAmbientTemp] = useState(26); // °C

  // ── Step 3: Hazards & Blockages ──
  const [blockedExits, setBlockedExits] = useState(['exit_west']);
  const [elevatorLocked, setElevatorLocked] = useState(true);
  const [blockedCorridors, setBlockedCorridors] = useState(['f2_west']);

  // ── Step 4: Crowd Dynamics & Population ──
  const [populationMultiplier, setPopulationMultiplier] = useState(1.0);
  const [demographics, setDemographics] = useState({ standard: 80, assisted: 15, visitors: 5 });
  const [panicLevel, setPanicLevel] = useState('MEDIUM'); // 'LOW' | 'MEDIUM' | 'HIGH'

  // ── Helper Toast ──
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ── Floor Rooms Filter ──
  const floorRooms = useMemo(() => {
    const list = rooms.filter((r) => r.floor === selectedFloor);
    if (list.length > 0) return list;
    return Array.from({ length: 10 }, (_, i) => ({
      id: `f${selectedFloor}_r${i + 1}`,
      floor: selectedFloor,
      name: `Block A - Room ${selectedFloor}0${i + 1}`,
      peopleCount: 2
    }));
  }, [rooms, selectedFloor]);

  // ── Toggle Blocked Exit ──
  const toggleExit = (id) => {
    setBlockedExits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Toggle Corridor ──
  const toggleCorridor = (id) => {
    setBlockedCorridors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Real-Time Dynamic Impact Calculations (Matching UI Mockup) ──
  const totalOccupants = Math.round(190 * populationMultiplier);
  const openExitCount = Math.max(0, 3 - blockedExits.length);

  const estimatedClearanceTimeSec = useMemo(() => {
    let baseTime = 85;
    if (openExitCount === 2) baseTime = 135;
    else if (openExitCount === 1) baseTime = 220;
    else if (openExitCount === 0) baseTime = 390;

    baseTime *= populationMultiplier;
    if (panicLevel === 'HIGH') baseTime *= 1.25;
    if (powerGridStatus === 'BLACKOUT') baseTime *= 1.2;
    if (hvacVentilation === 'FAILED') baseTime *= 1.15;
    if (demographics.assisted > 15) baseTime *= 1 + (demographics.assisted - 15) * 0.015;

    return Math.round(baseTime);
  }, [openExitCount, populationMultiplier, panicLevel, powerGridStatus, hvacVentilation, demographics]);

  const estimatedAffectedOccupants = useMemo(() => {
    const floorOccupants = Math.round(19 * populationMultiplier);
    let count = floorOccupants;
    if (severityLevel === 'Critical' || severityLevel === 'High') {
      count += Math.round(floorOccupants * 1.0);
    }
    if (hvacVentilation === 'FAILED') count += Math.round(floorOccupants * 0.4);
    return Math.max(12, count);
  }, [populationMultiplier, severityLevel, hvacVentilation]);

  const predictedBottleneckText = useMemo(() => {
    if (blockedExits.includes('exit_west') && blockedExits.includes('exit_east')) {
      return 'Dual stair collapse: Severe bottleneck at South Exit C.';
    }
    if (blockedExits.includes('exit_west')) {
      return 'Stair Core A - high congestion expected.';
    }
    if (blockedExits.includes('exit_east')) {
      return 'Stair Core B - high congestion expected.';
    }
    if (blockedExits.includes('exit_south')) {
      return 'Ground Lobby C compromised: Diverting to Perimeter Gates.';
    }
    if (populationMultiplier >= 1.5) {
      return 'Heavy crowd surge: Staircase queuing bottleneck.';
    }
    return 'Localized corridor congestion near West Wing.';
  }, [blockedExits, populationMultiplier]);

  // ── Run Simulation Dispatch ──
  const handleRunSimulation = () => {
    const payload = {
      name: `Case: ${locationSpace} (${scenarioType})`,
      type: scenarioType,
      severity: severityLevel,
      hazard: {
        roomId: selectedRoomId,
        floor: selectedFloor,
        name: locationSpace,
        type: selectedHazard === 'Toxic Gas' ? 'CHEMICAL' : 'FIRE',
        severity: severityLevel.toUpperCase(),
        heatReleaseRate,
        smokeGenRate: smokeGenerationRate,
        sprinklers: sprinklerMode
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
        powerGridFailure: powerGridStatus === 'BLACKOUT',
        hvacFailure: hvacVentilation === 'FAILED',
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

    showToast('Applied scenario! Opening 3D Digital Twin Simulation...');
    setTimeout(() => {
      if (onSwitchToLive) onSwitchToLive();
    }, 350);
  };

  // ── Reset to Initial State ──
  const handleReset = () => {
    setCurrentStep(1);
    setScenarioType('Fire Incident');
    setLocationSpace('Block A - 2nd Floor');
    setSelectedFloor(2);
    setSelectedRoomId('f2_r1');
    setSeverityLevel('High');
    setPropagationModel('Standard (t² Growth)');
    setSelectedHazard('Fire');
    setHeatReleaseRate(5500);
    setSmokeGenerationRate(4.5);
    setPowerGridStatus('NORMAL');
    setHvacVentilation('OPERATIONAL');
    setSprinklerMode('AUTO');
    setBlockedExits(['exit_west']);
    setElevatorLocked(true);
    setBlockedCorridors(['f2_west']);
    setPopulationMultiplier(1.0);
    setDemographics({ standard: 80, assisted: 15, visitors: 5 });
    setPanicLevel('MEDIUM');
    showToast('Reset configuration to default');
  };

  // ── Save Scenario ──
  const handleSaveScenario = () => {
    try {
      const key = `twin_scenario_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify({
        scenarioType,
        locationSpace,
        selectedFloor,
        selectedRoomId,
        severityLevel,
        propagationModel,
        selectedHazard,
        heatReleaseRate,
        smokeGenerationRate,
        blockedExits,
        populationMultiplier,
        savedAt: new Date().toISOString()
      }));
      showToast('Scenario saved successfully');
    } catch {
      showToast('Saved to session state');
    }
  };

  // ── Steps Definition ──
  const steps = [
    { num: 1, label: 'Scenario', icon: Boxes },
    { num: 2, label: 'Environment', icon: Layers },
    { num: 3, label: 'Hazards', icon: Flame },
    { num: 4, label: 'Simulation', icon: Play }
  ];

  return (
    <div
      className={`flex-1 flex flex-col overflow-y-auto no-scrollbar p-4 sm:p-6 gap-4 select-none transition-colors duration-200 ${
        isDark ? 'text-slate-100 bg-[#070e1b]' : 'text-slate-800 bg-[#f4f7fc]'
      }`}
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl bg-indigo-600 text-white font-bold text-xs animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Strip (Matching Reference Image) ── */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-[#1e1b4b]"}`}>
            AI Scenario Configuration Studio
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure hazard events, their impact, and Simulation parameters for the 3D Digital Twin.
          </p>
        </div>

        {/* Top Right Notification & Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-xs relative ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white" />
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Numbered Stepper Bar (1 Scenario, 2 Environment, 3 Hazards, 4 Simulation) ── */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 max-w-4xl py-1 overflow-x-auto no-scrollbar">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          const isActive = currentStep === st.num;
          const isPassed = currentStep > st.num;

          return (
            <React.Fragment key={st.num}>
              <button
                type="button"
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#5046e5] text-white border-transparent shadow-md shadow-indigo-500/25'
                    : isPassed
                      ? isDark
                        ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-2xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isPassed ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{st.num}</span>
                <span>{st.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    currentStep > st.num
                      ? 'bg-indigo-500'
                      : isDark
                        ? 'bg-slate-800'
                        : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Main Studio Grid: 2 Columns (Left Form 8 Cols, Right Summary 4 Cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
        
        {/* ════════════════════════════════════════════════════════════════
            LEFT COLUMN (8 Cols): Dynamic Step Content
           ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* ─────────────────────────────────────────────────────────────
              STEP 1: SCENARIO DETAILS & HAZARD CONFIGURATION (Exact Mockup)
             ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <>
              {/* Card 1: Scenario Details */}
              <div
                className={`p-5 rounded-2xl border shadow-xs flex flex-col gap-4 ${
                  isDark ? 'bg-[#0c162d] border-sky-500/20' : 'bg-white border-slate-200/90'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      Scenario Details
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Define the basic parameters for the simulation scenario.
                    </p>
                  </div>
                </div>

                {/* 2x2 Form Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Scenario Type */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <Flame className="w-3.5 h-3.5 text-red-500" />
                      <span>Scenario Type</span>
                    </div>
                    <div className="relative">
                      <select
                        value={scenarioType}
                        onChange={(e) => setScenarioType(e.target.value)}
                        className={`w-full h-10 px-3 pr-8 rounded-xl border text-xs font-semibold appearance-none focus:outline-none cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-[#fafbfc] border-slate-200 text-slate-800'
                        }`}
                      >
                        <option>Fire Incident</option>
                        <option>Toxic Gas Release</option>
                        <option>Structural Collapse</option>
                        <option>Electrical Arc</option>
                        <option>Crowd Stampede</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. Location / Space */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Location / Space</span>
                    </div>
                    <div className="relative">
                      <select
                        value={locationSpace}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocationSpace(val);
                          if (val.includes('1st Floor')) setSelectedFloor(1);
                          else if (val.includes('2nd Floor')) setSelectedFloor(2);
                          else if (val.includes('4th Floor')) setSelectedFloor(4);
                          else if (val.includes('5th Floor')) setSelectedFloor(5);
                          else if (val.includes('7th Floor')) setSelectedFloor(7);
                          else if (val.includes('10th Floor')) setSelectedFloor(10);
                        }}
                        className={`w-full h-10 px-3 pr-8 rounded-xl border text-xs font-semibold appearance-none focus:outline-none cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-[#fafbfc] border-slate-200 text-slate-800'
                        }`}
                      >
                        <option>Block A - 2nd Floor</option>
                        <option>Block A - 1st Floor (Ground Lobby)</option>
                        <option>Block B - 4th Floor</option>
                        <option>Block B - 5th Floor (Biotech Lab)</option>
                        <option>Block C - 7th Floor (West Wing)</option>
                        <option>Block C - 10th Floor (Executive Penthouse)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. Severity Level */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Severity Level</span>
                    </div>
                    <div className="relative">
                      <select
                        value={severityLevel}
                        onChange={(e) => setSeverityLevel(e.target.value)}
                        className={`w-full h-10 px-3 pr-8 rounded-xl border text-xs font-semibold appearance-none focus:outline-none cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-[#fafbfc] border-slate-200 text-slate-800'
                        }`}
                      >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                        <option>Critical</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* 4. Propagation Model */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                      <span>Propagation Model</span>
                    </div>
                    <div className="relative">
                      <select
                        value={propagationModel}
                        onChange={(e) => setPropagationModel(e.target.value)}
                        className={`w-full h-10 px-3 pr-8 rounded-xl border text-xs font-semibold appearance-none focus:outline-none cursor-pointer ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-[#fafbfc] border-slate-200 text-slate-800'
                        }`}
                      >
                        <option>Standard (t² Growth)</option>
                        <option>Rapid Flashover</option>
                        <option>Smoldering Slow</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Hazard Configuration (Exact Mockup) */}
              <div
                className={`p-5 rounded-2xl border shadow-xs flex flex-col gap-4 ${
                  isDark ? 'bg-[#0c162d] border-sky-500/20' : 'bg-white border-slate-200/90'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      Hazard Configuration
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select one or more hazards and set their intensity.
                    </p>
                  </div>
                </div>

                {/* 5 Hazard Category Selectable Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { key: 'Fire', label: 'Fire', icon: Flame, color: '#f97316' },
                    { key: 'Smoke', label: 'Smoke', icon: Cloud, color: '#64748b' },
                    { key: 'Toxic Gas', label: 'Toxic Gas', icon: FlaskConical, color: '#3b82f6' },
                    { key: 'Structural Failure', label: 'Structural Failure', icon: Building2, color: '#6b7280' },
                    { key: 'Electrical Arc', label: 'Electrical Arc', icon: Zap, color: '#eab308' }
                  ].map((hz) => {
                    const Icon = hz.icon;
                    const isSelected = selectedHazard === hz.key;
                    return (
                      <button
                        key={hz.key}
                        type="button"
                        onClick={() => setSelectedHazard(hz.key)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/40'
                            : isDark
                              ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center absolute top-2 right-2">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <Icon className="w-5 h-5 mb-0.5" style={{ color: hz.color }} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {hz.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 2 Sliders: Heat Release Rate & Smoke Generation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Left Slider: Heat Release Rate */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-[#fafbfc] border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-slate-700">Heat Release Rate</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {heatReleaseRate.toLocaleString()} kW
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="250"
                      value={heatReleaseRate}
                      onChange={(e) => setHeatReleaseRate(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Right Slider: Smoke Generation */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-[#fafbfc] border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-slate-700">Smoke Generation</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {smokeGenerationRate.toFixed(1)} m³/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.5"
                      value={smokeGenerationRate}
                      onChange={(e) => setSmokeGenerationRate(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 rounded-lg"
                    />
                  </div>
                </div>

                {/* Next Step Navigation Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Next: Environment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: ENVIRONMENT & INFRASTRUCTURE
             ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div
              className={`p-5 rounded-2xl border shadow-xs flex flex-col gap-4 ${
                isDark ? 'bg-[#0c162d] border-sky-500/20' : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Infrastructure & Environmental Systems
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Control power grid state, positive-pressure HVAC ventilation, and weather pressure.
                  </p>
                </div>
              </div>

              {/* Grid Power & HVAC Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPowerGridStatus(powerGridStatus === 'NORMAL' ? 'BLACKOUT' : 'NORMAL')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    powerGridStatus === 'BLACKOUT'
                      ? 'border-red-400 bg-red-50/70 text-red-900'
                      : isDark
                        ? 'border-slate-700 bg-slate-900/60 text-slate-200'
                        : 'border-slate-200 bg-[#fafbfc] text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Main Power Grid</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {powerGridStatus === 'BLACKOUT' ? 'Total Blackout (Backup Lights)' : 'Grid Online (100% Power)'}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                    powerGridStatus === 'BLACKOUT' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {powerGridStatus === 'BLACKOUT' ? 'FAILED' : 'ONLINE'}
                  </span>
                </div>

                <div
                  onClick={() => setHvacVentilation(hvacVentilation === 'OPERATIONAL' ? 'FAILED' : 'OPERATIONAL')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    hvacVentilation === 'FAILED'
                      ? 'border-orange-400 bg-orange-50/70 text-orange-900'
                      : isDark
                        ? 'border-slate-700 bg-slate-900/60 text-slate-200'
                        : 'border-slate-200 bg-[#fafbfc] text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">HVAC Pressurization Fans</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {hvacVentilation === 'FAILED' ? 'Ventilation Offline (Smoke Spreads 3x)' : 'Operational (Positive Core Pressure)'}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                    hvacVentilation === 'FAILED' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {hvacVentilation === 'FAILED' ? 'FAILED' : 'ONLINE'}
                  </span>
                </div>
              </div>

              {/* Weather & Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/70">
                <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-[#fafbfc] border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Wind Velocity</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 text-indigo-700">
                      {windSpeed} km/h • {windDirection}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    {['North', 'East', 'South', 'West'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setWindDirection(d)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          windDirection === d ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-[#fafbfc] border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Outdoor Temperature</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-700">
                      {ambientTemp}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="45"
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 mt-1">
                    Affects thermodynamic air buoyancy & vertical plume spread.
                  </span>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back: Scenario</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Next: Hazards & Blockages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: HAZARDS & STRUCTURAL BLOCKAGES
             ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div
              className={`p-5 rounded-2xl border shadow-xs flex flex-col gap-4 ${
                isDark ? 'bg-[#0c162d] border-sky-500/20' : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Exit Cores & Structural Obstructions
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sever stairwells or isolate corridors to test autonomous occupant rerouting.
                  </p>
                </div>
              </div>

              {/* 3 Core Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'exit_west', name: 'West Stair Core (A)', sub: 'L1–L10 West Wing' },
                  { id: 'exit_east', name: 'East Stair Core (B)', sub: 'L1–L10 East Wing' },
                  { id: 'exit_south', name: 'South Grand Plaza (C)', sub: 'Ground Main Gate' }
                ].map((core) => {
                  const isBlocked = blockedExits.includes(core.id);
                  return (
                    <div
                      key={core.id}
                      onClick={() => toggleExit(core.id)}
                      className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                        isBlocked
                          ? 'border-red-400 bg-red-50 text-red-900 shadow-2xs'
                          : isDark
                            ? 'border-slate-700 bg-slate-900 text-slate-300'
                            : 'border-slate-200 bg-[#fafbfc] text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase ${isBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isBlocked ? 'SEVERED / BLOCKED' : 'OPEN'}
                        </span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isBlocked ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
                          {isBlocked ? <Ban className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <div className="mt-2 font-bold text-xs">{core.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{core.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* Corridors & Lifts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div
                  onClick={() => setElevatorLocked(!elevatorLocked)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    elevatorLocked
                      ? 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-[#fafbfc] text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Elevator Bank Grounding</div>
                    <div className="text-[10.5px] text-slate-400">Lock lifts at L1 (Life Safety Code)</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${elevatorLocked ? 'bg-amber-500 text-white' : 'bg-slate-600 text-white'}`}>
                    {elevatorLocked ? 'LOCKED' : 'ACTIVE'}
                  </span>
                </div>

                <div
                  onClick={() => toggleCorridor('f2_west')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    blockedCorridors.includes('f2_west')
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : 'border-slate-200 bg-[#fafbfc] text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Floor 2 Corridor Block</div>
                    <div className="text-[10.5px] text-slate-400">Physical blockage in corridor</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${blockedCorridors.includes('f2_west') ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {blockedCorridors.includes('f2_west') ? 'BLOCKED' : 'CLEAR'}
                  </span>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back: Environment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Next: Simulation Preview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: SIMULATION PREVIEW & CROWD
             ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div
              className={`p-5 rounded-2xl border shadow-xs flex flex-col gap-4 ${
                isDark ? 'bg-[#0c162d] border-sky-500/20' : 'bg-white border-slate-200/90'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  <Play className="w-4 h-4 fill-purple-600" />
                </div>
                <div>
                  <h2 className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    3D Simulation Preview & Crowd Dynamics
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review spatial pin placement on the 3D twin and launch the simulation.
                  </p>
                </div>
              </div>

              {/* 3D Preview Box with Interactive Floor Rail */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950/90 h-64 flex items-center justify-center">
                <img
                  src={building3dImg}
                  alt="3D Building Preview"
                  className="w-full h-full object-cover brightness-90 contrast-110"
                />

                {/* Dynamic Pin on Selected Floor */}
                <div
                  className="absolute flex items-center gap-2 px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-xl animate-in zoom-in-95 duration-200"
                  style={{
                    top: `${Math.max(15, 100 - selectedFloor * 8.5)}%`,
                    right: '32%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
                  }}
                >
                  <Flame className="w-3.5 h-3.5 animate-bounce shrink-0" />
                  <span>L{selectedFloor} • {locationSpace}</span>
                </div>

                {/* Interactive Floor Rail */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-slate-900/85 p-1 rounded-lg border border-slate-800 backdrop-blur-xs">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(lvl);
                        setLocationSpace(`Block A - Level ${lvl}`);
                      }}
                      className={`w-6 h-4.5 flex items-center justify-center rounded text-[8.5px] font-mono font-bold cursor-pointer transition-all ${
                        selectedFloor === lvl
                          ? 'bg-red-500 text-white font-black animate-pulse'
                          : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      L{lvl}
                    </button>
                  ))}
                </div>

                {/* Bottom Left Badge */}
                <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-[10.5px] font-mono text-sky-400 border border-sky-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Level {selectedFloor} • {heatReleaseRate} kW • {openExitCount}/3 Exits Open</span>
                </div>
              </div>

              {/* Crowd Density Slider */}
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Occupancy Load Multiplier ({Math.round(populationMultiplier * 100)}%)</span>
                  <span className="text-indigo-600 font-mono">{totalOccupants} Occupants</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.25"
                  value={populationMultiplier}
                  onChange={(e) => setPopulationMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back: Hazards</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#5046e5] hover:bg-indigo-700 shadow-md shadow-indigo-500/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Simulation Now</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Bottom Controls Bar (Reset, Save Scenario, Run Simulation) ── */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSaveScenario}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Save className="w-3.5 h-3.5 text-slate-400" />
                <span>Save Scenario</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              className="px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-[#5046e5] hover:bg-indigo-600 shadow-md shadow-indigo-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Simulation</span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT COLUMN (4 Cols): Simulation Summary (Exact Mockup Layout)
           ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div
            className={`p-5 rounded-2xl border shadow-xs flex flex-col gap-4 ${
              isDark ? 'bg-[#0c162d] border-sky-500/20' : 'bg-white border-slate-200/90'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Simulation Summary
              </h2>
            </div>

            {/* 2x2 Grid of KPI Cards (Exact Mockup Style) */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Total Occupancy */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f8fafd] border-slate-200/70'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                  <div className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-600 flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <span>Total Occupancy</span>
                </div>
                <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {totalOccupants}
                </div>
              </div>

              {/* 2. In Danger Zone */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f8fafd] border-slate-200/70'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                  <div className="w-5 h-5 rounded-md bg-red-500/15 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  <span>In Danger Zone</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-red-500 mt-1">
                  {estimatedAffectedOccupants}
                </div>
              </div>

              {/* 3. Est. Clearance */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f8fafd] border-slate-200/70'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                  <div className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-600 flex items-center justify-center">
                    <Clock className="w-3 h-3" />
                  </div>
                  <span>Est. Clearance</span>
                </div>
                <div className="text-xl font-black font-mono tracking-tight text-blue-600 mt-1">
                  ≈ {estimatedClearanceTimeSec} s
                </div>
              </div>

              {/* 4. Open Exits */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f8fafd] border-slate-200/70'
              }`}>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                    <Cpu className="w-3 h-3" />
                  </div>
                  <span>Open Exits</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 mt-1">
                  {openExitCount} / 3
                </div>
              </div>
            </div>

            {/* Warning Box: Predicted Bottleneck (Exact Mockup Style) */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-[#fffbeb] border-[#fef3c7]'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900">
                  Predicted Bottleneck
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  {predictedBottleneckText}
                </p>
              </div>
            </div>

            {/* Active Simulation Parameter Strip */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/80 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Selected Origin:</span>
                <span className={`font-bold font-mono ${isDark ? "text-white" : "text-slate-800"}`}>
                  {locationSpace}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Power Grid:</span>
                <span className={`font-bold ${powerGridStatus === 'BLACKOUT' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {powerGridStatus === 'BLACKOUT' ? 'Grid Offline' : 'Online (100%)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Ventilation:</span>
                <span className={`font-bold ${hvacVentilation === 'FAILED' ? 'text-orange-500' : 'text-emerald-600'}`}>
                  {hvacVentilation === 'FAILED' ? 'Fans Offline' : 'Pressurized'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ScenariosView = React.memo(ScenariosViewComponent);
export default ScenariosView;
