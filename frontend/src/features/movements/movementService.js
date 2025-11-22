import api from '@/lib/api'

export const movementService = {
  getMovements: async (params = {}) => {
    const response = await api.get('/movements', { params })
    return response.data
  },

  getTransactionTypes: async () => {
    const response = await api.get('/movements/transaction-types')
    return response.data
  },

  searchMovements: async (query) => {
    const response = await api.get('/movements', { params: { search: query } })
    return response.data
  },

  getMovementsByLocation: async (fromLocationId, toLocationId) => {
    const response = await api.get('/movements', { 
      params: { from_location_id: fromLocationId, to_location_id: toLocationId } 
    })
    return response.data
  },
}

