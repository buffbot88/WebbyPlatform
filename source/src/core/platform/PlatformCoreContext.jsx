import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import siteData from '../../data/site.json'
import { CORE_ACTION_TYPES, validatePlatformAction } from './actions'
import { createPluginRuntime, deepFreezeObject, sampleLoggerPlugin } from './PluginRuntime'

const PlatformCoreContext = createContext()

const PLATFORM_AUDIT_LOG_STORAGE_KEY = 'PlatformCoreAuditLog'

function openAuditLogDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('PlatformCoreAuditDB', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('auditLog')) {
        db.createObjectStore('auditLog')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadAuditLogFromIndexedDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null
  }

  const db = await openAuditLogDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('auditLog', 'readonly')
    const store = tx.objectStore('auditLog')
    const request = store.get(PLATFORM_AUDIT_LOG_STORAGE_KEY)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

async function saveAuditLogToIndexedDB(auditLog) {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return
  }

  const db = await openAuditLogDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('auditLog', 'readwrite')
    const store = tx.objectStore('auditLog')
    const request = store.put(auditLog, PLATFORM_AUDIT_LOG_STORAGE_KEY)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function loadAuditLogFromLocalStorage() {
  try {
    const raw = window.localStorage.getItem(PLATFORM_AUDIT_LOG_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveAuditLogToLocalStorage(auditLog) {
  try {
    window.localStorage.setItem(PLATFORM_AUDIT_LOG_STORAGE_KEY, JSON.stringify(auditLog))
  } catch (error) {
    console.warn('[PlatformCore] Failed to save audit log to localStorage:', error)
  }
}

async function loadPersistedAuditLog() {
  try {
    const fromIndexedDB = await loadAuditLogFromIndexedDB()
    if (Array.isArray(fromIndexedDB)) {
      return fromIndexedDB
    }
  } catch (error) {
    console.warn('[PlatformCore] IndexedDB audit log load failed, falling back to localStorage:', error)
  }

  return loadAuditLogFromLocalStorage()
}

async function persistAuditLog(auditLog) {
  saveAuditLogToLocalStorage(auditLog)
  try {
    await saveAuditLogToIndexedDB(auditLog)
  } catch (error) {
    console.warn('[PlatformCore] IndexedDB audit log save failed:', error)
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stateDiff(before, after, path = '') {
  if (before === after) {
    return []
  }

  if (!isPlainObject(before) || !isPlainObject(after)) {
    return [{ path, before, after }]
  }

  const entries = new Set([...Object.keys(before), ...Object.keys(after)])
  return Array.from(entries).flatMap(key => {
    const nextPath = path ? `${path}.${key}` : key
    if (!(key in before)) {
      return [{ path: nextPath, before: undefined, after: after[key] }]
    }
    if (!(key in after)) {
      return [{ path: nextPath, before: before[key], after: undefined }]
    }
    return stateDiff(before[key], after[key], nextPath)
  })
}

function buildStateDiff(beforeState, afterState) {
  return stateDiff(beforeState, afterState)
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

export function replayActions(auditLog = []) {
  const startingState = cloneState(initialState)
  return auditLog.reduce((currentState, entry, index) => {
    const action = entry?.action || entry
    const normalizedAction = {
      ...action,
      timestamp: action?.timestamp || new Date().toISOString()
    }

    const { valid, warnings } = validatePlatformAction(normalizedAction)
    if (!valid) {
      throw new Error(`[PlatformCore] replayActions invalid action at index ${index}: ${warnings.join(' ')}`)
    }

    return platformReducer(currentState, normalizedAction)
  }, startingState)
}

const initialState = {
  currentUserId: 'user-1',
  currentSiteId: siteData?.id || 'site-1',
  users: [
    {
      id: 'user-1',
      name: 'Platform User',
      roleIds: ['admin']
    }
  ],
  workspaces: [
    {
      id: 'workspace-1',
      name: 'Default Workspace',
      ownerId: 'user-1',
      siteIds: [siteData?.id || 'site-1']
    }
  ],
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['site.update', 'page.create', 'theme.change', 'ai.generate']
    }
  ],
  permissions: [
    'site.update',
    'page.create',
    'theme.change',
    'ai.generate'
  ],
  sites: [
    {
      ...siteData,
      ownerId: 'user-1'
    }
  ]
}

function platformReducer(state, action) {
  if (!action || !action.userId || !action.siteId) {
    console.warn('Platform action missing userId or siteId:', action)
    return state
  }

  const siteIndex = state.sites.findIndex(site => site.id === action.siteId)
  if (siteIndex === -1) {
    console.warn('Platform action target site not found:', action.siteId)
    return state
  }

  const site = state.sites[siteIndex]
  let updatedSite

  switch (action.type) {
    case CORE_ACTION_TYPES.SITE_UPDATE:
      updatedSite = { ...site, ...action.payload }
      break
    case CORE_ACTION_TYPES.PAGE_CREATE:
      updatedSite = { ...site, pages: [...(site.pages || []), action.payload] }
      break
    case CORE_ACTION_TYPES.PAGE_REMOVE:
      updatedSite = { ...site, pages: (site.pages || []).filter(page => page.id !== action.payload.pageId) }
      break
    case CORE_ACTION_TYPES.SECTION_ADD:
      updatedSite = {
        ...site,
        pages: (site.pages || []).map(page =>
          page.id === action.payload.pageId
            ? { ...page, sections: [...(page.sections || []), action.payload.section] }
            : page
        )
      }
      break
    case CORE_ACTION_TYPES.SECTION_REMOVE:
      updatedSite = {
        ...site,
        pages: (site.pages || []).map(page =>
          page.id === action.payload.pageId
            ? { ...page, sections: page.sections.filter((_, index) => index !== action.payload.sectionIndex) }
            : page
        )
      }
      break
    case CORE_ACTION_TYPES.THEME_CHANGE:
      updatedSite = { ...site, theme: { ...(site.theme || {}), ...action.payload } }
      break
    case CORE_ACTION_TYPES.PUBLISH_STATE_UPDATE:
      updatedSite = { ...site, publishState: action.payload.publishState }
      break
    case CORE_ACTION_TYPES.MODE_UPDATE:
      updatedSite = { ...site, mode: action.payload.mode }
      break
    case CORE_ACTION_TYPES.EVENT_ADD:
      updatedSite = { ...site, events: [...(site.events || []), action.payload] }
      break
    case CORE_ACTION_TYPES.EVENT_REMOVE:
      updatedSite = { ...site, events: (site.events || []).filter(event => event.id !== action.payload.eventId) }
      break
    case CORE_ACTION_TYPES.AI_GENERATE_LAYOUT:
      updatedSite = {
        ...site,
        pages: (site.pages || []).map(page =>
          page.id === action.payload.pageId
            ? { ...page, sections: [...(page.sections || []), ...(action.payload.sections || [])] }
            : page
        ),
        events: [
          ...(site.events || []),
          {
            id: `ai-${Date.now()}`,
            type: 'ai.generate.layout',
            createdBy: action.userId,
            trace: action.payload.trace || [],
            meta: action.payload.meta || {}
          }
        ]
      }
      break
    case CORE_ACTION_TYPES.MODULE_ENABLE:
      updatedSite = {
        ...site,
        enabledModules: [
          ...(site.enabledModules || []),
          action.payload.moduleId
        ].filter((v, i, a) => a.indexOf(v) === i) // Ensure unique
      }
      break
    case CORE_ACTION_TYPES.MODULE_DISABLE:
      updatedSite = {
        ...site,
        enabledModules: (site.enabledModules || []).filter(id => id !== action.payload.moduleId)
      }
      break
    case CORE_ACTION_TYPES.EVENT_CREATE:
      updatedSite = {
        ...site,
        calendarEvents: [
          ...(site.calendarEvents || []),
          {
            ...action.payload,
            id: action.payload.id || `event-${Date.now()}`,
            createdBy: action.userId,
            createdAt: action.timestamp
          }
        ]
      }
      break
    case CORE_ACTION_TYPES.EVENT_UPDATE:
      updatedSite = {
        ...site,
        calendarEvents: (site.calendarEvents || []).map(event =>
          event.id === action.payload.eventId
            ? { ...event, ...action.payload.updates, updatedAt: action.timestamp }
            : event
        )
      }
      break
    case CORE_ACTION_TYPES.EVENT_DELETE:
      updatedSite = {
        ...site,
        calendarEvents: (site.calendarEvents || []).filter(event => event.id !== action.payload.eventId)
      }
      break
    case '__PLATFORM_CORE_REHYDRATE_STATE__':
      return action.payload || state
    default:
      console.warn('[PlatformCore] Unknown action type:', action?.type)
      return state
  }

  return {
    ...state,
    sites: state.sites.map((current, index) => (index === siteIndex ? updatedSite : current))
  }
}

export function PlatformCoreProvider({ children, blockInvalidActions = true }) {
  const [state, dispatch] = useReducer(platformReducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state
  const auditLogRef = useRef([])
  const pluginRuntimeRef = useRef(createPluginRuntime({ getState: () => stateRef.current }))
  const [, forceRerender] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    const unregister = pluginRuntimeRef.current.registerPlugin(sampleLoggerPlugin)
    pluginRuntimeRef.current.processQueuedActions(dispatchPlatformAction)
    return unregister
  }, [])

  useEffect(() => {
    let isMounted = true
    loadPersistedAuditLog()
      .then((log) => {
        if (!isMounted || !Array.isArray(log) || log.length === 0) {
          return
        }

        auditLogRef.current = log
        const reconstructedState = replayActions(log)
        dispatch({ type: '__PLATFORM_CORE_REHYDRATE_STATE__', payload: reconstructedState })
        forceRerender()
      })
      .catch((error) => {
        console.warn('[PlatformCore] Failed to load persisted audit log:', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const dispatchPlatformAction = (action) => {
    const normalizedAction = {
      ...action,
      timestamp: action?.timestamp || new Date().toISOString()
    }

    const { valid, warnings } = validatePlatformAction(normalizedAction)
    warnings.forEach(warning => console.warn('[PlatformCore] Action validation warning:', warning, normalizedAction))

    if (!valid) {
      const message = `[PlatformCore] Blocked invalid action: ${warnings.join(' ')}`
      if (blockInvalidActions) {
        throw new Error(message)
      }
      return
    }

    const beforeState = state
    const afterState = platformReducer(state, normalizedAction)
    const diff = buildStateDiff(beforeState, afterState)
    const auditEntry = {
      action: normalizedAction,
      type: normalizedAction.type,
      userId: normalizedAction.userId,
      siteId: normalizedAction.siteId,
      timestamp: normalizedAction.timestamp,
      diff
    }
    auditLogRef.current = [...auditLogRef.current, auditEntry]
    persistAuditLog(auditLogRef.current).catch((error) => {
      console.warn('[PlatformCore] Failed to persist audit log:', error)
    })

    dispatch(normalizedAction)

    pluginRuntimeRef.current.runPluginsForAction({
      action: deepFreezeObject(cloneState(normalizedAction)),
      prevState: deepFreezeObject(cloneState(beforeState)),
      nextState: deepFreezeObject(cloneState(afterState)),
      auditEntry: deepFreezeObject(cloneState(auditEntry)),
      platformDispatch: dispatchPlatformAction
    })
  }

  const getAuditLog = () => [...auditLogRef.current]
  const clearAuditLog = () => {
    auditLogRef.current = []
    saveAuditLogToLocalStorage([])
    persistAuditLog([]).catch((error) => {
      console.warn('[PlatformCore] Failed to persist cleared audit log:', error)
    })
    forceRerender()
  }

  const importAuditLog = (log) => {
    if (!Array.isArray(log) || log.length === 0) {
      throw new Error('Imported log must be a non-empty array.')
    }

    const reconstructedState = replayActions(log)
    auditLogRef.current = log
    dispatch({ type: '__PLATFORM_CORE_REHYDRATE_STATE__', payload: reconstructedState })
    persistAuditLog(log).catch((error) => {
      console.warn('[PlatformCore] Failed to persist imported audit log:', error)
    })
    forceRerender()
  }

  const value = {
    ...deepFreezeObject(cloneState(state)),
    dispatchPlatformAction,
    auditLog: auditLogRef.current,
    getAuditLog,
    clearAuditLog,
    importAuditLog,
    registerPlugin: pluginRuntimeRef.current.registerPlugin,
    getRegisteredPlugins: pluginRuntimeRef.current.getRegisteredPlugins
  }

  return <PlatformCoreContext.Provider value={value}>{children}</PlatformCoreContext.Provider>
}

export function usePlatformCore() {
  const context = useContext(PlatformCoreContext)
  if (!context) {
    throw new Error('usePlatformCore must be used within PlatformCoreProvider')
  }
  return context
}

export function usePlatformAuditLog() {
  const { auditLog, getAuditLog, clearAuditLog, importAuditLog } = usePlatformCore()
  return {
    auditLog,
    getAuditLog,
    clearAuditLog,
    importAuditLog
  }
}

export function usePlatformReplay() {
  return {
    replayActions
  }
}
