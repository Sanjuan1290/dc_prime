import { buildHtmlEmail, buildPlainEmail } from './layout.email.js'

export const buildPastDueEmail = ({ clientName, projectName, unitId, dueDate, amountDue, daysLate, penalty }) => {
  const details = [
    { label: 'Client', value: clientName },
    { label: 'Project', value: projectName },
    { label: 'Unit No.', value: unitId },
    { label: 'Due Date', value: dueDate },
    { label: 'Amount Due', value: amountDue },
    { label: 'Days Late', value: daysLate },
    { label: 'Penalty', value: penalty },
  ]

  const lines = [
    `Our records show that your payment for Unit ${unitId} is already past due.`,
    'Please settle the unpaid amount to avoid further penalties.',
    'If you already paid, please disregard this message and send your proof of payment to D&C Prime Realty.',
  ]

  return {
    subject: `Past Due Payment Notice - Unit ${unitId}`,
    text: buildPlainEmail({ greeting: `Dear ${clientName},`, lines, details }),
    html: buildHtmlEmail({
      title: `Past Due Payment Notice - Unit ${unitId}`,
      greeting: `Dear ${clientName},`,
      paragraphs: lines,
      details,
    }),
  }
}
