import { Router } from 'express';
import { validateReading } from '@/services/validate-reading.js';
import { saveReading } from '@/db/firebase.js';

const router = Router();
const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID || 'esp32-01';

// POST /data — receives a reading from the ESP32, validates it, and stores it.
router.post('/data', async (req, res) => {
  // 1. Validate using the pure service function.
  const result = validateReading(req.body);

  if (!result.valid) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: result.error },
    });
  }

  // 2. Allow the device id to come from the body, fall back to the default.
  const deviceId = req.body.device ?? DEFAULT_DEVICE_ID;

  // 3. Persist the validated reading.
  try {
    await saveReading(deviceId, result.data);
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(500).json({
      error: { code: 'SAVE_FAILED', message: 'Could not save the reading' },
    });
  }
});

export default router;