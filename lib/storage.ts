// Local storage utilities for price alerts

export interface PriceAlert {
  id: string
  email: string
  origin: string
  destination: string
  targetPrice: number
  currentPrice: number | null
  createdAt: string
  isActive: boolean
}

const STORAGE_KEY = 'globepilot_price_alerts'

/**
 * Get all price alerts from local storage
 */
export function getPriceAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

/**
 * Save a new price alert
 */
export function savePriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): PriceAlert {
  const newAlert: PriceAlert = {
    ...alert,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }

  const alerts = getPriceAlerts()
  alerts.push(newAlert)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))

  return newAlert
}

/**
 * Delete a price alert
 */
export function deletePriceAlert(id: string): void {
  const alerts = getPriceAlerts()
  const filtered = alerts.filter(alert => alert.id !== id)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Update alert status
 */
export function updateAlertStatus(id: string, isActive: boolean): void {
  const alerts = getPriceAlerts()
  const updated = alerts.map(alert =>
    alert.id === id ? { ...alert, isActive } : alert
  )

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/**
 * Update current price for an alert
 */
export function updateAlertPrice(id: string, currentPrice: number): void {
  const alerts = getPriceAlerts()
  const updated = alerts.map(alert =>
    alert.id === id ? { ...alert, currentPrice } : alert
  )

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
