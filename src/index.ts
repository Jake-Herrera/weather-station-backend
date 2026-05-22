import express from 'express';
import 'dotenv/config';
import '@/db/firebase.js';
import dataRouter from '@/routes/data.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Allow Express to parse JSON bodies (ESP32 readings will arrive as JSON)
app.use(express.json());

// Health endpoint: confirms the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount the data ingestion route
app.use(dataRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});