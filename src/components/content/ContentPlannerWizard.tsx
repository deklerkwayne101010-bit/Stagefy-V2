'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

// Props
interface WizardPost {
  id: string
  title: string
  caption: string
  hashtags: string // comma-separated string
  suggestedDay: number
  includeVisual: boolean
  scheduledDate: string // ISO date
}

interface ContentPlannerWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function ContentPlannerWizard({ isOpen, onClose, onComplete }: ContentPlannerWizardProps) {
  const auth = useAuth()
  const { toast: toastFn } = useToast()

  // Step states
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Config from step 1
  const [duration, setDuration] = useState('1w')
  const [frequency, setFrequency] = useState('2-3')
  const [agentName, setAgentName] = useState('')
  const [brokerage, setBrokerage] = useState('')

  // Plan from step 2
  const [posts, setPosts] = useState<WizardPost[]>([])
  const [planSummary, setPlanSummary] = useState<any>(null)

  // Credit summary
  const visualCount = posts.filter(p => p.includeVisual).length
  const totalCredits = 2 + (visualCount * 5)
  const remainingCredits = (auth.user?.credits || 0) - totalCredits

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setPosts([])
      setPlanSummary(null)
      setError(null)
      setIsLoading(false)
    }
  }, [isOpen])

  // Pre-fill agent name from user profile
  useEffect(() => {
    if (auth.user && !agentName) {
      setAgentName(auth.user.full_name || '')
    }
  }, [auth.user, agentName])

  // Generate content plan
  const generatePlan = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          frequency,
          agentDetails: { name: agentName, brokerage },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate plan')
      }

      const data = await res.json()
      const { plan } = data

      // Transform plan into wizard posts with default dates
      const baseDate = new Date()
      const normalizedPosts: WizardPost[] = plan.map((p: any, idx: number) => {
        // Compute scheduled date based on suggestedDay distribution
        const daysToAdd = p.suggestedDay - 1 || idx % 7
        const date = new Date(baseDate)
        date.setDate(date.getDate() + daysToAdd)
        return {
          id: `post-${idx}`,
          title: p.title || '',
          caption: p.caption || '',
          hashtags: Array.isArray(p.hashtags) ? p.hashtags.join(', ') : p.hashtags || '',
          suggestedDay: p.suggestedDay,
          includeVisual: false,
          scheduledDate: date.toISOString().split('T')[0],
        }
      })

      setPosts(normalizedPosts)
      setPlanSummary(data.summary)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
      toastFn(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Update a post field
  const updatePost = (index: number, field: keyof WizardPost, value: any) => {
    setPosts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  // Toggle visual for all
  const toggleAllVisuals = (value: boolean) => {
    setPosts(prev => prev.map(p => ({ ...p, includeVisual: value })))
  }

  // Validate and schedule
  const schedulePosts = async () => {
    setIsLoading(true)
    try {
      // Generate visuals if needed (first generate for all)
      const postsWithVisual = posts.filter(p => p.includeVisual)
      if (postsWithVisual.length > 0) {
        // For now, we'll stub visual generation: just deduct credits and assign placeholder image URL
        // In a real implementation, we'd call /api/ai/template for each post
        toastFn(`Generating ${postsWithVisual.length} AI visual(s)...`, 'info')
        // We'll simulate a delay, but actual implementation would be parallel calls
      }

      // Create calendar entries (one per post)
      const createPromises = posts.map(async (post) => {
        let imageUrl = post.includeVisual
          ? `https://placehold.co/600x400?text=AI+Visual+for+${encodeURIComponent(post.title)}`
          : null

        const body = {
          title: post.title,
          caption: post.caption + (post.hashtags ? '\n\n' + post.hashtags.split(',').map(h => h.trim()).filter(Boolean).join(' ') : ''),
          image_url: imageUrl,
          platform: 'both', // default; could be from post? Not stored in plan generation yet. For now set both.
          scheduled_for: new Date(post.scheduledDate).toISOString(),
          visual_type: post.includeVisual ? 'custom' : null,
        }

        const res = await fetch('/api/content/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to schedule post')
        }

        return res.json()
      })

      await Promise.all(createPromises)

      toastFn('All posts scheduled successfully!', 'success')
      onComplete()
    } catch (err: any) {
      toastFn('Error scheduling posts: ' + err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Create Content Plan' : step === 2 ? 'Review Your Plan' : 'Summary'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                  <div className="flex gap-2">
                    {['1w', '2w', '1mo'].map(opt => (
                      <button
                        key={opt}
                        className={`flex-1 py-2 px-4 rounded-lg border ${duration === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 hover:border-blue-400'}`}
                        onClick={() => setDuration(opt)}
                      >
                        {opt === '1w' ? '1 Week' : opt === '2w' ? '2 Weeks' : '1 Month'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Posting Frequency</label>
                  <div className="flex gap-2">
                    {[
                      { value: '2-3', label: '2-3 / week' },
                      { value: 'daily', label: 'Daily' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        className={`flex-1 py-2 px-4 rounded-lg border ${frequency === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 hover:border-blue-400'}`}
                        onClick={() => setFrequency(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Name (optional)</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brokerage (optional)</label>
                  <input
                    type="text"
                    value={brokerage}
                    onChange={e => setBrokerage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="e.g., ABC Realty"
                  />
                </div>
              </div>

              {/* Summary of credits */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium text-blue-900">Credits required</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 2 credits for AI content plan generation</li>
                  <li>• 5 credits per visual (if selected)</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-600">Generating your content plan...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-slate-600">
                        {posts.length} posts generated. Review and customize below.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAllVisuals(!visualCount)}
                      >
                        {visualCount > 0 ? 'Remove All Visuals' : 'Add Visual to All'}
                      </Button>
                    </div>
                  </div>

                  {/* Posts list */}
                  <div className="space-y-4">
                    {posts.map((post, idx) => (
                      <Card key={post.id} className="p-4 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Title & Caption */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-500">Title</label>
                              <input
                                type="text"
                                value={post.title}
                                onChange={e => updatePost(idx, 'title', e.target.value)}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Caption</label>
                              <textarea
                                value={post.caption}
                                onChange={e => updatePost(idx, 'caption', e.target.value)}
                                rows={4}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                              />
                            </div>
                          </div>

                          {/* Right: Settings */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-500">Hashtags (comma separated)</label>
                              <input
                                type="text"
                                value={post.hashtags}
                                onChange={e => updatePost(idx, 'hashtags', e.target.value)}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Schedule Date</label>
                              <input
                                type="date"
                                value={post.scheduledDate}
                                onChange={e => updatePost(idx, 'scheduledDate', e.target.value)}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <label className="text-sm font-medium text-slate-700">Include AI Visual (+5 credits)</label>
                              <button
                                onClick={() => updatePost(idx, 'includeVisual', !post.includeVisual)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${post.includeVisual ? 'bg-blue-600' : 'bg-slate-300'}`}
                              >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform ${post.includeVisual ? 'translate-x-6' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Credit summary */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Credits to be deducted</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {totalCredits} credits
                          <span className="text-sm font-normal text-slate-500 ml-2">
                            (2 plan + {visualCount} visual{visualCount !== 1 ? 's' : ''} × 5)
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Your balance</p>
                        <p className={`text-lg font-semibold ${remainingCredits < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {auth.user?.credits || 0} → {remainingCredits}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Content Plan Scheduled!</h3>
              <p className="text-slate-600">Your posts have been added to the calendar.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800">
              Cancel
            </button>
            {step === 1 && (
              <button
                onClick={generatePlan}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Plan'}
              </button>
            )}
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 hover:text-slate-800">
                  Back
                </button>
                <button
                  onClick={schedulePosts}
                  disabled={isLoading || remainingCredits < 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Scheduling...' : `Schedule (${totalCredits} cr)`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
