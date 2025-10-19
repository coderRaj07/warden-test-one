import { Request, Response } from "express";
import { prisma } from "../database/prisma";
import { buildPropertyWhere, filterPropertiesByWeather } from "../services/properties";
import { fetchBatchWeather } from "../services/weather";
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

    const properties = await prisma.property.findMany({
      skip,
      take,
      where: buildPropertyWhere(req),
      orderBy: { createdAt: "desc" },
    });

    if (!properties.length)
      return res.json(serializeResponse({ page, count: 0, results: [] }));

    // Batch fetch weather for all coordinates at once
    const enriched = await fetchBatchWeather(properties);

    // Apply filters
    const filtered = filterPropertiesByWeather(
      enriched,
      tempMin,
      tempMax,
      humidityMin,
      humidityMax,
      weatherCodes
    );

    return res.json(  
      serializeResponse({ 
        page, 
        count: filtered.length, 
        results: filtered 
      }));
  } catch (err) {
    console.error("[Properties] Error fetching properties:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
