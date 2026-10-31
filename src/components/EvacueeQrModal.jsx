// ==============================================================================
// TwinGuard AI - Scannable Mobile Evacuee Companion QR Modal
// Enables live multi-device mobile wayfinding demonstrations for hackathon judges
// Auto-detects Hotspot / Wi-Fi LAN IP so smartphones connect seamlessly without localhost errors
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Wifi,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Radio,
  RefreshCw,
  Info,
  CheckCircle2
} from 'lucide-react';

export function EvacueeQrModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Detect whether current page is opened via localhost or a LAN IP
  const getInitialHost = () => {
    if (typeof window === 'undefined') return '10.229.123.50';
    const host = window.location.hostname;
    // Mobile phones cannot connect to "localhost". Default to detected hotspot/Wi-Fi IP
    return (host === 'localhost' || host === '127.0.0.1') ? '10.229.123.50' : host;
  };

  const defaultPort = typeof window !== 'undefined' ? window.location.port || '5173' : '5173';
  const [customHost, setCustomHost] = useState(getInitialHost);
  const [detectedLanIp, setDetectedLanIp] = useState('10.229.123.50');
  const [availableIps, setAvailableIps] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch live network interfaces from backend API
  const fetchNetworkIp = () => {
    setIsDetecting(true);
    fetch('/api/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.bestLanIp) {
          setDetectedLanIp(data.bestLanIp);
          if (data.addresses && Array.isArray(data.addresses)) {
            setAvailableIps(data.addresses);
          }
          // If customHost is still localhost, auto-switch to detected LAN IP
          if (customHost === 'localhost' || customHost === '127.0.0.1') {
            setCustomHost(data.bestLanIp);
          }
        }
      })
      .catch(() => {
        // Fallback default
        if (customHost === 'localhost' || customHost === '127.0.0.1') {
          setCustomHost('10.229.123.50');
        }
      })
      .finally(() => {
        setIsDetecting(false);
      });
  };

  useEffect(() => {
    fetchNetworkIp();
  }, []);

  // Compute full mobile URL
  const mobileUrl = `${window.location.protocol}//${customHost}:${defaultPort}/?view=evacuee`;

  // Dynamic QR Code API (high quality, reliable, scannable by all phone cameras)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    mobileUrl
  )}&color=0f172a&bgcolor=ffffff`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobileUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };

  const handleOpenSimulator = () => {
    window.open('/?view=evacuee', '_blank', 'width=420,height=820,left=200,top=100');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  Live Mobile Evacuee Companion
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hotspot Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Scan with any smartphone camera for personal AI wayfinding HUD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Active Network IP Banner */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11.5px] text-indigo-900 leading-relaxed">
              <strong className="font-semibold text-indigo-950">Mobile Hotspot Connected:</strong> When scanning from your phone, devices cannot connect to <code className="bg-white/80 px-1 py-0.5 rounded border border-indigo-200 text-slate-700 font-mono text-[10.5px]">localhost</code>. This QR code automatically uses your laptop's Hotspot IP (<code className="bg-indigo-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-900">{customHost}</code>).
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-slate-200">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200/80 mb-3 relative group">
              <img
                src={qrCodeImageUrl}
                alt="Mobile Evacuee Companion QR Code"
                className="w-52 h-52 object-contain rounded-lg"
              />
              <div className="absolute inset-0 bg-indigo-900/5 backdrop-blur-[0.5px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-lg">
                  Point Camera Here
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Real-Time Bi-Directional IoT Cloud Sync</span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                When an emergency triggers in the Command Center, this phone screen immediately alarms and reroutes the user!
              </p>
            </div>
          </div>

          {/* Network Host / IP Configurator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                Network Target Host / IP:
              </span>
              <button
                onClick={fetchNetworkIp}
                className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                title="Refresh detected IP"
              >
                <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>Refresh IP</span>
              </button>
            </div>

            {/* Quick-switch IP Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCustomHost(detectedLanIp)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  customHost === detectedLanIp
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Hotspot / Wi-Fi: {detectedLanIp}</span>
                {customHost === detectedLanIp && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>

              <button
                onClick={() => setCustomHost('localhost')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  customHost === 'localhost'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>localhost (PC only)</span>
              </button>
            </div>

            {/* Manual input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value.trim())}
                placeholder="e.g. 10.229.123.50"
                className="flex-1 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                onClick={() => setCustomHost(detectedLanIp)}
                className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                title="Reset to Hotspot LAN IP"
              >
                Reset to Hotspot IP
              </button>
            </div>

            <div className="pt-1 text-[11px] font-mono text-slate-600 flex items-center justify-between">
              <span className="truncate">
                URL: <strong className="text-indigo-600 font-semibold">{mobileUrl}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons for Presenter */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleOpenSimulator}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Simulator Tab</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Mobile Link'}</span>
            </button>
          </div>

          {/* Hackathon Pitching Tip Box */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>How to Demo to Judges:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 font-medium">
              <li>Scan the QR code with your phone camera (must be on the same Hotspot / Wi-Fi).</li>
              <li>Trigger a fire or block Stairwell A on the laptop's 3D Command Center.</li>
              <li>Watch the phone screen instantly alarm, vibrate, and display turn-by-turn rerouting!</li>
              <li>Tap <strong>"I Am Safe"</strong> on the phone to watch the Command Center counter increment live!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
