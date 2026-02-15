// Dashboard Stats API Endpoint
// Fetches real user statistics for the dashboard
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase, getAdminClient } from '@/lib/supabase'

// Check if running in demo mode
const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface DashboardStats {
  credits: number
  subscriptionTier: string
  photosEdited: number
  videosCreated: number
  templatesUsed: number
  descriptionsGenerated: number
  creditsUsedThisMonth: number
  creditsUsedTotal: number
  recentProjects: Array<{
    id: string
    name: string
    type: 'photo_edit' | 'video' | 'template' | 'description'
    status: 'completed' | 'processing' | 'failed'
    created_at: string
  }>
  crmStats: {
    contacts: number
    listings: number
    activeTasks: number
  }
}

export async function GET() {
  try {
    // Get current user
    let user: any = null
    
    if (!isDemoMode) {
      try {
        user = await getCurrentUser()
      } catch (err) {
        console.error('Error getting user:', err)
      }
    }

    // If no user, return empty stats
    if (!user?.id) {
      return NextResponse.json(getEmptyStats())
    }

    // Get the appropriate client
    const client = getAdminClient() || supabase

    // Fetch all stats in parallel
    const [
      userProfile,
      creditTransactions,
      contactsCount,
      listingsCount,
      tasksCount
    ] = await Promise.all([
      // Get user profile for credits and subscription
      (client.from as any)('users')
        .select('credits, subscription_tier')
        .eq('id', user.id)
        .maybeSingle(),

      // Get all credit transactions for this user
      (client.from as any)('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),

      // Get contacts count
      (client.from as any)('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Get listings count
      (client.from as any)('crm_listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Get active tasks count
      (client.from as any)('crm_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending'),
    ])

    // Calculate stats from credit transactions
    const transactions = creditTransactions.data || []
    
    // Get current month's start date
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Calculate usage counts by type
    const photosEdited = transactions.filter((tx: any) => 
      tx.type === 'usage' && 
      (tx.description?.toLowerCase().includes('photo') || tx.reference_id?.startsWith('photo'))
    ).length

    const videosCreated = transactions.filter((tx: any) => 
      tx.type === 'usage' && 
      (tx.description?.toLowerCase().includes('video') || tx.reference_id?.startsWith('video'))
    ).length

    const templatesUsed = transactions.filter((tx: any) => 
      tx.type === 'usage' && 
      (tx.description?.toLowerCase().includes('template') || tx.reference_id?.startsWith('template') || tx.reference_id?.startsWith('layout'))
    ).length

    const descriptionsGenerated = transactions.filter((tx: any) => 
      tx.type === 'usage' && 
      (tx.description?.toLowerCase().includes('description') || tx.reference_id?.startsWith('desc'))
    ).length

    // Calculate credits used
    const creditsUsedThisMonth = transactions
      .filter((tx: any) => 
        tx.type === 'usage' && 
        new Date(tx.created_at) >= monthStart
      )
      .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

    const creditsUsedTotal = transactions
      .filter((tx: any) => tx.type === 'usage')
      .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

    // Build recent projects from transactions
    const recentProjects = transactions
      .filter((tx: any) => tx.type === 'usage')
      .slice(0, 5)
      .map((tx: any) => {
        let type: 'photo_edit' | 'video' | 'template' | 'description' = 'photo_edit'
        let name = tx.description || 'Project'

        if (tx.description?.toLowerCase().includes('video') || tx.reference_id?.startsWith('video')) {
          type = 'video'
          name = 'Video Creation'
        } else if (tx.description?.toLowerCase().includes('template') || tx.reference_id?.startsWith('template') || tx.reference_id?.startsWith('layout')) {
          type = 'template'
          name = 'Template Generation'
        } else if (tx.description?.toLowerCase().includes('description') || tx.reference_id?.startsWith('desc')) {
          type = 'description'
          name = 'Description Generated'
        } else {
          name = 'Photo Edit'
        }

        return {
          id: tx.id,
          name,
          type,
          status: 'completed' as const,
          created_at: tx.created_at,
        }
      })

    // Build response
    const stats: DashboardStats = {
      credits: userProfile?.data?.credits || 0,
      subscriptionTier: userProfile?.data?.subscription_tier || 'free',
      photosEdited,
      videosCreated,
      templatesUsed,
      descriptionsGenerated,
      creditsUsedThisMonth,
      creditsUsedTotal,
      recentProjects,
      crmStats: {
        contacts: contactsCount.count || 0,
        listings: listingsCount.count || 0,
        activeTasks: tasksCount.count || 0,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(getEmptyStats())
  }
}

// Helper function to return empty stats
function getEmptyStats(): DashboardStats {
  return {
    credits: 0,
    subscriptionTier: 'free',
    photosEdited: 0,
    videosCreated: 0,
    templatesUsed: 0,
    descriptionsGenerated: 0,
    creditsUsedThisMonth: 0,
    creditsUsedTotal: 0,
    recentProjects: [],
    crmStats: {
      contacts: 0,
      listings: 0,
      activeTasks: 0,
    },
  }
}
