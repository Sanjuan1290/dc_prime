import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  FiArrowLeft,
  FiEdit2,
  FiFileText,
  FiHome,
  FiPlus,
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
} from "../utils/formatters"

type Client = {
  id: number
  full_name: string
  spouse_co_owner_name: string | null
  email: string | null
  contact_no: string | null
  address: string | null
  region: string | null
  default_seller_id?: number | null
  default_seller_name?: string | null
  default_seller_role?: string | null
  default_seller_commission_rate?: number | string | null
  created_at: string
  updated_at: string
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
  status: string
  assigned_user_id: number | null
  assigned_user_name: string | null
  seller_id: number | null
  seller_name: string | null
  seller_role: string | null
  seller_commission_rate?: number | string | null
  sale_type?: "distributed" | "direct" | string | null
  reports_under: string | null
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
  due_day: number | ""
  status: string
  mode_of_payment: "cash" | "installment"
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

const defaultReserveData: ReserveListingData = {
  listing_id: "",
  seller_id: "",
  due_day: "",
  status: "reserved",
  mode_of_payment: "installment",
  sale_type: "distributed",
  override_seller_id: "",
  override_rate: "",
  override_notes: "",
  cash_kaliwaan_amount: "",
  cash_kaliwaan_date: "",
  cash_kaliwaan_notes: "",
}

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

const fetchClient = async (clientId: string) => {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    credentials: "include",
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  const data = (await res.json()) as ClientResponse
  return data.client || data.data
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
      due_day: reserveData.due_day || null,
      status: reserveData.status,
      mode_of_payment: reserveData.mode_of_payment,
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

const ClientProfile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: clientId } = useParams()

  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [reserveData, setReserveData] = useState<ReserveListingData>(
    defaultReserveData
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

  const {
    data: client,
    isLoading: isClientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId || ""),
    enabled: Boolean(clientId),
  })

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
      setReserveData(defaultReserveData)
      setSuccessMessage("Listing reserved and commission generated successfully")
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

  const openReserveModal = () => {
    setReserveData({
      ...defaultReserveData,
      seller_id: client?.default_seller_id || "",
    })
    setListingSearch("")
    setSuccessMessage("")
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

    reserveMutation.mutate({
      clientId,
      reserveData,
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

  const handleDocumentChecklistToggle = (
    document: ClientDocument,
    checked: boolean
  ) => {
    updateDocumentMutation.mutate({
      clientDocumentId: document.id,
      status: checked ? "submitted" : "not_submitted",
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

      <div className="mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Client Units</h2>
          <Button icon={<FiPlus />} onClick={openReserveModal} variant="primary">
            Reserve Listing
          </Button>
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
                  <th className="px-4 py-3 text-left">Due Day</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {clientUnits.map((unit) => (
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
                      {unit.due_day || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        className="font-semibold text-blue-600 hover:text-blue-700"
                        onClick={() => openDocumentsModal(unit)}
                        type="button"
                      >
                        {formatText(unit.document_status || "incomplete")}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={unit.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
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
                ))}
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
            <div className="space-y-2">
              <Input
                label="Search Available Listing"
                value={listingSearch}
                onChange={(e) => {
                  setListingSearch(e.target.value)
                  setReserveData({
                    ...reserveData,
                    listing_id: "",
                  })
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
                          })
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
                onChange={(e) =>
                  setReserveData({
                    ...reserveData,
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
                value={reserveData.due_day}
                onChange={(e) =>
                  setReserveData({
                    ...reserveData,
                    due_day: e.target.value ? Number(e.target.value) : "",
                  })
                }
              />

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
                  Create Checklist
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
                  Create Checklist
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
                      <th className="px-4 py-3 text-left">Submitted</th>
                      <th className="px-4 py-3 text-left">Document</th>
                      <th className="px-4 py-3 text-left">Required</th>
                      <th className="px-4 py-3 text-left">Reusable</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Updated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientDocuments.map((document) => (
                      <tr key={document.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSubmitted(document.status)}
                            disabled={updateDocumentMutation.isPending}
                            onChange={(e) =>
                              handleDocumentChecklistToggle(
                                document,
                                e.target.checked
                              )
                            }
                            className="h-5 w-5"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {document.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {document.description || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {isRequired(document.is_required) ? "Yes" : "No"}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {isRequired(document.can_reuse) ? "Yes" : "No"}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              isSubmitted(document.status)
                                ? "submitted"
                                : "not_submitted"
                            }
                          />
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(document.updated_at)}
                        </td>
                      </tr>
                    ))}
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