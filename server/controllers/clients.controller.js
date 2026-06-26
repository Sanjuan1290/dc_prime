import { db } from '../db/connect.js'
import { safeCreateAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const allowedBuyerTypes = ['single', 'spouses', 'and_account']
const allowedGenders = ['male', 'female', 'other']
const allowedCivilStatuses = [
  'single',
  'married',
  'separated',
  'annulled_divorced',
  'widower',
]
const allowedBuyerRoles = ['spouse', 'second_buyer']
const allowedPersonTypes = ['principal', 'co_buyer']
const allowedEmploymentStatuses = [
  'employed_private',
  'employed_government',
  'employed_ngo',
  'self_employed_business',
  'self_employed_professional',
  'ofw_immigrant',
  'other',
]
const allowedProfileStatuses = ['incomplete', 'complete']

const validateEnumValue = (
  value,
  allowedValues,
  fieldName,
  { required = false, defaultValue = null } = {}
) => {
  if (isMissing(value)) {
    if (required && isMissing(defaultValue)) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
      }
    }

    return {
      isValid: true,
      value: defaultValue,
    }
  }

  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      message: `Invalid ${fieldName}`,
    }
  }

  return {
    isValid: true,
    value,
  }
}

const parseDateOnly = (value, fieldName) => {
  if (isMissing(value)) {
    return {
      isValid: true,
      value: null,
    }
  }

  const dateString = String(value).trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid date`,
    }
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid date`,
    }
  }

  return {
    isValid: true,
    value: dateString,
  }
}

const parseMoneyOrNull = (value, fieldName) => {
  if (isMissing(value)) return { isValid: true, value: null }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return {
      isValid: false,
      message: `${fieldName} must be a non-negative amount`,
    }
  }

  return {
    isValid: true,
    value: Number(parsedValue.toFixed(2)),
  }
}

const hasText = (value) => {
  return !isMissing(value) && String(value).trim() !== ''
}

const getProfileCompletion = (client, coBuyers = []) => {
  const missingFields = []

  if (!hasText(client.full_name)) missingFields.push('Principal full name')
  if (!hasText(client.birth_date)) missingFields.push('Birth date')
  if (!hasText(client.citizenship)) missingFields.push('Citizenship')
  if (!hasText(client.gender)) missingFields.push('Gender')
  if (!hasText(client.civil_status)) missingFields.push('Civil status')
  if (!hasText(client.present_address)) missingFields.push('Present address')
  if (!hasText(client.contact_no) && !hasText(client.email)) {
    missingFields.push('Contact number or email')
  }
  if (!hasText(client.tin)) missingFields.push('TIN')

  if (
    ['spouses', 'and_account'].includes(client.buyer_type) &&
    !coBuyers.some((buyer) => hasText(buyer.full_name))
  ) {
    missingFields.push('Spouse / second buyer full name')
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  }
}

const clientFields = `
  c.id,
  c.full_name,
  c.spouse_co_owner_name,
  c.buyer_type,
  c.birth_date,
  c.place_of_birth,
  c.citizenship,
  c.gender,
  c.civil_status,
  c.email,
  c.contact_no,
  c.residence_phone_no,
  c.tin,
  c.address,
  c.present_address,
  c.present_zip_code,
  c.permanent_address,
  c.permanent_zip_code,
  c.region,
  c.profile_status,
  c.default_seller_id,
  seller.full_name AS default_seller_name,
  seller.seller_role AS default_seller_role,
  COALESCE(COUNT(DISTINCT cu.id), 0) AS units_count,
  COALESCE(
    SUM(
      GREATEST(
        COALESCE(l.total_contract_price, 0) - COALESCE(payment_totals.total_paid, 0),
        0
      )
    ),
    0
  ) AS balance,
  c.created_at,
  c.updated_at
`

const clientJoins = `
  FROM clients c
  LEFT JOIN accredited_sellers seller
    ON seller.id = c.default_seller_id
  LEFT JOIN client_units cu
    ON cu.client_id = c.id
  LEFT JOIN listings l
    ON l.id = cu.listing_id
  LEFT JOIN (
    SELECT client_unit_id, SUM(amount) AS total_paid
    FROM payments
    WHERE status = 'verified'
    GROUP BY client_unit_id
  ) payment_totals ON payment_totals.client_unit_id = cu.id
`

const getClientById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      ${clientFields}
    ${clientJoins}
    WHERE c.id = ?
    GROUP BY
      c.id,
      c.full_name,
      c.spouse_co_owner_name,
      c.buyer_type,
      c.birth_date,
      c.place_of_birth,
      c.citizenship,
      c.gender,
      c.civil_status,
      c.email,
      c.contact_no,
      c.residence_phone_no,
      c.tin,
      c.address,
      c.present_address,
      c.present_zip_code,
      c.permanent_address,
      c.permanent_zip_code,
      c.region,
      c.profile_status,
      c.default_seller_id,
      seller.full_name,
      seller.seller_role,
      c.created_at,
      c.updated_at
    LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

const getCoBuyersByClientId = async (clientId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id,
      client_id,
      buyer_role,
      full_name,
      birth_date,
      place_of_birth,
      citizenship,
      gender,
      civil_status,
      present_address,
      present_zip_code,
      permanent_address,
      permanent_zip_code,
      mobile_no,
      residence_phone_no,
      email,
      tin,
      created_at,
      updated_at
    FROM client_buyers
    WHERE client_id = ?
      AND client_unit_id IS NULL
    ORDER BY id ASC
    `,
    [clientId]
  )

  return rows
}

const getEmploymentDetailsByClientId = async (clientId, connectionOrDb = db) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id,
      client_id,
      client_buyer_id,
      person_type,
      employment_status,
      employment_status_other,
      employer_business_name,
      employer_business_address,
      employer_zip_code,
      nature_of_work_business,
      occupation_position_title,
      monthly_income,
      created_at,
      updated_at
    FROM client_employment_details
    WHERE client_id = ?
    ORDER BY
      CASE person_type WHEN 'principal' THEN 0 ELSE 1 END,
      id ASC
    `,
    [clientId]
  )

  return rows
}

const getClientProfilePayload = async (clientId, connectionOrDb = db) => {
  const client =
    connectionOrDb === db
      ? await getClientById(clientId)
      : await getClientByIdWithConnection(connectionOrDb, clientId)

  if (!client) return null

  const coBuyers = await getCoBuyersByClientId(clientId, connectionOrDb)
  const employmentDetails = await getEmploymentDetailsByClientId(
    clientId,
    connectionOrDb
  )
  const completion = getProfileCompletion(client, coBuyers)

  return {
    client,
    co_buyers: coBuyers,
    employment_details: employmentDetails,
    profile_completion: completion,
  }
}

const getClientByIdWithConnection = async (connectionOrDb, id) => {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      ${clientFields}
    ${clientJoins}
    WHERE c.id = ?
    GROUP BY
      c.id,
      c.full_name,
      c.spouse_co_owner_name,
      c.buyer_type,
      c.birth_date,
      c.place_of_birth,
      c.citizenship,
      c.gender,
      c.civil_status,
      c.email,
      c.contact_no,
      c.residence_phone_no,
      c.tin,
      c.address,
      c.present_address,
      c.present_zip_code,
      c.permanent_address,
      c.permanent_zip_code,
      c.region,
      c.profile_status,
      c.default_seller_id,
      seller.full_name,
      seller.seller_role,
      c.created_at,
      c.updated_at
    LIMIT 1
    `,
    [id]
  )

  return rows[0] || null
}

const updateProfileStatusAfterRelatedSave = async (connection, clientId) => {
  const client = await getClientByIdWithConnection(connection, clientId)
  const coBuyers = await getCoBuyersByClientId(clientId, connection)
  const completion = getProfileCompletion(client, coBuyers)
  const nextStatus =
    client.profile_status === 'complete' && !completion.isComplete
      ? 'incomplete'
      : client.profile_status

  if (nextStatus !== client.profile_status) {
    await connection.query(
      `
      UPDATE clients
      SET profile_status = ?
      WHERE id = ?
      `,
      [nextStatus, clientId]
    )
  }

  return {
    profileStatus: nextStatus,
    completion,
  }
}

const validateDefaultSeller = async (defaultSellerId) => {
  if (isMissing(defaultSellerId)) {
    return {
      isValid: true,
      message: null,
    }
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM accredited_sellers
    WHERE id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [defaultSellerId]
  )

  if (rows.length === 0) {
    return {
      isValid: false,
      message: 'Default seller not found or inactive',
    }
  }

  return {
    isValid: true,
    message: null,
  }
}

const buildPrincipalProfilePayload = (body, existingClient = {}) => {
  const buyerTypeValidation = validateEnumValue(
    body.buyer_type,
    allowedBuyerTypes,
    'buyer type',
    {
      defaultValue: existingClient.buyer_type || 'single',
    }
  )

  if (!buyerTypeValidation.isValid) return buyerTypeValidation

  const genderValidation = validateEnumValue(
    body.gender,
    allowedGenders,
    'gender'
  )

  if (!genderValidation.isValid) return genderValidation

  const civilStatusValidation = validateEnumValue(
    body.civil_status,
    allowedCivilStatuses,
    'civil status'
  )

  if (!civilStatusValidation.isValid) return civilStatusValidation

  const birthDateValidation = parseDateOnly(body.birth_date, 'Birth date')

  if (!birthDateValidation.isValid) return birthDateValidation

  const profileStatusValidation = validateEnumValue(
    body.profile_status,
    allowedProfileStatuses,
    'profile status'
  )

  if (!profileStatusValidation.isValid) return profileStatusValidation

  return {
    isValid: true,
    value: {
      full_name: isMissing(body.full_name)
        ? existingClient.full_name
        : body.full_name,
      spouse_co_owner_name: isMissing(body.spouse_co_owner_name)
        ? existingClient.spouse_co_owner_name
        : nullableValue(body.spouse_co_owner_name),
      buyer_type: buyerTypeValidation.value,
      birth_date: birthDateValidation.value,
      place_of_birth: nullableValue(body.place_of_birth),
      citizenship: nullableValue(body.citizenship),
      gender: genderValidation.value,
      civil_status: civilStatusValidation.value,
      email: nullableValue(body.email),
      contact_no: nullableValue(body.contact_no),
      residence_phone_no: nullableValue(body.residence_phone_no),
      tin: nullableValue(body.tin),
      address: isMissing(body.address)
        ? existingClient.address
        : nullableValue(body.address),
      present_address: nullableValue(body.present_address),
      present_zip_code: nullableValue(body.present_zip_code),
      permanent_address: nullableValue(body.permanent_address),
      permanent_zip_code: nullableValue(body.permanent_zip_code),
      region: isMissing(body.region)
        ? existingClient.region
        : nullableValue(body.region),
      requested_profile_status: profileStatusValidation.value,
    },
  }
}

const normalizeCoBuyerPayload = (buyer) => {
  const buyerRoleValidation = validateEnumValue(
    buyer.buyer_role,
    allowedBuyerRoles,
    'buyer role',
    { defaultValue: 'spouse' }
  )

  if (!buyerRoleValidation.isValid) return buyerRoleValidation

  const genderValidation = validateEnumValue(
    buyer.gender,
    allowedGenders,
    'gender'
  )

  if (!genderValidation.isValid) return genderValidation

  const civilStatusValidation = validateEnumValue(
    buyer.civil_status,
    allowedCivilStatuses,
    'civil status'
  )

  if (!civilStatusValidation.isValid) return civilStatusValidation

  const birthDateValidation = parseDateOnly(buyer.birth_date, 'Birth date')

  if (!birthDateValidation.isValid) return birthDateValidation

  return {
    isValid: true,
    value: {
      buyer_role: buyerRoleValidation.value,
      full_name: nullableValue(buyer.full_name),
      birth_date: birthDateValidation.value,
      place_of_birth: nullableValue(buyer.place_of_birth),
      citizenship: nullableValue(buyer.citizenship),
      gender: genderValidation.value,
      civil_status: civilStatusValidation.value,
      present_address: nullableValue(buyer.present_address),
      present_zip_code: nullableValue(buyer.present_zip_code),
      permanent_address: nullableValue(buyer.permanent_address),
      permanent_zip_code: nullableValue(buyer.permanent_zip_code),
      mobile_no: nullableValue(buyer.mobile_no),
      residence_phone_no: nullableValue(buyer.residence_phone_no),
      email: nullableValue(buyer.email),
      tin: nullableValue(buyer.tin),
    },
  }
}

const normalizeEmploymentPayload = (detail) => {
  const personTypeValidation = validateEnumValue(
    detail.person_type,
    allowedPersonTypes,
    'person type',
    { defaultValue: 'principal' }
  )

  if (!personTypeValidation.isValid) return personTypeValidation

  const employmentStatusValidation = validateEnumValue(
    detail.employment_status,
    allowedEmploymentStatuses,
    'employment status'
  )

  if (!employmentStatusValidation.isValid) return employmentStatusValidation

  const monthlyIncomeValidation = parseMoneyOrNull(
    detail.monthly_income,
    'Monthly income'
  )

  if (!monthlyIncomeValidation.isValid) return monthlyIncomeValidation

  return {
    isValid: true,
    value: {
      client_buyer_id: isMissing(detail.client_buyer_id)
        ? null
        : Number(detail.client_buyer_id),
      person_type: personTypeValidation.value,
      employment_status: employmentStatusValidation.value,
      employment_status_other: nullableValue(detail.employment_status_other),
      employer_business_name: nullableValue(detail.employer_business_name),
      employer_business_address: nullableValue(detail.employer_business_address),
      employer_zip_code: nullableValue(detail.employer_zip_code),
      nature_of_work_business: nullableValue(detail.nature_of_work_business),
      occupation_position_title: nullableValue(detail.occupation_position_title),
      monthly_income: monthlyIncomeValidation.value,
    },
  }
}

const coBuyerHasProfileValue = (buyer) => {
  if (!buyer || typeof buyer !== 'object') return false

  return [
    buyer.full_name,
    buyer.birth_date,
    buyer.place_of_birth,
    buyer.citizenship,
    buyer.gender,
    buyer.civil_status,
    buyer.present_address,
    buyer.present_zip_code,
    buyer.permanent_address,
    buyer.permanent_zip_code,
    buyer.mobile_no,
    buyer.residence_phone_no,
    buyer.email,
    buyer.tin,
  ].some(hasText)
}

const employmentHasProfileValue = (detail) => {
  if (!detail || typeof detail !== 'object') return false

  return [
    detail.employment_status,
    detail.employment_status_other,
    detail.employer_business_name,
    detail.employer_business_address,
    detail.employer_zip_code,
    detail.nature_of_work_business,
    detail.occupation_position_title,
    detail.monthly_income,
  ].some(hasText)
}

export const getClients = async (req, res) => {
  const { search, region, default_seller_id } = req.query

  const conditions = []
  const params = []

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`

    conditions.push(`
      (
        c.full_name LIKE ?
        OR c.spouse_co_owner_name LIKE ?
        OR c.email LIKE ?
        OR c.contact_no LIKE ?
        OR c.address LIKE ?
        OR c.region LIKE ?
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

  if (!isMissing(region) && region !== 'all') {
    conditions.push('c.region = ?')
    params.push(region)
  }

  if (!isMissing(default_seller_id) && default_seller_id !== 'all') {
    conditions.push('c.default_seller_id = ?')
    params.push(default_seller_id)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [clients] = await db.query(
    `
    SELECT
      ${clientFields}
    ${clientJoins}
    ${whereClause}
    GROUP BY
      c.id,
      c.full_name,
      c.spouse_co_owner_name,
      c.buyer_type,
      c.birth_date,
      c.place_of_birth,
      c.citizenship,
      c.gender,
      c.civil_status,
      c.email,
      c.contact_no,
      c.residence_phone_no,
      c.tin,
      c.address,
      c.present_address,
      c.present_zip_code,
      c.permanent_address,
      c.permanent_zip_code,
      c.region,
      c.profile_status,
      c.default_seller_id,
      seller.full_name,
      seller.seller_role,
      c.created_at,
      c.updated_at
    ORDER BY c.id DESC
    `,
    params
  )

  res.status(200).json({
    clients,
  })
}

export const getClient = async (req, res) => {
  const { id } = req.params

  const profile = await getClientProfilePayload(id)

  if (!profile) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  res.status(200).json({
    client: profile.client,
    co_buyers: profile.co_buyers,
    employment_details: profile.employment_details,
    profile_completion: profile.profile_completion,
  })
}

export const createClient = async (req, res) => {
  const {
    full_name,
    spouse_co_owner_name,
    email,
    contact_no,
    address,
    region,
    buyer_type = 'single',
    default_seller_id,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Client name is required',
    })
  }

  const buyerTypeValidation = validateEnumValue(
    buyer_type,
    allowedBuyerTypes,
    'buyer type',
    { required: true, defaultValue: 'single' }
  )

  if (!buyerTypeValidation.isValid) {
    return res.status(400).json({
      message: buyerTypeValidation.message,
    })
  }

  const sellerValidation = await validateDefaultSeller(default_seller_id)

  if (!sellerValidation.isValid) {
    return res.status(400).json({
      message: sellerValidation.message,
    })
  }

  const [result] = await db.query(
    `
    INSERT INTO clients (
      full_name,
      spouse_co_owner_name,
      buyer_type,
      email,
      contact_no,
      address,
      region,
      default_seller_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      full_name,
      nullableValue(spouse_co_owner_name),
      buyerTypeValidation.value,
      nullableValue(email),
      nullableValue(contact_no),
      nullableValue(address),
      nullableValue(region),
      nullableValue(default_seller_id),
    ]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'create',
    module: 'Clients',
    description: `Created client ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(201).json({
    message: 'Client created successfully',
    clientId: result.insertId,
  })
}

export const updateClient = async (req, res) => {
  const { id } = req.params

  const {
    full_name,
    spouse_co_owner_name,
    email,
    contact_no,
    address,
    region,
    buyer_type,
    default_seller_id,
  } = req.body

  if (isMissing(full_name)) {
    return res.status(400).json({
      message: 'Client name is required',
    })
  }

  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const buyerTypeValidation = validateEnumValue(
    buyer_type,
    allowedBuyerTypes,
    'buyer type',
    { defaultValue: existingClient.buyer_type || 'single' }
  )

  if (!buyerTypeValidation.isValid) {
    return res.status(400).json({
      message: buyerTypeValidation.message,
    })
  }

  const sellerValidation = await validateDefaultSeller(default_seller_id)

  if (!sellerValidation.isValid) {
    return res.status(400).json({
      message: sellerValidation.message,
    })
  }

  await db.query(
    `
    UPDATE clients
    SET
      full_name = ?,
      spouse_co_owner_name = ?,
      buyer_type = ?,
      email = ?,
      contact_no = ?,
      address = ?,
      region = ?,
      default_seller_id = ?
    WHERE id = ?
    `,
    [
      full_name,
      nullableValue(spouse_co_owner_name),
      buyerTypeValidation.value,
      nullableValue(email),
      nullableValue(contact_no),
      nullableValue(address),
      nullableValue(region),
      nullableValue(default_seller_id),
      id,
    ]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Clients',
    description: `Updated client ${full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Client updated successfully',
  })
}

export const updateClientProfile = async (req, res) => {
  const { id } = req.params

  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const profileValidation = buildPrincipalProfilePayload(req.body, existingClient)

  if (!profileValidation.isValid) {
    return res.status(400).json({
      message: profileValidation.message,
    })
  }

  const profile = profileValidation.value

  if (isMissing(profile.full_name)) {
    return res.status(400).json({
      message: 'Client name is required',
    })
  }

  const coBuyers = await getCoBuyersByClientId(id)
  const completion = getProfileCompletion(
    {
      ...existingClient,
      ...profile,
    },
    coBuyers
  )

  if (profile.requested_profile_status === 'complete' && !completion.isComplete) {
    return res.status(400).json({
      message: 'Buyer profile is incomplete',
      missing_fields: completion.missingFields,
      profile_completion: completion,
    })
  }

  const nextProfileStatus =
    completion.isComplete
      ? 'complete'
      : profile.requested_profile_status === 'incomplete'
        ? 'incomplete'
        : 'incomplete'

  await db.query(
    `
    UPDATE clients
    SET
      full_name = ?,
      spouse_co_owner_name = ?,
      buyer_type = ?,
      birth_date = ?,
      place_of_birth = ?,
      citizenship = ?,
      gender = ?,
      civil_status = ?,
      email = ?,
      contact_no = ?,
      residence_phone_no = ?,
      tin = ?,
      address = ?,
      present_address = ?,
      present_zip_code = ?,
      permanent_address = ?,
      permanent_zip_code = ?,
      region = ?,
      profile_status = ?
    WHERE id = ?
    `,
    [
      profile.full_name,
      profile.spouse_co_owner_name,
      profile.buyer_type,
      profile.birth_date,
      profile.place_of_birth,
      profile.citizenship,
      profile.gender,
      profile.civil_status,
      profile.email,
      profile.contact_no,
      profile.residence_phone_no,
      profile.tin,
      profile.address,
      profile.present_address,
      profile.present_zip_code,
      profile.permanent_address,
      profile.permanent_zip_code,
      profile.region,
      nextProfileStatus,
      id,
    ]
  )

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Buyer Profile',
    description: `Updated buyer profile for ${profile.full_name}`,
    ipAddress: getClientIp(req),
  })

  const payload = await getClientProfilePayload(id)

  res.status(200).json({
    message: 'Buyer profile updated successfully',
    ...payload,
  })
}

export const replaceClientCoBuyers = async (req, res) => {
  const { id } = req.params
  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const inputRows = Array.isArray(req.body)
    ? req.body
    : req.body.co_buyers || []

  if (!Array.isArray(inputRows)) {
    return res.status(400).json({
      message: 'Co-buyers must be an array',
    })
  }

  const normalizedRows = []

  for (const row of inputRows) {
    if (!coBuyerHasProfileValue(row)) continue

    const rowValidation = normalizeCoBuyerPayload(row)

    if (!rowValidation.isValid) {
      return res.status(400).json({
        message: rowValidation.message,
      })
    }

    normalizedRows.push(rowValidation.value)
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `DELETE FROM client_buyers WHERE client_id = ? AND client_unit_id IS NULL`,
      [id]
    )

    if (normalizedRows.length > 0) {
      const values = normalizedRows.map((row) => [
        id,
        row.buyer_role,
        row.full_name,
        row.birth_date,
        row.place_of_birth,
        row.citizenship,
        row.gender,
        row.civil_status,
        row.present_address,
        row.present_zip_code,
        row.permanent_address,
        row.permanent_zip_code,
        row.mobile_no,
        row.residence_phone_no,
        row.email,
        row.tin,
      ])

      await connection.query(
        `
        INSERT INTO client_buyers (
          client_id,
          buyer_role,
          full_name,
          birth_date,
          place_of_birth,
          citizenship,
          gender,
          civil_status,
          present_address,
          present_zip_code,
          permanent_address,
          permanent_zip_code,
          mobile_no,
          residence_phone_no,
          email,
          tin
        ) VALUES ?
        `,
        [values]
      )
    }

    await updateProfileStatusAfterRelatedSave(connection, id)
    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Buyer Profile',
    description: `Updated co-buyers for ${existingClient.full_name}`,
    ipAddress: getClientIp(req),
  })

  const payload = await getClientProfilePayload(id)

  res.status(200).json({
    message: 'Co-buyers updated successfully',
    ...payload,
  })
}

export const replaceClientEmploymentDetails = async (req, res) => {
  const { id } = req.params
  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const inputRows = Array.isArray(req.body)
    ? req.body
    : req.body.employment_details || []

  if (!Array.isArray(inputRows)) {
    return res.status(400).json({
      message: 'Employment details must be an array',
    })
  }

  const coBuyers = await getCoBuyersByClientId(id)
  const validCoBuyerIds = new Set(coBuyers.map((buyer) => Number(buyer.id)))
  const normalizedRows = []

  for (const row of inputRows) {
    if (!employmentHasProfileValue(row)) continue

    const rowValidation = normalizeEmploymentPayload(row)

    if (!rowValidation.isValid) {
      return res.status(400).json({
        message: rowValidation.message,
      })
    }

    if (
      !isMissing(rowValidation.value.client_buyer_id) &&
      !validCoBuyerIds.has(Number(rowValidation.value.client_buyer_id))
    ) {
      return res.status(400).json({
        message: 'Co-buyer employment row does not belong to this client',
      })
    }

    normalizedRows.push(rowValidation.value)
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `DELETE FROM client_employment_details WHERE client_id = ?`,
      [id]
    )

    if (normalizedRows.length > 0) {
      const values = normalizedRows.map((row) => [
        id,
        row.client_buyer_id,
        row.person_type,
        row.employment_status,
        row.employment_status_other,
        row.employer_business_name,
        row.employer_business_address,
        row.employer_zip_code,
        row.nature_of_work_business,
        row.occupation_position_title,
        row.monthly_income,
      ])

      await connection.query(
        `
        INSERT INTO client_employment_details (
          client_id,
          client_buyer_id,
          person_type,
          employment_status,
          employment_status_other,
          employer_business_name,
          employer_business_address,
          employer_zip_code,
          nature_of_work_business,
          occupation_position_title,
          monthly_income
        ) VALUES ?
        `,
        [values]
      )
    }

    await updateProfileStatusAfterRelatedSave(connection, id)
    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'update',
    module: 'Buyer Profile',
    description: `Updated employment details for ${existingClient.full_name}`,
    ipAddress: getClientIp(req),
  })

  const payload = await getClientProfilePayload(id)

  res.status(200).json({
    message: 'Employment details updated successfully',
    ...payload,
  })
}


export const deleteClient = async (req, res) => {
  const { id } = req.params

  const existingClient = await getClientById(id)

  if (!existingClient) {
    return res.status(404).json({
      message: 'Client not found',
    })
  }

  const [unitRows] = await db.query(
    `
    SELECT id
    FROM client_units
    WHERE client_id = ?
    LIMIT 1
    `,
    [id]
  )

  if (unitRows.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete a client that has active or historical reservations.',
    })
  }

  await db.query(`DELETE FROM clients WHERE id = ?`, [id])

  await safeCreateAuditLog({
    userId: req.user.id,
    action: 'delete',
    module: 'Clients',
    description: `Deleted client ${existingClient.full_name}`,
    ipAddress: getClientIp(req),
  })

  res.status(200).json({
    message: 'Client deleted successfully',
  })
}

