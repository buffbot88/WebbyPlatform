import React, { useState, useEffect } from 'react'

/**
 * EventForm Component
 * 
 * Form for creating and editing calendar events.
 */
export function EventForm({ event, onSubmit, onCancel, isOpen }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    color: '#4f46e5',
    recurring: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate

      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.location || '',
        color: event.color || '#4f46e5',
        recurring: event.recurring || ''
      })
    } else {
      // Reset form for new event
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      setFormData({
        title: '',
        description: '',
        startDate: now.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        color: '#4f46e5',
        recurring: ''
      })
    }
  }, [event, isOpen])

  const validate = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Combine date and time
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

    const eventData = {
      ...formData,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      // Remove the separate time fields
      startTime: undefined,
      endTime: undefined
    }

    onSubmit(eventData)
  }

  if (!isOpen) {
    return null
  }

  const colorOptions = [
    { value: '#4f46e5', label: 'Indigo' },
    { value: '#dc2626', label: 'Red' },
    { value: '#16a34a', label: 'Green' },
    { value: '#2563eb', label: 'Blue' },
    { value: '#d97706', label: 'Amber' },
    { value: '#7c3aed', label: 'Purple' },
    { value: '#0891b2', label: 'Cyan' },
    { value: '#059669', label: 'Emerald' }
  ]

  const recurringOptions = [
    { value: '', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {event?.id ? 'Edit Event' : 'Create New Event'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter event description"
              />
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter event location"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            {/* Recurring */}
            <div>
              <label htmlFor="recurring" className="block text-sm font-medium text-gray-700 mb-1">
                Repeat
              </label>
              <select
                id="recurring"
                name="recurring"
                value={formData.recurring}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {recurringOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {event?.id ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}