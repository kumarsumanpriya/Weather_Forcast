import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SSE Subscribers state
  let subscribers: express.Response[] = [];

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY environment variable is missing.");
  }

  // SSE endpoint for push notifications
  app.get("/api/notifications/subscribe", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    subscribers.push(res);
    console.log(`New SSE subscriber. Total subscribers: ${subscribers.length}`);

    // Send connection success event
    res.write(`data: ${JSON.stringify({ type: "connection", message: "Real-time push network active!" })}\n\n`);

    // Keep-alive heartbeat interval to prevent gateway timeouts
    const heartbeatInterval = setInterval(() => {
      res.write(":\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      subscribers = subscribers.filter((sub) => sub !== res);
      console.log(`SSE subscriber disconnected. Total subscribers: ${subscribers.length}`);
    });
  });

  // POST endpoint to trigger notifications
  app.post("/api/notifications/push", (req, res) => {
    const { title, body, type, severity } = req.body;
    const payload = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      title: title || "Weather Notice",
      body: body || "No additional details available.",
      type: type || "info", // "warning", "info", "success", "alert"
      severity: severity || "medium", // "low", "medium", "high"
    };

    const sseMessage = `data: ${JSON.stringify({ type: "notification", payload })}\n\n`;
    subscribers.forEach((sub) => {
      try {
        sub.write(sseMessage);
      } catch (err) {
        console.error("Error pushing to sub", err);
      }
    });

    res.json({ success: true, subscriberCount: subscribers.length, payload });
  });

  // POST endpoint for AI Forecast Insights
  app.post("/api/weather/insight", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API client not initialized. Check server configurations." });
      }

      const { location, current, daily } = req.body;
      if (!current || !daily) {
        return res.status(400).json({ error: "Current and daily forecast data are required." });
      }

      const prompt = `Analyze the weather forecast for ${location} and provide a personal weather report in JSON format.
Weather Data:
- Current Temp: ${current.temp}°C (feels like: ${current.feels_like}°C)
- Humidity: ${current.humidity}%
- Weather conditions: Code ${current.weather_code} (precipitation: ${current.precipitation}mm, wind: ${current.wind_speed}km/h)
- 7-Day Forecast Max Temperatures: ${daily.temp_max.join(", ")} °C
- 7-Day Forecast Min Temperatures: ${daily.temp_min.join(", ")} °C
- 7-Day Forecast Precipitation Probabilities: ${daily.rain_probability.join(", ")} %

Based on this, generate a JSON object with:
1. "summary": A friendly, encouraging 1-2 sentence overview of the weather.
2. "clothingAdvice": A 1-sentence tip on what to wear, accessories needed, etc.
3. "activities": An array of 3 recommended outdoor/indoor activities matching this weather.
4. "safetyAlerts": An array of safety warnings (e.g. UV exposure risk, storm caution, extreme temperatures, or "Clear day - no safety alerts!").
5. "funFact": A short, meteorology-related fun fact based on this specific weather pattern.

Response format MUST be raw JSON. Do not wrap inside Markdown blocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini model.");
      }

      const parsed = JSON.parse(text.trim());
      res.json(parsed);
    } catch (err: any) {
      console.error("Error running Gemini forecast:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI forecast insights." });
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
});
