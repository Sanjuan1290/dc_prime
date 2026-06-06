import { useState } from "react"

type ReportType =
  | "sales"
  | "collections"
  | "inventory"
  | "commissions"
  | "clients"
  | "documents"

type Report = {
  id: number
  title: string
  type: ReportType
  description: string
  generatedBy: string
  generatedAt: string
}

const Reports = () => {
  const [reports] = useState<Report[]>([
    {
      id: 1,
      title: "Sales Summary",
      type: "sales",
      description: "Summary of total sales, pending sales, and sold lots",
      generatedBy: "Admin",
      generatedAt: "2026-06-06",
    },
    {
      id: 2,
      title: "Collection Report",
      type: "collections",
      description: "Total payments collected from client units",
      generatedBy: "Admin",
      generatedAt: "2026-06-06",
    },
    {
      id: 3,
      title: "Inventory Report",
      type: "inventory",
      description: "Available, reserved, hold, sold, and inactive listings",
      generatedBy: "Admin",
      generatedAt: "2026-06-06",
    },
    {
      id: 4,
      title: "Commission Report",
      type: "commissions",
      description: "Payable, released, and remaining commissions",
      generatedBy: "Admin",
      generatedAt: "2026-06-06",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | ReportType>("all")

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const filteredReports = reports.filter((report) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      report.title.toLowerCase().includes(search) ||
      report.type.toLowerCase().includes(search) ||
      report.description.toLowerCase().includes(search) ||
      report.generatedBy.toLowerCase().includes(search)

    const matchesType = typeFilter === "all" || report.type === typeFilter

    return matchesSearch && matchesType
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-sm text-gray-600">
          View sales, collections, inventory, commission, client, and document reports
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Total Sales</p>
          <h3 className="text-2xl font-bold">{formatMoney(48905425)}</h3>
          <p className="text-sm text-gray-600">Active sold client units</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Collections</p>
          <h3 className="text-2xl font-bold">{formatMoney(21780500)}</h3>
          <p className="text-sm text-gray-600">Tracked payments</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Available Lots</p>
          <h3 className="text-2xl font-bold">29</h3>
          <p className="text-sm text-gray-600">Current available inventory</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Pending Documents</p>
          <h3 className="text-2xl font-bold">34</h3>
          <p className="text-sm text-gray-600">Incomplete checklists</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search report title, type, description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | ReportType)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Reports</option>
            <option value="sales">Sales</option>
            <option value="collections">Collections</option>
            <option value="inventory">Inventory</option>
            <option value="commissions">Commissions</option>
            <option value="clients">Clients</option>
            <option value="documents">Documents</option>
          </select>

          <button
            onClick={() => {
              setSearchInput("")
              setTypeFilter("all")
            }}
            className="border border-black px-4 py-2 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>

        <button className="w-fit border border-black px-4 py-2 hover:bg-gray-200">
          Export Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">Title ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Type ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Description ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Generated By ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Generated At ↕</th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">{report.title}</td>
                <td className="border-r border-black px-4 py-2 capitalize">{report.type}</td>
                <td className="border-r border-black px-4 py-2">{report.description}</td>
                <td className="border-r border-black px-4 py-2">{report.generatedBy}</td>
                <td className="border-r border-black px-4 py-2">{report.generatedAt}</td>
                <td className="px-4 py-2">
                  <button className="border border-black px-3 py-1 hover:bg-gray-200">
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Reports