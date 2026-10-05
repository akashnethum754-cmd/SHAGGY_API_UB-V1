import React, { useState, useEffect } from 'react';
import {
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Film,
  Tv,
  Download,
  ExternalLink,
  Code2,
  Eye,
  Sliders,
  AlertCircle,
  Clock,
  Heart,
  FileJson,
  CheckCircle2,
} from 'lucide-react';
import { CINESUBZ_ENDPOINTS } from '../data/endpoints';

interface PlaygroundProps {
  initialEndpointId?: string;
  onApiExecuted?: () => void;
}

export const Playground: React.FC<PlaygroundProps> = ({
  initialEndpointId,
  onApiExecuted,
}) => {
  // Selected endpoint
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(
    initialEndpointId || 'cinesubz-search'
  );

  const currentEndpoint =
    CINESUBZ_ENDPOINTS.find((ep) => ep.id === selectedEndpointId) ||
    CINESUBZ_ENDPOINTS[0];

  // Parameters form state
  const [paramQuery, setParamQuery] = useState<string>(
    currentEndpoint.parameters[0]?.default || 'new'
  );

  // Response execution state
  const [loading, setLoading] = useState<boolean>(false);
  const [responseData, setResponseData] = useState<any>(currentEndpoint.sampleResponse);
  const [responseStatus, setResponseStatus] = useState<number>(200);
  const [responseLatency, setResponseLatency] = useState<number>(
    currentEndpoint.averageLatencyMs || 210
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  // Update param input when endpoint changes
  useEffect(() => {
    if (initialEndpointId) {
      setSelectedEndpointId(initialEndpointId);
    }
  }, [initialEndpointId]);

  useEffect(() => {
    setParamQuery(currentEndpoint.parameters[0]?.default || 'new');
    setResponseData(currentEndpoint.sampleResponse);
    setErrorMsg(null);
  }, [selectedEndpointId]);

  // Construct request URL
  const requestUrl = `${currentEndpoint.endpoint}?q=${encodeURIComponent(paramQuery)}`;
  const fullRequestUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${requestUrl}`
      : `http://localhost:3000${requestUrl}`;

  // Execute API Request (100% Free - No coins needed!)
  const handleExecute = async () => {
    setLoading(true);
    setErrorMsg(null);
    const startTime = performance.now();

    try {
      const res = await fetch(requestUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      const latency = Math.round(performance.now() - startTime);
      setResponseLatency(latency);
      setResponseStatus(res.status);

      const data = await res.json();
      setResponseData(data);

      if (onApiExecuted) onApiExecuted();
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setResponseLatency(latency);
      setResponseStatus(500);
      setErrorMsg(err.message || 'Scraper execution error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy cURL command
  const copyCurl = () => {
    const curl = `curl -X ${currentEndpoint.method} "${fullRequestUrl}" -H "Accept: application/json"`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // Copy JSON response
  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-stone-800/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-200 border-2 border-stone-800 flex items-center justify-center shadow-[1.5px_1.5px_0px_#292524]">
              <Play className="w-4 h-4 fill-stone-900 text-stone-900" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
              readyAPI Interactive Playground
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-stone-800 shadow-[1px_1px_0px_#292524]">
              Free & Unlimited
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Pick a CineSubz module, type any keyword or URL, and run live scraper queries instantly.
          </p>
        </div>

        {/* Free Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 bg-rose-100 border-2 border-stone-800 px-3 py-1.5 rounded-xl font-bold text-xs text-stone-900 shadow-[2px_2px_0px_#292524]">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-400" />
            <span>Free Unlimited Mode</span>
          </div>
        </div>
      </div>

      {/* Part Selection (Cute Illustrated Tabs) */}
      <div className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-5 space-y-4 shadow-[4px_4px_0px_#292524]">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
          <span>✨</span>
          <span>Choose CineSubz Endpoint / Part:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CINESUBZ_ENDPOINTS.map((ep, idx) => {
            const isSelected = ep.id === selectedEndpointId;
            const isTv = ep.id.includes('tv');
            return (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpointId(ep.id)}
                className={`flex flex-col text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-200 border-stone-800 text-stone-900 shadow-[3.5px_3.5px_0px_#292524] -translate-y-1'
                    : 'bg-[#FAF7F2] border-stone-800/40 text-stone-700 hover:border-stone-800 hover:bg-stone-50 hover:shadow-[2px_2px_0px_#292524]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-stone-800 border border-stone-800 shadow-[1px_1px_0px_#292524]">
                    PART {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                    FREE
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-extrabold text-xs leading-snug">
                  {isTv ? <Tv className="w-3.5 h-3.5 text-stone-900 shrink-0" /> : <Film className="w-3.5 h-3.5 text-stone-900 shrink-0" />}
                  <span className="truncate">{ep.name}</span>
                </div>

                <div className="text-[11px] font-mono text-stone-500 truncate mt-1">
                  {ep.endpoint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Execution Grid: Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Request Builder & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-5 space-y-4 shadow-[4px_4px_0px_#292524]">
            <div className="flex items-center justify-between border-b-2 border-stone-800/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-500" />
                <h3 className="font-extrabold text-stone-900 text-sm">Request Parameters</h3>
              </div>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-900 border border-stone-800 px-2 py-0.5 rounded-md font-bold shadow-[1px_1px_0px_#292524]">
                {currentEndpoint.method}
              </span>
            </div>

            {/* Current Endpoint Description */}
            <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border-2 border-stone-800/15 leading-relaxed font-medium">
              <strong className="text-stone-900">{currentEndpoint.name}: </strong>
              {currentEndpoint.description}
            </div>

            {/* Parameter Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                <span>
                  Query Keyword or Post URL: <code className="text-rose-600 font-mono">?q=</code>
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 font-mono font-bold">
                  Required
                </span>
              </label>

              <input
                type="text"
                value={paramQuery}
                onChange={(e) => setParamQuery(e.target.value)}
                placeholder={currentEndpoint.parameters[0]?.description}
                className="w-full rounded-2xl bg-[#FAF7F2] border-2 border-stone-800 px-3.5 py-2.5 text-xs text-stone-900 font-mono focus:bg-white focus:outline-none shadow-[2px_2px_0px_#292524] transition-all"
              />
              <p className="text-[11px] text-stone-500 font-medium">
                {currentEndpoint.parameters[0]?.description}
              </p>
            </div>

            {/* Quick Query Presets */}
            {currentEndpoint.presets && currentEndpoint.presets.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Quick Click Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentEndpoint.presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setParamQuery(preset.value)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border-2 font-mono font-bold transition-all cursor-pointer ${
                        paramQuery === preset.value
                          ? 'bg-rose-200 border-stone-800 text-stone-900 shadow-[1.5px_1.5px_0px_#292524]'
                          : 'bg-[#FAF7F2] border-stone-800/40 text-stone-700 hover:border-stone-800 hover:bg-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Endpoint URL Preview */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-600">Built Request URL:</span>
              <div className="rounded-xl bg-stone-100 p-2.5 font-mono text-[11px] text-stone-800 border-2 border-stone-800/20 overflow-x-auto break-all">
                <span className="text-emerald-700 font-bold mr-1.5">GET</span>
                <span>{requestUrl}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-2xl bg-rose-100 border-2 border-rose-400 p-3 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Run Scraper Button (Big, Cute & Tactile) */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleExecute}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-400 hover:bg-rose-500 border-2 border-stone-800 px-6 py-3.5 text-sm font-extrabold text-stone-900 shadow-[3.5px_3.5px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#292524] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-stone-900" />
                    <span>Harvesting CineSubz Core...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-stone-900 text-stone-900" />
                    <span>Run API Scraper</span>
                    <span className="ml-1 text-[10px] bg-white text-stone-900 border border-stone-800 px-2 py-0.5 rounded-full font-bold">
                      Free
                    </span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyCurl}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-stone-800 bg-[#FAF7F2] hover:bg-white px-3 py-2 text-xs font-bold text-stone-800 shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  {copiedCurl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="w-3.5 h-3.5 text-stone-600" />
                      <span>Copy cURL</span>
                    </>
                  )}
                </button>

                <a
                  href={requestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-stone-800 bg-[#FAF7F2] hover:bg-white px-3 py-2 text-xs font-bold text-stone-800 shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                  <span>Open in Tab</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Response / Visual Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-5 shadow-[4px_4px_0px_#292524] space-y-4">
            {/* Response telemetry bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-800/10 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                  Response:
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border-2 border-stone-800 shadow-[1px_1px_0px_#292524] ${
                    responseStatus === 200
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  STATUS: {responseStatus} OK
                </span>
                <span className="text-[11px] font-mono font-bold text-stone-800 bg-amber-100 border border-stone-800 px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_#292524] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700" /> {responseLatency} ms
                </span>
              </div>

              {/* View switch: Visual vs Raw JSON */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border-2 border-stone-800 shadow-[1.5px_1.5px_0px_#292524]">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'visual'
                      ? 'bg-white text-stone-900 shadow-sm border border-stone-800'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-rose-600" />
                  <span>Story Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'json'
                      ? 'bg-white text-stone-900 shadow-sm border border-stone-800'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5 text-sky-600" />
                  <span>Raw JSON</span>
                </button>
              </div>
            </div>

            {/* Results Content */}
            {viewMode === 'visual' ? (
              <VisualResponsePreview
                data={responseData}
                endpointId={selectedEndpointId}
                onSelectMoviePost={(postUrl) => {
                  setSelectedEndpointId('cinesubz-infodl');
                  setParamQuery(postUrl);
                }}
                onSelectTvPost={(tvUrl) => {
                  setSelectedEndpointId('cinesubz-tv-info');
                  setParamQuery(tvUrl);
                }}
              />
            ) : (
              <div className="relative">
                <div className="flex justify-between items-center bg-stone-100 px-3 py-2 rounded-t-2xl border-2 border-b-0 border-stone-800 text-xs font-mono text-stone-700">
                  <span>application/json &bull; UTF-8</span>
                  <button
                    onClick={copyJson}
                    className="flex items-center gap-1 text-stone-800 hover:text-black font-bold cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[11px]">Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-[500px] overflow-auto rounded-b-2xl border-2 border-stone-800 bg-[#FAF7F2] p-4 font-mono text-xs text-stone-900 leading-relaxed shadow-inner">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Cute Illustrated rendering of CineSubz results
interface VisualResponsePreviewProps {
  data: any;
  endpointId: string;
  onSelectMoviePost: (url: string) => void;
  onSelectTvPost: (url: string) => void;
}

const VisualResponsePreview: React.FC<VisualResponsePreviewProps> = ({
  data,
  endpointId,
  onSelectMoviePost,
  onSelectTvPost,
}) => {
  if (!data) {
    return (
      <div className="p-8 text-center text-stone-500 font-mono text-xs">
        No response payload yet. Click "Run API Scraper" above to fetch results!
      </div>
    );
  }

  // 1. CineSubz Movie Cinema Search View
  if (endpointId === 'cinesubz-search' && data.results) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-600 font-mono font-bold">
          <span>Found {data.totalResults || data.results.length} Movie titles</span>
          <span>Provider: {data.provider}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
          {data.results.map((item: any, idx: number) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-3 shadow-[2.5px_2.5px_0px_#292524] hover:shadow-[4px_4px_0px_#292524] transition-all flex gap-3 group"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-16 h-24 object-cover rounded-xl border-2 border-stone-800 bg-stone-100 shrink-0 group-hover:rotate-1 transition-transform shadow-[1.5px_1.5px_0px_#292524]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                    Cinema Release
                  </span>
                  <h4 className="text-xs font-extrabold text-stone-900 line-clamp-2 mt-1 group-hover:text-rose-600 transition-colors">
                    {item.title}
                  </h4>
                </div>

                <div className="pt-2 flex items-center justify-between gap-1">
                  <button
                    onClick={() => onSelectMoviePost(item.link)}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect & Download</span>
                  </button>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900"
                    title="Open original CineSubz page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. CineSubz Movie Info & Download Harvester View
  if (endpointId === 'cinesubz-infodl' && data.movie) {
    const m = data.movie;
    return (
      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
        <div className="rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-4 space-y-3 shadow-[2.5px_2.5px_0px_#292524]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                Movie Details
              </span>
              <h3 className="text-base font-extrabold text-stone-900 mt-1">{m.title}</h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="bg-white text-stone-800 font-bold px-2 py-0.5 rounded-md border border-stone-800">
                {m.year}
              </span>
              <span className="bg-amber-100 text-amber-900 font-bold border border-stone-800 px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#292524]">
                IMDB {m.rating || '8.4/10'}
              </span>
            </div>
          </div>

          <div className="text-xs text-stone-600 font-medium">
            <strong className="text-stone-800">Genre:</strong> {m.genre} &bull; <strong className="text-stone-800">Runtime:</strong> {m.duration || '2h 15m'}
          </div>

          {m.synopsis && (
            <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border-2 border-stone-800/10 font-medium">
              {m.synopsis}
            </p>
          )}

          {/* Download Links Harvested */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Download className="w-3.5 h-3.5 text-emerald-600" /> High-Speed Direct Download Links:
            </span>

            <div className="space-y-2">
              {m.downloads?.map((dl: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-stone-800 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#292524] hover:bg-emerald-50/50 transition-colors"
                >
                  <div>
                    <div className="font-extrabold text-xs text-stone-900">{dl.title}</div>
                    <div className="text-[11px] font-mono text-stone-600 flex items-center gap-2 mt-0.5">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 rounded">
                        {dl.quality}
                      </span>
                      {dl.size && <span className="font-semibold">{dl.size}</span>}
                    </div>
                  </div>

                  <a
                    href={dl.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-stone-900 bg-emerald-300 hover:bg-emerald-400 px-3.5 py-1.5 rounded-xl border-2 border-stone-800 shadow-[1.5px_1.5px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. CineSubz TV Series Search View
  if (endpointId === 'cinesubz-tv-search' && data.results) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-600 font-mono font-bold">
          <span>Found {data.totalResults || data.results.length} TV Shows</span>
          <span>Provider: {data.provider}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
          {data.results.map((item: any, idx: number) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-3 shadow-[2.5px_2.5px_0px_#292524] hover:shadow-[4px_4px_0px_#292524] transition-all flex gap-3 group"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-16 h-24 object-cover rounded-xl border-2 border-stone-800 bg-stone-100 shrink-0 group-hover:rotate-1 transition-transform shadow-[1.5px_1.5px_0px_#292524]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                    TV Show / Anime
                  </span>
                  <h4 className="text-xs font-extrabold text-stone-900 line-clamp-2 mt-1 group-hover:text-amber-700 transition-colors">
                    {item.title}
                  </h4>
                </div>

                <div className="pt-2 flex items-center justify-between gap-1">
                  <button
                    onClick={() => onSelectTvPost(item.link)}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Episodes & DL</span>
                  </button>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-stone-500 hover:text-stone-900"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. CineSubz TV Series Info & Episode Streams View
  if (endpointId === 'cinesubz-tv-info' && data.series) {
    const s = data.series;
    return (
      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
        <div className="rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-4 space-y-3 shadow-[2.5px_2.5px_0px_#292524]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                TV Series & Episodes
              </span>
              <h3 className="text-base font-extrabold text-stone-900 mt-1">{s.title}</h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="bg-white text-stone-800 font-bold px-2 py-0.5 rounded-md border border-stone-800">
                {s.year}
              </span>
              <span className="bg-amber-100 text-amber-900 font-bold border border-stone-800 px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#292524]">
                {s.episodesCount} Episodes
              </span>
            </div>
          </div>

          <div className="text-xs text-stone-600 font-medium">
            <strong className="text-stone-800">Genre:</strong> {s.genre}
          </div>

          {s.synopsis && (
            <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border-2 border-stone-800/10 font-medium">
              {s.synopsis}
            </p>
          )}

          {/* Episode List */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-amber-600" /> Episode Index & Downloads:
            </span>

            <div className="space-y-2">
              {s.episodes?.map((ep: any) => (
                <div
                  key={ep.episodeNumber}
                  className="rounded-xl border-2 border-stone-800 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#292524]"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      EPISODE #{ep.episodeNumber}
                    </span>
                    <div className="text-xs font-extrabold text-stone-900">{ep.title}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ep.downloadLinks?.map((dl: any, dIdx: number) => (
                      <a
                        key={dIdx}
                        href={dl.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg border border-stone-800 shadow-[1px_1px_0px_#292524] flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3 text-amber-700" />
                        <span>{dl.quality}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <pre className="max-h-[480px] overflow-auto rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-4 font-mono text-xs text-stone-900">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};
