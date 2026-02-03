// Billing & Credits page
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditBadge } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'

const plans = [
  { id: 'free', name: 'Free', price: 0, credits: 50, description: 'Try it out', features: ['50 credits', 'Basic editing', 'Standard support'] },
  { id: 'basic', name: 'Basic', price: 29, credits: 200, description: 'For growing agents', features: ['200 credits/month', 'All AI features', 'Priority support', 'CRM access'] },
  { id: 'pro', name: 'Pro', price: 79, credits: 500, description: 'For busy professionals', features: ['500 credits/month', 'All AI features', 'Priority support', 'CRM + Analytics', 'Team sharing'] },
  { id: 'enterprise', name: 'Enterprise', price: 199, credits: 1500, description: 'For teams', features: ['1,500 credits/month', 'All AI features', 'Dedicated support', 'CRM + Analytics', 'Team sharing', 'API access'] },
]

const creditPacks = [
  { credits: 50, price: 9.99, popular: false },
  { credits: 100, price: 17.99, popular: false },
  { credits: 250, price: 39.99, popular: true },
  { credits: 500, price: 69.99, popular: false },
]

const transactions = [
  { id: 1, date: '2024-01-15', description: 'Pro Plan - Monthly', amount: -79, type: 'subscription' },
  { id: 2, date: '2024-01-14', description: 'Photo Edit - 123 Main St', amount: -2, type: 'usage' },
  { id: 3, date: '2024-01-13', description: 'Video Create - Listing Promo', amount: -8, type: 'usage' },
  { id: 4, date: '2024-01-12', description: 'Credit Pack - 250 credits', amount: +250, type: 'purchase' },
  { id: 5, date: '2024-01-10', description: 'Pro Plan - Monthly', amount: -79, type: 'subscription' },
]

export default function BillingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'history'>('overview')
  const [currentPlan, setCurrentPlan] = useState('pro')

  return (
    <div>
      <Header title="Billing & Credits" subtitle="Manage your subscription and credits" />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['overview', 'plans', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Plan */}
            <Card className="lg:col-span-2">
              <CardHeader title="Current Plan" subtitle="Your active subscription" />
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-2xl font-bold text-gray-900">Pro Plan</p>
                  <p className="text-gray-600">$79/month • Renews Feb 15, 2024</p>
                </div>
                <Button variant="outline">Change Plan</Button>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">This month&apos;s usage</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">156</p>
                    <p className="text-sm text-gray-500">Credits used</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">344</p>
                    <p className="text-sm text-gray-500">Credits remaining</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">500</p>
                    <p className="text-sm text-gray-500">Monthly allocation</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Buy */}
            <Card>
              <CardHeader title="Quick Buy Credits" subtitle="Top up anytime" />
              <div className="space-y-3">
                {creditPacks.map((pack) => (
                  <button
                    key={pack.credits}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      pack.popular
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{pack.credits} credits</p>
                        <p className="text-sm text-gray-500">${pack.price}</p>
                      </div>
                      {pack.popular && <Badge variant="info" size="sm">Popular</Badge>}
                    </div>
                  </button>
                ))}
                <Button fullWidth>Buy Credits</Button>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-3">
              <CardHeader title="Recent Transactions" action={<Button size="sm" variant="ghost">View All</Button>} />
              <div className="divide-y divide-gray-200">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">{tx.date}</p>
                    </div>
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${currentPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                {currentPlan === plan.id && (
                  <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">Current</Badge>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="mt-2">
                    <CreditBadge credits={plan.credits} />
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onClick={() => setCurrentPlan(plan.id)}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{tx.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.description}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={tx.type === 'purchase' ? 'success' : tx.type === 'subscription' ? 'info' : 'warning'}
                          size="sm"
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold text-right ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
