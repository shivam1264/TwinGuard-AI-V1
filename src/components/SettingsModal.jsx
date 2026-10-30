import React, { useState } from 'react';
import { Settings, X, Sliders, Bell, Shield, Eye, Check } from 'lucide-react';

export const SettingsModal = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('SIMULATION');
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [autoReroute, setAutoReroute] = useState(true);
  const [stairwellOverloadLimit, setStairwellOverloadLimit] = useState(80);
  const [visionAiSensitivity, setVisionAiSensitivity] = useState('High');
  const [savedNotification, setSavedNotification] = useState(false);

  const handleSave = () => {
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
      onClose();
    }, 800);
  };

  const sections = [
    { id: 'SIMULATION', label: 'Egress Logic & AI', icon: Sliders },
    { id: 'ALERTS', label: 'Alerts & Dispatch', icon: Bell },
    { id: 'FACILITY', label: 'Safety Standards', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '22px 28px 18px 28px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                color: '#0d7a5f',
              }}
            >
              <Settings style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Digital Twin Command Settings
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
                Simulation thresholds, automated routing & sensory configs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#94a3b8',
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Section Tabs */}
        <div
          className="flex items-center"
          style={{
            padding: '8px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            gap: '8px',
          }}
        >
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className="flex items-center cursor-pointer transition-all"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#0d7a5f' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  gap: '6px',
                  border: 'none',
                  boxShadow: isActive ? '0 2px 6px -1px rgba(13, 122, 95, 0.3)' : 'none',
                }}
              >
                <Icon style={{ width: '13px', height: '13px' }} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex flex-col overflow-y-auto" style={{ padding: '20px', gap: '16px' }}>
          {activeSection === 'SIMULATION' && (
            <div className="flex flex-col" style={{ gap: '14px' }}>
              {/* Dynamic Auto-Reroute */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    Dynamic Hazard Rerouting (Dijkstra + Crowd Load)
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                    Automatically recalculate egress routes away from smoke/fire hazards
                  </div>
                </div>
                <button
                  onClick={() => setAutoReroute(!autoReroute)}
                  className="cursor-pointer transition-colors"
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '999px',
                    padding: '2px',
                    background: autoReroute ? '#0d7a5f' : '#cbd5e1',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: autoReroute ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
              </div>

              {/* Stairwell Capacity Limit */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                      Stairwell Bottleneck Threshold
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                      Trigger stampede alert when capacity exceeds percentage
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0d7a5f', fontFamily: 'monospace' }}>
                    {stairwellOverloadLimit}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="120"
                  value={stairwellOverloadLimit}
                  onChange={(e) => setStairwellOverloadLimit(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0d7a5f', cursor: 'pointer' }}
                />
              </div>

              {/* Vision AI Sensitivity */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    CCTV Computer Vision Sensitivity
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                    Thermal & flame optical detection threshold
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: '4px' }}>
                  {['Low', 'Medium', 'High'].map(s => (
                    <button
                      key={s}
                      onClick={() => setVisionAiSensitivity(s)}
                      className="cursor-pointer transition-all"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: visionAiSensitivity === s ? 700 : 500,
                        background: visionAiSensitivity === s ? '#0d7a5f' : '#ffffff',
                        color: visionAiSensitivity === s ? '#ffffff' : '#64748b',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ALERTS' && (
            <div className="flex flex-col" style={{ gap: '14px' }}>
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    Audio Sirens & Warning Buzzers
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                    Broadcast alarm audio when fire hazard is verified
                  </div>
                </div>
                <button
                  onClick={() => setAudioAlerts(!audioAlerts)}
                  className="cursor-pointer transition-colors"
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '999px',
                    padding: '2px',
                    background: audioAlerts ? '#0d7a5f' : '#cbd5e1',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: audioAlerts ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'FACILITY' && (
            <div className="flex flex-col" style={{ gap: '14px' }}>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #d1fae5',
                  fontSize: '11.5px',
                  color: '#0d7a5f',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>NFPA-101 Life Safety Standards Active</div>
                All stairwells, muster assembly points, and exit flow rates operate under ISO 22320 and NFPA emergency management compliance parameters.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            className="cursor-pointer transition-colors"
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="cursor-pointer transition-all flex items-center"
            style={{
              padding: '8px 18px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0d7a5f 0%, #0a664e 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              gap: '6px',
              boxShadow: '0 2px 8px -1px rgba(13, 122, 95, 0.3)',
            }}
          >
            {savedNotification ? <Check style={{ width: '14px', height: '14px' }} /> : null}
            <span>{savedNotification ? 'Saved!' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

