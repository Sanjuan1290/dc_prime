import { db } from '../db/connect.js'
import { getSellerForUser, getVisibleSellerIdsForUser, isOfficeRole } from '../utils/sellerVisibility.js'

const money = (value) => Number(Number(value || 0).toFixed(2))

const requireSellerAccess = async (req, res) => {
  if (isOfficeRole(req.user.role)) {
    return {
      isOffice: true,
      visibleSellerIds: null,
      seller: null,
    }
  }

  const seller = await getSellerForUser(req.user.id)
  if (!seller) {
    res.status(403).json({ message: 'Your account is not linked to an active accredited seller profile.' })
    return null
  }

  const visibleSellerIds = await getVisibleSellerIdsForUser(req.user)

  return {
    isOffice: false,
    visibleSellerIds,
    seller,
  }
}

const sellerScopeSql = (visibleSellerIds, column = 'seller.id') => {
  if (visibleSellerIds === null) return { clause: '1 = 1', params: [] }
  if (!visibleSellerIds.length) return { clause: '1 = 0', params: [] }
  return {
    clause: `${column} IN (${visibleSellerIds.map(() => '?').join(', ')})`,
    params: visibleSellerIds,
  }
}

export const getSellerDashboard = async (req, res) => {
  const access = await requireSellerAccess(req, res)
  if (!access) return

  const scope = sellerScopeSql(access.visibleSellerIds, 'seller.id')

  const [summaryRows] = await db.query(
    `
    SELECT
      COUNT(DISTINCT cu.id) AS total_sales,
      COUNT(DISTINCT cu.client_id) AS total_clients,
      COALESCE(SUM(COALESCE(l.total_contract_price, l.net_selling_price + l.legal_misc_fee, 0)), 0) AS total_tcp,
      COALESCE(SUM(cm.gross_commission), 0) AS total_commission,
      COALESCE(SUM(CASE WHEN cm.status IN ('released', 'partially_released') THEN cm.released_amount ELSE 0 END), 0) AS released_commission,
      COALESCE(SUM(CASE WHEN cm.status NOT IN ('released', 'cancelled') THEN GREATEST(cm.gross_commission - cm.released_amount, 0) ELSE 0 END), 0) AS pending_commission
    FROM accredited_sellers seller
    LEFT JOIN client_units cu ON cu.seller_id = seller.id
    LEFT JOIN listings l ON l.id = cu.listing_id
    LEFT JOIN commissions cm ON cm.seller_id = seller.id
    WHERE ${scope.clause}
    `,
    scope.params
  )

  const [teamRows] = await db.query(
    `
    SELECT seller_role, COUNT(*) AS count
    FROM accredited_sellers seller
    WHERE ${scope.clause}
      AND seller.status = 'active'
    GROUP BY seller_role
    `,
    scope.params
  )

  const [availableRows] = await db.query(
    `SELECT COUNT(*) AS available_units FROM listings WHERE status = 'available'`
  )

  const [recentSales] = await db.query(
    `
    SELECT
      cu.id,
      client.full_name AS client_name,
      listing.unit_id,
      project.name AS project_name,
      seller.full_name AS seller_name,
      seller.seller_role,
      COALESCE(listing.total_contract_price, listing.net_selling_price + listing.legal_misc_fee, 0) AS total_contract_price,
      cu.status,
      cu.created_at
    FROM client_units cu
    INNER JOIN accredited_sellers seller ON seller.id = cu.seller_id
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    INNER JOIN projects project ON project.id = listing.project_id
    WHERE ${scope.clause}
    ORDER BY cu.id DESC
    LIMIT 10
    `,
    scope.params
  )

  const summary = summaryRows[0] || {}

  res.status(200).json({
    message: 'Seller dashboard fetched successfully',
    seller: access.seller,
    summary: {
      total_sales: Number(summary.total_sales || 0),
      total_clients: Number(summary.total_clients || 0),
      total_tcp: money(summary.total_tcp),
      total_commission: money(summary.total_commission),
      released_commission: money(summary.released_commission),
      pending_commission: money(summary.pending_commission),
      available_units: Number(availableRows[0]?.available_units || 0),
    },
    teamCounts: teamRows,
    recentSales,
  })
}

export const getSellerAvailableUnits = async (req, res) => {
  const access = await requireSellerAccess(req, res)
  if (!access) return

  const [rows] = await db.query(
    `
    SELECT
      l.id,
      l.unit_id,
      l.lot_type,
      l.lot_area_sqm,
      l.price_per_sqm,
      l.net_selling_price,
      l.legal_misc_fee,
      l.total_contract_price,
      l.reservation_fee,
      l.status,
      p.name AS project_name,
      p.location,
      p.location_code
    FROM listings l
    INNER JOIN projects p ON p.id = l.project_id
    WHERE l.status = 'available'
    ORDER BY p.name ASC, l.unit_id ASC
    `
  )

  res.status(200).json({ message: 'Available units fetched successfully', units: rows, data: rows })
}

export const getSellerTeam = async (req, res) => {
  const access = await requireSellerAccess(req, res)
  if (!access) return

  const scope = sellerScopeSql(access.visibleSellerIds, 'seller.id')

  const [rows] = await db.query(
    `
    SELECT
      seller.id,
      seller.full_name,
      seller.email,
      seller.contact_no,
      seller.seller_role,
      seller.parent_seller_id,
      parent.full_name AS parent_seller_name,
      seller.commission_pool_rate,
      seller.personal_commission_rate,
      seller.override_commission_rate,
      seller.status,
      COUNT(DISTINCT cu.id) AS total_sales,
      COALESCE(SUM(COALESCE(l.total_contract_price, l.net_selling_price + l.legal_misc_fee, 0)), 0) AS total_tcp
    FROM accredited_sellers seller
    LEFT JOIN accredited_sellers parent ON parent.id = seller.parent_seller_id
    LEFT JOIN client_units cu ON cu.seller_id = seller.id
    LEFT JOIN listings l ON l.id = cu.listing_id
    WHERE ${scope.clause}
      ${access.seller ? 'AND seller.id <> ?' : ''}
    GROUP BY seller.id
    ORDER BY FIELD(seller.seller_role, 'broker_network_manager', 'broker', 'manager', 'agent'), seller.full_name
    `,
    access.seller ? [...scope.params, access.seller.id] : scope.params
  )

  res.status(200).json({ message: 'Team fetched successfully', team: rows, data: rows })
}

export const getSellerSales = async (req, res) => {
  const access = await requireSellerAccess(req, res)
  if (!access) return

  const scope = sellerScopeSql(access.visibleSellerIds, 'seller.id')

  const [rows] = await db.query(
    `
    SELECT
      cu.id,
      cu.status,
      cu.mode_of_payment,
      cu.starting_date,
      cu.due_date,
      client.full_name AS client_name,
      listing.unit_id,
      project.name AS project_name,
      seller.full_name AS seller_name,
      seller.seller_role,
      COALESCE(listing.total_contract_price, listing.net_selling_price + listing.legal_misc_fee, 0) AS total_contract_price,
      COALESCE(cm.gross_commission, 0) AS seller_commission,
      COALESCE(cm.released_amount, 0) AS released_commission,
      cu.created_at
    FROM client_units cu
    INNER JOIN accredited_sellers seller ON seller.id = cu.seller_id
    INNER JOIN clients client ON client.id = cu.client_id
    INNER JOIN listings listing ON listing.id = cu.listing_id
    INNER JOIN projects project ON project.id = listing.project_id
    LEFT JOIN commissions cm ON cm.client_unit_id = cu.id AND cm.seller_id = seller.id
    WHERE ${scope.clause}
    ORDER BY cu.id DESC
    `,
    scope.params
  )

  res.status(200).json({ message: 'Sales fetched successfully', sales: rows, data: rows })
}
