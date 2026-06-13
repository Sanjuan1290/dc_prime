import express from 'express'
import {
  getClientUnitPrintData,
  logClientUnitFormPrint,
} from '../controllers/printForms.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/client-units/:clientUnitId/print-data', auth, getClientUnitPrintData)
router.post('/client-units/:clientUnitId/form-prints', auth, logClientUnitFormPrint)

export default router
