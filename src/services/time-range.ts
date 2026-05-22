// Supported time ranges for querying history.
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

// How many milliseconds each range represents.
const RANGE_TO_MS: Record<TimeRange, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// Type guard: checks whether a string is a valid TimeRange.
export function isValidRange(value: string): value is TimeRange {
  return value in RANGE_TO_MS;
}

// Pure function: given a range and a "now" timestamp, returns the start timestamp.
// `now` is a parameter (not read inside) so tests can pass a fixed value.
export function getStartTimestamp(range: TimeRange, now: number = Date.now()): number {
  return now - RANGE_TO_MS[range];
}