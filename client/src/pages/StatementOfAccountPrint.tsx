import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { API_URL } from "../utils/api"
import { formatDate, formatDateOnly, formatMoney } from "../utils/formatters"

type ScheduleReferenceDetail = {
  payment_id?: number
  reference_id?: string
  reference_no?: string
  reference?: string
  applied_amount?: number | string
  payment_date?: string | null
  payment_type?: string | null
}

type ScheduleRow = {
  due_date: string | null
  description: string
  due_amount: number | string
  penalty: number | string
  date_paid: string | null
  amount_paid: number | string | null
  reference: string | null
  reference_no?: string | null
  reference_details?: ScheduleReferenceDetail[] | string | null
  running_balance: number | string
  status?: string | null
  schedule_type?: string | null
  principal_due?: number | string | null
  interest_due?: number | string | null
  balance?: number | string | null
  excess_ma?: number | string | null
  excess_ma_generated?: number | string | null
  excess_ma_used?: number | string | null
  excess_ma_balance?: number | string | null
  excess_used?: number | string | null
}

type InterestBreakdownRow = ScheduleRow & {
  beginning_balance: number
  monthly_interest: number
  principal_paid: number
  ending_balance: number
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

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return 0

  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

const amount = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return ""
  return formatMoney(value).replace("₱", "₱")
}

const display = (value: unknown) => {
  if (value === null || value === undefined || value === "") return ""
  return String(value)
}

const stripReferenceAmount = (value: string) => {
  return value
    .replace(/\s*\(₱[\d,]+(?:\.\d{2})?\)/g, "")
    .replace(/\s*\(PHP\s*[\d,]+(?:\.\d{2})?\)/gi, "")
    .trim()
}

const getReferenceValue = (detail: ScheduleReferenceDetail) => {
  return String(
    detail.reference_id ||
      detail.reference_no ||
      detail.reference ||
      ""
  ).trim()
}

const parseReferenceDetails = (
  referenceDetails?: ScheduleReferenceDetail[] | string | null
) => {
  if (!referenceDetails) return []

  if (Array.isArray(referenceDetails)) {
    return referenceDetails
  }

  if (typeof referenceDetails === "string") {
    try {
      const parsed = JSON.parse(referenceDetails)

      if (Array.isArray(parsed)) {
        return parsed as ScheduleReferenceDetail[]
      }

      if (parsed && typeof parsed === "object") {
        return [parsed as ScheduleReferenceDetail]
      }
    } catch {
      return []
    }
  }

  return []
}

const displayReference = (row: ScheduleRow) => {
  const details = parseReferenceDetails(row.reference_details)

  if (details.length > 0) {
    const references = details
      .map(getReferenceValue)
      .map(stripReferenceAmount)
      .filter(Boolean)

    const uniqueReferences = Array.from(new Set(references))

    if (uniqueReferences.length > 0) {
      return uniqueReferences.join(", ")
    }
  }

  const fallbackReference = row.reference || row.reference_no || ""

  return stripReferenceAmount(display(fallbackReference))
}

const isInterestBearingRow = (row: ScheduleRow) => {
  const scheduleType = String(row.schedule_type || "").toLowerCase()
  const description = String(row.description || "").toLowerCase()

  if (scheduleType === "monthly") return true

  return (
    description.includes("monthly") ||
    description.includes("amortization") ||
    false
  )
}

const buildInterestBreakdownRows = (
  schedule: ScheduleRow[],
  startingBalance: number,
  annualInterestRate: number
): InterestBreakdownRow[] => {
  const monthlyRate = Math.max(annualInterestRate, 0) / 100 / 12
  let principalBalance = Math.max(startingBalance, 0)

  return schedule.map((row) => {
    const amountPaid = Math.max(toNumber(row.amount_paid), 0)
    const excessMaGenerated = Math.max(toNumber(row.excess_ma_generated ?? row.excess_ma), 0)
    const excessMaUsed = Math.max(toNumber(row.excess_ma_used ?? row.excess_used), 0)
    const penalty = Math.max(toNumber(row.penalty), 0)
    const beginningBalance = principalBalance
    const rowPrincipalDue = Math.max(toNumber(row.principal_due), 0)
    const rowInterestDue = Math.max(toNumber(row.interest_due), 0)

    const scheduledInterest = isInterestBearingRow(row)
      ? rowInterestDue || Math.min(beginningBalance * monthlyRate, toNumber(row.due_amount))
      : 0

    const actualAppliedToDue = Math.max(
      amountPaid - excessMaGenerated + excessMaUsed - penalty,
      0
    )

    const paidInterest = isInterestBearingRow(row)
      ? Math.min(scheduledInterest, actualAppliedToDue)
      : 0

    const paidPrincipal = Math.min(
      rowPrincipalDue || beginningBalance,
      Math.max(actualAppliedToDue - paidInterest, 0)
    )

    const endingBalance = row.running_balance !== null && row.running_balance !== undefined && row.running_balance !== ''
      ? Math.max(toNumber(row.running_balance), 0)
      : Math.max(beginningBalance - paidPrincipal, 0)

    principalBalance = endingBalance

    return {
      ...row,
      beginning_balance: beginningBalance,
      monthly_interest: scheduledInterest,
      principal_paid: paidPrincipal,
      ending_balance: endingBalance,
    }
  })
}


const getInitialInterestRate = (unit: Record<string, any>) => {
  const candidates = [
    unit.interest_rate,
    unit.annual_interest_rate,
    unit.interest_rate_percent,
    unit.contract_interest_rate,
  ]

  for (const candidate of candidates) {
    const parsed = toNumber(candidate)
    if (parsed > 0) return String(parsed)
  }

  return "0"
}

const StatementOfAccountPrint = () => {
  const { clientUnitId = "" } = useParams()
  const [showInterestBreakdown, setShowInterestBreakdown] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["soa-print-data", clientUnitId],
    queryFn: () => fetchPrintData(clientUnitId),
    enabled: Boolean(clientUnitId),
  })

  useEffect(() => {
    if (clientUnitId) logPrint(clientUnitId)
  }, [clientUnitId])

  const annualInterestRate = data?.unit
    ? Math.max(toNumber(getInitialInterestRate(data.unit)), 0)
    : 0

  const interestRows = useMemo(() => {
    if (!data) return []

    return buildInterestBreakdownRows(
      data.schedule,
      toNumber(data.totals.total_amount_payable),
      annualInterestRate
    )
  }, [data, annualInterestRate])

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
  const finalInterestBalance = interestRows.at(-1)?.ending_balance ?? toNumber(data.totals.balance)

  return (
    <main className="soa-page">
      <style>{printStyles}</style>

      <div className="no-print toolbar">
        <div className="toolbar-left">
          <button onClick={() => window.print()}>Print Statement of Account</button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowInterestBreakdown((current) => !current)}
          >
            {showInterestBreakdown ? "Hide Interest Breakdown" : "Show Interest Breakdown"}
          </button>
        </div>
      </div>

      <section className="sheet sheet-landscape">
        <header className="soa-header">
          <div className="company-block">
            <img className="soa-logo" src="/logo.png" alt="D&C Prime Realty" />
            <h1>D&amp;C PRIME REALTY</h1>
            <p>Matagás na Lupa, Indang, Cavite.</p>
            <p>4122 Philippines</p>
            <p>(046) 866-0616</p>
          </div>

          <div className="top-tables">
            <table>
              <tbody>
                <tr>
                  <th colSpan={2} className="title">
                    STATEMENT OF ACCOUNT
                  </th>
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
                  <th colSpan={2} className="title">
                    AMOUNT DETAILS
                  </th>
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

        {showInterestBreakdown ? (
          <>
            <div className="interest-note">
              Interest breakdown is a display-only view. Interest applies to monthly amortization rows only.
              Principal paid = Amount Paid + Excess MA Used - Excess MA Generated - Penalty - Interest. Unpaid future rows show ₱0.00 principal paid.
            </div>

            <table className="soa-table interest-table">
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Description</th>
                  <th>Beginning Balance</th>
                  <th>Due Amount</th>
                  <th>Interest</th>
                  <th>Principal Paid</th>
                  <th>Penalty</th>
                  <th>Date Paid</th>
                  <th>Amount Paid</th>
                  <th>Excess MA Used</th>
                  <th>Excess MA Balance</th>
                  <th>Reference ID</th>
                  <th>Status</th>
                  <th>Ending Balance</th>
                </tr>
              </thead>
              <tbody>
                {interestRows.map((row, index) => (
                  <tr key={`${row.description}-${index}`}>
                    <td>{formatDate(row.due_date)}</td>
                    <td>{row.description}</td>
                    <td className="money strong">{amount(row.beginning_balance)}</td>
                    <td className="money strong">{amount(row.due_amount)}</td>
                    <td className="money">{amount(row.monthly_interest)}</td>
                    <td className="money strong">{amount(row.principal_paid)}</td>
                    <td className="money">{Number(row.penalty || 0).toFixed(2)}</td>
                    <td>{formatDateOnly(row.date_paid)}</td>
                    <td className="money">{row.amount_paid ? amount(row.amount_paid) : ""}</td>
                    <td className="money">{amount(row.excess_ma_used ?? row.excess_used ?? 0)}</td>
                    <td className="money">{amount(row.excess_ma_balance)}</td>
                    <td className="reference-cell">{displayReference(row)}</td>
                    <td>{display(row.status)}</td>
                    <td className="money strong">{amount(row.ending_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <table className="soa-table">
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Description</th>
                <th>Due Amount</th>
                <th>Penalty</th>
                <th>Date Paid</th>
                <th>Amount Paid</th>
                <th>Excess MA Used</th>
                <th>Reference ID</th>
                <th>Excess MA Balance</th>
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
                  <td className="money">{amount(row.excess_ma_used ?? row.excess_used ?? 0)}</td>
                  <td className="reference-cell">{displayReference(row)}</td>
                  <td className="money">{amount(row.excess_ma_balance)}</td>
                  <td className="money strong">{amount(row.running_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="soa-total-row">
          <span>
            {showInterestBreakdown
              ? "Computed ending balance in interest breakdown view"
              : "Total amount to fully pay as of statement date"}
          </span>
          <strong>{amount(showInterestBreakdown ? finalInterestBalance : data.totals.balance)}</strong>
        </div>

        <footer className="soa-footer">
          <div>
            <p>
              Prepared by: <span className="line"></span>
            </p>
            <p className="role">Administration Head</p>
            <p>Date:</p>
          </div>
          <div>
            <p>
              Acknowledged by: <span className="line"></span>
            </p>
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
  .toolbar { position: sticky; top: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; background: white; border-bottom: 1px solid #ddd; z-index: 5; }
  .toolbar-left { display: flex; flex-wrap: wrap; gap: 8px; }
  .toolbar button { padding: 8px 12px; border: 1px solid #111; background: white; cursor: pointer; font-weight: 700; }
  .toolbar .secondary-button { border-color: #2563eb; color: #1d4ed8; }
  .soa-page { color: #111; font-family: Arial, sans-serif; }
  .sheet { margin: 16px auto; background: white; padding: 8mm; box-shadow: 0 0 0 1px #e5e7eb; }
  .sheet-landscape { width: 297mm; min-height: 210mm; }
  .soa-header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 26px; }
  .company-block { min-width: 250px; }
  .soa-logo { width: 86px; height: 86px; object-fit: contain; margin-bottom: 8px; }
  .soa-header h1 { margin: 0 0 10px; font-family: Georgia, serif; font-size: 26px; letter-spacing: .5px; }
  .soa-header p { margin: 3px 0; font-size: 14px; }
  .top-tables { width: 47%; display: flex; flex-direction: column; gap: 14px; }
  .top-tables table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .top-tables th, .top-tables td { border: 1px solid #111; padding: 4px 6px; }
  .top-tables .title { font-family: Georgia, serif; font-size: 22px; text-align: center; padding: 8px; }
  .top-tables td:nth-child(2) { text-align: center; }
  .interest-note { border: 1px solid #cbd5e1; background: #f8fafc; margin: 0 0 8px; padding: 7px 10px; font-size: 11px; font-weight: 700; }
  .soa-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .interest-table { font-size: 10px; table-layout: fixed; }
  .soa-table th { height: 42px; border: 2px solid #111; padding: 7px; text-align: center; }
  .soa-table td { border: 1px solid #222; padding: 7px; height: 21px; text-align: center; }
  .interest-table th { height: auto; padding: 5px 3px; }
  .interest-table td { padding: 5px 3px; }
  .soa-table td:nth-child(2) { text-align: left; }
  .reference-cell { max-width: 185px; word-break: break-word; font-size: 11px; }
  .interest-table .reference-cell { max-width: 115px; font-size: 9px; }
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
    .interest-note { break-after: avoid; }
  }
`

export default StatementOfAccountPrint




