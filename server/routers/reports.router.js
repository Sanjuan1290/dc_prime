import express from 'express'
import {
  getSalesReport,
  getCollectionsReport,
  getInventoryReport,
  getCommissionsReport,
  getDocumentsReport,
  getClientsReport
} from '../controllers/reports.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/reports/sales', getSalesReport)
router.get('/reports/collections', getCollectionsReport)
router.get('/reports/inventory', getInventoryReport)
router.get('/reports/commissions', getCommissionsReport)
router.get('/reports/documents', getDocumentsReport)
router.get('/reports/clients', getClientsReport)

export default router
