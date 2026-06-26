import { buildHtmlEmail, buildPlainEmail } from './layout.email.js'

export const buildMissingDocumentsEmail = ({ clientName, projectName, unitId, missingDocuments = [] }) => {
  const details = [
    { label: 'Client', value: clientName },
    { label: 'Project', value: projectName },
    { label: 'Unit No.', value: unitId },
  ]

  const lines = [
    `Our records show that these required documents for Unit ${unitId} are still missing:`,
    '',
    ...missingDocuments.map((document, index) => `${index + 1}. ${document}`),
    '',
    'Please submit these documents so we can continue processing your account.',
  ]

  return {
    subject: `Missing Document Requirements - Unit ${unitId}`,
    text: buildPlainEmail({ greeting: `Dear ${clientName},`, lines, details }),
    html: buildHtmlEmail({
      title: `Missing Document Requirements - Unit ${unitId}`,
      greeting: `Dear ${clientName},`,
      paragraphs: [
        `Our records show that some required documents for Unit ${unitId} are still missing.`,
        'Please submit these documents so we can continue processing your account.',
      ],
      listTitle: 'Missing documents',
      listItems: missingDocuments,
      details,
    }),
  }
}
