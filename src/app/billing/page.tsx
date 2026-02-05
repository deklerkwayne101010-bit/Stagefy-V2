// Premium Billing & Credits page
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditBadge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/payfast'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'purchase' | 'subscription' | 'usage' | 'refund'
}

export default function BillingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'history' | 'help'>('overview')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>(user?.subscription_tier || 'free')
  const [subscriptionId, setSubscriptionId] = useState<string>('')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')

  // Fetch transactions and subscription on mount
  useEffect(() => {
    if (user?.id) {
      fetchTransactions()
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await (supabase.from as any)('subscriptions')
        .select('id, status')
        .eq('user_id', user?.id)
        .in('status', ['active', 'cancelled'])
        .order('created_at', { ascending: false })
        .single()
      
      if (data) {
        setSubscriptionId(data.id)
        setSubscriptionStatus(data.status)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const { getCreditHistory } = await import('@/lib/credits')
      const { data } = await getCreditHistory(user?.id || '')
      
      // Transform transactions for display
      const formatted: Transaction[] = (data || []).map((tx: any) => ({
        id: tx.id,
        date: new Date(tx.created_at).toLocaleDateString(),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
      }))
      
      setTransactions(formatted)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }

  const handleBuyCredits = async (packageId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credits', packageId }),
      })
      
      const data = await response.json()
      
      if (data.paymentUrl) {
        // Redirect to PayFast
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Failed to initiate payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', planId }),
      })
      
      const data = await response.json()
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Failed to initiate subscription')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to AI features at the end of your billing period.')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubscriptionStatus('cancelled')
        alert('Your subscription has been cancelled. You will retain access until the end of your billing period.')
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const plan = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS] || {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyCredits: 50,
    features: ['50 one-time credits', 'Basic editing', 'Standard support'],
    description: 'Try it out',
  } as typeof SUBSCRIPTION_PLANS.basic
  const monthlyCredits = plan.monthlyCredits
  const creditsUsed = 156 // This would come from the API
  const creditsRemaining = user?.credits || 0

  return (
    <div>
      <Header title="Billing & Credits" subtitle="Manage your subscription and credits" />

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {['overview', 'plans', 'history', 'help'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'help' ? 'Help & FAQ' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Plan */}
            <Card className="lg:col-span-2">
              <CardHeader title="Current Plan" subtitle="Your active subscription" />
              <div className="flex items-center justify-between p-5 bg-blue-50 rounded-2xl">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{plan.name} Plan</p>
                  <p className="text-slate-600">R{plan.price}/month</p>
                  {subscriptionStatus === 'cancelled' && (
                    <Badge variant="warning" className="mt-2">Cancelled</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {subscriptionStatus === 'active' && (
                    <Button variant="outline" onClick={handleCancelSubscription} loading={loading}>
                      Cancel Subscription
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setActiveTab('plans')}>
                    {subscriptionStatus === 'cancelled' ? 'Resubscribe' : 'Change Plan'}
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-slate-400 mb-3">This month&apos;s usage</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-slate-50 rounded-xl">
                    <p className="text-3xl font-bold text-slate-900">{creditsUsed}</p>
                    <p className="text-sm text-slate-400 mt-1">Credits used</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-xl">
                    <p className="text-3xl font-bold text-slate-900">{creditsRemaining}</p>
                    <p className="text-sm text-slate-400 mt-1">Credits remaining</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-xl">
                    <p className="text-3xl font-bold text-slate-900">{monthlyCredits}</p>
                    <p className="text-sm text-slate-400 mt-1">Monthly allocation</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Buy */}
            <Card>
              <CardHeader title="Quick Buy Credits" subtitle="Top up anytime" />
              <div className="space-y-3">
                {CREDIT_PACKAGES.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyCredits(pack.id)}
                    disabled={loading}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      pack.id === '250_credits'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-100 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{pack.credits} credits</p>
                        <p className="text-sm text-slate-400">R{pack.price}</p>
                      </div>
                      {pack.id === '250_credits' && <Badge variant="info" size="sm">Popular</Badge>}
                    </div>
                  </button>
                ))}
                <Button 
                  fullWidth 
                  onClick={() => handleBuyCredits(CREDIT_PACKAGES[0].id)}
                  loading={loading}
                >
                  Buy Credits
                </Button>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-3">
              <CardHeader title="Recent Transactions" action={
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('history')}>
                  View All
                </Button>
              } />
              {transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400">No transactions yet</p>
                  <p className="text-sm text-slate-400 mt-1">Your credit purchases and usage will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-slate-900">{tx.description}</p>
                        <p className="text-sm text-slate-400">{tx.date}</p>
                      </div>
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${currentPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
                hover={currentPlan !== plan.id}
              >
                {currentPlan === plan.id && (
                  <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">Current</Badge>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-slate-900">R{plan.price}</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <div className="mt-3">
                    <CreditBadge credits={plan.monthlyCredits} />
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  fullWidth 
                  className="mt-6"
                  variant={currentPlan === plan.id ? 'secondary' : 'primary'}
                  onClick={() => handleSelectPlan(plan.id)}
                  loading={loading}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader title="Payment History" subtitle="All your transactions" />
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Description</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Type</th>
                      <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 text-sm text-slate-900">{tx.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{tx.description}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={tx.type === 'purchase' ? 'success' : tx.type === 'subscription' ? 'info' : tx.type === 'refund' ? 'warning' : 'default'}
                            size="sm"
                          >
                            {tx.type}
                          </Badge>
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold text-right ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'help' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How Credits Work */}
            <Card>
              <CardHeader title="How Credits Work" subtitle="Understanding your credit system" />
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">What are credits?</h4>
                  <p className="text-slate-600 text-sm">
                    Credits are our currency for using AI features. Each action like photo editing, 
                    image to video conversion, or template generation costs a certain number of credits.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Getting credits</h4>
                  <p className="text-slate-600 text-sm">
                    You get credits by purchasing credit packages or subscribing to a monthly plan. 
                    Subscriptions give you credits every month automatically.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Credits never expire</h4>
                  <p className="text-slate-600 text-sm">
                    Your purchased credits stay in your account until you use them. They do not expire.
                  </p>
                </div>
              </div>
            </Card>

            {/* Credit Costs */}
            <Card>
              <CardHeader title="Credit Costs" subtitle="What each action costs" />
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Photo Editing</p>
                    <p className="text-sm text-slate-400">Enhance and edit your listing photos</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">1 credit</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Image to Video (3 seconds)</p>
                    <p className="text-sm text-slate-400">Turn photos into short videos</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">5 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Image to Video (5 seconds)</p>
                    <p className="text-sm text-slate-400">Create longer video clips</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">8 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Image to Video (10 seconds)</p>
                    <p className="text-sm text-slate-400">Create full-length video clips</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">15 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Template Generation</p>
                    <p className="text-sm text-slate-400">Create marketing templates with AI</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">3 credits</span>
                </div>
              </div>
            </Card>

            {/* Free Usage */}
            <Card>
              <CardHeader title="Free Usage" subtitle="Try before you buy" />
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">3 Free Actions</h4>
                  <p className="text-slate-600 text-sm">
                    Every new account gets 3 free AI actions to try out our features. This lets you 
                    test photo editing, video creation, and templates before purchasing credits.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">What happens after free usage?</h4>
                  <p className="text-slate-600 text-sm">
                    Once you use your 3 free actions, you&apos;ll need to purchase credits or subscribe 
                    to continue using AI features. Free actions do not renew monthly.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Watermarks</h4>
                  <p className="text-slate-600 text-sm">
                    Free tier outputs include a Stagefy watermark. Subscribers and credit purchasers 
                    get watermark-free downloads.
                  </p>
                </div>
              </div>
            </Card>

            {/* Subscriptions */}
            <Card>
              <CardHeader title="Subscriptions" subtitle="Monthly plans explained" />
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Monthly credits</h4>
                  <p className="text-slate-600 text-sm">
                    Subscriptions give you a set number of credits every month. Unused credits roll 
                    over to the next month. You can always buy extra credits if you run out.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Cancel anytime</h4>
                  <p className="text-slate-600 text-sm">
                    You can cancel your subscription at any time. You&apos;ll keep access until the end 
                    of your current billing period.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Switching plans</h4>
                  <p className="text-slate-600 text-sm">
                    Upgrade or downgrade your plan anytime. Changes take effect on your next billing cycle.
                  </p>
                </div>
              </div>
            </Card>

            {/* Contact */}
            <Card className="lg:col-span-2">
              <CardHeader title="Need Help?" subtitle="Get in touch with our team" />
              <div className="flex flex-col md:flex-row gap-6 mt-4">
                <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-slate-900">Email Support</h4>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">
                    Have questions about billing, credits, or your account? Our team is here to help.
                  </p>
                  <a 
                    href="mailto:support@stagefy.com" 
                    className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
                  >
                    support@stagefy.com
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
                <div className="flex-1 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-slate-900">Response Time</h4>
                  </div>
                  <p className="text-slate-600 text-sm">
                    We typically respond to all inquiries within 24-48 hours on business days.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
