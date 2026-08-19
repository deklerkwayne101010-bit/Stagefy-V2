'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PREDEFINED_BRANDS, type AgencyBrand } from '@/lib/types'
import { uploadImage } from '@/lib/supabase'
import { type AgentProfile } from '@/components/video/videoEditorHelpers'

interface AgentProfileSetupModalProps {
  isOpen: boolean
  agentProfile: AgentProfile | null
  onClose: () => void
  onSaved: (profile: AgentProfile) => void
  accessToken: string | null
}

export function AgentProfileSetupModal({
  isOpen,
  agentProfile,
  onClose,
  onSaved,
  accessToken,
}: AgentProfileSetupModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [agency, setAgency] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (agentProfile) {
      setName(agentProfile.name_surname || '')
      setEmail(agentProfile.email || '')
      setPhone(agentProfile.phone || '')
      setAgency(agentProfile.agency_brand || '')
      setPhotoPreview(agentProfile.photo_url || null)
      setLogoPreview(agentProfile.logo_url || null)
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setAgency('')
      setPhotoPreview(null)
      setLogoPreview(null)
    }
    setPhotoFile(null)
    setLogoFile(null)
    setError(null)
  }, [isOpen, agentProfile])

  if (!isOpen) return null

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPhotoPreview(agentProfile?.photo_url || null)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setLogoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(agentProfile?.logo_url || null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      let photoUrl = agentProfile?.photo_url || null
      let logoUrl = agentProfile?.logo_url || null

      if (photoFile && accessToken) {
        const result = await uploadImage(photoFile, '')
        if (result.error) {
          throw new Error(result.error.message || 'Failed to upload photo')
        }
        if (result.data?.url) {
          photoUrl = result.data.url
        }
      }

      if (logoFile && accessToken) {
        const result = await uploadImage(logoFile, '')
        if (result.error) {
          throw new Error(result.error.message || 'Failed to upload logo')
        }
        if (result.data?.url) {
          logoUrl = result.data.url
        }
      }

      const response = await fetch('/api/agent-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          name_surname: name,
          email,
          phone,
          agency_brand: agency || null,
          photo_url: photoUrl,
          logo_url: logoUrl,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save agent profile')
      }

      onSaved(data.profile)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Agent Profile</h2>
              <p className="text-sm text-gray-500 mt-1">Personalize your calling card with your details and branding.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Smith"
                helper="This appears on the calling card."
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 82 123 4567"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Agency brand</label>
                <select
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-blue-100 px-4 py-3"
                >
                  <option value="">Select a brand...</option>
                  {PREDEFINED_BRANDS.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-sm text-slate-500">Choose the agency you represent.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photo</label>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
                    Choose photo
                  </Button>
                  {photoPreview && (
                    <img src={photoPreview} alt="Photo preview" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-slate-500">Used as your profile photo on the calling card.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                    Choose logo
                  </Button>
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-slate-500">Agency logo shown in the corner of the video.</p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              Save profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
