import { useState } from 'react'
import { usePlatformCore } from '../../../core/platform/PlatformCoreContext'
import { useModuleEnabled } from '../../../core/platform/modules/ModuleContext'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  enableEventsCalendar,
  disableEventsCalendar
} from '../actions'
import { CalendarView } from './CalendarView'
import { EventForm } from './EventForm'

/**
 * AdminSettings Component for Events Calendar Module
 * 
 * Provides module toggle and event management interface.
 */
export function AdminSettings() {
  const { currentUserId, currentSiteId, dispatchPlatformAction, sites } = usePlatformCore()
  const isEnabled = useModuleEnabled('events-calendar')
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const site = sites?.find(s => s.id === currentSiteId)
  const events = site?.calendarEvents || []

  const handleToggleModule = () => {
    if (isEnabled) {
      dispatchPlatformAction(disableEventsCalendar({ userId: currentUserId, siteId: currentSiteId }))
    } else {
      dispatchPlatformAction(enableEventsCalendar({ userId: currentUserId, siteId: currentSiteId }))
    }
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

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  const handleEventEdit = (event) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }

  if (!isEnabled) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Events Calendar</h3>
            <p className="text-gray-500 text-sm mt-1">
              Add a calendar with event management to your site
            </p>
          </div>
          <button
            onClick={handleToggleModule}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Enable Module
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Events Calendar</h3>
            <p className="text-gray-500 text-sm mt-1">
              Manage events and calendar settings
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
            <button
              onClick={handleToggleModule}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Disable
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView
        events={events}
        onEventClick={handleEventClick}
        onEventEdit={handleEventEdit}
        onEventDelete={handleDeleteEvent}
      />

      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Event Details</h4>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Title</span>
              <p className="font-medium">{selectedEvent.title}</p>
            </div>
            {selectedEvent.description && (
              <div>
                <span className="text-sm text-gray-500">Description</span>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Start</span>
                <p className="text-gray-700">
                  {new Date(selectedEvent.startDate).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">End</span>
                <p className="text-gray-700">
                  {new Date(selectedEvent.endDate).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedEvent.location && (
              <div>
                <span className="text-sm text-gray-500">Location</span>
                <p className="text-gray-700">{selectedEvent.location}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleEventEdit(selectedEvent)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Edit Event
              </button>
              <button
                onClick={() => handleDeleteEvent(selectedEvent)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

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