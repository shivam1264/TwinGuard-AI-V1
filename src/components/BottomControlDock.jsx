import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Layers,
  Camera,
  Maximize2,
  ChevronDown
} from 'lucide-react';

export const BottomControlDock = ({
  isSimulating = false,
  simSpeed = 1.0,
  onStartEvacuation,
  onPauseResume,
  onReset,
  onSetSpeed,
  onSetCameraPreset,
  bimLayers = { structure: true, fireSafety: true, occupants: true },
  onToggleBimLayer,
  onToggleFullscreen
}) => {
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
  const [currentCameraLabel, setCurrentCameraLabel] = useState('Isometric View');
  const [bimToggle, setBimToggle] = useState(true);

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1.0, label: '1x' },
    { value: 2.0, label: '2x' },
    { value: 4.0, label: '4x' }
  ];

  const cameraOptions = [
    { id: 'DEFAULT', label: 'Isometric View' },
    { id: 'HERO_VIEW', label: 'Hero Section View' },
    { id: 'TOP_DOWN', label: 'Top Down View' },
    { id: 'STAIRS_FOCUS', label: 'Stair Shaft View' }
  ];

  const handleSelectCamera = (opt) => {
    setCurrentCameraLabel(opt.label);
    setCameraMenuOpen(false);
    onSetCameraPreset(opt.id);
  };

  return (
    <div className="h-[74px] px-6 bg-white border-t border-slate-200/90 flex items-center justify-between gap-4 shrink-0 z-30 select-none shadow-sm">
      {/* 1. Left Group: Evacuation Action & Reset Pills */}
      <div className="flex items-center gap-3">
        {/* Main Action Pill (Pause Evacuation when simulating, Start Evacuation when idle) */}
        {!isSimulating ? (
          <button
            onClick={onStartEvacuation}
            className="h-[50px] px-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full shadow-sm shadow-red-500/25 flex items-center gap-3.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-black tracking-wider uppercase leading-none">
                START EVACUATION
              </div>
              <div className="text-[10px] text-red-100 font-medium leading-none mt-1">
                Simulate and manage evacuation
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onPauseResume}
            className="h-[50px] px-5 bg-gradient-to-r from-[#ff6b00] to-[#f97316] hover:from-[#ea580c] hover:to-[#f97316] text-white rounded-full shadow-sm shadow-orange-500/25 flex items-center gap-3.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
              <Pause className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-black tracking-wider uppercase leading-none">
                PAUSE EVACUATION
              </div>
              <div className="text-[10px] text-white/90 font-medium leading-none mt-1">
                Simulation in progress
              </div>
            </div>
          </button>
        )}

        {/* Reset Pill */}
        <button
          onClick={onReset}
          className="h-[50px] px-4.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-full flex items-center gap-2.5 transition-all shadow-2xs cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.4]" />
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-black text-slate-900 leading-none">RESET</div>
            <div className="text-[10px] text-slate-400 font-medium leading-none mt-1">
              Clear all and reset
            </div>
          </div>
        </button>
      </div>

      {/* 2. Simulation Speed Capsule */}
      <div className="hidden md:flex items-center gap-3 h-[50px] px-4 bg-white border border-slate-200/90 rounded-full shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Gauge className="w-4 h-4 text-slate-700 stroke-[2.2]" />
          <span className="text-xs font-extrabold text-slate-800">Simulation Speed</span>
        </div>

        <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-full border border-slate-200/60">
          {speedOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSetSpeed(opt.value)}
              className={`font-mono text-xs transition-all cursor-pointer ${
                simSpeed === opt.value
                  ? 'bg-[#2563eb] text-white rounded-full px-3 py-1 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 rounded-full px-2.5 py-1 font-semibold hover:bg-slate-200/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BIM Layers Toggle & Checkboxes Capsule */}
      <div className="hidden lg:flex items-center gap-4 h-[50px] px-4 bg-white border border-slate-200/90 rounded-full shadow-2xs">
        {/* Toggle Switch */}
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-slate-700 stroke-[2.2]" />
          <span className="text-xs font-extrabold text-slate-800">BIM Layers</span>

          <button
            onClick={() => setBimToggle(!bimToggle)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
              bimToggle ? 'bg-[#2563eb]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                bimToggle ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Checkboxes: Structure, Fire Safety, Occupants */}
        <div className="flex items-center gap-3.5 text-xs pl-3 border-l border-slate-200">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={bimLayers.structure}
              onChange={(e) => onToggleBimLayer('structure', e.target.checked)}
              className="w-4 h-4 rounded text-[#2563eb] focus:ring-[#2563eb] border-slate-300 accent-[#2563eb] cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">Structure</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={bimLayers.fireSafety}
              onChange={(e) => onToggleBimLayer('fireSafety', e.target.checked)}
              className="w-4 h-4 rounded text-[#2563eb] focus:ring-[#2563eb] border-slate-300 accent-[#2563eb] cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">Fire Safety</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={bimLayers.occupants}
              onChange={(e) => onToggleBimLayer('occupants', e.target.checked)}
              className="w-4 h-4 rounded text-[#2563eb] focus:ring-[#2563eb] border-slate-300 accent-[#2563eb] cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">Occupants</span>
          </label>
        </div>
      </div>

      {/* 4. Right: Camera View Dropdown & Fullscreen Expand */}
      <div className="flex items-center gap-2.5">
        {/* Camera View Pill */}
        <div className="relative">
          <button
            onClick={() => setCameraMenuOpen(!cameraMenuOpen)}
            className="h-[50px] px-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 flex items-center gap-3 transition-colors shadow-2xs cursor-pointer"
          >
            <Camera className="w-4.5 h-4.5 text-[#2563eb] stroke-[2.2]" />
            <div className="text-left hidden sm:block">
              <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">
                Camera View
              </span>
              <span className="text-xs font-extrabold text-slate-900 leading-tight">
                {currentCameraLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Camera Options Menu */}
          {cameraMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectCamera(opt)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                    currentCameraLabel === opt.label
                      ? 'bg-blue-50 text-[#2563eb] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Expand Button */}
        <button
          onClick={onToggleFullscreen}
          className="w-[50px] h-[50px] rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4.5 h-4.5 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
