export interface RecentSearch {
  origin: string
  destination?: string
  date?: string
  mode: string
  label: string
  timestamp: number
  url: string
}

const STORAGE_KEY = 'globepilot_recent_searches'
const MAX_SEARCHES = 5

export function saveRecentSearch(search: Omit<RecentSearch, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentSearches()
    // Deduplicate by url
    const filtered = existing.filter(s => s.url !== search.url)
    const entry: RecentSearch = { ...search, timestamp: Date.now() }
    const updated = [entry, ...filtered].slice(0, MAX_SEARCHES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage might be full or unavailable
  }
}

export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
