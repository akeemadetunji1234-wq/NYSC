"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, Loader2, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface WeatherWidgetProps {
  state: string;
  className?: string;
}

export function WeatherWidget({ state, className }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<{ temp: number; description: string; main: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      if (!state) return;
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        if (!apiKey) {
          throw new Error("Missing OpenWeatherMap API Key");
        }

        // Clean up state name (e.g., "Kano State" -> "Kano")
        const cleanStateName = state.replace(/state/i, "").trim();

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${cleanStateName},ng&units=metric&appid=${apiKey}`
        );

        if (!res.ok) throw new Error("Failed to fetch weather");

        const data = await res.json();
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          main: data.weather[0].main,
        });
      } catch (err) {
        console.error("Weather error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [state]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl shadow-sm", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl shadow-sm", className)}>
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{state}</span>
      </div>
    );
  }

  let Icon = Cloud;
  if (weather.main === "Clear") Icon = Sun;
  if (weather.main === "Rain" || weather.main === "Drizzle") Icon = CloudRain;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-3 px-4 py-2.5 bg-gradient-to-br from-card to-card/50 backdrop-blur-md border border-border rounded-xl shadow-sm", className)}
    >
      <div className="p-1.5 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground leading-none">{weather.temp}°C</p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-1">
          {state} • {weather.description}
        </p>
      </div>
    </motion.div>
  );
}
