export interface AgentProfile {
  name_surname?: string | null
  email?: string | null
  phone?: string | null
  agency_brand?: string | null
  photo_url?: string | null
  logo_url?: string | null
}

export interface VideoEditorFormat {
  key: string
  label: string
  width: number
  height: number
}

export interface MusicTrack {
  id: string
  name: string
  url: string
  durationSeconds?: number
}

export const DEFAULT_MUSIC_TRACKS: MusicTrack[] = (() => {
  return Array.from({ length: 5 }, (_, i) => {
    const name = `track-${i + 1}`
    return {
      id: name,
      name: `Track ${i + 1}`,
      url: `/api/ai/video-make-studio/music/${name}.mp3`,
      durationSeconds: 0,
    }
  })
})()

export interface VideoClipItem {
  id: string
  file: File
  name: string
  url: string
  duration: number
  trimmedDuration: number
  warning?: string
}

export interface CallingCardOptions {
  enabled: boolean
  headline: string
  cta: string
  backgroundColor: string
  propertyPrice: string
  bedrooms: string
  bathrooms: string
  agentName: string
  phone: string
  email: string
  agency: string
  photoUrl?: string | null
  logoUrl?: string | null
  width: number
  height: number
}

export const videoEditorFormats: VideoEditorFormat[] = [
  { key: 'vertical', label: 'TikTok / Reels', width: 720, height: 1280 },
  { key: 'square', label: 'Square', width: 720, height: 720 },
  { key: 'landscape', label: 'Landscape', width: 1280, height: 720 },
]

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export async function getVideoDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = url

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Could not read video metadata'))
    })

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error('Could not read video duration')
    }

    return video.duration
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function generateCallingCardPng(options: CallingCardOptions): Promise<Uint8Array | null> {
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const cardHeight = Math.round(options.height * 0.22)
  const y = options.height - cardHeight
  const padding = Math.round(options.width * 0.05)
  const radius = Math.round(cardHeight * 0.08)
  const avatarSize = Math.min(Math.round(cardHeight * 0.46), Math.round(options.width * 0.16))
  const logoBoxWidth = Math.min(Math.round(cardHeight * 0.95), Math.round(options.width * 0.35))
  const logoBoxHeight = Math.min(Math.round(cardHeight * 0.62), Math.round(options.width * 0.22))
  const logoPadding = Math.round(Math.min(logoBoxWidth, logoBoxHeight) * 0.14)
  const logoSize = Math.min(logoBoxWidth, logoBoxHeight) - logoPadding * 2
  const gap = Math.round(options.width * 0.035)

  ctx.clearRect(0, 0, options.width, options.height)

  const cardColor = normalizeHexColor(options.backgroundColor)
  const gradient = ctx.createLinearGradient(0, y, options.width, y + cardHeight)
  gradient.addColorStop(0, hexToRgba(cardColor, 0.96))
  gradient.addColorStop(0.65, hexToRgba(cardColor, 0.86))
  gradient.addColorStop(1, 'rgba(2, 6, 23, 0.94)')
  ctx.fillStyle = gradient
  roundRect(ctx, 0, y, options.width, cardHeight, radius)
  ctx.fill()

  const photoUrl = options.photoUrl || ''
  if (photoUrl) {
    try {
      const photo = await loadImage(photoUrl)
      ctx.save()
      ctx.beginPath()
      ctx.arc(padding + avatarSize / 2, y + cardHeight / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.clip()
      drawContainImage(ctx, photo, padding, y + cardHeight / 2 - avatarSize / 2, avatarSize, avatarSize, 0)
      ctx.restore()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = Math.max(3, Math.round(options.width * 0.006))
      ctx.beginPath()
      ctx.arc(padding + avatarSize / 2, y + cardHeight / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.stroke()
    } catch {
      drawInitials(ctx, options.agentName, padding, y + cardHeight / 2 - avatarSize / 2, avatarSize)
    }
  } else {
    drawInitials(ctx, options.agentName, padding, y + cardHeight / 2 - avatarSize / 2, avatarSize)
  }

  const logoUrl = options.logoUrl || ''
  const logoX = options.width - padding - logoBoxWidth
  const logoY = y + Math.round((cardHeight - logoBoxHeight) / 2)
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl)
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
      roundRect(ctx, logoX, logoY, logoBoxWidth, logoBoxHeight, Math.round(Math.min(logoBoxWidth, logoBoxHeight) * 0.18))
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      roundRect(ctx, logoX + logoPadding / 2, logoY + logoPadding / 2, logoBoxWidth - logoPadding, logoBoxHeight - logoPadding, Math.round(Math.min(logoBoxWidth, logoBoxHeight) * 0.16))
      ctx.fill()
      drawContainImage(ctx, logo, logoX + logoPadding, logoY + logoPadding, logoBoxWidth - logoPadding, logoBoxHeight - logoPadding, 0)
      ctx.restore()
    } catch {
    }
  }

  const textX = padding + avatarSize + gap
  const textRight = logoUrl ? logoX - gap : options.width - padding
  const maxWidth = Math.max(120, textRight - textX)
  const textTop = y + Math.round(cardHeight * 0.10)
  const textBottom = y + cardHeight - Math.round(cardHeight * 0.10)
  const headlineFontSize = Math.round(clamp(options.width * 0.038, 20, 30))
  const nameFontSize = Math.round(clamp(options.width * 0.024, 12, 17))
  const detailsFontSize = Math.round(clamp(options.width * 0.023, 12, 17))
  const ctaFontSize = Math.round(clamp(options.width * 0.026, 14, 19))
  const headlineLineHeight = Math.round(headlineFontSize * 1.08)
  const nameLineHeight = Math.round(nameFontSize * 1.25)
  const detailsLineHeight = Math.round(detailsFontSize * 1.25)
  const ctaLineHeight = Math.round(ctaFontSize * 1.25)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${headlineFontSize}px Arial, sans-serif`
  let nextTextY = wrapText(ctx, options.headline || options.agentName || 'Real Estate Agent', textX, textTop, maxWidth, headlineLineHeight, 2)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)'
  ctx.font = `700 ${nameFontSize}px Arial, sans-serif`
  nextTextY = wrapText(ctx, options.agentName, textX, nextTextY + Math.round(cardHeight * 0.025), maxWidth, nameLineHeight, 1)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = `600 ${detailsFontSize}px Arial, sans-serif`
  const propertyDetails = [
    options.propertyPrice ? `Price: ${options.propertyPrice}` : '',
    options.bedrooms ? `${options.bedrooms} bed${options.bedrooms === '1' ? '' : 's'}` : '',
    options.bathrooms ? `${options.bathrooms} bath${options.bathrooms === '1' ? '' : 's'}` : '',
  ].filter(Boolean).join(' • ')
  if (propertyDetails) {
    nextTextY = wrapText(ctx, `Property details: ${propertyDetails}`, textX, nextTextY + Math.round(cardHeight * 0.025), maxWidth, detailsLineHeight, 1)
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'
  ctx.font = `600 ${detailsFontSize}px Arial, sans-serif`
  const details = [options.phone, options.email, options.agency].filter(Boolean).join(' • ')
  nextTextY = wrapText(ctx, details || 'Contact me today', textX, nextTextY + Math.round(cardHeight * 0.025), maxWidth, detailsLineHeight, 2)

  const ctaY = Math.max(nextTextY + Math.round(cardHeight * 0.03), textBottom - ctaFontSize)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
  ctx.font = `800 ${ctaFontSize}px Arial, sans-serif`
  ctx.textAlign = logoUrl ? 'left' : 'right'
  ctx.fillText(fitSingleLine(ctx, (options.cta || 'Call or WhatsApp').toUpperCase(), maxWidth), logoUrl ? textX : options.width - padding, ctaY)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return null
  return new Uint8Array(await blob.arrayBuffer())
}

function normalizeHexColor(color: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : '#0f172a'
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = normalizeHexColor(hex).replace('#', '')
  const full = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawInitials(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, size: number) {
  ctx.fillStyle = '#2563eb'
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${Math.round(size * 0.38)}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'RA'
  ctx.fillText(initials, x + size / 2, y + size / 2 + 2)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function fitSingleLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text

  let fitted = text
  while (fitted.length > 0 && ctx.measureText(`${fitted}…`).width > maxWidth) {
    fitted = fitted.slice(0, -1)
  }
  return `${fitted.trim()}…`
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = Infinity) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = testLine
    }
  }

  if (lines.length < maxLines && line) {
    lines.push(line)
  }

  const fullText = words.join(' ')
  const wrappedText = lines.join(' ')
  if (lines.length === maxLines && wrappedText !== fullText) {
    let ellipsisLine = lines[maxLines - 1]
    while (ellipsisLine.length > 0 && ctx.measureText(`${ellipsisLine}…`).width > maxWidth) {
      ellipsisLine = ellipsisLine.slice(0, -1)
    }
    lines[maxLines - 1] = `${ellipsisLine.trim()}…`
  }

  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight))
  return y + lines.length * lineHeight
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number
) {
  const availableWidth = Math.max(1, width - padding * 2)
  const availableHeight = Math.max(1, height - padding * 2)
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const drawX = x + padding + (availableWidth - drawWidth) / 2
  const drawY = y + padding + (availableHeight - drawHeight) / 2
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width, y)
  ctx.lineTo(x + width, y + height)
  ctx.lineTo(x, y + height)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export type StitchClipInput = {
  file: File
  trimmedDuration: number
}

export type StitchOptions = {
  format: VideoEditorFormat
  clips: StitchClipInput[]
  transitionDuration: number
  muteAudio: boolean
  callingCardBytes: Uint8Array | null
  musicTrackUrl?: string | null
  endFrameUrl?: string | null
  signal?: AbortSignal
  onProgress?: (progress: number) => void
  onLog?: (message: string) => void
}

export async function stitchVideoWithFFmpeg(options: StitchOptions): Promise<Blob> {
  const { format, clips, transitionDuration, muteAudio, callingCardBytes, musicTrackUrl, endFrameUrl, signal, onProgress, onLog } = options
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

  const ffmpegLogs: string[] = []

  if (signal?.aborted) {
    throw new Error('Export cancelled')
  }

  const ffmpeg = new FFmpeg()
  ffmpeg.on('progress', ({ progress: value }) => {
    onProgress?.(Math.round(value * 100))
  })
  ffmpeg.on('log', ({ message }) => {
    ffmpegLogs.push(message)
    onLog?.(message)
  })

  onLog?.(`Starting stitch: ${clips.length} clips, format ${format.width}x${format.height}, transition ${transitionDuration}s, muteAudio=${muteAudio}, hasCallingCard=${!!callingCardBytes}, hasMusic=${!!musicTrackUrl}, hasEndFrame=${!!endFrameUrl}`)

  onLog?.('Loading FFmpeg core...')

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
    })
  } catch (loadError) {
    throw new Error(`Failed to load FFmpeg: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`)
  }

  onLog?.('FFmpeg loaded. Preparing clips...')

  const inputNames: string[] = []

  for (let index = 0; index < clips.length; index += 1) {
    if (signal?.aborted) {
      throw new Error('Export cancelled')
    }
    const clip = clips[index]
    const inputName = `input-${index}${clip.file.name.slice(clip.file.name.lastIndexOf('.')) || '.mp4'}`
    inputNames.push(inputName)
    await ffmpeg.writeFile(inputName, await fetchFile(clip.file))
    onProgress?.(Math.round(((index + 1) / clips.length) * 20))
    onLog?.(`Clip ${index + 1}/${clips.length} loaded`)
  }

  let hasCallingCard = false
  let hasEndFrame = false
  let hasMusic = false

  if (callingCardBytes) {
    try {
      await ffmpeg.writeFile('calling-card.png', callingCardBytes)
      hasCallingCard = true
    } catch (callCardError) {
      console.error('Failed to write calling card:', callCardError)
    }
  }

  if (endFrameUrl) {
    try {
      const endFrameResponse = await fetch(endFrameUrl)
      if (endFrameResponse.ok) {
        const endFrameBlob = await endFrameResponse.blob()
        const endFrameArrayBuffer = await endFrameBlob.arrayBuffer()
        const endFrameBytes = new Uint8Array(endFrameArrayBuffer)
        await ffmpeg.writeFile('endframe.png', endFrameBytes)
        hasEndFrame = true
      }
    } catch (endFrameError) {
      console.error('Failed to load end frame image:', endFrameError)
    }
  }

  if (musicTrackUrl) {
    try {
      const musicResponse = await fetch(musicTrackUrl)
      if (musicResponse.ok) {
        const musicBlob = await musicResponse.blob()
        const musicArrayBuffer = await musicBlob.arrayBuffer()
        const musicBytes = new Uint8Array(musicArrayBuffer)
        await ffmpeg.writeFile('music.mp3', musicBytes)
        hasMusic = true
      }
    } catch (musicError) {
      console.error('Failed to load music track:', musicError)
    }
  }

  if (signal?.aborted) {
    throw new Error('Export cancelled')
  }

  onProgress?.(25)
  onLog?.('Building filter graph...')

  const inputs = inputNames.flatMap(fileName => ['-i', fileName])
  const filterParts: string[] = []
  const audioFilters: string[] = []

  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index]
    const videoFilter = [
      `trim=start=0:duration=${clip.trimmedDuration}`,
      'setpts=PTS-STARTPTS',
      `scale=${format.width}:${format.height}:force_original_aspect_ratio=increase`,
      `crop=${format.width}:${format.height}`,
      'setsar=1',
      'format=yuv420p',
    ].join(',')

    const audioFilter = muteAudio
      ? 'anull'
      : 'aresample=async=1:first_pts=0,asetpts=PTS-STARTPTS'

    filterParts.push(`[${index}:v]${videoFilter}[v${index}]`)
    filterParts.push(`[${index}:a]${audioFilter}[a${index}]`)
  }

  let currentVideo = 'v0'
  let currentAudio = 'a0'
  let currentDuration = clips[0].trimmedDuration

  for (let index = 1; index < clips.length; index += 1) {
    const offset = Math.max(0, currentDuration - transitionDuration)
    filterParts.push(`[${currentVideo}][v${index}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[vxfade${index}]`)
    if (!muteAudio) {
      filterParts.push(`[${currentAudio}][a${index}]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[axfade${index}]`)
      currentAudio = `axfade${index}`
    }
    currentVideo = `vxfade${index}`
    currentDuration += clips[index].trimmedDuration - transitionDuration
  }

  const finalVideoBeforeOverlay = currentVideo
  const finalAudioBeforeOverlay = currentAudio

  if (hasCallingCard) {
    filterParts.push(`[${finalVideoBeforeOverlay}]overlay=x=0:y=H-h-24,format=yuv420p[vout]`)
  } else {
    filterParts.push(`[${finalVideoBeforeOverlay}]format=yuv420p[vout]`)
  }

  if (hasMusic) {
    const musicInputIndex = clips.length + (hasCallingCard ? 1 : 0)
    filterParts.push(`[${musicInputIndex}:a]aloop=loop=-1:size=2e9[bg]`)
    if (!muteAudio && finalAudioBeforeOverlay !== 'a0') {
      filterParts.push(`[${finalAudioBeforeOverlay}][bg]amix=inputs=2:duration=shortest:dropout_transition=2[outa]`)
    } else {
      filterParts.push(`[bg]volume=0.8[bgv]`)
    }
  } else if (!muteAudio && finalAudioBeforeOverlay !== 'a0') {
    filterParts.push(`[${finalAudioBeforeOverlay}]asetpts=PTS-STARTPTS[outa]`)
  }

  if (hasEndFrame) {
    const endFrameInputIndex = clips.length + (hasCallingCard ? 1 : 0) + (hasMusic ? 1 : 0)
    const offset = Math.max(0, currentDuration - 1)
    filterParts.push(`[${endFrameInputIndex}:v]scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height},setsar=1[endframecrop]`)
    filterParts.push(`[vout][endframecrop]xfade=transition=fade:duration=1:offset=${offset}[vfinal]`)
  }

  const finalVideoLabel = hasEndFrame ? '[vfinal]' : '[vout]'
  const finalAudioLabel = hasMusic ? '[outa]' : (!muteAudio && finalAudioBeforeOverlay !== 'a0' ? '[outa]' : '-an')

  const musicInput = hasMusic ? ['-i', 'music.mp3'] : []
  const endFrameInput = hasEndFrame ? ['-i', 'endframe.png'] : []

  const args = [
    ...inputs,
    ...(hasCallingCard ? ['-i', 'calling-card.png'] : []),
    ...musicInput,
    ...endFrameInput,
    '-filter_complex', filterParts.join(';'),
    '-map', finalVideoLabel,
    ...(finalAudioLabel !== '-an' ? ['-map', finalAudioLabel] : ['-an']),
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-threads', '0',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    'output.mp4',
  ]

  onProgress?.(70)
  onLog?.('Stitching final video...')

  const exportPromise = ffmpeg.exec(args)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('FFmpeg export timed out after 10 minutes')), 10 * 60 * 1000)
  })

  const exportCode = await Promise.race([exportPromise, timeoutPromise]) as number
  onProgress?.(95)
  if (exportCode !== 0) {
    const missingAssets = []
    if (!hasCallingCard && callingCardBytes) missingAssets.push('calling card')
    if (!hasEndFrame && endFrameUrl) missingAssets.push('end frame')
    if (!hasMusic && musicTrackUrl) missingAssets.push('music track')
    const assetNote = missingAssets.length > 0 ? ` Missing assets: ${missingAssets.join(', ')}.` : ''
    const logSnippet = ffmpegLogs.slice(-10).join(' | ')
    throw new Error(`FFmpeg export failed with code ${exportCode}.${assetNote} Logs: ${logSnippet}`)
  }

  const output = await ffmpeg.readFile('output.mp4')
  const bytes = output instanceof Uint8Array ? output : new TextEncoder().encode(String(output))
  return new Blob([bytes as unknown as BlobPart], { type: 'video/mp4' })
}

export async function stitchVideoWithFFmpegFast(options: StitchOptions): Promise<Blob> {
  const { format, clips, muteAudio, callingCardBytes, musicTrackUrl, endFrameUrl, signal, onProgress, onLog } = options
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

  const ffmpegLogs: string[] = []

  if (signal?.aborted) {
    throw new Error('Export cancelled')
  }

  const ffmpeg = new FFmpeg()
  ffmpeg.on('progress', ({ progress: value }) => {
    onProgress?.(Math.round(value * 100))
  })
  ffmpeg.on('log', ({ message }) => {
    ffmpegLogs.push(message)
    onLog?.(message)
  })

  onLog?.(`Starting FAST stitch: ${clips.length} clips, format ${format.width}x${format.height}, muteAudio=${muteAudio}`)

  onLog?.('Loading FFmpeg core...')

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
    })
  } catch (loadError) {
    throw new Error(`Failed to load FFmpeg: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`)
  }

  onLog?.('FFmpeg loaded. Writing clips...')

  const clipNames: string[] = []
  for (let index = 0; index < clips.length; index += 1) {
    if (signal?.aborted) {
      throw new Error('Export cancelled')
    }
    const clip = clips[index]
    const fileName = `clip-${index}.mp4`
    clipNames.push(fileName)
    try {
      await ffmpeg.writeFile(fileName, await fetchFile(clip.file))
    } catch (writeErr) {
      throw new Error(`Failed to write clip ${index + 1}: ${writeErr instanceof Error ? writeErr.message : 'Unknown error'}`)
    }
    onProgress?.(Math.round(((index + 1) / clips.length) * 40))
    onLog?.(`Clip ${index + 1}/${clips.length} written`)
  }

  let hasCallingCard = false
  let hasMusic = false
  let hasEndFrame = false

  console.log('Fast stitch inputs:', {
    callingCardBytes: callingCardBytes ? `${callingCardBytes.length} bytes` : null,
    musicTrackUrl,
    endFrameUrl,
    format: `${format.width}x${format.height}`,
  })

  if (callingCardBytes) {
    try {
      await ffmpeg.writeFile('calling-card.png', callingCardBytes)
      hasCallingCard = true
      console.log('Calling card written successfully')
    } catch (callCardError) {
      console.error('Failed to write calling card:', callCardError)
    }
  }

  if (musicTrackUrl) {
    try {
      console.log('Fetching music from:', musicTrackUrl)
      const musicResponse = await fetch(musicTrackUrl)
      if (musicResponse.ok) {
        const musicBlob = await musicResponse.blob()
        const musicArrayBuffer = await musicBlob.arrayBuffer()
        const musicBytes = new Uint8Array(musicArrayBuffer)
        await ffmpeg.writeFile('music.mp3', musicBytes)
        hasMusic = true
        console.log('Music written successfully:', musicBytes.length, 'bytes')
      } else {
        console.error('Music fetch failed:', musicResponse.status)
      }
    } catch (musicError) {
      console.error('Failed to load music track:', musicError)
    }
  }

  if (endFrameUrl) {
    try {
      console.log('Fetching end frame from:', endFrameUrl)
      const endFrameResponse = await fetch(endFrameUrl)
      if (endFrameResponse.ok) {
        const endFrameBlob = await endFrameResponse.blob()
        const endFrameArrayBuffer = await endFrameBlob.arrayBuffer()
        const endFrameBytes = new Uint8Array(endFrameArrayBuffer)
        await ffmpeg.writeFile('endframe.png', endFrameBytes)
        hasEndFrame = true
        console.log('End frame written successfully:', endFrameBytes.length, 'bytes')
      } else {
        console.error('End frame fetch failed:', endFrameResponse.status)
      }
    } catch (endFrameError) {
      console.error('Failed to load end frame:', endFrameError)
    }
  }

  console.log('Fast stitch state:', { hasCallingCard, hasMusic, hasEndFrame })

  if (signal?.aborted) {
    throw new Error('Export cancelled')
  }

  onProgress?.(50)
  onLog?.('Concatenating clips...')

  const concatList = clipNames.map(name => `file '${name}'`).join('\n')
  await ffmpeg.writeFile('concat-list.txt', concatList)

  const concatArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat-list.txt',
    '-c', 'copy',
    '-y',
    'concatenated.mp4',
  ]

  const concatCode = await ffmpeg.exec(concatArgs)
  if (concatCode !== 0) {
    const logSnippet = ffmpegLogs.slice(-10).join(' | ')
    throw new Error(`Concat failed with code ${concatCode}. Logs: ${logSnippet}`)
  }

  onProgress?.(70)
  onLog?.('Applying overlays...')

  const musicInputIndex = hasCallingCard ? 2 : 1

  const filterParts: string[] = []
  let currentInput = '[0:v]'

  filterParts.push(`${currentInput}scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height},setsar=1[vscaled]`)
  currentInput = '[vscaled]'

  if (hasCallingCard) {
    filterParts.push(`${currentInput}[1:v]overlay=x=0:y=H-h-24,format=yuv420p[vout]`)
    currentInput = '[vout]'
  } else {
    filterParts.push(`${currentInput}format=yuv420p[vout]`)
  }

let finalAudioLabel = '-an'
  if (hasMusic) {
    filterParts.push(`[${musicInputIndex}:a]aloop=loop=-1:size=2e9[bg]`)
    if (!muteAudio) {
      filterParts.push(`[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[outa]`)
      finalAudioLabel = '[outa]'
    } else {
      filterParts.push(`[bg]anull[bga]`)
      finalAudioLabel = '[bga]'
    }
  } else if (!muteAudio) {
    filterParts.push(`[0:a]asetpts=PTS-STARTPTS[outa]`)
    finalAudioLabel = '[outa]'
  }

  if (hasEndFrame) {
    const endFrameInputIndex = 1 + (hasCallingCard ? 1 : 0) + (hasMusic ? 1 : 0)
    const totalDuration = clips.reduce((sum, clip) => sum + clip.trimmedDuration, 0) - (clips.length - 1) * 0
    const offset = Math.max(0, totalDuration - 1)
    filterParts.push(`[${endFrameInputIndex}:v]scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height},setsar=1[endframecrop]`)
    filterParts.push(`[${currentInput}][endframecrop]xfade=transition=fade:duration=1:offset=${offset}[vfinal]`)
    currentInput = '[vfinal]'
  }

  const finalVideoLabel = currentInput

  const finalArgs = [
    '-i', 'concatenated.mp4',
    ...(hasCallingCard ? ['-i', 'calling-card.png'] : []),
    ...(hasMusic ? ['-i', 'music.mp3'] : []),
    ...(hasEndFrame ? ['-i', 'endframe.png'] : []),
    '-filter_complex', filterParts.join(';'),
    '-map', finalVideoLabel,
    ...(finalAudioLabel !== '-an' ? ['-map', finalAudioLabel] : ['-an']),
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y',
    'output.mp4',
  ]

  const exportCode = await ffmpeg.exec(finalArgs)
  onProgress?.(95)
  if (exportCode !== 0) {
    const logSnippet = ffmpegLogs.slice(-10).join(' | ')
    throw new Error(`Export failed with code ${exportCode}. Logs: ${logSnippet}`)
  }

  const output = await ffmpeg.readFile('output.mp4')
  const bytes = output instanceof Uint8Array ? output : new TextEncoder().encode(String(output))
  return new Blob([bytes as unknown as BlobPart], { type: 'video/mp4' })
}

