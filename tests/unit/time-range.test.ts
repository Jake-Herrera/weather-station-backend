import { describe, it, expect } from 'vitest';
import { getStartTimestamp, isValidRange } from '@/services/time-range.js';

describe('isValidRange', () => {
  it('accepts all the supported ranges', () => {
    expect(isValidRange('1h')).toBe(true);
    expect(isValidRange('6h')).toBe(true);
    expect(isValidRange('24h')).toBe(true);
    expect(isValidRange('7d')).toBe(true);
    expect(isValidRange('30d')).toBe(true);
  });

  it('rejects an unknown range', () => {
    expect(isValidRange('banana')).toBe(false);
    expect(isValidRange('2h')).toBe(false);
    expect(isValidRange('')).toBe(false);
  });

  it('rejects ranges with wrong casing', () => {
    expect(isValidRange('1H')).toBe(false);
    expect(isValidRange('7D')).toBe(false);
  });
});

describe('getStartTimestamp', () => {
  // A fixed "now" so the math is predictable and the test never flakes.
  const NOW = 1_700_000_000_000;

  it('subtracts 1 hour for the 1h range', () => {
    const oneHour = 60 * 60 * 1000;
    expect(getStartTimestamp('1h', NOW)).toBe(NOW - oneHour);
  });

  it('subtracts 24 hours for the 24h range', () => {
    const oneDay = 24 * 60 * 60 * 1000;
    expect(getStartTimestamp('24h', NOW)).toBe(NOW - oneDay);
  });

  it('subtracts 7 days for the 7d range', () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(getStartTimestamp('7d', NOW)).toBe(NOW - sevenDays);
  });

  it('subtracts 6 hours for the 6h range', () => {
    const sixHours = 6 * 60 * 60 * 1000;
    expect(getStartTimestamp('6h', NOW)).toBe(NOW - sixHours);
  });

  it('subtracts 30 days for the 30d range', () => {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(getStartTimestamp('30d', NOW)).toBe(NOW - thirtyDays);
  });

  it('returns a timestamp earlier than now', () => {
    expect(getStartTimestamp('1h', NOW)).toBeLessThan(NOW);
  });
});