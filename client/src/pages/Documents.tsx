import { useState } from "react"

type DocumentStatus = "active" | "inactive"

type DocumentItem = {
  id: number
  name: string
  description: string
  isRequired: boolean
  status: DocumentStatus
}

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 1,
      name: "Client Registration Form - Seller's Copy",
      description: "Seller copy of the client registration form",
      isRequired: true,
      status: "active",
    },
    {
      id: 2,
      name: "Client Registration Form - Administrator Copy",
      description: "Administrator copy of the client registration form",
      isRequired: true,
      status: "active",
    },
    {
      id: 3,
      name: "Intent to Buy",
      description: "Client intent to buy document",
      isRequired: true,
      status: "active",
    },
    {
      id: 4,
      name: "Offer to Buy & Buyer's Profile",
      description: "Offer to buy form with buyer profile",
      isRequired: true,
      status: "active",
    },
    {
      id: 5,
      name: "Reservation Agreement",
      description: "Agreement for unit reservation",
      isRequired: true,
      status: "active",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<DocumentItem | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isRequired: true,
    status: "active" as DocumentStatus,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isRequired: true,
      status: "active",
    })
  }

  const handleAddDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newDocument: DocumentItem = {
      id: documents.length + 1,
      ...formData,
    }

    setDocuments((prev) => [...prev, newDocument])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editDocument) return

    setDocuments((prev) =>
      prev.map((document) =>
        document.id === editDocument.id ? editDocument : document
      )
    )

    setEditDocument(null)
  }

  const filteredDocuments = documents.filter((document) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      document.name.toLowerCase().includes(search) ||
      document.description.toLowerCase().includes(search) ||
      document.status.toLowerCase().includes(search) ||
      (document.isRequired ? "required" : "optional").includes(search)
    )
  })

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-sm text-gray-600">
          Manage the list of documents required from clients
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Document
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search document name, description, status..."
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
                Description ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Required ↕
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
            {filteredDocuments.map((document) => (
              <tr key={document.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {document.name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {document.description || "-"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {document.isRequired ? "Yes" : "No"}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {document.status}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditDocument(document)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredDocuments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Document</h2>

            <form onSubmit={handleAddDocument} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Document name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border border-black px-3 py-2"
                required
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="min-h-24 border border-black px-3 py-2"
              />

              <select
                value={formData.isRequired ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isRequired: e.target.value === "true",
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="true">Required</option>
                <option value="false">Optional</option>
              </select>

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as DocumentStatus,
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
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editDocument && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Document</h2>

            <form onSubmit={handleUpdateDocument} className="flex flex-col gap-3">
              <input
                type="text"
                value={editDocument.name}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    name: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <textarea
                value={editDocument.description}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    description: e.target.value,
                  })
                }
                className="min-h-24 border border-black px-3 py-2"
              />

              <select
                value={editDocument.isRequired ? "true" : "false"}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    isRequired: e.target.value === "true",
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="true">Required</option>
                <option value="false">Optional</option>
              </select>

              <select
                value={editDocument.status}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    status: e.target.value as DocumentStatus,
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
                  onClick={() => setEditDocument(null)}
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

export default Documents