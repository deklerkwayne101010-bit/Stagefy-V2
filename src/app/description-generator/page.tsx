// AI Property Listing Description Generator
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { CreditBadge } from '@/components/ui/Badge'
import { canPerformAction, checkUserCredits } from '@/lib/credits'

// Property types for the generator
const propertyTypes = [
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { value: 'villa', label: 'Villa', icon: '🏛️' },
  { value: 'studio', label: 'Studio', icon: '📍' },
  { value: 'penthouse', label: 'Penthouse', icon: '🌆' },
  { value: 'commercial', label: 'Commercial', icon: '🏬' },
]

// Listing styles
const listingStyles = [
  { value: 'professional', label: 'Professional', icon: '👔', description: 'Clean and corporate tone' },
  { value: 'warm-inviting', label: 'Warm & Inviting', icon: '🤗', description: 'Friendly and welcoming' },
  { value: 'luxury', label: 'Luxury', icon: '✨', description: 'Elegant and sophisticated' },
  { value: 'modern', label: 'Modern', icon: '🚀', description: 'Contemporary and sleek' },
  { value: 'family-friendly', label: 'Family-Friendly', icon: '👨‍👩‍👧‍👦', description: 'Perfect for families' },
  { value: 'minimalist', label: 'Minimalist', icon: '⬜', description: 'Simple and clean' },
]

// Output length/format options
const lengthOptions = [
  { value: 'property24', label: 'Property24', icon: '🏠', description: 'Standard property listing format' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', description: 'Short, engaging video caption' },
  { value: 'facebook', label: 'Facebook', icon: '📘', description: 'Medium post with engagement hook' },
  { value: 'instagram', label: 'Instagram', icon: '📸', description: 'Visual-focused with hashtags' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦', description: 'Concise, punchy tweet' },
]

// Key features options
const featureOptions = [
  'Open Plan Living', 'Modern Kitchen', 'Swimming Pool', 'Garden',
  'Garage', 'Security System', 'Air Conditioning', 'Solar Panels',
  'Home Office', 'Entertainment Area', 'Wine Cellar', 'Smart Home',
  'Waterfront', 'Mountain View', 'City View', 'Beach Access',
]

const CREDIT_COST = 2

export default function DescriptionGeneratorPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null)

  // Form state
  const [propertyType, setPropertyType] = useState('')
  const [listingStyle, setListingStyle] = useState('professional')
  const [outputFormat, setOutputFormat] = useState('property24')
  const [propertyTitle, setPropertyTitle] = useState('')
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [squareFeet, setSquareFeet] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [keyFeatures, setKeyFeatures] = useState<string[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [targetAudience, setTargetAudience] = useState('')

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

  const toggleFeature = (feature: string) => {
    setKeyFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const handleGenerate = async () => {
    if (!user?.id) {
      setError('Please log in to generate descriptions')
      return
    }

    if (!propertyType || !propertyTitle) {
      setError('Please fill in at least the property type and title')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedDescription(null)

    try {
      // Check if user can perform this action
      const canPerform = await canPerformAction(user.id, CREDIT_COST)
      if (!canPerform.canPerform) {
        setError(canPerform.error || 'Cannot perform action. Please upgrade or purchase credits.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/ai/description-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType,
          listingStyle,
          outputFormat,
          propertyTitle,
          address,
          price,
          bedrooms,
          bathrooms,
          squareFeet,
          yearBuilt,
          keyFeatures,
          additionalNotes,
          targetAudience,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate description')
        setLoading(false)
        return
      }

      setGeneratedDescription(data.description)
      setSuccess('Description generated successfully!')

      // Refresh user credits
      const credits = await checkUserCredits(user.id)
      setUserCredits(credits)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedDescription) {
      navigator.clipboard.writeText(generatedDescription)
      setSuccess('Copied to clipboard!')
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  const regenerateWithChanges = (changes: string) => {
    setAdditionalNotes(prev => prev + (prev ? '\n' : '') + changes)
    handleGenerate()
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Listing Description Generator</h1>
          <p className="text-slate-600">Create compelling property descriptions that attract buyers using AI</p>
        </div>

        {/* Credit Status */}
        <div className="mb-6 flex items-center gap-4">
          <CreditBadge credits={CREDIT_COST} />
          {userCredits > 0 && (
            <span className="text-sm text-slate-600">
              Your balance: {userCredits} credits
            </span>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Title *</label>
                    <Input
                      placeholder="e.g., Stunning 4-Bedroom Family Home"
                      value={propertyTitle}
                      onChange={(e) => setPropertyTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Property Type *</label>
                      <Select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        options={[{ value: '', label: 'Select type...' }, ...propertyTypes.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Listing Style</label>
                      <Select
                        value={listingStyle}
                        onChange={(e) => setListingStyle(e.target.value)}
                        options={listingStyles.map(s => ({ value: s.value, label: `${s.icon} ${s.label}` }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Output Format</label>
                    <Select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      options={lengthOptions.map(f => ({ value: f.value, label: `${f.icon} ${f.label}` }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <Input
                      placeholder="e.g., 123 Main Street, Sandton"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                      <Input
                        placeholder="e.g., R2,500,000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Year Built</label>
                      <Input
                        placeholder="e.g., 2018"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
                      <Input
                        placeholder="e.g., 4"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
                      <Input
                        placeholder="e.g., 3"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Square Feet</label>
                      <Input
                        placeholder="e.g., 2500"
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Features */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h2>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map((feature) => (
                    <label
                      key={feature}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        keyFeatures.includes(feature)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={keyFeatures.includes(feature)}
                        onChange={() => toggleFeature(feature)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            {/* Additional Info */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                    <Input
                      placeholder="e.g., Young professionals, Growing families, Retirees"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                    <Textarea
                      placeholder="Any specific details, unique selling points, or changes you want to make..."
                      rows={4}
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating Description...' : 'Generate Description'}
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Generated Description</h2>
                  {generatedDescription && (
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      📋 Copy
                    </Button>
                  )}
                </div>
                {generatedDescription ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-slate-700">
                      {generatedDescription}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateWithChanges('Make it more enthusiastic')}
                      >
                        😊 More Enthusiastic
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateWithChanges('Focus on investment value')}
                      >
                        💰 Focus on Investment
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateWithChanges('Make it more concise')}
                      >
                        📝 More Concise
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-4">📝</div>
                    <p>Fill in the property details and click generate to create your listing description</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="bg-blue-50 border-blue-100">
              <div className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Results</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Include specific numbers (bedrooms, square footage) for more accurate descriptions</li>
                  <li>• Select key features that truly stand out about the property</li>
                  <li>• Specify your target audience to tailor the tone</li>
                  <li>• Add any unique selling points in the additional notes</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
