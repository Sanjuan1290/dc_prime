import cron from 'node-cron'
import { db } from '../db/connect.js'
import { sendSystemEmail } from '../lib/mailer.js'

export const runDocumentReminderJob = async () => {
  const [units] = await db.query(`
    SELECT
      cu.id,
      c.full_name AS client_name,
      c.email AS client_email,
      l.unit_id,
      GROUP_CONCAT(d.name ORDER BY d.id SEPARATOR ', ') AS missing_docs
    FROM client_units cu
    JOIN clients c ON c.id = cu.client_id
    JOIN listings l ON l.id = cu.listing_id
    JOIN client_document_list cdl ON cdl.client_unit_id = cu.id
    JOIN documents d ON d.id = cdl.document_id
    WHERE cu.status IN ('active','reserved')
      AND cu.starting_date IS NOT NULL
      AND DATEDIFF(CURDATE(), cu.starting_date) >= 30
      AND d.is_required = 1
      AND cdl.status = 'not_submitted'
      AND c.email IS NOT NULL
      AND c.email <> ''
      AND (cu.last_doc_reminder_at IS NULL OR DATE(cu.last_doc_reminder_at) < CURDATE())
    GROUP BY cu.id, c.full_name, c.email, l.unit_id
  `)

  for (const unit of units) {
    await sendSystemEmail({
      to: unit.client_email,
      subject: `Required Documents Needed — Unit ${unit.unit_id}`,
      text: `Dear ${unit.client_name},\n\nIt has been more than 30 days since your reservation of Unit ${unit.unit_id}. Please submit these required documents:\n\n${unit.missing_docs}\n\nD&C Prime Realty`,
    })

    await db.query(`UPDATE client_units SET last_doc_reminder_at = NOW() WHERE id = ?`, [unit.id])
  }

  return units.length
}

export const startDocumentReminderJob = () => {
  cron.schedule('30 8 * * *', async () => {
    try {
      const count = await runDocumentReminderJob()
      console.log(`[documentReminderJob] sent ${count} reminder(s)`)
    } catch (error) {
      console.error('[documentReminderJob]', error.message)
    }
  })
}
