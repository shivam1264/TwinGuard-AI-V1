// ==============================================================================
// TwinGuard AI - Live Occupant Trapped SOS Distress Modal
// High-priority tactical alert popup for the Incident Commander Command Center
// Triggered in real-time when any mobile evacuee presses "SOS / TRAPPED"
// ==============================================================================

import React, { useEffect } from 'react';
import {
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  MapPin,
  Clock,
  Radio,
  X,
  Eye,
  CheckCircle2,
  Ambulance,
  Flame
} from 'lucide-react';

export function SosAlertModal({ sosData, onClose, onFocusFloor }) {
  if (!sosData) return null;

  const floor = sosData.floor || 1;
  const roomName = sosData.subtitle || sosData.roomName || `Room ${sosData.roomId || 'Unknown'}`;
  const sender = sosData.sender || 'Mobile Evacuee Companion';
  const time = sosData.time || new Date().toLocaleTimeString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500 rounded-3xl shadow-2xl shadow-red-950/80 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Emergency Red Flashing Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white animate-bounce shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/25 text-white">
                  PRIORITY 1 DISPATCH
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
              <h2 className="text-base font-black tracking-tight text-white mt-0.5">
                OCCUPANT TRAPPED • IMMEDIATE EXTRACTION
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-slate-200">
          {/* Main Trapped Location Card */}
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-red-300 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400" />
                Beacon Pinned Location:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-[11px] font-black border border-red-500/30">
                LEVEL {floor}
              </span>
            </div>

            <div className="text-lg font-black text-white leading-tight">
              {roomName}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-red-500/20">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-slate-400">Transmitted from:</span>
                <strong className="text-white">{sender}</strong>
              </div>
              <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{time}</span>
              </div>
            </div>
          </div>

          {/* Autonomous Response Telemetry */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Automated Tactical Incident Actions:</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 text-[11px] pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Tactical Rescue Squad & Medical EMS notified for rapid staging.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>HVAC positive-pressure air barrier diverted to Floor {floor} core.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Smart dynamic floor signage rerouting mobile evacuee away from smoke.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                if (onFocusFloor) onFocusFloor(floor);
                onClose();
              }}
              className="py-3 px-4 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Focus 3D on Floor {floor}</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge Distress</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500">
            INCIDENT COMMAND DISPATCH • PROTOCOL NFPA 101 LIFE SAFETY OVERRIDE
          </span>
        </div>
      </div>
    </div>
  );
}
