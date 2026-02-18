// ProfessionalTemplateWizard Component
// Multi-step wizard for professional template creation
// Step 1: Photo Frames → Step 2: Upload Photos → Step 3: Agent Profile → Step 4: Property Details → Generate Prompt

'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface PropertyDetails {
  header: string
  price: string
  location: string
  keyFeatures: string
  bedrooms: string
  bathrooms: string
  squareMeters: string
  propertyType: string
}

interface GeneratedPrompt {
  prompt: string
  layoutSuggestions: string[]
  styleGuidelines: string
}

interface ProfessionalTemplateWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: {
    photoFrames: number
    uploadedImages: string[]  // URLs from Supabase Storage
    includeAgent: boolean
    propertyDetails: PropertyDetails
    generatedPrompt?: GeneratedPrompt
  }) => void
  hasAgentProfile?: boolean  // Whether user has a saved agent profile
}

type WizardStep = 'frames' | 'upload' | 'agent' | 'details'

export function ProfessionalTemplateWizard({
  isOpen,
  onClose,
  onComplete,
  hasAgentProfile = false,
}: ProfessionalTemplateWizardProps) {
  const [step, setStep] = useState<WizardStep>('frames')
  const [photoFrames, setPhotoFrames] = useState<number>(3)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [includeAgent, setIncludeAgent] = useState<boolean>(hasAgentProfile)
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    header: '',
    price: '',
    location: '',
    keyFeatures: '',
    bedrooms: '',
    bathrooms: '',
    squareMeters: '',
    propertyType: '',
  })
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', 'property')

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Fallback to base64 if upload fails
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Upload error:', error)
      // Fallback to base64
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = photoFrames - uploadedImages.length
    const filesToUpload = files.slice(0, remainingSlots)

    setIsUploading(true)
    try {
      const uploadedUrls = await Promise.all(filesToUpload.map(file => uploadImage(file)))
      const validUrls = uploadedUrls.filter((url): url is string => url !== null)
      setUploadedImages(prev => [...prev, ...validUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Header options
  const headerOptions = [
    'Just Listed',
    'New Listing',
    'Price Reduced',
    'Open House',
    'Sold',
    'Featured Property',
    'Exclusive Listing',
    'Best Value',
    'Luxury Living',
    'Dream Home',
  ]

  // Property types
  const propertyTypes = [
    'House',
    'Apartment',
    'Townhouse',
    'Villa',
    'Penthouse',
    'Studio',
    'Condo',
    'Estate',
  ]

  const handleNext = () => {
    if (step === 'frames') {
      setStep('upload')
    } else if (step === 'upload') {
      setStep('agent')
    } else if (step === 'agent') {
      setStep('details')
    }
  }

  const handleGeneratePrompt = async () => {
    setIsGenerating(true)
    
    try {
      // Call the API to generate the prompt using Replicate AI
      const response = await fetch('/api/ai/template/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoFrames,
          includeAgent,
          propertyDetails,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const data = await response.json()
      
      setGeneratedPrompt(data)
      
      // Complete the wizard with the generated prompt and uploaded images
      onComplete({
        photoFrames,
        uploadedImages,  // Pass the uploaded image URLs
        includeAgent,
        propertyDetails,
        generatedPrompt: data,
      })
      onClose()
    } catch (error) {
      console.error('Error generating prompt:', error)
      // Still complete with the data, but without the generated prompt
      onComplete({
        photoFrames,
        uploadedImages,
        includeAgent,
        propertyDetails,
      })
      onClose()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBack = () => {
    if (step === 'upload') {
      setStep('frames')
    } else if (step === 'agent') {
      setStep('upload')
    } else if (step === 'details') {
      setStep('agent')
    }
  }

  const updatePropertyDetail = (field: keyof PropertyDetails, value: string) => {
    setPropertyDetails(prev => ({ ...prev, [field]: value }))
  }

  const steps = [
    { key: 'frames', label: 'Photo Frames' },
    { key: 'upload', label: 'Upload Photos' },
    { key: 'agent', label: 'Agent Profile' },
    { key: 'details', label: 'Property Details' },
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
                  Create Professional Template
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Follow the steps to create your marketing flyer
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
            
            {/* Step 1: Photo Frames */}
            {step === 'frames' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">🖼️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How many photo frames do you want?
                  </h3>
                  <p className="text-gray-500">
                    Select the number of property photos to display in your template
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPhotoFrames(num)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        photoFrames === num
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl font-bold text-gray-900">{num}</span>
                      <span className="block text-xs text-gray-500 mt-1">
                        {num === 1 ? 'Frame' : 'Frames'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Preview Grid */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                    Your template will look like:
                  </p>
                  <div 
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: photoFrames <= 2 ? 'repeat(2, 1fr)' : 
                                         photoFrames <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    }}
                  >
                    {Array.from({ length: photoFrames }).map((_, i) => (
                      <div 
                        key={i} 
                        className="aspect-video bg-gray-300 rounded-lg flex items-center justify-center"
                      >
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Upload Photos */}
            {step === 'upload' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">📸</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload {photoFrames} Photo{photoFrames > 1 ? 's' : ''}
                  </h3>
                  <p className="text-gray-500">
                    Upload the property photos for your template
                  </p>
                </div>

                {/* Uploaded Images Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={img} 
                        alt={`Upload ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload Button - only show if not all slots filled */}
                  {uploadedImages.length < photoFrames && (
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center aspect-video cursor-pointer hover:border-orange-500 transition-colors">
                      {isUploading ? (
                        <svg className="animate-spin h-6 w-6 text-orange-500" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs text-gray-500 mt-2">Add Photo</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Progress indicator */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {uploadedImages.length} of {photoFrames} photos uploaded
                    </span>
                    <span className="text-gray-500">
                      {Math.round((uploadedImages.length / photoFrames) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(uploadedImages.length / photoFrames) * 100}%` }}
                    />
                  </div>
                </div>

                {uploadedImages.length < photoFrames && (
                  <p className="text-sm text-orange-600 mt-3 text-center">
                    Please upload {photoFrames - uploadedImages.length} more photo{photoFrames - uploadedImages.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Agent Profile */}
            {step === 'agent' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Do you want to include your agent profile?
                  </h3>
                  <p className="text-gray-500">
                    Add your contact information to the template
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setIncludeAgent(true)}
                    className={`p-6 rounded-lg border-2 text-center transition-all ${
                      includeAgent
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-4xl mb-3 block">✅</span>
                    <span className="font-semibold text-gray-900">Yes, include my profile</span>
                    <p className="text-sm text-gray-500 mt-2">
                      Add your name, photo, phone, and email
                    </p>
                  </button>
                  <button
                    onClick={() => setIncludeAgent(false)}
                    className={`p-6 rounded-lg border-2 text-center transition-all ${
                      includeAgent === false
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-4xl mb-3 block">❌</span>
                    <span className="font-semibold text-gray-900">No, skip this step</span>
                    <p className="text-sm text-gray-500 mt-2">
                      Create template without agent info
                    </p>
                  </button>
                </div>

                {includeAgent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 Your saved agent profile will be automatically included in the template.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Property Details */}
            {step === 'details' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Property Details
                  </h3>
                  <p className="text-gray-500">
                    Add information to display on your marketing flyer
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header Text *
                    </label>
                    <Input
                      placeholder="e.g., Just Listed!"
                      value={propertyDetails.header}
                      onChange={(e) => updatePropertyDetail('header', e.target.value)}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {headerOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => updatePropertyDetail('header', option)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            propertyDetails.header === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price & Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price
                      </label>
                      <Input
                        placeholder="e.g., R2,950,000"
                        value={propertyDetails.price}
                        onChange={(e) => updatePropertyDetail('price', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <Input
                        placeholder="e.g., Sandton, Johannesburg"
                        value={propertyDetails.location}
                        onChange={(e) => updatePropertyDetail('location', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Property Type, Bedrooms, Bathrooms, Square Meters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={propertyDetails.propertyType}
                        onChange={(e) => updatePropertyDetail('propertyType', e.target.value)}
                      >
                        <option value="">Select type...</option>
                        {propertyTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Square Meters
                      </label>
                      <Input
                        placeholder="e.g., 250m²"
                        value={propertyDetails.squareMeters}
                        onChange={(e) => updatePropertyDetail('squareMeters', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms
                      </label>
                      <Input
                        placeholder="e.g., 4"
                        value={propertyDetails.bedrooms}
                        onChange={(e) => updatePropertyDetail('bedrooms', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms
                      </label>
                      <Input
                        placeholder="e.g., 3"
                        value={propertyDetails.bathrooms}
                        onChange={(e) => updatePropertyDetail('bathrooms', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Key Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Features
                    </label>
                    <Textarea
                      placeholder="Enter key features, one per line..."
                      value={propertyDetails.keyFeatures}
                      onChange={(e) => updatePropertyDetail('keyFeatures', e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate each feature with a new line
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 'frames'}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                type="button"
                onClick={step === 'details' ? handleGeneratePrompt : handleNext}
                disabled={
                  (step === 'upload' && uploadedImages.length < photoFrames) ||
                  (step === 'details' && !propertyDetails.header.trim()) ||
                  isGenerating
                }
                className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${
                  step === 'details' 
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
                ) : step === 'details' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Prompt
                  </>
                ) : step === 'upload' ? (
                  uploadedImages.length < photoFrames 
                    ? `Upload ${photoFrames - uploadedImages.length} more` 
                    : 'Continue'
                ) : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
