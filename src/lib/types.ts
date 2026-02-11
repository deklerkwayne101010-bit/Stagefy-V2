// Type definitions for Stagefy database
// Generated from Supabase schema

export type UserRole = 'agent' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  brokerage?: string
  market?: string
  use_case?: 'photos' | 'video' | 'templates' | 'all'
  role: UserRole
  credits: number
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'subscription'
  description: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'paused' | 'past_due'
  payfast_subscription_id: string
  current_period_start: string
  current_period_end: string
  credits_remaining: number
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  type: 'photo_edit' | 'video' | 'template'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  credit_cost: number
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  created_at: string
  completed_at: string | null
}

// =============================================
// CRM TYPES - ENHANCED
// =============================================

export type ContactType = 'buyer' | 'seller' | 'investor' | 'other'
export type ContactStatus = 'lead' | 'active' | 'closed'
export type ContactTimeline = 'urgent' | 'flexible' | 'browsing'
export type ContactSource = 'online' | 'referral' | 'walk-in' | 'social' | 'other'
export type ContactPreference = 'email' | 'phone' | 'whatsapp' | 'sms'

export interface CRMContact {
  // Existing fields
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  type: ContactType
  status: ContactStatus
  notes: string
  tags: string[]
  created_at: string
  updated_at: string
  
  // Enhanced fields (Phase 0)
  preferred_locations?: string[]          // Areas the buyer is interested in
  budget_min?: number
  budget_max?: number
  property_types_interest?: string[]    // house, apartment, townhouse, etc.
  bedrooms_required?: number
  bathrooms_required?: number
  features_required?: string[]         // pool, garden, garage, etc.
  timeline?: ContactTimeline
  source?: ContactSource
  last_contacted_at?: string
  preferred_contact_method?: ContactPreference
  rating?: number                      // 1-5, hot lead to cold lead
}

export type ListingStatus = 'active' | 'pending' | 'sold' | 'off_market'
export type PropertyType = 'house' | 'apartment' | 'townhouse' | 'villa' | 'penthouse' | 'commercial'
export type ListingType = 'sole' | 'shared' | 'open'

export interface CRMListing {
  // Existing fields
  id: string
  user_id: string
  contact_id: string | null
  address: string
  city: string
  state: string
  zip_code: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  status: ListingStatus
  media: string[]
  notes: string
  created_at: string
  updated_at: string
  
  // Enhanced fields (Phase 0)
  property_type?: PropertyType
  land_size?: number                    // erf size in sqm
  year_built?: number
  levies?: number                       // monthly levy for complexes
  rates?: number                        // monthly rates
  parking?: number                      // number of parking bays
  features?: string[]                   // pool, garden, security, etc.
  listing_type?: ListingType
  mandate_expiry?: string
  instructions?: string                  // special instructions for showings
  virtual_tour_url?: string
  floorplan_url?: string
  open_house_dates?: string[]
  view_count?: number                   // how many times listing viewed
  inquiry_count?: number                // how many inquiries received
}

// =============================================
// TASKS (Phase 0)
// =============================================

export type TaskType = 'call' | 'email' | 'sms' | 'whatsapp' | 'showing' | 'meeting' | 'follow-up' | 'open-house' | 'other'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'completed' | 'cancelled' | 'missed'

export interface CRMContactTask {
  id: string
  user_id: string
  contact_id?: string
  listing_id?: string
  
  title: string
  description?: string
  task_type: TaskType
  priority: TaskPriority
  status: TaskStatus
  due_date?: string
  completed_at?: string
  reminder?: string
  
  created_at: string
  updated_at: string
}

// =============================================
// ACTIVITIES (Phase 0)
// =============================================

export type ActivityType = 'call' | 'email' | 'sms' | 'whatsapp' | 'meeting' | 
                          'showing' | 'note' | 'document' | 'status-change' | 
                          'listing-created' | 'listing-updated' | 'media-added' | 
                          'template-sent' | 'open-house'
export type ActivityDirection = 'inbound' | 'outbound' | 'internal'

export interface CRMActivity {
  id: string
  user_id: string
  contact_id?: string
  listing_id?: string
  
  activity_type: ActivityType
  subject?: string
  content: string
  direction: ActivityDirection
  duration?: number                    // minutes for calls
  outcome?: string                     // Result of the interaction
  next_action?: string                // Suggested next step
  
  created_at: string
}

// =============================================
// MEDIA TYPES
// =============================================

export interface MediaItem {
  id: string
  user_id: string
  listing_id?: string | null
  contact_id?: string | null
  project_id?: string | null
  type: 'image' | 'video' | 'template'
  url: string
  thumbnail_url: string
  title: string
  description: string
  credits_used: number
  created_at: string
}

export interface Template {
  id: string
  user_id: string
  name: string
  type: 'listing_promo' | 'instagram_reel' | 'open_house' | 'custom'
  thumbnail_url: string
  output_url: string
  prompt_used: string
  credits_used: number
  is_public: boolean
  created_at: string
}

// =============================================
// NOTIFICATIONS
// =============================================

export interface Notification {
  id: string
  user_id: string
  type: 'credit_low' | 'job_completed' | 'payment_success' | 'payment_failed' | 'subscription_renewal' | 'system'
  title: string
  message: string
  read: boolean
  action_url?: string | null
  created_at: string
}

// =============================================
// AI JOBS
// =============================================

export interface AIJob {
  id: string
  user_id: string
  project_id: string
  service: 'replicate' | 'qwen' | 'nano_banana'
  model: string
  input: Record<string, unknown>
  status: 'queued' | 'processing' | 'completed' | 'failed'
  output_url?: string | null
  error_message?: string | null
  credit_cost: number
  created_at: string
  completed_at?: string | null
}

// =============================================
// CREDIT COSTS
// =============================================

export const CREDIT_COSTS = {
  photo_edit: 1,
  image_to_video_3sec: 5,
  image_to_video_5sec: 8,
  image_to_video_10sec: 15,
  template_generation: 5,
  description_generation: 1,
} as const

export type CreditOperation = keyof typeof CREDIT_COSTS

// =============================================
// SUBSCRIPTION PLANS
// =============================================

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  monthly_credits: number
  price: number
  features: string[]
}

// =============================================
// ADMIN ANALYTICS
// =============================================

export interface AdminAnalytics {
  total_users: number
  active_subscriptions: number
  total_credits_purchased: number
  total_credits_used: number
  monthly_recurring_revenue: number
  top_users: Array<{
    user: User
    credits_used: number
    credits_remaining: number
  }>
}

// =============================================
// DEMO DATA
// =============================================

export const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'investor', label: 'Investor' },
  { value: 'other', label: 'Other' },
]

export const CONTACT_STATUSES: { value: ContactStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

export const LISTING_STATUSES: { value: ListingStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'off_market', label: 'Off Market' },
]

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'commercial', label: 'Commercial' },
]

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'call', label: '📞 Call' },
  { value: 'email', label: '📧 Email' },
  { value: 'sms', label: '💬 SMS' },
  { value: 'whatsapp', label: '💼 WhatsApp' },
  { value: 'showing', label: '🏠 Showing' },
  { value: 'meeting', label: '🤝 Meeting' },
  { value: 'follow-up', label: '🔄 Follow-up' },
  { value: 'open-house', label: '🏡 Open House' },
  { value: 'other', label: '📝 Other' },
]

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'red' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'low', label: 'Low', color: 'green' },
]

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💼' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'showing', label: 'Showing', icon: '🏠' },
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'document', label: 'Document', icon: '📄' },
  { value: 'listing-created', label: 'Listing Created', icon: '✨' },
  { value: 'listing-updated', label: 'Listing Updated', icon: '🔄' },
  { value: 'media-added', label: 'Media Added', icon: '🖼️' },
  { value: 'template-sent', label: 'Template Sent', icon: '📋' },
]

export const PROPERTY_FEATURES: string[] = [
  'Swimming Pool',
  'Garden',
  'Garage',
  'Security System',
  'Air Conditioning',
  'Solar Panels',
  'Home Office',
  'Entertainment Area',
  'Wine Cellar',
  'Smart Home',
  'Waterfront',
  'Mountain View',
  'City View',
  'Beach Access',
  'Pet Friendly',
  'Furnished',
  'Study',
  'Scullery',
  'Open Plan',
  'Borehole',
]
