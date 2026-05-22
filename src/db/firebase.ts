import admin from 'firebase-admin'
import 'dotenv/config'
import type { Reading } from '../types/reading.js'

// Initialize the Firebase Admin SDK using credentials from environment variables.
// The Admin SDK has server-side privileges, so it can write to the database
// regardless of the security rules (those rules only restrict client access).
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key has escaped newlines (\n) in the .env file.
    // We convert them back into real line breaks here.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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