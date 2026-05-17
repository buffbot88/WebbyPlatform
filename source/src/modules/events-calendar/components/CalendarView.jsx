import { useState, useMemo } from 'react'
import { EventCard } from './EventCard'

/**
 * CalendarView Component
 * 
 * Displays a calendar with events. Supports month, week, and day views.
 */
export function CalendarView({ events = [], onEventClick, onEventEdit, onEventDelete }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'month', 'week', 'day'

  // Navigation helpers
  const navigate = (direction) => {
    const newDate = new Date(currentDate)
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + direction)
        break
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar calculations
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (view === 'month') {
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startingDay = firstDay.getDay()
      const daysInMonth = lastDay.getDate()

      // Get previous month days
      const prevMonthDays = []
      const prevMonthLastDay = new Date(year, month, 0).getDate()
      for (let i = startingDay - 1; i >= 0; i--) {
        prevMonthDays.push(prevMonthLastDay - i)
      }

      // Get current month days
      const currentMonthDays = []
      for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push(i)
      }

      // Get next month days to fill the grid
      const totalCells = Math.ceil((startingDay + daysInMonth) / 7) * 7
      const nextMonthDays = []
      const remainingCells = totalCells - (startingDay + daysInMonth)
      for (let i = 1; i <= remainingCells; i++) {
        nextMonthDays.push(i)
      }

      return {
        year,
        month,
        startingDay,
        daysInMonth,
        prevMonthDays,
        currentMonthDays,
        nextMonthDays,
        totalCells
      }
    }

    return { year, month }
  }, [currentDate, view])

  // Filter events for display
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return eventStart.toISOString().split('T')[0] <= dateStr &&
             eventEnd.toISOString().split('T')[0] >= dateStr
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear()
  }

  const formatMonthName = () => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Month View
  const renderMonthView = () => {
    const { prevMonthDays, currentMonthDays, nextMonthDays, startingDay } = calendarData
    const weeks = []
    let days = []

    // Previous month days
    prevMonthDays.forEach(day => {
      days.push({ day, isCurrentMonth: false })
    })

    // Current month days
    currentMonthDays.forEach(day => {
      days.push({ day, isCurrentMonth: true })
    })

    // Next month days
    nextMonthDays.forEach(day => {
      days.push({ day, isCurrentMonth: false })
    })

    // Split into weeks
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="calendar-month">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map(day => (
            <div key={day} className="bg-white p-2 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weeks.flat().map((dayInfo, index) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayInfo.day)
            const dayEvents = dayInfo.isCurrentMonth ? getEventsForDate(date) : []
            const isCurrentDay = dayInfo.isCurrentMonth && isToday(dayInfo.day)

            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-24 ${
                  dayInfo.isCurrentMonth ? '' : 'bg-gray-50 text-gray-400'
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? 'text-white bg-indigo-600 w-7 h-7 rounded-full flex items-center justify-center' : ''
                  }`}
                >
                  {dayInfo.day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-indigo-600 cursor-pointer hover:underline">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Week View
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      weekDays.push(day)
    }

    return (
      <div className="calendar-week">
        {/* Header */}
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-white p-2"></div>
          {weekDays.map((day, index) => {
            const today = new Date()
            const isCurrentDay = day.getDate() === today.getDate() &&
                                 day.getMonth() === today.getMonth() &&
                                 day.getFullYear() === today.getFullYear()
            return (
              <div key={index} className="bg-white p-2 text-center">
                <div className="text-sm font-semibold text-gray-700">
                  {day.toLocaleString('default', { weekday: 'short' })}
                </div>
                <div className={`text-lg ${isCurrentDay ? 'text-white bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time slots */}
        <div className="overflow-y-auto max-h-96">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="grid grid-cols-8 gap-px bg-gray-200">
              <div className="bg-white p-2 text-xs text-gray-500 text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  const eventHour = new Date(event.startDate).getHours()
                  return eventHour === hour
                })

                return (
                  <div key={index} className="bg-white p-1 min-h-12">
                    {dayEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        compact
                        onClick={() => onEventClick?.(event)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Day View
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div className="calendar-day">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {currentDate.toLocaleString('default', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>

          {dayEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No events scheduled for this day
            </div>
          ) : (
            <div className="space-y-4">
              {dayEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick?.(event)}
                  onEdit={() => onEventEdit?.(event)}
                  onDelete={() => onEventDelete?.(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-view bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="ml-4 text-lg font-semibold">
            {view === 'month' && formatMonthName()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm font-medium rounded ${
                view === 'month' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm font-medium rounded ${
                view === 'week' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 text-sm font-medium rounded ${
                view === 'day' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  )
}