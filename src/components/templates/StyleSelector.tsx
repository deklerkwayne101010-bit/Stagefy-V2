'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ColorSet {
  name: string
  colors: string[]
}

interface StyleSelectorProps {
  selectedColors: string[]
  onSelectColors: (colors: string[]) => void
}

// Pre-built color schemes
export const colorSchemes: { name: string; colors: string[] }[] = [
  { name: 'Modern Blue', colors: ['#1e40af', '#3b82f6', '#60a5fa'] },
  { name: 'Elegant Navy', colors: ['#00102e', '#1e3a8a', '#3b82f6'] },
  { name: 'Luxury Gold', colors: ['#b45309', '#d97706', '#fbbf24'] },
  { name: 'Fresh Green', colors: ['#047857', '#10b981', '#34d399'] },
  { name: 'Bold Red', colors: ['#b91c1c', '#dc2626', '#f87171'] },
  { name: 'Royal Purple', colors: ['#581c87', '#7c3aed', '#a78bfa'] },
  { name: 'Modern Teal', colors: ['#0f766e', '#14b8a6', '#2dd4bf'] },
  { name: 'Warm Orange', colors: ['#c2410c', '#ea580c', '#fb923c'] },
  { name: 'Classic Black', colors: ['#000000', '#1f2937', '#4b5563'] },
  { name: 'Soft Pink', colors: ['#9f1239', '#e11d48', '#f43f5e'] },
]

const STORAGE_KEY = 'stagefy_custom_colors'

export function StyleSelector({ selectedColors, onSelectColors }: StyleSelectorProps) {
  const [selectedScheme, setSelectedScheme] = useState<string>('')
  const [customPrimary, setCustomPrimary] = useState('#000000')
  const [customSecondary, setCustomSecondary] = useState('#000000')
  const [customAccent, setCustomAccent] = useState('#000000')
  const [useCustomColors, setUseCustomColors] = useState(false)
  const [savedSets, setSavedSets] = useState<ColorSet[]>([])
  const [newSetName, setNewSetName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  // Load saved custom color sets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          setSavedSets(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse saved colors:', e)
        }
      }
    }
  }, [])

  // Save selected scheme to custom colors
  useEffect(() => {
    if (selectedScheme && !useCustomColors) {
      const scheme = colorSchemes.find(s => s.name === selectedScheme)
      if (scheme) {
        onSelectColors(scheme.colors)
      }
    }
  }, [selectedScheme, useCustomColors, onSelectColors])

  // Update custom colors
  useEffect(() => {
    if (useCustomColors) {
      onSelectColors([customPrimary, customSecondary, customAccent])
    }
  }, [customPrimary, customSecondary, customAccent, useCustomColors, onSelectColors])

  const saveCustomSet = () => {
    if (!newSetName.trim()) return
    
    const newSet: ColorSet = {
      name: newSetName.trim(),
      colors: [customPrimary, customSecondary, customAccent]
    }
    
    const updated = [...savedSets, newSet]
    setSavedSets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setNewSetName('')
    setShowSaveInput(false)
  }

  const loadSavedSet = (set: ColorSet) => {
    onSelectColors(set.colors)
    setCustomPrimary(set.colors[0])
    setCustomSecondary(set.colors[1] || set.colors[0])
    setCustomAccent(set.colors[2] || set.colors[0])
    setUseCustomColors(true)
    setSelectedScheme('')
  }

  const deleteSavedSet = (index: number) => {
    const updated = savedSets.filter((_, i) => i !== index)
    setSavedSets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <div className="space-y-6">
      {/* Use Custom Colors Toggle */}
      <div>
        <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
          <input
            type="checkbox"
            checked={useCustomColors}
            onChange={(e) => setUseCustomColors(e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <span className="font-medium text-gray-700">Use Custom Colors</span>
        </label>
      </div>

      {!useCustomColors ? (
        /* Pre-built Color Schemes */
        <div className="grid grid-cols-2 gap-3">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.name}
              onClick={() => {
                setSelectedScheme(scheme.name)
                onSelectColors(scheme.colors)
              }}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedScheme === scheme.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {scheme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900">{scheme.name}</span>
            </button>
          ))}
        </div>
      ) : (
        /* Custom Color Picker */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <Input
                placeholder="#000000"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customSecondary || customPrimary}
                onChange={(e) => setCustomSecondary(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <Input
                placeholder="#000000"
                value={customSecondary}
                onChange={(e) => setCustomSecondary(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customAccent || customPrimary}
                onChange={(e) => setCustomAccent(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <Input
                placeholder="#000000"
                value={customAccent}
                onChange={(e) => setCustomAccent(e.target.value)}
              />
            </div>
          </div>

          {/* Save Custom Set */}
          <div className="pt-4 border-t">
            {!showSaveInput ? (
              <button
                onClick={() => setShowSaveInput(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Save this color set for later
              </button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Name your color set..."
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
                <Button onClick={saveCustomSet} size="sm">Save</Button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="text-gray-500"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Saved Sets */}
          {savedSets.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Saved Color Sets</p>
              <div className="space-y-2">
                {savedSets.map((set, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => loadSavedSet(set)}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-1">
                        {set.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700">{set.name}</span>
                    </button>
                    <button
                      onClick={() => deleteSavedSet(index)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}