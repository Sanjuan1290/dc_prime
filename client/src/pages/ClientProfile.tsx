import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit2,
  FiFileText,
  FiHome,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiUpload,
  FiDownload,
  FiUser,
} from "react-icons/fi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Select from "../components/ui/Select";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import TableContainer from "../components/ui/TableContainer";
import { API_URL, getErrorMessage } from "../utils/api";
import useCurrentUser from "../utils/useCurrentUser";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatText,
  getLocalDate,
} from "../utils/formatters";

type Client = {
  id: number;
  full_name: string;
  spouse_co_owner_name: string | null;
  buyer_type?: BuyerType | string | null;
  birth_date?: string | null;
  place_of_birth?: string | null;
  citizenship?: string | null;
  gender?: Gender | string | null;
  civil_status?: CivilStatus | string | null;
  email: string | null;
  contact_no: string | null;
  residence_phone_no?: string | null;
  tin?: string | null;
  address: string | null;
  present_address?: string | null;
  present_zip_code?: string | null;
  permanent_address?: string | null;
  permanent_zip_code?: string | null;
  region: string | null;
  profile_status?: ProfileStatus | string | null;
  default_seller_id?: number | null;
  default_seller_name?: string | null;
  default_seller_role?: string | null;
  default_seller_commission_rate?: number | string | null;
  created_at: string;
  updated_at: string;
};

type BuyerType = "single" | "spouses" | "and_account";
type ReserveFormulaKey =
  | "offer_purchase_price"
  | "dp_gross"
  | "dp_discount"
  | "net_dp_payable"
  | "per_give"
  | "offer_balance"
  | "monthly_preview";
type Gender = "male" | "female" | "other";
type CivilStatus =
  | "single"
  | "married"
  | "separated"
  | "annulled_divorced"
  | "widower";
type BuyerRole = "spouse" | "second_buyer";
type ProfileStatus = "incomplete" | "complete";
type PersonType = "principal" | "co_buyer";
type EmploymentStatus =
  | "employed_private"
  | "employed_government"
  | "employed_ngo"
  | "self_employed_business"
  | "self_employed_professional"
  | "ofw_immigrant"
  | "other";

type CoBuyer = {
  id: number;
  client_id: number;
  buyer_role: BuyerRole | string;
  full_name: string | null;
  birth_date: string | null;
  place_of_birth: string | null;
  citizenship: string | null;
  gender: Gender | string | null;
  civil_status: CivilStatus | string | null;
  present_address: string | null;
  present_zip_code: string | null;
  permanent_address: string | null;
  permanent_zip_code: string | null;
  mobile_no: string | null;
  residence_phone_no: string | null;
  email: string | null;
  tin: string | null;
};

type EmploymentDetail = {
  id: number;
  client_id: number;
  client_buyer_id: number | null;
  person_type: PersonType | string;
  employment_status: EmploymentStatus | string | null;
  employment_status_other: string | null;
  employer_business_name: string | null;
  employer_business_address: string | null;
  employer_zip_code: string | null;
  nature_of_work_business: string | null;
  occupation_position_title: string | null;
  monthly_income: number | string | null;
};

type ProfileCompletion = {
  isComplete: boolean;
  missingFields: string[];
};

type PrincipalProfileData = {
  buyer_type: BuyerType;
  full_name: string;
  birth_date: string;
  place_of_birth: string;
  citizenship: string;
  gender: Gender | "";
  civil_status: CivilStatus | "";
  present_address: string;
  present_zip_code: string;
  permanent_address: string;
  permanent_zip_code: string;
  contact_no: string;
  residence_phone_no: string;
  email: string;
  tin: string;
};

type CoBuyerFormData = {
  buyer_role: BuyerRole;
  full_name: string;
  birth_date: string;
  place_of_birth: string;
  citizenship: string;
  gender: Gender | "";
  civil_status: CivilStatus | "";
  present_address: string;
  present_zip_code: string;
  permanent_address: string;
  permanent_zip_code: string;
  mobile_no: string;
  residence_phone_no: string;
  email: string;
  tin: string;
};

type EmploymentFormData = {
  person_type: PersonType;
  client_buyer_id: number | null;
  employment_status: EmploymentStatus | "";
  employment_status_other: string;
  employer_business_name: string;
  employer_business_address: string;
  employer_zip_code: string;
  nature_of_work_business: string;
  occupation_position_title: string;
  monthly_income: string;
};

type ClientUnit = {
  id: number;
  client_id: number;
  client_name: string;
  listing_id: number;
  unit_id: string;
  project_name: string;
  lot_type: string | null;
  lot_area_sqm: number | string;
  price_per_sqm?: number | string;
  net_selling_price: number | string;
  legal_misc_rate?: number | string;
  legal_misc_fee: number | string;
  total_contract_price: number | string;
  paid_amount: number | string;
  balance: number | string;
  payment_percentage?: number | string;
  mode_of_payment?: string | null;
  buyer_type?: BuyerType | string | null;
  co_buyer_id?: number | string | null;
  co_buyer_role?: BuyerRole | string | null;
  co_buyer_name?: string | null;
  co_buyer_birth_date?: string | null;
  co_buyer_place_of_birth?: string | null;
  co_buyer_citizenship?: string | null;
  co_buyer_gender?: Gender | string | null;
  co_buyer_civil_status?: CivilStatus | string | null;
  co_buyer_present_address?: string | null;
  co_buyer_present_zip_code?: string | null;
  co_buyer_permanent_address?: string | null;
  co_buyer_permanent_zip_code?: string | null;
  co_buyer_mobile_no?: string | null;
  co_buyer_residence_phone_no?: string | null;
  co_buyer_email?: string | null;
  co_buyer_tin?: string | null;
  co_buyer_employment_status?: EmploymentStatus | string | null;
  co_buyer_employment_status_other?: string | null;
  co_buyer_employer_business_name?: string | null;
  co_buyer_employer_business_address?: string | null;
  co_buyer_employer_zip_code?: string | null;
  co_buyer_nature_of_work_business?: string | null;
  co_buyer_occupation_position_title?: string | null;
  co_buyer_monthly_income?: number | string | null;
  due_day: number | null;
  starting_date?: string | null;
  due_date?: string | null;
  next_due_date?: string | null;
  days_until_due?: number | string | null;
  offer_purchase_price?: number | string | null;
  reservation_fee_amount?: number | string | null;
  downpayment_amount?: number | string | null;
  deferred_cash_amount?: number | string | null;
  offer_balance_amount?: number | string | null;
  payment_terms_months?: number | string | null;
  interest_rate?: number | string | null;
  monthly_amortization?: number | string | null;
  contract_processing_status?: string | null;
  status: string;
  cancellation_status?: string | null;
  cancellation_result?: string | null;
  cancellation_date?: string | null;
  cancellation_reason?: string | null;
  total_paid_by_client?: number | string | null;
  refund_amount?: number | string | null;
  discontinued_amount?: number | string | null;
  settlement_date?: string | null;
  cancellation_remarks?: string | null;
  refund_released_at?: string | null;
  cleared_for_resale_at?: string | null;
  cancellation_settlement_id?: number | string | null;
  settlement_result?: string | null;
  settlement_status?: string | null;
  settlement_total_paid_snapshot?: number | string | null;
  settlement_refund_amount?: number | string | null;
  settlement_discontinued_amount?: number | string | null;
  settlement_approved_at?: string | null;
  settlement_refund_released_at?: string | null;
  settlement_cleared_for_resale_at?: string | null;
  assigned_user_id: number | null;
  assigned_user_name: string | null;
  seller_id: number | null;
  seller_name: string | null;
  seller_role: string | null;
  seller_commission_rate?: number | string | null;
  sale_type?: "distributed" | "direct_to_developer" | string | null;
  direct_to_developer_rate?: number | string | null;
  reports_under: string | null;
  document_total_count?: number | string;
  document_checklist_count?: number | string;
  document_required_count?: number | string;
  document_submitted_count?: number | string;
  document_submitted_required_count?: number | string;
  document_approved_count?: number | string;
  document_rejected_count?: number | string;
  document_status: string;
  commission_count?: number | string;
  gross_commission_total?: number | string;
  released_commission_total?: number | string;
  created_at: string;
  updated_at: string;
};

type AvailableListing = {
  id: number;
  project_id: number;
  project_name: string;
  project_location?: string | null;
  unit_id: string;
  lot_type: string | null;
  lot_area_sqm: number | string;
  price_per_sqm: number | string;
  net_selling_price: number | string;
  legal_misc_rate?: number | string;
  legal_misc_fee: number | string;
  total_contract_price: number | string;
  annual_interest_rate?: number | string | null;
  interest_rate?: number | string | null;
  reservation_fee: number | string;
  status: string;
};

type Seller = {
  id: number;
  full_name: string;
  seller_role: string;
  parent_seller_id?: number | null;
  commission_rate?: number | string | null;
  commission_pool_rate?: number | string | null;
  personal_commission_rate?: number | string | null;
  override_commission_rate?: number | string | null;
  direct_to_developer_rate?: number | string | null;
  max_downline_rate?: number | string | null;
  reports_under_display?: string | null;
};

type ClientDocument = {
  id: number;
  client_unit_id: number;
  document_id: number;
  name: string;
  description: string | null;
  is_required: number | boolean;
  can_reuse: number | boolean;
  file_url: string | null;
  storage_provider?: string | null;
  drive_file_id?: string | null;
  drive_folder_id?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | string | null;
  web_view_link?: string | null;
  uploaded_at?: string | null;
  uploaded_by?: number | null;
  uploaded_by_name?: string | null;
  status: "not_submitted" | "submitted" | "approved" | "rejected" | string;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ClientResponse = {
  client: Client;
  co_buyers?: CoBuyer[];
  employment_details?: EmploymentDetail[];
  profile_completion?: ProfileCompletion;
  data?: Client;
};

type ClientUnitsResponse = {
  client?: Client;
  clientUnits?: ClientUnit[];
  units?: ClientUnit[];
  data?: ClientUnit[];
};

type AvailableListingsResponse = {
  listings?: AvailableListing[];
  availableListings?: AvailableListing[];
  data?: AvailableListing[];
};

type SellersResponse = {
  accreditedSellers?: Seller[];
  sellers?: Seller[];
  data?: Seller[];
};

type CurrentUserResponse = {
  user?: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    status: string;
  };
  role?: string;
  isLoggedIn?: boolean;
};

type ClientDocumentsResponse = {
  documents?: ClientDocument[];
  clientDocuments?: ClientDocument[];
  data?: ClientDocument[];
};


type ReserveDocumentRequirement = {
  id?: number;
  document_id: number | null;
  name: string;
  description?: string | null;
  can_reuse?: boolean | number;
  is_required: boolean | number;
  status: string;
  sort_order: number;
  source?: string;
};

type LibraryDocument = {
  id: number;
  name: string;
  description: string | null;
  can_reuse: boolean | number;
  status: string;
};

type ListingDocumentDefaultsResponse = {
  listingDocumentRequirements?: ReserveDocumentRequirement[];
  documentRequirements?: ReserveDocumentRequirement[];
  requirements?: ReserveDocumentRequirement[];
  data?: ReserveDocumentRequirement[];
};

type ReserveListingData = {
  listing_id: number | "";
  seller_id: number | "";
  status: string;
  mode_of_payment: "cash" | "installment";
  buyer_type: BuyerType;
  co_buyer: CoBuyerFormData;
  co_buyer_employment: EmploymentFormData;
  starting_date: string;
  due_date: string;
  reservation_fee_amount: string;
  downpayment_amount: string;
  downpayment_percent: string;
  downpayment_percent_option: string;
  downpayment_percent_custom: string;
  downpayment_gives: string;
  downpayment_gives_option: string;
  downpayment_gives_custom: string;
  downpayment_discount_rate: string;
  downpayment_discount_rate_option: string;
  downpayment_discount_rate_custom: string;
  deferred_cash_amount: string;
  balloon_payment_amount: string;
  balloon_due_date: string;
  payment_terms_months: number | "";
  payment_terms_months_option: string;
  payment_terms_months_custom: string;
  interest_rate: string;
  monthly_amortization: string;
  sale_type: "distributed" | "direct_to_developer";
  direct_to_developer_rate: string;
  override_seller_id: number | "";
  override_rate: string;
  override_notes: string;
  cash_kaliwaan_amount: string;
  cash_kaliwaan_date: string;
  cash_kaliwaan_notes: string;
  document_requirements?: ReserveDocumentRequirement[];
};

type EditUnitData = {
  seller_id: string;
  due_date: string;
  status: string;
  mode_of_payment: "cash" | "installment";
  buyer_type: BuyerType;
  co_buyer: CoBuyerFormData;
  co_buyer_employment: EmploymentFormData;
  regenerate_commission: boolean;
  sale_type: "distributed" | "direct_to_developer";
  direct_to_developer_rate: string;
  override_seller_id: string;
  override_rate: string;
  override_notes: string;
};

type ChangeUnitData = {
  new_listing_id: number | "";
  status: string;
  regenerate_commission: boolean;
  reason: string;
};

type CancelUnitData = {
  reason: string;
};

type SettlementData = {
  refund_amount: string;
  cancellation_remarks: string;
};

const createBlankCoBuyerData = (): CoBuyerFormData => ({
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
});

const createBlankEmploymentData = (
  personType: PersonType,
  clientBuyerId: number | null = null,
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
});

const createDefaultReserveData = (): ReserveListingData => ({
  listing_id: "",
  seller_id: "",
  status: "reserved",
  mode_of_payment: "installment",
  buyer_type: "single",
  co_buyer: createBlankCoBuyerData(),
  co_buyer_employment: createBlankEmploymentData("co_buyer"),
  starting_date: getLocalDate(),
  due_date: getLocalDate(),
  reservation_fee_amount: "",
  downpayment_amount: "0",
  downpayment_percent: "30",
  downpayment_percent_option: "30",
  downpayment_percent_custom: "",
  downpayment_gives: "3",
  downpayment_gives_option: "3",
  downpayment_gives_custom: "",
  downpayment_discount_rate: "0",
  downpayment_discount_rate_option: "0",
  downpayment_discount_rate_custom: "",
  deferred_cash_amount: "0",
  balloon_payment_amount: "0",
  balloon_due_date: "",
  payment_terms_months: 36,
  payment_terms_months_option: "36",
  payment_terms_months_custom: "",
  interest_rate: "0",
  monthly_amortization: "",
  sale_type: "distributed",
  direct_to_developer_rate: "",
  override_seller_id: "",
  override_rate: "",
  override_notes: "",
  cash_kaliwaan_amount: "",
  cash_kaliwaan_date: "",
  cash_kaliwaan_notes: "",
  document_requirements: [],
});

const getSelectedNumber = (
  optionValue: string | number | null | undefined,
  customValue: string | number | null | undefined,
  fallback = 0,
) => {
  const value =
    String(optionValue ?? "") === "custom" ? customValue : optionValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getValidOption = (
  optionValue: string | number | null | undefined,
  allowedValues: string[],
  fallback: string,
) => {
  const value = String(optionValue ?? "");

  return allowedValues.includes(value) ? value : fallback;
};

const getValidDiscountOption = (
  optionValue: string | number | null | undefined,
  fallback = "7.5",
) => {
  return getValidOption(
    optionValue,
    ["2.5", "5", "7.5", "10", "custom"],
    fallback,
  );
};


const getSellerDirectToDeveloperRate = (seller?: Seller | null) => {
  const rate = seller?.direct_to_developer_rate ?? seller?.commission_rate ?? "";

  if (rate === null || rate === undefined || String(rate).trim() === "") {
    return "";
  }

  const numericRate = Number(rate);

  return Number.isFinite(numericRate) ? String(numericRate) : "";
};

const defaultEditUnitData: EditUnitData = {
  seller_id: "",
  due_date: "",
  status: "reserved",
  mode_of_payment: "installment",
  buyer_type: "single",
  co_buyer: createBlankCoBuyerData(),
  co_buyer_employment: createBlankEmploymentData("co_buyer"),
  regenerate_commission: false,
  sale_type: "distributed",
  direct_to_developer_rate: "",
  override_seller_id: "",
  override_rate: "",
  override_notes: "",
};

const defaultChangeUnitData: ChangeUnitData = {
  new_listing_id: "",
  status: "reserved",
  regenerate_commission: true,
  reason: "",
};

const defaultCancelUnitData: CancelUnitData = {
  reason: "",
};

const defaultSettlementData: SettlementData = {
  refund_amount: "0",
  cancellation_remarks: "",
};

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
});

const emptyCoBuyerData = (): CoBuyerFormData => createBlankCoBuyerData();

const emptyEmploymentData = (
  personType: PersonType,
  clientBuyerId: number | null = null,
): EmploymentFormData => createBlankEmploymentData(personType, clientBuyerId);

const buyerTypeOptions = [
  { label: "Single", value: "single" },
  { label: "Spouses", value: "spouses" },
  { label: "And Account", value: "and_account" },
] as const;

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
] as const;

const civilStatusOptions = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Separated", value: "separated" },
  { label: "Annulled / Divorced", value: "annulled_divorced" },
  { label: "Widower", value: "widower" },
] as const;

const employmentStatusOptions = [
  { label: "Employed - Private", value: "employed_private" },
  { label: "Employed - Government", value: "employed_government" },
  { label: "Employed - NGO", value: "employed_ngo" },
  { label: "Self-Employed (Business)", value: "self_employed_business" },
  {
    label: "Self-Employed (Professional)",
    value: "self_employed_professional",
  },
  { label: "OFW / Immigrant", value: "ofw_immigrant" },
  { label: "Other", value: "other" },
] as const;

const normalizeBuyerType = (value: string | null | undefined): BuyerType => {
  if (value === "spouses" || value === "and_account") return value;
  return "single";
};

const clientToPrincipalProfileData = (
  client: Client,
): PrincipalProfileData => ({
  buyer_type: normalizeBuyerType(client.buyer_type),
  full_name: client.full_name || "",
  birth_date:
    formatDate(client.birth_date) === "-" ? "" : formatDate(client.birth_date),
  place_of_birth: client.place_of_birth || "",
  citizenship: client.citizenship || "",
  gender:
    client.gender === "male" ||
    client.gender === "female" ||
    client.gender === "other"
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
});

const coBuyerToFormData = (buyer: CoBuyer | undefined): CoBuyerFormData => {
  if (!buyer) return emptyCoBuyerData();

  return {
    buyer_role: buyer.buyer_role === "second_buyer" ? "second_buyer" : "spouse",
    full_name: buyer.full_name || "",
    birth_date:
      formatDate(buyer.birth_date) === "-" ? "" : formatDate(buyer.birth_date),
    place_of_birth: buyer.place_of_birth || "",
    citizenship: buyer.citizenship || "",
    gender:
      buyer.gender === "male" ||
      buyer.gender === "female" ||
      buyer.gender === "other"
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
  };
};

const clientUnitToCoBuyerFormData = (
  unit: ClientUnit | null,
): CoBuyerFormData => {
  if (!unit) return emptyCoBuyerData();

  return {
    buyer_role:
      unit.co_buyer_role === "second_buyer" ? "second_buyer" : "spouse",
    full_name: unit.co_buyer_name || "",
    birth_date: unit.co_buyer_birth_date
      ? String(unit.co_buyer_birth_date).slice(0, 10)
      : "",
    place_of_birth: unit.co_buyer_place_of_birth || "",
    citizenship: unit.co_buyer_citizenship || "",
    gender:
      unit.co_buyer_gender === "male" ||
      unit.co_buyer_gender === "female" ||
      unit.co_buyer_gender === "other"
        ? unit.co_buyer_gender
        : "",
    civil_status:
      unit.co_buyer_civil_status === "single" ||
      unit.co_buyer_civil_status === "married" ||
      unit.co_buyer_civil_status === "separated" ||
      unit.co_buyer_civil_status === "annulled_divorced" ||
      unit.co_buyer_civil_status === "widower"
        ? unit.co_buyer_civil_status
        : "",
    present_address: unit.co_buyer_present_address || "",
    present_zip_code: unit.co_buyer_present_zip_code || "",
    permanent_address: unit.co_buyer_permanent_address || "",
    permanent_zip_code: unit.co_buyer_permanent_zip_code || "",
    mobile_no: unit.co_buyer_mobile_no || "",
    residence_phone_no: unit.co_buyer_residence_phone_no || "",
    email: unit.co_buyer_email || "",
    tin: unit.co_buyer_tin || "",
  };
};

const clientUnitToCoBuyerEmploymentFormData = (
  unit: ClientUnit | null,
): EmploymentFormData => {
  if (!unit) return emptyEmploymentData("co_buyer");

  return {
    person_type: "co_buyer",
    client_buyer_id: unit.co_buyer_id ? Number(unit.co_buyer_id) : null,
    employment_status: employmentStatusOptions.some(
      (option) => option.value === unit.co_buyer_employment_status,
    )
      ? (unit.co_buyer_employment_status as EmploymentStatus)
      : "",
    employment_status_other: unit.co_buyer_employment_status_other || "",
    employer_business_name: unit.co_buyer_employer_business_name || "",
    employer_business_address: unit.co_buyer_employer_business_address || "",
    employer_zip_code: unit.co_buyer_employer_zip_code || "",
    nature_of_work_business: unit.co_buyer_nature_of_work_business || "",
    occupation_position_title: unit.co_buyer_occupation_position_title || "",
    monthly_income:
      unit.co_buyer_monthly_income === null ||
      unit.co_buyer_monthly_income === undefined
        ? ""
        : String(unit.co_buyer_monthly_income),
  };
};

const employmentToFormData = (
  detail: EmploymentDetail | undefined,
  personType: PersonType,
  clientBuyerId: number | null = null,
): EmploymentFormData => {
  if (!detail) return emptyEmploymentData(personType, clientBuyerId);

  return {
    person_type: personType,
    client_buyer_id: detail.client_buyer_id || clientBuyerId,
    employment_status: employmentStatusOptions.some(
      (option) => option.value === detail.employment_status,
    )
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
  };
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return "-";

  const birth = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(birth.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "-";
};

const fetchClient = async (clientId: string) => {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as ClientResponse;
  return {
    client: data.client || data.data,
    co_buyers: data.co_buyers || [],
    employment_details: data.employment_details || [],
    profile_completion: data.profile_completion || {
      isComplete: false,
      missingFields: [],
    },
  };
};

const fetchClientUnits = async (clientId: string) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/units`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as ClientUnitsResponse;
  return data.clientUnits || data.units || data.data || [];
};

const fetchAvailableListings = async () => {
  const res = await fetch(`${API_URL}/available-listings`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as AvailableListingsResponse;
  return data.listings || data.availableListings || data.data || [];
};

const fetchSellers = async () => {
  const res = await fetch(`${API_URL}/accredited-sellers?status=active`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as SellersResponse;
  return data.accreditedSellers || data.sellers || data.data || [];
};

const fetchClientDocuments = async (clientUnitId: number | null) => {
  if (!clientUnitId) return [];

  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/documents`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as ClientDocumentsResponse;
  return data.documents || data.clientDocuments || data.data || [];
};


const fetchDocumentLibrary = async (): Promise<LibraryDocument[]> => {
  const res = await fetch(`${API_URL}/documents?status=active`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as { documents?: LibraryDocument[]; data?: LibraryDocument[] };
  return data.documents || data.data || [];
};

const fetchListingDocumentDefaults = async (
  listingId: number | "",
): Promise<ReserveDocumentRequirement[]> => {
  if (!listingId) return [];

  const res = await fetch(`${API_URL}/listings/${listingId}/full-details`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const data = (await res.json()) as ListingDocumentDefaultsResponse;
  return (
    data.listingDocumentRequirements ||
    data.documentRequirements ||
    data.requirements ||
    data.data ||
    []
  ).map((requirement, index) => ({
    ...requirement,
    is_required: Boolean(requirement.is_required),
    status: requirement.status || "active",
    sort_order: Number(requirement.sort_order || index + 1),
    source: requirement.source || "listing_snapshot",
  }));
};

const reserveListing = async ({
  clientId,
  reserveData,
}: {
  clientId: string;
  reserveData: ReserveListingData;
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
      buyer_type: reserveData.buyer_type,
      co_buyer:
        reserveData.buyer_type === "single" ? null : reserveData.co_buyer,
      co_buyer_employment:
        reserveData.buyer_type === "single"
          ? null
          : {
              ...reserveData.co_buyer_employment,
              person_type: "co_buyer",
            },
      starting_date: reserveData.starting_date,
      due_date: reserveData.due_date,
      reservation_fee_amount: Number(reserveData.reservation_fee_amount || 0),
      downpayment_amount:
        reserveData.mode_of_payment === "installment"
          ? Number(reserveData.downpayment_amount || 0)
          : 0,
      downpayment_percent:
        reserveData.mode_of_payment === "installment"
          ? getSelectedNumber(
              reserveData.downpayment_percent_option,
              reserveData.downpayment_percent_custom,
              30,
            )
          : 0,
      downpayment_gives:
        reserveData.mode_of_payment === "installment"
          ? getSelectedNumber(
              reserveData.downpayment_gives_option,
              reserveData.downpayment_gives_custom,
              3,
            )
          : 0,
      downpayment_discount_rate:
        reserveData.mode_of_payment === "installment"
          ? getSelectedNumber(
              reserveData.downpayment_discount_rate_option,
              reserveData.downpayment_discount_rate_custom,
              0,
            )
          : 0,
      deferred_cash_amount:
        reserveData.mode_of_payment === "cash"
          ? Number(reserveData.deferred_cash_amount || 0)
          : 0,
      balloon_payment_amount:
        reserveData.mode_of_payment === "installment"
          ? Number(reserveData.balloon_payment_amount || 0)
          : 0,
      balloon_due_date: null,
      payment_terms_months:
        reserveData.mode_of_payment === "installment"
          ? getSelectedNumber(
              reserveData.payment_terms_months_option,
              reserveData.payment_terms_months_custom,
              36,
            )
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
      direct_to_developer_rate:
        reserveData.sale_type === "direct_to_developer" &&
        reserveData.direct_to_developer_rate !== ""
          ? Number(reserveData.direct_to_developer_rate)
          : null,
      cash_kaliwaan_amount:
        reserveData.cash_kaliwaan_amount === ""
          ? 0
          : Number(reserveData.cash_kaliwaan_amount),
      cash_kaliwaan_date: reserveData.cash_kaliwaan_date || null,
      cash_kaliwaan_notes: reserveData.cash_kaliwaan_notes || null,
      document_requirements: reserveData.document_requirements || [],
    }),
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const savePrincipalProfile = async ({
  clientId,
  profileData,
  profileStatus,
}: {
  clientId: string;
  profileData: PrincipalProfileData;
  profileStatus?: ProfileStatus;
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
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const replaceCoBuyers = async ({
  clientId,
  coBuyers,
}: {
  clientId: string;
  coBuyers: CoBuyerFormData[];
}) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/co-buyers`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ co_buyers: coBuyers }),
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return (await res.json()) as ClientResponse;
};

const replaceEmploymentDetails = async ({
  clientId,
  employmentDetails,
}: {
  clientId: string;
  employmentDetails: EmploymentFormData[];
}) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/employment-details`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ employment_details: employmentDetails }),
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const saveBuyerProfile = async ({
  clientId,
  profileData,
  coBuyerData,
  principalEmploymentData,
  coBuyerEmploymentData,
  markComplete = false,
}: {
  clientId: string;
  profileData: PrincipalProfileData;
  coBuyerData: CoBuyerFormData[];
  principalEmploymentData: EmploymentFormData;
  coBuyerEmploymentData: EmploymentFormData;
  markComplete?: boolean;
}) => {
  await savePrincipalProfile({ clientId, profileData });
  const coBuyerResponse = await replaceCoBuyers({
    clientId,
    coBuyers: profileData.buyer_type === "single" ? [] : coBuyerData,
  });
  const savedCoBuyerId = coBuyerResponse.co_buyers?.[0]?.id || null;
  const employmentDetails: EmploymentFormData[] = [
    {
      ...principalEmploymentData,
      person_type: "principal" as const,
      client_buyer_id: null,
    },
  ];

  if (profileData.buyer_type !== "single") {
    employmentDetails.push({
      ...coBuyerEmploymentData,
      person_type: "co_buyer",
      client_buyer_id: savedCoBuyerId,
    });
  }

  await replaceEmploymentDetails({
    clientId,
    employmentDetails,
  });

  if (markComplete) {
    return savePrincipalProfile({
      clientId,
      profileData,
      profileStatus: "complete",
    });
  }

  return savePrincipalProfile({ clientId, profileData });
};

const updateClientUnit = async ({
  clientUnitId,
  unitData,
}: {
  clientUnitId: number;
  unitData: EditUnitData;
}) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seller_id: unitData.seller_id ? Number(unitData.seller_id) : null,
      due_date: unitData.due_date || null,
      status: unitData.status,
      mode_of_payment: unitData.mode_of_payment,
      buyer_type: unitData.buyer_type,
      co_buyer: unitData.buyer_type === "single" ? null : unitData.co_buyer,
      co_buyer_employment:
        unitData.buyer_type === "single"
          ? null
          : {
              ...unitData.co_buyer_employment,
              person_type: "co_buyer",
            },
      regenerate_commission: unitData.regenerate_commission,
      sale_type: unitData.sale_type,
      direct_to_developer_rate:
        unitData.sale_type === "direct_to_developer" &&
        unitData.direct_to_developer_rate !== ""
          ? Number(unitData.direct_to_developer_rate)
          : null,
    }),
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const changeClientUnitListing = async ({
  clientUnitId,
  changeData,
}: {
  clientUnitId: number;
  changeData: ChangeUnitData;
}) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/change-listing`,
    {
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
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const cancelClientUnit = async ({
  clientUnitId,
  cancelData,
}: {
  clientUnitId: number;
  cancelData: CancelUnitData;
}) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/cancel`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: cancelData.reason || null,
    }),
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const updateCancellationSettlement = async ({
  clientUnitId,
  settlementData,
}: {
  clientUnitId: number;
  settlementData: SettlementData;
}) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/cancellation-settlement`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refund_amount: Number(settlementData.refund_amount || 0),
        cancellation_remarks: settlementData.cancellation_remarks || null,
      }),
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const releaseCancellationRefund = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/cancellation-refund-release`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const clearClientUnitForResale = async (clientUnitId: number) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/clear-for-resale`, {
    method: "PATCH",
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const deleteClientUnit = async (clientUnitId: number) => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const createDocumentChecklist = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/documents/checklist`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const applyExistingReusableDocuments = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/documents/apply-existing`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const updateClientDocumentStatus = async ({
  clientDocumentId,
  status,
}: {
  clientDocumentId: number;
  status: string;
}) => {
  const res = await fetch(
    `${API_URL}/client-documents/${clientDocumentId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const uploadClientDocumentFile = async ({
  clientDocumentId,
  file,
}: {
  clientDocumentId: number;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${API_URL}/client-documents/${clientDocumentId}/upload`,
    {
      method: "PATCH",
      credentials: "include",
      body: formData,
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  return res.json();
};

const downloadClientUnitDocumentsPdf = async (unit: ClientUnit) => {
  const res = await fetch(
    `${API_URL}/client-units/${unit.id}/documents/download-pdf`,
    {
      credentials: "include",
    },
  );

  if (!res.ok) throw new Error(await getErrorMessage(res));

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `documents-${unit.unit_id || unit.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const isSubmitted = (status: string) => {
  return ["submitted", "approved"].includes(status);
};

const isRequired = (value: number | boolean) => {
  return value === true || Number(value) === 1;
};

const safeMoneyNumber = (value: unknown) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const documentStatusOptions = [
  { label: "Not Submitted", value: "not_submitted" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const documentStatusTransitions: Record<string, string[]> = {
  not_submitted: ["submitted"],
  submitted: ["approved", "rejected"],
  rejected: ["submitted"],
  approved: ["submitted", "not_submitted"],
};

const getDocumentStatusOptions = (status: string) => {
  const allowedStatuses = new Set([
    status,
    ...(documentStatusTransitions[status] || []),
  ]);

  return documentStatusOptions.filter((option) =>
    allowedStatuses.has(option.value),
  );
};

const countValue = (value: number | string | null | undefined) => {
  return Number(value || 0);
};

const moneyInputValue = (value: string) => {
  if (value === "") return 0;

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const calculateAmortizedMonthlyPayment = ({
  balance,
  annualInterestRate,
  months,
}: {
  balance: number;
  annualInterestRate: number;
  months: number;
}) => {
  const principal = Math.max(Number(balance || 0), 0);
  const termMonths = Math.max(Number(months || 0), 0);
  const monthlyRate = Math.max(Number(annualInterestRate || 0), 0) / 100 / 12;

  if (principal <= 0 || termMonths <= 0) return 0;
  if (monthlyRate <= 0) return principal / termMonths;

  const growth = Math.pow(1 + monthlyRate, termMonths);

  return (principal * monthlyRate * growth) / (growth - 1);
};


const parseDateInputValue = (value: string) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addMonthsToDateInputValue = (value: string, months: number) => {
  const date = parseDateInputValue(value);

  if (!date) return "";

  const day = date.getDate();
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonth + 1,
    0,
  ).getDate();
  const result = new Date(
    targetYear,
    targetMonth,
    Math.min(day, lastDayOfTargetMonth),
  );

  return toDateInputValue(result);
};

const getListingInterestRate = (listing?: AvailableListing | null) => {
  const parsed = Number(listing?.annual_interest_rate ?? listing?.interest_rate ?? 0);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const isPresentMoneyInputValid = (value: string) => {
  if (value === "") return true;

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue >= 0;
};

const getUnitDocumentSummary = (unit: ClientUnit) => {
  const checklistCount = countValue(unit.document_checklist_count);
  const totalCount = countValue(unit.document_total_count);
  const submittedCount = countValue(unit.document_submitted_count);
  const requiredCount = countValue(unit.document_required_count);
  const submittedRequiredCount = countValue(
    unit.document_submitted_required_count,
  );

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
  };
};

const ClientProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: clientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: currentUserResponse } = useCurrentUser() as {
    data?: CurrentUserResponse | null;
  };
  const currentUserRole =
    currentUserResponse?.user?.role || currentUserResponse?.role || "";
  const isSuperAdmin =
    String(currentUserRole).trim().toLowerCase() === "super_admin";

  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveData, setReserveData] = useState<ReserveListingData>(() =>
    createDefaultReserveData(),
  );
  const [listingSearch, setListingSearch] = useState("");
  const [hasHandledReserveListingParam, setHasHandledReserveListingParam] = useState(false);
  const [editUnit, setEditUnit] = useState<ClientUnit | null>(null);
  const [editUnitData, setEditUnitData] =
    useState<EditUnitData>(defaultEditUnitData);
  const [changeUnit, setChangeUnit] = useState<ClientUnit | null>(null);
  const [changeUnitData, setChangeUnitData] = useState<ChangeUnitData>(
    defaultChangeUnitData,
  );
  const [changeListingSearch, setChangeListingSearch] = useState("");
  const [cancelUnit, setCancelUnit] = useState<ClientUnit | null>(null);
  const [cancelUnitData, setCancelUnitData] = useState<CancelUnitData>(
    defaultCancelUnitData,
  );
  const [settlementUnit, setSettlementUnit] = useState<ClientUnit | null>(null);
  const [settlementData, setSettlementData] = useState<SettlementData>(
    defaultSettlementData,
  );
  const [deleteUnit, setDeleteUnit] = useState<ClientUnit | null>(null);
  const [selectedDocumentsUnit, setSelectedDocumentsUnit] =
    useState<ClientUnit | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [reserveValidationMessage, setReserveValidationMessage] = useState("");
  const [reserveFormulaKey, setReserveFormulaKey] = useState<
    ReserveFormulaKey | ""
  >("");
  const [reserveDocumentRequirements, setReserveDocumentRequirements] = useState<
    ReserveDocumentRequirement[]
  >([]);
  const [reserveDocumentListingId, setReserveDocumentListingId] = useState<
    number | ""
  >("");
  const [isBuyerProfileEditing, setIsBuyerProfileEditing] = useState(false);
  const [principalProfileData, setPrincipalProfileData] =
    useState<PrincipalProfileData>(() => emptyPrincipalProfileData());
  const [coBuyerData, setCoBuyerData] = useState<CoBuyerFormData[]>(() => [
    emptyCoBuyerData(),
  ]);
  const [principalEmploymentData, setPrincipalEmploymentData] =
    useState<EmploymentFormData>(() => emptyEmploymentData("principal"));
  const [coBuyerEmploymentData, setCoBuyerEmploymentData] =
    useState<EmploymentFormData>(() => emptyEmploymentData("co_buyer"));

  const {
    data: clientProfile,
    isLoading: isClientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId || ""),
    enabled: Boolean(clientId),
  });

  const client = clientProfile?.client;
  const coBuyers = useMemo(
    () => clientProfile?.co_buyers || [],
    [clientProfile?.co_buyers],
  );
  const employmentDetails = useMemo(
    () => clientProfile?.employment_details || [],
    [clientProfile?.employment_details],
  );
  const profileCompletion = clientProfile?.profile_completion || {
    isComplete: false,
    missingFields: [],
  };

  const {
    data: clientUnits = [],
    isLoading: areUnitsLoading,
    error: unitsError,
  } = useQuery({
    queryKey: ["client-units", clientId],
    queryFn: () => fetchClientUnits(clientId || ""),
    enabled: Boolean(clientId),
  });

  const { data: availableListings = [] } = useQuery({
    queryKey: ["available-listings"],
    queryFn: fetchAvailableListings,
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ["accredited-sellers", "active"],
    queryFn: fetchSellers,
  });


  const { data: documentLibrary = [] } = useQuery({
    queryKey: ["documents", "library", "active"],
    queryFn: fetchDocumentLibrary,
  });

  const {
    data: reserveListingDocumentDefaults = [],
    isLoading: isReserveDocumentsLoading,
  } = useQuery({
    queryKey: ["reserve-listing-documents", reserveData.listing_id || null],
    queryFn: () => fetchListingDocumentDefaults(reserveData.listing_id),
    enabled: Boolean(reserveData.listing_id),
  });

  const {
    data: clientDocuments = [],
    isLoading: areDocumentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ["client-unit-documents", selectedDocumentsUnit?.id || null],
    queryFn: () => fetchClientDocuments(selectedDocumentsUnit?.id || null),
    enabled: Boolean(selectedDocumentsUnit?.id),
  });

  useEffect(() => {
    if (!client) return;

    const firstCoBuyer = coBuyers[0];
    const principalEmployment = employmentDetails.find(
      (detail) => detail.person_type === "principal",
    );
    const coBuyerEmployment = firstCoBuyer
      ? employmentDetails.find(
          (detail) =>
            detail.person_type === "co_buyer" &&
            Number(detail.client_buyer_id) === Number(firstCoBuyer.id),
        ) ||
        employmentDetails.find((detail) => detail.person_type === "co_buyer")
      : undefined;

    const timeoutId = window.setTimeout(() => {
      setPrincipalProfileData(clientToPrincipalProfileData(client));
      setCoBuyerData([coBuyerToFormData(firstCoBuyer)]);
      setPrincipalEmploymentData(
        employmentToFormData(principalEmployment, "principal"),
      );
      setCoBuyerEmploymentData(
        employmentToFormData(
          coBuyerEmployment,
          "co_buyer",
          firstCoBuyer?.id || null,
        ),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [client, coBuyers, employmentDetails]);


  useEffect(() => {
    if (!reserveData.listing_id) {
      setReserveDocumentRequirements((currentRequirements) =>
        currentRequirements.length > 0 ? [] : currentRequirements,
      );
      setReserveDocumentListingId((currentListingId) =>
        currentListingId === "" ? currentListingId : "",
      );
      return;
    }

    if (isReserveDocumentsLoading) return;

    const nextListingId = Number(reserveData.listing_id);

    if (Number(reserveDocumentListingId || 0) === nextListingId) {
      return;
    }

    setReserveDocumentRequirements(reserveListingDocumentDefaults);
    setReserveDocumentListingId(nextListingId);
  }, [
    reserveData.listing_id,
    reserveDocumentListingId,
    reserveListingDocumentDefaults,
    isReserveDocumentsLoading,
  ]);

  const invalidateClientProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-units", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-units"] });
    queryClient.invalidateQueries({ queryKey: ["available-listings"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["commissions"] });
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] });
    queryClient.invalidateQueries({ queryKey: ["commission-releases"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });

    if (selectedDocumentsUnit?.id) {
      queryClient.invalidateQueries({
        queryKey: ["client-unit-documents", selectedDocumentsUnit.id],
      });
    }
  };

  const reserveMutation = useMutation({
    mutationFn: reserveListing,
    onSuccess: () => {
      invalidateClientProfile();
      setIsReserveOpen(false);
      setReserveFormulaKey("");
      setReserveData(createDefaultReserveData());
      setReserveValidationMessage("");
      setSuccessMessage(
        "Listing reserved and commission generated successfully",
      );
    },
  });

  const saveBuyerProfileMutation = useMutation({
    mutationFn: saveBuyerProfile,
    onSuccess: () => {
      invalidateClientProfile();
      setIsBuyerProfileEditing(false);
      setSuccessMessage("Buyer profile saved successfully");
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: updateClientUnit,
    onSuccess: () => {
      invalidateClientProfile();
      setEditUnit(null);
      setSuccessMessage("Client unit updated successfully");
    },
  });

  const changeUnitMutation = useMutation({
    mutationFn: changeClientUnitListing,
    onSuccess: () => {
      invalidateClientProfile();
      setChangeUnit(null);
      setChangeUnitData(defaultChangeUnitData);
      setChangeListingSearch("");
      setSuccessMessage("Client unit changed successfully");
    },
  });

  const cancelUnitMutation = useMutation({
    mutationFn: cancelClientUnit,
    onSuccess: () => {
      invalidateClientProfile();
      setCancelUnit(null);
      setCancelUnitData(defaultCancelUnitData);
      setSuccessMessage("Cancellation review started successfully");
    },
  });

  const settlementMutation = useMutation({
    mutationFn: updateCancellationSettlement,
    onSuccess: () => {
      invalidateClientProfile();
      setSuccessMessage("Cancellation settlement saved successfully");
    },
  });

  const refundReleaseMutation = useMutation({
    mutationFn: releaseCancellationRefund,
    onSuccess: () => {
      invalidateClientProfile();
      setSuccessMessage("Refund marked as released successfully");
    },
  });

  const clearForResaleMutation = useMutation({
    mutationFn: clearClientUnitForResale,
    onSuccess: () => {
      invalidateClientProfile();
      setSettlementUnit(null);
      setSettlementData(defaultSettlementData);
      setSuccessMessage("Listing cleared for resale successfully");
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: deleteClientUnit,
    onSuccess: () => {
      invalidateClientProfile();
      setDeleteUnit(null);
      setSuccessMessage("Client unit deleted successfully");
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: updateClientDocumentStatus,
    onSuccess: () => {
      invalidateClientProfile();
      setSuccessMessage("Document checklist updated successfully");
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadClientDocumentFile,
    onSuccess: () => {
      invalidateClientProfile();
      setSuccessMessage("Document file uploaded successfully");
    },
  });

  const downloadDocumentsMutation = useMutation({
    mutationFn: downloadClientUnitDocumentsPdf,
    onError: () => undefined,
  });

  const createChecklistMutation = useMutation({
    mutationFn: createDocumentChecklist,
    onSuccess: () => {
      invalidateClientProfile();
      setSuccessMessage("Document checklist created successfully");
    },
  });

  const applyReusableMutation = useMutation({
    mutationFn: applyExistingReusableDocuments,
    onSuccess: () => {
      invalidateClientProfile();
      setSuccessMessage("Reusable documents applied successfully");
    },
  });

  const selectedMainSeller = sellers.find(
    (seller) => Number(seller.id) === Number(reserveData.seller_id),
  );
  const selectedDirectToDeveloperRate = getSellerDirectToDeveloperRate(selectedMainSeller);
  const displayedDirectToDeveloperRate = isSuperAdmin
    ? reserveData.direct_to_developer_rate
    : reserveData.direct_to_developer_rate || selectedDirectToDeveloperRate;

  const selectedEditSeller = sellers.find(
    (seller) => Number(seller.id) === Number(editUnitData.seller_id),
  );
  const selectedEditDirectToDeveloperRate =
    getSellerDirectToDeveloperRate(selectedEditSeller);
  const displayedEditDirectToDeveloperRate = isSuperAdmin
    ? editUnitData.direct_to_developer_rate
    : editUnitData.direct_to_developer_rate || selectedEditDirectToDeveloperRate;

  const sellerById = useMemo(() => {
    return new Map(sellers.map((seller) => [Number(seller.id), seller]));
  }, [sellers]);

  const reserveCommissionPreview = useMemo(() => {
    if (!selectedMainSeller) return [];

    const chain: Seller[] = [];
    let current: Seller | undefined = selectedMainSeller;
    const visited = new Set<number>();

    while (current && !visited.has(Number(current.id)) && chain.length < 10) {
      visited.add(Number(current.id));
      chain.push(current);
      current = current.parent_seller_id
        ? sellerById.get(Number(current.parent_seller_id))
        : undefined;
    }

    const personalRate = Number(
      selectedMainSeller.personal_commission_rate ||
        selectedMainSeller.commission_rate ||
        0,
    );
    const manager = chain.find((seller) => seller.seller_role === "manager");
    const broker = chain.find((seller) => seller.seller_role === "broker");
    const bnm = chain.find(
      (seller) => seller.seller_role === "broker_network_manager",
    );
    const rows = [
      {
        seller: selectedMainSeller,
        label: "Main Seller",
        rate: personalRate,
      },
    ];

    let allocatedBelowBroker = personalRate;

    if (manager && Number(manager.id) !== Number(selectedMainSeller.id)) {
      const managerRate = Number(manager.override_commission_rate || 0);
      if (managerRate > 0) {
        rows.push({
          seller: manager,
          label: "Manager Override",
          rate: managerRate,
        });
        allocatedBelowBroker += managerRate;
      }
    }

    if (broker && Number(broker.id) !== Number(selectedMainSeller.id)) {
      const brokerPool = Number(
        broker.commission_pool_rate || broker.commission_rate || 0,
      );
      const brokerResidual = Math.max(brokerPool - allocatedBelowBroker, 0);
      if (brokerResidual > 0) {
        rows.push({
          seller: broker,
          label: "Broker Residual",
          rate: brokerResidual,
        });
      }

      if (bnm) {
        const bnmPool = Number(bnm.commission_pool_rate || 0);
        const bnmResidual = Math.max(bnmPool - brokerPool, 0);
        if (bnmResidual > 0) {
          rows.push({ seller: bnm, label: "BNM Residual", rate: bnmResidual });
        }
      }
    }

    return rows.filter((row) => Number(row.rate) > 0);
  }, [selectedMainSeller, sellerById]);

  const selectedListing = availableListings.find(
    (listing) => Number(listing.id) === Number(reserveData.listing_id),
  );

  const reservePurchasePrice = selectedListing
    ? Number(selectedListing.total_contract_price || 0)
    : 0;
  const reserveReservationFee = moneyInputValue(
    reserveData.reservation_fee_amount,
  );
  const reserveDownpaymentPercent =
    reserveData.mode_of_payment === "installment"
      ? getSelectedNumber(
          reserveData.downpayment_percent_option,
          reserveData.downpayment_percent_custom,
          30,
        )
      : 0;
  const reserveDownpaymentTarget =
    reserveData.mode_of_payment === "installment"
      ? reservePurchasePrice * (reserveDownpaymentPercent / 100)
      : 0;
  const reserveDownpaymentGross = Math.max(
    reserveDownpaymentTarget - reserveReservationFee,
    0,
  );
  const reserveDownpaymentGives =
    reserveData.mode_of_payment === "installment"
      ? Math.max(
          getSelectedNumber(
            reserveData.downpayment_gives_option,
            reserveData.downpayment_gives_custom,
            3,
          ),
          1,
        )
      : 0;
  const reserveIsSpotDownpayment =
    reserveData.mode_of_payment === "installment" &&
    reserveDownpaymentGives === 1;
  const reserveDownpaymentDiscountRate = reserveIsSpotDownpayment
    ? getSelectedNumber(
        reserveData.downpayment_discount_rate_option,
        reserveData.downpayment_discount_rate_custom,
        0,
      )
    : 0;
  const reserveDownpaymentDiscountAmount = reserveIsSpotDownpayment
    ? reserveDownpaymentGross * (reserveDownpaymentDiscountRate / 100)
    : 0;
  const reserveDownpayment =
    reserveData.mode_of_payment === "installment"
      ? Math.max(reserveDownpaymentGross - reserveDownpaymentDiscountAmount, 0)
      : 0;
  const reserveDownpaymentPerGive =
    reserveData.mode_of_payment === "installment" && reserveDownpaymentGives > 0
      ? reserveDownpayment / reserveDownpaymentGives
      : 0;
  const reserveDeferredCash =
    reserveData.mode_of_payment === "cash"
      ? moneyInputValue(reserveData.deferred_cash_amount)
      : 0;
  const reserveBalloonPayment =
    reserveData.mode_of_payment === "installment"
      ? moneyInputValue(reserveData.balloon_payment_amount)
      : 0;
  const reserveBalanceRaw =
    reservePurchasePrice -
    reserveReservationFee -
    reserveDownpayment -
    reserveDeferredCash;
  const reserveOfferBalance = Math.max(reserveBalanceRaw, 0);
  const reserveTermsMonths =
    reserveData.mode_of_payment === "installment"
      ? getSelectedNumber(
          reserveData.payment_terms_months_option,
          reserveData.payment_terms_months_custom,
          36,
        )
      : 0;
  const reserveFirstDueDate = reserveData.due_date || reserveData.starting_date || getLocalDate();
  const reserveMonthlyStartDate =
    reserveData.mode_of_payment === "installment" && reserveDownpayment > 0
      ? addMonthsToDateInputValue(reserveFirstDueDate, reserveDownpaymentGives)
      : reserveFirstDueDate;
  const reserveBalloonDueDate =
    reserveData.mode_of_payment === "installment" &&
    reserveBalloonPayment > 0 &&
    reserveTermsMonths > 0
      ? addMonthsToDateInputValue(
          reserveMonthlyStartDate,
          Math.max(reserveTermsMonths - 1, 0),
        )
      : "";

  const reserveInterestRate = selectedListing
    ? getListingInterestRate(selectedListing)
    : moneyInputValue(reserveData.interest_rate);
  const reserveAmortizedBalance = Math.max(
    reserveOfferBalance - reserveBalloonPayment,
    0,
  );
  const computedMonthlyAmortization =
    reserveData.mode_of_payment === "installment" && reserveTermsMonths > 0
      ? calculateAmortizedMonthlyPayment({
          balance: reserveAmortizedBalance,
          annualInterestRate: reserveInterestRate,
          months: reserveTermsMonths,
        })
      : 0;
  const displayedMonthlyAmortization =
    computedMonthlyAmortization > 0
      ? computedMonthlyAmortization.toFixed(2)
      : "";

  const reserveFormulaRows: Array<{
    key: ReserveFormulaKey;
    label: string;
    value: string;
    formula: string;
    note?: string;
  }> = [
    {
      key: "offer_purchase_price",
      label: "Offer Purchase Price",
      value: formatMoney(reservePurchasePrice),
      formula: `TCP from selected listing: Net Selling Price + LMF = ${formatMoney(reservePurchasePrice)}`,
    },
    {
      key: "net_dp_payable",
      label: "Net Downpayment",
      value:
        reserveData.mode_of_payment === "installment"
          ? formatMoney(reserveDownpayment)
          : "-",
      formula: `${formatMoney(reserveDownpaymentGross)} - ${formatMoney(reserveDownpaymentDiscountAmount)}`,
      note: "Downpayment is computed from the selected terms. Spot discount only applies if configured.",
    },
    {
      key: "offer_balance",
      label: "Balance for Amortization",
      value: formatMoney(reserveAmortizedBalance),
      formula: `${formatMoney(reservePurchasePrice)} - ${formatMoney(reserveReservationFee)} - ${formatMoney(reserveDownpayment)} - ${formatMoney(reserveDeferredCash)} - ${formatMoney(reserveBalloonPayment)} balloon`,
      note: "Balloon payment is separated from the monthly amortized balance.",
    },
    {
      key: "monthly_preview",
      label: "Monthly Amortization",
      value:
        reserveData.mode_of_payment === "installment"
          ? formatMoney(computedMonthlyAmortization)
          : "-",
      formula: `Amortized monthly payment using ${formatNumber(reserveInterestRate)}% annual interest over ${formatNumber(reserveTermsMonths || 1)} month(s).`,
      note: "Monthly amortization is automatically calculated and cannot be manually edited.",
    },
  ];

  const selectedReserveFormula =
    reserveFormulaRows.find((row) => row.key === reserveFormulaKey) || null;

  const filteredReserveListings = availableListings.filter((listing) => {
    const search = listingSearch.toLowerCase().trim();

    if (!search || Number(listing.id) === Number(reserveData.listing_id)) {
      return true;
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
      .includes(search);
  });

  const filteredChangeListings = availableListings.filter((listing) => {
    const search = changeListingSearch.toLowerCase().trim();

    if (
      !search ||
      Number(listing.id) === Number(changeUnitData.new_listing_id)
    ) {
      return true;
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
      .includes(search);
  });

  const submittedDocumentCount = useMemo(() => {
    return clientDocuments.filter((document) => isSubmitted(document.status))
      .length;
  }, [clientDocuments]);

  const requiredDocumentCount = useMemo(() => {
    return clientDocuments.filter((document) =>
      isRequired(document.is_required),
    ).length;
  }, [clientDocuments]);

  const submittedRequiredDocumentCount = useMemo(() => {
    return clientDocuments.filter(
      (document) =>
        isRequired(document.is_required) && isSubmitted(document.status),
    ).length;
  }, [clientDocuments]);

  const totals = useMemo(() => {
    return clientUnits.reduce(
      (summary, unit) => {
        summary.totalContractPrice += Number(unit.total_contract_price || 0);
        summary.totalPaid += Number(unit.paid_amount || 0);
        summary.totalBalance += Number(unit.balance || 0);
        summary.totalCommission += Number(unit.gross_commission_total || 0);

        return summary;
      },
      {
        totalContractPrice: 0,
        totalPaid: 0,
        totalBalance: 0,
        totalCommission: 0,
      },
    );
  }, [clientUnits]);

  const activeCoBuyerData = coBuyerData[0] || emptyCoBuyerData();
  const showCoBuyerProfile = false;
  const currentProfileStatus: ProfileStatus =
    client?.profile_status === "complete" ? "complete" : "incomplete";
  const isSavingBuyerProfile = saveBuyerProfileMutation.isPending;

  const getReserveValidationMessage = () => {
    if (!reserveData.listing_id || !selectedListing) {
      return "Listing is required";
    }

    if (!reserveData.mode_of_payment) {
      return "Mode of payment is required";
    }

    if (!reserveData.starting_date) {
      return "Starting date is required";
    }

    if (!reserveData.due_date) {
      return "First due date is required";
    }

    if (
      reserveData.reservation_fee_amount === "" ||
      !isPresentMoneyInputValid(reserveData.reservation_fee_amount)
    ) {
      return "Reservation fee must be a non-negative amount";
    }

    if (
      reserveData.mode_of_payment === "cash" &&
      !isPresentMoneyInputValid(reserveData.deferred_cash_amount)
    ) {
      return "Deferred cash amount must be a non-negative amount";
    }

    if (reserveData.mode_of_payment === "installment") {
      const parsedTermsMonths = getSelectedNumber(
        reserveData.payment_terms_months_option,
        reserveData.payment_terms_months_custom,
        36,
      );

      if (
        !Number.isInteger(parsedTermsMonths) ||
        parsedTermsMonths < 1 ||
        parsedTermsMonths > 120
      ) {
        return "Payment terms must be between 1 and 120 months";
      }

      if (
        !Number.isFinite(reserveDownpaymentPercent) ||
        reserveDownpaymentPercent < 0
      ) {
        return "Downpayment percentage must be a non-negative amount";
      }

      if (
        !Number.isInteger(reserveDownpaymentGives) ||
        reserveDownpaymentGives < 1
      ) {
        return "Downpayment gives must be at least 1";
      }

      if (
        reserveIsSpotDownpayment &&
        (!Number.isFinite(reserveDownpaymentDiscountRate) ||
          reserveDownpaymentDiscountRate < 0)
      ) {
        return "Spot downpayment discount must be a non-negative percentage";
      }

      if (!isPresentMoneyInputValid(reserveData.interest_rate)) {
        return "Interest rate must be a non-negative percentage";
      }

    }

    if (reserveBalanceRaw < 0) {
      return "Reservation fee, downpayment, and deferred cash cannot exceed TCP";
    }

    return "";
  };

  const openReserveModal = (presetListingId?: number | string) => {
    const defaultSeller = sellers.find(
      (seller) => Number(seller.id) === Number(client?.default_seller_id),
    );
    const presetListing = availableListings.find(
      (listing) => Number(listing.id) === Number(presetListingId),
    );
    const presetListingLabel = presetListing
      ? `${presetListing.unit_id} - ${presetListing.project_name} - ${formatMoney(presetListing.total_contract_price)}`
      : "";

    setReserveData({
      ...createDefaultReserveData(),
      listing_id: presetListing?.id || "",
      reservation_fee_amount: presetListing
        ? String(Number(presetListing.reservation_fee || 0))
        : "",
      interest_rate: presetListing
        ? String(getListingInterestRate(presetListing))
        : "0",
      seller_id: client?.default_seller_id || "",
      direct_to_developer_rate: getSellerDirectToDeveloperRate(defaultSeller),
    });
    setListingSearch(presetListingLabel);
    setSuccessMessage("");
    setReserveValidationMessage("");
    setReserveFormulaKey("");
    setReserveDocumentRequirements([]);
    setReserveDocumentListingId("");
    setIsReserveOpen(true);
  };

  useEffect(() => {
    const reserveListingId = searchParams.get("reserveListingId");

    if (hasHandledReserveListingParam || !reserveListingId || !client || availableListings.length === 0) {
      return;
    }

    const listingExists = availableListings.some(
      (listing) => Number(listing.id) === Number(reserveListingId),
    );

    if (!listingExists) return;

    openReserveModal(reserveListingId);
    setHasHandledReserveListingParam(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("reserveListingId");
    setSearchParams(nextParams, { replace: true });
  }, [
    availableListings,
    client,
    hasHandledReserveListingParam,
    searchParams,
    setSearchParams,
    sellers,
  ]);

  const openEditUnitModal = (unit: ClientUnit) => {
    setEditUnit(unit);
    setEditUnitData({
      seller_id: unit.seller_id ? String(unit.seller_id) : "",
      due_date: unit.due_date ? String(unit.due_date).slice(0, 10) : "",
      status: unit.status || "reserved",
      mode_of_payment: unit.mode_of_payment === "cash" ? "cash" : "installment",
      buyer_type: normalizeBuyerType(unit.buyer_type),
      co_buyer: clientUnitToCoBuyerFormData(unit),
      co_buyer_employment: clientUnitToCoBuyerEmploymentFormData(unit),
      regenerate_commission: false,
      sale_type:
        unit.sale_type === "direct_to_developer" || unit.sale_type === "direct"
          ? "direct_to_developer"
          : "distributed",
      direct_to_developer_rate:
        unit.direct_to_developer_rate === null ||
        unit.direct_to_developer_rate === undefined ||
        String(unit.direct_to_developer_rate).trim() === ""
          ? getSellerDirectToDeveloperRate(
              sellers.find((seller) => Number(seller.id) === Number(unit.seller_id)),
            )
          : String(unit.direct_to_developer_rate),
      override_seller_id: "",
      override_rate: "",
      override_notes: "",
    });
  };

  const openChangeUnitModal = (unit: ClientUnit) => {
    setChangeUnit(unit);
    setChangeUnitData({
      ...defaultChangeUnitData,
      status: unit.status === "active" ? "active" : "reserved",
    });
    setChangeListingSearch("");
    setSuccessMessage("");
  };

  const openCancelUnitModal = (unit: ClientUnit) => {
    setCancelUnit(unit);
    setCancelUnitData(defaultCancelUnitData);
    setSuccessMessage("");
  };

  const openSettlementModal = (unit: ClientUnit) => {
    const refundValue =
      unit.settlement_refund_amount ?? unit.refund_amount ?? 0;

    setSettlementUnit(unit);
    setSettlementData({
      refund_amount: String(refundValue || 0),
      cancellation_remarks: unit.cancellation_remarks || "",
    });
    setSuccessMessage("");
  };

  const openDeleteUnitModal = (unit: ClientUnit) => {
    setDeleteUnit(unit);
    setSuccessMessage("");
  };

  const openDocumentsModal = (unit: ClientUnit) => {
    setSelectedDocumentsUnit(unit);
    setSuccessMessage("");
  };

  const handleReserveListing = () => {
    if (!clientId || !reserveData.listing_id) return;

    const validationMessage = getReserveValidationMessage();

    if (validationMessage) {
      setReserveValidationMessage(validationMessage);
      return;
    }

    setReserveValidationMessage("");

    reserveMutation.mutate({
      clientId,
      reserveData: {
        ...reserveData,
        downpayment_amount:
          reserveData.mode_of_payment === "installment"
            ? reserveDownpayment.toFixed(2)
            : "0",
        deferred_cash_amount:
          reserveData.mode_of_payment === "cash"
            ? String(reserveDeferredCash)
            : "0",
        payment_terms_months:
          reserveData.mode_of_payment === "installment"
            ? reserveTermsMonths
            : "",
        monthly_amortization:
          reserveData.mode_of_payment === "installment"
            ? displayedMonthlyAmortization
            : "",
        document_requirements: reserveDocumentRequirements,
      },
    });
  };

  const resetBuyerProfileForm = () => {
    if (!client) return;

    const firstCoBuyer = coBuyers[0];
    const principalEmployment = employmentDetails.find(
      (detail) => detail.person_type === "principal",
    );
    const coBuyerEmployment = firstCoBuyer
      ? employmentDetails.find(
          (detail) =>
            detail.person_type === "co_buyer" &&
            Number(detail.client_buyer_id) === Number(firstCoBuyer.id),
        ) ||
        employmentDetails.find((detail) => detail.person_type === "co_buyer")
      : undefined;

    setPrincipalProfileData(clientToPrincipalProfileData(client));
    setCoBuyerData([coBuyerToFormData(firstCoBuyer)]);
    setPrincipalEmploymentData(
      employmentToFormData(principalEmployment, "principal"),
    );
    setCoBuyerEmploymentData(
      employmentToFormData(
        coBuyerEmployment,
        "co_buyer",
        firstCoBuyer?.id || null,
      ),
    );
  };

  const handleCancelBuyerProfileEdit = () => {
    resetBuyerProfileForm();
    setIsBuyerProfileEditing(false);
  };

  const handleSaveBuyerProfile = () => {
    if (!clientId) return;

    saveBuyerProfileMutation.mutate({
      clientId,
      profileData: { ...principalProfileData, buyer_type: "single" },
      coBuyerData: [],
      principalEmploymentData,
      coBuyerEmploymentData: emptyEmploymentData("co_buyer"),
    });
  };

  const handleUpdateUnit = () => {
    if (!editUnit) return;

    updateUnitMutation.mutate({
      clientUnitId: editUnit.id,
      unitData: editUnitData,
    });
  };

  const handleChangeUnit = () => {
    if (!changeUnit || !changeUnitData.new_listing_id) return;

    changeUnitMutation.mutate({
      clientUnitId: changeUnit.id,
      changeData: changeUnitData,
    });
  };

  const handleCancelUnit = () => {
    if (!cancelUnit) return;

    cancelUnitMutation.mutate({
      clientUnitId: cancelUnit.id,
      cancelData: cancelUnitData,
    });
  };

  const handleSaveSettlement = () => {
    if (!settlementUnit) return;

    settlementMutation.mutate({
      clientUnitId: settlementUnit.id,
      settlementData,
    });
  };

  const handleReleaseRefund = () => {
    if (!settlementUnit) return;
    refundReleaseMutation.mutate(settlementUnit.id);
  };

  const handleClearForResale = () => {
    if (!settlementUnit) return;
    clearForResaleMutation.mutate(settlementUnit.id);
  };

  const handleDeleteUnit = () => {
    if (!deleteUnit) return;

    deleteUnitMutation.mutate(deleteUnit.id);
  };

  const handleDocumentStatusChange = (
    document: ClientDocument,
    status: string,
  ) => {
    updateDocumentMutation.mutate({
      clientDocumentId: document.id,
      status,
    });
  };

  const handleDocumentFileChange = (
    document: ClientDocument,
    file: File | null,
  ) => {
    if (!file) return;
    uploadDocumentMutation.mutate({
      clientDocumentId: document.id,
      file,
    });
  };

  if (isClientLoading || areUnitsLoading) {
    return <LoadingState label="Loading client profile..." />;
  }

  if (clientError || unitsError || !client) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Failed to load client profile" />
        <Button icon={<FiArrowLeft />} onClick={() => navigate("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
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
            <Button
              icon={<FiPlus />}
              onClick={() => openReserveModal()}
              variant="primary"
            >
              Reserve Listing
            </Button>
          </div>
        }
      />

      {successMessage ? (
        <Alert variant="success" title={successMessage} />
      ) : null}

      {clientUnits
        .filter((unit) => {
          const balance = Number(unit.balance || 0);
          const status = String(unit.status || "").toLowerCase();
          const isClosedAccount = ["cancelled", "fully_paid", "closed"].includes(status);

          return (
            balance > 0 &&
            !isClosedAccount &&
            Number(unit.days_until_due ?? 999) >= 0 &&
            Number(unit.days_until_due ?? 999) <= 7
          );
        })
        .slice(0, 1)
        .map((unit) => (
          <Alert
            key={`due-${unit.id}`}
            variant="warning"
            title={`Payment due in ${Number(unit.days_until_due)} day(s) — Unit ${unit.unit_id}${unit.next_due_date ? ` · Due on ${formatDate(unit.next_due_date)}` : ""}`}
          />
        ))}

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

      {settlementMutation.error ? (
        <Alert
          variant="error"
          title={
            settlementMutation.error instanceof Error
              ? settlementMutation.error.message
              : "Failed to save settlement"
          }
        />
      ) : null}

      {refundReleaseMutation.error ? (
        <Alert
          variant="error"
          title={
            refundReleaseMutation.error instanceof Error
              ? refundReleaseMutation.error.message
              : "Failed to release refund"
          }
        />
      ) : null}

      {clearForResaleMutation.error ? (
        <Alert
          variant="error"
          title={
            clearForResaleMutation.error instanceof Error
              ? clearForResaleMutation.error.message
              : "Failed to clear listing for resale"
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
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Client Details</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Detail label="Buyer Name" value={client.full_name} />
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
            {isBuyerProfileEditing ? (
              <>
                <Button
                  disabled={isSavingBuyerProfile}
                  onClick={handleCancelBuyerProfileEdit}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSavingBuyerProfile}
                  onClick={handleSaveBuyerProfile}
                  variant="primary"
                >
                  {saveBuyerProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                icon={<FiEdit2 />}
                onClick={() => setIsBuyerProfileEditing(true)}
                variant="primary"
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        {currentProfileStatus === "incomplete" ? (
          <div className="mt-4">
            <Alert
              variant="warning"
              title="Buyer profile is incomplete"
              message={
                profileCompletion.missingFields.length > 0
                  ? `Missing: ${profileCompletion.missingFields.join(", ")}`
                  : "Review the buyer profile details before printing forms."
              }
            />
          </div>
        ) : null}

        <fieldset
          disabled={!isBuyerProfileEditing || isSavingBuyerProfile}
          className={`mt-5 space-y-5 ${
            !isBuyerProfileEditing ? "opacity-70" : ""
          }`}
        >
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Principal Buyer
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
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
        </fieldset>
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
                <Button
                  icon={<FiPlus />}
                  onClick={() => openReserveModal()}
                  variant="primary"
                >
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
                  <th className="px-4 py-3 text-left">Buyer Type</th>
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
                  const documentSummary = getUnitDocumentSummary(unit);

                  return (
                    <tr key={unit.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">
                          {unit.unit_id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {unit.lot_type || "-"} ·{" "}
                          {formatNumber(unit.lot_area_sqm)} sqm
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
                          {unit.seller_role
                            ? formatText(unit.seller_role)
                            : "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {formatText(unit.sale_type || "distributed")}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <p>{formatText(unit.buyer_type || "single")}</p>
                        {unit.buyer_type !== "single" && unit.co_buyer_name ? (
                          <p className="text-xs text-slate-500">
                            {unit.co_buyer_name}
                          </p>
                        ) : null}
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
                                "noopener,noreferrer",
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
                                "noopener,noreferrer",
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
                          {unit.status === "pending_cancellation" ||
                          unit.status === "cancelled" ? (
                            <Button
                              onClick={() => openSettlementModal(unit)}
                              variant="secondary"
                            >
                              Settlement
                            </Button>
                          ) : (
                            <Button
                              onClick={() => openCancelUnitModal(unit)}
                              variant="secondary"
                            >
                              Start Cancellation
                            </Button>
                          )}
                          <Button
                            onClick={() => openDeleteUnitModal(unit)}
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableContainer>
        )}
      </div>

      {isReserveOpen ? (
        <Modal
          title="Reserve Listing"
          onClose={() => {
            setIsReserveOpen(false);
            setReserveFormulaKey("");
          }}
          size="xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsReserveOpen(false);
                  setReserveFormulaKey("");
                }}
              >
                Cancel
              </Button>
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
                  setListingSearch(e.target.value);
                  setReserveData({
                    ...reserveData,
                    listing_id: "",
                    reservation_fee_amount: "",
                    monthly_amortization: "",
                  });
                  setReserveDocumentRequirements([]);
                  setReserveDocumentListingId("");
                  setReserveValidationMessage("");
                  setReserveFormulaKey("");
                }}
                placeholder="Search unit, project, or lot type"
              />

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredReserveListings.length > 0 ? (
                  filteredReserveListings.map((listing) => {
                    const isSelected =
                      Number(reserveData.listing_id) === Number(listing.id);
                    const label = `${listing.unit_id} - ${listing.project_name} - ${formatMoney(listing.total_contract_price)}`;

                    return (
                      <button
                        className={[
                          "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50",
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700",
                        ].join(" ")}
                        key={listing.id}
                        onClick={() => {
                          setReserveData({
                            ...reserveData,
                            listing_id: listing.id,
                            reservation_fee_amount: String(
                              Number(listing.reservation_fee || 0),
                            ),
                            interest_rate: String(getListingInterestRate(listing)),
                            monthly_amortization: "",
                            document_requirements: [],
                          });
                          setReserveDocumentRequirements([]);
                          setReserveDocumentListingId("");
                          setReserveValidationMessage("");
                          setReserveFormulaKey("");
                          setListingSearch(label);
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
                    );
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
                <MiniDetail
                  label="Project"
                  value={selectedListing.project_name}
                />
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

            <UnitBuyerFields
              buyerType={reserveData.buyer_type}
              coBuyer={reserveData.co_buyer}
              coBuyerEmployment={reserveData.co_buyer_employment}
              onBuyerTypeChange={(buyerType) => {
                setReserveData({
                  ...reserveData,
                  buyer_type: buyerType,
                  co_buyer:
                    buyerType === "single"
                      ? createBlankCoBuyerData()
                      : {
                          ...reserveData.co_buyer,
                          buyer_role:
                            buyerType === "spouses" ? "spouse" : "second_buyer",
                        },
                  co_buyer_employment:
                    buyerType === "single"
                      ? createBlankEmploymentData("co_buyer")
                      : reserveData.co_buyer_employment,
                });
                setReserveValidationMessage("");
              }}
              onCoBuyerChange={(coBuyer) =>
                setReserveData({
                  ...reserveData,
                  co_buyer: coBuyer,
                })
              }
              onCoBuyerEmploymentChange={(coBuyerEmployment) =>
                setReserveData({
                  ...reserveData,
                  co_buyer_employment: coBuyerEmployment,
                })
              }
            />

            <ReserveDocumentRequirementsSection
              documents={reserveDocumentRequirements}
              setDocuments={setReserveDocumentRequirements}
              documentLibrary={documentLibrary}
              isLoading={isReserveDocumentsLoading}
              buyerType={reserveData.buyer_type}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Assigned Seller / Unit Manager"
                value={reserveData.seller_id}
                onChange={(e) => {
                  const nextSellerId = e.target.value ? Number(e.target.value) : "";
                  const nextSeller = sellers.find(
                    (seller) => Number(seller.id) === Number(nextSellerId),
                  );

                  setReserveData({
                    ...reserveData,
                    seller_id: nextSellerId,
                    direct_to_developer_rate:
                      reserveData.sale_type === "direct_to_developer"
                        ? getSellerDirectToDeveloperRate(nextSeller)
                        : reserveData.direct_to_developer_rate,
                  });
                }}
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
                  const paymentMode = e.target.value as "cash" | "installment";
                  const nextDownpaymentPercentOption =
                    paymentMode === "installment"
                      ? getValidOption(
                          reserveData.downpayment_percent_option,
                          ["15", "30", "custom"],
                          "30",
                        )
                      : "0";
                  const nextDownpaymentGivesOption =
                    paymentMode === "installment"
                      ? getValidOption(
                          reserveData.downpayment_gives_option,
                          ["1", "2", "3", "custom"],
                          "3",
                        )
                      : "0";
                  const nextDiscountOption =
                    paymentMode === "installment" &&
                    nextDownpaymentGivesOption === "1"
                      ? getValidDiscountOption(
                          reserveData.downpayment_discount_rate_option,
                          "7.5",
                        )
                      : "0";

                  setReserveData({
                    ...reserveData,
                    mode_of_payment: paymentMode,
                    downpayment_amount:
                      paymentMode === "installment"
                        ? reserveData.downpayment_amount
                        : "0",
                    downpayment_percent:
                      paymentMode === "installment"
                        ? nextDownpaymentPercentOption === "custom"
                          ? reserveData.downpayment_percent_custom
                          : nextDownpaymentPercentOption
                        : "0",
                    downpayment_percent_option: nextDownpaymentPercentOption,
                    downpayment_gives:
                      paymentMode === "installment"
                        ? nextDownpaymentGivesOption === "custom"
                          ? reserveData.downpayment_gives_custom
                          : nextDownpaymentGivesOption
                        : "0",
                    downpayment_gives_option: nextDownpaymentGivesOption,
                    downpayment_discount_rate:
                      nextDiscountOption === "custom"
                        ? reserveData.downpayment_discount_rate_custom
                        : nextDiscountOption,
                    downpayment_discount_rate_option: nextDiscountOption,
                    deferred_cash_amount:
                      paymentMode === "cash"
                        ? reserveData.deferred_cash_amount
                        : "0",
                    balloon_payment_amount:
                      paymentMode === "installment"
                        ? reserveData.balloon_payment_amount || "0"
                        : "0",
                    balloon_due_date: "",
                    payment_terms_months:
                      paymentMode === "installment"
                        ? getSelectedNumber(
                            reserveData.payment_terms_months_option,
                            reserveData.payment_terms_months_custom,
                            36,
                          )
                        : "",
                    interest_rate:
                      paymentMode === "installment"
                        ? String(reserveInterestRate)
                        : "0",
                    monthly_amortization: "",
                  });
                  setReserveValidationMessage("");
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
                label="Sale Channel"
                value={reserveData.sale_type}
                onChange={(e) => {
                  const saleType = e.target.value as
                    | "distributed"
                    | "direct_to_developer";

                  setReserveData({
                    ...reserveData,
                    sale_type: saleType,
                    direct_to_developer_rate:
                      saleType === "direct_to_developer"
                        ? reserveData.direct_to_developer_rate ||
                          selectedDirectToDeveloperRate
                        : reserveData.direct_to_developer_rate,
                  });
                }}
              >
                <option value="distributed">Distributed</option>
                <option value="direct_to_developer">Direct to Developer</option>
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
                    });
                    setReserveValidationMessage("");
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
                    });
                    setReserveValidationMessage("");
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
                    });
                    setReserveValidationMessage("");
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
                      });
                      setReserveValidationMessage("");
                    }}
                  />
                ) : null}

                {reserveData.mode_of_payment === "installment" ? (
                  <>
                    <Select
                      label="Downpayment Percentage"
                      value={reserveData.downpayment_percent_option}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          downpayment_percent_option: e.target.value,
                          downpayment_percent:
                            e.target.value === "custom"
                              ? reserveData.downpayment_percent_custom
                              : e.target.value,
                          monthly_amortization: "",
                        });
                        setReserveValidationMessage("");
                      }}
                    >
                      <option value="15">15%</option>
                      <option value="30">30%</option>
                      <option value="custom">Custom %</option>
                    </Select>

                    {reserveData.downpayment_percent_option === "custom" ? (
                      <Input
                        label="Custom Downpayment %"
                        type="number"
                        min={0}
                        step="0.01"
                        value={reserveData.downpayment_percent_custom}
                        onChange={(e) => {
                          setReserveData({
                            ...reserveData,
                            downpayment_percent_custom: e.target.value,
                            downpayment_percent: e.target.value,
                            monthly_amortization: "",
                          });
                          setReserveValidationMessage("");
                        }}
                      />
                    ) : null}

                    <Select
                      label="Downpayment Terms"
                      value={reserveData.downpayment_gives_option}
                      onChange={(e) => {
                        const nextGives = e.target.value;
                        const nextActualGives =
                          nextGives === "custom"
                            ? reserveData.downpayment_gives_custom
                            : nextGives;
                        const nextDiscountOption =
                          nextGives === "1"
                            ? getValidDiscountOption(
                                reserveData.downpayment_discount_rate_option,
                                "7.5",
                              )
                            : "0";

                        setReserveData({
                          ...reserveData,
                          downpayment_gives_option: nextGives,
                          downpayment_gives: nextActualGives,
                          downpayment_discount_rate_option: nextDiscountOption,
                          downpayment_discount_rate:
                            nextDiscountOption === "custom"
                              ? reserveData.downpayment_discount_rate_custom
                              : nextDiscountOption,
                          monthly_amortization: "",
                        });
                        setReserveValidationMessage("");
                      }}
                    >
                      <option value="1">Spot Cash</option>
                      <option value="2">2 Gives</option>
                      <option value="3">3 Gives</option>
                      <option value="custom">Custom Gives</option>
                    </Select>

                    {reserveData.downpayment_gives_option === "custom" ? (
                      <Input
                        label="Custom Gives"
                        type="number"
                        min={1}
                        step="1"
                        value={reserveData.downpayment_gives_custom}
                        onChange={(e) => {
                          setReserveData({
                            ...reserveData,
                            downpayment_gives_custom: e.target.value,
                            downpayment_gives: e.target.value,
                            monthly_amortization: "",
                          });
                          setReserveValidationMessage("");
                        }}
                      />
                    ) : null}

                    {reserveIsSpotDownpayment ? (
                      <Select
                        label="Spot DP Discount"
                        value={reserveData.downpayment_discount_rate_option}
                        onChange={(e) => {
                          setReserveData({
                            ...reserveData,
                            downpayment_discount_rate_option: e.target.value,
                            downpayment_discount_rate:
                              e.target.value === "custom"
                                ? reserveData.downpayment_discount_rate_custom
                                : e.target.value,
                            monthly_amortization: "",
                          });
                          setReserveValidationMessage("");
                        }}
                      >
                        <option value="2.5">2.5%</option>
                        <option value="5">5%</option>
                        <option value="7.5">7.5%</option>
                        <option value="10">10%</option>
                        <option value="custom">Custom %</option>
                      </Select>
                    ) : null}

                    {reserveIsSpotDownpayment &&
                    reserveData.downpayment_discount_rate_option ===
                      "custom" ? (
                      <Input
                        label="Custom DP Discount %"
                        type="number"
                        min={0}
                        step="0.01"
                        value={reserveData.downpayment_discount_rate_custom}
                        onChange={(e) => {
                          setReserveData({
                            ...reserveData,
                            downpayment_discount_rate_custom: e.target.value,
                            downpayment_discount_rate: e.target.value,
                            monthly_amortization: "",
                          });
                          setReserveValidationMessage("");
                        }}
                      />
                    ) : null}

                    <Select
                      label="Monthly Terms"
                      value={reserveData.payment_terms_months_option}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          payment_terms_months_option: e.target.value,
                          payment_terms_months:
                            e.target.value === "custom"
                              ? ""
                              : Number(e.target.value),
                          monthly_amortization: "",
                        });
                        setReserveValidationMessage("");
                      }}
                    >
                      <option value={12}>12 months</option>
                      <option value={18}>18 months</option>
                      <option value={20}>20 months</option>
                      <option value={36}>36 months</option>
                      <option value={60}>60 months</option>
                      <option value="custom">Custom months</option>
                    </Select>

                    {reserveData.payment_terms_months_option === "custom" ? (
                      <Input
                        label="Custom Monthly Terms"
                        type="number"
                        min={1}
                        step="1"
                        value={reserveData.payment_terms_months_custom}
                        onChange={(e) => {
                          setReserveData({
                            ...reserveData,
                            payment_terms_months_custom: e.target.value,
                            payment_terms_months: Number(e.target.value),
                            monthly_amortization: "",
                          });
                          setReserveValidationMessage("");
                        }}
                      />
                    ) : null}

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-500">
                        Interest Rate
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatNumber(reserveInterestRate)}%
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        This is set from the selected listing. Edit the listing to change it.
                      </p>
                    </div>

                    <Input
                      label="Balloon Payment Amount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={reserveData.balloon_payment_amount}
                      onChange={(e) => {
                        setReserveData({
                          ...reserveData,
                          balloon_payment_amount: e.target.value,
                          monthly_amortization: "",
                        });
                        setReserveValidationMessage("");
                      }}
                    />

                    {reserveBalloonPayment > 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-500">
                          Balloon Due Date
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {reserveBalloonDueDate
                            ? formatDate(reserveBalloonDueDate)
                            : "End of term"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Automatically due on the final monthly schedule date.
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      <p className="text-xs font-semibold text-blue-700">
                        Monthly Amortization
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {displayedMonthlyAmortization
                          ? formatMoney(displayedMonthlyAmortization)
                          : "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Automatically calculated from balance, term, balloon, and listing interest rate.
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              {selectedListing ? (
                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    {reserveFormulaRows.map((row) => {
                      const isSelected = reserveFormulaKey === row.key;

                      return (
                        <button
                          className={[
                            "rounded-lg border bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50",
                            isSelected
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200",
                          ].join(" ")}
                          key={row.key}
                          onClick={() =>
                            setReserveFormulaKey(isSelected ? "" : row.key)
                          }
                          type="button"
                        >
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            {row.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {row.value}
                          </p>
                          <p className="mt-1 text-xs text-blue-600">
                            Click to show formula
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedReserveFormula ? (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-slate-700">
                      <p className="font-bold text-slate-900">
                        {selectedReserveFormula.label} Formula
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-700">
                        {selectedReserveFormula.formula}
                      </p>
                      {selectedReserveFormula.note ? (
                        <p className="mt-2 text-xs text-slate-600">
                          {selectedReserveFormula.note}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {selectedMainSeller ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Main Seller Commission
                </h3>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <MiniDetail
                    label="Seller"
                    value={selectedMainSeller.full_name}
                  />
                  <MiniDetail
                    label="Role"
                    value={formatText(selectedMainSeller.seller_role)}
                  />
                  <MiniDetail
                    label={
                      reserveData.sale_type === "direct_to_developer"
                        ? "Direct-to-Developer Rate"
                        : "Rate"
                    }
                    value={
                      reserveData.sale_type === "direct_to_developer"
                        ? displayedDirectToDeveloperRate
                          ? `${formatNumber(displayedDirectToDeveloperRate)}%`
                          : "Default rate"
                        : selectedMainSeller.personal_commission_rate ||
                            selectedMainSeller.commission_rate
                          ? `${formatNumber(
                              selectedMainSeller.personal_commission_rate ||
                                selectedMainSeller.commission_rate,
                            )}%`
                          : "-"
                    }
                  />
                </div>
              </div>
            ) : null}

            {reserveData.sale_type === "distributed" ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Automatic Hierarchy Commission Preview
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Distributed sales now use the seller hierarchy and saved
                  pool/split rates. Manual override seller/rate is no longer
                  used here.
                </p>

                {reserveCommissionPreview.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {reserveCommissionPreview.map((row) => (
                      <div
                        key={`${row.label}-${row.seller.id}`}
                        className="rounded-lg border border-blue-100 bg-white p-3"
                      >
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          {row.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {row.seller.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatText(row.seller.seller_role)} •{" "}
                          {formatNumber(row.rate)}%
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-amber-700">
                    Select a seller with saved commission rates to preview the
                    automatic split.
                  </p>
                )}
              </div>
            ) : null}

            {reserveData.sale_type === "direct_to_developer" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Direct to Developer Commission
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Only the selected agent/seller receives commission. Manager,
                  broker, and BNM override releases will not be generated for
                  this sale.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    disabled={!isSuperAdmin}
                    label="Direct-to-Developer Commission Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={displayedDirectToDeveloperRate}
                    onChange={(e) =>
                      setReserveData({
                        ...reserveData,
                        direct_to_developer_rate: e.target.value,
                      })
                    }
                    placeholder={
                      selectedDirectToDeveloperRate || "Use system default"
                    }
                  />
                </div>

                {isSuperAdmin ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Super Admin can override this rate for this reservation only.
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    This rate is controlled by Super Admin. The saved
                    Direct-to-Developer/default seller rate will be used.
                  </p>
                )}
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
              onChange={(e) => {
                const nextSeller = sellers.find(
                  (seller) => Number(seller.id) === Number(e.target.value),
                );

                setEditUnitData({
                  ...editUnitData,
                  seller_id: e.target.value,
                  direct_to_developer_rate:
                    editUnitData.sale_type === "direct_to_developer" &&
                    !editUnitData.direct_to_developer_rate
                      ? getSellerDirectToDeveloperRate(nextSeller)
                      : editUnitData.direct_to_developer_rate,
                });
              }}
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
              label="First Due Date"
              type="date"
              value={editUnitData.due_date}
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  due_date: e.target.value,
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
              label="Sale Channel"
              value={editUnitData.sale_type}
              onChange={(e) => {
                const saleType = e.target.value as
                  | "distributed"
                  | "direct_to_developer";

                setEditUnitData({
                  ...editUnitData,
                  sale_type: saleType,
                  direct_to_developer_rate:
                    saleType === "direct_to_developer" &&
                    !editUnitData.direct_to_developer_rate
                      ? selectedEditDirectToDeveloperRate
                      : editUnitData.direct_to_developer_rate,
                  regenerate_commission:
                    saleType !== editUnitData.sale_type
                      ? true
                      : editUnitData.regenerate_commission,
                });
              }}
            >
              <option value="distributed">Distributed</option>
              <option value="direct_to_developer">Direct to Developer</option>
            </Select>

            <div className="md:col-span-2">
              <UnitBuyerFields
                buyerType={editUnitData.buyer_type}
                coBuyer={editUnitData.co_buyer}
                coBuyerEmployment={editUnitData.co_buyer_employment}
                onBuyerTypeChange={(buyerType) =>
                  setEditUnitData({
                    ...editUnitData,
                    buyer_type: buyerType,
                    co_buyer:
                      buyerType === "single"
                        ? createBlankCoBuyerData()
                        : {
                            ...editUnitData.co_buyer,
                            buyer_role:
                              buyerType === "spouses"
                                ? "spouse"
                                : "second_buyer",
                          },
                    co_buyer_employment:
                      buyerType === "single"
                        ? createBlankEmploymentData("co_buyer")
                        : editUnitData.co_buyer_employment,
                  })
                }
                onCoBuyerChange={(coBuyer) =>
                  setEditUnitData({
                    ...editUnitData,
                    co_buyer: coBuyer,
                  })
                }
                onCoBuyerEmploymentChange={(coBuyerEmployment) =>
                  setEditUnitData({
                    ...editUnitData,
                    co_buyer_employment: coBuyerEmployment,
                  })
                }
              />
            </div>

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
              Recalculate pending commissions
            </label>
          </div>

          {editUnitData.sale_type === "distributed" ? (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Automatic Hierarchy Commission
              </h3>

              <p className="mt-1 text-xs text-slate-600">
                Recalculate only when seller/rates were corrected. This cancels
                old pending commission records and creates new ones using the
                current saved rates. Released commissions and
                cash-advance-linked commissions are locked.
              </p>
            </div>
          ) : null}

          {editUnitData.sale_type === "direct_to_developer" ? (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Direct to Developer Commission
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Direct-to-developer sales generate only the selected seller
                commission. No hierarchy override milestones will be created.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  disabled={!isSuperAdmin}
                  label="Direct-to-Developer Commission Rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={displayedEditDirectToDeveloperRate}
                  onChange={(e) =>
                    setEditUnitData({
                      ...editUnitData,
                      direct_to_developer_rate: e.target.value,
                      regenerate_commission: true,
                    })
                  }
                  placeholder={
                    selectedEditDirectToDeveloperRate || "Use system default"
                  }
                />
              </div>

              {isSuperAdmin ? (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Changing this rate will apply when pending commissions are
                  recalculated. Released commissions stay locked.
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  This rate is controlled by Super Admin.
                </p>
              )}
            </div>
          ) : null}

          <p className="mt-3 text-sm text-slate-500">
            Seller/rate changes are blocked after a commission release is paid
            or when this unit has pending/approved/deducted cash advances.
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
                disabled={
                  changeUnitMutation.isPending ||
                  changeUnitData.new_listing_id === ""
                }
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
            <p className="text-red-600 bg-red-50 px-4 py-1">
              Cannot change unit for cancelled, fully paid, or closed account
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MiniDetail label="Current Unit" value={changeUnit.unit_id} />
              <MiniDetail
                label="Current Project"
                value={changeUnit.project_name}
              />
            </div>

            <div className="space-y-2">
              <Input
                label="New Available Listing"
                value={changeListingSearch}
                onChange={(e) => {
                  setChangeListingSearch(e.target.value);
                  setChangeUnitData({
                    ...changeUnitData,
                    new_listing_id: "",
                  });
                }}
                placeholder="Search unit, project, or lot type"
              />

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredChangeListings.length > 0 ? (
                  filteredChangeListings.map((listing) => {
                    const isSelected =
                      Number(changeUnitData.new_listing_id) ===
                      Number(listing.id);
                    const label = `${listing.unit_id} - ${listing.project_name} - ${formatMoney(listing.total_contract_price)}`;

                    return (
                      <button
                        className={[
                          "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50",
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700",
                        ].join(" ")}
                        key={listing.id}
                        onClick={() => {
                          setChangeUnitData({
                            ...changeUnitData,
                            new_listing_id: listing.id,
                          });
                          setChangeListingSearch(label);
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
                    );
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
                Recalculate pending commissions for the new unit
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
          title={`Start Cancellation - ${cancelUnit.unit_id}`}
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
                {cancelUnitMutation.isPending ? "Starting..." : "Start Cancellation"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert
              variant="warning"
              title="This starts cancellation review only."
              message="The listing will become Pending Cancellation and cannot be sold again until the refund/discontinued settlement is completed and admin clears it for resale."
            />

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

      {settlementUnit ? (() => {
        const totalPaid = safeMoneyNumber(
          settlementUnit.settlement_total_paid_snapshot ||
            settlementUnit.total_paid_by_client ||
            settlementUnit.paid_amount,
        );
        const refundAmount = Math.min(
          Math.max(safeMoneyNumber(settlementData.refund_amount), 0),
          totalPaid,
        );
        const discontinuedAmount = Math.max(totalPaid - refundAmount, 0);
        const settlementStatus =
          settlementUnit.settlement_status || settlementUnit.cancellation_status || "none";
        const needsRefundRelease = settlementStatus === "approved_for_refund";
        const canClearForResale =
          settlementStatus === "settled" ||
          settlementUnit.cancellation_status === "settled";

        return (
          <Modal
            title={`Cancellation Settlement - ${settlementUnit.unit_id}`}
            onClose={() => setSettlementUnit(null)}
            size="lg"
            footer={
              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={() => setSettlementUnit(null)}>Close</Button>
                <Button
                  disabled={settlementMutation.isPending || settlementStatus === "settled"}
                  onClick={handleSaveSettlement}
                >
                  {settlementMutation.isPending ? "Saving..." : "Save Settlement"}
                </Button>
                {needsRefundRelease ? (
                  <Button
                    disabled={refundReleaseMutation.isPending}
                    onClick={handleReleaseRefund}
                    variant="secondary"
                  >
                    {refundReleaseMutation.isPending
                      ? "Releasing..."
                      : "Mark Refund Released"}
                  </Button>
                ) : null}
                {canClearForResale ? (
                  <Button
                    disabled={
                      clearForResaleMutation.isPending ||
                      Boolean(settlementUnit.cleared_for_resale_at)
                    }
                    onClick={handleClearForResale}
                    variant="secondary"
                  >
                    {clearForResaleMutation.isPending
                      ? "Clearing..."
                      : settlementUnit.cleared_for_resale_at
                        ? "Already Cleared"
                        : "Clear for Resale"}
                  </Button>
                ) : null}
              </div>
            }
          >
            <div className="space-y-4">
              <Alert
                variant="warning"
                title="Set the refund amount before completing cancellation."
                message="Discontinued Money is the verified payment amount that will not be refunded and will remain with the company. The listing can only return to Available after settlement is settled and Clear for Resale is clicked."
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Total Verified Paid
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {formatMoney(totalPaid)}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Refund Amount
                  </p>
                  <p className="mt-1 text-lg font-black text-blue-900">
                    {formatMoney(refundAmount)}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-700">
                    Discontinued Money
                  </p>
                  <p className="mt-1 text-lg font-black text-amber-900">
                    {formatMoney(discontinuedAmount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Refund Amount"
                  min={0}
                  max={totalPaid}
                  step="0.01"
                  type="number"
                  value={settlementData.refund_amount}
                  onChange={(e) =>
                    setSettlementData({
                      ...settlementData,
                      refund_amount: e.target.value,
                    })
                  }
                />
                <div>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Settlement Status
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    {formatText(settlementStatus)}
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Remarks / Reason
                </span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={settlementData.cancellation_remarks}
                  onChange={(e) =>
                    setSettlementData({
                      ...settlementData,
                      cancellation_remarks: e.target.value,
                    })
                  }
                  placeholder="Example: Client requested partial refund; reservation fee is discontinued money."
                />
              </label>
            </div>
          </Modal>
        );
      })() : null}

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
                <Button
                  icon={<FiDownload />}
                  disabled={downloadDocumentsMutation.isPending}
                  onClick={() =>
                    downloadDocumentsMutation.mutate(selectedDocumentsUnit)
                  }
                >
                  Download Docs Images
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

          {uploadDocumentMutation.error ? (
            <Alert
              variant="error"
              title={
                uploadDocumentMutation.error instanceof Error
                  ? uploadDocumentMutation.error.message
                  : "Failed to upload document"
              }
            />
          ) : null}

          {downloadDocumentsMutation.error ? (
            <Alert
              variant="error"
              title={
                downloadDocumentsMutation.error instanceof Error
                  ? downloadDocumentsMutation.error.message
                  : "Failed to download document PDF"
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
                      <th className="px-4 py-3 text-left">Uploaded File</th>
                      <th className="px-4 py-3 text-left">Submitted Date</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientDocuments.map((document) => {
                      const submittedDate =
                        document.status === "not_submitted"
                          ? null
                          : document.reviewed_at || document.updated_at;

                      return (
                        <tr
                          key={document.id}
                          className="border-b border-slate-100"
                        >
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
                            {document.file_name ? (
                              <a
                                className="font-semibold text-blue-600 hover:text-blue-700"
                                href={`${API_URL}/client-documents/${document.id}/file`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {document.file_name}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {submittedDate ? formatDate(submittedDate) : "-"}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex min-w-[220px] flex-col gap-2">
                              <Select
                                aria-label={`Update ${document.name} status`}
                                disabled={updateDocumentMutation.isPending}
                                value={document.status}
                                onChange={(e) =>
                                  handleDocumentStatusChange(
                                    document,
                                    e.target.value,
                                  )
                                }
                              >
                                {getDocumentStatusOptions(document.status).map(
                                  (option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ),
                                )}
                              </Select>

                              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
                                <FiUpload />
                                {uploadDocumentMutation.isPending
                                  ? "Uploading..."
                                  : "Upload"}
                                <input
                                  className="hidden"
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  disabled={uploadDocumentMutation.isPending}
                                  onChange={(event) =>
                                    handleDocumentFileChange(
                                      document,
                                      event.target.files?.[0] || null,
                                    )
                                  }
                                />
                              </label>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableContainer>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
};


const ReserveDocumentRequirementsSection = ({
  documents,
  setDocuments,
  documentLibrary,
  isLoading,
  buyerType,
}: {
  documents: ReserveDocumentRequirement[];
  setDocuments: (documents: ReserveDocumentRequirement[]) => void;
  documentLibrary: LibraryDocument[];
  isLoading: boolean;
  buyerType: BuyerType;
}) => {
  const [documentSearch, setDocumentSearch] = useState("");

  const selectedDocumentIds = new Set(
    documents
      .map((document) => document.document_id)
      .filter(Boolean)
      .map(Number),
  );

  const filteredDocumentLibrary = documentLibrary.filter((document) =>
    [document.name, document.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(documentSearch.toLowerCase().trim()),
  );

  const updateDocument = (
    index: number,
    updates: Partial<ReserveDocumentRequirement>,
  ) => {
    setDocuments(
      documents.map((document, i) =>
        i === index ? { ...document, ...updates } : document,
      ),
    );
  };

  const addDocument = (documentId: number) => {
    const libraryDocument = documentLibrary.find(
      (document) => Number(document.id) === Number(documentId),
    );

    if (!libraryDocument || selectedDocumentIds.has(Number(documentId))) return;

    setDocuments([
      ...documents,
      {
        document_id: libraryDocument.id,
        name: libraryDocument.name,
        description: libraryDocument.description,
        can_reuse: libraryDocument.can_reuse,
        is_required: true,
        status: "active",
        sort_order: documents.length + 1,
        source: "client_unit_custom",
      },
    ]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Reservation Document Checklist
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            This becomes the final client-unit checklist for this reservation. Add extra documents when the buyer is married, has a spouse, second buyer, representative, or other special requirement.
          </p>
          {buyerType !== "single" ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Buyer type is {formatText(buyerType)}. Review if spouse/second buyer documents are required.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
            {documents.length} docs
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            {documents.filter((document) => Boolean(document.is_required) && document.status !== "inactive").length} required
          </span>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading listing document defaults...</p>
      ) : null}

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <Input
          onChange={(e) => setDocumentSearch(e.target.value)}
          placeholder="Search and add documents..."
          value={documentSearch}
        />

        <div className="mt-3 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
          {filteredDocumentLibrary.map((document) => {
            const alreadySelected = selectedDocumentIds.has(Number(document.id));

            return (
              <div
                className="rounded-lg border border-slate-200 bg-white p-3"
                key={document.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {document.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {document.description || "No description"}
                    </p>
                  </div>
                  <Button
                    disabled={alreadySelected}
                    onClick={() => addDocument(document.id)}
                  >
                    {alreadySelected ? "Added" : "Add"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
          No documents selected. This reservation will start without a checklist.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {documents.map((document, index) => (
            <div
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_150px_120px_auto]"
              key={`${document.document_id || document.name}-${index}`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{document.name}</p>
                <p className="text-xs text-slate-500">
                  {document.description || formatText(document.source || "client_unit_custom")}
                </p>
                <p className="text-[11px] text-slate-400">
                  Source: {formatText(document.source || "client_unit_custom")}
                </p>
              </div>
              <Select
                label="Requirement"
                onChange={(e) =>
                  updateDocument(index, {
                    is_required: e.target.value === "true",
                  })
                }
                value={String(Boolean(document.is_required))}
              >
                <option value="true">Required</option>
                <option value="false">Optional</option>
              </Select>
              <Select
                label="Status"
                onChange={(e) => updateDocument(index, { status: e.target.value })}
                value={document.status || "active"}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Button onClick={() => removeDocument(index)} variant="danger">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UnitBuyerFields = ({
  buyerType,
  coBuyer,
  coBuyerEmployment,
  onBuyerTypeChange,
  onCoBuyerChange,
  onCoBuyerEmploymentChange,
}: {
  buyerType: BuyerType;
  coBuyer: CoBuyerFormData;
  coBuyerEmployment: EmploymentFormData;
  onBuyerTypeChange: (buyerType: BuyerType) => void;
  onCoBuyerChange: (coBuyer: CoBuyerFormData) => void;
  onCoBuyerEmploymentChange: (employmentData: EmploymentFormData) => void;
}) => {
  const showCoBuyer = buyerType !== "single";
  const sectionTitle =
    buyerType === "spouses" ? "Spouse Details" : "Second Buyer Details";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Buyer Type</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Select
          label="Buyer Type"
          value={buyerType}
          onChange={(e) => onBuyerTypeChange(e.target.value as BuyerType)}
        >
          {buyerTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {showCoBuyer ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-bold text-slate-900">{sectionTitle}</h4>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Select
              label="Buyer Role"
              value={coBuyer.buyer_role}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  buyer_role: e.target.value as BuyerRole,
                })
              }
            >
              <option value="spouse">Spouse</option>
              <option value="second_buyer">Second Buyer</option>
            </Select>

            <Input
              label="Full Name"
              value={coBuyer.full_name}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  full_name: e.target.value,
                })
              }
            />

            <Input
              label="Birth Date"
              type="date"
              value={coBuyer.birth_date}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  birth_date: e.target.value,
                })
              }
            />

            <MiniDetail
              label="Computed Age"
              value={calculateAge(coBuyer.birth_date)}
            />

            <Input
              label="Place of Birth"
              value={coBuyer.place_of_birth}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  place_of_birth: e.target.value,
                })
              }
            />

            <Input
              label="Citizenship"
              value={coBuyer.citizenship}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  citizenship: e.target.value,
                })
              }
            />

            <Select
              label="Gender"
              value={coBuyer.gender}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
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
              value={coBuyer.civil_status}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
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
              label="Mobile Number"
              value={coBuyer.mobile_no}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  mobile_no: e.target.value,
                })
              }
            />

            <Input
              label="Residence Phone Number"
              value={coBuyer.residence_phone_no}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  residence_phone_no: e.target.value,
                })
              }
            />

            <Input
              label="Email"
              type="email"
              value={coBuyer.email}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  email: e.target.value,
                })
              }
            />

            <Input
              label="TIN"
              value={coBuyer.tin}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  tin: e.target.value,
                })
              }
            />

            <Input
              label="Present Address"
              value={coBuyer.present_address}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  present_address: e.target.value,
                })
              }
            />

            <Input
              label="Present ZIP Code"
              value={coBuyer.present_zip_code}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  present_zip_code: e.target.value,
                })
              }
            />

            <Input
              label="Permanent Address"
              value={coBuyer.permanent_address}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  permanent_address: e.target.value,
                })
              }
            />

            <Input
              label="Permanent ZIP Code"
              value={coBuyer.permanent_zip_code}
              onChange={(e) =>
                onCoBuyerChange({
                  ...coBuyer,
                  permanent_zip_code: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-4">
            <EmploymentFields
              data={coBuyerEmployment}
              onChange={(employmentData) =>
                onCoBuyerEmploymentChange({
                  ...employmentData,
                  person_type: "co_buyer",
                  client_buyer_id: coBuyerEmployment.client_buyer_id || null,
                })
              }
              title={`${sectionTitle} — Work / Business Information`}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Single buyer selected. No spouse or second buyer details needed for
          this unit.
        </p>
      )}
    </div>
  );
};

const EmploymentFields = ({
  data,
  onChange,
  title,
}: {
  data: EmploymentFormData;
  onChange: (data: EmploymentFormData) => void;
  title: string;
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
  );
};

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
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
  );
};

const MiniDetail = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  );
};

export default ClientProfile;


