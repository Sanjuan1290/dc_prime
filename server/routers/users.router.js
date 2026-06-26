import express from 'express'
import { changePassword, login, logout } from '../controllers/users.controller.js'
import { auth } from '../middlewares/auth.middleware.js'
import { authRateLimit, passwordRateLimit } from '../middlewares/rateLimit.middleware.js'

const router = express.Router()

router.post('/login', authRateLimit, login)
router.post('/logout', auth, logout)
router.patch('/change-password', auth, passwordRateLimit, changePassword)

export default router

