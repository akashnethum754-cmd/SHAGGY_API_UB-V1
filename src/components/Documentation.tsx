import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Play,
  Film,
  Tv,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CINESUBZ_ENDPOINTS } from '../data/endpoints';

interface DocumentationProps {
  onOpenPlayground: (endpointId: string) => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onOpenPlayground }) => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('cinesubz-search');
  const [langTab, setLangTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  const activeEndpoint =
    CINESUBZ_ENDPOINTS.find((e) => e.id === selectedEndpointId) ||
    CINESUBZ_ENDPOINTS[0];

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const paramVal = activeEndpoint.parameters[0]?.default || 'new';
  const fullUrl = `${origin}${activeEndpoint.endpoint}?q=${encodeURIComponent(paramVal)}`;

  const getCodeSnippet = () => {
    switch (langTab) {
      case 'curl':
        return `curl -X ${activeEndpoint.method} "${fullUrl}" \\
  -H "Accept: application/json"`;
      case 'js':
        return `// JavaScript (Node.js / Browser)
const response = await fetch("${fullUrl}", {
  method: "${activeEndpoint.method}",
  headers: {
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
      case 'python':
        return `# Python (requests)
import requests

url = "${fullUrl}"
headers = { "Accept": "application/json" }

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="border-b-2 border-stone-800/15 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-200 border-2 border-stone-800 flex items-center justify-center shadow-[1.5px_1.5px_0px_#292524]">
            <BookOpen className="w-4 h-4 text-stone-900" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            readyAPI Documentation & Schemas
          </h1>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-stone-800 shadow-[1px_1px_0px_#292524]">
            100% Free Access
          </span>
        </div>
        <p className="text-xs text-stone-500 font-medium mt-1">
          Complete REST reference for querying cinema search, direct download harvester, and TV episode streams.
        </p>
      </div>

      {/* Grid: Endpoint list on left, detail on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
            Available Modules:
          </div>
          {CINESUBZ_ENDPOINTS.map((ep) => {
            const isSelected = ep.id === selectedEndpointId;
            const isTv = ep.id.includes('tv');
            return (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpointId(ep.id)}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100 border-stone-800 text-stone-900 shadow-[3px_3px_0px_#292524] -translate-y-0.5'
                    : 'bg-[#FFFDF9] border-stone-800/40 text-stone-700 hover:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl border-2 border-stone-800 flex items-center justify-center shrink-0 mt-0.5 ${
                    isTv ? 'bg-amber-200 text-stone-900' : 'bg-rose-200 text-stone-900'
                  }`}
                >
                  {isTv ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs truncate text-stone-900">{ep.name}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 rounded">
                      {ep.method}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-500 truncate mt-0.5">
                    {ep.endpoint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-6 space-y-5 shadow-[4px_4px_0px_#292524]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-800/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-900 border-2 border-stone-800 px-2 py-0.5 rounded-lg font-mono text-xs font-bold shadow-[1px_1px_0px_#292524]">
                    {activeEndpoint.method}
                  </span>
                  <h2 className="text-lg font-extrabold text-stone-900">{activeEndpoint.name}</h2>
                </div>
                <div className="font-mono text-xs text-rose-600 font-bold mt-1">
                  {activeEndpoint.endpoint}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-900 border-2 border-stone-800 px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0px_#292524]">
                  Cost: Free & Unlimited
                </span>

                <button
                  onClick={() => onOpenPlayground(activeEndpoint.id)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-rose-400 hover:bg-rose-500 text-stone-900 border-2 border-stone-800 px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-stone-900" />
                  <span>Run in Playground</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
              {activeEndpoint.description}
            </p>

            {/* Parameters Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Parameters Table:
              </h3>
              <div className="overflow-x-auto rounded-2xl border-2 border-stone-800 shadow-[2px_2px_0px_#292524]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF7F2] text-stone-700 border-b-2 border-stone-800 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">In</th>
                      <th className="py-2.5 px-3">Required</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-stone-800/10 bg-white text-stone-800 font-medium">
                    {activeEndpoint.parameters.map((param) => (
                      <tr key={param.name}>
                        <td className="py-2.5 px-3 text-rose-700 font-bold">{param.name}</td>
                        <td className="py-2.5 px-3 text-stone-500">{param.type}</td>
                        <td className="py-2.5 px-3 text-stone-500">{param.in}</td>
                        <td className="py-2.5 px-3">
                          {param.required ? (
                            <span className="text-rose-700 font-bold">Yes</span>
                          ) : (
                            <span className="text-stone-500">No</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-800">{param.default}</td>
                        <td className="py-2.5 px-3 font-sans text-stone-600">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Examples */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Code Snippet:
                </h3>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl border-2 border-stone-800 text-xs">
                  <button
                    onClick={() => setLangTab('curl')}
                    className={`px-2.5 py-0.5 rounded-lg font-bold cursor-pointer transition-all ${
                      langTab === 'curl' ? 'bg-white text-stone-900 border border-stone-800 shadow-sm' : 'text-stone-600'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setLangTab('js')}
                    className={`px-2.5 py-0.5 rounded-lg font-bold cursor-pointer transition-all ${
                      langTab === 'js' ? 'bg-white text-stone-900 border border-stone-800 shadow-sm' : 'text-stone-600'
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setLangTab('python')}
                    className={`px-2.5 py-0.5 rounded-lg font-bold cursor-pointer transition-all ${
                      langTab === 'python' ? 'bg-white text-stone-900 border border-stone-800 shadow-sm' : 'text-stone-600'
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl border-2 border-stone-800 bg-stone-900 p-4 font-mono text-xs text-amber-200 overflow-x-auto shadow-inner">
                <button
                  onClick={copyCode}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                  title="Copy snippet"
                >
                  {copiedSnippet ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <pre>{getCodeSnippet()}</pre>
              </div>
            </div>

            {/* Expected Sample JSON */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Sample Response:
              </h3>
              <pre className="max-h-64 overflow-auto rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] p-4 font-mono text-xs text-stone-900">
                {JSON.stringify(activeEndpoint.sampleResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
