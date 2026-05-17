/**
 * Events Calendar Module Actions
 * 
 * Action creators for the Events Calendar module.
 * All actions flow through PlatformCore for audit logging and replay.
 */

import { CORE_ACTION_TYPES } from '../../core/platform/actions'

/**
 * Create a new calendar event
 * @param {Object} params - Action parameters
 * @param {string} params.userId - The user creating the event
 * @param {string} params.siteId - The site ID
 * @param {Object} params.event - The event data
 * @returns {Object} Platform action
 */
export function createCalendarEvent({ userId, siteId, event }) {
  return {
    type: CORE_ACTION_TYPES.EVENT_CREATE,
    userId,
    siteId,
    timestamp: new Date().toISOString(),
    payload: {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title,
      description: event.description || '',
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || '',
      color: event.color || '#4f46e5',
      recurring: event.recurring || null
    }
  }
}

/**
 * Update an existing calendar event
 * @param {Object} params - Action parameters
 * @param {string} params.userId - The user updating the event
 * @param {string} params.siteId - The site ID
 * @param {string} params.eventId - The event ID to update
 * @param {Object} params.updates - The updates to apply
 * @returns {Object} Platform action
 */
export function updateCalendarEvent({ userId, siteId, eventId, updates }) {
  return {
    type: CORE_ACTION_TYPES.EVENT_UPDATE,
    userId,
    siteId,
    timestamp: new Date().toISOString(),
    payload: {
      eventId,
      updates
    }
  }
}

/**
 * Delete a calendar event
 * @param {Object} params - Action parameters
 * @param {string} params.userId - The user deleting the event
 * @param {string} params.siteId - The site ID
 * @param {string} params.eventId - The event ID to delete
 * @returns {Object} Platform action
 */
export function deleteCalendarEvent({ userId, siteId, eventId }) {
  return {
    type: CORE_ACTION_TYPES.EVENT_DELETE,
    userId,
    siteId,
    timestamp: new Date().toISOString(),
    payload: {
      eventId
    }
  }
}

/**
 * Enable the Events Calendar module
 * @param {Object} params - Action parameters
 * @param {string} params.userId - The user enabling the module
 * @param {string} params.siteId - The site ID
 * @returns {Object} Platform action
 */
export function enableEventsCalendar({ userId, siteId }) {
  return {
    type: CORE_ACTION_TYPES.MODULE_ENABLE,
    userId,
    siteId,
    timestamp: new Date().toISOString(),
    payload: {
      moduleId: 'events-calendar'
    }
  }
}

/**
 * Disable the Events Calendar module
 * @param {Object} params - Action parameters
 * @param {string} params.userId - The user disabling the module
 * @param {string} params.siteId - The site ID
 * @returns {Object} Platform action
 */
export function disableEventsCalendar({ userId, siteId }) {
  return {
    type: CORE_ACTION_TYPES.MODULE_DISABLE,
    userId,
    siteId,
    timestamp: new Date().toISOString(),
    payload: {
      moduleId: 'events-calendar'
    }
  }
}
