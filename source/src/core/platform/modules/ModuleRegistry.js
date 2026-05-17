/**
 * Module Registry - Central registry for platform modules
 * 
 * Manages module registration, enabled/disabled state, and module discovery.
 * Modules must be registered through this registry to participate in the platform.
 */

// Store for registered modules
const registeredModules = new Map()

// Store for module enabled state (per site)
const moduleState = new Map()

/**
 * Module interface definition
 * @typedef {Object} PlatformModule
 * @property {string} id - Unique module identifier
 * @property {string} name - Human-readable module name
 * @property {string} version - Semantic version
 * @property {Function} [onInit] - Called when module is registered
 * @property {Function} [onEnable] - Called when module is enabled
 * @property {Function} [onDisable] - Called when module is disabled
 * @property {Array<Object>} [dashboardPanels] - Dashboard panel contributions
 * @property {Array<Object>} [adminSettings] - Admin settings contributions
 * @property {Array<Object>} [routes] - Route contributions
 * @property {Array<Object>} [widgets] - Widget contributions
 * @property {Object} [actions] - Module-specific action creators
 */

/**
 * Register a new module with the platform
 * @param {PlatformModule} module - The module to register
 * @returns {Function} Unregister function
 * @throws {Error} If module ID is already registered or module is invalid
 */
export function registerModule(module) {
  if (!module || typeof module !== 'object') {
    throw new Error('[ModuleRegistry] Module must be a non-null object')
  }

  if (!module.id || typeof module.id !== 'string') {
    throw new Error('[ModuleRegistry] Module must have a unique string ID')
  }

  if (!module.name || typeof module.name !== 'string') {
    throw new Error('[ModuleRegistry] Module must have a name string')
  }

  if (registeredModules.has(module.id)) {
    throw new Error(`[ModuleRegistry] Module with ID '${module.id}' is already registered`)
  }

  // Store the module
  const moduleEntry = {
    ...module,
    registeredAt: new Date().toISOString(),
    enabled: false // Modules start disabled by default
  }

  registeredModules.set(module.id, moduleEntry)

  // Initialize module state for all existing sites
  const siteIds = Array.from(moduleState.keys())
  siteIds.forEach(siteId => {
    if (!moduleState.get(siteId)) {
      moduleState.set(siteId, {})
    }
    moduleState.get(siteId)[module.id] = false
  })

  // Call module init hook if present
  if (typeof module.onInit === 'function') {
    try {
      module.onInit({
        moduleId: module.id,
        registerModule,
        unregisterModule,
        isModuleEnabled,
        getModuleState
      })
    } catch (error) {
      console.warn(`[ModuleRegistry] Error during onInit for module '${module.id}':`, error)
    }
  }

  console.log(`[ModuleRegistry] Module registered: ${module.id} v${module.version || '1.0.0'}`)

  // Return unregister function
  return () => unregisterModule(module.id)
}

/**
 * Unregister a module from the platform
 * @param {string} moduleId - The ID of the module to unregister
 * @returns {boolean} True if module was unregistered, false if not found
 */
export function unregisterModule(moduleId) {
  if (!registeredModules.has(moduleId)) {
    return false
  }

  const module = registeredModules.get(moduleId)

  // Disable module first if it's enabled
  if (module.enabled) {
    disableModule(moduleId)
  }

  // Call module cleanup if present
  if (typeof module.onCleanup === 'function') {
    try {
      module.onCleanup()
    } catch (error) {
      console.warn(`[ModuleRegistry] Error during onCleanup for module '${moduleId}':`, error)
    }
  }

  // Remove from registry
  registeredModules.delete(moduleId)

  // Remove from all site states
  moduleState.forEach((siteModules) => {
    delete siteModules[moduleId]
  })

  console.log(`[ModuleRegistry] Module unregistered: ${moduleId}`)
  return true
}

/**
 * Enable a module for a specific site
 * @param {string} moduleId - The ID of the module to enable
 * @param {string} siteId - The ID of the site to enable the module for
 * @returns {boolean} True if module was enabled, false if already enabled or not found
 */
export function enableModule(moduleId, siteId) {
  if (!registeredModules.has(moduleId)) {
    console.warn(`[ModuleRegistry] Cannot enable unknown module: ${moduleId}`)
    return false
  }

  // Initialize site state if needed
  if (!moduleState.has(siteId)) {
    moduleState.set(siteId, {})
  }

  const siteModules = moduleState.get(siteId)

  if (siteModules[moduleId]) {
    return false // Already enabled
  }

  const module = registeredModules.get(moduleId)

  // Call onEnable hook if present
  if (typeof module.onEnable === 'function') {
    try {
      module.onEnable({
        siteId,
        moduleId,
        getState: () => getModuleState(moduleId, siteId),
        setState: (state) => setModuleState(moduleId, siteId, state)
      })
    } catch (error) {
      console.warn(`[ModuleRegistry] Error during onEnable for module '${moduleId}':`, error)
      return false
    }
  }

  // Update module state
  siteModules[moduleId] = true
  module.enabled = true

  console.log(`[ModuleRegistry] Module enabled: ${moduleId} for site ${siteId}`)
  return true
}

/**
 * Disable a module for a specific site
 * @param {string} moduleId - The ID of the module to disable
 * @param {string} siteId - The ID of the site to disable the module for
 * @returns {boolean} True if module was disabled, false if already disabled or not found
 */
export function disableModule(moduleId, siteId) {
  if (!registeredModules.has(moduleId)) {
    console.warn(`[ModuleRegistry] Cannot disable unknown module: ${moduleId}`)
    return false
  }

  const siteModules = moduleState.get(siteId)
  if (!siteModules || !siteModules[moduleId]) {
    return false // Already disabled or no state for site
  }

  const module = registeredModules.get(moduleId)

  // Call onDisable hook if present
  if (typeof module.onDisable === 'function') {
    try {
      module.onDisable({
        siteId,
        moduleId,
        getState: () => getModuleState(moduleId, siteId)
      })
    } catch (error) {
      console.warn(`[ModuleRegistry] Error during onDisable for module '${moduleId}':`, error)
    }
  }

  // Update module state
  siteModules[moduleId] = false
  module.enabled = false

  console.log(`[ModuleRegistry] Module disabled: ${moduleId} for site ${siteId}`)
  return true
}

/**
 * Check if a module is enabled for a specific site
 * @param {string} moduleId - The ID of the module to check
 * @param {string} siteId - The ID of the site to check for
 * @returns {boolean} True if module is enabled for the site
 */
export function isModuleEnabled(moduleId, siteId) {
  if (!registeredModules.has(moduleId)) {
    return false
  }

  const siteModules = moduleState.get(siteId)
  if (!siteModules) {
    return false
  }

  return siteModules[moduleId] === true
}

/**
 * Get a registered module by ID
 * @param {string} moduleId - The ID of the module to get
 * @returns {PlatformModule|undefined} The module or undefined if not found
 */
export function getModule(moduleId) {
  return registeredModules.get(moduleId)
}

/**
 * Get all registered modules
 * @returns {Array<PlatformModule>} Array of all registered modules
 */
export function getAllModules() {
  return Array.from(registeredModules.values())
}

/**
 * Get enabled modules for a specific site
 * @param {string} siteId - The ID of the site
 * @returns {Array<PlatformModule>} Array of enabled modules for the site
 */
export function getEnabledModules(siteId) {
  const enabled = []
  registeredModules.forEach((module, moduleId) => {
    if (isModuleEnabled(moduleId, siteId)) {
      enabled.push(module)
    }
  })
  return enabled
}

/**
 * Get disabled modules for a specific site
 * @param {string} siteId - The ID of the site
 * @returns {Array<PlatformModule>} Array of disabled modules for the site
 */
export function getDisabledModules(siteId) {
  const disabled = []
  registeredModules.forEach((module, moduleId) => {
    if (!isModuleEnabled(moduleId, siteId)) {
      disabled.push(module)
    }
  })
  return disabled
}

/**
 * Get module-specific state
 * @param {string} moduleId - The ID of the module
 * @param {string} siteId - The ID of the site
 * @returns {Object} The module state or empty object if not found
 */
export function getModuleState(moduleId, siteId) {
  const siteModules = moduleState.get(siteId)
  if (!siteModules || !siteModules[moduleId]) {
    return {}
  }
  // Return a copy to prevent direct mutation
  return { ...siteModules[moduleId] }
}

/**
 * Set module-specific state
 * @param {string} moduleId - The ID of the module
 * @param {string} siteId - The ID of the site
 * @param {Object} state - The state to set
 */
export function setModuleState(moduleId, siteId, state) {
  if (!moduleState.has(siteId)) {
    moduleState.set(siteId, {})
  }
  const siteModules = moduleState.get(siteId)
  siteModules[moduleId] = { ...state }
}

/**
 * Get all dashboard panels from enabled modules for a site
 * @param {string} siteId - The ID of the site
 * @returns {Array<Object>} Array of dashboard panel contributions
 */
export function getDashboardPanels(siteId) {
  const panels = []
  registeredModules.forEach((module, moduleId) => {
    if (isModuleEnabled(moduleId, siteId) && Array.isArray(module.dashboardPanels)) {
      module.dashboardPanels.forEach(panel => {
        panels.push({
          ...panel,
          moduleId: module.id
        })
      })
    }
  })
  return panels
}

/**
 * Get all admin settings from enabled modules for a site
 * @param {string} siteId - The ID of the site
 * @returns {Array<Object>} Array of admin settings contributions
 */
export function getAdminSettings(siteId) {
  const settings = []
  registeredModules.forEach((module, moduleId) => {
    if (isModuleEnabled(moduleId, siteId) && Array.isArray(module.adminSettings)) {
      module.adminSettings.forEach(setting => {
        settings.push({
          ...setting,
          moduleId: module.id
        })
      })
    }
  })
  return settings
}

/**
 * Get all routes from enabled modules for a site
 * @param {string} siteId - The ID of the site
 * @returns {Array<Object>} Array of route contributions
 */
export function getModuleRoutes(siteId) {
  const routes = []
  registeredModules.forEach((module, moduleId) => {
    if (isModuleEnabled(moduleId, siteId) && Array.isArray(module.routes)) {
      module.routes.forEach(route => {
        routes.push({
          ...route,
          moduleId: module.id
        })
      })
    }
  })
  return routes
}

/**
 * Initialize module state for a new site
 * @param {string} siteId - The ID of the site
 */
export function initializeSiteModules(siteId) {
  if (moduleState.has(siteId)) {
    return
  }

  const siteModuleState = {}
  registeredModules.forEach((module, moduleId) => {
    siteModuleState[moduleId] = false // All modules start disabled for new sites
  })

  moduleState.set(siteId, siteModuleState)
}

/**
 * Get the module state map (for persistence/replay)
 * @returns {Map<string, Object>} Map of siteId to module state
 */
export function getModuleStateMap() {
  return new Map(moduleState)
}

/**
 * Set the module state map (for replay)
 * @param {Map<string, Object>} stateMap - Map of siteId to module state
 */
export function setModuleStateMap(stateMap) {
  moduleState.clear()
  if (stateMap instanceof Map) {
    stateMap.forEach((value, key) => {
      moduleState.set(key, { ...value })
    })
  }
}

/**
 * Clear all module state (for testing)
 */
export function clearModuleRegistry() {
  registeredModules.clear()
  moduleState.clear()
}