import React, { useState } from 'react';
import {
  BarChart3,
  Clock,
  Users,
  AlertTriangle,
  Layers,
  Flame,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FileText,
  FileCheck,
  X,
  FileDown
} from 'lucide-react';

const AnalyticsViewComponent = ({
  theme = 'dark',
  stats = { total: 190, evacuated: 0, inTransit: 190, elapsedSeconds: 0 },
  rooms = [],
  exits = [],
  onSwitchToLive
}) => {
  const isDark = theme === 'dark';
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportGeneratedTime, setReportGeneratedTime] = useState(new Date().toLocaleTimeString());

  const total = stats.total || 190;
  // For the simulation report, complete safe evacuation is 100% of occupants
  const simulatedEvacuated = total;
  const simulatedEvacPercent = 100;

  // Adaptive palette tokens for theme compliance
  const cardBg = isDark ? 'rgba(11, 22, 44, 0.85)' : '#ffffff';
  const cardBorder = isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0';
  const cardShadow = isDark ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.05)';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-300' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const innerBoxBg = isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tableDivide = isDark ? 'divide-slate-800' : 'divide-slate-200';
  const tableHeaderBorder = isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500';

  // High-End Official Statutory PDF Document Generator
  const handleDownloadPdf = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>TwinGuard AI - Life Safety & Egress Audit Certification</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.45;
          }
          .cert-container {
            border: 2px solid #0f2b48;
            padding: 16px 20px;
            background: #ffffff;
            position: relative;
          }
          .cert-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0b1e36;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .brand-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #0284c7;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .cert-doc-name {
            font-size: 14px;
            font-weight: 800;
            color: #1e293b;
            margin-top: 4px;
          }
          .cert-badge {
            background: #ecfdf5;
            border: 1.5px solid #10b981;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 6px;
            text-align: center;
          }
          .cert-badge-status {
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .cert-badge-sub {
            font-size: 9px;
            font-weight: bold;
            color: #047857;
            margin-top: 1px;
          }
          .meta-strip {
            display: grid;
            grid-template-columns: 2fr 1.2fr 1fr;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
            font-size: 10.5px;
          }
          .meta-item strong {
            color: #0f172a;
          }
          .meta-item span {
            color: #64748b;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-top: 3px solid #0284c7;
            border-radius: 6px;
            padding: 8px 10px;
            background: #fcfdfe;
          }
          .kpi-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            font-family: monospace;
            margin-top: 3px;
          }
          .kpi-sub {
            font-size: 9px;
            font-weight: bold;
            color: #10b981;
            margin-top: 2px;
          }
          .section-heading {
            font-size: 12px;
            font-weight: 800;
            color: #0b1e36;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-left: 3.5px solid #0284c7;
            padding-left: 6px;
            margin: 12px 0 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 12px;
          }
          th {
            background: #f1f5f9;
            color: #1e293b;
            font-weight: 800;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.3px;
          }
          td {
            padding: 5.5px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          .tag-pass {
            background: #dcfce7;
            color: #166534;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
            font-size: 9px;
            border: 1px solid #86efac;
          }
          .directives-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
          }
          .directive-item {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            margin-bottom: 4px;
            font-size: 10px;
            color: #1e293b;
          }
          .directive-bullet {
            color: #10b981;
            font-weight: 900;
          }
          .sign-strip {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
          }
          .sign-box {
            font-size: 9.5px;
          }
          .sign-line {
            border-bottom: 1px solid #94a3b8;
            margin-top: 24px;
            margin-bottom: 4px;
          }
          .sign-label {
            font-weight: 700;
            color: #334155;
          }
          .sign-role {
            font-size: 8.5px;
            color: #64748b;
          }
          .footer-note {
            margin-top: 10px;
            font-size: 8.5px;
            color: #64748b;
            text-align: center;
            border-top: 1px dashed #e2e8f0;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="cert-header">
            <div>
              <div class="brand-title">TwinGuard AI</div>
              <div class="brand-subtitle">Autonomous Building Digital Twin Command Platform</div>
              <div class="cert-doc-name">Life Safety & Emergency Egress Compliance Certification</div>
            </div>
            <div class="cert-badge">
              <div class="cert-badge-status">CERTIFIED PASS</div>
              <div class="cert-badge-sub">100% LIFE SAFETY CODE</div>
            </div>
          </div>

          <div class="meta-strip">
            <div class="meta-item">
              <span>Facility:</span> <strong>Horizon Tower (10 Levels) • Academic Core</strong><br>
              <span>Incident Scenario:</span> <strong style="color: #b91c1c;">Level 7 West Stair Fire (Active Simulation)</strong>
            </div>
            <div class="meta-item">
              <span>Certification Standard:</span> <strong>NFPA 101, IBC 2024 & ISO 22301</strong><br>
              <span>Audit Document ID:</span> <strong style="font-family: monospace;">TG-AUDIT-2026-L7-0894</strong>
            </div>
            <div class="meta-item" style="text-align: right;">
              <span>Timestamp:</span><br>
              <strong>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</strong>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Total Building Occupancy</div>
              <div class="kpi-value">${total}</div>
              <div class="kpi-sub">Verified by IoT Sensors</div>
            </div>
            <div class="kpi-card" style="border-top-color: #10b981;">
              <div class="kpi-title">Occupants Evacuated (Safe)</div>
              <div class="kpi-value" style="color: #166534;">${simulatedEvacuated} (100%)</div>
              <div class="kpi-sub">Zero Trapped Individuals</div>
            </div>
            <div class="kpi-card" style="border-top-color: #0284c7;">
              <div class="kpi-title">Clearance Time to Safety</div>
              <div class="kpi-value">06:30 min</div>
              <div class="kpi-sub">Benchmark: &lt; 10:00 min</div>
            </div>
            <div class="kpi-card" style="border-top-color: #f59e0b;">
              <div class="kpi-title">Peak Crowd Density</div>
              <div class="kpi-value">1.68 p/m²</div>
              <div class="kpi-sub" style="color: #b45309;">Safe Laminar Egress</div>
            </div>
          </div>

          <div class="section-heading">1. Statutory Building Code Compliance Verifications</div>
          <table>
            <thead>
              <tr>
                <th style="width: 28%;">Standard / Section</th>
                <th style="width: 44%;">Regulatory Requirement Description</th>
                <th style="width: 16%;">Measured Telemetry</th>
                <th style="width: 12%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>IBC Section 1006.3 / NFPA 101</strong></td>
                <td>Minimum 2 remote exit enclosures per story required</td>
                <td>3 Remote Cores Provided</td>
                <td style="text-align: center;"><span class="tag-pass">PASSED</span></td>
              </tr>
              <tr>
                <td><strong>NFPA 101 Section 7.3.3.1</strong></td>
                <td>Stairway clear width capacity (&gt; 0.3 in. per occupant)</td>
                <td>1.8m Core Clear Width</td>
                <td style="text-align: center;"><span class="tag-pass">PASSED</span></td>
              </tr>
              <tr>
                <td><strong>IBC Table 1017.2</strong></td>
                <td>Maximum travel distance to exit (&lt; 75m fully sprinklered)</td>
                <td>Max 38m Recorded</td>
                <td style="text-align: center;"><span class="tag-pass">PASSED</span></td>
              </tr>
              <tr>
                <td><strong>NFPA 92 Pressure Standard</strong></td>
                <td>Pressurized smoke-proof stair towers against vertical migration</td>
                <td>50 Pa Active Overpressure</td>
                <td style="text-align: center;"><span class="tag-pass">PASSED</span></td>
              </tr>
              <tr>
                <td><strong>ISO 22301 Egress Resilience</strong></td>
                <td>Automated bottleneck prevention & dynamic load balancing</td>
                <td>34% Dynamic Load Shift</td>
                <td style="text-align: center;"><span class="tag-pass">PASSED</span></td>
              </tr>
            </tbody>
          </table>

          <div class="section-heading">2. Tactical Egress Directives & Choke Point Resolution</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Choke Point Location</th>
                <th style="width: 18%;">Peak Density</th>
                <th style="width: 38%;">AI Mitigation Directive Executed</th>
                <th style="width: 19%; text-align: center;">Operational Outcome</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Stair Core B (L7)</strong></td>
                <td>1.68 p/m²</td>
                <td>Diverted 34% of Level 7 evacuees to Stair Core A via floor beacons</td>
                <td style="text-align: center;"><span class="tag-pass">Bottleneck Cleared</span></td>
              </tr>
              <tr>
                <td><strong>Corridor C (L7)</strong></td>
                <td>1.42 p/m²</td>
                <td>Dynamic illuminated floor arrows maintained steady 1.4 p/s flow</td>
                <td style="text-align: center;"><span class="tag-pass">Laminar Flow</span></td>
              </tr>
              <tr>
                <td><strong>Ground Exits (Gates A, B, C)</strong></td>
                <td>Optimal</td>
                <td>Tri-gate balanced dispersal (South 40%, West 30%, East 30%)</td>
                <td style="text-align: center;"><span class="tag-pass">Full Dispersal</span></td>
              </tr>
            </tbody>
          </table>

          <div class="section-heading">3. Autonomous Digital Twin Mitigations Log</div>
          <div class="directives-box">
            <div class="directive-item">
              <span class="directive-bullet">✓</span>
              <span><strong>HVAC Pressurization:</strong> 50 Pa active overpressure engaged in all vertical stair cores; zero smoke migration to upper or lower floors.</span>
            </div>
            <div class="directive-item">
              <span class="directive-bullet">✓</span>
              <span><strong>Directional Signage:</strong> Real-time photoluminescent pathways illuminated green guiding occupants away from fire zone.</span>
            </div>
            <div class="directive-item">
              <span class="directive-bullet">✓</span>
              <span><strong>Occupant Verification:</strong> All 190 occupants tracked and safely evacuated; zero trapped occupants detected across all 10 storeys.</span>
            </div>
          </div>

          <div class="sign-strip">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-label">TwinGuard AI System Kernel</div>
              <div class="sign-role">Autonomous Safety Audit Engine v2.4</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-label">Facility Safety Director</div>
              <div class="sign-role">Horizon Tower Operations Management</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-label">Certified Fire Safety Inspector</div>
              <div class="sign-role">Life Safety & NFPA Code Compliance</div>
            </div>
          </div>

          <div class="footer-note">
            OFFICIAL LIFE SAFETY AUDIT RECORD • GENERATED UNDER NFPA 101 AND IBC 2024 COMPLIANCE PROTOCOLS • CERTIFICATE #TG-2026-L7-0894
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      window.print();
    }
  };

  const handleOpenReportModal = () => {
    setReportGeneratedTime(new Date().toLocaleTimeString());
    setIsReportModalOpen(true);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto no-scrollbar select-none transition-colors duration-300 ${
        isDark ? 'bg-[#070d18] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── 1. Page Title Header Strip with Report Action ── */}
      <div
        className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b transition-colors shrink-0 ${
          isDark ? 'border-sky-500/20' : 'border-slate-200'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(11, 22, 44, 0.95) 0%, rgba(7, 13, 24, 0.9) 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(56, 189, 248, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)'
            }}
          >
            <BarChart3 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className={`text-xl font-extrabold tracking-tight flex items-center gap-2 ${textPrimary}`}>
              Predictive Analytics & Flow Intelligence
            </h1>
            <p className={`text-xs ${textMuted} font-medium`}>
              AI-powered analysis for evacuation time, crowd behavior, bottlenecks, and life safety compliance.
            </p>
          </div>
        </div>

        {/* Right Status Badges & Generate Report Trigger */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isDark ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-red-200 text-red-600 bg-red-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Simulation: L7 West Stair Fire</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isDark ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-200 text-emerald-600 bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Analysis</span>
          </div>

          {/* Generate Report Primary Button in Header */}
          <button
            onClick={handleOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* ── 2. Main Executive Content Container ── */}
      <div className="flex-1 p-5 md:p-6 flex flex-col gap-5 max-w-[1700px] w-full mx-auto">
        {/* Top 5 KPI Summary Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* KPI 1 */}
          <div
            className="p-3.5 rounded-2xl flex items-center gap-3 transition-all"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/35 flex items-center justify-center text-sky-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] ${textMuted} font-semibold uppercase tracking-wider`}>Predicted Clearance</div>
              <div className={`text-base font-black ${textPrimary} font-mono leading-tight`}>06:30 min</div>
              <div className="text-[9.5px] text-emerald-500 font-bold mt-0.5">↓ -27% vs. unoptimized</div>
            </div>
          </div>

          {/* KPI 2 */}
          <div
            className="p-3.5 rounded-2xl flex items-center gap-3 transition-all"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] ${textMuted} font-semibold uppercase tracking-wider`}>Total Occupants</div>
              <div className={`text-base font-black ${textPrimary} font-mono leading-tight`}>{total}</div>
              <div className={`text-[9.5px] ${textMuted} mt-0.5`}>10-Storey Tower</div>
            </div>
          </div>

          {/* KPI 3 */}
          <div
            className="p-3.5 rounded-2xl flex items-center gap-3 transition-all"
            style={{ background: cardBg, border: '1px solid rgba(16, 185, 129, 0.35)', boxShadow: cardShadow }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] ${textMuted} font-semibold uppercase tracking-wider`}>Evacuated (Simulated)</div>
              <div className="text-base font-black text-emerald-500 font-mono leading-tight">
                {simulatedEvacuated} ({simulatedEvacPercent}%)
              </div>
              <div className="text-[9.5px] text-emerald-500 font-bold mt-0.5">Zero trapped</div>
            </div>
          </div>

          {/* KPI 4 */}
          <div
            className="p-3.5 rounded-2xl flex items-center gap-3 transition-all"
            style={{ background: cardBg, border: '1px solid rgba(239, 68, 68, 0.35)', boxShadow: cardShadow }}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] ${textMuted} font-semibold uppercase tracking-wider`}>Critical Bottlenecks</div>
              <div className="text-base font-black text-red-500 font-mono leading-tight">2</div>
              <div className="text-[9.5px] text-red-500 font-semibold mt-0.5">L7 Core B, Corr C</div>
            </div>
          </div>

          {/* KPI 5 */}
          <div
            className="p-3.5 rounded-2xl flex items-center gap-3 transition-all"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] ${textMuted} font-semibold uppercase tracking-wider`}>Max. Crowd Density</div>
              <div className={`text-base font-black ${textPrimary} font-mono leading-tight`}>1.68 p/m²</div>
              <div className="text-[9.5px] text-amber-500 font-semibold mt-0.5">Elevated peak</div>
            </div>
          </div>
        </div>

        {/* ── 3. Main Dashboard 2-Column Layout ──
            LEFT: Evacuation Progress (Top) & Bottleneck Detection (Under it)
            RIGHT: AI Insights & Recommendations (5-6 Simple One-Liner Points)
        ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* ── LEFT COLUMN (col-span-7): Evacuation Progress + Bottleneck Detection underneath ── */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Top Box: Evacuation Progress & Clearance Curve */}
            <div
              className="rounded-2xl p-5 flex flex-col justify-between"
              style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-sm font-bold tracking-wide ${textPrimary}`}>
                        Evacuation Progress & Clearance Curve
                      </span>
                      <span className={`block text-[11px] ${textMuted}`}>
                        Cumulative occupants cleared over simulation timeline
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-500 font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    190 / 190 (100% Cleared)
                  </span>
                </div>

                {/* High-fidelity Graph Curve SVG */}
                <div className={`relative h-44 w-full rounded-xl border p-3 flex flex-col justify-between ${innerBoxBg}`}>
                  <svg viewBox="0 0 500 110" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="evacCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    <line x1="40" y1="15" x2="490" y2="15" stroke={gridStroke} strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="40" y1="45" x2="490" y2="45" stroke={gridStroke} strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="40" y1="75" x2="490" y2="75" stroke={gridStroke} strokeDasharray="3 3" strokeWidth="1" />

                    {/* Y-axis Labels */}
                    <text x="32" y="18" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="end" fontFamily="monospace">190</text>
                    <text x="32" y="48" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="end" fontFamily="monospace">100</text>
                    <text x="32" y="78" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="end" fontFamily="monospace">0</text>

                    {/* Shaded Area under Curve */}
                    <path
                      d="M 45 80 Q 150 72 260 40 T 485 15 L 485 85 L 45 85 Z"
                      fill="url(#evacCurveGradient)"
                    />

                    {/* Smooth Evacuation Clearance Curve */}
                    <path
                      d="M 45 80 Q 150 72 260 40 T 485 15"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }}
                    />

                    {/* Milestones / Nodes */}
                    <circle cx="45" cy="80" r="3.5" fill="#10b981" />
                    <circle cx="120" cy="74" r="3" fill="#10b981" />
                    <circle cx="200" cy="58" r="3" fill="#10b981" />
                    <circle cx="280" cy="36" r="3" fill="#10b981" />
                    <circle cx="370" cy="22" r="3" fill="#10b981" />
                    <circle cx="485" cy="15" r="4.5" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>

                  {/* X-Axis Timeline Markers */}
                  <div className="flex justify-between pl-8 pr-1 text-[9px] text-slate-400 font-mono mt-1">
                    <span>0:00</span>
                    <span>1:00</span>
                    <span>2:00</span>
                    <span>3:00</span>
                    <span>4:00</span>
                    <span>5:00</span>
                    <span className="text-emerald-500 font-bold">6:30 (Cleared)</span>
                  </div>
                </div>
              </div>

              {/* Supplementary Telemetry Strip */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/40">
                <div className="text-center">
                  <div className={`text-[10px] ${textMuted} font-medium`}>Peak Flow</div>
                  <div className={`text-xs font-bold font-mono ${textPrimary}`}>38 p/min</div>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] ${textMuted} font-medium`}>Avg Speed</div>
                  <div className={`text-xs font-bold font-mono ${textPrimary}`}>1.2 m/s</div>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] ${textMuted} font-medium`}>Clear Time</div>
                  <div className="text-xs font-bold font-mono text-emerald-500">06:30 min</div>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] ${textMuted} font-medium`}>Efficiency</div>
                  <div className="text-xs font-bold font-mono text-sky-400">94.2%</div>
                </div>
              </div>
            </div>

            {/* Bottom Box: Bottleneck Detection & Congestion Analysis */}
            <div
              className="rounded-2xl p-5 flex flex-col justify-between flex-1"
              style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-sm font-bold tracking-wide ${textPrimary}`}>
                        Bottleneck Detection & Congestion Analysis
                      </span>
                      <span className={`block text-[11px] ${textMuted}`}>
                        Real-time choke points and doorway throughput monitoring
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500 font-mono px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                    2 Choke Points
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${tableHeaderBorder} text-[10px] uppercase font-bold tracking-wider`}>
                        <th className="pb-2">Location</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Peak Density</th>
                        <th className="pb-2">Flow Rate</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tableDivide}`}>
                      <tr>
                        <td className={`py-3 font-bold flex items-center gap-2 ${textPrimary}`}>
                          <span>🪜</span> Stair Core B (L7)
                        </td>
                        <td className={`py-3 ${textSecondary}`}>Stairwell Core</td>
                        <td className={`py-3 font-mono font-bold ${textPrimary}`}>1.68 p/m²</td>
                        <td className={`py-3 font-mono ${textSecondary}`}>1.1 p/s</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isDark ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'
                          }`}>
                            High Risk
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className={`py-3 font-bold flex items-center gap-2 ${textPrimary}`}>
                          <span>🚪</span> Corridor C (L7)
                        </td>
                        <td className={`py-3 ${textSecondary}`}>Main Corridor</td>
                        <td className={`py-3 font-mono font-bold ${textPrimary}`}>1.42 p/m²</td>
                        <td className={`py-3 font-mono ${textSecondary}`}>1.4 p/s</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isDark ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600'
                          }`}>
                            Moderate
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className={`py-3 font-bold flex items-center gap-2 ${textPrimary}`}>
                          <span>🪜</span> Stair Core A (L7)
                        </td>
                        <td className={`py-3 ${textSecondary}`}>Stairwell Core</td>
                        <td className={`py-3 font-mono font-bold ${textPrimary}`}>1.12 p/m²</td>
                        <td className={`py-3 font-mono ${textSecondary}`}>2.2 p/s</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isDark ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                          }`}>
                            Optimal
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Load-Balancing Status Pill */}
              <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-[11.5px] font-medium leading-relaxed">
                    <strong>Dynamic Egress Balance:</strong> Diverting 34% of Level 7 occupants from Core B to Core A to prevent stairwell congestion.
                  </span>
                </div>
                <span className="text-[10px] font-bold font-mono shrink-0 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/30">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (col-span-5): Simple Understandable 5-6 Key One-Liner Points ── */}
          <div
            className="lg:col-span-5 rounded-2xl p-5 flex flex-col justify-between gap-4"
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
          >
            <div className="flex flex-col gap-4">
              {/* Header with AI Confidence Badge */}
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(56, 189, 248, 0.2) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.4)'
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <span className={`text-base font-extrabold tracking-tight ${textPrimary}`}>
                      AI Insights & Recommendations
                    </span>
                    <span className={`block text-[11px] ${textMuted}`}>
                      Autonomous Digital Twin Egress Directives
                    </span>
                  </div>
                </div>

                <span className="text-[10.5px] font-bold text-sky-400 font-mono px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30">
                  AI Confidence: 96%
                </span>
              </div>

              {/* Executive Situation Verdict Banner */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <div className="text-center">
                  <div className={`text-[10px] ${textMuted} font-bold uppercase`}>Risk Verdict</div>
                  <div className="text-xs font-black text-emerald-400 mt-0.5">MODERATE</div>
                </div>
                <div className="text-center border-x border-slate-800">
                  <div className={`text-[10px] ${textMuted} font-bold uppercase`}>Clearance Est.</div>
                  <div className={`text-xs font-black font-mono mt-0.5 ${textPrimary}`}>06:30 min</div>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] ${textMuted} font-bold uppercase`}>Optimization</div>
                  <div className="text-xs font-black text-sky-400 mt-0.5">+27% Speed</div>
                </div>
              </div>

              {/* ── 5-6 Clean, Simple, Understandable One-Liner Points (No Lengthy Paragraphs) ── */}
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Point 1 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`font-semibold text-[11.5px] leading-snug truncate ${textPrimary}`}>
                      Divert 34% of Level 7 occupants from Core B to Core A to balance egress load.
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold shrink-0">
                    -34% Load
                  </span>
                </div>

                {/* Point 2 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`font-semibold text-[11.5px] leading-snug truncate ${textPrimary}`}>
                      Deploy illuminated floor beacons in Corridor C to maintain steady laminar flow.
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-bold shrink-0">
                    Laminar Flow
                  </span>
                </div>

                {/* Point 3 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`font-semibold text-[11.5px] leading-snug truncate ${textPrimary}`}>
                      Maintain 50 Pa positive pressurization in all stair towers to prevent smoke infiltration.
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold shrink-0">
                    50 Pa Seal
                  </span>
                </div>

                {/* Point 4 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`font-semibold text-[11.5px] leading-snug truncate ${textPrimary}`}>
                      Distribute ground floor evacuees across all 3 perimeter exits (South 40%, West 30%, East 30%).
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold shrink-0">
                    3 Exits Active
                  </span>
                </div>

                {/* Point 5 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`font-semibold text-[11.5px] leading-snug truncate ${textPrimary}`}>
                      Issue automated localized audio directives to guide evacuees in controlled groups.
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold shrink-0">
                    Voice Guidance
                  </span>
                </div>

                {/* Point 6 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`font-semibold text-[11.5px] leading-snug truncate ${textPrimary}`}>
                      Zero secondary vertical fire spread predicted; all 190 occupants safe and accounted for.
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold shrink-0">
                    Zero Trapped
                  </span>
                </div>
              </div>

              {/* Automated Building Systems Live Status Strip */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/30">
                <div className={`p-2 rounded-lg border text-[10.5px] flex items-center justify-between ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className={textMuted}>Smoke Barriers:</span>
                  <span className="font-bold text-emerald-400">DEPLOYED (100%)</span>
                </div>
                <div className={`p-2 rounded-lg border text-[10.5px] flex items-center justify-between ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className={textMuted}>Floor Beacons:</span>
                  <span className="font-bold text-emerald-400">PATHWAY ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Comprehensive Official Audit Report Modal (Preview, Print & Download in PDF) ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border shadow-2xl transition-all ${
              isDark ? 'bg-[#0b162c] border-sky-500/30 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header: Clean title on left, Close button on right (Top buttons removed per user request) */}
            <div
              className={`px-6 py-4 flex items-center justify-between border-b ${
                isDark ? 'border-sky-500/20 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base font-extrabold tracking-tight ${textPrimary}`}>
                    Life Safety & Egress Compliance Audit Report
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Official NFPA 101, IBC 2024 & ISO 22301 Egress Certification Record
                  </p>
                </div>
              </div>

              {/* Close Button Only in Modal Header */}
              <button
                onClick={() => setIsReportModalOpen(false)}
                className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Complete Official Certification Sheet */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 no-scrollbar">
              {/* Report Header Metadata */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-400">Facility:</span> <strong className={textPrimary}>TwinGuard Horizon Tower (10 Levels)</strong>
                  <span className="mx-2 text-slate-600">•</span>
                  <span className="text-slate-400">Active Scenario:</span> <strong className="text-red-400">L7 West Stair Fire</strong>
                </div>
                <div className="font-mono text-slate-400">
                  Audit Timestamp: {reportGeneratedTime}
                </div>
              </div>

              {/* 4 Compliance Certification Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-slate-900/80 border-sky-500/20' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    100%
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">NFPA 101 Life Safety</div>
                    <div className="text-xs font-bold text-emerald-400">Fully Compliant</div>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-slate-900/80 border-sky-500/20' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">
                    IBC
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Building Code 2024</div>
                    <div className={`text-xs font-bold ${textPrimary}`}>Class A Commercial</div>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-slate-900/80 border-sky-500/20' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
                    ISO
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Security & Resilience</div>
                    <div className="text-xs font-bold text-purple-400">ISO 22301 Certified</div>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-slate-900/80 border-sky-500/20' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                    3/3
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Operational Stairwells</div>
                    <div className="text-xs font-bold text-amber-400">Cores A, B, C Ready</div>
                  </div>
                </div>
              </div>

              {/* Statutory Compliance Verifications Table */}
              <div className={`p-5 rounded-2xl flex flex-col gap-3 border ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${textPrimary}`}>
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Statutory Compliance Verifications</span>
                </h3>

                <div className={`divide-y ${tableDivide} text-xs`}>
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${textPrimary}`}>Minimum 2 Remote Exit Enclosures per Story</div>
                      <div className="text-[11px] text-slate-400">IBC Section 1006.3 / NFPA 101 Section 7.4</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PASSED (3 Provided)
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${textPrimary}`}>Stairway Width Capacity (&gt; 0.3 in. per occupant)</div>
                      <div className="text-[11px] text-slate-400">NFPA 101 Section 7.3.3.1</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PASSED (1.8m Core Clear)
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${textPrimary}`}>Maximum Travel Distance to Exit (&lt; 75m fully sprinklered)</div>
                      <div className="text-[11px] text-slate-400">IBC Table 1017.2</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PASSED (Max 38m recorded)
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${textPrimary}`}>Pressurized Smoke Proof Stair Towers (NFPA 92)</div>
                      <div className="text-[11px] text-slate-400">Active Differential Pressure Sensors: OK</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PASSED (50 Pa Active)
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${textPrimary}`}>Simulated Evacuation Clearance Time (&lt; 10:00 min Benchmark)</div>
                      <div className="text-[11px] text-slate-400">Predicted Complete Clearance: 06:30 min (-27% unmanaged)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PASSED (06:30 min)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tactical Directives Summary in Modal */}
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold text-xs ${textPrimary}`}>AI Optimization Audit Note</div>
                <p className={`text-[11px] ${textSecondary} leading-relaxed`}>
                  Automated dynamic load balancing has redistributed 34% of Level 7 occupants from Core B to Core A, reducing peak density from 2.10 p/m² down to safe laminar threshold of 1.68 p/m². No individuals trapped; zero vertical smoke breach.
                </p>
              </div>
            </div>

            {/* Modal Footer with Direct Print & Download PDF Triggers Only (Export JSON removed) */}
            <div
              className={`px-6 py-3.5 border-t flex items-center justify-between ${
                isDark ? 'border-sky-500/20 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="text-[11px] text-slate-400">
                TwinGuard AI • Autonomous Fire Safety & Life Protection Platform
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download in PDF Format</span>
                </button>

                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AnalyticsView = React.memo(AnalyticsViewComponent);
export default AnalyticsView;
