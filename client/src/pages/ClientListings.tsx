import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

type Client = {
  id: number
  fullName: string
  spouseCoOwnerName: string
  email: string
  contactNo: string
  address: string
}

type ListingStatus = "available" | "reserved" | "hold" | "sold" | "inactive"

type AvailableListing = {
  id: number
  projectName: string
  cadastralLotNo: string
  unitId: string
  lotType: string
  pricePerSqm: number
  lotAreaSqm: number
  netSellingPrice: number
  legalMiscFee: number
  status: ListingStatus
}

type ClientUnitStatus =
  | "reserved"
  | "active"
  | "cancelled"
  | "fully_paid"
  | "closed"

type ClientUnit = {
  id: number
  clientId: number
  listingId: number
  projectName: string
  unitId: string
  lotType: string
  lotAreaSqm: number
  netSellingPrice: number
  paidAmount: number
  balance: number
  status: ClientUnitStatus
}

type DocumentStatus = "submitted" | "not_submitted"

type ClientDocument = {
  id: number
  clientUnitId: number
  name: string
  isRequired: boolean
  canReuse: boolean
  status: DocumentStatus
  reviewedBy: string
  reviewedAt: string
}

const ClientListings = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const clientId = Number(id)

  const clients: Client[] = [
    {
      id: 1,
      fullName: "AHMED, SARAH NACINO",
      spouseCoOwnerName: "AARON NACINO",
      email: "msx.sarah0929@gmail.com",
      contactNo: "0969-129-1596",
      address: "BIÑAN LAGUNA",
    },
    {
      id: 2,
      fullName: "ALAMER, JAZZIE",
      spouseCoOwnerName: "AARON JAZZIE",
      email: "alamermarkchristopher21@gmail.com",
      contactNo: "0927-437-5425",
      address: "GEN. TRI CAVITE",
    },
  ]

  const client = clients.find((client) => client.id === clientId)

  const documentTemplates = [
    {
      name: "Client Registration Form - Seller's Copy",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "Client Registration Form - Administrator Copy",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "Intent to Buy",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "Offer to Buy & Buyer's Profile",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "Reservation Agreement",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "Deed of Sale",
      isRequired: false,
      canReuse: false,
    },
    {
      name: "Contract to Sell",
      isRequired: false,
      canReuse: false,
    },
    {
      name: "Buyer Counselling and Acknowledgement Form",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "Voluntary Cancellation and Waiver of Rights",
      isRequired: false,
      canReuse: false,
    },
    {
      name: "Buyer Acknowledgement Form",
      isRequired: true,
      canReuse: false,
    },
    {
      name: "SPA to Process Title (for Company)",
      isRequired: false,
      canReuse: false,
    },
    {
      name: "SPA Authorization to Sign (for Representative)",
      isRequired: false,
      canReuse: false,
    },
    {
      name: "Two valid Government-issued IDs (with 3 specimen signatures)",
      isRequired: true,
      canReuse: true,
    },
    {
      name: "TIN No. / TIN ID",
      isRequired: true,
      canReuse: true,
    },
    {
      name: "PSA (Single)",
      isRequired: false,
      canReuse: true,
    },
    {
      name: "Marriage Certificate",
      isRequired: false,
      canReuse: true,
    },
    {
      name: "Valid ID of Spouse (when required)",
      isRequired: false,
      canReuse: true,
    },
    {
      name: "CENOMAR (if the buyer has kids but not married)",
      isRequired: false,
      canReuse: true,
    },
    {
      name: "Passport ID",
      isRequired: false,
      canReuse: true,
    },
    {
      name: "Valid IDs of both Principal and Representative",
      isRequired: false,
      canReuse: true,
    },
  ]

  const [availableListings, setAvailableListings] = useState<AvailableListing[]>(
    [
      {
        id: 1,
        projectName: "Luntiang Aguinaldo",
        cadastralLotNo: "CAD-0505",
        unitId: "LA-0505",
        lotType: "Residential",
        pricePerSqm: 2500,
        lotAreaSqm: 1200,
        netSellingPrice: 3000000,
        legalMiscFee: 300000,
        status: "available",
      },
      {
        id: 2,
        projectName: "Luntiang Aguinaldo",
        cadastralLotNo: "CAD-0506",
        unitId: "LA-0506",
        lotType: "Residential",
        pricePerSqm: 2500,
        lotAreaSqm: 1647,
        netSellingPrice: 4117500,
        legalMiscFee: 411750,
        status: "available",
      },
      {
        id: 3,
        projectName: "Bailen Project",
        cadastralLotNo: "CAD-B001",
        unitId: "BP-0001",
        lotType: "Residential",
        pricePerSqm: 2000,
        lotAreaSqm: 100,
        netSellingPrice: 200000,
        legalMiscFee: 20000,
        status: "available",
      },
    ]
  )

  const [clientUnits, setClientUnits] = useState<ClientUnit[]>([
    {
      id: 1,
      clientId: 1,
      listingId: 10,
      projectName: "Luntiang Aguinaldo",
      unitId: "LA-0416",
      lotType: "Residential",
      lotAreaSqm: 400,
      netSellingPrice: 1000000,
      paidAmount: 68000,
      balance: 932000,
      status: "active",
    },
    {
      id: 2,
      clientId: 2,
      listingId: 11,
      projectName: "Luntiang Aguinaldo",
      unitId: "LA-0221",
      lotType: "Residential",
      lotAreaSqm: 100,
      netSellingPrice: 250000,
      paidAmount: 35500,
      balance: 214500,
      status: "active",
    },
  ])

  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>(
    documentTemplates.map((doc, index) => ({
      id: index + 1,
      clientUnitId: 1,
      name: doc.name,
      isRequired: doc.isRequired,
      canReuse: doc.canReuse,
      status:
        index === 0 || index === 1
          ? "submitted"
          : "not_submitted",
      reviewedBy:
        index === 0 || index === 1
          ? "Admin"
          : "",
      reviewedAt:
        index === 0 || index === 1
          ? "2026-06-06"
          : "",
    }))
  )

  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [selectedUnitForDocs, setSelectedUnitForDocs] =
    useState<ClientUnit | null>(null)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-PH").format(value)
  }

  const clientUnitList = clientUnits.filter((unit) => unit.clientId === clientId)

  const filteredAvailableListings = availableListings.filter((listing) => {
    const search = searchInput.toLowerCase().trim()

    return (
      listing.status === "available" &&
      (
        search === "" ||
        listing.projectName.toLowerCase().includes(search) ||
        listing.cadastralLotNo.toLowerCase().includes(search) ||
        listing.unitId.toLowerCase().includes(search) ||
        listing.lotType.toLowerCase().includes(search)
      )
    )
  })

  const getDocumentsByClientUnitId = (clientUnitId: number) => {
    return clientDocuments.filter((doc) => doc.clientUnitId === clientUnitId)
  }

  const getDocumentStatus = (clientUnitId: number) => {
    const docs = getDocumentsByClientUnitId(clientUnitId)
    const requiredDocs = docs.filter((doc) => doc.isRequired)

    if (requiredDocs.length === 0) return "incomplete"

    const isComplete = requiredDocs.every((doc) => doc.status === "submitted")

    return isComplete ? "complete" : "incomplete"
  }

  const createDocumentsForClientUnit = (clientUnitId: number) => {
    const existingDocs = getDocumentsByClientUnitId(clientUnitId)

    if (existingDocs.length > 0) return

    const startId = clientDocuments.length + 1

    const docs: ClientDocument[] = documentTemplates.map((doc, index) => ({
      id: startId + index,
      clientUnitId,
      name: doc.name,
      isRequired: doc.isRequired,
      canReuse: doc.canReuse,
      status: "not_submitted",
      reviewedBy: "",
      reviewedAt: "",
    }))

    setClientDocuments((prev) => [...prev, ...docs])
  }

  const handleReserveListing = (listing: AvailableListing) => {
    if (!client) return

    const newClientUnit: ClientUnit = {
      id: clientUnits.length + 1,
      clientId: client.id,
      listingId: listing.id,
      projectName: listing.projectName,
      unitId: listing.unitId,
      lotType: listing.lotType,
      lotAreaSqm: listing.lotAreaSqm,
      netSellingPrice: listing.netSellingPrice,
      paidAmount: 0,
      balance: listing.netSellingPrice,
      status: "reserved",
    }

    setClientUnits((prev) => [...prev, newClientUnit])

    const newDocs: ClientDocument[] = documentTemplates.map((doc, index) => ({
      id: clientDocuments.length + index + 1,
      clientUnitId: newClientUnit.id,
      name: doc.name,
      isRequired: doc.isRequired,
      canReuse: doc.canReuse,
      status: "not_submitted",
      reviewedBy: "",
      reviewedAt: "",
    }))

    setClientDocuments((prev) => [...prev, ...newDocs])

    setAvailableListings((prev) =>
      prev.map((item) =>
        item.id === listing.id ? { ...item, status: "reserved" } : item
      )
    )

    setSearchInput("")
    setIsReserveOpen(false)
  }

  const handleToggleDocumentStatus = (documentId: number) => {
    setClientDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc

        const nextStatus =
          doc.status === "submitted" ? "not_submitted" : "submitted"

        return {
          ...doc,
          status: nextStatus,
          reviewedBy: nextStatus === "submitted" ? "Admin" : "",
          reviewedAt:
            nextStatus === "submitted"
              ? new Date().toISOString().slice(0, 10)
              : "",
        }
      })
    )
  }

  const handleApplyExistingDocs = () => {
    if (!client || !selectedUnitForDocs) return

    const otherClientUnitIds = clientUnits
      .filter(
        (unit) =>
          unit.clientId === client.id &&
          unit.id !== selectedUnitForDocs.id
      )
      .map((unit) => unit.id)

    const existingSubmittedDocs = clientDocuments.filter(
      (doc) =>
        otherClientUnitIds.includes(doc.clientUnitId) &&
        doc.status === "submitted" &&
        doc.canReuse
    )

    setClientDocuments((prev) =>
      prev.map((doc) => {
        if (doc.clientUnitId !== selectedUnitForDocs.id) return doc
        if (!doc.canReuse) return doc

        const matchedDoc = existingSubmittedDocs.find(
          (existingDoc) => existingDoc.name === doc.name
        )

        if (!matchedDoc) return doc

        return {
          ...doc,
          status: "submitted",
          reviewedBy: matchedDoc.reviewedBy || "Admin",
          reviewedAt:
            matchedDoc.reviewedAt || new Date().toISOString().slice(0, 10),
        }
      })
    )
  }

  if (!client) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Client not found</h1>

        <button
          onClick={() => navigate("/clients")}
          className="mt-4 border border-black px-4 py-2 hover:bg-gray-200"
        >
          Back to Clients
        </button>
      </div>
    )
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
        <h1 className="text-3xl font-bold">{client.fullName}</h1>

        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <p>
            <b>Spouse / Co-owner:</b> {client.spouseCoOwnerName || "-"}
          </p>
          <p>
            <b>Email:</b> {client.email || "-"}
          </p>
          <p>
            <b>Contact:</b> {client.contactNo || "-"}
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
              <th className="px-4 py-2 text-left">
                Action ↕
              </th>
            </tr>
          </thead>

          <tbody>
            {clientUnitList.map((unit) => (
              <tr key={unit.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {unit.unitId}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {unit.projectName}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {unit.lotType}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatNumber(unit.lotAreaSqm)} sqm
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(unit.netSellingPrice)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(unit.paidAmount)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(unit.balance)}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {unit.status}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {getDocumentStatus(unit.id)}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      createDocumentsForClientUnit(unit.id)
                      setSelectedUnitForDocs(unit)
                    }}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    View Documents
                  </button>
                </td>
              </tr>
            ))}

            {clientUnitList.length === 0 && (
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

              <button
                onClick={() => setSearchInput("")}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Reset
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
                    <th className="px-4 py-2 text-left">
                      Action ↕
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAvailableListings.map((listing) => (
                    <tr key={listing.id} className="border-b border-black">
                      <td className="border-r border-black px-4 py-2">
                        {listing.unitId}
                      </td>

                      <td className="border-r border-black px-4 py-2">
                        {listing.projectName}
                      </td>

                      <td className="border-r border-black px-4 py-2">
                        {listing.cadastralLotNo}
                      </td>

                      <td className="border-r border-black px-4 py-2">
                        {listing.lotType}
                      </td>

                      <td className="border-r border-black px-4 py-2">
                        {formatNumber(listing.lotAreaSqm)} sqm
                      </td>

                      <td className="border-r border-black px-4 py-2">
                        {formatMoney(listing.netSellingPrice)}
                      </td>

                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleReserveListing(listing)}
                          className="border border-black px-3 py-1 hover:bg-gray-200"
                        >
                          Reserve
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
                    {selectedUnitForDocs.unitId} -{" "}
                    {selectedUnitForDocs.projectName}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleApplyExistingDocs}
                    className="border border-black px-4 py-2 hover:bg-gray-200"
                  >
                    Apply Existing Docs
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
                  {getDocumentStatus(selectedUnitForDocs.id)}
                </span>
              </p>

              <p className="text-sm text-gray-600">
                Mark each document as submitted after the admin checks the physical copy.
              </p>
            </div>

            <div className="overflow-y-auto p-4">
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
                        Status ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Reviewed By ↕
                      </th>
                      <th className="border-r border-black px-4 py-2 text-left">
                        Reviewed At ↕
                      </th>
                      <th className="px-4 py-2 text-left">
                        Action ↕
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {getDocumentsByClientUnitId(selectedUnitForDocs.id).map(
                      (doc, index) => (
                        <tr key={doc.id} className="border-b border-black">
                          <td className="border-r border-black px-4 py-2">
                            {index + 1}
                          </td>

                          <td className="border-r border-black px-4 py-2">
                            {doc.name}
                          </td>

                          <td className="border-r border-black px-4 py-2">
                            {doc.isRequired ? "Yes" : "No"}
                          </td>

                          <td className="border-r border-black px-4 py-2">
                            {doc.status === "submitted"
                              ? "Submitted"
                              : "Not Submitted"}
                          </td>

                          <td className="border-r border-black px-4 py-2">
                            {doc.reviewedBy || "-"}
                          </td>

                          <td className="border-r border-black px-4 py-2">
                            {doc.reviewedAt || "-"}
                          </td>

                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleToggleDocumentStatus(doc.id)}
                              className="border border-black px-3 py-1 hover:bg-gray-200"
                            >
                              {doc.status === "submitted"
                                ? "Mark Not Submitted"
                                : "Mark Submitted"}
                            </button>
                          </td>
                        </tr>
                      )
                    )}

                    {getDocumentsByClientUnitId(selectedUnitForDocs.id).length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-600"
                        >
                          No documents found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-black p-4 text-sm text-gray-600">
              This is a physical checklist. No file upload is required unless you want digital document storage later.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientListings