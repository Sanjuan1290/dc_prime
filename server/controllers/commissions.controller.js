  import { db } from '../db/connect.js'
  import { createAuditLog } from '../utils/createAuditLog.js'
  import { getClientIp } from '../utils/getClientIp.js'
  import { getVisibleSellerIdsForUser, isOfficeRole } from '../utils/sellerVisibility.js'

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

  const normalizeRate = (value) => {
    return Number(Number(value || 0).toFixed(2))
  }

  const calculateGrossCommission = (commissionBase, rate) => {
    return normalizeMoney(normalizeMoney(commissionBase) * (normalizeRate(rate) / 100))
  }

  const canPromoteRetentionEligibility = (options = {}) => {
    // Stage 1 guard. Later RBAC can replace this role string check.
    return options.actorRole === 'super_admin'
  }

  const commissionFields = `
    cm.id,
    cm.client_unit_id,
    cm.seller_id,
    cm.commission_role,
    cm.source_type,
    cm.parent_commission_id,
    cm.sale_type,
    cm.cash_kaliwaan_amount,
    cm.cash_kaliwaan_date,
    cm.cash_kaliwaan_notes,
    cm.override_notes,
    seller.full_name AS seller_name,
    seller.seller_role,
    COALESCE(parent.full_name, seller.custom_reports_under, 'None') AS reports_under,
    client.full_name AS client_name,
    listing.unit_id,
    project.name AS project_name,
    COALESCE(cu.mode_of_payment, '-') AS mode_of_payment,
    listing.lot_area_sqm,
    listing.price_per_sqm,
    listing.net_selling_price,
    listing.legal_misc_fee,
    listing.total_contract_price,
    cm.commission_base,
    cm.gross_commission,
    cm.rate,
    COALESCE(release_summary.eligible_amount, 0) AS eligible_amount,
    COALESCE(release_summary.released_amount, 0) AS released_amount,
    COALESCE(release_summary.cash_advance_deduction, 0) AS cash_advance_deduction,
    COALESCE(cash_advance_summary.cash_advance_amount, 0) AS cash_advance_amount,
    COALESCE(cash_advance_summary.cash_advance_remaining, 0) AS cash_advance_remaining,
    COALESCE(cash_advance_summary.cash_advance_deducted, 0) AS cash_advance_deducted,
    GREATEST(
      cm.gross_commission
      - COALESCE(release_summary.released_amount, 0)
      - COALESCE(release_summary.cash_advance_deduction, 0),
      0
    ) AS remaining_amount,
    COALESCE(release_summary.total_released_percent, 0) AS total_released_percent,
    COALESCE(release_summary.first_release_amount, 0) AS first_release_amount,
    COALESCE(release_summary.second_release_amount, 0) AS second_release_amount,
    COALESCE(release_summary.third_release_amount, 0) AS third_release_amount,
    COALESCE(release_summary.fourth_release_amount, 0) AS fourth_release_amount,
    COALESCE(release_summary.retention_amount, 0) AS retention_amount,
    release_summary.first_release_status,
    release_summary.second_release_status,
    release_summary.third_release_status,
    release_summary.fourth_release_status,
    release_summary.retention_status,
    payment_summary.total_paid,
    payment_summary.payment_percentage,
    cm.status,
    cm.notes,
    cm.created_at,
    cm.updated_at
  `

  const commissionJoins = `
    FROM commissions cm
    INNER JOIN client_units cu ON cu.id = cm.client_unit_id
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    INNER JOIN projects project ON project.id = listing.project_id
    INNER JOIN accredited_sellers seller ON seller.id = cm.seller_id
    LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
    LEFT JOIN (
      SELECT
        commission_id,
        SUM(CASE WHEN status = 'eligible' THEN net_release_amount ELSE 0 END) AS eligible_amount,
        SUM(CASE WHEN status = 'released' THEN net_release_amount ELSE 0 END) AS released_amount,
        SUM(cash_advance_deduction) AS cash_advance_deduction,
        SUM(CASE WHEN status = 'released' THEN release_percent ELSE 0 END) AS total_released_percent,

        MAX(CASE WHEN release_stage = '1st_release' THEN net_release_amount ELSE 0 END) AS first_release_amount,
        MAX(CASE WHEN release_stage = '2nd_release' THEN net_release_amount ELSE 0 END) AS second_release_amount,
        MAX(CASE WHEN release_stage = '3rd_release' THEN net_release_amount ELSE 0 END) AS third_release_amount,
        MAX(CASE WHEN release_stage = '4th_release' THEN net_release_amount ELSE 0 END) AS fourth_release_amount,
        MAX(CASE WHEN release_stage = 'retention' THEN net_release_amount ELSE 0 END) AS retention_amount,

        MAX(CASE WHEN release_stage = '1st_release' THEN status ELSE NULL END) AS first_release_status,
        MAX(CASE WHEN release_stage = '2nd_release' THEN status ELSE NULL END) AS second_release_status,
        MAX(CASE WHEN release_stage = '3rd_release' THEN status ELSE NULL END) AS third_release_status,
        MAX(CASE WHEN release_stage = '4th_release' THEN status ELSE NULL END) AS fourth_release_status,
        MAX(CASE WHEN release_stage = 'retention' THEN status ELSE NULL END) AS retention_status
      FROM commission_releases
      GROUP BY commission_id
    ) release_summary ON release_summary.commission_id = cm.id
    LEFT JOIN (
      SELECT
        p.client_unit_id,
        COALESCE(SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END), 0) AS total_paid,
        COALESCE(
          ROUND(
            (
              COALESCE(SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END), 0)
              / NULLIF(
                COALESCE(
                  NULLIF(l.total_contract_price, 0),
                  l.net_selling_price + l.legal_misc_fee,
                  l.net_selling_price,
                  0
                ),
                0
              )
            ) * 100,
            2
          ),
          0
        ) AS payment_percentage
      FROM payments p
      INNER JOIN client_units cu2 ON cu2.id = p.client_unit_id
      INNER JOIN listings l ON l.id = cu2.listing_id
      GROUP BY p.client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cm.client_unit_id
    LEFT JOIN (
      SELECT
        base.commission_id,
        SUM(base.amount) AS cash_advance_amount,
        SUM(base.remaining_balance) AS cash_advance_remaining,
        SUM(base.amount - base.remaining_balance) AS cash_advance_deducted
      FROM (
        SELECT
          ca.commission_id,
          ca.amount,
          ca.remaining_balance
        FROM cash_advances ca
        WHERE ca.commission_id IS NOT NULL
          AND ca.status IN ('approved', 'partially_deducted', 'deducted')

        UNION ALL

        SELECT
          cm2.id AS commission_id,
          ca.amount,
          ca.remaining_balance
        FROM cash_advances ca
        INNER JOIN commissions cm2
          ON cm2.client_unit_id = ca.client_unit_id
          AND cm2.seller_id = ca.seller_id
        WHERE ca.commission_id IS NULL
          AND ca.client_unit_id IS NOT NULL
          AND ca.status IN ('approved', 'partially_deducted', 'deducted')
      ) base
      GROUP BY base.commission_id
    ) cash_advance_summary ON cash_advance_summary.commission_id = cm.id
  `

  const getDefaultCommissionRate = async (connectionOrDb = db) => {
    const [rows] = await connectionOrDb.query(
      `
      SELECT setting_value
      FROM settings
      WHERE setting_key = 'default_commission_rate'
      LIMIT 1
      `
    )

    return normalizeRate(rows[0]?.setting_value || 0)
  }

  const getSeller = async (connectionOrDb, sellerId) => {
    const [rows] = await connectionOrDb.query(
      `
      SELECT
        id,
        full_name,
        seller_role,
        parent_seller_id,
        commission_rate,
        commission_pool_rate,
        personal_commission_rate,
        override_commission_rate,
        max_downline_rate,
        status
      FROM accredited_sellers
      WHERE id = ?
      LIMIT 1
      `,
      [sellerId]
    )

    return rows[0]
  }

  const getClientUnitCommissionBase = async (connectionOrDb, clientUnitId) => {
    const [rows] = await connectionOrDb.query(
      `
      SELECT
        cu.id,
        cu.client_id,
        cu.listing_id,
        cu.seller_id,
        cu.status AS client_unit_status,
        client.full_name AS client_name,
        listing.unit_id,
        COALESCE(
          NULLIF(listing.net_selling_price, 0),
          0
        ) AS commission_base
      FROM client_units cu
      INNER JOIN clients client ON client.id = cu.client_id
      INNER JOIN listings listing ON listing.id = cu.listing_id
      WHERE cu.id = ?
      LIMIT 1
      `,
      [clientUnitId]
    )

    return rows[0]
  }

  const getFinalRate = async ({ connectionOrDb = db, seller, rate, rateType = 'personal' }) => {
    if (!isMissing(rate)) return normalizeRate(rate)

    if (rateType === 'pool' && !isMissing(seller?.commission_pool_rate)) {
      return normalizeRate(seller.commission_pool_rate)
    }

    if (rateType === 'override' && !isMissing(seller?.override_commission_rate)) {
      return normalizeRate(seller.override_commission_rate)
    }

    if (rateType === 'personal' && !isMissing(seller?.personal_commission_rate)) {
      return normalizeRate(seller.personal_commission_rate)
    }

    if (!isMissing(seller?.commission_rate)) return normalizeRate(seller.commission_rate)
    return getDefaultCommissionRate(connectionOrDb)
  }

  const getExplicitRate = (seller, key) => {
    if (isMissing(seller?.[key])) return null
    return normalizeRate(seller[key])
  }

  const sellerDisplayRole = (role) => String(role || 'seller').replaceAll('_', ' ')

  const getSellerChain = async (connectionOrDb, sellerId) => {
    const chain = []
    let currentSellerId = sellerId
    const visited = new Set()

    while (!isMissing(currentSellerId) && !visited.has(Number(currentSellerId)) && chain.length < 10) {
      visited.add(Number(currentSellerId))
      const seller = await getSeller(connectionOrDb, currentSellerId)
      if (!seller) break
      chain.push(seller)
      currentSellerId = seller.parent_seller_id
    }

    return chain
  }

  const getCommissionById = async (commissionId) => {
    const [rows] = await db.query(
      `
      SELECT
        ${commissionFields}
      ${commissionJoins}
      WHERE cm.id = ?
      LIMIT 1
      `,
      [commissionId]
    )

    return rows[0]
  }

  const getOverrideCommissionByParentId = async (parentCommissionId) => {
    const [rows] = await db.query(
      `
      SELECT
        ${commissionFields}
      ${commissionJoins}
      WHERE cm.parent_commission_id = ?
        AND cm.source_type = 'override'
        AND cm.status <> 'cancelled'
      ORDER BY cm.id DESC
      LIMIT 1
      `,
      [parentCommissionId]
    )

    return rows[0] || null
  }

  const getReleasesByCommissionId = async (commissionId) => {
    const [rows] = await db.query(
      `
      SELECT
        cr.*,
        u.full_name AS released_by_name
      FROM commission_releases cr
      LEFT JOIN users u ON u.id = cr.released_by
      WHERE cr.commission_id = ?
      ORDER BY
        CASE cr.release_stage
          WHEN '1st_release' THEN 1
          WHEN '2nd_release' THEN 2
          WHEN '3rd_release' THEN 3
          WHEN '4th_release' THEN 4
          WHEN 'retention' THEN 5
          ELSE 99
        END,
        cr.id ASC
      `,
      [commissionId]
    )

    return rows
  }

  const getCashAdvanceDeductionsByCommissionId = async (commissionId) => {
    const [rows] = await db.query(
      `
      SELECT
        cad.id,
        cad.cash_advance_id,
        cad.commission_release_id,
        cad.amount,
        cad.notes,
        cad.created_at,
        ca.seller_id,
        ca.client_unit_id,
        ca.commission_id,
        ca.status AS cash_advance_status,
        ca.remaining_balance,
        seller.full_name AS seller_name,
        cr.release_stage,
        created_by_user.full_name AS created_by_name
      FROM cash_advance_deductions cad
      INNER JOIN cash_advances ca ON ca.id = cad.cash_advance_id
      INNER JOIN commission_releases cr ON cr.id = cad.commission_release_id
      LEFT JOIN accredited_sellers seller ON seller.id = ca.seller_id
      LEFT JOIN users created_by_user ON created_by_user.id = cad.created_by
      WHERE cr.commission_id = ?
      ORDER BY cad.id DESC
      `,
      [commissionId]
    )

    return rows
  }

  const getDocumentStatusForClientUnit = async (connectionOrDb, clientUnitId) => {
    const [rows] = await connectionOrDb.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN d.is_required = TRUE THEN 1 ELSE 0 END), 0) AS required_count,
        COALESCE(SUM(
          CASE
            WHEN d.is_required = TRUE
              AND cdl.status IN ('submitted', 'approved')
            THEN 1
            ELSE 0
          END
        ), 0) AS submitted_required_count
      FROM client_document_list cdl
      INNER JOIN documents d ON d.id = cdl.document_id
      WHERE cdl.client_unit_id = ?
      `,
      [clientUnitId]
    )

    const requiredCount = Number(rows[0]?.required_count || 0)
    const submittedRequiredCount = Number(rows[0]?.submitted_required_count || 0)

    return {
      requiredCount,
      submittedRequiredCount,
      isComplete: requiredCount > 0 && submittedRequiredCount >= requiredCount,
    }
  }

  const recalculateCommissionReleaseTotals = async (
    connectionOrDb,
    commissionId,
    options = {}
  ) => {
    const [rows] = await connectionOrDb.query(
      `
      SELECT
        cm.id,
        cm.gross_commission,
        cm.amount,
        cm.status AS current_status,
        COUNT(cr.id) AS total_releases,
        COALESCE(SUM(CASE WHEN cr.status = 'released' THEN 1 ELSE 0 END), 0) AS released_count,
        COALESCE(SUM(CASE WHEN cr.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_count,
        COALESCE(SUM(CASE WHEN cr.status = 'released' THEN cr.net_release_amount ELSE 0 END), 0) AS released_amount
      FROM commissions cm
      LEFT JOIN commission_releases cr ON cr.commission_id = cm.id
      WHERE cm.id = ?
      GROUP BY cm.id
      `,
      [commissionId]
    )

    const commission = rows[0]

    if (!commission) {
      return null
    }

    const totalAmount = normalizeMoney(
      commission.gross_commission || commission.amount
    )
    const releasedAmount = normalizeMoney(commission.released_amount)
    const remainingAmount = normalizeMoney(
      Math.max(totalAmount - releasedAmount, 0)
    )
    const totalReleases = Number(commission.total_releases || 0)
    const cancelledCount = Number(commission.cancelled_count || 0)

    let nextStatus = commission.current_status

    if (totalReleases > 0 && cancelledCount === totalReleases) {
      nextStatus = 'cancelled'
    } else if (
      nextStatus === 'cancelled' &&
      !options.allowCancelledRecovery
    ) {
      nextStatus = 'cancelled'
    } else if (totalAmount > 0 && releasedAmount >= totalAmount) {
      nextStatus = 'released'
    } else if (releasedAmount > 0) {
      nextStatus = 'partially_released'
    } else if (['released', 'partially_released', 'cancelled'].includes(nextStatus)) {
      nextStatus = 'active'
    }

    await connectionOrDb.query(
      `
      UPDATE commissions
      SET
        released_amount = ?,
        status = ?
      WHERE id = ?
      `,
      [releasedAmount, nextStatus, commissionId]
    )

    return {
      releasedAmount,
      remainingAmount,
      status: nextStatus,
    }
  }

  const refreshCommissionStatus = async (
    connectionOrDb,
    commissionId,
    options = {}
  ) => {
    const totals = await recalculateCommissionReleaseTotals(
      connectionOrDb,
      commissionId,
      options
    )

    return totals?.status || null
  }

  const generateReleaseMilestonesForCommission = async (
    commissionId,
    grossCommission,
    connectionOrDb = db
  ) => {
    const gross = normalizeMoney(grossCommission)

    const milestones = [
      {
        release_stage: '1st_release',
        trigger_payment_percent: 20,
        release_percent: 20,
        cumulative_release_percent: 20,
      },
      {
        release_stage: '2nd_release',
        trigger_payment_percent: 40,
        release_percent: 20,
        cumulative_release_percent: 40,
      },
      {
        release_stage: '3rd_release',
        trigger_payment_percent: 60,
        release_percent: 20,
        cumulative_release_percent: 60,
      },
      {
        release_stage: '4th_release',
        trigger_payment_percent: 75,
        release_percent: 15,
        cumulative_release_percent: 75,
      },
      {
        release_stage: 'retention',
        trigger_payment_percent: null,
        release_percent: 25,
        cumulative_release_percent: 100,
      },
    ]

    const values = milestones.map((milestone) => {
      const grossReleaseAmount = normalizeMoney(
        gross * (milestone.release_percent / 100)
      )

      return [
        commissionId,
        milestone.release_stage,
        milestone.trigger_payment_percent,
        milestone.release_percent,
        milestone.cumulative_release_percent,
        grossReleaseAmount,
        0,
        grossReleaseAmount,
        'pending',
      ]
    })

    await connectionOrDb.query(
      `
      INSERT INTO commission_releases (
        commission_id,
        release_stage,
        trigger_payment_percent,
        release_percent,
        cumulative_release_percent,
        gross_release_amount,
        cash_advance_deduction,
        net_release_amount,
        status
      ) VALUES ?
      `,
      [values]
    )

    return getReleasesByCommissionId(commissionId)
  }

  export const refreshCommissionEligibility = async (
    clientUnitId,
    connectionOrDb = db,
    options = {}
  ) => {
    const [paymentRows] = await connectionOrDb.query(
      `
      SELECT
        cu.id AS client_unit_id,
        cu.status AS client_unit_status,
        COALESCE(
          NULLIF(l.total_contract_price, 0),
          l.net_selling_price + l.legal_misc_fee,
          l.net_selling_price,
          0
        ) AS total_contract_price,
        COALESCE(
          SUM(
            CASE
              WHEN p.status = 'verified' THEN p.amount
              ELSE 0
            END
          ),
          0
        ) AS total_paid
      FROM client_units cu
      INNER JOIN listings l ON l.id = cu.listing_id
      LEFT JOIN payments p ON p.client_unit_id = cu.id
      WHERE cu.id = ?
      GROUP BY cu.id
      `,
      [clientUnitId]
    )

    const paymentInfo = paymentRows[0]

    if (!paymentInfo) {
      return {
        paymentPercentage: 0,
        totalPaid: 0,
        totalContractPrice: 0,
        demotedReleaseCount: 0,
        updatedReleaseCount: 0,
        retentionUpdated: false,
      }
    }

    const totalContractPrice = normalizeMoney(paymentInfo.total_contract_price)
    const totalPaid = normalizeMoney(paymentInfo.total_paid)

    const paymentPercentage =
      totalContractPrice > 0
        ? normalizeRate((totalPaid / totalContractPrice) * 100)
        : 0

    const [demotionResult] = await connectionOrDb.query(
      `
      UPDATE commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      SET cr.status = 'pending'
      WHERE cm.client_unit_id = ?
        AND cr.status = 'eligible'
        AND cr.release_stage <> 'retention'
        AND cr.trigger_payment_percent IS NOT NULL
        AND ? < cr.trigger_payment_percent
      `,
      [clientUnitId, paymentPercentage]
    )

    const [eligibleResult] = await connectionOrDb.query(
      `
      UPDATE commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      SET cr.status = 'eligible'
      WHERE cm.client_unit_id = ?
        AND cr.status = 'pending'
        AND cr.release_stage <> 'retention'
        AND cr.trigger_payment_percent IS NOT NULL
        AND ? >= cr.trigger_payment_percent
      `,
      [clientUnitId, paymentPercentage]
    )

    const documentStatus = await getDocumentStatusForClientUnit(
      connectionOrDb,
      clientUnitId
    )

    const canReleaseRetention =
      ['fully_paid', 'closed'].includes(paymentInfo.client_unit_status) &&
      documentStatus.isComplete

    let retentionUpdated = false

    if (canReleaseRetention && canPromoteRetentionEligibility(options)) {
      const [retentionResult] = await connectionOrDb.query(
        `
        UPDATE commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        SET cr.status = 'eligible'
        WHERE cm.client_unit_id = ?
          AND cr.status = 'pending'
          AND cr.release_stage = 'retention'
        `,
        [clientUnitId]
      )

      retentionUpdated = retentionResult.affectedRows > 0
    } else if (!canReleaseRetention) {
      const [retentionResult] = await connectionOrDb.query(
        `
        UPDATE commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        SET cr.status = 'pending'
        WHERE cm.client_unit_id = ?
          AND cr.status = 'eligible'
          AND cr.release_stage = 'retention'
        `,
        [clientUnitId]
      )

      retentionUpdated = retentionResult.affectedRows > 0
    }

    const [commissionRows] = await connectionOrDb.query(
      `
      SELECT id
      FROM commissions
      WHERE client_unit_id = ?
      `,
      [clientUnitId]
    )

    for (const commission of commissionRows) {
      await refreshCommissionStatus(connectionOrDb, commission.id)
    }

    return {
      paymentPercentage,
      totalPaid,
      totalContractPrice,
      demotedReleaseCount: demotionResult.affectedRows,
      updatedReleaseCount: eligibleResult.affectedRows,
      retentionUpdated,
      retentionRequiresSuperAdmin:
        canReleaseRetention && !canPromoteRetentionEligibility(options),
    }
  }

  export const buildHierarchyCommissionPreview = async ({
    connectionOrDb = db,
    sellerId,
  }) => {
    const chain = await getSellerChain(connectionOrDb, sellerId)

    if (chain.length === 0) {
      return {
        chain: [],
        rows: [],
        totalRate: 0,
        warnings: ['Seller hierarchy was not found'],
      }
    }

    const sellingSeller = chain[0]
    const manager = chain.find((seller) => seller.seller_role === 'manager')
    const broker = chain.find((seller) => seller.seller_role === 'broker')
    const bnm = chain.find((seller) => seller.seller_role === 'broker_network_manager')
    const warnings = []

    const personalRate = !isMissing(sellingSeller.personal_commission_rate)
      ? normalizeRate(sellingSeller.personal_commission_rate)
      : await getFinalRate({ connectionOrDb, seller: sellingSeller, rateType: 'personal' })

    const rows = [
      {
        seller: sellingSeller,
        rate: personalRate,
        sourceType: 'main',
        commissionRole: sellingSeller.seller_role,
        label: `${sellerDisplayRole(sellingSeller.seller_role)} main commission`,
      },
    ]

    let allocatedBelowBroker = personalRate

    if (manager && Number(manager.id) !== Number(sellingSeller.id)) {
      const managerOverrideRate = getExplicitRate(manager, 'override_commission_rate') || 0
      if (managerOverrideRate > 0) {
        rows.push({
          seller: manager,
          rate: managerOverrideRate,
          sourceType: 'override',
          commissionRole: 'override',
          label: 'Manager override',
        })
        allocatedBelowBroker = normalizeRate(allocatedBelowBroker + managerOverrideRate)
      }
    }

    let brokerPoolRate = broker ? getExplicitRate(broker, 'commission_pool_rate') : null

    if (broker && brokerPoolRate === null && !isMissing(broker.commission_rate)) {
      brokerPoolRate = normalizeRate(broker.commission_rate)
    }

    if (broker && Number(broker.id) !== Number(sellingSeller.id)) {
      if (brokerPoolRate !== null) {
        const brokerResidualRate = normalizeRate(brokerPoolRate - allocatedBelowBroker)

        if (brokerResidualRate < 0) {
          throw new Error(
            `Commission split exceeds broker pool. Broker pool is ${brokerPoolRate}%, but downline allocation is ${allocatedBelowBroker}%.`
          )
        }

        if (brokerResidualRate > 0) {
          rows.push({
            seller: broker,
            rate: brokerResidualRate,
            sourceType: 'override',
            commissionRole: 'override',
            label: 'Broker residual commission',
          })
        }
      } else {
        warnings.push('Broker pool rate is not set, so broker residual was skipped')
      }
    }

    if (bnm && broker) {
      const bnmPoolRate = getExplicitRate(bnm, 'commission_pool_rate')

      if (bnmPoolRate !== null && brokerPoolRate !== null) {
        const bnmResidualRate = normalizeRate(bnmPoolRate - brokerPoolRate)

        if (bnmResidualRate < 0) {
          throw new Error(
            `Commission split exceeds broker network manager pool. BNM pool is ${bnmPoolRate}%, but broker pool is ${brokerPoolRate}%.`
          )
        }

        if (bnmResidualRate > 0) {
          rows.push({
            seller: bnm,
            rate: bnmResidualRate,
            sourceType: 'override',
            commissionRole: 'override',
            label: 'Broker network manager residual commission',
          })
        }
      }
    }

    return {
      chain,
      rows: rows.filter((row) => normalizeRate(row.rate) > 0),
      totalRate: normalizeRate(rows.reduce((sum, row) => sum + normalizeRate(row.rate), 0)),
      warnings,
    }
  }

  export const createHierarchyCommissionsForClientUnit = async ({
    connection,
    clientUnitId,
    sellerId,
    saleType = 'distributed',
    notes = null,
    actorRole = null,
  }) => {
    const connectionOrDb = connection || db

    if (saleType === 'direct') {
      const seller = await getSeller(connectionOrDb, sellerId)
      const personalRate = !isMissing(seller?.personal_commission_rate)
        ? normalizeRate(seller.personal_commission_rate)
        : null

      const mainCommission = await createAutoCommissionForClientUnit({
        connection: connectionOrDb,
        clientUnitId,
        sellerId,
        rateOverride: personalRate,
        commissionRole: seller?.seller_role || null,
        sourceType: 'main',
        parentCommissionId: null,
        saleType: 'direct',
        notes,
        actorRole,
      })

      return mainCommission ? [mainCommission] : []
    }

    const preview = await buildHierarchyCommissionPreview({
      connectionOrDb,
      sellerId,
    })

    const createdCommissions = []
    let parentCommissionId = null

    for (const row of preview.rows) {
      const createdCommission = await createAutoCommissionForClientUnit({
        connection: connectionOrDb,
        clientUnitId,
        sellerId: row.seller.id,
        rateOverride: row.rate,
        commissionRole: row.commissionRole,
        sourceType: row.sourceType,
        parentCommissionId: row.sourceType === 'override' ? parentCommissionId : null,
        saleType: 'distributed',
        overrideNotes: row.sourceType === 'override' ? row.label : null,
        notes: notes || row.label,
        actorRole,
      })

      if (createdCommission) {
        createdCommissions.push(createdCommission)
        if (row.sourceType === 'main') {
          parentCommissionId = createdCommission.commissionId
        }
      }
    }

    return createdCommissions
  }

  export const createAutoCommissionForClientUnit = async ({
    connection,
    clientUnitId,
    sellerId,
    rateOverride = null,
    commissionRole = null,
    sourceType = 'main',
    parentCommissionId = null,
    saleType = 'distributed',
    cashKaliwaanAmount = 0,
    cashKaliwaanDate = null,
    cashKaliwaanNotes = null,
    overrideNotes = null,
    notes = null,
    actorRole = null,
  }) => {
    const connectionOrDb = connection || db

    if (isMissing(clientUnitId) || isMissing(sellerId)) {
      return null
    }

    const clientUnit = await getClientUnitCommissionBase(connectionOrDb, clientUnitId)

    if (!clientUnit) {
      return null
    }

    const seller = await getSeller(connectionOrDb, sellerId)

    if (!seller) {
      return null
    }

    const finalRate = await getFinalRate({
      connectionOrDb,
      seller,
      rate: rateOverride,
    })

    const commissionBase = normalizeMoney(clientUnit.commission_base)
    const grossCommission = calculateGrossCommission(commissionBase, finalRate)
    const finalCommissionRole = nullableValue(commissionRole) || seller.seller_role
    const finalSourceType = sourceType === 'override' ? 'override' : 'main'
    const finalSaleType = saleType === 'direct' ? 'direct' : 'distributed'

    const [duplicateRows] = await connectionOrDb.query(
      `
      SELECT id
      FROM commissions
      WHERE client_unit_id = ?
        AND seller_id = ?
        AND source_type = ?
        AND (
          parent_commission_id <=> ?
        )
      LIMIT 1
      `,
      [
        clientUnitId,
        sellerId,
        finalSourceType,
        nullableValue(parentCommissionId),
      ]
    )

    if (duplicateRows.length > 0) {
      return {
        commissionId: duplicateRows[0].id,
        skipped: true,
        reason: 'Commission already exists',
      }
    }

    const [result] = await connectionOrDb.query(
      `
      INSERT INTO commissions (
        client_unit_id,
        seller_id,
        commission_role,
        rate,
        commission_base,
        gross_commission,
        amount,
        source_type,
        parent_commission_id,
        sale_type,
        cash_kaliwaan_amount,
        cash_kaliwaan_date,
        cash_kaliwaan_notes,
        override_notes,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `,
      [
        clientUnitId,
        sellerId,
        finalCommissionRole,
        finalRate,
        commissionBase,
        grossCommission,
        grossCommission,
        finalSourceType,
        nullableValue(parentCommissionId),
        finalSaleType,
        normalizeMoney(cashKaliwaanAmount),
        nullableValue(cashKaliwaanDate),
        nullableValue(cashKaliwaanNotes),
        nullableValue(overrideNotes),
        nullableValue(notes),
      ]
    )

    await generateReleaseMilestonesForCommission(
      result.insertId,
      grossCommission,
      connectionOrDb
    )

    await refreshCommissionEligibility(clientUnitId, connectionOrDb, {
      actorRole,
    })

    return {
      commissionId: result.insertId,
      seller_id: sellerId,
      seller_name: seller.full_name,
      commission_role: finalCommissionRole,
      source_type: finalSourceType,
      parent_commission_id: nullableValue(parentCommissionId),
      sale_type: finalSaleType,
      rate: finalRate,
      commission_base: commissionBase,
      gross_commission: grossCommission,
    }
  }

  export const getCommissions = async (req, res) => {
    const { search, status, seller_id, client_unit_id, source_type, sale_type } = req.query

    const conditions = []
    const params = []

    const visibleSellerIds = await getVisibleSellerIdsForUser(req.user)
    if (visibleSellerIds !== null) {
      if (visibleSellerIds.length === 0) {
        conditions.push('1 = 0')
      } else {
        conditions.push(`cm.seller_id IN (${visibleSellerIds.map(() => '?').join(', ')})`)
        params.push(...visibleSellerIds)
      }
    }

    if (!isMissing(search)) {
      const searchTerm = `%${search}%`

      conditions.push(`
        (
          client.full_name LIKE ?
          OR listing.unit_id LIKE ?
          OR project.name LIKE ?
          OR seller.full_name LIKE ?
          OR seller.seller_role LIKE ?
          OR cm.commission_role LIKE ?
          OR cm.source_type LIKE ?
          OR cm.sale_type LIKE ?
          OR cm.status LIKE ?
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
        searchTerm,
        searchTerm
      )
    }

    if (!isMissing(status) && status !== 'all') {
      conditions.push('cm.status = ?')
      params.push(status)
    }

    if (isOfficeRole(req.user.role) && !isMissing(seller_id) && seller_id !== 'all') {
      conditions.push('cm.seller_id = ?')
      params.push(seller_id)
    }

    if (!isMissing(client_unit_id)) {
      conditions.push('cm.client_unit_id = ?')
      params.push(client_unit_id)
    }

    if (!isMissing(source_type) && source_type !== 'all') {
      conditions.push('cm.source_type = ?')
      params.push(source_type)
    }

    if (!isMissing(sale_type) && sale_type !== 'all') {
      conditions.push('cm.sale_type = ?')
      params.push(sale_type)
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await db.query(
      `
      SELECT
        ${commissionFields}
      ${commissionJoins}
      ${whereClause}
      ORDER BY cm.id DESC
      `,
      params
    )

    return res.status(200).json({
      message: 'Commissions fetched successfully',
      commissions: rows,
      data: rows,
    })
  }

  export const getCommission = async (req, res) => {
    const { id } = req.params

    const commission = await getCommissionById(id)

    if (!commission) {
      return res.status(404).json({
        message: 'Commission not found',
        data: null,
      })
    }

    const releases = await getReleasesByCommissionId(id)
    const cashAdvanceDeductions = await getCashAdvanceDeductionsByCommissionId(id)
    const pairedOverrideCommission =
      commission.source_type === 'main'
        ? await getOverrideCommissionByParentId(id)
        : null

    const pairedOverrideDetails = pairedOverrideCommission
      ? {
          ...pairedOverrideCommission,
          releases: await getReleasesByCommissionId(pairedOverrideCommission.id),
          cashAdvanceDeductions: await getCashAdvanceDeductionsByCommissionId(
            pairedOverrideCommission.id
          ),
        }
      : null

    return res.status(200).json({
      message: 'Commission fetched successfully',
      commission: {
        ...commission,
        releases,
        cashAdvanceDeductions,
        pairedOverrideCommission: pairedOverrideDetails,
      },
      data: {
        ...commission,
        releases,
        cashAdvanceDeductions,
        pairedOverrideCommission: pairedOverrideDetails,
      },
    })
  }

  export const getCommissionsByClientUnit = async (req, res) => {
    const { clientUnitId } = req.params

    const [rows] = await db.query(
      `
      SELECT
        ${commissionFields}
      ${commissionJoins}
      WHERE cm.client_unit_id = ?
      ORDER BY
        CASE cm.source_type
          WHEN 'main' THEN 1
          WHEN 'override' THEN 2
          ELSE 99
        END,
        cm.id ASC
      `,
      [clientUnitId]
    )

    return res.status(200).json({
      message: 'Client unit commissions fetched successfully',
      commissions: rows,
      data: rows,
    })
  }

  export const createCommission = async (req, res) => {
    const {
      client_unit_id,
      seller_id,
      rate,
      commission_role,
      source_type = 'main',
      parent_commission_id,
      sale_type = 'distributed',
      cash_kaliwaan_amount = 0,
      cash_kaliwaan_date,
      cash_kaliwaan_notes,
      override_notes,
      notes,
    } = req.body

    if (isMissing(client_unit_id)) {
      return res.status(400).json({ message: 'Client unit is required' })
    }

    if (isMissing(seller_id)) {
      return res.status(400).json({ message: 'Seller is required' })
    }

    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      const result = await createAutoCommissionForClientUnit({
        connection,
        clientUnitId: client_unit_id,
        sellerId: seller_id,
        rateOverride: rate,
        commissionRole: commission_role,
        sourceType: source_type,
        parentCommissionId: parent_commission_id,
        saleType: sale_type,
        cashKaliwaanAmount: cash_kaliwaan_amount,
        cashKaliwaanDate: cash_kaliwaan_date,
        cashKaliwaanNotes: cash_kaliwaan_notes,
        overrideNotes: override_notes,
        notes,
        actorRole: req.user.role,
      })

      if (!result) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Unable to create commission. Check client unit and seller.',
        })
      }

      await connection.commit()

      await createAuditLog({
        userId: req.user.id,
        action: 'create',
        module: 'Commissions',
        description: `Created commission for seller ${seller_id}`,
        ipAddress: getClientIp(req),
      })

      return res.status(201).json({
        message: result.skipped
          ? 'Commission already exists'
          : 'Commission created successfully',
        commissionId: result.commissionId,
        data: result,
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  export const updateCommission = async (req, res) => {
    const { id } = req.params

    const {
      seller_id,
      rate,
      commission_role,
      source_type,
      parent_commission_id,
      sale_type,
      cash_kaliwaan_amount,
      cash_kaliwaan_date,
      cash_kaliwaan_notes,
      override_notes,
      override_seller_id,
      override_rate,
      override_notes_for_child,
      status,
      notes,
    } = req.body

    const [existingRows] = await db.query(
      `
      SELECT *
      FROM commissions
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    )

    const existingCommission = existingRows[0]

    if (!existingCommission) {
      return res.status(404).json({ message: 'Commission not found' })
    }

    const [releaseRows] = await db.query(
      `
      SELECT COUNT(id) AS released_count
      FROM commission_releases
      WHERE commission_id = ?
        AND status = 'released'
      `,
      [id]
    )

    const releasedCount = Number(releaseRows[0]?.released_count || 0)

    if (releasedCount > 0 && (!isMissing(rate) || !isMissing(seller_id))) {
      return res.status(400).json({
        message: 'Cannot change seller or rate after a release has been paid',
      })
    }

    let finalSellerId = existingCommission.seller_id
    let finalCommissionRole = existingCommission.commission_role
    let finalRate = existingCommission.rate

    if (!isMissing(seller_id)) {
      const seller = await getSeller(db, seller_id)

      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' })
      }

      finalSellerId = seller_id
      finalCommissionRole = isMissing(commission_role)
        ? seller.seller_role
        : commission_role
    } else if (!isMissing(commission_role)) {
      finalCommissionRole = commission_role
    }

    if (!isMissing(rate)) {
      finalRate = normalizeRate(rate)
    }

    const finalSourceType =
      source_type === 'override' ? 'override' : existingCommission.source_type || 'main'

    const finalSaleType =
      sale_type === 'direct' ? 'direct' : sale_type === 'distributed'
        ? 'distributed'
        : existingCommission.sale_type || 'distributed'

    const shouldSyncOverride =
      finalSourceType === 'main' && finalSaleType === 'distributed'

    const shouldCancelOverride =
      finalSourceType === 'main' && finalSaleType === 'direct'

    const hasOverrideSeller = !isMissing(override_seller_id)
    const hasOverrideRate = !isMissing(override_rate)

    if (shouldSyncOverride && hasOverrideSeller && !hasOverrideRate) {
      return res.status(400).json({
        message: 'Override rate is required when override seller is selected',
      })
    }

    if (shouldSyncOverride && !hasOverrideSeller && hasOverrideRate) {
      return res.status(400).json({
        message: 'Override seller is required when override rate is entered',
      })
    }

    if (
      shouldSyncOverride &&
      hasOverrideSeller &&
      Number(override_seller_id) === Number(finalSellerId)
    ) {
      return res.status(400).json({
        message: 'Override seller must be different from the main seller',
      })
    }

    const [existingOverrideRows] = await db.query(
      `
      SELECT *
      FROM commissions
      WHERE parent_commission_id = ?
        AND source_type = 'override'
        AND status <> 'cancelled'
      ORDER BY id DESC
      LIMIT 1
      `,
      [id]
    )

    const existingOverrideCommission = existingOverrideRows[0] || null

    if (existingOverrideCommission) {
      const [overrideReleaseRows] = await db.query(
        `
        SELECT COUNT(id) AS released_count
        FROM commission_releases
        WHERE commission_id = ?
          AND status = 'released'
        `,
        [existingOverrideCommission.id]
      )

      const overrideReleasedCount = Number(
        overrideReleaseRows[0]?.released_count || 0
      )

      const overrideSellerChanged =
        hasOverrideSeller &&
        Number(override_seller_id) !==
          Number(existingOverrideCommission.seller_id)

      const overrideRateChanged =
        hasOverrideRate &&
        normalizeRate(override_rate) !==
          normalizeRate(existingOverrideCommission.rate)

      if (
        overrideReleasedCount > 0 &&
        (overrideSellerChanged || overrideRateChanged)
      ) {
        return res.status(400).json({
          message:
            'Cannot change override seller or rate after an override release has been paid',
        })
      }
    }

    const grossCommission = calculateGrossCommission(
      existingCommission.commission_base,
      finalRate
    )

    await db.query(
      `
      UPDATE commissions
      SET
        seller_id = ?,
        commission_role = ?,
        rate = ?,
        gross_commission = ?,
        amount = ?,
        source_type = ?,
        parent_commission_id = ?,
        sale_type = ?,
        cash_kaliwaan_amount = ?,
        cash_kaliwaan_date = ?,
        cash_kaliwaan_notes = ?,
        override_notes = ?,
        status = ?,
        notes = ?
      WHERE id = ?
      `,
      [
        finalSellerId,
        nullableValue(finalCommissionRole),
        finalRate,
        grossCommission,
        grossCommission,
        finalSourceType,
        !isMissing(parent_commission_id)
          ? parent_commission_id
          : existingCommission.parent_commission_id,
        finalSaleType,
        !isMissing(cash_kaliwaan_amount)
          ? normalizeMoney(cash_kaliwaan_amount)
          : normalizeMoney(existingCommission.cash_kaliwaan_amount),
        !isMissing(cash_kaliwaan_date)
          ? cash_kaliwaan_date
          : existingCommission.cash_kaliwaan_date,
        !isMissing(cash_kaliwaan_notes)
          ? cash_kaliwaan_notes
          : existingCommission.cash_kaliwaan_notes,
        !isMissing(override_notes)
          ? override_notes
          : existingCommission.override_notes,
        status || existingCommission.status,
        !isMissing(notes) ? notes : existingCommission.notes,
        id,
      ]
    )

    if (releasedCount === 0 && !isMissing(rate)) {
      await db.query(
        `
        DELETE cr
        FROM commission_releases cr
        LEFT JOIN cash_advance_deductions cad
          ON cad.commission_release_id = cr.id
        WHERE cr.commission_id = ?
          AND cr.status <> 'released'
          AND cad.id IS NULL
        `,
        [id]
      )

      await generateReleaseMilestonesForCommission(id, grossCommission)
      await refreshCommissionEligibility(existingCommission.client_unit_id, db, {
        actorRole: req.user.role,
      })
    }

    let syncedOverrideCommission = null

    if (shouldCancelOverride && existingOverrideCommission) {
      await db.query(
        `
        UPDATE commissions
        SET status = 'cancelled'
        WHERE id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM commission_releases cr
            WHERE cr.commission_id = commissions.id
              AND cr.status = 'released'
          )
        `,
        [existingOverrideCommission.id]
      )
    }

    if (shouldSyncOverride && hasOverrideSeller && hasOverrideRate) {
      const overrideSeller = await getSeller(db, override_seller_id)

      if (!overrideSeller) {
        return res.status(404).json({ message: 'Override seller not found' })
      }

      const finalOverrideRate = normalizeRate(override_rate)
      const overrideGrossCommission = calculateGrossCommission(
        existingCommission.commission_base,
        finalOverrideRate
      )

      if (existingOverrideCommission) {
        await db.query(
          `
          UPDATE commissions
          SET
            seller_id = ?,
            commission_role = ?,
            rate = ?,
            gross_commission = ?,
            amount = ?,
            sale_type = ?,
            override_notes = ?,
            status = CASE
              WHEN status = 'cancelled' THEN 'active'
              ELSE status
            END
          WHERE id = ?
          `,
          [
            override_seller_id,
            overrideSeller.seller_role || 'agent',
            finalOverrideRate,
            overrideGrossCommission,
            overrideGrossCommission,
            finalSaleType,
            nullableValue(override_notes_for_child),
            existingOverrideCommission.id,
          ]
        )

        const [currentOverrideReleaseRows] = await db.query(
          `
          SELECT COUNT(id) AS released_count
          FROM commission_releases
          WHERE commission_id = ?
            AND status = 'released'
          `,
          [existingOverrideCommission.id]
        )

        const currentOverrideReleasedCount = Number(
          currentOverrideReleaseRows[0]?.released_count || 0
        )

        if (currentOverrideReleasedCount === 0) {
          await db.query(
            `
            DELETE FROM commission_releases
            WHERE commission_id = ?
              AND status <> 'released'
            `,
            [existingOverrideCommission.id]
          )

          await generateReleaseMilestonesForCommission(
            existingOverrideCommission.id,
            overrideGrossCommission
          )
        }

        syncedOverrideCommission = {
          commissionId: existingOverrideCommission.id,
          gross_commission: overrideGrossCommission,
          rate: finalOverrideRate,
          updated: true,
        }
      } else {
        syncedOverrideCommission = await createAutoCommissionForClientUnit({
          clientUnitId: existingCommission.client_unit_id,
          sellerId: override_seller_id,
          rateOverride: finalOverrideRate,
          commissionRole: overrideSeller.seller_role || 'agent',
          sourceType: 'override',
          parentCommissionId: Number(id),
          saleType: finalSaleType,
          cashKaliwaanAmount: cash_kaliwaan_amount,
          cashKaliwaanDate: cash_kaliwaan_date,
          cashKaliwaanNotes: cash_kaliwaan_notes,
          overrideNotes: override_notes_for_child,
          notes: `Optional override commission for main commission ${id}`,
          actorRole: req.user.role,
        })
      }
    }

    await refreshCommissionEligibility(existingCommission.client_unit_id, db, {
      actorRole: req.user.role,
    })
    await refreshCommissionStatus(db, id)

    if (existingOverrideCommission) {
      await refreshCommissionStatus(db, existingOverrideCommission.id)
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'update',
      module: 'Commissions',
      description: `Updated commission ${id}`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Commission updated successfully',
      data: {
        commissionId: Number(id),
        gross_commission: grossCommission,
        commission_base: normalizeMoney(existingCommission.commission_base),
        rate: finalRate,
        overrideCommission: syncedOverrideCommission,
      },
    })
  }


export const addMissingOverrideCommission = async (req, res) => {
  const { id } = req.params

  const {
    override_seller_id,
    override_rate,
    override_notes,
    cash_kaliwaan_amount = 0,
    cash_kaliwaan_date,
    cash_kaliwaan_notes,
    notes,
  } = req.body

  if (isMissing(override_seller_id)) {
    return res.status(400).json({
      message: 'Override seller is required',
    })
  }

  if (isMissing(override_rate)) {
    return res.status(400).json({
      message: 'Override rate is required',
    })
  }

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [mainRows] = await connection.query(
      `
      SELECT *
      FROM commissions
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id]
    )

    const mainCommission = mainRows[0]

    if (!mainCommission) {
      await connection.rollback()

      return res.status(404).json({
        message: 'Main commission not found',
      })
    }

    if (mainCommission.source_type !== 'main') {
      await connection.rollback()

      return res.status(400).json({
        message: 'Missing override can only be added to a main commission',
      })
    }

    if (mainCommission.status === 'cancelled') {
      await connection.rollback()

      return res.status(400).json({
        message: 'Cannot add an override commission to a cancelled main commission',
      })
    }

    if (Number(mainCommission.seller_id) === Number(override_seller_id)) {
      await connection.rollback()

      return res.status(400).json({
        message: 'Override seller must be different from the main seller',
      })
    }

    const [existingOverrideRows] = await connection.query(
      `
      SELECT id, status
      FROM commissions
      WHERE parent_commission_id = ?
        AND source_type = 'override'
        AND status <> 'cancelled'
      ORDER BY id DESC
      LIMIT 1
      `,
      [id]
    )

    if (existingOverrideRows.length > 0) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'This main commission already has an active override commission. Edit the override row instead.',
      })
    }

    const overrideSeller = await getSeller(connection, override_seller_id)

    if (!overrideSeller) {
      await connection.rollback()

      return res.status(404).json({
        message: 'Override seller not found',
      })
    }

    const finalOverrideRate = normalizeRate(override_rate)

    const createdOverride = await createAutoCommissionForClientUnit({
      connection,
      clientUnitId: mainCommission.client_unit_id,
      sellerId: override_seller_id,
      rateOverride: finalOverrideRate,
      commissionRole: overrideSeller.seller_role || 'agent',
      sourceType: 'override',
      parentCommissionId: Number(id),
      saleType: 'distributed',
      cashKaliwaanAmount: cash_kaliwaan_amount,
      cashKaliwaanDate: cash_kaliwaan_date,
      cashKaliwaanNotes: cash_kaliwaan_notes,
      overrideNotes: override_notes,
      notes:
        notes ||
        `Missing override commission added for main commission ${id}`,
      actorRole: req.user.role,
    })

    if (!createdOverride || !createdOverride.commissionId) {
      await connection.rollback()

      return res.status(400).json({
        message:
          createdOverride?.reason ||
          'Unable to create missing override commission',
      })
    }

    await connection.query(
      `
      UPDATE commissions
      SET sale_type = 'distributed'
      WHERE id = ?
      `,
      [id]
    )

    await refreshCommissionEligibility(mainCommission.client_unit_id, connection, {
      actorRole: req.user.role,
    })
    await refreshCommissionStatus(connection, id)
    await refreshCommissionStatus(connection, createdOverride.commissionId)

    await connection.commit()

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Commissions',
      description: `Added missing override commission ${createdOverride.commissionId} to main commission ${id}`,
      ipAddress: getClientIp(req),
    })

    return res.status(201).json({
      message: 'Missing override commission added successfully',
      data: createdOverride,
    })
  } catch (err) {
    await connection.rollback()

    console.error('Add missing override commission error:', err)

    return res.status(500).json({
      message: err.message || 'Failed to add missing override commission',
    })
  } finally {
    connection.release()
  }
}

  export const createHierarchyCommissions = async (req, res) => {
    return res.status(400).json({
      message:
        'Automatic hierarchy commissions are disabled. Use optional override commission instead.',
    })
  }


  export const markClientUnitRetentionEligible = async (req, res) => {
    const { clientUnitId } = req.params

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        message: 'Only super admin can make retention eligible.',
      })
    }

    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      const [clientUnitRows] = await connection.query(
        `
        SELECT id, status
        FROM client_units
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [clientUnitId]
      )

      const clientUnit = clientUnitRows[0]
      if (!clientUnit) {
        await connection.rollback()
        return res.status(404).json({ message: 'Client unit not found' })
      }

      if (!['fully_paid', 'closed'].includes(clientUnit.status)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Retention can only become eligible when the account is fully paid or closed.',
        })
      }

      const documentStatus = await getDocumentStatusForClientUnit(connection, clientUnitId)
      if (!documentStatus.isComplete) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Retention cannot become eligible until required documents are complete.',
        })
      }

      const [result] = await connection.query(
        `
        UPDATE commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        SET cr.status = 'eligible'
        WHERE cm.client_unit_id = ?
          AND cr.release_stage = 'retention'
          AND cr.status = 'pending'
        `,
        [clientUnitId]
      )

      const [commissionRows] = await connection.query(
        `SELECT id FROM commissions WHERE client_unit_id = ?`,
        [clientUnitId]
      )

      for (const commission of commissionRows) {
        await refreshCommissionStatus(connection, commission.id)
      }

      await connection.commit()

      await createAuditLog({
        userId: req.user.id,
        action: 'retention_eligible',
        module: 'Commission Releases',
        description: `Marked retention eligible for client unit ${clientUnitId}`,
        ipAddress: getClientIp(req),
      })

      return res.status(200).json({
        message: 'Retention marked eligible successfully',
        updatedCount: result.affectedRows,
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  export const getCommissionSummary = async (req, res) => {
    const [rows] = await db.query(
      `
      SELECT
        COUNT(cm.id) AS total_commissions,
        COALESCE(SUM(cm.gross_commission), 0) AS total_amount,
        COALESCE(SUM(COALESCE(release_summary.eligible_amount, 0)), 0) AS total_eligible,
        COALESCE(SUM(COALESCE(release_summary.released_amount, 0)), 0) AS total_released,
        COALESCE(
          SUM(
            GREATEST(
              cm.gross_commission
              - COALESCE(release_summary.released_amount, 0)
              - COALESCE(release_summary.cash_advance_deduction, 0),
              0
            )
          ),
          0
        ) AS total_remaining,
        COALESCE(SUM(COALESCE(release_summary.cash_advance_deduction, 0)), 0) AS total_cash_advance_deduction,
        SUM(CASE WHEN cm.status = 'active' THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN cm.status = 'partially_released' THEN 1 ELSE 0 END) AS partially_released_count,
        SUM(CASE WHEN cm.status = 'released' THEN 1 ELSE 0 END) AS released_count,
        SUM(CASE WHEN cm.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN cm.source_type = 'main' THEN 1 ELSE 0 END) AS main_count,
        SUM(CASE WHEN cm.source_type = 'override' THEN 1 ELSE 0 END) AS override_count
      FROM commissions cm
      LEFT JOIN (
        SELECT
          commission_id,
          SUM(CASE WHEN status = 'eligible' THEN net_release_amount ELSE 0 END) AS eligible_amount,
          SUM(CASE WHEN status = 'released' THEN net_release_amount ELSE 0 END) AS released_amount,
          SUM(cash_advance_deduction) AS cash_advance_deduction
        FROM commission_releases
        GROUP BY commission_id
      ) release_summary ON release_summary.commission_id = cm.id
      `
    )

    const summary = rows[0] || {}

    return res.status(200).json({
      message: 'Commission summary fetched successfully',
      summary,
      data: summary,
    })
  }

  export const getCommissionReleases = async (req, res) => {
    const { id: commissionId } = req.params
    const releases = await getReleasesByCommissionId(commissionId)

    return res.status(200).json({
      message: 'Commission releases fetched successfully',
      releases,
      data: releases,
    })
  }

  export const generateReleaseMilestones = async (req, res) => {
    const { id: commissionId } = req.params

    const [commissionRows] = await db.query(
      `
      SELECT id, gross_commission, client_unit_id
      FROM commissions
      WHERE id = ?
      LIMIT 1
      `,
      [commissionId]
    )

    const commission = commissionRows[0]

    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' })
    }

    const [existingRows] = await db.query(
      `
      SELECT id
      FROM commission_releases
      WHERE commission_id = ?
      LIMIT 1
      `,
      [commissionId]
    )

    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'Milestones already generated' })
    }

    const releases = await generateReleaseMilestonesForCommission(
      commissionId,
      commission.gross_commission
    )

    await refreshCommissionEligibility(commission.client_unit_id, db, {
      actorRole: req.user.role,
    })

    await createAuditLog({
      userId: req.user.id,
      action: 'create',
      module: 'Commission Releases',
      description: `Generated release milestones for commission ${commissionId}`,
      ipAddress: getClientIp(req),
    })

    return res.status(201).json({
      message: 'Milestones generated successfully',
      releases,
      data: releases,
    })
  }

  export const markReleaseStage = async (req, res) => {
    const { id: releaseId } = req.params
    const { notes } = req.body

    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      const [rows] = await connection.query(
        `
        SELECT
          cr.*,
          cm.client_unit_id
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cr.id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [releaseId]
      )

      const release = rows[0]

      if (!release) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Release not found',
        })
      }

      if (release.status === 'released') {
        await connection.rollback()
        return res.status(400).json({
          message: 'This release has already been marked as released.',
        })
      }

      if (release.status !== 'eligible') {
        await connection.rollback()
        return res.status(400).json({
          message: 'Only eligible releases can be marked as released.',
        })
      }

      const [updateResult] = await connection.query(
        `
        UPDATE commission_releases
        SET
          status = 'released',
          released_at = NOW(),
          released_by = ?,
          notes = ?
        WHERE id = ?
          AND status = 'eligible'
        `,
        [req.user.id, nullableValue(notes), releaseId]
      )

      if (updateResult.affectedRows === 0) {
        await connection.rollback()
        return res.status(400).json({
          message:
            'Release could not be marked as released. It may have already been processed.',
        })
      }

      await recalculateCommissionReleaseTotals(connection, release.commission_id)

      await connection.commit()

      await createAuditLog({
        userId: req.user.id,
        action: 'release',
        module: 'Commission Releases',
        description: `Marked release ${releaseId} as released`,
        ipAddress: getClientIp(req),
      })

      return res.status(200).json({
        message: 'Release marked as released successfully',
        data: {
          releaseId: Number(releaseId),
          commissionId: release.commission_id,
        },
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  export const deductCashAdvance = async (req, res) => {
    const { id: releaseId } = req.params
    const { cash_advance_id, amount, notes } = req.body

    if (isMissing(cash_advance_id)) {
      return res.status(400).json({
        message: 'Select an approved cash advance before deducting. Manual deductions are disabled to avoid untracked deductions.',
      })
    }

    const requestedAmount = isMissing(amount) ? null : normalizeMoney(amount)

    if (requestedAmount !== null && requestedAmount <= 0) {
      return res.status(400).json({
        message: 'Deduction amount must be greater than 0',
      })
    }

    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      const [releaseRows] = await connection.query(
        `
        SELECT
          cr.*,
          cm.seller_id,
          cm.client_unit_id
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cr.id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [releaseId]
      )

      const release = releaseRows[0]

      if (!release) {
        await connection.rollback()
        return res.status(404).json({ message: 'Release not found' })
      }

      if (release.status !== 'eligible') {
        await connection.rollback()
        return res.status(400).json({
          message: 'Cash advance deductions can only be applied to eligible commission releases.',
        })
      }

      const [advanceRows] = await connection.query(
        `
        SELECT *
        FROM cash_advances
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [cash_advance_id]
      )

      const cashAdvance = advanceRows[0]

      if (!cashAdvance) {
        await connection.rollback()
        return res.status(404).json({
          message: 'Cash advance not found',
        })
      }

      if (!['approved', 'partially_deducted'].includes(cashAdvance.status)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Only approved cash advances can be deducted',
        })
      }

      if (Number(cashAdvance.seller_id) !== Number(release.seller_id)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Cash advance seller does not match commission seller',
        })
      }

      const currentReleaseDeduction = normalizeMoney(release.cash_advance_deduction)
      const releaseRemainingBeforeDeduction = normalizeMoney(
        normalizeMoney(release.gross_release_amount) - currentReleaseDeduction
      )
      const cashAdvanceRemaining = normalizeMoney(cashAdvance.remaining_balance)
      const maxDeductibleAmount = Math.min(
        cashAdvanceRemaining,
        releaseRemainingBeforeDeduction
      )
      const deductionAmount = requestedAmount ?? maxDeductibleAmount

      if (deductionAmount <= 0) {
        await connection.rollback()
        return res.status(400).json({
          message: 'There is no remaining release amount or cash advance balance to deduct.',
        })
      }

      if (deductionAmount > cashAdvanceRemaining) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Deduction exceeds cash advance remaining balance',
        })
      }

      if (deductionAmount > releaseRemainingBeforeDeduction) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Deduction exceeds the release net amount. Lower the deduction amount.',
        })
      }

      await connection.query(
        `
        INSERT INTO cash_advance_deductions (
          cash_advance_id,
          commission_release_id,
          amount,
          created_by,
          notes
        ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          cash_advance_id,
          releaseId,
          deductionAmount,
          req.user.id,
          nullableValue(notes),
        ]
      )

      const nextRemainingBalance = normalizeMoney(
        cashAdvanceRemaining - deductionAmount
      )

      const nextCashAdvanceStatus =
        nextRemainingBalance <= 0 ? 'deducted' : 'partially_deducted'

      await connection.query(
        `
        UPDATE cash_advances
        SET
          remaining_balance = ?,
          status = ?
        WHERE id = ?
        `,
        [nextRemainingBalance, nextCashAdvanceStatus, cash_advance_id]
      )

      const nextReleaseDeduction = normalizeMoney(
        currentReleaseDeduction + deductionAmount
      )
      const nextNetReleaseAmount = normalizeMoney(
        Math.max(normalizeMoney(release.gross_release_amount) - nextReleaseDeduction, 0)
      )

      await connection.query(
        `
        UPDATE commission_releases
        SET
          cash_advance_deduction = ?,
          net_release_amount = ?
        WHERE id = ?
        `,
        [nextReleaseDeduction, nextNetReleaseAmount, releaseId]
      )

      await recalculateCommissionReleaseTotals(connection, release.commission_id)

      await connection.commit()

      await createAuditLog({
        userId: req.user.id,
        action: 'deduct',
        module: 'Commission Releases',
        description: `Deducted ${deductionAmount} cash advance from release ${releaseId}`,
        ipAddress: getClientIp(req),
      })

      return res.status(200).json({
        message: 'Cash advance deducted successfully',
        data: {
          releaseId: Number(releaseId),
          cash_advance_id: Number(cash_advance_id),
          amount: deductionAmount,
          net_release_amount: nextNetReleaseAmount,
        },
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  export const cancelRelease = async (req, res) => {
    const { id: releaseId } = req.params

    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      const [rows] = await connection.query(
        `
        SELECT *
        FROM commission_releases
        WHERE id = ?
        LIMIT 1
        `,
        [releaseId]
      )

      const release = rows[0]

      if (!release) {
        await connection.rollback()
        return res.status(404).json({ message: 'Release not found' })
      }

      if (!['pending', 'eligible', 'on_hold'].includes(release.status)) {
        await connection.rollback()
        return res.status(400).json({
          message: 'Only pending, eligible, or on-hold releases can be cancelled',
        })
      }

      await connection.query(
        `
        UPDATE commission_releases
        SET status = 'cancelled'
        WHERE id = ?
        `,
        [releaseId]
      )

      await recalculateCommissionReleaseTotals(connection, release.commission_id)

      await connection.commit()

      await createAuditLog({
        userId: req.user.id,
        action: 'cancel',
        module: 'Commission Releases',
        description: `Cancelled release ${releaseId}`,
        ipAddress: getClientIp(req),
      })

      return res.status(200).json({
        message: 'Release cancelled successfully',
        data: { releaseId: Number(releaseId) },
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }

  export const holdRelease = async (req, res) => {
    const { id: releaseId } = req.params
    const { notes } = req.body

    const [rows] = await db.query(
      `
      SELECT *
      FROM commission_releases
      WHERE id = ?
      LIMIT 1
      `,
      [releaseId]
    )

    const release = rows[0]

    if (!release) {
      return res.status(404).json({ message: 'Release not found' })
    }

    if (!['pending', 'eligible'].includes(release.status)) {
      return res.status(400).json({
        message: 'Only pending or eligible releases can be put on hold',
      })
    }

    await db.query(
      `
      UPDATE commission_releases
      SET
        status = 'on_hold',
        notes = ?
      WHERE id = ?
      `,
      [nullableValue(notes), releaseId]
    )

    await recalculateCommissionReleaseTotals(db, release.commission_id)

    await createAuditLog({
      userId: req.user.id,
      action: 'hold',
      module: 'Commission Releases',
      description: `Put release ${releaseId} on hold`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Release put on hold successfully',
      data: { releaseId: Number(releaseId) },
    })
  }

  export const unholdRelease = async (req, res) => {
    const { id: releaseId } = req.params

    const [rows] = await db.query(
      `
      SELECT
        cr.*,
        cm.client_unit_id
      FROM commission_releases cr
      INNER JOIN commissions cm ON cm.id = cr.commission_id
      WHERE cr.id = ?
      LIMIT 1
      `,
      [releaseId]
    )

    const release = rows[0]

    if (!release) {
      return res.status(404).json({ message: 'Release not found' })
    }

    if (release.status !== 'on_hold') {
      return res.status(400).json({
        message: 'Only on-hold releases can be restored',
      })
    }

    await db.query(
      `
      UPDATE commission_releases
      SET status = 'pending'
      WHERE id = ?
      `,
      [releaseId]
    )

    await refreshCommissionEligibility(release.client_unit_id, db, {
      actorRole: req.user.role,
    })
    await recalculateCommissionReleaseTotals(db, release.commission_id)

    await createAuditLog({
      userId: req.user.id,
      action: 'unhold',
      module: 'Commission Releases',
      description: `Restored release ${releaseId}`,
      ipAddress: getClientIp(req),
    })

    return res.status(200).json({
      message: 'Release restored successfully',
      data: { releaseId: Number(releaseId) },
    })
  }

  export const restoreCancelledRelease = async (req, res) => {
    const { id: releaseId } = req.params

    const connection = await db.getConnection()

    try {
      await connection.beginTransaction()

      const [rows] = await connection.query(
        `
        SELECT
          cr.*,
          cm.client_unit_id
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cr.id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [releaseId]
      )

      const release = rows[0]

      if (!release) {
        await connection.rollback()
        return res.status(404).json({ message: 'Release not found' })
      }

      if (release.status !== 'cancelled') {
        await connection.rollback()
        return res.status(400).json({
          message: 'Only cancelled releases can be restored',
        })
      }

      await connection.query(
        `
        UPDATE commission_releases
        SET status = 'pending'
        WHERE id = ?
        `,
        [releaseId]
      )

      await refreshCommissionEligibility(release.client_unit_id, connection, {
        actorRole: req.user.role,
      })
      await refreshCommissionStatus(connection, release.commission_id, {
        allowCancelledRecovery: true,
      })

      await connection.commit()

      await createAuditLog({
        userId: req.user.id,
        action: 'restore',
        module: 'Commission Releases',
        description: `Restored cancelled release ${releaseId}`,
        ipAddress: getClientIp(req),
      })

      return res.status(200).json({
        message: 'Cancelled release restored successfully',
        data: { releaseId: Number(releaseId) },
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  }


  export const getApprovedCashAdvancesBySeller = async (req, res) => {
    const { sellerId } = req.params

    const [rows] = await db.query(
      `
      SELECT *
      FROM cash_advances
      WHERE seller_id = ?
        AND status IN ('approved', 'partially_deducted')
        AND remaining_balance > 0
      ORDER BY id ASC
      `,
      [sellerId]
    )

    return res.status(200).json({
      message: 'Approved cash advances fetched successfully',
      cashAdvances: rows,
      data: rows,
    })
  }

