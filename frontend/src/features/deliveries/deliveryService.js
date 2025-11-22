import api from '@/lib/api'

export const deliveryService = {
  getDeliveries: async (params = {}) => {
    const response = await api.get('/deliveries', { params })
    return response.data
  },

  getDelivery: async (id) => {
    const response = await api.get(`/deliveries/${id}`)
    return response.data
  },

  createDelivery: async (data) => {
    const response = await api.post('/deliveries', data)
    return response.data
  },

  updateDelivery: async (id, data) => {
    const response = await api.put(`/deliveries/${id}`, data)
    return response.data
  },

  validateDelivery: async (id) => {
    const response = await api.post(`/deliveries/${id}/validate`)
    return response.data
  },
}

