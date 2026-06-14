import express from 'express'
import {
  getCashAdvances,
  getCashAdvance,
  createCashAdvance,
  updateCashAdvance,
  approveCashAdvance,
  rejectCashAdvance,
  cancelCashAdvance,
  getCashAdvanceSummary,
  getSellerCommissionSummaryForCashAdvance,
} from '../controllers/cashAdvances.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/cash-advances', getCashAdvances)
router.get('/cash-advances-summary', getCashAdvanceSummary)
router.get('/accredited-sellers/:sellerId/commission-summary', getSellerCommissionSummaryForCashAdvance)
router.get('/cash-advances/:id', getCashAdvance)
router.post('/cash-advances', createCashAdvance)
router.patch('/cash-advances/:id', updateCashAdvance)
router.patch('/cash-advances/:id/approve', approveCashAdvance)
router.patch('/cash-advances/:id/reject', rejectCashAdvance)
router.patch('/cash-advances/:id/cancel', cancelCashAdvance)

export default router
