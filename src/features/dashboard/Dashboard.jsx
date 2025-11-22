import { useQuery } from '@tanstack/react-query'
import { dashboardService } from './dashboardService'
import StatCard from './StatCard'
import Card from '@/components/ui/Card'

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of inventory operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon="📦"
          color="primary"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          icon="⚠️"
          color="warning"
        />
        <StatCard
          title="Pending Receipts"
          value={stats?.pendingReceipts || 0}
          icon="📥"
          color="primary"
        />
        <StatCard
          title="Pending Deliveries"
          value={stats?.pendingDeliveries || 0}
          icon="📤"
          color="primary"
        />
        <StatCard
          title="Scheduled Transfers"
          value={stats?.scheduledTransfers || 0}
          icon="🔄"
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Receipts</h2>
          {/* Recent receipts list */}
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Deliveries</h2>
          {/* Recent deliveries list */}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

