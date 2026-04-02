import { verifyAccess } from 'flags'
import { NextRequest, NextResponse } from 'next/server'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get('authorization'))
  if (!access) return NextResponse.json(null, { status: 401 })

  const definitions: Record<string, { description: string; options: { value: boolean; label: string }[] }> = {
    priceInsights: {
      description: 'Show price level + typical range from Google Flights',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    carbonEmissions: {
      description: 'Show CO2 data on flight results',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    airlineLogos: {
      description: 'Show airline logos in search results',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    bookingComparison: {
      description: 'Compare booking prices across OTAs',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    googleHotels: {
      description: 'Real hotel prices via Google Hotels',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    priceTracker: {
      description: 'Daily price monitoring + email alerts',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    weekendGetaways: {
      description: 'Weekend trip finder page',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    trendingDestinations: {
      description: 'Homepage trending section',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
    regionalMystery: {
      description: 'Region-locked mystery vacation themes',
      options: [{ value: true, label: 'On' }, { value: false, label: 'Off' }],
    },
  }

  return NextResponse.json({ definitions })
}
