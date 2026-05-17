// Main exports for the module system

// Context and Provider
export {
  ModuleProvider,
  useModules,
  useModuleEnabled,
  useModule,
  useDashboardPanels,
  useModuleAdminSettings,
  useModuleRoutes
} from './ModuleContext'

// Registry functions
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
} from './ModuleRegistry'