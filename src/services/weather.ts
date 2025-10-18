import { Property } from "@prisma/client";
import pLimit from "p-limit";
import { redis, WEATHER_CACHE_TTL, CONCURRENCY_LIMIT } from "../database/redis";

export type Weather = {
  temperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
};

export type EnrichedProperty = Property & { weather: Weather };

// Fetch weather for a single property with Redis caching
export async function fetchWeatherWithCache(property: Property): Promise<Weather> {
  const key = `property:weather:${property.id}`;
  const cached = await redis.get(key);

  if (cached) return JSON.parse(cached);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${property.lat}&longitude=${property.lng}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const res = await fetch(url);
    const data = await res.json();

    const weather: Weather = {
      temperature: data.current?.temperature_2m ?? null,
      humidity: data.current?.relative_humidity_2m ?? null,
      weatherCode: data.current?.weather_code ?? null,
    };

    await redis.set(key, JSON.stringify(weather), "EX", WEATHER_CACHE_TTL);
    return weather;
  } catch (err) {
    console.error(`[Weather] Fetch failed for property ${property.id}:`, err);
    return { temperature: null, humidity: null, weatherCode: null };
  }
}

// Fetch weather for multiple properties concurrently
export async function fetchWeatherForProperties(properties: Property[]): Promise<EnrichedProperty[]> {
  const limit = pLimit(CONCURRENCY_LIMIT);

  const results = await Promise.allSettled(
    properties.map((p) =>
      limit(async () => {
        const weather = await fetchWeatherWithCache(p);
        return { ...p, weather };
      })
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EnrichedProperty> => r.status === "fulfilled")
    .map((r) => r.value);
}
