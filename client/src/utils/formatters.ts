export const formatMoney = (amount: number | string | null | undefined) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(amount || 0))
}

export const formatNumber = (value: number | string | null | undefined) => {
  return new Intl.NumberFormat("en-PH").format(Number(value || 0))
}

export const formatDate = (date: string | null | undefined) => {
  if (!date) return "-"

  return date.slice(0, 10)
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
