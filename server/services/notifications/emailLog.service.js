import { db } from '../../db/connect.js'

export const createEmailLog = async ({
  clientId = null,
  clientUnitId = null,
  sentTo,
  subject,
  messageType,
  messageBody,
  status = 'sent',
  errorMessage = null,
  sentBy = null,
}) => {
  const [result] = await db.query(
    `
    INSERT INTO email_logs (
      client_id,
      client_unit_id,
      sent_to,
      subject,
      message_type,
      message_body,
      status,
      error_message,
      sent_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      clientId,
      clientUnitId,
      sentTo,
      subject,
      messageType,
      messageBody,
      status,
      errorMessage,
      sentBy,
    ]
  )

  return result.insertId
}

export const getEmailLogsByClientUnit = async (clientUnitId) => {
  const [rows] = await db.query(
    `
    SELECT
      el.id,
      el.client_id,
      el.client_unit_id,
      el.sent_to,
      el.subject,
      el.message_type,
      el.message_body,
      el.status,
      el.error_message,
      el.sent_at,
      u.full_name AS sent_by_name
    FROM email_logs el
    LEFT JOIN users u ON u.id = el.sent_by
    WHERE el.client_unit_id = ?
    ORDER BY el.sent_at DESC, el.id DESC
    `,
    [clientUnitId]
  )

  return rows
}
