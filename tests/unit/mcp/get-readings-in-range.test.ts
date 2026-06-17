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
import { inputSchema, handleGetReadingsInRange } from '@/mcp/tools/get-readings-in-range.js';

const START_TS = 1731600000000;
const END_TS = 1731675600000;

const mockReadings = [
  { ts: 1731600000000, temp_c: 21.0, pressure_hpa: 1012.0, altitude_m: 135.0, humidity_pct: 70.0 },
  { ts: 1731637800000, temp_c: 22.0, pressure_hpa: 1013.0, altitude_m: 137.0, humidity_pct: 71.0 },
  { ts: 1731675600000, temp_c: 22.31, pressure_hpa: 1013.42, altitude_m: 138.7, humidity_pct: 72.4 },
];

const mockMeta = { name: 'ESP32-01', location: 'San José, CR', elevation_m: 1170 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('get_readings_in_range — input schema', () => {
  it('accepts minimum valid input (startTs only)', () => {
    expect(inputSchema.safeParse({ startTs: START_TS }).success).toBe(true);
  });

  it('accepts full valid input', () => {
    expect(
      inputSchema.safeParse({ deviceId: 'esp32-01', startTs: START_TS, endTs: END_TS, limit: 100 }).success,
    ).toBe(true);
  });

  it('rejects missing startTs', () => {
    expect(inputSchema.safeParse({ deviceId: 'esp32-01' }).success).toBe(false);
  });

  it('rejects non-integer startTs', () => {
    expect(inputSchema.safeParse({ startTs: 1731600000000.5 }).success).toBe(false);
  });

  it('rejects limit above 1000', () => {
    expect(inputSchema.safeParse({ startTs: START_TS, limit: 1001 }).success).toBe(false);
  });

  it('rejects limit of 0', () => {
    expect(inputSchema.safeParse({ startTs: START_TS, limit: 0 }).success).toBe(false);
  });

  it('rejects negative startTs', () => {
    expect(inputSchema.safeParse({ startTs: -1 }).success).toBe(false);
  });
});

describe('get_readings_in_range — handler', () => {
  it('returns enriched readings array with query metadata', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue(mockReadings);
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetReadingsInRange({ startTs: START_TS, endTs: END_TS });

    expect(result.device).toEqual({ id: 'esp32-01', ...mockMeta });
    expect(result.readings).toHaveLength(3);
    expect(result.readings[0]).toMatchObject({
      ts_ms: 1731600000000,
      ts_iso: new Date(1731600000000).toISOString(),
      temp_c: 21.0,
    });
    expect(result.query.returned).toBe(3);
  });

  it('returns empty readings array when no data', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue([]);
    vi.mocked(getDeviceMeta).mockResolvedValue(null);

    const result = await handleGetReadingsInRange({ startTs: START_TS });

    expect(result.readings).toHaveLength(0);
    expect(result.query.returned).toBe(0);
  });

  it('passes the correct limit to Firebase', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue([]);
    vi.mocked(getDeviceMeta).mockResolvedValue(null);

    await handleGetReadingsInRange({ startTs: START_TS, limit: 50 });

    expect(vi.mocked(getReadingsInRange)).toHaveBeenCalledWith(
      expect.any(String),
      START_TS,
      expect.any(Number),
      50,
    );
  });

  it('uses DEFAULT_DEVICE_ID when deviceId is omitted', async () => {
    vi.mocked(getReadingsInRange).mockResolvedValue([]);
    vi.mocked(getDeviceMeta).mockResolvedValue(null);

    await handleGetReadingsInRange({ startTs: START_TS });

    expect(vi.mocked(getReadingsInRange)).toHaveBeenCalledWith('esp32-01', expect.any(Number), expect.any(Number), expect.any(Number));
  });
});
