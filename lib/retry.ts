/**
 * Exponential backoff retry for critical async operations.
 *
 * Usage:
 *   const result = await withRetry(() => fetchFlightPrice(origin, dest), {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     onRetry: (err, attempt) => console.warn(`Retry ${attempt}:`, err.message),
 *   })
 */

export interface RetryOptions {
  /** Max number of attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in ms — doubled each retry (default: 1000) */
  baseDelay?: number
  /** Max delay cap in ms (default: 10000) */
  maxDelay?: number
  /** Called before each retry — useful for logging */
  onRetry?: (error: Error, attempt: number) => void
  /** AbortSignal to cancel retries */
  signal?: AbortSignal
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
    signal,
  } = options

  let lastError: Error = new Error('No attempts made')

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry abort errors
      if (lastError.name === 'AbortError') throw lastError

      // Last attempt — don't retry
      if (attempt === maxAttempts) break

      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      const jitter = delay * 0.2 * Math.random() // ±20% jitter
      const waitMs = Math.round(delay + jitter)

      onRetry?.(lastError, attempt)

      // Wait before retry (respects abort)
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, waitMs)
        signal?.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
    }
  }

  throw lastError
}
