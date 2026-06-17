import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/db/firebase.js', () => ({
  db: {},
  saveReading: vi.fn(),
  getReadings: vi.fn(),
  getLatestReading: vi.fn(),
  getReadingsInRange: vi.fn(),
  getDeviceMeta: vi.fn(),
}));

import { getReadingsInRange, getDeviceMeta } from '@/db/firebase.js';
import { inputSchema, handleGetStatsForRange } from '@/mcp/tools/get-stats-for-range.js';

const START_TS = 1731600000000;

const mockReadings = [
  { ts: 1731600000000, temp_c: 20.0, pressure_hpa: 1010.0, altitude_m: 130.0, humidity_pct: 60.0 },
  { ts: 1731637800000, temp_c: 22.0, pressure_hpa: 1013.0, altitude_m: 138.0, humidity_pct: 70.0 },
  { ts: 1731675600000, temp_c: 24.0, pressure_hpa: 1016.0, altitude_m: 146.0, humidity_pct: 80.0 },
];

const mockMeta = { name: 'ESP32-01', location: 'San José, CR', elevation_m: 1170 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('get_stats_for_range — input schema', () => {
  it('accepts minimum valid input (startTs only)', () => {
    expect(inputSchema.safeParse({ startTs: START_TS }).success).toBe(true);
  });

  it('accepts full valid input', () => {
    expect(
      inputSchema.safeParse({ deviceId: 'esp32-01', startTs: START_TS, endTs: START_TS + 86400000 }).success,
    ).toBe(true);
  });

  it('rejects missing startTs', () => {
    expect(inputSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-integer startTs', () => {
    expect(inputSchema.safeParse({ startTs: 1731600000000.5 }).success).toBe(false);
  });

  it('rejects negative startTs', () => {
    expect(inputSchema.safeParse({ startTs: -1 }).success).toBe(false);
  });
});

describe('get_stats_for_range — handler', () => {
  it('computes correct min, max, avg, current, count for each metric', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue(mockReadings);
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetStatsForRange({ startTs: START_TS });

    expect(result.stats.temp_c).toEqual({
      min: 20,
      max: 24,
      avg: 22,
      current: 24,
      count: 3,
    });

    expect(result.stats.humidity_pct).toEqual({
      min: 60,
      max: 80,
      avg: 70,
      current: 80,
      count: 3,
    });
  });

  it('returns null stats when no readings', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue([]);
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetStatsForRange({ startTs: START_TS });

    expect(result.stats.temp_c).toBeNull();
    expect(result.stats.pressure_hpa).toBeNull();
    expect(result.stats.altitude_m).toBeNull();
    expect(result.stats.humidity_pct).toBeNull();
  });

  it('includes device metadata in the response', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue(mockReadings);
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetStatsForRange({ startTs: START_TS });

    expect(result.device).toEqual({ id: 'esp32-01', ...mockMeta });
  });

  it('includes query metadata with readable ISO timestamps', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue([]);
    vi.mocked(getDeviceMeta).mockResolvedValue(null);

    const result = await handleGetStatsForRange({ startTs: START_TS });

    expect(result.query.startTs).toBe(START_TS);
    expect(result.query.startIso).toBe(new Date(START_TS).toISOString());
    expect(result.query.readingsAnalyzed).toBe(0);
  });
});
