// Premium Input and form components
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export function Input({
  label,
  error,
  helper,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 
          bg-[var(--color-surface)] 
          border border-[var(--color-border)]
          rounded-xl
          text-[var(--color-text-primary)] 
          placeholder-[var(--color-text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
          transition-all duration-200
          ${error ? 'border-[var(--color-error)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>}
      {helper && !error && <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{helper}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

export function Textarea({
  label,
  error,
  helper,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 
          bg-[var(--color-surface)] 
          border border-[var(--color-border)]
          rounded-xl
          text-[var(--color-text-primary)] 
          placeholder-[var(--color-text-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
          transition-all duration-200 resize-none
          ${error ? 'border-[var(--color-error)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>}
      {helper && !error && <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{helper}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export function Select({
  label,
  error,
  options,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 
          bg-[var(--color-surface)] 
          border border-[var(--color-border)]
          rounded-xl
          text-[var(--color-text-primary)] 
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
          transition-all duration-200
          ${error ? 'border-[var(--color-error)]' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  )
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="
          w-5 h-5 
          text-[var(--color-primary)] 
          border-[var(--color-border)] 
          rounded-lg
          focus:ring-[var(--color-primary)]
          focus:ring-offset-2
        "
        {...props}
      />
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
    </label>
  )
}
