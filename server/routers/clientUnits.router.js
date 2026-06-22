import express from 'express'
import {
  getClientUnits,
  getClientUnit,
  getClientUnitPaymentSchedules,
  updateClientUnit,
  changeClientUnitListing,
  cancelClientUnit,
  deleteClientUnit,
  getClientUnitsByClient,
  getAvailableListings,
  reserveListing,
  searchClientUnits
} from '../controllers/clientUnits.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/client-units', getClientUnits)
router.get('/client-units/search', searchClientUnits)
router.get('/client-units/:id', getClientUnit)
router.get('/client-units/:id/payment-schedules', getClientUnitPaymentSchedules)
router.patch('/client-units/:id', updateClientUnit)
router.patch('/client-units/:id/change-listing', changeClientUnitListing)
router.patch('/client-units/:id/cancel', cancelClientUnit)
router.delete('/client-units/:id', deleteClientUnit)
router.get('/clients/:clientId/units', getClientUnitsByClient)
router.get('/available-listings', getAvailableListings)
router.post('/clients/:clientId/reserve-listing', reserveListing)

export default router
