import { db } from '../db/connect.js'
import {
  addDateRangeConditions,
  buildPagination,
  getDateRangeFromQuery,
  getPaginationOptions,
  getSortOptions,
} from '../utils/queryOptions.js'

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

const getReportPagination = (req) => getPaginationOptions(req.query)

const getReportDateRange = (req) =>
  getDateRangeFromQuery(req.query, { defaultToCurrentMonth: true })

const sendReportResponse = ({
  res,
  key,
  rows,
  page,
  limit,
  totalRows,
}) => {
  const pagination = buildPagination({ page, limit, totalRows })

  res.status(200).json({
    [key]: rows,
    data: rows,
    pagination,
  })
}

// TODO(report-jobs): heavy exports can later move to a report_jobs table with
// background Excel/PDF generation and downloadable files when ready.

export const getSalesReport = async (req, res) => {
  const {
    project_id,
    status,
    search,
  } = req.query
  const { page, limit, offset } = getReportPagination(req)
  const { dateFrom, dateTo } = getReportDateRange(req)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      created_at: 'cu.created_at',
      client_name: 'c.full_name',
      project_name: 'p.name',
      unit_id: 'l.unit_id',
      status: 'cu.status',
      total_contract_price: 'total_contract_price',
    },
    { defaultSortBy: 'created_at', defaultSortDir: 'DESC' }
  )

  const conditions = []
  const params = []

  addDateRangeConditions({
    conditions,
    params,
    column: 'cu.created_at',
    dateFrom,
    dateTo,
  })

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('cu.status = ?')
    params.push(status)
  }

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`
    conditions.push('(c.full_name LIKE ? OR p.name LIKE ? OR l.unit_id LIKE ? OR cu.status LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    `,
    params
  )

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
        SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END) AS total_paid
      FROM payments
      WHERE status = 'verified'
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}, cu.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  sendReportResponse({
    res,
    key: 'sales',
    page,
    limit,
    totalRows: countRow.totalRows,
    rows: rows.map((row) => ({
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
    project_id,
    payment_type,
    payment_method,
    search,
  } = req.query
  const { page, limit, offset } = getReportPagination(req)
  const { dateFrom, dateTo } = getReportDateRange(req)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      payment_date: 'py.payment_date',
      amount: 'py.amount',
      client_name: 'c.full_name',
      project_name: 'p.name',
      unit_id: 'l.unit_id',
      payment_type: 'py.payment_type',
      payment_method: 'py.payment_method',
    },
    { defaultSortBy: 'payment_date', defaultSortDir: 'DESC' }
  )

  const conditions = ["py.status = 'verified'"]
  const params = []

  addDateRangeConditions({
    conditions,
    params,
    column: 'py.payment_date',
    dateFrom,
    dateTo,
  })

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

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`
    conditions.push('(c.full_name LIKE ? OR p.name LIKE ? OR l.unit_id LIKE ? OR py.payment_type LIKE ? OR py.payment_method LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    FROM payments py
    INNER JOIN client_units cu ON cu.id = py.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    `,
    params
  )

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
        SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END) AS total_paid
      FROM payments
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}, py.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  sendReportResponse({
    res,
    key: 'collections',
    page,
    limit,
    totalRows: countRow.totalRows,
    rows: rows.map((row) => ({
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
    search,
  } = req.query
  const { page, limit, offset } = getReportPagination(req)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      project_name: 'p.name',
      unit_id: 'l.unit_id',
      status: 'l.status',
      created_at: 'l.created_at',
      total_contract_price: 'total_contract_price',
    },
    { defaultSortBy: 'project_name', defaultSortDir: 'ASC' }
  )

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

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`
    conditions.push('(p.name LIKE ? OR l.unit_id LIKE ? OR l.cadastral_lot_no LIKE ? OR l.lot_type LIKE ? OR l.status LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    `,
    params
  )

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
      ${contractValueExpression} AS total_contract_price,
      l.status,
      l.created_at
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}, l.unit_id ASC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  sendReportResponse({
    res,
    key: 'inventory',
    page,
    limit,
    totalRows: countRow.totalRows,
    rows: rows.map((row) => ({
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
    project_id,
    status,
    seller_role,
    search,
  } = req.query
  const { page, limit, offset } = getReportPagination(req)
  const { dateFrom, dateTo } = getReportDateRange(req)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      created_at: 'cm.created_at',
      seller_name: 'seller.full_name',
      client_name: 'c.full_name',
      project_name: 'p.name',
      unit_id: 'l.unit_id',
      gross_commission: 'cm.gross_commission',
      status: 'cm.status',
    },
    { defaultSortBy: 'created_at', defaultSortDir: 'DESC' }
  )

  const conditions = []
  const params = []

  addDateRangeConditions({
    conditions,
    params,
    column: 'cm.created_at',
    dateFrom,
    dateTo,
  })

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

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`
    conditions.push('(seller.full_name LIKE ? OR c.full_name LIKE ? OR p.name LIKE ? OR l.unit_id LIKE ? OR cm.status LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    FROM commissions cm
    INNER JOIN client_units cu ON cu.id = cm.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN accredited_sellers seller ON seller.id = cm.seller_id
    ${whereClause}
    `,
    params
  )

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
    ORDER BY ${sortColumn} ${sortDir}, cm.id DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  sendReportResponse({
    res,
    key: 'commissions',
    page,
    limit,
    totalRows: countRow.totalRows,
    rows: rows.map((row) => ({
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
    date_from,
    date_to,
    project_id,
    status,
    is_required,
    can_reuse,
    search,
  } = req.query
  const { page, limit, offset } = getReportPagination(req)
  const fallbackRange = getReportDateRange(req)
  const dateFrom = date_from ? fallbackRange.dateFrom : null
  const dateTo = date_to ? fallbackRange.dateTo : null
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      client_name: 'c.full_name',
      project_name: 'p.name',
      unit_id: 'l.unit_id',
      document_name: 'd.name',
      status: 'cdl.status',
      updated_at: 'cdl.updated_at',
      reviewed_at: 'cdl.reviewed_at',
    },
    { defaultSortBy: 'client_name', defaultSortDir: 'ASC' }
  )

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

  addDateRangeConditions({
    conditions,
    params,
    column: 'COALESCE(cdl.reviewed_at, cdl.updated_at)',
    dateFrom,
    dateTo,
  })

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`
    conditions.push('(c.full_name LIKE ? OR p.name LIKE ? OR l.unit_id LIKE ? OR d.name LIKE ? OR cdl.status LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    FROM client_document_list cdl
    INNER JOIN client_units cu ON cu.id = cdl.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    INNER JOIN documents d ON d.id = cdl.document_id
    ${whereClause}
    `,
    params
  )

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
    ORDER BY ${sortColumn} ${sortDir}, l.unit_id ASC, d.name ASC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  sendReportResponse({
    res,
    key: 'documents',
    rows,
    page,
    limit,
    totalRows: countRow.totalRows,
  })
}

export const getClientsReport = async (req, res) => {
  const {
    project_id,
    search,
  } = req.query
  const { page, limit, offset } = getReportPagination(req)
  const { sortColumn, sortDir } = getSortOptions(
    req.query,
    {
      client_name: 'c.full_name',
      region: 'c.region',
      units_count: 'units_count',
      total_contract_value: 'total_contract_value',
    },
    { defaultSortBy: 'client_name', defaultSortDir: 'ASC' }
  )

  const conditions = []
  const params = []

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('p.id = ?')
    params.push(project_id)
  }

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`
    conditions.push('(c.full_name LIKE ? OR c.email LIKE ? OR c.contact_no LIKE ? OR c.region LIKE ?)')
    params.push(searchTerm, searchTerm, searchTerm, searchTerm)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [[countRow]] = await db.query(
    `
    SELECT COUNT(*) AS totalRows
    FROM (
      SELECT c.id
      FROM clients c
      LEFT JOIN client_units cu ON cu.client_id = c.id
      LEFT JOIN listings l ON l.id = cu.listing_id
      LEFT JOIN projects p ON p.id = l.project_id
      ${whereClause}
      GROUP BY c.id
    ) counted_clients
    `,
    params
  )

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
        SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END) AS total_paid
      FROM payments
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
    ORDER BY ${sortColumn} ${sortDir}, c.id ASC
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  )

  sendReportResponse({
    res,
    key: 'clients',
    page,
    limit,
    totalRows: countRow.totalRows,
    rows: rows.map((row) => ({
      ...row,
      units_count: Number(row.units_count || 0),
      total_contract_value: formatDecimal(row.total_contract_value),
      total_paid: formatDecimal(row.total_paid),
      balance: formatDecimal(row.balance),
    })),
  })
}
