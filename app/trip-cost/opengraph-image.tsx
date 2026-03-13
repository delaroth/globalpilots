import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Trip Cost Calculator — Budget your entire trip'

export default function Image() {
  return generateOgImage({
    title: 'Trip Cost Calculator',
    subtitle: 'Budget your entire trip',
    accent: '#f59e0b',
  })
}
