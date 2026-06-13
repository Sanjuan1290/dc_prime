export const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({
      message: 'Access denied. You do not have permission to perform this action.',
    })
  }
  next()
}

export const adminRoles = ['super_admin', 'admin']
export const sellerRoles = ['broker_network_manager', 'broker', 'manager', 'agent']
