// Helper to serialize Prisma entities safely to JSON
export function serializeResponse<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }
  