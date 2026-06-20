import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getReadingsInRange, getDeviceMeta } from '@/db/firebase.js';

const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID ?? 'esp32-01';
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;

export const inputSchema = z.object({
  deviceId: z.string().optional(),
  startTs: z.number().int().positive(),
  endTs: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).optional(),
});

export type GetReadingsInRangeInput = z.infer<typeof inputSchema>;

export async function handleGetReadingsInRange(args: GetReadingsInRangeInput) {
  const deviceId = args.deviceId ?? DEFAULT_DEVICE_ID;
  const endTs = args.endTs ?? Date.now();
  const limit = args.limit ?? DEFAULT_LIMIT;

  const [readings, meta] = await Promise.all([
    getReadingsInRange(deviceId, args.startTs, endTs, limit),
    getDeviceMeta(deviceId),
  ]);

  return {
    device: meta ? { id: deviceId, ...meta } : null,
    query: {
      startTs: args.startTs,
      startIso: new Date(args.startTs).toISOString(),
      endTs,
      endIso: new Date(endTs).toISOString(),
      limit,
      returned: readings.length,
    },
    readings: readings.map((r) => ({
      ts_ms: r.ts ?? null,
      ts_iso: r.ts ? new Date(r.ts).toISOString() : null,
      temp_c: r.temp_c,
      pressure_hpa: r.pressure_hpa,
      altitude_m: r.altitude_m,
      humidity_pct: r.humidity_pct,
    })),
  };
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_readings_in_range',
    {
      description:
        'Get weather readings between two timestamps. Provide startTs (epoch ms, required) and optionally endTs (defaults to now) and limit (max 1000, default 500). Returns the readings array with device metadata and query metadata.',
      inputSchema: inputSchema.shape,
    },
    async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(await handleGetReadingsInRange(args), null, 2),
        },
      ],
    }),
  );
}
