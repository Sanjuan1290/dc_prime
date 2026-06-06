import express from 'express'
import { login, logout } from '../controllers/users.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/logout', auth, logout)

export default router