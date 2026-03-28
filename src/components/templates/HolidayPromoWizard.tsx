// HolidayPromoWizard Component
// Multi-step wizard for holiday promotional material
// Step 1: Choose Holiday → Step 2: Agent Branding → Step 3: Style → Step 4: Review & Generate

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface HolidayPromoWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: {
    holidayId: string
    holidayName: string
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
}

type WizardStep = 'holiday' | 'agent' | 'style' | 'review'

interface Holiday {
  id: string
  name: string
  date: string
  icon: string
  category: 'public' | 'celebration'
  colors: string[]
  prompt: string
}

const holidays: Holiday[] = [
  // Public Holidays
  {
    id: 'new-years-day',
    name: "New Year's Day",
    date: '1 January',
    icon: '🎆',
    category: 'public',
    colors: ['#1a1a2e', '#e94560', '#f5c518', '#ffffff'],
    prompt: 'Create a vibrant New Year\'s Day promotional real estate poster. The design should feature a celebratory atmosphere with fireworks-inspired elements, gold and deep navy colour palette. Include a large bold "Happy New Year" greeting at the top. Below, add a professional message like "Start your new year in your dream home" or "New year, new beginnings — find your perfect home". Use elegant typography with the year prominently displayed. The poster should feel festive yet professional, blending celebration with real estate marketing.',
  },
  {
    id: 'valentines-day',
    name: 'Valentine\'s Day',
    date: '14 February',
    icon: '❤️',
    category: 'celebration',
    colors: ['#c0392b', '#e74c3c', '#ffffff', '#f8d7da'],
    prompt: 'Create a romantic Valentine\'s Day promotional real estate poster. Use a warm red, pink, and white colour palette. Feature a heart-shaped design element or romantic imagery. Include a message like "Fall in love with your new home" or "The perfect match — you and your dream house". Typography should be elegant and flowing. Blend the romantic Valentine\'s theme with professional real estate marketing.',
  },
  {
    id: 'human-rights-day',
    name: 'Human Rights Day',
    date: '21 March',
    icon: '🕊️',
    category: 'public',
    colors: ['#2c3e50', '#27ae60', '#f39c12', '#ffffff'],
    prompt: 'Create a dignified Human Rights Day promotional real estate poster celebrating South Africa. Use a green, gold, and black colour palette inspired by the South African flag. Include a respectful message like "Every South African deserves a place to call home" or "Building homes, building a nation". Feature a subtle South African flag motif or silhouette. The design should be respectful and patriotic while maintaining professional real estate marketing.',
  },
  {
    id: 'good-friday',
    name: 'Good Friday',
    date: 'Varies (March/April)',
    icon: '✝️',
    category: 'public',
    colors: ['#2c3e50', '#8e44ad', '#ecf0f1', '#ffffff'],
    prompt: 'Create an elegant Good Friday promotional real estate poster. Use a soft purple, white, and gold colour palette. Feature a peaceful, reflective design with subtle cross or dove imagery. Include a gentle message like "Wishing you a peaceful long weekend" or "Rest, reflect, and find your forever home". The design should be tasteful and respectful, blending the spirit of the long weekend with professional real estate marketing.',
  },
  {
    id: 'family-day',
    name: 'Family Day',
    date: 'Varies (March/April)',
    icon: '👨‍👩‍👧‍👦',
    category: 'public',
    colors: ['#16a085', '#2ecc71', '#ffffff', '#f0f9f4'],
    prompt: 'Create a warm Family Day promotional real estate poster. Use a fresh green and white colour palette. Feature imagery of a family home or family gathering scene. Include a heartfelt message like "Home is where the family gathers" or "This Family Day, give your family the home they deserve". The design should feel warm, inviting, and family-focused while maintaining professional real estate marketing appeal.',
  },
  {
    id: 'freedom-day',
    name: 'Freedom Day',
    date: '27 April',
    icon: '🇿🇦',
    category: 'public',
    colors: ['#2c3e50', '#27ae60', '#f39c12', '#c0392b'],
    prompt: 'Create a patriotic Freedom Day promotional real estate poster celebrating South Africa. Use the South African flag colours — green, gold, black, red, blue, and white. Feature the South African flag or iconic SA imagery subtly incorporated. Include a powerful message like "Freedom to own your own home" or "Celebrate freedom — claim your piece of South Africa". The design should be bold and patriotic while maintaining professional real estate marketing.',
  },
  {
    id: 'workers-day',
    name: 'Workers\' Day',
    date: '1 May',
    icon: '👷',
    category: 'public',
    colors: ['#e74c3c', '#2c3e50', '#ffffff', '#f5f5f5'],
    prompt: 'Create a professional Workers\' Day promotional real estate poster. Use a red and dark grey colour palette. Feature imagery related to hard work and achievement — perhaps a house with a "sold" sign or a key handover. Include a message like "Your hard work deserves a beautiful home" or "You\'ve earned it — let us find your perfect home". The design should celebrate the working professional while maintaining a professional real estate marketing tone.',
  },
  {
    id: 'mandela-day',
    name: 'Mandela Day',
    date: '18 July',
    icon: '✊',
    category: 'celebration',
    colors: ['#2c3e50', '#27ae60', '#f39c12', '#ffffff'],
    prompt: 'Create an inspiring Mandela Day promotional real estate poster. Use a green, gold, and black colour palette. Feature the number "67" prominently or a silhouette of Nelson Mandela. Include an inspiring quote or message like "It always seems impossible until it\'s done — find your dream home" or "67 minutes to change the world, a lifetime in your new home". The design should be dignified and inspiring while maintaining professional real estate marketing.',
  },
  {
    id: 'national-womens-day',
    name: 'National Women\'s Day',
    date: '9 August',
    icon: '👩',
    category: 'public',
    colors: ['#9b59b6', '#e91e63', '#ffffff', '#fce4ec'],
    prompt: 'Create an empowering National Women\'s Day promotional real estate poster. Use a purple, pink, and white colour palette. Feature imagery celebrating women — perhaps a silhouette of women marching or a woman holding house keys. Include a empowering message like "She believed she could, so she bought the house" or "Empowered women empower homes". The design should be bold and empowering while maintaining professional real estate marketing.',
  },
  {
    id: 'heritage-day',
    name: 'Heritage Day',
    date: '24 September',
    icon: '🔥',
    category: 'public',
    colors: ['#e67e22', '#2c3e50', '#27ae60', '#f39c12'],
    prompt: 'Create a vibrant Heritage Day promotional real estate poster celebrating South African culture. Use warm earth tones with green, gold, and orange. Feature imagery of a traditional braai, South African landscapes, or cultural symbols. Include a message like "Celebrate your heritage in a home of your own" or "Heritage Day — where every culture finds a home". Feature the South African landscape or a cosy braai area in a beautiful garden. The design should celebrate diversity and culture while maintaining professional real estate marketing.',
  },
  {
    id: 'day-of-reconciliation',
    name: 'Day of Reconciliation',
    date: '16 December',
    icon: '🤝',
    category: 'public',
    colors: ['#2c3e50', '#27ae60', '#f39c12', '#ffffff'],
    prompt: 'Create a thoughtful Day of Reconciliation promotional real estate poster. Use a green, gold, and white colour palette with South African flag accents. Feature imagery of unity — perhaps clasped hands or a diverse neighbourhood. Include a message like "Coming together, building together — find your home in our community" or "Reconciliation starts at home". The design should be dignified and unifying while maintaining professional real estate marketing.',
  },
  {
    id: 'christmas-day',
    name: 'Christmas Day',
    date: '25 December',
    icon: '🎄',
    category: 'public',
    colors: ['#c0392b', '#27ae60', '#f5c518', '#ffffff'],
    prompt: 'Create a festive Christmas Day promotional real estate poster. Use a classic red, green, gold, and white Christmas colour palette. Feature Christmas imagery — a beautifully decorated home, a Christmas tree, fairy lights, or a wrapped gift shaped like a house. Include a warm message like "Home for the holidays" or "The greatest gift — a home to call your own". Feature a beautiful South African summer Christmas setting. The design should be festive and warm while maintaining professional real estate marketing.',
  },
  {
    id: 'day-of-goodwill',
    name: 'Day of Goodwill',
    date: '26 December',
    icon: '🎁',
    category: 'public',
    colors: ['#3498db', '#2ecc71', '#ffffff', '#f0f9ff'],
    prompt: 'Create a cheerful Day of Goodwill promotional real estate poster. Use a blue, green, and white colour palette. Feature imagery of giving and community — perhaps a family enjoying their new home or a neighbourhood gathering. Include a message like "Spread goodwill — help someone find their dream home" or "Season of goodwill, season of new beginnings". The design should feel warm and community-focused while maintaining professional real estate marketing.',
  },
  {
    id: 'new-years-eve',
    name: 'New Year\'s Eve',
    date: '31 December',
    icon: '🥂',
    category: 'celebration',
    colors: ['#1a1a2e', '#f5c518', '#e94560', '#ffffff'],
    prompt: 'Create a glamorous New Year\'s Eve promotional real estate poster. Use a black, gold, and champagne colour palette. Feature fireworks, champagne glasses, or a countdown clock. Include a celebratory message like "Ring in the new year in your new home" or "New year, new address — let\'s make it happen". The design should feel luxurious and celebratory while maintaining professional real estate marketing.',
  },
]

const colorSchemes = [
  { id: 'holiday-default', label: 'Holiday Theme', description: 'Uses colours from the holiday' },
  { id: 'modern', label: 'Modern', colors: ['#2D3436', '#636E72', '#0984E3', '#00CEC9'] },
  { id: 'luxury', label: 'Luxury', colors: ['#1A1A1A', '#2C2C2C', '#C9A96E', '#D4AF37'] },
  { id: 'warm', label: 'Warm', colors: ['#D35400', '#E67E22', '#F39C12', '#F1C40F'] },
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
  { id: 'sidebar', label: 'Sidebar Strip', description: 'Narrow strip along one side' },
]

export function HolidayPromoWizard({
  isOpen,
  onClose,
  onComplete,
  agentProfile,
}: HolidayPromoWizardProps) {
  const [step, setStep] = useState<WizardStep>('holiday')
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [includeAgent, setIncludeAgent] = useState(!!agentProfile)
  const [agentPlacement, setAgentPlacement] = useState('bottom-bar')
  const [colorScheme, setColorScheme] = useState('holiday-default')
  const [orientation, setOrientation] = useState('portrait')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'public' | 'celebration'>('all')

  if (!isOpen) return null

  const filteredHolidays = categoryFilter === 'all'
    ? holidays
    : holidays.filter(h => h.category === categoryFilter)

  const buildPrompt = (): string => {
    if (!selectedHoliday) return ''

    let prompt = customPrompt || selectedHoliday.prompt

    // Orientation
    prompt += ` The layout should be ${orientation === 'portrait' ? 'a vertical portrait format ideal for Instagram Stories' : orientation === 'landscape' ? 'a horizontal landscape format ideal for Facebook and LinkedIn posts' : 'a square format suitable for all social media platforms'}.`

    // Color scheme
    if (colorScheme !== 'holiday-default') {
      const scheme = colorSchemes.find(c => c.id === colorScheme)
      if (scheme?.colors) {
        prompt += ` Use this colour palette: ${scheme.colors.join(', ')}.`
      }
    }

    // Agent branding
    if (includeAgent && agentProfile) {
      prompt += ` Include agent branding in a ${agentPlacement.replace('-', ' ')} layout.`
      prompt += ` Agent name: ${agentProfile.name}.`
      if (agentProfile.phone) prompt += ` Phone: ${agentProfile.phone}.`
      if (agentProfile.email) prompt += ` Email: ${agentProfile.email}.`
      if (agentProfile.agency) prompt += ` Agency: ${agentProfile.agency}.`
      if (agentProfile.logoUrl) prompt += ` Use the provided logo image.`
    }

    prompt += ' The poster should look polished, professional, and ready to share on social media.'

    return prompt
  }

  const handleGenerate = () => {
    if (!selectedHoliday) return

    onComplete({
      holidayId: selectedHoliday.id,
      holidayName: selectedHoliday.name,
      includeAgent,
      agentPlacement,
      style: { colorScheme, orientation },
      generatedPrompt: buildPrompt(),
    })
  }

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'holiday', label: 'Holiday' },
    { key: 'agent', label: 'Agent' },
    { key: 'style', label: 'Style' },
    { key: 'review', label: 'Review' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  const canProceed = () => {
    if (step === 'holiday') return selectedHoliday !== null
    return true
  }

  const handleNext = () => {
    const idx = currentStepIndex
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1].key)
    }
  }

  const handleBack = () => {
    const idx = currentStepIndex
    if (idx > 0) {
      setStep(steps[idx - 1].key)
    }
  }

  // Set custom prompt to default when holiday is selected
  const handleHolidaySelect = (holiday: Holiday) => {
    setSelectedHoliday(holiday)
    setCustomPrompt(holiday.prompt)
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
                  Holiday Promo
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Create a festive promotional poster for any South African holiday
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
            {/* Step 1: Choose Holiday */}
            {step === 'holiday' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Choose a holiday</h3>
                <p className="text-sm text-gray-500">Select a South African holiday to create a promotional poster for.</p>

                {/* Category Filter */}
                <div className="flex gap-2">
                  {[
                    { id: 'all' as const, label: 'All' },
                    { id: 'public' as const, label: 'Public Holidays' },
                    { id: 'celebration' as const, label: 'Celebrations' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        categoryFilter === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Holiday Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredHolidays.map(holiday => (
                    <button
                      key={holiday.id}
                      onClick={() => handleHolidaySelect(holiday)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedHoliday?.id === holiday.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-2xl">{holiday.icon}</span>
                          <p className="font-medium text-gray-900 mt-1">{holiday.name}</p>
                          <p className="text-xs text-gray-500">{holiday.date}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          holiday.category === 'public'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {holiday.category === 'public' ? 'Public' : 'Celebration'}
                        </span>
                      </div>
                      {/* Color preview */}
                      <div className="flex gap-1 mt-2">
                        {holiday.colors.map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom prompt override */}
                {selectedHoliday && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt (edit if you want to customise)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Agent Branding */}
            {step === 'agent' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Agent Branding</h3>
                <p className="text-sm text-gray-500">Add your contact info to the poster.</p>

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
                        <div className="grid grid-cols-2 gap-2">
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
                <p className="text-sm text-gray-500">Choose how your poster looks.</p>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colour Scheme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {colorSchemes.map(scheme => (
                      <button
                        key={scheme.id}
                        onClick={() => setColorScheme(scheme.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          colorScheme === scheme.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {scheme.colors ? (
                          <div className="flex gap-1 justify-center mb-2">
                            {scheme.colors.map((c, i) => (
                              <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-center mb-2">
                            {selectedHoliday?.colors.map((c, i) => (
                              <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        )}
                        <p className="text-xs font-medium text-gray-900">{scheme.label}</p>
                        <p className="text-xs text-gray-500">{scheme.description}</p>
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
            {step === 'review' && selectedHoliday && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Review & Generate</h3>
                <p className="text-sm text-gray-500">Here&apos;s your poster prompt. Tweak it if needed.</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Generated Prompt</label>
                  <textarea
                    value={buildPrompt()}
                    readOnly
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">Summary</p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li><strong>Holiday:</strong> {selectedHoliday.icon} {selectedHoliday.name} ({selectedHoliday.date})</li>
                    <li><strong>Colour:</strong> {colorSchemes.find(c => c.id === colorScheme)?.label}</li>
                    <li><strong>Orientation:</strong> {orientations.find(o => o.id === orientation)?.label}</li>
                    <li><strong>Agent Branding:</strong> {includeAgent ? `Yes (${agentPlacements.find(a => a.id === agentPlacement)?.label})` : 'No'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={step === 'holiday' ? onClose : handleBack}
            >
              {step === 'holiday' ? 'Cancel' : 'Back'}
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
                Generate Poster
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
