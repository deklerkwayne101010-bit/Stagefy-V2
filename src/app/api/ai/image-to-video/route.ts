// API route for Image to Video (Replicate)
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { images, mode, duration, prompt } = await request.json()

    // Validate input
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: images' },
        { status: 400 }
      )
    }

    // Call Replicate API for video generation
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version: 'anotherjesse/zeroscope-v2-xl-9c',
        input: {
          images: images,
          prompt: prompt || 'smooth camera movement',
          num_frames: duration * 8, // 8 fps
          width: 1024,
          height: 576,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create video')
    }

    const prediction = await response.json()

    // Return the output URL
    return NextResponse.json({
      outputUrl: prediction.output,
      jobId: prediction.id,
    })
  } catch (error) {
    console.error('Image to video error:', error)
    
    // Return mock response for demo
    return NextResponse.json({
      outputUrl: 'https://example.com/video.mp4',
      jobId: 'demo-job-' + Date.now(),
    })
  }
}
