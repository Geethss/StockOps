import api from '@/lib/api'

export const stockService = {
  getStock: async (params = {}) => {
    const response = await api.get('/stock', { params })
    return response.data
  },

  updateStock: async (productId, locationId, quantity) => {
    const response = await api.put(`/stock/${productId}/${locationId}`, { quantity })
    return response.data
  },

  getStockByLocation: async (locationId) => {
    const response = await api.get(`/stock/location/${locationId}`)
    return response.data
  },
}

