import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiBarChart2, FiPrinter, FiRefreshCw, FiSearch } from "react-icons/fi"
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
import { formatDate, formatMoney, formatNumber, formatText } from "../utils/formatters"
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
  balance: number | string
  status: string
  created_at: string
}

type CollectionsReport = {
  payment_id: number
  client_name: string
  project_name: string
  unit_id: string
  amount: number | string
  payment_type: string | null
  payment_method: string | null
  payment_date: string
}

type InventoryReport = {
  listing_id: number
  project_name: string
  cadastral_lot_no: string | null
  unit_id: string
  lot_type: string | null
  lot_area_sqm: number | string
  price_per_sqm: number | string
  net_selling_price: number | string
  legal_misc_fee: number | string
  status: string
}

type CommissionsReport = {
  commission_id: number
  seller_name: string
  seller_role: string
  client_name: string
  project_name: string
  unit_id: string
  net_selling_price: number | string
  rate: number | string
  amount: number | string
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
  is_required: boolean | number
  can_reuse: boolean | number
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
  units_count: number | string
  total_contract_value: number | string
  total_paid: number | string
  balance: number | string
}

type ReportResponse =
  | { sales: SalesReport[] }
  | { collections: CollectionsReport[] }
  | { inventory: InventoryReport[] }
  | { commissions: CommissionsReport[] }
  | { documents: DocumentsReport[] }
  | { clients: ClientsReport[] }

const reportTypes: ReportType[] = [
  "sales",
  "collections",
  "inventory",
  "commissions",
  "documents",
  "clients",
]

const fetchReport = async (reportType: ReportType): Promise<ReportResponse> => {
  const res = await fetch(`${API_URL}/reports/${reportType}`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>("sales")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    data,
    isLoading,
    error,
  } = useQuery<ReportResponse>({
    queryKey: ["reports", reportType],
    queryFn: () => fetchReport(reportType),
  })

  const sales: SalesReport[] = data && "sales" in data ? data.sales : []
  const collections: CollectionsReport[] =
    data && "collections" in data ? data.collections : []
  const inventory: InventoryReport[] =
    data && "inventory" in data ? data.inventory : []
  const commissions: CommissionsReport[] =
    data && "commissions" in data ? data.commissions : []
  const documents: DocumentsReport[] =
    data && "documents" in data ? data.documents : []
  const clients: ClientsReport[] = data && "clients" in data ? data.clients : []

  const search = searchInput.toLowerCase().trim()

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      return (
        search === "" ||
        item.client_name.toLowerCase().includes(search) ||
        item.project_name.toLowerCase().includes(search) ||
        item.unit_id.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
      )
    })
  }, [sales, search])

  const filteredCollections = useMemo(() => {
    return collections.filter((item) => {
      return (
        search === "" ||
        item.client_name.toLowerCase().includes(search) ||
        item.project_name.toLowerCase().includes(search) ||
        item.unit_id.toLowerCase().includes(search) ||
        (item.payment_type || "").toLowerCase().includes(search) ||
        (item.payment_method || "").toLowerCase().includes(search)
      )
    })
  }, [collections, search])

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      return (
        search === "" ||
        item.project_name.toLowerCase().includes(search) ||
        (item.cadastral_lot_no || "").toLowerCase().includes(search) ||
        item.unit_id.toLowerCase().includes(search) ||
        (item.lot_type || "").toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
      )
    })
  }, [inventory, search])

  const filteredCommissions = useMemo(() => {
    return commissions.filter((item) => {
      return (
        search === "" ||
        item.seller_name.toLowerCase().includes(search) ||
        item.seller_role.toLowerCase().includes(search) ||
        item.client_name.toLowerCase().includes(search) ||
        item.project_name.toLowerCase().includes(search) ||
        item.unit_id.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
      )
    })
  }, [commissions, search])

  const filteredDocuments = useMemo(() => {
    return documents.filter((item) => {
      return (
        search === "" ||
        item.client_name.toLowerCase().includes(search) ||
        item.project_name.toLowerCase().includes(search) ||
        item.unit_id.toLowerCase().includes(search) ||
        item.document_name.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search) ||
        (item.reviewed_by_name || "").toLowerCase().includes(search)
      )
    })
  }, [documents, search])

  const filteredClients = useMemo(() => {
    return clients.filter((item) => {
      return (
        search === "" ||
        item.client_name.toLowerCase().includes(search) ||
        (item.email || "").toLowerCase().includes(search) ||
        (item.contact_no || "").toLowerCase().includes(search) ||
        (item.address || "").toLowerCase().includes(search)
      )
    })
  }, [clients, search])

  const totalRecords =
    reportType === "sales"
      ? filteredSales.length
      : reportType === "collections"
        ? filteredCollections.length
        : reportType === "inventory"
          ? filteredInventory.length
          : reportType === "commissions"
            ? filteredCommissions.length
            : reportType === "documents"
              ? filteredDocuments.length
              : filteredClients.length

  const moneyTotal =
    reportType === "sales"
      ? filteredSales.reduce(
          (sum, item) => sum + Number(item.net_selling_price || 0),
          0
        )
      : reportType === "collections"
        ? filteredCollections.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          )
        : reportType === "inventory"
          ? filteredInventory.reduce(
              (sum, item) => sum + Number(item.net_selling_price || 0),
              0
            )
          : reportType === "commissions"
            ? filteredCommissions.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
              )
            : reportType === "clients"
              ? filteredClients.reduce(
                  (sum, item) => sum + Number(item.balance || 0),
                  0
                )
              : 0

  if (isLoading) {
    return <LoadingState label="Loading reports..." />
  }

  if (error) {
    return <Alert title="Failed to load reports" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiBarChart2 />}
        title="Reports"
        subtitle="Sales, collections, inventory, commission, document, and client reports"
        actions={
          <Button icon={<FiPrinter />} onClick={() => window.print()}>
            Print Report
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Current Report" value={formatText(reportType)} />
        <StatCard
          label="Filtered Records"
          value={formatNumber(totalRecords)}
          description="Current report rows"
        />
        <StatCard
          label={reportType === "documents" ? "Source" : "Total Value"}
          value={reportType === "documents" ? "MySQL" : formatMoney(moneyTotal)}
          description={
            reportType === "clients"
              ? "Open client balance"
              : "Live report data"
          }
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
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
        <Button
          icon={<FiRefreshCw />}
          onClick={() => {
            setSearchInput("")
            setPage(1)
          }}
        >
          Reset
        </Button>
      </div>

      {renderReportTable({
        filteredClients,
        filteredCollections,
        filteredCommissions,
        filteredDocuments,
        filteredInventory,
        filteredSales,
        page,
        reportType,
        rowsPerPage,
      })}

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

type RenderReportTableArgs = {
  filteredClients: ClientsReport[]
  filteredCollections: CollectionsReport[]
  filteredCommissions: CommissionsReport[]
  filteredDocuments: DocumentsReport[]
  filteredInventory: InventoryReport[]
  filteredSales: SalesReport[]
  page: number
  reportType: ReportType
  rowsPerPage: number
}

const cellClass = "px-4 py-3 text-slate-600"
const headerClass = "px-4 py-3 text-left font-semibold text-slate-600"

const renderReportTable = ({
  filteredClients,
  filteredCollections,
  filteredCommissions,
  filteredDocuments,
  filteredInventory,
  filteredSales,
  page,
  reportType,
  rowsPerPage,
}: RenderReportTableArgs) => {
  if (reportType === "sales") {
    const rows = paginateRows(filteredSales, page, rowsPerPage)

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Client", "Project", "Unit", "Net Price", "Balance", "Status", "Created At"].map(
                (heading) => (
                  <th key={heading} className={headerClass}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((item) => (
              <tr key={item.client_unit_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.client_name}
                </td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{formatMoney(item.net_selling_price)}</td>
                <td className={cellClass}>{formatMoney(item.balance)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className={cellClass}>{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 ? <EmptyState title="No sales records found" /> : null}
      </TableContainer>
    )
  }

  if (reportType === "collections") {
    const rows = paginateRows(filteredCollections, page, rowsPerPage)

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Client", "Project", "Unit", "Amount", "Type", "Method", "Payment Date"].map(
                (heading) => (
                  <th key={heading} className={headerClass}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((item) => (
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
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCollections.length === 0 ? (
          <EmptyState title="No collection records found" />
        ) : null}
      </TableContainer>
    )
  }

  if (reportType === "inventory") {
    const rows = paginateRows(filteredInventory, page, rowsPerPage)

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
                "Net Price",
                "Legal / Misc",
                "Status",
              ].map((heading) => (
                <th key={heading} className={headerClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((item) => (
              <tr key={item.listing_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.project_name}
                </td>
                <td className={cellClass}>{item.cadastral_lot_no || "-"}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{item.lot_type || "-"}</td>
                <td className={cellClass}>{formatNumber(item.lot_area_sqm)} sqm</td>
                <td className={cellClass}>{formatMoney(item.price_per_sqm)}</td>
                <td className={cellClass}>
                  {formatMoney(item.net_selling_price)}
                </td>
                <td className={cellClass}>{formatMoney(item.legal_misc_fee)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInventory.length === 0 ? (
          <EmptyState title="No inventory records found" />
        ) : null}
      </TableContainer>
    )
  }

  if (reportType === "commissions") {
    const rows = paginateRows(filteredCommissions, page, rowsPerPage)

    return (
      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Seller",
                "Role",
                "Client",
                "Project",
                "Unit",
                "Rate",
                "Amount",
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
            {rows.map((item) => (
              <tr key={item.commission_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.seller_name}
                </td>
                <td className={cellClass}>{formatText(item.seller_role)}</td>
                <td className={cellClass}>{item.client_name}</td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{Number(item.rate || 0)}%</td>
                <td className={cellClass}>{formatMoney(item.amount)}</td>
                <td className={cellClass}>{formatMoney(item.released_amount)}</td>
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
        {filteredCommissions.length === 0 ? (
          <EmptyState title="No commission records found" />
        ) : null}
      </TableContainer>
    )
  }

  if (reportType === "documents") {
    const rows = paginateRows(filteredDocuments, page, rowsPerPage)

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
            {rows.map((item) => (
              <tr key={item.checklist_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.client_name}
                </td>
                <td className={cellClass}>{item.project_name}</td>
                <td className={cellClass}>{item.unit_id}</td>
                <td className={cellClass}>{item.document_name}</td>
                <td className={cellClass}>
                  {Boolean(item.is_required) ? "Yes" : "No"}
                </td>
                <td className={cellClass}>
                  {Boolean(item.can_reuse) ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className={cellClass}>{item.reviewed_by_name || "-"}</td>
                <td className={cellClass}>{formatDate(item.reviewed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDocuments.length === 0 ? (
          <EmptyState title="No document records found" />
        ) : null}
      </TableContainer>
    )
  }

  const rows = paginateRows(filteredClients, page, rowsPerPage)

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
              "Units",
              "Total Contract",
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
          {rows.map((item) => (
            <tr key={item.client_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">
                {item.client_name}
              </td>
              <td className={cellClass}>{item.email || "-"}</td>
              <td className={cellClass}>{item.contact_no || "-"}</td>
              <td className={cellClass}>{item.address || "-"}</td>
              <td className={cellClass}>{formatNumber(item.units_count)}</td>
              <td className={cellClass}>
                {formatMoney(item.total_contract_value)}
              </td>
              <td className={cellClass}>{formatMoney(item.total_paid)}</td>
              <td className={cellClass}>{formatMoney(item.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredClients.length === 0 ? (
        <EmptyState title="No client records found" />
      ) : null}
    </TableContainer>
  )
}

export default Reports
