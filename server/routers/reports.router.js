import express from 'express'
import {
  getSalesReport,
  getCollectionsReport,
  getInventoryReport,
  getCommissionsReport,
  getDocumentsReport,
  getClientsReport
} from '../controllers/reports.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/reports/sales', auth, getSalesReport)
router.get('/reports/collections', auth, getCollectionsReport)
router.get('/reports/inventory', auth, getInventoryReport)
router.get('/reports/commissions', auth, getCommissionsReport)
router.get('/reports/documents', auth, getDocumentsReport)
router.get('/reports/clients', auth, getClientsReport)

export default router
