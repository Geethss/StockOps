import { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // TEMPORARILY COMMENTED OUT FOR TESTING - Always return authenticated state
  const [user, setUser] = useState({
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User'
  })
  const [loading, setLoading] = useState(false)

  // TEMPORARILY COMMENTED OUT FOR TESTING - Authentication disabled
  // useEffect(() => {
  //   // Check if user is logged in
  //   const token = localStorage.getItem('token')
  //   const savedUser = localStorage.getItem('user')
  //   
  //   if (token && savedUser) {
  //     try {
  //       setUser(JSON.parse(savedUser))
  //     } catch (error) {
  //       localStorage.removeItem('token')
  //       localStorage.removeItem('user')
  //     }
  //   }
  //   setLoading(false)
  // }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const signup = async (email, password, name) => {
    try {
      const response = await api.post('/auth/register', { 
        email, 
        password,
        full_name: name 
      })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

