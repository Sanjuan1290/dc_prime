import express from 'express'
import {
  getPayments,
  getPayment,
  getPaymentsByClientUnit,
  createPayment,
  updatePayment,
  deletePayment,
} from '../controllers/payments.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/payments', auth, getPayments)
router.get('/payments/:id', auth, getPayment)
router.post('/payments', auth, createPayment)
router.patch('/payments/:id', auth, updatePayment)
router.delete('/payments/:id', auth, deletePayment)
router.get('/client-units/:clientUnitId/payments', auth, getPaymentsByClientUnit)

export default router