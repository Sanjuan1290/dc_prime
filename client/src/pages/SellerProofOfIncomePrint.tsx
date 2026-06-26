import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useSearchParams } from "react-router-dom"
import { API_URL } from "../utils/api"
import { formatDateOnly, formatMoney, formatText } from "../utils/formatters"

type Seller = {
  id: number
  full_name: string
  email: string | null
  contact_no: string | null
  seller_role: string
  parent_seller_name?: string | null
  reports_under_display?: string | null
  seller_group_name?: string | null
  seller_group_pool_rate?: number | string | null
  accreditation_date?: string | null
  status: string
}

type ReleasedCommission = {
  release_id: number
  commission_id: number
  release_stage: string
  release_percent: number | string
  gross_release_amount: number | string
  cash_advance_deduction: number | string
  net_release_amount: number | string
  released_at: string | null
  released_by_name: string | null
  commission_role: string
  source_type: string
  rate: number | string
  client_name: string | null
  unit_id: string | null
  project_name: string | null
}

type CashAdvance = {
  id: number
  amount: number | string
  remaining_balance: number | string
  status: string
  requested_at: string | null
  approved_at: string | null
  deducted_at: string | null
  approved_by_name: string | null
  client_name: string | null
  unit_id: string | null
  project_name: string | null
  notes: string | null
}

type CashAdvanceDeduction = {
  id: number
  cash_advance_id: number
  commission_release_id: number
  amount: number | string
  created_at: string | null
  release_stage: string | null
  client_name: string | null
  unit_id: string | null
  project_name: string | null
}

type ProofData = {
  seller: Seller
  date_range: {
    date_from: string
    date_to: string
  }
  released_commissions: ReleasedCommission[]
  cash_advances: CashAdvance[]
  cash_advance_deductions: CashAdvanceDeduction[]
  totals: {
    gross_released_commissions: number | string
    cash_advance_deductions: number | string
    net_released_commissions: number | string
    cash_advances_issued: number | string
    total_cash_received: number | string
    outstanding_cash_advance_balance: number | string
  }
  generated_at: string
}

const fetchProofData = async (
  sellerId: string,
  dateFrom: string,
  dateTo: string
) => {
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
  })

  const response = await fetch(
    `${API_URL}/accredited-sellers/${sellerId}/proof-of-income?${params.toString()}`,
    { credentials: "include" }
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "Failed to load proof of income")
  }

  const data = await response.json()
  return data.data as ProofData
}

const dateValue = (value: string | null | undefined) => {
  return value ? formatDateOnly(value) : "-"
}

const textValue = (value: string | null | undefined) => {
  return value?.trim() || "-"
}

const SellerProofOfIncomePrint = () => {
  const { sellerId = "" } = useParams()
  const [searchParams] = useSearchParams()
  const dateFrom = searchParams.get("date_from") || "1970-01-01"
  const dateTo = searchParams.get("date_to") || new Date().toISOString().slice(0, 10)

  const { data, isLoading, error } = useQuery({
    queryKey: ["seller-proof-of-income", sellerId, dateFrom, dateTo],
    queryFn: () => fetchProofData(sellerId, dateFrom, dateTo),
    enabled: Boolean(sellerId),
  })

  useEffect(() => {
    if (!isLoading && data) {
      document.title = `Proof of Income - ${data.seller.full_name}`
    }
  }, [data, isLoading])

  if (isLoading) {
    return <div className="print-loading">Loading proof of income...</div>
  }

  if (error || !data) {
    return (
      <div className="print-loading">
        {error instanceof Error ? error.message : "Failed to load proof of income"}
      </div>
    )
  }

  const seller = data.seller
  const totals = data.totals

  return (
    <main className="proof-page">
      <style>{printStyles}</style>

      <div className="no-print toolbar">
        <button type="button" onClick={() => window.print()}>
          Print Proof of Income
        </button>
      </div>

      <section className="sheet">
        <header className="company-header">
          <div className="company-left">
            <img src="/logo.png" alt="D&C Prime Realty" className="logo" />
            <div>
              <h1>D&amp;C PRIME REALTY</h1>
              <p>Matagás na Lupa, Indang, Cavite, 4122 Philippines</p>
              <p>(046) 866-0616</p>
            </div>
          </div>
          <div className="document-title">
            <h2>PROOF OF INCOME</h2>
            <p>For Accredited Seller Commission Records</p>
          </div>
        </header>

        <section className="notice-box">
          <p>
            This certifies that the accredited seller below has released commission records and cash advance records in D&amp;C Prime Realty for the covered period.
          </p>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <h3>Seller Information</h3>
            <table>
              <tbody>
                <tr><td>Name</td><td>{seller.full_name}</td></tr>
                <tr><td>Role</td><td>{formatText(seller.seller_role)}</td></tr>
                <tr><td>Seller Group</td><td>{textValue(seller.seller_group_name)}</td></tr>
                <tr><td>Reports Under</td><td>{textValue(seller.reports_under_display || seller.parent_seller_name)}</td></tr>
                <tr><td>Accreditation Date</td><td>{dateValue(seller.accreditation_date)}</td></tr>
                <tr><td>Status</td><td>{formatText(seller.status)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="info-card">
            <h3>Coverage</h3>
            <table>
              <tbody>
                <tr><td>From</td><td>{dateValue(data.date_range.date_from)}</td></tr>
                <tr><td>To</td><td>{dateValue(data.date_range.date_to)}</td></tr>
                <tr><td>Generated At</td><td>{dateValue(data.generated_at)}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="summary-grid">
          <div><span>Gross Released Commissions</span><strong>{formatMoney(totals.gross_released_commissions)}</strong></div>
          <div><span>Less Cash Advance Deductions</span><strong>{formatMoney(totals.cash_advance_deductions)}</strong></div>
          <div><span>Net Released Commissions</span><strong>{formatMoney(totals.net_released_commissions)}</strong></div>
          <div><span>Cash Advances Issued</span><strong>{formatMoney(totals.cash_advances_issued)}</strong></div>
          <div className="highlight"><span>Total Cash Received</span><strong>{formatMoney(totals.total_cash_received)}</strong></div>
          <div><span>Outstanding Cash Advance Balance</span><strong>{formatMoney(totals.outstanding_cash_advance_balance)}</strong></div>
        </section>

        <section className="table-section">
          <h3>Released Commission Details</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Release Date</th>
                <th>Project / Unit</th>
                <th>Client</th>
                <th>Role</th>
                <th>Stage</th>
                <th>Gross</th>
                <th>CA Deduction</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {data.released_commissions.map((item) => (
                <tr key={item.release_id}>
                  <td>{dateValue(item.released_at)}</td>
                  <td>{textValue(item.project_name)} / {textValue(item.unit_id)}</td>
                  <td>{textValue(item.client_name)}</td>
                  <td>{formatText(item.commission_role)}</td>
                  <td>{formatText(item.release_stage)}</td>
                  <td className="money">{formatMoney(item.gross_release_amount)}</td>
                  <td className="money">{formatMoney(item.cash_advance_deduction)}</td>
                  <td className="money strong">{formatMoney(item.net_release_amount)}</td>
                </tr>
              ))}
              {data.released_commissions.length === 0 ? (
                <tr><td colSpan={8} className="empty-row">No released commissions in this period.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="table-section">
          <h3>Cash Advances Issued</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Approved Date</th>
                <th>Project / Unit</th>
                <th>Client</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.cash_advances.map((item) => (
                <tr key={item.id}>
                  <td>{dateValue(item.approved_at || item.requested_at)}</td>
                  <td>{textValue(item.project_name)} / {textValue(item.unit_id)}</td>
                  <td>{textValue(item.client_name)}</td>
                  <td>{formatText(item.status)}</td>
                  <td className="money strong">{formatMoney(item.amount)}</td>
                  <td className="money">{formatMoney(item.remaining_balance)}</td>
                </tr>
              ))}
              {data.cash_advances.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No cash advances issued in this period.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <footer className="signatures">
          <div>
            <p>Prepared by:</p>
            <span></span>
            <small>Admin / Accounting</small>
          </div>
          <div>
            <p>Verified by:</p>
            <span></span>
            <small>Authorized Representative</small>
          </div>
          <div>
            <p>Received by:</p>
            <span></span>
            <small>Seller Signature</small>
          </div>
        </footer>
      </section>
    </main>
  )
}

const printStyles = `
  @page { size: A4 portrait; margin: 10mm; }
  body { background: #f8fafc; }
  .proof-page { color: #0f172a; font-family: Arial, sans-serif; }
  .toolbar { position: sticky; top: 0; z-index: 10; padding: 12px; background: white; border-bottom: 1px solid #e2e8f0; }
  .toolbar button { padding: 9px 14px; border: 1px solid #0f172a; background: white; border-radius: 8px; font-weight: 700; cursor: pointer; }
  .sheet { width: 210mm; min-height: 297mm; margin: 16px auto; background: white; padding: 12mm; box-shadow: 0 0 0 1px #e2e8f0; }
  .company-header { display: flex; justify-content: space-between; gap: 18px; border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; }
  .company-left { display: flex; gap: 14px; align-items: center; }
  .logo { width: 70px; height: 70px; object-fit: contain; }
  h1 { margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: .4px; }
  h2 { margin: 0; font-size: 24px; letter-spacing: .6px; color: #1e3a8a; }
  h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; color: #475569; }
  p { margin: 3px 0; }
  .document-title { text-align: right; }
  .document-title p { color: #64748b; font-size: 12px; }
  .notice-box { margin: 16px 0; padding: 12px 14px; border: 1px solid #bfdbfe; background: #eff6ff; font-size: 13px; line-height: 1.45; }
  .info-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; }
  .info-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
  .info-card table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .info-card td { padding: 5px 0; vertical-align: top; }
  .info-card td:first-child { width: 140px; color: #64748b; font-weight: 700; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
  .summary-grid div { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; }
  .summary-grid span { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .summary-grid strong { display: block; margin-top: 6px; font-size: 16px; }
  .summary-grid .highlight { background: #eff6ff; border-color: #93c5fd; }
  .table-section { margin-top: 16px; }
  .details-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  .details-table th { background: #f1f5f9; border: 1px solid #94a3b8; padding: 6px; text-align: left; }
  .details-table td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
  .money { text-align: right !important; white-space: nowrap; }
  .strong { font-weight: 800; }
  .empty-row { text-align: center; color: #64748b; padding: 14px !important; }
  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 34px; font-size: 12px; }
  .signatures span { display: block; height: 38px; border-bottom: 1px solid #0f172a; }
  .signatures small { display: block; margin-top: 6px; text-align: center; color: #475569; }
  .print-loading { padding: 40px; font-family: Arial, sans-serif; }
  @media print {
    body { background: white; }
    .no-print { display: none !important; }
    .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
  }
`

export default SellerProofOfIncomePrint

