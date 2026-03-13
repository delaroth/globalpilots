import { generateOgImage, ogSize, ogContentType } from '@/lib/og-image'

export const runtime = 'edge'
export const size = ogSize
export const contentType = ogContentType
export const alt = 'GlobePilot — Budget In. Adventure Out.'

export default function Image() {
  return generateOgImage({
    title: 'GlobePilot — Budget In. Adventure Out.',
    subtitle: 'Smart travel tools for budget-minded adventurers',
  })
}
