import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const run = async () => {
  try {
    await transporter.verify()

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: 'D&C Prime Realty SMTP Test',
      text: 'SMTP is working from localhost.',
    })

    console.log('SMTP working.')
    console.log('Message ID:', info.messageId)
  } catch (error) {
    console.error('SMTP test failed:')
    console.error(error)
  }
}

run()