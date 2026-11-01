import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Cpu,
  Layers,
  Milestone,
  Compass,
  Users,
  Activity,
  ArrowRight,
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';
import building3dImg from '../assets/building/building_3d_render.png';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('shivansh.mehra@twinguard.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    }, 400);
  };

  const featurePills = [
    { label: '3D Digital Twin', icon: Layers },
    { label: 'AI Strategy & Simulation', icon: Cpu },
    { label: 'Life Safety Compliance', icon: ShieldCheck },
    { label: 'GIS Dispatch & Response', icon: Compass },
    { label: 'Crowd & Egress Analytics', icon: Users }
  ];

  const floorLevels = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#050b14]/90 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-y-auto">
      {/* Container matching Reference Image 1 */}
      <div
        className="relative w-full max-w-7xl rounded-3xl overflow-hidden flex flex-col lg:flex-row border border-sky-500/25 shadow-2xl min-h-[640px]"
        style={{
          background: 'linear-gradient(135deg, #070e1c 0%, #0d1a33 60%, #091224 100%)',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(37, 99, 235, 0.2)'
        }}
      >
        {/* Close Button on top right */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          title="Return to Dashboard"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── LEFT SHOWCASE HERO (Matching Reference Image 1) ── */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
          {/* Top Branding & Subtitle Header */}
          <div className="flex flex-col gap-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path
                      d="M3 20V12L8 8V20M8 20V4L16 4V20M16 20V9L21 13V20"
                      stroke="#38bdf8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-black text-white tracking-tight leading-none">
                    TWINGUARD <span className="text-sky-400">AI</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
                    Digital Twin Command Platform
                  </div>
                </div>
              </div>

              {/* Top Navigation Links */}
              <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
                <span className="hover:text-white cursor-pointer">Monitor</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer">Simulate</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer">Predict</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer">Evacuate</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer">Respond</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mt-4">
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                AI-Powered Digital Twin<br />
                for <span className="text-sky-400">Life Safety & Emergency Command</span>
              </h1>
              <p className="text-slate-300 text-sm mt-2 max-w-xl font-medium">
                Real-time building intelligence, predictive egress, and coordinated emergency response — all in one command platform.
              </p>
            </div>

            {/* Feature Badges Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {featurePills.map((pill, idx) => {
                const Icon = pill.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 backdrop-blur-md"
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-sky-400" />
                    <span>{pill.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Central 3D Digital Twin Visual with Cyan Grid Cutaway Overlay */}
          <div className="relative my-6 rounded-2xl overflow-hidden border border-sky-500/20 bg-slate-950/60 h-64 sm:h-80 flex items-center justify-center">
            <img
              src={building3dImg}
              alt="10-Storey Digital Twin"
              className="w-full h-full object-cover brightness-95 contrast-115"
            />
            {/* Live Synchronized Pill */}
            <div
              className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-bold text-white"
              style={{
                background: 'rgba(8, 16, 32, 0.85)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left">
                <div className="text-[11px] font-bold text-white leading-none">Live Digital Twin</div>
                <div className="text-[9px] text-emerald-400 font-semibold leading-none mt-0.5">Synchronized</div>
              </div>
            </div>

            {/* Left Building Specs Floating Card */}
            <div
              className="absolute bottom-4 left-4 p-3 rounded-2xl backdrop-blur-md hidden sm:flex flex-col gap-1.5 w-44"
              style={{
                background: 'rgba(8, 16, 32, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white">10-Storey Tower</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono flex justify-between">
                <span className="text-slate-400">Total Occupants</span>
                <span className="font-bold text-white">190</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono flex justify-between">
                <span className="text-slate-400">Total Rooms</span>
                <span className="font-bold text-white">100</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                <span className="text-slate-400">Stairwell Cores</span>
                <span className="font-bold text-white">3</span>
              </div>
            </div>

            {/* Floor Level Badges on Right side of the building */}
            <div className="absolute right-4 bottom-4 flex flex-col gap-1">
              {floorLevels.slice(0, 5).map(lvl => (
                <div
                  key={lvl}
                  className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-sky-500/20 border border-sky-500/40 text-sky-300"
                >
                  L{lvl}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Compliance & Response Status Bar */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 z-10 pt-2 border-t border-sky-500/15">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-red-500/20 text-red-400">🔥</span>
              <span className="font-bold text-white">Ready for Emergency Response</span>
              <span className="text-slate-400 text-[11px]">• Simulation • Evacuation • Multi-Agency Dispatch</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>NFPA 101 | IBC | ISO 22301</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT LOGIN CARD (Matching Reference Image 1) ── */}
        <div
          className="w-full lg:w-[440px] p-8 sm:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-sky-500/20 relative"
          style={{
            background: 'linear-gradient(180deg, rgba(11, 22, 44, 0.95) 0%, rgba(8, 16, 32, 0.98) 100%)'
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shadow-lg mb-3">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <path
                  d="M3 20V12L8 8V20M8 20V4L16 4V20M16 20V9L21 13V20"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-xl font-black text-white">
              TWINGUARD <span className="text-sky-400">AI</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              Digital Twin Command Platform
            </div>

            <h2 className="text-2xl font-black text-white mt-4">
              Command Center Login
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Secure access to the Building Digital Twin & Life Safety System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-300">
                Employee ID / Email
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-sky-500/25 bg-slate-900/80 focus-within:border-sky-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none w-full font-medium"
                  placeholder="name@twinguard.ai"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-300">
                Password
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-sky-500/25 bg-slate-900/80 focus-within:border-sky-400 transition-colors"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none w-full font-medium"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="text-sky-400 hover:underline font-semibold">
                Forgot password?
              </a>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(96, 165, 250, 0.5)'
              }}
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Login to Command Center</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-[1px] bg-slate-800" />
              <span className="text-[10px] text-slate-500 font-bold uppercase">OR</span>
              <div className="flex-1 h-[1px] bg-slate-800" />
            </div>

            {/* Corporate SSO Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-200 flex items-center justify-center gap-2.5 transition-colors cursor-pointer border border-sky-500/20 bg-slate-900/60 hover:bg-slate-800/80"
            >
              {/* Microsoft Colors Icon */}
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <div className="bg-red-500 rounded-xs" />
                <div className="bg-green-500 rounded-xs" />
                <div className="bg-blue-500 rounded-xs" />
                <div className="bg-yellow-500 rounded-xs" />
              </div>
              <span>Continue with Corporate SSO</span>
            </button>
          </form>

          {/* Footer Security Badge */}
          <div className="flex items-center justify-center gap-2 text-[10.5px] text-slate-400 mt-6 pt-4 border-t border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <div>
              <span className="font-bold text-slate-200">Enterprise-Grade Security</span>
              <span className="block text-[9.5px] text-slate-500">Role-based access • Encrypted • Audit Logged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

