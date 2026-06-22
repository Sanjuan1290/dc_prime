import { db } from '../db/connect.js'

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
        SELECT COALESCE(SUM(amount), 0)
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

  const collectionProgress =
    totalSales === 0
      ? 0
      : Number(((trackedCollections / totalSales) * 100).toFixed(2))

  const cashAdvanceDeducted = formatDecimal(summaryRow.commission_cash_advance_deducted)
  const netRemaining = formatDecimal(summaryRow.commission_unreleased_balance)

  res.status(200).json({
    summary: {
      totalSales,
      pendingSales: formatDecimal(summaryRow.pending_sales),
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
        seller_id,
        client_unit_id
      FROM commissions
    ) seller_units ON seller_units.seller_id = seller.id
    LEFT JOIN client_units cu ON cu.id = seller_units.client_unit_id
    LEFT JOIN listings listing ON listing.id = cu.listing_id
    LEFT JOIN (
      SELECT
        seller_id,
        COALESCE(SUM(gross_commission), 0) AS commission_earned
      FROM commissions
      WHERE status <> 'cancelled'
      GROUP BY seller_id
    ) commission_totals ON commission_totals.seller_id = seller.id
    GROUP BY
      seller.id,
      seller.full_name,
      seller.seller_role,
      commission_totals.commission_earned
    ORDER BY net DESC
    `
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
  })
}
