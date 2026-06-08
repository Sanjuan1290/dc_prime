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
} from '../controllers/cashAdvances.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/cash-advances', auth, getCashAdvances)
router.get('/cash-advances-summary', auth, getCashAdvanceSummary)
router.get('/cash-advances/:id', auth, getCashAdvance)
router.post('/cash-advances', auth, createCashAdvance)
router.patch('/cash-advances/:id', auth, updateCashAdvance)
router.patch('/cash-advances/:id/approve', auth, approveCashAdvance)
router.patch('/cash-advances/:id/reject', auth, rejectCashAdvance)
router.patch('/cash-advances/:id/cancel', auth, cancelCashAdvance)

export default router