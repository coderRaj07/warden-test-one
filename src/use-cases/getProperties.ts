import { Request, Response } from "express";
import { prisma } from "../database/prisma";
import { buildPropertyWhere, filterPropertiesByWeather } from "../services/properties";
import { fetchWeatherForProperties } from "../services/weather";
import { serializeResponse } from "../utils/serialize";

// Main handler
export const getProperties = async (req: Request, res: Response) => {
  try {
    // Pagination
    const page = Number(req.query.page) || 1;
    const take = 20;
    const skip = (page - 1) * take;

    // Weather filters
    const tempMin = req.query.tempMin ? Number(req.query.tempMin) : -Infinity;
    const tempMax = req.query.tempMax ? Number(req.query.tempMax) : Infinity;
    const humidityMin = req.query.humidityMin ? Number(req.query.humidityMin) : 0;
    const humidityMax = req.query.humidityMax ? Number(req.query.humidityMax) : 100;
    const weatherCodes = req.query.weatherCodes
      ? (req.query.weatherCodes as string).split(",").map(Number)
      : [];

    // Fetch properties (extra for post-filtering)
    const fetchCount = take * 3;
    const properties = await prisma.property.findMany({
      skip,
      take: fetchCount,
      where: buildPropertyWhere(req),
      orderBy: { createdAt: "desc" },
    });

    // Fetch weather concurrently
    const enrichedProperties = await fetchWeatherForProperties(properties);

    // Apply weather filters
    const filtered = filterPropertiesByWeather(enrichedProperties, tempMin, tempMax, humidityMin, humidityMax, weatherCodes);

    // Final pagination
    const paginated = filtered.slice(0, take);

    return res.json(  
      serializeResponse({
      page,
      count: paginated.length,
      results: paginated,
    }));
  } catch (err) {
    console.error("[Properties] Error fetching properties:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
