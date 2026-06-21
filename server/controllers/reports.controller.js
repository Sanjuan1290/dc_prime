import { db } from '../db/connect.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const formatDecimal = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const booleanFilterValue = (value) => {
  if (value === 'true') return 1
  if (value === 'false') return 0

  return value
}

const contractValueExpression = `
  COALESCE(
    NULLIF(cu.offer_purchase_price, 0),
    NULLIF(l.total_contract_price, 0),
    l.net_selling_price + l.legal_misc_fee,
    l.net_selling_price,
    0
  )
`

const listingContractValueExpression = `
  COALESCE(
    NULLIF(total_contract_price, 0),
    net_selling_price + legal_misc_fee,
    net_selling_price,
    0
  )
`

export const getSalesReport = async (req, res) => {
  const {
    date_from,
    date_to,
    project_id,
    status,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(date_from)) {
    conditions.push('DATE(cu.created_at) >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('DATE(cu.created_at) <= ?')
    params.push(date_to)
  }

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('cu.status = ?')
    params.push(status)
  } else {
    conditions.push(`cu.status <> 'cancelled'`)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      cu.id AS client_unit_id,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      l.net_selling_price,
      l.legal_misc_rate,
      l.legal_misc_fee,
      ${contractValueExpression} AS total_contract_price,
      COALESCE(payment_summary.total_paid, 0) AS total_paid,
      GREATEST(
        ${contractValueExpression} - COALESCE(payment_summary.total_paid, 0),
        0
      ) AS balance,
      cu.status,
      cu.created_at
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN (
      SELECT
        client_unit_id,
        SUM(amount) AS total_paid
      FROM payments
      WHERE status = 'verified'
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    ${whereClause}
    ORDER BY cu.created_at DESC, cu.id DESC
    `,
    params
  )

  res.status(200).json({
    sales: rows.map((row) => ({
      ...row,
      net_selling_price: formatDecimal(row.net_selling_price),
      legal_misc_rate: formatDecimal(row.legal_misc_rate),
      legal_misc_fee: formatDecimal(row.legal_misc_fee),
      total_contract_price: formatDecimal(row.total_contract_price),
      total_paid: formatDecimal(row.total_paid),
      balance: formatDecimal(row.balance),
    })),
  })
}

export const getCollectionsReport = async (req, res) => {
  const {
    date_from,
    date_to,
    project_id,
    payment_type,
    payment_method,
  } = req.query

  const conditions = ["py.status = 'verified'"]
  const params = []

  if (!isMissing(date_from)) {
    conditions.push('py.payment_date >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('py.payment_date <= ?')
    params.push(date_to)
  }

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(payment_type) && payment_type !== 'all') {
    conditions.push('py.payment_type = ?')
    params.push(payment_type)
  }

  if (!isMissing(payment_method) && payment_method !== 'all') {
    conditions.push('py.payment_method = ?')
    params.push(payment_method)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      py.id AS payment_id,
      py.client_unit_id,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      py.amount,
      py.payment_type,
      py.payment_method,
      py.payment_date,
      ${contractValueExpression} AS total_contract_price,
      GREATEST(
        ${contractValueExpression} - COALESCE(payment_summary.total_paid, 0),
        0
      ) AS balance
    FROM payments py
    INNER JOIN client_units cu ON cu.id = py.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN (
      SELECT
        client_unit_id,
        SUM(amount) AS total_paid
      FROM payments
      WHERE status = 'verified'
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    ${whereClause}
    ORDER BY py.payment_date DESC, py.id DESC
    `,
    params
  )

  res.status(200).json({
    collections: rows.map((row) => ({
      ...row,
      amount: formatDecimal(row.amount),
      total_contract_price: formatDecimal(row.total_contract_price),
      balance: formatDecimal(row.balance),
    })),
  })
}

export const getInventoryReport = async (req, res) => {
  const {
    project_id,
    status,
    lot_type,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('l.status = ?')
    params.push(status)
  }

  if (!isMissing(lot_type) && lot_type !== 'all') {
    conditions.push('l.lot_type = ?')
    params.push(lot_type)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      l.id AS listing_id,
      p.name AS project_name,
      l.cadastral_lot_no,
      l.unit_id,
      l.lot_type,
      l.lot_area_sqm,
      l.price_per_sqm,
      l.net_selling_price,
      l.legal_misc_rate,
      l.legal_misc_fee,
      ${listingContractValueExpression} AS total_contract_price,
      l.status,
      l.created_at
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY p.name ASC, l.unit_id ASC
    `,
    params
  )

  res.status(200).json({
    inventory: rows.map((row) => ({
      ...row,
      lot_area_sqm: formatDecimal(row.lot_area_sqm),
      price_per_sqm: formatDecimal(row.price_per_sqm),
      net_selling_price: formatDecimal(row.net_selling_price),
      legal_misc_rate: formatDecimal(row.legal_misc_rate),
      legal_misc_fee: formatDecimal(row.legal_misc_fee),
      total_contract_price: formatDecimal(row.total_contract_price),
    })),
  })
}

export const getCommissionsReport = async (req, res) => {
  const {
    date_from,
    date_to,
    project_id,
    status,
    seller_role,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(date_from)) {
    conditions.push('DATE(cm.created_at) >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('DATE(cm.created_at) <= ?')
    params.push(date_to)
  }

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('cm.status = ?')
    params.push(status)
  }

  if (!isMissing(seller_role) && seller_role !== 'all') {
    conditions.push('seller.seller_role = ?')
    params.push(seller_role)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      cm.id AS commission_id,
      seller.full_name AS seller_name,
      seller.seller_role,
      COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      l.net_selling_price,
      ${contractValueExpression} AS total_contract_price,
      cm.rate,
      cm.gross_commission,
      cm.released_amount,
      GREATEST(cm.gross_commission - cm.released_amount, 0) AS remaining_amount,
      cm.status,
      cm.created_at
    FROM commissions cm
    INNER JOIN client_units cu ON cu.id = cm.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN accredited_sellers seller ON seller.id = cm.seller_id
    LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
    ${whereClause}
    ORDER BY cm.created_at DESC, cm.id DESC
    `,
    params
  )

  res.status(200).json({
    commissions: rows.map((row) => ({
      ...row,
      net_selling_price: formatDecimal(row.net_selling_price),
      total_contract_price: formatDecimal(row.total_contract_price),
      rate: formatDecimal(row.rate),
      gross_commission: formatDecimal(row.gross_commission),
      released_amount: formatDecimal(row.released_amount),
      remaining_amount: formatDecimal(row.remaining_amount),
    })),
  })
}

export const getDocumentsReport = async (req, res) => {
  const {
    project_id,
    status,
    is_required,
    can_reuse,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('cdl.status = ?')
    params.push(status)
  }

  if (!isMissing(is_required) && is_required !== 'all') {
    conditions.push('COALESCE(cdl.is_required, d.is_required) = ?')
    params.push(booleanFilterValue(is_required))
  }

  if (!isMissing(can_reuse) && can_reuse !== 'all') {
    conditions.push('d.can_reuse = ?')
    params.push(booleanFilterValue(can_reuse))
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      cdl.id AS checklist_id,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      d.name AS document_name,
      COALESCE(cdl.is_required, d.is_required) AS is_required,
      d.can_reuse,
      cdl.status,
      reviewer.full_name AS reviewed_by_name,
      cdl.reviewed_at
    FROM client_document_list cdl
    INNER JOIN client_units cu ON cu.id = cdl.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    INNER JOIN documents d ON d.id = cdl.document_id
    LEFT JOIN users reviewer ON reviewer.id = cdl.reviewed_by
    ${whereClause}
    ORDER BY c.full_name ASC, l.unit_id ASC, d.name ASC
    `,
    params
  )

  res.status(200).json({
    documents: rows,
  })
}

export const getClientsReport = async (req, res) => {
  const {
    project_id,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      c.id AS client_id,
      c.full_name AS client_name,
      c.email,
      c.contact_no,
      c.address,
      c.region,
      COUNT(DISTINCT cu.id) AS units_count,
      COALESCE(SUM(${contractValueExpression}), 0) AS total_contract_value,
      COALESCE(SUM(payment_summary.total_paid), 0) AS total_paid,
      COALESCE(
        SUM(
          GREATEST(
            ${contractValueExpression} - COALESCE(payment_summary.total_paid, 0),
            0
          )
        ),
        0
      ) AS balance
    FROM clients c
    LEFT JOIN client_units cu ON cu.client_id = c.id
    LEFT JOIN listings l ON l.id = cu.listing_id
    LEFT JOIN projects p ON p.id = l.project_id
    LEFT JOIN (
      SELECT
        client_unit_id,
        SUM(amount) AS total_paid
      FROM payments
      WHERE status = 'verified'
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    ${whereClause}
    GROUP BY
      c.id,
      c.full_name,
      c.email,
      c.contact_no,
      c.address,
      c.region
    ORDER BY c.full_name ASC
    `,
    params
  )

  res.status(200).json({
    clients: rows.map((row) => ({
      ...row,
      units_count: Number(row.units_count || 0),
      total_contract_value: formatDecimal(row.total_contract_value),
      total_paid: formatDecimal(row.total_paid),
      balance: formatDecimal(row.balance),
    })),
  })
}

const safeReportQuery = async (query, params = []) => {
  try {
    const [rows] = await db.query(query, params)
    return rows
  } catch (error) {
    if (
      ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code)
    ) {
      return []
    }
    throw error
  }
}

export const getBuyerAccountsReport = async (_req, res) => {
  const [rows] = await db.query(
    `
    SELECT
      cu.status,
      COUNT(cu.id) AS account_count,
      COALESCE(SUM(${contractValueExpression}), 0) AS total_contract_price,
      COALESCE(SUM(payment_summary.total_paid), 0) AS total_paid,
      COALESCE(SUM(GREATEST(${contractValueExpression} - COALESCE(payment_summary.total_paid, 0), 0)), 0) AS outstanding_balance
    FROM client_units cu
    INNER JOIN listings l ON l.id = cu.listing_id
    LEFT JOIN (
      SELECT client_unit_id, SUM(amount) AS total_paid
      FROM payments
      WHERE status = 'verified'
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    GROUP BY cu.status
    ORDER BY cu.status ASC
    `
  )

  res.status(200).json({
    buyer_accounts: rows.map((row) => ({
      ...row,
      account_count: Number(row.account_count || 0),
      total_contract_price: formatDecimal(row.total_contract_price),
      total_paid: formatDecimal(row.total_paid),
      outstanding_balance: formatDecimal(row.outstanding_balance),
    })),
  })
}

export const getPastDueAccountsReport = async (_req, res) => {
  const rows = await safeReportQuery(
    `
    SELECT
      cu.id AS client_unit_id,
      client.full_name AS client_name,
      project.name AS project_name,
      listing.unit_id,
      ps.due_date,
      ps.total_due,
      ps.amount_paid,
      ps.balance,
      ps.running_balance,
      cu.status
    FROM payment_schedules ps
    INNER JOIN client_units cu ON cu.id = ps.client_unit_id
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    INNER JOIN projects project ON project.id = listing.project_id
    WHERE ps.status = 'past_due'
    ORDER BY ps.due_date ASC, cu.id DESC
    `
  )

  res.status(200).json({
    past_due_accounts: rows.map((row) => ({
      ...row,
      total_due: formatDecimal(row.total_due),
      amount_paid: formatDecimal(row.amount_paid),
      balance: formatDecimal(row.balance),
      running_balance: formatDecimal(row.running_balance),
    })),
  })
}

export const getSellerGroupsReport = async (_req, res) => {
  const rows = await safeReportQuery(
    `
    SELECT
      sg.id AS seller_group_id,
      sg.group_name,
      sg.group_type,
      sg.pool_rate,
      sg.status,
      COUNT(DISTINCT sgm.seller_id) AS active_member_count,
      COUNT(DISTINCT cu.id) AS account_count,
      COALESCE(SUM(cu.offer_purchase_price), 0) AS total_sales,
      COALESCE(SUM(cm.gross_commission), 0) AS gross_commission,
      COALESCE(SUM(cm.released_amount), 0) AS released_commission
    FROM seller_groups sg
    LEFT JOIN seller_group_members sgm
      ON sgm.seller_group_id = sg.id
      AND sgm.status = 'active'
    LEFT JOIN client_units cu ON cu.seller_group_id = sg.id
      AND cu.status <> 'cancelled'
    LEFT JOIN commissions cm ON cm.client_unit_id = cu.id
      AND cm.status <> 'cancelled'
    GROUP BY sg.id
    ORDER BY total_sales DESC, sg.group_name ASC
    `
  )

  res.status(200).json({
    seller_groups: rows.map((row) => ({
      ...row,
      pool_rate: formatDecimal(row.pool_rate),
      active_member_count: Number(row.active_member_count || 0),
      account_count: Number(row.account_count || 0),
      total_sales: formatDecimal(row.total_sales),
      gross_commission: formatDecimal(row.gross_commission),
      released_commission: formatDecimal(row.released_commission),
    })),
  })
}

export const getCashAdvancesReport = async (_req, res) => {
  const [rows] = await db.query(
    `
    SELECT
      ca.id AS cash_advance_id,
      seller.full_name AS seller_name,
      ca.amount,
      ca.remaining_balance,
      (ca.amount - ca.remaining_balance) AS deducted_amount,
      ca.status,
      ca.requested_at,
      ca.approved_at
    FROM cash_advances ca
    INNER JOIN accredited_sellers seller ON seller.id = ca.seller_id
    ORDER BY ca.id DESC
    `
  )

  res.status(200).json({
    cash_advances: rows.map((row) => ({
      ...row,
      amount: formatDecimal(row.amount),
      remaining_balance: formatDecimal(row.remaining_balance),
      deducted_amount: formatDecimal(row.deducted_amount),
    })),
  })
}

export const getVouchersReport = async (_req, res) => {
  const rows = await safeReportQuery(
    `
    SELECT
      v.id AS voucher_id,
      v.voucher_no,
      v.voucher_type,
      v.source_type,
      v.source_id,
      v.payee_type,
      v.payee_name,
      v.amount,
      v.status,
      v.created_at
    FROM vouchers v
    ORDER BY v.id DESC
    `
  )

  res.status(200).json({
    vouchers: rows.map((row) => ({
      ...row,
      amount: formatDecimal(row.amount),
    })),
  })
}

export const getCancellationsReport = async (_req, res) => {
  const rows = await safeReportQuery(
    `
    SELECT
      cu.id AS client_unit_id,
      client.full_name AS client_name,
      project.name AS project_name,
      listing.unit_id,
      cu.status,
      cu.cancellation_date,
      cu.cancellation_result,
      cu.total_paid_by_client,
      cu.refund_amount,
      cu.forfeited_amount,
      cu.settlement_date,
      cu.cleared_for_resale_at
    FROM client_units cu
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    INNER JOIN projects project ON project.id = listing.project_id
    WHERE cu.status IN ('pending_cancellation', 'cancelled')
       OR cu.cancellation_result IS NOT NULL
    ORDER BY COALESCE(cu.settlement_date, cu.cancellation_date, cu.created_at) DESC
    `
  )

  res.status(200).json({
    cancellations: rows.map((row) => ({
      ...row,
      total_paid_by_client: formatDecimal(row.total_paid_by_client),
      refund_amount: formatDecimal(row.refund_amount),
      forfeited_amount: formatDecimal(row.forfeited_amount),
    })),
  })
}

export const getProofIncomeRequestsReport = async (_req, res) => {
  const rows = await safeReportQuery(
    `
    SELECT
      pir.id AS proof_income_request_id,
      client.full_name AS client_name,
      listing.unit_id,
      pir.document_type,
      pir.status,
      requester.full_name AS requested_by_name,
      pir.requested_at,
      verifier.full_name AS verified_by_name,
      pir.verified_at
    FROM proof_income_requests pir
    INNER JOIN clients client ON client.id = pir.client_id
    LEFT JOIN client_units cu ON cu.id = pir.client_unit_id
    LEFT JOIN listings listing ON listing.id = cu.listing_id
    LEFT JOIN users requester ON requester.id = pir.requested_by
    LEFT JOIN users verifier ON verifier.id = pir.verified_by
    ORDER BY pir.id DESC
    `
  )

  res.status(200).json({
    proof_income_requests: rows,
  })
}
