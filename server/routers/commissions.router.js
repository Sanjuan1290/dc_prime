import express from 'express'
import {
  getCommissions,
  getCommission,
  getCommissionsByClientUnit,
  createCommission,
  updateCommission,
  getCommissionSummary,
  createHierarchyCommissions
} from '../controllers/commissions.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/commissions', auth, getCommissions)
router.get('/commissions-summary', auth, getCommissionSummary)
router.get('/commissions/:id', auth, getCommission)
router.post('/commissions', auth, createCommission)
router.patch('/commissions/:id', auth, updateCommission)
router.get('/client-units/:clientUnitId/commissions', auth, getCommissionsByClientUnit)
router.post('/client-units/:clientUnitId/commissions/generate-hierarchy', auth, createHierarchyCommissions)

export default router
