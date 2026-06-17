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

router.use(auth, adminOnly)

router.get('/settings', getSettings)
router.get('/settings/:key', getSetting)
router.patch('/settings', updateSettings)
router.patch('/settings/:key', updateSetting)

export default router
