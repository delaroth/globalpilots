'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { trackConversion } from '@/lib/track-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MysteryState {
  status: 'idle' | 'searching' | 'quick-ready' | 'generic-ready' | 'ready' | 'error'
  destination: any | null
  detailsLoading: boolean
  genericLoading: boolean
  error: string | null
}

interface SearchParams {
  origin: string
  budget: number
  vibes: string[]
  dates: string
  tripDuration: number
  packageComponents: {
    includeFlight: boolean
    includeHotel: boolean
    includeItinerary: boolean
    includeTransportation: boolean
  }
  email?: string
  exclude?: string[]
  accommodationLevel: string
  budgetPriority: string
  customSplit?: { flights: number; hotels: number; activities: number }
  passports?: string[] // ISO alpha-2 codes for visa filtering (e.g. ['US', 'DE'])
  destination?: string // Pre-selected destination (skips mystery pick, goes straight to AI planning)
  departTime?: number // Time-of-day filter: 0=morning, 1=afternoon, 2=evening, 3=night
}

interface MysteryContextType {
  state: MysteryState
  startSearch: (params: SearchParams) => void
  dismiss: () => void
  minimize: () => void
  expand: () => void
  isMinimized: boolean
  isVisible: boolean
  // Expose these for MysteryPopup to render MysteryReveal
  searchParams: SearchParams | null
  rerollCount: number
  maxRerolls: number
  handleReroll: () => void
  handleShowAnother: () => void
}

const MysteryContext = createContext<MysteryContextType | null>(null)

export function useMystery() {
  const ctx = useContext(MysteryContext)
  if (!ctx) throw new Error('useMystery must be used within MysteryProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MAX_REROLLS = 3

export function MysteryProvider({ children }: { children: React.ReactNode }) {
  const currency = useCurrency()

  const [state, setState] = useState<MysteryState>({
    status: 'idle',
    destination: null,
    detailsLoading: false,
    genericLoading: false,
    error: null,
  })

  const [isMinimized, setIsMinimized] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)
  const [excludeList, setExcludeList] = useState<string[]>([])
  const excludeListRef = useRef<string[]>([])
  const [rerollCount, setRerollCount] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Whether there's something to show in the popup
  const isVisible = state.status !== 'idle'

  // -------------------------------------------------------------------
  // Fetch generic cached data for a destination (with one retry)
  // -------------------------------------------------------------------
  const fetchGenericData = useCallback((
    dest: { destination: string; country: string; iata: string },
    abortSignal: AbortSignal,
  ) => {
    const doFetch = () => fetch('/api/ai-mystery/generic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortSignal,
      body: JSON.stringify({
        destination: dest.destination,
        country: dest.country,
        iata: dest.iata,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Failed to fetch generic data (${res.status})`)
      return res.json()
    })

    return doFetch().catch((err) => {
      if (err.name === 'AbortError') throw err
      console.warn('[MysteryContext] Generic fetch failed, retrying in 2s:', err.message)
      return new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => {
          doFetch().then(resolve).catch(reject)
        }, 2000)
        // Clean up timer if aborted during wait
        abortSignal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
      })
    })
  }, [])

  // -------------------------------------------------------------------
  // Fetch personalized details (itinerary + hotels)
  // -------------------------------------------------------------------
  const fetchPersonalizedDetails = useCallback((
    quickData: any,
    params: SearchParams,
    abortSignal: AbortSignal,
  ) => {
    const resolvedIata = quickData.iata || quickData.city_code_IATA
    return fetch('/api/ai-mystery/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortSignal,
      body: JSON.stringify({
        destination: quickData.destination,
        country: quickData.country,
        iata: resolvedIata,
        origin: params.origin,
        budget: params.budget,
        vibes: params.vibes,
        dates: params.dates,
        tripDuration: params.tripDuration,
        flightPrice: quickData.estimated_flight_cost || 0,
        accommodationLevel: params.accommodationLevel,
        budgetPriority: params.budgetPriority,
        customSplit: params.customSplit,
        packageComponents: params.packageComponents,
        hotelEstimate: quickData.estimated_hotel_per_night,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to generate trip details')
      return res.json()
    })
  }, [])

  // -------------------------------------------------------------------
  // Core search logic (three-phase: quick pick + generic cache + AI details)
  // -------------------------------------------------------------------
  const executeSearch = useCallback((params: SearchParams) => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setSearchParams(params)
    setIsMinimized(false)
    setState({ status: 'searching', destination: null, detailsLoading: false, genericLoading: false, error: null })

    const requestBody = {
      ...params,
      exclude: params.exclude && params.exclude.length > 0 ? params.exclude : undefined,
    }

    // If destination is pre-selected, skip quick pick and go straight to details
    if (params.destination) {
      console.log('[MysteryContext] Pre-selected destination:', params.destination, '-- skipping quick pick')
      const iata = params.destination
      const airport = (globalThis as any).__majorAirports?.find?.((a: any) => a.code === iata)

      const partialDest = {
        destination: airport?.city || iata,
        country: airport?.country || '',
        iata,
        city_code_IATA: iata,
        estimated_flight_cost: 0,
        indicativeFlightPrice: 0,
        estimated_hotel_per_night: 0,
        priceIsLive: false,
        priceIsEstimate: true,
        whyThisPlace: '',
        why_its_perfect: '',
        itinerary: [],
        bestTimeToGo: '',
        localTip: '',
        insider_tip: '',
        best_local_food: [],
        day1: [], day2: [], day3: [],
        budgetBreakdown: { flights: 0, hotel: 0, activities: 0, food: 0, total: 0 },
      }

      setState({ status: 'quick-ready', destination: partialDest, detailsLoading: true, genericLoading: true, error: null })

      // Phase 2a: Generic data (cached) + Phase 2b: Personalized details — in parallel
      const genericPromise = fetchGenericData(
        { destination: partialDest.destination, country: partialDest.country, iata },
        abortController.signal,
      )

      const detailsPromise = fetchPersonalizedDetails(partialDest, params, abortController.signal)

      // Handle generic data as it arrives
      genericPromise
        .then((genericData) => {
          console.log('[MysteryContext] Generic data received for pre-selected dest')
          setState(prev => {
            if (!prev.destination) return prev
            return {
              ...prev,
              status: prev.detailsLoading && prev.status !== 'ready' ? 'generic-ready' : prev.status,
              genericLoading: false,
              destination: {
                ...prev.destination,
                ...genericData,
                // Keep core identity fields
                destination: prev.destination.destination,
                country: prev.destination.country,
                iata: prev.destination.iata,
                city_code_IATA: prev.destination.city_code_IATA,
              },
            }
          })
        })
        .catch((err) => {
          if (err.name === 'AbortError') return
          console.warn('[MysteryContext] Generic data failed (non-fatal):', err.message)
          setState(prev => ({ ...prev, genericLoading: false }))
        })

      // Handle personalized details as they arrive
      detailsPromise
        .then((detailsData) => {
          console.log('[MysteryContext] Personalized details received for pre-selected dest')
          setState(prev => {
            if (!prev.destination) return prev
            return {
              ...prev,
              status: 'ready',
              detailsLoading: false,
              destination: {
                ...prev.destination,
                ...detailsData,
                // Keep core identity fields
                destination: prev.destination.destination,
                country: prev.destination.country,
                iata: prev.destination.iata,
                city_code_IATA: prev.destination.city_code_IATA,
              },
            }
          })
        })
        .catch((err) => {
          if (err.name === 'AbortError') return
          console.warn('[MysteryContext] Personalized details failed for pre-selected dest')
          setState(prev => ({ ...prev, status: prev.status === 'error' ? 'error' : 'ready', detailsLoading: false }))
        })

      return
    }

    // Phase 1: Quick pick (mystery mode -- AI picks destination)
    console.log('[MysteryContext] Phase 1: Quick pick API call...')
    fetch('/api/ai-mystery/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal,
      body: JSON.stringify(requestBody),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
          throw new Error(errorData.error || `Quick pick failed (HTTP ${response.status})`)
        }
        const quickData = await response.json()
        console.log('[MysteryContext] Phase 1 response:', quickData.destination, quickData.city_code_IATA)

        // Resolve IATA code from either field (cache may only have city_code_IATA)
        const iata = quickData.iata || quickData.city_code_IATA

        if (!quickData.destination || !iata) {
          throw new Error(`Invalid quick pick response: destination=${quickData.destination}, iata=${iata}`)
        }

        // Ensure both fields are set for downstream consumers
        quickData.iata = iata
        quickData.city_code_IATA = iata

        // Full cache hit -- skip phase 2
        if (quickData._cacheHit) {
          console.log('[MysteryContext] Full cache hit -- skipping Phase 2')
          setState({ status: 'ready', destination: quickData, detailsLoading: false, genericLoading: false, error: null })
          trackConversion('mystery_revealed', {
            destination: quickData.destination,
            country: quickData.country,
            iata,
            cached: true,
          })
          return
        }

        // Cap hotel estimate at what the budget can actually afford
        const flightCost = quickData.estimated_flight_cost || 0
        const remainingAfterFlight = Math.max(0, params.budget - flightCost)
        const maxHotelTotal = Math.floor(remainingAfterFlight * 0.5) // max 50% of remaining for hotel
        const rawHotelTotal = (quickData.estimated_hotel_per_night || 0) * params.tripDuration
        const cappedHotelTotal = Math.min(rawHotelTotal, maxHotelTotal)

        // Build partial destination
        const partialDestination = {
          destination: quickData.destination,
          country: quickData.country,
          iata,
          city_code_IATA: iata,
          estimated_flight_cost: flightCost,
          indicativeFlightPrice: quickData.indicativeFlightPrice,
          estimated_hotel_per_night: quickData.estimated_hotel_per_night,
          priceIsLive: quickData.priceIsLive,
          priceIsEstimate: quickData.priceIsEstimate,
          googleFlightsPrice: quickData.googleFlightsPrice,
          googleFlightsAirlines: quickData.googleFlightsAirlines,
          googleFlightsStops: quickData.googleFlightsStops,
          suggestedDepartureDate: quickData.suggestedDepartureDate,
          suggestedReturnDate: quickData.suggestedReturnDate,
          cachedBasicInfo: quickData.cachedBasicInfo,
          // Placeholder fields -- filled by Phase 2a (generic) and Phase 2b (personalized)
          whyThisPlace: '',
          why_its_perfect: '',
          itinerary: [],
          bestTimeToGo: '',
          localTip: '',
          insider_tip: '',
          best_local_food: [],
          day1: [],
          day2: [],
          day3: [],
          budgetBreakdown: {
            flights: flightCost,
            hotel: cappedHotelTotal,
            activities: 0,
            food: 0,
            total: params.budget,
          },
        }

        setState({ status: 'quick-ready', destination: partialDestination, detailsLoading: true, genericLoading: true, error: null })

        // Fire-and-forget conversion tracking
        trackConversion('mystery_revealed', {
          destination: quickData.destination,
          country: quickData.country,
          iata: quickData.city_code_IATA,
        })

        // Phase 2a: Generic cached data + Phase 2b: Personalized details — in parallel
        console.log('[MysteryContext] Phase 2a+2b: Fetching generic + personalized data in parallel for', quickData.destination)

        const genericPromise = fetchGenericData(
          { destination: quickData.destination, country: quickData.country, iata },
          abortController.signal,
        )

        const detailsPromise = fetchPersonalizedDetails(quickData, params, abortController.signal)

        // Handle generic data as it arrives (likely faster — cached)
        genericPromise
          .then((genericData) => {
            if (abortController.signal.aborted) return
            console.log('[MysteryContext] Phase 2a success: Generic data received')
            setState(prev => {
              if (!prev.destination) return prev
              return {
                ...prev,
                // Transition to generic-ready only if we're still waiting for details
                status: prev.detailsLoading && prev.status !== 'ready' ? 'generic-ready' : prev.status,
                genericLoading: false,
                destination: {
                  ...prev.destination,
                  ...genericData,
                  // Keep quick-pick values (more accurate)
                  destination: prev.destination.destination,
                  country: prev.destination.country,
                  iata: prev.destination.iata,
                  city_code_IATA: prev.destination.city_code_IATA,
                  estimated_flight_cost: prev.destination.estimated_flight_cost,
                  indicativeFlightPrice: prev.destination.indicativeFlightPrice,
                  estimated_hotel_per_night: prev.destination.estimated_hotel_per_night,
                  priceIsLive: prev.destination.priceIsLive,
                  priceIsEstimate: prev.destination.priceIsEstimate,
                  googleFlightsPrice: prev.destination.googleFlightsPrice,
                  googleFlightsAirlines: prev.destination.googleFlightsAirlines,
                  googleFlightsStops: prev.destination.googleFlightsStops,
                  suggestedDepartureDate: prev.destination.suggestedDepartureDate,
                  suggestedReturnDate: prev.destination.suggestedReturnDate,
                  cachedBasicInfo: prev.destination.cachedBasicInfo,
                },
              }
            })
          })
          .catch((err) => {
            if ((err as Error).name === 'AbortError') return
            console.warn('[MysteryContext] Phase 2a failed (non-fatal):', err.message)
            setState(prev => ({ ...prev, genericLoading: false }))
          })

        // Handle personalized details as they arrive
        detailsPromise
          .then((detailsData) => {
            if (abortController.signal.aborted) return
            console.log('[MysteryContext] Phase 2b success: Personalized details received')
            setState(prev => {
              if (!prev.destination) return prev
              return {
                ...prev,
                status: 'ready',
                detailsLoading: false,
                destination: {
                  ...prev.destination,
                  ...detailsData,
                  // Keep quick-pick values (more accurate)
                  destination: prev.destination.destination,
                  country: prev.destination.country,
                  iata: prev.destination.iata,
                  city_code_IATA: prev.destination.city_code_IATA,
                  estimated_flight_cost: prev.destination.estimated_flight_cost,
                  indicativeFlightPrice: prev.destination.indicativeFlightPrice,
                  estimated_hotel_per_night: prev.destination.estimated_hotel_per_night,
                  priceIsLive: prev.destination.priceIsLive,
                  priceIsEstimate: prev.destination.priceIsEstimate,
                  googleFlightsPrice: prev.destination.googleFlightsPrice,
                  googleFlightsAirlines: prev.destination.googleFlightsAirlines,
                  googleFlightsStops: prev.destination.googleFlightsStops,
                  suggestedDepartureDate: prev.destination.suggestedDepartureDate,
                  suggestedReturnDate: prev.destination.suggestedReturnDate,
                  cachedBasicInfo: prev.destination.cachedBasicInfo,
                  // Keep generic data if details didn't provide these fields
                  whyThisPlace: detailsData.whyThisPlace || prev.destination.whyThisPlace || '',
                  why_its_perfect: detailsData.why_its_perfect || prev.destination.why_its_perfect || '',
                  best_local_food: detailsData.best_local_food?.length > 0 ? detailsData.best_local_food : prev.destination.best_local_food || [],
                  insider_tip: detailsData.insider_tip || prev.destination.insider_tip || '',
                  localTip: detailsData.localTip || prev.destination.localTip || '',
                  bestTimeToGo: detailsData.bestTimeToGo || prev.destination.bestTimeToGo || '',
                  // Use details budget_breakdown when available, clear old format to prevent conflicts
                  budget_breakdown: detailsData.budget_breakdown || prev.destination.budget_breakdown,
                  budgetBreakdown: detailsData.budgetBreakdown || (detailsData.budget_breakdown ? undefined : prev.destination.budgetBreakdown),
                  genericData: prev.destination.genericData || detailsData.genericData,
                },
              }
            })
          })
          .catch((err) => {
            if ((err as Error).name === 'AbortError') return
            console.warn('[MysteryContext] Phase 2b error (non-fatal):', err)
            // Still show what we have (generic data if available)
            setState(prev => ({ ...prev, status: 'ready', detailsLoading: false }))
          })
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return

        // Phase 1 failed -- fall back to single API endpoint
        console.warn('[MysteryContext] Quick pick failed, falling back to full API:', err.message)
        fetch('/api/ai-mystery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
          body: JSON.stringify(requestBody),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
              throw new Error(errorData.error || `Failed to generate destination (HTTP ${response.status})`)
            }
            const data = await response.json()
            console.log('[MysteryContext] Fallback API success:', data.destination)

            if (data.error) throw new Error(data.error)
            if (!data.destination || !data.city_code_IATA) throw new Error('Invalid response from server.')

            setState({ status: 'ready', destination: data, detailsLoading: false, genericLoading: false, error: null })
          })
          .catch((fallbackErr) => {
            if ((fallbackErr as Error).name === 'AbortError') return
            const errorMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Something went wrong. Please try again.'
            console.error('[MysteryContext] Both APIs failed:', fallbackErr)
            setState({ status: 'error', destination: null, detailsLoading: false, genericLoading: false, error: errorMsg })
          })
      })
  }, [fetchGenericData, fetchPersonalizedDetails])

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  const startSearch = useCallback((params: SearchParams) => {
    // Reset reroll state for fresh searches (unless exclude list is provided)
    if (!params.exclude || params.exclude.length === 0) {
      setExcludeList([])
      excludeListRef.current = []
      setRerollCount(0)
    }
    executeSearch(params)
  }, [executeSearch])

  const dismiss = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState({ status: 'idle', destination: null, detailsLoading: false, genericLoading: false, error: null })
    setSearchParams(null)
    setExcludeList([])
    excludeListRef.current = []
    setRerollCount(0)
    setIsMinimized(false)
  }, [])

  const minimize = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const expand = useCallback(() => {
    setIsMinimized(false)
  }, [])

  const handleReroll = useCallback(() => {
    if (rerollCount >= MAX_REROLLS || !searchParams) return

    const currentIATA = state.destination?.city_code_IATA || state.destination?.iata
    let updated = [...excludeList]
    if (currentIATA) {
      updated = [...updated, currentIATA]
      setExcludeList(updated)
      excludeListRef.current = updated
    }
    setRerollCount(prev => prev + 1)

    executeSearch({
      ...searchParams,
      exclude: updated,
    })
  }, [rerollCount, searchParams, state.destination, excludeList, executeSearch])

  const handleShowAnother = useCallback(() => {
    if (!searchParams) return
    setExcludeList([])
    excludeListRef.current = []
    setRerollCount(0)
    executeSearch({ ...searchParams, exclude: undefined })
  }, [searchParams, executeSearch])

  return (
    <MysteryContext.Provider
      value={{
        state,
        startSearch,
        dismiss,
        minimize,
        expand,
        isMinimized,
        isVisible,
        searchParams,
        rerollCount,
        maxRerolls: MAX_REROLLS,
        handleReroll,
        handleShowAnother,
      }}
    >
      {children}
    </MysteryContext.Provider>
  )
}
