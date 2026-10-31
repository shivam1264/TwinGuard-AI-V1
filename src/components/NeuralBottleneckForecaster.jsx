import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Brain,
  Cpu,
  Zap,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Info
} from 'lucide-react';
import { AIEngine } from '../ai/index.js';

export const NeuralBottleneckForecaster = React.memo(({
  inTransit = 120,
  rooms = [],
  exits = [],
  elapsed = 0
}) => {
  // Derive baseline live telemetry from simulation state
  const liveDerivedDensity = useMemo(() => {
    const activeRooms = rooms.filter(r => (r.peopleCount || 0) > 0);
    const count = activeRooms.length || 6;
    // Approximating density (p/m²) in active staging corridors
    const est = (inTransit / (count * 9.5));
    return Number(Math.max(1.2, Math.min(5.8, est)).toFixed(2));
  }, [inTransit, rooms]);

  const liveDerivedSmoke = useMemo(() => {
    const fireRooms = rooms.filter(r => r.hasFire);
    if (fireRooms.length === 0) return 10.0;
    return Math.min(85.0, 20.0 + fireRooms.length * 15.0);
  }, [rooms]);

  // Interactive What-If Studio Parameters
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [doorWidth, setDoorWidth] = useState(1.1);
  const [customDensity, setCustomDensity] = useState(null);
  const [customSmoke, setCustomSmoke] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Active parameter values (What-if or live)
  const activeDensity = customDensity !== null ? customDensity : liveDerivedDensity;
  const activeSmoke = customSmoke !== null ? customSmoke : liveDerivedSmoke;

  // Prediction State
  const [prediction, setPrediction] = useState({
    status: 'success',
    model_version: '1.0.0',
    algorithm: 'Random Forest Regressor (R² = 0.945)',
    stampede_risk_probability: 0.842,
    stampede_risk_pct: 84.2,
    risk_level: 'CRITICAL',
    predicted_time_to_jam_seconds: 38.5,
    time_to_jam_formatted: 'T+38.5s',
    feature_importances: {
      occupant_density: { label: 'Occupant Density (p/m²)', weight_pct: 56.4 },
      door_clear_width: { label: 'Doorway Clear Width (m)', weight_pct: 26.9 },
      smoke_opacity_pct: { label: 'Smoke Opacity (%)', weight_pct: 8.3 },
      corridor_length: { label: 'Corridor Travel Distance (m)', weight_pct: 4.5 },
      stairwell_inflow_load: { label: 'Stairwell Inflow Load', weight_pct: 1.7 },
      mean_reaction_delay: { label: 'Reaction Delay (s)', weight_pct: 1.3 },
      impaired_mobility_ratio: { label: 'Impaired Mobility Ratio', weight_pct: 0.9 }
    },
    recommendation: 'CRITICAL BOTTLENECK: Unlock secondary emergency leaf (+0.9m) & divert 40% crowd to West Wing.',
    is_live_microservice: false
  });

  // Sensitivity curve for what-if comparison
  const [sensitivityCurve, setSensitivityCurve] = useState([]);

  // Fetch ML Prediction
  const runPrediction = useCallback(async () => {
    setIsLoading(true);
    try {
      const stairLoad = exits.reduce((acc, e) => acc + (e.load || 0), 0) || 35.0;
      const res = await AIEngine.predictBottleneck({
        occupant_density: activeDensity,
        door_clear_width: doorWidth,
        corridor_length: 24.0,
        mean_reaction_delay: Math.min(25.0, 6.0 + elapsed * 0.1),
        smoke_opacity_pct: activeSmoke,
        impaired_mobility_ratio: 0.08,
        stairwell_inflow_load: stairLoad
      });

      if (res) {
        setPrediction(res);
        setIsOnline(Boolean(res.is_live_microservice));
      }

      // Generate sensitivity points
      const curve = await AIEngine.getBottleneckSensitivityCurve({
        occupant_density: activeDensity,
        smoke_opacity_pct: activeSmoke
      });
      if (curve && curve.length > 0) {
        setSensitivityCurve(curve);
      }
    } catch (err) {
      console.warn('ML Prediction error, retained edge state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeDensity, doorWidth, activeSmoke, elapsed, exits]);

  // Trigger prediction on parameter or telemetry change
  useEffect(() => {
    runPrediction();
  }, [runPrediction]);

  // Periodic health check
  useEffect(() => {
    const check = async () => {
      const ok = await AIEngine.checkMLMicroserviceHealth();
      setIsOnline(ok);
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  const resetWhatIf = () => {
    setDoorWidth(1.1);
    setCustomDensity(null);
    setCustomSmoke(null);
  };

  // Color theme based on risk level
  const riskTheme = useMemo(() => {
    switch (prediction.risk_level) {
      case 'CRITICAL':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          badgeBg: '#ef4444',
          badgeText: '#ffffff',
          text: '#991b1b',
          barColor: '#ef4444',
          label: 'CRITICAL CRUSH RISK'
        };
      case 'HIGH':
        return {
          bg: '#fff7ed',
          border: '#ffedd5',
          badgeBg: '#f97316',
          badgeText: '#ffffff',
          text: '#9a3412',
          barColor: '#f97316',
          label: 'HIGH ARCHING RISK'
        };
      case 'MODERATE':
        return {
          bg: '#fefce8',
          border: '#fef08a',
          badgeBg: '#eab308',
          badgeText: '#713f12',
          text: '#854d0e',
          barColor: '#eab308',
          label: 'MODERATE FRICTION'
        };
      default:
        return {
          bg: '#f0fdf4',
          border: '#bbf7d0',
          badgeBg: '#10b981',
          badgeText: '#ffffff',
          text: '#166534',
          barColor: '#10b981',
          label: 'LAMINAR / SAFE'
        };
    }
  }, [prediction.risk_level]);

  return (
    <div
      className="flex flex-col select-none"
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        gap: '14px',
        position: 'relative'
      }}
    >
      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Brain style={{ width: '20px', height: '20px' }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                Neural Bottleneck Forecaster
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace'
                }}
              >
                Random Forest Regressor (R² = 0.945)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              SFPE Handbook & Helbing Social Force Model calibrated on 10,000 egress records
            </div>
          </div>
        </div>

        {/* Right side badges & What-if toggle */}
        <div className="flex items-center gap-2">
          {/* Microservice Status Badge */}
          <div
            className="flex items-center gap-1.5"
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '999px',
              background: isOnline ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${isOnline ? '#a7f3d0' : '#e2e8f0'}`,
              color: isOnline ? '#065f46' : '#64748b'
            }}
            title={isOnline ? 'FastAPI Python Service connected at port 8000' : 'Edge mathematical fallback active'}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#f59e0b',
                boxShadow: isOnline ? '0 0 6px #10b981' : 'none'
              }}
            />
            <span>{isOnline ? '🟢 FastAPI ML Microservice (port 8000)' : '⚡ Edge Neural Engine'}</span>
          </div>

          {/* What-If Studio Toggle */}
          <button
            onClick={() => setIsWhatIfOpen(!isWhatIfOpen)}
            className="flex items-center gap-1.5 transition-all"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '8px',
              background: isWhatIfOpen ? '#3b82f6' : '#f1f5f9',
              color: isWhatIfOpen ? '#ffffff' : '#334155',
              border: isWhatIfOpen ? '1px solid #2563eb' : '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Sliders style={{ width: '13px', height: '13px' }} />
            <span>{isWhatIfOpen ? 'Close What-If Studio' : '🧪 What-If Studio'}</span>
          </button>
        </div>
      </div>

      {/* ── CORE PREDICTION KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* KPI 1: Stampede Probability */}
        <div
          className="flex flex-col justify-between"
          style={{
            padding: '14px 16px',
            borderRadius: '14px',
            background: riskTheme.bg,
            border: `1px solid ${riskTheme.border}`
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '11px', fontWeight: 700, color: riskTheme.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Predicted Stampede Probability
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '5px',
                background: riskTheme.badgeBg,
                color: riskTheme.badgeText,
                fontFamily: 'monospace'
              }}
            >
              {riskTheme.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: riskTheme.text,
                lineHeight: 1,
                fontFamily: 'monospace'
              }}
            >
              {prediction.stampede_risk_pct}%
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              crowd crush index
            </span>
          </div>

          {/* Probability Progress Bar */}
          <div>
            <div
              className="w-full relative overflow-hidden"
              style={{ height: '7px', borderRadius: '999px', background: '#e2e8f0' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${prediction.stampede_risk_pct}%`,
                  borderRadius: '999px',
                  background: riskTheme.barColor,
                  transition: 'width 400ms ease-out'
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-[#94a3b8] font-mono">
              <span>0% Laminar</span>
              <span>50% Arching</span>
              <span>100% Crush</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Predicted Time-to-Failure */}
        <div
          className="flex flex-col justify-between"
          style={{
            padding: '14px 16px',
            borderRadius: '14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Predicted Time-to-Failure
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '5px',
                background: '#e0f2fe',
                color: '#0369a1',
                fontFamily: 'monospace'
              }}
            >
              PHYSICAL THRESHOLD
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1,
                fontFamily: 'monospace'
              }}
            >
              {prediction.time_to_jam_formatted}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              before doorway jamming
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <ShieldAlert style={{ width: '13px', height: '13px', color: '#ef4444' }} />
            <span>Overload flow exceeds discharge limit</span>
          </div>
        </div>

        {/* KPI 3: Actionable AI Prescriptive Directive */}
        <div
          className="flex flex-col justify-between"
          style={{
            padding: '14px 16px',
            borderRadius: '14px',
            background: '#faf5ff',
            border: '1px solid #f3e8ff'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles style={{ width: '13px', height: '13px', color: '#9333ea' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Prescriptive Directive
              </span>
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#9333ea', fontFamily: 'monospace' }}>
              ZERO-ACCIDENT PROTOCOL
            </span>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#581c87',
              lineHeight: 1.45,
              margin: '6px 0'
            }}
          >
            {prediction.recommendation}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#9333ea] font-medium">
            <span>Priority: Immediate Action</span>
            <span className="font-mono">Inference: &lt;5ms</span>
          </div>
        </div>
      </div>

      {/* ── FEATURE IMPORTANCE WEIGHTS (XAI) ── */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Cpu style={{ width: '13px', height: '13px', color: '#475569' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
              XAI Feature Importance Weights (Random Forest MDI)
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            Based on 150 Decision Trees Ensemble
          </span>
        </div>

        {/* Dynamic Weight Bars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(prediction.feature_importances || {})
            .slice(0, 4)
            .map(([key, item]) => {
              const colors = {
                occupant_density: { bar: '#ef4444', text: '#dc2626' },
                door_clear_width: { bar: '#3b82f6', text: '#2563eb' },
                smoke_opacity_pct: { bar: '#f59e0b', text: '#d97706' },
                corridor_length: { bar: '#8b5cf6', text: '#7c3aed' },
                mean_reaction_delay: { bar: '#10b981', text: '#059669' }
              }[key] || { bar: '#64748b', text: '#475569' };

              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span style={{ fontWeight: 600, color: '#475569' }}>
                      {item.label?.split('(')[0]?.trim() || key}
                    </span>
                    <span style={{ fontWeight: 800, color: colors.text, fontFamily: 'monospace' }}>
                      {item.weight_pct}%
                    </span>
                  </div>
                  <div
                    className="w-full relative overflow-hidden"
                    style={{ height: '5px', borderRadius: '999px', background: '#e2e8f0' }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, item.weight_pct * 1.5)}%`,
                        borderRadius: '999px',
                        background: colors.bar
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── WHAT-IF SIMULATION STUDIO (Collapsible Drawer) ── */}
      {isWhatIfOpen && (
        <div
          className="flex flex-col gap-3 p-3.5 transition-all"
          style={{
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: '14px'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders style={{ width: '15px', height: '15px', color: '#0d9488' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#134e4a' }}>
                Interactive What-If Sensitivity Studio
              </span>
              <span style={{ fontSize: '10.5px', color: '#0f766e' }}>
                (Live Parameter Tuning & Real-Time Re-Inference)
              </span>
            </div>
            <button
              onClick={resetWhatIf}
              className="flex items-center gap-1 text-[10.5px] font-semibold text-[#0d9488] hover:text-[#0f766e] cursor-pointer"
            >
              <RefreshCw style={{ width: '11px', height: '11px' }} />
              Reset to Live Telemetry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Slider 1: Doorway Clear Width */}
            <div
              style={{
                background: '#ffffff',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #ccfbf1'
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#134e4a' }}>
                  Doorway Clear Width
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#0d9488', fontFamily: 'monospace' }}>
                  {doorWidth.toFixed(2)} m
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.4"
                step="0.05"
                value={doorWidth}
                onChange={(e) => setDoorWidth(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#64748b]">
                <span>0.8m (Single)</span>
                <span>1.2m (Wide)</span>
                <span>2.4m (Double Leaf)</span>
              </div>
            </div>

            {/* Slider 2: Occupant Density */}
            <div
              style={{
                background: '#ffffff',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #ccfbf1'
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#134e4a' }}>
                  Staging Lobby Density
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#0d9488', fontFamily: 'monospace' }}>
                  {activeDensity.toFixed(2)} p/m²
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.5"
                step="0.1"
                value={activeDensity}
                onChange={(e) => setCustomDensity(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#64748b]">
                <span>1.0 p/m² (Light)</span>
                <span>2.8 p/m² (Arching)</span>
                <span>5.5 p/m² (Crush)</span>
              </div>
            </div>

            {/* Slider 3: Smoke Opacity */}
            <div
              style={{
                background: '#ffffff',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #ccfbf1'
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#134e4a' }}>
                  Optical Smoke Opacity
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#0d9488', fontFamily: 'monospace' }}>
                  {activeSmoke.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={activeSmoke}
                onChange={(e) => setCustomSmoke(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#64748b]">
                <span>0% (Clear)</span>
                <span>45% (Moderate)</span>
                <span>90% (Dense)</span>
              </div>
            </div>
          </div>

          {/* Door Width Egress Sensitivity Sparkline Strip */}
          {sensitivityCurve.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                padding: '8px 12px',
                border: '1px solid #ccfbf1'
              }}
            >
              <div className="flex items-center justify-between text-[10px] text-[#0f766e] font-semibold mb-1.5">
                <span className="flex items-center gap-1">
                  <TrendingDown style={{ width: '12px', height: '12px' }} />
                  Sensitivity Preview: Predicted Stampede Risk as Door Width Expands (0.8m to 2.4m)
                </span>
                <span className="font-mono">What-If Delta: -{Math.max(0, (sensitivityCurve[0]?.stampede_risk_pct || 90) - (sensitivityCurve[sensitivityCurve.length - 1]?.stampede_risk_pct || 10)).toFixed(0)}% risk reduction</span>
              </div>

              <div className="flex items-center gap-1.5">
                {sensitivityCurve.map((pt) => {
                  const isCurrent = Math.abs(pt.door_clear_width - doorWidth) < 0.12;
                  const barHeight = Math.max(10, Math.round((pt.stampede_risk_pct / 100) * 32));
                  const color = pt.stampede_risk_pct > 70 ? '#ef4444' : pt.stampede_risk_pct > 40 ? '#f59e0b' : '#10b981';

                  return (
                    <div
                      key={pt.door_clear_width}
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => setDoorWidth(pt.door_clear_width)}
                      title={`Door: ${pt.door_clear_width}m -> Risk: ${pt.stampede_risk_pct}%, Jam: T+${pt.time_to_jam_seconds}s`}
                    >
                      <div
                        style={{
                          height: `${barHeight}px`,
                          width: '100%',
                          borderRadius: '3px',
                          background: isCurrent ? '#0d9488' : color,
                          opacity: isCurrent ? 1 : 0.65,
                          border: isCurrent ? '1.5px solid #042f2e' : 'none'
                        }}
                      />
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: isCurrent ? 800 : 500,
                          color: isCurrent ? '#042f2e' : '#64748b',
                          fontFamily: 'monospace'
                        }}
                      >
                        {pt.door_clear_width}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default NeuralBottleneckForecaster;

