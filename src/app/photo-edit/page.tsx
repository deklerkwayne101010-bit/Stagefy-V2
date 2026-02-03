// AI Photo Editing page - Powered by Qwen Image Edit Plus
'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'

const presets = [
  { id: 'virtual-staging', name: 'Virtual Staging', icon: '🪑', prompt: 'Add modern furniture to make this room look staged and inviting. Include a sofa, coffee table, and decorative items.' },
  { id: 'declutter', name: 'Declutter', icon: '🧹', prompt: 'Remove all clutter and unnecessary items from this room. Keep only essential furniture and make the space look clean and spacious.' },
  { id: 'day-to-dusk', name: 'Day to Dusk', icon: '🌅', prompt: 'Transform this daytime photo into a beautiful dusk scene with warm golden hour lighting, soft shadows, and a dramatic sky.' },
  { id: 'sky-replace', name: 'Sky Replacement', icon: '☁️', prompt: 'Replace the current sky with a beautiful blue sky with fluffy white clouds. Match the lighting appropriately.' },
  { id: 'enhance-lighting', name: 'Enhance Lighting', icon: '💡', prompt: 'Improve the lighting in this photo. Brighten the room, enhance natural light, and make the space look warm and welcoming.' },
]

const CREDIT_COST = 2

export default function PhotoEditPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
        setProcessedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePresetClick = (preset: typeof presets[0]) => {
    setSelectedPreset(preset.id)
    setCustomPrompt(preset.prompt)
  }

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('Please upload an image first')
      return
    }

    if (!customPrompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if ((user?.credits || 0) < CREDIT_COST) {
      setError('Not enough credits. Please purchase more credits.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call the API to process the image with Qwen Image Edit Plus
      const response = await fetch('/api/ai/photo-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          prompt: customPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process image')
      }

      const data = await response.json()
      setProcessedImage(data.outputUrl)
    } catch (err) {
      setError('Failed to process image. Please try again.')
      // For demo, show a mock processed image
      setProcessedImage(selectedImage)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a')
      link.download = 'edited-photo.png'
      link.href = processedImage
      link.click()
    }
  }

  return (
    <div>
      <Header title="AI Photo Editing" subtitle="Edit listing photos with AI-powered tools" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Preview */}
          <div className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader title="Upload Image" subtitle="Drag & drop or click to browse" />
              
              {!selectedImage ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-4 text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Original"
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null)
                        setProcessedImage(null)
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </Card>

            {/* Before/After Preview */}
            {processedImage && (
              <Card>
                <CardHeader 
                  title="Result" 
                  subtitle="Your edited image is ready"
                  action={
                    <Button size="sm" onClick={handleDownload}>
                      Download
                    </Button>
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Before</p>
                    <img
                      src={selectedImage!}
                      alt="Before"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">After</p>
                    <img
                      src={processedImage}
                      alt="After"
                      className="w-full rounded-lg"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Presets & Prompt */}
          <div className="space-y-6">
            {/* Presets */}
            <Card>
              <CardHeader title="Quick Presets" subtitle="Choose a starting point" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedPreset === preset.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{preset.icon}</span>
                    <p className="font-medium text-gray-900 mt-1">{preset.name}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Custom Prompt */}
            <Card>
              <CardHeader 
                title="Edit Prompt" 
                subtitle="Describe what you want to change"
              />
              <Textarea
                placeholder="Describe your edit... (e.g., 'Make the living room brighter and add a plant in the corner')"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Be specific about what you want. Include details about style, colors, and layout.
              </p>
            </Card>

            {/* Credit Cost & Submit */}
            <Card className="bg-gray-900 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Credit Cost</p>
                  <p className="text-2xl font-bold mt-1">
                    <CreditBadge credits={CREDIT_COST} />
                  </p>
                </div>
                <Button
                  size="lg"
                  loading={loading}
                  disabled={!selectedImage || !customPrompt.trim() || (user?.credits || 0) < CREDIT_COST}
                  onClick={handleSubmit}
                >
                  {loading ? 'Processing...' : 'Edit Photo'}
                </Button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-3">{error}</p>
              )}
            </Card>

            {/* Tips */}
            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Photo Editing Tips</p>
                  <ul className="text-sm text-gray-500 mt-1 space-y-1">
                    <li>• Use high-quality images for best results</li>
                    <li>• Be specific in your prompts</li>
                    <li>• Virtual staging works best on empty rooms</li>
                    <li>• Day-to-dusk looks great on homes with good exterior shots</li>
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
