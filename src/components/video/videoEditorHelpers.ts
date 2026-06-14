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
  const logoBoxSize = Math.min(Math.round(cardHeight * 0.28), Math.round(options.width * 0.12))
  const logoPadding = Math.round(logoBoxSize * 0.16)
  const logoSize = logoBoxSize - logoPadding * 2
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
  const logoX = options.width - padding - logoBoxSize
  const logoY = y + Math.round(cardHeight * 0.12)
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl)
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
      roundRect(ctx, logoX, logoY, logoBoxSize, logoBoxSize, Math.round(logoBoxSize * 0.18))
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      roundRect(ctx, logoX + logoPadding / 2, logoY + logoPadding / 2, logoBoxSize - logoPadding, logoBoxSize - logoPadding, Math.round(logoBoxSize * 0.16))
      ctx.fill()
      drawContainImage(ctx, logo, logoX + logoPadding, logoY + logoPadding, logoSize, logoSize, 0)
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
    nextTextY = wrapText(ctx, propertyDetails, textX, nextTextY + Math.round(cardHeight * 0.025), maxWidth, detailsLineHeight, 1)
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
