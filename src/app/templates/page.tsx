// AI Template Builder page - Powered by Google Nano Banana Pro
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import { TemplateSelectionModal } from '@/components/templates/TemplateSelectionModal'
import { ProfessionalTemplateWizard } from '@/components/templates/ProfessionalTemplateWizard'
import { InfographicWizard } from '@/components/templates/InfographicWizard'
import { HolidayPromoWizard } from '@/components/templates/HolidayPromoWizard'
import { TestimonialWizard } from '@/components/templates/TestimonialWizard'
import { AgentShowcaseWizard } from '@/components/templates/AgentShowcaseWizard'
import { LayoutGenerationPopup } from '@/components/templates/LayoutGenerationPopup'
import { PromptReviewInterface } from '@/components/templates/PromptReviewInterface'
import { AgentProfilePopup } from '@/components/templates/AgentProfilePopup'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/types'

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
    id: 107,
    name: 'Neighborhood Tour',
    type: 'infographic',
    thumbnail: '/templates/neighborhood.jpg',
    description: 'Community highlights template'
  }
]

// Marketplace Template Types
const marketplaceTypes: { value: string; label: string; icon: string; description: string }[] = [
  { value: 'professional', label: 'Professional', icon: '👔', description: 'Clean and corporate' },
  { value: 'infographic', label: 'Infographic', icon: '📊', description: 'Data-driven visuals' },
  { value: 'holiday', label: 'Holiday Promos', icon: '🎉', description: 'SA holiday posters' },
  { value: 'testimonial', label: 'Testimonials', icon: '💬', description: 'Client reviews & ratings' },
  { value: 'agent_showcase', label: 'Agent Showcase', icon: '🌟', description: 'Agent personal branding' },
  { value: 'custom', label: 'Custom', icon: '✨', description: 'Enter your own custom prompt' },
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

  // Version selection state
  const [showVersionPopup, setShowVersionPopup] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<'standard' | 'pro'>('standard')

  // Recent generations - auto-saved, keeps last 5
  const [recentGenerations, setRecentGenerations] = useState<{
    id: number
    type: string
    typeName: string
    thumbnail: string
    prompt: string
    timestamp: number
  }[]>([])

  // Load recent generations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stagefy-recent-generations')
      if (stored) {
        setRecentGenerations(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Auto-save a generation to recent list (keeps last 10)
  const autoSaveGeneration = (outputUrl: string, type: string, prompt: string) => {
    if (!outputUrl || outputUrl.includes('example.com')) return // Don't save demo/placeholder URLs

    const typeName = marketplaceTypes.find(t => t.value === type)?.label || type
    const entry = {
      id: Date.now(),
      type,
      typeName,
      thumbnail: outputUrl,
      prompt,
      timestamp: Date.now(),
    }

    setRecentGenerations(prev => {
      const updated = [entry, ...prev].slice(0, 10)
      try {
        localStorage.setItem('stagefy-recent-generations', JSON.stringify(updated))
      } catch {
        // localStorage full - ignore
      }
      return updated
    })
  }

  // Agent profile state
  const [agentName, setAgentName] = useState('')
  const [agentEmail, setAgentEmail] = useState('')
  const [agentPhone, setAgentPhone] = useState('')
  const [agentAgency, setAgentAgency] = useState('')
  const [agentPhoto, setAgentPhoto] = useState<string | null>(null)
  const [agentLogo, setAgentLogo] = useState<string | null>(null)
  const [includeAgentProfile, setIncludeAgentProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  
  // Agency brands for dropdown
  const [agencyBrands, setAgencyBrands] = useState<{ id: string; name: string; slug: string; primary_color?: string; secondary_color?: string; accent_color?: string }[]>([])

  // Professional Template Wizard State
  const [showWizard, setShowWizard] = useState(false)
  // Infographic Wizard State
  const [showInfographicWizard, setShowInfographicWizard] = useState(false)
  // Holiday Promo Wizard State
  const [showHolidayWizard, setShowHolidayWizard] = useState(false)
  // Testimonial Wizard State
  const [showTestimonialWizard, setShowTestimonialWizard] = useState(false)
  // Agent Showcase Wizard State
  const [showAgentShowcaseWizard, setShowAgentShowcaseWizard] = useState(false)
  const [wizardData, setWizardData] = useState<{
    photoFrames: number
    includeAgent: boolean
    propertyDetails: {
      header: string
      price: string
      location: string
      keyFeatures: string
      bedrooms: string
      bathrooms: string
      squareMeters: string
      propertyType: string
    }
  } | null>(null)
  
  // Legacy Modal State (kept for backward compatibility)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showLayoutPopup, setShowLayoutPopup] = useState(false)
  const [showPromptReview, setShowPromptReview] = useState(false)
  const [showAgentPopup, setShowAgentPopup] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null)
  const [generatedLayout, setGeneratedLayout] = useState<{
    prompt: string
    layoutStructure: any
  } | null>(null)
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false)

  // Load agent profile and agency brands on mount
  useEffect(() => {
    const loadAgentProfile = async () => {
      try {
        setProfileLoading(true)
        // Get session token for authentication
        const { supabase } = await import('@/lib/supabase')
        const { data: { session } } = await supabase.auth.getSession()
        
        const headers: Record<string, string> = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const response = await fetch('/api/agent-profile', { headers })
        const data = await response.json()
        if (data.profile) {
          // Only set if we don't have values (prevent overwrite on re-render)
          setAgentName(prev => prev || data.profile.name_surname || '')
          setAgentEmail(prev => prev || data.profile.email || '')
          setAgentPhone(prev => prev || data.profile.phone || '')
          setAgentAgency(prev => prev || data.profile.agency_brand || '')
          setAgentPhoto(prev => prev || data.profile.photo_url || null)
          setAgentLogo(prev => prev || data.profile.logo_url || null)
        }
      } catch (err) {
        console.error('Error loading agent profile:', err)
      } finally {
        setProfileLoading(false)
      }
    }
    
    // Load agency brands
    const loadAgencyBrands = async () => {
      try {
        const response = await fetch('/api/brands?active=true')
        const data = await response.json()
        if (data.brands && data.brands.length > 0) {
          setAgencyBrands(data.brands)
        }
      } catch (err) {
        console.error('Error loading agency brands:', err)
      }
    }
    
    loadAgentProfile()
    loadAgencyBrands()
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
      // Only include photo/logo if they are URLs (not base64 to avoid 413 payload too large)
      // Base64 images are too large to send in JSON - need to upload to storage first
      let photoUrlToSave = null
      let logoUrlToSave = null

      // Only include URLs that are actual URLs (not base64 data URIs)
      if (agentPhoto && agentPhoto.startsWith('http')) {
        photoUrlToSave = agentPhoto
      }
      if (agentLogo && agentLogo.startsWith('http')) {
        logoUrlToSave = agentLogo
      }

      // Get the session token from Supabase for server-side authentication
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Session check:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        userId: session?.user?.id 
      })
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const requestBody = {
        name_surname: agentName,
        email: agentEmail,
        phone: agentPhone,
        agency_brand: agentAgency,
        photo_url: photoUrlToSave,
        logo_url: logoUrlToSave,
      }
      
      console.log('Sending request with body:', requestBody)

      const response = await fetch('/api/agent-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log('API response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }

      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err: any) {
      console.error('Save profile error:', err)
      setError(err.message || 'Failed to save agent profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Compress image before upload to avoid Vercel's 4.5MB body limit
  const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw the resized image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Handle photo upload - uploads to Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, setPhoto: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      // Compress the image to avoid Vercel's 4.5MB body limit
      // For photos, use 800px max width and 80% quality
      // For logos, use 600px max width and 90% quality (higher quality for logos)
      const isLogo = setPhoto === setAgentLogo
      const compressedFile = await compressImage(file, isLogo ? 600 : 800, isLogo ? 0.9 : 0.8)
      
      console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`)
      
      // Create FormData and append the compressed file
      const formData = new FormData()
      formData.append('image', compressedFile)
      formData.append('type', setPhoto === setAgentPhoto ? 'photo' : 'logo')

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Set the uploaded URL
      setPhoto(data.url)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image. Please try a smaller image.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      try {
        // Compress the image
        const compressedFile = await compressImage(file, 1200, 0.85)
        console.log(`Property image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`)
        
        // Upload to storage
        const formData = new FormData()
        formData.append('image', compressedFile)
        formData.append('type', 'property')
        
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const data = await response.json()
          setSelectedImages(prev => [...prev, data.url])
        } else {
          console.error('Failed to upload image, falling back to base64')
          // Fallback to base64 if upload fails
          const reader = new FileReader()
          reader.onload = (event) => {
            setSelectedImages(prev => [...prev, event.target?.result as string])
          }
          reader.readAsDataURL(file)
        }
      } catch (err) {
        console.error('Image upload error:', err)
        // Fallback to base64
        const reader = new FileReader()
        reader.onload = (event) => {
          setSelectedImages(prev => [...prev, event.target?.result as string])
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const hasEnoughCredits = (user?.credits || 0) >= (selectedVersion === 'pro' ? 5 : 3)

  const handleSubmit = async () => {
    if (!prompt.trim()) {
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

      // Build images array - property images + agent photo + agent logo (at the end)
      const imagesToSend = [...selectedImages]
      
      // Add agent photo and logo at the END of the array
      // This way the API knows: first images = property, last images = agent/logo
      if (includeAgentProfile) {
        if (agentPhoto) {
          imagesToSend.push(agentPhoto)
        }
        if (agentLogo) {
          imagesToSend.push(agentLogo)
        }
      }

      const requestBody: any = {
        images: imagesToSend,
        type: templateType,
        userId: user?.id,
        prompt: finalPrompt,
        version: selectedVersion, // 'standard' or 'pro'
      }
      
      // Add agent profile data if toggle is enabled (for reference in template)
      if (includeAgentProfile) {
        requestBody.agentProfile = {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          agency: agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency) : null,
          photoUrl: agentPhoto,
          logoUrl: agentLogo,
        }
      }
      
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/ai/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      const data = await response.json()
      setResult({ outputUrl: data.outputUrl, isWatermarked: data.isWatermarked || false })
      autoSaveGeneration(data.outputUrl, templateType, prompt)
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

  // Professional Template Workflow Handlers
  const handleSelectTemplate = (category: TemplateCategory) => {
    setSelectedCategory(category)
  }

  const handleGenerateLayout = (category: TemplateCategory) => {
    // Just show the popup - API call happens when user clicks "Generate Layout" in popup
    setSelectedCategory(category)
    setShowLayoutPopup(true)
  }

  const handleLayoutConfirm = async () => {
    if (!selectedCategory) return
    
    setIsGeneratingLayout(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/ai/template/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ templateCategory: selectedCategory }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate layout')
      }

      const data = await response.json()
      setGeneratedLayout({
        prompt: data.prompt,
        layoutStructure: data.layoutStructure,
      })
      setShowLayoutPopup(false)
      setShowPromptReview(true)
    } catch (err: any) {
      console.error('Layout generation error:', err)
      setError(err.message || 'Failed to generate layout')
    } finally {
      setIsGeneratingLayout(false)
    }
  }

  const handleReviewConfirm = (finalPrompt: string, layoutStructure: any) => {
    // After review, show agent profile popup
    setShowPromptReview(false)
    setShowAgentPopup(true)
  }

  const handleAgentConfirm = (data: {
    includeAgent: boolean
    agentData?: any
    brand?: any
  }) => {
    setShowAgentPopup(false)
    // For now, show success message - full implementation would continue to image placement
    setError(null)
    alert(`Professional template workflow started!\nCategory: ${selectedCategory}\nInclude Agent: ${data.includeAgent}`)
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
              {/* Recent Generations */}
              {recentGenerations.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Recent Generations</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Your last {recentGenerations.length} created templates</p>
                    </div>
                    <button
                      onClick={() => {
                        setRecentGenerations([])
                        localStorage.removeItem('stagefy-recent-generations')
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                    {recentGenerations.map((gen) => (
                      <div key={gen.id} className="flex-shrink-0 group relative">
                        <div
                          className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => window.open(gen.thumbnail, '_blank')}
                        >
                          <img
                            src={gen.thumbnail}
                            alt={gen.typeName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate w-24">{gen.typeName}</p>
                        <p className="text-xs text-gray-400 truncate w-24">
                          {new Date(gen.timestamp).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </p>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const response = await fetch(gen.thumbnail)
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = `stagefy-${gen.typeName.toLowerCase()}-${Date.now()}.jpg`
                                link.click()
                                window.URL.revokeObjectURL(url)
                              } catch {
                                window.open(gen.thumbnail, '_blank')
                              }
                            }}
                            className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700"
                            title="Download"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Template Type */}
              <Card>
                <CardHeader title="Template Type" subtitle="Choose what kind of template to create" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {marketplaceTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        if (type.value === 'professional') {
                          // Open new professional template wizard
                          setShowWizard(true)
                        } else if (type.value === 'infographic') {
                          // Open infographic wizard
                          setShowInfographicWizard(true)
                        } else if (type.value === 'holiday') {
                          // Open holiday promo wizard
                          setShowHolidayWizard(true)
                        } else if (type.value === 'testimonial') {
                          // Open testimonial wizard
                          setShowTestimonialWizard(true)
                        } else if (type.value === 'agent_showcase') {
                          // Open agent showcase wizard
                          setShowAgentShowcaseWizard(true)
                        } else {
                          setTemplateType(type.value)
                        }
                      }}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        templateType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="font-medium text-gray-900 mt-2 text-sm">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      {type.value === 'professional' && (
                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">✨ AI</span>
                      )}
                      {type.value === 'infographic' && (
                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">✨ AI</span>
                      )}
                      {type.value === 'holiday' && (
                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">✨ AI</span>
                      )}
                      {type.value === 'testimonial' && (
                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">✨ AI</span>
                      )}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader title="Upload Images" subtitle="Optional — add photos to include in your template" />
                
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
                  title="Template Prompt" 
                  subtitle="Describe what you want the AI to generate" 
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
                          {agentAgency && (
                            <p className="text-xs text-green-600 mt-0.5">
                              {agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency}
                            </p>
                          )}
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
                  <div className="relative">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                      <img
                        src={result.outputUrl}
                        alt="Generated template"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => (document.getElementById('template-fullscreen-modal') as HTMLDialogElement)?.showModal()}
                      />
                      {result.isWatermarked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium transform -rotate-12">
                            Stagefy Free
                          </div>
                        </div>
                      )}
                    </div>
                    {/* View Fullscreen and Download buttons */}
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        fullWidth
                        onClick={() => (document.getElementById('template-fullscreen-modal') as HTMLDialogElement)?.showModal()}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        View Fullscreen
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        fullWidth
                        onClick={async () => {
                          try {
                            const response = await fetch(result.outputUrl)
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = `stagefy-template-${Date.now()}.jpg`
                            link.click()
                            window.URL.revokeObjectURL(url)
                          } catch {
                            window.open(result.outputUrl, '_blank')
                          }
                        }}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Fullscreen Modal */}
              {result && (
                <dialog id="template-fullscreen-modal" className="modal">
                  <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto">
                      {/* Exit Button */}
                      <button
                        onClick={() => (document.getElementById('template-fullscreen-modal') as HTMLDialogElement)?.close()}
                        className="absolute top-0 left-0 -mt-12 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Exit Fullscreen
                      </button>
                      <img
                        src={result.outputUrl}
                        alt="Generated template fullscreen"
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="flex gap-2 mt-4 justify-center">
                        <Button 
                          variant="outline"
                          className="bg-white text-gray-900 hover:bg-gray-100"
                          onClick={async () => {
                            try {
                              const response = await fetch(result.outputUrl)
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `stagefy-template-${Date.now()}.jpg`
                              link.click()
                              window.URL.revokeObjectURL(url)
                            } catch {
                              window.open(result.outputUrl, '_blank')
                            }
                          }}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </Button>
                        <Button 
                          variant="outline"
                          className="bg-white text-gray-900 hover:bg-gray-100"
                          onClick={() => window.open(result.outputUrl, '_blank')}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                </dialog>
              )}

              {/* Submit */}
              <Card className="bg-gray-900 text-white border-0">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Credit Cost</span>
                  <CreditBadge credits={selectedVersion === 'pro' ? 5 : 3} />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="mt-4"
                  loading={loading}
                  disabled={!prompt.trim() || !hasEnoughCredits}
                  onClick={() => setShowVersionPopup(true)}
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
        ) : activeTab === 'library' ? (
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
                            <Button size="sm" variant="ghost" onClick={async () => {
                              try {
                                const response = await fetch(template.thumbnail)
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = `stagefy-${template.type.toLowerCase()}-${Date.now()}.jpg`
                                link.click()
                                window.URL.revokeObjectURL(url)
                              } catch {
                                window.open(template.thumbnail, '_blank')
                              }
                            }}>
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

              {/* Agency */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={agentAgency}
                  onChange={(e: any) => setAgentAgency(e.target.value)}
                >
                  <option value="">Select your agency...</option>
                  {agencyBrands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                  {agencyBrands.length === 0 && (
                    <>
                      <option value="remax">RE/MAX</option>
                      <option value="pam-golding">Pam Golding Properties</option>
                      <option value="seeff">Seeff</option>
                      <option value="era">ERA South Africa</option>
                      <option value="harcourts">Harcourts South Africa</option>
                      <option value="sothebys">Lew Geffen Sotheby's International Realty</option>
                      <option value="century-21">Century 21 South Africa</option>
                      <option value="rawson">Rawson Properties</option>
                      <option value="chas-everitt">Chas Everitt</option>
                      <option value="other">Other / Independent</option>
                    </>
                  )}
                </select>
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
                        {agentAgency && (
                          <p className="text-white/60 text-sm mt-1">
                            {agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency}
                          </p>
                        )}
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

      {/* Professional Template Wizard */}
      <ProfessionalTemplateWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        hasAgentProfile={!!agentName.trim()}
        onComplete={async (data) => {
          // Set the uploaded images to selectedImages state
          if (data.uploadedImages && data.uploadedImages.length > 0) {
            setSelectedImages(data.uploadedImages)
          }
          
          setWizardData(data)
          setShowWizard(false)
          
          // Sync wizard's includeAgent with the main form's includeAgentProfile toggle
          setIncludeAgentProfile(data.includeAgent)
          
          // Build prompt directly from wizard data (skip GPT-4.1-nano)
          // Use the exact format the user provided
          const layouts: Record<number, string[]> = {
            1: [
              'Full-width hero image spanning entire flyer',
              'Single large hero image with overlay text',
              'One main image taking 90% of flyer space'
            ],
            2: [
              'Two equal columns side by side',
              'Split layout with left image right image',
              'Horizontal split 50/50 design'
            ],
            3: [
              'One large main image with two smaller below',
              'Featured image top, two smaller bottom',
              'Hero image with two columns below'
            ],
            4: [
              '2x2 grid with equal square images',
              'Four equal quadrants classic grid',
              'Two-by-two symmetrical arrangement'
            ],
            5: [
              'One large featured image with 4 smaller in grid',
              'Main image with 2x2 grid below',
              'Featured property with four supporting images'
            ],
            6: [
              '2x3 grid with uniform rectangle images',
              'Three columns by two rows clean grid',
              'Six equal photos in symmetrical layout'
            ],
          }
          
          // Randomly pick a layout variation
          const layoutOptions = layouts[data.photoFrames] || layouts[3]
          const randomLayoutIndex = Math.floor(Math.random() * layoutOptions.length)
          const layoutSuggestion = layoutOptions[randomLayoutIndex]
          
          // Get agency brand info or use wizard's selected colors
          const agencyInfo = agencyBrands.find(b => b.slug === agentAgency)
          const agencyName = agencyInfo ? agencyInfo.name : 'RE/MAX'
          
          // Use wizard selected colors or fall back to agency brand colors
          let brandColors: string
          if (data.selectedColors && data.selectedColors.length > 0) {
            brandColors = data.selectedColors.join(', ')
          } else if (agencyInfo) {
            brandColors = [agencyInfo.primary_color, agencyInfo.secondary_color, agencyInfo.accent_color].filter(Boolean).join(', ')
          } else {
            brandColors = '#ff1300 (red), #00102e (navy), #000000 (black)'
          }
          
          // Build the prompt using the exact format the user provided
          let prompt = `Create a stunning professional real estate marketing flyer with the following specifications:

HEADER: A bold header banner with "${data.propertyDetails.header || 'New Listing'}" text in modern sans-serif typography using brand colors: ${brandColors}.

PHOTO LAYOUT: ${layoutSuggestion}. IMPORTANT: Use exactly ${data.photoFrames} photo frame(s) - no more, no less. Each photo frame should have rounded corners, subtle drop shadows, and space for property images. The frames should be arranged in an aesthetically pleasing symmetric grid. Do NOT add any extra photos or random images.

PROPERTY INFO SECTION: Display the following property details clearly on the flyer:
- Price: ${data.propertyDetails.price} prominently displayed in large bold typography
- Location: ${data.propertyDetails.location}
- Property Type: ${data.propertyDetails.propertyType}
- Stats row: ${data.propertyDetails.bedrooms} beds, ${data.propertyDetails.bathrooms} baths, ${data.propertyDetails.squareMeters}m²
- Key Features list: ${data.propertyDetails.keyFeatures}

`
           
           // Add agent profile section
            const totalImages = data.photoFrames + (agentPhoto ? 1 : 0) + (agentLogo ? 1 : 0)
            const agentPhotoIndex = data.photoFrames + 1
            const agentLogoIndex = data.photoFrames + (agentPhoto ? 2 : 1)
            const cardColor = agencyInfo?.primary_color || '#00102e'
            
            if (data.includeAgent && agentName.trim()) {
              prompt += `AGENT PROFILE SECTION: ${agentPhoto ? `Use the agent photo at image position ${agentPhotoIndex} exactly ONCE - do NOT duplicate or repeat it.` : 'No agent photo provided.'} ${agentLogo ? `Use the agency logo at image position ${agentLogoIndex} exactly ONCE - do NOT duplicate or repeat it.` : 'No agency logo provided.'} Include agent name (${agentName}) in bold, phone number (${agentPhone}), email address (${agentEmail}), and a professional "For more info contact" header. Place this in a contrasting colored card using brand color ${cardColor}. Do NOT use these images in the property photo frames.`
            } else {
              prompt += `AGENT PROFILE SECTION: None - no agent profile to include.`
            }
          
          prompt += ``
          
          // Set the prompt in the textarea
          setPrompt(prompt)
          
          // Show success message
          alert(`✅ Wizard completed! 

Your prompt has been generated and added to the textbox below. Your ${data.uploadedImages?.length || 0} uploaded photos are ready. Click "Generate Template" to create your design.`)
        }}
      />

      {/* Infographic Wizard */}
      <InfographicWizard
        isOpen={showInfographicWizard}
        onClose={() => setShowInfographicWizard(false)}
        agentProfile={agentName.trim() ? {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          agency: agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency) : undefined,
          photoUrl: agentPhoto,
          logoUrl: agentLogo,
        } : null}
        agencyBrandColors={agentAgency ? (() => {
          const brand = agencyBrands.find(b => b.slug === agentAgency)
          return brand ? [brand.primary_color, brand.secondary_color, brand.accent_color].filter(Boolean) as string[] : null
        })() : null}
        agencyBrandName={agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || null) : null}
        onComplete={(data) => {
          setShowInfographicWizard(false)
          setTemplateType('infographic')
          setIncludeAgentProfile(data.includeAgent)
          setPrompt(data.generatedPrompt)

          alert(`✅ Infographic wizard completed!\n\nYour prompt has been generated. Click "Generate Template" to create your infographic.`)
        }}
      />

      {/* Holiday Promo Wizard */}
      <HolidayPromoWizard
        isOpen={showHolidayWizard}
        onClose={() => setShowHolidayWizard(false)}
        agentProfile={agentName.trim() ? {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          agency: agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency) : undefined,
          photoUrl: agentPhoto,
          logoUrl: agentLogo,
        } : null}
        agencyBrandColors={agentAgency ? (() => {
          const brand = agencyBrands.find(b => b.slug === agentAgency)
          return brand ? [brand.primary_color, brand.secondary_color, brand.accent_color].filter(Boolean) as string[] : null
        })() : null}
        agencyBrandName={agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || null) : null}
        onComplete={(data) => {
          setShowHolidayWizard(false)
          setTemplateType('custom')
          setIncludeAgentProfile(data.includeAgent)
          setPrompt(data.generatedPrompt)

          alert(`✅ ${data.holidayName} poster ready!\n\nYour prompt has been generated. Click "Generate Template" to create your holiday poster.`)
        }}
      />

      {/* Testimonial Wizard */}
      <TestimonialWizard
        isOpen={showTestimonialWizard}
        onClose={() => setShowTestimonialWizard(false)}
        agentProfile={agentName.trim() ? {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          agency: agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency) : undefined,
          photoUrl: agentPhoto,
          logoUrl: agentLogo,
        } : null}
        agencyBrandColors={agentAgency ? (() => {
          const brand = agencyBrands.find(b => b.slug === agentAgency)
          return brand ? [brand.primary_color, brand.secondary_color, brand.accent_color].filter(Boolean) as string[] : null
        })() : null}
        agencyBrandName={agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || null) : null}
        onComplete={(data) => {
          setShowTestimonialWizard(false)
          setTemplateType('custom')
          setIncludeAgentProfile(data.includeAgent)
          setPrompt(data.generatedPrompt)

          alert(`✅ Testimonial card ready!\n\nYour prompt has been generated. Click "Generate Template" to create your testimonial card.`)
        }}
      />

      {/* Agent Showcase Wizard */}
      <AgentShowcaseWizard
        isOpen={showAgentShowcaseWizard}
        onClose={() => setShowAgentShowcaseWizard(false)}
        agentProfile={agentName.trim() ? {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          agency: agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || agentAgency) : undefined,
          photoUrl: agentPhoto,
          logoUrl: agentLogo,
        } : null}
        agencyBrandColors={agentAgency ? (() => {
          const brand = agencyBrands.find(b => b.slug === agentAgency)
          return brand ? [brand.primary_color, brand.secondary_color, brand.accent_color].filter(Boolean) as string[] : null
        })() : null}
        agencyBrandName={agentAgency ? (agencyBrands.find(b => b.slug === agentAgency)?.name || null) : null}
        onComplete={(data) => {
          setShowAgentShowcaseWizard(false)
          setTemplateType('custom')
          setIncludeAgentProfile(data.includeAgent)
          setPrompt(data.generatedPrompt)

          alert(`✅ Agent Showcase ready!\n\nYour prompt has been generated. Click "Generate Template" to create your agent showcase.`)
        }}
      />

      {/* Legacy Template Selection Modal (kept for backward compatibility) */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleSelectTemplate}
        onGenerateLayout={handleGenerateLayout}
      />

      {selectedCategory && (
        <LayoutGenerationPopup
          isOpen={showLayoutPopup}
          template={{
            id: 'temp',
            name: TEMPLATE_CATEGORIES.find(c => c.value === selectedCategory)?.label || 'Template',
            category: selectedCategory,
            icon: TEMPLATE_CATEGORIES.find(c => c.value === selectedCategory)?.icon || '✨',
          }}
          isGenerating={isGeneratingLayout}
          onConfirm={handleLayoutConfirm}
          onCancel={() => {
            setShowLayoutPopup(false)
            setSelectedCategory(null)
          }}
        />
      )}

      {generatedLayout && (
        <PromptReviewInterface
          isOpen={showPromptReview}
          category={selectedCategory || 'modern'}
          generatedPrompt={generatedLayout.prompt}
          layoutStructure={generatedLayout.layoutStructure.sections}
          onConfirm={handleReviewConfirm}
          onRegenerate={() => {
            setShowPromptReview(false)
            if (selectedCategory) {
              handleGenerateLayout(selectedCategory)
            }
          }}
          onCancel={() => {
            setShowPromptReview(false)
            setGeneratedLayout(null)
            setSelectedCategory(null)
          }}
        />
      )}

      <AgentProfilePopup
        isOpen={showAgentPopup}
        onConfirm={handleAgentConfirm}
        onCancel={() => {
          setShowAgentPopup(false)
          setSelectedCategory(null)
          setGeneratedLayout(null)
        }}
      />

      {/* Version Selection Popup */}
      {showVersionPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Template Version</h3>
            <p className="text-gray-500 mb-6">Select which AI model to use for your template</p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedVersion('standard')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedVersion === 'standard'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Standard</p>
                    <p className="text-sm text-gray-500">Fast & reliable results</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">3 credits</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedVersion('pro')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedVersion === 'pro'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      Pro
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">✨ NEW</span>
                    </p>
                    <p className="text-sm text-gray-500">Higher quality output</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">5 credits</span>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowVersionPopup(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowVersionPopup(false)
                  handleSubmit()
                }}
              >
                Generate ({selectedVersion === 'pro' ? 5 : 3} credits)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
