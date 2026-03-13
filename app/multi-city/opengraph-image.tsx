import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Multi-City Planner — AI-optimized multi-stop trips'

export default function Image() {
  return generateOgImage({
    title: 'Multi-City Planner',
    subtitle: 'AI-optimized multi-stop trips',
    accent: '#f59e0b',
  })
}
