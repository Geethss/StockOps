import axios from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
// Request interceptor - Add auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )

// TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // TEMPORARILY COMMENTED OUT FOR TESTING - Skip auth redirects
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('token')
    //   localStorage.removeItem('user')
    //   window.location.href = '/login'
    //   toast.error('Session expired. Please login again.')
    // } else if (error.response?.status === 403) {
    //   toast.error('You do not have permission to perform this action.')
    // } else
    if (error.response?.data?.detail) {
      toast.error(error.response.data.detail)
    } else {
      toast.error('An error occurred. Please try again.')
    }
    return Promise.reject(error)
  }
)

export default api

