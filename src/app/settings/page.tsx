// Settings page
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    brokerage: user?.brokerage || '',
    market: user?.market || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setMessage('Not authenticated')
        return
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          brokerage: formData.brokerage,
          market: formData.market,
        })
        .eq('id', session.user.id)

      if (error) throw error
      setMessage('Profile updated successfully!')
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })
      if (error) throw error
      setMessage('Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setMessage(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account" />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['profile', 'notifications', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader title="Profile Information" subtitle="Update your personal details" />
              <div className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                  </div>
                )}
                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input
                  label="Brokerage"
                  name="brokerage"
                  value={formData.brokerage}
                  onChange={handleChange}
                />
                <Input
                  label="Market/Location"
                  name="market"
                  value={formData.market}
                  onChange={handleChange}
                />
                <Button onClick={handleSaveProfile} loading={saving}>Save Changes</Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader title="Notification Preferences" subtitle="Choose what notifications you receive" />
              <div className="space-y-4">
                {[
                  { id: 'credit_low', label: 'Low credit warnings', desc: 'Get notified when credits fall below 10' },
                  { id: 'job_completed', label: 'Job completed', desc: 'Notify when AI processing is complete' },
                  { id: 'payment', label: 'Payment updates', desc: 'Payment success and failure notifications' },
                  { id: 'marketing', label: 'Marketing emails', desc: 'Tips, updates, and promotional offers' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader title="Change Password" subtitle="Update your password" />
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <Button onClick={handleChangePassword} loading={saving}>Update Password</Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Two-Factor Authentication" subtitle="Add an extra layer of security" />
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">2FA Status</p>
                  <p className="text-sm text-gray-500">Not enabled</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </Card>

            <Card className="border-red-200">
              <CardHeader title="Danger Zone" subtitle="Irreversible actions" />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900">Delete Account</p>
                    <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="danger">Delete Account</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
