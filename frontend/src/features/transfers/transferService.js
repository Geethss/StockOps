import api from '@/lib/api'

export const transferService = {
  getTransfers: async (params = {}) => {
    const response = await api.get('/transfers', { params })
    return response.data
  },

  getTransfer: async (id) => {
    const response = await api.get(`/transfers/${id}`)
    return response.data
  },

  createTransfer: async (data) => {
    const response = await api.post('/transfers', data)
    return response.data
  },

  validateTransfer: async (id) => {
    const response = await api.post(`/transfers/${id}/validate`)
    return response.data
  },
}

