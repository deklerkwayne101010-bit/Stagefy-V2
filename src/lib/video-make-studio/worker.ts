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
  return !!process.env.NEXT_PUBLIC_WORKER_URL && !!process.env.NEXT_PUBLIC_WORKER_API_KEY
}

export async function stitchOnWorker(job: WorkerStitchJob): Promise<string> {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL
  const apiKey = process.env.NEXT_PUBLIC_WORKER_API_KEY

  if (!workerUrl || !apiKey) {
    throw new Error('Worker not configured')
  }

  const response = await fetch(`${workerUrl}/stitch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL
  const apiKey = process.env.NEXT_PUBLIC_WORKER_API_KEY

  if (!workerUrl || !apiKey) {
    return false
  }

  try {
    const response = await fetch(`${workerUrl}/health`, {
      headers: { 'x-api-key': apiKey },
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.status === 'ok' && data.ffmpeg === true
  } catch {
    return false
  }
}
