import express from 'express'
import {
  getEmailLogs,
  getMissingDocumentNotifications,
  getNotificationSummary,
  getPastDueNotifications,
  getPaymentDueSoonNotifications,
  sendCustomEmail,
  sendMissingDocumentsEmail,
  sendPastDueEmail,
  sendPaymentDueEmail,
} from '../controllers/notifications.controller.js'
import { auth, adminOnly } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(auth, adminOnly)

router.get('/notifications/summary', getNotificationSummary)
router.get('/notifications/payment-due-soon', getPaymentDueSoonNotifications)
router.get('/notifications/past-due', getPastDueNotifications)
router.get('/notifications/missing-documents', getMissingDocumentNotifications)
router.get('/notifications/email-logs/:clientUnitId', getEmailLogs)

router.post('/notifications/send-payment-due-email', sendPaymentDueEmail)
router.post('/notifications/send-past-due-email', sendPastDueEmail)
router.post('/notifications/send-missing-documents-email', sendMissingDocumentsEmail)
router.post('/notifications/send-custom-email', sendCustomEmail)

export default router
