import Button from "./Button"
import Select from "./Select"
import { getPaginationInfo } from "../../utils/pagination"

type PaginationProps = {
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  page: number
  rowsPerPage: number
  totalRows: number
}

const Pagination = ({
  onPageChange,
  onRowsPerPageChange,
  page,
  rowsPerPage,
  totalRows,
}: PaginationProps) => {
  const { end, safePage, start, totalPages } = getPaginationInfo(
    totalRows,
    page,
    rowsPerPage
  )

  return (
    <div className="flex flex-col gap-3 rounded-b-xl border-x border-b border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {start}-{end} of {totalRows} records
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Rows per page"
          className="w-24"
          value={rowsPerPage}
          onChange={(e) => {
            onRowsPerPageChange(Number(e.target.value))
            onPageChange(1)
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </Select>
        <Button
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          variant="secondary"
        >
          Previous
        </Button>
        <span className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-900">
          Page {safePage} of {totalPages}
        </span>
        <Button
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          variant="secondary"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default Pagination

