import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiArrowLeft,
  FiCheckSquare,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUser,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatMoney, formatNumber, formatText } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type Client = {
  id: number
  full_name: string
  spouse_co_owner_name: string | null
  email: string | null
  contact_no: string | null
  address: string | null
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
  net_selling_price: number | string
  paid_amount: number | string
  balance: number | string
  due_day: number | null
  status: string
  assigned_user_id: number | null
  assigned_user_name: string | null
  document_status: "complete" | "incomplete" | string
  created_at: string
  updated_at: string
}

type AvailableListing = {
  id: number
  project_id: number
  project_name: string
  cadastral_lot_no: string | null
  unit_id: string
  lot_type: string | null
  lot_area_sqm: number | string
  net_selling_price: number | string
  legal_misc_fee: number | string
  status: string
}

type ClientDocument = {
  id: number
  client_unit_id: number
  document_id: number
  name: string
  description: string | null
  is_required: boolean | number
  can_reuse: boolean | number
  file_url: string | null
  status: "not_submitted" | "submitted" | "approved" | "rejected" | string
  reviewed_by: number | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

type ClientUnitsResponse = {
  client: Client
  units: ClientUnit[]
}

type ReserveListingPayload = {
  clientId: number
  listing_id: number
  due_day: number
}

type UpdateClientDocumentStatusPayload = {
  documentChecklistId: number
  status: string
}

const fetchClientUnits = async (
  clientId: number
): Promise<ClientUnitsResponse> => {
  const res = await fetch(`${API_URL}/clients/${clientId}/units`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const fetchAvailableListings = async (): Promise<AvailableListing[]> => {
  const res = await fetch(`${API_URL}/available-listings`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = await res.json()
  return data.listings
}

const reserveListing = async ({
  clientId,
  listing_id,
  due_day,
}: ReserveListingPayload) => {
  const res = await fetch(`${API_URL}/clients/${clientId}/reserve-listing`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      listing_id,
      due_day,
    }),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const fetchClientUnitDocuments = async (
  clientUnitId: number
): Promise<ClientDocument[]> => {
  const res = await fetch(`${API_URL}/client-units/${clientUnitId}/documents`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = await res.json()
  return data.documents
}

const createChecklist = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/documents/create-checklist`,
    {
      method: "POST",
      credentials: "include",
    }
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateClientDocumentStatus = async ({
  documentChecklistId,
  status,
}: UpdateClientDocumentStatusPayload) => {
  const res = await fetch(
    `${API_URL}/client-documents/${documentChecklistId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const applyExistingDocuments = async (clientUnitId: number) => {
  const res = await fetch(
    `${API_URL}/client-units/${clientUnitId}/documents/apply-existing`,
    {
      method: "POST",
      credentials: "include",
    }
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const ClientListings = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const clientId = Number(id)
  const isValidClientId = Number.isFinite(clientId)

  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [dueDay, setDueDay] = useState(28)
  const [unitPage, setUnitPage] = useState(1)
  const [unitRowsPerPage, setUnitRowsPerPage] = useState(10)
  const [listingPage, setListingPage] = useState(1)
  const [listingRowsPerPage, setListingRowsPerPage] = useState(10)
  const [selectedUnitForDocs, setSelectedUnitForDocs] =
    useState<ClientUnit | null>(null)

  const { data, isLoading, error } = useQuery<ClientUnitsResponse>({
    queryKey: ["client-units", clientId],
    queryFn: () => fetchClientUnits(clientId),
    enabled: isValidClientId,
  })

  const { data: availableListings = [], isLoading: isAvailableListingsLoading } =
    useQuery<AvailableListing[]>({
      queryKey: ["available-listings"],
      queryFn: fetchAvailableListings,
      enabled: isReserveOpen,
    })

  const { data: selectedDocuments = [], isLoading: isDocumentsLoading } =
    useQuery<ClientDocument[]>({
      queryKey: ["client-unit-documents", selectedUnitForDocs?.id],
      queryFn: () => fetchClientUnitDocuments(selectedUnitForDocs!.id),
      enabled: !!selectedUnitForDocs,
    })

  const client = data?.client
  const units = data?.units || []

  const reserveListingMutation = useMutation({
    mutationFn: reserveListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-units", clientId] })
      queryClient.invalidateQueries({ queryKey: ["available-listings"] })
      setIsReserveOpen(false)
      setSearchInput("")
      setDueDay(28)
      setListingPage(1)
    },
  })

  const createChecklistMutation = useMutation({
    mutationFn: createChecklist,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-unit-documents", selectedUnitForDocs?.id],
      })
      queryClient.invalidateQueries({ queryKey: ["client-units", clientId] })
    },
  })

  const updateDocumentStatusMutation = useMutation({
    mutationFn: updateClientDocumentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-unit-documents", selectedUnitForDocs?.id],
      })
      queryClient.invalidateQueries({ queryKey: ["client-units", clientId] })
    },
  })

  const applyExistingDocumentsMutation = useMutation({
    mutationFn: applyExistingDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-unit-documents", selectedUnitForDocs?.id],
      })
      queryClient.invalidateQueries({ queryKey: ["client-units", clientId] })
    },
  })

  const filteredAvailableListings = useMemo(() => {
    return availableListings.filter((listing) => {
      const search = searchInput.toLowerCase().trim()

      return (
        search === "" ||
        listing.project_name.toLowerCase().includes(search) ||
        (listing.cadastral_lot_no || "").toLowerCase().includes(search) ||
        listing.unit_id.toLowerCase().includes(search) ||
        (listing.lot_type || "").toLowerCase().includes(search)
      )
    })
  }, [availableListings, searchInput])

  const paginatedUnits = paginateRows(units, unitPage, unitRowsPerPage)
  const paginatedListings = paginateRows(
    filteredAvailableListings,
    listingPage,
    listingRowsPerPage
  )
  const totalValue = units.reduce(
    (sum, unit) => sum + Number(unit.net_selling_price || 0),
    0
  )
  const totalPaid = units.reduce(
    (sum, unit) => sum + Number(unit.paid_amount || 0),
    0
  )
  const totalBalance = units.reduce(
    (sum, unit) => sum + Number(unit.balance || 0),
    0
  )
  const completedDocs = units.filter(
    (unit) => unit.document_status === "complete"
  ).length

  const getMutationError = (...mutations: { error: unknown }[]) => {
    const mutationWithError = mutations.find((mutation) => mutation.error)

    if (!mutationWithError) return ""

    return mutationWithError.error instanceof Error
      ? mutationWithError.error.message
      : "Something went wrong"
  }

  if (!isValidClientId) {
    return <Alert title="Invalid client ID" variant="error" />
  }

  if (isLoading) {
    return <LoadingState label="Loading client units..." />
  }

  if (error) {
    return <Alert title="Failed to load client units" variant="error" />
  }

  if (!client) {
    return <Alert title="Client not found" variant="error" />
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        icon={<FiUser />}
        title={client.full_name}
        subtitle="Client unit reservations and physical document checklist"
        actions={
          <>
            <Button icon={<FiArrowLeft />} onClick={() => navigate("/clients")}>
              Back
            </Button>
            <Button
              icon={<FiPlus />}
              onClick={() => setIsReserveOpen(true)}
              variant="primary"
            >
              Reserve Listing
            </Button>
          </>
        }
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Spouse / Co-owner" value={client.spouse_co_owner_name} />
          <InfoItem label="Email" value={client.email} />
          <InfoItem label="Contact" value={client.contact_no} />
          <InfoItem label="Address" value={client.address} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Reserved Units" value={formatNumber(units.length)} />
        <StatCard label="Contract Value" value={formatMoney(totalValue)} />
        <StatCard label="Paid Amount" value={formatMoney(totalPaid)} />
        <StatCard
          label="Open Balance"
          value={formatMoney(totalBalance)}
          description={`${completedDocs} complete document checklist(s)`}
        />
      </div>

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Unit ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Project
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Lot Type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Area
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Net Price
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Paid
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Balance
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Documents
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedUnits.map((unit) => (
              <tr key={unit.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {unit.unit_id}
                </td>
                <td className="px-4 py-3 text-slate-600">{unit.project_name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {unit.lot_type || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatNumber(unit.lot_area_sqm)} sqm
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(unit.net_selling_price)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(unit.paid_amount)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(unit.balance)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={unit.status} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={unit.document_status} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    icon={<FiFileText />}
                    onClick={() => {
                      setSelectedUnitForDocs(unit)
                      createChecklistMutation.mutate(unit.id)
                    }}
                  >
                    Documents
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {units.length === 0 ? (
          <EmptyState
            title="No units reserved"
            description="Reserve an available listing to connect this client to a unit."
          />
        ) : null}
      </TableContainer>

      <Pagination
        page={unitPage}
        rowsPerPage={unitRowsPerPage}
        totalRows={units.length}
        onPageChange={setUnitPage}
        onRowsPerPageChange={setUnitRowsPerPage}
      />

      {isReserveOpen ? (
        <Modal
          title="Reserve Available Listing"
          onClose={() => {
            setSearchInput("")
            setIsReserveOpen(false)
            setDueDay(28)
          }}
        >
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
            <Input
              icon={<FiSearch />}
              placeholder="Search project, unit ID, cadastral lot no, lot type..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setListingPage(1)
              }}
            />
            <Input
              label="Due Day"
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
            />
            <Button icon={<FiRefreshCw />} onClick={() => setSearchInput("")}>
              Reset
            </Button>
          </div>

          {reserveListingMutation.error instanceof Error ? (
            <Alert title={reserveListingMutation.error.message} variant="error" />
          ) : null}

          {isAvailableListingsLoading ? (
            <LoadingState label="Loading available listings..." />
          ) : (
            <>
              <TableContainer>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Unit ID
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Cadastral Lot No.
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Lot Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Area
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Net Price
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedListings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {listing.unit_id}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {listing.project_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {listing.cadastral_lot_no || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {listing.lot_type || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatNumber(listing.lot_area_sqm)} sqm
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatMoney(listing.net_selling_price)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            disabled={reserveListingMutation.isPending}
                            onClick={() =>
                              reserveListingMutation.mutate({
                                clientId,
                                listing_id: listing.id,
                                due_day: dueDay,
                              })
                            }
                            variant="primary"
                          >
                            {reserveListingMutation.isPending
                              ? "Reserving..."
                              : "Reserve"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAvailableListings.length === 0 ? (
                  <EmptyState title="No available listings found" />
                ) : null}
              </TableContainer>
              <Pagination
                page={listingPage}
                rowsPerPage={listingRowsPerPage}
                totalRows={filteredAvailableListings.length}
                onPageChange={setListingPage}
                onRowsPerPageChange={setListingRowsPerPage}
              />
            </>
          )}
        </Modal>
      ) : null}

      {selectedUnitForDocs ? (
        <Modal
          title="Client Documents"
          onClose={() => setSelectedUnitForDocs(null)}
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                {selectedUnitForDocs.unit_id} - {selectedUnitForDocs.project_name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Document status: {formatText(selectedUnitForDocs.document_status)}
              </p>
            </div>
            <Button
              disabled={applyExistingDocumentsMutation.isPending}
              icon={<FiCheckSquare />}
              onClick={() =>
                applyExistingDocumentsMutation.mutate(selectedUnitForDocs.id)
              }
            >
              {applyExistingDocumentsMutation.isPending
                ? "Applying..."
                : "Apply Existing Docs"}
            </Button>
          </div>

          {getMutationError(
            createChecklistMutation,
            applyExistingDocumentsMutation,
            updateDocumentStatusMutation
          ) ? (
            <Alert
              title={getMutationError(
                createChecklistMutation,
                applyExistingDocumentsMutation,
                updateDocumentStatusMutation
              )}
              variant="error"
            />
          ) : null}

          {isDocumentsLoading ? (
            <LoadingState label="Loading documents..." />
          ) : (
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Required
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Reusable
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Reviewed By
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Reviewed At
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedDocuments.map((doc, index) => {
                    const isSubmitted =
                      doc.status === "submitted" || doc.status === "approved"

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {doc.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {Boolean(doc.is_required) ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {Boolean(doc.can_reuse) ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {doc.reviewed_by_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(doc.reviewed_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            disabled={updateDocumentStatusMutation.isPending}
                            onClick={() =>
                              updateDocumentStatusMutation.mutate({
                                documentChecklistId: doc.id,
                                status: isSubmitted
                                  ? "not_submitted"
                                  : "submitted",
                              })
                            }
                          >
                            {isSubmitted ? "Mark Pending" : "Mark Submitted"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {selectedDocuments.length === 0 ? (
                <EmptyState title="No documents found" />
              ) : null}
            </TableContainer>
          )}
        </Modal>
      ) : null}
    </div>
  )
}

const InfoItem = ({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-800">{value || "-"}</p>
    </div>
  )
}

export default ClientListings
