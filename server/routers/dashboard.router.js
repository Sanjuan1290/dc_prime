import express from 'express'
import {
  getDashboardSummary,
  getAgentPerformance
} from '../controllers/dashboard.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/dashboard/summary', auth, getDashboardSummary)
router.get('/dashboard/agent-performance', auth, getAgentPerformance)

export default router
