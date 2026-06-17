import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { API_URL } from "../utils/api"
import { formatDate, formatDateOnly, formatMoney } from "../utils/formatters"

type ScheduleRow = {
  due_date: string | null
  description: string
  due_amount: number | string
  penalty: number | string
  date_paid: string | null
  amount_paid: number | string | null
  reference: string | null
  running_balance: number | string
}

type PrintData = {
  unit: Record<string, any>
  schedule: ScheduleRow[]
  totals: {
    total_amount_payable: number | string
    total_paid: number | string
    balance: number | string
  }
  statement_date: string
}

const fetchPrintData = async (clientUnitId: string) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/print-data`, {
    credentials: "include",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "Failed to load statement")
  }

  const data = await res.json()
  return data.data as PrintData
}

const logPrint = async (clientUnitId: string) => {
  await fetch(`${API_URL}/client-units/${clientUnitId}/form-prints`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ form_type: "statement_of_account" }),
  }).catch(() => null)
}

const amount = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return ""
  return formatMoney(value).replace("₱", "₱")
}

const display = (value: unknown) => {
  if (value === null || value === undefined || value === "") return ""
  return String(value)
}

const StatementOfAccountPrint = () => {
  const { clientUnitId = "" } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ["soa-print-data", clientUnitId],
    queryFn: () => fetchPrintData(clientUnitId),
    enabled: Boolean(clientUnitId),
  })

  useEffect(() => {
    if (clientUnitId) logPrint(clientUnitId)
  }, [clientUnitId])

  if (isLoading) {
    return <div className="soa-loading">Loading statement...</div>
  }

  if (error || !data) {
    return (
      <div className="soa-loading">
        {error instanceof Error ? error.message : "Failed to load statement"}
      </div>
    )
  }

  const unit = data.unit

  return (
    <main className="soa-page">
      <style>{printStyles}</style>

      <div className="no-print toolbar">
        <button onClick={() => window.print()}>Print Statement of Account</button>
      </div>

      <section className="sheet sheet-landscape">
        <header className="soa-header">
          <div>
            <h1>D&amp;C PRIME REALTY</h1>
            <p>Matagás na Lupa, Indang, Cavite.</p>
            <p>4122 Philippines</p>
            <p>(046) 866-0616</p>
          </div>

          <div className="top-tables">
            <table>
              <tbody>
                <tr>
                  <th colSpan={2} className="title">STATEMENT OF ACCOUNT</th>
                </tr>
                <tr>
                  <td>Statement Date</td>
                  <td>{formatDateOnly(data.statement_date)}</td>
                </tr>
                <tr>
                  <td>Property Address</td>
                  <td>{display(unit.project_location || unit.project_name)}</td>
                </tr>
                <tr>
                  <td>Buyer&apos;s Name</td>
                  <td>{display(unit.client_name)}</td>
                </tr>
                <tr>
                  <td>Unit No.</td>
                  <td>{display(unit.unit_id)}</td>
                </tr>
              </tbody>
            </table>

            <table>
              <tbody>
                <tr>
                  <th colSpan={2} className="title">AMOUNT DETAILS</th>
                </tr>
                <tr>
                  <td>Total Contract Price</td>
                  <td>{amount(unit.offer_purchase_price || unit.total_contract_price)}</td>
                </tr>
                <tr>
                  <td>Legal Miscellaneous</td>
                  <td>{amount(unit.legal_misc_fee)}</td>
                </tr>
                <tr>
                  <td>Total Amount Payable</td>
                  <td>{amount(data.totals.total_amount_payable)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        <table className="soa-table">
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Description</th>
              <th>Due Amount</th>
              <th>Penalty</th>
              <th>Date Paid</th>
              <th>Amount Paid</th>
              <th>Reference ID</th>
              <th>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.schedule.map((row, index) => (
              <tr key={`${row.description}-${index}`}>
                <td>{formatDate(row.due_date)}</td>
                <td>{row.description}</td>
                <td className="money strong">{amount(row.due_amount)}</td>
                <td className="money">{Number(row.penalty || 0).toFixed(2)}</td>
                <td>{formatDateOnly(row.date_paid)}</td>
                <td className="money">{row.amount_paid ? amount(row.amount_paid) : ""}</td>
                <td>{display(row.reference)}</td>
                <td className="money strong">{amount(row.running_balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="soa-total-row">
          <span>Total amount to fully pay as of statement date</span>
          <strong>{amount(data.totals.balance)}</strong>
        </div>

        <footer className="soa-footer">
          <div>
            <p>Prepared by: <span className="line"></span></p>
            <p className="role">Administration Head</p>
            <p>Date:</p>
          </div>
          <div>
            <p>Acknowledged by: <span className="line"></span></p>
            <p className="role">Client Name and Signature</p>
            <p>Date:</p>
          </div>
        </footer>
      </section>
    </main>
  )
}

const printStyles = `
  @page { size: A4 landscape; margin: 8mm; }
  body { background: #f8fafc; }
  .toolbar { position: sticky; top: 0; padding: 12px; background: white; border-bottom: 1px solid #ddd; z-index: 5; }
  .toolbar button { padding: 8px 12px; border: 1px solid #111; background: white; cursor: pointer; font-weight: 700; }
  .soa-page { color: #111; font-family: Arial, sans-serif; }
  .sheet { margin: 16px auto; background: white; padding: 8mm; box-shadow: 0 0 0 1px #e5e7eb; }
  .sheet-landscape { width: 297mm; min-height: 210mm; }
  .soa-header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 26px; }
  .soa-header h1 { margin: 0 0 10px; font-family: Georgia, serif; font-size: 26px; letter-spacing: .5px; }
  .soa-header p { margin: 3px 0; font-size: 14px; }
  .top-tables { width: 47%; display: flex; flex-direction: column; gap: 14px; }
  .top-tables table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .top-tables th, .top-tables td { border: 1px solid #111; padding: 4px 6px; }
  .top-tables .title { font-family: Georgia, serif; font-size: 22px; text-align: center; padding: 8px; }
  .top-tables td:nth-child(2) { text-align: center; }
  .soa-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .soa-table th { height: 42px; border: 2px solid #111; padding: 7px; text-align: center; }
  .soa-table td { border: 1px solid #222; padding: 7px; height: 21px; text-align: center; }
  .soa-table td:nth-child(2) { text-align: left; }
  .money { text-align: right !important; white-space: nowrap; }
  .strong { font-weight: 800; }
  .soa-total-row { display: flex; justify-content: flex-end; gap: 80px; margin: 28px 0 24px; font-size: 16px; }
  .soa-total-row strong { font-size: 18px; }
  .soa-footer { display: flex; justify-content: space-between; gap: 80px; font-size: 14px; }
  .soa-footer > div { flex: 1; }
  .line { display: inline-block; width: 230px; border-bottom: 1px solid #111; margin-left: 20px; }
  .role { text-align: center; margin-top: 20px; }
  .soa-loading { padding: 40px; font-family: Arial, sans-serif; }
  @media print {
    body { background: white; }
    .no-print { display: none !important; }
    .sheet { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 0; }
  }
`

export default StatementOfAccountPrint
