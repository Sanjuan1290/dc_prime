import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { buildHierarchyCommissionPreview } from './commissions.controller.js'

const allowedStatuses = ['active', 'inactive']
const sellerRoles = ['broker_network_manager', 'broker', 'manager', 'agent']
const flexibleRolloverPolicy = 'custom_sale_type_splits'

const isMissing = (value) => value === undefined || value === null || value === ''
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value)

const normalizeRate = (value) => {
  if (isMissing(value)) return 0
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Number(parsed.toFixed(2))
}

const validateRate = (rate, label) => {
  if (rate === null) return `${label} must be a number`
  if (rate < 0 || rate > 100) return `${label} must be between 0 and 100`
  return null
}

const roleLabels = {
  broker_network_manager: 'BNM',
  broker: 'Broker',
  manager: 'Manager',
  agent: 'Agent',
}

const splitSections = {
  agent_sale_split: ['broker_network_manager', 'broker', 'manager', 'agent'],
  manager_sale_split: ['broker_network_manager', 'broker', 'manager'],
  broker_sale_split: ['broker_network_manager', 'broker'],
  bnm_sale_split: ['broker_network_manager'],
}

const parseJsonMaybe = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

const normalizeSplit = (value, roles, fallback = {}) => {
  const parsed = parseJsonMaybe(value) || {}
  return roles.reduce((split, role) => {
    split[role] = normalizeRate(parsed[role] ?? fallback[role] ?? 0) ?? 0
    return split
  }, {})
}

const getDefaultSplitsFromSlots = ({ closing_seller_rate, bnm_override_rate, broker_override_rate, manager_override_rate, pool_rate }) => ({
  agent_sale_split: {
    broker_network_manager: bnm_override_rate,
    broker: broker_override_rate,
    manager: manager_override_rate,
    agent: closing_seller_rate,
  },
  manager_sale_split: {
    broker_network_manager: bnm_override_rate,
    broker: normalizeRate(broker_override_rate + manager_override_rate),
    manager: closing_seller_rate,
  },
  broker_sale_split: {
    broker_network_manager: normalizeRate(bnm_override_rate + broker_override_rate + manager_override_rate),
    broker: closing_seller_rate,
  },
  bnm_sale_split: {
    broker_network_manager: normalizeRate(pool_rate || (closing_seller_rate + bnm_override_rate + broker_override_rate + manager_override_rate)),
  },
})

const getSplitTotal = (split = {}) => normalizeRate(
  Object.values(split).reduce((sum, value) => sum + Number(value || 0), 0)
)

const getPlanFromBody = (body = {}, existing = {}) => {
  const poolRate = normalizeRate(body.pool_rate ?? body.poolRate ?? existing.pool_rate ?? 0) ?? 0
  const closingSellerRate = normalizeRate(
    body.closing_seller_rate ?? body.closingSellerRate ?? body.closing_rate ?? body.closingRate ?? existing.closing_seller_rate ?? 0
  ) ?? 0
  const bnmOverrideRate = normalizeRate(
    body.bnm_override_rate ?? body.bnmOverrideRate ?? body.broker_network_manager_override_rate ?? existing.bnm_override_rate ?? 0
  ) ?? 0
  const brokerOverrideRate = normalizeRate(
    body.broker_override_rate ?? body.brokerOverrideRate ?? existing.broker_override_rate ?? 0
  ) ?? 0
  const managerOverrideRate = normalizeRate(
    body.manager_override_rate ?? body.managerOverrideRate ?? existing.manager_override_rate ?? 0
  ) ?? 0

  const fallbackSplits = getDefaultSplitsFromSlots({
    closing_seller_rate: closingSellerRate,
    bnm_override_rate: bnmOverrideRate,
    broker_override_rate: brokerOverrideRate,
    manager_override_rate: managerOverrideRate,
    pool_rate: poolRate,
  })

  const agentSaleSplit = normalizeSplit(
    body.agent_sale_split ?? body.agent_sale_split_json ?? body.agentSaleSplit ?? existing.agent_sale_split_json,
    splitSections.agent_sale_split,
    fallbackSplits.agent_sale_split
  )
  const managerSaleSplit = normalizeSplit(
    body.manager_sale_split ?? body.manager_sale_split_json ?? body.managerSaleSplit ?? existing.manager_sale_split_json,
    splitSections.manager_sale_split,
    fallbackSplits.manager_sale_split
  )
  const brokerSaleSplit = normalizeSplit(
    body.broker_sale_split ?? body.broker_sale_split_json ?? body.brokerSaleSplit ?? existing.broker_sale_split_json,
    splitSections.broker_sale_split,
    fallbackSplits.broker_sale_split
  )
  const bnmSaleSplit = normalizeSplit(
    body.bnm_sale_split ?? body.bnm_sale_split_json ?? body.bnmSaleSplit ?? existing.bnm_sale_split_json,
    splitSections.bnm_sale_split,
    fallbackSplits.bnm_sale_split
  )

  return {
    pool_rate: poolRate,
    closing_seller_rate: normalizeRate(agentSaleSplit.agent ?? closingSellerRate),
    bnm_override_rate: normalizeRate(agentSaleSplit.broker_network_manager ?? bnmOverrideRate),
    broker_override_rate: normalizeRate(agentSaleSplit.broker ?? brokerOverrideRate),
    manager_override_rate: normalizeRate(agentSaleSplit.manager ?? managerOverrideRate),
    agent_sale_split: agentSaleSplit,
    manager_sale_split: managerSaleSplit,
    broker_sale_split: brokerSaleSplit,
    bnm_sale_split: bnmSaleSplit,
    agent_sale_split_json: JSON.stringify(agentSaleSplit),
    manager_sale_split_json: JSON.stringify(managerSaleSplit),
    broker_sale_split_json: JSON.stringify(brokerSaleSplit),
    bnm_sale_split_json: JSON.stringify(bnmSaleSplit),
    rollover_policy: flexibleRolloverPolicy,
  }
}

const getDistributionFromPlan = (plan = {}) => {
  const rows = [
    ['broker_network_manager', plan.bnm_sale_split?.broker_network_manager ?? 0, 'Editable rate for BNM personal sale.'],
    ['broker', plan.broker_sale_split?.broker ?? 0, 'Editable broker personal sale rate.'],
    ['manager', plan.manager_sale_split?.manager ?? 0, 'Editable manager personal sale rate.'],
    ['agent', plan.agent_sale_split?.agent ?? 0, 'Editable agent personal sale rate.'],
  ]

  return rows.map(([seller_role, rate, remarks]) => ({
    seller_role,
    requested_rate: normalizeRate(rate),
    approved_rate: normalizeRate(rate),
    remarks,
  }))
}

const validateGroupHeadSeller = async (groupHeadSellerId) => {
  if (!groupHeadSellerId) return null

  const [rows] = await db.query(
    `SELECT id, seller_role, status FROM accredited_sellers WHERE id = ? LIMIT 1`,
    [groupHeadSellerId]
  )

  const seller = rows[0]
  if (!seller) return 'Selected group head does not exist'
  if (!['broker_network_manager', 'broker'].includes(String(seller.seller_role))) {
    return 'Group head must be a BNM or Broker'
  }
  if (seller.status !== 'active') return 'Selected group head must be active'

  return null
}

const validateGroupPayload = ({ groupName, poolRate, status, plan }) => {
  if (isMissing(groupName)) return 'Group name is required'
  if (!allowedStatuses.includes(status)) return 'Invalid group status'

  const poolError = validateRate(poolRate, 'Pool rate')
  if (poolError) return poolError

  const splitValidations = [
    ['Agent sale', plan.agent_sale_split, splitSections.agent_sale_split],
    ['Manager sale', plan.manager_sale_split, splitSections.manager_sale_split],
    ['Broker sale', plan.broker_sale_split, splitSections.broker_sale_split],
    ['BNM sale', plan.bnm_sale_split, splitSections.bnm_sale_split],
  ]

  for (const [label, split, roles] of splitValidations) {
    for (const role of roles) {
      const error = validateRate(split[role], `${label} ${roleLabels[role] || role} rate`)
      if (error) return error
    }

    const total = getSplitTotal(split)
    if (total > Number(poolRate || 0)) {
      return `${label} total (${total.toFixed(2)}%) cannot exceed the group pool rate (${Number(poolRate || 0).toFixed(2)}%)`
    }
  }

  return null
}

const upsertDistribution = async ({ connection, sellerGroupId, distribution, userId }) => {
  for (const row of distribution) {
    await connection.query(
      `
      INSERT INTO seller_group_rate_distributions (
        seller_group_id,
        seller_role,
        requested_rate,
        approved_rate,
        status,
        remarks,
        updated_by
      ) VALUES (?, ?, ?, ?, 'approved', ?, ?)
      ON DUPLICATE KEY UPDATE
        requested_rate = VALUES(requested_rate),
        approved_rate = VALUES(approved_rate),
        status = 'approved',
        remarks = VALUES(remarks),
        updated_by = VALUES(updated_by),
        updated_at = NOW()
      `,
      [sellerGroupId, row.seller_role, row.requested_rate, row.approved_rate, row.remarks, userId]
    )
  }
}

const applyGroupRatesToMembers = async ({ connection, sellerGroupId, userId }) => {
  await connection.query(
    `
    UPDATE accredited_sellers seller
    INNER JOIN seller_groups sg ON sg.id = seller.seller_group_id
    SET
      seller.commission_rate = CASE
        WHEN seller.seller_role = 'broker_network_manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.bnm_sale_split_json, '$.broker_network_manager')) AS DECIMAL(5,2)), sg.pool_rate)
        WHEN seller.seller_role = 'broker' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.broker_sale_split_json, '$.broker')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        WHEN seller.seller_role = 'manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.manager_sale_split_json, '$.manager')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        WHEN seller.seller_role = 'agent' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.agent')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        ELSE sg.closing_seller_rate
      END,
      seller.personal_commission_rate = CASE
        WHEN seller.seller_role = 'broker_network_manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.bnm_sale_split_json, '$.broker_network_manager')) AS DECIMAL(5,2)), sg.pool_rate)
        WHEN seller.seller_role = 'broker' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.broker_sale_split_json, '$.broker')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        WHEN seller.seller_role = 'manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.manager_sale_split_json, '$.manager')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        WHEN seller.seller_role = 'agent' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.agent')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        ELSE sg.closing_seller_rate
      END,
      seller.override_commission_rate = CASE
        WHEN seller.seller_role = 'broker_network_manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.broker_network_manager')) AS DECIMAL(5,2)), sg.bnm_override_rate)
        WHEN seller.seller_role = 'broker' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.broker')) AS DECIMAL(5,2)), sg.broker_override_rate)
        WHEN seller.seller_role = 'manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.manager')) AS DECIMAL(5,2)), sg.manager_override_rate)
        ELSE 0.00
      END,
      seller.commission_pool_rate = CASE
        WHEN seller.seller_role = 'broker_network_manager' THEN sg.pool_rate
        WHEN seller.seller_role = 'broker' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.broker_sale_split_json, '$.broker_network_manager')) AS DECIMAL(5,2)), 0) + COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.broker_sale_split_json, '$.broker')) AS DECIMAL(5,2)), 0)
        WHEN seller.seller_role = 'manager' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.manager_sale_split_json, '$.broker_network_manager')) AS DECIMAL(5,2)), 0) + COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.manager_sale_split_json, '$.broker')) AS DECIMAL(5,2)), 0) + COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.manager_sale_split_json, '$.manager')) AS DECIMAL(5,2)), 0)
        WHEN seller.seller_role = 'agent' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.broker_network_manager')) AS DECIMAL(5,2)), 0) + COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.broker')) AS DECIMAL(5,2)), 0) + COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.manager')) AS DECIMAL(5,2)), 0) + COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.agent')) AS DECIMAL(5,2)), 0)
        ELSE sg.closing_seller_rate
      END,
      seller.direct_to_developer_rate = CASE
        WHEN seller.seller_role = 'agent' THEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(sg.agent_sale_split_json, '$.agent')) AS DECIMAL(5,2)), sg.closing_seller_rate)
        ELSE seller.direct_to_developer_rate
      END,
      seller.rate_set_by = ?,
      seller.rate_updated_at = NOW()
    WHERE seller.seller_group_id = ?
    `,
    [userId, sellerGroupId]
  )
}

const syncGroupMembers = async ({ connection, sellerGroupId }) => {
  await connection.query(
    `
    UPDATE seller_group_members sgm
    INNER JOIN accredited_sellers seller ON seller.id = sgm.seller_id
    SET sgm.status = 'inactive', sgm.ended_at = COALESCE(sgm.ended_at, NOW())
    WHERE sgm.status = 'active'
      AND (seller.seller_group_id IS NULL OR seller.seller_group_id <> sgm.seller_group_id)
    `
  )

  await connection.query(
    `
    INSERT INTO seller_group_members (seller_group_id, seller_id, status, joined_at)
    SELECT seller.seller_group_id, seller.id, 'active', NOW()
    FROM accredited_sellers seller
    WHERE seller.seller_group_id = ?
      AND NOT EXISTS (
        SELECT 1
        FROM seller_group_members sgm
        WHERE sgm.seller_id = seller.id
          AND sgm.seller_group_id = seller.seller_group_id
          AND sgm.status = 'active'
      )
    `,
    [sellerGroupId]
  )
}

const getGroupRows = async (connectionOrDb = db) => {
  const [groups] = await connectionOrDb.query(
    `
    SELECT
      sg.id,
      sg.group_name,
      sg.group_code,
      sg.pool_rate,
      sg.closing_seller_rate,
      sg.bnm_override_rate,
      sg.broker_override_rate,
      sg.manager_override_rate,
      sg.agent_sale_split_json,
      sg.manager_sale_split_json,
      sg.broker_sale_split_json,
      sg.bnm_sale_split_json,
      sg.rollover_policy,
      sg.group_head_seller_id,
      head.full_name AS group_head_name,
      sg.status,
      sg.notes,
      sg.created_at,
      sg.updated_at,
      creator.full_name AS created_by_name,
      updater.full_name AS updated_by_name,
      COUNT(DISTINCT seller.id) AS active_member_count,
      COALESCE(SUM(CASE WHEN seller.seller_role = 'broker_network_manager' THEN 1 ELSE 0 END), 0) AS bnm_count,
      COALESCE(SUM(CASE WHEN seller.seller_role = 'broker' THEN 1 ELSE 0 END), 0) AS broker_count,
      COALESCE(SUM(CASE WHEN seller.seller_role = 'manager' THEN 1 ELSE 0 END), 0) AS manager_count,
      COALESCE(SUM(CASE WHEN seller.seller_role = 'agent' THEN 1 ELSE 0 END), 0) AS agent_count
    FROM seller_groups sg
    LEFT JOIN accredited_sellers head ON head.id = sg.group_head_seller_id
    LEFT JOIN users creator ON creator.id = sg.created_by
    LEFT JOIN users updater ON updater.id = sg.updated_by
    LEFT JOIN accredited_sellers seller ON seller.seller_group_id = sg.id AND seller.status = 'active'
    GROUP BY sg.id
    ORDER BY sg.status ASC, sg.group_name ASC
    `
  )

  const [distributions] = await connectionOrDb.query(
    `
    SELECT
      seller_group_id,
      seller_role,
      requested_rate,
      approved_rate,
      status,
      remarks
    FROM seller_group_rate_distributions
    ORDER BY FIELD(seller_role, 'broker_network_manager', 'broker', 'manager', 'agent')
    `
  )

  const byGroup = distributions.reduce((map, row) => {
    if (!map[row.seller_group_id]) map[row.seller_group_id] = []
    map[row.seller_group_id].push(row)
    return map
  }, {})

  return groups.map((group) => ({
    ...group,
    distribution: byGroup[group.id] || [],
  }))
}

export const getSellerGroups = async (_req, res) => {
  const groups = await getGroupRows()
  res.status(200).json({ message: 'Seller groups fetched successfully', groups, data: groups })
}

export const createSellerGroup = async (req, res) => {
  const groupName = normalizeText(req.body.group_name || req.body.name)
  const groupCode = normalizeText(req.body.group_code || req.body.code) || null
  const poolRate = normalizeRate(req.body.pool_rate)
  const status = req.body.status || 'active'
  const notes = normalizeText(req.body.notes) || null
  const groupHeadSellerId = isMissing(req.body.group_head_seller_id) ? null : Number(req.body.group_head_seller_id)
  const plan = getPlanFromBody(req.body)
  const distribution = getDistributionFromPlan(plan)

  const validationError = validateGroupPayload({ groupName, poolRate, status, plan })
  if (validationError) return res.status(400).json({ message: validationError })

  const groupHeadError = await validateGroupHeadSeller(groupHeadSellerId)
  if (groupHeadError) return res.status(400).json({ message: groupHeadError })

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      INSERT INTO seller_groups (
        group_name,
        group_code,
        pool_rate,
        closing_seller_rate,
        bnm_override_rate,
        broker_override_rate,
        manager_override_rate,
        agent_sale_split_json,
        manager_sale_split_json,
        broker_sale_split_json,
        bnm_sale_split_json,
        rollover_policy,
        group_head_seller_id,
        status,
        notes,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        groupName,
        groupCode,
        poolRate,
        plan.closing_seller_rate,
        plan.bnm_override_rate,
        plan.broker_override_rate,
        plan.manager_override_rate,
        plan.agent_sale_split_json,
        plan.manager_sale_split_json,
        plan.broker_sale_split_json,
        plan.bnm_sale_split_json,
        plan.rollover_policy,
        groupHeadSellerId,
        status,
        notes,
        req.user.id,
        req.user.id,
      ]
    )

    const sellerGroupId = result.insertId
    await upsertDistribution({ connection, sellerGroupId, distribution, userId: req.user.id })

    if (groupHeadSellerId) {
      await connection.query(
        `UPDATE accredited_sellers SET seller_group_id = ? WHERE id = ?`,
        [sellerGroupId, groupHeadSellerId]
      )
    }

    await syncGroupMembers({ connection, sellerGroupId })
    await applyGroupRatesToMembers({ connection, sellerGroupId, userId: req.user.id })

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Seller Groups',
      description: `Created seller group ${groupName}`,
      ipAddress: getClientIp(req),
    })

    const groups = await getGroupRows()
    res.status(201).json({ message: 'Seller group created successfully', sellerGroupId, groups })
  } catch (error) {
    await connection.rollback()
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Seller group name or code already exists' })
    }
    throw error
  } finally {
    connection.release()
  }
}

export const updateSellerGroup = async (req, res) => {
  const { id } = req.params

  const [existingRows] = await db.query(`SELECT * FROM seller_groups WHERE id = ? LIMIT 1`, [id])
  const existing = existingRows[0]
  if (!existing) return res.status(404).json({ message: 'Seller group not found' })

  const groupName = normalizeText(req.body.group_name || req.body.name || existing.group_name)
  const groupCode = req.body.group_code === undefined ? existing.group_code : normalizeText(req.body.group_code || req.body.code) || null
  const poolRate = req.body.pool_rate === undefined ? Number(existing.pool_rate || 0) : normalizeRate(req.body.pool_rate)
  const status = req.body.status || existing.status
  const notes = req.body.notes === undefined ? existing.notes : normalizeText(req.body.notes) || null
  const groupHeadSellerId = req.body.group_head_seller_id === undefined
    ? existing.group_head_seller_id
    : isMissing(req.body.group_head_seller_id)
      ? null
      : Number(req.body.group_head_seller_id)
  const plan = getPlanFromBody(req.body, existing)
  const distribution = getDistributionFromPlan(plan)

  const validationError = validateGroupPayload({ groupName, poolRate, status, plan })
  if (validationError) return res.status(400).json({ message: validationError })

  const groupHeadError = await validateGroupHeadSeller(groupHeadSellerId)
  if (groupHeadError) return res.status(400).json({ message: groupHeadError })

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE seller_groups
      SET
        group_name = ?,
        group_code = ?,
        pool_rate = ?,
        closing_seller_rate = ?,
        bnm_override_rate = ?,
        broker_override_rate = ?,
        manager_override_rate = ?,
        agent_sale_split_json = ?,
        manager_sale_split_json = ?,
        broker_sale_split_json = ?,
        bnm_sale_split_json = ?,
        rollover_policy = ?,
        group_head_seller_id = ?,
        status = ?,
        notes = ?,
        updated_by = ?
      WHERE id = ?
      `,
      [
        groupName,
        groupCode,
        poolRate,
        plan.closing_seller_rate,
        plan.bnm_override_rate,
        plan.broker_override_rate,
        plan.manager_override_rate,
        plan.agent_sale_split_json,
        plan.manager_sale_split_json,
        plan.broker_sale_split_json,
        plan.bnm_sale_split_json,
        plan.rollover_policy,
        groupHeadSellerId,
        status,
        notes,
        req.user.id,
        id,
      ]
    )

    await upsertDistribution({ connection, sellerGroupId: id, distribution, userId: req.user.id })

    if (groupHeadSellerId) {
      await connection.query(
        `UPDATE accredited_sellers SET seller_group_id = ? WHERE id = ?`,
        [id, groupHeadSellerId]
      )
    }

    await syncGroupMembers({ connection, sellerGroupId: id })
    await applyGroupRatesToMembers({ connection, sellerGroupId: id, userId: req.user.id })

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Seller Groups',
      description: `Updated seller group ${groupName}`,
      ipAddress: getClientIp(req),
    })

    const groups = await getGroupRows()
    res.status(200).json({ message: 'Seller group updated successfully', groups })
  } catch (error) {
    await connection.rollback()
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Seller group name or code already exists' })
    }
    throw error
  } finally {
    connection.release()
  }
}


export const getSellerGroupCommissionPreview = async (req, res) => {
  const sellerId = req.query.seller_id || req.query.sellerId

  if (isMissing(sellerId)) {
    return res.status(400).json({ message: 'Seller is required for commission preview' })
  }

  const preview = await buildHierarchyCommissionPreview({ sellerId })

  res.status(200).json({
    preview,
    rows: preview.rows || [],
    warnings: preview.warnings || [],
    totalRate: preview.totalRate || 0,
  })
}

export const deleteSellerGroup = async (req, res) => {
  const { id } = req.params

  const [existingRows] = await db.query(
    `SELECT id, group_name FROM seller_groups WHERE id = ? LIMIT 1`,
    [id]
  )
  const existing = existingRows[0]

  if (!existing) {
    return res.status(404).json({ message: 'Seller group not found' })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE accredited_sellers
      SET
        seller_group_id = NULL,
        commission_pool_rate = NULL,
        personal_commission_rate = NULL,
        override_commission_rate = NULL,
        residual_commission_rate = NULL,
        max_downline_rate = NULL,
        updated_at = NOW()
      WHERE seller_group_id = ?
      `,
      [id]
    )

    await connection.query(`DELETE FROM seller_groups WHERE id = ?`, [id])

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'delete',
      module: 'Seller Groups',
      description: `Removed seller group ${existing.group_name}`,
      ipAddress: getClientIp(req),
    })

    const groups = await getGroupRows()
    res.status(200).json({ message: 'Seller group removed successfully', groups })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const recalculateSellerGroupMembers = async (req, res) => {
  const { id } = req.params

  const [existingRows] = await db.query(`SELECT * FROM seller_groups WHERE id = ? LIMIT 1`, [id])
  if (!existingRows[0]) return res.status(404).json({ message: 'Seller group not found' })

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()
    await syncGroupMembers({ connection, sellerGroupId: id })
    await applyGroupRatesToMembers({ connection, sellerGroupId: id, userId: req.user.id })
    await connection.commit()

    res.status(200).json({ message: 'Seller group members recalculated successfully' })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

