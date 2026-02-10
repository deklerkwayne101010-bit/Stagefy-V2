// Image to Video page - Powered by Replicate
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { canPerformAction, checkUserCredits } from '@/lib/credits'

const videoDurations = [
  { value: '3', label: '3 seconds', credits: 5, description: 'Quick social media clip' },
  { value: '5', label: '5 seconds', credits: 8, description: 'Standard listing preview' },
  { value: '10', label: '10 seconds', credits: 15, description: 'Full property walkthrough' },
]

const CREDIT_COSTS = {
  '3': 5,
  '5': 8,
  '10': 15,
}

export default function ImageToVideoPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [mode, setMode] = useState<'single' | 'frames'>('single')
  const [duration, setDuration] = useState('5')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ videoUrl: string } | null>(null)
  const [userCredits, setUserCredits] = useState<number>(0)

  // Check user credits on mount
  useEffect(() => {
    const checkCredits = async () => {
      if (user?.id) {
        const credits = await checkUserCredits(user.id)
        setUserCredits(credits)
      }
    }
    checkCredits()
  }, [user?.id])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImages(prev => [...prev, event.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const creditCost = CREDIT_COSTS[duration as keyof typeof CREDIT_COSTS] || 8

  const handleSubmit = async () => {
    if (selectedImages.length === 0) {
      setError('Please upload at least one image')
      return
    }

    // Check if user can perform action
    if (user?.id) {
      const canPerformResult = await canPerformAction(user.id, creditCost)
      if (!canPerformResult.canPerform) {
        setError(canPerformResult.error || 'Cannot perform action')
        return
      }
    } else if ((user?.credits || 0) < creditCost) {
      setError('Not enough credits. Please purchase more credits.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call the API to convert images to video
      const response = await fetch('/api/ai/image-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: selectedImages,
          mode,
          duration: parseInt(duration),
          prompt,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create video')
      }

      const data = await response.json()
      setResult({ videoUrl: data.outputUrl })
      
      // Update credits display
      const credits = await checkUserCredits(user?.id || '')
      setUserCredits(credits)
    } catch (err: any) {
      setError(err.message || 'Failed to create video. Please try again.')
      // For demo, set a mock result
      setResult({ videoUrl: 'https://example.com/video.mp4' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (result?.videoUrl) {
      const link = document.createElement('a')
      link.download = 'listing-video.mp4'
      link.href = result.videoUrl
      link.click()
    }
  }

  return (
    <div>
      <Header title="Image to Video" subtitle="Turn your listing photos into engaging videos" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selection */}
            <Card>
              <CardHeader title="Video Mode" subtitle="Choose how to create your video" />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('single')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    mode === 'single'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Single Image</p>
                      <p className="text-sm text-gray-500">One photo → Video</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setMode('frames')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    mode === 'frames'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Image Sequence</p>
                      <p className="text-sm text-gray-500">Start + End frame → Video</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader 
                title={mode === 'single' ? 'Upload Image' : 'Upload Frames'} 
                subtitle={mode === 'single' ? 'Add your listing photo' : 'Upload start and end frames'} 
              />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-32 cursor-pointer hover:border-blue-500 transition-colors">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-500 mt-2">Add Image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={mode === 'frames'}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {mode === 'frames' && selectedImages.length > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  💡 Tip: Upload 2 images for smooth transitions (start → end frame)
                </p>
              )}
            </Card>

            {/* Duration & Prompt */}
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Video Duration"
                  value={duration}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDuration(e.target.value)}
                  options={videoDurations.map(d => ({ value: d.value, label: `${d.label} - ${d.credits} credits` }))}
                />
                
                <div className="p-4 rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-600 font-medium">Credit Cost</p>
                  <CreditBadge credits={creditCost} size="md" />
                </div>
              </div>

              <Textarea
                label="Motion Prompt (optional)"
                placeholder="Describe the motion you want... (e.g., 'slow pan right', 'zoom in gradually', 'smooth transition')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="mt-4"
              />
            </Card>
          </div>

          {/* Right Column - Preview & Submit */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader title="Preview" subtitle="Your video will appear here" />
              
              {!result ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mt-2">No video yet</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    src={result.videoUrl}
                    controls
                    className="w-full h-full"
                  />
                </div>
              )}
            </Card>

            {/* Submit */}
            <Card className="bg-gray-900 text-white border-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-medium">{videoDurations.find(d => d.value === duration)?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Images</span>
                  <span className="font-medium">{selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="text-gray-400">Total Cost</span>
                  <CreditBadge credits={creditCost} />
                </div>
                {user && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Your Balance</span>
                    <span className="font-medium">{userCredits} credits</span>
                  </div>
                )}
              </div>

              <Button
                fullWidth
                size="lg"
                className="mt-4"
                loading={loading}
                disabled={selectedImages.length === 0 || !user || userCredits < creditCost}
                onClick={handleSubmit}
              >
                {loading ? 'Creating Video...' : 'Create Video'}
              </Button>

              {error && (
                <p className="text-red-400 text-sm mt-3">{error}</p>
              )}
            </Card>

            {/* Download */}
            {result && (
              <Card>
                <Button fullWidth onClick={handleDownload}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Video
                </Button>
              </Card>
            )}

            {/* Tips */}
            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Video Tips</p>
                  <ul className="text-sm text-gray-500 mt-1 space-y-1">
                    <li>• Use high-resolution images (1920x1080 or higher)</li>
                    <li>• Add motion prompts for better control</li>
                    <li>• Longer videos use more credits</li>
                    <li>• Save videos to your CRM for easy access</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
