import 'dotenv/config';
import { db } from '../src/db/firebase';

const DEVICE_ID = process.env.DEFAULT_DEVICE_ID || 'esp32-01';

// --- Config ---
const DAYS = 30;                          // how many days of history to generate
const INTERVAL_MINUTES = 15;             // one reading every 15 minutes
const READINGS = (DAYS * 24 * 60) / INTERVAL_MINUTES; // ~672 readings

// --- Realistic value helpers ---

// Temperature follows a daily cycle: warmer in the afternoon, cooler at night.
function tempForTime(date: Date): number {
  const hour = date.getHours() + date.getMinutes() / 60;
  const dailyCycle = Math.sin(((hour - 9) / 24) * 2 * Math.PI);
  const base = 22;          // average °C
  const amplitude = 4;      // ±4°C swing
  const noise = (Math.random() - 0.5) * 0.6;
  return +(base + dailyCycle * amplitude + noise).toFixed(2);
}

// Pressure drifts slowly around a baseline.
function pressureForTime(index: number): number {
  const slowWave = Math.sin(index / 40) * 3;
  const noise = (Math.random() - 0.5) * 0.4;
  return +(1012 + slowWave + noise).toFixed(2);
}

// Altitude derived from pressure (lower pressure → higher altitude).
function altitudeForPressure(pressure: number): number {
  const base = 141;
  const delta = (1013 - pressure) * 2;
  const noise = (Math.random() - 0.5) * 0.5;
  return +(base + delta + noise).toFixed(1);
}

async function seed() {
  console.log(`Generating ${READINGS} readings over ${DAYS} days...`);

  const now = Date.now();
  const intervalMs = INTERVAL_MINUTES * 60 * 1000;
  const ref = db.ref(`readings/${DEVICE_ID}`);

  let count = 0;

  for (let i = 0; i < READINGS; i++) {
    const ts = now - (READINGS - i) * intervalMs; // oldest first, up to now
    const date = new Date(ts);
    const pressure = pressureForTime(i);

    const reading = {
      ts,
      temp_c: tempForTime(date),
      pressure_hpa: pressure,
      altitude_m: altitudeForPressure(pressure),
    };

    await ref.push(reading);
    count++;

    if (count % 50 === 0) {
      console.log(`  ${count}/${READINGS} written...`);
    }
  }

  console.log(`✅ Done. Wrote ${count} readings.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});