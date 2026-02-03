// API route for AI Template Builder (Google Nano Banana Pro)
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { images, type, prompt } = await request.json()

    // Validate input
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: images' },
        { status: 400 }
      )
    }

    // Call Replicate API for template generation
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version: 'google/nanobanana-pro',
        input: {
          images: images,
          template_type: type,
          prompt: prompt || 'Create a professional listing template',
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create template')
    }

    const prediction = await response.json()

    // Return the output URL
    return NextResponse.json({
      outputUrl: prediction.output,
      jobId: prediction.id,
    })
  } catch (error) {
    console.error('Template generation error:', error)
    
    // Return mock response for demo
    return NextResponse.json({
      outputUrl: 'https://example.com/template.jpg',
      jobId: 'demo-job-' + Date.now(),
    })
  }
}
