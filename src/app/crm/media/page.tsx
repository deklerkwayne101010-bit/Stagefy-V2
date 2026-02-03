// Media page for CRM - Gallery of all photos and videos
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const mockMedia = [
  { id: 1, title: '123 Main St - Living Room', type: 'image', thumbnail: '/api/placeholder/300/200', listing: '123 Main St', created_at: '2024-01-15' },
  { id: 2, title: '123 Main St - Kitchen', type: 'image', thumbnail: '/api/placeholder/300/200', listing: '123 Main St', created_at: '2024-01-15' },
  { id: 3, title: '456 Oak Ave - Listing Video', type: 'video', thumbnail: '/api/placeholder/300/200', listing: '456 Oak Ave', created_at: '2024-01-14' },
  { id: 4, title: '789 Pine Rd - Virtual Staging', type: 'image', thumbnail: '/api/placeholder/300/200', listing: '789 Pine Rd', created_at: '2024-01-13' },
  { id: 5, title: '789 Pine Rd - Day to Dusk', type: 'image', thumbnail: '/api/placeholder/300/200', listing: '789 Pine Rd', created_at: '2024-01-12' },
  { id: 6, title: '321 Elm Dr - Master Bedroom', type: 'image', thumbnail: '/api/placeholder/300/200', listing: '321 Elm Dr', created_at: '2024-01-11' },
]

export default function MediaPage() {
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredMedia = mockMedia.filter(item => {
    if (filterType === 'all') return true
    return item.type === filterType
  })

  return (
    <div>
      <Header title="Media Library" subtitle="All your photos, videos, and templates" />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Select
              value={filterType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'All Media' },
                { value: 'image', label: 'Photos Only' },
                { value: 'video', label: 'Videos Only' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item) => (
              <Card key={item.id} hover className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    {item.type === 'video' ? (
                      <svg className="w-12 h-12 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <Badge 
                    variant={item.type === 'video' ? 'info' : 'success'} 
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {item.type}
                  </Badge>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.listing}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card padding="none">
            <div className="divide-y divide-gray-200">
              {filteredMedia.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.listing} • {item.created_at}</p>
                  </div>
                  <Badge 
                    variant={item.type === 'video' ? 'info' : 'success'}
                    size="sm"
                  >
                    {item.type}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">View</Button>
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
