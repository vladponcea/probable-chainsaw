import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Onboarding - Connect Your Tools',
  description: 'Connect your tools to generate your free ops dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

