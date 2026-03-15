'use client'

import { useState, useEffect, useCallback } from 'react'
import { SUPPORTED_CURRENCIES, type CurrencyInfo } from '@/lib/currency'

interface CurrencyState {
  code: string
  symbol: string
  rate: number | null  // USD → user currency rate
  rates: Record<string, number> | null // all rates
  loading: boolean
}

const STORAGE_KEY = 'gp_currency'

/**
 * React hook for multi-currency support.
 *
 * - Persists selected currency to localStorage
 * - Fetches rates from /api/currency (cached 1 hour server-side)
 * - Provides convert/format helpers
 */
export function useCurrency() {
  const [state, setState] = useState<CurrencyState>({
    code: 'USD',
    symbol: '$',
    rate: 1,
    rates: null,
    loading: true,
  })

  // Load saved currency preference + fetch rates
  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY) || 'USD'
      : 'USD'

    const info = SUPPORTED_CURRENCIES.find(c => c.code === saved) || SUPPORTED_CURRENCIES[0]
    setState(prev => ({ ...prev, code: info.code, symbol: info.symbol }))

    // Fetch rates
    fetch('/api/currency')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.rates) {
          const rate = data.rates[info.code] ?? 1
          setState(prev => ({ ...prev, rates: data.rates, rate, loading: false }))
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      })
      .catch(() => {
        setState(prev => ({ ...prev, loading: false }))
      })
  }, [])

  // Change currency
  const setCurrency = useCallback((code: string) => {
    const info = SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0]
    const rate = state.rates?.[code] ?? (code === 'USD' ? 1 : null)

    setState(prev => ({
      ...prev,
      code: info.code,
      symbol: info.symbol,
      rate,
    }))

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code)
    }
  }, [state.rates])

  // Convert USD amount to user's currency
  const fromUSD = useCallback((amountUSD: number): number => {
    if (!state.rate || state.code === 'USD') return amountUSD
    return Math.round(amountUSD * state.rate)
  }, [state.rate, state.code])

  // Convert user's currency to USD (for budget input)
  const toUSD = useCallback((amountLocal: number): number => {
    if (!state.rate || state.code === 'USD') return amountLocal
    if (state.rate === 0) return amountLocal
    return Math.round(amountLocal / state.rate)
  }, [state.rate, state.code])

  // Format a USD amount in user's currency
  const format = useCallback((amountUSD: number): string => {
    const converted = fromUSD(amountUSD)
    const noDecimal = ['JPY', 'KRW', 'VND', 'IDR', 'HUF', 'CZK']
    const formatted = noDecimal.includes(state.code)
      ? Math.round(converted).toLocaleString('en-US')
      : converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    return `${state.symbol}${formatted}`
  }, [fromUSD, state.symbol, state.code])

  // Format a local-currency amount (for budget display)
  const formatLocal = useCallback((amountLocal: number): string => {
    const noDecimal = ['JPY', 'KRW', 'VND', 'IDR', 'HUF', 'CZK']
    const formatted = noDecimal.includes(state.code)
      ? Math.round(amountLocal).toLocaleString('en-US')
      : amountLocal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    return `${state.symbol}${formatted}`
  }, [state.symbol, state.code])

  return {
    code: state.code,
    symbol: state.symbol,
    rate: state.rate,
    loading: state.loading,
    currencies: SUPPORTED_CURRENCIES,
    setCurrency,
    fromUSD,
    toUSD,
    format,       // format(500) → "€460" (converts USD→user currency)
    formatLocal,  // formatLocal(500) → "€500" (no conversion, just symbol)
    isUSD: state.code === 'USD',
  }
}
