import { Router } from 'express';
import { getStartTimestamp, isValidRange } from '@/services/time-range.js';
import { getReadings } from '@/db/firebase.js';

const router = Router();
const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID || 'esp32-01';

// GET /readings?range=24h — returns history filtered by time range.
router.get('/readings', async (req, res) => {
  // 1. Read the range from the query string, default to '24h'.
  const range = (req.query.range as string) ?? '24h';

  // 2. Validate it against the allowed ranges (the query string is user-controlled).
  if (!isValidRange(range)) {
    return res.status(400).json({
      error: { code: 'INVALID_RANGE', message: 'Range must be one of: 1h, 6h, 24h, 7d, 30d' },
    });
  }

  // 3. Compute the start timestamp for the requested range.
  const startTs = getStartTimestamp(range);

  // 4. Fetch the readings from Firebase.
  try {
    const data = await getReadings(DEFAULT_DEVICE_ID, startTs);
    return res.status(200).json({ data });
  } catch {
    return res.status(500).json({
      error: { code: 'FETCH_FAILED', message: 'Could not fetch readings' },
    });
  }
});

export default router;