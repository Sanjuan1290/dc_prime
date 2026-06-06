import express from 'express'
import {
  getAuditLogs,
  getAuditLog
} from '../controllers/auditLogs.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/audit-logs', auth, getAuditLogs)
router.get('/audit-logs/:id', auth, getAuditLog)

export default router
