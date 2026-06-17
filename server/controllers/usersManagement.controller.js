import bcrypt from 'bcrypt'
import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { generateTemporaryPassword, sendTemporaryPasswordEmail } from './users.controller.js'

const officeRoles = ['super_admin', 'admin']
const sellerRoles = ['broker_network_manager', 'broker', 'manager', 'agent']
const allowedRoles = [...officeRoles, ...sellerRoles]
const allowedStatuses = ['active', 'inactive']

const sellerParentRoleMap = {
  broker_network_manager: [],
  broker: ['broker_network_manager'],
  manager: ['broker'],
  agent: ['manager'],
}

const isMissing = (value) => value === undefined || value === null || value === ''
const nullableValue = (value) => (isMissing(value) ? null : value)
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value)

const normalizeRate = (value) => {
  if (isMissing(value)) return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Number(parsed.toFixed(2))
}

const validateRate = (value, label) => {
  if (value === null) return null
  if (value < 0 || value > 100) return `${label} must be between 0 and 100`
  return null
}

const isSellerRole = (role) => sellerRoles.includes(role)

const roleLabel = (role) => String(role || '').replaceAll('_', ' ')

const userFields = `
  user.id,
  user.full_name,
  user.email,
  user.role,
  user.status,
  user.last_login,
  user.created_at,
  user.updated_at,
  user.must_change_password,
  user.temp_password_sent_at,
  user.password_changed_at,
  seller.id AS seller_id,
  seller.full_name AS seller_full_name,
  seller.email AS seller_email,
  seller.contact_no AS seller_contact_no,
  seller.seller_role,
  seller.parent_seller_id,
  parent.full_name AS parent_seller_name,
  parent.seller_role AS parent_seller_role,
  seller.status AS seller_status,
  seller.accreditation_date,
  seller.commission_rate,
  seller.commission_pool_rate,
  seller.personal_commission_rate,
  seller.override_commission_rate,
  seller.direct_to_developer_rate,
  seller.residual_commission_rate,
  seller.max_downline_rate,
  seller.rate_set_by,
  rateSetter.full_name AS rate_set_by_name,
  seller.rate_updated_at
`

const getUserById = async (userId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `SELECT id, full_name, email, role, status FROM users WHERE id = ? LIMIT 1`,
    [userId]
  )

  return rows[0] || null
}

const getSellerById = async (sellerId, connectionOrDb = db) => {
  if (isMissing(sellerId)) return null

  const [rows] = await connectionOrDb.query(
    `
    SELECT
      seller.*,
      parent.full_name AS parent_seller_name,
      parent.seller_role AS parent_seller_role,
      broker.id AS broker_id,
      broker.full_name AS broker_name,
      broker.commission_pool_rate AS broker_pool_rate,
      bnm.id AS broker_network_manager_id,
      bnm.full_name AS broker_network_manager_name,
      bnm.commission_pool_rate AS broker_network_manager_pool_rate
    FROM accredited_sellers seller
    LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
    LEFT JOIN accredited_sellers broker
      ON broker.id = CASE
        WHEN seller.seller_role = 'manager' THEN seller.parent_seller_id
        WHEN seller.seller_role = 'agent' THEN parent.parent_seller_id
        WHEN seller.seller_role = 'broker' THEN seller.id
        ELSE NULL
      END
    LEFT JOIN accredited_sellers bnm
      ON bnm.id = CASE
        WHEN seller.seller_role = 'broker' THEN seller.parent_seller_id
        WHEN seller.seller_role = 'manager' THEN broker.parent_seller_id
        WHEN seller.seller_role = 'agent' THEN broker.parent_seller_id
        ELSE NULL
      END
    WHERE seller.id = ?
    LIMIT 1
    `,
    [sellerId]
  )

  return rows[0] || null
}

const getSellerByUserId = async (userId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `SELECT * FROM accredited_sellers WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
    [userId]
  )

  return rows[0] || null
}


const defaultCommissionRows = [
  ['bnm_pool_rate', 'Broker Network Manager Pool Rate', 'broker_network_manager', 'pool', 8],
  ['broker_pool_rate', 'Broker Pool Rate', 'broker', 'pool', 7],
]

const seedCommissionDefaults = async (connectionOrDb = db) => {
  for (const [settingKey, label, role, rateType, defaultRate] of defaultCommissionRows) {
    await connectionOrDb.query(
      `
      INSERT INTO commission_role_defaults (
        setting_key,
        label,
        role,
        rate_type,
        default_rate
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        role = VALUES(role),
        rate_type = VALUES(rate_type)
      `,
      [settingKey, label, role, rateType, defaultRate]
    )
  }
}

const getCommissionDefaultsMap = async (connectionOrDb = db) => {
  await seedCommissionDefaults(connectionOrDb)
  const [rows] = await connectionOrDb.query(
    `
    SELECT setting_key, label, role, rate_type, default_rate
    FROM commission_role_defaults
    ORDER BY id ASC
    `
  )

  return rows.reduce((map, row) => {
    map[row.setting_key] = row
    return map
  }, {})
}

const getDefaultRateForSellerRole = async (role, key, connectionOrDb = db) => {
  const defaults = await getCommissionDefaultsMap(connectionOrDb)

  if (key && defaults[key]) return normalizeRate(defaults[key].default_rate)

  if (role === 'broker_network_manager') return normalizeRate(defaults.bnm_pool_rate?.default_rate || 0)
  if (role === 'broker') return normalizeRate(defaults.broker_pool_rate?.default_rate || 0)

  return null
}

const validateParentSeller = async ({ role, parentSellerId, connection }) => {
  const allowedParentRoles = sellerParentRoleMap[role] || []

  if (role === 'broker_network_manager') {
    if (!isMissing(parentSellerId)) {
      return { isValid: false, message: 'Broker network manager should not report under another seller' }
    }
    return { isValid: true, parentSeller: null }
  }

  if (['broker', 'manager'].includes(role) && isMissing(parentSellerId)) {
    return { isValid: true, parentSeller: null }
  }

  if (isMissing(parentSellerId)) {
    return {
      isValid: false,
      message: `A ${roleLabel(role)} must report under a ${allowedParentRoles.join(' or ').replaceAll('_', ' ')}`,
    }
  }

  const parentSeller = await getSellerById(parentSellerId, connection)

  if (!parentSeller) {
    return { isValid: false, message: 'Selected reports under seller was not found' }
  }

  if (parentSeller.status !== 'active') {
    return { isValid: false, message: 'Selected reports under seller is inactive' }
  }

  if (!allowedParentRoles.includes(parentSeller.seller_role)) {
    return {
      isValid: false,
      message: `A ${roleLabel(role)} can only report under: ${allowedParentRoles.join(', ').replaceAll('_', ' ')}`,
    }
  }

  return { isValid: true, parentSeller }
}

const normalizeSellerProfile = ({ role, body, userFullName, userEmail, userStatus }) => {
  const sellerProfile = body?.seller_profile || {}

  const finalStatus = sellerProfile.status || userStatus || 'active'
  if (!allowedStatuses.includes(finalStatus)) {
    return { isValid: false, message: 'Invalid seller status' }
  }

  const commissionPoolRate = ['broker_network_manager', 'broker'].includes(role)
    ? normalizeRate(sellerProfile.commission_pool_rate)
    : null
  const managerAssignedRate = role === 'manager'
    ? normalizeRate(sellerProfile.manager_rate ?? sellerProfile.personal_commission_rate ?? sellerProfile.override_commission_rate)
    : null
  const agentCommissionRate = role === 'agent'
    ? normalizeRate(sellerProfile.agent_commission_rate ?? sellerProfile.personal_commission_rate)
    : null
  const directToDeveloperRate = role === 'agent'
    ? agentCommissionRate
    : role === 'manager'
      ? managerAssignedRate
      : null
  const maxDownlineRate = normalizeRate(sellerProfile.max_downline_rate)

  const rateErrors = [
    validateRate(commissionPoolRate, 'Commission pool rate'),
    validateRate(managerAssignedRate, 'Manager rate'),
    validateRate(agentCommissionRate, 'Agent commission rate'),
    validateRate(maxDownlineRate, 'Max downline rate'),
  ].filter(Boolean)

  if (rateErrors.length > 0) {
    return { isValid: false, message: rateErrors.join('. ') }
  }

  return {
    isValid: true,
    sellerProfile: {
      full_name: normalizeText(sellerProfile.full_name) || userFullName,
      email: normalizeText(sellerProfile.email) || userEmail,
      contact_no: normalizeText(sellerProfile.contact_no) || null,
      seller_role: role,
      parent_seller_id: nullableValue(sellerProfile.parent_seller_id),
      status: finalStatus,
      accreditation_date: nullableValue(sellerProfile.accreditation_date),
      commission_rate: role === 'manager' ? managerAssignedRate : agentCommissionRate,
      commission_pool_rate: commissionPoolRate,
      personal_commission_rate: role === 'manager' ? managerAssignedRate : agentCommissionRate,
      override_commission_rate: null,
      direct_to_developer_rate: directToDeveloperRate,
      max_downline_rate: maxDownlineRate,
    },
  }
}

const validateSellerRatesAgainstParent = async ({ role, sellerProfile, parentSeller, connection }) => {
  if (role === 'broker' && parentSeller?.commission_pool_rate !== null && parentSeller?.commission_pool_rate !== undefined) {
    const parentPool = Number(parentSeller.commission_pool_rate || 0)
    const brokerPool = Number(sellerProfile.commission_pool_rate || 0)
    if (brokerPool > parentPool) {
      return {
        isValid: false,
        message: `Broker pool cannot exceed the BNM pool of ${parentPool}%`,
      }
    }
  }

  if (role === 'manager' && parentSeller?.commission_pool_rate !== null && parentSeller?.commission_pool_rate !== undefined) {
    const brokerPool = Number(parentSeller.commission_pool_rate || 0)
    const managerRate = Number(sellerProfile.personal_commission_rate || 0)
    if (managerRate > brokerPool) {
      return {
        isValid: false,
        message: `Manager rate cannot exceed the broker pool of ${brokerPool}%`,
      }
    }
  }

  if (role === 'agent') {
    const manager = parentSeller

    if (manager?.personal_commission_rate !== null && manager?.personal_commission_rate !== undefined) {
      const managerRate = Number(manager.personal_commission_rate || 0)
      const agentRate = Number(sellerProfile.personal_commission_rate || 0)

      if (agentRate > managerRate) {
        return {
          isValid: false,
          message: `Agent rate cannot exceed manager rate. Manager rate: ${managerRate}%, max agent rate: ${managerRate}%`,
        }
      }
    }
  }

  return { isValid: true }
}

const createLinkedSeller = async ({ connection, userId, role, sellerProfile, actingUserId }) => {
  const [result] = await connection.query(
    `
    INSERT INTO accredited_sellers (
      user_id,
      full_name,
      email,
      contact_no,
      seller_role,
      parent_seller_id,
      custom_reports_under,
      status,
      accreditation_date,
      commission_rate,
      commission_pool_rate,
      personal_commission_rate,
      override_commission_rate,
      direct_to_developer_rate,
      max_downline_rate,
      rate_set_by,
      rate_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      userId,
      sellerProfile.full_name,
      sellerProfile.email,
      sellerProfile.contact_no,
      role,
      sellerProfile.parent_seller_id,
      sellerProfile.status,
      sellerProfile.accreditation_date,
      sellerProfile.commission_rate,
      sellerProfile.commission_pool_rate,
      sellerProfile.personal_commission_rate,
      sellerProfile.override_commission_rate,
      sellerProfile.direct_to_developer_rate,
      sellerProfile.max_downline_rate,
      actingUserId,
    ]
  )

  return result.insertId
}

const updateLinkedSeller = async ({ connection, userId, role, sellerProfile, actingUserId }) => {
  const existingSeller = await getSellerByUserId(userId, connection)

  if (!existingSeller) {
    return createLinkedSeller({ connection, userId, role, sellerProfile, actingUserId })
  }

  await connection.query(
    `
    UPDATE accredited_sellers
    SET
      full_name = ?,
      email = ?,
      contact_no = ?,
      seller_role = ?,
      parent_seller_id = ?,
      custom_reports_under = NULL,
      status = ?,
      accreditation_date = ?,
      commission_rate = ?,
      commission_pool_rate = ?,
      personal_commission_rate = ?,
      override_commission_rate = ?,
      direct_to_developer_rate = ?,
      max_downline_rate = ?,
      rate_set_by = ?,
      rate_updated_at = NOW()
    WHERE id = ?
    `,
    [
      sellerProfile.full_name,
      sellerProfile.email,
      sellerProfile.contact_no,
      role,
      sellerProfile.parent_seller_id,
      sellerProfile.status,
      sellerProfile.accreditation_date,
      sellerProfile.commission_rate,
      sellerProfile.commission_pool_rate,
      sellerProfile.personal_commission_rate,
      sellerProfile.override_commission_rate,
      sellerProfile.direct_to_developer_rate,
      sellerProfile.max_downline_rate,
      actingUserId,
      existingSeller.id,
    ]
  )

  return existingSeller.id
}


export const getCommissionRoleDefaults = async (req, res) => {
  const defaultsMap = await getCommissionDefaultsMap()
  const defaults = Object.values(defaultsMap)
  res.status(200).json({
    message: 'Commission role defaults fetched successfully',
    defaults,
    defaultsMap,
    data: defaults,
  })
}

export const updateCommissionRoleDefaults = async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only super admin can update default commission rates' })
  }

  const { defaults = {} } = req.body
  await seedCommissionDefaults()

  const allowedKeys = defaultCommissionRows.map(([key]) => key)
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    for (const key of allowedKeys) {
      if (defaults[key] === undefined) continue
      const rate = normalizeRate(defaults[key])
      const error = validateRate(rate, key.replaceAll('_', ' '))
      if (error) {
        await connection.rollback()
        return res.status(400).json({ message: error })
      }

      await connection.query(
        `
        UPDATE commission_role_defaults
        SET default_rate = ?, updated_by = ?, updated_at = NOW()
        WHERE setting_key = ?
        `,
        [rate, req.user.id, key]
      )
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Commission Defaults',
      description: 'Updated role default commission rates',
      ipAddress: getClientIp(req),
    })

    const defaultsMap = await getCommissionDefaultsMap()
    res.status(200).json({
      message: 'Default commission rates updated successfully',
      defaults: Object.values(defaultsMap),
      defaultsMap,
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const getUsers = async (req, res) => {
  const [users] = await db.query(
    `
    SELECT
      ${userFields}
    FROM users user
    LEFT JOIN accredited_sellers seller ON seller.user_id = user.id
    LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
    LEFT JOIN users rateSetter ON rateSetter.id = seller.rate_set_by
    ORDER BY user.id DESC
    `
  )

  res.status(200).json({ message: 'Users fetched successfully', users, data: users })
}

export const createUser = async (req, res) => {
  const {
    full_name,
    email,
    role = 'agent',
    status = 'active',
  } = req.body

  const finalFullName = normalizeText(full_name)
  const finalEmail = normalizeText(email)
  const finalRole = normalizeText(role)
  const finalStatus = status || 'active'

  if (isMissing(finalFullName) || isMissing(finalEmail)) {
    return res.status(400).json({ message: 'Full name and email are required' })
  }

  if (!allowedRoles.includes(finalRole)) {
    return res.status(400).json({ message: 'Invalid role' })
  }

  if (!allowedStatuses.includes(finalStatus)) {
    return res.status(400).json({ message: 'Invalid user status' })
  }

  if (req.user.role !== 'super_admin' && ['super_admin', 'admin'].includes(finalRole)) {
    return res.status(403).json({ message: 'Only super admin can create admin or super admin accounts' })
  }

  const [existing] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [finalEmail])
  if (existing.length > 0) {
    return res.status(400).json({ message: 'Email is already used' })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    let normalizedSeller = null
    let parentSeller = null

    if (isSellerRole(finalRole)) {
      const sellerProfileResult = normalizeSellerProfile({
        role: finalRole,
        body: req.body,
        userFullName: finalFullName,
        userEmail: finalEmail,
        userStatus: finalStatus,
      })

      if (!sellerProfileResult.isValid) {
        await connection.rollback()
        return res.status(400).json({ message: sellerProfileResult.message })
      }

      normalizedSeller = sellerProfileResult.sellerProfile

      if (finalRole === 'broker_network_manager' && normalizedSeller.commission_pool_rate === null) {
        normalizedSeller.commission_pool_rate = await getDefaultRateForSellerRole(finalRole, 'bnm_pool_rate', connection)
      }
      if (finalRole === 'broker' && normalizedSeller.commission_pool_rate === null) {
        normalizedSeller.commission_pool_rate = await getDefaultRateForSellerRole(finalRole, 'broker_pool_rate', connection)
      }
      if (finalRole === 'agent') {
        normalizedSeller.direct_to_developer_rate = normalizedSeller.personal_commission_rate
      }

      const parentValidation = await validateParentSeller({
        role: finalRole,
        parentSellerId: normalizedSeller.parent_seller_id,
        connection,
      })

      if (!parentValidation.isValid) {
        await connection.rollback()
        return res.status(400).json({ message: parentValidation.message })
      }

      parentSeller = parentValidation.parentSeller

      const rateValidation = await validateSellerRatesAgainstParent({
        role: finalRole,
        sellerProfile: normalizedSeller,
        parentSeller,
        connection,
      })

      if (!rateValidation.isValid) {
        await connection.rollback()
        return res.status(400).json({ message: rateValidation.message })
      }
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)
    const [result] = await connection.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        status,
        must_change_password,
        temp_password_sent_at
      ) VALUES (?, ?, ?, ?, ?, 1, NULL)
      `,
      [finalFullName, finalEmail, passwordHash, finalRole, finalStatus]
    )

    let sellerId = null

    if (normalizedSeller) {
      sellerId = await createLinkedSeller({
        connection,
        userId: result.insertId,
        role: finalRole,
        sellerProfile: normalizedSeller,
        actingUserId: req.user.id,
      })
    }

    await connection.commit()

    const emailResult = await sendTemporaryPasswordEmail({
      email: finalEmail,
      fullName: finalFullName,
      temporaryPassword,
    })

    if (emailResult.sent) {
      await db.query(
        `UPDATE users SET temp_password_sent_at = NOW() WHERE id = ?`,
        [result.insertId]
      )
    }

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Users',
      description: sellerId
        ? `Created user ${finalFullName} and linked seller profile ${sellerId}`
        : `Created user ${finalFullName}`,
      ipAddress: getClientIp(req),
    })

    res.status(201).json({
      message: emailResult.sent
        ? sellerId
          ? 'User and seller profile created successfully. Temporary password was emailed.'
          : 'User created successfully. Temporary password was emailed.'
        : sellerId
          ? 'User and seller profile created, but temporary password email failed. Use reset password.'
          : 'User created, but temporary password email failed. Use reset password.',
      userId: result.insertId,
      sellerId,
      temporaryPasswordEmailSent: emailResult.sent,
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const { full_name, email, password, role, status } = req.body

  const existingUser = await getUserById(id)
  if (!existingUser) return res.status(404).json({ message: 'User not found' })

  const finalFullName = isMissing(full_name) ? existingUser.full_name : normalizeText(full_name)
  const finalEmail = isMissing(email) ? existingUser.email : normalizeText(email)
  const finalRole = isMissing(role) ? existingUser.role : normalizeText(role)
  const finalStatus = isMissing(status) ? existingUser.status : status

  if (!allowedRoles.includes(finalRole)) {
    return res.status(400).json({ message: 'Invalid role' })
  }

  if (!allowedStatuses.includes(finalStatus)) {
    return res.status(400).json({ message: 'Invalid user status' })
  }

  if (req.user.role !== 'super_admin' && (['super_admin', 'admin'].includes(existingUser.role) || ['super_admin', 'admin'].includes(finalRole))) {
    return res.status(403).json({ message: 'Only super admin can edit admin or super admin accounts' })
  }

  if (!isMissing(finalEmail) && finalEmail !== existingUser.email) {
    const [duplicateRows] = await db.query(
      `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`,
      [finalEmail, id]
    )
    if (duplicateRows.length > 0) {
      return res.status(400).json({ message: 'Email is already used' })
    }
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    let normalizedSeller = null
    let parentSeller = null

    if (isSellerRole(finalRole)) {
      const sellerProfileResult = normalizeSellerProfile({
        role: finalRole,
        body: req.body,
        userFullName: finalFullName,
        userEmail: finalEmail,
        userStatus: finalStatus,
      })

      if (!sellerProfileResult.isValid) {
        await connection.rollback()
        return res.status(400).json({ message: sellerProfileResult.message })
      }

      normalizedSeller = sellerProfileResult.sellerProfile

      if (finalRole === 'broker_network_manager' && normalizedSeller.commission_pool_rate === null) {
        normalizedSeller.commission_pool_rate = await getDefaultRateForSellerRole(finalRole, 'bnm_pool_rate', connection)
      }
      if (finalRole === 'broker' && normalizedSeller.commission_pool_rate === null) {
        normalizedSeller.commission_pool_rate = await getDefaultRateForSellerRole(finalRole, 'broker_pool_rate', connection)
      }
      if (finalRole === 'agent') {
        normalizedSeller.direct_to_developer_rate = normalizedSeller.personal_commission_rate
      }

      const parentValidation = await validateParentSeller({
        role: finalRole,
        parentSellerId: normalizedSeller.parent_seller_id,
        connection,
      })

      if (!parentValidation.isValid) {
        await connection.rollback()
        return res.status(400).json({ message: parentValidation.message })
      }

      parentSeller = parentValidation.parentSeller

      const rateValidation = await validateSellerRatesAgainstParent({
        role: finalRole,
        sellerProfile: normalizedSeller,
        parentSeller,
        connection,
      })

      if (!rateValidation.isValid) {
        await connection.rollback()
        return res.status(400).json({ message: rateValidation.message })
      }
    }

    const fields = [
      'full_name = ?',
      'email = ?',
      'role = ?',
      'status = ?',
    ]
    const params = [finalFullName, finalEmail, finalRole, finalStatus]

    if (!isMissing(password)) {
      fields.push('password_hash = ?')
      params.push(await bcrypt.hash(password, 10))
    }

    params.push(id)

    await connection.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)

    let sellerId = null

    if (normalizedSeller) {
      sellerId = await updateLinkedSeller({
        connection,
        userId: Number(id),
        role: finalRole,
        sellerProfile: normalizedSeller,
        actingUserId: req.user.id,
      })
    } else {
      await connection.query(
        `UPDATE accredited_sellers SET user_id = NULL WHERE user_id = ?`,
        [id]
      )
    }

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Users',
      description: sellerId
        ? `Updated user ${id} and linked seller profile ${sellerId}`
        : `Updated user ${id}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({ message: 'User updated successfully', sellerId })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const deactivateUser = async (req, res) => {
  const { id } = req.params

  if (Number(id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' })
  }

  const existingUser = await getUserById(id)
  if (!existingUser) return res.status(404).json({ message: 'User not found' })

  if (req.user.role !== 'super_admin' && ['super_admin', 'admin'].includes(existingUser.role)) {
    return res.status(403).json({ message: 'Only super admin can deactivate admin or super admin accounts' })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(`UPDATE users SET status = 'inactive' WHERE id = ?`, [id])
    await connection.query(`UPDATE accredited_sellers SET status = 'inactive' WHERE user_id = ?`, [id])

    await connection.commit()

    await safeCreateAuditLog({
      userId: req.user.id,
      action: 'deactivate',
      module: 'Users',
      description: `Deactivated user ${id}`,
      ipAddress: getClientIp(req),
    })

    res.status(200).json({ message: 'User deactivated successfully' })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}


export const resetUserTemporaryPassword = async (req, res) => {
  const { id } = req.params

  const existingUser = await getUserById(id)
  if (!existingUser) return res.status(404).json({ message: 'User not found' })

  if (req.user.role !== 'super_admin' && ['super_admin', 'admin'].includes(existingUser.role)) {
    return res.status(403).json({ message: 'Only super admin can reset admin or super admin accounts' })
  }

  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await bcrypt.hash(temporaryPassword, 10)

  await db.query(
    `
    UPDATE users
    SET
      password_hash = ?,
      must_change_password = 1,
      temp_password_sent_at = NULL
    WHERE id = ?
    `,
    [passwordHash, id]
  )

  const emailResult = await sendTemporaryPasswordEmail({
    email: existingUser.email,
    fullName: existingUser.full_name,
    temporaryPassword,
  })

  if (emailResult.sent) {
    await db.query(`UPDATE users SET temp_password_sent_at = NOW() WHERE id = ?`, [id])
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'reset_password',
    module: 'Users',
    description: `Reset temporary password for user ${id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: emailResult.sent
      ? 'Temporary password was emailed successfully'
      : 'Temporary password was reset, but email failed. Check SMTP settings.',
    temporaryPasswordEmailSent: emailResult.sent,
  })
}

export const linkUserToSeller = async (req, res) => {
  const { id } = req.params
  const { seller_id } = req.body

  if (isMissing(seller_id)) {
    return res.status(400).json({ message: 'seller_id is required' })
  }

  const existingUser = await getUserById(id)
  if (!existingUser) return res.status(404).json({ message: 'User not found' })

  if (!isSellerRole(existingUser.role)) {
    return res.status(400).json({ message: 'Only seller role users can be linked to accredited seller profiles' })
  }

  const seller = await getSellerById(seller_id)
  if (!seller) return res.status(404).json({ message: 'Seller not found' })

  if (seller.seller_role !== existingUser.role) {
    return res.status(400).json({ message: 'Seller role must match the user role' })
  }

  await db.query(`UPDATE accredited_sellers SET user_id = NULL WHERE user_id = ?`, [id])
  await db.query(`UPDATE accredited_sellers SET user_id = ? WHERE id = ?`, [id, seller_id])

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'link',
    module: 'Users',
    description: `Linked user ${id} to seller ${seller_id}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({ message: 'User linked to seller successfully' })
}
