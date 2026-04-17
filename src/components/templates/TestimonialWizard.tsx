// TestimonialWizard Component
// Multi-step wizard for testimonial/review template creation
// Step 1: Testimonial → Step 2: Agent Branding → Step 3: Style → Step 4: Review & Generate

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface TestimonialWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: {
    clientName: string
    quote: string
    rating: number
    includeAgent: boolean
    agentPlacement: string
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

type WizardStep = 'testimonial' | 'agent' | 'style' | 'review'

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

const agentPlacements = [
  { id: 'bottom-bar', label: 'Bottom Bar', description: 'Clean bar at the bottom with your info' },
  { id: 'corner-badge', label: 'Corner Badge', description: 'Small badge in the bottom-right corner' },
  { id: 'top-header', label: 'Top Header', description: 'Branded header with your photo' },
]

const testimonialStyles = [
  { id: 'quote-card', label: 'Quote Card', icon: '💬', description: 'Large quote text with decorative quotation marks' },
  { id: 'review-card', label: 'Review Card', icon: '⭐', description: 'Star rating prominent with review text' },
  { id: 'minimal', label: 'Minimal', icon: '✨', description: 'Clean, simple design with focus on the words' },
]

export function TestimonialWizard({
  isOpen,
  onClose,
  onComplete,
  agentProfile,
  agencyBrandColors,
  agencyBrandName,
}: TestimonialWizardProps) {
  const [step, setStep] = useState<WizardStep>('testimonial')
  const [clientName, setClientName] = useState('')
  const [quote, setQuote] = useState('')
  const [rating, setRating] = useState(5)
  const [testimonialStyle, setTestimonialStyle] = useState('quote-card')
  const [includeAgent, setIncludeAgent] = useState(!!agentProfile)
  const [agentPlacement, setAgentPlacement] = useState('bottom-bar')
  const [colorScheme, setColorScheme] = useState('professional')
  const [orientation, setOrientation] = useState('square')

  if (!isOpen) return null

  const buildPrompt = (): string => {
    let prompt = 'Create a professional real estate testimonial card. '

    // Testimonial content
    prompt += `Client name: ${clientName}. `
    prompt += `Testimonial quote: "${quote}". `
    prompt += `Rating: ${rating} out of 5 stars. `
    prompt += `Display ${rating} gold stars prominently. `

    // Style
    if (testimonialStyle === 'quote-card') {
      prompt += 'Style: Quote card with large decorative quotation marks, elegant typography. '
    } else if (testimonialStyle === 'review-card') {
      prompt += 'Style: Review card with star rating as the focal point, clean layout. '
    } else {
      prompt += 'Style: Minimal and clean, focus on the words, subtle design elements. '
    }

    // Color scheme
    if (colorScheme === 'agency' && agencyBrandColors && agencyBrandColors.length > 0) {
      // RE/MAX brand colors - use 60/30/10 rule
      const remaxColors = ['#000000', '#00102e', '#ff1300']
      const shuffled = [...remaxColors].sort(() => Math.random() - 0.5)
      const mainColor = shuffled[0]
      const secondaryColor = shuffled[1]
      const accentColor = shuffled[2]
      prompt += `Color palette: Use ${mainColor} as dominant (60%), ${secondaryColor} as secondary (30%), ${accentColor} as accent (10%) following 60/30/10 design rule. Brand colors: ${remaxColors.join(', ')}. `
    } else {
      const scheme = colorSchemes.find(c => c.id === colorScheme)
      if (scheme && 'colors' in scheme && scheme.colors) {
        prompt += `Color palette: ${scheme.colors.join(', ')}. Style: ${scheme.label}. `
      }
    }

    prompt += `Orientation: ${orientation === 'portrait' ? 'vertical portrait format' : orientation === 'landscape' ? 'horizontal landscape format' : 'square format'}. `

    // Agent branding
    if (includeAgent && agentProfile) {
      prompt += `Include agent branding in a ${agentPlacement.replace('-', ' ')} layout. `
      prompt += `Agent: ${agentProfile.name}. `
      if (agentProfile.phone) prompt += `Phone: ${agentProfile.phone}. `
      if (agentProfile.email) prompt += `Email: ${agentProfile.email}. `
      if (agentProfile.agency) prompt += `Agency: ${agentProfile.agency}. `
      if (agentProfile.logoUrl) prompt += `Use the provided logo image. `
    }

    prompt += 'Make it look polished, professional, and ready to share on social media.'

    return prompt
  }

  const handleGenerate = () => {
    onComplete({
      clientName,
      quote,
      rating,
      includeAgent,
      agentPlacement,
      style: { colorScheme, orientation },
      generatedPrompt: buildPrompt(),
    })
  }

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'testimonial', label: 'Testimonial' },
    { key: 'agent', label: 'Agent' },
    { key: 'style', label: 'Style' },
    { key: 'review', label: 'Review' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  const canProceed = () => {
    if (step === 'testimonial') return !!clientName.trim() && !!quote.trim()
    return true
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].key)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].key)
    }
  }

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
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Testimonial Card
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Create a shareable client testimonial with star rating
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
                    <span className={`text-sm hidden sm:inline ${
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
            {/* Step 1: Testimonial */}
            {step === 'testimonial' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">What did your client say?</h3>

                <Input
                  label="Client Name *"
                  placeholder="e.g., Sarah Johnson"
                  value={clientName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientName(e.target.value)}
                />

                <Textarea
                  label="Testimonial Quote *"
                  placeholder="e.g., Working with John was an absolute pleasure. He found us our dream home in just two weeks and made the entire process seamless."
                  value={quote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuote(e.target.value)}
                  rows={4}
                />

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-3xl transition-transform hover:scale-110"
                      >
                        {star <= rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{rating} out of 5 stars</p>
                </div>

                {/* Testimonial Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {testimonialStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setTestimonialStyle(style.id)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          testimonialStyle === style.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{style.icon}</span>
                        <p className="font-medium text-sm text-gray-900 mt-1">{style.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Agent Branding */}
            {step === 'agent' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Agent Branding</h3>
                <p className="text-sm text-gray-500">Add your contact info to the testimonial card.</p>

                {agentProfile ? (
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    includeAgent ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {agentProfile.photoUrl && (
                          <img src={agentProfile.photoUrl} alt="Agent" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{agentProfile.name}</p>
                          <p className="text-sm text-gray-500">{agentProfile.phone} &middot; {agentProfile.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIncludeAgent(!includeAgent)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          includeAgent ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          includeAgent ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {includeAgent && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Placement</label>
                        <div className="grid grid-cols-3 gap-2">
                          {agentPlacements.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setAgentPlacement(p.id)}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                agentPlacement === p.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className="font-medium text-sm text-gray-900">{p.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No agent profile saved yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Set up your profile in the Agent Profile tab to include branding.</p>
                    <button
                      onClick={() => setIncludeAgent(false)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Skip for now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Style */}
            {step === 'style' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Style & Layout</h3>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colour Scheme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {colorSchemes.map(scheme => (
                      <button
                        key={scheme.id}
                        onClick={() => setColorScheme(scheme.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          colorScheme === scheme.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${scheme.id === 'agency' && !agencyBrandColors?.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={scheme.id === 'agency' && !agencyBrandColors?.length}
                      >
                        {scheme.id === 'agency' && agencyBrandColors?.length ? (
                          <div className="flex gap-1 justify-center mb-2">
                            {agencyBrandColors.map((c, i) => (
                              <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        ) : 'colors' in scheme && (scheme.colors as string[]).length ? (
                          <div className="flex gap-1 justify-center mb-2">
                            {(scheme.colors as string[]).map((c, i) => (
                              <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        ) : (
                          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🏢</div>
                        )}
                        <p className="text-xs font-medium text-gray-900">{scheme.label}</p>
                        <p className="text-xs text-gray-500">
                          {scheme.id === 'agency' && !agencyBrandColors?.length ? 'No agency set' : (scheme.description || '')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <div className="grid grid-cols-3 gap-3">
                    {orientations.map(o => (
                      <button
                        key={o.id}
                        onClick={() => setOrientation(o.id)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          orientation === o.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{o.icon}</span>
                        <p className="font-medium text-sm text-gray-900 mt-1">{o.label}</p>
                        <p className="text-xs text-gray-500">{o.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Generate */}
            {step === 'review' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Review & Generate</h3>
                <p className="text-sm text-gray-500">Here&apos;s your testimonial card prompt.</p>

                {/* Preview */}
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-center mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-2xl">{i < rating ? '⭐' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-center text-gray-700 italic text-lg leading-relaxed">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="text-center font-semibold text-gray-900 mt-4">&mdash; {clientName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Generated Prompt</label>
                  <textarea
                    value={buildPrompt()}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">Summary</p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li><strong>Client:</strong> {clientName}</li>
                    <li><strong>Rating:</strong> {rating} / 5 stars</li>
                    <li><strong>Style:</strong> {testimonialStyles.find(s => s.id === testimonialStyle)?.label}</li>
                    <li><strong>Colour:</strong> {colorSchemes.find(c => c.id === colorScheme)?.label}</li>
                    <li><strong>Agent:</strong> {includeAgent ? `Yes (${agentPlacements.find(a => a.id === agentPlacement)?.label})` : 'No'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={step === 'testimonial' ? onClose : handleBack}
            >
              {step === 'testimonial' ? 'Cancel' : 'Back'}
            </Button>

            {step !== 'review' ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
              >
                Generate Testimonial
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
