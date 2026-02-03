// Premium Card component
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const hoverClass = hover 
    ? 'hover:shadow-lg hover:border-[var(--color-primary-light)] cursor-pointer transition-all duration-300' 
    : ''
  
  return (
    <div
      className={`
        bg-[var(--color-surface)] 
        rounded-2xl 
        border border-[var(--color-border-light)]
        shadow-sm
        ${paddingClasses[padding]} 
        ${hoverClass} 
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {subtitle && <p className="text-base text-[var(--color-text-muted)] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
