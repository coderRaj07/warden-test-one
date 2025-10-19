import { Property } from "@prisma/client";
import { redis, WEATHER_CACHE_TTL } from "../database/redis";

type Weather = {
  temperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
};

function coordKey(lat: number, lng: number) {
  return `${lat.toFixed(6)}:${lng.toFixed(6)}`;
}

async function fetchSingleWeatherWithCache(lat: number, lng: number): Promise<Weather> {
  const key = coordKey(lat, lng);
  const cached = await redis.get(`weather:${key}`);
  if (cached) return JSON.parse(cached);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const res = await fetch(url);
    const data = await res.json();

    const weather: Weather = {
      temperature: data?.current?.temperature_2m ?? null,
      humidity: data?.current?.relative_humidity_2m ?? null,
      weatherCode: data?.current?.weather_code ?? null,
    };

    await redis.set(`weather:${key}`, JSON.stringify(weather), "EX", WEATHER_CACHE_TTL);
    return weather;
  } catch {
    return { temperature: null, humidity: null, weatherCode: null };
  }
}

export async function fetchBatchWeather(properties: Property[]) {
  const validProperties = properties.filter(
    (p) => typeof p.lat === "number" && typeof p.lng === "number"
  );

  // Create unique coordinate map
  const uniqueCoords = new Map<string, { lat: number; lng: number }>();
  validProperties.forEach((p) => {
    const key = coordKey(p.lat!, p.lng!);
    if (!uniqueCoords.has(key)) uniqueCoords.set(key, { lat: p.lat!, lng: p.lng! });
  });

  // Fetch all unique coordinates in parallel
  const weatherMap: Record<string, Weather> = {};
  await Promise.all(
    [...uniqueCoords.entries()].map(async ([key, { lat, lng }]) => {
      weatherMap[key] = await fetchSingleWeatherWithCache(lat, lng);
    })
  );

  // Merge weather into properties
  return properties.map((p) => ({
    ...p,
    weather:
      p.lat != null && p.lng != null
        ? weatherMap[coordKey(p.lat, p.lng)] ?? { temperature: null, humidity: null, weatherCode: null }
        : { temperature: null, humidity: null, weatherCode: null },
  }));
}
