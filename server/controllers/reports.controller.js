import { db } from '../db/connect.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const formatDecimal = (value) => {
  if (value === null) {
    return 0
  }

  return Number(value || 0)
}

const booleanFilterValue = (value) => {
  if (value === 'true') {
    return 1
  }

  if (value === 'false') {
    return 0
  }

  return value
}

export const getSalesReport = async (req, res) => {
  const {
    date_from,
    date_to,
    project_id,
    status
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

  if (!isMissing(project_id)) {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status)) {
    conditions.push('cu.status = ?')
    params.push(status)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [rows] = await db.query(
    `
    SELECT
      cu.id AS client_unit_id,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      l.net_selling_price,
      cu.balance,
      cu.status,
      cu.created_at
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY cu.created_at DESC, cu.id DESC
    `,
    params
  )

  const sales = rows.map((sale) => ({
    ...sale,
    net_selling_price: formatDecimal(sale.net_selling_price),
    balance: formatDecimal(sale.balance)
  }))

  res.status(200).json({
    sales
  })
}

export const getCollectionsReport = async (req, res) => {
  const {
    date_from,
    date_to,
    project_id,
    payment_type,
    payment_method
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(date_from)) {
    conditions.push('py.payment_date >= ?')
    params.push(date_from)
  }

  if (!isMissing(date_to)) {
    conditions.push('py.payment_date <= ?')
    params.push(date_to)
  }

  if (!isMissing(project_id)) {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(payment_type)) {
    conditions.push('py.payment_type = ?')
    params.push(payment_type)
  }

  if (!isMissing(payment_method)) {
    conditions.push('py.payment_method = ?')
    params.push(payment_method)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [rows] = await db.query(
    `
    SELECT
      py.id AS payment_id,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      py.amount,
      py.payment_type,
      py.payment_method,
      py.payment_date
    FROM payments py
    INNER JOIN client_units cu ON cu.id = py.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY py.payment_date DESC, py.id DESC
    `,
    params
  )

  const collections = rows.map((collection) => ({
    ...collection,
    amount: formatDecimal(collection.amount)
  }))

  res.status(200).json({
    collections
  })
}

export const getInventoryReport = async (req, res) => {
  const {
    project_id,
    status,
    lot_type
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(project_id)) {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status)) {
    conditions.push('l.status = ?')
    params.push(status)
  }

  if (!isMissing(lot_type)) {
    conditions.push('l.lot_type = ?')
    params.push(lot_type)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

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
      l.legal_misc_fee,
      l.status
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY p.name ASC, l.unit_id ASC
    `,
    params
  )

  const inventory = rows.map((listing) => ({
    ...listing,
    lot_area_sqm: formatDecimal(listing.lot_area_sqm),
    price_per_sqm: formatDecimal(listing.price_per_sqm),
    net_selling_price: formatDecimal(listing.net_selling_price),
    legal_misc_fee: formatDecimal(listing.legal_misc_fee)
  }))

  res.status(200).json({
    inventory
  })
}

export const getCommissionsReport = async (req, res) => {
  const {
    date_from,
    date_to,
    seller_id,
    seller_role,
    status
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

  if (!isMissing(seller_id)) {
    conditions.push('seller.id = ?')
    params.push(seller_id)
  }

  if (!isMissing(seller_role)) {
    conditions.push('seller.seller_role = ?')
    params.push(seller_role)
  }

  if (!isMissing(status)) {
    conditions.push('cm.status = ?')
    params.push(status)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [rows] = await db.query(
    `
    SELECT
      cm.id AS commission_id,
      seller.full_name AS seller_name,
      seller.seller_role,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      l.net_selling_price,
      cm.rate,
      cm.amount,
      cm.released_amount,
      cm.amount - cm.released_amount AS remaining_amount,
      cm.status,
      cm.created_at
    FROM commissions cm
    INNER JOIN accredited_sellers seller ON seller.id = cm.seller_id
    INNER JOIN client_units cu ON cu.id = cm.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY cm.created_at DESC, cm.id DESC
    `,
    params
  )

  const commissions = rows.map((commission) => ({
    ...commission,
    net_selling_price: formatDecimal(commission.net_selling_price),
    rate: formatDecimal(commission.rate),
    amount: formatDecimal(commission.amount),
    released_amount: formatDecimal(commission.released_amount),
    remaining_amount: formatDecimal(commission.remaining_amount)
  }))

  res.status(200).json({
    commissions
  })
}

export const getDocumentsReport = async (req, res) => {
  const {
    client_id,
    client_unit_id,
    status,
    is_required
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(client_id)) {
    conditions.push('c.id = ?')
    params.push(client_id)
  }

  if (!isMissing(client_unit_id)) {
    conditions.push('cu.id = ?')
    params.push(client_unit_id)
  }

  if (!isMissing(status)) {
    conditions.push('cdl.status = ?')
    params.push(status)
  }

  if (!isMissing(is_required)) {
    conditions.push('d.is_required = ?')
    params.push(booleanFilterValue(is_required))
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [documents] = await db.query(
    `
    SELECT
      cdl.id AS checklist_id,
      c.full_name AS client_name,
      p.name AS project_name,
      l.unit_id,
      d.name AS document_name,
      d.is_required,
      d.can_reuse,
      cdl.status,
      reviewer.full_name AS reviewed_by_name,
      cdl.reviewed_at
    FROM client_document_list cdl
    INNER JOIN documents d ON d.id = cdl.document_id
    INNER JOIN client_units cu ON cu.id = cdl.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN users reviewer ON reviewer.id = cdl.reviewed_by
    ${whereClause}
    ORDER BY c.full_name ASC, p.name ASC, l.unit_id ASC, d.name ASC
    `,
    params
  )

  res.status(200).json({
    documents
  })
}

export const getClientsReport = async (req, res) => {
  const { search } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        c.full_name LIKE ?
        OR c.email LIKE ?
        OR c.contact_no LIKE ?
        OR c.address LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const [rows] = await db.query(
    `
    SELECT
      c.id AS client_id,
      c.full_name AS client_name,
      c.email,
      c.contact_no,
      c.address,
      COALESCE(client_summary.units_count, 0) AS units_count,
      COALESCE(client_summary.total_contract_value, 0) AS total_contract_value,
      COALESCE(client_summary.total_paid, 0) AS total_paid,
      COALESCE(client_summary.balance, 0) AS balance
    FROM clients c
    LEFT JOIN (
      SELECT
        cu.client_id,
        COUNT(cu.id) AS units_count,
        COALESCE(SUM(l.net_selling_price), 0) AS total_contract_value,
        COALESCE(SUM(payment_summary.total_paid), 0) AS total_paid,
        COALESCE(SUM(cu.balance), 0) AS balance
      FROM client_units cu
      INNER JOIN listings l ON l.id = cu.listing_id
      LEFT JOIN (
        SELECT
          client_unit_id,
          SUM(amount) AS total_paid
        FROM payments
        GROUP BY client_unit_id
      ) payment_summary ON payment_summary.client_unit_id = cu.id
      GROUP BY cu.client_id
    ) client_summary ON client_summary.client_id = c.id
    ${whereClause}
    ORDER BY c.full_name ASC
    `,
    params
  )

  const clients = rows.map((client) => ({
    ...client,
    units_count: Number(client.units_count || 0),
    total_contract_value: formatDecimal(client.total_contract_value),
    total_paid: formatDecimal(client.total_paid),
    balance: formatDecimal(client.balance)
  }))

  res.status(200).json({
    clients
  })
}
