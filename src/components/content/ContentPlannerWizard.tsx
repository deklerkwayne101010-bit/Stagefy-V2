// Content Planner Wizard - Multi-step wizard for generating and scheduling social media content
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { showToast } from '@/lib/toast';
import Image from 'next/image';

interface WizardStep {
  id: string;
  label: string;
}

interface PlanPost {
  title: string;
  description: string;
  category: string;
  suggested_caption: string;
  hashtags: string[];
  visual_type: string;
  visual_style_description: string;
  suggested_date: string;
  generated_image_url?: string;
  template_prompt?: string;
  is_recurring?: boolean;
  recurrence_pattern?: Record<string, any>;
  platform: 'facebook' | 'instagram' | 'both';
  editable?: boolean;
}

interface ContentPlannerWizardProps {
  onClose: () => void;
  onComplete: (plan: { posts: PlanPost[]; total_credits: number }) => void;
}

type WizardStepType = 'duration' | 'review' | 'generating';

export default function ContentPlannerWizard({
  onClose,
  onComplete,
}: ContentPlannerWizardProps) {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<WizardStepType>('duration');
  const [duration, setDuration] = useState<'1_week' | '2_weeks' | '1_month'>('1_week');
  const [frequency, setFrequency] = useState<'twice_week' | 'three_times_week' | 'daily' | 'weekdays_only'>('twice_week');
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topics, setTopics] = useState<string[]>([]);

  const [generatedPlan, setGeneratedPlan] = useState<PlanPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);
  const [userCredits, setUserCredits] = useState<number>(10);

  // Agent profile state (loaded from database)
  const [agentProfile, setAgentProfile] = useState<{ name_surname: string; agency_brand?: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch agent profile on mount
  useEffect(() => {
    const fetchAgentProfile = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoadingProfile(false);
          return;
        }

        const response = await fetch('/api/agent-profile', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setAgentProfile({
              name_surname: data.profile.name_surname,
              agency_brand: data.profile.agency_brand,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching agent profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchAgentProfile();
  }, []);

  // Calculate post count
  const getPostCount = () => {
    const days = duration === '1_week' ? 7 : duration === '2_weeks' ? 14 : 30;
    const postsPerWeek = frequency === 'twice_week' ? 2 : frequency === 'three_times_week' ? 3 : frequency === 'daily' ? 7 : 5;
    return Math.ceil((days / 7) * postsPerWeek);
  };

  // Step navigation
  const steps: WizardStep[] = [
    { id: 'duration', label: 'Duration & Frequency' },
    { id: 'generating', label: 'Generating' },
    { id: 'review', label: 'Review & Edit' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Generate content plan
  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

      // Call content plan API
      const response = await fetch('/api/ai/content-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
          body: JSON.stringify({
            duration,
            frequency,
            platforms,
            start_date: startDate,
            topics: topics.length > 0 ? topics : undefined,
            agent_profile: {
              name: agentProfile?.name_surname || user?.full_name || user?.email,
              agency: agentProfile?.agency_brand || user?.brokerage,
            },
          }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate plan');
      }

      const data = await response.json();
      const planWithPlatforms = data.plan.map((post: any) => ({
        ...post,
        platform: platforms.length === 1 ? platforms[0] : (Math.random() > 0.5 ? 'facebook' : 'instagram'),
      }));

      setGeneratedPlan(planWithPlatforms);
      setTotalCredits(2 + planWithPlatforms.length * 5); // 2 for plan + 5 per visual
      setCurrentStep('review');
      showToast.success(`Generated ${planWithPlatforms.length} content ideas!`);
    } catch (error: any) {
      console.error('Plan generation error:', error);
      showToast.error(error.message || 'Failed to generate content plan');
    } finally {
      setGenerating(false);
    }
  };

  // Generate template for a single post
  const generateTemplate = async (post: PlanPost, index: number): Promise<string | null> => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return null;

      // Build prompt based on visual_type and visual_style_description
      const templateWizardType = post.visual_type === 'agent_showcase' ? 'agent_showcase' : 'professional';

      // Use the existing template generation API
      const response = await fetch('/api/ai/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: templateWizardType,
          version: 'standard',
          prompt: `Create a ${post.visual_style_description} for a real estate ${post.category} post. ${post.suggested_caption}`,
          customOptions: {
            colorTheme: 'agency',
            aspectRatio: '1:1',
          },
        }),
      });

      if (!response.ok) {
        console.error(`Template generation failed for post ${index}:`, response.status);
        return null;
      }

      const data = await response.json();
      return data.outputUrl || null;
    } catch (error) {
      console.error(`Error generating template for post ${index}:`, error);
      return null;
    }
  };

  // Generate templates for all posts (visuals)
  const generateAllTemplates = async () => {
    setGenerating(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

       // Check credits - actual check done in API endpoint which reserves credits
       // if user doesn't have enough - let the API handle it

      // Generate templates in parallel
      const templatePromises = generatedPlan.map((post, index) =>
        generateTemplate(post, index)
      );

      const imageUrls = await Promise.all(templatePromises);

       // Update plan with generated images
       const updatedPlan = generatedPlan.map((post, index) => ({
         ...post,
         generated_image_url: imageUrls[index] ?? undefined,
       }));

      setGeneratedPlan(updatedPlan);
      setCurrentStep('review');
      showToast.success('All visuals generated!');
    } catch (error: any) {
      console.error('Template generation error:', error);
      showToast.error('Failed to generate some visuals');
    } finally {
      setGenerating(false);
    }
  };

  // Handle post edit (inline)
  const handleUpdatePost = (index: number, updates: Partial<PlanPost>) => {
    setGeneratedPlan(prev =>
      prev.map((post, i) => (i === index ? { ...post, ...updates } : post))
    );
  };

  // Remove post from plan
  const handleRemovePost = (index: number) => {
    setGeneratedPlan(prev => prev.filter((_, i) => i !== index));
    setTotalCredits(2 + generatedPlan.length * 5 - 5); // Refund one visual credit
  };

  // Regenerate single post visual
  const handleRegeneratePost = async (index: number) => {
    const post = generatedPlan[index];
    if (!post) return;

    showToast.info('Regenerating visual...');
    const newImageUrl = await generateTemplate(post, index);

    if (newImageUrl) {
      handleUpdatePost(index, { generated_image_url: newImageUrl });
      showToast.success('Visual regenerated!');
    } else {
      showToast.error('Failed to regenerate visual');
    }
  };

  // Finalize schedule
  const handleScheduleAll = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast.error('Please login to continue');
        return;
      }

      // Check if all posts have images
      const missingImages = generatedPlan.filter(p => !p.generated_image_url);
      if (missingImages.length > 0) {
        showToast.error(`Missing images for ${missingImages.length} posts. Please generate or remove them.`);
        return;
      }

      // Verify social accounts connected
      const { data: fbAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('platform', 'facebook')
        .eq('is_active', true)
        .single();

      const { data: igAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .single();

      if (!fbAccount || !igAccount) {
        showToast.error('Please connect both Facebook and Instagram accounts before scheduling.');
        return;
      }

      // Create all calendar entries
      for (const post of generatedPlan) {
        await fetch('/api/content/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
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

      showToast.success(`Scheduled ${generatedPlan.length} posts successfully!`);
      onComplete({ posts: generatedPlan, total_credits: totalCredits });
      onClose();
    } catch (error: any) {
      console.error('Schedule error:', error);
      showToast.error('Failed to schedule posts');
    }
  };

  // Step content
  const renderStep = () => {
    switch (currentStep) {
      case 'duration':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Plan Your Content</h3>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '1_week', label: '1 Week' },
                  { value: '2_weeks', label: '2 Weeks' },
                  { value: '1_month', label: '1 Month' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value as any)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      duration === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Posts Per Week
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'twice_week', label: '2 times/week' },
                  { value: 'three_times_week', label: '3 times/week' },
                  { value: 'daily', label: 'Every day' },
                  { value: 'weekdays_only', label: 'Weekdays only' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFrequency(opt.value as any)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      frequency === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total posts: ~{getPostCount()} for {duration.replace('_', ' ')}
              </p>
            </div>

            {/* Topics (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Topics (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'listing', 'market_update', 'testimonial', 'buyers_guide',
                  'open_house', 'community', 'tip', 'promo', 'personal_brand'
                ].map(topic => (
                  <button
                    key={topic}
                    onClick={() => {
                      setTopics(prev =>
                        prev.includes(topic)
                          ? prev.filter(t => t !== topic)
                          : [...prev, topic]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      topics.includes(topic)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {topic.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty for AI-chosen diverse mix</p>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platforms (both required)
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={platforms.includes('facebook')}
                    onChange={e => {
                      if (e.target.checked) {
                        setPlatforms(prev => [...prev, 'facebook']);
                      } else {
                        setPlatforms(prev => prev.filter(p => p !== 'facebook'));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>Facebook</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={platforms.includes('instagram')}
                    onChange={e => {
                      if (e.target.checked) {
                        setPlatforms(prev => [...prev, 'instagram']);
                      } else {
                        setPlatforms(prev => prev.filter(p => p !== 'instagram'));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>Instagram</span>
                </label>
              </div>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePlan}
                disabled={generating || platforms.length < 2}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Generate Content Plan
              </Button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Review Your Content Plan
              </h3>
              <div className="text-sm text-gray-600">
                {generatedPlan.length} posts • {totalCredits} credits
              </div>
            </div>

            {/* Posts list */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {generatedPlan.map((post, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail placeholder */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {post.generated_image_url ? (
                        <Image
                          src={post.generated_image_url}
                          alt={post.title}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-2xl">📷</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          post.platform === 'facebook' ? 'bg-blue-100 text-blue-700' :
                          post.platform === 'instagram' ? 'bg-pink-100 text-pink-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {post.platform}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {post.suggested_caption}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.hashtags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs text-blue-600">
                            {tag}
                          </span>
                        ))}
                        {post.hashtags.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{post.hashtags.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Recurring toggle */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={post.is_recurring}
                            onChange={e => handleUpdatePost(index, { is_recurring: e.target.checked })}
                            className="w-3 h-3"
                          />
                          <span>Recurring</span>
                        </label>
                        {post.is_recurring && (
                          <select
                            value={post.recurrence_pattern?.frequency || 'weekly'}
                            onChange={e => handleUpdatePost(index, {
                              recurrence_pattern: {
                                ...post.recurrence_pattern,
                                frequency: e.target.value,
                              }
                            })}
                            className="text-xs border rounded px-1"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegeneratePost(index)}
                        disabled={generating}
                      >
                        🔄 Visual
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Open edit modal for caption/date
                          // For MVP, just let them edit inline
                        }}
                      >
                        ✏️ Edit
                      </Button>
                       <Button
                         size="sm"
                         variant="danger"
                         onClick={() => handleRemovePost(index)}
                       >
                         ✕
                       </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep('duration')}>
                Back
              </Button>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Credits: {totalCredits}
                </div>
                <Button
                  onClick={handleScheduleAll}
                  disabled={generating || generatedPlan.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Schedule All Posts
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Content Planner</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-sm text-gray-600">{step.label}</span>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {generating ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">
                {currentStep === 'generating' ? 'Generating content plan...' : 'Creating visuals...'}
              </p>
              <p className="text-sm text-gray-500">
                This may take a few minutes
              </p>
            </div>
          ) : (
            renderStep()
          )}
        </div>
      </div>
    </div>
  );
}
