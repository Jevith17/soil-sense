import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { 
  ArrowRight, 
  Droplet, 
  Layers, 
  Sun, 
  Activity, 
  ShieldCheck, 
  Power, 
  FlaskConical, 
  CheckCircle2, 
  ChevronRight, 
  Cpu, 
  Scale, 
  Radio, 
  Sliders, 
  AlertTriangle,
  ArrowDown,
  Info,
  Clock
} from 'lucide-react';
import { SoilSenseLogo } from '@/components/ui/SoilSenseLogo';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stages = [
    {
      step: '01',
      title: 'MEASURE',
      subtitle: 'Instrumentation & Hardware Sensing',
      detail: 'Analog matric moisture sensing via ESP32 ADC (GPIO34) and digital comparator validation (GPIO2). Continuous 4000ms sampling across active root strata.',
      metric: 'ADC 2180 → 27.0% Moisture'
    },
    {
      step: '02',
      title: 'VALIDATE',
      subtitle: 'Sensor Health & Signal Diagnostics',
      detail: 'Deterministic pre-inference validation checking physical bounds [0, 100%], sudden transient jumps (>25%), flatline freezing, and analog vs digital contradiction.',
      metric: '6 Diagnostic Checks: PASS'
    },
    {
      step: '03',
      title: 'UNDERSTAND',
      subtitle: 'Process State & Conservation Balances',
      detail: 'Translates raw voltages into agronomic transport phenomena. Quantifies boundary layer evapotranspiration loss and root-zone matric deficit through conservation of mass.',
      metric: 'ΔMw = Win − Wloss (+2.7 L)'
    },
    {
      step: '04',
      title: 'DECIDE',
      subtitle: 'Operating Recommendation & Dosage',
      detail: 'Synthesizes physical state variables through a 100-tree Random Forest estimator to determine actionable prescription: IRRIGATE, FERTIGATE, DO NOTHING, WAIT, or VERIFY.',
      metric: 'Prescription: 12.5 L / 6 min'
    },
    {
      step: '05',
      title: 'APPROVE',
      subtitle: 'Human-in-the-Loop Operator Gate',
      detail: 'Autonomous action is strictly inhibited without explicit sign-off. The operator reviews the technical basis for recommendation and verifies field conditions.',
      metric: 'Operator Sign-Off Required'
    },
    {
      step: '06',
      title: 'CONTROL',
      subtitle: 'Relay Actuation & DC Pump Delivery',
      detail: 'Hardware contactor dispatch via active-LOW relay (GPIO23). Enforces strict hardware safety envelope: 15-minute maximum runtime, 10-minute cool-down, 85% moisture cutoff.',
      metric: 'Relay Closed (12V Pump ON)'
    },
    {
      step: '07',
      title: 'LEARN',
      subtitle: 'Closed-Loop Feedback & Calibration',
      detail: 'Post-actuation sensor observations are automatically compared against model-predicted target responses to log residual error and continually refine estimator weights.',
      metric: 'Residual Error: 3.6% (Recorded)'
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 font-sans selection:bg-forest-100 selection:text-forest-900">
      <Head>
        <title>SoilSense — Process Intelligence for Sustainable Agriculture</title>
        <meta 
          name="description" 
          content="SoilSense connects field measurements, process intelligence and controlled irrigation into one operating system for sustainable agriculture." 
        />
        <meta property="og:title" content="SoilSense — Process Intelligence for Sustainable Agriculture" />
        <meta property="og:description" content="Measure the soil. Understand the process. Operate with confidence." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Top Navigation Bar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled 
            ? 'bg-[#fbfaf7]/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="#top" className="flex items-center gap-2">
            <SoilSenseLogo size="md" variant="light" />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
            <a href="#problem" className="hover:text-stone-900 transition-colors">The Paradigm</a>
            <a href="#process" className="hover:text-stone-900 transition-colors">Process Flow</a>
            <a href="#intelligence" className="hover:text-stone-900 transition-colors">Process Intelligence</a>
            <a href="#instrumentation" className="hover:text-stone-900 transition-colors">Instrumentation</a>
            <a href="#control" className="hover:text-stone-900 transition-colors">Controlled Actuation</a>
            <Link href="/docs" className="hover:text-forest-900 font-semibold text-forest-800 transition-colors flex items-center gap-1">
              Documentation
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login"
              className="text-xs font-medium text-stone-700 hover:text-stone-900 px-3 py-1.5 transition-colors hidden sm:block"
            >
              Operator Sign In
            </Link>
            <Link 
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <span>ENTER SYSTEM</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="pt-32 pb-20 md:pt-40 md:pb-28 border-b border-stone-200 relative overflow-hidden">
        {/* Subtle decorative background strata line */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#d6d3cb_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-mono font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-forest-700 animate-pulse" />
                <span>SOILSENSE / PROCESS INTELLIGENCE &amp; CONTROL</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-900 leading-[1.08] font-sans">
                Understand the soil.<br />
                <span className="text-forest-800 font-serif italic font-normal">Control the process.</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl font-normal">
                SoilSense connects field measurements, coupled mass balance transport phenomena, and controlled irrigation into one operating system for sustainable agriculture.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link 
                  href="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded bg-forest-800 hover:bg-forest-900 text-white font-medium text-sm shadow-sm transition-all"
                >
                  <span>ENTER SOILSENSE</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a 
                  href="#process"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-medium text-sm transition-all"
                >
                  <span>EXPLORE THE ARCHITECTURE</span>
                </a>
              </div>

              {/* Engineering Metrics Strip */}
              <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] uppercase text-stone-600 font-semibold">SAMPLING CYCLE</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">4000 ms</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-stone-600 font-semibold">ESTIMATOR ACCURACY</div>
                  <div className="text-base font-bold text-forest-800 mt-0.5">98.75%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-stone-600 font-semibold">WATER SAVINGS</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">+42.5%</div>
                </div>
              </div>
            </div>

            {/* Right Visual: Process Instrumentation Composition */}
            <div className="lg:col-span-6 relative">
              <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-md relative overflow-hidden">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-forest-700" />
                    <span className="font-bold text-stone-900">ROOT-ZONE PROFILE &amp; TELEMETRY MATRIX</span>
                  </div>
                  <span className="text-[10px] text-stone-600">STATION #ESP32-04</span>
                </div>

                {/* Layered Soil Strata Diagram with Instrumentation Overlays */}
                <div className="space-y-3 font-mono text-xs">
                  {/* Stratum 1: Surface & Atmospheric Boundary */}
                  <div className="p-3 rounded border border-amber-200/80 bg-amber-50/40 relative">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <Sun className="h-3.5 w-3.5 text-amber-700" />
                        ATMOSPHERIC BOUNDARY LAYER (0 cm)
                      </span>
                      <span className="text-amber-800 font-semibold">EVAPORATIVE PULL</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-stone-600 pt-1">
                      <div>Temp: <strong className="text-stone-900">33.2 °C</strong></div>
                      <div>Solar: <strong className="text-stone-900">910 W/m²</strong></div>
                      <div>RH: <strong className="text-stone-900">54%</strong></div>
                    </div>
                  </div>

                  {/* Stratum 2: Active Root Zone */}
                  <div className="p-3.5 rounded border border-forest-200 bg-forest-50/40 relative">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-forest-900 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-forest-700" />
                        ACTIVE ROOT MATRIX (15–35 cm depth)
                      </span>
                      <StatusBadge status="CHECK" label="DEFICIT" size="sm" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      <div className="bg-white p-2 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-600 block uppercase">Soil Moisture</span>
                        <span className="text-base font-bold text-stone-900">27.0 %</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-600 block uppercase">Substrate pH</span>
                        <span className="text-base font-bold text-stone-900">6.45</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-stone-200">
                        <span className="text-[10px] text-stone-600 block uppercase">Available N</span>
                        <span className="text-base font-bold text-stone-900">64 mg/kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Stratum 3: Deep Percolation Subsoil */}
                  <div className="p-3 rounded border border-stone-200 bg-stone-50/80 relative">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-stone-500" />
                        SUB-ROOT SUBSTRATE (35–60 cm depth)
                      </span>
                      <span className="text-forest-700 font-semibold text-[11px]">ANTI-LEACHING GUARD ACTIVE</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-600 pt-1">
                      <span>Soil Retention Capacity Remaining:</span>
                      <span className="font-bold text-stone-900">19.0 Liters</span>
                    </div>
                  </div>
                </div>

                {/* Floating Real-Time Computed Balances Strip */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      <Droplet className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block uppercase">Net Water Balance</span>
                      <strong className="text-forest-800 font-bold">+2.7 L net accumulation</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-600 block uppercase">Recommended Actuation</span>
                    <strong className="text-stone-900 font-bold">IRRIGATE (12.5 L / 6 min)</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: The Problem (Conventional Telemetry vs. Process Intelligence) */}
      <section id="problem" className="py-20 md:py-24 border-b border-stone-200 bg-[#f7f5ef]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
              PARADIGM SHIFT
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              Beyond Simple Monitoring: The Shift to Process Intelligence
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Most agricultural technology stops at graphing disconnected sensor points. SoilSense models the continuous physical process and verifies decisions before actuation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Conventional Agriculture Telemetry */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-bold text-sm text-stone-900 font-mono uppercase tracking-wide">
                  Conventional Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  OPEN-LOOP GUESSWORK
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-stone-600">
                <div className="flex items-center gap-3 p-2 rounded bg-stone-50 border border-stone-200">
                  <span className="h-6 w-6 rounded bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <span>Sensor transmits raw, unvalidated voltage spikes</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-stone-50 border border-stone-200">
                  <span className="h-6 w-6 rounded bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <span>Dashboard displays passive time-series graphs</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-stone-50 border border-stone-200">
                  <span className="h-6 w-6 rounded bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <span>Human operator guesses required water volume</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-stone-50 border border-stone-200">
                  <span className="h-6 w-6 rounded bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0">4</span>
                  <span>Manual valve opening with zero empirical feedback</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-stone-500 italic border-t border-stone-100">
                Result: Chronic over-watering, gravitational runoff, root salt scorching, and fertilizer leaching into groundwater.
              </div>
            </div>

            {/* SoilSense Process Intelligence */}
            <div className="bg-white border border-forest-300 rounded-lg p-6 shadow-xs space-y-4 relative">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-bold text-sm text-forest-900 font-mono uppercase tracking-wide">
                  SoilSense Process Intelligence
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-100 text-forest-800 font-bold border border-forest-200">
                  CLOSED-LOOP CONTROL
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-stone-800">
                <div className="flex items-center gap-3 p-2 rounded bg-forest-50/50 border border-forest-200">
                  <span className="h-6 w-6 rounded bg-forest-800 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <span>Deterministic validation filters flatlining &amp; drift</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-forest-50/50 border border-forest-200">
                  <span className="h-6 w-6 rounded bg-forest-800 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <span>Mass conservation computes exact root matric deficit</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-forest-50/50 border border-forest-200">
                  <span className="h-6 w-6 rounded bg-forest-800 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <span>Random Forest formulates volume &amp; transparent WHY</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-forest-50/50 border border-forest-200">
                  <span className="h-6 w-6 rounded bg-forest-800 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
                  <span>Human sign-off triggers ESP32 relay with 15m safety cut</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-forest-900 font-medium border-t border-stone-100">
                Result: 42.5% cumulative water conservation, 92.4% nutrient uptake efficiency, and zero deep percolation waste.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: The SoilSense Process Flow (Interactive 7 Stages) */}
      <section id="process" className="py-20 md:py-24 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              OPERATING PIPELINE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              The Seven-Stage Execution Protocol
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Every operation follows an unbroken chain from physical sensor sampling to empirical feedback calibration. Select any stage to inspect the technical specification.
            </p>
          </div>

          {/* Interactive Pipeline Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
            {stages.map((stg, idx) => (
              <button
                key={stg.step}
                onClick={() => setActiveStage(idx)}
                className={`p-3 rounded text-left transition-all border font-mono text-xs ${
                  activeStage === idx 
                    ? 'bg-forest-800 text-white border-forest-900 shadow-sm' 
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <div className={`text-[10px] font-bold ${activeStage === idx ? 'text-emerald-300' : 'text-stone-600'}`}>
                  {stg.step}
                </div>
                <div className="font-bold text-sm mt-0.5 font-sans">
                  {stg.title}
                </div>
              </button>
            ))}
          </div>

          {/* Active Stage Technical Detail Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-3 gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-forest-800">
                  STAGE {stages[activeStage].step} SPECIFICATION
                </span>
                <h3 className="text-lg font-bold text-stone-900 font-sans">
                  {stages[activeStage].title} — {stages[activeStage].subtitle}
                </h3>
              </div>
              <div className="text-xs font-mono px-3 py-1 rounded bg-white border border-stone-200 text-stone-800 font-bold self-start sm:self-auto">
                {stages[activeStage].metric}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mt-4">
              {stages[activeStage].detail}
            </p>

            <div className="mt-6 pt-4 border-t border-stone-200/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-stone-600">
                Detailed protocols, mass conservation models, and actuator specifications
              </span>
              <Link
                href="/docs/getting-started/system-overview"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-forest-800 hover:text-forest-900 transition-colors"
              >
                <span>Read Operating Manual</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Process Intelligence & Balances */}
      <section id="intelligence" className="py-20 md:py-24 border-b border-stone-200 bg-[#f7f5ef]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
              MODULE 05 / 06 / 07
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              From Measurements to Process Understanding
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Sensors measure states; chemical engineering models evaluate transport dynamics. Real-time conservation balances determine exact plant requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Water Mass Balance */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    <Droplet className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 font-mono">WATER MASS CONSERVATION</h3>
                </div>
                <span className="text-[11px] font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-700">
                  ΔMw = Win − Wloss
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-stone-50 p-3 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-600 block uppercase">Inflow (Win)</span>
                  <span className="text-lg font-bold text-stone-900">12.5 L</span>
                </div>
                <div className="bg-stone-50 p-3 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-600 block uppercase">Loss (Wloss)</span>
                  <span className="text-lg font-bold text-amber-800">9.8 L</span>
                </div>
                <div className="bg-stone-50 p-3 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-600 block uppercase">Net Storage</span>
                  <span className="text-lg font-bold text-forest-800">+2.7 L</span>
                </div>
              </div>

              <div className="text-xs text-stone-600 font-mono space-y-1.5 pt-2">
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span>Transpiration Stream (Penman-Monteith):</span>
                  <span className="text-stone-900 font-semibold">6.4 L/day</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span>Soil Surface Evaporation:</span>
                  <span className="text-stone-900 font-semibold">3.4 L/day</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Holding Capacity Ceiling Before Runoff:</span>
                  <span className="text-forest-800 font-semibold">19.0 Liters</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-stone-600 text-right">
                * DEMONSTRATION BENCHMARK VALUE
              </div>
            </div>

            {/* Nitrogen Balance */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-forest-50 text-forest-700 border border-forest-200">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 font-mono">NITROGEN MASS CONSERVATION</h3>
                </div>
                <span className="text-[11px] font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-700">
                  ΔN = Nin − Nuptake − Nloss
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                  <span className="text-[9px] text-stone-600 block uppercase">Input</span>
                  <span className="text-base font-bold text-stone-900">100 g</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                  <span className="text-[9px] text-stone-600 block uppercase">Uptake</span>
                  <span className="text-base font-bold text-forest-800">64 g</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                  <span className="text-[9px] text-stone-600 block uppercase">Loss</span>
                  <span className="text-base font-bold text-amber-800">21 g</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                  <span className="text-[9px] text-stone-600 block uppercase">Residual</span>
                  <span className="text-base font-bold text-stone-900">15 g</span>
                </div>
              </div>

              <div className="text-xs text-stone-600 font-mono space-y-1.5 pt-2">
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span>Vegetative Uptake Efficiency (NUE):</span>
                  <span className="text-forest-800 font-semibold">64.0%</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 py-1">
                  <span>Denitrification &amp; Leaching Fraction:</span>
                  <span className="text-amber-800 font-semibold">21.0%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Environmental Leaching Risk:</span>
                  <span className="text-forest-800 font-semibold">LOW (PROTECTED)</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-stone-600 text-right">
                * DEMONSTRATION BENCHMARK VALUE
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 5: Instrumentation ("One field. One operating picture.") */}
      <section id="instrumentation" className="py-20 md:py-24 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              TELEMETRY CHANNELS
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              One Field. One Operating Picture.
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Multi-channel instrumentation calibrated across root-zone chemistry, canopy microclimate, and trace emissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Group 1: Soil */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-xs text-stone-900 uppercase">1. SOIL MATRIX</span>
                <span className="text-[10px] text-forest-800 font-semibold">GPIO 34 / ADC</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Soil Moisture:</span>
                  <span className="font-bold text-stone-900">27.0 %</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Soil Temperature:</span>
                  <span className="font-bold text-stone-900">29.1 °C</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Substrate pH:</span>
                  <span className="font-bold text-stone-900">6.45 pH</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">NPK Macro-reserves:</span>
                  <span className="font-bold text-stone-900">64 / 51 / 73 mg/kg</span>
                </div>
              </div>
            </div>

            {/* Group 2: Environment */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-xs text-stone-900 uppercase">2. ATMOSPHERE</span>
                <span className="text-[10px] text-amber-800 font-semibold">VPD SENSING</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Air Temperature:</span>
                  <span className="font-bold text-stone-900">33.2 °C</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Relative Humidity:</span>
                  <span className="font-bold text-stone-900">54 %</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Solar Irradiance:</span>
                  <span className="font-bold text-stone-900">910 W/m²</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Vapor Deficit (VPD):</span>
                  <span className="font-bold text-stone-900">2.14 kPa</span>
                </div>
              </div>
            </div>

            {/* Group 3: Trace Emissions */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-xs text-stone-900 uppercase">3. TRACE EMISSIONS</span>
                <span className="text-[10px] text-stone-600 font-semibold">GAS NDIR</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Methane (CH4):</span>
                  <span className="font-bold text-stone-900">18.0 ppm</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Carbon Dioxide (CO2):</span>
                  <span className="font-bold text-stone-900">620.0 ppm</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">CO2e Mitigated:</span>
                  <span className="font-bold text-forest-800">3.8 kg CO2e</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded border border-stone-200">
                  <span className="text-stone-600">Sustainability Index:</span>
                  <span className="font-bold text-forest-800">94.2 / 100</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 6: Control ("Intelligence recommends. The operator decides.") */}
      <section id="control" className="py-20 md:py-24 border-b border-stone-200 bg-[#f7f5ef]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
              SAFETY ENVELOPE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              Intelligence Recommends. The Operator Decides.
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              No relay is triggered autonomously without explicit human authorization. A deterministic safety envelope prevents over-irrigation, pump dry-run, and short-cycling.
            </p>
          </div>

          {/* Actuation Pipeline Sequence */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-4xl mx-auto shadow-xs font-mono text-xs">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[10px] text-stone-600 block uppercase font-semibold">1. Decision</span>
                <span className="font-bold text-stone-900 mt-1 block">IRRIGATE</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[10px] text-stone-600 block uppercase font-semibold">2. Interlocks</span>
                <span className="font-bold text-forest-800 mt-1 block">PASSED</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[10px] text-stone-600 block uppercase font-semibold">3. Approval</span>
                <span className="font-bold text-amber-800 mt-1 block">OPERATOR</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[10px] text-stone-600 block uppercase font-semibold">4. ESP32 Node</span>
                <span className="font-bold text-stone-900 mt-1 block">DISPATCH</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[10px] text-stone-600 block uppercase font-semibold">5. Relay (GPIO23)</span>
                <span className="font-bold text-stone-900 mt-1 block">CLOSED</span>
              </div>
              <div className="p-3 bg-forest-800 text-white rounded font-bold">
                <span className="text-[10px] text-emerald-300 block uppercase font-semibold">6. DC Pump</span>
                <span className="mt-1 block">12V MOTOR</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-stone-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-800 shrink-0 mt-0.5" />
                <span><strong>15-Minute Runtime Cap:</strong> Automatic hardware watchdog cuts power if connection drops during irrigation.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-forest-800 shrink-0 mt-0.5" />
                <span><strong>10-Minute Minimum Gap:</strong> Enforces hydraulic equilibrium intervals between pump activations.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span><strong>85% Upper Cutoff:</strong> Complete physical lockout preventing saturation and root asphyxiation.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Feedback Loop (Closed Loop Learning) */}
      <section id="feedback" className="py-20 md:py-24 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              MODULE 11
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              Continuous Closed-Loop Learning
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Every operation is treated as an empirical experiment. Post-delivery observations are compared with predictions to log residual errors and continuously calibrate model weights.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 max-w-3xl mx-auto font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded border border-stone-200">
                <span className="text-[10px] text-stone-600 block uppercase">Model Predicted Target</span>
                <span className="text-xl font-bold text-stone-900 mt-1 block">50.0%</span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">Estimated equilibrium</span>
              </div>
              <div className="bg-white p-4 rounded border border-stone-200">
                <span className="text-[10px] text-stone-600 block uppercase">Observed Sensor Equilibrium</span>
                <span className="text-xl font-bold text-forest-800 mt-1 block">48.2%</span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">Post 10-minute wait</span>
              </div>
              <div className="bg-white p-4 rounded border border-stone-200">
                <span className="text-[10px] text-stone-600 block uppercase">Empirical Error Residual</span>
                <span className="text-xl font-bold text-amber-800 mt-1 block">3.6%</span>
                <span className="text-[10px] text-forest-800 mt-0.5 block">Within ±5% target band</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
              <span>Trial ID: #EXP-2026-0814-T12</span>
              <span>Logged to Experiment Registry</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Why SoilSense (Four Core Principles) */}
      <section className="py-20 md:py-24 border-b border-stone-200 bg-[#f7f5ef]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
              PHILOSOPHY
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">
              Four Principles of Process Agriculture
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              We reject black-box automation and empty marketing jargon. SoilSense operates on rigorous engineering principles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-xs space-y-2">
              <div className="text-xs font-mono font-bold text-forest-800">01. MEASURE</div>
              <h3 className="font-bold text-base text-stone-900 font-sans">Know the Physical State</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Continuous high-resolution sampling across soil matric potential, substrate pH, and boundary layer microclimate.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-xs space-y-2">
              <div className="text-xs font-mono font-bold text-forest-800">02. UNDERSTAND</div>
              <h3 className="font-bold text-base text-stone-900 font-sans">Model the Balances</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Translate raw electrical voltages into physical transport phenomena and conservation of mass equations.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-xs space-y-2">
              <div className="text-xs font-mono font-bold text-forest-800">03. CONTROL</div>
              <h3 className="font-bold text-base text-stone-900 font-sans">Operate with Confidence</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Human-authorized actuation backed by deterministic safety interlocks, preventing over-watering and dry-run faults.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-xs space-y-2">
              <div className="text-xs font-mono font-bold text-forest-800">04. LEARN</div>
              <h3 className="font-bold text-base text-stone-900 font-sans">Calibrate the Loop</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Compare predicted responses with observed equilibrium to continuously adapt model parameters over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Operator CTA */}
      <section className="py-20 md:py-24 bg-[#1b261f] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-forest-900 text-emerald-300 border border-forest-800 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <span>OPERATING ENVIRONMENT READY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans">
            Ready to enter the operating system?
          </h2>

          <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
            Access the SoilSense command center, monitor live telemetry, evaluate what-if scenarios, and authorize controlled field actions in real time.
          </p>

          <div className="pt-2 flex justify-center">
            <Link 
              href="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm shadow-md transition-all font-mono"
            >
              <span>ENTER SOILSENSE</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Footer */}
      <footer className="bg-[#121915] text-stone-400 py-12 border-t border-stone-800 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <SoilSenseLogo size="sm" variant="dark" />
            <span className="text-[11px] text-stone-400 mt-1">
              Process Intelligence for Sustainable Agriculture
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-300">
            <Link href="/docs" className="hover:text-white transition-colors text-emerald-400 font-semibold">Documentation</Link>
            <Link href="/docs/hardware/overview" className="hover:text-white transition-colors">Hardware Guide</Link>
            <Link href="/docs/operators/workflow" className="hover:text-white transition-colors">Operator SOP</Link>
            <Link href="/docs/developers/api" className="hover:text-white transition-colors">API Reference</Link>
            <a href="#process" className="hover:text-white transition-colors">Process Flow</a>
            <Link href="/login" className="hover:text-white transition-colors">Operator Login</Link>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>SYSTEM: ONLINE</span>
            </div>
            <span>v1.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
