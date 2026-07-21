import React, { useState, useEffect, useRef } from "react";
import { 
  CurrentWeatherData, 
  DailyWeatherData, 
  HourlyWeatherData, 
  LocationData, 
  WeatherNotification, 
  WeatherTriggerRule,
  AIAdvice
} from "./types";
import { getWeatherDetails } from "./utils";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import HourlyForecastChart from "./components/HourlyForecastChart";
import ExtendedForecast from "./components/ExtendedForecast";
import AIAdvisorPanel from "./components/AIAdvisorPanel";
import WeatherAlertCenter from "./components/WeatherAlertCenter";
import { 
  Search, 
  MapPin, 
  Loader2, 
  CloudSun, 
  Bell, 
  AlertOctagon,
  X 
} from "lucide-react";

// Default seed location is San Francisco
const DEFAULT_LOCATION: LocationData = {
  id: 5391959,
  name: "San Francisco",
  latitude: 37.77493,
  longitude: -122.41941,
  country: "United States",
  admin1: "California",
  timezone: "America/Los_Angeles",
};

const DEFAULT_RULES: WeatherTriggerRule[] = [
  { id: "1", name: "High Temp Alert (>30°C)", type: "temp_above", threshold: 30, enabled: true },
  { id: "2", name: "Freezing Warning (<3°C)", type: "temp_below", threshold: 3, enabled: true },
  { id: "3", name: "Heavy Rain Prob (>75%)", type: "rain_prob_above", threshold: 75, enabled: true },
  { id: "4", name: "High UV Warning (>7)", type: "uv_above", threshold: 7, enabled: false },
];

export default function App() {
  // State managers
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Weather data states
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [dailyWeather, setDailyWeather] = useState<DailyWeatherData | null>(null);
  const [hourlyWeather, setHourlyWeather] = useState<HourlyWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gemini AI states
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Notifications and triggers
  const [notifications, setNotifications] = useState<WeatherNotification[]>([]);
  const [triggerRules, setTriggerRules] = useState<WeatherTriggerRule[]>(DEFAULT_RULES);
  const [sseStatus, setSseStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [activeToast, setActiveToast] = useState<WeatherNotification | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Connect SSE Server push alerts
  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setSseStatus("connecting");
    const es = new EventSource("/api/notifications/subscribe");
    eventSourceRef.current = es;

    es.onopen = () => {
      setSseStatus("connected");
      console.log("SSE connected successfully.");
    };

    es.onerror = (err) => {
      console.error("SSE error, reconnecting in 5s", err);
      setSseStatus("disconnected");
      es.close();
      reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
    };

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          const payload: WeatherNotification = {
            ...data.payload,
            read: false,
          };
          // Push notification log
          setNotifications((prev) => [payload, ...prev]);
          // Display active in-app float toast
          setActiveToast(payload);
        }
      } catch (err) {
        console.error("Failed to parse SSE event data", err);
      }
    });
  };

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Clear float toast automatically after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Handle outside click to close geocode search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Geocoding search fetcher
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            searchQuery
          )}&count=6&language=en&format=json`
        );
        const data = await res.json();
        if (data.results) {
          const results: LocationData[] = data.results.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            country: loc.country,
            admin1: loc.admin1,
            timezone: loc.timezone,
          }));
          setSearchResults(results);
          setShowSearchDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Weather query fetcher
  const fetchWeather = async (location: LocationData) => {
    setLoading(true);
    setError(null);
    try {
      const timezone = location.timezone || "auto";
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,apparent_temperature,rain_probability,weather_code,uv_index,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=${encodeURIComponent(timezone)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather forecast service is currently unreachable.");
      const data = await res.json();

      const current: CurrentWeatherData = {
        temp: data.current.temperature_2m,
        feels_like: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        is_day: data.current.is_day === 1,
        precipitation: data.current.precipitation,
        weather_code: data.current.weather_code,
        cloud_cover: data.current.cloud_cover,
        wind_speed: data.current.wind_speed_10m,
        wind_direction: data.current.wind_direction_10m,
      };

      const daily: DailyWeatherData = {
        dates: data.daily.time,
        weather_codes: data.daily.weather_code,
        temp_max: data.daily.temperature_2m_max,
        temp_min: data.daily.temperature_2m_min,
        apparent_temp_max: data.daily.apparent_temperature_max,
        apparent_temp_min: data.daily.apparent_temperature_min,
        sunrise: data.daily.sunrise,
        sunset: data.daily.sunset,
        uv_index_max: data.daily.uv_index_max,
        precipitation_sum: data.daily.precipitation_sum,
        rain_probability: data.daily.precipitation_probability_max,
      };

      const hourly: HourlyWeatherData = {
        times: data.hourly.time,
        temperatures: data.hourly.temperature_2m,
        apparent_temperatures: data.hourly.apparent_temperature,
        rain_probabilities: data.hourly.rain_probability,
        weather_codes: data.hourly.weather_code,
        uv_indices: data.hourly.uv_index,
        wind_speeds: data.hourly.wind_speed_10m,
      };

      setCurrentWeather(current);
      setDailyWeather(daily);
      setHourlyWeather(hourly);

      // Evaluate custom threshold rules
      checkThresholdTriggers(current, daily, location.name);
    } catch (err: any) {
      console.error("Forecasting failed", err);
      setError(err.message || "Failed to query weather predictions.");
    } finally {
      setLoading(false);
    }
  };

  // Check custom warning triggers
  const checkThresholdTriggers = (
    current: CurrentWeatherData,
    daily: DailyWeatherData,
    locName: string
  ) => {
    triggerRules.forEach((rule) => {
      if (!rule.enabled) return;

      let triggered = false;
      let alertTitle = "";
      let alertBody = "";
      let type: 'warning' | 'alert' = 'warning';

      if (rule.type === "temp_above" && current.temp > rule.threshold) {
        triggered = true;
        alertTitle = "High Temperature Threshold Exceeded";
        alertBody = `Warning: Current temperature in ${locName} is ${current.temp}°C, exceeding your target threshold of ${rule.threshold}°C.`;
        type = "alert";
      } else if (rule.type === "temp_below" && current.temp < rule.threshold) {
        triggered = true;
        alertTitle = "Freezing Temperature Warning";
        alertBody = `Notice: Current temperature in ${locName} dropped to ${current.temp}°C, falling below your alert limit of ${rule.threshold}°C.`;
        type = "alert";
      } else if (rule.type === "rain_prob_above" && daily.rain_probability[0] > rule.threshold) {
        triggered = true;
        alertTitle = "High Rain Likelihood Forecasted";
        alertBody = `Heads up: Precipitation probability for today in ${locName} is high at ${daily.rain_probability[0]}%, topping your alert threshold of ${rule.threshold}%.`;
        type = "warning";
      } else if (rule.type === "uv_above" && daily.uv_index_max[0] > rule.threshold) {
        triggered = true;
        alertTitle = "Extreme Solar Radiation Alert";
        alertBody = `Solar warning: UV index in ${locName} today is expected to reach ${daily.uv_index_max[0]}, which tops your UV limit of ${rule.threshold}.`;
        type = "alert";
      }

      if (triggered) {
        // Build new weather alert log entry
        const isDuplicate = notifications.some(
          (notif) => notif.title === alertTitle && (Date.now() - new Date(notif.timestamp).getTime() < 10 * 60000)
        );

        if (!isDuplicate) {
          const payload: WeatherNotification = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            title: alertTitle,
            body: alertBody,
            type,
            severity: "medium",
            read: false,
          };
          setNotifications((prev) => [payload, ...prev]);
          setActiveToast(payload);
        }
      }
    });
  };

  // Generate Gemini AI Advisor report
  const handleGenerateAIAdvice = async () => {
    if (!currentWeather || !dailyWeather) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/weather/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: `${selectedLocation.name}, ${selectedLocation.country}`,
          current: {
            temp: currentWeather.temp,
            feels_like: currentWeather.feels_like,
            humidity: currentWeather.humidity,
            weather_code: currentWeather.weather_code,
            precipitation: currentWeather.precipitation,
            wind_speed: currentWeather.wind_speed,
          },
          daily: {
            temp_max: dailyWeather.temp_max,
            temp_min: dailyWeather.temp_min,
            rain_probability: dailyWeather.rain_probability,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate personal meteorological advice.");
      }

      const data = await response.json();
      setAiAdvice(data);
    } catch (err: any) {
      console.error("Gemini insight failed", err);
      setAiError(err.message || "Could not retrieve AI weather details.");
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch weather automatically when location shifts
  useEffect(() => {
    fetchWeather(selectedLocation);
    // Reset advice when location changes
    setAiAdvice(null);
  }, [selectedLocation]);

  // Select location from search
  const handleSelectLocation = (loc: LocationData) => {
    setSelectedLocation(loc);
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  return (
    <div className="min-h-screen bg-[#03070a] text-white font-sans selection:bg-cyan-500 selection:text-white pb-16 relative overflow-hidden">
      {/* Ambient background particles and spotlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-cyan-900/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Top Banner Navigation Bar */}
      <header className="sticky top-0 bg-[#03070a]/60 backdrop-blur-md border-b border-white/5 z-40 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col xs:flex-row justify-between items-center gap-4">
          
          {/* Logo Name */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <CloudSun className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">AetherWeather</h1>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Hyperlocal Accuracy</span>
            </div>
          </div>

          {/* Location Autocomplete Search Bar */}
          <div className="w-full xs:max-w-md relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="location-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search global cities..."
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 backdrop-blur-md text-xs font-semibold text-white placeholder-slate-400 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-500 transition duration-200"
              />
              {searchLoading ? (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400 animate-spin" />
              ) : searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown display */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d121f] border border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col backdrop-blur-xl">
                {searchResults.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2.5 transition border-b border-white/5 last:border-0 text-white"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">{loc.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {loc.admin1 && `${loc.admin1}, `}
                        {loc.country}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Canvas Wrapper */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-300 font-bold animate-pulse">
              Measuring ambient atmospheric readings for {selectedLocation.name}...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center flex flex-col gap-3">
            <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Atmospheric Data Fetch Blocked</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            <button
              onClick={() => fetchWeather(selectedLocation)}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Forecasts & Trends (2/3 width on large screens) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Primary Current Weather Display */}
              {currentWeather && dailyWeather && (
                <CurrentWeatherCard
                  current={currentWeather}
                  daily={dailyWeather}
                  locationName={`${selectedLocation.name}, ${selectedLocation.country}`}
                />
              )}

              {/* Hourly trend SVG chart */}
              {hourlyWeather && (
                <HourlyForecastChart hourly={hourlyWeather} />
              )}

              {/* Daily 7-day extended collapsible cards list */}
              {dailyWeather && (
                <ExtendedForecast daily={dailyWeather} />
              )}
            </div>

            {/* Right Column: AI Assistant & Alerts Desk */}
            <div className="flex flex-col gap-6">
              
              {/* Gemini AI advisory panel */}
              <AIAdvisorPanel
                advice={aiAdvice}
                loading={aiLoading}
                error={aiError}
                onRefresh={handleGenerateAIAdvice}
                locationName={selectedLocation.name}
              />

              {/* Alerts Center with Live server SSE subscribers */}
              <WeatherAlertCenter
                notifications={notifications}
                setNotifications={setNotifications}
                triggerRules={triggerRules}
                setTriggerRules={setTriggerRules}
                sseStatus={sseStatus}
                connectSSE={connectSSE}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating toast notification alert popup */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-[#0d121f] text-white p-4 rounded-2xl border border-white/10 shadow-2xl z-50 flex items-start gap-3 animate-slide-up backdrop-blur-xl">
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl mt-0.5 shrink-0">
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 pr-4">
            <span className="text-xs font-extrabold text-white leading-tight">
              {activeToast.title}
            </span>
            <p className="text-[10px] text-slate-300 leading-normal font-semibold">
              {activeToast.body}
            </p>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
