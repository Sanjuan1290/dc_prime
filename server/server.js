import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { db } from './db/connect.js'

const app = express()

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use(cors({
  origin: 'http://localhost:5173', // your Vite frontend
  credentials: true
}))

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

// API routes
// app.use('/api/v1/auth', authRoutes)
// app.use('/api/v1/users', userRoutes)
// app.use('/api/v1/blogs', blogRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  })
})

const PORT = process.env.PORT || 3000

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    await db.query('SELECT 1')
    console.log('🟢 Database connected successfully')
  })
}

startServer().catch((error) => {
    console.error('Failed to start server:', error.message)
    console.log('🔴 Database connection failed')
    process.exit(1)
})
