import { useEffect } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

/**
 * Hook to manage authentication state.
 * 
 * Automatically checks auth status on mount and provides
 * login/logout actions.
 */
export function useAuth() {
  const { status, authEnabled, user, error, checkAuth, logout, setError } = useAuthStore()

  useEffect(() => {
    // Check auth status on mount
    checkAuth()
  }, [checkAuth])

  // Check URL for auth errors (from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authError = params.get('auth_error')

    if (authError) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        oauth_failed: 'Authentication failed. Please try again.',
        no_user_info: 'Could not retrieve user information from Google.',
        no_email: 'No email address was provided by Google.',
        email_not_allowed: 'Your email address is not authorized to access this application.',
      }

      setError(errorMessages[authError] || 'Authentication failed.')

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [setError])

  const login = () => {
    // Redirect to Google OAuth login
    window.location.href = '/api/auth/login/google'
  }

  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    authEnabled,
    user,
    error,
    login,
    logout,
    clearError: () => setError(null),
  }
}
