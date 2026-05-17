// React not required (automatic JSX runtime)

/**
 * EventCard Component
 * 
 * Displays a single event in a card format.
 */
export function EventCard({ event, onClick, onEdit, onDelete, compact = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isAllDay = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start.getHours() === 0 && start.getMinutes() === 0 &&
           end.getHours() === 0 && end.getMinutes() === 0
  }

  if (compact) {
    return (
      <div
        className="event-card-compact p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ borderLeft: `3px solid ${event.color || '#4f46e5'}` }}
        onClick={() => onClick?.(event)}
        title={event.title}
      >
        <div className="text-sm font-medium truncate">{event.title}</div>
        <div className="text-xs text-gray-500">
          {formatDate(event.startDate)}
        </div>
      </div>
    )
  }

  return (
    <div
      className="event-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
      style={{ borderLeft: `4px solid ${event.color || '#4f46e5'}` }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 ml-2">
            {onEdit && (
              <button
                onClick={() => onEdit?.(event)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete?.(event)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 mt-3 space-y-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            {formatDate(event.startDate)}
            {event.endDate && event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
          </span>
        </div>

        {!isAllDay(event.startDate, event.endDate) && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {event.recurring && (
        <div className="mt-2">
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            Recurring: {event.recurring}
          </span>
        </div>
      )}
    </div>
  )
}