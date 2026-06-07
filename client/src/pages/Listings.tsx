import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { FiEdit2, FiEye, FiGrid, FiPlus, FiSearch } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate, formatMoney, formatNumber } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

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
  "available",
  "reserved",
  "hold",
  "sold",
  "inactive",
]

const chartColors = ["#2563eb", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444"]

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
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

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
      setSuccessMessage("Listing created successfully")
    },
  })

  const updateListingMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      setEditListing(null)
      setSuccessMessage("Listing updated successfully")
    },
  })

  const projectFormDefault = () => projects[0]?.id ?? 0

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
    setPage(1)
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

  const handleAddListing = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createListingMutation.mutate(formData)
  }

  const handleUpdateListing = (e: { preventDefault: () => void }) => {
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

  const paginatedListings = paginateRows(filteredListings, page, rowsPerPage)
  const lotTypes = [
    ...new Set(listings.map((listing) => listing.lot_type).filter(Boolean)),
  ] as string[]
  const totalValue = listings.reduce(
    (sum, listing) => sum + Number(listing.net_selling_price || 0),
    0
  )
  const statusData = statusFilters.map((status) => ({
    name: status,
    value: listings.filter((listing) => listing.status === status).length,
  }))

  const formFields = (
    data: ListingFormData,
    setData: (data: ListingFormData) => void
  ) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Select
        label="Project"
        onChange={(e) => setData({ ...data, project_id: Number(e.target.value) })}
        required
        value={data.project_id}
      >
        <option disabled value={0}>
          Select project
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </Select>
      <Input
        label="Cadastral lot no."
        onChange={(e) => setData({ ...data, cadastral_lot_no: e.target.value })}
        value={data.cadastral_lot_no}
      />
      <Input
        label="Unit ID"
        onChange={(e) => setData({ ...data, unit_id: e.target.value })}
        required
        value={data.unit_id}
      />
      <Input
        label="Lot type"
        onChange={(e) => setData({ ...data, lot_type: e.target.value })}
        value={data.lot_type}
      />
      {[
        ["promo_discount", "Promo discount"],
        ["downpayment", "Downpayment"],
        ["reservation_fee", "Reservation fee"],
        ["price_per_sqm", "Price per sqm"],
        ["lot_area_sqm", "Lot area sqm"],
        ["net_selling_price", "Net selling price"],
        ["legal_misc_fee", "Legal misc fee"],
      ].map(([key, label]) => (
        <Input
          key={key}
          label={label}
          onChange={(e) =>
            setData({
              ...data,
              [key]: Number(e.target.value),
            } as ListingFormData)
          }
          type="number"
          value={String(data[key as keyof ListingFormData])}
        />
      ))}
      <Select
        label="Status"
        onChange={(e) => setData({ ...data, status: e.target.value })}
        value={data.status}
      >
        {statusFilters.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
    </div>
  )

  return (
    <div>
      <PageHeader
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add
          </Button>
        }
        icon={<FiGrid className="h-5 w-5" />}
        subtitle="Live inventory from MySQL with editable listing records"
        title="Listings / Units"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="All" value={listings.length} />
        {statusFilters.slice(0, 4).map((status) => (
          <StatCard
            key={status}
            title={status[0].toUpperCase() + status.slice(1)}
            value={listings.filter((listing) => listing.status === status).length}
          />
        ))}
        <StatCard title="Total Value" value={formatMoney(totalValue)} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Listing status distribution
            </h2>
            <p className="text-sm text-slate-500">
              Current unit inventory by status
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={82}>
                  {statusData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px_180px_auto]">
          <Input
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search unit, project, cadastral lot no, lot type, status..."
            value={searchInput}
          />
          <Select
            onChange={(e) => {
              setProjectFilter(e.target.value)
              setPage(1)
            }}
            value={projectFilter}
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            onChange={(e) => {
              setLotTypeFilter(e.target.value)
              setPage(1)
            }}
            value={lotTypeFilter}
          >
            <option value="all">All Lot Types</option>
            {lotTypes.map((lotType) => (
              <option key={lotType} value={lotType}>
                {lotType}
              </option>
            ))}
          </Select>
          <Select
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            value={statusFilter}
          >
            <option value="all">All Status</option>
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Button icon={<FiSearch />} onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading listings..." /> : null}
      {error && !isLoading ? (
        <Alert type="error">Failed to load listings</Alert>
      ) : null}

      {!isLoading && !error ? (
        filteredListings.length === 0 ? (
          <EmptyState title="No listings found" />
        ) : (
          <>
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Unit ID",
                      "Project",
                      "Cadastral Lot No.",
                      "Lot Type",
                      "Area",
                      "Price / SQM",
                      "Net Price",
                      "Legal / Misc",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        className="px-4 py-3 text-left font-semibold text-slate-600"
                        key={heading}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedListings.map((listing) => (
                    <tr className="transition hover:bg-slate-50" key={listing.id}>
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
                        {formatMoney(listing.price_per_sqm)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMoney(listing.net_selling_price)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMoney(listing.legal_misc_fee)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            icon={<FiEye />}
                            onClick={() => setViewListing(listing)}
                          >
                            Details
                          </Button>
                          <Button
                            icon={<FiEdit2 />}
                            onClick={() => openEditModal(listing)}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
            <Pagination
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={filteredListings.length}
            />
          </>
        )
      ) : null}

      {isAddOpen ? (
        <Modal onClose={() => setIsAddOpen(false)} title="Add Listing">
          <form className="space-y-4" onSubmit={handleAddListing}>
            {formFields(formData, setFormData)}
            {createListingMutation.isError ? (
              <Alert type="error">{createListingMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createListingMutation.isPending}
                type="submit"
                variant="primary"
              >
                {createListingMutation.isPending ? "Saving..." : "Save Listing"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {viewListing ? (
        <Modal onClose={() => setViewListing(null)} title="Listing Details">
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
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
            <p><b>Created At:</b> {formatDate(viewListing.created_at)}</p>
            <p><b>Updated At:</b> {formatDate(viewListing.updated_at)}</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              icon={<FiEdit2 />}
              onClick={() => {
                openEditModal(viewListing)
                setViewListing(null)
              }}
              variant="primary"
            >
              Edit
            </Button>
            <Button onClick={() => setViewListing(null)}>Close</Button>
          </div>
        </Modal>
      ) : null}

      {editListing ? (
        <Modal onClose={() => setEditListing(null)} title="Edit Listing">
          <form className="space-y-4" onSubmit={handleUpdateListing}>
            {formFields(editFormData, setEditFormData)}
            {updateListingMutation.isError ? (
              <Alert type="error">{updateListingMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditListing(null)}>Cancel</Button>
              <Button
                disabled={updateListingMutation.isPending}
                type="submit"
                variant="primary"
              >
                {updateListingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export default Listings
