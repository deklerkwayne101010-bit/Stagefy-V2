// Onboarding flow page
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const steps = [
  { id: 1, name: 'About You', description: 'Tell us about yourself' },
  { id: 2, name: 'Your Business', description: 'About your brokerage' },
  { id: 3, name: 'Getting Started', description: 'How will you use Stagefy?' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    brokerage: '',
    market: '',
    businessType: 'residential' as 'residential' | 'commercial' | 'luxury' | 'all',
    useCase: 'all' as 'photos' | 'video' | 'templates' | 'all',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const { error } = await (supabase
      .from('users')
      .update as any)({
        full_name: formData.fullName,
        brokerage: formData.brokerage,
        market: formData.market,
        use_case: formData.useCase,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating user:', error)
      setLoading(false)
    } else {
      await refreshUser()
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card padding="lg">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Welcome to Stagefy!</h2>
                <p className="text-gray-500 mt-1">Let&apos;s get to know you better.</p>
              </div>

              <Input
                label="What's your name?"
                name="fullName"
                placeholder="John Smith"
                value={formData.fullName}
                onChange={handleChange}
                required
              />

              <Input
                label="What's your brokerage?"
                name="brokerage"
                placeholder="Keller Williams, RE/MAX, etc."
                value={formData.brokerage}
                onChange={handleChange}
                required
              />

              <Input
                label="What's your market/location?"
                name="market"
                placeholder="Los Angeles, CA"
                value={formData.market}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tell us about your business</h2>
                <p className="text-gray-500 mt-1">This helps us personalize your experience.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'residential', label: 'Residential', desc: 'Single family homes', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { value: 'commercial', label: 'Commercial', desc: 'Retail, office, industrial', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  { value: 'luxury', label: 'Luxury', desc: 'High-end properties', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                  { value: 'all', label: 'All Types', desc: 'I work with everything', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.businessType === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, businessType: option.value as typeof formData.businessType })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.businessType === option.value ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <svg className={`w-5 h-5 ${formData.businessType === option.value ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">How will you use Stagefy?</h2>
                <p className="text-gray-500 mt-1">Select your primary use case to get started.</p>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'photos', label: 'AI Photo Editing', icon: '🖼️', desc: 'Virtual staging, declutter, day-to-dusk' },
                  { value: 'video', label: 'Image to Video', icon: '🎬', desc: 'Convert photos to engaging videos' },
                  { value: 'templates', label: 'AI Templates', icon: '📋', desc: 'Create listing promos and social media' },
                  { value: 'all', label: 'All Features', icon: '✨', desc: 'Get the most out of Stagefy' },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.useCase === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, useCase: option.value as typeof formData.useCase })}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  🎉 <strong>You&apos;re all set!</strong> You&apos;ll get 10 free credits to try out Stagefy. 
                  Start creating amazing listing media right away!
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button onClick={handleNext} loading={loading}>
              {currentStep === steps.length ? 'Get Started' : 'Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
