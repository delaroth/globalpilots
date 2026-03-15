/**
 * Account lockout — in-memory rate limiter for failed login attempts.
 * Locks an account for 15 minutes after 5 consecutive failures.
 */

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

interface LockoutEntry {
  attempts: number
  lockedUntil: number | null
}

const lockoutMap = new Map<string, LockoutEntry>()

/**
 * Check whether a given email is currently locked out.
 */
export function checkLockout(email: string): { locked: boolean; remainingMs?: number } {
  const key = email.toLowerCase()
  const entry = lockoutMap.get(key)

  if (!entry || !entry.lockedUntil) {
    return { locked: false }
  }

  const now = Date.now()
  if (now >= entry.lockedUntil) {
    // Lockout has expired — reset
    lockoutMap.delete(key)
    return { locked: false }
  }

  return { locked: true, remainingMs: entry.lockedUntil - now }
}

/**
 * Record a failed login attempt. Locks the account after MAX_ATTEMPTS failures.
 */
export function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase()
  const entry = lockoutMap.get(key) || { attempts: 0, lockedUntil: null }

  entry.attempts += 1

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS
  }

  lockoutMap.set(key, entry)
}

/**
 * Clear lockout state on successful login.
 */
export function clearLockout(email: string): void {
  lockoutMap.delete(email.toLowerCase())
}
