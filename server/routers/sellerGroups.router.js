import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
import {
  createSellerGroup,
  deleteSellerGroup,
  getSellerGroupCommissionPreview,
  getSellerGroupDetails,
  getSellerGroups,
  recalculateSellerGroupMembers,
  updateSellerGroup,
  updateSellerGroupMemberRates,
} from '../controllers/sellerGroups.controller.js'

const router = express.Router()
const requireSuperAdminForSellerGroupRates = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admin can update seller group rates.' })
  }
  next()
}

router.get('/seller-groups', auth, requireRole('super_admin', 'admin'), getSellerGroups)
router.get('/seller-groups/commission-preview', auth, requireRole('super_admin', 'admin'), getSellerGroupCommissionPreview)
router.get('/seller-groups/:id/details', auth, requireRole('super_admin', 'admin'), getSellerGroupDetails)
router.post('/seller-groups', auth, requireSuperAdminForSellerGroupRates, createSellerGroup)
router.patch('/seller-groups/:id', auth, requireSuperAdminForSellerGroupRates, updateSellerGroup)
router.delete('/seller-groups/:id', auth, requireSuperAdminForSellerGroupRates, deleteSellerGroup)
router.post('/seller-groups/:id/recalculate-members', auth, requireSuperAdminForSellerGroupRates, recalculateSellerGroupMembers)
router.patch('/seller-groups/:groupId/members/:sellerId/rates', auth, requireSuperAdminForSellerGroupRates, updateSellerGroupMemberRates)

export default router
