import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const nullableValue = (value) => {
  if (value === undefined || value === null || value === '') return null
  return value
}

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const numberValue = (value) => {
  return Number(value || 0)
}

const computeListingAmounts = ({
  lot_area_sqm,
  price_per_sqm,
  promo_discount,
  legal_misc_fee,
}) => {
  const grossPrice = numberValue(lot_area_sqm) * numberValue(price_per_sqm)
  const netSellingPrice = Math.max(grossPrice - numberValue(promo_discount), 0)
  const legalMiscFee = netSellingPrice * (numberValue(legal_misc_fee) / 100)

  return {
    netSellingPrice,
    legalMiscFee,
  }
}

const listingFields = `
  l.id,
  l.project_id,
  p.name AS project_name,
  l.cadastral_lot_no,
  l.unit_id,
  l.lot_type,
  l.promo_discount,
  l.downpayment,
  l.reservation_fee,
  l.price_per_sqm,
  l.lot_area_sqm,
  l.net_selling_price,
  l.legal_misc_fee,
  l.status,
  l.created_at,
  l.updated_at
`

export const getListings = async (req, res) => {
  const {
    search,
    project_id,
    status,
    lot_type,
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        p.name LIKE ?
        OR l.cadastral_lot_no LIKE ?
        OR l.unit_id LIKE ?
        OR l.lot_type LIKE ?
        OR l.status LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('l.project_id = ?')
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

  const [listings] = await db.query(
    `
    SELECT
      ${listingFields}
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY l.id DESC
    `,
    params
  )

  res.status(200).json({
    listings,
  })
}

export const getListing = async (req, res) => {
  const { id } = req.params

  const [listings] = await db.query(
    `
    SELECT
      ${listingFields}
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    WHERE l.id = ?
    LIMIT 1
    `,
    [id]
  )

  const listing = listings[0]

  if (!listing) {
    return res.status(404).json({
      message: 'Listing not found',
    })
  }

  res.status(200).json({
    listing,
  })
}

export const createListing = async (req, res) => {
  const {
    project_id,
    cadastral_lot_no,
    unit_id,
    lot_type,
    promo_discount = 0,
    downpayment = 0,
    reservation_fee = 0,
    price_per_sqm = 0,
    lot_area_sqm = 0,
    legal_misc_fee = 0,
    status = 'available',
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project is required',
    })
  }

  if (isMissing(unit_id)) {
    return res.status(400).json({
      message: 'Unit ID is required',
    })
  }

  const [projects] = await db.query(
    `
    SELECT id
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [project_id]
  )

  if (projects.length === 0) {
    return res.status(404).json({
      message: 'Project not found',
    })
  }

  const { netSellingPrice, legalMiscFee } = computeListingAmounts({
    lot_area_sqm,
    price_per_sqm,
    promo_discount,
    legal_misc_fee,
  })

  const [result] = await db.query(
    `
    INSERT INTO listings (
      project_id,
      cadastral_lot_no,
      unit_id,
      lot_type,
      promo_discount,
      downpayment,
      reservation_fee,
      price_per_sqm,
      lot_area_sqm,
      net_selling_price,
      legal_misc_fee,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      project_id,
      nullableValue(cadastral_lot_no),
      unit_id,
      nullableValue(lot_type),
      numberValue(promo_discount),
      numberValue(downpayment),
      numberValue(reservation_fee),
      numberValue(price_per_sqm),
      numberValue(lot_area_sqm),
      netSellingPrice,
      legalMiscFee,
      status,
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Listings',
    description: `Created listing ${unit_id}`,
    ipAddress: req.ip,
  })

  res.status(201).json({
    message: 'Listing created successfully',
    listingId: result.insertId,
  })
}

export const updateListing = async (req, res) => {
  const { id } = req.params

  const {
    project_id,
    cadastral_lot_no,
    unit_id,
    lot_type,
    promo_discount = 0,
    downpayment = 0,
    reservation_fee = 0,
    price_per_sqm = 0,
    lot_area_sqm = 0,
    legal_misc_fee = 0,
    status = 'available',
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project is required',
    })
  }

  if (isMissing(unit_id)) {
    return res.status(400).json({
      message: 'Unit ID is required',
    })
  }

  const { netSellingPrice, legalMiscFee } = computeListingAmounts({
    lot_area_sqm,
    price_per_sqm,
    promo_discount,
    legal_misc_fee,
  })

  const [result] = await db.query(
    `
    UPDATE listings
    SET
      project_id = ?,
      cadastral_lot_no = ?,
      unit_id = ?,
      lot_type = ?,
      promo_discount = ?,
      downpayment = ?,
      reservation_fee = ?,
      price_per_sqm = ?,
      lot_area_sqm = ?,
      net_selling_price = ?,
      legal_misc_fee = ?,
      status = ?
    WHERE id = ?
    `,
    [
      project_id,
      nullableValue(cadastral_lot_no),
      unit_id,
      nullableValue(lot_type),
      numberValue(promo_discount),
      numberValue(downpayment),
      numberValue(reservation_fee),
      numberValue(price_per_sqm),
      numberValue(lot_area_sqm),
      netSellingPrice,
      legalMiscFee,
      status,
      id,
    ]
  )

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: 'Listing not found',
    })
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Listings',
    description: `Updated listing ${unit_id}`,
    ipAddress: req.ip,
  })

  res.status(200).json({
    message: 'Listing updated successfully',
  })
}