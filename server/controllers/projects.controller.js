import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import {
  getProjectDocumentRequirements as loadProjectDocumentRequirements,
  replaceProjectDocumentRequirements,
  getDocumentTemplateItems,
} from '../utils/documentRequirements.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  return isMissing(value) ? null : value
}

const normalizeLocationCode = (value) => {
  if (isMissing(value)) return ''
  return String(value).trim().toUpperCase()
}

const validateLocationCode = (value) => {
  const locationCode = normalizeLocationCode(value)

  if (locationCode.length === 0) {
    return {
      isValid: false,
      message: 'Location code is required',
      value: locationCode,
    }
  }

  if (locationCode.length > 10) {
    return {
      isValid: false,
      message: 'Location code must be 1 to 10 characters',
      value: locationCode,
    }
  }

  return {
    isValid: true,
    message: null,
    value: locationCode,
  }
}

const normalizeCadastralLots = (value) => {
  const rawLots = Array.isArray(value)
    ? value
    : String(value || '')
        .split(/[,\n]/)

  return Array.from(
    new Set(
      rawLots
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  )
}

const normalizeProjectRow = (project) => {
  if (!project) return project

  const cadastralLots = normalizeCadastralLots(
    project.cadastral_lot_numbers || project.cadastral_lots || ''
  )

  return {
    ...project,
    cadastral_lots: cadastralLots,
    cadastralLots,
    cadastral_lot_count: cadastralLots.length,
  }
}

const replaceProjectCadastralLots = async (connection, projectId, lots = []) => {
  const cadastralLots = normalizeCadastralLots(lots)

  await connection.query(
    `UPDATE project_cadastral_lots SET status = 'inactive' WHERE project_id = ?`,
    [projectId]
  )

  for (const lotNo of cadastralLots) {
    await connection.query(
      `
      INSERT INTO project_cadastral_lots (project_id, cadastral_lot_no, status)
      VALUES (?, ?, 'active')
      ON DUPLICATE KEY UPDATE
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      `,
      [projectId, lotNo]
    )
  }

  return cadastralLots
}

const projectSelectFields = `
  p.id,
  p.name,
  p.location,
  p.location_code,
  p.administrator,
  p.tax_declaration_no,
  p.pin,
  p.status,
  p.document_template_id,
  template.name AS document_template_name,
  p.ended_at,
  COALESCE(cadastral_summary.cadastral_lot_numbers, '') AS cadastral_lot_numbers,
  COALESCE(cadastral_summary.cadastral_lot_count, 0) AS cadastral_lot_count,
  COALESCE(document_summary.document_count, 0) AS document_count,
  COALESCE(document_summary.required_count, 0) AS required_document_count,
  p.created_at,
  p.updated_at
`

const hydrateProjectRequirements = async (project) => {
  if (!project) return null

  const documentRequirements = await loadProjectDocumentRequirements(db, project.id)

  return {
    ...normalizeProjectRow(project),
    document_requirements: documentRequirements,
    documentRequirements,
  }
}

export const getProjects = async (req, res) => {
  const [projects] = await db.query(
    `
    SELECT
      ${projectSelectFields}
    FROM projects p
    LEFT JOIN document_templates template ON template.id = p.document_template_id
    LEFT JOIN (
      SELECT
        project_id,
        GROUP_CONCAT(cadastral_lot_no ORDER BY cadastral_lot_no SEPARATOR ',') AS cadastral_lot_numbers,
        COUNT(*) AS cadastral_lot_count
      FROM project_cadastral_lots
      WHERE status = 'active'
      GROUP BY project_id
    ) cadastral_summary ON cadastral_summary.project_id = p.id
    LEFT JOIN (
      SELECT
        project_id,
        COUNT(*) AS document_count,
        SUM(CASE WHEN is_required = TRUE THEN 1 ELSE 0 END) AS required_count
      FROM project_document_requirements
      WHERE status = 'active'
      GROUP BY project_id
    ) document_summary ON document_summary.project_id = p.id
    ORDER BY p.id DESC
    `
  )

  res.status(200).json({
    projects: projects.map(normalizeProjectRow),
  })
}

export const getProject = async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    `
    SELECT
      ${projectSelectFields}
    FROM projects p
    LEFT JOIN document_templates template ON template.id = p.document_template_id
    LEFT JOIN (
      SELECT
        project_id,
        GROUP_CONCAT(cadastral_lot_no ORDER BY cadastral_lot_no SEPARATOR ',') AS cadastral_lot_numbers,
        COUNT(*) AS cadastral_lot_count
      FROM project_cadastral_lots
      WHERE status = 'active'
      GROUP BY project_id
    ) cadastral_summary ON cadastral_summary.project_id = p.id
    LEFT JOIN (
      SELECT
        project_id,
        COUNT(*) AS document_count,
        SUM(CASE WHEN is_required = TRUE THEN 1 ELSE 0 END) AS required_count
      FROM project_document_requirements
      WHERE status = 'active'
      GROUP BY project_id
    ) document_summary ON document_summary.project_id = p.id
    WHERE p.id = ?
    LIMIT 1
    `,
    [id]
  )

  const project = rows[0]

  if (!project) {
    return res.status(404).json({
      message: 'Project not found',
    })
  }

  res.status(200).json({
    project: await hydrateProjectRequirements(project),
  })
}

export const getProjectDocumentRequirements = async (req, res) => {
  const { id } = req.params

  const [projectRows] = await db.query(
    `SELECT id FROM projects WHERE id = ? LIMIT 1`,
    [id]
  )

  if (!projectRows[0]) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const requirements = await loadProjectDocumentRequirements(db, id)

  res.status(200).json({
    message: 'Project document requirements fetched successfully',
    requirements,
    documentRequirements: requirements,
    data: requirements,
  })
}

export const updateProjectDocumentRequirements = async (req, res) => {
  const { id } = req.params
  const { document_requirements, documentRequirements } = req.body

  const [projectRows] = await db.query(
    `SELECT id, name FROM projects WHERE id = ? LIMIT 1`,
    [id]
  )

  const project = projectRows[0]

  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const requirements = document_requirements || documentRequirements || []
  const result = await replaceProjectDocumentRequirements(db, id, requirements)

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Project Documents',
    description: `Updated default documents for project ${project.name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Project document requirements updated successfully',
    data: result,
  })
}

export const createProject = async (req, res) => {
  const {
    name,
    location,
    location_code,
    administrator,
    tax_declaration_no,
    pin,
    status,
    document_template_id,
    document_requirements,
    documentRequirements,
    cadastral_lots,
    cadastralLots,
    cadastral_lot_numbers,
  } = req.body

  if (!name) {
    return res.status(400).json({
      message: 'Project name is required',
    })
  }

  const locationCodeValidation = validateLocationCode(location_code)

  if (!locationCodeValidation.isValid) {
    return res.status(400).json({
      message: locationCodeValidation.message,
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      INSERT INTO projects (
        name,
        location,
        location_code,
        administrator,
        tax_declaration_no,
        pin,
        status,
        document_template_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        location || null,
        locationCodeValidation.value,
        administrator || null,
        tax_declaration_no || null,
        pin || null,
        status || 'active',
        nullableValue(document_template_id),
      ]
    )

    const projectId = result.insertId

    await replaceProjectCadastralLots(
      connection,
      projectId,
      cadastral_lots || cadastralLots || cadastral_lot_numbers || []
    )

    let requirements = document_requirements || documentRequirements || []

    if ((!Array.isArray(requirements) || requirements.length === 0) && !isMissing(document_template_id)) {
      requirements = await getDocumentTemplateItems(connection, document_template_id)
    }

    if (Array.isArray(requirements) && requirements.length > 0) {
      await replaceProjectDocumentRequirements(connection, projectId, requirements)
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Projects',
      description: `Created project ${name}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: 'Project created successfully',
      projectId,
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateProject = async (req, res) => {
  const { id } = req.params

  const {
    name,
    location,
    location_code,
    administrator,
    tax_declaration_no,
    pin,
    status,
    document_template_id,
    ended_at,
    document_requirements,
    documentRequirements,
    cadastral_lots,
    cadastralLots,
    cadastral_lot_numbers,
  } = req.body

  if (!name) {
    return res.status(400).json({
      message: 'Project name is required',
    })
  }

  const [existingRows] = await db.query(
    `
    SELECT id, location_code
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const existingProject = existingRows[0]

  if (!existingProject) {
    return res.status(404).json({
      message: 'Project not found',
    })
  }

  const hasLocationCode = Object.prototype.hasOwnProperty.call(
    req.body,
    'location_code'
  )

  let finalLocationCode = existingProject.location_code || ''

  if (hasLocationCode) {
    const locationCodeValidation = validateLocationCode(location_code)

    if (!locationCodeValidation.isValid) {
      return res.status(400).json({
        message: locationCodeValidation.message,
      })
    }

    finalLocationCode = locationCodeValidation.value
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      UPDATE projects
      SET
        name = ?,
        location = ?,
        location_code = ?,
        administrator = ?,
        tax_declaration_no = ?,
        pin = ?,
        status = ?,
        document_template_id = ?,
        ended_at = ?
      WHERE id = ?
      `,
      [
        name,
        location || null,
        finalLocationCode,
        administrator || null,
        tax_declaration_no || null,
        pin || null,
        status || 'active',
        nullableValue(document_template_id),
        ended_at || null,
        id,
      ]
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    const hasCadastralLots =
      Object.prototype.hasOwnProperty.call(req.body, 'cadastral_lots') ||
      Object.prototype.hasOwnProperty.call(req.body, 'cadastralLots') ||
      Object.prototype.hasOwnProperty.call(req.body, 'cadastral_lot_numbers')

    if (hasCadastralLots) {
      await replaceProjectCadastralLots(
        connection,
        id,
        cadastral_lots || cadastralLots || cadastral_lot_numbers || []
      )
    }

    const hasRequirements =
      Array.isArray(document_requirements) || Array.isArray(documentRequirements)

    if (hasRequirements) {
      await replaceProjectDocumentRequirements(
        connection,
        id,
        document_requirements || documentRequirements || []
      )
    } else if (!isMissing(document_template_id)) {
      const templateRequirements = await getDocumentTemplateItems(connection, document_template_id)
      if (templateRequirements.length > 0) {
        await replaceProjectDocumentRequirements(connection, id, templateRequirements)
      }
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Projects',
      description: `Updated project ${name}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({
      message: 'Project updated successfully',
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const deleteProject = async (req, res) => {
  const { id } = req.params

  const [projectRows] = await db.query(
    `SELECT id, name FROM projects WHERE id = ? LIMIT 1`,
    [id]
  )

  const project = projectRows[0]

  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const [listingRows] = await db.query(
    `SELECT id FROM listings WHERE project_id = ? LIMIT 1`,
    [id]
  )

  if (listingRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a project that has listings. Remove all listings first.',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()
    await connection.query(`DELETE FROM project_document_requirements WHERE project_id = ?`, [id])
    await connection.query(`DELETE FROM projects WHERE id = ?`, [id])
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Projects',
    description: `Deleted project ${project.name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'Project deleted successfully' })
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase())
}

const computeAmortization = (principal, annualInterestRate, years) => {
  const safePrincipal = Math.max(toNumber(principal), 0)
  const safeYears = Math.max(toNumber(years), 0)
  const months = Math.round(safeYears * 12)

  if (safePrincipal <= 0 || months <= 0) return 0

  const monthlyRate = toNumber(annualInterestRate) / 100 / 12

  if (monthlyRate <= 0) {
    return safePrincipal / months
  }

  const factor = Math.pow(1 + monthlyRate, months)
  return (safePrincipal * monthlyRate * factor) / (factor - 1)
}

const getDiscountAmount = ({ sellingPrice, discountType, discountValue }) => {
  const amount = Math.max(toNumber(discountValue), 0)

  if (discountType === 'fixed') {
    return Math.min(amount, sellingPrice)
  }

  if (discountType === 'none') {
    return 0
  }

  return Math.min(sellingPrice * (amount / 100), sellingPrice)
}

export const getProjectPriceList = async (req, res) => {
  const { id } = req.params

  const [projectRows] = await db.query(
    `
    SELECT
      id,
      name,
      location,
      location_code,
      administrator,
      tax_declaration_no,
      pin,
      status
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  )

  const project = projectRows[0]

  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const title = String(
    req.query.title || `${project.name}: ${toNumber(req.query.downpayment_percent, 15)}% DOWNPAYMENT`
  ).trim()
  const effectiveDate = String(req.query.effective_date || '').trim() || null
  const downpaymentPercent = Math.max(toNumber(req.query.downpayment_percent, 15), 0)
  const payableTerms = Math.max(Math.round(toNumber(req.query.payable_terms, 6)), 1)
  const interestRate = Math.max(toNumber(req.query.interest_rate, 0), 0)
  const termYearsA = Math.max(toNumber(req.query.term_years_a, 3), 0)
  const termYearsB = Math.max(toNumber(req.query.term_years_b, 5), 0)
  const reservationFeeOverride = req.query.reservation_fee === undefined || req.query.reservation_fee === ''
    ? null
    : Math.max(toNumber(req.query.reservation_fee), 0)
  const discountType = ['none', 'fixed', 'percent'].includes(String(req.query.discount_type || 'percent'))
    ? String(req.query.discount_type || 'percent')
    : 'percent'
  const discountValue = Math.max(toNumber(req.query.discount_value, 0), 0)

  const includeStatuses = []
  if (toBoolean(req.query.include_available, true)) includeStatuses.push('available')
  if (toBoolean(req.query.include_reserved, true)) includeStatuses.push('reserved')
  if (toBoolean(req.query.include_sold, false)) includeStatuses.push('sold')
  if (toBoolean(req.query.include_pending_cancellation, false)) includeStatuses.push('pending_cancellation')

  if (includeStatuses.length === 0) {
    return res.status(400).json({
      message: 'Select at least one listing status to include in the price list.',
    })
  }

  const placeholders = includeStatuses.map(() => '?').join(',')
  const [listings] = await db.query(
    `
    SELECT
      id,
      unit_id,
      block_no,
      lot_no,
      orientation,
      cadastral_lot_no,
      lot_type,
      lot_area_sqm,
      price_per_sqm,
      net_selling_price,
      reservation_fee,
      legal_misc_rate,
      legal_misc_fee,
      total_contract_price,
      status
    FROM listings
    WHERE project_id = ?
      AND status IN (${placeholders})
    ORDER BY
      CAST(NULLIF(block_no, '') AS UNSIGNED),
      block_no,
      CAST(NULLIF(lot_no, '') AS UNSIGNED),
      lot_no,
      unit_id
    `,
    [id, ...includeStatuses]
  )

  const rows = listings.map((listing, index) => {
    const area = toNumber(listing.lot_area_sqm)
    const pricePerSqm = toNumber(listing.price_per_sqm)
    const sellingPrice = toNumber(listing.net_selling_price, area * pricePerSqm)
    const discount = getDiscountAmount({
      sellingPrice,
      discountType,
      discountValue,
    })
    const totalContractPrice = Math.max(sellingPrice - discount, 0)
    const downpayment = totalContractPrice * (downpaymentPercent / 100)
    const reservationFee = reservationFeeOverride ?? toNumber(listing.reservation_fee)
    const netDownpayment = Math.max(downpayment - reservationFee, 0)
    const monthlyDownpayment = netDownpayment / payableTerms
    const balance = Math.max(totalContractPrice - downpayment, 0)
    const monthlyTermA = computeAmortization(balance, interestRate, termYearsA)
    const monthlyTermB = computeAmortization(balance, interestRate, termYearsB)

    return {
      no: index + 1,
      listing_id: listing.id,
      unit_id: listing.unit_id,
      block_no: listing.block_no || '',
      lot_no: listing.lot_no || '',
      area,
      orientation: listing.orientation || listing.lot_type || '',
      cadastral_lot_no: listing.cadastral_lot_no || '',
      price_per_sqm: pricePerSqm,
      selling_price: sellingPrice,
      discount,
      total_contract_price: totalContractPrice,
      downpayment_percent: downpaymentPercent,
      downpayment,
      reservation_fee: reservationFee,
      net_downpayment: netDownpayment,
      payable_terms: payableTerms,
      monthly_dp: monthlyDownpayment,
      balance,
      interest_rate: interestRate,
      term_years_a: termYearsA,
      monthly_term_a: monthlyTermA,
      term_years_b: termYearsB,
      monthly_term_b: monthlyTermB,
      status: listing.status,
    }
  })

  res.status(200).json({
    project,
    title,
    effective_date: effectiveDate,
    settings: {
      downpayment_percent: downpaymentPercent,
      reservation_fee_override: reservationFeeOverride,
      payable_terms: payableTerms,
      interest_rate: interestRate,
      term_years_a: termYearsA,
      term_years_b: termYearsB,
      discount_type: discountType,
      discount_value: discountValue,
      included_statuses: includeStatuses,
    },
    rows,
  })
}


