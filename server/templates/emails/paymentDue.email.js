import { buildHtmlEmail, buildPlainEmail } from './layout.email.js'

export const buildPaymentDueEmail = ({ clientName, projectName, unitId, dueDate, amountDue, daysUntilDue }) => {
  const details = [
    { label: 'Client', value: clientName },
    { label: 'Project', value: projectName },
    { label: 'Unit No.', value: unitId },
    { label: 'Due Date', value: dueDate },
    { label: 'Amount Due', value: amountDue },
  ]

  const lines = [
    `This is a reminder that your payment for Unit ${unitId} is due ${Number(daysUntilDue) === 0 ? 'today' : `in ${daysUntilDue} day(s)`}.`,
    'Please pay on or before the due date to avoid penalties.',
    'If you already paid, please disregard this message.',
  ]

  return {
    subject: `Payment Reminder - Unit ${unitId}`,
    text: buildPlainEmail({ greeting: `Dear ${clientName},`, lines, details }),
    html: buildHtmlEmail({
      title: `Payment Reminder - Unit ${unitId}`,
      greeting: `Dear ${clientName},`,
      paragraphs: lines,
      details,
    }),
  }
}
