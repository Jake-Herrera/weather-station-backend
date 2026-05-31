// Must be the first import: configures DNS preferences before anything makes network calls.
import '@/config/dns.js';
import express from 'express';
import 'dotenv/config';
import './db/firebase.js';
import dataRouter from '@/routes/data.js';
import readingsRouter from '@/routes/readings.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Allow Express to parse JSON bodies (ESP32 readings will arrive as JSON)
app.use(express.json());

// Health endpoint: confirms the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount routes
app.use(dataRouter);
app.use(readingsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});