import { useState } from 'react'
import { useSite } from '../modules/site-builder/context/SiteContext'
import { usePages, useEvents, useTheme } from '../modules/site-builder/hooks/useSiteOperations'
import { SiteSettings } from '../modules/site-builder/components/SiteSettings'
import { useDashboardPanels, useModules } from '../core/platform/modules'
import { DashboardPanel } from '../modules/events-calendar/components/DashboardPanel'
import { useSiteSettings } from '../context/SiteSettingsContext'

// Dashboard Panel Renderer for module contributions
function ModuleDashboardPanel({ panel }) {
  if (panel.component === 'DashboardPanel') {
    return <DashboardPanel />
  }
  return <div className="text-sm text-gray-500">Unknown panel: {panel.component}</div>
}

export default function Dashboard() {
  const { site, loading } = useSite()
  const { pages } = usePages()
  const { events } = useEvents()
  const dashboardPanels = useDashboardPanels()
  const { getAllModules, getEnabledModules, getDisabledModules, enableModule, disableModule } = useModules()
  const { settings, updateSettings } = useSiteSettings()
  const [nameInput, setNameInput] = useState(settings.siteName)
  const [savedName, setSavedName] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  const totalSections = pages.reduce((total, page) => total + (page.sections || []).length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome to your website builder dashboard.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pages</p>
              <p className="text-2xl font-bold text-gray-800">{pages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sections</p>
              <p className="text-2xl font-bold text-gray-800">{totalSections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Events</p>
              <p className="text-2xl font-bold text-gray-800">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Modules</p>
              <p className="text-2xl font-bold text-gray-800">{getEnabledModules().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Dashboard Panels */}
      {dashboardPanels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Module Panels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardPanels.map(panel => (
              <ModuleDashboardPanel key={`${panel.moduleId}-${panel.id}`} panel={panel} />
            ))}
          </div>
        </div>
      )}

      {/* Module Management Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Module Management</h3>
          <p className="text-sm text-gray-500 mt-1">Enable or disable modules for your site</p>
        </div>
        
        <div className="p-5">
          {/* Enabled Modules */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Enabled Modules</h4>
            {getEnabledModules().length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm text-gray-500">No modules enabled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getEnabledModules().map(module => (
                  <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{module.name}</span>
                        <span className="text-xs text-gray-500 ml-2">v{module.version}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => disableModule(module.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      Disable
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Disabled Modules */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Available Modules</h4>
            {getDisabledModules().length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">All available modules are enabled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getDisabledModules().map(module => (
                  <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{module.name}</span>
                        <span className="text-xs text-gray-500 ml-2">v{module.version}</span>
                        <p className="text-xs text-gray-400 mt-1">{module.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => enableModule(module.id)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                    >
                      Enable
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Site Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Site Settings</h3>
        </div>
        <div className="p-5">
          <SiteSettings />
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Platform Settings</h3>
          <p className="text-sm text-gray-500 mt-0.5">Configure your platform name and appearance.</p>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Site Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setSavedName(false) }}
                className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Webby Platform"
              />
              <button
                onClick={() => {
                  if (nameInput.trim()) {
                    updateSettings({ siteName: nameInput.trim() })
                    setSavedName(true)
                  }
                }}
                disabled={!nameInput.trim() || nameInput.trim() === settings.siteName}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {savedName ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Shown in the sidebar, homepage, and browser tab.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Theme
            </label>
            <div className="flex gap-3">
              {['light', 'dark'].map(t => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    settings.theme === t
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 'light' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Current: <span className="font-medium text-gray-600 capitalize">{settings.theme}</span> — saved automatically.</p>
          </div>
        </div>
      </div>
    </div>
  )
}