// InfographicWizard Component
// Multi-step wizard for infographic template creation
// Step 1: Choose Type → Step 2: Enter Data → Step 3: Agent Branding → Step 4: Style → Step 5: Review & Generate

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

type InfographicType =
  | 'market-stats'
  | 'property-comparison'
  | 'neighborhood-guide'
  | 'investment-analysis'
  | 'buyers-guide'
  | 'sellers-guide'
  | 'property-features'
  | 'area-comparison'
  | 'open-house'
  | 'seasonal-trends'
  | 'mortgage-info'
  | 'rental-yields'
  | 'custom'

interface InfographicWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: {
    infographicType: InfographicType
    data: Record<string, string | string[]>
    includeAgent: boolean
    agentPlacement: string
    style: {
      colorScheme: string
      orientation: string
      visualStyle: string
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

type WizardStep = 'type' | 'data' | 'agent' | 'style' | 'review'

const infographicTypes = [
  {
    id: 'market-stats' as const,
    label: 'Market Stats',
    icon: '📊',
    description: 'Average price, days on market, price trends',
    searchable: true,
    searchQuery: 'Search for current property market statistics and trends in the area',
  },
  {
    id: 'property-comparison' as const,
    label: 'Property Comparison',
    icon: '🏘️',
    description: 'Compare 2-3 properties side by side',
    searchable: false,
  },
  {
    id: 'neighborhood-guide' as const,
    label: 'Neighborhood Guide',
    icon: '📍',
    description: 'Area highlights, schools, amenities, lifestyle',
    searchable: true,
    searchQuery: 'Search for neighborhood information including schools, amenities, lifestyle, and highlights',
  },
  {
    id: 'investment-analysis' as const,
    label: 'Investment Analysis',
    icon: '💰',
    description: 'ROI, rental yield, capital growth potential',
    searchable: true,
    searchQuery: 'Search for investment data including rental yields, capital growth, and ROI for the area',
  },
  {
    id: 'buyers-guide' as const,
    label: 'Buyer\'s Guide',
    icon: '🔑',
    description: 'Step-by-step guide for buying property',
    searchable: true,
    searchQuery: 'Search for current property buying tips, steps, and market conditions for buyers',
  },
  {
    id: 'sellers-guide' as const,
    label: 'Seller\'s Guide',
    icon: '🏷️',
    description: 'Tips for selling your property faster',
    searchable: true,
    searchQuery: 'Search for current property selling tips, staging advice, and market timing',
  },
  {
    id: 'property-features' as const,
    label: 'Property Features',
    icon: '✨',
    description: 'Highlight a listing\'s best features',
    searchable: false,
  },
  {
    id: 'area-comparison' as const,
    label: 'Area Comparison',
    icon: '🗺️',
    description: 'Compare two suburbs or areas',
    searchable: true,
    searchQuery: 'Search for comparison data between two areas including prices, amenities, and lifestyle',
  },
  {
    id: 'open-house' as const,
    label: 'Open House',
    icon: '🏠',
    description: 'Promote an upcoming open house event',
    searchable: false,
  },
  {
    id: 'seasonal-trends' as const,
    label: 'Seasonal Trends',
    icon: '📈',
    description: 'Property market seasonal patterns',
    searchable: true,
    searchQuery: 'Search for current property market seasonal trends and patterns',
  },
  {
    id: 'mortgage-info' as const,
    label: 'Mortgage & Finance',
    icon: '🏦',
    description: 'Bond info, interest rates, affordability',
    searchable: true,
    searchQuery: 'Search for current mortgage interest rates, bond affordability tips, and finance information',
  },
  {
    id: 'rental-yields' as const,
    label: 'Rental Yields',
    icon: '💵',
    description: 'Rental income vs property value analysis',
    searchable: true,
    searchQuery: 'Search for rental yield data, average rents, and rental market conditions',
  },
  {
    id: 'custom' as const,
    label: 'Custom',
    icon: '✨',
    description: 'Build your own infographic from scratch',
    searchable: false,
  },
]

const colorSchemes = [
  { id: 'professional', label: 'Professional', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560'] },
  { id: 'agency', label: 'Agency Colours', description: 'Match your agency branding' },
  { id: 'modern', label: 'Modern', colors: ['#2D3436', '#636E72', '#0984E3', '#00CEC9'] },
  { id: 'warm', label: 'Warm & Inviting', colors: ['#D35400', '#E67E22', '#F39C12', '#F1C40F'] },
  { id: 'luxury', label: 'Luxury', colors: ['#1A1A1A', '#2C2C2C', '#C9A96E', '#D4AF37'] },
  { id: 'fresh', label: 'Fresh & Clean', colors: ['#27AE60', '#2ECC71', '#1ABC9C', '#16A085'] },
  { id: 'corporate', label: 'Corporate', colors: ['#2C3E50', '#34495E', '#3498DB', '#2980B9'] },
]

const orientations = [
  { id: 'portrait', label: 'Portrait', icon: '📱', description: 'Instagram / Stories' },
  { id: 'landscape', label: 'Landscape', icon: '🖥️', description: 'Facebook / LinkedIn' },
  { id: 'square', label: 'Square', icon: '⬜', description: 'Instagram / All platforms' },
]

const visualStyles = [
  { id: 'clean', label: 'Clean & Minimal', description: 'Lots of whitespace, simple icons' },
  { id: 'data-heavy', label: 'Data Rich', description: 'Charts, graphs, detailed stats' },
  { id: 'photo-driven', label: 'Photo Driven', description: 'Large images with overlay text' },
  { id: 'infographic-classic', label: 'Classic Infographic', description: 'Icons, sections, flow layout' },
]

const agentPlacements = [
  { id: 'bottom-bar', label: 'Bottom Bar', description: 'Clean bar at the bottom with your info' },
  { id: 'corner-badge', label: 'Corner Badge', description: 'Small badge in the bottom-right corner' },
  { id: 'top-header', label: 'Top Header', description: 'Branded header with your photo' },
  { id: 'sidebar', label: 'Sidebar Strip', description: 'Narrow strip along one side' },
]

export function InfographicWizard({
  isOpen,
  onClose,
  onComplete,
  agentProfile,
  agencyBrandColors,
  agencyBrandName,
}: InfographicWizardProps) {
  const [step, setStep] = useState<WizardStep>('type')
  const [infographicType, setInfographicType] = useState<InfographicType | null>(null)

  // Auto-fill from web option
  const [autoFill, setAutoFill] = useState(false)
  const [autoFillArea, setAutoFillArea] = useState('')

  // Data fields per type
  const [marketArea, setMarketArea] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [medianPrice, setMedianPrice] = useState('')
  const [daysOnMarket, setDaysOnMarket] = useState('')
  const [priceChange, setPriceChange] = useState('')
  const [totalListings, setTotalListings] = useState('')
  const [topStats, setTopStats] = useState<string[]>([])

  // Property comparison
  const [property1, setProperty1] = useState('')
  const [property2, setProperty2] = useState('')
  const [property3, setProperty3] = useState('')
  const [comparePoints, setComparePoints] = useState<string[]>([])

  // Neighborhood
  const [neighborhoodName, setNeighborhoodName] = useState('')
  const [neighborhoodHighlights, setNeighborhoodHighlights] = useState('')
  const [nearbySchools, setNearbySchools] = useState('')
  const [nearbyAmenities, setNearbyAmenities] = useState('')
  const [lifestyleTagline, setLifestyleTagline] = useState('')

  // Investment
  const [investmentArea, setInvestmentArea] = useState('')
  const [avgRentalYield, setAvgRentalYield] = useState('')
  const [capitalGrowth, setCapitalGrowth] = useState('')
  const [avgRentalIncome, setAvgRentalIncome] = useState('')
  const [investmentHighlights, setInvestmentHighlights] = useState('')

  // Custom
  const [customContent, setCustomContent] = useState('')

  // Agent
  const [includeAgent, setIncludeAgent] = useState(!!agentProfile)
  const [agentPlacement, setAgentPlacement] = useState('bottom-bar')

  // Style
  const [colorScheme, setColorScheme] = useState('professional')
  const [orientation, setOrientation] = useState('portrait')
  const [visualStyle, setVisualStyle] = useState('clean')

  if (!isOpen) return null

  const toggleStat = (stat: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(stat) ? list.filter(s => s !== stat) : [...list, stat])
  }

  const marketStatOptions = [
    'Average Price', 'Median Price', 'Price Change %', 'Days on Market',
    'Total Listings', 'New Listings', 'Sold This Month', 'Price per m²',
  ]

  const comparePointOptions = [
    'Price', 'Size (m²)', 'Bedrooms', 'Bathrooms', 'Garages',
    'Location Score', 'Features', 'Price per m²',
  ]

  const getTypeInfo = () => infographicTypes.find(t => t.id === infographicType)

  const buildPrompt = (): string => {
    const typeInfo = getTypeInfo()

    // If auto-fill is enabled, tell Nano Banana 2 to search for the data
    if (autoFill && typeInfo?.searchable) {
      let prompt = `Create a professional real estate infographic. `
      prompt += `Type: ${typeInfo.label}. `
      prompt += `Search the web for the most current, accurate data about ${autoFillArea || 'the area'}. `
      prompt += `${typeInfo.searchQuery} in ${autoFillArea || 'the area'}. `
      prompt += `Populate the infographic with real, up-to-date statistics and information you find. `

      // Style
      if (colorScheme === 'agency' && agencyBrandColors && agencyBrandColors.length > 0) {
        prompt += `Color palette: ${agencyBrandColors.join(', ')}. Style: ${agencyBrandName || 'Agency'} branded. `
      } else {
        const scheme = colorSchemes.find(c => c.id === colorScheme)
        if (scheme) {
          if ('colors' in scheme && scheme.colors) {
            prompt += `Color palette: ${(scheme.colors as string[]).join(', ')}. Style: ${scheme.label}. `
          } else {
            prompt += `Style: ${scheme.label}. `
          }
        }
      }
      prompt += `Orientation: ${orientation}. Visual style: ${visualStyle}. `

      // Agent
      if (includeAgent && agentProfile) {
        prompt += `Include agent branding in a ${agentPlacement.replace('-', ' ')} layout. `
        prompt += `Agent: ${agentProfile.name}. `
        if (agentProfile.phone) prompt += `Phone: ${agentProfile.phone}. `
        if (agentProfile.email) prompt += `Email: ${agentProfile.email}. `
        if (agentProfile.agency) prompt += `Agency: ${agentProfile.agency}. `
        if (agentProfile.logoUrl) prompt += `Use the provided logo image. `
      }

      prompt += 'Make it look polished, professional, and shareable on social media.'
      return prompt
    }

    // Manual data entry mode
    let prompt = 'Create a professional real estate infographic. '

    // Type-specific content
    if (infographicType === 'market-stats') {
      prompt += `Type: Market Statistics Infographic. `
      prompt += `Area: ${marketArea}. `
      if (avgPrice) prompt += `Average price: ${avgPrice}. `
      if (medianPrice) prompt += `Median price: ${medianPrice}. `
      if (daysOnMarket) prompt += `Average days on market: ${daysOnMarket}. `
      if (priceChange) prompt += `Price change: ${priceChange}. `
      if (totalListings) prompt += `Total listings: ${totalListings}. `
      if (topStats.length > 0) prompt += `Feature these key stats: ${topStats.join(', ')}. `
    } else if (infographicType === 'property-comparison') {
      prompt += `Type: Property Comparison Infographic. `
      const props = [property1, property2, property3].filter(Boolean)
      prompt += `Compare these properties: ${props.join(' vs ')}. `
      if (comparePoints.length > 0) prompt += `Comparison points: ${comparePoints.join(', ')}. `
    } else if (infographicType === 'neighborhood-guide') {
      prompt += `Type: Neighborhood Guide Infographic. `
      prompt += `Area: ${neighborhoodName}. `
      if (lifestyleTagline) prompt += `Tagline: "${lifestyleTagline}". `
      if (neighborhoodHighlights) prompt += `Highlights: ${neighborhoodHighlights}. `
      if (nearbySchools) prompt += `Schools: ${nearbySchools}. `
      if (nearbyAmenities) prompt += `Amenities: ${nearbyAmenities}. `
    } else if (infographicType === 'investment-analysis') {
      prompt += `Type: Investment Analysis Infographic. `
      prompt += `Area: ${investmentArea}. `
      if (avgRentalYield) prompt += `Average rental yield: ${avgRentalYield}. `
      if (capitalGrowth) prompt += `Capital growth: ${capitalGrowth}. `
      if (avgRentalIncome) prompt += `Average rental income: ${avgRentalIncome}. `
      if (investmentHighlights) prompt += `Highlights: ${investmentHighlights}. `
    } else if (infographicType === 'buyers-guide') {
      prompt += `Type: Buyer's Guide Infographic. `
      prompt += `Area: ${autoFillArea}. `
      if (customContent) prompt += `Additional content: ${customContent}. `
    } else if (infographicType === 'sellers-guide') {
      prompt += `Type: Seller's Guide Infographic. `
      prompt += `Area: ${autoFillArea}. `
      if (customContent) prompt += `Additional content: ${customContent}. `
    } else if (infographicType === 'property-features') {
      prompt += `Type: Property Features Infographic. `
      if (customContent) prompt += `Features to highlight: ${customContent}. `
    } else if (infographicType === 'area-comparison') {
      prompt += `Type: Area Comparison Infographic. `
      prompt += `Areas to compare: ${autoFillArea}. `
      if (customContent) prompt += `Additional content: ${customContent}. `
    } else if (infographicType === 'open-house') {
      prompt += `Type: Open House Promotion Infographic. `
      if (customContent) prompt += `Event details: ${customContent}. `
    } else if (infographicType === 'seasonal-trends') {
      prompt += `Type: Seasonal Trends Infographic. `
      prompt += `Area: ${autoFillArea}. `
    } else if (infographicType === 'mortgage-info') {
      prompt += `Type: Mortgage & Finance Infographic. `
      prompt += `Area: ${autoFillArea}. `
    } else if (infographicType === 'rental-yields') {
      prompt += `Type: Rental Yields Infographic. `
      prompt += `Area: ${autoFillArea}. `
    } else if (infographicType === 'custom') {
      prompt += `Content: ${customContent}. `
    }

    // Style
    if (colorScheme === 'agency' && agencyBrandColors && agencyBrandColors.length > 0) {
      prompt += `Color palette: ${agencyBrandColors.join(', ')}. Style: ${agencyBrandName || 'Agency'} branded. `
    } else {
      const scheme = colorSchemes.find(c => c.id === colorScheme)
      if (scheme) {
        if ('colors' in scheme && scheme.colors) {
          prompt += `Color palette: ${(scheme.colors as string[]).join(', ')}. Style: ${scheme.label}. `
        } else {
          prompt += `Style: ${scheme.label}. `
        }
      }
    }
    prompt += `Orientation: ${orientation}. Visual style: ${visualStyle}. `

    // Agent
    if (includeAgent && agentProfile) {
      prompt += `Include agent branding in a ${agentPlacement.replace('-', ' ')} layout. `
      prompt += `Agent: ${agentProfile.name}. `
      if (agentProfile.phone) prompt += `Phone: ${agentProfile.phone}. `
      if (agentProfile.email) prompt += `Email: ${agentProfile.email}. `
      if (agentProfile.agency) prompt += `Agency: ${agentProfile.agency}. `
      if (agentProfile.logoUrl) prompt += `Use the provided logo image. `
    }

    prompt += 'Make it look polished, professional, and shareable on social media.'

    return prompt
  }

  const handleGenerate = () => {
    const data: Record<string, string | string[]> = {}
    if (infographicType === 'market-stats') {
      if (marketArea) data.marketArea = marketArea
      if (avgPrice) data.avgPrice = avgPrice
      if (medianPrice) data.medianPrice = medianPrice
      if (daysOnMarket) data.daysOnMarket = daysOnMarket
      if (priceChange) data.priceChange = priceChange
      if (totalListings) data.totalListings = totalListings
      if (topStats.length) data.topStats = topStats
    } else if (infographicType === 'property-comparison') {
      if (property1) data.property1 = property1
      if (property2) data.property2 = property2
      if (property3) data.property3 = property3
      if (comparePoints.length) data.comparePoints = comparePoints
    } else if (infographicType === 'neighborhood-guide') {
      if (neighborhoodName) data.neighborhoodName = neighborhoodName
      if (neighborhoodHighlights) data.neighborhoodHighlights = neighborhoodHighlights
      if (nearbySchools) data.nearbySchools = nearbySchools
      if (nearbyAmenities) data.nearbyAmenities = nearbyAmenities
      if (lifestyleTagline) data.lifestyleTagline = lifestyleTagline
    } else if (infographicType === 'investment-analysis') {
      if (investmentArea) data.investmentArea = investmentArea
      if (avgRentalYield) data.avgRentalYield = avgRentalYield
      if (capitalGrowth) data.capitalGrowth = capitalGrowth
      if (avgRentalIncome) data.avgRentalIncome = avgRentalIncome
      if (investmentHighlights) data.investmentHighlights = investmentHighlights
    } else if (infographicType === 'custom') {
      if (customContent) data.customContent = customContent
    }

    onComplete({
      infographicType: infographicType!,
      data,
      includeAgent,
      agentPlacement,
      style: { colorScheme, orientation, visualStyle },
      generatedPrompt: buildPrompt(),
    })
  }

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'type', label: 'Type' },
    { key: 'data', label: 'Data' },
    { key: 'agent', label: 'Agent' },
    { key: 'style', label: 'Style' },
    { key: 'review', label: 'Review' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  const canProceed = () => {
    if (step === 'type') return infographicType !== null
    if (step === 'data') {
      const typeInfo = getTypeInfo()
      // Auto-fill mode - just need the area
      if (autoFill && typeInfo?.searchable) return !!autoFillArea.trim()

      // Manual mode - type-specific requirements
      if (infographicType === 'market-stats') return !!marketArea
      if (infographicType === 'property-comparison') return !!property1 && !!property2
      if (infographicType === 'neighborhood-guide') return !!neighborhoodName
      if (infographicType === 'investment-analysis') return !!investmentArea
      if (infographicType === 'custom') return !!customContent.trim()

      // New searchable types need area or content
      if (['buyers-guide', 'sellers-guide', 'area-comparison', 'seasonal-trends', 'mortgage-info', 'rental-yields'].includes(infographicType || '')) {
        return !!autoFillArea.trim()
      }
      if (['property-features', 'open-house'].includes(infographicType || '')) {
        return !!customContent.trim()
      }

      return true
    }
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
                  Create Infographic
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Follow the steps to build your data-driven infographic
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
            {/* Step 1: Type */}
            {step === 'type' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">What kind of infographic?</h3>
                <p className="text-sm text-gray-500">Choose the type that best fits your content.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {infographicTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setInfographicType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        infographicType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="font-medium text-gray-900 mt-2">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Data */}
            {step === 'data' && infographicType && (
              <div className="space-y-4">
                {(() => {
                  const typeInfo = getTypeInfo()
                  const isSearchable = typeInfo?.searchable

                  return (
                    <>
                      <h3 className="text-lg font-medium text-gray-900">
                        {isSearchable ? 'Choose how to populate your data' : 'Enter your data'}
                      </h3>

                      {/* Auto-fill toggle for searchable types */}
                      {isSearchable && (
                        <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Auto-fill from web</p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Let AI search for the latest data — just enter the area name
                              </p>
                            </div>
                            <button
                              onClick={() => setAutoFill(!autoFill)}
                              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                autoFill ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                autoFill ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>

                          {autoFill && (
                            <div className="mt-4">
                              <Input
                                label="Area / Suburb *"
                                placeholder="e.g., Sandton, Johannesburg or Gauteng"
                                value={autoFillArea}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoFillArea(e.target.value)}
                              />
                              <p className="text-xs text-blue-600 mt-2">
                                Our AI will search the web for current {typeInfo.label.toLowerCase()} data in this area
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual data entry (when auto-fill is off or type isn't searchable) */}
                      {(!isSearchable || !autoFill) && (
                        <div>
                          {isSearchable && (
                            <p className="text-sm text-gray-500 mb-4">Or fill in the details manually:</p>
                          )}
                          {!isSearchable && (
                            <p className="text-sm text-gray-500">Fill in the details you want to show on the infographic.</p>
                          )}

                {infographicType === 'market-stats' && (
                  <div className="space-y-4">
                    <Input
                      label="Area / Suburb *"
                      placeholder="e.g., Sandton, Johannesburg"
                      value={marketArea}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMarketArea(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Average Price"
                        placeholder="e.g., R2,500,000"
                        value={avgPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvgPrice(e.target.value)}
                      />
                      <Input
                        label="Median Price"
                        placeholder="e.g., R2,200,000"
                        value={medianPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMedianPrice(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Days on Market"
                        placeholder="e.g., 45"
                        value={daysOnMarket}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDaysOnMarket(e.target.value)}
                      />
                      <Input
                        label="Price Change %"
                        placeholder="e.g., +5.2%"
                        value={priceChange}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceChange(e.target.value)}
                      />
                      <Input
                        label="Total Listings"
                        placeholder="e.g., 342"
                        value={totalListings}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalListings(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stats to Highlight</label>
                      <div className="grid grid-cols-2 gap-2">
                        {marketStatOptions.map(stat => (
                          <label
                            key={stat}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                              topStats.includes(stat)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={topStats.includes(stat)}
                              onChange={() => toggleStat(stat, topStats, setTopStats)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            {stat}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {infographicType === 'property-comparison' && (
                  <div className="space-y-4">
                    <Input
                      label="Property 1 *"
                      placeholder="e.g., 45 Oak Avenue, Sandton — R2.8M, 4 Bed"
                      value={property1}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProperty1(e.target.value)}
                    />
                    <Input
                      label="Property 2 *"
                      placeholder="e.g., 12 Pine Street, Bryanston — R2.5M, 3 Bed"
                      value={property2}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProperty2(e.target.value)}
                    />
                    <Input
                      label="Property 3 (optional)"
                      placeholder="e.g., 8 Elm Drive, Fourways — R3.1M, 4 Bed"
                      value={property3}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProperty3(e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comparison Points</label>
                      <div className="grid grid-cols-2 gap-2">
                        {comparePointOptions.map(point => (
                          <label
                            key={point}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                              comparePoints.includes(point)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={comparePoints.includes(point)}
                              onChange={() => toggleStat(point, comparePoints, setComparePoints)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            {point}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {infographicType === 'neighborhood-guide' && (
                  <div className="space-y-4">
                    <Input
                      label="Neighborhood Name *"
                      placeholder="e.g., Sandton, Johannesburg"
                      value={neighborhoodName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNeighborhoodName(e.target.value)}
                    />
                    <Input
                      label="Lifestyle Tagline"
                      placeholder="e.g., &quot;Where luxury meets convenience&quot;"
                      value={lifestyleTagline}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLifestyleTagline(e.target.value)}
                    />
                    <Textarea
                      label="Key Highlights"
                      placeholder="e.g., Top schools, Sandton City Mall, Gautrain station, vibrant restaurant scene"
                      value={neighborhoodHighlights}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNeighborhoodHighlights(e.target.value)}
                      rows={3}
                    />
                    <Input
                      label="Nearby Schools"
                      placeholder="e.g., St Stithians, Crawford, Redhill"
                      value={nearbySchools}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNearbySchools(e.target.value)}
                    />
                    <Input
                      label="Amenities & Lifestyle"
                      placeholder="e.g., Gyms, parks, shopping centers, restaurants"
                      value={nearbyAmenities}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNearbyAmenities(e.target.value)}
                    />
                  </div>
                )}

                {infographicType === 'investment-analysis' && (
                  <div className="space-y-4">
                    <Input
                      label="Area / Suburb *"
                      placeholder="e.g., Midrand, Gauteng"
                      value={investmentArea}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvestmentArea(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Avg Rental Yield"
                        placeholder="e.g., 7.5%"
                        value={avgRentalYield}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvgRentalYield(e.target.value)}
                      />
                      <Input
                        label="Capital Growth"
                        placeholder="e.g., +8.2% YoY"
                        value={capitalGrowth}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCapitalGrowth(e.target.value)}
                      />
                    </div>
                    <Input
                      label="Avg Rental Income"
                      placeholder="e.g., R12,500/month"
                      value={avgRentalIncome}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvgRentalIncome(e.target.value)}
                    />
                    <Textarea
                      label="Investment Highlights"
                      placeholder="e.g., New development nearby, growing demand, low vacancy rates"
                      value={investmentHighlights}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInvestmentHighlights(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* New searchable types - simple area + optional notes */}
                {['buyers-guide', 'sellers-guide', 'area-comparison', 'seasonal-trends', 'mortgage-info', 'rental-yields'].includes(infographicType || '') && (
                  <div className="space-y-4">
                    <Input
                      label="Area / Suburb *"
                      placeholder="e.g., Sandton, Johannesburg or Gauteng"
                      value={autoFillArea}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoFillArea(e.target.value)}
                    />
                    <Textarea
                      label="Additional notes (optional)"
                      placeholder="Any specific points you want included on the infographic"
                      value={customContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomContent(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {['property-features', 'open-house'].includes(infographicType || '') && (
                  <div className="space-y-4">
                    <Textarea
                      label={infographicType === 'open-house' ? 'Open House Details *' : 'Property Features *'}
                      placeholder={infographicType === 'open-house'
                        ? 'e.g., 45 Oak Avenue, Sandton\nSaturday 23 March, 10am-2pm\n4 bed, 3 bath, pool, garden'
                        : 'e.g., 4 bedrooms, 3 bathrooms, open-plan living, swimming pool, double garage, mountain views'}
                      value={customContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                )}

                {infographicType === 'custom' && (
                  <div className="space-y-4">
                    <Textarea
                      label="Describe what you want on the infographic *"
                      placeholder="Describe the content, data points, layout ideas, and any text you want included. The AI will use this to create your infographic."
                      value={customContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                        )}

                        {/* End of manual data entry wrapper */}
                      </div>
                      )}

                    </>
                  )
                })()}
              </div>
            )}

            {/* Step 3: Agent Branding */}
            {step === 'agent' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Agent Branding</h3>
                <p className="text-sm text-gray-500">Add your contact info to the infographic.</p>

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

            {/* Step 4: Style */}
            {step === 'style' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Style & Layout</h3>
                <p className="text-sm text-gray-500">Choose how your infographic looks and feels.</p>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Scheme</label>
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
                          <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                            🏢
                          </div>
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

                {/* Visual Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visual Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {visualStyles.map(vs => (
                      <button
                        key={vs.id}
                        onClick={() => setVisualStyle(vs.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          visualStyle === vs.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-900">{vs.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{vs.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Generate */}
            {step === 'review' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Review & Generate</h3>
                <p className="text-sm text-gray-500">Here&apos;s the prompt that will be sent to the AI. Tweak it if needed.</p>

                <Textarea
                  label="Generated Prompt"
                  value={buildPrompt()}
                  readOnly
                  rows={8}
                />

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">Summary</p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li><strong>Type:</strong> {infographicTypes.find(t => t.id === infographicType)?.label}</li>
                    <li><strong>Color:</strong> {colorSchemes.find(c => c.id === colorScheme)?.label}</li>
                    <li><strong>Orientation:</strong> {orientations.find(o => o.id === orientation)?.label}</li>
                    <li><strong>Visual Style:</strong> {visualStyles.find(v => v.id === visualStyle)?.label}</li>
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
              onClick={step === 'type' ? onClose : handleBack}
            >
              {step === 'type' ? 'Cancel' : 'Back'}
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
                Generate Infographic
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
