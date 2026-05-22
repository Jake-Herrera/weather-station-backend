import { describe, it, expect } from 'vitest';
import { validateReading } from '@/services/validate-reading.js';

describe('validateReading', () => {
  it('accepts a complete, valid reading', () => {
    const input = {
      ts: 1731675600000,
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(true);
  });

  it('rejects a reading missing temp_c', () => {
    const input = {
      ts: 1731675600000,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(false);
  });

  it('rejects a reading where ts is a string', () => {
    const input = {
      ts: '1731675600000',
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(false);
  });

  it('rejects an empty object', () => {
    const result = validateReading({});

    expect(result.valid).toBe(false);
  });
});