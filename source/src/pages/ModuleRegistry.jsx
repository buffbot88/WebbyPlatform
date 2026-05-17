import { useModules } from '../core/platform/modules'

const MODULE_ICONS = {
  'events-calendar': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

const DEFAULT_ICON = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
)

function ModuleCard({ module, enabled, onEnable, onDisable }) {
  const icon = MODULE_ICONS[module.id] || DEFAULT_ICON
  const panels = module.dashboardPanels || []
  const routes = module.routes || []
  const widgets = module.widgets || []

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all ${
      enabled ? 'border-indigo-200' : 'border-gray-200'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{module.name || module.id}</h3>
                <span className="text-xs text-gray-400 font-mono">v{module.version || '—'}</span>
                {enabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {module.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => enabled ? onDisable(module.id) : onEnable(module.id)}
            className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              enabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {(panels.length > 0 || routes.length > 0 || widgets.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            {panels.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                </svg>
                {panels.length} dashboard panel{panels.length !== 1 ? 's' : ''}
              </span>
            )}
            {routes.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                </svg>
                {routes.length} route{routes.length !== 1 ? 's' : ''}
              </span>
            )}
            {widgets.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                </svg>
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ModuleRegistryPage() {
  const { getAllModules, getEnabledModules, enableModule, disableModule } = useModules()

  const allModules = getAllModules()
  const enabledModules = getEnabledModules()
  const enabledIds = new Set(enabledModules.map(m => m.id))

  const activeCount = enabledModules.length
  const totalCount = allModules.length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Module Registry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enable or disable feature modules for your platform.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-bold text-gray-900">{activeCount}<span className="text-gray-400 font-normal text-base">/{totalCount}</span></p>
          <p className="text-xs text-gray-500">modules active</p>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Registered</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-green-700">{activeCount}</p>
            <p className="text-xs text-green-600 mt-0.5">Enabled</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-gray-500">{totalCount - activeCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Disabled</p>
          </div>
        </div>
      )}

      {allModules.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            {DEFAULT_ICON}
          </div>
          <p className="font-medium text-gray-700">No modules registered</p>
          <p className="text-sm text-gray-500 mt-1">Modules registered with the platform will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              enabled={enabledIds.has(module.id)}
              onEnable={enableModule}
              onDisable={disableModule}
            />
          ))}
        </div>
      )}
    </div>
  )
}
