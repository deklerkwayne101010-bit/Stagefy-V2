'use client'

import React, { useState, useEffect } from 'react'

interface AiTemplatesFirstVisitPopupProps {
  isOpen: boolean
  onClose: () => void
  onDontShowAgain: () => void
  onProceed: () => void
}

export function AiTemplatesFirstVisitPopup({ isOpen, onClose, onDontShowAgain, onProceed }: AiTemplatesFirstVisitPopupProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('aiTemplatesPopupDismissed')
    if (dismissed === 'true') {
      onDontShowAgain()
    }
  }, [onDontShowAgain])

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('aiTemplatesPopupDismissed', 'true')
    }
    onProceed()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to AI Templates!
            </h3>
            <p className="text-gray-600 text-sm">
              Create stunning marketing materials with AI
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 Pro Tip:</p>
            <p className="text-sm text-blue-700">
              Upload your agent profile to automatically include your name, photo, contact details, and agency logo in templates.
            </p>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded mt-0.5"
            />
            <label htmlFor="dontShowAgain" className="text-sm text-gray-600 cursor-pointer">
              Don&apos;t show this again
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}