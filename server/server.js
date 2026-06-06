import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { db } from './db/connect.js'
import usersRouter from './routers/users.router.js'
import projectsRouter from './routers/projects.router.js'
import useCurrentUser from './utils/useCurrentUser.js'

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.get('/api/v1/getCurrentUser', useCurrentUser)

app.use('/api/v1', usersRouter)
app.use('/api/v1', projectsRouter)

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  })
})

app.use((err, req, res, next) => {
  console.error(err)

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, async () => {
  try {
    console.log(`Server running on port ${PORT}`)
    await db.query('SELECT 1')
    console.log('🟢 Database connected successfully')
  } catch (err) {
    console.error('Failed to start server:', err.message)
    console.log('🔴 Database connection failed')
    process.exit(1)
  }
})