// Main orchestrator: calls all enrichment sources in parallel
// Each failed source returns null/empty — never blocks others

import { fetchDestinationPhotos, type DestinationPhoto } from './photos'
import { fetchCountryData, countryNameToCode, type CountryData } from './country-data'
import { checkVisaRequirement, type VisaInfo } from './visa'
import { getClimateData, type ClimateData } from './climate'
import { getExchangeRate, type ExchangeRateResult } from './exchange-rates'
import { getSafetyInfo, type SafetyInfo } from './safety'
import { getHolidaysDuringTrip, type Holiday } from './holidays'
import { fetchWeather, type WeatherData } from './weather'
import { fetchAttractions, type Attraction } from './attractions'
import { fetchTimezone, type TimezoneInfo } from './timezone'
import { getDestinationCost } from '@/lib/destination-costs'

export interface EnrichmentParams {
  cityName: string
  country: string
  countryCode?: string  // ISO alpha-2, resolved automatically if not provided
  iata: string
  departDate: string    // YYYY-MM-DD
  returnDate: string    // YYYY-MM-DD
  passportCountry?: string  // ISO alpha-2 for visa check
}

export interface EnrichmentData {
  photos: DestinationPhoto[]
  country: CountryData | null
  visa: VisaInfo | null
  climate: ClimateData | null
  weather: WeatherData | null
  attractions: Attraction[] | null
  timezone: TimezoneInfo | null
  exchangeRate: ExchangeRateResult | null
  safety: SafetyInfo | null
  holidays: Holiday[]
}

// Re-export all types for consumers
export type {
  DestinationPhoto,
  CountryData,
  VisaInfo,
  ClimateData,
  WeatherData,
  Attraction,
  TimezoneInfo,
  ExchangeRateResult,
  SafetyInfo,
  Holiday,
}

/**
 * Enrich a destination with photos, country info, visa, climate,
 * exchange rates, safety advisories, and holidays.
 *
 * All sources are fetched in parallel using Promise.allSettled.
 * Any individual failure returns null/empty for that source — never blocks others.
 */
export async function enrichDestination(
  params: EnrichmentParams
): Promise<EnrichmentData> {
  const { cityName, country, iata, departDate, returnDate, passportCountry } = params

  // Resolve country code
  const countryCode = params.countryCode || countryNameToCode(country) || ''

  // Get currency code from destination-costs data
  const destCost = getDestinationCost(iata)
  const currencyCode = destCost?.currency || ''

  // Parse departure month for climate data
  const departMonth = parseInt(departDate.substring(5, 7), 10)

  // Run all enrichment sources in parallel
  const [
    photosResult,
    countryResult,
    exchangeResult,
    safetyResult,
    holidaysResult,
    weatherResult,
    attractionsResult,
  ] = await Promise.allSettled([
    fetchDestinationPhotos(cityName, country),
    countryCode ? fetchCountryData(countryCode) : Promise.resolve(null),
    currencyCode ? getExchangeRate(currencyCode) : Promise.resolve(null),
    getSafetyInfo(country),
    countryCode ? getHolidaysDuringTrip(countryCode, departDate, returnDate) : Promise.resolve([]),
    fetchWeather(iata, departDate),
    fetchAttractions(iata),
  ])

  // Visa check is synchronous — no need for Promise.allSettled
  let visa: VisaInfo | null = null
  if (passportCountry) {
    try {
      visa = checkVisaRequirement(passportCountry, country)
    } catch {
      visa = null
    }
  }

  // Climate check is synchronous (hardcoded data) — used as fallback when weather API fails
  let climate: ClimateData | null = null
  try {
    climate = getClimateData(iata, departMonth)
  } catch {
    climate = null
  }

  // Timezone is synchronous (static lookup)
  let timezone: TimezoneInfo | null = null
  try {
    timezone = fetchTimezone(iata)
  } catch {
    timezone = null
  }

  return {
    photos: photosResult.status === 'fulfilled' ? photosResult.value : [],
    country: countryResult.status === 'fulfilled' ? countryResult.value : null,
    visa,
    climate,
    weather: weatherResult.status === 'fulfilled' ? weatherResult.value : null,
    attractions: attractionsResult.status === 'fulfilled' ? attractionsResult.value : null,
    timezone,
    exchangeRate: exchangeResult.status === 'fulfilled' ? exchangeResult.value : null,
    safety: safetyResult.status === 'fulfilled' ? safetyResult.value : null,
    holidays: holidaysResult.status === 'fulfilled' ? holidaysResult.value : [],
  }
}
