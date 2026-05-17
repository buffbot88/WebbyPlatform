import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlatformCore } from '../../../core/platform/PlatformCoreContext'
import { useModuleEnabled } from '../../../core/platform/modules/ModuleContext'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../actions'
import { CalendarView } from '../components/CalendarView'
import { EventForm } from '../components/EventForm'

/**
 * CalendarPage Component
 * 
 * Full-page calendar view for the Events Calendar module.
 * This page is only accessible when the module is enabled.
 */
export function CalendarPage() {
  const { currentUserId, currentSiteId, dispatchPlatformAction, sites } = usePlatformCore()
  const isEnabled = useModuleEnabled('events-calendar')
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const site = sites?.find(s => s.id === currentSiteId)
  const events = site?.calendarEvents || []

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Events Calendar</h2>
          <p className="text-gray-500 mb-6">
            The Events Calendar module is not enabled for this site.
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleCreateEvent = (eventData) => {
    dispatchPlatformAction(
      createCalendarEvent({
        userId: currentUserId,
        siteId: currentSiteId,
        event: eventData
      })
    )
    setShowEventForm(false)
  }

  const handleUpdateEvent = (eventData) => {
    dispatchPlatformAction(
      updateCalendarEvent({
        userId: currentUserId,
        siteId: currentSiteId,
        eventId: editingEvent.id,
        updates: eventData
      })
    )
    setEditingEvent(null)
    setShowEventForm(false)
  }

  const handleDeleteEvent = (event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      dispatchPlatformAction(
        deleteCalendarEvent({
          userId: currentUserId,
          siteId: currentSiteId,
          eventId: event.id
        })
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events Calendar</h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage and view all your site events
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {events.length} event{events.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setEditingEvent(null)
                  setShowEventForm(true)
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CalendarView
          events={events}
          onEventClick={setSelectedEvent}
          onEventEdit={(event) => {
            setEditingEvent(event)
            setShowEventForm(true)
          }}
          onEventDelete={handleDeleteEvent}
        />
      </div>

      {/* Event Form Modal */}
      <EventForm
        event={editingEvent}
        isOpen={showEventForm}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        onCancel={() => {
          setShowEventForm(false)
          setEditingEvent(null)
        }}
      />
    </div>
  )
}