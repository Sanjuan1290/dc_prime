import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import 'express-async-errors'

import { db } from './db/connect.js'

import usersRouter from './routers/users.router.js'
import sellerPortalRouter from './routers/sellerPortal.router.js'

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
import cashAdvancesRouter from './routers/cashAdvances.router.js'
import printFormsRouter from './routers/printForms.router.js'
import usersManagementRouter from './routers/usersManagement.router.js'
import sellerGroupsRouter from './routers/sellerGroups.router.js'

import useCurrentUser from './utils/useCurrentUser.js'
import { startPaymentReminderJob } from './jobs/paymentReminderJob.js'
import { startDocumentReminderJob } from './jobs/documentReminderJob.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet())

app.use(express.json())
app.use(cookieParser())

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.get('/api/v1/getCurrentUser', useCurrentUser)

/*
  IMPORTANT:
  Mount public/auth routes and seller portal routes BEFORE admin routers.

  Admin routers use router.use(auth, adminOnly).
  Since all routers are mounted at /api/v1, an admin router mounted earlier
  will run its adminOnly middleware even for /api/v1/seller/... requests.

  That is why BNM was getting:
  { "message": "Admin access only." }

  Do not move sellerPortalRouter below admin routers.
*/
app.use('/api/v1', usersRouter)
app.use('/api/v1', sellerPortalRouter)

/*
  Admin-only routers.
  These are mounted after sellerPortalRouter so seller routes are not blocked
  by router-level adminOnly middleware.
*/
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
app.use('/api/v1', usersManagementRouter)
app.use('/api/v1', sellerGroupsRouter)

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  })
})

app.use((err, req, res, _next) => {
  console.error(err)

  const isInvalidJson =
    err instanceof SyntaxError &&
    err.status === 400 &&
    'body' in err

  if (isInvalidJson) {
    return res.status(400).json({
      message: 'Invalid JSON body.',
    })
  }

  if (err.code === 'UNSUPPORTED_DOCUMENT_TYPE') {
    return res.status(400).json({
      message: err.message,
    })
  }

  if (err.name === 'MulterError') {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large. Maximum size is 10 MB.'
        : err.message || 'File upload failed.'

    return res.status(status).json({ message })
  }

  const status = err.status || err.statusCode || 500

  const response = {
    message: err.message || 'Internal server error',
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack
  }

  return res.status(status).json(response)
})

const PORT = process.env.PORT || 5000

if (process.env.ENABLE_EMAIL_JOBS !== 'false') {
  startPaymentReminderJob()
  startDocumentReminderJob()
}

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
