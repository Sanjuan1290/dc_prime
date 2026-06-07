import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type Client = {
  id: number
  full_name: string
  spouse_co_owner_name: string | null
  email: string | null
  contact_no: string | null
  address: string | null
  created_at: string
  updated_at: string
  units_count: number | string
  balance: number | string
}

type ClientFormData = {
  full_name: string
  spouse_co_owner_name: string
  email: string
  contact_no: string
  address: string
}

type ClientsResponse = {
  clients: Client[]
}

const emptyFormData: ClientFormData = {
  full_name: "",
  spouse_co_owner_name: "",
  email: "",
  contact_no: "",
  address: "",
}

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

const fetchClients = async () => {
  const response = await fetch(`${API_URL}/clients`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ClientsResponse

  return data.clients
}

const createClient = async (clientData: ClientFormData) => {
  const response = await fetch(`${API_URL}/clients`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

const updateClient = async ({
  id,
  clientData,
}: {
  id: number
  clientData: ClientFormData
}) => {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

const clientToFormData = (client: Client): ClientFormData => ({
  full_name: client.full_name,
  spouse_co_owner_name: client.spouse_co_owner_name || "",
  email: client.email || "",
  contact_no: client.contact_no || "",
  address: client.address || "",
})

const Clients = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData)
  const [editFormData, setEditFormData] = useState<ClientFormData>(emptyFormData)

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  })

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setIsAddOpen(false)
      resetForm()
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setEditClient(null)
    },
  })

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const openEditModal = (client: Client) => {
    setEditClient(client)
    setEditFormData(clientToFormData(client))
  }

  const handleAddClient = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    createClientMutation.mutate(formData)
  }

  const handleUpdateClient = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editClient) return

    updateClientMutation.mutate({
      id: editClient.id,
      clientData: editFormData,
    })
  }

  const filteredClients = clients.filter((client) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      client.full_name.toLowerCase().includes(search) ||
      (client.spouse_co_owner_name || "").toLowerCase().includes(search) ||
      (client.email || "").toLowerCase().includes(search) ||
      (client.contact_no || "").toLowerCase().includes(search) ||
      (client.address || "").toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Client Master List</h1>
        <p className="text-sm text-gray-600">
          Live client records from MySQL with editable client records
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
            placeholder="Search client name, spouse, email, contact, or address..."
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

      {isLoading && (
        <div className="border border-black px-4 py-6 text-center text-gray-600">
          Loading clients...
        </div>
      )}

      {error && !isLoading && (
        <div className="border border-black px-4 py-6 text-center text-gray-600">
          Failed to load clients
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">
                  Client Name
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Email
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Contact
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Units
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Balance
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Address
                </th>
                <th className="px-4 py-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">
                    {client.full_name}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {client.email || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {client.contact_no || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {Number(client.units_count || 0)}
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
                        onClick={() => openEditModal(client)}
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
      )}

      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Client</h2>

            <form onSubmit={handleAddClient} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Full name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Spouse / Co-owner name"
                value={formData.spouse_co_owner_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    spouse_co_owner_name: e.target.value,
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
                value={formData.contact_no}
                onChange={(e) =>
                  setFormData({ ...formData, contact_no: e.target.value })
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

              {createClientMutation.isError && (
                <p className="text-sm text-red-600">
                  {createClientMutation.error.message}
                </p>
              )}

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
                  disabled={createClientMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createClientMutation.isPending ? "Saving..." : "Save Client"}
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
                value={editFormData.full_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, full_name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editFormData.spouse_co_owner_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    spouse_co_owner_name: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editFormData.contact_no}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, contact_no: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              {updateClientMutation.isError && (
                <p className="text-sm text-red-600">
                  {updateClientMutation.error.message}
                </p>
              )}

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
                  disabled={updateClientMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
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
