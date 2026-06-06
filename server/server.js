import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { db } from './db/connect.js'
import usersRouter from './routers/users.router.js'

const app = express()

// Middlewares
app.use(express.json())

app.use(cookieParser())

app.use(cors({
  origin: 'http://localhost:5173', // your Vite frontend
  credentials: true
}))

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.use('/api/v1', usersRouter)

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

const PORT = process.env.PORT || 5000


app.listen(PORT, async () => {
  try{
    console.log(`Server running on port ${PORT}`)
    await db.query('SELECT 1')
    console.log('🟢 Database connected successfully')
  }catch(err){
    console.error('Failed to start server:', err.message)
    console.log('🔴 Database connection failed')
    process.exit(1)
  }
})

