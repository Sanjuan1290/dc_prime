import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { refreshCommissionEligibility } from './commissions.controller.js'
import {
  copyProjectRequirementsToListing,
  ensureClientDocumentChecklistForClientUnit,
  getListingDocumentRequirements as loadListingDocumentRequirements,
  replaceListingDocumentRequirements,
} from '../utils/documentRequirements.js'

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


const cleanUnitId = (value) => String(value || '').trim()

const isDuplicateListingError = (error) => {
  return error?.code === 'ER_DUP_ENTRY' || String(error?.message || '').includes('uq_listing_project_unit')
}

const getDuplicateListingMessage = ({ unitId, projectName, existingStatus }) => {
  const projectPart = projectName ? ` in ${projectName}` : ''
  const statusPart = existingStatus ? ` Current status: ${String(existingStatus).replace(/_/g, ' ')}.` : ''

  return `Cannot save listing ${unitId}. This Unit ID already exists${projectPart}.${statusPart} Use a different Unit ID, or edit the existing listing if this is a geography/renumbering change.`
}

const getReservedUnitIdentityMessage = ({
  unitId,
  projectName,
  currentUnitId,
  identitySource,
}) => {
  const projectPart = projectName ? ` in ${projectName}` : ''
  const currentPart = currentUnitId ? ` It belongs to current listing ${currentUnitId}.` : ''
  const sourceLabel = String(identitySource || '').replace(/_/g, ' ')

  return `Cannot save listing ${unitId}. This Unit ID was already used before${projectPart} as ${sourceLabel}.${currentPart} Old Unit IDs are reserved for unit history and cannot be reused for a new listing.`
}

const getUnitIdentityConflictMessage = (conflict, unitId) => {
  if (!conflict) return getDuplicateListingMessage({ unitId })

  if (conflict.conflict_type === 'current_listing') {
    return getDuplicateListingMessage({
      unitId,
      projectName: conflict.project_name,
      existingStatus: conflict.status,
    })
  }

  return getReservedUnitIdentityMessage({
    unitId,
    projectName: conflict.project_name,
    currentUnitId: conflict.current_unit_id || conflict.unit_id,
    identitySource: conflict.conflict_type,
  })
}

const findUnitIdentityConflict = async (executor, { projectId, unitId, excludeListingId = null }) => {
  const trimmedUnitId = cleanUnitId(unitId)

  if (!trimmedUnitId) return null

  const params = [projectId, trimmedUnitId]
  const excludeParams = []
  let excludeClause = ''
  let excludeClauseForHistory = ''
  let excludeClauseForAlias = ''

  if (excludeListingId) {
    excludeClause = 'AND l.id <> ?'
    excludeClauseForHistory = 'AND luh.listing_id <> ?'
    excludeClauseForAlias = 'AND lua.listing_id <> ?'
    excludeParams.push(excludeListingId)
  }

  const [currentRows] = await executor.query(
    `
    SELECT
      l.id,
      l.unit_id,
      l.unit_id AS current_unit_id,
      l.status,
      p.name AS project_name,
      'current_listing' AS conflict_type
    FROM listings l
    LEFT JOIN projects p ON p.id = l.project_id
    WHERE l.project_id = ?
      AND LOWER(TRIM(l.unit_id)) = LOWER(TRIM(?))
      ${excludeClause}
    LIMIT 1
    `,
    [...params, ...excludeParams]
  )

  if (currentRows[0]) return currentRows[0]

  const [historyRows] = await executor.query(
    `
    SELECT
      luh.id,
      luh.listing_id,
      l.unit_id AS current_unit_id,
      l.status,
      p.name AS project_name,
      CASE
        WHEN LOWER(TRIM(luh.old_unit_id)) = LOWER(TRIM(?)) THEN 'old_unit_id'
        ELSE 'unit_history'
      END AS conflict_type
    FROM listing_unit_history luh
    INNER JOIN listings l ON l.id = luh.listing_id
    LEFT JOIN projects p ON p.id = l.project_id
    WHERE l.project_id = ?
      AND (
        LOWER(TRIM(luh.old_unit_id)) = LOWER(TRIM(?))
        OR LOWER(TRIM(luh.new_unit_id)) = LOWER(TRIM(?))
      )
      ${excludeClauseForHistory}
    LIMIT 1
    `,
    [trimmedUnitId, projectId, trimmedUnitId, trimmedUnitId, ...excludeParams]
  )

  if (historyRows[0]) return historyRows[0]

  const [aliasRows] = await executor.query(
    `
    SELECT
      lua.id,
      lua.listing_id,
      l.unit_id AS current_unit_id,
      l.status,
      p.name AS project_name,
      COALESCE(lua.alias_type, 'old_unit_id') AS conflict_type
    FROM listing_unit_aliases lua
    INNER JOIN listings l ON l.id = lua.listing_id
    LEFT JOIN projects p ON p.id = l.project_id
    WHERE l.project_id = ?
      AND LOWER(TRIM(lua.alias_unit_id)) = LOWER(TRIM(?))
      ${excludeClauseForAlias}
    LIMIT 1
    `,
    [...params, ...excludeParams]
  )

  return aliasRows[0] || null
}

const findDuplicateListing = findUnitIdentityConflict

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

const recomputeListingClientUnitBalances = async (
  connectionOrDb,
  listingId,
  options = {}
) => {
  const [clientUnits] = await connectionOrDb.query(
    `
    SELECT
      cu.id,
      cu.status,
      cu.listing_id,
      l.reservation_fee,
      COALESCE(
        NULLIF(l.total_contract_price, 0),
        l.net_selling_price + l.legal_misc_fee,
        l.net_selling_price,
        0
      ) AS total_contract_price,
      COALESCE(SUM(CASE WHEN p.status = 'verified' AND (p.payment_type IS NULL OR p.payment_type <> 'excess_ma') THEN p.amount ELSE 0 END), 0) AS paid_amount,
      COALESCE(
        SUM(
          CASE
            WHEN p.status = 'verified' AND p.payment_type = 'reservation'
            THEN p.amount
            ELSE 0
          END
        ),
        0
      ) AS reservation_paid,
      COALESCE(
        SUM(
          CASE
            WHEN p.status = 'verified'
              AND p.payment_type IN ('downpayment', 'monthly', 'legal_misc', 'full_payment', 'other')
            THEN p.amount
            ELSE 0
          END
        ),
        0
      ) AS active_payment_paid
    FROM client_units cu
    INNER JOIN listings l ON l.id = cu.listing_id
    LEFT JOIN payments p ON p.client_unit_id = cu.id
    WHERE cu.listing_id = ?
      AND cu.status IN ('reserved', 'active', 'fully_paid')
    GROUP BY
      cu.id,
      cu.status,
      cu.listing_id,
      l.reservation_fee,
      l.total_contract_price,
      l.net_selling_price,
      l.legal_misc_fee
    `,
    [listingId]
  )

  const balanceSummaries = []

  for (const clientUnit of clientUnits) {
    const totalContractPrice = numberValue(clientUnit.total_contract_price)
    const paidAmount = numberValue(clientUnit.paid_amount)
    const reservationPaid = numberValue(clientUnit.reservation_paid)
    const activePaymentPaid = numberValue(clientUnit.active_payment_paid)
    const reservationFee = numberValue(clientUnit.reservation_fee)
    const balance = Math.max(formatDecimal(totalContractPrice - paidAmount), 0)

    let nextStatus = clientUnit.status
    let nextListingStatus = null

    if (totalContractPrice > 0 && paidAmount >= totalContractPrice) {
      nextStatus = 'fully_paid'
      nextListingStatus = 'sold'
    } else if (activePaymentPaid > 0) {
      nextStatus = 'active'
      nextListingStatus = 'sold'
    } else if (reservationPaid > 0 || paidAmount >= reservationFee) {
      nextStatus = 'reserved'
      nextListingStatus = 'reserved'
    }

    await connectionOrDb.query(
      `
      UPDATE client_units
      SET
        balance = ?,
        status = ?
      WHERE id = ?
      `,
      [balance, nextStatus, clientUnit.id]
    )

    if (nextListingStatus) {
      await connectionOrDb.query(
        `
        UPDATE listings
        SET status = ?
        WHERE id = ?
        `,
        [nextListingStatus, clientUnit.listing_id]
      )
    }

    const eligibilitySummary = await refreshCommissionEligibility(
      clientUnit.id,
      connectionOrDb,
      options
    )

    balanceSummaries.push({
      clientUnitId: clientUnit.id,
      totalContractPrice: formatDecimal(totalContractPrice),
      paidAmount: formatDecimal(paidAmount),
      balance,
      status: nextStatus,
      listingStatus: nextListingStatus,
      eligibilitySummary,
    })
  }

  return balanceSummaries
}


const normalizeUnitAliasList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const syncListingUnitAliases = async (connectionOrDb, listingId, aliases = []) => {
  const uniqueAliases = Array.from(
    new Set(
      normalizeUnitAliasList(aliases)
        .map((alias) => alias.trim())
        .filter(Boolean)
    )
  )

  await connectionOrDb.query(
    `DELETE FROM listing_unit_aliases WHERE listing_id = ?`,
    [listingId]
  )

  if (uniqueAliases.length === 0) return { aliasCount: 0 }

  const values = uniqueAliases.map(() => `(?, ?, 'old_unit_id')`).join(', ')
  const params = uniqueAliases.flatMap((alias) => [listingId, alias])

  await connectionOrDb.query(
    `
    INSERT INTO listing_unit_aliases (
      listing_id,
      alias_unit_id,
      alias_type
    ) VALUES ${values}
    `,
    params
  )

  return { aliasCount: uniqueAliases.length }
}

const formatOldUnitIdsForAudit = (oldUnitIds) => {
  const aliases = normalizeUnitAliasList(oldUnitIds)
  return aliases.length ? ` | Old Unit IDs: ${aliases.join(', ')}` : ''
}

const allowedListingStatuses = [
  'available',
  'reserved',
  'sold',
  'pending_cancellation',
]

const normalizeListingStatus = (status, fallback = 'available') => {
  const normalized = String(status || '').trim().toLowerCase()

  if (normalized === 'active') return 'sold'
  if (['hold', 'superseded', 'inactive', 'cancelled'].includes(normalized)) return 'available'
  if (allowedListingStatuses.includes(normalized)) return normalized

  return fallback
}

const insertListingUnitHistory = async (connectionOrDb, {
  listingId,
  oldUnitId,
  newUnitId,
  reason = 'admin_correction',
  changedBy = null,
  remarks = null,
}) => {
  const previousUnitId = String(oldUnitId || '').trim()
  const nextUnitId = String(newUnitId || '').trim()

  if (!previousUnitId || !nextUnitId || previousUnitId === nextUnitId) {
    return null
  }

  const [existingRows] = await connectionOrDb.query(
    `
    SELECT id
    FROM listing_unit_history
    WHERE listing_id = ?
      AND old_unit_id = ?
      AND new_unit_id = ?
    LIMIT 1
    `,
    [listingId, previousUnitId, nextUnitId]
  )

  if (existingRows[0]) return existingRows[0].id

  const [result] = await connectionOrDb.query(
    `
    INSERT INTO listing_unit_history (
      listing_id,
      old_unit_id,
      new_unit_id,
      reason,
      effective_date,
      changed_by,
      remarks
    ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?)
    `,
    [listingId, previousUnitId, nextUnitId, reason, changedBy, remarks]
  )

  return result.insertId
}


const booleanDocumentValue = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'required'].includes(normalized)) return true
  if (['0', 'false', 'no', 'optional'].includes(normalized)) return false
  return fallback
}

const normalizeDocumentRequirementsPayload = (requirements = []) => {
  if (!Array.isArray(requirements)) return []

  const seen = new Set()

  return requirements
    .map((requirement, index) => ({
      document_id: Number(requirement.document_id),
      is_required: booleanDocumentValue(requirement.is_required, true),
      status: requirement.status === 'inactive' ? 'inactive' : 'active',
      sort_order: Number(requirement.sort_order || index + 1),
      source: requirement.source || 'listing_override',
    }))
    .filter((requirement) => {
      if (!Number.isInteger(requirement.document_id) || requirement.document_id < 1) {
        return false
      }
      if (seen.has(requirement.document_id)) return false
      seen.add(requirement.document_id)
      return true
    })
}

const syncClientUnitChecklistsFromListingRequirements = async (
  connectionOrDb,
  listingId,
  requirements = [],
  options = {}
) => {
  const activeRequirements = normalizeDocumentRequirementsPayload(requirements).filter(
    (requirement) => requirement.status === 'active'
  )

  const [clientUnits] = await connectionOrDb.query(
    `
    SELECT id
    FROM client_units
    WHERE listing_id = ?
      AND status IN ('reserved', 'active', 'fully_paid', 'closed')
    `,
    [listingId]
  )

  if (clientUnits.length === 0 || activeRequirements.length === 0) {
    return {
      affectedClientUnits: clientUnits.length,
      syncedDocuments: 0,
    }
  }

  let syncedDocuments = 0

  for (const clientUnit of clientUnits) {
    const values = activeRequirements.map((requirement) => [
      clientUnit.id,
      requirement.document_id,
      requirement.is_required ? 1 : 0,
      requirement.source || 'listing_override',
      'not_submitted',
    ])

    const [result] = await connectionOrDb.query(
      `
      INSERT INTO client_document_list (
        client_unit_id,
        document_id,
        is_required,
        requirement_source,
        status
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        is_required = VALUES(is_required),
        requirement_source = VALUES(requirement_source),
        status = CASE
          WHEN client_document_list.status = 'not_submitted' THEN VALUES(status)
          ELSE client_document_list.status
        END
      `,
      [values]
    )

    syncedDocuments += Number(result.affectedRows || 0)

    await refreshCommissionEligibility(clientUnit.id, connectionOrDb, {
      actorRole: options.actorRole,
    })
  }

  return {
    affectedClientUnits: clientUnits.length,
    syncedDocuments,
  }
}

const getRiskyClientDocumentsForListingRemoval = async (
  connectionOrDb,
  listingId,
  removedDocumentIds = []
) => {
  if (!removedDocumentIds.length) return []

  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cdl.id,
      cdl.client_unit_id,
      cdl.document_id,
      d.name AS document_name,
      c.full_name AS client_name,
      l.unit_id,
      cdl.status,
      cdl.file_name,
      cdl.file_url,
      cdl.drive_file_id,
      cdl.uploaded_at
    FROM client_document_list cdl
    INNER JOIN client_units cu ON cu.id = cdl.client_unit_id
    INNER JOIN clients c ON c.id = cu.client_id
    INNER JOIN listings l ON l.id = cu.listing_id
    INNER JOIN documents d ON d.id = cdl.document_id
    WHERE cu.listing_id = ?
      AND cu.status IN ('reserved', 'active', 'fully_paid', 'closed')
      AND cdl.document_id IN (?)
      AND (
        cdl.status <> 'not_submitted'
        OR cdl.file_url IS NOT NULL
        OR cdl.drive_file_id IS NOT NULL
        OR cdl.uploaded_at IS NOT NULL
        OR cdl.file_name IS NOT NULL
      )
    ORDER BY c.full_name ASC, d.name ASC
    `,
    [listingId, removedDocumentIds]
  )

  return rows
}

const removeClientDocumentsForListingRequirements = async (
  connectionOrDb,
  listingId,
  removedDocumentIds = []
) => {
  if (!removedDocumentIds.length) return { removedClientDocuments: 0 }

  const [result] = await connectionOrDb.query(
    `
    DELETE cdl
    FROM client_document_list cdl
    INNER JOIN client_units cu ON cu.id = cdl.client_unit_id
    WHERE cu.listing_id = ?
      AND cu.status IN ('reserved', 'active', 'fully_paid', 'closed')
      AND cdl.document_id IN (?)
    `,
    [listingId, removedDocumentIds]
  )

  return { removedClientDocuments: Number(result.affectedRows || 0) }
}

const listingFields = `
  l.id,
  l.project_id,
  p.name AS project_name,
  p.location AS project_location,
  p.location_code AS project_location_code,
  p.administrator AS project_administrator,
  l.cadastral_lot_no,
  l.unit_id,
  (
    SELECT GROUP_CONCAT(DISTINCT lua.alias_unit_id ORDER BY lua.id SEPARATOR ', ')
    FROM listing_unit_aliases lua
    WHERE lua.listing_id = l.id
  ) AS old_unit_ids,
  (
    SELECT GROUP_CONCAT(DISTINCT parent_listing.unit_id ORDER BY parent_listing.unit_id SEPARATOR ', ')
    FROM listing_unit_lineage lul
    INNER JOIN listings parent_listing ON parent_listing.id = lul.parent_listing_id
    WHERE lul.child_listing_id = l.id
  ) AS source_unit_ids,
  (
    SELECT GROUP_CONCAT(DISTINCT child_listing.unit_id ORDER BY child_listing.unit_id SEPARATOR ', ')
    FROM listing_unit_lineage lul
    INNER JOIN listings child_listing ON child_listing.id = lul.child_listing_id
    WHERE lul.parent_listing_id = l.id
  ) AS derived_unit_ids,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'old_unit_id', luh.old_unit_id,
        'new_unit_id', luh.new_unit_id,
        'reason', luh.reason,
        'effective_date', luh.effective_date,
        'remarks', luh.remarks,
        'created_at', luh.created_at
      )
    )
    FROM listing_unit_history luh
    WHERE luh.listing_id = l.id
  ) AS unit_history_json,
  l.lot_type,
  l.reservation_fee,
  l.price_per_sqm,
  l.lot_area_sqm,
  l.legal_misc_rate,
  COALESCE(l.annual_interest_rate, 0) AS annual_interest_rate,
  l.net_selling_price,
  l.legal_misc_fee,
  l.total_contract_price,
  l.status,
  EXISTS (
    SELECT 1
    FROM client_units cu
    WHERE cu.listing_id = l.id
      AND cu.status IN ('reserved', 'active', 'fully_paid')
    LIMIT 1
  ) AS has_active_client_unit,
  (
    SELECT COUNT(*)
    FROM listing_document_requirements ldr
    INNER JOIN documents d ON d.id = ldr.document_id
    WHERE ldr.listing_id = l.id
      AND ldr.status = 'active'
      AND d.status = 'active'
  ) AS document_count,
  (
    SELECT COUNT(*)
    FROM listing_document_requirements ldr
    INNER JOIN documents d ON d.id = ldr.document_id
    WHERE ldr.listing_id = l.id
      AND ldr.status = 'active'
      AND d.status = 'active'
      AND ldr.is_required = TRUE
  ) AS required_document_count,
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
        OR EXISTS (
          SELECT 1
          FROM listing_unit_aliases lua
          WHERE lua.listing_id = l.id
            AND lua.alias_unit_id LIKE ?
        )
        OR EXISTS (
          SELECT 1
          FROM listing_unit_lineage lul
          INNER JOIN listings parent_listing ON parent_listing.id = lul.parent_listing_id
          WHERE lul.child_listing_id = l.id
            AND parent_listing.unit_id LIKE ?
        )
        OR EXISTS (
          SELECT 1
          FROM listing_unit_lineage lul
          INNER JOIN listings child_listing ON child_listing.id = lul.child_listing_id
          WHERE lul.parent_listing_id = l.id
            AND child_listing.unit_id LIKE ?
        )
        OR l.lot_type LIKE ?
        OR l.status LIKE ?
      )
    `)

    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
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
    await ensureClientDocumentChecklistForClientUnit(db, clientUnit.id)

    const [paymentRows] = await db.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END), 0) AS total_paid,
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
        cm.gross_commission,
        cm.released_amount,
        cm.gross_commission - cm.released_amount AS remaining_amount,
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
        amount: formatDecimal(commissionRows[0].gross_commission),
        released_amount: formatDecimal(commissionRows[0].released_amount),
        remaining_amount: formatDecimal(commissionRows[0].remaining_amount),
        status: commissionRows[0].status
      }
    }

    const [documentRows] = await db.query(
      `
      SELECT
        COUNT(cdl.id) AS total_documents,
        SUM(CASE WHEN COALESCE(cdl.is_required, d.is_required) = TRUE THEN 1 ELSE 0 END) AS required_documents,
        SUM(CASE WHEN cdl.status IN ('submitted', 'approved') THEN 1 ELSE 0 END) AS submitted_documents,
        SUM(CASE WHEN cdl.status = 'approved' THEN 1 ELSE 0 END) AS approved_documents,
        SUM(
          CASE
            WHEN COALESCE(cdl.is_required, d.is_required) = TRUE
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

  const listingDocumentRequirements = await loadListingDocumentRequirements(db, id)

  if (!clientUnit) {
    const requiredDocuments = listingDocumentRequirements.filter((document) => Boolean(document.is_required)).length
    documentSummary = {
      total_documents: listingDocumentRequirements.length,
      required_documents: requiredDocuments,
      submitted_documents: 0,
      approved_documents: 0,
      missing_required_documents: requiredDocuments,
      document_status: listingDocumentRequirements.length > 0 ? 'not_reserved' : 'not_configured'
    }
  }

  const [unitHistoryRows] = await db.query(
    `
    SELECT
      luh.id,
      luh.old_unit_id,
      luh.new_unit_id,
      luh.reason,
      luh.effective_date,
      luh.changed_by,
      u.full_name AS changed_by_name,
      luh.remarks,
      luh.created_at
    FROM listing_unit_history luh
    LEFT JOIN users u ON u.id = luh.changed_by
    WHERE luh.listing_id = ?
    ORDER BY luh.effective_date DESC, luh.id DESC
    `,
    [id]
  )

  return res.status(200).json({
    listing: mappedListing,
    unitHistory: unitHistoryRows,
    clientUnit,
    paymentSummary,
    commissionSummary,
    documentSummary,
    listingDocumentRequirements,
    documentRequirements: listingDocumentRequirements
  })
}

export const createListing = async (req, res) => {
  const {
    project_id,
    cadastral_lot_no,
    unit_id,
    old_unit_ids = '',
    lot_type,
    reservation_fee = 50000,
    price_per_sqm = 0,
    lot_area_sqm = 0,
    legal_misc_rate = 10,
    annual_interest_rate = 0,
    status = 'available',
    document_requirements,
    documentRequirements
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project is required'
    })
  }

  const finalUnitId = cleanUnitId(unit_id)

  if (!finalUnitId) {
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

  const duplicateListing = await findDuplicateListing(db, {
    projectId: project_id,
    unitId: finalUnitId,
  })

  if (duplicateListing) {
    return res.status(409).json({
      message: getUnitIdentityConflictMessage(duplicateListing, finalUnitId),
      code: duplicateListing.conflict_type === 'current_listing'
        ? 'DUPLICATE_LISTING'
        : 'RESERVED_UNIT_IDENTITY',
      duplicateListingId: duplicateListing.listing_id || duplicateListing.id,
      conflictType: duplicateListing.conflict_type,
    })
  }

  const finalStatus = normalizeListingStatus(status)

  const computedAmounts = computeListingAmounts({
    lot_area_sqm,
    price_per_sqm,
    legal_misc_rate,
    reservation_fee
  })

  const connection = await db.getConnection()
  let listingId = null
  let documentSync = { insertedCount: 0 }

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
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
        annual_interest_rate,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project_id,
        nullableValue(cadastral_lot_no),
        finalUnitId,
        nullableValue(lot_type),
        numberValue(reservation_fee),
        numberValue(price_per_sqm),
        numberValue(lot_area_sqm),
        numberValue(legal_misc_rate),
        numberValue(annual_interest_rate),
        finalStatus
      ]
    )

    listingId = result.insertId
    await syncListingUnitAliases(connection, listingId, old_unit_ids)

    const suppliedDocumentRequirements =
      Array.isArray(document_requirements) || Array.isArray(documentRequirements)
        ? document_requirements || documentRequirements || []
        : null

    if (suppliedDocumentRequirements) {
      documentSync = await replaceListingDocumentRequirements(
        connection,
        listingId,
        suppliedDocumentRequirements,
        'listing_override'
      )
    } else {
      documentSync = await copyProjectRequirementsToListing(connection, listingId, project_id, { overwrite: true })
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()

    if (isDuplicateListingError(error)) {
      return res.status(409).json({
        message: getDuplicateListingMessage({ unitId: finalUnitId }),
        code: 'DUPLICATE_LISTING',
      })
    }

    throw error
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Listings',
    description: `Created listing ${finalUnitId}${formatOldUnitIdsForAudit(old_unit_ids)}`,
    ipAddress: getClientIp(req)
  })

  return res.status(201).json({
    message: 'Listing created successfully',
    listingId,
    documentSync,
    pricing: {
      net_selling_price: computedAmounts.netSellingPrice,
      legal_misc_fee: computedAmounts.legalMiscFee,
      total_contract_price: computedAmounts.totalContractPrice
    }
  })
}

export const updateListing = async (req, res) => {
  const { id } = req.params

  const {
    project_id,
    cadastral_lot_no,
    unit_id,
    old_unit_ids = '',
    lot_type,
    reservation_fee = 50000,
    price_per_sqm = 0,
    lot_area_sqm = 0,
    legal_misc_rate = 10,
    annual_interest_rate = 0,
    status = 'available',
    document_requirements,
    documentRequirements
  } = req.body

  if (isMissing(project_id)) {
    return res.status(400).json({
      message: 'Project is required'
    })
  }

  const finalUnitId = cleanUnitId(unit_id)

  if (!finalUnitId) {
    return res.status(400).json({
      message: 'Unit ID is required'
    })
  }

  const finalStatus = normalizeListingStatus(status)

  const computedAmounts = computeListingAmounts({
    lot_area_sqm,
    price_per_sqm,
    legal_misc_rate,
    reservation_fee
  })

  const connection = await db.getConnection()
  let balanceSummaries = []

  try {
    await connection.beginTransaction()

    const [existingListingRows] = await connection.query(
      `SELECT id, unit_id, status FROM listings WHERE id = ? LIMIT 1`,
      [id]
    )

    const existingListing = existingListingRows[0]

    if (!existingListing) {
      await connection.rollback()

      return res.status(404).json({
        message: 'Listing not found'
      })
    }

    const duplicateListing = await findDuplicateListing(connection, {
      projectId: project_id,
      unitId: finalUnitId,
      excludeListingId: id,
    })

    if (duplicateListing) {
      await connection.rollback()

      return res.status(409).json({
        message: getUnitIdentityConflictMessage(duplicateListing, finalUnitId),
        code: duplicateListing.conflict_type === 'current_listing'
          ? 'DUPLICATE_LISTING'
          : 'RESERVED_UNIT_IDENTITY',
        duplicateListingId: duplicateListing.listing_id || duplicateListing.id,
        conflictType: duplicateListing.conflict_type,
      })
    }

    const mergedOldUnitIds = [
      ...normalizeUnitAliasList(old_unit_ids),
      ...(existingListing.unit_id && existingListing.unit_id !== finalUnitId
        ? [existingListing.unit_id]
        : []),
    ]

    const [result] = await connection.query(
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
        annual_interest_rate = ?,
        status = ?
      WHERE id = ?
      `,
      [
        project_id,
        nullableValue(cadastral_lot_no),
        finalUnitId,
        nullableValue(lot_type),
        numberValue(reservation_fee),
        numberValue(price_per_sqm),
        numberValue(lot_area_sqm),
        numberValue(legal_misc_rate),
        numberValue(annual_interest_rate),
        finalStatus,
        id
      ]
    )

    if (result.affectedRows === 0) {
      await connection.rollback()

      return res.status(404).json({
        message: 'Listing not found'
      })
    }

    if (existingListing.unit_id !== finalUnitId) {
      await insertListingUnitHistory(connection, {
        listingId: id,
        oldUnitId: existingListing.unit_id,
        newUnitId: finalUnitId,
        reason: 'admin_correction',
        changedBy: req.user.id,
        remarks: 'Unit ID changed from listing edit form',
      })
    }

    await syncListingUnitAliases(connection, id, mergedOldUnitIds)

    balanceSummaries = await recomputeListingClientUnitBalances(connection, id, {
      actorRole: req.user.role,
    })

    await connection.commit()
  } catch (error) {
    await connection.rollback()

    if (isDuplicateListingError(error)) {
      return res.status(409).json({
        message: getDuplicateListingMessage({ unitId: finalUnitId }),
        code: 'DUPLICATE_LISTING',
      })
    }

    throw error
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Listings',
    description: `Updated listing ${finalUnitId}${formatOldUnitIdsForAudit(old_unit_ids)}`,
    ipAddress: getClientIp(req)
  })

  return res.status(200).json({
    message: 'Listing updated successfully',
    pricing: {
      net_selling_price: computedAmounts.netSellingPrice,
      legal_misc_fee: computedAmounts.legalMiscFee,
      total_contract_price: computedAmounts.totalContractPrice
    },
    balanceSummaries
  })
}



export const getListingDocumentRequirements = async (req, res) => {
  const { id } = req.params

  const [listingRows] = await db.query(
    `SELECT id, project_id FROM listings WHERE id = ? LIMIT 1`,
    [id]
  )

  if (!listingRows[0]) {
    return res.status(404).json({ message: 'Listing not found' })
  }

  const requirements = await loadListingDocumentRequirements(db, id)

  return res.status(200).json({
    message: 'Listing document requirements fetched successfully',
    requirements,
    documentRequirements: requirements,
    data: requirements
  })
}

export const updateListingDocumentRequirements = async (req, res) => {
  const { id } = req.params
  const {
    document_requirements,
    documentRequirements,
    confirm_remove_used_documents = false,
  } = req.body

  const requirements = normalizeDocumentRequirementsPayload(
    document_requirements || documentRequirements || []
  )

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [listingRows] = await connection.query(
      `SELECT id, unit_id FROM listings WHERE id = ? LIMIT 1`,
      [id]
    )

    const listing = listingRows[0]

    if (!listing) {
      await connection.rollback()
      return res.status(404).json({ message: 'Listing not found' })
    }

    const [currentRequirementRows] = await connection.query(
      `
      SELECT document_id
      FROM listing_document_requirements
      WHERE listing_id = ?
        AND status = 'active'
      `,
      [id]
    )

    const nextActiveDocumentIds = new Set(
      requirements
        .filter((requirement) => requirement.status === 'active')
        .map((requirement) => Number(requirement.document_id))
    )

    const removedDocumentIds = currentRequirementRows
      .map((row) => Number(row.document_id))
      .filter((documentId) => !nextActiveDocumentIds.has(documentId))

    const riskyDocuments = await getRiskyClientDocumentsForListingRemoval(
      connection,
      id,
      removedDocumentIds
    )

    if (riskyDocuments.length > 0 && !confirm_remove_used_documents) {
      await connection.rollback()
      return res.status(409).json({
        message:
          'Some removed documents already have submitted status or uploaded files in existing client checklists. Confirm removal to remove/unlink those checklist files.',
        requiresConfirmation: true,
        riskyDocuments,
      })
    }

    const removeSummary = await removeClientDocumentsForListingRequirements(
      connection,
      id,
      removedDocumentIds
    )

    const result = await replaceListingDocumentRequirements(
      connection,
      id,
      requirements,
      'listing_override'
    )

    const syncSummary = await syncClientUnitChecklistsFromListingRequirements(
      connection,
      id,
      requirements,
      { actorRole: req.user.role }
    )

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Listing Documents',
      description: `Updated listing document requirements for ${listing.unit_id}`,
      ipAddress: getClientIp(req)
    })

    return res.status(200).json({
      message: 'Listing document requirements updated successfully',
      data: {
        ...result,
        ...removeSummary,
        ...syncSummary,
      }
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const resetListingDocumentRequirements = async (req, res) => {
  const { id } = req.params

  const [listingRows] = await db.query(
    `SELECT id, unit_id, project_id FROM listings WHERE id = ? LIMIT 1`,
    [id]
  )

  const listing = listingRows[0]

  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' })
  }

  const connection = await db.getConnection()
  let result = null
  let syncSummary = null

  try {
    await connection.beginTransaction()

    result = await copyProjectRequirementsToListing(connection, id, listing.project_id, { overwrite: true })
    const requirements = await loadListingDocumentRequirements(connection, id)
    syncSummary = await syncClientUnitChecklistsFromListingRequirements(
      connection,
      id,
      requirements,
      { actorRole: req.user.role }
    )

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'reset',
    module: 'Listing Documents',
    description: `Reset listing documents for ${listing.unit_id} to project defaults`,
    ipAddress: getClientIp(req)
  })

  return res.status(200).json({
    message: 'Listing document requirements reset to project defaults',
    data: {
      ...result,
      ...syncSummary,
    }
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

  if (['reserved', 'sold', 'pending_cancellation', 'cancelled'].includes(listing.status)) {
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

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Listings',
    description: `Deleted listing ${listing.unit_id}`,
    ipAddress: getClientIp(req)
  })

  return res.status(200).json({ message: 'Listing deleted successfully' })
}

