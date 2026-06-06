const Dashboard = () => {
  const stats = [
    {
      title: 'Total Sales',
      value: '₱48,905,425.00',
      description: 'Total contract price from client units',
    },
    {
      title: 'Pending Sales',
      value: '₱12,450,000.00',
      description: 'Total value from pending client units',
    },
    {
      title: 'Listed Lot Value',
      value: '₱95,300,000.00',
      description: 'Total value of all listed lots',
    },
    {
      title: 'Available Lot Value',
      value: '₱38,250,000.00',
      description: 'Total value of available lots',
    },
    {
      title: 'Sold Lot Value',
      value: '₱48,905,425.00',
      description: 'Total value of sold lots',
    },
    {
      title: 'Tracked Collections',
      value: '₱21,780,500.00',
      description: 'Total payments collected from clients',
    },
    {
      title: 'Collection Progress',
      value: '44.54%',
      description: 'Collected amount compared to total sales',
    },
    {
      title: 'Clients',
      value: '128',
      description: 'Total registered clients',
    },
    {
      title: 'Pending Documents',
      value: '34',
      description: 'Client documents not yet submitted or reviewed',
    },
    {
      title: 'Commission Payable',
      value: '₱2,445,271.25',
      description: 'Total commission amount payable',
    },
    {
      title: 'Commission Released',
      value: '₱1,250,000.00',
      description: 'Total commission already released',
    },
    {
      title: 'Commission Remaining',
      value: '₱1,195,271.25',
      description: 'Remaining commission balance',
    },
  ]

  const agents = [
    {
      agent: 'Juan Dela Cruz',
      totalSales: '₱12,500,000.00',
      active: 8,
      cancelled: 1,
      net: '₱11,250,000.00',
    },
    {
      agent: 'Maria Santos',
      totalSales: '₱9,800,000.00',
      active: 6,
      cancelled: 0,
      net: '₱9,800,000.00',
    },
    {
      agent: 'Christopher Prime',
      totalSales: '₱7,250,000.00',
      active: 4,
      cancelled: 2,
      net: '₱5,900,000.00',
    },
  ]

  return (
    <div className="p-4">
      <h1 className="mb-4 text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="border border-black px-4 py-3"
          >
            <p className="text-sm">{stat.title}</p>
            <h3 className="font-bold text-2xl">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-2xl font-bold">Agent Performance</h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-black">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black px-4 py-2 text-left">
                  Agent ↕
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Total Sales ↕
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Active ↕
                </th>
                <th className="border-r border-black px-4 py-2 text-left">
                  Cancelled ↕
                </th>
                <th className="px-4 py-2 text-left">
                  Net ↕
                </th>
              </tr>
            </thead>

            <tbody>
              {agents.map((agent) => (
                <tr key={agent.agent} className="border-b border-black">
                  <td className="border-r border-black px-4 py-2">
                    {agent.agent}
                  </td>
                  <td className="border-r border-black px-4 py-2">
                    {agent.totalSales}
                  </td>
                  <td className="border-r border-black px-4 py-2">
                    {agent.active}
                  </td>
                  <td className="border-r border-black px-4 py-2">
                    {agent.cancelled}
                  </td>
                  <td className="px-4 py-2">
                    {agent.net}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard