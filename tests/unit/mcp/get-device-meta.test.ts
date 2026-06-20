import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/db/firebase.js', () => ({
  db: {},
  saveReading: vi.fn(),
  getReadings: vi.fn(),
  getLatestReading: vi.fn(),
  getReadingsInRange: vi.fn(),
  getDeviceMeta: vi.fn(),
}));

import { getDeviceMeta } from '@/db/firebase.js';
import { inputSchema, handleGetDeviceMeta } from '@/mcp/tools/get-device-meta.js';

const mockMeta = { name: 'ESP32-01', location: 'San José, CR', elevation_m: 1170 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('get_device_meta — input schema', () => {
  it('accepts an empty object (deviceId is optional)', () => {
    expect(inputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid deviceId string', () => {
    expect(inputSchema.safeParse({ deviceId: 'esp32-01' }).success).toBe(true);
  });

  it('rejects a numeric deviceId', () => {
    expect(inputSchema.safeParse({ deviceId: 42 }).success).toBe(false);
  });
});

describe('get_device_meta — handler', () => {
  it('returns device metadata with id injected', async () => {
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    const result = await handleGetDeviceMeta({ deviceId: 'esp32-01' });

    expect(result.device).toEqual({
      id: 'esp32-01',
      name: 'ESP32-01',
      location: 'San José, CR',
      elevation_m: 1170,
    });
  });

  it('returns null device when Firebase has no metadata', async () => {
    vi.mocked(getDeviceMeta).mockResolvedValue(null);

    const result = await handleGetDeviceMeta({});

    expect(result.device).toBeNull();
  });

  it('defaults to DEFAULT_DEVICE_ID when deviceId is omitted', async () => {
    vi.mocked(getDeviceMeta).mockResolvedValue(mockMeta);

    await handleGetDeviceMeta({});

    expect(vi.mocked(getDeviceMeta)).toHaveBeenCalledWith('esp32-01');
  });
});
