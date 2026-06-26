export const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for']

  const rawIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim() || req.socket.remoteAddress || req.ip || ''

  if (rawIp === '::1') return '127.0.0.1'
  if (rawIp === '::ffff:127.0.0.1') return '127.0.0.1'

  return rawIp.replace('::ffff:', '')
}

export const formatIpForDisplay = (ipAddress) => {
  if (!ipAddress) return null
  if (ipAddress === '::1') return '127.0.0.1 (Localhost)'
  if (ipAddress === '::ffff:127.0.0.1') return '127.0.0.1 (Localhost)'
  if (ipAddress === '127.0.0.1') return '127.0.0.1 (Localhost)'

  return ipAddress
}

