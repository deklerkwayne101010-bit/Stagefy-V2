import { createClient } from '@supabase/supabase-js'
import { type User } from './types'

// Environment variables should be set in .env.local
// NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Lazy initialization to avoid errors when env vars are missing
let supabaseClient: ReturnType<typeof createClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseClient
}

function getSupabaseAdminClient() {
  if (!supabaseAdminClient && supabaseUrl && serviceRoleKey) {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
}

// Export for browser-side operations
export const supabase = {
  auth: {
    getUser: async () => {
      const client = getSupabaseClient()
      if (!client) return { data: { user: null }, error: new Error('Supabase not configured') }
      return client.auth.getUser()
    },
    getSession: async () => {
      const client = getSupabaseClient()
      if (!client) return { data: { session: null }, error: new Error('Supabase not configured') }
      return client.auth.getSession()
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const client = getSupabaseClient()
      if (!client) return { data: null, error: new Error('Supabase not configured') }
      return client.auth.signInWithPassword(credentials)
    },
    signUp: async (credentials: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
      const client = getSupabaseClient()
      if (!client) return { data: null, error: new Error('Supabase not configured') }
      return client.auth.signUp(credentials)
    },
    signOut: async () => {
      const client = getSupabaseClient()
      if (!client) return { error: new Error('Supabase not configured') }
      return client.auth.signOut()
    },
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
      const client = getSupabaseClient()
      if (!client) {
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
      return client.auth.onAuthStateChange(callback)
    },
  },
  from: (table: string) => {
    const client = getSupabaseClient()
    if (!client) {
      const mockResponse = { error: new Error('Supabase not configured') }
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({ data: null, ...mockResponse }),
              single: () => ({ data: null, ...mockResponse }),
            }),
          }),
        }),
        insert: (values: any) => ({
          select: () => ({
            single: () => ({ data: null, ...mockResponse }),
          }),
        }),
        update: (values: any) => ({
          eq: () => ({
            select: () => ({
              single: () => ({ data: null, ...mockResponse }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({ ...mockResponse }),
        }),
      } as any
    }
    return client.from(table)
  },
}

// Export admin client getter
export function getAdminClient() {
  return getSupabaseAdminClient()
}

// Storage bucket name
const UPLOADS_BUCKET = 'uploads'

/**
 * Upload an image to Supabase Storage and save record to database
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<{ data: { id: string; url: string } | null; error: Error | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = `${userId}/${timestamp}-${randomStr}-${file.name}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from(UPLOADS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        throw new Error('Storage bucket "uploads" not found. Please create it in Supabase Dashboard → Storage → New Bucket (name: uploads, make it public)')
      }
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from(UPLOADS_BUCKET)
      .getPublicUrl(fileName)

    // Save to media_items table
    const { data: mediaData, error: dbError } = await (client
      .from('media_items') as any)
      .insert({
        user_id: userId,
        type: 'image',
        url: publicUrl,
        title: file.name,
      })
      .select('id, url')
      .single()

    if (dbError) {
      throw dbError
    }

    return { data: mediaData, error: null }
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Failed to upload image') }
  }
}

/**
 * Get upload history for a user (last N images)
 */
export async function getUploadHistory(
  userId: string,
  limit: number = 5
): Promise<{ data: Array<{ id: string; url: string; created_at: string }> | null; error: Error | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }

  try {
    const { data, error } = await client
      .from('media_items')
      .select('id, url, created_at')
      .eq('user_id', userId)
      .eq('type', 'image')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Failed to fetch upload history') }
  }
}

/**
 * Select an image from upload history
 */
export async function getMediaById(
  mediaId: string
): Promise<{ data: { id: string; url: string } | null; error: Error | null }> {
  const client = getSupabaseClient()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }

  try {
    const { data, error } = await client
      .from('media_items')
      .select('id, url')
      .eq('id', mediaId)
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Failed to fetch media') }
  }
}

// Helper function to check if user is authenticated - optimized with parallel fetching
export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient()
  if (!client) return null
  
  // For demo purposes, return a mock user if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      id: 'demo-user',
      email: 'demo@example.com',
      full_name: 'Demo User',
      credits: 0,
      subscription_tier: 'free',
      role: 'agent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
  
  // Fetch auth user and profile in parallel
  const [authResult, profileResult] = await Promise.all([
    client.auth.getUser(),
    client.auth.getSession(),
  ])
  
  const user = authResult.data.user
  if (!user) return null
  
  // Fetch profile from users table
  try {
    const { data } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) {
      return data as User
    }
    
    // If profile doesn't exist in users table, return minimal user data with credits
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      role: 'agent',
      credits: 50,
      subscription_tier: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } catch {
    // If profile fetch fails, return minimal user data
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      role: 'agent',
      credits: 50,
      subscription_tier: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

// Database schema for reference:
// -- Users table
// CREATE TABLE users (
//   id UUID PRIMARY KEY REFERENCES auth.users(id),
//   email TEXT UNIQUE NOT NULL,
//   full_name TEXT NOT NULL,
//   brokerage TEXT,
//   market TEXT,
//   use_case TEXT CHECK (use_case IN ('photos', 'video', 'templates', 'all')),
//   role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'admin')),
//   credits INTEGER DEFAULT 50,
//   subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Credit transactions
// CREATE TABLE credit_transactions (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   amount INTEGER NOT NULL,
//   type TEXT CHECK (type IN ('purchase', 'usage', 'refund', 'subscription')),
//   description TEXT,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Subscriptions
// CREATE TABLE subscriptions (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   plan_id TEXT NOT NULL,
//   status TEXT CHECK (status IN ('active', 'cancelled', 'paused', 'past_due')),
//   payfast_subscription_id TEXT,
//   current_period_start TIMESTAMP WITH TIME ZONE,
//   current_period_end TIMESTAMP WITH TIME ZONE,
//   credits_remaining INTEGER,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Projects
// CREATE TABLE projects (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   name TEXT NOT NULL,
//   type TEXT CHECK (type IN ('photo_edit', 'video', 'template')),
//   status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
//   credit_cost INTEGER DEFAULT 0,
//   input_data JSONB DEFAULT '{}',
//   output_data JSONB DEFAULT '{}',
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   completed_at TIMESTAMP WITH TIME ZONE
// );
//
// -- CRM Contacts
// CREATE TABLE crm_contacts (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   name TEXT NOT NULL,
//   email TEXT,
//   phone TEXT,
//   type TEXT CHECK (type IN ('buyer', 'seller', 'investor', 'other')),
//   status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'closed')),
//   notes TEXT,
//   tags TEXT[] DEFAULT '{}',
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- CRM Listings
// CREATE TABLE crm_listings (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   contact_id UUID REFERENCES crm_contacts(id),
//   address TEXT NOT NULL,
//   city TEXT,
//   state TEXT,
//   zip_code TEXT,
//   price DECIMAL(12,2),
//   bedrooms INTEGER,
//   bathrooms DECIMAL(3,1),
//   sqft INTEGER,
//   status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'off_market')),
//   media TEXT[] DEFAULT '{}',
//   notes TEXT,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Media items
// CREATE TABLE media_items (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   listing_id UUID REFERENCES crm_listings(id),
//   contact_id UUID REFERENCES crm_contacts(id),
//   project_id UUID REFERENCES projects(id),
//   type TEXT CHECK (type IN ('image', 'video', 'template')),
//   url TEXT NOT NULL,
//   thumbnail_url TEXT,
//   title TEXT,
//   description TEXT,
//   credits_used INTEGER DEFAULT 0,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Templates
// CREATE TABLE templates (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   name TEXT NOT NULL,
//   type TEXT CHECK (type IN ('listing_promo', 'instagram_reel', 'open_house', 'custom')),
//   thumbnail_url TEXT,
//   output_url TEXT,
//   prompt_used TEXT,
//   credits_used INTEGER DEFAULT 0,
//   is_public BOOLEAN DEFAULT false,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Notifications
// CREATE TABLE notifications (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   type TEXT CHECK (type IN ('credit_low', 'job_completed', 'payment_success', 'payment_failed', 'subscription_renewal', 'system')),
//   title TEXT NOT NULL,
//   message TEXT NOT NULL,
//   read BOOLEAN DEFAULT false,
//   action_url TEXT,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- AI Jobs (for tracking Replicate and other AI service usage)
// CREATE TABLE ai_jobs (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES users(id),
//   project_id UUID REFERENCES projects(id),
//   service TEXT NOT NULL,
//   model TEXT NOT NULL,
//   input JSONB DEFAULT '{}',
//   status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
//   output_url TEXT,
//   error_message TEXT,
//   credit_cost INTEGER DEFAULT 0,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   completed_at TIMESTAMP WITH TIME ZONE
// );
