import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Smart Flight Search — Find the cheapest days to fly'

export default function Image() {
  return generateOgImage({
    title: 'Smart Flight Search',
    subtitle: 'Find the cheapest days to fly',
    accent: '#3b82f6',
  })
}
