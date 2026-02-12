// LayoutGenerationPopup Component
// Phase 1: Foundation - Displays "Generate Layout" confirmation

'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/types'

interface LayoutGenerationPopupProps {
  isOpen: boolean
  template: {
    id: string
    name: string
    category: TemplateCategory
    icon: string
  } | null
  isGenerating: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LayoutGenerationPopup({
  isOpen,
  template,
  isGenerating,
  onConfirm,
  onCancel,
}: LayoutGenerationPopupProps) {
  if (!isOpen || !template) return null

  const categoryInfo = TEMPLATE_CATEGORIES.find(c => c.value === template.category)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">{categoryInfo?.icon || '✨'}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Generate Layout
                </h2>
                <p className="text-sm text-gray-500">
                  AI-powered layout creation
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Template Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-2xl">{categoryInfo?.icon}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">{categoryInfo?.label} template</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                This will generate a unique, professionally designed layout for your 
                <strong> {categoryInfo?.label}</strong> property listing template using AI.
              </p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">What happens next:</p>
                    <ul className="mt-1 space-y-1 text-blue-600">
                      <li>1. AI generates a custom layout prompt</li>
                      <li>2. Review and edit the generated prompt</li>
                      <li>3. Generate your final template</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Credit Info */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-600">Credit Cost</span>
                <span className="font-semibold text-gray-900">1 Credit</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              loading={isGenerating}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Layout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
