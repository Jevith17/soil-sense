import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { 
  Search, 
  BookOpen, 
  Cpu, 
  Layers, 
  Activity, 
  Sliders, 
  ShieldCheck, 
  Power, 
  FlaskConical, 
  BarChart3, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Wrench,
  Scale
} from 'lucide-react';
import { SoilSenseLogo } from '@/components/ui/SoilSenseLogo';
import { searchDocs, DOC_CATEGORIES } from '@/lib/docsData';

export default function DocsPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setSearchResults(searchDocs(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const architectureBlocks = [
    { num: '01', title: 'Sensors + ESP32', href: '/docs/hardware/overview', caption: 'Matric potential & comparator ADC sampling' },
    { num: '02', title: 'Telemetry Validation', href: '/docs/operating/sensor-health', caption: 'Pre-inference bounds & flatline detection' },
    { num: '03', title: 'Process Balances', href: '/docs/operating/process-intelligence', caption: 'Water & Nitrogen transport phenomena' },
    { num: '04', title: 'Random Forest AI', href: '/docs/models/random-forest', caption: '100-tree ensemble estimation' },
    { num: '05', title: 'Operating Decision', href: '/docs/operating/decisions', caption: 'Prescriptions with transparent WHY' },
    { num: '06', title: 'Human Approval Gate', href: '/docs/operating/smart-control', caption: 'Mandatory operator authorization' },
    { num: '07', title: 'Relay & 12V Pump', href: '/docs/hardware/relay-pump', caption: '15-min capped hardware actuation' },
    { num: '08', title: 'Closed-Loop Trial', href: '/docs/operating/experiments', caption: 'Post-actuation equilibrium logging' },
    { num: '09', title: 'Model Calibration', href: '/docs/models/retraining', caption: 'Dynamic estimator weight updates' },
  ];

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 font-sans selection:bg-forest-100 selection:text-forest-900">
      <Head>
        <title>SoilSense Documentation — Operating Manual & Technical Handbook</title>
        <meta 
          name="description" 
          content="Everything you need to understand, operate and integrate the SoilSense process intelligence platform." 
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="h-16 bg-white border-b border-stone-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <SoilSenseLogo size="sm" variant="light" />
          </Link>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
            OFFICIAL MANUAL v1.2
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <Link 
            href="/home" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-forest-800 hover:bg-forest-900 text-white transition-colors"
          >
            <span>Open Console</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/" className="text-stone-500 hover:text-stone-800 transition-colors hidden sm:block">
            Public Website
          </Link>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="py-16 md:py-20 border-b border-stone-200 bg-[#f7f5ef] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-200 text-[10px] font-mono font-semibold uppercase tracking-wider">
            <span>SOILSENSE TECHNICAL ARCHIVE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900 font-sans">
            SoilSense Documentation
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
            Everything you need to understand, operate, wire, and integrate the SoilSense process intelligence and hardware control platform.
          </p>

          {/* Large Hero Search Box */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search operating procedures, pinouts, algorithms, or API endpoints..."
                className="w-full bg-white border border-stone-300 rounded-lg pl-10 pr-4 py-3 text-xs text-stone-900 placeholder-stone-400 outline-none focus:border-forest-700 shadow-xs font-mono transition-colors"
              />
            </div>

            {/* Instant Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-300 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 divide-y divide-stone-100 text-left font-mono text-xs">
                {searchResults.map((res) => (
                  <Link
                    key={res.path}
                    href={res.path}
                    className="block p-3.5 hover:bg-stone-50 transition-colors"
                  >
                    <div className="text-[10px] uppercase font-bold text-forest-800">
                      {res.category}
                    </div>
                    <div className="font-bold text-stone-900 mt-0.5 font-sans text-sm">
                      {res.title}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1 truncate">
                      {res.matchSnippet}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive System Architecture Map */}
      <section className="py-14 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 mb-6 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-forest-800">
                ARCHITECTURE SCHEMATIC
              </span>
              <h2 className="text-xl font-bold tracking-tight text-stone-900 font-sans">
                Interactive System Architecture Map
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Click any block to inspect its technical chapter →
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {architectureBlocks.map((b) => (
              <Link
                key={b.num}
                href={b.href}
                className="bg-stone-50 hover:bg-forest-50/60 border border-stone-200 hover:border-forest-400 rounded p-3 text-center transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-400 group-hover:text-forest-700 block">
                    {b.num}
                  </span>
                  <strong className="text-xs font-bold text-stone-900 mt-1 block font-sans leading-tight">
                    {b.title}
                  </strong>
                </div>
                <p className="text-[10px] text-stone-500 mt-2 leading-tight">
                  {b.caption}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Category Cards Grid */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          {/* Group 1: Getting Started */}
          <div className="space-y-4">
            <div className="border-b border-stone-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest-800">
                01. GETTING STARTED &amp; ONBOARDING
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Foundational concepts and fast-track procedures.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/docs/introduction" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1.5">
                <span className="font-bold text-sm text-stone-900 block font-sans">Introduction</span>
                <p className="text-xs text-stone-600 leading-relaxed">Core thesis, chemical engineering philosophy, and transport loop.</p>
                <span className="text-[11px] font-mono text-forest-800 font-semibold inline-flex items-center gap-1 mt-1">Read chapter →</span>
              </Link>
              <Link href="/docs/system-overview" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1.5">
                <span className="font-bold text-sm text-stone-900 block font-sans">System Architecture</span>
                <p className="text-xs text-stone-600 leading-relaxed">Monorepo structure, FastAPI engines, and embedded firmware.</p>
                <span className="text-[11px] font-mono text-forest-800 font-semibold inline-flex items-center gap-1 mt-1">Read chapter →</span>
              </Link>
              <Link href="/docs/quick-start" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1.5">
                <span className="font-bold text-sm text-stone-900 block font-sans">Quick Start Guide</span>
                <p className="text-xs text-stone-600 leading-relaxed">12-step operator walkthrough from sign-in to closed loop.</p>
                <span className="text-[11px] font-mono text-forest-800 font-semibold inline-flex items-center gap-1 mt-1">Read chapter →</span>
              </Link>
              <Link href="/docs/dashboard-guide" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1.5">
                <span className="font-bold text-sm text-stone-900 block font-sans">Dashboard Navigation</span>
                <p className="text-xs text-stone-600 leading-relaxed">Screen anatomy, freshness clock, and SCADA state tokens.</p>
                <span className="text-[11px] font-mono text-forest-800 font-semibold inline-flex items-center gap-1 mt-1">Read chapter →</span>
              </Link>
            </div>
          </div>

          {/* Group 2: Operating Modules */}
          <div className="space-y-4">
            <div className="border-b border-stone-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest-800">
                02. OPERATING SOILSENSE (ALL 12 SCADA MODULES)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Comprehensive operating guides for each platform capability.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/docs/operating/home" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Home / Command Center</span>
                <p className="text-xs text-stone-600 leading-relaxed">The 5 operational questions, live assessment, and recommendation card.</p>
              </Link>
              <Link href="/docs/operating/live-farm" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Live Farm Telemetry</span>
                <p className="text-xs text-stone-600 leading-relaxed">Multi-variable Recharts graphs, target bands, and trace GHG gases.</p>
              </Link>
              <Link href="/docs/operating/process-intelligence" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Process Intelligence</span>
                <p className="text-xs text-stone-600 leading-relaxed">Transport PFD, coupled phenomena, and dynamic mass balance sliders.</p>
              </Link>
              <Link href="/docs/operating/decisions" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Operating Decisions</span>
                <p className="text-xs text-stone-600 leading-relaxed">The 5 canonical decision states, prescription sizing, and WHY attribution.</p>
              </Link>
              <Link href="/docs/operating/sensor-health" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Sensor Health Diagnostics</span>
                <p className="text-xs text-stone-600 leading-relaxed">6-point diagnostic matrix, bounds, flatline checks, and VERIFY lockout.</p>
              </Link>
              <Link href="/docs/operating/smart-water" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Smart Water &amp; Irrigation</span>
                <p className="text-xs text-stone-600 leading-relaxed">5-stage delivery pipeline, volumetric sizing justification, anti-leaching.</p>
              </Link>
              <Link href="/docs/operating/smart-nutrients" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Smart Nutrients &amp; Fertigation</span>
                <p className="text-xs text-stone-600 leading-relaxed">Three-stage physical gate preventing osmotic scorching and runoff.</p>
              </Link>
              <Link href="/docs/operating/smart-control" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Smart Control &amp; SCADA</span>
                <p className="text-xs text-stone-600 leading-relaxed">6-stage actuation pipeline, manual override, and immutable audit trail.</p>
              </Link>
              <Link href="/docs/operating/what-if" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">What-If Scenario Sandbox</span>
                <p className="text-xs text-stone-600 leading-relaxed">Physical boundary condition sliders and strategy comparison matrix.</p>
              </Link>
              <Link href="/docs/operating/experiments" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Experiment Lab</span>
                <p className="text-xs text-stone-600 leading-relaxed">Scientific notebook, residual error %, and model retraining trigger.</p>
              </Link>
              <Link href="/docs/operating/reports" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Research &amp; Reports</span>
                <p className="text-xs text-stone-600 leading-relaxed">Water conservation accounting, NUE %, carbon offset, and CSV export.</p>
              </Link>
              <Link href="/docs/operating/assistant" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Process Assistant</span>
                <p className="text-xs text-stone-600 leading-relaxed">Technical agronomist dialogue and command intent safety confirmation.</p>
              </Link>
            </div>
          </div>

          {/* Group 3: Hardware & Embedded */}
          <div className="space-y-4">
            <div className="border-b border-stone-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest-800">
                03. HARDWARE &amp; EMBEDDED INTEGRATION
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Wiring schematics, ESP32 pinouts, and Arduino firmware setup.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/docs/hardware/overview" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Hardware Bill of Materials</span>
                <p className="text-xs text-stone-600 leading-relaxed">ESP32, soil sensors, relay module, and 12V submersible pump.</p>
              </Link>
              <Link href="/docs/hardware/wiring" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Wiring Schematic &amp; Pins</span>
                <p className="text-xs text-stone-600 leading-relaxed">GPIO 34 (ADC), GPIO 2 (Comparator), GPIO 23 (Active-LOW Relay).</p>
              </Link>
              <Link href="/docs/hardware/firmware" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Arduino C++ Firmware</span>
                <p className="text-xs text-stone-600 leading-relaxed">Source code configuration, polling intervals, and JSON structure.</p>
              </Link>
              <Link href="/docs/hardware/safety" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Hardware Safety Guidelines</span>
                <p className="text-xs text-stone-600 leading-relaxed">Watchdog timeouts, common ground rules, and safe dry-run mode.</p>
              </Link>
            </div>
          </div>

          {/* Group 4: Developers & Architecture */}
          <div className="space-y-4">
            <div className="border-b border-stone-200 pb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest-800">
                04. DEVELOPER MANUAL &amp; REST API
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">API schemas, database models, simulator scenarios, and local testing.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/docs/developers/api" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">REST API Reference</span>
                <p className="text-xs text-stone-600 leading-relaxed">Endpoints, request bodies, status codes, and JSON schemas.</p>
              </Link>
              <Link href="/docs/developers/database" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Database Schemas</span>
                <p className="text-xs text-stone-600 leading-relaxed">SQLAlchemy models for readings, decisions, actions, experiments.</p>
              </Link>
              <Link href="/docs/developers/simulator" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Telemetry Simulator</span>
                <p className="text-xs text-stone-600 leading-relaxed">Testing 6 multi-variable scenarios without physical hardware.</p>
              </Link>
              <Link href="/docs/developers/local-dev" className="p-4 rounded-lg border border-stone-200 bg-white hover:border-forest-300 hover:shadow-sm transition space-y-1">
                <span className="font-bold text-sm text-stone-900 block font-sans">Local Setup &amp; Tests</span>
                <p className="text-xs text-stone-600 leading-relaxed">Startup commands, 16-test acceptance suite, and Docker Compose.</p>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Docs Footer */}
      <footer className="bg-[#121915] text-stone-400 py-10 border-t border-stone-800 text-xs font-mono">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SoilSenseLogo size="sm" variant="dark" />
            <span className="text-[11px] text-stone-500">Official Operating Handbook</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/" className="hover:text-white">Public Site</Link>
            <Link href="/login" className="hover:text-white text-emerald-400">Operator Login</Link>
            <Link href="/home" className="hover:text-white">SCADA Console</Link>
          </div>

          <div className="text-[11px] text-stone-500">
            System Online • v1.2 Release
          </div>
        </div>
      </footer>
    </div>
  );
}

