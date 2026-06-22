import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import {
  getReservationContactSettings,
  getSellerAvailableUnits,
  getSellerDashboard,
  getSellerSales,
  getSellerTeam,
  updateSellerTeamRate,
} from '../controllers/sellerPortal.controller.js'

const router = express.Router()

// Seller portal routes are intentionally NOT admin-only.
// They are used by broker_network_manager, broker, manager, and agent accounts.
// Office users can also open them for testing/monitoring.
router.use(auth)

router.get('/seller/dashboard', getSellerDashboard)
router.get('/seller/reservation-contact', getReservationContactSettings)
router.get('/seller/available-units', getSellerAvailableUnits)
router.get('/seller/team', getSellerTeam)
router.patch('/seller/team/:sellerId/rate', updateSellerTeamRate)
router.get('/seller/sales', getSellerSales)

export default router
