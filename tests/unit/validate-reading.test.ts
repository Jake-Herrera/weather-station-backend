import { describe, it, expect } from 'vitest';
import { validateReading } from '@/services/validate-reading.js';

describe('validateReading', () => {
  it('accepts a complete, valid reading', () => {
    const input = {
      ts: 1731675600000,
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
      humidity_pct: 72.4,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(true);
  });

  it('rejects a reading missing temp_c', () => {
    const input = {
      ts: 1731675600000,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
      humidity_pct: 72.4,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(false);
  });

  it('accepts a valid reading without ts (server sets it)', () => {
    const input = {
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
      humidity_pct: 72.4,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(true);
  });

  it('rejects a reading where ts is a string', () => {
    const input = {
      ts: '1731675600000',
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
      humidity_pct: 72.4,
    };

    const result = validateReading(input);

    expect(result.valid).toBe(false);
  });

  it('rejects an empty object', () => {
    const result = validateReading({});

    expect(result.valid).toBe(false);
  });

  it('rejects null', () => {
    expect(validateReading(null).valid).toBe(false);
  });

  it('rejects a plain string', () => {
    expect(validateReading('22.5').valid).toBe(false);
  });

  it('rejects a reading missing pressure_hpa', () => {
    const result = validateReading({ temp_c: 22.5, altitude_m: 138.7, humidity_pct: 60 });

    expect(result.valid).toBe(false);
  });

  it('rejects a reading missing altitude_m', () => {
    const result = validateReading({ temp_c: 22.5, pressure_hpa: 1013.2, humidity_pct: 60 });

    expect(result.valid).toBe(false);
  });

  it('rejects a reading missing humidity_pct', () => {
    const result = validateReading({ temp_c: 22.5, pressure_hpa: 1013.2, altitude_m: 138.7 });

    expect(result.valid).toBe(false);
  });

  it('rejects a reading with negative pressure_hpa', () => {
    const result = validateReading({ temp_c: 22.5, pressure_hpa: -10, altitude_m: 138.7, humidity_pct: 60 });

    expect(result.valid).toBe(false);
  });

  it('rejects a reading with humidity_pct above 100', () => {
    const result = validateReading({ temp_c: 22.5, pressure_hpa: 1013.2, altitude_m: 138.7, humidity_pct: 150 });

    expect(result.valid).toBe(false);
  });

  it('rejects a reading with humidity_pct below 0', () => {
    const result = validateReading({ temp_c: 22.5, pressure_hpa: 1013.2, altitude_m: 138.7, humidity_pct: -1 });

    expect(result.valid).toBe(false);
  });

  it('accepts humidity_pct at exact boundaries (0 and 100)', () => {
    const base = { temp_c: 22.5, pressure_hpa: 1013.2, altitude_m: 138.7 };

    expect(validateReading({ ...base, humidity_pct: 0 }).valid).toBe(true);
    expect(validateReading({ ...base, humidity_pct: 100 }).valid).toBe(true);
  });

  it('rejects ts as a float', () => {
    const result = validateReading({
      ts: 1731675600000.5,
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
      humidity_pct: 60,
    });

    expect(result.valid).toBe(false);
  });

  it('rejects ts as a negative number', () => {
    const result = validateReading({
      ts: -1,
      temp_c: 22.5,
      pressure_hpa: 1013.2,
      altitude_m: 138.7,
      humidity_pct: 60,
    });

    expect(result.valid).toBe(false);
  });
});