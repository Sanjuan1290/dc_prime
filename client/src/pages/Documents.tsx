import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiEdit2,
  FiFileText,
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
import { paginateRows } from "../utils/pagination";

type DocumentStatus = "active" | "inactive" | string;

type DocumentItem = {
  id: number;
  name: string;
  description: string | null;
  is_required: boolean | number;
  can_reuse: boolean | number;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

type DocumentFormData = {
  name: string;
  description: string;
  is_required: boolean;
  can_reuse: boolean;
  status: DocumentStatus;
};

type DocumentsResponse = {
  documents: DocumentItem[];
};

const emptyFormData: DocumentFormData = {
  name: "",
  description: "",
  is_required: false,
  can_reuse: false,
  status: "active",
};

const fetchDocuments = async (): Promise<DocumentItem[]> => {
  const res = await fetch(`${API_URL}/documents`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  const data: DocumentsResponse = await res.json();
  return data.documents;
};

const createDocument = async (documentData: DocumentFormData) => {
  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
};

const updateDocument = async ({
  id,
  documentData,
}: {
  id: number;
  documentData: DocumentFormData;
}) => {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }
};

const deleteDocument = async (id: number) => {
  const response = await fetch(`${API_URL}/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const Documents = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
    const [reusableFilter, setReusableFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentItem | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>(emptyFormData);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(
    null,
  );

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery<DocumentItem[]>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setIsAddOpen(false);
      setFormData(emptyFormData);
      setSuccessMessage("Document created successfully");
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditDocument(null);
      setSuccessMessage("Document updated successfully");
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDocumentToDelete(null);
      setSuccessMessage("Document deleted successfully");
    },
  });

  const filteredDocuments = documents.filter((document) => {
    const search = searchInput.toLowerCase().trim();
    const matchesSearch =
      search === "" ||
      document.name.toLowerCase().includes(search) ||
      (document.description || "").toLowerCase().includes(search) ||
      document.status.toLowerCase().includes(search);
    const matchesStatus =
      statusFilter === "all" || document.status === statusFilter;
    const matchesRequired = true;
    const matchesReusable =
      reusableFilter === "all" ||
      String(Boolean(document.can_reuse)) === reusableFilter;

    return matchesSearch && matchesStatus && matchesRequired && matchesReusable;
  });

  const paginatedDocuments = paginateRows(filteredDocuments, page, rowsPerPage);
  const reusableCount = documents.filter((document) =>
    Boolean(document.can_reuse),
  ).length;
  const inactiveCount = documents.filter(
    (document) => document.status === "inactive",
  ).length;

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setReusableFilter("all");
    setPage(1);
  };

  const handleAddDocument = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    createDocumentMutation.mutate(formData);
  };

  const handleUpdateDocument = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!editDocument) return;

    updateDocumentMutation.mutate({
      id: editDocument.id,
      documentData: {
        name: editDocument.name,
        description: editDocument.description || "",
        is_required: Boolean(editDocument.is_required),
        can_reuse: Boolean(editDocument.can_reuse),
        status: editDocument.status,
      },
    });
  };

  const formFields = (
    data: DocumentFormData,
    setData: (data: DocumentFormData) => void,
  ) => (
    <div className="space-y-3">
      <Input
        label="Document name"
        onChange={(e) => setData({ ...data, name: e.target.value })}
        required
        value={data.name}
      />
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Description
        </span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          onChange={(e) => setData({ ...data, description: e.target.value })}
          value={data.description}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Select
          label="Reusable"
          onChange={(e) =>
            setData({ ...data, can_reuse: e.target.value === "true" })
          }
          value={String(data.can_reuse)}
        >
          <option value="true">Reusable</option>
          <option value="false">Not Reusable</option>
        </Select>
        <Select
          label="Status"
          onChange={(e) => setData({ ...data, status: e.target.value })}
          value={data.status}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        actions={
          <Button
            icon={<FiPlus />}
            onClick={() => setIsAddOpen(true)}
            variant="primary"
          >
            Add Document Template
          </Button>
        }
        icon={<FiFileText className="h-5 w-5" />}
        subtitle="Master library of reusable document names. Required/optional is now configured per project and listing."
        title="Document Library"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Documents" value={documents.length} />
        <StatCard title="Reusable" value={reusableCount} />
        <StatCard title="Inactive" value={inactiveCount} />
      </div>

      {successMessage ? (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_160px_170px_auto]">
          <Input
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search document name, description, status..."
            value={searchInput}
          />
          <Select
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select
            onChange={(e) => setReusableFilter(e.target.value)}
            value={reusableFilter}
          >
            <option value="all">All Reusable</option>
            <option value="true">Reusable</option>
            <option value="false">Not Reusable</option>
          </Select>
          <Button icon={<FiSearch />} onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading documents..." /> : null}
      {error && !isLoading ? (
        <Alert type="error">Failed to load documents</Alert>
      ) : null}

      {!isLoading && !error ? (
        filteredDocuments.length === 0 ? (
          <EmptyState title="No documents found" />
        ) : (
          <>
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Name",
                      "Description",
                      "Reusable",
                      "Status",
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
                  {paginatedDocuments.map((document) => (
                    <tr
                      className="transition hover:bg-slate-50"
                      key={document.id}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {document.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {document.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {document.can_reuse ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={document.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          icon={<FiEdit2 />}
                          onClick={() => setEditDocument(document)}
                        >
                          Edit
                        </Button>
                        <Button
                          icon={<FiTrash2 />}
                          onClick={() => setDocumentToDelete(document)}
                          variant="danger"
                        >
                          Delete
                        </Button>
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
              totalRows={filteredDocuments.length}
            />
          </>
        )
      ) : null}

      {isAddOpen ? (
        <Modal onClose={() => setIsAddOpen(false)} title="Add Document Template">
          <form className="space-y-4" onSubmit={handleAddDocument}>
            {formFields(formData, setFormData)}
            {createDocumentMutation.isError ? (
              <Alert type="error">{createDocumentMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createDocumentMutation.isPending}
                type="submit"
                variant="primary"
              >
                {createDocumentMutation.isPending
                  ? "Saving..."
                  : "Save Template"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {documentToDelete ? (
        <Modal
          onClose={() => setDocumentToDelete(null)}
          title="Delete Document"
        >
          {deleteDocumentMutation.error ? (
            <Alert variant="error" title={deleteDocumentMutation.error.message} />
          ) : null}
          <ConfirmBox
            message={`Are you sure you want to delete ${documentToDelete.name}? This cannot be undone.`}
            onCancel={() => setDocumentToDelete(null)}
            onConfirm={() => deleteDocumentMutation.mutate(documentToDelete.id)}
            confirmLabel={
              deleteDocumentMutation.isPending ? "Deleting..." : "Delete"
            }
          />
        </Modal>
      ) : null}

      {editDocument ? (
        <Modal onClose={() => setEditDocument(null)} title="Edit Document Template">
          <form className="space-y-4" onSubmit={handleUpdateDocument}>
            {formFields(
              {
                name: editDocument.name,
                description: editDocument.description || "",
                is_required: Boolean(editDocument.is_required),
                can_reuse: Boolean(editDocument.can_reuse),
                status: editDocument.status,
              },
              (nextData) =>
                setEditDocument({
                  ...editDocument,
                  ...nextData,
                }),
            )}
            {updateDocumentMutation.isError ? (
              <Alert type="error">{updateDocumentMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditDocument(null)}>Cancel</Button>
              <Button
                disabled={updateDocumentMutation.isPending}
                type="submit"
                variant="primary"
              >
                {updateDocumentMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Documents;

