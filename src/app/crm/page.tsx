// Main CRM page - Overview with real data
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth-context'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  type: string
  status: string
  created_at: string
}

interface Listing {
  id: string
  title: string
  address: string
  price: number
  status: string
  bedrooms?: number
  bathrooms?: number
  property_type?: string
}

interface Stats {
  contacts: number
  listings: number
  pendingListings: number
}

export default function CRMPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ contacts: 0, listings: 0, pendingListings: 0 })
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [recentListings, setRecentListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      // Fetch contacts
      const contactsRes = await fetch('/api/crm/contacts?limit=5')
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setRecentContacts(contactsData.contacts || [])
        setStats(prev => ({ ...prev, contacts: contactsData.total || contactsData.contacts?.length || 0 }))
      }

      // Fetch listings
      const listingsRes = await fetch('/api/crm/listings?limit=5')
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json()
        const listings = listingsData.listings || []
        setRecentListings(listings)
        setStats(prev => ({ 
          ...prev, 
          listings: listingsData.total || listings.length || 0,
          pendingListings: listings.filter((l: Listing) => l.status === 'pending').length
        }))
      }
    } catch (error) {
      console.error('Error fetching CRM data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (!numPrice) return 'Price on request'
    return 'R ' + new Intl.NumberFormat('en-ZA').format(numPrice)
  }

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

        {/* Stats - Real Data */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <p className="text-sm text-gray-500">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.contacts}</p>
              <p className="text-sm text-blue-600 mt-1">{recentContacts.length} recent</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.listings}</p>
              {stats.pendingListings > 0 && (
                <p className="text-sm text-yellow-600 mt-1">{stats.pendingListings} pending</p>
              )}
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Media Files</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
              <p className="text-sm text-gray-500 mt-1">Coming soon</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Deals Closed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
              <p className="text-sm text-gray-500 mt-1">Track in activities</p>
            </Card>
          </div>
        )}

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
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : recentContacts.length > 0 ? (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {contact.status}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{contact.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No contacts yet</p>
                <Link href="/crm/contacts">
                  <Button size="sm" className="mt-2">Add your first contact</Button>
                </Link>
              </div>
            )}
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
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : recentListings.length > 0 ? (
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{listing.title || listing.address}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {listing.bedrooms && `${listing.bedrooms} bed`}
                          {listing.bedrooms && listing.bathrooms && ' • '}
                          {listing.bathrooms && `${listing.bathrooms} bath`}
                          {listing.property_type && ` • ${listing.property_type}`}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatPrice(listing.price)}</p>
                    </div>
                    <div className="mt-2">
                      <Badge 
                        variant={listing.status === 'active' ? 'success' : listing.status === 'pending' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {listing.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No listings yet</p>
                <Link href="/crm/listings">
                  <Button size="sm" className="mt-2">Add your first listing</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
