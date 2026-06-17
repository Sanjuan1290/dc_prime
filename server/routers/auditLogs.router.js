import express from 'express'
import {
  getAuditLogs,
  getAuditLog
} from '../controllers/auditLogs.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/audit-logs', getAuditLogs)
router.get('/audit-logs/:id', getAuditLog)

export default router
