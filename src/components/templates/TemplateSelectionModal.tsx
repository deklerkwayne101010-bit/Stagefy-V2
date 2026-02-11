// TemplateSelectionModal Component
// Phase 1: Foundation

'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/types'

interface TemplateSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (category: TemplateCategory) => void
  onGenerateLayout: (category: TemplateCategory) => void
}

export function TemplateSelectionModal({
  isOpen,
  onClose,
  onSelect,
  onGenerateLayout,
}: TemplateSelectionModalProps) {
  if (!isOpen) return null

  const handleSelect = (category: TemplateCategory) => {
    onSelect(category)
    onClose()
  }

  const handleGenerateLayout = (category: TemplateCategory) => {
    onGenerateLayout(category)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Professional Templates
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose a template category to get started
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATE_CATEGORIES.map((category) => (
                <Card 
                  key={category.value} 
                  hover 
                  className="cursor-pointer group transition-all duration-200 hover:shadow-lg hover:border-blue-300"
                >
                  <div 
                    className="p-6 text-center"
                    onClick={() => handleSelect(category.value)}
                  >
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                      <span className="text-3xl">{category.icon}</span>
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {category.label}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-4">
                      {category.description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect(category.value)
                        }}
                      >
                        Select
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateLayout(category.value)
                        }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Layout
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">AI-Powered Layout Generation</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Use the AI Layout button to generate a unique, professionally designed template 
                    layout using our advanced AI model. The AI will create a custom prompt and 
                    layout structure based on your chosen category.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo usage example:
/*
import { useState } from 'react'
import { TemplateSelectionModal } from '@/components/templates/TemplateSelectionModal'
import { TEMPLATE_CATEGORIES } from '@/lib/types'

function Example() {
  const [showModal, setShowModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleSelect = (category: string) => {
    setSelectedCategory(category)
    // Proceed with selected template
  }

  const handleGenerateLayout = (category: string) => {
    // Trigger AI layout generation workflow
    console.log('Generate AI layout for:', category)
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        Choose Template
      </Button>

      <TemplateSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleSelect}
        onGenerateLayout={handleGenerateLayout}
      />
    </>
  )
}
*/
