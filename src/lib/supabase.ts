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
let supabaseAuthWarned = false // Only log auth warnings once per session

function getSupabaseClient() {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false, // Don't auto-refresh on init - prevents _recoverAndRefresh timeout cascade
        persistSession: true,    // Still save session to localStorage
        detectSessionInUrl: false, // Don't parse URL for auth tokens on every page load
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
    resetPasswordEmail: async (email: string, options?: { redirectTo?: string }) => {
      const client = getSupabaseClient()
      if (!client) return { error: new Error('Supabase not configured') }
      return client.auth.resetPasswordForEmail(email, options)
    },
    updateUser: async (attributes: { password?: string }) => {
      const client = getSupabaseClient()
      if (!client) return { data: { user: null }, error: new Error('Supabase not configured') }
      return client.auth.updateUser(attributes)
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
  limit: number = 10
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

// Helper to race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

// Read the Supabase session directly from localStorage (no network call)
// This is the fastest way to get the session when auth server is slow/unreachable
function getSessionFromStorage(): { user: any } | null {
  try {
    if (typeof window === 'undefined') return null

    // Supabase JS v2 stores session under multiple possible key formats
    // Try to find it by scanning localStorage for auth tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      // Match keys like: sb-<ref>-auth-token, sb-<project>-auth-token, or supabase.auth.token
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed?.user?.id) {
              return { user: parsed.user }
            }
          }
        } catch {
          // Try next key
        }
      }
    }

    // Fallback: try the old Supabase v1 key format
    const legacyKey = localStorage.getItem('supabase.auth.token')
    if (legacyKey) {
      try {
        const parsed = JSON.parse(legacyKey)
        if (parsed?.user?.id) {
          return { user: parsed.user }
        }
      } catch {
        // ignore
      }
    }

    // Fallback: try direct access with known URL pattern
    if (supabaseUrl) {
      const ref = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1]
      if (ref) {
        const key = `sb-${ref}-auth-token`
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed?.user?.id) {
              return { user: parsed.user }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// Helper function to check if user is authenticated
// Reads cached session from localStorage first (instant), then tries network as fallback
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

  // Step 1: Try reading session from localStorage first (instant, no network)
  // This avoids the common case where getSession() hangs trying to refresh a token
  let session = getSessionFromStorage()

  // Step 2: If no cached session, try the network-authenticated methods
  if (!session) {
    try {
      const { data } = await withTimeout(
        client.auth.getSession(),
        8000,
        'getSession'
      )
      session = data?.session as any
    } catch (sessionError: any) {
      if (!supabaseAuthWarned) {
        supabaseAuthWarned = true
        console.warn('Supabase auth server is slow or unreachable. Using cached session.')
      }
      try {
        const { data: userData } = await withTimeout(
          client.auth.getUser(),
          8000,
          'getUser'
        )
        if (userData?.user) {
          session = { user: userData.user } as any
        }
      } catch {
        // Both failed and no cached session - not logged in
        return null
      }
    }
  }

  if (!session?.user) {
    return null
  }

  const user = session.user

  // Check if we have a cached profile for this user (avoids network call entirely)
  // The cache is valid for 10 minutes to balance freshness vs performance
  const profileCacheKey = `stagefy-profile-${user.id}`
  try {
    const cachedProfile = localStorage.getItem(profileCacheKey)
    if (cachedProfile) {
      const { data: cachedUser, cachedAt } = JSON.parse(cachedProfile)
      if (cachedUser?.id && cachedAt && (Date.now() - cachedAt < 10 * 60 * 1000)) {
        return cachedUser as User
      }
    }
  } catch {
    // ignore cache errors
  }

  // Step 3: Try to fetch extended profile (with timeout)
  try {
    const profileQuery = client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data } = await withTimeout(
      new Promise<{ data: any; error: any }>((resolve, reject) => {
        profileQuery.then(resolve, reject)
      }),
      5000,
      'profile fetch'
    )

    if (data) {
      // Cache the profile for future loads
      try {
        localStorage.setItem(profileCacheKey, JSON.stringify({ data, cachedAt: Date.now() }))
      } catch {
        // localStorage full or unavailable - ignore
      }
      return data as User
    }
  } catch (profileError: any) {
    // Profile fetch timed out - try using stale cache as fallback
    try {
      const cachedProfile = localStorage.getItem(profileCacheKey)
      if (cachedProfile) {
        const { data: cachedUser } = JSON.parse(cachedProfile)
        if (cachedUser?.id) {
          console.log('Profile fetch timed out, using stale cached profile')
          return cachedUser as User
        }
      }
    } catch {
      // ignore
    }
    console.log('Profile fetch failed, using minimal auth data:', profileError?.message)
  }

  // Build minimal user data from auth session
  const minimalUser: User = {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || '',
    role: 'agent',
    credits: 10,
    subscription_tier: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Cache the minimal data too so we don't keep failing
  try {
    localStorage.setItem(profileCacheKey, JSON.stringify({ data: minimalUser, cachedAt: Date.now() }))
  } catch {
    // ignore
  }

  return minimalUser
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
//   credits INTEGER DEFAULT 10,
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
