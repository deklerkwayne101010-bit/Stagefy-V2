// Demo CRM Data - Shows all new enhanced fields and features
// This file is for demonstration and can be used for seeding/testing

// Helper function to get user contacts (demo mode)
export function getUserContacts(userId: string) {
  // In demo mode, return all demo contacts
  return demoContacts
}

// Helper function to get user listings (demo mode)
export function getUserListings(userId: string) {
  return demoListings
}

// Helper function to get user tasks (demo mode)
export function getUserTasks(userId: string) {
  return demoTasks
}

// Helper function to get user activities (demo mode)
export function getUserActivities(userId: string) {
  return demoActivities
}

// Helper function to get empty CRM message
export function getEmptyCrmMessage(type: 'contacts' | 'listings' | 'tasks' | 'activities'): string {
  const messages = {
    contacts: 'No contacts yet. Add your first contact to get started.',
    listings: 'No listings yet. Add your first listing to get started.',
    tasks: 'No tasks yet. Create a task to stay organized.',
    activities: 'No activities recorded yet. Start logging your interactions.',
  }
  return messages[type]
}

// Demo data arrays
export const demoContacts = [
  {
    id: 'demo-contact-1',
    name: 'John Buyer',
    email: 'john.buyer@email.com',
    phone: '+27 82 123 4567',
    contact_type: 'buyer',
    status: 'active',
    source: 'property_portal',
    rating: 4,
    budget_min: 1500000,
    budget_max: 3000000,
    preferences: {
      property_types: ['house', 'townhouse'],
      bedrooms: [3, 4],
      locations: ['Sandton', 'Bryanston'],
      features: ['pool', 'garden', 'garage'],
    },
    notes: 'Looking for family home in Sandton area. Pre-approved for R2.5M.',
    last_contacted_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T09:00:00Z',
    tags: ['hot_lead', 'family'],
  },
  {
    id: 'demo-contact-2',
    name: 'Sarah Seller',
    email: 'sarah.seller@email.com',
    phone: '+27 83 987 6543',
    contact_type: 'seller',
    status: 'active',
    source: 'referral',
    rating: 5,
    property_address: '45 Oak Avenue, Randburg',
    property_type: 'house',
    bedrooms: 4,
    asking_price: 2800000,
    mandate_expiry: '2024-03-31',
    notes: 'Motivated seller, looking to downsize. Property has been renovated.',
    last_contacted_at: '2024-01-14T14:00:00Z',
    created_at: '2023-12-15T11:00:00Z',
    tags: ['mandate', 'motivated'],
  },
  {
    id: 'demo-contact-3',
    name: 'Mike Investor',
    email: 'mike.investor@email.com',
    phone: '+27 84 555 1234',
    contact_type: 'investor',
    status: 'active',
    source: 'website',
    rating: 3,
    budget_min: 5000000,
    budget_max: 10000000,
    preferences: {
      property_types: ['apartment', 'block_of_flats'],
      locations: ['CBD', 'Midrand'],
      yield_min: 8,
    },
    notes: 'Looking for high-yield investment properties. All cash buyer.',
    last_contacted_at: '2024-01-10T09:00:00Z',
    created_at: '2024-01-05T16:00:00Z',
    tags: ['investor', 'cash_buyer'],
  },
]

export const demoListings = [
  {
    id: 'demo-listing-1',
    address: '45 Oak Avenue, Randburg',
    city: 'Johannesburg',
    suburb: 'Randburg',
    property_type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    asking_price: 2800000,
    status: 'active',
    listing_type: 'sale',
    features: ['pool', 'garden', 'braai', 'guest bathroom'],
    description: 'Beautiful family home in quiet neighborhood. Recently renovated kitchen and bathrooms.',
    agent_id: 'demo-user-1',
    inquiry_count: 15,
    view_count: 234,
    mandate_expiry: '2024-03-31',
    created_at: '2023-12-15T11:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'demo-listing-2',
    address: 'Unit 12, Sandton Heights',
    city: 'Johannesburg',
    suburb: 'Sandton',
    property_type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    garages: 1,
    asking_price: 1950000,
    status: 'active',
    listing_type: 'sale',
    features: ['balcony', 'security', 'pool', 'gym'],
    description: 'Stunning apartment in Sandton with panoramic city views.',
    agent_id: 'demo-user-1',
    inquiry_count: 8,
    view_count: 156,
    created_at: '2024-01-02T14:00:00Z',
    updated_at: '2024-01-12T09:00:00Z',
  },
  {
    id: 'demo-listing-3',
    address: '24 Beach Road, Camps Bay',
    city: 'Cape Town',
    suburb: 'Camps Bay',
    property_type: 'house',
    bedrooms: 5,
    bathrooms: 4,
    garages: 2,
    asking_price: 12500000,
    status: 'active',
    listing_type: 'sale',
    features: ['ocean_view', 'pool', 'entertainment_area', 'guest_quarters'],
    description: 'Luxurious beachfront property with stunning ocean views.',
    agent_id: 'demo-user-1',
    inquiry_count: 3,
    view_count: 89,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
]

export const demoTasks = [
  {
    id: 'demo-task-1',
    title: 'Follow up with John Buyer',
    description: 'Send property listings matching his criteria',
    task_type: 'follow-up',
    priority: 'high',
    status: 'pending',
    due_date: '2024-01-16T09:00:00Z',
    contact_id: 'demo-contact-1',
    listing_id: null,
    reminder: '2024-01-16T08:00:00Z',
    created_at: '2024-01-14T15:00:00Z',
  },
  {
    id: 'demo-task-2',
    title: 'Schedule property viewing',
    description: 'Arrange showing for Sarah Seller\'s property',
    task_type: 'showing',
    priority: 'high',
    status: 'pending',
    due_date: '2024-01-17T10:00:00Z',
    contact_id: 'demo-contact-2',
    listing_id: 'demo-listing-1',
    reminder: '2024-01-17T09:00:00Z',
    created_at: '2024-01-14T14:30:00Z',
  },
  {
    id: 'demo-task-3',
    title: 'Call Mike Investor',
    description: 'Discuss new investment opportunities in CBD',
    task_type: 'call',
    priority: 'medium',
    status: 'pending',
    due_date: '2024-01-18T11:00:00Z',
    contact_id: 'demo-contact-3',
    listing_id: null,
    reminder: '2024-01-18T10:00:00Z',
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'demo-task-4',
    title: 'Update listing photos',
    description: 'Add new photos to Sandton Heights listing',
    task_type: 'admin',
    priority: 'low',
    status: 'completed',
    due_date: '2024-01-13T12:00:00Z',
    contact_id: null,
    listing_id: 'demo-listing-2',
    completed_at: '2024-01-13T11:30:00Z',
    created_at: '2024-01-12T16:00:00Z',
  },
]

export const demoActivities = [
  {
    id: 'demo-activity-1',
    activity_type: 'call',
    subject: 'Follow-up call',
    content: 'Discussed property preferences and budget range. John is looking for a 3-4 bedroom house in Sandton.',
    direction: 'outbound',
    duration: 15,
    outcome: 'positive',
    next_action: 'Send listings',
    contact_id: 'demo-contact-1',
    listing_id: null,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'demo-activity-2',
    activity_type: 'email',
    subject: 'Property Inquiry Response',
    content: 'Sent 3 matching property listings to John Buyer.',
    direction: 'outbound',
    duration: 5,
    outcome: 'sent',
    contact_id: 'demo-contact-1',
    listing_id: null,
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'demo-activity-3',
    activity_type: 'showing',
    subject: 'Property Viewing',
    content: 'Conducted showing of 45 Oak Avenue. Buyer was impressed with the renovation.',
    direction: 'outbound',
    duration: 45,
    outcome: 'positive_feedback',
    next_action: 'Send offer instructions',
    contact_id: 'demo-contact-1',
    listing_id: 'demo-listing-1',
    created_at: '2024-01-14T14:00:00Z',
  },
  {
    id: 'demo-activity-4',
    activity_type: 'meeting',
    subject: 'Mandate Signing',
    content: 'Met with Sarah Seller to sign exclusive mandate.',
    direction: 'outbound',
    duration: 60,
    outcome: 'mandate_signed',
    contact_id: 'demo-contact-2',
    listing_id: 'demo-listing-1',
    created_at: '2023-12-15T11:00:00Z',
  },
  {
    id: 'demo-activity-5',
    activity_type: 'email',
    subject: 'Inquiry Response',
    content: 'Responded to web inquiry about Sandton apartment.',
    direction: 'outbound',
    duration: 10,
    outcome: 'responded',
    contact_id: null,
    listing_id: 'demo-listing-2',
    created_at: '2024-01-14T09:00:00Z',
  },
  {
    id: 'demo-activity-6',
    activity_type: 'note',
    subject: 'Internal Note',
    content: 'Updated property valuation based on recent comparable sales in the area.',
    direction: 'internal',
    contact_id: null,
    listing_id: 'demo-listing-1',
    created_at: '2024-01-13T16:00:00Z',
  },
]

export const activityTypeLabels: Record<string, string> = {
  call: 'Phone Call',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  meeting: 'Meeting',
  showing: 'Property Showing',
  note: 'Note',
  task: 'Task',
  open_house: 'Open House',
}

export const activityTypeIcons: Record<string, string> = {
  call: '📞',
  email: '📧',
  sms: '💬',
  whatsapp: '💬',
  meeting: '🤝',
  showing: '🏠',
  note: '📝',
  task: '✅',
  open_house: '🚪',
}

export const taskPriorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export const taskStatusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const propertyTypeLabels: Record<string, string> = {
  house: 'House',
  apartment: 'Apartment',
  townhouse: 'Townhouse',
  flat: 'Flat',
  land: 'Land',
  commercial: 'Commercial',
  industrial: 'Industrial',
  section_title: 'Section Title',
  freehold: 'Freehold',
}

export const listingStatusLabels: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  sold: 'Sold',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
}

export const contactTypeLabels: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  landlord: 'Landlord',
  tenant: 'Tenant',
  investor: 'Investor',
  developer: 'Developer',
  other: 'Other',
}

export const leadSourceLabels: Record<string, string> = {
  property_portal: 'Property Portal',
  referral: 'Referral',
  website: 'Website',
  social_media: 'Social Media',
  flyer: 'Flyer/广告',
  signage: 'Signage',
  walk_in: 'Walk-in',
  phone: 'Phone',
  other: 'Other',
}
