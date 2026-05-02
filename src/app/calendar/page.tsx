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
  template_type: string;
  template_prompt: string;
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

      console.log('Fetching calendar entries for user session:', session?.user?.id);

      const response = await fetch('/api/content/calendar', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Calendar API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Calendar API response data:', data);
        setEntries(data.entries || []);
      } else {
        const errorData = await response.json();
        console.error('Calendar API error:', errorData);
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
            generated_image_url: post.generated_image_url || null,
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

  // Generate image for a calendar entry
  const generateImageForEntry = async (entry: CalendarEntry) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

      showToast.info('Generating image...');

      // Use the existing template generation API
      const response = await fetch('/api/ai/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: entry.template_type === 'agent_showcase' ? 'agent_showcase' : 'professional',
          version: 'standard',
          prompt: entry.template_prompt || `Create a ${entry.content_type} post for ${entry.title}. ${entry.caption}`,
          customOptions: {
            colorTheme: 'agency',
            aspectRatio: '1:1',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.outputUrl;

      if (imageUrl) {
        // Update the calendar entry with the new image
        await fetch('/api/content/calendar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            id: entry.id,
            generated_image_url: imageUrl,
          }),
        });

        // Update local state
        setEntries(prev => prev.map(e =>
          e.id === entry.id
            ? { ...e, generated_image_url: imageUrl }
            : e
        ));

        showToast.success('Image generated successfully!');
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      showToast.error('Failed to generate image');
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
    const hasImage = eventInfo.event.extendedProps.generated_image_url;

    return (
      <div className={`${colorClass} text-white p-1 rounded text-xs overflow-hidden cursor-pointer hover:opacity-80 relative`}>
        {!hasImage && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
        )}
        <div className="font-bold truncate">{eventInfo.event.title}</div>
        <div className="truncate opacity-80">{eventInfo.event.extendedProps.caption?.substring(0, 50)}...</div>
        {!hasImage && (
          <div className="text-xs opacity-60 mt-1">⚠️ No image</div>
        )}
      </div>
    );
  };

  // Handle event click - show options modal
  const handleEventClick = (info: any) => {
    const entry = entries.find(e => e.id === info.event.id);
    if (entry) {
      // Show a simple modal with options
      const hasImage = !!entry.generated_image_url;
      const options = [];

      if (!hasImage) {
        options.push('📸 Generate Image');
      }
      options.push('📤 Share to Social Media');
      options.push('❌ Cancel');

      const choice = window.prompt(
        `${entry.title}\n\n${entry.caption}\n\nChoose an action:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`,
        '1'
      );

      if (choice === '1' && !hasImage) {
        generateImageForEntry(entry);
      } else if ((choice === '1' && hasImage) || choice === '2') {
        const platform = info.event.extendedProps.platform;
        if (platform === 'both') {
          const platformChoice = window.confirm('Share to Facebook or Instagram?\n\nOK = Facebook, Cancel = Instagram');
          handleManualShare(entry, platformChoice ? 'facebook' : 'instagram');
        } else {
          handleManualShare(entry, platform);
        }
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
            <p className="text-gray-600">Plan content, add visuals, and schedule your social media posts</p>
          </div>
           <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Plan Content
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-gray-600"></div>
            <span>No Image</span>
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
