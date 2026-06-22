import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
import {
  createSellerGroup,
  getSellerGroups,
  recalculateSellerGroupMembers,
  updateSellerGroup,
} from '../controllers/sellerGroups.controller.js'

const router = express.Router()

router.get('/seller-groups', auth, requireRole('super_admin', 'admin'), getSellerGroups)
router.post('/seller-groups', auth, requireRole('super_admin', 'admin'), createSellerGroup)
router.patch('/seller-groups/:id', auth, requireRole('super_admin', 'admin'), updateSellerGroup)
router.post('/seller-groups/:id/recalculate-members', auth, requireRole('super_admin', 'admin'), recalculateSellerGroupMembers)

export default router
