'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { useAuth } from '@/lib/auth-context'
import { uploadMedia } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import {
  type AgentProfile,
  type CallingCardOptions,
  type VideoClipItem,
  type VideoEditorFormat,
  formatBytes,
  formatDuration,
  generateCallingCardPng,
  getVideoDuration,
  videoEditorFormats,
} from './videoEditorHelpers'

type VideoEditorStep = 'format' | 'clips' | 'transition' | 'calling_card' | 'review'

const MAX_CLIPS = 10
const MAX_CLIP_SECONDS = 5
const MIN_CLIP_SECONDS = 1
const CREDIT_COST = 1
const TRANSITION_OPTIONS = [
  { value: '0.3', label: 'Fast - 0.3s' },
  { value: '0.5', label: 'Smooth - 0.5s' },
  { value: '0.8', label: 'Soft - 0.8s' },
]

interface VideoEditorWizardProps {
  isOpen?: boolean
}

export function VideoEditorWizard({ isOpen = true }: VideoEditorWizardProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [step, setStep] = useState<VideoEditorStep>('format')
  const [format, setFormat] = useState<VideoEditorFormat>(videoEditorFormats[0])
  const [clips, setClips] = useState<VideoClipItem[]>([])
  const [transitionDuration, setTransitionDuration] = useState(0.5)
  const [callingCardEnabled, setCallingCardEnabled] = useState(true)
  const [muteAudio, setMuteAudio] = useState(true)
  const [headline, setHeadline] = useState('Let’s find your next home')
  const [cta, setCta] = useState('Call or WhatsApp me today')
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [userCredits, setUserCredits] = useState(user?.credits || 0)

  const steps: { key: VideoEditorStep; label: string }[] = [
    { key: 'format', label: 'Format' },
    { key: 'clips', label: 'Clips' },
    { key: 'transition', label: 'Transition' },
    { key: 'calling_card', label: 'Calling Card' },
    { key: 'review', label: 'Review' },
  ]

  const estimatedDuration = useMemo(() => {
    const totalClipDuration = clips.reduce((total, clip) => total + clip.trimmedDuration, 0)
    const totalTransitionDuration = Math.max(0, clips.length - 1) * transitionDuration
    return Math.max(0, totalClipDuration - totalTransitionDuration)
  }, [clips, transitionDuration])

  const canGenerate = clips.length >= 2 && !isExporting

  useEffect(() => {
    if (!isOpen) return
    void loadAgentProfile()
  }, [isOpen])

  useEffect(() => {
    return () => {
      clips.forEach(clip => URL.revokeObjectURL(clip.url))
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      ffmpegRef.current?.terminate()
    }
  }, [clips, resultUrl])

  if (!isOpen) return null

  const currentStepIndex = steps.findIndex(item => item.key === step)

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
        if (data.profile.name_surname) {
          setHeadline(`${data.profile.name_surname} | Real Estate Agent`)
        }
      }
    } catch {
      setAgentProfile(null)
    }
  }

  function isVideoFile(file: File) {
    return file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name)
  }

  function createId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter(isVideoFile)
    if (files.length === 0) {
      setError('Please select video files only.')
      return
    }

    const remainingSlots = MAX_CLIPS - clips.length
    if (remainingSlots <= 0) {
      setError(`You can add up to ${MAX_CLIPS} clips.`)
      event.target.value = ''
      return
    }

    const filesToAdd = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more clip${remainingSlots === 1 ? '' : 's'} can be added.`)
    }

    setIsUploading(true)
    setError(null)

    const newClips: VideoClipItem[] = []

    for (const file of filesToAdd) {
      try {
        const duration = await getVideoDuration(file)
        if (duration < MIN_CLIP_SECONDS) {
          setError(`${file.name} is shorter than ${MIN_CLIP_SECONDS} second.`)
          continue
        }

        const trimmedDuration = Math.min(duration, MAX_CLIP_SECONDS)
        const url = URL.createObjectURL(file)
        newClips.push({
          id: createId(),
          file,
          name: file.name,
          url,
          duration,
          trimmedDuration,
          warning: duration > MAX_CLIP_SECONDS ? `Trimmed to ${MAX_CLIP_SECONDS}s` : undefined,
        })
      } catch {
        setError(`Could not read ${file.name}. Try a different video file.`)
      }
    }

    setClips(prev => [...prev, ...newClips])
    setIsUploading(false)
    event.target.value = ''
  }

  function removeClip(index: number) {
    setClips(prev => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((_, clipIndex) => clipIndex !== index)
    })
  }

  function moveClip(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= clips.length) return
    setClips(prev => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  function handleNext() {
    if (step === 'format') {
      setStep('clips')
      return
    }

    if (step === 'clips') {
      if (clips.length < 2) {
        setError('Add at least 2 clips to continue.')
        return
      }
      setStep('transition')
      return
    }

    if (step === 'transition') {
      setStep('calling_card')
      return
    }

    if (step === 'calling_card') {
      setStep('review')
    }
  }

  function handleBack() {
    if (step === 'clips') {
      setStep('format')
    } else if (step === 'transition') {
      setStep('clips')
    } else if (step === 'calling_card') {
      setStep('transition')
    } else if (step === 'review') {
      setStep('calling_card')
    }
  }

  async function handleExport() {
    if (!canGenerate) {
      setError('Add at least 2 clips before generating.')
      return
    }

    setError(null)
    setResultUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setResultBlob(null)
    setLogs([])
    setProgress(0)
    setIsExporting(true)

    let creditsReserved = false
    let creditReference = ''

    try {
      if (user?.id) {
        const { canPerformAction, reserveCredits } = await import('@/lib/credits')
        const canPerform = await canPerformAction(user.id, CREDIT_COST)
        if (!canPerform.canPerform) {
          setError(canPerform.error || 'Not enough credits.')
          setIsExporting(false)
          return
        }

        creditReference = `video-editor-${Date.now()}`
        const reservation = await reserveCredits(user.id, 'video_editor_simple', creditReference, CREDIT_COST)
        if (!reservation.success) {
          setError(reservation.error || 'Failed to reserve credits.')
          setIsExporting(false)
          return
        }
        creditsReserved = true
      }

      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

      let ffmpeg = ffmpegRef.current
      if (!ffmpeg) {
        ffmpeg = new FFmpeg()
        ffmpeg.on('progress', ({ progress: value }) => {
          setProgress(Math.round(value * 100))
        })
        ffmpeg.on('log', ({ message }) => {
          setLogs(prev => [...prev.slice(-8), message])
        })
        await ffmpeg.load({
          coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
          wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
        })
        ffmpegRef.current = ffmpeg
      }

      const normalizedClips = clips.map((_, index) => `clip-${index}.mp4`)

      for (let index = 0; index < clips.length; index += 1) {
        const clip = clips[index]
        const inputName = `input-${index}${clip.file.name.slice(clip.file.name.lastIndexOf('.')) || '.mp4'}`
        await ffmpeg.writeFile(inputName, await fetchFile(clip.file))

        const videoFilter = [
          `trim=start=0:duration=${clip.trimmedDuration}`,
          'setpts=PTS-STARTPTS',
          `scale=${format.width}:${format.height}:force_original_aspect_ratio=increase`,
          `crop=${format.width}:${format.height}`,
          'setsar=1',
          'fps=30',
          'format=yuv420p',
        ].join(',')

        const normalizeArgs = [
          '-i', inputName,
          '-vf', videoFilter,
          ...(muteAudio ? ['-an'] : ['-af', 'aresample=async=1:first_pts=0', '-c:a', 'aac', '-b:a', '128k']),
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-shortest',
          normalizedClips[index],
        ]

        const normalizeCode = await ffmpeg.exec(normalizeArgs)
        if (normalizeCode !== 0) {
          throw new Error(`Could not prepare clip ${index + 1}.`)
        }
      }

      let callingCardBytes: Uint8Array | null = null
      if (callingCardEnabled) {
        callingCardBytes = await generateCallingCardPng({
          enabled: true,
          headline,
          cta,
          agentName: agentProfile?.name_surname || user?.full_name || 'Real Estate Agent',
          phone: agentProfile?.phone || '',
          email: agentProfile?.email || '',
          agency: agentProfile?.agency_brand || '',
          photoUrl: agentProfile?.photo_url || null,
          logoUrl: agentProfile?.logo_url || null,
          width: format.width,
          height: format.height,
        })

        if (callingCardBytes) {
          await ffmpeg.writeFile('calling-card.png', callingCardBytes)
        }
      }

      const inputs = normalizedClips.flatMap(fileName => ['-i', fileName])
      const videoFilters: string[] = []
      const audioFilters: string[] = []
      let currentVideo = '0:v'
      let currentAudio = '0:a'
      let currentDuration = clips[0].trimmedDuration

      for (let index = 1; index < clips.length; index += 1) {
        const offset = Math.max(0, currentDuration - transitionDuration)
        videoFilters.push(`[${currentVideo}][${index}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v${index}]`)
        if (!muteAudio) {
          audioFilters.push(`[${currentAudio}][${index}:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a${index}]`)
        }
        currentVideo = `v${index}`
        currentAudio = `a${index}`
        currentDuration += clips[index].trimmedDuration - transitionDuration
      }

      const overlayFilter = callingCardBytes
        ? `[${currentVideo}]overlay=x=0:y=H-h-24,format=yuv420p[vout]`
        : `[${currentVideo}]format=yuv420p[vout]`
      const filterParts = [...videoFilters, overlayFilter]

      if (!muteAudio && audioFilters.length > 0) {
        filterParts.push(...audioFilters)
      }

      const args = [
        ...inputs,
        ...(callingCardBytes ? ['-i', 'calling-card.png'] : []),
        '-filter_complex', filterParts.join(';'),
        '-map', '[vout]',
        ...(!muteAudio && audioFilters.length > 0 ? ['-map', `[a${clips.length - 1}]`] : ['-an']),
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4',
      ]

      const exportCode = await ffmpeg.exec(args)
      if (exportCode !== 0) {
        throw new Error('Could not generate the final video.')
      }

      const output = await ffmpeg.readFile('output.mp4')
      const bytes = output instanceof Uint8Array ? output : new TextEncoder().encode(String(output))
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
      setProgress(100)
    } catch (err: any) {
      if (creditsReserved && user?.id && creditReference) {
        const { refundCredits } = await import('@/lib/credits')
        await refundCredits(user.id, 'video_editor_simple', creditReference, CREDIT_COST)
      }
      setError(err?.message || 'Failed to generate video.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleSaveToLibrary() {
    if (!resultBlob || !user?.id) return
    setIsSaving(true)
    setError(null)

    try {
      const file = new File([resultBlob], `stagefy-video-${Date.now()}.mp4`, { type: 'video/mp4' })
      const result = await uploadMedia(file, user.id, 'video', 'Video Editor Export')
      if (result.error) {
        throw result.error
      }
      setError('Video saved to your media library.')
    } catch (err: any) {
      setError(err?.message || 'Failed to save video.')
    } finally {
      setIsSaving(false)
    }
  }

  function downloadVideo() {
    if (!resultUrl) return
    const link = document.createElement('a')
    link.href = resultUrl
    link.download = `stagefy-video-${Date.now()}.mp4`
    link.click()
  }

  const agentDisplayName = agentProfile?.name_surname || user?.full_name || 'Agent'
  const agentDetails = [agentProfile?.phone, agentProfile?.email, agentProfile?.agency_brand].filter(Boolean).join(' • ')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Video Editor"
          subtitle="Merge short clips into a social-ready video with an optional agent calling card"
          action={<CreditBadge credits={userCredits} size="sm" />}
        />

        <div className="mb-6">
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

        {step === 'clips' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">Upload 3-5 second clips</p>
                <p className="text-sm text-slate-500">Add 2-10 clips. Clips longer than 5 seconds are trimmed automatically.</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || clips.length >= MAX_CLIPS}>
                Add Clips
              </Button>
              <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clips.map((clip, index) => (
                <div key={clip.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <video src={clip.url} className="aspect-[9/16] w-full rounded-xl bg-slate-900 object-cover" controls muted />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{clip.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="info" size="sm">{formatDuration(clip.duration)}</Badge>
                        <Badge variant="secondary" size="sm">{formatBytes(clip.file.size)}</Badge>
                      </div>
                      {clip.warning && <p className="mt-1 text-xs text-amber-600">{clip.warning}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => moveClip(index, -1)} disabled={index === 0} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40">Up</button>
                      <button onClick={() => moveClip(index, 1)} disabled={index === clips.length - 1} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40">Down</button>
                      <button onClick={() => removeClip(index)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {clips.length === 0 && (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500">
                  <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>No clips added yet.</p>
                </div>
              )}
            </div>

            {isUploading && <p className="text-sm text-slate-500">Reading clip durations…</p>}
          </div>
        )}

        {step === 'transition' && (
          <div className="space-y-5">
            <div>
              <p className="font-medium text-slate-900">Choose a transition</p>
              <p className="text-sm text-slate-500">A simple fade is applied between every clip.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {TRANSITION_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setTransitionDuration(Number(option.value))}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    transitionDuration === Number(option.value) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{option.label}</p>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <input type="checkbox" checked={muteAudio} onChange={event => setMuteAudio(event.target.checked)} className="h-4 w-4" />
              <span>
                <span className="block font-medium text-slate-900">Mute original audio</span>
                <span className="text-sm text-slate-500">Recommended for reliable browser export. Add music later in Facebook or TikTok.</span>
              </span>
            </label>
          </div>
        )}

        {step === 'calling_card' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input type="checkbox" checked={callingCardEnabled} onChange={event => setCallingCardEnabled(event.target.checked)} className="h-4 w-4" />
                <span className="font-medium text-slate-900">Add bottom calling card</span>
              </label>

              {callingCardEnabled && (
                <>
                  <Input label="Headline" value={headline} onChange={event => setHeadline(event.target.value)} />
                  <Input label="Call to action" value={cta} onChange={event => setCta(event.target.value)} />
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
                <div className="absolute inset-x-0 bottom-0 min-h-[30%] bg-gradient-to-t from-slate-950 via-slate-900/90 to-blue-950/80 p-5 text-white">
                  <div className="absolute left-5 top-5 h-1 w-[calc(100%-40px)] rounded-full bg-white/20" />
                  <div className="relative z-10 pr-24">
                    <p className="text-xl font-extrabold leading-tight">{headline || 'Real Estate Agent'}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{agentDisplayName}</p>
                    {agentDetails && <p className="mt-1 text-xs text-slate-200">{agentDetails}</p>}
                    <p className="mt-4 text-sm font-extrabold uppercase tracking-wide text-blue-100">{cta}</p>
                  </div>
                  {agentProfile?.logo_url && (
                    <div
                      className="absolute right-4 top-5 h-20 w-20 rounded-2xl bg-white/90 p-2 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${agentProfile.logo_url})` } as React.CSSProperties}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Format</p>
                <p className="mt-1 font-semibold text-slate-900">{format.label}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Clips</p>
                <p className="mt-1 font-semibold text-slate-900">{clips.length} clips</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Estimated length</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDuration(estimatedDuration)}</p>
              </div>
            </div>

            {isExporting && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">Generating video</span>
                  <span className="font-semibold text-blue-900">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                {logs.length > 0 && (
                  <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                    {logs.join('\n')}
                  </pre>
                )}
              </div>
            )}

            {resultUrl && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">Your video is ready.</p>
                <video src={resultUrl} className="mt-3 aspect-[9/16] max-h-96 w-full rounded-xl bg-slate-900 object-contain" controls />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={downloadVideo}>Download MP4</Button>
                  <Button variant="outline" onClick={handleSaveToLibrary} loading={isSaving} disabled={!user}>Save to Media Library</Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={handleBack} disabled={step === 'format'}>
            Back
          </Button>
          {step === 'review' ? (
            <Button onClick={handleExport} loading={isExporting} disabled={!canGenerate}>
              {resultUrl ? 'Generate Again' : 'Generate Video'}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isUploading}>
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
