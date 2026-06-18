import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import connectDB from './backend/config/db.js'
import expertRoutes from './backend/routes/expertRoutes.js'
import bookingRoutes from './backend/routes/bookingRoutes.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH']
  }
})

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use((req, res, next) => {
  req.io = io
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/experts', expertRoutes)
app.use('/api/bookings', bookingRoutes)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  res.status(status).json({ message: err.message || 'Server error' })
})

const port = process.env.PORT || 5000

connectDB()
  .then(() => {
    server.listen(port, () => {
      // Keep the log short so it is useful in both local dev and CI.
      console.log(`API listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
