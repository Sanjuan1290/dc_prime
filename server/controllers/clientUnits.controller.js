import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import {
  createAutoCommissionForClientUnit,
  refreshCommissionEligibility,
} from './commissions.controller.js'

const allowedClientUnitStatuses = [
  'reserved',
  'active',
  'cancelled',
  'fully_paid',
  'closed',
]

const allowedSaleTypes = ['distributed', 'direct']
const allowedModeOfPayments = ['cash', 'installment']

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const normalizeMoney = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const validateDueDay = (dueDay) => {
  if (isMissing(dueDay)) {
    return {
      isValid: true,
      value: null,
    }
  }

  const parsedDueDay = Number(dueDay)

  return {
    isValid: Number.isInteger(parsedDueDay) && parsedDueDay >= 1 && parsedDueDay <= 31,
    value: parsedDueDay,
  }
}

const listingStatusFromClientUnitStatus = (status) => {
  if (status === 'cancelled') return 'available'
  if (status === 'reserved') return 'reserved'
  if (status === 'active') return 'active'
  if (status === 'fully_paid' || status === 'closed') return 'sold'

  return null
}

const validateClientUnitStatus = (status) => {
  return allowedClientUnitStatuses.includes(status)
}

const validateSaleType = (saleType) => {
  if (isMissing(saleType)) return 'distributed'
  if (!allowedSaleTypes.includes(saleType)) return 'distributed'
  return saleType
}

const validateModeOfPayment = (modeOfPayment) => {
  if (isMissing(modeOfPayment)) return 'installment'
  if (!allowedModeOfPayments.includes(modeOfPayment)) return 'installment'
  return modeOfPayment
}

const clientUnitFields = `
  cu.id,
  cu.client_id,
  c.full_name AS client_name,
  cu.listing_id,
  l.unit_id,
  p.name AS project_name,
  l.lot_type,
  l.lot_area_sqm,
  l.price_per_sqm,
  l.net_selling_price,
  l.legal_misc_rate,
  l.legal_misc_fee,
  l.total_contract_price,
  COALESCE(payment_summary.paid_amount, 0) AS paid_amount,
  GREATEST(
    COALESCE(l.total_contract_price, 0) - COALESCE(payment_summary.paid_amount, 0),
    0
  ) AS balance,
  CASE
    WHEN COALESCE(l.total_contract_price, 0) > 0
    THEN ROUND((COALESCE(payment_summary.paid_amount, 0) / l.total_contract_price) * 100, 2)
    ELSE 0
  END AS payment_percentage,
  cu.mode_of_payment,
  cu.due_day,
  cu.status,
  cu.assigned_user_id,
  u.full_name AS assigned_user_name,
  cu.seller_id,
  seller.full_name AS seller_name,
  seller.seller_role AS seller_role,
  seller.commission_rate AS seller_commission_rate,
  COALESCE(parent_seller.full_name, seller.custom_reports_under, 'None') AS reports_under,
  CASE
    WHEN COALESCE(document_summary.required_count, 0) > 0
      AND COALESCE(document_summary.submitted_count, 0) = document_summary.required_count
    THEN 'complete'
    ELSE 'incomplete'
  END AS document_status,
  COALESCE(commission_summary.commission_count, 0) AS commission_count,
  COALESCE(commission_summary.gross_commission_total, 0) AS gross_commission_total,
  COALESCE(commission_summary.released_commission_total, 0) AS released_commission_total,
  cu.created_at,
  cu.updated_at
`

const clientUnitJoins = `
  FROM client_units cu
  INNER JOIN clients c ON c.id = cu.client_id
  INNER JOIN listings l ON l.id = cu.listing_id
  INNER JOIN projects p ON p.id = l.project_id
  LEFT JOIN users u ON u.id = cu.assigned_user_id
  LEFT JOIN accredited_sellers seller ON seller.id = cu.seller_id
  LEFT JOIN accredited_sellers parent_seller ON parent_seller.id = seller.parent_seller_id
  LEFT JOIN (
    SELECT
      client_unit_id,
      SUM(amount) AS paid_amount
    FROM payments
    WHERE status = 'verified'
    GROUP BY client_unit_id
  ) payment_summary ON payment_summary.client_unit_id = cu.id
  LEFT JOIN (
    SELECT
      cu_docs.id AS client_unit_id,
      COUNT(d.id) AS required_count,
      SUM(
        CASE
          WHEN cdl.status IN ('submitted', 'approved') THEN 1
          ELSE 0
        END
      ) AS submitted_count
    FROM client_units cu_docs
    LEFT JOIN documents d
      ON d.is_required = TRUE
      AND d.status = 'active'
    LEFT JOIN client_document_list cdl
      ON cdl.client_unit_id = cu_docs.id
      AND cdl.document_id = d.id
    GROUP BY cu_docs.id
  ) document_summary ON document_summary.client_unit_id = cu.id
  LEFT JOIN (
    SELECT
      cm.client_unit_id,
      COUNT(cm.id) AS commission_count,
      SUM(cm.gross_commission) AS gross_commission_total,
      SUM(
        COALESCE(release_summary.released_amount, 0)
      ) AS released_commission_total
    FROM commissions cm
    LEFT JOIN (
      SELECT
        commission_id,
        SUM(net_release_amount) AS released_amount
      FROM commission_releases
      WHERE status = 'released'
      GROUP BY commission_id
    ) release_summary ON release_summary.commission_id = cm.id
    GROUP BY cm.client_unit_id
  ) commission_summary ON commission_summary.client_unit_id = cu.id
`

const getClientUnitsForWhereClause = async (whereClause = '', params = []) => {
  const [clientUnits] = await db.query(
    `
    SELECT
      ${clientUnitFields}
    ${clientUnitJoins}
    ${whereClause}
    ORDER BY cu.id DESC
    `,
    params
  )

  return clientUnits
}

const getClientUnitById = async (id) => {
  const clientUnits = await getClientUnitsForWhereClause(
    `
    WHERE cu.id = ?
    `,
    [id]
  )

  return clientUnits[0] || null
}

const getClientById = async (connectionOrDb, clientId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      c.*,
      seller.full_name AS default_seller_name,
      seller.seller_role AS default_seller_role,
      seller.commission_rate AS default_seller_commission_rate
    FROM clients c
    LEFT JOIN accredited_sellers seller ON seller.id = c.default_seller_id
    WHERE c.id = ?
    LIMIT 1
    `,
    [clientId]
  )

  return rows[0]
}

const getListingById = async (connectionOrDb, listingId) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      l.*,
      p.name AS project_name
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    WHERE l.id = ?
    LIMIT 1
    `,
    [listingId]
  )

  return rows[0]
}

const getSellerById = async (connectionOrDb, sellerId) => {
  if (isMissing(sellerId)) return null

  const [rows] = await connectionOrDb.query(
    `
    SELECT *
    FROM accredited_sellers
    WHERE id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [sellerId]
  )

  return rows[0]
}

const createClientDocumentChecklist = async (connectionOrDb, clientUnitId) => {
  const [documents] = await connectionOrDb.query(
    `
    SELECT id
    FROM documents
    WHERE status = 'active'
      AND is_required = TRUE
    ORDER BY id ASC
    `
  )

  if (documents.length === 0) {
    return {
      insertedCount: 0,
    }
  }

  const values = documents.map((document) => [
    clientUnitId,
    document.id,
    'not_submitted',
  ])

  const [result] = await connectionOrDb.query(
    `
    INSERT IGNORE INTO client_document_list (
      client_unit_id,
      document_id,
      status
    ) VALUES ?
    `,
    [values]
  )

  return {
    insertedCount: result.affectedRows,
  }
}

const createReservationCommissions = async ({
  connection,
  clientUnitId,
  listing,
  sellerId,
  mainRateOverride,
  saleType,
  overrideSellerId,
  overrideRate,
  overrideNotes,
  cashKaliwaanAmount,
  cashKaliwaanDate,
  cashKaliwaanNotes,
}) => {
  const createdCommissions = []

  if (isMissing(sellerId)) {
    return createdCommissions
  }

  const mainCommission = await createAutoCommissionForClientUnit({
    connection,
    clientUnitId,
    sellerId,
    rateOverride: mainRateOverride,
    commissionRole: null,
    sourceType: 'main',
    parentCommissionId: null,
    saleType,
    notes: `Auto-generated from reservation of ${listing.unit_id}`,
  })

  if (mainCommission) {
    createdCommissions.push(mainCommission)
  }

  const hasOverrideSeller = !isMissing(overrideSellerId)
  const hasOverrideRate = !isMissing(overrideRate)

  if (hasOverrideSeller && hasOverrideRate) {
    const overrideCommission = await createAutoCommissionForClientUnit({
      connection,
      clientUnitId,
      sellerId: overrideSellerId,
      rateOverride: overrideRate,
      commissionRole: 'override',
      sourceType: 'override',
      parentCommissionId: mainCommission?.commissionId || null,
      saleType,
      cashKaliwaanAmount,
      cashKaliwaanDate,
      cashKaliwaanNotes,
      overrideNotes,
      notes: `Optional override commission from reservation of ${listing.unit_id}`,
    })

    if (overrideCommission) {
      createdCommissions.push(overrideCommission)
    }
  }

  return createdCommissions
}

export const getClientUnits = async (req, res) => {
  const { search, status, client_id } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        c.full_name LIKE ?
        OR l.unit_id LIKE ?
        OR p.name LIKE ?
        OR l.lot_type LIKE ?
        OR cu.status LIKE ?
        OR cu.mode_of_payment LIKE ?
        OR seller.full_name LIKE ?
        OR seller.seller_role LIKE ?
      )
    `)

    params.push(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    )
  }

  if (!isMissing(status) && status !== 'all') {
    conditions.push('cu.status = ?')
    params.push(status)
  }

  if (!isMissing(client_id)) {
    conditions.push('cu.client_id = ?')
    params.push(client_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const clientUnits = await getClientUnitsForWhereClause(whereClause, params)

  res.status(200).json({
    message: 'Client units fetched successfully',
    clientUnits,
    data: clientUnits,
  })
}


export const searchClientUnits = async (req, res) => {
  const { q } = req.query

  if (!q || q.trim().length < 1) {
    return res.status(200).json({
      message: 'Client units fetched successfully',
      data: [],
      clientUnits: [],
    })
  }

  const searchTerm = `%${q.trim()}%`

  const [rows] = await db.query(
    `
    SELECT
      cu.id,
      cu.client_id,
      c.full_name AS client_name,
      cu.listing_id,
      l.unit_id,
      p.name AS project_name,
      l.lot_type,
      l.lot_area_sqm,
      l.net_selling_price,
      l.legal_misc_fee,
      l.total_contract_price,
      COALESCE(payment_summary.paid_amount, 0) AS paid_amount,
      GREATEST(
        COALESCE(l.total_contract_price, 0) - COALESCE(payment_summary.paid_amount, 0),
        0
      ) AS balance,
      CASE
        WHEN COALESCE(l.total_contract_price, 0) > 0
        THEN ROUND((COALESCE(payment_summary.paid_amount, 0) / l.total_contract_price) * 100, 2)
        ELSE 0
      END AS payment_percentage,
      cu.due_day,
      cu.status,
      cu.seller_id,
      seller.full_name AS seller_name,
      CASE
        WHEN COALESCE(document_summary.required_count, 0) > 0
          AND COALESCE(document_summary.submitted_count, 0) = document_summary.required_count
        THEN 'complete'
        ELSE 'incomplete'
      END AS document_status
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN projects p ON p.id = l.project_id
    LEFT JOIN accredited_sellers seller ON seller.id = cu.seller_id
    LEFT JOIN (
      SELECT client_unit_id, SUM(amount) AS paid_amount
      FROM payments
      WHERE status = 'verified'
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    LEFT JOIN (
      SELECT
        cu_docs.id AS client_unit_id,
        COUNT(d.id) AS required_count,
        SUM(CASE WHEN cdl.status IN ('submitted', 'approved') THEN 1 ELSE 0 END) AS submitted_count
      FROM client_units cu_docs
      LEFT JOIN documents d
        ON d.is_required = TRUE
        AND d.status = 'active'
      LEFT JOIN client_document_list cdl
        ON cdl.client_unit_id = cu_docs.id
        AND cdl.document_id = d.id
      GROUP BY cu_docs.id
    ) document_summary ON document_summary.client_unit_id = cu.id
    WHERE
      c.full_name LIKE ?
      OR l.unit_id LIKE ?
      OR p.name LIKE ?
      OR l.lot_type LIKE ?
      OR seller.full_name LIKE ?
    ORDER BY cu.id DESC
    LIMIT 20
    `,
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
  )

  return res.status(200).json({
    message: 'Client units fetched successfully',
    data: rows,
    clientUnits: rows,
  })
}

export const getClientUnit = async (req, res) => {
  const { id } = req.params

  const clientUnit = await getClientUnitById(id)

  if (!clientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  res.status(200).json({
    message: 'Client unit fetched successfully',
    clientUnit,
    data: clientUnit,
  })
}

export const getClientUnitsByClient = async (req, res) => {
  const { clientId } = req.params

  const [clientRows] = await db.query(
    `
    SELECT
      c.*,
      seller.full_name AS default_seller_name,
      seller.seller_role AS default_seller_role,
      seller.commission_rate AS default_seller_commission_rate
    FROM clients c
    LEFT JOIN accredited_sellers seller ON seller.id = c.default_seller_id
    WHERE c.id = ?
    LIMIT 1
    `,
    [clientId]
  )

  const client = clientRows[0]

  if (!client) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const units = await getClientUnitsForWhereClause(
    `
    WHERE cu.client_id = ?
    `,
    [clientId]
  )

  res.status(200).json({
    message: 'Client units fetched successfully',
    client,
    units,
    clientUnits: units,
    data: units,
  })
}

export const getAvailableListings = async (req, res) => {
  const { search, project_id, lot_type } = req.query

  const conditions = [`l.status = 'available'`]
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        p.name LIKE ?
        OR l.unit_id LIKE ?
        OR l.cadastral_lot_no LIKE ?
        OR l.lot_type LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm)
  }

  if (!isMissing(project_id) && project_id !== 'all') {
    conditions.push('l.project_id = ?')
    params.push(project_id)
  }

  if (!isMissing(lot_type) && lot_type !== 'all') {
    conditions.push('l.lot_type = ?')
    params.push(lot_type)
  }

  const [listings] = await db.query(
    `
    SELECT
      l.id,
      l.project_id,
      p.name AS project_name,
      p.location AS project_location,
      l.cadastral_lot_no,
      l.unit_id,
      l.lot_type,
      l.reservation_fee,
      l.price_per_sqm,
      l.lot_area_sqm,
      l.legal_misc_rate,
      l.net_selling_price,
      l.legal_misc_fee,
      l.total_contract_price,
      l.status,
      l.created_at,
      l.updated_at
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.name ASC, l.unit_id ASC
    `,
    params
  )

  res.status(200).json({
    message: 'Available listings fetched successfully',
    listings,
    availableListings: listings,
    data: listings,
  })
}

export const reserveListing = async (req, res) => {
  const { clientId } = req.params

  const {
    listing_id,
    seller_id,
    due_day,
    status = 'reserved',
    mode_of_payment = 'installment',
    assigned_user_id,
    main_commission_rate_override,
    sale_type = 'distributed',
    override_seller_id,
    override_rate,
    override_notes,
    cash_kaliwaan_amount = 0,
    cash_kaliwaan_date,
    cash_kaliwaan_notes,
  } = req.body

  if (isMissing(listing_id)) {
    return res.status(400).json({
      message: 'Listing is required',
    })
  }

  if (!validateClientUnitStatus(status)) {
    return res.status(400).json({
      message: 'Invalid client unit status',
    })
  }

  const dueDayValidation = validateDueDay(due_day)

  if (!dueDayValidation.isValid) {
    return res.status(400).json({
      message: 'Due day must be between 1 and 31',
    })
  }

  const hasOverrideSeller = !isMissing(override_seller_id)
  const hasOverrideRate = !isMissing(override_rate)

  if (hasOverrideSeller && !hasOverrideRate) {
    return res.status(400).json({
      message: 'Override rate is required when override seller is selected',
    })
  }

  if (!hasOverrideSeller && hasOverrideRate) {
    return res.status(400).json({
      message: 'Override seller is required when override rate is entered',
    })
  }

  const finalSaleType = validateSaleType(sale_type)
  const finalModeOfPayment = validateModeOfPayment(mode_of_payment)

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const client = await getClientById(connection, clientId)

    if (!client) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Client not found',
      })
    }

    const listing = await getListingById(connection, listing_id)

    if (!listing) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Listing not found',
      })
    }

    if (listing.status !== 'available') {
      await connection.rollback()
      return res.status(400).json({
        message: 'Listing is not available',
      })
    }

    const finalSellerId = !isMissing(seller_id)
      ? seller_id
      : client.default_seller_id

    if (isMissing(finalSellerId)) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Seller is required to reserve a listing and generate commission',
      })
    }

    const mainSeller = await getSellerById(connection, finalSellerId)

    if (!mainSeller) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Seller not found or inactive',
      })
    }

    if (hasOverrideSeller) {
      const overrideSeller = await getSellerById(connection, override_seller_id)

      if (!overrideSeller) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Override seller not found or inactive',
        })
      }

      if (Number(override_seller_id) === Number(finalSellerId)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Override seller must be different from main seller',
        })
      }
    }

    const [duplicateRows] = await connection.query(
      `
      SELECT id
      FROM client_units
      WHERE listing_id = ?
        AND status IN ('reserved', 'active', 'fully_paid', 'closed')
      LIMIT 1
      `,
      [listing_id]
    )

    if (duplicateRows.length > 0) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Listing is already reserved or sold',
      })
    }

    const totalContractPrice = normalizeMoney(listing.total_contract_price)

    const [result] = await connection.query(
      `
      INSERT INTO client_units (
        client_id,
        listing_id,
        assigned_user_id,
        seller_id,
        status,
        mode_of_payment,
        balance,
        due_day
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clientId,
        listing_id,
        nullableValue(assigned_user_id || req.user.id),
        finalSellerId,
        status,
        finalModeOfPayment,
        totalContractPrice,
        dueDayValidation.value,
      ]
    )

    const clientUnitId = result.insertId

    const nextListingStatus = listingStatusFromClientUnitStatus(status)

    if (nextListingStatus) {
      await connection.query(
        `
        UPDATE listings
        SET status = ?
        WHERE id = ?
        `,
        [nextListingStatus, listing_id]
      )
    }

    await createClientDocumentChecklist(connection, clientUnitId)

    const createdCommissions = await createReservationCommissions({
      connection,
      clientUnitId,
      listing,
      sellerId: finalSellerId,
      mainRateOverride: main_commission_rate_override,
      saleType: finalSaleType,
      overrideSellerId: override_seller_id,
      overrideRate: override_rate,
      overrideNotes: override_notes,
      cashKaliwaanAmount: cash_kaliwaan_amount,
      cashKaliwaanDate: cash_kaliwaan_date,
      cashKaliwaanNotes: cash_kaliwaan_notes,
    })

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'reserve',
      module: 'Client Units',
      description: `Reserved ${listing.unit_id} for ${client.full_name}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Listing reserved successfully',
      clientUnitId,
      commissions: createdCommissions,
      data: {
        clientUnitId,
        commissions: createdCommissions,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const updateClientUnit = async (req, res) => {
  const { id } = req.params

  const {
    assigned_user_id,
    seller_id,
    due_day,
    status,
    mode_of_payment,
    regenerate_commission = false,
    main_commission_rate_override,
    sale_type,
  } = req.body

  const existingClientUnit = await getClientUnitById(id)

  if (!existingClientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const finalStatus = status || existingClientUnit.status

  if (!validateClientUnitStatus(finalStatus)) {
    return res.status(400).json({
      message: 'Invalid client unit status',
    })
  }

  const dueDayValidation = validateDueDay(due_day)

  if (!dueDayValidation.isValid) {
    return res.status(400).json({
      message: 'Due day must be between 1 and 31',
    })
  }

  const finalSellerId = !isMissing(seller_id)
    ? seller_id
    : existingClientUnit.seller_id

  const finalModeOfPayment = validateModeOfPayment(
    isMissing(mode_of_payment)
      ? existingClientUnit.mode_of_payment
      : mode_of_payment
  )

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    if (!isMissing(finalSellerId)) {
      const seller = await getSellerById(connection, finalSellerId)

      if (!seller) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Seller not found or inactive',
        })
      }
    }

    const [releasedRows] = await connection.query(
      `
      SELECT COUNT(cr.id) AS released_count
      FROM commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      WHERE cm.client_unit_id = ?
        AND cr.status = 'released'
      `,
      [id]
    )

    const releasedCount = Number(releasedRows[0]?.released_count || 0)

    if (
      releasedCount > 0 &&
      Number(finalSellerId || 0) !== Number(existingClientUnit.seller_id || 0)
    ) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Cannot change seller after commission release has been paid',
      })
    }

    const nextDueDay = isMissing(due_day)
      ? existingClientUnit.due_day
      : dueDayValidation.value

    const nextAssignedUserId = isMissing(assigned_user_id)
      ? existingClientUnit.assigned_user_id
      : nullableValue(assigned_user_id)

    await connection.query(
      `
      UPDATE client_units
      SET
        assigned_user_id = ?,
        seller_id = ?,
        due_day = ?,
        status = ?,
        mode_of_payment = ?
      WHERE id = ?
      `,
      [
        nextAssignedUserId,
        nullableValue(finalSellerId),
        nextDueDay,
        finalStatus,
        finalModeOfPayment,
        id,
      ]
    )

    const nextListingStatus = listingStatusFromClientUnitStatus(finalStatus)

    if (nextListingStatus) {
      await connection.query(
        `
        UPDATE listings
        SET status = ?
        WHERE id = ?
        `,
        [nextListingStatus, existingClientUnit.listing_id]
      )
    }

    let regeneratedCommission = null

    const sellerChanged =
      Number(finalSellerId || 0) !== Number(existingClientUnit.seller_id || 0)

    if (regenerate_commission && sellerChanged && !isMissing(finalSellerId)) {
      await connection.query(
        `
        DELETE cr
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cm.client_unit_id = ?
          AND cr.status <> 'released'
      `,
        [id]
      )

      await connection.query(
        `
        DELETE FROM commissions
        WHERE client_unit_id = ?
          AND status <> 'released'
      `,
        [id]
      )

      const listing = await getListingById(connection, existingClientUnit.listing_id)

      regeneratedCommission = await createAutoCommissionForClientUnit({
        connection,
        clientUnitId: id,
        sellerId: finalSellerId,
        rateOverride: main_commission_rate_override,
        commissionRole: null,
        sourceType: 'main',
        parentCommissionId: null,
        saleType: validateSaleType(sale_type),
        notes: `Regenerated after seller update for ${listing?.unit_id || 'client unit'}`,
      })
    }

    await refreshCommissionEligibility(id, connection)

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Client Units',
      description: `Updated client unit ${id}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Client unit updated successfully',
      regeneratedCommission,
      data: {
        clientUnitId: Number(id),
        regeneratedCommission,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const changeClientUnitListing = async (req, res) => {
  const { id } = req.params

  const {
    new_listing_id,
    status,
    regenerate_commission = true,
    reason = null,
  } = req.body

  if (isMissing(new_listing_id)) {
    return res.status(400).json({
      message: 'New listing is required',
    })
  }

  const existingClientUnit = await getClientUnitById(id)

  if (!existingClientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  if (['cancelled', 'fully_paid', 'closed'].includes(existingClientUnit.status)) {
    return res.status(400).json({
      message: 'Cannot change unit for cancelled, fully paid, or closed account',
    })
  }

  if (Number(existingClientUnit.listing_id) === Number(new_listing_id)) {
    return res.status(400).json({
      message: 'Client is already assigned to this listing',
    })
  }

  const finalStatus = status || existingClientUnit.status || 'reserved'

  if (!validateClientUnitStatus(finalStatus)) {
    return res.status(400).json({
      message: 'Invalid client unit status',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const oldListing = await getListingById(connection, existingClientUnit.listing_id)
    const newListing = await getListingById(connection, new_listing_id)

    if (!newListing) {
      await connection.rollback()
      return res.status(404).json({
        message: 'New listing not found',
      })
    }

    if (newListing.status !== 'available') {
      await connection.rollback()
      return res.status(400).json({
        message: 'New listing is not available',
      })
    }

    const [releasedRows] = await connection.query(
      `
      SELECT COUNT(cr.id) AS released_count
      FROM commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      WHERE cm.client_unit_id = ?
        AND cr.status = 'released'
      `,
      [id]
    )

    if (Number(releasedRows[0]?.released_count || 0) > 0) {
      await connection.rollback()
      return res.status(400).json({
        message: 'Cannot change unit after commission release has been paid',
      })
    }

    await connection.query(
      `
      UPDATE listings
      SET status = 'available'
      WHERE id = ?
      `,
      [existingClientUnit.listing_id]
    )

    const nextListingStatus = listingStatusFromClientUnitStatus(finalStatus) || 'reserved'

    await connection.query(
      `
      UPDATE listings
      SET status = ?
      WHERE id = ?
      `,
      [nextListingStatus, new_listing_id]
    )

    await connection.query(
      `
      UPDATE client_units
      SET
        listing_id = ?,
        status = ?,
        balance = ?
      WHERE id = ?
      `,
      [new_listing_id, finalStatus, normalizeMoney(newListing.total_contract_price), id]
    )

    await connection.query(
      `
      UPDATE commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      SET cr.status = 'cancelled'
      WHERE cm.client_unit_id = ?
        AND cr.status <> 'released'
      `,
      [id]
    )

    await connection.query(
      `
      UPDATE commissions
      SET status = 'cancelled'
      WHERE client_unit_id = ?
        AND status <> 'released'
      `,
      [id]
    )

    let regeneratedCommission = null

    if (regenerate_commission && !isMissing(existingClientUnit.seller_id)) {
      regeneratedCommission = await createAutoCommissionForClientUnit({
        connection,
        clientUnitId: id,
        sellerId: existingClientUnit.seller_id,
        rateOverride: null,
        commissionRole: null,
        sourceType: 'main',
        parentCommissionId: null,
        saleType: 'distributed',
        notes: `Regenerated after unit change from ${oldListing?.unit_id || 'old unit'} to ${newListing.unit_id}`,
      })
    }

    await refreshCommissionEligibility(id, connection)

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'change_unit',
      module: 'Client Units',
      description: `Changed client unit ${id} from ${oldListing?.unit_id || 'old unit'} to ${newListing.unit_id}${reason ? `: ${reason}` : ''}`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Client unit listing changed successfully',
      data: {
        clientUnitId: Number(id),
        old_listing_id: Number(existingClientUnit.listing_id),
        new_listing_id: Number(new_listing_id),
        regeneratedCommission,
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const cancelClientUnit = async (req, res) => {
  const { id } = req.params
  const { release_listing = true, reason = null } = req.body

  const existingClientUnit = await getClientUnitById(id)

  if (!existingClientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  if (['fully_paid', 'closed'].includes(existingClientUnit.status)) {
    return res.status(400).json({
      message: 'Fully paid or closed account cannot be cancelled here',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE client_units
      SET status = 'cancelled'
      WHERE id = ?
      `,
      [id]
    )

    await connection.query(
      `
      UPDATE listings
      SET status = ?
      WHERE id = ?
      `,
      [release_listing ? 'available' : 'hold', existingClientUnit.listing_id]
    )

    await connection.query(
      `
      UPDATE commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      SET cr.status = 'cancelled'
      WHERE cm.client_unit_id = ?
        AND cr.status <> 'released'
      `,
      [id]
    )

    await connection.query(
      `
      UPDATE commissions
      SET status = 'cancelled'
      WHERE client_unit_id = ?
        AND status <> 'released'
      `,
      [id]
    )

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'cancel',
      module: 'Client Units',
      description: `Cancelled client unit ${id}${reason ? `: ${reason}` : ''}`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Client unit cancelled successfully',
      data: {
        clientUnitId: Number(id),
        listing_status: release_listing ? 'available' : 'hold',
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export const deleteClientUnit = async (req, res) => {
  const { id } = req.params

  const existingClientUnit = await getClientUnitById(id)

  if (!existingClientUnit) {
    return res.status(404).json({
      message: 'Client unit not found',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [[paymentCount]] = await connection.query(
      `SELECT COUNT(id) AS total FROM payments WHERE client_unit_id = ?`,
      [id]
    )

    const [[commissionCount]] = await connection.query(
      `SELECT COUNT(id) AS total FROM commissions WHERE client_unit_id = ?`,
      [id]
    )

    const [[documentActivityCount]] = await connection.query(
      `
      SELECT COUNT(id) AS total
      FROM client_document_list
      WHERE client_unit_id = ?
        AND status <> 'not_submitted'
      `,
      [id]
    )

    if (
      Number(paymentCount.total || 0) > 0 ||
      Number(commissionCount.total || 0) > 0 ||
      Number(documentActivityCount.total || 0) > 0
    ) {
      await connection.rollback()
      return res.status(400).json({
        message: 'This unit already has transaction history. Cancel it instead.',
      })
    }

    await connection.query(
      `DELETE FROM client_document_list WHERE client_unit_id = ?`,
      [id]
    )

    await connection.query(
      `DELETE FROM client_units WHERE id = ?`,
      [id]
    )

    await connection.query(
      `UPDATE listings SET status = 'available' WHERE id = ?`,
      [existingClientUnit.listing_id]
    )

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'delete',
      module: 'Client Units',
      description: `Deleted wrong client unit input ${id}`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Client unit deleted successfully',
      data: {
        clientUnitId: Number(id),
      },
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
