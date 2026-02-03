// Premium Main Dashboard page
'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditBadge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

// Mock data for demo
const recentProjects = [
  { id: 1, name: '123 Main St - Virtual Staging', type: 'photo_edit', status: 'completed', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, name: '456 Oak Ave - Listing Video', type: 'video', status: 'processing', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, name: '789 Pine Rd - Day-to-Dusk', type: 'photo_edit', status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString() },
]

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

const stats = [
  { label: 'Photos Edited', value: '47', change: '+12 this month', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )},
  { label: 'Videos Created', value: '23', change: '+8 this month', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )},
  { label: 'Templates Used', value: '15', change: '+5 this month', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )},
  { label: 'Credits Used', value: '156', change: 'This month', icon: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.476-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.074.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.583V10a1 1 0 012 0v.395c.09.218.16.45.264.583z" />
    </svg>
  )},
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.full_name || 'Agent'}`} />
      
      <div className="p-8">
        {/* Credit Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-[var(--color-primary)] to-blue-700 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Available Credits</p>
              <p className="text-5xl font-bold mt-2">{user?.credits || 0}</p>
              <p className="text-blue-100 text-base mt-2">
                {user?.subscription_tier === 'free' 
                  ? '50 free credits included' 
                  : `${user?.subscription_tier} plan - monthly credits`}
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
          {stats.map((stat) => (
            <Card key={stat.label} className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
                  {stat.icon}
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{stat.value}</p>
              <p className="text-sm text-[var(--color-success)] mt-1 font-medium">{stat.change}</p>
            </Card>
          ))}
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
                      <div className={`w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] mb-4`}>
                        {action.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{action.title}</h3>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">{action.description}</p>
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
                  <Link href="/crm/media" className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium">
                    View all
                  </Link>
                }
              />
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center gap-3 p-4 bg-[var(--color-surface-tertiary)] rounded-xl">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      project.type === 'photo_edit' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {project.type === 'photo_edit' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{project.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{formatRelativeTime(project.created_at)}</p>
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
            </Card>
          </div>
        </div>

        {/* CRM Activity */}
        <Card className="mt-6">
          <CardHeader 
            title="CRM Activity" 
            subtitle="Recent updates from your contacts and listings"
            action={
              <Link href="/crm" className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium">
                Open CRM
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[var(--color-surface-tertiary)] rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">New Contact</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">Sarah Johnson</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-[var(--color-surface-tertiary)] rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">New Listing</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">456 Oak Ave</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-[var(--color-surface-tertiary)] rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Listing Sold</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">789 Pine Rd</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
