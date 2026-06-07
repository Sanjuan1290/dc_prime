import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi"
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
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import {
  formatDate,
  formatMoney,
  formatText,
  getLocalDate,
} from "../utils/formatters"
import { paginateRows } from "../utils/pagination"

type Payment = {
  id: number
  client_unit_id: number
  client_name: string
  unit_id: string
  project_name: string
  amount: number | string
  payment_type: string | null
  payment_method: string | null
  payment_date: string
  created_at: string
  updated_at: string
}

type ClientUnit = {
  id: number
  client_id?: number
  client_name: string
  listing_id?: number
  unit_id: string
  project_name?: string
  lot_type?: string | null
  lot_area_sqm?: number | string
  net_selling_price?: number | string
  paid_amount?: number | string
  balance?: number | string
  due_day?: number | null
  status?: string
  assigned_user_id?: number | null
  assigned_user_name?: string | null
  document_status?: string
  created_at?: string
  updated_at?: string
}

type PaymentFormData = {
  client_unit_id: number
  amount: number
  payment_type: string
  payment_method: string
  payment_date: string
}

type PaymentsResponse = {
  payments: Payment[]
}

type ClientUnitsResponse = {
  clientUnits: ClientUnit[]
}

const emptyFormData: PaymentFormData = {
  client_unit_id: 0,
  amount: 0,
  payment_type: "reservation_fee",
  payment_method: "cash",
  payment_date: getLocalDate(),
}

const paymentTypeOptions = [
  "reservation_fee",
  "downpayment",
  "monthly",
  "legal_misc",
  "full_payment",
  "other",
]

const paymentMethodOptions = [
  "cash",
  "bank_transfer",
  "gcash",
  "check",
  "other",
]

const fetchPayments = async (): Promise<Payment[]> => {
  const response = await fetch(`${API_URL}/payments`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as PaymentsResponse
  return data.payments
}

const fetchClientUnits = async (): Promise<ClientUnit[]> => {
  const response = await fetch(`${API_URL}/client-units`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  const data = (await response.json()) as ClientUnitsResponse
  return data.clientUnits
}

const createPayment = async (paymentData: PaymentFormData) => {
  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
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
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
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
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>(emptyFormData)
  const [clientUnitSearch, setClientUnitSearch] = useState("")
  const [editClientUnitSearch, setEditClientUnitSearch] = useState("")

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

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["client-units"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setIsAddOpen(false)
      setFormData(emptyFormData)
      setClientUnitSearch("")
      setSuccessMessage("Payment created successfully")
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: updatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["client-units"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setEditPayment(null)
      setEditClientUnitSearch("")
      setSuccessMessage("Payment updated successfully")
    },
  })

  const openAddModal = () => {
    setFormData(emptyFormData)
    setClientUnitSearch("")
    setSuccessMessage("")
    setIsAddOpen(true)
  }

  const openEditModal = (payment: Payment) => {
    setEditPayment(payment)
    setEditClientUnitSearch("")
    setSuccessMessage("")
  }

  const handleAddPayment = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    createPaymentMutation.mutate(formData)
  }

  const handleUpdatePayment = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!editPayment) return

    updatePaymentMutation.mutate({
      id: editPayment.id,
      paymentData: {
        client_unit_id: editPayment.client_unit_id,
        amount: Number(editPayment.amount || 0),
        payment_type: editPayment.payment_type || "other",
        payment_method: editPayment.payment_method || "cash",
        payment_date: formatDate(editPayment.payment_date),
      },
    })
  }

  const filteredPayments = payments.filter((payment) => {
    const search = searchInput.toLowerCase().trim()
    const paymentDate = formatDate(payment.payment_date)

    const matchesSearch =
      search === "" ||
      payment.client_name.toLowerCase().includes(search) ||
      payment.unit_id.toLowerCase().includes(search) ||
      payment.project_name.toLowerCase().includes(search) ||
      (payment.payment_type || "").toLowerCase().includes(search) ||
      (payment.payment_method || "").toLowerCase().includes(search) ||
      paymentDate.toLowerCase().includes(search)

    const matchesPaymentType =
      paymentTypeFilter === "all" || payment.payment_type === paymentTypeFilter

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      payment.payment_method === paymentMethodFilter

    const matchesDateFrom = dateFrom === "" || paymentDate >= dateFrom
    const matchesDateTo = dateTo === "" || paymentDate <= dateTo

    return (
      matchesSearch &&
      matchesPaymentType &&
      matchesPaymentMethod &&
      matchesDateFrom &&
      matchesDateTo
    )
  })

  const paginatedPayments = paginateRows(filteredPayments, page, rowsPerPage)

  const paymentTypes = [
    ...new Set(payments.map((payment) => payment.payment_type).filter(Boolean)),
  ] as string[]

  const paymentMethods = [
    ...new Set(
      payments.map((payment) => payment.payment_method).filter(Boolean)
    ),
  ] as string[]

  const totalCollections = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  )

  const latestPaymentAmount =
    payments.length > 0 ? Number(payments[0].amount || 0) : 0

  const thisMonth = getLocalDate().slice(0, 7)

  const thisMonthCollections = payments
    .filter((payment) => formatDate(payment.payment_date).startsWith(thisMonth))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const monthlyCollections = Object.values(
    payments.reduce<Record<string, { month: string; total: number }>>(
      (acc, payment) => {
        const month = formatDate(payment.payment_date).slice(0, 7)

        acc[month] = acc[month] || {
          month,
          total: 0,
        }

        acc[month].total += Number(payment.amount || 0)

        return acc
      },
      {}
    )
  ).sort((a, b) => a.month.localeCompare(b.month))

  const selectedAddClientUnit = clientUnits.find(
    (unit) => unit.id === formData.client_unit_id
  )

  const selectedEditClientUnit = editPayment
    ? clientUnits.find((unit) => unit.id === editPayment.client_unit_id)
    : null

  const mutationError =
    createPaymentMutation.error?.message || updatePaymentMutation.error?.message

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
        subtitle="Track reservation, downpayment, monthly, legal/misc, and full payment records."
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Payment
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {mutationError ? <Alert variant="error" title={mutationError} /> : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Tracked Collections" value={formatMoney(totalCollections)} />
        <StatCard label="Payment Records" value={payments.length} />
        <StatCard label="Latest Payment" value={formatMoney(latestPaymentAmount)} />
        <StatCard label="This Month" value={formatMoney(thisMonthCollections)} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Monthly Collections
        </h2>

        {monthlyCollections.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCollections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value || 0))}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  strokeWidth={3}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No collection chart data yet" />
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-6">
        <Input
          icon={<FiSearch />}
          placeholder="Search client, unit, project, type, method..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
          className="lg:col-span-2"
        />

        <Select
          value={paymentTypeFilter}
          onChange={(e) => {
            setPaymentTypeFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Payment Types</option>
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
          <option value="all">All Payment Methods</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {formatText(method)}
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

      <div className="mb-4">
        <Button
          onClick={() => {
            setSearchInput("")
            setPaymentTypeFilter("all")
            setPaymentMethodFilter("all")
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
              <th className="px-4 py-3 text-left">Date</th>
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
                  {formatDate(payment.payment_date)}
                </td>

                <td className="px-4 py-3">
                  <Button
                    icon={<FiEdit2 />}
                    onClick={() => openEditModal(payment)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}

            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    title="No payments found"
                    description="Try clearing filters or add a new payment."
                  />
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
        <Modal title="Add Payment" onClose={() => setIsAddOpen(false)} size="lg">
          <PaymentForm
            clientUnitSearch={clientUnitSearch}
            clientUnits={clientUnits}
            error={createPaymentMutation.error?.message}
            formData={formData}
            isPending={createPaymentMutation.isPending}
            onCancel={() => setIsAddOpen(false)}
            onClientUnitSearchChange={setClientUnitSearch}
            onSubmit={handleAddPayment}
            selectedClientUnit={selectedAddClientUnit}
            setFormData={setFormData}
            submitLabel="Save Payment"
          />
        </Modal>
      ) : null}

      {editPayment ? (
        <Modal
          title="Edit Payment"
          onClose={() => setEditPayment(null)}
          size="lg"
        >
          <PaymentForm
            clientUnitSearch={editClientUnitSearch}
            clientUnits={clientUnits}
            error={updatePaymentMutation.error?.message}
            formData={{
              client_unit_id: editPayment.client_unit_id,
              amount: Number(editPayment.amount || 0),
              payment_type: editPayment.payment_type || "other",
              payment_method: editPayment.payment_method || "cash",
              payment_date: formatDate(editPayment.payment_date),
            }}
            isPending={updatePaymentMutation.isPending}
            onCancel={() => setEditPayment(null)}
            onClientUnitSearchChange={setEditClientUnitSearch}
            onSubmit={handleUpdatePayment}
            selectedClientUnit={selectedEditClientUnit}
            setFormData={(nextData) =>
              setEditPayment({
                ...editPayment,
                client_unit_id: nextData.client_unit_id,
                amount: nextData.amount,
                payment_type: nextData.payment_type,
                payment_method: nextData.payment_method,
                payment_date: nextData.payment_date,
              })
            }
            submitLabel="Save Changes"
          />
        </Modal>
      ) : null}
    </div>
  )
}

type PaymentFormProps = {
  clientUnitSearch: string
  clientUnits: ClientUnit[]
  error?: string
  formData: PaymentFormData
  isPending: boolean
  onCancel: () => void
  onClientUnitSearchChange: (value: string) => void
  onSubmit: (e: { preventDefault: () => void }) => void
  selectedClientUnit?: ClientUnit | null
  setFormData: (data: PaymentFormData) => void
  submitLabel: string
}

const PaymentForm = ({
  clientUnitSearch,
  clientUnits,
  error,
  formData,
  isPending,
  onCancel,
  onClientUnitSearchChange,
  onSubmit,
  selectedClientUnit,
  setFormData,
  submitLabel,
}: PaymentFormProps) => {
  const search = clientUnitSearch.toLowerCase().trim()

  const filteredClientUnits = clientUnits.filter((unit) => {
    return search === "" || getClientUnitSearchText(unit).includes(search)
  })

  const visibleClientUnits = filteredClientUnits.slice(0, 50)

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Client Unit</h3>
            <p className="text-sm text-slate-500">
              Search by client name, unit ID, project, lot type, or client unit ID.
            </p>
          </div>

          {formData.client_unit_id ? (
            <Button
              icon={<FiX />}
              onClick={() =>
                setFormData({
                  ...formData,
                  client_unit_id: 0,
                })
              }
              variant="ghost"
            />
          ) : null}
        </div>

        <Input
          icon={<FiSearch />}
          placeholder="Example: AHMED, LA-0416, Maragondon, 15..."
          value={clientUnitSearch}
          onChange={(e) => onClientUnitSearchChange(e.target.value)}
        />

        {selectedClientUnit ? (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="font-bold text-blue-900">Selected Client Unit</p>
            <p className="mt-1 text-blue-800">
              {selectedClientUnit.client_name}
            </p>
            <p className="text-blue-700">
              {selectedClientUnit.unit_id}
              {selectedClientUnit.project_name
                ? ` - ${selectedClientUnit.project_name}`
                : ""}
            </p>
            <p className="text-blue-700">
              Balance: {formatMoney(selectedClientUnit.balance)}
            </p>
          </div>
        ) : (
          <Alert
            className="mt-3"
            title="No client unit selected yet."
            variant="warning"
          />
        )}

        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {visibleClientUnits.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  client_unit_id: unit.id,
                })
              }
              className={[
                "block w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50",
                formData.client_unit_id === unit.id ? "bg-blue-50" : "bg-white",
              ].join(" ")}
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {unit.client_name}
                  </p>
                  <p className="text-slate-500">
                    {unit.unit_id}
                    {unit.project_name ? ` - ${unit.project_name}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    Client Unit ID: {unit.id}
                    {unit.lot_type ? ` • ${formatText(unit.lot_type)}` : ""}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="font-semibold text-slate-900">
                    {formatMoney(unit.balance)}
                  </p>
                  <p className="text-xs text-slate-500">Balance</p>
                </div>
              </div>
            </button>
          ))}

          {visibleClientUnits.length === 0 ? (
            <EmptyState
              title="No client units found"
              description="Try searching by client name, unit ID, or project."
            />
          ) : null}
        </div>

        {filteredClientUnits.length > 50 ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing first 50 results. Type more details to narrow the search.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Amount"
          min={0}
          step="0.01"
          type="number"
          value={formData.amount}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: Number(e.target.value),
            })
          }
          required
        />

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
          label="Payment Type"
          value={formData.payment_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              payment_type: e.target.value,
            })
          }
        >
          {paymentTypeOptions.map((type) => (
            <option key={type} value={type}>
              {formatText(type)}
            </option>
          ))}
        </Select>

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
          {paymentMethodOptions.map((method) => (
            <option key={method} value={method}>
              {formatText(method)}
            </option>
          ))}
        </Select>
      </div>

      {error ? <Alert title={error} variant="error" /> : null}

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          disabled={isPending || !formData.client_unit_id}
          type="submit"
          variant="primary"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default Payments