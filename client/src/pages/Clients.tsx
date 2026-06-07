import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { formatMoney, formatNumber } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

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
      resetForm()
      setSuccessMessage("Client created successfully")
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setEditClient(null)
      setSuccessMessage("Client updated successfully")
    },
  })

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const openEditModal = (client: Client) => {
    setEditClient(client)
    setEditFormData(clientToFormData(client))
  }

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

  const paginatedClients = paginateRows(filteredClients, page, rowsPerPage)
  const clientsWithUnits = clients.filter(
    (client) => Number(client.units_count || 0) > 0
  ).length
  const totalBalance = clients.reduce(
    (sum, client) => sum + Number(client.balance || 0),
    0
  )

  const formFields = (
    data: ClientFormData,
    setData: (data: ClientFormData) => void
  ) => (
    <div className="space-y-3">
      <Input
        label="Full name"
        onChange={(e) => setData({ ...data, full_name: e.target.value })}
        required
        value={data.full_name}
      />
      <Input
        label="Spouse / Co-owner name"
        onChange={(e) =>
          setData({ ...data, spouse_co_owner_name: e.target.value })
        }
        value={data.spouse_co_owner_name}
      />
      <Input
        label="Email"
        onChange={(e) => setData({ ...data, email: e.target.value })}
        type="email"
        value={data.email}
      />
      <Input
        label="Contact no."
        onChange={(e) => setData({ ...data, contact_no: e.target.value })}
        value={data.contact_no}
      />
      <Input
        label="Address"
        onChange={(e) => setData({ ...data, address: e.target.value })}
        value={data.address}
      />
    </div>
  )

  return (
    <div>
      <PageHeader
        actions={
          <Button icon={<FiPlus />} onClick={() => setIsAddOpen(true)} variant="primary">
            Add Client
          </Button>
        }
        icon={<FiUsers className="h-5 w-5" />}
        subtitle="Live client records from MySQL with editable client records"
        title="Client Master List"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Clients" value={clients.length} />
        <StatCard title="Clients With Units" value={clientsWithUnits} />
        <StatCard title="Total Balance" value={formatMoney(totalBalance)} />
        <StatCard title="Total Paid" value={formatMoney(0)} description="Available in reports" />
      </div>

      {successMessage ? (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Input
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search client name, spouse, email, contact, or address..."
            value={searchInput}
          />
          <Button
            icon={<FiSearch />}
            onClick={() => {
              setSearchInput("")
              setPage(1)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading clients..." /> : null}
      {error && !isLoading ? <Alert type="error">Failed to load clients</Alert> : null}

      {!isLoading && !error ? (
        filteredClients.length === 0 ? (
          <EmptyState title="No clients found" />
        ) : (
          <>
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Client Name",
                      "Email",
                      "Contact",
                      "Units",
                      "Balance",
                      "Address",
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
                  {paginatedClients.map((client) => (
                    <tr className="transition hover:bg-slate-50" key={client.id}>
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
                        {formatNumber(client.units_count)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMoney(client.balance)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {client.address || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button icon={<FiEdit2 />} onClick={() => openEditModal(client)}>
                            Edit
                          </Button>
                          <Button onClick={() => navigate(`/client/${client.id}`)}>
                            Unit List
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
              totalRows={filteredClients.length}
            />
          </>
        )
      ) : null}

      {isAddOpen ? (
        <Modal onClose={() => setIsAddOpen(false)} title="Add Client">
          <form className="space-y-4" onSubmit={handleAddClient}>
            {formFields(formData, setFormData)}
            {createClientMutation.isError ? (
              <Alert type="error">{createClientMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createClientMutation.isPending}
                type="submit"
                variant="primary"
              >
                {createClientMutation.isPending ? "Saving..." : "Save Client"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editClient ? (
        <Modal onClose={() => setEditClient(null)} title="Edit Client">
          <form className="space-y-4" onSubmit={handleUpdateClient}>
            {formFields(editFormData, setEditFormData)}
            {updateClientMutation.isError ? (
              <Alert type="error">{updateClientMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditClient(null)}>Cancel</Button>
              <Button
                disabled={updateClientMutation.isPending}
                type="submit"
                variant="primary"
              >
                {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export default Clients
