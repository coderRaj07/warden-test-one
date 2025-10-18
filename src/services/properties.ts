import { Prisma, Property } from "@prisma/client";
import { Request } from "express";

// Build strict search filter
export function buildPropertyWhere(req: Request): Prisma.PropertyWhereInput | undefined {
  const { searchText } = req.query;
  if (typeof searchText !== "string" || !searchText.trim()) return undefined;

  const query = (searchText as string).trim().toLowerCase();
  return {
    OR: [
      { name: { contains: query} as Prisma.StringFilter<'Property'> },
      { city: { contains: query } as Prisma.StringNullableFilter<'Property'> },
      { state: { contains: query } as Prisma.StringNullableFilter<'Property'> },
    ],
  };
}

// Apply weather filters
export function filterPropertiesByWeather(
    properties: (Property & { weather: { temperature: number | null; humidity: number | null; weatherCode: number | null } })[],
    tempMin: number,
    tempMax: number,
    humidityMin: number,
    humidityMax: number,
    weatherCodes: number[]
  ) {
    const weatherSet = new Set(weatherCodes);
  
    return properties.filter(({ weather }) => {
      const { temperature, humidity, weatherCode } = weather;
  
      if (temperature !== null && (temperature < tempMin || temperature > tempMax)) return false;
      if (humidity !== null && (humidity < humidityMin || humidity > humidityMax)) return false;
      if (weatherSet.size && (weatherCode === null || !weatherSet.has(weatherCode))) return false;
  
      return true;
    });
  }
  
