import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getLatestReading, getDeviceMeta } from '@/db/firebase.js';

const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID ?? 'esp32-01';

export const inputSchema = z.object({
  deviceId: z.string().optional(),
});

export type GetLatestReadingInput = z.infer<typeof inputSchema>;

export async function handleGetLatestReading(args: GetLatestReadingInput) {
  const deviceId = args.deviceId ?? DEFAULT_DEVICE_ID;

  const [reading, meta] = await Promise.all([
    getLatestReading(deviceId),
    getDeviceMeta(deviceId),
  ]);

  return {
    device: meta ? { id: deviceId, ...meta } : null,
    reading: reading
      ? {
          ts_ms: reading.ts ?? null,
          ts_iso: reading.ts ? new Date(reading.ts).toISOString() : null,
          temp_c: reading.temp_c,
          pressure_hpa: reading.pressure_hpa,
          altitude_m: reading.altitude_m,
          humidity_pct: reading.humidity_pct,
        }
      : null,
  };
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_latest_reading',
    {
      description:
        'Get the most recent weather reading from the station. Returns temperature (°C), pressure (hPa), altitude (m), and humidity (%), with the timestamp in both epoch ms and ISO format, plus device metadata (name, location, elevation).',
      inputSchema: inputSchema.shape,
    },
    async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(await handleGetLatestReading(args), null, 2),
        },
      ],
    }),
  );
}
