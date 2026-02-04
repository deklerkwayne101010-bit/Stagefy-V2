// Demo users for testing without Supabase connection
import { type User } from './types'

// Demo users - hardcoded for testing
export const demoUsers: User[] = [
  {
    id: 'demo-user-1',
    email: 'demo@stagefy.com',
    full_name: 'Demo Agent',
    brokerage: 'Stagefy Realty',
    market: 'New York',
    use_case: 'all',
    role: 'agent',
    credits: 50,
    subscription_tier: 'free',
    free_usage_used: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-admin-1',
    email: 'admin@stagefy.com',
    full_name: 'Demo Admin',
    brokerage: 'Stagefy HQ',
    market: 'Global',
    use_case: 'all',
    role: 'admin',
    credits: 9999,
    subscription_tier: 'enterprise',
    free_usage_used: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Demo mode flag
export const isDemoMode = () => {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || 
         !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_URL === ''
}

// Find demo user by email
export const findDemoUser = (email: string): User | undefined => {
  return demoUsers.find(user => user.email.toLowerCase() === email.toLowerCase())
}
