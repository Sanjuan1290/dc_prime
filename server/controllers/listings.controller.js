import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

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

const formatDecimal = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const computeListingAmounts = ({
  lot_area_sqm,
  price_per_sqm,
  legal_misc_rate,
  reservation_fee
}) => {
  const netSellingPrice = numberValue(lot_area_sqm) * numberValue(price_per_sqm)
  const legalMiscRate = numberValue(legal_misc_rate)
  const legalMiscFee = netSellingPrice * (legalMiscRate / 100)
  const totalContractPrice = netSellingPrice + legalMiscFee
  const reservationFee = numberValue(reservation_fee)

  const thirtyPercent = Math.max(totalContractPrice * 0.3 - reservationFee, 0)
  const spotDpDiscount = thirtyPercent * 0.075
  const spotDp = thirtyPercent - spotDpDiscount
  const seventyFivePercent = totalContractPrice * 0.75

  return {
    netSellingPrice: formatDecimal(netSellingPrice),
    legalMiscRate: formatDecimal(legalMiscRate),
    legalMiscFee: formatDecimal(legalMiscFee),
    totalContractPrice: formatDecimal(totalContractPrice),

    thirtyPercent: formatDecimal(thirtyPercent),
    spotDpDiscount: formatDecimal(spotDpDiscount),
    spotDp: formatDecimal(spotDp),
    threeMonths: formatDecimal(thirtyPercent / 3),

    seventyFivePercent: formatDecimal(seventyFivePercent),
    twelveMonths: formatDecimal(seventyFivePercent / 12),
    eighteenMonths: formatDecimal(seventyFivePercent / 18),
    twentyMonths: formatDecimal(seventyFivePercent / 20)
  }
}

const listingFields = `
  l.id,
  l.project_id,
  p.name AS project_name,
  p.location AS project_location,
  p.administrator AS project_administrator,
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
`

const mapListing = (listing) => {
  const computed = computeListingAmounts({
    lot_area_sqm: listing.lot_area_sqm,
    price_per_sqm: listing.price_per_sqm,
    legal_misc_rate: listing.legal_misc_rate,
    reservation_fee: listing.reservation_fee
  })

  return {
    ...listing,

    net_selling_price: computed.netSellingPrice,
    legal_misc_rate: computed.legalMiscRate,
    legal_misc_fee: computed.legalMiscFee,
    total_contract_price: computed.totalContractPrice,

    thirty_percent: computed.thirtyPercent,
    spot_dp_discount: computed.spotDpDiscount,
    spot_dp: computed.spotDp,
    three_months: computed.threeMonths,
    seventy_five_percent: computed.seventyFivePercent,
    twelve_months: computed.twelveMonths,
    eighteen_months: computed.eighteenMonths,
    twenty_months: computed.twentyMonths
  }
}

export const getListings = async (req, res) => {
  const { search, project_id, status, lot_type } = req.query

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

  return res.status(200).json({
    listings: listings.map(mapListing)
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
      message: 'Listing not found'
    })
  }

  return res.status(200).json({
    listing: mapListing(listing)
  })
}

export const getListingFullDetails = async (req, res) => {
  const { id } = req.params

  const [listingRows] = await db.query(
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

  const listing = listingRows[0]

  if (!listing) {
    return res.status(404).json({
      message: 'Listing not found'
    })
  }

  const mappedListing = mapListing(listing)

  const [clientUnitRows] = await db.query(
    `
    SELECT
      cu.id,
      cu.client_id,
      cu.listing_id,
      cu.assigned_user_id,
      u.full_name AS assigned_user_name,
      cu.status,
      cu.balance,
      cu.due_day,
      cu.created_at,
      cu.updated_at,
      c.full_name AS client_name,
      c.spouse_co_owner_name,
      c.email AS client_email,
      c.contact_no AS client_contact_no,
      c.address AS client_address,
      c.region AS client_region
    FROM client_units cu
    INNER JOIN clients c ON c.id = cu.client_id
    LEFT JOIN users u ON u.id = cu.assigned_user_id
    WHERE cu.listing_id = ?
    ORDER BY cu.id DESC
    LIMIT 1
    `,
    [id]
  )

  const clientUnit = clientUnitRows[0] || null

  let paymentSummary = {
    total_paid: 0,
    payment_count: 0,
    latest_payment_date: null,
    latest_payment_amount: 0,
    payment_status:
      mappedListing.status === 'sold' ? 'unpaid' : 'not_applicable',
    balance: mappedListing.total_contract_price
  }

  let commissionSummary = {
    seller_name: null,
    seller_role: null,
    reports_under: null,
    rate: 0,
    amount: 0,
    released_amount: 0,
    remaining_amount: 0,
    status: null
  }

  let documentSummary = {
    total_documents: 0,
    required_documents: 0,
    submitted_documents: 0,
    approved_documents: 0,
    missing_required_documents: 0,
    document_status: clientUnit ? 'incomplete' : 'not_applicable'
  }

  if (clientUnit) {
    const [paymentRows] = await db.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total_paid,
        COUNT(id) AS payment_count,
        MAX(payment_date) AS latest_payment_date
      FROM payments
      WHERE client_unit_id = ?
        AND status = 'verified'
      `,
      [clientUnit.id]
    )

    const [latestPaymentRows] = await db.query(
      `
      SELECT amount
      FROM payments
      WHERE client_unit_id = ?
        AND status = 'verified'
      ORDER BY payment_date DESC, id DESC
      LIMIT 1
      `,
      [clientUnit.id]
    )

    const totalPaid = numberValue(paymentRows[0]?.total_paid)
    const totalContractPrice = numberValue(mappedListing.total_contract_price)
    const balance = Math.max(totalContractPrice - totalPaid, 0)

    let paymentStatus = 'unpaid'

    if (totalPaid >= totalContractPrice && totalContractPrice > 0) {
      paymentStatus = 'fully_paid'
    } else if (totalPaid > 0) {
      paymentStatus = 'partially_paid'
    }

    paymentSummary = {
      total_paid: formatDecimal(totalPaid),
      payment_count: Number(paymentRows[0]?.payment_count || 0),
      latest_payment_date: paymentRows[0]?.latest_payment_date || null,
      latest_payment_amount: formatDecimal(latestPaymentRows[0]?.amount || 0),
      payment_status: paymentStatus,
      balance: formatDecimal(balance)
    }

    const [commissionRows] = await db.query(
      `
      SELECT
        cm.rate,
        cm.amount,
        cm.released_amount,
        cm.amount - cm.released_amount AS remaining_amount,
        cm.status,
        seller.full_name AS seller_name,
        seller.seller_role,
        COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under
      FROM commissions cm
      LEFT JOIN accredited_sellers seller ON seller.id = cm.seller_id
      LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
      WHERE cm.client_unit_id = ?
      ORDER BY cm.id DESC
      LIMIT 1
      `,
      [clientUnit.id]
    )

    if (commissionRows[0]) {
      commissionSummary = {
        seller_name: commissionRows[0].seller_name,
        seller_role: commissionRows[0].seller_role,
        reports_under: commissionRows[0].reports_under,
        rate: formatDecimal(commissionRows[0].rate),
        amount: formatDecimal(commissionRows[0].amount),
        released_amount: formatDecimal(commissionRows[0].released_amount),
        remaining_amount: formatDecimal(commissionRows[0].remaining_amount),
        status: commissionRows[0].status
      }
    }

    const [documentRows] = await db.query(
      `
      SELECT
        COUNT(cdl.id) AS total_documents,
        SUM(CASE WHEN d.is_required = TRUE THEN 1 ELSE 0 END) AS required_documents,
        SUM(CASE WHEN cdl.status IN ('submitted', 'approved') THEN 1 ELSE 0 END) AS submitted_documents,
        SUM(CASE WHEN cdl.status = 'approved' THEN 1 ELSE 0 END) AS approved_documents,
        SUM(
          CASE
            WHEN d.is_required = TRUE
              AND cdl.status NOT IN ('submitted', 'approved')
            THEN 1
            ELSE 0
          END
        ) AS missing_required_documents
      FROM client_document_list cdl
      INNER JOIN documents d ON d.id = cdl.document_id
      WHERE cdl.client_unit_id = ?
      `,
      [clientUnit.id]
    )

    const docs = documentRows[0] || {}
    const missingRequired = Number(docs.missing_required_documents || 0)
    const requiredDocuments = Number(docs.required_documents || 0)

    documentSummary = {
      total_documents: Number(docs.total_documents || 0),
      required_documents: requiredDocuments,
      submitted_documents: Number(docs.submitted_documents || 0),
      approved_documents: Number(docs.approved_documents || 0),
      missing_required_documents: missingRequired,
      document_status:
        requiredDocuments > 0 && missingRequired === 0
          ? 'complete'
          : 'incomplete'
    }
  }

  return res.status(200).json({
    listing: mappedListing,
    clientUnit,
    paymentSummary,
    commissionSummary,
    documentSummary
  })
}

export const createListing = async (req, res) => {
  const {
    project_id,
    cadastral_lot_no,
    unit_id,
    lot_type,
    reservation_fee = 50000,
    price_per_sqm = 0,
    lot_area_sqm = 0,
    legal_misc_rate = 10,
    status = 'available'
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project is required'
    })
  }

  if (isMissing(unit_id)) {
    return res.status(400).json({
      message: 'Unit ID is required'
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
      message: 'Project not found'
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO listings (
      project_id,
      cadastral_lot_no,
      unit_id,
      lot_type,
      reservation_fee,
      price_per_sqm,
      lot_area_sqm,
      legal_misc_rate,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      project_id,
      nullableValue(cadastral_lot_no),
      unit_id,
      nullableValue(lot_type),
      numberValue(reservation_fee),
      numberValue(price_per_sqm),
      numberValue(lot_area_sqm),
      numberValue(legal_misc_rate),
      status
    ]
  )

  await createAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Listings',
    description: `Created listing ${unit_id}`,
    ipAddress: getClientIp(req)
  })

  return res.status(201).json({
    message: 'Listing created successfully',
    listingId: result.insertId
  })
}

export const updateListing = async (req, res) => {
  const { id } = req.params

  const {
    project_id,
    cadastral_lot_no,
    unit_id,
    lot_type,
    reservation_fee = 50000,
    price_per_sqm = 0,
    lot_area_sqm = 0,
    legal_misc_rate = 10,
    status = 'available'
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project is required'
    })
  }

  if (isMissing(unit_id)) {
    return res.status(400).json({
      message: 'Unit ID is required'
    })
  }

  const [result] = await db.query(
    `
    UPDATE listings
    SET
      project_id = ?,
      cadastral_lot_no = ?,
      unit_id = ?,
      lot_type = ?,
      reservation_fee = ?,
      price_per_sqm = ?,
      lot_area_sqm = ?,
      legal_misc_rate = ?,
      status = ?
    WHERE id = ?
    `,
    [
      project_id,
      nullableValue(cadastral_lot_no),
      unit_id,
      nullableValue(lot_type),
      numberValue(reservation_fee),
      numberValue(price_per_sqm),
      numberValue(lot_area_sqm),
      numberValue(legal_misc_rate),
      status,
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
    ipAddress: getClientIp(req)
  })

  return res.status(200).json({
    message: 'Listing updated successfully'
  })
}


export const deleteListing = async (req, res) => {
  const { id } = req.params

  const [listingRows] = await db.query(
    `SELECT id, unit_id, status FROM listings WHERE id = ? LIMIT 1`,
    [id]
  )

  const listing = listingRows[0]

  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' })
  }

  if (['reserved', 'sold'].includes(listing.status)) {
    return res.status(400).json({
      message: 'Cannot delete a listing that has been reserved or sold.'
    })
  }

  const [unitRows] = await db.query(
    `SELECT id FROM client_units WHERE listing_id = ? LIMIT 1`,
    [id]
  )

  if (unitRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a listing that has been reserved or sold.'
    })
  }

  await db.query(`DELETE FROM listings WHERE id = ?`, [id])

  await createAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Listings',
    description: `Deleted listing ${listing.unit_id}`,
    ipAddress: getClientIp(req)
  })

  return res.status(200).json({ message: 'Listing deleted successfully' })
}
