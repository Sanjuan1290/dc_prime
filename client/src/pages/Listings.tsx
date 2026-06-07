import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type ListingStatus = "available" | "reserved" | "hold" | "sold" | "inactive" | string

type Listing = {
  id: number
  project_id: number
  project_name: string
  cadastral_lot_no: string | null
  unit_id: string
  lot_type: string | null
  promo_discount: number | string
  downpayment: number | string
  reservation_fee: number | string
  price_per_sqm: number | string
  lot_area_sqm: number | string
  net_selling_price: number | string
  legal_misc_fee: number | string
  status: ListingStatus
  created_at: string
  updated_at: string
}

type Project = {
  id: number
  name: string
}

type ListingFormData = {
  project_id: number
  cadastral_lot_no: string
  unit_id: string
  lot_type: string
  promo_discount: number
  downpayment: number
  reservation_fee: number
  price_per_sqm: number
  lot_area_sqm: number
  net_selling_price: number
  legal_misc_fee: number
  status: ListingStatus
}

type ListingsResponse = {
  listings: Listing[]
}

type ProjectsResponse = {
  projects: Project[]
}

const defaultListingFormData: ListingFormData = {
  project_id: 0,
  cadastral_lot_no: "",
  unit_id: "",
  lot_type: "",
  promo_discount: 0,
  downpayment: 0,
  reservation_fee: 0,
  price_per_sqm: 0,
  lot_area_sqm: 0,
  net_selling_price: 0,
  legal_misc_fee: 0,
  status: "available",
}

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Hold", value: "hold" },
  { label: "Sold", value: "sold" },
  { label: "Inactive", value: "inactive" },
]

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }
  } catch {
    return "Request failed"
  }

  return "Request failed"
}

const fetchListings = async () => {
  const response = await fetch(`${API_URL}/listings`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ListingsResponse

  return data.listings
}

const fetchProjects = async () => {
  const response = await fetch(`${API_URL}/projects`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ProjectsResponse

  return data.projects
}

const createListing = async (listingData: ListingFormData) => {
  const response = await fetch(`${API_URL}/listings`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listingData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

const updateListing = async ({
  id,
  listingData,
}: {
  id: number
  listingData: ListingFormData
}) => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listingData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

const listingToFormData = (listing: Listing): ListingFormData => ({
  project_id: listing.project_id,
  cadastral_lot_no: listing.cadastral_lot_no || "",
  unit_id: listing.unit_id,
  lot_type: listing.lot_type || "",
  promo_discount: Number(listing.promo_discount || 0),
  downpayment: Number(listing.downpayment || 0),
  reservation_fee: Number(listing.reservation_fee || 0),
  price_per_sqm: Number(listing.price_per_sqm || 0),
  lot_area_sqm: Number(listing.lot_area_sqm || 0),
  net_selling_price: Number(listing.net_selling_price || 0),
  legal_misc_fee: Number(listing.legal_misc_fee || 0),
  status: listing.status,
})

const Listings = () => {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [lotTypeFilter, setLotTypeFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewListing, setViewListing] = useState<Listing | null>(null)
  const [editListing, setEditListing] = useState<Listing | null>(null)
  const [formData, setFormData] = useState<ListingFormData>(defaultListingFormData)
  const [editFormData, setEditFormData] = useState<ListingFormData>(defaultListingFormData)

  const {
    data: listings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  const createListingMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      setIsAddOpen(false)
      resetForm()
    },
  })

  const updateListingMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      setEditListing(null)
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

  const projectFormDefault = () => {
    return projects[0]?.id ?? 0
  }

  const resetForm = () => {
    setFormData({
      ...defaultListingFormData,
      project_id: projectFormDefault(),
    })
  }

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setProjectFilter("all")
    setLotTypeFilter("all")
  }

  const openAddModal = () => {
    setFormData({
      ...defaultListingFormData,
      project_id: projectFormDefault(),
    })
    setIsAddOpen(true)
  }

  const openEditModal = (listing: Listing) => {
    setEditListing(listing)
    setEditFormData(listingToFormData(listing))
  }

  const handleAddListing = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    createListingMutation.mutate(formData)
  }

  const handleUpdateListing = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editListing) return

    updateListingMutation.mutate({
      id: editListing.id,
      listingData: editFormData,
    })
  }

  const filteredListings = listings.filter((listing) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      listing.unit_id.toLowerCase().includes(search) ||
      listing.project_name.toLowerCase().includes(search) ||
      (listing.cadastral_lot_no || "").toLowerCase().includes(search) ||
      (listing.lot_type || "").toLowerCase().includes(search) ||
      listing.status.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter

    const matchesProject =
      projectFilter === "all" || listing.project_id === Number(projectFilter)

    const matchesLotType =
      lotTypeFilter === "all" || listing.lot_type === lotTypeFilter

    return matchesSearch && matchesStatus && matchesProject && matchesLotType
  })

  const countByStatus = (status: string) => {
    return listings.filter((listing) => listing.status === status).length
  }

  const lotTypes = [
    ...new Set(listings.map((listing) => listing.lot_type).filter(Boolean)),
  ] as string[]

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Listings / Units</h1>
        <p className="text-sm text-gray-600">
          Live inventory from MySQL with editable listing records
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={`border border-black px-3 py-1 hover:bg-gray-200 ${
              statusFilter === status.value ? "bg-gray-200" : ""
            }`}
          >
            {status.label}
            {status.value === "all"
              ? `(${listings.length})`
              : `(${countByStatus(status.value)})`}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Search by unit ID, project, cadastral lot no, lot type, status..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border border-black px-3 py-2 md:w-96"
        />

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="border border-black px-3 py-2"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={lotTypeFilter}
          onChange={(e) => setLotTypeFilter(e.target.value)}
          className="border border-black px-3 py-2"
        >
          <option value="all">All Lot Types</option>
          {lotTypes.map((lotType) => (
            <option key={lotType} value={lotType}>
              {lotType}
            </option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Reset
        </button>

        <button
          onClick={openAddModal}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add
        </button>
      </div>

      {isLoading && (
        <div className="border border-black px-4 py-6 text-center text-gray-600">
          Loading listings...
        </div>
      )}

      {error && !isLoading && (
        <div className="border border-black px-4 py-6 text-center text-gray-600">
          Failed to load listings
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">
                  Unit ID
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Project
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Cadastral Lot No.
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Lot Type
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Area
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Price / SQM
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Net Price
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Legal / Misc
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Status
                </th>
                <th className="px-4 py-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredListings.map((listing) => (
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
                    {formatMoney(listing.price_per_sqm)}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {formatMoney(listing.net_selling_price)}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {formatMoney(listing.legal_misc_fee)}
                  </td>

                  <td className="border-r border-black px-4 py-2 capitalize">
                    {listing.status}
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewListing(listing)}
                        className="border border-black px-3 py-1 hover:bg-gray-200"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => openEditModal(listing)}
                        className="border border-black px-3 py-1 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredListings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-600">
                    No listings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Listing</h2>

            <form
              onSubmit={handleAddListing}
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                <option value={0} disabled>
                  Select project
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Cadastral lot no."
                value={formData.cadastral_lot_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cadastral_lot_no: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Unit ID"
                value={formData.unit_id}
                onChange={(e) =>
                  setFormData({ ...formData, unit_id: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Lot type"
                value={formData.lot_type}
                onChange={(e) =>
                  setFormData({ ...formData, lot_type: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Promo discount"
                value={formData.promo_discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promo_discount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Downpayment"
                value={formData.downpayment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    downpayment: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Reservation fee"
                value={formData.reservation_fee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reservation_fee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Price per sqm"
                value={formData.price_per_sqm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_per_sqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Lot area sqm"
                value={formData.lot_area_sqm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lot_area_sqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Net selling price"
                value={formData.net_selling_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    net_selling_price: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Legal misc fee"
                value={formData.legal_misc_fee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    legal_misc_fee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ListingStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="hold">Hold</option>
                <option value="sold">Sold</option>
                <option value="inactive">Inactive</option>
              </select>

              {createListingMutation.isError && (
                <p className="col-span-full text-sm text-red-600">
                  {createListingMutation.error.message}
                </p>
              )}

              <div className="col-span-full mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsAddOpen(false)
                  }}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createListingMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createListingMutation.isPending ? "Saving..." : "Save Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewListing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Listing Details</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <p><b>ID:</b> {viewListing.id}</p>
              <p><b>Project ID:</b> {viewListing.project_id}</p>
              <p><b>Project:</b> {viewListing.project_name}</p>
              <p><b>Cadastral Lot No.:</b> {viewListing.cadastral_lot_no || "-"}</p>
              <p><b>Unit ID:</b> {viewListing.unit_id}</p>
              <p><b>Lot Type:</b> {viewListing.lot_type || "-"}</p>
              <p><b>Promo Discount:</b> {formatMoney(viewListing.promo_discount)}</p>
              <p><b>Downpayment:</b> {formatMoney(viewListing.downpayment)}</p>
              <p><b>Reservation Fee:</b> {formatMoney(viewListing.reservation_fee)}</p>
              <p><b>Price Per SQM:</b> {formatMoney(viewListing.price_per_sqm)}</p>
              <p><b>Lot Area:</b> {formatNumber(viewListing.lot_area_sqm)} sqm</p>
              <p><b>Net Selling Price:</b> {formatMoney(viewListing.net_selling_price)}</p>
              <p><b>Legal / Misc Fee:</b> {formatMoney(viewListing.legal_misc_fee)}</p>
              <p><b>Status:</b> {viewListing.status}</p>
              <p><b>Created At:</b> {viewListing.created_at}</p>
              <p><b>Updated At:</b> {viewListing.updated_at}</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  openEditModal(viewListing)
                  setViewListing(null)
                }}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Edit
              </button>

              <button
                onClick={() => setViewListing(null)}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editListing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Listing</h2>

            <form
              onSubmit={handleUpdateListing}
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              <select
                value={editFormData.project_id}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    project_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                <option value={0} disabled>
                  Select project
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={editFormData.cadastral_lot_no}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    cadastral_lot_no: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editFormData.unit_id}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    unit_id: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editFormData.lot_type}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    lot_type: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.promo_discount}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    promo_discount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.downpayment}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    downpayment: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.reservation_fee}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    reservation_fee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.price_per_sqm}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    price_per_sqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.lot_area_sqm}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    lot_area_sqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.net_selling_price}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    net_selling_price: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editFormData.legal_misc_fee}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    legal_misc_fee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    status: e.target.value as ListingStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="hold">Hold</option>
                <option value="sold">Sold</option>
                <option value="inactive">Inactive</option>
              </select>

              {updateListingMutation.isError && (
                <p className="col-span-full text-sm text-red-600">
                  {updateListingMutation.error.message}
                </p>
              )}

              <div className="col-span-full mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditListing(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateListingMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateListingMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Listings
