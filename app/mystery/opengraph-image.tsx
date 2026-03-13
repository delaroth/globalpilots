import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Mystery Vacation — Let AI surprise you'

export default function Image() {
  return generateOgImage({
    title: 'Mystery Vacation',
    subtitle: 'Let AI surprise you with the perfect destination',
    accent: '#a855f7',
  })
}
