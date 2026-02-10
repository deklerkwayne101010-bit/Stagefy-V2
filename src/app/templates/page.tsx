// AI Template Builder page - Powered by Google Nano Banana Pro
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'

// Marketplace Templates - Preset templates available to all users
const marketplaceTemplates: { id: number; name: string; type: string; thumbnail: string; description: string }[] = [
  {
    id: 101,
    name: 'Corporate Pitch',
    type: 'professional',
    thumbnail: '/templates/corporate-pitch.jpg',
    description: 'Professional business presentation template'
  },
  {
    id: 102,
    name: 'Brand Story',
    type: 'professional',
    thumbnail: '/templates/brand-story.jpg',
    description: 'Engaging brand narrative template'
  },
  {
    id: 103,
    name: 'Neon Dreams',
    type: 'wacky',
    thumbnail: '/templates/neon-dreams.jpg',
    description: 'Vibrant cyberpunk-style template'
  },
  {
    id: 104,
    name: 'Market Stats',
    type: 'infographic',
    thumbnail: '/templates/market-stats.jpg',
    description: 'Data-driven infographic template'
  },
  {
    id: 105,
    name: 'Luxury Showcase',
    type: 'professional',
    thumbnail: '/templates/luxury-showcase.jpg',
    description: 'Elegant high-end property template'
  },
  {
    id: 106,
    name: 'Quick Sale',
    type: 'marketing',
    thumbnail: '/templates/quick-sale.jpg',
    description: 'Fast-paced promotional template'
  },
  {
    id: 107,
    name: 'Neighborhood Tour',
    type: 'infographic',
    thumbnail: '/templates/neighborhood.jpg',
    description: 'Community highlights template'
  },
  {
    id: 108,
    name: 'Open House',
    type: 'marketing',
    thumbnail: '/templates/open-house.jpg',
    description: 'Event promotion template'
  }
]

// Marketplace Template Types
const marketplaceTypes: { value: string; label: string; icon: string; description: string }[] = [
  { value: 'professional', label: 'Professional', icon: '👔', description: 'Clean and corporate' },
  { value: 'wacky', label: 'Wacky', icon: '🎨', description: 'Creative and fun' },
  { value: 'infographic', label: 'Infographic', icon: '📊', description: 'Data-driven visuals' },
  { value: 'marketing', label: 'Marketing', icon: '📢', description: 'Promotional content' },
  { value: 'custom', label: 'Custom', icon: '✨', description: 'Create your own style' },
]

// Color themes for custom templates
const colorThemes = [
  { value: 'modern_blue', label: 'Modern Blue', primary: '#3B82F6', secondary: '#1E40AF' },
  { value: 'elegant_gold', label: 'Elegant Gold', primary: '#F59E0B', secondary: '#B45309' },
  { value: 'fresh_green', label: 'Fresh Green', primary: '#10B981', secondary: '#047857' },
  { value: 'bold_red', label: 'Bold Red', primary: '#EF4444', secondary: '#B91C1C' },
  { value: 'soft_purple', label: 'Soft Purple', primary: '#8B5CF6', secondary: '#5B21B6' },
  { value: 'clean_white', label: 'Clean White', primary: '#F3F4F6', secondary: '#9CA3AF' },
]

// Aspect ratios for custom templates
const aspectRatios = [
  { value: '16:9', label: '16:9', description: 'Landscape (Video)' },
  { value: '9:16', label: '9:16', description: 'Portrait (Social)' },
  { value: '1:1', label: '1:1', description: 'Square (Instagram)' },
  { value: '4:3', label: '4:3', description: 'Standard' },
]

// Text overlay styles
const textStyles = [
  { value: 'minimal', label: 'Minimal', description: 'Subtle text overlays' },
  { value: 'bold', label: 'Bold', description: 'Large prominent text' },
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated typography' },
  { value: 'none', label: 'None', description: 'No text overlays' },
]

const CREDIT_COST = 5

export default function TemplatesPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'agent'>('create')
  const [librarySubTab, setLibrarySubTab] = useState<'yours' | 'marketplace'>('yours')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [templateType, setTemplateType] = useState('professional')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ outputUrl: string; isWatermarked?: boolean } | null>(null)
  const [savedTemplates, setSavedTemplates] = useState<{ id: number; name: string; type: string; thumbnail: string }[]>([])
  
  // Custom template options
  const [customColorTheme, setCustomColorTheme] = useState('modern_blue')
  const [customAspectRatio, setCustomAspectRatio] = useState('16:9')
  const [customTextStyle, setCustomTextStyle] = useState('minimal')
  const [customTitle, setCustomTitle] = useState('')
  const [customSubtitle, setCustomSubtitle] = useState('')

  // Agent profile state
  const [agentName, setAgentName] = useState('')
  const [agentEmail, setAgentEmail] = useState('')
  const [agentPhone, setAgentPhone] = useState('')
  const [agentPhoto, setAgentPhoto] = useState<string | null>(null)
  const [agentLogo, setAgentLogo] = useState<string | null>(null)
  const [includeAgentProfile, setIncludeAgentProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Load agent profile on mount
  useEffect(() => {
    const loadAgentProfile = async () => {
      try {
        const response = await fetch('/api/agent-profile')
        const data = await response.json()
        if (data.profile) {
          setAgentName(data.profile.name_surname || '')
          setAgentEmail(data.profile.email || '')
          setAgentPhone(data.profile.phone || '')
          setAgentPhoto(data.profile.photo_url || null)
          setAgentLogo(data.profile.logo_url || null)
        }
      } catch (err) {
        console.error('Error loading agent profile:', err)
      }
    }
    loadAgentProfile()
  }, [])

  // Save agent profile
  const saveAgentProfile = async () => {
    if (!agentName.trim() || !agentEmail.trim() || !agentPhone.trim()) {
      setError('Please fill in all required fields (Name, Email, Phone)')
      return
    }

    setSavingProfile(true)
    setError(null)

    try {
      const response = await fetch('/api/agent-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_surname: agentName,
          email: agentEmail,
          phone: agentPhone,
          photo_url: agentPhoto,
          logo_url: agentLogo,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }

      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save agent profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setPhoto: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhoto(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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

  const hasEnoughCredits = (user?.credits || 0) >= CREDIT_COST

  const handleSubmit = async () => {
    if (selectedImages.length === 0) {
      setError('Please upload at least one image')
      return
    }

    if (!prompt.trim() && templateType !== 'custom') {
      setError('Please describe your template')
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
      let finalPrompt = prompt
      
      // Add agent profile to prompt if toggle is enabled
      if (includeAgentProfile && agentName.trim()) {
        const agentInfo = `\n\nAgent Information (include in template):\n- Name: ${agentName}\n- Email: ${agentEmail}\n- Phone: ${agentPhone}`
        finalPrompt = `${prompt}${agentInfo}`
      }

      const requestBody: any = {
        images: selectedImages,
        type: templateType,
        userId: user?.id,
        prompt: finalPrompt,
      }
      
      // Add custom template options if selected
      if (templateType === 'custom') {
        requestBody.customOptions = {
          colorTheme: customColorTheme,
          aspectRatio: customAspectRatio,
          textStyle: customTextStyle,
          title: customTitle,
          subtitle: customSubtitle,
        }
      }
      
      // Add agent profile data if toggle is enabled
      if (includeAgentProfile) {
        requestBody.agentProfile = {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          photoUrl: agentPhoto,
          logoUrl: agentLogo,
        }
      }
      
      const response = await fetch('/api/ai/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      const data = await response.json()
      setResult({ outputUrl: data.outputUrl, isWatermarked: data.isWatermarked || false })
    } catch (err: any) {
      setError(err.message || 'Failed to create template. Please try again.')
      setResult({ outputUrl: 'https://example.com/template.jpg', isWatermarked: true })
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = () => {
    if (result) {
      setSavedTemplates(prev => [{
        id: Date.now(),
        name: `Custom ${marketplaceTypes.find(t => t.value === templateType)?.label}`,
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
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'agent'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Agent Profile 👤
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
                  {marketplaceTypes.map((type) => (
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

              {/* Custom Template Options */}
              {templateType === 'custom' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader 
                    title="Custom Template Settings" 
                    subtitle="Customize your template with specific options"
                  />
                  
                  {/* Color Theme */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {colorThemes.map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setCustomColorTheme(theme.value)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            customColorTheme === theme.value
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          title={theme.label}
                        >
                          <div 
                            className="w-full h-8 rounded"
                            style={{ 
                              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                            }}
                          />
                          <p className="text-xs text-gray-600 mt-1 text-center">{theme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {aspectRatios.map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => setCustomAspectRatio(ratio.value)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            customAspectRatio === ratio.value
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{ratio.label}</p>
                          <p className="text-xs text-gray-500">{ratio.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Style */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Overlay Style</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {textStyles.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setCustomTextStyle(style.value)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            customTextStyle === style.value
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{style.label}</p>
                          <p className="text-xs text-gray-500">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title Text (optional)</label>
                      <Input
                        placeholder="e.g., Luxury Villa in Sandton"
                        value={customTitle}
                        onChange={(e: any) => setCustomTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle Text (optional)</label>
                      <Input
                        placeholder="e.g., 4 Bed | 3 Bath | R4.5M"
                        value={customSubtitle}
                        onChange={(e: any) => setCustomSubtitle(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              )}

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

              {/* Add Agent Profile Toggle */}
              {agentName.trim() && (
                <Card className={`border-2 transition-all ${
                  includeAgentProfile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Add Agent Profile</p>
                        <p className="text-sm text-gray-500">Include your contact info in the template</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIncludeAgentProfile(!includeAgentProfile)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        includeAgentProfile ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          includeAgentProfile ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {includeAgentProfile && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        {agentPhoto && (
                          <img src={agentPhoto} alt="Agent" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{agentName}</p>
                          <p className="text-sm text-gray-500">{agentPhone} • {agentEmail}</p>
                        </div>
                        {agentLogo && (
                          <img src={agentLogo} alt="Agency Logo" className="h-8 object-contain" />
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}
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
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                    <img
                      src={result.outputUrl}
                      alt="Generated template"
                      className="w-full h-full object-cover"
                    />
                    {result.isWatermarked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium transform -rotate-12">
                          Stagefy Free
                        </div>
                      </div>
                    )}
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
                  disabled={selectedImages.length === 0 || !prompt.trim() || !hasEnoughCredits}
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
                  {result.isWatermarked && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Upgrade to remove watermark
                    </p>
                  )}
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
            {/* Sub-tabs for library */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setLibrarySubTab('yours')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  librarySubTab === 'yours'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }}`}
              >
                Your Templates ({savedTemplates.length})
              </button>
              <button
                onClick={() => setLibrarySubTab('marketplace')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  librarySubTab === 'marketplace'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }}`}
              >
                Template Marketplace ({marketplaceTemplates.length})
              </button>
            </div>

            {/* Your Templates Section */}
            {librarySubTab === 'yours' && (
              <div>
                {savedTemplates.length === 0 ? (
                  <Card className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No templates yet</h3>
                    <p className="mt-2 text-gray-500">Create your first template to see it here</p>
                    <Button className="mt-4" onClick={() => setActiveTab('create')}>
                      Create Template
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {savedTemplates.map((template) => (
                      <Card key={template.id} hover className="overflow-hidden">
                        <div className="aspect-video bg-gray-100 relative">
                          <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
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
                )}
              </div>
            )}

            {/* Template Marketplace Section */}
            {librarySubTab === 'marketplace' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Browse Ready-Made Templates</h3>
                  <p className="text-gray-500">Professional templates you can use instantly</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {marketplaceTemplates.map((template) => (
                    <Card key={template.id} hover className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 relative">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{template.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" fullWidth>
                            Preview
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => {
                            setTemplateType(template.type)
                            setActiveTab('create')
                          }}>
                            Use
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'agent' ? (
          /* Agent Profile Tab */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader 
                title="Agent Profile" 
                subtitle="Save your contact information to use in templates. This information will be automatically included when you enable 'Add Agent Profile' when generating templates."
              />

              {/* Profile Photo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Photo</label>
                <div className="flex items-center gap-4">
                  {agentPhoto ? (
                    <div className="relative">
                      <img 
                        src={agentPhoto} 
                        alt="Agent" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button
                        onClick={() => setAgentPhoto(null)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e: any) => handlePhotoUpload(e, setAgentPhoto)}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label 
                      htmlFor="photo-upload"
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Upload Photo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Agency Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency Logo</label>
                <div className="flex items-center gap-4">
                  {agentLogo ? (
                    <div className="relative">
                      <img 
                        src={agentLogo} 
                        alt="Agency Logo" 
                        className="h-16 object-contain border-4 border-white shadow-lg rounded-lg"
                      />
                      <button
                        onClick={() => setAgentLogo(null)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-48 bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg rounded-lg">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e: any) => handlePhotoUpload(e, setAgentLogo)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Upload Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG with transparent background</p>
                  </div>
                </div>
              </div>

              {/* Name & Surname */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name & Surname *</label>
                <Input
                  placeholder="e.g., John Smith"
                  value={agentName}
                  onChange={(e: any) => setAgentName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <Input
                  type="email"
                  placeholder="e.g., john@agency.com"
                  value={agentEmail}
                  onChange={(e: any) => setAgentEmail(e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <Input
                  type="tel"
                  placeholder="e.g., +27 82 123 4567"
                  value={agentPhone}
                  onChange={(e: any) => setAgentPhone(e.target.value)}
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-4">
                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={saveAgentProfile}
                  loading={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
                
                {profileSaved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Saved!</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
              )}

              {/* Preview Section */}
              {agentName.trim() && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-4">
                      {agentPhoto ? (
                        <img 
                          src={agentPhoto} 
                          alt="Agent" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-xl font-bold">{agentName || 'Your Name'}</h4>
                        <p className="text-white/80">{agentEmail || 'email@example.com'}</p>
                        <p className="text-white/80">{agentPhone || '+27 00 000 0000'}</p>
                      </div>
                      {agentLogo && (
                        <img 
                          src={agentLogo} 
                          alt="Logo" 
                          className="h-10 object-contain"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    This is how your contact information will appear in templates when "Add Agent Profile" is enabled.
                  </p>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
