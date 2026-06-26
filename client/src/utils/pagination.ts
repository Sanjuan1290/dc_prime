export const paginateRows = <T,>(
  rows: T[],
  page: number,
  rowsPerPage: number
) => {
  const startIndex = (page - 1) * rowsPerPage

  return rows.slice(startIndex, startIndex + rowsPerPage)
}

export const getPaginationInfo = (
  totalRows: number,
  page: number,
  rowsPerPage: number
) => {
  const totalPages = Math.max(Math.ceil(totalRows / rowsPerPage), 1)
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = totalRows === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const end = Math.min(safePage * rowsPerPage, totalRows)

  return {
    totalPages,
    safePage,
    start,
    end,
  }
}

