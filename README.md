## 🏠 Property Weather Service

This project provides a backend API to fetch properties along with live weather information. It uses **MySQL** via Prisma, **Redis** for caching, and includes pagination, search, and weather filtering.

---

## Features

- Search properties by `name`, `city`, or `state`.
- Filter properties by temperature, humidity, and weather codes.
- Pagination support.
- Live weather fetching with **Redis caching**.
- Concurrency-limited requests for weather API.

---

## Prerequisites

- Node.js >= 18
- npm or yarn
- PostgreSQL
- Redis

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/coderRaj07/warden-test-one
cd warden-test-one
```
### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Setup `.env` file

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```



---

### 4. Redis Installation

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping
# Should return: PONG
```

#### macOS (Homebrew)

```bash
brew install redis
brew services start redis
redis-cli ping
# Should return: PONG
```

#### Windows

**Option 1: WSL (Ubuntu inside Windows)**
Follow the **Linux instructions** inside WSL.

**Option 2: Docker**

```bash
docker pull redis
docker run -p 6379:6379 --name redis-cache -d redis
docker exec -it redis-cache redis-cli ping
# Should return: PONG
```

---

### 5. Database Setup

```bash
# Generate Prisma client
npx prisma generate
```

---

### 6. Run the server

```bash
npm run dev
# or
ts-node src/index.ts
```

Server will run at `http://localhost:5000` (or PORT from `.env`).

---

### 7. API Usage

**Get Properties with optional filters:**

```
GET /get-properties?page=1&searchText=delhi&tempMin=20&tempMax=35&humidityMin=30&humidityMax=70&weatherCodes=0,1,2
```

Query Parameters:

* `page` (number) – pagination
* `searchText` (string) – search by name, city, or state
* `tempMin` / `tempMax` (number) – temperature filter
* `humidityMin` / `humidityMax` (number) – humidity filter
* `weatherCodes` (comma-separated numbers) – weather code filter

Response:

```json
{
  "page": 1,
  "count": 10,
  "results": [
    {
            "id": 433,
            "name": "Warden Hyderabad 183",
            "city": "Hyderabad",
            "state": "Telangana",
            "country": "India",
            "lat": 17.42453,
            "lng": 78.41783,
            "geohash5": "17.40,78.40",
            "isActive": false,
            "tags": [
                "laundry",
                "budget",
                "female-only",
                "near-metro",
                "parking",
                "cowork"
            ],
            "createdAt": "2025-10-08T03:18:03.669Z",
            "updatedAt": "2025-10-08T03:18:03.669Z",
            "weather": {
                "temperature": 29.3,
                "humidity": 55,
                "weatherCode": 2
            }
    }
  ]
}
```

---

### 8. Notes

* **Caching**: Weather data is cached in Redis for `WEATHER_CACHE_TTL` seconds.
* **Concurrency**: Weather API requests are limited by `WEATHER_CONCURRENCY`.
* Ensure Redis is running before starting the server.
* If you change Prisma schema, always run `npx prisma generate`.

---


