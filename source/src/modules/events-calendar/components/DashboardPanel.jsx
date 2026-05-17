import React from 'react'
import { usePlatformCore } from '../../../core/platform/PlatformCoreContext'
import { EventCard } from './EventCard'

/**
 * DashboardPanel Component for Events Calendar Module
 * 
 * Shows upcoming events in a compact dashboard widget.
 */
export function DashboardPanel() {
  const { currentSiteId, sites } = usePlatformCore()
  const site = sites?.find(s => s.id === currentSiteId)
  const events = site?.calendarEvents || []

  // Get upcoming events (sorted by start date)
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3) // Show only next 3 events

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Upcoming Events</h3>
        <div className="text-center py-6 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="text-sm">No upcoming events</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-700 mb-3">Upcoming Events</h3>
      <div className="space-y-3">
        {upcomingEvents.map(event => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
            style={{ borderLeft: `3px solid ${event.color || '#4f46e5'}` }}
          >
            <div className="flex-shrink-0 text-center w-12">
              <div className="text-xs text-gray-500 uppercase">
                {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
              </div>
              <div className="text-lg font-bold text-gray-800">
                {new Date(event.startDate).getDate()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{event.title}</div>
              <div className="text-xs text-gray-500">
                {new Date(event.startDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {events.length > 3 && (
        <div className="mt-3 text-center">
          <span className="text-xs text-indigo-600 cursor-pointer hover:underline">
            View all {events.length} events
          </span>
        </div>
      )}
    </div>
  )
}