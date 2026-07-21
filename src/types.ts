export interface CurrentWeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  is_day: boolean;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed: number;
  wind_direction: number;
}

export interface DailyWeatherData {
  dates: string[];
  weather_codes: number[];
  temp_max: number[];
  temp_min: number[];
  apparent_temp_max: number[];
  apparent_temp_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  precipitation_sum: number[];
  rain_probability: number[];
}

export interface HourlyWeatherData {
  times: string[];
  temperatures: number[];
  apparent_temperatures: number[];
  rain_probabilities: number[];
  weather_codes: number[];
  uv_indices: number[];
  wind_speeds: number[];
}

export interface LocationData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  admin1?: string; // State / Province
  timezone: string;
}

export interface WeatherNotification {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  severity: 'low' | 'medium' | 'high';
  read: boolean;
}

export interface AIAdvice {
  summary: string;
  clothingAdvice: string;
  activities: string[];
  safetyAlerts: string[];
  funFact: string;
}

export interface WeatherTriggerRule {
  id: string;
  name: string;
  type: 'temp_above' | 'temp_below' | 'rain_prob_above' | 'uv_above' | 'wind_above';
  threshold: number;
  enabled: boolean;
}
