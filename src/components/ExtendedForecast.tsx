import React, { useState } from "react";
import { DailyWeatherData } from "../types";
import { formatDay, formatDayFull, getWeatherDetails } from "../utils";
import { ChevronDown, ChevronUp, Droplets, Sun, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExtendedForecastProps {
  daily: DailyWeatherData;
}

export default function ExtendedForecast({ daily }: ExtendedForecastProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  return (
    <div id="extended-forecast" className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4 text-white">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          7-Day Extended Forecast
        </h3>
        <p className="text-xs text-slate-400 font-medium">Click on any day to inspect detailed predictions</p>
      </div>

      <div className="flex flex-col gap-2">
        {daily.dates.map((date, index) => {
          const code = daily.weather_codes[index];
          const weather = getWeatherDetails(code);
          const WeatherIcon = weather.icon;
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={date}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                isExpanded 
                  ? "border-cyan-500/30 bg-white/10 shadow-lg" 
                  : "border-white/5 bg-white/5 hover:border-white/15"
              }`}
            >
              {/* Main Summary Row */}
              <button
                id={`btn-expand-day-${index}`}
                onClick={() => toggleExpand(index)}
                className="w-full flex items-center justify-between p-4 cursor-pointer text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
                    <WeatherIcon className={`w-5 h-5 ${weather.iconColor}`} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 tracking-wider">
                      {formatDayFull(date)}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {index === 0 ? "Today" : index === 1 ? "Tomorrow" : formatDay(date)}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  {/* Rain Prob */}
                  <div className="hidden xs:flex items-center gap-1 text-xs text-slate-300 font-semibold">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{daily.rain_probability[index]}%</span>
                  </div>

                  {/* High / Low Temp */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">
                      {Math.round(daily.temp_max[index])}°
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      / {Math.round(daily.temp_min[index])}°
                    </span>
                  </div>

                  {/* Expansion indicator */}
                  <div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Collapsible Expansion Section */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/10 bg-black/20 flex flex-col gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Feels Like Max */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feels Max</span>
                      <span className="font-extrabold text-white">{Math.round(daily.apparent_temp_max[index])}°C</span>
                    </div>

                    {/* UV Index */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UV Max</span>
                      <span className="font-extrabold text-white">{daily.uv_index_max[index]}</span>
                    </div>

                    {/* Precipitation Sum */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precipitation</span>
                      <span className="font-extrabold text-white">{daily.precipitation_sum[index]} mm</span>
                    </div>

                    {/* Weather Outlook */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outlook</span>
                      <span className="font-extrabold text-cyan-400">{weather.label}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold px-1">
                    <span>
                      Sunrise: {new Date(daily.sunrise[index]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      Sunset: {new Date(daily.sunset[index]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
