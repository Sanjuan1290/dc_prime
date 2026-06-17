import express from 'express'
import {
  getListings,
  getListing,
  getListingFullDetails,
  getListingDocumentRequirements,
  updateListingDocumentRequirements,
  resetListingDocumentRequirements,
  createListing,
  updateListing,
  deleteListing
} from '../controllers/listings.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/listings', getListings)
router.get('/listings/:id/full-details', getListingFullDetails)
router.get('/listings/:id/document-requirements', getListingDocumentRequirements)
router.put('/listings/:id/document-requirements', updateListingDocumentRequirements)
router.post('/listings/:id/document-requirements/reset', resetListingDocumentRequirements)
router.get('/listings/:id', getListing)
router.post('/listings', createListing)
router.patch('/listings/:id', updateListing)

router.delete('/listings/:id', deleteListing)

export default router
