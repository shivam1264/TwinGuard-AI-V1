import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Info,
  Compass,
  Video,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import building3dImg from '../assets/building/building_3d_render.png';

export const IncidentsModal = ({
  incidents = [],
  onClose,
  onFocusRoom,
  onStartEvacuation,
  onOpenGis,
  onOpenCctv
}) => {
  const [filter, setFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('EXTERIOR'); // 'EXTERIOR' | 'INTERIOR' | 'TOP_VIEW' | 'FLOORS'
  const [selectedIncident, setSelectedIncident] = useState('L7');

  const liveIncidents = [
    {
      id: 'L7',
      title: 'L7 - West Stair Fire',
      severity: 'Critical',
      subtitle: 'Smoke & high temperature detected',
      time: '2 min ago',
      level: 'Level 7',
      color: '#ef4444',
      status: 'active'
    },
    {
      id: 'G',
      title: 'G - Exit Blockage',
      severity: 'High',
      subtitle: 'Main lobby (Exit C) is obstructed',
      time: '4 min ago',
      level: 'Ground Floor',
      color: '#f97316',
      status: 'active'
    },
    {
      id: 'L5',
      title: 'L5 - Crowd Surge',
      severity: 'Medium',
      subtitle: 'Elevated density (1.68 p/m²) near Core B',
      time: '6 min ago',
      level: 'Level 5',
      color: '#f59e0b',
      status: 'active'
    },
    {
      id: 'L3',
      title: 'L3 - Sensor Anomaly',
      severity: 'Resolved',
      subtitle: 'Temperature spike normalized',
      time: '18 min ago',
      level: 'Level 3',
      color: '#10b981',
      status: 'resolved'
    },
    {
      id: 'L2',
      title: 'L2 - False Alarm',
      severity: 'Resolved',
      subtitle: 'Smoke sensor self-cleared',
      time: '26 min ago',
      level: 'Level 2',
      color: '#10b981',
      status: 'resolved'
    }
  ];

  const timelineSteps = [
    { time: '11:43:12 PM', title: 'Fire detected (L7)', detail: 'Smoke & temperature threshold exceeded', status: 'done' },
    { time: '11:43:18 PM', title: 'Alarm triggered', detail: 'Building-wide alert initiated', status: 'done' },
    { time: '11:43:30 PM', title: 'Evacuation started', detail: 'Occupants directed to Stair Cores (A, B)', status: 'done' },
    { time: '11:44:05 PM', title: 'Responders dispatched', detail: 'Fire engine en route (ETA: 02:48)', status: 'active' },
    { time: '11:46:00 PM', title: 'Arrival at campus gate', detail: 'Security clearance & handoff', status: 'pending' },
    { time: '11:47:30 PM', title: 'On-scene intervention', detail: 'Fire suppression & containment', status: 'pending' }
  ];

  const levels = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 select-none overflow-y-auto">
      {/* Full Modal Container Matching Image 5 */}
      <div
        className="w-full max-w-7xl rounded-3xl overflow-hidden flex flex-col border border-sky-500/30 shadow-2xl my-auto"
        style={{
          background: 'linear-gradient(180deg, #070d19 0%, #0c162d 100%)',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(37, 99, 235, 0.25)',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
        {/* ── Top Header Banner (Matching Image 5) ── */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-sky-500/20 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">
                Incidents Command Center
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Real-time detection, tracking, and coordinated response for building incidents.
              </p>
            </div>
          </div>

          {/* Active Counters Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>ACTIVE INCIDENTS: 3</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RESOLVED (Today): 5</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold font-mono">
              TOTAL: 8
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Active Incident Hero Strip (Matching Image 5) ── */}
        <div className="px-6 py-3 flex items-center justify-between bg-red-500/10 border-b border-red-500/25">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/25 border border-red-500/50 flex items-center justify-center text-red-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  CASE: L7 – WEST STAIR FIRE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500 text-white">
                  CRITICAL
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Active fire with smoke spread in West Stair Core (A)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] font-sans">Incident ID</span>
              <span className="font-bold text-white">INC-2026-107</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-sans">Started At</span>
              <span className="font-bold text-white">11:43:12 PM</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-sans">Elapsed Time</span>
              <span className="font-black text-red-400 text-sm bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40">
                02:48
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid: 3 Columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-6">
          {/* Column 1: Live Incident Feed (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Live Incident Feed</span>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] no-scrollbar">
              {liveIncidents.map((inc) => {
                const isSelected = selectedIncident === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc.id)}
                    className="p-3 rounded-2xl cursor-pointer transition-all"
                    style={{
                      background: isSelected
                        ? 'rgba(15, 23, 42, 0.95)'
                        : 'rgba(11, 22, 44, 0.65)',
                      border: isSelected
                        ? `1.5px solid ${inc.color}`
                        : '1px solid rgba(56, 189, 248, 0.15)',
                      boxShadow: isSelected ? `0 0 16px ${inc.color}35` : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{inc.title}</span>
                      <span
                        className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded"
                        style={{
                          background: `${inc.color}25`,
                          color: inc.color,
                          border: `1px solid ${inc.color}50`
                        }}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{inc.subtitle}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-800">
                      <span>{inc.time}</span>
                      <span>{inc.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Center 3D Digital Twin Incident Locator (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-sky-500/20 text-xs font-bold">
                {['Exterior', 'Interior', 'Top View', 'Floors'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toUpperCase())}
                    className="px-3 py-1 rounded-lg transition-all"
                    style={{
                      background: activeTab === tab.toUpperCase() ? '#2563eb' : 'transparent',
                      color: activeTab === tab.toUpperCase() ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button className="text-slate-400 hover:text-white p-1">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Viewport Slot with 3D Building + Fire Pin */}
            <div className="relative rounded-2xl overflow-hidden border border-sky-500/25 bg-slate-950/70 h-[340px] flex items-center justify-center">
              <img
                src={building3dImg}
                alt="3D Building Locator"
                className="w-full h-full object-cover brightness-90 contrast-115"
              />

              {/* Fire Pin Bubble at Level 7 */}
              <div
                className="absolute top-24 right-32 flex items-center gap-2 px-3 py-1.5 rounded-xl text-white font-bold text-xs"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
                }}
              >
                <Flame className="w-4 h-4 animate-bounce" />
                <span>L7 – West Stair Core (A)</span>
              </div>

              {/* Floor Level Rail on the right */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                {levels.map((lvl) => (
                  <div
                    key={lvl}
                    className={`w-7 h-5 flex items-center justify-center rounded text-[9.5px] font-mono font-bold ${
                      lvl === 7
                        ? 'bg-red-500 text-white font-black animate-pulse'
                        : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                    }`}
                  >
                    L{lvl}
                  </div>
                ))}
              </div>

              {/* Incident Location Floating Card (Matching Image 5) */}
              <div
                className="absolute bottom-3 left-3 p-3 rounded-2xl backdrop-blur-md flex flex-col gap-1.5 text-xs"
                style={{
                  background: 'rgba(8, 16, 32, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  width: '210px'
                }}
              >
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Incident Location</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono">
                  <span className="text-slate-400">Floor</span>
                  <span className="font-bold text-white">Level 7</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono">
                  <span className="text-slate-400">Area</span>
                  <span className="font-bold text-white">West Stair Core (A)</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono">
                  <span className="text-slate-400">Affected Zone</span>
                  <span className="font-bold text-white">Stairwell + Adj.</span>
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between font-mono">
                  <span className="text-slate-400">Affected Occupants</span>
                  <span className="font-bold text-red-400">42</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Incident Timeline & Quick Actions (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3">
            {/* Timeline */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Incident Timeline</span>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] no-scrollbar">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        step.status === 'done'
                          ? 'bg-emerald-400'
                          : step.status === 'active'
                          ? 'bg-sky-400 animate-ping'
                          : 'bg-slate-600'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">{step.time}</span>
                        <span className="font-bold text-white">{step.title}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions (Matching Image 5) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-sky-500/20">
              <div className="text-xs font-bold text-slate-300">
                Quick Actions
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onStartEvacuation) onStartEvacuation();
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 border border-red-400 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Start Evacuation</span>
                </button>

                <button
                  onClick={onOpenGis}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-500 border border-sky-400 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Dispatch Responders</span>
                </button>

                <button
                  onClick={onOpenGis}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open GIS Route</span>
                </button>

                <button
                  onClick={onOpenCctv}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View CCTV (L7)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Impact Analysis Live Bar (Matching Image 5) ── */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-sky-500/20 bg-slate-900/60 text-xs">
          <div className="flex items-center gap-6">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-semibold">Impact Analysis (Live)</span>
              <span className="font-bold text-white">Real-time situation assessment</span>
            </div>

            <div className="flex items-center gap-6 font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">Total Occupants</span>
                <span className="font-bold text-white text-sm">190</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Affected</span>
                <span className="font-black text-red-400 text-sm">42</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Evacuated</span>
                <span className="font-bold text-emerald-400 text-sm">0</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Active Stairwells</span>
                <span className="font-bold text-white text-sm">3 (A, B, C)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Est. Clearance Time</span>
                <span className="font-black text-amber-400 text-sm">06:30 min</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Spread Risk</span>
                <span className="font-black text-red-400 text-sm">High</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-xs text-sky-400 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Detailed Analysis</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
