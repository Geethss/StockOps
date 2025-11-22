import api from '@/lib/api'

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  createProduct: async (data) => {
    const response = await api.post('/products', data)
    return response.data
  },

  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}`, data)
    return response.data
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  searchProducts: async (query) => {
    const response = await api.get('/products/search', { params: { q: query } })
    return response.data
  },
}

