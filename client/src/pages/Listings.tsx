import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  FiEdit2,
  FiEye,
  FiFileText,
  FiGrid,
  FiPlus,
  FiSearch,
  FiTrash2,
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
import Select from "../components/ui/Select";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import TableContainer from "../components/ui/TableContainer";
import { API_URL, getErrorMessage } from "../utils/api";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatText,
} from "../utils/formatters";
import { paginateRows } from "../utils/pagination";

type ListingStatus =
  | "available"
  | "reserved"
  | "active"
  | "hold"
  | "sold"
  | "inactive"
  | string;

type Listing = {
  id: number;
  project_id: number;
  project_name: string;
  project_location?: string | null;
  project_location_code?: string | null;
  project_administrator?: string | null;
  cadastral_lot_no: string | null;
  unit_id: string;
  lot_type: string | null;
  reservation_fee: number | string;
  price_per_sqm: number | string;
  lot_area_sqm: number | string;
  legal_misc_rate: number | string;
  net_selling_price: number | string;
  legal_misc_fee: number | string;
  total_contract_price: number | string;
  thirty_percent?: number | string;
  spot_dp_discount?: number | string;
  spot_dp?: number | string;
  three_months?: number | string;
  seventy_five_percent?: number | string;
  twelve_months?: number | string;
  eighteen_months?: number | string;
  twenty_months?: number | string;
  status: ListingStatus;
  has_active_client_unit?: boolean | number | string;
  document_count?: number | string;
  required_document_count?: number | string;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: number;
  name: string;
  location_code: string;
};

type ClientUnitFullDetails = {
  id: number;
  client_id: number;
  listing_id: number;
  assigned_user_id: number | null;
  assigned_user_name: string | null;
  status: string;
  balance: number | string;
  due_day: number | null;
  created_at: string;
  updated_at: string;
  client_name: string;
  spouse_co_owner_name: string | null;
  client_email: string | null;
  client_contact_no: string | null;
  client_address: string | null;
  client_region: string | null;
};

type PaymentSummary = {
  total_paid: number | string;
  payment_count: number;
  latest_payment_date: string | null;
  latest_payment_amount: number | string;
  payment_status: string;
  balance: number | string;
};

type CommissionSummary = {
  seller_name: string | null;
  seller_role: string | null;
  reports_under: string | null;
  rate: number | string;
  amount: number | string;
  released_amount: number | string;
  remaining_amount: number | string;
  status: string | null;
};

type DocumentSummary = {
  total_documents: number;
  required_documents: number;
  submitted_documents: number;
  approved_documents: number;
  missing_required_documents: number;
  document_status: string;
};

type ListingDocumentRequirement = {
  id?: number;
  document_id: number | null;
  name: string;
  description?: string | null;
  can_reuse?: boolean | number;
  is_required: boolean | number;
  status: string;
  sort_order: number;
  source?: string;
};

type LibraryDocument = {
  id: number;
  name: string;
  description: string | null;
  can_reuse: boolean | number;
  status: string;
};

type ListingFullDetails = {
  listing: Listing;
  clientUnit: ClientUnitFullDetails | null;
  paymentSummary: PaymentSummary;
  commissionSummary: CommissionSummary;
  documentSummary: DocumentSummary;
  listingDocumentRequirements?: ListingDocumentRequirement[];
  documentRequirements?: ListingDocumentRequirement[];
};

type ListingFormData = {
  project_id: number;
  cadastral_lot_no: string;
  unit_id: string;
  lot_type: string;
  reservation_fee: number;
  price_per_sqm: number;
  lot_area_sqm: number;
  legal_misc_rate: number;
  status: ListingStatus;
};

type ListingsResponse = {
  listings: Listing[];
};

type ProjectsResponse = {
  projects: Project[];
};

const defaultListingFormData: ListingFormData = {
  project_id: 0,
  cadastral_lot_no: "",
  unit_id: "",
  lot_type: "inner",
  reservation_fee: 50000,
  price_per_sqm: 0,
  lot_area_sqm: 0,
  legal_misc_rate: 10,
  status: "available",
};

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Active", value: "active" },
  { label: "Hold", value: "hold" },
  { label: "Sold", value: "sold" },
  { label: "Inactive", value: "inactive" },
];

const normalLotTypes = ["inner", "corner", "end"];

const chartColors = ["#2563eb", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];

const formulaTooltips: Record<string, string> = {
  Installment: "Lot/installment type. Value comes from listing.lot_type.",
  "Unit ID": "Unit identifier. Value comes from listing.unit_id.",
  Area: "Area = lot_area_sqm. This is the lot area in square meters.",
  "Price per SQM":
    "Price per SQM = price_per_sqm. This is the selling price per square meter.",
  "Net Selling Price": "Net Selling Price = Area × Price per SQM.",
  LMF: "LMF = Legal/Misc Fee rate. LMF Amount = Net Selling Price × LMF%.",
  TCP: "TCP = Net Selling Price + Legal/Misc Fee Amount.",
  RS: "RS = Reservation Fee. This is deducted from the 30% downpayment computation.",
  "30%": "30% Downpayment Balance = (TCP × 30%) - Reservation Fee.",
  "7.5%": "7.5% Discount = 30% Downpayment Balance × 7.5%.",
  "SPOT DP": "SPOT DP = 30% Downpayment Balance - 7.5% Discount.",
  "3 Months": "3 Months = 30% Downpayment Balance ÷ 3.",
  "75%": "75% Balance = TCP × 75%.",
  "12 Months": "12 Months = 75% Balance ÷ 12.",
  "18 Months": "18 Months = 75% Balance ÷ 18.",
  "20 Months": "20 Months = 75% Balance ÷ 20.",
  Project: "Project name. Value comes from listing.project_name.",
  Status:
    "Listing status. Example: available, reserved, active, hold, sold, inactive.",
  Actions: "Row actions: Details, Edit, Delete.",
};

const FormulaHeader = ({ label }: { label: string }) => {
  return (
    <th className="px-4 py-3 text-left">
      <span
        className="cursor-help border-b border-dotted border-slate-400"
        title={formulaTooltips[label] || "No formula available."}
      >
        {label}
      </span>
    </th>
  );
};

const fetchListings = async () => {
  const response = await fetch(`${API_URL}/listings`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as ListingsResponse;
  return data.listings;
};

const fetchProjects = async () => {
  const response = await fetch(`${API_URL}/projects`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as ProjectsResponse;
  return data.projects;
};

const fetchListingFullDetails = async (listingId: number) => {
  const response = await fetch(
    `${API_URL}/listings/${listingId}/full-details`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as ListingFullDetails;
};

const fetchDocumentLibrary = async (): Promise<LibraryDocument[]> => {
  const response = await fetch(`${API_URL}/documents?status=active`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as { documents: LibraryDocument[] };
  return data.documents || [];
};

const updateListingDocumentRequirements = async ({
  listingId,
  requirements,
}: {
  listingId: number;
  requirements: ListingDocumentRequirement[];
}) => {
  const response = await fetch(
    `${API_URL}/listings/${listingId}/document-requirements`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_requirements: requirements }),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const resetListingDocumentRequirements = async (listingId: number) => {
  const response = await fetch(
    `${API_URL}/listings/${listingId}/document-requirements/reset`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const createListing = async (listingData: ListingFormData) => {
  const response = await fetch(`${API_URL}/listings`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listingData),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const updateListing = async ({
  id,
  listingData,
}: {
  id: number;
  listingData: ListingFormData;
}) => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listingData),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

const setupLotTypeState = (lotType: string | null) => {
  const value = lotType || "inner";

  if (normalLotTypes.includes(value)) {
    return {
      mode: value,
      custom: "",
    };
  }

  return {
    mode: "custom",
    custom: value,
  };
};

const resolveLotType = (mode: string, customValue: string) => {
  if (mode === "custom") return customValue.trim();
  return mode;
};

const deleteListing = async (id: number) => {
  const response = await fetch(`${API_URL}/listings/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const listingToFormData = (listing: Listing): ListingFormData => ({
  project_id: listing.project_id,
  cadastral_lot_no: listing.cadastral_lot_no || "",
  unit_id: listing.unit_id,
  lot_type: listing.lot_type || "inner",
  reservation_fee: Number(listing.reservation_fee || 50000),
  price_per_sqm: Number(listing.price_per_sqm || 0),
  lot_area_sqm: Number(listing.lot_area_sqm || 0),
  legal_misc_rate: Number(listing.legal_misc_rate || 10),
  status: listing.status,
});

const roundMoney = (value: number) => Number(value.toFixed(2));

const calculateListingBreakdown = (listingData: ListingFormData) => {
  const netSellingPrice =
    Number(listingData.lot_area_sqm || 0) *
    Number(listingData.price_per_sqm || 0);
  const legalMiscFee =
    netSellingPrice * (Number(listingData.legal_misc_rate || 0) / 100);
  const totalContractPrice = netSellingPrice + legalMiscFee;
  const downPaymentBalance = Math.max(
    totalContractPrice * 0.3 - Number(listingData.reservation_fee || 0),
    0,
  );
  const spotDpDiscount = downPaymentBalance * 0.075;
  const spotDp = downPaymentBalance - spotDpDiscount;
  const seventyFivePercent = totalContractPrice * 0.75;

  return {
    netSellingPrice: roundMoney(netSellingPrice),
    legalMiscFee: roundMoney(legalMiscFee),
    totalContractPrice: roundMoney(totalContractPrice),
    downPaymentBalance: roundMoney(downPaymentBalance),
    spotDpDiscount: roundMoney(spotDpDiscount),
    spotDp: roundMoney(spotDp),
    threeMonths: roundMoney(downPaymentBalance / 3),
    seventyFivePercent: roundMoney(seventyFivePercent),
    twelveMonths: roundMoney(seventyFivePercent / 12),
    eighteenMonths: roundMoney(seventyFivePercent / 18),
    twentyMonths: roundMoney(seventyFivePercent / 20),
  };
};

const hasAttachedClientUnit = (listing: Listing) => {
  return (
    Boolean(Number(listing.has_active_client_unit || 0)) ||
    ["reserved", "active", "sold"].includes(String(listing.status))
  );
};

const didLmfRateChange = (
  listing: Listing,
  nextListingData: ListingFormData,
) => {
  return (
    Number(listing.legal_misc_rate || 0) !==
    Number(nextListingData.legal_misc_rate || 0)
  );
};

const getProjectLocationPrefix = (projects: Project[], projectId: number) => {
  const project = projects.find(
    (item) => Number(item.id) === Number(projectId),
  );
  const locationCode = (project?.location_code || "").trim().toUpperCase();

  return locationCode ? `${locationCode}-` : "";
};

const Listings = () => {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [lotTypeFilter, setLotTypeFilter] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewListingId, setViewListingId] = useState<number | null>(null);
  const [documentListingId, setDocumentListingId] = useState<number | null>(
    null,
  );
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [pendingLmfUpdate, setPendingLmfUpdate] = useState<{
    id: number;
    listingData: ListingFormData;
    unitId: string;
  } | null>(null);

  const [formData, setFormData] = useState<ListingFormData>(
    defaultListingFormData,
  );
  const [editFormData, setEditFormData] = useState<ListingFormData>(
    defaultListingFormData,
  );

  const [lotTypeMode, setLotTypeMode] = useState("inner");
  const [customLotType, setCustomLotType] = useState("");
  const [editLotTypeMode, setEditLotTypeMode] = useState("inner");
  const [editCustomLotType, setEditCustomLotType] = useState("");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");
  const [addFormStatusMessage, setAddFormStatusMessage] = useState("");
  const [editFormStatusMessage, setEditFormStatusMessage] = useState("");

  const {
    data: listings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const {
    data: listingFullDetails,
    isLoading: isFullDetailsLoading,
    error: fullDetailsError,
  } = useQuery({
    queryKey: ["listing-full-details", viewListingId],
    queryFn: () => fetchListingFullDetails(viewListingId || 0),
    enabled: Boolean(viewListingId),
  });

  const {
    data: documentListingDetails,
    isLoading: isDocumentDetailsLoading,
    error: documentDetailsError,
  } = useQuery({
    queryKey: ["listing-full-details", documentListingId],
    queryFn: () => fetchListingFullDetails(documentListingId || 0),
    enabled: Boolean(documentListingId),
  });

  const createListingMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsAddOpen(false);
      resetForm();
      setAddFormStatusMessage("");
      setSuccessMessage("Listing created successfully");
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["client-units"] });
      queryClient.invalidateQueries({ queryKey: ["available-listings"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["commission-summary"] });
      queryClient.invalidateQueries({ queryKey: ["commission-releases"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      if (viewListingId) {
        queryClient.invalidateQueries({
          queryKey: ["listing-full-details", viewListingId],
        });
      }

      setEditListing(null);
      setPendingLmfUpdate(null);
      setEditFormStatusMessage("");
      setSuccessMessage("Listing updated successfully");
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setListingToDelete(null);
      setSuccessMessage("Listing deleted successfully");
    },
  });

  const projectFormDefault = () => projects[0]?.id ?? 0;

  const resetForm = () => {
    const projectId = projectFormDefault();

    setFormData({
      ...defaultListingFormData,
      project_id: projectId,
      unit_id: getProjectLocationPrefix(projects, projectId),
    });
    setLotTypeMode("inner");
    setCustomLotType("");
  };

  const openAddModal = () => {
    const projectId = projectFormDefault();

    setFormData({
      ...defaultListingFormData,
      project_id: projectId,
      unit_id: getProjectLocationPrefix(projects, projectId),
    });
    setLotTypeMode("inner");
    setCustomLotType("");
    setSuccessMessage("");
    setAddFormStatusMessage("");
    createListingMutation.reset();
    setIsAddOpen(true);
  };

  const openEditModal = (listing: Listing) => {
    setEditListing(listing);
    setEditFormData(listingToFormData(listing));
    setEditFormStatusMessage("");
    updateListingMutation.reset();

    const lotTypeState = setupLotTypeState(listing.lot_type);
    setEditLotTypeMode(lotTypeState.mode);
    setEditCustomLotType(lotTypeState.custom);
  };

  const handleAddListing = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    setAddFormStatusMessage("Saving listing...");

    createListingMutation.mutate({
      ...formData,
      lot_type: resolveLotType(lotTypeMode, customLotType),
    });
  };

  const handleUpdateListing = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!editListing) return;

    setEditFormStatusMessage("Saving listing changes...");

    const listingData = {
      ...editFormData,
      lot_type: resolveLotType(editLotTypeMode, editCustomLotType),
    };

    if (
      didLmfRateChange(editListing, listingData) &&
      hasAttachedClientUnit(editListing)
    ) {
      setEditFormStatusMessage("Review the LMF warning before saving.");
      setPendingLmfUpdate({
        id: editListing.id,
        listingData,
        unitId: editListing.unit_id,
      });
      return;
    }

    updateListingMutation.mutate({
      id: editListing.id,
      listingData,
    });
  };

  const filteredListings = listings.filter((listing) => {
    const search = searchInput.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      listing.project_name.toLowerCase().includes(search) ||
      (listing.cadastral_lot_no || "").toLowerCase().includes(search) ||
      listing.unit_id.toLowerCase().includes(search) ||
      (listing.lot_type || "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter;

    const matchesProject =
      projectFilter === "all" || String(listing.project_id) === projectFilter;

    const matchesLotType =
      lotTypeFilter === "all" || listing.lot_type === lotTypeFilter;

    return matchesSearch && matchesStatus && matchesProject && matchesLotType;
  });

  const paginatedListings = paginateRows(filteredListings, page, rowsPerPage);

  const allLotTypes = useMemo(() => {
    return [
      ...new Set(
        listings
          .map((listing) => listing.lot_type)
          .filter((lotType): lotType is string => Boolean(lotType)),
      ),
    ];
  }, [listings]);

  const listingStatusData = statusFilters
    .filter((status) => status.value !== "all")
    .map((status) => ({
      name: status.label,
      value: listings.filter((listing) => listing.status === status.value)
        .length,
    }));

  const totalValue = listings.reduce(
    (sum, listing) => sum + Number(listing.net_selling_price || 0),
    0,
  );

  const mutationError =
    createListingMutation.error?.message ||
    updateListingMutation.error?.message;

  if (isLoading) {
    return <LoadingState label="Loading listings..." />;
  }

  if (error) {
    return <Alert variant="error" title="Failed to load listings" />;
  }

  return (
    <div>
      <PageHeader
        icon={<FiGrid />}
        title="Listings / Units"
        subtitle="Manage live project inventory, lot details, prices, and statuses."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Listing
          </Button>
        }
      />

      {successMessage ? (
        <Alert variant="success" title={successMessage} />
      ) : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="All Listings" value={listings.length} />
        <StatCard
          label="Available"
          value={listings.filter((item) => item.status === "available").length}
        />
        <StatCard
          label="Reserved"
          value={listings.filter((item) => item.status === "reserved").length}
        />
        <StatCard
          label="Active"
          value={listings.filter((item) => item.status === "active").length}
        />
        <StatCard
          label="Hold"
          value={listings.filter((item) => item.status === "hold").length}
        />
        <StatCard label="Total Value" value={formatMoney(totalValue)} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Inventory Status
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={listingStatusData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {listingStatusData.map((_, index) => (
                  <Cell
                    key={chartColors[index]}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <Input
          icon={<FiSearch />}
          placeholder="Search unit, project, cadastral lot no..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
        />

        <Select
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setPage(1);
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
            setLotTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Lot Types</option>
          {allLotTypes.map((lotType) => (
            <option key={lotType} value={lotType}>
              {formatText(lotType)}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          {statusFilters.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>

        <Button
          onClick={() => {
            setSearchInput("");
            setProjectFilter("all");
            setLotTypeFilter("all");
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
              <FormulaHeader label="Unit Type" />
              <FormulaHeader label="Unit ID" />
              <FormulaHeader label="Area" />
              <FormulaHeader label="Price per SQM" />
              <FormulaHeader label="Net Selling Price" />
              <FormulaHeader label="LMF" />
              <FormulaHeader label="TCP" />
              <FormulaHeader label="RS" />
              <FormulaHeader label="30%" />
              <FormulaHeader label="7.5%" />
              <FormulaHeader label="SPOT DP" />
              <FormulaHeader label="3 Months" />
              <FormulaHeader label="75%" />
              <FormulaHeader label="12 Months" />
              <FormulaHeader label="18 Months" />
              <FormulaHeader label="20 Months" />
              <FormulaHeader label="Project" />
              <FormulaHeader label="Status" />
              <FormulaHeader label="Actions" />
            </tr>
          </thead>

          <tbody>
            {paginatedListings.map((listing) => (
              <tr key={listing.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">
                  {formatText(listing.lot_type)}
                </td>

                <td className="px-4 py-3 font-semibold">{listing.unit_id}</td>

                <td className="px-4 py-3 text-slate-600">
                  {formatNumber(listing.lot_area_sqm)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.price_per_sqm)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.net_selling_price)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatNumber(listing.legal_misc_rate)}%
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.total_contract_price)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.reservation_fee)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.thirty_percent)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.spot_dp_discount)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.spot_dp)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.three_months)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.seventy_five_percent)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.twelve_months)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.eighteen_months)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatMoney(listing.twenty_months)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {listing.project_name}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={listing.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEye />}
                      onClick={() => setViewListingId(listing.id)}
                    >
                      Details
                    </Button>

                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => openEditModal(listing)}
                    >
                      Edit
                    </Button>

                    <Button
                      disabled={!["available", "hold"].includes(listing.status)}
                      icon={<FiTrash2 />}
                      onClick={() => setListingToDelete(listing)}
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedListings.length === 0 ? (
              <tr>
                <td colSpan={19}>
                  <EmptyState title="No listings found" />
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
        <ListingFormModal
          title="Add Listing"
          projects={projects}
          formData={formData}
          setFormData={setFormData}
          lotTypeMode={lotTypeMode}
          setLotTypeMode={setLotTypeMode}
          customLotType={customLotType}
          setCustomLotType={setCustomLotType}
          onSubmit={handleAddListing}
          onClose={() => {
            setIsAddOpen(false);
            setAddFormStatusMessage("");
          }}
          isPending={createListingMutation.isPending}
          submitLabel="Add Listing"
          statusMessage={
            createListingMutation.isPending
              ? addFormStatusMessage || "Saving listing..."
              : ""
          }
          errorMessage={createListingMutation.error?.message || ""}
          autoPrefixUnitId
        />
      ) : null}

      {listingToDelete ? (
        <Modal onClose={() => setListingToDelete(null)} title="Delete Listing">
          {deleteListingMutation.error ? (
            <Alert
              variant="error"
              title={deleteListingMutation.error.message}
            />
          ) : null}
          <ConfirmBox
            message={`Are you sure you want to delete listing ${listingToDelete.unit_id}? This cannot be undone.`}
            onCancel={() => setListingToDelete(null)}
            onConfirm={() => deleteListingMutation.mutate(listingToDelete.id)}
            confirmLabel={
              deleteListingMutation.isPending ? "Deleting..." : "Delete"
            }
          />
        </Modal>
      ) : null}

      {editListing ? (
        <ListingFormModal
          title="Edit Listing"
          projects={projects}
          formData={editFormData}
          setFormData={setEditFormData}
          lotTypeMode={editLotTypeMode}
          setLotTypeMode={setEditLotTypeMode}
          customLotType={editCustomLotType}
          setCustomLotType={setEditCustomLotType}
          onSubmit={handleUpdateListing}
          onClose={() => {
            setEditListing(null);
            setPendingLmfUpdate(null);
            setEditFormStatusMessage("");
          }}
          isPending={updateListingMutation.isPending}
          submitLabel="Save Changes"
          statusMessage={
            updateListingMutation.isPending
              ? editFormStatusMessage || "Saving listing changes..."
              : editFormStatusMessage
          }
          errorMessage={updateListingMutation.error?.message || ""}
          onEditDocuments={() => setDocumentListingId(editListing.id)}
          documentSummaryText={
            Number(editListing.document_count || 0) > 0
              ? `${Number(editListing.document_count || 0)} docs / ${Number(editListing.required_document_count || 0)} required`
              : "No listing docs yet. Click Edit Documents to load project defaults or add documents."
          }
        />
      ) : null}

      {pendingLmfUpdate ? (
        <Modal
          onClose={() => setPendingLmfUpdate(null)}
          title="Confirm LMF Update"
        >
          <ConfirmBox
            title="This unit already has an active client account"
            message={`Changing the LMF rate for ${pendingLmfUpdate.unitId} will recalculate TCP and the client's remaining balance.`}
            cancelLabel="Review Changes"
            confirmLabel={
              updateListingMutation.isPending ? "Updating..." : "Proceed"
            }
            onCancel={() => setPendingLmfUpdate(null)}
            onConfirm={() =>
              updateListingMutation.mutate({
                id: pendingLmfUpdate.id,
                listingData: pendingLmfUpdate.listingData,
              })
            }
          />
        </Modal>
      ) : null}

      {viewListingId ? (
        <ListingDetailsModal
          details={listingFullDetails}
          error={fullDetailsError}
          isLoading={isFullDetailsLoading}
          onClose={() => setViewListingId(null)}
        />
      ) : null}

      {documentListingId ? (
        <ListingDocumentRequirementsModal
          details={documentListingDetails}
          error={documentDetailsError}
          isLoading={isDocumentDetailsLoading}
          onClose={() => setDocumentListingId(null)}
        />
      ) : null}
    </div>
  );
};

type ListingFormModalProps = {
  title: string;
  projects: Project[];
  formData: ListingFormData;
  setFormData: (data: ListingFormData) => void;
  lotTypeMode: string;
  setLotTypeMode: (value: string) => void;
  customLotType: string;
  setCustomLotType: (value: string) => void;
  onSubmit: (e: { preventDefault: () => void }) => void;
  onClose: () => void;
  isPending: boolean;
  submitLabel: string;
  autoPrefixUnitId?: boolean;
  onEditDocuments?: () => void;
  documentSummaryText?: string;
  statusMessage?: string;
  errorMessage?: string;
};

const ListingFormModal = ({
  title,
  projects,
  formData,
  setFormData,
  lotTypeMode,
  setLotTypeMode,
  customLotType,
  setCustomLotType,
  onSubmit,
  onClose,
  isPending,
  submitLabel,
  autoPrefixUnitId = false,
  onEditDocuments,
  documentSummaryText,
  statusMessage = "",
  errorMessage = "",
}: ListingFormModalProps) => {
  const formId = `${title.replaceAll(" ", "-").toLowerCase()}-form`;
  const breakdown = calculateListingBreakdown(formData);
  const breakdownRows = [
    ["Net Selling Price", breakdown.netSellingPrice],
    ["LMF Amount", breakdown.legalMiscFee],
    ["TCP", breakdown.totalContractPrice],
    ["30% of TCP less RS", breakdown.downPaymentBalance],
    ["7.5% Discount", breakdown.spotDpDiscount],
    ["Spot DP", breakdown.spotDp],
    ["3-month DP", breakdown.threeMonths],
    ["75% of TCP", breakdown.seventyFivePercent],
    ["12-month DP", breakdown.twelveMonths],
    ["18-month DP", breakdown.eighteenMonths],
    ["20-month DP", breakdown.twentyMonths],
  ] as const;

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            disabled={isPending}
            form={formId}
            type="submit"
            variant="primary"
          >
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {statusMessage ? <Alert variant="info" title={statusMessage} /> : null}
        {errorMessage ? (
          <Alert
            variant="error"
            title="Unable to save listing"
            message={errorMessage}
          />
        ) : null}

        <form
          id={formId}
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Select
            label="Project Name"
            value={formData.project_id}
            onChange={(e) => {
              const nextProjectId = Number(e.target.value);
              const oldPrefix = getProjectLocationPrefix(
                projects,
                formData.project_id,
              );
              const nextPrefix = getProjectLocationPrefix(
                projects,
                nextProjectId,
              );
              const currentUnitId = formData.unit_id.trim();
              const shouldReplacePrefix =
                autoPrefixUnitId &&
                (currentUnitId === "" ||
                  (oldPrefix !== "" && currentUnitId === oldPrefix));

              setFormData({
                ...formData,
                project_id: nextProjectId,
                unit_id: shouldReplacePrefix ? nextPrefix : formData.unit_id,
              });
            }}
            required
          >
            <option value={0}>Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.location_code
                  ? `${project.location_code} - ${project.name}`
                  : project.name}
              </option>
            ))}
          </Select>

          <Input
            label="Cadastral Lot No."
            value={formData.cadastral_lot_no}
            onChange={(e) =>
              setFormData({
                ...formData,
                cadastral_lot_no: e.target.value,
              })
            }
          />

          <Input
            label="Unit ID"
            value={formData.unit_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                unit_id: e.target.value,
              })
            }
            required
          />

          <Select
            label="Lot Type"
            value={lotTypeMode}
            onChange={(e) => {
              setLotTypeMode(e.target.value);

              if (e.target.value !== "custom") {
                setFormData({
                  ...formData,
                  lot_type: e.target.value,
                });
              }
            }}
          >
            <option value="inner">Inner</option>
            <option value="corner">Corner</option>
            <option value="end">End</option>
            <option value="custom">Custom</option>
          </Select>

          {lotTypeMode === "custom" ? (
            <Input
              label="Custom Lot Type"
              placeholder="Example: commercial, inner-corner, special lot"
              value={customLotType}
              onChange={(e) => setCustomLotType(e.target.value)}
              required
            />
          ) : null}

          <Input
            label="Reservation Fee"
            type="number"
            min={0}
            step="0.01"
            value={formData.reservation_fee}
            onChange={(e) =>
              setFormData({
                ...formData,
                reservation_fee: Number(e.target.value),
              })
            }
          />

          <Input
            label="Price / SQM"
            type="number"
            min={0}
            step="0.01"
            value={formData.price_per_sqm}
            onChange={(e) =>
              setFormData({
                ...formData,
                price_per_sqm: Number(e.target.value),
              })
            }
          />

          <Input
            label="Lot Area SQM"
            type="number"
            min={0}
            step="0.01"
            value={formData.lot_area_sqm}
            onChange={(e) =>
              setFormData({
                ...formData,
                lot_area_sqm: Number(e.target.value),
              })
            }
          />

          <div>
            <Input
              label="Legal / Misc Rate (%)"
              type="number"
              min={0}
              step="0.01"
              value={formData.legal_misc_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal_misc_rate: Number(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Enter percentage only. Example: 10 means 10%.
            </p>
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value,
              })
            }
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="active">Active</option>
            <option value="hold">Hold</option>
            <option value="sold">Sold</option>
            <option value="inactive">Inactive</option>
          </Select>

          {onEditDocuments ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Listing Document Requirements
                  </h3>
                  <p className="text-xs text-slate-600">
                    {documentSummaryText ||
                      "Open a focused modal to customize this listing's documents."}
                  </p>
                </div>
                <Button
                  icon={<FiFileText />}
                  onClick={onEditDocuments}
                  variant="primary"
                >
                  Edit Documents
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Live Price Breakdown
            </h3>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {breakdownRows.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900">
                    {formatMoney(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </form>
      </div>
    </Modal>
  );
};

type ListingDetailsModalProps = {
  details?: ListingFullDetails;
  error: unknown;
  isLoading: boolean;
  onClose: () => void;
};

const getRequirementsFromDetails = (details?: ListingFullDetails) =>
  (
    details?.listingDocumentRequirements ||
    details?.documentRequirements ||
    []
  ).map((requirement, index) => ({
    ...requirement,
    is_required: Boolean(requirement.is_required),
    sort_order: Number(requirement.sort_order || index + 1),
  }));

const ListingDetailsModal = ({
  details,
  error,
  isLoading,
  onClose,
}: ListingDetailsModalProps) => {
  return (
    <Modal
      title={
        details
          ? `Listing Details - ${details.listing.unit_id}`
          : "Listing Details"
      }
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      {isLoading ? <LoadingState label="Loading listing details..." /> : null}

      {error ? (
        <Alert
          variant="error"
          title="Failed to load listing full details"
          message="Please check the backend endpoint /listings/:id/full-details."
        />
      ) : null}

      {details ? (
        <div className="space-y-6">
          <DetailsSection title="Unit / Project Information">
            <Detail label="Project" value={details.listing.project_name} />
            <Detail
              label="Project Location"
              value={details.listing.project_location || "-"}
            />
            <Detail
              label="Administrator"
              value={details.listing.project_administrator || "-"}
            />
            <Detail
              label="Cadastral Lot No."
              value={details.listing.cadastral_lot_no || "-"}
            />
            <Detail label="Unit ID" value={details.listing.unit_id} />
            <Detail
              label="Lot Type"
              value={formatText(details.listing.lot_type)}
            />
            <Detail
              label="Listing Status"
              value={formatText(details.listing.status)}
            />
          </DetailsSection>

          <DetailsSection title="Lot Pricing">
            <Detail
              label="Lot Area SQM"
              value={`${formatNumber(details.listing.lot_area_sqm)} sqm`}
            />
            <Detail
              label="Price / SQM"
              value={formatMoney(details.listing.price_per_sqm)}
            />
            <Detail
              label="Net Selling Price"
              value={formatMoney(details.listing.net_selling_price)}
            />
            <Detail
              label="LMF Rate"
              value={`${formatNumber(details.listing.legal_misc_rate)}%`}
            />
            <Detail
              label="LMF Amount"
              value={formatMoney(details.listing.legal_misc_fee)}
            />
            <Detail
              label="TCP"
              value={formatMoney(details.listing.total_contract_price)}
            />
          </DetailsSection>

          <DetailsSection title="Sample Computation">
            <Detail
              label="RS"
              value={formatMoney(details.listing.reservation_fee)}
            />
            <Detail
              label="30%"
              value={formatMoney(details.listing.thirty_percent)}
            />
            <Detail
              label="7.5%"
              value={formatMoney(details.listing.spot_dp_discount)}
            />
            <Detail
              label="SPOT DP"
              value={formatMoney(details.listing.spot_dp)}
            />
            <Detail
              label="3 Months"
              value={formatMoney(details.listing.three_months)}
            />
            <Detail
              label="75%"
              value={formatMoney(details.listing.seventy_five_percent)}
            />
            <Detail
              label="12 Months"
              value={formatMoney(details.listing.twelve_months)}
            />
            <Detail
              label="18 Months"
              value={formatMoney(details.listing.eighteen_months)}
            />
            <Detail
              label="20 Months"
              value={formatMoney(details.listing.twenty_months)}
            />
          </DetailsSection>

          <DetailsSection title="Buyer Information">
            <Detail
              label="Buyer Name"
              value={details.clientUnit?.client_name || "No buyer assigned"}
            />
            <Detail
              label="Spouse / Co-owner"
              value={details.clientUnit?.spouse_co_owner_name || "-"}
            />
            <Detail
              label="Email"
              value={details.clientUnit?.client_email || "-"}
            />
            <Detail
              label="Contact No."
              value={details.clientUnit?.client_contact_no || "-"}
            />
            <Detail
              label="Address"
              value={details.clientUnit?.client_address || "-"}
            />
            <Detail
              label="Region"
              value={details.clientUnit?.client_region || "-"}
            />
            <Detail
              label="Assigned User"
              value={details.clientUnit?.assigned_user_name || "-"}
            />
            <Detail
              label="Due Day"
              value={
                details.clientUnit?.due_day
                  ? String(details.clientUnit.due_day)
                  : "-"
              }
            />
          </DetailsSection>

          <DetailsSection title="Payment Information">
            <Detail
              label="Total Paid"
              value={formatMoney(details.paymentSummary.total_paid)}
            />
            <Detail
              label="Balance"
              value={formatMoney(details.paymentSummary.balance)}
            />
            <Detail
              label="Payment Status"
              value={formatText(details.paymentSummary.payment_status)}
            />
            <Detail
              label="Payment Count"
              value={String(details.paymentSummary.payment_count)}
            />
            <Detail
              label="Latest Payment Date"
              value={formatDate(details.paymentSummary.latest_payment_date)}
            />
            <Detail
              label="Latest Payment Amount"
              value={formatMoney(details.paymentSummary.latest_payment_amount)}
            />
          </DetailsSection>

          <DetailsSection title="Seller / Commission">
            <Detail
              label="Seller"
              value={details.commissionSummary.seller_name || "-"}
            />
            <Detail
              label="Seller Role"
              value={formatText(details.commissionSummary.seller_role)}
            />
            <Detail
              label="Reports Under"
              value={details.commissionSummary.reports_under || "-"}
            />
            <Detail
              label="Commission Rate"
              value={`${formatNumber(details.commissionSummary.rate)}%`}
            />
            <Detail
              label="Commission Amount"
              value={formatMoney(details.commissionSummary.amount)}
            />
            <Detail
              label="Released Amount"
              value={formatMoney(details.commissionSummary.released_amount)}
            />
            <Detail
              label="Remaining Commission"
              value={formatMoney(details.commissionSummary.remaining_amount)}
            />
            <Detail
              label="Commission Status"
              value={formatText(details.commissionSummary.status)}
            />
          </DetailsSection>

          <DetailsSection title="Documents">
            <Detail
              label="Total Documents"
              value={String(details.documentSummary.total_documents)}
            />
            <Detail
              label="Required Documents"
              value={String(details.documentSummary.required_documents)}
            />
            <Detail
              label="Submitted Documents"
              value={String(details.documentSummary.submitted_documents)}
            />
            <Detail
              label="Approved Documents"
              value={String(details.documentSummary.approved_documents)}
            />
            <Detail
              label="Missing Required"
              value={String(details.documentSummary.missing_required_documents)}
            />
            <Detail
              label="Document Status"
              value={formatText(details.documentSummary.document_status)}
            />
          </DetailsSection>

          <DetailsSection title="System Information">
            <Detail
              label="Created At"
              value={formatDate(details.listing.created_at)}
            />
            <Detail
              label="Updated At"
              value={formatDate(details.listing.updated_at)}
            />
            <Detail
              label="Client Unit Created"
              value={formatDate(details.clientUnit?.created_at)}
            />
            <Detail
              label="Client Unit Updated"
              value={formatDate(details.clientUnit?.updated_at)}
            />
          </DetailsSection>
        </div>
      ) : null}
    </Modal>
  );
};

const ListingDocumentRequirementsModal = ({
  details,
  error,
  isLoading,
  onClose,
}: ListingDetailsModalProps) => {
  const queryClient = useQueryClient();
  const [requirements, setRequirements] = useState<
    ListingDocumentRequirement[]
  >([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  const { data: documentLibrary = [] } = useQuery({
    queryKey: ["documents", "library", "active"],
    queryFn: fetchDocumentLibrary,
  });

  useEffect(() => {
    setRequirements(getRequirementsFromDetails(details));
  }, [details]);

  const saveRequirementsMutation = useMutation({
    mutationFn: updateListingDocumentRequirements,
    onSuccess: () => {
      if (details?.listing.id) {
        queryClient.invalidateQueries({
          queryKey: ["listing-full-details", details.listing.id],
        });
        queryClient.invalidateQueries({ queryKey: ["listings"] });
      }
      setSuccessMessage("Listing document requirements saved");
    },
  });

  const resetRequirementsMutation = useMutation({
    mutationFn: resetListingDocumentRequirements,
    onSuccess: () => {
      if (details?.listing.id) {
        queryClient.invalidateQueries({
          queryKey: ["listing-full-details", details.listing.id],
        });
        queryClient.invalidateQueries({ queryKey: ["listings"] });
      }
      setSuccessMessage(
        "Listing document requirements reset to project defaults",
      );
    },
  });

  const updateRequirement = (
    index: number,
    updates: Partial<ListingDocumentRequirement>,
  ) => {
    setRequirements((current) =>
      current.map((requirement, i) =>
        i === index ? { ...requirement, ...updates } : requirement,
      ),
    );
  };

  const removeRequirement = (index: number) => {
    setRequirements((current) => current.filter((_, i) => i !== index));
  };

  const addLibraryRequirement = (documentId: string) => {
    const document = documentLibrary.find(
      (item) => String(item.id) === documentId,
    );
    if (!document) return;
    setRequirements((current) => {
      if (
        current.some((requirement) => requirement.document_id === document.id)
      )
        return current;
      return [
        ...current,
        {
          document_id: document.id,
          name: document.name,
          description: document.description,
          can_reuse: document.can_reuse,
          is_required: true,
          status: "active",
          sort_order: current.length + 1,
          source: "listing_override",
        },
      ];
    });
  };

  const selectedDocumentIds = new Set(
    requirements
      .map((requirement) => requirement.document_id)
      .filter(Boolean)
      .map(Number),
  );

  const filteredDocumentLibrary = documentLibrary.filter((document) =>
    [document.name, document.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(documentSearch.toLowerCase().trim()),
  );

  return (
    <Modal
      title={
        details
          ? `Edit Documents - ${details.listing.unit_id}`
          : "Edit Listing Documents"
      }
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button
            disabled={!details || saveRequirementsMutation.isPending}
            onClick={() => {
              if (!details) return;
              saveRequirementsMutation.mutate({
                listingId: details.listing.id,
                requirements,
              });
            }}
            variant="primary"
          >
            {saveRequirementsMutation.isPending
              ? "Saving..."
              : "Save Requirements"}
          </Button>
        </div>
      }
    >
      {isLoading ? <LoadingState label="Loading listing documents..." /> : null}

      {successMessage ? <Alert type="success">{successMessage}</Alert> : null}

      {error ? (
        <Alert
          variant="error"
          title="Failed to load listing documents"
          message="Please check the backend endpoint /listings/:id/full-details."
        />
      ) : null}

      {details ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {details.listing.project_name} / {details.listing.unit_id}
                </h3>
                <p className="text-sm text-slate-500">
                  Edit only this listing's document requirements. Existing
                  client-unit checklists keep their snapshot unless rebuilt
                  intentionally.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                  {requirements.length} docs
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {
                    requirements.filter(
                      (item) =>
                        Boolean(item.is_required) && item.status !== "inactive",
                    ).length
                  }{" "}
                  required
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="font-bold text-slate-900">
                  Add Existing Documents
                </h4>
                <p className="text-xs text-slate-500">
                  Create missing documents in Document Library first, then
                  search and add them here.
                </p>
              </div>
              <Button
                disabled={resetRequirementsMutation.isPending}
                onClick={() =>
                  resetRequirementsMutation.mutate(details.listing.id)
                }
              >
                Reset to Project Defaults
              </Button>
            </div>

            <Input
              icon={<FiSearch />}
              onChange={(e) => setDocumentSearch(e.target.value)}
              placeholder="Search document library..."
              value={documentSearch}
            />

            <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
              {filteredDocumentLibrary.map((document) => {
                const alreadySelected = selectedDocumentIds.has(
                  Number(document.id),
                );
                return (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    key={document.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {document.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {document.description || "No description"}
                        </p>
                      </div>
                      <Button
                        disabled={alreadySelected}
                        onClick={() =>
                          addLibraryRequirement(String(document.id))
                        }
                      >
                        {alreadySelected ? "Added" : "Add"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {saveRequirementsMutation.isError ? (
            <Alert type="error">{saveRequirementsMutation.error.message}</Alert>
          ) : null}
          {resetRequirementsMutation.isError ? (
            <Alert type="error">
              {resetRequirementsMutation.error.message}
            </Alert>
          ) : null}

          {requirements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              No document requirements configured for this listing.
            </div>
          ) : (
            <div className="space-y-2">
              {requirements.map((requirement, index) => (
                <div
                  className="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_150px_120px_auto]"
                  key={`${requirement.document_id || requirement.name}-${index}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {requirement.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {requirement.description ||
                        formatText(requirement.source || "listing_override")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Source:{" "}
                      {formatText(requirement.source || "listing_override")}
                    </p>
                  </div>
                  <Select
                    label="Requirement"
                    onChange={(e) =>
                      updateRequirement(index, {
                        is_required: e.target.value === "true",
                      })
                    }
                    value={String(Boolean(requirement.is_required))}
                  >
                    <option value="true">Required</option>
                    <option value="false">Optional</option>
                  </Select>
                  <Select
                    label="Status"
                    onChange={(e) =>
                      updateRequirement(index, { status: e.target.value })
                    }
                    value={requirement.status || "active"}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                  <Button
                    onClick={() => removeRequirement(index)}
                    variant="danger"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

type DetailsSectionProps = {
  children: React.ReactNode;
  title: string;
};

const DetailsSection = ({ children, title }: DetailsSectionProps) => {
  return (
    <section>
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
};

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  );
};

export default Listings;
