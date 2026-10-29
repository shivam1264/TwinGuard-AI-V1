import React, { useMemo } from 'react';
import { ShieldCheck, AlertOctagon, Activity, Clock, CheckCircle2, Users, Layers } from 'lucide-react';

export const BottleneckAnalytics = React.memo(({ stats, exits, rooms, bottlenecks = [] }) => {
  const total = stats.total || 0;
  const evacuated = stats.evacuated || 0;
  const inTransit = stats.inTransit || 0;
  const elapsed = stats.elapsedSeconds || 0;

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
    <div className="glass-panel rounded-xl p-3 flex flex-col gap-3 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-hud font-bold text-xs tracking-wide text-emerald-300">
            10-FLOOR SKYSCRAPER ANALYTICS
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}s</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <div className="text-[9px] font-hud text-slate-400 uppercase">Tower Total</div>
          <div className="text-lg font-hud font-bold text-cyan-400 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> {total}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <div className="text-[9px] font-hud text-slate-400 uppercase">Safely Exited</div>
          <div className="text-lg font-hud font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {evacuated}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <div className="text-[9px] font-hud text-slate-400 uppercase">In Stairwells</div>
          <div className="text-lg font-hud font-bold text-amber-400 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3" /> {inTransit}
          </div>
        </div>
      </div>

      {/* 10-Floor Population Distribution Matrix */}
      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
        <div className="text-[10px] font-hud font-bold text-slate-300 mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" /> POPULATION ACROSS 10 FLOORS:
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-mono">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fl => (
            <div key={fl} className="p-1 rounded bg-slate-800/80 border border-slate-700/50">
              <div className="text-[8px] text-slate-400">L{fl}</div>
              <div className="font-bold text-cyan-300">{floorCounts[fl]}p</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Evacuation Progress Bar */}
      <div>
        <div className="flex justify-between text-xs font-hud mb-1">
          <span className="text-slate-300">Total Evacuation Progress</span>
          <span className="font-mono font-bold text-emerald-400">{evacProgress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${evacProgress}%` }}
          />
        </div>
      </div>

      {/* Multi-Floor Emergency Stairwell Cores & Exits */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-hud font-bold text-slate-300 flex items-center justify-between">
          <span>STAIRWELL CORE & EXIT LOAD</span>
          <span className="text-[9px] font-mono text-cyan-400">LOAD BALANCED</span>
        </div>

        {exits.map((exit) => {
          const loadPct = exit.loadPercentage || Math.min(100, Math.round((exit.load / exit.capacity) * 100)) || 0;
          const isOverloaded = loadPct > 100;
          const isHeavy = loadPct > 85;

          return (
            <div key={exit.id} className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-hud font-semibold text-slate-200 text-[11px]">{exit.name}</span>
                <span
                  className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isOverloaded
                      ? 'bg-red-950 text-red-400 border border-red-500/40'
                      : isHeavy
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {exit.load} / {exit.capacity} ({loadPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverloaded
                      ? 'bg-red-500'
                      : isHeavy
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
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
        <div className="p-2 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start gap-2 text-xs text-red-300">
          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            {bottlenecks.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>
      )}

      {bottlenecks.length === 0 && (
        <div className="p-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 text-[10px] text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Stairwells & ground exits dynamically balanced. No stampede detected.</span>
        </div>
      )}
    </div>
  );
});
