import { useSiteSettings } from '../hooks/useSiteOperations'

export function SiteSettings() {
  const {
    mode,
    setMode,
    publishState,
    togglePublishState,
    theme,
    setPrimaryColor,
    setFont
  } = useSiteSettings()

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Site Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage global site mode, publish state, and theme in one place.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Site Mode</h3>
              <p className="text-sm text-gray-500">Choose single-page or multi-page rendering.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {mode}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single Page
            </button>
            <button
              onClick={() => setMode('multi')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'multi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Multi Page
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Publish State</h3>
              <p className="text-sm text-gray-500">Switch the site between draft and published status.</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              publishState === 'published'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-yellow-50 text-yellow-800'
            }`}>
              {publishState}
            </span>
          </div>
          <button
            onClick={togglePublishState}
            className="w-full max-w-xs rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {publishState === 'published' ? 'Switch to Draft' : 'Publish Site'}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Theme</h3>
            <p className="text-sm text-gray-500">Change the primary color and font style for the site.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-700">
              <span>Primary Color</span>
              <input
                type="color"
                value={theme.primaryColor || '#4f46e5'}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700">
              <span>Font Style</span>
              <select
                value={theme.font || 'inter'}
                onChange={(event) => setFont(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="inter">Inter</option>
                <option value="system-ui">System</option>
                <option value="ui-serif">Serif</option>
                <option value="ui-monospace">Monospace</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
