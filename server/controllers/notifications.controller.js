import {
  getClientUnitEmailContext,
  getMissingDocumentRows,
  getMissingDocumentsForClientUnit,
  getPastDueRows,
  getPaymentDueSoonRows,
  getScheduleEmailContext,
} from '../services/notifications/notificationQuery.service.js'
import { getEmailLogsByClientUnit } from '../services/notifications/emailLog.service.js'
import { sendTrackedClientEmail } from '../services/notifications/clientEmail.service.js'
import { buildPaymentDueEmail } from '../templates/emails/paymentDue.email.js'
import { buildMissingDocumentsEmail } from '../templates/emails/missingDocuments.email.js'
import { buildPastDueEmail } from '../templates/emails/pastDue.email.js'
import { buildCustomEmail } from '../templates/emails/custom.email.js'

const isMissing = (value) => value === undefined || value === null || String(value).trim() === ''

const buildContext = async (clientUnitId) => {
  const context = await getClientUnitEmailContext(clientUnitId)

  if (!context) {
    return {
      error: {
        status: 404,
        message: 'Client unit not found.',
      },
    }
  }

  if (!context.client_email) {
    return {
      error: {
        status: 400,
        message: 'Client email is missing.',
      },
    }
  }

  return { context }
}

export const getPaymentDueSoonNotifications = async (req, res) => {
  const rows = await getPaymentDueSoonRows()

  res.status(200).json({
    message: 'Payment due soon notifications fetched successfully.',
    notifications: rows,
    data: rows,
  })
}

export const getPastDueNotifications = async (req, res) => {
  const rows = await getPastDueRows()

  res.status(200).json({
    message: 'Past due notifications fetched successfully.',
    notifications: rows,
    data: rows,
  })
}

export const getMissingDocumentNotifications = async (req, res) => {
  const rows = await getMissingDocumentRows()

  res.status(200).json({
    message: 'Missing document notifications fetched successfully.',
    notifications: rows,
    data: rows,
  })
}

export const getNotificationSummary = async (req, res) => {
  const [dueSoon, pastDue, missingDocuments] = await Promise.all([
    getPaymentDueSoonRows(),
    getPastDueRows(),
    getMissingDocumentRows(),
  ])

  res.status(200).json({
    message: 'Notification summary fetched successfully.',
    summary: {
      due_soon: dueSoon.length,
      past_due: pastDue.length,
      missing_documents: missingDocuments.length,
    },
    data: {
      due_soon: dueSoon.length,
      past_due: pastDue.length,
      missing_documents: missingDocuments.length,
    },
  })
}

export const getEmailLogs = async (req, res) => {
  const { clientUnitId } = req.params
  const logs = await getEmailLogsByClientUnit(clientUnitId)

  res.status(200).json({
    message: 'Email logs fetched successfully.',
    logs,
    data: logs,
  })
}

export const sendPaymentDueEmail = async (req, res) => {
  const { clientUnitId, scheduleId } = req.body

  if (isMissing(clientUnitId) || isMissing(scheduleId)) {
    return res.status(400).json({ message: 'Client unit and schedule are required.' })
  }

  const { context, error } = await buildContext(clientUnitId)
  if (error) return res.status(error.status).json({ message: error.message })

  const schedule = await getScheduleEmailContext(scheduleId)
  if (!schedule || Number(schedule.client_unit_id) !== Number(clientUnitId)) {
    return res.status(404).json({ message: 'Payment schedule not found for this client unit.' })
  }

  const email = buildPaymentDueEmail({
    clientName: context.client_name,
    projectName: context.project_name,
    unitId: context.unit_id,
    dueDate: schedule.due_date,
    amountDue: schedule.amount_due_display,
    daysUntilDue: schedule.days_until_due,
  })

  const result = await sendTrackedClientEmail({
    req,
    context,
    messageType: 'payment_due',
    ...email,
  })

  return res.status(result.status).json({ message: result.message })
}

export const sendPastDueEmail = async (req, res) => {
  const { clientUnitId, scheduleId } = req.body

  if (isMissing(clientUnitId) || isMissing(scheduleId)) {
    return res.status(400).json({ message: 'Client unit and schedule are required.' })
  }

  const { context, error } = await buildContext(clientUnitId)
  if (error) return res.status(error.status).json({ message: error.message })

  const schedule = await getScheduleEmailContext(scheduleId)
  if (!schedule || Number(schedule.client_unit_id) !== Number(clientUnitId)) {
    return res.status(404).json({ message: 'Payment schedule not found for this client unit.' })
  }

  const email = buildPastDueEmail({
    clientName: context.client_name,
    projectName: context.project_name,
    unitId: context.unit_id,
    dueDate: schedule.due_date,
    amountDue: schedule.amount_due_display,
    daysLate: schedule.days_late,
    penalty: schedule.penalty_display,
  })

  const result = await sendTrackedClientEmail({
    req,
    context,
    messageType: 'past_due',
    ...email,
  })

  return res.status(result.status).json({ message: result.message })
}

export const sendMissingDocumentsEmail = async (req, res) => {
  const { clientUnitId } = req.body

  if (isMissing(clientUnitId)) {
    return res.status(400).json({ message: 'Client unit is required.' })
  }

  const { context, error } = await buildContext(clientUnitId)
  if (error) return res.status(error.status).json({ message: error.message })

  const missingDocuments = await getMissingDocumentsForClientUnit(clientUnitId)
  if (missingDocuments.length === 0) {
    return res.status(400).json({ message: 'There are no missing required documents for this client unit.' })
  }

  const email = buildMissingDocumentsEmail({
    clientName: context.client_name,
    projectName: context.project_name,
    unitId: context.unit_id,
    missingDocuments,
  })

  const result = await sendTrackedClientEmail({
    req,
    context,
    messageType: 'missing_documents',
    ...email,
  })

  return res.status(result.status).json({ message: result.message })
}

export const sendCustomEmail = async (req, res) => {
  const { clientUnitId, subject, message, messageType = 'custom' } = req.body

  if (isMissing(clientUnitId)) {
    return res.status(400).json({ message: 'Client unit is required.' })
  }

  if (isMissing(subject)) {
    return res.status(400).json({ message: 'Subject is required.' })
  }

  if (isMissing(message)) {
    return res.status(400).json({ message: 'Message is required.' })
  }

  const { context, error } = await buildContext(clientUnitId)
  if (error) return res.status(error.status).json({ message: error.message })

  const safeMessageType = ['payment_due', 'missing_documents', 'past_due', 'custom'].includes(messageType)
    ? messageType
    : 'custom'

  const email = buildCustomEmail({
    clientName: context.client_name,
    projectName: context.project_name,
    unitId: context.unit_id,
    subject,
    message,
  })

  const result = await sendTrackedClientEmail({
    req,
    context,
    messageType: safeMessageType,
    ...email,
  })

  return res.status(result.status).json({ message: result.message })
}
