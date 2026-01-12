// Google SVG icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </g>
  </svg>
)

// Loading spinner
const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-2 border-donna-accent border-t-transparent" />
)

interface LoginPageProps {
  error?: string | null
  onLogin: () => void
  clearError: () => void
}

export function LoginPage({ error, onLogin, clearError }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-donna-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-donna-accent to-donna-purple rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-12 h-12 text-donna-bg"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-donna-text mb-2">Donna</h1>
          <p className="text-donna-text-secondary">Your AI-native life operating system</p>
        </div>

        {/* Login card */}
        <div className="bg-donna-bg-secondary rounded-2xl p-8 shadow-xl border border-donna-border">
          <h2 className="text-xl font-semibold text-donna-text text-center mb-6">
            Sign in to continue
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-donna-red/10 border border-donna-red/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-donna-red flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-donna-red text-sm">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-donna-red hover:text-donna-red/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Google sign-in button */}
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 
                       text-gray-800 font-medium py-3 px-4 rounded-lg transition-all
                       border border-gray-300 shadow-sm hover:shadow
                       focus:outline-none focus:ring-2 focus:ring-donna-accent focus:ring-offset-2 focus:ring-offset-donna-bg-secondary"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <p className="text-donna-text-muted text-xs text-center mt-6">
            By signing in, you agree to keep your data private and secure.
          </p>
        </div>

        {/* Footer */}
        <p className="text-donna-text-muted text-sm text-center mt-6">
          Your notes and conversations are stored locally and never shared.
        </p>
      </div>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-donna-bg flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-donna-text-secondary">Loading...</p>
      </div>
    </div>
  )
}
