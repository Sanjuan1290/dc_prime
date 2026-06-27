import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

const EMAIL_LOGO_CID = 'dc-prime-logo@dcprime'

let cachedTransporter = null

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createMailer = () => {
  if (cachedTransporter) return cachedTransporter

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP settings are missing in .env')
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return cachedTransporter
}

const getLogoPathCandidates = () => [
  process.env.EMAIL_LOGO_PATH,
  path.resolve(process.cwd(), 'public', 'logo2.png'),
  path.resolve(process.cwd(), 'public', 'logo.png'),
  path.resolve(process.cwd(), '../client/public/logo2.png'),
  path.resolve(process.cwd(), '../client/public/logo.png'),
  path.resolve(__dirname, '../../client/public/logo2.png'),
  path.resolve(__dirname, '../../client/public/logo.png'),
  path.resolve(__dirname, '../assets/logo2.png'),
  path.resolve(__dirname, '../assets/logo.png'),
].filter(Boolean)

const findExistingLogoPath = () => {
  for (const candidate of getLogoPathCandidates()) {
    if (candidate && fs.existsSync(candidate)) return candidate
  }

  return null
}

const getInlineLogoAttachment = (html = '') => {
  if (!String(html || '').includes(`cid:${EMAIL_LOGO_CID}`)) return null

  const logoPath = findExistingLogoPath()
  if (!logoPath) return null

  return {
    filename: path.basename(logoPath),
    path: logoPath,
    cid: EMAIL_LOGO_CID,
    contentDisposition: 'inline',
  }
}

export const sendSystemEmail = async ({ to, subject, text, html, attachments = [] }) => {
  const transporter = createMailer()
  const inlineLogoAttachment = getInlineLogoAttachment(html)
  const finalAttachments = [
    ...(inlineLogoAttachment ? [inlineLogoAttachment] : []),
    ...attachments,
  ]

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments: finalAttachments,
  })
}
