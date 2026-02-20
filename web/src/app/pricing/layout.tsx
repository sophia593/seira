import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'pricing',
  description:
    'Simple pricing for sponsorship teams. $190/mo with unlimited events, partners, and deliverables. No per-seat fees.',
  openGraph: {
    title: 'Pricing — Seira',
    description:
      'Simple pricing for every team. $190/mo, no per-seat fees.',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
