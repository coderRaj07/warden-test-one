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
  return properties.filter((p) => {
    const { temperature, humidity, weatherCode } = p.weather;
    return (
      (temperature ?? 999) >= tempMin &&
      (temperature ?? -999) <= tempMax &&
      (humidity ?? 999) >= humidityMin &&
      (humidity ?? -999) <= humidityMax &&
      (weatherCodes.length === 0 || (weatherCode !== null && weatherCodes.includes(weatherCode)))
    );
  });
}
