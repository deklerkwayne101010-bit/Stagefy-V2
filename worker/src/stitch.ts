import { Request, Response } from 'express'
import { mkdir, rm, writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { runFFmpeg } from './ffmpeg'
import { uploadToSupabase } from './supabase'

export interface StitchJob {
  format: { width: number; height: number }
  clips: { url: string; trimmedDuration: number }[]
  transitionDuration: number
  muteAudio: boolean
  callingCardUrl?: string
  musicUrl?: string
  endFrameUrl?: string
  userId: string
  appUrl?: string
}

export function buildFilterGraph(job: StitchJob): string {
  const { format, clips, transitionDuration, muteAudio } = job
  const filterParts: string[] = []

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
  const hasCallingCard = !!job.callingCardUrl
  const hasMusic = !!job.musicUrl
  const hasEndFrame = !!job.endFrameUrl

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

  return filterParts.join(';')
}

export function buildFFmpegArgs(job: StitchJob, filterGraph: string): string[] {
  const { clips, callingCardUrl, musicUrl, endFrameUrl } = job
  const args: string[] = []

  for (let i = 0; i < clips.length; i += 1) {
    args.push('-i', join(getTempDir(), `clip-${i}.mp4`))
  }

  if (callingCardUrl) {
    args.push('-i', join(getTempDir(), 'calling-card.png'))
  }
  if (musicUrl) {
    args.push('-i', join(getTempDir(), 'music.mp3'))
  }
  if (endFrameUrl) {
    args.push('-i', join(getTempDir(), 'endframe.png'))
  }

  args.push('-filter_complex', filterGraph)

  const hasEndFrame = !!endFrameUrl
  const hasMusic = !!musicUrl
  const finalVideoLabel = hasEndFrame ? '[vfinal]' : '[vout]'
  const finalAudioLabel = hasMusic ? '[outa]' : (!job.muteAudio ? '[outa]' : '-an')

  args.push('-map', finalVideoLabel)
  if (finalAudioLabel !== '-an') {
    args.push('-map', finalAudioLabel)
  } else {
    args.push('-an')
  }

  args.push('-c:v', 'libx264')
  args.push('-preset', 'ultrafast')
  args.push('-crf', '23')
  args.push('-threads', '0')
  args.push('-pix_fmt', 'yuv420p')
  args.push('-movflags', '+faststart')
  args.push('-y')
  args.push(join(getTempDir(), 'output.mp4'))

  return args
}

function getTempDir(): string {
  return process.env.TEMP_DIR || '/tmp'
}

function resolveUrl(url: string, appUrl?: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  if (appUrl) {
    return `${appUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
  }
  return url
}

async function downloadFile(url: string, dest: string, appUrl?: string): Promise<void> {
  const absoluteUrl = resolveUrl(url, appUrl)
  const response = await fetch(absoluteUrl)
  if (!response.ok) {
    throw new Error(`Failed to download ${absoluteUrl}: ${response.status}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(dest, buffer)
}

export async function stitchHandler(req: Request, res: Response): Promise<void> {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.WORKER_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const job = req.body as StitchJob
  if (!job.clips || job.clips.length === 0) {
    res.status(400).json({ error: 'clips array is required' })
    return
  }
  if (!job.format || !job.format.width || !job.format.height) {
    res.status(400).json({ error: 'format with width and height is required' })
    return
  }
  if (!job.userId) {
    res.status(400).json({ error: 'userId is required' })
    return
  }

  const maxClips = parseInt(process.env.MAX_CLIPS || '30', 10)
  if (job.clips.length > maxClips) {
    res.status(400).json({ error: `Maximum ${maxClips} clips allowed` })
    return
  }

  const jobId = randomUUID()
  const workDir = join(getTempDir(), `vms-${jobId}`)

  await mkdir(workDir, { recursive: true })

  try {
    for (let i = 0; i < job.clips.length; i += 1) {
      await downloadFile(job.clips[i].url, join(workDir, `clip-${i}.mp4`), job.appUrl)
    }

    if (job.callingCardUrl) {
      await downloadFile(job.callingCardUrl, join(workDir, 'calling-card.png'), job.appUrl)
    }
    if (job.musicUrl) {
      await downloadFile(job.musicUrl, join(workDir, 'music.mp3'), job.appUrl)
    }
    if (job.endFrameUrl) {
      await downloadFile(job.endFrameUrl, join(workDir, 'endframe.png'), job.appUrl)
    }

    const filterGraph = buildFilterGraph(job)
    const args = buildFFmpegArgs(job, filterGraph)

    const timeoutMs = parseInt(process.env.FFMPEG_TIMEOUT_MS || '600000', 10)
    await runFFmpeg({
      args,
      timeoutMs,
      onLog: (msg: string) => console.log(`[ffmpeg] ${msg}`),
    })

    const outputPath = join(workDir, 'output.mp4')
    const outputBuffer = await readFile(outputPath)

    const timestamp = Date.now()
    const outputPath2 = `stitched/${job.userId}/${timestamp}.mp4`
    const publicUrl = await uploadToSupabase(outputBuffer, outputPath2, 'video/mp4')

    res.json({ outputUrl: publicUrl })
  } catch (err: any) {
    console.error('Stitch failed:', err)
    res.status(500).json({ error: err.message || 'Stitching failed' })
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}
