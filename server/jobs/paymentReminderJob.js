import cron from 'node-cron'
import { db } from '../db/connect.js'
import { sendSystemEmail } from '../lib/mailer.js'

export const runPaymentReminderJob = async () => {
  const [units] = await db.query(`
    SELECT
      cu.id,
      cu.due_day,
      c.full_name AS client_name,
      c.email AS client_email,
      l.unit_id,
      p.name AS project_name,
      DATEDIFF(
        CASE
          WHEN DAY(CURDATE()) <= LEAST(cu.due_day, DAY(LAST_DAY(CURDATE()))) THEN
            STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-', LPAD(LEAST(cu.due_day, DAY(LAST_DAY(CURDATE()))), 2, '0')), '%Y-%m-%d')
          ELSE
            STR_TO_DATE(CONCAT(YEAR(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), '-', LPAD(MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 2, '0'), '-', LPAD(LEAST(cu.due_day, DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)))), 2, '0')), '%Y-%m-%d')
        END,
        CURDATE()
      ) AS days_until_due
    FROM client_units cu
    JOIN clients c ON c.id = cu.client_id
    JOIN listings l ON l.id = cu.listing_id
    JOIN projects p ON p.id = l.project_id
    WHERE cu.status IN ('active','reserved')
      AND cu.due_day IS NOT NULL
      AND c.email IS NOT NULL
      AND c.email <> ''
      AND (cu.last_payment_reminder_at IS NULL OR DATE(cu.last_payment_reminder_at) < CURDATE())
    HAVING days_until_due = 7
  `)

  const counts = {
    sent: 0,
    failed: 0,
    skipped: 0,
  }

  for (const unit of units) {
    if (!unit.client_email) {
      counts.skipped += 1
      continue
    }

    try {
      await sendSystemEmail({
        to: unit.client_email,
        subject: `Payment Reminder - Unit ${unit.unit_id}`,
        text: `Dear ${unit.client_name},\n\nThis is a reminder that your monthly payment for Unit ${unit.unit_id} (${unit.project_name}) is due in 7 days.\n\nIf you already paid, please disregard this email.\n\nD&C Prime Realty`,
      })

      await db.query(
        `UPDATE client_units SET last_payment_reminder_at = NOW() WHERE id = ?`,
        [unit.id]
      )
      counts.sent += 1
    } catch (error) {
      counts.failed += 1
      console.error('[paymentReminderJob] email failed:', {
        clientUnitId: unit.id,
        unitId: unit.unit_id,
        error: error.message,
      })
    }
  }

  return counts
}

export const startPaymentReminderJob = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      const counts = await runPaymentReminderJob()
      console.log(
        `[paymentReminderJob] sent ${counts.sent}, failed ${counts.failed}, skipped ${counts.skipped}`
      )
    } catch (error) {
      console.error('[paymentReminderJob]', error.message)
    }
  })
}
