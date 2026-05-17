/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'webby_auth'

function getStoredAuth() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(getStoredAuth)

  const login = (username, password) => {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: 'Username and password are required.' }
    }
    if (username.trim() === 'admin' && password.trim() === 'admin') {
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsLoggedIn(true)
      return { ok: true }
    }
    return { ok: false, error: 'Invalid credentials. Try admin / admin.' }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
