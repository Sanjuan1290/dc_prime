import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiBarChart2 } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import LoadingState from "../components/ui/LoadingState"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatMoney, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type Sale = {
  id: number
  status: string
  mode_of_payment: string
  starting_date: string | null
  due_date: string | null
  client_name: string
  unit_id: string
  project_name: string
  seller_name: string
  seller_role: string
  total_contract_price: number | string
  created_at: string
}

const fetchSales = async () => {
  const res = await fetch(`${API_URL}/seller/sales`, { credentials: "include" })
  if (!res.ok) throw new Error(await getErrorMessage(res))
  const data = await res.json()
  return (data.sales || data.data || []) as Sale[]
}

const normalizeSearch = (value: unknown) => String(value ?? "").toLowerCase()

const matchesSearch = (fields: unknown[], searchQuery: string) => {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true

  return fields.some((field) => normalizeSearch(field).includes(query))
}

const TeamSales = () => {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["seller-sales"],
    queryFn: fetchSales,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const filteredSales = useMemo(
    () =>
      data.filter((sale) =>
        matchesSearch(
          [
            sale.client_name,
            sale.unit_id,
            sale.project_name,
            sale.seller_name,
            sale.seller_role,
            formatText(sale.seller_role),
            sale.total_contract_price,
            formatMoney(sale.total_contract_price),
            sale.status,
            formatText(sale.status),
            sale.mode_of_payment,
            formatText(sale.mode_of_payment),
            sale.starting_date,
            sale.starting_date ? formatDate(sale.starting_date) : "",
            sale.due_date,
            sale.due_date ? formatDate(sale.due_date) : "",
            sale.created_at,
            formatDate(sale.created_at),
          ],
          search
        )
      ),
    [data, search]
  )

  const paginatedSales = useMemo(
    () => paginateRows(filteredSales, page, rowsPerPage),
    [filteredSales, page, rowsPerPage]
  )

  return (
    <div className="p-6">
      <PageHeader icon={<FiBarChart2 />} title="Sales" subtitle="Filtered by your role. Agents see own sales only." />
      {error ? <Alert variant="error" title={error instanceof Error ? error.message : "Failed to load sales"} /> : null}
      {isLoading ? <LoadingState label="Loading sales..." /> : null}
      {!isLoading ? (
        <>
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="team-sales-search">
              Search sales
            </label>
            <input
              id="team-sales-search"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Search client, unit, project, seller, status, payment mode, TCP, or date..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <p className="mt-2 text-xs text-slate-500">
              Showing {filteredSales.length} of {data.length} sales
            </p>
          </div>

          <TableContainer>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">TCP</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale) => (
                  <tr className="border-b border-slate-100" key={sale.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{sale.client_name}</td>
                    <td className="px-4 py-3 text-slate-600">{sale.unit_id}<br/><span className="text-xs text-slate-400">{sale.project_name}</span></td>
                    <td className="px-4 py-3 text-slate-600">{sale.seller_name}<br/><span className="text-xs text-slate-400">{formatText(sale.seller_role)}</span></td>
                    <td className="px-4 py-3 text-slate-600">{formatMoney(sale.total_contract_price)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatText(sale.status)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
                {!paginatedSales.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No sales found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableContainer>
          <Pagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={filteredSales.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </>
      ) : null}
    </div>
  )
}

export default TeamSales
