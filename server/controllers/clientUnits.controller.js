import { db } from '../db/connect.js'
import { createAuditLog } from '../utils/createAuditLog.js'
import { getClientIp } from '../utils/getClientIp.js'
import { createClientDocumentChecklistFromListing } from '../utils/documentRequirements.js'
import {
  createAutoCommissionForClientUnit,
  createHierarchyCommissionsForClientUnit,
  refreshCommissionEligibility,
} from './commissions.controller.js'

const allowedClientUnitStatuses = [
  'reserved',
  'active',
  'cancelled',
  'fully_paid',
  'closed',
]

const allowedSaleTypes = ['distributed', 'direct', 'direct_to_developer']
const allowedModeOfPayments = ['cash', 'installment']
const allowedBuyerTypes = ['single', 'spouses', 'and_account']
const allowedBuyerRoles = ['spouse', 'second_buyer']
const allowedGenders = ['male', 'female', 'other']
const allowedCivilStatuses = ['single', 'married', 'separated', 'annulled_divorced', 'widower']
const allowedEmploymentStatuses = [
  'employed_private',
  'employed_government',
  'employed_ngo',
  'self_employed_business',
  'self_employed_professional',
  'ofw_immigrant',
  'other',
]
const allowedPaymentTermsMonths = [12, 18, 20, 36, 60]
const defaultContractProcessingStatus = 'pending_profile'

const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

const nullableValue = (value) => {
  if (isMissing(value)) return null
  return value
}

const nullableNumber = (value) => {
  if (isMissing(value)) return null
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

const normalizeMoney = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const parseDateOnly = (value) => {
  if (isMissing(value)) return null

  const dateString = String(value).trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null

  const [year, month, day] = dateString.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null
  }

  return dateString
}

const getDueDayFromDate = (dateString) => {
  if (!dateString) return null
  return Number(dateString.slice(8, 10))
}

const validateNonNegativeMoney = (
  value,
  fieldName,
  { required = false, defaultValue = 0 } = {}
) => {
  if (isMissing(value)) {
    if (required) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
      }
    }

    return {
      isValid: true,
      value: normalizeMoney(defaultValue),
    }
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return {
      isValid: false,
      message: `${fieldName} must be a non-negative amount`,
    }
  }

  return {
    isValid: true,
    value: normalizeMoney(parsedValue),
  }
}

const validateNonNegativeRate = (value, fieldName, defaultValue = 0) => {
  if (isMissing(value)) {
    return {
      isValid: true,
      value: normalizeMoney(defaultValue),
    }
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return {
      isValid: false,
      message: `${fieldName} must be a non-negative percentage`,
    }
  }

  return {
    isValid: true,
    value: normalizeMoney(parsedValue),
  }
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
  if (saleType === 'direct') return 'direct_to_developer'
  if (!allowedSaleTypes.includes(saleType)) return 'distributed'
  return saleType
}

const validateModeOfPayment = (modeOfPayment) => {
  if (isMissing(modeOfPayment)) return 'installment'
  if (!allowedModeOfPayments.includes(modeOfPayment)) return 'installment'
  return modeOfPayment
}

const validateBuyerType = (buyerType) => {
  if (isMissing(buyerType)) return 'single'
  return allowedBuyerTypes.includes(buyerType) ? buyerType : 'single'
}

const nullableEnum = (value, allowedValues) => {
  if (isMissing(value)) return null
  return allowedValues.includes(value) ? value : null
}

const normalizeCoBuyerPayload = (coBuyer = {}, buyerType = 'single') => {
  if (buyerType === 'single') return null

  return {
    buyer_role: nullableEnum(coBuyer.buyer_role, allowedBuyerRoles) ||
      (buyerType === 'spouses' ? 'spouse' : 'second_buyer'),
    full_name: nullableValue(coBuyer.full_name),
    birth_date: parseDateOnly(coBuyer.birth_date),
    place_of_birth: nullableValue(coBuyer.place_of_birth),
    citizenship: nullableValue(coBuyer.citizenship),
    gender: nullableEnum(coBuyer.gender, allowedGenders),
    civil_status: nullableEnum(coBuyer.civil_status, allowedCivilStatuses),
    present_address: nullableValue(coBuyer.present_address),
    present_zip_code: nullableValue(coBuyer.present_zip_code),
    permanent_address: nullableValue(coBuyer.permanent_address),
    permanent_zip_code: nullableValue(coBuyer.permanent_zip_code),
    mobile_no: nullableValue(coBuyer.mobile_no),
    residence_phone_no: nullableValue(coBuyer.residence_phone_no),
    email: nullableValue(coBuyer.email),
    tin: nullableValue(coBuyer.tin),
  }
}

const normalizeEmploymentPayload = (employment = {}) => {
  return {
    employment_status: nullableEnum(employment.employment_status, allowedEmploymentStatuses),
    employment_status_other: nullableValue(employment.employment_status_other),
    employer_business_name: nullableValue(employment.employer_business_name),
    employer_business_address: nullableValue(employment.employer_business_address),
    employer_zip_code: nullableValue(employment.employer_zip_code),
    nature_of_work_business: nullableValue(employment.nature_of_work_business),
    occupation_position_title: nullableValue(employment.occupation_position_title),
    monthly_income: nullableNumber(employment.monthly_income),
  }
}

const hasEmploymentPayload = (employment) => {
  if (!employment) return false

  return [
    employment.employment_status,
    employment.employment_status_other,
    employment.employer_business_name,
    employment.employer_business_address,
    employment.employer_zip_code,
    employment.nature_of_work_business,
    employment.occupation_position_title,
    employment.monthly_income,
  ].some((value) => !isMissing(value))
}

const replaceClientUnitCoBuyer = async ({
  connection,
  clientId,
  clientUnitId,
  buyerType,
  coBuyer,
  coBuyerEmployment = null,
}) => {
  await connection.query(
    `DELETE FROM client_buyers WHERE client_id = ? AND client_unit_id = ?`,
    [clientId, clientUnitId]
  )

  if (buyerType === 'single') return null

  const normalizedCoBuyer = normalizeCoBuyerPayload(coBuyer, buyerType)

  const [result] = await connection.query(
    `
    INSERT INTO client_buyers (
      client_id,
      client_unit_id,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      clientId,
      clientUnitId,
      normalizedCoBuyer.buyer_role,
      normalizedCoBuyer.full_name,
      normalizedCoBuyer.birth_date,
      normalizedCoBuyer.place_of_birth,
      normalizedCoBuyer.citizenship,
      normalizedCoBuyer.gender,
      normalizedCoBuyer.civil_status,
      normalizedCoBuyer.present_address,
      normalizedCoBuyer.present_zip_code,
      normalizedCoBuyer.permanent_address,
      normalizedCoBuyer.permanent_zip_code,
      normalizedCoBuyer.mobile_no,
      normalizedCoBuyer.residence_phone_no,
      normalizedCoBuyer.email,
      normalizedCoBuyer.tin,
    ]
  )

  const clientBuyerId = result.insertId

  if (hasEmploymentPayload(coBuyerEmployment)) {
    const normalizedEmployment = normalizeEmploymentPayload(coBuyerEmployment)

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
      ) VALUES (?, ?, 'co_buyer', ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clientId,
        clientBuyerId,
        normalizedEmployment.employment_status,
        normalizedEmployment.employment_status_other,
        normalizedEmployment.employer_business_name,
        normalizedEmployment.employer_business_address,
        normalizedEmployment.employer_zip_code,
        normalizedEmployment.nature_of_work_business,
        normalizedEmployment.occupation_position_title,
        normalizedEmployment.monthly_income,
      ]
    )
  }

  return clientBuyerId
}

const getListingPurchasePrice = (listing) => {
  const totalContractPrice = normalizeMoney(listing.total_contract_price)

  if (totalContractPrice > 0) return totalContractPrice

  return normalizeMoney(
    Number(listing.net_selling_price || 0) + Number(listing.legal_misc_fee || 0)
  )
}

const calculateMonthlyAmortization = ({
  balance,
  termsMonths,
  interestRate,
}) => {
  if (!termsMonths) return null

  const balanceWithInterest = normalizeMoney(
    balance + balance * (Number(interestRate || 0) / 100)
  )

  return normalizeMoney(balanceWithInterest / termsMonths)
}

const buildReservationTerms = ({
  listing,
  modeOfPayment,
  startingDate,
  dueDate,
  reservationFeeAmount,
  downpaymentAmount,
  deferredCashAmount,
  paymentTermsMonths,
  interestRate,
  monthlyAmortization,
  downpaymentPercent,
  downpaymentGives,
  downpaymentDiscountRate,
}) => {
  if (isMissing(modeOfPayment) || !allowedModeOfPayments.includes(modeOfPayment)) {
    return {
      isValid: false,
      message: 'Mode of payment is required',
    }
  }

  const finalStartingDate = parseDateOnly(startingDate)

  if (!finalStartingDate) {
    return {
      isValid: false,
      message: 'Starting date is required',
    }
  }

  const finalDueDate = parseDateOnly(dueDate)

  if (!finalDueDate) {
    return {
      isValid: false,
      message: 'First due date is required',
    }
  }

  const reservationFeeValidation = validateNonNegativeMoney(
    reservationFeeAmount,
    'Reservation fee',
    { required: true }
  )

  if (!reservationFeeValidation.isValid) {
    return reservationFeeValidation
  }

  const purchasePrice = getListingPurchasePrice(listing)
  const isInstallment = modeOfPayment === 'installment'

  const downpaymentPercentValidation = isInstallment
    ? validateNonNegativeRate(
        isMissing(downpaymentPercent) ? 30 : downpaymentPercent,
        'Downpayment percentage'
      )
    : {
        isValid: true,
        value: 0,
      }

  if (!downpaymentPercentValidation.isValid) {
    return downpaymentPercentValidation
  }

  const parsedDownpaymentGives = isInstallment
    ? Number(isMissing(downpaymentGives) ? 3 : downpaymentGives)
    : 0

  if (isInstallment && (!Number.isInteger(parsedDownpaymentGives) || parsedDownpaymentGives < 1 || parsedDownpaymentGives > 60)) {
    return {
      isValid: false,
      message: 'Downpayment gives must be between 1 and 60',
    }
  }

  const downpaymentDiscountRateValidation = isInstallment
    ? validateNonNegativeRate(
        parsedDownpaymentGives === 1
          ? isMissing(downpaymentDiscountRate)
            ? 0
            : downpaymentDiscountRate
          : 0,
        'Downpayment discount'
      )
    : {
        isValid: true,
        value: 0,
      }

  if (!downpaymentDiscountRateValidation.isValid) {
    return downpaymentDiscountRateValidation
  }

  let computedDownpaymentGross = 0
  let computedDownpaymentDiscountAmount = 0
  let computedDownpaymentNet = 0

  if (isInstallment) {
    const targetDownpayment = normalizeMoney(purchasePrice * (downpaymentPercentValidation.value / 100))
    computedDownpaymentGross = normalizeMoney(Math.max(targetDownpayment - reservationFeeValidation.value, 0))
    computedDownpaymentDiscountAmount = parsedDownpaymentGives === 1
      ? normalizeMoney(computedDownpaymentGross * (downpaymentDiscountRateValidation.value / 100))
      : 0
    computedDownpaymentNet = normalizeMoney(Math.max(computedDownpaymentGross - computedDownpaymentDiscountAmount, 0))
  }

  const downpaymentValidation = isInstallment
    ? {
        isValid: true,
        value: computedDownpaymentNet,
      }
    : {
        isValid: true,
        value: 0,
      }

  const deferredCashValidation =
    modeOfPayment === 'cash'
      ? validateNonNegativeMoney(deferredCashAmount, 'Deferred cash amount')
      : {
          isValid: true,
          value: 0,
        }

  if (!deferredCashValidation.isValid) {
    return deferredCashValidation
  }

  let finalPaymentTermsMonths = null
  let finalInterestRate = 0
  let finalMonthlyAmortization = null

  if (isInstallment) {
    const parsedTermsMonths = Number(paymentTermsMonths)

    if (!Number.isInteger(parsedTermsMonths) || parsedTermsMonths < 1 || parsedTermsMonths > 120) {
      return {
        isValid: false,
        message: 'Payment terms must be between 1 and 120 months',
      }
    }

    finalPaymentTermsMonths = parsedTermsMonths

    const interestRateValidation = validateNonNegativeRate(
      interestRate,
      'Interest rate'
    )

    if (!interestRateValidation.isValid) {
      return interestRateValidation
    }

    finalInterestRate = interestRateValidation.value
  }

  const offerBalanceAmount = normalizeMoney(
    purchasePrice -
      reservationFeeValidation.value -
      downpaymentValidation.value -
      deferredCashValidation.value
  )

  if (offerBalanceAmount < 0) {
    return {
      isValid: false,
      message:
        'Reservation fee, downpayment, and deferred cash amount cannot exceed purchase price',
    }
  }

  if (isInstallment) {
    const computedMonthlyAmortization = calculateMonthlyAmortization({
      balance: offerBalanceAmount,
      termsMonths: finalPaymentTermsMonths,
      interestRate: finalInterestRate,
    })

    const monthlyAmortizationValidation = isMissing(monthlyAmortization)
      ? {
          isValid: true,
          value: computedMonthlyAmortization,
        }
      : validateNonNegativeMoney(monthlyAmortization, 'Monthly amortization')

    if (!monthlyAmortizationValidation.isValid) {
      return monthlyAmortizationValidation
    }

    finalMonthlyAmortization = monthlyAmortizationValidation.value
  }

  return {
    isValid: true,
    value: {
      startingDate: finalStartingDate,
      dueDate: finalDueDate,
      dueDay: getDueDayFromDate(finalDueDate),
      offerPurchasePrice: purchasePrice,
      reservationFeeAmount: reservationFeeValidation.value,
      downpaymentAmount: downpaymentValidation.value,
      downpaymentPercent: downpaymentPercentValidation.value,
      downpaymentGives: parsedDownpaymentGives,
      downpaymentDiscountRate: downpaymentDiscountRateValidation.value,
      downpaymentDiscountAmount: computedDownpaymentDiscountAmount,
      downpaymentNetAmount: computedDownpaymentNet,
      deferredCashAmount: deferredCashValidation.value,
      offerBalanceAmount,
      paymentTermsMonths: finalPaymentTermsMonths,
      interestRate: finalInterestRate,
      monthlyAmortization: finalMonthlyAmortization,
      contractProcessingStatus: defaultContractProcessingStatus,
    },
  }
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
  cu.buyer_type,
  unit_co_buyer.id AS co_buyer_id,
  unit_co_buyer.buyer_role AS co_buyer_role,
  unit_co_buyer.full_name AS co_buyer_name,
  DATE_FORMAT(unit_co_buyer.birth_date, '%Y-%m-%d') AS co_buyer_birth_date,
  unit_co_buyer.place_of_birth AS co_buyer_place_of_birth,
  unit_co_buyer.citizenship AS co_buyer_citizenship,
  unit_co_buyer.gender AS co_buyer_gender,
  unit_co_buyer.civil_status AS co_buyer_civil_status,
  unit_co_buyer.present_address AS co_buyer_present_address,
  unit_co_buyer.present_zip_code AS co_buyer_present_zip_code,
  unit_co_buyer.permanent_address AS co_buyer_permanent_address,
  unit_co_buyer.permanent_zip_code AS co_buyer_permanent_zip_code,
  unit_co_buyer.mobile_no AS co_buyer_mobile_no,
  unit_co_buyer.residence_phone_no AS co_buyer_residence_phone_no,
  unit_co_buyer.email AS co_buyer_email,
  unit_co_buyer.tin AS co_buyer_tin,
  unit_co_buyer_work.employment_status AS co_buyer_employment_status,
  unit_co_buyer_work.employment_status_other AS co_buyer_employment_status_other,
  unit_co_buyer_work.employer_business_name AS co_buyer_employer_business_name,
  unit_co_buyer_work.employer_business_address AS co_buyer_employer_business_address,
  unit_co_buyer_work.employer_zip_code AS co_buyer_employer_zip_code,
  unit_co_buyer_work.nature_of_work_business AS co_buyer_nature_of_work_business,
  unit_co_buyer_work.occupation_position_title AS co_buyer_occupation_position_title,
  unit_co_buyer_work.monthly_income AS co_buyer_monthly_income,
  cu.due_day,
  CASE
    WHEN cu.due_day IS NULL THEN NULL
    WHEN DAY(CURDATE()) <= LEAST(cu.due_day, DAY(LAST_DAY(CURDATE()))) THEN
      STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-', LPAD(LEAST(cu.due_day, DAY(LAST_DAY(CURDATE()))), 2, '0')), '%Y-%m-%d')
    ELSE
      STR_TO_DATE(CONCAT(YEAR(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), '-', LPAD(MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 2, '0'), '-', LPAD(LEAST(cu.due_day, DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)))), 2, '0')), '%Y-%m-%d')
  END AS next_due_date,
  CASE
    WHEN cu.due_day IS NULL THEN NULL
    ELSE DATEDIFF(
      CASE
        WHEN DAY(CURDATE()) <= LEAST(cu.due_day, DAY(LAST_DAY(CURDATE()))) THEN
          STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-', LPAD(LEAST(cu.due_day, DAY(LAST_DAY(CURDATE()))), 2, '0')), '%Y-%m-%d')
        ELSE
          STR_TO_DATE(CONCAT(YEAR(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), '-', LPAD(MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 2, '0'), '-', LPAD(LEAST(cu.due_day, DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)))), 2, '0')), '%Y-%m-%d')
      END,
      CURDATE()
    )
  END AS days_until_due,
  DATE_FORMAT(cu.starting_date, '%Y-%m-%d') AS starting_date,
  DATE_FORMAT(cu.due_date, '%Y-%m-%d') AS due_date,
  cu.offer_purchase_price,
  cu.reservation_fee_amount,
  cu.downpayment_amount,
  cu.downpayment_percent,
  cu.downpayment_gives,
  cu.downpayment_discount_rate,
  cu.downpayment_discount_amount,
  cu.downpayment_net_amount,
  cu.deferred_cash_amount,
  cu.offer_balance_amount,
  cu.payment_terms_months,
  cu.interest_rate,
  cu.monthly_amortization,
  cu.contract_processing_status,
  cu.status,
  cu.assigned_user_id,
  u.full_name AS assigned_user_name,
  cu.seller_id,
  seller.full_name AS seller_name,
  seller.seller_role AS seller_role,
  seller.commission_rate AS seller_commission_rate,
  COALESCE(parent_seller.full_name, seller.custom_reports_under, 'None') AS reports_under,
  COALESCE(document_summary.total_count, 0) AS document_total_count,
  COALESCE(document_summary.checklist_count, 0) AS document_checklist_count,
  COALESCE(document_summary.required_count, 0) AS document_required_count,
  COALESCE(document_summary.submitted_count, 0) AS document_submitted_count,
  COALESCE(document_summary.submitted_required_count, 0) AS document_submitted_required_count,
  COALESCE(document_summary.approved_count, 0) AS document_approved_count,
  COALESCE(document_summary.rejected_count, 0) AS document_rejected_count,
  CASE
    WHEN COALESCE(document_summary.required_count, 0) > 0
      AND COALESCE(document_summary.submitted_required_count, 0) >= document_summary.required_count
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
  LEFT JOIN client_buyers unit_co_buyer
    ON unit_co_buyer.client_unit_id = cu.id
  LEFT JOIN client_employment_details unit_co_buyer_work
    ON unit_co_buyer_work.client_buyer_id = unit_co_buyer.id
    AND unit_co_buyer_work.person_type = 'co_buyer'
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
      COUNT(cdl.id) AS total_count,
      COUNT(cdl.id) AS checklist_count,
      SUM(CASE WHEN COALESCE(cdl.is_required, d.is_required) = TRUE THEN 1 ELSE 0 END) AS required_count,
      SUM(
        CASE
          WHEN cdl.status IN ('submitted', 'approved') THEN 1
          ELSE 0
        END
      ) AS submitted_count,
      SUM(
        CASE
          WHEN COALESCE(cdl.is_required, d.is_required) = TRUE
            AND cdl.status IN ('submitted', 'approved')
          THEN 1
          ELSE 0
        END
      ) AS submitted_required_count,
      SUM(CASE WHEN cdl.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN cdl.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
    FROM client_units cu_docs
    LEFT JOIN client_document_list cdl
      ON cdl.client_unit_id = cu_docs.id
    LEFT JOIN documents d
      ON d.id = cdl.document_id
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
  const [clientUnitRows] = await connectionOrDb.query(
    `SELECT id, listing_id FROM client_units WHERE id = ? LIMIT 1`,
    [clientUnitId]
  )

  return createClientDocumentChecklistFromListing(connectionOrDb, clientUnitRows[0])
}

const createReservationCommissions = async ({
  connection,
  clientUnitId,
  listing,
  sellerId,
  mainRateOverride,
  saleType,
  cashKaliwaanAmount,
  cashKaliwaanDate,
  cashKaliwaanNotes,
  actorRole,
}) => {
  if (isMissing(sellerId)) {
    return []
  }

  if (saleType === 'direct' || saleType === 'direct_to_developer') {
    const mainCommission = await createAutoCommissionForClientUnit({
      connection,
      clientUnitId,
      sellerId,
      rateOverride: mainRateOverride,
      commissionRole: null,
      sourceType: 'main',
      parentCommissionId: null,
      saleType: saleType === 'direct' ? 'direct_to_developer' : saleType,
      cashKaliwaanAmount,
      cashKaliwaanDate,
      cashKaliwaanNotes,
      notes: `Direct-to-developer commission from reservation of ${listing.unit_id}`,
      actorRole,
    })

    return mainCommission ? [mainCommission] : []
  }

  return createHierarchyCommissionsForClientUnit({
    connection,
    clientUnitId,
    sellerId,
    saleType: 'distributed',
    notes: `Auto-generated hierarchy commission from reservation of ${listing.unit_id}`,
    actorRole,
  })
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
      COALESCE(document_summary.total_count, 0) AS document_total_count,
      COALESCE(document_summary.checklist_count, 0) AS document_checklist_count,
      COALESCE(document_summary.required_count, 0) AS document_required_count,
      COALESCE(document_summary.submitted_count, 0) AS document_submitted_count,
      COALESCE(document_summary.submitted_required_count, 0) AS document_submitted_required_count,
      COALESCE(document_summary.approved_count, 0) AS document_approved_count,
      COALESCE(document_summary.rejected_count, 0) AS document_rejected_count,
      CASE
        WHEN COALESCE(document_summary.required_count, 0) > 0
          AND COALESCE(document_summary.submitted_required_count, 0) >= document_summary.required_count
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
        COUNT(cdl.id) AS total_count,
        COUNT(cdl.id) AS checklist_count,
        SUM(CASE WHEN COALESCE(cdl.is_required, d.is_required) = TRUE THEN 1 ELSE 0 END) AS required_count,
        SUM(CASE WHEN cdl.status IN ('submitted', 'approved') THEN 1 ELSE 0 END) AS submitted_count,
        SUM(
          CASE
            WHEN COALESCE(cdl.is_required, d.is_required) = TRUE
              AND cdl.status IN ('submitted', 'approved')
            THEN 1
            ELSE 0
          END
        ) AS submitted_required_count,
        SUM(CASE WHEN cdl.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN cdl.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
      FROM client_units cu_docs
      LEFT JOIN client_document_list cdl
        ON cdl.client_unit_id = cu_docs.id
      LEFT JOIN documents d
        ON d.id = cdl.document_id
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
    status = 'reserved',
    mode_of_payment,
    buyer_type = 'single',
    co_buyer = null,
    co_buyer_employment = null,
    starting_date,
    due_date,
    reservation_fee_amount,
    downpayment_amount = 0,
    downpayment_percent = 30,
    downpayment_gives = 3,
    downpayment_discount_rate = 0,
    deferred_cash_amount = 0,
    payment_terms_months,
    interest_rate = 0,
    monthly_amortization,
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

  if (isMissing(mode_of_payment) || !allowedModeOfPayments.includes(mode_of_payment)) {
    return res.status(400).json({
      message: 'Mode of payment is required',
    })
  }


  const finalSaleType = validateSaleType(sale_type)
  const finalModeOfPayment = mode_of_payment
  const finalBuyerType = validateBuyerType(buyer_type)

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

    const reservationTerms = buildReservationTerms({
      listing,
      modeOfPayment: finalModeOfPayment,
      startingDate: starting_date,
      dueDate: due_date,
      reservationFeeAmount: reservation_fee_amount,
      downpaymentAmount: downpayment_amount,
      downpaymentPercent: downpayment_percent,
      downpaymentGives: downpayment_gives,
      downpaymentDiscountRate: downpayment_discount_rate,
      deferredCashAmount: deferred_cash_amount,
      paymentTermsMonths: payment_terms_months,
      interestRate: interest_rate,
      monthlyAmortization: monthly_amortization,
    })

    if (!reservationTerms.isValid) {
      await connection.rollback()
      return res.status(400).json({
        message: reservationTerms.message,
      })
    }

    const terms = reservationTerms.value

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

    const [result] = await connection.query(
      `
      INSERT INTO client_units (
        client_id,
        listing_id,
        assigned_user_id,
        seller_id,
        status,
        mode_of_payment,
        buyer_type,
        balance,
        due_day,
        starting_date,
        due_date,
        offer_purchase_price,
        reservation_fee_amount,
        downpayment_amount,
        downpayment_percent,
        downpayment_gives,
        downpayment_discount_rate,
        downpayment_discount_amount,
        downpayment_net_amount,
        deferred_cash_amount,
        offer_balance_amount,
        payment_terms_months,
        interest_rate,
        monthly_amortization,
        contract_processing_status,
        sale_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        clientId,
        listing_id,
        nullableValue(assigned_user_id || req.user.id),
        finalSellerId,
        status,
        finalModeOfPayment,
        finalBuyerType,
        terms.offerBalanceAmount,
        terms.dueDay,
        terms.startingDate,
        terms.dueDate,
        terms.offerPurchasePrice,
        terms.reservationFeeAmount,
        terms.downpaymentAmount,
        terms.downpaymentPercent,
        terms.downpaymentGives,
        terms.downpaymentDiscountRate,
        terms.downpaymentDiscountAmount,
        terms.downpaymentNetAmount,
        terms.deferredCashAmount,
        terms.offerBalanceAmount,
        terms.paymentTermsMonths,
        terms.interestRate,
        terms.monthlyAmortization,
        terms.contractProcessingStatus,
        finalSaleType,
      ]
    )

    const clientUnitId = result.insertId

    await replaceClientUnitCoBuyer({
      connection,
      clientId,
      clientUnitId,
      buyerType: finalBuyerType,
      coBuyer: co_buyer,
      coBuyerEmployment: co_buyer_employment,
    })

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
      cashKaliwaanAmount: cash_kaliwaan_amount,
      cashKaliwaanDate: cash_kaliwaan_date,
      cashKaliwaanNotes: cash_kaliwaan_notes,
      actorRole: req.user.role,
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
        starting_date: terms.startingDate,
        due_date: terms.dueDate,
        due_day: terms.dueDay,
        offer_purchase_price: terms.offerPurchasePrice,
        reservation_fee_amount: terms.reservationFeeAmount,
        downpayment_amount: terms.downpaymentAmount,
        downpayment_percent: terms.downpaymentPercent,
        downpayment_gives: terms.downpaymentGives,
        downpayment_discount_rate: terms.downpaymentDiscountRate,
        downpayment_discount_amount: terms.downpaymentDiscountAmount,
        downpayment_net_amount: terms.downpaymentNetAmount,
        deferred_cash_amount: terms.deferredCashAmount,
        offer_balance_amount: terms.offerBalanceAmount,
        payment_terms_months: terms.paymentTermsMonths,
        interest_rate: terms.interestRate,
        monthly_amortization: terms.monthlyAmortization,
        contract_processing_status: terms.contractProcessingStatus,
        sale_type: finalSaleType,
        buyer_type: finalBuyerType,
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
    due_date,
    status,
    mode_of_payment,
    buyer_type,
    co_buyer = null,
    co_buyer_employment = null,
    regenerate_commission = false,
    main_commission_rate_override,
    sale_type,
    override_seller_id,
    override_rate,
    override_notes,
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

  const parsedDueDate = isMissing(due_date) ? null : parseDateOnly(due_date)

  if (!isMissing(due_date) && !parsedDueDate) {
    return res.status(400).json({
      message: 'First due date must be a valid YYYY-MM-DD date',
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

  const finalSaleType = validateSaleType(
    isMissing(sale_type)
      ? existingClientUnit.sale_type
      : sale_type
  )

  const finalBuyerType = validateBuyerType(
    isMissing(buyer_type)
      ? existingClientUnit.buyer_type
      : buyer_type
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

    const nextDueDate = !isMissing(due_date)
      ? parsedDueDate
      : existingClientUnit.due_date

    const nextDueDay = !isMissing(due_date)
      ? getDueDayFromDate(parsedDueDate)
      : isMissing(due_day)
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
        due_date = ?,
        status = ?,
        mode_of_payment = ?,
        buyer_type = ?
      WHERE id = ?
      `,
      [
        nextAssignedUserId,
        nullableValue(finalSellerId),
        nextDueDay,
        nullableValue(nextDueDate),
        finalStatus,
        finalModeOfPayment,
        finalBuyerType,
        id,
      ]
    )

    await replaceClientUnitCoBuyer({
      connection,
      clientId: existingClientUnit.client_id,
      clientUnitId: id,
      buyerType: finalBuyerType,
      coBuyer: co_buyer,
      coBuyerEmployment: co_buyer_employment,
    })

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

    if (!isMissing(sale_type)) {
      await connection.query(
        `UPDATE client_units SET sale_type = ? WHERE id = ?`,
        [finalSaleType, id]
      )
    }

    if (regenerate_commission && !isMissing(finalSellerId)) {
      const [cashAdvanceRows] = await connection.query(
        `
        SELECT COUNT(id) AS cash_advance_count
        FROM cash_advances
        WHERE client_unit_id = ?
          AND status IN ('pending', 'approved', 'partially_deducted', 'deducted')
        `,
        [id]
      )

      if (Number(cashAdvanceRows[0]?.cash_advance_count || 0) > 0) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Cannot recalculate commissions while this unit has pending, approved, or deducted cash advances. Cancel or settle the cash advance first.',
        })
      }

      if (releasedCount > 0) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Cannot recalculate commissions after a commission release has been paid.',
        })
      }

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
        SET
          status = 'cancelled',
          notes = CONCAT(COALESCE(notes, ''), CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE '\n' END, 'Cancelled before commission recalculation.')
        WHERE client_unit_id = ?
          AND status <> 'released'
        `,
        [id]
      )

      const listing = await getListingById(connection, existingClientUnit.listing_id)

      regeneratedCommission = await createReservationCommissions({
        connection,
        clientUnitId: id,
        listing,
        sellerId: finalSellerId,
        mainRateOverride: main_commission_rate_override,
        saleType: finalSaleType,
        cashKaliwaanAmount: 0,
        cashKaliwaanDate: null,
        cashKaliwaanNotes: null,
        actorRole: req.user.role,
      })
    }

    await refreshCommissionEligibility(id, connection, {
      actorRole: req.user.role,
    })

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

    let regeneratedCommission = null

    if (regenerate_commission && !isMissing(existingClientUnit.seller_id)) {
      const [cashAdvanceRows] = await connection.query(
        `
        SELECT COUNT(id) AS cash_advance_count
        FROM cash_advances
        WHERE client_unit_id = ?
          AND status IN ('pending', 'approved', 'partially_deducted', 'deducted')
        `,
        [id]
      )

      if (Number(cashAdvanceRows[0]?.cash_advance_count || 0) > 0) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Cannot change unit and recalculate commissions while this unit has pending, approved, or deducted cash advances. Cancel or settle the cash advance first.',
        })
      }

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
        SET
          status = 'cancelled',
          notes = CONCAT(COALESCE(notes, ''), CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE '\n' END, 'Cancelled before unit-change commission recalculation.')
        WHERE client_unit_id = ?
          AND status <> 'released'
        `,
        [id]
      )

      regeneratedCommission = await createReservationCommissions({
        connection,
        clientUnitId: id,
        listing: newListing,
        sellerId: existingClientUnit.seller_id,
        mainRateOverride: null,
        saleType: existingClientUnit.sale_type || 'distributed',
        cashKaliwaanAmount: 0,
        cashKaliwaanDate: null,
        cashKaliwaanNotes: null,
        actorRole: req.user.role,
      })
    }

    await refreshCommissionEligibility(id, connection, {
      actorRole: req.user.role,
    })

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
