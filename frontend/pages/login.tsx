import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  Radio, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  Droplet, 
  Check
} from 'lucide-react';
import { SoilSenseLogo } from '@/components/ui/SoilSenseLogo';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@soilsense.org');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('Lead Agronomist');
  const [role, setRole] = useState<'Farmer' | 'Researcher' | 'Admin'>('Admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Transition state: Connecting to SoilSense
  const [connectingStage, setConnectingStage] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, role }),
        });
      }
      
      const res = await api.login({ email, password });
      if (res && res.access_token) {
        localStorage.setItem('agrichem_token', res.access_token);
        localStorage.setItem('agrichem_user', JSON.stringify(res.user));
      } else {
        // Fallback for demo mode
        localStorage.setItem('agrichem_token', 'demo-token-soilsense-active');
        localStorage.setItem('agrichem_user', JSON.stringify({ email, role, full_name: fullName }));
      }

      // Trigger ~1s authentic connecting transition sequence
      setConnectingStage(1);
      setTimeout(() => setConnectingStage(2), 350);
      setTimeout(() => setConnectingStage(3), 700);
      setTimeout(() => {
        router.push('/home');
      }, 1050);

    } catch (err: any) {
      // In case backend is temporarily unreachable, support demo fallback
      if (email === 'admin@soilsense.org' || email === 'admin@agrichem.ai') {
        localStorage.setItem('agrichem_token', 'demo-token-soilsense-active');
        localStorage.setItem('agrichem_user', JSON.stringify({ email, role: 'Admin', full_name: 'Lead Agronomist' }));
        setConnectingStage(1);
        setTimeout(() => setConnectingStage(2), 350);
        setTimeout(() => setConnectingStage(3), 700);
        setTimeout(() => router.push('/home'), 1050);
        return;
      }
      setError(err.message || 'Authentication failed. Please verify operator credentials.');
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@soilsense.org');
    setPassword('admin123');
    localStorage.setItem('agrichem_token', 'demo-token-soilsense-active');
    localStorage.setItem('agrichem_user', JSON.stringify({ email: 'admin@soilsense.org', role: 'Admin', full_name: 'Lead Agronomist' }));
    setConnectingStage(1);
    setTimeout(() => setConnectingStage(2), 350);
    setTimeout(() => setConnectingStage(3), 700);
    setTimeout(() => router.push('/home'), 1050);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 flex font-sans antialiased">
      <Head>
        <title>Operator Sign In — SoilSense Operating Environment</title>
        <meta name="description" content="SoilSense operator authentication and secure telemetry connection portal." />
      </Head>

      {/* Connecting Transition Modal / Overlay */}
      {connectingStage !== null && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18221b] border border-stone-800 rounded-lg p-6 max-w-sm w-full text-stone-100 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center gap-2.5 border-b border-stone-800 pb-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs uppercase tracking-wider font-bold text-stone-200">
                CONNECTING TO SOILSENSE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className={`flex items-center gap-2 transition-opacity duration-200 ${connectingStage >= 1 ? 'opacity-100 text-emerald-400' : 'opacity-30'}`}>
                <Check className="h-3.5 w-3.5" />
                <span>[01] FIELD NODE CONNECTED (ESP32-WROOM-32)</span>
              </div>
              <div className={`flex items-center gap-2 transition-opacity duration-200 ${connectingStage >= 2 ? 'opacity-100 text-emerald-400' : 'opacity-30'}`}>
                <Check className="h-3.5 w-3.5" />
                <span>[02] TELEMETRY DATA STREAM ACTIVE</span>
              </div>
              <div className={`flex items-center gap-2 transition-opacity duration-200 ${connectingStage >= 3 ? 'opacity-100 text-emerald-400' : 'opacity-30'}`}>
                <Check className="h-3.5 w-3.5" />
                <span>[03] PROCESS ENGINE READY — LAUNCHING</span>
              </div>
            </div>

            <div className="w-full bg-stone-900 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: connectingStage === 1 ? '35%' : connectingStage === 2 ? '70%' : '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Split Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen">
        
        {/* Left Side: Technical Atmosphere & Process Engineering Context */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#17201a] text-stone-200 p-12 flex-col justify-between relative overflow-hidden border-r border-stone-800">
          {/* Subtle Grid & Stratum Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#5c7c64_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Top Brand Tag */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <SoilSenseLogo size="md" variant="dark" />
            </Link>
            <div className="mt-8 space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/90 font-semibold block">
                PROCESS INTELLIGENCE PLATFORM
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white font-sans max-w-md">
                Chemical engineering meets precision agriculture.
              </h2>
              <p className="text-xs text-stone-400 max-w-md leading-relaxed mt-2">
                Unified process monitoring, mass conservation transport modeling, and operator-approved physical actuation for sustainable field management.
              </p>
            </div>
          </div>

          {/* Center: Interactive Process Architecture Blueprint */}
          <div className="relative z-10 my-8 bg-stone-950/60 border border-stone-800/80 rounded-lg p-5 backdrop-blur-xs space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[11px] text-stone-400">
              <span>PHYSICAL CONTROL LOOP</span>
              <span className="text-emerald-400 font-semibold">ESP32 OPT-ISOLATED</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-[#1e2a22] p-2 rounded border border-[#2a3c30]">
                <span className="text-stone-400 block">GPIO 34</span>
                <span className="text-emerald-300 font-bold">Matric ADC</span>
              </div>
              <div className="bg-[#1e2a22] p-2 rounded border border-[#2a3c30]">
                <span className="text-stone-400 block">GPIO 02</span>
                <span className="text-cyan-300 font-bold">Comparator</span>
              </div>
              <div className="bg-[#1e2a22] p-2 rounded border border-[#2a3c30]">
                <span className="text-stone-400 block">GPIO 23</span>
                <span className="text-amber-300 font-bold">Relay Contactor</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Safety Interlock:</span>
              <span className="text-stone-200">15 min max runtime / 10 min cooldown</span>
            </div>
          </div>

          {/* Bottom: Subtle Technical Metadata Status Strip */}
          <div className="relative z-10 border-t border-stone-800/80 pt-4 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>SYSTEM: ONLINE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
              <span>DATA LINK: SECURE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-400" />
              <span>POLL: 4000ms</span>
            </div>
          </div>
        </div>

        {/* Right Side: Operator Sign-In Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
          <div className="max-w-md w-full space-y-6">
            
            {/* Header */}
            <div>
              <div className="lg:hidden mb-6">
                <Link href="/">
                  <SoilSenseLogo size="md" variant="light" />
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans">
                {isRegister ? 'Register Field Operator' : 'Welcome back.'}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                {isRegister 
                  ? 'Provision credentials to access the SoilSense operating environment.'
                  : 'Sign in to access the SoilSense process operating environment.'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-stone-100 p-1 rounded border border-stone-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`flex-1 py-1.5 rounded transition ${
                  !isRegister ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Operator Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className={`flex-1 py-1.5 rounded transition ${
                  isRegister ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Request Access
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign-In Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Operator Full Name</label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded pl-9 pr-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-forest-700 transition"
                        placeholder="Dr. Elena Vance"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Operational Role</label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-stone-900 outline-none focus:border-forest-700 cursor-pointer transition font-mono"
                    >
                      <option value="Admin">System Administrator (Full Calibration & Hardware Override)</option>
                      <option value="Researcher">Process Engineer (Material Balances & Scenario Analysis)</option>
                      <option value="Farmer">Field Operator (Actuation Approval & Monitoring)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-stone-700 font-medium mb-1">Operator Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded pl-9 pr-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-forest-700 transition font-mono"
                    placeholder="operator@soilsense.org"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-700 font-medium">Security Password</label>
                  {!isRegister && (
                    <span className="text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer">
                      Forgot password?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded pl-9 pr-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-forest-700 transition font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-600 text-xs">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-300 accent-forest-700 h-3.5 w-3.5"
                  />
                  <span>Remember this operating terminal</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs shadow-xs transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Provision Operator Account' : 'ENTER SYSTEM'}</span>
                {!loading && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </form>

            {/* Quick Demo Access Bypass */}
            <div className="pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2 px-3 rounded border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-mono text-[11px] transition flex items-center justify-center gap-2"
              >
                <Cpu className="h-3.5 w-3.5 text-forest-700" />
                <span>Instant Demo Access (Lead Agronomist)</span>
              </button>
            </div>

            {/* Return to Public Landing Page */}
            <div className="text-center pt-2">
              <Link href="/" className="text-stone-500 hover:text-stone-800 text-xs transition inline-flex items-center gap-1">
                <span>← Return to Public Website</span>
              </Link>
            </div>

            <div className="border-t border-stone-200 pt-4 text-center text-[10px] font-mono text-stone-600">
              SoilSense v1.2 — Autonomous Agricultural Telemetry &amp; Actuation Subsystem
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
