import Link from 'next/link'
import { Instagram, Mail } from 'lucide-react'
import { Logo } from '@/components/logo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'how it works', href: '/how-it-works' },
      { label: 'pricing', href: '/pricing' },
      { label: 'sample recap', href: '/sample' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'about', href: '#' },
      { label: 'blog', href: '/blog' },
      { label: 'contact', href: 'mailto:support@seira.global' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'documentation', href: '#' },
      { label: 'changelog', href: '#' },
      { label: 'status', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'privacy', href: '/privacy' },
      { label: 'terms', href: '/terms' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'Email', href: 'mailto:support@seira.global', icon: Mail },
  { label: 'Instagram', href: 'https://instagram.com/seira.global', icon: Instagram, external: true },
]

export function MarketingFooter() {
  return (
    <footer className="bg-kurobeni text-white/60">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                        {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo color="brand" />
          <span className="text-xs text-white/30">
            © {new Date().getFullYear()} seira
          </span>
          <div className="flex items-center gap-1">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.external ? '_blank' : undefined}
                rel={social.external ? 'noopener noreferrer' : undefined}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-all"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
