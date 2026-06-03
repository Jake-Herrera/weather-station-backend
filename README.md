# weather-station-backend

Backend for an IoT weather station (ESP32 + BME280). Receives sensor readings, persists them to Firebase, and exposes them via REST and MCP.

## Stack

- **Runtime:** Node.js 22 + TypeScript (strict, via `tsx`)
- **Framework:** Express 5
- **Database:** Firebase Realtime Database (Admin SDK)
- **Validation:** Zod
- **AI interface:** MCP server (`@modelcontextprotocol/sdk`)
- **Deployment:** Railway

## Quick start

```bash
pnpm install
# Create a .env file using the template in PROJECT.md § 9 and fill in the Firebase credentials
pnpm dev
```

## Endpoints

| Method | Path               | Description                          |
|--------|--------------------|--------------------------------------|
| POST   | `/data`            | Ingest a reading from the ESP32      |
| GET    | `/readings`        | History filtered by `?range=` (1h/6h/24h/7d/30d) |
| GET    | `/readings/latest` | Most recent reading                  |
| GET    | `/health`          | Liveness check                       |
| ALL    | `/mcp`             | MCP server for ChatGPT / Claude      |

### POST /data payload

```json
{
  "temp_c": 24.5,
  "pressure_hpa": 1012.3,
  "altitude_m": 45.1,
  "humidity_pct": 62.0
}
```

> `ts` is optional — the server stamps every reading with `Date.now()`. `device` defaults to `esp32-01`.

## Tests

```bash
pnpm test        # watch mode
pnpm test:run    # single run (CI)
```

## Docs

See [`PROJECT.md`](./PROJECT.md) for full architecture, decisions, and conventions.
