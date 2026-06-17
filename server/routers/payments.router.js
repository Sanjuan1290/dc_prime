import express from 'express'
import {
  getPayments,
  getPayment,
  getPaymentsByClientUnit,
  getPaymentSuggestions,
  createPayment,
  updatePayment,
  deletePayment,
} from '../controllers/payments.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/payments', getPayments)
router.get('/payments/:id', getPayment)
router.post('/payments', createPayment)
router.patch('/payments/:id', updatePayment)
router.delete('/payments/:id', deletePayment)
router.get('/client-units/:clientUnitId/payments', getPaymentsByClientUnit)
router.get('/client-units/:clientUnitId/payment-suggestions', getPaymentSuggestions)

export default router
