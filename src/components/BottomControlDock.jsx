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
    <div className="h-20 px-6 bg-white/85 backdrop-blur-xl border-t border-slate-200/70 flex items-center justify-between gap-5 shrink-0 z-30 shadow-lg select-none">
      {/* Left: Start Evacuation & Reset Buttons (Spacious & High-End) */}
      <div className="flex items-center gap-3.5">
        {/* Big Prominent Action Button */}
        {!isSimulating ? (
          <button
            onClick={onStartEvacuation}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md shadow-red-500/30 flex items-center gap-3.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
            <div className="text-left">
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
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl shadow-md shadow-amber-500/30 flex items-center gap-3.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Pause className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-wider uppercase leading-none">
                PAUSE EVACUATION
              </div>
              <div className="text-[10px] text-amber-100 font-medium leading-none mt-1">
                Simulation in progress
              </div>
            </div>
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="px-4 py-3 bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 rounded-xl flex items-center gap-2.5 transition-all shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <div className="text-left">
            <div className="text-xs font-extrabold leading-none">RESET</div>
            <div className="text-[10px] text-slate-400 font-medium leading-none mt-1">
              Clear all and reset
            </div>
          </div>
        </button>
      </div>

      {/* Center 1: Simulation Speed (Clear, spacious, distinctly separated buttons) */}
      <div className="hidden md:flex items-center gap-3 px-3.5 py-2 bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Gauge className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Speed</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
          {speedOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSetSpeed(opt.value)}
              className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                simSpeed === opt.value
                  ? 'bg-[#0d7a5f] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center 2: BIM Layers Toggle & Checkboxes (Spacious & Clean) */}
      <div className="hidden lg:flex items-center gap-3.5 px-3.5 py-2 bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xs">
        {/* Toggle Header */}
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-[#0d7a5f]" />
          <span className="text-xs font-bold text-slate-700">BIM Layers</span>

          {/* Toggle Switch */}
          <button
            onClick={() => setBimToggle(!bimToggle)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
              bimToggle ? 'bg-[#0d7a5f]' : 'bg-slate-300'
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
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="text-xs font-medium">Structure</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={bimLayers.fireSafety}
              onChange={(e) => onToggleBimLayer('fireSafety', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="text-xs font-medium">Fire Safety</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={bimLayers.occupants}
              onChange={(e) => onToggleBimLayer('occupants', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="text-xs font-medium">Occupants</span>
          </label>
        </div>
      </div>

      {/* Right: Camera View Dropdown & Fullscreen Button */}
      <div className="flex items-center gap-2.5">
        {/* Camera View Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCameraMenuOpen(!cameraMenuOpen)}
            className="px-3.5 py-2.5 bg-white/70 hover:bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#0d7a5f]" />
            <div className="text-left hidden sm:block">
              <span className="text-[9px] text-slate-400 font-bold block leading-none">
                Camera View
              </span>
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentCameraLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Camera Options Menu */}
          {cameraMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-52 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectCamera(opt)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                    currentCameraLabel === opt.label
                      ? 'bg-emerald-50 text-[#0d7a5f] font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
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
          className="p-2.5 rounded-xl bg-white/70 hover:bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
