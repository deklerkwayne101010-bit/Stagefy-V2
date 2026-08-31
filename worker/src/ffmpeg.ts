import { spawn } from 'child_process'
import { existsSync } from 'fs'

export async function checkFFmpeg(): Promise<boolean> {
  return new Promise(resolve => {
    const proc = spawn('ffmpeg', ['-version'])
    proc.on('error', () => resolve(false))
    proc.on('close', code => resolve(code === 0))
  })
}

export interface FFmpegOptions {
  args: string[]
  timeoutMs?: number
  onProgress?: (progress: number) => void
  onLog?: (message: string) => void
}

export interface FFmpegResult {
  code: number
  stderr: string[]
}

export function runFFmpeg(options: FFmpegOptions): Promise<FFmpegResult> {
  const { args, timeoutMs = 600000, onProgress, onLog } = options

  return new Promise((resolve, reject) => {
    const stderrLines: string[] = []
    const proc = spawn('ffmpeg', args)

    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      proc.kill('SIGKILL')
      reject(new Error(`FFmpeg timed out after ${timeoutMs / 1000}s`))
    }, timeoutMs)

    proc.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      for (const line of lines) {
        stderrLines.push(line)
        onLog?.(line)

        const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
        if (timeMatch && onProgress) {
          const hours = parseInt(timeMatch[1], 10)
          const minutes = parseInt(timeMatch[2], 10)
          const seconds = parseInt(timeMatch[3], 10)
          const centiseconds = parseInt(timeMatch[4], 10)
          const totalSeconds = hours * 3600 + minutes * 60 + seconds + centiseconds / 100
          onProgress(totalSeconds)
        }
      }
    })

    proc.on('error', err => {
      clearTimeout(timeout)
      reject(new Error(`FFmpeg process error: ${err.message}`))
    })

    proc.on('close', code => {
      clearTimeout(timeout)
      if (timedOut) return
      if (code !== 0) {
        const lastLines = stderrLines.slice(-5).join('\n')
        reject(new Error(`FFmpeg exited with code ${code}:\n${lastLines}`))
      } else {
        resolve({ code: 0, stderr: stderrLines })
      }
    })
  })
}

export function getFFmpegPath(): string {
  const candidates = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    'ffmpeg',
  ]
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return 'ffmpeg'
}
