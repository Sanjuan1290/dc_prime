import express from 'express'
import {
  getAccreditedSellers,
  getAccreditedSeller,
  createAccreditedSeller,
  updateAccreditedSeller,
  getSellerHierarchy,
  getPossibleParentSellers
} from '../controllers/accreditedSellers.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/accredited-sellers', auth, getAccreditedSellers)
router.get('/accredited-sellers/hierarchy', auth, getSellerHierarchy)
router.get('/accredited-sellers/possible-parents', auth, getPossibleParentSellers)
router.get('/accredited-sellers/:id', auth, getAccreditedSeller)
router.post('/accredited-sellers', auth, createAccreditedSeller)
router.patch('/accredited-sellers/:id', auth, updateAccreditedSeller)

export default router
