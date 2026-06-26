import { db } from '../../db/connect.js'

const moneySql = (expression) => `FORMAT(COALESCE(${expression}, 0), 2)`

export const getPaymentDueSoonRows = async () => {
  const [rows] = await db.query(`
    SELECT
      c.id AS client_id,
      cu.id AS client_unit_id,
      c.full_name AS client_name,
      c.email AS client_email,
      l.unit_id,
      p.name AS project_name,
      ps.id AS schedule_id,
      ps.description,
      DATE_FORMAT(ps.due_date, '%Y-%m-%d') AS due_date,
      ps.balance AS amount_due,
      CONCAT('PHP ', ${moneySql('ps.balance')}) AS amount_due_display,
      DATEDIFF(ps.due_date, CURDATE()) AS days_until_due,
      latest_email.last_email_sent_at
    FROM payment_schedules ps
    INNER JOIN client_units cu ON cu.id = ps.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN (
      SELECT client_unit_id, MAX(sent_at) AS last_email_sent_at
      FROM email_logs
      WHERE message_type = 'payment_due'
        AND status = 'sent'
      GROUP BY client_unit_id
    ) latest_email ON latest_email.client_unit_id = cu.id
    WHERE cu.status IN ('active', 'reserved')
      AND ps.balance > 0
      AND ps.due_date >= CURDATE()
      AND ps.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ORDER BY ps.due_date ASC, c.full_name ASC
  `)

  return rows
}

export const getPastDueRows = async () => {
  const [rows] = await db.query(`
    SELECT
      c.id AS client_id,
      cu.id AS client_unit_id,
      c.full_name AS client_name,
      c.email AS client_email,
      l.unit_id,
      p.name AS project_name,
      ps.id AS schedule_id,
      ps.description,
      DATE_FORMAT(ps.due_date, '%Y-%m-%d') AS due_date,
      ps.balance AS amount_due,
      ps.penalty_due AS penalty,
      CONCAT('PHP ', ${moneySql('ps.balance')}) AS amount_due_display,
      CONCAT('PHP ', ${moneySql('ps.penalty_due')}) AS penalty_display,
      ABS(DATEDIFF(ps.due_date, CURDATE())) AS days_late,
      latest_email.last_email_sent_at
    FROM payment_schedules ps
    INNER JOIN client_units cu ON cu.id = ps.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN (
      SELECT client_unit_id, MAX(sent_at) AS last_email_sent_at
      FROM email_logs
      WHERE message_type = 'past_due'
        AND status = 'sent'
      GROUP BY client_unit_id
    ) latest_email ON latest_email.client_unit_id = cu.id
    WHERE cu.status IN ('active', 'reserved')
      AND ps.balance > 0
      AND ps.due_date < CURDATE()
    ORDER BY ps.due_date ASC, c.full_name ASC
  `)

  return rows
}

export const getMissingDocumentRows = async () => {
  const [rows] = await db.query(`
    SELECT
      c.id AS client_id,
      cu.id AS client_unit_id,
      c.full_name AS client_name,
      c.email AS client_email,
      l.unit_id,
      p.name AS project_name,
      DATE_FORMAT(cu.starting_date, '%Y-%m-%d') AS reserved_date,
      DATEDIFF(CURDATE(), cu.starting_date) AS days_since_reserved,
      GROUP_CONCAT(d.name ORDER BY d.name SEPARATOR '|||') AS missing_docs_raw,
      COUNT(d.id) AS missing_count,
      latest_email.last_email_sent_at
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    INNER JOIN client_document_list cdl ON cdl.client_unit_id = cu.id
    INNER JOIN documents d ON d.id = cdl.document_id
    LEFT JOIN (
      SELECT client_unit_id, MAX(sent_at) AS last_email_sent_at
      FROM email_logs
      WHERE message_type = 'missing_documents'
        AND status = 'sent'
      GROUP BY client_unit_id
    ) latest_email ON latest_email.client_unit_id = cu.id
    WHERE cu.status IN ('active', 'reserved')
      AND cu.starting_date IS NOT NULL
      AND DATEDIFF(CURDATE(), cu.starting_date) >= 30
      AND COALESCE(cdl.is_required, d.is_required) = 1
      AND cdl.status IN ('not_submitted', 'rejected')
    GROUP BY c.id, cu.id, c.full_name, c.email, l.unit_id, p.name, cu.starting_date, latest_email.last_email_sent_at
    ORDER BY days_since_reserved DESC, c.full_name ASC
  `)

  return rows.map((row) => ({
    ...row,
    missing_documents: String(row.missing_docs_raw || '')
      .split('|||')
      .map((item) => item.trim())
      .filter(Boolean),
  }))
}

export const getClientUnitEmailContext = async (clientUnitId) => {
  const [rows] = await db.query(
    `
    SELECT
      c.id AS client_id,
      cu.id AS client_unit_id,
      c.full_name AS client_name,
      c.email AS client_email,
      l.unit_id,
      p.name AS project_name
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId]
  )

  return rows[0] || null
}

export const getScheduleEmailContext = async (scheduleId) => {
  const [rows] = await db.query(
    `
    SELECT
      ps.id AS schedule_id,
      ps.client_unit_id,
      ps.description,
      DATE_FORMAT(ps.due_date, '%Y-%m-%d') AS due_date,
      ps.balance AS amount_due,
      ps.penalty_due AS penalty,
      CONCAT('PHP ', ${moneySql('ps.balance')}) AS amount_due_display,
      CONCAT('PHP ', ${moneySql('ps.penalty_due')}) AS penalty_display,
      DATEDIFF(ps.due_date, CURDATE()) AS days_until_due,
      ABS(DATEDIFF(ps.due_date, CURDATE())) AS days_late
    FROM payment_schedules ps
    WHERE ps.id = ?
    LIMIT 1
    `,
    [scheduleId]
  )

  return rows[0] || null
}

export const getMissingDocumentsForClientUnit = async (clientUnitId) => {
  const [rows] = await db.query(
    `
    SELECT d.name
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    WHERE cdl.client_unit_id = ?
      AND COALESCE(cdl.is_required, d.is_required) = 1
      AND cdl.status IN ('not_submitted', 'rejected')
    ORDER BY d.name ASC
    `,
    [clientUnitId]
  )

  return rows.map((row) => row.name).filter(Boolean)
}
