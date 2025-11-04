import React, { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../api/client'

interface User {
  id: number
  username: string
  email?: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Try to fetch user info or any protected endpoint to validate token
      // Since we don't have a /me endpoint, we'll try to decode the JWT or use health endpoint
      // For now, we'll check if token exists and let axios interceptor handle 401
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      
      // Check if token is expired
      if (exp < now) {
        return false
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        const isValid = await validateToken(storedToken)
        
        if (isValid) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      username,
      password,
    })
    
    const { access_token, user: userData } = response.data
    setToken(access_token)
    setUser(userData)
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

