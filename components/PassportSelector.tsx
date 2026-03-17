'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ALL_PASSPORTS, PASSPORT_REGIONS, type Passport } from '@/data/all-passports'

interface PassportSelectorProps {
  selected: string[]
  onChange: (codes: string[]) => void
  maxSelections?: number
  variant?: 'light' | 'dark'
}

export default function PassportSelector({
  selected,
  onChange,
  maxSelections = 3,
  variant = 'light',
}: PassportSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Resolve selected codes to Passport objects
  const selectedPassports = useMemo(() => {
    const map = new Map(ALL_PASSPORTS.map(p => [p.code, p]))
    // Handle UK -> GB alias
    return selected.map(code => {
      const resolved = code.toUpperCase() === 'UK' ? 'GB' : code.toUpperCase()
      return map.get(resolved)
    }).filter(Boolean) as Passport[]
  }, [selected])

  // Filter passports by search query
  const filteredRegions = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return PASSPORT_REGIONS

    const result: Record<string, Passport[]> = {}
    for (const [region, passports] of Object.entries(PASSPORT_REGIONS)) {
      const filtered = passports.filter(
        p => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
      )
      if (filtered.length > 0) result[region] = filtered
    }

    // Also search all passports for matches not in any shown region
    const allMatches = ALL_PASSPORTS.filter(
      p => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
    )
    const shownCodes = new Set(Object.values(result).flat().map(p => p.code))
    const extra = allMatches.filter(p => !shownCodes.has(p.code))
    if (extra.length > 0) result['Other Results'] = extra

    return result
  }, [search])

  const togglePassport = useCallback((code: string) => {
    // Normalize UK -> GB for internal consistency
    const normalized = code.toUpperCase() === 'UK' ? 'GB' : code.toUpperCase()

    if (selected.includes(normalized)) {
      onChange(selected.filter(c => c !== normalized))
    } else if (selected.length < maxSelections) {
      onChange([...selected, normalized])
    }
  }, [selected, onChange, maxSelections])

  const removePassport = useCallback((code: string) => {
    onChange(selected.filter(c => c !== code))
  }, [selected, onChange])

  const isLight = variant === 'light'

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected pills + trigger */}
      <div
        className={`flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-1.5 rounded-lg border-2 cursor-pointer transition ${
          isLight
            ? `border-gray-200 bg-white ${open ? 'border-sky-400' : 'hover:border-gray-300'}`
            : `border-white/20 bg-white/5 ${open ? 'border-sky-400' : 'hover:border-white/30'}`
        }`}
        onClick={() => {
          setOpen(!open)
          if (!open) setTimeout(() => inputRef.current?.focus(), 50)
        }}
      >
        {selectedPassports.length > 0 ? (
          selectedPassports.map(p => (
            <span
              key={p.code}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isLight
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {p.flag} {p.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removePassport(p.code)
                }}
                className={`ml-0.5 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none ${
                  isLight
                    ? 'hover:bg-sky-200 text-sky-600'
                    : 'hover:bg-sky-500/30 text-sky-300'
                }`}
              >
                x
              </button>
            </span>
          ))
        ) : (
          <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
            Select passport country...
          </span>
        )}
        <svg
          className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            isLight ? 'text-gray-400' : 'text-white/40'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute z-50 mt-1 w-full rounded-lg shadow-xl border overflow-hidden ${
            isLight
              ? 'bg-white border-gray-200'
              : 'bg-slate-900 border-white/20'
          }`}
        >
          {/* Search input */}
          <div className={`p-2 border-b ${isLight ? 'border-gray-100' : 'border-white/10'}`}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className={`w-full px-3 py-1.5 rounded text-sm outline-none ${
                isLight
                  ? 'bg-gray-50 text-gray-900 placeholder-gray-400'
                  : 'bg-white/10 text-white placeholder-white/40'
              }`}
            />
          </div>

          {/* Country list */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(filteredRegions).map(([region, passports]) => (
              <div key={region}>
                <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider sticky top-0 ${
                  isLight
                    ? 'bg-gray-50 text-gray-500'
                    : 'bg-slate-800 text-white/50'
                }`}>
                  {region}
                </div>
                {passports.map(p => {
                  const isSelected = selected.includes(p.code)
                  const isDisabled = !isSelected && selected.length >= maxSelections
                  return (
                    <button
                      key={`${region}-${p.code}`}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => togglePassport(p.code)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition ${
                        isDisabled
                          ? isLight ? 'opacity-40 cursor-not-allowed' : 'opacity-30 cursor-not-allowed'
                          : isSelected
                            ? isLight
                              ? 'bg-sky-50 text-sky-800 font-medium'
                              : 'bg-sky-500/10 text-sky-300 font-medium'
                            : isLight
                              ? 'hover:bg-gray-50 text-gray-800'
                              : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <span className="text-base">{p.flag}</span>
                      <span className="flex-1">{p.name}</span>
                      {isSelected && (
                        <svg className={`w-4 h-4 ${isLight ? 'text-sky-500' : 'text-sky-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
            {Object.keys(filteredRegions).length === 0 && (
              <div className={`p-4 text-center text-sm ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                No countries found
              </div>
            )}
          </div>

          {/* Footer */}
          {maxSelections > 1 && (
            <div className={`px-3 py-1.5 text-xs text-center border-t ${
              isLight
                ? 'border-gray-100 text-gray-400'
                : 'border-white/10 text-white/30'
            }`}>
              {selected.length}/{maxSelections} selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}
