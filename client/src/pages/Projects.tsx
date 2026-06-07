import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit2, FiEye, FiMap, FiPlus, FiSearch } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import Pagination from "../components/ui/Pagination"
import Select from "../components/ui/Select"
import StatCard from "../components/ui/StatCard"
import StatusBadge from "../components/ui/StatusBadge"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDate } from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type Project = {
  id: number
  name: string
  location: string | null
  administrator: string | null
  tax_declaration_no: string | null
  pin: string | null
  status: "active" | "inactive" | string
  ended_at: string | null
  created_at: string
  updated_at: string
}

type ProjectFormData = {
  name: string
  location: string
  administrator: string
  tax_declaration_no: string
  pin: string
  status: "active" | "inactive"
}

type ProjectsResponse = {
  projects: Project[]
}

const emptyFormData: ProjectFormData = {
  name: "",
  location: "",
  administrator: "",
  tax_declaration_no: "",
  pin: "",
  status: "active",
}

const fetchProjects = async () => {
  const response = await fetch(`${API_URL}/projects`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ProjectsResponse

  return data.projects
}

const createProject = async (projectData: ProjectFormData) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

const updateProject = async ({
  id,
  projectData,
}: {
  id: number
  projectData: ProjectFormData
}) => {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

const projectToFormData = (project: Project): ProjectFormData => ({
  name: project.name,
  location: project.location ?? "",
  administrator: project.administrator ?? "",
  tax_declaration_no: project.tax_declaration_no ?? "",
  pin: project.pin ?? "",
  status: project.status === "inactive" ? "inactive" : "active",
})

const Projects = () => {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewProject, setViewProject] = useState<Project | null>(null)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>(emptyFormData)
  const [editFormData, setEditFormData] = useState<ProjectFormData>(emptyFormData)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  const resetForm = () => {
    setFormData(emptyFormData)
  }

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setIsAddOpen(false)
      resetForm()
      setSuccessMessage("Project created successfully")
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setEditProject(null)
      setSuccessMessage("Project updated successfully")
    },
  })

  const openEditModal = (project: Project) => {
    setEditProject(project)
    setEditFormData(projectToFormData(project))
  }

  const handleAddProject = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createProjectMutation.mutate(formData)
  }

  const handleUpdateProject = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editProject) return

    updateProjectMutation.mutate({
      id: editProject.id,
      projectData: editFormData,
    })
  }

  const filteredProjects = projects.filter((project) => {
    const search = searchInput.toLowerCase().trim()
    const matchesSearch =
      search === "" ||
      project.name.toLowerCase().includes(search) ||
      (project.location ?? "").toLowerCase().includes(search) ||
      (project.administrator ?? "").toLowerCase().includes(search) ||
      (project.tax_declaration_no ?? "").toLowerCase().includes(search) ||
      (project.pin ?? "").toLowerCase().includes(search) ||
      project.status.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const paginatedProjects = paginateRows(filteredProjects, page, rowsPerPage)
  const activeCount = projects.filter((project) => project.status === "active").length
  const inactiveCount = projects.filter((project) => project.status === "inactive").length

  const formFields = (
    data: ProjectFormData,
    setData: (data: ProjectFormData) => void
  ) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          setData({ ...data, status: e.target.value as ProjectFormData["status"] })
        }
        value={data.status}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
    </div>
  )

  return (
    <div>
      <PageHeader
        actions={
          <Button icon={<FiPlus />} onClick={() => setIsAddOpen(true)} variant="primary">
            Add Project
          </Button>
        }
        icon={<FiMap className="h-5 w-5" />}
        subtitle="Company projects from MySQL with editable project records"
        title="Projects"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Projects" value={projects.length} />
        <StatCard title="Active" value={activeCount} />
        <StatCard title="Inactive" value={inactiveCount} />
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
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search name, location, administrator, tax no, pin..."
            value={searchInput}
          />
          <Select
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
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
              setSearchInput("")
              setStatusFilter("all")
              setPage(1)
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
                      "Administrator",
                      "Tax Declaration No.",
                      "PIN",
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
                    <tr className="transition hover:bg-slate-50" key={project.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.location || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.administrator || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.tax_declaration_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.pin || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
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
        <Modal onClose={() => setIsAddOpen(false)} title="Add Project">
          <form className="space-y-4" onSubmit={handleAddProject}>
            {formFields(formData, setFormData)}
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
            <p><b>Administrator:</b> {viewProject.administrator || "-"}</p>
            <p><b>Tax Declaration No.:</b> {viewProject.tax_declaration_no || "-"}</p>
            <p><b>PIN:</b> {viewProject.pin || "-"}</p>
            <p><b>Status:</b> {viewProject.status}</p>
            <p><b>Ended At:</b> {formatDate(viewProject.ended_at)}</p>
            <p><b>Created At:</b> {formatDate(viewProject.created_at)}</p>
            <p><b>Updated At:</b> {formatDate(viewProject.updated_at)}</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              icon={<FiEdit2 />}
              onClick={() => {
                openEditModal(viewProject)
                setViewProject(null)
              }}
              variant="primary"
            >
              Edit
            </Button>
            <Button onClick={() => setViewProject(null)}>Close</Button>
          </div>
        </Modal>
      ) : null}

      {editProject ? (
        <Modal onClose={() => setEditProject(null)} title="Edit Project">
          <form className="space-y-4" onSubmit={handleUpdateProject}>
            {formFields(editFormData, setEditFormData)}
            {updateProjectMutation.isError ? (
              <Alert type="error">{updateProjectMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditProject(null)}>Cancel</Button>
              <Button
                disabled={updateProjectMutation.isPending}
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
  )
}

export default Projects
