import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

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
  client_id: number
  client_name: string
  listing_id: number
  unit_id: string
  project_name: string
  lot_type: string | null
  lot_area_sqm: number | string
  net_selling_price: number | string
  paid_amount: number | string
  balance: number | string
  due_day: number | null
  status: string
  assigned_user_id: number | null
  assigned_user_name: string | null
  document_status: string
  created_at: string
  updated_at: string
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

const today = new Date().toISOString().slice(0, 10)

const emptyFormData: PaymentFormData = {
  client_unit_id: 0,
  amount: 0,
  payment_type: "reservation_fee",
  payment_method: "cash",
  payment_date: today,
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

  return res.json()
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

  return res.json()
}

const Payments = () => {
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>(emptyFormData)

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
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: updatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["client-units"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      setEditPayment(null)
    },
  })

  const formatMoney = (amount: number | string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0))
  }

  const formatText = (value: string | null) => {
    if (!value) return "-"

    return value
      .replaceAll("_", " ")
      .split(" ")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (date: string) => {
    if (!date) return "-"

    return date.slice(0, 10)
  }

  const getFormClientUnitId = () => {
    return formData.client_unit_id || clientUnits[0]?.id || 0
  }

  const resetForm = () => {
    setFormData({
      ...emptyFormData,
      client_unit_id: clientUnits[0]?.id || 0,
    })
  }

  const openAddModal = () => {
    setFormData({
      ...emptyFormData,
      client_unit_id: clientUnits[0]?.id || 0,
    })
    setIsAddOpen(true)
  }

  const openEditModal = (payment: Payment) => {
    setEditPayment(payment)
  }

  const handleAddPayment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    createPaymentMutation.mutate({
      ...formData,
      client_unit_id: getFormClientUnitId(),
    })
  }

  const handleUpdatePayment = (e: FormEvent<HTMLFormElement>) => {
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

    const matchesSearch =
      search === "" ||
      payment.client_name.toLowerCase().includes(search) ||
      payment.unit_id.toLowerCase().includes(search) ||
      payment.project_name.toLowerCase().includes(search) ||
      (payment.payment_type || "").toLowerCase().includes(search) ||
      (payment.payment_method || "").toLowerCase().includes(search) ||
      formatDate(payment.payment_date).toLowerCase().includes(search)

    const matchesPaymentType =
      paymentTypeFilter === "all" ||
      payment.payment_type === paymentTypeFilter

    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      payment.payment_method === paymentMethodFilter

    return matchesSearch && matchesPaymentType && matchesPaymentMethod
  })

  const paymentTypes = [
    ...new Set(payments.map((payment) => payment.payment_type).filter(Boolean)),
  ] as string[]

  const paymentMethods = [
    ...new Set(payments.map((payment) => payment.payment_method).filter(Boolean)),
  ] as string[]

  const totalCollections = payments.reduce((sum, payment) => {
    return sum + Number(payment.amount || 0)
  }, 0)

  const latestPaymentAmount =
    payments.length > 0 ? Number(payments[0].amount || 0) : 0

  if (isLoading) {
    return <p className="p-4">Loading payments...</p>
  }

  if (error) {
    return <p className="p-4">Failed to load payments</p>
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-sm text-gray-600">
          Track client collections and payment records from MySQL
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Tracked Collections</p>
          <h3 className="text-2xl font-bold">
            {formatMoney(totalCollections)}
          </h3>
          <p className="text-sm text-gray-600">Total recorded payments</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Payments</p>
          <h3 className="text-2xl font-bold">{payments.length}</h3>
          <p className="text-sm text-gray-600">Total payment records</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Latest Payment</p>
          <h3 className="text-2xl font-bold">
            {formatMoney(latestPaymentAmount)}
          </h3>
          <p className="text-sm text-gray-600">Most recent collection</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={openAddModal}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Payment
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search client, unit, type, method, date..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-black px-3 py-2 md:w-96"
          />

          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Types</option>
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {formatText(type)}
              </option>
            ))}
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="border border-black px-3 py-2"
          >
            <option value="all">All Methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {formatText(method)}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchInput("")
              setPaymentTypeFilter("all")
              setPaymentMethodFilter("all")
            }}
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
                Client ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Unit ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Project ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Amount ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Type ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Method ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Payment Date ↕
              </th>
              <th className="border-r border-black px-4 py-2 text-left">
                Updated At ↕
              </th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">
                  {payment.client_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {payment.unit_id}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {payment.project_name}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatMoney(payment.amount)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatText(payment.payment_type)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatText(payment.payment_method)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatDate(payment.payment_date)}
                </td>

                <td className="border-r border-black px-4 py-2">
                  {formatDate(payment.updated_at)}
                </td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => openEditModal(payment)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-600">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Payment</h2>

            <form onSubmit={handleAddPayment} className="flex flex-col gap-3">
              <select
                value={getFormClientUnitId()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client_unit_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {clientUnits.length === 0 && (
                  <option value={0}>No client units available</option>
                )}

                {clientUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.client_name} - {unit.unit_id}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <select
                value={formData.payment_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_type: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="reservation_fee">Reservation Fee</option>
                <option value="downpayment">Downpayment</option>
                <option value="monthly_payment">Monthly Payment</option>
                <option value="legal_misc_fee">Legal / Misc Fee</option>
                <option value="full_payment">Full Payment</option>
                <option value="other">Other</option>
              </select>

              <select
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_method: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="gcash">GCash</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>

              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_date: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              {createPaymentMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {createPaymentMutation.error.message}
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
                  disabled={
                    createPaymentMutation.isPending || clientUnits.length === 0
                  }
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {createPaymentMutation.isPending
                    ? "Saving..."
                    : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editPayment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Payment</h2>

            <form onSubmit={handleUpdatePayment} className="flex flex-col gap-3">
              <select
                value={editPayment.client_unit_id}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    client_unit_id: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              >
                {clientUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.client_name} - {unit.unit_id}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={Number(editPayment.amount || 0)}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    amount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
                required
              />

              <select
                value={editPayment.payment_type || "other"}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    payment_type: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="reservation_fee">Reservation Fee</option>
                <option value="downpayment">Downpayment</option>
                <option value="monthly_payment">Monthly Payment</option>
                <option value="legal_misc_fee">Legal / Misc Fee</option>
                <option value="full_payment">Full Payment</option>
                <option value="other">Other</option>
              </select>

              <select
                value={editPayment.payment_method || "other"}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    payment_method: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="gcash">GCash</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>

              <input
                type="date"
                value={formatDate(editPayment.payment_date)}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    payment_date: e.target.value,
                  })
                }
                className="border border-black px-3 py-2"
              />

              {updatePaymentMutation.isError && (
                <p className="border border-black px-4 py-2 text-red-600">
                  {updatePaymentMutation.error.message}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditPayment(null)}
                  className="border border-black px-4 py-2 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatePaymentMutation.isPending}
                  className="border border-black px-4 py-2 hover:bg-gray-200 disabled:opacity-50"
                >
                  {updatePaymentMutation.isPending
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

export default Payments