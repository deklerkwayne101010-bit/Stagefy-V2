// PromptReviewInterface Component
// Phase 1: Foundation - Review and edit AI-generated layout prompts

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface LayoutSection {
  id: string
  name: string
  description: string
  suggestedContent?: string
}

interface PromptReviewInterfaceProps {
  isOpen: boolean
  category: string
  generatedPrompt: string
  layoutStructure: LayoutSection[]
  onConfirm: (finalPrompt: string, layoutStructure: LayoutSection[]) => void
  onRegenerate: () => void
  onCancel: () => void
}

export function PromptReviewInterface({
  isOpen,
  category,
  generatedPrompt,
  layoutStructure,
  onConfirm,
  onRegenerate,
  onCancel,
}: PromptReviewInterfaceProps) {
  const [prompt, setPrompt] = useState(generatedPrompt)
  const [sections, setSections] = useState<LayoutSection[]>(layoutStructure)
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm(prompt, sections)
    } finally {
      setIsConfirming(false)
    }
  }

  const updateSection = (id: string, field: 'name' | 'description', value: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const addSection = () => {
    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      description: '',
    }
    setSections(prev => [...prev, newSection])
  }

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review & Edit Layout
              </h2>
              <p className="text-sm text-gray-500">
                Review the AI-generated layout and make adjustments
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* AI Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Layout Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full"
                placeholder="Enter or edit the prompt..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This prompt guides the AI in generating your template layout
              </p>
            </div>

            {/* Layout Structure */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Layout Sections
                </label>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Section
                </Button>
              </div>

              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div 
                    key={section.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Section {index + 1}
                      </span>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                        placeholder="Section name"
                        className="bg-white"
                      />
                      <Input
                        value={section.description}
                        onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                        placeholder="Section description"
                        className="bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {sections.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">No sections added yet</p>
                  <p className="text-sm text-gray-400">Click "Add Section" to create your layout structure</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Tips for better results:</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• Be specific about the sections you need</li>
                    <li>• Include any branding requirements in the prompt</li>
                    <li>• Specify the order of elements if important</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={onRegenerate}
              disabled={isConfirming}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                loading={isConfirming}
                disabled={isConfirming}
              >
                {isConfirming ? 'Saving...' : 'Confirm & Generate'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
