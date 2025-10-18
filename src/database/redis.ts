import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set in .env");
}

export const redis = new Redis(process.env.REDIS_URL);

// Log Redis errors
redis.on("error", (err: Error) => {
  console.error("[Redis] Error:", err.message);
});

// Config
export const WEATHER_CACHE_TTL = Number(process.env.WEATHER_CACHE_TTL) || 300;
export const CONCURRENCY_LIMIT = Number(process.env.WEATHER_CONCURRENCY) || 5;