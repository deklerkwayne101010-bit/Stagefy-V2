// AgentShowcaseWizard Component
// Multi-step wizard for agent showcase/personal branding template creation
// Step 1: Design Style → Step 2: Agent Details → Step 3: Tagline → Step 4: Review & Generate

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface AgentShowcaseWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: {
    designStyle: string
    tagline: string
    customTagline: string
    includeAgent: boolean
    style: {
      colorScheme: string
      orientation: string
    }
    generatedPrompt: string
  }) => void
  agentProfile?: {
    name: string
    email: string
    phone: string
    agency?: string
    photoUrl?: string | null
    logoUrl?: string | null
  } | null
  agencyBrandColors?: string[] | null
  agencyBrandName?: string | null
}

type WizardStep = 'style' | 'agent' | 'tagline' | 'review'

const designStyles = [
  { id: 'business_card', label: 'Business Card', icon: '💳', description: 'Classic business card with photo and contact' },
  { id: 'quote_focused', label: 'Quote Focused', icon: '💬', description: 'Large tagline with small photo' },
  { id: 'modern_split', label: 'Modern Split', icon: '◧', description: 'Half photo, half details' },
  { id: 'minimal_elegant', label: 'Minimal Elegant', icon: '✨', description: 'Clean, sophisticated design' },
  { id: 'bold_brand', label: 'Bold Brand', icon: '🔥', description: 'Strong colors and big typography' },
]

const colorSchemes = [
  { id: 'professional', label: 'Professional', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560'] },
  { id: 'agency', label: 'Agency Colours', description: 'Match your agency branding' },
  { id: 'modern', label: 'Modern', colors: ['#2D3436', '#636E72', '#0984E3', '#00CEC9'] },
  { id: 'warm', label: 'Warm & Inviting', colors: ['#D35400', '#E67E22', '#F39C12', '#F1C40F'] },
  { id: 'luxury', label: 'Luxury', colors: ['#1A1A1A', '#2C2C2C', '#C9A96E', '#D4AF37'] },
  { id: 'fresh', label: 'Fresh & Clean', colors: ['#27AE60', '#2ECC71', '#1ABC9C', '#16A085'] },
]

const orientations = [
  { id: 'portrait', label: 'Portrait', icon: '📱', description: 'Instagram / Stories' },
  { id: 'landscape', label: 'Landscape', icon: '🖥️', description: 'Facebook / LinkedIn' },
  { id: 'square', label: 'Square', icon: '⬜', description: 'Instagram / All platforms' },
]

const taglines = [
  "Your trusted partner in real estate",
  "Specializing in coastal properties",
  "Expert guidance for your dream home",
  "Your success is my priority",
  "Making real estate simple",
  "Professional service, personal touch",
  "For all your property needs",
  "Call me for the best deals",
  "South Coast real estate specialist",
  "Your local property expert",
  "Let me help you find home",
  "Quality service, proven results",
]

export function AgentShowcaseWizard({
  isOpen,
  onClose,
  onComplete,
  agentProfile,
  agencyBrandColors,
  agencyBrandName,
}: AgentShowcaseWizardProps) {
  const [step, setStep] = useState<WizardStep>('style')
  const [designStyle, setDesignStyle] = useState('business_card')
  const [includeAgent, setIncludeAgent] = useState(!!agentProfile?.name)
  const [customTagline, setCustomTagline] = useState('')
  const [selectedTagline, setSelectedTagline] = useState('')
  const [colorScheme, setColorScheme] = useState('agency')
  const [orientation, setOrientation] = useState('square')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleNext = () => {
    if (step === 'style') {
      setStep('agent')
    } else if (step === 'agent') {
      setStep('tagline')
    } else if (step === 'tagline') {
      setStep('review')
    }
  }

  const handleBack = () => {
    if (step === 'agent') {
      setStep('style')
    } else if (step === 'tagline') {
      setStep('agent')
    } else if (step === 'review') {
      setStep('tagline')
    }
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    
    // Use tagline (either selected or custom)
    const tagline = customTagline.trim() || selectedTagline
    
    // Build the prompt
    let prompt = ''
    
    if (designStyle === 'business_card') {
      prompt = `Create a professional agent business card design. Include: Agent photo (reference provided), name "${agentProfile?.name || 'Agent'}", tagline "${tagline}", phone "${agentProfile?.phone || 'Phone'}", email "${agentProfile?.email || 'Email'}", and area "${agentProfile?.agency || 'Real Estate'}". Use ${orientation} orientation.`
    } else if (designStyle === 'quote_focused') {
      prompt = `Create an agent personal branding image with large prominent tagline "${tagline}" as the focus. Include small agent photo in corner, name "${agentProfile?.name || 'Agent'}" in elegant typography below tagline. Use ${orientation} orientation.`
    } else if (designStyle === 'modern_split') {
      prompt = `Create a modern split design: Left side shows agent photo (reference provided), right side shows agent details. Include name "${agentProfile?.name || 'Agent'}", tagline "${tagline}", phone "${agentProfile?.phone || 'Phone'}", email "${agentProfile?.email || 'Email'}". Use ${orientation} orientation.`
    } else if (designStyle === 'minimal_elegant') {
      prompt = `Create a minimal elegant agent showcase. Clean design with agent photo (reference provided), name "${agentProfile?.name || 'Agent'}" in sophisticated typography, tagline "${tagline}" below, and subtle contact details. Use ${orientation} orientation.`
    } else if (designStyle === 'bold_brand') {
      prompt = `Create a bold agent branding image with strong colors. Large agent photo (reference provided), bold name "${agentProfile?.name || 'Agent'}", tagline "${tagline}" in big typography, phone "${agentProfile?.phone || 'Phone'}", email "${agentProfile?.email || 'Email'}". Use ${orientation} orientation.`
    }

    // Add color scheme info
    if (colorScheme === 'agency' && agencyBrandColors) {
      prompt += ` Use these brand colors: ${agencyBrandColors.join(', ')}`
    }

    // Add to prompt
    const finalData = {
      designStyle,
      tagline: customTagline.trim() || selectedTagline,
      customTagline,
      includeAgent,
      style: {
        colorScheme,
        orientation,
      },
      generatedPrompt: prompt,
    }

    setTimeout(() => {
      onComplete(finalData)
      setIsGenerating(false)
    }, 500)
  }

  const steps = [
    { key: 'style', label: 'Design Style' },
    { key: 'agent', label: 'Agent Details' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'review', label: 'Review' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create Agent Showcase
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Personal branding template for agents
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {steps.map((s, index) => (
                <React.Fragment key={s.key}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm ${
                      index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* Step 1: Design Style */}
            {step === 'style' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">🌟</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Choose Design Style
                  </h3>
                  <p className="text-gray-500">
                    Select how you want your showcase to look
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {designStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setDesignStyle(style.id)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        designStyle === style.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{style.icon}</span>
                      <span className="font-medium text-gray-900 block">{style.label}</span>
                      <span className="text-xs text-gray-500">{style.description}</span>
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Orientation
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {orientations.map((orientation) => (
                      <button
                        key={orientation.id}
                        onClick={() => setOrientation(orientation.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          orientation === orientation.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl block">{orientation.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{orientation.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Agent Details */}
            {step === 'agent' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Agent Details
                  </h3>
                  <p className="text-gray-500">
                    Use your saved agent profile or enter details
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeAgent}
                        onChange={(e) => setIncludeAgent(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Use Agent Profile</span>
                        <p className="text-sm text-gray-500">
                          {agentProfile?.name || 'No profile saved'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {includeAgent && agentProfile && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Name:</strong> {agentProfile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Phone:</strong> {agentProfile.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Email:</strong> {agentProfile.email}
                      </p>
                      {agentProfile.agency && (
                        <p className="text-sm text-gray-600">
                          <strong>Agency:</strong> {agentProfile.agency}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Tagline */}
            {step === 'tagline' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">💭</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Choose or Enter Tagline
                  </h3>
                  <p className="text-gray-500">
                    Your personal branding message
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or write your own tagline
                    </label>
                    <Textarea
                      placeholder="e.g., Your dream home starts here..."
                      value={customTagline}
                      onChange={(e) => setCustomTagline(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Or choose from suggestions (click to select)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {taglines.map((tagline) => (
                        <button
                          key={tagline}
                          onClick={() => {
                            setSelectedTagline(tagline)
                            setCustomTagline('')
                          }}
                          className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                            selectedTagline === tagline
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          "{tagline}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 'review' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Review & Generate
                  </h3>
                  <p className="text-gray-500">
                    Your agent showcase is ready
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Design Style:</span>
                    <span className="font-medium">{designStyles.find(s => s.id === designStyle)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orientation:</span>
                    <span className="font-medium capitalize">{orientation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Include Agent:</span>
                    <span className="font-medium">{includeAgent ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tagline:</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {customTagline.trim() || selectedTagline}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Click "Generate" to create your agent showcase template
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 'style'}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                type="button"
                onClick={step === 'review' ? handleGenerate : handleNext}
                disabled={
                  (step === 'tagline' && !customTagline.trim() && !selectedTagline) ||
                  isGenerating
                }
                className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${
                  step === 'review'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : step === 'review' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                ) : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
