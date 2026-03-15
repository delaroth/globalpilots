'use client'

import { useState, useEffect, useRef } from 'react'
import { searchAirports, majorAirports, lookupAirportByCode } from '@/lib/geolocation'

interface AirportAutocompleteProps {
  value: string
  onChange: (code: string) => void
  label: string
  placeholder?: string
  id: string
  onSearchChange?: (text: string) => void // Optional callback for raw text input
  allowAnywhere?: boolean // Show "Anywhere" option in dropdown
  persistKey?: string // localStorage key suffix for persistence (e.g. 'origin')
}

/**
 * Check if a code is a group code (comma-separated, e.g. "LCA,PFO")
 */
function isGroupCode(code: string): boolean {
  return code.includes(',')
}

export default function AirportAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Search city or airport code...',
  id,
  onSearchChange,
  allowAnywhere = false,
  persistKey,
}: AirportAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isOriginField = id.toLowerCase().includes('origin')
  const storageKey = persistKey ? `gp_${persistKey}` : (isOriginField ? 'gp_origin' : null)

  // Persist airport to localStorage
  const saveToStorage = (code: string, city: string) => {
    if (storageKey && code && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({ code, name: city }))
    }
  }

  const clearStorage = () => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }

  // On mount, auto-fill from localStorage if value is empty
  useEffect(() => {
    if (storageKey && !value && typeof window !== 'undefined') {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed && parsed.code) {
            onChange(parsed.code)
            if (parsed.name) setSelectedCity(parsed.name)
          }
        } catch {
          // Legacy format: plain string code
          onChange(raw)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const anywhereEntry = { code: 'ANYWHERE', city: 'Anywhere', country: 'Cheapest destinations' }

  // Improved filtering: prioritize group entries, exact IATA code matches, then partial matches
  const filteredAirports = searchQuery.trim()
    ? (() => {
        const query = searchQuery.trim().toUpperCase()

        // If typing "any"/"anywhere", show the Anywhere option first
        if (allowAnywhere && 'ANYWHERE'.startsWith(query)) {
          const allResults = searchAirports(searchQuery).slice(0, 9)
          return [anywhereEntry, ...allResults]
        }

        const allResults = searchAirports(searchQuery)

        // Group entries (country/city groups) — these come first from searchAirports
        const groupResults = allResults.filter(a => isGroupCode(a.code))

        // Individual airport results
        const individualResults = allResults.filter(a => !isGroupCode(a.code))

        // Exact IATA code match
        const exactMatch = individualResults.filter(a => a.code === query)

        // IATA code starts with query
        const codeStartsWith = individualResults.filter(a =>
          a.code.startsWith(query) && a.code !== query
        )

        // City name starts with query
        const cityStartsWith = individualResults.filter(a =>
          a.city.toUpperCase().startsWith(query) &&
          !exactMatch.includes(a) &&
          !codeStartsWith.includes(a)
        )

        // Other matches
        const otherMatches = individualResults.filter(a =>
          !exactMatch.includes(a) &&
          !codeStartsWith.includes(a) &&
          !cityStartsWith.includes(a)
        )

        // Return prioritized results: groups first, then exact, starts-with, others
        return [...groupResults, ...exactMatch, ...codeStartsWith, ...cityStartsWith, ...otherMatches].slice(0, 12)
      })()
    : allowAnywhere ? [anywhereEntry] : []

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set initial selected city name if value exists
  useEffect(() => {
    if (value && !selectedCity) {
      if (value === 'ANYWHERE') {
        setSelectedCity('Anywhere')
      } else if (isGroupCode(value)) {
        // Group code — look up via lookupAirportByCode
        const info = lookupAirportByCode(value)
        if (info) {
          setSelectedCity(info.city)
        }
      } else {
        const airport = majorAirports.find(a => a.code === value)
        if (airport) {
          setSelectedCity(airport.city)
        }
      }
    }
  }, [value, selectedCity])

  const handleSelect = (code: string, city: string) => {
    onChange(code)
    saveToStorage(code, city)
    setSelectedCity(city)
    setSearchQuery('')
    setShowDropdown(false)
    // Clear text input when selection is made
    if (onSearchChange) {
      onSearchChange('')
    }
  }

  // Auto-select when typing a valid IATA code (single codes only, NOT group codes)
  useEffect(() => {
    const query = searchQuery.trim().toUpperCase()

    // If user typed exactly 3 letters (case-insensitive) — only match single IATA codes
    if (query.length === 3 && /^[A-Z]{3}$/.test(query) && !(allowAnywhere && query === 'ANY')) {
      const exactMatch = majorAirports.find(a => a.code === query)
      if (exactMatch) {
        // Auto-select the exact IATA code match immediately
        onChange(exactMatch.code)
        saveToStorage(exactMatch.code, exactMatch.city)
        setSelectedCity(exactMatch.city)
        setSearchQuery('')
        setShowDropdown(false)
      }
    }
  }, [searchQuery, onChange])

  // Auto-select on blur: if exactly one match or exact text match, pick it
  const handleBlur = () => {
    // Small delay to allow click events on dropdown items to fire first
    setTimeout(() => {
      if (!searchQuery.trim()) return

      const query = searchQuery.trim()
      const results = searchAirports(query)

      // Filter out group entries for auto-select on blur — prefer individual airports
      const individualResults = results.filter(a => !isGroupCode(a.code))

      if (individualResults.length === 1) {
        handleSelect(individualResults[0].code, individualResults[0].city)
        return
      }

      // Check for exact match on name or code (case-insensitive), individual only
      const exactByCode = individualResults.find(
        (a) => a.code.toLowerCase() === query.toLowerCase()
      )
      if (exactByCode) {
        handleSelect(exactByCode.code, exactByCode.city)
        return
      }

      const exactByCity = individualResults.find(
        (a) => a.city.toLowerCase() === query.toLowerCase()
      )
      if (exactByCity) {
        handleSelect(exactByCity.code, exactByCity.city)
        return
      }
    }, 200)
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // If there's exactly one result, select it
      if (filteredAirports.length === 1) {
        const airport = filteredAirports[0]
        handleSelect(airport.code, airport.city)
      }
      // If query is exactly 3 letters, try to find exact IATA match (single codes only)
      else if (/^[A-Z]{3}$/i.test(searchQuery.trim())) {
        const query = searchQuery.trim().toUpperCase()
        const exactMatch = majorAirports.find(a => a.code === query)
        if (exactMatch) {
          handleSelect(exactMatch.code, exactMatch.city)
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  // Determine display code for the selected value chip
  const displayCode = value && !isGroupCode(value) && value !== 'ANYWHERE' ? value : null

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium text-navy">
        {label}
      </label>

      {/* Display selected city or search input */}
      <div className="relative">
        {selectedCity && !showDropdown ? (
          <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
            <div>
              <span className="font-semibold text-navy">{selectedCity}</span>
              {displayCode && (
                <span className="text-sm text-gray-600 ml-2">({displayCode})</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCity('')
                onChange('')
                clearStorage()
                setShowDropdown(true)
              }}
              className="text-gray-500 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
              aria-label="Clear airport selection"
            >
              ✕
            </button>
          </div>
        ) : (
          <input
            type="text"
            id={id}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
              // Notify parent of text changes if callback provided
              if (onSearchChange) {
                onSearchChange(e.target.value)
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
            autoComplete="off"
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredAirports.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
          {filteredAirports.map((airport) => {
            const isGroup = isGroupCode(airport.code)
            const codeCount = isGroup ? airport.code.split(',').length : 0
            return (
              <button
                key={airport.code}
                type="button"
                onClick={() => handleSelect(airport.code, airport.city)}
                className={`w-full px-4 py-3 text-left hover:bg-skyblue/10 transition border-b border-gray-100 last:border-b-0 ${isGroup ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-semibold ${isGroup ? 'text-blue-700' : 'text-navy'}`}>
                      {airport.city}
                    </span>
                    {!isGroup && (
                      <span className="text-sm text-gray-600 ml-2">({airport.code})</span>
                    )}
                    {isGroup && (
                      <span className="text-xs text-blue-500 ml-2">
                        {codeCount} airports
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {airport.country}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showDropdown && searchQuery && filteredAirports.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl p-4 text-center text-gray-600 text-sm">
          No airports found. Try searching by city name, country, or airport code.
        </div>
      )}
    </div>
  )
}
