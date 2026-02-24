import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { handleResponse } from '../api/client'

type Role = 'admin' | 'instructor'

interface UserProfile {
  user_id: string
  email: string
  role: Role
  display_name: string | null
  instructor_id: string | null
}

interface AuthState {
  loading: boolean
  session: Session | null
  profile: UserProfile | null
  denied: boolean
}

interface AuthContextValue {
  loading: boolean
  session: Session | null
  profile: UserProfile | null
  denied: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    profile: null,
    denied: false,
  })

  async function fetchProfile(accessToken: string): Promise<UserProfile | 'denied' | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      console.log('[Auth] /api/auth/me status:', res.status)
      if (res.status === 403) {
        return 'denied'
      }
      if (res.status === 401) {
        const body = await res.text()
        console.error('[Auth] 401 응답:', body)
        return null
      }
      const data = await handleResponse<UserProfile>(res)
      console.log('[Auth] 프로필 조회 성공:', data)
      return data
    } catch (e) {
      console.error('[Auth] fetchProfile 에러:', e)
      return null
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
          session
        ) {
          console.log('[Auth] event:', event, 'email:', session.user?.email)
          setState((s) => ({ ...s, loading: true }))
          const result = await fetchProfile(session.access_token)
          if (result === 'denied') {
            setState({ loading: false, session, profile: null, denied: true })
          } else {
            setState({ loading: false, session, profile: result, denied: false })
          }
        } else if (event === 'INITIAL_SESSION' && !session) {
          setState({ loading: false, session: null, profile: null, denied: false })
        } else if (event === 'SIGNED_OUT') {
          setState({ loading: false, session: null, profile: null, denied: false })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState((s) => ({ ...s, session }))
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    setState({ loading: false, session: null, profile: null, denied: false })
  }

  return (
    <AuthContext.Provider
      value={{
        loading: state.loading,
        session: state.session,
        profile: state.profile,
        denied: state.denied,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
