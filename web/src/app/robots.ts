import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard',
        '/events',
        '/settings',
        '/partners',
        '/seasons',
        '/callback',
        '/auth-complete',
        '/invite/',
        '/subscribe',
        '/reset-password',
        '/forgot-password',
      ],
    },
    sitemap: 'https://seira.global/sitemap.xml',
  }
}
