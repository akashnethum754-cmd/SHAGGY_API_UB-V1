import React, { useState } from 'react';
import { KeyRound, Copy, Check, RefreshCw, Shield, CheckCircle2, Heart } from 'lucide-react';

export const KeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('sk_readyapi_live_89f02c91a7e24b8109d');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      const randomHex = Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setApiKey(`sk_readyapi_live_${randomHex}`);
      setRegenerating(false);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="border-b-2 border-stone-800/15 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-200 border-2 border-stone-800 flex items-center justify-center shadow-[1.5px_1.5px_0px_#292524]">
            <KeyRound className="w-4 h-4 text-stone-900" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            API Key & Client Access
          </h1>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-stone-800 shadow-[1px_1px_0px_#292524]">
            Free Developer Tier
          </span>
        </div>
        <p className="text-xs text-stone-500 font-medium mt-1">
          Use this optional developer key when integrating CineSubz scraping into your custom client apps or bots.
        </p>
      </div>

      {/* API Key Box */}
      <div className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-6 space-y-5 shadow-[4px_4px_0px_#292524]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Developer Token:
          </span>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-stone-800 font-bold shadow-[1px_1px_0px_#292524] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Production Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 rounded-2xl bg-[#FAF7F2] border-2 border-stone-800 px-4 py-3 font-mono text-xs text-stone-900 truncate select-all shadow-[2px_2px_0px_#292524]">
            {apiKey}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl bg-amber-200 hover:bg-amber-300 border-2 border-stone-800 px-4 py-3 text-xs font-bold text-stone-900 shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              {copiedKey ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-800">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-800" />
                  <span>Copy Key</span>
                </>
              )}
            </button>

            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              title="Roll new API Key"
              className="flex items-center justify-center rounded-2xl border-2 border-stone-800 bg-[#FAF7F2] hover:bg-white px-3.5 py-3 text-xs font-bold text-stone-800 shadow-[2px_2px_0px_#292524] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        <p className="text-xs text-stone-600 font-medium leading-relaxed">
          Optional: Pass via HTTP header <code className="text-rose-700 font-mono font-bold">Authorization: Bearer {'<KEY>'}</code> or simply make direct GET calls to <code className="text-rose-700 font-mono font-bold">/api/v1/movies/...</code>
        </p>
      </div>

      {/* Free Quotas Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl border-2 border-stone-800 bg-rose-50/80 p-5 space-y-2.5 shadow-[3.5px_3.5px_0px_#292524]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-400" /> Free Plan
            </span>
            <span className="font-mono text-xs font-bold text-rose-800 bg-white border border-stone-800 px-2 py-0.5 rounded-full">
              Unlimited
            </span>
          </div>

          <p className="text-xs text-stone-600 font-medium">
            No coin deductions, no paywalls, and no countdowns. Run as many movie searches and download scrapes as you like!
          </p>
        </div>

        <div className="rounded-3xl border-2 border-stone-800 bg-sky-50/80 p-5 space-y-2.5 shadow-[3.5px_3.5px_0px_#292524]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-600" /> Fair Usage Limit
            </span>
            <span className="font-mono text-xs font-bold text-sky-800 bg-white border border-stone-800 px-2 py-0.5 rounded-full">
              120 RPM
            </span>
          </div>

          <div className="space-y-1 text-xs text-stone-700 font-mono font-medium">
            <div className="flex justify-between">
              <span className="text-stone-500">Max requests:</span>
              <span className="text-stone-900 font-bold">120 per minute</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Uptime:</span>
              <span className="text-emerald-700 font-bold">99.7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
