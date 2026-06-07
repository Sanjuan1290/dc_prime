import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { FiEdit2, FiPlus, FiSearch, FiUsers } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import StatCard from "../components/ui/StatCard"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatMoney } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type Client = {
  id: number
  full_name: string
  spouse_co_owner_name: string | null
  email: string | null
  contact_no: string | null
  address: string | null
  region: string | null
  units_count: number | string
  balance: number | string
  created_at: string
  updated_at: string
}

type ClientFormData = {
  full_name: string
  spouse_co_owner_name: string
  email: string
  contact_no: string
  address: string
  region: string
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
  region: "",
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

  return response.json()
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

  return response.json()
}

const clientToFormData = (client: Client): ClientFormData => ({
  full_name: client.full_name,
  spouse_co_owner_name: client.spouse_co_owner_name || "",
  email: client.email || "",
  contact_no: client.contact_no || "",
  address: client.address || "",
  region: client.region || "",
})

const Clients = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData)
  const [editFormData, setEditFormData] =
    useState<ClientFormData>(emptyFormData)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

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
      setFormData(emptyFormData)
      setSuccessMessage("Client created successfully")
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setEditClient(null)
      setEditFormData(emptyFormData)
      setSuccessMessage("Client updated successfully")
    },
  })

  const filteredClients = clients.filter((client) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      client.full_name.toLowerCase().includes(search) ||
      (client.spouse_co_owner_name || "").toLowerCase().includes(search) ||
      (client.email || "").toLowerCase().includes(search) ||
      (client.contact_no || "").toLowerCase().includes(search) ||
      (client.address || "").toLowerCase().includes(search) ||
      (client.region || "").toLowerCase().includes(search)
    )
  })

  const paginatedClients = paginateRows(filteredClients, page, rowsPerPage)

  const totalClients = clients.length
  const clientsWithUnits = clients.filter(
    (client) => Number(client.units_count || 0) > 0
  ).length
  const totalBalance = clients.reduce(
    (sum, client) => sum + Number(client.balance || 0),
    0
  )

  const handleAddClient = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createClientMutation.mutate(formData)
  }

  const handleUpdateClient = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editClient) return

    updateClientMutation.mutate({
      id: editClient.id,
      clientData: editFormData,
    })
  }

  const openEditModal = (client: Client) => {
    setEditClient(client)
    setEditFormData(clientToFormData(client))
  }

  const mutationError =
    createClientMutation.error?.message || updateClientMutation.error?.message

  if (isLoading) {
    return <LoadingState label="Loading clients..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load clients" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiUsers />}
        title="Clients"
        subtitle="Manage buyer records, contact details, address, region, and assigned units."
        actions={
          <Button
            icon={<FiPlus />}
            onClick={() => {
              setFormData(emptyFormData)
              setIsAddOpen(true)
              setSuccessMessage("")
            }}
            variant="primary"
          >
            Add Client
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Clients" value={totalClients} />
        <StatCard label="Clients With Units" value={clientsWithUnits} />
        <StatCard label="Total Balance" value={formatMoney(totalBalance)} />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          icon={<FiSearch />}
          placeholder="Search name, email, contact, address, or region..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
          className="md:w-96"
        />

        <Button
          onClick={() => {
            setSearchInput("")
            setPage(1)
          }}
        >
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Client Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Units</th>
              <th className="px-4 py-3 text-left">Balance</th>
              <th className="px-4 py-3 text-left">Address</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {client.full_name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {client.email || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {client.contact_no || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {client.units_count}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(client.balance)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {client.address || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {client.region || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => openEditModal(client)}
                    >
                      Edit
                    </Button>

                    <Button
                      onClick={() => navigate(`/client/${client.id}`)}
                      variant="primary"
                    >
                      Unit List
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState title="No clients found" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredClients.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal
          title="Add Client"
          onClose={() => setIsAddOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createClientMutation.isPending}
                form="add-client-form"
                type="submit"
                variant="primary"
              >
                {createClientMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </div>
          }
        >
          <form
            id="add-client-form"
            onSubmit={handleAddClient}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Input
              label="Full Name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
            />

            <Input
              label="Spouse / Co-owner Name"
              value={formData.spouse_co_owner_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  spouse_co_owner_name: e.target.value,
                })
              }
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <Input
              label="Contact No."
              value={formData.contact_no}
              onChange={(e) =>
                setFormData({ ...formData, contact_no: e.target.value })
              }
            />

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="md:col-span-2"
            />

            <Input
              label="Region"
              placeholder="Example: Region IV-A / CALABARZON"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              className="md:col-span-2"
            />
          </form>
        </Modal>
      ) : null}

      {editClient ? (
        <Modal
          title="Edit Client"
          onClose={() => setEditClient(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditClient(null)}>Cancel</Button>
              <Button
                disabled={updateClientMutation.isPending}
                form="edit-client-form"
                type="submit"
                variant="primary"
              >
                {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        >
          <form
            id="edit-client-form"
            onSubmit={handleUpdateClient}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Input
              label="Full Name"
              value={editFormData.full_name}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  full_name: e.target.value,
                })
              }
              required
            />

            <Input
              label="Spouse / Co-owner Name"
              value={editFormData.spouse_co_owner_name}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  spouse_co_owner_name: e.target.value,
                })
              }
            />

            <Input
              label="Email"
              type="email"
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  email: e.target.value,
                })
              }
            />

            <Input
              label="Contact No."
              value={editFormData.contact_no}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  contact_no: e.target.value,
                })
              }
            />

            <Input
              label="Address"
              value={editFormData.address}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  address: e.target.value,
                })
              }
              className="md:col-span-2"
            />

            <Input
              label="Region"
              placeholder="Example: Region IV-A / CALABARZON"
              value={editFormData.region}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  region: e.target.value,
                })
              }
              className="md:col-span-2"
            />
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export default Clients