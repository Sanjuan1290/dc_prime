const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const isMissing = (value) => {
  return value === undefined || value === null || value === ''
}

export const parseDateOnly = (value) => {
  if (isMissing(value)) return null

  const dateString = String(value).trim()
  if (!DATE_ONLY_PATTERN.test(dateString)) return null

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

export const getCurrentMonthDateRange = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  const formatDate = (value) => {
    const yyyy = value.getFullYear()
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    const dd = String(value.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return {
    dateFrom: formatDate(startDate),
    dateTo: formatDate(endDate),
  }
}

export const getDateRangeFromQuery = (
  query,
  { defaultToCurrentMonth = false } = {}
) => {
  const defaults = defaultToCurrentMonth ? getCurrentMonthDateRange() : {}
  const dateFrom = parseDateOnly(query.date_from) || defaults.dateFrom || null
  const dateTo = parseDateOnly(query.date_to) || defaults.dateTo || null

  return { dateFrom, dateTo }
}

export const addDateRangeConditions = ({
  conditions,
  params,
  column,
  dateFrom,
  dateTo,
}) => {
  if (dateFrom) {
    conditions.push(`${column} >= ?`)
    params.push(dateFrom)
  }

  if (dateTo) {
    conditions.push(`${column} < DATE_ADD(?, INTERVAL 1 DAY)`)
    params.push(dateTo)
  }
}

export const getPaginationOptions = (query, { defaultLimit = 25 } = {}) => {
  const rawPage = Number(query.page)
  const rawLimit = Number(query.limit)
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const requestedLimit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit
  const limit = Math.min(requestedLimit, 100)
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export const getSortOptions = (
  query,
  allowlist,
  { defaultSortBy, defaultSortDir = 'DESC' }
) => {
  const sortBy = allowlist[query.sort_by] ? query.sort_by : defaultSortBy
  const normalizedDir = String(query.sort_dir || defaultSortDir).toUpperCase()
  const sortDir = normalizedDir === 'ASC' ? 'ASC' : 'DESC'

  return {
    sortBy,
    sortColumn: allowlist[sortBy],
    sortDir,
  }
}

export const buildPagination = ({ page, limit, totalRows }) => {
  const safeTotalRows = Number(totalRows || 0)

  return {
    page,
    limit,
    totalRows: safeTotalRows,
    totalPages: Math.max(Math.ceil(safeTotalRows / limit), 0),
  }
}
