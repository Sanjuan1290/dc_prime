import express from 'express'
import { auth } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
import {
  createUser,
  deactivateUser,
  getUsers,
  linkUserToSeller,
  updateUser,
} from '../controllers/usersManagement.controller.js'

const router = express.Router()

router.get('/users', auth, requireRole('super_admin'), getUsers)
router.post('/users', auth, requireRole('super_admin'), createUser)
router.patch('/users/:id', auth, requireRole('super_admin'), updateUser)
router.delete('/users/:id', auth, requireRole('super_admin'), deactivateUser)
router.patch('/users/:id/link-seller', auth, requireRole('super_admin'), linkUserToSeller)

export default router
