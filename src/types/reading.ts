import { z } from 'zod'

// The schema is the single source of truth for what a valid reading looks like.
// It must match the Firebase data layer exactly (see docs/data-layer.md, section 3).
export const readingSchema = z.object({
  ts: z.number().int().positive(),       // Unix timestamp in milliseconds
  temp_c: z.number(),                    // temperature in °C
  pressure_hpa: z.number().positive(),   // atmospheric pressure in hPa
  altitude_m: z.number(),                  // altitude in meters
  humidity_pct: z.number().min(0).max(100) // humidity in percentage 
})

// The TypeScript type is inferred from the schema above, so validation and
// types can never drift apart.
export type Reading = z.infer<typeof readingSchema>
