// AI Photo Editing page - Powered by Qwen Image Edit 2511
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import { uploadImage, getUploadHistory } from '@/lib/supabase'

const presets = [
  { id: 'auto-enhance', name: 'Auto Enhance', icon: '✨', prompt: 'Professionally enhance this real estate photo as if taken by a professional real estate photographer. Improve overall image quality, make it crystal clear and sharp, optimize brightness and contrast for perfect exposure, enhance colors to be natural and vibrant, remove any noise or imperfections, improve sharpness and clarity, and create a clean professional look. Do not alter the property structure, furniture, or any elements - only enhance the quality and make the photo look expertly shot.' },
  { id: 'virtual-staging', name: 'Virtual Staging', icon: '🪑', prompt: 'Add tasteful, modern furniture to make this property look staged and inviting. Include appropriate furniture for the room type - sofa, coffee table, decorative items, plants. Make it look like a professionally decorated show home. Do not alter the property structure.' },
  { id: 'declutter', name: 'Declutter', icon: '🧹', prompt: 'Remove all clutter, personal items, and unnecessary objects from this real estate photo. Make the space look clean, spacious, and ready for sale. Keep essential furniture that showcases the property well. Do not alter the property structure or add new items.' },
  { id: 'day-to-dusk', name: 'Day to Dusk', icon: '🌅', prompt: 'Transform this daytime property photo into a beautiful dusk scene. Add warm golden hour lighting, soft ambient glowing lights from windows, a dramatic twilight sky with deep blue and purple hues. Create cozy, inviting atmosphere. Do not alter the property structure.' },
  { id: 'sky-replace', name: 'Sky Replacement', icon: '☁️', prompt: 'Replace the current sky with a beautiful blue sky with fluffy white clouds. Ensure the lighting on the property matches the blue sky. Make it look natural and professional.' },
  { id: 'enhance-lighting', name: 'Enhance Lighting', icon: '💡', prompt: 'Professionally enhance the lighting in this real estate photo. Brighten the room appropriately, enhance natural light, balance shadows and highlights, create warm and inviting atmosphere. Make each room look well-lit and welcoming. Do not alter the property structure.' },
  { id: 'window-pulling', name: 'Window Pulling', icon: '🪟', prompt: 'Do not alter the window frame, room, or any interior elements. Only adjust the exposure and clarity of the view visible through the window so that the outdoor scenery is fully visible and natural, as if standing in the property looking outside. Keep everything inside the room exactly as it is.' },
  { id: 'color-correct', name: 'Color Correct', icon: '🎨', prompt: 'professionally color correct this real estate photo. Optimize white balance to show accurate colors, enhance saturation slightly for vibrant but natural colors, improve color clarity and make the photo look professionally edited. Do not alter the property structure.' },
  { id: 'hdr-merge', name: 'HDR Effect', icon: '📸', prompt: 'Create a professional HDR effect for this real estate photo. Improve dynamic range - brighten shadows, tone down highlights, enhance details in both light and dark areas. Make the photo look high-quality with balanced exposure. Do not alter the property structure.' },
  { id: 'sharpening', name: 'Professional Sharpening', icon: '🔍', prompt: 'Apply professional sharpening to make this real estate photo crystal clear and sharp. Enhance edge definition, improve clarity for a professional look. Make the photo look like it was taken with a high-quality camera. Do not alter the property structure.' },
]

const CREDIT_COST = 1

export default function PhotoEditPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const [targetImage, setTargetImage] = useState<string | null>(null)
  const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWatermarked, setIsWatermarked] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<Array<{ id: string; url: string; created_at: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [useReference, setUseReference] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [savedPrompts, setSavedPrompts] = useState<Array<{ id: string; name: string; prompt: string }>>([])
  const [showSavedPrompts, setShowSavedPrompts] = useState(false)
  const [savePromptName, setSavePromptName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Load saved prompts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stagefy-saved-prompts')
      if (stored) {
        setSavedPrompts(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save a prompt
  const handleSavePrompt = () => {
    if (!customPrompt.trim() || !savePromptName.trim()) return

    const newPrompt = {
      id: Date.now().toString(),
      name: savePromptName.trim(),
      prompt: customPrompt.trim(),
    }

    const updated = [...savedPrompts, newPrompt]
    setSavedPrompts(updated)
    localStorage.setItem('stagefy-saved-prompts', JSON.stringify(updated))
    setSavePromptName('')
    setShowSaveDialog(false)
  }

  // Delete a saved prompt
  const handleDeletePrompt = (id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id)
    setSavedPrompts(updated)
    localStorage.setItem('stagefy-saved-prompts', JSON.stringify(updated))
  }

  // Load a saved prompt
  const handleLoadPrompt = (prompt: string) => {
    setCustomPrompt(prompt)
    setSelectedPreset(null)
    setShowSavedPrompts(false)
  }

  // Check if user has enough credits
  const hasEnoughCredits = (user?.credits || 0) >= CREDIT_COST

  // Fetch upload history on mount
  useEffect(() => {
    const fetchUploadHistory = async () => {
      if (user?.id) {
        const { data } = await getUploadHistory(user.id, 10)
        if (data) {
          setUploadHistory(data)
        }
      }
    }
    fetchUploadHistory()
  }, [user?.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReference = false) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploading(true)
      let uploadedUrl: string | null = null
      
      try {
        // Upload to Supabase if user is logged in
        if (user?.id) {
          const { data, error } = await uploadImage(file, user.id)
          if (error) {
            console.warn('Supabase upload failed, using local preview:', error)
          } else if (data) {
            // Store Supabase URL for AI processing
            uploadedUrl = data.url
            
            // Add to upload history
            setUploadHistory(prev => [
              { id: data.id, url: data.url, created_at: new Date().toISOString() },
              ...prev.slice(0, 9)
            ])
          }
        }

        // Show local preview
        const reader = new FileReader()
        reader.onload = (event) => {
          if (isReference) {
            setReferenceImage(event.target?.result as string)
            // Use Supabase URL if available, otherwise local preview
            setReferenceImageUrl(uploadedUrl)
          } else {
            setTargetImage(event.target?.result as string)
            // Use Supabase URL if available, otherwise local preview
            setTargetImageUrl(uploadedUrl)
            setProcessedImage(null)
          }
        }
        reader.readAsDataURL(file)
      } finally {
        setUploading(false)
      }
    }
  }

  const handleSelectFromHistory = (url: string, isReference = false) => {
    if (isReference) {
      setReferenceImage(url)
      setReferenceImageUrl(url)
    } else {
      setTargetImage(url)
      setTargetImageUrl(url)
      setProcessedImage(null)
    }
  }

  const handlePresetClick = (preset: typeof presets[0]) => {
    setSelectedPreset(preset.id)
    setCustomPrompt(preset.prompt)
  }

  const handleSubmit = async () => {
    if (!targetImage) {
      setError('Please upload a target image first')
      return
    }

    if (useReference && !referenceImage) {
      setError('Please upload a reference image')
      return
    }

    if (!customPrompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    // Check if user has enough credits
    if (!hasEnoughCredits) {
      setError('Not enough credits. Please purchase more credits.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use Supabase URL if available, otherwise local preview
      const imageToProcess = targetImageUrl || targetImage
      const referenceToProcess = useReference ? (referenceImageUrl || referenceImage) : null
      
      // Get auth token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      // Call the API to process the image with Qwen Image Edit 2511
      const response = await fetch('/api/ai/photo-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          image: imageToProcess,
          referenceImage: referenceToProcess,
          prompt: customPrompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const data = await response.json()
      setProcessedImage(data.outputUrl)
      setIsWatermarked(false)
      window.scrollTo(0, document.body.scrollHeight)
    } catch (err: any) {
      setError(err.message || 'Failed to process image. Please try again.')
      // For demo, show a mock processed image
      setProcessedImage(targetImage)
      setIsWatermarked(false)
      window.scrollTo(0, document.body.scrollHeight)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!processedImage) return
    
    try {
      const response = await fetch(processedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `edited-photo-${Date.now()}.png`
      link.href = url
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(processedImage, '_blank')
    }
  }



  return (
    <div>
      <Header title="AI Photo Editing" subtitle="Edit listing photos with AI-powered tools" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Preview */}
          <div className="space-y-6">
            {/* Reference Image Upload (for pose transfer, etc.) */}
            {useReference && (
              <Card>
                <CardHeader title="Reference Image" subtitle="Image with the pose or style you want to apply" />
                
                {!referenceImage ? (
                  <div
                    className="border-2 border-dashed border-purple-300 bg-purple-50 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
                    onClick={() => referenceInputRef.current?.click()}
                  >
                    <svg className="w-10 h-10 mx-auto text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-3 text-purple-700 font-medium">Upload Reference Image</p>
                    <p className="text-sm text-purple-500 mt-1">This image provides the pose or style to apply</p>
                    <input
                      ref={referenceInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-full rounded-lg"
                      />
                      <button
                        onClick={() => setReferenceImage(null)}
                        className="absolute top-2 right-2 p-1 bg-purple-500 text-white rounded-full hover:bg-purple-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => referenceInputRef.current?.click()}
                    >
                      Change Reference Image
                    </Button>
                    <input
                      ref={referenceInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                  </div>
                )}
              </Card>
            )}

            {/* Target Image Upload */}
            <Card>
              <CardHeader title="Target Image" subtitle="Drag & drop or click to browse" />
              
              {!targetImage ? (
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
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={targetImage}
                      alt="Original"
                      className="w-full rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setTargetImage(null)
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
                    Change Target Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                  />
                </div>
              )}
            </Card>

            {/* Upload History */}
            {uploadHistory.length > 0 && (
              <Card>
                <CardHeader title="Upload History" subtitle="Recent uploaded images" />
                <div className="grid grid-cols-5 gap-3">
                  {uploadHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectFromHistory(item.url, useReference)}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                    >
                      <img
                        src={item.url}
                        alt="Uploaded"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Before/After Preview */}
            {processedImage && (
              <Card>
                <CardHeader 
                  title="Result" 
                  subtitle="Your edited image is ready - click to enlarge"
                  action={
                      <Button size="sm" onClick={handleDownload}>
                        Download
                      </Button>
                    }
                />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-medium">Before</p>
                    <div 
                      className="relative group cursor-pointer rounded-lg overflow-hidden"
                      onClick={() => setFullscreenImage(targetImage!)}
                    >
                      <img
                        src={targetImage!}
                        alt="Before"
                        className="w-full h-auto rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ minHeight: '300px' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-medium">After</p>
                    <div 
                      className="relative group cursor-pointer rounded-lg overflow-hidden"
                      onClick={() => setFullscreenImage(processedImage)}
                    >
                      <img
                        src={processedImage}
                        alt="After"
                        className="w-full h-auto rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ minHeight: '300px' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
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
                subtitle={useReference ? "Describe what to transfer from reference to target" : "Describe what you want to change"}
              />
              <Textarea
                placeholder={useReference ? "e.g., 'Apply the pose from image 1 to make the person in image 2 stand similarly'" : "Describe your edit... (e.g., 'Make the living room brighter and add a plant in the corner')"}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
              />

              {/* Save/Load Prompt Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!customPrompt.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Prompt
                </button>
                {savedPrompts.length > 0 && (
                  <button
                    onClick={() => setShowSavedPrompts(!showSavedPrompts)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Saved ({savedPrompts.length})
                  </button>
                )}
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Save this prompt as:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Bright living room"
                      value={savePromptName}
                      onChange={(e) => setSavePromptName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePrompt()}
                    />
                    <button
                      onClick={handleSavePrompt}
                      disabled={!savePromptName.trim()}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Prompts List */}
              {showSavedPrompts && savedPrompts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {savedPrompts.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{sp.name}</p>
                        <p className="text-xs text-gray-500 truncate">{sp.prompt}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleLoadPrompt(sp.prompt)}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(sp.id)}
                          className="px-2.5 py-1 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Be specific about what you want. {useReference && "Mention which image provides the reference."}
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
                  disabled={
                    !targetImage || 
                    (useReference && !referenceImage) ||
                    !customPrompt.trim() || 
                    !hasEnoughCredits
                  }
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
                    {useReference && <li>• Reference images should clearly show the desired pose or style</li>}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
