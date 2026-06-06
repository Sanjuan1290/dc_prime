import { useState } from "react"

type ProjectStatus = "active" | "inactive"

type Project = {
  id: number
  name: string
  location: string
  administrator: string
  taxDeclarationNo: string
  pin: string
  status: ProjectStatus
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Luntiang Aguinaldo",
      location: "Gen. Emilio Aguinaldo, Cavite",
      administrator: "IMELDA",
      taxDeclarationNo: "AA-06-0005-00105",
      pin: "022-06-0005-003-04",
      status: "active",
    },
    {
      id: 2,
      name: "bailen project",
      location: "Bailen, Cavite",
      administrator: "IMELDA",
      taxDeclarationNo: "AA-06-0005-00105",
      pin: "022-06-0005-003-04",
      status: "active",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewProject, setViewProject] = useState<Project | null>(null)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    administrator: "",
    taxDeclarationNo: "",
    pin: "",
    status: "active" as ProjectStatus,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      administrator: "",
      taxDeclarationNo: "",
      pin: "",
      status: "active",
    })
  }

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newProject: Project = {
      id: projects.length + 1,
      ...formData,
    }

    setProjects((prev) => [...prev, newProject])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editProject) return

    setProjects((prev) =>
      prev.map((project) =>
        project.id === editProject.id ? editProject : project
      )
    )

    setEditProject(null)
  }

  const filteredProjects = projects.filter((project) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      project.name.toLowerCase().includes(search) ||
      project.location.toLowerCase().includes(search) ||
      project.administrator.toLowerCase().includes(search) ||
      project.taxDeclarationNo.toLowerCase().includes(search) ||
      project.pin.toLowerCase().includes(search) ||
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

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">
                Name ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Location ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Administrator ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Tax Declaration No. ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                PIN ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="px-4 py-2 text-left">
                Actions ↕
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
                  {project.location}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {project.administrator || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {project.taxDeclarationNo || "-"}
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
                      onClick={() => setEditProject(project)}
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
                value={formData.taxDeclarationNo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxDeclarationNo: e.target.value,
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
                    status: e.target.value as ProjectStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

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
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Save Project
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
              <p><b>Name:</b> {viewProject.name}</p>
              <p><b>Location:</b> {viewProject.location || "-"}</p>
              <p><b>Administrator:</b> {viewProject.administrator || "-"}</p>
              <p><b>Tax Declaration No.:</b> {viewProject.taxDeclarationNo || "-"}</p>
              <p><b>PIN:</b> {viewProject.pin || "-"}</p>
              <p><b>Status:</b> {viewProject.status}</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditProject(viewProject)
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
                value={editProject.name}
                onChange={(e) =>
                  setEditProject({ ...editProject, name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={editProject.location}
                onChange={(e) =>
                  setEditProject({ ...editProject, location: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editProject.administrator}
                onChange={(e) =>
                  setEditProject({
                    ...editProject,
                    administrator: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editProject.taxDeclarationNo}
                onChange={(e) =>
                  setEditProject({
                    ...editProject,
                    taxDeclarationNo: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={editProject.pin}
                onChange={(e) =>
                  setEditProject({ ...editProject, pin: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={editProject.status}
                onChange={(e) =>
                  setEditProject({
                    ...editProject,
                    status: e.target.value as ProjectStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

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
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Save Changes
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