import { useState } from "react"

type SellerStatus = "active" | "inactive"

type AccreditedSeller = {
  id: number
  status: SellerStatus
  fullName: string
  manager: string
  contactNo: string
  email: string
  createdAt: string
}

const AccredittedSellers = () => {
  const [sellers, setSellers] = useState<AccreditedSeller[]>([
    {
      id: 1,
      status: "inactive",
      fullName: "ORAPA, MARILOU",
      manager: "PARROCHO, JOSEPH E.",
      contactNo: "",
      email: "",
      createdAt: "2025-05-16",
    },
    {
      id: 2,
      status: "active",
      fullName: "NEPOMUCENO, ERWIN",
      manager: "PARROCHO, JOSEPH E.",
      contactNo: "0991-995-8155",
      email: "phproperty13@gmail.com",
      createdAt: "2025-06-06",
    },
    {
      id: 3,
      status: "inactive",
      fullName: "DE CASTRO, ROSE MARIE D.",
      manager: "HERNANDEZ, JULIE ANN D.",
      contactNo: "09237301104",
      email: "rosemariedecastro06@yahoo.com",
      createdAt: "2025-08-31",
    },
    {
      id: 4,
      status: "active",
      fullName: "BRIONES, CONIE, A.",
      manager: "HERNANDEZ, JULIE ANN D.",
      contactNo: "09948685799",
      email: "",
      createdAt: "2025-08-31",
    },
    {
      id: 5,
      status: "inactive",
      fullName: "TOLEDO, NICKIE ROSE E.",
      manager: "RIOJA, KIRSTEN JHOYCE A.",
      contactNo: "09941603497",
      email: "nickierosetoledo@gmail.com",
      createdAt: "2025-08-31",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<AccreditedSeller | null>(null)

  const [formData, setFormData] = useState({
    status: "active" as SellerStatus,
    fullName: "",
    manager: "",
    contactNo: "",
    email: "",
    createdAt: new Date().toISOString().slice(0, 10),
  })

  const resetForm = () => {
    setFormData({
      status: "active",
      fullName: "",
      manager: "",
      contactNo: "",
      email: "",
      createdAt: new Date().toISOString().slice(0, 10),
    })
  }

  const formatDate = (date: string) => {
    if (!date) return "-"

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleAddSeller = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newSeller: AccreditedSeller = {
      id: sellers.length + 1,
      ...formData,
    }

    setSellers((prev) => [...prev, newSeller])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateSeller = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editSeller) return

    setSellers((prev) =>
      prev.map((seller) =>
        seller.id === editSeller.id ? editSeller : seller
      )
    )

    setEditSeller(null)
  }

  const filteredSellers = sellers.filter((seller) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      seller.status.toLowerCase().includes(search) ||
      seller.fullName.toLowerCase().includes(search) ||
      seller.manager.toLowerCase().includes(search) ||
      seller.contactNo.toLowerCase().includes(search) ||
      seller.email.toLowerCase().includes(search) ||
      seller.createdAt.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Accredited Sellers</h1>
        <p className="text-sm text-gray-600">
          Seller accreditation records from MySQL
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Seller
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search status, agent, manager, contact, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <button
            onClick={() => setSearchInput("")}
            className="border border-black px-4 py-2 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Name of Agent ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Manager ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Accreditation Date ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Contact No. ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Email ↕
              </th>
              <th className="px-4 py-2 text-left">
                Actions ↕
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2 uppercase">
                  {seller.status}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.fullName}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.manager || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatDate(seller.createdAt)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.contactNo || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {seller.email || "-"}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditSeller(seller)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredSellers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                  No accredited sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Seller</h2>

            <form onSubmit={handleAddSeller} className="flex flex-col gap-3">
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as SellerStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <input
                type="text"
                placeholder="Name of agent"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Manager"
                value={formData.manager}
                onChange={(e) =>
                  setFormData({ ...formData, manager: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="date"
                value={formData.createdAt}
                onChange={(e) =>
                  setFormData({ ...formData, createdAt: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Contact no."
                value={formData.contactNo}
                onChange={(e) =>
                  setFormData({ ...formData, contactNo: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <div className="mt-2 flex justify-end gap-2">
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
                  Save Seller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editSeller && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Seller</h2>

            <form onSubmit={handleUpdateSeller} className="flex flex-col gap-3">
              <select
                value={editSeller.status}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    status: e.target.value as SellerStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <input
                type="text"
                value={editSeller.fullName}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    fullName: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editSeller.manager}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    manager: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="date"
                value={editSeller.createdAt}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    createdAt: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editSeller.contactNo}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    contactNo: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="email"
                value={editSeller.email}
                onChange={(e) =>
                  setEditSeller({
                    ...editSeller,
                    email: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSeller(null)}
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

export default AccredittedSellers