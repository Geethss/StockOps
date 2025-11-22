import { useQuery } from '@tanstack/react-query'
import { dashboardService } from './dashboardService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  })

  // Debug logging
  console.log('Dashboard stats:', stats)
  console.log('Dashboard isLoading:', isLoading)
  console.log('Dashboard error:', error)

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

      {/* Receipt and Delivery Sections - Matching Wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Section (Left) */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Receipt</h2>
            
            {/* "X to receive" button */}
            <div className="bg-primary-600 text-white rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{stats?.receiptsToReceive || 0}</p>
              <p className="text-sm mt-1">to receive</p>
            </div>
            
            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Late</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.receiptsLate || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Operations</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.receiptsOperations || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Delivery Section (Right) */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Delivery</h2>
            
            {/* "X to Deliver" button */}
            <div className="bg-primary-600 text-white rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{stats?.deliveriesToDeliver || 0}</p>
              <p className="text-sm mt-1">to Deliver</p>
            </div>
            
            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Late</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.deliveriesLate || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Waiting</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.deliveriesWaiting || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Operations</span>
                <span className="text-lg font-semibold text-gray-900">{stats?.deliveriesOperations || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Definitions Box - Optional, can be added if needed */}
      <Card className="bg-gray-50 border border-gray-200">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Late:</strong> schedule date &lt; today's date</p>
          <p><strong>Operations:</strong> schedule date &gt; today's date (future operations)</p>
          <p><strong>Waiting:</strong> Waiting for the stocks</p>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard

