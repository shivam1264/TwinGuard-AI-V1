// ==============================================================================
// TwinGuard AI - Scannable Mobile Evacuee Companion QR Modal
// Professional, spacious multi-device pairing HUD with auto-detected Hotspot LAN IP
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Wifi,
  Radio,
  RefreshCw,
  CheckCircle2,
  Share2,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

export function EvacueeQrModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Detect whether current page is opened via localhost or a LAN IP
  const getInitialHost = () => {
    if (typeof window === 'undefined') return '10.229.123.50';
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' ? '10.229.123.50' : host;
  };

  const defaultPort = typeof window !== 'undefined' ? window.location.port || '5173' : '5173';
  const [customHost, setCustomHost] = useState(getInitialHost);
  const [detectedLanIp, setDetectedLanIp] = useState('10.229.123.50');
  const [copied, setCopied] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showAdvancedIp, setShowAdvancedIp] = useState(false);

  // Fetch live network interfaces from backend API
  const fetchNetworkIp = () => {
    setIsDetecting(true);
    fetch('/api/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.bestLanIp) {
          setDetectedLanIp(data.bestLanIp);
          if (customHost === 'localhost' || customHost === '127.0.0.1') {
            setCustomHost(data.bestLanIp);
          }
        }
      })
      .catch(() => {
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

  // Dynamic QR Code API (high quality, crisp 260x260, scannable by all phone cameras)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    mobileUrl
  )}&color=0f172a&bgcolor=ffffff&margin=1`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobileUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };

  const handleOpenSimulator = () => {
    window.open('/?view=evacuee', '_blank', 'width=420,height=840,left=250,top=80');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xl transition-all"
        style={{
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* ── HEADER ── */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  Live Mobile Evacuee Companion
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hotspot Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Scan with any smartphone camera for personal 3D egress wayfinding HUD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SPACIOUS 2-COLUMN BODY ── */}
        <div className="p-7">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-7 items-center">
            {/* Left Column: Hero QR Code Box & Actions */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md relative group transition-transform hover:scale-[1.01]">
                <img
                  src={qrCodeImageUrl}
                  alt="Mobile Evacuee Companion QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[0.5px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    Point Camera Here
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                <span>Real-Time Bi-Directional IoT Sync</span>
              </div>
            </div>

            {/* Right Column: Information, IP Selector & Primary Actions */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
              {/* Hotspot Pairing Notice Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/90 text-indigo-950 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wide text-indigo-950">
                    Connected Hotspot Network
                  </span>
                </div>
                <p className="text-xs text-indigo-900/85 font-medium leading-relaxed">
                  Your phone and laptop are paired over the mobile hotspot. The QR code automatically embeds your laptop's live LAN IP address (<strong className="font-bold text-indigo-950">{customHost}</strong>) for instant connection.
                </p>
              </div>

              {/* Network Target IP Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                    Target Network Host:
                  </span>
                  <button
                    onClick={fetchNetworkIp}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Refresh detected IP"
                  >
                    <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                    <span>Refresh IP</span>
                  </button>
                </div>

                {/* Pill Selectors */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustomHost(detectedLanIp)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      customHost === detectedLanIp
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Hotspot: {detectedLanIp}</span>
                    {customHost === detectedLanIp && <CheckCircle2 className="w-3.5 h-3.5 text-white ml-0.5" />}
                  </button>

                  <button
                    onClick={() => setCustomHost('localhost')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      customHost === 'localhost'
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Use localhost for same-laptop browser testing"
                  >
                    <span>localhost</span>
                  </button>
                </div>

                {/* Direct Link Preview */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="truncate max-w-[260px] text-slate-700 font-medium">
                    {mobileUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleOpenSimulator}
                  className="py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Simulator Tab</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-7 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero App Installation • Works in any mobile browser</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
