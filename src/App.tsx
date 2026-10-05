import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SystemStatsDashboard } from './components/SystemStatsDashboard';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { KeyManager } from './components/KeyManager';
import { SystemStats } from './types/api';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'playground' | 'docs' | 'keys'>('dashboard');
  const [playgroundEndpointId, setPlaygroundEndpointId] = useState<string>('cinesubz-search');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Fetch real-time system stats (RAM usage, Date & Time, metrics)
  const fetchSystemStats = useCallback(async () => {
    try {
      const res = await fetch('/api/system/stats');
      if (res.ok) {
        const data: SystemStats = await res.json();
        setSystemStats(data);
      }
    } catch (err) {
      console.warn('System telemetry fetch warning:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Poll system stats every 4 seconds for live clock and RAM monitor
  useEffect(() => {
    fetchSystemStats();
    const timer = setInterval(() => {
      fetchSystemStats();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchSystemStats]);

  // Quick jump to playground with preselected endpoint
  const handleOpenPlayground = (endpointId?: string) => {
    if (endpointId) {
      setPlaygroundEndpointId(endpointId);
    }
    setActiveTab('playground');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col selection:bg-rose-200 selection:text-rose-900 font-sans">
      {/* Top sticky navigation with live RAM & Date/Time badges */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStats={systemStats}
        loadingStats={loadingStats}
        onRefreshStats={fetchSystemStats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <SystemStatsDashboard
            systemStats={systemStats}
            onOpenPlayground={handleOpenPlayground}
          />
        )}

        {activeTab === 'playground' && (
          <Playground
            initialEndpointId={playgroundEndpointId}
            onApiExecuted={fetchSystemStats}
          />
        )}

        {activeTab === 'docs' && (
          <Documentation onOpenPlayground={handleOpenPlayground} />
        )}

        {activeTab === 'keys' && (
          <KeyManager />
        )}
      </main>

      {/* Cute Warm Illustrated Footer */}
      <footer className="border-t-2 border-stone-800/15 bg-[#FFFDF9] text-stone-600 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-rose-200 border border-stone-800 flex items-center justify-center text-xs">
              🍿
            </span>
            <span className="font-extrabold text-stone-900">readyAPI CineSubz Scraper</span>
            <span>&bull;</span>
            <span className="font-medium text-stone-500">100% Free & Unlimited Cinema REST Engine</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-stone-700">
            <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-stone-800 shadow-[1px_1px_0px_#292524]">
              <ShieldCheck className="w-3.5 h-3.5" /> 99.7% Success
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-stone-800 shadow-[1px_1px_0px_#292524]">
              <Heart className="w-3 h-3 fill-rose-400 text-rose-500" /> Free Forever
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
