import express from 'express'
import {
  getCommissions,
  getCommission,
  getCommissionsByClientUnit,
  createCommission,
  updateCommission,
  addMissingOverrideCommission,
  getCommissionSummary,
  createHierarchyCommissions,
  getCommissionReleases,
  generateReleaseMilestones,
  markReleaseStage,
  cancelRelease,
  holdRelease,
  unholdRelease,
  restoreCancelledRelease,
  deductCashAdvanceManual,
  getApprovedCashAdvancesBySeller,
  markClientUnitRetentionEligible,
} from '../controllers/commissions.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/commissions', getCommissions)
router.get('/commissions-summary', getCommissionSummary)

router.get('/commissions/:id/releases', getCommissionReleases)
router.post('/commissions/:id/releases/generate', generateReleaseMilestones)
router.post('/commissions/:id/missing-override', addMissingOverrideCommission)

router.patch('/commission-releases/:id/mark-released', markReleaseStage)
router.patch('/commission-releases/:id/cancel', cancelRelease)
router.patch('/commission-releases/:id/hold', holdRelease)
router.patch('/commission-releases/:id/unhold', unholdRelease)
router.patch('/commission-releases/:id/restore-cancelled', restoreCancelledRelease)
router.patch('/commission-releases/:id/deduct-advance', deductCashAdvanceManual)

router.get('/sellers/:sellerId/approved-cash-advances', getApprovedCashAdvancesBySeller)

router.get('/commissions/:id', getCommission)
router.post('/commissions', createCommission)
router.patch('/commissions/:id', updateCommission)

router.patch('/client-units/:clientUnitId/commission-retention/eligible', markClientUnitRetentionEligible)
router.get('/client-units/:clientUnitId/commissions', getCommissionsByClientUnit)
router.post(
  '/client-units/:clientUnitId/commissions/generate-hierarchy',
  createHierarchyCommissions
)

export default router

