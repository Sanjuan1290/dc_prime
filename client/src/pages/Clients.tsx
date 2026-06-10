import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiPlus,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import ConfirmBox from "../components/ui/ConfirmBox";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import StatCard from "../components/ui/StatCard";
import TableContainer from "../components/ui/TableContainer";
import { API_URL, getErrorMessage } from "../utils/api";
import { formatMoney, formatText } from "../utils/formatters";
import { paginateRows } from "../utils/pagination";

type Client = {
  id: number;
  full_name: string;
  spouse_co_owner_name: string | null;
  email: string | null;
  contact_no: string | null;
  address: string | null;
  region: string | null;
  default_seller_id: number | null;
  default_seller_name: string | null;
  default_seller_role: string | null;
  units_count: number | string;
  balance: number | string;
  created_at: string;
  updated_at: string;
};

type ClientFormData = {
  full_name: string;
  spouse_co_owner_name: string;
  email: string;
  contact_no: string;
  address: string;
  region: string;
  default_seller_id: number | null;
};

type AccreditedSeller = {
  id: number;
  full_name: string;
  seller_role: string;
  status: string;
};

type ClientsResponse = {
  clients: Client[];
};

type AccreditedSellersResponse = {
  accreditedSellers: AccreditedSeller[];
};

const emptyFormData: ClientFormData = {
  full_name: "",
  spouse_co_owner_name: "",
  email: "",
  contact_no: "",
  address: "",
  region: "",
  default_seller_id: null,
};

const fetchClients = async () => {
  const response = await fetch(`${API_URL}/clients`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as ClientsResponse;
  return data.clients;
};

const fetchAccreditedSellers = async () => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as AccreditedSellersResponse;
  return data.accreditedSellers;
};

const createClient = async (clientData: ClientFormData) => {
  const response = await fetch(`${API_URL}/clients`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const updateClient = async ({
  id,
  clientData,
}: {
  id: number;
  clientData: ClientFormData;
}) => {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const deleteClient = async (id: number) => {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const clientToFormData = (client: Client): ClientFormData => ({
  full_name: client.full_name,
  spouse_co_owner_name: client.spouse_co_owner_name || "",
  email: client.email || "",
  contact_no: client.contact_no || "",
  address: client.address || "",
  region: client.region || "",
  default_seller_id: client.default_seller_id,
});

const Clients = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData);
  const [editFormData, setEditFormData] =
    useState<ClientFormData>(emptyFormData);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ["accredited-sellers"],
    queryFn: fetchAccreditedSellers,
  });

  const activeSellers = sellers.filter((seller) => seller.status === "active");

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsAddOpen(false);
      setFormData(emptyFormData);
      setSuccessMessage("Client added successfully");
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditClient(null);
      setEditFormData(emptyFormData);
      setSuccessMessage("Client updated successfully");
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setClientToDelete(null);
      setSuccessMessage("Client deleted successfully");
    },
  });

  const filteredClients = clients.filter((client) => {
    const search = searchInput.toLowerCase().trim();

    if (!search) return true;

    return (
      client.full_name.toLowerCase().includes(search) ||
      (client.spouse_co_owner_name || "").toLowerCase().includes(search) ||
      (client.email || "").toLowerCase().includes(search) ||
      (client.contact_no || "").toLowerCase().includes(search) ||
      (client.address || "").toLowerCase().includes(search) ||
      (client.region || "").toLowerCase().includes(search) ||
      (client.default_seller_name || "").toLowerCase().includes(search) ||
      (client.default_seller_role || "").toLowerCase().includes(search)
    );
  });

  const paginatedClients = paginateRows(filteredClients, page, rowsPerPage);

  const totalClients = clients.length;
  const totalUnits = clients.reduce(
    (sum, client) => sum + Number(client.units_count || 0),
    0,
  );
  const totalBalance = clients.reduce(
    (sum, client) => sum + Number(client.balance || 0),
    0,
  );
  const clientsWithSeller = clients.filter(
    (client) => client.default_seller_id,
  ).length;

  const openAddModal = () => {
    setFormData(emptyFormData);
    setSuccessMessage("");
    setIsAddOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditClient(client);
    setEditFormData(clientToFormData(client));
    setSuccessMessage("");
  };

  const handleAddClient = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    createClientMutation.mutate(formData);
  };

  const handleUpdateClient = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!editClient) return;

    updateClientMutation.mutate({
      id: editClient.id,
      clientData: editFormData,
    });
  };

  const mutationError =
    createClientMutation.error?.message ||
    updateClientMutation.error?.message ||
    deleteClientMutation.error?.message;

  if (isLoading) {
    return <LoadingState label="Loading clients..." />;
  }

  if (error) {
    return <Alert variant="error" title="Failed to load clients" />;
  }

  return (
    <div>
      <PageHeader
        icon={<FiUsers />}
        title="Clients"
        subtitle="Manage buyer profiles, default sellers, units, and balances."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Client
          </Button>
        }
      />

      {successMessage ? (
        <Alert variant="success" title={successMessage} />
      ) : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Clients" value={totalClients} />
        <StatCard label="Total Units" value={totalUnits} />
        <StatCard label="Clients With Seller" value={clientsWithSeller} />
        <StatCard label="Total Balance" value={formatMoney(totalBalance)} />
      </div>

      <div className="mb-4">
        <Input
          icon={<FiSearch />}
          placeholder="Search client, contact, region, default seller..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Client Name</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-left">Default Seller</th>
              <th className="px-4 py-3 text-left">Units</th>
              <th className="px-4 py-3 text-left">Balance</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {client.full_name}
                  </p>
                  {client.spouse_co_owner_name ? (
                    <p className="text-xs text-slate-500">
                      Co-owner: {client.spouse_co_owner_name}
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{client.contact_no || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {client.email || "-"}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {client.region || "-"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {client.default_seller_name ? (
                    <div>
                      <p className="font-semibold text-slate-900">
                        {client.default_seller_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatText(client.default_seller_role)}
                      </p>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {client.units_count}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatMoney(client.balance)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEye />}
                      onClick={() => navigate(`/client/${client.id}`)}
                    >
                      View
                    </Button>

                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => openEditModal(client)}
                    >
                      Edit
                    </Button>

                    <Button
                      disabled={Number(client.units_count || 0) > 0}
                      icon={<FiTrash2 />}
                      onClick={() => setClientToDelete(client)}
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="No clients found"
                    description="Try another search or add a new client."
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
        totalRows={filteredClients.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <Modal title="Add Client" onClose={() => setIsAddOpen(false)} size="lg">
          <ClientForm
            clientData={formData}
            setClientData={setFormData}
            sellers={activeSellers}
            onSubmit={handleAddClient}
            onCancel={() => setIsAddOpen(false)}
            isPending={createClientMutation.isPending}
            submitLabel="Add Client"
            error={createClientMutation.error?.message}
          />
        </Modal>
      ) : null}

      {clientToDelete ? (
        <Modal onClose={() => setClientToDelete(null)} title="Delete Client">
          {deleteClientMutation.error ? (
            <Alert variant="error" title={deleteClientMutation.error.message} />
          ) : null}
          <ConfirmBox
            message={`Are you sure you want to delete ${clientToDelete.full_name}? This cannot be undone.`}
            onCancel={() => setClientToDelete(null)}
            onConfirm={() => deleteClientMutation.mutate(clientToDelete.id)}
            confirmLabel={
              deleteClientMutation.isPending ? "Deleting..." : "Delete"
            }
          />
        </Modal>
      ) : null}

      {editClient ? (
        <Modal
          title="Edit Client"
          onClose={() => setEditClient(null)}
          size="lg"
        >
          <ClientForm
            clientData={editFormData}
            setClientData={setEditFormData}
            sellers={activeSellers}
            onSubmit={handleUpdateClient}
            onCancel={() => setEditClient(null)}
            isPending={updateClientMutation.isPending}
            submitLabel="Save Changes"
            error={
              updateClientMutation.error?.message ||
              deleteClientMutation.error?.message
            }
          />
        </Modal>
      ) : null}
    </div>
  );
};

type ClientFormProps = {
  clientData: ClientFormData;
  setClientData: (clientData: ClientFormData) => void;
  sellers: AccreditedSeller[];
  onSubmit: (e: { preventDefault: () => void }) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  error?: string;
};


type SellerComboboxProps = {
  label: string
  sellers: AccreditedSeller[]
  value: number | null
  onChange: (sellerId: number | null) => void
}

const SellerCombobox = ({
  label,
  sellers,
  value,
  onChange,
}: SellerComboboxProps) => {
  const selectedSeller = sellers.find(
    (seller) => Number(seller.id) === Number(value)
  )
  const [search, setSearch] = useState(
    selectedSeller
      ? `${selectedSeller.full_name} - ${formatText(selectedSeller.seller_role)}`
      : ""
  )

  const filteredSellers = sellers.filter((seller) => {
    const keyword = search.toLowerCase().trim()

    if (!keyword || Number(seller.id) === Number(value)) return true

    return [seller.full_name, seller.seller_role, seller.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  })

  return (
    <div className="space-y-2">
      <Input
        label={label}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          onChange(null)
        }}
        placeholder="Search seller name or role"
      />

      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
          onClick={() => {
            onChange(null)
            setSearch("")
          }}
          type="button"
        >
          No default seller
        </button>

        {filteredSellers.length > 0 ? (
          filteredSellers.map((seller) => {
            const isSelected = Number(seller.id) === Number(value)
            const sellerLabel = `${seller.full_name} - ${formatText(seller.seller_role)}`

            return (
              <button
                className={[
                  "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50",
                  isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700",
                ].join(" ")}
                key={seller.id}
                onClick={() => {
                  onChange(seller.id)
                  setSearch(sellerLabel)
                }}
                type="button"
              >
                <span className="font-semibold text-slate-900">
                  {seller.full_name}
                </span>
                <span className="block text-xs text-slate-500">
                  {formatText(seller.seller_role)}
                </span>
              </button>
            )
          })
        ) : (
          <p className="px-3 py-2 text-sm text-slate-500">No sellers found.</p>
        )}
      </div>
    </div>
  )
}

const ClientForm = ({
  clientData,
  setClientData,
  sellers,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  error,
}: ClientFormProps) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Client Name"
          value={clientData.full_name}
          onChange={(e) =>
            setClientData({
              ...clientData,
              full_name: e.target.value,
            })
          }
          required
        />

        <Input
          label="Spouse / Co-owner Name"
          value={clientData.spouse_co_owner_name}
          onChange={(e) =>
            setClientData({
              ...clientData,
              spouse_co_owner_name: e.target.value,
            })
          }
        />

        <Input
          label="Email"
          type="email"
          value={clientData.email}
          onChange={(e) =>
            setClientData({
              ...clientData,
              email: e.target.value,
            })
          }
        />

        <Input
          label="Contact No."
          value={clientData.contact_no}
          onChange={(e) =>
            setClientData({
              ...clientData,
              contact_no: e.target.value,
            })
          }
        />

        <Input
          label="Region"
          value={clientData.region}
          onChange={(e) =>
            setClientData({
              ...clientData,
              region: e.target.value,
            })
          }
        />

        <SellerCombobox
          label="Default Seller"
          sellers={sellers}
          value={clientData.default_seller_id}
          onChange={(sellerId) =>
            setClientData({
              ...clientData,
              default_seller_id: sellerId,
            })
          }
        />

        <div className="md:col-span-2">
          <Input
            label="Address"
            value={clientData.address}
            onChange={(e) =>
              setClientData({
                ...clientData,
                address: e.target.value,
              })
            }
          />
        </div>
      </div>

      <Alert variant="info">
        The default seller will auto-fill later when reserving a listing for
        this client, but you can still change the seller per unit.
      </Alert>

      {error ? <Alert title={error} variant="error" /> : null}

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button disabled={isPending} type="submit" variant="primary">
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default Clients;
