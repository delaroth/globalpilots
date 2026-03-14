// Fetches destination photos from Pexels API
// Graceful degradation: returns empty array if no API key or on failure

export interface DestinationPhoto {
  url: string
  photographer: string
  alt: string
}

/**
 * Fetch destination photos from Pexels API.
 * Returns top 3 landscape-oriented photos for the given city/country.
 * Returns empty array if PEXELS_API_KEY is not set or on any error.
 */
export async function fetchDestinationPhotos(
  cityName: string,
  country: string
): Promise<DestinationPhoto[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return []

  const query = encodeURIComponent(`${cityName} ${country} travel`)
  const url = `https://api.pexels.com/v1/search?query=${query}&per_page=6&orientation=landscape`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      signal: controller.signal,
    })

    if (!res.ok) return []

    const data = await res.json() as PexelsResponse

    if (!data.photos || data.photos.length === 0) return []

    return data.photos
      .slice(0, 3)
      .map((photo) => ({
        url: photo.src.large2x || photo.src.large || photo.src.original,
        photographer: photo.photographer,
        alt: photo.alt || `${cityName}, ${country} travel photo`,
      }))
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

// Pexels API response types (minimal)
interface PexelsPhoto {
  id: number
  photographer: string
  alt: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
  }
}

interface PexelsResponse {
  photos: PexelsPhoto[]
  total_results: number
}
