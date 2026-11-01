import React, { useState } from 'react';
import {
  Settings,
  X,
  Sliders,
  Bell,
  Shield,
  Eye,
  Check,
  User,
  Mail,
  Lock,
  Building,
  Key,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  BadgeCheck
} from 'lucide-react';

export const SettingsModal = ({
  theme = 'dark',
  onClose,
  initialTab = 'PROFILE',
  onOpenLogin
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState(initialTab);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [autoReroute, setAutoReroute] = useState(true);
  const [stairwellOverloadLimit, setStairwellOverloadLimit] = useState(80);
  const [visionAiSensitivity, setVisionAiSensitivity] = useState('High');
  const [savedNotification, setSavedNotification] = useState(false);

  // User Profile state
  const [profileData, setProfileData] = useState({
    name: 'Shivansh Mehra',
    email: 'shivansh.mehra@twinguard.ai',
    role: 'Lead Emergency Safety Controller & Commander',
    badgeId: 'TG-CMD-8092',
    station: 'Central Command Center (Tower A)',
    dutyShift: '24/7 Priority Emergency Readiness',
    twoFactorEnabled: true,
    phone: '+91 98765 43210'
  });

  const handleSave = () => {
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
      onClose();
    }, 700);
  };

  const sections = [
    { id: 'PROFILE', label: 'User Profile & Role', icon: User },
    { id: 'SIMULATION', label: 'Egress Logic & AI', icon: Sliders },
    { id: 'ALERTS', label: 'Alerts & Dispatch', icon: Bell },
    { id: 'FACILITY', label: 'Safety Standards', icon: Shield },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-slate-950/75 theme-dark' : 'bg-slate-900/40 theme-light'} backdrop-blur-md p-4 animate-in fade-in duration-150 select-none`}>
      <div
        className={`w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? "text-slate-100" : "text-slate-900"}`}
        style={{
          background: isDark ? 'linear-gradient(180deg, #0b1528 0%, #080f1d 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.1)' : '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: isDark ? '1px solid rgba(56, 189, 248, 0.16)' : '1px solid #e2e8f0',
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0 w-10 h-10 rounded-xl"
              style={{
                background: 'rgba(14, 165, 233, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
              }}
            >
              {activeSection === 'PROFILE' ? (
                <User className="w-5 h-5 text-sky-400" />
              ) : (
                <Settings className="w-5 h-5 text-sky-400" />
              )}
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <span>Profile & System Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300">
                  v2.4 Live
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Officer credentials, notification channels, AI routing & life safety parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`flex items-center justify-center cursor-pointer transition-colors w-8 h-8 rounded-lg ${isDark ? 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div
          className="flex items-center px-6 py-2.5 gap-2 border-b overflow-x-auto"
          style={{
            borderColor: 'rgba(56, 189, 248, 0.12)',
            background: 'rgba(11, 22, 44, 0.4)'
          }}
        >
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. USER PROFILE TAB */}
          {activeSection === 'PROFILE' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Profile Card Header */}
              <div className="p-4 rounded-xl border border-sky-500/20 bg-slate-900/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-sky-500/20 border border-white/20">
                      SM
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{profileData.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> Certified Controller
                      </span>
                    </div>
                    <p className="text-xs text-sky-400 font-medium mt-0.5">{profileData.role}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Badge: <span className="text-slate-300 font-bold">{profileData.badgeId}</span> • Station: {profileData.station}
                    </p>
                  </div>
                </div>

                {onOpenLogin && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch User</span>
                  </button>
                )}
              </div>

              {/* Editable User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" /> Official Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Security Access Level
                  </label>
                  <div className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-emerald-400 font-bold flex items-center justify-between">
                    <span>LEVEL 5 (Master BIM & Incident Command)</span>
                    <span className="text-[10px] text-slate-400">Restricted</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-400" /> Station & Assigned Zone
                  </label>
                  <input
                    type="text"
                    value={profileData.station}
                    onChange={(e) => setProfileData({ ...profileData, station: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 focus:border-sky-500 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Two-Factor Authentication & Security Checklist */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</div>
                    <div className="text-[11px] text-slate-400">Hardware token and mobile authenticator active</div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.twoFactorEnabled}
                    onChange={(e) => setProfileData({ ...profileData, twoFactorEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* 2. EGRESS LOGIC & AI */}
          {activeSection === 'SIMULATION' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl border border-sky-500/20 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Dynamic AI Crowd Rerouting</div>
                  <div className="text-[11px] text-slate-400">
                    Automatically recalculate evacuee paths if fire spreads or stairwell exceeds density threshold
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReroute}
                    onChange={(e) => setAutoReroute(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-500/20 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Stairwell Density Overload Limit</div>
                  <div className="text-[11px] text-slate-400">
                    Max capacity percentage before pathfinding triggers bottleneck bypass
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-400">{stairwellOverloadLimit}%</span>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={stairwellOverloadLimit}
                    onChange={(e) => setStairwellOverloadLimit(Number(e.target.value))}
                    className="w-24 accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-500/20 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">CCTV Vision AI Fire & Smoke Sensitivity</div>
                  <div className="text-[11px] text-slate-400">
                    Confidence threshold for automated alarm triggers on CCTV 100-Cam feed
                  </div>
                </div>
                <select
                  value={visionAiSensitivity}
                  onChange={(e) => setVisionAiSensitivity(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-sky-300 font-semibold px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="Low">Standard (85%)</option>
                  <option value="High">High AI Sensitivity (95%)</option>
                  <option value="Aggressive">Instant Trigger (99%)</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. ALERTS & DISPATCH */}
          {activeSection === 'ALERTS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl border border-sky-500/20 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Audio Emergency Siren & Audio Clues</div>
                  <div className="text-[11px] text-slate-400">
                    Play synthesized directional audio alarm through command console speakers
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioAlerts}
                    onChange={(e) => setAudioAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-500/20 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Automated Municipal 112 / GIS Dispatch</div>
                  <div className="text-[11px] text-slate-400">
                    Instant relay of incident coordinates and trapped occupants count to city emergency services
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ENABLED
                </span>
              </div>
            </div>
          )}

          {/* 4. SAFETY STANDARDS & AUDIT */}
          {activeSection === 'FACILITY' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-950/20 text-emerald-300 text-xs leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                  <ShieldCheck className="w-4 h-4" /> NFPA-101 Life Safety Code Active
                </div>
                All stairwells, muster assembly points, and exit flow rates operate under ISO 22320, NFPA-101, and IBC 2024 emergency management parameters.
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs">
                <span className="text-slate-300">Minimum Stairwell Width Allowance</span>
                <span className="font-mono font-bold text-white">1,400 mm (Pass)</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs">
                <span className="text-slate-300">Max Travel Distance to Nearest Exit</span>
                <span className="font-mono font-bold text-white">45.0 m (Compliant)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderTop: '1px solid rgba(56, 189, 248, 0.16)',
            background: 'rgba(15, 23, 42, 0.7)'
          }}
        >
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Profile & System sync operational</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/25 border border-sky-400/30 cursor-pointer transition-all flex items-center gap-1.5"
            >
              {savedNotification ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedNotification ? 'Saved!' : 'Save & Update'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
