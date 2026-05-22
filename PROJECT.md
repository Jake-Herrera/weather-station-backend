# 📁 PROJECT.md — Backend Layer (Node.js + Express + MCP)

> This file is the **single source of truth** for the backend. It must be kept up to date at all times.
> Every AI agent or new developer must read this file before touching code.

---

## 1. Overview

| Field               | Detail |
|---------------------|--------|
| **Name**            | `weather-station-backend` |
| **Layer**           | ⚙️ Business Logic (API + MCP) |
| **Current version** | `0.1.0` |
| **Status**          | 🟡 In development |
| **Type**            | REST API + MCP Server |
| **Audience**        | The ESP32 sends data here; the dashboard and ChatGPT/Claude read from here |
| **Owner**           | `Jake` — `jkherrera96@outlook.com` |
| **Repository**      | `https://github.com/Jake-Herrera/weather-station-backend.git` |

### Problem it solves

> The ESP32 + BMP280 sensor produces readings continuously, but a microcontroller cannot
> safely write to a database, run business logic, or expose an AI-queryable interface on its
> own. Something trusted in the cloud must receive those readings, validate them, persist
> them, and make them queryable.

### Solution

> A Node.js + Express backend that (1) receives sensor readings over HTTP, (2) validates and
> writes them to Firebase Realtime Database using the Admin SDK, (3) serves historical
> queries to the dashboard over REST, (4) pushes processed/complementary data over WebSocket,
> and (5) exposes an MCP server so ChatGPT/Claude can query the weather data in natural
> language.

### Key objectives (what success looks like)

- [ ] The backend receives a reading via `POST /data` and writes it to Firebase
- [ ] Input validation rejects malformed payloads
- [ ] `GET /readings` returns history filtered by time range (hours / days / weeks)
- [ ] The MCP server exposes `get_latest_reading` and `get_history` tools
- [ ] Unit tests cover the pure logic (validation + time-range math)

---

## 2. Tech Stack

> **⚠️ For AI agents:** Use EXACTLY these technologies and versions. Do not introduce new
> dependencies without justifying them.

### Core

| Technology      | Version  | Purpose                                  |
|-----------------|----------|------------------------------------------|
| Node.js         | `22.x`   | Runtime                                  |
| TypeScript      | `5.x`    | Type safety                              |
| Express         | `5.x`    | HTTP framework (REST endpoints)          |
| firebase-admin  | `13.x`   | Write/read Firebase RTDB (server-side)   |
| @modelcontextprotocol/sdk | `latest` | Expose data as MCP tools for AI |
| ws              | `8.x`    | WebSocket server (real-time push)        |
| zod             | `3.x`    | Payload validation + inferred types      |
| dotenv          | `16.x`   | Load environment variables               |

### Tooling

| Technology      | Version  | Purpose                                  |
|-----------------|----------|------------------------------------------|
| tsx             | `4.x`    | Run TypeScript directly (no build step)  |
| @types/node     | `22.x`   | Node type definitions                    |
| @types/express  | `5.x`    | Express type definitions                 |
| @types/ws       | `8.x`    | WebSocket type definitions               |
| Vitest          | `2.x`    | Unit testing                             |
| Supertest       | `7.x`    | HTTP endpoint testing                    |
| pnpm            | `9.x`    | Package manager (secure by default)      |

### Infrastructure & DevOps

| Tool             | Purpose                          |
|------------------|----------------------------------|
| Railway          | Deployment (push from GitHub)    |
| GitHub           | Source control                   |
| GitHub Actions   | CI (lint + tests) — optional     |

### External dependencies / third-party services

| Service                    | Purpose                  | Docs                              |
|----------------------------|--------------------------|-----------------------------------|
| Firebase Realtime Database | Data persistence         | `https://firebase.google.com/docs/database` |
| OpenAI / Claude (via MCP)  | AI consumer of the data  | `https://modelcontextprotocol.io` |

> **Note:** This backend does NOT use a frontend framework, an ORM, PostgreSQL, Redis,
> or an auth provider. Firebase is the database; the Admin SDK handles access. TypeScript
> runs directly via `tsx` in development — no separate build step is needed.

---

## 3. Architecture

### High-level diagram

```
┌──────────────┐  HTTP POST  ┌──────────────────────────────────┐
│ ESP32+BMP280 │ ──────────► │   Express Backend (Railway)       │
└──────────────┘   /data     │                                   │
                             │  routes → services (pure logic)   │
┌──────────────┐  WS / REST  │            │                      │
│ React        │ ◄─────────► │            │ firebase-admin       │
│ Dashboard    │             │            ▼                      │
└──────────────┘             │   ┌──────────────────────┐        │
                             │   │ Firebase Realtime DB │        │
┌──────────────┐   MCP       │   └──────────────────────┘        │
│ ChatGPT /    │ ◄─────────► │   MCP server (/mcp)               │
│ Claude       │             │                                   │
└──────────────┘             └──────────────────────────────────┘
```

### Read/write model: "centralized write, hybrid read"

- **Centralized write:** ONLY the backend writes to Firebase (via Admin SDK). The ESP32
  never writes directly; the dashboard never writes.
- **Hybrid read:** the dashboard reads raw sensor data **directly from Firebase** (real-time
  via the client SDK), reads **processed/complementary data via WebSocket** from the backend,
  and reads **historical filtered queries via REST** from the backend.

### Design patterns in use

- **Architecture:** Modular monolith (single deployable service)
- **Layering:** `routes` (HTTP) → `services` (pure business logic) → `db` (Firebase access)
- **Key principle:** keep business logic PURE and separate from infrastructure, so it can be
  unit-tested without touching the network.
- **API design:** REST + MCP

> **WebSocket status:** prepared but inactive at launch. It exists so that future
> complementary data (external weather APIs, computed averages, alerts) — data that does NOT
> live in Firebase — can be pushed to the dashboard. Documented here so its presence is not
> "magic without context."

---

## 4. Project Structure

```
weather-station-backend/
├── src/
│   ├── routes/             # Express route handlers (thin — no business logic)
│   │   ├── data.ts         # POST /data  (receives ESP32 readings)
│   │   └── readings.ts     # GET /readings  (history with time filters)
│   ├── services/           # PURE business logic (the unit-tested core)
│   │   ├── validate-reading.ts   # payload validation (zod)
│   │   └── time-range.ts         # hours/days/weeks → timestamp math
│   ├── db/
│   │   └── firebase.ts     # firebase-admin init + write/read helpers
│   ├── mcp/
│   │   └── server.ts       # MCP tools: get_latest_reading, get_history
│   ├── ws/
│   │   └── server.ts       # WebSocket server (prepared, inactive at launch)
│   ├── types/
│   │   └── reading.ts      # shared TypeScript types (Reading, TimeRange)
│   └── index.ts            # App entry: wires routes + MCP + WS
│
├── tests/
│   └── unit/
│       ├── validate-reading.test.ts
│       └── time-range.test.ts
├── docs/
│   └── data-layer.md       # ← Firebase layer PROJECT.md lives here
├── .env.example            # Required env vars (no values)
├── .gitignore              # MUST include .env and the service account key
├── tsconfig.json           # TypeScript config (strict mode)
├── PROJECT.md              # ← This file
└── package.json
```

---

## 5. Domain Model / Key Entities

> **⚠️ For AI agents:** This is the core entity, defined in `src/types/reading.ts`. It MUST
> match the Firebase data layer (`docs/data-layer.md`, section 3) exactly. Where possible,
> infer this type from the zod schema (`z.infer<typeof readingSchema>`) so the validation and
> the type never drift apart.

```typescript
// A single sensor reading
type Reading = {
  ts: number            // Unix timestamp in milliseconds (used for time filtering)
  temp_c: number        // temperature in °C
  pressure_hpa: number  // atmospheric pressure in hPa
  altitude_m: number    // altitude in meters (derived from pressure)
}

// Stored in Firebase under: readings/<deviceId>/<autoId>
// Example deviceId: "esp32-01"

// Time-range request (for GET /readings and the MCP get_history tool)
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'
```

---

## 6. Features and Scope

### ✅ In Scope (MVP)

| Feature                          | Status         | Notes                                  |
|----------------------------------|----------------|----------------------------------------|
| Receive readings (`POST /data`)  | ⬜ Pending     | Validates + writes to Firebase         |
| Payload validation               | ⬜ Pending     | Pure logic, unit-tested                |
| History with time filter         | ⬜ Pending     | `GET /readings?range=24h`              |
| MCP server (latest + history)    | ⬜ Pending     | For ChatGPT/Claude                     |
| Unit tests (logic core)          | ⬜ Pending     | Vitest                                 |
| WebSocket scaffold               | ⬜ Pending     | Prepared but inactive at launch        |

### ❌ Out of Scope (for now)

- Authentication for the dashboard reads (data is non-sensitive)
- Migrating Firebase to PostgreSQL/another DB
- Multiple sensor devices (schema supports it, but only `esp32-01` for MVP)
- Rate limiting / API keys for the ingest endpoint (add before public exposure)

---

## 7. API & Contracts

### Endpoints

```
Base URL (local): http://localhost:3000
Base URL (prod):  https://<app>.up.railway.app

INGEST
  POST   /data                 → receive a reading from the ESP32
         body: { device, ts, temp_c, pressure_hpa, altitude_m }
         → 201 { ok: true } | 400 { error }

READ
  GET    /readings?range=24h   → history filtered by time range
         range ∈ 1h | 6h | 24h | 7d | 30d
         → 200 { data: Reading[] }
  GET    /readings/latest      → most recent reading
         → 200 { data: Reading }

HEALTH
  GET    /health               → 200 { status: "ok" }

MCP
  ALL    /mcp                  → MCP server endpoint (Streamable HTTP)
         tools: get_latest_reading, get_history
```

### API conventions

- Success: `{ data, meta? }`
- Errors: `{ error: { code, message } }`
- Dates: timestamps in **milliseconds** (matches Firebase data layer)
- No pagination at MVP (time range caps result size)

---

## 8. Code Conventions

> **⚠️ For AI agents:** Always follow these conventions. Do not deviate.

### Naming

| Type              | Convention        | Example                  |
|-------------------|-------------------|--------------------------|
| Files             | kebab-case `.ts`  | `validate-reading.ts`    |
| Functions/vars    | camelCase         | `getTimeRange()`         |
| Types/Interfaces  | PascalCase        | `type Reading = ...`     |
| Constants         | UPPER_SNAKE_CASE  | `DEFAULT_DEVICE_ID`      |
| MCP tools         | snake_case        | `get_latest_reading`     |
| Env vars          | UPPER_SNAKE_CASE  | `FIREBASE_PROJECT_ID`    |

### General rules

- **TypeScript strict mode:** `strict: true` always. No `any` without justification, no `// @ts-ignore`.
- **Keep route handlers thin.** Business logic goes in `services/` (pure functions).
- **Services must be pure where possible:** take input, return output, no network calls.
  This is what makes them unit-testable. Firebase access is mocked in tests.
- **Validate every external input** (the ESP32 payload) with a zod schema before using it,
  and infer the type from that schema so validation and types stay in sync.
- **Comments:** in English, only when the "why" is not obvious. The code says the "what".
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **No secrets in code.** Everything sensitive comes from `.env`.

---

## 9. Environment Variables

```bash
# .env.example — copy to .env and fill in the values

# App
NODE_ENV=development
PORT=3000

# Firebase Admin SDK
# (from the service account JSON downloaded from the Firebase console)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_URL=https://weather-station-db-default-rtdb.firebaseio.com

# Default device (MVP has a single sensor)
DEFAULT_DEVICE_ID=esp32-01
```

> **⚠️ The service account JSON and `.env` NEVER go to GitHub.** Both must be in `.gitignore`
> from the very first commit. If a key leaks, generating a new one is not enough — the old
> one must be revoked in the Google Cloud console.

---

## 10. Local Setup

```bash
# 1. Clone repo
git clone https://github.com/<user>/weather-station-backend.git && cd weather-station-backend

# 2. Install dependencies (pnpm — secure by default, blocks arbitrary install scripts)
pnpm install

# 3. Configure environment
cp .env.example .env
# → Fill in the Firebase values from your service account JSON

# 4. Start dev server
pnpm dev

# 5. Run tests
pnpm test
```

### Available scripts

| Script              | Description                              |
|---------------------|------------------------------------------|
| `pnpm dev`          | Dev server with hot reload (`tsx watch`) |
| `pnpm start`        | Production server (`tsx src/index.ts`)   |
| `pnpm typecheck`    | TypeScript type checking (`tsc --noEmit`)|
| `pnpm test`         | Unit tests (Vitest, watch mode)          |
| `pnpm test:run`     | Unit tests once (for CI / pre-commit)    |
| `pnpm test:coverage`| Tests with coverage report               |

> **pnpm note:** the first time a dependency needs a post-install build script, pnpm will
> block it for safety and show "ignored build scripts". Approve with `pnpm approve-builds`.

---

## 11. Testing

> **Philosophy:** test the pure logic that can actually break. Mock the infrastructure.

- **Engine:** Vitest
- **HTTP:** Supertest (test endpoints without a real running server)
- **Firebase:** mocked with Vitest — tests NEVER touch the real database

### What to test

| Target                      | Why                                                  |
|-----------------------------|------------------------------------------------------|
| `validateReading()`         | Rejects bad payloads, accepts good ones (core safety)|
| `getTimeRange()`            | hours/days/weeks → correct start timestamp (filters) |
| Data transformations        | Any averaging/formatting before sending to dashboard |
| MCP tool handlers           | Return the correct shape for `get_latest`/`get_history` |

### What NOT to test

- Firebase itself (third-party — it's mocked, not tested)
- Express internal routing
- Real network calls

### Example test intentions

```
validate-reading.test.js
  ✓ a payload missing temp_c → returns an error
  ✓ a payload with ts as a string → returns an error
  ✓ a complete, valid payload → returns ok

time-range.test.js
  ✓ '24h' → start timestamp is exactly 24h before now
  ✓ '7d'  → start timestamp is exactly 7 days before now
  ✓ an unknown range → throws / returns a clear error
```

- **Minimum expected coverage:** 70% on `services/` (the logic core).

---

## 12. Git & Branching

```
main          → production (protected, merge via PR only)
develop       → feature integration
feature/xxx   → new features (branch from develop)
fix/xxx       → bugfixes
test/xxx      → adding or fixing tests
```

**PR Rules:**
- Small PRs preferred
- CI must pass (tests) before merge
- `.env` and the service account key are NEVER committed

---

## 13. Architecture Decision Records (ADR)

> Document important decisions and their rationale here. Avoid "magic" without context.

| Date        | Decision                                  | Rationale                                                            |
|-------------|-------------------------------------------|----------------------------------------------------------------------|
| 2026-05-20  | Express over Hono                         | Most documented Node framework; easiest for a backend beginner       |
| 2026-05-20  | TypeScript over plain JavaScript          | Already known from frontend; type safety; strong portfolio signal    |
| 2026-05-20  | tsx (no build step) in dev                | Run `.ts` directly; simpler workflow for a backend beginner          |
| 2026-05-20  | Firebase RTDB over PostgreSQL/Drizzle     | No DB server to manage; visual console; built-in real-time           |
| 2026-05-20  | Pure services separated from routes       | Makes business logic unit-testable without hitting the network       |
| 2026-05-20  | WebSocket prepared but inactive at launch | Reserves a channel for future non-Firebase data (external APIs, etc.)|
| 2026-05-20  | MCP via @modelcontextprotocol/sdk         | Cross-vendor standard; lets ChatGPT/Claude query the data directly   |
| 2026-05-20  | pnpm over npm                             | Faster, disk-efficient, blocks arbitrary install scripts (security)  |
| 2026-05-20  | `@/` path alias over relative imports     | Cleaner imports, easier refactors; resolved natively by tsx          |

---

## 14. Current Project Status

**Last updated:** `2026-05-20`

### What already exists and works

- [x] Repo initialized with `package.json`, `tsconfig.json`, and Node `.gitignore`
- [x] Dependencies installed (Express, firebase-admin, MCP SDK, ws, zod, dotenv)
- [x] TypeScript configured (strict mode) running via `tsx`
- [x] Base Express server with a working `GET /health` endpoint
- [x] Project documentation in the repo (`PROJECT.md` + `docs/data-layer.md`)
- [x] Firebase Admin SDK connected (server-side credentials via `.env`)
- [x] Reading validation with zod (`readingSchema` + inferred `Reading` type)
- [x] `POST /data` endpoint: validates and persists readings to Firebase
- [x] Validation extracted to a pure service (`validateReading`)
- [x] Unit tests for validation logic (Vitest) — passing

### In progress right now

- [ ] `GET /readings` endpoint (history with time filters)

### Known technical debt

- [ ] No rate limiting on `POST /data` (fine for MVP, needed before public exposure)

### Known bugs / current limitations

- [ ] N/A (early stage)

---

## 15. Context for AI Agents

> This section exists specifically to give context to any LLM working on this project.

### Critical instructions

1. **Read this whole document before writing a single line of code.**
2. **Do not invent dependencies.** If something is not in the stack (section 2), ask first.
3. **TypeScript strict mode. No `any`, no `// @ts-ignore`** without explicit justification.
4. **Keep route handlers thin; put logic in pure `services/` functions.**
5. **Never write secrets in code.** Use `.env`. Never suggest committing the service account key.
6. **The `Reading` entity (section 5) must match the Firebase data layer exactly.**
7. **Only the backend writes to Firebase.** Never suggest client-side writes.
8. **If asked for something outside the MVP scope (section 6), flag it explicitly first.**
9. **Prefer readable code over clever code.** Humans will read this.

### Preferred patterns

```
// ✅ Preferred: pure functions in services/ (input → output, no I/O)
// ✅ Preferred: validate external input with zod at the boundary
// ✅ Preferred: small, single-purpose modules
// ❌ Avoid: business logic inside route handlers
// ❌ Avoid: calling Firebase directly from a route (go through db/ helpers)
// ❌ Avoid: secrets or config hardcoded in source
```

### How to ask the agent for help

When working on this project, always provide:
- The specific file or feature to work on
- The expected behavior
- What you already tried (if applicable)
- Any additional constraint not documented here

---

*This document must evolve with the project. If anything in the code contradicts this document, update the document.*
