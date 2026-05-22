import { readingSchema, type Reading } from '@/types/reading.js';

// Result of validating an incoming payload.
// A discriminated union: either valid (with typed data) or invalid (with an error message).
type ValidationResult =
  | { valid: true; data: Reading }
  | { valid: false; error: string };

// Pure function: takes any unknown input and decides whether it is a valid reading.
// No network, no side effects — easy to unit test.
export function validateReading(input: unknown): ValidationResult {
  const result = readingSchema.safeParse(input);

  if (!result.success) {
    return { valid: false, error: 'Reading payload is invalid' };
  }

  return { valid: true, data: result.data };
}