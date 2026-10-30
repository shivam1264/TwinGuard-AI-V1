import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  Flame,
  ArrowRight
} from 'lucide-react';

export const IncidentsModal = ({ incidents = [], onClose, onFocusRoom }) => {
  const [filter, setFilter] = useState('ALL');

  const filteredIncidents = filter === 'ALL'
    ? incidents
    : incidents.filter(i => i.severity.toLowerCase() === filter.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Facility Incident Command Log
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live chronological safety & hazard dispatch events
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs bg-white">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Severity:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'HIGH', 'MEDIUM', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  filter === sev
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-3">
          {filteredIncidents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <span>No incidents matching selected filter</span>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isHigh = inc.severity === 'High';
              const isMed = inc.severity === 'Medium';

              return (
                <div
                  key={inc.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                    isHigh
                      ? 'bg-red-50/60 border-red-200'
                      : isMed
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      isHigh ? 'bg-red-100 text-red-600' : isMed ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {isHigh ? <Flame className="w-4 h-4 fill-red-500" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {inc.time}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isHigh ? 'bg-red-600 text-white' : isMed ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {inc.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {inc.subtitle}
                      </p>
                    </div>
                  </div>

                  {inc.roomId && onFocusRoom && (
                    <button
                      onClick={() => {
                        onFocusRoom(inc.roomId);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Locate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

