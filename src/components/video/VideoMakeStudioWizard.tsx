'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { useAuth } from '@/lib/auth-context'
import { uploadImage } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import {
  type AgentProfile,
  type VideoEditorFormat,
  formatBytes,
  generateCallingCardPng,
  videoEditorFormats,
} from './videoEditorHelpers'

type VideoMakeStudioStep = 'format' | 'images' | 'calling_card' | 'generate' | 'review' | 'transition' | 'finish'

const MAX_IMAGES = 30
const MIN_IMAGES = 3
const CREDIT_COST_STITCH = 1

const AUTO_PROMPT = `STRICT RULES: Use ONLY what is already visible in this photo. Do NOT add, remove, invent, or alter ANY objects, furniture, people, animals, plants, vehicles, structures, fixtures, walls, floors, ceilings, windows, doors, or decor. Do NOT change colors, textures, lighting conditions, time of day, weather, or architectural details. Stay completely within the original frame and image bounds — no new elements outside what is shown. The ONLY change allowed is gentle camera movement to create a smooth property walkthrough effect: a slow push-in toward the main visible space, then a gentle pan across exactly what is already there. No zooms, no rotations, no warping, no morphing, no new viewpoints, no extra rooms, no imaginary features. The result must look like the same photo, just filmed as a smooth natural walkthrough.`

interface BatchClip {
  id: string
  imageIndex: number
  imageUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputUrl: string | null
  error: string | null
  creditsUsed: number
}

export function VideoMakeStudioWizard() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<VideoMakeStudioStep>('format')
  const [format, setFormat] = useState<VideoEditorFormat>(videoEditorFormats[0])
  const [images, setImages] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('5')
  const [tier, setTier] = useState<'standard' | 'pro'>('pro')
  const [callingCardEnabled, setCallingCardEnabled] = useState(true)
  const [muteAudio, setMuteAudio] = useState(true)
  const [headline, setHeadline] = useState('Let\'s find your next home')
  const [cta, setCta] = useState('Call or WhatsApp me today')
  const [propertyPrice, setPropertyPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [callingCardColor, setCallingCardColor] = useState('#0f172a')
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null)
  const [agentProfileMissing, setAgentProfileMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const steps: { key: VideoMakeStudioStep; label: string }[] = [
    { key: 'format', label: 'Format' },
    { key: 'images', label: 'Images' },
    { key: 'calling_card', label: 'Calling Card' },
    { key: 'generate', label: 'Generate' },
    { key: 'review', label: 'Review' },
    { key: 'transition', label: 'Transition' },
    { key: 'finish', label: 'Finish' },
  ]

  const totalClipCost = useMemo(() => {
    const durationNumber = parseInt(duration, 10)
    return images.reduce((sum, _, i) => sum + (tier === 'standard' ? durationNumber : Math.ceil(durationNumber * (5 / 3))), 0)
  }, [images.length, duration, tier])

  const normalizedCallingCardColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(callingCardColor) ? callingCardColor : '#0f172a'

  const canStartBatch = images.length >= MIN_IMAGES

  useEffect(() => {
    if (!user?.id) return
    void loadAgentProfile()
  }, [user?.id])

  async function loadAgentProfile() {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/agent-profile', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await response.json()
      if (data.profile) {
        setAgentProfile(data.profile)
        setAgentProfileMissing(false)
        if (data.profile.name_surname) {
          setHeadline(`${data.profile.name_surname} | Real Estate Agent`)
        }
      } else {
        setAgentProfile(null)
        setAgentProfileMissing(true)
      }
    } catch {
      setAgentProfile(null)
      setAgentProfileMissing(true)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = MAX_IMAGES - images.length
    if (remainingSlots <= 0) {
      setError(`You can add up to ${MAX_IMAGES} images.`)
      e.target.value = ''
      return
    }

    const filesToAdd = files.slice(0, remainingSlots)
    setIsUploading(true)
    setError(null)

    const newImages: string[] = []
    const newImageUrls: string[] = []

    for (const file of filesToAdd) {
      try {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        newImages.push(dataUrl)

        if (user?.id) {
          const { data, error } = await uploadImage(file, user.id)
          if (!error && data) {
            newImageUrls.push(data.url)
          } else {
            newImageUrls.push(dataUrl)
          }
        } else {
          newImageUrls.push(dataUrl)
        }
      } catch {
        setError(`Could not read ${file.name}. Try a different image file.`)
      }
    }

    setImages(prev => [...prev, ...newImages])
    setImageUrls(prev => [...prev, ...newImageUrls])
    setIsUploading(false)
    e.target.value = ''
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  function handleNext() {
    if (step === 'format') {
      setStep('images')
      return
    }
    if (step === 'images') {
      if (images.length < MIN_IMAGES) {
        setError(`Add at least ${MIN_IMAGES} images to continue.`)
        return
      }
      setStep('calling_card')
      return
    }
    if (step === 'calling_card') {
      setStep('generate')
    }
  }

  function handleBack() {
    if (step === 'images') setStep('format')
    else if (step === 'calling_card') setStep('images')
    else if (step === 'generate') setStep('calling_card')
  }

  const agentDisplayName = agentProfile?.name_surname || 'Agent'
  const agentDetails = [agentProfile?.phone, agentProfile?.email, agentProfile?.agency_brand].filter(Boolean).join(' • ')
  const currentStepIndex = steps.findIndex(item => item.key === step)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Video Make Studio"
          subtitle="Turn your images into a stitched video with an optional calling card"
          action={<CreditBadge credits={user?.credits || 0} size="sm" />}
        />

        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {steps.map((item, index) => (
              <div key={item.key} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    index <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-sm font-medium ${index <= currentStepIndex ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {index < steps.length - 1 && <span className="w-6 border-t border-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'format' && (
          <div className="grid gap-4 sm:grid-cols-3">
            {videoEditorFormats.map(option => (
              <button
                key={option.key}
                onClick={() => setFormat(option)}
                className={`rounded-2xl border-2 p-5 text-left transition-all ${
                  format.key === option.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`mx-auto mb-4 rounded-lg bg-slate-900 ${option.key === 'landscape' ? 'aspect-video' : option.key === 'square' ? 'aspect-square' : 'aspect-[9/16]'}`} />
                <p className="font-semibold text-slate-900">{option.label}</p>
                <p className="mt-1 text-sm text-slate-500">{option.width}×{option.height}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'images' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">Upload images</p>
                <p className="text-sm text-slate-500">Add {MIN_IMAGES}-{MAX_IMAGES} images. Each image will become a video clip.</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || images.length >= MAX_IMAGES}>
                Add Images
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <img src={img} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">Image {index + 1}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => removeImage(index)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {images.length === 0 && (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500">
                  <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No images added yet.</p>
                </div>
              )}
            </div>

            {isUploading && <p className="text-sm text-slate-500">Reading images...</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Video Duration"
                value={duration}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDuration(e.target.value)}
                options={[
                  { value: '3', label: '3 seconds' },
                  { value: '5', label: '5 seconds' },
                  { value: '10', label: '10 seconds' },
                  { value: '15', label: '15 seconds' },
                ]}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quality Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTier('standard')}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      tier === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-slate-900">Standard</p>
                    <p className="text-xs text-slate-500">{parseInt(duration)} credits/sec</p>
                  </button>
                  <button
                    onClick={() => setTier('pro')}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      tier === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-slate-900">Pro</p>
                    <p className="text-xs text-slate-500">{Math.ceil(parseInt(duration) * (5 / 3))} credits/sec</p>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Textarea
                label="Motion Prompt (optional)"
                placeholder="Describe the motion you want..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrompt(AUTO_PROMPT)}
                className="mt-2"
              >
                Use Auto Video Maker
              </Button>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Images</span>
                <span className="font-medium">{images.length}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-600">Estimated Clip Cost</span>
                <span className="font-medium">{totalClipCost} credits</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Total Batch Cost</span>
                <span className="font-semibold">{totalClipCost + CREDIT_COST_STITCH} credits</span>
              </div>
            </div>
          </div>
        )}

        {step === 'calling_card' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input type="checkbox" checked={callingCardEnabled} onChange={event => setCallingCardEnabled(event.target.checked)} className="h-4 w-4" />
                <span className="font-medium text-slate-900">Add bottom calling card</span>
              </label>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Property details</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Price" value={propertyPrice} onChange={event => setPropertyPrice(event.target.value)} placeholder="R2,950,000" />
                  <Input label="Bedrooms" value={bedrooms} onChange={event => setBedrooms(event.target.value)} placeholder="3" />
                  <Input label="Bathrooms" value={bathrooms} onChange={event => setBathrooms(event.target.value)} placeholder="2" />
                </div>
              </div>

              {callingCardEnabled && (
                <>
                  {agentProfileMissing && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Set up your agent profile to personalize this video</p>
                      <p className="mt-1 text-sm text-amber-700">Add your name, photo, phone, email, and agency logo so your calling card looks professional.</p>
                      <button
                        type="button"
                        onClick={() => router.push('/templates')}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                      >
                        Set up agent profile
                      </button>
                    </div>
                  )}
                  <Input label="Headline" value={headline} onChange={event => setHeadline(event.target.value)} />
                  <Input label="Call to action" value={cta} onChange={event => setCta(event.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Calling card colour</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={callingCardColor}
                        onChange={event => setCallingCardColor(event.target.value)}
                        className="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1"
                      />
                      <Input
                        type="text"
                        value={callingCardColor}
                        onChange={event => setCallingCardColor(event.target.value)}
                        placeholder="#0f172a"
                        className="uppercase"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-900">Using profile</p>
                    <p className="mt-1 text-sm text-slate-500">{agentDisplayName}</p>
                    {agentDetails && <p className="mt-1 text-sm text-slate-500">{agentDetails}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-slate-800">
                <div className="absolute inset-x-0 bottom-0 min-h-[22%] p-3 text-white" style={{ background: `linear-gradient(to top, ${normalizedCallingCardColor}, rgba(15, 23, 42, 0.92))` }}>
                  <div className="relative z-10 flex h-full items-end gap-4 pr-32">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-base font-extrabold leading-tight text-white">{headline || 'Real Estate Agent'}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-100">{agentDisplayName}</p>
                      {propertyPrice || bedrooms || bathrooms ? (
                        <p className="mt-1 truncate text-xs font-semibold text-blue-100">
                          {['Property details:', propertyPrice ? `Price: ${propertyPrice}` : '', bedrooms ? `${bedrooms} bed${bedrooms === '1' ? '' : 's'}` : '', bathrooms ? `${bathrooms} bath${bathrooms === '1' ? '' : 's'}` : ''].filter(Boolean).join(' ')}
                        </p>
                      ) : null}
                      {agentDetails && <p className="mt-1 truncate text-[11px] text-slate-200">{agentDetails}</p>}
                      <p className="mt-1.5 truncate text-xs font-extrabold uppercase tracking-wide text-blue-100">{cta}</p>
                    </div>
                  </div>
                  {agentProfile?.logo_url && (
                    <div
                      className="absolute right-4 top-4 h-32 w-56 rounded-2xl bg-white/90 p-2 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${agentProfile.logo_url})` } as React.CSSProperties}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={handleBack} disabled={step === 'format'}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={step === 'images' && !canStartBatch}>
            {step === 'calling_card' ? 'Start Generation' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
