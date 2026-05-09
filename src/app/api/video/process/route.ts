import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function POST(request: NextRequest) {
  try {
    const { clips, transitions, textOverlays, outputSettings, ctaCard, template } = await request.json()

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const creditCost = ctaCard ? 12 : 10

    const tempDir = path.join('/tmp', randomUUID())
    fs.mkdirSync(tempDir, { recursive: true })

    try {
      const clipPaths: string[] = []
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        const response = await fetch(clip.url)
        const buffer = await response.arrayBuffer()
        const clipPath = path.join(tempDir, `clip${i}.mp4`)
        
        if (clip.trimStart > 0 || clip.trimEnd < clip.duration) {
          const trimmedPath = path.join(tempDir, `trimmed${i}.mp4`)
          fs.writeFileSync(trimmedPath, Buffer.from(buffer))
          await new Promise<void>((resolve, reject) => {
            ffmpeg()
              .input(trimmedPath)
              .output(trimmedPath + '.out')
              .setStartTime(clip.trimStart)
              .setDuration(clip.trimEnd - clip.trimStart)
              .on('end', () => {
                fs.renameSync(trimmedPath + '.out', trimmedPath)
                resolve()
              })
              .on('error', reject)
              .run()
          })
          clipPaths.push(trimmedPath)
        } else {
          fs.writeFileSync(clipPath, Buffer.from(buffer))
          clipPaths.push(clipPath)
        }
      }

      const filesToConcat = [...clipPaths]

      if (ctaCard) {
        const ctaPath = path.join(tempDir, 'cta.mp4')
        
        await new Promise<void>((resolve) => {
          ffmpeg()
            .input('color=c=black:s=1920x1080:d=3')
            .inputFormat('lavfi')
            .output(ctaPath)
            .outputOptions([
              '-vf', `drawtext=text='${ctaCard.title}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-50,drawtext=text='${ctaCard.subtitle}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+30`
            ])
            .on('end', () => resolve())
            .on('error', () => resolve())
            .run()
        })
        
        if (fs.existsSync(ctaPath)) {
          filesToConcat.push(ctaPath)
        }
      }

      const outputPath = path.join(tempDir, 'output.mp4')

      await new Promise<void>((resolve, reject) => {
        let command = ffmpeg()

        filesToConcat.forEach(p => {
          command = command.input(p)
        })

        command
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .mergeToFile(outputPath, tempDir)
      })

      const fileName = `${user.id}/videos/${randomUUID()}.mp4`
      const fileBuffer = fs.readFileSync(outputPath)
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, fileBuffer, {
          contentType: 'video/mp4',
          cacheControl: '3600',
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      fs.rmSync(tempDir, { recursive: true, force: true })

      return NextResponse.json({
        outputUrl: urlData.publicUrl,
        creditCost,
      })
    } catch (processingError) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      throw processingError
    }
  } catch (error) {
    console.error('Video processing error:', error)
    return NextResponse.json({ error: 'Failed to process video' }, { status: 500 })
  }
}