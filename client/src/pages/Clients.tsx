import { useState } from "react"
import { useNavigate } from "react-router-dom"

type Client = {
  id: number
  fullName: string
  spouseCoOwnerName: string
  email: string
  contactNo: string
  address: string
  units: number
  balance: number
}

const Clients = () => {
  const navigate = useNavigate()

  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      fullName: "AHMED, SARAH NACINO",
      spouseCoOwnerName: "aaron NACINO",
      email: "msx.sarah0929@gmail.com",
      contactNo: "0969-129-1596",
      address: "BIÑAN LAGUNA",
      units: 1,
      balance: 932000,
    },
    {
      id: 2,
      fullName: "ALAMER, JAZZIE",
      spouseCoOwnerName: "aaron jazzie",
      email: "alamermarkchristopher21@gmail.com",
      contactNo: "0927-437-5425",
      address: "GEN. TRI CAVITE",
      units: 1,
      balance: 214500,
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    spouseCoOwnerName: "",
    email: "",
    contactNo: "",
    address: "",
  })

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      spouseCoOwnerName: "",
      email: "",
      contactNo: "",
      address: "",
    })
  }

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newClient: Client = {
      id: clients.length + 1,
      ...formData,
      units: 0,
      balance: 0,
    }

    setClients((prev) => [...prev, newClient])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editClient) return

    setClients((prev) =>
      prev.map((client) =>
        client.id === editClient.id ? editClient : client
      )
    )

    setEditClient(null)
  }

  const filteredClients = clients.filter((client) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      client.fullName.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      client.contactNo.toLowerCase().includes(search) ||
      client.address.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Client Master List</h1>
        <p className="text-sm text-gray-600">
          Live client records imported from company files and editable in MySQL
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Client
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search client name, email, contact, or address..."
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
                Client Name ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Email ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Contact ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Units ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Balance ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Address ↕
              </th>
              <th className="px-4 py-2 text-left">
                Actions ↕
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {client.fullName}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {client.email || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {client.contactNo || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {client.units}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(client.balance)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {client.address || "-"}
                </td>

                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditClient(client)}
                      className="border border-black px-3 py-1 hover:bg-gray-200"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => navigate(`/client/${client.id}`)}
                      className="border border-black px-3 py-1 hover:bg-gray-200"
                    >
                      Unit List
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                  No clients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Client</h2>

            <form onSubmit={handleAddClient} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Full name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Spouse / Co-owner name"
                value={formData.spouseCoOwnerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    spouseCoOwnerName: e.target.value,
                  })
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
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
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
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editClient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Client</h2>

            <form onSubmit={handleUpdateClient} className="flex flex-col gap-3">
              <input
                type="text"
                value={editClient.fullName}
                onChange={(e) =>
                  setEditClient({ ...editClient, fullName: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editClient.spouseCoOwnerName}
                onChange={(e) =>
                  setEditClient({
                    ...editClient,
                    spouseCoOwnerName: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="email"
                value={editClient.email}
                onChange={(e) =>
                  setEditClient({ ...editClient, email: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editClient.contactNo}
                onChange={(e) =>
                  setEditClient({ ...editClient, contactNo: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editClient.address}
                onChange={(e) =>
                  setEditClient({ ...editClient, address: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditClient(null)}
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

export default Clients