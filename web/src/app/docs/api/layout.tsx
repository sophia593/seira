import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference — Seira',
  description:
    'REST API documentation for Seira. Programmatic access to events, partners, deliverables, and recaps.',
}

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
