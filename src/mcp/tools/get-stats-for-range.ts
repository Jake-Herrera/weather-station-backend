import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getReadingsInRange, getDeviceMeta } from '@/db/firebase.js';
import type { Reading } from '@/types/reading.js';

const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID ?? 'esp32-01';
// Use a high cap when computing stats — we need all data points, not a sample.
const STATS_FETCH_LIMIT = 5000;

export const inputSchema = z.object({
  deviceId: z.string().optional(),
  startTs: z.number().int().positive(),
  endTs: z.number().int().positive().optional(),
});

export type GetStatsForRangeInput = z.infer<typeof inputSchema>;

type MetricStats = {
  min: number;
  max: number;
  avg: number;
  current: number;
  count: number;
};

type Metric = 'temp_c' | 'pressure_hpa' | 'altitude_m' | 'humidity_pct';

function computeStats(readings: Reading[], metric: Metric): MetricStats | null {
  const values = readings.map((r) => r[metric]).filter((v): v is number => v != null);
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const current = values[values.length - 1];

  return { min, max, avg: Math.round(avg * 100) / 100, current, count: values.length };
}

export async function handleGetStatsForRange(args: GetStatsForRangeInput) {
  const deviceId = args.deviceId ?? DEFAULT_DEVICE_ID;
  const endTs = args.endTs ?? Date.now();

  const [readings, meta] = await Promise.all([
    getReadingsInRange(deviceId, args.startTs, endTs, STATS_FETCH_LIMIT),
    getDeviceMeta(deviceId),
  ]);

  const metrics: Metric[] = ['temp_c', 'pressure_hpa', 'altitude_m', 'humidity_pct'];

  const stats = Object.fromEntries(
    metrics.map((m) => [m, computeStats(readings, m)]),
  ) as Record<Metric, MetricStats | null>;

  return {
    device: meta ? { id: deviceId, ...meta } : null,
    query: {
      startTs: args.startTs,
      startIso: new Date(args.startTs).toISOString(),
      endTs,
      endIso: new Date(endTs).toISOString(),
      readingsAnalyzed: readings.length,
    },
    stats,
  };
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_stats_for_range',
    {
      description:
        'Get aggregated statistics (min, max, avg, current, count) for all four weather metrics over a time range. Provide startTs (epoch ms, required) and optionally endTs (defaults to now). Ideal for trend summaries without returning raw data.',
      inputSchema: inputSchema.shape,
    },
    async (args) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(await handleGetStatsForRange(args), null, 2),
        },
      ],
    }),
  );
}
