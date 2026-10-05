import React from 'react';
import {
  Activity,
  Clock,
  Cpu,
  Play,
  BookOpen,
  RefreshCw,
  KeyRound,
  Heart,
  Sparkles,
  Film,
  Menu,
  X,
} from 'lucide-react';
import { SystemStats } from '../types/api';

interface NavbarProps {
  activeTab: 'dashboard' | 'playground' | 'docs' | 'keys';
  setActiveTab: (tab: 'dashboard' | 'playground' | 'docs' | 'keys') => void;
  systemStats: SystemStats | null;
  loadingStats: boolean;
  onRefreshStats: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemStats,
  loadingStats,
  onRefreshStats,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b-2 border-stone-800 text-stone-900 transition-colors">
      {/* Top cute telemetry banner */}
      <div className="border-b-2 border-stone-800/20 bg-[#FFFDF9] px-4 py-1.5 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Live Server Heartbeat & RAM */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-stone-800 font-medium text-[11px] shadow-[1.5px_1.5px_0px_#292524]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </span>

            {/* Cute RAM Chip */}
            <div className="flex items-center gap-1.5 bg-[#FFFDF9] px-2.5 py-0.5 rounded-lg border border-stone-800 text-stone-800 font-mono text-[11px] shadow-[1.5px_1.5px_0px_#292524]">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-stone-500">RAM:</span>
              <strong className="text-stone-900">
                {systemStats ? `${systemStats.ramUsage.processHeapUsedMb} MB` : 'Checking...'}
              </strong>
              <span className="text-stone-500 text-[10px]">
                ({systemStats ? `${systemStats.ramUsage.heapUsagePercent}%` : '...'})
              </span>
            </div>

            {/* Free Unlimited Badge */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-stone-800 text-[11px] font-semibold shadow-[1.5px_1.5px_0px_#292524]">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-400" />
              100% Free · No Coins
            </span>
          </div>

          {/* Date & Time Widget */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-stone-700">
            <div className="flex items-center gap-1.5 bg-[#FFFDF9] px-2.5 py-0.5 rounded-lg border border-stone-800 shadow-[1.5px_1.5px_0px_#292524]">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-stone-500">Time:</span>
              <span className="text-stone-900 font-medium">
                {systemStats?.dateTime ? systemStats.dateTime.sriLankaFormatted : new Date().toLocaleTimeString()}
              </span>
            </div>

            <button
              onClick={onRefreshStats}
              title="Refresh Stats"
              className="p-1 rounded-lg border border-stone-800 bg-[#FFFDF9] hover:bg-stone-100 text-stone-700 shadow-[1.5px_1.5px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin text-rose-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Cute Brand Identity with Hand-Drawn Mascot feel */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMenuOpen(false);
          }}
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-200 border-2 border-stone-800 shadow-[2.5px_2.5px_0px_#292524] flex items-center justify-center group-hover:-rotate-3 transition-transform">
            <span className="text-xl select-none">🍿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-xl text-stone-900">
                ready<span className="text-rose-500">API</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-stone-800 shadow-[1px_1px_0px_#292524]">
                Cinema Scraper
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Cute, fast, and free CineSubz API playground
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl border-2 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-amber-200 border-stone-800 text-stone-900 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40 text-stone-700 hover:border-stone-800 hover:bg-stone-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-700" />
            <span>Dashboard & RAM</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl border-2 transition-all ${
              activeTab === 'playground'
                ? 'bg-rose-300 border-stone-800 text-stone-900 shadow-[2.5px_2.5px_0px_#292524] -rotate-1'
                : 'bg-[#FFFDF9] border-stone-800 text-stone-800 shadow-[1.5px_1.5px_0px_#292524] hover:bg-rose-50'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
            <span>Playground</span>
            <span className="text-[10px] bg-white text-rose-700 px-1.5 py-0.2 rounded-full border border-stone-800 font-extrabold">
              Free
            </span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl border-2 transition-all ${
              activeTab === 'docs'
                ? 'bg-sky-200 border-stone-800 text-stone-900 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40 text-stone-700 hover:border-stone-800 hover:bg-stone-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-700" />
            <span>API Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl border-2 transition-all ${
              activeTab === 'keys'
                ? 'bg-purple-200 border-stone-800 text-stone-900 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40 text-stone-700 hover:border-stone-800 hover:bg-stone-50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-700" />
            <span>API Key</span>
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border-2 border-stone-800 bg-[#FFFDF9] text-stone-800 shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-stone-800 bg-[#FAF7F2] p-4 space-y-2 animate-fadeIn">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-sm font-bold ${
              activeTab === 'dashboard'
                ? 'bg-amber-200 border-stone-800 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-700" />
              <span>Dashboard & RAM</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('playground');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-sm font-bold ${
              activeTab === 'playground'
                ? 'bg-rose-300 border-stone-800 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-rose-600 text-rose-600" />
              <span>Playground (Free)</span>
            </div>
            <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-stone-800">
              Run Now
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('docs');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-sm font-bold ${
              activeTab === 'docs'
                ? 'bg-sky-200 border-stone-800 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-700" />
              <span>API Documentation</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('keys');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-sm font-bold ${
              activeTab === 'keys'
                ? 'bg-purple-200 border-stone-800 shadow-[2px_2px_0px_#292524]'
                : 'bg-[#FFFDF9] border-stone-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-700" />
              <span>API Token</span>
            </div>
            <span>→</span>
          </button>
        </div>
      )}
    </header>
  );
};
