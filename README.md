# weather-station-backend

🔗 **Production:** https://weather-station-backend-production.up.railway.app

Backend for an IoT weather station (ESP32 + BME280). Receives sensor readings, persists them to Firebase, and exposes them via REST.

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
| POST   | `/mcp`             | MCP server for Claude (Streamable HTTP) |

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

### MCP tools

| Tool                    | Description                                      |
|-------------------------|--------------------------------------------------|
| `get_latest_reading`    | Most recent reading for a device                 |
| `get_readings_in_range` | Historical readings filtered by time range       |
| `get_stats_for_range`   | Min/max/avg stats for a time range               |
| `get_device_meta`       | Device metadata (id, location, sensor type)      |

## Tests

```bash
pnpm test        # watch mode
pnpm test:run    # single run (CI)
```

## Docs

See [`PROJECT.md`](./PROJECT.md) for full architecture, decisions, and conventions.

## Related repos

- [weather-station-dashboard](https://github.com/Jake-Herrera/weather-station-dashboard)
- [weather-station-firmware](https://github.com/Jake-Herrera/weather-station-firmware)
