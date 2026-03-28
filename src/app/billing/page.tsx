// Billing & Credits page - One-time purchases only
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditBadge, Badge } from '@/components/ui/Badge'
import { CREDIT_PACKAGES } from '@/lib/payfast'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'purchase' | 'subscription' | 'usage' | 'refund'
}

interface MonthlyStats {
  creditsUsed: number
  creditsPurchased: number
}

export default function BillingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'help'>('overview')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ creditsUsed: 0, creditsPurchased: 0 })

  // Fetch transactions and monthly stats on mount
  const fetchData = useCallback(async () => {
    if (!user?.id) return

    try {
      const { getCreditHistory } = await import('@/lib/credits')
      const { data } = await getCreditHistory(user.id, 100)

      // Format all transactions for display
      const formatted: Transaction[] = (data || []).map((tx: any) => ({
        id: tx.id,
        date: new Date(tx.created_at).toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
      }))

      setTransactions(formatted)

      // Calculate this month's stats
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const thisMonthTx = (data || []).filter((tx: any) => tx.created_at >= startOfMonth)

      const creditsUsed = Math.abs(
        thisMonthTx
          .filter((tx: any) => tx.type === 'usage')
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0)
      )

      const creditsPurchased = thisMonthTx
        .filter((tx: any) => tx.type === 'purchase')
        .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0)

      setMonthlyStats({ creditsUsed, creditsPurchased })
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const creditsRemaining = user?.credits || 0

  return (
    <div>
      <Header title="Billing & Credits" subtitle="Manage your credits and view transactions" />

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {['overview', 'history', 'help'].map((tab) => (
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
            {/* Credit Balance & This Month's Usage */}
            <Card className="lg:col-span-2">
              <CardHeader title="Your Credits" subtitle="This month's usage" />
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-blue-50 rounded-xl">
                    <p className="text-3xl font-bold text-blue-600">{creditsRemaining}</p>
                    <p className="text-sm text-slate-500 mt-1">Credits Balance</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-xl">
                    <p className="text-3xl font-bold text-slate-900">{monthlyStats.creditsUsed}</p>
                    <p className="text-sm text-slate-400 mt-1">Used this month</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-xl">
                    <p className="text-3xl font-bold text-emerald-600">{monthlyStats.creditsPurchased}</p>
                    <p className="text-sm text-slate-400 mt-1">Purchased this month</p>
                  </div>
                </div>
                {/* Usage bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Monthly usage</span>
                    <span className="text-slate-700 font-medium">{monthlyStats.creditsUsed} credits used</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (monthlyStats.creditsUsed / Math.max(creditsRemaining + monthlyStats.creditsUsed, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Buy */}
            <Card>
              <CardHeader title="Buy Credits" subtitle="One-time purchases" />
              <div className="space-y-3">
                {CREDIT_PACKAGES.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyCredits(pack.id)}
                    disabled={loading}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      pack.badge === 'Most Popular'
                        ? 'border-blue-500 bg-blue-50'
                        : pack.badge === 'Best Value'
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-100 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{pack.credits} credits</p>
                          {pack.badge && (
                            <Badge variant={pack.badge === 'Most Popular' ? 'info' : 'success'} size="sm">
                              {pack.badge === 'Most Popular' ? '⭐' : '🔥'} {pack.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          R{pack.price} &middot; R{(pack.price / pack.credits).toFixed(2)}/credit
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-3">
              <CardHeader
                title="Recent Transactions"
                action={
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('history')}>
                    View All
                  </Button>
                }
              />
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
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader title="Transaction History" subtitle="All your credit activity" />
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
                            variant={
                              tx.type === 'purchase'
                                ? 'success'
                                : tx.type === 'usage'
                                ? 'warning'
                                : tx.type === 'refund'
                                ? 'info'
                                : 'default'
                            }
                            size="sm"
                          >
                            {tx.type}
                          </Badge>
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-semibold text-right ${
                            tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
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
              <CardHeader title="How Credits Work" subtitle="Understanding your credits" />
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">What are credits?</h4>
                  <p className="text-slate-600 text-sm">
                    Credits are used for AI features like photo editing, video generation,
                    and template creation. Each action costs a set number of credits.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Buying credits</h4>
                  <p className="text-slate-600 text-sm">
                    Buy credit packages anytime — the more you buy, the more you save.
                    Credits are added to your account immediately after payment.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Credits never expire</h4>
                  <p className="text-slate-600 text-sm">
                    Your purchased credits stay in your account until you use them.
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
                    <p className="font-medium text-slate-900">Image to Video (3s)</p>
                    <p className="text-sm text-slate-400">Turn photos into short videos</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">3 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Image to Video (5s)</p>
                    <p className="text-sm text-slate-400">Create longer video clips</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">5 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Image to Video (10s)</p>
                    <p className="text-sm text-slate-400">Create full-length video clips</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">15 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Template Generation</p>
                    <p className="text-sm text-slate-400">Create marketing templates with AI</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">3-5 credits</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Description Generator</p>
                    <p className="text-sm text-slate-400">AI-written property descriptions</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">1 credit</span>
                </div>
              </div>
            </Card>

            {/* Free Usage */}
            <Card>
              <CardHeader title="Free Usage" subtitle="Try before you buy" />
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">10 Free Credits</h4>
                  <p className="text-slate-600 text-sm">
                    Every new account gets 10 free credits to try out our features.
                    Test photo editing, video creation, and templates before purchasing more.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">Watermarks</h4>
                  <p className="text-slate-600 text-sm">
                    Free tier outputs include a Stagefy watermark. Credit purchasers
                    get watermark-free downloads.
                  </p>
                </div>
              </div>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader title="Need Help?" subtitle="Get in touch" />
              <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-900">Email Support</h4>
                </div>
                <p className="text-slate-600 text-sm mb-3">
                  Have questions about credits or your account? Our team is here to help.
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
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
