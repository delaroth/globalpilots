// Affiliate link generation utilities

const MARKER = '708764'
const CAMPAIGN_ID = '100'
const TRS = '505363'
const SUB_ID = 'GlobePilots'

export interface FlightParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
}

/**
 * Generate TravelPayouts affiliate link
 */
export function generateAffiliateLink(params: FlightParams): string {
  const { origin, destination, departDate, returnDate } = params

  // Format: ORIGINDDDESTRRR where DD is depart date, RRR is return date
  // Date format: DDMM (day + month)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return day + month
  }

  const departFormatted = formatDate(departDate)
  const returnFormatted = returnDate ? formatDate(returnDate) : ''

  const searchPath = `${origin}${departFormatted}${destination}${returnFormatted}`
  const aviasalesUrl = `https://aviasales.com/search/${searchPath}`

  const affiliateUrl = `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(aviasalesUrl)}`

  return affiliateUrl
}

/**
 * Generate affiliate link with custom URL
 */
export function generateCustomAffiliateLink(destinationUrl: string): string {
  return `https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=${SUB_ID}&trs=${TRS}&u=${encodeURIComponent(destinationUrl)}`
}
