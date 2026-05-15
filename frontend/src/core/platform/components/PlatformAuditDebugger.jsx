import { useMemo, useState, useEffect } from 'react'
import { usePlatformAuditLog, usePlatformReplay, usePlatformCore } from '../'

export function PlatformAuditDebugger() {
  const { auditLog, clearAuditLog } = usePlatformAuditLog()
  const { replayActions } = usePlatformReplay()
  const { currentUserId, currentSiteId } = usePlatformCore()
  const [selectedIndex, setSelectedIndex] = useState(auditLog.length - 1)

  useEffect(() => {
    if (selectedIndex >= auditLog.length) {
      setSelectedIndex(Math.max(0, auditLog.length - 1))
    }
  }, [auditLog.length, selectedIndex])

  const selectedEntry = auditLog[selectedIndex] || null
  const reconstructedState = useMemo(() => {
    if (!auditLog.length || selectedIndex < 0) return null
    return replayActions(auditLog.slice(0, selectedIndex + 1))
  }, [auditLog, selectedIndex, replayActions])

  const handleRangeChange = (event) => {
    setSelectedIndex(Number(event.target.value))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">PlatformCore Audit Debugger</h2>
          <p className="mt-2 text-sm text-gray-600">
            Scrub through the audit log and reconstruct PlatformCore state at each step.
          </p>
        </div>
        <button
          onClick={clearAuditLog}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Clear Audit Log
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Current user</p>
            <p className="text-sm font-medium text-gray-900">{currentUserId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Current site</p>
            <p className="text-sm font-medium text-gray-900">{currentSiteId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Audit entries</p>
            <p className="text-sm font-medium text-gray-900">{auditLog.length}</p>
          </div>
        </div>
      </div>

      {auditLog.length ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Selected Step</p>
                <p className="text-xs text-gray-500">
                  {selectedIndex + 1} of {auditLog.length}
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
              onChange={handleRangeChange}
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
                <p className="text-sm text-gray-900">{selectedEntry?.timestamp || '—'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Selected Action</h3>
              </div>
              <pre className="max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-white">
                {JSON.stringify(selectedEntry?.action || {}, null, 2)}
              </pre>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Action Diff</h3>
              </div>
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
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-700">
            The audit log is empty. Perform actions in the editor or other areas to start recording PlatformCore activity.
          </p>
        </div>
      )}
    </div>
  )
}
