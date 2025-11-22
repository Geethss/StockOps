import api from '@/lib/api'

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  getPendingOperations: async () => {
    const response = await api.get('/dashboard/pending-operations')
    return response.data
  },

  getLowStockItems: async () => {
    const response = await api.get('/dashboard/low-stock')
    return response.data
  },
}

