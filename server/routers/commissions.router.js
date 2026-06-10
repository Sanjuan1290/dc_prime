import express from 'express'
import {
  getCommissions,
  getCommission,
  getCommissionsByClientUnit,
  createCommission,
  updateCommission,
  getCommissionSummary,
  createHierarchyCommissions,
  getCommissionReleases,
  generateReleaseMilestones,
  markReleaseStage,
  deductCashAdvance,
  cancelRelease,
  holdRelease,
  unholdRelease,
  getApprovedCashAdvancesBySeller,
} from '../controllers/commissions.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/commissions', auth, getCommissions)
router.get('/commissions-summary', auth, getCommissionSummary)

router.get('/commissions/:id/releases', auth, getCommissionReleases)
router.post('/commissions/:id/releases/generate', auth, generateReleaseMilestones)

router.patch('/commission-releases/:id/mark-released', auth, markReleaseStage)
router.patch('/commission-releases/:id/deduct-advance', auth, deductCashAdvance)
router.patch('/commission-releases/:id/cancel', auth, cancelRelease)
router.patch('/commission-releases/:id/hold', auth, holdRelease)
router.patch('/commission-releases/:id/unhold', auth, unholdRelease)

router.get('/sellers/:sellerId/approved-cash-advances', auth, getApprovedCashAdvancesBySeller)

router.get('/commissions/:id', auth, getCommission)
router.post('/commissions', auth, createCommission)
router.patch('/commissions/:id', auth, updateCommission)

router.get('/client-units/:clientUnitId/commissions', auth, getCommissionsByClientUnit)
router.post(
  '/client-units/:clientUnitId/commissions/generate-hierarchy',
  auth,
  createHierarchyCommissions
)

export default router
