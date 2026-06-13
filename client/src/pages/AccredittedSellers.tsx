import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUsers } from "react-icons/fi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import ConfirmBox from "../components/ui/ConfirmBox";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import Select from "../components/ui/Select";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import TableContainer from "../components/ui/TableContainer";
import { API_URL, getErrorMessage } from "../utils/api";
import { formatDate, formatNumber, formatText } from "../utils/formatters";
import { paginateRows } from "../utils/pagination";

type SellerStatus = "active" | "inactive" | string;

type SellerRole = "broker_network_manager" | "broker" | "manager" | "agent" | string;

type ReportsUnderMode = "none" | "seller" | "custom";

type AccreditedSeller = {
  id: number;
  user_id: number | null;
  user_full_name?: string | null;
  full_name: string;
  email: string | null;
  contact_no: string | null;
  seller_role: SellerRole;
  parent_seller_id: number | null;
  parent_seller_name: string | null;
  custom_reports_under: string | null;
  reports_under_display: string | null;
  status: SellerStatus;
  accreditation_date: string | null;
  commission_rate: number | string | null;
  commission_pool_rate?: number | string | null;
  personal_commission_rate?: number | string | null;
  override_commission_rate?: number | string | null;
  max_downline_rate?: number | string | null;
  rate_set_by_name?: string | null;
  rate_updated_at?: string | null;
  created_at: string;
  updated_at: string;
};

type SellerFormData = {
  full_name: string;
  email: string;
  contact_no: string;
  seller_role: SellerRole;
  parent_seller_id: string;
  custom_reports_under: string;
  reports_under_mode: ReportsUnderMode;
  status: SellerStatus;
  accreditation_date: string;
  commission_rate: string;
  commission_pool_rate: string;
  personal_commission_rate: string;
  override_commission_rate: string;
  max_downline_rate: string;
};

type SellersResponse = {
  accreditedSellers?: AccreditedSeller[];
  sellers?: AccreditedSeller[];
  data?: AccreditedSeller[];
};

const emptyFormData: SellerFormData = {
  full_name: "",
  email: "",
  contact_no: "",
  seller_role: "agent",
  parent_seller_id: "",
  custom_reports_under: "",
  reports_under_mode: "none",
  status: "active",
  accreditation_date: "",
  commission_rate: "",
  commission_pool_rate: "",
  personal_commission_rate: "",
  override_commission_rate: "",
  max_downline_rate: "",
};

const sellerRoles = ["broker_network_manager", "broker", "manager", "agent"];
const sellerStatuses = ["active", "inactive"];

const allowedParentRolesBySellerRole: Record<string, string[]> = {
  broker_network_manager: [],
  broker: ["broker_network_manager"],
  manager: ["broker"],
  agent: ["manager"],
};

const getAllowedParentRoles = (sellerRole: SellerRole) => allowedParentRolesBySellerRole[String(sellerRole)] || [];


const fetchSellers = async (): Promise<AccreditedSeller[]> => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as SellersResponse;
  return data.accreditedSellers || data.sellers || data.data || [];
};

const fetchPossibleParentSellers = async (
  excludeId: number | null,
): Promise<AccreditedSeller[]> => {
  const url = excludeId
    ? `${API_URL}/accredited-sellers/possible-parents?exclude_id=${excludeId}`
    : `${API_URL}/accredited-sellers/possible-parents`;
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as {
    possibleParentSellers?: AccreditedSeller[];
    data?: AccreditedSeller[];
  };

  return data.possibleParentSellers || data.data || [];
};

const createSeller = async (sellerData: SellerFormData) => {
  const response = await fetch(`${API_URL}/accredited-sellers`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatSellerPayload(sellerData)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const updateSeller = async ({
  id,
  sellerData,
}: {
  id: number;
  sellerData: SellerFormData;
}) => {
  const response = await fetch(`${API_URL}/accredited-sellers/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatSellerPayload(sellerData)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const formatSellerPayload = (sellerData: SellerFormData) => {
  const parentSellerId =
    sellerData.reports_under_mode === "seller" && sellerData.parent_seller_id
      ? Number(sellerData.parent_seller_id)
      : null;

  const customReportsUnder =
    sellerData.reports_under_mode === "custom"
      ? sellerData.custom_reports_under.trim()
      : null;

  return {
    full_name: sellerData.full_name.trim(),
    email: sellerData.email.trim() || null,
    contact_no: sellerData.contact_no.trim() || null,
    seller_role: sellerData.seller_role,
    parent_seller_id: parentSellerId,
    custom_reports_under: customReportsUnder,
    status: sellerData.status,
    accreditation_date: sellerData.accreditation_date || null,
    commission_rate:
      sellerData.commission_rate === ""
        ? null
        : Number(sellerData.commission_rate),
    commission_pool_rate:
      sellerData.commission_pool_rate === ""
        ? null
        : Number(sellerData.commission_pool_rate),
    personal_commission_rate:
      sellerData.personal_commission_rate === ""
        ? null
        : Number(sellerData.personal_commission_rate),
    override_commission_rate:
      sellerData.override_commission_rate === ""
        ? null
        : Number(sellerData.override_commission_rate),
    max_downline_rate:
      sellerData.max_downline_rate === ""
        ? null
        : Number(sellerData.max_downline_rate),
  };
};

const getReportsUnderMode = (seller: AccreditedSeller): ReportsUnderMode => {
  if (seller.parent_seller_id) return "seller";
  if (seller.custom_reports_under) return "custom";
  return "none";
};

const deleteSeller = async (id: number) => {
  const response = await fetch(`${API_URL}/accredited-sellers/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const sellerToFormData = (seller: AccreditedSeller): SellerFormData => {
  return {
    full_name: seller.full_name,
    email: seller.email || "",
    contact_no: seller.contact_no || "",
    seller_role: seller.seller_role,
    parent_seller_id: seller.parent_seller_id
      ? String(seller.parent_seller_id)
      : "",
    custom_reports_under: seller.custom_reports_under || "",
    reports_under_mode: getReportsUnderMode(seller),
    status: seller.status,
    accreditation_date: seller.accreditation_date
      ? seller.accreditation_date.slice(0, 10)
      : "",
    commission_rate:
      seller.commission_rate === null || seller.commission_rate === undefined
        ? ""
        : String(seller.commission_rate),
    commission_pool_rate:
      seller.commission_pool_rate === null || seller.commission_pool_rate === undefined
        ? ""
        : String(seller.commission_pool_rate),
    personal_commission_rate:
      seller.personal_commission_rate === null || seller.personal_commission_rate === undefined
        ? ""
        : String(seller.personal_commission_rate),
    override_commission_rate:
      seller.override_commission_rate === null || seller.override_commission_rate === undefined
        ? ""
        : String(seller.override_commission_rate),
    max_downline_rate:
      seller.max_downline_rate === null || seller.max_downline_rate === undefined
        ? ""
        : String(seller.max_downline_rate),
  };
};

const getCommissionRateDisplay = (rate: number | string | null) => {
  if (rate === null || rate === undefined || rate === "") return "-";
  return `${formatNumber(rate)}%`;
};

const AccredittedSellers = () => {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSeller, setEditSeller] = useState<AccreditedSeller | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<AccreditedSeller | null>(
    null,
  );

  const [formData, setFormData] = useState<SellerFormData>(emptyFormData);
  const [editFormData, setEditFormData] =
    useState<SellerFormData>(emptyFormData);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers"],
    queryFn: fetchSellers,
  });

  const { data: possibleParentSellers = [] } = useQuery<AccreditedSeller[]>({
    queryKey: ["accredited-sellers-possible-parents", editSeller?.id || null],
    queryFn: () => fetchPossibleParentSellers(editSeller?.id || null),
  });

  const invalidateSellerAndCommissionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["accredited-sellers"] });
    queryClient.invalidateQueries({
      queryKey: ["accredited-sellers-possible-parents"],
    });
    queryClient.invalidateQueries({ queryKey: ["commissions"] });
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] });
    queryClient.invalidateQueries({ queryKey: ["commission-releases"] });
    queryClient.invalidateQueries({ queryKey: ["client-units"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  };

  const createSellerMutation = useMutation({
    mutationFn: createSeller,
    onSuccess: () => {
      invalidateSellerAndCommissionQueries();
      setIsAddOpen(false);
      setFormData(emptyFormData);
      setSuccessMessage("Seller added successfully");
    },
  });

  const updateSellerMutation = useMutation({
    mutationFn: updateSeller,
    onSuccess: () => {
      invalidateSellerAndCommissionQueries();
      setEditSeller(null);
      setEditFormData(emptyFormData);
      setSuccessMessage("Seller updated successfully");
    },
  });

  const deleteSellerMutation = useMutation({
    mutationFn: deleteSeller,
    onSuccess: () => {
      invalidateSellerAndCommissionQueries();
      setSellerToDelete(null);
      setSuccessMessage("Seller deleted successfully");
    },
  });

  const filteredSellers = sellers.filter((seller) => {
    const search = searchInput.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      seller.full_name.toLowerCase().includes(search) ||
      (seller.email || "").toLowerCase().includes(search) ||
      (seller.contact_no || "").toLowerCase().includes(search) ||
      seller.seller_role.toLowerCase().includes(search) ||
      seller.status.toLowerCase().includes(search) ||
      (seller.parent_seller_name || "").toLowerCase().includes(search) ||
      (seller.custom_reports_under || "").toLowerCase().includes(search) ||
      (seller.reports_under_display || "").toLowerCase().includes(search);

    const matchesRole =
      roleFilter === "all" || seller.seller_role === roleFilter;

    const matchesStatus =
      statusFilter === "all" || seller.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedSellers = paginateRows(filteredSellers, page, rowsPerPage);

  const activeCount = useMemo(() => {
    return sellers.filter((seller) => seller.status === "active").length;
  }, [sellers]);

  const inactiveCount = useMemo(() => {
    return sellers.filter((seller) => seller.status === "inactive").length;
  }, [sellers]);

  const withRateCount = useMemo(() => {
    return sellers.filter(
      (seller) =>
        (seller.commission_pool_rate !== null && seller.commission_pool_rate !== undefined && seller.commission_pool_rate !== "") ||
        (seller.personal_commission_rate !== null && seller.personal_commission_rate !== undefined && seller.personal_commission_rate !== "") ||
        (seller.override_commission_rate !== null && seller.override_commission_rate !== undefined && seller.override_commission_rate !== "") ||
        (seller.commission_rate !== null && seller.commission_rate !== undefined && seller.commission_rate !== ""),
    ).length;
  }, [sellers]);

  const openAddModal = () => {
    setFormData(emptyFormData);
    setSuccessMessage("");
    setIsAddOpen(true);
  };

  const openEditModal = (seller: AccreditedSeller) => {
    setEditSeller(seller);
    setEditFormData(sellerToFormData(seller));
    setSuccessMessage("");
  };

  const handleCreateSeller = () => {
    createSellerMutation.mutate(formData);
  };

  const handleUpdateSeller = () => {
    if (!editSeller) return;

    updateSellerMutation.mutate({
      id: editSeller.id,
      sellerData: editFormData,
    });
  };

  const mutationError =
    createSellerMutation.error?.message ||
    updateSellerMutation.error?.message ||
    deleteSellerMutation.error?.message;

  if (isLoading) {
    return <LoadingState label="Loading accredited sellers..." />;
  }

  if (error) {
    return <Alert variant="error" title="Failed to load accredited sellers" />;
  }

  return (
    <div>
      <PageHeader
        icon={<FiUsers />}
        title="Accredited Sellers"
        subtitle="Manage seller hierarchy, reporting lines, and commission pool splits."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Seller
          </Button>
        }
      />

      {successMessage ? (
        <Alert variant="success" title={successMessage} />
      ) : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Sellers" value={sellers.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Inactive" value={inactiveCount} />
        <StatCard label="With Rates" value={withRateCount} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          icon={<FiSearch />}
          placeholder="Search sellers..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
        />

        <Select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Roles</option>
          {sellerRoles.map((role) => (
            <option key={role} value={role}>
              {formatText(role)}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          {sellerStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>

        <Button
          onClick={() => {
            setSearchInput("");
            setRoleFilter("all");
            setStatusFilter("all");
            setPage(1);
          }}
        >
          Reset
        </Button>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Reports Under</th>
              <th className="px-4 py-3 text-left">Pool</th>
              <th className="px-4 py-3 text-left">Personal</th>
              <th className="px-4 py-3 text-left">Override</th>
              <th className="px-4 py-3 text-left">Accreditation Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSellers.map((seller) => (
              <tr key={seller.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {seller.full_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    User: {seller.user_full_name || "-"}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <p>{seller.email || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {seller.contact_no || "-"}
                  </p>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatText(seller.seller_role)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {seller.reports_under_display || "-"}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {getCommissionRateDisplay(seller.commission_pool_rate || null)}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {getCommissionRateDisplay(seller.personal_commission_rate || seller.commission_rate)}
                </td>

                <td className="px-4 py-3 font-semibold text-slate-900">
                  {getCommissionRateDisplay(seller.override_commission_rate || null)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatDate(seller.accreditation_date)}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={seller.status} />
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatDate(seller.created_at)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => openEditModal(seller)}
                    >
                      Edit
                    </Button>
                    <Button
                      icon={<FiTrash2 />}
                      onClick={() => setSellerToDelete(seller)}
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedSellers.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState
                    title="No sellers found"
                    description="Add accredited sellers so reservations can generate commissions."
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
        totalRows={filteredSellers.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <SellerFormModal
          title="Add Accredited Seller"
          formData={formData}
          setFormData={setFormData}
          possibleParentSellers={possibleParentSellers}
          onClose={() => setIsAddOpen(false)}
          onSave={handleCreateSeller}
          isPending={createSellerMutation.isPending}
          submitLabel="Add Seller"
        />
      ) : null}

      {sellerToDelete ? (
        <Modal onClose={() => setSellerToDelete(null)} title="Delete Seller">
          {deleteSellerMutation.error ? (
            <Alert variant="error" title={deleteSellerMutation.error.message} />
          ) : null}
          <ConfirmBox
            message={`Are you sure you want to delete seller ${sellerToDelete.full_name}? This cannot be undone.`}
            onCancel={() => setSellerToDelete(null)}
            onConfirm={() => deleteSellerMutation.mutate(sellerToDelete.id)}
            confirmLabel={
              deleteSellerMutation.isPending ? "Deleting..." : "Delete"
            }
          />
        </Modal>
      ) : null}

      {editSeller ? (
        <SellerFormModal
          title={`Edit Seller - ${editSeller.full_name}`}
          formData={editFormData}
          setFormData={setEditFormData}
          possibleParentSellers={possibleParentSellers}
          onClose={() => setEditSeller(null)}
          onSave={handleUpdateSeller}
          isPending={updateSellerMutation.isPending}
          submitLabel="Save Changes"
        />
      ) : null}
    </div>
  );
};

type SellerFormModalProps = {
  title: string;
  formData: SellerFormData;
  setFormData: (data: SellerFormData) => void;
  possibleParentSellers: AccreditedSeller[];
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
  submitLabel: string;
};

const SellerFormModal = ({
  title,
  formData,
  setFormData,
  possibleParentSellers,
  onClose,
  onSave,
  isPending,
  submitLabel,
}: SellerFormModalProps) => {
  const allowedParentRoles = getAllowedParentRoles(formData.seller_role)
  const filteredParentSellers = possibleParentSellers.filter((seller) =>
    allowedParentRoles.includes(String(seller.seller_role))
  )

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={isPending} onClick={onSave} variant="primary">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Full Name"
          value={formData.full_name}
          onChange={(event) =>
            setFormData({
              ...formData,
              full_name: event.target.value,
            })
          }
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(event) =>
            setFormData({
              ...formData,
              email: event.target.value,
            })
          }
        />

        <Input
          label="Contact No."
          value={formData.contact_no}
          onChange={(event) =>
            setFormData({
              ...formData,
              contact_no: event.target.value,
            })
          }
        />

        <Select
          label="Seller Role"
          value={formData.seller_role}
          onChange={(event) =>
            setFormData({
              ...formData,
              seller_role: event.target.value,
              reports_under_mode: getAllowedParentRoles(event.target.value).length ? 'seller' : 'none',
              parent_seller_id: '',
              custom_reports_under: '',
            })
          }
        >
          {sellerRoles.map((role) => (
            <option key={role} value={role}>
              {formatText(role)}
            </option>
          ))}
        </Select>

        <Input
          label="Legacy Default Rate (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={formData.commission_rate}
          onChange={(event) =>
            setFormData({
              ...formData,
              commission_rate: event.target.value,
            })
          }
          placeholder="Fallback only"
        />

        <Input
          label="Commission Pool Rate (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={formData.commission_pool_rate}
          onChange={(event) =>
            setFormData({
              ...formData,
              commission_pool_rate: event.target.value,
            })
          }
          placeholder="Broker/BNM pool. Example: 8"
        />

        <Input
          label="Personal Commission Rate (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={formData.personal_commission_rate}
          onChange={(event) =>
            setFormData({
              ...formData,
              personal_commission_rate: event.target.value,
            })
          }
          placeholder="Seller's own sale/main rate"
        />

        <Input
          label="Override Commission Rate (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={formData.override_commission_rate}
          onChange={(event) =>
            setFormData({
              ...formData,
              override_commission_rate: event.target.value,
            })
          }
          placeholder="Manager override. Example: 2"
        />

        <Input
          label="Accreditation Date"
          type="date"
          value={formData.accreditation_date}
          onChange={(event) =>
            setFormData({
              ...formData,
              accreditation_date: event.target.value,
            })
          }
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(event) =>
            setFormData({
              ...formData,
              status: event.target.value,
            })
          }
        >
          {sellerStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Reports Under</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Reports Under Mode"
            value={formData.reports_under_mode}
            onChange={(event) =>
              setFormData({
                ...formData,
                reports_under_mode: event.target.value as ReportsUnderMode,
                parent_seller_id: "",
                custom_reports_under: "",
              })
            }
          >
            {allowedParentRoles.length === 0 ? <option value="none">None</option> : null}
            {allowedParentRoles.length > 0 ? <option value="seller">Existing Seller</option> : null}
            <option value="custom">Custom Name</option>
          </Select>

          {formData.reports_under_mode === "seller" ? (
            <Select
              label="Existing Seller"
              value={formData.parent_seller_id}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  parent_seller_id: event.target.value,
                })
              }
            >
              <option value="">Select seller</option>
              {filteredParentSellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.full_name} - {formatText(seller.seller_role)}
                </option>
              ))}
            </Select>
          ) : null}

          {formData.reports_under_mode === "custom" ? (
            <Input
              label="Custom Reports Under"
              value={formData.custom_reports_under}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  custom_reports_under: event.target.value,
                })
              }
              placeholder="Example: Outside Broker / Referral"
            />
          ) : null}
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Admin/super admin sets the main pool. Sellers can only split rates inside their allowed pool later. Distributed reservations now generate hierarchy commissions automatically.
        </p>
      </div>
    </Modal>
  );
};

export default AccredittedSellers;

