import { create } from 'zustand'
import type { AuthState } from '../types'

interface AuthStore extends AuthState {
  // Actions
  checkAuth: () => Promise<void>
  logout: () => Promise<void>
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'loading',
  authEnabled: false,
  user: null,
  error: null,

  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
      })

      if (!response.ok) {
        set({
          status: 'unauthenticated',
          authEnabled: true,
          user: null,
          error: 'Failed to check authentication status',
        })
        return
      }

      const data = await response.json()

      if (!data.auth_enabled) {
        // Auth is disabled, treat as authenticated
        set({
          status: 'authenticated',
          authEnabled: false,
          user: data.user || { email: 'local@localhost', name: 'Local User', picture: '' },
          error: null,
        })
        return
      }

      if (data.authenticated && data.user) {
        set({
          status: 'authenticated',
          authEnabled: true,
          user: data.user,
          error: null,
        })
      } else {
        set({
          status: 'unauthenticated',
          authEnabled: true,
          user: null,
          error: null,
        })
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      set({
        status: 'unauthenticated',
        authEnabled: true,
        user: null,
        error: 'Failed to connect to server',
      })
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout failed:', err)
    }

    set({
      status: 'unauthenticated',
      user: null,
      error: null,
    })
  },

  setError: (error: string | null) => set({ error }),
}))
