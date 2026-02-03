// AI Template Builder page - Powered by Google Nano Banana Pro
'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'

const templateTypes = [
  { value: 'listing_promo', label: 'Listing Promo', icon: '🏠', description: 'Professional listing video' },
  { value: 'instagram_reel', label: 'Instagram Reel', icon: '📱', description: 'Social media ready' },
  { value: 'open_house', label: 'Open House', icon: '🚪', description: 'Event promotion' },
  { value: 'custom', label: 'Custom', icon: '✨', description: 'Create your own' },
]

const sampleTemplates = [
  { id: 1, name: 'Modern Luxury', type: 'listing_promo', thumbnail: 'https://example.com/thumb1.jpg' },
  { id: 2, name: 'Cozy Home', type: 'listing_promo', thumbnail: 'https://example.com/thumb2.jpg' },
  { id: 3, name: 'Urban Loft', type: 'instagram_reel', thumbnail: 'https://example.com/thumb3.jpg' },
  { id: 4, name: 'Open House Flyer', type: 'open_house', thumbnail: 'https://example.com/thumb4.jpg' },
]

const CREDIT_COST = 3

export default function TemplatesPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [templateType, setTemplateType] = useState('listing_promo')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ outputUrl: string } | null>(null)
  const [savedTemplates, setSavedTemplates] = useState(sampleTemplates)

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

  const handleSubmit = async () => {
    if (selectedImages.length === 0) {
      setError('Please upload at least one image')
      return
    }

    if (!prompt.trim()) {
      setError('Please describe your template')
      return
    }

    if ((user?.credits || 0) < CREDIT_COST) {
      setError('Not enough credits. Please purchase more credits.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: selectedImages,
          type: templateType,
          prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const data = await response.json()
      setResult({ outputUrl: data.outputUrl })
    } catch (err) {
      setError('Failed to create template. Please try again.')
      setResult({ outputUrl: 'https://example.com/template.jpg' })
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = () => {
    if (result) {
      setSavedTemplates(prev => [{
        id: Date.now(),
        name: `Custom ${templateTypes.find(t => t.value === templateType)?.label}`,
        type: templateType,
        thumbnail: result.outputUrl,
      }, ...prev])
    }
  }

  return (
    <div>
      <Header title="AI Template Builder" subtitle="Create stunning listing templates with AI" />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Create New Template
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Template Library ({savedTemplates.length})
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Type */}
              <Card>
                <CardHeader title="Template Type" subtitle="Choose what kind of template to create" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {templateTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setTemplateType(type.value)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        templateType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="font-medium text-gray-900 mt-2 text-sm">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader title="Upload Images" subtitle="Add photos to include in your template" />
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-28 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-28 cursor-pointer hover:border-blue-500 transition-colors">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-500 mt-2">Add Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </Card>

              {/* Prompt */}
              <Card>
                <CardHeader 
                  title="Template Description" 
                  subtitle="Describe your template style and elements" 
                />
                <Textarea
                  placeholder="Describe your template... (e.g., 'Create a modern luxury listing promo with smooth transitions, elegant text overlay showing property features, and a warm color scheme')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </Card>
            </div>

            {/* Right Column - Preview & Submit */}
            <div className="space-y-6">
              {/* Preview */}
              <Card>
                <CardHeader title="Preview" subtitle="Your template will appear here" />
                
                {!result ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <p className="text-gray-500 mt-2">No template yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={result.outputUrl}
                      alt="Generated template"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </Card>

              {/* Submit */}
              <Card className="bg-gray-900 text-white border-0">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Credit Cost</span>
                  <CreditBadge credits={CREDIT_COST} />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="mt-4"
                  loading={loading}
                  disabled={selectedImages.length === 0 || !prompt.trim() || (user?.credits || 0) < CREDIT_COST}
                  onClick={handleSubmit}
                >
                  {loading ? 'Creating Template...' : 'Generate Template'}
                </Button>

                {error && (
                  <p className="text-red-400 text-sm mt-3">{error}</p>
                )}
              </Card>

              {/* Save to Library */}
              {result && (
                <Card>
                  <Button fullWidth onClick={saveTemplate}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save to Library
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
                    <p className="font-medium text-gray-900">Template Tips</p>
                    <ul className="text-sm text-gray-500 mt-1 space-y-1">
                      <li>• Include 3-5 best property photos</li>
                      <li>• Describe the mood and style you want</li>
                      <li>• Mention any text you want included</li>
                      <li>• Save reusable templates for future</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Template Library */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Templates</h2>
                <p className="text-gray-500">Templates you&apos;ve created and saved</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedTemplates.map((template) => (
                <Card key={template.id} hover className="overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{template.type.replace('_', ' ')}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" fullWidth>
                        Use
                      </Button>
                      <Button size="sm" variant="ghost">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
