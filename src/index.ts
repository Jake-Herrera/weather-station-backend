import express from 'express'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3000

// Allow Express to parse JSON bodies (ESP32 readings will arrive as JSON)
app.use(express.json())

// Health endpoint: confirms the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})