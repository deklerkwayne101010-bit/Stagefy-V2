// CRM Calendar Page
// Phase 1: Basic calendar interface with month view

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth-context'

// Event types with colors
const EVENT_TYPES = {
  appointment: { label: 'Appointment', color: 'bg-purple-500', icon: '📅' },
  meeting: { label: 'Meeting', color: 'bg-blue-500', icon: '👥' },
  viewing: { label: 'Property Viewing', color: 'bg-green-500', icon: '🏠' },
  call: { label: 'Phone Call', color: 'bg-orange-500', icon: '📞' },
  reminder: { label: 'Reminder', color: 'bg-red-500', icon: '🔔' }
}

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

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

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

      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) return

      const response = await fetch(
        `/api/calendar/events?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage your appointments and schedule</p>
        </div>
        <Button onClick={() => setShowEventModal(true)}>
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
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowEventModal(true)
                          }}
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

      {/* Event Modal Placeholder */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader title={selectedEvent ? 'Edit Event' : 'New Event'} />
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Event creation form will be implemented in the next phase.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowEventModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}