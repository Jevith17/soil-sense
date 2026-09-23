import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Activity, 
  GitFork, 
  CheckSquare, 
  Droplets, 
  Leaf, 
  HeartPulse, 
  SlidersHorizontal, 
  Power, 
  FlaskConical, 
  BarChart3,
  MessageSquare,
  RefreshCw,
  Sliders,
  ShieldCheck,
  User,
  Settings
} from 'lucide-react';
import { SoilSenseLogo } from '@/components/ui/SoilSenseLogo';
import { api } from '@/lib/api';

const navigationItems = [
  { name: 'Home', href: '/home', icon: LayoutDashboard },
  { name: 'Live Farm', href: '/live', icon: Activity },
  { name: 'Process', href: '/process', icon: GitFork },
  { name: 'Decisions', href: '/decision', icon: CheckSquare },
  { name: 'Smart Water', href: '/water', icon: Droplets },
  { name: 'Smart Nutrients', href: '/nutrients', icon: Leaf },
  { name: 'Sensor Health', href: '/sensors', icon: HeartPulse },
  { name: 'What-If', href: '/what-if', icon: SlidersHorizontal },
  { name: 'Control', href: '/control', icon: Power },
  { name: 'Experiments', href: '/experiments', icon: FlaskConical },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Assistant', href: '/copilot', icon: MessageSquare },
];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await api.retrainModel();
      setRetrainMsg(`Model v${res.model_metadata.version} calibrated.`);
      setTimeout(() => setRetrainMsg(null), 4000);
    } catch (err: any) {
      setRetrainMsg(`Failed: ${err.message}`);
      setTimeout(() => setRetrainMsg(null), 4000);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <aside className="w-56 bg-[#18211b] border-r border-[#243329] flex flex-col justify-between h-screen sticky top-0 select-none shrink-0 z-50 text-stone-200">
      <div>
        {/* Brand Header */}
        <div className="h-14 border-b border-[#243329] flex items-center px-4">
          <Link href="/">
            <SoilSenseLogo />
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="py-3 px-2">
          <div className="px-3 pb-1.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-stone-400">
            Process Monitor
          </div>

          <nav className="space-y-0.5">
            {navigationItems.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-forest-800 text-white font-semibold shadow-xs'
                      : 'text-stone-300 hover:bg-[#202c24] hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-stone-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Instrumentation Diagnostics & Status */}
      <div className="p-3 border-t border-[#243329] bg-[#121915] space-y-2.5 text-xs">
        <div className="space-y-1 text-[11px] font-mono text-stone-400">
          <div className="flex items-center justify-between">
            <span className="text-stone-400">SCADA State:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-400">ESP32 Node:</span>
            <span className="text-stone-300 font-mono">01:34:23</span>
          </div>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-[#202c24] hover:bg-[#28372d] text-stone-300 hover:text-white border border-[#2e3f34] text-[10px] font-mono transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${retraining ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{retraining ? 'Calibrating...' : 'Calibrate Model'}</span>
        </button>

        {retrainMsg && (
          <div className="text-[10px] font-mono text-emerald-300 text-center bg-forest-950 p-1 rounded border border-forest-800">
            {retrainMsg}
          </div>
        )}

        <div className="pt-2 border-t border-[#243329] flex items-center justify-between text-[11px] text-stone-400">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('agrichem_token');
                localStorage.removeItem('agrichem_user');
                router.push('/login');
              }
            }}
            className="hover:text-red-400 transition-colors flex items-center gap-1 font-mono text-[10px]"
            title="Sign out of current operating session"
          >
            <User className="h-3 w-3" />
            <span>Sign Out</span>
          </button>
          <span className="text-[10px] font-mono text-stone-400">v1.2</span>
        </div>
      </div>
    </aside>
  );
};
