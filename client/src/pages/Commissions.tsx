import { useState } from "react"

type CommissionStatus = "pending" | "payable" | "released" | "cancelled"

type Commission = {
  id: number
  clientUnitId: number
  sellerId: number
  sellerName: string
  clientName: string
  unitId: string
  projectName: string
  netSellingPrice: number
  rate: number
  amount: number
  releasedAmount: number
  status: CommissionStatus
  createdAt: string
}

const Commissions = () => {
  const sellers = [
    {
      id: 1,
      fullName: "NEPOMUCENO, ERWIN",
    },
    {
      id: 2,
      fullName: "BRIONES, CONIE, A.",
    },
    {
      id: 3,
      fullName: "TOLEDO, NICKIE ROSE E.",
    },
  ]

  const clientUnits = [
    {
      id: 1,
      clientName: "AHMED, SARAH NACINO",
      unitId: "LA-0416",
      projectName: "Luntiang Aguinaldo",
      netSellingPrice: 1000000,
    },
    {
      id: 2,
      clientName: "ALAMER, JAZZIE",
      unitId: "LA-0221",
      projectName: "Luntiang Aguinaldo",
      netSellingPrice: 250000,
    },
  ]

  const [commissions, setCommissions] = useState<Commission[]>([
    {
      id: 1,
      clientUnitId: 1,
      sellerId: 1,
      sellerName: "NEPOMUCENO, ERWIN",
      clientName: "AHMED, SARAH NACINO",
      unitId: "LA-0416",
      projectName: "Luntiang Aguinaldo",
      netSellingPrice: 1000000,
      rate: 5,
      amount: 50000,
      releasedAmount: 20000,
      status: "payable",
      createdAt: "2026-06-06",
    },
    {
      id: 2,
      clientUnitId: 2,
      sellerId: 2,
      sellerName: "BRIONES, CONIE, A.",
      clientName: "ALAMER, JAZZIE",
      unitId: "LA-0221",
      projectName: "Luntiang Aguinaldo",
      netSellingPrice: 250000,
      rate: 5,
      amount: 12500,
      releasedAmount: 12500,
      status: "released",
      createdAt: "2026-06-07",
    },
  ])

  const [searchInput, setSearchInput] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editCommission, setEditCommission] = useState<Commission | null>(null)

  const [formData, setFormData] = useState({
    clientUnitId: 1,
    sellerId: 1,
    rate: 5,
    releasedAmount: 0,
    status: "pending" as CommissionStatus,
  })

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const getClientUnit = (clientUnitId: number) => {
    return clientUnits.find((unit) => unit.id === clientUnitId)
  }

  const getSeller = (sellerId: number) => {
    return sellers.find((seller) => seller.id === sellerId)
  }

  const computeCommissionAmount = (netSellingPrice: number, rate: number) => {
    return netSellingPrice * (rate / 100)
  }

  const resetForm = () => {
    setFormData({
      clientUnitId: 1,
      sellerId: 1,
      rate: 5,
      releasedAmount: 0,
      status: "pending",
    })
  }

  const handleAddCommission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const selectedUnit = getClientUnit(formData.clientUnitId)
    const selectedSeller = getSeller(formData.sellerId)

    if (!selectedUnit || !selectedSeller) return

    const amount = computeCommissionAmount(
      selectedUnit.netSellingPrice,
      formData.rate
    )

    const newCommission: Commission = {
      id: commissions.length + 1,
      clientUnitId: formData.clientUnitId,
      sellerId: formData.sellerId,
      sellerName: selectedSeller.fullName,
      clientName: selectedUnit.clientName,
      unitId: selectedUnit.unitId,
      projectName: selectedUnit.projectName,
      netSellingPrice: selectedUnit.netSellingPrice,
      rate: formData.rate,
      amount,
      releasedAmount: formData.releasedAmount,
      status: formData.status,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setCommissions((prev) => [...prev, newCommission])
    resetForm()
    setIsAddOpen(false)
  }

  const handleUpdateCommission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editCommission) return

    const selectedUnit = getClientUnit(editCommission.clientUnitId)
    const selectedSeller = getSeller(editCommission.sellerId)

    if (!selectedUnit || !selectedSeller) return

    const amount = computeCommissionAmount(
      selectedUnit.netSellingPrice,
      editCommission.rate
    )

    setCommissions((prev) =>
      prev.map((commission) =>
        commission.id === editCommission.id
          ? {
              ...editCommission,
              sellerName: selectedSeller.fullName,
              clientName: selectedUnit.clientName,
              unitId: selectedUnit.unitId,
              projectName: selectedUnit.projectName,
              netSellingPrice: selectedUnit.netSellingPrice,
              amount,
            }
          : commission
      )
    )

    setEditCommission(null)
  }

  const filteredCommissions = commissions.filter((commission) => {
    const search = searchInput.toLowerCase().trim()

    return (
      search === "" ||
      commission.sellerName.toLowerCase().includes(search) ||
      commission.clientName.toLowerCase().includes(search) ||
      commission.unitId.toLowerCase().includes(search) ||
      commission.projectName.toLowerCase().includes(search) ||
      commission.status.toLowerCase().includes(search)
    )
  })

  const commissionPayable = commissions.reduce((sum, item) => sum + item.amount, 0)
  const commissionReleased = commissions.reduce(
    (sum, item) => sum + item.releasedAmount,
    0
  )
  const commissionRemaining = commissionPayable - commissionReleased

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="text-sm text-gray-600">
          Track seller commission payable, released, and remaining balances
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-black px-4 py-3">
          <p className="text-sm">Commission Payable</p>
          <h3 className="text-2xl font-bold">{formatMoney(commissionPayable)}</h3>
          <p className="text-sm text-gray-600">Total commission amount</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Commission Released</p>
          <h3 className="text-2xl font-bold">{formatMoney(commissionReleased)}</h3>
          <p className="text-sm text-gray-600">Total released commission</p>
        </div>

        <div className="border border-black px-4 py-3">
          <p className="text-sm">Commission Remaining</p>
          <h3 className="text-2xl font-bold">{formatMoney(commissionRemaining)}</h3>
          <p className="text-sm text-gray-600">Unreleased commission balance</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-fit border border-black px-4 py-2 hover:bg-gray-200"
        >
          Add Commission
        </button>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Search seller, client, unit, project, status..."
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
              <th className="border-r border-black px-4 py-2 text-left">Seller ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Client ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Unit ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Project ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">TCP ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Rate ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Commission ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Released ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Remaining ↕</th>
              <th className="border-r border-black px-4 py-2 text-left">Status ↕</th>
              <th className="px-4 py-2 text-left">Actions ↕</th>
            </tr>
          </thead>

          <tbody>
            {filteredCommissions.map((commission) => (
              <tr key={commission.id} className="border-b border-black">
                <td className="border-r border-black px-4 py-2">{commission.sellerName}</td>
                <td className="border-r border-black px-4 py-2">{commission.clientName}</td>
                <td className="border-r border-black px-4 py-2">{commission.unitId}</td>
                <td className="border-r border-black px-4 py-2">{commission.projectName}</td>
                <td className="border-r border-black px-4 py-2">{formatMoney(commission.netSellingPrice)}</td>
                <td className="border-r border-black px-4 py-2">{commission.rate}%</td>
                <td className="border-r border-black px-4 py-2">{formatMoney(commission.amount)}</td>
                <td className="border-r border-black px-4 py-2">{formatMoney(commission.releasedAmount)}</td>
                <td className="border-r border-black px-4 py-2">
                  {formatMoney(commission.amount - commission.releasedAmount)}
                </td>
                <td className="border-r border-black px-4 py-2 capitalize">{commission.status}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => setEditCommission(commission)}
                    className="border border-black px-3 py-1 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredCommissions.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-600">
                  No commissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Add Commission</h2>

            <form onSubmit={handleAddCommission} className="flex flex-col gap-3">
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

              <select
                value={formData.sellerId}
                onChange={(e) =>
                  setFormData({ ...formData, sellerId: Number(e.target.value) })
                }
                className="border border-black px-3 py-2"
              >
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.fullName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Rate %"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: Number(e.target.value) })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                placeholder="Released amount"
                value={formData.releasedAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    releasedAmount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CommissionStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="payable">Payable</option>
                <option value="released">Released</option>
                <option value="cancelled">Cancelled</option>
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
                  Save Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCommission && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-4">
            <h2 className="mb-4 text-2xl font-bold">Edit Commission</h2>

            <form onSubmit={handleUpdateCommission} className="flex flex-col gap-3">
              <select
                value={editCommission.clientUnitId}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
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

              <select
                value={editCommission.sellerId}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    sellerId: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              >
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.fullName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={editCommission.rate}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    rate: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <input
                type="number"
                value={editCommission.releasedAmount}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    releasedAmount: Number(e.target.value),
                  })
                }
                className="border border-black px-3 py-2"
              />

              <select
                value={editCommission.status}
                onChange={(e) =>
                  setEditCommission({
                    ...editCommission,
                    status: e.target.value as CommissionStatus,
                  })
                }
                className="border border-black px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="payable">Payable</option>
                <option value="released">Released</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCommission(null)}
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

export default Commissions