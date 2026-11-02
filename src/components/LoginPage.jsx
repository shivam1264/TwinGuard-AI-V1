import React, { useState } from 'react';
import {
  ArrowRight,
  Activity,
  Building2,
  ChartNoAxesColumnIncreasing,
  Eye,
  EyeOff,
  Layers3,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck
} from 'lucide-react';

export const DEMO_LOGIN = {
  email: 'demo@twinguard.ai',
  password: 'TwinGuard2026!'
};

export function LoginPage({ onAuthenticate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCredentials = async (credentials) => {
    setIsSubmitting(true);
    setError('');
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    const accepted = onAuthenticate?.({ ...credentials, rememberMe });
    if (!accepted) {
      setError('Email or password is incorrect. Use the demo access shown below.');
    }
    setIsSubmitting(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitCredentials({ email: email.trim(), password });
  };

  const fillDemoAccess = () => {
    setEmail(DEMO_LOGIN.email);
    setPassword(DEMO_LOGIN.password);
    setError('');
  };

  return (
    <main
      className="login-page relative h-[100dvh] overflow-hidden bg-[#edf3fa] text-[#0b1b42] selection:bg-cyan-200"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 12% 24%, rgba(88, 200, 255, .24) 0%, transparent 32%), radial-gradient(ellipse at 84% 16%, rgba(255, 255, 255, .92) 0%, transparent 34%), radial-gradient(ellipse at 78% 82%, rgba(100, 166, 255, .18) 0%, transparent 36%), linear-gradient(140deg, #eaf2fb 0%, #f6f8fc 48%, #e9f2fc 100%)'
      }}
    >
      <div className="login-ambient pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-28 top-[8%] h-[26rem] w-[26rem] rounded-full bg-[#67c7ff]/25 blur-[100px]" />
        <span className="absolute right-[8%] top-[-15rem] h-[34rem] w-[34rem] rounded-full bg-white/90 blur-[110px]" />
        <span className="absolute bottom-[-17rem] right-[27%] h-[32rem] w-[32rem] rounded-full bg-[#9acbff]/30 blur-[110px]" />
        <span className="absolute bottom-[-18rem] left-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#55d7ed]/18 blur-[110px]" />
      </div>
      <div className="relative mx-auto grid h-full min-h-0 w-full max-w-[1680px] grid-cols-1 p-3 sm:p-4 lg:p-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(470px,0.82fr)]">
        <section className="relative hidden min-h-0 flex-col overflow-hidden px-8 pb-5 pt-5 sm:px-10 lg:flex xl:px-12" aria-label="TwinGuard platform overview">
          <div className="relative z-10 flex w-fit items-center gap-5">
            <span className="login-brand-mark flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[22px] border border-white/75 bg-white/45 shadow-[0_12px_28px_rgba(18,92,165,.12)] ring-1 ring-white/70 backdrop-blur-2xl">
              <img src="/assets/branding/twinguard-logo.png" alt="" className="h-[70px] w-[70px] object-contain" />
            </span>
            <span className="block">
              <span className="block whitespace-nowrap text-[clamp(2rem,3.1vw,2.9rem)] font-extrabold leading-none tracking-[-0.055em] text-[#0b1b42]">
                TWINGUARD <span className="text-[#0868ef]">AI</span>
              </span>
              <span className="mt-2.5 block text-[clamp(1rem,1.55vw,1.25rem)] font-medium tracking-[-0.025em] text-[#5e7194]">
                Digital Twin Command Platform
              </span>
            </span>
          </div>

          <div className="login-tagline relative z-10 mt-6 w-fit rounded-r-2xl border border-l-[3px] border-white/70 border-l-[#0878f9] bg-white/38 py-3 pl-5 pr-7 text-[clamp(1rem,1.35vw,1.15rem)] font-medium leading-[1.55] tracking-[-0.02em] text-[#354b6c] shadow-[0_12px_30px_rgba(35,82,135,.07)] backdrop-blur-xl">
            <p>Smarter decisions.</p>
            <p>Safer buildings.</p>
            <p className="font-semibold text-[#234c7d]">A connected future.</p>
          </div>

          <img
            src="/assets/branding/digital-twin-building-features.png"
            alt=""
            aria-hidden="true"
            className="login-hero-image pointer-events-none absolute left-[20%] top-[22%] z-[1] h-[56%] w-[61%] object-contain drop-shadow-[0_20px_30px_rgba(8,91,180,.12)]"
          />

          <div className="login-feature-callouts pointer-events-none absolute inset-0 z-10">
            <div className="login-callout absolute left-2 top-[43%] rounded-2xl border border-white/70 bg-white/48 px-4 py-3 shadow-[0_12px_30px_rgba(31,89,149,.12)] backdrop-blur-xl xl:left-4">
              <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-[#0878f9]"/><span className="text-[13px] font-bold leading-tight text-[#14284a]">Safety<br/><span className="font-medium text-[#5e7194]">&amp; Risk Alerts</span></span></div>
            </div>
            <div className="login-callout absolute right-[4%] top-[31%] rounded-2xl border border-white/70 bg-white/48 px-4 py-3 shadow-[0_12px_30px_rgba(31,89,149,.12)] backdrop-blur-xl">
              <div className="flex items-center gap-3"><Activity className="h-7 w-7 text-[#0878f9]"/><span className="text-[13px] font-bold leading-tight text-[#14284a]">Real-time<br/><span className="font-medium text-[#5e7194]">Monitoring</span></span></div>
            </div>
            <div className="login-callout absolute bottom-[29%] left-2 rounded-2xl border border-white/70 bg-white/48 px-4 py-3 shadow-[0_12px_30px_rgba(31,89,149,.12)] backdrop-blur-xl xl:left-4">
              <div className="flex items-center gap-3"><Leaf className="h-7 w-7 text-[#10b99d]"/><span className="text-[13px] font-bold leading-tight text-[#14284a]">Efficient<br/><span className="font-medium text-[#5e7194]">Evacuation</span></span></div>
            </div>
            <div className="login-callout absolute bottom-[39%] right-[1%] rounded-2xl border border-white/70 bg-white/48 px-4 py-3 shadow-[0_12px_30px_rgba(31,89,149,.12)] backdrop-blur-xl">
              <div className="flex items-center gap-3"><Layers3 className="h-7 w-7 text-[#0878f9]"/><span className="text-[13px] font-bold leading-tight text-[#14284a]">Digital Twin<br/><span className="font-medium text-[#5e7194]">Simulation</span></span></div>
            </div>
          </div>

          <div className="login-side-features relative z-10 mt-auto grid grid-cols-4 gap-2 pb-3 pt-4 text-center text-[11px] font-medium leading-tight text-[#18355f]">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/65 bg-white/35 px-2 py-3 shadow-[0_8px_20px_rgba(35,82,135,.05)] backdrop-blur-lg"><ShieldCheck className="h-6 w-6 text-[#0878f9]"/>Situational<br/>Awareness</div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/65 bg-white/35 px-2 py-3 shadow-[0_8px_20px_rgba(35,82,135,.05)] backdrop-blur-lg"><ChartNoAxesColumnIncreasing className="h-6 w-6 text-[#0878f9]"/>Predictive<br/>Insights</div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/65 bg-white/35 px-2 py-3 shadow-[0_8px_20px_rgba(35,82,135,.05)] backdrop-blur-lg"><Layers3 className="h-6 w-6 text-[#0878f9]"/>Multi-Hazard<br/>Simulation</div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/65 bg-white/35 px-2 py-3 shadow-[0_8px_20px_rgba(35,82,135,.05)] backdrop-blur-lg"><MapPin className="h-6 w-6 text-[#0878f9]"/>Optimized<br/>Evacuation</div>
          </div>
        </section>

        <section id="login" className="relative flex h-full min-h-0 items-center justify-center px-4 py-3 sm:px-8 sm:py-4 lg:px-8">
          <div className="login-card relative max-h-full w-full max-w-[570px] overflow-y-auto rounded-[28px] border border-white/75 border-t-[3px] border-t-[#18a9f0] bg-white/58 px-5 py-4 shadow-[0_30px_90px_rgba(14,69,136,0.16)] ring-1 ring-white/40 backdrop-blur-2xl sm:px-8 sm:py-5 lg:px-9">
            <div className="mb-4 flex flex-col items-center text-center">
              <img src="/assets/branding/twinguard-logo.png" alt="" className="login-card-mark h-[58px] w-[58px] object-contain" />
              <h1 className="mt-0.5 text-[25px] font-black leading-none tracking-[-0.035em] text-[#0b1b42]">
                TWINGUARD <span className="text-[#0868ef]">AI</span>
              </h1>
              <p className="mt-1 text-[12px] font-medium tracking-[0.01em] text-[#687b9b]">Digital Twin Command Platform</p>
            </div>

            <div className="mb-4">
              <h2 className="text-[26px] font-bold tracking-[-0.035em] text-[#101d3c]">Welcome back</h2>
              <p className="mt-0.5 text-[13px] text-[#7182a0]">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="flex h-[50px] items-center gap-3 rounded-[14px] border border-white/80 bg-white/48 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition focus-within:border-[#1c85f5] focus-within:bg-white/72 focus-within:ring-4 focus-within:ring-blue-100">
                <Mail className="h-5 w-5 shrink-0 text-[#50688e]" aria-hidden="true" />
                <span className="sr-only">Email address</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  placeholder="Email address"
                  className="h-full w-full bg-transparent text-[15px] text-[#172849] outline-none placeholder:text-[#8494ae]"
                  required
                />
              </label>

              <label className="flex h-[50px] items-center gap-3 rounded-[14px] border border-white/80 bg-white/48 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition focus-within:border-[#1c85f5] focus-within:bg-white/72 focus-within:ring-4 focus-within:ring-blue-100">
                <LockKeyhole className="h-5 w-5 shrink-0 text-[#50688e]" aria-hidden="true" />
                <span className="sr-only">Password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  placeholder="Password"
                  className="h-full w-full bg-transparent text-[15px] text-[#172849] outline-none placeholder:text-[#8494ae]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="rounded-md p-1 text-[#50688e] hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </label>

              <div className="flex items-center gap-3 py-0.5 text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-[#314767]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-[18px] w-[18px] rounded border-[#b7c9df] accent-[#0868ef] focus:ring-2 focus:ring-blue-400"
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" onClick={fillDemoAccess} className="ml-auto text-[13px] font-medium text-[#0868ef] hover:underline">Demo access</button>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[15px] bg-gradient-to-r from-[#08b5eb] to-[#0861f5] text-[16px] font-bold text-white shadow-[0_10px_22px_rgba(0,112,238,0.22)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in…' : 'Login'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>

            <div className="my-3 flex items-center gap-3 text-[10px] font-semibold tracking-[0.11em] text-[#7c8eaa]" aria-hidden="true">
              <span className="h-px flex-1 bg-[#d5e0ee]" />
              <span>OR</span>
              <span className="h-px flex-1 bg-[#d5e0ee]" />
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitCredentials(DEMO_LOGIN)}
              className="login-demo-fill flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/80 bg-white/52 text-[13px] font-semibold text-[#14284a] shadow-[inset_0_1px_0_rgba(255,255,255,.9)] transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-70"
            >
              <Building2 className="h-4 w-4 text-[#0878ee]"/> Continue with demo access
            </button>

            <p className="mt-2 text-center text-[10px] text-[#7182a0]">Demo: <span className="select-text font-semibold">{DEMO_LOGIN.email}</span> · <span className="select-text font-semibold">{DEMO_LOGIN.password}</span></p>

            <p className="mt-2 text-center text-[10px] leading-relaxed text-[#8492a9]">
              Demo sign-in is stored in this browser only. It is not production authentication.
            </p>
          </div>
        </section>
      </div>
      <style>{`
        .login-page, .login-page input, .login-page button {
          font-family: "Times New Roman", Times, serif;
        }
        @keyframes login-card-enter {
          from { opacity: 0; transform: translate3d(0, 20px, 0) scale(.985); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes login-brand-enter {
          from { opacity: 0; transform: translate3d(-16px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes login-tagline-enter {
          from { opacity: 0; transform: translate3d(0, 12px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes login-callout-enter {
          from { opacity: 0; transform: translate3d(0, 12px, 0) scale(.97); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes login-gentle-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -4px, 0); }
        }
        .login-card { animation: login-card-enter .75s cubic-bezier(.2,.75,.25,1) both; }
        .login-brand-mark { animation: login-brand-enter .7s cubic-bezier(.2,.75,.25,1) both, login-gentle-float 6s ease-in-out 1s infinite; }
        .login-tagline { animation: login-tagline-enter .65s ease-out .2s both; }
        .login-hero-image { animation: login-tagline-enter .9s ease-out .25s both; }
        .login-card-mark { animation: login-gentle-float 5.5s ease-in-out .8s infinite; }
        .login-callout { opacity: 0; animation: login-callout-enter .6s cubic-bezier(.2,.75,.25,1) both, login-gentle-float 7s ease-in-out 1.2s infinite; }
        .login-callout:nth-child(1) { animation-delay: .22s, 1.2s; }
        .login-callout:nth-child(2) { animation-delay: .34s, 1.5s; }
        .login-callout:nth-child(3) { animation-delay: .46s, 1.8s; }
        .login-callout:nth-child(4) { animation-delay: .58s, 2.1s; }
        .login-side-features > div { animation: login-tagline-enter .65s ease-out both; }
        .login-side-features > div:nth-child(1) { animation-delay: .35s; }
        .login-side-features > div:nth-child(2) { animation-delay: .45s; }
        .login-side-features > div:nth-child(3) { animation-delay: .55s; }
        .login-side-features > div:nth-child(4) { animation-delay: .65s; }
        @media (prefers-reduced-motion: reduce) {
          .login-card, .login-brand-mark, .login-tagline, .login-card-mark, .login-hero-image,
          .login-callout, .login-side-features > div { animation: none !important; opacity: 1 !important; }
        }
        .login-page input:not([type="checkbox"]) {
          background-color: transparent !important;
          color: #172849 !important;
          color-scheme: light;
        }
        .theme-dark .login-page button.login-demo-fill,
        .theme-light .login-page button.login-demo-fill {
          background-color: #ffffff !important;
          color: #0868ef !important;
        }
        .theme-dark .login-page button.login-demo-fill:hover,
        .theme-light .login-page button.login-demo-fill:hover {
          background-color: #eff6ff !important;
        }
        @media (max-width: 1023px) {
          .login-page { background-position: 34% center !important; }
        }
        @media (max-height: 680px) and (max-width: 1023px) {
          .login-feature-callouts, .login-side-features { display: none; }
          .login-card { padding: 10px 16px; }
          .login-card > div:first-child { margin-bottom: 8px; }
          .login-card > div:first-child img { width: 42px; height: 42px; }
          .login-card > div:first-child h1 { font-size: 21px; }
          .login-card > div:first-child p { display: none; }
          .login-card > div:nth-of-type(2) { margin-bottom: 8px; }
          .login-card > div:nth-of-type(2) h2 { font-size: 21px; }
          .login-card > div:nth-of-type(2) p { display: none; }
          .login-card form { gap: 8px; }
          .login-card form > :not([hidden]) ~ :not([hidden]) { margin-top: 0; }
          .login-card form label { height: 42px; }
          .login-card form button[type="submit"] { height: 44px; }
          .login-card > div:nth-of-type(3) { display: none; }
          .login-card > div:nth-of-type(4) { padding: 8px; }
          .login-card > div:nth-of-type(4) button { height: 30px; margin-top: 6px; }
          .login-card > p:last-child { display: none; }
        }
        @media (max-height: 680px) and (min-width: 1024px) {
          .login-feature-callouts, .login-side-features { display: none; }
          .login-card { padding-top: 12px; padding-bottom: 12px; }
          .login-card > div:first-child { margin-bottom: 8px; }
          .login-card > div:first-child img { width: 40px; height: 40px; }
          .login-card > div:first-child h1 { font-size: 20px; }
          .login-card > div:first-child p { display: none; }
          .login-card > div:nth-of-type(2) { margin-bottom: 8px; }
          .login-card > div:nth-of-type(2) h2 { font-size: 21px; }
          .login-card > div:nth-of-type(2) p { display: none; }
          .login-card form { gap: 8px; }
          .login-card form > :not([hidden]) ~ :not([hidden]) { margin-top: 0; }
          .login-card form label { height: 40px; }
          .login-card form button[type="submit"] { height: 42px; }
          .login-card > div:nth-of-type(3) { display: none; }
          .login-card > div:nth-of-type(4) { padding: 8px; }
          .login-card > div:nth-of-type(4) button { margin-top: 6px; }
          .login-card > p:last-child { display: none; }
        }
      `}</style>
    </main>
  );
}
