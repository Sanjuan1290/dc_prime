import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { API_URL } from "../utils/api"
import { formatDate, formatMoney, formatNumber, formatText } from "../utils/formatters"

type PrintData = {
  unit: Record<string, any>
  coBuyers: Record<string, any>[]
  employmentDetails: Record<string, any>[]
  statement_date: string
}

const fetchPrintData = async (clientUnitId: string) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/print-data`, {
    credentials: "include",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || "Failed to load print data")
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
    body: JSON.stringify({ form_type: "offer_to_buy_buyers_profile" }),
  }).catch(() => null)
}

const yesNo = (condition: boolean) => (condition ? "☑" : "☐")

const display = (value: unknown) => {
  if (value === null || value === undefined || value === "") return ""
  return String(value)
}

const civilStatusChecked = (actual: unknown, expected: string) => {
  return String(actual || "") === expected
}

const employmentChecked = (actual: unknown, expected: string) => {
  return String(actual || "") === expected
}

const OfferToBuyPrint = () => {
  const { clientUnitId = "" } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ["print-data", clientUnitId],
    queryFn: () => fetchPrintData(clientUnitId),
    enabled: Boolean(clientUnitId),
  })

  useEffect(() => {
    if (clientUnitId) logPrint(clientUnitId)
  }, [clientUnitId])

  if (isLoading) {
    return <div className="print-page print-loading">Loading print form...</div>
  }

  if (error || !data) {
    return (
      <div className="print-page print-loading">
        {error instanceof Error ? error.message : "Failed to load form"}
      </div>
    )
  }

  const unit = data.unit
  const coBuyer = data.coBuyers?.[0] || {}
  const principalEmployment =
    data.employmentDetails?.find((detail) => detail.person_type === "principal") || {}
  const coBuyerEmployment =
    data.employmentDetails?.find((detail) => detail.person_type === "co_buyer") || {}

  const isCash = unit.mode_of_payment === "cash"
  const isInstallment = unit.mode_of_payment === "installment"
  const principalIncome = Number(principalEmployment.monthly_income || 0)
  const coBuyerIncome = Number(coBuyerEmployment.monthly_income || 0)

  return (
    <main className="otb-page">
      <style>{printStyles}</style>

      <div className="no-print toolbar">
        <button onClick={() => window.print()}>Print Offer to Buy</button>
      </div>

      <section className="sheet">
        <table className="form-table outer-table">
          <tbody>
            <tr>
              <td colSpan={8} className="form-title">
                <div className="form-title-main">Offer To Buy &amp; Buyer&apos;s Profile</div>
                <div className="form-title-sub">Real Estate Sales — For Individual</div>
                <div className="top-row">
                  <span>Buyer Type</span>
                  <span>{yesNo(unit.buyer_type === "single")} Single</span>
                  <span>{yesNo(unit.buyer_type === "spouses")} Spouses</span>
                  <span>{yesNo(unit.buyer_type === "and_account")} and Account</span>
                  <span>Sales Officer:</span>
                  <strong>{display(unit.seller_name)}</strong>
                  <span>Date Received:</span>
                  <strong>{formatDate(unit.starting_date || unit.created_at)}</strong>
                </div>
              </td>
            </tr>

            <tr>
              <th colSpan={8} className="section-title">PROPERTY DESCRIPTION</th>
            </tr>
            <tr>
              <td colSpan={8} className="large-line"><b>Location:</b> {display(unit.project_location || unit.project_name)}</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Property Type:</b> {display(unit.lot_type)}</td>
              <td colSpan={2}><b>Lot Area (sqm):</b> {formatNumber(unit.lot_area_sqm)}</td>
              <td colSpan={2}><b>Classification:</b> {display(unit.lot_type)}</td>
              <td colSpan={2}><b>Description/Improvements:</b> Unit {display(unit.unit_id)}</td>
            </tr>

            <tr>
              <th colSpan={8} className="section-title">OFFER TERMS AND CONDITIONS</th>
            </tr>
            <tr>
              <td colSpan={8} className="center small-italic">
                I/We hereby offer to purchase the property described above under the following terms and conditions:
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="subsection">{yesNo(isCash)} CASH</td>
              <td colSpan={4} className="subsection">{yesNo(isInstallment)} INSTALLMENT/In-house Financing</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Purchase Price:</b></td>
              <td colSpan={2}>{isCash ? formatMoney(unit.offer_purchase_price || unit.total_contract_price) : ""}</td>
              <td colSpan={2}><b>Purchase Price:</b></td>
              <td colSpan={2}>{isInstallment ? formatMoney(unit.offer_purchase_price || unit.total_contract_price) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Reservation Fee:</b></td>
              <td colSpan={2}>{isCash ? formatMoney(unit.reservation_fee_amount || unit.listing_reservation_fee) : ""}</td>
              <td colSpan={2}><b>Reservation Fee:</b></td>
              <td colSpan={2}>{isInstallment ? formatMoney(unit.reservation_fee_amount || unit.listing_reservation_fee) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Balance:</b></td>
              <td colSpan={2}>{isCash ? formatMoney(unit.offer_balance_amount || unit.balance) : ""}</td>
              <td colSpan={2}><b>Downpayment:</b></td>
              <td colSpan={2}>{isInstallment ? formatMoney(unit.downpayment_amount) : ""}</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Deferred Cash:</b></td>
              <td colSpan={2}>{isCash ? formatMoney(unit.deferred_cash_amount) : ""}</td>
              <td colSpan={2}><b>Balance:</b></td>
              <td colSpan={2}>{isInstallment ? formatMoney(unit.offer_balance_amount || unit.balance) : ""}</td>
            </tr>
            <tr>
              <td colSpan={4}></td>
              <td colSpan={2}><b>Terms (months/years to pay):</b></td>
              <td colSpan={2}>{isInstallment ? `${display(unit.payment_terms_months)} months` : ""}</td>
            </tr>
            <tr>
              <td colSpan={4}></td>
              <td colSpan={2}><b>Interest Rate:</b></td>
              <td colSpan={2}>{isInstallment ? `${display(unit.interest_rate || 0)}%` : ""}</td>
            </tr>
            <tr>
              <td colSpan={4}></td>
              <td colSpan={2}><b>Monthly Amortization:</b></td>
              <td colSpan={2}>{isInstallment ? formatMoney(unit.monthly_amortization) : ""}</td>
            </tr>

            <tr>
              <th colSpan={8} className="section-title">INDIVIDUAL BUYER/S INFORMATION</th>
            </tr>
            <tr>
              <td colSpan={4}><b>Principal Full-name:</b> {display(unit.client_name)}</td>
              <td colSpan={4}><b>Spouse/Second Buyer&apos;s Name:</b> {display(coBuyer.full_name || unit.spouse_co_owner_name)}</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Date of Birth:</b> {formatDate(unit.birth_date)}</td>
              <td colSpan={2}><b>Place of Birth:</b> {display(unit.place_of_birth)}</td>
              <td colSpan={2}><b>Date of Birth:</b> {formatDate(coBuyer.birth_date)}</td>
              <td colSpan={2}><b>Place of Birth:</b> {display(coBuyer.place_of_birth)}</td>
            </tr>
            <tr>
              <td colSpan={2}><b>Citizenship:</b> {display(unit.citizenship)}</td>
              <td colSpan={2}><b>Gender:</b> {formatText(unit.gender)}</td>
              <td colSpan={2}><b>Citizenship:</b> {display(coBuyer.citizenship)}</td>
              <td colSpan={2}><b>Gender:</b> {formatText(coBuyer.gender)}</td>
            </tr>
            <tr>
              <td colSpan={4}>
                <b>Civil Status:</b> {yesNo(civilStatusChecked(unit.civil_status, "single"))} Single &nbsp;
                {yesNo(civilStatusChecked(unit.civil_status, "married"))} Married &nbsp;
                {yesNo(civilStatusChecked(unit.civil_status, "separated"))} Separated &nbsp;
                {yesNo(civilStatusChecked(unit.civil_status, "annulled_divorced"))} Annulled/Divorced &nbsp;
                {yesNo(civilStatusChecked(unit.civil_status, "widower"))} Widow/er
              </td>
              <td colSpan={4}>
                <b>Civil Status:</b> {yesNo(civilStatusChecked(coBuyer.civil_status, "single"))} Single &nbsp;
                {yesNo(civilStatusChecked(coBuyer.civil_status, "married"))} Married &nbsp;
                {yesNo(civilStatusChecked(coBuyer.civil_status, "separated"))} Separated &nbsp;
                {yesNo(civilStatusChecked(coBuyer.civil_status, "annulled_divorced"))} Annulled/Divorced &nbsp;
                {yesNo(civilStatusChecked(coBuyer.civil_status, "widower"))} Widow/er
              </td>
            </tr>
            <tr>
              <td colSpan={3}><b>Present Address:</b> {display(unit.present_address || unit.client_address)}</td>
              <td><b>Zip Code:</b> {display(unit.present_zip_code)}</td>
              <td colSpan={3}><b>Present Address:</b> {display(coBuyer.present_address)}</td>
              <td><b>Zip Code:</b> {display(coBuyer.present_zip_code)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>Permanent Address:</b> {display(unit.permanent_address)}</td>
              <td colSpan={4}><b>Permanent Address:</b> {display(coBuyer.permanent_address)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>Mobile No.:</b> {display(unit.client_contact_no)}</td>
              <td colSpan={4}><b>Mobile No.:</b> {display(coBuyer.mobile_no)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>Residence Phone Number:</b> {display(unit.residence_phone_no)}</td>
              <td colSpan={4}><b>Residence Phone Number:</b> {display(coBuyer.residence_phone_no)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>E-mail Add:</b> {display(unit.client_email)}</td>
              <td colSpan={4}><b>E-mail Add:</b> {display(coBuyer.email)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>TIN:</b> {display(unit.client_tin)}</td>
              <td colSpan={4}><b>TIN:</b> {display(coBuyer.tin)}</td>
            </tr>

            <tr>
              <th colSpan={4} className="section-title">Work/Business Information</th>
              <th colSpan={4} className="section-title">Work/Business Information</th>
            </tr>
            <tr>
              <td colSpan={4}>
                <b>Employment Status:</b><br />
                {yesNo(employmentChecked(principalEmployment.employment_status, "employed_private"))} Employed - Private &nbsp;
                {yesNo(employmentChecked(principalEmployment.employment_status, "self_employed_business"))} Self-Employed (With Business)<br />
                {yesNo(employmentChecked(principalEmployment.employment_status, "employed_government"))} Employed Government &nbsp;
                {yesNo(employmentChecked(principalEmployment.employment_status, "self_employed_professional"))} Self-Employed (Professional)<br />
                {yesNo(employmentChecked(principalEmployment.employment_status, "employed_ngo"))} Employed - NGO &nbsp;
                {yesNo(employmentChecked(principalEmployment.employment_status, "ofw_immigrant"))} OFW/immigrant<br />
                Other: {display(principalEmployment.employment_status_other)}
              </td>
              <td colSpan={4}>
                <b>Employment Status:</b><br />
                {yesNo(employmentChecked(coBuyerEmployment.employment_status, "employed_private"))} Employed - Private &nbsp;
                {yesNo(employmentChecked(coBuyerEmployment.employment_status, "self_employed_business"))} Self-Employed (With Business)<br />
                {yesNo(employmentChecked(coBuyerEmployment.employment_status, "employed_government"))} Employed Government &nbsp;
                {yesNo(employmentChecked(coBuyerEmployment.employment_status, "self_employed_professional"))} Self-Employed (Professional)<br />
                {yesNo(employmentChecked(coBuyerEmployment.employment_status, "employed_ngo"))} Employed - NGO &nbsp;
                {yesNo(employmentChecked(coBuyerEmployment.employment_status, "ofw_immigrant"))} OFW/immigrant<br />
                Other: {display(coBuyerEmployment.employment_status_other)}
              </td>
            </tr>
            <tr>
              <td colSpan={4}><b>Employer/Business Name:</b> {display(principalEmployment.employer_business_name)}</td>
              <td colSpan={4}><b>Employer/Business Name:</b> {display(coBuyerEmployment.employer_business_name)}</td>
            </tr>
            <tr>
              <td colSpan={3}><b>Employer/Business Address:</b> {display(principalEmployment.employer_business_address)}</td>
              <td><b>Zip Code:</b> {display(principalEmployment.employer_zip_code)}</td>
              <td colSpan={3}><b>Employer/Business Address:</b> {display(coBuyerEmployment.employer_business_address)}</td>
              <td><b>Zip Code:</b> {display(coBuyerEmployment.employer_zip_code)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>Nature of Work/Business:</b> {display(principalEmployment.nature_of_work_business)}</td>
              <td colSpan={4}><b>Nature of Work/Business:</b> {display(coBuyerEmployment.nature_of_work_business)}</td>
            </tr>
            <tr>
              <td colSpan={4}><b>Occupation/Position/Title:</b> {display(principalEmployment.occupation_position_title)}</td>
              <td colSpan={4}><b>Occupation/Position/Title:</b> {display(coBuyerEmployment.occupation_position_title)}</td>
            </tr>

            <tr>
              <th colSpan={8} className="section-title">INCOME DETAILS (MONTHLY)</th>
            </tr>
            <tr>
              <td colSpan={3} className="center"><b>PRINCIPAL</b><br />{formatMoney(principalIncome)}</td>
              <td colSpan={3} className="center"><b>SPOUSE/SECOND BUYER</b><br />{formatMoney(coBuyerIncome)}</td>
              <td colSpan={2} className="center"><b>TOTAL</b><br />{formatMoney(principalIncome + coBuyerIncome)}</td>
            </tr>

            <tr>
              <th colSpan={8} className="signature-title">SIGNATURES of BUYER/S</th>
            </tr>
            <tr>
              <td colSpan={4} className="signature-cell">Signature over Printed Name of Principal Buyer</td>
              <td colSpan={4} className="signature-cell">Signature over Printed Name of Spouse/Second Buyer</td>
            </tr>
            <tr>
              <th colSpan={8} className="section-title">SALES AGENT:</th>
            </tr>
            <tr>
              <td colSpan={2}><b>Name:</b> {display(unit.seller_name)}</td>
              <td colSpan={2}><b>TIN No.:</b></td>
              <td colSpan={4}><b>Address:</b></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  )
}

const printStyles = `
  @page { size: A4 portrait; margin: 8mm; }
  body { background: #f8fafc; }
  .toolbar { position: sticky; top: 0; padding: 12px; background: white; border-bottom: 1px solid #ddd; z-index: 5; }
  .toolbar button { padding: 8px 12px; border: 1px solid #111; background: white; cursor: pointer; font-weight: 700; }
  .otb-page { color: #111; font-family: Arial, sans-serif; }
  .sheet { width: 210mm; min-height: 297mm; margin: 16px auto; background: white; padding: 8mm; box-shadow: 0 0 0 1px #e5e7eb; }
  .form-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
  .form-table td, .form-table th { border: 1px solid #777; padding: 4px 5px; vertical-align: top; min-height: 17px; }
  .outer-table { border: 2px solid #222; }
  .form-title { border-bottom: 1px solid #777; }
  .form-title-main { font-size: 14px; font-weight: 800; }
  .form-title-sub { font-size: 10px; font-weight: 700; }
  .top-row { display: grid; grid-template-columns: auto auto auto auto auto 1fr auto 1fr; gap: 6px; align-items: center; margin-top: 4px; }
  .section-title { background: #d9d9d9; font-size: 12px; text-align: center; font-weight: 800; }
  .signature-title { background: #1f4e79; color: white; text-align: center; font-weight: 800; }
  .subsection { font-weight: 800; background: #f3f4f6; }
  .small-italic { font-style: italic; font-size: 9px; }
  .center { text-align: center; }
  .large-line { height: 24px; }
  .signature-cell { height: 40px; text-align: center; vertical-align: bottom !important; font-weight: 700; }
  .print-loading { padding: 40px; font-family: Arial, sans-serif; }
  @media print {
    body { background: white; }
    .no-print { display: none !important; }
    .sheet { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 0; }
  }
`

export default OfferToBuyPrint
