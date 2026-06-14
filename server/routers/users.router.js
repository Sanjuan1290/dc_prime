import express from 'express'
import { changePassword, login, logout } from '../controllers/users.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/logout', auth, logout)
router.patch('/change-password', auth, changePassword)

export default router
