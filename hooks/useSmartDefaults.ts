'use client'

import { useState, useEffect } from 'react'
import {
  detectUserTimezone,
  guessAirportFromTimezone,
  guessCountryFromTimezone,
  guessCurrencyFromTimezone,
} from '@/lib/geolocation-detect'

interface SmartDefaults {
  suggestedAirport: { code: string; city: string } | null
  suggestedCurrency: string | null
  suggestedPassport: string | null
  loading: boolean
}

const ORIGIN_KEY = 'gp_origin'
const CURRENCY_KEY = 'gp_currency'
const PASSPORT_KEY = 'gp_passport'

/**
 * Hook that returns smart defaults based on the user's timezone.
 * Only suggests values when no localStorage preference has been saved.
 */
export function useSmartDefaults(): SmartDefaults {
  const [defaults, setDefaults] = useState<SmartDefaults>({
    suggestedAirport: null,
    suggestedCurrency: null,
    suggestedPassport: null,
    loading: true,
  })

  useEffect(() => {
    const tz = detectUserTimezone()

    const hasSavedOrigin = !!localStorage.getItem(ORIGIN_KEY)
    const hasSavedCurrency = !!localStorage.getItem(CURRENCY_KEY)
    const hasSavedPassport = !!localStorage.getItem(PASSPORT_KEY)

    const airport = hasSavedOrigin ? null : guessAirportFromTimezone(tz)
    const currency = hasSavedCurrency ? null : guessCurrencyFromTimezone(tz)
    const passport = hasSavedPassport ? null : guessCountryFromTimezone(tz)

    setDefaults({
      suggestedAirport: airport,
      suggestedCurrency: currency,
      suggestedPassport: passport,
      loading: false,
    })
  }, [])

  return defaults
}
