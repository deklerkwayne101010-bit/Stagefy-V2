'use client'

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
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
  template_type?: string;
  template_prompt?: string;
  scheduled_date: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled' | 'draft';
  published_url: string | null;
  publish_error: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showManualAddModal, setShowManualAddModal] = useState(false);

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
    const contentType = eventInfo.event.extendedProps.content_type as string;
    const platform = eventInfo.event.extendedProps.platform as string;
    const hasImage = eventInfo.event.extendedProps.generated_image_url;
    const status = eventInfo.event.extendedProps.status as string;

    // Different colors for different content types
    const typeColors = {
      manual: 'bg-blue-500',
      reminder: 'bg-orange-500',
      event: 'bg-green-500',
      listing: 'bg-purple-500',
      market_update: 'bg-indigo-500',
      testimonial: 'bg-pink-500',
      open_house: 'bg-red-500',
      promo: 'bg-yellow-500',
    };

    const colorClass = typeColors[contentType as keyof typeof typeColors] || 'bg-gray-500';

    // Different icons for different types
    const typeIcons = {
      manual: '📝',
      reminder: '⏰',
      event: '📅',
      listing: '🏠',
      market_update: '📈',
      testimonial: '💬',
      open_house: '🏡',
      promo: '🎉',
    };

    const icon = typeIcons[contentType as keyof typeof typeIcons] || '📝';

    return (
      <div className={`${colorClass} text-white p-1 rounded text-xs overflow-hidden cursor-pointer hover:opacity-80 relative`}>
        {status === 'draft' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border border-white"></div>
        )}
        {!hasImage && contentType === 'manual' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs">{icon}</span>
          <span className="font-bold truncate flex-1">{eventInfo.event.title}</span>
        </div>
        <div className="truncate opacity-80 text-xs">
          {eventInfo.event.extendedProps.caption?.substring(0, 40)}...
        </div>
        {status === 'draft' && (
          <div className="text-xs opacity-60 mt-1">Draft</div>
        )}
        {!hasImage && contentType === 'manual' && (
          <div className="text-xs opacity-60 mt-1">⚠️ No image</div>
        )}
      </div>
    );
  };

  // Handle event click - show options modal
  const handleEventClick = (info: any) => {
    const entry = entries.find(e => e.id === info.event.id);
    if (entry) {
      const contentType = entry.content_type;
      const hasImage = !!entry.generated_image_url;
      const isDraft = entry.status === 'draft';

      // Different actions based on content type
      if (contentType === 'reminder' || contentType === 'event') {
        // For reminders and events, just show basic info
        const message = `${entry.title}\n\n${entry.caption}\n\nStatus: ${entry.status}`;
        if (isDraft) {
          const markComplete = window.confirm(`${message}\n\nMark as completed?`);
          if (markComplete) {
            // Could update status here if needed
            showToast.success('Marked as completed!');
          }
        } else {
          window.alert(message);
        }
        return;
      }

      // For posts, show sharing options
      const options = [];

      if (isDraft) {
        options.push('📝 Edit Post');
      }
      if (!hasImage && contentType === 'manual') {
        options.push('📸 Generate Image');
      }
      options.push('📤 Share to Social Media');
      options.push('❌ Cancel');

      const choice = window.prompt(
        `${entry.title}\n\n${entry.caption}\n\nChoose an action:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`,
        '1'
      );

      if (choice === '1' && isDraft) {
        // Edit functionality could be added here
        showToast.info('Edit functionality coming soon!');
      } else if (choice === (isDraft ? '2' : '1') && !hasImage && contentType === 'manual') {
        generateImageForEntry(entry);
      } else if ((choice === (isDraft && !hasImage ? '3' : isDraft || !hasImage ? '2' : '1'))) {
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
                setShowManualAddModal(true);
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
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>Manual Post</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span>Reminder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span>Listing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-gray-600"></div>
            <span>No Image</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-600"></div>
            <span>Draft</span>
          </div>
        </div>
      </div>

        {/* Manual Add Modal */}
        {showManualAddModal && selectedDate && (
          <ManualAddModal
            selectedDate={selectedDate}
            onClose={() => {
              setShowManualAddModal(false);
              setSelectedDate(null);
            }}
            onAdd={(entry) => {
              setEntries(prev => [...prev, entry]);
              setShowManualAddModal(false);
              setSelectedDate(null);
              showToast.success('Post added to calendar!');
            }}
          />
        )}

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
}

// Manual Add Modal Component
interface ManualAddModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAdd: (entry: CalendarEntry) => void;
}

function ManualAddModal({ selectedDate, onClose, onAdd }: ManualAddModalProps) {
  const { user } = useAuth();
  const [addType, setAddType] = useState<'post' | 'reminder' | 'event'>('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'both'>('facebook');
  const [hashtags, setHashtags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast.error('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

      let entryData: any = {
        title: title.trim(),
        content_type: addType === 'post' ? 'manual' : addType,
        platform: addType === 'post' ? platform : 'both',
        caption: content.trim(),
        scheduled_date: selectedDate.toISOString(),
        status: 'draft',
      };

      // Add hashtags if provided
      if (hashtags.trim()) {
        entryData.hashtags = hashtags.split(',').map((tag: string) => tag.trim().replace('#', ''));
      }

      // Add specific fields based on type
      if (addType === 'reminder') {
        entryData.caption = `⏰ Reminder: ${content.trim()}`;
      } else if (addType === 'event') {
        entryData.caption = `📅 Event: ${content.trim()}`;
      }

      const response = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add entry');
      }

      const data = await response.json();
      onAdd(data.entry);
    } catch (error: any) {
      console.error('Add entry error:', error);
      showToast.error(error.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const getPlaceholder = () => {
    switch (addType) {
      case 'post':
        return 'Write your post caption here...';
      case 'reminder':
        return 'What should you be reminded about?';
      case 'event':
        return 'Describe the event details...';
      default:
        return 'Enter content...';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Add to Calendar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to add?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'post', label: '📝 Post', desc: 'Social media post' },
                { value: 'reminder', label: '⏰ Reminder', desc: 'Personal reminder' },
                { value: 'event', label: '📅 Event', desc: 'Calendar event' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setAddType(option.value as any)}
                  className={`p-3 rounded-lg border-2 text-center transition-all text-xs ${
                    addType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-gray-500 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {addType === 'post' ? 'Caption' : 'Description'}
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholder()}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Platform (only for posts) */}
          {addType === 'post' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'both', label: 'Both' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPlatform(option.value as any)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      platform === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags (only for posts) */}
          {addType === 'post' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags (optional)
              </label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="summer, realestate, home"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate with commas, no # needed
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saving}
              disabled={!title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add to Calendar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to show post details (toast for now, could be modal)
function showPostDetails(entry: CalendarEntry) {
  console.log('Post details:', entry);
  // TODO: Implement detailed view modal
}
