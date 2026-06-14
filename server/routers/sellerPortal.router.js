import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import {
  getSellerAvailableUnits,
  getSellerDashboard,
  getSellerSales,
  getSellerTeam,
} from '../controllers/sellerPortal.controller.js'

const router = express.Router()

router.get('/seller/dashboard', auth, getSellerDashboard)
router.get('/seller/available-units', auth, getSellerAvailableUnits)
router.get('/seller/team', auth, getSellerTeam)
router.get('/seller/sales', auth, getSellerSales)

export default router
