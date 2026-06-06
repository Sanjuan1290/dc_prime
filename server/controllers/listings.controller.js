import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'

const nullableValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return value
}

const moneyValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0
  }

  return value
}

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const isDuplicateUnitError = (err) => {
  return err.code === 'ER_DUP_ENTRY' || err.errno === 1062
}

const projectExists = async (projectId) => {
  const [rows] = await db.query(
    `
    SELECT id
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [projectId]
  )

  return rows.length > 0
}

export const getListings = async (req, res) => {
  const {
    search,
    project_id,
    status,
    lot_type
  } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        l.unit_id LIKE ?
        OR l.cadastral_lot_no LIKE ?
        OR l.lot_type LIKE ?
        OR p.name LIKE ?
        OR l.status LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(project_id)) {
    conditions.push('l.project_id = ?')
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

  const [listings] = await db.query(
    `
    SELECT
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
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    ${whereClause}
    ORDER BY l.id DESC
    `,
    params
  )

  res.status(200).json({
    listings
  })
}

export const getListing = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
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
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    WHERE l.id = ?
    LIMIT 1
    `,
    [id]
  )

  const listing = rows[0]

  if (!listing) {
    return res.status(404).json({
      message: 'Listing not found'
    })
  }

  res.status(200).json({
    listing
  })
}

export const createListing = async (req, res) => {
  const {
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
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project ID is required'
    })
  }

  if (isMissing(unit_id)) {
    return res.status(400).json({
      message: 'Unit ID is required'
    })
  }

  if (!(await projectExists(project_id))) {
    return res.status(404).json({
      message: 'Project not found'
    })
  }

  try {
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
        moneyValue(promo_discount),
        moneyValue(downpayment),
        moneyValue(reservation_fee),
        moneyValue(price_per_sqm),
        moneyValue(lot_area_sqm),
        moneyValue(net_selling_price),
        moneyValue(legal_misc_fee),
        status || 'available'
      ]
    )

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Listings',
      description: `Created listing ${unit_id}`,
      ipAddress: req.ip
    })

    return res.status(201).json({
      message: 'Listing created successfully',
      listingId: result.insertId
    })
  } catch (err) {
    if (isDuplicateUnitError(err)) {
      return res.status(409).json({
        message: 'Unit ID already exists in this project'
      })
    }

    throw err
  }
}

export const updateListing = async (req, res) => {
  const { id } = req.params

  const {
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
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project ID is required'
    })
  }

  if (isMissing(unit_id)) {
    return res.status(400).json({
      message: 'Unit ID is required'
    })
  }

  if (!(await projectExists(project_id))) {
    return res.status(404).json({
      message: 'Project not found'
    })
  }

  try {
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
        moneyValue(promo_discount),
        moneyValue(downpayment),
        moneyValue(reservation_fee),
        moneyValue(price_per_sqm),
        moneyValue(lot_area_sqm),
        moneyValue(net_selling_price),
        moneyValue(legal_misc_fee),
        status || 'available',
        id
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Listing not found'
      })
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Listings',
      description: `Updated listing ${unit_id}`,
      ipAddress: req.ip
    })

    return res.status(200).json({
      message: 'Listing updated successfully'
    })
  } catch (err) {
    if (isDuplicateUnitError(err)) {
      return res.status(409).json({
        message: 'Unit ID already exists in this project'
      })
    }

    throw err
  }
}
