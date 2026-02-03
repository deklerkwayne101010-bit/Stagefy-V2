// Premium Badge and Tag components
import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    danger: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
    info: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  }
  
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

interface TagProps {
  children: React.ReactNode
  onRemove?: () => void
}

export function Tag({ children, onRemove }: TagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] text-sm rounded-lg">
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

interface CreditBadgeProps {
  credits: number
  size?: 'sm' | 'md' | 'lg'
}

export function CreditBadge({ credits, size = 'md' }: CreditBadgeProps) {
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold rounded-full ${sizes[size]}`}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.476-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.074.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.583V10a1 1 0 012 0v.395c.09.218.16.45.264.583z" />
      </svg>
      {credits.toLocaleString()} credits
    </span>
  )
}
