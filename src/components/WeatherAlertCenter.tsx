import React, { useState, useEffect } from "react";
import { WeatherNotification, WeatherTriggerRule } from "../types";
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Trash2, 
  Sliders, 
  Zap, 
  Check, 
  Radio, 
  Info, 
  AlertTriangle, 
  Flame, 
  CheckCircle,
  Volume2,
  VolumeX
} from "lucide-react";
import { formatDateTime } from "../utils";

interface WeatherAlertCenterProps {
  notifications: WeatherNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<WeatherNotification[]>>;
  triggerRules: WeatherTriggerRule[];
  setTriggerRules: React.Dispatch<React.SetStateAction<WeatherTriggerRule[]>>;
  sseStatus: "connected" | "connecting" | "disconnected";
  connectSSE: () => void;
}

export default function WeatherAlertCenter({
  notifications,
  setNotifications,
  triggerRules,
  setTriggerRules,
  sseStatus,
  connectSSE,
}: WeatherAlertCenterProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testNotificationType, setTestNotificationType] = useState<"severe" | "storm" | "heat" | "success">("severe");
  const [simulationLoading, setSimulationLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestWebNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support standard web notification APIs.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  // Triggers backend simulation push
  const handleSimulateAlert = async (type: typeof testNotificationType) => {
    setSimulationLoading(true);
    let title = "Severe Blizzard Warning";
    let body = "Blizzard conditions expected. Travel could be very hazardous. Avoid non-essential outdoor ventures.";
    let sseType: 'warning' | 'info' | 'success' | 'alert' = 'alert';
    let severity: 'low' | 'medium' | 'high' = 'high';

    if (type === "storm") {
      title = "Gale Warning";
      body = "Severe thunderstorms and gale-force wind gusts up to 75 km/h are developing over the central sectors.";
      sseType = "warning";
      severity = "high";
    } else if (type === "heat") {
      title = "Excessive Heat Advisory";
      body = "Heat index values expected to reach 41°C. Drink plenty of fluids, stay in an air-conditioned room.";
      sseType = "warning";
      severity = "medium";
    } else if (type === "success") {
      title = "Severe Weather Alert Lifted";
      body = "The gale and severe thunderstorm warnings have expired. Weather conditions are returning to normal.";
      sseType = "success";
      severity = "low";
    }

    try {
      const response = await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, type: sseType, severity }),
      });
      if (!response.ok) throw new Error("Trigger failed");
    } catch (err) {
      console.error("Simulation trigger failed", err);
      // Fallback local insert if SSE is disconnected
      const mockPayload: WeatherNotification = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        title,
        body,
        type: sseType,
        severity,
        read: false,
      };
      setNotifications((prev) => [mockPayload, ...prev]);

      // Sound play
      if (soundEnabled) {
        playNotificationSound(sseType);
      }
    } finally {
      setSimulationLoading(false);
    }
  };

  const playNotificationSound = (type: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "alert" || type === "warning") {
        // High pitched double-beep warning
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(880, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 220);
      } else {
        // Soft chime
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Sound play failed", e);
    }
  };

  // Sound triggering on new notifications
  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].read && soundEnabled) {
      playNotificationSound(notifications[0].type);
    }
  }, [notifications]);

  const toggleRule = (id: string) => {
    setTriggerRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <Flame className="w-4 h-4 text-rose-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  const getAlertStyle = (type: string, read: boolean) => {
    const opacity = read ? "opacity-50 bg-white/5 border-white/5" : "bg-white/10 border-white/10 shadow-lg";
    switch (type) {
      case "alert":
        return `${opacity} border-l-4 border-l-rose-500`;
      case "warning":
        return `${opacity} border-l-4 border-l-amber-500`;
      case "success":
        return `${opacity} border-l-4 border-l-emerald-500`;
      default:
        return `${opacity} border-l-4 border-l-cyan-500`;
    }
  };

  return (
    <div id="weather-alert-center" className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6 text-white">
      {/* Header section with real-time SSE push status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-400 animate-bounce" />
            Alerts & Push Center
          </h3>
          <p className="text-xs text-slate-400 font-medium">Real-time severe weather alert monitoring dashboard</p>
        </div>

        {/* SSE Status */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-2xl">
          <div className="relative flex h-2 w-2">
            {sseStatus === "connected" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                sseStatus === "connected"
                  ? "bg-emerald-500"
                  : sseStatus === "connecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            ></span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
            {sseStatus === "connected"
              ? "Live Server Push Active"
              : sseStatus === "connecting"
              ? "Reconnecting"
              : "Server Offline"}
          </span>
          {sseStatus === "disconnected" && (
            <button
              onClick={connectSSE}
              className="text-[10px] font-bold text-cyan-400 underline cursor-pointer hover:text-cyan-300"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Rules, Settings & Simulations */}
        <div className="flex flex-col gap-5">
          {/* Channel permissions & Sound toggles */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              Push Channels
            </h4>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Browser Native Push</p>
                    <p className="text-[10px] text-slate-400">Desktop-level native screen alerts</p>
                  </div>
                </div>
                {permission === "granted" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-1 rounded-md">
                    <Check className="w-3 h-3" /> Enabled
                  </span>
                ) : (
                  <button
                    onClick={requestWebNotificationPermission}
                    className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 px-2 py-1 rounded-md transition"
                  >
                    Grant Access
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-white">Alert Sound Chime</p>
                    <p className="text-[10px] text-slate-400">Audio chime on weather alerts</p>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition border ${
                    soundEnabled
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/25"
                      : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  {soundEnabled ? "Active" : "Muted"}
                </button>
              </div>
            </div>
          </div>

          {/* Custom Trigger Rules */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Threshold Trigger Rules
            </h4>
            <div className="flex flex-col gap-2">
              {triggerRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5 hover:border-white/15 transition"
                >
                  <div>
                    <span className="text-xs font-semibold text-white">{rule.name}</span>
                    <p className="text-[10px] text-slate-400">
                      {rule.type === "temp_above" && `Fires if temperature climbs above ${rule.threshold}°C`}
                      {rule.type === "temp_below" && `Fires if temperature sinks below ${rule.threshold}°C`}
                      {rule.type === "rain_prob_above" && `Fires if rain probability exceeds ${rule.threshold}%`}
                      {rule.type === "uv_above" && `Fires if UV Index rises above ${rule.threshold}`}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Push alert simulator */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Trigger Live Server Push
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pushes a simulated alert to the entire active SSE subscription list instantly
              </p>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              <button
                id="btn-push-severe"
                onClick={() => handleSimulateAlert("severe")}
                disabled={simulationLoading}
                className="flex-1 text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-xl transition disabled:opacity-50"
              >
                Severe Blizzard
              </button>
              <button
                id="btn-push-storm"
                onClick={() => handleSimulateAlert("storm")}
                disabled={simulationLoading}
                className="flex-1 text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-xl transition disabled:opacity-50"
              >
                Gale Thunderstorm
              </button>
              <button
                id="btn-push-heat"
                onClick={() => handleSimulateAlert("heat")}
                disabled={simulationLoading}
                className="flex-1 text-[10px] font-bold bg-orange-500/10 text-orange-300 border border-orange-500/20 hover:bg-orange-500/20 px-2.5 py-1.5 rounded-xl transition disabled:opacity-50"
              >
                Heat Warning
              </button>
              <button
                id="btn-push-clear"
                onClick={() => handleSimulateAlert("success")}
                disabled={simulationLoading}
                className="flex-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-xl transition disabled:opacity-50"
              >
                Alert Expired
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Notification Log History */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              Notification History ({notifications.length})
            </h4>

            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List display */}
          <div className="flex-1 min-h-[300px] max-h-[420px] overflow-y-auto bg-black/20 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                <div className="p-3 bg-white/5 border border-white/5 text-slate-400 rounded-full">
                  <BellOff className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">No Notifications Yet</p>
                <p className="text-[10px] text-slate-400 max-w-[200px]">
                  Simulate an alert from the left panel or subscribe to see live meteorological notifications!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border flex gap-3 relative group transition duration-200 ${getAlertStyle(
                    notif.type,
                    notif.read
                  )}`}
                >
                  {getAlertIcon(notif.type)}

                  <div className="flex flex-col gap-0.5 pr-4 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-xs font-bold leading-tight ${notif.read ? "text-slate-400" : "text-white"}`}>
                        {notif.title}
                      </span>
                    </div>
                    <p className={`text-[10.5px] leading-relaxed font-medium ${notif.read ? "text-slate-500" : "text-slate-300"}`}>
                      {notif.body}
                    </p>
                    <span className="text-[9px] text-slate-400 font-semibold mt-1">
                      {formatDateTime(notif.timestamp)}
                    </span>
                  </div>

                  {/* Actions (delete individual alert) */}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete notice"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
