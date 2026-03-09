'use client'

import { useState, useEffect, useRef } from 'react'
import { searchAirports, majorAirports } from '@/lib/geolocation'

interface AirportAutocompleteProps {
  value: string
  onChange: (code: string) => void
  label: string
  placeholder?: string
  id: string
}

export default function AirportAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Search city or airport code...',
  id,
}: AirportAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredAirports = searchQuery.trim()
    ? searchAirports(searchQuery).slice(0, 30)
    : []

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
      const airport = majorAirports.find(a => a.code === value)
      if (airport) {
        setSelectedCity(airport.city)
      }
    }
  }, [value, selectedCity])

  const handleSelect = (code: string, city: string) => {
    onChange(code)
    setSelectedCity(city)
    setSearchQuery('')
    setShowDropdown(false)
  }

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
              <span className="text-sm text-gray-600 ml-2">({value})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCity('')
                onChange('')
                setShowDropdown(true)
              }}
              className="text-gray-500 hover:text-gray-700"
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
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
            autoComplete="off"
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredAirports.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
          {filteredAirports.map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => handleSelect(airport.code, airport.city)}
              className="w-full px-4 py-3 text-left hover:bg-skyblue/10 transition border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-navy">{airport.city}</span>
                  <span className="text-sm text-gray-600 ml-2">({airport.code})</span>
                </div>
                <div className="text-xs text-gray-500">
                  {airport.country}
                </div>
              </div>
            </button>
          ))}
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
