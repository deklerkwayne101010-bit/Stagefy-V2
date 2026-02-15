// Premium Main Dashboard page
// Displays real user statistics from the database
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

// Dashboard stats interface
interface DashboardStats {
  credits: number
  subscriptionTier: string
  photosEdited: number
  videosCreated: number
  templatesUsed: number
  descriptionsGenerated: number
  creditsUsedThisMonth: number
  creditsUsedTotal: number
  recentProjects: Array<{
    id: string
    name: string
    type: 'photo_edit' | 'video' | 'template' | 'description'
    status: 'completed' | 'processing' | 'failed'
    created_at: string
  }>
  crmStats: {
    contacts: number
    listings: number
    activeTasks: number
  }
}

// Loading skeleton component
function StatSkeleton() {
  return (
    <Card className="flex flex-col justify-center animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
      </div>
      <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
      <div className="h-8 bg-slate-200 rounded w-12 mb-1"></div>
      <div className="h-3 bg-slate-200 rounded w-24"></div>
    </Card>
  )
}

const quickActions = [
  {
    title: 'Edit a Photo',
    description: 'Virtual staging, declutter, enhance',
    href: '/photo-edit',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    title: 'Create Video',
    description: 'Turn photos into videos',
    href: '/image-to-video',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: 'purple',
  },
  {
    title: 'Generate Template',
    description: 'Create promo videos & templates',
    href: '/templates',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    color: 'green',
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Get change text based on stats
  const getChangeText = (current: number, label: string) => {
    if (current === 0) return 'No activity yet'
    return `${current} total`
  }

  return (
    <div>
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.full_name || 'Agent'}`} />
      
      <div className="p-8">
        {/* Credit Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Available Credits</p>
              <p className="text-5xl font-bold mt-2">
                {isLoading ? '...' : (stats?.credits ?? user?.credits ?? 0)}
              </p>
              <p className="text-blue-100 text-base mt-2">
                {stats?.subscriptionTier === 'free' 
                  ? '50 free credits included' 
                  : `${stats?.subscriptionTier || user?.subscription_tier || 'Free'} plan - monthly credits`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/billing">
                <Button variant="secondary" size="lg">
                  Buy More Credits
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              {/* Photos Edited */}
              <Card className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Photos Edited</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.photosEdited ?? 0}</p>
                <p className="text-sm text-emerald-600 mt-1 font-medium">{getChangeText(stats?.photosEdited ?? 0, 'photos')}</p>
              </Card>

              {/* Videos Created */}
              <Card className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Videos Created</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.videosCreated ?? 0}</p>
                <p className="text-sm text-emerald-600 mt-1 font-medium">{getChangeText(stats?.videosCreated ?? 0, 'videos')}</p>
              </Card>

              {/* Templates Used */}
              <Card className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Templates Used</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.templatesUsed ?? 0}</p>
                <p className="text-sm text-emerald-600 mt-1 font-medium">{getChangeText(stats?.templatesUsed ?? 0, 'templates')}</p>
              </Card>

              {/* Credits Used */}
              <Card className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.476-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.074.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.583V10a1 1 0 012 0v.395c.09.218.16.45.264.583z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Credits Used</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.creditsUsedThisMonth ?? 0}</p>
                <p className="text-sm text-slate-400 mt-1 font-medium">This month</p>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Quick Actions" subtitle="Get started with your next project" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <Card hover className="h-full p-6">
                      <div className={`w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4`}>
                        {action.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{action.description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader 
                title="Recent Projects" 
                action={
                  <Link href="/crm/media" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all
                  </Link>
                }
              />
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl animate-pulse">
                      <div className="w-11 h-11 rounded-xl bg-slate-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentProjects && stats.recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        project.type === 'photo_edit' ? 'bg-blue-50 text-blue-600' : 
                        project.type === 'video' ? 'bg-purple-50 text-purple-600' :
                        project.type === 'template' ? 'bg-green-50 text-green-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {project.type === 'photo_edit' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : project.type === 'video' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(project.created_at)}</p>
                      </div>
                      <Badge 
                        variant={
                          project.status === 'completed' ? 'success' : 
                          project.status === 'processing' ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No projects yet</p>
                  <p className="text-slate-400 text-xs mt-1">Start by editing a photo or creating a video</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* CRM Activity */}
        <Card className="mt-6">
          <CardHeader 
            title="CRM Activity" 
            subtitle="Recent updates from your contacts and listings"
            action={
              <Link href="/crm" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            }
          />
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-slate-200 rounded w-8 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Contacts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.crmStats?.contacts ?? 0}</p>
                <p className="text-sm text-slate-400 mt-1">Total contacts</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Listings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.crmStats?.listings ?? 0}</p>
                <p className="text-sm text-slate-400 mt-1">Active listings</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Active Tasks</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.crmStats?.activeTasks ?? 0}</p>
                <p className="text-sm text-slate-400 mt-1">Pending tasks</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
