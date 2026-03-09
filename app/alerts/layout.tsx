import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Price Alerts | GlobePilot',
  description: 'Set price alerts for your favorite routes and get notified when flight prices drop below your target. Never miss a deal!',
}

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
