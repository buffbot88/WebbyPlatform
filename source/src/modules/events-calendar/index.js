/**
 * Events Calendar Module
 * 
 * A modular events calendar system for WebbyPlatform.
 * This module provides:
 * - Dashboard panel showing upcoming events
 * - Admin settings for event management
 * - Full calendar view with month/week/day views
 * - Event CRUD operations through PlatformCore actions
 * - Audit logging and replay support
 */

import { registerModule } from '../../core/platform/modules'

// Component exports
export { AdminSettings } from './components/AdminSettings'
export { CalendarView } from './components/CalendarView'
export { DashboardPanel } from './components/DashboardPanel'
export { EventCard } from './components/EventCard'
export { EventForm } from './components/EventForm'

// Page exports
export { CalendarPage } from './pages/CalendarPage'

// Action exports
export {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  enableEventsCalendar,
  disableEventsCalendar
} from './actions'

// Module definition
export const eventsCalendarModule = {
  id: 'events-calendar',
  name: 'Events Calendar',
  version: '1.0.0',
  description: 'A full-featured events calendar with event management capabilities',

  // Lifecycle hooks
  onInit({ moduleId }) {
    console.log(`[Events Calendar] Module ${moduleId} initialized`)
  },

  onEnable({ siteId, moduleId }) {
    console.log(`[Events Calendar] Module enabled for site ${siteId}`)
  },

  onDisable({ siteId, moduleId }) {
    console.log(`[Events Calendar] Module disabled for site ${siteId}`)
  },

  // Dashboard contributions
  dashboardPanels: [
    {
      id: 'events-calendar-upcoming',
      title: 'Upcoming Events',
      component: 'DashboardPanel',
      position: 'sidebar', // or 'main'
      order: 1
    }
  ],

  // Admin settings contributions
  adminSettings: [
    {
      id: 'events-calendar-settings',
      title: 'Events Calendar',
      component: 'AdminSettings',
      icon: 'calendar',
      order: 3
    }
  ],

  // Route contributions
  routes: [
    {
      path: '/calendar',
      component: 'CalendarPage',
      requiresAuth: true,
      title: 'Events Calendar'
    }
  ],

  // Widget contributions
  widgets: [
    {
      id: 'calendar-widget',
      name: 'Calendar Widget',
      component: 'CalendarView',
      category: 'events'
    }
  ]
}

// Auto-register the module when imported
let unregisterFunction = null

export function registerEventsCalendarModule() {
  if (!unregisterFunction) {
    unregisterFunction = registerModule(eventsCalendarModule)
  }
  return unregisterFunction
}

export function unregisterEventsCalendarModule() {
  if (unregisterFunction) {
    unregisterFunction()
    unregisterFunction = null
  }
}

// Export the module definition for manual registration if needed
export default eventsCalendarModule