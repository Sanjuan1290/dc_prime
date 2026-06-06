import { useState } from "react"

type Project = {
  id: number
  name: string
}

type ListingStatus = "available" | "reserved" | "hold" | "sold" | "inactive"

type Listing = {
  id: number
  projectId: number
  projectName: string
  cadastralLotNo: string
  unitId: string
  lotType: string
  promoDiscount: number
  downpayment: number
  reservationFee: number
  pricePerSqm: number
  lotAreaSqm: number
  netSellingPrice: number
  legalMiscFee: number
  status: ListingStatus
}

const Listings = () => {
  const projects: Project[] = [
    {
      id: 1,
      name: "Luntiang Aguinaldo",
    },
    {
      id: 2,
      name: "bailen project",
    },
  ]

  const [listings, setListings] = useState<Listing[]>([
    {
      id: 1,
      projectId: 1,
      projectName: "Luntiang Aguinaldo",
      cadastralLotNo: "CAD-0505",
      unitId: "LA-0505",
      lotType: "Residential",
      promoDiscount: 0,
      downpayment: 300000,
      reservationFee: 10000,
      pricePerSqm: 2500,
      lotAreaSqm: 1200,
      netSellingPrice: 3000000,
      legalMiscFee: 300000,
      status: "available",
    },
    {
      id: 2,
      projectId: 1,
      projectName: "Luntiang Aguinaldo",
      cadastralLotNo: "CAD-0506",
      unitId: "LA-0506",
      lotType: "Residential",
      promoDiscount: 0,
      downpayment: 411750,
      reservationFee: 10000,
      pricePerSqm: 2500,
      lotAreaSqm: 1647,
      netSellingPrice: 4117500,
      legalMiscFee: 411750,
      status: "available",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ListingStatus>("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [lotTypeFilter, setLotTypeFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewListing, setViewListing] = useState<Listing | null>(null)
  const [editListing, setEditListing] = useState<Listing | null>(null)

  const [formData, setFormData] = useState({
    projectId: 1,
    cadastralLotNo: "",
    unitId: "",
    lotType: "",
    promoDiscount: 0,
    downpayment: 0,
    reservationFee: 0,
    pricePerSqm: 0,
    lotAreaSqm: 0,
    netSellingPrice: 0,
    legalMiscFee: 0,
    status: "available" as ListingStatus,
  })

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-PH").format(value)
  }

  const getProjectName = (projectId: number) => {
    return projects.find((project) => project.id === projectId)?.name || ""
  }

  const resetForm = () => {
    setFormData({
      projectId: 1,
      cadastralLotNo: "",
      unitId: "",
      lotType: "",
      promoDiscount: 0,
      downpayment: 0,
      reservationFee: 0,
      pricePerSqm: 0,
      lotAreaSqm: 0,
      netSellingPrice: 0,
      legalMiscFee: 0,
      status: "available",
    })
  }

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setProjectFilter("all")
    setLotTypeFilter("all")
  }

  const handleAddListing = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newListing: Listing = {
      id: listings.length + 1,
      ...formData,
      projectName: getProjectName(formData.projectId),
    }

    setListings((prev) => [...prev, newListing])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateListing = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editListing) return

    setListings((prev) =>
      prev.map((listing) =>
        listing.id === editListing.id
          ? {
              ...editListing,
              projectName: getProjectName(editListing.projectId),
            }
          : listing
      )
    )

    setEditListing(null)
  }

  const filteredListings = listings.filter((listing) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      listing.unitId.toLowerCase().includes(search) ||
      listing.projectName.toLowerCase().includes(search) ||
      listing.lotType.toLowerCase().includes(search) ||
      listing.cadastralLotNo.toLowerCase().includes(search) ||
      listing.status.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter

    const matchesProject =
      projectFilter === "all" || listing.projectId === Number(projectFilter)

    const matchesLotType =
      lotTypeFilter === "all" || listing.lotType === lotTypeFilter

    return matchesSearch && matchesStatus && matchesProject && matchesLotType
  })

  const countByStatus = (status: ListingStatus) => {
    return listings.filter((listing) => listing.status === status).length
  }

  const lotTypes = [
    ...new Set(listings.map((listing) => listing.lotType)),
  ].filter(Boolean)

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Listings / Units</h1>
        <p className="text-sm text-gray-600">
          Live inventory imported from company files and editable in MySQL
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          All({listings.length})
        </button>

        <button
          onClick={() => setStatusFilter("available")}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          Available({countByStatus("available")})
        </button>

        <button
          onClick={() => setStatusFilter("reserved")}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          Reserved({countByStatus("reserved")})
        </button>

        <button
          onClick={() => setStatusFilter("hold")}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          Hold({countByStatus("hold")})
        </button>

        <button
          onClick={() => setStatusFilter("sold")}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          Sold({countByStatus("sold")})
        </button>

        <button
          onClick={() => setStatusFilter("inactive")}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          Inactive({countByStatus("inactive")})
        </button>

        <button
          onClick={resetFilters}
          className="border border-black px-3 py-1 hover:bg-gray-200"
        >
          Reset
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Search by unit ID, project, lot type, cadastral lot no..."
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
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add
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
                Price / SQM ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Net Price ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Legal / Misc ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="px-4 py-2 text-left">
                Actions ↕
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredListings.map((listing) => (
              <tr key={listing.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {listing.unitId}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {listing.projectName}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {listing.lotType}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatNumber(listing.lotAreaSqm)} sqm
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(listing.pricePerSqm)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(listing.netSellingPrice)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(listing.legalMiscFee)}
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
                      onClick={() => setEditListing(listing)}
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
                <td colSpan={9} className="px-4 py-6 text-center text-gray-600">
                  No listings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Listing</h2>

            <form
              onSubmit={handleAddListing}
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectId: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Cadastral lot no."
                value={formData.cadastralLotNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cadastralLotNo: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Unit ID"
                value={formData.unitId}
                onChange={(e) =>
                  setFormData({ ...formData, unitId: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Lot type"
                value={formData.lotType}
                onChange={(e) =>
                  setFormData({ ...formData, lotType: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Promo discount"
                value={formData.promoDiscount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promoDiscount: Number(e.target.value),
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
                value={formData.reservationFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reservationFee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Price per sqm"
                value={formData.pricePerSqm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerSqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Lot area sqm"
                value={formData.lotAreaSqm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lotAreaSqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Net selling price"
                value={formData.netSellingPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    netSellingPrice: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Legal misc fee"
                value={formData.legalMiscFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    legalMiscFee: Number(e.target.value),
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
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Save Listing
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
              <p>
                <b>Project:</b> {viewListing.projectName}
              </p>
              <p>
                <b>Cadastral Lot No:</b> {viewListing.cadastralLotNo}
              </p>
              <p>
                <b>Unit ID:</b> {viewListing.unitId}
              </p>
              <p>
                <b>Lot Type:</b> {viewListing.lotType}
              </p>
              <p>
                <b>Promo Discount:</b>{" "}
                {formatMoney(viewListing.promoDiscount)}
              </p>
              <p>
                <b>Downpayment:</b> {formatMoney(viewListing.downpayment)}
              </p>
              <p>
                <b>Reservation Fee:</b>{" "}
                {formatMoney(viewListing.reservationFee)}
              </p>
              <p>
                <b>Price Per SQM:</b> {formatMoney(viewListing.pricePerSqm)}
              </p>
              <p>
                <b>Lot Area:</b> {formatNumber(viewListing.lotAreaSqm)} sqm
              </p>
              <p>
                <b>Net Selling Price:</b>{" "}
                {formatMoney(viewListing.netSellingPrice)}
              </p>
              <p>
                <b>Legal / Misc Fee:</b>{" "}
                {formatMoney(viewListing.legalMiscFee)}
              </p>
              <p>
                <b>Status:</b> {viewListing.status}
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditListing(viewListing)
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
                value={editListing.projectId}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    projectId: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={editListing.cadastralLotNo}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    cadastralLotNo: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editListing.unitId}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    unitId: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editListing.lotType}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    lotType: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.promoDiscount}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    promoDiscount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.downpayment}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    downpayment: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.reservationFee}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    reservationFee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.pricePerSqm}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    pricePerSqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.lotAreaSqm}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    lotAreaSqm: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.netSellingPrice}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    netSellingPrice: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editListing.legalMiscFee}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
                    legalMiscFee: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={editListing.status}
                onChange={(e) =>
                  setEditListing({
                    ...editListing,
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
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Save Changes
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