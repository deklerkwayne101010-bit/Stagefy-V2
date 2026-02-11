// AgentProfilePopup Component
// Phase 2: Agent Profile Integration - Popup for agent profile data in templates

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { AgentProfile, AgencyBrand, PREDEFINED_BRANDS } from '@/lib/types'

interface AgentProfilePopupProps {
  isOpen: boolean
  agentProfile?: AgentProfile | null
  onConfirm: (data: {
    includeAgent: boolean
    agentData?: Partial<AgentProfile>
    brand?: AgencyBrand | null
  }) => void
  onCancel: () => void
}

export function AgentProfilePopup({
  isOpen,
  agentProfile,
  onConfirm,
  onCancel,
}: AgentProfilePopupProps) {
  const [includeAgent, setIncludeAgent] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<AgentProfile>>({
    name_surname: '',
    email: '',
    phone: '',
    photo_url: '',
    logo_url: '',
    agency_brand: '',
    license_number: '',
    years_experience: 0,
    specializations: [],
    awards: [],
    bio: '',
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    show_on_templates: true,
  })

  // Initialize form with existing profile data
  useEffect(() => {
    if (agentProfile) {
      setFormData({
        name_surname: agentProfile.name_surname || '',
        email: agentProfile.email || '',
        phone: agentProfile.phone || '',
        photo_url: agentProfile.photo_url || '',
        logo_url: agentProfile.logo_url || '',
        agency_brand: agentProfile.agency_brand || '',
        license_number: agentProfile.license_number || '',
        years_experience: agentProfile.years_experience || 0,
        specializations: agentProfile.specializations || [],
        awards: agentProfile.awards || [],
        bio: agentProfile.bio || '',
        website: agentProfile.website || '',
        facebook: agentProfile.facebook || '',
        instagram: agentProfile.instagram || '',
        linkedin: agentProfile.linkedin || '',
        show_on_templates: agentProfile.show_on_templates ?? true,
      })
      setSelectedBrand(agentProfile.agency_brand || null)
    }
  }, [agentProfile])

  if (!isOpen) return null

  const selectedBrandInfo = PREDEFINED_BRANDS.find(b => b.slug === selectedBrand)

  const handleConfirm = () => {
    const brand = selectedBrandInfo || null
    onConfirm({
      includeAgent,
      agentData: includeAgent ? formData : undefined,
      brand,
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Agent Profile Integration
              </h2>
              <p className="text-sm text-gray-500">
                Include your profile information in the template
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <h3 className="font-medium text-gray-900">Include Agent Profile</h3>
                <p className="text-sm text-gray-500">
                  Display your contact information on the template
                </p>
              </div>
              <button
                onClick={() => setIncludeAgent(!includeAgent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeAgent ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeAgent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {includeAgent && (
              <>
                {/* Brand Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Brand
                  </label>
                  <select
                    value={selectedBrand || ''}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value || null)
                      setFormData(prev => ({ ...prev, agency_brand: e.target.value }))
                    }}
                    className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-blue-100 px-4 py-3"
                  >
                    <option value="">Select a brand...</option>
                    {PREDEFINED_BRANDS.map((brand) => (
                      <option key={brand.id} value={brand.slug}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  
                  {selectedBrandInfo && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: selectedBrandInfo.primary_color }}
                        >
                          <span className="text-white font-bold text-sm">
                            {selectedBrandInfo.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedBrandInfo.name}</p>
                          <p className="text-sm text-gray-500">{selectedBrandInfo.tagline}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Info Form */}
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Agent Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={formData.name_surname || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_surname: e.target.value }))}
                      placeholder="John Doe"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+27 82 123 4567"
                    />
                    <Input
                      label="License Number"
                      value={formData.license_number || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                      placeholder="REQ-12345"
                    />
                    <Input
                      label="Years of Experience"
                      type="number"
                      value={formData.years_experience || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                      placeholder="5"
                    />
                    <Input
                      label="Website"
                      value={formData.website || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://johndoe.properties"
                    />
                  </div>

                  <div className="mt-4">
                    <Textarea
                      label="Bio"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Short professional bio..."
                      rows={3}
                    />
                  </div>

                  {/* Social Media */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Social Media
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Facebook"
                        value={formData.facebook || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                        placeholder="facebook.com/johndoe"
                      />
                      <Input
                        label="Instagram"
                        value={formData.instagram || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@johndoe"
                      />
                      <Input
                        label="LinkedIn"
                        value={formData.linkedin || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                  </div>
                </Card>

                {/* Preview */}
                {selectedBrandInfo && formData.name_surname && (
                  <Card className="p-4 bg-gradient-to-r from-gray-50 to-white">
                    <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
                    <div 
                      className="rounded-lg p-4 border"
                      style={{ borderColor: selectedBrandInfo.primary_color }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: selectedBrandInfo.primary_color }}
                        >
                          {formData.name_surname?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{formData.name_surname}</p>
                          <p className="text-sm text-gray-600">{selectedBrandInfo.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: selectedBrandInfo.primary_color, color: 'white' }}>
                              {selectedBrandInfo.tagline}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Tips for your profile:</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• A professional photo increases engagement</li>
                    <li>• Include your license number for credibility</li>
                    <li>• Your brand styling will be applied automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <Button variant="outline" onClick={onCancel}>
              Skip / Cancel
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => onConfirm({ includeAgent: false })}
              >
                Don't Include
              </Button>
              <Button onClick={handleConfirm}>
                {includeAgent ? 'Save & Continue' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
