import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { db } from './db/connect.js'

import usersRouter from './routers/users.router.js'
import projectsRouter from './routers/projects.router.js'
import listingsRouter from './routers/listings.router.js'
import clientsRouter from './routers/clients.router.js'
import clientUnitsRouter from './routers/clientUnits.router.js'
import documentsRouter from './routers/documents.router.js'
import paymentsRouter from './routers/payments.router.js'
import accreditedSellersRouter from './routers/accreditedSellers.router.js'
import commissionsRouter from './routers/commissions.router.js'
import employeesRouter from './routers/employees.router.js'
import attendanceRouter from './routers/attendance.router.js'
import dashboardRouter from './routers/dashboard.router.js'
import reportsRouter from './routers/reports.router.js'
import auditLogsRouter from './routers/auditLogs.router.js'
import settingsRouter from './routers/settings.router.js'
import useCurrentUser from './utils/useCurrentUser.js'
import cashAdvancesRouter from './routers/cashAdvances.router.js'
import printFormsRouter from './routers/printForms.router.js'

const app = express()

app.set('trust proxy', 1)

app.use(express.json())
app.use(cookieParser())

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.get('/api/v1/getCurrentUser', useCurrentUser)

app.use('/api/v1', usersRouter)
app.use('/api/v1', projectsRouter)
app.use('/api/v1', listingsRouter)
app.use('/api/v1', clientsRouter)
app.use('/api/v1', clientUnitsRouter)
app.use('/api/v1', documentsRouter)
app.use('/api/v1', paymentsRouter)
app.use('/api/v1', accreditedSellersRouter)
app.use('/api/v1', commissionsRouter)
app.use('/api/v1', employeesRouter)
app.use('/api/v1', attendanceRouter)
app.use('/api/v1', dashboardRouter)
app.use('/api/v1', reportsRouter)
app.use('/api/v1', auditLogsRouter)
app.use('/api/v1', settingsRouter)
app.use('/api/v1', cashAdvancesRouter)
app.use('/api/v1', printFormsRouter)

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  })
})

app.use((err, req, res, _next) => {
  console.error(err)

  res.status(err.status || err.statusCode || 500).json({
    message: err.message || 'Internal server error'
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
