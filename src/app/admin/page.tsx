// Admin Dashboard
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface UserUsageStats {
  userId: string
  email: string
  fullName: string
  creditsRemaining: number
  subscriptionTier: string
  creditsPurchased: number
  creditsSpentThisMonth: number
  creditsSpentLastMonth: number
  totalCreditsSpent: number
  joinedAt: string
}

interface Totals {
  totalUsers: number
  totalCreditsRemaining: number
  totalCreditsPurchased: number
  totalCreditsSpentThisMonth: number
  totalCreditsSpentLastMonth: number
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'usage'>('overview')
  const [userUsage, setUserUsage] = useState<UserUsageStats[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const fetchUsageStats = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter === 'custom' && customStartDate) {
        params.set('startDate', customStartDate)
      }
      if (dateFilter === 'custom' && customEndDate) {
        params.set('endDate', customEndDate)
      }

      const response = await fetch(`/api/admin/usage?${params.toString()}`)
      const data = await response.json()

      if (data.users) {
        setUserUsage(data.users)
        setTotals(data.totals)
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error)
    } finally {
      setLoading(false)
    }
  }, [dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsageStats()
    }
  }, [activeTab, fetchUsageStats])

  const filteredUsers = userUsage.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats for overview
  const stats = totals ? [
    { label: 'Total Users', value: totals.totalUsers.toLocaleString(), change: 'Active accounts' },
    { label: 'Credits Remaining', value: totals.totalCreditsRemaining.toLocaleString(), change: 'Across all users' },
    { label: 'Credits Purchased', value: totals.totalCreditsPurchased.toLocaleString(), change: 'All time' },
    { label: 'Spent This Month', value: totals.totalCreditsSpentThisMonth.toLocaleString(), change: `${totals.totalCreditsSpentLastMonth} last month` },
  ] : [
    { label: 'Total Users', value: '---', change: 'Loading...' },
    { label: 'Credits Remaining', value: '---', change: '---' },
    { label: 'Credits Purchased', value: '---', change: '---' },
    { label: 'Spent This Month', value: '---', change: '---' },
  ]

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
                  <p className="text-sm text-blue-600 mt-1">{stat.change}</p>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Credit Summary" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Purchased</span>
                    <span className="font-semibold">{totals?.totalCreditsPurchased.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Spent (This Month)</span>
                    <span className="font-semibold text-green-600">{totals?.totalCreditsSpentThisMonth.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Remaining</span>
                    <span className="font-semibold text-blue-600">{totals?.totalCreditsRemaining.toLocaleString() || 0}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Utilization Rate</span>
                      <span className="font-semibold">
                        {totals && totals.totalCreditsPurchased > 0
                          ? Math.round((totals.totalCreditsPurchased - totals.totalCreditsRemaining) / totals.totalCreditsPurchased * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ 
                          width: totals && totals.totalCreditsPurchased > 0
                            ? `${Math.round((totals.totalCreditsPurchased - totals.totalCreditsRemaining) / totals.totalCreditsPurchased * 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Top Users by Credits Spent" />
                <div className="space-y-3">
                  {userUsage.slice(0, 5).sort((a, b) => b.totalCreditsSpent - a.totalCreditsSpent).map((user) => (
                    <div key={user.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.fullName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.totalCreditsSpent} credits spent</p>
                      </div>
                      <Badge 
                        variant={user.subscriptionTier === 'enterprise' ? 'info' : user.subscriptionTier === 'pro' ? 'success' : 'default'} 
                        size="sm"
                      >
                        {user.subscriptionTier}
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
            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                {dateFilter === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                <Button onClick={fetchUsageStats} loading={loading}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('')
                  setDateFilter('all')
                  setCustomStartDate('')
                  setCustomEndDate('')
                  fetchUsageStats()
                }}>
                  Reset
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Users</p>
                  <p className="text-xl font-bold text-blue-900">{filteredUsers.length}</p>
                </div>
                <div>
                  <p className="text-blue-600">Purchased</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredUsers.reduce((sum, u) => sum + u.creditsPurchased, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600">Spent This Month</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredUsers.reduce((sum, u) => sum + u.creditsSpentThisMonth, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600">Spent Last Month</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredUsers.reduce((sum, u) => sum + u.creditsSpentLastMonth, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600">Remaining</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredUsers.reduce((sum, u) => sum + u.creditsRemaining, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subscription</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Purchased</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Spent This Month</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Spent Last Month</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Loading usage data...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.fullName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={user.subscriptionTier === 'enterprise' ? 'info' : user.subscriptionTier === 'pro' ? 'success' : 'default'}
                            size="sm"
                          >
                            {user.subscriptionTier}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {user.creditsPurchased.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${user.creditsSpentThisMonth > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {user.creditsSpentThisMonth.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${user.creditsSpentLastMonth > 0 ? 'text-gray-600' : 'text-gray-400'}`}>
                            {user.creditsSpentLastMonth.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${user.creditsRemaining > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {user.creditsRemaining.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.totalCreditsSpent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            {/* AI Service Usage */}
            <Card>
              <CardHeader title="AI Service Usage This Month" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Photo Edits</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {userUsage.reduce((sum, u) => sum + u.creditsSpentThisMonth, 0)}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">jobs (@ 1 credit each)</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Video Generations</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {userUsage.reduce((sum, u) => sum + Math.floor(u.creditsSpentThisMonth / 8), 0)}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">jobs (@ 8 credits avg)</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Template Creates</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {userUsage.reduce((sum, u) => sum + Math.floor(u.creditsSpentThisMonth / 3), 0)}
                  </p>
                  <p className="text-xs text-green-500 mt-1">jobs (@ 3 credits each)</p>
                </div>
              </div>
            </Card>

            {/* Credit Usage by Plan */}
            <Card>
              <CardHeader title="Credit Usage by Plan" />
              <div className="space-y-4">
                {['free', 'basic', 'pro', 'enterprise'].map((tier) => {
                  const tierUsers = userUsage.filter(u => u.subscriptionTier === tier)
                  const tierSpent = tierUsers.reduce((sum, u) => sum + u.creditsSpentThisMonth, 0)
                  const tierLimit = tier === 'free' ? 50 : tier === 'basic' ? 200 : tier === 'pro' ? 500 : 1500
                  const percentage = tierLimit > 0 ? Math.min((tierSpent / (tierLimit * tierUsers.length || 1)) * 100, 100) : 0
                  
                  return (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-gray-600 capitalize">{tier} Plan</span>
                      <div className="flex items-center gap-4 flex-1 max-w-md mx-4">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              tier === 'enterprise' ? 'bg-purple-500' : 
                              tier === 'pro' ? 'bg-green-500' : 
                              tier === 'basic' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {tierSpent.toLocaleString()} / {tierLimit * Math.max(tierUsers.length, 1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{tierUsers.length} users</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader title="Monthly Credit Spending" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totals?.totalCreditsSpentThisMonth.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total credits spent</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Last Month</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totals?.totalCreditsSpentLastMonth.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total credits spent</p>
                  {totals && totals.totalCreditsSpentLastMonth > 0 && (
                    <p className={`text-sm mt-2 ${
                      totals.totalCreditsSpentThisMonth > totals.totalCreditsSpentLastMonth 
                        ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {totals.totalCreditsSpentThisMonth > totals.totalCreditsSpentLastMonth ? '↑' : '↓'}{' '}
                      {Math.abs(Math.round(
                        (totals.totalCreditsSpentThisMonth - totals.totalCreditsSpentLastMonth) / 
                        totals.totalCreditsSpentLastMonth * 100
                      ))}% vs last month
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
