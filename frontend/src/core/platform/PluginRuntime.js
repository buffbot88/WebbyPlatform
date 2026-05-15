import { CORE_ACTION_TYPES } from './actions'

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function deepFreezeObject(target, seen = new WeakSet()) {
  if (!isPlainObject(target) && !Array.isArray(target)) {
    return target
  }
  if (seen.has(target)) {
    return target
  }
  seen.add(target)

  const entries = Array.isArray(target) ? target : Object.keys(target)
  entries.forEach((key) => {
    const value = target[key]
    if (isPlainObject(value) || Array.isArray(value)) {
      deepFreezeObject(value, seen)
    }
  })

  return Object.freeze(target)
}

function isPlugin(plugin) {
  return plugin && typeof plugin.name === 'string'
}

export function createPluginRuntime({ getState }) {
  const plugins = []
  const actionQueue = []
  let processing = false
  let depth = 0
  const MAX_DEPTH = 3

  const enqueuePluginAction = (action, pluginId) => {
    actionQueue.push({ action, pluginId })
  }

  const createPluginApi = (pluginId) => {
    const api = {
      pluginId,
      getState: () => deepFreezeObject(getState()),
      dispatch: (action) => emit(action, pluginId),
      emit: (action) => emit(action, pluginId)
    }
    return deepFreezeObject(api)
  }

  const emit = (action, pluginId) => {
    if (!isPlainObject(action) || typeof action.type !== 'string') {
      throw new Error(`[PlatformPlugin:${pluginId}] emitted action must be a plain object with a string type.`)
    }
    enqueuePluginAction(deepFreezeObject({ ...action }), pluginId)
  }

  const registerPlugin = (plugin) => {
    if (!isPlugin(plugin)) {
      throw new Error('Platform plugin must include a name string')
    }
    if (plugins.find((registered) => registered.name === plugin.name)) {
      throw new Error(`Platform plugin with name '${plugin.name}' is already registered.`)
    }

    plugins.push(plugin)
    const api = createPluginApi(plugin.name)

    if (typeof plugin.onInit === 'function') {
      try {
        plugin.onInit(api)
      } catch (error) {
        console.warn(`[PlatformPlugin:${plugin.name}] Error during onInit:`, error)
      }
    }

    return () => {
      const index = plugins.findIndex((registered) => registered.name === plugin.name)
      if (index !== -1) {
        plugins.splice(index, 1)
      }
    }
  }

  const runPluginsForAction = ({ action, prevState, nextState, auditEntry, platformDispatch }) => {
    const frozenAction = deepFreezeObject({ ...action })
    const frozenPrevState = deepFreezeObject({ ...prevState })
    const frozenNextState = deepFreezeObject({ ...nextState })
    const frozenAuditEntry = deepFreezeObject({ ...auditEntry })

    plugins.forEach((plugin) => {
      const api = createPluginApi(plugin.name)
      try {
        if (typeof plugin.onAction === 'function') {
          plugin.onAction(frozenAction, api)
        }
      } catch (error) {
        console.warn(`[PlatformPlugin:${plugin.name}] Error during onAction:`, error)
      }
    })

    plugins.forEach((plugin) => {
      const api = createPluginApi(plugin.name)
      try {
        if (typeof plugin.onStateChange === 'function') {
          plugin.onStateChange(frozenNextState, api)
        }
      } catch (error) {
        console.warn(`[PlatformPlugin:${plugin.name}] Error during onStateChange:`, error)
      }
    })

    if (!processing) {
      processQueuedActionsInternal(platformDispatch)
    }
  }

  const processQueuedActionsInternal = (platformDispatch) => {
    if (processing) {
      return
    }
    processing = true

    while (actionQueue.length && depth < MAX_DEPTH) {
      const queuedBatch = actionQueue.splice(0)
      depth += 1

      queuedBatch.forEach(({ action, pluginId }) => {
        try {
          platformDispatch(action, pluginId)
        } catch (error) {
          console.warn(`[PlatformPlugin:${pluginId}] Error dispatching emitted action:`, error)
        }
      })
    }

    if (actionQueue.length > 0) {
      console.warn('[PlatformPlugin] Plugin event queue exceeded max depth and remaining actions were ignored.')
      actionQueue.length = 0
    }

    processing = false
    depth = 0
  }

  const getRegisteredPlugins = () => [...plugins]

  return {
    registerPlugin,
    runPluginsForAction,
    processQueuedActions: processQueuedActionsInternal,
    getRegisteredPlugins
  }
}

export const sampleLoggerPlugin = {
  name: 'sample-logger',
  onInit(api) {
    console.log('[PlatformPlugin][sample-logger] initialized', api.pluginId)
  },
  onAction(action, api) {
    console.groupCollapsed(`[PlatformPlugin][sample-logger] ${action.type}`)
    console.log('Action:', action)
    console.log('State at action:', api.getState())
    console.groupEnd()

    if (action.type === CORE_ACTION_TYPES.SITE_UPDATE) {
      api.emit({
        type: CORE_ACTION_TYPES.EVENT_ADD,
        userId: action.userId,
        siteId: action.siteId,
        payload: {
          id: `plugin-log-${Date.now()}`,
          type: 'plugin.log',
          message: 'Sample logger recorded SITE_UPDATE',
          createdBy: action.userId,
          timestamp: new Date().toISOString()
        }
      })
    }
  },
  onStateChange(nextState, api) {
    console.log('[PlatformPlugin][sample-logger] state changed for plugin', api.pluginId)
  }
}
