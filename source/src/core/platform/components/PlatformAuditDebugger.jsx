import { useMemo, useState, useEffect, useRef } from 'react'
import { usePlatformAuditLog, usePlatformReplay, usePlatformCore } from '../'

const MODULE_ACTION_TYPES = ['MODULE_ENABLE', 'MODULE_DISABLE']

function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return ts
  return d.toLocaleString('default', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatTimestampShort(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return ts
  return d.toLocaleString('default', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// ─── Export helper ────────────────────────────────────────────────────────

function exportAuditLog(auditLog) {
  const data = JSON.stringify(auditLog, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Module Activity Tab ──────────────────────────────────────────────────

function ModuleActivityTrail({ auditLog }) {
  const moduleEvents = useMemo(() => {
    return auditLog
      .map((entry, index) => ({ ...entry, globalIndex: index }))
      .filter(entry => MODULE_ACTION_TYPES.includes(entry.type))
      .reverse()
  }, [auditLog])

  if (moduleEvents.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm font-medium text-gray-700">No module activity recorded yet.</p>
        <p className="text-xs text-gray-500 mt-1">Enable or disable modules from the Dashboard to see the trail here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {moduleEvents.length} module event{moduleEvents.length !== 1 ? 's' : ''} recorded
      </p>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-3">
          {moduleEvents.map((entry, i) => {
            const isEnable = entry.type === 'MODULE_ENABLE'
            const moduleId = entry.action?.payload?.moduleId || '—'
            return (
              <div key={i} className="relative flex gap-4">
                <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 ${
                  isEnable ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}>
                  {isEnable ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isEnable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isEnable ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{moduleId}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span><span className="font-medium text-gray-600">User:</span> {entry.userId || '—'}</span>
                        <span><span className="font-medium text-gray-600">Site:</span> {entry.siteId || '—'}</span>
                        <span><span className="font-medium text-gray-600">Log entry:</span> #{entry.globalIndex + 1}</span>
                      </div>
                    </div>
                    <time className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </time>
                  </div>
                  {entry.diff && entry.diff.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                        Show state diff ({entry.diff.length} change{entry.diff.length !== 1 ? 's' : ''})
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-xs text-white">
                        {JSON.stringify(entry.diff, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── State Replay Tab ─────────────────────────────────────────────────────

function StateReplayPanel({ auditLog }) {
  const { replayActions } = usePlatformReplay()
  const [selectedIndex, setSelectedIndex] = useState(auditLog.length - 1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    if (selectedIndex >= auditLog.length) {
      setSelectedIndex(Math.max(0, auditLog.length - 1))
    }
  }, [auditLog.length, selectedIndex])

  const actionTypes = useMemo(() => {
    const types = new Set(auditLog.map(e => e.type).filter(Boolean))
    return ['ALL', ...Array.from(types).sort()]
  }, [auditLog])

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase()
    return auditLog
      .map((entry, index) => ({ ...entry, originalIndex: index }))
      .filter(entry => {
        const matchesType = typeFilter === 'ALL' || entry.type === typeFilter
        if (!matchesType) return false
        if (!term) return true
        return (
          entry.type?.toLowerCase().includes(term) ||
          entry.userId?.toLowerCase().includes(term) ||
          entry.siteId?.toLowerCase().includes(term) ||
          JSON.stringify(entry.action?.payload || {}).toLowerCase().includes(term)
        )
      })
  }, [auditLog, search, typeFilter])

  const selectedEntry = auditLog[selectedIndex] || null
  const reconstructedState = useMemo(() => {
    if (!auditLog.length || selectedIndex < 0) return null
    return replayActions(auditLog.slice(0, selectedIndex + 1))
  }, [auditLog, selectedIndex, replayActions])

  const isFiltering = search.trim() !== '' || typeFilter !== 'ALL'

  if (!auditLog.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">
          The audit log is empty. Perform actions in the editor or other areas to start recording, or import a previously exported log file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by type, user, site, or payload…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {actionTypes.map(type => (
            <option key={type} value={type}>{type === 'ALL' ? 'All action types' : type}</option>
          ))}
        </select>
        {isFiltering && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('ALL') }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {isFiltering && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''}
            </span>
            {filteredEntries.length > 0 && (
              <span className="text-xs text-gray-400">Click an entry to inspect it</span>
            )}
          </div>
          {filteredEntries.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No entries match your search.</div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {filteredEntries.map(entry => (
                <li key={entry.originalIndex}>
                  <button
                    onClick={() => setSelectedIndex(entry.originalIndex)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      selectedIndex === entry.originalIndex ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span className="flex-shrink-0 w-6 text-xs text-gray-400 text-right">#{entry.originalIndex + 1}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 flex-shrink-0">{entry.type}</span>
                    <span className="text-xs text-gray-500 truncate flex-1">{entry.userId} · {entry.siteId}</span>
                    <time className="flex-shrink-0 text-xs text-gray-400">{formatTimestampShort(entry.timestamp)}</time>
                    {selectedIndex === entry.originalIndex && (
                      <svg className="flex-shrink-0 w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Selected Step</p>
            <p className="text-xs text-gray-500">
              {selectedIndex + 1} of {auditLog.length}
              {isFiltering && filteredEntries.length > 0 && (
                <span className="ml-1 text-indigo-500">
                  · {filteredEntries.findIndex(e => e.originalIndex === selectedIndex) !== -1
                    ? `match ${filteredEntries.findIndex(e => e.originalIndex === selectedIndex) + 1} of ${filteredEntries.length}`
                    : 'not in results'}
                </span>
              )}
            </p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {selectedEntry?.type || 'No action'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={auditLog.length - 1}
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          className="mt-4 w-full"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">User ID</p>
            <p className="text-sm text-gray-900">{selectedEntry?.userId || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Site ID</p>
            <p className="text-sm text-gray-900">{selectedEntry?.siteId || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Timestamp</p>
            <p className="text-sm text-gray-900">{formatTimestamp(selectedEntry?.timestamp)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Selected Action</h3>
          <pre className="max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-white">
            {JSON.stringify(selectedEntry?.action || {}, null, 2)}
          </pre>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Action Diff</h3>
          <pre className="max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-white">
            {JSON.stringify(selectedEntry?.diff || [], null, 2)}
          </pre>
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Reconstructed PlatformCore State</h3>
          <span className="text-sm text-gray-500">Step {selectedIndex + 1}</span>
        </div>
        <pre className="max-h-[32rem] overflow-auto rounded bg-slate-950 p-3 text-xs text-white">
          {JSON.stringify(reconstructedState, null, 2)}
        </pre>
      </section>
    </div>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'module-activity', label: 'Module Activity' },
  { id: 'state-replay', label: 'State Replay' }
]

export function PlatformAuditDebugger() {
  const { auditLog, clearAuditLog, importAuditLog } = usePlatformAuditLog()
  const { currentUserId, currentSiteId } = usePlatformCore()
  const [activeTab, setActiveTab] = useState('module-activity')
  const [importStatus, setImportStatus] = useState(null) // null | 'loading' | { ok, message }
  const fileInputRef = useRef(null)

  const moduleEventCount = useMemo(
    () => auditLog.filter(e => MODULE_ACTION_TYPES.includes(e.type)).length,
    [auditLog]
  )

  useEffect(() => {
    if (importStatus && importStatus !== 'loading') {
      const t = setTimeout(() => setImportStatus(null), 5000)
      return () => clearTimeout(t)
    }
  }, [importStatus])

  const handleImportClick = () => {
    setImportStatus(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportStatus({ ok: false, message: 'Please select a valid JSON file.' })
      return
    }

    setImportStatus('loading')
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)

        if (!Array.isArray(parsed)) {
          setImportStatus({ ok: false, message: 'Invalid format: expected a JSON array of audit log entries.' })
          return
        }
        if (parsed.length === 0) {
          setImportStatus({ ok: false, message: 'The file contains an empty audit log — nothing to replay.' })
          return
        }

        const missingFields = parsed.some(entry => !entry.type || !entry.userId || !entry.siteId)
        if (missingFields) {
          setImportStatus({ ok: false, message: 'Some entries are missing required fields (type, userId, siteId).' })
          return
        }

        importAuditLog(parsed)
        setImportStatus({ ok: true, message: `Imported and replayed ${parsed.length} audit log entr${parsed.length === 1 ? 'y' : 'ies'} successfully.` })
        setActiveTab('state-replay')
      } catch {
        setImportStatus({ ok: false, message: 'Failed to parse the file. Make sure it is valid JSON.' })
      }
    }

    reader.onerror = () => {
      setImportStatus({ ok: false, message: 'Could not read the file. Please try again.' })
    }

    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Audit Log</h2>
          <p className="mt-1 text-sm text-gray-600">
            Track platform activity and replay state at any point in history.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={handleImportClick}
            disabled={importStatus === 'loading'}
            className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importStatus === 'loading' ? (
              <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {importStatus === 'loading' ? 'Replaying…' : 'Import & Replay'}
          </button>
          <button
            onClick={() => exportAuditLog(auditLog)}
            disabled={auditLog.length === 0}
            className="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </button>
          <button
            onClick={clearAuditLog}
            className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>

      {importStatus && importStatus !== 'loading' && (
        <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
          importStatus.ok
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {importStatus.ok ? (
            <svg className="w-5 h-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{importStatus.message}</span>
          <button onClick={() => setImportStatus(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Current user</p>
            <p className="text-sm font-medium text-gray-900">{currentUserId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Current site</p>
            <p className="text-sm font-medium text-gray-900">{currentSiteId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Total entries</p>
            <p className="text-sm font-medium text-gray-900">{auditLog.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Module events</p>
            <p className="text-sm font-medium text-gray-900">{moduleEventCount}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'module-activity' && moduleEventCount > 0 && (
                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {moduleEventCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'module-activity' && <ModuleActivityTrail auditLog={auditLog} />}
      {activeTab === 'state-replay' && <StateReplayPanel auditLog={auditLog} />}
    </div>
  )
}
