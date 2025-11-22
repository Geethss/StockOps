import api from '@/lib/api'

export const receiptService = {
  getReceipts: async (params = {}) => {
    const response = await api.get('/receipts', { params })
    return response.data
  },

  getReceipt: async (id) => {
    const response = await api.get(`/receipts/${id}`)
    return response.data
  },

  createReceipt: async (data) => {
    const response = await api.post('/receipts', data)
    return response.data
  },

  updateReceipt: async (id, data) => {
    const response = await api.put(`/receipts/${id}`, data)
    return response.data
  },

  validateReceipt: async (id) => {
    const response = await api.post(`/receipts/${id}/validate`)
    return response.data
  },
}

