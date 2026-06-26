import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiEdit2,
  FiFileText,
  FiLayers,
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
import { formatDate } from "../utils/formatters";
import { paginateRows } from "../utils/pagination";

type DocumentStatus = "active" | "inactive" | string;

type DocumentItem = {
  id: number;
  name: string;
  description: string | null;
  is_required?: boolean | number;
  can_reuse: boolean | number;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

type DocumentRequirement = {
  id?: number;
  document_id: number | null;
  name: string;
  description?: string | null;
  can_reuse?: boolean | number;
  is_required: boolean | number;
  status: string;
  sort_order: number;
};

type DocumentTemplate = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  document_count: number;
  required_document_count: number;
  items?: DocumentRequirement[];
  document_requirements?: DocumentRequirement[];
  documentRequirements?: DocumentRequirement[];
  created_at: string;
  updated_at: string;
};

type DocumentFormData = {
  name: string;
  description: string;
  can_reuse: boolean;
  status: DocumentStatus;
};

type TemplateFormData = {
  name: string;
  description: string;
  status: DocumentStatus;
  items: DocumentRequirement[];
};

type DocumentsResponse = {
  documents: DocumentItem[];
};

type TemplatesResponse = {
  templates?: DocumentTemplate[];
  documentTemplates?: DocumentTemplate[];
  data?: DocumentTemplate[];
};

const emptyDocumentForm: DocumentFormData = {
  name: "",
  description: "",
  can_reuse: true,
  status: "active",
};

const emptyTemplateForm: TemplateFormData = {
  name: "",
  description: "",
  status: "active",
  items: [],
};

const normalizeRequirements = (items: DocumentRequirement[] = []) =>
  items.map((item, index) => ({
    ...item,
    document_id: item.document_id ? Number(item.document_id) : null,
    name: item.name || "",
    description: item.description || null,
    can_reuse: item.can_reuse ?? true,
    is_required: Boolean(item.is_required),
    status: item.status || "active",
    sort_order: Number(item.sort_order || index + 1),
  }));

const fetchDocuments = async (): Promise<DocumentItem[]> => {
  const res = await fetch(`${API_URL}/documents`, { credentials: "include" });
  if (!res.ok) throw new Error(await getErrorMessage(res));
  const data: DocumentsResponse = await res.json();
  return data.documents || [];
};

const fetchDocumentTemplates = async (): Promise<DocumentTemplate[]> => {
  const res = await fetch(`${API_URL}/document-templates`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
  const data: TemplatesResponse = await res.json();
  return data.templates || data.documentTemplates || data.data || [];
};

const createDocument = async (documentData: DocumentFormData) => {
  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...documentData,
      is_required: false,
    }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...documentData,
      is_required: false,
    }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
};

const deleteDocument = async (id: number) => {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
};

const createTemplate = async (templateData: TemplateFormData) => {
  const res = await fetch(`${API_URL}/document-templates`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...templateData,
      items: normalizeRequirements(templateData.items),
    }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
};

const updateTemplate = async ({
  id,
  templateData,
}: {
  id: number;
  templateData: TemplateFormData;
}) => {
  const res = await fetch(`${API_URL}/document-templates/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...templateData,
      items: normalizeRequirements(templateData.items),
    }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
};

const deleteTemplate = async (id: number) => {
  const res = await fetch(`${API_URL}/document-templates/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res));
};

const Documents = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateSearchInput, setTemplateSearchInput] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentItem | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(
    null,
  );
  const [documentForm, setDocumentForm] =
    useState<DocumentFormData>(emptyDocumentForm);

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<DocumentTemplate | null>(
    null,
  );
  const [templateToDelete, setTemplateToDelete] =
    useState<DocumentTemplate | null>(null);
  const [templateForm, setTemplateForm] =
    useState<TemplateFormData>(emptyTemplateForm);
  const [templateDocumentSearch, setTemplateDocumentSearch] = useState("");

  const [page, setPage] = useState(1);
  const [templatePage, setTemplatePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [templateRowsPerPage, setTemplateRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments });

  const {
    data: templates = [],
    isLoading: isTemplatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["document-templates"],
    queryFn: fetchDocumentTemplates,
  });

  const activeDocuments = useMemo(
    () => documents.filter((document) => document.status === "active"),
    [documents],
  );

  const filteredDocuments = documents.filter((document) => {
    const search = searchInput.toLowerCase().trim();
    const matchesSearch =
      search === "" ||
      document.name.toLowerCase().includes(search) ||
      (document.description || "").toLowerCase().includes(search) ||
      document.status.toLowerCase().includes(search);
    const matchesStatus =
      statusFilter === "all" || document.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredTemplates = templates.filter((template) => {
    const search = templateSearchInput.toLowerCase().trim();
    return (
      search === "" ||
      template.name.toLowerCase().includes(search) ||
      (template.description || "").toLowerCase().includes(search) ||
      template.status.toLowerCase().includes(search)
    );
  });

  const paginatedDocuments = paginateRows(filteredDocuments, page, rowsPerPage);
  const paginatedTemplates = paginateRows(
    filteredTemplates,
    templatePage,
    templateRowsPerPage,
  );

  const refreshDocumentData = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["document-templates"] });
  };

  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      refreshDocumentData();
      setIsAddOpen(false);
      setDocumentForm(emptyDocumentForm);
      setSuccessMessage("Document added to library");
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: () => {
      refreshDocumentData();
      setEditDocument(null);
      setSuccessMessage("Document updated");
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      refreshDocumentData();
      setDocumentToDelete(null);
      setSuccessMessage("Document deleted");
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      refreshDocumentData();
      setIsTemplateOpen(false);
      setTemplateForm(emptyTemplateForm);
      setTemplateDocumentSearch("");
      setSuccessMessage("Document template created");
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      refreshDocumentData();
      setEditTemplate(null);
      setTemplateForm(emptyTemplateForm);
      setTemplateDocumentSearch("");
      setSuccessMessage("Document template updated");
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      refreshDocumentData();
      setTemplateToDelete(null);
      setSuccessMessage("Document template deleted");
    },
  });

  const openEditDocument = (document: DocumentItem) => {
    setEditDocument(document);
    setDocumentForm({
      name: document.name,
      description: document.description || "",
      can_reuse: Boolean(document.can_reuse),
      status: document.status,
    });
  };

  const openAddTemplate = () => {
    setTemplateForm(emptyTemplateForm);
    setTemplateDocumentSearch("");
    setIsTemplateOpen(true);
  };

  const openEditTemplate = (template: DocumentTemplate) => {
    const items =
      template.items ||
      template.document_requirements ||
      template.documentRequirements ||
      [];

    setEditTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      status: template.status || "active",
      items: normalizeRequirements(items),
    });
    setTemplateDocumentSearch("");
  };

  const updateTemplateItem = (
    index: number,
    updates: Partial<DocumentRequirement>,
  ) => {
    setTemplateForm((current) => ({
      ...current,
      items: current.items.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      ),
    }));
  };

  const removeTemplateItem = (index: number) => {
    setTemplateForm((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  };

  const addDocumentToTemplate = (documentId: string) => {
    const document = activeDocuments.find((item) => String(item.id) === documentId);
    if (!document) return;

    setTemplateForm((current) => {
      if (current.items.some((item) => item.document_id === document.id)) {
        return current;
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            document_id: document.id,
            name: document.name,
            description: document.description,
            can_reuse: document.can_reuse,
            is_required: true,
            status: "active",
            sort_order: current.items.length + 1,
          },
        ],
      };
    });
  };

  const undoDocumentFromTemplate = (documentId: number) => {
    setTemplateForm((current) => ({
      ...current,
      items: current.items
        .filter((item) => Number(item.document_id) !== Number(documentId))
        .map((item, index) => ({
          ...item,
          sort_order: index + 1,
        })),
    }));
  };

  const toggleDocumentInTemplate = (documentId: number) => {
    if (selectedTemplateDocumentIds.has(Number(documentId))) {
      undoDocumentFromTemplate(documentId);
      return;
    }

    addDocumentToTemplate(String(documentId));
  };

  const selectedTemplateDocumentIds = new Set(
    templateForm.items
      .map((item) => item.document_id)
      .filter(Boolean)
      .map(Number),
  );

  const filteredTemplateLibraryDocuments = activeDocuments.filter((document) =>
    [document.name, document.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(templateDocumentSearch.toLowerCase().trim()),
  );

  const handleDocumentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editDocument) {
      updateDocumentMutation.mutate({
        id: editDocument.id,
        documentData: documentForm,
      });
    } else {
      createDocumentMutation.mutate(documentForm);
    }
  };

  const handleTemplateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editTemplate) {
      updateTemplateMutation.mutate({
        id: editTemplate.id,
        templateData: templateForm,
      });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const templateMutationError =
    createTemplateMutation.error?.message ||
    updateTemplateMutation.error?.message;
  const documentMutationError =
    createDocumentMutation.error?.message || updateDocumentMutation.error?.message;

  if (isLoading) return <LoadingState label="Loading document library..." />;
  if (error) return <Alert variant="error" title="Failed to load documents" />;

  return (
    <div>
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<FiLayers />} onClick={openAddTemplate}>
              Add Template
            </Button>
            <Button
              icon={<FiPlus />}
              onClick={() => {
                setDocumentForm(emptyDocumentForm);
                setIsAddOpen(true);
              }}
              variant="primary"
            >
              Add Document
            </Button>
          </div>
        }
        icon={<FiFileText />}
        subtitle="Manage reusable documents and template checklists for projects and listings."
        title="Document Library"
      />

      {successMessage ? <Alert type="success">{successMessage}</Alert> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Library Documents" value={documents.length} />
        <StatCard
          label="Active Documents"
          value={documents.filter((item) => item.status === "active").length}
        />
        <StatCard label="Templates" value={templates.length} />
        <StatCard
          label="Active Templates"
          value={templates.filter((item) => item.status === "active").length}
        />
      </div>

      <section className="mb-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Document Templates</h2>
            <p className="text-sm text-slate-500">
              A template contains many documents. Projects can select a template,
              then still edit, add, or remove documents.
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Input
            icon={<FiSearch />}
            onChange={(e) => {
              setTemplateSearchInput(e.target.value);
              setTemplatePage(1);
            }}
            placeholder="Search templates..."
            value={templateSearchInput}
          />
          <Button
            onClick={() => {
              setTemplateSearchInput("");
              setTemplatePage(1);
            }}
          >
            Reset
          </Button>
        </div>

        {isTemplatesLoading ? <LoadingState label="Loading templates..." /> : null}
        {templatesError ? (
          <Alert type="error">Failed to load document templates</Alert>
        ) : null}

        {!isTemplatesLoading && !templatesError ? (
          <>
            <TableContainer>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Template</th>
                    <th className="px-4 py-3 text-left">Documents</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Updated</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTemplates.map((template) => (
                    <tr className="border-b border-slate-100" key={template.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{template.name}</p>
                        <p className="text-xs text-slate-500">
                          {template.description || "No description"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {Number(template.document_count || 0)} docs / {Number(template.required_document_count || 0)} required
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={template.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(template.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button icon={<FiEdit2 />} onClick={() => openEditTemplate(template)}>
                            Edit
                          </Button>
                          <Button
                            icon={<FiTrash2 />}
                            onClick={() => setTemplateToDelete(template)}
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState title="No templates found" />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </TableContainer>
            <Pagination
              onPageChange={setTemplatePage}
              onRowsPerPageChange={setTemplateRowsPerPage}
              page={templatePage}
              rowsPerPage={templateRowsPerPage}
              totalRows={filteredTemplates.length}
            />
          </>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Document Library</h2>
            <p className="text-sm text-slate-500">
              Master list of reusable documents. Required/optional is decided in templates, projects, and listings.
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input
            icon={<FiSearch />}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search document name or description..."
            value={searchInput}
          />
          <Select
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            value={statusFilter}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button
            onClick={() => {
              setSearchInput("");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>

        <TableContainer>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Reusable</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.map((document) => (
                <tr className="border-b border-slate-100" key={document.id}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{document.name}</p>
                    <p className="text-xs text-slate-500">
                      {document.description || "No description"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {Boolean(document.can_reuse) ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={document.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(document.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button icon={<FiEdit2 />} onClick={() => openEditDocument(document)}>
                        Edit
                      </Button>
                      <Button
                        icon={<FiTrash2 />}
                        onClick={() => setDocumentToDelete(document)}
                        variant="danger"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No documents found" />
                  </td>
                </tr>
              ) : null}
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
      </section>

      {(isAddOpen || editDocument) ? (
        <Modal
          onClose={() => {
            setIsAddOpen(false);
            setEditDocument(null);
          }}
          title={editDocument ? "Edit Document" : "Add Document"}
        >
          <form className="space-y-4" onSubmit={handleDocumentSubmit}>
            <Input
              label="Document Name"
              onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
              required
              value={documentForm.name}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Description
              </span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, description: e.target.value })
                }
                placeholder="Example: Government-issued valid ID, two copies"
                value={documentForm.description}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                label="Reusable Across Units"
                onChange={(e) =>
                  setDocumentForm({
                    ...documentForm,
                    can_reuse: e.target.value === "true",
                  })
                }
                value={String(documentForm.can_reuse)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
              <Select
                label="Status"
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, status: e.target.value })
                }
                value={documentForm.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            {documentMutationError ? (
              <Alert type="error">{documentMutationError}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditDocument(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
                type="submit"
                variant="primary"
              >
                {editDocument ? "Save Changes" : "Add Document"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {(isTemplateOpen || editTemplate) ? (
        <Modal
          onClose={() => {
            setIsTemplateOpen(false);
            setEditTemplate(null);
          }}
          size="xl"
          title={editTemplate ? "Edit Document Template" : "Add Document Template"}
        >
          <form className="space-y-4" onSubmit={handleTemplateSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Template Name"
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
                required
                value={templateForm.name}
              />
              <Select
                label="Status"
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, status: e.target.value })
                }
                value={templateForm.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Template Description
              </span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, description: e.target.value })
                }
                placeholder="Example: Standard requirements for residential lot buyers"
                value={templateForm.description}
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Template Documents
                </h3>
                <p className="text-sm text-slate-500">
                  Add documents to this template. Projects can select this template and still customize the list.
                </p>
              </div>

              <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex flex-col gap-1">
                  <p className="text-sm font-bold text-slate-900">Add Existing Documents</p>
                  <p className="text-xs text-slate-500">Create new documents in the Document Library first, then search and add them to this template.</p>
                </div>
                <Input
                  icon={<FiSearch />}
                  onChange={(e) => setTemplateDocumentSearch(e.target.value)}
                  placeholder="Search document library..."
                  value={templateDocumentSearch}
                />
                <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                  {filteredTemplateLibraryDocuments.map((document) => {
                    const alreadySelected = selectedTemplateDocumentIds.has(Number(document.id));
                    return (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={document.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{document.name}</p>
                            <p className="text-xs text-slate-500">{document.description || "No description"}</p>
                          </div>
                          <Button
                            onClick={() => toggleDocumentInTemplate(Number(document.id))}
                            variant={alreadySelected ? "secondary" : "primary"}
                          >
                            {alreadySelected ? "Undo" : "Add"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {templateForm.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  No documents added to this template yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {templateForm.items.map((item, index) => (
                    <div
                      className="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_150px_120px_auto]"
                      key={`${item.document_id || item.name}-${index}`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.description || "No description"}
                        </p>
                      </div>
                      <Select
                        label="Requirement"
                        onChange={(e) =>
                          updateTemplateItem(index, {
                            is_required: e.target.value === "true",
                          })
                        }
                        value={String(Boolean(item.is_required))}
                      >
                        <option value="true">Required</option>
                        <option value="false">Optional</option>
                      </Select>
                      <Select
                        label="Status"
                        onChange={(e) =>
                          updateTemplateItem(index, { status: e.target.value })
                        }
                        value={item.status || "active"}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Select>
                      <Button onClick={() => removeTemplateItem(index)} variant="danger">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {templateMutationError ? (
              <Alert type="error">{templateMutationError}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsTemplateOpen(false);
                  setEditTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                type="submit"
                variant="primary"
              >
                {editTemplate ? "Save Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {documentToDelete ? (
        <Modal onClose={() => setDocumentToDelete(null)} title="Delete Document">
          <ConfirmBox
            confirmLabel={deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
            message={`Delete ${documentToDelete.name}? If it is already used by client records, it will be removed from active/project/listing lists but preserved for history.`}
            onCancel={() => setDocumentToDelete(null)}
            onConfirm={() => deleteDocumentMutation.mutate(documentToDelete.id)}
          />
        </Modal>
      ) : null}

      {templateToDelete ? (
        <Modal onClose={() => setTemplateToDelete(null)} title="Delete Template">
          <ConfirmBox
            confirmLabel={deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
            message={`Delete ${templateToDelete.name}? Existing project/listing checklists will not be deleted.`}
            onCancel={() => setTemplateToDelete(null)}
            onConfirm={() => deleteTemplateMutation.mutate(templateToDelete.id)}
          />
        </Modal>
      ) : null}
    </div>
  );
};

export default Documents;

