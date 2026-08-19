'use client'

import React, { useState } from 'react'

interface InfoTipProps {
  text: string
  label?: string
}

export function InfoTip({ text, label = '?' }: InfoTipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-500 hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={label}
      >
        {label}
      </button>
      {visible && (
        <span className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
          {text}
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-slate-200 bg-white" />
        </span>
      )}
    </span>
  )
}
