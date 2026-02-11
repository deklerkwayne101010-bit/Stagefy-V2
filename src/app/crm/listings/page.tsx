// Listings page for CRM
'use client'

import React, { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth-context'
import { getUserListings, getEmptyCrmMessage } from '@/lib/demo-crm-data'

export default function ListingsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Get user-specific listings
  const userListings = useMemo(() => {
    if (!user) return []
    return getUserListings(user.id)
  }, [user])

  const filteredListings = userListings.filter(listing => {
    const matchesSearch = listing.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
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
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Listing
          </Button>
        </div>

        {/* Listings Table */}
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
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{listing.address}</p>
                        <p className="text-sm text-gray-500">{listing.city}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{formatPrice(listing.asking_price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{listing.bedrooms} bed • {listing.bathrooms} bath • {listing.property_type}</p>
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
                        <Button size="sm" variant="ghost">View</Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-gray-500 mt-4">{user ? getEmptyCrmMessage('listings') : 'Please log in to view your listings'}</p>
            {user && <Button className="mt-4">Add your first listing</Button>}
          </div>
        )}
      </div>
    </div>
  )
}
