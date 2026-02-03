// Premium Header component
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { CreditBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Mock notifications for demo
  const notifications = [
    { id: 1, title: 'Photo edit completed', message: 'Your virtual staging is ready', time: '5m ago', read: false },
    { id: 2, title: 'Low credits warning', message: 'You have 5 credits remaining', time: '1h ago', read: false },
    { id: 3, title: 'Payment successful', message: 'Your subscription is active', time: '1d ago', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="bg-[var(--color-surface)] px-8 py-6">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          {title && <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>}
          {subtitle && <p className="text-base text-[var(--color-text-muted)] mt-1">{subtitle}</p>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Credit Balance */}
          {user && (
            <div className="hidden md:block">
              <CreditBadge credits={user.credits} />
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--color-error)] text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] rounded-2xl shadow-xl border border-[var(--color-border-light)] z-50">
                <div className="p-4 border-b border-[var(--color-border-light)]">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-tertiary)] cursor-pointer transition-colors',
                        !notification.read && 'bg-[var(--color-primary-light)]/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 mt-2.5 rounded-full',
                          notification.read ? 'bg-[var(--color-text-muted)]' : 'bg-[var(--color-primary)]'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{notification.title}</p>
                          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{notification.message}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[var(--color-border-light)]">
                  <button className="w-full text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-[var(--color-surface-tertiary)] rounded-xl transition-colors"
            >
              <div className="w-9 h-9 bg-[var(--color-surface-tertiary)] rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] rounded-2xl shadow-xl border border-[var(--color-border-light)] z-50">
                <div className="p-4 border-b border-[var(--color-border-light)]">
                  <p className="font-medium text-[var(--color-text-primary)]">{user?.full_name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{user?.email}</p>
                </div>
                <div className="p-2">
                  <a
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </a>
                  <a
                    href="/billing"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Billing & Credits
                  </a>
                  <hr className="my-2 border-[var(--color-border-light)]" />
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
