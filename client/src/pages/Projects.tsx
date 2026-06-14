import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiEdit2,
  FiEye,
  FiFileText,
  FiMap,
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

type Project = {
  id: number;
  name: string;
  location: string | null;
  location_code: string;
  administrator: string | null;
  tax_declaration_no: string | null;
  pin: string | null;
  status: "active" | "inactive" | string;
  ended_at: string | null;
  document_count?: number;
  required_document_count?: number;
  document_template_id?: number | null;
  document_template_name?: string | null;
  document_requirements?: DocumentRequirement[];
  documentRequirements?: DocumentRequirement[];
  created_at: string;
  updated_at: string;
};

type DocumentItem = {
  id: number;
  name: string;
  description: string | null;
  can_reuse: boolean | number;
  status: string;
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
};

type DocumentRequirement = {
  id?: number;
  document_id: number | null;
  name: string;
  description?: string | null;
  can_reuse?: boolean | number;
  is_required: boolean;
  status: string;
  sort_order: number;
};

type ProjectFormData = {
  name: string;
  location: string;
  location_code: string;
  administrator: string;
  tax_declaration_no: string;
  pin: string;
  status: "active" | "inactive";
  document_template_id: number | "";
  document_template_ids: number[];
  document_requirements: DocumentRequirement[];
};

type ProjectsResponse = {
  projects: Project[];
};

type DocumentsResponse = {
  documents: DocumentItem[];
};

type DocumentTemplatesResponse = {
  templates?: DocumentTemplate[];
  documentTemplates?: DocumentTemplate[];
  data?: DocumentTemplate[];
};

const emptyFormData: ProjectFormData = {
  name: "",
  location: "",
  location_code: "",
  administrator: "",
  tax_declaration_no: "",
  pin: "",
  status: "active",
  document_template_id: "",
  document_template_ids: [],
  document_requirements: [],
};

const normalizeRequirements = (requirements: DocumentRequirement[] = []) =>
  requirements.map((requirement, index) => ({
    ...requirement,
    document_id: requirement.document_id ? Number(requirement.document_id) : null,
    name: requirement.name || "",
    is_required: Boolean(requirement.is_required),
    description: requirement.description || null,
    status: requirement.status || "active",
    sort_order: Number(requirement.sort_order || index + 1),
  }));

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

const fetchProject = async (id: number) => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as { project: Project };
  return data.project;
};

const fetchDocuments = async () => {
  const response = await fetch(`${API_URL}/documents?status=active`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as DocumentsResponse;
  return data.documents || [];
};


const fetchDocumentTemplates = async () => {
  const response = await fetch(`${API_URL}/document-templates`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as DocumentTemplatesResponse;
  return data.templates || data.documentTemplates || data.data || [];
};

const createProject = async (projectData: ProjectFormData) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...projectData,
      document_template_id: projectData.document_template_ids[0] || projectData.document_template_id || "",
      document_requirements: normalizeRequirements(
        projectData.document_requirements,
      ),
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const updateProject = async ({
  id,
  projectData,
}: {
  id: number;
  projectData: ProjectFormData;
}) => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...projectData,
      document_template_id: projectData.document_template_ids[0] || projectData.document_template_id || "",
      document_requirements: normalizeRequirements(
        projectData.document_requirements,
      ),
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const deleteProject = async (id: number) => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const projectToFormData = (project: Project): ProjectFormData => ({
  name: project.name,
  location: project.location ?? "",
  location_code: project.location_code ?? "",
  administrator: project.administrator ?? "",
  tax_declaration_no: project.tax_declaration_no ?? "",
  pin: project.pin ?? "",
  status: project.status === "inactive" ? "inactive" : "active",
  document_template_id: project.document_template_id || "",
  document_template_ids: project.document_template_id ? [Number(project.document_template_id)] : [],
  document_requirements: normalizeRequirements(
    project.document_requirements || project.documentRequirements || [],
  ),
});

const Projects = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(emptyFormData);
  const [editFormData, setEditFormData] =
    useState<ProjectFormData>(emptyFormData);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [editTemplateSearch, setEditTemplateSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [editDocumentSearch, setEditDocumentSearch] = useState("");

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: documentLibrary = [] } = useQuery({
    queryKey: ["documents", "library", "active"],
    queryFn: fetchDocuments,
  });

  const { data: documentTemplates = [] } = useQuery({
    queryKey: ["document-templates"],
    queryFn: fetchDocumentTemplates,
  });

  const { data: editProjectDetails, isLoading: isEditLoading } = useQuery({
    queryKey: ["project", editProjectId],
    queryFn: () => fetchProject(editProjectId || 0),
    enabled: Boolean(editProjectId),
  });

  useEffect(() => {
    if (editProjectDetails) {
      setEditFormData(projectToFormData(editProjectDetails));
    }
  }, [editProjectDetails]);

  const resetForm = () => {
    setFormData(emptyFormData);
    setTemplateSearch("");
    setDocumentSearch("");
  };

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setIsAddOpen(false);
      resetForm();
      setSuccessMessage("Project created successfully");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", editProjectId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditProjectId(null);
      setEditTemplateSearch("");
      setEditDocumentSearch("");
      setSuccessMessage("Project updated successfully");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectToDelete(null);
      setSuccessMessage("Project deleted successfully");
    },
  });

  const filteredProjects = projects.filter((project) => {
    const search = searchInput.toLowerCase().trim();
    const matchesSearch =
      search === "" ||
      project.name.toLowerCase().includes(search) ||
      (project.location ?? "").toLowerCase().includes(search) ||
      (project.location_code ?? "").toLowerCase().includes(search) ||
      (project.administrator ?? "").toLowerCase().includes(search) ||
      (project.tax_declaration_no ?? "").toLowerCase().includes(search) ||
      (project.pin ?? "").toLowerCase().includes(search) ||
      project.status.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedProjects = paginateRows(filteredProjects, page, rowsPerPage);
  const activeCount = projects.filter(
    (project) => project.status === "active",
  ).length;
  const inactiveCount = projects.filter(
    (project) => project.status === "inactive",
  ).length;

  const openEditModal = (project: Project) => {
    setEditProjectId(project.id);
    setEditFormData(projectToFormData(project));
  };

  const handleAddProject = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    createProjectMutation.mutate(formData);
  };

  const handleUpdateProject = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!editProjectId) return;

    updateProjectMutation.mutate({
      id: editProjectId,
      projectData: editFormData,
    });
  };

  const addLibraryRequirement = (
    document: DocumentItem,
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
  ) => {
    const exists = data.document_requirements.some(
      (requirement) => requirement.document_id === document.id,
    );

    if (exists) return;

    setData({
      ...data,
      document_requirements: [
        ...data.document_requirements,
        {
          document_id: document.id,
          name: document.name,
          description: document.description,
          can_reuse: document.can_reuse,
          is_required: true,
          status: "active",
          sort_order: data.document_requirements.length + 1,
        },
      ],
    });
  };

  const updateRequirement = (
    index: number,
    updates: Partial<DocumentRequirement>,
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
  ) => {
    setData({
      ...data,
      document_requirements: data.document_requirements.map((requirement, i) =>
        i === index ? { ...requirement, ...updates } : requirement,
      ),
    });
  };

  const removeRequirement = (
    index: number,
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
  ) => {
    setData({
      ...data,
      document_requirements: data.document_requirements.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const availableLibraryDocuments = useMemo(
    () => documentLibrary.filter((document) => document.status === "active"),
    [documentLibrary],
  );

  const buildDefaultRequirementsFromLibrary = () =>
    availableLibraryDocuments.map((document, index) => ({
      document_id: document.id,
      name: document.name,
      description: document.description,
      can_reuse: document.can_reuse,
      is_required: true,
      status: "active",
      sort_order: index + 1,
    }));

  const getTemplateRequirements = (template: DocumentTemplate) =>
    normalizeRequirements(
      template.items || template.document_requirements || template.documentRequirements || [],
    );

  const mergeRequirements = (requirements: DocumentRequirement[]) => {
    const map = new Map<string, DocumentRequirement>();

    requirements.forEach((requirement) => {
      const key = requirement.document_id
        ? `id:${requirement.document_id}`
        : `name:${requirement.name.toLowerCase()}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...requirement });
        return;
      }

      map.set(key, {
        ...existing,
        is_required: Boolean(existing.is_required) || Boolean(requirement.is_required),
        status: existing.status === "active" || requirement.status === "active" ? "active" : existing.status,
        description: existing.description || requirement.description || null,
      });
    });

    return Array.from(map.values()).map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
  };

  const buildRequirementsFromTemplateIds = (templateIds: number[]) => {
    const selectedTemplates = documentTemplates.filter((template) =>
      templateIds.includes(Number(template.id)),
    );

    return mergeRequirements(
      selectedTemplates.flatMap((template) => getTemplateRequirements(template)),
    );
  };

  const applyTemplateIdsToForm = (
    templateIds: number[],
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
  ) => {
    const uniqueTemplateIds = Array.from(new Set(templateIds.map(Number)));

    setData({
      ...data,
      document_template_id: uniqueTemplateIds[0] || "",
      document_template_ids: uniqueTemplateIds,
      document_requirements: buildRequirementsFromTemplateIds(uniqueTemplateIds),
    });
  };

  const toggleTemplateForForm = (
    templateId: number,
    checked: boolean,
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
  ) => {
    const currentIds = data.document_template_ids || [];
    const nextIds = checked
      ? Array.from(new Set([...currentIds, templateId]))
      : currentIds.filter((id) => Number(id) !== Number(templateId));

    applyTemplateIdsToForm(nextIds, data, setData);
  };

  const applyAllTemplatesToForm = (
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
  ) => {
    applyTemplateIdsToForm(
      documentTemplates
        .filter((template) => template.status === "active")
        .map((template) => Number(template.id)),
      data,
      setData,
    );
  };

  const openAddProjectModal = () => {
    const activeTemplateIds = documentTemplates
      .filter((template) => template.status === "active")
      .map((template) => Number(template.id));

    setFormData({
      ...emptyFormData,
      document_template_id: activeTemplateIds[0] || "",
      document_template_ids: activeTemplateIds,
      document_requirements: activeTemplateIds.length > 0
        ? buildRequirementsFromTemplateIds(activeTemplateIds)
        : buildDefaultRequirementsFromLibrary(),
    });
    setTemplateSearch("");
    setDocumentSearch("");
    setIsAddOpen(true);
  };

  const formFields = (
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void,
    currentTemplateSearch: string,
    setCurrentTemplateSearch: (value: string) => void,
    currentDocumentSearch: string,
    setCurrentDocumentSearch: (value: string) => void,
  ) => {
    const activeTemplates = documentTemplates.filter((template) => template.status === "active");
    const selectedTemplateIds = new Set((data.document_template_ids || []).map(Number));
    const selectedTemplates = activeTemplates.filter((template) =>
      selectedTemplateIds.has(Number(template.id)),
    );
    const filteredTemplates = activeTemplates.filter((template) =>
      [template.name, template.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(currentTemplateSearch.toLowerCase().trim()),
    );
    const selectedDocumentIds = new Set(
      data.document_requirements
        .map((requirement) => requirement.document_id)
        .filter(Boolean)
        .map(Number),
    );
    const filteredLibraryDocuments = availableLibraryDocuments.filter((document) =>
      [document.name, document.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(currentDocumentSearch.toLowerCase().trim()),
    );
    const requiredCount = data.document_requirements.filter(
      (requirement) => Boolean(requirement.is_required) && requirement.status !== "inactive",
    ).length;
    const optionalCount = data.document_requirements.filter(
      (requirement) => !Boolean(requirement.is_required) && requirement.status !== "inactive",
    ).length;
    const hasManualOrLibraryDocs =
      selectedTemplates.length === 0 && data.document_requirements.length > 0;

    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">Project Information</h3>
              <p className="text-sm text-slate-500">Basic project details and status.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
              <Input
                label="Project name"
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
                value={data.name}
              />
              <Input
                label="Location"
                onChange={(e) => setData({ ...data, location: e.target.value })}
                value={data.location}
              />
              <Input
                label="Location Code"
                maxLength={10}
                onChange={(e) =>
                  setData({
                    ...data,
                    location_code: e.target.value.toUpperCase(),
                  })
                }
                required
                value={data.location_code}
              />
              <Input
                label="Administrator"
                onChange={(e) => setData({ ...data, administrator: e.target.value })}
                value={data.administrator}
              />
              <Input
                label="Tax declaration no."
                onChange={(e) =>
                  setData({ ...data, tax_declaration_no: e.target.value })
                }
                value={data.tax_declaration_no}
              />
              <Input
                label="PIN"
                onChange={(e) => setData({ ...data, pin: e.target.value })}
                value={data.pin}
              />
              <Select
                label="Status"
                onChange={(e) =>
                  setData({
                    ...data,
                    status: e.target.value as ProjectFormData["status"],
                  })
                }
                value={data.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-col gap-1">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FiFileText /> Document Templates
              </h3>
              <p className="text-sm text-slate-500">
                Select one or more templates. The selected documents appear on the right immediately.
              </p>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <Button onClick={() => applyAllTemplatesToForm(data, setData)}>
                Select All Templates
              </Button>
              <Button
                onClick={() =>
                  setData({
                    ...data,
                    document_template_id: "",
                    document_template_ids: [],
                    document_requirements: [],
                  })
                }
              >
                Clear Templates
              </Button>
              <Button
                onClick={() =>
                  setData({
                    ...data,
                    document_template_id: "",
                    document_template_ids: [],
                    document_requirements: buildDefaultRequirementsFromLibrary(),
                  })
                }
              >
                Use All Library Docs
              </Button>
            </div>

            <Input
              icon={<FiSearch />}
              onChange={(e) => setCurrentTemplateSearch(e.target.value)}
              placeholder="Search templates..."
              value={currentTemplateSearch}
            />

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredTemplates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  No templates found.
                </div>
              ) : null}

              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateIds.has(Number(template.id));

                return (
                  <label
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition",
                      isSelected
                        ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                    ].join(" ")}
                    key={template.id}
                  >
                    <input
                      checked={isSelected}
                      className="mt-1"
                      onChange={(e) =>
                        toggleTemplateForForm(Number(template.id), e.target.checked, data, setData)
                      }
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">{template.name}</span>
                      <span className="block text-xs text-slate-500">
                        {template.description || "No description"}
                      </span>
                      <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {Number(template.required_document_count || 0)} required / {Number(template.document_count || 0)} docs
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FiFileText /> Default Document Requirements
                </h3>
                <p className="text-sm text-slate-500">
                  These become the default checklist for listings created under this project. Listings can still be customized later.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                  {hasManualOrLibraryDocs
                    ? "Library/manual docs"
                    : `${selectedTemplates.length} templates`}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {requiredCount} required
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                  {optionalCount} optional
                </span>
              </div>
            </div>

            {selectedTemplates.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedTemplates.map((template) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    key={template.id}
                  >
                    {template.name}
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() =>
                        toggleTemplateForForm(Number(template.id), false, data, setData)
                      }
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : hasManualOrLibraryDocs ? (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                Using selected Document Library items. You can still remove documents, mark them required/optional, or add more from the library below.
              </div>
            ) : (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                No document requirements selected yet. Choose templates on the left or add documents from the library below.
              </div>
            )}

            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex flex-col gap-1">
                <p className="text-sm font-bold text-slate-900">Add Existing Documents</p>
                <p className="text-xs text-slate-500">
                  Create missing documents in Document Library first, then search and add them here.
                </p>
              </div>
              <Input
                icon={<FiSearch />}
                onChange={(e) => setCurrentDocumentSearch(e.target.value)}
                placeholder="Search document library..."
                value={currentDocumentSearch}
              />
              <div className="mt-3 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto lg:grid-cols-2">
                {filteredLibraryDocuments.map((document) => {
                  const alreadySelected = selectedDocumentIds.has(Number(document.id));
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3" key={document.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{document.name}</p>
                          <p className="text-xs text-slate-500">{document.description || "No description"}</p>
                        </div>
                        <Button
                          disabled={alreadySelected}
                          onClick={() => addLibraryRequirement(document, data, setData)}
                        >
                          {alreadySelected ? "Added" : "Add"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {data.document_requirements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                No default documents selected yet.
              </div>
            ) : (
              <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {data.document_requirements.map((requirement, index) => (
                  <div
                    className="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-[1fr_150px_120px_auto]"
                    key={`${requirement.document_id || requirement.name}-${index}`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{requirement.name}</p>
                      <p className="text-xs text-slate-500">
                        {requirement.description ||
                          (requirement.document_id
                            ? "From library"
                            : "From selected template or library")}
                      </p>
                    </div>
                    <Select
                      label="Requirement"
                      onChange={(e) =>
                        updateRequirement(
                          index,
                          { is_required: e.target.value === "true" },
                          data,
                          setData,
                        )
                      }
                      value={String(requirement.is_required)}
                    >
                      <option value="true">Required</option>
                      <option value="false">Optional</option>
                    </Select>
                    <Select
                      label="Status"
                      onChange={(e) =>
                        updateRequirement(index, { status: e.target.value }, data, setData)
                      }
                      value={requirement.status}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                    <Button
                      onClick={() => removeRequirement(index, data, setData)}
                      variant="danger"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        actions={
          <Button
            icon={<FiPlus />}
            onClick={openAddProjectModal}
            variant="primary"
          >
            Add Project
          </Button>
        }
        icon={<FiMap className="h-5 w-5" />}
        subtitle="Create projects and configure their default document requirements"
        title="Projects"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Projects" value={projects.length} />
        <StatCard title="Active" value={activeCount} />
        <StatCard title="Inactive" value={inactiveCount} />
        <StatCard
          title="Required Docs"
          value={projects.reduce(
            (sum, project) => sum + Number(project.required_document_count || 0),
            0,
          )}
        />
      </div>

      {successMessage ? (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, location, administrator, tax no, pin..."
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
            icon={<FiSearch />}
            onClick={() => {
              setSearchInput("");
              setStatusFilter("all");
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading projects..." /> : null}
      {error && !isLoading ? (
        <Alert type="error">Failed to load projects</Alert>
      ) : null}

      {!isLoading && !error ? (
        filteredProjects.length === 0 ? (
          <EmptyState title="No projects found" />
        ) : (
          <>
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Name",
                      "Location",
                      "Location Code",
                      "Default Docs",
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
                  {paginatedProjects.map((project) => (
                    <tr
                      className="transition hover:bg-slate-50"
                      key={project.id}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.location || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold tracking-wide text-slate-700">
                          {project.location_code || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {Number(project.document_count || 0)} docs / {Number(project.required_document_count || 0)} required
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            icon={<FiEye />}
                            onClick={() => setViewProject(project)}
                          >
                            Details
                          </Button>
                          <Button
                            icon={<FiEdit2 />}
                            onClick={() => openEditModal(project)}
                          >
                            Edit
                          </Button>
                          <Button
                            icon={<FiTrash2 />}
                            onClick={() => setProjectToDelete(project)}
                            variant="danger"
                          >
                            Delete
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
              totalRows={filteredProjects.length}
            />
          </>
        )
      ) : null}

      {isAddOpen ? (
        <Modal onClose={() => setIsAddOpen(false)} title="Add Project" size="xl">
          <form className="space-y-4" onSubmit={handleAddProject}>
            {formFields(formData, setFormData, templateSearch, setTemplateSearch, documentSearch, setDocumentSearch)}
            {createProjectMutation.isError ? (
              <Alert type="error">{createProjectMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createProjectMutation.isPending}
                type="submit"
                variant="primary"
              >
                {createProjectMutation.isPending ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {viewProject ? (
        <Modal onClose={() => setViewProject(null)} title="Project Details">
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p><b>ID:</b> {viewProject.id}</p>
            <p><b>Name:</b> {viewProject.name}</p>
            <p><b>Location:</b> {viewProject.location || "-"}</p>
            <p><b>Location Code:</b> {viewProject.location_code || "-"}</p>
            <p><b>Administrator:</b> {viewProject.administrator || "-"}</p>
            <p><b>Tax Declaration No.:</b> {viewProject.tax_declaration_no || "-"}</p>
            <p><b>PIN:</b> {viewProject.pin || "-"}</p>
            <p><b>Status:</b> {viewProject.status}</p>
            <p><b>Document Template:</b> {viewProject.document_template_name || "Manual / Custom"}</p>
            <p><b>Default Documents:</b> {Number(viewProject.document_count || 0)}</p>
            <p><b>Required Documents:</b> {Number(viewProject.required_document_count || 0)}</p>
            <p><b>Ended At:</b> {formatDate(viewProject.ended_at)}</p>
            <p><b>Created At:</b> {formatDate(viewProject.created_at)}</p>
            <p><b>Updated At:</b> {formatDate(viewProject.updated_at)}</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              icon={<FiEdit2 />}
              onClick={() => {
                openEditModal(viewProject);
                setViewProject(null);
              }}
              variant="primary"
            >
              Edit
            </Button>
            <Button onClick={() => setViewProject(null)}>Close</Button>
          </div>
        </Modal>
      ) : null}

      {projectToDelete ? (
        <Modal onClose={() => setProjectToDelete(null)} title="Delete Project">
          {deleteProjectMutation.error ? (
            <Alert variant="error" title={deleteProjectMutation.error.message} />
          ) : null}
          <ConfirmBox
            message={`Are you sure you want to delete ${projectToDelete.name}? This cannot be undone.`}
            onCancel={() => setProjectToDelete(null)}
            onConfirm={() => deleteProjectMutation.mutate(projectToDelete.id)}
            confirmLabel={
              deleteProjectMutation.isPending ? "Deleting..." : "Delete"
            }
          />
        </Modal>
      ) : null}

      {editProjectId ? (
        <Modal onClose={() => setEditProjectId(null)} title="Edit Project" size="xl">
          {isEditLoading ? <LoadingState message="Loading project documents..." /> : null}
          <form className="space-y-4" onSubmit={handleUpdateProject}>
            {formFields(editFormData, setEditFormData, editTemplateSearch, setEditTemplateSearch, editDocumentSearch, setEditDocumentSearch)}
            {updateProjectMutation.isError ? (
              <Alert type="error">{updateProjectMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditProjectId(null)}>Cancel</Button>
              <Button
                disabled={updateProjectMutation.isPending || isEditLoading}
                type="submit"
                variant="primary"
              >
                {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Projects;
