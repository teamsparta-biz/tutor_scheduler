import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type Role = 'admin' | 'instructor'

interface AuthState {
  role: Role | null
  instructorId: string | null
  instructorName: string | null
}

interface AuthContextValue extends AuthState {
  setAdmin: () => void
  setInstructor: (id: string, name: string) => void
  logout: () => void
}

const STORAGE_KEY = 'scheduler-auth'

const AuthContext = createContext<AuthContextValue | null>(null)

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { role: null, instructorId: null, instructorName: null }
}

function saveState(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  function setAdmin() {
    setState({ role: 'admin', instructorId: null, instructorName: null })
  }

  function setInstructor(id: string, name: string) {
    setState({ role: 'instructor', instructorId: id, instructorName: name })
  }

  function logout() {
    setState({ role: null, instructorId: null, instructorName: null })
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ ...state, setAdmin, setInstructor, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
