import { buildHtmlEmail, buildPlainEmail } from './layout.email.js'

export const buildCustomEmail = ({ clientName, projectName, unitId, subject, message }) => {
  const details = [
    { label: 'Client', value: clientName },
    { label: 'Project', value: projectName },
    { label: 'Unit No.', value: unitId },
  ]

  const lines = String(message || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    subject,
    text: buildPlainEmail({ greeting: `Dear ${clientName},`, lines, details }),
    html: buildHtmlEmail({
      title: subject,
      greeting: `Dear ${clientName},`,
      paragraphs: lines.length ? lines : [message],
      details,
    }),
  }
}
