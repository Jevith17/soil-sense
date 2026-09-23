import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ExternalLink,
  Cpu,
  Layers,
  Activity,
  Sliders,
  ShieldCheck,
  Power,
  FlaskConical,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { SoilSenseLogo } from '@/components/ui/SoilSenseLogo';
import { DOC_CATEGORIES, searchDocs, getAdjacentDocs } from '@/lib/docsData';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

interface DocsLayoutProps {
  title: string;
  category?: string;
  subtitle?: string;
  lastUpdated?: string;
  readTime?: string;
  headings?: { id: string; title: string }[];
  children: React.ReactNode;
}

export const DocsLayout: React.FC<DocsLayoutProps> = ({
  title,
  category = 'GETTING STARTED',
  subtitle,
  lastUpdated = 'Version 1.2 — September 2026',
  readTime = '4 min read',
  headings = [],
  children
}) => {
  const router = useRouter();
  const currentPath = router.asPath.split('#')[0];
  const { prev, next } = getAdjacentDocs(currentPath);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setSearchResults(searchDocs(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchQuery('');
  }, [router.asPath]);

  const toggleCategory = (slug: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [slug]: !prev[slug]
    }));
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 font-sans selection:bg-forest-100 selection:text-forest-900 flex flex-col">
      <Head>
        <title>{title} — SoilSense Operating Manual</title>
        <meta name="description" content={subtitle || "Official operating manual and technical handbook for SoilSense."} />
      </Head>

      {/* Top Docs Header */}
      <header className="h-14 bg-white border-b border-stone-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded hover:bg-stone-100 text-stone-600"
            title="Toggle Docs Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/docs" className="flex items-center gap-2">
            <SoilSenseLogo size="sm" variant="light" />
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              MANUAL
            </span>
          </Link>
        </div>

        {/* Global Docs Search Input */}
        <div className="relative max-w-xs sm:max-w-md w-full mx-4">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search operating manual..."
              className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 outline-none focus:border-forest-700 font-mono transition-colors"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-300 rounded shadow-lg max-h-80 overflow-y-auto z-50 divide-y divide-stone-100 font-mono text-xs">
              {searchResults.map((res) => (
                <Link
                  key={res.path}
                  href={res.path}
                  onClick={() => setSearchQuery('')}
                  className="block p-3 hover:bg-stone-50 transition-colors"
                >
                  <div className="text-[10px] uppercase font-bold text-forest-800">
                    {res.category}
                  </div>
                  <div className="font-bold text-stone-900 mt-0.5 font-sans">
                    {res.title}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 truncate">
                    {res.matchSnippet}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* External Links */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <Link 
            href="/home" 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-forest-800 hover:bg-forest-900 text-white transition-colors"
          >
            <span>Console</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Link 
            href="/" 
            className="text-stone-500 hover:text-stone-800 transition-colors hidden md:block"
          >
            Public Site
          </Link>
        </div>
      </header>

      {/* Main 3-Column Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar: Navigation Tree */}
        <aside 
          className={`fixed md:sticky top-14 left-0 bottom-0 z-30 w-72 bg-[#f7f5ef] border-r border-stone-200 overflow-y-auto p-4 transition-transform duration-200 md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 pb-3 border-b border-stone-200">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 font-semibold block">
              OPERATING HANDBOOK
            </span>
            <div className="text-xs font-bold text-stone-900 mt-0.5 font-mono">
              SoilSense SCADA v1.2
            </div>
          </div>

          <nav className="space-y-4 text-xs">
            {DOC_CATEGORIES.map((cat) => {
              const isCollapsed = collapsedCategories[cat.slug];

              return (
                <div key={cat.slug} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(cat.slug)}
                    className="w-full flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700 py-1 px-1.5 hover:text-stone-900 transition-colors"
                  >
                    <span>{cat.title}</span>
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <ul className="space-y-0.5 pl-2 border-l border-stone-200">
                      {cat.items.map((item) => {
                        const isActive = currentPath === item.path;

                        return (
                          <li key={item.path}>
                            <Link
                              href={item.path}
                              className={`block px-2.5 py-1.5 rounded transition-colors text-xs ${
                                isActive 
                                  ? 'bg-forest-800 text-white font-medium shadow-2xs' 
                                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                              }`}
                            >
                              {item.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Center: Main Document Content */}
        <main className="flex-1 min-w-0 p-6 sm:p-10 md:p-12 overflow-y-auto">
          <div className="max-w-3xl">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-600 mb-4">
              <Link href="/docs" className="hover:text-stone-900">Docs</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="uppercase text-forest-800 font-semibold">{category}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-stone-700 truncate">{title}</span>
            </div>

            {/* Document Header */}
            <div className="border-b border-stone-200 pb-5 mb-8 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-stone-600 leading-relaxed font-normal">
                  {subtitle}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-stone-600">
                <span>{lastUpdated}</span>
                <span>•</span>
                <span>{readTime}</span>
              </div>
            </div>

            {/* Document Body */}
            <div className="text-stone-800 text-sm leading-relaxed space-y-6">
              {children}
            </div>

            {/* Bottom Previous / Next Chapter Navigation */}
            <div className="mt-16 pt-6 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {prev ? (
                <Link
                  href={prev.path}
                  className="p-3 rounded border border-stone-200 bg-white hover:bg-stone-50 transition-colors flex flex-col items-start gap-1"
                >
                  <span className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Previous Chapter
                  </span>
                  <span className="font-bold text-stone-900 font-sans text-sm">{prev.title}</span>
                </Link>
              ) : <div />}

              {next ? (
                <Link
                  href={next.path}
                  className="p-3 rounded border border-stone-200 bg-white hover:bg-stone-50 transition-colors flex flex-col items-end gap-1 text-right sm:col-start-2"
                >
                  <span className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
                    Next Chapter <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="font-bold text-stone-900 font-sans text-sm">{next.title}</span>
                </Link>
              ) : <div />}
            </div>

            {/* Documentation Footer */}
            <div className="mt-12 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-600 gap-2">
              <span>SoilSense Operational Handbook — Confidential Agronomic Standard</span>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-forest-700" />
                <span>Verified System Architecture</span>
              </div>
            </div>

          </div>
        </main>

        {/* Right Column: In-Page Table of Contents (TOC) */}
        {headings && headings.length > 0 && (
          <aside className="hidden lg:block w-64 p-8 sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto text-xs">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-3">
              ON THIS PAGE
            </div>
            <ul className="space-y-2 border-l border-stone-200 pl-3 font-mono text-[11px]">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="block text-stone-600 hover:text-stone-900 hover:border-l-2 hover:border-forest-700 -ml-[13px] pl-[11px] transition-colors leading-normal"
                  >
                    {h.title}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-stone-200 space-y-2 font-mono text-[11px]">
              <div className="text-stone-600 uppercase text-[10px] font-semibold">NEED ASSISTANCE?</div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Ask the automated agronomist on the console.
              </p>
              <Link 
                href="/copilot"
                className="inline-flex items-center gap-1 text-forest-800 font-semibold hover:underline"
              >
                <span>Launch Assistant →</span>
              </Link>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
};

