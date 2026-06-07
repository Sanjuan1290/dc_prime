import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

type DocumentStatus = "active" | "inactive" | string

type DocumentItem = {
  id: number
  name: string
  description: string | null
  is_required: boolean | number
  can_reuse: boolean | number
  status: DocumentStatus
  created_at: string
  updated_at: string
}

type DocumentFormData = {
  name: string
  description: string
  is_required: boolean
  can_reuse: boolean
  status: DocumentStatus
}

type DocumentsResponse = {
  documents: DocumentItem[]
}

const emptyFormData: DocumentFormData = {
  name: "",
  description: "",
  is_required: true,
  can_reuse: false,
  status: "active",
}

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }

    return "Something went wrong"
  } catch {
    return "Something went wrong"
  }
}

const fetchDocuments = async (): Promise<DocumentItem[]> => {
  const res = await fetch(`${API_URL}/documents`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: DocumentsResponse = await res.json()
  return data.documents
}

const createDocument = async (documentData: DocumentFormData) => {
  const res = await fetch(`${API_URL}/documents`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const updateDocument = async ({
  id,
  documentData,
}: {
  id: number
  documentData: DocumentFormData
}) => {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  return res.json()
}

const Documents = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [requiredFilter, setRequiredFilter] = useState("all")
  const [reusableFilter, setReusableFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<DocumentItem | null>(null)
  const [formData, setFormData] = useState<DocumentFormData>(emptyFormData)

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery<DocumentItem[]>({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  })

  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
    },
  })

  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      setEditDocument(null)
    },
  })

  const filteredDocuments = documents.filter((document) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      document.name.toLowerCase().includes(search) ||
      (document.description || "").toLowerCase().includes(search) ||
      document.status.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all" || document.status === statusFilter

    const matchesRequired =
      requiredFilter === "all" ||
      String(Boolean(document.is_required)) === requiredFilter

    const matchesReusable =
      reusableFilter === "all" ||
      String(Boolean(document.can_reuse)) === reusableFilter

    return matchesSearch && matchesStatus && matchesRequired && matchesReusable
  })

  const resetFilters = () => {
    setSearchInput("")
    setStatusFilter("all")
    setRequiredFilter("all")
    setReusableFilter("all")
  }

  const openEditModal = (document: DocumentItem) => {
    setEditDocument(document)
  }

  const handleAddDocument = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    createDocumentMutation.mutate(formData)
  }

  const handleUpdateDocument = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editDocument) return

    updateDocumentMutation.mutate({
      id: editDocument.id,
      documentData: {
        name: editDocument.name,
        description: editDocument.description || "",
        is_required: Boolean(editDocument.is_required),
        can_reuse: Boolean(editDocument.can_reuse),
        status: editDocument.status,
      },
    })
  }

  if (isLoading) {
    return <p className="p-4">Loading documents...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load documents</p>
  }

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={requiredFilter}
            onChange={(e) => setRequiredFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Required</option>
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </select>

          <select
            value={reusableFilter}
            onChange={(e) => setReusableFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Reusable</option>
            <option value="true">Reusable</option>
            <option value="false">Not Reusable</option>
          </select>

          <button
            onClick={resetFilters}
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
                Reusable ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Status ↕
              </th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
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
                  {Boolean(document.is_required) ? "Yes" : "No"}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {Boolean(document.can_reuse) ? "Yes" : "No"}
                </td>

                <td className="border-r border-black px-4 py-2 capitalize">
                  {document.status}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => openEditModal(document)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredDocuments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
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
                value={String(formData.is_required)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_required: e.target.value === "true",
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="true">Required</option>
                <option value="false">Optional</option>
              </select>

              <select
                value={String(formData.can_reuse)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    can_reuse: e.target.value === "true",
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="true">Reusable</option>
                <option value="false">Not Reusable</option>
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

              {createDocumentMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {createDocumentMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(emptyFormData)
                    setIsAddOpen(false)
                  }}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createDocumentMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {createDocumentMutation.isPending
                    ? "Saving..."
                    : "Save Document"}
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
                value={editDocument.description || ""}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    description: e.target.value,
                  })
                }
                className="min-h-24 border border-black px-3 py-2"
              />

              <select
                value={String(Boolean(editDocument.is_required))}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    is_required: e.target.value === "true",
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="true">Required</option>
                <option value="false">Optional</option>
              </select>

              <select
                value={String(Boolean(editDocument.can_reuse))}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    can_reuse: e.target.value === "true",
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="true">Reusable</option>
                <option value="false">Not Reusable</option>
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

              {updateDocumentMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {updateDocumentMutation.error.message}
                </p>
              )}

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
                  disabled={updateDocumentMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {updateDocumentMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
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