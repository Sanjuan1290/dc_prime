import express from 'express'
import {
  getClientUnitPrintData,
  logClientUnitFormPrint,
} from '../controllers/printForms.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/client-units/:clientUnitId/print-data', getClientUnitPrintData)
router.post('/client-units/:clientUnitId/form-prints', logClientUnitFormPrint)

export default router

