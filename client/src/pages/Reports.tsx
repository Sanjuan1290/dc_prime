import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  FiBarChart2,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatText,
} from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type ReportType =
  | "sales"
  | "collections"
  | "inventory"
  | "commissions"
  | "documents"
  | "clients"

type SalesReport = {
  client_unit_id: number
  client_name: string
  project_name: string
  unit_id: string
  net_selling_price: number | string
  legal_misc_rate: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  total_paid: number | string
  balance: number | string
  status: string
  created_at: string
}

type CollectionsReport = {
  payment_id: number
  client_unit_id: number
  client_name: string
  project_name: string
  unit_id: string
  amount: number | string
  payment_type: string
  payment_method: string
  payment_date: string
  total_contract_price: number | string
  balance: number | string
}

type InventoryReport = {
  listing_id: number
  project_name: string
  cadastral_lot_no: string | null
  unit_id: string
  lot_type: string | null
  lot_area_sqm: number | string
  price_per_sqm: number | string
  promo_discount: number | string
  net_selling_price: number | string
  legal_misc_rate: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  status: string
  created_at: string
}

type CommissionsReport = {
  commission_id: number
  seller_name: string | null
  seller_role: string | null
  reports_under: string | null
  client_name: string
  project_name: string
  unit_id: string
  net_selling_price: number | string
  total_contract_price: number | string
  rate: number | string
  gross_commission: number | string
  released_amount: number | string
  remaining_amount: number | string
  status: string
  created_at: string
}

type DocumentsReport = {
  checklist_id: number
  client_name: string
  project_name: string
  unit_id: string
  document_name: string
  is_required: number | boolean
  can_reuse: number | boolean
  status: string
  reviewed_by_name: string | null
  reviewed_at: string | null
}

type ClientsReport = {
  client_id: number
  client_name: string
  email: string | null
  contact_no: string | null
  address: string | null
  region: string | null
  units_count: number | string
  total_contract_value: number | string
  total_paid: number | string
  balance: number | string
}

type AnyReportRow =
  | SalesReport
  | CollectionsReport
  | InventoryReport
  | CommissionsReport
  | DocumentsReport
  | ClientsReport

type ReportResponse = {
  sales?: SalesReport[]
  collections?: CollectionsReport[]
  inventory?: InventoryReport[]
  commissions?: CommissionsReport[]
  documents?: DocumentsReport[]
  clients?: ClientsReport[]
}

const reportTypes: ReportType[] = [
  "sales",
  "collections",
  "inventory",
  "commissions",
  "documents",
  "clients",
]

const reportDescriptions: Record<ReportType, string> = {
  sales:
    "Sold and reserved client units with total contract price, paid amount, and balance.",
  collections:
    "Payment records with client, unit, amount, payment type, method, and balance.",
  inventory:
    "Project listing inventory with lot price, legal/misc rate, and total contract price.",
  commissions:
    "Seller commission report with total contract price, commission amount, released amount, and remaining amount.",
  documents:
    "Client unit document checklist report with required, reusable, and review status.",
  clients:
    "Client report with contact details, region, total contract value, paid amount, and balance.",
}

const getReportEndpoint = (reportType: ReportType) => {
  return `${API_URL}/reports/${reportType}`
}

const fetchReport = async (reportType: ReportType): Promise<AnyReportRow[]> => {
  const response = await fetch(getReportEndpoint(reportType), {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ReportResponse
  return (data[reportType] || []) as AnyReportRow[]
}

const normalizeForSearch = (value: unknown) => {
  if (value === null || value === undefined) return ""
  return String(value).toLowerCase()
}

const rowMatchesSearch = (row: AnyReportRow, searchInput: string) => {
  const search = searchInput.toLowerCase().trim()

  if (search === "") return true

  return Object.values(row).some((value) =>
    normalizeForSearch(value).includes(search)
  )
}

const getReportTotalAmount = (reportType: ReportType, rows: AnyReportRow[]) => {
  if (reportType === "sales") {
    return (rows as SalesReport[]).reduce(
      (sum, row) => sum + Number(row.total_contract_price || 0),
      0
    )
  }

  if (reportType === "collections") {
    return (rows as CollectionsReport[]).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    )
  }

  if (reportType === "inventory") {
    return (rows as InventoryReport[]).reduce(
      (sum, row) => sum + Number(row.total_contract_price || 0),
      0
    )
  }

  if (reportType === "commissions") {
    return (rows as CommissionsReport[]).reduce(
      (sum, row) => sum + Number(row.gross_commission || 0),
      0
    )
  }

  if (reportType === "clients") {
    return (rows as ClientsReport[]).reduce(
      (sum, row) => sum + Number(row.total_contract_value || 0),
      0
    )
  }

  return 0
}

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>("sales")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    data: reportRows = [],
    isLoading,
    error,
    isFetching,
  } = useQuery<AnyReportRow[]>({
    queryKey: ["reports", reportType],
    queryFn: () => fetchReport(reportType),
  })

  const filteredRows = reportRows.filter((row) =>
    rowMatchesSearch(row, searchInput)
  )

  const totalRecords = filteredRows.length
  const totalAmount = getReportTotalAmount(reportType, filteredRows)

  const resetFilters = () => {
    setSearchInput("")
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        icon={<FiBarChart2 />}
        title="Reports"
        subtitle={reportDescriptions[reportType]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<FiPrinter />} onClick={() => window.print()}>
              Print
            </Button>

            <Button icon={<FiRefreshCw />} onClick={resetFilters}>
              Reset
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert
          variant="error"
          title="Failed to load report"
          message="Check if the report backend route is running properly."
        />
      ) : null}

      {isFetching && !isLoading ? (
        <Alert variant="info" title="Refreshing report..." />
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Report Type" value={formatText(reportType)} />
        <StatCard label="Records" value={totalRecords} />
        <StatCard
          label={
            reportType === "documents"
              ? "Amount"
              : reportType === "collections"
                ? "Total Collected"
                : reportType === "commissions"
                  ? "Total Commission"
                  : "Total Contract Value"
          }
          value={reportType === "documents" ? "-" : formatMoney(totalAmount)}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[260px_minmax(0,1fr)_auto]">
        <Select
          value={reportType}
          onChange={(e) => {
            setReportType(e.target.value as ReportType)
            setSearchInput("")
            setPage(1)
          }}
        >
          {reportTypes.map((type) => (
            <option key={type} value={type}>
              {formatText(type)}
            </option>
          ))}
        </Select>

        <Input
          icon={<FiSearch />}
          placeholder="Search current report..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />

        <Button icon={<FiRefreshCw />} onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading report..." />
      ) : (
        <ReportTable
          page={page}
          reportType={reportType}
          rows={filteredRows}
          rowsPerPage={rowsPerPage}
        />
      )}

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRecords}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  )
}

type ReportTableProps = {
  page: number
  reportType: ReportType
  rows: AnyReportRow[]
  rowsPerPage: number
}

const cellClass = "px-4 py-3 text-slate-600"
const headerClass = "px-4 py-3 text-left font-semibold text-slate-600"

const ReportTable = ({
  page,
  reportType,
  rows,
  rowsPerPage,
}: ReportTableProps) => {
  if (reportType === "sales") {
    const paginatedRows = paginateRows(rows as SalesReport[], page, rowsPerPage)

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Client",
                "Project",
                "Unit",
                "Net Selling Price",
                "Legal / Misc",
                "Total Contract Price",
                "Total Paid",
                "Balance",
                "Status",
                "Created At",
              ].map((heading) => (
                <th key={heading} className={headerClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.map((item) => (
              <tr key={item.client_unit_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.client_name}
                </td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>
                  {formatMoney(item.net_selling_price)}
                </td>
                <td className={cellClass}>
                  <div>{formatNumber(item.legal_misc_rate)}%</div>
                  <div className="text-xs text-slate-500">
                    {formatMoney(item.legal_misc_fee)}
                  </div>
                </td>
                <td className={cellClass}>
                  {formatMoney(item.total_contract_price)}
                </td>
                <td className={cellClass}>{formatMoney(item.total_paid)}</td>
                <td className={cellClass}>{formatMoney(item.balance)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className={cellClass}>{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? <EmptyState title="No sales records found" /> : null}
      </TableContainer>
    )
  }

  if (reportType === "collections") {
    const paginatedRows = paginateRows(
      rows as CollectionsReport[],
      page,
      rowsPerPage
    )

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Client",
                "Project",
                "Unit",
                "Amount",
                "Type",
                "Method",
                "Payment Date",
                "Total Contract Price",
                "Balance",
              ].map((heading) => (
                <th key={heading} className={headerClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.map((item) => (
              <tr key={item.payment_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.client_name}
                </td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{formatMoney(item.amount)}</td>
                <td className={cellClass}>{formatText(item.payment_type)}</td>
                <td className={cellClass}>{formatText(item.payment_method)}</td>
                <td className={cellClass}>{formatDate(item.payment_date)}</td>
                <td className={cellClass}>
                  {formatMoney(item.total_contract_price)}
                </td>
                <td className={cellClass}>{formatMoney(item.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <EmptyState title="No collection records found" />
        ) : null}
      </TableContainer>
    )
  }

  if (reportType === "inventory") {
    const paginatedRows = paginateRows(
      rows as InventoryReport[],
      page,
      rowsPerPage
    )

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Project",
                "Cadastral Lot No.",
                "Unit",
                "Lot Type",
                "Area",
                "Price / SQM",
                "Promo Discount",
                "Net Selling Price",
                "Legal / Misc",
                "Total Contract Price",
                "Status",
              ].map((heading) => (
                <th key={heading} className={headerClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.map((item) => (
              <tr key={item.listing_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.project_name}
                </td>
                <td className={cellClass}>{item.cadastral_lot_no || "-"}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{formatText(item.lot_type)}</td>
                <td className={cellClass}>
                  {formatNumber(item.lot_area_sqm)} sqm
                </td>
                <td className={cellClass}>{formatMoney(item.price_per_sqm)}</td>
                <td className={cellClass}>{formatMoney(item.promo_discount)}</td>
                <td className={cellClass}>
                  {formatMoney(item.net_selling_price)}
                </td>
                <td className={cellClass}>
                  <div>{formatNumber(item.legal_misc_rate)}%</div>
                  <div className="text-xs text-slate-500">
                    {formatMoney(item.legal_misc_fee)}
                  </div>
                </td>
                <td className={cellClass}>
                  {formatMoney(item.total_contract_price)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <EmptyState title="No inventory records found" />
        ) : null}
      </TableContainer>
    )
  }

  if (reportType === "commissions") {
    const paginatedRows = paginateRows(
      rows as CommissionsReport[],
      page,
      rowsPerPage
    )

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Seller",
                "Role",
                "Reports Under",
                "Client",
                "Project",
                "Unit",
                "Total Contract Price",
                "Rate",
                "Commission",
                "Released",
                "Remaining",
                "Status",
              ].map((heading) => (
                <th key={heading} className={headerClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.map((item) => (
              <tr key={item.commission_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.seller_name || "-"}
                </td>
                <td className={cellClass}>{formatText(item.seller_role)}</td>
                <td className={cellClass}>{item.reports_under || "-"}</td>
                <td className={cellClass}>{item.client_name}</td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>
                  {formatMoney(item.total_contract_price)}
                </td>
                <td className={cellClass}>{formatNumber(item.rate)}%</td>
                <td className={cellClass}>{formatMoney(item.gross_commission)}</td>
                <td className={cellClass}>
                  {formatMoney(item.released_amount)}
                </td>
                <td className={cellClass}>
                  {formatMoney(item.remaining_amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <EmptyState title="No commission records found" />
        ) : null}
      </TableContainer>
    )
  }

  if (reportType === "documents") {
    const paginatedRows = paginateRows(
      rows as DocumentsReport[],
      page,
      rowsPerPage
    )

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Client",
                "Project",
                "Unit",
                "Document",
                "Required",
                "Reusable",
                "Status",
                "Reviewed By",
                "Reviewed At",
              ].map((heading) => (
                <th key={heading} className={headerClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.map((item) => (
              <tr key={item.checklist_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.client_name}
                </td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{item.document_name}</td>
                <td className={cellClass}>
                  {item.is_required ? "Yes" : "No"}
                </td>
                <td className={cellClass}>{item.can_reuse ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className={cellClass}>{item.reviewed_by_name || "-"}</td>
                <td className={cellClass}>{formatDate(item.reviewed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <EmptyState title="No document records found" />
        ) : null}
      </TableContainer>
    )
  }

  const paginatedRows = paginateRows(rows as ClientsReport[], page, rowsPerPage)

  return (
    <TableContainer>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {[
              "Client",
              "Email",
              "Contact",
              "Address",
              "Region",
              "Units",
              "Total Contract Value",
              "Total Paid",
              "Balance",
            ].map((heading) => (
              <th key={heading} className={headerClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {paginatedRows.map((item) => (
            <tr key={item.client_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">
                {item.client_name}
              </td>
              <td className={cellClass}>{item.email || "-"}</td>
              <td className={cellClass}>{item.contact_no || "-"}</td>
              <td className={cellClass}>{item.address || "-"}</td>
              <td className={cellClass}>{item.region || "-"}</td>
              <td className={cellClass}>{item.units_count}</td>
              <td className={cellClass}>
                {formatMoney(item.total_contract_value)}
              </td>
              <td className={cellClass}>{formatMoney(item.total_paid)}</td>
              <td className={cellClass}>{formatMoney(item.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 ? <EmptyState title="No client records found" /> : null}
    </TableContainer>
  )
}

export default Reports
