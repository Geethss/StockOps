import api from '@/lib/api'

export const warehouseService = {
  getWarehouses: async () => {
    const response = await api.get('/warehouses')
    return response.data
  },

  getWarehouse: async (id) => {
    const response = await api.get(`/warehouses/${id}`)
    return response.data
  },

  createWarehouse: async (data) => {
    const response = await api.post('/warehouses', data)
    return response.data
  },

  updateWarehouse: async (id, data) => {
    const response = await api.put(`/warehouses/${id}`, data)
    return response.data
  },

  getLocations: async (warehouseId) => {
    const response = await api.get(`/locations`, { params: { warehouse_id: warehouseId } })
    return response.data
  },

  getAllLocations: async () => {
    const response = await api.get('/locations')
    return response.data
  },

  createLocation: async (data) => {
    const response = await api.post('/locations', data)
    return response.data
  },

  updateLocation: async (id, data) => {
    const response = await api.put(`/locations/${id}`, data)
    return response.data
  },
}

