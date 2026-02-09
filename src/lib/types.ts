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

export interface CRMContact {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  type: 'buyer' | 'seller' | 'investor' | 'other'
  status: 'lead' | 'active' | 'closed'
  notes: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CRMListing {
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
  status: 'active' | 'pending' | 'sold' | 'off_market'
  media: string[]
  notes: string
  created_at: string
  updated_at: string
}

export interface MediaItem {
  id: string
  user_id: string
  listing_id: string | null
  contact_id: string | null
  project_id: string | null
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

export interface Notification {
  id: string
  user_id: string
  type: 'credit_low' | 'job_completed' | 'payment_success' | 'payment_failed' | 'subscription_renewal' | 'system'
  title: string
  message: string
  read: boolean
  action_url: string | null
  created_at: string
}

export interface AIJob {
  id: string
  user_id: string
  project_id: string
  service: 'replicate' | 'qwen' | 'nano_banana'
  model: string
  input: Record<string, unknown>
  status: 'queued' | 'processing' | 'completed' | 'failed'
  output_url: string | null
  error_message: string | null
  credit_cost: number
  created_at: string
  completed_at: string | null
}

// Credit costs for different operations
export const CREDIT_COSTS = {
  photo_edit: 1,
  image_to_video_3sec: 5,
  image_to_video_5sec: 8,
  image_to_video_10sec: 15,
  template_generation: 5,
  description_generation: 2,
} as const

export type CreditOperation = keyof typeof CREDIT_COSTS

// Subscription plans
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  monthly_credits: number
  price: number
  features: string[]
}

// Admin analytics
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
