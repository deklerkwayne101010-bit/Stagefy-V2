'use client'

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth-context';
import ContentPlannerWizard from '@/components/content/ContentPlannerWizard';
import { showToast } from '@/lib/toast';

interface CalendarEntry {
  id: string;
  title: string;
  content_type: string;
  platform: 'facebook' | 'instagram' | 'both';
  caption: string;
  hashtags: string[];
  generated_image_url: string | null;
  scheduled_date: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled' | 'draft';
  published_url: string | null;
  publish_error: string | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch calendar entries
  const fetchEntries = useCallback(async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login?redirect=/calendar');
        return;
      }

      const response = await fetch('/api/content/calendar', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handle wizard completion
  const handleWizardComplete = async (plan: any) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

      // Create calendar entries for each post in plan
      for (const post of plan.posts) {
        await fetch('/api/content/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: post.title,
            content_type: post.category,
            platform: post.platform,
            caption: post.suggested_caption,
            hashtags: post.hashtags,
            template_type: post.visual_type,
            template_prompt: post.visual_style_description,
            scheduled_date: new Date(post.suggested_date).toISOString(),
            is_recurring: post.is_recurring || false,
            recurrence_pattern: post.recurrence_pattern || {},
          }),
        });
      }

      setShowWizard(false);
      showToast.success(`Scheduled ${plan.posts.length} posts!`);
      fetchEntries(); // Refresh calendar
    } catch (error) {
      console.error('Error creating plan:', error);
      showToast.error('Failed to schedule posts');
    }
  };

  // Manual share to Facebook/Instagram (no API connection required)
  const handleManualShare = (entry: CalendarEntry, platform: 'facebook' | 'instagram') => {
    const url = window.location.origin + '/calendar';
    const text = `${entry.title}\n\n${entry.caption}`;
    
    if (platform === 'facebook') {
      const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      window.open(fbShareUrl, 'facebook-share', 'width=600,height=400,toolbar=0,menubar=0');
    } else {
      const igText = `📸 ${entry.title}\n\n${entry.caption}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(igText).then(() => {
          showToast.success('Caption copied! Now paste into Instagram 📱');
          window.open('https://instagram.com', '_blank');
        }).catch(() => {
          window.open('https://instagram.com', '_blank');
        });
      } else {
        window.open('https://instagram.com', '_blank');
      }
    }
  };

  // Custom event rendering
  const eventContent = (eventInfo: any) => {
    const platformColors = {
      facebook: 'bg-blue-500',
      instagram: 'bg-pink-500',
      both: 'bg-purple-500',
    };

    const platform = eventInfo.event.extendedProps.platform as string;
    const colorClass = platformColors[platform as keyof typeof platformColors] || 'bg-gray-500';

    return (
      <div className={`${colorClass} text-white p-1 rounded text-xs overflow-hidden cursor-pointer hover:opacity-80`}>
        <div className="font-bold truncate">{eventInfo.event.title}</div>
        <div className="truncate opacity-80">{eventInfo.event.extendedProps.caption?.substring(0, 50)}...</div>
      </div>
    );
  };

  // Handle event click - show share options
  const handleEventClick = (info: any) => {
    const entry = entries.find(e => e.id === info.event.id);
    if (entry) {
      const platform = info.event.extendedProps.platform;
      if (platform === 'both') {
        const choice = window.confirm('Share to Facebook or Instagram?\n\nOK = Facebook, Cancel = Instagram');
        handleManualShare(entry, choice ? 'facebook' : 'instagram');
      } else {
        handleManualShare(entry, platform);
      }
    }
  };

  // Check if user can create content (always true for manual sharing)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600">Plan and schedule your social media content</p>
          </div>
           <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Content Planner
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <Card className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            events={entries.map(entry => ({
              id: entry.id,
              title: entry.title,
              start: entry.scheduled_date,
              end: entry.scheduled_date,
              extendedProps: {
                platform: entry.platform,
                caption: entry.caption,
                status: entry.status,
                published_url: entry.published_url,
                publish_error: entry.publish_error,
                generated_image_url: entry.generated_image_url,
              },
            }))}
            eventContent={eventContent}
            height="auto"
            editable={false}
            selectable={true}
             dateClick={(info) => {
               setSelectedDate(info.date);
             }}
             eventClick={(info) => {
               const entry = entries.find(e => e.id === info.event.id);
               if (entry) {
                 handleEventClick(info);
               }
             }}
           />
        </Card>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>Facebook</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-500"></div>
            <span>Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span>Both</span>
          </div>
        </div>
      </div>

      {/* Content Planner Wizard Modal */}
      {showWizard && (
        <ContentPlannerWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  );
}

// Helper to show post details (toast for now, could be modal)
function showPostDetails(entry: CalendarEntry) {
  console.log('Post details:', entry);
  // TODO: Implement detailed view modal
}
