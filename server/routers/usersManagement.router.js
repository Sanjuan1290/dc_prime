import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
import { passwordRateLimit } from '../middlewares/rateLimit.middleware.js'
import {
  createUser,
  deactivateUser,
  getCommissionRoleDefaults,
  updateCommissionRoleDefaults,
  getUsers,
  linkUserToSeller,
  resetUserTemporaryPassword,
  updateUser,
} from '../controllers/usersManagement.controller.js'

const router = express.Router()

router.get('/commission-role-defaults', auth, requireRole('super_admin', 'admin'), getCommissionRoleDefaults)
router.patch('/commission-role-defaults', auth, requireRole('super_admin'), updateCommissionRoleDefaults)

router.get('/users', auth, requireRole('super_admin', 'admin'), getUsers)
router.post('/users', auth, requireRole('super_admin', 'admin'), createUser)
router.patch('/users/:id', auth, requireRole('super_admin', 'admin'), updateUser)
router.delete('/users/:id', auth, requireRole('super_admin', 'admin'), deactivateUser)
router.patch('/users/:id/link-seller', auth, requireRole('super_admin', 'admin'), linkUserToSeller)
router.patch('/users/:id/reset-temporary-password', auth, requireRole('super_admin', 'admin'), passwordRateLimit, resetUserTemporaryPassword)

export default router
