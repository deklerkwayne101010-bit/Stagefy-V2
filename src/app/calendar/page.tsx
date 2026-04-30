'use client'

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast'

// Dynamically import ContentPlannerWizard to avoid SSR issues
const ContentPlannerWizard = dynamic(() => import('@/components/content/ContentPlannerWizard'), {
  ssr: false,
})

// Interface for calendar event
interface CalendarEvent {
  id: string
  title: string
  start: string
  allDay?: boolean
  extendedProps: {
    caption: string
    platform: 'facebook' | 'instagram' | 'both'
    status: string
    visual_type?: string | null
    image_url?: string | null
  }
}

// Interface for API response
interface CalendarEntry {
  id: string
  title: string
  caption: string
  image_url: string | null
  platform: string
  scheduled_for: string
  status: string
  visual_type: string | null
}

export default function CalendarPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  // Fetch calendar entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/content/calendar')
      if (res.ok) {
        const data = await res.json()
        const formatted = (data.data || []).map((entry: CalendarEntry) => ({
          id: entry.id,
          title: entry.title,
          start: entry.scheduled_for,
          allDay: true,
          extendedProps: {
            caption: entry.caption,
            platform: entry.platform as 'facebook' | 'instagram' | 'both',
            status: entry.status,
            visual_type: entry.visual_type,
            image_url: entry.image_url,
          },
        }))
        setEvents(formatted)
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
      toast('Failed to load calendar', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Handle event click
  const handleEventClick = (info: any) => {
    const { event } = info
    const props = event.extendedProps

    // Simple confirmation to delete or edit
    const confirmMsg = `"${event.title}"\nPlatform: ${props.platform}\nStatus: ${props.status}\n\nDelete this post?`
    if (confirm(confirmMsg)) {
      deleteEntry(event.id)
    }
  }

  // Delete calendar entry
  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/content/calendar/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id))
        toast('Post deleted successfully', 'success')
      } else {
        toast('Failed to delete post', 'error')
      }
    } catch (error) {
      toast('Error deleting post', 'error')
    }
  }

  // Refresh after wizard completes
  const handleWizardComplete = () => {
    setShowWizard(false)
    fetchEntries()
    toast('Content plan created!', 'success')
  }

   // Color based on platform
   const eventColor = (platform: string) => {
     switch (platform) {
       case 'facebook':
         return '#1877F2' // Facebook blue
       case 'instagram':
         return '#E4405F' // Instagram pink
       case 'both':
         return '#8B5CF6' // Purple for both platforms
       default:
         return '#3b82f6'
     }
   }

  return (
    <div className="p-8">
      <Header title="Content Calendar" subtitle="Plan and schedule your social media posts" />

      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowWizard(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Content Plan
          </Button>
        </div>
      </div>

      <Card className="mt-6 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            events={events}
            eventClick={handleEventClick}
            eventDidMount={(info) => {
              // Add custom styling based on platform
              const platform = info.event.extendedProps.platform
              let color = '#3b82f6'
              if (platform === 'facebook') color = '#1877F2'
              if (platform === 'instagram') color = '#E4405F'
              if (platform === 'both') color = '#8B5CF6'

              info.el.style.backgroundColor = color
              info.el.style.borderColor = color
            }}
            height="auto"
            aspectRatio={1.8}
          />
        )}
      </Card>

      {/* Wizards Modal */}
      {showWizard && (
        <ContentPlannerWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  )
}
