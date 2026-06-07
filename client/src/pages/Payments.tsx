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
import { FiCreditCard, FiEdit2, FiPlus, FiSearch } from "react-icons/fi"
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
import { formatDate, formatMoney, formatText, getLocalDate } from "../utils/formatters"
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
  client_name: string
  unit_id: string
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

const fetchPayments = async (): Promise<Payment[]> => {
  const res = await fetch(`${API_URL}/payments`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: PaymentsResponse = await res.json()
  return data.payments
}

const fetchClientUnits = async (): Promise<ClientUnit[]> => {
  const res = await fetch(`${API_URL}/client-units`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }

  const data: ClientUnitsResponse = await res.json()
  return data.clientUnits
}

const createPayment = async (paymentData: PaymentFormData) => {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }
}

const updatePayment = async ({
  id,
  paymentData,
}: {
  id: number
  paymentData: PaymentFormData
}) => {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res))
  }
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
      setSuccessMessage("Payment updated successfully")
    },
  })

  const getFormClientUnitId = () => formData.client_unit_id || clientUnits[0]?.id || 0

  const openAddModal = () => {
    setFormData({
      ...emptyFormData,
      client_unit_id: clientUnits[0]?.id || 0,
    })
    setIsAddOpen(true)
  }

  const handleAddPayment = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    createPaymentMutation.mutate({
      ...formData,
      client_unit_id: getFormClientUnitId(),
    })
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
        payment_method: editPayment.payment_method || "",
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
    ...new Set(payments.map((payment) => payment.payment_method).filter(Boolean)),
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
    payments.reduce<Record<string, { month: string; total: number }>>((acc, payment) => {
      const month = formatDate(payment.payment_date).slice(0, 7)
      acc[month] = acc[month] || { month, total: 0 }
      acc[month].total += Number(payment.amount || 0)
      return acc
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month))

  const formFields = (payment: PaymentFormData, setPayment: (data: PaymentFormData) => void) => (
    <div className="space-y-3">
      <Select
        label="Client unit"
        onChange={(e) =>
          setPayment({ ...payment, client_unit_id: Number(e.target.value) })
        }
        required
        value={payment.client_unit_id || clientUnits[0]?.id || 0}
      >
        {clientUnits.length === 0 ? (
          <option value={0}>No client units available</option>
        ) : null}
        {clientUnits.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.client_name} - {unit.unit_id}
          </option>
        ))}
      </Select>
      <Input
        label="Amount"
        min={1}
        onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value) })}
        required
        type="number"
        value={payment.amount}
      />
      <Select
        label="Payment type"
        onChange={(e) => setPayment({ ...payment, payment_type: e.target.value })}
        value={payment.payment_type}
      >
        <option value="reservation_fee">Reservation Fee</option>
        <option value="downpayment">Downpayment</option>
        <option value="monthly_payment">Monthly Payment</option>
        <option value="legal_misc_fee">Legal / Misc Fee</option>
        <option value="full_payment">Full Payment</option>
        <option value="other">Other</option>
      </Select>
      <Select
        label="Payment method"
        onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
        value={payment.payment_method}
      >
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="gcash">GCash</option>
        <option value="check">Check</option>
        <option value="other">Other</option>
      </Select>
      <Input
        label="Payment date"
        onChange={(e) => setPayment({ ...payment, payment_date: e.target.value })}
        type="date"
        value={payment.payment_date}
      />
    </div>
  )

  return (
    <div>
      <PageHeader
        actions={
          <Button icon={<FiPlus />} onClick={openAddModal} variant="primary">
            Add Payment
          </Button>
        }
        icon={<FiCreditCard className="h-5 w-5" />}
        subtitle="Track client collections and payment records from MySQL"
        title="Payments"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Tracked Collections" value={formatMoney(totalCollections)} />
        <StatCard title="Payment Records" value={payments.length} />
        <StatCard title="Latest Payment" value={formatMoney(latestPaymentAmount)} />
        <StatCard title="This Month Collections" value={formatMoney(thisMonthCollections)} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Monthly collections</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={monthlyCollections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatMoney(value as number)} />
              <Line dataKey="total" stroke="#2563eb" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_160px_160px_150px_150px_auto]">
          <Input
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search client, unit, type, method, date..."
            value={searchInput}
          />
          <Select onChange={(e) => setPaymentTypeFilter(e.target.value)} value={paymentTypeFilter}>
            <option value="all">All Types</option>
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {formatText(type)}
              </option>
            ))}
          </Select>
          <Select onChange={(e) => setPaymentMethodFilter(e.target.value)} value={paymentMethodFilter}>
            <option value="all">All Methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {formatText(method)}
              </option>
            ))}
          </Select>
          <Input onChange={(e) => setDateFrom(e.target.value)} type="date" value={dateFrom} />
          <Input onChange={(e) => setDateTo(e.target.value)} type="date" value={dateTo} />
          <Button
            icon={<FiSearch />}
            onClick={() => {
              setSearchInput("")
              setPaymentTypeFilter("all")
              setPaymentMethodFilter("all")
              setDateFrom("")
              setDateTo("")
              setPage(1)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading payments..." /> : null}
      {error && !isLoading ? <Alert type="error">Failed to load payments</Alert> : null}

      {!isLoading && !error ? (
        filteredPayments.length === 0 ? (
          <EmptyState title="No payments found" />
        ) : (
          <>
            <TableContainer>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Client", "Unit", "Project", "Amount", "Type", "Method", "Payment Date", "Actions"].map((heading) => (
                      <th className="px-4 py-3 text-left font-semibold text-slate-600" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedPayments.map((payment) => (
                    <tr className="transition hover:bg-slate-50" key={payment.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{payment.client_name}</td>
                      <td className="px-4 py-3 text-slate-600">{payment.unit_id}</td>
                      <td className="px-4 py-3 text-slate-600">{payment.project_name}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMoney(payment.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatText(payment.payment_type)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatText(payment.payment_method)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(payment.payment_date)}</td>
                      <td className="px-4 py-3">
                        <Button icon={<FiEdit2 />} onClick={() => setEditPayment(payment)}>
                          Edit
                        </Button>
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
              totalRows={filteredPayments.length}
            />
          </>
        )
      ) : null}

      {isAddOpen ? (
        <Modal onClose={() => setIsAddOpen(false)} title="Add Payment">
          <form className="space-y-4" onSubmit={handleAddPayment}>
            {formFields(formData, setFormData)}
            {createPaymentMutation.isError ? (
              <Alert type="error">{createPaymentMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button
                disabled={createPaymentMutation.isPending || clientUnits.length === 0}
                type="submit"
                variant="primary"
              >
                {createPaymentMutation.isPending ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editPayment ? (
        <Modal onClose={() => setEditPayment(null)} title="Edit Payment">
          <form className="space-y-4" onSubmit={handleUpdatePayment}>
            {formFields(
              {
                client_unit_id: editPayment.client_unit_id,
                amount: Number(editPayment.amount || 0),
                payment_type: editPayment.payment_type || "other",
                payment_method: editPayment.payment_method || "other",
                payment_date: formatDate(editPayment.payment_date),
              },
              (nextData) =>
                setEditPayment({
                  ...editPayment,
                  ...nextData,
                })
            )}
            {updatePaymentMutation.isError ? (
              <Alert type="error">{updatePaymentMutation.error.message}</Alert>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditPayment(null)}>Cancel</Button>
              <Button disabled={updatePaymentMutation.isPending} type="submit" variant="primary">
                {updatePaymentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export default Payments
