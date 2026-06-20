import admin from 'firebase-admin'
import 'dotenv/config'
import type { Reading } from '../types/reading.js'

export type DeviceMeta = {
  name: string;
  location: string;
  elevation_m: number;
}

// Initialize the Firebase Admin SDK using credentials from environment variables.
// The Admin SDK has server-side privileges, so it can write to the database
// regardless of the security rules (those rules only restrict client access).
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key has escaped newlines (\n) in the .env file.
    // We convert them back into real line breaks here.
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')   // convert literal \n into real line breaks
      .replace(/^"|"$/g, ''),    // strip surrounding quotes if present
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
})

// Export the database instance so other modules can read/write.
export const db = admin.database()

// Save a single reading under readings/<deviceId>/<autoId>.
// push() generates a unique ID automatically (matches the data layer design).
export async function saveReading(deviceId: string, reading: Reading): Promise<void> {
  await db.ref(`readings/${deviceId}`).push(reading)
}

// Fetch readings for a device since a given start timestamp.
// Uses orderByChild('ts') + startAt() to filter by time range on the server side.
export async function getReadings(deviceId: string, startTs: number): Promise<Reading[]> {
  const snapshot = await db
    .ref(`readings/${deviceId}`)
    .orderByChild('ts')
    .startAt(startTs)
    .once('value');

  const value = snapshot.val();

  // Firebase returns an object keyed by auto-id (or null if nothing matched).
  // Convert it into a plain array of readings.
  if (!value) {
    return [];
  }

  return Object.values(value) as Reading[];
}

// Fetch the single most recent reading for a device.
export async function getLatestReading(deviceId: string): Promise<Reading | null> {
  const snapshot = await db
    .ref(`readings/${deviceId}`)
    .orderByChild('ts')
    .limitToLast(1)
    .once('value');

  const value = snapshot.val();
  if (!value) return null;

  return (Object.values(value) as Reading[])[0] ?? null;
}

// Fetch readings within a closed time range, capped at limit.
export async function getReadingsInRange(
  deviceId: string,
  startTs: number,
  endTs: number,
  limit: number,
): Promise<Reading[]> {
  const snapshot = await db
    .ref(`readings/${deviceId}`)
    .orderByChild('ts')
    .startAt(startTs)
    .endAt(endTs)
    .limitToLast(limit)
    .once('value');

  const value = snapshot.val();
  if (!value) return [];

  return (Object.values(value) as Reading[]).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
}

// Fetch device metadata from devices/{deviceId}.
export async function getDeviceMeta(deviceId: string): Promise<DeviceMeta | null> {
  const snapshot = await db.ref(`devices/${deviceId}`).once('value');
  return snapshot.val() as DeviceMeta | null;
}