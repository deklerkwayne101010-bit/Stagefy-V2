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
  const padding = Math.round(options.width * 0.045)
  const avatarSize = Math.round(cardHeight * 0.52)

  ctx.clearRect(0, 0, options.width, options.height)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'
  roundRect(ctx, 0, y, options.width, cardHeight, 0)
  ctx.fill()

  const photoUrl = options.photoUrl || ''
  if (photoUrl) {
    try {
      const photo = await loadImage(photoUrl)
      ctx.save()
      ctx.beginPath()
      ctx.arc(padding + avatarSize / 2, y + cardHeight / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(photo, padding, y + cardHeight / 2 - avatarSize / 2, avatarSize, avatarSize)
      ctx.restore()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
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
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl)
      const logoSize = Math.round(cardHeight * 0.34)
      ctx.drawImage(logo, options.width - padding - logoSize, y + padding, logoSize, logoSize)
    } catch {
    }
  }

  const textX = padding + avatarSize + Math.round(options.width * 0.035)
  const maxWidth = options.width - textX - padding - (logoUrl ? Math.round(cardHeight * 0.42) : 0)

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${Math.max(24, Math.round(options.width * 0.045))}px Arial, sans-serif`
  ctx.textBaseline = 'top'
  wrapText(ctx, options.headline || options.agentName || 'Real Estate Agent', textX, y + Math.round(cardHeight * 0.12), maxWidth, Math.round(options.width * 0.04))

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
  ctx.font = `500 ${Math.max(17, Math.round(options.width * 0.032))}px Arial, sans-serif`
  const details = [options.phone, options.email, options.agency].filter(Boolean).join(' • ')
  wrapText(ctx, details || 'Contact me today', textX, y + Math.round(cardHeight * 0.48), maxWidth, Math.round(options.width * 0.032))

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${Math.max(18, Math.round(options.width * 0.034))}px Arial, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText((options.cta || 'Call or WhatsApp').toUpperCase(), options.width - padding, y + cardHeight - Math.round(cardHeight * 0.28) - 4)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return null
  return new Uint8Array(await blob.arrayBuffer())
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''

  words.forEach(word => {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else {
      line = testLine
    }
  })

  if (line) {
    ctx.fillText(line, x, y)
  }
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
