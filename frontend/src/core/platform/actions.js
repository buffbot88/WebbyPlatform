/**
 * Platform action payload shape:
 * Action {
 *   type: string
 *   userId: string
 *   siteId: string
 *   timestamp: string
 *   payload: object
 * }
 */

export const CORE_ACTION_TYPES = {
  SITE_UPDATE: 'SITE_UPDATE',
  PAGE_CREATE: 'PAGE_CREATE',
  PAGE_REMOVE: 'PAGE_REMOVE',
  SECTION_ADD: 'SECTION_ADD',
  SECTION_REMOVE: 'SECTION_REMOVE',
  THEME_CHANGE: 'THEME_CHANGE',
  PUBLISH_STATE_UPDATE: 'PUBLISH_STATE_UPDATE',
  MODE_UPDATE: 'MODE_UPDATE',
  EVENT_ADD: 'EVENT_ADD',
  EVENT_REMOVE: 'EVENT_REMOVE',
  AI_GENERATE_LAYOUT: 'AI_GENERATE_LAYOUT'
}

export const VALID_ACTION_TYPES = Object.values(CORE_ACTION_TYPES)

export function createPlatformAction({ type, userId, siteId, payload, timestamp }) {
  return {
    type,
    userId,
    siteId,
    timestamp: timestamp || new Date().toISOString(),
    payload: payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  }
}

export function validatePlatformAction(action) {
  const warnings = []

  if (!action || typeof action !== 'object') {
    warnings.push('Action must be a non-null object.')
    return { valid: false, warnings }
  }

  if (!action.type || typeof action.type !== 'string') {
    warnings.push('Action type must be a non-empty string.')
  } else if (!VALID_ACTION_TYPES.includes(action.type)) {
    warnings.push(`Unknown action type: ${action.type}`)
  }

  if (!action.userId || typeof action.userId !== 'string') {
    warnings.push('Action userId must be a non-empty string.')
  }

  if (!action.siteId || typeof action.siteId !== 'string') {
    warnings.push('Action siteId must be a non-empty string.')
  }

  if (!action.timestamp || typeof action.timestamp !== 'string' || Number.isNaN(Date.parse(action.timestamp))) {
    warnings.push('Action must include a valid ISO timestamp.')
  }

  if (action.payload == null || typeof action.payload !== 'object' || Array.isArray(action.payload)) {
    warnings.push('Action payload must be a plain object.')
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}

export const ACTION_EXAMPLES = [
  CORE_ACTION_TYPES.SITE_UPDATE,
  CORE_ACTION_TYPES.PAGE_CREATE,
  CORE_ACTION_TYPES.THEME_CHANGE,
  CORE_ACTION_TYPES.AI_GENERATE_LAYOUT
]
