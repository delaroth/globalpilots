'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import DestinationCard from '@/components/DestinationCard'
import { majorAirports, getAllRegions, getAirportsByRegion, searchAirports } from '@/lib/geolocation'

interface WeekendDeal {
  value: number
  trip_class: number
  show_to_affiliates: boolean
  origin: string
  destination: string
  gate: string
  depart_date: string
  return_date: string
  number_of_changes: number
  found_at: string
  distance: number
  actual: boolean
}

export default function WeekendPage() {
  const [origin, setOrigin] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [loading, setLoading] = useState(false)
  const [deals, setDeals] = useState<WeekendDeal[]>([])
  const [error, setError] = useState('')
  const [autoDetectedCity, setAutoDetectedCity] = useState('')
  const [departDay, setDepartDay] = useState('friday')
  const [returnDay, setReturnDay] = useState('sunday')
  const [flexibleDays, setFlexibleDays] = useState(1)
  const [timeframe, setTimeframe] = useState('3months')

  const regions = useMemo(() => getAllRegions(), [])

  // Helper to get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayNameToNumber = (dayName: string): number => {
    const days: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }
    return days[dayName.toLowerCase()]
  }

  // Check if a date matches the selected day of week (with flexibility)
  const matchesDayOfWeek = (dateStr: string, targetDay: string): boolean => {
    // Parse date as UTC to avoid timezone shifts
    const parts = dateStr.split('-')
    const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
    const dayNum = date.getUTCDay()
    const targetNum = dayNameToNumber(targetDay)

    console.log(`Checking ${dateStr} (day ${dayNum}) against target ${targetDay} (day ${targetNum})`)

    if (flexibleDays === 0) {
      return dayNum === targetNum
    }

    // Check if within flexibility range
    for (let i = -flexibleDays; i <= flexibleDays; i++) {
      const checkDay = (targetNum + i + 7) % 7
      if (dayNum === checkDay) return true
    }
    return false
  }

  // Filter airports based on search and region
  const filteredAirports = useMemo(() => {
    let filtered = majorAirports

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = getAirportsByRegion(selectedRegion)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchAirports(searchQuery)
    }

    return filtered
  }, [searchQuery, selectedRegion])

  // Auto-detect location on mount
  useEffect(() => {
    setAutoDetectedCity('New York JFK')
    setOrigin('JFK')
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin) return

    setLoading(true)
    setError('')
    setDeals([])

    try {
      // Calculate date range based on timeframe
      const today = new Date()
      let limit = 100 // Get more results to filter

      const response = await fetch(
        `/api/travelpayouts/latest?origin=${origin}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch weekend deals')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Extract deals from response
      let dealsData = data.data || []

      // Filter by timeframe
      const getTimeframeLimit = () => {
        const now = new Date()
        switch (timeframe) {
          case 'thisweek':
            const endOfWeek = new Date(now)
            endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
            return endOfWeek
          case 'thismonth':
            return new Date(now.getFullYear(), now.getMonth() + 1, 0)
          case '3months':
            return new Date(now.setMonth(now.getMonth() + 3))
          case '6months':
            return new Date(now.setMonth(now.getMonth() + 6))
          case 'thisyear':
            return new Date(now.getFullYear(), 11, 31)
          default:
            return new Date(now.setMonth(now.getMonth() + 3))
        }
      }

      const timeframeLimit = getTimeframeLimit()

      console.log(`Total deals fetched: ${dealsData.length}`)
      console.log(`Filtering for ${departDay} to ${returnDay} with ±${flexibleDays} days flexibility`)

      // Filter deals by timeframe and matching days
      dealsData = dealsData.filter((deal: WeekendDeal) => {
        const departDate = new Date(deal.depart_date)
        const returnDate = new Date(deal.return_date)

        // Check if within timeframe
        if (departDate > timeframeLimit) return false

        // Check if depart/return days match selected days (with flexibility)
        const departMatches = matchesDayOfWeek(deal.depart_date, departDay)
        const returnMatches = matchesDayOfWeek(deal.return_date, returnDay)

        const matches = departMatches && returnMatches
        if (matches) {
          console.log(`✓ Match: ${deal.destination} - ${deal.depart_date} to ${deal.return_date}`)
        }

        return matches
      })

      console.log(`Filtered to ${dealsData.length} matching deals`)

      // Sort by price and limit to top 6
      dealsData = dealsData.sort((a: WeekendDeal, b: WeekendDeal) => a.value - b.value).slice(0, 6)

      if (dealsData.length === 0) {
        setError(`No ${departDay}-${returnDay} trips found in the selected timeframe. Try different days or timeframe!`)
      } else {
        setDeals(dealsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAirportSelect = (code: string, city: string) => {
    setOrigin(code)
    setSearchQuery('')
    setShowDropdown(false)
    setAutoDetectedCity(city)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fly Cheap on Your Schedule 🎉
          </h1>
          <p className="text-xl text-skyblue-light">
            Choose your travel days and timeframe • {majorAirports.length}+ cities worldwide
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="space-y-4">
              {/* Auto-detected location info */}
              {autoDetectedCity && (
                <div className="bg-skyblue/10 border border-skyblue/30 rounded-lg p-3 text-center">
                  <p className="text-sm text-navy">
                    📍 <strong>Selected:</strong> {autoDetectedCity}
                  </p>
                </div>
              )}

              {/* Timeframe Selection */}
              <div className="space-y-2">
                <label htmlFor="timeframe" className="block text-sm font-medium text-navy">
                  Search within ⏰
                </label>
                <select
                  id="timeframe"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                >
                  <option value="thisweek">This Week</option>
                  <option value="thismonth">This Month</option>
                  <option value="3months">Next 3 Months</option>
                  <option value="6months">Next 6 Months</option>
                  <option value="thisyear">This Year</option>
                </select>
              </div>

              {/* Trip Duration Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-navy">
                  Travel days 📅
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="departDay" className="block text-xs text-gray-600 mb-1">
                      Depart on
                    </label>
                    <select
                      id="departDay"
                      value={departDay}
                      onChange={(e) => setDepartDay(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                    >
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="returnDay" className="block text-xs text-gray-600 mb-1">
                      Return on
                    </label>
                    <select
                      id="returnDay"
                      value={returnDay}
                      onChange={(e) => setReturnDay(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                    >
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Flexibility */}
              <div className="space-y-2">
                <label htmlFor="flexibility" className="block text-sm font-medium text-navy">
                  Date Flexibility: ±{flexibleDays} day{flexibleDays > 1 ? 's' : ''}
                </label>
                <input
                  type="range"
                  id="flexibility"
                  min="0"
                  max="3"
                  value={flexibleDays}
                  onChange={(e) => setFlexibleDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Exact dates</span>
                  <span>Very flexible</span>
                </div>
              </div>

              {/* Region Filter */}
              <div className="space-y-2">
                <label htmlFor="region" className="block text-sm font-medium text-navy">
                  Filter by Region
                </label>
                <select
                  id="region"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                >
                  <option value="all">All Regions ({majorAirports.length} cities)</option>
                  {regions.map(region => {
                    const count = getAirportsByRegion(region).length
                    return (
                      <option key={region} value={region}>
                        {region} ({count} cities)
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* City Search/Select */}
              <div className="space-y-2 relative">
                <label htmlFor="city-search" className="block text-sm font-medium text-navy">
                  Search & Select Departure City
                </label>
                <input
                  type="text"
                  id="city-search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by city, country, or airport code..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                />

                {/* Dropdown */}
                {showDropdown && filteredAirports.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
                    {filteredAirports.slice(0, 50).map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => handleAirportSelect(airport.code, airport.city)}
                        className="w-full px-4 py-3 text-left hover:bg-skyblue/10 transition border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-navy">{airport.city}</span>
                            <span className="text-sm text-gray-600 ml-2">({airport.code})</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {airport.country} • {airport.region}
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredAirports.length > 50 && (
                      <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 text-center">
                        Showing 50 of {filteredAirports.length} results. Keep typing to narrow down...
                      </div>
                    )}
                  </div>
                )}

                {showDropdown && filteredAirports.length === 0 && searchQuery && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl p-4 text-center text-gray-600">
                    No airports found. Try a different search term.
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading || !origin}
                className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Finding Deals...' : `Find ${departDay.charAt(0).toUpperCase() + departDay.slice(1)}-${returnDay.charAt(0).toUpperCase() + returnDay.slice(1)} Trips`}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-white">❌ {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue"></div>
            <p className="text-white mt-4 text-lg">Finding {departDay.charAt(0).toUpperCase() + departDay.slice(1)}-{returnDay.charAt(0).toUpperCase() + returnDay.slice(1)} trips...</p>
            <p className="text-skyblue-light text-sm mt-2">Filtering by your selected days and timeframe</p>
          </div>
        )}

        {/* Deals Grid */}
        {deals.length > 0 && !loading && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Top {deals.length} Destinations
              </h2>
              <p className="text-skyblue-light">
                {departDay.charAt(0).toUpperCase() + departDay.slice(1)} to {returnDay.charAt(0).toUpperCase() + returnDay.slice(1)} trips from {autoDetectedCity || origin}
              </p>
              <p className="text-skyblue-light/80 text-sm mt-1">
                {timeframe === 'thisweek' && 'This week'}
                {timeframe === 'thismonth' && 'This month'}
                {timeframe === '3months' && 'Next 3 months'}
                {timeframe === '6months' && 'Next 6 months'}
                {timeframe === 'thisyear' && 'This year'}
                {flexibleDays > 0 && ` • ±${flexibleDays} day${flexibleDays > 1 ? 's' : ''} flexible`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal, index) => (
                <DestinationCard
                  key={`${deal.destination}-${index}`}
                  destination={deal.gate}
                  destinationCode={deal.destination}
                  origin={deal.origin}
                  price={deal.value}
                  departDate={deal.depart_date}
                  returnDate={deal.return_date}
                  distance={deal.distance}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info section when no results */}
        {!loading && deals.length === 0 && !error && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-white font-semibold mb-2">150+ Cities</h3>
                <p className="text-skyblue-light text-sm">
                  Search from major airports across all continents
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="text-white font-semibold mb-2">Flexible Dates</h3>
                <p className="text-skyblue-light text-sm">
                  Choose your travel days and date flexibility
                </p>
              </div>
              <div className="bg-navy-light/50 backdrop-blur-sm rounded-lg p-6 border border-skyblue/20 text-center">
                <div className="text-4xl mb-3">✈️</div>
                <h3 className="text-white font-semibold mb-2">Real Prices</h3>
                <p className="text-skyblue-light text-sm">
                  Live flight prices via Aviasales
                </p>
              </div>
            </div>

            {/* Popular Cities Quick Select */}
            <div className="mt-12 bg-skyblue/10 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20">
              <h3 className="text-white font-semibold mb-4 text-center">Popular Departure Cities</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { code: 'JFK', city: 'New York' },
                  { code: 'LAX', city: 'Los Angeles' },
                  { code: 'LHR', city: 'London' },
                  { code: 'CDG', city: 'Paris' },
                  { code: 'NRT', city: 'Tokyo' },
                  { code: 'SYD', city: 'Sydney' },
                  { code: 'DXB', city: 'Dubai' },
                  { code: 'SIN', city: 'Singapore' },
                ].map((airport) => (
                  <button
                    key={airport.code}
                    onClick={() => handleAirportSelect(airport.code, airport.city)}
                    className="px-4 py-2 bg-skyblue hover:bg-skyblue-dark text-navy font-medium rounded-lg transition transform hover:scale-105"
                  >
                    {airport.city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
