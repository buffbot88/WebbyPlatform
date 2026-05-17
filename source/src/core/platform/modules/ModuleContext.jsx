import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { PlatformCoreProvider, usePlatformCore } from '../PlatformCoreContext'
import { CORE_ACTION_TYPES, createPlatformAction } from '../actions'
import {
  registerModule,
  unregisterModule,
  enableModule,
  disableModule,
  isModuleEnabled,
  getModule,
  getAllModules,
  getEnabledModules,
  getDisabledModules,
  getDashboardPanels,
  getAdminSettings,
  getModuleRoutes,
  initializeSiteModules,
  getModuleStateMap,
  setModuleStateMap,
  clearModuleRegistry
} from './ModuleRegistry'

// Context
const ModuleContext = createContext()

// Internal state for triggering re-renders when module state changes
let moduleStateVersion = 0
const moduleStateListeners = new Set()

function notifyModuleStateChange() {
  moduleStateVersion++
  moduleStateListeners.forEach(listener => listener(moduleStateVersion))
}

// Initial state
const initialState = {
  modules: [],
  enabledModules: [],
  disabledModules: [],
  dashboardPanels: [],
  adminSettings: [],
  moduleRoutes: [],
  loading: true
}

function moduleReducer(state, action) {
  switch (action.type) {
    case 'MODULE_STATE_UPDATED':
      return {
        ...state,
        modules: action.payload.modules,
        enabledModules: action.payload.enabledModules,
        disabledModules: action.payload.disabledModules,
        dashboardPanels: action.payload.dashboardPanels,
        adminSettings: action.payload.adminSettings,
        moduleRoutes: action.payload.moduleRoutes,
        loading: false
      }
    case 'MODULE_REGISTERED':
      return {
        ...state,
        modules: getAllModules(),
        enabledModules: getEnabledModules(action.payload.siteId),
        disabledModules: getDisabledModules(action.payload.siteId),
        dashboardPanels: getDashboardPanels(action.payload.siteId),
        adminSettings: getAdminSettings(action.payload.siteId),
        moduleRoutes: getModuleRoutes(action.payload.siteId)
      }
    case 'MODULE_UNREGISTERED':
      return {
        ...state,
        modules: getAllModules(),
        enabledModules: getEnabledModules(action.payload.siteId),
        disabledModules: getDisabledModules(action.payload.siteId),
        dashboardPanels: getDashboardPanels(action.payload.siteId),
        adminSettings: getAdminSettings(action.payload.siteId),
        moduleRoutes: getModuleRoutes(action.payload.siteId)
      }
    case 'MODULE_ENABLED':
      return {
        ...state,
        enabledModules: getEnabledModules(action.payload.siteId),
        disabledModules: getDisabledModules(action.payload.siteId),
        dashboardPanels: getDashboardPanels(action.payload.siteId),
        adminSettings: getAdminSettings(action.payload.siteId),
        moduleRoutes: getModuleRoutes(action.payload.siteId)
      }
    case 'MODULE_DISABLED':
      return {
        ...state,
        enabledModules: getEnabledModules(action.payload.siteId),
        disabledModules: getDisabledModules(action.payload.siteId),
        dashboardPanels: getDashboardPanels(action.payload.siteId),
        adminSettings: getAdminSettings(action.payload.siteId),
        moduleRoutes: getModuleRoutes(action.payload.siteId)
      }
    default:
      return state
  }
}

function ModuleBridge({ children }) {
  const { currentSiteId, currentUserId, dispatchPlatformAction, sites } = usePlatformCore()
  const [state, dispatch] = useReducer(moduleReducer, initialState)
  const site = sites?.find(s => s.id === currentSiteId)

  // Update module state when site changes
  const updateModuleState = useCallback(() => {
    if (!currentSiteId) return

    dispatch({
      type: 'MODULE_STATE_UPDATED',
      payload: {
        modules: getAllModules(),
        enabledModules: getEnabledModules(currentSiteId),
        disabledModules: getDisabledModules(currentSiteId),
        dashboardPanels: getDashboardPanels(currentSiteId),
        adminSettings: getAdminSettings(currentSiteId),
        moduleRoutes: getModuleRoutes(currentSiteId)
      }
    })
  }, [currentSiteId])

  // Initialize module state for new sites
  useEffect(() => {
    if (currentSiteId) {
      initializeSiteModules(currentSiteId)
      updateModuleState()
    }
  }, [currentSiteId, updateModuleState])

  // Listen for module state changes
  useEffect(() => {
    const listener = () => updateModuleState()
    moduleStateListeners.add(listener)
    return () => {
      moduleStateListeners.delete(listener)
    }
  }, [updateModuleState])

  // Actions that flow through PlatformCore for audit logging
  const actions = {
    registerModule: useCallback((module) => {
      const unregister = registerModule(module)
      dispatch({ type: 'MODULE_REGISTERED', payload: { siteId: currentSiteId } })
      notifyModuleStateChange()
      return unregister
    }, [currentSiteId]),

    unregisterModule: useCallback((moduleId) => {
      const result = unregisterModule(moduleId)
      if (result) {
        dispatch({ type: 'MODULE_UNREGISTERED', payload: { siteId: currentSiteId } })
        notifyModuleStateChange()
      }
      return result
    }, [currentSiteId]),

    enableModule: useCallback((moduleId) => {
      if (!currentSiteId || !currentUserId) return false

      // Dispatch action through PlatformCore for audit logging
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.MODULE_ENABLE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { moduleId }
        })
      )

      // Update module registry state
      const result = enableModule(moduleId, currentSiteId)
      if (result) {
        dispatch({ type: 'MODULE_ENABLED', payload: { siteId: currentSiteId } })
        notifyModuleStateChange()
      }
      return result
    }, [currentSiteId, currentUserId, dispatchPlatformAction]),

    disableModule: useCallback((moduleId) => {
      if (!currentSiteId || !currentUserId) return false

      // Dispatch action through PlatformCore for audit logging
      dispatchPlatformAction(
        createPlatformAction({
          type: CORE_ACTION_TYPES.MODULE_DISABLE,
          userId: currentUserId,
          siteId: currentSiteId,
          payload: { moduleId }
        })
      )

      // Update module registry state
      const result = disableModule(moduleId, currentSiteId)
      if (result) {
        dispatch({ type: 'MODULE_DISABLED', payload: { siteId: currentSiteId } })
        notifyModuleStateChange()
      }
      return result
    }, [currentSiteId, currentUserId, dispatchPlatformAction]),

    isModuleEnabled: useCallback((moduleId) => {
      return isModuleEnabled(moduleId, currentSiteId)
    }, [currentSiteId]),

    getModule: useCallback((moduleId) => {
      return getModule(moduleId)
    }, []),

    getAllModules: useCallback(() => {
      return getAllModules()
    }, []),

    getEnabledModules: useCallback(() => {
      return getEnabledModules(currentSiteId)
    }, [currentSiteId]),

    getDisabledModules: useCallback(() => {
      return getDisabledModules(currentSiteId)
    }, [currentSiteId]),

    getDashboardPanels: useCallback(() => {
      return getDashboardPanels(currentSiteId)
    }, [currentSiteId]),

    getAdminSettings: useCallback(() => {
      return getAdminSettings(currentSiteId)
    }, [currentSiteId]),

    getModuleRoutes: useCallback(() => {
      return getModuleRoutes(currentSiteId)
    }, [currentSiteId]),

    // Internal functions for persistence/replay
    getModuleStateMap: useCallback(() => {
      return getModuleStateMap()
    }, []),

    setModuleStateMap: useCallback((stateMap) => {
      setModuleStateMap(stateMap)
      updateModuleState()
      notifyModuleStateChange()
    }, [updateModuleState]),

    clearModuleRegistry: useCallback(() => {
      clearModuleRegistry()
      updateModuleState()
      notifyModuleStateChange()
    }, [updateModuleState])
  }

  const value = {
    ...state,
    currentSiteId,
    ...actions
  }

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
}

// Bridge-only provider — use this when a PlatformCoreProvider is already in the tree
export function ModuleBridgeProvider({ children }) {
  return <ModuleBridge>{children}</ModuleBridge>
}

// Standalone provider (includes its own PlatformCoreProvider)
// Provider component
export function ModuleProvider({ children }) {
  return (
    <PlatformCoreProvider>
      <ModuleBridge>{children}</ModuleBridge>
    </PlatformCoreProvider>
  )
}

// Hook to use module context
export function useModules() {
  const context = useContext(ModuleContext)
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider')
  }
  return context
}

// Hook to check if a specific module is enabled
export function useModuleEnabled(moduleId) {
  const { isModuleEnabled } = useModules()
  return isModuleEnabled(moduleId)
}

// Hook to get a specific module's contributions
export function useModule(moduleId) {
  const { getModule, isModuleEnabled } = useModules()
  const module = getModule(moduleId)
  const enabled = isModuleEnabled(moduleId)

  return {
    module,
    enabled,
    dashboardPanels: enabled && module?.dashboardPanels ? module.dashboardPanels : [],
    adminSettings: enabled && module?.adminSettings ? module.adminSettings : [],
    routes: enabled && module?.routes ? module.routes : [],
    widgets: enabled && module?.widgets ? module.widgets : []
  }
}

// Hook to get all dashboard panels from enabled modules
export function useDashboardPanels() {
  const { dashboardPanels } = useModules()
  return dashboardPanels
}

// Hook to get all admin settings from enabled modules
export function useModuleAdminSettings() {
  const { adminSettings } = useModules()
  return adminSettings
}

// Hook to get all routes from enabled modules
export function useModuleRoutes() {
  const { moduleRoutes } = useModules()
  return moduleRoutes
}

// Export registry functions for direct access (use sparingly)
export {
  registerModule,
  unregisterModule,
  enableModule,
  disableModule,
  isModuleEnabled,
  getModule,
  getAllModules,
  getEnabledModules,
  getDisabledModules,
  getDashboardPanels,
  getAdminSettings,
  getModuleRoutes,
  initializeSiteModules,
  getModuleStateMap,
  setModuleStateMap,
  clearModuleRegistry
}