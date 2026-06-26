import express from 'express'
import {
  getClientUnits,
  getClientUnit,
  updateClientUnit,
  changeClientUnitListing,
  cancelClientUnit,
  updateCancellationSettlement,
  releaseCancellationRefund,
  clearClientUnitForResale,
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
router.patch('/client-units/:id', updateClientUnit)
router.patch('/client-units/:id/change-listing', changeClientUnitListing)
router.patch('/client-units/:id/cancel', cancelClientUnit)
router.patch('/client-units/:id/cancellation-settlement', updateCancellationSettlement)
router.patch('/client-units/:id/cancellation-refund-release', releaseCancellationRefund)
router.patch('/client-units/:id/clear-for-resale', clearClientUnitForResale)
router.delete('/client-units/:id', deleteClientUnit)
router.get('/clients/:clientId/units', getClientUnitsByClient)
router.get('/available-listings', getAvailableListings)
router.post('/clients/:clientId/reserve-listing', reserveListing)

export default router

