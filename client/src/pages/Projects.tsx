import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewProject, setViewProject] = useState<Project | null>(null)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>(emptyFormData)
  const [editFormData, setEditFormData] = useState<ProjectFormData>(emptyFormData)

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
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setEditProject(null)
    },
  })

  const openEditModal = (project: Project) => {
    setEditProject(project)
    setEditFormData(projectToFormData(project))
  }

  const handleAddProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    createProjectMutation.mutate(formData)
  }

  const handleUpdateProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editProject) return

    updateProjectMutation.mutate({
      id: editProject.id,
      projectData: editFormData,
    })
  }

  const filteredProjects = projects.filter((project) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      project.name.toLowerCase().includes(search) ||
      (project.location ?? "").toLowerCase().includes(search) ||
      (project.administrator ?? "").toLowerCase().includes(search) ||
      (project.tax_declaration_no ?? "").toLowerCase().includes(search) ||
      (project.pin ?? "").toLowerCase().includes(search) ||
      project.status.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-sm text-gray-600">
          Company projects from MySQL with editable project records
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Project
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search by name, location, administrator, tax no, pin..."
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
          Loading projects...
        </div>
      )}

      {error && !isLoading && (
        <div className="border border-black px-4 py-6 text-center text-gray-600">
          Failed to load projects
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">
                  Name
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Location
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Administrator
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Tax Declaration No.
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  PIN
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Status
                </th>
                <th className="px-4 py-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">
                    {project.name}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {project.location || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {project.administrator || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {project.tax_declaration_no || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2">
                    {project.pin || "-"}
                  </td>

                  <td className="border-r border-black px-4 py-2 capitalize">
                    {project.status}
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewProject(project)}
                        className="border border-black px-3 py-1 hover:bg-gray-200"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => openEditModal(project)}
                        className="border border-black px-3 py-1 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-600">
                    No projects found
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
            <h2 className="mb-4 text-2xl font-bold">Add Project</h2>

            <form onSubmit={handleAddProject} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Project name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Administrator"
                value={formData.administrator}
                onChange={(e) =>
                  setFormData({ ...formData, administrator: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="Tax declaration no."
                value={formData.tax_declaration_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tax_declaration_no: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                placeholder="PIN"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectFormData["status"],
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {createProjectMutation.isError && (
                <p className="text-sm text-red-600">
                  {createProjectMutation.error.message}
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
                  disabled={createProjectMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createProjectMutation.isPending ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Project Details</h2>

            <div className="flex flex-col gap-2">
              <p><b>ID:</b> {viewProject.id}</p>
              <p><b>Name:</b> {viewProject.name}</p>
              <p><b>Location:</b> {viewProject.location || "-"}</p>
              <p><b>Administrator:</b> {viewProject.administrator || "-"}</p>
              <p><b>Tax Declaration No.:</b> {viewProject.tax_declaration_no || "-"}</p>
              <p><b>PIN:</b> {viewProject.pin || "-"}</p>
              <p><b>Status:</b> {viewProject.status}</p>
              <p><b>Ended At:</b> {viewProject.ended_at || "-"}</p>
              <p><b>Created At:</b> {viewProject.created_at}</p>
              <p><b>Updated At:</b> {viewProject.updated_at}</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  openEditModal(viewProject)
                  setViewProject(null)
                }}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Edit
              </button>

              <button
                onClick={() => setViewProject(null)}
                className="border border-black px-4 py-2 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Project</h2>

            <form onSubmit={handleUpdateProject} className="flex flex-col gap-3">
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editFormData.location}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, location: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editFormData.administrator}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    administrator: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editFormData.tax_declaration_no}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    tax_declaration_no: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editFormData.pin}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, pin: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    status: e.target.value as ProjectFormData["status"],
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {updateProjectMutation.isError && (
                <p className="text-sm text-red-600">
                  {updateProjectMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditProject(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
