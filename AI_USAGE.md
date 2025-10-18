
# AI Usage Log

This document details where AI or coding assistants were used in the **Warden Test One** project. AI use is acknowledged for efficiency, but all decisions and modifications were reviewed and adapted by the developer.

| # | File / Module                | AI Prompt / Task                                                            | AI Output / Suggestion                                                       | Human Verification / Modification / Discussion                                                                                           |
| - | ---------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `services/properties.ts`     | Modularize property search and filtering code, type-safe Prisma queries     | Suggested `buildPropertyWhere()` and `filterPropertiesByWeather()` functions | Reviewed and adjusted for null-safety, removed `mode` (case-insensitive) Prisma option; ensured performance for large datasets           |
| 2 | `services/weather.ts`        | Modularize shared code for weather API and Redis caching logic for cleaner structure        | Suggested `fetchWeatherWithCache()` and `fetchWeatherForProperties()`  functions        | Developer built the API integration and caching logic; AI only assisted in modularizing and optimizing concurrency handling. Verified caching worked as expected and failures were handled gracefully                                 |
| 3 | `use-cases/getProperties.ts` | Integrate modular services, serialize API response                          | Suggested wrapping response in `serializeResponse()`                         | Ensured correct pagination, weather filtering, and caching; adjusted fetch count for post-filtering; confirmed backend-only API decision |
| 4 | TypeScript / Runtime Errors  | Fix `TS2677` / `TS2345` errors and concurrency type issues                  | Recommended type refinements for `Promise.allSettled` instead of `Promise.all` | Applied fixes, verified compilation, ensured weather type never null in `EnrichedProperty`                                               |
| 5 | README / Setup               | Generate setup/run instructions, `.env.example`, Redis install guide        | Drafted setup instructions for Node, Prisma, Redis                           | Verified commands on Ubuntu, macOS, Windows; included Redis install instructions, seed step, environment variables                       |

---

**Summary:**

AI was primarily used to **suggest code structure, caching, and query patterns**. Every suggestion was critically reviewed:

* User clearly defined the intended architecture and integration behavior before refactoring began.
* TypeScript types, null-safety, and concurrency were manually verified.
* Discussed **whether to implement the 3rd-party weather API integration in the backend or frontend** — finalized that it should reside **in the backend** for better control, rate-limiting, and caching.
* Debated **whether to add Redis caching** since the original code lacked `.env` configuration and Redis integration; decided to include it for efficiency with a fallback if Redis is unavailable.
* Chose to **handle filtering and caching in the backend**, ensuring consistent data even if frontend requests vary.
* README and setup instructions were generated and refined based on **user’s own understanding of environment variables and schema setup flow**.

---

This approach ensures AI was a **guide**, while all **architectural and implementation decisions** were developer-led.

---