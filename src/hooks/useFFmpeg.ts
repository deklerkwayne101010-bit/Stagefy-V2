import { useState, useCallback } from 'react'
import { FFmpeg, type FileData } from '@ffmpeg/ffmpeg'

export function useFFmpeg() {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadFFmpeg = useCallback(async () => {
    if (ffmpeg && isLoaded) return ffmpeg

    setIsLoading(true)
    try {
      const ffmpegInstance = new FFmpeg()
      await ffmpegInstance.load()
      setFfmpeg(ffmpegInstance)
      setIsLoaded(true)
      return ffmpegInstance
    } catch (error) {
      console.error('Failed to load FFmpeg:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [ffmpeg, isLoaded])

  const getVideoDuration = useCallback(async (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'auto'
      video.src = url
      const done = (duration: number) => {
        if (duration && isFinite(duration) && duration > 0) {
          resolve(duration)
        } else {
          resolve(5)
        }
      }
      const handler = () => done(video.duration)
      const onError = () => resolve(5)
      video.addEventListener('loadedmetadata', handler, { once: true })
      video.addEventListener('durationchange', handler, { once: true })
      video.addEventListener('error', onError, { once: true })
      setTimeout(() => {
        done(video.duration || 5)
        video.removeEventListener('loadedmetadata', handler)
        video.removeEventListener('durationchange', handler)
        video.removeEventListener('error', onError)
      }, 3000)
    })
  }, [])

  const blobFromFileData = (data: FileData): Blob => {
    if (typeof data === 'string') {
      return new Blob([new TextEncoder().encode(data)], { type: 'text/plain' })
    }
    return new Blob([new Uint8Array(data as unknown as ArrayBuffer)], { type: 'video/mp4' })
  }

  const trimVideo = useCallback(
    async (inputUrl: string, startTime: number, endTime: number): Promise<Blob> => {
      const instance = await loadFFmpeg()
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      const response = await fetch(inputUrl)
      const fileData = await response.arrayBuffer()
      await instance.writeFile(inputName, new Uint8Array(fileData))

      await instance.exec([
        '-i', inputName,
        '-ss', startTime.toString(),
        '-to', endTime.toString(),
        '-c', 'copy',
        outputName
      ])

      const data = await instance.readFile(outputName)
      return blobFromFileData(data)
    },
    [loadFFmpeg]
  )

  const concatVideos = useCallback(
    async (urls: string[]): Promise<Blob> => {
      const instance = await loadFFmpeg()
      
      const validUrls = urls.filter(url => url && typeof url === 'string')
      if (validUrls.length === 0) {
        throw new Error('No valid URLs provided for concatenation')
      }
      
      for (let i = 0; i < validUrls.length; i++) {
        const response = await fetch(validUrls[i])
        const fileData = await response.arrayBuffer()
        await instance.writeFile(`input${i}.mp4`, new Uint8Array(fileData))
      }

      const concatList = validUrls.map((_, i) => `file 'input${i}.mp4'`).join('\n')
      await instance.writeFile('list.txt', concatList)

      await instance.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        'output.mp4'
      ])

      const data = await instance.readFile('output.mp4')
      return blobFromFileData(data)
    },
    [loadFFmpeg]
  )

  const addTextOverlay = useCallback(
    async (inputUrl: string, text: string, position: { x: number; y: number }, options?: { fontSize?: number; color?: string; startTime?: number; duration?: number }): Promise<Blob> => {
      const instance = await loadFFmpeg()
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      const response = await fetch(inputUrl)
      const fileData = await response.arrayBuffer()
      await instance.writeFile(inputName, new Uint8Array(fileData))

      const fontSize = options?.fontSize || 48
      const color = options?.color || 'white'
      const drawText = `drawtext=fontfile=/Arial.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}`
      
      await instance.exec([
        '-i', inputName,
        '-vf', drawText,
        '-c:a', 'copy',
        outputName
      ])

      const data = await instance.readFile(outputName)
      return blobFromFileData(data)
    },
    [loadFFmpeg]
  )

  const addFadeTransition = useCallback(
    async (inputUrl: string, duration: number = 1): Promise<Blob> => {
      const instance = await loadFFmpeg()
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      const response = await fetch(inputUrl)
      const fileData = await response.arrayBuffer()
      await instance.writeFile(inputName, new Uint8Array(fileData))

      await instance.exec([
        '-i', inputName,
        '-vf', `fade=t=in:st=0:d=${duration},fade=t=out:st=duration-${duration}:d=${duration}`,
        '-c:a', 'copy',
        outputName
      ])

      const data = await instance.readFile(outputName)
      return blobFromFileData(data)
    },
    [loadFFmpeg]
  )

  const createCTACard = useCallback(
    async (options: {
      title: string
      subtitle: string
      style?: 'gradient-blue' | 'gradient-green' | 'gradient-purple' | 'solid'
    }): Promise<Blob> => {
      const instance = await loadFFmpeg()
      const outputName = 'cta_card.mp4'
      
      const gradient = options.style === 'gradient-blue' 
        ? 'blue@0.5:blue@1' 
        : options.style === 'gradient-green' 
        ? 'green@0.5:green@1'
        : options.style === 'gradient-purple'
        ? 'purple@0.5:purple@1'
        : 'white:white'

      const filter = `color=c=black:s=1280x720:d=3,drawtext=fontfile=/Arial.ttf:text='${options.title}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-40,drawtext=fontfile=/Arial.ttf:text='${options.subtitle}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+40`
      
      await instance.exec([
        '-f', 'lavfi',
        '-i', filter,
        '-c:v', 'libx264',
        '-t', '3',
        outputName
      ])

      const data = await instance.readFile(outputName)
      return blobFromFileData(data)
    },
    [loadFFmpeg]
  )

  const processFullVideo = useCallback(
    async (clips: string[], options: {
      transitions?: boolean
      textOverlays?: Array<{ text: string; position: { x: number; y: number } }>
      ctaCard?: { title: string; subtitle: string }
    }): Promise<Blob> => {
      const instance = await loadFFmpeg()
      
      for (let i = 0; i < clips.length; i++) {
        const response = await fetch(clips[i])
        const fileData = await response.arrayBuffer()
        await instance.writeFile(`clip${i}.mp4`, new Uint8Array(fileData))
      }

      const concatList = clips.map((_, i) => `file 'clip${i}.mp4'`).join('\n')
      await instance.writeFile('list.txt', concatList)

      const outputName = 'final.mp4'
      await instance.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        outputName
      ])

      if (options.ctaCard) {
        const ctaBlob = await createCTACard({
          title: options.ctaCard.title,
          subtitle: options.ctaCard.subtitle
        })
        const ctaUrl = URL.createObjectURL(ctaBlob)
        
        const response = await fetch(ctaUrl)
        const ctaData = await response.arrayBuffer()
        await instance.writeFile('cta.mp4', new Uint8Array(ctaData))

        const finalConcat = clips.map((_, i) => `file 'clip${i}.mp4'`).join('\n') + '\nfile \'cta.mp4\''
        await instance.writeFile('list.txt', finalConcat)
        
        await instance.exec([
          '-f', 'concat',
          '-safe', '0',
          '-i', 'list.txt',
          '-c', 'copy',
          outputName
        ])
      }

      const data = await instance.readFile(outputName)
      return blobFromFileData(data)
    },
    [loadFFmpeg, createCTACard]
  )

  return {
    ffmpeg,
    isLoaded,
    isLoading,
    loadFFmpeg,
    getVideoDuration,
    trimVideo,
    concatVideos,
    addTextOverlay,
    addFadeTransition,
    createCTACard,
    processFullVideo,
  }
}