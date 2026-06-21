import express from 'express'
import {
  getAccreditedSellers,
  getAccreditedSeller,
  createAccreditedSeller,
  updateAccreditedSeller,
  deleteAccreditedSeller,
  getSellerHierarchy,
  getPossibleParentSellers,
  getSellerGroups,
  createSellerGroup,
  updateSellerGroup,
} from '../controllers/accreditedSellers.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/accredited-sellers', getAccreditedSellers)
router.get('/accredited-sellers/hierarchy', getSellerHierarchy)
router.get('/accredited-sellers/possible-parents', getPossibleParentSellers)
router.get('/seller-groups', getSellerGroups)
router.post('/seller-groups', createSellerGroup)
router.patch('/seller-groups/:id', updateSellerGroup)
router.get('/accredited-sellers/:id', getAccreditedSeller)
router.post('/accredited-sellers', createAccreditedSeller)
router.patch('/accredited-sellers/:id', updateAccreditedSeller)

router.delete('/accredited-sellers/:id', deleteAccreditedSeller)

export default router
