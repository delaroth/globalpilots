'use client'

import { useState } from 'react'

export default function FlightSearch() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search functionality will be implemented later
    console.log({ origin, destination, departDate, returnDate })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Origin */}
          <div className="space-y-2">
            <label htmlFor="origin" className="block text-sm font-medium text-navy">
              From
            </label>
            <input
              type="text"
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="City or airport"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
              required
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <label htmlFor="destination" className="block text-sm font-medium text-navy">
              To
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or airport"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
              required
            />
          </div>

          {/* Depart Date */}
          <div className="space-y-2">
            <label htmlFor="departDate" className="block text-sm font-medium text-navy">
              Depart
            </label>
            <input
              type="date"
              id="departDate"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
              required
            />
          </div>

          {/* Return Date */}
          <div className="space-y-2">
            <label htmlFor="returnDate" className="block text-sm font-medium text-navy">
              Return
            </label>
            <input
              type="date"
              id="returnDate"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Search Flights
        </button>
      </form>
    </div>
  )
}
