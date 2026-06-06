import express from 'express'
import {
  getSettings,
  getSetting,
  updateSettings,
  updateSetting
} from '../controllers/settings.controller.js'
import {
  auth,
  adminOnly
} from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/settings', auth, getSettings)
router.get('/settings/:key', auth, getSetting)
router.patch('/settings', auth, adminOnly, updateSettings)
router.patch('/settings/:key', auth, adminOnly, updateSetting)

export default router
