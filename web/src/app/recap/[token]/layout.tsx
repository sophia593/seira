import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recap Report · Seira',
  description: 'Sponsorship recap report',
}

export default function RecapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
