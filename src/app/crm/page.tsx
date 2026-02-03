// Main CRM page - Overview
'use client'

import React from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const stats = [
  { label: 'Total Contacts', value: '48', change: '+3 this week' },
  { label: 'Active Listings', value: '12', change: '2 pending' },
  { label: 'Media Files', value: '156', change: '+23 this month' },
  { label: 'Deals Closed', value: '8', change: 'R43M total' },
]

const recentContacts = [
  { id: 1, name: 'Sarah Johnson', type: 'buyer', email: 'sarah@email.com', status: 'active' },
  { id: 2, name: 'Mike Chen', type: 'seller', email: 'mike@email.com', status: 'lead' },
  { id: 3, name: 'Emily Davis', type: 'investor', email: 'emily@email.com', status: 'active' },
]

const recentListings = [
  { id: 1, address: '123 Main St, Los Angeles, CA', price: 'R15.3M', status: 'active', bedrooms: 3, bathrooms: 2 },
  { id: 2, address: '456 Oak Ave, Beverly Hills, CA', price: 'R43.2M', status: 'pending', bedrooms: 5, bathrooms: 4 },
  { id: 3, address: '789 Pine Rd, Santa Monica, CA', price: 'R21.6M', status: 'active', bedrooms: 4, bathrooms: 3 },
]

export default function CRMPage() {
  return (
    <div>
      <Header title="CRM" subtitle="Manage your contacts, listings, and media" />

      <div className="p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link href="/crm/contacts">
            <Card hover className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Add Contact</h3>
                  <p className="text-sm text-gray-500">New buyer, seller, or investor</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/crm/listings">
            <Card hover className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Add Listing</h3>
                  <p className="text-sm text-gray-500">New property listing</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/crm/media">
            <Card hover className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Media Library</h3>
                  <p className="text-sm text-gray-500">View all photos & videos</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

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
          {/* Recent Contacts */}
          <Card>
            <CardHeader 
              title="Recent Contacts" 
              action={
                <Link href="/crm/contacts" className="text-sm text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              }
            />
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {contact.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                  <Badge 
                    variant={contact.status === 'active' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {contact.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Listings */}
          <Card>
            <CardHeader 
              title="Recent Listings" 
              action={
                <Link href="/crm/listings" className="text-sm text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              }
            />
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <div key={listing.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{listing.address}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {listing.bedrooms} bed • {listing.bathrooms} bath
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">{listing.price}</p>
                  </div>
                  <div className="mt-2">
                    <Badge 
                      variant={listing.status === 'active' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {listing.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
