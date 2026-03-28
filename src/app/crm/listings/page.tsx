// Listings page for CRM - with real data
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth-context'

// Helper to get auth headers for API calls
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      }
    }
  } catch {
    // ignore
  }
  return { 'Content-Type': 'application/json' }
}

interface Listing {
  id: string
  title: string
  address: string
  price: number
  description?: string
  status: string
  listing_type: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  created_at: string
}

export default function ListingsPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    price: '',
    description: '',
    status: 'active',
    listing_type: 'sale',
    property_type: 'house',
    bedrooms: '',
    bathrooms: ''
  })

  // Fetch listings from API
  const fetchListings = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('property_type', filterType)
      
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/crm/listings?${params}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings || [])
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, searchTerm, filterStatus, filterType])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Format price
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (!numPrice) return 'Price on request'
    return 'R ' + new Intl.NumberFormat('en-ZA').format(numPrice)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      price: '',
      description: '',
      status: 'active',
      listing_type: 'sale',
      property_type: 'house',
      bedrooms: '',
      bathrooms: ''
    })
    setEditingListing(null)
  }

  // Open add modal
  const handleAdd = () => {
    resetForm()
    setShowModal(true)
  }

  // Open edit modal
  const handleEdit = (listing: Listing) => {
    setEditingListing(listing)
    setFormData({
      title: listing.title || '',
      address: listing.address || '',
      price: listing.price?.toString() || '',
      description: listing.description || '',
      status: listing.status || 'active',
      listing_type: listing.listing_type || 'sale',
      property_type: listing.property_type || 'house',
      bedrooms: listing.bedrooms?.toString() || '',
      bathrooms: listing.bathrooms?.toString() || ''
    })
    setShowModal(true)
  }

  // Save listing (create or update)
  const handleSave = async () => {
    if (!formData.title || !formData.address) return
    
    setIsSaving(true)
    try {
      const url = editingListing 
        ? `/api/crm/listings/${editingListing.id}`
        : '/api/crm/listings'
      
      const method = editingListing ? 'PUT' : 'POST'
      
      const headers = await getAuthHeaders()
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null
        })
      })

      if (response.ok) {
        setShowModal(false)
        resetForm()
        fetchListings()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save listing')
      }
    } catch (error) {
      console.error('Error saving listing:', error)
      alert('Failed to save listing')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete listing
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/crm/listings/${id}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        fetchListings()
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
    }
  }

  return (
    <div>
      <Header title="Listings" subtitle="Manage your property listings" />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'sold', label: 'Sold' },
            ]}
          />
          <Select
            value={filterType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'house', label: 'House' },
              { value: 'apartment', label: 'Apartment' },
              { value: 'flat', label: 'Flat' },
              { value: 'townhouse', label: 'Townhouse' },
              { value: 'land', label: 'Land' },
            ]}
          />
          <Button onClick={handleAdd}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Listing
          </Button>
        </div>

        {/* Listings Table */}
        {isLoading ? (
          <Card padding="none">
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{listing.title}</p>
                          <p className="text-sm text-gray-500">{listing.address}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{formatPrice(listing.price)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {listing.bedrooms && `${listing.bedrooms} bed`}
                          {listing.bedrooms && listing.bathrooms && ' • '}
                          {listing.bathrooms && `${listing.bathrooms} bath`}
                          {listing.property_type && ` • ${listing.property_type}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={listing.status === 'active' ? 'success' : listing.status === 'pending' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {listing.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(listing.id)}>Delete</Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(listing)}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-gray-500 mt-4">{user ? 'No listings found. Add your first listing!' : 'Please log in to view your listings'}</p>
            {user && <Button className="mt-4" onClick={handleAdd}>Add your first listing</Button>}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingListing ? 'Edit Listing' : 'Add Listing'}</h2>
              
              <div className="space-y-4">
                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Beautiful Family Home"
                  required
                />
                
                <Input
                  label="Address *"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Property address"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Price (ZAR)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 1500000"
                  />
                  <Select
                    label="Listing Type"
                    value={formData.listing_type}
                    onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                    options={[
                      { value: 'sale', label: 'For Sale' },
                      { value: 'rent', label: 'For Rent' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Select
                    label="Property Type"
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    options={[
                      { value: 'house', label: 'House' },
                      { value: 'apartment', label: 'Apartment' },
                      { value: 'flat', label: 'Flat' },
                      { value: 'townhouse', label: 'Townhouse' },
                      { value: 'land', label: 'Land' },
                      { value: 'commercial', label: 'Commercial' },
                    ]}
                  />
                  <Input
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    placeholder="3"
                  />
                  <Input
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="2"
                  />
                </div>

                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'sold', label: 'Sold' },
                    { value: 'withdrawn', label: 'Withdrawn' },
                  ]}
                />

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Property description..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isSaving} className="flex-1">
                  {editingListing ? 'Save Changes' : 'Add Listing'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
