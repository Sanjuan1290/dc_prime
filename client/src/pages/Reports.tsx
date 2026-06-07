import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }

    return "Something went wrong"
  } catch {
    return "Something went wrong"
  }
}

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

  const {
    data,
    isLoading,
    error,
  } = useQuery<ReportResponse>({
    queryKey: ["reports", reportType],
    queryFn: () => fetchReport(reportType),
  })

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatNumber = (value: number | string) => {
    return new Intl.NumberFormat("en-PH").format(Number(value || 0))
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"

    return date.slice(0, 10)
  }

  const formatText = (value: string | null | undefined) => {
    if (!value) return "-"

    return value
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const reportTitle = formatText(reportType)

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

  const filteredSales = sales.filter((item) => {
    return (
      search === "" ||
      item.client_name.toLowerCase().includes(search) ||
      item.project_name.toLowerCase().includes(search) ||
      item.unit_id.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    )
  })

  const filteredCollections = collections.filter((item) => {
    return (
      search === "" ||
      item.client_name.toLowerCase().includes(search) ||
      item.project_name.toLowerCase().includes(search) ||
      item.unit_id.toLowerCase().includes(search) ||
      (item.payment_type || "").toLowerCase().includes(search) ||
      (item.payment_method || "").toLowerCase().includes(search)
    )
  })

  const filteredInventory = inventory.filter((item) => {
    return (
      search === "" ||
      item.project_name.toLowerCase().includes(search) ||
      (item.cadastral_lot_no || "").toLowerCase().includes(search) ||
      item.unit_id.toLowerCase().includes(search) ||
      (item.lot_type || "").toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    )
  })

  const filteredCommissions = commissions.filter((item) => {
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

  const filteredDocuments = documents.filter((item) => {
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

  const filteredClients = clients.filter((item) => {
    return (
      search === "" ||
      item.client_name.toLowerCase().includes(search) ||
      (item.email || "").toLowerCase().includes(search) ||
      (item.contact_no || "").toLowerCase().includes(search) ||
      (item.address || "").toLowerCase().includes(search)
    )
  })

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

  if (isLoading) {
    return <p className="p-4">Loading reports...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load reports</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-sm text-gray-600">
          View sales, collections, inventory, commission, document, and client reports
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Current Report</p>
          <h3 className="text-2xl font-bold">{reportTitle}</h3>
          <p className="text-sm text-gray-600">Selected report type</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Records</p>
          <h3 className="text-2xl font-bold">{formatNumber(totalRecords)}</h3>
          <p className="text-sm text-gray-600">Filtered records shown</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Source</p>
          <h3 className="text-2xl font-bold">MySQL</h3>
          <p className="text-sm text-gray-600">Live report data</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row">
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as ReportType)
              setSearchInput("")
            }}
            className="border border-black px-3 py-2"
          >
            <option value="sales">Sales</option>
            <option value="collections">Collections</option>
            <option value="inventory">Inventory</option>
            <option value="commissions">Commissions</option>
            <option value="documents">Documents</option>
            <option value="clients">Clients</option>
          </select>

          <input
            type="text"
            placeholder="Search current report..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <button
            onClick={() => setSearchInput("")}
            className="border border-black px-4 py-2 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Print Report
        </button>
      </div>

      {reportType === "sales" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Net Price ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Balance ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Status ↕</th>
                <th className="px-4 py-2 text-left">Created At ↕</th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map((item) => (
                <tr key={item.client_unit_id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">{item.client_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.project_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.unit_id}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.net_selling_price)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.balance)}</td>
                  <td className="border-r border-black px-4 py-2">{formatText(item.status)}</td>
                  <td className="px-4 py-2">{formatDate(item.created_at)}</td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                    No sales records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "collections" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Amount ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Type ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Method ↕</th>
                <th className="px-4 py-2 text-left">Payment Date ↕</th>
              </tr>
            </thead>

            <tbody>
              {filteredCollections.map((item) => (
                <tr key={item.payment_id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">{item.client_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.project_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.unit_id}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.amount)}</td>
                  <td className="border-r border-black px-4 py-2">{formatText(item.payment_type)}</td>
                  <td className="border-r border-black px-4 py-2">{formatText(item.payment_method)}</td>
                  <td className="px-4 py-2">{formatDate(item.payment_date)}</td>
                </tr>
              ))}

              {filteredCollections.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                    No collection records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "inventory" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Cadastral Lot No. ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Lot Type ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Area ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Price / SQM ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Net Price ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Legal / Misc ↕</th>
                <th className="px-4 py-2 text-left">Status ↕</th>
              </tr>
            </thead>

            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.listing_id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">{item.project_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.cadastral_lot_no || "-"}</td>
                  <td className="border-r border-black px-4 py-2">{item.unit_id}</td>
                  <td className="border-r border-black px-4 py-2">{item.lot_type || "-"}</td>
                  <td className="border-r border-black px-4 py-2">{formatNumber(item.lot_area_sqm)} sqm</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.price_per_sqm)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.net_selling_price)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.legal_misc_fee)}</td>
                  <td className="px-4 py-2">{formatText(item.status)}</td>
                </tr>
              ))}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-600">
                    No inventory records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "commissions" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">Seller ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Role ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Rate ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Amount ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Released ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Remaining ↕</th>
                <th className="px-4 py-2 text-left">Status ↕</th>
              </tr>
            </thead>

            <tbody>
              {filteredCommissions.map((item) => (
                <tr key={item.commission_id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">{item.seller_name}</td>
                  <td className="border-r border-black px-4 py-2">{formatText(item.seller_role)}</td>
                  <td className="border-r border-black px-4 py-2">{item.client_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.project_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.unit_id}</td>
                  <td className="border-r border-black px-4 py-2">{Number(item.rate || 0)}%</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.amount)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.released_amount)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.remaining_amount)}</td>
                  <td className="px-4 py-2">{formatText(item.status)}</td>
                </tr>
              ))}

              {filteredCommissions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-600">
                    No commission records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "documents" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Document ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Required ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Reusable ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Status ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Reviewed By ↕</th>
                <th className="px-4 py-2 text-left">Reviewed At ↕</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((item) => (
                <tr key={item.checklist_id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">{item.client_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.project_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.unit_id}</td>
                  <td className="border-r border-black px-4 py-2">{item.document_name}</td>
                  <td className="border-r border-black px-4 py-2">{Boolean(item.is_required) ? "Yes" : "No"}</td>
                  <td className="border-r border-black px-4 py-2">{Boolean(item.can_reuse) ? "Yes" : "No"}</td>
                  <td className="border-r border-black px-4 py-2">{formatText(item.status)}</td>
                  <td className="border-r border-black px-4 py-2">{item.reviewed_by_name || "-"}</td>
                  <td className="px-4 py-2">{formatDate(item.reviewed_at)}</td>
                </tr>
              ))}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-600">
                    No document records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "clients" && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Email ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Contact ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Address ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Units ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Total Contract ↕</th>
                <th className="border-r border-black px-4 py-2 text-left">Total Paid ↕</th>
                <th className="px-4 py-2 text-left">Balance ↕</th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((item) => (
                <tr key={item.client_id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">{item.client_name}</td>
                  <td className="border-r border-black px-4 py-2">{item.email || "-"}</td>
                  <td className="border-r border-black px-4 py-2">{item.contact_no || "-"}</td>
                  <td className="border-r border-black px-4 py-2">{item.address || "-"}</td>
                  <td className="border-r border-black px-4 py-2">{formatNumber(item.units_count)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.total_contract_value)}</td>
                  <td className="border-r border-black px-4 py-2">{formatMoney(item.total_paid)}</td>
                  <td className="px-4 py-2">{formatMoney(item.balance)}</td>
                </tr>
              ))}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-600">
                    No client records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Reports