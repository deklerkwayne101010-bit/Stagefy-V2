// Contacts page for CRM
'use client'

import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const mockContacts = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@email.com', phone: '(555) 123-4567', type: 'buyer', status: 'active', notes: 'Looking for 3BR in Beverly Hills' },
  { id: 2, name: 'Mike Chen', email: 'mike@email.com', phone: '(555) 234-5678', type: 'seller', status: 'lead', notes: 'Selling investment property' },
  { id: 3, name: 'Emily Davis', email: 'emily@email.com', phone: '(555) 345-6789', type: 'investor', status: 'active', notes: 'Portfolio buyer' },
  { id: 4, name: 'James Wilson', email: 'james@email.com', phone: '(555) 456-7890', type: 'buyer', status: 'closed', notes: 'Purchased 456 Oak Ave' },
  { id: 5, name: 'Lisa Brown', email: 'lisa@email.com', phone: '(555) 567-8901', type: 'seller', status: 'active', notes: 'Relocating to Florida' },
]

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || contact.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div>
      <Header title="Contacts" subtitle="Manage your clients and prospects" />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filterType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'buyer', label: 'Buyers' },
              { value: 'seller', label: 'Sellers' },
              { value: 'investor', label: 'Investors' },
            ]}
          />
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </Button>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} hover>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium text-blue-600">
                    {contact.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{contact.type}</p>
                    </div>
                    <Badge 
                      variant={contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {contact.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{contact.email}</p>
                  <p className="text-sm text-gray-500">{contact.phone}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{contact.notes}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="ghost">View</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 mt-4">No contacts found</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>Add your first contact</Button>
          </div>
        )}
      </div>
    </div>
  )
}
