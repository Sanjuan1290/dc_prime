import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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

const getErrorMessage = async (res: Response) => {
  try {
    const data = await res.json()
    return data.message || "Something went wrong"
  } catch {
    return "Something went wrong"
  }
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

  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [dueDay, setDueDay] = useState(28)
  const [selectedUnitForDocs, setSelectedUnitForDocs] =
    useState<ClientUnit | null>(null)

  const isValidClientId = Number.isFinite(clientId)

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

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatNumber = (value: number | string) => {
    return new Intl.NumberFormat("en-PH").format(Number(value || 0))
  }

  const filteredAvailableListings = availableListings.filter((listing) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      listing.project_name.toLowerCase().includes(search) ||
      (listing.cadastral_lot_no || "").toLowerCase().includes(search) ||
      listing.unit_id.toLowerCase().includes(search) ||
      (listing.lot_type || "").toLowerCase().includes(search)
    )
  })

  const getMutationError = (...mutations: { error: unknown }[]) => {
    const mutationWithError = mutations.find((mutation) => mutation.error)

    if (!mutationWithError) return ""

    return mutationWithError.error instanceof Error
      ? mutationWithError.error.message
      : "Something went wrong"
  }

  if (!isValidClientId) {
    return <p className="p-4">Invalid client ID</p>
  }

  if (isLoading) {
    return <p className="p-4">Loading client units...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load client units</p>
  }

  if (!client) {
    return <p className="p-4">Client not found</p>
  }

  return (
    <div className="p-4">
      <button
        onClick={() => navigate("/clients")}
        className="mb-4 border border-black px-4 py-2 hover:bg-gray-200"
      >
        Back
      </button>

      <div className="mb-6 border border-black p-4">
        <h1 className="text-3xl font-bold">{client.full_name}</h1>

        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <p>
            <b>Spouse / Co-owner:</b> {client.spouse_co_owner_name || "-"}
          </p>
          <p>
            <b>Email:</b> {client.email || "-"}
          </p>
          <p>
            <b>Contact:</b> {client.contact_no || "-"}
          </p>
          <p>
            <b>Address:</b> {client.address || "-"}
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Client Units</h2>

        <button
          onClick={() => setIsReserveOpen(true)}
          className="border border-black px-4 py-2 hover:bg-gray-200"
        >
          Reserve a Listing
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">
                Unit ID ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Project ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Lot Type ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Area ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Net Price ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Paid ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Balance ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Document Status ↕
              </th>
              <th className="px-4 py-2 text-left">Action ↕</th>
            </tr>
          </thead>

          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {unit.unit_id}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {unit.project_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {unit.lot_type || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatNumber(unit.lot_area_sqm)} sqm
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(unit.net_selling_price)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(unit.paid_amount)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(unit.balance)}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {unit.status}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {unit.document_status}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      setSelectedUnitForDocs(unit)
                      createChecklistMutation.mutate(unit.id)
                    }}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    View Documents
                  </button>
                </td>
              </tr>
            ))}

            {units.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-600">
                  No units reserved for this client
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isReserveOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-black bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold">Reserve Available Listing</h2>

              <button
                onClick={() => {
                  setSearchInput("")
                  setIsReserveOpen(false)
                  setDueDay(28)
                }}
                className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                placeholder="Search available listing by project, unit ID, cadastral lot no, lot type..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border border-black px-3 py-2 md:w-[500px]"
              />

              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className="border border-black px-3 py-2 md:w-32"
                placeholder="Due day"
              />

              <button
                onClick={() => setSearchInput("")}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Reset
              </button>
            </div>

            {reserveListingMutation.isError && (
              <p className="mb-3 border border-black px-4 py-2 text-red-600">
                {reserveListingMutation.error.message}
              </p>
            )}

            {isAvailableListingsLoading ? (
              <p>Loading available listings...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-black text-sm">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="border-r border-black px-4 py-2 text-left">
                        Unit ID ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Project ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Cadastral Lot No. ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Lot Type ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Area ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Net Price ↕
                      </th>
                      <th className="px-4 py-2 text-left">Action ↕</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAvailableListings.map((listing) => (
                      <tr key={listing.id} className="border-b border-black">
                        <td className="border-r border-black px-4 py-2">
                          {listing.unit_id}
                        </td>

                        <td className="border-r border-black px-4 py-2">
                          {listing.project_name}
                        </td>

                        <td className="border-r border-black px-4 py-2">
                          {listing.cadastral_lot_no || "-"}
                        </td>

                        <td className="border-r border-black px-4 py-2">
                          {listing.lot_type || "-"}
                        </td>

                        <td className="border-r border-black px-4 py-2">
                          {formatNumber(listing.lot_area_sqm)} sqm
                        </td>

                        <td className="border-r border-black px-4 py-2">
                          {formatMoney(listing.net_selling_price)}
                        </td>

                        <td className="px-4 py-2">
                          <button
                            disabled={reserveListingMutation.isPending}
                            onClick={() =>
                              reserveListingMutation.mutate({
                                clientId,
                                listing_id: listing.id,
                                due_day: dueDay,
                              })
                            }
                            className="border border-black px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
                          >
                            {reserveListingMutation.isPending
                              ? "Reserving..."
                              : "Reserve"}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredAvailableListings.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-600"
                        >
                          No available listings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedUnitForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col border border-black bg-white">
            <div className="border-b border-black p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Client Documents</h2>
                  <p className="text-sm text-gray-600">
                    {selectedUnitForDocs.unit_id} -{" "}
                    {selectedUnitForDocs.project_name}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={applyExistingDocumentsMutation.isPending}
                    onClick={() =>
                      applyExistingDocumentsMutation.mutate(
                        selectedUnitForDocs.id
                      )
                    }
                    className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                  >
                    {applyExistingDocumentsMutation.isPending
                      ? "Applying..."
                      : "Apply Existing Docs"}
                  </button>

                  <button
                    onClick={() => setSelectedUnitForDocs(null)}
                    className="border border-black px-4 py-2 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-black p-4">
              <p>
                <b>Document Status:</b>{" "}
                <span className="capitalize">
                  {selectedUnitForDocs.document_status}
                </span>
              </p>

              <p className="text-sm text-gray-600">
                Mark each document as submitted after the admin checks the
                physical copy.
              </p>

              {getMutationError(
                createChecklistMutation,
                applyExistingDocumentsMutation,
                updateDocumentStatusMutation
              ) && (
                <p className="mt-2 border border-black px-4 py-2 text-red-600">
                  {getMutationError(
                    createChecklistMutation,
                    applyExistingDocumentsMutation,
                    updateDocumentStatusMutation
                  )}
                </p>
              )}
            </div>

            <div className="overflow-y-auto p-4">
              {isDocumentsLoading ? (
                <p>Loading documents...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-black text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-black">
                        <th className="border-r border-black px-4 py-2 text-left">
                          No. ↕
                        </th>
                        <th className="border-r border-black px-4 py-2 text-left">
                          Document ↕
                        </th>
                        <th className="border-r border-black px-4 py-2 text-left">
                          Required ↕
                        </th>
                        <th className="border-r border-black px-4 py-2 text-left">
                          Reusable ↕
                        </th>
                        <th className="border-r border-black px-4 py-2 text-left">
                          Status ↕
                        </th>
                        <th className="border-r border-black px-4 py-2 text-left">
                          Reviewed By ↕
                        </th>
                        <th className="border-r border-black px-4 py-2 text-left">
                          Reviewed At ↕
                        </th>
                        <th className="px-4 py-2 text-left">Action ↕</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedDocuments.map((doc, index) => {
                        const isSubmitted =
                          doc.status === "submitted" || doc.status === "approved"

                        return (
                          <tr key={doc.id} className="border-b border-black">
                            <td className="border-r border-black px-4 py-2">
                              {index + 1}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {doc.name}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {Boolean(doc.is_required) ? "Yes" : "No"}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {Boolean(doc.can_reuse) ? "Yes" : "No"}
                            </td>

                            <td className="border-r border-black px-4 py-2 capitalize">
                              {doc.status.replace("_", " ")}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {doc.reviewed_by_name || "-"}
                            </td>

                            <td className="border-r border-black px-4 py-2">
                              {doc.reviewed_at || "-"}
                            </td>

                            <td className="px-4 py-2">
                              <button
                                disabled={updateDocumentStatusMutation.isPending}
                                onClick={() =>
                                  updateDocumentStatusMutation.mutate({
                                    documentChecklistId: doc.id,
                                    status: isSubmitted
                                      ? "not_submitted"
                                      : "submitted",
                                  })
                                }
                                className="border border-black px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
                              >
                                {isSubmitted
                                  ? "Mark Not Submitted"
                                  : "Mark Submitted"}
                              </button>
                            </td>
                          </tr>
                        )
                      })}

                      {selectedDocuments.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-center text-gray-600"
                          >
                            No documents found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-black p-4 text-sm text-gray-600">
              This is a physical checklist. No file upload is required unless you
              want digital document storage later.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientListings