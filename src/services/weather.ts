import { Property } from "@prisma/client";
import { redis, WEATHER_CACHE_TTL } from "../database/redis";

type Weather = {
  temperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
};

async function fetchSingleWeather(lat: number, lng: number): Promise<Weather> {
  try {
    const cacheKey = `weather:${lat}:${lng}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const res = await fetch(url);
    const data = await res.json();

    const weather = {
      temperature: data?.current?.temperature_2m ?? null,
      humidity: data?.current?.relative_humidity_2m ?? null,
      weatherCode: data?.current?.weather_code ?? null,
    };

    await redis.set(cacheKey, JSON.stringify(weather), "EX", WEATHER_CACHE_TTL);
    return weather;
  } catch {
    return { temperature: null, humidity: null, weatherCode: null };
  }
}

export async function fetchBatchWeather(properties: Property[]) {
  // Only include valid coordinates
  const validProperties = properties.filter(
    (p) => typeof p.lat === "number" && typeof p.lng === "number"
  );

  const uniqueCoords = new Map<string, { lat: number; lng: number }>();

  validProperties.forEach((p) => {
    const key = `${p.lat}:${p.lng}`;
    if (!uniqueCoords.has(key)) uniqueCoords.set(key, { lat: p.lat!, lng: p.lng! });
  });

  if (uniqueCoords.size === 0) {
    return properties.map((p) => ({
      ...p,
      weather: { temperature: null, humidity: null, weatherCode: null },
    }));
  }

  const latitudes = [...uniqueCoords.values()].map((v) => v.lat).join(",");
  const longitudes = [...uniqueCoords.values()].map((v) => v.lng).join(",");

  const cacheKey = `weather-batch:${latitudes}:${longitudes}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    const data = JSON.parse(cached);
    return properties.map((p) => ({
      ...p,
      weather: data[`${p.lat}:${p.lng}`] ?? { temperature: null, humidity: null, weatherCode: null },
    }));
  }

  try {
    // Batched request for all properties
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const res = await fetch(url);
    const data = await res.json();

    const mapped: Record<string, Weather> = {};

    // Some versions of open-meteo batch response return `current` as array
    if (Array.isArray(data.current)) {
      data.current.forEach((w: any, idx: number) => {
        const key = [...uniqueCoords.keys()][idx];
        mapped[key] = {
          temperature: w.temperature_2m ?? null,
          humidity: w.relative_humidity_2m ?? null,
          weatherCode: w.weather_code ?? null,
        };
      });
    } else {
      // fallback for single response
      const onlyKey = [...uniqueCoords.keys()][0];
      mapped[onlyKey] = {
        temperature: data?.current?.temperature_2m ?? null,
        humidity: data?.current?.relative_humidity_2m ?? null,
        weatherCode: data?.current?.weather_code ?? null,
      };
    }

    await redis.set(cacheKey, JSON.stringify(mapped), "EX", WEATHER_CACHE_TTL);

    // Merge weather data into properties
    return properties.map((p) => ({
      ...p,
      weather:
        p.lat && p.lng
          ? mapped[`${p.lat}:${p.lng}`] ?? { temperature: null, humidity: null, weatherCode: null }
          : { temperature: null, humidity: null, weatherCode: null },
    }));
  } catch (err) {
    console.warn("Batch weather fetch failed, falling back to per-property fetch...", err);

    // Fallback gracefully
    const weatherData = await Promise.all(
      properties.map(async (p) => {
        if (!p.lat || !p.lng) {
          return { ...p, weather: { temperature: null, humidity: null, weatherCode: null } };
        }
        const weather = await fetchSingleWeather(p.lat, p.lng);
        return { ...p, weather };
      })
    );

    return weatherData;
  }
}
