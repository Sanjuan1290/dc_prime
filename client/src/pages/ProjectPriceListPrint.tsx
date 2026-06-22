import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useSearchParams } from "react-router-dom"
import { API_URL } from "../utils/api"
import { formatDateOnly, formatMoney } from "../utils/formatters"

type ProjectPriceListRow = {
  no: number
  unit_id: string
  area: number | string
  orientation: string | null
  cadastral_lot_no: string | null
  price_per_sqm: number | string
  selling_price: number | string
  discount: number | string
  total_contract_price: number | string
  downpayment_percent: number | string
  downpayment: number | string
  reservation_fee: number | string
  net_downpayment: number | string
  payable_terms: number | string
  monthly_dp: number | string
  balance: number | string
  interest_rate: number | string
  term_years_a: number | string
  monthly_term_a: number | string
  term_years_b: number | string
  monthly_term_b: number | string
  status: string
}

type ProjectPriceListData = {
  project: {
    id: number
    name: string
    location?: string | null
    location_code?: string | null
  }
  title: string
  effective_date: string | null
  settings: {
    downpayment_percent: number
    payable_terms: number
    interest_rate: number
    term_years_a: number
    term_years_b: number
  }
  rows: ProjectPriceListRow[]
}

const fetchProjectPriceList = async (projectId: string, queryString: string) => {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/price-list?${queryString}`,
    { credentials: "include" },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "Failed to load project price list")
  }

  return (await response.json()) as ProjectPriceListData
}

const money = (value: number | string | null | undefined) =>
  formatMoney(value || 0)

const numberValue = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value || 0))

const ProjectPriceListPrint = () => {
  const { projectId = "" } = useParams()
  const [searchParams] = useSearchParams()
  const queryString = searchParams.toString()

  const { data, isLoading, error } = useQuery({
    queryKey: ["project-price-list", projectId, queryString],
    queryFn: () => fetchProjectPriceList(projectId, queryString),
    enabled: Boolean(projectId),
  })

  useEffect(() => {
    if (data) {
      document.title = `${data.project.name} Price List`
    }
  }, [data])

  if (isLoading) {
    return <div className="print-loading">Loading project price list...</div>
  }

  if (error || !data) {
    return (
      <div className="print-loading">
        {error instanceof Error ? error.message : "Failed to load project price list"}
      </div>
    )
  }

  return (
    <main className="price-list-page">
      <style>{printStyles}</style>

      <div className="no-print toolbar">
        <button onClick={() => window.print()}>Print Project Unit Price List</button>
      </div>

      <section className="sheet">
        <div className="brand-row">
          <img src="/logo.png" alt="D&C Prime Realty" />
          <div>
            <h2>D&amp;C PRIME REALTY</h2>
            <p>{data.project.location || data.project.name}</p>
          </div>
        </div>

        <header className="price-list-header">
          <h1>{data.title}</h1>
          <p>
            Pricing effective {formatDateOnly(data.effective_date)} · DP {numberValue(data.settings.downpayment_percent)}% · Payable in {data.settings.payable_terms} months · Interest {numberValue(data.settings.interest_rate)}%
          </p>
        </header>

        <div className="table-wrap">
          <table className="price-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Unit ID</th>
                <th>Area</th>
                <th>Orientation</th>
                <th>Price per SQM</th>
                <th>Selling Price</th>
                <th>Discount</th>
                <th>Total Contract Price</th>
                <th>Downpayment %</th>
                <th>Downpayment</th>
                <th>Reservation Fee</th>
                <th>Net Downpayment</th>
                <th>Payable Terms</th>
                <th>Monthly DP</th>
                <th>Balance</th>
                <th>Interest Rate</th>
                <th>Monthly in {numberValue(data.settings.term_years_a)} Years</th>
                <th>Monthly in {numberValue(data.settings.term_years_b)} Years</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.unit_id}-${row.no}`}>
                  <td>{row.no}</td>
                  <td>{row.unit_id}</td>
                  <td>{numberValue(row.area)}</td>
                  <td>{row.orientation || "-"}</td>
                  <td>{money(row.price_per_sqm)}</td>
                  <td>{money(row.selling_price)}</td>
                  <td className="discount">{money(row.discount)}</td>
                  <td>{money(row.total_contract_price)}</td>
                  <td>{numberValue(row.downpayment_percent)}%</td>
                  <td>{money(row.downpayment)}</td>
                  <td>{money(row.reservation_fee)}</td>
                  <td>{money(row.net_downpayment)}</td>
                  <td>{row.payable_terms}</td>
                  <td>{money(row.monthly_dp)}</td>
                  <td>{money(row.balance)}</td>
                  <td>{numberValue(row.interest_rate)}%</td>
                  <td>{money(row.monthly_term_a)}</td>
                  <td>{money(row.monthly_term_b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.rows.length === 0 ? (
          <div className="empty-state">No listings matched the selected filters.</div>
        ) : null}

        <footer>
          <p>PRICING EFFECTIVE {formatDateOnly(data.effective_date)}</p>
          <p>Prepared by D&amp;C Prime Realty. Values are for price-list presentation and are subject to final verification.</p>
        </footer>
      </section>
    </main>
  )
}

const printStyles = `
  @page { size: A4 landscape; margin: 6mm; }
  html, body { margin: 0; }
  body { background: #f8fafc; }
  .toolbar { position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #e5e7eb; background: #fff; padding: 10px; }
  .toolbar button { border: 1px solid #0f172a; border-radius: 8px; background: #fff; padding: 8px 12px; font-weight: 800; cursor: pointer; }
  .price-list-page { box-sizing: border-box; color: #0f172a; font-family: Arial, sans-serif; padding: 1px; }
  .print-loading { padding: 40px; font-family: Arial, sans-serif; }
  .sheet { box-sizing: border-box; width: min(100%, 297mm); min-height: 210mm; margin: 14px auto; background: #fff; padding: 7mm; box-shadow: 0 0 0 1px #e5e7eb; overflow: hidden; }
  .brand-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .brand-row img { width: 48px; height: 48px; object-fit: contain; }
  .brand-row h2 { margin: 0; font-size: 16px; letter-spacing: .08em; }
  .brand-row p { margin: 2px 0 0; font-size: 11px; color: #475569; }
  .price-list-header { text-align: center; margin: 4px 0 10px; }
  .price-list-header h1 { margin: 0; font-size: 18px; letter-spacing: .04em; text-transform: uppercase; }
  .price-list-header p { margin: 5px 0 0; color: #475569; font-size: 11px; }
  .table-wrap { width: 100%; overflow-x: auto; border: 1px solid #cbd5e1; }
  .price-table { width: 100%; border-collapse: collapse; font-size: 8px; }
  .price-table th, .price-table td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: right; white-space: nowrap; }
  .price-table th { background: #e2e8f0; color: #0f172a; font-weight: 800; text-align: center; }
  .price-table td:nth-child(1), .price-table td:nth-child(2), .price-table td:nth-child(3), .price-table td:nth-child(4), .price-table td:nth-child(9), .price-table td:nth-child(13), .price-table td:nth-child(16) { text-align: center; }
  .price-table tr:nth-child(even) td { background: #f8fafc; }
  .discount { color: #b91c1c; background: #fee2e2 !important; }
  .empty-state { border: 1px dashed #cbd5e1; margin-top: 14px; padding: 20px; text-align: center; color: #64748b; }
  footer { margin-top: 10px; text-align: center; font-size: 10px; color: #475569; }
  footer p { margin: 4px 0; }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .sheet { margin: 0; width: auto; min-height: auto; padding: 0; box-shadow: none; overflow: visible; }
    .table-wrap { overflow: visible; border: 0; }
    .price-table { font-size: 7.6px; }
  }
`

export default ProjectPriceListPrint
