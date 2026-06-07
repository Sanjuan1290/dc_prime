import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const allowedSettingKeys = [
  'company_name',
  'company_email',
  'company_contact',
  'company_address',
  'default_reservation_fee',
  'default_commission_rate',
  'system_status'
]

const hasOwn = (object, key) => {
  return Object.prototype.hasOwnProperty.call(object, key)
}

const isPlainObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const normalizeSettingValue = (value) => {
  if (value === null) {
    return null
  }

  return String(value)
}

const validateSettingKey = (key) => {
  if (!allowedSettingKeys.includes(key)) {
    return {
      isValid: false,
      message: `Unknown setting key: ${key}`
    }
  }

  return {
    isValid: true
  }
}

export const settingsRowsToObject = (rows) => {
  return rows.reduce((settingsMap, row) => {
    settingsMap[row.setting_key] = row.setting_value
    return settingsMap
  }, {})
}

const upsertSettings = async (settingsEntries) => {
  const placeholders = settingsEntries.map(() => '(?, ?)').join(', ')
  const params = settingsEntries.flatMap(([key, value]) => [
    key,
    normalizeSettingValue(value)
  ])

  await db.query(
    `
    INSERT INTO settings (
      setting_key,
      setting_value
    ) VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value)
    `,
    params
  )
}

export const getSettings = async (req, res) => {
  const [settings] = await db.query(
    `
    SELECT
      id,
      setting_key,
      setting_value,
      created_at,
      updated_at
    FROM settings
    ORDER BY id ASC
    `
  )

  res.status(200).json({
    settings,
    settingsMap: settingsRowsToObject(settings)
  })
}

export const getSetting = async (req, res) => {
  const { key } = req.params

  const [rows] = await db.query(
    `
    SELECT
      id,
      setting_key,
      setting_value,
      created_at,
      updated_at
    FROM settings
    WHERE setting_key = ?
    LIMIT 1
    `,
    [key]
  )

  const setting = rows[0]

  if (!setting) {
    return res.status(404).json({
      message: 'Setting not found'
    })
  }

  res.status(200).json({
    setting
  })
}

export const updateSettings = async (req, res) => {
  if (!isPlainObject(req.body) || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: 'Settings body is required'
    })
  }

  const settingsEntries = Object.entries(req.body)

  for (const [key] of settingsEntries) {
    const keyValidation = validateSettingKey(key)

    if (!keyValidation.isValid) {
      return res.status(400).json({
        message: keyValidation.message
      })
    }
  }

  await upsertSettings(settingsEntries)

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Settings',
    description: 'Updated system settings',
    ipAddress: getClientIp(req)
  })

  res.status(200).json({
    message: 'Settings updated successfully'
  })
}

export const updateSetting = async (req, res) => {
  const { key } = req.params

  const keyValidation = validateSettingKey(key)

  if (!keyValidation.isValid) {
    return res.status(400).json({
      message: keyValidation.message
    })
  }

  if (!isPlainObject(req.body) || !hasOwn(req.body, 'setting_value')) {
    return res.status(400).json({
      message: 'Setting value is required'
    })
  }

  await upsertSettings([
    [key, req.body.setting_value]
  ])

  await createAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Settings',
    description: `Updated setting ${key}`,
    ipAddress: getClientIp(req)
  })

  res.status(200).json({
    message: 'Setting updated successfully'
  })
}
