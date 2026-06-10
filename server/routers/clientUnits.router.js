import express from 'express'
import {
  getClientUnits,
  getClientUnit,
  updateClientUnit,
  changeClientUnitListing,
  cancelClientUnit,
  deleteClientUnit,
  getClientUnitsByClient,
  getAvailableListings,
  reserveListing,
  searchClientUnits
} from '../controllers/clientUnits.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/client-units', auth, getClientUnits)
router.get('/client-units/search', auth, searchClientUnits)
router.get('/client-units/:id', auth, getClientUnit)
router.patch('/client-units/:id', auth, updateClientUnit)
router.patch('/client-units/:id/change-listing', auth, changeClientUnitListing)
router.patch('/client-units/:id/cancel', auth, cancelClientUnit)
router.delete('/client-units/:id', auth, deleteClientUnit)
router.get('/clients/:clientId/units', auth, getClientUnitsByClient)
router.get('/available-listings', auth, getAvailableListings)
router.post('/clients/:clientId/reserve-listing', auth, reserveListing)

export default router