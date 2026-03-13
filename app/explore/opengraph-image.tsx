import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Layover Explorer — Turn connections into adventures'

export default function Image() {
  return generateOgImage({
    title: 'Layover Explorer',
    subtitle: 'Turn connections into adventures',
    accent: '#22c55e',
  })
}
