import { useState } from "react"

type Payment = {
  id: number
  clientUnitId: number
  clientName: string
  unitId: string
  projectName: string
  amount: number
  paymentType: string
  paymentMethod: string
  paymentDate: string
  createdAt: string
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 1,
      clientUnitId: 1,
      clientName: "AHMED, SARAH NACINO",
      unitId: "LA-0416",
      projectName: "Luntiang Aguinaldo",
      amount: 10000,
      paymentType: "Reservation Fee",
      paymentMethod: "Cash",
      paymentDate: "2026-06-06",
      createdAt: "2026-06-06",
    },
    {
      id: 2,
      clientUnitId: 1,
      clientName: "AHMED, SARAH NACINO",
      unitId: "LA-0416",
      projectName: "Luntiang Aguinaldo",
      amount: 58000,
      paymentType: "Downpayment",
      paymentMethod: "Bank Transfer",
      paymentDate: "2026-06-07",
      createdAt: "2026-06-07",
    },
    {
      id: 3,
      clientUnitId: 2,
      clientName: "ALAMER, JAZZIE",
      unitId: "LA-0221",
      projectName: "Luntiang Aguinaldo",
      amount: 35500,
      paymentType: "Monthly Payment",
      paymentMethod: "GCash",
      paymentDate: "2026-06-08",
      createdAt: "2026-06-08",
    },
  ])

  const clientUnits = [
    {
      id: 1,
      clientName: "AHMED, SARAH NACINO",
      unitId: "LA-0416",
      projectName: "Luntiang Aguinaldo",
    },
    {
      id: 2,
      clientName: "ALAMER, JAZZIE",
      unitId: "LA-0221",
      projectName: "Luntiang Aguinaldo",
    },
  ]

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)

  const [formData, setFormData] = useState({
    clientUnitId: 1,
    amount: 0,
    paymentType: "Reservation Fee",
    paymentMethod: "Cash",
    paymentDate: new Date().toISOString().slice(0, 10),
  })

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const resetForm = () => {
    setFormData({
      clientUnitId: 1,
      amount: 0,
      paymentType: "Reservation Fee",
      paymentMethod: "Cash",
      paymentDate: new Date().toISOString().slice(0, 10),
    })
  }

  const getClientUnit = (clientUnitId: number) => {
    return clientUnits.find((unit) => unit.id === clientUnitId)
  }

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const selectedUnit = getClientUnit(formData.clientUnitId)

    if (!selectedUnit) return

    const newPayment: Payment = {
      id: payments.length + 1,
      clientUnitId: formData.clientUnitId,
      clientName: selectedUnit.clientName,
      unitId: selectedUnit.unitId,
      projectName: selectedUnit.projectName,
      amount: formData.amount,
      paymentType: formData.paymentType,
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setPayments((prev) => [...prev, newPayment])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdatePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editPayment) return

    const selectedUnit = getClientUnit(editPayment.clientUnitId)

    if (!selectedUnit) return

    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === editPayment.id
          ? {
              ...editPayment,
              clientName: selectedUnit.clientName,
              unitId: selectedUnit.unitId,
              projectName: selectedUnit.projectName,
            }
          : payment
      )
    )

    setEditPayment(null)
  }

  const filteredPayments = payments.filter((payment) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      payment.clientName.toLowerCase().includes(search) ||
      payment.unitId.toLowerCase().includes(search) ||
      payment.projectName.toLowerCase().includes(search) ||
      payment.paymentType.toLowerCase().includes(search) ||
      payment.paymentMethod.toLowerCase().includes(search) ||
      payment.paymentDate.toLowerCase().includes(search)
    )
  })

  const totalCollections = payments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-sm text-gray-600">
          Track client collections and payment records
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Tracked Collections</p>
          <h3 className="text-2xl font-bold">{formatMoney(totalCollections)}</h3>
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
            {payments.length > 0
              ? formatMoney(payments[payments.length - 1].amount)
              : formatMoney(0)}
          </h3>
          <p className="text-sm text-gray-600">Most recent collection</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
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
              <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Amount ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Type ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Method ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Payment Date ↕</th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">{payment.clientName}</td>
                <td className="border-r border-black px-4 py-2">{payment.unitId}</td>
                <td className="border-r border-black px-4 py-2">{payment.projectName}</td>
                <td className="border-r border-black px-4 py-2">{formatMoney(payment.amount)}</td>
                <td className="border-r border-black px-4 py-2">{payment.paymentType}</td>
                <td className="border-r border-black px-4 py-2">{payment.paymentMethod}</td>
                <td className="border-r border-black px-4 py-2">{payment.paymentDate}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditPayment(payment)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-600">
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
                value={formData.clientUnitId}
                onChange={(e) =>
                  setFormData({ ...formData, clientUnitId: Number(e.target.value) })
                }
                className="border border-black px-3 py-2"
              >
                {clientUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.clientName} - {unit.unitId}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                className="border border-black px-3 py-2"
                required
              />

              <select
                value={formData.paymentType}
                onChange={(e) =>
                  setFormData({ ...formData, paymentType: e.target.value })
                }
                className="border border-black px-3 py-2"
              >
                <option>Reservation Fee</option>
                <option>Downpayment</option>
                <option>Monthly Payment</option>
                <option>Legal / Misc Fee</option>
                <option>Other</option>
              </select>

              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="border border-black px-3 py-2"
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>GCash</option>
                <option>Check</option>
                <option>Other</option>
              </select>

              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData({ ...formData, paymentDate: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

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
                  Save Payment
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
                value={editPayment.clientUnitId}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    clientUnitId: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              >
                {clientUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.clientName} - {unit.unitId}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={editPayment.amount}
                onChange={(e) =>
                  setEditPayment({ ...editPayment, amount: Number(e.target.value) })
                }
                className="border border-black px-3 py-2"
                required
              />

              <select
                value={editPayment.paymentType}
                onChange={(e) =>
                  setEditPayment({ ...editPayment, paymentType: e.target.value })
                }
                className="border border-black px-3 py-2"
              >
                <option>Reservation Fee</option>
                <option>Downpayment</option>
                <option>Monthly Payment</option>
                <option>Legal / Misc Fee</option>
                <option>Other</option>
              </select>

              <select
                value={editPayment.paymentMethod}
                onChange={(e) =>
                  setEditPayment({ ...editPayment, paymentMethod: e.target.value })
                }
                className="border border-black px-3 py-2"
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>GCash</option>
                <option>Check</option>
                <option>Other</option>
              </select>

              <input
                type="date"
                value={editPayment.paymentDate}
                onChange={(e) =>
                  setEditPayment({ ...editPayment, paymentDate: e.target.value })
                }
                className="border border-black px-3 py-2"
              />

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

export default Payments