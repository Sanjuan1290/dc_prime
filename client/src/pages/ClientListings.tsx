import { useMemo, useState } from "react"
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
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatText,
} from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type ListingStatus =
  | "available"
  | "reserved"
  | "hold"
  | "sold"
  | "inactive"
  | string

type Listing = {
  id: number
  project_id: number
  project_name: string
  project_location?: string | null
  project_administrator?: string | null
  cadastral_lot_no: string | null
  unit_id: string
  lot_type: string | null
  promo_discount: number | string
  downpayment: number | string
  reservation_fee: number | string
  price_per_sqm: number | string
  lot_area_sqm: number | string
  gross_selling_price?: number | string
  net_selling_price: number | string
  legal_misc_rate: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  status: ListingStatus
  created_at: string
  updated_at: string
}

type Project = {
  id: number
  name: string
  location: string | null
  status: string
}

type ListingFormData = {
  project_id: number | ""
  cadastral_lot_no: string
  unit_id: string
  lot_type: string
  promo_discount: number
  downpayment: number
  reservation_fee: number
  price_per_sqm: number
  lot_area_sqm: number
  legal_misc_rate: number
  status: ListingStatus
}

type ListingsResponse = {
  listings: Listing[]
}

type ProjectsResponse = {
  projects: Project[]
}

const listingStatuses = [
  "available",
  "reserved",
  "hold",
  "sold",
  "inactive",
]

const emptyFormData: ListingFormData = {
  project_id: "",
  cadastral_lot_no: "",
  unit_id: "",
  lot_type: "",
  promo_discount: 0,
  downpayment: 0,
  reservation_fee: 0,
  price_per_sqm: 0,
  lot_area_sqm: 0,
  legal_misc_rate: 10,
  status: "available",
}

const fetchListings = async (): Promise<Listing[]> => {
  const res = await fetch(`${API_URL}/listings`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = (await res.json()) as ListingsResponse
  return data.listings
}

const fetchProjects = async (): Promise<Project[]> => {
  const res = await fetch(`${API_URL}/projects`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data = (await res.json()) as ProjectsResponse
  return data.projects
}

const createListing = async (listingData: ListingFormData) => {
  const res = await fetch(`${API_URL}/listings`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listingData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateListing = async ({
  id,
  listingData,
}: {
  id: number
  listingData: ListingFormData
}) => {
  const res = await fetch(`${API_URL}/listings/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listingData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const listingToFormData = (listing: Listing): ListingFormData => ({
  project_id: listing.project_id,
  cadastral_lot_no: listing.cadastral_lot_no || "",
  unit_id: listing.unit_id || "",
  lot_type: listing.lot_type || "",
  promo_discount: Number(listing.promo_discount || 0),
  downpayment: Number(listing.downpayment || 0),
  reservation_fee: Number(listing.reservation_fee || 0),
  price_per_sqm: Number(listing.price_per_sqm || 0),
  lot_area_sqm: Number(listing.lot_area_sqm || 0),
  legal_misc_rate: Number(listing.legal_misc_rate || 10),
  status: listing.status,
})

const getSearchText = (listing: Listing) => {
  return [
    listing.id,
    listing.project_name,
    listing.project_location,
    listing.cadastral_lot_no,
    listing.unit_id,
    listing.lot_type,
    listing.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

const computeGrossSellingPrice = (data: ListingFormData) => {
  return Number(data.price_per_sqm || 0) * Number(data.lot_area_sqm || 0)
}

const computeNetSellingPrice = (data: ListingFormData) => {
  const grossSellingPrice = computeGrossSellingPrice(data)
  return grossSellingPrice - Number(data.promo_discount || 0)
}

const computeLegalMiscFee = (data: ListingFormData) => {
  const netSellingPrice = computeNetSellingPrice(data)
  return netSellingPrice * (Number(data.legal_misc_rate || 0) / 100)
}

const computeTotalContractPrice = (data: ListingFormData) => {
  return computeNetSellingPrice(data) + computeLegalMiscFee(data)
}

const Listings = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [lotTypeFilter, setLotTypeFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editListing, setEditListing] = useState<Listing | null>(null)
  const [viewListing, setViewListing] = useState<Listing | null>(null)

  const [formData, setFormData] = useState<ListingFormData>(emptyFormData)
  const [editFormData, setEditFormData] =
    useState<ListingFormData>(emptyFormData)

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: listings = [],
    isLoading,
    error,
  } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: fetchListings,
  })

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  const createListingMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      queryClient.invalidateQueries({ queryKey: ["available-listings"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
      setSuccessMessage("Listing added successfully")
    },
  })

  const updateListingMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      queryClient.invalidateQueries({ queryKey: ["available-listings"] })
      setEditListing(null)
      setEditFormData(emptyFormData)
      setSuccessMessage("Listing updated successfully")
    },
  })

  const lotTypes = useMemo(() => {
    const values = listings
      .map((listing) => listing.lot_type)
      .filter((lotType): lotType is string => Boolean(lotType))

    return Array.from(new Set(values))
  }, [listings])

  const filteredListings = listings.filter((listing) => {
    const search = searchInput.trim().toLowerCase()

    const matchesSearch = !search || getSearchText(listing).includes(search)
    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter
    const matchesProject =
      projectFilter === "all" || String(listing.project_id) === projectFilter
    const matchesLotType =
      lotTypeFilter === "all" || listing.lot_type === lotTypeFilter

    return matchesSearch && matchesStatus && matchesProject && matchesLotType
  })

  const paginatedListings = paginateRows(
    filteredListings,
    page,
    rowsPerPage
  )

  const availableCount = listings.filter(
    (listing) => listing.status === "available"
  ).length
  const reservedCount = listings.filter(
    (listing) => listing.status === "reserved"
  ).length
  const holdCount = listings.filter(
    (listing) => listing.status === "hold"
  ).length
  const soldCount = listings.filter(
    (listing) => listing.status === "sold"
  ).length

  const totalInventoryValue = listings.reduce(
    (sum, listing) => sum + Number(listing.total_contract_price || 0),
    0
  )

  const chartData = [
    { name: "Available", value: availableCount },
    { name: "Reserved", value: reservedCount },
    { name: "Hold", value: holdCount },
    { name: "Sold", value: soldCount },
  ].filter((item) => item.value > 0)

  const openAddModal = () => {
    setFormData(emptyFormData)
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (listing: Listing) => {
    setEditListing(listing)
    setEditFormData(listingToFormData(listing))
    setSuccessMessage("")
  }

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setProjectFilter("all")
    setLotTypeFilter("all")
    setPage(1)
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

  const mutationError =
    createListingMutation.error?.message || updateListingMutation.error?.message

  if (isLoading) {
    return <LoadingState label="Loading listings..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load listings" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiGrid />}
        title="Listings"
        subtitle="Manage project inventory, pricing, and listing status."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Listing
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard label="Available" value={availableCount} />
        <StatCard label="Reserved" value={reservedCount} />
        <StatCard label="Hold" value={holdCount} />
        <StatCard label="Sold" value={soldCount} />
        <StatCard label="Inventory Value" value={formatMoney(totalInventoryValue)} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="h-60">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No chart data" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <StatusMeaning
              status="available"
              meaning="Open for reservation."
            />
            <StatusMeaning
              status="reserved"
              meaning="Reservation made, sale not yet confirmed."
            />
            <StatusMeaning
              status="sold"
              meaning="Sale confirmed or downpayment made."
            />
            <StatusMeaning
              status="hold"
              meaning="Manually blocked by admin."
            />
            <StatusMeaning
              status="inactive"
              meaning="Hidden or no longer used."
            />
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_160px_200px_180px_auto]">
          <Input
            icon={<FiSearch />}
            placeholder="Search unit, project, lot type, status..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Status</option>
            {listingStatuses.map((status) => (
              <option key={status} value={status}>
                {formatText(status)}
              </option>
            ))}
          </Select>

          <Select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>

          <Select
            value={lotTypeFilter}
            onChange={(e) => {
              setLotTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Lot Types</option>
            {lotTypes.map((lotType) => (
              <option key={lotType} value={lotType}>
                {formatText(lotType)}
              </option>
            ))}
          </Select>

          <Button onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Unit ID</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Lot Type</th>
              <th className="px-4 py-3 text-left">Area</th>
              <th className="px-4 py-3 text-left">Price / sqm</th>
              <th className="px-4 py-3 text-left">Net Selling Price</th>
              <th className="px-4 py-3 text-left">Legal/Misc Fee</th>
              <th className="px-4 py-3 text-left">TCP</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedListings.map((listing) => (
              <tr key={listing.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <StatusBadge status={listing.status} />
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {listing.unit_id}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{listing.project_name}</p>
                  {listing.cadastral_lot_no ? (
                    <p className="text-xs text-slate-500">
                      Lot: {listing.cadastral_lot_no}
                    </p>
                  ) : null}
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

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatMoney(listing.total_contract_price)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button icon={<FiEye />} onClick={() => setViewListing(listing)}>
                      View
                    </Button>

                    <Button icon={<FiEdit2 />} onClick={() => openEditModal(listing)}>
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedListings.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    title="No listings found"
                    description="Try another search or add a new listing."
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredListings.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal title="Add Listing" onClose={() => setIsAddOpen(false)} size="xl">
          <ListingForm
            listingData={formData}
            setListingData={setFormData}
            projects={projects}
            onSubmit={handleAddListing}
            onCancel={() => setIsAddOpen(false)}
            isPending={createListingMutation.isPending}
            submitLabel="Add Listing"
            error={createListingMutation.error?.message}
          />
        </Modal>
      ) : null}

      {editListing ? (
        <Modal title="Edit Listing" onClose={() => setEditListing(null)} size="xl">
          <ListingForm
            listingData={editFormData}
            setListingData={setEditFormData}
            projects={projects}
            onSubmit={handleUpdateListing}
            onCancel={() => setEditListing(null)}
            isPending={updateListingMutation.isPending}
            submitLabel="Save Changes"
            error={updateListingMutation.error?.message}
          />
        </Modal>
      ) : null}

      {viewListing ? (
        <Modal
          title={`Listing Details - ${viewListing.unit_id}`}
          onClose={() => setViewListing(null)}
          size="lg"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem label="Status" value={formatText(viewListing.status)} />
            <InfoItem label="Project" value={viewListing.project_name} />
            <InfoItem label="Unit ID" value={viewListing.unit_id} />
            <InfoItem label="Cadastral Lot No." value={viewListing.cadastral_lot_no} />
            <InfoItem label="Lot Type" value={viewListing.lot_type} />
            <InfoItem
              label="Lot Area"
              value={`${formatNumber(viewListing.lot_area_sqm)} sqm`}
            />
            <InfoItem label="Price / sqm" value={formatMoney(viewListing.price_per_sqm)} />
            <InfoItem
              label="Gross Selling Price"
              value={formatMoney(
                Number(viewListing.price_per_sqm || 0) *
                  Number(viewListing.lot_area_sqm || 0)
              )}
            />
            <InfoItem
              label="Promo Discount"
              value={formatMoney(viewListing.promo_discount)}
            />
            <InfoItem
              label="Net Selling Price"
              value={formatMoney(viewListing.net_selling_price)}
            />
            <InfoItem
              label="Legal/Misc Rate"
              value={`${formatNumber(viewListing.legal_misc_rate)}%`}
            />
            <InfoItem
              label="Legal/Misc Fee"
              value={formatMoney(viewListing.legal_misc_fee)}
            />
            <InfoItem
              label="Reservation Fee"
              value={formatMoney(viewListing.reservation_fee)}
            />
            <InfoItem
              label="Downpayment"
              value={formatMoney(viewListing.downpayment)}
            />
            <InfoItem
              label="Total Contract Price"
              value={formatMoney(viewListing.total_contract_price)}
            />
            <InfoItem label="Created At" value={formatDate(viewListing.created_at)} />
            <InfoItem label="Updated At" value={formatDate(viewListing.updated_at)} />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

type ListingFormProps = {
  listingData: ListingFormData
  setListingData: (listingData: ListingFormData) => void
  projects: Project[]
  onSubmit: (e: { preventDefault: () => void }) => void
  onCancel: () => void
  isPending: boolean
  submitLabel: string
  error?: string
}

const ListingForm = ({
  listingData,
  setListingData,
  projects,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  error,
}: ListingFormProps) => {
  const grossSellingPrice = computeGrossSellingPrice(listingData)
  const netSellingPrice = computeNetSellingPrice(listingData)
  const legalMiscFee = computeLegalMiscFee(listingData)
  const totalContractPrice = computeTotalContractPrice(listingData)

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Project"
          value={listingData.project_id}
          onChange={(e) =>
            setListingData({
              ...listingData,
              project_id: e.target.value ? Number(e.target.value) : "",
            })
          }
          required
        >
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>

        <Input
          label="Unit ID"
          value={listingData.unit_id}
          onChange={(e) =>
            setListingData({
              ...listingData,
              unit_id: e.target.value,
            })
          }
          required
        />

        <Input
          label="Cadastral Lot No."
          value={listingData.cadastral_lot_no}
          onChange={(e) =>
            setListingData({
              ...listingData,
              cadastral_lot_no: e.target.value,
            })
          }
        />

        <Input
          label="Lot Type"
          value={listingData.lot_type}
          onChange={(e) =>
            setListingData({
              ...listingData,
              lot_type: e.target.value,
            })
          }
        />

        <Input
          label="Lot Area sqm"
          type="number"
          min={0}
          step="0.01"
          value={listingData.lot_area_sqm}
          onChange={(e) =>
            setListingData({
              ...listingData,
              lot_area_sqm: Number(e.target.value),
            })
          }
        />

        <Input
          label="Price per sqm"
          type="number"
          min={0}
          step="0.01"
          value={listingData.price_per_sqm}
          onChange={(e) =>
            setListingData({
              ...listingData,
              price_per_sqm: Number(e.target.value),
            })
          }
        />

        <Input
          label="Promo Discount"
          type="number"
          min={0}
          step="0.01"
          value={listingData.promo_discount}
          onChange={(e) =>
            setListingData({
              ...listingData,
              promo_discount: Number(e.target.value),
            })
          }
        />

        <Input
          label="Reservation Fee"
          type="number"
          min={0}
          step="0.01"
          value={listingData.reservation_fee}
          onChange={(e) =>
            setListingData({
              ...listingData,
              reservation_fee: Number(e.target.value),
            })
          }
        />

        <Input
          label="Downpayment"
          type="number"
          min={0}
          step="0.01"
          value={listingData.downpayment}
          onChange={(e) =>
            setListingData({
              ...listingData,
              downpayment: Number(e.target.value),
            })
          }
        />

        <Input
          label="Legal/Misc Rate %"
          type="number"
          min={0}
          step="0.01"
          value={listingData.legal_misc_rate}
          onChange={(e) =>
            setListingData({
              ...listingData,
              legal_misc_rate: Number(e.target.value),
            })
          }
        />

        <div>
          <Select
            label="Status"
            value={listingData.status}
            onChange={(e) =>
              setListingData({
                ...listingData,
                status: e.target.value,
              })
            }
          >
            {listingStatuses.map((status) => (
              <option key={status} value={status}>
                {formatText(status)}
              </option>
            ))}
          </Select>

          <p className="mt-2 text-xs text-slate-500">
            Use Hold only when admin manually blocks a unit. Reserved and Sold
            should normally come from client reservation or sale confirmation.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold text-slate-900">Computed Amounts</h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <ComputedAmount label="Gross Selling Price" value={grossSellingPrice} />
          <ComputedAmount label="Net Selling Price" value={netSellingPrice} />
          <ComputedAmount label="Legal/Misc Fee" value={legalMiscFee} />
          <ComputedAmount label="Total Contract Price" value={totalContractPrice} />
        </div>
      </div>

      <Alert variant="info">
        Status meaning: Available means open for reservation. Reserved means
        reservation made. Sold means sale confirmed. Hold means admin blocked
        the unit. Inactive means hidden or no longer used.
      </Alert>

      {error ? <Alert title={error} variant="error" /> : null}

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button disabled={isPending} type="submit" variant="primary">
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

const ComputedAmount = ({
  label,
  value,
}: {
  label: string
  value: number
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">
        {formatMoney(value)}
      </p>
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
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value || "-"}</p>
    </div>
  )
}

const StatusMeaning = ({
  status,
  meaning,
}: {
  status: string
  meaning: string
}) => {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <StatusBadge status={status} />
      <p className="mt-2 text-sm text-slate-600">{meaning}</p>
    </div>
  )
}

export default Listings