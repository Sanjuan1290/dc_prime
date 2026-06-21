import express from 'express'
import {
  getSalesReport,
  getCollectionsReport,
  getInventoryReport,
  getCommissionsReport,
  getDocumentsReport,
  getClientsReport,
  getBuyerAccountsReport,
  getPastDueAccountsReport,
  getSellerGroupsReport,
  getCashAdvancesReport,
  getVouchersReport,
  getCancellationsReport,
  getProofIncomeRequestsReport
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
router.get('/reports/buyer_accounts', getBuyerAccountsReport)
router.get('/reports/past_due_accounts', getPastDueAccountsReport)
router.get('/reports/seller_groups', getSellerGroupsReport)
router.get('/reports/cash_advances', getCashAdvancesReport)
router.get('/reports/vouchers', getVouchersReport)
router.get('/reports/cancellations', getCancellationsReport)
router.get('/reports/proof_income_requests', getProofIncomeRequestsReport)

export default router
