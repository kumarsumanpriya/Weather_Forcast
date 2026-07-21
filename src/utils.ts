import { 
  Sun, 
  Moon, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  Snowflake, 
  CloudLightning, 
  CloudHail, 
  CloudRainWind, 
  Haze, 
  CloudSnow, 
  LucideIcon 
} from "lucide-react";

export interface WeatherCodeDetails {
  label: string;
  icon: LucideIcon;
  gradientClass: string;
  themeColor: string;
  iconColor: string;
}

export function getWeatherDetails(code: number, isDay: boolean = true): WeatherCodeDetails {
  // Map WMO codes: https://open-meteo.com/en/docs
  switch (code) {
    case 0:
      return {
        label: isDay ? "Sunny" : "Clear Sky",
        icon: isDay ? Sun : Moon,
        gradientClass: isDay 
          ? "from-amber-400 via-orange-400 to-sky-500 text-amber-950" 
          : "from-slate-900 via-slate-800 to-indigo-950 text-indigo-100",
        themeColor: isDay ? "#eab308" : "#1e1b4b",
        iconColor: isDay ? "text-amber-500" : "text-slate-300",
      };
    case 1:
    case 2:
    case 3:
      return {
        label: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast",
        icon: code === 3 ? Cloud : CloudSun,
        gradientClass: isDay 
          ? "from-sky-400 via-blue-400 to-slate-400 text-sky-950" 
          : "from-slate-900 via-blue-950 to-slate-800 text-blue-100",
        themeColor: isDay ? "#38bdf8" : "#0f172a",
        iconColor: isDay ? "text-sky-500" : "text-sky-300",
      };
    case 45:
    case 48:
      return {
        label: "Foggy",
        icon: Haze,
        gradientClass: isDay 
          ? "from-slate-300 via-zinc-400 to-slate-400 text-zinc-900" 
          : "from-zinc-900 via-slate-900 to-zinc-800 text-zinc-200",
        themeColor: "#a1a1aa",
        iconColor: "text-zinc-400",
      };
    case 51:
    case 53:
    case 55:
      return {
        label: "Light Drizzle",
        icon: CloudDrizzle,
        gradientClass: isDay 
          ? "from-cyan-400 via-sky-400 to-slate-400 text-cyan-950" 
          : "from-slate-900 via-cyan-950 to-slate-800 text-cyan-100",
        themeColor: "#22d3ee",
        iconColor: "text-cyan-500",
      };
    case 56:
    case 57:
      return {
        label: "Freezing Drizzle",
        icon: Snowflake,
        gradientClass: "from-indigo-300 via-blue-400 to-cyan-400 text-blue-950",
        themeColor: "#93c5fd",
        iconColor: "text-blue-400",
      };
    case 61:
    case 63:
    case 65:
      return {
        label: code === 61 ? "Light Rain" : code === 63 ? "Moderate Rain" : "Heavy Rain",
        icon: CloudRain,
        gradientClass: isDay 
          ? "from-blue-500 via-sky-600 to-slate-500 text-blue-500" 
          : "from-slate-950 via-slate-900 to-blue-950 text-blue-200",
        themeColor: "#3b82f6",
        iconColor: "text-blue-500",
      };
    case 66:
    case 67:
      return {
        label: "Freezing Rain",
        icon: CloudHail,
        gradientClass: "from-blue-900 via-cyan-800 to-slate-900 text-cyan-100",
        themeColor: "#0891b2",
        iconColor: "text-cyan-400",
      };
    case 71:
    case 73:
    case 75:
      return {
        label: code === 71 ? "Light Snow" : code === 73 ? "Moderate Snow" : "Heavy Snow",
        icon: Snowflake,
        gradientClass: "from-sky-200 via-blue-200 to-slate-100 text-slate-800",
        themeColor: "#e0f2fe",
        iconColor: "text-sky-400",
      };
    case 77:
      return {
        label: "Snow Grains",
        icon: Snowflake,
        gradientClass: "from-sky-300 via-indigo-100 to-slate-200 text-slate-800",
        themeColor: "#bae6fd",
        iconColor: "text-indigo-400",
      };
    case 80:
    case 81:
    case 82:
      return {
        label: "Showers",
        icon: CloudRainWind,
        gradientClass: "from-slate-500 via-blue-600 to-slate-700 text-blue-100",
        themeColor: "#2563eb",
        iconColor: "text-blue-500",
      };
    case 85:
    case 86:
      return {
        label: "Snow Showers",
        icon: CloudSnow,
        gradientClass: "from-indigo-200 via-sky-200 to-slate-300 text-slate-800",
        themeColor: "#c7d2fe",
        iconColor: "text-sky-300",
      };
    case 95:
      return {
        label: "Thunderstorm",
        icon: CloudLightning,
        gradientClass: "from-amber-600 via-slate-800 to-slate-950 text-amber-100",
        themeColor: "#d97706",
        iconColor: "text-amber-500",
      };
    case 96:
    case 99:
      return {
        label: "Severe Thunderstorm",
        icon: CloudLightning,
        gradientClass: "from-red-900 via-slate-900 to-black text-red-200",
        themeColor: "#b91c1c",
        iconColor: "text-red-500",
      };
    default:
      return {
        label: "Unknown Weather",
        icon: Cloud,
        gradientClass: "from-slate-400 via-zinc-500 to-zinc-600 text-white",
        themeColor: "#71717a",
        iconColor: "text-zinc-500",
      };
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}

export function formatHour(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', hour12: true });
  } catch {
    return timeStr;
  }
}

export function formatDay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString([], { weekday: 'short' });
  } catch {
    return dateStr;
  }
}

export function formatDayFull(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
