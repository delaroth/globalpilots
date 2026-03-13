import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Cheapest Destinations — Where can you fly for less?'

export default function Image() {
  return generateOgImage({
    title: 'Cheapest Destinations',
    subtitle: 'Where can you fly for less?',
    accent: '#06b6d4',
  })
}
