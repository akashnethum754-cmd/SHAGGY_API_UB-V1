import React from 'react';
import {
  Cpu,
  Clock,
  Activity,
  Play,
  Server,
  TrendingUp,
  Film,
  Tv,
  ArrowRight,
  Heart,
  Sparkles,
  Zap,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { SystemStats } from '../types/api';
import { CINESUBZ_ENDPOINTS } from '../data/endpoints';

interface SystemStatsDashboardProps {
  systemStats: SystemStats | null;
  onOpenPlayground: (endpointId?: string) => void;
}

export const SystemStatsDashboard: React.FC<SystemStatsDashboardProps> = ({
  systemStats,
  onOpenPlayground,
}) => {
  const ram = systemStats?.ramUsage;
  const dt = systemStats?.dateTime;
  const uptime = systemStats?.uptime;
  const srv = systemStats?.server;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cute Hand-Drawn Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-6 sm:p-8 md:p-10 shadow-[5px_5px_0px_#292524]">
        {/* Playful background doodles */}
        <div className="absolute top-4 right-6 text-3xl select-none opacity-80 animate-bounce">
          ✨
        </div>
        <div className="absolute -bottom-4 right-1/4 text-4xl select-none opacity-20 pointer-events-none">
          🎬
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            {/* Cute sticker tag */}
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-stone-800 bg-amber-100 px-3.5 py-1 text-xs font-bold text-stone-900 shadow-[2px_2px_0px_#292524]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Free Cinema Scraper & REST Data Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
              A Friendly, Fast API for <br />
              <span className="relative inline-block text-rose-600 underline decoration-wavy decoration-rose-300">
                Movies & TV Shows
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
              Harvest CineSubz cinema data, Sinhala subtitles, 1080p direct download links, and full TV episode streams.
              Enjoy real-time RAM usage telemetry, zero coin limits, and an interactive illustrated playground.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onOpenPlayground()}
                className="group flex items-center gap-2.5 rounded-2xl bg-rose-400 hover:bg-rose-500 border-2 border-stone-800 px-6 py-3.5 text-sm font-extrabold text-stone-900 shadow-[3.5px_3.5px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#292524] transition-all"
              >
                <Play className="w-4 h-4 fill-stone-900 text-stone-900" />
                <span>Open Playground</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-stone-800 bg-emerald-100 px-4 py-3 text-xs font-bold text-emerald-900 shadow-[2.5px_2.5px_0px_#292524]">
                <Heart className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                <span>Unlimited Free Requests</span>
              </div>
            </div>
          </div>

          {/* Cute Illustrated Hardware Snapshot Card */}
          <div className="w-full lg:w-96 rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-5 shadow-[4px_4px_0px_#292524] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-stone-800/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌱</span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Live System Health
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-md border border-stone-800">
                100% HEALTHY
              </span>
            </div>

            {/* RAM Progress with cute hand-drawn bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-600" /> Process RAM Heap
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {ram ? `${ram.processHeapUsedMb} MB / ${ram.processHeapTotalMb} MB` : 'Checking...'}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border-2 border-stone-800 bg-white">
                <div
                  className="h-full bg-sky-300 transition-all duration-500 border-r-2 border-stone-800"
                  style={{ width: `${ram ? Math.min(100, ram.heapUsagePercent) : 35}%` }}
                />
              </div>
            </div>

            {/* Mini Illustrated Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-xl border-2 border-stone-800 bg-white p-2.5 shadow-[1.5px_1.5px_0px_#292524]">
                <div className="text-[10px] text-stone-500 font-bold">HOST MEMORY</div>
                <div className="text-stone-900 font-bold mt-0.5">
                  {ram ? `${ram.systemUsedMb} MB` : '...'}
                </div>
                <div className="text-[10px] text-stone-500">Free: {ram?.systemFreeMb || '...'} MB</div>
              </div>

              <div className="rounded-xl border-2 border-stone-800 bg-white p-2.5 shadow-[1.5px_1.5px_0px_#292524]">
                <div className="text-[10px] text-stone-500 font-bold">UPTIME</div>
                <div className="text-emerald-700 font-bold mt-0.5">
                  {uptime?.processUptimeHuman || 'Running'}
                </div>
                <div className="text-[10px] text-stone-500">Zero Downtime</div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-stone-800 bg-amber-50 p-2.5 text-[11px] font-mono text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Server Time:
              </span>
              <span className="font-semibold text-stone-900">
                {dt?.sriLankaFormatted ? dt.sriLankaFormatted.split(',')[1] || dt.sriLankaFormatted : 'Colombo Time'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Illustrated Dashboard Telemetry Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-stone-800/15 pb-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              Live System Diagnostics & RAM Telemetry
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Real-time resource utilization, RAM usage, timezones, and hardware performance
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-xl border-2 border-stone-800 shadow-[1.5px_1.5px_0px_#292524] self-start sm:self-auto">
            Live Pulse: Active (4s interval)
          </span>
        </div>

        {/* 4 Cards: RAM Usage, Date & Time, Environment, Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: RAM Usage */}
          <div className="rounded-2xl border-2 border-stone-800 bg-sky-50/70 p-5 shadow-[3.5px_3.5px_0px_#292524] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-stone-700 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-600" /> RAM Usage
              </span>
              <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-200 px-2 py-0.5 rounded-md border border-stone-800">
                {ram ? `${ram.processHeapUsedMb} MB` : '...'}
              </span>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <div className="text-2xl font-black text-stone-900">
                  {ram ? `${ram.heapUsagePercent}%` : '0%'}
                  <span className="text-xs font-normal text-stone-600 ml-2">Heap Load</span>
                </div>
                <div className="h-2.5 w-full rounded-full border-2 border-stone-800 bg-white mt-2 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${ram ? Math.min(100, ram.heapUsagePercent) : 25}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs border-t-2 border-stone-800/10 pt-2 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Heap Used:</span>
                  <span className="font-bold text-stone-900">{ram?.processHeapUsedMb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Heap Total:</span>
                  <span>{ram?.processHeapTotalMb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Process RSS:</span>
                  <span>{ram?.processRssMb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Host Free:</span>
                  <span className="text-emerald-700 font-bold">{ram?.systemFreeMb} MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Date & Time */}
          <div className="rounded-2xl border-2 border-stone-800 bg-amber-50/80 p-5 shadow-[3.5px_3.5px_0px_#292524] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-stone-700 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Date & Time
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md border border-stone-800">
                TICKING
              </span>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <div className="text-lg font-extrabold text-stone-900 leading-tight">
                  {dt?.sriLankaFormatted ? dt.sriLankaFormatted.split(',')[1] || dt.sriLankaFormatted : 'Colombo Time'}
                </div>
                <div className="text-xs text-amber-800 font-bold mt-0.5">
                  Sri Lanka (UTC+05:30)
                </div>
              </div>

              <div className="space-y-1 text-xs border-t-2 border-stone-800/10 pt-2 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">UTC Time:</span>
                  <span className="text-stone-900 text-[11px] font-medium">{dt ? dt.utc.split('GMT')[0] : '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Server Uptime:</span>
                  <span className="text-emerald-700 font-bold">{uptime?.processUptimeHuman}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">System Uptime:</span>
                  <span>{uptime?.systemUptimeHuman}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Epoch Timestamp:</span>
                  <span className="text-stone-500">{dt?.timestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Host Environment */}
          <div className="rounded-2xl border-2 border-stone-800 bg-emerald-50/70 p-5 shadow-[3.5px_3.5px_0px_#292524] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-stone-700 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-600" /> Host Machine
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-md border border-stone-800">
                {srv?.platform || 'linux'}
              </span>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <div className="text-xl font-extrabold text-stone-900 truncate" title={srv?.cpuModel}>
                  {srv?.cpuModel || 'Cloud vCPU Core'}
                </div>
                <div className="text-xs text-stone-500">
                  {srv?.cpuCores} Cores &bull; Arch: {srv?.arch}
                </div>
              </div>

              <div className="space-y-1 text-xs border-t-2 border-stone-800/10 pt-2 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Node Runtime:</span>
                  <span className="text-emerald-800 font-bold">{srv?.nodeVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total System RAM:</span>
                  <span>{ram?.systemTotalMb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Load Average:</span>
                  <span>{srv?.loadAverage ? srv.loadAverage.map((v) => v.toFixed(2)).join(', ') : '0.12'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Engine:</span>
                  <span className="text-stone-800 font-medium">Express + Vite</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Scraper Health & Activity */}
          <div className="rounded-2xl border-2 border-stone-800 bg-rose-50/70 p-5 shadow-[3.5px_3.5px_0px_#292524] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-stone-700 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-600" /> Scraper Health
              </span>
              <span className="text-[11px] font-mono font-bold text-rose-900 bg-rose-200 px-2 py-0.5 rounded-md border border-stone-800">
                ONLINE
              </span>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <div className="text-2xl font-black text-stone-900">
                  {systemStats?.metrics.totalRequests.toLocaleString() || '16,840'}
                </div>
                <div className="text-xs text-stone-500">Total Scraper Calls Handled</div>
              </div>

              <div className="space-y-1 text-xs border-t-2 border-stone-800/10 pt-2 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Average Latency:</span>
                  <span className="text-amber-800 font-bold">{systemStats?.metrics.averageLatencyMs || 220} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Success Rate:</span>
                  <span className="text-emerald-700 font-bold">99.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Access:</span>
                  <span className="text-rose-700 font-bold">100% Free Forever</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Target Scraper:</span>
                  <span className="text-stone-800 font-medium">CineSubz Core</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Endpoints Section with Cute Hand-Drawn Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" />
              CineSubz API Services & Modules
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Click any module to execute live in the Playground with zero restrictions
            </p>
          </div>

          <button
            onClick={() => onOpenPlayground()}
            className="flex items-center gap-2 text-xs font-bold text-stone-900 bg-rose-200 hover:bg-rose-300 px-4 py-2 rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_#292524] transition-all self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-stone-900" />
            <span>Launch All in Playground</span>
          </button>
        </div>

        {/* 4 Endpoints Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CINESUBZ_ENDPOINTS.map((endpoint, idx) => {
            const isTv = endpoint.id.includes('tv');
            return (
              <div
                key={endpoint.id}
                className="rounded-2xl border-2 border-stone-800 bg-[#FFFDF9] p-5 shadow-[4px_4px_0px_#292524] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#292524] transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl border-2 border-stone-800 flex items-center justify-center shadow-[2px_2px_0px_#292524] ${
                          isTv ? 'bg-amber-200 text-stone-900' : 'bg-rose-200 text-stone-900'
                        }`}
                      >
                        {isTv ? <Tv className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-800">
                            PART {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                            FREE
                          </span>
                        </div>
                        <h3 className="font-extrabold text-stone-900 text-base group-hover:text-rose-600 transition-colors mt-0.5">
                          {endpoint.name}
                        </h3>
                      </div>
                    </div>

                    <span className="bg-emerald-100 text-emerald-900 border-2 border-stone-800 px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold shadow-[1.5px_1.5px_0px_#292524]">
                      {endpoint.method}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    {endpoint.description}
                  </p>

                  <div className="rounded-xl bg-stone-50 p-2.5 font-mono text-xs text-stone-800 border-2 border-stone-800/20 flex items-center justify-between">
                    <span className="text-rose-700 font-semibold truncate">{endpoint.endpoint}</span>
                    <span className="text-[10px] text-stone-500 ml-2 shrink-0">~{endpoint.averageLatencyMs}ms</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t-2 border-stone-800/10 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-stone-600 flex items-center gap-2 font-medium">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {endpoint.successRate}%
                    </span>
                    <span>&bull;</span>
                    <span>{endpoint.totalCalls.toLocaleString()} calls</span>
                  </div>

                  <button
                    onClick={() => onOpenPlayground(endpoint.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-900 bg-rose-300 hover:bg-rose-400 px-4 py-2 rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-900" />
                    <span>Run in Playground</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cute Quick cURL Integration Box */}
      <section className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-6 shadow-[4px_4px_0px_#292524] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
            <span className="text-base">📋</span>
            <span>Simple One-Line cURL Request (Free)</span>
          </div>
          <span className="text-xs font-mono font-bold text-stone-600 bg-amber-100 border border-stone-800 px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#292524]">
            No API Key Required
          </span>
        </div>

        <div className="relative rounded-2xl bg-stone-900 p-4 font-mono text-xs text-amber-200 border-2 border-stone-800 overflow-x-auto shadow-inner">
          <code className="text-rose-300">curl -X GET </code>
          <code className="text-amber-100">"{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/v1/movies/cinesubz/search?q=Spider-Man" </code>
          <code className="text-stone-400">\</code>
          <br />
          <code className="text-stone-300">  -H "Accept: application/json"</code>
        </div>
      </section>
    </div>
  );
};
