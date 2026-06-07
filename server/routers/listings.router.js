import express from 'express'
import {
  getListings,
  getListing,
  getListingFullDetails,
  createListing,
  updateListing
} from '../controllers/listings.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/listings', auth, getListings)
router.get('/listings/:id/full-details', auth, getListingFullDetails)
router.get('/listings/:id', auth, getListing)
router.post('/listings', auth, createListing)
router.patch('/listings/:id', auth, updateListing)

export default router