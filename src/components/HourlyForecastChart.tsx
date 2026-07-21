import React, { useState } from "react";
import { HourlyWeatherData } from "../types";
import { formatHour, getWeatherDetails } from "../utils";
import { Thermometer, CloudRain, Sun } from "lucide-react";
import { motion } from "motion/react";

interface HourlyForecastChartProps {
  hourly: HourlyWeatherData;
}

export default function HourlyForecastChart({ hourly }: HourlyForecastChartProps) {
  const [activeTab, setActiveTab] = useState<"temp" | "rain" | "wind">("temp");

  // Take the next 24 hours for a clean chart
  const subsetHours = hourly.times.slice(0, 24);
  const subsetTemps = hourly.temperatures.slice(0, 24);
  const subsetPrecip = hourly.rain_probabilities.slice(0, 24);
  const subsetWind = hourly.wind_speeds.slice(0, 24);
  const subsetCodes = hourly.weather_codes.slice(0, 24);

  // SVG dimensions for trend line
  const width = 1000;
  const height = 150;
  const padding = 25;

  const getChartData = () => {
    switch (activeTab) {
      case "temp":
        return {
          values: subsetTemps,
          color: "#22d3ee",
          gradientId: "tempGradient",
          unit: "°C",
          label: "Temperature",
        };
      case "rain":
        return {
          values: subsetPrecip,
          color: "#6366f1",
          gradientId: "rainGradient",
          unit: "%",
          label: "Rain Probability",
        };
      case "wind":
        return {
          values: subsetWind,
          color: "#a855f7",
          gradientId: "windGradient",
          unit: " km/h",
          label: "Wind Speed",
        };
    }
  };

  const currentData = getChartData();
  const minVal = Math.min(...currentData.values);
  const maxVal = Math.max(...currentData.values);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // Calculate coordinates
  const points = subsetHours.map((_, index) => {
    const x = padding + (index * (width - padding * 2)) / (subsetHours.length - 1);
    // Invert Y coordinate so higher values are higher up in the chart
    const y =
      height -
      padding -
      ((currentData.values[index] - minVal) * (height - padding * 2)) / valRange;
    return { x, y };
  });

  // Create smooth bezier curve path
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  // Create area path under line
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : "";

  return (
    <div id="hourly-forecast-chart" className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            24-Hour Trends
          </h3>
          <p className="text-xs text-slate-400 font-medium">Hourly meteorological trends for the upcoming day</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            id="tab-hourly-temp"
            onClick={() => setActiveTab("temp")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "temp"
                ? "bg-white/10 text-cyan-400 border border-white/10 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Temp</span>
          </button>
          <button
            id="tab-hourly-rain"
            onClick={() => setActiveTab("rain")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "rain"
                ? "bg-white/10 text-indigo-400 border border-white/10 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Precip</span>
          </button>
          <button
            id="tab-hourly-wind"
            onClick={() => setActiveTab("wind")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "wind"
                ? "bg-white/10 text-purple-400 border border-white/10 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Wind</span>
          </button>
        </div>
      </div>

      {/* SVG Chart display in horizontal scrollable wrapper */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="min-w-[800px] h-[190px] relative pt-2">
          {/* Main SVG */}
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              {/* Temperature gradient */}
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
              </linearGradient>
              {/* Rain gradient */}
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
              {/* Wind gradient */}
              <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

            {/* Render Area fill with standard animations via path updates */}
            {points.length > 0 && (
              <path
                d={areaD}
                fill={`url(#${currentData.gradientId})`}
              />
            )}

            {/* Render Trend Line */}
            {points.length > 0 && (
              <path
                d={pathD}
                fill="none"
                stroke={currentData.color}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Horizontal timeline markers */}
            {points.map((point, i) => {
              const code = subsetCodes[i];
              return (
                <g key={i}>
                  {/* Anchor Circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={currentData.color}
                    stroke="#03070a"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />
                  {/* Value label on top of point */}
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#f1f5f9"
                  >
                    {Math.round(currentData.values[i])}{currentData.unit}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Time Labels + Weather Icons below */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[25px]" style={{ width: `${width}px` }}>
            {subsetHours.map((hour, i) => {
              const code = subsetCodes[i];
              const weather = getWeatherDetails(code);
              const WeatherIcon = weather.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                  style={{
                    position: "absolute",
                    left: `${padding + (i * (width - padding * 2)) / (subsetHours.length - 1)}px`,
                    transform: "translateX(-50%)",
                    width: "40px"
                  }}
                >
                  <WeatherIcon className={`w-4 h-4 ${weather.iconColor}`} />
                  <span className="text-[10px] text-slate-400 font-semibold">{formatHour(hour)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
