// CRM Calendar Page
// Phase 1: Basic calendar interface with month view
// Phase 2: Full event creation, editing and deletion

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth-context'

// Helper to get auth headers for API calls
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      }
    }
  } catch {
    // ignore
  }
  return { 'Content-Type': 'application/json' }
}

// Event types with colors
const EVENT_TYPES = {
  appointment: { label: 'Appointment', color: 'bg-purple-500', icon: '📅' },
  meeting: { label: 'Meeting', color: 'bg-blue-500', icon: '👥' },
  viewing: { label: 'Property Viewing', color: 'bg-green-500', icon: '🏠' },
  call: { label: 'Phone Call', color: 'bg-orange-500', icon: '📞' },
  reminder: { label: 'Reminder', color: 'bg-red-500', icon: '🔔' }
}

const EVENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

interface CalendarEvent {
  id: string
  title: string
  description?: string
  event_type: keyof typeof EVENT_TYPES
  start_time: string
  end_time: string
  all_day: boolean
  location?: string
  contact?: { id: string; name: string; email: string; phone: string }
  listing?: { id: string; title: string; address: string }
  task?: { id: string; title: string; status: string }
  status: string
  priority: string
}

// Form data type
interface EventFormData {
  title: string
  description: string
  event_type: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  all_day: boolean
  location: string
  status: string
  priority: string
}

// Default form data
const getDefaultFormData = (): EventFormData => {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().slice(0, 5)
  
  // Default end time is 1 hour later
  const endHour = now.getHours() + 1
  const endTimeStr = `${String(endHour).padStart(2, '0')}:${timeStr.slice(3)}`
  
  return {
    title: '',
    description: '',
    event_type: 'appointment',
    start_date: dateStr,
    start_time: timeStr,
    end_date: dateStr,
    end_time: endTimeStr,
    all_day: false,
    location: '',
    status: 'scheduled',
    priority: 'normal'
  }
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [formData, setFormData] = useState<EventFormData>(getDefaultFormData())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load events for current month
  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get start and end of current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

      const headers = await getAuthHeaders()

      const response = await fetch(
        `/api/calendar/events?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`,
        { headers }
      )

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.toDateString() === day.toDateString()
    })
  }

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Format month/year header
  const monthYear = currentDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long'
  })

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle creating new event
  const handleCreateEvent = async () => {
    if (!formData.title.trim()) {
      setError('Please enter an event title')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Please log in again')
        return
      }

      const startTime = formData.all_day 
        ? `${formData.start_date}T00:00:00`
        : `${formData.start_date}T${formData.start_time}:00`
      const endTime = formData.all_day 
        ? `${formData.end_date}T23:59:59`
        : `${formData.end_date}T${formData.end_time}:00`

      const requestBody = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_time: startTime,
        end_time: endTime,
        all_day: formData.all_day,
        location: formData.location,
        status: formData.status,
        priority: formData.priority
      }

      console.log('=== CALENDAR EVENT CREATION DEBUG ===')
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      console.log('Auth token exists:', !!session?.access_token)

      const headers = await getAuthHeaders()
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type,
          start_time: startTime,
          end_time: endTime,
          all_day: formData.all_day,
          location: formData.location,
          status: formData.status,
          priority: formData.priority
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        setEvents(prev => [...prev, data.event])
        setShowEventModal(false)
        setSelectedEvent(null)
        setFormData(getDefaultFormData())
      } else {
        // More detailed error message
        let errorMsg = data.error || `Failed to create event (Error: ${response.status})`
        if (data.details) {
          errorMsg += ` - ${data.details}`
        }
        console.error('Event creation failed:', errorMsg, data)
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('An error occurred while creating the event')
    } finally {
      setSaving(false)
    }
  }

  // Handle updating event
  const handleUpdateEvent = async () => {
    if (!selectedEvent || !formData.title.trim()) {
      setError('Please enter an event title')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Please log in again')
        return
      }

      const startTime = formData.all_day 
        ? `${formData.start_date}T00:00:00`
        : `${formData.start_date}T${formData.start_time}:00`
      const endTime = formData.all_day 
        ? `${formData.end_date}T23:59:59`
        : `${formData.end_date}T${formData.end_time}:00`

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type,
          start_time: startTime,
          end_time: endTime,
          all_day: formData.all_day,
          location: formData.location,
          status: formData.status,
          priority: formData.priority
        })
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(prev => prev.map(e => e.id === selectedEvent.id ? data.event : e))
        setShowEventModal(false)
        setSelectedEvent(null)
        setFormData(getDefaultFormData())
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update event')
      }
    } catch (err) {
      console.error('Error updating event:', err)
      setError('An error occurred while updating the event')
    } finally {
      setSaving(false)
    }
  }

  // Handle deleting event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    if (!confirm('Are you sure you want to delete this event?')) return

    setSaving(true)
    setError('')

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Please log in again')
        return
      }

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
        setShowEventModal(false)
        setSelectedEvent(null)
        setFormData(getDefaultFormData())
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete event')
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      setError('An error occurred while deleting the event')
    } finally {
      setSaving(false)
    }
  }

  // Open modal for new event
  const openNewEventModal = () => {
    setSelectedEvent(null)
    setFormData(getDefaultFormData())
    setError('')
    setShowEventModal(true)
  }

  // Open modal for editing event
  const openEditEventModal = (event: CalendarEvent) => {
    const startDate = new Date(event.start_time)
    const endDate = new Date(event.end_time)

    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_date: endDate.toISOString().split('T')[0],
      end_time: endDate.toTimeString().slice(0, 5),
      all_day: event.all_day,
      location: event.location || '',
      status: event.status,
      priority: event.priority
    })
    setError('')
    setShowEventModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowEventModal(false)
    setSelectedEvent(null)
    setFormData(getDefaultFormData())
    setError('')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage your appointments and schedule</p>
        </div>
        <Button onClick={openNewEventModal}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Select 
              value={view} 
              onChange={(e) => setView(e.target.value as 'month' | 'week' | 'day')}
              options={[
                { value: 'month', label: 'Month' },
                { value: 'week', label: 'Week' },
                { value: 'day', label: 'Day' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Month View Calendar */}
      {view === 'month' && (
        <Card>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border-r border-b border-gray-200 last:border-r-0 ${
                    !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const eventType = EVENT_TYPES[event.event_type]
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 ${eventType.color}`}
                          onClick={() => openEditEventModal(event)}
                        >
                          <div className="flex items-center gap-1">
                            <span>{eventType.icon}</span>
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Event Modal with Full Form */}
      {showEventModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEventModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-semibold text-gray-900">{selectedEvent ? 'Edit Event' : 'New Event'}</h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter event title"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <Select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                  options={Object.entries(EVENT_TYPES).map(([key, value]) => ({
                    value: key,
                    label: `${value.icon} ${value.label}`
                  }))}
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="all_day"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="all_day" className="text-sm text-gray-700">
                  All Day Event
                </label>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </div>
                {!formData.all_day && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>
                {!formData.all_day && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <Input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={EVENT_STATUSES}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  options={PRIORITIES}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location (optional)"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add notes or description (optional)"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <Button 
                  onClick={selectedEvent ? handleUpdateEvent : handleCreateEvent}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : selectedEvent ? 'Update Event' : 'Create Event'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </Button>

                {selectedEvent && (
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteEvent}
                    disabled={saving}
                    className="ml-auto"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}