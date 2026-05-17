import { useNavigate } from 'react-router-dom'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { settings } = useSiteSettings()
  const { isLoggedIn } = useAuth()

  const handleCTA = () => {
    navigate(isLoggedIn ? '/dashboard' : '/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      <header className="px-8 py-5 flex items-center justify-between border-b border-gray-100 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-lg font-bold text-gray-900">{settings.siteName}</span>
        </div>
        <button
          onClick={handleCTA}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {isLoggedIn ? 'Go to Dashboard' : 'Login'}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-Powered Website System
          </div>

          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            {settings.siteName}
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed">
            Build, manage, and publish websites with a powerful plugin-driven platform.
            Drag-and-drop editing, module marketplace, and real-time preview — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {isLoggedIn ? 'Go to Dashboard' : 'Login to Dashboard'}
            </button>
          </div>
        </div>
      </main>

      <footer className="px-8 py-5 text-center text-sm text-gray-400 border-t border-gray-100">
        {settings.siteName} — Site Builder Platform
      </footer>
    </div>
  )
}
