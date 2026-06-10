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
  main_commission_rate_override: string
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
  main_commission_rate_override: string
  sale_type: "distributed" | "direct"
}

const defaultReserveData: ReserveListingData = {
  listing_id: "",
  seller_id: "",
  due_day: "",
  status: "reserved",
  mode_of_payment: "installment",
  sale_type: "distributed",
  main_commission_rate_override: "",
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
  main_commission_rate_override: "",
  sale_type: "distributed",
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
      main_commission_rate_override:
        reserveData.main_commission_rate_override === ""
          ? null
          : Number(reserveData.main_commission_rate_override),
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
      main_commission_rate_override:
        unitData.main_commission_rate_override === ""
          ? null
          : Number(unitData.main_commission_rate_override),
      sale_type: unitData.sale_type,
    }),
  })

  if (!res.ok) throw new Error(await getErrorMessage(res))

  return res.json()
}

const updateClientDocumentStatus = async ({
  documentId,
  status,
}: {
  documentId: number
  status: "submitted" | "not_submitted"
}) => {
  const res = await fetch(`${API_URL}/client-documents/${documentId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
    }),
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

const getSellerRateLabel = (seller?: Seller | null) => {
  if (!seller) return "-"
  if (seller.commission_rate === null || seller.commission_rate === undefined) {
    return "Uses system default"
  }

  return `${formatNumber(seller.commission_rate)}%`
}

const isRequired = (value: number | boolean) => {
  return value === true || value === 1
}

const isSubmitted = (status: string) => {
  return status === "submitted" || status === "approved"
}

const ClientProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const clientId = id || ""

  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [reserveData, setReserveData] =
    useState<ReserveListingData>(defaultReserveData)
  const [editUnit, setEditUnit] = useState<ClientUnit | null>(null)
  const [editUnitData, setEditUnitData] =
    useState<EditUnitData>(defaultEditUnitData)
  const [selectedDocumentsUnit, setSelectedDocumentsUnit] =
    useState<ClientUnit | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: client,
    isLoading: isClientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId),
    enabled: Boolean(clientId),
  })

  const {
    data: clientUnits = [],
    isLoading: areUnitsLoading,
    error: unitsError,
  } = useQuery({
    queryKey: ["client-units", clientId],
    queryFn: () => fetchClientUnits(clientId),
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

  const openReserveModal = () => {
    setReserveData({
      ...defaultReserveData,
      seller_id: client?.default_seller_id || "",
    })
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
      main_commission_rate_override: "",
      sale_type: "distributed",
    })
  }

  const openDocumentsModal = (unit: ClientUnit) => {
    setSelectedDocumentsUnit(unit)
    setSuccessMessage("")
  }

  const handleReserveListing = () => {
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

  const handleDocumentChecklistToggle = (
    document: ClientDocument,
    checked: boolean
  ) => {
    updateDocumentMutation.mutate({
      documentId: document.id,
      status: checked ? "submitted" : "not_submitted",
    })
  }

  const submittedDocumentCount = clientDocuments.filter((document) =>
    isSubmitted(document.status)
  ).length

  const requiredDocumentCount = clientDocuments.filter((document) =>
    isRequired(document.is_required)
  ).length

  const submittedRequiredDocumentCount = clientDocuments.filter(
    (document) => isRequired(document.is_required) && isSubmitted(document.status)
  ).length

  const totalTcp = useMemo(() => {
    return clientUnits.reduce(
      (sum, unit) => sum + Number(unit.total_contract_price || 0),
      0
    )
  }, [clientUnits])

  const totalPaid = useMemo(() => {
    return clientUnits.reduce(
      (sum, unit) => sum + Number(unit.paid_amount || 0),
      0
    )
  }, [clientUnits])

  const totalBalance = Math.max(totalTcp - totalPaid, 0)

  const mutationError =
    reserveMutation.error?.message ||
    updateUnitMutation.error?.message ||
    updateDocumentMutation.error?.message ||
    createChecklistMutation.error?.message ||
    applyReusableMutation.error?.message

  if (isClientLoading || areUnitsLoading) {
    return <LoadingState label="Loading client profile..." />
  }

  if (clientError || unitsError || !client) {
    return <Alert variant="error" title="Failed to load client profile" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiUser />}
        title="Client Profile"
        subtitle="View client details, reserved units, document checklist, and commission setup."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<FiArrowLeft />} onClick={() => navigate("/clients")}>
              Back to Clients
            </Button>
            <Button icon={<FiPlus />} onClick={openReserveModal} variant="primary">
              Reserve Listing
            </Button>
          </div>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Reserved Units" value={clientUnits.length} />
        <StatCard label="Total TCP" value={formatMoney(totalTcp)} />
        <StatCard label="Total Paid" value={formatMoney(totalPaid)} />
        <StatCard label="Balance" value={formatMoney(totalBalance)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <FiUser />
            Client Details
          </h2>

          <div className="space-y-3">
            <Detail label="Full Name" value={client.full_name} />
            <Detail
              label="Spouse / Co-owner"
              value={client.spouse_co_owner_name}
            />
            <Detail label="Email" value={client.email} />
            <Detail label="Contact No." value={client.contact_no} />
            <Detail label="Address" value={client.address} />
            <Detail label="Region" value={client.region} />
            <Detail
              label="Default Seller"
              value={client.default_seller_name || "-"}
            />
            <Detail
              label="Default Seller Role"
              value={formatText(client.default_seller_role)}
            />
            <Detail label="Created At" value={formatDate(client.created_at)} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <FiHome />
            Reserved Units
          </h2>

          <TableContainer>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">MOP</th>
                  <th className="px-4 py-3 text-left">Lot Type</th>
                  <th className="px-4 py-3 text-left">TCP</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Payment %</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Commission</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {clientUnits.map((unit) => (
                  <tr key={unit.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {unit.unit_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {unit.project_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatText(unit.mode_of_payment || "-")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatText(unit.lot_type)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(unit.total_contract_price)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(unit.paid_amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatNumber(unit.payment_percentage || 0)}%
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMoney(unit.balance)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{unit.seller_name || "-"}</p>
                      <p className="text-xs text-slate-500">
                        {formatText(unit.seller_role)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{formatNumber(unit.commission_count || 0)} row/s</p>
                      <p className="text-xs text-slate-500">
                        Gross: {formatMoney(unit.gross_commission_total || 0)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Released:{" "}
                        {formatMoney(unit.released_commission_total || 0)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={unit.document_status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={unit.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          icon={<FiFileText />}
                          onClick={() => openDocumentsModal(unit)}
                        >
                          Docs
                        </Button>
                        <Button
                          icon={<FiEdit2 />}
                          onClick={() => openEditUnitModal(unit)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {clientUnits.length === 0 ? (
                  <tr>
                    <td colSpan={13}>
                      <EmptyState
                        icon={<FiFileText />}
                        title="No reserved units yet"
                        description="Use Reserve Listing to assign an available unit to this client."
                        action={
                          <Button
                            icon={<FiPlus />}
                            onClick={openReserveModal}
                            variant="primary"
                          >
                            Reserve Listing
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableContainer>
        </section>
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
                disabled={reserveMutation.isPending}
                onClick={handleReserveListing}
                variant="primary"
              >
                {reserveMutation.isPending ? "Saving..." : "Reserve Listing"}
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-base font-bold text-slate-900">
                Sale Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Available Listing"
                  value={reserveData.listing_id}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      listing_id: e.target.value ? Number(e.target.value) : "",
                    })
                  }
                  required
                >
                  <option value="">Select listing</option>
                  {availableListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.unit_id} - {listing.project_name} -{" "}
                      {formatMoney(listing.total_contract_price)}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Mode of Payment"
                  value={reserveData.mode_of_payment}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      mode_of_payment: e.target.value as
                        | "cash"
                        | "installment",
                    })
                  }
                >
                  <option value="installment">Installment</option>
                  <option value="cash">Cash</option>
                </Select>

                <Select
                  label="Distributed / Direct"
                  value={reserveData.sale_type}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      sale_type: e.target.value as "distributed" | "direct",
                    })
                  }
                >
                  <option value="distributed">Distributed</option>
                  <option value="direct">Direct</option>
                </Select>

                <Select
                  label="Unit Manager / Main Seller"
                  value={reserveData.seller_id}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      seller_id: e.target.value ? Number(e.target.value) : "",
                    })
                  }
                  required
                >
                  <option value="">Select seller</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.full_name} - {formatText(seller.seller_role)}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Main Rate Override (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={reserveData.main_commission_rate_override}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      main_commission_rate_override: e.target.value,
                    })
                  }
                  placeholder="Optional"
                />

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
                  placeholder="Example: 28"
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
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <MiniDetail
                  label="Main Seller Rate"
                  value={getSellerRateLabel(selectedMainSeller)}
                />
                <MiniDetail
                  label="Selected Listing TCP"
                  value={
                    selectedListing
                      ? formatMoney(selectedListing.total_contract_price)
                      : "-"
                  }
                />
                <MiniDetail
                  label="Estimated Main Commission"
                  value={
                    selectedListing && selectedMainSeller
                      ? formatMoney(
                          Number(selectedListing.total_contract_price || 0) *
                            (Number(
                              reserveData.main_commission_rate_override ||
                                selectedMainSeller.commission_rate ||
                                0
                            ) /
                              100)
                        )
                      : "-"
                  }
                />
              </div>
            </section>

            <section className="rounded-xl border border-dashed border-slate-300 p-4">
              <h3 className="mb-1 text-base font-bold text-slate-900">
                Optional Agent / Override Commission
              </h3>
              <p className="mb-3 text-sm text-slate-500">
                Use this only when another seller should receive a separate commission.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Agent / Override Seller"
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
                  <option value="">No override commission</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.full_name} - {formatText(seller.seller_role)}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Override Rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={reserveData.override_rate}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      override_rate: e.target.value,
                    })
                  }
                  placeholder="Required only if override seller is selected"
                />

                <Input
                  label="Override Notes"
                  value={reserveData.override_notes}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      override_notes: e.target.value,
                    })
                  }
                  placeholder="Optional"
                />

                <MiniDetail
                  label="Override Seller Default Rate"
                  value={getSellerRateLabel(selectedOverrideSeller)}
                />
              </div>
            </section>

            <section className="rounded-xl border border-dashed border-slate-300 p-4">
              <h3 className="mb-1 text-base font-bold text-slate-900">
                Optional Cash Kaliwaan
              </h3>
              <p className="mb-3 text-sm text-slate-500">
                This is outside listing price and TCP. It is only displayed in the
                commission tracker.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  placeholder="Optional"
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

                <Input
                  label="Cash Kaliwaan Notes"
                  value={reserveData.cash_kaliwaan_notes}
                  onChange={(e) =>
                    setReserveData({
                      ...reserveData,
                      cash_kaliwaan_notes: e.target.value,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
            </section>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Seller"
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
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  sale_type: e.target.value as "distributed" | "direct",
                })
              }
            >
              <option value="distributed">Distributed</option>
              <option value="direct">Direct</option>
            </Select>

            <Input
              label="Rate Override for Regeneration (%)"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={editUnitData.main_commission_rate_override}
              onChange={(e) =>
                setEditUnitData({
                  ...editUnitData,
                  main_commission_rate_override: e.target.value,
                })
              }
              placeholder="Optional"
            />

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
              Regenerate commission if seller changed
            </label>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Seller/rate cannot be changed if a commission release was already paid.
          </p>
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