// Credit management service for Stagefy
import { supabase, getAdminClient } from './supabase'
import { CREDIT_COSTS, type CreditOperation, type User } from './types'

// Credit costs per operation (matches database schema)
export { CREDIT_COSTS }
export type { CreditOperation }

// Check user's available credits
export async function checkUserCredits(userId: string): Promise<number> {
  const { data: user, error } = await (supabase.from as any)('users')
    .select('credits')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user credits:', error, 'UserId:', userId)
    return 0
  }

  // User not found - return 0 credits
  if (!user) {
    console.warn('User not found in database:', userId)
    return 0
  }

  console.log('User credits:', userId, 'credits:', user.credits)
  return (user as User).credits || 0
}

// Check if user can perform an AI action (based solely on credit balance)
export async function canPerformAction(userId: string, creditCost: number): Promise<{
  canPerform: boolean
  reason: 'credits' | 'none'
  remaining?: number
  error?: string
}> {
  console.log('canPerformAction called:', { userId, creditCost })
  
  // Check regular credits
  const credits = await checkUserCredits(userId)
  console.log('User credits check:', { userId, credits, creditCost, canPerform: credits >= creditCost })
  
  if (credits >= creditCost) {
    return {
      canPerform: true,
      reason: 'credits',
      remaining: credits,
    }
  }

  // Not enough credits
  return {
    canPerform: false,
    reason: 'none',
    error: 'Insufficient credits. Please purchase more credits to continue.',
  }
}

// Reserve credits for an operation (checks and holds credits)
export async function reserveCredits(
  userId: string,
  operation: CreditOperation,
  projectId: string
): Promise<{ success: boolean; error?: string; creditsReserved?: number }> {
  const creditCost = CREDIT_COSTS[operation]
  
  // Check current balance
  const currentCredits = await checkUserCredits(userId)
  
  if (currentCredits < creditCost) {
    return { 
      success: false, 
      error: `Insufficient credits. Need ${creditCost}, have ${currentCredits}` 
    }
  }

  // Log the reservation
  const { error: logError } = await (supabase.from as any)('credit_transactions')
    .insert({
      user_id: userId,
      amount: -creditCost,
      type: 'usage',
      description: `Reserved for ${operation}`,
      reference_id: projectId,
    })

  if (logError) {
    console.error('Error logging credit reservation:', logError)
    return { success: false, error: 'Failed to reserve credits' }
  }

  // Deduct credits from user balance
  const { error: updateError } = await (supabase.from as any)('users')
    .update({ credits: currentCredits - creditCost })
    .eq('id', userId)

  if (updateError) {
    // Rollback the transaction log
    await (supabase.from as any)('credit_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('reference_id', projectId)
    
    return { success: false, error: 'Failed to deduct credits' }
  }

  return { success: true, creditsReserved: creditCost }
}

// Refund credits if operation fails
export async function refundCredits(
  userId: string,
  operation: CreditOperation,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const creditCost = CREDIT_COSTS[operation]
  const currentCredits = await checkUserCredits(userId)

  // Log the refund
  const { error: logError } = await (supabase.from as any)('credit_transactions')
    .insert({
      user_id: userId,
      amount: creditCost,
      type: 'refund',
      description: `Refund for failed ${operation}`,
      reference_id: projectId,
    })

  if (logError) {
    console.error('Error logging credit refund:', logError)
    return { success: false, error: 'Failed to log refund' }
  }

  // Restore credits to user balance
  const { error: updateError } = await (supabase.from as any)('users')
    .update({ credits: currentCredits + creditCost })
    .eq('id', userId)

  if (updateError) {
    console.error('Error restoring credits:', updateError)
    return { success: false, error: 'Failed to restore credits' }
  }

  return { success: true }
}

// Finalize credit deduction (called on successful completion)
export async function finalizeCreditDeduction(
  userId: string,
  operation: CreditOperation,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  // In this implementation, we deduct immediately on reservation
  // This method can be used for audit purposes
  return { success: true }
}

// Add credits to user account (purchase or subscription)
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'subscription',
  description: string,
  referenceId?: string
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const currentCredits = await checkUserCredits(userId)
  const newBalance = currentCredits + amount

  // Log the credit addition
  const { error: logError } = await (supabase.from as any)('credit_transactions')
    .insert({
      user_id: userId,
      amount: amount,
      type: type,
      description: description,
      reference_id: referenceId,
    })

  if (logError) {
    console.error('Error logging credit addition:', logError)
    return { success: false, error: 'Failed to add credits' }
  }

  // Update user balance
  const { error: updateError } = await (supabase.from as any)('users')
    .update({ credits: newBalance })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating credits:', updateError)
    return { success: false, error: 'Failed to update balance' }
  }

  return { success: true, newBalance }
}

// Get credit transaction history for a user
export async function getCreditHistory(
  userId: string,
  limit = 50
): Promise<{ data: any[]; error: any }> {
  const { data, error } = await (supabase.from as any)('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

// Get usage report for admin
export async function getCreditUsageReport(
  startDate?: Date,
  endDate?: Date
): Promise<{ data: any[]; error: any }> {
  let query = (supabase.from as any)('credit_transactions')
    .select(`
      *,
      users:user_id (email, full_name)
    `)
    .eq('type', 'usage')

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return { data: data || [], error }
}

// Get total credits used by user
export async function getTotalCreditsUsed(userId: string): Promise<number> {
  const { data, error } = await (supabase.from as any)('credit_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'usage')

  if (error || !data) return 0

  // Sum up all negative amounts (usage)
  return Math.abs(data.reduce((sum: number, tx: { amount: number }) => sum + (tx.amount || 0), 0))
}

// Grant monthly subscription credits (called by cron job or webhook)
export async function grantMonthlyCredits(
  userId: string,
  credits: number,
  planName: string
): Promise<{ success: boolean; error?: string }> {
  const currentCredits = await checkUserCredits(userId)
  const newBalance = currentCredits + credits

  // Log the credit addition
  const { error: logError } = await (supabase.from as any)('credit_transactions')
    .insert({
      user_id: userId,
      amount: credits,
      type: 'subscription',
      description: `Monthly credits for ${planName} plan`,
    })

  if (logError) {
    console.error('Error logging monthly credits:', logError)
    return { success: false, error: 'Failed to log transaction' }
  }

  // Update user balance
  const { error: updateError } = await (supabase.from as any)('users')
    .update({ credits: newBalance })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating credits:', updateError)
    return { success: false, error: 'Failed to update balance' }
  }

  // Create notification
  await (supabase.from as any)('notifications')
    .insert({
      user_id: userId,
      type: 'subscription_renewal',
      title: 'Monthly Credits Added',
      message: `${credits} credits have been added to your account for your subscription renewal.`,
    })

  return { success: true }
}
