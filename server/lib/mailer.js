import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import { EMAIL_LOGO_CID } from '../templates/emails/layout.email.js'

let cachedTransporter = null
let cachedLogoAttachment = undefined

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const createMailer = () => {
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

const normalizeEnvValue = (value = '') => String(value || '').trim().replace(/^['"]|['"]$/g, '')

const isPublicHttpsUrl = (value = '') => /^https:\/\//i.test(normalizeEnvValue(value))

const getLogoPathCandidates = () => [
  normalizeEnvValue(process.env.EMAIL_LOGO_PATH),
  path.resolve(process.cwd(), '../client/public/logo2.png'),
  path.resolve(process.cwd(), '../client/public/logo.png'),
  path.resolve(process.cwd(), 'client/public/logo2.png'),
  path.resolve(process.cwd(), 'client/public/logo.png'),
  path.resolve(__dirname, '../../client/public/logo2.png'),
  path.resolve(__dirname, '../../client/public/logo.png'),
].filter(Boolean)

const getLocalLogoAttachment = () => {
  for (const candidate of getLogoPathCandidates()) {
    if (candidate && fs.existsSync(candidate)) {
      return {
        filename: path.basename(candidate),
        path: candidate,
        cid: EMAIL_LOGO_CID,
        contentDisposition: 'inline',
      }
    }
  }

  return null
}

const contentTypeFromUrl = (url = '') => {
  const cleanUrl = String(url).split('?')[0].toLowerCase()
  if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'image/jpeg'
  if (cleanUrl.endsWith('.png')) return 'image/png'
  if (cleanUrl.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

const fetchRemoteLogoAttachment = async () => {
  const logoUrl = normalizeEnvValue(process.env.EMAIL_LOGO_URL)
  if (!isPublicHttpsUrl(logoUrl)) return null

  const response = await fetch(logoUrl)
  if (!response.ok) {
    throw new Error(`Could not fetch EMAIL_LOGO_URL (${response.status})`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || contentTypeFromUrl(logoUrl)
  const extension = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'

  return {
    filename: `dc-prime-logo.${extension}`,
    content: Buffer.from(arrayBuffer),
    contentType,
    cid: EMAIL_LOGO_CID,
    contentDisposition: 'inline',
  }
}

const getInlineLogoAttachment = async (html = '') => {
  if (!String(html || '').includes(`cid:${EMAIL_LOGO_CID}`)) return null

  if (cachedLogoAttachment !== undefined) return cachedLogoAttachment

  cachedLogoAttachment = getLocalLogoAttachment()
  if (cachedLogoAttachment) return cachedLogoAttachment

  try {
    cachedLogoAttachment = await fetchRemoteLogoAttachment()
  } catch (error) {
    console.warn('[mailer] Email logo attachment failed:', error.message)
    cachedLogoAttachment = null
  }

  return cachedLogoAttachment
}

export const sendSystemEmail = async ({ to, subject, text, html, attachments = [] }) => {
  const transporter = createMailer()
  const inlineLogoAttachment = await getInlineLogoAttachment(html)
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
