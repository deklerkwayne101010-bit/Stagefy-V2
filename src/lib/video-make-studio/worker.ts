export interface WorkerStitchJob {
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

export interface WorkerStitchResult {
  outputUrl: string
}

export function isWorkerEnabled(): boolean {
  return !!process.env.WORKER_URL && !!process.env.WORKER_API_KEY
}

export async function stitchOnWorker(job: WorkerStitchJob): Promise<string> {
  const response = await fetch('/api/ai/video-make-studio/worker-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(job),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Worker request failed: ${response.status} ${errorText}`)
  }

  const result = (await response.json()) as WorkerStitchResult
  return result.outputUrl
}

export async function checkWorkerHealth(): Promise<boolean> {
  if (!process.env.WORKER_URL || !process.env.WORKER_API_KEY) {
    return false
  }

  try {
    const response = await fetch(`${process.env.WORKER_URL}/health`, {
      headers: { 'x-api-key': process.env.WORKER_API_KEY },
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.status === 'ok' && data.ffmpeg === true
  } catch {
    return false
  }
}
