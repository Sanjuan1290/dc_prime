import { db } from '../db/connect.js'
import {
  addDateRangeConditions,
  getDateRangeFromQuery,
} from '../utils/queryOptions.js'

const formatDecimal = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

const contractValueExpression = `
  COALESCE(
    NULLIF(l.total_contract_price, 0),
    l.net_selling_price + l.legal_misc_fee,
    l.net_selling_price,
    0
  )
`

export const getDashboardSummary = async (req, res) => {
  // TODO(perf-cache): this endpoint can later read from dashboard_summary_cache,
  // collection_summary_daily, and commission_summary_daily once nightly jobs exist.
  const [rows] = await db.query(
    `
    SELECT
      (
        SELECT COALESCE(SUM(${contractValueExpression}), 0)
        FROM client_units cu
        INNER JOIN listings l ON l.id = cu.listing_id
        WHERE cu.status IN ('active', 'reserved', 'fully_paid', 'closed')
      ) AS total_sales,

      (
        SELECT COALESCE(SUM(${contractValueExpression}), 0)
        FROM client_units cu
        INNER JOIN listings l ON l.id = cu.listing_id
        WHERE cu.status = 'reserved'
      ) AS pending_sales,

      (
        SELECT COALESCE(
          SUM(
            COALESCE(
              NULLIF(total_contract_price, 0),
              net_selling_price + legal_misc_fee,
              net_selling_price,
              0
            )
          ),
          0
        )
        FROM listings
        WHERE status IN ('available', 'reserved', 'sold', 'pending_cancellation')
      ) AS listed_lot_value,

      (
        SELECT COALESCE(
          SUM(
            COALESCE(
              NULLIF(total_contract_price, 0),
              net_selling_price + legal_misc_fee,
              net_selling_price,
              0
            )
          ),
          0
        )
        FROM listings
        WHERE status = 'available'
      ) AS available_lot_value,

      (
        SELECT COALESCE(
          SUM(
            COALESCE(
              NULLIF(total_contract_price, 0),
              net_selling_price + legal_misc_fee,
              net_selling_price,
              0
            )
          ),
          0
        )
        FROM listings
        WHERE status = 'sold'
      ) AS sold_lot_value,

      (
        SELECT COALESCE(SUM(CASE WHEN (payment_type IS NULL OR payment_type <> 'excess_ma') THEN amount ELSE 0 END), 0)
        FROM payments
        WHERE status = 'verified'
      ) AS tracked_collections,

      (
        SELECT COUNT(*)
        FROM clients
      ) AS clients_count,

      (
        SELECT COUNT(*)
        FROM client_document_list
        WHERE status IN ('not_submitted', 'rejected')
      ) AS pending_documents,

      (
        SELECT COALESCE(SUM(gross_commission), 0)
        FROM commissions
        WHERE status <> 'cancelled'
      ) AS total_commission_liability,

      (
        SELECT COALESCE(SUM(cr.net_release_amount), 0)
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cr.status = 'eligible'
          AND cm.status <> 'cancelled'
      ) AS commission_payable_now,

      (
        SELECT COALESCE(SUM(cr.net_release_amount), 0)
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cr.status = 'released'
          AND cm.status <> 'cancelled'
      ) AS commission_released,

      (
        SELECT COALESCE(SUM(cr.cash_advance_deduction), 0)
        FROM commission_releases cr
        INNER JOIN commissions cm ON cm.id = cr.commission_id
        WHERE cm.status <> 'cancelled'
      ) AS commission_cash_advance_deducted,

      GREATEST(
        (
          SELECT COALESCE(SUM(gross_commission), 0)
          FROM commissions
          WHERE status <> 'cancelled'
        )
        -
        (
          SELECT COALESCE(SUM(cr.net_release_amount), 0)
          FROM commission_releases cr
          INNER JOIN commissions cm ON cm.id = cr.commission_id
          WHERE cr.status = 'released'
            AND cm.status <> 'cancelled'
        )
        -
        (
          SELECT COALESCE(SUM(cr.cash_advance_deduction), 0)
          FROM commission_releases cr
          INNER JOIN commissions cm ON cm.id = cr.commission_id
          WHERE cm.status <> 'cancelled'
        ),
        0
      ) AS commission_unreleased_balance,

      (
        SELECT COALESCE(SUM(discontinued_amount), 0)
        FROM client_unit_cancellation_settlements
        WHERE settlement_status = 'settled'
          AND settlement_result IN ('discontinued', 'partial_refund')
      ) AS discontinued_money,

      (
        SELECT COALESCE(SUM(refund_amount), 0)
        FROM client_unit_cancellation_settlements
        WHERE settlement_status = 'settled'
          AND settlement_result IN ('full_refund', 'partial_refund')
      ) AS refunded_amount,

      (
        SELECT COALESCE(SUM(refund_amount), 0)
        FROM client_unit_cancellation_settlements
        WHERE refund_amount > 0
          AND settlement_status = 'approved_for_refund'
      ) AS pending_refunds,

      (
        SELECT COUNT(*)
        FROM client_units
        WHERE status = 'pending_cancellation'
          OR COALESCE(cancellation_status, 'none') IN ('pending_settlement', 'approved_for_refund')
      ) AS pending_cancellations,

      (
        SELECT COUNT(*)
        FROM client_units
        WHERE status = 'cancelled'
          AND COALESCE(cancellation_status, 'none') = 'settled'
      ) AS cancelled_accounts,

      (
        SELECT COUNT(*)
        FROM client_units
        WHERE cleared_for_resale_at IS NOT NULL
      ) AS units_cleared_for_resale
    `
  )

  const summaryRow = rows[0]

  const totalSales = formatDecimal(summaryRow.total_sales)
  const trackedCollections = formatDecimal(summaryRow.tracked_collections)
  const pendingSales = formatDecimal(Math.max(totalSales - trackedCollections, 0))

  const collectionProgress =
    totalSales === 0
      ? 0
      : Number(((trackedCollections / totalSales) * 100).toFixed(2))

  const cashAdvanceDeducted = formatDecimal(summaryRow.commission_cash_advance_deducted)
  const netRemaining = formatDecimal(summaryRow.commission_unreleased_balance)

  res.status(200).json({
    summary: {
      totalSales,
      pendingSales,
      listedLotValue: formatDecimal(summaryRow.listed_lot_value),
      availableLotValue: formatDecimal(summaryRow.available_lot_value),
      soldLotValue: formatDecimal(summaryRow.sold_lot_value),
      trackedCollections,
      collectionProgress,
      clientsCount: Number(summaryRow.clients_count || 0),
      pendingDocuments: Number(summaryRow.pending_documents || 0),
      discontinuedMoney: formatDecimal(summaryRow.discontinued_money),
      refundedAmount: formatDecimal(summaryRow.refunded_amount),
      pendingRefunds: formatDecimal(summaryRow.pending_refunds),
      pendingCancellations: Number(summaryRow.pending_cancellations || 0),
      cancelledAccounts: Number(summaryRow.cancelled_accounts || 0),
      unitsClearedForResale: Number(summaryRow.units_cleared_for_resale || 0),
      totalCommissionLiability: formatDecimal(summaryRow.total_commission_liability),
      commissionPayableNow: formatDecimal(summaryRow.commission_payable_now),
      commissionReleased: formatDecimal(summaryRow.commission_released),
      commissionCashAdvanceDeducted: cashAdvanceDeducted,
      commissionUnreleasedBalance: netRemaining,
      commissionPayable: formatDecimal(summaryRow.commission_payable_now),
      commissionRemaining: netRemaining,
      cashAdvanceDeducted,
      netCommissionRemaining: netRemaining,
    },
  })
}

export const getAgentPerformance = async (req, res) => {
  const { dateFrom, dateTo } = getDateRangeFromQuery(req.query, {
    defaultToCurrentMonth: true,
  })
  const dateConditions = []
  const dateParams = []

  addDateRangeConditions({
    conditions: dateConditions,
    params: dateParams,
    column: 'cu.created_at',
    dateFrom,
    dateTo,
  })

  const dateWhereClause =
    dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : ''

  const [rows] = await db.query(
    `
    SELECT
      seller.id AS seller_id,
      seller.full_name AS agent,
      seller.seller_role,

      COALESCE(
        SUM(
          COALESCE(
            NULLIF(listing.total_contract_price, 0),
            listing.net_selling_price + listing.legal_misc_fee,
            listing.net_selling_price,
            0
          )
        ),
        0
      ) AS total_sales,

      SUM(
        CASE
          WHEN cu.id IS NOT NULL
           AND cu.status <> 'cancelled'
          THEN 1
          ELSE 0
        END
      ) AS active,

      SUM(
        CASE
          WHEN cu.status = 'cancelled'
          THEN 1
          ELSE 0
        END
      ) AS cancelled,

      COALESCE(commission_totals.commission_earned, 0) AS net
    FROM accredited_sellers seller
    LEFT JOIN (
      SELECT DISTINCT
        cm.seller_id,
        cm.client_unit_id
      FROM commissions cm
      INNER JOIN client_units cu ON cu.id = cm.client_unit_id
      WHERE 1 = 1
        ${dateWhereClause}
    ) seller_units ON seller_units.seller_id = seller.id
    LEFT JOIN client_units cu ON cu.id = seller_units.client_unit_id
    LEFT JOIN listings listing ON listing.id = cu.listing_id
    LEFT JOIN (
      SELECT
        cm.seller_id,
        COALESCE(SUM(cm.gross_commission), 0) AS commission_earned
      FROM commissions cm
      INNER JOIN client_units cu ON cu.id = cm.client_unit_id
      WHERE cm.status <> 'cancelled'
        ${dateWhereClause}
      GROUP BY cm.seller_id
    ) commission_totals ON commission_totals.seller_id = seller.id
    GROUP BY
      seller.id,
      seller.full_name,
      seller.seller_role,
      commission_totals.commission_earned
    ORDER BY net DESC
    `,
    [...dateParams, ...dateParams]
  )

  const agents = rows.map((agent) => ({
    ...agent,
    total_sales: formatDecimal(agent.total_sales),
    active: Number(agent.active || 0),
    cancelled: Number(agent.cancelled || 0),
    net: formatDecimal(agent.net),
  }))

  res.status(200).json({
    agents,
    dateRange: {
      date_from: dateFrom,
      date_to: dateTo,
    },
  })
}

export const getGroupPerformance = async (req, res) => {
  const { dateFrom, dateTo } = getDateRangeFromQuery(req.query, {
    defaultToCurrentMonth: true,
  })
  const conditions = []
  const params = []

  addDateRangeConditions({
    conditions,
    params,
    column: 'cu.created_at',
    dateFrom,
    dateTo,
  })

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // TODO(perf-cache): this aggregate can later be served from
  // group_performance_daily and seller_performance_daily summary tables.
  const [rows] = await db.query(
    `
    SELECT
      COALESCE(cu.seller_group_id, seller.seller_group_id) AS seller_group_id,
      COALESCE(cu.seller_group_name_snapshot, sg.group_name, 'Direct to Developer') AS group_name,
      COALESCE(sg.group_code, 'DIRECT') AS group_code,
      COALESCE(head.full_name, 'Unassigned') AS group_head,
      COALESCE(cu.seller_group_pool_rate_snapshot, sg.pool_rate, 0) AS pool_rate,
      COUNT(DISTINCT cu.id) AS sales_count,
      COALESCE(
        SUM(
          COALESCE(
            NULLIF(cu.offer_purchase_price, 0),
            NULLIF(l.total_contract_price, 0),
            l.net_selling_price + l.legal_misc_fee,
            l.net_selling_price,
            0
          )
        ),
        0
      ) AS total_sales,
      SUM(CASE WHEN cu.status IN ('reserved', 'active', 'past_due') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN cu.status IN ('fully_paid', 'closed') THEN 1 ELSE 0 END) AS fully_paid,
      SUM(CASE WHEN cu.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
      COALESCE(SUM(payment_summary.verified_collections), 0) AS verified_collections,
      COALESCE(SUM(commission_summary.gross_commission), 0) AS gross_commission,
      COALESCE(SUM(commission_summary.released_commission), 0) AS released_commission
    FROM client_units cu
    LEFT JOIN listings l ON l.id = cu.listing_id
    LEFT JOIN accredited_sellers seller ON seller.id = cu.seller_id
    LEFT JOIN seller_groups sg ON sg.id = COALESCE(cu.seller_group_id, seller.seller_group_id)
    LEFT JOIN accredited_sellers head ON head.id = sg.group_head_seller_id
    LEFT JOIN (
      SELECT
        client_unit_id,
        SUM(amount) AS verified_collections
      FROM payments
      WHERE status = 'verified'
        AND (payment_type IS NULL OR payment_type <> 'excess_ma')
      GROUP BY client_unit_id
    ) payment_summary ON payment_summary.client_unit_id = cu.id
    LEFT JOIN (
      SELECT
        cm.client_unit_id,
        SUM(cm.gross_commission) AS gross_commission,
        SUM(COALESCE(release_summary.released_commission, 0)) AS released_commission
      FROM commissions cm
      LEFT JOIN (
        SELECT
          commission_id,
          SUM(net_release_amount) AS released_commission
        FROM commission_releases
        WHERE status = 'released'
        GROUP BY commission_id
      ) release_summary ON release_summary.commission_id = cm.id
      WHERE cm.status <> 'cancelled'
      GROUP BY cm.client_unit_id
    ) commission_summary ON commission_summary.client_unit_id = cu.id
    ${whereClause}
    GROUP BY
      COALESCE(cu.seller_group_id, seller.seller_group_id),
      COALESCE(cu.seller_group_name_snapshot, sg.group_name, 'Direct to Developer'),
      COALESCE(sg.group_code, 'DIRECT'),
      COALESCE(head.full_name, 'Unassigned'),
      COALESCE(cu.seller_group_pool_rate_snapshot, sg.pool_rate, 0)
    ORDER BY total_sales DESC
    `,
    params
  )

  const groups = rows.map((group) => {
    const totalSales = formatDecimal(group.total_sales)
    const verifiedCollections = formatDecimal(group.verified_collections)
    const grossCommission = formatDecimal(group.gross_commission)
    const releasedCommission = formatDecimal(group.released_commission)

    return {
      seller_group_id: group.seller_group_id,
      group_name: group.group_name,
      group_code: group.group_code,
      group_head: group.group_head,
      pool_rate: formatDecimal(group.pool_rate),
      sales_count: Number(group.sales_count || 0),
      total_sales: totalSales,
      verified_collections: verifiedCollections,
      collection_rate:
        totalSales > 0
          ? Number(((verifiedCollections / totalSales) * 100).toFixed(2))
          : 0,
      active: Number(group.active || 0),
      fully_paid: Number(group.fully_paid || 0),
      cancelled: Number(group.cancelled || 0),
      gross_commission: grossCommission,
      released_commission: releasedCommission,
      remaining_commission: formatDecimal(grossCommission - releasedCommission),
    }
  })

  res.status(200).json({
    groups,
    data: groups,
    dateRange: {
      date_from: dateFrom,
      date_to: dateTo,
    },
  })
}
