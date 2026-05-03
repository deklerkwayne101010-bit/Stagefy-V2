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
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEntry | null>(null);

  // Fetch calendar entries
  const fetchEntries = useCallback(async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login?redirect=/dashboard/calendar');
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

  // Generate post content with AI
  const generateContentForEntry = async (entry: CalendarEntry) => {
    setGeneratingContent(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

      showToast.info('Generating engaging post content...');

      // Call AI content generation API
      const response = await fetch('/api/ai/content-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          custom_request: `Create an engaging social media post for: "${entry.title}". Make it optimized for ${entry.platform === 'both' ? 'both Facebook and Instagram' : entry.platform}. Include a compelling caption, relevant hashtags, and make it perfect for real estate marketing.`,
          duration: '1_week',
          frequency: 'twice_week',
          platforms: entry.platform === 'both' ? ['facebook', 'instagram'] : [entry.platform],
          topics: [entry.content_type],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      const generatedPost = data.plan[0]; // Get the first generated post

      // Update the calendar entry with the new content
      await fetch('/api/content/calendar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: entry.id,
          title: generatedPost.title || entry.title,
          caption: generatedPost.suggested_caption,
          hashtags: generatedPost.hashtags,
          content_type: 'manual', // Mark as manually enhanced
        }),
      });

      // Update local state
      setEntries(prev => prev.map(e =>
        e.id === entry.id
          ? {
              ...e,
              title: generatedPost.title || e.title,
              caption: generatedPost.suggested_caption,
              hashtags: generatedPost.hashtags,
              content_type: 'manual'
            }
          : e
      ));

      showToast.success('Post content generated with AI!');
    } catch (error: any) {
      console.error('Content generation error:', error);
      showToast.error(error.message || 'Failed to generate content');
    } finally {
      setGeneratingContent(false);
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
    const url = window.location.origin + '/dashboard/calendar';
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

  // Handle event click - show detailed modal
  const handleEventClick = (info: any) => {
    const entry = entries.find(e => e.id === info.event.id);
    if (entry) {
      setSelectedEvent(entry);
      setShowEventModal(true);
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

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <EventModal
            entry={selectedEvent}
            onClose={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
            onGenerateImage={generateImageForEntry}
            onGenerateContent={generateContentForEntry}
            onShare={handleManualShare}
            onUpdate={(updatedEntry) => {
              setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
          />
        )}

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

// Event Details Modal Component
interface EventModalProps {
  entry: CalendarEntry;
  onClose: () => void;
  onGenerateImage: (entry: CalendarEntry) => void;
  onGenerateContent: (entry: CalendarEntry) => void;
  onShare: (entry: CalendarEntry, platform: 'facebook' | 'instagram') => void;
  onUpdate: (entry: CalendarEntry) => void;
}

function EventModal({ entry, onClose, onGenerateImage, onGenerateContent, onShare, onUpdate }: EventModalProps) {
  const { user } = useAuth();
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      await onGenerateImage(entry);
      // The generateImageForEntry function will update the entries state
      // We need to close and reopen to show the updated image
      setTimeout(() => {
        window.location.reload(); // Simple refresh to show new image
      }, 1000);
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateContent = async () => {
    setGeneratingContent(true);
    try {
      await onGenerateContent(entry);
      // The content will be updated in the parent component
      showToast.success('Content updated successfully!');
    } catch (error) {
      console.error('Content generation failed:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleShare = (platform: 'facebook' | 'instagram') => {
    onShare(entry, platform);
    onClose();
  };

  const getContentTypeInfo = (contentType: string) => {
    const types = {
      manual: { icon: '📝', label: 'Manual Post', color: 'blue' },
      reminder: { icon: '⏰', label: 'Reminder', color: 'orange' },
      event: { icon: '📅', label: 'Event', color: 'green' },
      listing: { icon: '🏠', label: 'Listing Post', color: 'purple' },
      market_update: { icon: '📈', label: 'Market Update', color: 'indigo' },
      testimonial: { icon: '💬', label: 'Testimonial', color: 'pink' },
      open_house: { icon: '🏡', label: 'Open House', color: 'red' },
      promo: { icon: '🎉', label: 'Promotion', color: 'yellow' },
    };
    return types[contentType as keyof typeof types] || types.manual;
  };

  const typeInfo = getContentTypeInfo(entry.content_type);
  const hasImage = !!entry.generated_image_url;
  const isDraft = entry.status === 'draft';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center`}>
                <span className="text-2xl">{typeInfo.icon}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{entry.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    entry.status === 'published' ? 'bg-green-100 text-green-700' :
                    entry.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {entry.status}
                  </span>
                  <span className="text-sm text-gray-500">{typeInfo.label}</span>
                  {isDraft && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Content */}
            <div className="space-y-4">
              {/* Image Preview */}
              {hasImage ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Generated Image</label>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={entry.generated_image_url!}
                      alt={entry.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              ) : entry.content_type === 'manual' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl text-gray-400">📷</span>
                      <p className="text-sm text-gray-500 mt-2">No image generated yet</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Caption/Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {entry.content_type === 'post' || entry.content_type === 'manual' ? 'Caption' : 'Description'}
                </label>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  <p className="text-gray-900 whitespace-pre-wrap">{entry.caption}</p>
                </div>
              </div>

              {/* Hashtags (for posts) */}
              {(entry.content_type === 'post' || entry.content_type === 'manual') && entry.hashtags && entry.hashtags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                  <div className="flex flex-wrap gap-2">
                    {entry.hashtags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900">
                    {new Date(entry.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-4">
              {/* Platform Info */}
              {(entry.content_type === 'post' || entry.content_type === 'manual') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                  <div className="flex gap-2">
                    {entry.platform === 'both' ? (
                      <>
                        <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">Facebook</span>
                        <span className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium">Instagram</span>
                      </>
                    ) : (
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        entry.platform === 'facebook'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {entry.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Actions</label>
                <div className="space-y-2">
                  {/* Generate Content with AI */}
                  {(entry.content_type === 'post' || entry.content_type === 'manual') && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Enhancement</div>
                      <Button
                        onClick={handleGenerateContent}
                        loading={generatingContent}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        {generatingContent ? 'Generating...' : '🤖 Generate AI Content'}
                      </Button>
                      <p className="text-xs text-gray-500">
                        Create engaging captions and hashtags optimized for social media
                      </p>
                    </div>
                  )}

                  {/* Generate Image (for manual posts without images) */}
                  {!hasImage && entry.content_type === 'manual' && (
                    <Button
                      onClick={handleGenerateImage}
                      loading={generatingImage}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingImage ? 'Generating...' : '🎨 Generate Image'}
                    </Button>
                  )}

                  {/* Share buttons (for posts) */}
                  {(entry.content_type === 'post' || entry.content_type === 'manual') && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Share to Social Media</div>
                      {entry.platform === 'both' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleShare('facebook')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            📘 Facebook
                          </Button>
                          <Button
                            onClick={() => handleShare('instagram')}
                            className="bg-pink-600 hover:bg-pink-700 text-white"
                          >
                            📷 Instagram
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleShare(entry.platform as 'facebook' | 'instagram')}
                          className={`w-full ${
                            entry.platform === 'facebook'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-pink-600 hover:bg-pink-700'
                          } text-white`}
                        >
                          📤 Share to {entry.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Edit button (for drafts) */}
                  {isDraft && (
                    <Button
                      onClick={() => showToast.info('Edit functionality coming soon!')}
                      variant="outline"
                      className="w-full"
                    >
                      ✏️ Edit Post
                    </Button>
                  )}

                  {/* Mark as complete (for reminders/events) */}
                  {(entry.content_type === 'reminder' || entry.content_type === 'event') && (
                    <Button
                      onClick={() => {
                        showToast.success('Marked as completed!');
                        onClose();
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      ✅ Mark as Completed
                    </Button>
                  )}
                </div>
              </div>

              {/* Content Quality Score */}
              {(entry.content_type === 'post' || entry.content_type === 'manual') && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Content Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Caption Length</span>
                      <span className={`text-sm font-medium ${
                        entry.caption.length > 100 ? 'text-green-600' :
                        entry.caption.length > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {entry.caption.length} chars
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hashtags</span>
                      <span className={`text-sm font-medium ${
                        entry.hashtags && entry.hashtags.length >= 5 ? 'text-green-600' :
                        entry.hashtags && entry.hashtags.length >= 3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {entry.hashtags?.length || 0} tags
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Visual</span>
                      <span className={`text-sm font-medium ${
                        hasImage ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {hasImage ? '✅ Ready' : '⚠️ Missing'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-700">
                      💡 Tip: Great content has 100+ characters, 5+ hashtags, and an engaging image
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Content Type: <span className="font-medium">{typeInfo.label}</span></div>
                  <div>Status: <span className="font-medium capitalize">{entry.status}</span></div>
                  {entry.created_at && (
                    <div>Created: <span className="font-medium">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span></div>
                  )}
                </div>
              </div>
            </div>
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
