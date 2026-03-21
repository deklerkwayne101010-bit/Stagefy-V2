// Contacts page for CRM - with real data
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth-context'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  contact_type: string
  status: string
  notes: string
  address?: string
  company?: string
  created_at: string
}

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact_type: 'buyer',
    status: 'lead',
    notes: '',
    address: '',
    company: ''
  })

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterType !== 'all') params.set('type', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      
      const response = await fetch(`/api/crm/contacts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, searchTerm, filterType, filterStatus])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      contact_type: 'buyer',
      status: 'lead',
      notes: '',
      address: '',
      company: ''
    })
    setEditingContact(null)
  }

  // Open add modal
  const handleAdd = () => {
    resetForm()
    setShowModal(true)
  }

  // Open edit modal
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      contact_type: contact.contact_type || 'buyer',
      status: contact.status || 'lead',
      notes: contact.notes || '',
      address: contact.address || '',
      company: contact.company || ''
    })
    setShowModal(true)
  }

  // Save contact (create or update)
  const handleSave = async () => {
    if (!formData.name) return
    
    setIsSaving(true)
    try {
      const url = editingContact 
        ? `/api/crm/contacts/${editingContact.id}`
        : '/api/crm/contacts'
      
      const method = editingContact ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        resetForm()
        fetchContacts()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save contact')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Failed to save contact')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete contact
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    try {
      const response = await fetch(`/api/crm/contacts/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchContacts()
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

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
          <Select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'lead', label: 'Leads' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <Button onClick={handleAdd}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </Button>
        </div>

        {/* Contacts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id} hover>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-medium text-blue-600">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{contact.contact_type}</p>
                      </div>
                      <Badge 
                        variant={contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {contact.status}
                      </Badge>
                    </div>
                    {contact.email && <p className="text-sm text-gray-600 mt-2">{contact.email}</p>}
                    {contact.phone && <p className="text-sm text-gray-500">{contact.phone}</p>}
                    {contact.company && <p className="text-sm text-gray-500">{contact.company}</p>}
                    {contact.notes && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{contact.notes}</p>}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(contact)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(contact.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && contacts.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 mt-4">{user ? 'No contacts found. Add your first contact!' : 'Please log in to view your contacts'}</p>
            {user && <Button className="mt-4" onClick={handleAdd}>Add your first contact</Button>}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingContact ? 'Edit Contact' : 'Add Contact'}</h2>
              
              <div className="space-y-4">
                <Input
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type"
                    value={formData.contact_type}
                    onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
                    options={[
                      { value: 'buyer', label: 'Buyer' },
                      { value: 'seller', label: 'Seller' },
                      { value: 'investor', label: 'Investor' },
                      { value: 'tenant', label: 'Tenant' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'lead', label: 'Lead' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                  />
                </div>

                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />

                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Physical address"
                />

                <Textarea
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isSaving} className="flex-1">
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
