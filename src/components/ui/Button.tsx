// Premium Button component
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    shadow-sm hover:shadow-md active:shadow-sm
  `
  
  const variants = {
    primary: `
      bg-[var(--color-primary)] text-white
      hover:bg-[var(--color-primary-hover)]
      focus:ring-[var(--color-primary)]
    `,
    secondary: `
      bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]
      hover:bg-[var(--color-border)]
      focus:ring-[var(--color-text-muted)]
    `,
    outline: `
      border-2 border-[var(--color-border)] text-[var(--color-text-secondary)]
      hover:bg-[var(--color-surface-tertiary)] hover:border-[var(--color-text-muted)]
      focus:ring-[var(--color-text-muted)]
    `,
    ghost: `
      text-[var(--color-text-secondary)]
      hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]
      focus:ring-[var(--color-text-muted)]
    `,
    danger: `
      bg-[var(--color-error)] text-white
      hover:bg-red-700
      focus:ring-[var(--color-error)]
    `,
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
