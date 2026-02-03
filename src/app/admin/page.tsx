// Admin Dashboard
'use client'

import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { label: 'Total Users', value: '1,247', change: '+156 this month' },
  { label: 'Active Subscriptions', value: '892', change: '71.5% of total' },
  { label: 'Total Credits Purchased', value: '45,230', change: '$12,450 revenue' },
  { label: 'Total Credits Used', value: '38,450', change: '85% utilization' },
]

const users = [
  { id: 1, name: 'John Smith', email: 'john@email.com', credits: 245, subscription: 'Pro', status: 'active', joined: '2024-01-10' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@email.com', credits: 56, subscription: 'Basic', status: 'active', joined: '2024-01-08' },
  { id: 3, name: 'Mike Chen', email: 'mike@email.com', credits: 0, subscription: 'Free', status: 'suspended', joined: '2024-01-05' },
  { id: 4, name: 'Emily Davis', email: 'emily@email.com', credits: 890, subscription: 'Enterprise', status: 'active', joined: '2024-01-03' },
  { id: 5, name: 'James Wilson', email: 'james@email.com', credits: 123, subscription: 'Pro', status: 'active', joined: '2024-01-01' },
]

const recentActivity = [
  { id: 1, user: 'John Smith', action: 'Purchased 250 credits', time: '2 min ago' },
  { id: 2, user: 'Sarah Johnson', action: 'Started photo edit job', time: '5 min ago' },
  { id: 3, user: 'Emily Davis', action: 'Upgraded to Enterprise', time: '15 min ago' },
  { id: 4, user: 'Mike Chen', action: 'Subscription cancelled', time: '1 hour ago' },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'usage'>('overview')

  return (
    <div>
      <Header title="Admin Dashboard" subtitle="Monitor and manage your platform" />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['overview', 'users', 'usage'].map((tab) => (
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

        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat) => (
                <Card key={stat.label}>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader title="Recent Activity" />
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                        <p className="text-sm text-gray-500">{activity.action}</p>
                      </div>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader title="Top Users by Usage" />
                <div className="space-y-3">
                  {users.slice(0, 4).map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.credits} credits used</p>
                      </div>
                      <Badge variant={user.subscription === 'Enterprise' ? 'info' : user.subscription === 'Pro' ? 'success' : 'default'} size="sm">
                        {user.subscription}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <Card padding="none">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button>Export</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subscription</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={user.subscription === 'Enterprise' ? 'info' : user.subscription === 'Pro' ? 'success' : 'default'}
                          size="sm"
                        >
                          {user.subscription}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.credits}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={user.status === 'active' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost">Edit</Button>
                          <Button size="sm" variant="outline">Suspend</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="AI Service Usage" subtitle="Replicate API calls this month" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Photo Edits</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">1,234</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Video Generations</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">456</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Template Creates</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">289</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Credit Usage by Plan" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Free Plan</span>
                  <div className="flex items-center gap-4">
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400" style={{ width: '25%' }} />
                    </div>
                    <span className="text-sm font-medium">2,340 / 9,400</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Basic Plan</span>
                  <div className="flex items-center gap-4">
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '60%' }} />
                    </div>
                    <span className="text-sm font-medium">6,000 / 10,000</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pro Plan</span>
                  <div className="flex items-center gap-4">
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '45%' }} />
                    </div>
                    <span className="text-sm font-medium">11,250 / 25,000</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Enterprise Plan</span>
                  <div className="flex items-center gap-4">
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: '80%' }} />
                    </div>
                    <span className="text-sm font-medium">30,000 / 37,500</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
