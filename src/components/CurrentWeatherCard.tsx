import React from "react";
import { CurrentWeatherData, DailyWeatherData } from "../types";
import { getWeatherDetails } from "../utils";
import { 
  Compass, 
  Droplets, 
  Wind, 
  Cloud, 
  Sunrise, 
  Sunset, 
  Thermometer,
  Gauge
} from "lucide-react";
import { motion } from "motion/react";

interface CurrentWeatherCardProps {
  current: CurrentWeatherData;
  daily: DailyWeatherData;
  locationName: string;
}

export default function CurrentWeatherCard({
  current,
  daily,
  locationName,
}: CurrentWeatherCardProps) {
  const details = getWeatherDetails(current.weather_code, current.is_day);
  const WeatherIcon = details.icon;

  return (
    <div
      id="current-weather-card"
      className="relative overflow-hidden rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6 text-white bg-white/5 backdrop-blur-xl"
    >
      {/* Dynamic ambient glow spots corresponding to weather type */}
      <div 
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-500" 
        style={{ backgroundColor: details.themeColor }}
      />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* City and status bar */}
      <div className="flex justify-between items-start z-10">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400/80">
            Current Status
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-0.5 text-white">{locationName}</h2>
        </div>
        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 border border-white/5">
          {details.label}
        </span>
      </div>

      {/* Primary values: large temp + weather icon */}
      <div className="flex justify-between items-center z-10 py-2">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <h3 className="text-7xl md:text-8xl font-light leading-none tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              {Math.round(current.temp)}°
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold mt-1.5">
            <Thermometer className="w-3.5 h-3.5 text-slate-400" />
            <span>Feels like {Math.round(current.feels_like)}°C</span>
          </div>
        </div>

        {/* Scaled animation of large weather icon */}
        <div className="p-4 bg-white/5 backdrop-blur-xs rounded-3xl border border-white/10 shadow-lg">
          <WeatherIcon className={`w-14 h-14 md:w-18 md:h-18 drop-shadow-md shrink-0 ${details.iconColor}`} />
        </div>
      </div>

      {/* High priority parameters: bento grid style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 z-10 mt-2">
        {/* Humidity */}
        <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Humidity</span>
          </div>
          <span className="text-base font-extrabold text-white">{current.humidity}%</span>
        </div>

        {/* Wind Speed & Dir */}
        <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <Wind className="w-3.5 h-3.5 text-indigo-400" />
            <span>Wind</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold text-white">{current.wind_speed} km/h</span>
            <Compass 
              className="w-3.5 h-3.5 text-slate-400" 
              style={{ transform: `rotate(${current.wind_direction}deg)` }}
            />
          </div>
        </div>

        {/* Precipitation */}
        <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Precipitation</span>
          </div>
          <span className="text-base font-extrabold text-white">{current.precipitation} mm</span>
        </div>

        {/* Cloud Cover */}
        <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Cloud Cover</span>
          </div>
          <span className="text-base font-extrabold text-white">{current.cloud_cover}%</span>
        </div>
      </div>

      {/* Secondary metadata: Sunrise and Sunset */}
      <div className="flex justify-between items-center pt-3 border-t border-white/10 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
            <Sunrise className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sunrise</span>
            <span className="text-xs font-bold text-white">
              {new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
            <Sunset className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex flex-col text-right sm:text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sunset</span>
            <span className="text-xs font-bold text-white">
              {new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
