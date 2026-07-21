import React from "react";
import { AIAdvice, CurrentWeatherData, DailyWeatherData } from "../types";
import { Sparkles, Shirt, Activity, ShieldAlert, BookOpen, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface AIAdvisorPanelProps {
  advice: AIAdvice | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  locationName: string;
}

export default function AIAdvisorPanel({
  advice,
  loading,
  error,
  onRefresh,
  locationName,
}: AIAdvisorPanelProps) {
  return (
    <div id="ai-advisor-panel" className="bg-gradient-to-br from-slate-900 to-[#0a0c10] text-white rounded-3xl p-6 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col gap-6">
      {/* Visual background lights */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/25 rounded-xl text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">AI Weather Advisor</h3>
            <p className="text-xs text-slate-400 font-medium">Personalized forecast synthesis by Gemini 3.5</p>
          </div>
        </div>

        <button
          id="btn-ai-advice-refresh"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-xl transition duration-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Generate Tips</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="z-10 min-h-[140px] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-300 font-medium animate-pulse">
              Consulting Gemini for personalized {locationName} advice...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2">
            <p className="text-sm text-red-300 font-semibold">Could not retrieve AI Advice</p>
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={onRefresh}
              className="mt-2 self-start text-xs font-bold text-red-300 underline hover:text-red-200"
            >
              Try Again
            </button>
          </div>
        ) : advice ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary Banner (Spans Full Width on MD) */}
            <div className="md:col-span-2 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                Executive Synthesis
              </span>
              <p className="text-sm md:text-base font-semibold leading-relaxed text-white">
                {advice.summary}
              </p>
            </div>

            {/* Clothing Advisor */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Shirt className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">What to Wear</span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                {advice.clothingAdvice}
              </p>
            </div>

            {/* Fun Fact */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Meteorology Fact</span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 font-medium italic leading-relaxed">
                "{advice.funFact}"
              </p>
            </div>

            {/* Safety Alerts */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Safety warnings</span>
              </div>
              {advice.safetyAlerts && advice.safetyAlerts.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {advice.safetyAlerts.map((alert, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No current weather concerns.</p>
              )}
            </div>

            {/* Recommended Activities */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Recommended Activities</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {advice.activities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5"
                  >
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 font-bold px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <p className="text-sm text-slate-300 font-medium">
              Want smart AI wear tips and personalized activity recommendations for {locationName}?
            </p>
            <button
              onClick={onRefresh}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white text-xs font-bold rounded-xl hover:opacity-90 transition duration-200"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Forecast Analysis</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
