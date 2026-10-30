import React, { useMemo } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Activity,
  Clock,
  CheckCircle2,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';

export const BottleneckAnalytics = React.memo(({ stats, exits, rooms, bottlenecks = [] }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
  const elapsed = stats.elapsedSeconds || 0;
  const telemetry = stats.telemetry;

  const evacProgress = total > 0 ? Math.round((evacuated / total) * 100) : 0;

  // Calculate occupants per floor across all 10 floors with memoization
  const floorCounts = useMemo(() => {
    const counts = {};
    for (let f = 1; f <= 10; f++) counts[f] = 0;
    if (rooms) {
      rooms.forEach(r => {
        const fl = r.floor || 1;
        counts[fl] = (counts[fl] || 0) + (r.peopleCount || 0);
      });
    }
    return counts;
  }, [rooms]);

  return (
    <div className="bg-white rounded-xl flex flex-col gap-3.5 h-full overflow-y-auto text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-xs tracking-wider uppercase text-slate-800">
            10-FLOOR SKYSCRAPER TELEMETRY
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}s</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Tower Total</div>
          <div className="text-xl font-black text-slate-900 flex items-center justify-center gap-1.5 mt-1">
            <Users className="w-4 h-4 text-blue-600" /> {total}
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
          <div className="text-[10px] font-bold text-emerald-700 uppercase">Safely Exited</div>
          <div className="text-xl font-black text-emerald-700 flex items-center justify-center gap-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {evacuated}
          </div>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
          <div className="text-[10px] font-bold text-amber-700 uppercase">In Stairwells</div>
          <div className="text-xl font-black text-amber-700 flex items-center justify-center gap-1.5 mt-1">
            <Activity className="w-4 h-4 text-amber-500" /> {inTransit}
          </div>
        </div>
      </div>

      {/* Phase 2: Microscopic Behavioral AI Crowd Telemetry */}
      {telemetry && (
        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Microscopic Behavioral Crowd AI
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Phase 2 Telemetry
            </span>
          </div>

          {/* Cognitive State Breakdown Pills */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-lg bg-white border border-purple-100 shadow-2xs">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Hesitating</div>
              <div className="font-black text-amber-600 mt-0.5">{telemetry.states?.hesitating || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-purple-100 shadow-2xs">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Door Queue</div>
              <div className="font-black text-orange-600 mt-0.5">{telemetry.states?.queuingDoor || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-purple-100 shadow-2xs">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Corridor</div>
              <div className="font-black text-blue-600 mt-0.5">{telemetry.states?.corridorTransit || 0}</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-purple-100 shadow-2xs">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Stair Flight</div>
              <div className="font-black text-purple-600 mt-0.5">{telemetry.states?.stairDescent || 0}</div>
            </div>
          </div>

          {/* Real-Time Crowd Dynamics Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-purple-100 shadow-2xs">
              <span className="text-slate-500 font-medium">Peak Density:</span>
              <span className={`font-mono font-black ${telemetry.peakDensity > 2.2 ? 'text-red-600' : 'text-slate-800'}`}>
                {telemetry.peakDensity || 0} p/m²
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-purple-100 shadow-2xs">
              <span className="text-slate-500 font-medium">Risk Exposure:</span>
              <span className="font-mono font-black text-slate-800">
                {Math.round(telemetry.cumulativeExposure || 0)} pts
              </span>
            </div>
          </div>

          {/* Active Door Clogs */}
          {telemetry.bottleneckDoors && telemetry.bottleneckDoors.length > 0 && (
            <div className="text-[11px] font-bold text-amber-800 bg-amber-100/70 p-2 rounded-lg flex items-center gap-1.5">
              <span>⚠️ Door Arching Queues Active at:</span>
              <span className="font-mono font-black">{telemetry.bottleneckDoors.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* 10-Floor Population Distribution Matrix */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" /> POPULATION MATRIX (LEVELS 1 - 10):
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fl => (
            <div key={fl} className="p-1.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[9px] text-slate-400 font-bold">L{fl}</div>
              <div className="font-extrabold text-blue-600">{floorCounts[fl]}p</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Evacuation Progress Bar */}
      <div>
        <div className="flex justify-between text-xs font-bold mb-1">
          <span className="text-slate-600">Total Evacuation Progress</span>
          <span className="font-mono text-emerald-600">{evacProgress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${evacProgress}%` }}
          />
        </div>
      </div>

      {/* Multi-Floor Emergency Stairwell Cores & Exits */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>STAIRWELL CORE & EXIT THROUGHPUT</span>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            LOAD BALANCED
          </span>
        </div>

        {exits.map((exit) => {
          const loadPct = exit.loadPercentage || Math.min(100, Math.round((exit.load / exit.capacity) * 100)) || 0;
          const isOverloaded = loadPct > 100;
          const isHeavy = loadPct > 85;

          return (
            <div key={exit.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-slate-800 text-xs">{exit.name}</span>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                    isOverloaded
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : isHeavy
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {exit.load} / {exit.capacity} ({loadPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverloaded
                      ? 'bg-red-500'
                      : isHeavy
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, loadPct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stampede Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            {bottlenecks.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      )}

      {bottlenecks.length === 0 && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Stairwells & ground muster exits dynamically balanced. Zero congestion.</span>
        </div>
      )}
    </div>
  );
});
