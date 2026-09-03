'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { useAuth } from '@/lib/auth-context'
import { uploadImage } from '@/lib/supabase'
import { InfoTip } from '@/components/ui/InfoTip'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import {
  type AgentProfile,
  type MusicTrack,
  type VideoEditorFormat,
  formatBytes,
  generateCallingCardPng,
  stitchVideoWithFFmpegFast,
  stitchVideoWithFFmpeg,
  videoEditorFormats,
  DEFAULT_MUSIC_TRACKS,
} from './videoEditorHelpers'
import { AgentProfileSetupModal } from './AgentProfileSetupModal'

type VideoMakeStudioStep = 'landing' | 'format' | 'images' | 'calling_card' | 'generate' | 'review' | 'transition' | 'finish'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [step, setStep] = useState<VideoMakeStudioStep>('landing')
  const [format, setFormat] = useState<VideoEditorFormat>(videoEditorFormats[0])
  const [images, setImages] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [prompt, setPrompt] = useState(AUTO_PROMPT)
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
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [clips, setClips] = useState<BatchClip[]>([])
  const [transitionDuration, setTransitionDuration] = useState(0.5)
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<string | null>(null)
  const [musicPreviewError, setMusicPreviewError] = useState<string | null>(null)
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [musicTracksLoading, setMusicTracksLoading] = useState(true)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [addEndFrame, setAddEndFrame] = useState(false)
  const [batches, setBatches] = useState<Array<{
    id: string
    projectId: string
    totalClips: number
    status: string
    creditCost: number
    createdAt: string
    completedAt: string | null
    settings: Record<string, any>
  }>>([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [resumingBatchId, setResumingBatchId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [exportInterrupted, setExportInterrupted] = useState(false)
  const [clipOrder, setClipOrder] = useState<string[] | null>(null)
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const steps: { key: VideoMakeStudioStep; label: string }[] = [
    { key: 'landing', label: 'Home' },
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

  const successfulClips = clips.filter(c => c.status === 'completed' && c.outputUrl)
  const sortedSuccessfulClips = useMemo(() => {
    return [...successfulClips].sort((a, b) => a.imageIndex - b.imageIndex)
  }, [successfulClips])

  const orderedSuccessfulClips = useMemo(() => {
    if (!clipOrder) return sortedSuccessfulClips
    const byId = new Map(sortedSuccessfulClips.map(c => [c.id, c]))
    return clipOrder.map(id => byId.get(id)).filter((c): c is BatchClip => Boolean(c))
  }, [sortedSuccessfulClips, clipOrder])

  useEffect(() => {
    if (!user?.id) return
    void loadAgentProfile()
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    async function loadMusicTracks() {
      try {
        const response = await fetch('/api/ai/video-make-studio/music')
        const data = await response.json()
        if (!cancelled) {
          const tracks = Array.isArray(data.tracks) ? data.tracks : []
          setMusicTracks(tracks.length > 0 ? tracks : DEFAULT_MUSIC_TRACKS)
        }
      } catch {
        if (!cancelled) {
          setMusicTracks(DEFAULT_MUSIC_TRACKS)
        }
      } finally {
        if (!cancelled) {
          setMusicTracksLoading(false)
        }
      }
    }
    void loadMusicTracks()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    async function loadBatches() {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/api/ai/video-make-studio/batch', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        const data = await response.json()
        if (!cancelled && data.batches) {
          setBatches(data.batches)
        }
      } catch {
        // Silently fail - batches are non-critical
      } finally {
        if (!cancelled) {
          setBatchesLoading(false)
        }
      }
    }
    void loadBatches()
    return () => {
      cancelled = true
    }
  }, [user?.id])

   useEffect(() => {
     let cancelled = false
     async function restoreBatch() {
       try {
         const storedBatchId = localStorage.getItem('vms-batch-id')
         const storedIsGenerating = localStorage.getItem('vms-is-generating') === 'true'
         if (!storedBatchId || !storedIsGenerating || !user?.id) return

         const { supabase } = await import('@/lib/supabase')
         const { data: { session } } = await supabase.auth.getSession()
         const response = await fetch(`/api/ai/video-make-studio/batch/${storedBatchId}`, {
           headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
         })
         const data = await response.json()

         if (data.status === 'processing') {
           setBatchId(storedBatchId)
           setIsGenerating(true)
           setStep('generate')
           void pollBatchStatus()
         } else {
           localStorage.removeItem('vms-batch-id')
           localStorage.removeItem('vms-is-generating')
         }
       } catch {
         // silent
       }
     }
     void restoreBatch()
     return () => {
       cancelled = true
     }
    }, [user?.id])

    useEffect(() => {
      const wasInterrupted = sessionStorage.getItem('vms-export-active') === 'true'
      if (wasInterrupted) {
        setExportInterrupted(true)
      }
    }, [user?.id])

    useEffect(() => {
     return () => {
       if (pollIntervalRef.current) {
         clearInterval(pollIntervalRef.current)
       }
       if (audioPreviewRef.current) {
         audioPreviewRef.current.pause()
         audioPreviewRef.current = null
       }
     }
   }, [])

  async function loadAgentProfile() {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || null
      setAccessToken(token)
      const response = await fetch('/api/agent-profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  function handleProfileSaved(profile: AgentProfile) {
    setAgentProfile(profile)
    setAgentProfileMissing(false)
    if (profile.name_surname) {
      setHeadline(`${profile.name_surname} | Real Estate Agent`)
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

  async function startBatch() {
    if (!canStartBatch || !user?.id) return

    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setClips([])

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/ai/video-make-studio/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          images: imageUrls,
          prompt,
          duration,
          tier,
          formatKey: format.key,
          formatWidth: format.width,
          formatHeight: format.height,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start batch')
      }

      setBatchId(data.batchId)
      localStorage.setItem('vms-batch-id', data.batchId)
      localStorage.setItem('vms-is-generating', 'true')
      setClips(
        Array.from({ length: data.totalClips }).map((_, i) => ({
          id: `clip-${i}`,
          imageIndex: i,
          imageUrl: imageUrls[i] || images[i],
          status: 'pending' as const,
          outputUrl: null,
          error: null,
          creditsUsed: 0,
        }))
      )

      setStep('generate')
      void pollBatchStatus()
    } catch (err: any) {
      setError(err?.message || 'Failed to start batch generation.')
      setIsGenerating(false)
    }
  }

  async function pollBatchStatus() {
    if (!batchId || !user?.id) return

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/ai/video-make-studio/batch/${batchId}`, {
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {},
      })
      const data = await response.json()

      if (data.clips) {
        setClips(data.clips)
      }

      const completed = data.clips?.filter((c: any) => c.status === 'completed').length || 0
      const total = data.summary?.total || data.clips?.length || 0
      setProgress(total > 0 ? Math.round((completed / total) * 100) : 0)

      if (data.status === 'completed' || data.status === 'completed_with_errors') {
        localStorage.removeItem('vms-batch-id')
        localStorage.removeItem('vms-is-generating')
        setIsGenerating(false)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setStep('review')
      }
    } catch (err: any) {
      console.error('Poll error:', err)
    }
  }

  useEffect(() => {
    if (step === 'generate' && batchId && isGenerating) {
      pollBatchStatus()
      pollIntervalRef.current = setInterval(() => {
        void pollBatchStatus()
      }, 3000)
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
      }
    }
  }, [step, batchId, isGenerating])

  async function retryClip(clipId: string) {
    if (!user?.id || !batchId) return

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      await fetch(`/api/ai/video-make-studio/batch/${batchId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ clipId }),
      })

      setClips(prev => prev.map(c => c.id === clipId ? { ...c, status: 'pending', error: null } : c))
    } catch (err: any) {
      setError(err?.message || 'Failed to retry clip.')
    }
  }

  async function handleExport() {
    const successfulClips = clips.filter(c => c.status === 'completed' && c.outputUrl)
    if (successfulClips.length === 0) {
      setError('No successful clips to stitch.')
      return
    }

    setIsExporting(true)
    setError(null)
    setResultUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setResultBlob(null)
    setLogs([])
    setProgress(0)

    sessionStorage.setItem('vms-export-active', 'true')

    const controller = new AbortController()

    let creditsReserved = false
    let creditReference = ''

    try {
      if (user?.id) {
        const { canPerformAction, reserveCredits } = await import('@/lib/credits')
        const canPerform = await canPerformAction(user.id, CREDIT_COST_STITCH)
        if (!canPerform.canPerform) {
          setError(canPerform.error || 'Not enough credits.')
          setIsExporting(false)
          return
        }
        creditReference = `video-studio-stitch-${Date.now()}`
        const reservation = await reserveCredits(user.id, 'video_editor_simple', creditReference, CREDIT_COST_STITCH)
        if (!reservation.success) {
          setError(reservation.error || 'Failed to reserve credits.')
          setIsExporting(false)
          return
        }
        creditsReserved = true
      }

      const sortedClips = orderedSuccessfulClips
      const clipFiles: File[] = []
      
      // Validate clip URLs before downloading
      const missingClips: number[] = []
      for (const clip of sortedClips) {
        try {
          const headResponse = await fetch(clip.outputUrl!, { method: 'HEAD' })
          if (!headResponse.ok) {
            missingClips.push(clip.imageIndex + 1)
          }
        } catch {
          missingClips.push(clip.imageIndex + 1)
        }
      }
      
      if (missingClips.length > 0) {
        throw new Error(`Clip${missingClips.length > 1 ? 's' : ''} ${missingClips.join(', ')} ${missingClips.length > 1 ? 'are' : 'is'} no longer available. Please retry ${missingClips.length > 1 ? 'them' : 'it'} before exporting.`)
      }
      
      for (const clip of sortedClips) {
        const response = await fetch(clip.outputUrl!)
        if (!response.ok) {
          throw new Error(`Clip ${clip.imageIndex + 1} is no longer available (${response.status}). Please regenerate.`)
        }
        const blob = await response.blob()
        if (blob.size < 1000) {
          throw new Error(`Clip ${clip.imageIndex + 1} is incomplete (${blob.size} bytes). Please regenerate.`)
        }
        clipFiles.push(new File([blob], `clip-${clip.imageIndex}.mp4`, { type: 'video/mp4' }))
      }

      const callingCardBytes = callingCardEnabled
        ? await generateCallingCardPng({
            enabled: true,
            headline,
            cta,
            backgroundColor: normalizedCallingCardColor,
            propertyPrice,
            bedrooms,
            bathrooms,
            agentName: agentProfile?.name_surname || 'Agent',
            phone: agentProfile?.phone || '',
            email: agentProfile?.email || '',
            agency: agentProfile?.agency_brand || '',
            photoUrl: agentProfile?.photo_url || null,
            logoUrl: agentProfile?.logo_url || null,
            width: format.width,
            height: format.height,
          })
        : null

      let endFrameUrl: string | null = null
      if (addEndFrame) {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: { session } } = await supabase.auth.getSession()

          const endFrameResponse = await fetch('/api/ai/video-make-studio/end-frame', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              headline,
              cta,
              backgroundColor: normalizedCallingCardColor,
              propertyPrice,
              bedrooms,
              bathrooms,
              agentName: agentProfile?.name_surname || 'Agent',
              phone: agentProfile?.phone || '',
              email: agentProfile?.email || '',
              agency: agentProfile?.agency_brand || '',
              photoUrl: agentProfile?.photo_url || null,
              logoUrl: agentProfile?.logo_url || null,
              width: format.width,
              height: format.height,
            }),
          })

          const endFrameData = await endFrameResponse.json()
          if (endFrameResponse.ok && endFrameData.outputUrl) {
            endFrameUrl = endFrameData.outputUrl
          } else {
            console.error('Failed to generate AI end frame:', endFrameData.error)
          }
        } catch (endFrameError) {
          console.error('Error generating AI end frame:', endFrameError)
        }
      }

      const selectedTrack = musicTracks.find((track: MusicTrack) => track.id === selectedMusicTrack) || null

      console.log('Export debug:', {
        format: `${format.width}x${format.height}`,
        callingCardEnabled,
        callingCardBytes: callingCardBytes ? `${callingCardBytes.length} bytes` : null,
        selectedMusicTrack,
        musicTrackUrl: selectedTrack?.url || null,
        endFrameUrl,
        clipCount: clipFiles.length,
      })

      const clipInputs = clipFiles.map((file, index) => ({
        file,
        trimmedDuration: 5,
      }))

      const getCallingCardBytes = () => {
        if (!callingCardBytes) return null
        return new Uint8Array(callingCardBytes)
      }

      let blob: Blob
      try {
        blob = await stitchVideoWithFFmpegFast({
          format,
          clips: clipInputs,
          transitionDuration,
          muteAudio,
          callingCardBytes: getCallingCardBytes(),
          musicTrackUrl: selectedTrack?.url || null,
          endFrameUrl,
          signal: controller.signal,
          onProgress: (value: number) => {
            setProgress(value)
            if (value % 5 === 0) {
              sessionStorage.setItem('vms-export-progress', String(value))
            }
          },
          onLog: (message: string) => setLogs(prev => [...prev.slice(-8), message]),
        })
      } catch (fastError) {
        console.warn('Fast stitch failed, falling back to standard stitch:', fastError)
        setLogs(prev => [...prev.slice(-8), 'Fast stitch failed, trying standard approach...'])
        blob = await stitchVideoWithFFmpeg({
          format,
          clips: clipInputs,
          transitionDuration,
          muteAudio,
          callingCardBytes: getCallingCardBytes(),
          musicTrackUrl: selectedTrack?.url || null,
          endFrameUrl,
          signal: controller.signal,
          onProgress: (value: number) => {
            setProgress(value)
            if (value % 5 === 0) {
              sessionStorage.setItem('vms-export-progress', String(value))
            }
          },
          onLog: (message: string) => setLogs(prev => [...prev.slice(-8), message]),
        })
      }

      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
      setProgress(100)
    } catch (err: any) {
      if (creditsReserved && user?.id && creditReference) {
        const { refundCredits } = await import('@/lib/credits')
        await refundCredits(user.id, 'video_editor_simple', creditReference, CREDIT_COST_STITCH)
      }
      const message = err?.message || 'Failed to stitch video.'
      const logSnippet = logs.length > 0 ? `\nLast logs: ${logs.slice(-5).join('\n')}` : ''
      console.error('Video stitch failed:', err, logSnippet)
      setError(`${message}${logSnippet}`)
    } finally {
      sessionStorage.removeItem('vms-export-active')
      sessionStorage.removeItem('vms-export-progress')
      setIsExporting(false)
    }
  }

  async function handleSaveToLibrary() {
    if (!resultBlob || !user?.id) return
    setIsSaving(true)
    setError(null)

    try {
      const file = new File([resultBlob], `stagefy-video-${Date.now()}.mp4`, { type: 'video/mp4' })
      const result = await uploadImage(file, user.id)
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

  function handleNext() {
    if (step === 'landing') {
      setStep('format')
      return
    }
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
      void startBatch()
      return
    }
    if (step === 'review') {
      setStep('transition')
    }
    if (step === 'transition') {
      setStep('finish')
      void handleExport()
    }
  }

  function handleBack() {
    if (step === 'images') setStep('format')
    else if (step === 'calling_card') setStep('images')
    else if (step === 'generate') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      setIsGenerating(false)
      setStep('calling_card')
    }     else if (step === 'review') setStep('generate')
    else if (step === 'transition') setStep('review')
  }

  function moveClip(id: string, direction: -1 | 1) {
    const current = orderedSuccessfulClips.map(c => c.id)
    const index = current.indexOf(id)
    const swapIndex = index + direction
    if (index === -1 || swapIndex < 0 || swapIndex >= current.length) return
    const next = [...current]
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    setClipOrder(next)
  }

  function handleClipDrop(targetId: string) {
    if (!draggingClipId || draggingClipId === targetId) return
    const current = orderedSuccessfulClips.map(c => c.id)
    const from = current.indexOf(draggingClipId)
    const to = current.indexOf(targetId)
    if (from === -1 || to === -1) return
    const next = [...current]
    next.splice(to, 0, next.splice(from, 1)[0])
    setClipOrder(next)
    setDraggingClipId(null)
  }

  const agentDisplayName = agentProfile?.name_surname || 'Agent'
  const agentDetails = [agentProfile?.phone, agentProfile?.email, agentProfile?.agency_brand].filter(Boolean).join(' • ')
  const currentStepIndex = steps.findIndex(item => item.key === step)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Video Maker Studio"
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

        {exportInterrupted && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Your previous export was interrupted. Please try exporting again.
            <button
              onClick={() => setExportInterrupted(false)}
              className="ml-3 text-yellow-900 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {step === 'landing' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <button
                onClick={() => setStep('format')}
                className="rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 text-left transition-all hover:border-blue-600"
              >
                <p className="font-semibold text-blue-900">Start New Batch</p>
                <p className="mt-1 text-sm text-blue-700">Upload 3-30 images and create a new video</p>
              </button>
              <button
                onClick={() => setStep('format')}
                className="rounded-2xl border-2 border-slate-200 p-6 text-left transition-all hover:border-slate-300"
              >
                <p className="font-semibold text-slate-900">How it works</p>
                <p className="mt-1 text-sm text-slate-500">Upload images, generate clips, stitch into video</p>
              </button>
            </div>

            {batches.length > 0 && (
              <div>
                <p className="font-medium text-slate-900 mb-3">Your recent batches</p>
                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className={`rounded-xl border p-4 flex items-center justify-between ${
                        batch.status === 'processing' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {batch.settings.prompt ? batch.settings.prompt.slice(0, 60) + '...' : 'Untitled Batch'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {batch.totalClips} clips • {batch.creditCost} credits • {new Date(batch.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {batch.status}
                        </span>
                        {batch.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setBatchId(batch.id)
                              setResumingBatchId(batch.id)
                              setIsGenerating(true)
                              localStorage.setItem('vms-batch-id', batch.id)
                              localStorage.setItem('vms-is-generating', 'true')
                              setStep('generate')
                              void pollBatchStatus()
                            }}
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'format' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">Choose format</p>
              <InfoTip text="Clips are generated and cropped to this size. Choose TikTok/Reels (9:16), Square, or Landscape — no black bars." />
            </div>
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
        </div>
      )}

        {step === 'images' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">Upload images</p>
                  <InfoTip text="Upload 3–30 images. Order matters — the sequence you upload them becomes the clip order. Use clear, well-lit, consistent-style photos." />
                </div>
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors"
                >
                  <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No images added yet. Click to upload.</p>
                </button>
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
                <InfoTip text="A branded calling card appears at the bottom of the final video. Your agent profile personalizes it with your name, photo, and logo." />
              </label>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Property details</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Price" value={propertyPrice} onChange={event => setPropertyPrice(event.target.value)} placeholder="R2,950,000" helper="Shown on the calling card." />
                  <Input label="Bedrooms" value={bedrooms} onChange={event => setBedrooms(event.target.value)} placeholder="3" helper="e.g. 3" />
                  <Input label="Bathrooms" value={bathrooms} onChange={event => setBathrooms(event.target.value)} placeholder="2" helper="e.g. 2" />
                </div>
              </div>

              {callingCardEnabled && (
                <>
                  {agentProfileMissing && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Add your agent profile so your name, photo and logo appear on the video.</p>
                      <button
                        type="button"
                        onClick={() => setShowProfileModal(true)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                      >
                        Set up agent profile
                      </button>
                    </div>
                  )}
                  <Input label="Headline" value={headline} onChange={event => setHeadline(event.target.value)} helper="Main text on the calling card." />
                  <Input label="Call to action" value={cta} onChange={event => setCta(event.target.value)} helper="Encourages viewers to contact you." />
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Using profile</p>
                        <p className="mt-1 text-sm text-slate-500">{agentDisplayName}</p>
                        {agentDetails && <p className="mt-1 text-sm text-slate-500">{agentDetails}</p>}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowProfileModal(true)}>
                        Edit profile
                      </Button>
                    </div>
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

        {step === 'generate' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">Generating clips</p>
              <InfoTip text="Clips are generated one at a time. Keep this tab open; ~30s per clip." />
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">Generating clips</span>
                <span className="font-semibold text-blue-900">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              {isGenerating && (
                <p className="mt-2 text-xs text-blue-700">
                  Estimated time remaining: ~{Math.max(1, Math.round(clips.filter(c => c.status === 'pending' || c.status === 'processing').length * 0.5))} min
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clips.map((clip) => (
                <div key={clip.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                    {clip.status === 'completed' && clip.outputUrl ? (
                      <video src={clip.outputUrl} className="w-full h-full rounded-lg object-cover" muted />
                    ) : clip.status === 'failed' ? (
                      <div className="text-center text-red-400 p-2">
                        <p className="text-xs font-semibold">Failed</p>
                        {clip.error && <p className="text-[10px] mt-1 line-clamp-2">{clip.error}</p>}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs">Processing...</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-600">Image {clip.imageIndex + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">Review clips</p>
              <InfoTip text="Review your clips. Failed clips can be retried below." />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Format</p>
                <p className="mt-1 font-semibold text-slate-900">{format.label}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Clips</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {successfulClips.length} of {clips.length} successful
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {clips.every(c => c.status === 'completed') ? 'All clips ready' : 'Some clips failed'}
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium text-slate-900 mb-2">Your clips</p>
              <p className="text-sm text-slate-500 mb-3">Drag clips to reorder, or use the arrow buttons. This order is used when stitching the final video.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orderedSuccessfulClips.map((clip, index) => (
                  <div
                    key={clip.id}
                    draggable
                    onDragStart={() => setDraggingClipId(clip.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleClipDrop(clip.id)}
                    onDragEnd={() => setDraggingClipId(null)}
                    className={`rounded-2xl border bg-slate-50 p-3 transition-colors ${
                      draggingClipId === clip.id ? 'border-blue-400 opacity-50' : 'border-slate-200'
                    }`}
                  >
                    <video src={clip.outputUrl!} className="w-full aspect-video rounded-lg bg-slate-900 object-cover" controls muted />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-600">Position {index + 1}</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          onClick={() => moveClip(clip.id, -1)}
                          disabled={index === 0}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          onClick={() => moveClip(clip.id, 1)}
                          disabled={index === orderedSuccessfulClips.length - 1}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {clips.some(c => c.status === 'failed') && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Some clips failed</p>
                <p className="mt-1 text-sm text-amber-700">You can retry failed clips below, or continue with the successful ones.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {clips.filter(c => c.status === 'failed').map(clip => (
                    <Button key={clip.id} variant="outline" size="sm" onClick={() => retryClip(clip.id)}>
                      Retry Image {clip.imageIndex + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'transition' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">Choose a transition</p>
              <InfoTip text="A short fade is applied between every clip." />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: 0.3, label: 'Fast - 0.3s' },
                { value: 0.5, label: 'Smooth - 0.5s' },
                { value: 0.8, label: 'Soft - 0.8s' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTransitionDuration(option.value)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    transitionDuration === option.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{option.label}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium text-slate-900 mb-2">Background music</p>
                <p className="text-sm text-slate-500 mb-3">Pick a track to play under your clips.</p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMusicTrack ?? ''}
                    onChange={(e) => {
                      setSelectedMusicTrack(e.target.value || null)
                      setMusicPreviewError(null)
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No music</option>
                    {musicTracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedMusicTrack) return
                      const track = musicTracks.find(t => t.id === selectedMusicTrack)
                      if (!track) return

                      if (playingTrackId === selectedMusicTrack && audioPreviewRef.current) {
                        audioPreviewRef.current.pause()
                        setPlayingTrackId(null)
                        return
                      }

                      if (audioPreviewRef.current) {
                        audioPreviewRef.current.pause()
                        audioPreviewRef.current.src = ''
                        audioPreviewRef.current = null
                      }

                      try {
                        const absoluteUrl = new URL(track.url, window.location.origin).href
                        const audio = new Audio(absoluteUrl)
                        audioPreviewRef.current = audio
                        await audio.play()
                        setPlayingTrackId(track.id)
                        setMusicPreviewError(null)

                        audio.addEventListener('ended', () => {
                          setPlayingTrackId(null)
                          audioPreviewRef.current = null
                        })
                      } catch (err: any) {
                        setPlayingTrackId(null)
                        const message = err?.message || 'Unknown error'
                        if (message.includes('no supported source') || message.includes('MediaError')) {
                          setMusicPreviewError(`Could not preview ${track.name}: the audio format is not supported by your browser.`)
                        } else {
                          setMusicPreviewError(`Could not preview ${track.name}: ${message}`)
                        }
                      }
                    }}
                    disabled={!selectedMusicTrack}
                    className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border text-sm transition-colors ${
                      playingTrackId === selectedMusicTrack
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700'
                    } ${!selectedMusicTrack ? 'cursor-not-allowed opacity-50' : ''}`}
                    title={playingTrackId === selectedMusicTrack ? 'Pause' : 'Play preview'}
                  >
                    {playingTrackId === selectedMusicTrack ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    )}
                  </button>
                </div>
                {playingTrackId && (
                  <p className="mt-2 text-xs text-blue-600">
                    Now previewing: {musicTracks.find(t => t.id === playingTrackId)?.name}
                  </p>
                )}
                {musicPreviewError && (
                  <p className="mt-2 text-xs text-red-600">{musicPreviewError}</p>
                )}
              </div>

              <div>
                <p className="font-medium text-slate-900 mb-2">Audio settings</p>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <input type="checkbox" checked={muteAudio} onChange={event => setMuteAudio(event.target.checked)} className="h-4 w-4" />
                  <span>
                    <span className="block font-medium text-slate-900">Mute original audio</span>
                    <span className="text-sm text-slate-500">Recommended for reliable browser export. Add music later in Facebook or TikTok.</span>
                  </span>
                </label>
                <p className="mt-3 text-xs text-slate-500">
                  Music plays under the clips. If original audio is muted, only music will remain.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-2">End frame</p>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <input type="checkbox" checked={addEndFrame} onChange={event => setAddEndFrame(event.target.checked)} className="h-4 w-4" />
                  <span>
                    <span className="block font-medium text-slate-900">Add branded end frame</span>
                    <span className="text-sm text-slate-500">Appends a 3-second calling card at the end of the video.</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 'finish' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">Finish and export</p>
              <InfoTip text="Stitching runs in your browser. Keep the tab open; it may take a minute for many clips." />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Format</p>
                <p className="mt-1 font-semibold text-slate-900">{format.label}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Clips</p>
                <p className="mt-1 font-semibold text-slate-900">{successfulClips.length} clips</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Transition</p>
                <p className="mt-1 font-semibold text-slate-900">{transitionDuration}s fade</p>
              </div>
            </div>

            {isExporting && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">
                    {progress < 50 ? 'Normalizing clips' : 'Stitching video'}
                  </span>
                  <span className="font-semibold text-blue-900">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                {logs.length > 0 && (
                  <p className="mt-2 text-xs text-blue-700">{logs[logs.length - 1]}</p>
                )}
              </div>
            )}

            {resultUrl && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">Your video is ready.</p>
                <video src={resultUrl} className="mt-3 aspect-video w-full max-h-96 rounded-xl bg-slate-900 object-contain" controls />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={downloadVideo}>Download MP4</Button>
                  <Button variant="outline" onClick={handleSaveToLibrary} loading={isSaving} disabled={!user}>Save to Media Library</Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-200">
              <span className="text-sm text-slate-600">Credits spent: {totalClipCost + CREDIT_COST_STITCH}</span>
              <span className="text-sm text-slate-500">You can download or save the final video above.</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={handleBack} disabled={step === 'landing' || step === 'format'}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={step === 'images' && !canStartBatch}>
            {step === 'landing' ? 'Start New Batch' : step === 'calling_card' ? 'Start Generation' : step === 'generate' ? 'Generating...' : step === 'review' ? 'Continue to Transition' : step === 'transition' ? 'Stitch Video' : 'Next'}
          </Button>
         </div>
       </Card>
       <AgentProfileSetupModal
         isOpen={showProfileModal}
         agentProfile={agentProfile}
         onClose={() => setShowProfileModal(false)}
         onSaved={handleProfileSaved}
         accessToken={accessToken}
       />
     </div>
   )
}
