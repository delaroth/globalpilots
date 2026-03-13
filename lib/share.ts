/**
 * Share a URL using the Web Share API with a clipboard fallback.
 * Returns true if shared/copied successfully.
 */
export async function shareUrl(
  url: string,
  title: string,
  text: string
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch (err: unknown) {
      // User cancelled or share failed — fall through to clipboard
      if (err instanceof Error && err.name === 'AbortError') return false
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    // Last-resort fallback for older browsers
    try {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Build share text for different trip/feature contexts.
 */
export function buildShareText(
  type: string,
  data: Record<string, unknown>
): { title: string; text: string } {
  switch (type) {
    case 'mystery': {
      const dest = (data.destination as string) || 'an unknown destination'
      const cost = data.totalCost ? `$${Math.round(data.totalCost as number)}` : ''
      return {
        title: `Mystery Vacation to ${dest}`,
        text: cost
          ? `Check out this AI-generated mystery trip to ${dest} for ${cost} on GlobePilot!`
          : `Check out this AI-generated mystery trip to ${dest} on GlobePilot!`,
      }
    }

    case 'search': {
      const origin = (data.origin as string) || ''
      const destination = (data.destination as string) || ''
      const price = data.price ? `$${Math.round(data.price as number)}` : ''
      return {
        title: `Flight Deal: ${origin} to ${destination}`,
        text: price
          ? `Found a flight from ${origin} to ${destination} for ${price} on GlobePilot!`
          : `Found a great flight from ${origin} to ${destination} on GlobePilot!`,
      }
    }

    case 'explore': {
      const hub = (data.hub as string) || 'a hub city'
      return {
        title: `Layover Explorer: ${hub}`,
        text: `Turn your layover in ${hub} into a bonus destination with GlobePilot!`,
      }
    }

    case 'discover': {
      const from = (data.origin as string) || ''
      return {
        title: 'Cheapest Destinations',
        text: from
          ? `Find the cheapest flights from ${from} on GlobePilot!`
          : 'Discover the cheapest destinations on GlobePilot!',
      }
    }

    case 'multi-city': {
      const cities = (data.cities as string[]) || []
      const cityText = cities.length > 0 ? cities.join(' → ') : 'multiple cities'
      return {
        title: `Multi-City Trip: ${cityText}`,
        text: `Check out this AI-optimized multi-city route: ${cityText} on GlobePilot!`,
      }
    }

    case 'trip-cost': {
      const place = (data.destination as string) || ''
      const budget = (data.dailyCost as number)
        ? `$${Math.round(data.dailyCost as number)}/day`
        : ''
      return {
        title: `Trip Cost: ${place}`,
        text: budget
          ? `${place} costs about ${budget}. Plan your budget on GlobePilot!`
          : `See how much it costs to travel to ${place} on GlobePilot!`,
      }
    }

    default:
      return {
        title: 'GlobePilot — Budget In. Adventure Out.',
        text: 'Smart travel tools for budget-minded adventurers. Check it out!',
      }
  }
}
