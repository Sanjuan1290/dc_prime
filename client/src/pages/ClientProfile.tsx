import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  FiArrowLeft,
  FiEdit2,
  FiFileText,
  FiHome,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
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
  getLocalDate,
} from "../utils/formatters"

type Client = {
  id: number
  full_name: string
  spouse_co_owner_name: string | null
  buyer_type?: BuyerType | string | null
  birth_date?: string | null
  place_of_birth?: string | null
  citizenship?: string | null
  gender?: Gender | string | null
  civil_status?: CivilStatus | string | null
  email: string | null
  contact_no: string | null
  residence_phone_no?: string | null
  tin?: string | null
  address: string | null
  present_address?: string | null
  present_zip_code?: string | null
  permanent_address?: string | null
  permanent_zip_code?: string | null
  region: string | null
  profile_status?: ProfileStatus | string | null
  default_seller_id?: number | null
  default_seller_name?: string | null
  default_seller_role?: string | null
  default_seller_commission_rate?: number | string | null
  created_at: string
  updated_at: string
}

type BuyerType = "single" | "spouses" | "and_account"
type Gender = "male" | "female" | "other"
type CivilStatus =
  | "single"
  | "married"
  | "separated"
  | "annulled_divorced"
  | "widower"
type BuyerRole = "spouse" | "second_buyer"
type ProfileStatus = "incomplete" | "complete"
type PersonType = "principal" | "co_buyer"
type EmploymentStatus =
  | "employed_private"
  | "employed_government"
  | "employed_ngo"
  | "self_employed_business"
  | "self_employed_professional"
  | "ofw_immigrant"
  | "other"

type CoBuyer = {
  id: number
  client_id: number
  buyer_role: BuyerRole | string
  full_name: string | null
  birth_date: string | null
  place_of_birth: string | null
  citizenship: string | null
  gender: Gender | string | null
  civil_status: CivilStatus | string | null
  present_address: string | null
  present_zip_code: string | null
  permanent_address: string | null
  permanent_zip_code: string | null
  mobile_no: string | null
  residence_phone_no: string | null
  email: string | null
  tin: string | null
}

type EmploymentDetail = {
  id: number
  client_id: number
  client_buyer_id: number | null
  person_type: PersonType | string
  employment_status: EmploymentStatus | string | null
  employment_status_other: string | null
  employer_business_name: string | null
  employer_business_address: string | null
  employer_zip_code: string | null
  nature_of_work_business: string | null
  occupation_position_title: string | null
  monthly_income: number | string | null
}

type ProfileCompletion = {
  isComplete: boolean
  missingFields: string[]
}

type PrincipalProfileData = {
  buyer_type: BuyerType
  full_name: string
  birth_date: string
  place_of_birth: string
  citizenship: string
  gender: Gender | ""
  civil_status: CivilStatus | ""
  present_address: string
  present_zip_code: string
  permanent_address: string
  permanent_zip_code: string
  contact_no: string
  residence_phone_no: string
  email: string
  tin: string
}

type CoBuyerFormData = {
  buyer_role: BuyerRole
  full_name: string
  birth_date: string
  place_of_birth: string
  citizenship: string
  gender: Gender | ""
  civil_status: CivilStatus | ""
  present_address: string
  present_zip_code: string
  permanent_address: string
  permanent_zip_code: string
  mobile_no: string
  residence_phone_no: string
  email: string
  tin: string
}

type EmploymentFormData = {
  person_type: PersonType
  client_buyer_id: number | null
  employment_status: EmploymentStatus | ""
  employment_status_other: string
  employer_business_name: string
  employer_business_address: string
  employer_zip_code: string
  nature_of_work_business: string
  occupation_position_title: string
  monthly_income: string
}

type ClientUnit = {
  id: number
  client_id: number
  client_name: string
  listing_id: number
  unit_id: string
  project_name: string
  lot_type: string | null
  lot_area_sqm: number | string
  price_per_sqm?: number | string
  net_selling_price: number | string
  legal_misc_rate?: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  paid_amount: number | string
  balance: number | string
  payment_percentage?: number | string
  mode_of_payment?: string | null
  due_day: number | null
  starting_date?: string | null
  due_date?: string | null
  offer_purchase_price?: number | string | null
  reservation_fee_amount?: number | string | null
  downpayment_amount?: number | string | null
  deferred_cash_amount?: number | string | null
  offer_balance_amount?: number | string | null
  payment_terms_months?: number | string | null
  interest_rate?: number | string | null
  monthly_amortization?: number | string | null
  contract_processing_status?: string | null
  status: string
  assigned_user_id: number | null
  assigned_user_name: string | null
  seller_id: number | null
  seller_name: string | null
  seller_role: string | null
  seller_commission_rate?: number | string | null
  sale_type?: "distributed" | "direct" | string | null
  reports_under: string | null
  document_total_count?: number | string
  document_checklist_count?: number | string
  document_required_count?: number | string
  document_submitted_count?: number | string
  document_submitted_required_count?: number | string
  document_approved_count?: number | string
  document_rejected_count?: number | string
  document_status: string
  commission_count?: number | string
  gross_commission_total?: number | string
  released_commission_total?: number | string
  created_at: string
  updated_at: string
}

type AvailableListing = {
  id: number
  project_id: number
  project_name: string
  project_location?: string | null
  unit_id: string
  lot_type: string | null
  lot_area_sqm: number | string
  price_per_sqm: number | string
  net_selling_price: number | string
  legal_misc_rate?: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  reservation_fee: number | string
  status: string
}

type Seller = {
  id: number
  full_name: string
  seller_role: string
  commission_rate?: number | string | null
  reports_under_display?: string | null
}

type ClientDocument = {
  id: number
  client_unit_id: number
  document_id: number
  name: string
  description: string | null
  is_required: number | boolean
  can_reuse: number | boolean
  file_url: string | null
  status: "not_submitted" | "submitted" | "approved" | "rejected" | string
  reviewed_by: number | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

type ClientResponse = {
  client: Client
  co_buyers?: CoBuyer[]
  employment_details?: EmploymentDetail[]
  profile_completion?: ProfileCompletion
  data?: Client
}

type ClientUnitsResponse = {
  client?: Client
  clientUnits?: ClientUnit[]
  units?: ClientUnit[]
  data?: ClientUnit[]
}

type AvailableListingsResponse = {
  listings?: AvailableListing[]
  availableListings?: AvailableListing[]
  data?: AvailableListing[]
}

type SellersResponse = {
  accreditedSellers?: Seller[]
  sellers?: Seller[]
  data?: Seller[]
}

type ClientDocumentsResponse = {
  documents?: ClientDocument[]
  clientDocuments?: ClientDocument[]
  data?: ClientDocument[]
}

type ReserveListingData = {
  listing_id: number | ""
  seller_id: number | ""
  status: string
  mode_of_payment: "cash" | "installment"
  starting_date: string
  due_date: string
  reservation_fee_amount: string
  downpayment_amount: string
  deferred_cash_amount: string
  payment_terms_months: 36 | 60 | ""
  interest_rate: string
  monthly_amortization: string
  sale_type: "distributed" | "direct"
  override_seller_id: number | ""
  override_rate: string
  override_notes: string
  cash_kaliwaan_amount: string
  cash_kaliwaan_date: string
  cash_kaliwaan_notes: string
}

type EditUnitData = {
  seller_id: string
  due_day: string
  status: string
  mode_of_payment: "cash" | "installment"
  regenerate_commission: boolean
  sale_type: "distributed" | "direct"
  override_seller_id: string
  override_rate: string
  override_notes: string
}

type ChangeUnitData = {
  new_listing_id: number | ""
  status: string
  regenerate_commission: boolean
  reason: string
}

type CancelUnitData = {
  release_listing: boolean
  reason: string
}

const createDefaultReserveData = (): ReserveListingData => ({
  listing_id: "",
  seller_id: "",
  status: "reserved",
  mode_of_payment: "installment",
  starting_date: getLocalDate(),
  due_date: getLocalDate(),
  reservation_fee_amount: "",
  downpayment_amount: "0",
  deferred_cash_amount: "0",
  payment_terms_months: 36,
  interest_rate: "0",
  monthly_amortization: "",
  sale_type: "distributed",
  override_seller_id: "",
  override_rate: "",
  override_notes: "",
  cash_kaliwaan_amount: "",
  cash_kaliwaan_date: "",
  cash_kaliwaan_notes: "",
})

const defaultEditUnitData: EditUnitData = {
  seller_id: "",
  due_day: "",
  status: "reserved",
  mode_of_payment: "installment",
  regenerate_commission: false,
  sale_type: "distributed",
  override_seller_id: "",
  override_rate: "",
  override_notes: "",
}

const defaultChangeUnitData: ChangeUnitData = {
  new_listing_id: "",
  status: "reserved",
  regenerate_commission: true,
  reason: "",
}

const defaultCancelUnitData: CancelUnitData = {
  release_listing: true,
  reason: "",
}

const emptyPrincipalProfileData = (): PrincipalProfileData => ({
  buyer_type: "single",
  full_name: "",
  birth_date: "",
  place_of_birth: "",
  citizenship: "",
  gender: "",
  civil_status: "",
  present_address: "",
  present_zip_code: "",
  permanent_address: "",
  permanent_zip_code: "",
  contact_no: "",
  residence_phone_no: "",
  email: "",
  tin: "",
})

const emptyCoBuyerData = (): CoBuyerFormData => ({
  buyer_role: "spouse",
  full_name: "",
  birth_date: "",
  place_of_birth: "",
  citizenship: "",
  gender: "",
  civil_status: "",
  present_address: "",
  present_zip_code: "",
  permanent_address: "",
  permanent_zip_code: "",
  mobile_no: "",
  residence_phone_no: "",
  email: "",
  tin: "",
})

const emptyEmploymentData = (
  personType: PersonType,
  clientBuyerId: number | null = null
): EmploymentFormData => ({
  person_type: personType,
  client_buyer_id: clientBuyerId,
  employment_status: "",
  employment_status_other: "",
  employer_business_name: "",
  employer_business_address: "",
  employer_zip_code: "",
  nature_of_work_business: "",
  occupation_position_title: "",
  monthly_income: "",
})

const buyerTypeOptions = [
  { label: "Single", value: "single" },
  { label: "Spouses", value: "spouses" },
  { label: "And Account", value: "and_account" },
] as const

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
] as const

const civilStatusOptions = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Separated", value: "separated" },
  { label: "Annulled / Divorced", value: "annulled_divorced" },
  { label: "Widower", value: "widower" },
] as const

const employmentStatusOptions = [
  { label: "Employed - Private", value: "employed_private" },
  { label: "Employed - Government", value: "employed_government" },
  { label: "Employed - NGO", value: "employed_ngo" },
  { label: "Self-Employed (Business)", value: "self_employed_business" },
  { label: "Self-Employed (Professional)", value: "self_employed_professional" },
  { label: "OFW / Immigrant", value: "ofw_immigrant" },
  { label: "Other", value: "other" },
] as const

const normalizeBuyerType = (value: string | null | undefined): BuyerType => {
  if (value === "spouses" || value === "and_account") return value
  return "single"
}

const clientToPrincipalProfileData = (client: Client): PrincipalProfileData => ({
  buyer_type: normalizeBuyerType(client.buyer_type),
  full_name: client.full_name || "",
  birth_date: formatDate(client.birth_date) === "-" ? "" : formatDate(client.birth_date),
  place_of_birth: client.place_of_birth || "",
  citizenship: client.citizenship || "",
  gender:
    client.gender === "male" || client.gender === "female" || client.gender === "other"
      ? client.gender
      : "",
  civil_status:
    client.civil_status === "single" ||
    client.civil_status === "married" ||
    client.civil_status === "separated" ||
    client.civil_status === "annulled_divorced" ||
    client.civil_status === "widower"
      ? client.civil_status
      : "",
  present_address: client.present_address || client.address || "",
  present_zip_code: client.present_zip_code || "",
  permanent_address: client.permanent_address || "",
  permanent_zip_code: client.permanent_zip_code || "",
  contact_no: client.contact_no || "",
  residence_phone_no: client.residence_phone_no || "",
  email: client.email || "",
  tin: client.tin || "",
})

const coBuyerToFormData = (buyer: CoBuyer | undefined): CoBuyerFormData => {
  if (!buyer) return emptyCoBuyerData()

  return {
    buyer_role: buyer.buyer_role === "second_buyer" ? "second_buyer" : "spouse",
    full_name: buyer.full_name || "",
    birth_date: formatDate(buyer.birth_date) === "-" ? "" : formatDate(buyer.birth_date),
    place_of_birth: buyer.place_of_birth || "",
    citizenship: buyer.citizenship || "",
    gender:
      buyer.gender === "male" || buyer.gender === "female" || buyer.gender === "other"
        ? buyer.gender
        : "",
    civil_status:
      buyer.civil_status === "single" ||
      buyer.civil_status === "married" ||
      buyer.civil_status === "separated" ||
      buyer.civil_status === "annulled_divorced" ||
      buyer.civil_status === "widower"
        ? buyer.civil_status
        : "",
    present_address: buyer.present_address || "",
    present_zip_code: buyer.present_zip_code || "",
    permanent_address: buyer.permanent_address || "",
    permanent_zip_code: buyer.permanent_zip_code || "",
    mobile_no: buyer.mobile_no || "",
    residence_phone_no: buyer.residence_phone_no || "",
    email: buyer.email || "",
    tin: buyer.tin || "",
  }
}

const employmentToFormData = (
  detail: EmploymentDetail | undefined,
  personType: PersonType,
  clientBuyerId: number | null = null
): EmploymentFormData => {
  if (!detail) return emptyEmploymentData(personType, clientBuyerId)

  return {
    person_type: personType,
    client_buyer_id: detail.client_buyer_id || clientBuyerId,
    employment_status:
      employmentStatusOptions.some((option) => option.value === detail.employment_status)
        ? (detail.employment_status as EmploymentStatus)
        : "",
    employment_status_other: detail.employment_status_other || "",
    employer_business_name: detail.employer_business_name || "",
    employer_business_address: detail.employer_business_address || "",
    employer_zip_code: detail.employer_zip_code || "",
    nature_of_work_business: detail.nature_of_work_business || "",
    occupation_position_title: detail.occupation_position_title || "",
    monthly_income:
      detail.monthly_income === null || detail.monthly_income === undefined
        ? ""
        : String(detail.monthly_income),
  }
}

const calculateAge = (birthDate: string) => {
  if (!birthDate) return "-"

  const birth = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birth.getTime())) return "-"

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return age >= 0 ? String(age) : "-"
}

const fetchClient = async (clientId: string) => {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as ClientResponse
  return {
    client: data.client || data.data,
    co_buyers: data.co_buyers || [],
    employment_details: data.employment_details || [],
    profile_completion: data.profile_completion || {
      isComplete: false,
      missingFields: [],
    },
  }
}

const fetchClientUnits = async (clientId: string) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/units`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as ClientUnitsResponse
  return data.clientUnits || data.units || data.data || []
}

const fetchAvailableListings = async () => {
  const res = await fetch(`${API_URL}/available-listings`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as AvailableListingsResponse
  return data.listings || data.availableListings || data.data || []
}

const fetchSellers = async () => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as SellersResponse
  return data.accreditedSellers || data.sellers || data.data || []
}

const fetchClientDocuments = async (clientUnitId: number | null) => {
  if (!clientUnitId) return []

  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/documents`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as ClientDocumentsResponse
  return data.documents || data.clientDocuments || data.data || []
}

const reserveListing = async ({
  clientId,
  reserveData,
}: {
  clientId: string
  reserveData: ReserveListingData
}) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/reserve-listing`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      listing_id: reserveData.listing_id,
      seller_id: reserveData.seller_id || null,
      status: reserveData.status,
      mode_of_payment: reserveData.mode_of_payment,
      starting_date: reserveData.starting_date,
      due_date: reserveData.due_date,
      reservation_fee_amount: Number(reserveData.reservation_fee_amount || 0),
      downpayment_amount:
        reserveData.mode_of_payment === "installment"
          ? Number(reserveData.downpayment_amount || 0)
          : 0,
      deferred_cash_amount:
        reserveData.mode_of_payment === "cash"
          ? Number(reserveData.deferred_cash_amount || 0)
          : 0,
      payment_terms_months:
        reserveData.mode_of_payment === "installment"
          ? Number(reserveData.payment_terms_months)
          : null,
      interest_rate:
        reserveData.mode_of_payment === "installment"
          ? Number(reserveData.interest_rate || 0)
          : 0,
      monthly_amortization:
        reserveData.mode_of_payment === "installment" &&
        reserveData.monthly_amortization !== ""
          ? Number(reserveData.monthly_amortization)
          : null,
      sale_type: reserveData.sale_type,
      override_seller_id: reserveData.override_seller_id || null,
      override_rate:
        reserveData.override_rate === ""
          ? null
          : Number(reserveData.override_rate),
      override_notes: reserveData.override_notes || null,
      cash_kaliwaan_amount:
        reserveData.cash_kaliwaan_amount === ""
          ? 0
          : Number(reserveData.cash_kaliwaan_amount),
      cash_kaliwaan_date: reserveData.cash_kaliwaan_date || null,
      cash_kaliwaan_notes: reserveData.cash_kaliwaan_notes || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const savePrincipalProfile = async ({
  clientId,
  profileData,
  profileStatus,
}: {
  clientId: string
  profileData: PrincipalProfileData
  profileStatus?: ProfileStatus
}) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...profileData,
      profile_status: profileStatus || undefined,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const replaceCoBuyers = async ({
  clientId,
  coBuyers,
}: {
  clientId: string
  coBuyers: CoBuyerFormData[]
}) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/co-buyers`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ co_buyers: coBuyers }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return (await res.json()) as ClientResponse
}

const replaceEmploymentDetails = async ({
  clientId,
  employmentDetails,
}: {
  clientId: string
  employmentDetails: EmploymentFormData[]
}) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/employment-details`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ employment_details: employmentDetails }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const saveBuyerProfile = async ({
  clientId,
  profileData,
  coBuyerData,
  principalEmploymentData,
  coBuyerEmploymentData,
  markComplete = false,
}: {
  clientId: string
  profileData: PrincipalProfileData
  coBuyerData: CoBuyerFormData[]
  principalEmploymentData: EmploymentFormData
  coBuyerEmploymentData: EmploymentFormData
  markComplete?: boolean
}) => {
  await savePrincipalProfile({ clientId, profileData })
  const coBuyerResponse = await replaceCoBuyers({
    clientId,
    coBuyers: profileData.buyer_type === "single" ? [] : coBuyerData,
  })
  const savedCoBuyerId = coBuyerResponse.co_buyers?.[0]?.id || null
  const employmentDetails: EmploymentFormData[] = [
    {
      ...principalEmploymentData,
      person_type: "principal" as const,
      client_buyer_id: null,
    },
  ]

  if (profileData.buyer_type !== "single") {
    employmentDetails.push({
      ...coBuyerEmploymentData,
      person_type: "co_buyer",
      client_buyer_id: savedCoBuyerId,
    })
  }

  await replaceEmploymentDetails({
    clientId,
    employmentDetails,
  })

  if (markComplete) {
    return savePrincipalProfile({
      clientId,
      profileData,
      profileStatus: "complete",
    })
  }

  return savePrincipalProfile({ clientId, profileData })
}

const updateClientUnit = async ({
  clientUnitId,
  unitData,
}: {
  clientUnitId: number
  unitData: EditUnitData
}) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seller_id: unitData.seller_id ? Number(unitData.seller_id) : null,
      due_day: unitData.due_day ? Number(unitData.due_day) : null,
      status: unitData.status,
      mode_of_payment: unitData.mode_of_payment,
      regenerate_commission: unitData.regenerate_commission,
      sale_type: unitData.sale_type,
      override_seller_id:
        unitData.sale_type === "distributed" && unitData.override_seller_id
          ? Number(unitData.override_seller_id)
          : null,
      override_rate:
        unitData.sale_type === "distributed" && unitData.override_rate !== ""
          ? Number(unitData.override_rate)
          : null,
      override_notes:
        unitData.sale_type === "distributed"
          ? unitData.override_notes || null
          : null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const changeClientUnitListing = async ({
  clientUnitId,
  changeData,
}: {
  clientUnitId: number
  changeData: ChangeUnitData
}) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/change-listing`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      new_listing_id: changeData.new_listing_id,
      status: changeData.status,
      regenerate_commission: changeData.regenerate_commission,
      reason: changeData.reason || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const cancelClientUnit = async ({
  clientUnitId,
  cancelData,
}: {
  clientUnitId: number
  cancelData: CancelUnitData
}) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/cancel`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      release_listing: cancelData.release_listing,
      reason: cancelData.reason || null,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const deleteClientUnit = async (clientUnitId: number) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const createDocumentChecklist = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/documents/checklist`,
    {
      method: "POST",
      credentials: "include",
    }
  )

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const applyExistingReusableDocuments = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/documents/apply-existing`,
    {
      method: "POST",
      credentials: "include",
    }
  )

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const updateClientDocumentStatus = async ({
  clientDocumentId,
  status,
}: {
  clientDocumentId: number
  status: string
}) => {
  const res = await fetch(`${API_URL}/client-documents/${clientDocumentId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const isSubmitted = (status: string) => {
  return ["submitted", "approved"].includes(status)
}

const isRequired = (value: number | boolean) => {
  return value === true || Number(value) === 1
}

const documentStatusOptions = [
  { label: "Not Submitted", value: "not_submitted" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

const documentStatusTransitions: Record<string, string[]> = {
  not_submitted: ["submitted"],
  submitted: ["approved", "rejected"],
  rejected: ["submitted"],
  approved: ["submitted", "not_submitted"],
}

const getDocumentStatusOptions = (status: string) => {
  const allowedStatuses = new Set([
    status,
    ...(documentStatusTransitions[status] || []),
  ])

  return documentStatusOptions.filter((option) =>
    allowedStatuses.has(option.value)
  )
}

const countValue = (value: number | string | null | undefined) => {
  return Number(value || 0)
}

const moneyInputValue = (value: string) => {
  if (value === "") return 0

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const isPresentMoneyInputValid = (value: string) => {
  if (value === "") return true

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) && parsedValue >= 0
}

const getUnitDocumentSummary = (unit: ClientUnit) => {
  const checklistCount = countValue(unit.document_checklist_count)
  const totalCount = countValue(unit.document_total_count)
  const submittedCount = countValue(unit.document_submitted_count)
  const requiredCount = countValue(unit.document_required_count)
  const submittedRequiredCount = countValue(
    unit.document_submitted_required_count
  )

  return {
    checklistCount,
    totalCount,
    submittedCount,
    requiredCount,
    submittedRequiredCount,
    hasChecklist: checklistCount > 0,
    progressLabel:
      checklistCount > 0
        ? `Documents: ${submittedCount}/${checklistCount} submitted`
        : "No checklist generated",
    requiredLabel:
      requiredCount > 0
        ? `Required: ${submittedRequiredCount}/${requiredCount}`
        : "No required documents",
  }
}

const ClientProfile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: clientId } = useParams()

  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [reserveData, setReserveData] = useState<ReserveListingData>(
    () => createDefaultReserveData()
  )
  const [listingSearch, setListingSearch] = useState("")
  const [editUnit, setEditUnit] = useState<ClientUnit | null>(null)
  const [editUnitData, setEditUnitData] =
    useState<EditUnitData>(defaultEditUnitData)
  const [changeUnit, setChangeUnit] = useState<ClientUnit | null>(null)
  const [changeUnitData, setChangeUnitData] =
    useState<ChangeUnitData>(defaultChangeUnitData)
  const [changeListingSearch, setChangeListingSearch] = useState("")
  const [cancelUnit, setCancelUnit] = useState<ClientUnit | null>(null)
  const [cancelUnitData, setCancelUnitData] =
    useState<CancelUnitData>(defaultCancelUnitData)
  const [deleteUnit, setDeleteUnit] = useState<ClientUnit | null>(null)
  const [selectedDocumentsUnit, setSelectedDocumentsUnit] =
    useState<ClientUnit | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [reserveValidationMessage, setReserveValidationMessage] = useState("")
  const [principalProfileData, setPrincipalProfileData] =
    useState<PrincipalProfileData>(() => emptyPrincipalProfileData())
  const [coBuyerData, setCoBuyerData] = useState<CoBuyerFormData[]>(() => [
    emptyCoBuyerData(),
  ])
  const [principalEmploymentData, setPrincipalEmploymentData] =
    useState<EmploymentFormData>(() => emptyEmploymentData("principal"))
  const [coBuyerEmploymentData, setCoBuyerEmploymentData] =
    useState<EmploymentFormData>(() => emptyEmploymentData("co_buyer"))

  const {
    data: clientProfile,
    isLoading: isClientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId || ""),
    enabled: Boolean(clientId),
  })

  const client = clientProfile?.client
  const coBuyers = useMemo(
    () => clientProfile?.co_buyers || [],
    [clientProfile?.co_buyers]
  )
  const employmentDetails = useMemo(
    () => clientProfile?.employment_details || [],
    [clientProfile?.employment_details]
  )
  const profileCompletion = clientProfile?.profile_completion || {
    isComplete: false,
    missingFields: [],
  }

  const {
    data: clientUnits = [],
    isLoading: areUnitsLoading,
    error: unitsError,
  } = useQuery({
    queryKey: ["client-units", clientId],
    queryFn: () => fetchClientUnits(clientId || ""),
    enabled: Boolean(clientId),
  })

  const { data: availableListings = [] } = useQuery({
    queryKey: ["available-listings"],
    queryFn: fetchAvailableListings,
  })

  const { data: sellers = [] } = useQuery({
    queryKey: ["accredited-sellers", "active"],
    queryFn: fetchSellers,
  })

  const {
    data: clientDocuments = [],
    isLoading: areDocumentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ["client-unit-documents", selectedDocumentsUnit?.id || null],
    queryFn: () => fetchClientDocuments(selectedDocumentsUnit?.id || null),
    enabled: Boolean(selectedDocumentsUnit?.id),
  })

  useEffect(() => {
    if (!client) return

    const firstCoBuyer = coBuyers[0]
    const principalEmployment = employmentDetails.find(
      (detail) => detail.person_type === "principal"
    )
    const coBuyerEmployment = firstCoBuyer
      ? employmentDetails.find(
          (detail) =>
            detail.person_type === "co_buyer" &&
            Number(detail.client_buyer_id) === Number(firstCoBuyer.id)
        ) ||
        employmentDetails.find((detail) => detail.person_type === "co_buyer")
      : undefined

    const timeoutId = window.setTimeout(() => {
      setPrincipalProfileData(clientToPrincipalProfileData(client))
      setCoBuyerData([coBuyerToFormData(firstCoBuyer)])
      setPrincipalEmploymentData(
        employmentToFormData(principalEmployment, "principal")
      )
      setCoBuyerEmploymentData(
        employmentToFormData(
          coBuyerEmployment,
          "co_buyer",
          firstCoBuyer?.id || null
        )
      )
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [client, coBuyers, employmentDetails])

  const invalidateClientProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["client", clientId] })
    queryClient.invalidateQueries({ queryKey: ["client-units", clientId] })
    queryClient.invalidateQueries({ queryKey: ["client-units"] })
    queryClient.invalidateQueries({ queryKey: ["available-listings"] })
    queryClient.invalidateQueries({ queryKey: ["listings"] })
    queryClient.invalidateQueries({ queryKey: ["commissions"] })
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] })
    queryClient.invalidateQueries({ queryKey: ["commission-releases"] })

    if (selectedDocumentsUnit?.id) {
      queryClient.invalidateQueries({
        queryKey: ["client-unit-documents", selectedDocumentsUnit.id],
      })
    }
  }

  const reserveMutation = useMutation({
    mutationFn: reserveListing,
    onSuccess: () => {
      invalidateClientProfile()
      setIsReserveOpen(false)
      setReserveData(createDefaultReserveData())
      setReserveValidationMessage("")
      setSuccessMessage("Listing reserved and commission generated successfully")
    },
  })

  const saveBuyerProfileMutation = useMutation({
    mutationFn: saveBuyerProfile,
    onSuccess: () => {
      invalidateClientProfile()
      setSuccessMessage("Buyer profile saved successfully")
    },
  })

  const markBuyerProfileCompleteMutation = useMutation({
    mutationFn: saveBuyerProfile,
    onSuccess: () => {
      invalidateClientProfile()
      setSuccessMessage("Buyer profile marked complete")
    },
  })

  const updateUnitMutation = useMutation({
    mutationFn: updateClientUnit,
    onSuccess: () => {
      invalidateClientProfile()
      setEditUnit(null)
      setSuccessMessage("Client unit updated successfully")
    },
  })

  const changeUnitMutation = useMutation({
    mutationFn: changeClientUnitListing,
    onSuccess: () => {
      invalidateClientProfile()
      setChangeUnit(null)
      setChangeUnitData(defaultChangeUnitData)
      setChangeListingSearch("")
      setSuccessMessage("Client unit changed successfully")
    },
  })

  const cancelUnitMutation = useMutation({
    mutationFn: cancelClientUnit,
    onSuccess: () => {
      invalidateClientProfile()
      setCancelUnit(null)
      setCancelUnitData(defaultCancelUnitData)
      setSuccessMessage("Client unit cancelled successfully")
    },
  })

  const deleteUnitMutation = useMutation({
    mutationFn: deleteClientUnit,
    onSuccess: () => {
      invalidateClientProfile()
      setDeleteUnit(null)
      setSuccessMessage("Client unit deleted successfully")
    },
  })

  const updateDocumentMutation = useMutation({
    mutationFn: updateClientDocumentStatus,
    onSuccess: () => {
      invalidateClientProfile()
      setSuccessMessage("Document checklist updated successfully")
    },
  })

  const createChecklistMutation = useMutation({
    mutationFn: createDocumentChecklist,
    onSuccess: () => {
      invalidateClientProfile()
      setSuccessMessage("Document checklist created successfully")
    },
  })

  const applyReusableMutation = useMutation({
    mutationFn: applyExistingReusableDocuments,
    onSuccess: () => {
      invalidateClientProfile()
      setSuccessMessage("Reusable documents applied successfully")
    },
  })

  const selectedMainSeller = sellers.find(
    (seller) => Number(seller.id) === Number(reserveData.seller_id)
  )

  const selectedOverrideSeller = sellers.find(
    (seller) => Number(seller.id) === Number(reserveData.override_seller_id)
  )

  const selectedListing = availableListings.find(
    (listing) => Number(listing.id) === Number(reserveData.listing_id)
  )

  const reservePurchasePrice = selectedListing
    ? Number(selectedListing.total_contract_price || 0)
    : 0
  const reserveReservationFee = moneyInputValue(
    reserveData.reservation_fee_amount
  )
  const reserveDownpayment =
    reserveData.mode_of_payment === "installment"
      ? moneyInputValue(reserveData.downpayment_amount)
      : 0
  const reserveDeferredCash =
    reserveData.mode_of_payment === "cash"
      ? moneyInputValue(reserveData.deferred_cash_amount)
      : 0
  const reserveBalanceRaw =
    reservePurchasePrice -
    reserveReservationFee -
    reserveDownpayment -
    reserveDeferredCash
  const reserveOfferBalance = Math.max(reserveBalanceRaw, 0)
  const reserveTermsMonths =
    reserveData.mode_of_payment === "installment"
      ? Number(reserveData.payment_terms_months || 0)
      : 0
  const reserveInterestRate = moneyInputValue(reserveData.interest_rate)
  const reserveBalanceWithInterest =
    reserveOfferBalance + reserveOfferBalance * (reserveInterestRate / 100)
  const computedMonthlyAmortization =
    reserveData.mode_of_payment === "installment" && reserveTermsMonths > 0
      ? reserveBalanceWithInterest / reserveTermsMonths
      : 0
  const displayedMonthlyAmortization =
    reserveData.monthly_amortization ||
    (computedMonthlyAmortization > 0
      ? computedMonthlyAmortization.toFixed(2)
      : "")

  const filteredReserveListings = availableListings.filter((listing) => {
    const search = listingSearch.toLowerCase().trim()

    if (!search || Number(listing.id) === Number(reserveData.listing_id)) {
      return true
    }

    return [
      listing.unit_id,
      listing.project_name,
      listing.project_location,
      listing.lot_type,
      listing.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search)
  })

  const filteredChangeListings = availableListings.filter((listing) => {
    const search = changeListingSearch.toLowerCase().trim()

    if (!search || Number(listing.id) === Number(changeUnitData.new_listing_id)) {
      return true
    }

    return [
      listing.unit_id,
      listing.project_name,
      listing.project_location,
      listing.lot_type,
      listing.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search)
  })

  const submittedDocumentCount = useMemo(() => {
    return clientDocuments.filter((document) => isSubmitted(document.status)).length
  }, [clientDocuments])

  const requiredDocumentCount = useMemo(() => {
    return clientDocuments.filter((document) => isRequired(document.is_required)).length
  }, [clientDocuments])

  const submittedRequiredDocumentCount = useMemo(() => {
    return clientDocuments.filter(
      (document) =>
        isRequired(document.is_required) && isSubmitted(document.status)
    ).length
  }, [clientDocuments])

  const totals = useMemo(() => {
    return clientUnits.reduce(
      (summary, unit) => {
        summary.totalContractPrice += Number(unit.total_contract_price || 0)
        summary.totalPaid += Number(unit.paid_amount || 0)
        summary.totalBalance += Number(unit.balance || 0)
        summary.totalCommission += Number(unit.gross_commission_total || 0)

        return summary
      },
      {
        totalContractPrice: 0,
        totalPaid: 0,
        totalBalance: 0,
        totalCommission: 0,
      }
    )
  }, [clientUnits])

  const activeCoBuyerData = coBuyerData[0] || emptyCoBuyerData()
  const showCoBuyerProfile = principalProfileData.buyer_type !== "single"
  const currentProfileStatus: ProfileStatus =
    client?.profile_status === "complete" ? "complete" : "incomplete"
  const isSavingBuyerProfile =
    saveBuyerProfileMutation.isPending ||
    markBuyerProfileCompleteMutation.isPending

  const getReserveValidationMessage = () => {
    if (!reserveData.listing_id || !selectedListing) {
      return "Listing is required"
    }

    if (!reserveData.mode_of_payment) {
      return "Mode of payment is required"
    }

    if (!reserveData.starting_date) {
      return "Starting date is required"
    }

    if (!reserveData.due_date) {
      return "First due date is required"
    }

    if (
      reserveData.reservation_fee_amount === "" ||
      !isPresentMoneyInputValid(reserveData.reservation_fee_amount)
    ) {
      return "Reservation fee must be a non-negative amount"
    }

    if (
      reserveData.mode_of_payment === "cash" &&
      !isPresentMoneyInputValid(reserveData.deferred_cash_amount)
    ) {
      return "Deferred cash amount must be a non-negative amount"
    }

    if (reserveData.mode_of_payment === "installment") {
      if (![36, 60].includes(Number(reserveData.payment_terms_months))) {
        return "Payment terms must be 36 or 60 months"
      }

      if (!isPresentMoneyInputValid(reserveData.downpayment_amount)) {
        return "Downpayment must be a non-negative amount"
      }

      if (!isPresentMoneyInputValid(reserveData.interest_rate)) {
        return "Interest rate must be a non-negative percentage"
      }

      if (!isPresentMoneyInputValid(reserveData.monthly_amortization)) {
        return "Monthly amortization must be a non-negative amount"
      }
    }

    if (reserveBalanceRaw < 0) {
      return "Reservation fee, downpayment, and deferred cash cannot exceed TCP"
    }

    return ""
  }

  const openReserveModal = () => {
    setReserveData({
      ...createDefaultReserveData(),
      seller_id: client?.default_seller_id || "",
    })
    setListingSearch("")
    setSuccessMessage("")
    setReserveValidationMessage("")
    setIsReserveOpen(true)
  }

  const openEditUnitModal = (unit: ClientUnit) => {
    setEditUnit(unit)
    setEditUnitData({
      seller_id: unit.seller_id ? String(unit.seller_id) : "",
      due_day: unit.due_day ? String(unit.due_day) : "",
      status: unit.status || "reserved",
      mode_of_payment:
        unit.mode_of_payment === "cash" ? "cash" : "installment",
      regenerate_commission: false,
      sale_type: unit.sale_type === "direct" ? "direct" : "distributed",
      override_seller_id: "",
      override_rate: "",
      override_notes: "",
    })
  }

  const openChangeUnitModal = (unit: ClientUnit) => {
    setChangeUnit(unit)
    setChangeUnitData({
      ...defaultChangeUnitData,
      status: unit.status === "active" ? "active" : "reserved",
    })
    setChangeListingSearch("")
    setSuccessMessage("")
  }

  const openCancelUnitModal = (unit: ClientUnit) => {
    setCancelUnit(unit)
    setCancelUnitData(defaultCancelUnitData)
    setSuccessMessage("")
  }

  const openDeleteUnitModal = (unit: ClientUnit) => {
    setDeleteUnit(unit)
    setSuccessMessage("")
  }

  const openDocumentsModal = (unit: ClientUnit) => {
    setSelectedDocumentsUnit(unit)
    setSuccessMessage("")
  }

  const handleReserveListing = () => {
    if (!clientId || !reserveData.listing_id) return

    const validationMessage = getReserveValidationMessage()

    if (validationMessage) {
      setReserveValidationMessage(validationMessage)
      return
    }

    setReserveValidationMessage("")

    reserveMutation.mutate({
      clientId,
      reserveData,
    })
  }

  const handleSaveBuyerProfile = () => {
    if (!clientId) return

    saveBuyerProfileMutation.mutate({
      clientId,
      profileData: principalProfileData,
      coBuyerData,
      principalEmploymentData,
      coBuyerEmploymentData,
    })
  }

  const handleMarkBuyerProfileComplete = () => {
    if (!clientId) return

    markBuyerProfileCompleteMutation.mutate({
      clientId,
      profileData: principalProfileData,
      coBuyerData,
      principalEmploymentData,
      coBuyerEmploymentData,
      markComplete: true,
    })
  }

  const handleUpdateUnit = () => {
    if (!editUnit) return

    updateUnitMutation.mutate({
      clientUnitId: editUnit.id,
      unitData: editUnitData,
    })
  }

  const handleChangeUnit = () => {
    if (!changeUnit || !changeUnitData.new_listing_id) return

    changeUnitMutation.mutate({
      clientUnitId: changeUnit.id,
      changeData: changeUnitData,
    })
  }

  const handleCancelUnit = () => {
    if (!cancelUnit) return

    cancelUnitMutation.mutate({
      clientUnitId: cancelUnit.id,
      cancelData: cancelUnitData,
    })
  }

  const handleDeleteUnit = () => {
    if (!deleteUnit) return

    deleteUnitMutation.mutate(deleteUnit.id)
  }

  const handleDocumentStatusChange = (
    document: ClientDocument,
    status: string
  ) => {
    updateDocumentMutation.mutate({
      clientDocumentId: document.id,
      status,
    })
  }

  if (isClientLoading || areUnitsLoading) {
    return <LoadingState label="Loading client profile..." />
  }

  if (clientError || unitsError || !client) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Failed to load client profile" />
        <Button icon={<FiArrowLeft />} onClick={() => navigate("/clients")}>
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiUser />}
        title={client.full_name}
        subtitle="Client profile, reserved units, payments, documents, and commission setup"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<FiArrowLeft />} onClick={() => navigate("/clients")}>
              Back
            </Button>
            <Button icon={<FiPlus />} onClick={openReserveModal} variant="primary">
              Reserve Listing
            </Button>
          </div>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}

      {reserveMutation.error ? (
        <Alert
          variant="error"
          title={
            reserveMutation.error instanceof Error
              ? reserveMutation.error.message
              : "Failed to reserve listing"
          }
        />
      ) : null}

      {saveBuyerProfileMutation.error ? (
        <Alert
          variant="error"
          title={
            saveBuyerProfileMutation.error instanceof Error
              ? saveBuyerProfileMutation.error.message
              : "Failed to save buyer profile"
          }
        />
      ) : null}

      {markBuyerProfileCompleteMutation.error ? (
        <Alert
          variant="error"
          title={
            markBuyerProfileCompleteMutation.error instanceof Error
              ? markBuyerProfileCompleteMutation.error.message
              : "Failed to mark buyer profile complete"
          }
        />
      ) : null}

      {updateUnitMutation.error ? (
        <Alert
          variant="error"
          title={
            updateUnitMutation.error instanceof Error
              ? updateUnitMutation.error.message
              : "Failed to update unit"
          }
        />
      ) : null}

      {changeUnitMutation.error ? (
        <Alert
          variant="error"
          title={
            changeUnitMutation.error instanceof Error
              ? changeUnitMutation.error.message
              : "Failed to change unit"
          }
        />
      ) : null}

      {cancelUnitMutation.error ? (
        <Alert
          variant="error"
          title={
            cancelUnitMutation.error instanceof Error
              ? cancelUnitMutation.error.message
              : "Failed to cancel unit"
          }
        />
      ) : null}

      {deleteUnitMutation.error ? (
        <Alert
          variant="error"
          title={
            deleteUnitMutation.error instanceof Error
              ? deleteUnitMutation.error.message
              : "Failed to delete unit"
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Contract Price"
          value={formatMoney(totals.totalContractPrice)}
          icon={<FiHome />}
        />
        <StatCard
          title="Total Paid"
          value={formatMoney(totals.totalPaid)}
          icon={<FiFileText />}
        />
        <StatCard
          title="Balance"
          value={formatMoney(totals.totalBalance)}
          icon={<FiFileText />}
        />
        <StatCard
          title="Gross Commission"
          value={formatMoney(totals.totalCommission)}
          icon={<FiUser />}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Client Details</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Detail label="Buyer Name" value={client.full_name} />
          <Detail label="Spouse / Co-owner" value={client.spouse_co_owner_name} />
          <Detail label="Email" value={client.email} />
          <Detail label="Contact No." value={client.contact_no} />
          <Detail label="Address" value={client.address} />
          <Detail label="Region" value={client.region} />
          <Detail label="Default Seller" value={client.default_seller_name} />
          <Detail
            label="Seller Role"
            value={
              client.default_seller_role
                ? formatText(client.default_seller_role)
                : "-"
            }
          />
          <Detail
            label="Seller Rate"
            value={
              client.default_seller_commission_rate
                ? `${formatNumber(client.default_seller_commission_rate)}%`
                : "-"
            }
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Buyer Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Offer to Buy and buyer profile source data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={currentProfileStatus} />
            <Button
              disabled={isSavingBuyerProfile}
              onClick={handleSaveBuyerProfile}
              variant="secondary"
            >
              {saveBuyerProfileMutation.isPending ? "Saving..." : "Save Buyer Profile"}
            </Button>
            <Button
              disabled={isSavingBuyerProfile}
              onClick={handleMarkBuyerProfileComplete}
              variant="primary"
            >
              {markBuyerProfileCompleteMutation.isPending
                ? "Checking..."
                : "Mark Profile Complete"}
            </Button>
          </div>
        </div>

        {currentProfileStatus === "incomplete" &&
        profileCompletion.missingFields.length > 0 ? (
          <div className="mt-4">
            <Alert
              variant="warning"
              title={`Missing: ${profileCompletion.missingFields.join(", ")}`}
            />
          </div>
        ) : null}

        <div className="mt-5 space-y-5">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Principal Buyer
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Select
                label="Buyer Type"
                value={principalProfileData.buyer_type}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    buyer_type: e.target.value as BuyerType,
                  })
                }
              >
                {buyerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Full Name"
                value={principalProfileData.full_name}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    full_name: e.target.value,
                  })
                }
              />

              <Input
                label="Birth Date"
                type="date"
                value={principalProfileData.birth_date}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    birth_date: e.target.value,
                  })
                }
              />

              <MiniDetail
                label="Computed Age"
                value={calculateAge(principalProfileData.birth_date)}
              />

              <Input
                label="Place of Birth"
                value={principalProfileData.place_of_birth}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    place_of_birth: e.target.value,
                  })
                }
              />

              <Input
                label="Citizenship"
                value={principalProfileData.citizenship}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    citizenship: e.target.value,
                  })
                }
              />

              <Select
                label="Gender"
                value={principalProfileData.gender}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    gender: e.target.value as Gender | "",
                  })
                }
              >
                <option value="">Select gender</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Civil Status"
                value={principalProfileData.civil_status}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    civil_status: e.target.value as CivilStatus | "",
                  })
                }
              >
                <option value="">Select civil status</option>
                {civilStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Mobile Number / Contact Number"
                value={principalProfileData.contact_no}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    contact_no: e.target.value,
                  })
                }
              />

              <Input
                label="Residence Phone Number"
                value={principalProfileData.residence_phone_no}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    residence_phone_no: e.target.value,
                  })
                }
              />

              <Input
                label="Email"
                type="email"
                value={principalProfileData.email}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    email: e.target.value,
                  })
                }
              />

              <Input
                label="TIN"
                value={principalProfileData.tin}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    tin: e.target.value,
                  })
                }
              />

              <Input
                label="Present Address"
                value={principalProfileData.present_address}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    present_address: e.target.value,
                  })
                }
              />

              <Input
                label="Present ZIP Code"
                value={principalProfileData.present_zip_code}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    present_zip_code: e.target.value,
                  })
                }
              />

              <Input
                label="Permanent Address"
                value={principalProfileData.permanent_address}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    permanent_address: e.target.value,
                  })
                }
              />

              <Input
                label="Permanent ZIP Code"
                value={principalProfileData.permanent_zip_code}
                onChange={(e) =>
                  setPrincipalProfileData({
                    ...principalProfileData,
                    permanent_zip_code: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {showCoBuyerProfile ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Spouse / Second Buyer
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Select
                  label="Buyer Role"
                  value={activeCoBuyerData.buyer_role}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        buyer_role: e.target.value as BuyerRole,
                      },
                    ])
                  }
                >
                  <option value="spouse">Spouse</option>
                  <option value="second_buyer">Second Buyer</option>
                </Select>

                <Input
                  label="Full Name"
                  value={activeCoBuyerData.full_name}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        full_name: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Birth Date"
                  type="date"
                  value={activeCoBuyerData.birth_date}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        birth_date: e.target.value,
                      },
                    ])
                  }
                />

                <MiniDetail
                  label="Computed Age"
                  value={calculateAge(activeCoBuyerData.birth_date)}
                />

                <Input
                  label="Place of Birth"
                  value={activeCoBuyerData.place_of_birth}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        place_of_birth: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Citizenship"
                  value={activeCoBuyerData.citizenship}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        citizenship: e.target.value,
                      },
                    ])
                  }
                />

                <Select
                  label="Gender"
                  value={activeCoBuyerData.gender}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        gender: e.target.value as Gender | "",
                      },
                    ])
                  }
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Civil Status"
                  value={activeCoBuyerData.civil_status}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        civil_status: e.target.value as CivilStatus | "",
                      },
                    ])
                  }
                >
                  <option value="">Select civil status</option>
                  {civilStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Mobile Number"
                  value={activeCoBuyerData.mobile_no}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        mobile_no: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Residence Phone Number"
                  value={activeCoBuyerData.residence_phone_no}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        residence_phone_no: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  value={activeCoBuyerData.email}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        email: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="TIN"
                  value={activeCoBuyerData.tin}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        tin: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Present Address"
                  value={activeCoBuyerData.present_address}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        present_address: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Present ZIP Code"
                  value={activeCoBuyerData.present_zip_code}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        present_zip_code: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Permanent Address"
                  value={activeCoBuyerData.permanent_address}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        permanent_address: e.target.value,
                      },
                    ])
                  }
                />

                <Input
                  label="Permanent ZIP Code"
                  value={activeCoBuyerData.permanent_zip_code}
                  onChange={(e) =>
                    setCoBuyerData([
                      {
                        ...activeCoBuyerData,
                        permanent_zip_code: e.target.value,
                      },
                    ])
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Work / Business Information
            </h3>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <EmploymentFields
                data={principalEmploymentData}
                onChange={setPrincipalEmploymentData}
                title="Principal Buyer"
              />

              {showCoBuyerProfile ? (
                <EmploymentFields
                  data={coBuyerEmploymentData}
                  onChange={setCoBuyerEmploymentData}
                  title="Spouse / Second Buyer"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Client Units</h2>
        </div>

        {clientUnits.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <EmptyState
              title="No reserved units"
              description="Reserve a listing for this client."
              action={
                <Button icon={<FiPlus />} onClick={openReserveModal} variant="primary">
                  Reserve Listing
                </Button>
              }
            />
          </div>
        ) : (
          <TableContainer>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">TCP</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Payment %</th>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Sale Type</th>
                  <th className="px-4 py-3 text-left">Starting Date</th>
                  <th className="px-4 py-3 text-left">First Due Date</th>
                  <th className="px-4 py-3 text-left">Terms</th>
                  <th className="px-4 py-3 text-left">Monthly</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {clientUnits.map((unit) => {
                  const documentSummary = getUnitDocumentSummary(unit)

                  return (
                    <tr key={unit.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{unit.unit_id}</p>
                      <p className="text-xs text-slate-500">
                        {unit.lot_type || "-"} · {formatNumber(unit.lot_area_sqm)} sqm
                      </p>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {unit.project_name}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(unit.total_contract_price)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(unit.paid_amount)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(unit.balance)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(unit.payment_percentage || 0)}%
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {unit.seller_name || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {unit.seller_role ? formatText(unit.seller_role) : "-"}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatText(unit.sale_type || "distributed")}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(unit.starting_date)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(unit.due_date)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {unit.mode_of_payment === "cash"
                        ? "Cash"
                        : unit.payment_terms_months
                          ? `${formatNumber(unit.payment_terms_months)} months`
                          : "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {unit.mode_of_payment === "cash"
                        ? "-"
                        : unit.monthly_amortization !== null &&
                            unit.monthly_amortization !== undefined
                          ? formatMoney(unit.monthly_amortization)
                          : "-"}
                    </td>

                    <td className="min-w-56 px-4 py-3">
                      <button
                        className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        onClick={() => openDocumentsModal(unit)}
                        type="button"
                      >
                        <span className="flex items-start gap-2">
                          <FiFileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-blue-700">
                              Open Checklist
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold text-slate-700">
                              {documentSummary.progressLabel}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {documentSummary.requiredLabel}
                            </span>
                            <span className="mt-2 block">
                              <StatusBadge
                                status={unit.document_status || "incomplete"}
                              />
                            </span>
                          </span>
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={unit.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          icon={<FiPrinter />}
                          onClick={() =>
                            window.open(
                              `/client/${clientId}/units/${unit.id}/offer-to-buy/print`,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          Offer to Buy
                        </Button>
                        <Button
                          icon={<FiPrinter />}
                          onClick={() =>
                            window.open(
                              `/client/${clientId}/units/${unit.id}/statement-of-account/print`,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          SOA
                        </Button>
                        <Button
                          icon={<FiEdit2 />}
                          onClick={() => openEditUnitModal(unit)}
                        >
                          Edit
                        </Button>
                        <Button onClick={() => openChangeUnitModal(unit)}>
                          Change Unit
                        </Button>
                        <Button
                          onClick={() => openCancelUnitModal(unit)}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => openDeleteUnitModal(unit)}
                          variant="danger"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableContainer>
        )}
      </div>

      {isReserveOpen ? (
        <Modal
          title="Reserve Listing"
          onClose={() => setIsReserveOpen(false)}
          size="xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsReserveOpen(false)}>Cancel</Button>
              <Button
                disabled={reserveMutation.isPending || !reserveData.listing_id}
                onClick={handleReserveListing}
                variant="primary"
              >
                {reserveMutation.isPending ? "Saving..." : "Reserve Listing"}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {reserveValidationMessage ? (
              <Alert variant="error" title={reserveValidationMessage} />
            ) : null}

            <div className="space-y-2">
              <Input
                label="Search Available Listing"
                value={listingSearch}
                onChange={(e) => {
                  setListingSearch(e.target.value)
                  setReserveData({
                    ...reserveData,
                    listing_id: "",
                    reservation_fee_amount: "",
                    monthly_amortization: "",
                  })
                  setReserveValidationMessage("")
                }}
                placeholder="Search unit, project, or lot type"
              />

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredReserveListings.length > 0 ? (
                  filteredReserveListings.map((listing) => {
                    const isSelected =
                      Number(reserveData.listing_id) === Number(listing.id)
                    const label = `${listing.unit_id} - ${listing.project_name} - ${formatMoney(listing.total_contract_price)}`

                    return (
                      <button
                        className={[
                          "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50",
                          isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700",
                        ].join(" ")}
                        key={listing.id}
                        onClick={() => {
                          setReserveData({
                            ...reserveData,
                            listing_id: listing.id,
                            reservation_fee_amount: String(
                              Number(listing.reservation_fee || 0)
                            ),
                            monthly_amortization: "",
                          })
                          setReserveValidationMessage("")
                          setListingSearch(label)
                        }}
                        type="button"
                      >
                        <span className="font-semibold">{listing.unit_id}</span>
                        <span className="text-slate-500">
                          {" "}
                          · {listing.project_name} ·{" "}
                          {formatMoney(listing.total_contract_price)}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-500">
                    No available listing found.
                  </p>
                )}
              </div>
            </div>

            {selectedListing ? (
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                <MiniDetail label="Unit ID" value={selectedListing.unit_id} />
                <MiniDetail label="Project" value={selectedListing.project_name} />
                <MiniDetail
                  label="Area"
                  value={`${formatNumber(selectedListing.lot_area_sqm)} sqm`}
                />
                <MiniDetail
                  label="TCP"
                  value={formatMoney(selectedListing.total_contract_price)}
                />
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Assigned Seller / Unit Manager"
                value={reserveData.seller_id}
                onChange={(e) =>
                  setReserveData({
                    ...reserveData,
                    seller_id: e.target.value ? Number(e.target.value) : "",
                  })
                }
              >
                <option value="">No seller selected</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.full_name} - {formatText(seller.seller_role)}
                  </option>
                ))}
              </Select>

              <Select
                label="Mode of Payment"
                value={reserveData.mode_of_payment}
                onChange={(e) => {
                  const paymentMode = e.target.value as "cash" | "installment"

                  setReserveData({
                    ...reserveData,
                    mode_of_payment: paymentMode,
                    downpayment_amount:
                      paymentMode === "installment"
                        ? reserveData.downpayment_amount
                        : "0",
                    deferred_cash_amount:
                      paymentMode === "cash"
                        ? reserveData.deferred_cash_amount
                        : "0",
                    payment_terms_months:
                      paymentMode === "installment"
                        ? reserveData.payment_terms_months || 36
                        : "",
                    interest_rate:
                      paymentMode === "installment"
                        ? reserveData.interest_rate || "0"
                        : "0",
                    monthly_amortization: "",
                  })
                  setReserveValidationMessage("")
                }}
              >
                <option value="installment">Installment</option>
                <option value="cash">Cash</option>
              </Select>

              <Select
                label="Status"
                value={reserveData.status}
                onChange={(e) =>
                  setReserveData({
                    ...reserveData,
                    status: e.target.value,
                  })
                }
              >
                <option value="reserved">Reserved</option>
                <option value="active">Active</option>
              </Select>

              <Select
                label="Sale Type"
                value={reserveData.sale_type}
                onChange={(e) => {
                  const saleType = e.target.value as "distributed" | "direct"

                  setReserveData({
                    ...reserveData,
                    sale_type: saleType,
                    override_seller_id:
                      saleType === "direct" ? "" : reserveData.override_seller_id,
                    override_rate:
                      saleType === "direct" ? "" : reserveData.override_rate,
                    override_notes:
                      saleType === "direct" ? "" : reserveData.override_notes,
                  })
                }}
              >
                <option value="distributed">Distributed</option>
                <option value="direct">Direct</option>
              </Select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">
                Payment Terms
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  label="Reservation Fee"
                  type="number"
                  min={0}
                  step="0.01"
                  value={reserveData.reservation_fee_amount}
                  onChange={(e) => {
                    setReserveData({
                      ...reserveData,
                      reservation_fee_amount: e.target.value,
                      monthly_amortization: "",
                    })
                    setReserveValidationMessage("")
                  }}
                />

                <Input
                  label="Starting Date"
                  type="date"
                  value={reserveData.starting_date}
                  onChange={(e) => {
                    setReserveData({
                      ...reserveData,
                      starting_date: e.target.value,
                    })
                    setReserveValidationMessage("")
                  }}
                />

                <Input
                  label="First Due Date"
                  type="date"
                  value={reserveData.due_date}
                  onChange={(e) => {
                    setReserveData({
                      ...reserveData,
                      due_date: e.target.value,
                    })
                    setReserveValidationMessage("")
                  }}
                />

                {reserveData.mode_of_payment === "cash" ? (
                  <Input
                    label="Deferred Cash Amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={reserveData.deferred_cash_amount}
                    onChange={(e) => {
                      setReserveData({
                        ...reserveData,
                        deferred_cash_amount: e.target.value,
                        monthly_amortization: "",
                      })
                      setReserveValidationMessage("")
                    }}
                  />
                ) : null}

                {reserveData.mode_of_payment === "installment" ? (
                  <>
                    <Input
                      label="Downpayment"
                      type="number"
                      min={0}
                      step="0.01"
                      value={reserveData.downpayment_amount}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          downpayment_amount: e.target.value,
                          monthly_amortization: "",
                        })
                        setReserveValidationMessage("")
                      }}
                    />

                    <Select
                      label="Terms"
                      value={reserveData.payment_terms_months}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          payment_terms_months: Number(e.target.value) as 36 | 60,
                          monthly_amortization: "",
                        })
                        setReserveValidationMessage("")
                      }}
                    >
                      <option value={36}>36 months</option>
                      <option value={60}>60 months</option>
                    </Select>

                    <Input
                      label="Interest Rate (%)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={reserveData.interest_rate}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          interest_rate: e.target.value,
                          monthly_amortization: "",
                        })
                        setReserveValidationMessage("")
                      }}
                    />

                    <Input
                      label="Monthly Amortization"
                      type="number"
                      min={0}
                      step="0.01"
                      value={displayedMonthlyAmortization}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          monthly_amortization: e.target.value,
                        })
                        setReserveValidationMessage("")
                      }}
                    />
                  </>
                ) : null}
              </div>

              {selectedListing ? (
                <div className="mt-4 grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-3">
                  <MiniDetail
                    label="Offer Purchase Price"
                    value={formatMoney(reservePurchasePrice)}
                  />
                  <MiniDetail
                    label="Offer Balance"
                    value={formatMoney(reserveOfferBalance)}
                  />
                  <MiniDetail
                    label="Monthly Preview"
                    value={
                      reserveData.mode_of_payment === "installment"
                        ? formatMoney(computedMonthlyAmortization)
                        : "-"
                    }
                  />
                </div>
              ) : null}
            </div>

            {selectedMainSeller ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Main Seller Commission
                </h3>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <MiniDetail label="Seller" value={selectedMainSeller.full_name} />
                  <MiniDetail
                    label="Role"
                    value={formatText(selectedMainSeller.seller_role)}
                  />
                  <MiniDetail
                    label="Rate"
                    value={
                      selectedMainSeller.commission_rate
                        ? `${formatNumber(selectedMainSeller.commission_rate)}%`
                        : "-"
                    }
                  />
                </div>
              </div>
            ) : null}

            {reserveData.sale_type === "distributed" ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Optional Agent / Override Commission
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Use this if another seller or agent should receive a separate
                  commission for this unit.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Select
                    label="Optional Agent / Override Seller"
                    value={reserveData.override_seller_id}
                    onChange={(e) =>
                      setReserveData({
                        ...reserveData,
                        override_seller_id: e.target.value
                          ? Number(e.target.value)
                          : "",
                      })
                    }
                  >
                    <option value="">No override seller</option>
                    {sellers
                      .filter((seller) => Number(seller.id) !== Number(reserveData.seller_id))
                      .map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.full_name} - {formatText(seller.seller_role)}
                        </option>
                      ))}
                  </Select>

                  <Input
                    label="Override Rate (%)"
                    type="number"
                    min={0}
                    step="0.01"
                    value={reserveData.override_rate}
                    onChange={(e) =>
                      setReserveData({
                        ...reserveData,
                        override_rate: e.target.value,
                      })
                    }
                    placeholder="Example: 2"
                  />

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Override Notes
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={reserveData.override_notes}
                      onChange={(e) =>
                        setReserveData({
                          ...reserveData,
                          override_notes: e.target.value,
                        })
                      }
                      placeholder="Reason for override commission"
                    />
                  </label>
                </div>

                {selectedOverrideSeller ? (
                  <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Selected Override Seller
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedOverrideSeller.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatText(selectedOverrideSeller.seller_role)}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {reserveData.mode_of_payment === "cash" ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Cash Kaliwaan
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="Cash Kaliwaan Amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={reserveData.cash_kaliwaan_amount}
                    onChange={(e) =>
                      setReserveData({
                        ...reserveData,
                        cash_kaliwaan_amount: e.target.value,
                      })
                    }
                  />

                  <Input
                    label="Cash Kaliwaan Date"
                    type="date"
                    value={reserveData.cash_kaliwaan_date}
                    onChange={(e) =>
                      setReserveData({
                        ...reserveData,
                        cash_kaliwaan_date: e.target.value,
                      })
                    }
                  />

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Notes
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={reserveData.cash_kaliwaan_notes}
                      onChange={(e) =>
                        setReserveData({
                          ...reserveData,
                          cash_kaliwaan_notes: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {editUnit ? (
        <Modal
          title={`Edit Unit - ${editUnit.unit_id}`}
          onClose={() => setEditUnit(null)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditUnit(null)}>Cancel</Button>
              <Button
                disabled={updateUnitMutation.isPending}
                onClick={handleUpdateUnit}
                variant="primary"
              >
                {updateUnitMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Assigned Seller / Unit Manager"
              value={editUnitData.seller_id}
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  seller_id: e.target.value,
                })
              }
            >
              <option value="">No seller selected</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.full_name} - {formatText(seller.seller_role)}
                </option>
              ))}
            </Select>

            <Select
              label="Mode of Payment"
              value={editUnitData.mode_of_payment}
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  mode_of_payment: e.target.value as "cash" | "installment",
                })
              }
            >
              <option value="installment">Installment</option>
              <option value="cash">Cash</option>
            </Select>

            <Input
              label="Due Day"
              type="number"
              min={1}
              max={31}
              value={editUnitData.due_day}
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  due_day: e.target.value,
                })
              }
            />

            <Select
              label="Status"
              value={editUnitData.status}
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  status: e.target.value,
                })
              }
            >
              <option value="reserved">Reserved</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="fully_paid">Fully Paid</option>
              <option value="closed">Closed</option>
            </Select>

            <Select
              label="Sale Type"
              value={editUnitData.sale_type}
              onChange={(e) => {
                const saleType = e.target.value as "distributed" | "direct"

                setEditUnitData({
                  ...editUnitData,
                  sale_type: saleType,
                  override_seller_id:
                    saleType === "direct" ? "" : editUnitData.override_seller_id,
                  override_rate:
                    saleType === "direct" ? "" : editUnitData.override_rate,
                  override_notes:
                    saleType === "direct" ? "" : editUnitData.override_notes,
                })
              }}
            >
              <option value="distributed">Distributed</option>
              <option value="direct">Direct</option>
            </Select>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editUnitData.regenerate_commission}
                onChange={(e) =>
                  setEditUnitData({
                    ...editUnitData,
                    regenerate_commission: e.target.checked,
                  })
                }
              />
              Regenerate commission
            </label>
          </div>

          {editUnitData.sale_type === "distributed" ? (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Optional Agent / Override Commission
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                Use this only when the commission should be assigned to another seller or agent.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Select
                  label="Optional Agent / Override Seller"
                  value={editUnitData.override_seller_id}
                  onChange={(e) =>
                    setEditUnitData({
                      ...editUnitData,
                      override_seller_id: e.target.value,
                    })
                  }
                >
                  <option value="">No override seller</option>
                  {sellers
                    .filter((seller) => String(seller.id) !== editUnitData.seller_id)
                    .map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.full_name} - {formatText(seller.seller_role)}
                      </option>
                    ))}
                </Select>

                <Input
                  label="Override Rate (%)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editUnitData.override_rate}
                  onChange={(e) =>
                    setEditUnitData({
                      ...editUnitData,
                      override_rate: e.target.value,
                    })
                  }
                  placeholder="Example: 2"
                />

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Override Notes
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={editUnitData.override_notes}
                    onChange={(e) =>
                      setEditUnitData({
                        ...editUnitData,
                        override_notes: e.target.value,
                      })
                    }
                    placeholder="Reason for override commission"
                  />
                </label>
              </div>
            </div>
          ) : null}

          <p className="mt-3 text-sm text-slate-500">
            Seller/rate cannot be changed if a commission release was already paid.
          </p>
        </Modal>
      ) : null}

      {changeUnit ? (
        <Modal
          title={`Change Unit - ${changeUnit.unit_id}`}
          onClose={() => setChangeUnit(null)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setChangeUnit(null)}>Cancel</Button>
              <Button
                disabled={changeUnitMutation.isPending || changeUnitData.new_listing_id === ""}
                onClick={handleChangeUnit}
                variant="primary"
              >
                {changeUnitMutation.isPending ? "Saving..." : "Change Unit"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert
              variant="warning"
              title="Use this when the same client changes to another available unit. Payments and document checklist stay on the account."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MiniDetail label="Current Unit" value={changeUnit.unit_id} />
              <MiniDetail label="Current Project" value={changeUnit.project_name} />
            </div>

            <div className="space-y-2">
              <Input
                label="New Available Listing"
                value={changeListingSearch}
                onChange={(e) => {
                  setChangeListingSearch(e.target.value)
                  setChangeUnitData({
                    ...changeUnitData,
                    new_listing_id: "",
                  })
                }}
                placeholder="Search unit, project, or lot type"
              />

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredChangeListings.length > 0 ? (
                  filteredChangeListings.map((listing) => {
                    const isSelected =
                      Number(changeUnitData.new_listing_id) === Number(listing.id)
                    const label = `${listing.unit_id} - ${listing.project_name} - ${formatMoney(listing.total_contract_price)}`

                    return (
                      <button
                        className={[
                          "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50",
                          isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700",
                        ].join(" ")}
                        key={listing.id}
                        onClick={() => {
                          setChangeUnitData({
                            ...changeUnitData,
                            new_listing_id: listing.id,
                          })
                          setChangeListingSearch(label)
                        }}
                        type="button"
                      >
                        <span className="font-semibold">{listing.unit_id}</span>
                        <span className="text-slate-500">
                          {" "}
                          · {listing.project_name} ·{" "}
                          {formatMoney(listing.total_contract_price)}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-500">
                    No available listing found.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="New Account Status"
                value={changeUnitData.status}
                onChange={(e) =>
                  setChangeUnitData({
                    ...changeUnitData,
                    status: e.target.value,
                  })
                }
              >
                <option value="reserved">Reserved</option>
                <option value="active">Active</option>
              </Select>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={changeUnitData.regenerate_commission}
                  onChange={(e) =>
                    setChangeUnitData({
                      ...changeUnitData,
                      regenerate_commission: e.target.checked,
                    })
                  }
                />
                Cancel old pending commissions and regenerate commission
              </label>
            </div>

            <Input
              label="Reason"
              value={changeUnitData.reason}
              onChange={(e) =>
                setChangeUnitData({
                  ...changeUnitData,
                  reason: e.target.value,
                })
              }
              placeholder="Example: Client requested transfer"
            />
          </div>
        </Modal>
      ) : null}

      {cancelUnit ? (
        <Modal
          title={`Cancel Unit - ${cancelUnit.unit_id}`}
          onClose={() => setCancelUnit(null)}
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCancelUnit(null)}>Close</Button>
              <Button
                disabled={cancelUnitMutation.isPending}
                onClick={handleCancelUnit}
                variant="danger"
              >
                {cancelUnitMutation.isPending ? "Cancelling..." : "Cancel Unit"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert
              variant="warning"
              title="Cancelling keeps payment history but cancels the active account and pending commissions."
            />

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={cancelUnitData.release_listing}
                onChange={(e) =>
                  setCancelUnitData({
                    ...cancelUnitData,
                    release_listing: e.target.checked,
                  })
                }
              />
              Return listing to available. Uncheck to keep it on hold.
            </label>

            <Input
              label="Reason"
              value={cancelUnitData.reason}
              onChange={(e) =>
                setCancelUnitData({
                  ...cancelUnitData,
                  reason: e.target.value,
                })
              }
              placeholder="Example: Client cancelled reservation"
            />
          </div>
        </Modal>
      ) : null}

      {deleteUnit ? (
        <Modal
          title={`Delete Unit - ${deleteUnit.unit_id}`}
          onClose={() => setDeleteUnit(null)}
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDeleteUnit(null)}>Close</Button>
              <Button
                disabled={deleteUnitMutation.isPending}
                onClick={handleDeleteUnit}
                variant="danger"
              >
                {deleteUnitMutation.isPending ? "Deleting..." : "Delete Unit"}
              </Button>
            </div>
          }
        >
          <Alert
            variant="error"
            title="Only wrong inputs with no payments, no commissions, and no submitted documents can be deleted. Otherwise, cancel it instead."
          />
        </Modal>
      ) : null}

      {selectedDocumentsUnit ? (
        <Modal
          title={`Document Checklist - ${selectedDocumentsUnit.unit_id}`}
          onClose={() => setSelectedDocumentsUnit(null)}
          size="xl"
          footer={
            <div className="flex justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  icon={<FiRefreshCw />}
                  disabled={createChecklistMutation.isPending}
                  onClick={() =>
                    createChecklistMutation.mutate(selectedDocumentsUnit.id)
                  }
                >
                  {clientDocuments.length === 0
                    ? "Generate Checklist"
                    : "Sync Checklist"}
                </Button>
                <Button
                  disabled={applyReusableMutation.isPending}
                  onClick={() =>
                    applyReusableMutation.mutate(selectedDocumentsUnit.id)
                  }
                >
                  Apply Reusable Docs
                </Button>
              </div>

              <Button onClick={() => setSelectedDocumentsUnit(null)}>
                Close
              </Button>
            </div>
          }
        >
          {areDocumentsLoading ? (
            <LoadingState label="Loading document checklist..." />
          ) : null}

          {documentsError ? (
            <Alert variant="error" title="Failed to load document checklist" />
          ) : null}

          {updateDocumentMutation.error ? (
            <Alert
              variant="error"
              title={
                updateDocumentMutation.error instanceof Error
                  ? updateDocumentMutation.error.message
                  : "Failed to update document status"
              }
            />
          ) : null}

          {!areDocumentsLoading && clientDocuments.length === 0 ? (
            <EmptyState
              title="No checklist found"
              description="Create a checklist for this client unit."
              action={
                <Button
                  icon={<FiRefreshCw />}
                  disabled={createChecklistMutation.isPending}
                  onClick={() =>
                    createChecklistMutation.mutate(selectedDocumentsUnit.id)
                  }
                  variant="primary"
                >
                  Generate Checklist
                </Button>
              }
            />
          ) : null}

          {clientDocuments.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MiniDetail
                  label="Submitted Docs"
                  value={`${submittedDocumentCount} / ${clientDocuments.length}`}
                />
                <MiniDetail
                  label="Required Submitted"
                  value={`${submittedRequiredDocumentCount} / ${requiredDocumentCount}`}
                />
                <MiniDetail
                  label="Checklist Status"
                  value={
                    requiredDocumentCount > 0 &&
                    submittedRequiredDocumentCount >= requiredDocumentCount
                      ? "Complete"
                      : "Incomplete"
                  }
                />
              </div>

              <TableContainer>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left">Document</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Reusable</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Submitted Date</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientDocuments.map((document) => {
                      const submittedDate =
                        document.status === "not_submitted"
                          ? null
                          : document.reviewed_at || document.updated_at

                      return (
                        <tr key={document.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {document.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {document.description || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                              isRequired(document.is_required)
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-600",
                            ].join(" ")}
                          >
                            {isRequired(document.is_required)
                              ? "Required"
                              : "Optional"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {isRequired(document.can_reuse) ? "Yes" : "No"}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={document.status} />
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {submittedDate ? formatDate(submittedDate) : "-"}
                        </td>

                        <td className="px-4 py-3">
                          <Select
                            aria-label={`Update ${document.name} status`}
                            disabled={updateDocumentMutation.isPending}
                            value={document.status}
                            onChange={(e) =>
                              handleDocumentStatusChange(
                                document,
                                e.target.value
                              )
                            }
                          >
                            {getDocumentStatusOptions(document.status).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableContainer>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}

const EmploymentFields = ({
  data,
  onChange,
  title,
}: {
  data: EmploymentFormData
  onChange: (data: EmploymentFormData) => void
  title: string
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Select
          label="Employment Status"
          value={data.employment_status}
          onChange={(e) =>
            onChange({
              ...data,
              employment_status: e.target.value as EmploymentStatus | "",
            })
          }
        >
          <option value="">Select status</option>
          {employmentStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Input
          label="Other Employment Status"
          value={data.employment_status_other}
          onChange={(e) =>
            onChange({
              ...data,
              employment_status_other: e.target.value,
            })
          }
        />

        <Input
          label="Employer / Business Name"
          value={data.employer_business_name}
          onChange={(e) =>
            onChange({
              ...data,
              employer_business_name: e.target.value,
            })
          }
        />

        <Input
          label="Employer ZIP Code"
          value={data.employer_zip_code}
          onChange={(e) =>
            onChange({
              ...data,
              employer_zip_code: e.target.value,
            })
          }
        />

        <Input
          label="Nature of Work / Business"
          value={data.nature_of_work_business}
          onChange={(e) =>
            onChange({
              ...data,
              nature_of_work_business: e.target.value,
            })
          }
        />

        <Input
          label="Occupation / Position / Title"
          value={data.occupation_position_title}
          onChange={(e) =>
            onChange({
              ...data,
              occupation_position_title: e.target.value,
            })
          }
        />

        <Input
          label="Monthly Income"
          min={0}
          step="0.01"
          type="number"
          value={data.monthly_income}
          onChange={(e) =>
            onChange({
              ...data,
              monthly_income: e.target.value,
            })
          }
        />

        <div className="md:col-span-2">
          <Input
            label="Employer / Business Address"
            value={data.employer_business_address}
            onChange={(e) =>
              onChange({
                ...data,
                employer_business_address: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

const Detail = ({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  )
}

const MiniDetail = ({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  )
}

export default ClientProfile
