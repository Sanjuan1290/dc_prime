import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import ConfirmBox from "../components/ui/ConfirmBox"
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
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatText,
  getDateInputValue,
  getLocalDate,
} from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type PaymentStatus = "pending" | "verified" | "rejected" | string

type Payment = {
  id: number
  client_unit_id: number
  client_name: string
  unit_id: string
  project_name: string
  net_selling_price?: number | string
  legal_misc_fee?: number | string
  total_contract_price?: number | string
  amount: number | string
  payment_type: string | null
  payment_method: string | null
  reference_id?: string | null
  payment_date: string
  status: PaymentStatus
  verified_by?: number | null
  verified_by_name?: string | null
  verified_at?: string | null
  created_at: string
  updated_at: string
}

type ClientUnit = {
  id: number
  client_id: number
  client_name: string
  listing_id: number
  unit_id: string
  project_name: string
  lot_type: string | null
  lot_area_sqm: number | string
  net_selling_price: number | string
  legal_misc_fee: number | string
  total_contract_price: number | string
  paid_amount: number | string
  balance: number | string
  payment_percentage?: number | string
  due_day: number | null
  status: string
  seller_id: number | null
  seller_name: string | null
  document_status: string
}

type PaymentSuggestions = {
  suggestions: Record<string, number>
  next_due?: {
    payment_type: string
    description: string
    due_amount: number
  } | null
  terms?: {
    downpayment_percent?: number
    downpayment_gives?: number
    downpayment_discount_rate?: number
    downpayment_discount_amount?: number
    downpayment_net_amount?: number
    payment_terms_months?: number
  }
}

type PaymentFormData = {
  client_unit_id: number | ""
  amount: string
  payment_type: string
  payment_method: string
  reference_id: string
  payment_date: string
  status: PaymentStatus
}

type PaymentsResponse = {
  payments?: Payment[]
  data?: Payment[]
}

type ClientUnitsResponse = {
  clientUnits?: ClientUnit[]
  data?: ClientUnit[]
}

const emptyFormData: PaymentFormData = {
  client_unit_id: "",
  amount: "",
  payment_type: "monthly",
  payment_method: "cash",
  reference_id: "",
  payment_date: getLocalDate(),
  status: "pending",
}

const paymentTypes = [
  "reservation_fee",
  "downpayment",
  "monthly",
  "legal_misc",
  "full_payment",
  "other",
]

const paymentMethods = [
  "cash",
  "bank_transfer",
  "gcash",
  "check",
  "other",
]

const getPaymentDateValue = (date: string | null | undefined) => {
  const formattedDate = formatDate(date)

  return formattedDate === "-" ? "" : formattedDate
}

const paymentStatuses = ["pending", "verified", "rejected"]

const fetchPayments = async (): Promise<Payment[]> => {
  const response = await fetch(`${API_URL}/payments`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as PaymentsResponse
  return data.payments || data.data || []
}

const fetchClientUnits = async (): Promise<ClientUnit[]> => {
  const response = await fetch(`${API_URL}/client-units`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ClientUnitsResponse
  return data.clientUnits || data.data || []
}

const fetchPaymentSuggestions = async (
  clientUnitId: number
): Promise<PaymentSuggestions | null> => {
  const response = await fetch(
    `${API_URL}/client-units/${clientUnitId}/payment-suggestions`,
    {
      credentials: "include",
    }
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = await response.json()
  return data.data || data.paymentSuggestions || null
}

const createPayment = async (paymentData: PaymentFormData) => {
  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatPaymentPayload(paymentData)),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const updatePayment = async ({
  id,
  paymentData,
}: {
  id: number
  paymentData: PaymentFormData
}) => {
  const response = await fetch(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatPaymentPayload(paymentData)),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const deletePayment = async (id: number) => {
  const response = await fetch(`${API_URL}/payments/${id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

const formatPaymentPayload = (paymentData: PaymentFormData) => {
  return {
    client_unit_id: paymentData.client_unit_id,
    amount: Number(paymentData.amount || 0),
    payment_type: paymentData.payment_type || null,
    payment_method: paymentData.payment_method || null,
    reference_id: paymentData.reference_id.trim() || null,
    payment_date: paymentData.payment_date || getLocalDate(),
    status: paymentData.status || "pending",
  }
}

const paymentToFormData = (payment: Payment): PaymentFormData => {
  return {
    client_unit_id: payment.client_unit_id,
    amount: String(payment.amount || ""),
    payment_type: payment.payment_type || "monthly",
    payment_method: payment.payment_method || "cash",
    reference_id: payment.reference_id || "",
    payment_date: getDateInputValue(payment.payment_date),
    status: payment.status || "pending",
  }
}

const getClientUnitSearchText = (unit: ClientUnit) => {
  return [
    unit.id,
    unit.client_name,
    unit.unit_id,
    unit.project_name,
    unit.lot_type,
    unit.status,
    unit.document_status,
    unit.seller_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

const Payments = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>(emptyFormData)
  const [editFormData, setEditFormData] =
    useState<PaymentFormData>(emptyFormData)
  const [clientUnitSearch, setClientUnitSearch] = useState("")
  const [editClientUnitSearch, setEditClientUnitSearch] = useState("")
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    data: payments = [],
    isLoading,
    error,
  } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  })

  const { data: clientUnits = [] } = useQuery<ClientUnit[]>({
    queryKey: ["client-units"],
    queryFn: fetchClientUnits,
  })

  const invalidateAfterPaymentChange = () => {
    queryClient.invalidateQueries({ queryKey: ["payments"] })
    queryClient.invalidateQueries({ queryKey: ["client-units"] })
    queryClient.invalidateQueries({ queryKey: ["payment-suggestions"] })
    queryClient.invalidateQueries({ queryKey: ["commissions"] })
    queryClient.invalidateQueries({ queryKey: ["commission-summary"] })
    queryClient.invalidateQueries({ queryKey: ["commission-releases"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
    queryClient.invalidateQueries({ queryKey: ["reports"] })
  }

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      invalidateAfterPaymentChange()
      setIsAddOpen(false)
      setFormData(emptyFormData)
      setClientUnitSearch("")
      setSuccessMessage("Payment created successfully")
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: updatePayment,
    onSuccess: () => {
      invalidateAfterPaymentChange()
      setEditPayment(null)
      setEditFormData(emptyFormData)
      setEditClientUnitSearch("")
      setSuccessMessage("Payment updated successfully")
    },
  })

  const deletePaymentMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      invalidateAfterPaymentChange()
      setPaymentToDelete(null)
      setSuccessMessage("Payment deleted successfully")
    },
  })

  const filteredPayments = payments.filter((payment) => {
    const search = searchInput.toLowerCase().trim()

    const matchesSearch =
      search === "" ||
      payment.client_name.toLowerCase().includes(search) ||
      payment.unit_id.toLowerCase().includes(search) ||
      payment.project_name.toLowerCase().includes(search) ||
      (payment.payment_type || "").toLowerCase().includes(search) ||
      (payment.payment_method || "").toLowerCase().includes(search) ||
      (payment.reference_id || "").toLowerCase().includes(search) ||
      (payment.status || "").toLowerCase().includes(search)

    const matchesType =
      paymentTypeFilter === "all" || payment.payment_type === paymentTypeFilter

    const matchesMethod =
      paymentMethodFilter === "all" ||
      payment.payment_method === paymentMethodFilter

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter

    const paymentDate = getPaymentDateValue(payment.payment_date)

    const matchesDateFrom =
      dateFrom === "" || paymentDate >= dateFrom

    const matchesDateTo =
      dateTo === "" || paymentDate <= dateTo

    return (
      matchesSearch &&
      matchesType &&
      matchesMethod &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo
    )
  })

  const paginatedPayments = paginateRows(filteredPayments, page, rowsPerPage)

  const filteredClientUnits = useMemo(() => {
    const search = clientUnitSearch.toLowerCase().trim()

    if (!search) return clientUnits

    return clientUnits.filter((unit) =>
      getClientUnitSearchText(unit).includes(search)
    )
  }, [clientUnits, clientUnitSearch])

  const filteredEditClientUnits = useMemo(() => {
    const search = editClientUnitSearch.toLowerCase().trim()

    if (!search) return clientUnits

    return clientUnits.filter((unit) =>
      getClientUnitSearchText(unit).includes(search)
    )
  }, [clientUnits, editClientUnitSearch])

  const selectedClientUnit = clientUnits.find(
    (unit) => Number(unit.id) === Number(formData.client_unit_id)
  )

  const selectedClientUnitId =
    formData.client_unit_id === "" ? null : Number(formData.client_unit_id)

  const {
    data: paymentSuggestions = null,
    isFetching: isPaymentSuggestionsLoading,
  } = useQuery<PaymentSuggestions | null>({
    queryKey: ["payment-suggestions", selectedClientUnitId],
    queryFn: () => fetchPaymentSuggestions(Number(selectedClientUnitId)),
    enabled: Boolean(selectedClientUnitId),
  })

  useEffect(() => {
    if (!isAddOpen || !paymentSuggestions || formData.payment_type === "other") {
      return
    }

    const suggestedAmount = paymentSuggestions.suggestions?.[formData.payment_type]

    if (!suggestedAmount || Number(suggestedAmount) <= 0) {
      return
    }

    const nextAmount = Number(suggestedAmount).toFixed(2)

    setFormData((current) => {
      if (
        current.client_unit_id !== formData.client_unit_id ||
        current.payment_type !== formData.payment_type ||
        current.amount === nextAmount
      ) {
        return current
      }

      return {
        ...current,
        amount: nextAmount,
      }
    })
  }, [
    formData.client_unit_id,
    formData.payment_type,
    isAddOpen,
    paymentSuggestions,
  ])

  const selectedEditClientUnit = clientUnits.find(
    (unit) => Number(unit.id) === Number(editFormData.client_unit_id)
  )

  const totalCollected = filteredPayments
    .filter((payment) => payment.status === "verified")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const pendingTotal = filteredPayments
    .filter((payment) => payment.status === "pending")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const rejectedTotal = filteredPayments
    .filter((payment) => payment.status === "rejected")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const openAddModal = () => {
    setFormData(emptyFormData)
    setClientUnitSearch("")
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (payment: Payment) => {
    setEditPayment(payment)
    setEditFormData(paymentToFormData(payment))
    setEditClientUnitSearch("")
    setSuccessMessage("")
  }

  const handleCreatePayment = () => {
    createPaymentMutation.mutate(formData)
  }

  const handleUpdatePayment = () => {
    if (!editPayment) return

    updatePaymentMutation.mutate({
      id: editPayment.id,
      paymentData: editFormData,
    })
  }

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment)
  }

  const mutationError =
    createPaymentMutation.error?.message ||
    updatePaymentMutation.error?.message ||
    deletePaymentMutation.error?.message

  if (isLoading) {
    return <LoadingState label="Loading payments..." />
  }

  if (error) {
    return <Alert variant="error" title="Failed to load payments" />
  }

  return (
    <div>
      <PageHeader
        icon={<FiCreditCard />}
        title="Payments"
        subtitle="Record payments and update commission release eligibility from verified collections."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Payment
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Payment Records" value={filteredPayments.length} />
        <StatCard label="Verified Collections" value={formatMoney(totalCollected)} />
        <StatCard label="Pending" value={formatMoney(pendingTotal)} />
        <StatCard label="Rejected" value={formatMoney(rejectedTotal)} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-6">
        <Input
          icon={<FiSearch />}
          placeholder="Search client, unit, project..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
        />

        <Select
          value={paymentTypeFilter}
          onChange={(e) => {
            setPaymentTypeFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Types</option>
          {paymentTypes.map((type) => (
            <option key={type} value={type}>
              {formatText(type)}
            </option>
          ))}
        </Select>

        <Select
          value={paymentMethodFilter}
          onChange={(e) => {
            setPaymentMethodFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Methods</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {formatText(method)}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Statuses</option>
          {paymentStatuses.map((status) => (
            <option key={status} value={status}>
              {formatText(status)}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            setPage(1)
          }}
        />

        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setSearchInput("")
            setPaymentTypeFilter("all")
            setPaymentMethodFilter("all")
            setStatusFilter("all")
            setDateFrom("")
            setDateTo("")
            setPage(1)
          }}
        >
          Reset Filters
        </Button>
      </div>

      <TableContainer>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Reference ID</th>
              <th className="px-4 py-3 text-left">Payment Date</th>
              <th className="px-4 py-3 text-left">Verified By</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPayments.map((payment) => (
              <tr key={payment.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {payment.client_name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {payment.unit_id}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {payment.project_name}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatMoney(payment.amount)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatText(payment.payment_type)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatText(payment.payment_method)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {payment.reference_id || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(payment.payment_date)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p>{payment.verified_by_name || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(payment.verified_at)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<FiEdit2 />}
                      onClick={() => openEditModal(payment)}
                    >
                      Edit
                    </Button>

                    {payment.status !== "verified" ? (
                      <Button
                        icon={<FiTrash2 />}
                        disabled={deletePaymentMutation.isPending}
                        onClick={() => handleDeletePayment(payment)}
                        variant="danger"
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}

            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState title="No payments found" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableContainer>

      <Pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={filteredPayments.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {isAddOpen ? (
        <PaymentModal
          title="Add Payment"
          formData={formData}
          setFormData={setFormData}
          clientUnitSearch={clientUnitSearch}
          setClientUnitSearch={setClientUnitSearch}
          clientUnits={filteredClientUnits}
          selectedClientUnit={selectedClientUnit}
          paymentSuggestions={paymentSuggestions}
          isSuggestionsLoading={isPaymentSuggestionsLoading}
          onClose={() => setIsAddOpen(false)}
          onSave={handleCreatePayment}
          isPending={createPaymentMutation.isPending}
          submitLabel="Add Payment"
        />
      ) : null}

      {paymentToDelete ? (
        <Modal title="Delete Payment" onClose={() => setPaymentToDelete(null)}>
          {deletePaymentMutation.error ? (
            <Alert variant="error" title={deletePaymentMutation.error.message} />
          ) : null}
          <ConfirmBox
            title="Delete payment"
            message={`Delete payment ${formatMoney(paymentToDelete.amount)} for ${paymentToDelete.client_name} - ${paymentToDelete.unit_id}? This will recalculate the client's balance and commission eligibility.`}
            onCancel={() => setPaymentToDelete(null)}
            onConfirm={() => deletePaymentMutation.mutate(paymentToDelete.id)}
            confirmLabel={deletePaymentMutation.isPending ? "Deleting..." : "Delete"}
          />
        </Modal>
      ) : null}

      {editPayment ? (
        <PaymentModal
          title="Edit Payment"
          formData={editFormData}
          setFormData={setEditFormData}
          clientUnitSearch={editClientUnitSearch}
          setClientUnitSearch={setEditClientUnitSearch}
          clientUnits={filteredEditClientUnits}
          selectedClientUnit={selectedEditClientUnit}
          onClose={() => setEditPayment(null)}
          onSave={handleUpdatePayment}
          isPending={updatePaymentMutation.isPending}
          submitLabel="Save Changes"
        />
      ) : null}
    </div>
  )
}

type PaymentModalProps = {
  title: string
  formData: PaymentFormData
  setFormData: (data: PaymentFormData) => void
  clientUnitSearch: string
  setClientUnitSearch: (value: string) => void
  clientUnits: ClientUnit[]
  selectedClientUnit?: ClientUnit
  paymentSuggestions?: PaymentSuggestions | null
  isSuggestionsLoading?: boolean
  onClose: () => void
  onSave: () => void
  isPending: boolean
  submitLabel: string
}

const PaymentModal = ({
  title,
  formData,
  setFormData,
  clientUnitSearch,
  setClientUnitSearch,
  clientUnits,
  selectedClientUnit,
  paymentSuggestions = null,
  isSuggestionsLoading = false,
  onClose,
  onSave,
  isPending,
  submitLabel,
}: PaymentModalProps) => {
  const suggestedAmount = formData.payment_type
    ? paymentSuggestions?.suggestions?.[formData.payment_type]
    : null
  const nextDueLabel = paymentSuggestions?.next_due
    ? `${paymentSuggestions.next_due.description}: ${formatMoney(paymentSuggestions.next_due.due_amount)}`
    : null

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={isPending} onClick={onSave} variant="primary">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            label="Search Client Unit"
            icon={<FiSearch />}
            placeholder="Search client, unit, project, seller..."
            value={clientUnitSearch}
            onChange={(e) => {
              setClientUnitSearch(e.target.value)
              setFormData({
                ...formData,
                client_unit_id: "",
              })
            }}
            required
          />

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {clientUnits.length > 0 ? (
              clientUnits.slice(0, 20).map((unit) => {
                const isSelected =
                  Number(formData.client_unit_id) === Number(unit.id)
                const label = `${unit.client_name} — ${unit.unit_id} (${unit.project_name})`

                return (
                  <button
                    className={[
                      "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50",
                      isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700",
                    ].join(" ")}
                    key={unit.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        client_unit_id: unit.id,
                        amount: "",
                      })
                      setClientUnitSearch(label)
                    }}
                    type="button"
                  >
                    <span className="font-semibold text-slate-900">
                      {unit.client_name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {unit.unit_id} • {unit.project_name} • {formatText(unit.status)}
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="px-3 py-3 text-sm text-slate-500">
                No client units found. Type a client name, unit ID, project, or seller.
              </p>
            )}
          </div>

          {formData.client_unit_id === "" ? (
            <p className="text-xs text-amber-600">
              Select one result before saving the payment.
            </p>
          ) : null}
        </div>

        {selectedClientUnit ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <MiniDetail
              label="TCP"
              value={formatMoney(selectedClientUnit.total_contract_price)}
            />
            <MiniDetail
              label="Paid"
              value={formatMoney(selectedClientUnit.paid_amount)}
            />
            <MiniDetail
              label="Balance"
              value={formatMoney(selectedClientUnit.balance)}
            />
            <MiniDetail
              label="Payment %"
              value={`${formatNumber(selectedClientUnit.payment_percentage || 0)}%`}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Payment Type"
            value={formData.payment_type}
            onChange={(e) => {
              const nextType = e.target.value
              const nextSuggestedAmount = paymentSuggestions?.suggestions?.[nextType]

              setFormData({
                ...formData,
                payment_type: nextType,
                amount:
                  nextType !== "other" && nextSuggestedAmount && Number(nextSuggestedAmount) > 0
                    ? Number(nextSuggestedAmount).toFixed(2)
                    : formData.amount,
              })
            }}
          >
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {formatText(type)}
              </option>
            ))}
          </Select>

          <div>
            <Input
              label="Amount"
              type="number"
              min={0}
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value,
                })
              }
              required
            />
            {isSuggestionsLoading ? (
              <p className="mt-1 text-xs text-slate-500">
                Loading suggested amount...
              </p>
            ) : suggestedAmount && Number(suggestedAmount) > 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                Suggested from terms: {formatMoney(suggestedAmount)}
                {nextDueLabel ? ` • Next due: ${nextDueLabel}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Choose a payment type first. Other payments are manual.
              </p>
            )}
          </div>

          <Input
            label="Payment Date"
            type="date"
            value={formData.payment_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                payment_date: e.target.value,
              })
            }
            required
          />

          <Select
            label="Payment Method"
            value={formData.payment_method}
            onChange={(e) =>
              setFormData({
                ...formData,
                payment_method: e.target.value,
              })
            }
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {formatText(method)}
              </option>
            ))}
          </Select>

          <Input
            label="Reference ID / OR No. / Transaction No."
            value={formData.reference_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                reference_id: e.target.value,
              })
            }
            placeholder="Optional for cash; recommended for bank, GCash, check"
          />

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
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {formatText(status)}
              </option>
            ))}
          </Select>
        </div>

        <p className="text-sm text-slate-500">
          Only verified payments affect collection percentage and commission
          release eligibility.
        </p>
      </div>
    </Modal>
  )
}

const MiniDetail = ({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  )
}

export default Payments
