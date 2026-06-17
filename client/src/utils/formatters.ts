export const formatMoney = (amount: number | string | null | undefined) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(amount || 0))
}

export const formatNumber = (value: number | string | null | undefined) => {
  return new Intl.NumberFormat("en-PH").format(Number(value || 0))
}

const toLocalDateParts = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export const formatDate = (date: string | null | undefined) => {
  if (!date) return "-"

  const rawDate = String(date).trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate
  }

  const parsedDate = new Date(rawDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate.slice(0, 10) || "-"
  }

  return toLocalDateParts(parsedDate)
}

export const formatDateOnly = (value?: string | null) => {
  if (!value) return "-"

  const rawValue = String(value).trim()
  const matchedDate = rawValue.match(/^(\d{4}-\d{2}-\d{2})/)

  return matchedDate?.[1] || rawValue.slice(0, 10) || "-"
}

export const getDateInputValue = (date: string | null | undefined) => {
  const formattedDate = formatDateOnly(date)

  return formattedDate === "-" ? getLocalDate() : formattedDate
}

export const formatTime = (time: string | null | undefined) => {
  if (!time) return "-"

  return time.slice(0, 5)
}

export const formatText = (value: string | null | undefined) => {
  if (!value) return "-"

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

export const getLocalDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
