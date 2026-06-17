import express from 'express'
import {
  getDashboardSummary,
  getAgentPerformance
} from '../controllers/dashboard.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/dashboard/summary', getDashboardSummary)
router.get('/dashboard/agent-performance', getAgentPerformance)

export default router
