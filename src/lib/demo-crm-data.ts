// Demo CRM data - user-specific contacts, listings, and media
// Each demo user gets their own unique data

export interface DemoContact {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  type: 'buyer' | 'seller' | 'investor'
  status: 'active' | 'lead' | 'closed'
  notes: string
  created_at: string
}

export interface DemoListing {
  id: string
  user_id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  status: 'active' | 'pending' | 'sold'
  city: string
  created_at: string
}

export interface DemoMedia {
  id: string
  user_id: string
  title: string
  type: 'image' | 'video'
  listing: string
  created_at: string
}

// Demo Agent's data (demo-user-1)
const demoAgentContacts: DemoContact[] = [
  { id: 'c1', user_id: 'demo-user-1', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '(555) 123-4567', type: 'buyer', status: 'active', notes: 'Looking for 3BR in Beverly Hills', created_at: '2024-01-15' },
  { id: 'c2', user_id: 'demo-user-1', name: 'Mike Chen', email: 'mike@email.com', phone: '(555) 234-5678', type: 'seller', status: 'lead', notes: 'Selling investment property', created_at: '2024-01-14' },
  { id: 'c3', user_id: 'demo-user-1', name: 'Emily Davis', email: 'emily@email.com', phone: '(555) 345-6789', type: 'investor', status: 'active', notes: 'Portfolio buyer', created_at: '2024-01-13' },
]

const demoAgentListings: DemoListing[] = [
  { id: 'l1', user_id: 'demo-user-1', address: '123 Main St, Los Angeles, CA', price: 1530000, bedrooms: 3, bathrooms: 2, sqft: 1800, status: 'active', city: 'Los Angeles', created_at: '2024-01-15' },
  { id: 'l2', user_id: 'demo-user-1', address: '456 Oak Ave, Beverly Hills, CA', price: 4320000, bedrooms: 5, bathrooms: 4, sqft: 4200, status: 'pending', city: 'Beverly Hills', created_at: '2024-01-14' },
  { id: 'l3', user_id: 'demo-user-1', address: '789 Pine Rd, Santa Monica, CA', price: 2160000, bedrooms: 4, bathrooms: 3, sqft: 2400, status: 'active', city: 'Santa Monica', created_at: '2024-01-13' },
]

const demoAgentMedia: DemoMedia[] = [
  { id: 'm1', user_id: 'demo-user-1', title: '123 Main St - Living Room', type: 'image', listing: '123 Main St', created_at: '2024-01-15' },
  { id: 'm2', user_id: 'demo-user-1', title: '123 Main St - Kitchen', type: 'image', listing: '123 Main St', created_at: '2024-01-15' },
  { id: 'm3', user_id: 'demo-user-1', title: '456 Oak Ave - Listing Video', type: 'video', listing: '456 Oak Ave', created_at: '2024-01-14' },
  { id: 'm4', user_id: 'demo-user-1', title: '789 Pine Rd - Virtual Staging', type: 'image', listing: '789 Pine Rd', created_at: '2024-01-13' },
]

// Demo Admin's data (demo-admin-1)
const demoAdminContacts: DemoContact[] = [
  { id: 'c4', user_id: 'demo-admin-1', name: 'James Wilson', email: 'james@email.com', phone: '(555) 456-7890', type: 'buyer', status: 'closed', notes: 'Purchased 456 Oak Ave', created_at: '2024-01-12' },
  { id: 'c5', user_id: 'demo-admin-1', name: 'Lisa Brown', email: 'lisa@email.com', phone: '(555) 567-8901', type: 'seller', status: 'active', notes: 'Relocating to Florida', created_at: '2024-01-11' },
]

const demoAdminListings: DemoListing[] = [
  { id: 'l4', user_id: 'demo-admin-1', address: '321 Elm Dr, Malibu, CA', price: 8100000, bedrooms: 6, bathrooms: 5, sqft: 5500, status: 'active', city: 'Malibu', created_at: '2024-01-12' },
  { id: 'l5', user_id: 'demo-admin-1', address: '654 Maple Ln, Pasadena, CA', price: 1764000, bedrooms: 3, bathrooms: 2, sqft: 2000, status: 'sold', city: 'Pasadena', created_at: '2024-01-11' },
]

const demoAdminMedia: DemoMedia[] = [
  { id: 'm5', user_id: 'demo-admin-1', title: '789 Pine Rd - Day to Dusk', type: 'image', listing: '789 Pine Rd', created_at: '2024-01-12' },
  { id: 'm6', user_id: 'demo-admin-1', title: '321 Elm Dr - Master Bedroom', type: 'image', listing: '321 Elm Dr', created_at: '2024-01-11' },
  { id: 'm7', user_id: 'demo-admin-1', title: '654 Maple Ln - Virtual Tour', type: 'video', listing: '654 Maple Ln', created_at: '2024-01-10' },
]

// Functions to get user-specific data
export function getUserContacts(userId: string): DemoContact[] {
  if (userId === 'demo-user-1') return demoAgentContacts
  if (userId === 'demo-admin-1') return demoAdminContacts
  // For other users (temp users), return empty array
  return []
}

export function getUserListings(userId: string): DemoListing[] {
  if (userId === 'demo-user-1') return demoAgentListings
  if (userId === 'demo-admin-1') return demoAdminListings
  return []
}

export function getUserMedia(userId: string): DemoMedia[] {
  if (userId === 'demo-user-1') return demoAgentMedia
  if (userId === 'demo-admin-1') return demoAdminMedia
  return []
}

// Get empty state message for new users
export function getEmptyCrmMessage(type: 'contacts' | 'listings' | 'media'): string {
  switch (type) {
    case 'contacts':
      return 'No contacts found. Add your first contact to get started!'
    case 'listings':
      return 'No listings found. Add your first listing to get started!'
    case 'media':
      return 'No media found. Create some media to see it here!'
  }
}
