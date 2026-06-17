import rateLimit from 'express-rate-limit'

const RATE_LIMIT_TIME_ZONE = 'Asia/Manila'

const normalizeResetTime = (resetTime) => {
  if (!resetTime) return null

  const resetDate = resetTime instanceof Date ? resetTime : new Date(resetTime)

  if (Number.isNaN(resetDate.getTime())) return null

  return resetDate
}

const getRetryAfterSeconds = (req) => {
  const resetDate = normalizeResetTime(req.rateLimit?.resetTime)

  if (!resetDate) return null

  return Math.max(Math.ceil((resetDate.getTime() - Date.now()) / 1000), 1)
}

const formatRetryAt = (req) => {
  const resetDate = normalizeResetTime(req.rateLimit?.resetTime)

  if (!resetDate) return null

  return resetDate.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: RATE_LIMIT_TIME_ZONE,
  })
}

const createRateLimitHandler = (prefix) => (req, res) => {
  const retryAfterSeconds = getRetryAfterSeconds(req)
  const retryAfterMinutes = retryAfterSeconds
    ? Math.ceil(retryAfterSeconds / 60)
    : null
  const retryAt = formatRetryAt(req)

  if (retryAfterSeconds) {
    res.set('Retry-After', String(retryAfterSeconds))
  }

  return res.status(429).json({
    message: retryAt
      ? `${prefix} Try again at ${retryAt}.`
      : `${prefix} Please try again later.`,
    retryAfterSeconds,
    retryAfterMinutes,
    retryAt,
    timeZone: RATE_LIMIT_TIME_ZONE,
  })
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler('Too many login attempts.'),
})

export const passwordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many password attempts.'),
})
