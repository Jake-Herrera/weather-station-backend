import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/db/firebase.js', () => ({
  db: {},
  saveReading: vi.fn(),
  getReadings: vi.fn(),
  getLatestReading: vi.fn(),
  getReadingsInRange: vi.fn(),
  getDeviceMeta: vi.fn(),
}));

import { getLatestReading, getDeviceMeta } from '@/db/firebase.js';
import { inputSchema, handleGetLatestReading } from '@/mcp/tools/get-latest-reading.js';

const mockReading = {
  ts: 1731675600000,
  temp_c: 22.31,
  pressure_hpa: 1013.42,
  altitude_m: 138.7,
  humidity_pct: 72.4,
};

const mockMeta = {
  name: 'ESP32-01',
  location: 'San José, CR',
  elevation_m: 1170,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('get_latest_reading — input schema', () => {
  it('accepts an empty object (deviceId is optional)', () => {
    expect(inputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid deviceId string', () => {
    expect(inputSchema.safeParse({ deviceId: 'esp32-01' }).success).toBe(true);
  });

  it('rejects a numeric deviceId', () => {
    expect(inputSchema.safeParse({ deviceId: 123 }).success).toBe(false);
  });

  it('rejects unknown required fields missing', () => {
    // no required fields — any extra keys are stripped but schema is still valid
    expect(inputSchema.safeParse({ unknownKey: true }).success).toBe(true);
  });
});

describe('get_latest_reading — handler', () => {
  it('returns enriched reading with device meta', async () => {
    vi.mocked(getLatestReading).mockResolvedValue(mockReading);
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetLatestReading({ deviceId: 'esp32-01' });

    expect(result.device).toEqual({ id: 'esp32-01', ...mockMeta });
    expect(result.reading).toMatchObject({
      ts_ms: 1731675600000,
      ts_iso: new Date(1731675600000).toISOString(),
      temp_c: 22.31,
      pressure_hpa: 1013.42,
      altitude_m: 138.7,
      humidity_pct: 72.4,
    });
  });

  it('returns null reading when Firebase has no data', async () => {
    vi.mocked(getLatestReading).mockResolvedValue(null);
    vi.mocked(getDeviceMeta).mockResolvedValue(null);

    const result = await handleGetLatestReading({});

    expect(result.reading).toBeNull();
    expect(result.device).toBeNull();
  });

  it('returns null ts_iso when reading has no ts', async () => {
    vi.mocked(getLatestReading).mockResolvedValue({ ...mockReading, ts: undefined });
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetLatestReading({});

    expect(result.reading?.ts_ms).toBeNull();
    expect(result.reading?.ts_iso).toBeNull();
  });

  it('defaults to DEFAULT_DEVICE_ID when deviceId is omitted', async () => {
    vi.mocked(getLatestReading).mockResolvedValue(mockReading);
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    await handleGetLatestReading({});

    expect(vi.mocked(getLatestReading)).toHaveBeenCalledWith('esp32-01');
    expect(vi.mocked(getDeviceMeta)).toHaveBeenCalledWith('esp32-01');
  });
});
