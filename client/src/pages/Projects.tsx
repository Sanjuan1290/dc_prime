import { useState } from "react"

type Project = {
  id: number
  name: string
  location: string
  administrator: string
  taxDeclarationNo: string
  pin: string
  status: "active" | "inactive"
  lots: number
  available: number
  reserved: number
  sold: number
  value: string
  balance: string
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Luntiang Aguinaldo",
      location: "Gen. Emilio Aguinaldo, Cavite",
      administrator: "Christopher Prime",
      taxDeclarationNo: "TD-001",
      pin: "PIN-001",
      status: "active",
      lots: 100,
      available: 29,
      reserved: 0,
      sold: 69,
      value: "₱89,582,770.00",
      balance: "₱10,255,034.49",
    },
    {
      id: 2,
      name: "bailen project",
      location: "Bailen, Cavite",
      administrator: "",
      taxDeclarationNo: "",
      pin: "",
      status: "active",
      lots: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      value: "₱0.00",
      balance: "₱0.00",
    },
  ])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    administrator: "",
    taxDeclarationNo: "",
    pin: "",
    status: "active" as "active" | "inactive",
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
      lots: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      value: "₱0.00",
      balance: "₱0.00",
    }

    setProjects((prev) => [...prev, newProject])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedProject) return

    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProject.id ? selectedProject : project
      )
    )

    setSelectedProject(null)
  }

  const getSoldPercentage = (project: Project) => {
    if (project.lots === 0) return 0
    return Math.round((project.sold / project.lots) * 100)
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-sm text-gray-600">
          Company projects from MySQL with editable project records
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Projects</p>
          <h3 className="text-2xl font-bold">{projects.length}</h3>
          <p className="text-sm text-gray-600">
            {projects.filter((project) => project.status === "active").length} active
          </p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Listed Value</p>
          <h3 className="text-2xl font-bold">₱89,582,770.00</h3>
          <p className="text-sm text-gray-600">Current inventory value</p>
        </div>
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
            placeholder="Search by name, unit ID, reference..."
            className="border border-black px-3 py-2 md:w-80"
          />

          <button className="border border-black px-4 py-2 hover:bg-gray-200">
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Location ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Status ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Lots ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Available ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Reserved ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Sold ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Value ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Balance ↕</th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-gray-600">
                    {getSoldPercentage(project)}% sold
                  </p>
                </td>

                <td className="border-r border-black px-4 py-2">
                  {project.location}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {project.status}
                </td>

                <td className="border-r border-black px-4 py-2">{project.lots}</td>
                <td className="border-r border-black px-4 py-2">{project.available}</td>
                <td className="border-r border-black px-4 py-2">{project.reserved}</td>
                <td className="border-r border-black px-4 py-2">{project.sold}</td>
                <td className="border-r border-black px-4 py-2">{project.value}</td>
                <td className="border-r border-black px-4 py-2">{project.balance}</td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <p>Showing 1-{projects.length} of {projects.length} records</p>

        <div className="flex items-center gap-2">
          <select className="border border-black px-2 py-1">
            <option>20 / page</option>
            <option>50 / page</option>
            <option>100 / page</option>
          </select>

          <button className="border border-black px-3 py-1 hover:bg-gray-200">
            Previous
          </button>

          <button className="border border-black bg-gray-200 px-3 py-1">
            1
          </button>

          <button className="border border-black px-3 py-1 hover:bg-gray-200">
            Next
          </button>
        </div>
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
                    status: e.target.value as "active" | "inactive",
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

      {selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">View Project</h2>

            <form onSubmit={handleUpdateProject} className="flex flex-col gap-3">
              <input
                type="text"
                value={selectedProject.name}
                onChange={(e) =>
                  setSelectedProject({
                    ...selectedProject,
                    name: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <input
                type="text"
                value={selectedProject.location}
                onChange={(e) =>
                  setSelectedProject({
                    ...selectedProject,
                    location: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={selectedProject.administrator}
                onChange={(e) =>
                  setSelectedProject({
                    ...selectedProject,
                    administrator: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={selectedProject.taxDeclarationNo}
                onChange={(e) =>
                  setSelectedProject({
                    ...selectedProject,
                    taxDeclarationNo: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="text"
                value={selectedProject.pin}
                onChange={(e) =>
                  setSelectedProject({
                    ...selectedProject,
                    pin: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={selectedProject.status}
                onChange={(e) =>
                  setSelectedProject({
                    ...selectedProject,
                    status: e.target.value as "active" | "inactive",
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
                  onClick={() => setSelectedProject(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Close
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