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
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    brokerage: user?.brokerage || '',
    market: user?.market || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
                <Button>Save Changes</Button>
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
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                />
                <Button>Update Password</Button>
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
